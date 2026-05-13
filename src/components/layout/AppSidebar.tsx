import { ChevronLeft, History, Home, LayoutDashboard, Moon, Settings, Sun } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useTheme } from '@/hooks/useTheme'
import { cn } from '@/lib/utils'
import type { ViewType } from './AppLayout'

interface NavItem {
  id: ViewType
  label: string
  icon: LucideIcon
}

const NAV_ITEMS: NavItem[] = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'history', label: 'Histórico', icon: History },
  { id: 'settings', label: 'Configurações', icon: Settings },
]

interface AppSidebarProps {
  activeView: ViewType
  onNavigate: (view: ViewType) => void
  collapsed: boolean
  onToggleCollapse: () => void
  onExitApp: () => void
}

export function AppSidebar({
  activeView,
  onNavigate,
  collapsed,
  onToggleCollapse,
  onExitApp,
}: AppSidebarProps) {
  const { theme, toggleTheme } = useTheme()

  function handleThemeToggle() {
    toggleTheme()
  }

  return (
    <aside
      className={cn(
        'relative flex h-screen flex-col overflow-hidden border-r border-sidebar-border bg-sidebar text-sidebar-foreground transition-[width] duration-200 ease-in-out',
        collapsed ? 'w-14' : 'w-56',
      )}
    >
      {/* Logo */}
      <div
        className={cn(
          'flex shrink-0 items-center border-b border-sidebar-border px-3 py-[18px]',
          collapsed ? 'justify-center' : 'gap-2.5',
        )}
      >
        <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary">
          <span className="font-sans text-sm font-black text-primary-foreground">F</span>
        </div>
        {!collapsed && (
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold tracking-tight">Fipe Fácil</p>
            <p className="mt-0.5 truncate text-[10px] leading-none text-sidebar-foreground/50">
              Consulta FIPE
            </p>
          </div>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 space-y-0.5 p-2">
        {/* Back to search */}
        <Button
          variant="ghost"
          onClick={onExitApp}
          title={collapsed ? 'Busca FIPE' : undefined}
          className={cn(
            'mb-1 h-9 w-full font-normal text-sidebar-foreground/60 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground',
            collapsed ? 'justify-center px-0' : 'justify-start gap-2.5 px-2.5',
          )}
        >
          <Home className="size-4 shrink-0" />
          {!collapsed && <span className="text-sm">Busca FIPE</span>}
        </Button>

        <div className="mb-1 border-t border-sidebar-border" />

        {NAV_ITEMS.map(({ id, label, icon: Icon }) => {
          const isActive = activeView === id
          function handleNav() {
            onNavigate(id)
          }
          return (
            <Button
              key={id}
              variant="ghost"
              onClick={handleNav}
              title={collapsed ? label : undefined}
              aria-current={isActive ? 'page' : undefined}
              className={cn(
                'h-9 w-full font-normal transition-colors',
                collapsed ? 'justify-center px-0' : 'justify-start gap-2.5 px-2.5',
                isActive
                  ? 'bg-sidebar-primary text-sidebar-primary-foreground hover:bg-sidebar-primary/90 hover:text-sidebar-primary-foreground'
                  : 'text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground',
              )}
            >
              <Icon className="size-4 shrink-0" />
              {!collapsed && <span className="text-sm">{label}</span>}
            </Button>
          )
        })}
      </nav>

      {/* Bottom */}
      <div className="shrink-0 space-y-0.5 border-t border-sidebar-border p-2">
        <Button
          variant="ghost"
          onClick={handleThemeToggle}
          title={theme === 'light' ? 'Modo escuro' : 'Modo claro'}
          aria-label={theme === 'light' ? 'Ativar modo escuro' : 'Ativar modo claro'}
          className={cn(
            'h-9 w-full font-normal text-sidebar-foreground/60 hover:bg-sidebar-accent hover:text-sidebar-foreground',
            collapsed ? 'justify-center px-0' : 'justify-start gap-2.5 px-2.5',
          )}
        >
          {theme === 'light' ? (
            <Moon className="size-4 shrink-0" />
          ) : (
            <Sun className="size-4 shrink-0" />
          )}
          {!collapsed && (
            <span className="text-sm">{theme === 'light' ? 'Modo escuro' : 'Modo claro'}</span>
          )}
        </Button>
        <Button
          variant="ghost"
          onClick={onToggleCollapse}
          aria-label={collapsed ? 'Expandir menu' : 'Recolher menu'}
          className={cn(
            'h-9 w-full font-normal text-sidebar-foreground/40 hover:bg-sidebar-accent hover:text-sidebar-foreground/70',
            collapsed ? 'justify-center px-0' : 'justify-start gap-2.5 px-2.5',
          )}
        >
          <ChevronLeft
            className={cn(
              'size-4 shrink-0 transition-transform duration-200',
              collapsed && 'rotate-180',
            )}
          />
          {!collapsed && <span className="text-xs">Recolher</span>}
        </Button>
      </div>
    </aside>
  )
}
