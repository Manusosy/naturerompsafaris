"use client";

import { Eye, EyeOff } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useId, useRef, useState } from "react";

import { SIGNUP_GENERIC_SENT_MESSAGE } from "@/lib/portal-signup";

type AuthMode = "forgot" | "login" | "register" | "reset";

const endpointByMode: Record<AuthMode, string> = {
  forgot: "/api/users/forgot-password",
  login: "/api/portal/login",
  register: "/api/portal/register",
  reset: "/api/users/reset-password",
};

const RESEND_COOLDOWN_SECONDS = 60;

type RegisterDraft = {
  email: string;
  firstName: string;
  lastName: string;
  password: string;
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

function VerificationCodeInput({
  onChange,
  value,
}: {
  onChange: (value: string) => void;
  value: string;
}) {
  const inputsRef = useRef<Array<HTMLInputElement | null>>([]);
  const digits = value.padEnd(6, " ").slice(0, 6).split("");

  function updateDigit(index: number, nextDigit: string) {
    const sanitized = nextDigit.replace(/\D/g, "").slice(-1);
    const next = digits.map((digit, digitIndex) => (digitIndex === index ? sanitized : digit.trim())).join("");
    onChange(next.slice(0, 6));
    if (sanitized && index < 5) {
      inputsRef.current[index + 1]?.focus();
    }
  }

  function handleKeyDown(index: number, event: React.KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Backspace" && !digits[index]?.trim() && index > 0) {
      inputsRef.current[index - 1]?.focus();
    }
  }

  function handlePaste(event: React.ClipboardEvent<HTMLInputElement>) {
    event.preventDefault();
    const pasted = event.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (!pasted) return;
    onChange(pasted);
    const focusIndex = Math.min(pasted.length, 5);
    inputsRef.current[focusIndex]?.focus();
  }

  return (
    <div className="portal-auth__code">
      <span className="portal-auth__code-label">Verification code</span>
      <div className="portal-auth__code-boxes" role="group" aria-label="Verification code">
        {digits.map((digit, index) => (
          <input
            aria-label={`Digit ${index + 1}`}
            autoComplete={index === 0 ? "one-time-code" : "off"}
            className="portal-auth__code-box"
            inputMode="numeric"
            key={index}
            maxLength={1}
            onChange={(event) => updateDigit(index, event.target.value)}
            onKeyDown={(event) => handleKeyDown(index, event)}
            onPaste={handlePaste}
            ref={(element) => {
              inputsRef.current[index] = element;
            }}
            type="text"
            value={digit.trim()}
          />
        ))}
      </div>
    </div>
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
  const [registerPhase, setRegisterPhase] = useState<RegisterPhase>("details");
  const [registerDraft, setRegisterDraft] = useState<RegisterDraft | null>(null);
  const [verificationCode, setVerificationCode] = useState("");
  const [resendSeconds, setResendSeconds] = useState(0);

  useEffect(() => {
    if (resendSeconds <= 0) return;
    const timer = window.setTimeout(() => {
      setResendSeconds((seconds) => seconds - 1);
    }, 1000);
    return () => window.clearTimeout(timer);
  }, [resendSeconds]);

  async function sendVerificationCode(email: string) {
    const res = await fetch("/api/portal/register/request-code", {
      body: JSON.stringify({ email }),
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      method: "POST",
    });

    await res.json().catch(() => null);

    if (!res.ok) {
      throw new Error("We could not send a verification code right now. Try again shortly.");
    }

    return SIGNUP_GENERIC_SENT_MESSAGE;
  }

  async function submitRegisterDetails(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setMessage("");
    setLoading(true);

    const formData = new FormData(event.currentTarget);
    const firstName = String(formData.get("firstName") ?? "").trim();
    const lastName = String(formData.get("lastName") ?? "").trim();
    const email = String(formData.get("email") ?? "").trim().toLowerCase();
    const password = String(formData.get("password") ?? "");
    const confirmPassword = String(formData.get("confirmPassword") ?? "");

    if (password !== confirmPassword) {
      setError("Passwords must match.");
      setLoading(false);
      return;
    }

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

    try {
      const sentMessage = await sendVerificationCode(email);
      setRegisterDraft({ email, firstName, lastName, password });
      setVerificationCode("");
      setRegisterPhase("verify");
      setResendSeconds(RESEND_COOLDOWN_SECONDS);
      setMessage(sentMessage);
    } catch (sendError) {
      setError(sendError instanceof Error ? sendError.message : "We could not send a verification code right now.");
    } finally {
      setLoading(false);
    }
  }

  async function resendVerificationCode() {
    if (!registerDraft || resendSeconds > 0 || loading) return;

    setError("");
    setMessage("");
    setLoading(true);

    try {
      const sentMessage = await sendVerificationCode(registerDraft.email);
      setVerificationCode("");
      setResendSeconds(RESEND_COOLDOWN_SECONDS);
      setMessage(sentMessage);
    } catch (sendError) {
      setError(sendError instanceof Error ? sendError.message : "We could not resend the code right now.");
    } finally {
      setLoading(false);
    }
  }

  async function completeRegistration(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setMessage("");

    if (!registerDraft) {
      setError("Please complete the registration form first.");
      setRegisterPhase("details");
      return;
    }

    if (!/^\d{6}$/.test(verificationCode)) {
      setError("Enter the 6-digit verification code from your email.");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch(endpointByMode.register, {
        body: JSON.stringify({
          code: verificationCode,
          email: registerDraft.email,
          firstName: registerDraft.firstName,
          lastName: registerDraft.lastName,
          password: registerDraft.password,
        }),
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        method: "POST",
      });

      if (!res.ok) {
        setError("This account cannot be created. Check your verification code and try again.");
        return;
      }

      window.location.assign("/admin");
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

    if (mode === "reset" && password !== confirmPassword) {
      setError("Passwords must match.");
      setLoading(false);
      return;
    }

    const payload: Record<string, unknown> = {};
    formData.forEach((value, key) => {
      if (key !== "confirmPassword") payload[key] = value;
    });
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
        setError(apiMessage);
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
  const isRegisterDetailsStep = isRegister && registerPhase === "details";
  const isRegisterVerifyStep = isRegister && registerPhase === "verify";
  const title = isRegister
    ? isRegisterVerifyStep
      ? "Verify your email"
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
          {isRegisterDetailsStep ? (
            <form onSubmit={submitRegisterDetails}>
              <div className="portal-auth__grid">
                <label>
                  First name
                  <input
                    autoComplete="given-name"
                    defaultValue={registerDraft?.firstName}
                    key={registerDraft?.firstName || "first-name"}
                    name="firstName"
                    required
                  />
                </label>
                <label>
                  Second name
                  <input
                    autoComplete="family-name"
                    defaultValue={registerDraft?.lastName}
                    key={registerDraft?.lastName || "last-name"}
                    name="lastName"
                    required
                  />
                </label>
              </div>
              <label>
                Email
                <input
                  autoComplete="email"
                  defaultValue={registerDraft?.email}
                  key={registerDraft?.email || "email"}
                  name="email"
                  placeholder="name@company.com"
                  required
                  type="email"
                />
              </label>
              <PasswordField autoComplete="new-password" label="Password" name="password" />
              <PasswordField autoComplete="new-password" label="Repeat password" name="confirmPassword" />
              {error ? <p className="portal-auth__error">{error}</p> : null}
              {message ? <p className="portal-auth__message">{message}</p> : null}
              <button className="portal-auth__submit" disabled={loading} type="submit">
                {loading ? "Please wait..." : "Continue"}
              </button>
            </form>
          ) : null}
          {isRegisterVerifyStep && registerDraft ? (
            <form onSubmit={completeRegistration}>
              <p className="portal-auth__meta">
                Enter the 6-digit code sent to <strong>{registerDraft.email}</strong>.{" "}
                <button
                  className="portal-auth__link"
                  onClick={() => {
                    setRegisterPhase("details");
                    setVerificationCode("");
                    setResendSeconds(0);
                    setError("");
                    setMessage("");
                  }}
                  type="button"
                >
                  Edit details
                </button>
              </p>
              <VerificationCodeInput onChange={setVerificationCode} value={verificationCode} />
              <p className="portal-auth__meta portal-auth__resend">
                {resendSeconds > 0 ? (
                  <>Resend code in {Math.floor(resendSeconds / 60)}:{String(resendSeconds % 60).padStart(2, "0")}</>
                ) : (
                  <button
                    className="portal-auth__link"
                    disabled={loading}
                    onClick={resendVerificationCode}
                    type="button"
                  >
                    Resend code
                  </button>
                )}
              </p>
              {error ? <p className="portal-auth__error">{error}</p> : null}
              {message ? <p className="portal-auth__message">{message}</p> : null}
              <button
                className="portal-auth__submit"
                disabled={loading || verificationCode.length !== 6}
                type="submit"
              >
                {loading ? "Please wait..." : "Create account"}
              </button>
            </form>
          ) : null}
          {!isRegister ? (
            <form onSubmit={submit}>
              {!isReset ? (
                <label>
                  Email
                  <input autoComplete="email" name="email" required type="email" />
                </label>
              ) : null}
              {!isForgot ? (
                <PasswordField
                  autoComplete={isReset ? "new-password" : "current-password"}
                  label="Password"
                  name="password"
                />
              ) : null}
              {isReset ? (
                <PasswordField autoComplete="new-password" label="Repeat password" name="confirmPassword" />
              ) : null}
              {error ? <p className="portal-auth__error">{error}</p> : null}
              {message ? <p className="portal-auth__message">{message}</p> : null}
              <button className="portal-auth__submit" disabled={loading} type="submit">
                {loading
                  ? "Please wait..."
                  : isForgot
                    ? "Send reset link"
                    : isReset
                      ? "Update password"
                      : "Login"}
              </button>
            </form>
          ) : null}
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
