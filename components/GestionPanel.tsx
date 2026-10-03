"use client";

import { FormEvent, useEffect, useState } from "react";
import Image from "next/image";

import styles from "./GestionPanel.module.css";

type Business = {
  id: string;
  name: string;
  slug: string;
  googleReviewUrl: string;
  logoUrl?: string;
};

type BusinessForm = {
  name: string;
  slug: string;
  googleReviewUrl: string;
  logoUrl: string;
};

type BusinessesResponse = {
  businesses?: Business[];
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

const emptyForm: BusinessForm = {
  name: "",
  slug: "",
  googleReviewUrl: "",
  logoUrl: "",
};

function createSlug(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

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

function ChartIcon() {
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
      <path d="M4 19V5" />
      <path d="M4 19h17" />
      <path d="m7 15 4-4 3 2 5-6" />
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
      strokeLinecap="round"
      strokeLinejoin="round"
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

export default function GestionPanel() {
  const [authenticated, setAuthenticated] = useState<boolean | null>(
    null
  );

  const [password, setPassword] = useState("");

  const [businesses, setBusinesses] = useState<Business[]>([]);

  const [form, setForm] = useState<BusinessForm>(emptyForm);

  const [editingId, setEditingId] = useState<string | null>(null);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [loginError, setLoginError] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

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
        setError(
          data.error || "No se pudieron cargar los negocios."
        );
        return;
      }

      setBusinesses(data.businesses || []);
    } catch {
      setError("No se pudieron cargar los negocios.");
    }
  }

  useEffect(() => {
    checkAuthentication();
  }, []);

  useEffect(() => {
    if (authenticated) {
      loadBusinesses();
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
        setLoginError(
          data.error || "La contraseña no es correcta."
        );
        return;
      }

      setPassword("");
      setAuthenticated(true);
    } catch {
      setLoginError("No se pudo iniciar sesión.");
    }
  }

  function startCreating() {
    setEditingId(null);
    setForm(emptyForm);
    setError("");
    setSuccess("");

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }

  function startEditing(business: Business) {
    setEditingId(business.id);

    setForm({
      name: business.name,
      slug: business.slug,
      googleReviewUrl: business.googleReviewUrl,
      logoUrl: business.logoUrl || "",
    });

    setError("");
    setSuccess("");

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }

  function handleNameChange(value: string) {
    setForm((current) => ({
      ...current,
      name: value,
      slug:
        editingId || current.slug
          ? current.slug
          : createSlug(value),
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
        setError(
          data.error || "No se pudo guardar el negocio."
        );
        return;
      }

      setSuccess(
        editingId
          ? "Negocio actualizado correctamente."
          : "Negocio creado correctamente."
      );

      setForm(emptyForm);
      setEditingId(null);

      await loadBusinesses();
    } catch {
      setError("No se pudo guardar el negocio.");
    } finally {
      setSaving(false);
    }
  }

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

            <span className={styles.loginLabel}>
              Área privada
            </span>

            <h1>Gestión de TOCA</h1>

            <p className={styles.loginDescription}>
              Accede al panel para administrar los negocios
              conectados a TOCA.
            </p>

            <form
              className={styles.loginForm}
              onSubmit={handleLogin}
            >
              <label htmlFor="password">Contraseña</label>

              <input
                id="password"
                type="password"
                value={password}
                onChange={(event) =>
                  setPassword(event.target.value)
                }
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

              <button
                type="submit"
                className={styles.loginButton}
              >
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
            <div>
              <span className={styles.eyebrow}>
                Panel de administración
              </span>

              <h1>Gestión de negocios</h1>

              <p>
                Administra los negocios conectados a TOCA y
                configura sus páginas.
              </p>
            </div>

            <a href="/" className={styles.backButton}>
              <span>Ir al inicio</span>
              <ExternalIcon />
            </a>
          </div>
        </header>

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
                  {editingId
                    ? "Editar negocio"
                    : "Añadir negocio"}
                </h2>

                <p>
                  {editingId
                    ? "Modifica los datos asociados a este negocio."
                    : "Crea una nueva página para un negocio de TOCA."}
                </p>
              </div>
            </div>

            {editingId && (
              <button
                type="button"
                className={styles.cancelButton}
                onClick={startCreating}
              >
                Cancelar edición
              </button>
            )}
          </div>

          <form
            className={styles.form}
            onSubmit={handleSubmit}
          >
            <div className={styles.formGrid}>
              <div className={styles.field}>
                <label htmlFor="business-name">
                  Nombre del negocio
                </label>

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
                <label htmlFor="business-slug">
                  Slug
                </label>

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
                  URL pública:{" "}
                  <strong>/{form.slug || "..."}</strong>
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
                  Enlace al formulario de reseña del negocio en
                  Google.
                </span>
              </div>

              <div className={styles.fieldFull}>
                <label htmlFor="logo-url">
                  URL del logo
                  <span className={styles.optional}>
                    {" "}
                    · opcional
                  </span>
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

            {success && (
              <div className={styles.formSuccess}>
                <span className={styles.successCheck}>✓</span>
                <span>{success}</span>
              </div>
            )}

            <div className={styles.formActions}>
              <button
                type="submit"
                className={styles.primaryButton}
                disabled={saving}
              >
                {saving
                  ? "Guardando..."
                  : editingId
                    ? "Guardar cambios"
                    : "Crear negocio"}

                {!saving && <ArrowIcon />}
              </button>
            </div>
          </form>
        </section>

        <section className={styles.businessSection}>
          <div className={styles.sectionHeading}>
            <div className={styles.sectionHeadingMain}>
              <div className={styles.sectionIcon}>
                <StoreIcon />
              </div>

              <div>
                <span className={styles.sectionLabel}>
                  Directorio
                </span>

                <h2>Negocios</h2>

                <p>
                  {businesses.length} negocio
                  {businesses.length === 1 ? "" : "s"} registrado
                  {businesses.length === 1 ? "" : "s"} en TOCA.
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

          {businesses.length === 0 ? (
            <div className={styles.empty}>
              <div className={styles.emptyIcon}>
                <StoreIcon />
              </div>

              <h3>No hay negocios registrados</h3>

              <p>
                Crea el primer negocio para comenzar a utilizar
                TOCA.
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
          ) : (
            <div className={styles.businessList}>
              {businesses.map((business) => (
                <article
                  className={styles.business}
                  key={business.id}
                >
                  <div className={styles.businessIdentity}>
                    <div className={styles.businessAvatar}>
                      {business.logoUrl ? (
                        <Image
                          src={business.logoUrl}
                          alt=""
                          width={44}
                          height={44}
                        />
                      ) : (
                        <StoreIcon />
                      )}
                    </div>

                    <div className={styles.businessInfo}>
                      <h3>{business.name}</h3>

                      <span>
                        /{business.slug}
                      </span>
                    </div>
                  </div>

                  <div className={styles.businessActions}>
                    <a
                      href={`/${business.slug}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={styles.actionButton}
                    >
                      <ExternalIcon />
                      <span>Ver página</span>
                    </a>

                    <a
                      href={`/estadisticas/${business.slug}`}
                      className={styles.actionButton}
                    >
                      <ChartIcon />
                      <span>Estadísticas</span>
                    </a>

                    <button
                      type="button"
                      className={styles.actionButton}
                      onClick={() => startEditing(business)}
                    >
                      <EditIcon />
                      <span>Editar</span>
                    </button>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>

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
    </main>
  );
}