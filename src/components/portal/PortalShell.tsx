"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Bell, ChevronDown, ChevronLeft, LogOut, Menu, Plus, Search, X } from "lucide-react";
import { useMemo, useState } from "react";

import { notificationLink, sidebarGroups, sidebarItems } from "@/lib/portal/modules";

type PortalShellProps = {
  children: React.ReactNode;
  user: {
    email?: string;
    name?: string;
    role?: string;
  };
};

export function PortalShell({ children, user }: PortalShellProps) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>(
    Object.fromEntries(sidebarGroups.map((group) => [group.label, Boolean(group.defaultOpen)])),
  );

  const title = useMemo(() => {
    if (pathname === "/admin") return "Overview";
    const active = sidebarItems.find((item) => item.href !== "/admin" && (pathname === item.href || pathname.startsWith(`${item.href}/`)));
    return active?.label ?? "Portal";
  }, [pathname]);

  async function logout() {
    await fetch("/api/portal/logout", { credentials: "include", method: "POST" });
    window.location.assign("/admin/login");
  }

  const sidebar = (
    <aside className={collapsed ? "portal-sidebar is-collapsed" : "portal-sidebar"}>
      <div className="portal-brand">
        <Image src="/assets/img/logo.jpg" alt="Nature Romp Safaris" width={74} height={74} />
        <div>
          <strong>Nature Romp</strong>
          <span>Safari Portal</span>
        </div>
      </div>
      <nav className="portal-nav" aria-label="Portal navigation">
        {sidebarGroups.map((group) => {
          const singleOverviewLink = group.label === "Overview" && group.links.length === 1 ? group.links[0] : null;
          const open = collapsed || openGroups[group.label];
          if (singleOverviewLink) {
            const Icon = singleOverviewLink.icon;
            const active = pathname === singleOverviewLink.href;
            return (
              <Link
                className={active ? "portal-nav__link portal-nav__link--group is-active" : "portal-nav__link portal-nav__link--group"}
                href={singleOverviewLink.href}
                key={group.label}
                onClick={() => setDrawerOpen(false)}
              >
                <Icon size={18} />
                <span>{singleOverviewLink.label}</span>
              </Link>
            );
          }
          const GroupIcon = group.icon;
          return (
            <div className="portal-nav-group" key={group.label}>
              <button
                aria-expanded={open}
                className="portal-nav-group__button"
                onClick={() => setOpenGroups((current) => ({ ...current, [group.label]: !current[group.label] }))}
                type="button"
              >
                <GroupIcon size={18} />
                <span>{group.label}</span>
                <ChevronDown size={16} />
              </button>
              {open ? (
                <div className="portal-nav-group__links">
                  {group.links.map((item) => {
                    const Icon = item.icon;
                    const active =
                      item.href === "/admin" ? pathname === "/admin" : pathname === item.href || pathname.startsWith(`${item.href}/`);
                    return (
                      <Link
                        className={active ? "portal-nav__link is-active" : "portal-nav__link"}
                        href={item.href}
                        key={item.href}
                        onClick={() => setDrawerOpen(false)}
                      >
                        <Icon size={18} />
                        <span>{item.label}</span>
                      </Link>
                    );
                  })}
                </div>
              ) : null}
            </div>
          );
        })}
      </nav>
      <button
        aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        className="portal-sidebar__collapse"
        onClick={() => setCollapsed((value) => !value)}
        type="button"
      >
        <ChevronLeft size={18} />
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
          <button className="portal-icon-button portal-mobile-menu" onClick={() => setDrawerOpen(true)} type="button">
            <Menu size={22} />
          </button>
          <div className="portal-topbar__title">
            <p>Kenya Tanzania Safari Adventure</p>
            <h1>{title}</h1>
          </div>
          <label className="portal-search">
            <Search size={18} />
            <input aria-label="Search portal" placeholder="Search portal" />
          </label>
          <Link className="portal-icon-button portal-notification" href={notificationLink.href} title="Notifications">
            <Bell size={20} />
            <span />
          </Link>
            <Link className="portal-quick-create" href="/admin/posts/new">
              <Plus size={18} />
              <span>New article</span>
            </Link>
          <div className="portal-profile">
            <div>
              <strong>{user.name || user.email || "Admin"}</strong>
              <span>{user.role || "admin"}</span>
            </div>
          </div>
          <button className="portal-icon-button" onClick={logout} title="Log out" type="button">
            <LogOut size={20} />
          </button>
        </header>
        <div className="portal-content">{children}</div>
      </main>
    </div>
  );
}
