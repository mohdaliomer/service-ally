import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { CATEGORIES, PRIORITIES, STORES, DEPARTMENTS } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';

export default function NewComplaint() {
  const navigate = useNavigate();
  const { toast } = useToast();
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

  const set = (key: string, value: string) => setForm(prev => ({ ...prev, [key]: value }));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.store || !form.category || !form.description || !form.priority || !form.contactNumber) {
      toast({ title: 'Missing fields', description: 'Please fill in all required fields.', variant: 'destructive' });
      return;
    }
    toast({ title: 'Complaint submitted!', description: 'Your complaint has been registered successfully.' });
    navigate('/complaints');
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold">New Complaint</h1>
        <p className="text-muted-foreground text-sm mt-1">Submit a maintenance service complaint</p>
      </div>

      <form onSubmit={handleSubmit}>
        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="text-sm">Complaint Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Store / Location *</Label>
                <Select value={form.store} onValueChange={v => set('store', v)}>
                  <SelectTrigger><SelectValue placeholder="Select store" /></SelectTrigger>
                  <SelectContent>
                    {STORES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
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

            <div className="space-y-2">
              <Label>Additional Remarks <span className="text-muted-foreground text-xs">(optional)</span></Label>
              <Textarea value={form.remarks} onChange={e => set('remarks', e.target.value)} placeholder="Any additional notes..." rows={2} />
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <Button type="button" variant="outline" onClick={() => navigate('/complaints')}>Cancel</Button>
              <Button type="submit" className="bg-accent text-accent-foreground hover:bg-accent/90">Submit Complaint</Button>
            </div>
          </CardContent>
        </Card>
      </form>
    </div>
  );
}
