
import { env } from "cloudflare:workers";
import { isAuthenticated } from "@/lib/analyticsAuth";

type SubscriptionStatus =
  | "undecided"
  | "active"
  | "inactive"
  | "cancelled";

type ClientBody = {
  id?: string;
  contactName?: string;
  businessName?: string;
  phone?: string | null;
  email?: string | null;
  wantsEmailAlerts?: boolean;
  wantsStatistics?: boolean;
  subscriptionStatus?: SubscriptionStatus;
  notes?: string | null;
};

const headers = {
  "Cache-Control": "private, no-store",
};

function json(data: unknown, status = 200) {
  return Response.json(data, { status, headers });
}

function cleanText(value: unknown, maxLength: number): string | null {
  if (typeof value !== "string") return null;

  const result = value.trim();
  if (!result) return null;

  return result.length <= maxLength ? result : null;
}

function optionalText(
  value: unknown,
  maxLength: number,
  fieldName: string
): { value: string | null; error?: string } {
  if (value === undefined || value === null) {
    return { value: null };
  }

  if (typeof value !== "string") {
    return { value: null, error: `${fieldName} no es válido.` };
  }

  const result = value.trim();

  if (result.length > maxLength) {
    return {
      value: null,
      error: `${fieldName} supera la longitud permitida.`,
    };
  }

  return { value: result || null };
}

function validateClient(body: ClientBody) {
  const contactName = cleanText(body.contactName, 150);
  const businessName = cleanText(body.businessName, 150);

  if (!contactName) {
    return { error: "El nombre del contacto es obligatorio y no puede superar 150 caracteres." };
  }

  if (!businessName) {
    return { error: "El nombre del negocio es obligatorio y no puede superar 150 caracteres." };
  }

  const phone = optionalText(body.phone, 40, "El teléfono");
  const email = optionalText(body.email, 254, "El email");
  const notes = optionalText(body.notes, 5000, "Las notas");

  if (phone.error) return { error: phone.error };
  if (email.error) return { error: email.error };
  if (notes.error) return { error: notes.error };

  if (
    email.value &&
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.value)
  ) {
    return { error: "La dirección de email no es válida." };
  }

  if (
    body.wantsEmailAlerts !== undefined &&
    typeof body.wantsEmailAlerts !== "boolean"
  ) {
    return { error: "La preferencia de avisos por email no es válida." };
  }

  if (
    body.wantsStatistics !== undefined &&
    typeof body.wantsStatistics !== "boolean"
  ) {
    return { error: "La preferencia de estadísticas no es válida." };
  }

  const allowedStatuses: SubscriptionStatus[] = [
    "undecided",
    "active",
    "inactive",
    "cancelled",
  ];

  const subscriptionStatus =
    body.subscriptionStatus ?? "undecided";

  if (!allowedStatuses.includes(subscriptionStatus)) {
    return { error: "El estado de suscripción no es válido." };
  }

  return {
    data: {
      contactName,
      businessName,
      phone: phone.value,
      email: email.value,
      notes: notes.value,
      wantsEmailAlerts: body.wantsEmailAlerts ?? false,
      wantsStatistics: body.wantsStatistics ?? false,
      subscriptionStatus,
    },
  };
}

async function authorized(request: Request) {
  return await isAuthenticated(request);
}

/**
 * GET /api/gestion/clientes
 * Admite ?q=texto y ?archived=true.
 */
export async function GET(request: Request) {
  if (!(await authorized(request))) {
    return json({ error: "No autorizado." }, 401);
  }

  try {
    const url = new URL(request.url);
    const query = (url.searchParams.get("q") ?? "").trim().slice(0, 150);
    const archiveFilter = url.searchParams.get("archive") ?? "active";
    let sql = `
      SELECT
        id,
        contact_name AS contactName,
        business_name AS businessName,
        phone,
        email,
        created_at AS createdAt,
        wants_email_alerts AS wantsEmailAlerts,
        wants_statistics AS wantsStatistics,
        subscription_status AS subscriptionStatus,
        notes,
        archived_at AS archivedAt,
        updated_at AS updatedAt
      FROM crm_clients
      WHERE 1 = 1
    `;

    const values: string[] = [];

    if (archiveFilter === "active") {
      sql += " AND archived_at IS NULL";
    } else if (archiveFilter === "archived") {
      sql += " AND archived_at IS NOT NULL";
    } else if (archiveFilter !== "all") {
      return json({ error: "El filtro de archivo no es válido." }, 400);
    }

    if (query) {
      sql += `
        AND (
          contact_name LIKE ? COLLATE NOCASE
          OR business_name LIKE ? COLLATE NOCASE
          OR email LIKE ? COLLATE NOCASE
          OR phone LIKE ?
        )
      `;
      const pattern = `%${query}%`;
      values.push(pattern, pattern, pattern, pattern);
    }

    sql += " ORDER BY created_at DESC, business_name COLLATE NOCASE ASC";

    const result = await env.toca_analytics
      .prepare(sql)
      .bind(...values)
      .all();

    const clients = result.results.map((row) => ({
      ...row,
      wantsEmailAlerts: Number(row.wantsEmailAlerts) === 1,
      wantsStatistics: Number(row.wantsStatistics) === 1,
    }));

    return json({ clients });
  } catch (error) {
    console.error("[GET /api/gestion/clientes]", error);
    return json({ error: "No se pudieron obtener los clientes." }, 500);
  }
}

/**
 * POST /api/gestion/clientes
 * Crea un cliente.
 */
export async function POST(request: Request) {
  if (!(await authorized(request))) {
    return json({ error: "No autorizado." }, 401);
  }

  try {
    const body = (await request.json()) as ClientBody;
    const validation = validateClient(body);

    if ("error" in validation) {
      return json({ error: validation.error }, 400);
    }

    const client = validation.data;
    const id = crypto.randomUUID();

    await env.toca_analytics
      .prepare(`
        INSERT INTO crm_clients (
          id,
          contact_name,
          business_name,
          phone,
          email,
          wants_email_alerts,
          wants_statistics,
          subscription_status,
          notes
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `)
      .bind(
        id,
        client.contactName,
        client.businessName,
        client.phone,
        client.email,
        client.wantsEmailAlerts ? 1 : 0,
        client.wantsStatistics ? 1 : 0,
        client.subscriptionStatus,
        client.notes
      )
      .run();

    return json({ success: true, id }, 201);
  } catch (error) {
    console.error("[POST /api/gestion/clientes]", error);
    return json({ error: "No se pudo crear el cliente." }, 500);
  }
}

/**
 * PUT /api/gestion/clientes
 * Actualiza los datos de un cliente no archivado.
 */
export async function PUT(request: Request) {
  if (!(await authorized(request))) {
    return json({ error: "No autorizado." }, 401);
  }

  try {
    const body = (await request.json()) as ClientBody;
    const id = typeof body.id === "string" ? body.id.trim() : "";

    if (!id || id.length > 100) {
      return json({ error: "El ID del cliente no es válido." }, 400);
    }

    const validation = validateClient(body);

    if ("error" in validation) {
      return json({ error: validation.error }, 400);
    }

    const client = validation.data;

    const result = await env.toca_analytics
      .prepare(`
        UPDATE crm_clients
        SET
          contact_name = ?,
          business_name = ?,
          phone = ?,
          email = ?,
          wants_email_alerts = ?,
          wants_statistics = ?,
          subscription_status = ?,
          notes = ?,
          updated_at = datetime('now')
        WHERE id = ? AND archived_at IS NULL
      `)
      .bind(
        client.contactName,
        client.businessName,
        client.phone,
        client.email,
        client.wantsEmailAlerts ? 1 : 0,
        client.wantsStatistics ? 1 : 0,
        client.subscriptionStatus,
        client.notes,
        id
      )
      .run();

    if (!result.meta.changes) {
      return json(
        { error: "El cliente no existe o está archivado." },
        404
      );
    }

    return json({ success: true, id });
  } catch (error) {
    console.error("[PUT /api/gestion/clientes]", error);
    return json({ error: "No se pudo actualizar el cliente." }, 500);
  }
}

/**
 * PATCH /api/gestion/clientes
 * Archiva o restaura un cliente. No lo elimina definitivamente.
 */
export async function PATCH(request: Request) {
  if (!(await authorized(request))) {
    return json({ error: "No autorizado." }, 401);
  }

  try {
    const body = (await request.json()) as {
      id?: string;
      action?: string;
    };

    const id = typeof body.id === "string" ? body.id.trim() : "";

    if (!id || id.length > 100) {
      return json({ error: "El ID del cliente no es válido." }, 400);
    }

    if (body.action !== "archive" && body.action !== "restore") {
      return json({ error: "La acción no es válida." }, 400);
    }

    const result =
      body.action === "archive"
        ? await env.toca_analytics
          .prepare(`
              UPDATE crm_clients
              SET archived_at = datetime('now'),
                  updated_at = datetime('now')
              WHERE id = ? AND archived_at IS NULL
            `)
          .bind(id)
          .run()
        : await env.toca_analytics
          .prepare(`
              UPDATE crm_clients
              SET archived_at = NULL,
                  updated_at = datetime('now')
              WHERE id = ? AND archived_at IS NOT NULL
            `)
          .bind(id)
          .run();

    if (!result.meta.changes) {
      return json(
        { error: "El cliente no existe o ya se encuentra en ese estado." },
        404
      );
    }

    return json({ success: true, id, action: body.action });
  } catch (error) {
    console.error("[PATCH /api/gestion/clientes]", error);
    return json({ error: "No se pudo cambiar el estado del cliente." }, 500);
  }
}
