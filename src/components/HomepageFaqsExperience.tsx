"use client";

import { HeartPulse, Info, Mountain, PawPrint, TreePine } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";

type FaqCategory = {
  description: string;
  id: string;
  label: string;
};

type FaqItem = {
  answer: string;
  category: string;
  question: string;
};

const categories: FaqCategory[] = [
  {
    description: "Timing, routes, budgets and how Nature Romp Safaris plans your trip.",
    id: "planning",
    label: "Planning Basics",
  },
  {
    description: "Visas, health notes, packing and practical safari preparation.",
    id: "preparation",
    label: "Safety and Preparation",
  },
  {
    description: "Game drives, vehicles, guides, lodges and day-to-day safari flow.",
    id: "experience",
    label: "Safari Experience",
  },
  {
    description: "Masai Mara, Serengeti, Amboseli, Ngorongoro and route combinations.",
    id: "parks",
    label: "Parks and Routes",
  },
  {
    description: "Local culture, border crossings, Zanzibar and responsible travel.",
    id: "culture",
    label: "Culture and Coast",
  },
];

const categoryIcons = {
  culture: Mountain,
  experience: PawPrint,
  parks: TreePine,
  planning: Info,
  preparation: HeartPulse,
};

const faqs: FaqItem[] = [
  {
    category: "planning",
    question: "How far in advance should I plan a Kenya Tanzania safari adventure?",
    answer:
      "For July to October migration travel, December holidays, and February calving season, Nature Romp Safaris recommends planning six to nine months ahead. For quieter months, three to four months can work, but the best camps, guides, and private 4x4 vehicles are easier to secure early.",
  },
  {
    category: "planning",
    question: "Is a Kenya and Tanzania combined safari better than visiting one country?",
    answer:
      "A combined itinerary is best when you have at least eight to twelve days and want the Masai Mara plus Serengeti, Ngorongoro, Amboseli, Tarangire, or Lake Manyara in one route. If your time is shorter, Nature Romp Safaris may recommend focusing on either Kenya or Tanzania so you spend more time on game drives and less time in transit.",
  },
  {
    category: "planning",
    question: "What budget should I expect for a private Nature Romp safari?",
    answer:
      "Pricing depends on season, accommodation level, park fees, vehicle type, and whether you cross from Kenya into Tanzania. We normally quote after understanding your dates, group size, comfort level, and must-see parks, because a good safari price should match the route rather than force you into a generic package.",
  },
  {
    category: "preparation",
    question: "Do I need visas for both Kenya and Tanzania?",
    answer:
      "Most travelers need to check visa or ETA requirements before arrival, and requirements can change by nationality. If your Kenya Tanzania safari adventure crosses the border, Nature Romp Safaris helps you plan the correct entry points and timing, but you should confirm the current visa rules with official government sources before travel.",
  },
  {
    category: "preparation",
    question: "What should I pack for a Kenya Tanzania safari?",
    answer:
      "Pack neutral-colored layers, a warm fleece for early game drives, sun protection, comfortable shoes, binoculars, camera batteries, any personal medication, and soft luggage if your route includes light aircraft. The Mara, Serengeti, Ngorongoro and Amboseli can all feel cool in the morning and warm by midday.",
  },
  {
    category: "preparation",
    question: "Is safari travel safe for families and first-time visitors?",
    answer:
      "Yes, with the right route and realistic pacing. Nature Romp Safaris uses experienced driver-guides, suitable vehicles, and family-aware lodge choices. We avoid overloading days with long transfers when children or first-time travelers need a more comfortable rhythm.",
  },
  {
    category: "experience",
    question: "What does a normal safari day look like?",
    answer:
      "Most safari days start with an early game drive when wildlife is active, followed by breakfast or a relaxed mid-morning break. Depending on the park and lodge location, you may have an afternoon drive, picnic lunch, sundowner, or full-day exploration. Nature Romp Safaris adjusts pacing around wildlife movement and your energy level.",
  },
  {
    category: "experience",
    question: "Will we have a private vehicle and guide?",
    answer:
      "Most Nature Romp Kenya Tanzania safari adventure routes are private, meaning your guide, vehicle, timings, and stops are shaped around your group. Group joining can be arranged on selected routes, but private safaris give better flexibility for photographers, families, honeymooners, and travelers with specific interests.",
  },
  {
    category: "experience",
    question: "Can I choose lodge, tented camp, or luxury accommodation?",
    answer:
      "Yes. We can build budget, mid-range, luxury, or high-end safari routes. The important decision is not just the room category, but location: staying closer to wildlife areas can reduce transfer time and improve your game-drive experience.",
  },
  {
    category: "parks",
    question: "Which parks are best for a first Kenya Tanzania safari adventure?",
    answer:
      "For a first safari, Masai Mara, Serengeti, Ngorongoro Crater, Amboseli, Tarangire, and Lake Nakuru are strong choices. The best mix depends on your dates: migration months favor Mara and Serengeti, while Amboseli is excellent for elephants and Kilimanjaro views.",
  },
  {
    category: "parks",
    question: "Can Nature Romp Safaris include the Great Migration?",
    answer:
      "Yes, but the migration is seasonal and mobile. River crossings are never guaranteed, so we plan around the most likely wildlife zones for your dates, then choose camps that keep you close to the action instead of adding unnecessary road time.",
  },
  {
    category: "parks",
    question: "How many days do I need for Masai Mara and Serengeti together?",
    answer:
      "A comfortable Masai Mara and Serengeti combination usually needs eight to ten days, especially if you add Ngorongoro or Amboseli. Shorter itineraries are possible, but we will be honest if the route feels rushed or spends too much time moving between parks.",
  },
  {
    category: "culture",
    question: "Can we add cultural visits without making the safari feel staged?",
    answer:
      "Yes. We recommend respectful, well-timed cultural experiences that fit naturally into the route, such as community visits near the Mara, local market stops, or guided experiences arranged through trusted partners. These should add context, not replace wildlife time.",
  },
  {
    category: "culture",
    question: "Can I add Zanzibar or the Kenyan coast after safari?",
    answer:
      "Absolutely. A beach extension is one of the best ways to end a Kenya Tanzania safari adventure. Nature Romp Safaris can connect your safari route to Zanzibar, Diani, Watamu, or Mombasa depending on flight routes, budget, and how relaxed you want the final days to be.",
  },
  {
    category: "culture",
    question: "What makes Nature Romp Safaris different from a generic safari operator?",
    answer:
      "We focus on practical route design, honest advice, local guiding knowledge, and clear communication before you commit. The goal is not to sell the longest itinerary, but to build a Kenya Tanzania safari adventure that fits your dates, comfort level, wildlife priorities, and travel style.",
  },
];

export function HomepageFaqsExperience() {
  const [activeCategory, setActiveCategory] = useState(categories[0].id);
  const activeFaqs = useMemo(
    () => faqs.filter((item) => item.category === activeCategory),
    [activeCategory],
  );

  return (
    <section className="section homepage-faqs homepage-faqs--flash">
      <div className="container">
        <div className="faq-flash-head">
          <h2>Frequently Asked Questions</h2>
          <span aria-hidden="true" />
          <p>Choose a category to quickly find expert answers for your Kenya Tanzania safari adventure.</p>
        </div>

        <div className="faq-category-grid" role="tablist" aria-label="Safari FAQ categories">
          {categories.map((category) => {
            const Icon = categoryIcons[category.id as keyof typeof categoryIcons];
            const isActive = category.id === activeCategory;

            return (
              <button
                aria-selected={isActive}
                className={isActive ? "faq-category-card faq-category-card--active" : "faq-category-card"}
                key={category.id}
                onClick={() => setActiveCategory(category.id)}
                role="tab"
                type="button"
              >
                <Icon size={42} strokeWidth={1.8} />
                <strong>{category.label}</strong>
                <span>{category.description}</span>
              </button>
            );
          })}
        </div>

        <div className="faq-flash-list" role="tabpanel">
          {activeFaqs.map((item) => (
            <details className="faq-flash-item" key={item.question}>
              <summary>
                <span aria-hidden="true">+</span>
                <strong>{item.question}</strong>
              </summary>
              <p>{item.answer}</p>
            </details>
          ))}
        </div>

        <div className="faq-flash-cta">
          <h3>Do you have any other questions?</h3>
          <p>Get in touch with Nature Romp Safaris for a free route consultation.</p>
          <Link href="/contact">Help me plan</Link>
        </div>
      </div>
    </section>
  );
}
