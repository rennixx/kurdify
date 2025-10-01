# Kurdify (skeleton)

This repository contains the scaffold for the Kurdify Expo app (TypeScript + Expo). It creates the folder structure, basic configs, and instructions to finish the initialization locally.

PHASE 0 — PROJECT STRUCTURE & TOOLING

Follow these steps locally (PowerShell on Windows):

1) Initialize repo & Expo app (run in the folder where you want the app):

   git init
   npx create-expo-app kurdify --template expo-template-blank-typescript
   cd kurdify

2) Add the scaffold files from this repo into the newly created `kurdify` folder, or run the commands below to install the recommended dependencies.

3) Install core dependencies (MVP set):

   yarn add @supabase/supabase-js expo-av react-native-gesture-handler react-native-reanimated @react-navigation/native @react-navigation/native-stack nativewind
   # For background playback (Phase 2+): react-native-track-player (requires EAS/prebuild)

   # Dev dependencies
   yarn add -D typescript eslint prettier husky lint-staged @typescript-eslint/eslint-plugin @typescript-eslint/parser

4) NPM scripts (these are example scripts — ensure they exist in your package.json):

   "start": "expo start"
   "android": "expo run:android"
   "ios": "expo run:ios"
   "web": "expo start --web"
   "lint": "eslint . --ext .ts,.tsx"
   "format": "prettier --write ."

5) Git hooks (local):

   npx husky-init && yarn
   # then add lint-staged to package.json to run lint/format on staged files

6) Environment variables:

   - Create a `.env` (local) with: SUPABASE_URL, SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY (server-only)
   - Copy `.env.example` as a starter

7) CI basics:

   A sample GitHub Actions workflow is included in `.github/workflows/ci.yml` that runs `yarn install` and `yarn lint`.

8) Next steps / Developer notes:

   - After installing dependencies, run `yarn prepare` to set up husky hooks.
   - The `src/` folder contains placeholders for `api`, `components`, `screens`, `context`, `hooks`, `services`, `utils`, and `assets`. Replace these with working code inside your Expo app.

If you'd like, I can now:

- create the Expo app files directly in this workspace (run create-expo-app here), or
- open a branch and generate more detailed component and auth boilerplate (Supabase client, AuthContext, example screens).

Tell me which you'd prefer and I'll continue.

## Recommended dependency versions & quick install

Here are example, known-stable starting versions you can use (adjust if needed):

- expo: ^48.0.0
- react: 18.2.0
- react-native: 0.72.0
- @supabase/supabase-js: ^2.0.0
- expo-av: ^13.0.0
- @react-navigation/native: ^6.1.0
- @react-navigation/native-stack: ^6.9.12

Run these in PowerShell inside your project folder:

```powershell
yarn add expo@^48.0.0 react@18.2.0 react-native@0.72.0 @supabase/supabase-js@^2.0.0 expo-av@^13.0.0 @react-navigation/native@^6.1.0 @react-navigation/native-stack@^6.9.12 react-native-gesture-handler react-native-reanimated nativewind

yarn add -D typescript@^5.0.0 eslint prettier husky lint-staged @typescript-eslint/eslint-plugin @typescript-eslint/parser

yarn install
yarn prepare
yarn start
```

