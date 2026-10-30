// Questions people (and search engines and assistants) ask about Superfloat. Shown on the about page
// and written into its FAQPage structured data, so keep each answer self-contained and factual.
const FAQ = [
  {
    q: "What is Superfloat?",
    a: "Superfloat is an AI hardware company that designs number formats for AI and the chips that compute in them. It was started in 2024 by Alosh Denny and builds the Superfloat formats (SF4 to SF16), the Atreides accelerator, and the open compiler, kernels and Python tooling of the OpenSilicon Project.",
  },
  {
    q: "What is the Superfloat number format?",
    a: "Superfloat (SFx) is a family of number formats from 4 to 16 bits for neural-network weights and activations. Each value is a sign bit and a scalable value field, with no exponent field. Trained networks keep almost every weight in a narrow band of values, so the range an exponent buys goes unused, and dropping it makes every multiply-add simpler.",
  },
  {
    q: "How is Superfloat different from BF16 or FP8?",
    a: "BF16 spends 8 of its 16 bits on an exponent and FP8 spends 4 or 5 of its 8. Superfloat spends none: the same multiply-accumulate runs without exponent alignment and normalization hardware, which is where Superfloat's target of twice the speed at half the price comes from.",
  },
  {
    q: "What is the Atreides accelerator?",
    a: "Atreides is Superfloat's AI accelerator, designed around the Superfloat formats from the processing element up. Three chips are signed off on SkyWater's 130 nm process, and the first SF16 chip tapes out on ChipFoundry's CI2612 shuttle on 7 December 2026. A 2 nm (TSMC N2) test chip and production die are planned for 2027.",
  },
  {
    q: "Is Superfloat open source?",
    a: "The software is free to use. The formats, the LLVM compiler, the CUDA and C kernels and the Python package (sf) are developed in the open on GitHub as the OpenSilicon Project, with documentation at docs.superfloat.si.",
  },
  {
    q: "Who is behind Superfloat?",
    a: "Superfloat was founded by Alosh Denny (Founder and CEO), with Poojith Devan (Director of R&D) and Karthik Prakash (Director of Compiler Design). It began as a college major project on quantization, and TinkerHub Foundation kickstarted the OpenSilicon Project.",
  },
];

export default FAQ;
