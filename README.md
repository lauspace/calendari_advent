# React + TypeScript + Vite

## Languages and missions

Jordi and Caty use Spanish; Albert, Ana, and the admin user use Catalan. The
language is selected from the authenticated profile's username. Mission titles
and descriptions are stored in both languages in Supabase.

Apply `supabase/migrations/20261111_bilingual_missions.sql` before deploying the
updated app. This migration only adds bilingual text columns; it does not add
or edit any missions. Create missions from the admin panel, providing both
language versions before saving.

## Publicar a GitHub Pages

El lloc es compila i es publica automàticament a
`https://lauspace.github.io/calendari_advent/` quan s’envien canvis a `main`.

1. Fes públic el repositori `lauspace/calendari_advent`. A **Settings → Pages**,
   selecciona **GitHub Actions** com a origen de publicació.
2. A **Settings → Secrets and variables → Actions**, afegeix aquests secrets
   del repositori:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_PUBLISHABLE_KEY`
3. Envia els canvis a `main` o executa **Deploy to GitHub Pages** des de la
   pestanya **Actions**. En acabar, l’execució mostrarà l’URL publicada.
4. A la configuració d’autenticació de Supabase, afegeix
   `https://lauspace.github.io/calendari_advent/` a les URL permeses del lloc i
   de redirecció perquè els usuaris puguin iniciar sessió.

La clau publicable de Supabase s’inclou al paquet públic del navegador per
disseny. No posis mai una clau secreta `service_role` al frontend; protegeix
l’accés a la base de dades amb les polítiques Row Level Security adequades. Per
al desenvolupament local, copia `.env.example` a `.env.local` i introdueix-hi
els mateixos valors de Supabase.

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Oxc](https://oxc.rs)
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/)

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend updating the configuration to enable type-aware lint rules:

```js
export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...

      // Remove tseslint.configs.recommended and replace with this
      tseslint.configs.recommendedTypeChecked,
      // Alternatively, use this for stricter rules
      tseslint.configs.strictTypeChecked,
      // Optionally, add this for stylistic rules
      tseslint.configs.stylisticTypeChecked,

      // Other configs...
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])

```

You can also install [eslint-plugin-react-x](https://npmx.dev/package/eslint-plugin-react-x) and [eslint-plugin-react-dom](https://npmx.dev/package/eslint-plugin-react-dom) for React-specific lint rules:

```js
// eslint.config.js
import reactX from 'eslint-plugin-react-x'
import reactDom from 'eslint-plugin-react-dom'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...
      // Enable lint rules for React
      reactX.configs['recommended-typescript'],
      // Enable lint rules for React DOM
      reactDom.configs.recommended,
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])

```
