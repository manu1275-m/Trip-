"use client";

import { useState } from "react";

export default function Home() {
  const [source, setSource] = useState("");
  const [destination, setDestination] = useState("");
  const [days, setDays] = useState(1);
  const [plan, setPlan] = useState<any>(null);

  const handleSubmit = async () => {
    const res = await fetch("http://127.0.0.1:8000/generate-plan", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ source, destination, days }),
    });

    const data = await res.json();
    setPlan(data);
  };

  return (
    <div style={{ padding: "20px" }}>
      <h1>Agentic Travel AI</h1>

      <input
        placeholder="Source"
        value={source}
        onChange={(e) => setSource(e.target.value)}
      />
      <br /><br />

      <input
        placeholder="Destination"
        value={destination}
        onChange={(e) => setDestination(e.target.value)}
      />
      <br /><br />

      <input
        type="number"
        value={days}
        onChange={(e) => setDays(Number(e.target.value))}
      />
      <br /><br />

      <button onClick={handleSubmit}>Generate Plan</button>

      {plan && (
        <div>
          <h2>Trip Plan</h2>
          {Object.entries(plan.plan).map(([day, places]: any) => (
            <div key={day}>
              <h3>{day}</h3>
              <ul>
                {places.map((p: string, i: number) => (
                  <li key={i}>{p}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}