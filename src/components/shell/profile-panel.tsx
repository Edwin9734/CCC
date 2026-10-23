"use client";

import { useEffect, useMemo, useRef, useState, type FormEvent, type ReactNode, type RefObject } from "react";
import { Plus, ShieldCheck, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { saveProfileAndConditions } from "@/lib/supabase/profile";
import { useDrawer } from "@/lib/use-drawer";
import {
  CONDITIONS,
  MAX_CONDITION_LENGTH,
  addCustomCondition,
  buildConditionNames,
  splitConditions
} from "@/lib/health-conditions";
import {
  MONTHS,
  SEX_OPTIONS,
  bmiCategory,
  computeBmi,
  parseBirth,
  parseHeightCm,
  parseWeight,
  profileToForm,
  validateProfileForm,
  type FormErrors,
  type ProfileData,
  type ProfileForm,
  type Sex
} from "@/lib/profile";

function makeSnapshot(form: ProfileForm, checked: Record<string, boolean>, custom: string[]) {
  return JSON.stringify({
    form,
    on: CONDITIONS.filter((condition) => checked[condition.key]).map((condition) => condition.key),
    custom
  });
}

function inputClass(invalid: boolean) {
  return cn(
    "w-full rounded-2xl border bg-background px-4 py-4 text-base outline-none placeholder:text-muted focus:border-accent",
    invalid ? "border-danger" : "border-black/10"
  );
}

function Field({
  label,
  htmlFor,
  error,
  hint,
  children
}: {
  label: string;
  htmlFor: string;
  error?: string;
  hint?: string;
  children: ReactNode;
}) {
  return (
    <div className="grid gap-2">
      <label htmlFor={htmlFor} className="text-sm font-semibold text-ink">
        {label}
      </label>
      {children}
      {hint && !error ? <p className="text-xs leading-5 text-muted">{hint}</p> : null}
      {error ? <p className="text-sm font-semibold text-danger">{error}</p> : null}
    </div>
  );
}

export function ProfilePanel({
  open,
  onClose,
  returnFocusRef,
  profile,
  conditions,
  onSaved,
  onProfileUpdated
}: {
  open: boolean;
  onClose: () => void;
  returnFocusRef: RefObject<HTMLElement | null>;
  profile: ProfileData | null;
  conditions: string[];
  onSaved: (profile: ProfileData, conditions: string[]) => void;
  onProfileUpdated: (profile: ProfileData) => void;
}) {
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);
  const panelRef = useRef<HTMLElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const [form, setForm] = useState<ProfileForm>(() => profileToForm(profile));
  const [checked, setChecked] = useState<Record<string, boolean>>(() => splitConditions(conditions).checked);
  const [custom, setCustom] = useState<string[]>(() => splitConditions(conditions).custom);
  const [customInput, setCustomInput] = useState("");
  const [customError, setCustomError] = useState<string | null>(null);
  const [errors, setErrors] = useState<FormErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [snapshot, setSnapshot] = useState("");
  const [now, setNow] = useState<Date | null>(null);

  // Cada vez que se abre, el formulario se llena con lo último que está guardado.
  useEffect(() => {
    if (!open) return;
    const nextForm = profileToForm(profile);
    const split = splitConditions(conditions);
    setForm(nextForm);
    setChecked(split.checked);
    setCustom(split.custom);
    setCustomInput("");
    setCustomError(null);
    setErrors({});
    setFormError(null);
    setSnapshot(makeSnapshot(nextForm, split.checked, split.custom));
    setNow(new Date());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const dirty = open && (makeSnapshot(form, checked, custom) !== snapshot || customInput.trim() !== "");

  const requestClose = () => {
    if (saving) return;
    if (dirty && !window.confirm("Tienes cambios sin guardar. ¿Quieres cerrar sin guardarlos?")) return;
    onClose();
  };

  useDrawer({ open, onClose: requestClose, panelRef, returnFocusRef });

  const clearError = (key: keyof ProfileForm) => {
    setErrors((prev) => {
      if (!prev[key]) return prev;
      const next = { ...prev };
      delete next[key];
      return next;
    });
  };

  const setField = <K extends keyof ProfileForm>(key: K, value: ProfileForm[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    clearError(key);
  };

  const birthPreview = now ? parseBirth(form, now) : null;
  const weightPreview = parseWeight(form.weight);
  const heightPreview = parseHeightCm(form.height);
  const bmi =
    weightPreview.value !== null && heightPreview.value !== null
      ? computeBmi(weightPreview.value, heightPreview.value)
      : null;

  const handleAddCustom = () => {
    const result = addCustomCondition(customInput, custom);
    if (!result.ok) {
      setCustomError(result.error);
      return;
    }
    setCustom(result.list);
    setCustomInput("");
    setCustomError(null);
  };

  const focusFirstError = () => {
    window.setTimeout(() => {
      const element = scrollRef.current?.querySelector<HTMLElement>('[aria-invalid="true"]');
      element?.scrollIntoView({ behavior: "smooth", block: "center" });
      element?.focus();
    }, 50);
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (saving) return;
    setFormError(null);

    // Si quedó una enfermedad escrita sin agregar, se agrega antes de guardar.
    let finalCustom = custom;
    if (customInput.trim()) {
      const result = addCustomCondition(customInput, custom);
      if (!result.ok) {
        setCustomError(result.error);
        setFormError("Revisa el campo «Otras enfermedades».");
        focusFirstError();
        return;
      }
      finalCustom = result.list;
    }

    const { errors: found, data } = validateProfileForm(form, new Date());
    setErrors(found);
    if (!data) {
      setFormError("Revisa los campos marcados en rojo.");
      focusFirstError();
      return;
    }

    setSaving(true);
    try {
      const names = buildConditionNames(checked, finalCustom);
      const result = await saveProfileAndConditions(supabase, data, names);

      if (result.conditionsError) {
        onProfileUpdated(data);
        setFormError(result.conditionsError);
      } else {
        onSaved(data, names);
      }
    } catch (err) {
      console.error("Error al guardar los datos del usuario:", err);
      setFormError("No se pudieron guardar tus datos. Revisa tu conexión e inténtalo de nuevo.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <div
        aria-hidden="true"
        className={cn(
          "no-print fixed inset-0 z-40 bg-black/40 transition-opacity duration-300 motion-reduce:transition-none",
          open ? "opacity-100" : "pointer-events-none opacity-0"
        )}
      />

      <aside
        ref={panelRef}
        id="profile-panel"
        role="dialog"
        aria-modal="true"
        aria-labelledby="profile-panel-title"
        aria-hidden={!open}
        className={cn(
          "no-print fixed inset-y-0 right-0 z-50 w-full bg-surface shadow-soft transition-[transform,visibility] duration-300 motion-reduce:transition-none sm:max-w-md lg:max-w-lg",
          open ? "visible translate-x-0" : "invisible translate-x-full"
        )}
      >
        <form onSubmit={handleSubmit} noValidate className="flex h-full flex-col">
          <div className="flex items-start justify-between gap-3 border-b border-black/5 px-5 py-4">
            <div>
              <h2 id="profile-panel-title" className="text-xl font-semibold text-ink">
                Mis datos
              </h2>
              <p className="mt-1 text-sm leading-6 text-muted">Estos datos nos ayudan a ajustar tu plan.</p>
            </div>
            <button
              type="button"
              onClick={requestClose}
              data-autofocus
              aria-label="Cerrar"
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-black/10 bg-white text-ink transition hover:bg-slate-50 focus:outline-none focus:ring-4 focus:ring-accent/15"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <div ref={scrollRef} className="flex-1 space-y-8 overflow-y-auto px-5 py-5">
            <div className="flex items-start gap-3 rounded-2xl border border-sky-200 bg-sky-50 p-4 text-sm leading-6 text-sky-900">
              <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0" />
              <p>Tus datos son privados: otros usuarios de la aplicación no pueden verlos.</p>
            </div>

            <section className="space-y-4">
              <h3 className="text-sm font-semibold uppercase tracking-[0.18em] text-muted">Datos personales</h3>

              <Field label="Nombre" htmlFor="profile-first-name" error={errors.firstName}>
                <input
                  id="profile-first-name"
                  type="text"
                  value={form.firstName}
                  onChange={(e) => setField("firstName", e.target.value)}
                  maxLength={60}
                  autoComplete="given-name"
                  placeholder="Ej. Edwin"
                  aria-invalid={errors.firstName ? true : undefined}
                  className={inputClass(Boolean(errors.firstName))}
                />
              </Field>

              <Field label="Apellidos" htmlFor="profile-last-name" error={errors.lastName}>
                <input
                  id="profile-last-name"
                  type="text"
                  value={form.lastName}
                  onChange={(e) => setField("lastName", e.target.value)}
                  maxLength={80}
                  autoComplete="family-name"
                  placeholder="Ej. Pérez López"
                  aria-invalid={errors.lastName ? true : undefined}
                  className={inputClass(Boolean(errors.lastName))}
                />
              </Field>

              <fieldset className="grid gap-2">
                <legend className="text-sm font-semibold text-ink">Fecha de nacimiento</legend>
                <div className="grid grid-cols-[1fr_1.6fr_1.2fr] gap-2">
                  <input
                    type="text"
                    inputMode="numeric"
                    aria-label="Día"
                    placeholder="Día"
                    maxLength={2}
                    value={form.birthDay}
                    onChange={(e) => setField("birthDay", e.target.value.replace(/\D/g, "").slice(0, 2))}
                    aria-invalid={errors.birthDay ? true : undefined}
                    className={inputClass(Boolean(errors.birthDay))}
                  />
                  <select
                    aria-label="Mes"
                    value={form.birthMonth}
                    onChange={(e) => {
                      setField("birthMonth", e.target.value);
                      clearError("birthDay");
                    }}
                    className={inputClass(Boolean(errors.birthDay))}
                  >
                    <option value="">Mes</option>
                    {MONTHS.map((name, index) => (
                      <option key={name} value={String(index + 1)}>
                        {name}
                      </option>
                    ))}
                  </select>
                  <input
                    type="text"
                    inputMode="numeric"
                    aria-label="Año"
                    placeholder="Año"
                    maxLength={4}
                    value={form.birthYear}
                    onChange={(e) => {
                      setField("birthYear", e.target.value.replace(/\D/g, "").slice(0, 4));
                      clearError("birthDay");
                    }}
                    className={inputClass(Boolean(errors.birthDay))}
                  />
                </div>
                {errors.birthDay ? (
                  <p className="text-sm font-semibold text-danger">{errors.birthDay}</p>
                ) : birthPreview && birthPreview.age !== null ? (
                  <p className="text-sm text-muted">
                    Tienes {birthPreview.age === 1 ? "1 año" : `${birthPreview.age} años`}.
                  </p>
                ) : null}
              </fieldset>

              <div className="grid gap-2">
                <p id="profile-sex-label" className="text-sm font-semibold text-ink">
                  Sexo
                </p>
                <div role="group" aria-labelledby="profile-sex-label" className="grid grid-cols-3 gap-2">
                  {SEX_OPTIONS.map((option) => {
                    const selected = form.sex === option.value;
                    return (
                      <button
                        key={option.value}
                        type="button"
                        aria-pressed={selected}
                        onClick={() => setField("sex", selected ? "" : (option.value as Sex))}
                        className={cn(
                          "rounded-2xl border px-3 py-3 text-sm font-semibold transition",
                          selected
                            ? "border-accent bg-accent text-white"
                            : "border-black/10 bg-white text-ink hover:bg-slate-50"
                        )}
                      >
                        {option.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <Field
                  label="Peso (libras)"
                  htmlFor="profile-weight"
                  error={errors.weight}
                  hint="Entre 40 y 900 libras."
                >
                  <input
                    id="profile-weight"
                    type="text"
                    inputMode="decimal"
                    value={form.weight}
                    onChange={(e) => setField("weight", e.target.value)}
                    placeholder="Ej. 165"
                    aria-invalid={errors.weight ? true : undefined}
                    className={inputClass(Boolean(errors.weight))}
                  />
                </Field>

                <Field
                  label="Estatura"
                  htmlFor="profile-height"
                  error={errors.height}
                  hint={
                    heightPreview.value !== null && form.height.trim()
                      ? `Se guardará como ${heightPreview.value} cm.`
                      : "En cm o en metros. Ej. 165 o 1.65."
                  }
                >
                  <input
                    id="profile-height"
                    type="text"
                    inputMode="decimal"
                    value={form.height}
                    onChange={(e) => setField("height", e.target.value)}
                    placeholder="Ej. 165 o 1.65"
                    aria-invalid={errors.height ? true : undefined}
                    className={inputClass(Boolean(errors.height))}
                  />
                </Field>
              </div>

              {bmi !== null ? (
                <div className="rounded-2xl border border-black/10 bg-white p-4 text-sm leading-6 text-ink">
                  <p>
                    <span className="font-semibold">
                      IMC: {bmi.toLocaleString("es-ES", { minimumFractionDigits: 1, maximumFractionDigits: 1 })}
                    </span>{" "}
                    · {bmiCategory(bmi)}
                  </p>
                  <p className="mt-1 text-xs text-muted">
                    Es solo una referencia. En adultos mayores el IMC es menos preciso: coméntalo con tu médico.
                  </p>
                </div>
              ) : null}
            </section>

            <section className="space-y-4">
              <h3 className="text-sm font-semibold uppercase tracking-[0.18em] text-muted">
                Médico y contacto de emergencia
              </h3>

              <Field label="Nombre de tu médico (opcional)" htmlFor="profile-doctor-name" error={errors.doctorName}>
                <input
                  id="profile-doctor-name"
                  type="text"
                  value={form.doctorName}
                  onChange={(e) => setField("doctorName", e.target.value)}
                  maxLength={100}
                  placeholder="Ej. Dra. Ana Morales"
                  aria-invalid={errors.doctorName ? true : undefined}
                  className={inputClass(Boolean(errors.doctorName))}
                />
              </Field>

              <Field label="Teléfono de tu médico (opcional)" htmlFor="profile-doctor-phone" error={errors.doctorPhone}>
                <input
                  id="profile-doctor-phone"
                  type="tel"
                  value={form.doctorPhone}
                  onChange={(e) => setField("doctorPhone", e.target.value)}
                  maxLength={20}
                  autoComplete="off"
                  placeholder="Ej. 5555 1234"
                  aria-invalid={errors.doctorPhone ? true : undefined}
                  className={inputClass(Boolean(errors.doctorPhone))}
                />
              </Field>

              <Field
                label="Contacto de emergencia: nombre (opcional)"
                htmlFor="profile-emergency-name"
                error={errors.emergencyName}
              >
                <input
                  id="profile-emergency-name"
                  type="text"
                  value={form.emergencyName}
                  onChange={(e) => setField("emergencyName", e.target.value)}
                  maxLength={100}
                  placeholder="Ej. María Pérez"
                  aria-invalid={errors.emergencyName ? true : undefined}
                  className={inputClass(Boolean(errors.emergencyName))}
                />
              </Field>

              <Field
                label="Contacto de emergencia: parentesco (opcional)"
                htmlFor="profile-emergency-relationship"
                error={errors.emergencyRelationship}
              >
                <input
                  id="profile-emergency-relationship"
                  type="text"
                  value={form.emergencyRelationship}
                  onChange={(e) => setField("emergencyRelationship", e.target.value)}
                  maxLength={40}
                  placeholder="Ej. Hija"
                  aria-invalid={errors.emergencyRelationship ? true : undefined}
                  className={inputClass(Boolean(errors.emergencyRelationship))}
                />
              </Field>

              <Field
                label="Contacto de emergencia: teléfono (opcional)"
                htmlFor="profile-emergency-phone"
                error={errors.emergencyPhone}
              >
                <input
                  id="profile-emergency-phone"
                  type="tel"
                  value={form.emergencyPhone}
                  onChange={(e) => setField("emergencyPhone", e.target.value)}
                  maxLength={20}
                  autoComplete="off"
                  placeholder="Ej. 5555 9876"
                  aria-invalid={errors.emergencyPhone ? true : undefined}
                  className={inputClass(Boolean(errors.emergencyPhone))}
                />
              </Field>
            </section>

            <section className="space-y-4">
              <div>
                <h3 className="text-sm font-semibold uppercase tracking-[0.18em] text-muted">
                  Enfermedades preexistentes
                </h3>
                <p className="mt-2 text-sm leading-6 text-muted">
                  Marca «Padece» en las que tengas. Las demás quedan como «No padece».
                </p>
              </div>

              <div className="space-y-3">
                {CONDITIONS.map((condition) => {
                  const padece = Boolean(checked[condition.key]);
                  return (
                    <div
                      key={condition.key}
                      role="group"
                      aria-label={condition.label}
                      className="rounded-3xl border border-black/5 bg-background p-4"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <p className="text-base font-semibold text-ink">{condition.label}</p>
                        <div className="flex gap-2">
                          <button
                            type="button"
                            aria-pressed={padece}
                            onClick={() => setChecked((prev) => ({ ...prev, [condition.key]: true }))}
                            className={cn(
                              "rounded-full border px-4 py-3 text-sm font-semibold transition",
                              padece
                                ? "border-amber-700 bg-amber-700 text-white"
                                : "border-black/10 bg-white text-ink hover:bg-slate-50"
                            )}
                          >
                            Padece
                          </button>
                          <button
                            type="button"
                            aria-pressed={!padece}
                            onClick={() => setChecked((prev) => ({ ...prev, [condition.key]: false }))}
                            className={cn(
                              "rounded-full border px-4 py-3 text-sm font-semibold transition",
                              !padece
                                ? "border-emerald-700 bg-emerald-700 text-white"
                                : "border-black/10 bg-white text-ink hover:bg-slate-50"
                            )}
                          >
                            No padece
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="grid gap-2">
                <label htmlFor="profile-custom-condition" className="text-sm font-semibold text-ink">
                  Otras enfermedades (si no está en la lista)
                </label>
                <div className="flex gap-2">
                  <input
                    id="profile-custom-condition"
                    type="text"
                    value={customInput}
                    onChange={(e) => {
                      setCustomInput(e.target.value);
                      setCustomError(null);
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        handleAddCustom();
                      }
                    }}
                    maxLength={MAX_CONDITION_LENGTH}
                    placeholder="Ej. Migraña"
                    aria-invalid={customError ? true : undefined}
                    className={cn(inputClass(Boolean(customError)), "flex-1")}
                  />
                  <button
                    type="button"
                    onClick={handleAddCustom}
                    aria-label="Agregar enfermedad"
                    className="flex shrink-0 items-center justify-center rounded-full bg-accent px-5 text-white shadow-soft transition hover:bg-accentDark focus:outline-none focus:ring-4 focus:ring-accent/15"
                  >
                    <Plus className="h-5 w-5" />
                  </button>
                </div>
                {customError ? <p className="text-sm font-semibold text-danger">{customError}</p> : null}

                {custom.length > 0 ? (
                  <ul className="mt-1 flex flex-wrap gap-2">
                    {custom.map((name) => (
                      <li
                        key={name}
                        className="flex items-center gap-1 rounded-full border border-black/10 bg-white py-1.5 pl-4 pr-1.5 text-sm font-semibold text-ink"
                      >
                        {name}
                        <button
                          type="button"
                          aria-label={`Quitar ${name}`}
                          onClick={() => setCustom((prev) => prev.filter((item) => item !== name))}
                          className="rounded-full p-2 text-muted transition hover:bg-slate-100"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-xs text-muted">Aún no agregaste otras enfermedades.</p>
                )}
              </div>
            </section>
          </div>

          <div className="border-t border-black/10 bg-surface px-5 py-4 pb-[calc(1rem+env(safe-area-inset-bottom))]">
            {formError ? (
              <p role="alert" className="mb-3 rounded-2xl bg-rose-50 px-4 py-3 text-sm font-semibold text-danger">
                {formError}
              </p>
            ) : null}
            <button
              type="submit"
              disabled={saving}
              className="w-full rounded-full bg-accent px-6 py-4 text-base font-semibold text-white shadow-soft transition hover:bg-accentDark disabled:cursor-not-allowed disabled:opacity-60"
            >
              {saving ? "Guardando..." : "Guardar"}
            </button>
          </div>
        </form>
      </aside>
    </>
  );
}