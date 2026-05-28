"use client";

import { ChevronDown, Mail, Menu, Phone, X } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";

import { site } from "@/content/site";
import type { PublicNavItem } from "@/lib/public-navigation";

export function Header({ navItems }: { navItems: PublicNavItem[] }) {
  const [open, setOpen] = useState(false);
  const [openGroup, setOpenGroup] = useState<string | null>(null);

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
          <span className="topbar__brand">
            <a href="#" aria-label="Facebook">f</a>
            <a href="#" aria-label="Instagram">◎</a>
            <a href="#" aria-label="Twitter">x</a>
            <a href="#" aria-label="YouTube">▶</a>
          </span>
        </div>
      </div>
      <div className="navwrap">
        <div className="container nav">
          <Link href="/" className="logo" aria-label="Nature Romp Safaris home">
            <Image
              src="/assets/img/logo.jpg"
              alt="Nature Romp Safaris"
              width={126}
              height={82}
              priority
              style={{ height: "auto" }}
            />
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
            {navItems.map((item) => (
              item.items?.length ? (
                <div className={openGroup === item.label ? "navgroup navgroup--open" : "navgroup"} key={item.label}>
                  <Link href={item.href}>
                    {item.label}
                  </Link>
                  <button
                    aria-expanded={openGroup === item.label}
                    aria-label={`Toggle ${item.label} menu`}
                    className="navgroup__toggle"
                    onClick={() => setOpenGroup((value) => value === item.label ? null : item.label)}
                    type="button"
                  >
                    <ChevronDown size={14} />
                  </button>
                  <div className="submenu">
                    {item.items.map((child) => (
                      <Link href={child.href} key={`${item.label}-${child.label}`}>
                        {child.label}
                      </Link>
                    ))}
                  </div>
                </div>
              ) : (
                <Link href={item.href} className={item.isPrimaryAction ? "book-btn" : undefined} key={item.label}>
                  {item.label}
                </Link>
              )
            ))}
          </nav>
        </div>
      </div>
    </header>
  );
}
