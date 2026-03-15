# Gemlish v2.0 — Sistema de Diseño

## Filosofía
Fresco, alegre, motivador. Como Duolingo pero con identidad propia.
Fondo oscuro suave (no negro puro), acentos vibrantes y cálidos.

## Paleta de Colores

### Fondos
- `background`: #0E1117  (azul-gris muy oscuro, no negro puro)
- `surface`:    #161B27  (cards y contenedores)
- `surface2`:   #1E2535  (inputs, elementos secundarios)

### Texto
- `foreground`:  #F0F4FF  (texto principal, casi blanco con tinte azul)
- `muted`:       #8B9CC8  (texto secundario, azul grisáceo)
- `mutedLight`:  #C4CEEA  (texto terciario)

### Acentos Primarios (verde lima vibrante — aprendizaje, éxito)
- `primary`:     #4ADE80  (verde lima fresco)
- `primaryDark`: #22C55E  (verde más oscuro para contraste)
- `primaryBg`:   #0F2A1A  (fondo de elementos con acento verde)

### Acentos Secundarios (azul cielo — exploración, niveles)
- `secondary`:   #38BDF8  (azul cielo eléctrico)
- `secondaryBg`: #0A1E2E  (fondo azul oscuro)

### Acento Terciario (ámbar/dorado — gemas, recompensas)
- `gold`:        #FBBF24  (dorado para gemas y XP)
- `goldBg`:      #2A1F08  (fondo dorado oscuro)

### Acento Cuaternario (coral/rojo — vidas, errores)
- `danger`:      #F87171  (coral suave, no rojo agresivo)
- `dangerBg`:    #2A0F0F  (fondo rojo oscuro)

### Acento Quinto (violeta — racha, especial)
- `streak`:      #A78BFA  (violeta suave para racha)
- `streakBg`:    #1A1030  (fondo violeta oscuro)

### Bordes
- `border`:      #2A3450  (borde sutil)
- `borderLight`: #3A4870  (borde más visible)

## Gradientes Clave
- Hero verde:   `#4ADE80 → #22D3EE`  (logros, éxito)
- Hero azul:    `#38BDF8 → #818CF8`  (niveles, exploración)
- Hero violeta: `#A78BFA → #F472B6`  (racha, especial)
- Hero dorado:  `#FBBF24 → #F97316`  (gemas, recompensas)
- Hero coral:   `#F87171 → #FB923C`  (errores, vidas)

## Tipografía
- Fuente principal: System font (SF Pro en iOS, Roboto en Android)
- Tamaños: 32 (hero), 24 (título), 18 (subtítulo), 16 (cuerpo), 14 (secundario), 12 (caption)
- Peso: 800 (hero), 700 (títulos), 600 (subtítulos), 400 (cuerpo)

## Componentes Clave

### Cards
- Border radius: 20px
- Background: surface (#161B27)
- Border: 1px solid border (#2A3450)
- Sin sombras pesadas, usar border sutil

### Botones Primarios
- Background: primary (#4ADE80)
- Text: #0E1117 (oscuro sobre verde)
- Border radius: 16px
- Height: 56px
- Font weight: 700

### Botones Secundarios
- Background: surface2 (#1E2535)
- Text: foreground (#F0F4FF)
- Border: 1px solid border

### Pills / Badges
- Border radius: 100px (pill completo)
- Padding: 6px 14px
- Font size: 13px, weight 600

### Progress Bars
- Background: surface2 (#1E2535)
- Fill: primary (#4ADE80) o gradiente
- Height: 8px, border radius: 4px

## Iconografía
- Emojis como iconos principales (mantener el estilo actual)
- Tamaño estándar: 24px para UI, 32px para features, 48px para hero

## Animaciones
- Transiciones: 200ms ease-out
- Feedback de press: scale 0.96
- Entrada de pantalla: fade + translateY(8px) → translateY(0)
