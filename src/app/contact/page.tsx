import { Mail, MapPin, Phone } from "lucide-react";
import type { Metadata } from "next";

import { EnquiryForm } from "@/components/EnquiryForm";
import { PageHero } from "@/components/PageHero";
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
      <PageHero title="Contact" />
      <section className="content-page">
        <div className="container split">
          <EnquiryForm />
          <div>
            <h2>Would Like to Talk?</h2>
            <ul className="info-list">
              <li><MapPin size={18} /> <strong>Main Office:</strong> {site.address}</li>
              <li><Mail size={18} /> <strong>Email:</strong> {site.email}</li>
              <li><Mail size={18} /> <strong>Alternative Email:</strong> {site.secondaryEmail}</li>
              <li><Phone size={18} /> <strong>Phone:</strong> {site.phone}</li>
              <li><Phone size={18} /> <strong>Phone:</strong> {site.phoneAlt}</li>
            </ul>
          </div>
        </div>
      </section>
      <iframe
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
