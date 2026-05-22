"use client";

import { ChevronDown, Mail, Menu, Phone, X } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";

import { navGroups, site } from "@/content/site";

export function Header() {
  const [open, setOpen] = useState(false);

  return (
    <header className="site-header">
      <div className="topbar">
        <div className="container topbar__inner">
          <a href={`mailto:${site.email}`}>
            <Mail size={15} /> {site.email}
          </a>
          <a href={`tel:${site.phone.replace(/\s/g, "")}`}>
            <Phone size={15} /> {site.phone}
          </a>
          <span className="topbar__brand">Nature Romp Safaris</span>
        </div>
      </div>
      <div className="navwrap">
        <div className="container nav">
          <Link href="/" className="logo" aria-label="Nature Romp Safaris home">
            <Image src="/assets/img/logo.jpg" alt="Nature Romp Safaris" width={126} height={82} priority />
          </Link>
          <button
            className="menu-toggle"
            type="button"
            onClick={() => setOpen((value) => !value)}
            aria-label="Toggle navigation"
            aria-expanded={open}
          >
            {open ? <X /> : <Menu />}
          </button>
          <nav className={open ? "mainnav mainnav--open" : "mainnav"}>
            <Link href="/">Home</Link>
            <Link href="/about">About Us</Link>
            {navGroups.map((group) => (
              <div className="navgroup" key={group.label}>
                <Link href={group.href}>
                  {group.label} <ChevronDown size={14} />
                </Link>
                <div className="submenu">
                  {group.items.map(([label, href]) => (
                    <Link href={href} key={label}>
                      {label}
                    </Link>
                  ))}
                </div>
              </div>
            ))}
            <Link href="/blog">Blog</Link>
            <Link href="/photo-gallery">Gallery</Link>
            <Link href="/contact">Contact</Link>
            <Link href="/contact" className="book-btn">
              Book Now
            </Link>
          </nav>
        </div>
      </div>
    </header>
  );
}
