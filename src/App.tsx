import { useCallback, useEffect, useState, type ChangeEvent, type ComponentProps } from 'react'
import LoginPage from './pages/LoginPage'
import Characters from './pages/Characters'
import { PARTICIPANTS } from './data/missions'
import type { Mission, MissionStatus } from './data/missions'
import VillageScene from './components/village/VillageScene'
import { MAP_H, MAP_W } from './components/village/constants'
import { HOUSE_SPOTS } from './components/village/data/spots'
import { getLanguage, getMissionDescription, getMissionTitle, translate } from './i18n'
import './App.css'
import { supabase } from './lib/supabase'

type HouseStatus = 'locked' | 'available' | 'submitted' | 'evaluated'
type AdminTab = 'missions' | 'submissions'
type Submission = {
  username: string
  missionId: string
  day: number
  text: string
  photo: string | null
  submittedAt: string
}
type Evaluation = { stars: number; comment: string; evaluatedAt: string }
type House = { day: number; x: number; y: number }
type FormSubmitEvent = Parameters<NonNullable<ComponentProps<'form'>['onSubmit']>>[0]

const initialHouses: House[] = HOUSE_SPOTS.map((spot) => ({
  day: spot.id,
  x: (spot.x / MAP_W) * 100,
  y: (spot.y / MAP_H) * 100,
}))

const createMissionId = () => globalThis.crypto?.randomUUID?.() ?? `mission-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`

const emptyMission = (day: number): Mission => ({
  id: createMissionId(),
  day,
  title: '',
  description: '',
  titleCa: '',
  descriptionCa: '',
  requiresText: true,
  allowsPhoto: false,
  assignedTo: [],
  status: 'draft',
})

const USER_EMAILS: Record<string, string> = {
  jordi: 'jordi@adventcalendar.invalid',
  caty: 'caty@adventcalendar.invalid',
  ana: 'ana@adventcalendar.invalid',
  albert: 'albert@adventcalendar.invalid',
  admin: 'admin@adventcalendar.invalid',
}

function App() {
  const [currentUser, setCurrentUser] = useState<string | null>(null)
  const language = getLanguage(currentUser)
  const tr = useCallback(
    (spanish: string, catalan: string) => translate(language, spanish, catalan),
    [language],
  )

  useEffect(() => {
    document.documentElement.lang = language
    document.title = translate(language, 'Calendario de Adviento', 'Calendari d’Advent')
  }, [language])

  useEffect(() => {
    let active = true

    async function restoreSession() {
      try {
        const { data, error } = await supabase.auth.getSession()

        if (error) {
          console.error('Error al recuperar la sesión:', error.message)
          return
        }

        if (!data.session) {
          return
        }

        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('username, display_name, role')
          .eq('id', data.session.user.id)
          .single()

        if (!active) return

        if (profileError || !profile) {
          console.error('Error al restaurar el perfil:', profileError)
          await supabase.auth.signOut()
          return
        }

        setCurrentUser(profile.username)
      } finally {
        if (active) {
          setCheckingSession(false)
        }
      }
    }

    void restoreSession()

    return () => {
      active = false
    }
  }, [])

  useEffect(() => {
    let active = true

    if (!currentUser) {
      setMissions([])
      setLoadingMissions(false)
      return () => {
        active = false
      }
    }

    setLoadingMissions(true)

    async function loadMissions() {
      try {
        const [
          { data: missionData, error: missionsError },
          { data: assignmentData, error: assignmentsError },
          { data: profileData, error: profilesError },
        ] = await Promise.all([
          supabase
            .from('missions')
            .select('*')
            .order('day', { ascending: true }),

          supabase
            .from('mission_assignments')
            .select('mission_id, participant_id'),

          supabase
            .from('profiles')
            .select('id, username'),
        ])

        if (missionsError) throw missionsError
        if (assignmentsError) throw assignmentsError
        if (profilesError) throw profilesError

        if (!active) return

        const usernameById = new Map(
          (profileData ?? []).map((profile) => [
            profile.id,
            profile.username.toLowerCase(),
          ]),
        )

        const assignmentsByMission = new Map<string, string[]>()

        for (const assignment of assignmentData ?? []) {
          const username = usernameById.get(assignment.participant_id)

          if (!username) continue

          const assignedUsers =
            assignmentsByMission.get(assignment.mission_id) ?? []

          assignedUsers.push(username)
          assignmentsByMission.set(assignment.mission_id, assignedUsers)
        }

        const loadedMissions: Mission[] = (missionData ?? []).map((mission) => ({
          id: mission.id,
          day: mission.day,
          title: mission.title_es ?? mission.title,
          description: mission.description_es ?? mission.description,
          titleCa: mission.title_ca ?? '',
          descriptionCa: mission.description_ca ?? '',
          requiresText: mission.requires_text,
          allowsPhoto: mission.allows_photo,
          assignedTo: assignmentsByMission.get(mission.id) ?? [],
          status: mission.status as MissionStatus,
        }))

        setMissions(loadedMissions)
      } catch (error) {
        console.error('Error al cargar las misiones:', error)

        if (active) {
          setNotice(tr(
            'No se han podido cargar las misiones y sus asignaciones.',
            'No s’han pogut carregar les missions i les seves assignacions.',
          ))
        }
      } finally {
        if (active) {
          setLoadingMissions(false)
        }
      }
    }

    void loadMissions()

    return () => {
      active = false
    }
  }, [currentUser, tr])

  const [checkingSession, setCheckingSession] = useState(true)
  const [missions, setMissions] = useState<Mission[]>([])
  const [loadingMissions, setLoadingMissions] = useState(true)
  const [responses, setResponses] = useState<Record<string, Submission>>({})
  const [evaluations, setEvaluations] = useState<Record<string, Evaluation>>({})
  const [selectedDay, setSelectedDay] = useState<number | null>(null)
  const [selectedMissionId, setSelectedMissionId] = useState<string | null>(null)
  const [activePage, setActivePage] = useState<'calendar' | 'characters'>('calendar')
  const [responseText, setResponseText] = useState('')
  const [selectedPhoto, setSelectedPhoto] = useState<File | null>(null)
  const [formError, setFormError] = useState('')
  const [notice, setNotice] = useState('')
  const [adminFilter, setAdminFilter] = useState<'all' | 'pending' | 'evaluated'>('all')
  const [adminTab, setAdminTab] = useState<AdminTab>('missions')
  const [editingMission, setEditingMission] = useState<Mission | null>(null)
  const [editingOriginalId, setEditingOriginalId] = useState<string | null>(null)
  const [missionError, setMissionError] = useState('')
  const [testMode, setTestMode] = useState(false)
  const [testDay, setTestDay] = useState(1)
  const [loadingTestSettings, setLoadingTestSettings] = useState(true)
  const [savingTestSettings, setSavingTestSettings] = useState(false)

  const isAdmin = currentUser?.toLowerCase() === 'admin'

  useEffect(() => {
    if (!currentUser) return

    let active = true

    async function loadCalendarSettings() {
      const { data, error } = await supabase
        .from('calendar_settings')
        .select('test_mode, test_day')
        .eq('id', 1)
        .single()

      if (!active) return

      if (error) {
        console.error('Error al cargar la configuración del calendario:', error)
        setNotice(tr(
          'No se ha podido cargar la configuración compartida del calendario.',
          'No s’ha pogut carregar la configuració compartida del calendari.',
        ))
      } else {
        setTestMode(data.test_mode)
        setTestDay(data.test_day)
      }

      setLoadingTestSettings(false)
    }

    void loadCalendarSettings()

    const channel = supabase
      .channel('shared-calendar-settings')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'calendar_settings',
          filter: 'id=1',
        },
        (payload) => {
          const settings = payload.new as {
            test_mode: boolean
            test_day: number
          }
          setTestMode(settings.test_mode)
          setTestDay(settings.test_day)
        },
      )
      .subscribe()

    return () => {
      active = false
      void supabase.removeChannel(channel)
    }
  }, [currentUser, tr])

  async function saveCalendarSettings(testModeValue: boolean, testDayValue: number) {
    setSavingTestSettings(true)

    const { data, error } = await supabase
      .from('calendar_settings')
      .update({
        test_mode: testModeValue,
        test_day: testDayValue,
        updated_at: new Date().toISOString(),
      })
      .eq('id', 1)
      .select('test_mode, test_day')
      .single()

    setSavingTestSettings(false)

    if (error) {
      console.error('Error al guardar la configuración del calendario:', error)
      setNotice(tr(
        `No se ha podido guardar la configuración: ${error.message}`,
        `No s’ha pogut desar la configuració: ${error.message}`,
      ))
      return
    }

    setTestMode(data.test_mode)
    setTestDay(data.test_day)
    setNotice(tr(
      'Configuración del calendario guardada para todos los navegadores.',
      'S’ha desat la configuració del calendari per a tots els navegadors.',
    ))
  }

  useEffect(() => {
    if (!currentUser || isAdmin || loadingMissions) return

    let active = true

    async function loadResponses() {
      try {
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('id')
          .ilike('username', currentUser!)
          .single()

        if (profileError) throw profileError

        const { data: submissions, error: submissionsError } = await supabase
          .from('submissions')
          .select('id, mission_id, participant_id, response_text, photo_path, submitted_at')
          .eq('participant_id', profile.id)

        if (submissionsError) throw submissionsError

        if (!active) return

        const responsesByKey: Record<string, Submission> = {}

        for (const submission of submissions ?? []) {
          const mission = missions.find(
            (item) => item.id === submission.mission_id,
          )

          if (!mission) continue

          let photoUrl: string | null = null

          if (submission.photo_path) {
            const { data: photoData, error: photoError } = await supabase.storage
              .from('mission-photos')
              .createSignedUrl(submission.photo_path, 3600)

            if (photoError) {
              console.error(
                'Error al recuperar la fotografía:',
                photoError,
              )
            } else {
              photoUrl = photoData.signedUrl
              console.log('URL de la foto recuperada:', photoUrl)
            }

          }

          const key = getSubmissionKey(currentUser!, mission.id)

          responsesByKey[key] = {
            username: currentUser!,
            missionId: mission.id,
            day: mission.day,
            text: submission.response_text ?? '',
            photo: photoUrl,
            submittedAt: submission.submitted_at,
          }
        }

        if (!active) return

        console.log('Respuestas recuperadas:', responsesByKey)

        setResponses((previous) => ({
          ...previous,
          ...responsesByKey,
        }))

        const submissionIds = (submissions ?? []).map((submission) => submission.id)

        if (submissionIds.length > 0) {
          const { data: evaluationData, error: evaluationsError } = await supabase
            .from('evaluations')
            .select('submission_id, stars, comment, evaluated_at')
            .in('submission_id', submissionIds)

          if (evaluationsError) throw evaluationsError
          if (!active) return

          const submissionKeyById = new Map<string, string>()
          const evaluationsByKey: Record<string, Evaluation> = {}

          for (const submission of submissions ?? []) {
            const mission = missions.find(
              (item) => item.id === submission.mission_id,
            )

            if (mission) {
              submissionKeyById.set(
                submission.id,
                getSubmissionKey(currentUser!, mission.id),
              )
            }
          }

          for (const evaluation of evaluationData ?? []) {
            const key = submissionKeyById.get(evaluation.submission_id)

            if (key) {
              evaluationsByKey[key] = {
                stars: evaluation.stars,
                comment: evaluation.comment ?? '',
                evaluatedAt: evaluation.evaluated_at,
              }
            }
          }

          setEvaluations((previous) => ({
            ...previous,
            ...evaluationsByKey,
          }))
        }
      } catch (error) {
        console.error('Error al cargar las respuestas y sus evaluaciones:', error)
      }
    }

    void loadResponses()

    return () => {
      active = false
    }
  }, [currentUser, isAdmin, loadingMissions, missions])

  function getSubmissionKey(username: string, missionId: string) {
    return `${username}-${missionId}`
  }

  function hasSubmissions(missionId: string) {
    return Object.values(responses).some((response) => response.missionId === missionId)
  }

  function getCalendarDate() {
    if (testMode) {
      return new Date(2026, 11, testDay)
    }

    return new Date()
  }

  function getUserMissions(day: number) {
    console.log('TEST: getUserMissions se está ejecutando')
    console.log('--- Diagnóstico de misiones ---')
    console.log('Día consultado:', day)
    console.log('Usuario actual:', currentUser)
    console.log('¿Es administrador?:', isAdmin)
    console.log('Modo de pruebas:', testMode)
    console.log('Día de prueba:', testDay)

    const today = getCalendarDate()

    console.log('Fecha utilizada:', today.toString())
    console.log('Mes:', today.getMonth())
    console.log('Día:', today.getDate())
    console.log('Misiones cargadas:', missions)

    if (!currentUser || isAdmin) {
      console.log('Bloqueo: no hay usuario o es administrador')
      return []
    }

    if (today.getMonth() !== 11 || day > today.getDate()) {
      console.log('Bloqueo: fecha no válida para este día')
      return []
    }

    const userId = currentUser.toLowerCase()

    const result = missions.filter(
      (mission) =>
        mission.day === day &&
        mission.status === 'prepared' &&
        (mission.assignedTo.length === 0 ||
          mission.assignedTo.includes(userId)),
    )

    console.log('Misiones disponibles para este día:', result)

    return result
  }

  async function handleLogin(username: string, password: string): Promise<void> {
    const normalizedUsername = username.trim().toLowerCase()
    const loginLanguage = getLanguage(normalizedUsername)
    const loginTr = (spanish: string, catalan: string) =>
      translate(loginLanguage, spanish, catalan)
    const email = USER_EMAILS[normalizedUsername]

    if (!email) {
      throw new Error(loginTr('El usuario introducido no existe.', 'Aquest usuari no existeix.'))
    }

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      console.error('Error de inicio de sesión:', error.message)
      throw new Error(loginTr(
        `Error de inicio de sesión: ${error.message}`,
        `Error en iniciar sessió: ${error.message}`,
      ))
    }

    if (!data.user) {
      throw new Error(loginTr(
        'No se ha podido identificar al usuario.',
        'No s’ha pogut identificar l’usuari.',
      ))
    }

    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('username, display_name, role')
      .eq('id', data.user.id)
      .single()

    if (profileError || !profile) {
      console.error('Error al cargar el perfil:', profileError)
      await supabase.auth.signOut()
      throw new Error(
        profileError
          ? loginTr(
            `Error al cargar el perfil: ${profileError.message}`,
            `Error en carregar el perfil: ${profileError.message}`,
          )
          : loginTr(
            'No se ha encontrado el perfil del usuario.',
            'No s’ha trobat el perfil de l’usuari.',
          )
      )
    }

    setCurrentUser(profile.username)
    setLoadingTestSettings(true)
    setLoadingMissions(true)
    setNotice('')
  }

  async function handleLogout() {
    const { error } = await supabase.auth.signOut()

    if (error) {
      console.error('Error al cerrar sesión:', error)
      setNotice(tr(
        'No se ha podido cerrar la sesión. Inténtalo de nuevo.',
        'No s’ha pogut tancar la sessió. Torna-ho a provar.',
      ))
      return
    }

    setCurrentUser(null)
    setLoadingTestSettings(true)
    setSelectedDay(null)
    setSelectedMissionId(null)
    setActivePage('calendar')
    setNotice('')
    setEditingMission(null)
  }

  function getHouseStatus(day: number): HouseStatus {
    if (!currentUser || isAdmin) return 'locked'

    const today = getCalendarDate()

    // El calendario de Adviento solo se desbloquea en diciembre.
    if (today.getMonth() !== 11 || day > today.getDate()) {
      return 'locked'
    }

    const dayMissions = getUserMissions(day)

    // Si no tiene misiones asignadas, el día permanece cerrado.
    if (dayMissions.length === 0) return 'locked'

    const keys = dayMissions.map((mission) =>
      getSubmissionKey(currentUser, mission.id),
    )

    if (keys.every((key) => Boolean(evaluations[key]))) {
      return 'evaluated'
    }

    if (keys.some((key) => Boolean(responses[key]))) {
      return 'submitted'
    }

    return 'available'
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
    setSelectedPhoto(null)
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
      setFormError(tr('Selecciona un archivo de imagen.', 'Selecciona un fitxer d’imatge.'))
      event.target.value = ''
      return
    }
    if (file.size > 5 * 1024 * 1024) {
      setFormError(tr(
        'La fotografía debe ocupar menos de 5 MB.',
        'La fotografia ha d’ocupar menys de 5 MB.',
      ))
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

  async function handleSubmit(event: FormSubmitEvent) {
    event.preventDefault()

    if (selectedDay === null || selectedMissionId === null || !currentUser || isAdmin) {
      return
    }

    const mission = missions.find((item) => item.id === selectedMissionId)
    if (!mission) return

    if (mission.requiresText && !responseText.trim()) {
      setFormError(tr(
        'Escribe tu respuesta antes de enviar la misión.',
        'Escriu la teva resposta abans d’enviar la missió.',
      ))
      return
    }

    if (!mission.requiresText && !responseText.trim() && !selectedPhoto) {
      setFormError(tr(
        'Añade una respuesta o una fotografía antes de enviar.',
        'Afegeix una resposta o una fotografia abans d’enviar.',
      ))
      return
    }

    if (selectedPhoto && !selectedPhoto.type.startsWith('image/')) {
      setFormError(tr(
        'El archivo seleccionado debe ser una imagen.',
        'El fitxer seleccionat ha de ser una imatge.',
      ))
      return
    }

    if (selectedPhoto && selectedPhoto.size > 5 * 1024 * 1024) {
      setFormError(tr(
        'La fotografía no puede superar los 5 MB.',
        'La fotografia no pot superar els 5 MB.',
      ))
      return
    }

    setFormError('')

    try {
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('id')
        .ilike('username', currentUser)
        .single()

      if (profileError) throw profileError

      const { data: existingSubmission, error: existingSubmissionError } =
        await supabase
          .from('submissions')
          .select('photo_path')
          .eq('mission_id', mission.id)
          .eq('participant_id', profile.id)
          .maybeSingle()

      if (existingSubmissionError) throw existingSubmissionError

      let photoPath: string | null = existingSubmission?.photo_path ?? null
      let photoUrl: string | null = null
      console.log('ID del perfil:', profile.id)
      console.log('ID de usuario autenticado:', (await supabase.auth.getUser()).data.user?.id)

      if (selectedPhoto) {
        const extension = selectedPhoto.name.split('.').pop()?.toLowerCase() || 'jpg'
        const fileName = `${crypto.randomUUID()}.${extension}`
        photoPath = `${profile.id}/${mission.id}/${fileName}`

        console.log('Bucket:', 'mission-photos', '| Ruta:', photoPath)

        const { data: sessionData } = await supabase.auth.getSession()
        console.log('Rol de la sesión:', sessionData.session?.user.role)
        console.log('Usuario autenticado:', sessionData.session?.user.id)

        const { error: uploadError } = await supabase.storage
          .from('mission-photos')
          .upload(photoPath, selectedPhoto, {
            upsert: false,
            contentType: selectedPhoto.type,
          })

        if (uploadError) throw uploadError
      }

      const submittedAt = new Date().toISOString()

      const { error: submissionError } = await supabase
        .from('submissions')
        .upsert(
          {
            mission_id: mission.id,
            participant_id: profile.id,
            response_text: responseText.trim() || null,
            photo_path: photoPath,
            submitted_at: submittedAt,
          },
          {
            onConflict: 'mission_id,participant_id',
          },
        )

      if (submissionError) throw submissionError

      const key = getSubmissionKey(currentUser, mission.id)

      // Recuperar la URL de la fotografía después de guardar la respuesta.
      if (photoPath) {
        const { data: photoData, error: photoError } = await supabase.storage
          .from('mission-photos')
          .createSignedUrl(photoPath, 3600)

        if (photoError) throw photoError

        photoUrl = photoData.signedUrl
      }

      setResponses((previous) => ({
        ...previous,
        [key]: {
          username: currentUser,
          missionId: mission.id,
          day: selectedDay,
          text: responseText.trim(),
          photo: photoUrl,
          submittedAt,
        },
      }))

      setEvaluations((previous) => {
        const updated = { ...previous }
        delete updated[key]
        return updated
      })

      closeMission()
      setNotice(tr(
        '¡Misión enviada! Tu respuesta está pendiente de revisión.',
        'Missió enviada! La teva resposta està pendent de revisió.',
      ))

    } catch (error) {
      console.error('Error al enviar la misión:', error)

      const message =
        error instanceof Error ? error.message : JSON.stringify(error)

      setFormError(tr(
        `No se ha podido enviar la misión: ${message}`,
        `No s’ha pogut enviar la missió: ${message}`,
      ))

    }
  }

  async function evaluateSubmission(key: string, stars: number, comment: string) {
    const submission = responses[key]

    if (!submission) {
      setNotice(tr(
        'No se ha encontrado la respuesta que quieres evaluar.',
        'No s’ha trobat la resposta que vols avaluar.',
      ))
      return
    }

    try {
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('id')
        .ilike('username', submission.username)
        .single()

      if (profileError) throw profileError

      const { data: savedSubmission, error: submissionError } = await supabase
        .from('submissions')
        .select('id')
        .eq('mission_id', submission.missionId)
        .eq('participant_id', profile.id)
        .single()

      if (submissionError) throw submissionError

      const { data: adminProfile, error: adminProfileError } = await supabase
        .from('profiles')
        .select('id')
        .ilike('username', currentUser ?? '')
        .single()

      if (adminProfileError) throw adminProfileError

      const { error: evaluationError } = await supabase
        .from('evaluations')
        .upsert(
          {
            submission_id: savedSubmission.id,
            stars,
            comment: comment || null,
            evaluated_by: adminProfile.id,
            evaluated_at: new Date().toISOString(),
          },
          {
            onConflict: 'submission_id',
          },
        )

      if (evaluationError) throw evaluationError

      setEvaluations((previous) => ({
        ...previous,
        [key]: {
          stars,
          comment,
          evaluatedAt: new Date().toISOString(),
        },
      }))

      setNotice(tr('Evaluación guardada correctamente.', 'Avaluació desada correctament.'))


    } catch (error) {
      console.error('Error al guardar la evaluación:', error)

      const message =
        error instanceof Error ? error.message : JSON.stringify(error)

      setNotice(tr(
        `No se ha podido guardar la evaluación: ${message}`,
        `No s’ha pogut desar l’avaluació: ${message}`,
      ))

    }
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
      titleCa: `${mission.titleCa} (còpia)`,
      status: 'draft',
      assignedTo: [...mission.assignedTo],
    })
    setMissionError('')
  }

  async function saveMission(event: FormSubmitEvent) {
    event.preventDefault()
    if (!editingMission) return

    const title = editingMission.title.trim()
    const description = editingMission.description.trim()
    const titleCa = editingMission.titleCa.trim()
    const descriptionCa = editingMission.descriptionCa.trim()

    if (!title || !description || !titleCa || !descriptionCa) {
      setMissionError(tr(
        'Completa el título y la descripción en español y catalán.',
        'Completa el títol i la descripció en castellà i català.',
      ))
      return
    }

    if (
      !Number.isInteger(editingMission.day) ||
      editingMission.day < 1 ||
      editingMission.day > 24
    ) {
      setMissionError(tr(
        'El día debe estar entre el 1 y el 24.',
        'El dia ha d’estar entre l’1 i el 24.',
      ))
      return
    }

    if (editingOriginalId !== null && hasSubmissions(editingOriginalId)) {
      const original = missions.find((item) => item.id === editingOriginalId)

      if (original && original.day !== editingMission.day) {
        const ok = window.confirm(
          tr(
            'Esta misión ya tiene respuestas. Cambiarla de día puede dificultar relacionar las respuestas con la misión original. ¿Quieres continuar?',
            'Aquesta missió ja té respostes. Si la canvies de dia, pot ser més difícil relacionar-les amb la missió original. Vols continuar?',
          ),
        )
        if (!ok) return
      }
    }

    const cleanedMission: Mission = {
      ...editingMission,
      id: editingMission.id || createMissionId(),
      title,
      description,
      titleCa,
      descriptionCa,
      assignedTo: [...editingMission.assignedTo],
    }

    try {
      const missionData = {
        day: cleanedMission.day,
        title: cleanedMission.title,
        description: cleanedMission.description,
        title_es: cleanedMission.title,
        description_es: cleanedMission.description,
        title_ca: cleanedMission.titleCa,
        description_ca: cleanedMission.descriptionCa,
        duration_minutes: 10,
        requires_text: cleanedMission.requiresText,
        allows_photo: cleanedMission.allowsPhoto,
        status: cleanedMission.status,
      }

      let savedMissionId = cleanedMission.id

      if (editingOriginalId !== null) {
        const { error } = await supabase
          .from('missions')
          .update(missionData)
          .eq('id', editingOriginalId)

        if (error) throw error

        savedMissionId = editingOriginalId
      } else {
        const { data, error } = await supabase
          .from('missions')
          .insert(missionData)
          .select('id')
          .single()

        if (error) throw error

        savedMissionId = data.id
      }

      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('id, username')

      if (profilesError) throw profilesError

      const participantIds = new Map(
        (profiles ?? []).map((profile) => [
          profile.username.toLowerCase(),
          profile.id,
        ]),
      )

      const selectedProfileIds = cleanedMission.assignedTo
        .map((username) => participantIds.get(username.toLowerCase()))
        .filter((id): id is string => Boolean(id))

      const { error: deleteError } = await supabase
        .from('mission_assignments')
        .delete()
        .eq('mission_id', savedMissionId)

      if (deleteError) throw deleteError

      if (selectedProfileIds.length > 0) {
        const { error: insertError } = await supabase
          .from('mission_assignments')
          .insert(
            selectedProfileIds.map((participantId) => ({
              mission_id: savedMissionId,
              participant_id: participantId,
            })),
          )

        if (insertError) throw insertError
      }

      const savedMission: Mission = {
        ...cleanedMission,
        id: savedMissionId,
      }

      setMissions((previous) => {
        const withoutOriginal =
          editingOriginalId === null
            ? previous
            : previous.filter((item) => item.id !== editingOriginalId)

        return [...withoutOriginal, savedMission].sort(
          (a, b) => a.day - b.day || a.title.localeCompare(b.title),
        )
      })

      setEditingMission(null)
      setEditingOriginalId(null)
      setMissionError('')
      setNotice(tr(
        `Misión del día ${savedMission.day} guardada correctamente.`,
        `Missió del dia ${savedMission.day} desada correctament.`,
      ))
    } catch (error) {
      console.error('Error al guardar la misión:', error)

      const message =
        error instanceof Error
          ? error.message
          : JSON.stringify(error)

      setMissionError(tr(
        `Error al guardar: ${message}`,
        `Error en desar: ${message}`,
      ))
    }
  }

  async function deleteMission(mission: Mission) {
    const submissionsExist = hasSubmissions(mission.id)

    const message = submissionsExist
      ? tr(
        `La misión «${mission.title}» del día ${mission.day} tiene respuestas asociadas. Si la eliminas, las respuestas podrían verse afectadas. ¿Eliminar de todos modos?`,
        `La missió «${mission.titleCa || mission.title}» del dia ${mission.day} té respostes associades. Si l’elimines, les respostes se’n podrien veure afectades. Vols eliminar-la igualment?`,
      )
      : tr(
        `¿Quieres eliminar la misión «${mission.title}» del día ${mission.day}?`,
        `Vols eliminar la missió «${mission.titleCa || mission.title}» del dia ${mission.day}?`,
      )

    if (!window.confirm(message)) return

    const { error } = await supabase
      .from('missions')
      .delete()
      .eq('id', mission.id)

    if (error) {
      console.error('Error al eliminar la misión:', error)
      setNotice(tr(
        `No se ha podido eliminar la misión «${mission.title}».`,
        `No s’ha pogut eliminar la missió «${mission.titleCa || mission.title}».`,
      ))
      return
    }

    setMissions((previous) =>
      previous.filter((item) => item.id !== mission.id)
    )

    setEditingMission(null)
    setNotice(tr(
      `Misión «${mission.title}» eliminada correctamente.`,
      `Missió «${mission.titleCa || mission.title}» eliminada correctament.`,
    ))
  }

  if (checkingSession) {
    return null
  }

  if (loadingMissions) {
    return null
  }

  if (currentUser && loadingTestSettings) {
    return null
  }

  if (!currentUser) {
    return <LoginPage onLogin={handleLogin} />
  }

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
            <p className="village-eyebrow">{tr('Calendario familiar', 'Calendari familiar')}</p>
            <h1>{tr('Panel de administración', 'Panell d’administració')}</h1>
            <p className="village-subtitle">{tr('Gestiona las misiones y revisa las respuestas.', 'Gestiona les missions i revisa les respostes.')}</p>
          </div>
          <button type="button" className="logout-button" onClick={handleLogout}>{tr('Cerrar sesión', 'Tanca la sessió')}</button>
        </header>

        <nav className="admin-tabs" aria-label={tr('Secciones de administración', 'Seccions d’administració')}>
          <button type="button" className={adminTab === 'missions' ? 'is-active' : ''} onClick={() => { setAdminTab('missions'); setEditingMission(null) }}>
            {tr('Gestionar misiones', 'Gestiona les missions')} <span>{missions.length} {tr('misiones', 'missions')}</span>
          </button>
          <button type="button" className={adminTab === 'submissions' ? 'is-active' : ''} onClick={() => { setAdminTab('submissions'); setEditingMission(null) }}>
            {tr('Respuestas', 'Respostes')} <span>{allSubmissions.length}</span>
          </button>
        </nav>

        {notice && <div className="app-notice" role="status">{notice}<button type="button" onClick={() => setNotice('')} aria-label={tr('Cerrar aviso', 'Tanca l’avís')}>×</button></div>}

        {adminTab === 'missions' && (
          <>
            <div className="test-calendar-panel">
              <h3>🧪 {tr('Modo de pruebas del calendario', 'Mode de proves del calendari')}</h3>

              <label className="test-calendar-toggle">
                <input
                  type="checkbox"
                  checked={testMode}
                  disabled={savingTestSettings}
                  onChange={(event) => {
                    void saveCalendarSettings(event.target.checked, testDay)
                  }}
                />
                {tr('Activar modo de pruebas', 'Activa el mode de proves')}
              </label>

              {testMode && (
                <div className="form-field">
                  <label htmlFor="test-calendar-day">
                    {tr('Simular día de diciembre', 'Simula un dia de desembre')}
                  </label>

                  <select
                    id="test-calendar-day"
                    value={testDay}
                    disabled={savingTestSettings}
                    onChange={(event) => {
                      void saveCalendarSettings(testMode, Number(event.target.value))
                    }}
                  >
                    {Array.from({ length: 24 }, (_, index) => index + 1).map((day) => (
                      <option key={day} value={day}>
                        {tr(`Día ${day}`, `Dia ${day}`)}
                      </option>
                    ))}
                  </select>

                  <p>
                    {tr(
                      `Estás simulando el día ${testDay} de diciembre. Las misiones asignadas y preparadas hasta ese día deberían estar disponibles.`,
                      `Estàs simulant el dia ${testDay} de desembre. Les missions assignades i preparades fins aquell dia haurien d’estar disponibles.`,
                    )}
                  </p>
                </div>
              )}
            </div>
            <section className="mission-manager">
              <div className="manager-heading">
                <div>
                  <h2>{tr('Las 24 ventanas del calendario', 'Les 24 finestres del calendari')}</h2>
                  <p>{tr('Crea las misiones con antelación. Solo las marcadas como preparadas aparecerán en el calendario familiar.', 'Prepara les missions amb antelació. Només les que estiguin marcades com a preparades apareixeran al calendari familiar.')}</p>
                </div>
                <button type="button" className="mission-action manager-new-button" onClick={() => startNewMission(1)}>
                  + {tr('Nueva misión', 'Missió nova')}
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
                        <span className={`mission-state-pill ${dayMissions.some((mission) => mission.status === 'prepared') ? 'is-prepared' : ''}`}>{dayMissions.length ? `${dayMissions.length} ${tr('misión(es)', 'missió/ons')}` : tr('Vacío', 'Buit')}</span>
                      </div>
                      <div className="day-preparation-status" aria-live="polite">
                        {allParticipantsPrepared ? (
                          <span className="day-preparation-badge day-preparation-badge--complete">✓ {tr('Día completo · 4/4 preparadas', 'Dia complet · 4/4 preparades')}</span>
                        ) : preparedParticipantCount > 0 ? (
                          <span className="day-preparation-badge">{tr(`${preparedParticipantCount}/4 personas con misión preparada`, `${preparedParticipantCount}/4 persones amb una missió preparada`)}</span>
                        ) : (
                          <span className="day-preparation-badge day-preparation-badge--empty">{tr('Aún faltan misiones preparadas', 'Encara falten missions preparades')}</span>
                        )}
                      </div>
                      {dayMissions.length === 0 && <p className="mission-day-card__description">{tr('Todavía no hay misiones para este día.', 'Encara no hi ha missions per a aquest dia.')}</p>}
                      <div className="mission-day-mission-list">
                        {dayMissions.map((mission) => (
                          <div className="mission-day-mission" key={mission.id}>
                            <h3>{language === 'ca' && mission.titleCa.trim().length < 3
                              ? mission.title
                              : getMissionTitle(mission, language)}</h3>
                            <p className="mission-day-card__description">{language === 'ca' && mission.titleCa.trim().length < 3
                              ? mission.description
                              : getMissionDescription(mission, language)}</p>
                            <div className="mission-day-card__meta">
                              <span>{mission.assignedTo.length ? mission.assignedTo.map((id) => PARTICIPANTS.find((participant) => participant.id === id)?.label ?? id).join(', ') : tr('Toda la familia', 'Tota la família')}</span>
                              <span>{mission.status === 'prepared' ? tr('Preparada', 'Preparada') : tr('Borrador', 'Esborrany')}</span>
                              {(!mission.titleCa || !mission.descriptionCa) && <span>{tr('Falta la traducción al catalán', 'Falta la traducció al català')}</span>}
                            </div>
                            <div className="mission-day-card__actions">
                              <button type="button" onClick={() => startEditMission(mission)}>{tr('Editar', 'Edita')}</button>
                              <button type="button" onClick={() => duplicateMission(mission)}>{tr('Duplicar', 'Duplica')}</button>
                              <button type="button" className="is-danger" onClick={() => deleteMission(mission)}>{tr('Eliminar', 'Elimina')}</button>
                            </div>
                          </div>
                        ))}
                      </div>
                      <div className="mission-day-card__meta">
                        {submissionCount > 0 && <span>✉ {submissionCount} {tr('respuesta(s)', 'resposta/es')}</span>}
                      </div>
                      <div className="mission-day-card__actions">
                        <button type="button" className="is-primary" onClick={() => startNewMission(day)}>+ {tr('Añadir misión', 'Afegeix una missió')}</button>
                      </div>
                    </article>
                  )
                })}
              </div>

              {editingMission && (
                <div className="mission-overlay" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) { setEditingMission(null); setMissionError('') } }}>
                  <section className="mission-card mission-editor-card" role="dialog" aria-modal="true" aria-labelledby="mission-editor-title">
                    <button type="button" className="mission-close" onClick={() => { setEditingMission(null); setMissionError('') }} aria-label={tr('Cerrar editor', 'Tanca l’editor')}>×</button>
                    <p className="mission-day">{editingOriginalId === null ? tr('NUEVA MISIÓN', 'MISSIÓ NOVA') : tr(`EDITAR DÍA ${editingMission.day}`, `EDITA EL DIA ${editingMission.day}`)}</p>
                    <h2 id="mission-editor-title">{editingOriginalId === null ? tr('Preparar una misión', 'Prepara una missió') : tr('Editar misión', 'Edita la missió')}</h2>
                    <form className="mission-form mission-editor-form" onSubmit={saveMission}>
                      <div className="form-field">
                        <label htmlFor="mission-day-number">{tr('Día del calendario', 'Dia del calendari')}</label>
                        <select id="mission-day-number" value={editingMission.day} onChange={(event) => setEditingMission({ ...editingMission, day: Number(event.target.value) })}>
                          {Array.from({ length: 24 }, (_, i) => i + 1).map((day) => <option key={day} value={day}>{tr(`Día ${day}`, `Dia ${day}`)}</option>)}
                        </select>
                      </div>
                      <div className="form-field">
                        <label htmlFor="mission-title-input">{tr('Título en español', 'Títol en castellà')}</label>
                        <input id="mission-title-input" value={editingMission.title} onChange={(event) => setEditingMission({ ...editingMission, title: event.target.value })} placeholder={tr('Ej. Un paseo especial', 'Ex.: Un passeig especial')} />
                      </div>
                      <div className="form-field">
                        <label htmlFor="mission-description-input">{tr('Descripción e instrucciones en español', 'Descripció i instruccions en castellà')}</label>
                        <textarea id="mission-description-input" rows={4} value={editingMission.description} onChange={(event) => setEditingMission({ ...editingMission, description: event.target.value })} placeholder={tr('Explica qué debe hacer la persona...', 'Explica què ha de fer la persona...')} />
                      </div>
                      <div className="form-field">
                        <label htmlFor="mission-title-ca-input">{tr('Título en catalán', 'Títol en català')}</label>
                        <input id="mission-title-ca-input" value={editingMission.titleCa} onChange={(event) => setEditingMission({ ...editingMission, titleCa: event.target.value })} placeholder="Ex.: Una passejada especial" />
                      </div>
                      <div className="form-field">
                        <label htmlFor="mission-description-ca-input">{tr('Descripción e instrucciones en catalán', 'Descripció i instruccions en català')}</label>
                        <textarea id="mission-description-ca-input" rows={4} value={editingMission.descriptionCa} onChange={(event) => setEditingMission({ ...editingMission, descriptionCa: event.target.value })} placeholder="Explica què ha de fer la persona..." />
                      </div>

                      <fieldset className="editor-fieldset">
                        <legend>{tr('¿Quién debe hacerla?', 'Qui l’ha de fer?')}</legend>
                        <p className="editor-help">{tr('Si no marcas a nadie, la misión será para cualquier participante.', 'Si no marques ningú, la missió serà per a qualsevol participant.')}</p>
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
                        <legend>{tr('Tipo de respuesta', 'Tipus de resposta')}</legend>
                        <label className="editor-switch"><input type="checkbox" checked={editingMission.requiresText} onChange={(event) => setEditingMission({ ...editingMission, requiresText: event.target.checked })} /> {tr('Requiere respuesta escrita', 'Requereix una resposta escrita')}</label>
                        <label className="editor-switch"><input type="checkbox" checked={editingMission.allowsPhoto} onChange={(event) => setEditingMission({ ...editingMission, allowsPhoto: event.target.checked })} /> {tr('Permite adjuntar fotografía', 'Permet adjuntar-hi una fotografia')}</label>
                      </fieldset>

                      <fieldset className="editor-fieldset">
                        <legend>{tr('Estado de la misión', 'Estat de la missió')}</legend>
                        <label className="editor-switch"><input type="radio" name="mission-status" checked={editingMission.status === 'draft'} onChange={() => setEditingMission({ ...editingMission, status: 'draft' as MissionStatus })} /> {tr('Borrador (no visible)', 'Esborrany (no visible)')}</label>
                        <label className="editor-switch"><input type="radio" name="mission-status" checked={editingMission.status === 'prepared'} onChange={() => setEditingMission({ ...editingMission, status: 'prepared' as MissionStatus })} /> {tr('Preparada (visible cuando corresponda)', 'Preparada (visible quan correspongui)')}</label>
                      </fieldset>

                      {missionError && <p className="login-error" role="alert">{missionError}</p>}
                      <div className="editor-form-actions">
                        <button type="button" className="editor-cancel-button" onClick={() => { setEditingMission(null); setMissionError('') }}>{tr('Cancelar', 'Cancel·la')}</button>
                        <button type="submit" className="mission-action">{tr('Guardar misión', 'Desa la missió')}</button>
                      </div>
                    </form>
                  </section>
                </div>
              )}
            </section>
          </>
        )}

        {adminTab === 'submissions' && (
          <>
            <section className="admin-summary">
                <article><span>{tr('Respuestas recibidas', 'Respostes rebudes')}</span><strong>{allSubmissions.length}</strong></article>
                <article><span>{tr('Pendientes de revisar', 'Pendents de revisar')}</span><strong>{allSubmissions.filter(([key]) => !evaluations[key]).length}</strong></article>
                <article><span>{tr('Evaluadas', 'Avaluades')}</span><strong>{allSubmissions.filter(([key]) => evaluations[key]).length}</strong></article>
            </section>
              <nav className="admin-filters" aria-label={tr('Filtrar respuestas', 'Filtra les respostes')}>
                <button type="button" className={adminFilter === 'all' ? 'is-active' : ''} onClick={() => setAdminFilter('all')}>{tr('Todas', 'Totes')}</button>
                <button type="button" className={adminFilter === 'pending' ? 'is-active' : ''} onClick={() => setAdminFilter('pending')}>{tr('Pendientes', 'Pendents')}</button>
                <button type="button" className={adminFilter === 'evaluated' ? 'is-active' : ''} onClick={() => setAdminFilter('evaluated')}>{tr('Evaluadas', 'Avaluades')}</button>
            </nav>
            {filteredSubmissions.length === 0 ? (
                <section className="admin-empty"><span aria-hidden="true">❄</span><h2>{tr('Aún no hay respuestas aquí', 'Encara no hi ha respostes')}</h2><p>{tr('Cuando alguien envíe una misión, podrás revisarla y asignarle estrellas desde esta pantalla.', 'Quan algú enviï una missió, podràs revisar-la i puntuar-la des d’aquesta pantalla.')}</p></section>
            ) : (
              <section className="submission-list">
                {filteredSubmissions.map(([key, submission]) => (
                  <SubmissionCard
                    key={key}
                    submission={submission}
                    mission={missions.find((item) => item.id === submission.missionId)}
                    evaluation={evaluations[key]}
                    onEvaluate={(stars, comment) => evaluateSubmission(key, stars, comment)}
                    language={language}
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
  const calendarDate = getCalendarDate()
  const currentCalendarDay = calendarDate.getMonth() === 11 ? calendarDate.getDate() : null
  const houseStates = initialHouses.map((house) => {
    const status = getHouseStatus(house.day)
    const stars = status === 'evaluated' && currentUser
      ? missions.filter(
        (mission) =>
          mission.day === house.day &&
          mission.status === 'prepared' &&
          mission.assignedTo.includes(currentUser.toLowerCase()),
      ).reduce(
        (total, mission) => total + (evaluations[getSubmissionKey(currentUser, mission.id)]?.stars ?? 0),
        0,
      )
      : 0
    return { ...house, status, stars, isCurrentDay: house.day === currentCalendarDay }
  })
  const litHouses = houseStates
    .filter((house) => house.status !== 'locked')
    .map((house) => house.day)

  if (activePage === 'characters') {
    return <Characters onBack={() => setActivePage('calendar')} username={currentUser} />
  }

  return (
    <main className="village-app village-app--full-map">
      <header className="top-bar">
        <div className="brand">
          <span className="brand-icon" aria-hidden="true">🌲</span>
          <span>{tr('Calendario de adviento', 'Calendari d’advent')}</span>
        </div>
        <details className="account-menu">
          <summary className="account-menu__trigger" aria-label={tr(`Opciones de ${currentUser}`, `Opcions de ${currentUser}`)}>
            <span className="account-menu__avatar" aria-hidden="true">👩🏻</span>
            <span>{currentUser}</span>
            <span className="account-menu__chevron" aria-hidden="true">▾</span>
          </summary>
          <div className="account-menu__dropdown">
            <button type="button" onClick={() => setActivePage('characters')}>{tr('Personajes', 'Personatges')}</button>
            <button type="button" onClick={handleLogout}>{tr('Cerrar sesión', 'Tanca la sessió')}</button>
          </div>
        </details>
      </header>

      <section className="map-container map-container--full" aria-label={tr('Mapa del pueblo nevado', 'Mapa del poble nevat')}>
        <div className="village-calendar-map">
          <VillageScene
            litHouses={litHouses}
            highlightedHouse={currentCalendarDay ?? undefined}
            currentUser={currentUser ?? undefined}
          />
          {houseStates.map((house) => {
            const stateLabel = house.isCurrentDay
              ? tr('Día actual', 'Dia actual')
              : house.status === 'locked'
                ? tr('Día futuro o bloqueado', 'Dia futur o bloquejat')
                : house.status === 'available'
                  ? tr('Misión pendiente de enviar', 'Missió pendent d’enviar')
                  : house.status === 'submitted'
                    ? tr('Misión enviada', 'Missió enviada')
                    : tr(
                      `Misión evaluada: ${house.stars} estrellas`,
                      `Missió avaluada: ${house.stars} estrelles`,
                    )
            return (
              <button
                key={house.day}
                type="button"
                className={`map-house-marker map-house-marker--${house.status}${house.isCurrentDay ? ' map-house-marker--today' : ''}`}
                style={{ left: `${house.x}%`, top: `${house.y}%` }}
                onClick={() => openMission(house.day)}
                disabled={house.status === 'locked'}
                aria-label={tr(`Día ${house.day}: ${stateLabel}`, `Dia ${house.day}: ${stateLabel}`)}
              >
                {house.isCurrentDay && (
                  <span className="map-house-marker__badge map-house-marker__badge--today" aria-hidden="true">✦</span>
                )}
                {!house.isCurrentDay && house.status === 'available' && (
                  <span className="map-house-marker__badge map-house-marker__badge--pending" aria-label={tr('Misión pendiente', 'Missió pendent')}>✦</span>
                )}
                {house.status === 'submitted' && (
                  <span className="map-house-marker__badge map-house-marker__badge--submitted" aria-label={tr('Misión enviada', 'Missió enviada')}>✓</span>
                )}
                {house.status === 'evaluated' && (
                  <span className="map-house-marker__badge map-house-marker__badge--evaluated" aria-label={tr(`Evaluada con ${house.stars} estrellas`, `Avaluada amb ${house.stars} estrelles`)}>
                    <span aria-hidden="true">★</span>
                    <span className="map-house-marker__score">{house.stars}</span>
                  </span>
                )}
              </button>
            )
          })}
        </div>
        <div className="star-counter" aria-label={tr('125 estrellas', '125 estrelles')}>
          <span className="star-icon" aria-hidden="true">⭐</span>
          <span className="star-number">125</span>
          <span className="star-label">{tr('estrellas', 'estrelles')}</span>
        </div>
      </section>

      {selectedMission && selectedDay !== null && (
        <div className="mission-overlay" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) closeMission() }}>
          <section className="mission-card" role="dialog" aria-modal="true" aria-labelledby="mission-title">
            <button type="button" className="mission-close" onClick={closeMission} aria-label={tr('Cerrar misión', 'Tanca la missió')}>×</button>
            <p className="mission-day">{tr(`DÍA ${selectedMission.day}`, `DIA ${selectedMission.day}`)}</p>
            {language === 'ca' && (!selectedMission.titleCa || !selectedMission.descriptionCa) && (
              <p className="mission-day-card__description" role="status">
                Aquesta missió encara no està traduïda al català; es mostra en castellà.
              </p>
            )}
            <h2 id="mission-title">{getMissionTitle(selectedMission, language)}</h2>
            <p className="mission-description">{getMissionDescription(selectedMission, language)}</p>
            <div className="mission-meta"><span>{selectedStatus === 'evaluated' ? tr('✓ Evaluada', '✓ Avaluada') : selectedStatus === 'submitted' ? tr('✓ Enviada', '✓ Enviada') : tr('✦ Tu misión', '✦ La teva missió')}</span></div>
            {currentEvaluation && <div className="participant-evaluation"><p>{tr('Tu misión ha sido evaluada', 'La teva missió ha estat avaluada')}</p><div className="evaluation-stars" aria-label={tr(`${currentEvaluation.stars} estrellas`, `${currentEvaluation.stars} estrelles`)}>{'★'.repeat(currentEvaluation.stars)}{'☆'.repeat(3 - currentEvaluation.stars)}</div>{currentEvaluation.comment && <p>{currentEvaluation.comment}</p>}</div>}
            <form className="mission-form" onSubmit={handleSubmit}>
              {currentResponse?.photo && (<div className="form-field"> <label>{tr('Fotografía enviada', 'Fotografia enviada')}</label> <img className="submission-photo" src={currentResponse.photo} alt={tr('Fotografía que enviaste para esta misión', 'Fotografia que has enviat per a aquesta missió')} /> </div>)}
              {selectedMission.requiresText && <div className="form-field"><label htmlFor="mission-response">{tr('Tu respuesta', 'La teva resposta')}</label><textarea id="mission-response" rows={4} value={responseText} onChange={(event) => setResponseText(event.target.value)} placeholder={tr('Escribe aquí tu respuesta...', 'Escriu aquí la teva resposta...')} required /></div>}
              {selectedMission.allowsPhoto && <div className="form-field"><label htmlFor="mission-photo">{tr('Añadir fotografía', 'Afegeix una fotografia')}</label><input id="mission-photo" type="file" accept="image/*" onChange={handlePhotoChange} />{selectedPhoto && <span className="selected-photo">{tr('Fotografía seleccionada:', 'Fotografia seleccionada:')} {selectedPhoto.name}<button type="button" onClick={() => setSelectedPhoto(null)}>{tr('Quitar', 'Treu')}</button></span>}</div>}
              {formError && <p className="login-error" role="alert">{formError}</p>}
              <button type="submit" className="mission-action">{currentResponse ? tr('Actualizar respuesta', 'Actualitza la resposta') : tr('Enviar misión', 'Envia la missió')}</button>
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
  language: ReturnType<typeof getLanguage>
}

function SubmissionCard({ submission, mission, evaluation, onEvaluate, language }: SubmissionCardProps) {
  const [stars, setStars] = useState(evaluation?.stars ?? 3)
  const [comment, setComment] = useState(evaluation?.comment ?? '')
  const tr = (spanish: string, catalan: string) => translate(language, spanish, catalan)

  return (
    <article className="submission-card">
      <div className="submission-card__header"><div><p className="submission-day">{tr(`DÍA ${submission.day}`, `DIA ${submission.day}`)}</p><h2>{mission ? getMissionTitle(mission, language) : tr('Misión eliminada o modificada', 'Missió eliminada o modificada')}</h2><p className="submission-user">{tr('Respuesta de', 'Resposta de')} <strong>{submission.username}</strong></p></div><span className={`submission-status ${evaluation ? 'submission-status--evaluated' : ''}`}>{evaluation ? tr('Evaluada', 'Avaluada') : tr('Pendiente', 'Pendent')}</span></div>
      {submission.text && <div className="submission-answer"><h3>{tr('Respuesta', 'Resposta')}</h3><p>{submission.text}</p></div>}
      {submission.photo && (<div className="submission-answer"> <h3>{tr('Fotografía adjunta', 'Fotografia adjunta')}</h3> <img className="submission-photo" src={submission.photo} alt={tr(`Fotografía enviada por ${submission.username}`, `Fotografia enviada per ${submission.username}`)} /> </div>)}
      <p>{tr('URL de la imagen recuperada correctamente', 'URL de la imatge recuperada correctament')}</p>
      <p className="submission-date">{tr('Enviada el', 'Enviada el')} {new Date(submission.submittedAt).toLocaleString(language === 'ca' ? 'ca-ES' : 'es-ES')}</p>
      <div className="submission-evaluation"><h3>{tr('Asignar estrellas', 'Assigna estrelles')}</h3><div className="star-picker" role="group" aria-label={tr('Puntuación', 'Puntuació')}>{[1, 2, 3].map((value) => <button key={value} type="button" className={value <= stars ? 'star-picker__active' : ''} onClick={() => setStars(value)} aria-label={`${value} ${value === 1 ? tr('estrella', 'estrella') : tr('estrellas', 'estrelles')}`} aria-pressed={stars === value}>★</button>)}</div>
        <label className="admin-comment-label">{tr('Comentario (opcional)', 'Comentari (opcional)')}<textarea rows={2} value={comment} onChange={(event) => setComment(event.target.value)} placeholder={tr('Escribe un mensaje para esta persona...', 'Escriu un missatge per a aquesta persona...')} /></label>
        <button type="button" className="mission-action" onClick={() => onEvaluate(stars, comment.trim())}>{evaluation ? tr('Actualizar evaluación', 'Actualitza l’avaluació') : tr('Guardar evaluación', 'Desa l’avaluació')}</button>
        {evaluation && <p className="evaluation-saved">{tr('Puntuación guardada:', 'Puntuació desada:')} {'★'.repeat(evaluation.stars)}{'☆'.repeat(3 - evaluation.stars)}</p>}
      </div>
    </article>
  )
}

export default App
