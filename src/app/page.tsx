// 1. Tell Vercel NOT to pre-render this page during the build process
export const dynamic = "force-dynamic";

import dynamicImport from "next/dynamic";

// 2. Force the browser to wait until it is fully loaded before booting the 3D engine
const DynamicGlobe = dynamicImport(() => import("../components/Globe"), {
  ssr: false,
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