"use client";

import { ReactNode, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { AgentChatPanel } from "@/components/agent-chat-panel";
import { getPatient } from "@/services/api";
import type { PatientDetail } from "@/types";

export default function PatientLayout({ children }: { children: ReactNode }) {
  const params = useParams();
  const id = params?.id as string;
  const [patient, setPatient] = useState<PatientDetail | null>(null);

  useEffect(() => {
    if (id) {
      getPatient(id).then(setPatient).catch(console.error);
    }
  }, [id]);

  return (
    <div style={{
      display: "grid",
      gridTemplateColumns: "1fr",
      gap: 20,
      alignItems: "start",
    }}
      className="patient-layout-root"
    >
      <style>{`
        @media (min-width: 1100px) {
          .patient-layout-root {
            grid-template-columns: minmax(0, 1.9fr) 360px !important;
          }
          .agent-chat-sticky {
            position: sticky;
            top: 24px;
          }
        }
      `}</style>

      {/* Main content */}
      <div style={{ minWidth: 0 }}>
        {children}
      </div>

      {/* Agent Chat sidebar */}
      <div className="agent-chat-sticky">
        {patient ? (
          <AgentChatPanel patient={patient} />
        ) : (
          <div className="card" style={{ padding: 20 }}>
            <div className="muted" style={{ fontSize: "0.875rem" }}>Loading assistant…</div>
          </div>
        )}
      </div>
    </div>
  );
}
