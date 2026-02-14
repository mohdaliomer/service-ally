import { useParams, Link } from 'react-router-dom';
import { mockComplaints } from '@/lib/mock-data';
import { StatusBadge, PriorityBadge } from '@/components/StatusBadge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Calendar, MapPin, Phone, User, Wrench } from 'lucide-react';

export default function ComplaintDetail() {
  const { id } = useParams();
  const complaint = mockComplaints.find(c => c.id === id);

  if (!complaint) {
    return (
      <div className="flex flex-col items-center justify-center py-20 space-y-4">
        <p className="text-muted-foreground">Complaint not found.</p>
        <Link to="/complaints"><Button variant="outline">Back to Complaints</Button></Link>
      </div>
    );
  }

  const c = complaint;

  return (
    <div className="space-y-6">
      <Link to="/complaints" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
        <ArrowLeft className="w-4 h-4" /> Back to complaints
      </Link>

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-3">
            <span className="font-mono text-accent">{c.id}</span>
          </h1>
          <p className="text-muted-foreground text-sm mt-1">{c.description}</p>
        </div>
        <div className="flex items-center gap-2">
          <PriorityBadge priority={c.priority} />
          <StatusBadge status={c.status} />
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Complaint Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <DetailRow icon={MapPin} label="Store" value={c.store} />
            <DetailRow icon={Wrench} label="Category" value={c.category} />
            {c.subCategory && <DetailRow label="Sub-Category" value={c.subCategory} />}
            <DetailRow label="Department" value={c.department} />
            <DetailRow icon={Calendar} label="Submitted" value={new Date(c.dateTime).toLocaleString('en-IN')} />
            {c.expectedResolution && (
              <DetailRow icon={Calendar} label="Expected Resolution" value={new Date(c.expectedResolution).toLocaleDateString('en-IN')} />
            )}
            {c.actualResolution && (
              <DetailRow icon={Calendar} label="Actual Resolution" value={new Date(c.actualResolution).toLocaleDateString('en-IN')} />
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">People</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <DetailRow icon={User} label="Reported By" value={c.reportedBy} />
            <DetailRow icon={Phone} label="Contact" value={c.contactNumber} />
            <DetailRow icon={Wrench} label="Assigned To" value={c.assignedTo || 'Not yet assigned'} />
          </CardContent>
        </Card>
      </div>

      {c.remarks && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Remarks</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">{c.remarks}</p>
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
