const acceleratedHardware = {
  title: "Inside the Superfloat compute model",
  body: `
<p class="article-lead">A guide to the interactive lab: what it visualizes, how its numbers are calculated, and where the model stops.</p>
<aside class="article-note">Implementation notes, not benchmark results. This page describes the website’s educational model. It does not establish measured latency, energy use, silicon area, or neural-network accuracy.</aside>
<h2>01 / Representation comes first</h2>
<p>The format explorer places two layouts side by side conceptually. BF16 allocates one sign bit, eight exponent bits, and seven fraction bits. The Superfloat view uses one sign bit and a scalable value field, with a total width from 4 to 16 bits.</p>
<p>The displayed bit pattern is a field-layout illustration. Switching formats does not numerically convert the same value between them. A complete numerical specification would also need to define scaling, rounding, saturation, and representable values.</p>
<h2>02 / Count the storage, not the speedup</h2>
<p>For an ideally packed tensor containing N values at b bits per value, the payload requires N × b / 8 bytes. One million 16-bit values occupy 2.00 MB; one million 4-bit values occupy 0.50 MB, using decimal megabytes.</p>
<pre><code>payload_bytes = value_count * bits_per_value / 8
relative_storage = bits_per_value / 16

# 1,000,000 values, ideally bit-packed
BF16: 2,000,000 bytes
SF8:  1,000,000 bytes
SF4:    500,000 bytes</code></pre>
<p>This calculation excludes alignment, scales, metadata, and runtime allocations. A 75% reduction in payload bits is not a 75% reduction in inference latency or energy. Those quantities require measurements on a specified implementation.</p>
<h2>03 / A multiply-accumulate in flight</h2>
<p>The scalar lab traces an operation of the form c ← a × b + c. It uses a nine-stage pipeline model and counts a multiply-accumulate as two operations.</p>
<p>Pipeline latency and issue rate describe different things. A result takes multiple stages to arrive, while independent operands can occupy those stages at the same time. Under the lab’s assumption of one completed MAC per clock after filling, the steady-state modeled rate is 2 × clock frequency operations per second. Occupying nine stages does not mean completing nine MACs every clock.</p>
<p>Use <strong>Step +1</strong> to inspect one model cycle at a time. Play compresses a run into a few visible seconds; the clock controls the calculated hardware time, not the browser’s playback speed.</p>
<h2>04 / From one element to an array</h2>
<p>In the array visualization, each processing element contributes to an output in C = A × B. Data arrives at staggered times, multiplication and accumulation overlap, and the array eventually drains. The operands are deterministic sample values for inspection, not tensors from a trained network.</p>
<p>The comparison view uses illustrative BF16 latency parameters of 16 or 32 cycles against the scalar model’s nine-stage latency. It also scales the illustrated BF16 cadence by that ratio. This is a simplifying assumption: an instruction’s latency alone does not determine an accelerator’s throughput. The view is not a cycle-accurate model of an NVIDIA Tensor Core.</p>
<pre><code>illustrative_cadence_ratio = BF16_latency / 9
modeled_time_seconds = model_cycles / clock_hz

# Ratios used by the visualization
16 / 9 ≈ 1.78
32 / 9 ≈ 3.56</code></pre>
<p>These ratios must not be presented as measured end-to-end speedups. Memory traffic, tile shape, scheduling, software, and the actual datapath can all change the result.</p>
<h2>05 / What a reproducible benchmark needs</h2>
<ul><li><strong>Numerics:</strong> the precise encoding, conversion rules, calibration procedure, and accuracy on a named model and dataset.</li><li><strong>Hardware:</strong> the device or implementation revision, clock, memory configuration, and power-measurement method.</li><li><strong>Workload:</strong> tensor shapes, batch size, precision, warm-up, and whether transfer time is included.</li><li><strong>Comparison:</strong> equivalent workloads, the baseline implementation, repeated runs, and reported variation.</li></ul>
<p>The website currently provides a way to inspect the design space. Validated benchmark results can be added alongside their methodology and reproducible artifacts when available.</p>
<p><a href="/#architecture">Return to the compute lab →</a></p>
`,
};

export default acceleratedHardware;
