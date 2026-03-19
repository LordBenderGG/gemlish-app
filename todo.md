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

## v1.36 — Rediseño visual radical
- [ ] Bug: chips de modos de práctica no se renderizan en pantalla
- [ ] Nueva paleta: fondo #0F0F1A, acento verde lima #A3E635, azul eléctrico #38BDF8
- [ ] Header rediseñado con nueva paleta
- [ ] Tarjeta del Desafío del día con nueva paleta
- [ ] Modos de práctica visibles y bien diseñados
- [ ] Tarjetas de nivel con nueva paleta y mejor contraste

## v1.37 — QA Completo + Preparación Play Store
- [x] Bug crítico: Streak (racha) no se reseteaba cuando el usuario saltaba días — corregido en completeLevel
- [x] Bug crítico: finishDaily incrementaba streak dos veces (también lo hacía completeLevel) — eliminado de finishDaily
- [x] Bug crítico: errorWords se mutaba directamente con .push() — corregido con spread operator
- [x] Bug: gemsEarned calculado antes del último error — corregido con finalWrongCount
- [x] Bug: Timer del ejercicio no se detenía al mostrar pantalla de resultado — corregido con showResult en useEffect
- [x] Bug: achievements.tsx no estaba registrado en el Stack del layout raíz — corregido
- [x] Bug: progressPctLocal calculado dos veces en index.tsx — eliminado duplicado, usa progressPct
- [x] Mejora: completedCount en index.tsx envuelto en useMemo para evitar recálculo en cada render
- [x] Preparación Play Store: eas.json creado con profiles development/preview/production
- [x] Preparación Play Store: app.config.ts actualizado a v1.0.1 con metadatos GDPR/CCPA para AdMob
- [x] Preparación Play Store: expo-audio y expo-video plugins eliminados (no se usan, generaban permisos innecesarios)

## v2.0 — Rediseño Total de Interfaz (colores frescos y amigables)
- [x] Sistema de diseño: nueva paleta fresca v2.0 — azul-gris oscuro, verde lima, azul cielo, violeta, dorado
- [x] theme.config.js: nuevos tokens de color (primary, secondary, surface, muted, border, etc.)
- [x] Pantalla de onboarding rediseñada — gradientes por slide, emojis con fondo redondeado
- [x] Pantalla de login y registro rediseñadas — gradientes en logo, inputs con focus state
- [x] Pantalla principal (index): header, mapa de niveles, modos de práctica — nueva paleta
- [x] Pantalla de Tarea Diaria rediseñada — nueva paleta
- [x] Pantalla de Minijuego rediseñada — nueva paleta
- [x] Pantalla de ejercicios rediseñada — nueva paleta, verde #4ADE80
- [x] Pantalla de resultado rediseñada — nueva paleta
- [x] Pantalla de Perfil rediseñada — nueva paleta
- [x] Pantalla de Stats rediseñada — nueva paleta
- [x] Pantalla de Settings rediseñada — nueva paleta
- [x] Pantalla de Logros rediseñada — nueva paleta
- [x] Pantalla de detalle de nivel rediseñada — nueva paleta
- [x] Pantallas de práctica (quick-review, hard-words) rediseñadas — nueva paleta

## v2.1 — Fix Build Gradle
- [x] Fix: minSdkVersion 22 → 24 confirmado en app.config.ts + buildArchs arm64-v8a/x86_64 + cache deshabilitado en eas.json

## v3.0 — Rediseño RADICAL: Tema Claro + Colores Vibrantes
- [ ] Nueva paleta CLARA: fondo blanco/gris muy claro, colores vibrantes (verde, azul, naranja, morado)
- [ ] theme.config.js: modo claro por defecto, modo oscuro mejorado
- [ ] Onboarding: fondo blanco, slides con color de acento por slide
- [ ] Login/Registro: fondo claro, inputs con borde de color
- [ ] index.tsx: header con gradiente de color, tarjetas de nivel coloridas, chips de práctica vibrantes
- [ ] daily.tsx: fondo claro, tarjetas de palabras con color, barra de progreso vibrante
- [ ] game.tsx: fondo claro, categorías con colores distintos
- [ ] profile.tsx: tarjeta de usuario COMPACTA (no enorme), estadísticas coloridas, modo nocturno en Settings
- [ ] exercise/[levelId].tsx: fondo claro, opciones con colores vibrantes
- [ ] settings.tsx: modo nocturno funcional con toggle visible
- [ ] stats.tsx: heatmap con colores vibrantes, gráficas coloridas

## v3.1 — Fixes de UI (capturas del usuario)
- [ ] Icono onboarding: usar logo real con bordes redondeados (no el diamante genérico)
- [ ] Eliminar pantalla splash oscura antes del onboarding
- [ ] Barra de tabs: fondo blanco, iconos y texto en negro/oscuro
- [ ] Títulos de todas las pantallas: color negro/oscuro visible
- [ ] Header Home: color del nombre de usuario negro (no azul), widget de progreso con texto negro
- [ ] Header Tarea Diaria: título visible con fondo claro
- [ ] Header Juego: título y subtítulo visibles
- [ ] Header Juego Memory Pairs: título visible en la barra superior
- [ ] Tarjeta de perfil: reducir a la mitad de tamaño
- [ ] Título "Perfil" en header: color negro visible
- [ ] Modo nocturno: corregir para que realmente cambie el tema
- [ ] Pantalla ejercicio: texto de opciones visible, header con texto negro

## v1.25 — Correcciones de UI (modo claro)
- [x] Tab bar: fondo blanco, texto negro, iconos con color del tema
- [x] Header de Home: reemplazar gradiente azul índigo por fondo blanco limpio
- [x] Widget de progreso: gradiente índigo-violeta (visible sobre fondo claro)
- [x] Modos de práctica: colores pastel claros con texto del acento
- [x] Header de Perfil: reemplazar gradiente oscuro por fondo blanco
- [x] Tarjeta hero de Perfil: reducida al 50% (layout horizontal, avatar 64px)
- [x] Títulos de pantallas (daily, game, profile): corregir color blanco → negro
- [x] Textos blancos en quiz, spaced review, done screen del daily
- [x] Textos blancos en game (títulos de cartas, categorías, tablero)
- [x] Toggle de modo nocturno: marcado como "Próximamente" (pantallas usan colores hardcodeados)

## v1.26 — Mejoras solicitadas
- [x] Icono de la app: reemplazar con logo del usuario (cristal arcoíris con rayo)
- [x] Splash screen: fondo blanco con logo centrado (eliminar fondo negro)
- [x] Banner AdMob dentro del tablero del juego de memoria
- [x] Logros: corregir al tema claro (fondo blanco, texto negro)
- [x] Settings: mover banner de perfil arriba de la sección Apariencia
- [x] Modo nocturno: implementar completamente (toggle funcional con Switch)

## v1.27 — Correcciones de visibilidad de texto
- [x] Eliminar toggle de modo nocturno de Settings (forzar tema claro permanente)
- [x] Corregir tarjetas de niveles bloqueados en index.tsx (texto visible sobre fondo gris)
- [x] Corregir opciones de respuesta invisibles en exercise/[levelId].tsx
- [x] Corregir botón "Faltan N palabras" en daily.tsx (texto visible sobre fondo gris)

## v1.28 — Forzar tema claro permanente
- [x] ThemeProvider: forzar siempre 'light', ignorar AsyncStorage y sistema
- [x] app.config.ts: userInterfaceStyle cambiado a 'light'
- [x] Tab bar: colores hardcodeados en claro, eliminada lógica isDark
- [x] Limpiar AsyncStorage de cualquier valor de tema oscuro guardado al iniciar

## v1.29 — Correcciones de build Android
- [x] minSdkVersion ya estaba en 24 en app.config.ts (confirmado)
- [x] NODE_ENV agregado explícitamente en todos los perfiles de eas.json (development, preview, production)

## v1.30 — Logo en onboarding
- [x] Verificado: icon.png ya es el logo del cristal arcoíris y el onboarding lo usa correctamente en slide 1

## v1.31 — Pantalla de resultado del ejercicio
- [x] Corregido contraste en pantalla ¡Perfecto! (fondo blanco, textos oscuros), resultado normal (gradiente claro, títulos oscuros, rewardBadge claro), breakdown (breakdownLabel oscuro), modal Sin vidas (texto oscuro)

## v1.32 — Contraste en pantallas de práctica
- [x] quick-review: questionWord, answerInput (fondo negro), resultTitle, emptyTitle corregidos
- [x] listen-mode: headerTitle, answerInput (fondo negro), inputCorrect (verde oscuro), resultTitle corregidos
- [x] order-mode: headerTitle, chips (fondo negro), dropZone (fondo negro), chipText, resultTitle corregidos
- [x] hard-words: headerTitle, promptCard (fondo negro), promptText, answerInput (fondo negro), resultTitle, resultStatValue, hardListEn, emptyTitle, backBtnText corregidos

## v1.33 — Contraste en pantalla de estadísticas
- [x] stats.tsx: sin problemas de contraste (ya usa colores dinámicos correctamente)
- [x] review/[levelId].tsx: headerTitle, progressBar, cardWordEn, exampleBox (fondo negro), exampleEn, actionBtnGreen/Orange (fondos oscuros), actionBtnText, emptyTitle corregidos

## v1.34 — Texto invisible en niveles y Mini Quiz
- [x] index.tsx: texto "Nivel N" cambiado de #F0EEFF (blanco) a #1E293B (negro) en tarjetas completadas y desbloqueadas
- [x] daily.tsx: textColor por defecto del Mini Quiz cambiado de #FFFFFF (blanco) a #1E293B (negro); estados correcto/incorrecto con fondos claros y texto oscuro

## v1.49 — Modo claro forzado
- [x] Forzar modo claro permanente en toda la app (sin modo oscuro bajo ningún modo)

## BUGS CRÍTICOS — Reportados en producción
- [x] Bug crítico: Eliminar OfflineBadge completamente — la app no debe mostrar estado de conexión
- [x] Bug crítico: Sesión permanente — gemlish_current_user nunca debe perderse, respaldo automático en gemlish_current_user_bk con recuperación automática

## v2.0 — Migración a SQLite local
- [x] Instalar expo-sqlite
- [x] Crear lib/database.ts con sistema de migraciones versionadas
- [x] Migrar lib/storage.ts para usar SQLite en lugar de AsyncStorage
- [x] Migrar datos existentes de AsyncStorage a SQLite al primer arranque (sin perder progreso)
- [x] Verificar TypeScript y tests

## Sistema de Gemas v2

- [ ] Actualizar gemas por nivel: sin errores +10, con errores +5
- [ ] Bono de bienvenida: +100 gemas al registrarse
- [ ] Bono diario: +25 gemas cada 24h desde el primer login
- [ ] Botón "Ver video" en Memory Pairs: +50 gemas, cooldown 20min, máx 3/día, bloqueo 24h tras el 3er uso
- [ ] Agregar campo gems a cada logro en achievements.ts
- [ ] Entregar gemas automáticamente al desbloquear un logro

## v1.32 — QA y corrección de bugs críticos
- [x] BUG CRÍTICO: Stale closure en GameContext — saveLevelErrors sobreescribía el progreso guardado por completeLevel (nivel completado, XP, gemas se perdían después de completar un nivel)
- [x] BUG CRÍTICO: Todas las funciones del GameContext usaban `game` del closure (stale) — corregido con useRef (gameRef, dailyRef, miniGameRef, usernameRef)
- [x] BUG: AchievementsContext usaba updateGame con game.gems stale — corregido con nueva función addGems()
- [x] BUG: game.tsx handleVideoRewarded usaba updateGame con game.gems stale — corregido con addGems()
- [x] BUG: claimDailyBonus nunca se llamaba desde ninguna pantalla — conectado en index.tsx con toast visual "+25 💎 Bono diario"
- [x] BUG: checkAchievements y username faltaban en dependencias de handleAnswer useCallback
- [x] MEJORA: Nueva función addGems() en GameContext para incrementos seguros de gemas sin stale closure

## v1.33 — Auditoría QA completa (segunda ronda)
- [x] BUG: gemsEarned en pantalla de resultado (render) usa `wrongCount` stale cuando el último ejercicio es incorrecto — corregido con finalWrongCountRef
- [x] BUG: completeLevel siempre guardaba `score: 100` — corregido para guardar el porcentaje real de aciertos (TOTAL_EXERCISES - finalWrongCount) / TOTAL_EXERCISES * 100
- [x] BUG: finishDaily no actualizaba el streak del juego — corregido para actualizar streak y levelCompletedDates al completar la tarea diaria
- [x] BUG: Sistema de Gemas v2 — items actualizados a [x] (ya estaban implementados)

## v1.34 — Estrellas en tarjetas de nivel
- [x] Implementar función getStarRating(score): 1 estrella (score < 70), 2 estrellas (70-99), 3 estrellas doradas (100 o undefined=default)
- [x] Mostrar estrellas en las tarjetas de nivel en la pantalla principal (index.tsx) + badge dorado en nivel perfecto
- [x] Mostrar estrellas en la pantalla de detalle de nivel (level/[levelId].tsx)
- [x] Mostrar estrellas en la pantalla de resultado del ejercicio (exercise/[levelId].tsx)
- [x] Mostrar 3 estrellas doradas en PerfectScreen
- [x] Auditoría QA completa post-cambio: TypeScript limpio, edge cases cubiertos

## v1.35 — Fix lógica tarea diaria
- [x] BUG: Palabras del día siguen visibles en "Hoy" después de completar el quiz — corregido: pestaña Hoy muestra mensaje vacío cuando dailyCompleted=true
- [x] BUG: Día 2 solo mostraba 10 palabras nuevas al final de las ya aprendidas — corregido: getDailyWords ahora recibe allLearnedWords y excluye palabras ya aprendidas, siempre retorna 30 palabras nuevas
- [x] Crash potencial en MiniQuiz si questions está vacío — corregido con guard defensivo

## v1.36 — Fix UI bugs
- [x] BUG: Al volver de la lista tras completar el quiz, la pestaña activa ahora arranca en "Aprendidas" cuando dailyCompleted=true
- [x] BUG: Fondo negro sólido en overlay de nivel desbloqueado — cambiado de rgba(0,0,0,0.85) a rgba(0,0,0,0.45) semitransparente

## v1.37 — Responsive vertical (Android phones + tablets)
- [ ] Auditar todas las pantallas para detectar alturas fijas, fuentes fijas y layouts rotos
- [ ] Corregir exercise/[levelId].tsx — pantallas pequeñas (360dp) y tablets (600dp+)
- [ ] Corregir app/(tabs)/index.tsx — mapa de niveles responsive
- [ ] Corregir app/(tabs)/daily.tsx — tarea diaria responsive
- [ ] Corregir app/(tabs)/game.tsx — memory pairs responsive
- [ ] Corregir app/(tabs)/profile.tsx — perfil responsive
- [ ] Bloquear orientación landscape en app.config.ts

## v1.37 — Responsive vertical para todos los Android

- [x] game.tsx: CARD_WIDTH ahora usa useWindowDimensions dinámico en GameBoard (responsive en tablets y phones)
- [x] index.tsx: unlockCard cambiado de width:280 fijo a width:'80%' maxWidth:320
- [x] exercise/[levelId].tsx: questionText reducido de fontSize:22/marginBottom:24 a fontSize:20/marginBottom:16
- [x] Verificado: PerfectScreen, result screen, daily.tsx tienen ScrollView — no hay overflow crítico
- [x] Verificado: modalCard usa width:'100%' maxWidth:400 — responsive en tablets
- [x] TypeScript: sin errores

## v1.38 — Fix advertencias Google Play Console (Android 15/16)

- [x] FIX: BOOT_COMPLETED restringido — plugin `plugins/withDisableNotificationsBootActions.js` elimina BOOT_COMPLETED/REBOOT/QUICKBOOT del receiver de expo-notifications en el AndroidManifest.xml generado
- [x] FIX: API edge-to-edge obsoleta — eliminado `edgeToEdgeEnabled: true` (deprecado); en SDK 54 + Android 16 edge-to-edge es obligatorio y no necesita configuración explícita
- [x] NOTA: Restricción de orientación en Android 16 — `orientation: "portrait"` se mantiene; Android 16 lo ignorará en tablets/plegables pero la app ya usa SafeAreaView + ScreenContainer que maneja todos los tamaños
- [x] Versión actualizada a 1.2.0
