import { notFound } from "next/navigation";

import AnalyticsDashboard from "@/components/AnalyticsDashboard";
import { getBusinessBySlug } from "@/lib/businesses";

type PageProps = {
  params: Promise<{
    slug: string;
  }>;
};

export default async function AnalyticsPage({ params }: PageProps) {
  const { slug } = await params;

  const business = await getBusinessBySlug(slug);

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