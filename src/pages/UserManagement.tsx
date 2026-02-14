import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DEPARTMENTS } from '@/lib/types';
import { ALL_ROLES, getRoleBadgeLabel } from '@/lib/workflow';
import { useToast } from '@/hooks/use-toast';
import { UserPlus, Users, Shield, User, Pencil, Trash2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogCancel, AlertDialogAction } from '@/components/ui/alert-dialog';

interface UserWithRole {
  id: string;
  email: string;
  full_name: string;
  department: string | null;
  store: string | null;
  role: string | null;
  created_at: string;
}

export default function UserManagement() {
  const { isAdmin, user: currentUser } = useAuth();
  const { toast } = useToast();
  const [users, setUsers] = useState<UserWithRole[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({
    email: '',
    password: '',
    fullName: '',
    department: '',
    store: '',
    role: 'local_user' as string,
  });
  const [storesList, setStoresList] = useState<string[]>([]);

  // Edit state
  const [editUser, setEditUser] = useState<UserWithRole | null>(null);
  const [editForm, setEditForm] = useState({ role: '', department: '', store: '' });
  const [saving, setSaving] = useState(false);

  // Delete state
  const [deleteUser, setDeleteUser] = useState<UserWithRole | null>(null);
  const [deleting, setDeleting] = useState(false);

  const fetchStores = async () => {
    const { data } = await supabase.from('stores').select('name').eq('active', true).order('name');
    if (data) setStoresList(data.map(s => s.name));
  };

  const fetchUsers = async () => {
    const { data: profiles } = await supabase.from('profiles').select('*');
    const { data: roles } = await supabase.from('user_roles').select('*');
    if (profiles) {
      const merged = profiles.map(p => ({
        id: p.id,
        email: p.email,
        full_name: p.full_name,
        department: p.department,
        store: p.store,
        role: roles?.find(r => r.user_id === p.id)?.role || null,
        created_at: p.created_at,
      }));
      setUsers(merged);
    }
    setLoading(false);
  };

  useEffect(() => { fetchUsers(); fetchStores(); }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.email || !form.password || !form.fullName) {
      toast({ title: 'Missing fields', description: 'Email, password and name are required.', variant: 'destructive' });
      return;
    }
    setCreating(true);
    const { data, error } = await supabase.functions.invoke('create-user', {
      body: { email: form.email, password: form.password, full_name: form.fullName, department: form.department || null, store: form.store || null, role: form.role },
    });
    if (error || data?.error) {
      toast({ title: 'Error', description: data?.error || error?.message || 'Failed to create user', variant: 'destructive' });
    } else {
      toast({ title: 'User created', description: `${form.fullName} has been added as ${getRoleBadgeLabel(form.role)}` });
      setForm({ email: '', password: '', fullName: '', department: '', store: '', role: 'local_user' });
      fetchUsers();
    }
    setCreating(false);
  };

  const openEdit = (u: UserWithRole) => {
    setEditUser(u);
    setEditForm({ role: u.role || 'local_user', department: u.department || '', store: u.store || '' });
  };

  const handleUpdate = async () => {
    if (!editUser) return;
    setSaving(true);
    const { data, error } = await supabase.functions.invoke('manage-user', {
      body: { action: 'update', user_id: editUser.id, role: editForm.role, department: editForm.department || null, store: editForm.store || null },
    });
    if (error || data?.error) {
      toast({ title: 'Error', description: data?.error || error?.message || 'Failed to update user', variant: 'destructive' });
    } else {
      toast({ title: 'User updated', description: `${editUser.full_name} has been updated.` });
      setEditUser(null);
      fetchUsers();
    }
    setSaving(false);
  };

  const handleDelete = async () => {
    if (!deleteUser) return;
    setDeleting(true);
    const { data, error } = await supabase.functions.invoke('manage-user', {
      body: { action: 'delete', user_id: deleteUser.id },
    });
    if (error || data?.error) {
      toast({ title: 'Error', description: data?.error || error?.message || 'Failed to delete user', variant: 'destructive' });
    } else {
      toast({ title: 'User deleted', description: `${deleteUser.full_name} has been removed.` });
      setDeleteUser(null);
      fetchUsers();
    }
    setDeleting(false);
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
        <h1 className="text-2xl font-bold">User Management</h1>
        <p className="text-muted-foreground text-sm mt-1">Create and manage system users</p>
      </div>

      {/* Create User Form */}
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="text-sm flex items-center gap-2">
            <UserPlus className="w-4 h-4" /> Create New User
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleCreate} className="space-y-4">
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Full Name *</Label>
                <Input value={form.fullName} onChange={e => setForm(f => ({ ...f, fullName: e.target.value }))} placeholder="John Doe" />
              </div>
              <div className="space-y-2">
                <Label>Email *</Label>
                <Input type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} placeholder="user@company.com" />
              </div>
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Password *</Label>
                <Input type="password" value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} placeholder="Min 6 characters" />
              </div>
              <div className="space-y-2">
                <Label>Role *</Label>
                <Select value={form.role} onValueChange={v => setForm(f => ({ ...f, role: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {ALL_ROLES.map(r => (
                      <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Store</Label>
                <Select value={form.store} onValueChange={v => setForm(f => ({ ...f, store: v }))}>
                  <SelectTrigger><SelectValue placeholder="Select store" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">ALL</SelectItem>
                    {storesList.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Department</Label>
                <Select value={form.department} onValueChange={v => setForm(f => ({ ...f, department: v }))}>
                  <SelectTrigger><SelectValue placeholder="Select department" /></SelectTrigger>
                  <SelectContent>
                    {DEPARTMENTS.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex justify-end">
              <Button type="submit" disabled={creating}>
                <UserPlus className="w-4 h-4 mr-2" />
                {creating ? 'Creating...' : 'Create User'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* User List */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <Users className="w-4 h-4" /> All Users ({users.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="text-left py-3 px-4 font-medium text-muted-foreground text-xs">Name</th>
                  <th className="text-left py-3 px-4 font-medium text-muted-foreground text-xs">Email</th>
                  <th className="text-left py-3 px-4 font-medium text-muted-foreground text-xs">Role</th>
                  <th className="text-left py-3 px-4 font-medium text-muted-foreground text-xs">Store</th>
                  <th className="text-left py-3 px-4 font-medium text-muted-foreground text-xs">Department</th>
                  <th className="text-left py-3 px-4 font-medium text-muted-foreground text-xs">Created</th>
                  <th className="text-right py-3 px-4 font-medium text-muted-foreground text-xs">Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={7} className="py-8 text-center text-muted-foreground">Loading...</td></tr>
                ) : users.map(u => (
                  <tr key={u.id} className="border-b last:border-0 hover:bg-muted/30 transition-colors">
                    <td className="py-3 px-4 text-sm font-medium">{u.full_name}</td>
                    <td className="py-3 px-4 text-xs text-muted-foreground">{u.email}</td>
                    <td className="py-3 px-4">
                      <Badge variant={u.role === 'admin' ? 'default' : 'secondary'} className="text-xs">
                        {u.role === 'admin' ? <><Shield className="w-3 h-3 mr-1" /> Admin</> : <><User className="w-3 h-3 mr-1" /> {getRoleBadgeLabel(u.role || 'local_user')}</>}
                      </Badge>
                    </td>
                    <td className="py-3 px-4 text-xs">{u.store || '—'}</td>
                    <td className="py-3 px-4 text-xs">{u.department || '—'}</td>
                    <td className="py-3 px-4 text-xs text-muted-foreground">
                      {new Date(u.created_at).toLocaleDateString('en-IN')}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEdit(u)}>
                          <Pencil className="w-3.5 h-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-destructive hover:text-destructive"
                          onClick={() => setDeleteUser(u)}
                          disabled={u.id === currentUser?.id}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={!!editUser} onOpenChange={open => !open && setEditUser(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit User</DialogTitle>
            <DialogDescription>Update role, store, and department for {editUser?.full_name}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Role</Label>
              <Select value={editForm.role} onValueChange={v => setEditForm(f => ({ ...f, role: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {ALL_ROLES.map(r => <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Store</Label>
              <Select value={editForm.store} onValueChange={v => setEditForm(f => ({ ...f, store: v }))}>
                <SelectTrigger><SelectValue placeholder="Select store" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">ALL</SelectItem>
                  {storesList.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Department</Label>
              <Select value={editForm.department} onValueChange={v => setEditForm(f => ({ ...f, department: v }))}>
                <SelectTrigger><SelectValue placeholder="Select department" /></SelectTrigger>
                <SelectContent>
                  {DEPARTMENTS.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditUser(null)}>Cancel</Button>
            <Button onClick={handleUpdate} disabled={saving}>{saving ? 'Saving...' : 'Save Changes'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteUser} onOpenChange={open => !open && setDeleteUser(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete User</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete <strong>{deleteUser?.full_name}</strong> ({deleteUser?.email})? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} disabled={deleting} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              {deleting ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
