"use client";

import { Eye, EyeOff } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useId, useState } from "react";

type AuthMode = "forgot" | "login" | "register" | "reset";

const endpointByMode: Record<AuthMode, string> = {
  forgot: "/api/users/forgot-password",
  login: "/api/portal/login",
  register: "/api/portal/register",
  reset: "/api/users/reset-password",
};

function PasswordField({
  autoComplete,
  label,
  name,
  required = true,
}: {
  autoComplete: string;
  label: string;
  name: string;
  required?: boolean;
}) {
  const inputId = useId();
  const [visible, setVisible] = useState(false);

  return (
    <label className="portal-auth__password" htmlFor={inputId}>
      {label}
      <span className="portal-auth__password-wrap">
        <input
          autoComplete={autoComplete}
          id={inputId}
          name={name}
          required={required}
          type={visible ? "text" : "password"}
        />
        <button
          aria-label={visible ? "Hide password" : "Show password"}
          aria-pressed={visible}
          className="portal-auth__password-toggle"
          onClick={() => setVisible((value) => !value)}
          type="button"
        >
          {visible ? <EyeOff size={18} /> : <Eye size={18} />}
        </button>
      </span>
    </label>
  );
}

type RegisterPhase = "details" | "verify";

export function AuthPanel({
  mode,
  token,
}: {
  mode: AuthMode;
  token?: string;
}) {
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [registerPhase, setRegisterPhase] = useState<RegisterPhase>("verify");
  const [registerEmail, setRegisterEmail] = useState("");

  async function requestVerificationCode(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setMessage("");
    setLoading(true);

    const formData = new FormData(event.currentTarget);
    const email = String(formData.get("email") ?? "").trim().toLowerCase();

    try {
      const res = await fetch("/api/portal/register/request-code", {
        body: JSON.stringify({ email }),
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        method: "POST",
      });

      const data = await res.json().catch(() => null);
      const apiMessage =
        data?.message ||
        "If this email is authorized for portal access, a verification code has been sent.";

      if (!res.ok) {
        setError("We could not send a verification code right now. Try again shortly.");
        return;
      }

      setRegisterEmail(email);
      setRegisterPhase("details");
      setMessage(apiMessage);
    } finally {
      setLoading(false);
    }
  }

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setMessage("");
    setLoading(true);

    const formData = new FormData(event.currentTarget);
    const password = String(formData.get("password") ?? "");
    const confirmPassword = String(formData.get("confirmPassword") ?? "");

    if ((mode === "register" || mode === "reset") && password !== confirmPassword) {
      setError("Passwords must match.");
      setLoading(false);
      return;
    }

    if (mode === "register") {
      if (password.length < 12) {
        setError("Password must be at least 12 characters.");
        setLoading(false);
        return;
      }

      if (!/[a-zA-Z]/.test(password) || !/[0-9]/.test(password)) {
        setError("Password must include at least one letter and one number.");
        setLoading(false);
        return;
      }
    }

    const payload: Record<string, unknown> = {};
    formData.forEach((value, key) => {
      if (key !== "confirmPassword") payload[key] = value;
    });
    if (mode === "register" && registerEmail) {
      payload.email = registerEmail;
    }
    if (token) payload.token = token;

    try {
      const res = await fetch(endpointByMode[mode], {
        body: JSON.stringify(payload),
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        method: "POST",
      });

      if (!res.ok) {
        const data = await res.json().catch(() => null);
        const apiMessage =
          data?.errors?.[0]?.message || data?.message || "We could not complete that request.";
        setError(mode === "register" && res.status >= 400 ? "This account cannot be created." : apiMessage);
        return;
      }

      if (mode === "forgot") {
        setMessage("If the account exists, a password reset link has been sent.");
        return;
      }

      if (mode === "reset") {
        window.location.assign("/admin/login?reset=1");
        return;
      }

      window.location.assign("/admin");
    } finally {
      setLoading(false);
    }
  }

  const isRegister = mode === "register";
  const isForgot = mode === "forgot";
  const isReset = mode === "reset";
  const isRegisterVerifyStep = isRegister && registerPhase === "verify";
  const isRegisterDetailsStep = isRegister && registerPhase === "details";
  const title = isRegister
    ? isRegisterVerifyStep
      ? "Verify Email"
      : "Create Account"
    : isForgot
      ? "Reset Access"
      : isReset
        ? "Choose New Password"
        : "Login";

  return (
    <main className="portal-auth">
      <section className="portal-auth__image" aria-label="Safari operations portal">
        <div>
          <span>Nature Romp Safaris Portal</span>
          <h1>Kenya and Tanzania safari operations, content, and client enquiries in one secure portal.</h1>
        </div>
      </section>
      <section className="portal-auth__panel">
        <div className="portal-auth__card">
          <Image src="/assets/img/logo.jpg" alt="Nature Romp Safaris" width={128} height={74} priority />
          <h2>{title}</h2>
          {isRegisterVerifyStep ? (
            <form onSubmit={requestVerificationCode}>
              <label>
                Company email
                <input
                  autoComplete="email"
                  defaultValue={registerEmail}
                  name="email"
                  placeholder="you@naturerompsafaris.com"
                  required
                  type="email"
                />
              </label>
              <p className="portal-auth__meta">
                Only verified @naturerompsafaris.com addresses can request portal access.
              </p>
              {error ? <p className="portal-auth__error">{error}</p> : null}
              {message ? <p className="portal-auth__message">{message}</p> : null}
              <button className="portal-auth__submit" disabled={loading} type="submit">
                {loading ? "Please wait..." : "Send verification code"}
              </button>
            </form>
          ) : (
            <form onSubmit={submit}>
              {isRegisterDetailsStep ? (
                <>
                  <p className="portal-auth__meta">
                    Verification code sent to <strong>{registerEmail}</strong>.{" "}
                    <button
                      className="portal-auth__link"
                      onClick={() => {
                        setRegisterPhase("verify");
                        setError("");
                        setMessage("");
                      }}
                      type="button"
                    >
                      Use a different email
                    </button>
                  </p>
                  <label>
                    Verification code
                    <input
                      autoComplete="one-time-code"
                      inputMode="numeric"
                      maxLength={6}
                      name="code"
                      pattern="[0-9]{6}"
                      placeholder="6-digit code"
                      required
                      type="text"
                    />
                  </label>
                  <div className="portal-auth__grid">
                    <label>
                      First name
                      <input autoComplete="given-name" name="firstName" required />
                    </label>
                    <label>
                      Second name
                      <input autoComplete="family-name" name="lastName" required />
                    </label>
                  </div>
                </>
              ) : null}
              {!isReset && !isRegisterDetailsStep ? (
                <label>
                  Email
                  <input autoComplete="email" name="email" required type="email" />
                </label>
              ) : null}
              {!isForgot && !isRegisterVerifyStep ? (
                <PasswordField
                  autoComplete={isRegister ? "new-password" : "current-password"}
                  label="Password"
                  name="password"
                />
              ) : null}
              {(isRegisterDetailsStep || isReset) ? (
                <PasswordField
                  autoComplete="new-password"
                  label="Repeat password"
                  name="confirmPassword"
                />
              ) : null}
              {error ? <p className="portal-auth__error">{error}</p> : null}
              {message ? <p className="portal-auth__message">{message}</p> : null}
              <button className="portal-auth__submit" disabled={loading} type="submit">
                {loading
                  ? "Please wait..."
                  : isRegisterDetailsStep
                    ? "Create account"
                    : isForgot
                      ? "Send reset link"
                      : isReset
                        ? "Update password"
                        : "Login"}
              </button>
            </form>
          )}
          <div className="portal-auth__links">
            {isRegister ? (
              <p className="portal-auth__meta">
                Already have an account?{" "}
                <Link className="portal-auth__link" href="/admin/login">Login</Link>
              </p>
            ) : null}
            {mode === "login" ? (
              <>
                <p className="portal-auth__meta">
                  <Link className="portal-auth__link" href="/admin/forgot-password">Forgot password?</Link>
                </p>
                <p className="portal-auth__meta">
                  Don&apos;t have an account?{" "}
                  <Link className="portal-auth__link" href="/admin/register">Register</Link>
                </p>
              </>
            ) : null}
            {isForgot || isReset ? (
              <p className="portal-auth__meta">
                <Link className="portal-auth__link" href="/admin/login">Back to login</Link>
              </p>
            ) : null}
          </div>
        </div>
      </section>
    </main>
  );
}
