import { useState } from 'react'
import { AlertCircle } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { PasswordInput } from '@/components/ui/password-input'
import { Alert, AlertDescription } from '@/components/ui/alert'

export function LoginForm() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)
    const { error: authError } = await supabase.auth.signInWithPassword({ email, password })
    setLoading(false)
    if (authError) setError(authError.message)
  }

  function handleEmailChange(e: React.ChangeEvent<HTMLInputElement>) {
    setEmail(e.target.value)
  }

  function handlePasswordChange(e: React.ChangeEvent<HTMLInputElement>) {
    setPassword(e.target.value)
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3">
      {error && (
        <Alert variant="destructive">
          <AlertCircle />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      <div className="flex flex-col gap-1.5">
        <label htmlFor="login-email" className="text-sm font-medium">
          E-mail
        </label>
        <Input
          id="login-email"
          type="email"
          placeholder="seu@email.com"
          value={email}
          onChange={handleEmailChange}
          required
          autoComplete="email"
        />
      </div>
      <div className="flex flex-col gap-1.5">
        <label htmlFor="login-password" className="text-sm font-medium">
          Senha
        </label>
        <PasswordInput
          id="login-password"
          placeholder="••••••••"
          value={password}
          onChange={handlePasswordChange}
          required
          autoComplete="current-password"
        />
      </div>
      <Button type="submit" disabled={loading} size="lg" className="mt-1 w-full">
        {loading ? 'Entrando…' : 'Entrar'}
      </Button>
    </form>
  )
}
