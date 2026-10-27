export type Role = "accueil" | "auxiliaire" | "technicien" | "responsable";
export type PatientType = "Externe" | "Hospitalisé";
export type BulletinStatus = "Enregistré" | "Prélevé" | "En analyse" | "Résultats saisis" | "Remis";
export type Interpretation = "Normal" | "Inférieur" | "Supérieur";
export type Discipline = "Hématologie" | "Biochimie" | "Parasitologie" | "Immunologie";

export interface Patient {
  id: string;
  code: string;
  nom: string;
  prenoms: string;
  sexe: "F" | "M";
  dateNaissance: string;
  telephone: string;
  type: PatientType;
  numeroDossier?: string;
  lit?: string;
  createdAt: string;
}

export interface Prescriber {
  id: string;
  nom: string;
  prenoms: string;
  specialite: string;
}

export interface Technician {
  id: string;
  nom: string;
  prenoms: string;
  grade: string;
}

export interface Product {
  id: string;
  name: string;
  lot: string;
  quantity: number;
  unit: string;
  openedAt: string;
  expiresAt: string;
  minimum: number;
  supplier: string;
}

export interface Parameter {
  id: string;
  name: string;
  unit: string;
  min: number;
  max: number;
  productIds: string[];
}

export interface AnalysisType {
  id: string;
  name: string;
  discipline: Discipline;
  turnaround: string;
  parameters: Parameter[];
}

export interface ResultValue {
  value: number;
  unit: string;
  min: number;
  max: number;
  interpretation: Interpretation;
  technicianId: string;
  enteredAt: string;
}

export interface Bulletin {
  id: string;
  ticket: string;
  patientId: string;
  prescriberId: string;
  analysisIds: string[];
  motif: string;
  createdAt: string;
  status: BulletinStatus;
  results: Record<string, ResultValue>;
}

export interface LabData {
  patients: Patient[];
  prescribers: Prescriber[];
  technicians: Technician[];
  products: Product[];
  analyses: AnalysisType[];
  bulletins: Bulletin[];
}

export interface LabAccount {
  username: string;
  password?: string;
  role: Role;
  name: string;
  initials: string;
}
