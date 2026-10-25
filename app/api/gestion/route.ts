
import { env } from "cloudflare:workers";

import { isAuthenticated } from "@/lib/analyticsAuth";
import {
  activateBusiness,
  archiveBusiness,
  createBusiness,
  deactivateBusiness,
  getAllBusinessesForManagement,
  restoreBusiness,
  updateBusiness,
} from "@/lib/businesses";

type BusinessBody = {
  id?: string;
  name?: string;
  slug?: string;
  googleReviewUrl?: string;
  logoUrl?: string;
};

type BusinessAction = "activate" | "archive" | "restore";

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
    return { error: "El nombre del negocio es obligatorio." };
  }

  if (!slug) {
    return { error: "El slug es obligatorio." };
  }

  if (!googleReviewUrl) {
    return { error: "La URL de Google es obligatoria." };
  }

  try {
    new URL(googleReviewUrl);
  } catch {
    return { error: "La URL de Google no es válida." };
  }

  if (logoUrl) {
    try {
      new URL(logoUrl);
    } catch {
      return { error: "La URL del logo no es válida." };
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
      { error: "No autorizado." },
      { status: 401 }
    );
  }

  try {
    const businesses = await getAllBusinessesForManagement();

    const totalsResult = await env.toca_analytics
      .prepare(`
        SELECT
          COALESCE(SUM(visits), 0) AS visits,
          COALESCE(SUM(google_clicks), 0) AS google_clicks,
          MAX(last_activity) AS last_activity
        FROM analytics_daily
      `)
      .first();

    const businessStatsResult = await env.toca_analytics
      .prepare(`
        SELECT
          business_id,
          COALESCE(SUM(visits), 0) AS visits,
          COALESCE(SUM(google_clicks), 0) AS google_clicks,
          MAX(last_activity) AS last_activity
        FROM analytics_daily
        GROUP BY business_id
      `)
      .all();

    const dailyResult = await env.toca_analytics
      .prepare(`
        SELECT
          date,
          COALESCE(SUM(visits), 0) AS visits,
          COALESCE(SUM(google_clicks), 0) AS google_clicks
        FROM analytics_daily
        GROUP BY date
        ORDER BY date DESC
        LIMIT 14
      `)
      .all();

    const statsByBusiness: Record<
      string,
      {
        visits: number;
        googleClicks: number;
        lastActivity: string | null;
      }
    > = {};

    for (const row of businessStatsResult.results) {
      const businessId = String(row.business_id);

      statsByBusiness[businessId] = {
        visits: Number(row.visits) || 0,
        googleClicks: Number(row.google_clicks) || 0,
        lastActivity: row.last_activity
          ? String(row.last_activity)
          : null,
      };
    }

    const daily = dailyResult.results
      .map((row) => ({
        date: String(row.date),
        visits: Number(row.visits) || 0,
        googleClicks: Number(row.google_clicks) || 0,
      }))
      .reverse();

    const nonArchivedBusinesses = businesses.filter(
      (business) => !business.archivedAt
    );

    const active = nonArchivedBusinesses.filter(
      (business) => business.active
    ).length;

    const inactive = nonArchivedBusinesses.filter(
      (business) => !business.active
    ).length;

    const visits = Number(totalsResult?.visits) || 0;
    const googleClicks =
      Number(totalsResult?.google_clicks) || 0;

    const archived = businesses.filter(
      (business) => Boolean(business.archivedAt)
    ).length;

    return Response.json({
      businesses,
      summary: {
        active,
        inactive,
        total: nonArchivedBusinesses.length,
        archived,
        visits,
        googleClicks,
        lastActivity: totalsResult?.last_activity
          ? String(totalsResult.last_activity)
          : null,
      },
      statsByBusiness,
      daily,
    });

  } catch (error) {
    console.error("[GET /api/gestion] Error al obtener los datos:", error);

    return Response.json(
      {
        error: "No se pudieron obtener los datos de gestión.",
      },
      { status: 500 }
    );
  }

}

export async function POST(request: Request) {
  if (!(await isAuthenticated(request))) {
    return Response.json(
      { error: "No autorizado." },
      { status: 401 }
    );
  }

  try {
    const body = (await request.json()) as BusinessBody;
    const validation = validateBusinessData(body);

    if ("error" in validation) {
      return Response.json(
        { error: validation.error },
        { status: 400 }
      );
    }

    const business = await createBusiness(validation.data);

    return Response.json(
      { business },
      { status: 201 }
    );
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "";

    if (message.includes("UNIQUE constraint failed")) {
      return Response.json(
        { error: "Ese slug ya está siendo utilizado." },
        { status: 409 }
      );
    }

    return Response.json(
      { error: "No se pudo crear el negocio." },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  if (!(await isAuthenticated(request))) {
    return Response.json(
      { error: "No autorizado." },
      { status: 401 }
    );
  }

  try {
    const body = (await request.json()) as BusinessBody;

    if (!body.id?.trim()) {
      return Response.json(
        { error: "Falta el ID del negocio." },
        { status: 400 }
      );
    }

    const validation = validateBusinessData(body);

    if ("error" in validation) {
      return Response.json(
        { error: validation.error },
        { status: 400 }
      );
    }

    const business = await updateBusiness({
      id: body.id.trim(),
      ...validation.data,
    });

    if (!business) {
      return Response.json(
        {
          error:
            "El negocio no existe, está inactivo o está archivado.",
        },
        { status: 404 }
      );
    }

    return Response.json({ business });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "";

    if (message.includes("UNIQUE constraint failed")) {
      return Response.json(
        { error: "Ese slug ya está siendo utilizado." },
        { status: 409 }
      );
    }

    return Response.json(
      { error: "No se pudo actualizar el negocio." },
      { status: 500 }
    );
  }
}

/**
 * DELETE mantiene el comportamiento anterior:
 * desactiva el negocio sin archivarlo ni eliminarlo.
 */
export async function DELETE(request: Request) {
  if (!(await isAuthenticated(request))) {
    return Response.json(
      { error: "No autorizado." },
      { status: 401 }
    );
  }

  try {
    const body = (await request.json()) as { id?: string };
    const id = body.id?.trim();

    if (!id) {
      return Response.json(
        { error: "Falta el ID del negocio." },
        { status: 400 }
      );
    }

    const deactivated = await deactivateBusiness(id);

    if (!deactivated) {
      return Response.json(
        {
          error:
            "El negocio no existe, ya está desactivado o está archivado.",
        },
        { status: 404 }
      );
    }

    return Response.json({ success: true });
  } catch {
    return Response.json(
      { error: "No se pudo desactivar el negocio." },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request) {
  if (!(await isAuthenticated(request))) {
    return Response.json(
      { error: "No autorizado." },
      { status: 401 }
    );
  }

  try {
    const body = (await request.json()) as {
      id?: string;
      action?: BusinessAction | string;
    };

    const id = body.id?.trim();

    if (!id) {
      return Response.json(
        { error: "Falta el ID del negocio." },
        { status: 400 }
      );
    }

    if (
      body.action !== "activate" &&
      body.action !== "archive" &&
      body.action !== "restore"
    ) {
      return Response.json(
        { error: "Acción no válida." },
        { status: 400 }
      );
    }

    let success = false;
    let errorMessage = "No se pudo realizar la operación.";

    switch (body.action) {
      case "activate":
        success = await activateBusiness(id);
        errorMessage =
          "No se pudo activar el negocio. Comprueba que exista, esté desactivado y no esté archivado.";
        break;

      case "archive":
        success = await archiveBusiness(id);
        errorMessage =
          "No se pudo archivar el negocio. Puede que no exista o ya esté archivado.";
        break;

      case "restore":
        success = await restoreBusiness(id);
        errorMessage =
          "No se pudo restaurar el negocio. Puede que no exista o no esté archivado.";
        break;
    }

    if (!success) {
      return Response.json(
        { error: errorMessage },
        { status: 404 }
      );
    }

    return Response.json({
      success: true,
      action: body.action,
    });
  } catch {
    return Response.json(
      { error: "No se pudo realizar la operación." },
      { status: 500 }
    );
  }
}
