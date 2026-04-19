import { Moon, Sun } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useTheme } from '@/hooks/useTheme'

export function Header() {
  const { theme, toggleTheme } = useTheme()

  function handleToggleTheme() {
    toggleTheme()
  }

  return (
    <header className="relative overflow-hidden bg-gradient-to-br from-primary to-primary/70 text-white">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_90%_120%,rgba(255,255,255,0.18),transparent_45%),radial-gradient(circle_at_10%_-20%,rgba(255,255,255,0.14),transparent_50%)]"
      />
      <div className="relative container mx-auto px-5 max-w-2xl py-5">
        <div className="flex items-center gap-3">
          <div className="size-10 rounded-xl bg-white/15 border border-white/20 backdrop-blur-sm flex items-center justify-center">
            <span className="font-black text-base">F</span>
          </div>
          <div>
            <h1 className="text-lg font-bold tracking-tight">Fipe Fácil</h1>
            <p className="text-[11px] text-white/75 -mt-0.5">Consulta de preços FIPE</p>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="ml-auto rounded-full bg-white/12 border border-white/20 text-white hover:bg-white/20 hover:text-white"
            onClick={handleToggleTheme}
            aria-label="Alternar tema"
          >
            {theme === 'light' ? <Moon className="size-4" /> : <Sun className="size-4" />}
          </Button>
        </div>
      </div>
    </header>
  )
}
