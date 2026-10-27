"use client";

import { FormEvent, useCallback, useEffect, useRef, useState } from "react";
import styles from "./GestionClientesPanel.module.css";

function ClientsIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M16 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
      <circle cx="10" cy="7" r="4" />
      <path d="M20 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  );
}

function EditIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
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

type Purchase = {
  id: string;
  clientId: string;
  purchaseDate: string;
  product: string;
  version: string | null;
  units: number;
  unitPriceCents: number;
  notes: string | null;
  createdAt: string;
  subtotalCents: number;
};

type PurchaseForm = {
  purchaseDate: string;
  product: string;
  version: string;
  units: string;
  unitPrice: string;
  notes: string;
};

type PurchaseData = {
  purchases: Purchase[];
  totalCents: number;
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

function getToday(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function emptyPurchaseForm(): PurchaseForm {
  return {
    purchaseDate: getToday(),
    product: "",
    version: "",
    units: "1",
    unitPrice: "",
    notes: "",
  };
}

const euroFormatter = new Intl.NumberFormat("es-ES", {
  style: "currency",
  currency: "EUR",
});

function formatEuros(cents: number): string {
  return euroFormatter.format(cents / 100);
}

function formatDate(date: string): string {
  const parts = date.slice(0, 10).split("-");

  if (parts.length !== 3) return date;

  return `${parts[2]}/${parts[1]}/${parts[0]}`;
}

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

  const [expandedClients, setExpandedClients] = useState<string[]>([]);
  const [purchasesByClient, setPurchasesByClient] = useState<Record<string, PurchaseData>>({});
  const [purchaseLoading, setPurchaseLoading] = useState<Record<string, boolean>>({});
  const [purchaseForms, setPurchaseForms] = useState<Record<string, PurchaseForm>>({});
  const [editingPurchase, setEditingPurchase] = useState<Record<string, string | null>>({});
  const [purchaseSaving, setPurchaseSaving] = useState(false);
  const [purchaseErrors, setPurchaseErrors] = useState<Record<string, string>>({});
  const [purchaseNotices, setPurchaseNotices] = useState<Record<string, string>>({});

  // Referencias para desplazar la página al formulario de compra.
  const purchaseFormRefs = useRef<Record<string, HTMLFormElement | null>>({});
  const purchaseProductRefs = useRef<Record<string, HTMLInputElement | null>>({});

  // Controla si se muestran todas las compras de cada cliente.
  const [showAllPurchases, setShowAllPurchases] = useState<Record<string, boolean>>({});

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

      if (!response.ok) throw new Error(await readError(response));

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

  const loadPurchases = useCallback(async (clientId: string) => {
    setPurchaseLoading((current) => ({ ...current, [clientId]: true }));
    setPurchaseErrors((current) => ({ ...current, [clientId]: "" }));

    try {
      const response = await fetch(
        `/api/gestion/compras?clientId=${encodeURIComponent(clientId)}`,
        { cache: "no-store" }
      );

      if (!response.ok) throw new Error(await readError(response));

      const data = (await response.json()) as PurchaseData;

      const sortedPurchases = (
        Array.isArray(data.purchases) ? data.purchases : []
      ).slice().sort((a, b) => {
        const dateDifference = b.purchaseDate
          .slice(0, 10)
          .localeCompare(a.purchaseDate.slice(0, 10));

        if (dateDifference !== 0) return dateDifference;

        return b.createdAt.localeCompare(a.createdAt);
      });

      setPurchasesByClient((current) => ({
        ...current,
        [clientId]: {
          purchases: sortedPurchases,
          // El total procede de todas las compras, no de las visibles.
          totalCents: Number(data.totalCents) || 0,
        },
      }));
    } catch (cause) {
      setPurchaseErrors((current) => ({
        ...current,
        [clientId]: cause instanceof Error
          ? cause.message
          : "No se ha podido cargar el historial.",
      }));
    } finally {
      setPurchaseLoading((current) => ({ ...current, [clientId]: false }));
    }
  }, []);

  function togglePurchases(clientId: string) {
    const isExpanded = expandedClients.includes(clientId);

    if (isExpanded) {
      setExpandedClients((current) => current.filter((id) => id !== clientId));
      return;
    }

    setExpandedClients((current) => [...current, clientId]);

    if (!purchasesByClient[clientId]) {
      void loadPurchases(clientId);
    }
  }

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
        const top = formElement.getBoundingClientRect().top + window.scrollY - 18;

        window.scrollTo({ top, behavior: "smooth" });
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

      const wasEditing = Boolean(editingId);

      setFormOpen(false);
      setEditingId(null);
      setForm(emptyForm);
      setNotice(wasEditing ? "Cliente actualizado correctamente." : "Cliente creado correctamente.");

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

  function scrollToPurchaseForm(clientId: string) {
    window.setTimeout(() => {
      const formElement = purchaseFormRefs.current[clientId];
      const productInput = purchaseProductRefs.current[clientId];

      if (!formElement) return;

      const top =
        formElement.getBoundingClientRect().top + window.scrollY - 24;

      window.scrollTo({
        top,
        behavior: "smooth",
      });

      // El formulario ya está renderizado; enfocamos Producto al terminar
      // el desplazamiento para evitar que el navegador vuelva a mover la página.
      window.setTimeout(() => {
        purchaseProductRefs.current[clientId]?.focus({ preventScroll: true });
      }, 350);
    }, 100);
  }

  function startNewPurchase(clientId: string) {
    setPurchaseForms((current) => ({
      ...current,
      [clientId]: emptyPurchaseForm(),
    }));

    setEditingPurchase((current) => ({ ...current, [clientId]: null }));
    setPurchaseErrors((current) => ({ ...current, [clientId]: "" }));
    setPurchaseNotices((current) => ({ ...current, [clientId]: "" }));

    scrollToPurchaseForm(clientId);
  }

  function startEditPurchase(clientId: string, purchase: Purchase) {
    setPurchaseForms((current) => ({
      ...current,
      [clientId]: {
        purchaseDate: purchase.purchaseDate.slice(0, 10),
        product: purchase.product,
        version: purchase.version ?? "",
        units: String(purchase.units),
        unitPrice: (purchase.unitPriceCents / 100).toFixed(2),
        notes: purchase.notes ?? "",
      },
    }));

    setEditingPurchase((current) => ({ ...current, [clientId]: purchase.id }));
    setPurchaseErrors((current) => ({ ...current, [clientId]: "" }));
    setPurchaseNotices((current) => ({ ...current, [clientId]: "" }));

    scrollToPurchaseForm(clientId);
  }

  function updatePurchaseField(
    clientId: string,
    key: keyof PurchaseForm,
    value: string
  ) {
    setPurchaseForms((current) => ({
      ...current,
      [clientId]: {
        ...(current[clientId] ?? emptyPurchaseForm()),
        [key]: value,
      },
    }));
  }

  function cancelPurchaseForm(clientId: string) {
    setPurchaseForms((current) => {
      const next = { ...current };
      delete next[clientId];
      return next;
    });

    setEditingPurchase((current) => ({ ...current, [clientId]: null }));
    setPurchaseErrors((current) => ({ ...current, [clientId]: "" }));
  }

  async function submitPurchase(
    event: FormEvent<HTMLFormElement>,
    clientId: string
  ) {
    event.preventDefault();

    const purchaseForm = purchaseForms[clientId];

    if (!purchaseForm) return;

    const units = Number(purchaseForm.units);
    const normalizedPrice = purchaseForm.unitPrice.trim().replace(",", ".");
    const unitPrice = Number(normalizedPrice);

    if (!Number.isSafeInteger(units) || units < 1) {
      setPurchaseErrors((current) => ({
        ...current,
        [clientId]: "Las unidades deben ser un número entero mayor que cero.",
      }));
      return;
    }

    if (
      normalizedPrice === "" ||
      !Number.isFinite(unitPrice) ||
      unitPrice < 0 ||
      unitPrice > 100000000
    ) {
      setPurchaseErrors((current) => ({
        ...current,
        [clientId]: "Introduce un precio válido igual o superior a cero.",
      }));
      return;
    }

    setPurchaseSaving(true);
    setPurchaseErrors((current) => ({ ...current, [clientId]: "" }));
    setPurchaseNotices((current) => ({ ...current, [clientId]: "" }));

    try {
      const purchaseId = editingPurchase[clientId];

      const payload = {
        ...(purchaseId ? { id: purchaseId } : {}),
        clientId,
        purchaseDate: purchaseForm.purchaseDate,
        product: purchaseForm.product.trim(),
        version: purchaseForm.version.trim() || null,
        units,
        unitPrice,
        notes: purchaseForm.notes.trim() || null,
      };

      const response = await fetch("/api/gestion/compras", {
        method: purchaseId ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) throw new Error(await readError(response));

      setPurchaseNotices((current) => ({
        ...current,
        [clientId]: purchaseId ? "Compra actualizada." : "Compra registrada.",
      }));

      cancelPurchaseForm(clientId);
      await loadPurchases(clientId);
    } catch (cause) {
      setPurchaseErrors((current) => ({
        ...current,
        [clientId]: cause instanceof Error
          ? cause.message
          : "No se ha podido guardar la compra.",
      }));
    } finally {
      setPurchaseSaving(false);
    }
  }

  async function deletePurchase(clientId: string, purchase: Purchase) {
    const message =
      `¿Quieres eliminar la compra de "${purchase.product}" del ${formatDate(purchase.purchaseDate)}? ` +
      "Esta acción no se puede deshacer.";

    if (!window.confirm(message)) return;

    setPurchaseErrors((current) => ({ ...current, [clientId]: "" }));
    setPurchaseNotices((current) => ({ ...current, [clientId]: "" }));

    try {
      const params = new URLSearchParams({
        id: purchase.id,
        clientId,
      });

      const response = await fetch(`/api/gestion/compras?${params.toString()}`, {
        method: "DELETE",
      });

      if (!response.ok) throw new Error(await readError(response));

      setPurchaseNotices((current) => ({
        ...current,
        [clientId]: "Compra eliminada.",
      }));

      if (editingPurchase[clientId] === purchase.id) {
        cancelPurchaseForm(clientId);
      }

      await loadPurchases(clientId);
    } catch (cause) {
      setPurchaseErrors((current) => ({
        ...current,
        [clientId]: cause instanceof Error
          ? cause.message
          : "No se ha podido eliminar la compra.",
      }));
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

        <button type="button" className={styles.primaryButton} onClick={startCreate}>
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
        <form ref={formRef} className={styles.formCard} onSubmit={submitForm}>
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
                : archiveFilter === "active"
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
            <button type="button" className={styles.primaryButton} onClick={startCreate}>
              Crear primer cliente
            </button>
          )}
        </div>
      ) : (
        <div className={styles.clientList}>
          {clients.map((client) => {
            const purchases = purchasesByClient[client.id];
            const isExpanded = expandedClients.includes(client.id);
            const purchaseForm = purchaseForms[client.id];
            const purchaseEditId = editingPurchase[client.id] ?? null;
            const showAll = Boolean(showAllPurchases[client.id]);

            const visiblePurchases = purchases
              ? purchases.purchases.slice(0, showAll ? undefined : 5)
              : [];

            const hasMorePurchases = (purchases?.purchases.length ?? 0) > 5;

            return (
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

                <div className={styles.purchaseSection}>
                  <button
                    type="button"
                    className={styles.purchaseToggle}
                    aria-expanded={isExpanded}
                    onClick={() => togglePurchases(client.id)}
                  >
                    <span>
                      <strong>Historial de compras</strong>
                      <span className={styles.purchaseToggleDescription}>
                        {purchases
                          ? `${purchases.purchases.length} ${purchases.purchases.length === 1 ? "compra" : "compras"}`
                          : "Consultar compras y gastos"}
                      </span>
                    </span>
                    <span className={styles.purchaseToggleEnd}>
                      {purchases && (
                        <strong>{formatEuros(purchases.totalCents)}</strong>
                      )}
                      <span aria-hidden="true">{isExpanded ? "−" : "+"}</span>
                    </span>
                  </button>

                  {isExpanded && (
                    <div className={styles.purchaseContent}>
                      {purchaseLoading[client.id] && (
                        <p className={styles.purchaseMuted}>Cargando historial…</p>
                      )}

                      {purchaseErrors[client.id] && (
                        <p className={styles.error} role="alert">
                          {purchaseErrors[client.id]}
                        </p>
                      )}

                      {purchaseNotices[client.id] && (
                        <p className={styles.notice} role="status">
                          {purchaseNotices[client.id]}
                        </p>
                      )}

                      {!purchaseLoading[client.id] && purchases && (
                        <>
                          <div className={styles.purchaseSummary}>
                            <span>Gasto acumulado registrado</span>
                            <strong>{formatEuros(purchases.totalCents)}</strong>
                          </div>

                          {purchases.purchases.length === 0 ? (
                            <p className={styles.purchaseMuted}>
                              Este cliente todavía no tiene compras registradas.
                            </p>
                          ) : (
                            <>
                              <div className={styles.purchaseList}>
                                {visiblePurchases.map((purchase) => (
                                  <div className={styles.purchaseCard} key={purchase.id}>
                                    <div className={styles.purchaseCardHeader}>
                                      <div>
                                        <h5>{purchase.product}</h5>
                                        <p>{formatDate(purchase.purchaseDate)}</p>
                                      </div>
                                      <strong className={styles.purchaseSubtotal}>
                                        {formatEuros(purchase.subtotalCents)}
                                      </strong>
                                    </div>

                                    <div className={styles.purchaseDetails}>
                                      {purchase.version && (
                                        <span>Versión: {purchase.version}</span>
                                      )}
                                      <span>Unidades: {purchase.units}</span>
                                      <span>Precio unitario: {formatEuros(purchase.unitPriceCents)}</span>
                                    </div>

                                    {purchase.notes && (
                                      <p className={styles.purchaseNotes}>{purchase.notes}</p>
                                    )}

                                    <div className={styles.purchaseActions}>
                                      {!client.archivedAt && (
                                        <button
                                          type="button"
                                          className={styles.textButton}
                                          onClick={() => startEditPurchase(client.id, purchase)}
                                        >
                                          Editar
                                        </button>
                                      )}
                                      {!client.archivedAt && (
                                        <button
                                          type="button"
                                          className={styles.textButton}
                                          onClick={() => void deletePurchase(client.id, purchase)}
                                        >
                                          Eliminar
                                        </button>
                                      )}
                                    </div>
                                  </div>
                                ))}
                              </div>

                              {hasMorePurchases && (
                                <button
                                  type="button"
                                  className={styles.textButton}
                                  onClick={() =>
                                    setShowAllPurchases((current) => ({
                                      ...current,
                                      [client.id]: !current[client.id],
                                    }))
                                  }
                                  aria-expanded={showAll}
                                >
                                  {showAll
                                    ? "Mostrar solo las 5 más recientes"
                                    : `Ver todas las compras (${purchases.purchases.length})`}
                                </button>
                              )}
                            </>
                          )}
                        </>
                      )}

                      {!client.archivedAt && !purchaseForm && (
                        <button
                          type="button"
                          className={styles.primaryButton}
                          onClick={() => startNewPurchase(client.id)}
                        >
                          <span aria-hidden="true">+</span>
                          Registrar compra
                        </button>
                      )}

                      {!client.archivedAt && purchaseForm && (
                        <form
                          ref={(element) => {
                            purchaseFormRefs.current[client.id] = element;
                          }}
                          className={styles.purchaseForm}
                          onSubmit={(event) => void submitPurchase(event, client.id)}
                        >
                          <h4>{purchaseEditId ? "Editar compra" : "Nueva compra"}</h4>

                          <div className={styles.purchaseFormGrid}>
                            <label>
                              Fecha de compra *
                              <input
                                type="date"
                                required
                                value={purchaseForm.purchaseDate}
                                onChange={(event) => updatePurchaseField(client.id, "purchaseDate", event.target.value)}
                              />
                            </label>

                            <label>
                              Producto *
                              <input
                                ref={(element) => {
                                  purchaseProductRefs.current[client.id] = element;
                                }}
                                required
                                maxLength={150}
                                value={purchaseForm.product}
                                onChange={(event) => updatePurchaseField(client.id, "product", event.target.value)}
                                placeholder="Ej. TOCA Básico"
                              />
                            </label>

                            <label>
                              Versión
                              <input
                                maxLength={100}
                                value={purchaseForm.version}
                                onChange={(event) => updatePurchaseField(client.id, "version", event.target.value)}
                                placeholder="Ej. Estándar"
                              />
                            </label>

                            <label>
                              Unidades *
                              <input
                                type="number"
                                required
                                min="1"
                                max="100000"
                                step="1"
                                value={purchaseForm.units}
                                onChange={(event) => updatePurchaseField(client.id, "units", event.target.value)}
                              />
                            </label>

                            <label>
                              Precio por unidad (€) *
                              <input
                                type="number"
                                required
                                min="0"
                                max="100000000"
                                step="0.01"
                                inputMode="decimal"
                                value={purchaseForm.unitPrice}
                                onChange={(event) => updatePurchaseField(client.id, "unitPrice", event.target.value)}
                                placeholder="25,00"
                              />
                            </label>

                            <label className={styles.purchaseFullWidth}>
                              Notas
                              <textarea
                                rows={2}
                                maxLength={2000}
                                value={purchaseForm.notes}
                                onChange={(event) => updatePurchaseField(client.id, "notes", event.target.value)}
                                placeholder="Detalles de la compra…"
                              />
                            </label>
                          </div>

                          <p className={styles.purchaseCalculation}>
                            Subtotal calculado:{" "}
                            <strong>
                              {formatEuros(
                                Math.round(
                                  Number(purchaseForm.units) *
                                  Number(purchaseForm.unitPrice.trim().replace(",", ".")) *
                                  100
                                ) || 0
                              )}
                            </strong>
                          </p>

                          {purchaseErrors[client.id] && (
                            <p className={styles.error} role="alert">
                              {purchaseErrors[client.id]}
                            </p>
                          )}

                          <div className={styles.formActions}>
                            <button
                              type="button"
                              className={styles.secondaryButton}
                              onClick={() => cancelPurchaseForm(client.id)}
                              disabled={purchaseSaving}
                            >
                              Cancelar
                            </button>
                            <button
                              type="submit"
                              className={styles.primaryButton}
                              disabled={purchaseSaving}
                            >
                              {purchaseSaving
                                ? "Guardando…"
                                : purchaseEditId
                                  ? "Guardar cambios"
                                  : "Guardar compra"}
                            </button>
                          </div>
                        </form>
                      )}
                    </div>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}