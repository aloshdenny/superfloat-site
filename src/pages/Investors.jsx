import { useState } from "react";
import { scrollToSection } from "../smoothScroll";
import "./Home.css";

const CONTACT = "alosh@superfloat.si";

const SHARED = [
  { title: "Readiness and budget plan", detail: "The N2 test chip, the 800 mm² production die, year-1 unit costs and the volume plan to 2032." },
  { title: "Sign-off evidence", detail: "The three 130 nm chips: DRC, LVS and antenna reports, timing across nine corners, post-layout power." },
  { title: "Measured 2 nm results", detail: "Processing elements on the GT2N predictive PDK: compute per watt, per mm², energy per MAC, top clock." },
  { title: "Partner plan", detail: "Foundry access, N2 sign-off, HBM3E and I/O IP, packaging and test, and who we are talking to." },
];

const ROUNDS = [
  { when: "2027", title: "2 nm test chip", amount: "$1.2M to $4.4M", detail: "10 mm² N2 shuttle chip, one 128 × 128 matrix unit in each format." },
  { when: "Q4 2027", title: "Production tape-out", amount: "$23M to $59M", detail: "800 mm² die on its own N2 mask set, with IP, design-service and test." },
  { when: "2028", title: "Year-1 production", amount: "$106M to $176M", detail: "1,000 N2 wafers, about 40,000 chips." },
];

const STEPS = [
  { title: "Intro call", detail: "Thirty minutes on what we have built, what we measured and what the rounds pay for." },
  { title: "NDA and data room", detail: "The budget model, sign-off reports and 2 nm results, under NDA." },
  { title: "Technical diligence", detail: "RTL, verification and physical design walk-throughs with your engineers, if you want them." },
  { title: "Terms", detail: "Round terms and documents agreed through counsel, for each investor individually." },
];

const TICKETS = ["Under $25K", "$25K to $100K", "$100K to $500K", "$500K to $2M", "Over $2M"];
const TYPES = ["Angel", "Venture fund", "Family office", "Corporate or strategic", "Foundry, design-service or IP partner", "Other"];
const INTERESTS = ["2 nm test chip round", "Production tape-out round", "Strategic partnership"];

export default function Investors() {
  const [sent, setSent] = useState(false);

  const submit = (event) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const lines = [
      `Name: ${form.get("name")}`,
      `Email: ${form.get("email")}`,
      `Organisation: ${form.get("organisation") || "-"}`,
      `Investor type: ${form.get("type")}`,
      `Country of residence: ${form.get("country")}`,
      `Typical cheque: ${form.get("ticket")}`,
      `Interested in: ${form.getAll("interest").join(", ") || "-"}`,
      "Self-declaration: accredited, qualified or professional investor where I live, or strategic partner",
      "",
      form.get("message") || "",
    ];
    const subject = `Investor enquiry: ${form.get("name")}${form.get("organisation") ? `, ${form.get("organisation")}` : ""}`;
    window.location.href = `mailto:${CONTACT}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(lines.join("\n"))}`;
    setSent(true);
  };

  return (
    <div className="technical-home investors-page">
      <section className="sf-container investors-hero">
        <div className="section-label" data-reveal="">INVESTORS</div>
        <h1 data-reveal="1">The road to <em>2 nm silicon.</em></h1>
        <p className="investors-lede" data-reveal="2">Our pre-seed and seed rounds fund the first prototypes. The rounds after them pay for a TSMC N2 test chip and then the production die. We take those conversations one investor at a time, and share the data room and terms privately.</p>
        <a className="sf-button primary" href="#interest" data-reveal="3" onClick={(event) => { event.preventDefault(); scrollToSection("interest"); }}>Register your interest <span>↓</span></a>
      </section>

      <section className="sf-section sf-container">
        <div className="section-label" data-reveal="">01 / WHAT WE SHARE AFTER AN INTRO</div>
        <div className="investors-grid" data-reveal="1">
          {SHARED.map((item) => <article key={item.title} className="investors-card"><h3>{item.title}</h3><p>{item.detail}</p></article>)}
        </div>
      </section>

      <section className="sf-section sf-container">
        <div className="section-label" data-reveal="">02 / THE ROUNDS AHEAD</div>
        <div className="investors-rounds" data-reveal="1">
          {ROUNDS.map((round) => (
            <article key={round.title} className="raise-stage is-later">
              <div className="raise-stage__top"><span className="raise-stage__when">{round.when}</span></div>
              <h3>{round.title}</h3>
              <span className="raise-stage__label">BUDGET</span>
              <strong className="raise-stage__amount">{round.amount}</strong>
              <p>{round.detail}</p>
            </article>
          ))}
        </div>
        <p className="investors-fine" data-reveal="1">2 nm figures are estimates from public reports; TSMC publishes no prices. Year-1 production is a plan target, not an order.</p>
      </section>

      <section className="sf-section sf-container">
        <div className="section-label" data-reveal="">03 / HOW IT WORKS</div>
        <ol className="investors-steps" data-reveal="1">
          {STEPS.map((step, i) => <li key={step.title}><span>{String(i + 1).padStart(2, "0")}</span><h3>{step.title}</h3><p>{step.detail}</p></li>)}
        </ol>
      </section>

      <section id="interest" className="sf-section sf-container">
        <div className="section-label" data-reveal="">04 / REGISTER YOUR INTEREST</div>
        <form className="investors-form" onSubmit={submit} data-reveal="1">
          <label>Name<input name="name" required autoComplete="name" /></label>
          <label>Email<input name="email" type="email" required autoComplete="email" /></label>
          <label>Organisation<input name="organisation" autoComplete="organization" /></label>
          <label>Country of residence<input name="country" required autoComplete="country-name" /></label>
          <label>Investor type<select name="type" required defaultValue=""><option value="" disabled>Choose one</option>{TYPES.map((t) => <option key={t}>{t}</option>)}</select></label>
          <label>Typical cheque<select name="ticket" required defaultValue=""><option value="" disabled>Choose one</option>{TICKETS.map((t) => <option key={t}>{t}</option>)}</select></label>
          <fieldset className="investors-form__wide"><legend>Interested in</legend>{INTERESTS.map((i) => <label key={i} className="investors-check"><input type="checkbox" name="interest" value={i} />{i}</label>)}</fieldset>
          <label className="investors-form__wide">Anything else<textarea name="message" rows="4" /></label>
          <label className="investors-check investors-form__wide"><input type="checkbox" name="declaration" required />I am an accredited, qualified or professional investor under the rules where I live, or I am writing as a strategic partner.</label>
          <div className="investors-form__wide investors-form__submit">
            <button className="sf-button primary" type="submit">Send <span>↗</span></button>
            <p>{sent ? `Your email app should now be open with your details filled in. If it isn't, write to ${CONTACT}.` : `This opens your email app with your answers, addressed to ${CONTACT}.`}</p>
          </div>
        </form>
        <p className="investors-fine investors-legal" data-reveal="1">Nothing on this page is an offer to sell, or a solicitation of an offer to buy, any securities. Any investment in Superfloat is offered only to identified persons, through definitive documents, under the laws that apply to them and to the company. The pre-seed and seed pages on Razorpay are separate and are described on those pages.</p>
      </section>
    </div>
  );
}
