"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";

const consentKey = "nature-romp-cookie-consent";

export function CookieConsent() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      setVisible(!window.localStorage.getItem(consentKey));
    });

    return () => window.cancelAnimationFrame(frame);
  }, []);

  function saveConsent(value: "accepted" | "declined") {
    window.localStorage.setItem(consentKey, value);
    setVisible(false);
  }

  if (!visible) return null;

  return (
    <aside className="cookie-consent" aria-label="Cookie consent" aria-live="polite">
      <Image
        alt=""
        aria-hidden
        className="cookie-consent__icon"
        height={44}
        priority
        src="/favicon.ico"
        width={44}
      />
      <div className="cookie-consent__content">
        <strong>We use cookies</strong>
        <p>
          Nature Romp Safaris uses essential cookies and optional analytics to improve safari planning,
          enquiries, and website performance.
        </p>
      </div>
      <div className="cookie-consent__actions">
        <Link href="/cookie-consent">Cookie Policy</Link>
        <button type="button" className="cookie-consent__secondary" onClick={() => saveConsent("declined")}>
          Decline
        </button>
        <button type="button" onClick={() => saveConsent("accepted")}>
          Accept
        </button>
      </div>
    </aside>
  );
}
