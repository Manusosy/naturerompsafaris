import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms of Service",
  description: "Tour booking terms and payment conditions for Nature Romp Safaris.",
};

export default function TermsOfServicePage() {
  const sections = [
    { id: "cancellation", label: "1. Cancellation Charges" },
    { id: "payment-terms", label: "2. Payment Terms" },
    { id: "accommodation", label: "3. Accommodation" },
    { id: "issues", label: "4. Issues While on Tour" },
    { id: "seasonal-factors", label: "5. Seasonal Factors" },
    { id: "public-holidays", label: "6. Public Holidays" },
    { id: "wild-animals", label: "7. Wild Animals" },
    { id: "insurance", label: "8. Travel Insurance" },
    { id: "luggage", label: "9. Luggage" },
    { id: "visas", label: "10. Visas & Passports" },
    { id: "photography", label: "11. Photography" },
    { id: "itinerary-changes", label: "12. Itinerary Changes" },
    { id: "guide-changes", label: "13. Guide Changes" },
    { id: "vehicle-changes", label: "14. Vehicle Changes" },
    { id: "cancellation-during", label: "15. Cancellation During Safari" },
  ];

  return (
    <>
      <section className="page-hero">
        <div className="container">
          <h1 className="page-hero__title">Terms of Service</h1>
          <p className="page-hero__desc">Tour Booking Terms & Payment Conditions</p>
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
            <p>Welcome to Nature Romp Safaris Ltd. Please read these terms carefully before booking a safari tour with us.</p>
            <hr style={{ margin: "32px 0", borderColor: "#eae5e3" }} />

            <h3 id="cancellation">1. Safari Tour Cancellation Charges</h3>
            <p>
              Nature Romp safaris Limited booking / cancellation conditions are determined by the fact that once hotel,
              Safari lodge/ camps, local domestic airlines or services are booked on your behalf, we shall incur a
              cancellation fee if we are required to cancel the booking. We try to keep such cancellation charges to a
              minimum and they apply as follows calculated as a percentage of the total price:
            </p>
            <p><strong>Safari invoice cancellation charges for both Kenya & Tanzania Safaris:</strong></p>
            <ul>
              <li>Cancellation up to 60 days prior to commencement of the safari: Zero cancellation charges.</li>
              <li>Cancellation up to 35 days prior to commencement of the safari : 20% cancellation charges.</li>
              <li>Cancellation up to 15 days prior to commencement of the safari : 40% cancellation charges.</li>
              <li>Cancellation less than 15 days or more than 3 days prior to safari start : 60% cancellation charges.</li>
              <li>Cancellation 3 days or less before commencement of safari – Zero refund, 100% cancellation charges apply.</li>
            </ul>
            <p>
              In the event of a cancellation, a 5% administrative fee will be levied to account for transaction charges.
              ** Please note that the refund will be completed within 60 days from the date of official cancellation notification.
            </p>

            <h3 id="payment-terms">2. Payment Terms</h3>
            <p>To confirm your booking, a deposit is needed. The amount depends on your safari type:</p>
            <ul>
              <li>Budget Safari: 15% deposit. Pay the rest on arrival or before the safari starts.</li>
              <li>Mid-Range / Lodge Safari: 30% deposit to secure your accommodations.</li>
              <li>Private Safari: 20% deposit to arrange transport, stays, and entry fees in advance.</li>
              <li>Kenya-Tanzania Safaris: 20% for budget, 30% for mid-range/lodge safaris.</li>
            </ul>

            <h3 id="accommodation">3. Accommodation</h3>
            <p>
              We do not own any hotels or lodges. We'll book the accommodations listed in your itinerary, or offer a
              similar one if unavailable—always with your approval.
            </p>

            <h3 id="issues">4. Issues While on Tour</h3>
            <p>We do our best to provide to you an enjoyable, trouble-free safari tour but occasionally even the best-laid plans can go wrong.</p>
            <p>
              In the event of a problem whilst you are on a safari tour with us, please inform your tour planning manager
              via email or WhatsApp, Lodge Camp Manager if accommodation related and your tour driver / guide immediately.
              This gives us the opportunity to correct the issue on the spot so that it does not spoil your Safari.
              If the matter cannot be resolved immediately, please send details of your complaint to us in writing within
              20 days of your return from your holiday.
            </p>
            <p>
              It is therefore a condition of this contract that you communicate any problem to the authority in question
              whilst on tour. If you fail to follow this simple procedure we cannot accept responsibility as we have been
              deprived of the opportunity to investigate and rectify the problem on site.
            </p>

            <h3 id="seasonal-factors">5. Seasonal Factors and Resort Facilities</h3>
            <p>
              Some factors are not under our control and early and late in the season some tourist facilities may not
              operate. Likewise, swimming pools have to be cleaned and sometimes emptied and maintenance work can affect
              the availability of certain amenities.
            </p>

            <h3 id="public-holidays">6. Public Holidays and Religious Festivals</h3>
            <p>
              Public holidays and religious festivals throughout the year (particularly Ramadan) may have an impact on
              the ambience of a destination and the reliability of shops, banks and other facilities.
            </p>

            <h3 id="wild-animals">7. Wild Animals</h3>
            <p>
              Please be aware that on any African safari, your clients may be taken into close contact with wild animals.
              Attacks by wild animals are rare, but no safari into the African wilderness can guarantee that this will not occur.
            </p>
            <p>
              Neither Nature Romp Safaris, nor its employees, nor its suppliers can be held responsible for any injury or
              incident on the safari. Please note that many safari camps are unfenced and animals are able to wander
              through the camps at all times of the day and night.
            </p>

            <h3 id="insurance">8. Important - Travel Insurance</h3>
            <p>
              It is of importance that each Safari / Tour member in your party has adequate and comprehensive travel
              insurance covering cancellation or curtailment, as well as medical expenses, emergency travel, personal
              accident, personal baggage and money loss.
            </p>
            <p>
              This should be arranged at the time of confirmation and deposit payment to cover you for cancellation from
              the time of booking. Please note that it is your responsibility to take out insurance, with the cost for
              your account, and that Nature Romp Safaris Ltd cannot be liable in any way whatsoever should you fail to do so.
            </p>
            <p>
              If you are coming to East Africa from overseas, we request that you provide us with your insurance provider’s
              name, together with the policy number and the insurance company’s emergency contact telephone number in
              case of any emergency whilst you are traveling.
            </p>

            <h3 id="luggage">9. Luggage</h3>
            <ul>
              <li>Travel light to allow room for everyone’s luggage.</li>
              <li>Group travelers should bring suitcases or backpacks.</li>
            </ul>

            <h3 id="visas">10. Visas & Passports</h3>
            <ul>
              <li>Make sure your passport is valid for at least 6 months.</li>
              <li>Apply for a Kenya ETA online.</li>
              <li>Tanzania visas can be applied online or at entry. A single-entry visa is recommended.</li>
            </ul>

            <h3 id="photography">11. Photography</h3>
            <p>
              Photos taken by our guides during your safari may be used for our marketing—without asking for permission or payment.
            </p>

            <h3 id="itinerary-changes">12. Itinerary Changes</h3>
            <p>
              We might change the itinerary if needed due to unexpected events. All booked destinations will still be covered.
            </p>

            <h3 id="guide-changes">13. Guide Changes</h3>
            <p>
              If your guide cannot continue, we’ll assign another and inform you. For group safaris, changes may happen
              if the group size reduces.
            </p>

            <h3 id="vehicle-changes">14. Safari Vehicle Changes</h3>
            <p>
              We may switch vehicles due to operational needs. You’ll be introduced to a new guide and explained the reason.
            </p>

            <h3 id="cancellation-during">15. Cancellation During Safari</h3>
            <p>
              If you cancel after the safari has started, no refunds will be given. We’ll try to resolve it if the reason is valid.
            </p>
            {/* eslint-enable react/no-unescaped-entities */}

          </div>
        </div>
      </section>
    </>
  );
}
