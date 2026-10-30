const atreidesAccelerator = {
  title: "Atreides: an AI accelerator with no exponent hardware",
  seoTitle: "Atreides AI accelerator: no exponent hardware · Superfloat",
  description: "Atreides is Superfloat's Q1.15 AI accelerator: a systolic array, a 14-instruction ISA and FMA units with no exponent logic, signed off on SkyWater 130 nm.",
  datePublished: "2026-10-30",
  note: "Note 03",
  byline: "The chip · Atreides",
  body: `
<p class="article-lead">Atreides is the accelerator Superfloat builds around its own number format. It computes in SF16 (Q1.15 fixed point) on a systolic array and on scalar fused multiply-add units that carry no exponent hardware at all. Its RTL, testbenches and Sky130 hardening flow are open in <a href="https://github.com/aloshdenny/superfloat.gpu">superfloat.gpu</a>.</p>
<h2>What is inside the first Atreides chip?</h2>
<table>
<thead><tr><th>Item</th><th>Value</th></tr></thead>
<tbody>
<tr><td>Number format</td><td>SF16 (Q1.15 fixed point)</td></tr>
<tr><td>Compute cores</td><td>2, with 2 threads each</td></tr>
<tr><td>Systolic arrays</td><td>one 2 × 2 array per core, 8 MAC units in total</td></tr>
<tr><td>Scalar FMA units</td><td>one per thread, 2-cycle</td></tr>
<tr><td>On-die scratchpad</td><td>128 B (64 × 16-bit words)</td></tr>
<tr><td>Process and area</td><td>SkyWater 130 nm (Sky130 HD), 8 × 4 Tiny Tapeout tiles</td></tr>
<tr><td>Target clock</td><td>50 MHz</td></tr>
<tr><td>Throughput</td><td>400 million MAC/s on the systolic paths, 100 million FMA/s on the scalar path</td></tr>
</tbody>
</table>
<h2>Why does removing the exponent matter in silicon?</h2>
<p>A floating-point fused multiply-add has to compare exponents, shift one operand to align it, find the leading one in the result, renormalise and round. The Atreides FMA does none of that. The sign is an XOR, the two 15-bit significands go through a 15 × 15 unsigned multiplier, and the result saturates into Q1.15 from a 32-bit internal accumulator. There is no exponent-difference barrel shifter, no leading-zero detector and no round-to-nearest-even packing.</p>
<h2>How does an SF16 processing element compare with IEEE FP16 and FP32?</h2>
<p>All three processing elements were hardened through the same Sky130 flow, at the same 20 ns (50 MHz) clock constraint and with the same cell library:</p>
<table>
<thead><tr><th>Metric</th><th>SF16 PE</th><th>IEEE FP16 PE</th><th>IEEE FP32 PE</th></tr></thead>
<tbody>
<tr><td>Standard-cell area (µm²)</td><td>18,147</td><td>25,397 (1.40×)</td><td>96,919 (5.34×)</td></tr>
<tr><td>Setup slack (ns)</td><td>+6.73</td><td>+0.18</td><td>−5.05</td></tr>
<tr><td>Implied Fmax (MHz)</td><td>75.3</td><td>50.5</td><td>39.9</td></tr>
<tr><td>Meets 50 MHz</td><td>yes</td><td>yes</td><td>no (69 violating paths)</td></tr>
</tbody>
</table>
<p>The gap grows at array level. A 2 × 2 IEEE FP16 systolic array takes 1.63× the standard-cell area of the SF16 array (139,775 against 85,931 µm²) and misses 50 MHz by 0.42 ns, while the SF16 array closes with 7.62 ns to spare.</p>
<p>One caveat: at full-chip level the critical path leaves the arithmetic and lands in memory address generation, so the whole chip's clock is bounded by the memory subsystem rather than by the number format.</p>
<h2>Did the design pass sign-off?</h2>
<p>Yes. After place and route on Sky130 HD at 50 MHz, all four levels of the design close with zero DRC, LVS and antenna violations:</p>
<table>
<thead><tr><th>Level</th><th>Worst slack (ns)</th><th>Implied Fmax (MHz)</th><th>Core area (µm²)</th><th>Power (mW)</th></tr></thead>
<tbody>
<tr><td>Processing element</td><td>6.73</td><td>75.3</td><td>26,269</td><td>2.73</td></tr>
<tr><td>Systolic array</td><td>7.62</td><td>80.8</td><td>99,383</td><td>6.96</td></tr>
<tr><td>Core</td><td>0.93</td><td>52.5</td><td>451,496</td><td>12.24</td></tr>
<tr><td>Accelerator</td><td>3.95</td><td>62.3</td><td>694,446</td><td>21.65</td></tr>
</tbody>
</table>
<h2>What instructions does Atreides run?</h2>
<p>Atreides uses a 14-instruction, 16-bit ISA with a four-field register encoding: a 4-bit opcode and three 4-bit register fields. Integer instructions handle indexing, addressing and control flow. FMA (Rd = Rs × Rt + Rd in Q1.15) and ACT (bias add plus passthrough, ReLU, leaky or clipped activation) are reserved for matrix math, so accumulation never passes through the integer path. SYS drives the systolic array: clear, load, compute and read.</p>
<p>Each thread has 16 registers. R0 to R12 are general purpose; R13 to R15 are read-only and hold the block index, block size and thread index, so a thread knows its coordinates without dedicated addressing hardware.</p>
<pre><code>[OPCODE 15:12] [Rd 11:8] [Rs 7:4] [Rt 3:0]

FMA  Rd, Rs, Rt    ; Rd = (Rs × Rt) + Rd, Q1.15
ACT  Rd, Rs, Rt    ; bias add + activation
SYS  op, idx       ; systolic array: clear / load / compute / read</code></pre>
<h2>When does Atreides reach silicon?</h2>
<p>Three Atreides chips are signed off on SkyWater's 130 nm process. The first SF16 chip tapes out on ChipFoundry's CI2612 shuttle on 7 December 2026, with packaged parts expected back in May 2027. The plan after that is a 10 mm² TSMC N2 (2 nm) test chip with one 128 × 128 matrix unit in each format, then an 800 mm² production die. The <a href="/investors">investors page</a> lists the stages and what each one costs.</p>
<h2>How do I program it?</h2>
<p>The <a href="https://docs.superfloat.si/">sf Python library</a> runs arrays and kernels on an "atreides" device and reproduces the chip's results bit for bit, so software can be written and tested before the silicon arrives. A <a href="https://github.com/aloshdenny/superfloat.llvm">Clang/LLVM fork</a> adds sf16 as a built-in C type.</p>
`,
};

export default atreidesAccelerator;
