const PBKDF2_ITERATIONS = 100000;
const PBKDF2_KEY_LENGTH = 32;
const SALT_LENGTH = 16;

export interface HashedPassword {
  hash: string;
  salt: string;
}

export async function hashPassword(
  password: string,
  pepper: string = ""
): Promise<HashedPassword> {
  const saltBytes = crypto.getRandomValues(new Uint8Array(SALT_LENGTH));
  const salt = bytesToBase64(saltBytes);
  const saltBuffer = new Uint8Array(saltBytes);
  const hash = await pbkdf2(password + pepper, saltBuffer, PBKDF2_ITERATIONS, PBKDF2_KEY_LENGTH);
  return {
    hash: bytesToBase64(hash),
    salt,
  };
}

export async function verifyPassword(
  password: string,
  storedHash: string,
  storedSalt: string,
  pepper: string = ""
): Promise<boolean> {
  const saltBytes = base64ToBytes(storedSalt);
  const saltBuffer = new Uint8Array(saltBytes);
  const computedHash = await pbkdf2(
    password + pepper,
    saltBuffer,
    PBKDF2_ITERATIONS,
    PBKDF2_KEY_LENGTH
  );
  const computedHashBase64 = bytesToBase64(computedHash);
  return timingSafeEqual(computedHashBase64, storedHash);
}

async function pbkdf2(
  password: string,
  salt: Uint8Array,
  iterations: number,
  keyLength: number
): Promise<Uint8Array> {
  const encoder = new TextEncoder();
  const passwordBuffer = new Uint8Array(encoder.encode(password));
  const saltBuffer = new Uint8Array(salt);
  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    passwordBuffer,
    "PBKDF2",
    false,
    ["deriveBits"]
  );
  const derivedBits = await crypto.subtle.deriveBits(
    {
      name: "PBKDF2",
      salt: saltBuffer,
      iterations,
      hash: "SHA-256",
    },
    keyMaterial,
    keyLength * 8
  );
  return new Uint8Array(derivedBits);
}

function bytesToBase64(bytes: Uint8Array): string {
  let binary = "";
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]!);
  }
  return btoa(binary);
}

function base64ToBytes(base64: string): Uint8Array {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) {
    return false;
  }
  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return result === 0;
}
