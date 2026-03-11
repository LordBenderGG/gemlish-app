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

## v1.2 — Mejoras aprobadas
- [x] Bug: TTS no suena en Tarea Diaria (corregido: expo-speech v14.0.8 instalada)
- [x] Tablero de memoria expandido a 6×4 (12 pares, 24 cartas)
- [x] Límite diario de juego subido a 30 minutos
- [x] Pantalla de Perfil con estadísticas y 24 logros desbloqueables
- [x] Ejercicio de escucha: TTS pronuncia, usuario escribe sin ver la palabra
- [x] Sistema de logros y medallas (10 niveles, 7 días racha, 100 palabras, etc.)

## v1.5 — Correcciones y mejoras aprobadas
- [x] Bug: Audio TTS corregido con hook useSpeech centralizado y expo-speech v14.0.8
- [x] Notificaciones diarias configurables con expo-notifications
- [x] Pantalla de detalle de nivel con palabras aprendidas y repaso de pronunciación
- [x] Expandir vocabulario a 50 lecciones (negocios, viajes, frases cotidianas, phrasal verbs, gramática, idioms)

## v1.6 — Mejoras aprobadas
- [x] Selector de hora de notificaciones en pantalla de Perfil
- [x] Modo repaso de errores: guardar palabras fallidas al terminar nivel
- [x] Pantalla de repaso de errores con tarjetas de palabras fallidas
- [x] Racha con animación de fuego 🔥 pulsante en el header del mapa de niveles

## v1.7 — Mejoras aprobadas
- [x] Pantalla de onboarding (4 slides) que se muestra solo la primera vez
- [x] Indicador offline en el header del mapa de niveles
- [x] Ranking de palabras difíciles en Perfil (top 5 más falladas)
- [x] Botón para practicar palabras difíciles directamente desde Perfil

## v1.8 — Mejoras aprobadas
- [x] Modo práctica con repetición espaciada de palabras difíciles (pantalla /practice/hard-words)
- [x] Animación fade-in en cada slide del onboarding al cambiar de slide
- [x] Pantalla de bienvenida de vuelta para usuarios que reinstalaron la app (detecta datos guardados)
