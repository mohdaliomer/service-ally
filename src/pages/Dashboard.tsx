import { useMemo, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { StatusBadge, PriorityBadge } from '@/components/StatusBadge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  AlertTriangle, CheckCircle2, Clock, FileWarning, TrendingUp, ArrowRight, TimerOff,
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell,
} from 'recharts';

const PIE_COLORS = [
  'hsl(36, 95%, 52%)', 'hsl(217, 91%, 60%)', 'hsl(262, 83%, 58%)',
  'hsl(25, 95%, 53%)', 'hsl(171, 77%, 40%)', 'hsl(142, 71%, 45%)',
];

interface Complaint {
  id: string;
  created_at: string;
  store: string;
  department: string | null;
  category: string;
  description: string;
  priority: string;
  status: string;
  reported_by_name: string;
  assigned_to: string | null;
  contact_number: string;
}

export default function Dashboard() {
  const { isAdmin } = useAuth();
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      const { data } = await supabase.from('complaints').select('*').order('created_at', { ascending: false });
      if (data) setComplaints(data);
      setLoading(false);
    };
    fetch();
  }, []);

  const stats = useMemo(() => {
    const total = complaints.length;
    const open = complaints.filter(c => c.status === 'Open').length;
    const inProgress = complaints.filter(c => ['Assigned', 'In Progress'].includes(c.status)).length;
    const closed = complaints.filter(c => c.status === 'Closed').length;
    const critical = complaints.filter(c => c.priority === 'Critical').length;
    return { total, open, inProgress, closed, critical };
  }, [complaints]);

  const categoryData = useMemo(() => {
    const counts: Record<string, number> = {};
    complaints.forEach(c => { counts[c.category] = (counts[c.category] || 0) + 1; });
    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  }, [complaints]);

  const statusData = useMemo(() => {
    const counts: Record<string, number> = {};
    complaints.forEach(c => { counts[c.status] = (counts[c.status] || 0) + 1; });
    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  }, [complaints]);

  const overdue7Days = useMemo(() => {
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    return complaints.filter(c => c.status !== 'Closed' && new Date(c.created_at) <= sevenDaysAgo);
  }, [complaints]);

  const recentComplaints = complaints.slice(0, 5);

  if (loading) return <div className="py-20 text-center text-muted-foreground">Loading dashboard...</div>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground text-sm mt-1">Overview of maintenance complaints{isAdmin ? ' across all locations' : ''}</p>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        {[
          { label: 'Total', value: stats.total, icon: TrendingUp, color: 'text-foreground' },
          { label: 'Open', value: stats.open, icon: FileWarning, color: 'text-status-open' },
          { label: 'In Progress', value: stats.inProgress, icon: Clock, color: 'text-status-in-progress' },
          { label: 'Closed', value: stats.closed, icon: CheckCircle2, color: 'text-status-closed' },
          { label: 'Critical', value: stats.critical, icon: AlertTriangle, color: 'text-priority-critical' },
        ].map(({ label, value, icon: Icon, color }) => (
          <Card key={label}>
            <CardContent className="pt-5 pb-4 px-5">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{label}</span>
                <Icon className={`w-4 h-4 ${color}`} />
              </div>
              <p className={`text-3xl font-bold ${color}`}>{value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts */}
      <div className="grid md:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm font-semibold">By Category</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={categoryData} layout="vertical" margin={{ left: 0 }}>
                <XAxis type="number" hide />
                <YAxis type="category" dataKey="name" width={110} tick={{ fontSize: 11 }} />
                <Tooltip />
                <Bar dataKey="value" fill="hsl(36, 95%, 52%)" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm font-semibold">By Status</CardTitle></CardHeader>
          <CardContent className="flex items-center justify-center">
            <ResponsiveContainer width="100%" height={240}>
              <PieChart>
                <Pie data={statusData} cx="50%" cy="50%" innerRadius={55} outerRadius={90} dataKey="value" paddingAngle={3}>
                  {statusData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Pending 7+ Days */}
      {overdue7Days.length > 0 && (
        <Card className="border-priority-critical/30 bg-priority-critical/5">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <div className="flex items-center gap-2">
              <TimerOff className="w-4 h-4 text-priority-critical" />
              <CardTitle className="text-sm font-semibold text-priority-critical">Pending 7+ Days ({overdue7Days.length})</CardTitle>
            </div>
            <Link to="/complaints" className="text-xs font-medium text-accent hover:underline flex items-center gap-1">View all <ArrowRight className="w-3 h-3" /></Link>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-muted-foreground">
                    <th className="text-left py-2 pr-4 font-medium">ID</th>
                    <th className="text-left py-2 pr-4 font-medium">Store</th>
                    <th className="text-left py-2 pr-4 font-medium">Category</th>
                    <th className="text-left py-2 pr-4 font-medium">Days Pending</th>
                    <th className="text-left py-2 pr-4 font-medium">Priority</th>
                    <th className="text-left py-2 pr-4 font-medium">Status</th>
                    <th className="text-left py-2 font-medium">Assigned To</th>
                  </tr>
                </thead>
                <tbody>
                  {overdue7Days.map((c) => {
                    const days = Math.floor((Date.now() - new Date(c.created_at).getTime()) / (1000 * 60 * 60 * 24));
                    return (
                      <tr key={c.id} className="border-b last:border-0 hover:bg-muted/50 transition-colors">
                        <td className="py-2.5 pr-4"><Link to={`/complaints/${c.id}`} className="font-mono text-xs font-medium text-accent hover:underline">{c.id}</Link></td>
                        <td className="py-2.5 pr-4 text-xs">{c.store}</td>
                        <td className="py-2.5 pr-4 text-xs">{c.category}</td>
                        <td className="py-2.5 pr-4"><span className="text-xs font-bold text-priority-critical">{days} days</span></td>
                        <td className="py-2.5 pr-4"><PriorityBadge priority={c.priority as any} /></td>
                        <td className="py-2.5 pr-4"><StatusBadge status={c.status as any} /></td>
                        <td className="py-2.5 text-xs text-muted-foreground">{c.assigned_to || '—'}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recent Complaints */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-semibold">Recent Complaints</CardTitle>
          <Link to="/complaints" className="text-xs font-medium text-accent hover:underline flex items-center gap-1">View all <ArrowRight className="w-3 h-3" /></Link>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-muted-foreground">
                  <th className="text-left py-2 pr-4 font-medium">ID</th>
                  <th className="text-left py-2 pr-4 font-medium">Store</th>
                  <th className="text-left py-2 pr-4 font-medium">Category</th>
                  <th className="text-left py-2 pr-4 font-medium">Priority</th>
                  <th className="text-left py-2 pr-4 font-medium">Status</th>
                  <th className="text-left py-2 font-medium">Assigned To</th>
                </tr>
              </thead>
              <tbody>
                {recentComplaints.map((c) => (
                  <tr key={c.id} className="border-b last:border-0 hover:bg-muted/50 transition-colors">
                    <td className="py-2.5 pr-4"><Link to={`/complaints/${c.id}`} className="font-mono text-xs font-medium text-accent hover:underline">{c.id}</Link></td>
                    <td className="py-2.5 pr-4 text-xs">{c.store}</td>
                    <td className="py-2.5 pr-4 text-xs">{c.category}</td>
                    <td className="py-2.5 pr-4"><PriorityBadge priority={c.priority as any} /></td>
                    <td className="py-2.5 pr-4"><StatusBadge status={c.status as any} /></td>
                    <td className="py-2.5 text-xs text-muted-foreground">{c.assigned_to || '—'}</td>
                  </tr>
                ))}
                {complaints.length === 0 && (
                  <tr><td colSpan={6} className="py-12 text-center text-muted-foreground">No complaints yet. Create your first one!</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
