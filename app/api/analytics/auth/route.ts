import {
  createLoginResponse,
  createSessionToken,
  isAuthenticated,
  verifyPassword,
} from "@/lib/analyticsAuth";

export async function GET(request: Request) {
  const authenticated = await isAuthenticated(request);

  return Response.json({
    authenticated,
  });
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      password?: string;
    };

    const password = body.password?.trim();

    if (!password) {
      return Response.json(
        {
          error: "Introduce la contraseña.",
        },
        {
          status: 400,
        }
      );
    }

    const valid = await verifyPassword(password);

    if (!valid) {
      return Response.json(
        {
          error: "Contraseña incorrecta.",
        },
        {
          status: 401,
        }
      );
    }

    const token = await createSessionToken();

    const secure = new URL(request.url).protocol === "https:";

    return createLoginResponse(token, secure);
  } catch {
    return Response.json(
      {
        error: "No se pudo iniciar sesión.",
      },
      {
        status: 500,
      }
    );
  }
}