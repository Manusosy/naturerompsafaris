import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";

import { PageHero } from "@/components/PageHero";
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
      <section className="content-page about-page">
        <div className="container about-intro">
          <h2>Nature Romp Safaris | Who We Ar</h2>
          <p>
            Nature Romp Safaris is a leading and trusted name in the travel
            industry, with a team of dedicated professionals who are experts in
            crafting personalized travel itineraries. With years of experience
            and a deep love for travel, our team is committed to delivering
            exceptional service and ensuring every aspect of your journey is
            seamless.
          </p>
          <Link href="/contact" className="btn btn--primary">Read More</Link>
        </div>
      </section>
      <section className="section">
        <div className="container split about-mission">
          <div>
            <h2>Our Mission</h2>
            <p>
              Our mission is to inspire and enable travelers to discover the
              beauty and diversity of the world through exceptional and
              immersive travel experiences. We believe that travel has the power
              to broaden horizons, foster connections, and create life time
              memories.
            </p>
          </div>
          <Image src="/assets/img/mission1.jpg" alt="Kenya Tanzania safari mission" width={720} height={520} />
        </div>
      </section>
      <section className="content-page about-who">
        <div className="container split">
          <Image src="/assets/img/vision.jpg" alt="Nature Romp Safaris team" width={720} height={520} />
          <div>
            <h2>Who We Are?</h2>
            <p>
              Nature Romp Safaris is a leading and trusted name in the travel
              industry, with a team of dedicated professionals who are experts
              in crafting personalized travel itineraries. With years of
              experience and a deep love for travel, our team is committed to
              delivering exceptional service and ensuring every aspect of your
              journey is seamless.
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}
