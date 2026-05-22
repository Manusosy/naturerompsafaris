import Image from "next/image";
import Link from "next/link";

import { EnquiryForm } from "@/components/EnquiryForm";
import { BlogCard, PackageCard } from "@/components/Cards";
import { gallery, packages, posts, serviceCards, testimonials } from "@/content/site";

export function SectionHeader({ title, eyebrow }: { title: string; eyebrow?: string }) {
  return (
    <div className="section-head">
      {eyebrow && <p>{eyebrow}</p>}
      <h2>{title}</h2>
    </div>
  );
}

export function AboutPreview() {
  return (
    <section className="section about-preview">
      <div className="container split">
        <div>
          <SectionHeader title="Nature Romp Safaris | Who We Are" />
          <p>
            Nature Romp Safaris is a trusted East African travel company crafting
            personalized Kenya Tanzania safari adventures, wildlife holidays,
            beach extensions, mountain climbing trips and private safari
            itineraries.
          </p>
          <p>
            Our team focuses on clear communication, reliable transport, local
            expertise and smooth travel planning from Nairobi to the region&apos;s
            most iconic parks.
          </p>
          <Link className="btn btn--outline" href="/about">Read More</Link>
        </div>
        <div className="image-stack">
          <Image src="/assets/img/about.jpg" alt="Nature Romp Safaris team and safari planning" width={720} height={520} />
          <Image src="/assets/img/about-small.webp" alt="Kenya safari vehicle" width={260} height={190} />
        </div>
      </div>
    </section>
  );
}

export function Services() {
  return (
    <section className="section services">
      <div className="container">
        <SectionHeader title="Our Services and Products" />
        <div className="service-grid">
          {serviceCards.map(([title, image]) => (
            <article className="service-card" key={title}>
              <Image src={image} alt={title} width={560} height={390} />
              <div>
                <h3>{title}</h3>
                <p>Starting from $9543</p>
                <Link href="/safari-packages">Explore More</Link>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

export function FeaturedPackages({ limit = 6 }: { limit?: number }) {
  return (
    <section className="section">
      <div className="container">
        <SectionHeader title="Our Featured Packages" />
        <div className="card-grid">
          {packages.slice(0, limit).map((item) => (
            <PackageCard item={item} key={item.slug} />
          ))}
        </div>
      </div>
    </section>
  );
}

export function JeepSafari() {
  return (
    <section className="section jeep">
      <div className="container split">
        <Image src="/assets/img/jeep-safari.jpg" alt="Off-road jeep safari in Kenya and Tanzania" width={700} height={500} />
        <div>
          <SectionHeader title="Why the Off-road Jeep Safari?" />
          <p>
            A 4x4 safari vehicle gives guests better visibility, stronger comfort
            on rugged tracks and access to wildlife areas where ordinary road
            vehicles are limited.
          </p>
          <p>
            For Kenya adventure and Tanzania adventure routes, off-road-ready
            transport helps create a safer, more flexible safari experience.
          </p>
        </div>
      </div>
    </section>
  );
}

export function Testimonials() {
  return (
    <section className="section testimonials">
      <div className="container">
        <SectionHeader eyebrow="Testimonial" title="What Our Clients Say" />
        <div className="testimonial-grid">
          {testimonials.map((item) => (
            <blockquote key={item.name}>
              <Image src="/assets/img/testimonial/review-icon.png" alt="" width={32} height={32} />
              <p>{item.quote}</p>
              <cite>{item.name}</cite>
            </blockquote>
          ))}
        </div>
      </div>
    </section>
  );
}

export function GalleryPreview() {
  return (
    <section className="section gallery-section">
      <div className="container">
        <SectionHeader title="Gallery" />
        <div className="gallery-grid">
          {gallery.map((item) => (
            <Link href="/photo-gallery" className="gallery-item" key={item.src}>
              <Image src={item.src} alt={item.alt} width={420} height={320} />
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}

export function BlogPreview() {
  return (
    <section className="section">
      <div className="container">
        <SectionHeader title="Our Blog" />
        <div className="card-grid">
          {posts.slice(0, 3).map((item) => (
            <BlogCard item={item} key={item.slug} />
          ))}
        </div>
      </div>
    </section>
  );
}

export function ContactBand() {
  return (
    <section className="section contact-band">
      <div className="container split">
        <div>
          <SectionHeader title="We&apos;re Here For You" />
          <p>
            Nature Romp Safaris provides East African wildlife safari packages
            across Kenya, Tanzania, Uganda, Rwanda, Zanzibar and Zambia. Start
            with your preferred dates and our team will shape the route.
          </p>
        </div>
        <EnquiryForm />
      </div>
    </section>
  );
}
