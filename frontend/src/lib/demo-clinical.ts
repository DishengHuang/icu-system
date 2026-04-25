import type { PatientDetail, PatientSummary } from "@/types";

export type TrendPoint = { t: string; hr: number; rr: number; sao2: number; temp: number; map: number; };
export type DemoExtras = {
  summaryNote: string;
  trends: TrendPoint[];
  labs: { name: string; latest: string; prev: string; flag: string }[];
  microbiology: { site: string; organism: string; result: string }[];
  medications: { name: string; dosage: string; schedule: string; status: string }[];
  infusions: { name: string; rate: string; status: string }[];
  intakeOutput: { shift: string; intake: number; output: number; net: number }[];
  respiratory: { label: string; value: string }[];
  diagnoses: { diagnosis: string; status: string; clinician: string }[];
  notes: { author: string; type: string; content: string }[];
  nursing: { area: string; content: string }[];
  carePlan: { category: string; goal: string; status: string }[];
  alerts: string[];
};

const DEFAULT_TRENDS: TrendPoint[] = [
  { t: "00:00", hr: 96, rr: 18, sao2: 95, temp: 37.8, map: 74 },
  { t: "04:00", hr: 104, rr: 20, sao2: 94, temp: 38.1, map: 72 },
  { t: "08:00", hr: 112, rr: 24, sao2: 92, temp: 38.4, map: 68 },
  { t: "12:00", hr: 108, rr: 22, sao2: 93, temp: 38.0, map: 70 },
  { t: "16:00", hr: 102, rr: 20, sao2: 94, temp: 37.7, map: 73 },
  { t: "20:00", hr: 98, rr: 18, sao2: 95, temp: 37.5, map: 75 },
];

const DEMO_BY_ID: Record<number, DemoExtras> = {
  1: {
    summaryNote: "High-acuity septic patient with oxygen needs and vasopressor support.",
    trends: DEFAULT_TRENDS,
    labs: [
      { name: "WBC", latest: "15.2 K/uL", prev: "13.8 K/uL", flag: "High" },
      { name: "Lactate", latest: "2.8 mmol/L", prev: "3.4 mmol/L", flag: "High" },
      { name: "Creatinine", latest: "1.6 mg/dL", prev: "1.4 mg/dL", flag: "High" },
      { name: "Platelets", latest: "140 K/uL", prev: "152 K/uL", flag: "Low" },
    ],
    microbiology: [
      { site: "Blood culture", organism: "Gram-negative rods", result: "Final identification pending" },
      { site: "Sputum", organism: "Pseudomonas aeruginosa", result: "Sensitive to piperacillin/tazobactam" },
    ],
    medications: [
      { name: "Meropenem", dosage: "1 g IV", schedule: "Every 8 hours", status: "Active" },
      { name: "Vancomycin", dosage: "1.25 g IV", schedule: "Every 12 hours", status: "Active" },
      { name: "Norepinephrine", dosage: "4 mcg/min", schedule: "Continuous", status: "Active" },
    ],
    infusions: [
      { name: "Norepinephrine", rate: "4 mcg/min", status: "Running" },
      { name: "Normal Saline", rate: "75 mL/hr", status: "Running" },
    ],
    intakeOutput: [
      { shift: "Night", intake: 1200, output: 700, net: 500 },
      { shift: "Day", intake: 1450, output: 980, net: 470 },
    ],
    respiratory: [
      { label: "Device", value: "High-flow nasal cannula" },
      { label: "Mode", value: "HFNC" },
      { label: "FiO2", value: "50%" },
      { label: "Flow", value: "40 L/min" },
    ],
    diagnoses: [
      { diagnosis: "Septic shock", status: "Confirmed", clinician: "Dr. Maya Chen" },
      { diagnosis: "Acute hypoxic respiratory failure", status: "Active", clinician: "Dr. Maya Chen" },
    ],
    notes: [
      { author: "Dr. Maya Chen", type: "Progress Note", content: "Continue antibiotic coverage and titrate vasopressors to MAP > 65." },
      { author: "Nurse Taylor", type: "Nursing Note", content: "Urine output borderline low overnight. Family updated at bedside." },
    ],
    nursing: [
      { area: "Assessment", content: "Sedated but arousable. Skin warm. Breath sounds coarse bilaterally." },
      { area: "Care", content: "Turned every 2 hours; oral care and line dressing checks completed." },
      { area: "Charting", content: "MAP remained 68-72 overnight with low-dose pressor support." },
    ],
    carePlan: [
      { category: "Hemodynamics", goal: "Maintain MAP > 65 mmHg", status: "In progress" },
      { category: "Respiratory", goal: "Wean oxygen as tolerated", status: "In progress" },
      { category: "Infection", goal: "Review cultures and narrow antibiotics", status: "Pending" },
    ],
    alerts: [
      "High predicted ICU mortality risk",
      "Positive fluid balance over last 24 hours",
      "Abnormal inflammatory and renal markers",
    ],
  },
  2: {
    summaryNote: "Lower-acuity post-operative monitoring with improving symptoms.",
    trends: [
      { t: "00:00", hr: 82, rr: 16, sao2: 98, temp: 36.8, map: 83 },
      { t: "04:00", hr: 80, rr: 16, sao2: 99, temp: 36.8, map: 84 },
      { t: "08:00", hr: 78, rr: 17, sao2: 99, temp: 36.7, map: 86 },
      { t: "12:00", hr: 84, rr: 18, sao2: 98, temp: 36.9, map: 82 },
      { t: "16:00", hr: 81, rr: 17, sao2: 99, temp: 36.9, map: 85 },
      { t: "20:00", hr: 80, rr: 16, sao2: 99, temp: 36.8, map: 84 },
    ],
    labs: [
      { name: "Troponin", latest: "0.19 ng/mL", prev: "0.23 ng/mL", flag: "High" },
      { name: "Potassium", latest: "4.1 mmol/L", prev: "3.9 mmol/L", flag: "Normal" },
    ],
    microbiology: [],
    medications: [{ name: "Heparin", dosage: "5000 units", schedule: "Every 12 hours", status: "Active" }],
    infusions: [{ name: "Nitroglycerin", rate: "5 mcg/min", status: "Tapering" }],
    intakeOutput: [{ shift: "24h", intake: 1800, output: 2100, net: -300 }],
    respiratory: [{ label: "Device", value: "Nasal cannula" }, { label: "Flow", value: "2 L/min" }, { label: "SpO2 Goal", value: ">94%" }],
    diagnoses: [{ diagnosis: "NSTEMI", status: "Confirmed", clinician: "Dr. Maya Chen" }],
    notes: [{ author: "Dr. Maya Chen", type: "Admission Note", content: "Chest pain improving after initial treatment. Continue telemetry." }],
    nursing: [{ area: "Care", content: "Ambulating with assistance. Pain controlled." }],
    carePlan: [{ category: "Cardiac", goal: "Trend troponins and telemetry", status: "In progress" }, { category: "Pain", goal: "Maintain pain score below 4/10", status: "In progress" }],
    alerts: ["Monitor troponin trend"],
  },
};

export function getDemoExtras(patientId: number): DemoExtras { return DEMO_BY_ID[patientId] ?? DEMO_BY_ID[1]; }
export function computeDashboardStats(patients: PatientSummary[]) {
  const total = patients.length;
  const critical = patients.filter((p) => p.clinical_status === "Critical").length;
  const avgHr = total ? Math.round(patients.reduce((sum, p) => sum + (p.latest_hr ?? 0), 0) / total) : 0;
  const lowSpO2 = patients.filter((p) => (p.latest_spo2 ?? 100) <= 92).length;
  return { total, critical, avgHr, lowSpO2 };
}
export function mergePatientData(patient: PatientDetail): PatientDetail & { demo: DemoExtras } { return { ...patient, demo: getDemoExtras(patient.id) }; }
