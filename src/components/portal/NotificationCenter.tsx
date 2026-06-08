"use client";

import Link from "next/link";
import { Mail, MessageCircle } from "lucide-react";

import { StatusBadge } from "@/components/portal/PortalCards";
import {
  buildEnquiryMailto,
  buildEnquiryWhatsAppHref,
  getEnquiryInterestLabel,
  inferEnquiryFormType,
} from "@/lib/portal/enquiry-helpers";
import { formatValue, getValue } from "@/lib/portal/format";

export function NotificationCenter({
  docs,
  newCount,
}: {
  docs: Array<Record<string, unknown>>;
  newCount: number;
}) {
  const badgeLabel = newCount > 99 ? "99+" : String(newCount);

  return (
    <div className="portal-notifications">
      <div className="portal-notifications__summary">
        <div className="portal-notifications__count">
          <span
            aria-label={`${badgeLabel} new ${newCount === 1 ? "notification" : "notifications"}`}
            className={newCount > 0 ? "portal-notifications__count-badge" : "portal-notifications__count-badge is-zero"}
          >
            {badgeLabel}
          </span>
          <span>
            {newCount === 1 ? "new enquiry waiting" : "new enquiries waiting"}
          </span>
        </div>
        <Link className="portal-button portal-button--ghost" href="/admin/enquiries">
          Open enquiries inbox
        </Link>
      </div>

      {docs.length ? (
        <ul className="portal-notifications__list">
          {docs.map((doc) => {
            const id = String(doc.id);
            const status = String(getValue(doc, "status") ?? "new");
            const formType = inferEnquiryFormType(doc);
            const mailto = buildEnquiryMailto(doc);
            const whatsappHref = buildEnquiryWhatsAppHref(doc);

            return (
              <li className={status === "new" ? "is-new" : undefined} key={id}>
                <div className="portal-notifications__main">
                  <div className="portal-notifications__title-row">
                    <Link href={`/admin/enquiries/${id}`}>{formatValue(getValue(doc, "name"))}</Link>
                    <StatusBadge value={status} />
                    <span className={`enquiry-type-badge enquiry-type-badge--${formType}`}>
                      {formType === "quote" ? "Full quote" : "Quick"}
                    </span>
                  </div>
                  <p className="portal-notifications__meta">
                    {formatValue(getValue(doc, "email"))}
                    {" · "}
                    {getEnquiryInterestLabel(doc)}
                    {" · "}
                    {formatValue(getValue(doc, "createdAt"))}
                  </p>
                </div>
                <div className="enquiry-row-actions">
                  <a className="enquiry-action-btn enquiry-action-btn--primary enquiry-action-btn--compact" href={mailto}>
                    <Mail size={15} /> Reply
                  </a>
                  {whatsappHref ? (
                    <a
                      className="enquiry-action-btn enquiry-action-btn--whatsapp enquiry-action-btn--compact"
                      href={whatsappHref}
                      rel="noreferrer"
                      target="_blank"
                    >
                      <MessageCircle size={15} /> WhatsApp
                    </a>
                  ) : (
                    <span className="enquiry-action-btn enquiry-action-btn--disabled enquiry-action-btn--compact">
                      <MessageCircle size={15} /> No WhatsApp
                    </span>
                  )}
                  <Link className="enquiry-action-btn enquiry-action-btn--compact" href={`/admin/enquiries/${id}`}>
                    Open
                  </Link>
                </div>
              </li>
            );
          })}
        </ul>
      ) : (
        <div className="portal-table-empty">
          <strong>No notifications yet</strong>
          <span>New website enquiries will appear here when travelers submit a form.</span>
        </div>
      )}
    </div>
  );
}
