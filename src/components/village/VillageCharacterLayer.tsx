import { VillageCharacters } from "./VillageCharacters";
import type { VillageCharacterData } from "./data/characters";

export function VillageCharacterLayer({ characters }: { characters: VillageCharacterData[] }) {
  return <VillageCharacters characters={characters} />;
}
