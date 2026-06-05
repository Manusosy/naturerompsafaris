import Image from "next/image";
import Link from "next/link";
import {
  Camera,
  CalendarCheck,
  Compass,
  Globe,
  MapPin,
  PawPrint,
  UserCheck,
  Users,
} from "lucide-react";
import type { Metadata } from "next";

import { AboutPageMotion } from "@/components/AboutPageMotion";
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
  { icon: MapPin, number: "20+", label: "Amazing Tours" },
  { icon: Camera, number: "12+", label: "Tour Types" },
  { icon: Users, number: "86+", label: "Happy Customers" },
];

const googleReviews = [
  {
    avatar: "CO",
    date: "2024.11.26.",
    name: "Charles Otieno",
    text: "I initially asked for 3 quotations for my 7-days safari in Kenya covering Masai Mara, Amboseli, Nakuru and Naivasha. Ms Yvonne from Nature Romp Safaris was by far the most patient and outstanding in answering my questions.",
  },
  {
    avatar: "P",
    date: "2024.03.09.",
    name: "Paola",
    text: "Great experience, I recommend it.",
  },
  {
    avatar: "G",
    date: "2024.03.09.",
    name: "Gayatri Rawat",
    text: "They were so kind and helpful. Really appreciate the care and support.",
  },
  {
    avatar: "AV",
    date: "2025.02.",
    name: "Ajith Vasudevan",
    text: "We opted for a private tour covering Masai Mara, Nakuru and Amboseli. We instantly felt at home, and our guide Maxwell was excellent with birds, animals and safe driving.",
  },
];

const reviewsDouble = [...googleReviews, ...googleReviews, ...googleReviews, ...googleReviews];

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
    <main className="about-page-redesign">
      <AboutPageMotion />
      <JsonLd data={breadcrumbSchema([
        { name: "Home", url: "/" },
        { name: "About Us", url: "/about" },
      ])} />
      <JsonLd data={aboutSchema} />

      {/* Hero Section */}
      <section className="about-hero" data-animate="hero">
        <Image
          alt="East Africa safari landscape with wildlife"
          className="about-hero__image"
          fill
          priority
          sizes="100vw"
          src="/assets/img/about/about-lion.jpg"
        />
        <div className="about-hero__overlay" />
        <div className="container about-hero__content">
          <h1>About Us</h1>
        </div>
      </section>

      {/* Our Journey Section */}
      <section className="about-journey-section">
        <div className="container about-journey-grid">
          <div className="about-journey-content">
            <span className="about-kicker">Who We Are</span>
            <h2>Our Journey</h2>
            <div className="about-journey-text">
              <p>
                Most travelers dream of Africa through sunrise game drives, endless plains,
                the Serengeti horizon, and the first quiet moment when a lion appears in the grass.
                The harder question is where to begin, who to trust, and how to make every day feel
                worth the distance traveled.
              </p>
              <p>
                That is where Nature Romp Safaris comes in.
              </p>
              <p>
                We are a professionally established Nairobi safari company creating personalized,
                authentic, and carefully planned African safari experiences. Our work covers tailor-made
                safaris across Kenya, Tanzania, Uganda, Rwanda, and Zanzibar, matching different budgets,
                lodge styles, routes, seasons, and expectations without losing the feeling of being looked after.
              </p>
              <p>
                More than just a tour provider, Nature Romp Safaris guides travelers through
                once-in-a-lifetime African journeys with expertise, attention to detail, and a deep respect
                for wildlife and culture. Our local safari experts understand hidden gems, migration timing,
                road realities, and carefully selected lodges to ensure every traveler feels at home in the
                heart of the wild.
              </p>
              <p>
                When you travel with us, you do not just see Africa. You feel it.
              </p>
            </div>
            <Link href="/trips" className="btn--primary about-btn">
              View Our Tours
            </Link>
          </div>
          <figure className="about-journey-media">
            <Image
              alt="Nature Romp Safaris team and vehicles"
              height={500}
              width={600}
              src="/assets/img/about/about-jeep.jpg"
              className="about-journey-img"
            />
          </figure>
        </div>
      </section>

      {/* Why Travel With Us Section */}
      <section className="about-why-section">
        <div className="container">
          <div className="about-section-header">
            <span className="about-kicker about-kicker--center">Why Travel With Us</span>
            <h2>We Make Your Safari a Story Worth Telling.</h2>
          </div>
          <div className="about-why-grid">
            {whyItems.map((item) => {
              const Icon = item.icon;
              return (
                <div className="about-why-card" key={item.title}>
                  <div className="about-why-icon">
                    <Icon size={40} strokeWidth={1.5} />
                  </div>
                  <h3>{item.title}</h3>
                  <p>{item.text}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="about-stats-section">
        <Image
          alt="Gazelles in the wild"
          fill
          src="/assets/img/about/about-scenic.jpg"
          className="about-stats-bg"
        />
        <div className="about-stats-overlay" />
        <div className="container about-stats-grid">
          {stats.map((stat, i) => {
            const Icon = stat.icon;
            return (
              <div className="about-stat-item" key={i}>
                <Icon size={48} strokeWidth={1} />
                <strong>{stat.number}</strong>
                <span>{stat.label}</span>
              </div>
            );
          })}
        </div>
      </section>

      {/* Customer Reviews Section */}
      <section className="about-reviews-section">
        <div className="container">
          <div className="about-section-header">
            <span className="about-kicker about-kicker--center">Testimonials</span>
            <h2>Our Customer Reviews</h2>
          </div>
          <div className="about-review-track-container">
            <div className="about-review-track">
              {reviewsDouble.map((review, idx) => (
                <article className="about-review-card-modern" key={`${review.name}-${idx}`}>
                  <div className="about-review-modern-top">
                    <div className="about-review-avatar-modern">{review.avatar}</div>
                    <div className="about-review-meta">
                      <h4>{review.name}</h4>
                      <span>{review.date}</span>
                    </div>
                    <img src="https://upload.wikimedia.org/wikipedia/commons/c/c1/Google_%22G%22_logo.svg" alt="Google" className="about-review-google-icon" />
                  </div>
                  <div className="about-review-stars">
                    ★★★★★
                  </div>
                  <p>{review.text}</p>
                  <Link href="#" className="about-review-read-more">Read more</Link>
                </article>
              ))}
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
