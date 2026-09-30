"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import * as Icons from "lucide-react";
import { getTenantStorageKey } from "@/lib/clientStorage";
import EditableLabel from "@/components/admin/EditableLabel";

/* ------------------------------------------------------------------ */
/* Tipos                                                               */
/* ------------------------------------------------------------------ */

type Category = "primary" | "promotions" | "social" | "updates";
type View = "inbox" | "starred" | "snoozed" | "sent" | "drafts" | "spam" | "trash";

type Email = {
  id: string;
  threadId: string;
  from: string;
  fromName: string;
  to: string;
  subject: string;
  body: string;
  timestamp: string;
  read: boolean;
  starred: boolean;
  snoozed: boolean;
  spam: boolean;
  trash: boolean;
  sent: boolean;
  draft: boolean;
  category: Category;
};

type Thread = {
  id: string;
  subject: string;
  participants: string;
  lastTimestamp: string;
  preview: string;
  count: number;
  unread: boolean;
  starred: boolean;
  messages: Email[];
};

type ComposeState = {
  to: string;
  subject: string;
  body: string;
  threadId: string | null;
  minimized: boolean;
};

/* ------------------------------------------------------------------ */
/* Datos demo                                                          */
/* ------------------------------------------------------------------ */

const ME = "admin@palmera.io";
const minsAgo = (m: number) => new Date(Date.now() - m * 60 * 1000).toISOString();
const hoursAgo = (h: number) => minsAgo(h * 60);
const daysAgo = (d: number) => minsAgo(d * 24 * 60);

function buildDemoEmails(): Email[] {
  return [
    {
      id: "e1a", threadId: "t1", from: "renato@gastroshows.es", fromName: "Renato García",
      to: ME, subject: "Módulos de control listos",
      body: "Hola,\n\nYa tengo listos los módulos de control en la consola de Palmera. Todo compila en verde.\n\nQuedo atento a la próxima tarea.",
      timestamp: hoursAgo(3), read: true, starred: false, snoozed: false, spam: false,
      trash: false, sent: false, draft: false, category: "primary",
    },
    {
      id: "e1b", threadId: "t1", from: "renato@gastroshows.es", fromName: "Renato García",
      to: ME, subject: "Re: Módulos de control listos",
      body: "Añado el parte de verificación: 42 checks en verde, 0 avisos. Te paso el enlace al informe en el próximo correo.",
      timestamp: minsAgo(10), read: false, starred: false, snoozed: false, spam: false,
      trash: false, sent: false, draft: false, category: "primary",
    },
    {
      id: "e2", threadId: "t2", from: "lucia@tecnologiasdelsur.com", fromName: "Lucía Fernández",
      to: ME, subject: "Pedido de solución ERP",
      body: "Hola Renato,\n\nAdjunto el pedido formal para la solución ERP modular. Quedo a la espera de tu confirmación de presupuesto.\n\nGracias.",
      timestamp: minsAgo(35), read: false, starred: false, snoozed: false, spam: false,
      trash: false, sent: false, draft: false, category: "primary",
    },
    {
      id: "e3a", threadId: "t3", from: "carlos.ortega@gmail.com", fromName: "Carlos Ortega",
      to: ME, subject: "Cotización proyecto conjunto",
      body: "Estimados,\n\nTras revisar la cotización propuesta para el proyecto conjunto, tengo algunas observaciones sobre los términos de pago.",
      timestamp: daysAgo(2), read: true, starred: true, snoozed: false, spam: false,
      trash: false, sent: false, draft: false, category: "primary",
    },
    {
      id: "e3b", threadId: "t3", from: ME, fromName: "Soporte Palmera",
      to: "carlos.ortega@gmail.com", subject: "Re: Cotización proyecto conjunto",
      body: "Hola Carlos,\n\nGracias por tu revisión. Te proponemos pago 40/30/30 con hitos mensuales. ¿Agendamos una llamada mañana?",
      timestamp: daysAgo(1), read: true, starred: true, snoozed: false, spam: false,
      trash: false, sent: true, draft: false, category: "primary",
    },
    {
      id: "e3c", threadId: "t3", from: "carlos.ortega@gmail.com", fromName: "Carlos Ortega",
      to: ME, subject: "Re: Cotización proyecto conjunto",
      body: "Perfecto, me encaja el 40/30/30. Hablamos mañana a las 10:00 para cerrar los hitos.",
      timestamp: hoursAgo(4), read: true, starred: true, snoozed: false, spam: false,
      trash: false, sent: false, draft: false, category: "primary",
    },
    {
      id: "e4", threadId: "t4", from: "sistema@palmera.io", fromName: "Sistema Palmera",
      to: ME, subject: "Backup triple completado",
      body: "El sistema de backup triple ha finalizado correctamente. Destinos Local, Vault y S3 sincronizados. Checksum verificado.",
      timestamp: hoursAgo(2), read: true, starred: false, snoozed: false, spam: false,
      trash: false, sent: false, draft: false, category: "updates",
    },
    {
      id: "e5", threadId: "t5", from: "newsletter@gastroshows.es", fromName: "Gastroshows",
      to: ME, subject: "15% de descuento en renovación de licencias",
      body: "Como cliente existente tienes un 15% de descuento en la renovación de tus licencias ERP del próximo trimestre. Código: ERP15.",
      timestamp: hoursAgo(6), read: false, starred: false, snoozed: false, spam: false,
      trash: false, sent: false, draft: false, category: "promotions",
    },
    {
      id: "e6", threadId: "t6", from: "team@palmera.io", fromName: "Equipo Palmera",
      to: ME, subject: "Firma de contrato: nueva incorporación",
      body: "El equipo ha aprobado tu incorporación formal. Revisa y firma el contrato adjunto antes del viernes.",
      timestamp: hoursAgo(12), read: false, starred: false, snoozed: false, spam: false,
      trash: false, sent: false, draft: false, category: "primary",
    },
    {
      id: "e7", threadId: "t7", from: "renato@gastroshows.es", fromName: "Renato García",
      to: ME, subject: "Fotos del evento de equipo",
      body: "Comparto las fotos del último evento de equipo. ¡Gran jornada de convivencia! Hasta la próxima.",
      timestamp: daysAgo(1), read: true, starred: false, snoozed: false, spam: false,
      trash: false, sent: false, draft: false, category: "social",
    },
    {
      id: "e8", threadId: "t8", from: "support@palmera.io", fromName: "Soporte Palmera",
      to: ME, subject: "Incidente servidor staging: resuelto",
      body: "Incidente resuelto. Causa: saturación de memoria durante la exportación de datos. Recomendamos ampliar el límite en config.prod.",
      timestamp: daysAgo(2), read: true, starred: false, snoozed: false, spam: false,
      trash: false, sent: false, draft: false, category: "updates",
    },
    {
      id: "e9a", threadId: "t9", from: "silvia@gastroshows.es", fromName: "Silvia Ríos",
      to: ME, subject: "Planificación trimestral Q3",
      body: "Hola,\n\nPropongo la siguiente distribución de recursos para el Q3, con objetivos y KPIs por sede.",
      timestamp: daysAgo(4), read: true, starred: true, snoozed: false, spam: false,
      trash: false, sent: false, draft: false, category: "primary",
    },
    {
      id: "e9b", threadId: "t9", from: "silvia@gastroshows.es", fromName: "Silvia Ríos",
      to: ME, subject: "Re: Planificación trimestral Q3",
      body: "Añado el desglose por semanas y los responsables de cada hito. Lo revisamos en la reunión del lunes.",
      timestamp: daysAgo(3), read: true, starred: true, snoozed: false, spam: false,
      trash: false, sent: false, draft: false, category: "primary",
    },
    {
      id: "e10", threadId: "t10", from: "sistema@palmera.io", fromName: "Sistema Palmera",
      to: ME, subject: "Reporte mensual de ventas",
      body: "El reporte del tercer trimestre ya está disponible. Metas superadas en un 12% gracias al nuevo embudo de ventas.",
      timestamp: daysAgo(5), read: true, starred: false, snoozed: false, spam: false,
      trash: false, sent: false, draft: false, category: "updates",
    },
    {
      id: "e11", threadId: "t11", from: ME, fromName: "Soporte Palmera",
      to: "lucia@tecnologiasdelsur.com", subject: "Presupuesto ERP modular",
      body: "Hola Lucía,\n\nTe envío el presupuesto de la solución ERP modular con el desglose por fases.",
      timestamp: daysAgo(1), read: true, starred: false, snoozed: false, spam: false,
      trash: false, sent: true, draft: false, category: "primary",
    },
    {
      id: "e12", threadId: "t12", from: ME, fromName: "Soporte Palmera",
      to: "", subject: "Borrador: propuesta de formación",
      body: "Pendiente de redactar la propuesta de formación para el equipo de sala...",
      timestamp: hoursAgo(1), read: true, starred: false, snoozed: false, spam: false,
      trash: false, sent: false, draft: true, category: "primary",
    },
  ];
}

/* ------------------------------------------------------------------ */
/* Utilidades                                                          */
/* ------------------------------------------------------------------ */

const AVATAR_COLORS = [
  "bg-blue-600", "bg-emerald-600", "bg-amber-600", "bg-rose-600",
  "bg-violet-600", "bg-cyan-600", "bg-orange-600", "bg-teal-600",
];

function avatarColor(key: string): string {
  let h = 0;
  for (let i = 0; i < key.length; i += 1) h = (h * 31 + key.charCodeAt(i)) % 997;
  return AVATAR_COLORS[h % AVATAR_COLORS.length];
}

function initialOf(name: string): string {
  const t = (name || "?").trim();
  return t.length > 0 ? t.charAt(0).toUpperCase() : "?";
}

function formatListDate(iso: string): string {
  try {
    const d = new Date(iso);
    const now = new Date();
    const sameDay = d.toDateString() === now.toDateString();
    if (sameDay) {
      return d.toLocaleString("es-ES", { hour: "2-digit", minute: "2-digit" });
    }
    const yesterday = new Date(now);
    yesterday.setDate(now.getDate() - 1);
    if (d.toDateString() === yesterday.toDateString()) return "ayer";
    const sameYear = d.getFullYear() === now.getFullYear();
    return d.toLocaleString("es-ES", sameYear
      ? { day: "numeric", month: "short" }
      : { day: "numeric", month: "short", year: "numeric" });
  } catch {
    return iso;
  }
}

function formatFullDate(iso: string): string {
  try {
    return new Date(iso).toLocaleString("es-ES", {
      day: "numeric", month: "short", year: "numeric",
      hour: "2-digit", minute: "2-digit",
    });
  } catch {
    return iso;
  }
}

function groupThreads(emails: Email[]): Thread[] {
  const byId = new Map<string, Email[]>();
  for (const e of emails) {
    const list = byId.get(e.threadId) ?? [];
    list.push(e);
    byId.set(e.threadId, list);
  }
  const threads: Thread[] = [];
  for (const [id, msgs] of byId) {
    const sorted = [...msgs].sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
    const last = sorted[sorted.length - 1];
    const names = [...new Set(sorted.map((m) => m.fromName))].slice(0, 3).join(", ");
    threads.push({
      id,
      subject: last.subject.replace(/^(Re:\s*|Fwd:\s*|RV:\s*)+/i, ""),
      participants: names + (sorted.length > 3 ? ` +${sorted.length - 3}` : ""),
      lastTimestamp: last.timestamp,
      preview: last.body.replace(/\s+/g, " ").slice(0, 120),
      count: sorted.length,
      unread: sorted.some((m) => !m.read),
      starred: sorted.some((m) => m.starred),
      messages: sorted,
    });
  }
  return threads.sort((a, b) => new Date(b.lastTimestamp).getTime() - new Date(a.lastTimestamp).getTime());
}

const VIEW_META: Record<View, { label: string }> = {
  inbox: { label: "Recibidos" },
  starred: { label: "Destacados" },
  snoozed: { label: "Pospuestos" },
  sent: { label: "Enviados" },
  drafts: { label: "Borradores" },
  spam: { label: "Spam" },
  trash: { label: "Papelera" },
};

/* ------------------------------------------------------------------ */
/* Página                                                              */
/* ------------------------------------------------------------------ */

const PAGE_SIZE = 20;

export default function ConversationsPage() {
  const [emails, setEmails] = useState<Email[]>([]);
  const [view, setView] = useState<View>("inbox");
  const [tab, setTab] = useState<Category>("primary");
  const [searchQuery, setSearchQuery] = useState("");
  const [page, setPage] = useState(1);
  const [openThreadId, setOpenThreadId] = useState<string | null>(null);
  const [selected, setSelected] = useState<string[]>([]);
  const [expanded, setExpanded] = useState<string[]>([]);
  const [compose, setCompose] = useState<ComposeState | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);
  const selectAllRef = useRef<HTMLInputElement>(null);

  /* Carga inicial + persistencia por tenant */
  useEffect(() => {
    const key = getTenantStorageKey("palmera_emails");
    try {
      const raw = localStorage.getItem(key);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setEmails(parsed);
          return;
        }
      }
    } catch { /* usa demo */ }
    const demo = buildDemoEmails();
    setEmails(demo);
    try {
      localStorage.setItem(key, JSON.stringify(demo));
    } catch { /* sin almacenamiento */ }
  }, []);

  useEffect(() => {
    const onStorage = () => {
      try {
        const raw = localStorage.getItem(getTenantStorageKey("palmera_emails"));
        if (!raw) return;
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) setEmails(parsed);
      } catch { /* ignora */ }
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const persist = (next: Email[]) => {
    setEmails(next);
    try {
      localStorage.setItem(getTenantStorageKey("palmera_emails"), JSON.stringify(next));
    } catch { /* ignora */ }
  };

  const showToast = (msg: string) => {
    setToast(msg);
    window.setTimeout(() => setToast(null), 3500);
  };

  /* Hilos visibles según vista */
  const visibleEmails = useMemo(() => {
    switch (view) {
      case "inbox":
        return emails.filter((e) => !e.trash && !e.spam && !e.sent && !e.draft && !e.snoozed);
      case "starred":
        return emails.filter((e) => e.starred && !e.trash && !e.spam && !e.draft);
      case "snoozed":
        return emails.filter((e) => e.snoozed && !e.trash && !e.spam);
      case "sent":
        return emails.filter((e) => e.sent && !e.trash && !e.draft);
      case "drafts":
        return emails.filter((e) => e.draft && !e.trash);
      case "spam":
        return emails.filter((e) => e.spam && !e.trash);
      case "trash":
        return emails.filter((e) => e.trash);
      default:
        return emails;
    }
  }, [emails, view]);

  const searchedThreads = useMemo(() => {
    let threads = groupThreads(visibleEmails);
    if (view === "inbox") {
      threads = threads.filter((t) => t.messages.some((m) => m.category === tab));
    }
    const q = searchQuery.trim().toLowerCase();
    if (q) {
      threads = threads.filter((t) =>
        t.subject.toLowerCase().includes(q) ||
        t.participants.toLowerCase().includes(q) ||
        t.messages.some((m) =>
          m.from.toLowerCase().includes(q) ||
          m.body.toLowerCase().includes(q)),
      );
    }
    return threads;
  }, [visibleEmails, view, tab, searchQuery]);

  const totalPages = Math.max(1, Math.ceil(searchedThreads.length / PAGE_SIZE));
  const paginated = useMemo(
    () => searchedThreads.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE),
    [searchedThreads, page],
  );

  useEffect(() => {
    setPage(1);
    setSelected([]);
    setOpenThreadId(null);
  }, [view, tab, searchQuery]);

  /* Contadores */
  const counts = useMemo(() => {
    const inbox = emails.filter((e) => !e.trash && !e.spam && !e.sent && !e.draft && !e.snoozed);
    return {
      inboxUnread: inbox.filter((e) => !e.read).length,
      starred: emails.filter((e) => e.starred && !e.trash && !e.spam && !e.draft).length,
      snoozed: emails.filter((e) => e.snoozed && !e.trash && !e.spam).length,
      sent: emails.filter((e) => e.sent && !e.trash && !e.draft).length,
      drafts: emails.filter((e) => e.draft && !e.trash).length,
      spam: emails.filter((e) => e.spam && !e.trash).length,
      trash: emails.filter((e) => e.trash).length,
      tabPrimary: inbox.filter((e) => e.category === "primary").length,
      tabPromotions: inbox.filter((e) => e.category === "promotions").length,
      tabSocial: inbox.filter((e) => e.category === "social").length,
      tabUpdates: inbox.filter((e) => e.category === "updates").length,
    };
  }, [emails]);

  /* Selección múltiple */
  const allSelected = paginated.length > 0 && paginated.every((t) => selected.includes(t.id));
  const someSelected = paginated.some((t) => selected.includes(t.id));
  useEffect(() => {
    if (selectAllRef.current) selectAllRef.current.indeterminate = !allSelected && someSelected;
  }, [allSelected, someSelected]);

  const toggleSelect = (threadId: string) => {
    setSelected((prev) => (prev.includes(threadId) ? prev.filter((id) => id !== threadId) : [...prev, threadId]));
  };

  const toggleSelectAll = () => {
    if (allSelected) setSelected([]);
    else setSelected(paginated.map((t) => t.id));
  };

  /* Acciones sobre hilos */
  const updateThreads = (threadIds: string[], fn: (e: Email) => Email) => {
    persist(emails.map((e) => (threadIds.includes(e.threadId) ? fn(e) : e)));
  };

  const handleOpenThread = (thread: Thread) => {
    setOpenThreadId(thread.id);
    setExpanded([thread.messages[thread.messages.length - 1].id]);
    updateThreads([thread.id], (e) => ({ ...e, read: true }));
  };

  const bulkRead = (read: boolean) => {
    updateThreads(selected, (e) => ({ ...e, read }));
    setSelected([]);
    showToast(read ? "Marcados como leídos" : "Marcados como no leídos");
  };

  const bulkTrash = () => {
    updateThreads(selected, (e) => ({ ...e, trash: true }));
    setSelected([]);
    if (openThreadId && selected.includes(openThreadId)) setOpenThreadId(null);
    showToast("Conversación movida a la papelera");
  };

  const bulkSpam = () => {
    updateThreads(selected, (e) => ({ ...e, spam: true }));
    setSelected([]);
    showToast("Marcado como spam");
  };

  const bulkSnooze = () => {
    updateThreads(selected, (e) => ({ ...e, snoozed: !e.snoozed }));
    setSelected([]);
    showToast("Conversación pospuesta");
  };

  const markAllRead = () => {
    persist(emails.map((e) => ({ ...e, read: true })));
    setMoreOpen(false);
    showToast("Todo marcado como leído");
  };

  const deleteForever = (threadId: string) => {
    persist(emails.filter((e) => e.threadId !== threadId));
    if (openThreadId === threadId) setOpenThreadId(null);
    showToast("Conversación eliminada definitivamente");
  };

  const emptyTrash = () => {
    persist(emails.filter((e) => !e.trash));
    showToast("Papelera vaciada");
  };

  const toggleStar = (emailId: string) => {
    persist(emails.map((e) => (e.id === emailId ? { ...e, starred: !e.starred } : e)));
  };

  /* Redactar / enviar */
  const openCompose = (preset?: Partial<ComposeState>) => {
    setCompose({ to: "", subject: "", body: "", threadId: null, minimized: false, ...preset });
  };

  const openReply = (thread: Thread) => {
    const last = thread.messages[thread.messages.length - 1];
    const subject = last.subject.startsWith("Re:") ? last.subject : `Re: ${thread.subject}`;
    openCompose({ to: last.from === ME ? last.to : last.from, subject, body: `\n\n—\nEl ${formatFullDate(last.timestamp)}, ${last.fromName} escribió:\n${last.body}`, threadId: thread.id });
  };

  const sendCompose = () => {
    if (!compose) return;
    if (!compose.to.trim()) {
      showToast("Indica un destinatario");
      return;
    }
    const now = new Date().toISOString();
    const threadId = compose.threadId ?? `t_${Date.now()}`;
    const category: Category = threadId && compose.threadId
      ? emails.find((e) => e.threadId === threadId)?.category ?? "primary"
      : "primary";
    const mail: Email = {
      id: `e_${Date.now()}`,
      threadId,
      from: ME,
      fromName: "Soporte Palmera",
      to: compose.to.trim(),
      subject: compose.subject.trim() || "(sin asunto)",
      body: compose.body,
      timestamp: now,
      read: true,
      starred: false,
      snoozed: false,
      spam: false,
      trash: false,
      sent: true,
      draft: false,
      category,
    };
    persist([mail, ...emails]);
    setCompose(null);
    setView("sent");
    showToast("Mensaje enviado");
  };

  const saveDraft = () => {
    if (!compose) return;
    const now = new Date().toISOString();
    const mail: Email = {
      id: `e_${Date.now()}`,
      threadId: `t_${Date.now()}`,
      from: ME,
      fromName: "Soporte Palmera",
      to: compose.to,
      subject: compose.subject || "(sin asunto)",
      body: compose.body,
      timestamp: now,
      read: true,
      starred: false,
      snoozed: false,
      spam: false,
      trash: false,
      sent: false,
      draft: true,
      category: "primary",
    };
    persist([mail, ...emails]);
    setCompose(null);
    showToast("Borrador guardado");
  };

  /* Hilo abierto */
  const openThread = openThreadId
    ? groupThreads(emails.filter((e) => e.threadId === openThreadId))[0] ?? null
    : null;

  const rangeLabel = searchedThreads.length === 0
    ? "0 de 0"
    : `${(page - 1) * PAGE_SIZE + 1}–${Math.min(page * PAGE_SIZE, searchedThreads.length)} de ${searchedThreads.length}`;

  const navItem = (v: View, icon: React.ReactNode, count?: number) => {
    const active = view === v && !openThread;
    return (
      <button
        onClick={() => { setView(v); setSidebarOpen(false); }}
        className={`flex w-full items-center gap-3 rounded-r-full py-1.5 pl-4 pr-3 text-sm transition ${
          active ? "bg-sky-100 font-bold text-sky-900 dark:bg-sky-950 dark:text-sky-100" : "text-foreground/80 hover:bg-muted"
        }`}
      >
        <span className="shrink-0">{icon}</span>
        <span className="flex-1 text-left">{VIEW_META[v].label}</span>
        {typeof count === "number" && count > 0 && (
          <span className="text-xs font-bold text-muted-foreground">{count}</span>
        )}
      </button>
    );
  };

  return (
    <div className="flex h-[calc(100dvh-7rem)] min-h-[560px] flex-col overflow-hidden rounded-2xl border border-border/40 bg-card shadow-xs">
      <span className="sr-only">
        <EditableLabel apiKey="conversations.page.title" defaultValue="Correo Palmera" />
      </span>

      <div className="flex min-h-0 flex-1">
        {/* Barra lateral */}
        <aside className={`${sidebarOpen ? "absolute z-30 flex h-full flex-col bg-card shadow-2xl" : "hidden"} w-60 shrink-0 flex-col gap-1 overflow-y-auto py-3 pr-3 lg:static lg:flex`}>
          <div className="px-3 pb-3">
            <button
              onClick={() => openCompose()}
              className="flex items-center gap-2 rounded-2xl bg-card px-5 py-3.5 text-sm font-semibold text-foreground shadow-md ring-1 ring-border/60 transition hover:shadow-lg"
            >
              <Icons.Pencil className="h-4 w-4" />
              <span>Redactar</span>
            </button>
          </div>
          <nav className="space-y-0.5">
            {navItem("inbox", <Icons.Inbox className="h-4 w-4" />, counts.inboxUnread)}
            {navItem("starred", <Icons.Star className="h-4 w-4" />, counts.starred)}
            {navItem("snoozed", <Icons.Clock className="h-4 w-4" />, counts.snoozed)}
            {navItem("sent", <Icons.SendHorizontal className="h-4 w-4" />)}
            {navItem("drafts", <Icons.FileText className="h-4 w-4" />, counts.drafts)}
            {navItem("spam", <Icons.OctagonAlert className="h-4 w-4" />, counts.spam)}
            {navItem("trash", <Icons.Trash2 className="h-4 w-4" />, counts.trash)}
          </nav>
          <div className="mt-4 px-5">
            <div className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">Etiquetas</div>
            <div className="mt-2 space-y-1.5 text-xs text-muted-foreground">
              <div className="flex items-center gap-2"><span className="h-2 w-2 rounded-full bg-blue-500" /> Principal</div>
              <div className="flex items-center gap-2"><span className="h-2 w-2 rounded-full bg-emerald-500" /> Promociones</div>
              <div className="flex items-center gap-2"><span className="h-2 w-2 rounded-full bg-sky-500" /> Social</div>
              <div className="flex items-center gap-2"><span className="h-2 w-2 rounded-full bg-amber-500" /> Actualizaciones</div>
            </div>
          </div>
        </aside>

        {/* Columna principal */}
        <main className="flex min-w-0 flex-1 flex-col">
          {/* Buscador estilo Gmail */}
          <div className="flex items-center gap-2 px-3 pt-2">
            <button onClick={() => setSidebarOpen((v) => !v)} className="rounded-full p-2 text-muted-foreground hover:bg-muted lg:hidden">
              <Icons.Menu className="h-5 w-5" />
            </button>
            <div className="flex flex-1 items-center gap-2 rounded-full bg-muted/60 px-4 py-2 transition focus-within:bg-card focus-within:shadow-md focus-within:ring-1 focus-within:ring-border">
              <Icons.Search className="h-4 w-4 shrink-0 text-muted-foreground" />
              <input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Buscar en correo"
                className="w-full bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground"
              />
              {searchQuery && (
                <button onClick={() => setSearchQuery("")} className="rounded-full p-1 hover:bg-muted">
                  <Icons.X className="h-4 w-4 text-muted-foreground" />
                </button>
              )}
              <Icons.SlidersHorizontal className="h-4 w-4 shrink-0 text-muted-foreground" />
            </div>
          </div>

          {!openThread ? (
            <>
              {/* Barra de herramientas */}
              <div className="flex items-center gap-1 px-3 py-1.5">
                <input
                  ref={selectAllRef}
                  type="checkbox"
                  checked={allSelected}
                  onChange={toggleSelectAll}
                  className="h-4 w-4 rounded accent-sky-600"
                  title="Seleccionar"
                />
                <button
                  onClick={() => {
                    try {
                      const raw = localStorage.getItem(getTenantStorageKey("palmera_emails"));
                      if (raw) setEmails(JSON.parse(raw));
                    } catch { /* ignora */ }
                    showToast("Bandeja actualizada");
                  }}
                  className="rounded-full p-2 text-muted-foreground hover:bg-muted"
                  title="Actualizar"
                >
                  <Icons.RefreshCw className="h-4 w-4" />
                </button>
                {selected.length > 0 ? (
                  <>
                    <button onClick={() => bulkRead(true)} className="rounded-full p-2 text-muted-foreground hover:bg-muted" title="Marcar como leídos">
                      <Icons.MailOpen className="h-4 w-4" />
                    </button>
                    <button onClick={() => bulkSnooze()} className="rounded-full p-2 text-muted-foreground hover:bg-muted" title="Posponer">
                      <Icons.Clock className="h-4 w-4" />
                    </button>
                    <button onClick={bulkSpam} className="rounded-full p-2 text-muted-foreground hover:bg-muted" title="Marcar como spam">
                      <Icons.OctagonAlert className="h-4 w-4" />
                    </button>
                    <button onClick={bulkTrash} className="rounded-full p-2 text-muted-foreground hover:bg-muted" title="Eliminar">
                      <Icons.Trash2 className="h-4 w-4" />
                    </button>
                  </>
                ) : (
                  <div className="relative">
                    <button onClick={() => setMoreOpen((v) => !v)} className="rounded-full p-2 text-muted-foreground hover:bg-muted" title="Más">
                      <Icons.MoreVertical className="h-4 w-4" />
                    </button>
                    {moreOpen && (
                      <div className="absolute left-0 top-9 z-20 w-56 rounded-xl border border-border bg-card p-1 shadow-xl">
                        <button onClick={markAllRead} className="w-full rounded-lg px-3 py-2 text-left text-xs text-foreground hover:bg-muted">
                          Marcar todos como leídos
                        </button>
                        {view === "trash" && (
                          <button onClick={emptyTrash} className="w-full rounded-lg px-3 py-2 text-left text-xs text-red-600 hover:bg-muted">
                            Vaciar la papelera
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                )}
                <div className="ml-auto flex items-center gap-1 text-xs text-muted-foreground">
                  <span className="mr-1 hidden sm:inline">{rangeLabel}</span>
                  <button disabled={page <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))} className="rounded-full p-2 hover:bg-muted disabled:opacity-30">
                    <Icons.ChevronLeft className="h-4 w-4" />
                  </button>
                  <button disabled={page >= totalPages} onClick={() => setPage((p) => Math.min(totalPages, p + 1))} className="rounded-full p-2 hover:bg-muted disabled:opacity-30">
                    <Icons.ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              </div>

              {/* Pestañas de categorías (solo Recibidos) */}
              {view === "inbox" && (
                <div className="flex border-b border-border/40 px-2">
                  <button onClick={() => setTab("primary")} className={`flex max-w-60 flex-1 items-center gap-2 px-4 py-2.5 text-sm transition ${tab === "primary" ? "border-b-[3px] border-blue-600 font-semibold text-blue-600 dark:text-blue-400" : "text-muted-foreground hover:bg-muted/50"}`}>
                    <Icons.Inbox className="h-4 w-4" />
                    <span className="hidden sm:inline">Principal</span>
                    {counts.tabPrimary > 0 && <span className="rounded-full bg-blue-600/10 px-1.5 text-[10px] font-bold">{counts.tabPrimary}</span>}
                  </button>
                  <button onClick={() => setTab("promotions")} className={`flex max-w-60 flex-1 items-center gap-2 px-4 py-2.5 text-sm transition ${tab === "promotions" ? "border-b-[3px] border-emerald-600 font-semibold text-emerald-600 dark:text-emerald-400" : "text-muted-foreground hover:bg-muted/50"}`}>
                    <Icons.Tag className="h-4 w-4" />
                    <span className="hidden sm:inline">Promociones</span>
                    {counts.tabPromotions > 0 && <span className="rounded-full bg-emerald-600/10 px-1.5 text-[10px] font-bold">{counts.tabPromotions}</span>}
                  </button>
                  <button onClick={() => setTab("social")} className={`flex max-w-60 flex-1 items-center gap-2 px-4 py-2.5 text-sm transition ${tab === "social" ? "border-b-[3px] border-sky-600 font-semibold text-sky-600 dark:text-sky-400" : "text-muted-foreground hover:bg-muted/50"}`}>
                    <Icons.Users className="h-4 w-4" />
                    <span className="hidden sm:inline">Social</span>
                    {counts.tabSocial > 0 && <span className="rounded-full bg-sky-600/10 px-1.5 text-[10px] font-bold">{counts.tabSocial}</span>}
                  </button>
                  <button onClick={() => setTab("updates")} className={`flex max-w-60 flex-1 items-center gap-2 px-4 py-2.5 text-sm transition ${tab === "updates" ? "border-b-[3px] border-amber-500 font-semibold text-amber-600 dark:text-amber-400" : "text-muted-foreground hover:bg-muted/50"}`}>
                    <Icons.Bell className="h-4 w-4" />
                    <span className="hidden sm:inline">Actualizaciones</span>
                    {counts.tabUpdates > 0 && <span className="rounded-full bg-amber-500/10 px-1.5 text-[10px] font-bold">{counts.tabUpdates}</span>}
                  </button>
                </div>
              )}

              {/* Lista de hilos */}
              <div className="min-h-0 flex-1 overflow-y-auto">
                {paginated.length === 0 ? (
                  <div className="flex h-full flex-col items-center justify-center gap-3 p-10 text-center">
                    <Icons.Inbox className="h-12 w-12 text-muted-foreground/40" />
                    <div className="text-sm font-semibold text-foreground">No hay conversaciones aquí</div>
                    <div className="max-w-xs text-xs text-muted-foreground">
                      {view === "trash" ? "La papelera está vacía." : "Cuando recibas correos, aparecerán en esta vista."}
                    </div>
                  </div>
                ) : (
                  paginated.map((thread) => {
                    const isSelected = selected.includes(thread.id);
                    const rowBg = isSelected
                      ? "bg-sky-100 dark:bg-sky-950/50"
                      : thread.unread
                        ? "bg-card hover:shadow-[inset_1px_0_0_#dadce0,inset_-1px_0_0_#dadce0,0_1px_2px_rgba(60,64,67,.3)] dark:hover:shadow-none dark:hover:bg-muted/60"
                        : "bg-muted/40 hover:bg-muted/60";
                    return (
                      <div
                        key={thread.id}
                        onClick={() => handleOpenThread(thread)}
                        className={`group flex cursor-pointer items-center gap-2 border-b border-border/40 px-3 py-2 transition ${rowBg}`}
                      >
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleSelect(thread.id)}
                          onClick={(e) => e.stopPropagation()}
                          className="h-4 w-4 shrink-0 rounded accent-sky-600"
                        />
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            const last = thread.messages[thread.messages.length - 1];
                            toggleStar(last.id);
                          }}
                          className="shrink-0 rounded-full p-1 hover:bg-muted"
                          title="Destacar"
                        >
                          <Icons.Star className={`h-4 w-4 ${thread.starred ? "fill-amber-400 text-amber-400" : "text-muted-foreground/60"}`} />
                        </button>
                        <span className={`w-40 shrink-0 truncate text-sm sm:w-48 ${thread.unread ? "font-bold text-foreground" : "text-foreground/80"}`}>
                          {thread.participants}
                          {thread.count > 1 && <span className="ml-1 font-normal text-muted-foreground">({thread.count})</span>}
                        </span>
                        <span className="min-w-0 flex-1 truncate text-sm">
                          <span className={thread.unread ? "font-bold text-foreground" : "text-foreground/80"}>{thread.subject}</span>
                          <span className="text-muted-foreground"> — {thread.preview}</span>
                        </span>
                        <span className="hidden shrink-0 text-xs text-muted-foreground group-hover:hidden sm:inline">
                          {formatListDate(thread.lastTimestamp)}
                        </span>
                        <span className="hidden shrink-0 items-center gap-0.5 group-hover:flex">
                          <button
                            onClick={(e) => { e.stopPropagation(); updateThreads([thread.id], (m) => ({ ...m, trash: true })); showToast("Conversación movida a la papelera"); }}
                            className="rounded-full p-1.5 hover:bg-muted" title="Eliminar"
                          >
                            <Icons.Trash2 className="h-4 w-4 text-muted-foreground" />
                          </button>
                          <button
                            onClick={(e) => { e.stopPropagation(); updateThreads([thread.id], (m) => ({ ...m, read: !m.read })); }}
                            className="rounded-full p-1.5 hover:bg-muted" title={thread.unread ? "Marcar como leído" : "Marcar como no leído"}
                          >
                            <Icons.MailOpen className="h-4 w-4 text-muted-foreground" />
                          </button>
                          <button
                            onClick={(e) => { e.stopPropagation(); updateThreads([thread.id], (m) => ({ ...m, snoozed: !m.snoozed })); showToast("Conversación pospuesta"); }}
                            className="rounded-full p-1.5 hover:bg-muted" title="Posponer"
                          >
                            <Icons.Clock className="h-4 w-4 text-muted-foreground" />
                          </button>
                        </span>
                      </div>
                    );
                  })
                )}
              </div>
            </>
          ) : (
            openThread && (
              <>
                {/* Barra de lectura */}
                <div className="flex items-center gap-1 border-b border-border/40 px-3 py-1.5">
                  <button onClick={() => setOpenThreadId(null)} className="rounded-full p-2 text-muted-foreground hover:bg-muted" title="Volver">
                    <Icons.ArrowLeft className="h-4 w-4" />
                  </button>
                  <button onClick={() => { updateThreads([openThread.id], (m) => ({ ...m, trash: true })); setOpenThreadId(null); showToast("Conversación movida a la papelera"); }} className="rounded-full p-2 text-muted-foreground hover:bg-muted" title="Eliminar">
                    <Icons.Trash2 className="h-4 w-4" />
                  </button>
                  <button onClick={() => { updateThreads([openThread.id], (m) => ({ ...m, spam: true })); setOpenThreadId(null); showToast("Marcado como spam"); }} className="rounded-full p-2 text-muted-foreground hover:bg-muted" title="Spam">
                    <Icons.OctagonAlert className="h-4 w-4" />
                  </button>
                  <button onClick={() => { updateThreads([openThread.id], (m) => ({ ...m, read: false })); setOpenThreadId(null); }} className="rounded-full p-2 text-muted-foreground hover:bg-muted" title="Marcar como no leído">
                    <Icons.MailOpen className="h-4 w-4" />
                  </button>
                  <button onClick={() => { updateThreads([openThread.id], (m) => ({ ...m, snoozed: !m.snoozed })); showToast("Conversación pospuesta"); }} className="rounded-full p-2 text-muted-foreground hover:bg-muted" title="Posponer">
                    <Icons.Clock className="h-4 w-4" />
                  </button>
                  {view === "trash" && (
                    <button onClick={() => deleteForever(openThread.id)} className="rounded-full p-2 text-red-600 hover:bg-muted" title="Eliminar definitivamente">
                      <Icons.Trash className="h-4 w-4" />
                    </button>
                  )}
                </div>

                {/* Hilo */}
                <div className="min-h-0 flex-1 overflow-y-auto px-4 py-3 sm:px-8">
                  <h1 className="text-xl font-normal text-foreground">{openThread.subject}</h1>
                  <div className="mt-4 space-y-3 pb-6">
                    {openThread.messages.map((msg) => {
                      const isOpen = expanded.includes(msg.id);
                      const isLast = msg.id === openThread.messages[openThread.messages.length - 1].id;
                      if (!isOpen && !isLast && openThread.messages.length > 2) {
                        return (
                          <button
                            key={msg.id}
                            onClick={() => setExpanded((p) => [...p, msg.id])}
                            className="flex w-full items-center gap-3 rounded-xl border border-border/40 bg-muted/30 px-4 py-2.5 text-left hover:bg-muted/60"
                          >
                            <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-bold text-white ${avatarColor(msg.from)}`}>
                              {initialOf(msg.fromName)}
                            </span>
                            <span className="flex-1 truncate text-sm font-semibold text-foreground">{msg.fromName}</span>
                            <span className="text-xs text-muted-foreground">{formatListDate(msg.timestamp)}</span>
                          </button>
                        );
                      }
                      return (
                        <article key={msg.id} className="rounded-xl border border-border/40 bg-card p-4 shadow-xs">
                          <div className="flex items-center gap-3">
                            <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-base font-bold text-white ${avatarColor(msg.from)}`}>
                              {initialOf(msg.fromName)}
                            </span>
                            <div className="min-w-0 flex-1">
                              <div className="truncate text-sm font-bold text-foreground">{msg.fromName}</div>
                              <div className="truncate text-xs text-muted-foreground">
                                &lt;{msg.from}&gt; · para {msg.to || "mí"}
                              </div>
                            </div>
                            <span className="shrink-0 text-xs text-muted-foreground">{formatFullDate(msg.timestamp)}</span>
                            <button onClick={() => toggleStar(msg.id)} className="shrink-0 rounded-full p-1 hover:bg-muted" title="Destacar">
                              <Icons.Star className={`h-4 w-4 ${msg.starred ? "fill-amber-400 text-amber-400" : "text-muted-foreground/60"}`} />
                            </button>
                            <button onClick={() => openReply(openThread)} className="shrink-0 rounded-full p-1.5 hover:bg-muted" title="Responder">
                              <Icons.Reply className="h-4 w-4 text-muted-foreground" />
                            </button>
                          </div>
                          <div className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-foreground/90">
                            {msg.body}
                          </div>
                          {isLast && (
                            <div className="mt-4 flex gap-2">
                              <button onClick={() => openReply(openThread)} className="flex items-center gap-1.5 rounded-full border border-border px-4 py-1.5 text-xs font-semibold text-muted-foreground hover:bg-muted">
                                <Icons.Reply className="h-3.5 w-3.5" /> Responder
                              </button>
                              <button onClick={() => openReply(openThread)} className="flex items-center gap-1.5 rounded-full border border-border px-4 py-1.5 text-xs font-semibold text-muted-foreground hover:bg-muted">
                                <Icons.Forward className="h-3.5 w-3.5" /> Reenviar
                              </button>
                            </div>
                          )}
                        </article>
                      );
                    })}
                  </div>
                </div>
              </>
            )
          )}
        </main>
      </div>

      {/* Ventana de redacción */}
      {compose && (
        <div className={`fixed bottom-0 right-4 z-40 flex w-[calc(100%-2rem)] max-w-[500px] flex-col overflow-hidden rounded-t-xl border border-border bg-card shadow-2xl ${compose.minimized ? "h-10" : "h-[480px] max-h-[80dvh]"}`}>
          <div className="flex items-center gap-2 bg-muted/60 px-4 py-2.5">
            <span className="flex-1 truncate text-xs font-bold text-foreground">Mensaje nuevo</span>
            <button onClick={() => setCompose({ ...compose, minimized: !compose.minimized })} className="rounded p-1 hover:bg-muted" title="Minimizar">
              <Icons.Minus className="h-4 w-4 text-muted-foreground" />
            </button>
            <button onClick={() => setCompose(null)} className="rounded p-1 hover:bg-muted" title="Cerrar">
              <Icons.X className="h-4 w-4 text-muted-foreground" />
            </button>
          </div>
          {!compose.minimized && (
            <>
              <div className="flex items-center gap-2 border-b border-border/40 px-4 py-2">
                <span className="w-12 shrink-0 text-xs text-muted-foreground">Para</span>
                <input
                  value={compose.to}
                  onChange={(e) => setCompose({ ...compose, to: e.target.value })}
                  placeholder="destinatario@empresa.com"
                  className="w-full bg-transparent text-sm text-foreground outline-none"
                />
              </div>
              <div className="flex items-center gap-2 border-b border-border/40 px-4 py-2">
                <span className="w-12 shrink-0 text-xs text-muted-foreground">Asunto</span>
                <input
                  value={compose.subject}
                  onChange={(e) => setCompose({ ...compose, subject: e.target.value })}
                  placeholder="Asunto"
                  className="w-full bg-transparent text-sm text-foreground outline-none"
                />
              </div>
              <textarea
                value={compose.body}
                onChange={(e) => setCompose({ ...compose, body: e.target.value })}
                className="min-h-0 flex-1 resize-none bg-transparent p-4 text-sm text-foreground outline-none"
                placeholder="Escribe tu mensaje…"
              />
              <div className="flex items-center gap-1 px-4 py-2.5">
                <button onClick={sendCompose} className="rounded-full bg-sky-700 px-6 py-2 text-xs font-bold text-white transition hover:bg-sky-800">
                  Enviar
                </button>
                <span className="mx-1 h-5 w-px bg-border" />
                <button className="rounded-full p-2 text-muted-foreground hover:bg-muted" title="Formato"><Icons.CaseSensitive className="h-4 w-4" /></button>
                <button className="rounded-full p-2 text-muted-foreground hover:bg-muted" title="Adjuntar"><Icons.Paperclip className="h-4 w-4" /></button>
                <button className="rounded-full p-2 text-muted-foreground hover:bg-muted" title="Insertar imagen"><Icons.Image className="h-4 w-4" /></button>
                <button className="rounded-full p-2 text-muted-foreground hover:bg-muted" title="Emoji"><Icons.Smile className="h-4 w-4" /></button>
                <button onClick={saveDraft} className="ml-auto rounded-full p-2 text-muted-foreground hover:bg-muted" title="Guardar y cerrar">
                  <Icons.X className="h-4 w-4" />
                </button>
                <button onClick={() => { setCompose(null); showToast("Borrador descartado"); }} className="rounded-full p-2 text-muted-foreground hover:bg-muted" title="Descartar">
                  <Icons.Trash2 className="h-4 w-4" />
                </button>
              </div>
            </>
          )}
        </div>
      )}

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-6 left-6 z-50 flex items-center gap-3 rounded-lg bg-neutral-900 px-4 py-3 text-sm text-white shadow-xl dark:bg-neutral-100 dark:text-neutral-900">
          <Icons.CheckCircle2 className="h-4 w-4" />
          <span>{toast}</span>
        </div>
      )}
    </div>
  );
}
