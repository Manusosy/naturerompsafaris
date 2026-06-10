"use client";

import { CheckCircle2, ImagePlus, Search, Upload, X } from "lucide-react";
import Image from "next/image";
import { useEffect, useMemo, useState, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";
import { fetchMoreMediaOptions, fetchTotalMediaCount } from "@/app/(portal)/admin/(dashboard)/[module]/actions";
import { resolveUploadAlt } from "@/lib/cms-media";
import {
  getMediaCatalogSnapshot,
  mergeMediaCatalog,
  prependMediaCatalog,
  publishMediaCatalog,
  subscribeMediaCatalog,
} from "@/lib/portal/media-catalog";
import {
  dedupeMediaOptions,
  optionImageUrl,
  toPortalMediaOption,
  type PortalMediaOption,
} from "@/lib/portal/media-option";
import {
  fetchPortalMediaUploadConfig,
  parsePortalMediaUploadResponse,
  uploadPortalMediaFile,
} from "@/lib/portal/upload-media-client";

export type { PortalMediaOption };

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

function mergeMediaSources(...sources: PortalMediaOption[][]) {
  return dedupeMediaOptions(sources.flat());
}

function useIsClient() {
  return useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );
}

function useMediaCatalog() {
  return useSyncExternalStore(subscribeMediaCatalog, getMediaCatalogSnapshot, getMediaCatalogSnapshot);
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
  const catalog = useMediaCatalog();
  const [mediaOptions, setMediaOptions] = useState(() => mergeMediaSources(catalog, options));
  const [selectedIds, setSelectedIds] = useState(() => initialValues.filter(Boolean).map(String));
  const [open, setOpen] = useState(autoOpen);
  const [query, setQuery] = useState("");
  const [uploading, setUploading] = useState(false);
  const [uploadMessage, setUploadMessage] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [loadingMore, setLoadingMore] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [hasMore, setHasMore] = useState(options.length >= 36);
  const [totalCount, setTotalCount] = useState<number | undefined>(undefined);
  const [loadError, setLoadError] = useState("");
  const mounted = useIsClient();

  const seedOptions = useMemo(() => dedupeMediaOptions(options), [options]);
  const seedOptionsKey = seedOptions.map((item) => item.id).join("|");

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setSelectedIds(initialValues.filter(Boolean).map(String));
  }, [initialValues.join("|")]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMediaOptions((prev) => mergeMediaSources(catalog, seedOptions, prev));
  }, [catalog, seedOptionsKey, seedOptions]);

  useEffect(() => {
    if (!open) return;

    let cancelled = false;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setRefreshing(true);
    setLoadError("");

    fetchMoreMediaOptions(1)
      .then((freshOptions) => {
        if (cancelled) return;
        const merged = mergeMediaSources(getMediaCatalogSnapshot(), freshOptions, seedOptions);
        setMediaOptions(merged);
        publishMediaCatalog(merged);
        setCurrentPage(1);
        setHasMore(freshOptions.length >= 36);
      })
      .catch((error) => {
        console.error(error);
        if (!cancelled) {
          setLoadError(error instanceof Error ? error.message : "Unable to load the media library.");
        }
      })
      .finally(() => {
        if (!cancelled) setRefreshing(false);
      });

    return () => {
      cancelled = true;
    };
  }, [open, seedOptions, seedOptionsKey]);

  useEffect(() => {
    if (!open) return;

    let cancelled = false;
    fetchTotalMediaCount()
      .then((count) => {
        if (!cancelled) setTotalCount(count);
      })
      .catch((error) => {
        console.error(error);
        if (!cancelled) {
          setLoadError(error instanceof Error ? error.message : "Unable to load the media library.");
        }
      });

    return () => {
      cancelled = true;
    };
  }, [open]);

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
    const normalizedIds = ids.map(String);
    setSelectedIds(normalizedIds);
    const selectedMediaObjects = normalizedIds
      .map((id) => mediaOptions.find((item) => String(item.id) === id))
      .filter(Boolean) as PortalMediaOption[];
    onChange?.(normalizedIds, selectedMediaObjects);
  }

  function toggle(id: string) {
    const normalizedId = String(id);
    if (!hasMany) {
      commitSelection([normalizedId]);
      closeDialog();
      return;
    }
    const nextIds = selectedIds.includes(normalizedId)
      ? selectedIds.filter((item) => item !== normalizedId)
      : [...selectedIds, normalizedId];
    commitSelection(nextIds);
  }

  function remove(id: string) {
    commitSelection(selectedIds.filter((item) => item !== String(id)));
  }

  async function uploadMedia(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setUploadMessage("");
    setUploading(true);
    const form = event.currentTarget;
    const formData = new FormData(form);
    const files = formData.getAll("file").filter((entry): entry is File => entry instanceof File);
    const formAlt = String(formData.get("alt") || "");
    const formCaption = String(formData.get("caption") || "").trim();

    if (files.length === 0) {
      setUploading(false);
      setUploadMessage("Please choose at least one image to upload.");
      return;
    }

    let successCount = 0;
    const errors: string[] = [];
    const newMediaItems: PortalMediaOption[] = [];

    let uploadConfig;
    try {
      uploadConfig = await fetchPortalMediaUploadConfig();
    } catch (error) {
      console.error(error);
      setUploading(false);
      setUploadMessage("Could not load upload settings. Please refresh and try again.");
      return;
    }

    for (let i = 0; i < files.length; i++) {
      const file = files[i];

      setUploadMessage(`Uploading ${i + 1} of ${files.length}...`);

      try {
        const { response } = await uploadPortalMediaFile({
          alt: resolveUploadAlt(formAlt, file, files.length),
          caption: formCaption || undefined,
          file,
          uploadConfig,
        });

        const result = await response.json().catch(() => null);
        const uploaded = parsePortalMediaUploadResponse(result);

        if (response.ok && uploaded) {
          newMediaItems.push(toPortalMediaOption(uploaded));
          successCount++;
        } else {
          errors.push(typeof result?.message === "string" ? result.message : `Failed to upload ${file.name}.`);
        }
      } catch (err) {
        console.error("Upload error", err);
        errors.push(err instanceof Error ? err.message : `Failed to upload ${file.name}.`);
      }
    }

    if (newMediaItems.length > 0) {
      prependMediaCatalog(newMediaItems);
      setMediaOptions((prev) => dedupeMediaOptions([...newMediaItems, ...prev]));
      setTotalCount((count) => (count === undefined ? count : count + newMediaItems.length));

      const newIds = newMediaItems.map((item) => item.id);
      const nextSelected = hasMany ? [...selectedIds, ...newIds] : [newIds[0]];

      setSelectedIds(nextSelected);
      onChange?.(
        nextSelected,
        nextSelected
          .map((id) => dedupeMediaOptions([...newMediaItems, ...mediaOptions]).find((item) => item.id === id))
          .filter(Boolean) as PortalMediaOption[],
      );
    }

    setUploading(false);
    form.reset();
    if (successCount === files.length) {
      setUploadMessage(`Uploaded ${successCount} of ${files.length} successfully.`);
    } else if (successCount > 0) {
      setUploadMessage(`Uploaded ${successCount} of ${files.length}. ${errors[0] || ""}`.trim());
    } else {
      setUploadMessage(errors[0] || "Upload failed. Please try again.");
    }
    setTimeout(() => setUploadMessage(""), 7000);
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
                <Image alt={item.alt || item.filename} height={180} src={optionImageUrl(item)} width={260} />
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
                      Showing {filteredOptions.length} of {totalCount} images
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
                  <form className="portal-media-dialog__upload" onSubmit={uploadMedia}>
                    <label className="portal-field portal-media-dialog__upload-file">
                      <input accept="image/jpeg,image/png,image/webp" aria-label="Upload image" multiple name="file" required type="file" />
                    </label>
                    <label className="portal-field portal-media-dialog__upload-alt">
                      <input aria-label="Alt text" name="alt" placeholder="Alt text (optional for bulk)" />
                    </label>
                    <label className="portal-field portal-media-dialog__upload-caption">
                      <input aria-label="Caption" name="caption" placeholder="Caption" />
                    </label>
                    <button className="portal-button" disabled={uploading} type="submit">
                      <Upload size={16} />
                      {uploading ? "Uploading..." : "Upload"}
                    </button>
                  </form>
                </div>
                {uploadMessage ? (
                  <p className={`portal-media-dialog__message${/failed|please choose/i.test(uploadMessage) ? " portal-media-dialog__message--error" : ""}`}>
                    {uploadMessage}
                  </p>
                ) : null}
                {loadError ? <p className="portal-media-dialog__message portal-media-dialog__message--error">{loadError}</p> : null}

                <div className="portal-media-dialog__grid">
                  {refreshing && filteredOptions.length === 0 ? (
                    <p className="portal-media-dialog__message">Loading media library...</p>
                  ) : null}
                  {filteredOptions.map((item) => {
                    const selected = selectedIds.includes(String(item.id));
                    const imageSrc = optionImageUrl(item);
                    return (
                      <button
                        className={selected ? "portal-media-tile is-selected" : "portal-media-tile"}
                        key={item.id}
                        onClick={() => toggle(item.id)}
                        type="button"
                      >
                        <span className="portal-media-tile__media">
                          {imageSrc ? (
                            <img
                              alt={item.alt || item.filename}
                              className="portal-media-tile__img"
                              draggable={false}
                              loading="lazy"
                              src={imageSrc}
                            />
                          ) : (
                            <span className="portal-media-tile__empty">No preview</span>
                          )}
                        </span>
                        <span className="portal-media-tile__label">{item.alt || item.filename}</span>
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
                              const merged = dedupeMediaOptions([...prev, ...nextOptions]);
                              mergeMediaCatalog(nextOptions);
                              return merged;
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
