import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";

import { DeleteAccommodationButton } from "@/components/portal/DeleteAccommodationButton";
import { PageHeader } from "@/components/portal/PortalCards";
import { formatValue, getValue } from "@/lib/portal/format";
import { MediaLibrary } from "@/components/portal/MediaLibrary";
import { ResourceForm } from "@/components/portal/ResourceForm";
import { EnquiryInbox } from "@/components/portal/EnquiryInbox";
import { ResourceTable } from "@/components/portal/ResourceTable";
import { ArticleTagsForm } from "@/components/portal/ArticleTagsForm";
import { ArticleTagsTable } from "@/components/portal/ArticleTagsTable";
import { PostCategoriesForm } from "@/components/portal/PostCategoriesForm";
import { PostCategoriesTable } from "@/components/portal/PostCategoriesTable";
import { normalizeMediaUrl } from "@/lib/cms-media";
import { findCollection, getGlobal, getMediaOptions, getRelationOptions, requirePortalUser } from "@/lib/portal/data";
import { getPortalModule, moduleNeedsMediaOptions } from "@/lib/portal/modules";
import configPromise from "@payload-config";
import { getPayload } from "payload";

const ACCOMMODATION_COUNTRY_LABELS: Record<string, string> = {
  kenya: "Kenya",
  tanzania: "Tanzania",
};

function formatAccommodationLocation(location: string, country: string) {
  const countryLabel = ACCOMMODATION_COUNTRY_LABELS[country] ?? "";
  if (!countryLabel) return location;
  if (location.toLowerCase().includes(countryLabel.toLowerCase())) return location;
  return [location, countryLabel].filter(Boolean).join(", ");
}

export default async function PortalModulePage({
  params,
  searchParams,
}: {
  params: Promise<{ module: string }>;
  searchParams: Promise<{ category?: string; page?: string; status?: string; tag?: string }>;
}) {
  await requirePortalUser();
  const routeParams = await params;
  const query = await searchParams;
  const enquiryStatusFilter =
    query.status === "new"
      ? "new"
      : query.status === "open"
        ? "__open"
        : query.status === "quoted"
          ? "quoted"
          : query.status === "booked"
            ? "booked"
            : "__all";
  const moduleSlug = routeParams.module;
  const moduleDef = getPortalModule(moduleSlug);
  if (!moduleDef) notFound();
  const page = Math.max(1, Number(query.page ?? "1") || 1);

  if (moduleDef.global) {
    const globalDoc = (await getGlobal(moduleDef.global)) as Record<string, unknown>;
    const mediaOptions = moduleNeedsMediaOptions(moduleDef.fields)
      ? await getMediaOptions()
      : [];
    return (
      <div className="portal-stack">
        <PageHeader breadcrumb={`Dashboard / Website / ${moduleDef.label}`} description={moduleDef.description} title={moduleDef.label} />
        <ResourceForm
          document={globalDoc}
          fields={moduleDef.fields}
          globalSlug={moduleDef.global}
          mediaOptions={mediaOptions}
          moduleHref={moduleDef.href}
          title={`Update ${moduleDef.label}`}
        />
      </div>
    );
  }

  const pageSize = moduleSlug === "media" ? 36 : 20;
  const sort = moduleSlug === "enquiries" ? "-createdAt" : "-updatedAt";
  const result = await findCollection(moduleDef.collection ?? "", pageSize, moduleDef.listWhere, page, sort);
  const docs = result.docs as Array<Record<string, unknown>>;
  const totalPages = "totalPages" in result ? result.totalPages : 1;
  const totalDocs = "totalDocs" in result ? (result.totalDocs as number) : docs.length;

  if (moduleSlug === "media") {
    return (
      <div className="portal-stack">
        <PageHeader breadcrumb="Dashboard / Media / Media Library" description={moduleDef.description} title={moduleDef.label} />
        <MediaLibrary
          docs={docs}
          page={page}
          totalPages={totalPages}
          totalDocs={totalDocs}
        />
      </div>
    );
  }

  if (moduleSlug === "post-categories") {
    const payload = await getPayload({ config: configPromise });
    const postCounts: Record<string, number> = {};

    // For each category, count the posts
    for (const cat of docs) {
      const count = await payload.count({
        collection: "posts",
        where: { category: { equals: cat.id } },
      });
      postCounts[String(cat.id)] = count.totalDocs;
    }

    return (
      <div className="portal-stack">
        <PageHeader breadcrumb={`Dashboard / ${moduleDef.label}`} description={moduleDef.description} title={moduleDef.label} />
        <div className="taxonomy-layout">
          <PostCategoriesForm />
          <PostCategoriesTable docs={docs} postCounts={postCounts} />
        </div>
      </div>
    );
  }

  if (moduleSlug === "article-tags") {
    const payload = await getPayload({ config: configPromise });
    const postCounts: Record<string, number> = {};

    for (const tag of docs) {
      const count = await payload.count({
        collection: "posts",
        where: { tags: { contains: tag.id } },
      });
      postCounts[String(tag.id)] = count.totalDocs;
    }

    return (
      <div className="portal-stack">
        <PageHeader breadcrumb={`Dashboard / ${moduleDef.label}`} description={moduleDef.description} title={moduleDef.label} />
        <div className="taxonomy-layout">
          <ArticleTagsForm />
          <ArticleTagsTable docs={docs} postCounts={postCounts} />
        </div>
      </div>
    );
  }

  if (moduleSlug === "accommodations") {
    const getAccommodationCover = (doc: Record<string, unknown>) => {
      const photos = Array.isArray(doc.photos) ? doc.photos : [];
      const cover = photos[0];
      if (!cover || typeof cover !== "object") return "";
      const media = cover as { sizes?: Record<string, { url?: string }>; url?: string };
      return normalizeMediaUrl(media.sizes?.card?.url ?? media.sizes?.thumb?.url ?? media.url ?? "");
    };

    return (
      <div
        className="portal-stack"
        style={{ gap: 0, background: "#f0f0f1", minHeight: "100vh", padding: "10px 20px" }}
      >
        <div className="wp-page-title-wrap">
          <h1 className="wp-page-title">{moduleDef.label}</h1>
          <Link className="wp-add-new-button" href={`${moduleDef.href}/new`}>
            Add New
          </Link>
        </div>

        <div
          className="accommodation-admin-grid"
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(240px, 300px))",
            gap: "16px",
            marginTop: "10px",
            alignItems: "start",
          }}
        >
          {docs.map((doc) => {
            const imageUrl = getAccommodationCover(doc);
            const availability = String(getValue(doc, "availability") || "Available");
            const rawPriceText = formatValue(getValue(doc, "priceText"));
            const rawPrice = getValue(doc, "price");
            const priceText = rawPriceText || (rawPrice ? `From $${rawPrice} / night` : "Price on request");
            const location = formatValue(getValue(doc, "location"));
            const country = String(getValue(doc, "country") ?? "");
            const name = String(doc.name ?? "Accommodation");

            return (
              <div
                key={String(doc.id)}
                className="accommodation-admin-card"
                style={{
                  background: "#fff",
                  border: "1px solid #ccd0d4",
                  boxShadow: "0 1px 1px rgba(0,0,0,.04)",
                  display: "flex",
                  flexDirection: "column",
                  overflow: "hidden",
                }}
              >
                <div style={{ position: "relative", width: "100%", aspectRatio: "16/9" }}>
                  <Link href={`/admin/accommodations/${doc.id}`} style={{ display: "block", width: "100%", height: "100%" }}>
                    <Image
                      alt={name}
                      fill
                      sizes="(max-width: 900px) 100vw, 320px"
                      src={imageUrl || "/assets/img/placeholder.jpg"}
                      unoptimized
                      style={{ width: "100%", height: "100%", objectFit: "cover" }}
                    />
                  </Link>
                  <div
                    style={{
                      position: "absolute",
                      top: "10px",
                      right: "10px",
                      background: "rgba(255,255,255,0.9)",
                      padding: "2px 8px",
                      fontSize: "12px",
                      fontWeight: 600,
                      borderRadius: "3px",
                      border: "1px solid #ccd0d4",
                    }}
                  >
                    {availability}
                  </div>
                </div>
                <div style={{ padding: "15px", flex: 1, display: "flex", flexDirection: "column" }}>
                  <Link
                    href={`/admin/accommodations/${doc.id}`}
                    style={{ textDecoration: "none", color: "inherit" }}
                  >
                    <h3 style={{ margin: "0 0 5px", fontSize: "16px" }}>{name}</h3>
                  </Link>
                  <p style={{ margin: "0 0 10px", fontSize: "13px", color: "#646970" }}>
                    {formatAccommodationLocation(location, country)}
                  </p>
                  <div
                    style={{
                      marginTop: "auto",
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      borderTop: "1px solid #f0f0f1",
                      paddingTop: "10px",
                    }}
                  >
                    <span style={{ fontSize: "14px", fontWeight: 600 }}>
                      {priceText}
                    </span>
                    <div className="accommodation-admin-card__actions">
                      <Link
                        href={`/admin/accommodations/${doc.id}`}
                        style={{ color: "#2271b1", fontSize: "13px", textDecoration: "none" }}
                      >
                        Edit
                      </Link>
                      <DeleteAccommodationButton id={String(doc.id)} name={name} />
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  if (moduleSlug === "enquiries") {
    return (
      <div
        className="portal-stack"
        style={{ gap: 0, background: "#f0f0f1", minHeight: "100vh", padding: "10px 20px" }}
      >
        <div className="wp-page-title-wrap">
          <h1 className="wp-page-title">{moduleDef.label}</h1>
        </div>
        <EnquiryInbox
          docs={docs}
          emptyLabel={moduleDef.emptyLabel}
          initialStatusFilter={enquiryStatusFilter}
          page={page}
          totalPages={totalPages}
        />
      </div>
    );
  }

  const categoryOptions =
    moduleSlug === "posts" ? await getRelationOptions("post-categories") : undefined;

  return (
    <div
      className="portal-stack"
      style={{ gap: 0, background: "#f0f0f1", minHeight: "100vh", padding: "10px 20px" }}
    >
      <div className="wp-page-title-wrap">
        <h1 className="wp-page-title">{moduleDef.label}</h1>
        {moduleDef.newLabel && (
          <Link className="wp-add-new-button" href={`${moduleDef.href}/new`}>
            {moduleDef.newLabel}
          </Link>
        )}
      </div>
      <ResourceTable
        categoryFilter={query.category}
        categoryOptions={categoryOptions}
        collection={moduleDef.collection}
        docs={result.docs as Array<Record<string, unknown>>}
        editModuleSlug={moduleDef.editModuleSlug}
        emptyLabel={moduleDef.emptyLabel}
        moduleSlug={moduleSlug}
        page={page}
        tableColumns={moduleDef.tableColumns}
        tagFilter={query.tag}
        trashable={moduleDef.trashable}
        trashView={moduleDef.trashView}
        totalPages={totalPages}
      />
    </div>
  );
}
