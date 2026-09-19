import { notFound } from "next/navigation";
import { getBusinessBySlug } from "@/lib/businesses";

type PageProps = {
  params: Promise<{
    slug: string;
  }>;
};

export default async function BusinessPage({ params }: PageProps) {
  const { slug } = await params;

  const business = getBusinessBySlug(slug);

  if (!business) {
    notFound();
  }

  return (
    <main>
      <h1>TOCA</h1>

      <h2>{business.name}</h2>

      <a href={business.googleReviewUrl}>
        ⭐ Dejar una reseña en Google
      </a>
    </main>
  );
}