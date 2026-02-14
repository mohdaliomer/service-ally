import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { StatusBadge, PriorityBadge } from '@/components/StatusBadge';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { CATEGORIES, PRIORITIES } from '@/lib/types';
import { ALL_STATUSES } from '@/lib/workflow';
import { PlusCircle, Search } from 'lucide-react';

interface RequestRow {
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
  flow_type: string | null;
  current_stage: number;
}

export default function ComplaintsList() {
  const [requests, setRequests] = useState<RequestRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterPriority, setFilterPriority] = useState<string>('all');

  useEffect(() => {
    const fetch = async () => {
      const { data } = await supabase.from('complaints').select('*').order('created_at', { ascending: false });
      if (data) setRequests(data as RequestRow[]);
      setLoading(false);
    };
    fetch();
  }, []);

  const filtered = useMemo(() => {
    return requests.filter(c => {
      const matchSearch = search === '' ||
        c.id.toLowerCase().includes(search.toLowerCase()) ||
        c.description.toLowerCase().includes(search.toLowerCase()) ||
        c.store.toLowerCase().includes(search.toLowerCase()) ||
        c.reported_by_name.toLowerCase().includes(search.toLowerCase());
      const matchCat = filterCategory === 'all' || c.category === filterCategory;
      const matchStatus = filterStatus === 'all' || c.status === filterStatus;
      const matchPriority = filterPriority === 'all' || c.priority === filterPriority;
      return matchSearch && matchCat && matchStatus && matchPriority;
    });
  }, [requests, search, filterCategory, filterStatus, filterPriority]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Maintenance Requests</h1>
          <p className="text-muted-foreground text-sm mt-1">{loading ? 'Loading...' : `${filtered.length} requests found`}</p>
        </div>
        <Link to="/requests/new">
          <Button className="bg-accent text-accent-foreground hover:bg-accent/90">
            <PlusCircle className="w-4 h-4 mr-2" /> New Request
          </Button>
        </Link>
      </div>

      <Card>
        <CardContent className="pt-4 pb-4 flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input placeholder="Search by ID, description, store..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
          </div>
          <Select value={filterCategory} onValueChange={setFilterCategory}>
            <SelectTrigger className="w-full sm:w-40"><SelectValue placeholder="Category" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-full sm:w-48"><SelectValue placeholder="Status" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              {ALL_STATUSES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={filterPriority} onValueChange={setFilterPriority}>
            <SelectTrigger className="w-full sm:w-36"><SelectValue placeholder="Priority" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Priorities</SelectItem>
              {PRIORITIES.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="text-left py-3 px-4 font-medium text-muted-foreground text-xs">ID</th>
                  <th className="text-left py-3 px-4 font-medium text-muted-foreground text-xs">Date</th>
                  <th className="text-left py-3 px-4 font-medium text-muted-foreground text-xs">Store</th>
                  <th className="text-left py-3 px-4 font-medium text-muted-foreground text-xs">Category</th>
                  <th className="text-left py-3 px-4 font-medium text-muted-foreground text-xs">Description</th>
                  <th className="text-left py-3 px-4 font-medium text-muted-foreground text-xs">Priority</th>
                  <th className="text-left py-3 px-4 font-medium text-muted-foreground text-xs">Stage</th>
                  <th className="text-left py-3 px-4 font-medium text-muted-foreground text-xs">Status</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((c) => (
                  <tr key={c.id} className="border-b last:border-0 hover:bg-muted/30 transition-colors">
                    <td className="py-3 px-4"><Link to={`/requests/${c.id}`} className="font-mono text-xs font-medium text-accent hover:underline">{c.id}</Link></td>
                    <td className="py-3 px-4 text-xs text-muted-foreground whitespace-nowrap">{new Date(c.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}</td>
                    <td className="py-3 px-4 text-xs">{c.store}</td>
                    <td className="py-3 px-4 text-xs">{c.category}</td>
                    <td className="py-3 px-4 text-xs max-w-[200px] truncate">{c.description}</td>
                    <td className="py-3 px-4"><PriorityBadge priority={c.priority as any} /></td>
                    <td className="py-3 px-4 text-xs text-muted-foreground">{c.current_stage}</td>
                    <td className="py-3 px-4"><StatusBadge status={c.status} /></td>
                  </tr>
                ))}
                {!loading && filtered.length === 0 && (
                  <tr><td colSpan={8} className="py-12 text-center text-muted-foreground text-sm">No requests match your filters.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
