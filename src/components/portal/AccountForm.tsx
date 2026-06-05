"use client";

import { Save } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

type AccountFormProps = {
  email?: string;
  firstName?: string;
  lastName?: string;
  role?: string;
};

export function AccountForm({ email, firstName, lastName, role }: AccountFormProps) {
  const router = useRouter();
  const [status, setStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [message, setMessage] = useState("");

  async function submit(formData: FormData) {
    setStatus("saving");
    setMessage("");
    const response = await fetch("/api/portal/account", {
      body: JSON.stringify(Object.fromEntries(formData)),
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      method: "POST",
    });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) {
      setStatus("error");
      setMessage(typeof payload.message === "string" ? payload.message : "Unable to update your account.");
      return;
    }
    setStatus("saved");
    setMessage("Account updated.");
    router.refresh();
  }

  return (
    <form action={submit} className="portal-section-card portal-account-form">
      <div className="portal-section-card__head">
        <div>
          <h2>My account</h2>
          <p>Update your portal profile details. Email is managed by an administrator.</p>
        </div>
      </div>
      <div className="portal-form-grid">
        <label>
          First name
          <input defaultValue={firstName} name="firstName" required />
        </label>
        <label>
          Second name
          <input defaultValue={lastName} name="lastName" required />
        </label>
        <label>
          Email
          <input disabled value={email ?? ""} />
        </label>
        <label>
          Role
          <input disabled value={role ?? "admin"} />
        </label>
        <label className="is-wide">
          New password
          <input autoComplete="new-password" name="password" placeholder="Leave blank to keep current password" type="password" />
        </label>
      </div>
      <button className="portal-button" disabled={status === "saving"} type="submit">
        <Save size={16} />
        {status === "saving" ? "Saving..." : "Save account"}
      </button>
      {message ? <p className={status === "error" ? "portal-form-message is-error" : "portal-form-message"}>{message}</p> : null}
    </form>
  );
}
