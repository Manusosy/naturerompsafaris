"use server";

import { findCollection, requirePortalUserForAction } from "@/lib/portal/data";

import { toPortalMediaOption } from "@/lib/portal/media-option";

export async function fetchMoreMedia(page: number) {
    await requirePortalUserForAction();
    const result = await findCollection("media", 36, undefined, page);
    return result.docs;
}

export async function fetchTotalMediaCount() {
    await requirePortalUserForAction();
    const payload = await import("@/lib/portal/data").then(m => m.getPayloadClient());
    const countResult = await payload.count({
        collection: "media" as never,
        overrideAccess: true,
    });
    return countResult.totalDocs;
}

export async function fetchMoreMediaOptions(page: number) {
    await requirePortalUserForAction();
    const result = await findCollection("media", 36, undefined, page);
    return (result.docs as Array<Record<string, unknown>>).map(toPortalMediaOption);
}
