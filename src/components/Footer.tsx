import { Mail, MapPin, Phone } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

import { createWhatsAppLink } from "@/lib/enquiry";
import { site } from "@/content/site";
import type { PublicNavItem } from "@/lib/public-navigation";

export function Footer({ navItems }: { navItems: PublicNavItem[] }) {
  const safariLinks = navItems.flatMap((item) => item.items ?? []).slice(0, 8);
  return (
    <footer className="footer">
      <div className="container footer__grid">
        <div>
          <Image src="/assets/img/logo.jpg" alt="Nature Romp Safaris" width={132} height={86} style={{ height: "auto" }} />
          <p>
            Welcome to Nature Romp Safaris, your gateway to unforgettable Kenya
            Tanzania safari adventures, wildlife holidays, mountain climbing and
            beach extensions across East Africa.
          </p>
        </div>
        <div>
          <h3>Quick Links</h3>
          <Link href="/photo-gallery">Photo Gallery</Link>
          <Link href="/blog">Travel Information</Link>
          <Link href="/safari-packages">Safari Packages</Link>
          <Link href="/contact">Contact</Link>
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
          <p className="footer__contact"><Phone size={16} /> {site.phone}</p>
          <p className="footer__contact"><Mail size={16} /> {site.email}</p>
          <p className="footer__contact"><MapPin size={16} /> Nairobi, Kenya</p>
          <a
            className="footer__whatsapp"
            href={createWhatsAppLink({
              phone: site.whatsapp,
              message: "Hello Nature Romp Safaris, I would like to plan a Kenya Tanzania safari adventure.",
            })}
          >
            WhatsApp Safari Expert
          </a>
        </div>
      </div>
      <div className="footer__bottom">
        <div className="container">
          Copyright © 2026 {site.company}. Kenya Tanzania Safari Adventure.
        </div>
      </div>
    </footer>
  );
}
