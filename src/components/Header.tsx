"use client";



import { ChevronDown, Mail, Menu, Phone, X } from "lucide-react";

import Image from "next/image";

import Link from "next/link";

import { useEffect, useMemo, useState } from "react";



import {

  buildDestinationPreviewByCountry,

  buildHeaderNavigation,

  getMenuVariant,

} from "@/components/header-navigation-model";

import {

  FacebookIcon,

  InstagramIcon,

  TikTokIcon,

  WhatsappIcon,

  YoutubeIcon,

} from "@/components/SocialBrandIcons";

import { createWhatsAppLink } from "@/lib/enquiry";

import type { PublicNavItem } from "@/lib/public-navigation";

import type { PublicDestinationNavItem } from "@/lib/public-destinations";

import type { PublicSiteSettings } from "@/lib/public-site-settings";



const HEADER_CTA_LABEL = "Help Me Plan";



function phoneHref(phone: string) {

  return phone.replace(/[^\d+]/g, "");

}



function parsePhoneNumbers(phone: string) {

  return phone

    .split("/")

    .map((value) => value.trim())

    .filter(Boolean);

}



function isHeaderNavItem(item: PublicNavItem) {
  if (item.isPrimaryAction) return false;
  if (/request\s*quote/i.test(item.label)) return false;
  if (/help\s*me\s*plan/i.test(item.label)) return false;
  return true;
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

  const headerNavItems = buildHeaderNavigation(navItems, destinations).filter(isHeaderNavItem);

  const ctaHref = createWhatsAppLink({

    message: siteSettings.whatsappEnquiryMessage,

    phone: siteSettings.whatsapp,

  });



  const socialLinks = useMemo(

    () => [

      { href: siteSettings.facebook, icon: FacebookIcon, label: "Facebook" },

      { href: siteSettings.instagram, icon: InstagramIcon, label: "Instagram" },

      { href: siteSettings.youtube, icon: YoutubeIcon, label: "YouTube" },

      { href: siteSettings.tiktok, icon: TikTokIcon, label: "TikTok" },

    ],

    [siteSettings.facebook, siteSettings.instagram, siteSettings.tiktok, siteSettings.youtube],

  );



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



  const phoneNumbers = parsePhoneNumbers(siteSettings.phone);



  const renderCta = (className: string) => (

    <a

      className={className}

      href={ctaHref}

      onClick={closeNav}

      rel="noopener noreferrer"

      target="_blank"

    >

      <span className="header-cta__label">{HEADER_CTA_LABEL}</span>

      <WhatsappIcon aria-hidden className="header-cta__icon" height={18} width={18} />

    </a>

  );



  return (

    <header

      className={open ? "site-header site-header--flash site-header--nav-open" : "site-header site-header--flash"}

      data-navigation-ready="flashmc"

    >

      <div className="topbar">

        <div className="container topbar__inner">

          <div className="topbar__contact" aria-label="Contact Nature Romp Safaris">

            <a className="topbar__contact-link topbar__contact-link--email" href={`mailto:${siteSettings.email}`}>

              <Mail className="topbar__contact-icon" size={16} strokeWidth={2.2} />

              <span>{siteSettings.email}</span>

            </a>

            {phoneNumbers.length ? (
              <span className="topbar__contact-phones">
                <Phone aria-hidden className="topbar__contact-icon" size={16} strokeWidth={2.2} />
                {phoneNumbers.map((number, index) => (
                  <span className="topbar__contact-phones__item" key={number}>
                    {index > 0 ? <span aria-hidden className="topbar__contact-phones__sep">/</span> : null}
                    <a className="topbar__contact-link topbar__contact-link--phone" href={`tel:${phoneHref(number)}`}>
                      {number}
                    </a>
                  </span>
                ))}
              </span>
            ) : null}

          </div>

          <div className="topbar__social" aria-label="Social media">

            {socialLinks.map(({ href, icon: Icon, label }) => {
              const platformClass = label.toLowerCase().replace(/\s+/g, "-");

              return href?.trim() ? (
                <a
                  aria-label={label}
                  className={`topbar__social-link topbar__social-link--${platformClass}`}
                  href={href}
                  key={label}
                  rel="noopener noreferrer"
                  target="_blank"
                >
                  <Icon height={20} width={20} />
                </a>
              ) : (
                <span
                  aria-hidden
                  className={`topbar__social-link is-disabled topbar__social-link--${platformClass}`}
                  key={label}
                  title={`${label} link coming soon`}
                >
                  <Icon height={20} width={20} />
                </span>
              );
            })}

          </div>

        </div>

      </div>



      <div className="navwrap">

        <div className="container nav">

          <Link className="logo logo--header" aria-label="Nature Romp Safaris home" href="/" onClick={closeNav}>

            <Image

              alt="Nature Romp Safaris"

              className="logo--header__image"

              fetchPriority="high"

              height={82}

              priority

              src="/assets/img/logo.jpg"

              width={240}

            />

          </Link>



          <button

            aria-expanded={open}

            aria-label="Toggle navigation"

            className="menu-toggle"

            onClick={toggleNav}

            type="button"

          >

            {open ? <X /> : <Menu />}

          </button>



          {open ? (

            <button

              aria-label="Close navigation"

              className="mobile-nav-backdrop"

              onClick={closeNav}

              type="button"

            />

          ) : null}



          <nav aria-label="Primary navigation" className={open ? "mainnav mainnav--open" : "mainnav"}>

            {headerNavItems.map((item) =>

              item.items?.length ? (

                <div

                  className={`navgroup navgroup--${getMenuVariant(item.label)}${openGroup === item.label ? " navgroup--open" : ""}`}

                  key={item.label}

                >

                  <div className="navgroup__row">

                    <Link href={item.href} onClick={closeNav}>

                      {item.label}

                    </Link>

                    <button

                      aria-expanded={openGroup === item.label}

                      aria-label={`Toggle ${item.label} menu`}

                      className="navgroup__toggle"

                      onClick={() => setOpenGroup((value) => (value === item.label ? null : item.label))}

                      type="button"

                    >

                      <ChevronDown size={18} />

                    </button>

                  </div>

                  {renderSubmenu(item)}

                </div>

              ) : (

                <Link href={item.href} key={item.label} onClick={closeNav}>

                  {item.label}

                </Link>

              ),

            )}

            {renderCta("mainnav__mobile-cta")}

          </nav>



          {renderCta("header-cta book-btn")}

        </div>

      </div>

    </header>

  );

}


