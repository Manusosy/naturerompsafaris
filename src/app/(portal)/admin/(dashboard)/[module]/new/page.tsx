import { notFound } from "next/navigation";

import { ArticleEditor } from "@/components/portal/ArticleEditor";
import { CategoryEditor } from "@/components/portal/CategoryEditor";
import { PageHeader } from "@/components/portal/PortalCards";
import { ResourceForm } from "@/components/portal/ResourceForm";
import { TripBuilder } from "@/components/portal/TripBuilder";
import { getMediaOptions, getRelationOptions, requirePortalUser } from "@/lib/portal/data";
import { getPortalModule } from "@/lib/portal/modules";

export default async function NewPortalRecordPage({
  params,
}: {
  params: Promise<{ module: string }>;
}) {
  await requirePortalUser();
  const routeParams = await params;
  const moduleSlug = routeParams.module;
  const moduleDef = getPortalModule(moduleSlug);
  if (!moduleDef || !moduleDef.collection) notFound();

  if (moduleSlug === "posts") {
    const [categories, tags, media] = await Promise.all([
      getRelationOptions("post-categories"),
      getRelationOptions("article-tags"),
      getMediaOptions(),
    ]);
    return <ArticleEditor categories={categories} media={media} tags={tags} />;
  }

  if (moduleSlug === "trips") {
    const [destinations, packages, media, tripOptions] = await Promise.all([
      getRelationOptions("destinations"),
      getRelationOptions("packages"),
      getMediaOptions(),
      getRelationOptions("trips"),
    ]);
    return <TripBuilder destinations={destinations} media={media} packages={packages} tripOptions={tripOptions} />;
  }

  if (moduleSlug === "post-categories") {
    return <CategoryEditor />;
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
      <PageHeader breadcrumb={`Dashboard / ${moduleDef.label} / New`} description={moduleDef.description} title={moduleDef.label} />
      <ResourceForm
        collection={moduleDef.collection}
        fields={moduleDef.fields}
        mediaOptions={mediaOptions}
        moduleHref={moduleDef.href}
        moduleSlug={moduleSlug}
        relationOptions={relationOptions}
        title={moduleDef.newLabel ?? `New ${moduleDef.label}`}
      />
    </div>
  );
}
