import FloatingWords from "../components/blocks/FloatingWords";
import TextBlock from "../components/blocks/TextBlock";

export default function Home() {
  return (
    <div className="relative">
      {/* Hero */}
      
      <section className="relative h-72 flex flex-col items-center justify-center text-start bg-white">
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

      {/* Equation 
      <EquationBlock equation="P = f(n, c, 3, x)" /> */}

      {/* Applications */}
      <TextBlock
        title="Applications"
        content="Superfloat is designed for AI at the edge — from IoT devices and autonomous drones to wearable tech and robotics. Wherever power efficiency and fast inference matter, Superfloat offers a scalable alternative to traditional floating-point arithmetic."
      />

       <TextBlock
        title="Join the Revolution"
        content="Superfloat is not just another format — it’s a rethinking of how precision and efficiency
          balance each other. Start experimenting with it today and help shape the future of AI on the edge."
      />

    </div>
  );
}
