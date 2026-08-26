import { contactData } from "@/content/contact";

export const legalConfig = {
  effectiveDate: null as string | null,
  ownerName: "Filip Proniewicz",
  businessName: null as string | null,
  taxId: null as string | null,
  businessAddress: null as string | null,
  contactEmail: contactData.email,
};

export function formatLegalUpdatedAt() {
  return legalConfig.effectiveDate
    ? `Ostatnia aktualizacja: ${legalConfig.effectiveDate}`
    : "Ostatnia aktualizacja: data zostanie uzupełniona przed publikacją finalnej wersji.";
}

export function formatLegalOwnerLine(roleLabel: "Usługodawcą" | "Administratorem danych") {
  const parts = [legalConfig.ownerName];

  if (legalConfig.businessName) {
    parts.push(`działający pod nazwą: ${legalConfig.businessName}`);
  }

  if (legalConfig.taxId) {
    parts.push(`NIP: ${legalConfig.taxId}`);
  }

  if (legalConfig.businessAddress) {
    parts.push(`adres: ${legalConfig.businessAddress}`);
  }

  const missingDetails = [
    legalConfig.businessName ? null : "pełna nazwa działalności",
    legalConfig.taxId ? null : "NIP",
    legalConfig.businessAddress ? null : "adres działalności",
  ].filter(Boolean);

  return `${roleLabel} jest ${parts.join(", ")}.${
    missingDetails.length > 0
      ? ` Dane do uzupełnienia przed publikacją finalnej wersji: ${missingDetails.join(", ")}.`
      : ""
  }`;
}
