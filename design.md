# Gemlish — Diseño de la App Móvil

## Identidad Visual

- **Colores primarios:** Verde Gemlish `#58CC02`, Azul `#1CB0F6`, Morado `#8E5AF5`
- **Fondo:** Oscuro `#0F1117` (modo oscuro por defecto), Claro `#FFFFFF`
- **Diamantes/Gemas:** Cian `#00D4FF`
- **Peligro/Error:** Rojo `#FF4B4B`
- **Advertencia:** Naranja `#FF9600`
- **Fuente:** Sistema (SF Pro / Roboto)
- **Estilo:** Gamificado, vibrante, inspirado en Duolingo pero con identidad propia

## Pantallas

### 1. Splash Screen
- Logo Gemlish centrado con animación de entrada
- Fondo oscuro con partículas de diamantes

### 2. Login / Registro
- Pantalla de bienvenida con logo y slogan
- Tabs: "Iniciar sesión" / "Registrarse"
- Campos: usuario + contraseña
- Botón de acción principal
- Nota: datos guardados localmente en el dispositivo

### 3. Pantalla Principal — Mapa de Niveles
- Header: nombre de usuario, diamantes 💎, racha 🔥, XP ⭐
- Barra de progreso global (X / 500 niveles)
- FlatList vertical con tarjetas de nivel:
  - Completado: verde con ✅
  - Disponible: colores vibrantes con ícono temático
  - Bloqueado: gris con 🔒
- Tab bar inferior: Lecciones | Tarea Diaria | Juego

### 4. Pantalla de Ejercicio
- Header con barra de progreso del nivel (X/10 ejercicios)
- Corazones (5 vidas) en la esquina
- Botón de pista 💡 (cuesta 10 💎)
- Área de ejercicio (cambia según tipo):
  - **Opción múltiple:** pregunta + 4 opciones con letras A/B/C/D
  - **Traducción:** pregunta + campo de texto
  - **Emparejamiento:** grid de pares a conectar
- Botón "Verificar" → feedback visual (verde/rojo)
- Botón "Continuar" para siguiente ejercicio

### 5. Pantalla de Resultados
- Animación de celebración (nivel completado)
- XP ganado, diamantes ganados
- Botón "Continuar" → volver al mapa

### 6. Tarea Diaria
- Header con progreso del día (X/30 palabras)
- FlatList de tarjetas de palabras:
  - Palabra en inglés (grande)
  - Traducción al español
  - Pronunciación fonética
  - Ejemplo en inglés + español
  - Botón 🔊 (pronunciar con TTS)
  - Botón "Marcar como aprendido" → verde ✓
- Barra de progreso inferior
- Botón "Completar tarea" (activo al llegar a 30)

### 7. Minijuego — Memoria de Pares
- Header con temporizador (10 min diarios)
- Grid 4×3 de tarjetas boca abajo
- Al tocar: voltea mostrando palabra (inglés) o traducción (español)
- Par correcto: ambas quedan verdes
- Par incorrecto: se voltean de nuevo
- Al completar: banner "¡Ganaste! +10 💎"
- Botón "Nueva partida"

## Flujos Principales

**Flujo de nivel:**
Mapa → toca nivel disponible → 10 ejercicios → resultados → mapa (siguiente nivel desbloqueado)

**Flujo de tarea diaria:**
Tab "Tarea Diaria" → 30 palabras → marcar aprendidas → completar → +10 💎 +20 XP +1 racha

**Flujo de minijuego:**
Tab "Juego" → tablero de memoria → emparejar 6 pares → ganar +10 💎

**Flujo de pista:**
Durante ejercicio de traducción → toca 💡 → confirma gasto de 10 💎 → ve la respuesta
