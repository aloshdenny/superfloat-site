import { Link } from "react-router-dom";
import leadPortrait from "../assets/about/alosh-denny-lead.webp";
import alosh from "../assets/about/alosh-denny.webp";
import poojith from "../assets/about/poojith-devan.webp";
import karthik from "../assets/about/karthik-prakash.webp";
import projectReport from "../assets/about/project-report.webp";
import tinkerhubMark from "../assets/about/tinkerhub-mark.webp";
import FAQ from "../content/faq";
import "./Home.css";

const REPOS = [
  { name: "superfloat", what: "The formats and the accelerator" },
  { name: "superfloat.python", what: "Python DSL and kernels" },
  { name: "superfloat.llvm", what: "Compiler" },
  { name: "superfloat.cuda", what: "CUDA and C kernels" },
  { name: "superfloat.arduino", what: "Integer-only inference on the Arduino UNO Q" },
];

// The same rounds as the home page's raise section and the investors page.
const ROUNDS = [
  { when: "DEC 2026", title: "Pre-seed", amount: "$30K", now: true, detail: "The first SF16 chip on ChipFoundry's CI2612 shuttle: the $14,950 tape-out, then boards, bring-up, duties and shipping." },
  { when: "IN PARALLEL", title: "Seed", amount: "$500K", now: true, detail: "Batched SF prototypes, run alongside the first chip." },
  { when: "2027", title: "2 nm test chip", amount: "$1.2M to $4.4M", detail: "A 10 mm² N2 shuttle chip, one 128 × 128 matrix unit in each format." },
  { when: "Q4 2027", title: "Production tape-out", amount: "$23M to $59M", detail: "The 800 mm² die on its own N2 mask set, with IP, design service and test." },
  { when: "2028", title: "Year-1 production", amount: "$106M to $176M", detail: "1,000 N2 wafers, about 40,000 chips at a planned cost of about $3,550 each." },
];

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

      <section className="sf-section sf-container about-money">
        <div className="about-money__copy">
          <h2 data-reveal="">Financial model</h2>
          <p data-reveal="1">The software is free to use. The company raises in stages, and each round pays for the silicon the next one builds on: a 130 nm prototype first, then a 2 nm test chip, then the production die.</p>
          <p className="about-money__fine" data-reveal="2">2 nm figures are estimates from public reports; TSMC publishes no prices. Year-1 production is a plan target, not an order.</p>
          <Link className="sf-button primary" to="/investors" data-reveal="2">For investors <span>↗</span></Link>
        </div>
        <ol className="about-money__rounds" data-reveal="1">
          {ROUNDS.map((round) => (
            <li key={round.title} className={round.now ? "is-now" : ""}>
              <span className="about-money__when">{round.when}</span>
              <div><strong>{round.title}</strong><p>{round.detail}</p></div>
              <span className="about-money__amount">{round.amount}</span>
            </li>
          ))}
        </ol>
      </section>

      <section className="sf-section sf-container about-who">
        <div className="about-who__copy">
          <h2 data-reveal="">The OpenSilicon Project</h2>
          <p data-reveal="1">The OpenSilicon Project is Superfloat&apos;s work in the open: the number formats, the compiler, the kernels and the tooling, developed on GitHub where anyone can follow along and contribute. It was kickstarted by Alosh Denny, and it grows with the community that uses it.</p>
          <ul className="about-who__repos" data-reveal="2" aria-label="The OpenSilicon Project on GitHub">
            {REPOS.map((repo) => <li key={repo.name}><a href={`https://github.com/aloshdenny/${repo.name}`} target="_blank" rel="noopener noreferrer"><strong>{repo.name}</strong><span>{repo.what}</span></a></li>)}
          </ul>
        </div>
        <a className="about-who__partner" href="https://tinkerhub.org" target="_blank" rel="noopener noreferrer" data-reveal="2">
          <span className="about-who__tag">KICKSTARTER</span>
          <span className="about-who__org"><img src={tinkerhubMark} width="288" height="289" alt="" /><strong>TinkerHub Foundation <span aria-hidden="true">↗</span></strong></span>
          <span className="about-who__about">A non-profit community of tinkerers, makers and students. TinkerHub has been a very valuable kickstarter of the OpenSilicon Project.</span>
        </a>
      </section>

      <section className="sf-section sf-container about-faq" aria-labelledby="about-faq-title">
        <h2 id="about-faq-title" data-reveal="">Questions</h2>
        <dl className="about-faq__list">
          {FAQ.map(({ q, a, more }, i) => (
            <div key={q} data-reveal={String((i % 3) + 1)}>
              <dt><h3>{q}</h3></dt>
              <dd>{a}{more && <> <Link className="about-faq__more" to={more}>Read the note →</Link></>}</dd>
            </div>
          ))}
        </dl>
      </section>
    </div>
  );
}
