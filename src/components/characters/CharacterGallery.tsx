import { Canvas } from "@react-three/fiber";
import { PerspectiveCamera, View, useGLTF } from "@react-three/drei";
import { clone } from "three/addons/utils/SkeletonUtils.js";
import {
  Component,
  Suspense,
  useEffect,
  useMemo,
  useRef,
  useState,
  useCallback,
  type PointerEvent as ReactPointerEvent,
  type ReactNode,
  type RefObject,
} from "react";
import { Box3, Vector3, type Group } from "three";
import { getCharactersForUser } from "../village/data/characters";
import { translate, type Language } from "../../i18n";
import { assetUrl } from "../../lib/assetUrl";

function useNearViewport(ref: RefObject<HTMLElement | null>): boolean {
  const [isNearViewport, setIsNearViewport] = useState(
    () => typeof IntersectionObserver === "undefined",
  );

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    if (typeof IntersectionObserver === "undefined") return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          setIsNearViewport(true);
          observer.disconnect();
        }
      },
      { rootMargin: "160px" },
    );
    observer.observe(element);

    return () => observer.disconnect();
  }, [ref]);

  return isNearViewport;
}

function CharacterModel({
  modelPath,
  onLoad,
  rotation,
}: {
  modelPath: string;
  onLoad: () => void;
  rotation: RefObject<Group | null>;
}) {
  const { scene } = useGLTF(assetUrl(modelPath));
  const model = useMemo(() => clone(scene), [scene]);
  const bounds = useMemo(() => new Box3().setFromObject(model), [model]);
  const size = useMemo(() => bounds.getSize(new Vector3()), [bounds]);
  const center = useMemo(() => bounds.getCenter(new Vector3()), [bounds]);
  const scale = 2.45 / Math.max(size.x, size.y, size.z);

  useEffect(() => onLoad(), [onLoad]);

  if (!Number.isFinite(scale) || scale <= 0) {
    throw new Error(`The character model "${modelPath}" has no visible geometry.`);
  }

  return (
    <group ref={rotation}>
      <group
        scale={scale}
        position={[-center.x * scale, -bounds.min.y * scale, -center.z * scale]}
      >
        <primitive object={model} />
      </group>
    </group>
  );
}

class CharacterModelErrorBoundary extends Component<
  { children: ReactNode; name: string; language: Language },
  { hasError: boolean }
> {
  state = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: Error) {
    console.error(translate(
      this.props.language,
      `No se pudo cargar el personaje "${this.props.name}".`,
      `No s’ha pogut carregar el personatge "${this.props.name}".`,
    ), error);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="character-card__model-error" role="status">
          {translate(this.props.language, "No se pudo cargar este personaje.", "No s’ha pogut carregar aquest personatge.")}
        </div>
      );
    }
    return this.props.children;
  }
}

function CharacterCard({
  character,
  index,
  language,
}: {
  character: ReturnType<typeof getCharactersForUser>[number];
  index: number;
  language: Language;
}) {
  const viewerRef = useRef<HTMLDivElement>(null!);
  const rotationRef = useRef<Group>(null);
  const isNearViewport = useNearViewport(viewerRef);
  const [isLoaded, setIsLoaded] = useState(false);
  const pointer = useRef<{ id: number; x: number } | null>(null);
  const markLoaded = useCallback(() => setIsLoaded(true), []);

  const handlePointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (event.pointerType === "mouse" && event.button !== 0) return;
    pointer.current = { id: event.pointerId, x: event.clientX };
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const handlePointerMove = (event: ReactPointerEvent<HTMLDivElement>) => {
    const activePointer = pointer.current;
    if (!activePointer || activePointer.id !== event.pointerId || !rotationRef.current) return;

    rotationRef.current.rotation.y -= (event.clientX - activePointer.x) * 0.012;
    activePointer.x = event.clientX;
  };

  const stopDragging = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (pointer.current?.id !== event.pointerId) return;
    pointer.current = null;
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
  };

  return (
    <article className="character-card">
      <div
        ref={viewerRef}
        className="character-card__viewer"
        role="img"
        aria-label={translate(
          language,
          `${character.name}; arrastra horizontalmente para girarlo`,
          `${character.name}; arrossega horitzontalment per girar-lo`,
        )}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={stopDragging}
        onPointerCancel={stopDragging}
        onLostPointerCapture={() => { pointer.current = null; }}
      >
        <CharacterModelErrorBoundary key={character.modelPath} name={character.name} language={language}>
          <View track={viewerRef} index={index + 1} className="character-card__view-target">
            <PerspectiveCamera makeDefault position={[0, 1.225, 5.2]} fov={30} />
            <ambientLight intensity={1.35} />
            <directionalLight position={[4, 6, 5]} intensity={2.2} />
            <directionalLight position={[-4, 3, -4]} intensity={1.1} />
            {isNearViewport && (
              <Suspense fallback={null}>
                <CharacterModel
                  modelPath={character.modelPath}
                  rotation={rotationRef}
                  onLoad={markLoaded}
                />
              </Suspense>
            )}
          </View>
        </CharacterModelErrorBoundary>
        {!isLoaded && (
          <span className="character-card__loading" aria-live="polite">
            {isNearViewport
              ? translate(language, "Cargando modelo…", "Carregant el model…")
              : translate(language, "Personaje 3D", "Personatge 3D")}
          </span>
        )}
      </div>
      <h2 className="character-card__name">{character.name}</h2>
    </article>
  );
}

export default function CharacterGallery({
  username,
  language,
}: {
  username: string;
  language: Language;
}) {
  const characters = getCharactersForUser(username);

  return (
    <div className="characters-gallery">
      <Canvas
        camera={{ position: [0, 1.225, 5.2], fov: 30 }}
        gl={{ alpha: true, antialias: true }}
        dpr={[1, 1.5]}
        style={{ position: "fixed", inset: 0, width: "100vw", height: "100dvh", zIndex: 2, pointerEvents: "none" }}
      >
        <View.Port />
      </Canvas>
      {characters.length > 0 ? (
        <div className="characters-grid">
          {characters.map((character, index) => (
            <CharacterCard key={character.id} character={character} index={index} language={language} />
          ))}
        </div>
      ) : (
        <p className="characters-empty">{translate(language, "No hay personajes disponibles para este usuario.", "No hi ha personatges disponibles per a aquest usuari.")}</p>
      )}
    </div>
  );
}
