"use client";

import { useEffect, useState } from "react";
import { Loader2, MapPin } from "lucide-react";

import { fetchPlaceDetails, searchPlaces, type GeocodeResult } from "@/lib/portal/geocode";

export function PlaceSearchInput({
  country,
  datalistOptions = [],
  hideIcon = false,
  id,
  label,
  onChange,
  placeholder,
  showHint = true,
  value,
}: {
  country?: string;
  datalistOptions?: string[];
  hideIcon?: boolean;
  id?: string;
  label: string;
  onChange: (value: string) => void;
  placeholder?: string;
  showHint?: boolean;
  value: string;
}) {
  const [suggestions, setSuggestions] = useState<GeocodeResult[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [resolving, setResolving] = useState(false);

  useEffect(() => {
    if (!open || value.trim().length < 2) {
      setSuggestions([]);
      setLoading(false);
      return;
    }

    let cancelled = false;
    const timer = window.setTimeout(async () => {
      setLoading(true);
      try {
        const results = await searchPlaces(value, { country, limit: 8 });
        if (!cancelled) setSuggestions(results);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }, 300);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [country, open, value]);

  async function applySuggestion(result: GeocodeResult) {
    setResolving(true);
    try {
      let resolved = result;
      if (result.placeId && (!result.lat || !result.lng)) {
        const details = await fetchPlaceDetails(result.placeId);
        if (details) resolved = details;
      }
      onChange(resolved.label);
      setOpen(false);
      setSuggestions([]);
    } finally {
      setResolving(false);
    }
  }

  return (
    <div className="acc-field place-search-input">
      <label className="acc-label" htmlFor={id}>
        {label}
      </label>
      <div className="place-search-input__wrap">
        {hideIcon ? null : <MapPin size={14} />}
        <input
          autoComplete="off"
          className={hideIcon ? "acc-input place-search-input__field place-search-input__field--plain" : "acc-input place-search-input__field"}
          id={id}
          list={datalistOptions.length ? `${id}-list` : undefined}
          onBlur={() => {
            window.setTimeout(() => setOpen(false), 150);
          }}
          onChange={(e) => {
            onChange(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          placeholder={placeholder}
          type="text"
          value={value}
        />
        {loading || resolving ? <Loader2 className="place-search-input__spinner" size={14} /> : null}
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
              <li key={item.placeId ?? `${item.label}-${item.lat}-${item.lng}`}>
                <button disabled={resolving} onMouseDown={(event) => event.preventDefault()} onClick={() => applySuggestion(item)} type="button">
                  {item.label}
                </button>
              </li>
            ))}
          </ul>
        ) : null}
      </div>
      {showHint ? (
        <span className="acc-hint">Search any place in Kenya or Tanzania — pick a result from Google Maps.</span>
      ) : null}
    </div>
  );
}
