"use client";

import { CheckCircle2, ImagePlus, Search, Upload, X } from "lucide-react";
import Image from "next/image";
import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { fetchMoreMediaOptions, fetchTotalMediaCount } from "@/app/(portal)/admin/(dashboard)/[module]/actions";

export type PortalMediaOption = {
  alt: string;
  caption?: string;
  filename: string;
  id: string;
  thumbUrl?: string;
  url: string;
};

type MediaPickerFieldProps = {
  autoOpen?: boolean;
  hasMany?: boolean;
  initialValues?: string[];
  label: string;
  name?: string;
  onChange?: (ids: string[], media: PortalMediaOption[]) => void;
  onClose?: () => void;
  options: PortalMediaOption[];
  required?: boolean;
};

function optionImage(option: PortalMediaOption) {
  return option.thumbUrl || option.url;
}

function normalizeMediaUrl(url: string) {
  if (!url || url.startsWith("/")) return url;
  try {
    const parsed = new URL(url);
    if (parsed.pathname.startsWith("/api/media/file/")) {
      return `${parsed.pathname}${parsed.search}`;
    }
  } catch {
    return url;
  }
  return url;
}

function normalizeUploadedMedia(result: Record<string, unknown>): PortalMediaOption {
  const sizes = result.sizes && typeof result.sizes === "object" ? result.sizes as Record<string, unknown> : {};
  const thumb = sizes.thumb && typeof sizes.thumb === "object" ? sizes.thumb as Record<string, unknown> : {};
  const card = sizes.card && typeof sizes.card === "object" ? sizes.card as Record<string, unknown> : {};
  return {
    alt: String(result.alt ?? ""),
    caption: result.caption ? String(result.caption) : "",
    filename: String(result.filename ?? ""),
    id: String(result.id),
    thumbUrl: normalizeMediaUrl(String(thumb.url ?? card.url ?? result.url ?? "")),
    url: normalizeMediaUrl(String(card.url ?? result.url ?? thumb.url ?? "")),
  };
}

export function MediaPickerField({
  autoOpen = false,
  hasMany = false,
  initialValues = [],
  label,
  name,
  onChange,
  onClose,
  options,
  required,
}: MediaPickerFieldProps) {
  const [mediaOptions, setMediaOptions] = useState(options);
  const [selectedIds, setSelectedIds] = useState(initialValues.filter(Boolean));
  const [open, setOpen] = useState(autoOpen);
  const [query, setQuery] = useState("");
  const [uploading, setUploading] = useState(false);
  const [uploadMessage, setUploadMessage] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(options.length >= 36);
  const [totalCount, setTotalCount] = useState<number | undefined>(undefined);
  const [mounted, setMounted] = useState(false);
  const emptyFetchAttempted = useRef(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    setMediaOptions(options);
    setHasMore(options.length >= 36);
    if (options.length > 0) {
      setCurrentPage(Math.max(1, Math.ceil(options.length / 36)));
    }
  }, [options]);

  useEffect(() => {
    if (open && totalCount === undefined) {
      fetchTotalMediaCount().then(setTotalCount).catch(console.error);
    }
  }, [open, totalCount]);

  useEffect(() => {
    if (!open) {
      emptyFetchAttempted.current = false;
      return;
    }
    if (mediaOptions.length > 0 || loadingMore || emptyFetchAttempted.current) return;

    emptyFetchAttempted.current = true;
    let cancelled = false;
    setLoadingMore(true);
    fetchMoreMediaOptions(1)
      .then((nextOptions) => {
        if (cancelled) return;
        setMediaOptions(nextOptions);
        setCurrentPage(1);
        setHasMore(nextOptions.length >= 36);
      })
      .catch(console.error)
      .finally(() => {
        if (!cancelled) setLoadingMore(false);
      });

    return () => {
      cancelled = true;
    };
  }, [open, loadingMore, mediaOptions.length]);

  useEffect(() => {
    if (!open) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [open]);

  function closeDialog() {
    setOpen(false);
    onClose?.();
  }

  const selectedMedia = useMemo(
    () => selectedIds.map((id) => mediaOptions.find((item) => String(item.id) === id)).filter(Boolean) as PortalMediaOption[],
    [mediaOptions, selectedIds],
  );

  const filteredOptions = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return mediaOptions;
    return mediaOptions.filter((item) =>
      [item.alt, item.caption, item.filename]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(normalized),
    );
  }, [mediaOptions, query]);

  function commitSelection(ids: string[]) {
    setSelectedIds(ids);
    const selectedMediaObjects = ids
      .map((id) => mediaOptions.find((item) => String(item.id) === id))
      .filter(Boolean) as PortalMediaOption[];
    onChange?.(ids, selectedMediaObjects);
  }

  function toggle(id: string) {
    if (!hasMany) {
      commitSelection([id]);
      closeDialog();
      return;
    }
    const nextIds = selectedIds.includes(id)
      ? selectedIds.filter((item) => item !== id)
      : [...selectedIds, id];
    commitSelection(nextIds);
  }

  function remove(id: string) {
    commitSelection(selectedIds.filter((item) => item !== id));
  }

  async function uploadMedia(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setUploadMessage("");
    setUploading(true);
    const form = event.currentTarget;
    const formData = new FormData(form);
    const files = formData.getAll("file") as File[];

    let successCount = 0;
    const newMediaItems: PortalMediaOption[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const singleFormData = new FormData();
      singleFormData.append("file", file);
      singleFormData.append("alt", file.name);

      setUploadMessage(`Uploading ${i + 1} of ${files.length}...`);

      try {
        const response = await fetch("/api/portal/media", {
          body: singleFormData,
          credentials: "include",
          method: "POST",
        });

        const result = await response.json().catch(() => null);

        if (response.ok && result.results && result.results[0]) {
          const m = normalizeUploadedMedia(result.results[0]);
          newMediaItems.push(m);
          successCount++;
        }
      } catch (err) {
        console.error("Upload error", err);
      }
    }

    if (newMediaItems.length > 0) {
      setMediaOptions((prev) => [...newMediaItems, ...prev]);
      const newIds = newMediaItems.map(m => m.id);
      const nextSelected = hasMany ? [...selectedIds, ...newIds] : [newIds[0]];

      setSelectedIds(nextSelected);
      onChange?.(nextSelected, nextSelected.map(id => {
        return [...newMediaItems, ...mediaOptions].find(m => String(m.id) === id);
      }).filter(Boolean) as PortalMediaOption[]);
    }

    setUploading(false);
    form.reset();
    setUploadMessage(`✓ Uploaded ${successCount} of ${files.length} successfully!`);
    setTimeout(() => setUploadMessage(""), 5000);
  }

  return (
    <div className="portal-media-select">
      {name ? (
        <select
          aria-hidden="true"
          multiple={hasMany}
          name={name}
          onChange={() => undefined}
          required={required}
          tabIndex={-1}
          value={hasMany ? selectedIds : selectedIds[0] || "__none"}
        >
          {!hasMany ? <option value="__none">None</option> : null}
          {mediaOptions.map((item) => (
            <option key={item.id} value={item.id}>
              {item.filename}
            </option>
          ))}
        </select>
      ) : null}

      {selectedMedia.length ? (
        <div className={hasMany ? "portal-media-has-selection" : "portal-media-has-selection is-single"}>
          <div className="portal-media-selected-grid">
            {selectedMedia.map((item) => (
              <div className="portal-media-selected" key={item.id}>
                <Image alt={item.alt || item.filename} height={180} src={optionImage(item)} width={260} />
                <button aria-label={`Remove ${item.alt || item.filename}`} className="portal-media-selected__remove" onClick={() => remove(item.id)} type="button">
                  <X size={14} />
                </button>
              </div>
            ))}
          </div>
          <button className="portal-media-edit-btn" onClick={() => setOpen(true)} type="button">
            <ImagePlus size={15} />
            {hasMany ? `${selectedMedia.length} photo${selectedMedia.length !== 1 ? "s" : ""} selected — click to add or change` : "Change photo"}
          </button>
        </div>
      ) : (
        <button className="portal-media-empty" onClick={() => setOpen(true)} type="button">
          <ImagePlus size={36} />
          <strong>{label}</strong>
          <span>Click to choose from media library or upload new images</span>
        </button>
      )}

      {open && mounted
        ? createPortal(
            <div
              aria-label={`Select ${label}`}
              aria-modal="true"
              className="portal-media-dialog"
              onClick={closeDialog}
              role="dialog"
            >
              <div
                className="portal-media-dialog__panel"
                onClick={(event) => event.stopPropagation()}
              >
                <div className="portal-media-dialog__head">
                  <div>
                    <strong>{label}</strong>
                    <span>Media library</span>
                  </div>
                  {totalCount !== undefined ? (
                    <div className="portal-media-dialog__count">
                      Showing {mediaOptions.length} of {totalCount} images
                    </div>
                  ) : null}
                  <button aria-label="Close media picker" onClick={closeDialog} type="button">
                    <X size={22} />
                  </button>
                </div>

                <div className="portal-media-dialog__tools">
                  <label>
                    <Search size={17} />
                    <input onChange={(event) => setQuery(event.target.value)} placeholder="Search images..." value={query} />
                  </label>
                  <form onSubmit={uploadMedia}>
                    <input accept="image/*" aria-label="Upload image" multiple name="file" required type="file" />
                    <input aria-label="Alt text" name="alt" placeholder="Alt text (optional for bulk)" />
                    <input aria-label="Caption" name="caption" placeholder="Caption" />
                    <button className="portal-button" disabled={uploading} type="submit">
                      <Upload size={16} />
                      {uploading ? "Uploading..." : "Upload"}
                    </button>
                  </form>
                </div>
                {uploadMessage ? <p className="portal-media-dialog__message">{uploadMessage}</p> : null}

                <div className="portal-media-dialog__grid">
                  {filteredOptions.map((item) => {
                    const selected = selectedIds.includes(item.id);
                    return (
                      <button
                        className={selected ? "portal-media-tile is-selected" : "portal-media-tile"}
                        key={item.id}
                        onClick={() => toggle(item.id)}
                        type="button"
                      >
                        <Image alt={item.alt || item.filename} height={180} src={optionImage(item)} width={240} />
                        <span>{item.alt || item.filename}</span>
                        {selected ? <CheckCircle2 size={20} /> : null}
                      </button>
                    );
                  })}
                  {hasMore && !query ? (
                    <div className="portal-media-dialog__load-more">
                      <button
                        className="portal-button"
                        disabled={loadingMore}
                        onClick={async () => {
                          setLoadingMore(true);
                          try {
                            const nextOptions = await fetchMoreMediaOptions(currentPage + 1);
                            setMediaOptions((prev) => {
                              const newIds = new Set(nextOptions.map((option) => String(option.id)));
                              const filteredPrev = prev.filter((item) => !newIds.has(String(item.id)));
                              return [...filteredPrev, ...nextOptions];
                            });
                            setCurrentPage((page) => page + 1);
                            if (nextOptions.length < 36) setHasMore(false);
                          } catch (err) {
                            console.error("Failed to load more media options", err);
                          } finally {
                            setLoadingMore(false);
                          }
                        }}
                        type="button"
                      >
                        {loadingMore ? "Loading..." : "Load More"}
                      </button>
                    </div>
                  ) : null}
                </div>

                <div className="portal-media-dialog__foot">
                  <button className="portal-button portal-button--secondary" onClick={closeDialog} type="button">
                    Done ({selectedIds.length} selected)
                  </button>
                </div>
              </div>
            </div>,
            document.body,
          )
        : null}
    </div>
  );
}
