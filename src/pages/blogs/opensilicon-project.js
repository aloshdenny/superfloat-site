const openSiliconProject = {
  title: "The OpenSilicon Project: Superfloat's open-source stack",
  seoTitle: "OpenSilicon Project: Superfloat's open-source stack",
  description: "Superfloat's open-source stack on GitHub: the SFx format, Atreides RTL, an LLVM compiler, CUDA kernels, the sf Python library and Arduino inference.",
  datePublished: "2026-10-30",
  note: "Note 04",
  byline: "The stack · Open source",
  body: `
<p class="article-lead">The OpenSilicon Project is Superfloat's work in the open: the number format, the chip, the compiler, the kernels and the tooling, all developed on GitHub where anyone can read, run and contribute to them. It was kickstarted by Alosh Denny with TinkerHub Foundation, a non-profit community of tinkerers, makers and students.</p>
<h2>What is in the OpenSilicon Project?</h2>
<table>
<thead><tr><th>Repository</th><th>What it holds</th></tr></thead>
<tbody>
<tr><td><a href="https://github.com/aloshdenny/superfloat">superfloat</a></td><td>The SFx format definition, the training and benchmark suite, and measured results</td></tr>
<tr><td><a href="https://github.com/aloshdenny/superfloat.gpu">superfloat.gpu</a></td><td>Atreides: the Q1.15 accelerator RTL, its ISA and the Sky130 hardening flow</td></tr>
<tr><td><a href="https://github.com/aloshdenny/superfloat.llvm">superfloat.llvm</a></td><td>A Clang/LLVM fork that adds sf16 as a first-class built-in type</td></tr>
<tr><td><a href="https://github.com/aloshdenny/superfloat.cuda">superfloat.cuda</a></td><td>CUDA and C kernels for training and running language models</td></tr>
<tr><td><a href="https://github.com/aloshdenny/superfloat.python">superfloat.python</a></td><td>sf, the Python library: scalars, NumPy-style arrays, PyTorch models and GPU kernels in Superfloat</td></tr>
<tr><td><a href="https://github.com/aloshdenny/superfloat.arduino">superfloat.arduino</a></td><td>Integer-only Superfloat inference on the Arduino UNO Q</td></tr>
</tbody>
</table>
<h2>What does the sf Python library do?</h2>
<p>sf lets you write ordinary Python, NumPy-style array code, PyTorch models or GPU-style kernels and get exactly the integer codes the Atreides chip would produce. Every overflow, underflow, divide by zero and invalid input is reported instead of disappearing into the arithmetic, and you choose per event whether to raise, warn or ignore. Arrays placed on the "atreides" device run matmul, dot, sum and elementwise operations there and return a status for each launch. Its documentation lives at <a href="https://docs.superfloat.si/">docs.superfloat.si</a>.</p>
<pre><code>import sf

h = sf.asarray(inputs,  dtype=sf.sf16, device="atreides")
w = sf.asarray(weights, dtype=sf.sf16, device="atreides")
y = h @ w
y.status   # SFStatus(saturated=0, underflow=0, div0=0, invalid=0, exact=True)</code></pre>
<h2>Can Superfloat run on a microcontroller?</h2>
<p>Yes. Every SFx scale is a power of two, so a CNN trained on the Superfloat grid runs on integers alone: int8 multiplies, int32 accumulation, and one rounding shift and a clamp per layer. There are no zero points, no per-channel floating-point scales and no requantisation multipliers. superfloat.arduino uses that to build Wildfire Sentinel, an off-grid node on the Arduino UNO Q that detects wildfire smoke and ignitions on the board and never sends an image anywhere.</p>
<h2>How can I contribute?</h2>
<p>Each repository takes issues and pull requests on GitHub. The format and benchmark work starts in <a href="https://github.com/aloshdenny/superfloat">superfloat</a>; the hardware in <a href="https://github.com/aloshdenny/superfloat.gpu">superfloat.gpu</a>; the software in <a href="https://github.com/aloshdenny/superfloat.python">superfloat.python</a>. To work with the team directly, write to <a href="mailto:alosh@superfloat.si">alosh@superfloat.si</a>.</p>
`,
};

export default openSiliconProject;
