import VillageScene from '../components/village/VillageScene'
import { getLanguage, translate } from '../i18n'

export default function Village({ username = 'jordi' }: { username?: string }) {
  const language = getLanguage(username)
  const tr = (spanish: string, catalan: string) => translate(language, spanish, catalan)

  return (
    <main className="village-app">
      <header className="top-bar">
        <div className="brand">
          <span className="brand-icon" aria-hidden="true">
            🌲
          </span>
          <span>{tr('Calendario de adviento', 'Calendari d’advent')}</span>
        </div>

        <div className="user-profile">
          <div className="user-avatar" aria-label={tr('Foto de perfil provisional', 'Foto de perfil provisional')}>
            👩🏻
          </div>
          <span className="user-name">{username}</span>
        </div>
      </header>

      <section className="map-container" aria-label={tr('Mapa del pueblo nevado', 'Mapa del poble nevat')}>
        <VillageScene currentUser={username} />
        {/*<VillageScene litHouses={[]} />*/}

        <div className="star-counter" aria-label={tr('125 estrellas', '125 estrelles')}>
          <span className="star-icon" aria-hidden="true">
            ⭐
          </span>
          <span className="star-number">125</span>
          <span className="star-label">{tr('estrellas', 'estrelles')}</span>
        </div>
      </section>
    </main>
  )
}