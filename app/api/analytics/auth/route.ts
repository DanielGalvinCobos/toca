import { env } from "cloudflare:workers";
import {
  createLoginResponse,
  createLogoutResponse,
  createSessionToken,
  isAuthenticated,
  verifyPassword,
} from "@/lib/analyticsAuth";

const MAX_LOGIN_ATTEMPTS = 5;
const WINDOW_SECONDS = 15 * 60;

type RateLimitEnv = typeof env & {
  ANALYTICS_SESSION_SECRET: string;
};

async function getClientIpHash(request: Request): Promise<string> {
  const authEnv = env as RateLimitEnv;
  const secret = authEnv.ANALYTICS_SESSION_SECRET;

  const clientIp =
    request.headers.get("CF-Connecting-IP")?.trim() ||
    "local-development";

  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );

  const signature = await crypto.subtle.sign(
    "HMAC",
    key,
    new TextEncoder().encode(clientIp)
  );

  return Array.from(new Uint8Array(signature))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

async function registerLoginAttempt(ipHash: string) {
  const now = Math.floor(Date.now() / 1000);

  const result = await env.toca_analytics
    .prepare(
      `INSERT INTO login_rate_limits
         (ip_hash, window_start, attempts, updated_at)
       VALUES (?, ?, 1, ?)
       ON CONFLICT(ip_hash) DO UPDATE SET
         window_start = CASE
           WHEN excluded.updated_at - login_rate_limits.window_start >= ?
           THEN excluded.updated_at
           ELSE login_rate_limits.window_start
         END,
         attempts = CASE
           WHEN excluded.updated_at - login_rate_limits.window_start >= ?
           THEN 1
           ELSE login_rate_limits.attempts + 1
         END,
         updated_at = excluded.updated_at
       RETURNING attempts, window_start`
    )
    .bind(
      ipHash,
      now,
      now,
      WINDOW_SECONDS,
      WINDOW_SECONDS
    )
    .first<{ attempts: number; window_start: number }>();

  if (!result) {
    throw new Error("No se pudo comprobar el límite de acceso.");
  }

  return {
    allowed: result.attempts <= MAX_LOGIN_ATTEMPTS,
    retryAfter: Math.max(
      1,
      result.window_start + WINDOW_SECONDS - now
    ),
  };
}

async function clearLoginAttempts(ipHash: string) {
  await env.toca_analytics
    .prepare("DELETE FROM login_rate_limits WHERE ip_hash = ?")
    .bind(ipHash)
    .run();
}

export async function GET(request: Request) {
  const authenticated = await isAuthenticated(request);

  return Response.json(
    { authenticated },
    { headers: { "Cache-Control": "no-store" } }
  );
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      password?: string;
    };

    const password = body.password?.trim();

    if (!password) {
      return Response.json(
        { error: "Introduce la contraseña." },
        {
          status: 400,
          headers: { "Cache-Control": "no-store" },
        }
      );
    }

    const ipHash = await getClientIpHash(request);
    const limit = await registerLoginAttempt(ipHash);

    if (!limit.allowed) {
      return Response.json(
        {
          error:
            "Demasiados intentos de inicio de sesión. Inténtalo más tarde.",
        },
        {
          status: 429,
          headers: {
            "Cache-Control": "no-store",
            "Retry-After": String(limit.retryAfter),
          },
        }
      );
    }

    const valid = await verifyPassword(password);

    if (!valid) {
      return Response.json(
        { error: "Contraseña incorrecta." },
        {
          status: 401,
          headers: { "Cache-Control": "no-store" },
        }
      );
    }

    await clearLoginAttempts(ipHash);

    const token = await createSessionToken();
    const secure = new URL(request.url).protocol === "https:";

    return createLoginResponse(token, secure);
  } catch {
    return Response.json(
      { error: "No se pudo iniciar sesión." },
      {
        status: 500,
        headers: { "Cache-Control": "no-store" },
      }
    );
  }
}

export async function DELETE(request: Request) {
  const secure = new URL(request.url).protocol === "https:";

  return createLogoutResponse(secure);
}