import dynamic from "next/dynamic";

// 1. Safely execute the dynamic import on the server
const DynamicGlobe = dynamic(() => import("../components/Globe"), {
  ssr: false,
  // 2. Because this is a Server Component, this function will not be destroyed in transit!
  loading: () => (
    <div className="flex h-screen w-screen items-center justify-center bg-slate-950 text-white font-mono">
      <div className="flex flex-col items-center gap-4">
        <div className="w-8 h-8 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin"></div>
        <p className="animate-pulse">Initializing Aerospace Engines...</p>
      </div>
    </div>
  ),
});

export default function Home() {
  return (
    <main className="h-screen w-screen bg-black overflow-hidden">
      <DynamicGlobe />
    </main>
  );
}