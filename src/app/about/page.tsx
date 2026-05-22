import Image from "next/image";
import type { Metadata } from "next";

import { PageHero } from "@/components/PageHero";
import { SectionHeader } from "@/components/Sections";
import { buildMetadata } from "@/lib/seo";

export const metadata: Metadata = buildMetadata({
  title: "About Nature Romp Safaris",
  description:
    "Learn about Nature Romp Safaris, the Nairobi-based operator behind Kenya Tanzania Safari Adventure.",
  path: "/about",
  keywords: "Nature Romp Safaris, Kenya Tanzania safari operator, Nairobi safari company",
});

export default function AboutPage() {
  return (
    <main>
      <PageHero title="About Page" />
      <section className="content-page">
        <div className="container split">
          <div>
            <SectionHeader title="Nature Romp Safaris | Who We Are" />
            <p>
              Nature Romp Safaris is a trusted name in travel, with dedicated
              professionals who craft personalized safari itineraries. We help
              guests explore Kenya, Tanzania and East Africa with careful
              planning, reliable operations and local knowledge.
            </p>
            <p>
              Our work is rooted in memorable journeys: wildlife safaris,
              mountain climbing, beach extensions, cultural encounters and
              private travel experiences shaped around each guest.
            </p>
          </div>
          <Image src="/assets/img/vision.jpg" alt="Nature Romp Safaris vision" width={720} height={520} />
        </div>
      </section>
      <section className="section">
        <div className="container split">
          <Image src="/assets/img/mission1.jpg" alt="Kenya Tanzania safari mission" width={720} height={520} />
          <div>
            <SectionHeader title="Our Mission" />
            <p>
              Our mission is to design authentic Kenya Tanzania safari
              adventures that are smooth, safe, memorable and respectful of the
              destinations we visit.
            </p>
            <ul className="info-list">
              <li>Personalized safari planning for families, couples, groups and solo travelers.</li>
              <li>Local expertise across Kenya, Tanzania and wider East Africa.</li>
              <li>Reliable transport, practical route design and responsive guest support.</li>
            </ul>
          </div>
        </div>
      </section>
      <section className="content-page">
        <div className="container split">
          <div>
            <SectionHeader title="Transportation" />
            <p>
              Safari transport is central to comfort and safety. We plan routes
              around practical driving times, park conditions, guest priorities
              and the best wildlife-viewing opportunities.
            </p>
          </div>
          <Image src="/assets/img/transportaion1.jpg" alt="Safari transportation in East Africa" width={720} height={520} />
        </div>
      </section>
    </main>
  );
}
