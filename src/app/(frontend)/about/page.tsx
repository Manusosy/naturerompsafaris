import Image from "next/image";
import Link from "next/link";
import {
  Camera,
  CalendarCheck,
  Globe,
  MapPin,
  PawPrint,
  UserCheck,
  Users,
} from "lucide-react";
import type { Metadata } from "next";

import { AboutReviewsSlider } from "@/components/AboutReviewsSlider";
import { PageHero } from "@/components/PageHero";
import { SectionHeader } from "@/components/Sections";
import { JsonLd } from "@/components/JsonLd";
import { site } from "@/content/site";
import { breadcrumbSchema, buildMetadata } from "@/lib/seo";

const whyItems = [
  {
    icon: Globe,
    title: "Authentic Journeys",
    text: "Real local connections and routes that go beyond the typical tourist trails.",
  },
  {
    icon: PawPrint,
    title: "Expert Safari Guides",
    text: "Our Nairobi team works with local guides who know the parks and ground conditions.",
  },
  {
    icon: CalendarCheck,
    title: "Stress-Free Planning",
    text: "Transport, accommodation, and logistics handled carefully for a secure journey.",
  },
  {
    icon: UserCheck,
    title: "Personalized Service",
    text: "We tailor each safari around your interests, pace, comfort level, and budget.",
  },
];

const stats = [
  { icon: Globe, number: "15+", label: "Destinations" },
  { icon: MapPin, number: "20+", label: "Safari Routes" },
  { icon: Camera, number: "12+", label: "Tour Types" },
  { icon: Users, number: "86+", label: "Happy Travelers" },
];

const featureImages = [
  {
    alt: "Elephant herd on the savanna",
    className: "about-features__cell--hero",
    height: 640,
    src: "/assets/img/about/about-elephants.jpg",
    width: 720,
  },
  {
    alt: "Cheetah in the grass",
    className: "",
    height: 320,
    src: "/assets/img/about/about-cheetah.jpg",
    width: 480,
  },
  {
    alt: "Lion resting in the bush",
    className: "",
    height: 320,
    src: "/assets/img/about/about-lion.jpg",
    width: 480,
  },
  {
    alt: "Scenic East Africa landscape",
    className: "about-features__cell--wide",
    height: 320,
    src: "/assets/img/about/about-scenic.jpg",
    width: 960,
  },
  {
    alt: "Zebra on safari",
    className: "",
    height: 280,
    src: "/assets/img/about/about-zebra.jpg",
    width: 480,
  },
  {
    alt: "Birdlife in East Africa",
    className: "",
    height: 280,
    src: "/assets/img/about/about-birds.jpg",
    width: 480,
  },
  {
    alt: "Nature Romp Safaris vehicle on safari",
    className: "",
    height: 280,
    src: "/assets/img/about/about-jeep.jpg",
    width: 480,
  },
];

const googleReviews = [
  {
    avatar: "CO",
    date: "Nov 26, 2024",
    name: "Charles Otieno",
    text: "I initially asked for 3 quotations for my 7-days safari in Kenya covering Masai Mara, Amboseli, Nakuru and Naivasha. Ms Yvonne from Nature Romp Safaris was by far the most patient and outstanding in answering my questions.",
  },
  {
    avatar: "P",
    date: "Mar 9, 2024",
    name: "Paola",
    text: "Great experience, I recommend it.",
  },
  {
    avatar: "G",
    date: "Mar 9, 2024",
    name: "Gayatri Rawat",
    text: "They were so kind and helpful. Really appreciate the care and support.",
  },
  {
    avatar: "AV",
    date: "Feb 2025",
    name: "Ajith Vasudevan",
    text: "We opted for a private tour covering Masai Mara, Nakuru and Amboseli. We instantly felt at home, and our guide Maxwell was excellent with birds, animals and safe driving.",
  },
];

export const metadata: Metadata = buildMetadata({
  title: "Expert Kenya & East Africa Safari Operators",
  description:
    "Meet Nature Romp Safaris, a Nairobi safari company planning tailor-made Kenya and Tanzania safaris, East Africa safari routes, beach extensions, and private wildlife journeys.",
  path: "/about",
  keywords:
    "Nature Romp Safaris, Kenya safari operator, East Africa safari operators, Kenya Tanzania safari adventure, tailor-made Kenya and Tanzania safaris, Nairobi safari company",
  image: "/assets/img/about/about-scenic.jpg",
});

export default function AboutPage() {
  const aboutSchema = {
    "@context": "https://schema.org",
    "@type": "AboutPage",
    name: "About Nature Romp Safaris",
    url: `${site.canonicalUrl}/about`,
    description:
      "Nature Romp Safaris is a Nairobi-based East Africa safari operator planning tailor-made Kenya, Tanzania, Uganda, Rwanda, and Zanzibar journeys.",
    mainEntity: {
      "@type": "TravelAgency",
      name: site.company,
      url: site.canonicalUrl,
      email: site.email,
      telephone: site.phone,
      address: {
        "@type": "PostalAddress",
        streetAddress: "Embassy House, Mezazanine-Harambee Avenue",
        addressLocality: "Nairobi",
        addressCountry: "KE",
      },
      areaServed: ["Kenya", "Tanzania", "Uganda", "Rwanda", "Zanzibar", "East Africa"],
      slogan: "Wild Africa, Your Way.",
    },
  };

  return (
    <main className="about-page">
      <PageHero
        eyebrow="Who we are"
        subtitle="A Nairobi safari company crafting tailor-made journeys across Kenya, Tanzania, and East Africa."
        title="About Nature Romp Safaris"
      />
      <JsonLd
        data={breadcrumbSchema([
          { name: "Home", url: "/" },
          { name: "About Us", url: "/about" },
        ])}
      />
      <JsonLd data={aboutSchema} />

      <section className="section about-intro">
        <div className="container about-intro__grid">
          <div className="about-intro__copy">
            <div className="section-kicker">Our journey</div>
            <h2>Wild Africa, your way.</h2>
            <p>
              Most travelers dream of Africa through sunrise game drives, endless plains,
              the Serengeti horizon, and the first quiet moment when a lion appears in the grass.
              The harder question is where to begin, who to trust, and how to make every day feel
              worth the distance traveled.
            </p>
            <p>That is where Nature Romp Safaris comes in.</p>
            <p>
              We are a professionally established Nairobi safari company creating personalized,
              authentic, and carefully planned African safari experiences. Our work covers tailor-made
              safaris across Kenya, Tanzania, Uganda, Rwanda, and Zanzibar, matching different budgets,
              lodge styles, routes, seasons, and expectations without losing the feeling of being looked after.
            </p>
            <p>
              More than just a tour provider, Nature Romp Safaris guides travelers through
              once-in-a-lifetime African journeys with expertise, attention to detail, and a deep respect
              for wildlife and culture.
            </p>
            <Link className="btn btn--primary" href="/trips">
              View our tours
            </Link>
          </div>
          <figure className="about-intro__figure">
            <Image
              alt="Nature Romp Safaris team preparing a safari vehicle"
              className="about-intro__image"
              height={620}
              priority
              src="/assets/img/about/about-jeep.jpg"
              width={560}
            />
          </figure>
        </div>
      </section>

      <section className="about-features" aria-label="Safari moments from the field">
        <div className="container">
          <div className="about-features__head">
            <div className="section-kicker">From the field</div>
            <h2>East Africa through our lens.</h2>
          </div>
          <div className="about-features__mosaic">
            {featureImages.map((image) => (
              <figure className={`about-features__cell ${image.className}`.trim()} key={image.src}>
                <Image
                  alt={image.alt}
                  className="about-features__image"
                  height={image.height}
                  src={image.src}
                  width={image.width}
                />
              </figure>
            ))}
          </div>
        </div>
      </section>

      <section className="section about-values">
        <div className="container">
          <SectionHeader
            eyebrow="Why travel with us"
            title="We make your safari a story worth telling."
          />
          <div className="about-values__list">
            {whyItems.map((item) => {
              const Icon = item.icon;
              return (
                <article className="about-values__item" key={item.title}>
                  <div className="about-values__icon" aria-hidden="true">
                    <Icon size={22} strokeWidth={1.75} />
                  </div>
                  <div>
                    <h3>{item.title}</h3>
                    <p>{item.text}</p>
                  </div>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      <section className="about-metrics" aria-label="Safari experience highlights">
        <div className="container about-metrics__grid">
          {stats.map((stat) => {
            const Icon = stat.icon;
            return (
              <div className="about-metrics__item" key={stat.label}>
                <Icon size={24} strokeWidth={1.5} />
                <strong>{stat.number}</strong>
                <span>{stat.label}</span>
              </div>
            );
          })}
        </div>
      </section>

      <section className="about-statement-band">
        <div className="container">
          <p>When you travel with us, you do not just see Africa. You feel it.</p>
        </div>
      </section>

      <section className="section about-reviews-clean">
        <div className="container">
          <SectionHeader eyebrow="Google reviews" title="What travelers say about us" />
          <AboutReviewsSlider reviews={googleReviews} />
        </div>
      </section>

      <section className="about-cta-band">
        <div className="container about-cta-band__inner">
          <h2>Ready to plan your safari?</h2>
          <p>
            Share your route ideas, travel dates, and comfort level. We will prepare a practical
            quote-first proposal for your Kenya or Tanzania adventure.
          </p>
          <div className="about-cta-band__actions">
            <Link className="btn btn--primary" href="/contact">
              Request a quote
            </Link>
            <Link className="btn about-cta-band__secondary" href="/trips">
              Browse tours
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
