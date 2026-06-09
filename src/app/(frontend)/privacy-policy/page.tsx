import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: "Learn how Nature Romp Safaris collects, uses, and protects your data.",
};

export default function PrivacyPolicyPage() {
  const sections = [
    { id: "information-collection", label: "1. Information We Collect" },
    { id: "use-of-information", label: "2. How We Use Information" },
    { id: "data-sharing", label: "3. Data Sharing & Disclosure" },
    { id: "data-security", label: "4. Data Security" },
    { id: "user-rights", label: "5. Your Rights & Choices" },
    { id: "changes", label: "6. Changes to this Policy" },
    { id: "contact", label: "7. Contact Us" },
  ];

  return (
    <>
      <section className="page-hero">
        <div className="container">
          <h1 className="page-hero__title">Privacy Policy</h1>
          <p className="page-hero__desc">How we handle and protect your personal information</p>
        </div>
      </section>
      
      <section className="section section--light">
        <div className="container legal-layout">
          <aside className="legal-sidebar">
            {sections.map((section) => (
              <a href={`#${section.id}`} key={section.id}>
                {section.label}
              </a>
            ))}
          </aside>

          <div className="legal-content">
            {/* eslint-disable react/no-unescaped-entities -- legal copy includes quoted terms */}
            <p><strong>Last Updated: {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</strong></p>
            <p>Nature Romp Safaris Ltd ("we," "us," or "our") is committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you visit our website or book a safari tour with us.</p>
            <p>Please read this privacy policy carefully. If you do not agree with the terms of this privacy policy, please do not access the site.</p>
            <hr style={{ margin: "32px 0", borderColor: "#eae5e3" }} />

            <h3 id="information-collection">1. Information We Collect</h3>
            <p>Under the General Data Protection Regulation (GDPR) and other applicable data protection laws, we are a data controller of your personal data. We may collect and process the following information about you:</p>
            <ul>
              <li><strong>Contact & Identity Data:</strong> Your full name, email address, phone number, and nationality.</li>
              <li><strong>Travel & Booking Data:</strong> Safari destinations, travel dates, trip types, budget preferences, accommodation preferences, and passenger details (number of adults/children/infants).</li>
              <li><strong>Communication Data:</strong> Additional comments, dietary requirements, and medical information voluntarily provided to ensure your safety and comfort during the safari.</li>
              <li><strong>Technical Data:</strong> IP address, browser type, operating system, and tracking data collected via cookies when you use our website.</li>
            </ul>

            <h3 id="use-of-information">2. How We Use Your Information</h3>
            <p>We will only use your personal data when the law allows us to. Most commonly, we will use your data in the following circumstances:</p>
            <ul>
              <li><strong>Contract Performance:</strong> To process your enquiry, manage your booking, and provide the safari services you requested.</li>
              <li><strong>Legitimate Interests:</strong> To improve our website, services, and to send you relevant information about your trip or similar services (you may opt out at any time).</li>
              <li><strong>Legal Obligations:</strong> To comply with legal and regulatory requirements (e.g., tax records, customs, or park authorities).</li>
              <li><strong>Consent:</strong> Where you have explicitly given us consent to process your data for specific purposes (e.g., marketing newsletters).</li>
            </ul>

            <h3 id="data-sharing">3. Data Sharing & Disclosure</h3>
            <p>To provide our services, we may need to share your personal data with third parties, including:</p>
            <ul>
              <li><strong>Service Providers:</strong> Hotels, lodges, airlines, transport operators, and local guides necessary to execute your safari itinerary.</li>
              <li><strong>Regulatory Bodies:</strong> Kenya Wildlife Service (KWS), Tanzania National Parks Authority (TANAPA), border control, and other government authorities as required by law.</li>
              <li><strong>IT & System Administration:</strong> Third-party providers hosting our website, managing email communications, or processing payments securely.</li>
            </ul>
            <p>We require all third parties to respect the security of your personal data and to treat it in accordance with the law.</p>

            <h3 id="data-retention">4. Data Retention</h3>
            <p>We will only retain your personal data for as long as necessary to fulfill the purposes we collected it for, including for the purposes of satisfying any legal, accounting, or reporting requirements. For tax purposes, the law requires us to keep basic information about our customers for a specific number of years after they cease being customers.</p>

            <h3 id="data-security">5. Data Security</h3>
            <p>We have put in place appropriate security measures to prevent your personal data from being accidentally lost, used, or accessed in an unauthorized way, altered, or disclosed. Access to your personal data is limited to employees and contractors who have a business need to know and are subject to a duty of confidentiality.</p>

            <h3 id="user-rights">6. Your Data Protection Rights (GDPR)</h3>
            <p>If you are a resident of the European Economic Area (EEA) or UK, you have the following data protection rights:</p>
            <ul>
              <li><strong>Right to Access:</strong> You can request copies of your personal data.</li>
              <li><strong>Right to Rectification:</strong> You can request that we correct any information you believe is inaccurate.</li>
              <li><strong>Right to Erasure:</strong> You can request that we erase your personal data, under certain conditions.</li>
              <li><strong>Right to Restrict Processing:</strong> You can request that we restrict the processing of your personal data.</li>
              <li><strong>Right to Object:</strong> You can object to our processing of your personal data.</li>
              <li><strong>Right to Data Portability:</strong> You can request that we transfer the data we have collected to another organization, or directly to you.</li>
            </ul>
            <p>If you make a request, we have one month to respond to you. Please contact us to exercise any of these rights.</p>

            <h3 id="changes">7. Changes to this Policy</h3>
            <p>We may update this Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy on this page and updating the "Last Updated" date.</p>

            <h3 id="contact">8. Contact Us & Complaints</h3>
            <p>If you have any questions about this Privacy Policy or wish to exercise your data protection rights, please contact our Data Protection Officer at:</p>
            <p>
              Nature Romp Safaris Ltd<br />
              Nairobi, Kenya<br />
              Email: info@naturerompsafaris.com
            </p>
            <p>You also have the right to make a complaint at any time to the Information Commissioner's Office (ICO) or your local data protection supervisory authority.</p>
            {/* eslint-enable react/no-unescaped-entities */}

          </div>
        </div>
      </section>
    </>
  );
}
