import { useState } from "react";

const words = ["AI",  "Quantization", "Precision", "Efficiency"];

export default function FloatingWords() {
  const [positions] = useState(
    words.map(() => ({
      top: Math.random() * 100,
      left: Math.random() * 100,
      delay: Math.random() * 2,
    }))
  );

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none -translate-x-20">
      {words.map((word, i) => (
        <span
          key={i}
          className="absolute text-gray-300 text-2xl animate-float"
          style={{
            top: `${positions[i].top}%`,
            left: `${positions[i].left}%`,
            animationDelay: `${positions[i].delay}s`,
          }}
        >
          {word}
        </span>
      ))}
    </div>
  );
}
