import { useEffect, useMemo, useState, type FormEvent, type ReactNode } from "react";
import {
  Activity, AlertTriangle, ArrowDownRight, ArrowRight, ArrowUpRight, Beaker, Bell, BookOpen,
  CalendarDays, Check, CheckCircle2, ChevronDown, ChevronRight, ClipboardList, Clock3, FileCheck2,
  FilePlus2, FlaskConical, HeartPulse, LayoutDashboard, LogOut, Menu, Minus, Package, Plus,
  Printer, Search, ShieldCheck, Stethoscope, TestTube2, Users, X,
} from "lucide-react";
import { demoAccounts, demoLabData } from "@shared/lab-seed";
import type {
  AnalysisType, Bulletin, BulletinStatus, Discipline, Interpretation, LabAccount, LabData,
  Patient, PatientType, Prescriber, Product, Role, ResultValue,
} from "@shared/lab";

const BRAND_MARK = "/lab-mark.svg";
const STORAGE_KEY = "ayalab-demo-store-v1";
const SESSION_KEY = "ayalab-demo-user-v1";
const clone = <T,>(value: T): T => JSON.parse(JSON.stringify(value)) as T;
function loadData(): LabData {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const data = JSON.parse(raw) as LabData;
      if (data.patients && data.bulletins && data.products) return data;
    }
  } catch { /* Revenir au jeu de démonstration initial. */ }
  return clone(demoLabData);
}
function loadUser(): LabAccount | null {
  try {
    const raw = sessionStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    const account = JSON.parse(raw) as LabAccount;
    return demoAccounts.find((item) => item.username === account.username && item.role === account.role) ?? null;
  } catch { return null; }
}
const today = () => new Date().toISOString().slice(0, 10);
const fmtDate = (date: string, options?: Intl.DateTimeFormatOptions) => {
  if (!date) return "—";
  const value = new Date(`${date.slice(0, 10)}T12:00:00`);
  return new Intl.DateTimeFormat("fr-FR", options ?? { day: "2-digit", month: "short", year: "numeric" }).format(value);
};
const patientName = (patient?: Patient) => patient ? `${patient.prenoms} ${patient.nom}` : "Patient inconnu";
const prescriberName = (prescriber?: Prescriber) => prescriber ? `Dr ${prescriber.prenoms} ${prescriber.nom}` : "—";
const statusSequence: BulletinStatus[] = ["Enregistré", "Prélevé", "En analyse", "Résultats saisis", "Remis"];
const statusClass = (status: BulletinStatus) => ({
  "Enregistré": "status status-blue", "Prélevé": "status status-violet", "En analyse": "status status-amber",
  "Résultats saisis": "status status-green", "Remis": "status status-gray",
}[status]);
const menuItems = [
  { id: "dashboard", label: "Tableau de bord", icon: LayoutDashboard },
  { id: "patients", label: "Patients", icon: Users },
  { id: "prescribers", label: "Prescripteurs", icon: Stethoscope },
  { id: "bulletins", label: "Bulletins", icon: ClipboardList },
  { id: "collection", label: "Prélèvements", icon: TestTube2 },
  { id: "results", label: "Saisie des résultats", icon: FileCheck2 },
  { id: "delivery", label: "Remise des résultats", icon: Printer },
  { id: "catalog", label: "Catalogue", icon: BookOpen },
  { id: "products", label: "Réactifs", icon: Package },
] as const;
type PageId = typeof menuItems[number]["id"];
const roleMenus: Record<Role, PageId[]> = {
  accueil: ["dashboard", "patients", "prescribers", "bulletins", "delivery"],
  auxiliaire: ["dashboard", "patients", "prescribers", "bulletins", "collection"],
  technicien: ["dashboard", "collection", "results", "catalog", "products"],
  responsable: menuItems.map((item) => item.id),
};
const roleName: Record<Role, string> = { accueil: "Accueil", auxiliaire: "Auxiliaire", technicien: "Technicien", responsable: "Responsable" };
const roleTitles: Record<Role, string> = { accueil: "Agent d’accueil", auxiliaire: "Auxiliaire de laboratoire", technicien: "Technicien de laboratoire", responsable: "Responsable du laboratoire" };
const disciplines: Discipline[] = ["Hématologie", "Biochimie", "Parasitologie", "Immunologie"];
const disciplineIcon: Record<Discipline, string> = { Hématologie: "HÉ", Biochimie: "BI", Parasitologie: "PA", Immunologie: "IM" };
const disciplineTone: Record<Discipline, string> = { Hématologie: "tone-blue", Biochimie: "tone-cyan", Parasitologie: "tone-violet", Immunologie: "tone-amber" };
const initials = (text: string) => text.split(/\s+/).slice(0, 2).map((word) => word[0]).join("").toUpperCase();
const dayDelta = (date: string) => Math.ceil((new Date(`${date}T00:00:00`).getTime() - new Date(`${today()}T00:00:00`).getTime()) / 86400000);
const productAlert = (product: Product) => {
  const days = dayDelta(product.expiresAt);
  if (days < 0) return { label: "Périmé", tone: "alert-expired" };
  if (days <= 30) return { label: days === 0 ? "Expire aujourd’hui" : `Expire dans ${days} j`, tone: "alert-soon" };
  if (product.quantity <= product.minimum) return { label: "Stock bas", tone: "alert-stock" };
  return null;
};

function Field({ label, children, hint }: { label: string; children: ReactNode; hint?: string }) {
  return <label className="field"><span className="field-label">{label}</span>{children}{hint && <span className="field-hint">{hint}</span>}</label>;
}
function Modal({ title, subtitle, onClose, children, wide = false }: { title: string; subtitle?: string; onClose: () => void; children: ReactNode; wide?: boolean }) {
  return <div className="modal-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
    <section className={`modal ${wide ? "modal-wide" : ""}`} role="dialog" aria-modal="true" aria-label={title}>
      <header className="modal-head"><div><h2>{title}</h2>{subtitle && <p>{subtitle}</p>}</div><button className="icon-button" aria-label="Fermer" onClick={onClose}><X size={18} /></button></header>
      {children}
    </section>
  </div>;
}
function EmptyState({ title, description }: { title: string; description: string }) {
  return <div className="empty-state"><div className="empty-icon"><ClipboardList size={21} /></div><strong>{title}</strong><span>{description}</span></div>;
}
function StatCard({ label, value, sub, icon: Icon, tone = "blue", trend }: { label: string; value: string | number; sub: string; icon: typeof Activity; tone?: string; trend?: string }) {
  return <article className="stat-card"><div className="stat-top"><span>{label}</span><span className={`stat-icon ${tone}`}><Icon size={18} strokeWidth={1.8} /></span></div><div className="stat-value">{value}</div><div className="stat-foot"><span>{sub}</span>{trend && <span className="stat-trend"><ArrowUpRight size={13} />{trend}</span>}</div></article>;
}

export default function Home() {
  const [data, setData] = useState<LabData>(() => loadData());
  const [user, setUser] = useState<LabAccount | null>(() => loadUser());
  const [page, setPage] = useState<PageId>("dashboard");
  const [search, setSearch] = useState("");
  const [toast, setToast] = useState("");
  const [mobileNav, setMobileNav] = useState(false);
  const [modal, setModal] = useState<"patient" | "prescriber" | "bulletin" | "product-use" | null>(null);
  const [editPatient, setEditPatient] = useState<Patient | null>(null);
  const [editPrescriber, setEditPrescriber] = useState<Prescriber | null>(null);
  const [patientProfile, setPatientProfile] = useState<Patient | null>(null);
  const [selectedBulletin, setSelectedBulletin] = useState<string | null>(null);
  const [ticketQuery, setTicketQuery] = useState("");
  const [ticketSubmitted, setTicketSubmitted] = useState(false);
  const [reportBulletin, setReportBulletin] = useState<Bulletin | null>(null);
  const [catalogFilter, setCatalogFilter] = useState<Discipline | "Toutes">("Toutes");
  const [inventoryProduct, setInventoryProduct] = useState<Product | null>(null);
  const [notice, setNotice] = useState("");
  const [remoteEnabled, setRemoteEnabled] = useState(false);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    if (!remoteEnabled || !user) return;
    const timer = window.setTimeout(() => {
      fetch("/api/lab/state", { method: "PUT", credentials: "include", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ data }) })
        .then((response) => { if (!response.ok) throw new Error("Échec de synchronisation"); })
        .catch(() => setToast("Enregistrement serveur indisponible. Les modifications restent sur cet appareil."));
    }, 450);
    return () => window.clearTimeout(timer);
  }, [data, remoteEnabled, user]);
  useEffect(() => {
    const cachedUser = loadUser();
    if (!cachedUser) return;
    let active = true;
    (async () => {
      try {
        const sessionResponse = await fetch("/api/lab/me", { credentials: "include" });
        if (!sessionResponse.ok) { sessionStorage.removeItem(SESSION_KEY); if (active) setUser(null); return; }
        const session = await sessionResponse.json() as { user: LabAccount };
        if (!active) return;
        sessionStorage.setItem(SESSION_KEY, JSON.stringify(session.user));
        setUser(session.user);
        const stateResponse = await fetch("/api/lab/state", { credentials: "include" });
        if (stateResponse.ok) {
          const saved = await stateResponse.json() as { data: LabData };
          if (active) { setData(saved.data); setRemoteEnabled(true); }
        }
      } catch { if (active) setRemoteEnabled(false); }
    })();
    return () => { active = false; };
  }, []);
  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(""), 3200);
    return () => window.clearTimeout(timer);
  }, [toast]);
  const visibleItems = useMemo(() => menuItems.filter((item) => user && roleMenus[user.role].includes(item.id)), [user]);
  const currentTitle = menuItems.find((item) => item.id === page)?.label ?? "Tableau de bord";
  const countToday = (status: BulletinStatus) => data.bulletins.filter((bulletin) => bulletin.createdAt.slice(0, 10) === today() && bulletin.status === status).length;
  const activeStatuses = statusSequence.map((status) => ({ status, count: countToday(status) }));
  const readyBulletins = data.bulletins.filter((bulletin) => bulletin.status === "Résultats saisis").slice(0, 5);
  const monitoredProducts = data.products.filter((product) => productAlert(product)).sort((a, b) => dayDelta(a.expiresAt) - dayDelta(b.expiresAt));
  const selected = data.bulletins.find((bulletin) => bulletin.id === selectedBulletin) ?? null;
  const selectedPatient = data.patients.find((patient) => patient.id === patientProfile?.id) ?? patientProfile;
  const foundTicket = ticketSubmitted && ticketQuery.trim() ? data.bulletins.find((bulletin) => bulletin.ticket.toLowerCase() === ticketQuery.trim().toLowerCase()) ?? null : null;

  function updateData(reducer: (current: LabData) => LabData) { setData((current) => reducer(current)); }
  function ping(message: string) { setToast(message); }
  function navigate(next: PageId) { setPage(next); setSearch(""); setMobileNav(false); setSelectedBulletin(null); }
  async function logout() {
    await fetch("/api/lab/logout", { method: "POST", credentials: "include" }).catch(() => undefined);
    sessionStorage.removeItem(SESSION_KEY); setUser(null); setRemoteEnabled(false); setPage("dashboard");
  }
  async function login(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const username = String(form.get("username") ?? "").trim().toLowerCase();
    const password = String(form.get("password") ?? "");
    try {
      const response = await fetch("/api/lab/login", { method: "POST", credentials: "include", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ username, password }) });
      if (response.ok) {
        const payload = await response.json() as { user?: LabAccount; error?: string };
        if (payload.user) {
          const account = payload.user;
          sessionStorage.setItem(SESSION_KEY, JSON.stringify(account));
          try {
            const stateResponse = await fetch("/api/lab/state", { credentials: "include" });
            if (stateResponse.ok) {
              const saved = await stateResponse.json() as { data: LabData };
              setData(saved.data); setRemoteEnabled(true);
            }
          } catch { /* use local state */ }
          setUser(account); setPage("dashboard");
          return;
        }
      }
    } catch { /* proceed to local fallback below */ }

    // Mode démonstration résilient : si le serveur ou la base est indisponible (déploiement Vercel),
    // connexion directe avec les comptes de démonstration intégrés
    const demo = demoAccounts.find((a) => a.username.toLowerCase() === username);
    if (demo && password === "Ayame2026!") {
      sessionStorage.setItem(SESSION_KEY, JSON.stringify(demo));
      setUser(demo);
      setRemoteEnabled(false);
      setPage("dashboard");
      return;
    }

    setNotice("Identifiant ou mot de passe incorrect.");
  }
  function pickAccount(username: string) {
    const userField = document.querySelector<HTMLInputElement>("#username");
    const passwordField = document.querySelector<HTMLInputElement>("#password");
    if (userField) userField.value = username;
    if (passwordField) passwordField.value = "Ayame2026!";
    setNotice("");
  }
  function addPatient(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const type = String(form.get("type")) as PatientType;
    const dossier = String(form.get("numeroDossier") ?? "").trim();
    const lit = String(form.get("lit") ?? "").trim();
    if (type === "Hospitalisé" && (!dossier || !lit)) { setNotice("Le numéro de dossier et le numéro de lit sont obligatoires pour un patient hospitalisé."); return; }
    const patient: Patient = {
      id: editPatient?.id ?? `pat-${Date.now()}`, code: editPatient?.code ?? `AY-${String(data.patients.length + 1).padStart(5, "0")}`,
      nom: String(form.get("nom") ?? "").trim(), prenoms: String(form.get("prenoms") ?? "").trim(),
      sexe: String(form.get("sexe")) as "F" | "M", dateNaissance: String(form.get("dateNaissance") ?? ""),
      telephone: String(form.get("telephone") ?? "").trim(), type,
      ...(type === "Hospitalisé" ? { numeroDossier: dossier, lit } : {}), createdAt: editPatient?.createdAt ?? today(),
    };
    if (!patient.nom || !patient.prenoms) { setNotice("Le nom et les prénoms sont obligatoires."); return; }
    updateData((current) => ({ ...current, patients: editPatient ? current.patients.map((item) => item.id === editPatient.id ? patient : item) : [patient, ...current.patients] }));
    setModal(null); setEditPatient(null); setNotice(""); ping(editPatient ? "Fiche patient mise à jour." : "Patient enregistré.");
  }
  function addPrescriber(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const item: Prescriber = { id: editPrescriber?.id ?? `pres-${Date.now()}`, nom: String(form.get("nom") ?? "").trim(), prenoms: String(form.get("prenoms") ?? "").trim(), specialite: String(form.get("specialite") ?? "").trim() };
    if (!item.nom || !item.prenoms || !item.specialite) { setNotice("Tous les champs sont obligatoires."); return; }
    updateData((current) => ({ ...current, prescribers: editPrescriber ? current.prescribers.map((row) => row.id === item.id ? item : row) : [item, ...current.prescribers] }));
    setModal(null); setEditPrescriber(null); setNotice(""); ping(editPrescriber ? "Prescripteur mis à jour." : "Prescripteur ajouté.");
  }
  function createBulletin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const analysisIds = form.getAll("analysisIds").map(String);
    const patientId = String(form.get("patientId") ?? "");
    const prescriberId = String(form.get("prescriberId") ?? "");
    const motif = String(form.get("motif") ?? "").trim();
    if (!patientId || !prescriberId || analysisIds.length < 1 || !motif) { setNotice("Complétez le patient, le prescripteur, le motif et au moins un type d’analyse."); return; }
    const dayCode = today().slice(2).replaceAll("-", "");
    const serial = String(data.bulletins.filter((item) => item.ticket.includes(dayCode)).length + 1).padStart(4, "0");
    const ticket = `AY-${dayCode}-${serial}`;
    const bulletin: Bulletin = { id: `bul-${Date.now()}`, ticket, patientId, prescriberId, analysisIds, motif, createdAt: new Date().toISOString(), status: "Enregistré", results: {} };
    updateData((current) => ({ ...current, bulletins: [bulletin, ...current.bulletins] }));
    setModal(null); setNotice(""); ping(`Bulletin créé · Ticket ${ticket}`); setPage("bulletins"); setReportBulletin(bulletin);
  }
  function advanceStatus(bulletin: Bulletin, next: BulletinStatus) {
    const allowed = statusSequence.indexOf(next) === statusSequence.indexOf(bulletin.status) + 1;
    if (!allowed) return;
    updateData((current) => ({ ...current, bulletins: current.bulletins.map((row) => row.id === bulletin.id ? { ...row, status: next } : row) }));
    ping(`Ticket ${bulletin.ticket} · ${next.toLowerCase()}`);
  }
  function resultParameters(bulletin: Bulletin): { analysis: AnalysisType; parameter: AnalysisType["parameters"][number] }[] {
    return bulletin.analysisIds.flatMap((id) => {
      const analysis = data.analyses.find((item) => item.id === id);
      return analysis ? analysis.parameters.map((parameter) => ({ analysis, parameter })) : [];
    });
  }
  function saveResults(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selected || !user) return;
    const form = new FormData(event.currentTarget);
    const technicianId = data.technicians.find((technician) => `${technician.prenoms} ${technician.nom}`.toLowerCase() === user.name.toLowerCase())?.id ?? data.technicians[0]?.id;
    if (!technicianId) { setNotice("Aucun technicien n’est associé à la saisie."); return; }
    const resultEntries: Record<string, ResultValue> = { ...selected.results };
    for (const { parameter } of resultParameters(selected)) {
      const raw = String(form.get(parameter.id) ?? "").replace(",", ".");
      if (raw.trim() === "") { setNotice(`Saisissez une valeur pour « ${parameter.name} ».`); return; }
      const value = Number(raw);
      if (!Number.isFinite(value)) { setNotice(`Valeur invalide pour « ${parameter.name} ».`); return; }
      for (const productId of parameter.productIds) {
        const product = data.products.find((item) => item.id === productId);
        if (!product) continue;
        if (dayDelta(product.expiresAt) < 0) {
          setNotice(`Saisie refusée : le réactif « ${product.name} » (lot ${product.lot}) est périmé.`);
          return;
        }
      }
      const interpretation: Interpretation = value < parameter.min ? "Inférieur" : value > parameter.max ? "Supérieur" : "Normal";
      resultEntries[parameter.id] = { value, unit: parameter.unit, min: parameter.min, max: parameter.max, interpretation, technicianId, enteredAt: new Date().toISOString() };
    }
    const consumption = resultParameters(selected).flatMap(({ parameter }) => parameter.productIds);
    const requiredPerProduct = new Map<string, number>();
    for (const productId of consumption) requiredPerProduct.set(productId, (requiredPerProduct.get(productId) ?? 0) + 1);
    for (const [productId, required] of requiredPerProduct) {
      const product = data.products.find((item) => item.id === productId);
      if (product && product.quantity < required) {
        setNotice(`Saisie refusée : stock insuffisant pour « ${product.name} » (lot ${product.lot}). Disponible : ${product.quantity} ${product.unit} ; requis : ${required}.`);
        return;
      }
    }
    updateData((current) => ({
      ...current,
      bulletins: current.bulletins.map((row) => row.id === selected.id ? { ...row, results: resultEntries, status: "Résultats saisis" } : row),
      products: current.products.map((product) => {
        const used = consumption.filter((id) => id === product.id).length;
        return used > 0 ? { ...product, quantity: Number(Math.max(0, product.quantity - used).toFixed(2)) } : product;
      }),
    }));
    setSelectedBulletin(null); setNotice(""); ping("Résultats enregistrés. Bulletin prêt à remettre.");
  }
  function changeProductStock(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!inventoryProduct) return;
    const quantity = Number(new FormData(event.currentTarget).get("quantity"));
    const latest = data.products.find((product) => product.id === inventoryProduct.id)!;
    if (dayDelta(latest.expiresAt) < 0) { setNotice("Utilisation refusée : ce produit est périmé."); return; }
    if (!Number.isFinite(quantity) || quantity <= 0 || quantity > latest.quantity) { setNotice("La quantité doit être positive et ne pas dépasser le stock disponible."); return; }
    updateData((current) => ({ ...current, products: current.products.map((product) => product.id === latest.id ? { ...product, quantity: Number((product.quantity - quantity).toFixed(2)) } : product) }));
    setModal(null); setInventoryProduct(null); setNotice(""); ping(`Stock mis à jour · ${quantity} ${latest.unit} utilisés.`);
  }
  function printDocument(bulletin: Bulletin) { setReportBulletin(bulletin); window.setTimeout(() => window.print(), 80); }

  if (!user) return <Login onSubmit={login} onPick={pickAccount} notice={notice} />;

  const filteredPatients = data.patients.filter((patient) => `${patient.code} ${patient.nom} ${patient.prenoms} ${patient.numeroDossier ?? ""}`.toLowerCase().includes(search.toLowerCase()));
  const filteredBulletins = [...data.bulletins].filter((bulletin) => {
    const patient = data.patients.find((row) => row.id === bulletin.patientId);
    return `${bulletin.ticket} ${patientName(patient)} ${bulletin.motif} ${bulletin.status}`.toLowerCase().includes(search.toLowerCase());
  }).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  const filteredPrescribers = data.prescribers.filter((item) => `${item.nom} ${item.prenoms} ${item.specialite}`.toLowerCase().includes(search.toLowerCase()));
  const currentMonth = new Date().toISOString().slice(0, 7);
  const collectionItems = data.bulletins.filter((item) => item.status === "Enregistré" || item.status === "Prélevé").sort((a, b) => a.createdAt.localeCompare(b.createdAt));
  const resultItems = data.bulletins.filter((item) => item.status === "En analyse" || item.status === "Résultats saisis").sort((a, b) => a.createdAt.localeCompare(b.createdAt));
  const productItems = data.products.filter((product) => `${product.name} ${product.lot} ${product.supplier}`.toLowerCase().includes(search.toLowerCase()));

  return <>
    <div className="app-shell">
      <aside className={`sidebar ${mobileNav ? "sidebar-open" : ""}`}>
        <div className="brand"><div className="brand-symbol"><img src={BRAND_MARK} alt="" /></div><div className="brand-copy"><strong>AYALAB</strong><span>Laboratoire EPHD d’Ayamé</span></div><button className="mobile-close icon-button" onClick={() => setMobileNav(false)} aria-label="Fermer le menu"><X size={17} /></button></div>
        <div className="sidebar-label">ESPACE DE TRAVAIL</div>
        <nav className="main-nav" aria-label="Navigation principale">
          {visibleItems.map((item) => {
            const Icon = item.icon;
            const count = item.id === "delivery" ? data.bulletins.filter((b) => b.status === "Résultats saisis").length : item.id === "collection" ? collectionItems.length : 0;
            return <button key={item.id} className={`nav-item ${page === item.id ? "nav-active" : ""}`} onClick={() => navigate(item.id)}><Icon size={18} strokeWidth={1.8} /><span>{item.label}</span>{count > 0 && <em className="nav-count">{count}</em>}</button>;
          })}
        </nav>
        <div className="sidebar-bottom"><div className="side-status"><span className="status-dot" /><span>Environnement de démonstration</span></div><div className="sidebar-footer"><span>EPHD · Ayamé</span><span>v1.0</span></div></div>
      </aside>
      {mobileNav && <button className="mobile-scrim" aria-label="Fermer le menu" onClick={() => setMobileNav(false)} />}
      <main className="main-area">
        <header className="topbar"><div className="topbar-left"><button className="mobile-menu icon-button" aria-label="Ouvrir le menu" onClick={() => setMobileNav(true)}><Menu size={19} /></button><div className="crumb">Laboratoire <ChevronRight size={14} /> <strong>{currentTitle}</strong></div></div><div className="topbar-actions"><span className="today-chip"><CalendarDays size={14} />{new Intl.DateTimeFormat("fr-FR", { weekday: "long", day: "numeric", month: "long" }).format(new Date())}</span><button className="icon-button notification-button" title="Notifications" onClick={() => navigate("products")}><Bell size={17} />{monitoredProducts.length > 0 && <i />}</button><div className="user-divider" /><div className="user-menu"><div className="user-avatar">{user.initials}</div><div className="user-identity"><strong>{user.name}</strong><span>{roleTitles[user.role]}</span></div><button className="logout-button" onClick={logout} title="Déconnexion"><LogOut size={16} /></button></div></div></header>
        <div className="workspace">
          <div className="page-heading"><div><div className="eyebrow">LABORATOIRE · EPHD D’AYAMÉ</div><h1>{currentTitle}</h1><p>{pageSubtitle(page)}</p></div><div className="heading-actions">
            {page === "patients" && <button className="button button-primary" onClick={() => { setEditPatient(null); setNotice(""); setModal("patient"); }}><Plus size={16} />Nouveau patient</button>}
            {page === "prescribers" && <button className="button button-primary" onClick={() => { setEditPrescriber(null); setNotice(""); setModal("prescriber"); }}><Plus size={16} />Nouveau prescripteur</button>}
            {page === "bulletins" && <button className="button button-primary" onClick={() => { setNotice(""); setModal("bulletin"); }}><FilePlus2 size={16} />Nouveau bulletin</button>}
            {page === "products" && <button className="button button-outline" onClick={() => { setInventoryProduct(data.products[0] ?? null); setNotice(""); setModal("product-use"); }}><Minus size={15} />Enregistrer une utilisation</button>}
          </div></div>

          {page === "dashboard" && <Dashboard data={data} statuses={activeStatuses} ready={readyBulletins} monitored={monitoredProducts} onNavigate={navigate} onOpenTicket={(bulletin) => { setPage("delivery"); setTicketQuery(bulletin.ticket); setTicketSubmitted(true); }} />}

          {page === "patients" && <section className="panel"><div className="panel-toolbar"><div><h2>Dossiers patients</h2><span>{data.patients.length} patients enregistrés</span></div><SearchBox value={search} onChange={setSearch} placeholder="Nom, code, numéro de dossier…" /></div><div className="table-wrap"><table><thead><tr><th>Patient</th><th>Code</th><th>Profil</th><th>Contact</th><th>Dernière analyse</th><th /></tr></thead><tbody>{filteredPatients.map((patient) => {
            const history = data.bulletins.filter((b) => b.patientId === patient.id).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
            return <tr key={patient.id} className="clickable-row" onClick={() => setPatientProfile(patient)}><td><div className="person-cell"><div className={`person-avatar ${patient.sexe === "F" ? "avatar-rose" : "avatar-blue"}`}>{initials(`${patient.prenoms} ${patient.nom}`)}</div><div><strong>{patient.prenoms} {patient.nom}</strong><small>{patient.sexe === "F" ? "Femme" : "Homme"} · {ageFromBirth(patient.dateNaissance)} ans</small></div></div></td><td className="mono">{patient.code}</td><td><span className={`type-tag ${patient.type === "Hospitalisé" ? "tag-inpatient" : "tag-outpatient"}`}>{patient.type}</span>{patient.type === "Hospitalisé" && <small className="cell-sub">Lit {patient.lit} · {patient.numeroDossier}</small>}</td><td className="muted-cell">{patient.telephone || "—"}</td><td>{history[0] ? <><strong className="small-strong">{history[0].ticket}</strong><small className="cell-sub">{fmtDate(history[0].createdAt)}</small></> : <span className="muted-cell">Aucune analyse</span>}</td><td><button className="row-action" title="Modifier la fiche" onClick={(event) => { event.stopPropagation(); setEditPatient(patient); setNotice(""); setModal("patient"); }}><ChevronRight size={17} /></button></td></tr>;
          })}</tbody></table>{filteredPatients.length === 0 && <EmptyState title="Aucun patient trouvé" description="Modifiez les critères de recherche." />}</div></section>}

          {page === "prescribers" && <section className="panel"><div className="panel-toolbar"><div><h2>Prescripteurs</h2><span>{data.prescribers.length} correspondants médicaux</span></div><SearchBox value={search} onChange={setSearch} placeholder="Rechercher un prescripteur…" /></div><div className="table-wrap"><table><thead><tr><th>Nom et prénoms</th><th>Spécialité</th><th>Bulletins ce mois</th><th /></tr></thead><tbody>{filteredPrescribers.map((item) => <tr key={item.id}><td><div className="person-cell"><div className="person-avatar avatar-blue">{initials(`${item.prenoms} ${item.nom}`)}</div><div><strong>Dr {item.prenoms} {item.nom}</strong><small>Prescripteur référent</small></div></div></td><td><span className="specialty-tag">{item.specialite}</span></td><td>{data.bulletins.filter((b) => b.prescriberId === item.id && b.createdAt.slice(0, 7) === currentMonth).length}</td><td><button className="row-action" title="Modifier" onClick={() => { setEditPrescriber(item); setNotice(""); setModal("prescriber"); }}><ChevronRight size={17} /></button></td></tr>)}</tbody></table>{filteredPrescribers.length === 0 && <EmptyState title="Aucun prescripteur trouvé" description="Modifiez les critères de recherche." />}</div></section>}

          {page === "bulletins" && <section className="panel"><div className="panel-toolbar"><div><h2>Registre des bulletins</h2><span>{filteredBulletins.length} dossiers · triés par date de réception</span></div><SearchBox value={search} onChange={setSearch} placeholder="Ticket, patient, motif, statut…" /></div><div className="table-wrap"><table><thead><tr><th>N° ticket / reçu</th><th>Patient</th><th>Analyses</th><th>Prescripteur</th><th>Statut</th><th>Motif</th><th /></tr></thead><tbody>{filteredBulletins.map((bulletin) => <tr key={bulletin.id}><td><strong className="mono ticket-link">{bulletin.ticket}</strong><small className="cell-sub">{fmtDate(bulletin.createdAt, { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}</small></td><td><strong>{patientName(data.patients.find((p) => p.id === bulletin.patientId))}</strong><small className="cell-sub">{data.patients.find((p) => p.id === bulletin.patientId)?.code ?? ""}</small></td><td><div className="analysis-chips">{bulletin.analysisIds.map((id) => <span key={id}>{shortAnalysis(data.analyses.find((a) => a.id === id)?.name ?? "Analyse")}</span>)}</div></td><td>{prescriberName(data.prescribers.find((p) => p.id === bulletin.prescriberId))}</td><td><span className={statusClass(bulletin.status)}>{bulletin.status}</span></td><td className="muted-cell motif-cell">{bulletin.motif}</td><td><button className="row-action" title="Imprimer le ticket" onClick={() => printDocument(bulletin)}><Printer size={16} /></button></td></tr>)}</tbody></table>{filteredBulletins.length === 0 && <EmptyState title="Aucun bulletin trouvé" description="Aucun résultat pour cette recherche." />}</div><div className="panel-foot"><span>Affichage de {filteredBulletins.length} bulletins</span><span>Tickets uniques · EPHD Ayamé</span></div></section>}

          {page === "collection" && <div className="section-stack"><div className="section-intro"><div><h2>File de prélèvement</h2><p>Enregistrez la réception des échantillons puis leur entrée en analyse.</p></div><span className="small-count">{collectionItems.length} à traiter</span></div><section className="panel"><div className="table-wrap"><table><thead><tr><th>Ticket</th><th>Patient</th><th>Analyses prescrites</th><th>Heure</th><th>Étape actuelle</th><th>Action</th></tr></thead><tbody>{collectionItems.map((bulletin) => <tr key={bulletin.id}><td><strong className="mono ticket-link">{bulletin.ticket}</strong></td><td><strong>{patientName(data.patients.find((p) => p.id === bulletin.patientId))}</strong><small className="cell-sub">{data.patients.find((p) => p.id === bulletin.patientId)?.type}</small></td><td>{bulletin.analysisIds.map((id) => data.analyses.find((a) => a.id === id)?.name).join(" · ")}</td><td>{fmtDate(bulletin.createdAt, { hour: "2-digit", minute: "2-digit" })}</td><td><span className={statusClass(bulletin.status)}>{bulletin.status}</span></td><td>{bulletin.status === "Enregistré" ? <button className="button button-outline button-small" onClick={() => advanceStatus(bulletin, "Prélevé")}><Check size={14} />Confirmer prélèvement</button> : <button className="button button-primary button-small" onClick={() => advanceStatus(bulletin, "En analyse")}><ArrowRight size={14} />Démarrer l’analyse</button>}</td></tr>)}</tbody></table>{collectionItems.length === 0 && <EmptyState title="File de prélèvement vide" description="Aucun bulletin en attente de prélèvement." />}</div></section><div className="info-note"><Activity size={16} /><span>Les bulletins suivent un circuit séquentiel : Enregistré, Prélevé, En analyse, Résultats saisis, Remis.</span></div></div>}

          {page === "results" && <div className="section-stack"><div className="section-intro"><div><h2>Résultats à traiter</h2><p>Sélectionnez un bulletin en cours d’analyse pour saisir les valeurs mesurées.</p></div><span className="small-count">{resultItems.filter((item) => item.status === "En analyse").length} en analyse</span></div>{selected ? <section className="panel results-panel"><div className="result-patient-head"><button className="text-button" onClick={() => setSelectedBulletin(null)}><ArrowRight className="back-arrow" size={15} />Retour à la file</button><div className="result-banner"><div><div className="eyebrow">TICKET {selected.ticket}</div><h2>{patientName(data.patients.find((p) => p.id === selected.patientId))}</h2><span>{data.patients.find((p) => p.id === selected.patientId)?.code} · {data.patients.find((p) => p.id === selected.patientId)?.sexe === "F" ? "Femme" : "Homme"} · {fmtDate(data.patients.find((p) => p.id === selected.patientId)?.dateNaissance ?? "")}</span></div><span className={statusClass(selected.status)}>{selected.status}</span></div></div><form onSubmit={saveResults} className="results-form">{resultParameters(selected).map(({ analysis, parameter }) => <div className="result-row" key={parameter.id}><div className="result-param"><div className={`discipline-mark ${disciplineTone[analysis.discipline]}`}>{disciplineIcon[analysis.discipline]}</div><div><strong>{parameter.name}</strong><small>{analysis.name}</small></div></div><div className="result-input-wrap"><input aria-label={`Valeur ${parameter.name}`} name={parameter.id} type="number" step="any" defaultValue={selected.results[parameter.id]?.value ?? ""} placeholder="—" onChange={(event) => { const value = Number(event.currentTarget.value); const badge = event.currentTarget.closest(".result-row")?.querySelector(".live-interpretation"); if (event.currentTarget.value && Number.isFinite(value) && badge) { const interpretation = value < parameter.min ? "Inférieur" : value > parameter.max ? "Supérieur" : "Normal"; badge.textContent = interpretation; badge.className = `status live-interpretation ${interpretation === "Normal" ? "status-green" : "status-amber"}`; } }} /><span>{parameter.unit}</span></div><div className="reference-value">{parameter.min} – {parameter.max} <span>{parameter.unit}</span></div><span className={`status live-interpretation ${selected.results[parameter.id] ? selected.results[parameter.id].interpretation === "Normal" ? "status-green" : "status-amber" : "status-gray"}`}>{selected.results[parameter.id]?.interpretation ?? "À saisir"}</span></div>)}<div className="results-footer"><div className="info-note compact"><ShieldCheck size={16} /><span>L’interprétation est calculée automatiquement à partir des valeurs de référence.</span></div><button className="button button-primary" type="submit"><Check size={16} />Valider les résultats</button></div>{notice && <div className="inline-error">{notice}</div>}</form></section> : <section className="panel"><div className="table-wrap"><table><thead><tr><th>Ticket</th><th>Patient</th><th>Analyse</th><th>Réception</th><th>Statut</th><th /></tr></thead><tbody>{resultItems.map((bulletin) => <tr key={bulletin.id}><td><strong className="mono ticket-link">{bulletin.ticket}</strong></td><td>{patientName(data.patients.find((p) => p.id === bulletin.patientId))}</td><td>{bulletin.analysisIds.map((id) => data.analyses.find((a) => a.id === id)?.name).join(" · ")}</td><td>{fmtDate(bulletin.createdAt, { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}</td><td><span className={statusClass(bulletin.status)}>{bulletin.status}</span></td><td>{bulletin.status === "En analyse" ? <button className="button button-outline button-small" onClick={() => { setSelectedBulletin(bulletin.id); setNotice(""); }}><FileCheck2 size={14} />Saisir les résultats</button> : <span className="muted-cell">Résultats complets</span>}</td></tr>)}</tbody></table>{resultItems.length === 0 && <EmptyState title="Aucun résultat à saisir" description="Les bulletins en cours apparaîtront ici." />}</div></section>}</div>}

          {page === "delivery" && <div className="section-stack"><section className="lookup-panel"><div className="lookup-icon"><FileCheck2 size={21} /></div><div className="lookup-copy"><h2>Rechercher un ticket</h2><p>Saisissez le numéro figurant sur le ticket de retrait du patient.</p></div><form className="lookup-form" onSubmit={(event) => { event.preventDefault(); setTicketSubmitted(true); }}><div className="lookup-input"><Search size={17} /><input value={ticketQuery} onChange={(event) => { setTicketQuery(event.target.value); setTicketSubmitted(false); }} placeholder="Ex. AY-261019-0001" aria-label="Numéro de ticket" /></div><button className="button button-primary" type="submit">Rechercher</button></form></section>{ticketSubmitted && (!ticketQuery.trim() || !foundTicket) && <div className="lookup-error"><AlertTriangle size={17} /><div><strong>Ticket introuvable</strong><span>Vérifiez le numéro saisi. Aucun bulletin ne correspond à ce ticket.</span></div></div>}{foundTicket && <DeliveryResult bulletin={foundTicket} data={data} onDeliver={() => { advanceStatus(foundTicket, "Remis"); setReportBulletin({ ...foundTicket, status: "Remis" }); }} onPrint={() => printDocument(foundTicket)} />}{!ticketSubmitted && <section className="panel"><div className="panel-toolbar"><div><h2>Résultats prêts à remettre</h2><span>{data.bulletins.filter((b) => b.status === "Résultats saisis").length} bulletins en attente du patient</span></div></div><div className="table-wrap"><table><thead><tr><th>Ticket</th><th>Patient</th><th>Analyses</th><th>Date de saisie</th><th /></tr></thead><tbody>{data.bulletins.filter((b) => b.status === "Résultats saisis").slice(0, 8).map((bulletin) => <tr key={bulletin.id}><td><strong className="mono ticket-link">{bulletin.ticket}</strong></td><td>{patientName(data.patients.find((p) => p.id === bulletin.patientId))}</td><td>{bulletin.analysisIds.map((id) => shortAnalysis(data.analyses.find((a) => a.id === id)?.name ?? "Analyse")).join(" · ")}</td><td>{fmtDate(bulletin.createdAt)}</td><td><button className="button button-outline button-small" onClick={() => { setTicketQuery(bulletin.ticket); setTicketSubmitted(true); }}><Search size={14} />Ouvrir</button></td></tr>)}</tbody></table></div></section>}</div>}

          {page === "catalog" && <div className="section-stack"><div className="section-intro"><div><h2>Catalogue des analyses</h2><p>Examens, paramètres, unités et valeurs de référence.</p></div><span className="small-count">{data.analyses.length} examens · {data.analyses.reduce((count, item) => count + item.parameters.length, 0)} paramètres</span></div><div className="filter-tabs"><button className={catalogFilter === "Toutes" ? "filter-active" : ""} onClick={() => setCatalogFilter("Toutes")}>Toutes</button>{disciplines.map((discipline) => <button key={discipline} className={catalogFilter === discipline ? "filter-active" : ""} onClick={() => setCatalogFilter(discipline)}>{discipline}</button>)}</div><div className="catalog-grid">{data.analyses.filter((analysis) => catalogFilter === "Toutes" || analysis.discipline === catalogFilter).map((analysis) => <article className="catalog-card" key={analysis.id}><div className="catalog-card-top"><div className={`discipline-mark ${disciplineTone[analysis.discipline]}`}>{disciplineIcon[analysis.discipline]}</div><span className={`specialty-tag ${disciplineTone[analysis.discipline]}`}>{analysis.discipline}</span></div><h3>{analysis.name}</h3><div className="catalog-meta"><span><Clock3 size={13} />Délai indicatif {analysis.turnaround}</span><span>{analysis.parameters.length} paramètres</span></div><div className="catalog-parameters">{analysis.parameters.map((parameter) => <div className="catalog-parameter" key={parameter.id}><div><strong>{parameter.name}</strong><small>Référence : {parameter.min} – {parameter.max} {parameter.unit}</small></div><div className="parameter-products">{parameter.productIds.map((id) => <span key={id}>{data.products.find((product) => product.id === id)?.name.split(" ").slice(0, 2).join(" ") ?? "Réactif"}</span>)}</div></div>)}</div></article>)}</div></div>}

          {page === "products" && <div className="section-stack"><div className="inventory-alert-strip"><div className="inventory-alert-icon"><AlertTriangle size={18} /></div><div><strong>{monitoredProducts.length} produits nécessitent une surveillance</strong><span>Contrôlez les dates de péremption et les seuils de stock avant utilisation.</span></div><span className="inventory-alert-number">{monitoredProducts.length}</span></div><section className="panel"><div className="panel-toolbar"><div><h2>Stock des réactifs</h2><span>{data.products.length} références · mis à jour localement</span></div><SearchBox value={search} onChange={setSearch} placeholder="Produit, lot, fournisseur…" /></div><div className="table-wrap"><table><thead><tr><th>Produit / lot</th><th>Stock disponible</th><th>Date d’ouverture</th><th>Péremption</th><th>Fournisseur</th><th>État</th><th /></tr></thead><tbody>{productItems.map((product) => {
            const alert = productAlert(product);
            return <tr key={product.id}><td><strong>{product.name}</strong><small className="cell-sub mono">Lot {product.lot}</small></td><td><strong className={product.quantity <= product.minimum ? "stock-low" : ""}>{product.quantity}</strong> <span className="muted-cell">{product.unit}</span><small className="cell-sub">Seuil : {product.minimum} {product.unit}</small></td><td>{fmtDate(product.openedAt)}</td><td className={dayDelta(product.expiresAt) <= 30 ? "expiry-near" : ""}>{fmtDate(product.expiresAt)}</td><td className="muted-cell">{product.supplier}</td><td>{alert ? <span className={`product-alert ${alert.tone}`}><span />{alert.label}</span> : <span className="product-alert alert-ok"><span />Conforme</span>}</td><td><button className="row-action" title={dayDelta(product.expiresAt) < 0 ? "Produit périmé — utilisation interdite" : "Enregistrer une utilisation"} disabled={dayDelta(product.expiresAt) < 0 || product.quantity <= 0} onClick={() => { setInventoryProduct(product); setNotice(""); setModal("product-use"); }}><Minus size={16} /></button></td></tr>;
          })}</tbody></table>{productItems.length === 0 && <EmptyState title="Aucun produit trouvé" description="Modifiez les critères de recherche." />}</div><div className="panel-foot"><span>Produit périmé : utilisation bloquée</span><span>Stock décrémenté après chaque utilisation</span></div></section></div>}
        </div>
      </main>
    </div>

    {modal === "patient" && <Modal title={editPatient ? "Modifier la fiche patient" : "Nouveau patient"} subtitle="Les champs marqués d’un astérisque sont obligatoires." onClose={() => { setModal(null); setEditPatient(null); setNotice(""); }}><form className="form-body" onSubmit={addPatient}><div className="form-grid two"><Field label="Nom *"><input name="nom" required defaultValue={editPatient?.nom ?? ""} placeholder="Nom de famille" /></Field><Field label="Prénoms *"><input name="prenoms" required defaultValue={editPatient?.prenoms ?? ""} placeholder="Prénoms" /></Field><Field label="Sexe *"><select name="sexe" defaultValue={editPatient?.sexe ?? "F"}><option value="F">Femme</option><option value="M">Homme</option></select></Field><Field label="Date de naissance"><input name="dateNaissance" type="date" defaultValue={editPatient?.dateNaissance ?? ""} /></Field><Field label="Téléphone"><input name="telephone" defaultValue={editPatient?.telephone ?? ""} placeholder="07 00 00 00 00" /></Field><Field label="Type de patient *"><select name="type" defaultValue={editPatient?.type ?? "Externe"} onChange={(event) => { const fields = document.querySelector<HTMLElement>("#hospital-fields"); if (fields) fields.hidden = event.target.value !== "Hospitalisé"; }}><option>Externe</option><option>Hospitalisé</option></select></Field></div><div className="form-grid two hospital-fields" id="hospital-fields" hidden={editPatient?.type !== "Hospitalisé"}><Field label="Numéro de dossier *"><input name="numeroDossier" defaultValue={editPatient?.numeroDossier ?? ""} placeholder="D-AY-00000" /></Field><Field label="Numéro de lit *"><input name="lit" defaultValue={editPatient?.lit ?? ""} placeholder="Ex. L12" /></Field></div>{notice && <div className="inline-error">{notice}</div>}<div className="modal-actions"><button type="button" className="button button-ghost" onClick={() => { setModal(null); setEditPatient(null); }}>Annuler</button><button className="button button-primary" type="submit"><Check size={15} />{editPatient ? "Enregistrer les modifications" : "Créer la fiche"}</button></div></form></Modal>}
    {modal === "prescriber" && <Modal title={editPrescriber ? "Modifier le prescripteur" : "Nouveau prescripteur"} subtitle="Informations du correspondant médical." onClose={() => { setModal(null); setEditPrescriber(null); setNotice(""); }}><form className="form-body" onSubmit={addPrescriber}><div className="form-grid"><Field label="Nom *"><input name="nom" required defaultValue={editPrescriber?.nom ?? ""} placeholder="Nom" /></Field><Field label="Prénoms *"><input name="prenoms" required defaultValue={editPrescriber?.prenoms ?? ""} placeholder="Prénoms" /></Field><Field label="Spécialité *"><input name="specialite" required defaultValue={editPrescriber?.specialite ?? ""} placeholder="Ex. Médecine générale" /></Field></div>{notice && <div className="inline-error">{notice}</div>}<div className="modal-actions"><button type="button" className="button button-ghost" onClick={() => setModal(null)}>Annuler</button><button className="button button-primary" type="submit"><Check size={15} />Enregistrer</button></div></form></Modal>}
    {modal === "bulletin" && <Modal title="Nouveau bulletin d’analyse" subtitle="L’enregistrement génère un ticket unique et un reçu de retrait." onClose={() => { setModal(null); setNotice(""); }} wide><form className="form-body" onSubmit={createBulletin}><div className="form-grid two"><Field label="Patient *"><select name="patientId" required defaultValue=""><option value="" disabled>Choisir un patient</option>{data.patients.map((patient) => <option key={patient.id} value={patient.id}>{patient.prenoms} {patient.nom} · {patient.code}{patient.type === "Hospitalisé" ? ` · Lit ${patient.lit}` : ""}</option>)}</select></Field><Field label="Prescripteur *"><select name="prescriberId" required defaultValue=""><option value="" disabled>Choisir un prescripteur</option>{data.prescribers.map((prescriber) => <option key={prescriber.id} value={prescriber.id}>Dr {prescriber.prenoms} {prescriber.nom} · {prescriber.specialite}</option>)}</select></Field></div><Field label="Motif de l’examen *"><input name="motif" required placeholder="Motif clinique ou renseignement utile" /></Field><div className="field"><span className="field-label">Types d’analyse * <small>(sélection multiple)</small></span><div className="analysis-select-grid">{data.analyses.map((analysis) => <label key={analysis.id} className="analysis-select"><input type="checkbox" name="analysisIds" value={analysis.id} /><span className={`discipline-mark ${disciplineTone[analysis.discipline]}`}>{disciplineIcon[analysis.discipline]}</span><span><strong>{analysis.name}</strong><small>{analysis.discipline} · {analysis.turnaround}</small></span><Check size={15} /></label>)}</div></div>{notice && <div className="inline-error">{notice}</div>}<div className="modal-actions"><button type="button" className="button button-ghost" onClick={() => setModal(null)}>Annuler</button><button className="button button-primary" type="submit"><FilePlus2 size={15} />Enregistrer le bulletin</button></div></form></Modal>}
    {modal === "product-use" && <Modal title="Enregistrer une utilisation" subtitle="Le stock est déduit après validation." onClose={() => { setModal(null); setNotice(""); setInventoryProduct(null); }}><form className="form-body" onSubmit={changeProductStock}><Field label="Produit"><select value={inventoryProduct?.id ?? ""} onChange={(event) => setInventoryProduct(data.products.find((product) => product.id === event.target.value) ?? null)}>{data.products.map((product) => <option key={product.id} value={product.id} disabled={dayDelta(product.expiresAt) < 0}>{product.name} · {product.quantity} {product.unit}{dayDelta(product.expiresAt) < 0 ? " · PÉRIMÉ" : ""}</option>)}</select></Field>{inventoryProduct && <div className={`stock-summary ${dayDelta(inventoryProduct.expiresAt) < 0 ? "stock-summary-error" : ""}`}><div><span>Lot</span><strong>{inventoryProduct.lot}</strong></div><div><span>Stock</span><strong>{inventoryProduct.quantity} {inventoryProduct.unit}</strong></div><div><span>Péremption</span><strong>{fmtDate(inventoryProduct.expiresAt)}</strong></div></div>}<Field label={`Quantité utilisée (${inventoryProduct?.unit ?? "unité"})`}><input name="quantity" type="number" min="0.01" step="any" required max={inventoryProduct?.quantity ?? undefined} placeholder="Quantité" /></Field>{inventoryProduct && dayDelta(inventoryProduct.expiresAt) < 0 && <div className="inline-error">Ce produit est périmé. Son utilisation est interdite.</div>}{notice && <div className="inline-error">{notice}</div>}<div className="modal-actions"><button type="button" className="button button-ghost" onClick={() => setModal(null)}>Annuler</button><button type="submit" className="button button-primary" disabled={!inventoryProduct || dayDelta(inventoryProduct.expiresAt) < 0}><Minus size={15} />Déduire du stock</button></div></form></Modal>}
    {selectedPatient && <PatientDrawer patient={selectedPatient} data={data} onClose={() => setPatientProfile(null)} onEdit={() => { setEditPatient(selectedPatient); setPatientProfile(null); setModal("patient"); }} />}
    {reportBulletin && <PrintDocument bulletin={reportBulletin} data={data} onClose={() => setReportBulletin(null)} />}
    {toast && <div className="toast"><CheckCircle2 size={17} />{toast}</div>}
  </>;
}

function pageSubtitle(page: PageId) {
  const copy: Record<PageId, string> = {
    dashboard: "Activité du laboratoire et tâches prioritaires.", patients: "Dossiers, coordonnées et historique des analyses.",
    prescribers: "Correspondants médicaux et spécialités.", bulletins: "Suivi des demandes d’analyses et des tickets.",
    collection: "Réception des échantillons et suivi des prélèvements.", results: "Valeurs mesurées, références et validation technique.",
    delivery: "Vérification du ticket et remise du compte rendu.", catalog: "Examens disponibles, paramètres et références.", products: "Stock, lots et dates de péremption des réactifs.",
  };
  return copy[page];
}
function ageFromBirth(date: string) {
  if (!date) return "—";
  const birth = new Date(`${date}T12:00:00`); const now = new Date();
  let age = now.getFullYear() - birth.getFullYear();
  if (now.getMonth() < birth.getMonth() || (now.getMonth() === birth.getMonth() && now.getDate() < birth.getDate())) age--;
  return age;
}
function shortAnalysis(name: string) {
  if (name.startsWith("Numération formule")) return "NFS";
  if (name.startsWith("Glycémie")) return "Glycémie";
  if (name.startsWith("Créatininémie")) return "Créatinine";
  if (name.startsWith("Protéine C")) return "CRP";
  if (name.startsWith("Bandelette")) return "BU";
  if (name.startsWith("Sérologie")) return "VIH";
  if (name.startsWith("Antigène")) return "Ag HBs";
  return name;
}

function Login({ onSubmit, onPick, notice }: { onSubmit: (event: FormEvent<HTMLFormElement>) => void; onPick: (username: string) => void; notice: string }) {
  return <main className="login-page"><section className="login-card"><div className="login-brand"><div className="brand-symbol large"><img src={BRAND_MARK} alt="" /></div><div><strong>AYALAB</strong><span>Laboratoire d’analyses médicales · EPHD d’Ayamé</span></div></div><div className="login-heading"><div className="eyebrow">ACCÈS AU SYSTÈME</div><h1>Connexion</h1><p>Identifiez-vous pour accéder à votre espace de travail.</p></div><form onSubmit={onSubmit} className="login-form"><Field label="Identifiant"><input id="username" name="username" autoComplete="username" required placeholder="Votre identifiant" /></Field><Field label="Mot de passe"><input id="password" type="password" name="password" autoComplete="current-password" required placeholder="Votre mot de passe" /></Field>{notice && <div className="inline-error">{notice}</div>}<button className="button button-primary login-submit" type="submit">Se connecter <ArrowRight size={16} /></button></form><div className="demo-login"><div className="demo-login-head"><span>ACCÈS DE DÉMONSTRATION</span><span className="demo-pill">DÉMO</span></div><p>Sélectionnez un profil. Mot de passe de démonstration : <code>Ayame2026!</code></p><div className="demo-account-grid">{demoAccounts.map((account) => <button key={account.username} onClick={() => onPick(account.username)}><span className="demo-avatar">{account.initials}</span><span><strong>{roleName[account.role]}</strong><small>{account.username}</small></span><ChevronRight size={15} /></button>)}</div></div><footer className="login-footer"><span><ShieldCheck size={14} />Accès réservé au personnel autorisé</span><span>EPHD · Ayamé</span></footer></section><aside className="login-side"><div className="login-side-mark"><img src={BRAND_MARK} alt="" /></div><div className="login-side-copy"><span>PLATEFORME DE GESTION</span><strong>AYALAB<br />EPHD d’Ayamé</strong><p>Suivi des patients, analyses et résultats au sein d’un espace de travail unique.</p></div><div className="login-side-foot"><span>CENTRE HOSPITALIER · CÔTE D’IVOIRE</span><span>ENVIRONNEMENT DE DÉMONSTRATION</span></div></aside></main>;
}
function SearchBox({ value, onChange, placeholder }: { value: string; onChange: (value: string) => void; placeholder: string }) {
  return <label className="search-box"><Search size={16} /><input value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} aria-label="Rechercher" />{value && <button onClick={() => onChange("")} aria-label="Effacer la recherche"><X size={14} /></button>}</label>;
}
function Dashboard({ data, statuses, ready, monitored, onNavigate, onOpenTicket }: { data: LabData; statuses: { status: BulletinStatus; count: number }[]; ready: Bulletin[]; monitored: Product[]; onNavigate: (page: PageId) => void; onOpenTicket: (bulletin: Bulletin) => void }) {
  const todayCount = data.bulletins.filter((bulletin) => bulletin.createdAt.slice(0, 10) === today()).length;
  const receivedToday = data.bulletins.filter((bulletin) => bulletin.createdAt.slice(0, 10) === today() && bulletin.status === "Enregistré").length;
  const activeSamples = data.bulletins.filter((bulletin) => ["Prélevé", "En analyse"].includes(bulletin.status)).length;
  const dayName = new Intl.DateTimeFormat("fr-FR", { weekday: "long", day: "numeric", month: "long", year: "numeric" }).format(new Date());
  const maxStatus = Math.max(1, ...statuses.map((item) => item.count));
  const recent = [...data.bulletins].sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 6);
  return <div className="dashboard-layout"><div className="dashboard-primary"><div className="dashboard-date"><CalendarDays size={15} /><span>Activité du jour</span><strong>{dayName}</strong></div><div className="stats-grid"><StatCard label="Bulletins du jour" value={todayCount} sub="toutes analyses confondues" icon={ClipboardList} trend="Aujourd’hui" /><StatCard label="En attente de prélèvement" value={receivedToday} sub="à prendre en charge" icon={TestTube2} tone="violet" /><StatCard label="En cours d’analyse" value={activeSamples} sub="échantillons au laboratoire" icon={FlaskConical} tone="amber" /><StatCard label="Prêts à remettre" value={data.bulletins.filter((b) => b.status === "Résultats saisis").length} sub="résultats validés" icon={FileCheck2} tone="green" /></div><section className="panel status-panel"><div className="panel-title-row"><div><h2>Flux des bulletins</h2><span>Répartition des bulletins enregistrés aujourd’hui</span></div><button className="text-button" onClick={() => onNavigate("bulletins")}>Registre complet <ArrowRight size={14} /></button></div><div className="status-chart">{statuses.map(({ status, count }) => <div className="status-chart-row" key={status}><span className="status-chart-label">{status}</span><div className="bar-track"><div className={`bar-fill bar-${statusSequence.indexOf(status)}`} style={{ width: `${Math.max(count ? 8 : 0, (count / maxStatus) * 100)}%` }} /></div><strong>{count}</strong></div>)}</div><div className="chart-legend"><span><i className="legend-blue" />En cours de traitement</span><span><i className="legend-green" />Résultats disponibles ou remis</span></div></section><section className="panel recent-panel"><div className="panel-title-row"><div><h2>Activité récente</h2><span>Derniers bulletins du laboratoire</span></div><button className="text-button" onClick={() => onNavigate("bulletins")}>Voir le registre <ArrowRight size={14} /></button></div><div className="table-wrap"><table><thead><tr><th>Ticket</th><th>Patient</th><th>Analyse</th><th>Heure</th><th>Statut</th></tr></thead><tbody>{recent.map((bulletin) => <tr key={bulletin.id}><td className="mono ticket-link">{bulletin.ticket}</td><td>{patientName(data.patients.find((p) => p.id === bulletin.patientId))}</td><td>{bulletin.analysisIds.map((id) => shortAnalysis(data.analyses.find((a) => a.id === id)?.name ?? "Analyse")).join(" · ")}</td><td>{fmtDate(bulletin.createdAt, { hour: "2-digit", minute: "2-digit" })}</td><td><span className={statusClass(bulletin.status)}>{bulletin.status}</span></td></tr>)}</tbody></table></div></section></div><aside className="dashboard-secondary"><section className="panel action-panel"><div className="panel-title-row"><div><h2>À remettre</h2><span>{data.bulletins.filter((b) => b.status === "Résultats saisis").length} résultats disponibles</span></div><span className="panel-symbol green"><CheckCircle2 size={17} /></span></div><div className="ready-list">{ready.length ? ready.map((bulletin) => <button className="ready-item" key={bulletin.id} onClick={() => onOpenTicket(bulletin)}><div className="ready-line"><strong className="mono">{bulletin.ticket}</strong><ChevronRight size={15} /></div><span>{patientName(data.patients.find((p) => p.id === bulletin.patientId))}</span><small>{bulletin.analysisIds.map((id) => shortAnalysis(data.analyses.find((a) => a.id === id)?.name ?? "Analyse")).join(" · ")} · {fmtDate(bulletin.createdAt)}</small></button>) : <EmptyState title="Aucun résultat prêt" description="Les résultats validés apparaîtront ici." />}</div><button className="button button-outline full-button" onClick={() => onNavigate("delivery")}>Ouvrir la remise <ArrowRight size={15} /></button></section><section className="panel stock-watch-panel"><div className="panel-title-row"><div><h2>Réactifs à surveiller</h2><span>Stock et dates de péremption</span></div><span className="panel-symbol amber"><AlertTriangle size={17} /></span></div><div className="watch-list">{monitored.slice(0, 5).map((product) => {
    const alert = productAlert(product)!;
    return <div className="watch-item" key={product.id}><div><strong>{product.name}</strong><small>Lot {product.lot} · {product.quantity} {product.unit}</small></div><span className={`product-alert ${alert.tone}`}><span />{alert.label}</span></div>;
  })}</div><button className="text-button stock-link" onClick={() => onNavigate("products")}>Gérer le stock <ArrowRight size={14} /></button></section><section className="workflow-note"><div className="workflow-note-icon"><HeartPulse size={17} /></div><div><strong>Traçabilité des analyses</strong><span>Chaque bulletin suit les étapes de prélèvement, analyse, validation et remise.</span></div></section></aside></div>;
}
function DeliveryResult({ bulletin, data, onDeliver, onPrint }: { bulletin: Bulletin; data: LabData; onDeliver: () => void; onPrint: () => void }) {
  const patient = data.patients.find((p) => p.id === bulletin.patientId);
  const ready = bulletin.status === "Résultats saisis";
  const analysisParams = bulletin.analysisIds.flatMap((id) => data.analyses.find((a) => a.id === id)?.parameters.map((parameter) => ({ analysis: data.analyses.find((a) => a.id === id)!, parameter })) ?? []);
  return <section className="panel delivery-card"><div className="delivery-head"><div className="delivery-ok"><CheckCircle2 size={20} /></div><div><span className="eyebrow">TICKET VÉRIFIÉ</span><h2>{bulletin.ticket}</h2><span className={statusClass(bulletin.status)}>{bulletin.status}</span></div><div className="delivery-actions"><button className="button button-outline" onClick={onPrint}><Printer size={15} />Imprimer le compte rendu</button>{ready && <button className="button button-primary" onClick={onDeliver}><Check size={15} />Confirmer la remise</button>}</div></div><div className="delivery-meta"><div><span>Patient</span><strong>{patientName(patient)}</strong><small>{patient?.code} · {patient?.type === "Hospitalisé" ? `Dossier ${patient.numeroDossier} · lit ${patient.lit}` : "Patient externe"}</small></div><div><span>Prescripteur</span><strong>{prescriberName(data.prescribers.find((p) => p.id === bulletin.prescriberId))}</strong><small>{fmtDate(bulletin.createdAt)}</small></div><div><span>Motif</span><strong>{bulletin.motif}</strong><small>{bulletin.analysisIds.map((id) => data.analyses.find((a) => a.id === id)?.name).join(" · ")}</small></div></div><div className="delivery-results"><div className="table-wrap"><table><thead><tr><th>Analyse / paramètre</th><th>Résultat</th><th>Valeurs de référence</th><th>Interprétation</th></tr></thead><tbody>{analysisParams.map(({ analysis, parameter }) => {
    const result = bulletin.results[parameter.id];
    return <tr key={parameter.id}><td><strong>{parameter.name}</strong><small className="cell-sub">{analysis.name}</small></td><td><strong className="result-value">{result ? `${result.value} ${result.unit}` : "—"}</strong></td><td>{parameter.min} – {parameter.max} {parameter.unit}</td><td>{result && <span className={`status ${result.interpretation === "Normal" ? "status-green" : "status-amber"}`}>{result.interpretation}</span>}</td></tr>;
  })}</tbody></table></div></div>{!ready && bulletin.status !== "Remis" && <div className="inline-warning"><Clock3 size={15} />Le bulletin n’est pas encore prêt. La remise sera possible après la saisie des résultats.</div>}{bulletin.status === "Remis" && <div className="success-banner"><CheckCircle2 size={16} />Résultats remis au patient.</div>}</section>;
}
function PatientDrawer({ patient, data, onClose, onEdit }: { patient: Patient; data: LabData; onClose: () => void; onEdit: () => void }) {
  const history = data.bulletins.filter((bulletin) => bulletin.patientId === patient.id).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  return <div className="drawer-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}><aside className="patient-drawer"><header className="drawer-header"><div><span className="eyebrow">FICHE PATIENT</span><button className="icon-button" onClick={onClose} aria-label="Fermer"><X size={18} /></button></div><div className="drawer-person"><div className={`person-avatar large-avatar ${patient.sexe === "F" ? "avatar-rose" : "avatar-blue"}`}>{initials(`${patient.prenoms} ${patient.nom}`)}</div><div><h2>{patient.prenoms} {patient.nom}</h2><span>{patient.code}</span></div></div><div className="drawer-person-meta"><span className={`type-tag ${patient.type === "Hospitalisé" ? "tag-inpatient" : "tag-outpatient"}`}>{patient.type}</span><span>{patient.sexe === "F" ? "Femme" : "Homme"} · {ageFromBirth(patient.dateNaissance)} ans</span></div><button className="button button-outline full-button" onClick={onEdit}>Modifier la fiche</button></header><div className="drawer-content"><div className="detail-section"><h3>Informations personnelles</h3><div className="detail-grid"><div><span>Date de naissance</span><strong>{fmtDate(patient.dateNaissance)}</strong></div><div><span>Téléphone</span><strong>{patient.telephone || "—"}</strong></div>{patient.type === "Hospitalisé" && <><div><span>N° dossier</span><strong>{patient.numeroDossier}</strong></div><div><span>Lit</span><strong>{patient.lit}</strong></div></>}</div></div><div className="detail-section"><div className="detail-heading"><h3>Historique des analyses</h3><span>{history.length}</span></div>{history.length ? <div className="history-list">{history.map((bulletin) => <div className="history-item" key={bulletin.id}><span className="history-dot" /><div><div className="history-row"><strong>{bulletin.ticket}</strong><span className={statusClass(bulletin.status)}>{bulletin.status}</span></div><span>{bulletin.analysisIds.map((id) => shortAnalysis(data.analyses.find((a) => a.id === id)?.name ?? "Analyse")).join(" · ")}</span><small>{fmtDate(bulletin.createdAt)} · {bulletin.motif}</small></div></div>)}</div> : <EmptyState title="Aucun historique" description="Aucun bulletin associé à ce patient." />}</div></div></aside></div>;
}
function PrintDocument({ bulletin, data, onClose }: { bulletin: Bulletin; data: LabData; onClose: () => void }) {
  const patient = data.patients.find((p) => p.id === bulletin.patientId);
  const results = bulletin.analysisIds.flatMap((id) => {
    const analysis = data.analyses.find((a) => a.id === id);
    return analysis ? analysis.parameters.map((parameter) => ({ analysis, parameter, result: bulletin.results[parameter.id] })) : [];
  });
  return <div className="print-overlay"><div className="print-toolbar"><span>Aperçu imprimable · {bulletin.ticket}</span><button className="icon-button" aria-label="Fermer l’aperçu" onClick={onClose}><X size={18} /></button></div><article className="print-document"><header className="print-header"><div className="print-mark">AY</div><div><strong>EPHD D’AYAMÉ</strong><span>LABORATOIRE D’ANALYSES MÉDICALES</span><small>Ayamé · Côte d’Ivoire</small></div><div className="print-document-type">{bulletin.status === "Remis" || Object.keys(bulletin.results).length ? "COMPTE RENDU D’ANALYSES" : "TICKET DE RETRAIT"}</div></header><div className="print-rule" /><div className="print-ticket-line"><div><span>NUMÉRO DE TICKET</span><strong>{bulletin.ticket}</strong></div><div><span>DATE DE RÉCEPTION</span><strong>{fmtDate(bulletin.createdAt)}</strong></div><div><span>STATUT</span><strong>{bulletin.status}</strong></div></div><div className="print-patient"><h2>Identification du patient</h2><div className="print-info-grid"><div><span>Nom et prénoms</span><strong>{patientName(patient)}</strong></div><div><span>Code patient</span><strong>{patient?.code}</strong></div><div><span>Sexe / naissance</span><strong>{patient?.sexe === "F" ? "Femme" : "Homme"} · {fmtDate(patient?.dateNaissance ?? "")}</strong></div><div><span>Statut</span><strong>{patient?.type}{patient?.type === "Hospitalisé" ? ` · Dossier ${patient.numeroDossier} · lit ${patient.lit}` : ""}</strong></div><div><span>Prescripteur</span><strong>{prescriberName(data.prescribers.find((p) => p.id === bulletin.prescriberId))}</strong></div><div><span>Motif</span><strong>{bulletin.motif}</strong></div></div></div><div className="print-analyses"><h2>Examens prescrits</h2><p>{bulletin.analysisIds.map((id) => data.analyses.find((a) => a.id === id)?.name).join(" · ")}</p></div>{results.length > 0 && <div className="print-results"><h2>Résultats</h2><table><thead><tr><th>Analyse</th><th>Paramètre</th><th>Résultat</th><th>Valeurs de référence</th><th>Interprétation</th></tr></thead><tbody>{results.map(({ analysis, parameter, result }) => <tr key={parameter.id}><td>{analysis.name}</td><td>{parameter.name}</td><td><strong>{result ? `${result.value} ${result.unit}` : "Non renseigné"}</strong></td><td>{parameter.min} – {parameter.max} {parameter.unit}</td><td>{result?.interpretation ?? "—"}</td></tr>)}</tbody></table></div>}{results.length === 0 && <div className="print-instruction"><strong>Conservez ce ticket et présentez-le au laboratoire lors du retrait des résultats.</strong><p>Un ticket valide permet de vérifier le suivi du bulletin et la disponibilité du compte rendu.</p></div>}<footer className="print-footer"><div><strong>EPHD d’Ayamé · Laboratoire d’analyses médicales</strong><span>Document généré le {fmtDate(today())} · Informations confidentielles</span></div><div className="print-signature">Cachet et signature</div></footer></article><div className="print-action-row"><button className="button button-outline" onClick={onClose}>Fermer</button><button className="button button-primary" onClick={() => window.print()}><Printer size={15} />Imprimer / Enregistrer en PDF</button></div></div>;
}
