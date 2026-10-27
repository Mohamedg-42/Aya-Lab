import {
  double,
  int,
  mysqlEnum,
  mysqlTable,
  primaryKey,
  text,
  timestamp,
  uniqueIndex,
  varchar,
} from "drizzle-orm/mysql-core";

/** Comptes du personnel du laboratoire. Les mots de passe sont stockés sous forme de hash. */
export const labUsers = mysqlTable("lab_user", {
  id: int("id").autoincrement().primaryKey(),
  username: varchar("username", { length: 80 }).notNull(),
  passwordHash: varchar("password_hash", { length: 255 }).notNull(),
  role: mysqlEnum("role", ["accueil", "auxiliaire", "technicien", "responsable"]).notNull(),
  displayName: varchar("display_name", { length: 160 }).notNull(),
  active: int("active").default(1).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
}, (table) => [uniqueIndex("lab_user_username_unique").on(table.username)]);

export const labSessions = mysqlTable("lab_session", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("user_id").notNull().references(() => labUsers.id),
  tokenHash: varchar("token_hash", { length: 64 }).notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => [uniqueIndex("lab_session_token_hash_unique").on(table.tokenHash)]);

export const patients = mysqlTable("patient", {
  id: int("id").autoincrement().primaryKey(),
  code: varchar("code", { length: 32 }).notNull(),
  nom: varchar("nom", { length: 100 }).notNull(),
  prenoms: varchar("prenoms", { length: 140 }).notNull(),
  sexe: mysqlEnum("sexe", ["F", "M"]).notNull(),
  dateNaissance: varchar("date_naissance", { length: 10 }),
  telephone: varchar("telephone", { length: 40 }),
  type: mysqlEnum("type_patient", ["Externe", "Hospitalisé"]).notNull(),
  numeroDossier: varchar("numero_dossier", { length: 50 }),
  lit: varchar("numero_lit", { length: 24 }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
}, (table) => [uniqueIndex("patient_code_unique").on(table.code)]);

export const prescribers = mysqlTable("prescripteur", {
  id: int("id").autoincrement().primaryKey(),
  nom: varchar("nom", { length: 100 }).notNull(),
  prenoms: varchar("prenoms", { length: 140 }).notNull(),
  specialite: varchar("specialite", { length: 140 }).notNull(),
  active: int("active").default(1).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const technicians = mysqlTable("technicien", {
  id: int("id").autoincrement().primaryKey(),
  nom: varchar("nom", { length: 100 }).notNull(),
  prenoms: varchar("prenoms", { length: 140 }).notNull(),
  grade: varchar("grade", { length: 120 }).notNull(),
  userId: int("user_id").references(() => labUsers.id),
  active: int("active").default(1).notNull(),
});

export const analysisTypes = mysqlTable("type_analyse", {
  id: int("id").autoincrement().primaryKey(),
  code: varchar("code", { length: 32 }).notNull(),
  nom: varchar("nom", { length: 180 }).notNull(),
  discipline: mysqlEnum("discipline", ["Hématologie", "Biochimie", "Parasitologie", "Immunologie"]).notNull(),
  delaiIndicatif: varchar("delai_indicatif", { length: 40 }),
  active: int("active").default(1).notNull(),
}, (table) => [uniqueIndex("type_analyse_code_unique").on(table.code)]);

export const products = mysqlTable("produit", {
  id: int("id").autoincrement().primaryKey(),
  code: varchar("code", { length: 32 }).notNull(),
  nom: varchar("nom", { length: 180 }).notNull(),
  lot: varchar("lot", { length: 80 }).notNull(),
  quantite: double("quantite").default(0).notNull(),
  unite: varchar("unite", { length: 32 }).notNull(),
  seuilAlerte: double("seuil_alerte").default(0).notNull(),
  dateOuverture: varchar("date_ouverture", { length: 10 }),
  datePeremption: varchar("date_peremption", { length: 10 }).notNull(),
  fournisseur: varchar("fournisseur", { length: 160 }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
}, (table) => [uniqueIndex("produit_code_unique").on(table.code)]);

export const parameters = mysqlTable("parametre", {
  id: int("id").autoincrement().primaryKey(),
  typeAnalyseId: int("type_analyse_id").notNull().references(() => analysisTypes.id),
  code: varchar("code", { length: 48 }).notNull(),
  nom: varchar("nom", { length: 160 }).notNull(),
  unite: varchar("unite", { length: 48 }).notNull(),
  referenceMin: double("reference_min").notNull(),
  referenceMax: double("reference_max").notNull(),
  ordre: int("ordre").default(0).notNull(),
  active: int("active").default(1).notNull(),
}, (table) => [uniqueIndex("parametre_code_unique").on(table.code)]);

export const bulletins = mysqlTable("bulletin_analyse", {
  id: int("id").autoincrement().primaryKey(),
  ticket: varchar("numero_ticket", { length: 40 }).notNull(),
  patientId: int("patient_id").notNull().references(() => patients.id),
  prescriberId: int("prescripteur_id").notNull().references(() => prescribers.id),
  motif: text("motif").notNull(),
  status: mysqlEnum("statut", ["Enregistré", "Prélevé", "En analyse", "Résultats saisis", "Remis"]).default("Enregistré").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  sampledAt: timestamp("preleve_at"),
  resultsAt: timestamp("resultats_at"),
  handedAt: timestamp("remis_at"),
}, (table) => [uniqueIndex("bulletin_ticket_unique").on(table.ticket)]);

export const bulletinAnalysisTypes = mysqlTable("bulletin_type_analyse", {
  bulletinId: int("bulletin_id").notNull().references(() => bulletins.id),
  analysisTypeId: int("type_analyse_id").notNull().references(() => analysisTypes.id),
}, (table) => [primaryKey({ columns: [table.bulletinId, table.analysisTypeId] })]);

export const results = mysqlTable("resultat", {
  id: int("id").autoincrement().primaryKey(),
  bulletinId: int("bulletin_id").notNull().references(() => bulletins.id),
  parameterId: int("parametre_id").notNull().references(() => parameters.id),
  technicianId: int("technicien_id").notNull().references(() => technicians.id),
  value: double("valeur_mesuree").notNull(),
  unit: varchar("unite", { length: 48 }).notNull(),
  referenceMin: double("reference_min").notNull(),
  referenceMax: double("reference_max").notNull(),
  interpretation: mysqlEnum("interpretation", ["Normal", "Inférieur", "Supérieur"]).notNull(),
  enteredAt: timestamp("saisi_at").defaultNow().notNull(),
}, (table) => [uniqueIndex("resultat_bulletin_parametre_unique").on(table.bulletinId, table.parameterId)]);

export const parameterProducts = mysqlTable("parametre_produit", {
  parameterId: int("parametre_id").notNull().references(() => parameters.id),
  productId: int("produit_id").notNull().references(() => products.id),
  quantiteParUsage: double("quantite_par_usage").default(1).notNull(),
}, (table) => [primaryKey({ columns: [table.parameterId, table.productId] })]);

/** Copie de travail sérialisée utilisée par l’interface de démonstration. */
export const labDataSnapshots = mysqlTable("lab_data_snapshot", {
  id: int("id").primaryKey(),
  payload: text("payload").notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
});

/** Compte utilisateur du starter conservé pour compatibilité avec le socle Manus. */
export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type LabUser = typeof labUsers.$inferSelect;
export type InsertLabUser = typeof labUsers.$inferInsert;
export type PatientRow = typeof patients.$inferSelect;
export type InsertPatient = typeof patients.$inferInsert;
export type PrescriberRow = typeof prescribers.$inferSelect;
export type TechnicianRow = typeof technicians.$inferSelect;
export type AnalysisTypeRow = typeof analysisTypes.$inferSelect;
export type ParameterRow = typeof parameters.$inferSelect;
export type ProductRow = typeof products.$inferSelect;
export type BulletinRow = typeof bulletins.$inferSelect;
export type ResultRow = typeof results.$inferSelect;
export type LabDataSnapshot = typeof labDataSnapshots.$inferSelect;
export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;
