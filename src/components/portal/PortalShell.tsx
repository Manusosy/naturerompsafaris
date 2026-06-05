"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Bell, ChevronDown, LogOut, Menu, PanelLeftClose, PanelLeftOpen, Search, Settings, X } from "lucide-react";
import { useMemo, useState } from "react";

import { notificationLink, sidebarGroups, sidebarItems } from "@/lib/portal/modules";

type PortalShellProps = {
  children: React.ReactNode;
  notificationCount?: number;
  user: {
    email?: string;
    name?: string;
    role?: string;
  };
};

type SidebarGroup = (typeof sidebarGroups)[number];

function NavGroup({
  collapsed,
  group,
  openGroup,
  pathname,
  setDrawerOpen,
  setOpenGroup,
}: {
  collapsed: boolean;
  group: SidebarGroup;
  openGroup: string | null;
  pathname: string;
  setDrawerOpen: (o: boolean) => void;
  setOpenGroup: (label: string | null) => void;
}) {
  const GroupIcon = group.icon;
  const isOpen = openGroup === group.label;

  const isActive = group.links.some((item) =>
    item.href === "/admin"
      ? pathname === "/admin"
      : pathname === item.href || pathname.startsWith(`${item.href}/`),
  );

  const links = group.links.map((item) => {
    const Icon = item.icon;
    // If another sibling link is an exact match, don't let this link match via startsWith.
    // e.g. on /admin/accommodations/new, "All Stays" (/admin/accommodations) must NOT activate.
    const siblingExactMatch = group.links.some(
      (sibling) => sibling.href !== item.href && pathname === sibling.href,
    );
    const active =
      item.href === "/admin"
        ? pathname === "/admin"
        : pathname === item.href ||
          (!siblingExactMatch && pathname.startsWith(`${item.href}/`));
    return (
      <Link
        className={active ? "portal-nav__link portal-nav__sub-link is-active" : "portal-nav__link portal-nav__sub-link"}
        href={item.href}
        key={item.href}
        onClick={() => setDrawerOpen(false)}
      >
        <Icon size={14} />
        <span>{item.label}</span>
      </Link>
    );
  });

  // Collapsed mode: hover flyout panel to the right
  if (collapsed) {
    return (
      <div className={`portal-nav-group portal-nav-group--flyout${isActive ? " has-active" : ""}`}>
        <button
          className={`portal-nav-group__button${isActive ? " is-active" : ""}`}
          onClick={() => setOpenGroup(isOpen ? null : group.label)}
          title={group.label}
          type="button"
        >
          <GroupIcon size={18} />
        </button>
        <div className="portal-nav-group__flyout">
          <p className="portal-nav-group__flyout-label">{group.label}</p>
          {links}
        </div>
      </div>
    );
  }

  // Expanded mode: click-to-expand accordion inline
  return (
    <div className={`portal-nav-group${isActive ? " has-active" : ""}`}>
      <button
        className={[
          "portal-nav-group__button",
          isActive ? "is-active" : "",
          isOpen ? "is-open" : "",
        ].filter(Boolean).join(" ")}
        onClick={() => setOpenGroup(isOpen ? null : group.label)}
        type="button"
      >
        <GroupIcon size={17} />
        <span>{group.label}</span>
        <ChevronDown className={`portal-nav-chevron${isOpen ? " is-open" : ""}`} size={13} />
      </button>
      {isOpen ? <div className="portal-nav-group__links">{links}</div> : null}
    </div>
  );
}

export function PortalShell({ children, notificationCount = 0, user }: PortalShellProps) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);

  const [openGroup, setOpenGroup] = useState<string | null>(() => {
    const active = sidebarGroups.find(
      (g) =>
        g.label !== "Overview" &&
        g.links.some(
          (l) => l.href !== "/admin" && (pathname === l.href || pathname.startsWith(`${l.href}/`)),
        ),
    );
    return active?.label ?? (sidebarGroups[1]?.label ?? null);
  });

  const title = useMemo(() => {
    if (pathname === "/admin") return "Overview";
    const active = sidebarItems.find(
      (item) => item.href !== "/admin" && (pathname === item.href || pathname.startsWith(`${item.href}/`)),
    );
    return active?.label ?? "Portal";
  }, [pathname]);

  async function logout() {
    await fetch("/api/portal/logout", { credentials: "include", method: "POST" });
    window.location.assign("/admin/login");
  }

  const displayName = user.name || user.email || "Admin";
  const initials = displayName
    .split(/\s+/)
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const sidebar = (
    <aside className={collapsed ? "portal-sidebar is-collapsed" : "portal-sidebar"}>
      <div className="portal-brand">
        <div className="portal-brand__logo">
          <Image src="/assets/img/logo.jpg" alt="Nature Romp Safaris" width={160} height={56} />
        </div>
      </div>

      <nav className="portal-nav" aria-label="Portal navigation">
        {sidebarGroups.map((group) => {
          const isOverview = group.label === "Overview";
          if (isOverview) {
            const link = group.links[0];
            const Icon = link.icon;
            const active = pathname === link.href;
            return (
              <Link
                className={
                  active
                    ? "portal-nav__link portal-nav__link--group is-active"
                    : "portal-nav__link portal-nav__link--group"
                }
                href={link.href}
                key={group.label}
                onClick={() => setDrawerOpen(false)}
              >
                <Icon size={17} />
                <span>{link.label}</span>
              </Link>
            );
          }
          return (
            <NavGroup
              collapsed={collapsed}
              group={group}
              key={group.label}
              openGroup={openGroup}
              pathname={pathname}
              setDrawerOpen={setDrawerOpen}
              setOpenGroup={setOpenGroup}
            />
          );
        })}
      </nav>

      <button
        aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        className="portal-sidebar__collapse"
        onClick={() => setCollapsed((v) => !v)}
        type="button"
      >
        {collapsed ? <PanelLeftOpen size={16} /> : <PanelLeftClose size={16} />}
        <span>Collapse</span>
      </button>
    </aside>
  );

  return (
    <div className={collapsed ? "portal-app has-collapsed-sidebar" : "portal-app"}>
      <div className={drawerOpen ? "portal-drawer is-open" : "portal-drawer"}>
        <button className="portal-drawer__close" onClick={() => setDrawerOpen(false)} type="button">
          <X size={20} />
        </button>
        {sidebar}
      </div>
      <div className="portal-desktop-sidebar">{sidebar}</div>

      <main className="portal-main">
        <header className="portal-topbar">
          <button
            className="portal-icon-button portal-mobile-menu"
            onClick={() => setDrawerOpen(true)}
            type="button"
          >
            <Menu size={22} />
          </button>
          <div className="portal-topbar__title">
            <p>Kenya Tanzania Safari Adventure</p>
            <h1>{title}</h1>
          </div>
          <label className="portal-search">
            <Search size={16} />
            <input aria-label="Search portal" placeholder="Search portal…" />
          </label>
          <Link
            className="portal-icon-button portal-notification"
            href={notificationLink.href}
            title="New enquiries and contact form submissions"
          >
            <Bell size={20} />
            {notificationCount > 0 ? (
              <span>{notificationCount > 99 ? "99+" : notificationCount}</span>
            ) : null}
          </Link>
          <div className="portal-profile-menu">
            <button
              aria-expanded={profileOpen}
              aria-haspopup="menu"
              className="portal-profile-trigger"
              onClick={() => setProfileOpen((v) => !v)}
              type="button"
            >
              <span className="portal-profile-avatar">{initials}</span>
            </button>
            {profileOpen ? (
              <div className="portal-profile-dropdown" role="menu">
                <div className="portal-profile-dropdown__header">
                  <strong>{displayName}</strong>
                  <small>{user.role || "admin"}</small>
                </div>
                <div className="portal-profile-dropdown__divider" />
                <Link href="/admin/account" onClick={() => setProfileOpen(false)} role="menuitem">
                  <Settings size={17} />
                  <span>My account</span>
                </Link>
                <button onClick={logout} role="menuitem" type="button">
                  <LogOut size={17} />
                  <span>Logout</span>
                </button>
              </div>
            ) : null}
          </div>
        </header>
        <div className="portal-content">{children}</div>
      </main>
    </div>
  );
}
