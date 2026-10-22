import { useState, type ChangeEvent, type ComponentProps } from 'react'
import LoginPage from './pages/LoginPage'
import { missions } from './data/missions'
import type { Mission } from './data/missions'
import './App.css'

type HouseStatus = 'locked' | 'available' | 'submitted' | 'evaluated'

type Submission = {
  username: string
  day: number
  text: string
  photo: File | null
  submittedAt: string
}

type Evaluation = {
  stars: number
  comment: string
  evaluatedAt: string
}

type House = {
  day: number
  x: number
  y: number
}

type FormSubmitEvent = Parameters<
  NonNullable<ComponentProps<'form'>['onSubmit']>
>[0]

const initialHouses: House[] = Array.from({ length: 24 }, (_, index) => ({
  day: index + 1,
  x: 10 + (index % 6) * 16,
  y: 18 + Math.floor(index / 6) * 19,
}))

function App() {
  const [currentUser, setCurrentUser] = useState<string | null>(null)
  const [responses, setResponses] = useState<Record<string, Submission>>({})
  const [evaluations, setEvaluations] = useState<Record<string, Evaluation>>({})
  const [selectedDay, setSelectedDay] = useState<number | null>(null)
  const [responseText, setResponseText] = useState('')
  const [selectedPhoto, setSelectedPhoto] = useState<File | null>(null)
  const [formError, setFormError] = useState('')
  const [notice, setNotice] = useState('')
  const [adminFilter, setAdminFilter] = useState<'all' | 'pending' | 'evaluated'>('all')

  const isAdmin = currentUser?.toLowerCase() === 'admin'

  function getSubmissionKey(username: string, day: number) {
    return `${username}-${day}`
  }

  function handleLogin(username: string, _password: string) {
    // Temporal: la autenticación real se implementará con Supabase.
    setCurrentUser(username)
    setNotice('')
  }

  function handleLogout() {
    setCurrentUser(null)
    setSelectedDay(null)
    setNotice('')
  }

  function getHouseStatus(day: number): HouseStatus {
    if (!missions.some((mission) => mission.day === day)) {
      return 'locked'
    }

    if (!currentUser || currentUser.toLowerCase() === 'admin') {
      return 'locked'
    }

    const key = getSubmissionKey(currentUser, day)

    if (evaluations[key]) return 'evaluated'
    if (responses[key]) return 'submitted'

    return day === 1 ? 'available' : 'locked'
  }

  function openMission(day: number) {
    if (!currentUser || isAdmin) return

    const mission = missions.find((item) => item.day === day)
    if (!mission) return

    const key = getSubmissionKey(currentUser, day)
    const existingResponse = responses[key]

    setSelectedDay(day)
    setResponseText(existingResponse?.text ?? '')
    setSelectedPhoto(existingResponse?.photo ?? null)
    setFormError('')
    setNotice('')
  }

  function handlePhotoChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0] ?? null

    if (!file) {
      setSelectedPhoto(null)
      return
    }

    if (!file.type.startsWith('image/')) {
      setFormError('Selecciona un archivo de imagen.')
      event.target.value = ''
      return
    }

    if (file.size > 5 * 1024 * 1024) {
      setFormError('La fotografía debe ocupar menos de 5 MB.')
      event.target.value = ''
      return
    }

    setFormError('')
    setSelectedPhoto(file)
  }

  function handleSubmit(event: FormSubmitEvent) {
    event.preventDefault()

    if (selectedDay === null || !currentUser || isAdmin) return

    const mission = missions.find((item) => item.day === selectedDay)
    if (!mission) return

    if (mission.requiresText && !responseText.trim()) {
      setFormError('Escribe tu respuesta antes de enviar la misión.')
      return
    }

    if (!mission.requiresText && !responseText.trim() && !selectedPhoto) {
      setFormError('Añade una respuesta o una fotografía antes de enviar.')
      return
    }

    const key = getSubmissionKey(currentUser, selectedDay)

    setResponses((previous) => ({
      ...previous,
      [key]: {
        username: currentUser,
        day: selectedDay,
        text: responseText.trim(),
        photo: selectedPhoto,
        submittedAt: new Date().toISOString(),
      },
    }))

    // Si se actualiza una respuesta, deberá volver a evaluarse.
    setEvaluations((previous) => {
      const updated = { ...previous }
      delete updated[key]
      return updated
    })

    closeMission()
    setNotice('¡Misión enviada! Tu respuesta está pendiente de revisión.')
  }

  function evaluateSubmission(
    key: string,
    stars: number,
    comment: string,
  ) {
    setEvaluations((previous) => ({
      ...previous,
      [key]: {
        stars,
        comment,
        evaluatedAt: new Date().toISOString(),
      },
    }))

    setNotice('Evaluación guardada correctamente.')
  }

  if (!currentUser) {
    return <LoginPage onLogin={handleLogin} />
  }

  if (isAdmin) {
    const allSubmissions = Object.entries(responses).sort(
      ([, a], [, b]) =>
        new Date(b.submittedAt).getTime() -
        new Date(a.submittedAt).getTime(),
    )

    const filteredSubmissions = allSubmissions.filter(([key]) => {
      if (adminFilter === 'pending') return !evaluations[key]
      if (adminFilter === 'evaluated') return Boolean(evaluations[key])
      return true
    })

    return (
      <main className="admin-app">
        <header className="admin-header">
          <div>
            <p className="village-eyebrow">Calendario familiar</p>
            <h1>Panel de administración</h1>
            <p className="village-subtitle">
              Revisa las misiones y reparte estrellas.
            </p>
          </div>

          <button
            type="button"
            className="logout-button"
            onClick={handleLogout}
          >
            Cerrar sesión
          </button>
        </header>

        <section className="admin-summary">
          <article>
            <span>Respuestas recibidas</span>
            <strong>{allSubmissions.length}</strong>
          </article>
          <article>
            <span>Pendientes de revisar</span>
            <strong>
              {allSubmissions.filter(([key]) => !evaluations[key]).length}
            </strong>
          </article>
          <article>
            <span>Evaluadas</span>
            <strong>
              {allSubmissions.filter(([key]) => evaluations[key]).length}
            </strong>
          </article>
        </section>

        <nav className="admin-filters" aria-label="Filtrar respuestas">
          <button
            type="button"
            className={adminFilter === 'all' ? 'is-active' : ''}
            onClick={() => setAdminFilter('all')}
          >
            Todas
          </button>
          <button
            type="button"
            className={adminFilter === 'pending' ? 'is-active' : ''}
            onClick={() => setAdminFilter('pending')}
          >
            Pendientes
          </button>
          <button
            type="button"
            className={adminFilter === 'evaluated' ? 'is-active' : ''}
            onClick={() => setAdminFilter('evaluated')}
          >
            Evaluadas
          </button>
        </nav>

        {notice && (
          <div className="app-notice" role="status">
            {notice}
            <button type="button" onClick={() => setNotice('')} aria-label="Cerrar aviso">
              ×
            </button>
          </div>
        )}

        {filteredSubmissions.length === 0 ? (
          <section className="admin-empty">
            <span aria-hidden="true">❄</span>
            <h2>Aún no hay respuestas aquí</h2>
            <p>
              Cuando alguien envíe una misión, podrás revisarla y asignarle
              estrellas desde esta pantalla.
            </p>
          </section>
        ) : (
          <section className="submission-list">
            {filteredSubmissions.map(([key, submission]) => {
              const evaluation = evaluations[key]
              const mission = missions.find(
                (item) => item.day === submission.day,
              )

              return (
                <SubmissionCard
                  key={key}
                  submission={submission}
                  mission={mission}
                  evaluation={evaluation}
                  onEvaluate={(stars, comment) =>
                    evaluateSubmission(key, stars, comment)
                  }
                />
              )
            })}
          </section>
        )}
      </main>
    )
  }

  const selectedMission: Mission | undefined = missions.find(
    (mission) => mission.day === selectedDay,
  )

  const selectedStatus =
    selectedDay !== null ? getHouseStatus(selectedDay) : null

  const currentResponse =
    selectedDay !== null
      ? responses[getSubmissionKey(currentUser, selectedDay)]
      : undefined

  const currentEvaluation =
    selectedDay !== null
      ? evaluations[getSubmissionKey(currentUser, selectedDay)]
      : undefined

  return (
    <main className="village-app">
      <header className="village-header">
        <div>
          <p className="village-eyebrow">Una Navidad para compartir</p>
          <h1>El pueblo de Adviento</h1>
          <p className="village-subtitle">
            ¡Hola, {currentUser}! Cada día esconde una pequeña sorpresa.
          </p>
        </div>

        <button
          type="button"
          className="logout-button"
          onClick={handleLogout}
        >
          Cerrar sesión
        </button>
      </header>

      <section className="village-legend" aria-label="Estados de las casas">
        <span><i className="legend-dot legend-dot--available" /> Disponible</span>
        <span><i className="legend-dot legend-dot--locked" /> Próximamente</span>
        <span><i className="legend-dot legend-dot--completed" /> Enviada</span>
      </section>

      {notice && (
        <div className="app-notice" role="status">
          {notice}
          <button type="button" onClick={() => setNotice('')} aria-label="Cerrar aviso">
            ×
          </button>
        </div>
      )}

      <section className="village-scene" aria-label="Pueblo nevado de Adviento">
        <div className="snowfall" aria-hidden="true" />
        <div className="mountains mountains--back" aria-hidden="true" />
        <div className="mountains mountains--front" aria-hidden="true" />

        <div className="forest forest--left" aria-hidden="true">
          {Array.from({ length: 7 }, (_, i) => (
            <span
              className="pine-tree"
              key={i}
              style={{ left: `${i * 12}%`, top: `${(i % 3) * 16}%` }}
            />
          ))}
        </div>

        <div className="forest forest--right" aria-hidden="true">
          {Array.from({ length: 7 }, (_, i) => (
            <span
              className="pine-tree"
              key={i}
              style={{ left: `${i * 12}%`, top: `${(i % 3) * 16}%` }}
            />
          ))}
        </div>

        <div className="village-path village-path--horizontal" aria-hidden="true" />
        <div className="village-path village-path--vertical" aria-hidden="true" />
        <div className="village-path village-path--diagonal" aria-hidden="true" />

        <div className="village-plaza">
          <div className="christmas-tree" aria-label="Árbol de Navidad">
            <span className="tree-star">★</span>
            <span className="tree-layer tree-layer--one" />
            <span className="tree-layer tree-layer--two" />
            <span className="tree-layer tree-layer--three" />
            <span className="tree-trunk" />
            <i className="tree-light tree-light--one" />
            <i className="tree-light tree-light--two" />
            <i className="tree-light tree-light--three" />
          </div>
          <span className="plaza-label">Plaza de Navidad</span>
        </div>

        <div className="village-bar" aria-label="Bar del pueblo">
          <span className="bar-sign">EL REFUGIO</span>
          <div className="bar-roof" />
          <div className="bar-building">
            <span className="bar-window" />
            <span className="bar-window" />
            <span className="bar-door" />
          </div>
          <div className="bar-terrace">
            <span className="terrace-table" />
            <span className="terrace-table terrace-table--two" />
          </div>
        </div>

        <div className="training-area" aria-label="Zona de entrenamiento">
          <span className="training-label">Zona de entrenamiento</span>
          <div className="training-equipment">
            <span />
            <i />
            <span />
          </div>
          <div className="training-bench" />
        </div>

        <div className="village-bridge" aria-label="Puente">
          <span />
          <span />
          <span />
        </div>

        <div className="village-bench village-bench--one" aria-hidden="true" />
        <div className="village-bench village-bench--two" aria-hidden="true" />

        {initialHouses.map((house) => {
          const status = getHouseStatus(house.day)

          return (
            <button
              key={house.day}
              type="button"
              className={`advent-house advent-house--${status}`}
              style={{ left: `${house.x}%`, top: `${house.y}%` }}
              onClick={() => openMission(house.day)}
              disabled={status === 'locked'}
              aria-label={`Día ${house.day}, ${
                status === 'locked' ? 'bloqueado' : status
              }`}
            >
              <span className="house-number">{house.day}</span>
              <span className="house-roof" />
              <span className="house-body">
                <i className="house-window house-window--left" />
                <i className="house-window house-window--right" />
                <i className="house-door" />
              </span>
              {status === 'submitted' && (
                <span className="house-check" aria-label="Enviada">✓</span>
              )}
              {status === 'evaluated' && (
                <span className="house-check" aria-label="Evaluada">★</span>
              )}
            </button>
          )
        })}
      </section>

      <p className="village-footer">
        24 días, 24 pequeñas sorpresas. Hecho con cariño para compartir.
      </p>

      {selectedMission && selectedDay !== null && (
        <div
          className="mission-overlay"
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) closeMission()
          }}
        >
          <section
            className="mission-card"
            role="dialog"
            aria-modal="true"
            aria-labelledby="mission-title"
          >
            <button
              type="button"
              className="mission-close"
              onClick={closeMission}
              aria-label="Cerrar misión"
            >
              ×
            </button>

            <p className="mission-day">DÍA {selectedMission.day}</p>
            <h2 id="mission-title">{selectedMission.title}</h2>
            <p className="mission-description">{selectedMission.description}</p>

            <div className="mission-meta">
              <span>◷ {selectedMission.durationMinutes} minutos</span>
              <span>
                {selectedStatus === 'evaluated'
                  ? '✓ Evaluada'
                  : selectedStatus === 'submitted'
                    ? '✓ Enviada'
                    : '✦ Tu misión'}
              </span>
            </div>

            {currentEvaluation && (
              <div className="participant-evaluation">
                <p>Tu misión ha sido evaluada</p>
                <div className="evaluation-stars" aria-label={`${currentEvaluation.stars} estrellas`}>
                  {'★'.repeat(currentEvaluation.stars)}
                  {'☆'.repeat(3 - currentEvaluation.stars)}
                </div>
                {currentEvaluation.comment && (
                  <p>{currentEvaluation.comment}</p>
                )}
              </div>
            )}

            <form className="mission-form" onSubmit={handleSubmit}>
              {selectedMission.requiresText && (
                <div className="form-field">
                  <label htmlFor="mission-response">Tu respuesta</label>
                  <textarea
                    id="mission-response"
                    rows={4}
                    value={responseText}
                    onChange={(event) => setResponseText(event.target.value)}
                    placeholder="Escribe aquí tu respuesta..."
                    required
                  />
                </div>
              )}

              {selectedMission.allowsPhoto && (
                <div className="form-field">
                  <label htmlFor="mission-photo">Añadir fotografía (opcional)</label>
                  <input
                    id="mission-photo"
                    type="file"
                    accept="image/*"
                    onChange={handlePhotoChange}
                  />
                  {selectedPhoto && (
                    <span className="selected-photo">
                      Fotografía seleccionada: {selectedPhoto.name}
                      <button
                        type="button"
                        onClick={() => setSelectedPhoto(null)}
                      >
                        Quitar
                      </button>
                    </span>
                  )}
                </div>
              )}

              {formError && (
                <p className="login-error" role="alert">{formError}</p>
              )}

              <button type="submit" className="mission-action">
                {currentResponse ? 'Actualizar respuesta' : 'Enviar misión'}
              </button>
            </form>
          </section>
        </div>
      )}
    </main>
  )

  function closeMission() {
    setSelectedDay(null)
    setResponseText('')
    setSelectedPhoto(null)
    setFormError('')
  }
}

type SubmissionCardProps = {
  submission: Submission
  mission: Mission | undefined
  evaluation: Evaluation | undefined
  onEvaluate: (stars: number, comment: string) => void
}

function SubmissionCard({
  submission,
  mission,
  evaluation,
  onEvaluate,
}: SubmissionCardProps) {
  const [stars, setStars] = useState(evaluation?.stars ?? 3)
  const [comment, setComment] = useState(evaluation?.comment ?? '')

  return (
    <article className="submission-card">
      <div className="submission-card__header">
        <div>
          <p className="submission-day">DÍA {submission.day}</p>
          <h2>{mission?.title ?? 'Misión'}</h2>
          <p className="submission-user">
            Respuesta de <strong>{submission.username}</strong>
          </p>
        </div>

        <span
          className={`submission-status ${
            evaluation ? 'submission-status--evaluated' : ''
          }`}
        >
          {evaluation ? 'Evaluada' : 'Pendiente'}
        </span>
      </div>

      {submission.text && (
        <div className="submission-answer">
          <h3>Respuesta</h3>
          <p>{submission.text}</p>
        </div>
      )}

      {submission.photo && (
        <div className="submission-answer">
          <h3>Fotografía adjunta</h3>
          <p>{submission.photo.name}</p>
          <img
            className="submission-photo"
            src={URL.createObjectURL(submission.photo)}
            alt={`Fotografía enviada por ${submission.username}`}
          />
        </div>
      )}

      <p className="submission-date">
        Enviada el {new Date(submission.submittedAt).toLocaleString('es-ES')}
      </p>

      <div className="submission-evaluation">
        <h3>Asignar estrellas</h3>

        <div className="star-picker" role="group" aria-label="Puntuación">
          {[1, 2, 3].map((value) => (
            <button
              key={value}
              type="button"
              className={value <= stars ? 'star-picker__active' : ''}
              onClick={() => setStars(value)}
              aria-label={`${value} ${value === 1 ? 'estrella' : 'estrellas'}`}
              aria-pressed={stars === value}
            >
              ★
            </button>
          ))}
        </div>

        <label className="admin-comment-label">
          Comentario (opcional)
          <textarea
            rows={2}
            value={comment}
            onChange={(event) => setComment(event.target.value)}
            placeholder="Escribe un mensaje para esta persona..."
          />
        </label>

        <button
          type="button"
          className="mission-action"
          onClick={() => onEvaluate(stars, comment.trim())}
        >
          {evaluation ? 'Actualizar evaluación' : 'Guardar evaluación'}
        </button>

        {evaluation && (
          <p className="evaluation-saved">
            Puntuación guardada: {'★'.repeat(evaluation.stars)}
            {'☆'.repeat(3 - evaluation.stars)}
          </p>
        )}
      </div>
    </article>
  )
}

export default App