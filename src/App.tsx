import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { Header } from '@/components/Header'
import { FipeLookup } from '@/features/fipe/FipeLookup'
import { ONE_DAY } from '@/constants/cachePeriods'
import packageJson from '../package.json'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: ONE_DAY,
    },
  },
})

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <div className="flex min-h-screen flex-col bg-background">
        <Header />
        <main className="container mx-auto flex-1 px-4 py-6 max-w-2xl">
          <FipeLookup />
        </main>
        <footer className="py-4 px-4 text-left text-xs text-muted-foreground">
          {packageJson.version}
        </footer>
      </div>
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  )
}
