import { notFound } from "next/navigation";

import { AccommodationWizard } from "@/components/portal/AccommodationWizard";
import { DestinationWizard } from "@/components/portal/DestinationWizard";
import { PackageWizard } from "@/components/portal/PackageWizard";
import { ArticleEditor } from "@/components/portal/ArticleEditor";
import { CategoryEditor } from "@/components/portal/CategoryEditor";
import { PageHeader } from "@/components/portal/PortalCards";
import { ResourceForm } from "@/components/portal/ResourceForm";
import { TripWizard } from "@/components/portal/TripWizard";
import { getMediaOptions, getRelationOptions, getTripWizardRelations, requirePortalUser } from "@/lib/portal/data";
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
  if (moduleSlug === "enquiries" || moduleSlug === "bookings") notFound();

  if (moduleSlug === "accommodations") {
    const media = await getMediaOptions();
    return <AccommodationWizard media={media} />;
  }

  if (moduleSlug === "packages") {
    const [media, destinations, itineraries] = await Promise.all([
      getMediaOptions(),
      getRelationOptions("destinations"),
      getRelationOptions("itineraries"),
    ]);
    return <PackageWizard destinations={destinations} itineraries={itineraries} media={media} />;
  }

  if (moduleSlug === "destinations") {
    const media = await getMediaOptions();
    return <DestinationWizard media={media} />;
  }

  if (moduleSlug === "posts") {
    const [categories, tags, media] = await Promise.all([
      getRelationOptions("post-categories"),
      getRelationOptions("article-tags"),
      getMediaOptions(),
    ]);
    return <ArticleEditor categories={categories} media={media} tags={tags} />;
  }

  if (moduleSlug === "trips") {
    const [relations, media] = await Promise.all([
      getTripWizardRelations(),
      getMediaOptions(),
    ]);
    return (
      <TripWizard
        destinations={relations.destinations}
        itineraries={relations.itineraries}
        media={media}
        packages={relations.packages}
        trips={relations.trips}
      />
    );
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
