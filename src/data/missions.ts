export type MissionStatus = 'draft' | 'prepared'

export type Mission = {
  id: string
  day: number
  title: string
  description: string
  titleCa: string
  descriptionCa: string
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
