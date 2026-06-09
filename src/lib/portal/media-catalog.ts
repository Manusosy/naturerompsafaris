"use client";

import { dedupeMediaOptions, type PortalMediaOption } from "@/lib/portal/media-option";

type Listener = () => void;

let catalog: PortalMediaOption[] = [];
const listeners = new Set<Listener>();

function notify() {
  for (const listener of listeners) {
    listener();
  }
}

export function getMediaCatalogSnapshot() {
  return catalog;
}

export function subscribeMediaCatalog(listener: Listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function publishMediaCatalog(items: PortalMediaOption[]) {
  catalog = dedupeMediaOptions(items);
  notify();
}

export function prependMediaCatalog(items: PortalMediaOption[]) {
  if (items.length === 0) return;
  catalog = dedupeMediaOptions([...items, ...catalog]);
  notify();
}

export function mergeMediaCatalog(items: PortalMediaOption[]) {
  if (items.length === 0) return;
  catalog = dedupeMediaOptions([...items, ...catalog]);
  notify();
}
