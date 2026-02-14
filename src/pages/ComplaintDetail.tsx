import { useParams, Link } from 'react-router-dom';
import { useEffect, useState, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { StatusBadge, PriorityBadge } from '@/components/StatusBadge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, Calendar, MapPin, Phone, User, Wrench, CheckCircle2, XCircle, Clock, Download, ImagePlus, FileImage, Paperclip, X } from 'lucide-react';
import {
  getCurrentStageInfo,
  getStagesForFlow,
  getNextStatusAfterAction,
  canActOnStage,
  isCompleted,
  isRejected,
  type FlowType,
  type WorkflowAction,
  type StageInfo,
} from '@/lib/workflow';
import { cn } from '@/lib/utils';

interface RequestRow {
  id: string;
  created_at: string;
  store: string;
  department: string | null;
  category: string;
  sub_category: string | null;
  description: string;
  priority: string;
  status: string;
  reported_by_name: string;
  assigned_to: string | null;
  contact_number: string;
  expected_resolution: string | null;
  actual_resolution: string | null;
  remarks: string | null;
  closure_approval: boolean | null;
  flow_type: string | null;
  current_stage: number;
}

interface ActionRow {
  id: string;
  stage: number;
  action: string;
  actor_name: string | null;
  notes: string | null;
  created_at: string;
}

interface AttachmentRow {
  id: string;
  file_name: string;
  file_path: string;
  file_size: number | null;
  content_type: string | null;
  created_at: string;
}

export default function ComplaintDetail() {
  const { id } = useParams();
  const { user, role, profile } = useAuth();
  const { toast } = useToast();
  const [request, setRequest] = useState<RequestRow | null>(null);
  const [actions, setActions] = useState<ActionRow[]>([]);
  const [attachments, setAttachments] = useState<AttachmentRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionNotes, setActionNotes] = useState('');
  const [acting, setActing] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchData = async () => {
    const [reqRes, actRes, attRes] = await Promise.all([
      supabase.from('complaints').select('*').eq('id', id).single(),
      supabase.from('workflow_actions').select('*').eq('complaint_id', id).order('created_at', { ascending: true }),
      supabase.from('complaint_attachments').select('*').eq('complaint_id', id).order('created_at', { ascending: true }),
    ]);
    if (reqRes.data) setRequest(reqRes.data as RequestRow);
    if (actRes.data) setActions(actRes.data);
    if (attRes.data) setAttachments(attRes.data as AttachmentRow[]);
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, [id]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || !user || !request) return;
    setUploading(true);
    for (const file of Array.from(files)) {
      const filePath = `${user.id}/${request.id}/${Date.now()}-${file.name}`;
      const { error: uploadError } = await supabase.storage
        .from('complaint-attachments')
        .upload(filePath, file, { contentType: file.type });
      if (!uploadError) {
        await supabase.from('complaint_attachments').insert({
          complaint_id: request.id,
          file_name: file.name,
          file_path: filePath,
          file_size: file.size,
          content_type: file.type,
          uploaded_by: user.id,
        });
      }
    }
    if (fileInputRef.current) fileInputRef.current.value = '';
    setUploading(false);
    fetchData();
    toast({ title: 'Files uploaded successfully' });
  };

  const handleDownload = async (att: AttachmentRow) => {
    const { data } = await supabase.storage
      .from('complaint-attachments')
      .createSignedUrl(att.file_path, 300);
    if (data?.signedUrl) {
      window.open(data.signedUrl, '_blank');
    }
  };

  const handleAction = async (action: WorkflowAction) => {
    if (!request || !user || !role) return;
    setActing(true);

    const flowType = action === 'decide_internal' ? 'internal' :
      action === 'decide_external' ? 'external' :
      request.flow_type;

    const result = getNextStatusAfterAction(request.status, flowType, action);
    if (!result) {
      toast({ title: 'Error', description: 'Cannot determine next status.', variant: 'destructive' });
      setActing(false);
      return;
    }

    const updateData: Record<string, any> = {
      status: result.nextStatus,
      current_stage: result.nextStage,
    };

    if (action === 'decide_internal') updateData.flow_type = 'internal';
    if (action === 'decide_external') updateData.flow_type = 'external';

    const { error: updateError } = await supabase.from('complaints')
      .update(updateData)
      .eq('id', request.id);

    if (updateError) {
      toast({ title: 'Error', description: updateError.message, variant: 'destructive' });
      setActing(false);
      return;
    }

    await supabase.from('workflow_actions').insert({
      complaint_id: request.id,
      stage: request.current_stage,
      action,
      actor_id: user.id,
      actor_name: profile?.full_name || user.email,
      notes: actionNotes || null,
    });

    toast({ title: 'Action completed', description: `Request moved to ${result.nextStatus}` });
    setActionNotes('');
    fetchData();
    setActing(false);
  };

  if (loading) return <div className="py-20 text-center text-muted-foreground">Loading...</div>;

  if (!request) {
    return (
      <div className="flex flex-col items-center justify-center py-20 space-y-4">
        <p className="text-muted-foreground">Request not found.</p>
        <Link to="/requests"><Button variant="outline">Back to Requests</Button></Link>
      </div>
    );
  }

  const c = request;
  const currentStageInfo = getCurrentStageInfo(c.status, c.flow_type);
  const allStages = getStagesForFlow(c.flow_type as FlowType | null);
  const completed = isCompleted(c.status);
  const rejected = isRejected(c.status);
  const userCanAct = currentStageInfo ? canActOnStage(role, currentStageInfo) : false;

  return (
    <div className="space-y-6">
      <Link to="/requests" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
        <ArrowLeft className="w-4 h-4" /> Back to requests
      </Link>

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-3">
            <span className="font-mono text-accent">{c.id}</span>
          </h1>
          <p className="text-muted-foreground text-sm mt-1">{c.description}</p>
        </div>
        <div className="flex items-center gap-2">
          <PriorityBadge priority={c.priority as any} />
          <StatusBadge status={c.status} />
          {c.flow_type && (
            <span className={cn(
              'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold',
              c.flow_type === 'internal' ? 'bg-indigo-500/15 text-indigo-600' : 'bg-purple-500/15 text-purple-600'
            )}>
              {c.flow_type === 'internal' ? 'Internal' : 'External'}
            </span>
          )}
        </div>
      </div>

      {/* Workflow Progress */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">Workflow Progress — Stage {c.current_stage} of {allStages.length}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-1 overflow-x-auto pb-2">
            {allStages.map((stage, i) => {
              const isPast = c.current_stage > stage.stage || completed;
              const isCurrent = c.current_stage === stage.stage && !completed && !rejected;
              const isFuture = c.current_stage < stage.stage && !completed;
              return (
                <div key={`${stage.stage}-${i}`} className="flex items-center gap-1">
                  <div className={cn(
                    'flex items-center justify-center w-7 h-7 rounded-full text-xs font-bold shrink-0',
                    isPast ? 'bg-emerald-500 text-white' :
                    isCurrent ? 'bg-accent text-accent-foreground ring-2 ring-accent/30' :
                    'bg-muted text-muted-foreground'
                  )}>
                    {isPast ? <CheckCircle2 className="w-4 h-4" /> : stage.stage}
                  </div>
                  <span className={cn(
                    'text-[10px] whitespace-nowrap mr-2',
                    isCurrent ? 'font-semibold text-foreground' : 'text-muted-foreground'
                  )}>
                    {stage.label}
                  </span>
                  {i < allStages.length - 1 && (
                    <div className={cn('w-6 h-0.5 shrink-0', isPast ? 'bg-emerald-500' : 'bg-border')} />
                  )}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Action Panel */}
      {!completed && !rejected && currentStageInfo && userCanAct && currentStageInfo.actions.length > 0 && (
        <Card className="border-accent/30 bg-accent/5">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <Clock className="w-4 h-4 text-accent" />
              Action Required — {currentStageInfo.label}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-xs text-muted-foreground">
              Acting as: <span className="font-semibold">{currentStageInfo.actorLabel}</span>
            </p>
            <Textarea
              placeholder="Add notes (optional)..."
              value={actionNotes}
              onChange={e => setActionNotes(e.target.value)}
              rows={2}
            />
            <div className="flex gap-2 flex-wrap">
              {currentStageInfo.actions.map(({ action, label, variant }) => (
                <Button
                  key={action}
                  variant={variant}
                  disabled={acting}
                  onClick={() => handleAction(action)}
                >
                  {label}
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {rejected && (
        <Card className="border-red-500/30 bg-red-500/5">
          <CardContent className="py-4 flex items-center gap-3">
            <XCircle className="w-5 h-5 text-red-500" />
            <p className="text-sm font-medium text-red-600">This request has been rejected.</p>
          </CardContent>
        </Card>
      )}

      {completed && (
        <Card className="border-emerald-500/30 bg-emerald-500/5">
          <CardContent className="py-4 flex items-center gap-3">
            <CheckCircle2 className="w-5 h-5 text-emerald-500" />
            <p className="text-sm font-medium text-emerald-600">This request has been completed and acknowledged.</p>
          </CardContent>
        </Card>
      )}

      <div className="grid md:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-3"><CardTitle className="text-sm">Request Details</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <DetailRow icon={MapPin} label="Store" value={c.store} />
            <DetailRow icon={Wrench} label="Category" value={c.category} />
            {c.sub_category && <DetailRow label="Sub-Category" value={c.sub_category} />}
            <DetailRow label="Department" value={c.department || '—'} />
            <DetailRow icon={Calendar} label="Submitted" value={new Date(c.created_at).toLocaleString('en-IN')} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3"><CardTitle className="text-sm">People</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <DetailRow icon={User} label="Reported By" value={c.reported_by_name} />
            <DetailRow icon={Phone} label="Contact" value={c.contact_number} />
            <DetailRow icon={Wrench} label="Assigned To" value={c.assigned_to || 'Not yet assigned'} />
          </CardContent>
        </Card>
      </div>

      {c.remarks && (
        <Card>
          <CardHeader className="pb-3"><CardTitle className="text-sm">Remarks</CardTitle></CardHeader>
          <CardContent><p className="text-sm text-muted-foreground">{c.remarks}</p></CardContent>
        </Card>
      )}

      {/* Attachments */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm flex items-center gap-2">
              <Paperclip className="w-4 h-4" /> Attachments ({attachments.length})
            </CardTitle>
            <div>
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept="image/*,.pdf,.doc,.docx"
                onChange={handleFileUpload}
                className="hidden"
              />
              <Button
                variant="outline"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
              >
                <ImagePlus className="w-3 h-3 mr-1" />
                {uploading ? 'Uploading...' : 'Upload'}
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {attachments.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">No attachments yet</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {attachments.map(att => (
                <div key={att.id} className="flex items-center gap-3 p-3 rounded-lg border bg-muted/30">
                  <FileImage className="w-8 h-8 text-muted-foreground shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{att.file_name}</p>
                    <p className="text-xs text-muted-foreground">
                      {att.file_size ? `${(att.file_size / 1024).toFixed(1)} KB` : ''} · {new Date(att.created_at).toLocaleDateString('en-IN')}
                    </p>
                  </div>
                  <Button variant="ghost" size="icon" onClick={() => handleDownload(att)} title="Download">
                    <Download className="w-4 h-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {actions.length > 0 && (
        <Card>
          <CardHeader className="pb-3"><CardTitle className="text-sm">Workflow History</CardTitle></CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="text-left py-2 px-4 font-medium text-muted-foreground text-xs">Stage</th>
                    <th className="text-left py-2 px-4 font-medium text-muted-foreground text-xs">Action</th>
                    <th className="text-left py-2 px-4 font-medium text-muted-foreground text-xs">By</th>
                    <th className="text-left py-2 px-4 font-medium text-muted-foreground text-xs">Notes</th>
                    <th className="text-left py-2 px-4 font-medium text-muted-foreground text-xs">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {actions.map(a => (
                    <tr key={a.id} className="border-b last:border-0">
                      <td className="py-2 px-4 text-xs">{a.stage}</td>
                      <td className="py-2 px-4 text-xs capitalize font-medium">{a.action.replace(/_/g, ' ')}</td>
                      <td className="py-2 px-4 text-xs">{a.actor_name || '—'}</td>
                      <td className="py-2 px-4 text-xs text-muted-foreground max-w-[200px] truncate">{a.notes || '—'}</td>
                      <td className="py-2 px-4 text-xs text-muted-foreground whitespace-nowrap">{new Date(a.created_at).toLocaleString('en-IN')}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function DetailRow({ icon: Icon, label, value }: { icon?: React.ComponentType<{ className?: string }>; label: string; value: string }) {
  return (
    <div className="flex items-start gap-3">
      {Icon && <Icon className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />}
      {!Icon && <div className="w-4" />}
      <div>
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="text-sm font-medium">{value}</p>
      </div>
    </div>
  );
}
