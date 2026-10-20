
import { env } from "cloudflare:workers";
import { isAuthenticated } from "@/lib/analyticsAuth";

export async function GET(request: Request) {
  if (!(await isAuthenticated(request))) {
    return Response.json(
      { error: "No autorizado." },
      { status: 401 }
    );
  }

  try {
    const url = new URL(request.url);
    const requestedLimit = Number(url.searchParams.get("limit") ?? 50);
    const limit = Number.isInteger(requestedLimit)
      ? Math.min(Math.max(requestedLimit, 1), 100)
      : 50;

    const result = await env.toca_analytics
      .prepare(`
        SELECT
          id,
          report_type,
          period_from,
          period_to,
          status,
          file_name,
          content_type,
          file_size,
          business_count,
          created_at,
          error_message
        FROM report_history
        ORDER BY created_at DESC, id DESC
        LIMIT ?
      `)
      .bind(limit)
      .all();

    const reports = result.results.map((row) => ({
      id: String(row.id),
      reportType: String(row.report_type),
      periodFrom: String(row.period_from),
      periodTo: String(row.period_to),
      status: String(row.status),
      fileName: row.file_name ? String(row.file_name) : null,
      contentType: row.content_type
        ? String(row.content_type)
        : null,
      fileSize:
        row.file_size == null ? null : Number(row.file_size),
      businessCount: Number(row.business_count) || 0,
      createdAt: String(row.created_at),
      errorMessage: row.error_message
        ? String(row.error_message)
        : null,
    }));

    return Response.json(
      { reports },
      {
        headers: {
          "Cache-Control": "private, no-store",
        },
      }
    );
    } catch (error) {
    console.error("[TOCA report history] Error:", error);

    return Response.json(
      { error: "No se pudo cargar el historial de informes." },
      { status: 500 }
    );
  }
}
