import { useMemo, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { StatusBadge, PriorityBadge } from '@/components/StatusBadge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  AlertTriangle, CheckCircle2, Clock, FileWarning, TrendingUp, ArrowRight, TimerOff, Building2, MapPinned,
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

interface StoreRow {
  name: string;
  region_id: string | null;
}

interface RegionRow {
  id: string;
  name: string;
}

function getStatusGroup(status: string): string {
  if (status === 'Submitted') return 'Submitted';
  if (status === 'Completed-Internal' || status === 'Completed-External') return 'Completed';
  if (status === 'Rejected') return 'Rejected';
  return 'In Progress';
}

const STATUS_GROUPS = ['Submitted', 'In Progress', 'Completed', 'Rejected'] as const;

function GroupedStatusTable({ complaints, groupBy }: { complaints: Complaint[]; groupBy: 'department' | 'region'; }) {
  // Group by the key
  const grouped = useMemo(() => {
    const map: Record<string, Record<string, number>> = {};
    complaints.forEach(c => {
      const key = groupBy === 'department' ? (c.department || 'Unassigned') : (c.store || 'Unknown');
      if (!map[key]) map[key] = {};
      const sg = getStatusGroup(c.status);
      map[key][sg] = (map[key][sg] || 0) + 1;
    });
    return Object.entries(map)
      .map(([name, counts]) => ({
        name,
        ...Object.fromEntries(STATUS_GROUPS.map(s => [s, counts[s] || 0])),
        total: Object.values(counts).reduce((a, b) => a + b, 0),
      }))
      .sort((a, b) => b.total - a.total);
  }, [complaints, groupBy]);

  if (grouped.length === 0) return <p className="text-sm text-muted-foreground text-center py-6">No data available</p>;

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b text-muted-foreground">
            <th className="text-left py-2 pr-4 font-medium">{groupBy === 'department' ? 'Department' : 'Store / Region'}</th>
            {STATUS_GROUPS.map(s => (
              <th key={s} className="text-center py-2 px-2 font-medium">{s}</th>
            ))}
            <th className="text-center py-2 pl-2 font-medium">Total</th>
          </tr>
        </thead>
        <tbody>
          {grouped.map(row => (
            <tr key={row.name} className="border-b last:border-0 hover:bg-muted/50 transition-colors">
              <td className="py-2.5 pr-4 text-xs font-medium">{row.name}</td>
              <td className="py-2.5 px-2 text-center"><span className="text-xs px-2 py-0.5 rounded-full bg-blue-500/15 text-blue-600 font-semibold">{(row as any)['Submitted']}</span></td>
              <td className="py-2.5 px-2 text-center"><span className="text-xs px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-600 font-semibold">{(row as any)['In Progress']}</span></td>
              <td className="py-2.5 px-2 text-center"><span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-600 font-semibold">{(row as any)['Completed']}</span></td>
              <td className="py-2.5 px-2 text-center"><span className="text-xs px-2 py-0.5 rounded-full bg-red-500/15 text-red-600 font-semibold">{(row as any)['Rejected']}</span></td>
              <td className="py-2.5 pl-2 text-center text-xs font-bold">{row.total}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function RegionGroupedTable({ complaints, stores, regions }: { complaints: Complaint[]; stores: StoreRow[]; regions: RegionRow[] }) {
  const regionMap = useMemo(() => {
    const storeToRegion: Record<string, string> = {};
    const regionNames: Record<string, string> = {};
    regions.forEach(r => { regionNames[r.id] = r.name; });
    stores.forEach(s => {
      if (s.region_id && regionNames[s.region_id]) {
        storeToRegion[s.name] = regionNames[s.region_id];
      }
    });
    return storeToRegion;
  }, [stores, regions]);

  const grouped = useMemo(() => {
    const map: Record<string, Record<string, number>> = {};
    complaints.forEach(c => {
      const region = regionMap[c.store] || 'Unassigned Region';
      if (!map[region]) map[region] = {};
      const sg = getStatusGroup(c.status);
      map[region][sg] = (map[region][sg] || 0) + 1;
    });
    return Object.entries(map)
      .map(([name, counts]) => ({
        name,
        ...Object.fromEntries(STATUS_GROUPS.map(s => [s, counts[s] || 0])),
        total: Object.values(counts).reduce((a, b) => a + b, 0),
      }))
      .sort((a, b) => b.total - a.total);
  }, [complaints, regionMap]);

  if (grouped.length === 0) return <p className="text-sm text-muted-foreground text-center py-6">No data available</p>;

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b text-muted-foreground">
            <th className="text-left py-2 pr-4 font-medium">Region</th>
            {STATUS_GROUPS.map(s => (
              <th key={s} className="text-center py-2 px-2 font-medium">{s}</th>
            ))}
            <th className="text-center py-2 pl-2 font-medium">Total</th>
          </tr>
        </thead>
        <tbody>
          {grouped.map(row => (
            <tr key={row.name} className="border-b last:border-0 hover:bg-muted/50 transition-colors">
              <td className="py-2.5 pr-4 text-xs font-medium">{row.name}</td>
              <td className="py-2.5 px-2 text-center"><span className="text-xs px-2 py-0.5 rounded-full bg-blue-500/15 text-blue-600 font-semibold">{(row as any)['Submitted']}</span></td>
              <td className="py-2.5 px-2 text-center"><span className="text-xs px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-600 font-semibold">{(row as any)['In Progress']}</span></td>
              <td className="py-2.5 px-2 text-center"><span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-600 font-semibold">{(row as any)['Completed']}</span></td>
              <td className="py-2.5 px-2 text-center"><span className="text-xs px-2 py-0.5 rounded-full bg-red-500/15 text-red-600 font-semibold">{(row as any)['Rejected']}</span></td>
              <td className="py-2.5 pl-2 text-center text-xs font-bold">{row.total}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function Dashboard() {
  const { isAdmin } = useAuth();
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [stores, setStores] = useState<StoreRow[]>([]);
  const [regions, setRegions] = useState<RegionRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAll = async () => {
      const [cRes, sRes, rRes] = await Promise.all([
        supabase.from('complaints').select('*').order('created_at', { ascending: false }),
        supabase.from('stores').select('name, region_id'),
        supabase.from('regions').select('id, name'),
      ]);
      if (cRes.data) setComplaints(cRes.data);
      if (sRes.data) setStores(sRes.data);
      if (rRes.data) setRegions(rRes.data);
      setLoading(false);
    };
    fetchAll();
  }, []);

  const stats = useMemo(() => {
    const total = complaints.length;
    const submitted = complaints.filter(c => c.status === 'Submitted').length;
    const inProgress = complaints.filter(c => !['Submitted', 'Completed-Internal', 'Completed-External', 'Rejected'].includes(c.status)).length;
    const completed = complaints.filter(c => c.status === 'Completed-Internal' || c.status === 'Completed-External').length;
    const critical = complaints.filter(c => c.priority === 'Critical').length;
    return { total, submitted, inProgress, completed, critical };
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
    return complaints.filter(c => !['Completed-Internal', 'Completed-External', 'Rejected'].includes(c.status) && new Date(c.created_at) <= sevenDaysAgo);
  }, [complaints]);

  const recentComplaints = complaints.slice(0, 5);

  if (loading) return <div className="py-20 text-center text-muted-foreground">Loading dashboard...</div>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground text-sm mt-1">Overview of maintenance requests{isAdmin ? ' across all locations' : ''}</p>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        {[
          { label: 'Total', value: stats.total, icon: TrendingUp, color: 'text-foreground' },
          { label: 'Submitted', value: stats.submitted, icon: FileWarning, color: 'text-status-open' },
          { label: 'In Progress', value: stats.inProgress, icon: Clock, color: 'text-status-in-progress' },
          { label: 'Completed', value: stats.completed, icon: CheckCircle2, color: 'text-status-closed' },
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

      {/* Department & Region Breakdown */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold">Task Status Breakdown</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="department">
            <TabsList className="mb-3">
              <TabsTrigger value="department" className="text-xs gap-1.5">
                <Building2 className="w-3.5 h-3.5" /> By Department
              </TabsTrigger>
              <TabsTrigger value="region" className="text-xs gap-1.5">
                <MapPinned className="w-3.5 h-3.5" /> By Region
              </TabsTrigger>
              <TabsTrigger value="user" className="text-xs gap-1.5">
                By Assigned User
              </TabsTrigger>
            </TabsList>
            <TabsContent value="department">
              <GroupedStatusTable complaints={complaints} groupBy="department" />
            </TabsContent>
            <TabsContent value="region">
              <RegionGroupedTable complaints={complaints} stores={stores} regions={regions} />
            </TabsContent>
            <TabsContent value="user">
              <UserGroupedTable complaints={complaints} />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

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
            <Link to="/requests" className="text-xs font-medium text-accent hover:underline flex items-center gap-1">View all <ArrowRight className="w-3 h-3" /></Link>
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
                        <td className="py-2.5 pr-4"><Link to={`/requests/${c.id}`} className="font-mono text-xs font-medium text-accent hover:underline">{c.id}</Link></td>
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
          <CardTitle className="text-sm font-semibold">Recent Requests</CardTitle>
          <Link to="/requests" className="text-xs font-medium text-accent hover:underline flex items-center gap-1">View all <ArrowRight className="w-3 h-3" /></Link>
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
                    <td className="py-2.5 pr-4"><Link to={`/requests/${c.id}`} className="font-mono text-xs font-medium text-accent hover:underline">{c.id}</Link></td>
                    <td className="py-2.5 pr-4 text-xs">{c.store}</td>
                    <td className="py-2.5 pr-4 text-xs">{c.category}</td>
                    <td className="py-2.5 pr-4"><PriorityBadge priority={c.priority as any} /></td>
                    <td className="py-2.5 pr-4"><StatusBadge status={c.status as any} /></td>
                    <td className="py-2.5 text-xs text-muted-foreground">{c.assigned_to || '—'}</td>
                  </tr>
                ))}
                {complaints.length === 0 && (
                  <tr><td colSpan={6} className="py-12 text-center text-muted-foreground">No requests yet. Create your first one!</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function UserGroupedTable({ complaints }: { complaints: Complaint[] }) {
  const grouped = useMemo(() => {
    const map: Record<string, Record<string, number>> = {};
    complaints.forEach(c => {
      const key = c.assigned_to || 'Unassigned';
      if (!map[key]) map[key] = {};
      const sg = getStatusGroup(c.status);
      map[key][sg] = (map[key][sg] || 0) + 1;
    });
    return Object.entries(map)
      .map(([name, counts]) => ({
        name,
        ...Object.fromEntries(STATUS_GROUPS.map(s => [s, counts[s] || 0])),
        total: Object.values(counts).reduce((a, b) => a + b, 0),
      }))
      .sort((a, b) => b.total - a.total);
  }, [complaints]);

  if (grouped.length === 0) return <p className="text-sm text-muted-foreground text-center py-6">No data available</p>;

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b text-muted-foreground">
            <th className="text-left py-2 pr-4 font-medium">Assigned To</th>
            {STATUS_GROUPS.map(s => (
              <th key={s} className="text-center py-2 px-2 font-medium">{s}</th>
            ))}
            <th className="text-center py-2 pl-2 font-medium">Total</th>
          </tr>
        </thead>
        <tbody>
          {grouped.map(row => (
            <tr key={row.name} className="border-b last:border-0 hover:bg-muted/50 transition-colors">
              <td className="py-2.5 pr-4 text-xs font-medium">{row.name}</td>
              <td className="py-2.5 px-2 text-center"><span className="text-xs px-2 py-0.5 rounded-full bg-blue-500/15 text-blue-600 font-semibold">{(row as any)['Submitted']}</span></td>
              <td className="py-2.5 px-2 text-center"><span className="text-xs px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-600 font-semibold">{(row as any)['In Progress']}</span></td>
              <td className="py-2.5 px-2 text-center"><span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-600 font-semibold">{(row as any)['Completed']}</span></td>
              <td className="py-2.5 px-2 text-center"><span className="text-xs px-2 py-0.5 rounded-full bg-red-500/15 text-red-600 font-semibold">{(row as any)['Rejected']}</span></td>
              <td className="py-2.5 pl-2 text-center text-xs font-bold">{row.total}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
