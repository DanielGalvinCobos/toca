import { notFound } from "next/navigation";

import AnalyticsDashboard from "@/components/AnalyticsDashboard";
import { getBusinessBySlugIncludingInactive } from "@/lib/businesses";

type PageProps = {
  params: Promise<{
    slug: string;
  }>;
};

export default async function AnalyticsPage({ params }: PageProps) {
  const { slug } = await params;

  const business = await getBusinessBySlugIncludingInactive(slug);

  if (!business) {
    notFound();
  }

  return (
    <AnalyticsDashboard
      businessId={business.id}
      businessName={business.name}
      businessSlug={business.slug}
    />
  );
}