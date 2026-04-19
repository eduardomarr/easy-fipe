import { useCallback, useState } from 'react'

type Theme = 'light' | 'dark'

const STORAGE_KEY = 'theme'

function getStoredTheme(): Theme {
  return (localStorage.getItem(STORAGE_KEY) as Theme) ?? 'light'
}

function applyTheme(theme: Theme) {
  document.documentElement.classList.toggle('dark', theme === 'dark')
}

// Apply on load so the class is set before first render
applyTheme(getStoredTheme())

export function useTheme() {
  const [theme, setTheme] = useState<Theme>(getStoredTheme)

  const toggleTheme = useCallback(() => {
    const next: Theme = theme === 'light' ? 'dark' : 'light'
    localStorage.setItem(STORAGE_KEY, next)
    applyTheme(next)
    setTheme(next)
  }, [theme])

  return { theme, toggleTheme } as const
}
