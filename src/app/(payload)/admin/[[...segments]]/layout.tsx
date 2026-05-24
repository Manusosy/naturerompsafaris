import configPromise from "@payload-config";
import { handleServerFunctions, RootLayout } from "@payloadcms/next/layouts";
import type { ServerFunctionClient } from "payload";
import { importMap } from "../importMap.js";

async function serverFunction(args: Parameters<ServerFunctionClient>[0]) {
  "use server";

  return handleServerFunctions({
    ...args,
    config: configPromise,
    importMap,
  });
}

export default function PayloadLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <RootLayout
      config={configPromise}
      importMap={importMap}
      serverFunction={serverFunction as ServerFunctionClient}
    >
      {children}
    </RootLayout>
  );
}
