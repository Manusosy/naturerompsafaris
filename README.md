# Nature Romp Safaris

Nature Romp Safaris is a full-stack web application built for a tour and safari company. It provides a dynamic frontend for users to explore destinations, packages, and trips, along with a robust backend powered by Payload CMS for content management and bookings.

## 🚀 Tech Stack

- **Framework:** [Next.js](https://nextjs.org/) (App Router)
- **CMS:** [Payload CMS 3](https://payloadcms.com/)
- **Database:** PostgreSQL (via `@payloadcms/db-postgres`)
- **Styling:** [Tailwind CSS v4](https://tailwindcss.com/)
- **Animations:** [GSAP](https://gsap.com/)
- **Storage:** Vercel Blob Storage
- **Emails:** Resend / Nodemailer

## ✨ Key Features

- **Dynamic Content Management:** Fully integrated Payload CMS to manage Accommodations, Destinations, Itineraries, Packages, Trips, Testimonials, and FAQs.
- **Booking & Enquiries Engine:** Built-in forms and data collection for user enquiries and trip bookings.
- **User Portal:** Dedicated portal features with sign-up verifications.
- **Media & Gallery:** Centralized media management with Vercel Blob integration.
- **Blog & Articles:** Complete post management with categories and tags.
- **Custom Synchronization Scripts:** Scripts for syncing various schema elements and migrating data.

## 🛠️ Getting Started

### Prerequisites

- Node.js >= 20
- A running PostgreSQL database instance

### Installation

1. **Clone the repository:**
   ```bash
   git clone <repository-url>
   cd nature-romp-safaris
   ```

2. **Install dependencies:**
   ```bash
   npm install
   # or
   yarn install
   # or
   pnpm install
   ```

3. **Environment Setup:**
   Copy the example environment file and configure it with your credentials:
   ```bash
   cp .env.example .env.local
   ```
   *Make sure to provide your `DATABASE_URL`, Payload Secret, and Vercel Blob tokens in the `.env.local` file.*

4. **Run the development server:**
   ```bash
   npm run dev
   ```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the frontend. 
The Payload CMS admin panel is available at [http://localhost:3000/cms-admin](http://localhost:3000/cms-admin).

## 📜 Scripts

- `npm run dev`: Starts the Next.js and Payload CMS development server.
- `npm run build`: Builds the application for production.
- `npm run start`: Starts the production server.
- `npm run db:sync-*`: Various scripts to sync database schemas (e.g., accommodations, trips, gallery).
- `npm run test`: Runs the Vitest test suite.
- `npm run lint`: Lints the codebase using ESLint.

## ☁️ Deployment

This project is optimized for deployment on [Vercel](https://vercel.com/). Ensure that your environment variables (Database, Vercel Blob, Resend) are correctly configured in your deployment platform.
