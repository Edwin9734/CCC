"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { AllergyPanel, type AllergyInput } from "@/components/allergies/allergy-panel";
import type { ContactsInfo } from "@/lib/contacts";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import {
  createAllergy,
  createAllergyReaction,
  deleteAllergy,
  deleteAllergyReaction,
  updateAllergy,
  type AllergyReactionInput,
  type AllergyReactionRow,
  type AllergyRow
} from "@/lib/supabase/allergies";

export function AllergyManager({
  initialAllergies,
  initialReactions,
  contacts
}: {
  initialAllergies: AllergyRow[];
  initialReactions: AllergyReactionRow[];
  contacts: ContactsInfo | null;
}) {
  const router = useRouter();
  const supabase = createSupabaseBrowserClient();
  const [allergies, setAllergies] = useState<AllergyRow[]>(initialAllergies);
  const [reactions, setReactions] = useState<AllergyReactionRow[]>(initialReactions);

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

  const handleSaveReaction = async (input: AllergyReactionInput) => {
    const created = await createAllergyReaction(supabase, input);
    setReactions((prev) => [...prev, created].sort((a, b) => b.occurred_at.localeCompare(a.occurred_at)));
    router.refresh();
  };

  const handleDeleteReaction = async (id: string) => {
    await deleteAllergyReaction(supabase, id);
    setReactions((prev) => prev.filter((item) => item.id !== id));
    router.refresh();
  };

  return (
    <AllergyPanel
      allergies={allergies}
      reactions={reactions}
      contacts={contacts}
      onCreate={handleCreate}
      onUpdate={handleUpdate}
      onDelete={handleDelete}
      onSaveReaction={handleSaveReaction}
      onDeleteReaction={handleDeleteReaction}
    />
  );
}
