import { Link } from "react-router-dom";
import leadPortrait from "../assets/about/alosh-denny-lead.webp";
import alosh from "../assets/about/alosh-denny.webp";
import poojith from "../assets/about/poojith-devan.webp";
import karthik from "../assets/about/karthik-prakash.webp";
import projectReport from "../assets/about/project-report.webp";
import "./Home.css";

const TEAM = [
  { name: "Alosh Denny", role: "Founder and CEO", photo: alosh, linkedin: "https://www.linkedin.com/in/aloshdenny/" },
  { name: "Poojith Devan", role: "Director of R&D", photo: poojith, linkedin: "https://www.linkedin.com/in/poojith-devan/" },
  { name: "Karthik Prakash", role: "Director of Compiler Design", photo: karthik, linkedin: "https://www.linkedin.com/in/karthikp751/" },
];

export default function About() {
  return (
    <div className="technical-home about-page">
      <section className="sf-container about-hero">
        <h1 data-reveal="">Faster intelligence starts with <em>better numbers.</em></h1>
        <p className="about-lede" data-reveal="1">Superfloat designs number formats for AI and the chips that compute in them. Every answer a model gives is billions of multiply-adds, and each one costs time, silicon and power. We make each of them cost less.</p>
      </section>

      <section className="sf-container about-lead" aria-labelledby="about-lead-quote">
        <div className="about-lead__portrait" data-reveal="">
          <img src={leadPortrait} width="1120" height="1000" alt="Alosh Denny, Founder and CEO of Superfloat" />
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
          <h2 data-reveal="">Our story</h2>
          <p data-reveal="1">Superfloat began in 2024 as a college major project on quantization: making large language models run faster by holding each weight in fewer bits, without losing what the model had learned. Along the way we saw that trained networks keep almost every weight in a narrow band of values, while standard formats spend much of each number on range those weights never reach.</p>
          <p data-reveal="2">That took us past compression to the numbers themselves, and to a family of numerics, from 4 to 16 bits, that keeps models accurate while making every multiply-add simpler and faster. A better number pays off only on hardware built for it, so we built the Atreides accelerator around ours. Three chips are signed off on SkyWater&apos;s 130 nm process, and the first Superfloat silicon tapes out in December 2026.</p>
        </div>
        <figure className="about-story__figure" data-reveal="2">
          <img src={projectReport} width="950" height="760" loading="lazy" alt="Cover of the major project report: Weight-Aware Selective Quantization to Improve Performance of Deep Learning Models" />
          <figcaption>THE MAJOR PROJECT REPORT WHERE SUPERFLOAT STARTED</figcaption>
        </figure>
      </section>

      <section className="sf-section sf-container about-aims">
        <div data-reveal="">
          <h2>Our vision</h2>
          <p className="about-aims__lead">Intelligence fast enough to reason in real time, and cheap enough to run everywhere.</p>
          <p>Reasoning that returns in under a millisecond, an answer priced by the work in it with nothing lost to unused bits, and the same efficiency from hyperscale clusters to the devices in people&apos;s hands.</p>
        </div>
        <div data-reveal="1">
          <h2>Our mission</h2>
          <p className="about-aims__lead">Make every bit count, from the number format to the chip.</p>
          <p>We design the numerics, the silicon and the software as one system: a family of number formats, from 4 to 16 bits, that holds a model&apos;s accuracy while making the arithmetic beneath it simpler; accelerators designed around those formats from the processing element up, proven at 130 nm and planned for 2 nm; and compilers, kernels and Python tooling that take a trained model onto Superfloat hardware without rebuilding it.</p>
        </div>
      </section>

      <section className="sf-section sf-container about-team">
        <h2 data-reveal="">Our team</h2>
        <ul className="about-team__grid">
          {TEAM.map((person, i) => (
            <li key={person.name} data-reveal={String(i + 1)}>
              <a className="about-person" href={person.linkedin} target="_blank" rel="noopener noreferrer" aria-label={`${person.name}, ${person.role}, on LinkedIn`}>
                <div className="about-person__photo"><img src={person.photo} width="720" height="900" loading="lazy" alt="" /></div>
                <h3>{person.name} <span aria-hidden="true">↗</span></h3>
                <span className="about-person__role">{person.role}</span>
              </a>
            </li>
          ))}
        </ul>
        <p className="about-team__join" data-reveal="1">Building with us, or backing us? <a href="mailto:alosh@superfloat.si">alosh@superfloat.si</a> · <Link to="/investors">Investors ↗</Link></p>
      </section>
    </div>
  );
}
