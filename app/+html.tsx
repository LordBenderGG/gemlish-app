import { ScrollViewStyleReset } from "expo-router/html";
import type { PropsWithChildren } from "react";

/**
 * Root HTML template for web.
 * Forces light mode from the very start — before any JS runs —
 * so NativeWind never picks up the browser's dark color scheme.
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
        {/*
          Force light color scheme before any CSS or JS loads.
          This prevents NativeWind / Tailwind from reading
          prefers-color-scheme: dark from the browser.
        */}
        <meta name="color-scheme" content="light" />
        <style
          dangerouslySetInnerHTML={{
            __html: `
              :root {
                color-scheme: light only !important;
              }
              html, body {
                color-scheme: light only !important;
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
