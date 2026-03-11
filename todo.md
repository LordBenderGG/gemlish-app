# Gemlish — TODO

## Setup y Configuración
- [x] Configurar tema de colores Gemlish en theme.config.js
- [x] Instalar dependencias adicionales (expo-speech)

## Datos del Curso
- [x] Crear data/lessons.ts con 30 lecciones (300 palabras base)
- [x] Crear data/levelGenerator.ts para generar 500 niveles
- [x] Crear data/exerciseGenerator.ts para generar 10 ejercicios por nivel
- [x] Crear data/dailyWords.ts para palabras diarias (integrado en lessons.ts)

## Storage y Estado
- [x] Crear lib/storage.ts con funciones AsyncStorage
- [x] Crear context/AuthContext.tsx para autenticación local (integrado en GameContext)
- [x] Crear context/GameContext.tsx para estado del juego (gemas, XP, racha, progreso)

## Autenticación
- [x] Crear app/auth/login.tsx (pantalla de login)
- [x] Crear app/auth/register.tsx (pantalla de registro)
- [x] Crear app/auth/_layout.tsx

## Navegación
- [x] Configurar app/_layout.tsx con lógica de auth
- [x] Configurar app/(tabs)/_layout.tsx con 3 tabs: Lecciones, Tarea Diaria, Juego
- [x] Agregar íconos en icon-symbol.tsx

## Pantalla de Niveles
- [x] Crear app/(tabs)/index.tsx — mapa de 500 niveles
- [x] Componente LevelCard.tsx (integrado en index.tsx)
- [x] Header con stats (gemas, racha, XP)

## Motor de Ejercicios
- [x] Crear app/exercise/[levelId].tsx
- [x] Componente MultipleChoiceExercise.tsx (integrado en [levelId].tsx)
- [x] Componente TranslateExercise.tsx (integrado en [levelId].tsx)
- [x] Componente MatchPairsExercise.tsx (integrado en [levelId].tsx)
- [x] Sistema de vidas (corazones)
- [x] Sistema de pistas (cuesta 10 💎)
- [x] Pantalla de resultados

## Tarea Diaria
- [x] Crear app/(tabs)/daily.tsx
- [x] Componente WordCard.tsx con pronunciación TTS
- [x] Barra de progreso diario
- [x] Lógica de racha diaria

## Minijuego
- [x] Crear app/(tabs)/game.tsx
- [x] Componente MemoryCard.tsx (integrado en game.tsx)
- [x] Lógica de emparejamiento
- [x] Temporizador de 10 min diarios
- [x] Recompensa de 10 💎

## Branding
- [x] Generar ícono de Gemlish (ícono del usuario)
- [x] Configurar splash screen
- [x] Actualizar app.config.ts con nombre y colores

## Bugs Reportados v1.0
- [x] Bug: Validación de traducción no acepta minúsculas (ej. "wellcome" vs "Wellcome")
- [x] Bug: Emparejamiento de pares en ejercicios falla al seleccionar
- [x] Bug: TTS (parlante) en Tarea Diaria no reproduce audio
- [x] Bug: Tablero de memoria de cartas se ve mal (solo 3 cartas visibles, mal layout)
- [x] Mejora: Pantalla de Juegos con selector visual (imagen + descripción en inglés y español)

## Mejoras v1.1
- [x] Ampliar vocabulario del minijuego: colores, números, animales, saludos, casa, cocina, útiles escolares
- [x] Pantalla de selección de juegos con imagen descriptiva y descripción en inglés/español
