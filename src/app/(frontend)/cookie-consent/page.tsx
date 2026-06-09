import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Cookie Policy",
  description: "Learn how Nature Romp Safaris uses cookies and similar technologies.",
};

export default function CookiePolicyPage() {
  const sections = [
    { id: "what-are-cookies", label: "1. What Are Cookies" },
    { id: "how-we-use", label: "2. How We Use Cookies" },
    { id: "types-of-cookies", label: "3. Types of Cookies We Use" },
    { id: "third-party", label: "4. Third-Party Cookies" },
    { id: "manage-cookies", label: "5. Managing Cookies" },
    { id: "changes", label: "6. Changes to This Policy" },
    { id: "contact", label: "7. Contact Us" },
  ];

  return (
    <>
      <section className="page-hero">
        <div className="container">
          <h1 className="page-hero__title">Cookie Policy</h1>
          <p className="page-hero__desc">Information about how we use cookies and tracking technologies</p>
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
            <p>Nature Romp Safaris Ltd ("we," "us," or "our") uses cookies and similar tracking technologies on our website. This Cookie Policy explains what these technologies are, why we use them, and your rights to control our use of them.</p>
            <hr style={{ margin: "32px 0", borderColor: "#eae5e3" }} />

            <h3 id="what-are-cookies">1. What Are Cookies?</h3>
            <p>Cookies are small data files that are placed on your computer or mobile device when you visit a website. Cookies are widely used by website owners in order to make their websites work, or to work more efficiently, as well as to provide reporting information.</p>
            <p>Cookies set by the website owner (in this case, Nature Romp Safaris) are called "first-party cookies." Cookies set by parties other than the website owner are called "third-party cookies."</p>

            <h3 id="how-we-use">2. How We Use Cookies</h3>
            <p>We use first-party and third-party cookies for several reasons. Some cookies are required for technical reasons in order for our website to operate, and we refer to these as "essential" or "strictly necessary" cookies. Other cookies also enable us to track and target the interests of our users to enhance the experience on our website. Third parties serve cookies through our website for advertising, analytics, and other purposes.</p>

            <h3 id="types-of-cookies">3. Types of Cookies We Use</h3>
            <p>The specific types of first and third-party cookies served through our website and the purposes they perform include:</p>
            <ul>
              <li><strong>Essential Cookies:</strong> These cookies are strictly necessary to provide you with services available through our website and to use some of its features, such as access to secure areas.</li>
              <li><strong>Performance and Functionality Cookies:</strong> These cookies are used to enhance the performance and functionality of our website but are non-essential to their use. However, without these cookies, certain functionality may become unavailable.</li>
              <li><strong>Analytics and Customization Cookies:</strong> These cookies collect information that is used either in aggregate form to help us understand how our website is being used or how effective our marketing campaigns are, or to help us customize our website for you.</li>
              <li><strong>Advertising Cookies:</strong> These cookies are used to make advertising messages more relevant to you. They perform functions like preventing the same ad from continuously reappearing, ensuring that ads are properly displayed for advertisers, and in some cases selecting advertisements that are based on your interests.</li>
            </ul>

            <h3 id="third-party">4. Third-Party Cookies</h3>
            <p>In addition to our own cookies, we may also use various third-party cookies to report usage statistics of the website, deliver advertisements on and through the website, and so on. These third parties may use cookies alone or in conjunction with web beacons or other tracking technologies to collect information about you when you use our website.</p>

            <h3 id="manage-cookies">5. Managing Cookies</h3>
            <p>You have the right to decide whether to accept or reject cookies. You can exercise your cookie rights by setting your preferences in the Cookie Consent Manager. The Cookie Consent Manager allows you to select which categories of cookies you accept or reject. Essential cookies cannot be rejected as they are strictly necessary to provide you with services.</p>
            <p>You can also set or amend your web browser controls to accept or refuse cookies. If you choose to reject cookies, you may still use our website though your access to some functionality and areas of our website may be restricted.</p>

            <h3 id="changes">6. Changes to This Policy</h3>
            <p>We may update this Cookie Policy from time to time in order to reflect, for example, changes to the cookies we use or for other operational, legal, or regulatory reasons. Please therefore re-visit this Cookie Policy regularly to stay informed about our use of cookies and related technologies.</p>

            <h3 id="contact">7. Contact Us</h3>
            <p>If you have any questions about our use of cookies or other technologies, please contact us at:</p>
            <p>
              Nature Romp Safaris Ltd<br />
              Nairobi, Kenya<br />
              Email: info@naturerompsafaris.com
            </p>
            {/* eslint-enable react/no-unescaped-entities */}

          </div>
        </div>
      </section>
    </>
  );
}
