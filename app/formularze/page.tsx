import type { Metadata } from "next";
import { PatientForms } from "@/components/sections/PatientForms";

export const metadata: Metadata = {
  title: "Formularze dla pacjentów",
  description:
    "Lista raportów i formularzy uzupełniających dla pacjentów.",
};

export default function FormsPage() {
  return <PatientForms />;
}
