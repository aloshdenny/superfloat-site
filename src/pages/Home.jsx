import FloatingWords from "../components/blocks/FloatingWords";
import TextBlock from "../components/blocks/TextBlock";
import EquationBlock from "../components/blocks/EquationBlock";
import CodeBlock from "../components/blocks/CodeBlock";
import FMAPipeline from "../components/FMAPipeline";

export default function Home() {
  return (
    <div className="relative">
      {/* Hero */}
      
      <section className="relative h-72 flex flex-col items-center justify-center text-start bg-white dark:bg-zinc-950 text-gray-900 dark:text-gray-100 transition-colors duration-300">
       <FloatingWords />
       <h1 className="text-5xl font-bold mb-6 mt-10">Superfloat</h1>
        <p className="text-md max-w-2xl font-iowan">
          Accelerators for AI on the Edge.
          A new scalable precision format.
        </p>
      </section>

      {/* About */}
      <TextBlock 
        title="What is Superfloat?" 
        content="Superfloat is a custom quantization algorithm that operates with a scalable precision format.
         Unlike IEEE-754 floating-point, it eliminates the mantissa and focuses entirely on the exponent for efficient AI edge computation.
         Traditional floating-point formats waste memory and compute cycles handling mantissas that are rarely critical in edge scenarios. 
         Superfloat streamlines the process by keeping only what matters — the exponent — making AI inference faster, lighter, and more power-efficient.
         Superfloat is designed for AI at the edge — from IoT devices and autonomous drones to wearable tech and robotics. Wherever power efficiency and fast inference matter, 
         Superfloat offers a scalable alternative to traditional floating-point arithmetic." 
      />

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
