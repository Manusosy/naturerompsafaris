"use client";

import { ChevronDown, Mail, Menu, Phone, Star, X } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";

import {
  buildDestinationPreviewByCountry,
  buildHeaderNavigation,
  getMenuVariant,
} from "@/components/header-navigation-model";
import type { PublicNavItem } from "@/lib/public-navigation";
import type { PublicDestinationNavItem } from "@/lib/public-destinations";
import type { PublicSiteSettings } from "@/lib/public-site-settings";

function phoneHref(phone: string) {
  return phone.split("/")[0].replace(/[^\d+]/g, "");
}

function whatsappHref(whatsapp: string) {
  return `https://wa.me/${whatsapp.replace(/[^\d]/g, "")}`;
}

const previewLabels: Record<string, string> = {
  EastAfrica: "East Africa / Combined Safaris",
  Kenya: "Kenya",
  Tanzania: "Tanzania",
  Zanzibar: "Zanzibar",
};

function previewKeyFor(label: string) {
  if (/east africa|combined/i.test(label)) return "EastAfrica";
  if (/zanzibar/i.test(label)) return "Zanzibar";
  if (/tanzania/i.test(label)) return "Tanzania";
  if (/kenya/i.test(label)) return "Kenya";
  return "Kenya";
}

export function Header({
  destinations,
  navItems,
  siteSettings,
}: {
  destinations: PublicDestinationNavItem[];
  navItems: PublicNavItem[];
  siteSettings: PublicSiteSettings;
}) {
  const [open, setOpen] = useState(false);
  const [openGroup, setOpenGroup] = useState<string | null>(null);
  const destinationPreviews = buildDestinationPreviewByCountry(destinations);
  const defaultPreviewKey =
    destinationPreviews.Kenya.length > 0
      ? "Kenya"
      : destinationPreviews.Tanzania.length > 0
        ? "Tanzania"
        : destinationPreviews.Zanzibar.length > 0
          ? "Zanzibar"
          : "Kenya";
  const [activePreviewKey, setActivePreviewKey] = useState(defaultPreviewKey);
  const headerNavItems = buildHeaderNavigation(navItems, destinations);

  const closeNav = () => {
    setOpen(false);
    setOpenGroup(null);
  };

  const toggleNav = () => {
    setOpen((value) => {
      if (value) setOpenGroup(null);
      return !value;
    });
  };

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  const socialLinks = [
    ["Facebook", siteSettings.facebook],
    ["Instagram", siteSettings.instagram],
    ["X", siteSettings.twitter],
    ["YouTube", siteSettings.youtube],
  ].filter(([, href]) => Boolean(href));

  const renderSubmenu = (item: PublicNavItem) => {
    const variant = getMenuVariant(item.label);
    const isDynamic = variant === "dynamic";
    const isMega = variant === "mega";
    const previewRows = destinationPreviews[activePreviewKey as keyof typeof destinationPreviews] ?? [];

    if (isMega && item.megaColumns?.length) {
      return (
        <div className="submenu submenu--mega">
          <div className="submenu__mega-cols">
            {item.megaColumns.map((col) => (
              <div className="submenu__mega-col" key={col.heading}>
                <span className="submenu__col-heading">{col.heading}</span>
                <div className="submenu__links">
                  {col.items.map((child) => (
                    <Link href={child.href} key={`${item.label}-${child.label}`} onClick={closeNav}>
                      {child.label}
                    </Link>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      );
    }

    return (
      <div className={`submenu submenu--${variant}`}>
        <div className={isDynamic ? "submenu__links submenu__links--dynamic" : "submenu__links"}>
          {item.items?.map((child) => (
            <Link
              href={child.href}
              key={`${item.label}-${child.label}`}
              onClick={closeNav}
              onFocus={() => setActivePreviewKey(previewKeyFor(child.label))}
              onMouseEnter={() => setActivePreviewKey(previewKeyFor(child.label))}
            >
              <span>{child.label}</span>
            </Link>
          ))}
        </div>
        {isDynamic ? (
          <div
            className="submenu-preview"
            aria-label={`${previewLabels[activePreviewKey] ?? activePreviewKey} menu preview`}
          >
            <div className="submenu-preview__skeleton" aria-hidden="true">
              <span />
              <span />
              <span />
            </div>
            <div className="submenu-preview__rows">
              {previewRows.length ? (
                previewRows.map((row) => (
                  <Link
                    className="submenu-preview__row"
                    href={row.href}
                    key={`${activePreviewKey}-${row.label}`}
                    onClick={closeNav}
                  >
                    {row.label}
                  </Link>
                ))
              ) : (
                <p className="submenu-preview__empty">
                  No published destinations for {previewLabels[activePreviewKey] ?? activePreviewKey} yet.
                </p>
              )}
            </div>
          </div>
        ) : null}
      </div>
    );
  };

  return (
    <header className="site-header site-header--flash" data-navigation-ready="flashmc">
      <div className="topbar">
        <div className="topbar__mobile-contact" aria-label="Contact Nature Romp Safaris">
          <a href={`mailto:${siteSettings.email}`}>
            <Mail size={14} /> {siteSettings.email}
          </a>
          <a href={`tel:${phoneHref(siteSettings.phone)}`}>
            <Phone size={14} /> {siteSettings.phone}
          </a>
        </div>
        <div className="container topbar__inner">
          <Link href="/" className="logo logo--topbar" aria-label="Nature Romp Safaris home" onClick={closeNav}>
            <Image
              src="/assets/img/logo.jpg"
              alt="Nature Romp Safaris"
              width={150}
              height={51}
              priority
              fetchPriority="high"
              style={{ width: 150, height: "auto" }}
            />
          </Link>
          <div className="topbar__review" aria-label="Nature Romp Safaris guest rating">
            <span>Tripadvisor</span>
            <strong>5.0</strong>
            <span className="topbar__stars" aria-hidden="true">
              {Array.from({ length: 5 }).map((_, index) => (
                <Star fill="currentColor" key={index} size={14} strokeWidth={0} />
              ))}
            </span>
            <small>Safari planning reviews</small>
          </div>
          <div className="topbar__contact">
            <a href={`mailto:${siteSettings.email}`}>
              <Mail size={15} /> {siteSettings.email}
            </a>
            <a href={`tel:${phoneHref(siteSettings.phone)}`}>
              <Phone size={15} /> {siteSettings.phone}
            </a>
            {socialLinks.length ? (
              <span className="topbar__brand">
                {socialLinks.map(([label, href]) => (
                  <a href={href} key={label} aria-label={label}>
                    {label}
                  </a>
                ))}
              </span>
            ) : null}
          </div>
          <a className="topbar__cta" href={whatsappHref(siteSettings.whatsapp)}>
            Tailor Make Safari
          </a>
        </div>
      </div>
      <div className="navwrap">
        <div className="container nav">
          <Link href="/" className="logo logo--compact" aria-label="Nature Romp Safaris home" onClick={closeNav}>
            <Image
              src="/assets/img/logo.jpg"
              alt="Nature Romp Safaris"
              width={88}
              height={30}
              priority
              fetchPriority="high"
              style={{ width: 88, height: "auto" }}
            />
          </Link>
          <button
            className="menu-toggle"
            type="button"
            onClick={toggleNav}
            aria-label="Toggle navigation"
            aria-expanded={open}
          >
            {open ? <X /> : <Menu />}
          </button>
          <nav className={open ? "mainnav mainnav--open" : "mainnav"} aria-label="Primary navigation">
            {headerNavItems.map((item) => (
              item.items?.length ? (
                <div
                  className={`navgroup navgroup--${getMenuVariant(item.label)}${openGroup === item.label ? " navgroup--open" : ""}`}
                  key={item.label}
                >
                  <Link href={item.href} onClick={closeNav}>{item.label}</Link>
                  <button
                    aria-expanded={openGroup === item.label}
                    aria-label={`Toggle ${item.label} menu`}
                    className="navgroup__toggle"
                    onClick={() => setOpenGroup((value) => value === item.label ? null : item.label)}
                    type="button"
                  >
                    <ChevronDown size={14} />
                  </button>
                  {renderSubmenu(item)}
                </div>
              ) : (
                <Link
                  href={item.href}
                  className={item.isPrimaryAction ? "book-btn" : undefined}
                  key={item.label}
                  onClick={closeNav}
                >
                  {item.label}
                </Link>
              )
            ))}
            <a className="mainnav__mobile-cta" href={whatsappHref(siteSettings.whatsapp)} onClick={closeNav}>
              Tailor Make Safari
            </a>
          </nav>
        </div>
      </div>
    </header>
  );
}
