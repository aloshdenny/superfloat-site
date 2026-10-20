import { Link } from "react-router-dom";
import leadPortrait from "../assets/about/alosh-denny-lead.webp";
import alosh from "../assets/about/alosh-denny.webp";
import poojith from "../assets/about/poojith-devan.webp";
import karthik from "../assets/about/karthik-prakash.webp";
import projectReport from "../assets/about/project-report.webp";
import "./Home.css";

const STORY = [
  "Superfloat began as a college major project. We set out to make large language models run faster on the hardware people already had, by quantizing them: holding each weight in fewer bits without losing what the model had learned. The report was called Weight-Aware Selective Quantization to Improve Performance of Deep Learning Models.",
  "The deeper we went, the clearer one pattern became. Trained networks keep almost every weight in a narrow band of values, while the standard formats spend a large share of each number on range those weights never reach. Quantization could squeeze that waste out of memory. The arithmetic underneath still ran in floating point and still paid for it.",
  "So we went after the numbers themselves. Out of that work came a family of numerics, from 4 bits to 16, that keeps models accurate while making every multiply-add simpler and faster. Because the arithmetic itself gets simpler, the speed-up reaches the circuit, which quantization alone could not do.",
  "A better number only pays off on hardware built for it, so we built the hardware. Our Atreides accelerator is designed around Superfloat arithmetic from the processing element up. Three chips have been signed off on SkyWater's 130 nm process, and the first Superfloat silicon tapes out in December 2026.",
];

const PILLARS = [
  { title: "Numerics", detail: "A family of number formats, from 4 to 16 bits, that holds a model's accuracy while making the arithmetic beneath it simpler." },
  { title: "Silicon", detail: "Accelerators designed around those formats from the processing element up, proven at 130 nm and planned for 2 nm." },
  { title: "Software", detail: "Compilers, kernels and Python tooling that take a trained model onto Superfloat hardware without rebuilding it." },
];

const TEAM = [
  { name: "Alosh Denny", role: "Founder and CEO", photo: alosh },
  { name: "Poojith Devan", role: "Director of R&D", photo: poojith },
  { name: "Karthik Prakash", role: "Director of Compiler Design", photo: karthik },
];

export default function About() {
  return (
    <div className="technical-home about-page">
      <section className="sf-container about-hero">
        <div className="section-label" data-reveal="">ABOUT SUPERFLOAT</div>
        <h1 data-reveal="1">Faster intelligence starts with <em>better numbers.</em></h1>
        <p className="about-lede" data-reveal="2">Superfloat designs number formats for AI and the chips that compute in them. Every answer a model gives is billions of multiply-adds, and each one costs time, silicon and power. We make each of them cost less.</p>
      </section>

      <section className="sf-container about-lead" aria-labelledby="about-lead-quote">
        <div className="about-lead__portrait" data-reveal="">
          <img src={leadPortrait} width="760" height="1000" alt="Alosh Denny, Founder and CEO of Superfloat" />
        </div>
        <div className="about-lead__copy" data-reveal="1">
          <h2>The infrastructure datatype for <em>ultrafast intelligence.</em></h2>
          <svg className="about-lead__mark" width="56" height="44" viewBox="0 0 56 44" aria-hidden="true"><path d="M0 44V27C0 12 7 3 21 0l3 6c-7 3-11 8-11 15h10v23H0zm32 0V27C32 12 39 3 53 0l3 6c-7 3-11 8-11 15h10v23H32z" /></svg>
          <blockquote id="about-lead-quote">“Ultrafast sub-millisecond reasoning at twice the speed and half the price.”</blockquote>
          <div className="about-lead__by"><strong>Alosh Denny</strong><span>Founder and CEO, Superfloat</span></div>
        </div>
      </section>

      <section className="sf-section sf-container about-story">
        <div className="about-story__copy">
          <div className="section-label" data-reveal="">01 / OUR STORY</div>
          <h2 data-reveal="1">It began as a college project.</h2>
          {STORY.map((paragraph, i) => <p key={i} data-reveal={String(Math.min(i + 1, 3))}>{paragraph}</p>)}
        </div>
        <figure className="about-story__figure" data-reveal="2">
          <img src={projectReport} width="950" height="760" loading="lazy" alt="Cover of the major project report: Weight-Aware Selective Quantization to Improve Performance of Deep Learning Models" />
          <figcaption>THE MAJOR PROJECT REPORT WHERE SUPERFLOAT STARTED</figcaption>
        </figure>
      </section>

      <section className="sf-section sf-container about-vision">
        <div className="section-label" data-reveal="">02 / OUR VISION</div>
        <h2 data-reveal="1">Intelligence fast enough to reason in real time, and cheap enough to <em>run everywhere.</em></h2>
        <p data-reveal="2">The cost of AI is set by its arithmetic: how many bits move, how many transistors switch, how many watts a data centre draws for every answer. We see reasoning that returns in under a millisecond, an answer priced by the work in it with nothing lost to unused bits, and the same efficiency reaching from hyperscale clusters to the devices in people&apos;s hands.</p>
      </section>

      <section className="sf-section sf-container about-mission">
        <div className="section-label" data-reveal="">03 / OUR MISSION</div>
        <div className="section-heading" data-reveal="1">
          <h2>Make every bit count, from the <em>number format to the chip.</em></h2>
          <p>We design the numerics, the silicon and the software as one system, so that models run twice as fast at half the price.</p>
        </div>
        <ol className="about-pillars" data-reveal="2">
          {PILLARS.map((pillar, i) => <li key={pillar.title}><span>{String(i + 1).padStart(2, "0")}</span><h3>{pillar.title}</h3><p>{pillar.detail}</p></li>)}
        </ol>
      </section>

      <section className="sf-section sf-container about-team">
        <div className="section-label" data-reveal="">04 / OUR TEAM</div>
        <div className="section-heading" data-reveal="1">
          <h2>The people building <em>Superfloat.</em></h2>
          <p>Hardware, numerics and compilers under one roof, from the first format to the first chip.</p>
        </div>
        <ul className="about-team__grid">
          {TEAM.map((person, i) => (
            <li key={person.name} className="about-person" data-reveal={String(i + 1)}>
              <div className="about-person__photo"><img src={person.photo} width="720" height="900" loading="lazy" alt={person.name} /></div>
              <h3>{person.name}</h3>
              <span>{person.role}</span>
            </li>
          ))}
        </ul>
        <p className="about-team__join" data-reveal="1">Building with us, or backing us? <a href="mailto:alosh@superfloat.si">alosh@superfloat.si</a> · <Link to="/investors">Investors ↗</Link></p>
      </section>
    </div>
  );
}
