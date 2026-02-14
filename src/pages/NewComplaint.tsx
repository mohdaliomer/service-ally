import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { CATEGORIES, PRIORITIES, DEPARTMENTS } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { ImagePlus, X, FileImage } from 'lucide-react';

export default function NewComplaint() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, profile } = useAuth();
  const [form, setForm] = useState({
    store: '',
    department: '',
    category: '',
    subCategory: '',
    description: '',
    priority: '',
    contactNumber: '',
    remarks: '',
  });
  const [attachments, setAttachments] = useState<{ file: File; preview: string }[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [storesList, setStoresList] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const userStore = profile?.store;
    if (userStore && userStore !== 'ALL') {
      // User has a specific store assigned - only show that store
      setStoresList([userStore]);
      set('store', userStore);
    } else {
      // Admin or user with "ALL" - show all active stores
      supabase.from('stores').select('name').eq('active', true).order('name').then(({ data }) => {
        if (data) setStoresList(data.map(s => s.name));
      });
    }
  }, [profile]);

  const set = (key: string, value: string) => setForm(prev => ({ ...prev, [key]: value }));

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    const newAttachments = Array.from(files).map(file => ({
      file,
      preview: file.type.startsWith('image/') ? URL.createObjectURL(file) : '',
    }));
    setAttachments(prev => [...prev, ...newAttachments].slice(0, 10));
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const removeAttachment = (index: number) => {
    setAttachments(prev => {
      const removed = prev[index];
      if (removed.preview) URL.revokeObjectURL(removed.preview);
      return prev.filter((_, i) => i !== index);
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.store || !form.category || !form.description || !form.priority || !form.contactNumber) {
      toast({ title: 'Missing fields', description: 'Please fill in all required fields.', variant: 'destructive' });
      return;
    }
    if (!user) return;

    setSubmitting(true);

    const { data: idData } = await supabase.rpc('generate_complaint_id');
    const complaintId = idData || `CMP-${Date.now()}`;

    const { error } = await supabase.from('complaints').insert({
      id: complaintId,
      store: form.store,
      department: form.department || null,
      category: form.category,
      sub_category: form.subCategory || null,
      description: form.description,
      priority: form.priority,
      contact_number: form.contactNumber,
      remarks: form.remarks || null,
      reported_by: user.id,
      reported_by_name: profile?.full_name || user.email || 'Unknown',
      status: 'Pending-Stage-2',
      current_stage: 2,
    });

    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
      setSubmitting(false);
      return;
    }

    // Log the submission action
    await supabase.from('workflow_actions').insert({
      complaint_id: complaintId,
      stage: 1,
      action: 'submit',
      actor_id: user.id,
      actor_name: profile?.full_name || user.email,
      notes: null,
    });

    // Send notification (fire and forget)
    supabase.functions.invoke('send-complaint-notification', {
      body: {
        complaint_id: complaintId,
        department: form.department,
        store: form.store,
        category: form.category,
        priority: form.priority,
        description: form.description,
        reported_by_name: profile?.full_name || user.email,
      },
    });

    toast({ title: 'Request submitted!', description: `${complaintId} has been registered and is pending Store Manager approval.` });
    navigate('/requests');
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold">New Maintenance Request</h1>
        <p className="text-muted-foreground text-sm mt-1">Submit a maintenance service request</p>
      </div>

      <form onSubmit={handleSubmit}>
        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="text-sm">Request Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Store / Location *</Label>
                <Select value={form.store} onValueChange={v => set('store', v)}>
                  <SelectTrigger><SelectValue placeholder="Select store" /></SelectTrigger>
                  <SelectContent>
                    {storesList.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Department</Label>
                <Select value={form.department} onValueChange={v => set('department', v)}>
                  <SelectTrigger><SelectValue placeholder="Select department" /></SelectTrigger>
                  <SelectContent>
                    {DEPARTMENTS.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Category *</Label>
                <Select value={form.category} onValueChange={v => set('category', v)}>
                  <SelectTrigger><SelectValue placeholder="Select category" /></SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Sub-Category <span className="text-muted-foreground text-xs">(optional)</span></Label>
                <Input value={form.subCategory} onChange={e => set('subCategory', e.target.value)} placeholder="e.g. Wiring, Switches..." />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Description *</Label>
              <Textarea value={form.description} onChange={e => set('description', e.target.value)} placeholder="Describe the issue in detail..." rows={4} />
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Priority *</Label>
                <Select value={form.priority} onValueChange={v => set('priority', v)}>
                  <SelectTrigger><SelectValue placeholder="Select priority" /></SelectTrigger>
                  <SelectContent>
                    {PRIORITIES.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Contact Number *</Label>
                <Input value={form.contactNumber} onChange={e => set('contactNumber', e.target.value)} placeholder="+91 98765 43210" />
              </div>
            </div>

            {/* Attachments */}
            <div className="space-y-2">
              <Label>Attachments <span className="text-muted-foreground text-xs">(photos/documents, max 10)</span></Label>
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept="image/*,.pdf,.doc,.docx"
                onChange={handleFileChange}
                className="hidden"
              />
              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-border rounded-lg p-6 text-center cursor-pointer hover:border-accent/50 hover:bg-muted/30 transition-colors"
              >
                <ImagePlus className="w-8 h-8 mx-auto text-muted-foreground mb-2" />
                <p className="text-sm text-muted-foreground">Click to upload photos or documents</p>
                <p className="text-xs text-muted-foreground mt-1">JPG, PNG, PDF, DOC up to 20MB each</p>
              </div>
              {attachments.length > 0 && (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-3">
                  {attachments.map((att, i) => (
                    <div key={i} className="relative group rounded-lg border border-border overflow-hidden bg-muted/30">
                      {att.preview ? (
                        <img src={att.preview} alt={att.file.name} className="w-full h-24 object-cover" />
                      ) : (
                        <div className="w-full h-24 flex items-center justify-center">
                          <FileImage className="w-8 h-8 text-muted-foreground" />
                        </div>
                      )}
                      <p className="text-[10px] text-muted-foreground truncate px-2 py-1">{att.file.name}</p>
                      <button
                        type="button"
                        onClick={() => removeAttachment(i)}
                        className="absolute top-1 right-1 w-5 h-5 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label>Additional Remarks <span className="text-muted-foreground text-xs">(optional)</span></Label>
              <Textarea value={form.remarks} onChange={e => set('remarks', e.target.value)} placeholder="Any additional notes..." rows={2} />
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <Button type="button" variant="outline" onClick={() => navigate('/requests')}>Cancel</Button>
              <Button type="submit" className="bg-accent text-accent-foreground hover:bg-accent/90" disabled={submitting}>
                {submitting ? 'Submitting...' : 'Submit Request'}
              </Button>
            </div>
          </CardContent>
        </Card>
      </form>
    </div>
  );
}
