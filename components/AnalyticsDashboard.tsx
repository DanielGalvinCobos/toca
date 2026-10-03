"use client";

import Image from "next/image";
import { useEffect, useMemo, useState } from "react";

type AnalyticsRow = {
  date: string;
  source: "nfc" | "qr" | "direct";
  visits: number;
  google_clicks: number;
  last_activity: string;
};

type AnalyticsData = {
  businessId: string;
  businessCreatedAt: string;
  totals: {
    visits: number;
    googleClicks: number;
    interactionRate: number;
  };
  bySource: {
    nfc: {
      visits: number;
      googleClicks: number;
    };
    qr: {
      visits: number;
      googleClicks: number;
    };
    direct: {
      visits: number;
      googleClicks: number;
    };
  };
  lastActivity: string | null;
  daily: AnalyticsRow[];
};

type AnalyticsDashboardProps = {
  businessId: string;
  businessName: string;
  businessSlug: string;
};

type PeriodType =
  | "today"
  | "yesterday"
  | "last7"
  | "last14"
  | "last30"
  | "thisWeek"
  | "previousWeek"
  | "thisMonth"
  | "previousMonth"
  | "custom"
  | "all";

type Period = {
  type: PeriodType;
  label: string;
  from: string;
  to: string;
};

function formatDate(date: string) {
  const [year, month, day] = date.split("-");

  return `${day}/${month}/${year}`;
}

function formatDateTime(date: string | null) {
  if (!date) {
    return "Sin actividad";
  }

  const value = new Date(date);

  return value.toLocaleString("es-ES", {
    dateStyle: "short",
    timeStyle: "short",
  });
}

function getMadridToday() {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/Madrid",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

function addDays(dateString: string, amount: number) {
  const [year, month, day] = dateString.split("-").map(Number);

  const date = new Date(
    Date.UTC(year, month - 1, day)
  );

  date.setUTCDate(date.getUTCDate() + amount);

  return date.toISOString().slice(0, 10);
}

function getMonday(dateString: string) {
  const [year, month, day] = dateString.split("-").map(Number);

  const date = new Date(
    Date.UTC(year, month - 1, day)
  );

  const dayOfWeek = date.getUTCDay();
  const daysSinceMonday =
    dayOfWeek === 0 ? 6 : dayOfWeek - 1;

  date.setUTCDate(
    date.getUTCDate() - daysSinceMonday
  );

  return date.toISOString().slice(0, 10);
}

function getMonthStart(dateString: string) {
  return `${dateString.slice(0, 7)}-01`;
}

function getPreviousMonthStart(dateString: string) {
  const [year, month] = dateString
    .slice(0, 7)
    .split("-")
    .map(Number);

  const date = new Date(
    Date.UTC(year, month - 2, 1)
  );

  return date.toISOString().slice(0, 10);
}

function getPreviousMonthEnd(dateString: string) {
  return addDays(getMonthStart(dateString), -1);
}

function getPeriod(
  type: PeriodType,
  customFrom: string,
  customTo: string,
  businessCreatedAt: string
): Period {
  const today = getMadridToday();

  if (type === "today") {
    return {
      type,
      label: "Hoy",
      from: today,
      to: today,
    };
  }

  if (type === "yesterday") {
    const yesterday = addDays(today, -1);

    return {
      type,
      label: "Ayer",
      from: yesterday,
      to: yesterday,
    };
  }

  if (type === "last7") {
    return {
      type,
      label: "Últimos 7 días",
      from: addDays(today, -6),
      to: today,
    };
  }

  if (type === "last14") {
    return {
      type,
      label: "Últimos 14 días",
      from: addDays(today, -13),
      to: today,
    };
  }

  if (type === "last30") {
    return {
      type,
      label: "Últimos 30 días",
      from: addDays(today, -29),
      to: today,
    };
  }

  if (type === "thisWeek") {
    const from = getMonday(today);

    return {
      type,
      label: "Esta semana",
      from,
      to: addDays(from, 6),
    };
  }

  if (type === "previousWeek") {
    const currentMonday = getMonday(today);
    const from = addDays(currentMonday, -7);

    return {
      type,
      label: "Semana anterior",
      from,
      to: addDays(from, 6),
    };
  }

  if (type === "thisMonth") {
    return {
      type,
      label: "Este mes",
      from: getMonthStart(today),
      to: today,
    };
  }

  if (type === "previousMonth") {
    const from = getPreviousMonthStart(today);

    return {
      type,
      label: "Mes anterior",
      from,
      to: getPreviousMonthEnd(today),
    };
  }

  if (type === "custom") {
    return {
      type,
      label: "Periodo personalizado",
      from: customFrom || today,
      to: customTo || today,
    };
  }

  return {
    type: "all",
    label: "Histórico",
    from: businessCreatedAt,
    to: today,
  };
}

function getSourceLabel(source: "nfc" | "qr" | "direct") {
  if (source === "nfc") {
    return "NFC";
  }

  if (source === "qr") {
    return "QR";
  }

  return "Directo";
}

function NfcSourceIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      width="20"
      height="20"
      fill="none"
      aria-hidden="true"
    >
      <rect
        x="8"
        y="5"
        width="8"
        height="14"
        rx="2"
        stroke="currentColor"
        strokeWidth="1.7"
      />

      <path
        d="M5.5 8.2a5.8 5.8 0 0 0 0 7.6"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
      />

      <path
        d="M18.5 8.2a5.8 5.8 0 0 1 0 7.6"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
      />

      <path
        d="M3.2 6.2a9 9 0 0 0 0 11.6"
        stroke="currentColor"
        strokeWidth="1.45"
        strokeLinecap="round"
        opacity="0.5"
      />

      <path
        d="M20.8 6.2a9 9 0 0 1 0 11.6"
        stroke="currentColor"
        strokeWidth="1.45"
        strokeLinecap="round"
        opacity="0.5"
      />

      <circle
        cx="12"
        cy="12"
        r="1.25"
        fill="currentColor"
      />
    </svg>
  );
}

function QrSourceIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      width="20"
      height="20"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M4 4h6v6H4z"
        stroke="currentColor"
        strokeWidth="1.7"
      />

      <path
        d="M14 4h6v6h-6z"
        stroke="currentColor"
        strokeWidth="1.7"
      />

      <path
        d="M4 14h6v6H4z"
        stroke="currentColor"
        strokeWidth="1.7"
      />

      <path
        d="M6.2 6.2h1.6v1.6H6.2z"
        fill="currentColor"
      />

      <path
        d="M16.2 6.2h1.6v1.6h-1.6z"
        fill="currentColor"
      />

      <path
        d="M6.2 16.2h1.6v1.6H6.2z"
        fill="currentColor"
      />

      <path
        d="M14 14h3v3h-3zM18 14h2v2h-2zM17 18h3v2h-3zM14 18h2v2h-2z"
        fill="currentColor"
      />
    </svg>
  );
}

function DirectSourceIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      width="20"
      height="20"
      fill="none"
      aria-hidden="true"
    >
      <rect
        x="4.5"
        y="4.5"
        width="15"
        height="15"
        rx="2.5"
        stroke="currentColor"
        strokeWidth="1.6"
      />

      <path
        d="M8 15.5 15.5 8"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />

      <path
        d="M11.5 8h4v4"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function VisitsIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      width="19"
      height="19"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M4 17.5 9 12l3.5 3L20 7"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      <path
        d="M15.5 7H20v4.5"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function GoogleIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      width="19"
      height="19"
      aria-hidden="true"
    >
      <path
        d="M21.35 12.27c0-.7-.06-1.37-.18-2H12v3.79h5.24a4.48 4.48 0 0 1-1.94 2.94v2.45h3.14c1.84-1.7 2.91-4.2 2.91-7.18Z"
        fill="currentColor"
      />

      <path
        d="M12 21.65c2.63 0 4.84-.87 6.45-2.35l-3.14-2.45c-.87.58-1.98.92-3.31.92-2.54 0-4.69-1.72-5.46-4.03H3.29v2.53A9.75 9.75 0 0 0 12 21.65Z"
        fill="currentColor"
        opacity="0.78"
      />

      <path
        d="M6.54 13.74A5.86 5.86 0 0 1 6.23 12c0-.61.11-1.2.31-1.74V7.73H3.29A9.75 9.75 0 0 0 2.25 12c0 1.57.38 3.05 1.04 4.27l3.25-2.53Z"
        fill="currentColor"
        opacity="0.58"
      />

      <path
        d="M12 6.23c1.43 0 2.72.49 3.73 1.46l2.8-2.8C16.84 3.32 14.63 2.35 12 2.35a9.75 9.75 0 0 0-8.71 5.38l3.25 2.53C7.31 7.95 9.46 6.23 12 6.23Z"
        fill="currentColor"
        opacity="0.9"
      />
    </svg>
  );
}

function InteractionIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      width="19"
      height="19"
      fill="none"
      aria-hidden="true"
    >
      <circle
        cx="8"
        cy="8"
        r="3"
        stroke="currentColor"
        strokeWidth="1.7"
      />

      <path
        d="M3.5 19a4.5 4.5 0 0 1 9 0"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
      />

      <path
        d="m15 13 2 2 4-5"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function ActivityIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      width="19"
      height="19"
      fill="none"
      aria-hidden="true"
    >
      <circle
        cx="12"
        cy="12"
        r="8.5"
        stroke="currentColor"
        strokeWidth="1.7"
      />

      <path
        d="M12 7v5l3.2 2"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}

export default function AnalyticsDashboard({
  businessId,
  businessName,
  businessSlug,
}: AnalyticsDashboardProps) {
  const [authenticated, setAuthenticated] = useState<boolean | null>(
    null
  );
  const [password, setPassword] = useState("");
  const [loginError, setLoginError] = useState("");
  const [loggingIn, setLoggingIn] = useState(false);

  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);

  const [periodType, setPeriodType] =
    useState<PeriodType>("thisMonth");

  const [customFrom, setCustomFrom] = useState("");
  const [customTo, setCustomTo] = useState("");

  useEffect(() => {
    async function checkAuthentication() {
      try {
        const response = await fetch("/api/analytics/auth", {
          cache: "no-store",
        });

        if (!response.ok) {
          setAuthenticated(false);
          return;
        }

        const result = (await response.json()) as {
          authenticated: boolean;
        };

        setAuthenticated(result.authenticated);
      } catch {
        setAuthenticated(false);
      }
    }

    checkAuthentication();
  }, []);

  useEffect(() => {
    if (!authenticated) {
      return;
    }

    async function loadAnalytics() {
      setLoading(true);
      setError(false);

      try {
        const response = await fetch(
          `/api/analytics?businessId=${encodeURIComponent(
            businessId
          )}`,
          {
            cache: "no-store",
          }
        );

        if (!response.ok) {
          throw new Error(
            "No se pudieron cargar las estadísticas."
          );
        }

        const result = (await response.json()) as AnalyticsData;

        setData(result);
      } catch {
        setError(true);
      } finally {
        setLoading(false);
      }
    }

    loadAnalytics();
  }, [authenticated, businessId]);

  async function handleLogin(
    event: React.FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    if (!password.trim()) {
      setLoginError("Introduce la contraseña.");
      return;
    }

    setLoggingIn(true);
    setLoginError("");

    try {
      const response = await fetch("/api/analytics/auth", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          password,
        }),
      });

      if (!response.ok) {
        const result = (await response.json()) as {
          error?: string;
        };

        setLoginError(
          result.error || "Contraseña incorrecta."
        );

        return;
      }

      setPassword("");
      setAuthenticated(true);
    } catch {
      setLoginError(
        "No se pudo iniciar sesión. Inténtalo de nuevo."
      );
    } finally {
      setLoggingIn(false);
    }
  }

  const selectedPeriod = useMemo(
    () =>
      getPeriod(
        periodType,
        customFrom,
        customTo,
        data?.businessCreatedAt || getMadridToday()
      ),
    [
      periodType,
      customFrom,
      customTo,
      data?.businessCreatedAt,
    ]
  );

  const customPeriodError =
    periodType === "custom" &&
    customFrom &&
    customTo &&
    customFrom > customTo;

  const periodRows = useMemo(() => {
    if (!data || customPeriodError) {
      return [];
    }

    return data.daily.filter(
      (row) =>
        row.date >= selectedPeriod.from &&
        row.date <= selectedPeriod.to
    );
  }, [
    data,
    selectedPeriod,
    customPeriodError,
  ]);

  const periodData = useMemo(() => {
    if (!data) {
      return null;
    }

    let visits = 0;
    let googleClicks = 0;

    const bySource = {
      nfc: {
        visits: 0,
        googleClicks: 0,
      },
      qr: {
        visits: 0,
        googleClicks: 0,
      },
      direct: {
        visits: 0,
        googleClicks: 0,
      },
    };

    let lastActivity: string | null = null;

    for (const row of periodRows) {
      const rowVisits = Number(row.visits);
      const rowGoogleClicks = Number(
        row.google_clicks
      );

      visits += rowVisits;
      googleClicks += rowGoogleClicks;

      bySource[row.source].visits += rowVisits;
      bySource[row.source].googleClicks +=
        rowGoogleClicks;

      if (
        !lastActivity ||
        row.last_activity > lastActivity
      ) {
        lastActivity = row.last_activity;
      }
    }

    const interactionRate =
      visits > 0
        ? (googleClicks / visits) * 100
        : 0;

    return {
      totals: {
        visits,
        googleClicks,
        interactionRate: Number(
          interactionRate.toFixed(2)
        ),
      },
      bySource,
      lastActivity,
    };
  }, [periodRows, data]);

  const chartData = useMemo(() => {
    const grouped = new Map<
      string,
      {
        date: string;
        visits: number;
        googleClicks: number;
      }
    >();

    for (const row of periodRows) {
      const current = grouped.get(row.date);

      if (current) {
        current.visits += row.visits;
        current.googleClicks += row.google_clicks;
      } else {
        grouped.set(row.date, {
          date: row.date,
          visits: row.visits,
          googleClicks: row.google_clicks,
        });
      }
    }

    return Array.from(grouped.values());
  }, [periodRows]);

  const maxVisits = Math.max(
    ...chartData.map((item) => item.visits),
    1
  );

  if (authenticated === null) {
    return (
      <main className="analytics-page">
        <div className="analytics-container">
          <div className="analytics-loading">
            <div className="analytics-loading-spinner" />
            <p>Comprobando acceso...</p>
          </div>
        </div>
      </main>
    );
  }

  if (!authenticated) {
    return (
      <main className="analytics-page analytics-login-page">
        <div className="analytics-login-background" />

        <div className="analytics-login-container">
          <div className="analytics-login-logo">
            <Image
              src="/logo/toca.svg"
              alt="TOCA"
              width={118}
              height={45}
              priority
            />
          </div>

          <section className="analytics-login-card">
            <div
              className="analytics-login-icon"
              aria-hidden="true"
            >
              <svg
                viewBox="0 0 24 24"
                width="22"
                height="22"
                fill="none"
              >
                <rect
                  x="5"
                  y="10"
                  width="14"
                  height="10"
                  rx="2"
                  stroke="currentColor"
                  strokeWidth="1.8"
                />

                <path
                  d="M8 10V7.5a4 4 0 0 1 8 0V10"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                />

                <circle
                  cx="12"
                  cy="15"
                  r="1.2"
                  fill="currentColor"
                />
              </svg>
            </div>

            <span className="analytics-login-label">
              Acceso privado
            </span>

            <h1>Estadísticas</h1>

            <p className="analytics-login-business">
              {businessName}
            </p>

            <p className="analytics-login-description">
              Accede al panel de estadísticas de tu negocio.
            </p>

            <form
              className="analytics-login-form"
              onSubmit={handleLogin}
            >
              <label htmlFor="analytics-password">
                Contraseña
              </label>

              <input
                id="analytics-password"
                type="password"
                value={password}
                onChange={(event) =>
                  setPassword(event.target.value)
                }
                autoComplete="current-password"
                placeholder="Introduce tu contraseña"
                disabled={loggingIn}
                required
              />

              {loginError && (
                <div
                  className="analytics-login-error"
                  aria-live="polite"
                >
                  <span aria-hidden="true">!</span>
                  <span>{loginError}</span>
                </div>
              )}

              <button
                type="submit"
                className="analytics-login-button"
                disabled={loggingIn}
              >
                <span>
                  {loggingIn
                    ? "Accediendo..."
                    : "Acceder a estadísticas"}
                </span>

                {!loggingIn && (
                  <span aria-hidden="true">→</span>
                )}
              </button>
            </form>

            <div className="analytics-login-footer">
              <span className="analytics-login-footer-dot" />
              Acceso exclusivo de TOCA
            </div>
          </section>
        </div>
      </main>
    );
  }

  if (loading) {
    return (
      <main className="analytics-page">
        <div className="analytics-container">
          <div className="analytics-loading">
            <div className="analytics-loading-spinner" />
            <p>Cargando estadísticas...</p>
          </div>
        </div>
      </main>
    );
  }

  if (error || !data) {
    return (
      <main className="analytics-page">
        <div className="analytics-container">
          <header className="analytics-header">
            <div className="analytics-brand">
              <Image
                src="/logo/toca.svg"
                alt="TOCA"
                width={120}
                height={46}
                priority
              />
            </div>

            <div className="analytics-header-content">
              <div>
                <span className="analytics-eyebrow">
                  Estadísticas
                </span>

                <h1>{businessName}</h1>

                <p>
                  Evolución de los accesos e interacciones de este
                  local.
                </p>
              </div>

              <div className="analytics-actions">
                <button
                  className="analytics-print-button"
                  type="button"
                  onClick={() => window.print()}
                >
                  <span
                    className="analytics-print-icon"
                    aria-hidden="true"
                  >
                    ↓
                  </span>

                  <span>Guardar PDF</span>
                </button>

                <a
                  className="analytics-back"
                  href={`/${businessSlug}`}
                >
                  Ver página
                  <span aria-hidden="true">→</span>
                </a>
              </div>
            </div>
          </header>

          <div className="analytics-error">
            <h2>
              No se han podido cargar las estadísticas
            </h2>

            <p>
              Comprueba que el servicio de estadísticas está
              disponible e inténtalo de nuevo.
            </p>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="analytics-page">
      <div className="analytics-container">
        <header className="analytics-header">
          <div className="analytics-brand">
            <Image
              src="/logo/toca.svg"
              alt="TOCA"
              width={95}
              height={36}
              priority
            />

            <div>
              <span className="analytics-eyebrow">
                Estadísticas
              </span>

              <h1>{businessName}</h1>

              <p>
                Evolución de los accesos e interacciones de este
                local.
              </p>
            </div>
          </div>

          <div className="analytics-actions">
            <button
              className="analytics-print-button"
              type="button"
              onClick={() => window.print()}
            >
              <span
                className="analytics-print-icon"
                aria-hidden="true"
              >
                ↓
              </span>

              <span>Guardar PDF</span>
            </button>

            <a
              className="analytics-back"
              href={`/${businessSlug}`}
            >
              Ver página
              <span aria-hidden="true">→</span>
            </a>
          </div>
        </header>

        <section
          className="analytics-section"
          style={{
            marginBottom: "28px",
          }}
        >
          <div
            className="analytics-section-heading"
            style={{
              alignItems: "flex-start",
              gap: "20px",
            }}
          >
            <div>
              <span className="analytics-section-label">
                Periodo
              </span>

              <h2>{selectedPeriod.label}</h2>

              <p
                style={{
                  margin: "6px 0 0",
                  color: "#6b7280",
                  fontSize: "0.9rem",
                }}
              >
                {formatDate(selectedPeriod.from)} —{" "}
                {formatDate(selectedPeriod.to)}
              </p>
            </div>

            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "flex-end",
                gap: "10px",
              }}
            >
              <select
                className="analytics-period"
                value={periodType}
                onChange={(event) =>
                  setPeriodType(
                    event.target.value as PeriodType
                  )
                }
                aria-label="Periodo de estadísticas"
                style={{
                  border: "1px solid #e5e7eb",
                  background: "#ffffff",
                  color: "#374151",
                  borderRadius: "10px",
                  padding: "9px 34px 9px 12px",
                  fontSize: "0.9rem",
                  fontWeight: 600,
                  cursor: "pointer",
                  outline: "none",
                }}
              >
                <option value="today">Hoy</option>
                <option value="yesterday">Ayer</option>
                <option value="last7">
                  Últimos 7 días
                </option>
                <option value="last14">
                  Últimos 14 días
                </option>
                <option value="last30">
                  Últimos 30 días
                </option>
                <option value="thisWeek">
                  Esta semana
                </option>
                <option value="previousWeek">
                  Semana anterior
                </option>
                <option value="thisMonth">
                  Este mes
                </option>
                <option value="previousMonth">
                  Mes anterior
                </option>
                <option value="custom">
                  Periodo personalizado
                </option>
                <option value="all">
                  Histórico
                </option>
              </select>

              {periodType === "custom" && (
                <div
                  style={{
                    display: "flex",
                    gap: "8px",
                    flexWrap: "wrap",
                    justifyContent: "flex-end",
                  }}
                >
                  <label
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "6px",
                      fontSize: "0.82rem",
                      color: "#6b7280",
                    }}
                  >
                    Desde
                    <input
                      type="date"
                      value={customFrom}
                      onChange={(event) =>
                        setCustomFrom(event.target.value)
                      }
                      style={{
                        border: "1px solid #e5e7eb",
                        borderRadius: "8px",
                        padding: "7px 9px",
                        background: "#ffffff",
                        color: "#374151",
                      }}
                    />
                  </label>

                  <label
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "6px",
                      fontSize: "0.82rem",
                      color: "#6b7280",
                    }}
                  >
                    Hasta
                    <input
                      type="date"
                      value={customTo}
                      onChange={(event) =>
                        setCustomTo(event.target.value)
                      }
                      style={{
                        border: "1px solid #e5e7eb",
                        borderRadius: "8px",
                        padding: "7px 9px",
                        background: "#ffffff",
                        color: "#374151",
                      }}
                    />
                  </label>
                </div>
              )}
            </div>
          </div>

          {customPeriodError && (
            <div
              className="analytics-error"
              style={{
                marginTop: "16px",
                padding: "14px 16px",
              }}
            >
              <p>
                La fecha inicial no puede ser posterior a la
                fecha final.
              </p>
            </div>
          )}
        </section>

        <section className="analytics-stats-grid">
          <article className="analytics-stat-card">
            <div className="analytics-stat-icon">
              <VisitsIcon />
            </div>

            <span>Visitas</span>

            <strong>
              {periodData?.totals.visits ?? 0}
            </strong>

            <small>Accesos registrados</small>
          </article>

          <article className="analytics-stat-card">
            <div className="analytics-stat-icon">
              <GoogleIcon />
            </div>

            <span>Google</span>

            <strong>
              {periodData?.totals.googleClicks ?? 0}
            </strong>

            <small>Clics en dejar reseña</small>
          </article>

          <article className="analytics-stat-card">
            <div className="analytics-stat-icon">
              <InteractionIcon />
            </div>

            <span>Interacción</span>

            <strong>
              {periodData?.totals.interactionRate ?? 0}%
            </strong>

            <small>Clics de Google sobre visitas</small>
          </article>

          <article className="analytics-stat-card">
            <div className="analytics-stat-icon">
              <ActivityIcon />
            </div>

            <span>Última actividad</span>

            <strong className="analytics-stat-date">
              {formatDateTime(
                periodData?.lastActivity ?? null
              )}
            </strong>

            <small>Último evento del periodo</small>
          </article>
        </section>

        <section className="analytics-section analytics-print-avoid">
          <div className="analytics-section-heading">
            <div>
              <span className="analytics-section-label">
                Origen de los accesos
              </span>

              <h2>¿Cómo llegan los clientes?</h2>
            </div>

            <span className="analytics-period">
              {selectedPeriod.label}
            </span>
          </div>

          <div className="analytics-source-grid">
            <article className="analytics-source-card">
              <div className="analytics-source-top">
                <span className="analytics-source-icon">
                  <NfcSourceIcon />
                </span>

                <span>NFC</span>
              </div>

              <strong>
                {periodData?.bySource.nfc.visits ?? 0}
              </strong>

              <small>visitas</small>

              <div className="analytics-source-detail">
                {periodData?.bySource.nfc.googleClicks ?? 0}{" "}
                clics en Google
              </div>
            </article>

            <article className="analytics-source-card">
              <div className="analytics-source-top">
                <span className="analytics-source-icon">
                  <QrSourceIcon />
                </span>

                <span>QR</span>
              </div>

              <strong>
                {periodData?.bySource.qr.visits ?? 0}
              </strong>

              <small>visitas</small>

              <div className="analytics-source-detail">
                {periodData?.bySource.qr.googleClicks ?? 0}{" "}
                clics en Google
              </div>
            </article>

            <article className="analytics-source-card">
              <div className="analytics-source-top">
                <span className="analytics-source-icon">
                  <DirectSourceIcon />
                </span>

                <span>Directo</span>
              </div>

              <strong>
                {periodData?.bySource.direct.visits ?? 0}
              </strong>

              <small>visitas</small>

              <div className="analytics-source-detail">
                {periodData?.bySource.direct.googleClicks ?? 0}{" "}
                clics en Google
              </div>
            </article>
          </div>
        </section>

        <section className="analytics-section analytics-print-avoid">
          <div className="analytics-section-heading">
            <div>
              <span className="analytics-section-label">
                Evolución
              </span>

              <h2>Accesos por día</h2>
            </div>

            <span className="analytics-period">
              {selectedPeriod.label}
            </span>
          </div>

          {customPeriodError ? (
            <div className="analytics-empty">
              Corrige el periodo seleccionado para mostrar los datos.
            </div>
          ) : chartData.length === 0 ? (
            <div className="analytics-empty">
              No hay actividad registrada en este periodo.
            </div>
          ) : (
            <div className="analytics-chart">
              <div className="analytics-chart-bars">
                {chartData.map((item) => {
                  const height = Math.max(
                    (item.visits / maxVisits) * 100,
                    5
                  );

                  return (
                    <div
                      className="analytics-chart-column"
                      key={item.date}
                    >
                      <div className="analytics-chart-value">
                        {item.visits}
                      </div>

                      <div className="analytics-chart-track">
                        <div
                          className="analytics-chart-bar"
                          style={{
                            height: `${height}%`,
                          }}
                        />
                      </div>

                      <span>{formatDate(item.date)}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </section>

        <section className="analytics-section analytics-print-avoid">
          <div className="analytics-section-heading">
            <div>
              <span className="analytics-section-label">
                Detalle
              </span>

              <h2>Actividad registrada</h2>
            </div>

            <span className="analytics-period">
              {periodRows.length}{" "}
              {periodRows.length === 1
                ? "registro"
                : "registros"}
            </span>
          </div>

          <div className="analytics-table-wrapper">
            <table className="analytics-table">
              <thead>
                <tr>
                  <th>Fecha</th>
                  <th>Origen</th>
                  <th>Visitas</th>
                  <th>Google</th>
                  <th>Última actividad</th>
                </tr>
              </thead>

              <tbody>
                {periodRows.length === 0 ? (
                  <tr>
                    <td
                      colSpan={5}
                      style={{
                        textAlign: "center",
                        padding: "28px",
                        color: "#6b7280",
                      }}
                    >
                      No hay actividad registrada en este periodo.
                    </td>
                  </tr>
                ) : (
                  periodRows
                    .slice()
                    .reverse()
                    .map((row) => (
                      <tr
                        key={`${row.date}-${row.source}`}
                      >
                        <td>{formatDate(row.date)}</td>

                        <td>
                          <span className="analytics-table-source">
                            {getSourceLabel(row.source)}
                          </span>
                        </td>

                        <td>{row.visits}</td>

                        <td>{row.google_clicks}</td>

                        <td>
                          {formatDateTime(
                            row.last_activity
                          )}
                        </td>
                      </tr>
                    ))
                )}
              </tbody>
            </table>
          </div>
        </section>

        <footer className="analytics-footer">
          <Image
            className="analytics-footer-logo"
            src="/logo/toca.svg"
            alt="TOCA"
            width={70}
            height={27}
          />

          <p>Todo tu negocio. En un toque.</p>
        </footer>
      </div>
    </main>
  );
}