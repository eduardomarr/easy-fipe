import { LayoutDashboard, LogIn, LogOut, Moon, Sun } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useTheme } from '@/hooks/useTheme'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/store/authStore'

export function Header() {
  const { theme, toggleTheme } = useTheme()
  const navigate = useNavigate()
  const session = useAuthStore((s) => s.session)

  function handleToggleTheme() {
    toggleTheme()
  }

  function handleLogin() {
    navigate('/login')
  }

  function handleGoToDashboard() {
    navigate('/app/dashboard')
  }

  async function handleSignOut() {
    await supabase.auth.signOut()
  }

  const email = session?.user.email ?? ''
  const initial = email ? email.charAt(0).toUpperCase() : '?'

  return (
    <header className="bg-primary text-primary-foreground">
      <div className="container mx-auto px-5 max-w-2xl py-5">
        <div className="flex items-center gap-3">
          <div className="size-10 rounded-xl bg-primary-foreground/15 border border-primary-foreground/20 backdrop-blur-sm flex items-center justify-center">
            <span className="font-black text-base">F</span>
          </div>
          <div>
            <h1 className="text-lg font-bold tracking-tight">Fipe Fácil</h1>
            <p className="text-[11px] text-primary-foreground/75 -mt-0.5">Consulta de preços FIPE</p>
          </div>
          <div className="ml-auto flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              className="rounded-full bg-primary-foreground/12 border border-primary-foreground/20 text-primary-foreground hover:bg-primary-foreground/20 hover:text-primary-foreground"
              onClick={handleToggleTheme}
              aria-label="Alternar tema"
            >
              {theme === 'light' ? <Moon className="size-4" /> : <Sun className="size-4" />}
            </Button>
            {session ? (
              <DropdownMenu>
                <DropdownMenuTrigger
                  render={
                    <Button
                      variant="ghost"
                      size="icon"
                      className="rounded-full bg-primary-foreground/12 border border-primary-foreground/20 text-primary-foreground hover:bg-primary-foreground/20 hover:text-primary-foreground"
                      aria-label="Menu da conta"
                    >
                      <span className="text-sm font-semibold">{initial}</span>
                    </Button>
                  }
                />
                <DropdownMenuContent>
                  <DropdownMenuLabel className="truncate">{email}</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleGoToDashboard}>
                    <LayoutDashboard className="size-4" />
                    Ir para Dashboard
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleSignOut}>
                    <LogOut className="size-4" />
                    Sair
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Button
                variant="ghost"
                size="icon"
                className="rounded-full bg-primary-foreground/12 border border-primary-foreground/20 text-primary-foreground hover:bg-primary-foreground/20 hover:text-primary-foreground"
                onClick={handleLogin}
                aria-label="Entrar"
              >
                <LogIn className="size-4" />
              </Button>
            )}
          </div>
        </div>
      </div>
    </header>
  )
}
