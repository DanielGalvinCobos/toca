import { env } from "cloudflare:workers";

type AnalyticsEvent = {
  businessId?: string;
  source?: string;
  event?: string;
};

const VALID_SOURCES = new Set(["nfc", "qr", "direct"]);
const VALID_EVENTS = new Set(["visit", "google_click"]);

function getMadridDate() {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/Madrid",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

async function businessExists(businessId: string) {
  const result = await env.toca_analytics
    .prepare(`
      SELECT id
      FROM businesses
      WHERE id = ?
      LIMIT 1
    `)
    .bind(businessId)
    .first();

  return Boolean(result);
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as AnalyticsEvent;

    const businessId = body.businessId?.trim();
    const source = body.source?.trim();
    const event = body.event?.trim();

    if (
      !businessId ||
      !source ||
      !event ||
      !VALID_SOURCES.has(source) ||
      !VALID_EVENTS.has(event)
    ) {
      return Response.json(
        { error: "Datos de analítica no válidos." },
        { status: 400 }
      );
    }

    const exists = await businessExists(businessId);

    if (!exists) {
      return Response.json(
        { error: "El negocio no existe." },
        { status: 404 }
      );
    }

    const today = getMadridDate();
    const now = new Date().toISOString();

    const visits = event === "visit" ? 1 : 0;
    const googleClicks = event === "google_click" ? 1 : 0;

    await env.toca_analytics
      .prepare(`
        INSERT INTO analytics_daily (
          business_id,
          date,
          source,
          visits,
          google_clicks,
          last_activity
        )
        VALUES (?, ?, ?, ?, ?, ?)
        ON CONFLICT (business_id, date, source)
        DO UPDATE SET
          visits = visits + excluded.visits,
          google_clicks = google_clicks + excluded.google_clicks,
          last_activity = excluded.last_activity
      `)
      .bind(
        businessId,
        today,
        source,
        visits,
        googleClicks,
        now
      )
      .run();

    return Response.json({ success: true });
  } catch {
    return Response.json(
      { error: "No se pudo registrar la estadística." },
      { status: 500 }
    );
  }
}

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const businessId = url.searchParams.get("businessId")?.trim();

    if (!businessId) {
      return Response.json(
        { error: "Falta el businessId." },
        { status: 400 }
      );
    }

    const exists = await businessExists(businessId);

    if (!exists) {
      return Response.json(
        { error: "El negocio no existe." },
        { status: 404 }
      );
    }

    const result = await env.toca_analytics
      .prepare(`
        SELECT
          date,
          source,
          visits,
          google_clicks,
          last_activity
        FROM analytics_daily
        WHERE business_id = ?
        ORDER BY date ASC, source ASC
      `)
      .bind(businessId)
      .all();

    const rows = result.results;

    let totalVisits = 0;
    let totalGoogleClicks = 0;

    const bySource = {
      nfc: {
        visits: 0,
        googleClicks: 0,
      },
      qr: {
        visits: 0,
        googleClicks: 0,
      },
      direct: {
        visits: 0,
        googleClicks: 0,
      },
    };

    let lastActivity: string | null = null;

    for (const row of rows) {
      const source = row.source as "nfc" | "qr" | "direct";
      const visits = Number(row.visits);
      const googleClicks = Number(row.google_clicks);

      totalVisits += visits;
      totalGoogleClicks += googleClicks;

      bySource[source].visits += visits;
      bySource[source].googleClicks += googleClicks;

      const activity = String(row.last_activity);

      if (!lastActivity || activity > lastActivity) {
        lastActivity = activity;
      }
    }

    const interactionRate =
      totalVisits > 0
        ? (totalGoogleClicks / totalVisits) * 100
        : 0;

    return Response.json({
      businessId,
      totals: {
        visits: totalVisits,
        googleClicks: totalGoogleClicks,
        interactionRate: Number(interactionRate.toFixed(2)),
      },
      bySource,
      lastActivity,
      daily: rows,
    });
  } catch {
    return Response.json(
      { error: "No se pudieron obtener las estadísticas." },
      { status: 500 }
    );
  }
}