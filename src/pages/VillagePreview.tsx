import VillageScene from '../components/village/VillageScene'

export default function VillagePreview() {
  return (
    <main className="village-app">
      <header className="top-bar">
        <div className="brand">
          <span className="brand-icon" aria-hidden="true">
            🌲
          </span>
          <span>Calendario de adviento</span>
        </div>

        <div className="user-profile">
          <div className="user-avatar" aria-label="Foto de perfil provisional">
            👩🏻
          </div>
          <span className="user-name">Laura</span>
        </div>
      </header>

      <section className="map-container" aria-label="Mapa del pueblo nevado">
        <VillageScene />
        {/*<VillageScene litHouses={[]} />*/}

        <div className="star-counter" aria-label="125 estrellas">
          <span className="star-icon" aria-hidden="true">
            ⭐
          </span>
          <span className="star-number">125</span>
          <span className="star-label">estrellas</span>
        </div>
      </section>
    </main>
  )
}