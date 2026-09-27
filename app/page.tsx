import Image from "next/image";

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

export default function Home() {
  return (
    <main className="home">
      <NfcWaves className="home-nfc-waves home-nfc-waves-left" />
      <NfcWaves className="home-nfc-waves home-nfc-waves-right" />

      <Image
        src="/logo/toca.svg"
        alt="TOCA"
        width={220}
        height={80}
        priority
        className="home-logo"
      />

      <h1>Todo tu negocio. En un toque.</h1>
    </main>
  );
}