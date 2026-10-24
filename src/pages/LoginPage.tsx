import { useState, type FormEvent } from 'react'
import Button from '../components/ui/Button'

type LoginPageProps = {
onLogin: (username: string, password: string) => Promise<void>
}

function LoginPage({ onLogin }: LoginPageProps) {
const [username, setUsername] = useState('')
const [password, setPassword] = useState('')
const [error, setError] = useState('')
const [loading, setLoading] = useState(false)

async function handleSubmit(event: FormEvent<HTMLFormElement>) {
event.preventDefault()

const normalizedUsername = username.trim()

if (!normalizedUsername || !password) {
  setError('Introduce tu usuario y contraseña.')
  return
}

setError('')
setLoading(true)

try {
  await onLogin(normalizedUsername, password)
} catch (err) {
  setError(
    err instanceof Error
      ? err.message
      : 'No se ha podido iniciar sesión. Comprueba tus datos e inténtalo de nuevo.',
  )
} finally {
  setLoading(false)
}

}

return ( <main className="app"> <section className="welcome-card login-card"> <p className="welcome-card__eyebrow">
Una Navidad para compartir </p>

    <h1>Calendario de Adviento</h1>

    <p className="welcome-card__description">
      24 días de pequeños retos, recuerdos y sorpresas en familia.
    </p>

    <form className="login-form" onSubmit={handleSubmit}>
      <div className="form-field">
        <label htmlFor="username">Usuario</label>
        <input
          id="username"
          name="username"
          type="text"
          autoComplete="username"
          value={username}
          onChange={(event) => setUsername(event.target.value)}
          required
          disabled={loading}
        />
      </div>

      <div className="form-field">
        <label htmlFor="password">Contraseña</label>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          required
          disabled={loading}
        />
      </div>

      {error && (
        <p className="login-error" role="alert">
          {error}
        </p>
      )}

      <Button type="submit" className="login-submit" disabled={loading}>
        {loading ? 'Entrando…' : 'Entrar'}
      </Button>
    </form>
  </section>
</main>

)
}

export default LoginPage
