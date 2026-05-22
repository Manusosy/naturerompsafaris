import configPromise from "@payload-config";
import { handleServerFunctions, RootLayout } from "@payloadcms/next/layouts";
import type { ServerFunctionClient } from "payload";

const importMap = {};

export default function PayloadLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <RootLayout
      config={configPromise}
      importMap={importMap}
      serverFunction={handleServerFunctions as ServerFunctionClient}
    >
      {children}
    </RootLayout>
  );
}
