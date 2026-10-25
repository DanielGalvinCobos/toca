
import { env } from "cloudflare:workers";

export type Business = {
  id: string;
  name: string;
  slug: string;
  googleReviewUrl: string;
  logoUrl?: string;
  createdAt: string;
  active: boolean;
  archivedAt?: string;
};

function mapBusiness(row: Record<string, unknown>): Business {
  return {
    id: String(row.id),
    name: String(row.name),
    slug: String(row.slug),
    googleReviewUrl: String(row.google_review_url),
    logoUrl: row.logo_url ? String(row.logo_url) : undefined,
    createdAt: String(row.created_at),
    active: Number(row.active) === 1,
    archivedAt: row.archived_at
      ? String(row.archived_at)
      : undefined,
  };
}

function getMadridToday() {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/Madrid",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

const BUSINESS_SELECT = `
  SELECT
    id,
    name,
    slug,
    google_review_url,
    logo_url,
    created_at,
    active,
    archived_at
  FROM businesses
`;

export async function getBusinessBySlug(
  slug: string
): Promise<Business | undefined> {
  const result = await env.toca_analytics
    .prepare(`
      ${BUSINESS_SELECT}
      WHERE slug = ?
        AND active = 1
        AND archived_at IS NULL
      LIMIT 1
    `)
    .bind(slug)
    .first();

  if (!result) {
    return undefined;
  }

  return mapBusiness(result as Record<string, unknown>);
}

export async function getBusinessBySlugIncludingInactive(
  slug: string
): Promise<Business | undefined> {
  const result = await env.toca_analytics
    .prepare(`
      ${BUSINESS_SELECT}
      WHERE slug = ?
      LIMIT 1
    `)
    .bind(slug)
    .first();

  if (!result) {
    return undefined;
  }

  return mapBusiness(result as Record<string, unknown>);
}

export async function getBusinessById(
  id: string
): Promise<Business | undefined> {
  const result = await env.toca_analytics
    .prepare(`
      ${BUSINESS_SELECT}
      WHERE id = ?
      LIMIT 1
    `)
    .bind(id)
    .first();

  if (!result) {
    return undefined;
  }

  return mapBusiness(result as Record<string, unknown>);
}

export async function getAllBusinesses(): Promise<Business[]> {
  const result = await env.toca_analytics
    .prepare(`
      ${BUSINESS_SELECT}
      WHERE active = 1
        AND archived_at IS NULL
      ORDER BY name ASC
    `)
    .all();

  return result.results.map((row) =>
    mapBusiness(row as Record<string, unknown>)
  );
}

/**
 * Devuelve todos los negocios para el panel privado,
 * incluidos los desactivados y los archivados.
 */
export async function getAllBusinessesForManagement(): Promise<Business[]> {
  const result = await env.toca_analytics
    .prepare(`
      ${BUSINESS_SELECT}
      ORDER BY
        CASE WHEN archived_at IS NOT NULL THEN 1 ELSE 0 END ASC,
        active DESC,
        name ASC
    `)
    .all();

  return result.results.map((row) =>
    mapBusiness(row as Record<string, unknown>)
  );
}

export async function createBusiness(data: {
  name: string;
  slug: string;
  googleReviewUrl: string;
  logoUrl?: string;
}): Promise<Business> {
  const id = crypto.randomUUID();
  const createdAt = getMadridToday();

  await env.toca_analytics
    .prepare(`
      INSERT INTO businesses (
        id,
        name,
        slug,
        google_review_url,
        logo_url,
        created_at,
        active
      )
      VALUES (?, ?, ?, ?, ?, ?, 1)
    `)
    .bind(
      id,
      data.name,
      data.slug,
      data.googleReviewUrl,
      data.logoUrl || null,
      createdAt
    )
    .run();

  return {
    id,
    name: data.name,
    slug: data.slug,
    googleReviewUrl: data.googleReviewUrl,
    logoUrl: data.logoUrl || undefined,
    createdAt,
    active: true,
    archivedAt: undefined,
  };
}

export async function updateBusiness(data: {
  id: string;
  name: string;
  slug: string;
  googleReviewUrl: string;
  logoUrl?: string;
}): Promise<Business | undefined> {
  const result = await env.toca_analytics
    .prepare(`
      UPDATE businesses
      SET
        name = ?,
        slug = ?,
        google_review_url = ?,
        logo_url = ?
      WHERE id = ?
        AND active = 1
        AND archived_at IS NULL
      RETURNING
        id,
        name,
        slug,
        google_review_url,
        logo_url,
        created_at,
        active,
        archived_at
    `)
    .bind(
      data.name,
      data.slug,
      data.googleReviewUrl,
      data.logoUrl || null,
      data.id
    )
    .first();

  if (!result) {
    return undefined;
  }

  return mapBusiness(result as Record<string, unknown>);
}

/**
 * Desactiva un negocio sin archivarlo.
 * Sus datos e historial estadístico se conservan.
 */
export async function deactivateBusiness(
  id: string
): Promise<boolean> {
  const result = await env.toca_analytics
    .prepare(`
      UPDATE businesses
      SET active = 0
      WHERE id = ?
        AND active = 1
        AND archived_at IS NULL
    `)
    .bind(id)
    .run();

  return result.meta.changes > 0;
}

/**
 * Activa un negocio únicamente si no está archivado.
 */
export async function activateBusiness(
  id: string
): Promise<boolean> {
  const result = await env.toca_analytics
    .prepare(`
      UPDATE businesses
      SET active = 1
      WHERE id = ?
        AND active = 0
        AND archived_at IS NULL
    `)
    .bind(id)
    .run();

  return result.meta.changes > 0;
}

/**
 * Archiva un negocio y lo desactiva.
 * No elimina el negocio ni sus estadísticas.
 */
export async function archiveBusiness(
  id: string
): Promise<boolean> {
  const archivedAt = new Date().toISOString();

  const result = await env.toca_analytics
    .prepare(`
      UPDATE businesses
      SET
        active = 0,
        archived_at = ?
      WHERE id = ?
        AND archived_at IS NULL
    `)
    .bind(archivedAt, id)
    .run();

  return result.meta.changes > 0;
}

/**
 * Restaura un negocio archivado como inactivo.
 * Para publicarlo de nuevo será necesario activarlo expresamente.
 */
export async function restoreBusiness(
  id: string
): Promise<boolean> {
  const result = await env.toca_analytics
    .prepare(`
      UPDATE businesses
      SET
        archived_at = NULL,
        active = 0
      WHERE id = ?
        AND archived_at IS NOT NULL
    `)
    .bind(id)
    .run();

  return result.meta.changes > 0;
}
