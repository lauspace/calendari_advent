import { VillageCharacters } from "./VillageCharacters";
import type { VillageCharacterData } from "./data/characters";
import type { Language } from "../../i18n";

export function VillageCharacterLayer({
  characters,
  language,
}: {
  characters: VillageCharacterData[];
  language: Language;
}) {
  return <VillageCharacters characters={characters} language={language} />;
}
