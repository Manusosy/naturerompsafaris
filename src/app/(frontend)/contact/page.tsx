import { Globe2, Mail, MapPin, Phone } from "lucide-react";
import type { Metadata } from "next";

import { PageHero } from "@/components/PageHero";
import { SafariQuoteForm } from "@/components/SafariQuoteForm";
import { site } from "@/content/site";
import { buildMetadata } from "@/lib/seo";

export const metadata: Metadata = buildMetadata({
  title: "Contact Nature Romp Safaris",
  description:
    "Contact Nature Romp Safaris for Kenya Tanzania safari adventure packages, private safaris, family safaris and East Africa travel planning.",
  path: "/contact",
  keywords: "contact Nature Romp Safaris, Kenya Tanzania safari enquiry, Nairobi safari company",
});

export default function ContactPage() {
  return (
    <main>
      <PageHero
        eyebrow="Get in touch"
        title="Contact Nature Romp Safaris"
        subtitle="Choose the enquiry type that fits you best. General questions, safari quotes, and follow-up requests each have a shorter form so you only fill in what matters."
      />
      <section className="contact-quote-section">
        <div className="container contact-quote-layout">
          <div className="contact-quote-main">
            <div className="section-kicker">How can we help?</div>
            <h2>Send the right message without filling everything at once.</h2>
            <p>
              Use General Contact for quick questions, Safari Quote when you want a tailored proposal, or Other Enquiry for booking follow-ups. No payment is collected on the website.
            </p>
            <SafariQuoteForm subject="Website safari quote request" />
          </div>
          <aside className="contact-panel contact-panel--sticky">
            <h2>Contact Details</h2>
            <ul className="info-list">
              <li>
                <MapPin size={18} />{" "}
                <span>
                  <strong>Main office</strong>
                  {site.address}
                </span>
              </li>
              <li>
                <Mail size={18} />{" "}
                <span>
                  <strong>Email Address</strong>
                  {site.email}
                </span>
              </li>
              <li>
                <Phone size={18} />{" "}
                <span>
                  <strong>Call Us</strong>
                  {site.phone}
                </span>
              </li>
              <li>
                <Globe2 size={18} />{" "}
                <span>
                  <strong>Website</strong>www.naturerompsafaris.com
                </span>
              </li>
            </ul>
            <div className="contact-trust">
              <h3>Why travelers enquire with us</h3>
              <ul>
                <li>Quote-first planning for private, family, budget, and luxury safaris.</li>
                <li>Kenya and Tanzania routes managed by a dedicated safari operations team.</li>
                <li>Flexible itinerary planning before any booking commitment.</li>
              </ul>
            </div>
          </aside>
        </div>
      </section>
      <iframe
        className="contact-map-embed"
        title="Nature Romp Safaris map"
        src="https://maps.google.com/maps?width=100%25&height=500&hl=en&q=Nature%20Romp%20Safaris,%20Embassy%20House,%20Mezazanine-Harambee%20Avenue,%20P.O%20Box%2010323,00100-GPO,%20Nairobi,%20Kenya+(nature%20romp%20safari)&t=&z=14&ie=UTF8&iwloc=B&output=embed"
        width="100%"
        height="500"
        style={{ border: 0, display: "block" }}
        loading="lazy"
      />
    </main>
  );
}
