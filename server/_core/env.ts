const isProduction = process.env.NODE_ENV === "production";

// En producción, JWT_SECRET vacío permite forjar tokens — se debe fallar en startup.
const rawCookieSecret = process.env.JWT_SECRET ?? "";
if (isProduction && !rawCookieSecret) {
  throw new Error(
    "[ENV] JWT_SECRET no está configurado. " +
    "Configura esta variable de entorno antes de arrancar en producción."
  );
}

export const ENV = {
  appId: process.env.VITE_APP_ID ?? "",
  cookieSecret: rawCookieSecret,
  databaseUrl: process.env.DATABASE_URL ?? "",
  oAuthServerUrl: process.env.OAUTH_SERVER_URL ?? "",
  ownerOpenId: process.env.OWNER_OPEN_ID ?? "",
  isProduction,
  forgeApiUrl: process.env.BUILT_IN_FORGE_API_URL ?? "",
  forgeApiKey: process.env.BUILT_IN_FORGE_API_KEY ?? "",
};
