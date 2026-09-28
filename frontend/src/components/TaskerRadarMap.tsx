"use client";

import React, { useEffect, useRef, useState } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import { AlertCircle, Navigation, Zap, Loader2, MapPin } from "lucide-react";
import { TaskItem } from "./TaskCard";

// Mapbox Public Access Token from environment
const MAPBOX_TOKEN =
  process.env.NEXT_PUBLIC_MAPBOX_TOKEN?.trim() || "";

// Fallback default placeholder and Open Carto Dark style for when Mapbox token is not configured
const PUBLIC_FALLBACK_TOKEN = "pk.placeholder";

const CARTO_DARK_STYLE: any = {
  version: 8,
  sources: {
    "carto-dark": {
      type: "raster",
      tiles: [
        "https://a.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}@2x.png",
        "https://b.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}@2x.png",
        "https://c.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}@2x.png",
        "https://d.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}@2x.png",
      ],
      tileSize: 256,
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>',
    },
  },
  layers: [
    {
      id: "carto-dark-layer",
      type: "raster",
      source: "carto-dark",
      minzoom: 0,
      maxzoom: 22,
    },
  ],
};

// Fallback Default Coordinates: Delhi, India
const DEFAULT_LAT = 28.6139;
const DEFAULT_LNG = 77.209;
const DEFAULT_ZOOM = 12;

interface TaskerRadarMapProps {
  tasks: TaskItem[];
  userLocation?: { latitude: number; longitude: number } | null;
  radiusKm?: number;
  onSelectTask?: (task: TaskItem) => void;
}

export const TaskerRadarMap: React.FC<TaskerRadarMapProps> = ({
  tasks,
  userLocation,
  radiusKm = 5,
  onSelectTask,
}) => {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const markersRef = useRef<mapboxgl.Marker[]>([]);
  const userMarkerRef = useRef<mapboxgl.Marker | null>(null);

  const [mapLoaded, setMapLoaded] = useState(false);
  const [isFallbackMode, setIsFallbackMode] = useState(false);

  const centerLat = userLocation?.latitude ?? DEFAULT_LAT;
  const centerLng = userLocation?.longitude ?? DEFAULT_LNG;

  useEffect(() => {
    if (!mapContainerRef.current) return;

    const hasCustomToken = Boolean(MAPBOX_TOKEN);
    mapboxgl.accessToken = hasCustomToken ? MAPBOX_TOKEN : PUBLIC_FALLBACK_TOKEN;
    const initialStyle = hasCustomToken
      ? "mapbox://styles/mapbox/navigation-night-v1"
      : CARTO_DARK_STYLE;

    setIsFallbackMode(!hasCustomToken);

    // Initialize Mapbox Map
    const map = new mapboxgl.Map({
      container: mapContainerRef.current,
      style: initialStyle,
      center: [centerLng, centerLat],
      zoom: DEFAULT_ZOOM,
      attributionControl: false,
    });

    map.addControl(
      new mapboxgl.NavigationControl({ showCompass: true, visualizePitch: true }),
      "top-right"
    );

    map.on("load", () => {
      setMapLoaded(true);
    });

    map.on("error", (e) => {
      console.warn("Mapbox GL event error:", e);
      if (
        e.error?.message?.includes("forbidden") ||
        e.error?.message?.includes("unauthorized")
      ) {
        // Switch to open Carto Dark fallback if custom token fails
        try {
          map.setStyle(CARTO_DARK_STYLE);
          setIsFallbackMode(true);
        } catch (err) {
          console.error("Failed to switch to fallback style:", err);
        }
      }
    });

    mapRef.current = map;

    return () => {
      markersRef.current.forEach((marker) => marker.remove());
      if (userMarkerRef.current) userMarkerRef.current.remove();
      map.remove();
      mapRef.current = null;
    };
  }, []);

  // Update Center when user coordinates change
  useEffect(() => {
    if (!mapRef.current || !mapLoaded) return;
    mapRef.current.easeTo({
      center: [centerLng, centerLat],
      zoom: DEFAULT_ZOOM,
      duration: 1200,
    });
  }, [centerLat, centerLng, mapLoaded]);

  // Render & Update Custom User Location Pulse Marker
  useEffect(() => {
    if (!mapRef.current || !mapLoaded) return;

    if (userMarkerRef.current) {
      userMarkerRef.current.remove();
    }

    const el = document.createElement("div");
    el.className = "relative flex items-center justify-center pointer-events-none";
    el.innerHTML = `
      <div class="w-10 h-10 rounded-full bg-yellow-400/25 animate-ping absolute"></div>
      <div class="w-6 h-6 rounded-full bg-yellow-400/50 flex items-center justify-center shadow-lg">
        <div class="w-3.5 h-3.5 rounded-full bg-yellow-400 border-2 border-zinc-950 shadow-honeyGlow"></div>
      </div>
    `;

    const marker = new mapboxgl.Marker({ element: el })
      .setLngLat([centerLng, centerLat])
      .addTo(mapRef.current);

    userMarkerRef.current = marker;
  }, [centerLat, centerLng, mapLoaded]);

  // Render & Update Task Pins and Popups
  useEffect(() => {
    if (!mapRef.current || !mapLoaded) return;

    // Clear existing task markers
    markersRef.current.forEach((m) => m.remove());
    markersRef.current = [];

    tasks.forEach((task, index) => {
      // Deterministic coordinates generation if lat/lng is missing
      let taskLat = task.distanceKm !== undefined ? centerLat + (index % 2 === 0 ? 0.008 : -0.008) * ((index + 1) * 0.7) : centerLat;
      let taskLng = task.distanceKm !== undefined ? centerLng + (index % 3 === 0 ? 0.009 : -0.009) * ((index + 1) * 0.7) : centerLng;

      // Custom HTML Marker Badge
      const el = document.createElement("div");
      el.className = "cursor-pointer group transform transition-transform hover:scale-110";
      el.innerHTML = `
        <div style="background-color: #FACC15; color: #18181B; font-weight: 900; font-size: 11px; padding: 4px 10px; border-radius: 9999px; border: 2px solid #18181B; box-shadow: 0 4px 14px rgba(250, 204, 21, 0.4); display: flex; align-items: center; gap: 4px;">
          <span>⚡ ₹${task.budget}</span>
        </div>
      `;

      // Create Custom Mapbox Popup
      const popupHtml = `
        <div style="font-family: inherit; padding: 4px; color: #18181B; min-width: 180px;">
          <div style="font-size: 9px; font-weight: 900; text-transform: uppercase; color: #854D0E; background: #FEF9C3; display: inline-block; padding: 2px 6px; border-radius: 4px; margin-bottom: 4px;">
            ${task.category}
          </div>
          <h4 style="font-size: 13px; font-weight: 800; margin: 0 0 4px 0; line-height: 1.2;">
            ${task.title}
          </h4>
          <p style="font-size: 11px; color: #52525B; margin: 0 0 6px 0;">
            📍 ${task.location} ${task.distanceKm ? `(${task.distanceKm.toFixed(1)} km away)` : ""}
          </p>
          <div style="display: flex; align-items: center; justify-content: space-between; border-top: 1px solid #E4E4E7; padding-top: 6px; margin-top: 6px;">
            <span style="font-size: 13px; font-weight: 900; color: #18181B;">₹${task.budget}</span>
            <button id="bid-btn-${task.id}" style="background: #FACC15; color: #18181B; font-size: 11px; font-weight: 900; border: none; padding: 4px 10px; border-radius: 8px; cursor: pointer;">
              Apply Now ⚡
            </button>
          </div>
        </div>
      `;

      const popup = new mapboxgl.Popup({
        offset: 25,
        closeButton: true,
        closeOnClick: false,
        className: "bumblebee-mapbox-popup",
      }).setHTML(popupHtml);

      popup.on("open", () => {
        const btn = document.getElementById(`bid-btn-${task.id}`);
        if (btn) {
          btn.addEventListener("click", () => {
            if (onSelectTask) {
              onSelectTask(task);
            }
          });
        }
      });

      const marker = new mapboxgl.Marker({ element: el })
        .setLngLat([taskLng, taskLat])
        .setPopup(popup)
        .addTo(mapRef.current!);

      markersRef.current.push(marker);
    });
  }, [tasks, mapLoaded, centerLat, centerLng, onSelectTask]);

  const handleResetCenter = () => {
    if (!mapRef.current) return;
    mapRef.current.flyTo({
      center: [centerLng, centerLat],
      zoom: DEFAULT_ZOOM,
      essential: true,
    });
  };

  return (
    <div className="w-full h-[500px] rounded-2xl overflow-hidden relative border-2 border-yellow-400/30 bg-zinc-950 shadow-2xl">
      {/* Mapbox Canvas Container (Explicit fixed height prevents 0px bug) */}
      <div ref={mapContainerRef} className="w-full h-full" />

      {/* Loading Overlay */}
      {!mapLoaded && (
        <div className="absolute inset-0 bg-zinc-950/80 backdrop-blur-sm flex flex-col items-center justify-center gap-2 z-30">
          <Loader2 className="w-8 h-8 text-yellow-400 animate-spin" />
          <span className="text-xs font-bold text-yellow-400">
            Initializing Radar Engine...
          </span>
        </div>
      )}

      {/* Floating Status Pill (Tasker Mode Radar) */}
      <div className="absolute bottom-4 left-4 z-20 bg-zinc-950/90 backdrop-blur-md text-white px-3.5 py-2 rounded-2xl border border-yellow-400/40 text-xs font-bold flex items-center gap-2.5 shadow-xl">
        <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
        <span>
          Live Radar: <strong className="text-yellow-400">{tasks.length} Gigs</strong> in {radiusKm} km Range
        </span>
      </div>

      {/* Center On Me Quick Trigger */}
      <button
        type="button"
        onClick={handleResetCenter}
        title="Recenter on My Location"
        className="absolute top-4 left-4 z-20 bg-zinc-900/90 hover:bg-yellow-400 hover:text-zinc-950 text-white p-2.5 rounded-2xl border border-zinc-800 shadow-xl transition-all flex items-center gap-1.5 text-xs font-black"
      >
        <Navigation className="w-3.5 h-3.5" />
        <span className="hidden sm:inline">Center On Me</span>
      </button>

      {/* Fallback Tile Notice (if no custom Mapbox token is set) */}
      {isFallbackMode && (
        <div className="absolute top-4 right-14 z-20 hidden md:flex items-center gap-1.5 bg-zinc-950/80 backdrop-blur-sm border border-zinc-800 text-[10px] text-zinc-400 px-2.5 py-1 rounded-full">
          <span>Dark Tile Mode (Open Carto)</span>
        </div>
      )}
    </div>
  );
};

export default TaskerRadarMap;
