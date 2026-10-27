import "dotenv/config";
import { randomBytes, scryptSync } from "node:crypto";
import { eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import mysql from "mysql2/promise";
import {
  analysisTypes, bulletinAnalysisTypes, bulletins, labDataSnapshots, labUsers, parameterProducts,
  parameters, patients, prescribers, products, results, technicians,
} from "../drizzle/schema";
import { demoAccounts, demoLabData } from "../shared/lab-seed";

async function seed() {
  if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL manquant.");
  const connection = await mysql.createConnection(process.env.DATABASE_URL);
  const db = drizzle(connection);
  try {
    await db.transaction(async (tx) => {
      const [existingPatient] = await tx.select({ id: patients.id }).from(patients).limit(1);
      if (!existingPatient) {
        const patientId = new Map(demoLabData.patients.map((row, index) => [row.id, index + 1]));
        const prescriberId = new Map(demoLabData.prescribers.map((row, index) => [row.id, index + 1]));
        const technicianId = new Map(demoLabData.technicians.map((row, index) => [row.id, index + 1]));
        const productId = new Map(demoLabData.products.map((row, index) => [row.id, index + 1]));
        const analysisId = new Map(demoLabData.analyses.map((row, index) => [row.id, index + 1]));
        const allParameters = demoLabData.analyses.flatMap((analysis) => analysis.parameters.map((parameter) => ({ analysis, parameter })));
        const parameterId = new Map(allParameters.map(({ parameter }, index) => [parameter.id, index + 1]));

        await tx.insert(patients).values(demoLabData.patients.map((row, index) => ({
          id: index + 1, code: row.code, nom: row.nom, prenoms: row.prenoms, sexe: row.sexe,
          dateNaissance: row.dateNaissance, telephone: row.telephone, type: row.type,
          numeroDossier: row.numeroDossier ?? null, lit: row.lit ?? null,
          createdAt: new Date(`${row.createdAt}T12:00:00`),
        })));
        await tx.insert(prescribers).values(demoLabData.prescribers.map((row, index) => ({ id: index + 1, nom: row.nom, prenoms: row.prenoms, specialite: row.specialite })));
        await tx.insert(technicians).values(demoLabData.technicians.map((row, index) => ({ id: index + 1, nom: row.nom, prenoms: row.prenoms, grade: row.grade })));
        await tx.insert(products).values(demoLabData.products.map((row, index) => ({
          id: index + 1, code: row.id.toUpperCase(), nom: row.name, lot: row.lot, quantite: row.quantity,
          unite: row.unit, seuilAlerte: row.minimum, dateOuverture: row.openedAt, datePeremption: row.expiresAt, fournisseur: row.supplier,
        })));
        await tx.insert(analysisTypes).values(demoLabData.analyses.map((row, index) => ({
          id: index + 1, code: row.id.toUpperCase(), nom: row.name, discipline: row.discipline, delaiIndicatif: row.turnaround,
        })));
        await tx.insert(parameters).values(allParameters.map(({ analysis, parameter }, index) => ({
          id: index + 1, typeAnalyseId: analysisId.get(analysis.id)!, code: parameter.id,
          nom: parameter.name, unite: parameter.unit, referenceMin: parameter.min, referenceMax: parameter.max, ordre: index + 1,
        })));
        const productLinks = allParameters.flatMap(({ parameter }) => parameter.productIds.map((product) => ({ parameterId: parameterId.get(parameter.id)!, productId: productId.get(product)!, quantiteParUsage: 1 })));
        if (productLinks.length) await tx.insert(parameterProducts).values(productLinks);
        await tx.insert(bulletins).values(demoLabData.bulletins.map((row, index) => {
          const date = new Date(row.createdAt);
          return {
            id: index + 1, ticket: row.ticket, patientId: patientId.get(row.patientId)!, prescriberId: prescriberId.get(row.prescriberId)!,
            motif: row.motif, status: row.status, createdAt: date,
            sampledAt: statusIndex(row.status) >= 1 ? date : null,
            resultsAt: statusIndex(row.status) >= 3 ? date : null,
            handedAt: row.status === "Remis" ? date : null,
          };
        }));
        const bulletinLinks = demoLabData.bulletins.flatMap((row, index) => row.analysisIds.map((analysis) => ({ bulletinId: index + 1, analysisTypeId: analysisId.get(analysis)! })));
        if (bulletinLinks.length) await tx.insert(bulletinAnalysisTypes).values(bulletinLinks);
        const resultRows = demoLabData.bulletins.flatMap((row, index) => Object.entries(row.results).map(([parameter, result]) => ({
          bulletinId: index + 1, parameterId: parameterId.get(parameter)!, technicianId: technicianId.get(result.technicianId)!,
          value: result.value, unit: result.unit, referenceMin: result.min, referenceMax: result.max,
          interpretation: result.interpretation, enteredAt: new Date(result.enteredAt),
        })));
        if (resultRows.length) await tx.insert(results).values(resultRows);
      }

      for (const account of demoAccounts) {
        const [existing] = await tx.select({ id: labUsers.id }).from(labUsers).where(eq(labUsers.username, account.username)).limit(1);
        if (existing) continue;
        const salt = randomBytes(16).toString("hex");
        const hash = scryptSync(account.password ?? "", salt, 64, { N: 16384, r: 8, p: 1 }).toString("hex");
        await tx.insert(labUsers).values({ username: account.username, passwordHash: `$scrypt$${salt}$${hash}`, role: account.role, displayName: account.name });
      }

      const [snapshot] = await tx.select({ id: labDataSnapshots.id }).from(labDataSnapshots).where(eq(labDataSnapshots.id, 1)).limit(1);
      if (!snapshot) await tx.insert(labDataSnapshots).values({ id: 1, payload: JSON.stringify(demoLabData) });
    });
    console.log("Données de démonstration prêtes : patients, prescripteurs, techniciens, catalogue, réactifs, bulletins et comptes.");
  } finally {
    await connection.end();
  }
}
function statusIndex(status: string) {
  return ["Enregistré", "Prélevé", "En analyse", "Résultats saisis", "Remis"].indexOf(status);
}

seed().catch((error) => { console.error("Échec du jeu de démonstration :", error instanceof Error ? error.message : "erreur inconnue"); process.exitCode = 1; });
