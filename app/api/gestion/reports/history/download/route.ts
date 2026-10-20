
import { env } from "cloudflare:workers";
import { isAuthenticated } from "@/lib/analyticsAuth";

export async function GET(request: Request) {
  if (!(await isAuthenticated(request))) {
    return Response.json(
      { error: "No autorizado." },
      { status: 401 }
    );
  }

  const url = new URL(request.url);
  const id = url.searchParams.get("id")?.trim();

  if (!id || id.length > 128) {
    return Response.json(
      { error: "El identificador del informe no es válido." },
      { status: 400 }
    );
  }

  try {
    const report = await env.toca_analytics
      .prepare(`
        SELECT
          id,
          status,
          storage_key,
          file_name,
          content_type
        FROM report_history
        WHERE id = ?
        LIMIT 1
      `)
      .bind(id)
      .first<{
        id: string;
        status: string;
        storage_key: string | null;
        file_name: string | null;
        content_type: string | null;
      }>();

    if (!report) {
      return Response.json(
        { error: "No se ha encontrado el informe." },
        { status: 404 }
      );
    }

    if (
      report.status !== "completed" ||
      !report.storage_key ||
      !report.file_name
    ) {
      return Response.json(
        { error: "Este informe no tiene un archivo descargable." },
        { status: 409 }
      );
    }

    const object = await env.REPORT_HISTORY.get(report.storage_key);

    if (!object) {
      return Response.json(
        { error: "El archivo del informe ya no está disponible." },
        { status: 404 }
      );
    }

    const filename = report.file_name.replace(/[\r\n"]/g, "_");
    const contentType = report.content_type || "application/zip";

    return new Response(object.body, {
      headers: {
        "Content-Type": contentType,
        "Content-Length": String(object.size),
        "Content-Disposition":
          `attachment; filename="${filename}"; ` +
          `filename*=UTF-8''${encodeURIComponent(report.file_name)}`,
        "Cache-Control": "private, no-store",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch {
    return Response.json(
      { error: "No se pudo descargar el informe." },
      { status: 500 }
    );
  }
}
