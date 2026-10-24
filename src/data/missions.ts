export type MissionStatus = 'draft' | 'prepared'

export type Mission = {
  id: string
  day: number
  title: string
  description: string
  durationMinutes: number
  requiresText: boolean
  allowsPhoto: boolean
  assignedTo: string[]
  status: MissionStatus
}

export const PARTICIPANTS = [
{ id: 'jordi', label: 'Jordi' },
{ id: 'caty', label: 'Caty' },
{ id: 'ana', label: 'Ana' },
{ id: 'albert', label: 'Albert' },
] as const


// Una lista assignedTo vacía significa que la misión es para cualquier participante.
// Cada misión tiene un id propio: pueden existir varias misiones en el mismo día.
// De momento, estos datos viven en memoria; más adelante se guardarán en Supabase.
export const initialMissions: Mission[] = [
  {
    id: 'mission-day-1-memory',
    day: 1,
    title: 'Un pequeño recuerdo',
    description:
      'Busca una fotografía que te recuerde a un momento bonito con la familia. Cuéntanos qué ocurrió, por qué lo recuerdas con cariño o qué es lo que más te gusta de ese día.',
    durationMinutes: 10,
    requiresText: true,
    allowsPhoto: true,
    assignedTo: [],
    status: 'prepared',
  },
  {
    id: 'mission-day-2-time-for-yourself',
    day: 2,
    title: 'Un momento para ti',
    description:
      'Dedica unos minutos a hacer algo que te guste y que normalmente dejas para más tarde. Después, cuéntanos qué has elegido.',
    durationMinutes: 10,
    requiresText: true,
    allowsPhoto: false,
    assignedTo: [],
    status: 'draft',
  },
  {
    id: 'mission-day-3-surprise',
    day: 3,
    title: 'Una pequeña sorpresa',
    description:
      'Piensa en un pequeño detalle que pueda alegrarle el día a alguien de la familia. ¡No hace falta gastar dinero!',
    durationMinutes: 10,
    requiresText: true,
    allowsPhoto: true,
    assignedTo: [],
    status: 'draft',
  },
]
