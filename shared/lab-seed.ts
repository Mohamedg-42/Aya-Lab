import type { AnalysisType, Bulletin, LabAccount, LabData, Patient, Prescriber, Product, Technician } from "./lab";

const day = (offset: number) => {
  const date = new Date("2026-10-19T12:00:00");
  date.setDate(date.getDate() + offset);
  return date.toISOString().slice(0, 10);
};
const names = [
  ["Kouamé", "Aya Marie", "F"], ["Koné", "Moussa", "M"], ["Yao", "Aïssata", "F"], ["Bamba", "Ibrahim", "M"],
  ["N'Guessan", "Émilie", "F"], ["Traoré", "Adama", "M"], ["Koffi", "Nathalie", "F"], ["Diallo", "Mamadou", "M"],
  ["Aka", "Béatrice", "F"], ["Touré", "Kader", "M"], ["Kouassi", "Mariette", "F"], ["Ouattara", "Issouf", "M"],
  ["Yapi", "Caroline", "F"], ["Gnahoré", "Armand", "M"], ["Soro", "Fatoumata", "F"], ["N'Dri", "Jean-Marc", "M"],
  ["Kacou", "Solange", "F"], ["Cissé", "Abdoulaye", "M"], ["Boni", "Estelle", "F"], ["Kra", "Éric", "M"],
  ["Diabaté", "Mariam", "F"], ["Amani", "Patrick", "M"], ["Zadi", "Claudine", "F"], ["Fofana", "Oumar", "M"],
  ["Guei", "Rose", "F"], ["N'Cho", "Pascal", "M"], ["Brou", "Angéline", "F"], ["Dago", "Yves", "M"],
  ["Kouadio", "Mireille", "F"], ["Bédi", "Franck", "M"],
];

export const demoTechnicians: Technician[] = [
  { id: "tech-1", nom: "Kouamé", prenoms: "Marcel", grade: "Technicien supérieur" },
  { id: "tech-2", nom: "Yao", prenoms: "Brigitte", grade: "Technicienne de laboratoire" },
  { id: "tech-3", nom: "Traoré", prenoms: "Souleymane", grade: "Technicien supérieur" },
  { id: "tech-4", nom: "Koffi", prenoms: "Hélène", grade: "Technicienne de laboratoire" },
];

export const demoPrescribers: Prescriber[] = [
  { id: "pres-1", nom: "Koffi", prenoms: "Agnès", specialite: "Médecine générale" },
  { id: "pres-2", nom: "Yao", prenoms: "Serge", specialite: "Pédiatrie" },
  { id: "pres-3", nom: "N'Guessan", prenoms: "Martine", specialite: "Gynécologie-obstétrique" },
  { id: "pres-4", nom: "Kouamé", prenoms: "Félix", specialite: "Médecine interne" },
  { id: "pres-5", nom: "Bamba", prenoms: "Adama", specialite: "Urgences" },
  { id: "pres-6", nom: "Koné", prenoms: "Fatou", specialite: "Médecine générale" },
  { id: "pres-7", nom: "Aka", prenoms: "Jean-Claude", specialite: "Cardiologie" },
  { id: "pres-8", nom: "Traoré", prenoms: "Mariam", specialite: "Pédiatrie" },
  { id: "pres-9", nom: "Yapi", prenoms: "Édouard", specialite: "Chirurgie" },
  { id: "pres-10", nom: "Kouassi", prenoms: "Clémentine", specialite: "Médecine générale" },
];

const products: Product[] = [
  ["prod-1", "Réactif hémoglobine cyanméthémoglobine", "HGB-2608-A", 18, "mL", "2026-09-02", "2027-03-12", 5, "CFAO Healthcare"],
  ["prod-2", "Diluant hématologie", "DIL-2607-C", 420, "mL", "2026-08-21", "2026-11-08", 100, "Medis Côte d'Ivoire"],
  ["prod-3", "Lyseur hématologie", "LYS-2605-B", 95, "mL", "2026-08-01", "2026-10-27", 30, "Medis Côte d'Ivoire"],
  ["prod-4", "Solution de nettoyage automate", "NET-2609-A", 300, "mL", "2026-09-14", "2027-06-30", 80, "Bio-Rad CI"],
  ["prod-5", "Glucose oxydase / peroxydase", "GLU-2603-D", 36, "tests", "2026-09-10", "2026-10-23", 10, "CFAO Healthcare"],
  ["prod-6", "Créatinine enzymatique", "CRE-2604-A", 68, "tests", "2026-08-30", "2027-01-15", 20, "CFAO Healthcare"],
  ["prod-7", "Bandelettes urinaires multiparamètres", "URI-2609-B", 44, "unités", "2026-09-08", "2027-02-04", 15, "Pharmivoire"],
  ["prod-8", "Colorant May-Grünwald", "MGG-2602-C", 125, "mL", "2026-08-18", "2026-10-20", 25, "SIVOP"],
  ["prod-9", "Colorant Giemsa", "GIE-2605-A", 210, "mL", "2026-08-22", "2027-01-28", 40, "SIVOP"],
  ["prod-10", "Kit goutte épaisse / frottis", "PAL-2606-B", 72, "tests", "2026-09-16", "2026-12-02", 20, "Bio-Rad CI"],
  ["prod-11", "Réactif CRP latex", "CRP-2601-A", 12, "tests", "2026-08-05", "2026-10-18", 8, "Laborex CI"],
  ["prod-12", "Test rapide VIH 1/2", "VIH-2607-D", 35, "tests", "2026-09-12", "2027-04-11", 12, "UNICEF Supply"],
  ["prod-13", "Test rapide HBsAg", "HBV-2608-B", 28, "tests", "2026-09-13", "2026-12-19", 10, "UNICEF Supply"],
  ["prod-14", "Réactif ASLO latex", "ASL-2602-C", 19, "tests", "2026-08-11", "2026-10-30", 6, "Laborex CI"],
  ["prod-15", "Éthanol 70 %", "ETH-2609-A", 850, "mL", "2026-09-18", "2027-09-18", 250, "Pharmivoire"],
].map(([id, name, lot, quantity, unit, openedAt, expiresAt, minimum, supplier]) => ({
  id: String(id), name: String(name), lot: String(lot), quantity: Number(quantity), unit: String(unit),
  openedAt: String(openedAt), expiresAt: String(expiresAt), minimum: Number(minimum), supplier: String(supplier),
}));

const analyses: AnalysisType[] = [
  { id: "ana-nfs", name: "Numération formule sanguine (NFS)", discipline: "Hématologie", turnaround: "4 h", parameters: [
    { id: "par-hb", name: "Hémoglobine", unit: "g/dL", min: 12, max: 16, productIds: ["prod-1"] },
    { id: "par-gb", name: "Leucocytes", unit: "G/L", min: 4, max: 10, productIds: ["prod-2", "prod-3"] },
    { id: "par-plaq", name: "Plaquettes", unit: "G/L", min: 150, max: 400, productIds: ["prod-2", "prod-3"] },
    { id: "par-vgm", name: "VGM", unit: "fL", min: 80, max: 100, productIds: ["prod-2"] },
  ]},
  { id: "ana-gly", name: "Glycémie à jeun", discipline: "Biochimie", turnaround: "2 h", parameters: [
    { id: "par-gly", name: "Glucose", unit: "g/L", min: 0.7, max: 1.1, productIds: ["prod-5"] },
  ]},
  { id: "ana-crea", name: "Créatininémie", discipline: "Biochimie", turnaround: "2 h", parameters: [
    { id: "par-crea", name: "Créatinine", unit: "mg/L", min: 6, max: 12, productIds: ["prod-6"] },
  ]},
  { id: "ana-gee", name: "Goutte épaisse", discipline: "Parasitologie", turnaround: "3 h", parameters: [
    { id: "par-parasite", name: "Parasitémie P. falciparum", unit: "parasites/µL", min: 0, max: 0, productIds: ["prod-8", "prod-9", "prod-10"] },
  ]},
  { id: "ana-crp", name: "Protéine C-réactive (CRP)", discipline: "Immunologie", turnaround: "2 h", parameters: [
    { id: "par-crp", name: "CRP", unit: "mg/L", min: 0, max: 5, productIds: ["prod-11"] },
  ]},
  { id: "ana-urine", name: "Bandelette urinaire", discipline: "Biochimie", turnaround: "30 min", parameters: [
    { id: "par-leuco-ur", name: "Leucocytes urinaires", unit: "leuco/µL", min: 0, max: 10, productIds: ["prod-7"] },
    { id: "par-glucose-ur", name: "Glucose urinaire", unit: "g/L", min: 0, max: 0.15, productIds: ["prod-7"] },
  ]},
  { id: "ana-aslo", name: "ASLO", discipline: "Immunologie", turnaround: "2 h", parameters: [
    { id: "par-aslo", name: "Antistreptolysine O", unit: "UI/mL", min: 0, max: 200, productIds: ["prod-14"] },
  ]},
  { id: "ana-vih", name: "Sérologie VIH 1/2", discipline: "Immunologie", turnaround: "1 h", parameters: [
    { id: "par-vih", name: "Index de dépistage", unit: "S/CO", min: 0, max: 1, productIds: ["prod-12"] },
  ]},
  { id: "ana-hbs", name: "Antigène HBs", discipline: "Immunologie", turnaround: "1 h", parameters: [
    { id: "par-hbs", name: "Index HBsAg", unit: "S/CO", min: 0, max: 1, productIds: ["prod-13"] },
  ]},
];

const patients: Patient[] = names.map(([nom, prenoms, sexe], index) => {
  const hospitalized = [1, 4, 7, 9, 12, 15, 17, 20, 23, 26].includes(index);
  const ageYear = 1958 + ((index * 7) % 54);
  return {
    id: `pat-${String(index + 1).padStart(3, "0")}`,
    code: `AY-${String(index + 1).padStart(5, "0")}`,
    nom: String(nom), prenoms: String(prenoms), sexe: sexe as "F" | "M",
    dateNaissance: `${ageYear}-${String((index % 12) + 1).padStart(2, "0")}-${String((index % 26) + 1).padStart(2, "0")}`,
    telephone: `07 ${String(12 + index).padStart(2, "0")} ${String(30 + index).padStart(2, "0")} ${String(41 + index).padStart(2, "0")} ${String(50 + index).padStart(2, "0")}`,
    type: hospitalized ? "Hospitalisé" : "Externe",
    ...(hospitalized ? { numeroDossier: `D-AY-${String(3800 + index).padStart(5, "0")}`, lit: `L${(index % 18) + 1}` } : {}),
    createdAt: day(-((index * 11) % 160)),
  };
});

const statuses: Bulletin["status"][] = [
  ...Array(14).fill("Enregistré"), ...Array(5).fill("Prélevé"), ...Array(8).fill("En analyse"),
  ...Array(7).fill("Résultats saisis"), ...Array(6).fill("Remis"),
];
const analysisKeys = analyses.map((a) => a.id);
const bulletins: Bulletin[] = statuses.map((status, index) => {
  const selected = index % 7 === 0 ? [analysisKeys[index % analysisKeys.length], analysisKeys[(index + 1) % analysisKeys.length]] : [analysisKeys[(index * 3 + 1) % analysisKeys.length]];
  const dateOffset = index < 12 ? 0 : -((index % 21) + 1);
  const createdAt = `${day(dateOffset)}T${String(7 + (index % 11)).padStart(2, "0")}:${String((index * 7) % 60).padStart(2, "0")}:00`;
  const resultRows: Bulletin["results"] = {};
  if (["Résultats saisis", "Remis"].includes(status)) {
    for (const aid of selected) {
      const analysis = analyses.find((a) => a.id === aid)!;
      for (const parameter of analysis.parameters) {
        const raw = parameter.min === 0 && parameter.max === 0 ? 0 : parameter.min + (parameter.max - parameter.min) * (0.35 + ((index % 4) * 0.09));
        const value = Number(raw.toFixed(parameter.max < 2 ? 2 : 1));
        resultRows[parameter.id] = {
          value, unit: parameter.unit, min: parameter.min, max: parameter.max,
          interpretation: value < parameter.min ? "Inférieur" : value > parameter.max ? "Supérieur" : "Normal",
          technicianId: `tech-${(index % 4) + 1}`, enteredAt: createdAt,
        };
      }
    }
  }
  return {
    id: `bul-${String(index + 1).padStart(4, "0")}`,
    ticket: `AY-${day(dateOffset).slice(2, 4)}${day(dateOffset).slice(5, 7)}${day(dateOffset).slice(8, 10)}-${String(1001 + index).padStart(4, "0")}`,
    patientId: patients[(index * 7 + 3) % patients.length]!.id,
    prescriberId: demoPrescribers[index % demoPrescribers.length]!.id,
    analysisIds: selected,
    motif: ["Fièvre persistante", "Bilan de routine", "Contrôle thérapeutique", "Douleurs abdominales", "Suivi prénatal", "Altération de l’état général", "Suspicion de paludisme"][index % 7]!,
    createdAt, status, results: resultRows,
  };
});

export const demoLabData: LabData = {
  patients,
  prescribers: demoPrescribers,
  technicians: demoTechnicians,
  products,
  analyses,
  bulletins,
};

export const demoAccounts: LabAccount[] = [
  { username: "accueil", password: "Ayame2026!", role: "accueil", name: "Accueil laboratoire", initials: "AC" },
  { username: "auxiliaire", password: "Ayame2026!", role: "auxiliaire", name: "Auxiliaire de laboratoire", initials: "AX" },
  { username: "technicien", password: "Ayame2026!", role: "technicien", name: "Marcel Kouamé", initials: "MK" },
  { username: "responsable", password: "Ayame2026!", role: "responsable", name: "Responsable du laboratoire", initials: "RL" },
];
