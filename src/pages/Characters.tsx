import CharacterGallery from '../components/characters/CharacterGallery'
import { getLanguage, translate } from '../i18n'

type CharactersProps = {
  onBack: () => void
  username: string
}

export default function Characters({ onBack, username }: CharactersProps) {
  const language = getLanguage(username)
  const tr = (spanish: string, catalan: string) => translate(language, spanish, catalan)

  return (
    <main className="village-app village-app--full-map">
      <header className="top-bar">
        <div className="brand">
          <span className="brand-icon" aria-hidden="true">🌲</span>
          <span>{tr('Calendario de adviento', 'Calendari d’advent')}</span>
        </div>
        <button
          type="button"
          className="account-menu__trigger"
          onClick={onBack}
        >
          <span className="account-menu__avatar" aria-hidden="true">←</span>
          {tr('Volver al calendario', 'Torna al calendari')}
        </button>
      </header>
      <section className="characters-page" aria-labelledby="characters-page-title">
        <div className="characters-page__intro">
          <h1 id="characters-page-title">{tr('Personajes', 'Personatges')}</h1>
          <p>{tr('Arrastra cada personaje horizontalmente para verlo desde todos los ángulos.', 'Arrossega cada personatge horitzontalment per veure’l des de tots els angles.')}</p>
        </div>
        <CharacterGallery username={username} language={language} />
      </section>
    </main>
  )
}
