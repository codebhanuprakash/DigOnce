'use client';

import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import { RoadSegment, PublicWorkProject, ConflictFinding, AgencyType } from '@/lib/types';
import { interpolateSubPolyline } from '@/lib/geoUtils';

interface DigOnceMapProps {
  roads: RoadSegment[];
  projects: PublicWorkProject[];
  conflicts: ConflictFinding[];
  selectedProjectId: string | null;
  selectedConflictId: string | null;
  onSelectProject: (projectId: string) => void;
  onSelectConflict: (conflictId: string) => void;
}

const AGENCY_HEX_MAP: Record<AgencyType, string> = {
  GCC: '#312E81',      // Deep Indigo
  CMWSSB: '#0369A1',   // Deep Sky Blue
  TANGEDCO: '#C2410C', // Deep Orange
  CMRL: '#6B21A8',     // Deep Purple
  TELECOM: '#0F766E',  // Deep Teal
};

export default function DigOnceMap({
  roads,
  projects,
  conflicts,
  selectedProjectId,
  selectedConflictId,
  onSelectProject,
  onSelectConflict,
}: DigOnceMapProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const roadsLayerRef = useRef<L.LayerGroup | null>(null);
  const projectsLayerRef = useRef<L.LayerGroup | null>(null);
  const conflictsLayerRef = useRef<L.LayerGroup | null>(null);

  // Layer Visibility Controls
  const [showRoads, setShowRoads] = useState(true);
  const [showProjects, setShowProjects] = useState(true);
  const [showConflicts, setShowConflicts] = useState(true);
  const [tileError, setTileError] = useState(false);

  // Validate coordinates before using
  const isValidCoord = (lat: unknown, lng: unknown): boolean => {
    return (
      typeof lat === 'number' &&
      !isNaN(lat) &&
      isFinite(lat) &&
      lat >= -90 &&
      lat <= 90 &&
      typeof lng === 'number' &&
      !isNaN(lng) &&
      isFinite(lng) &&
      lng >= -180 &&
      lng <= 180
    );
  };

  // 1. Initialize Leaflet Map Instance
  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;

    // Corridor extent: Chennai–Kancheepuram corridor
    const map = L.map(mapContainerRef.current, {
      center: [13.01, 80.05],
      zoom: 11,
      minZoom: 9,
      maxZoom: 18,
      zoomControl: false, // Custom placed zoom control
      attributionControl: false,
    });

    // Clean OpenStreetMap standard tile layer
    const tileLayer = L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    });

    tileLayer.on('tileerror', () => {
      setTileError(true);
    });

    tileLayer.addTo(map);

    // Add scale bar (meters / km) for professional GIS inspection
    L.control.scale({ imperial: false, metric: true, position: 'bottomleft' }).addTo(map);

    // Add Zoom control at top-right
    L.control.zoom({ position: 'topright' }).addTo(map);

    // Dedicated layer groups for GIS hierarchy
    const rGroup = L.layerGroup().addTo(map);
    const pGroup = L.layerGroup().addTo(map);
    const cGroup = L.layerGroup().addTo(map);

    roadsLayerRef.current = rGroup;
    projectsLayerRef.current = pGroup;
    conflictsLayerRef.current = cGroup;
    mapInstanceRef.current = map;

    return () => {
      map.remove();
      mapInstanceRef.current = null;
      roadsLayerRef.current = null;
      projectsLayerRef.current = null;
      conflictsLayerRef.current = null;
    };
  }, []);

  // 2. Render Road Network Layer
  useEffect(() => {
    const group = roadsLayerRef.current;
    if (!group) return;
    group.clearLayers();

    if (!showRoads) return;

    for (const road of roads) {
      const validPoints: L.LatLngTuple[] = road.coordinates
        .filter((c) => isValidCoord(c.lat, c.lng))
        .map((c) => [c.lat, c.lng]);

      if (validPoints.length >= 2) {
        // Casing outline for crisp cartographic hierarchy
        const casing = L.polyline(validPoints, {
          color: '#94A3B8',
          weight: 6,
          opacity: 0.6,
          lineCap: 'round',
          lineJoin: 'round',
        });
        casing.addTo(group);

        const polyline = L.polyline(validPoints, {
          color: '#F8FAFC',
          weight: 4,
          opacity: 0.9,
          lineCap: 'round',
          lineJoin: 'round',
        });

        polyline.bindTooltip(
          `<div style="font-size:11px; font-family:sans-serif;">
            <strong style="color:#0F172A;">${road.name}</strong><br/>
            <span style="color:#64748B;">${road.zone} · Ward ${road.wardNumber}</span><br/>
            <span style="font-size:10px; color:#475569;">Length: ${(road.lengthMeters / 1000).toFixed(2)} km · Verified OSM Geometry</span>
          </div>`,
          { sticky: true }
        );

        polyline.addTo(group);
      }
    }
  }, [roads, showRoads]);

  // 3. Render Public Work Projects Layer (Overlays & Pins)
  useEffect(() => {
    const group = projectsLayerRef.current;
    if (!group) return;
    group.clearLayers();

    if (!showProjects) return;

    const conflictProjectIds = new Set<string>();
    for (const c of conflicts) {
      conflictProjectIds.add(c.projectAId);
      conflictProjectIds.add(c.projectBId);
    }

    for (const project of projects) {
      const hasConflict = conflictProjectIds.has(project.id);
      const isSelected = selectedProjectId === project.id;
      const agencyColor = AGENCY_HEX_MAP[project.agency] || '#1D4ED8';

      const projPoints: L.LatLngTuple[] = project.coordinates
        .filter((c) => isValidCoord(c.lat, c.lng))
        .map((c) => [c.lat, c.lng]);

      if (projPoints.length >= 2) {
        // Highlight casing if selected
        if (isSelected) {
          const selectionHalo = L.polyline(projPoints, {
            color: '#2563EB',
            weight: 12,
            opacity: 0.4,
            lineCap: 'round',
            lineJoin: 'round',
          });
          selectionHalo.addTo(group);
        }

        // Project work polyline derived from real road geometry
        const projPolyline = L.polyline(projPoints, {
          color: isSelected ? '#1E40AF' : agencyColor,
          weight: isSelected ? 7 : 5,
          opacity: isSelected ? 1.0 : 0.85,
          lineCap: 'round',
          lineJoin: 'round',
        });

        projPolyline.on('click', () => {
          onSelectProject(project.id);
        });

        projPolyline.bindTooltip(
          `<div style="font-size:11px; font-family:sans-serif;">
            <strong style="color:${agencyColor};">${project.title}</strong><br/>
            <span style="color:#334155;">Agency: ${project.agency} (${project.category})</span><br/>
            <span style="font-size:10px; color:#64748B;">Chainage: ${(project.segmentStartPct * 100).toFixed(0)}%–${(project.segmentEndPct * 100).toFixed(0)}% · ${project.status}</span>
          </div>`,
          { sticky: true }
        );

        projPolyline.addTo(group);
      }

      // Marker pin located at start coordinate of work segment
      if (projPoints.length > 0) {
        const pinPos = projPoints[0];
        const pinHtml = `
          <div class="agency-marker-pin ${hasConflict ? 'in-conflict' : ''} ${isSelected ? 'ring-2 ring-blue-600 ring-offset-2' : ''}"
               style="background-color: ${agencyColor}; width: ${isSelected ? '28px' : '22px'}; height: ${isSelected ? '28px' : '22px'};">
            ${hasConflict ? '⚠️' : project.agency.slice(0, 1)}
          </div>
        `;

        const icon = L.divIcon({
          className: 'custom-agency-pin',
          html: pinHtml,
          iconSize: [isSelected ? 28 : 22, isSelected ? 28 : 22],
          iconAnchor: [isSelected ? 14 : 11, isSelected ? 14 : 11],
        });

        const marker = L.marker(pinPos, { icon });

        marker.on('click', () => {
          onSelectProject(project.id);
        });

        marker.bindTooltip(
          `<strong>${project.title}</strong><br/><span style="font-size:11px;color:#475569">${project.agency} · ${project.category}</span>`,
          { direction: 'top', offset: [0, -10] }
        );

        marker.addTo(group);
      }
    }
  }, [projects, conflicts, selectedProjectId, showProjects, onSelectProject]);

  // 4. Render Repeat-Dig Conflict Overlays
  useEffect(() => {
    const group = conflictsLayerRef.current;
    if (!group) return;
    group.clearLayers();

    if (!showConflicts) return;

    for (const conflict of conflicts) {
      const road = roads.find((r) => r.id === conflict.roadId);
      const isConflictSelected = selectedConflictId === conflict.id;

      if (road && road.coordinates.length >= 2) {
        // True subsegment geometry calculated geodesically along canonical road
        const subsegmentCoords = interpolateSubPolyline(
          road.coordinates,
          conflict.subsegmentOverlap.startPct,
          conflict.subsegmentOverlap.endPct
        );

        const conflictLinePoints: L.LatLngTuple[] = subsegmentCoords.map((c) => [c.lat, c.lng]);

        if (conflictLinePoints.length >= 2) {
          // Yellow warning glow underneath
          const warningHalo = L.polyline(conflictLinePoints, {
            color: '#FEF08A',
            weight: isConflictSelected ? 16 : 12,
            opacity: 0.85,
            lineCap: 'round',
          });
          warningHalo.addTo(group);

          // Vivid warning dashed line representing exact shared corridor
          const conflictPoly = L.polyline(conflictLinePoints, {
            color: '#B91C1C', // Dark crimson
            weight: isConflictSelected ? 8 : 6,
            opacity: 1.0,
            dashArray: '8, 6',
            lineCap: 'round',
          });

          conflictPoly.on('click', () => {
            onSelectConflict(conflict.id);
          });

          conflictPoly.bindTooltip(
            `<div style="font-size:11px; font-family:sans-serif;">
              <strong style="color:#DC2626;">⚠️ Repeat-Dig Conflict Zone</strong><br/>
              <strong>${road.name}</strong><br/>
              <span>Exact Overlap: ${(conflict.subsegmentOverlap.startPct * 100).toFixed(0)}%–${(conflict.subsegmentOverlap.endPct * 100).toFixed(0)}% chainage</span><br/>
              <span style="font-size:10px; color:#64748B;">Rule: ${conflict.ruleType}</span>
            </div>`,
            { sticky: true }
          );

          conflictPoly.addTo(group);
        }
      }
    }
  }, [conflicts, roads, selectedConflictId, showConflicts, onSelectConflict]);

  // 5. Initial extent fit
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    if (!selectedProjectId && !selectedConflictId) {
      const allCoords: L.LatLngTuple[] = [];
      roads.forEach((r) => {
        r.coordinates.forEach((c) => {
          if (isValidCoord(c.lat, c.lng)) allCoords.push([c.lat, c.lng]);
        });
      });
      if (allCoords.length > 0) {
        const bounds = L.latLngBounds(allCoords);
        map.fitBounds(bounds, { padding: [50, 50], maxZoom: 13 });
      }
    }
  }, [roads, selectedProjectId, selectedConflictId]);

  // 6. Camera Focus on Selection
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    if (selectedProjectId) {
      const proj = projects.find((p) => p.id === selectedProjectId);
      if (proj && proj.coordinates.length > 0) {
        const pts: L.LatLngTuple[] = proj.coordinates
          .filter((c) => isValidCoord(c.lat, c.lng))
          .map((c) => [c.lat, c.lng]);
        if (pts.length > 0) {
          const bounds = L.latLngBounds(pts);
          map.fitBounds(bounds, { padding: [80, 80], maxZoom: 16 });
        }
      }
    } else if (selectedConflictId) {
      const conflict = conflicts.find((c) => c.id === selectedConflictId);
      if (conflict) {
        const road = roads.find((r) => r.id === conflict.roadId);
        if (road && road.coordinates.length >= 2) {
          const subPts = interpolateSubPolyline(
            road.coordinates,
            conflict.subsegmentOverlap.startPct,
            conflict.subsegmentOverlap.endPct
          );
          if (subPts.length > 0) {
            const bounds = L.latLngBounds(subPts.map((p) => [p.lat, p.lng]));
            map.fitBounds(bounds, { padding: [80, 80], maxZoom: 16 });
          }
        }
      }
    }
  }, [selectedProjectId, selectedConflictId, projects, conflicts, roads]);

  // Reset to full corridor demonstration view
  const handleResetCorridor = () => {
    const map = mapInstanceRef.current;
    if (!map) return;
    const allCoords: L.LatLngTuple[] = [];
    roads.forEach((r) => {
      r.coordinates.forEach((c) => {
        if (isValidCoord(c.lat, c.lng)) allCoords.push([c.lat, c.lng]);
      });
    });
    if (allCoords.length > 0) {
      const bounds = L.latLngBounds(allCoords);
      map.fitBounds(bounds, { padding: [50, 50], maxZoom: 13 });
    }
  };

  return (
    <div className="relative h-full w-full">
      {/* Map Canvas DOM */}
      <div ref={mapContainerRef} className="h-full w-full" aria-label="Interactive Map of Public Works" />

      {/* Layer Control Toolbar (GIS Workspace) */}
      <div
        data-testid="gis-layer-control"
        className="absolute top-3 left-3 z-20 flex flex-col gap-1.5 rounded-lg border border-slate-200/90 bg-white/95 p-2.5 text-xs shadow-md backdrop-blur-xs"
      >
        <div className="flex items-center justify-between pb-1 border-b border-slate-100">
          <span className="font-bold text-slate-800 text-[11px] uppercase tracking-wider">GIS Layers</span>
          <button
            onClick={handleResetCorridor}
            title="Reset to full corridor extent"
            className="rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-semibold text-slate-600 hover:bg-slate-200"
          >
            Reset Extent
          </button>
        </div>
        <label className="flex items-center gap-2 cursor-pointer text-slate-700 hover:text-slate-900">
          <input
            type="checkbox"
            checked={showRoads}
            onChange={(e) => setShowRoads(e.target.checked)}
            className="rounded text-civic-blue focus:ring-0"
          />
          <span>OSM Road Network ({roads.length})</span>
        </label>
        <label className="flex items-center gap-2 cursor-pointer text-slate-700 hover:text-slate-900">
          <input
            type="checkbox"
            checked={showProjects}
            onChange={(e) => setShowProjects(e.target.checked)}
            className="rounded text-civic-blue focus:ring-0"
          />
          <span>Public Projects ({projects.length})</span>
        </label>
        <label className="flex items-center gap-2 cursor-pointer text-slate-700 hover:text-slate-900">
          <input
            type="checkbox"
            checked={showConflicts}
            onChange={(e) => setShowConflicts(e.target.checked)}
            className="rounded text-red-600 focus:ring-0"
          />
          <span className="text-red-700 font-semibold">Detected Conflicts ({conflicts.length})</span>
        </label>
      </div>

      {/* Tile Error Fallback Notice */}
      {tileError && (
        <div className="absolute top-3 right-14 z-30 max-w-sm rounded-lg border border-amber-300 bg-amber-50 p-3 text-xs text-amber-900 shadow-md">
          <p className="font-semibold text-amber-800">Map Tile Notice</p>
          <p className="mt-1">
            Basemap tile server experiencing latency. Vector road geometries and project overlays remain operational.
          </p>
        </div>
      )}

      {/* Map Legend Overlay */}
      <div className="absolute bottom-6 left-3 z-20 rounded-lg border border-slate-200/90 bg-white/95 p-3 text-xs shadow-md backdrop-blur-xs max-w-xs">
        <p className="font-bold text-slate-800">Geospatial Legend</p>
        <p className="text-[10px] text-slate-500 mb-2">Real OSM road centerlines with synthetic work overlays</p>
        <div className="space-y-1.5 text-[11px]">
          <div className="flex items-center gap-2">
            <span className="h-2 w-5 rounded-xs border border-slate-400 bg-slate-100 inline-block" />
            <span className="text-slate-700">OSM Road Centerline (Real)</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="h-2.5 w-5 rounded-sm bg-agency-gcc inline-block" />
            <span className="text-slate-700">GCC Roads (Indigo)</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="h-2.5 w-5 rounded-sm bg-agency-cmwssb inline-block" />
            <span className="text-slate-700">CMWSSB Water (Sky)</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="h-2.5 w-5 rounded-sm bg-agency-tangedco inline-block" />
            <span className="text-slate-700">TANGEDCO Power (Orange)</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="h-2.5 w-5 rounded-sm bg-agency-cmrl inline-block" />
            <span className="text-slate-700">CMRL Metro (Purple)</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="h-2.5 w-5 rounded-sm bg-agency-telecom inline-block" />
            <span className="text-slate-700">Telecom Fiber (Teal)</span>
          </div>
          <div className="pt-1.5 border-t border-slate-200 flex items-center gap-2">
            <span className="h-2.5 w-5 rounded-sm border border-dashed border-red-700 bg-amber-200 inline-block" />
            <span className="font-semibold text-red-700">⚠️ Exact Overlapping Subsegment</span>
          </div>
        </div>
      </div>

      {/* Mandatory Free Map Attribution Notice */}
      <div className="absolute bottom-1 right-2 z-20 rounded bg-white/90 px-2 py-0.5 text-[10px] text-slate-500 backdrop-blur-xs">
        Map data &copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer" className="underline hover:text-slate-800">OpenStreetMap</a> contributors, ODbL
      </div>
    </div>
  );
}
