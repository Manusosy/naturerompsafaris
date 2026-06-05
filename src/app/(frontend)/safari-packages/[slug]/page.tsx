import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";
import { Clock, MapPin, Compass, Sparkles, CheckCircle2, ChevronRight } from "lucide-react";
import { getPayload } from "payload";
import configPromise from "@payload-config";

import { EnquiryForm } from "@/components/EnquiryForm";
import { JsonLd } from "@/components/JsonLd";
import { PackageEnhancementsView } from "@/components/PackageEnhancements";
import { formatPackageDestinations } from "@/lib/cms-relations";
import { getPackageEnhancements } from "@/lib/portal-content";
import { site } from "@/content/site";
import { breadcrumbSchema, buildMetadata } from "@/lib/seo";
import { getImageUrl, getMediaAlt } from "@/components/Cards";

type Props = { params: Promise<{ slug: string }> };

export async function generateStaticParams() {
  const payload = await getPayload({ config: configPromise });
  const result = await payload.find({
    collection: "packages",
    limit: 100,
    depth: 0,
    overrideAccess: true,
  });
  return result.docs.map((doc) => ({ slug: doc.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const payload = await getPayload({ config: configPromise });
  const result = await payload.find({
    collection: "packages",
    where: { slug: { equals: slug } },
    depth: 1,
    overrideAccess: true,
  });
  const item = result.docs[0];
  if (!item) return {};
  return buildMetadata({
    title: item.title,
    description: item.excerpt,
    path: `/safari-packages/${item.slug}`,
    keywords: `${item.title}, ${item.category}, Kenya Tanzania safari adventure`,
    image: getImageUrl(item.image),
  });
}

export default async function PackageDetailPage({ params }: Props) {
  const { slug } = await params;
  const payload = await getPayload({ config: configPromise });
  const result = await payload.find({
    collection: "packages",
    where: { slug: { equals: slug } },
    depth: 1,
    overrideAccess: true,
  });
  const item = result.docs[0];
  if (!item) notFound();

  const destinationsLabel = formatPackageDestinations(item);

  const schema = {
    "@context": "https://schema.org",
    "@type": "TouristTrip",
    name: item.title,
    description: item.excerpt,
    provider: { "@type": "TravelAgency", name: site.company },
    touristType: ["Family travelers", "Private safari guests", "Wildlife travelers"],
    itinerary: destinationsLabel,
  };

  const enhancements = await getPackageEnhancements(slug);
  const imageSrc = getImageUrl(item.image);
  const imageAlt = getMediaAlt(item.image, item.title);

  return (
    <main className="bg-gray-50/50 min-h-screen pb-16">
      <JsonLd data={schema} />
      <JsonLd data={breadcrumbSchema([
        { name: "Home", url: "/" },
        { name: "Safari Packages", url: "/safari-packages" },
        { name: item.title, url: `/safari-packages/${item.slug}` },
      ])} />

      {/* Hero Section */}
      <div className="relative h-[450px] md:h-[550px] w-full overflow-hidden">
        <Image
          src={imageSrc}
          alt={imageAlt}
          fill
          priority
          className="object-cover object-center scale-105"
          unoptimized
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
        <div className="absolute inset-0 flex flex-col justify-end">
          <div className="container mx-auto px-4 md:px-6 pb-12">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-primary px-4 py-1.5 text-xs font-bold text-white uppercase tracking-wider mb-4 shadow">
              <Sparkles size={12} /> {item.category}
            </span>
            <h1 className="text-3xl md:text-5xl font-black text-white leading-tight max-w-4xl tracking-tight drop-shadow-sm">
              {item.title}
            </h1>
            <p className="mt-4 text-base md:text-lg text-gray-200/90 max-w-2xl font-medium leading-relaxed">
              {item.excerpt}
            </p>
          </div>
        </div>
      </div>

      {/* Navigation Breadcrumb (Subtle overlay or standard line) */}
      <div className="bg-white border-b border-gray-100">
        <div className="container mx-auto px-4 md:px-6 py-4 flex items-center gap-2 text-xs font-medium text-gray-500">
          <Link href="/" className="hover:text-primary transition-colors">Home</Link>
          <ChevronRight size={12} />
          <Link href="/safari-packages" className="hover:text-primary transition-colors">Packages</Link>
          <ChevronRight size={12} />
          <span className="text-gray-900 truncate max-w-[200px] md:max-w-sm">{item.title}</span>
        </div>
      </div>

      {/* Main Container */}
      <section className="mt-10">
        <div className="container mx-auto px-4 md:px-6 grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">

          {/* Left Column: Premium Content Blocks */}
          <div className="lg:col-span-2 space-y-8">

            {/* Quick Fact Grid */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
              <div className="flex items-center gap-3.5">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <Clock size={20} />
                </div>
                <div>
                  <span className="block text-2xs text-gray-400 font-bold uppercase tracking-wider">Duration</span>
                  <span className="text-sm font-bold text-gray-800">{item.duration}</span>
                </div>
              </div>

              <div className="flex items-center gap-3.5 col-span-1 md:col-span-2">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <MapPin size={20} />
                </div>
                <div>
                  <span className="block text-2xs text-gray-400 font-bold uppercase tracking-wider">Destinations</span>
                  <span className="text-sm font-bold text-gray-800 line-clamp-1">{destinationsLabel}</span>
                </div>
              </div>
            </div>

            {/* Content Overview */}
            <div className="bg-white p-8 rounded-2xl border border-gray-100 shadow-sm space-y-6">
              <h2 className="text-2xl font-black text-gray-900 border-l-4 border-primary pl-4">
                Safari Overview
              </h2>
              <div className="prose max-w-none text-gray-600 leading-relaxed text-base space-y-4 font-medium">
                <p>
                  Embark on an outstanding adventure curated to give you premium exposure to East Africa&apos;s raw wildlife reserves. Nature Romp Safaris specializes in custom-made, immersive travel solutions, bringing you close to legendary natural spectacles, spectacular bird sanctuaries, and historic plains.
                </p>
                <p>
                  This route covers <strong>{destinationsLabel}</strong> under a highly optimized scheduling plan. Game drives are private and flexible, ensuring photographers, families, and solo explorers secure their perfect sights in complete comfort.
                </p>
              </div>

              {/* Bullet Quick Facts */}
              <div className="mt-8 bg-gray-50 rounded-xl p-6 border border-gray-100">
                <h3 className="text-sm font-extrabold text-gray-800 uppercase tracking-wider mb-4">Highlights & Inclusions</h3>
                <ul className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <li className="flex items-start gap-2.5 text-sm text-gray-600">
                    <CheckCircle2 size={16} className="text-primary shrink-0 mt-0.5" />
                    <span>Best For: Wildlife, Photography, Scenic landscapes</span>
                  </li>
                  <li className="flex items-start gap-2.5 text-sm text-gray-600">
                    <CheckCircle2 size={16} className="text-primary shrink-0 mt-0.5" />
                    <span>Transport: Custom-built 4x4 open-roof safari landcruiser/jeep</span>
                  </li>
                  <li className="flex items-start gap-2.5 text-sm text-gray-600">
                    <CheckCircle2 size={16} className="text-primary shrink-0 mt-0.5" />
                    <span>Pacing: Relaxed & custom-adjusted with expert guides</span>
                  </li>
                  <li className="flex items-start gap-2.5 text-sm text-gray-600">
                    <CheckCircle2 size={16} className="text-primary shrink-0 mt-0.5" />
                    <span>Support: Fully vetted team with emergency radio systems</span>
                  </li>
                </ul>
              </div>
            </div>

            {/* Direct Answers Section */}
            <div className="bg-white p-8 rounded-2xl border border-gray-100 shadow-sm space-y-6">
              <h2 className="text-2xl font-black text-gray-900 border-l-4 border-primary pl-4">
                Frequently Asked Questions
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-1 gap-6 divide-y divide-gray-100">
                <div className="pt-0 pb-4">
                  <h3 className="text-base font-extrabold text-gray-900 flex items-center gap-2 mb-2">
                    <Compass size={16} className="text-primary" /> How many days do you need?
                  </h3>
                  <p className="text-sm text-gray-600 leading-relaxed font-medium pl-6">
                    This route is designed around {item.duration}, with pacing adjusted for travel season, group style and accommodation preference.
                  </p>
                </div>

                <div className="pt-6 pb-4">
                  <h3 className="text-base font-extrabold text-gray-900 flex items-center gap-2 mb-2">
                    <Compass size={16} className="text-primary" /> Can this be private or family-friendly?
                  </h3>
                  <p className="text-sm text-gray-600 leading-relaxed font-medium pl-6">
                    Yes. Nature Romp Safaris can adapt this package for private, family, budget, mid-range or comfort-focused travel. We offer child car seat mounts and custom meal pacing for family safaris.
                  </p>
                </div>

                <div className="pt-6 pb-0">
                  <h3 className="text-base font-extrabold text-gray-900 flex items-center gap-2 mb-2">
                    <Compass size={16} className="text-primary" /> Can it connect with Tanzania?
                  </h3>
                  <p className="text-sm text-gray-600 leading-relaxed font-medium pl-6">
                    Kenya routes can be extended into Tanzania for Serengeti, Ngorongoro and broader Kenya Tanzania safari adventure itineraries. Please check our combined package options or request custom adjustments in the booking form.
                  </p>
                </div>
              </div>
            </div>

            {/* Accommodations and Enhancements (Dynamic) */}
            <div className="space-y-6">
              <PackageEnhancementsView {...enhancements} />
            </div>

          </div>

          {/* Right Column: Premium Inquiry Card (Sticky) */}
          <div className="lg:sticky lg:top-8 bg-white p-6 rounded-2xl border border-gray-100 shadow-md">
            <div className="mb-6 pb-4 border-b border-gray-50">
              <span className="block text-2xs font-bold text-gray-400 uppercase tracking-widest mb-1">Tailored Inquiry</span>
              <h3 className="text-lg font-black text-gray-900">Request Custom Quote</h3>
              <p className="text-xs text-gray-500 mt-1 leading-relaxed">
                Contact our expert safari coordinators to secure pricing, dates, and personalized customization.
              </p>
            </div>
            <EnquiryForm subject={item.title} />
          </div>

        </div>
      </section>
    </main>
  );
}
