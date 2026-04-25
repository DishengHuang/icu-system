import { PatientDetail, PatientSummary } from "@/types";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL ?? "http://127.0.0.1:8000/api";

type AgentChatPayload = {
  patientId: number;
  message: string;
  history?: AgentChatHistoryMessage[];
  context?: {
    page?: string;
    patientName?: string;
    clinicalStatus?: string;
    primaryDiagnosis?: string;
  };
};

export type AgentChatHistoryMessage = {
  role: "user" | "assistant";
  text: string;
};

const fallbackPatients: PatientSummary[] = [
  {
    id: 1,
    display_id: 1001,
    mrn: "ICU-1001",
    full_name: "John Carter",
    room: "ICU-12",
    primary_diagnosis: "Sepsis with respiratory distress",
    age: 67,
    gender: "Male",
    clinical_status: "Critical",
    latest_hr: 102,
    latest_spo2: 94,
  },
  {
    id: 2,
    display_id: 1002,
    mrn: "ICU-1002",
    full_name: "Maria Chen",
    room: "ICU-07",
    primary_diagnosis: "Post-operative monitoring",
    age: 54,
    gender: "Female",
    clinical_status: "Stable",
    latest_hr: 80,
    latest_spo2: 99,
  },
];

const fallbackPatientDetail: PatientDetail = {
  ...fallbackPatients[0],
  allergies: ["Penicillin", "Latex"],
  medications: [
    {
      id: 1,
      name: "Meropenem",
      dosage: "1 g IV",
      schedule: "Every 8 hours",
      status: "Active",
    },
  ],
  infusions: [
    {
      id: 1,
      name: "Norepinephrine",
      rate: "4 mcg/min",
      status: "Running",
    },
    {
      id: 2,
      name: "Normal saline",
      rate: "75 mL/hr",
      status: "Running",
    },
  ],
  intake_output: [
    {
      id: 1,
      shift: "Last 24h",
      intake_ml: 2450,
      output_ml: 1980,
      net_ml: 470,
    },
  ],
  respiratory: [
    {
      id: 1,
      device: "High-flow nasal cannula",
      mode: "HFNC",
      details: "FiO2 50%, flow 40 L/min",
    },
  ],
  labs: [
    {
      id: 1,
      name: "WBC",
      value: "15.2 K/uL",
      status: "High",
    },
    {
      id: 2,
      name: "Lactate",
      value: "2.8 mmol/L",
      status: "High",
    },
    {
      id: 3,
      name: "Creatinine",
      value: "1.6 mg/dL",
      status: "High",
    },
  ],
  care_plan:
    "Maintain hemodynamic stability, monitor cultures, and wean oxygen as tolerated.",
  care_providers: [
    { role: "Doctor", name: "Dr. Maya Chen" },
    { role: "Respiratory Therapist", name: "Alex Rivera" },
  ],
  past_medical_history: ["Type 2 diabetes", "Hypertension", "CKD stage 2"],
  diagnoses: [
    {
      id: 1,
      diagnosis: "Septic shock",
      status: "Confirmed",
      clinician: "Dr. Maya Chen",
    },
  ],
  notes: [
    {
      id: 1,
      author: "Dr. Maya Chen",
      note_type: "Progress Note",
      content:
        "Patient responding to fluids and vasopressors. Continue antibiotic coverage.",
    },
  ],
  treatments: ["IV fluids", "Broad-spectrum antibiotics", "Oxygen therapy"],
  assigned_nurses: ["Nurse Taylor"],
  vitals: {
    heart_rate: 102,
    blood_pressure: "102/64",
    oxygen_saturation: 94,
    temperature_c: 38.1,
  },
};

async function request<T>(path: string, fallback: T): Promise<T> {
  try {
    const response = await fetch(`${API_BASE_URL}${path}`, {
      cache: "no-store",
    });
    if (!response.ok) {
      return fallback;
    }
    return (await response.json()) as T;
  } catch {
    return fallback;
  }
}

export function getPatients(query?: string): Promise<PatientSummary[]> {
  const suffix = query ? `?q=${encodeURIComponent(query)}` : "";
  return request(`/patients${suffix}`, fallbackPatients);
}

export function getPatient(patientId: string): Promise<PatientDetail> {
  const fallback =
    patientId === "2"
      ? {
          ...fallbackPatientDetail,
          ...fallbackPatients[1],
          full_name: "Maria Chen",
          allergies: ["Aspirin sensitivity"],
          assigned_nurses: ["Nurse Patel"],
          primary_diagnosis: "Post-operative monitoring",
          infusions: [
            {
              id: 3,
              name: "Nitroglycerin",
              rate: "5 mcg/min",
              status: "Tapering",
            },
          ],
          intake_output: [
            {
              id: 2,
              shift: "Last 24h",
              intake_ml: 1800,
              output_ml: 2100,
              net_ml: -300,
            },
          ],
          respiratory: [
            {
              id: 2,
              device: "Nasal cannula",
              mode: "Low-flow O2",
              details: "2 L/min, SpO2 goal > 94%",
            },
          ],
          labs: [
            {
              id: 4,
              name: "Troponin",
              value: "0.19 ng/mL",
              status: "High",
            },
            {
              id: 5,
              name: "Potassium",
              value: "4.1 mmol/L",
              status: "Normal",
            },
          ],
          care_plan: "Monitor cardiac rhythm, trend troponins, and manage pain.",
          vitals: {
            heart_rate: 80,
            blood_pressure: "128/78",
            oxygen_saturation: 99,
            temperature_c: 36.8,
          },
        }
      : fallbackPatientDetail;

  return request(`/patients/${patientId}`, fallback);
}

export async function sendAgentChatMessage(
  payload: AgentChatPayload
): Promise<string> {
  const response = await fetch(`${API_BASE_URL}/agent/chat`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      patient_id: payload.patientId,
      message: payload.message,
      history: payload.history,
      context: payload.context
        ? {
            page: payload.context.page,
            patient_name: payload.context.patientName,
            clinical_status: payload.context.clinicalStatus,
            primary_diagnosis: payload.context.primaryDiagnosis,
          }
        : undefined,
    }),
  });

  if (!response.ok) {
    let detail = "Agent request failed";
    try {
      const errorData = (await response.json()) as { detail?: string };
      if (errorData.detail) {
        detail = errorData.detail;
      }
    } catch {
      // Ignore JSON parse errors and fall back to the generic message.
    }
    throw new Error(detail);
  }

  const data = (await response.json()) as { reply?: string };
  if (!data.reply) {
    throw new Error("Agent reply missing");
  }

  return data.reply;
}

type StreamAgentChatHandlers = {
  onDelta: (chunk: string) => void;
  onDone?: () => void;
};

function handleStreamEventBlock(
  eventBlock: string,
  handlers: StreamAgentChatHandlers
): void {
  const dataLines = eventBlock
    .split("\n")
    .filter((line) => line.startsWith("data:"))
    .map((line) => line.slice(5).trim());

  if (dataLines.length === 0) {
    return;
  }

  const payloadText = dataLines.join("\n");
  const eventData = JSON.parse(payloadText) as {
    type?: string;
    text?: string;
  };

  if (eventData.type === "delta" && eventData.text) {
    handlers.onDelta(eventData.text);
  } else if (eventData.type === "error") {
    throw new Error(eventData.text || "Agent stream failed");
  } else if (eventData.type === "done") {
    handlers.onDone?.();
  }
}

export async function streamAgentChatMessage(
  payload: AgentChatPayload,
  handlers: StreamAgentChatHandlers
): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/agent/chat/stream`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      patient_id: payload.patientId,
      message: payload.message,
      history: payload.history,
      context: payload.context
        ? {
            page: payload.context.page,
            patient_name: payload.context.patientName,
            clinical_status: payload.context.clinicalStatus,
            primary_diagnosis: payload.context.primaryDiagnosis,
          }
        : undefined,
    }),
  });

  if (!response.ok) {
    let detail = "Agent stream request failed";
    try {
      const errorData = (await response.json()) as { detail?: string };
      if (errorData.detail) {
        detail = errorData.detail;
      }
    } catch {
      // Ignore JSON parse errors and fall back to the generic message.
    }
    throw new Error(detail);
  }

  if (!response.body) {
    throw new Error("Streaming response body is unavailable.");
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { value, done } = await reader.read();
    if (done) {
      break;
    }

    buffer += decoder.decode(value, { stream: true });
    const events = buffer.split("\n\n");
    buffer = events.pop() ?? "";

    for (const eventBlock of events) {
      handleStreamEventBlock(eventBlock, handlers);
    }
  }

  const trailing = buffer.trim();
  if (trailing) {
    handleStreamEventBlock(trailing, handlers);
  }
}
