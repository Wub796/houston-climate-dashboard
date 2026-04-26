"use client";

import dynamic from "next/dynamic";

// Dynamically import the ENTIRE wrapper component, bypassing Server-Side Rendering
const DynamicGlobe = dynamic(() => import("../components/Globe"), { 
  ssr: false,
  loading: () => <div style={{ color: 'white', padding: '20px' }}>Igniting Aerospace Engine...</div>
});

export default function Home() {
  return (
    <main style={{ width: "100vw", height: "100vh", margin: 0, padding: 0, overflow: "hidden", backgroundColor: "black" }}>
      <DynamicGlobe />
    </main>
  );
}