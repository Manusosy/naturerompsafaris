"use server";

import { findCollection, requirePortalUser } from "@/lib/portal/data";

import { normalizeMediaUrl } from "@/lib/cms-media";

export async function fetchMoreMedia(page: number) {
    await requirePortalUser();
    const result = await findCollection("media", 36, undefined, page);
    return result.docs;
}

export async function fetchTotalMediaCount() {
    await requirePortalUser();
    const payload = await import("@/lib/portal/data").then(m => m.getPayloadClient());
    const countResult = await payload.count({
        collection: "media" as never,
        overrideAccess: true,
    });
    return countResult.totalDocs;
}

export async function fetchMoreMediaOptions(page: number) {
    await requirePortalUser();
    const result = await findCollection("media", 36, undefined, page);
    return (result.docs as Array<Record<string, unknown>>).map((doc) => {
        const sizes = doc.sizes && typeof doc.sizes === "object" ? doc.sizes as Record<string, unknown> : {};
        const thumb = sizes.thumb && typeof sizes.thumb === "object" ? sizes.thumb as Record<string, unknown> : {};
        const card = sizes.card && typeof sizes.card === "object" ? sizes.card as Record<string, unknown> : {};
        return {
            alt: String(doc.alt ?? ""),
            caption: String(doc.caption ?? ""),
            filename: String(doc.filename ?? ""),
            id: String(doc.id),
            thumbUrl: normalizeMediaUrl(String(thumb.url ?? card.url ?? doc.url ?? "")),
            url: normalizeMediaUrl(String(card.url ?? doc.url ?? "")),
        };
    });
}
