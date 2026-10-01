import { isAuthenticated } from "@/lib/analyticsAuth";
import {
  createBusiness,
  getAllBusinesses,
  updateBusiness,
} from "@/lib/businesses";

type BusinessBody = {
  id?: string;
  name?: string;
  slug?: string;
  googleReviewUrl?: string;
  logoUrl?: string;
};

function normalizeSlug(slug: string) {
  return slug
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function validateBusinessData(body: BusinessBody) {
  const name = body.name?.trim();
  const slug = normalizeSlug(body.slug || "");
  const googleReviewUrl = body.googleReviewUrl?.trim();
  const logoUrl = body.logoUrl?.trim();

  if (!name) {
    return {
      error: "El nombre del negocio es obligatorio.",
    };
  }

  if (!slug) {
    return {
      error: "El slug es obligatorio.",
    };
  }

  if (!googleReviewUrl) {
    return {
      error: "La URL de Google es obligatoria.",
    };
  }

  try {
    new URL(googleReviewUrl);
  } catch {
    return {
      error: "La URL de Google no es válida.",
    };
  }

  if (logoUrl) {
    try {
      new URL(logoUrl);
    } catch {
      return {
        error: "La URL del logo no es válida.",
      };
    }
  }

  return {
    data: {
      name,
      slug,
      googleReviewUrl,
      logoUrl,
    },
  };
}

export async function GET(request: Request) {
  if (!(await isAuthenticated(request))) {
    return Response.json(
      {
        error: "No autorizado.",
      },
      {
        status: 401,
      }
    );
  }

  try {
    const businesses = await getAllBusinesses();

    return Response.json({
      businesses,
    });
  } catch {
    return Response.json(
      {
        error: "No se pudieron obtener los negocios.",
      },
      {
        status: 500,
      }
    );
  }
}

export async function POST(request: Request) {
  if (!(await isAuthenticated(request))) {
    return Response.json(
      {
        error: "No autorizado.",
      },
      {
        status: 401,
      }
    );
  }

  try {
    const body = (await request.json()) as BusinessBody;

    const validation = validateBusinessData(body);

    if ("error" in validation) {
      return Response.json(
        {
          error: validation.error,
        },
        {
          status: 400,
        }
      );
    }

    const business = await createBusiness(validation.data);

    return Response.json(
      {
        business,
      },
      {
        status: 201,
      }
    );
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "";

    if (message.includes("UNIQUE constraint failed")) {
      return Response.json(
        {
          error: "Ese slug ya está siendo utilizado.",
        },
        {
          status: 409,
        }
      );
    }

    return Response.json(
      {
        error: "No se pudo crear el negocio.",
      },
      {
        status: 500,
      }
    );
  }
}

export async function PUT(request: Request) {
  if (!(await isAuthenticated(request))) {
    return Response.json(
      {
        error: "No autorizado.",
      },
      {
        status: 401,
      }
    );
  }

  try {
    const body = (await request.json()) as BusinessBody;

    if (!body.id?.trim()) {
      return Response.json(
        {
          error: "Falta el ID del negocio.",
        },
        {
          status: 400,
        }
      );
    }

    const validation = validateBusinessData(body);

    if ("error" in validation) {
      return Response.json(
        {
          error: validation.error,
        },
        {
          status: 400,
        }
      );
    }

    const business = await updateBusiness({
      id: body.id.trim(),
      ...validation.data,
    });

    if (!business) {
      return Response.json(
        {
          error: "El negocio no existe.",
        },
        {
          status: 404,
        }
      );
    }

    return Response.json({
      business,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "";

    if (message.includes("UNIQUE constraint failed")) {
      return Response.json(
        {
          error: "Ese slug ya está siendo utilizado.",
        },
        {
          status: 409,
        }
      );
    }

    return Response.json(
      {
        error: "No se pudo actualizar el negocio.",
      },
      {
        status: 500,
      }
    );
  }
}