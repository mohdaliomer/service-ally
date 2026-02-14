import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Store, PlusCircle, Trash2, MapPin } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface StoreRow {
  id: string;
  name: string;
  code: string | null;
  city: string | null;
  email: string | null;
  active: boolean;
  region_id: string | null;
  created_at: string;
}

interface RegionRow {
  id: string;
  name: string;
}

export default function StoreManagement() {
  const { isAdmin } = useAuth();
  const { toast } = useToast();
  const [stores, setStores] = useState<StoreRow[]>([]);
  const [regions, setRegions] = useState<RegionRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({ name: '', code: '', city: '', email: '', region_id: '' });

  const fetchData = async () => {
    const [storesRes, regionsRes] = await Promise.all([
      supabase.from('stores').select('*').order('name'),
      supabase.from('regions').select('id, name').order('name'),
    ]);
    if (storesRes.data) setStores(storesRes.data as StoreRow[]);
    if (regionsRes.data) setRegions(regionsRes.data);
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) {
      toast({ title: 'Missing name', description: 'Store name is required.', variant: 'destructive' });
      return;
    }
    setCreating(true);
    const { error } = await supabase.from('stores').insert({
      name: form.name.trim(),
      code: form.code.trim() || null,
      city: form.city.trim() || null,
      email: form.email.trim() || null,
      region_id: form.region_id || null,
    });
    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Store added', description: `${form.name} has been created.` });
      setForm({ name: '', code: '', city: '', email: '', region_id: '' });
      fetchData();
    }
    setCreating(false);
  };

  const toggleActive = async (store: StoreRow) => {
    const { error } = await supabase.from('stores').update({ active: !store.active }).eq('id', store.id);
    if (!error) fetchData();
  };

  const deleteStore = async (store: StoreRow) => {
    const { error } = await supabase.from('stores').delete().eq('id', store.id);
    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Deleted', description: `${store.name} removed.` });
      fetchData();
    }
  };

  const getRegionName = (regionId: string | null) => {
    if (!regionId) return '—';
    return regions.find(r => r.id === regionId)?.name || '—';
  };

  if (!isAdmin) {
    return (
      <div className="flex items-center justify-center py-20">
        <p className="text-muted-foreground">Access denied. Admins only.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Store Management</h1>
        <p className="text-muted-foreground text-sm mt-1">Add and manage store locations</p>
      </div>

      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="text-sm flex items-center gap-2">
            <PlusCircle className="w-4 h-4" /> Add New Store
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleCreate} className="space-y-3">
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
              <div className="space-y-1">
                <Label className="text-xs">Store Name *</Label>
                <Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="e.g. Retail Store – Jaipur" />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Code</Label>
                <Input value={form.code} onChange={e => setForm(f => ({ ...f, code: e.target.value }))} placeholder="e.g. JAI01" />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">City</Label>
                <Input value={form.city} onChange={e => setForm(f => ({ ...f, city: e.target.value }))} placeholder="e.g. Jaipur" />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Email</Label>
                <Input type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} placeholder="e.g. store@example.com" />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Region</Label>
                <Select value={form.region_id} onValueChange={v => setForm(f => ({ ...f, region_id: v }))}>
                  <SelectTrigger><SelectValue placeholder="Select region" /></SelectTrigger>
                  <SelectContent>
                    {regions.map(r => <SelectItem key={r.id} value={r.id}>{r.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex justify-end">
              <Button type="submit" disabled={creating}>
                <PlusCircle className="w-4 h-4 mr-1" />
                {creating ? 'Adding...' : 'Add Store'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <Store className="w-4 h-4" /> All Stores ({stores.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="text-left py-3 px-4 font-medium text-muted-foreground text-xs">Name</th>
                  <th className="text-left py-3 px-4 font-medium text-muted-foreground text-xs">Code</th>
                  <th className="text-left py-3 px-4 font-medium text-muted-foreground text-xs">City</th>
                  <th className="text-left py-3 px-4 font-medium text-muted-foreground text-xs">Region</th>
                  <th className="text-left py-3 px-4 font-medium text-muted-foreground text-xs">Email</th>
                  <th className="text-left py-3 px-4 font-medium text-muted-foreground text-xs">Status</th>
                  <th className="text-left py-3 px-4 font-medium text-muted-foreground text-xs">Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={7} className="py-8 text-center text-muted-foreground">Loading...</td></tr>
                ) : stores.map(s => (
                  <tr key={s.id} className="border-b last:border-0 hover:bg-muted/30 transition-colors">
                    <td className="py-3 px-4 font-medium flex items-center gap-2">
                      <MapPin className="w-3.5 h-3.5 text-muted-foreground" />
                      {s.name}
                    </td>
                    <td className="py-3 px-4 text-xs text-muted-foreground">{s.code || '—'}</td>
                    <td className="py-3 px-4 text-xs">{s.city || '—'}</td>
                    <td className="py-3 px-4 text-xs">{getRegionName(s.region_id)}</td>
                    <td className="py-3 px-4 text-xs text-muted-foreground">{s.email || '—'}</td>
                    <td className="py-3 px-4">
                      <Badge
                        variant={s.active ? 'default' : 'secondary'}
                        className="text-xs cursor-pointer"
                        onClick={() => toggleActive(s)}
                      >
                        {s.active ? 'Active' : 'Inactive'}
                      </Badge>
                    </td>
                    <td className="py-3 px-4">
                      <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => deleteStore(s)}>
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
