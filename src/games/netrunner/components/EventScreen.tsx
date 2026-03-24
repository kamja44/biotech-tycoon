"use client";
import { useNetrunnerStore } from "../store/gameStore";

export default function EventScreen() {
  const event = useNetrunnerStore((s) => s.currentEvent);
  const resolveEvent = useNetrunnerStore((s) => s.resolveEvent);
  const enterMap = useNetrunnerStore((s) => s.enterMap);

  if (!event) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center text-white">
        <button onClick={enterMap} className="px-6 py-3 bg-blue-800 rounded-xl font-bold">계속</button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950 flex flex-col items-center justify-center gap-6 text-white p-8 max-w-lg mx-auto">
      <div className="text-5xl">❓</div>
      <h2 className="text-2xl font-black text-blue-400 text-center">{event.title}</h2>
      <p className="text-gray-300 text-center leading-relaxed">{event.description}</p>

      <div className="w-full space-y-3 mt-2">
        {event.choices.map((choice, i) => (
          <button
            key={i}
            onClick={() => resolveEvent(i)}
            className="w-full text-left px-5 py-3 bg-gray-800 hover:bg-gray-700 border border-gray-600
              hover:border-cyan-500 rounded-xl transition-all"
          >
            <span className="text-cyan-400 font-bold mr-2">{String.fromCharCode(65 + i)}.</span>
            <span className="text-white">{choice.label}</span>
            {choice.probability != null && (
              <span className="text-gray-500 text-xs ml-2">
                ({Math.round(choice.probability * 100)}% 성공 / {choice.altLabel})
              </span>
            )}
          </button>
        ))}
      </div>
    </div>
  );
}
