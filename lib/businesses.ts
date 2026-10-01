import { env } from "cloudflare:workers";

export type Business = {
  id: string;
  name: string;
  slug: string;
  googleReviewUrl: string;
  logoUrl?: string;
};

function mapBusiness(row: Record<string, unknown>): Business {
  return {
    id: String(row.id),
    name: String(row.name),
    slug: String(row.slug),
    googleReviewUrl: String(row.google_review_url),
    logoUrl: row.logo_url
      ? String(row.logo_url)
      : undefined,
  };
}

export async function getBusinessBySlug(
  slug: string
): Promise<Business | undefined> {
  const result = await env.toca_analytics
    .prepare(`
      SELECT
        id,
        name,
        slug,
        google_review_url,
        logo_url
      FROM businesses
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
      SELECT
        id,
        name,
        slug,
        google_review_url,
        logo_url
      FROM businesses
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
      SELECT
        id,
        name,
        slug,
        google_review_url,
        logo_url
      FROM businesses
      ORDER BY name ASC
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

  await env.toca_analytics
    .prepare(`
      INSERT INTO businesses (
        id,
        name,
        slug,
        google_review_url,
        logo_url
      )
      VALUES (?, ?, ?, ?, ?)
    `)
    .bind(
      id,
      data.name,
      data.slug,
      data.googleReviewUrl,
      data.logoUrl || null
    )
    .run();

  return {
    id,
    name: data.name,
    slug: data.slug,
    googleReviewUrl: data.googleReviewUrl,
    logoUrl: data.logoUrl || undefined,
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
      RETURNING
        id,
        name,
        slug,
        google_review_url,
        logo_url
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