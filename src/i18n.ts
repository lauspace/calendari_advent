export type Language = "es" | "ca";

export function getLanguage(username?: string | null): Language {
  const user = username?.trim().toLowerCase();
  return user === "albert" || user === "ana" || user === "admin" ? "ca" : "es";
}

export function translate(language: Language, spanish: string, catalan: string): string {
  return language === "ca" ? catalan : spanish;
}

export function getMissionTitle(
  mission: { title: string; titleCa: string },
  language: Language,
): string {
  return language === "ca" ? mission.titleCa || mission.title : mission.title;
}

export function getMissionDescription(
  mission: { description: string; descriptionCa: string },
  language: Language,
): string {
  return language === "ca"
    ? mission.descriptionCa || mission.description
    : mission.description;
}

const CATALAN_CHARACTER_NAMES: Record<string, string> = {
  "Marine Espacial": "Marine espacial",
  Chaos: "Caos",
  Orco: "Orc",
  "Mastín de Khorne": "Mastí de Khorne",
  Elfo: "Elf",
  Cascanueces: "Trencanous",
  Pingüino: "Pingüí",
  Reno: "Ren",
  "Papá Noel": "Pare Noel",
  "Muñeco de nieve": "Ninot de neu",
  Panadero: "Forner",
};

export function getCharacterName(name: string, language: Language): string {
  return language === "ca" ? CATALAN_CHARACTER_NAMES[name] ?? name : name;
}
