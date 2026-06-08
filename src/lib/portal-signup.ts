import crypto from "crypto";

export const SIGNUP_CODE_TTL_MS = 10 * 60 * 1000;
export const SIGNUP_MAX_VERIFY_ATTEMPTS = 5;
export const SIGNUP_EMAIL_COOLDOWN_MS = 60 * 1000;
export const SIGNUP_EMAIL_HOURLY_LIMIT = 5;
export const SIGNUP_IP_HOURLY_LIMIT = 10;
export const SIGNUP_HOURLY_WINDOW_MS = 60 * 60 * 1000;

export const SIGNUP_GENERIC_SENT_MESSAGE =
  "If the details are valid, a verification code has been sent to your email.";
export const SIGNUP_GENERIC_REGISTER_FAILURE_MESSAGE =
  "This account cannot be created. Check your verification code and try again.";

export function generateSignupCode() {
  return String(crypto.randomInt(100_000, 1_000_000));
}

export function hashSignupCode(code: string, email: string, secret: string) {
  return crypto
    .createHmac("sha256", secret)
    .update(`${email.toLowerCase().trim()}:${code}`)
    .digest("hex");
}

export function verifySignupCode(
  code: string,
  email: string,
  codeHash: string,
  secret: string,
) {
  const expected = hashSignupCode(code, email, secret);
  const expectedBuffer = Buffer.from(expected, "hex");
  const actualBuffer = Buffer.from(codeHash, "hex");

  if (expectedBuffer.length !== actualBuffer.length) {
    return false;
  }

  return crypto.timingSafeEqual(expectedBuffer, actualBuffer);
}

export function hashClientIp(ip: string, secret: string) {
  return crypto.createHmac("sha256", secret).update(ip).digest("hex");
}

export function getClientIp(request: Request) {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    return forwarded.split(",")[0]?.trim() || "unknown";
  }

  const realIp = request.headers.get("x-real-ip");
  return realIp?.trim() || "unknown";
}

export function validateSignupPassword(password: string) {
  if (password.length < 12) {
    return "Password must be at least 12 characters.";
  }

  if (!/[a-zA-Z]/.test(password)) {
    return "Password must include at least one letter.";
  }

  if (!/[0-9]/.test(password)) {
    return "Password must include at least one number.";
  }

  return null;
}

export function isWithinHourlyWindow(timestamp: string | Date, now = Date.now()) {
  const createdAt = new Date(timestamp).getTime();
  return Number.isFinite(createdAt) && now - createdAt < SIGNUP_HOURLY_WINDOW_MS;
}

export function isWithinEmailCooldown(timestamp: string | Date, now = Date.now()) {
  const createdAt = new Date(timestamp).getTime();
  return Number.isFinite(createdAt) && now - createdAt < SIGNUP_EMAIL_COOLDOWN_MS;
}
