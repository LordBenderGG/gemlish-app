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

## v1.9 — Mejoras aprobadas
- [x] Sistema de logros: notificación emergente al desbloquear un logro nuevo
- [x] Historial de sesiones de práctica: guardar fecha, palabras practicadas y tasa de acierto
- [x] Mostrar historial de sesiones en el Perfil (sección "Últimas sesiones de práctica")
- [x] Modo repaso rápido de 5 minutos: botón en pantalla principal con 10 palabras mixtas cronometradas

## v1.10 — Mejoras aprobadas
- [x] Notificaciones push de racha con hora configurable por el usuario (mejorar UI del selector de hora)
- [x] Botón "Compartir" en cada logro desbloqueado (texto enriquecido via expo-sharing)
- [x] Toggle de modo oscuro/claro en el Perfil (persistido en AsyncStorage)

## v1.11 — Mejoras aprobadas
- [x] Pantalla /settings dedicada con Apariencia y Notificaciones
- [x] Botón ⚙️ en el header del Perfil para navegar a /settings
- [x] Eliminar secciones de Apariencia y Notificaciones del Perfil principal
- [x] Sonidos de feedback: correcto, incorrecto y nivel completado
- [x] Toggle de sonidos en /settings

## v1.12 — Bugs corregidos
- [x] Bug: Agregar botón ojo 👁 para ver/ocultar contraseña en login y registro
- [x] Bug: Modo oscuro/claro no funciona — siempre aparece oscuro (corregir ThemeProvider)
- [x] Bug: Agregar botón "Abrir Configuración del sistema" cuando se deniegan permisos de notificaciones

## v1.13 — Mejoras aprobadas
- [x] Modo claro en exercise/[levelId].tsx (useThemeStyles)
- [x] Modo claro en level/[levelId].tsx (useThemeStyles)
- [x] Modo claro en review/[levelId].tsx (useThemeStyles)
- [x] Modo claro en practice/hard-words.tsx (useThemeStyles)
- [x] Modo claro en practice/quick-review.tsx (useThemeStyles)
- [x] Indicador de fortaleza de contraseña en registro (débil/media/fuerte)
- [x] Indicador de coincidencia de contraseñas en registro
- [x] Pantalla /auth/forgot-password con explicación de progreso local
- [x] Enlace "¿Olvidaste tu contraseña?" en el login

## v1.14 — Mejoras aprobadas
- [x] Integrar useFeedbackSounds en practice/quick-review.tsx
- [x] Crear pantalla /stats con gráficas de progreso semanal
- [x] Agregar botón 📊 en el header del Perfil para navegar a /stats

## v1.15 — Mejoras aprobadas
- [x] Registrar fecha de cada nivel completado en GameState (levelCompletedDates)
- [x] Actualizar gráfica de /stats con niveles completados reales por día
- [x] Mostrar toast de logros pendientes al abrir la app (logros desbloqueados mientras estaba cerrada)

## v1.16 — Mejoras aprobadas
- [x] Animación de fuego mejorada en racha del mapa (Reanimated, con rotación y opacidad cuando streak > 3)
- [x] Notificación de resumen semanal los lunes a las 9:00 AM (se activa junto al recordatorio diario)
- [x] Selector de avatar/emoji en el Perfil (24 opciones, persiste en AsyncStorage)


## v1.17 — Mejoras aprobadas
- [x] Nombre de usuario editable en el Perfil (con migración de datos)
- [x] Animación de confeti al completar un nivel con puntuación perfecta (componente ConfettiOverlay)
- [x] Filtro de niveles por tema en el mapa (24 categorías con chips horizontales)

## v1.18 — Mejoras aprobadas
- [x] Expandir cada nivel de 10 a 20 ejercicios
- [x] Nuevo tipo de ejercicio: Pronunciación (grabar voz + TTS modelo + autoevaluación)
- [x] Nuevo tipo de ejercicio: Ordenar oración (chips tocables, 6 palabras)
- [x] Nuevo tipo de ejercicio: Completar la oración (hueco con 4 opciones)
- [x] Validación de respuestas escritas sin distinción de mayúsculas ni acentos
- [x] Actualizar tests para reflejar 20 ejercicios y 7 tipos

## v1.19 — Mejoras aprobadas
- [x] Animación de pulso (onda expansiva) en el botón de grabar durante la pronunciación
- [x] Ícono del tipo de ejercicio actual en el sub-header junto al contador de progreso
