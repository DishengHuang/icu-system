import { redirect } from "next/navigation";

export default function PatientRoot({ params }: { params: { id: string } }) {
  redirect(`/patients/${params.id}/summary`);
}
