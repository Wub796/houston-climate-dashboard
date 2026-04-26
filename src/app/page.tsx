import dynamic from "next/dynamic";

// 1. A clean, strictly client-side import with NO inline loading function to mangle
const DynamicGlobe = dynamic(() => import("../components/Globe"), {
  ssr: false,
});

export default function Home() {
  return (
    <main className="h-screen w-screen bg-black overflow-hidden">
      <DynamicGlobe />
    </main>
  );
}