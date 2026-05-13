import { Car } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { LoginForm } from './LoginForm'
import { SignupForm } from './SignupForm'

interface Props {
  mode: 'login' | 'signup'
}

export function AuthPage({ mode }: Props) {
  const navigate = useNavigate()

  function handleSwitchToSignup() {
    navigate('/signup')
  }

  function handleSwitchToLogin() {
    navigate('/login')
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center gap-2">
          <div className="flex items-center gap-2">
            <Car className="size-6 text-primary" />
            <span className="text-xl font-semibold tracking-tight">Easy FIPE</span>
          </div>
          <p className="text-sm text-muted-foreground">
            Consulte preços de veículos da tabela FIPE
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>{mode === 'login' ? 'Entrar' : 'Criar conta'}</CardTitle>
            <CardDescription>
              {mode === 'login' ? 'Acesse sua conta para continuar' : 'Crie uma conta gratuita'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {mode === 'login' ? <LoginForm /> : <SignupForm />}
          </CardContent>
          <CardFooter className="justify-center text-sm text-muted-foreground">
            {mode === 'login' ? (
              <>
                Não tem conta?
                <Button variant="link" size="sm" onClick={handleSwitchToSignup} className="px-1">
                  Cadastre-se
                </Button>
              </>
            ) : (
              <>
                Já tem conta?
                <Button variant="link" size="sm" onClick={handleSwitchToLogin} className="px-1">
                  Entrar
                </Button>
              </>
            )}
          </CardFooter>
        </Card>
      </div>
    </div>
  )
}
