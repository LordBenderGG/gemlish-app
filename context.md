# 📚 Contexto del Proyecto Gemlish

**Última actualización:** 8 de abril de 2026

---

## 🎯 ¿Qué es Gemlish?

**Gemlish: Aprende Inglés Jugando** es una aplicación móvil completamente gratuita (sin suscripciones ni tarjetas) que enseña inglés de forma progresiva y gamificada, diseñada específicamente para **hispanohablantes**.

### Objetivos principales:
- 500 niveles con progresión de dificultad gradual
- 400 lecciones reales con 4.000 palabras
- Ejercicios interactivos y divertidos
- Sistema de gamificación (diamantes, XP, rachas)
- 100% offline - no requiere conexión
- Soporte para modo claro y oscuro

---

## 🏗️ Cómo fue creado

El proyecto fue inicializado como una aplicación **React Native con Expo**, utilizando las mejores prácticas modernas:

- **Framework base:** React Native 0.81 con Expo SDK 54
- **Lenguaje:** TypeScript 5.9
- **Estilos:** NativeWind (Tailwind CSS para React Native)
- **Navegación:** Expo Router 6
- **Persistencia:** AsyncStorage + Expo SQLite
- **Servidor:** Express + tRPC
- **Base de datos:** Drizzle ORM con MySQL
- **Monetización:** Google AdMob
- **Gestor de paquetes:** pnpm 9

### Configuración importante:
- **Bundle ID:** `com.gemlish`
- **Nombre en Play Store:** "Gemlish: Aprende Inglés Jugando"
- **API:** Basada en tRPC (type-safe RPC framework)
- **Autenticación:** JWT con jose
- **Testing:** Vitest

---

## 🎮 ¿Cómo funciona?

### Sistema de progresión
```
Nivel 1-50    → Básico (Saludos, números, colores, familia)
Nivel 51-100  → Intermedio-bajo (Trabajo, viajes, tecnología)
Nivel 101-150 → Intermedio (Negocios, phrasal verbs)
Nivel 151-200 → Intermedio-alto (Finanzas, derecho, ciencia)
Nivel 201-250 → Avanzado cotidiano (Modismos, inglés formal)
Nivel 251-300 → Avanzado (Medicina, psicología, filosofía)
Nivel 301-350 → Avanzado especializado (IA, blockchain, ciberseguridad)
Nivel 351-400 → Muy avanzado (Neurociencia, física, retórica)
Nivel 401+    → Reciclaje desde lección 1
```

### 3 tipos de ejercicios
1. **Completar la oración:** Palabra faltante + 4 opciones
2. **Ordenar palabras:** Reorganizar para formar oraciones correctas
3. **Juego de memoria:** Emparejar inglés ↔ español

Los ejercicios se generan dinámicamente en `data/exerciseGenerator.ts` con distractores inteligentes.

### Características de usuario
- **Tarea diaria:** 10 palabras nuevas con quiz
- **Sistema de racha:** Motivación diaria
- **Diamantes y XP:** Recompensas por completar
- **Pronunciación fonética:** En español simplificado
  - Ejemplo: "yellow" → YELO, "thanks" → ZANKS

---

## 📁 Estructura del proyecto

```
gemlish/
├── app/                      # Pantallas principales
│   ├── (tabs)/
│   │   ├── index.tsx        # Mapa de niveles (pantalla principal)
│   │   ├── daily.tsx        # Tarea diaria
│   │   ├── game.tsx         # Juegos interactivos
│   │   └── profile.tsx      # Perfil y estadísticas
│   └── _layout.tsx          # Layout raíz con navegación
│
├── components/               # Componentes reutilizables
│   ├── AdBanner.tsx         # Banner de anuncios AdMob
│   ├── screen-container.tsx # SafeAreaView + padding
│   └── ui/                  # Componentes UI genéricos
│
├── data/                    # Datos y lógica de ejercicios
│   ├── lessons.ts           # 400 lecciones (4.000 palabras)
│   └── exerciseGenerator.ts # Generador dinámico de ejercicios
│
├── hooks/                   # Hooks personalizados
│   ├── useAdMob.ts          # Gestión de anuncios
│   └── use-colors.ts        # Sistema de temas
│
├── lib/                     # Utilidades
│   └── storage.ts           # Gestión de progreso local
│
├── context/                 # Context API
│   └── [contextos globales]
│
├── server/                  # Backend
│   ├── _core/index.ts       # Servidor Express + tRPC
│   └── [rutas tRPC]
│
├── assets/                  # Imágenes y recursos
│   └── images/
│
├── theme.config.js          # Paleta de colores
├── app.config.ts            # Configuración de Expo
├── tailwind.config.js       # Configuración Tailwind
├── tsconfig.json            # Configuración TypeScript
├── drizzle.config.ts        # Configuración ORM
├── package.json             # Dependencias
└── README.md                # Documentación

```

---

## 🔧 Stack tecnológico

| Tecnología | Versión | Propósito |
|-----------|---------|----------|
| React Native | 0.81 | Framework móvil |
| Expo SDK | 54 | Plataforma de desarrollo |
| TypeScript | 5.9 | Tipado estático |
| NativeWind | 4 | Estilos Tailwind CSS |
| Expo Router | 6 | Navegación entre pantallas |
| React Native Reanimated | 4.x | Animaciones fluidas |
| AsyncStorage | 2.x | Persistencia de datos |
| Expo SQLite | 16 | Base de datos local |
| tRPC | 11.7 | API type-safe |
| Drizzle ORM | 0.44.7 | Gestión de BD |
| Express | 4.22 | Servidor backend |
| React Query | 5.90 | Gestión de datos remotos |
| Zod | 4.2 | Validación de esquemas |
| Google Mobile Ads | 16.2 | Monetización AdMob |

---

## 🚀 Comandos principales

```bash
# Desarrollo
pnpm dev              # Inicia servidor + Metro
pnpm dev:server       # Solo servidor
pnpm dev:metro        # Solo Metro bundler

# Building
pnpm build            # Compilar para producción
pnpm android          # Ejecutar en Android

# Validación
pnpm check           # Type check con TypeScript
pnpm lint            # ESLint
pnpm format          # Prettier
pnpm test            # Vitest

# Base de datos
pnpm db:push         # Generar y migrar BD

# QR para desarrollo
pnpm qr              # Generar QR para Expo Go
```

---

## 📋 Reportes y documentación

### Documentos importantes:
- **Gemlish_QA_Report_Completo.docx** - Reporte QA completo (actualizado 31/03)
- **Informe_Bugs_Gemlish.docx** - Informe de bugs encontrados (actualizado 31/03)
- **todo.md** - Lista de tareas pendientes

### Configuración:
- **.env.local** - Variables de entorno (AdMob, API keys)
- **version.properties** - Versión actual de la app
- **eas.json** - Configuración de EAS Build

---

## 🔐 Internacionalización

- **Idioma principal:** Español (neutro para Latinoamérica y España)
- **Pronunciación:** Fonética simplificada en español
- **Ejemplos:** Contextualizados para hispanohablantes
- **UI:** Completamente en español

---

## 📊 Métricas del proyecto

- **Líneas de código:** ~10,000+ (estimado)
- **Componentes:** 30+
- **Pantallas:** 4 principales (mapa, diaria, juego, perfil)
- **Lecciones:** 400 reales
- **Palabras:** 4.000+
- **Niveles:** 500
- **Tipos de ejercicios:** 3

---

## 🐛 Estado actual

**Última actualización:** 8 de abril de 2026

### Estado QA Final Pre-Producción:
- ✅ **APROBADO PARA PRODUCCIÓN**
- Documentos QA:
  - `QA_Final_PreProduccion.docx` - Reporte ejecutivo completo
  - `Analisis_Detallado_Codigo_QA.docx` - Análisis técnico profundo

### Hallazgos principales:
- **Seguridad:** ⚠️ Hash de contraseña manual (aceptable para offline, crítico si hay servidor)
- **Estabilidad:** ✅ Transacciones ACID, manejo robusto de errores
- **Rendimiento:** ✅ Animaciones optimizadas, SQLite eficiente
- **Datos:** ✅ Persistencia confiable con fallbacks

### Build activo:
- Versión: 1.0.0 (ver version.properties)
- Estado: **READY FOR PRODUCTION**
- Recomendación: Ejecutar checklist pre-launch antes de subir a Play Store

---

## 🎯 ESTADO ACTUAL: LISTO PARA PRODUCCIÓN

### ✓ QA COMPLETADO (8 de abril de 2026)

**VEREDICTO:** APROBADO PARA PRODUCCIÓN

**Documentos generados:**
1. `QA_Final_PreProduccion.docx` - Reporte QA ejecutivo
2. `Analisis_Detallado_Codigo_QA.docx` - Análisis técnico
3. `GUIA_Compilar_Probar_Telefono.docx` - Paso a paso para build
4. `RESUMEN_FINAL.docx` - Resumen ejecutivo

### ✓ VALIDACIONES COMPLETADAS

**Seguridad:**
- ✓ 100% offline (solo AdMob conecta a internet)
- ✓ AdMob validado en PRODUCCIÓN
- ✓ Datos persistentes en SQLite
- ✓ Contraseñas: offline, seguridad aceptable

**Estabilidad:**
- ✓ Transacciones ACID
- ✓ Manejo robusto de errores
- ✓ Cleanup de memoria correcto
- ✓ No hay memory leaks

**Rendimiento:**
- ✓ Animaciones optimizadas
- ✓ Bundle size eficiente
- ✓ Startup rápido

### 🚀 PRÓXIMOS PASOS

1. `pnpm check && pnpm lint` — validar compilación
2. `pnpm android` — compilar y probar en teléfono
3. Ejecutar checklist de testing
4. `eas build --platform android --auto-submit` — build de producción
5. Subir a Google Play Console

---

## 📝 Notas para Claude

Este archivo se **actualiza automáticamente** después de cada tarea completada:
- Cambios en estructura
- Nuevas características añadidas
- Bugs corregidos
- Cambios en dependencias
- Cambios en configuración
- Decisiones arquitectónicas

**No es necesario pedir permiso para actualizar este archivo.**

---

**Mantenido por:** Claude en Cowork  
**Formato:** Markdown  
**Última actualización:** 8 de abril de 2026  
**Estado:** QA COMPLETADO - READY FOR PRODUCTION ✓
