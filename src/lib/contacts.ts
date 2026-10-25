import type { ProfileData } from "@/lib/profile";

export interface ContactsInfo {
  doctor: { name: string | null; phone: string | null } | null;
  emergency: { name: string | null; relationship: string | null; phone: string | null } | null;
}

function textOrNull(value: string | null | undefined): string | null {
  const trimmed = (value ?? "").trim();
  return trimmed ? trimmed : null;
}

// Arma los datos del médico y del contacto de emergencia a partir del perfil.
// Devuelve null si no hay nada guardado.
export function buildContacts(profile: ProfileData | null): ContactsInfo | null {
  if (!profile) return null;

  const doctorName = textOrNull(profile.doctor_name);
  const doctorPhone = textOrNull(profile.doctor_phone);
  const emergencyName = textOrNull(profile.emergency_contact_name);
  const emergencyRelationship = textOrNull(profile.emergency_contact_relationship);
  const emergencyPhone = textOrNull(profile.emergency_contact_phone);

  const doctor = doctorName || doctorPhone ? { name: doctorName, phone: doctorPhone } : null;
  const emergency =
    emergencyName || emergencyPhone
      ? { name: emergencyName, relationship: emergencyRelationship, phone: emergencyPhone }
      : null;

  if (!doctor && !emergency) return null;
  return { doctor, emergency };
}

// Enlace para llamar: deja solo los números y un + inicial.
export function telHref(phone: string): string {
  const trimmed = phone.trim();
  const plus = trimmed.startsWith("+") ? "+" : "";
  return `tel:${plus}${trimmed.replace(/\D/g, "")}`;
}