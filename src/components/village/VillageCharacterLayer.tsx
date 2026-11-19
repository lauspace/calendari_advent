import type { ReactNode } from "react";
import { VillageCharacters } from "./VillageCharacters";
import type { VillageCharacterData } from "./data/characters";
import type { Language } from "../../i18n";

export function VillageCharacterLayer({
  characters,
  language,
  renderScene,
}: {
  characters: VillageCharacterData[];
  language: Language;
  renderScene: (models: ReactNode, overlay: ReactNode) => ReactNode;
}) {
  return (
    <VillageCharacters
      characters={characters}
      language={language}
      renderScene={renderScene}
    />
  );
}
