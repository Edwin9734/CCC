export type Sex = "female" | "male" | "other";

// Los nombres de los campos son los mismos de las columnas de la tabla profiles.
export interface ProfileData {
  first_name: string | null;
  last_name: string | null;
  birth_date: string | null; // "YYYY-MM-DD"
  sex: Sex | null;
  weight_lb: number | null;
  height_cm: number | null;
  doctor_name: string | null;
  doctor_phone: string | null;
  emergency_contact_name: string | null;
  emergency_contact_relationship: string | null;
  emergency_contact_phone: string | null;
}

export const SEX_OPTIONS: { value: Sex; label: string }[] = [
  { value: "female", label: "Mujer" },
  { value: "male", label: "Hombre" },
  { value: "other", label: "Otro" }
];

export const MONTHS = [
  "Enero",
  "Febrero",
  "Marzo",
  "Abril",
  "Mayo",
  "Junio",
  "Julio",
  "Agosto",
  "Septiembre",
  "Octubre",
  "Noviembre",
  "Diciembre"
];

export const WEIGHT_MIN_LB = 40;
export const WEIGHT_MAX_LB = 900;
export const HEIGHT_MIN_CM = 100;
export const HEIGHT_MAX_CM = 230;
export const MAX_AGE = 120;

// ---------------------------------------------------------------------------
// Notas del saludo (se ocultan con la ✕ durante la visita, usando una cookie de sesión)
// ---------------------------------------------------------------------------

export const NOTES_COOKIE = "ccc_notes_dismissed";

export function parseDismissedNotes(value: string | null | undefined): string[] {
  if (!value) return [];
  return value
    .split(".")
    .map((item) => item.trim())
    .filter(Boolean);
}

export function saveDismissedNotes(ids: string[]) {
  if (typeof document === "undefined") return;
  const secure = window.location.protocol === "https:" ? "; Secure" : "";
  document.cookie = `${NOTES_COOKIE}=${ids.join(".")}; path=/; SameSite=Lax${secure}`;
}

export function clearDismissedNotes() {
  if (typeof document === "undefined") return;
  document.cookie = `${NOTES_COOKIE}=; path=/; max-age=0; SameSite=Lax`;
}

// ---------------------------------------------------------------------------
// Saludo
// ---------------------------------------------------------------------------

// De 5:00 a 11:59 días, de 12:00 a 17:59 tardes y de 18:00 a 4:59 noches.
export function greetingForHour(hour: number): string {
  if (hour >= 5 && hour < 12) return "Buenos días";
  if (hour >= 12 && hour < 18) return "Buenas tardes";
  return "Buenas noches";
}

export function initialOf(name: string | null | undefined): string | null {
  const trimmed = (name ?? "").trim();
  if (!trimmed) return null;
  return Array.from(trimmed)[0].toLocaleUpperCase("es");
}

export interface ProfileNote {
  kind: "name" | "extra";
  text: string;
}

// Solo se muestra una nota a la vez: primero la de "faltan tus datos" (sin nombre),
// y después la más discreta de fecha de nacimiento y sexo.
export function currentNote(profile: ProfileData | null, dismissed: string[]): ProfileNote | null {
  const hasName = Boolean(profile?.first_name && profile.first_name.trim().length > 0);

  if (!hasName) {
    if (dismissed.includes("name")) return null;
    return {
      kind: "name",
      text: "Ingresa tus datos: toca aquí o usa el botón de arriba a la derecha."
    };
  }

  const missingBirth = !profile?.birth_date;
  const missingSex = !profile?.sex;
  if (!missingBirth && !missingSex) return null;
  if (dismissed.includes("extra")) return null;

  const missing =
    missingBirth && missingSex ? "tu fecha de nacimiento y tu sexo" : missingBirth ? "tu fecha de nacimiento" : "tu sexo";

  return { kind: "extra", text: `Completa ${missing} para ajustar tu plan.` };
}

// ---------------------------------------------------------------------------
// Formulario y validaciones
// ---------------------------------------------------------------------------

export interface ProfileForm {
  firstName: string;
  lastName: string;
  birthDay: string;
  birthMonth: string;
  birthYear: string;
  sex: Sex | "";
  weight: string;
  height: string;
  doctorName: string;
  doctorPhone: string;
  emergencyName: string;
  emergencyRelationship: string;
  emergencyPhone: string;
}

export type FormErrors = Partial<Record<keyof ProfileForm, string>>;

function clean(text: string): string {
  return text.replace(/\s+/g, " ").trim();
}

function pad2(n: number): string {
  return String(n).padStart(2, "0");
}

export function profileToForm(profile: ProfileData | null): ProfileForm {
  let birthDay = "";
  let birthMonth = "";
  let birthYear = "";

  if (profile?.birth_date) {
    const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(profile.birth_date);
    if (match) {
      birthYear = match[1];
      birthMonth = String(Number(match[2]));
      birthDay = String(Number(match[3]));
    }
  }

  return {
    firstName: profile?.first_name ?? "",
    lastName: profile?.last_name ?? "",
    birthDay,
    birthMonth,
    birthYear,
    sex: profile?.sex ?? "",
    weight: profile?.weight_lb !== null && profile?.weight_lb !== undefined ? String(profile.weight_lb) : "",
    height: profile?.height_cm !== null && profile?.height_cm !== undefined ? String(profile.height_cm) : "",
    doctorName: profile?.doctor_name ?? "",
    doctorPhone: profile?.doctor_phone ?? "",
    emergencyName: profile?.emergency_contact_name ?? "",
    emergencyRelationship: profile?.emergency_contact_relationship ?? "",
    emergencyPhone: profile?.emergency_contact_phone ?? ""
  };
}

export function calculateAge(year: number, month: number, day: number, today: Date): number {
  let age = today.getFullYear() - year;
  const month0 = today.getMonth() + 1;
  const hadBirthday = month0 > month || (month0 === month && today.getDate() >= day);
  if (!hadBirthday) age -= 1;
  return age;
}

export interface FieldResult<T> {
  value: T | null;
  error: string | null;
}

export interface BirthResult extends FieldResult<string> {
  age: number | null;
}

export function parseBirth(
  form: Pick<ProfileForm, "birthDay" | "birthMonth" | "birthYear">,
  today: Date
): BirthResult {
  const dayText = form.birthDay.trim();
  const monthText = form.birthMonth.trim();
  const yearText = form.birthYear.trim();
  const filled = [dayText, monthText, yearText].filter(Boolean).length;

  if (filled === 0) return { value: null, age: null, error: null };
  if (filled < 3) {
    return { value: null, age: null, error: "Completa día, mes y año, o deja las tres casillas vacías." };
  }

  const d = Number(dayText);
  const m = Number(monthText);
  const y = Number(yearText);
  const inRange =
    Number.isInteger(d) &&
    Number.isInteger(m) &&
    Number.isInteger(y) &&
    y >= 1900 &&
    y <= 9999 &&
    m >= 1 &&
    m <= 12 &&
    d >= 1 &&
    d <= 31;
  const date = inRange ? new Date(y, m - 1, d) : null;

  if (!date || date.getFullYear() !== y || date.getMonth() !== m - 1 || date.getDate() !== d) {
    return { value: null, age: null, error: "Esa fecha no existe. Revisa el día, el mes y el año." };
  }

  const midnight = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  if (date.getTime() > midnight.getTime()) {
    return { value: null, age: null, error: "La fecha de nacimiento no puede ser futura." };
  }

  const age = calculateAge(y, m, d, today);
  if (age > MAX_AGE) {
    return { value: null, age: null, error: `Revisa el año de nacimiento: la edad máxima es ${MAX_AGE} años.` };
  }

  return { value: `${y}-${pad2(m)}-${pad2(d)}`, age, error: null };
}

export function parseWeight(text: string): FieldResult<number> {
  const raw = text.trim();
  if (!raw) return { value: null, error: null };

  const n = Number(raw.replace(",", "."));
  if (!Number.isFinite(n) || n < WEIGHT_MIN_LB || n > WEIGHT_MAX_LB) {
    return { value: null, error: `Escribe tu peso en libras, entre ${WEIGHT_MIN_LB} y ${WEIGHT_MAX_LB}.` };
  }

  return { value: Math.round(n * 10) / 10, error: null };
}

// Acepta centímetros (165) o metros (1.65 o 1,65).
export function parseHeightCm(text: string): FieldResult<number> {
  const raw = text.trim();
  if (!raw) return { value: null, error: null };

  const message = `Escribe tu estatura en centímetros (por ejemplo 165) o en metros (por ejemplo 1.65), entre ${HEIGHT_MIN_CM} y ${HEIGHT_MAX_CM} cm.`;
  const n = Number(raw.replace(",", "."));
  if (!Number.isFinite(n) || n <= 0) return { value: null, error: message };

  const cm = Math.round((n < 3 ? n * 100 : n) * 10) / 10;
  if (cm < HEIGHT_MIN_CM || cm > HEIGHT_MAX_CM) return { value: null, error: message };

  return { value: cm, error: null };
}

function checkText(text: string, max: number): FieldResult<string> {
  const value = clean(text);
  if (value.length > max) return { value: null, error: `Máximo ${max} caracteres.` };
  return { value: value || null, error: null };
}

const PHONE_PATTERN = /^[0-9+()\s-]{6,20}$/;

function checkPhone(text: string): FieldResult<string> {
  const value = clean(text);
  if (!value) return { value: null, error: null };
  if (!PHONE_PATTERN.test(value)) {
    return {
      value: null,
      error: "Escribe un teléfono de 6 a 20 caracteres: números, espacios, +, guiones o paréntesis."
    };
  }
  return { value, error: null };
}

// IMC con el peso en libras y la estatura en centímetros.
export function computeBmi(weightLb: number, heightCm: number): number {
  const kg = weightLb * 0.45359237;
  const meters = heightCm / 100;
  return kg / (meters * meters);
}

export function bmiCategory(bmi: number): string {
  if (bmi < 18.5) return "Bajo peso";
  if (bmi < 25) return "Normal";
  if (bmi < 30) return "Sobrepeso";
  return "Obesidad";
}

export function validateProfileForm(
  form: ProfileForm,
  today: Date
): { errors: FormErrors; data: ProfileData | null } {
  const errors: FormErrors = {};

  const first = checkText(form.firstName, 60);
  if (first.error) errors.firstName = first.error;

  const last = checkText(form.lastName, 80);
  if (last.error) errors.lastName = last.error;

  const birth = parseBirth(form, today);
  if (birth.error) errors.birthDay = birth.error;

  const weight = parseWeight(form.weight);
  if (weight.error) errors.weight = weight.error;

  const height = parseHeightCm(form.height);
  if (height.error) errors.height = height.error;

  const doctorName = checkText(form.doctorName, 100);
  if (doctorName.error) errors.doctorName = doctorName.error;

  const doctorPhone = checkPhone(form.doctorPhone);
  if (doctorPhone.error) errors.doctorPhone = doctorPhone.error;

  const emergencyName = checkText(form.emergencyName, 100);
  if (emergencyName.error) errors.emergencyName = emergencyName.error;

  const emergencyRelationship = checkText(form.emergencyRelationship, 40);
  if (emergencyRelationship.error) errors.emergencyRelationship = emergencyRelationship.error;

  const emergencyPhone = checkPhone(form.emergencyPhone);
  if (emergencyPhone.error) errors.emergencyPhone = emergencyPhone.error;

  if (Object.keys(errors).length > 0) return { errors, data: null };

  const data: ProfileData = {
    first_name: first.value,
    last_name: last.value,
    birth_date: birth.value,
    sex: form.sex || null,
    weight_lb: weight.value,
    height_cm: height.value,
    doctor_name: doctorName.value,
    doctor_phone: doctorPhone.value,
    emergency_contact_name: emergencyName.value,
    emergency_contact_relationship: emergencyRelationship.value,
    emergency_contact_phone: emergencyPhone.value
  };

  return { errors, data };
}