
import { env } from "cloudflare:workers";
import { isAuthenticated } from "@/lib/analyticsAuth";

type PurchaseBody = {
  id?: string;
  clientId?: string;
  purchaseDate?: string;
  product?: string;
  version?: string | null;
  units?: number;
  unitPrice?: number;
  notes?: string | null;
};

const headers = {
  "Cache-Control": "private, no-store",
};

function json(data: unknown, status = 200) {
  return Response.json(data, { status, headers });
}

function textField(
  value: unknown,
  maxLength: number,
  fieldName: string,
  required = false
): { value: string | null; error?: string } {
  if (typeof value !== "string") {
    if (!required && (value === undefined || value === null)) {
      return { value: null };
    }

    return { value: null, error: `${fieldName} no es válido.` };
  }

  const result = value.trim();

  if (required && !result) {
    return { value: null, error: `${fieldName} es obligatorio.` };
  }

  if (result.length > maxLength) {
    return { value: null, error: `${fieldName} supera la longitud permitida.` };
  }

  return { value: result || null };
}

function validatePurchase(body: PurchaseBody) {
  const clientId = textField(body.clientId, 100, "El cliente", true);
  const purchaseDate = textField(body.purchaseDate, 10, "La fecha", true);
  const product = textField(body.product, 150, "El producto", true);
  const version = textField(body.version, 100, "La versión");
  const notes = textField(body.notes, 2000, "Las notas");

  if (clientId.error) return { error: clientId.error };
  if (purchaseDate.error) return { error: purchaseDate.error };
  if (product.error) return { error: product.error };
  if (version.error) return { error: version.error };
  if (notes.error) return { error: notes.error };

  if (!/^\d{4}-\d{2}-\d{2}$/.test(purchaseDate.value ?? "")) {
    return { error: "La fecha debe tener el formato AAAA-MM-DD." };
  }

  const parsedDate = new Date(`${purchaseDate.value}T00:00:00.000Z`);

  if (
    Number.isNaN(parsedDate.getTime()) ||
    parsedDate.toISOString().slice(0, 10) !== purchaseDate.value
  ) {
    return { error: "La fecha de compra no es válida." };
  }

  if (
    typeof body.units !== "number" ||
    !Number.isSafeInteger(body.units) ||
    body.units < 1 ||
    body.units > 100000
  ) {
    return { error: "Las unidades deben ser un número entero mayor que cero." };
  }

  if (
    typeof body.unitPrice !== "number" ||
    !Number.isFinite(body.unitPrice) ||
    body.unitPrice < 0 ||
    body.unitPrice > 100000000
  ) {
    return { error: "El precio por unidad no es válido." };
  }

  const unitPriceCents = Math.round(body.unitPrice * 100);

  if (!Number.isSafeInteger(unitPriceCents)) {
    return { error: "El precio por unidad es demasiado alto." };
  }

  return {
    data: {
      clientId: clientId.value as string,
      purchaseDate: purchaseDate.value as string,
      product: product.value as string,
      version: version.value,
      units: body.units,
      unitPriceCents,
      notes: notes.value,
    },
  };
}

async function authorized(request: Request) {
  return await isAuthenticated(request);
}

/**
 * GET /api/gestion/compras?clientId=...
 * Devuelve las compras de un cliente y su total acumulado.
 */
export async function GET(request: Request) {
  if (!(await authorized(request))) {
    return json({ error: "No autorizado." }, 401);
  }

  try {
    const url = new URL(request.url);
    const clientId = (url.searchParams.get("clientId") ?? "").trim();

    if (!clientId || clientId.length > 100) {
      return json({ error: "El ID del cliente no es válido." }, 400);
    }

    const database = env.toca_analytics;

    const client = await database
      .prepare("SELECT id FROM crm_clients WHERE id = ?")
      .bind(clientId)
      .first();

    if (!client) {
      return json({ error: "El cliente no existe." }, 404);
    }

    const result = await database
      .prepare(`
        SELECT
          id,
          client_id AS clientId,
          purchase_date AS purchaseDate,
          product,
          version,
          units,
          unit_price_cents AS unitPriceCents,
          notes,
          created_at AS createdAt
        FROM crm_purchases
        WHERE client_id = ?
        ORDER BY purchase_date DESC, created_at DESC
      `)
      .bind(clientId)
      .all();

    const purchases = result.results.map((row) => ({
      ...row,
      units: Number(row.units),
      unitPriceCents: Number(row.unitPriceCents),
      subtotalCents: Number(row.units) * Number(row.unitPriceCents),
    }));

    const totalCents = purchases.reduce(
      (total, purchase) => total + purchase.subtotalCents,
      0
    );

    return json({ purchases, totalCents });
  } catch (error) {
    console.error("[GET /api/gestion/compras]", error);
    return json({ error: "No se pudieron obtener las compras." }, 500);
  }
}

/**
 * POST /api/gestion/compras
 * Registra una compra.
 */
export async function POST(request: Request) {
  if (!(await authorized(request))) {
    return json({ error: "No autorizado." }, 401);
  }

  try {
    const body = (await request.json()) as PurchaseBody;
    const validation = validatePurchase(body);

    if ("error" in validation) {
      return json({ error: validation.error }, 400);
    }

    const purchase = validation.data;
    const database = env.toca_analytics;

    const client = await database
      .prepare(`
        SELECT id
        FROM crm_clients
        WHERE id = ? AND archived_at IS NULL
      `)
      .bind(purchase.clientId)
      .first();

    if (!client) {
      return json({
        error: "El cliente no existe o está archivado.",
      }, 404);
    }

    const id = crypto.randomUUID();

    await database
      .prepare(`
        INSERT INTO crm_purchases (
          id,
          client_id,
          purchase_date,
          product,
          version,
          units,
          unit_price_cents,
          notes
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `)
      .bind(
        id,
        purchase.clientId,
        purchase.purchaseDate,
        purchase.product,
        purchase.version,
        purchase.units,
        purchase.unitPriceCents,
        purchase.notes
      )
      .run();

    return json({ success: true, id }, 201);
  } catch (error) {
    console.error("[POST /api/gestion/compras]", error);
    return json({ error: "No se pudo registrar la compra." }, 500);
  }
}

/**
 * PUT /api/gestion/compras
 * Actualiza una compra existente.
 */
export async function PUT(request: Request) {
  if (!(await authorized(request))) {
    return json({ error: "No autorizado." }, 401);
  }

  try {
    const body = (await request.json()) as PurchaseBody;
    const id = typeof body.id === "string" ? body.id.trim() : "";

    if (!id || id.length > 100) {
      return json({ error: "El ID de la compra no es válido." }, 400);
    }

    const validation = validatePurchase(body);

    if ("error" in validation) {
      return json({ error: validation.error }, 400);
    }

    const purchase = validation.data;
    const database = env.toca_analytics;

    const client = await database
      .prepare(`
        SELECT id
        FROM crm_clients
        WHERE id = ? AND archived_at IS NULL
      `)
      .bind(purchase.clientId)
      .first();

    if (!client) {
      return json({
        error: "El cliente no existe o está archivado.",
      }, 404);
    }

    const result = await database
      .prepare(`
        UPDATE crm_purchases
        SET
          client_id = ?,
          purchase_date = ?,
          product = ?,
          version = ?,
          units = ?,
          unit_price_cents = ?,
          notes = ?
        WHERE id = ? AND client_id = ?
      `)
      .bind(
        purchase.clientId,
        purchase.purchaseDate,
        purchase.product,
        purchase.version,
        purchase.units,
        purchase.unitPriceCents,
        purchase.notes,
        id,
        purchase.clientId
      )
      .run();

    if (!result.meta.changes) {
      return json({ error: "La compra no existe para este cliente." }, 404);
    }

    return json({ success: true, id });
  } catch (error) {
    console.error("[PUT /api/gestion/compras]", error);
    return json({ error: "No se pudo actualizar la compra." }, 500);
  }
}

/**
 * DELETE /api/gestion/compras?id=...&clientId=...
 * Elimina una compra concreta de un cliente.
 */
export async function DELETE(request: Request) {
  if (!(await authorized(request))) {
    return json({ error: "No autorizado." }, 401);
  }

  try {
    const url = new URL(request.url);
    const id = (url.searchParams.get("id") ?? "").trim();
    const clientId = (url.searchParams.get("clientId") ?? "").trim();

    if (
      !id ||
      id.length > 100 ||
      !clientId ||
      clientId.length > 100
    ) {
      return json({ error: "Los datos de la compra no son válidos." }, 400);
    }

    const result = await env.toca_analytics
      .prepare(`
        DELETE FROM crm_purchases
        WHERE id = ? AND client_id = ?
      `)
      .bind(id, clientId)
      .run();

    if (!result.meta.changes) {
      return json({ error: "La compra no existe para este cliente." }, 404);
    }

    return json({ success: true, id });
  } catch (error) {
    console.error("[DELETE /api/gestion/compras]", error);
    return json({ error: "No se pudo eliminar la compra." }, 500);
  }
}
