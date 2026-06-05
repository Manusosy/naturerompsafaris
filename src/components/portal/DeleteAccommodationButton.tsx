"use client";

import { Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

export function DeleteAccommodationButton({
  id,
  name,
}: {
  id: string;
  name: string;
}) {
  const router = useRouter();
  const [isDeleting, setIsDeleting] = useState(false);

  async function deleteAccommodation() {
    const confirmed = window.confirm(
      `Delete "${name}" permanently?\n\nThis will remove the accommodation from the admin dashboard and public website. This action cannot be undone.`,
    );
    if (!confirmed) return;

    setIsDeleting(true);
    const res = await fetch("/api/portal/records", {
      body: JSON.stringify({ action: "delete", collection: "accommodations", id }),
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      method: "POST",
    });
    setIsDeleting(false);

    if (!res.ok) {
      const json = await res.json().catch(() => ({}));
      window.alert(String((json as Record<string, unknown>).message ?? "Unable to delete this accommodation."));
      return;
    }

    router.refresh();
  }

  return (
    <button
      className="accommodation-admin-card__delete"
      disabled={isDeleting}
      onClick={deleteAccommodation}
      type="button"
    >
      <Trash2 size={13} strokeWidth={2.2} />
      {isDeleting ? "Deleting..." : "Delete"}
    </button>
  );
}
