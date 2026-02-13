import { ReactNode } from 'react';
import { useNavigate, useRouterState } from '@tanstack/react-router';
import { ShoppingCart, Package, Receipt, BarChart3, Settings, Store } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface AppShellProps {
  children: ReactNode;
}

export function AppShell({ children }: AppShellProps) {
  const navigate = useNavigate();
  const routerState = useRouterState();
  const currentPath = routerState.location.pathname;

  const navItems = [
    { path: '/pos', label: 'Kasir', icon: ShoppingCart },
    { path: '/products', label: 'Produk', icon: Package },
    { path: '/transactions', label: 'Transaksi', icon: Receipt },
    { path: '/reports', label: 'Laporan', icon: BarChart3 },
    { path: '/settings', label: 'Pengaturan', icon: Settings },
  ];

  return (
    <div className="flex h-screen bg-background">
      {/* Sidebar */}
      <aside className="w-64 border-r border-border bg-card flex flex-col">
        {/* Brand Header */}
        <div className="p-6 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-[oklch(0.70_0.15_40)] to-[oklch(0.65_0.18_30)] flex items-center justify-center">
              <Store className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-foreground">TOKO FADLI</h1>
              <p className="text-xs text-muted-foreground">Sistem Kasir</p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentPath === item.path || (item.path === '/pos' && currentPath === '/');
            return (
              <Button
                key={item.path}
                variant={isActive ? 'default' : 'ghost'}
                className={cn(
                  'w-full justify-start gap-3 h-12 text-base',
                  isActive && 'bg-gradient-to-r from-[oklch(0.70_0.15_40)] to-[oklch(0.65_0.18_30)] text-white hover:from-[oklch(0.68_0.15_40)] hover:to-[oklch(0.63_0.18_30)]'
                )}
                onClick={() => navigate({ to: item.path })}
              >
                <Icon className="w-5 h-5" />
                {item.label}
              </Button>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="p-4 border-t border-border text-xs text-muted-foreground text-center">
          <p>© {new Date().getFullYear()} TOKO FADLI</p>
          <p className="mt-1">
            Built with ❤️ using{' '}
            <a
              href={`https://caffeine.ai/?utm_source=Caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(window.location.hostname)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[oklch(0.65_0.18_30)] hover:underline"
            >
              caffeine.ai
            </a>
          </p>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        {children}
      </main>
    </div>
  );
}
