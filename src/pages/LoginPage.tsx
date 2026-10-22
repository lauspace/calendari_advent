import { useState } from 'react'
import Button from '../components/ui/Button'

type LoginPageProps = {
onLogin: (username: string, password: string) => void
}

function LoginPage({ onLogin }: LoginPageProps) {
const [username, setUsername] = useState('')
const [password, setPassword] = useState('')
const [error, setError] = useState('')

function handleSubmit(event: React.SubmitEvent<HTMLFormElement>) {
event.preventDefault()

if (!username.trim() || !password) {
  setError('Introduce tu usuario y contraseña.')
  return
}

setError('')
onLogin(username.trim(), password)

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
        />
      </div>

      {error && (
        <p className="login-error" role="alert">
          {error}
        </p>
      )}

      <Button type="submit" className="login-submit">
        Entrar
      </Button>
    </form>
  </section>
</main>

)
}

export default LoginPage
