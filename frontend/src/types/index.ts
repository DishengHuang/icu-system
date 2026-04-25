export type PatientSummary = {
  id: number;
  display_id: number;
  mrn: string;
  full_name: string;
  room: string;
  primary_diagnosis: string;
  age: number;
  gender: string;
  clinical_status: string;
  latest_hr: number;
  latest_spo2: number;
};

export type MedicationRecord = {
  id: number;
  name: string;
  dosage: string;
  schedule: string;
  status: string;
};

export type DiagnosisRecord = {
  id: number;
  diagnosis: string;
  status: string;
  clinician: string;
  /** eICU dataset row vs app-entered clinical overlay */
  _source?: "eicu" | "clinical";
};

export type ClinicalNote = {
  id: number;
  author: string;
  note_type: string;
  content: string;
  /** eICU dataset `note` rows vs app-entered `note_clinical` overlay */
  _source?: "eicu" | "clinical";
};

export type InfusionRecord = {
  id: number;
  name: string;
  rate: string;
  status: string;
};

export type IntakeOutputSummary = {
  id: number;
  shift: string;
  intake_ml: number;
  output_ml: number;
  net_ml: number;
};

export type RespiratoryRecord = {
  id: number;
  device: string;
  mode: string;
  details: string;
};

export type LabRecord = {
  id: number;
  name: string;
  value: string;
  status: string;
};

export type CareProvider = {
  role: string;
  name: string;
};

export type VitalSigns = {
  heart_rate: number;
  blood_pressure: string;
  oxygen_saturation: number;
  temperature_c: number;
};

export type PatientDetail = PatientSummary & {
  allergies: string[];
  medications: MedicationRecord[];
  infusions: InfusionRecord[];
  intake_output: IntakeOutputSummary[];
  respiratory: RespiratoryRecord[];
  labs: LabRecord[];
  care_plan: string;
  care_providers: CareProvider[];
  past_medical_history: string[];
  diagnoses: DiagnosisRecord[];
  notes: ClinicalNote[];
  treatments: string[];
  assigned_nurses: string[];
  vitals: VitalSigns;
};
