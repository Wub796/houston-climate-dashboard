import * as satellite from "satellite.js";
import { X, Activity, Mountain, ShieldAlert } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect, useRef } from "react";
import { CesiumComponentRef } from "resium";
import { Viewer as CesiumViewer } from "cesium";
import { Viewer, Entity, PointGraphics, ScreenSpaceEventHandler, ScreenSpaceEvent } from "resium";
import { Cartesian3, Color, ScreenSpaceEventType } from "cesium";

// Bypass local web workers
// 1. Safely tell TypeScript that our window object has a Cesium property
declare global {
  interface Window {
    CESIUM_BASE_URL: string;
  }
}

// 2. Set the base URL to your hyper-fast local public folder
if (typeof window !== "undefined") {
  window.CESIUM_BASE_URL = "/cesium";
}

// 1. Define the exact shape of your satellite data to banish the 'any' type
export interface SatelliteData {
  id: string;   // <-- Add this new field
  name: string;
  position: Cartesian3;
  altitude: number;
  velocity: number;
}
export default function Globe() {
  // 2. Apply the strict interface to your state hooks
  const [satellites, setSatellites] = useState<SatelliteData[]>([]);
  const [selectedSat, setSelectedSat] = useState<SatelliteData | null>(null);

  const viewerRef = useRef<CesiumComponentRef<CesiumViewer>>(null);

  useEffect(() => {
    fetch("https://celestrak.org/NORAD/elements/weather.txt")
      .then((res) => res.text())
      .then((data) => {
        const lines = data.split("\n");
        const sats: SatelliteData[] = [];
        const now = new Date();
        const gmst = satellite.gstime(now);
        
        // NEW: Create a registry to track duplicate names
        const seenIds = new Set<string>();

        for (let i = 0; i < lines.length - 2; i += 3) {
          const name = lines[i].trim();
          const tle1 = lines[i + 1].trim();
          const tle2 = lines[i + 2].trim();

          try {
            const satrec = satellite.twoline2satrec(tle1, tle2);
            const positionAndVelocity = satellite.propagate(satrec, now);
            const positionEci = positionAndVelocity.position;
            const velocityEci = positionAndVelocity.velocity;

            if (typeof positionEci !== "boolean" && positionEci && !isNaN(positionEci.x)) {
              const positionEcf = satellite.eciToEcf(positionEci, gmst);
              const x = positionEcf.x * 1000;
              const y = positionEcf.y * 1000;
              const z = positionEcf.z * 1000;

              const geodetic = satellite.eciToGeodetic(positionEci, gmst);
              const altitude = geodetic.height;

              const velocity = Math.sqrt(
                Math.pow(velocityEci.x, 2) + Math.pow(velocityEci.y, 2) + Math.pow(velocityEci.z, 2)
              );

              // NEW: Guarantee a unique ID
              let uniqueId = name;
              if (seenIds.has(uniqueId)) {
                uniqueId = `${name}-${i}`; // Attach the line number to duplicates
              }
              seenIds.add(uniqueId);

              sats.push({
                id: uniqueId, // Pass the safe unique ID
                name,         // Keep the original clean name for the UI
                position: Cartesian3.fromElements(x, y, z),
                altitude: altitude,
                velocity: velocity
              });
            }
          } catch {
            console.warn(`Skipped corrupted TLE`);
          }
        }
        setSatellites(sats);
      });
  }, []);

  return (
    <div className="relative w-full h-full bg-black">
      <Viewer 
        ref={viewerRef} 
        full
        infoBox={false} 
        timeline={false} 
        animation={false}
        selectionIndicator={false}
        onSelectedEntityChange={(entity) => {
          if (entity && entity.id) {
            const satData = satellites.find(s => s.name === entity.id);
            setSelectedSat(satData || null);
          } else {
            setSelectedSat(null);
          }
        }}
      >

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
        {satellites.map((sat) => (
        <Entity 
            key={sat.id}
            id={sat.id}
            position={sat.position}
            name={sat.name}
            // We remove the (e) parameter completely
            onClick={() => {
            setSelectedSat(sat);
            
            const viewer = viewerRef.current?.cesiumElement;
            if (viewer) {
                // Find the exact 3D object in the engine using our guaranteed sat.id
                const targetEntity = viewer.entities.getById(sat.id);
                
                if (targetEntity) {
                viewer.flyTo(targetEntity, {
                    duration: 1.5,
                });
                }
            }
            }}
        >
            <PointGraphics pixelSize={5} color={Color.WHITE} />
        </Entity>
        ))}
        {/* Target Lock Circle */}
        {selectedSat && (
        <Entity position={selectedSat.position}>
            <PointGraphics 
            pixelSize={20} 
            color={Color.TRANSPARENT} 
            outlineColor={Color.CYAN} 
            outlineWidth={3} 
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
                    setSelectedSat(null);
                    // Command the camera to fly back to default orbit over 1.5 seconds
                    if (viewerRef.current?.cesiumElement) {
                    viewerRef.current.cesiumElement.camera.flyHome(1.5);
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