import { createHash, randomBytes, scryptSync, timingSafeEqual } from "node:crypto";
import type { Express, Request, Response } from "express";
import { eq } from "drizzle-orm";
import { labDataSnapshots, labSessions, labUsers } from "../drizzle/schema";
import type { Role } from "../shared/lab";
import { getDb } from "./db";

import { demoAccounts, demoLabData } from "../shared/lab-seed";

const COOKIE = "ayame_lab_session";
const SESSION_MS = 12 * 60 * 60 * 1000;
const attempts = new Map<string, { count: number; resetAt: number }>();
const memorySessions = new Map<string, { user: LabUser; expiresAt: number }>();
let memorySnapshotPayload = JSON.stringify(demoLabData);

type LabUser = typeof labUsers.$inferSelect;
const tokenHash = (token: string) => createHash("sha256").update(token).digest("hex");
function publicAccount(user: LabUser) {
  const parts = user.displayName.split(/\s+/).filter(Boolean);
  return { username: user.username, role: user.role as Role, name: user.displayName, initials: parts.slice(0, 2).map((part) => part[0]).join("").toUpperCase() };
}
function readCookie(req: Request, name: string) {
  const cookieHeader = req.headers.cookie ?? "";
  for (const part of cookieHeader.split(";")) {
    const [key, ...value] = part.trim().split("=");
    if (key === name) {
      try { return decodeURIComponent(value.join("=")); } catch { return null; }
    }
  }
  return null;
}
async function currentAccount(req: Request): Promise<LabUser | null> {
  const token = readCookie(req, COOKIE);
  if (!token) return null;
  const hash = tokenHash(token);
  const db = await getDb();
  if (!db) {
    const mem = memorySessions.get(hash);
    if (!mem || mem.expiresAt < Date.now()) return null;
    return mem.user;
  }
  const [session] = await db.select().from(labSessions).where(eq(labSessions.tokenHash, hash)).limit(1);
  if (!session || session.expiresAt.getTime() < Date.now()) return null;
  const [user] = await db.select().from(labUsers).where(eq(labUsers.id, session.userId)).limit(1);
  return user?.active ? user : null;
}
function cookieOptions() {
  return { httpOnly: true, secure: true, sameSite: "none" as const, path: "/", maxAge: SESSION_MS };
}
function sendError(res: Response, status: number, message: string) {
  res.status(status).json({ error: message });
}
function verifyPassword(password: string, stored: string) {
  const [, algorithm, salt, expected] = stored.split("$");
  if (algorithm !== "scrypt" || !salt || !expected) return false;
  const computed = scryptSync(password, salt, 64, { N: 16384, r: 8, p: 1 });
  const expectedBytes = Buffer.from(expected, "hex");
  return computed.length === expectedBytes.length && timingSafeEqual(computed, expectedBytes);
}
function sameValue(left: unknown, right: unknown) {
  return JSON.stringify(left) === JSON.stringify(right);
}
export function roleAllowsSnapshot(role: Role, before: Record<string, any>, after: Record<string, any>) {
  if (role === "responsable") return true;
  if (!sameValue(before.technicians, after.technicians) || !sameValue(before.analyses, after.analyses)) return false;
  const prevPatients = new Map<string, unknown>(before.patients.map((row: { id: string }) => [row.id, row]));
  const prevPrescribers = new Map<string, unknown>(before.prescribers.map((row: { id: string }) => [row.id, row]));
  const nextPatients = new Map<string, unknown>(after.patients.map((row: { id: string }) => [row.id, row]));
  const nextPrescribers = new Map<string, unknown>(after.prescribers.map((row: { id: string }) => [row.id, row]));
  if ((role === "accueil" || role === "auxiliaire") && !sameValue(before.products, after.products)) return false;
  if (role === "technicien" && (!sameValue(before.patients, after.patients) || !sameValue(before.prescribers, after.prescribers))) return false;
  if (role === "accueil" || role === "auxiliaire") {
    for (const row of before.patients as Array<{ id: string }>) if (!nextPatients.has(row.id)) return false;
    for (const row of before.prescribers as Array<{ id: string }>) if (!nextPrescribers.has(row.id)) return false;
  }
  if (role === "technicien") {
    if (!sameValue(before.patients, after.patients) || !sameValue(before.prescribers, after.prescribers)) return false;
    const oldProducts = new Map<string, ProductRecord>(before.products.map((row: ProductRecord) => [row.id, row]));
    for (const row of after.products as ProductRecord[]) {
      const old = oldProducts.get(row.id);
      if (!old || Object.keys(old).some((key) => key !== "quantity" && !sameValue(old[key], row[key])) || row.quantity > old.quantity) return false;
      if (row.quantity < old.quantity && (Date.parse(`${row.expiresAt}T00:00:00`) < Date.now() - 86400000 || row.quantity < 0)) return false;
    }
    if (after.products.length !== before.products.length) return false;
  }
  const oldBulletins = new Map<string, BulletinRecord>(before.bulletins.map((row: BulletinRecord) => [row.id, row]));
  const nextBulletins = new Map<string, BulletinRecord>(after.bulletins.map((row: BulletinRecord) => [row.id, row]));
  if (nextBulletins.size < oldBulletins.size) return false;
  for (const id of oldBulletins.keys()) if (!nextBulletins.has(id)) return false;
  const seenTickets = new Set<string>();
  for (const row of after.bulletins as BulletinRecord[]) {
    if (seenTickets.has(row.ticket)) return false;
    seenTickets.add(row.ticket);
    const previous = oldBulletins.get(row.id);
    if (!previous) {
      if ((role !== "accueil" && role !== "auxiliaire") || row.status !== "Enregistré" || Object.keys(row.results ?? {}).length !== 0) return false;
      continue;
    }
    const statuses = ["Enregistré", "Prélevé", "En analyse", "Résultats saisis", "Remis"];
    if (statuses.indexOf(row.status) < statuses.indexOf(previous.status) || statuses.indexOf(row.status) > statuses.indexOf(previous.status) + 1) return false;
    if (role === "accueil") {
      if (!sameValue(previous, row)) return false;
      continue;
    }
    if (role === "auxiliaire") {
      const nextStatus = previous.status === "Enregistré" ? "Prélevé" : previous.status === "Prélevé" ? "En analyse" : previous.status;
      const metadataSame = ["ticket", "patientId", "prescriberId", "analysisIds", "motif", "createdAt"].every((key) => sameValue(previous[key], row[key]));
      if (!metadataSame || !sameValue(previous.results, row.results) || ![previous.status, nextStatus].includes(row.status)) return false;
      continue;
    }
    const unchanged = sameValue(previous, row);
    if (role === "technicien" && !unchanged) {
      const metadataSame = ["ticket", "patientId", "prescriberId", "analysisIds", "motif", "createdAt"].every((key) => sameValue(previous[key], row[key]));
      if (!metadataSame || previous.status !== "En analyse" || row.status !== "Résultats saisis") return false;
      const selectedParameters = new Set((row.analysisIds as string[]).flatMap((id) => (after.analyses as Array<{ id: string; parameters: Array<{ id: string }> }>).find((analysis) => analysis.id === id)?.parameters.map((parameter) => parameter.id) ?? []));
      if (!Object.keys(row.results ?? {}).every((id) => selectedParameters.has(id))) return false;
    }
  }
  return true;
}
type ProductRecord = { id: string; quantity: number; expiresAt: string; [key: string]: unknown };
type BulletinRecord = { id: string; status: string; results: Record<string, unknown>; analysisIds: string[]; [key: string]: any };

export function registerLabRoutes(app: Express) {
  app.post("/api/lab/login", async (req, res) => {
    try {
      const address = req.ip ?? "unknown";
      const now = Date.now();
      const prior = attempts.get(address);
      if (prior && prior.resetAt > now && prior.count >= 8) {
        return sendError(res, 429, "Trop de tentatives. Réessayez dans quelques minutes.");
      }
      const username = typeof req.body?.username === "string" ? req.body.username.trim().toLowerCase() : "";
      const password = typeof req.body?.password === "string" ? req.body.password : "";
      if (!username || password.length < 1 || password.length > 200) return sendError(res, 400, "Identifiant ou mot de passe incorrect.");
      const db = await getDb();
      if (!db) {
        const demo = demoAccounts.find((a) => a.username.toLowerCase() === username);
        if (!demo || password !== "Ayame2026!") {
          const next = prior && prior.resetAt > now ? { count: prior.count + 1, resetAt: prior.resetAt } : { count: 1, resetAt: now + 15 * 60 * 1000 };
          attempts.set(address, next);
          return sendError(res, 401, "Identifiant ou mot de passe incorrect.");
        }
        attempts.delete(address);
        const expiresAt = Date.now() + SESSION_MS;
        const token = randomBytes(32).toString("base64url");
        const account: LabUser = { id: 1, username: demo.username, role: demo.role, displayName: demo.name, active: true, passwordHash: "", createdAt: new Date() };
        memorySessions.set(tokenHash(token), { user: account, expiresAt });
        res.cookie(COOKIE, token, cookieOptions());
        return res.set("Cache-Control", "no-store").json({ user: publicAccount(account) });
      }
      const [account] = await db.select().from(labUsers).where(eq(labUsers.username, username)).limit(1);
      if (!account || !account.active || !verifyPassword(password, account.passwordHash)) {
        const next = prior && prior.resetAt > now ? { count: prior.count + 1, resetAt: prior.resetAt } : { count: 1, resetAt: now + 15 * 60 * 1000 };
        attempts.set(address, next);
        return sendError(res, 401, "Identifiant ou mot de passe incorrect.");
      }
      attempts.delete(address);
      const expiresAt = new Date(Date.now() + SESSION_MS);
      const token = randomBytes(32).toString("base64url");
      await db.insert(labSessions).values({ userId: account.id, tokenHash: tokenHash(token), expiresAt });
      res.cookie(COOKIE, token, cookieOptions());
      res.set("Cache-Control", "no-store").json({ user: publicAccount(account) });
    } catch (error) {
      console.error("[Lab auth] Login failed:", error instanceof Error ? error.message : "unknown error");
      sendError(res, 503, "Connexion indisponible. Réessayez dans un instant.");
    }
  });

  app.get("/api/lab/me", async (req, res) => {
    try {
      const account = await currentAccount(req);
      if (!account) return sendError(res, 401, "Session expirée.");
      res.set("Cache-Control", "no-store").json({ user: publicAccount(account) });
    } catch {
      sendError(res, 503, "La session du laboratoire est indisponible.");
    }
  });

  app.post("/api/lab/logout", async (req, res) => {
    try {
      const token = readCookie(req, COOKIE);
      const db = await getDb();
      if (token) {
        memorySessions.delete(tokenHash(token));
        if (db) await db.delete(labSessions).where(eq(labSessions.tokenHash, tokenHash(token)));
      }
    } catch { /* Toujours effacer le cookie du navigateur. */ }
    res.clearCookie(COOKIE, { ...cookieOptions(), maxAge: 0 });
    res.status(200).json({ success: true });
  });

  app.get("/api/lab/state", async (req, res) => {
    try {
      if (!await currentAccount(req)) return sendError(res, 401, "Session expirée.");
      const db = await getDb();
      if (!db) {
        return res.set("Cache-Control", "no-store").json({ data: JSON.parse(memorySnapshotPayload) });
      }
      const [snapshot] = await db.select().from(labDataSnapshots).where(eq(labDataSnapshots.id, 1)).limit(1);
      if (!snapshot) return sendError(res, 404, "Les données de démonstration ne sont pas initialisées.");
      res.set("Cache-Control", "no-store").json({ data: JSON.parse(snapshot.payload) });
    } catch (error) {
      console.error("[Lab state] Read failed:", error instanceof Error ? error.message : "unknown error");
      sendError(res, 503, "Impossible de charger les données du laboratoire.");
    }
  });

  app.put("/api/lab/state", async (req, res) => {
    try {
      const account = await currentAccount(req);
      if (!account) return sendError(res, 401, "Session expirée.");
      const data = req.body?.data;
      if (!data || !Array.isArray(data.patients) || !Array.isArray(data.prescribers) || !Array.isArray(data.bulletins) || !Array.isArray(data.products) || !Array.isArray(data.analyses)) {
        return sendError(res, 400, "Format de données invalide.");
      }
      const payload = JSON.stringify(data);
      if (Buffer.byteLength(payload, "utf8") > 2_000_000) return sendError(res, 413, "Le jeu de données dépasse la taille autorisée.");
      const db = await getDb();
      if (!db) {
        const existingData = JSON.parse(memorySnapshotPayload);
        if (!roleAllowsSnapshot(account.role as Role, existingData, data)) {
          return sendError(res, 403, "Cette action n’est pas autorisée pour votre rôle ou cette transition de bulletin.");
        }
        memorySnapshotPayload = payload;
        return res.set("Cache-Control", "no-store").json({ saved: true });
      }
      const [existing] = await db.select().from(labDataSnapshots).where(eq(labDataSnapshots.id, 1)).limit(1);
      if (existing && !roleAllowsSnapshot(account.role as Role, JSON.parse(existing.payload), data)) {
        return sendError(res, 403, "Cette action n’est pas autorisée pour votre rôle ou cette transition de bulletin.");
      }
      await db.insert(labDataSnapshots).values({ id: 1, payload }).onDuplicateKeyUpdate({ set: { payload } });
      res.set("Cache-Control", "no-store").json({ saved: true });
    } catch (error) {
      console.error("[Lab state] Save failed:", error instanceof Error ? error.message : "unknown error");
      sendError(res, 503, "Impossible d’enregistrer les données du laboratoire.");
    }
  });
}
