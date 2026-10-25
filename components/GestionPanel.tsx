"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import Image from "next/image";

import styles from "./GestionPanel.module.css";

import GestionNav from "./GestionNav";

type BusinessStats = {
  visits: number;
  googleClicks: number;
  lastActivity: string | null;
};

type Business = {
  id: string;
  name: string;
  slug: string;
  googleReviewUrl: string;
  logoUrl?: string;
  createdAt: string;
  active: boolean;
};

type BusinessForm = {
  name: string;
  slug: string;
  googleReviewUrl: string;
  logoUrl: string;
};

type DailyActivity = {
  date: string;
  visits: number;
  googleClicks: number;
};

type ManagementSummary = {
  active: number;
  inactive: number;
  total: number;
  visits: number;
  googleClicks: number;
  lastActivity: string | null;
};

type BusinessesResponse = {
  businesses?: Business[];
  summary?: ManagementSummary;
  statsByBusiness?: Record<string, BusinessStats>;
  daily?: DailyActivity[];
  error?: string;
};

type BusinessResponse = {
  business?: Business;
  error?: string;
};

type AuthResponse = {
  authenticated?: boolean;
  error?: string;
};

type ReportHistoryItem = {
  id: string;
  reportType: "individual" | "collective";
  periodFrom: string;
  periodTo: string;
  status: "completed" | "failed";
  fileName: string | null;
  contentType: string | null;
  fileSize: number | null;
  businessCount: number;
  createdAt: string;
  errorMessage: string | null;
};

type ReportHistoryResponse = {
  reports?: ReportHistoryItem[];
  error?: string;
};

type StatusFilter = "all" | "active" | "inactive";


type GestionSection =
  | "resumen"
  | "negocios"
  | "estadisticas"
  | "informes"
  | "archivo";

type GestionPanelProps = {
  section?: GestionSection;
};

type ReportPeriod =
  | "last7"
  | "last30"
  | "thisMonth"
  | "previousMonth"
  | "custom";

const emptyForm: BusinessForm = {
  name: "",
  slug: "",
  googleReviewUrl: "",
  logoUrl: "",
};

const emptySummary: ManagementSummary = {
  active: 0,
  inactive: 0,
  total: 0,
  visits: 0,
  googleClicks: 0,
  lastActivity: null,
};

function createSlug(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function formatNumber(value: number) {
  return new Intl.NumberFormat("es-ES").format(value);
}

function formatDate(value: string | null) {
  if (!value) {
    return "Sin actividad";
  }

  const normalizedValue = value.includes(" ")
    ? value.replace(" ", "T")
    : value;

  const date = new Date(normalizedValue);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("es-ES", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(date);
}

function formatCreatedDate(value: string) {
  if (!value) {
    return "Fecha desconocida";
  }

  const date = new Date(`${value}T12:00:00`);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("es-ES", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(date);
}

function formatActivityDate(value: string) {
  const date = new Date(`${value}T12:00:00`);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("es-ES", {
    day: "numeric",
    month: "short",
  }).format(date);
}

function formatFileSize(bytes: number | null) {
  if (bytes === null || !Number.isFinite(bytes) || bytes < 0) {
    return "Tamaño desconocido";
  }

  if (bytes < 1024) {
    return `${bytes} B`;
  }

  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toLocaleString("es-ES", {
      maximumFractionDigits: 1,
    })} KB`;
  }

  return `${(bytes / (1024 * 1024)).toLocaleString("es-ES", {
    maximumFractionDigits: 1,
  })} MB`;
}

/* ICONOS */

function StoreIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      width="20"
      height="20"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M3 10.5V21h18V10.5" />
      <path d="M3 10.5 5.2 4h13.6l2.2 6.5" />
      <path d="M3 10.5c.8 1.1 1.8 1.6 3 1.6s2.2-.5 3-1.6c.8 1.1 1.8 1.6 3 1.6s2.2-.5 3-1.6c.8 1.1 1.8 1.6 3 1.6s2.2-.5 3-1.6" />
      <path d="M8 21v-5h8v5" />
    </svg>
  );
}

function PlusIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      width="18"
      height="18"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      aria-hidden="true"
    >
      <path d="M12 5v14M5 12h14" />
    </svg>
  );
}

function EditIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      width="17"
      height="17"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M12 20h9" />
      <path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L8 18l-4 1 1-4Z" />
    </svg>
  );
}

function ExternalIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      width="16"
      height="16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M14 3h7v7" />
      <path d="M10 14 21 3" />
      <path d="M21 14v5a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5" />
    </svg>
  );
}

function EyeIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      width="20"
      height="20"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M2.5 12s3.5-7 9.5-7 9.5 7 9.5 7-3.5 7-9.5 7-9.5-7-9.5-7Z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

function ChartIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      width="18"
      height="18"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M4 19V5" />
      <path d="M4 19h17" />
      <path d="m7 15 4-4 3 2 5-6" />
    </svg>
  );
}


function DashboardIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      width="20"
      height="20"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <rect x="3.5" y="3.5" width="7" height="7" rx="1.5" />
      <rect x="13.5" y="3.5" width="7" height="4" rx="1.5" />
      <rect x="13.5" y="10.5" width="7" height="10" rx="1.5" />
      <rect x="3.5" y="13.5" width="7" height="7" rx="1.5" />
    </svg>
  );
}

function StatisticsIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      width="20"
      height="20"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M4 19.5h16" />
      <rect x="5.5" y="11" width="3.5" height="6.5" rx="1" />
      <rect x="10.5" y="7" width="3.5" height="10.5" rx="1" />
      <rect x="15.5" y="3.5" width="3.5" height="14" rx="1" />
    </svg>
  );
}


function DocumentIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      width="20"
      height="20"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M7 3.75h7l4 4v12.5H7a2 2 0 0 1-2-2v-12.5a2 2 0 0 1 2-2Z" />
      <path d="M14 3.75v4h4" />
      <path d="M8.5 12h7" />
      <path d="M8.5 15.5h7" />
    </svg>
  );
}

function AddDocumentIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      width="18"
      height="18"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M6.5 3.75h7l4 4v5.5" />
      <path d="M13.5 3.75v4h4" />
      <path d="M6.5 3.75a2 2 0 0 0-2 2v12.5a2 2 0 0 0 2 2h6" />
      <path d="M8 11h6M8 14h5" />
      <circle cx="18" cy="18" r="4" />
      <path d="M18 16v4M16 18h4" />
    </svg>
  );
}

function HistoryIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      width="20"
      height="20"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="8.5" />
      <path d="M12 7.5v5l3 2" />
      <path d="M4 4.5v4h4" />
    </svg>
  );
}

function SearchDocumentIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      width="22"
      height="22"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M6.5 3.5h7l4 4v4" />
      <path d="M13.5 3.5v4h4" />
      <path d="M6.5 3.5a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h4" />
      <path d="M8 11h6M8 14h3" />
      <circle cx="16.5" cy="16.5" r="3.5" />
      <path d="m19 19 2 2" />
    </svg>
  );
}

function DownloadIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      width="17"
      height="17"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M12 3v12" />
      <path d="m7 10 5 5 5-5" />
      <path d="M4 17v3h16v-3" />
    </svg>
  );
}

function RefreshIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      width="20"
      height="20"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M20 7v5h-5" />
      <path d="M4.8 9a7.5 7.5 0 0 1 12.6-2.2L20 12" />
      <path d="M4 17v-5h5" />
      <path d="M19.2 15a7.5 7.5 0 0 1-12.6 2.2L4 12" />
    </svg>
  );
}

function LockIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      width="22"
      height="22"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      aria-hidden="true"
    >
      <rect x="4" y="10" width="16" height="10" rx="2" />
      <path d="M8 10V7a4 4 0 0 1 8 0v3" />
    </svg>
  );
}

function ArrowIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      width="17"
      height="17"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M5 12h13" />
      <path d="m13 7 5 5-5 5" />
    </svg>
  );
}

function AlertIcon() {
  return (
    <span className={styles.alertIcon} aria-hidden="true">
      !
    </span>
  );
}

function TrashIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      width="17"
      height="17"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M4 7h16" />
      <path d="M10 11v6" />
      <path d="M14 11v6" />
      <path d="M6 7l1 14h10l1-14" />
      <path d="M9 7V4h6v3" />
    </svg>
  );
}

function ActivateIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      width="17"
      height="17"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M20 11a8 8 0 1 0 1 4" />
      <path d="M20 4v7h-7" />
    </svg>
  );
}

function ActivityIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      width="20"
      height="20"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M4 19V5" />
      <path d="M4 19h17" />
      <path d="m7 15 3-3 3 2 5-7" />
    </svg>
  );
}

function FilterIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      width="16"
      height="16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M4 6h16" />
      <path d="M7 12h10" />
      <path d="M10 18h4" />
    </svg>
  );
}

function SearchIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      width="17"
      height="17"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <circle cx="11" cy="11" r="6.5" />
      <path d="m16 16 4 4" />
    </svg>
  );
}

export default function GestionPanel({
  section = "resumen",
}: GestionPanelProps) {
  const [authenticated, setAuthenticated] = useState<boolean | null>(null);

  const [password, setPassword] = useState("");
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [summary, setSummary] = useState<ManagementSummary>(emptySummary);
  const [statsByBusiness, setStatsByBusiness] = useState<
    Record<string, BusinessStats>
  >({});
  const [dailyActivity, setDailyActivity] = useState<DailyActivity[]>([]);

  const [form, setForm] = useState<BusinessForm>(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formOpen, setFormOpen] = useState(false);

  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [quickDeletingId, setQuickDeletingId] = useState<string | null>(null);
  const [activatingId, setActivatingId] = useState<string | null>(null);

  const [loginError, setLoginError] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [logoutConfirmOpen, setLogoutConfirmOpen] = useState(false);

  const [reportFrom, setReportFrom] = useState("");
  const [reportTo, setReportTo] = useState("");
  const [generatingReports, setGeneratingReports] = useState(false);
  const [reportError, setReportError] = useState("");
  const [reportSuccess, setReportSuccess] = useState("");
  const [reportPeriod, setReportPeriod] = useState<ReportPeriod>("last7");

  const [reportHistory, setReportHistory] = useState<ReportHistoryItem[]>([]);
  const [reportHistoryLoading, setReportHistoryLoading] = useState(false);
  const [reportHistoryError, setReportHistoryError] = useState("");
  const [downloadingReportId, setDownloadingReportId] = useState<string | null>(
    null
  );

  async function checkAuthentication() {
    try {
      const response = await fetch("/api/analytics/auth", {
        method: "GET",
        cache: "no-store",
      });

      const data = (await response.json()) as AuthResponse;

      setAuthenticated(Boolean(data.authenticated));
    } catch {
      setAuthenticated(false);
    } finally {
      setLoading(false);
    }
  }

  async function loadBusinesses() {
    setError("");

    try {
      const response = await fetch("/api/gestion", {
        method: "GET",
        cache: "no-store",
      });

      const data = (await response.json()) as BusinessesResponse;

      if (response.status === 401) {
        setAuthenticated(false);
        return;
      }

      if (!response.ok) {
        setError(data.error || "No se pudieron cargar los negocios.");
        return;
      }

      setBusinesses(data.businesses || []);
      setSummary(data.summary || emptySummary);
      setStatsByBusiness(data.statsByBusiness || {});
      setDailyActivity(data.daily || []);
    } catch {
      setError("No se pudieron cargar los negocios.");
    }
  }

  async function loadReportHistory() {
    setReportHistoryLoading(true);
    setReportHistoryError("");

    try {
      const response = await fetch("/api/gestion/reports/history?limit=100", {
        method: "GET",
        cache: "no-store",
      });

      const data = (await response.json()) as ReportHistoryResponse;

      if (response.status === 401) {
        setAuthenticated(false);
        return;
      }

      if (!response.ok) {
        setReportHistoryError(
          data.error || "No se pudo cargar el historial de informes."
        );
        return;
      }

      setReportHistory(data.reports || []);
    } catch {
      setReportHistoryError("No se pudo cargar el historial de informes.");
    } finally {
      setReportHistoryLoading(false);
    }
  }

  async function handleDownloadReport(report: ReportHistoryItem) {
    if (
      downloadingReportId ||
      report.status !== "completed" ||
      !report.fileName
    ) {
      return;
    }

    setDownloadingReportId(report.id);
    setReportHistoryError("");

    try {
      const response = await fetch(
        `/api/gestion/reports/history/download?id=${encodeURIComponent(
          report.id
        )}`,
        {
          method: "GET",
          cache: "no-store",
        }
      );

      if (response.status === 401) {
        setAuthenticated(false);
        return;
      }

      if (!response.ok) {
        let message = "No se pudo descargar el informe.";

        try {
          const data = (await response.json()) as { error?: string };

          if (data.error) {
            message = data.error;
          }
        } catch {
          // La respuesta puede no ser JSON.
        }

        setReportHistoryError(message);
        return;
      }

      const blob = await response.blob();
      const objectUrl = window.URL.createObjectURL(blob);
      const link = document.createElement("a");

      link.href = objectUrl;
      link.download = report.fileName;

      document.body.appendChild(link);
      link.click();
      link.remove();

      window.setTimeout(() => {
        window.URL.revokeObjectURL(objectUrl);
      }, 1000);
    } catch {
      setReportHistoryError("No se pudo descargar el informe.");
    } finally {
      setDownloadingReportId(null);
    }
  }

  useEffect(() => {
    checkAuthentication();
  }, []);

  useEffect(() => {
    const today = new Date();

    const formatLocalDate = (date: Date) => {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, "0");
      const day = String(date.getDate()).padStart(2, "0");

      return `${year}-${month}-${day}`;
    };

    const from = new Date(today);
    from.setDate(from.getDate() - 6);

    setReportFrom(formatLocalDate(from));
    setReportTo(formatLocalDate(today));
  }, []);

  useEffect(() => {
    if (authenticated) {
      loadBusinesses();
      loadReportHistory();
    } else {
      setReportHistory([]);
    }
  }, [authenticated]);

  async function handleLogin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

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

      const data = (await response.json()) as AuthResponse;

      if (!response.ok) {
        setLoginError(data.error || "La contraseña no es correcta.");
        return;
      }

      setPassword("");
      setAuthenticated(true);
    } catch {
      setLoginError("No se pudo iniciar sesión.");
    }
  }

  async function handleLogout() {
    setLogoutConfirmOpen(false);

    try {
      await fetch("/api/analytics/auth", {
        method: "DELETE",
      });
    } finally {
      setAuthenticated(false);
      setPassword("");
      setBusinesses([]);
      setSummary(emptySummary);
      setStatsByBusiness({});
      setDailyActivity([]);
      setReportHistory([]);
      setReportHistoryError("");
      setForm(emptyForm);
      setEditingId(null);
      setFormOpen(false);
      setSearchTerm("");
      setStatusFilter("all");
      setError("");
      setSuccess("");
    }
  }

  function handleReportPeriodChange(period: ReportPeriod) {
    setReportPeriod(period);
    setReportError("");
    setReportSuccess("");

    if (period === "custom") {
      return;
    }

    const today = new Date();

    const formatLocalDate = (date: Date) => {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, "0");
      const day = String(date.getDate()).padStart(2, "0");

      return `${year}-${month}-${day}`;
    };

    if (period === "last7") {
      const from = new Date(today);
      from.setDate(from.getDate() - 6);

      setReportFrom(formatLocalDate(from));
      setReportTo(formatLocalDate(today));
      return;
    }

    if (period === "last30") {
      const from = new Date(today);
      from.setDate(from.getDate() - 29);

      setReportFrom(formatLocalDate(from));
      setReportTo(formatLocalDate(today));
      return;
    }

    if (period === "thisMonth") {
      const from = new Date(today.getFullYear(), today.getMonth(), 1);

      setReportFrom(formatLocalDate(from));
      setReportTo(formatLocalDate(today));
      return;
    }

    if (period === "previousMonth") {
      const from = new Date(today.getFullYear(), today.getMonth() - 1, 1);
      const to = new Date(today.getFullYear(), today.getMonth(), 0);

      setReportFrom(formatLocalDate(from));
      setReportTo(formatLocalDate(to));
    }
  }

  async function handleGenerateReports() {
    if (!reportFrom || !reportTo) {
      setReportError("Selecciona una fecha inicial y una fecha final.");
      setReportSuccess("");
      return;
    }

    if (reportFrom > reportTo) {
      setReportError(
        "La fecha inicial no puede ser posterior a la fecha final."
      );
      setReportSuccess("");
      return;
    }

    setGeneratingReports(true);
    setReportError("");
    setReportSuccess("");

    try {
      const response = await fetch(
        `/api/gestion/reports/bulk?from=${encodeURIComponent(
          reportFrom
        )}&to=${encodeURIComponent(reportTo)}`,
        {
          method: "GET",
          cache: "no-store",
        }
      );

      if (response.status === 401) {
        setAuthenticated(false);
        return;
      }

      if (!response.ok) {
        let message = "No se han podido generar los informes.";

        try {
          const data = (await response.json()) as {
            error?: string;
          };

          if (data.error) {
            message = data.error;
          }
        } catch {
          // La respuesta puede no ser JSON.
        }

        setReportError(message);
        return;
      }

      const blob = await response.blob();
      const contentDisposition = response.headers.get("Content-Disposition");

      let filename = `TOCA_Informes_${reportFrom}_${reportTo}.zip`;

      const filenameMatch = contentDisposition?.match(/filename="([^"]+)"/);

      if (filenameMatch?.[1]) {
        filename = filenameMatch[1];
      }

      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");

      link.href = url;
      link.download = filename;

      document.body.appendChild(link);
      link.click();
      link.remove();

      window.setTimeout(() => {
        window.URL.revokeObjectURL(url);
      }, 1000);

      const generated = response.headers.get("X-TOCA-Reports-Generated");
      const failed = response.headers.get("X-TOCA-Reports-Failed");

      if (failed && Number(failed) > 0) {
        setReportSuccess(
          `ZIP generado: ${generated || "varios"} informes correctamente. ` +
          `${failed} negocio${Number(failed) === 1 ? "" : "s"
          } tuvo${Number(failed) === 1 ? "" : "ieron"} un error. ` +
          "Consulta TOCA_Resumen.txt."
        );
      } else {
        setReportSuccess(
          `ZIP generado correctamente con ${generated || "todos los"
          } informes.`
        );
      }

      // Actualizar el historial DESPUÉS de generar el ZIP.
      await loadReportHistory();
    } catch {
      setReportError("No se han podido generar los informes.");
    } finally {
      setGeneratingReports(false);
    }
  }

  function scrollToForm() {
    window.setTimeout(() => {
      const formSection = document.querySelector(`.${styles.formSection}`);

      if (formSection instanceof HTMLElement) {
        const top =
          formSection.getBoundingClientRect().top + window.scrollY - 18;

        window.scrollTo({
          top,
          behavior: "smooth",
        });
      }
    }, 50);
  }

  function startCreating() {
    setEditingId(null);
    setForm(emptyForm);
    setError("");
    setSuccess("");
    setFormOpen(true);

    scrollToForm();
  }

  function startEditing(business: Business) {
    if (!business.active) {
      return;
    }

    setEditingId(business.id);

    setForm({
      name: business.name,
      slug: business.slug,
      googleReviewUrl: business.googleReviewUrl,
      logoUrl: business.logoUrl || "",
    });

    setError("");
    setSuccess("");
    setFormOpen(true);

    scrollToForm();
  }

  function closeForm() {
    setFormOpen(false);
    setEditingId(null);
    setForm(emptyForm);
    setError("");
  }

  function handleNameChange(value: string) {
    setForm((current) => ({
      ...current,
      name: value,
      slug: editingId ? current.slug : createSlug(value),
    }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setSaving(true);
    setError("");
    setSuccess("");

    const payload = {
      ...(editingId ? { id: editingId } : {}),
      name: form.name,
      slug: form.slug,
      googleReviewUrl: form.googleReviewUrl,
      logoUrl: form.logoUrl,
    };

    try {
      const response = await fetch("/api/gestion", {
        method: editingId ? "PUT" : "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const data = (await response.json()) as BusinessResponse;

      if (response.status === 401) {
        setAuthenticated(false);
        return;
      }

      if (!response.ok) {
        setError(data.error || "No se pudo guardar el negocio.");
        return;
      }

      const message = editingId
        ? "Negocio actualizado correctamente."
        : "Negocio creado correctamente.";

      setSuccess(message);

      setForm(emptyForm);
      setEditingId(null);
      setFormOpen(false);

      await loadBusinesses();

      window.setTimeout(() => {
        setSuccess("");
      }, 4500);
    } catch {
      setError("No se pudo guardar el negocio.");
    } finally {
      setSaving(false);
    }
  }

  async function deactivateBusiness(
    businessId: string,
    businessName: string
  ) {
    if (quickDeletingId || deleting) {
      return;
    }

    const confirmed = window.confirm(
      `¿Seguro que quieres desactivar "${businessName}"?\n\n` +
      "Su página pública dejará de estar disponible, " +
      "pero sus estadísticas se conservarán."
    );

    if (!confirmed) {
      return;
    }

    setQuickDeletingId(businessId);
    setError("");
    setSuccess("");

    try {
      const response = await fetch("/api/gestion", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id: businessId,
        }),
      });

      const data = (await response.json()) as {
        success?: boolean;
        error?: string;
      };

      if (response.status === 401) {
        setAuthenticated(false);
        return;
      }

      if (!response.ok) {
        setError(data.error || "No se pudo desactivar el negocio.");
        return;
      }

      setSuccess(
        "Negocio desactivado correctamente. Sus estadísticas se han conservado."
      );

      await loadBusinesses();

      window.setTimeout(() => {
        setSuccess("");
      }, 5000);
    } catch {
      setError("No se pudo desactivar el negocio.");
    } finally {
      setQuickDeletingId(null);
    }
  }

  async function activateBusiness(
    businessId: string,
    businessName: string
  ) {
    if (activatingId || quickDeletingId || deleting) {
      return;
    }

    const confirmed = window.confirm(
      `¿Quieres reactivar "${businessName}"?\n\n` +
      "Su página pública volverá a estar disponible " +
      "y conservará sus estadísticas."
    );

    if (!confirmed) {
      return;
    }

    setActivatingId(businessId);
    setError("");
    setSuccess("");

    try {
      const response = await fetch("/api/gestion", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id: businessId,
          action: "activate",
        }),
      });

      const data = (await response.json()) as {
        success?: boolean;
        error?: string;
      };

      if (response.status === 401) {
        setAuthenticated(false);
        return;
      }

      if (!response.ok) {
        setError(data.error || "No se pudo reactivar el negocio.");
        return;
      }

      setSuccess(
        "Negocio reactivado correctamente. " +
        "Su página pública vuelve a estar disponible."
      );

      await loadBusinesses();

      window.setTimeout(() => {
        setSuccess("");
      }, 5000);
    } catch {
      setError("No se pudo reactivar el negocio.");
    } finally {
      setActivatingId(null);
    }
  }

  async function handleDelete() {
    if (!editingId || deleting) {
      return;
    }

    const confirmed = window.confirm(
      `¿Seguro que quieres eliminar "${form.name}"?\n\n` +
      "Su página pública dejará de estar disponible, " +
      "pero sus estadísticas se conservarán."
    );

    if (!confirmed) {
      return;
    }

    setDeleting(true);
    setError("");
    setSuccess("");

    try {
      const response = await fetch("/api/gestion", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id: editingId,
        }),
      });

      const data = (await response.json()) as {
        success?: boolean;
        error?: string;
      };

      if (response.status === 401) {
        setAuthenticated(false);
        return;
      }

      if (!response.ok) {
        setError(data.error || "No se pudo eliminar el negocio.");
        return;
      }

      setFormOpen(false);
      setEditingId(null);
      setForm(emptyForm);

      setSuccess(
        "Negocio desactivado correctamente. Sus estadísticas se han conservado."
      );

      await loadBusinesses();

      window.setTimeout(() => {
        setSuccess("");
      }, 5000);
    } catch {
      setError("No se pudo eliminar el negocio.");
    } finally {
      setDeleting(false);
    }
  }

  const filteredBusinesses = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();

    return businesses.filter((business) => {
      const matchesSearch =
        !normalizedSearch ||
        business.name.toLowerCase().includes(normalizedSearch) ||
        business.slug.toLowerCase().includes(normalizedSearch);

      const matchesStatus =
        statusFilter === "all" ||
        (statusFilter === "active" && business.active) ||
        (statusFilter === "inactive" && !business.active);

      return matchesSearch && matchesStatus;
    });
  }, [businesses, searchTerm, statusFilter]);

  const maxActivity = useMemo(() => {
    return Math.max(
      1,
      ...dailyActivity.map(
        (activity) => activity.visits + activity.googleClicks
      )
    );
  }, [dailyActivity]);

  if (loading || authenticated === null) {
    return (
      <main className={styles.loadingPage}>
        <div className={styles.loadingContent}>
          <span className={styles.spinner} />
          <p>Cargando gestión...</p>
        </div>
      </main>
    );
  }

  if (!authenticated) {
    return (
      <main className={styles.loginPage}>
        <div className={styles.loginBackground} />

        <section className={styles.loginContainer}>
          <div className={styles.loginLogo}>
            <Image
              src="/logo/toca.svg"
              alt="TOCA"
              width={118}
              height={45}
              priority
            />
          </div>

          <div className={styles.loginCard}>
            <div className={styles.loginIcon}>
              <LockIcon />
            </div>

            <span className={styles.loginLabel}>Área privada</span>

            <h1>Gestión de TOCA</h1>

            <p className={styles.loginDescription}>
              Accede al panel para administrar los negocios conectados a TOCA.
            </p>

            <form className={styles.loginForm} onSubmit={handleLogin}>
              <label htmlFor="password">Contraseña</label>

              <input
                id="password"
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                autoComplete="current-password"
                placeholder="Introduce tu contraseña"
                required
              />

              {loginError && (
                <div className={styles.loginError}>
                  <AlertIcon />
                  <span>{loginError}</span>
                </div>
              )}

              <button type="submit" className={styles.loginButton}>
                <span>Acceder al panel</span>
                <ArrowIcon />
              </button>
            </form>
          </div>

          <div className={styles.loginFooter}>
            <span className={styles.loginFooterDot} />
            <span>Panel privado de TOCA</span>
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className={styles.page}>
      <div className={styles.background} />

      <div className={styles.container}>
        <header className={styles.header}>
          <div className={styles.brand}>
            <Image
              src="/logo/toca.svg"
              alt="TOCA"
              width={120}
              height={46}
              priority
            />
          </div>

          <div className={styles.headerContent}>
            <div className={styles.headerText}>
              <span className={styles.eyebrow}>Panel privado</span>

              <h1>Tu panel de TOCA</h1>

              <p>
                Gestiona tus negocios y controla todo desde un mismo lugar.
              </p>
            </div>

            <div className={styles.headerActions}>
              <button
                type="button"
                className={styles.logoutButton}
                onClick={() => setLogoutConfirmOpen(true)}
              >
                <span>Cerrar sesión</span>
              </button>

              <a href="/" className={styles.backButton}>
                <span>Ir al inicio</span>
                <ExternalIcon />
              </a>
            </div>
          </div>
        </header>

        <div className={styles.workspace}>
          <aside className={styles.sidebar}>
            <GestionNav />
          </aside>

          <div className={styles.mainContent}>

            {section === "resumen" && (
              <section className={styles.dashboardSection}>
                <div className={styles.dashboardHeader}>

                  <div className={styles.dashboardIntroText}>
                    <div className={styles.sectionHeadingMain}>
                      <div className={styles.sectionIcon}>
                        <DashboardIcon />
                      </div>

                      <div>
                        <span className={styles.dashboardEyebrow}>
                          Centro de control
                        </span>

                        <h2>Todo listo para gestionar.</h2>
                      </div>
                    </div>

                    <p>
                      Consulta el estado de tus negocios y el rendimiento global de
                      TOCA desde un único lugar.
                    </p>
                  </div>

                  <button
                    type="button"
                    className={styles.dashboardCreateButton}
                    onClick={startCreating}
                  >
                    <PlusIcon />
                    <span>Nuevo negocio</span>
                  </button>
                </div>

                <div className={styles.dashboardStats}>
                  <article className={styles.dashboardStat}>
                    <div className={styles.dashboardStatIcon}>
                      <StoreIcon />
                    </div>

                    <div className={styles.dashboardStatContent}>
                      <span>Negocios activos</span>
                      <strong>{summary.active}</strong>

                      <p>
                        {summary.active === 1
                          ? "negocio disponible"
                          : "negocios disponibles"}
                      </p>
                    </div>
                  </article>

                  <article className={styles.dashboardStat}>
                    <div
                      className={`${styles.dashboardStatIcon} ${styles.dashboardStatIconMuted}`}
                    >
                      <StoreIcon />
                    </div>

                    <div className={styles.dashboardStatContent}>
                      <span>Negocios inactivos</span>
                      <strong>{summary.inactive}</strong>

                      <p>
                        {summary.inactive === 1
                          ? "negocio desactivado"
                          : "negocios desactivados"}
                      </p>
                    </div>
                  </article>

                  <article className={styles.dashboardStat}>
                    <div className={styles.dashboardStatIcon}>
                      <EyeIcon />
                    </div>

                    <div className={styles.dashboardStatContent}>
                      <span>Visitas totales</span>
                      <strong>{formatNumber(summary.visits)}</strong>
                      <p>Actividad registrada en las páginas</p>
                    </div>
                  </article>

                  <article
                    className={`${styles.dashboardStat} ${styles.dashboardStatAccent}`}
                  >
                    <div className={styles.dashboardStatIcon}>
                      <ChartIcon />
                    </div>

                    <div className={styles.dashboardStatContent}>
                      <span>Interacciones</span>
                      <strong>{formatNumber(summary.googleClicks)}</strong>
                      <p>Clics registrados hacia Google</p>
                    </div>
                  </article>
                </div>

                <div className={styles.activityCard}>
                  <div className={styles.activityHeader}>
                    <div className={styles.activityTitle}>
                      <div className={styles.activityIcon}>
                        <ActivityIcon />
                      </div>

                      <div>
                        <span>Actividad reciente</span>
                        <h3>Últimos 14 días</h3>
                      </div>
                    </div>

                    <div className={styles.activityLegend}>
                      <span>
                        <i className={styles.legendVisits} />
                        Visitas
                      </span>

                      <span>
                        <i className={styles.legendClicks} />
                        Interacciones
                      </span>
                    </div>
                  </div>

                  {dailyActivity.length === 0 ? (
                    <div className={styles.activityEmpty}>
                      <ActivityIcon />
                      <p>Aún no hay actividad registrada.</p>
                      <span>
                        Cuando tus páginas reciban visitas, aparecerán aquí.
                      </span>
                    </div>
                  ) : (
                    <div className={styles.activityList}>
                      {dailyActivity.map((activity) => {
                        const visitsWidth =
                          (activity.visits / maxActivity) * 100;

                        const clicksWidth =
                          (activity.googleClicks / maxActivity) * 100;

                        return (
                          <div className={styles.activityRow} key={activity.date}>
                            <span className={styles.activityDate}>
                              {formatActivityDate(activity.date)}
                            </span>

                            <div className={styles.activityBars}>
                              <div className={styles.activityTrack}>
                                <span
                                  className={`${styles.activityBar} ${styles.activityBarVisits}`}
                                  style={{
                                    width: `${activity.visits > 0
                                      ? Math.max(visitsWidth, 3)
                                      : 0
                                      }%`,
                                  }}
                                />
                              </div>

                              <div className={styles.activityTrack}>
                                <span
                                  className={`${styles.activityBar} ${styles.activityBarClicks}`}
                                  style={{
                                    width: `${activity.googleClicks > 0
                                      ? Math.max(clicksWidth, 3)
                                      : 0
                                      }%`,
                                  }}
                                />
                              </div>
                            </div>

                            <div className={styles.activityValues}>
                              <strong>{formatNumber(activity.visits)}</strong>
                              <span>{formatNumber(activity.googleClicks)}</span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </section>
            )}




            {/* ESTADÍSTICAS */}
            {section === "estadisticas" && (
              <section className={styles.dashboardSection}>
                <div className={styles.dashboardHeader}>

                  <div className={styles.dashboardIntroText}>
                    <div className={styles.sectionHeadingMain}>
                      <div className={styles.sectionIcon}>
                        <StatisticsIcon />
                      </div>

                      <div>
                        <span className={styles.dashboardEyebrow}>
                          Análisis de rendimiento
                        </span>

                        <h2>Estadísticas</h2>
                      </div>
                    </div>

                    <p>
                      Analiza la evolución de la actividad y descubre qué negocios
                      concentran más visitas e interacciones.
                    </p>
                  </div>

                </div>

                {(() => {
                  const rankedBusinesses = [...businesses]
                    .map((business) => {
                      const stats = statsByBusiness[business.id] ?? {
                        visits: 0,
                        googleClicks: 0,
                        lastActivity: null,
                      };

                      return {
                        business,
                        stats,
                        interactionRate:
                          stats.visits > 0
                            ? (stats.googleClicks / stats.visits) * 100
                            : null,
                      };
                    })
                    .sort((a, b) => b.stats.visits - a.stats.visits);

                  const totalVisits = dailyActivity.reduce(
                    (total, activity) => total + activity.visits,
                    0
                  );

                  const totalClicks = dailyActivity.reduce(
                    (total, activity) => total + activity.googleClicks,
                    0
                  );

                  const peakDay = dailyActivity.reduce<
                    (typeof dailyActivity)[number] | null
                  >((best, activity) => {
                    const activityTotal = activity.visits + activity.googleClicks;
                    const bestTotal = best
                      ? best.visits + best.googleClicks
                      : -1;

                    return activityTotal > bestTotal ? activity : best;
                  }, null);

                  const topBusiness = rankedBusinesses.find(
                    (item) => item.stats.visits > 0
                  );

                  const topInteraction = [...rankedBusinesses]
                    .filter((item) => item.interactionRate !== null)
                    .sort(
                      (a, b) =>
                        (b.interactionRate ?? 0) - (a.interactionRate ?? 0)
                    )[0];

                  const chartMax = Math.max(
                    1,
                    ...dailyActivity.map((activity) =>
                      Math.max(activity.visits, activity.googleClicks)
                    )
                  );

                  const hasActivity = dailyActivity.some(
                    (activity) => activity.visits > 0 || activity.googleClicks > 0
                  );

                  return (
                    <>
                      {/* INDICADORES PRINCIPALES */}
                      <div className={styles.statsOverview}>
                        <article className={styles.statsMetric}>
                          <span className={styles.statsMetricLabel}>
                            Visitas registradas
                          </span>
                          <strong className={styles.statsMetricValue}>
                            {formatNumber(totalVisits)}
                          </strong>
                          <span className={styles.statsMetricHint}>
                            Periodo mostrado en el gráfico
                          </span>
                        </article>

                        <article className={styles.statsMetric}>
                          <span className={styles.statsMetricLabel}>
                            Clics hacia Google
                          </span>
                          <strong className={styles.statsMetricValue}>
                            {formatNumber(totalClicks)}
                          </strong>
                          <span className={styles.statsMetricHint}>
                            Interacciones registradas en el periodo
                          </span>
                        </article>

                        <article className={styles.statsMetric}>
                          <span className={styles.statsMetricLabel}>
                            Negocios registrados
                          </span>
                          <strong className={styles.statsMetricValue}>
                            {formatNumber(businesses.length)}
                          </strong>
                          <span className={styles.statsMetricHint}>
                            {businesses.filter((business) => business.active).length} activos
                          </span>
                        </article>
                      </div>

                      {/* EVOLUCIÓN DE LA ACTIVIDAD */}
                      <div className={`${styles.activityCard} ${styles.statsChartCard}`}>
                        <div className={styles.activityHeader}>
                          <div className={styles.activityTitle}>
                            <div className={styles.activityIcon}>
                              <ActivityIcon />
                            </div>
                            <div>
                              <span>Tendencia general</span>
                              <h3>Actividad diaria</h3>
                            </div>
                          </div>

                          <div className={styles.activityLegend}>
                            <span>
                              <i className={styles.legendVisits} />
                              Visitas
                            </span>
                            <span>
                              <i className={styles.legendClicks} />
                              Clics a Google
                            </span>
                          </div>
                        </div>

                        {!hasActivity ? (
                          <div className={styles.activityEmpty}>
                            <ActivityIcon />
                            <p>Aún no hay actividad registrada.</p>
                            <span>
                              Cuando se registren visitas o clics, podrás consultar aquí
                              su evolución.
                            </span>
                          </div>
                        ) : (
                          <div
                            className={styles.statsChart}
                            role="img"
                            aria-label="Gráfico de barras que compara las visitas y los clics a Google de los últimos 14 días"
                          >
                            {dailyActivity.map((activity) => {
                              const visitsHeight =
                                activity.visits > 0
                                  ? Math.max((activity.visits / chartMax) * 100, 3)
                                  : 0;

                              const clicksHeight =
                                activity.googleClicks > 0
                                  ? Math.max((activity.googleClicks / chartMax) * 100, 3)
                                  : 0;

                              return (
                                <div className={styles.statsChartColumn} key={activity.date}>
                                  <div className={styles.statsChartBars}>
                                    <div className={styles.statsChartBarSlot}>
                                      <span
                                        className={`${styles.statsChartBar} ${styles.statsChartBarVisits}`}
                                        style={{ height: `${visitsHeight}%` }}
                                        title={`Visitas: ${formatNumber(activity.visits)}`}
                                      />
                                    </div>
                                    <div className={styles.statsChartBarSlot}>
                                      <span
                                        className={`${styles.statsChartBar} ${styles.statsChartBarClicks}`}
                                        style={{ height: `${clicksHeight}%` }}
                                        title={`Clics a Google: ${formatNumber(activity.googleClicks)}`}
                                      />
                                    </div>
                                  </div>

                                  <span className={styles.statsChartDate}>
                                    {formatActivityDate(activity.date)}
                                  </span>
                                  <span className={styles.statsChartValues}>
                                    {formatNumber(activity.visits)} /{" "}
                                    {formatNumber(activity.googleClicks)}
                                  </span>
                                </div>
                              );
                            })}
                          </div>
                        )}


                      </div>

                      {/* INSIGHTS */}
                      <div className={styles.statsInsights}>
                        <div className={styles.statsSectionHeading}>
                          <div>
                            <span className={styles.dashboardEyebrow}>
                              Lectura rápida
                            </span>
                            <h3>Lo más destacado</h3>
                          </div>
                        </div>

                        <div className={styles.statsInsightGrid}>
                          <article className={styles.statsInsight}>
                            <span className={styles.statsInsightLabel}>
                              Más visitas
                            </span>
                            {topBusiness ? (
                              <>
                                <strong>{topBusiness.business.name}</strong>
                                <span>
                                  {formatNumber(topBusiness.stats.visits)} visitas
                                </span>
                              </>
                            ) : (
                              <span>Aún no hay visitas por negocio.</span>
                            )}
                          </article>

                          <article className={styles.statsInsight}>
                            <span className={styles.statsInsightLabel}>
                              Mayor ratio de interacción
                            </span>
                            {topInteraction ? (
                              <>
                                <strong>{topInteraction.business.name}</strong>
                                <span>
                                  {topInteraction.interactionRate!.toLocaleString(
                                    "es-ES",
                                    { maximumFractionDigits: 1 }
                                  )}% de clics respecto a visitas
                                </span>
                              </>
                            ) : (
                              <span>No hay datos suficientes para calcularlo.</span>
                            )}
                          </article>

                          <article className={styles.statsInsight}>
                            <span className={styles.statsInsightLabel}>
                              Día con más actividad
                            </span>
                            {peakDay &&
                              peakDay.visits + peakDay.googleClicks > 0 ? (
                              <>
                                <strong>{formatActivityDate(peakDay.date)}</strong>
                                <span>
                                  {formatNumber(
                                    peakDay.visits + peakDay.googleClicks
                                  )}{" "}
                                  acciones registradas
                                </span>
                              </>
                            ) : (
                              <span>Aún no hay actividad registrada.</span>
                            )}
                          </article>
                        </div>
                      </div>

                      {/* RANKING DE NEGOCIOS */}
                      <div className={`${styles.activityCard} ${styles.statsRankingCard}`}>
                        <div className={styles.activityHeader}>
                          <div className={styles.activityTitle}>
                            <div className={styles.activityIcon}>
                              <ChartIcon />
                            </div>
                            <div>
                              <span>Comparativa de resultados</span>
                              <h3>Rendimiento por negocio</h3>
                            </div>
                          </div>
                        </div>

                        {rankedBusinesses.length === 0 ? (
                          <div className={styles.activityEmpty}>
                            <StoreIcon />
                            <p>No hay negocios para comparar.</p>
                            <span>
                              Cuando registres negocios, podrás consultar aquí sus
                              resultados.
                            </span>
                          </div>
                        ) : (
                          <div className={styles.statsTableWrapper}>
                            <table className={styles.statsTable}>
                              <thead>
                                <tr>
                                  <th scope="col">Negocio</th>
                                  <th scope="col">Estado</th>
                                  <th scope="col">Visitas</th>
                                  <th scope="col">Clics Google</th>
                                  <th scope="col">Ratio</th>
                                  <th scope="col">Última actividad</th>
                                </tr>
                              </thead>
                              <tbody>
                                {rankedBusinesses.map(
                                  ({ business, stats, interactionRate }, index) => (
                                    <tr key={business.id}>
                                      <td>
                                        <div className={styles.statsBusinessCell}>
                                          <span className={styles.statsRank}>
                                            {index + 1}
                                          </span>
                                          <div>
                                            <strong>{business.name}</strong>
                                            <span>/{business.slug}</span>
                                          </div>
                                        </div>
                                      </td>
                                      <td>
                                        <span
                                          className={`${styles.businessStatus} ${!business.active
                                            ? styles.businessStatusInactive
                                            : ""
                                            }`}
                                        >
                                          {business.active ? "Activo" : "Inactivo"}
                                        </span>
                                      </td>
                                      <td className={styles.statsNumericCell}>
                                        {formatNumber(stats.visits)}
                                      </td>
                                      <td className={styles.statsNumericCell}>
                                        {formatNumber(stats.googleClicks)}
                                      </td>
                                      <td className={styles.statsNumericCell}>
                                        {interactionRate !== null
                                          ? `${interactionRate.toLocaleString("es-ES", {
                                            maximumFractionDigits: 1,
                                          })}%`
                                          : "—"}
                                      </td>
                                      <td>{formatDate(stats.lastActivity)}</td>
                                    </tr>
                                  )
                                )}
                              </tbody>
                            </table>
                          </div>
                        )}
                      </div>
                    </>
                  );
                })()}
              </section>
            )}


            {/* GENERADOR DE INFORMES */}
            {section === "informes" && (
              <section className={styles.reportsSection}>
                <div className={styles.sectionHeading}>
                  <div className={styles.sectionHeadingMain}>
                    <div className={styles.sectionIcon}>
                      <DocumentIcon />
                    </div>

                    <div>
                      <span className={styles.sectionLabel}>Informes</span>
                      <h2>Informes de actividad</h2>
                      <p>
                        Genera los informes de todos tus negocios activos en un solo
                        archivo.
                      </p>
                    </div>
                  </div>
                </div>

                <div className={styles.reportsCard}>
                  <div className={styles.reportsTop}>
                    <div className={styles.reportsIntro}>
                      <span className={styles.reportCardEyebrow}>
                        Generador de informes
                      </span>

                      <h3>Periodo del informe</h3>
                      <p>¿Qué actividad quieres analizar?</p>
                    </div>

                    <div className={styles.reportBusinessCount}>
                      <strong>{summary.active}</strong>
                      <span>
                        {summary.active === 1
                          ? "negocio activo"
                          : "negocios activos"}
                      </span>
                    </div>
                  </div>

                  <div className={styles.reportPeriodButtons}>
                    <button
                      type="button"
                      className={
                        reportPeriod === "last7"
                          ? styles.reportPeriodButtonActive
                          : styles.reportPeriodButton
                      }
                      onClick={() => handleReportPeriodChange("last7")}
                      disabled={generatingReports}
                    >
                      <span>Últimos 7 días</span>
                    </button>

                    <button
                      type="button"
                      className={
                        reportPeriod === "last30"
                          ? styles.reportPeriodButtonActive
                          : styles.reportPeriodButton
                      }
                      onClick={() => handleReportPeriodChange("last30")}
                      disabled={generatingReports}
                    >
                      <span>Últimos 30 días</span>
                    </button>

                    <button
                      type="button"
                      className={
                        reportPeriod === "thisMonth"
                          ? styles.reportPeriodButtonActive
                          : styles.reportPeriodButton
                      }
                      onClick={() => handleReportPeriodChange("thisMonth")}
                      disabled={generatingReports}
                    >
                      <span>Este mes</span>
                    </button>

                    <button
                      type="button"
                      className={
                        reportPeriod === "previousMonth"
                          ? styles.reportPeriodButtonActive
                          : styles.reportPeriodButton
                      }
                      onClick={() => handleReportPeriodChange("previousMonth")}
                      disabled={generatingReports}
                    >
                      <span>Mes anterior</span>
                    </button>

                    <button
                      type="button"
                      className={
                        reportPeriod === "custom"
                          ? styles.reportPeriodButtonActive
                          : styles.reportPeriodButton
                      }
                      onClick={() => handleReportPeriodChange("custom")}
                      disabled={generatingReports}
                    >
                      <span>Personalizado</span>
                    </button>
                  </div>

                  <div className={styles.reportDateArea}>
                    <div className={styles.reportDateField}>
                      <label htmlFor="reports-from">Desde</label>

                      <input
                        id="reports-from"
                        type="date"
                        value={reportFrom}
                        onChange={(event) => {
                          setReportPeriod("custom");
                          setReportFrom(event.target.value);
                          setReportError("");
                          setReportSuccess("");
                        }}
                        disabled={generatingReports}
                      />
                    </div>

                    <div className={styles.reportDateSeparator}>
                      <ArrowIcon />
                    </div>

                    <div className={styles.reportDateField}>
                      <label htmlFor="reports-to">Hasta</label>

                      <input
                        id="reports-to"
                        type="date"
                        value={reportTo}
                        onChange={(event) => {
                          setReportPeriod("custom");
                          setReportTo(event.target.value);
                          setReportError("");
                          setReportSuccess("");
                        }}
                        disabled={generatingReports}
                      />
                    </div>

                    <button
                      type="button"
                      className={styles.reportGenerateButton}
                      onClick={handleGenerateReports}
                      disabled={
                        generatingReports ||
                        !reportFrom ||
                        !reportTo ||
                        summary.active === 0
                      }
                    >
                      {generatingReports ? (
                        <>
                          <span className={styles.spinner} />
                          <span>Generando...</span>
                        </>
                      ) : (
                        <>
                          <AddDocumentIcon />
                          <span>Generar informes</span>
                          <ArrowIcon />
                        </>
                      )}
                    </button>
                  </div>

                  <div className={styles.reportOutput}>
                    <div className={styles.reportOutputIcon}>
                      <DocumentIcon />
                    </div>

                    <div className={styles.reportOutputText}>
                      <strong>Se generará un informe por negocio</strong>

                      <span>
                        {summary.active === 0
                          ? "Crea o reactiva un negocio para comenzar."
                          : `${summary.active
                          } negocio${summary.active === 1 ? "" : "s"} activo${summary.active === 1 ? "" : "s"
                          } · un PDF individual por cada uno · un único ZIP para descargar.`}
                      </span>
                    </div>

                    <div className={styles.reportOutputBadge}>ZIP</div>
                  </div>

                  {reportError && (
                    <div className={styles.formError}>
                      <AlertIcon />
                      <span>{reportError}</span>
                    </div>
                  )}

                  {reportSuccess && (
                    <div className={styles.formSuccess}>
                      <span className={styles.successCheck}>✓</span>
                      <span>{reportSuccess}</span>
                    </div>
                  )}
                </div>
              </section>
            )}

            {/* HISTORIAL DE INFORMES */}
            {section === "archivo" && (
              <section className={styles.reportsSection}>
                <div className={styles.sectionHeading}>
                  <div className={styles.sectionHeadingMain}>
                    <div className={styles.sectionIcon}>
                      <HistoryIcon />
                    </div>

                    <div>
                      <span className={styles.sectionLabel}>Archivo</span>
                      <h2>Historial de informes</h2>
                      <p>
                        Consulta los informes anteriores y descarga de nuevo los ZIP
                        que ya hayas generado.
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    className={styles.secondaryAction}
                    onClick={loadReportHistory}
                    disabled={reportHistoryLoading}
                  >
                    <RefreshIcon />
                    <span>
                      {reportHistoryLoading ? "Actualizando..." : "Actualizar"}
                    </span>
                  </button>
                </div>

                <div className={styles.reportsCard}>
                  {reportHistoryError && (
                    <div className={styles.formError}>
                      <AlertIcon />
                      <span>{reportHistoryError}</span>
                    </div>
                  )}

                  {reportHistoryLoading && reportHistory.length === 0 ? (
                    <div className={styles.activityEmpty}>
                      <span className={styles.spinner} />
                      <p>Cargando historial...</p>
                    </div>
                  ) : reportHistory.length === 0 ? (
                    <div className={styles.activityEmpty}>
                      <SearchDocumentIcon />
                      <p>Aún no hay informes guardados.</p>
                      <span>
                        Cuando generes un informe, aparecerá aquí si se ha guardado
                        correctamente.
                      </span>
                    </div>
                  ) : (
                    <div>
                      {reportHistory.map((report) => {
                        const completed = report.status === "completed";

                        const reportTypeLabel =
                          report.reportType === "collective"
                            ? "Informe colectivo"
                            : "Informe individual";

                        return (
                          <div className={styles.reportOutput} key={report.id}>
                            <div className={styles.reportOutputIcon}>
                              <DocumentIcon />
                            </div>

                            <div className={styles.reportOutputText}>
                              <strong>
                                {report.fileName || reportTypeLabel}
                              </strong>

                              <span>{reportTypeLabel}</span>

                              <span>
                                Periodo: {formatDate(report.periodFrom)} –{" "}
                                {formatDate(report.periodTo)}
                              </span>

                              <span>
                                Generado: {formatDate(report.createdAt)} ·{" "}
                                {formatNumber(report.businessCount)}{" "}
                                {report.businessCount === 1 ? "negocio" : "negocios"}{" "}
                                · {formatFileSize(report.fileSize)}
                              </span>

                              {!completed && (
                                <span>
                                  {report.errorMessage ||
                                    "La generación no se completó correctamente."}
                                </span>
                              )}
                            </div>

                            <div className={styles.reportOutputBadge}>
                              {completed ? "ZIP" : "ERROR"}
                            </div>

                            <button
                              type="button"
                              className={styles.reportGenerateButton}
                              onClick={() => handleDownloadReport(report)}
                              disabled={
                                !completed ||
                                !report.fileName ||
                                downloadingReportId !== null
                              }
                            >
                              {downloadingReportId === report.id ? (
                                "Descargando..."
                              ) : (
                                <>
                                  <DownloadIcon />
                                  <span>Descargar</span>
                                </>
                              )}
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </section>
            )}

            {/* DIRECTORIO DE NEGOCIOS */}
            {section === "negocios" && (
              <section className={styles.businessSection}>
                <div className={styles.sectionHeading}>
                  <div className={styles.sectionHeadingMain}>
                    <div className={styles.sectionIcon}>
                      <StoreIcon />
                    </div>

                    <div>
                      <span className={styles.sectionLabel}>Directorio</span>

                      <h2>Mis negocios</h2>

                      <p>
                        {summary.total} negocio{summary.total === 1 ? "" : "s"}{" "}
                        registrado{summary.total === 1 ? "" : "s"} en TOCA.
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    className={styles.secondaryAction}
                    onClick={startCreating}
                  >
                    <PlusIcon />
                    <span>Nuevo negocio</span>
                  </button>
                </div>

                {success && (
                  <div className={styles.formSuccess}>
                    <span className={styles.successCheck}>✓</span>
                    <span>{success}</span>
                  </div>
                )}

                {error && !formOpen && (
                  <div className={styles.formError}>
                    <AlertIcon />
                    <span>{error}</span>
                  </div>
                )}

                <div className={styles.businessTools}>
                  <div className={styles.searchBox}>
                    <SearchIcon />

                    <input
                      type="search"
                      value={searchTerm}
                      onChange={(event) => setSearchTerm(event.target.value)}
                      placeholder="Buscar por nombre o slug..."
                      aria-label="Buscar negocio"
                    />
                  </div>

                  <div className={styles.filterGroup}>
                    <div className={styles.filterLabel}>
                      <FilterIcon />
                      <span>Mostrar</span>
                    </div>

                    <div className={styles.filterButtons}>
                      <button
                        type="button"
                        className={
                          statusFilter === "all"
                            ? styles.filterButtonActive
                            : styles.filterButton
                        }
                        onClick={() => setStatusFilter("all")}
                      >
                        Todos
                        <span>{summary.total}</span>
                      </button>

                      <button
                        type="button"
                        className={
                          statusFilter === "active"
                            ? styles.filterButtonActive
                            : styles.filterButton
                        }
                        onClick={() => setStatusFilter("active")}
                      >
                        Activos
                        <span>{summary.active}</span>
                      </button>

                      <button
                        type="button"
                        className={
                          statusFilter === "inactive"
                            ? styles.filterButtonActive
                            : styles.filterButton
                        }
                        onClick={() => setStatusFilter("inactive")}
                      >
                        Inactivos
                        <span>{summary.inactive}</span>
                      </button>
                    </div>
                  </div>
                </div>

                {businesses.length === 0 ? (
                  <div className={styles.empty}>
                    <div className={styles.emptyIcon}>
                      <StoreIcon />
                    </div>

                    <h3>No hay negocios registrados</h3>

                    <p>
                      Crea el primer negocio para comenzar a utilizar TOCA.
                    </p>

                    <button
                      type="button"
                      className={styles.primaryButton}
                      onClick={startCreating}
                    >
                      <PlusIcon />
                      Crear negocio
                    </button>
                  </div>
                ) : filteredBusinesses.length === 0 ? (
                  <div className={styles.empty}>
                    <div className={styles.emptyIcon}>
                      <SearchIcon />
                    </div>

                    <h3>No hay resultados</h3>

                    <p>
                      No hay negocios que coincidan con la búsqueda o el filtro
                      seleccionado.
                    </p>

                    <button
                      type="button"
                      className={styles.secondaryAction}
                      onClick={() => {
                        setSearchTerm("");
                        setStatusFilter("all");
                      }}
                    >
                      Limpiar filtros
                    </button>
                  </div>
                ) : (
                  <div className={styles.businessList}>
                    {filteredBusinesses.map((business) => {
                      const stats = statsByBusiness[business.id] || {
                        visits: 0,
                        googleClicks: 0,
                        lastActivity: null,
                      };

                      return (
                        <article
                          className={`${styles.business} ${!business.active ? styles.businessInactive : ""
                            }`}
                          key={business.id}
                        >
                          <div className={styles.businessMain}>
                            <div className={styles.businessIdentity}>
                              <div className={styles.businessAvatar}>
                                {business.logoUrl ? (
                                  <Image
                                    src={business.logoUrl}
                                    alt=""
                                    width={48}
                                    height={48}
                                  />
                                ) : (
                                  <StoreIcon />
                                )}
                              </div>

                              <div className={styles.businessInfo}>
                                <span
                                  className={`${styles.businessStatus} ${!business.active
                                    ? styles.businessStatusInactive
                                    : ""
                                    }`}
                                >
                                  {business.active
                                    ? "Negocio activo"
                                    : "Negocio inactivo"}
                                </span>

                                <h3>{business.name}</h3>

                                <span className={styles.businessSlug}>
                                  /{business.slug}
                                </span>
                              </div>
                            </div>

                            <div className={styles.businessMeta}>
                              <div>
                                <span>Visitas</span>
                                <strong>{formatNumber(stats.visits)}</strong>
                              </div>

                              <div>
                                <span>Interacciones</span>
                                <strong>{formatNumber(stats.googleClicks)}</strong>
                              </div>

                              <div>
                                <span>Última actividad</span>
                                <strong>{formatDate(stats.lastActivity)}</strong>
                              </div>

                              <div>
                                <span>Creado</span>
                                <strong>
                                  {formatCreatedDate(business.createdAt)}
                                </strong>
                              </div>
                            </div>
                          </div>

                          <div className={styles.businessActions}>
                            {business.active && (
                              <a
                                href={`/${business.slug}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className={`${styles.actionButton} ${styles.actionPrimary}`}
                              >
                                <ExternalIcon />
                                <span>Ver página</span>
                              </a>
                            )}

                            <a
                              href={`/estadisticas/${business.slug}`}
                              className={styles.actionButton}
                            >
                              <ChartIcon />
                              <span>Estadísticas</span>
                            </a>

                            {business.active && (
                              <button
                                type="button"
                                className={styles.actionButton}
                                onClick={() => startEditing(business)}
                              >
                                <EditIcon />
                                <span>Editar</span>
                              </button>
                            )}

                            {business.active ? (
                              <button
                                type="button"
                                className={`${styles.actionButton} ${styles.actionDanger}`}
                                onClick={() =>
                                  deactivateBusiness(business.id, business.name)
                                }
                                disabled={
                                  quickDeletingId === business.id ||
                                  activatingId !== null
                                }
                              >
                                <TrashIcon />
                                <span>
                                  {quickDeletingId === business.id
                                    ? "Desactivando..."
                                    : "Desactivar"}
                                </span>
                              </button>
                            ) : (
                              <button
                                type="button"
                                className={`${styles.actionButton} ${styles.actionReactivate}`}
                                onClick={() =>
                                  activateBusiness(business.id, business.name)
                                }
                                disabled={
                                  activatingId === business.id ||
                                  quickDeletingId !== null ||
                                  deleting
                                }
                              >
                                <ActivateIcon />
                                <span>
                                  {activatingId === business.id
                                    ? "Reactivando..."
                                    : "Reactivar"}
                                </span>
                              </button>
                            )}
                          </div>
                        </article>
                      );
                    })}
                  </div>
                )}
              </section>
            )}

            {/* FORMULARIO DE NEGOCIO */}
            {section === "negocios" && formOpen && (
              <section className={styles.formSection}>
                <div className={styles.sectionHeading}>
                  <div className={styles.sectionHeadingMain}>
                    <div className={styles.sectionIcon}>
                      {editingId ? <EditIcon /> : <PlusIcon />}
                    </div>

                    <div>
                      <span className={styles.sectionLabel}>
                        {editingId ? "Configuración" : "Nuevo registro"}
                      </span>

                      <h2>
                        {editingId ? "Editar negocio" : "Añadir negocio"}
                      </h2>

                      <p>
                        {editingId
                          ? "Modifica los datos asociados a este negocio."
                          : "Crea una nueva página para un negocio de TOCA."}
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    className={styles.cancelButton}
                    onClick={closeForm}
                    disabled={saving || deleting}
                  >
                    Cancelar
                  </button>
                </div>

                <form className={styles.form} onSubmit={handleSubmit}>
                  <div className={styles.formGrid}>
                    <div className={styles.field}>
                      <label htmlFor="business-name">Nombre del negocio</label>

                      <input
                        id="business-name"
                        type="text"
                        value={form.name}
                        onChange={(event) =>
                          handleNameChange(event.target.value)
                        }
                        placeholder="Ej. Bar Pepe"
                        required
                      />
                    </div>

                    <div className={styles.field}>
                      <label htmlFor="business-slug">Slug</label>

                      <input
                        id="business-slug"
                        type="text"
                        value={form.slug}
                        onChange={(event) =>
                          setForm((current) => ({
                            ...current,
                            slug: createSlug(event.target.value),
                          }))
                        }
                        placeholder="bar-pepe"
                        required
                      />

                      <span className={styles.help}>
                        URL pública: <strong>/{form.slug || "..."}</strong>
                      </span>
                    </div>

                    <div className={styles.fieldFull}>
                      <label htmlFor="google-review-url">
                        URL de reseñas de Google
                      </label>

                      <input
                        id="google-review-url"
                        type="url"
                        value={form.googleReviewUrl}
                        onChange={(event) =>
                          setForm((current) => ({
                            ...current,
                            googleReviewUrl: event.target.value,
                          }))
                        }
                        placeholder="https://g.page/r/..."
                        required
                      />

                      <span className={styles.help}>
                        Enlace al formulario de reseña del negocio en Google.
                      </span>
                    </div>

                    <div className={styles.fieldFull}>
                      <label htmlFor="logo-url">
                        URL del logo
                        <span className={styles.optional}> · opcional</span>
                      </label>

                      <input
                        id="logo-url"
                        type="url"
                        value={form.logoUrl}
                        onChange={(event) =>
                          setForm((current) => ({
                            ...current,
                            logoUrl: event.target.value,
                          }))
                        }
                        placeholder="https://..."
                      />
                    </div>
                  </div>

                  {error && (
                    <div className={styles.formError}>
                      <AlertIcon />
                      <span>{error}</span>
                    </div>
                  )}

                  {editingId && (
                    <div className={styles.dangerZone}>
                      <div className={styles.dangerText}>
                        <strong>Zona de peligro</strong>

                        <span>
                          Desactiva este negocio y retira su página pública. Sus
                          estadísticas se conservarán.
                        </span>
                      </div>

                      <button
                        type="button"
                        onClick={handleDelete}
                        disabled={saving || deleting}
                        className={styles.deleteButton}
                      >
                        <TrashIcon />
                        {deleting ? "Desactivando..." : "Desactivar negocio"}
                      </button>
                    </div>
                  )}

                  <div className={styles.formActions}>
                    <button
                      type="button"
                      className={styles.cancelFormButton}
                      onClick={closeForm}
                      disabled={saving || deleting}
                    >
                      Cancelar
                    </button>

                    <button
                      type="submit"
                      className={styles.primaryButton}
                      disabled={saving || deleting}
                    >
                      {saving
                        ? "Guardando..."
                        : editingId
                          ? "Guardar cambios"
                          : "Crear negocio"}

                      {!saving && !deleting && <ArrowIcon />}
                    </button>
                  </div>
                </form>
              </section>
            )}
          </div>
        </div>
        <footer className={styles.footer}>
          <Image
            src="/logo/toca.svg"
            alt="TOCA"
            width={70}
            height={28}
          />

          <p>Todo tu negocio. En un toque.</p>
        </footer>
      </div>

      {logoutConfirmOpen && (
        <div className={styles.logoutModalOverlay} role="presentation">
          <div
            className={styles.logoutModal}
            role="dialog"
            aria-modal="true"
            aria-labelledby="logout-modal-title"
            aria-describedby="logout-modal-description"
          >
            <div className={styles.logoutModalIcon}>
              <LockIcon />
            </div>

            <span className={styles.logoutModalLabel}>Cerrar sesión</span>

            <h2 id="logout-modal-title">¿Quieres cerrar sesión?</h2>

            <p id="logout-modal-description">
              Tendrás que volver a introducir la contraseña para acceder al
              panel de gestión de TOCA.
            </p>

            <div className={styles.logoutModalActions}>
              <button
                type="button"
                className={styles.logoutCancelButton}
                onClick={() => setLogoutConfirmOpen(false)}
              >
                Cancelar
              </button>

              <button
                type="button"
                className={styles.logoutConfirmButton}
                onClick={handleLogout}
              >
                Cerrar sesión
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}