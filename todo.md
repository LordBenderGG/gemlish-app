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

## v1.20 — Mejoras aprobadas
- [x] Barra de progreso con color dinámico según el tipo de ejercicio actual
- [x] Transición animada entre ejercicios (fade + translateX sutil)
- [x] Contador de racha interna del nivel (🔥 N seguidas cuando N >= 3)

## v1.21 — Mejoras aprobadas
- [x] Sonido especial de fanfarria al llegar a racha de 5 seguidas
- [x] Racha máxima del nivel mostrada en la pantalla de resultado
- [x] Animación de pulso suave en el badge de racha (escala 1.0 → 1.1 → 1.0 en bucle)

## v1.22 — Corrección de build
- [x] Subir minSdkVersion de 22 a 24 para compatibilidad con react-native-worklets, expo-modules-core y react-native-screens
- [x] Actualizar buildArchs a arm64-v8a + x86_64 (eliminar armeabi-v7a de 32 bits)
- [x] Añadir compileSdkVersion 35 y targetSdkVersion 35 para Android moderno

## v1.23 — Cambios solicitados
- [x] Forzar modo oscuro permanente (eliminar toggle de tema claro)
- [x] Arreglar visibilidad de chips de filtro de temas en el mapa de niveles
- [x] Corregir validación de permisos de notificaciones (detectar si ya están habilitados)
- [x] Eliminar ejercicios de pronunciación del generador y la pantalla de ejercicios
- [x] Mejorar fill-blank: dificultad progresiva según el nivel (frases simples en niveles bajos)
- [x] Añadir traducción al español de la frase en ejercicios fill-blank

## v1.24 — Bloques A-F completados

### Bloque A: Bugs críticos
- [x] A1: Ejercicios usan solo palabras del nivel actual (fill-blank, sentence-order, multiple-choice)
- [x] A2: Multiple-choice con opciones lógicas del mismo nivel y categoría semántica
- [x] A3: Chips de filtro visibles en el mapa de niveles (contraste mejorado)
- [x] A4: Notificaciones — re-verificar permiso al volver de Configuración del sistema (AppState listener)

### Bloque B: Mejoras de ejercicios
- [x] B1: Traducción al español en ejercicios sentence-order
- [x] B2: Desglose por tipo de ejercicio en pantalla de resultado
- [x] B3: Ejercicio de dictado extendido (escuchar frase completa y escribirla)
- [x] B4: Ejercicio de completar diálogo (dos personajes con burbujas)
- [x] B5: Dificultad adaptativa (>90% aciertos sube complejidad en siguiente nivel)
- [x] B6: Modo “Solo Escucha” — sesión de 10 ejercicios listen-write
- [x] B7: Modo “Solo Ordenar” — sesión de 10 sentence-order
- [x] B8: Cronómetro opcional por ejercicio en el sub-header
- [x] B9: Contador de XP flotante al acertar (+5 XP sube animado)
- [x] B10: Toast “¡En racha! 🔥” al alcanzar exactamente 5 seguidas

### Bloque C: Pantalla de resultado
- [x] C1: Desglose por tipo de ejercicio (tabla aciertos/fallos por tipo)
- [x] C2: Tiempo total del nivel mostrado en resultado
- [x] C3: Botón “Repetir nivel” en pantalla de resultado
- [x] C4: Comparar con mejor intento anterior

### Bloque D: Mapa de niveles
- [x] D1: Barra de progreso por categoría al seleccionar chip
- [x] D2: Búsqueda de palabras en el mapa
- [x] D3: Vista previa de nivel bloqueado (modal con palabras)
- [x] D4: Animación de desbloqueo al completar nivel

### Bloque E: Perfil y estadísticas
- [x] E1: Mapa de calor de actividad (calendario estilo GitHub, 3 meses)
- [x] E2: Nivel de inglés estimado A1/A2/B1/B2
- [x] E3: Gráfica de precisión por tipo de ejercicio (en /stats)
- [x] E4: Tarjeta de estadísticas para compartir (imagen)
- [x] E5: Comparar con amigos por código

### Bloque F: Tarea diaria y repaso
- [x] F1: Tarea diaria con mini quiz de 5 preguntas antes de completar
- [x] F2: Repaso espaciado inteligente con algoritmo SM-2
- [x] F3: Audio TTS en cada tarjeta de palabra de la tarea diaria (ya existía)

## v1.25 — Mejoras aprobadas
- [x] Modal de vista previa de nivel bloqueado (palabras que se aprenderán)
- [x] Animación de desbloqueo al completar nivel (candado abriéndose + confeti)

## v1.26 — Mejoras aprobadas
- [x] Sonido de desbloqueo sincronizado con la animación del candado
- [x] Confeti cayendo sobre el overlay de desbloqueo

## v1.27 — Mejoras aprobadas
- [x] Pantalla de logros (Achievements) en el perfil con medallas, iconos y fechas
- [x] Notificación diaria personalizada con el nombre del siguiente nivel pendiente

## v1.28 — Mejoras aprobadas
- [x] Logros de racha extendida: medallas para 30, 60 y 100 días consecutivos
- [x] Pantalla especial "¡Perfecto!" al completar nivel con 100% de aciertos (tiempo récord, racha máxima, XP ganados)

## v1.29 — Mejoras aprobadas
- [x] Desafío del día: nivel aleatorio desbloqueado diario con recompensa doble de XP y diamantes
- [x] Desafío del día visible en la pantalla principal (tarjeta destacada)
- [x] Recordatorio de racha en riesgo: notificación a las 20:00 si no se completó ningún nivel y racha >= 3

## v1.30 — Mejoras aprobadas
- [x] Recompensa doble del desafío del día aplicada automáticamente al completar el nivel del desafío
- [x] Contador de desafíos completados en el Perfil (junto al mapa de calor)
- [x] Notificación diaria a las 8:00 AM con el nivel del desafío del día y su recompensa

## v1.31 — Lista final completa

### Gamificación
- [x] Racha de desafíos consecutivos con logros a los 7 y 30 días
- [x] Pantalla especial al completar el desafío del día con bonus ×2 destacado
- [x] Historial de últimos 7 desafíos completados en el Perfil
- [x] Tabla de clasificación local por XP entre usuarios del dispositivo
- [x] Modo "Repaso de errores" — practicar solo palabras falladas en niveles anteriores
- [x] Logros por velocidad — completar un nivel en menos de 60 segundos

### UX
- [x] Animación de XP/monedas volando al ganar recompensas
- [x] Sonido de celebración diferente para el desafío del día
- [x] Vibración háptica al desbloquear logros
- [x] Contador regresivo hasta el próximo desafío del día en la tarjeta

### Contenido
- [x] Modo "Solo escucha" — pronunciación sin ver traducción
- [x] Tarjetas de vocabulario con ejemplo en contexto antes del ejercicio
- [x] Estadística de palabras más falladas en el perfil
- [x] Modo difícil — sin mostrar traducción durante el ejercicio

### Notificaciones
- [x] Notificación de logro desbloqueado cuando la app está cerrada
- [x] Resumen semanal de progreso los lunes a las 9:00 AM

## v1.32 — Rediseño visual completo (UX premium)
- [x] Nueva paleta de colores premium con gradientes morado-azul-verde
- [x] Header del mapa de niveles rediseñado con gradiente y stats visuales
- [x] Tarjetas de nivel con gradientes, sombras y animaciones de entrada
- [x] Tarjeta del Desafío del día con diseño hero destacado
- [x] Pantalla de Perfil con hero section y estadísticas visuales
- [x] Pantalla de ejercicios con UI inmersiva y feedback visual mejorado
- [x] Pantalla de onboarding rediseñada con ilustraciones y gradientes
- [x] Login y registro con diseño premium
- [x] Tarea diaria y minijuego con nuevo estilo visual

## v1.33 — Bugs reportados
- [x] Login y registro rediseñados más limpios (sin bordes morados cargados)
- [x] Toggle de recordatorio diario en Configuración no funciona
- [x] Filtros de categoría (pastillas sin texto) eliminados de la pantalla principal
- [x] Botones de modo (Repaso Rápido / Solo Escucha / Solo Ordena) amontonados — rediseñar

## v1.34 — Rediseño pantalla principal (segunda iteración)
- [x] Header con saludo por hora del día, nombre grande y XP prominente
- [x] Pills de gemas y racha con gradientes azul/rojo
- [x] Tarjeta del Desafío del día con gradiente morado-violeta y layout vertical
- [x] Modos de práctica con gradientes únicos (azul, verde, ámbar, rojo) e iconos 32px
- [x] Tarjetas de nivel más grandes con sombras de color y botón play con glow

## v1.35 — Compactación pantalla principal
- [x] Modos de práctica: convertir grid 2×2 en fila horizontal de chips compactos con scroll
- [x] Reducir padding del header, desafío del día y sección de práctica para mostrar más niveles
