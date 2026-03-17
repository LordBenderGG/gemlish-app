import { ScrollViewStyleReset } from "expo-router/html";
import type { PropsWithChildren } from "react";

/**
 * Root HTML template for web.
 *
 * SOLUCIÓN DEFINITIVA AL MODO OSCURO:
 *
 * NativeWind en web funciona así:
 * 1. Lee `--css-interop-darkMode: class dark` del CSS para saber que usa darkMode: "class"
 * 2. Busca si <html> tiene la clase "dark"
 * 3. Si el CSS aún no cargó, usa Appearance.getColorScheme() del sistema como fallback
 *
 * El flash oscuro ocurre porque el CSS tarda en cargar y el sistema tiene modo oscuro.
 *
 * Solución: inyectar --css-interop-darkMode en un <style> inline (disponible antes del CSS)
 * y asegurarse de que <html> NO tenga la clase "dark" desde el principio.
 */
export default function Root({ children }: PropsWithChildren) {
  return (
    <html lang="es" data-theme="light">
      <head>
        <meta charSet="utf-8" />
        <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1, shrink-to-fit=no"
        />
        <meta name="color-scheme" content="light" />
        {/*
          CRÍTICO: Este script se ejecuta ANTES de que cargue cualquier CSS o JS.
          - Elimina la clase "dark" de <html> para que NativeWind no active modo oscuro
          - Inyecta --css-interop-darkMode en el estilo inline para que react-native-css-interop
            sepa inmediatamente que debe usar darkMode: "class" (no "media")
          - Con darkMode: "class" y sin la clase "dark", NativeWind usa modo claro
        */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                var root = document.documentElement;
                // Eliminar clase dark si el navegador la puso
                root.classList.remove('dark');
                // Establecer tema claro explícitamente
                root.dataset.theme = 'light';
                root.style.colorScheme = 'light';
              })();
            `,
          }}
        />
        {/*
          Inyectar --css-interop-darkMode ANTES de que cargue el CSS de NativeWind.
          Esto hace que react-native-css-interop use "class dark" como modo de detección
          desde el primer render, en lugar de caer en el fallback de Appearance (sistema).
          Como <html> no tiene la clase "dark", NativeWind usará modo claro siempre.
        */}
        <style
          dangerouslySetInnerHTML={{
            __html: `
              :root {
                --css-interop-darkMode: class dark;
                color-scheme: light only !important;
              }
              html, body {
                color-scheme: light only !important;
                background-color: #ffffff;
              }
              @media (prefers-color-scheme: dark) {
                :root, html, body {
                  color-scheme: light only !important;
                  background-color: #ffffff !important;
                  color: #11181C !important;
                }
              }
            `,
          }}
        />
        <ScrollViewStyleReset />
      </head>
      <body>{children}</body>
    </html>
  );
}
