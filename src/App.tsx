import { useEffect } from 'react'
import { Navigate, Route, Routes, useNavigate } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { AppLayout } from '@/components/layout/AppLayout'
import { FipeLookup } from '@/features/fipe/FipeLookup'
import { AuthPage } from '@/features/auth/AuthPage'
import { DashboardView } from '@/features/dashboard/DashboardView'
import { HistoryView } from '@/features/history/HistoryView'
import { FavoritesView } from '@/features/favorites/FavoritesView'
import { SettingsView } from '@/features/settings/SettingsView'
import { UsersView } from '@/features/admin/UsersView'
import { Header } from '@/components/Header'
import { ONE_DAY } from '@/constants/cachePeriods'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/store/authStore'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: ONE_DAY,
    },
  },
})

function AppRoot() {
  const { session, setSession, setLoading } = useAuthStore()
  const navigate = useNavigate()

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session)
      setLoading(false)
    })

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, newSession) => {
      setSession(newSession)
      if (event === 'SIGNED_IN') navigate('/app')
      if (event === 'SIGNED_OUT') navigate('/')
    })

    return () => subscription.unsubscribe()
  }, [setSession, setLoading, navigate])

  return (
    <Routes>
      <Route path="/" element={<PublicPage />} />
      <Route path="/login" element={<AuthPage mode="login" />} />
      <Route path="/signup" element={<AuthPage mode="signup" />} />
      <Route
        path="/app"
        element={session ? <AppLayout onExitApp={() => navigate('/')} /> : <Navigate to="/login" replace />}
      >
        <Route index element={<Navigate to="dashboard" replace />} />
        <Route path="dashboard" element={<DashboardView onGoToSearch={() => navigate('/')} />} />
        <Route path="history" element={<HistoryView />} />
        <Route path="favorites" element={<FavoritesView />} />
        <Route path="settings" element={<SettingsView />} />
        <Route path="users" element={<UsersView />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

function PublicPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex flex-1 justify-center px-6 py-8">
        <div className="w-full max-w-2xl">
          <FipeLookup />
        </div>
      </main>
    </div>
  )
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AppRoot />
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  )
}
