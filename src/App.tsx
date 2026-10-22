import { useState, type ChangeEvent, type ComponentProps } from 'react'
import LoginPage from './pages/LoginPage'
import { initialMissions, PARTICIPANTS } from './data/missions'
import type { Mission, MissionStatus } from './data/missions'
import './App.css'

type HouseStatus = 'locked' | 'available' | 'submitted' | 'evaluated'
type AdminTab = 'missions' | 'submissions'
type Submission = {
  username: string
  missionId: string
  day: number
  text: string
  photo: File | null
  submittedAt: string
}
type Evaluation = { stars: number; comment: string; evaluatedAt: string }
type House = { day: number; x: number; y: number }
type FormSubmitEvent = Parameters<NonNullable<ComponentProps<'form'>['onSubmit']>>[0]

const initialHouses: House[] = Array.from({ length: 24 }, (_, index) => ({
  day: index + 1,
  x: 10 + (index % 6) * 16,
  y: 18 + Math.floor(index / 6) * 19,
}))

const createMissionId = () => globalThis.crypto?.randomUUID?.() ?? `mission-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`

const emptyMission = (day: number): Mission => ({
  id: createMissionId(),
  day,
  title: '',
  description: '',
  durationMinutes: 10,
  requiresText: true,
  allowsPhoto: false,
  assignedTo: [],
  status: 'draft',
})

function App() {
  const [currentUser, setCurrentUser] = useState<string | null>(null)
  const [missions, setMissions] = useState<Mission[]>(initialMissions)
  const [responses, setResponses] = useState<Record<string, Submission>>({})
  const [evaluations, setEvaluations] = useState<Record<string, Evaluation>>({})
  const [selectedDay, setSelectedDay] = useState<number | null>(null)
  const [selectedMissionId, setSelectedMissionId] = useState<string | null>(null)
  const [responseText, setResponseText] = useState('')
  const [selectedPhoto, setSelectedPhoto] = useState<File | null>(null)
  const [formError, setFormError] = useState('')
  const [notice, setNotice] = useState('')
  const [adminFilter, setAdminFilter] = useState<'all' | 'pending' | 'evaluated'>('all')
  const [adminTab, setAdminTab] = useState<AdminTab>('missions')
  const [editingMission, setEditingMission] = useState<Mission | null>(null)
  const [editingOriginalId, setEditingOriginalId] = useState<string | null>(null)
  const [missionError, setMissionError] = useState('')

  const isAdmin = currentUser?.toLowerCase() === 'admin'

  function getSubmissionKey(username: string, missionId: string) {
    return `${username}-${missionId}`
  }

  function hasSubmissions(missionId: string) {
    return Object.values(responses).some((response) => response.missionId === missionId)
  }

  function getUserMissions(day: number) {
    if (!currentUser) return []
    const aliases: Record<string, string> = { papa: 'papa', papá: 'papa', mama: 'mama', mamá: 'mama', hermana: 'hermana', albert: 'albert' }
    const userId = aliases[currentUser.toLowerCase()] ?? currentUser.toLowerCase()
    return missions.filter((mission) => mission.day === day && mission.status === 'prepared' && (mission.assignedTo.length === 0 || mission.assignedTo.includes(userId)))
  }

  function handleLogin(username: string, _password: string) {
    // Temporal: la autenticación real se implementará con Supabase.
    setCurrentUser(username)
    setNotice('')
  }

  function handleLogout() {
    setCurrentUser(null)
    setSelectedDay(null)
    setSelectedMissionId(null)
    setNotice('')
    setEditingMission(null)
  }

  function getHouseStatus(day: number): HouseStatus {
    if (!currentUser || isAdmin) return 'locked'
    const dayMissions = getUserMissions(day)
    if (dayMissions.length === 0) return 'locked'
    const keys = dayMissions.map((mission) => getSubmissionKey(currentUser, mission.id))
    if (keys.every((key) => Boolean(evaluations[key]))) return 'evaluated'
    if (keys.some((key) => Boolean(responses[key]))) return 'submitted'
    return day === 1 ? 'available' : 'locked'
  }

  function openMission(day: number) {
    if (!currentUser || isAdmin) return
    const availableMissions = getUserMissions(day)
    if (availableMissions.length === 0) return
    // De momento, una persona abre su primera misión asignada de ese día.
    // El modelo ya permite varias misiones y respuestas independientes por persona.
    const mission = availableMissions[0]
    const key = getSubmissionKey(currentUser, mission.id)
    const existingResponse = responses[key]
    setSelectedDay(day)
    setSelectedMissionId(mission.id)
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

  function closeMission() {
    setSelectedDay(null)
    setSelectedMissionId(null)
    setResponseText('')
    setSelectedPhoto(null)
    setFormError('')
  }

  function handleSubmit(event: FormSubmitEvent) {
    event.preventDefault()
    if (selectedDay === null || selectedMissionId === null || !currentUser || isAdmin) return
    const mission = missions.find((item) => item.id === selectedMissionId)
    if (!mission) return

    if (mission.requiresText && !responseText.trim()) {
      setFormError('Escribe tu respuesta antes de enviar la misión.')
      return
    }
    if (!mission.requiresText && !responseText.trim() && !selectedPhoto) {
      setFormError('Añade una respuesta o una fotografía antes de enviar.')
      return
    }

    const key = getSubmissionKey(currentUser, mission.id)
    setResponses((previous) => ({
      ...previous,
      [key]: {
        username: currentUser,
        missionId: mission.id,
        day: selectedDay,
        text: responseText.trim(),
        photo: selectedPhoto,
        submittedAt: new Date().toISOString(),
      },
    }))
    setEvaluations((previous) => {
      const updated = { ...previous }
      delete updated[key]
      return updated
    })
    closeMission()
    setNotice('¡Misión enviada! Tu respuesta está pendiente de revisión.')
  }

  function evaluateSubmission(key: string, stars: number, comment: string) {
    setEvaluations((previous) => ({
      ...previous,
      [key]: { stars, comment, evaluatedAt: new Date().toISOString() },
    }))
    setNotice('Evaluación guardada correctamente.')
  }

  function startNewMission(day: number) {
    setEditingOriginalId(null)
    setEditingMission(emptyMission(day))
    setMissionError('')
  }

  function startEditMission(mission: Mission) {
    setEditingOriginalId(mission.id)
    setEditingMission({ ...mission, assignedTo: [...mission.assignedTo] })
    setMissionError('')
  }

  function duplicateMission(mission: Mission) {
    setEditingOriginalId(null)
    setEditingMission({
      ...mission,
      id: createMissionId(),
      title: `${mission.title} (copia)`,
      status: 'draft',
      assignedTo: [...mission.assignedTo],
    })
    setMissionError('')
  }

  function saveMission(event: FormSubmitEvent) {
    event.preventDefault()
    if (!editingMission) return

    const title = editingMission.title.trim()
    const description = editingMission.description.trim()
    if (!title || !description) {
      setMissionError('Completa el título y la descripción.')
      return
    }
    if (!Number.isInteger(editingMission.day) || editingMission.day < 1 || editingMission.day > 24) {
      setMissionError('El día debe estar entre el 1 y el 24.')
      return
    }
    if (!Number.isFinite(editingMission.durationMinutes) || editingMission.durationMinutes < 1) {
      setMissionError('La duración debe ser de al menos un minuto.')
      return
    }

    if (editingOriginalId !== null && hasSubmissions(editingOriginalId)) {
      const original = missions.find((item) => item.id === editingOriginalId)
      if (original && original.day !== editingMission.day) {
        const ok = window.confirm(
          'Esta misión ya tiene respuestas. Cambiarla de día puede dificultar relacionar las respuestas con la misión original. ¿Quieres continuar?',
        )
        if (!ok) return
      }
    }

    const cleanedMission: Mission = {
      ...editingMission,
      id: editingMission.id || createMissionId(),
      title,
      description,
      assignedTo: [...editingMission.assignedTo],
    }

    setMissions((previous) => {
      const withoutOriginal = editingOriginalId === null ? previous : previous.filter((item) => item.id !== editingOriginalId)
      return [...withoutOriginal, cleanedMission].sort((a, b) => a.day - b.day || a.title.localeCompare(b.title))
    })
    setEditingMission(null)
    setEditingOriginalId(null)
    setMissionError('')
    setNotice(`Misión del día ${cleanedMission.day} guardada. Recuerda que los cambios aún no se guardan al recargar la página.`)
  }

  function deleteMission(mission: Mission) {
    const submissionsExist = hasSubmissions(mission.id)
    const message = submissionsExist
      ? `La misión «${mission.title}» del día ${mission.day} tiene respuestas asociadas. Si la eliminas, las respuestas seguirán en memoria, pero ya no tendrán su misión configurada. ¿Eliminar de todos modos?`
      : `¿Quieres eliminar la misión «${mission.title}» del día ${mission.day}?`
    if (!window.confirm(message)) return

    setMissions((previous) => previous.filter((item) => item.id !== mission.id))
    setEditingMission(null)
    setNotice(`Misión «${mission.title}» eliminada de la configuración actual.`)
  }

  if (!currentUser) return <LoginPage onLogin={handleLogin} />

  if (isAdmin) {
    const allSubmissions = Object.entries(responses).sort(
      ([, a], [, b]) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime(),
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
            <p className="village-subtitle">Gestiona las misiones y revisa las respuestas.</p>
          </div>
          <button type="button" className="logout-button" onClick={handleLogout}>Cerrar sesión</button>
        </header>

        <nav className="admin-tabs" aria-label="Secciones de administración">
          <button type="button" className={adminTab === 'missions' ? 'is-active' : ''} onClick={() => { setAdminTab('missions'); setEditingMission(null) }}>
            Gestionar misiones <span>{missions.length} misiones</span>
          </button>
          <button type="button" className={adminTab === 'submissions' ? 'is-active' : ''} onClick={() => { setAdminTab('submissions'); setEditingMission(null) }}>
            Respuestas <span>{allSubmissions.length}</span>
          </button>
        </nav>

        {notice && <div className="app-notice" role="status">{notice}<button type="button" onClick={() => setNotice('')} aria-label="Cerrar aviso">×</button></div>}

        {adminTab === 'missions' && (
          <section className="mission-manager">
            <div className="manager-heading">
              <div>
                <h2>Las 24 ventanas del calendario</h2>
                <p>Crea las misiones con antelación. Solo las marcadas como preparadas aparecerán en el calendario familiar.</p>
              </div>
              <button type="button" className="mission-action manager-new-button" onClick={() => startNewMission(1)}>
                + Nueva misión
              </button>
            </div>

            <div className="mission-day-grid">
              {Array.from({ length: 24 }, (_, index) => index + 1).map((day) => {
                const dayMissions = missions.filter((item) => item.day === day).sort((a, b) => a.title.localeCompare(b.title))
                const submissionCount = Object.values(responses).filter((response) => response.day === day).length
                const preparedParticipantCount = PARTICIPANTS.filter((participant) =>
                  dayMissions.some((mission) =>
                    mission.status === 'prepared' &&
                    (mission.assignedTo.length === 0 || mission.assignedTo.includes(participant.id)),
                  ),
                ).length
                const allParticipantsPrepared = preparedParticipantCount === PARTICIPANTS.length
                return (
                  <article className={`mission-day-card ${dayMissions.length ? 'mission-day-card--prepared' : 'mission-day-card--empty'}`} key={day}>
                    <div className="mission-day-card__top">
                      <span className="mission-day-number">{String(day).padStart(2, '0')}</span>
                      <span className={`mission-state-pill ${dayMissions.some((mission) => mission.status === 'prepared') ? 'is-prepared' : ''}`}>{dayMissions.length ? `${dayMissions.length} misión(es)` : 'Vacío'}</span>
                    </div>
                    <div className="day-preparation-status" aria-live="polite">
                      {allParticipantsPrepared ? (
                        <span className="day-preparation-badge day-preparation-badge--complete">✓ Día completo · 4/4 preparadas</span>
                      ) : preparedParticipantCount > 0 ? (
                        <span className="day-preparation-badge">{preparedParticipantCount}/4 personas con misión preparada</span>
                      ) : (
                        <span className="day-preparation-badge day-preparation-badge--empty">Aún faltan misiones preparadas</span>
                      )}
                    </div>
                    {dayMissions.length === 0 && <p className="mission-day-card__description">Todavía no hay misiones para este día.</p>}
                    <div className="mission-day-mission-list">
                      {dayMissions.map((mission) => (
                        <div className="mission-day-mission" key={mission.id}>
                          <h3>{mission.title}</h3>
                          <p className="mission-day-card__description">{mission.description}</p>
                          <div className="mission-day-card__meta">
                            <span>◷ {mission.durationMinutes} min</span>
                            <span>{mission.assignedTo.length ? mission.assignedTo.map((id) => PARTICIPANTS.find((participant) => participant.id === id)?.label ?? id).join(', ') : 'Toda la familia'}</span>
                            <span>{mission.status === 'prepared' ? 'Preparada' : 'Borrador'}</span>
                          </div>
                          <div className="mission-day-card__actions">
                            <button type="button" onClick={() => startEditMission(mission)}>Editar</button>
                            <button type="button" onClick={() => duplicateMission(mission)}>Duplicar</button>
                            <button type="button" className="is-danger" onClick={() => deleteMission(mission)}>Eliminar</button>
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="mission-day-card__meta">
                      {submissionCount > 0 && <span>✉ {submissionCount} respuesta(s)</span>}
                    </div>
                    <div className="mission-day-card__actions">
                      <button type="button" className="is-primary" onClick={() => startNewMission(day)}>+ Añadir misión</button>
                    </div>
                  </article>
                )
              })}
            </div>

            {editingMission && (
              <div className="mission-overlay" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) { setEditingMission(null); setMissionError('') } }}>
                <section className="mission-card mission-editor-card" role="dialog" aria-modal="true" aria-labelledby="mission-editor-title">
                  <button type="button" className="mission-close" onClick={() => { setEditingMission(null); setMissionError('') }} aria-label="Cerrar editor">×</button>
                  <p className="mission-day">{editingOriginalId === null ? 'NUEVA MISIÓN' : `EDITAR DÍA ${editingMission.day}`}</p>
                  <h2 id="mission-editor-title">{editingOriginalId === null ? 'Preparar una misión' : 'Editar misión'}</h2>
                  <form className="mission-form mission-editor-form" onSubmit={saveMission}>
                    <div className="editor-two-columns">
                      <div className="form-field">
                        <label htmlFor="mission-day-number">Día del calendario</label>
                        <select id="mission-day-number" value={editingMission.day} onChange={(event) => setEditingMission({ ...editingMission, day: Number(event.target.value) })}>
                          {Array.from({ length: 24 }, (_, i) => i + 1).map((day) => <option key={day} value={day}>Día {day}</option>)}
                        </select>
                      </div>
                      <div className="form-field">
                        <label htmlFor="mission-duration">Duración estimada (minutos)</label>
                        <input id="mission-duration" type="number" min="1" max="240" value={editingMission.durationMinutes} onChange={(event) => setEditingMission({ ...editingMission, durationMinutes: Number(event.target.value) })} />
                      </div>
                    </div>
                    <div className="form-field">
                      <label htmlFor="mission-title-input">Título</label>
                      <input id="mission-title-input" value={editingMission.title} onChange={(event) => setEditingMission({ ...editingMission, title: event.target.value })} placeholder="Ej. Un paseo especial" />
                    </div>
                    <div className="form-field">
                      <label htmlFor="mission-description-input">Descripción e instrucciones</label>
                      <textarea id="mission-description-input" rows={4} value={editingMission.description} onChange={(event) => setEditingMission({ ...editingMission, description: event.target.value })} placeholder="Explica qué debe hacer la persona..." />
                    </div>

                    <fieldset className="editor-fieldset">
                      <legend>¿Quién debe hacerla?</legend>
                      <p className="editor-help">Si no marcas a nadie, la misión será para cualquier participante.</p>
                      <div className="participant-checkboxes">
                        {PARTICIPANTS.map((participant) => (
                          <label key={participant.id}>
                            <input type="checkbox" checked={editingMission.assignedTo.includes(participant.id)} onChange={(event) => {
                              const assignedTo = event.target.checked
                                ? [...editingMission.assignedTo, participant.id]
                                : editingMission.assignedTo.filter((id) => id !== participant.id)
                              setEditingMission({ ...editingMission, assignedTo })
                            }} />
                            {participant.label}
                          </label>
                        ))}
                      </div>
                    </fieldset>

                    <fieldset className="editor-fieldset">
                      <legend>Tipo de respuesta</legend>
                      <label className="editor-switch"><input type="checkbox" checked={editingMission.requiresText} onChange={(event) => setEditingMission({ ...editingMission, requiresText: event.target.checked })} /> Requiere respuesta escrita</label>
                      <label className="editor-switch"><input type="checkbox" checked={editingMission.allowsPhoto} onChange={(event) => setEditingMission({ ...editingMission, allowsPhoto: event.target.checked })} /> Permite adjuntar fotografía</label>
                    </fieldset>

                    <fieldset className="editor-fieldset">
                      <legend>Estado de la misión</legend>
                      <label className="editor-switch"><input type="radio" name="mission-status" checked={editingMission.status === 'draft'} onChange={() => setEditingMission({ ...editingMission, status: 'draft' as MissionStatus })} /> Borrador (no visible)</label>
                      <label className="editor-switch"><input type="radio" name="mission-status" checked={editingMission.status === 'prepared'} onChange={() => setEditingMission({ ...editingMission, status: 'prepared' as MissionStatus })} /> Preparada (visible cuando corresponda)</label>
                    </fieldset>

                    {missionError && <p className="login-error" role="alert">{missionError}</p>}
                    <div className="editor-form-actions">
                      <button type="button" className="editor-cancel-button" onClick={() => { setEditingMission(null); setMissionError('') }}>Cancelar</button>
                      <button type="submit" className="mission-action">Guardar misión</button>
                    </div>
                  </form>
                </section>
              </div>
            )}
          </section>
        )}

        {adminTab === 'submissions' && (
          <>
            <section className="admin-summary">
              <article><span>Respuestas recibidas</span><strong>{allSubmissions.length}</strong></article>
              <article><span>Pendientes de revisar</span><strong>{allSubmissions.filter(([key]) => !evaluations[key]).length}</strong></article>
              <article><span>Evaluadas</span><strong>{allSubmissions.filter(([key]) => evaluations[key]).length}</strong></article>
            </section>
            <nav className="admin-filters" aria-label="Filtrar respuestas">
              <button type="button" className={adminFilter === 'all' ? 'is-active' : ''} onClick={() => setAdminFilter('all')}>Todas</button>
              <button type="button" className={adminFilter === 'pending' ? 'is-active' : ''} onClick={() => setAdminFilter('pending')}>Pendientes</button>
              <button type="button" className={adminFilter === 'evaluated' ? 'is-active' : ''} onClick={() => setAdminFilter('evaluated')}>Evaluadas</button>
            </nav>
            {filteredSubmissions.length === 0 ? (
              <section className="admin-empty"><span aria-hidden="true">❄</span><h2>Aún no hay respuestas aquí</h2><p>Cuando alguien envíe una misión, podrás revisarla y asignarle estrellas desde esta pantalla.</p></section>
            ) : (
              <section className="submission-list">
                {filteredSubmissions.map(([key, submission]) => (
                  <SubmissionCard
                    key={key}
                    submission={submission}
                    mission={missions.find((item) => item.id === submission.missionId)}
                    evaluation={evaluations[key]}
                    onEvaluate={(stars, comment) => evaluateSubmission(key, stars, comment)}
                  />
                ))}
              </section>
            )}
          </>
        )}
      </main>
    )
  }

  const selectedMission = selectedMissionId ? missions.find((mission) => mission.id === selectedMissionId && mission.status === 'prepared') : undefined
  const selectedStatus = selectedDay !== null ? getHouseStatus(selectedDay) : null
  const currentResponse = selectedMissionId ? responses[getSubmissionKey(currentUser, selectedMissionId)] : undefined
  const currentEvaluation = selectedMissionId ? evaluations[getSubmissionKey(currentUser, selectedMissionId)] : undefined

  return (
    <main className="village-app">
      <header className="village-header">
        <div>
          <p className="village-eyebrow">Una Navidad para compartir</p>
          <h1>El pueblo de Adviento</h1>
          <p className="village-subtitle">¡Hola, {currentUser}! Cada día esconde una pequeña sorpresa.</p>
        </div>
        <button type="button" className="logout-button" onClick={handleLogout}>Cerrar sesión</button>
      </header>

      <section className="village-legend" aria-label="Estados de las casas">
        <span><i className="legend-dot legend-dot--available" /> Disponible</span>
        <span><i className="legend-dot legend-dot--locked" /> Próximamente</span>
        <span><i className="legend-dot legend-dot--completed" /> Enviada</span>
      </section>

      {notice && <div className="app-notice" role="status">{notice}<button type="button" onClick={() => setNotice('')} aria-label="Cerrar aviso">×</button></div>}

      <section className="village-scene" aria-label="Pueblo nevado de Adviento">
        <div className="snowfall" aria-hidden="true" />
        <div className="mountains mountains--back" aria-hidden="true" />
        <div className="mountains mountains--front" aria-hidden="true" />
        <div className="forest forest--left" aria-hidden="true">{Array.from({ length: 7 }, (_, i) => <span className="pine-tree" key={i} style={{ left: `${i * 12}%`, top: `${(i % 3) * 16}%` }} />)}</div>
        <div className="forest forest--right" aria-hidden="true">{Array.from({ length: 7 }, (_, i) => <span className="pine-tree" key={i} style={{ left: `${i * 12}%`, top: `${(i % 3) * 16}%` }} />)}</div>
        <div className="village-path village-path--horizontal" aria-hidden="true" />
        <div className="village-path village-path--vertical" aria-hidden="true" />
        <div className="village-path village-path--diagonal" aria-hidden="true" />
        <div className="village-plaza">
          <div className="christmas-tree" aria-label="Árbol de Navidad"><span className="tree-star">★</span><span className="tree-layer tree-layer--one" /><span className="tree-layer tree-layer--two" /><span className="tree-layer tree-layer--three" /><span className="tree-trunk" /><i className="tree-light tree-light--one" /><i className="tree-light tree-light--two" /><i className="tree-light tree-light--three" /></div>
          <span className="plaza-label">Plaza de Navidad</span>
        </div>
        <div className="village-bar" aria-label="Bar del pueblo"><span className="bar-sign">EL REFUGIO</span><div className="bar-roof" /><div className="bar-building"><span className="bar-window" /><span className="bar-window" /><span className="bar-door" /></div><div className="bar-terrace"><span className="terrace-table" /><span className="terrace-table terrace-table--two" /></div></div>
        <div className="training-area" aria-label="Zona de entrenamiento"><span className="training-label">Zona de entrenamiento</span><div className="training-equipment"><span /><i /><span /></div><div className="training-bench" /></div>
        <div className="village-bridge" aria-label="Puente"><span /><span /><span /></div>
        <div className="village-bench village-bench--one" aria-hidden="true" />
        <div className="village-bench village-bench--two" aria-hidden="true" />

        {initialHouses.map((house) => {
          const status = getHouseStatus(house.day)
          return (
            <button key={house.day} type="button" className={`advent-house advent-house--${status}`} style={{ left: `${house.x}%`, top: `${house.y}%` }} onClick={() => openMission(house.day)} disabled={status === 'locked'} aria-label={`Día ${house.day}, ${status === 'locked' ? 'bloqueado' : status}`}>
              <span className="house-number">{house.day}</span><span className="house-roof" /><span className="house-body"><i className="house-window house-window--left" /><i className="house-window house-window--right" /><i className="house-door" /></span>
              {status === 'submitted' && <span className="house-check" aria-label="Enviada">✓</span>}
              {status === 'evaluated' && <span className="house-check" aria-label="Evaluada">★</span>}
            </button>
          )
        })}
      </section>
      <p className="village-footer">24 días, 24 pequeñas sorpresas. Hecho con cariño para compartir.</p>

      {selectedMission && selectedDay !== null && (
        <div className="mission-overlay" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) closeMission() }}>
          <section className="mission-card" role="dialog" aria-modal="true" aria-labelledby="mission-title">
            <button type="button" className="mission-close" onClick={closeMission} aria-label="Cerrar misión">×</button>
            <p className="mission-day">DÍA {selectedMission.day}</p>
            <h2 id="mission-title">{selectedMission.title}</h2>
            <p className="mission-description">{selectedMission.description}</p>
            <div className="mission-meta"><span>◷ {selectedMission.durationMinutes} minutos</span><span>{selectedStatus === 'evaluated' ? '✓ Evaluada' : selectedStatus === 'submitted' ? '✓ Enviada' : '✦ Tu misión'}</span></div>
            {currentEvaluation && <div className="participant-evaluation"><p>Tu misión ha sido evaluada</p><div className="evaluation-stars" aria-label={`${currentEvaluation.stars} estrellas`}>{'★'.repeat(currentEvaluation.stars)}{'☆'.repeat(3 - currentEvaluation.stars)}</div>{currentEvaluation.comment && <p>{currentEvaluation.comment}</p>}</div>}
            <form className="mission-form" onSubmit={handleSubmit}>
              {selectedMission.requiresText && <div className="form-field"><label htmlFor="mission-response">Tu respuesta</label><textarea id="mission-response" rows={4} value={responseText} onChange={(event) => setResponseText(event.target.value)} placeholder="Escribe aquí tu respuesta..." required /></div>}
              {selectedMission.allowsPhoto && <div className="form-field"><label htmlFor="mission-photo">Añadir fotografía (opcional)</label><input id="mission-photo" type="file" accept="image/*" onChange={handlePhotoChange} />{selectedPhoto && <span className="selected-photo">Fotografía seleccionada: {selectedPhoto.name}<button type="button" onClick={() => setSelectedPhoto(null)}>Quitar</button></span>}</div>}
              {formError && <p className="login-error" role="alert">{formError}</p>}
              <button type="submit" className="mission-action">{currentResponse ? 'Actualizar respuesta' : 'Enviar misión'}</button>
            </form>
          </section>
        </div>
      )}
    </main>
  )
}

type SubmissionCardProps = {
  submission: Submission
  mission: Mission | undefined
  evaluation: Evaluation | undefined
  onEvaluate: (stars: number, comment: string) => void
}

function SubmissionCard({ submission, mission, evaluation, onEvaluate }: SubmissionCardProps) {
  const [stars, setStars] = useState(evaluation?.stars ?? 3)
  const [comment, setComment] = useState(evaluation?.comment ?? '')

  return (
    <article className="submission-card">
      <div className="submission-card__header"><div><p className="submission-day">DÍA {submission.day}</p><h2>{mission?.title ?? 'Misión eliminada o modificada'}</h2><p className="submission-user">Respuesta de <strong>{submission.username}</strong></p></div><span className={`submission-status ${evaluation ? 'submission-status--evaluated' : ''}`}>{evaluation ? 'Evaluada' : 'Pendiente'}</span></div>
      {submission.text && <div className="submission-answer"><h3>Respuesta</h3><p>{submission.text}</p></div>}
      {submission.photo && <div className="submission-answer"><h3>Fotografía adjunta</h3><p>{submission.photo.name}</p><img className="submission-photo" src={URL.createObjectURL(submission.photo)} alt={`Fotografía enviada por ${submission.username}`} /></div>}
      <p className="submission-date">Enviada el {new Date(submission.submittedAt).toLocaleString('es-ES')}</p>
      <div className="submission-evaluation"><h3>Asignar estrellas</h3><div className="star-picker" role="group" aria-label="Puntuación">{[1, 2, 3].map((value) => <button key={value} type="button" className={value <= stars ? 'star-picker__active' : ''} onClick={() => setStars(value)} aria-label={`${value} ${value === 1 ? 'estrella' : 'estrellas'}`} aria-pressed={stars === value}>★</button>)}</div>
        <label className="admin-comment-label">Comentario (opcional)<textarea rows={2} value={comment} onChange={(event) => setComment(event.target.value)} placeholder="Escribe un mensaje para esta persona..." /></label>
        <button type="button" className="mission-action" onClick={() => onEvaluate(stars, comment.trim())}>{evaluation ? 'Actualizar evaluación' : 'Guardar evaluación'}</button>
        {evaluation && <p className="evaluation-saved">Puntuación guardada: {'★'.repeat(evaluation.stars)}{'☆'.repeat(3 - evaluation.stars)}</p>}
      </div>
    </article>
  )
}

export default App
