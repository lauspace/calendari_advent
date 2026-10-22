export type Mission = {
day: number
title: string
description: string
durationMinutes: number
requiresText: boolean
allowsPhoto: boolean
}

export const missions: Mission[] = [
{
day: 1,
title: 'Un pequeño recuerdo',
description:
'Busca una fotografía que te recuerde a un momento bonito con la familia. Cuéntanos qué ocurrió, por qué lo recuerdas con cariño o qué es lo que más te gusta de ese día.',
durationMinutes: 10,
requiresText: true,
allowsPhoto: true,
},
{
day: 2,
title: 'Un momento para ti',
description:
'Dedica unos minutos a hacer algo que te guste y que normalmente dejas para más tarde. Después, cuéntanos qué has elegido.',
durationMinutes: 10,
requiresText: true,
allowsPhoto: false,
},
{
day: 3,
title: 'Una pequeña sorpresa',
description:
'Piensa en un pequeño detalle que pueda alegrarle el día a alguien de la familia. ¡No hace falta gastar dinero!',
durationMinutes: 10,
requiresText: true,
allowsPhoto: true,
},
]
