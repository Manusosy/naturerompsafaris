import { notFound } from "next/navigation";

import { ArticleEditor } from "@/components/portal/ArticleEditor";
import { CategoryEditor } from "@/components/portal/CategoryEditor";
import { PageHeader } from "@/components/portal/PortalCards";
import { ResourceForm } from "@/components/portal/ResourceForm";
import { TripBuilder } from "@/components/portal/TripBuilder";
import { findDocument, getMediaOptions, getRelationOptions, requirePortalUser } from "@/lib/portal/data";
import { getPortalModule } from "@/lib/portal/modules";

export default async function EditPortalRecordPage({
  params,
}: {
  params: Promise<{ id: string; module: string }>;
}) {
  await requirePortalUser();
  const routeParams = await params;
  const id = routeParams.id;
  const moduleSlug = routeParams.module;
  const moduleDef = getPortalModule(moduleSlug);
  if (!moduleDef || !moduleDef.collection) notFound();

  const document = (await findDocument(moduleDef.collection, id)) as Record<string, unknown>;

  if (moduleSlug === "posts") {
    const [categories, tags, media] = await Promise.all([
      getRelationOptions("post-categories"),
      getRelationOptions("article-tags"),
      getMediaOptions(),
    ]);
    return <ArticleEditor categories={categories} document={document} media={media} tags={tags} />;
  }

  if (moduleSlug === "trips") {
    const [destinations, packages, media, tripOptions] = await Promise.all([
      getRelationOptions("destinations"),
      getRelationOptions("packages"),
      getMediaOptions(),
      getRelationOptions("trips"),
    ]);
    return <TripBuilder destinations={destinations} document={document} media={media} packages={packages} tripOptions={tripOptions} />;
  }

  if (moduleSlug === "post-categories") {
    return <CategoryEditor document={document} />;
  }

  const relationOptions = Object.fromEntries(
    await Promise.all(
      moduleDef.fields
        .filter((field) => field.type === "relationship")
        .map(async (field) => [field.relationTo, await getRelationOptions(field.relationTo)]),
    ),
  );
  const mediaOptions = moduleDef.fields.some((field) => field.type === "content")
    ? await getMediaOptions()
    : [];

  return (
    <div className="portal-stack">
      <PageHeader breadcrumb={`Dashboard / ${moduleDef.label} / Edit`} description={moduleDef.description} title={moduleDef.label} />
      <ResourceForm
        collection={moduleDef.collection}
        document={document}
        fields={moduleDef.fields}
        mediaOptions={mediaOptions}
        moduleHref={moduleDef.href}
        moduleSlug={moduleSlug}
        relationOptions={relationOptions}
        title={`Edit ${moduleDef.label}`}
      />
    </div>
  );
}
