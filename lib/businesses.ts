import { businesses } from "@/data/businesses";

export function getBusinessBySlug(slug: string) {
  return businesses.find(
    (business) => business.slug === slug
  );
}