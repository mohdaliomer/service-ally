import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { PlusCircle, Trash2, Layers, FolderTree, ToggleLeft, ToggleRight } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface DeptRow { id: string; name: string; active: boolean; created_at: string; }
interface CatRow { id: string; name: string; active: boolean; created_at: string; }

export default function DepartmentCategoryManagement() {
  const { isAdmin } = useAuth();
  const { toast } = useToast();

  const [departments, setDepartments] = useState<DeptRow[]>([]);
  const [categories, setCategories] = useState<CatRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [deptName, setDeptName] = useState('');
  const [catName, setCatName] = useState('');
  const [creatingDept, setCreatingDept] = useState(false);
  const [creatingCat, setCreatingCat] = useState(false);

  const fetchData = async () => {
    const [dRes, cRes] = await Promise.all([
      supabase.from('departments').select('*').order('name'),
      supabase.from('categories').select('*').order('name'),
    ]);
    if (dRes.data) setDepartments(dRes.data as DeptRow[]);
    if (cRes.data) setCategories(cRes.data as CatRow[]);
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  const addDepartment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!deptName.trim()) return;
    setCreatingDept(true);
    const { error } = await supabase.from('departments').insert({ name: deptName.trim() });
    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Department added', description: `${deptName.trim()} created.` });
      setDeptName('');
      fetchData();
    }
    setCreatingDept(false);
  };

  const addCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!catName.trim()) return;
    setCreatingCat(true);
    const { error } = await supabase.from('categories').insert({ name: catName.trim() });
    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Category added', description: `${catName.trim()} created.` });
      setCatName('');
      fetchData();
    }
    setCreatingCat(false);
  };

  const toggleDept = async (d: DeptRow) => {
    await supabase.from('departments').update({ active: !d.active }).eq('id', d.id);
    fetchData();
  };

  const toggleCat = async (c: CatRow) => {
    await supabase.from('categories').update({ active: !c.active }).eq('id', c.id);
    fetchData();
  };

  const deleteDept = async (d: DeptRow) => {
    const { error } = await supabase.from('departments').delete().eq('id', d.id);
    if (error) toast({ title: 'Error', description: error.message, variant: 'destructive' });
    else { toast({ title: 'Deleted', description: `${d.name} removed.` }); fetchData(); }
  };

  const deleteCat = async (c: CatRow) => {
    const { error } = await supabase.from('categories').delete().eq('id', c.id);
    if (error) toast({ title: 'Error', description: error.message, variant: 'destructive' });
    else { toast({ title: 'Deleted', description: `${c.name} removed.` }); fetchData(); }
  };

  if (!isAdmin) {
    return (
      <div className="flex items-center justify-center py-20">
        <p className="text-muted-foreground">Access denied. Admins only.</p>
      </div>
    );
  }

  const renderTable = (
    items: { id: string; name: string; active: boolean }[],
    onToggle: (item: any) => void,
    onDelete: (item: any) => void,
    icon: React.ReactNode,
    label: string,
  ) => (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex items-center gap-2">
          {icon} All {label} ({items.length})
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="text-left py-3 px-4 font-medium text-muted-foreground text-xs">Name</th>
                <th className="text-left py-3 px-4 font-medium text-muted-foreground text-xs">Status</th>
                <th className="text-left py-3 px-4 font-medium text-muted-foreground text-xs">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={3} className="py-8 text-center text-muted-foreground">Loading...</td></tr>
              ) : items.length === 0 ? (
                <tr><td colSpan={3} className="py-8 text-center text-muted-foreground">No {label.toLowerCase()} found.</td></tr>
              ) : items.map(item => (
                <tr key={item.id} className="border-b last:border-0 hover:bg-muted/30 transition-colors">
                  <td className="py-3 px-4 font-medium">{item.name}</td>
                  <td className="py-3 px-4">
                    <Badge
                      variant={item.active ? 'default' : 'secondary'}
                      className="text-xs cursor-pointer"
                      onClick={() => onToggle(item)}
                    >
                      {item.active ? 'Active' : 'Inactive'}
                    </Badge>
                  </td>
                  <td className="py-3 px-4">
                    <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => onDelete(item)}>
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
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Department & Category Management</h1>
        <p className="text-muted-foreground text-sm mt-1">Manage departments and service categories</p>
      </div>

      <Tabs defaultValue="departments">
        <TabsList>
          <TabsTrigger value="departments" className="gap-1.5"><Layers className="w-3.5 h-3.5" /> Departments</TabsTrigger>
          <TabsTrigger value="categories" className="gap-1.5"><FolderTree className="w-3.5 h-3.5" /> Categories</TabsTrigger>
        </TabsList>

        <TabsContent value="departments" className="space-y-4 mt-4">
          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="text-sm flex items-center gap-2">
                <PlusCircle className="w-4 h-4" /> Add Department
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={addDepartment} className="flex gap-3 items-end">
                <div className="flex-1 space-y-1">
                  <Label className="text-xs">Department Name *</Label>
                  <Input value={deptName} onChange={e => setDeptName(e.target.value)} placeholder="e.g. Maintenance" />
                </div>
                <Button type="submit" disabled={creatingDept}>
                  <PlusCircle className="w-4 h-4 mr-1" />
                  {creatingDept ? 'Adding...' : 'Add'}
                </Button>
              </form>
            </CardContent>
          </Card>
          {renderTable(departments, toggleDept, deleteDept, <Layers className="w-4 h-4" />, 'Departments')}
        </TabsContent>

        <TabsContent value="categories" className="space-y-4 mt-4">
          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="text-sm flex items-center gap-2">
                <PlusCircle className="w-4 h-4" /> Add Category
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={addCategory} className="flex gap-3 items-end">
                <div className="flex-1 space-y-1">
                  <Label className="text-xs">Category Name *</Label>
                  <Input value={catName} onChange={e => setCatName(e.target.value)} placeholder="e.g. Fire Safety" />
                </div>
                <Button type="submit" disabled={creatingCat}>
                  <PlusCircle className="w-4 h-4 mr-1" />
                  {creatingCat ? 'Adding...' : 'Add'}
                </Button>
              </form>
            </CardContent>
          </Card>
          {renderTable(categories, toggleCat, deleteCat, <FolderTree className="w-4 h-4" />, 'Categories')}
        </TabsContent>
      </Tabs>
    </div>
  );
}
