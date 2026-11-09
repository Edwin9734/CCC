"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { AllergyPanel, type AllergyInput } from "@/components/allergies/allergy-panel";
import type { ContactsInfo } from "@/lib/contacts";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { createAllergy, deleteAllergy, updateAllergy, type AllergyRow } from "@/lib/supabase/allergies";

export function AllergyManager({
  initialAllergies,
  contacts
}: {
  initialAllergies: AllergyRow[];
  contacts: ContactsInfo | null;
}) {
  const router = useRouter();
  const supabase = createSupabaseBrowserClient();
  const [allergies, setAllergies] = useState<AllergyRow[]>(initialAllergies);

  const handleCreate = async (input: AllergyInput) => {
    const created = await createAllergy(supabase, input);
    setAllergies((prev) => [...prev, created]);
    router.refresh();
  };

  const handleUpdate = async (id: string, input: AllergyInput) => {
    const updated = await updateAllergy(supabase, id, input);
    setAllergies((prev) => prev.map((item) => (item.id === id ? updated : item)));
    router.refresh();
  };

  const handleDelete = async (id: string) => {
    await deleteAllergy(supabase, id);
    setAllergies((prev) => prev.filter((item) => item.id !== id));
    router.refresh();
  };

  return (
    <AllergyPanel
      allergies={allergies}
      contacts={contacts}
      onCreate={handleCreate}
      onUpdate={handleUpdate}
      onDelete={handleDelete}
    />
  );
}
