"use client";

import { FormEvent, useCallback, useEffect, useRef, useState } from "react";
import styles from "./GestionClientesPanel.module.css";

function ClientsIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M16 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
      <circle cx="10" cy="7" r="4" />
      <path d="M20 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  );
}

function EditIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
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

type SubscriptionStatus = "undecided" | "active" | "inactive" | "cancelled";

type Client = {
  id: string;
  contactName: string;
  businessName: string;
  phone: string | null;
  email: string | null;
  createdAt: string;
  wantsEmailAlerts: boolean | number;
  wantsStatistics: boolean | number;
  subscriptionStatus: SubscriptionStatus;
  notes: string | null;
  archivedAt: string | null;
  updatedAt: string;
};

type ClientForm = {
  contactName: string;
  businessName: string;
  phone: string;
  email: string;
  wantsEmailAlerts: boolean;
  wantsStatistics: boolean;
  subscriptionStatus: SubscriptionStatus;
  notes: string;
};

const emptyForm: ClientForm = {
  contactName: "",
  businessName: "",
  phone: "",
  email: "",
  wantsEmailAlerts: false,
  wantsStatistics: false,
  subscriptionStatus: "undecided",
  notes: "",
};

const statusLabels: Record<SubscriptionStatus, string> = {
  undecided: "Por decidir",
  active: "Activo",
  inactive: "Inactivo",
  cancelled: "Cancelado",
};

function toForm(client: Client): ClientForm {
  return {
    contactName: client.contactName,
    businessName: client.businessName,
    phone: client.phone ?? "",
    email: client.email ?? "",
    wantsEmailAlerts: Boolean(client.wantsEmailAlerts),
    wantsStatistics: Boolean(client.wantsStatistics),
    subscriptionStatus: client.subscriptionStatus,
    notes: client.notes ?? "",
  };
}

async function readError(response: Response): Promise<string> {
  try {
    const data: unknown = await response.json();

    if (
      typeof data === "object" &&
      data !== null &&
      "error" in data &&
      typeof data.error === "string"
    ) {
      return data.error;
    }

    return "Ha ocurrido un error.";
  } catch {
    return "No se ha podido interpretar la respuesta del servidor.";
  }
}

export default function GestionClientesPanel() {
  const [clients, setClients] = useState<Client[]>([]);
  const [query, setQuery] = useState("");
  const [archiveFilter, setArchiveFilter] = useState<"active" | "archived" | "all">("active");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const [form, setForm] = useState<ClientForm>(emptyForm);

  const loadClients = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const params = new URLSearchParams();
      if (query.trim()) params.set("q", query.trim());
      params.set("archive", archiveFilter);

      const response = await fetch(`/api/gestion/clientes?${params.toString()}`, {
        cache: "no-store",
      });

      if (!response.ok) {
        throw new Error(await readError(response));
      }

      const data = (await response.json()) as { clients?: Client[] };
      setClients(Array.isArray(data.clients) ? data.clients : []);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "No se han podido cargar los clientes.");
    } finally {
      setLoading(false);
    }
  }, [query, archiveFilter]);

  useEffect(() => {
    void loadClients();
  }, [loadClients]);

  function startCreate() {
    setEditingId(null);
    setForm(emptyForm);
    setError("");
    setNotice("");
    setFormOpen(true);
    scrollToForm();
  }

  function startEdit(client: Client) {
    setEditingId(client.id);
    setForm(toForm(client));
    setError("");
    setNotice("");
    setFormOpen(true);
    scrollToForm();
  }

  function scrollToForm() {
    window.setTimeout(() => {
      const formElement = formRef.current;

      if (formElement) {
        const top =
          formElement.getBoundingClientRect().top + window.scrollY - 18;

        window.scrollTo({
          top,
          behavior: "smooth",
        });
      }
    }, 50);
  }

  function updateField<K extends keyof ClientForm>(key: K, value: ClientForm[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  async function submitForm(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError("");
    setNotice("");

    try {
      const response = await fetch("/api/gestion/clientes", {
        method: editingId ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editingId ? { ...form, id: editingId } : form),
      });

      if (!response.ok) throw new Error(await readError(response));

      setFormOpen(false);
      setEditingId(null);
      setForm(emptyForm);
      setNotice(editingId ? "Cliente actualizado correctamente." : "Cliente creado correctamente.");
      await loadClients();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "No se ha podido guardar el cliente.");
    } finally {
      setSaving(false);
    }
  }

  async function toggleArchive(client: Client) {
    const action = client.archivedAt ? "restore" : "archive";
    const message = client.archivedAt
      ? `¿Quieres restaurar a ${client.businessName}?`
      : `¿Quieres archivar a ${client.businessName}?`;

    if (!window.confirm(message)) return;

    setError("");
    setNotice("");

    try {
      const response = await fetch("/api/gestion/clientes", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: client.id, action }),
      });

      if (!response.ok) throw new Error(await readError(response));

      setNotice(action === "archive" ? "Cliente archivado." : "Cliente restaurado.");
      await loadClients();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "No se ha podido actualizar el cliente.");
    }
  }

  return (
    <section className={styles.panel}>
      <div className={styles.sectionHeading}>
        <div className={styles.sectionHeadingMain}>
          <div className={styles.sectionIcon}>
            <ClientsIcon />
          </div>
          <div>
            <span className={styles.eyebrow}>GESTIÓN COMERCIAL</span>
            <h2>Clientes</h2>
            <p>Organiza los contactos, sus preferencias y el estado de mantenimiento de TOCA.</p>
          </div>
        </div>

        <button
          type="button"
          className={styles.primaryButton}
          onClick={startCreate}
        >
          <span aria-hidden="true">+</span>
          Nuevo cliente
        </button>
      </div>

      <div className={styles.toolbar}>
        <label className={styles.searchLabel}>
          <span>Buscar clientes</span>
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Nombre, negocio o contacto…"
          />
        </label>

        <div className={styles.archiveFilters} role="group" aria-label="Filtrar clientes por estado de archivo">
          <button
            type="button"
            className={archiveFilter === "active" ? styles.filterActive : styles.filterButton}
            aria-pressed={archiveFilter === "active"}
            onClick={() => setArchiveFilter("active")}
          >
            Activos
          </button>
          <button
            type="button"
            className={archiveFilter === "archived" ? styles.filterActive : styles.filterButton}
            aria-pressed={archiveFilter === "archived"}
            onClick={() => setArchiveFilter("archived")}
          >
            Archivados
          </button>
          <button
            type="button"
            className={archiveFilter === "all" ? styles.filterActive : styles.filterButton}
            aria-pressed={archiveFilter === "all"}
            onClick={() => setArchiveFilter("all")}
          >
            Todos
          </button>
        </div>

        <button type="button" className={styles.secondaryButton} onClick={() => void loadClients()}>
          Actualizar
        </button>
      </div>

      {error && <p className={styles.error} role="alert">{error}</p>}
      {notice && <p className={styles.notice} role="status">{notice}</p>}

      {formOpen && (
        <form
          ref={formRef}
          className={styles.formCard}
          onSubmit={submitForm}
        >
          <div className={styles.formHeading}>
            <div className={styles.sectionHeadingMain}>
              <div className={styles.sectionIcon}>
                {editingId ? <EditIcon /> : <ClientsIcon />}
              </div>

              <div>
                <span className={styles.eyebrow}>
                  {editingId ? "CONFIGURACIÓN" : "GESTIÓN COMERCIAL"}
                </span>

                <h3>{editingId ? "Editar cliente" : "Añadir cliente"}</h3>

                <p className={styles.formDescription}>
                  {editingId
                    ? "Modifica los datos y las preferencias de este cliente."
                    : "Registra un contacto para organizar la gestión comercial de TOCA."}
                </p>
              </div>
            </div>

            <button
              type="button"
              className={styles.closeButton}
              onClick={() => setFormOpen(false)}
              aria-label="Cerrar formulario"
            >
              ×
            </button>
          </div>

          <div className={styles.formGrid}>
            <label>
              Nombre del contacto *
              <input
                required
                maxLength={150}
                value={form.contactName}
                onChange={(event) => updateField("contactName", event.target.value)}
                autoComplete="name"
              />
            </label>

            <label>
              Nombre del negocio *
              <input
                required
                maxLength={150}
                value={form.businessName}
                onChange={(event) => updateField("businessName", event.target.value)}
              />
            </label>

            <label>
              Teléfono
              <input
                type="tel"
                maxLength={40}
                value={form.phone}
                onChange={(event) => updateField("phone", event.target.value)}
                autoComplete="tel"
              />
            </label>

            <label>
              Email
              <input
                type="email"
                maxLength={254}
                value={form.email}
                onChange={(event) => updateField("email", event.target.value)}
                autoComplete="email"
              />
            </label>

            <label>
              Estado del mantenimiento
              <select
                value={form.subscriptionStatus}
                onChange={(event) => updateField("subscriptionStatus", event.target.value as SubscriptionStatus)}
              >
                <option value="undecided">Por decidir</option>
                <option value="active">Activo</option>
                <option value="inactive">Inactivo</option>
                <option value="cancelled">Cancelado</option>
              </select>
            </label>

            <div className={styles.preferences}>
              <label>
                <input
                  type="checkbox"
                  checked={form.wantsEmailAlerts}
                  onChange={(event) => updateField("wantsEmailAlerts", event.target.checked)}
                />
                Quiere recibir avisos por email
              </label>

              <label>
                <input
                  type="checkbox"
                  checked={form.wantsStatistics}
                  onChange={(event) => updateField("wantsStatistics", event.target.checked)}
                />
                Quiere recibir estadísticas
              </label>
            </div>

            <label className={styles.fullWidth}>
              Notas internas
              <textarea
                rows={4}
                maxLength={5000}
                value={form.notes}
                onChange={(event) => updateField("notes", event.target.value)}
                placeholder="Información comercial relevante…"
              />
            </label>
          </div>

          <div className={styles.formActions}>
            <button type="button" className={styles.secondaryButton} onClick={() => setFormOpen(false)}>
              Cancelar
            </button>
            <button type="submit" className={styles.primaryButton} disabled={saving}>
              {saving ? "Guardando…" : editingId ? "Guardar cambios" : "Crear cliente"}
            </button>
          </div>
        </form>
      )}

      <div className={styles.listHeader}>
        <h3>
          {archiveFilter === "active"
            ? "Clientes activos"
            : archiveFilter === "archived"
              ? "Clientes archivados"
              : "Todos los clientes"}
        </h3>
        <span>{clients.length} {clients.length === 1 ? "cliente" : "clientes"}</span>
      </div>

      {loading ? (
        <div className={styles.emptyState}>Cargando clientes…</div>
      ) : clients.length === 0 ? (
        <div className={styles.emptyState}>
          <strong>
            {query.trim()
              ? "No hay coincidencias"
              : archiveFilter === "archived"
                ? "No hay clientes archivados"
                : archiveFilter === "active" && clients.length === 0
                  ? "Todavía no hay clientes activos"
                  : "Todavía no hay clientes"}
          </strong>

          <p>
            {query.trim()
              ? "Prueba con otro nombre o negocio."
              : archiveFilter === "archived"
                ? "Cuando archives un cliente, aparecerá aquí para que puedas restaurarlo."
                : archiveFilter === "all"
                  ? "Añade tu primer cliente para empezar a organizar la gestión comercial."
                  : "Puedes crear un cliente para empezar a organizar la gestión comercial."}
          </p>

          {!query.trim() && archiveFilter !== "archived" && (
            <button
              type="button"
              className={styles.primaryButton}
              onClick={startCreate}
            >
              Crear primer cliente
            </button>
          )}
        </div>
      ) : (
        <div className={styles.clientList}>
          {clients.map((client) => (
            <article className={styles.clientCard} key={client.id}>
              <div className={styles.clientMain}>
                <div className={styles.avatar} aria-hidden="true">
                  {client.businessName.trim().charAt(0).toUpperCase() || "T"}
                </div>

                <div className={styles.clientInfo}>
                  <h4>{client.businessName}</h4>
                  <p className={styles.contactName}>{client.contactName}</p>

                  <div className={styles.contactDetails}>
                    {client.phone && <span>{client.phone}</span>}
                    {client.email && <span>{client.email}</span>}
                  </div>
                </div>
              </div>

              <div className={styles.clientMeta}>
                <span className={`${styles.status} ${styles[client.subscriptionStatus]}`}>
                  {statusLabels[client.subscriptionStatus] ?? "Por decidir"}
                </span>

                {client.archivedAt && archiveFilter === "all" && (
                  <span className={styles.archivedBadge}>Archivado</span>
                )}

                <span className={styles.preferenceText}>
                  {Boolean(client.wantsEmailAlerts) ? "Avisos email" : "Sin avisos email"}
                  {" · "}
                  {Boolean(client.wantsStatistics) ? "Con estadísticas" : "Sin estadísticas"}
                </span>
              </div>

              {client.notes && <p className={styles.notes}>{client.notes}</p>}

              <div className={styles.cardActions}>
                {!client.archivedAt && (
                  <button
                    type="button"
                    className={styles.secondaryButton}
                    onClick={() => startEdit(client)}
                  >
                    Editar
                  </button>
                )}

                <button
                  type="button"
                  className={styles.textButton}
                  onClick={() => void toggleArchive(client)}
                >
                  {client.archivedAt ? "Restaurar" : "Archivar"}
                </button>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}