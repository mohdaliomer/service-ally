import { Link, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  ListTodo,
  PlusCircle,
  Wrench,
  Users,
  LogOut,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { pathname } = useLocation();
  const { profile, isAdmin, signOut } = useAuth();

  const navItems = [
    { to: '/', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/complaints', label: 'Complaints', icon: ListTodo },
    { to: '/complaints/new', label: 'New Complaint', icon: PlusCircle },
    ...(isAdmin ? [{ to: '/users', label: 'Users', icon: Users }] : []),
  ];

  return (
    <div className="flex min-h-screen">
      {/* Sidebar */}
      <aside className="hidden md:flex w-64 flex-col bg-sidebar border-r border-sidebar-border">
        <div className="flex items-center gap-2.5 px-6 py-5 border-b border-sidebar-border">
          <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-sidebar-primary">
            <Wrench className="w-5 h-5 text-sidebar-primary-foreground" />
          </div>
          <div>
            <h1 className="text-sm font-bold text-sidebar-foreground leading-tight">MaintainX</h1>
            <p className="text-[11px] text-sidebar-muted leading-tight">Complaint Register</p>
          </div>
        </div>
        <nav className="flex-1 px-3 py-4 space-y-1">
          {navItems.map(({ to, label, icon: Icon }) => {
            const exactActive = pathname === to;
            return (
              <Link
                key={to}
                to={to}
                className={cn(
                  'flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-colors',
                  exactActive
                    ? 'bg-sidebar-accent text-sidebar-primary'
                    : 'text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-foreground'
                )}
              >
                <Icon className="w-4 h-4" />
                {label}
              </Link>
            );
          })}
        </nav>
        <div className="px-4 py-4 border-t border-sidebar-border space-y-3">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-sidebar-accent flex items-center justify-center text-xs font-bold text-sidebar-foreground">
              {profile?.full_name?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() || 'U'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-sidebar-foreground truncate">{profile?.full_name || 'User'}</p>
              <p className="text-[11px] text-sidebar-muted truncate">{profile?.email}</p>
            </div>
          </div>
          <Button variant="ghost" size="sm" className="w-full text-sidebar-muted hover:text-sidebar-foreground" onClick={signOut}>
            <LogOut className="w-3 h-3 mr-2" /> Sign Out
          </Button>
        </div>
      </aside>

      {/* Mobile Header */}
      <div className="flex flex-col flex-1">
        <header className="md:hidden flex items-center justify-between px-4 py-3 bg-sidebar border-b border-sidebar-border">
          <div className="flex items-center gap-2">
            <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-sidebar-primary">
              <Wrench className="w-4 h-4 text-sidebar-primary-foreground" />
            </div>
            <span className="text-sm font-bold text-sidebar-foreground">MaintainX</span>
          </div>
          <nav className="flex items-center gap-1">
            {navItems.map(({ to, icon: Icon }) => {
              const exactActive = pathname === to;
              return (
                <Link
                  key={to}
                  to={to}
                  className={cn(
                    'p-2 rounded-md transition-colors',
                    exactActive ? 'bg-sidebar-accent text-sidebar-primary' : 'text-sidebar-foreground'
                  )}
                >
                  <Icon className="w-4 h-4" />
                </Link>
              );
            })}
            <button onClick={signOut} className="p-2 rounded-md text-sidebar-foreground">
              <LogOut className="w-4 h-4" />
            </button>
          </nav>
        </header>

        <main className="flex-1 overflow-auto">
          <div className="p-4 md:p-8 max-w-7xl mx-auto animate-fade-in">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
