
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import styles from "./GestionNav.module.css";

const sections = [
  { href: "/gestion", label: "Resumen", icon: "dashboard", exact: true },
  { href: "/gestion/negocios", label: "Negocios", icon: "store" },
  { href: "/gestion/estadisticas", label: "Estadísticas", icon: "chart" },
  { href: "/gestion/informes", label: "Informes", icon: "file" },
  { href: "/gestion/clientes", label: "Clientes", icon: "users" },
  { href: "/gestion/archivo", label: "Archivo", icon: "history" },
];

function NavIcon({ name }: { name: string }) {
  const common = {
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.8,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
  };

  switch (name) {
    case "dashboard":
      return (
        <svg viewBox="0 0 24 24" {...common}>
          <rect x="3.5" y="3.5" width="7" height="7" rx="1.5" />
          <rect x="13.5" y="3.5" width="7" height="4" rx="1.5" />
          <rect x="13.5" y="10.5" width="7" height="10" rx="1.5" />
          <rect x="3.5" y="13.5" width="7" height="7" rx="1.5" />
        </svg>
      );

    case "store":
      return (
        <svg viewBox="0 0 24 24" {...common}>
          <path d="M4 10v10h16V10" />
          <path d="M3 10l2-6h14l2 6" />
          <path d="M3 10a3 3 0 0 0 6 0 3 3 0 0 0 6 0 3 3 0 0 0 6 0" />
          <path d="M9 20v-6h6v6" />
        </svg>
      );

    case "chart":
      return (
        <svg viewBox="0 0 24 24" {...common}>
          <path d="M3.5 20.5h17" />
          <path d="M5.5 16v-4" />
          <path d="M10 16V7" />
          <path d="M14.5 16v-6" />
          <path d="M19 16V3.5" />
        </svg>
      );

    case "file":
      return (
        <svg viewBox="0 0 24 24" {...common}>
          <path d="M13 3.5H6a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V10Z" />
          <path d="M13 3.5V10h7" />
          <path d="M8 14h8M8 17.5h8" />
        </svg>
      );

    case "users":
      return (
        <svg viewBox="0 0 24 24" {...common}>
          <circle cx="9" cy="8" r="3.5" />
          <path d="M2.5 20v-1.5a6.5 6.5 0 0 1 13 0V20" />
          <path d="M16 4.8a3.5 3.5 0 0 1 0 6.4" />
          <path d="M18 14a5 5 0 0 1 3.5 4.5V20" />
        </svg>
      );

    case "history":
      return (
        <svg viewBox="0 0 24 24" {...common}>
          <path d="M3.5 11a8.5 8.5 0 1 1 2.2 5.7" />
          <path d="M3.5 4.5v6.5H10" />
          <path d="M12 7v5l3.5 2" />
        </svg>
      );

    default:
      return null;
  }
}

export default function GestionNav() {
  const pathname = usePathname();

  return (
    <nav className={styles.nav} aria-label="Secciones de gestión">
      {sections.map((section) => {
        const active = section.exact
          ? pathname === section.href
          : pathname === section.href ||
          pathname.startsWith(`${section.href}/`);

        return (
          <Link
            key={section.href}
            href={section.href}
            className={`${styles.link} ${active ? styles.active : ""
              }`}
            aria-current={active ? "page" : undefined}
          >
            <span className={styles.icon} aria-hidden="true">
              <NavIcon name={section.icon} />
            </span>

            <span className={styles.linkLabel}>{section.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
