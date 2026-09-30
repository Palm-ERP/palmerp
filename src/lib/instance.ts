/**
 * Identidad de instancia (Edge-safe: sin imports de node, apto para middleware).
 *
 * Problema que resuelve: varias instancias (palmerp, belpane, getloudspace...)
 * comparten en local el mismo origen (localhost:3000), el mismo nombre de
 * cookie de NextAuth y el mismo NEXTAUTH_SECRET. Con estrategia JWT, la cookie
 * de una instancia es aceptada por otra y el sidebar muestra un usuario ajeno
 * (ej. will@getloud.space dentro de palmerp).
 *
 * Solución: el nombre de la cookie de sesión lleva el id de instancia, así que
 * aunque coincidan origen y secreto, cada app solo lee SU cookie.
 *
 * Precedencia del id: PINNED_TENANT_SLUG > NEXT_PUBLIC_PINNED_TENANT_SLUG
 * > PALMERP_INSTANCE_ID > "palmerp" (núcleo por defecto).
 */

function cleanSlug(value: string | undefined | null): string | null {
  const cleaned = (value ?? "").trim().toLowerCase().replace(/[^a-z0-9-]/g, "");
  return cleaned ? cleaned : null;
}

/** Id corto de esta instancia/despliegue. */
export function getInstanceId(): string {
  return (
    cleanSlug(process.env.PINNED_TENANT_SLUG) ??
    cleanSlug(process.env.NEXT_PUBLIC_PINNED_TENANT_SLUG) ??
    cleanSlug(process.env.PALMERP_INSTANCE_ID) ??
    "palmerp"
  );
}

/** Replica el comportamiento por defecto de NextAuth (prefijo __Secure- en https). */
export function isSecureAuthCookies(): boolean {
  return (process.env.NEXTAUTH_URL ?? "").trim().toLowerCase().startsWith("https://");
}

function securePrefix(kind: "secure" | "host"): string {
  if (!isSecureAuthCookies()) return "";
  return kind === "host" ? "__Host-" : "__Secure-";
}

/** Nombre exacto de la cookie de sesión para esta instancia. */
export function getSessionCookieName(): string {
  return `${securePrefix("secure")}${getInstanceId()}.session-token`;
}

/** Nombre exacto de la cookie CSRF para esta instancia. */
export function getCsrfCookieName(): string {
  return `${securePrefix("host")}${getInstanceId()}.csrf-token`;
}

/** Nombre exacto de la cookie de callback para esta instancia. */
export function getCallbackCookieName(): string {
  return `${securePrefix("secure")}${getInstanceId()}.callback-url`;
}

/**
 * Slug fijado por entorno (solo tenant). null = despliegue multi-tenant legacy.
 * Se usa para rechazar logins de otros tenants aunque compartan DB/secreto.
 */
export function getPinnedSlugServer(): string | null {
  return (
    cleanSlug(process.env.PINNED_TENANT_SLUG) ??
    cleanSlug(process.env.NEXT_PUBLIC_PINNED_TENANT_SLUG)
  );
}
