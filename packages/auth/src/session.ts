export function generateSessionToken(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(32));
  return bytesToBase64Url(bytes);
}

export function hashSessionToken(token: string): string {
  return bytesToBase64Url(new TextEncoder().encode(token));
}

export async function hashSessionTokenAsync(token: string): Promise<string> {
  const data = new TextEncoder().encode(token);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  return bytesToBase64Url(new Uint8Array(hashBuffer));
}

export function getSessionExpiry(durationMs: number = 30 * 24 * 60 * 60 * 1000): string {
  return new Date(Date.now() + durationMs).toISOString();
}

export function isSessionExpired(expiresAt: string): boolean {
  return new Date(expiresAt).getTime() <= Date.now();
}

export function isSessionRevoked(revokedAt: string | null): boolean {
  return revokedAt !== null;
}

export async function hashUserAgent(userAgent: string): Promise<string> {
  const data = new TextEncoder().encode(userAgent);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  return bytesToHex(new Uint8Array(hashBuffer));
}

export async function hashIp(ip: string): Promise<string> {
  const data = new TextEncoder().encode(ip);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  return bytesToHex(new Uint8Array(hashBuffer));
}

function bytesToBase64Url(bytes: Uint8Array): string {
  let binary = "";
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]!);
  }
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function bytesToHex(bytes: Uint8Array): string {
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}
