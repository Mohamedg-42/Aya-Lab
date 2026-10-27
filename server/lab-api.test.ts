import { describe, expect, it } from "vitest";
import { roleAllowsSnapshot } from "./lab-api";

const base = () => ({
  patients: [{ id: "p1", nom: "Kouamé" }],
  prescribers: [{ id: "d1", nom: "Koffi" }],
  technicians: [{ id: "t1", nom: "Kouamé" }],
  analyses: [{ id: "a1", parameters: [{ id: "r1" }] }],
  products: [{ id: "x1", quantity: 5, expiresAt: "2027-06-01", name: "Réactif", lot: "L1" }],
  bulletins: [{ id: "b1", ticket: "AY-261019-001", patientId: "p1", prescriberId: "d1", analysisIds: ["a1"], motif: "Bilan", createdAt: "2026-10-19T08:00:00", status: "Enregistré", results: {} }],
});

describe("autorisations laboratoire", () => {
  it("autorise l’accueil à ajouter un patient", () => {
    const before = base();
    const after = structuredClone(before);
    after.patients.push({ id: "p2", nom: "Yao" });
    expect(roleAllowsSnapshot("accueil", before, after)).toBe(true);
  });

  it("refuse à l’accueil une modification de stock", () => {
    const before = base();
    const after = structuredClone(before);
    after.products[0]!.quantity -= 1;
    expect(roleAllowsSnapshot("accueil", before, after)).toBe(false);
  });

  it("autorise à l’auxiliaire la progression immédiate du prélèvement", () => {
    const before = base();
    const after = structuredClone(before);
    after.bulletins[0]!.status = "Prélevé";
    expect(roleAllowsSnapshot("auxiliaire", before, after)).toBe(true);
  });

  it("refuse à l’auxiliaire de sauter une étape", () => {
    const before = base();
    const after = structuredClone(before);
    after.bulletins[0]!.status = "En analyse";
    expect(roleAllowsSnapshot("auxiliaire", before, after)).toBe(false);
  });

  it("autorise au technicien les résultats d’un bulletin en analyse", () => {
    const before = base();
    before.bulletins[0]!.status = "En analyse";
    const after = structuredClone(before);
    after.bulletins[0]!.status = "Résultats saisis";
    after.bulletins[0]!.results = { r1: { value: 12, technicianId: "t1" } };
    expect(roleAllowsSnapshot("technicien", before, after)).toBe(true);
  });

  it("refuse au technicien une modification de dossier patient", () => {
    const before = base();
    const after = structuredClone(before);
    after.patients[0]!.nom = "Nom remplacé";
    expect(roleAllowsSnapshot("technicien", before, after)).toBe(false);
  });

  it("refuse le doublon d’un numéro de ticket", () => {
    const before = base();
    const after = structuredClone(before);
    after.bulletins.push({ ...before.bulletins[0]!, id: "b2" });
    expect(roleAllowsSnapshot("accueil", before, after)).toBe(false);
  });
});
