"use client";

import { useEffect, useState } from "react";
import { MapPin } from "lucide-react";

import { searchPlaces, type GeocodeResult } from "@/lib/portal/geocode";

export function PlaceSearchInput({
  country,
  datalistOptions = [],
  id,
  label,
  onChange,
  placeholder,
  value,
}: {
  country?: string;
  datalistOptions?: string[];
  id?: string;
  label: string;
  onChange: (value: string) => void;
  placeholder?: string;
  value: string;
}) {
  const [suggestions, setSuggestions] = useState<GeocodeResult[]>([]);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open || value.trim().length < 2) {
      setSuggestions([]);
      return;
    }

    const timer = window.setTimeout(async () => {
      const results = await searchPlaces(value, { country, limit: 5 });
      setSuggestions(results);
    }, 350);

    return () => window.clearTimeout(timer);
  }, [country, open, value]);

  function applySuggestion(result: GeocodeResult) {
    const shortLabel = result.shortLabel || result.label.split(",").slice(0, 2).join(",").trim();
    onChange(shortLabel || result.label);
    setOpen(false);
    setSuggestions([]);
  }

  return (
    <div className="acc-field place-search-input">
      <label className="acc-label" htmlFor={id}>
        {label}
      </label>
      <div className="place-search-input__wrap">
        <MapPin size={14} />
        <input
          className="acc-input place-search-input__field"
          id={id}
          list={datalistOptions.length ? `${id}-list` : undefined}
          onChange={(e) => {
            onChange(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          placeholder={placeholder}
          type="text"
          value={value}
        />
        {datalistOptions.length ? (
          <datalist id={`${id}-list`}>
            {datalistOptions.map((option) => (
              <option key={option} value={option} />
            ))}
          </datalist>
        ) : null}
        {open && suggestions.length > 0 ? (
          <ul className="location-search-picker__suggestions">
            {suggestions.map((item) => (
              <li key={`${item.lat}-${item.lng}-${item.label}`}>
                <button onClick={() => applySuggestion(item)} type="button">
                  {item.shortLabel ?? item.label}
                </button>
              </li>
            ))}
          </ul>
        ) : null}
      </div>
      <span className="acc-hint">Start typing a place name and pick a match from the list.</span>
    </div>
  );
}
