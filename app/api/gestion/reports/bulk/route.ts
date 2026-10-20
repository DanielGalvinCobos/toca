import { env } from "cloudflare:workers";
import { zipSync } from "fflate";

import { isAuthenticated } from "@/lib/analyticsAuth";
import { getAllBusinesses } from "@/lib/businesses";
import {
  generateReportPdf,
  type ReportData,
  type ReportDailyRow,
  type ReportSource,
} from "@/lib/reports/pdf";

const VALID_SOURCES = ["nfc", "qr", "direct"] as const;

type ValidSource = (typeof VALID_SOURCES)[number];

type BusinessResult = {
  id: string;
  name: string;
  included: boolean;
  error: string | null;
};

function isValidDate(value: string | null): boolean {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return false;
  }

  const date = new Date(`${value}T00:00:00Z`);

  return (
    !Number.isNaN(date.getTime()) &&
    date.toISOString().slice(0, 10) === value
  );
}

function formatDateForFilename(value: string): string {
  const [year, month, day] = value.split("-");
  return `${day}-${month}-${year}`;
}

function sanitizeFilename(value: string): string {
  return value
    .replace(/[^a-zA-Z0-9áéíóúÁÉÍÓÚñÑüÜ -]/g, "")
    .trim()
    .replace(/\s+/g, "-");
}

function createEmptySourceStats() {
  return {
    nfc: { visits: 0, googleClicks: 0 },
    qr: { visits: 0, googleClicks: 0 },
    direct: { visits: 0, googleClicks: 0 },
  } satisfies Record<
    ValidSource,
    { visits: number; googleClicks: number }
  >;
}

async function buildReportData(
  businessId: string,
  businessName: string,
  from: string,
  to: string,
): Promise<ReportData> {
  const result = await env.toca_analytics
    .prepare(
      `
        SELECT
          date,
          source,
          visits,
          google_clicks,
          last_activity
        FROM analytics_daily
        WHERE business_id = ?
          AND date >= ?
          AND date <= ?
        ORDER BY date ASC, source ASC
      `,
    )
    .bind(businessId, from, to)
    .all<{
      date: string;
      source: string;
      visits: number;
      google_clicks: number;
      last_activity: string | null;
    }>();

  const rows = result.results ?? [];

  let totalVisits = 0;
  let totalGoogleClicks = 0;
  let lastActivity: string | null = null;

  const sourceStats = createEmptySourceStats();
  const daily: ReportDailyRow[] = [];

  for (const row of rows) {
    const visits = Number(row.visits) || 0;
    const googleClicks = Number(row.google_clicks) || 0;

    totalVisits += visits;
    totalGoogleClicks += googleClicks;

    if (
      row.last_activity &&
      (!lastActivity || row.last_activity > lastActivity)
    ) {
      lastActivity = row.last_activity;
    }

    if (VALID_SOURCES.includes(row.source as ValidSource)) {
      const source = row.source as ValidSource;

      sourceStats[source].visits += visits;
      sourceStats[source].googleClicks += googleClicks;

      daily.push({
        date: row.date,
        visits,
        googleClicks,
        source,
        lastActivity: row.last_activity,
      });
    }
  }

  const bySource: ReportSource[] = VALID_SOURCES.map((source) => ({
    source,
    visits: sourceStats[source].visits,
    googleClicks: sourceStats[source].googleClicks,
  }));

  return {
    businessName,
    periodFrom: from,
    periodTo: to,
    totalVisits,
    totalGoogleClicks,
    lastActivity,
    bySource,
    daily,
  };
}

async function saveHistory(
  reportId: string,
  from: string,
  to: string,
  businesses: BusinessResult[],
  details: {
    status: "completed" | "failed";
    storageKey?: string | null;
    filename?: string | null;
    fileSize?: number | null;
    errorMessage?: string | null;
  },
): Promise<void> {
  const includedCount = businesses.filter(
    (business) => business.included,
  ).length;

  const statements = [
    env.toca_analytics
      .prepare(
        `
          INSERT INTO report_history (
            id,
            report_type,
            period_from,
            period_to,
            status,
            storage_key,
            file_name,
            content_type,
            file_size,
            business_count,
            error_message
          )
          VALUES (?, 'collective', ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `,
      )
      .bind(
        reportId,
        from,
        to,
        details.status,
        details.storageKey ?? null,
        details.filename ?? null,
        details.filename ? "application/zip" : null,
        details.fileSize ?? null,
        includedCount,
        details.errorMessage ?? null,
      ),
    ...businesses.map((business) =>
      env.toca_analytics
        .prepare(
          `
            INSERT INTO report_history_businesses (
              report_id,
              business_id,
              business_name,
              included,
              exclusion_reason
            )
            VALUES (?, ?, ?, ?, ?)
          `,
        )
        .bind(
          reportId,
          business.id,
          business.name,
          business.included ? 1 : 0,
          business.error,
        ),
    ),
  ];

  await env.toca_analytics.batch(statements);
}

export async function GET(request: Request) {
  let from: string | null = null;
  let to: string | null = null;

  try {
    if (!(await isAuthenticated(request))) {
      return new Response("No autorizado", { status: 401 });
    }

    const url = new URL(request.url);

    from = url.searchParams.get("from");
    to = url.searchParams.get("to");

    if (!from || !to) {
      return Response.json(
        { error: "Debes indicar from y to." },
        { status: 400 },
      );
    }

    if (!isValidDate(from) || !isValidDate(to)) {
      return Response.json(
        { error: "Las fechas deben tener el formato YYYY-MM-DD." },
        { status: 400 },
      );
    }

    if (from > to) {
      return Response.json(
        {
          error: "La fecha inicial no puede ser posterior a la fecha final.",
        },
        { status: 400 },
      );
    }

    const businesses = await getAllBusinesses();

    if (businesses.length === 0) {
      return Response.json(
        { error: "No hay negocios activos para generar informes." },
        { status: 400 },
      );
    }

    const reportId = crypto.randomUUID();
    const businessResults: BusinessResult[] = [];
    const files: Record<string, Uint8Array> = {};

    for (const business of businesses) {
      try {
        const reportData = await buildReportData(
          business.id,
          business.name,
          from,
          to,
        );

        const pdfBytes = await generateReportPdf(reportData);

        const filename =
          `TOCA_${sanitizeFilename(business.name)}` +
          `_${formatDateForFilename(from)}` +
          `_${formatDateForFilename(to)}.pdf`;

        files[filename] = pdfBytes;

        businessResults.push({
          id: business.id,
          name: business.name,
          included: true,
          error: null,
        });
      } catch (error) {
        console.error(
          `Error generando informe de ${business.name}:`,
          error,
        );

        businessResults.push({
          id: business.id,
          name: business.name,
          included: false,
          error:
            error instanceof Error
              ? error.message
              : "Error desconocido",
        });
      }
    }

    const successfulBusinesses = businessResults.filter(
      (business) => business.included,
    );

    const failedBusinesses = businessResults.filter(
      (business) => !business.included,
    );

    if (successfulBusinesses.length === 0) {
      try {
        await saveHistory(reportId, from, to, businessResults, {
          status: "failed",
          errorMessage: "No se ha podido generar ningún informe.",
        });
      } catch (historyError) {
        console.error(
          "No se pudo guardar el historial del informe fallido:",
          historyError,
        );
      }

      return Response.json(
        {
          error: "No se ha podido generar ningún informe.",
          failedBusinesses: failedBusinesses.map((business) => ({
            name: business.name,
            error: business.error,
          })),
        },
        { status: 500 },
      );
    }

    const summaryLines = [
      "INFORMES TOCA",
      "==============================",
      "",
      `Periodo: ${formatDateForFilename(from)} - ${formatDateForFilename(to)}`,
      `Generado: ${new Date().toISOString()}`,
      "",
      `Negocios activos: ${businesses.length}`,
      `Informes generados: ${successfulBusinesses.length}`,
      `Informes con error: ${failedBusinesses.length}`,
      "",
      "INFORMES GENERADOS",
      "------------------------------",
      ...successfulBusinesses.map((business) => `✓ ${business.name}`),
      "",
      "INFORMES CON ERROR",
      "------------------------------",
      ...(failedBusinesses.length > 0
        ? failedBusinesses.map(
            (business) => `✗ ${business.name}: ${business.error}`,
          )
        : ["Ninguno"]),
      "",
      "TOCA — Todo tu negocio. En un toque.",
    ];

    files["TOCA_Resumen.txt"] = new TextEncoder().encode(
      summaryLines.join("\n"),
    );

    const zipBytes = zipSync(files, { level: 6 });

    const filename =
      `TOCA_Informes_${formatDateForFilename(from)}` +
      `_${formatDateForFilename(to)}.zip`;

    const storageKey = `reports/${reportId}/${filename}`;

    try {
      await env.REPORT_HISTORY.put(storageKey, zipBytes, {
        httpMetadata: {
          contentType: "application/zip",
        },
      });

      await saveHistory(reportId, from, to, businessResults, {
        status: "completed",
        storageKey,
        filename,
        fileSize: zipBytes.byteLength,
        errorMessage:
          failedBusinesses.length > 0
            ? `${failedBusinesses.length} negocio(s) no pudieron generar su PDF.`
            : null,
      });
    } catch (storageError) {
      console.error(
        "Error guardando el informe en el historial:",
        storageError,
      );

      try {
        await env.REPORT_HISTORY.delete(storageKey);
      } catch (cleanupError) {
        console.error(
          "No se pudo eliminar el archivo sin registrar:",
          cleanupError,
        );
      }

      try {
        await saveHistory(reportId, from, to, businessResults, {
          status: "failed",
          errorMessage:
            "No se pudo almacenar el archivo o registrar el historial.",
        });
      } catch (historyError) {
        console.error(
          "No se pudo guardar el registro del error:",
          historyError,
        );
      }

      return Response.json(
        {
          error:
            "Se generaron los informes, pero no se pudieron guardar en el historial. Inténtalo de nuevo.",
        },
        { status: 500 },
      );
    }

    return new Response(zipBytes, {
      status: 200,
      headers: {
        "Content-Type": "application/zip",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Cache-Control": "no-store",
        "X-TOCA-Reports-Generated": String(
          successfulBusinesses.length,
        ),
        "X-TOCA-Reports-Failed": String(
          failedBusinesses.length,
        ),
      },
    });
  } catch (error) {
    console.error("Error generando informes masivos:", error);

    return Response.json(
      { error: "No se han podido generar los informes masivos." },
      { status: 500 },
    );
  }
}