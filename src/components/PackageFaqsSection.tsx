"use client";

import { WhatsAppShareIcon } from "@/components/BlogShareIcons";

export type PackageFaq = {
  answer: string;
  question: string;
};

export function PackageFaqsSection({
  faqs,
  packageSummary,
  whatsappHref,
}: {
  faqs: PackageFaq[];
  packageSummary: string;
  whatsappHref: string;
}) {
  if (!faqs.length) return null;

  return (
    <section className="section pkg-detail__faqs homepage-faqs--flash">
      <div className="container">
        <div className="faq-flash-head">
          <h2>Frequently Asked Questions</h2>
          <span aria-hidden="true" />
          <p>Quick answers about this safari package. For day-by-day detail, open a linked tour below.</p>
        </div>

        <div className="faq-flash-list">
          {faqs.map((item) => (
            <details className="faq-flash-item" key={item.question}>
              <summary>
                <span aria-hidden="true">+</span>
                <strong>{item.question}</strong>
              </summary>
              <p>{item.answer}</p>
            </details>
          ))}
        </div>

        <div className="faq-flash-cta">
          <h3>Do you have any other questions?</h3>
          <p>{packageSummary}</p>
          <a href={whatsappHref} rel="noopener noreferrer" target="_blank">
            <WhatsAppShareIcon className="faq-flash-cta__icon" />
            Help me plan
          </a>
        </div>
      </div>
    </section>
  );
}
