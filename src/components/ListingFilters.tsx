"use client";

import { ChevronDown, SlidersHorizontal } from "lucide-react";
import { useId, useState, type ReactNode } from "react";

/**
 * Wraps listing-page filter forms. On desktop the filters are always visible
 * in the sidebar; on mobile they collapse behind a compact "Filters" toggle so
 * results appear immediately below the page hero.
 */
export function ListingFilters({
  activeCount = 0,
  children,
}: {
  activeCount?: number;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const bodyId = useId();

  return (
    <div className="acc-filters">
      <button
        aria-controls={bodyId}
        aria-expanded={open}
        className="acc-filters__toggle"
        onClick={() => setOpen((value) => !value)}
        type="button"
      >
        <SlidersHorizontal aria-hidden size={15} strokeWidth={2.2} />
        <span>
          Filters
          {activeCount > 0 ? (
            <span className="acc-filters__count">{activeCount}</span>
          ) : null}
        </span>
        <ChevronDown
          aria-hidden
          className={`acc-filters__chevron${open ? " is-open" : ""}`}
          size={16}
          strokeWidth={2.2}
        />
      </button>
      <div className={`acc-filters__body${open ? " is-open" : ""}`} id={bodyId}>
        {children}
      </div>
    </div>
  );
}
