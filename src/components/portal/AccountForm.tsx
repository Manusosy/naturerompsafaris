"use client";

import { Eye, EyeOff, Save } from "lucide-react";
import { useRouter } from "next/navigation";
import { useId, useMemo, useState } from "react";

const roleLabels: Record<string, string> = {
  admin: "Administrator",
  editor: "Content editor",
  operations: "Operations",
};

function PasswordField({
  autoComplete,
  label,
  name,
  placeholder,
  required = false,
}: {
  autoComplete: string;
  label: string;
  name: string;
  placeholder?: string;
  required?: boolean;
}) {
  const inputId = useId();
  const [visible, setVisible] = useState(false);

  return (
    <label className="portal-account__field" htmlFor={inputId}>
      <span>{label}</span>
      <span className="portal-account__password-wrap">
        <input
          autoComplete={autoComplete}
          id={inputId}
          name={name}
          placeholder={placeholder}
          required={required}
          type={visible ? "text" : "password"}
        />
        <button
          aria-label={visible ? "Hide password" : "Show password"}
          aria-pressed={visible}
          className="portal-account__password-toggle"
          onClick={() => setVisible((value) => !value)}
          type="button"
        >
          {visible ? <EyeOff size={18} /> : <Eye size={18} />}
        </button>
      </span>
    </label>
  );
}

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

  const initials = useMemo(() => {
    const parts = [firstName, lastName].filter(Boolean).join(" ").trim();
    if (!parts) return "NR";
    return parts
      .split(/\s+/)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase() ?? "")
      .join("");
  }, [firstName, lastName]);

  const displayName = [firstName, lastName].filter(Boolean).join(" ").trim() || "Portal user";
  const roleLabel = roleLabels[role ?? ""] || role || "Team member";

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("saving");
    setMessage("");

    const formData = new FormData(event.currentTarget);
    const password = String(formData.get("password") ?? "");
    const confirmPassword = String(formData.get("confirmPassword") ?? "");

    if (password || confirmPassword) {
      if (password !== confirmPassword) {
        setStatus("error");
        setMessage("Passwords must match.");
        return;
      }
      if (password.length < 12) {
        setStatus("error");
        setMessage("Password must be at least 12 characters.");
        return;
      }
      if (!/[a-zA-Z]/.test(password) || !/[0-9]/.test(password)) {
        setStatus("error");
        setMessage("Password must include at least one letter and one number.");
        return;
      }
    }

    const payload = Object.fromEntries(formData);
    delete payload.confirmPassword;

    const response = await fetch("/api/portal/account", {
      body: JSON.stringify(payload),
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      method: "POST",
    });
    const body = await response.json().catch(() => ({}));
    if (!response.ok) {
      setStatus("error");
      setMessage(typeof body.message === "string" ? body.message : "Unable to update your account.");
      return;
    }
    setStatus("saved");
    setMessage("Account updated.");
    router.refresh();
  }

  return (
    <div className="portal-account">
      <section className="portal-account__hero">
        <span aria-hidden className="portal-account__avatar">{initials}</span>
        <div>
          <h2>{displayName}</h2>
          <p className="portal-account__email">{email}</p>
          <span className="portal-account__role">{roleLabel}</span>
        </div>
      </section>

      <form className="portal-account__form" onSubmit={submit}>
        <section className="portal-account__section">
          <div className="portal-account__section-head">
            <h3>Profile details</h3>
            <p>Update the name shown across the portal.</p>
          </div>
          <div className="portal-account__grid">
            <label className="portal-account__field">
              <span>First name</span>
              <input defaultValue={firstName} name="firstName" required />
            </label>
            <label className="portal-account__field">
              <span>Second name</span>
              <input defaultValue={lastName} name="lastName" required />
            </label>
          </div>
        </section>

        <section className="portal-account__section">
          <div className="portal-account__section-head">
            <h3>Sign-in details</h3>
            <p>Your email and role are managed by an administrator.</p>
          </div>
          <div className="portal-account__readonly">
            <div>
              <span>Email</span>
              <strong>{email}</strong>
            </div>
            <div>
              <span>Role</span>
              <strong>{roleLabel}</strong>
            </div>
          </div>
        </section>

        <section className="portal-account__section">
          <div className="portal-account__section-head">
            <h3>Change password</h3>
            <p>Leave blank to keep your current password. Use at least 12 characters with letters and numbers.</p>
          </div>
          <div className="portal-account__grid">
            <PasswordField
              autoComplete="new-password"
              label="New password"
              name="password"
              placeholder="Leave blank to keep current"
            />
            <PasswordField
              autoComplete="new-password"
              label="Confirm new password"
              name="confirmPassword"
              placeholder="Repeat new password"
            />
          </div>
        </section>

        <div className="portal-account__actions">
          <button className="portal-button" disabled={status === "saving"} type="submit">
            <Save size={16} />
            {status === "saving" ? "Saving..." : "Save account"}
          </button>
          {message ? (
            <p className={status === "error" ? "portal-form-message is-error" : "portal-form-message"}>{message}</p>
          ) : null}
        </div>
      </form>
    </div>
  );

}
