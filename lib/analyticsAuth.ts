import { env } from "cloudflare:workers";

const SESSION_DURATION = 60 * 60 * 24 * 7;

type AnalyticsAuthEnv = {
  ANALYTICS_PASSWORD: string;
  ANALYTICS_SESSION_SECRET: string;
};

function getAuthEnv() {
  return env as typeof env & AnalyticsAuthEnv;
}

function base64UrlEncode(value: string) {
  const bytes = new TextEncoder().encode(value);

  let binary = "";

  for (const byte of bytes) {
    binary += String.fromCharCode(byte);
  }

  return btoa(binary)
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

function base64UrlDecode(value: string) {
  const padded = value
    .replace(/-/g, "+")
    .replace(/_/g, "/")
    .padEnd(value.length + ((4 - (value.length % 4)) % 4), "=");

  const binary = atob(padded);

  const bytes = Uint8Array.from(binary, (character) =>
    character.charCodeAt(0)
  );

  return new TextDecoder().decode(bytes);
}

async function createSignature(value: string) {
  const { ANALYTICS_SESSION_SECRET } = getAuthEnv();

  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(ANALYTICS_SESSION_SECRET),
    {
      name: "HMAC",
      hash: "SHA-256",
    },
    false,
    ["sign"]
  );

  const signature = await crypto.subtle.sign(
    "HMAC",
    key,
    new TextEncoder().encode(value)
  );

  const bytes = new Uint8Array(signature);

  let binary = "";

  for (const byte of bytes) {
    binary += String.fromCharCode(byte);
  }

  return base64UrlEncode(binary);
}

async function safeCompare(a: string, b: string) {
  if (a.length !== b.length) {
    return false;
  }

  const aBytes = new TextEncoder().encode(a);
  const bBytes = new TextEncoder().encode(b);

  let difference = 0;

  for (let index = 0; index < aBytes.length; index++) {
    difference |= aBytes[index] ^ bBytes[index];
  }

  return difference === 0;
}

export async function verifyPassword(password: string) {
  const { ANALYTICS_PASSWORD } = getAuthEnv();

  return safeCompare(password, ANALYTICS_PASSWORD);
}

export async function createSessionToken() {
  const expiresAt =
    Math.floor(Date.now() / 1000) + SESSION_DURATION;

  const payload = `analytics:${expiresAt}`;
  const encodedPayload = base64UrlEncode(payload);
  const signature = await createSignature(encodedPayload);

  return `${encodedPayload}.${signature}`;
}

export async function isAuthenticated(request: Request) {
  const cookieHeader = request.headers.get("Cookie");

  if (!cookieHeader) {
    return false;
  }

  const cookies = cookieHeader.split(";");

  const sessionCookie = cookies
    .map((cookie) => cookie.trim())
    .find((cookie) =>
      cookie.startsWith("toca_analytics_session=")
    );

  if (!sessionCookie) {
    return false;
  }

  const token = sessionCookie.slice(
    "toca_analytics_session=".length
  );

  const [encodedPayload, signature] = token.split(".");

  if (!encodedPayload || !signature) {
    return false;
  }

  const expectedSignature =
    await createSignature(encodedPayload);

  if (!(await safeCompare(signature, expectedSignature))) {
    return false;
  }

  try {
    const payload = base64UrlDecode(encodedPayload);
    const [type, expiresAtText] = payload.split(":");

    if (type !== "analytics") {
      return false;
    }

    const expiresAt = Number(expiresAtText);

    if (!Number.isFinite(expiresAt)) {
      return false;
    }

    return (
      Math.floor(Date.now() / 1000) < expiresAt
    );
  } catch {
    return false;
  }
}

export function createLoginResponse(
  token: string,
  secure: boolean
) {
  const cookieParts = [
    `toca_analytics_session=${token}`,
    "Path=/",
    "HttpOnly",
    "SameSite=Lax",
    `Max-Age=${SESSION_DURATION}`,
  ];

  if (secure) {
    cookieParts.push("Secure");
  }

  return Response.json(
    {
      success: true,
    },
    {
      headers: {
        "Set-Cookie": cookieParts.join("; "),
      },
    }
  );
}