import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { MapPinned, PlusCircle, Trash2 } from 'lucide-react';

interface RegionRow {
  id: string;
  name: string;
  code: string | null;
  created_at: string;
}

export default function RegionManagement() {
  const { isAdmin } = useAuth();
  const { toast } = useToast();
  const [regions, setRegions] = useState<RegionRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({ name: '', code: '' });

  const fetchRegions = async () => {
    const { data } = await supabase.from('regions').select('*').order('name');
    if (data) setRegions(data);
    setLoading(false);
  };

  useEffect(() => { fetchRegions(); }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) {
      toast({ title: 'Missing name', description: 'Region name is required.', variant: 'destructive' });
      return;
    }
    setCreating(true);
    const { error } = await supabase.from('regions').insert({
      name: form.name.trim(),
      code: form.code.trim() || null,
    });
    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Region added', description: `${form.name} has been created.` });
      setForm({ name: '', code: '' });
      fetchRegions();
    }
    setCreating(false);
  };

  const deleteRegion = async (region: RegionRow) => {
    const { error } = await supabase.from('regions').delete().eq('id', region.id);
    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Deleted', description: `${region.name} removed.` });
      fetchRegions();
    }
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
        <h1 className="text-2xl font-bold">Region Management</h1>
        <p className="text-muted-foreground text-sm mt-1">Add and manage regions for store grouping</p>
      </div>

      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="text-sm flex items-center gap-2">
            <PlusCircle className="w-4 h-4" /> Add New Region
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleCreate} className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1 space-y-1">
              <Label className="text-xs">Region Name *</Label>
              <Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="e.g. North India" />
            </div>
            <div className="w-full sm:w-32 space-y-1">
              <Label className="text-xs">Code</Label>
              <Input value={form.code} onChange={e => setForm(f => ({ ...f, code: e.target.value }))} placeholder="e.g. NI" />
            </div>
            <div className="flex items-end">
              <Button type="submit" disabled={creating}>
                <PlusCircle className="w-4 h-4 mr-1" />
                {creating ? 'Adding...' : 'Add'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <MapPinned className="w-4 h-4" /> All Regions ({regions.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="text-left py-3 px-4 font-medium text-muted-foreground text-xs">Name</th>
                  <th className="text-left py-3 px-4 font-medium text-muted-foreground text-xs">Code</th>
                  <th className="text-left py-3 px-4 font-medium text-muted-foreground text-xs">Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={3} className="py-8 text-center text-muted-foreground">Loading...</td></tr>
                ) : regions.map(r => (
                  <tr key={r.id} className="border-b last:border-0 hover:bg-muted/30 transition-colors">
                    <td className="py-3 px-4 font-medium">{r.name}</td>
                    <td className="py-3 px-4 text-xs text-muted-foreground">{r.code || '—'}</td>
                    <td className="py-3 px-4">
                      <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => deleteRegion(r)}>
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
