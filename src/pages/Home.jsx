import FloatingWords from "../components/blocks/FloatingWords";
import TextBlock from "../components/blocks/TextBlock";
import FMAPipeline from "../components/FMAPipeline";
import FormatExplorer from "../components/FormatExplorer";

export default function Home() {
  return (
    <div className="relative">
      {/* Hero */}
      
      <section className="relative min-h-[26rem] px-6 flex flex-col items-center justify-center text-center bg-white dark:bg-zinc-950 text-gray-900 dark:text-gray-100 transition-colors duration-300">
       <FloatingWords />
       <span className="mt-14 mb-4 text-xs font-bold uppercase tracking-[0.18em] text-blue-600 dark:text-blue-300">Scalable precision for edge AI</span>
       <h1 className="text-5xl md:text-6xl font-bold mb-6 max-w-4xl leading-tight">A smaller number format for faster edge inference.</h1>
        <p className="text-lg max-w-2xl font-iowan text-gray-600 dark:text-zinc-300">
          Superfloat adapts numerical precision to the workload, reducing arithmetic and memory overhead where power, latency, and silicon area matter most.
        </p>
      </section>

      {/* About */}
      <TextBlock 
        title="What is Superfloat?" 
        content="Superfloat is a configurable low-precision number format for AI inference. Instead of carrying the same numerical overhead into every workload, its width can scale from SF4 to SF16. That gives hardware designers a direct way to trade precision for storage, throughput, and energy efficiency on constrained edge devices."
      />

      <FormatExplorer />

      <FMAPipeline />

      {/* Equation 
      <EquationBlock equation="P = f(n, c, 3, x)" /> */}

      {/* Applications */}
      <TextBlock
        title="Applications"
        content="Superfloat is designed for AI at the edge — from IoT devices and autonomous drones to wearable tech and robotics. Wherever power efficiency and fast inference matter, Superfloat offers a scalable alternative to traditional floating-point arithmetic."
      />

      {/* Closing */}
      <section className="py-16 ">
        <h2 className="text-3xl font-bold mb-4 font-iowan text-center">Join the Revolution</h2>
        <p className="text-lg text-gray-700 dark:text-gray-300 max-w-2xl mx-auto text-justify">
          Superfloat is not just another format — it’s a rethinking of how precision and efficiency
          balance each other. Start experimenting with it today and help shape the future of AI on the edge.
        </p>
      </section>

    </div>
  );
}
