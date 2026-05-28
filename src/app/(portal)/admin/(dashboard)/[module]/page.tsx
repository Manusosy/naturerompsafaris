import { notFound } from "next/navigation";

import { PageHeader } from "@/components/portal/PortalCards";
import { MediaLibrary } from "@/components/portal/MediaLibrary";
import { ResourceForm } from "@/components/portal/ResourceForm";
import { ResourceTable } from "@/components/portal/ResourceTable";
import { findCollection, getGlobal, getMediaOptions, requirePortalUser } from "@/lib/portal/data";
import { getPortalModule } from "@/lib/portal/modules";

export default async function PortalModulePage({
  params,
  searchParams,
}: {
  params: Promise<{ module: string }>;
  searchParams: Promise<{ page?: string }>;
}) {
  await requirePortalUser();
  const routeParams = await params;
  const query = await searchParams;
  const moduleSlug = routeParams.module;
  const moduleDef = getPortalModule(moduleSlug);
  if (!moduleDef) notFound();
  const page = Math.max(1, Number(query.page ?? "1") || 1);

  if (moduleDef.global) {
    const globalDoc = (await getGlobal(moduleDef.global)) as Record<string, unknown>;
    const mediaOptions = moduleDef.fields.some((field) => field.type === "content")
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

  const pageSize = moduleSlug === "media" ? 24 : 20;
  const result = await findCollection(moduleDef.collection ?? "", pageSize, moduleDef.listWhere, page);
  const totalPages = "totalPages" in result ? result.totalPages : 1;

  if (moduleSlug === "media") {
    return (
      <div className="portal-stack">
        <PageHeader breadcrumb="Dashboard / Media / Media Library" description={moduleDef.description} title={moduleDef.label} />
        <MediaLibrary
          docs={result.docs as Array<Record<string, unknown>>}
          page={page}
          totalPages={totalPages}
        />
      </div>
    );
  }

  return (
    <div className="portal-stack">
      <PageHeader
        actionHref={moduleDef.newLabel ? `${moduleDef.href}/new` : undefined}
        actionLabel={moduleDef.newLabel}
        breadcrumb={`Dashboard / ${moduleDef.label}`}
        description={moduleDef.description}
        title={moduleDef.label}
      />
      <ResourceTable
        collection={moduleDef.collection}
        docs={result.docs as Array<Record<string, unknown>>}
        editModuleSlug={moduleDef.editModuleSlug}
        emptyLabel={moduleDef.emptyLabel}
        moduleSlug={moduleSlug}
        page={page}
        tableColumns={moduleDef.tableColumns}
        trashable={moduleDef.trashable}
        trashView={moduleDef.trashView}
        totalPages={totalPages}
      />
    </div>
  );
}
