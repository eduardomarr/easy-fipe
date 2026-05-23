import { useState } from 'react'
import { AlertCircle, MailCheck } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { PasswordInput } from '@/components/ui/password-input'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'

export function SignupForm() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)
    const { error: authError } = await supabase.auth.signUp({ email, password })
    setLoading(false)
    if (authError) {
      setError(authError.message)
    } else {
      setSubmitted(true)
    }
  }

  function handleEmailChange(e: React.ChangeEvent<HTMLInputElement>) {
    setEmail(e.target.value)
  }

  function handlePasswordChange(e: React.ChangeEvent<HTMLInputElement>) {
    setPassword(e.target.value)
  }

  if (submitted) {
    return (
      <Alert>
        <MailCheck />
        <AlertTitle>Verifique seu e-mail</AlertTitle>
        <AlertDescription>
          Enviamos um link de confirmação para <strong>{email}</strong>. Clique nele para ativar
          sua conta.
        </AlertDescription>
      </Alert>
    )
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
        <label htmlFor="signup-email" className="text-sm font-medium">
          E-mail
        </label>
        <Input
          id="signup-email"
          type="email"
          placeholder="seu@email.com"
          value={email}
          onChange={handleEmailChange}
          required
          autoComplete="email"
        />
      </div>
      <div className="flex flex-col gap-1.5">
        <label htmlFor="signup-password" className="text-sm font-medium">
          Senha
        </label>
        <PasswordInput
          id="signup-password"
          placeholder="Mínimo 6 caracteres"
          value={password}
          onChange={handlePasswordChange}
          required
          minLength={6}
          autoComplete="new-password"
        />
      </div>
      <Button type="submit" disabled={loading} size="lg" className="mt-1 w-full">
        {loading ? 'Criando conta…' : 'Criar conta'}
      </Button>
    </form>
  )
}
