"use client";

import '../lib/cesiumInit'; // Must be first
import * as satellite from "satellite.js";
import { X, Activity, Mountain, ShieldAlert } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect, useRef } from "react";
import { Viewer as CesiumViewer, Cartesian3, Color, ScreenSpaceEventType, HeadingPitchRange, Math as CesiumMath } from "cesium";
import { CesiumComponentRef, Viewer, Entity, ScreenSpaceEventHandler, ScreenSpaceEvent, EllipseGraphics, PointGraphics } from "resium";

// Bypass local web workers
// 1. Safely tell TypeScript that our window object has a Cesium property
declare global {
  interface Window {
    CESIUM_BASE_URL: string;
  }
}

// 1. Define the exact shape of your satellite data to banish the 'any' type
export interface SatelliteData {
  id: string;
  name: string;
  position: Cartesian3;
  altitude: number;
  velocity: number;
  tle1: string;
  tle2: string;
  type: "active" | "debris";
}
export default function Globe() {
  // 2. Apply the strict interface to your state hooks
  const [satellites, setSatellites] = useState<SatelliteData[]>([]);
  const [selectedSat, setSelectedSat] = useState<SatelliteData | null>(null);

  const viewerRef = useRef<CesiumComponentRef<CesiumViewer>>(null);

  const [filter, setFilter] = useState<"all" | "active" | "debris">("all");

  useEffect(() => {
    // Fetch active weather sats and the Iridium-33 debris field simultaneously
    Promise.all([
      fetch("https://celestrak.org/NORAD/elements/gp.php?GROUP=weather&FORMAT=tle").then(res => res.text()),
      fetch("https://celestrak.org/NORAD/elements/gp.php?GROUP=iridium-33-debris&FORMAT=tle").then(res => res.text())
    ]).then(([activeData, debrisData]) => {

      const sats: SatelliteData[] = [];
      const now = new Date();
      const gmst = satellite.gstime(now);
      const seenIds = new Set<string>();

      // Helper function to parse and push data to keep code clean
      const processData = (data: string, type: "active" | "debris") => {
        const lines = data.split("\n");
        for (let i = 0; i < lines.length - 2; i += 3) {
          const name = lines[i].trim();
          const tle1 = lines[i + 1].trim();
          const tle2 = lines[i + 2].trim();

          try {
            const satrec = satellite.twoline2satrec(tle1, tle2);
            const posVel = satellite.propagate(satrec, now);

            if (
              posVel.position && typeof posVel.position !== "boolean" && !isNaN(posVel.position.x) &&
              posVel.velocity && typeof posVel.velocity !== "boolean"
            ) {
              const posEcf = satellite.eciToEcf(posVel.position, gmst);
              const geodetic = satellite.eciToGeodetic(posVel.position, gmst);

              let uniqueId = name;
              if (seenIds.has(uniqueId)) uniqueId = `${name}-${i}`;
              seenIds.add(uniqueId);

              sats.push({
                id: uniqueId,
                name,
                position: Cartesian3.fromElements(posEcf.x * 1000, posEcf.y * 1000, posEcf.z * 1000),
                altitude: geodetic.height,
                velocity: Math.sqrt(Math.pow(posVel.velocity.x, 2) + Math.pow(posVel.velocity.y, 2) + Math.pow(posVel.velocity.z, 2)),
                tle1,
                tle2,
                type // Tag it as active or debris
              });
            }
          } catch { /* skip corrupted TLEs */ }
        }
      };

      processData(activeData, "active");
      processData(debrisData, "debris");
      setSatellites(sats);
    });
  }, []);

  return (
    <div className="relative w-full h-full bg-black">
      <div className="absolute top-6 right-6 z-50 flex gap-4 bg-slate-900/80 backdrop-blur-md p-2 rounded-lg border border-slate-700 shadow-2xl">
        <button
          onClick={() => setFilter("all")}
          className={`px-4 py-2 rounded ${filter === "all" ? "bg-blue-600 text-white" : "text-slate-400 hover:text-white"}`}
        >
          View All
        </button>
        <button
          onClick={() => setFilter("active")}
          className={`px-4 py-2 rounded flex items-center gap-2 ${filter === "active" ? "bg-white text-black" : "text-slate-400 hover:text-white"}`}
        >
          <span className="w-2 h-2 rounded-full bg-white animate-pulse"></span>
          Active Payloads
        </button>
        <button
          onClick={() => setFilter("debris")}
          className={`px-4 py-2 rounded flex items-center gap-2 ${filter === "debris" ? "bg-red-600 text-white" : "text-slate-400 hover:text-white"}`}
        >
          <span className="w-2 h-2 rounded-full bg-red-500 shadow-[0_0_8px_rgba(239,68,68,1)]"></span>
          Space Debris
        </button>

        <div className="w-px bg-slate-700 mx-2"></div>

        {/* The Houston Flyover Button */}
        <button
          onClick={() => {
            if (viewerRef.current?.cesiumElement) {
              viewerRef.current.cesiumElement.camera.flyTo({
                // Fly to longitude -95.36, latitude 29.76 (Houston), at an altitude of 4000km
                destination: Cartesian3.fromDegrees(-95.3698, 29.7604, 4000000),
                duration: 2.5
              });
            }
          }}
          className="px-4 py-2 rounded bg-amber-600/20 text-amber-500 border border-amber-600/50 hover:bg-amber-600 hover:text-white transition-all font-bold"
        >
          Houston Flyover
        </button>
      </div>
      <Viewer
        ref={viewerRef}
        full
        animation={false}
        timeline={false}
        geocoder={false}
        homeButton={false}
        infoBox={false}
        sceneModePicker={false}
        navigationHelpButton={false}
        baseLayerPicker={false}
        onSelectedEntityChange={(entity) => {
          if (entity && entity.id) {
            const satData = satellites.find(s => s.name === entity.id);
            setSelectedSat(satData || null);
          } else {
            setSelectedSat(null);
          }
        }}
      >
        {/* Houston Radar Dome */}
        <Entity position={Cartesian3.fromDegrees(-95.3698, 29.7604, 0)}>
          <EllipseGraphics
            semiMajorAxis={500000.0} // 500km threat radius
            semiMinorAxis={500000.0}
            material={Color.RED.withAlpha(0.2)}
            outline={true}
            outlineColor={Color.RED}
          />
        </Entity>

        <ScreenSpaceEventHandler>
          <ScreenSpaceEvent
            type={ScreenSpaceEventType.LEFT_CLICK}
            action={(movement) => {
              // TypeScript Shield: Only proceed if this specific movement has a 'position'
              if ("position" in movement && movement.position) {
                const viewer = viewerRef.current?.cesiumElement;
                if (viewer) {
                  // Now TypeScript knows movement.position is 100% safe to use
                  const pickedObject = viewer.scene.pick(movement.position);

                  if (!pickedObject) {
                    setSelectedSat(null);
                    viewer.camera.flyHome(1.5);
                  }
                }
              }
            }}
          />
        </ScreenSpaceEventHandler>

        {/* WE FIXED THE SIZE AND COLOR CRASH HERE */}
        {satellites
          .filter((sat) => filter === "all" || sat.type === filter)
          .map((sat) => (
            <Entity
              key={sat.id}
              id={sat.id}
              position={sat.position}
              name={sat.name}
              onClick={() => {
                // 1. Set the sidebar target
                setSelectedSat(sat);

                // 2. Execute the Top-Down Drone Camera flight
                if (viewerRef.current?.cesiumElement) {
                  const target = viewerRef.current.cesiumElement.entities.getById(sat.id);
                  if (target) {
                    viewerRef.current.cesiumElement.flyTo(target, {
                      duration: 1.5,
                      offset: new HeadingPitchRange(
                        0, // North
                        CesiumMath.toRadians(-90), // Looking straight down
                        5000000 // 5,000km zoom level
                      ),
                    });
                  }
                }
              }}
            >
              <PointGraphics
                pixelSize={sat.type === "active" ? 6 : 4}
                color={sat.type === "active" ? Color.WHITE : Color.RED}
              />
            </Entity>
          ))}
        {/* Target Lock */}
        {selectedSat && (
          <Entity position={selectedSat.position}>
            <PointGraphics
              pixelSize={12}
              color={Color.CYAN}
            />
          </Entity>
        )}
      </Viewer>

      {/* ANIMATED CINEMATIC SIDEBAR */}
      <AnimatePresence>
        {selectedSat && (
          <motion.div
            initial={{ opacity: 0, x: 100, filter: "blur(10px)" }}
            animate={{ opacity: 1, x: 0, filter: "blur(0px)" }}
            exit={{ opacity: 0, x: 50, filter: "blur(10px)" }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="absolute top-4 left-3 bottom-4 w-[400px] z-50 flex flex-col p-8 overflow-y-auto rounded-3xl"
            style={{
              background: "linear-gradient(135deg, rgba(15, 23, 42, 0.8) 0%, rgba(0, 0, 0, 0.9) 100%)",
              backdropFilter: "blur(20px)",
              border: "1px solid rgba(255,255,255,0.08)",
              borderTop: "1px solid rgba(0, 255, 204, 0.3)", // Glowing top edge
              boxShadow: "0 20px 50px rgba(0,0,0,0.8), inset 0 1px 0 rgba(255,255,255,0.1)",
              color: "white"
            }}
          >
            {/* Top Navigation / Close Button */}
            <div className="flex justify-between items-start mb-10">
              <div className="flex flex-col">
                <span className="uppercase tracking-[0.3em] text-[10px] font-bold text-cyan-400 mb-1">Target Locked</span>
                <span className="text-gray-400 text-xs font-mono">NORAD ID: {selectedSat.name.split(' ')[selectedSat.name.split(' ').length - 1] || 'UNKNOWN'}</span>
              </div>
              <button
                onClick={() => {
                  setSelectedSat(null); // Clear the selection
                  if (viewerRef.current?.cesiumElement) {
                    viewerRef.current.cesiumElement.camera.flyHome(1.5); // Arc back to space
                  }
                }}
                className="p-1 hover:bg-slate-800 rounded-full transition-colors"
              >
                <X size={20} className="text-slate-400 hover:text-white" />
              </button>
            </div>

            {/* Header */}
            <h2 className="text-3xl font-light tracking-tight mb-2 pr-4">{selectedSat.name}</h2>
            <div className="flex items-center space-x-3 mb-10 border-b border-white/5 pb-6">
              <div className="w-2 h-2 rounded-full bg-red-500 animate-ping shadow-[0_0_15px_rgba(239,68,68,1)]"></div>
              <span className="text-xs text-red-400 uppercase tracking-widest font-semibold">Active Telemetry</span>
            </div>

            {/* Telemetry Grid */}
            <div className="space-y-6 mb-10">
              {/* Velocity Data Visualizer */}
              <div className="flex flex-col">
                <div className="flex justify-between items-center mb-2 text-gray-400">
                  <div className="flex items-center space-x-2">
                    <Activity size={16} className="text-cyan-500" />
                    <span className="text-xs uppercase tracking-widest font-semibold">Velocity</span>
                  </div>
                  <span className="text-sm font-mono text-cyan-400">{selectedSat.velocity.toFixed(2)} km/s</span>
                </div>
                {/* Visual Bar */}
                <div className="w-full h-1 bg-white/10 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${Math.min((selectedSat.velocity / 10) * 100, 100)}%` }}
                    transition={{ duration: 1, delay: 0.2 }}
                    className="h-full bg-cyan-400 shadow-[0_0_10px_#00ffcc]"
                  />
                </div>
              </div>

              {/* Altitude Data Visualizer */}
              <div className="flex flex-col">
                <div className="flex justify-between items-center mb-2 text-gray-400">
                  <div className="flex items-center space-x-2">
                    <Mountain size={16} className="text-emerald-500" />
                    <span className="text-xs uppercase tracking-widest font-semibold">Altitude</span>
                  </div>
                  <span className="text-sm font-mono text-emerald-400">{selectedSat.altitude.toFixed(2)} km</span>
                </div>
                {/* Visual Bar */}
                <div className="w-full h-1 bg-white/10 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${Math.min((selectedSat.altitude / 1000) * 100, 100)}%` }}
                    transition={{ duration: 1, delay: 0.4 }}
                    className="h-full bg-emerald-400 shadow-[0_0_10px_#34d399]"
                  />
                </div>
              </div>
            </div>

            {/* Community Impact Section */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              style={{ background: "rgba(99, 102, 241, 0.05)", border: "1px solid rgba(99, 102, 241, 0.1)" }}
              className="p-6 rounded-2xl mt-auto relative overflow-hidden"
            >
              {/* Decorative background glow */}
              <div className="absolute top-0 left-0 w-32 h-32 bg-indigo-500/10 blur-3xl rounded-full"></div>

              <div className="flex items-center space-x-2 mb-3 text-indigo-400 relative z-10">
                <ShieldAlert size={18} />
                <h3 className="text-xs font-bold uppercase tracking-[0.2em]">Community Impact</h3>
              </div>
              <p className="text-xs text-indigo-100/60 leading-relaxed font-light relative z-10">
                Tracking extreme weather patterns. Community leaders in Houston utilize this telemetry to predict localized flash flooding and identify urban heat islands.
              </p>
            </motion.div>

          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}