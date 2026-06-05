import { ArrowRight, Mail, MapPin, MessageCircle, Phone } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

import { createWhatsAppLink } from "@/lib/enquiry";
import type { PublicNavItem } from "@/lib/public-navigation";
import type { PublicSiteSettings } from "@/lib/public-site-settings";

export function Footer({ navItems, siteSettings }: { navItems: PublicNavItem[]; siteSettings: PublicSiteSettings }) {
  const safariLinks = navItems.flatMap((item) => item.items ?? []).slice(0, 8);

  return (
    <footer className="footer">
      <div className="container footer__grid">
        <div>
          <Image
            src="/assets/img/logo.jpg"
            alt={siteSettings.companyName}
            width={132}
            height={45}
            style={{ width: 132, height: "auto" }}
          />
          <p>{siteSettings.description}</p>
          <Link className="footer__quote" href="/contact">
            Request a custom quote <ArrowRight size={15} />
          </Link>
        </div>
        <div>
          <h3>Quick Links</h3>
          {siteSettings.quickLinks.map((link) => (
            <Link href={link.href} key={`${link.label}-${link.href}`}>
              {link.label}
            </Link>
          ))}
        </div>
        <div>
          <h3>Our Safaris</h3>
          {safariLinks.map((item) => (
            <Link href={item.href} key={`${item.label}-${item.href}`}>
              {item.label}
            </Link>
          ))}
        </div>
        <div>
          <h3>Contact Us</h3>
          <p className="footer__contact"><Phone size={16} /> {siteSettings.phone}</p>
          <p className="footer__contact"><Mail size={16} /> {siteSettings.email}</p>
          <p className="footer__contact"><MapPin size={16} /> {siteSettings.address}</p>
          <a
            className="footer__whatsapp"
            href={createWhatsAppLink({
              phone: siteSettings.whatsapp,
              message: siteSettings.whatsappEnquiryMessage,
            })}
          >
            <MessageCircle size={16} /> WhatsApp Safari Expert
          </a>
        </div>
      </div>
      <div className="footer__bottom">
        <div className="container">
          <div className="footer__copyright">
            Copyright &copy; {new Date().getFullYear()} {siteSettings.companyName}. {siteSettings.siteName}.
          </div>
          <div className="footer__legal-links">
            <Link href="/terms-of-service">Terms of Service</Link>
            <Link href="/privacy-policy">Privacy Policy</Link>
            <Link href="/cookie-consent">Cookie Policy</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
