import { useState } from "react";

const words = ["AI", "Quantization", "Precision", "Efficiency"];

// Predefined fixed positions for words
const fixedPositions = [
  { top: 20, left: 20 },
  { top: 40, left: 80 },
  { top: 70,  left: 30 },
  { top: 80, left: 75 },
];

export default function FloatingWords() {
  const [positions] = useState(
    fixedPositions.map((pos, i) => ({
      ...pos,
      delay: Math.random() * 2, // only animation delay random
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
