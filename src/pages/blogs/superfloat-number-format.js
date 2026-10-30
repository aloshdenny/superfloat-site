const superfloatNumberFormat = {
  title: "What is the Superfloat number format?",
  description: "Superfloat (SFx) is a family of exponent-free number formats for AI, SF4 to SF16: how it is defined, how it compares with FP16, BF16 and FP8, and its accuracy.",
  datePublished: "2026-10-30",
  note: "Note 02",
  byline: "The format · SF4 to SF16",
  body: `
<p class="article-lead">Superfloat (SFx) is a family of number formats for neural-network inference, from 4 to 16 bits wide. Each value is a sign bit and x − 1 fraction bits. There is no exponent field, so every multiply-add runs without the hardware a floating-point format needs to line exponents up.</p>
<h2>How is a Superfloat value defined?</h2>
<p>An SFx value is a signed integer code k with a fixed scale of 2^(x−1). Its value is k / 2^(x−1). In fixed-point terms SF16 is a Q1.15 number, SF8 is Q1.7 and SF4 is Q1.3. The spacing between neighbouring values is the same everywhere in the range, unlike floating point, where it grows with the exponent.</p>
<pre><code>value = k / 2^(x-1)

SF16: k = 16384  →  16384 / 32768 = 0.5</code></pre>
<p>Codes run from −(2^(x−1) − 1) to +(2^(x−1) − 1), so every value lies strictly between −1 and 1. 1.0 itself is not representable at any width.</p>
<table>
<thead><tr><th>Format</th><th>Fixed point</th><th>Codes</th><th>Largest value</th><th>Step (LSB)</th></tr></thead>
<tbody>
<tr><td>SF4</td><td>Q1.3</td><td>−7 to 7</td><td>0.875</td><td>0.125</td></tr>
<tr><td>SF8</td><td>Q1.7</td><td>−127 to 127</td><td>0.9921875</td><td>0.0078125</td></tr>
<tr><td>SF12</td><td>Q1.11</td><td>−2047 to 2047</td><td>0.99951171875</td><td>0.000244140625</td></tr>
<tr><td>SF16</td><td>Q1.15</td><td>−32767 to 32767</td><td>0.999969482421875</td><td>0.000030517578125</td></tr>
</tbody>
</table>
<p>The format has no NaN, no infinity, no subnormals and no negative zero. When a result does not fit, the hardware saturates to the largest value or flushes to zero instead of producing a special value.</p>
<h2>Why drop the exponent?</h2>
<p>Trained networks keep their weights in a narrow band around zero. In the Superfloat benchmark suite, none of the 53.6 million weights of a trained YOLO11x detector fall outside SF16's range, and only 15 fall outside SF4's tighter ±0.875. A floating-point exponent pays, in bits and in silicon, for dynamic range those weights never use. Superfloat spends every bit after the sign on precision instead.</p>
<h2>How does Superfloat compare with FP16, BF16 and FP8?</h2>
<table>
<thead><tr><th>Format</th><th>Sign</th><th>Exponent</th><th>Fraction</th></tr></thead>
<tbody>
<tr><td>FP16 (IEEE half)</td><td>1</td><td>5</td><td>10</td></tr>
<tr><td>BF16</td><td>1</td><td>8</td><td>7</td></tr>
<tr><td>FP8 E4M3</td><td>1</td><td>4</td><td>3</td></tr>
<tr><td>FP8 E5M2</td><td>1</td><td>5</td><td>2</td></tr>
<tr><td>SF16</td><td>1</td><td>0</td><td>15</td></tr>
<tr><td>SF8</td><td>1</td><td>0</td><td>7</td></tr>
</tbody>
</table>
<p>Without an exponent, a multiply-accumulate unit needs no exponent-difference shifter, no leading-zero detector and no normalisation and rounding stage. In Superfloat's own 130 nm hardening runs, an IEEE FP16 processing element built through the same flow needed 1.40× the standard-cell area of an SF16 element, and its implied maximum clock was 50 MHz against SF16's 75 MHz. The <a href="/blogs/atreides-accelerator">Atreides note</a> has the full tables.</p>
<h2>What accuracy does it keep?</h2>
<p>The <a href="https://github.com/aloshdenny/superfloat">superfloat</a> repository measures SFx against FP32 controls trained in the same pipeline (accuracy for classification, mAP for detection):</p>
<table>
<thead><tr><th>Task</th><th>Model</th><th>Dataset</th><th>SF16</th><th>FP32</th></tr></thead>
<tbody>
<tr><td>Remote-sensing classification</td><td>ConvNeXt-Tiny</td><td>EuroSAT</td><td>96.43</td><td>96.31</td></tr>
<tr><td>UAV object detection</td><td>YOLO11x</td><td>VisDrone</td><td>0.2817</td><td>0.2942</td></tr>
<tr><td>Satellite object detection</td><td>YOLOv8x-OBB</td><td>DOTAv1</td><td>0.4298</td><td>0.4489</td></tr>
<tr><td>Video, self-supervised ViT</td><td>V-JEPA 2 ViT-L</td><td>UCF101</td><td>85.56</td><td>77.51</td></tr>
</tbody>
</table>
<p>The V-JEPA 2 row quantizes weights only. In those runs SF8 stayed within 1% of SF16 in every domain, at a quarter of FP32's storage. SF4 matched FP32 on EuroSAT classification at an eighth of its storage, but cost 15 to 22% on dense detection.</p>
<h2>Where does it struggle?</h2>
<p>Weights quantize well across architectures; activations do not always. After BatchNorm, CNN activations sit near unit scale and clamping them to (−1, 1) is nearly free. A ViT's residual stream accumulates across blocks instead: in V-JEPA 2 ViT-L the largest activation reached 256.1 and 26.3% of activations fell outside the range. Models like that need scaling around the residual path rather than a straight clamp.</p>
<h2>How do I try it?</h2>
<p>The Python library <code>sf</code> computes every operation exactly as the Atreides chip does, bit for bit, and reports each overflow, underflow, divide by zero and invalid input. It needs Python 3.10 or newer and NumPy.</p>
<pre><code>git clone https://github.com/aloshdenny/superfloat.python
cd superfloat.python && pip install -e .

import sf
sf.sf16(0.5) + sf.sf16(0.25)   # sf16(0.75)</code></pre>
<p>The <a href="https://docs.superfloat.si/concepts/format">format reference</a> covers rounding, saturation and the four events in full.</p>
`,
};

export default superfloatNumberFormat;
