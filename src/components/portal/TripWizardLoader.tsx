"use client";

import dynamic from "next/dynamic";
import type { ComponentProps } from "react";

import type { TripWizard } from "@/components/portal/TripWizard";

const TripWizardClient = dynamic(
  () => import("@/components/portal/TripWizard").then((mod) => mod.TripWizard),
  {
    loading: () => (
      <div className="acc-wizard acc-wizard--wide" style={{ padding: "48px 24px", textAlign: "center" }}>
        Loading trip editor…
      </div>
    ),
    ssr: false,
  },
);

export function TripWizardLoader(props: ComponentProps<typeof TripWizard>) {
  return <TripWizardClient {...props} />;
}
