import Image from "next/image";
import { notFound } from "next/navigation";
import { getBusinessBySlug } from "@/lib/businesses";

type PageProps = {
  params: Promise<{
    slug: string;
  }>;
};

function NfcWaves({ className }: { className: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 400 400"
      aria-hidden="true"
    >
      <path
        d="M 0 100 A 300 300 0 0 1 300 400"
        fill="none"
        stroke="currentColor"
        strokeWidth="11"
        strokeLinecap="round"
      />

      <path
        d="M 0 175 A 225 225 0 0 1 225 400"
        fill="none"
        stroke="currentColor"
        strokeWidth="11"
        strokeLinecap="round"
      />

      <path
        d="M 0 250 A 150 150 0 0 1 150 400"
        fill="none"
        stroke="currentColor"
        strokeWidth="11"
        strokeLinecap="round"
      />
    </svg>
  );
}

export default async function BusinessPage({ params }: PageProps) {
  const { slug } = await params;

  const business = getBusinessBySlug(slug);

  if (!business) {
    notFound();
  }

  return (
    <main className="toca-page">
      <NfcWaves className="nfc-decoration nfc-decoration-left" />
      <NfcWaves className="nfc-decoration nfc-decoration-right" />

      <header className="toca-header">
        <Image
          src="/logo/toca.svg"
          alt="TOCA"
          width={105}
          height={40}
          priority
        />
      </header>

      <section className="toca-main">
        {business.logoUrl && (
          <Image
            className="business-logo"
            src={business.logoUrl}
            alt={`Logo de ${business.name}`}
            width={92}
            height={92}
          />
        )}

        <h1 className="business-name">
          {business.name}
        </h1>

        <p className="business-description">
          Tu opinión nos ayuda a seguir mejorando.
        </p>

        <a
          className="review-button"
          href={business.googleReviewUrl}
          target="_blank"
          rel="noopener noreferrer"
        >
          <span className="google-icon">
            <svg
              viewBox="0 0 48 48"
              width="16"
              height="16"
              aria-hidden="true"
            >
              <path
                fill="#4285F4"
                d="M45.12 24.5c0-1.56-.14-3.06-.4-4.5H24v8.51h11.84c-.51 2.75-2.06 5.08-4.39 6.64v5.52h7.11c4.16-3.83 6.56-9.47 6.56-16.17z"
              />
              <path
                fill="#34A853"
                d="M24 46c5.94 0 10.92-1.97 14.56-5.33l-7.11-5.52c-1.97 1.32-4.49 2.1-7.45 2.1-5.73 0-10.58-3.87-12.31-9.07H4.34v5.7C7.96 41.07 15.4 46 24 46z"
              />
              <path
                fill="#FBBC05"
                d="M11.69 28.18C11.25 26.86 11 25.45 11 24s.25-2.86.69-4.18v-5.7H4.34C2.85 17.09 2 20.45 2 24s.85 6.91 2.34 9.88l7.35-5.7z"
              />
              <path
                fill="#EA4335"
                d="M24 10.75c3.23 0 6.13 1.11 8.41 3.29l6.31-6.31C34.91 4.18 29.93 2 24 2 15.4 2 7.96 6.93 4.34 14.12l7.35 5.7c1.73-5.2 6.58-9.07 12.31-9.07z"
              />
            </svg>
          </span>

          <span>Dejar reseña en Google</span>

          <span className="review-arrow">→</span>
        </a>
      </section>

      <footer className="toca-footer">
        <Image
          className="toca-footer-logo"
          src="/logo/toca.svg"
          alt="TOCA"
          width={75}
          height={29}
        />

        <p className="toca-footer-slogan">
          Todo tu negocio. En un toque.
        </p>
      </footer>
    </main>
  );
}