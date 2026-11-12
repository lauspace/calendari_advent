import { useState, type FormEvent } from 'react'
import Button from '../components/ui/Button'
import { getLanguage, translate } from '../i18n'

type LoginPageProps = {
onLogin: (username: string, password: string) => Promise<void>
}

function LoginPage({ onLogin }: LoginPageProps) {
const [username, setUsername] = useState('')
const [password, setPassword] = useState('')
const [error, setError] = useState('')
const [loading, setLoading] = useState(false)
const language = getLanguage(username)
const tr = (spanish: string, catalan: string) => translate(language, spanish, catalan)

async function handleSubmit(event: FormEvent<HTMLFormElement>) {
event.preventDefault()

const normalizedUsername = username.trim()

if (!normalizedUsername || !password) {
  setError(tr('Introduce tu usuario y contraseña.', 'Introdueix el teu nom d’usuari i la contrasenya.'))
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
      : tr(
        'No se ha podido iniciar sesión. Comprueba tus datos e inténtalo de nuevo.',
        'No s’ha pogut iniciar la sessió. Comprova les dades i torna-ho a provar.',
      ),
  )
} finally {
  setLoading(false)
}

}

return ( <main className="app"> <section className="welcome-card login-card"> <p className="welcome-card__eyebrow">
{tr('Una Navidad para compartir', 'Un Nadal per compartir')} </p>

    <h1>{tr('Calendario de Adviento', 'Calendari d’Advent')}</h1>

    <p className="welcome-card__description">
      {tr('24 días de pequeños retos, recuerdos y sorpresas en familia.', '24 dies de petits reptes, records i sorpreses en família.')}
    </p>

    <form className="login-form" onSubmit={handleSubmit}>
      <div className="form-field">
        <label htmlFor="username">{tr('Usuario', 'Nom d’usuari')}</label>
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
        <label htmlFor="password">{tr('Contraseña', 'Contrasenya')}</label>
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
        {loading ? tr('Entrando…', 'Entrant…') : tr('Entrar', 'Entra')}
      </Button>
    </form>
  </section>
</main>

)
}

export default LoginPage
