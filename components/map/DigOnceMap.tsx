'use client';

import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import { RoadSegment, PublicWorkProject, ConflictFinding, AgencyType } from '@/lib/types';

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
  GCC: '#4338CA',      // Indigo
  CMWSSB: '#0284C7',   // Sky Blue
  TANGEDCO: '#EA580C', // Orange
  CMRL: '#7E22CE',     // Purple
  TELECOM: '#0D9488',  // Teal
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
  const layersGroupRef = useRef<L.LayerGroup | null>(null);
  const [tileError, setTileError] = useState(false);

  // Validate coordinates before using
  const isValidCoord = (lat: unknown, lng: unknown): boolean => {
    return (
      typeof lat === 'number' &&
      !isNaN(lat) &&
      lat >= -90 &&
      lat <= 90 &&
      typeof lng === 'number' &&
      !isNaN(lng) &&
      lng >= -180 &&
      lng <= 180
    );
  };

  // 1. Initialize Map instance once
  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;

    // Center on Chennai–Kancheepuram corridor: [13.04, 80.15], zoom 11
    const map = L.map(mapContainerRef.current, {
      center: [13.04, 80.15],
      zoom: 11,
      minZoom: 9,
      maxZoom: 18,
      zoomControl: true,
      attributionControl: false, // We render a customized accessible attribution
    });

    // High performance, free public tile layer (CartoDB Positron with OSM fallback)
    const tileLayer = L.tileLayer(
      'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png',
      {
        subdomains: 'abcd',
        maxZoom: 19,
      }
    );

    tileLayer.on('tileerror', () => {
      setTileError(true);
    });

    tileLayer.addTo(map);

    const layersGroup = L.layerGroup().addTo(map);
    layersGroupRef.current = layersGroup;
    mapInstanceRef.current = map;

    return () => {
      map.remove();
      mapInstanceRef.current = null;
      layersGroupRef.current = null;
    };
  }, []);

  // 2. Render Polylines, Markers, and Conflict Highlights whenever data or selection changes
  useEffect(() => {
    const map = mapInstanceRef.current;
    const group = layersGroupRef.current;
    if (!map || !group) return;

    group.clearLayers();

    // Set of project IDs involved in active conflicts
    const conflictProjectIds = new Set<string>();
    const conflictingRoadIds = new Set<string>();
    for (const c of conflicts) {
      conflictProjectIds.add(c.projectAId);
      conflictProjectIds.add(c.projectBId);
      conflictingRoadIds.add(c.roadId);
    }

    const boundsLatLngs: L.LatLngTuple[] = [];

    // A. Render Road Segments
    for (const road of roads) {
      const validPoints: L.LatLngTuple[] = road.coordinates
        .filter((c) => isValidCoord(c.lat, c.lng))
        .map((c) => [c.lat, c.lng]);

      if (validPoints.length >= 2) {
        boundsLatLngs.push(...validPoints);

        const isRoadInConflict = conflictingRoadIds.has(road.id);
        const polyline = L.polyline(validPoints, {
          color: isRoadInConflict ? '#DC2626' : '#64748B',
          weight: isRoadInConflict ? 5 : 4,
          opacity: isRoadInConflict ? 0.9 : 0.65,
          dashArray: isRoadInConflict ? '8, 6' : undefined,
        });

        polyline.bindTooltip(
          `<strong>${road.name}</strong><br/><span style="font-size:11px;color:#64748B">${road.zone} · Ward ${road.wardNumber}</span>`,
          { sticky: true }
        );

        polyline.addTo(group);
      }
    }

    // B. Render Projects
    for (const project of projects) {
      const hasConflict = conflictProjectIds.has(project.id);
      const isSelected = selectedProjectId === project.id;
      const agencyColor = AGENCY_HEX_MAP[project.agency] || '#1D4ED8';

      // 1) Render Project Polyline if it has geometry
      const projPoints: L.LatLngTuple[] = project.coordinates
        .filter((c) => isValidCoord(c.lat, c.lng))
        .map((c) => [c.lat, c.lng]);

      if (projPoints.length >= 2) {
        boundsLatLngs.push(...projPoints);

        const projPolyline = L.polyline(projPoints, {
          color: isSelected ? '#1D4ED8' : hasConflict ? '#DC2626' : agencyColor,
          weight: isSelected ? 8 : hasConflict ? 6 : 5,
          opacity: 0.9,
          dashArray: hasConflict ? '6, 4' : undefined,
        });

        projPolyline.on('click', () => {
          onSelectProject(project.id);
        });

        projPolyline.addTo(group);
      }

      // 2) Render Project Marker Pin at the first valid point
      if (projPoints.length > 0) {
        const pinPos = projPoints[0];
        const pinHtml = `
          <div class="agency-marker-pin ${hasConflict ? 'in-conflict' : ''}" style="background-color: ${agencyColor}; width: ${isSelected ? '28px' : '22px'}; height: ${isSelected ? '28px' : '22px'};">
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

    // C. Fit Bounds to Chennai–Kancheepuram points on initial load if within reasonable range
    if (boundsLatLngs.length > 0 && !selectedProjectId && !selectedConflictId) {
      const bounds = L.latLngBounds(boundsLatLngs);
      map.fitBounds(bounds, { padding: [40, 40], maxZoom: 13 });
    }
  }, [roads, projects, conflicts, selectedProjectId, selectedConflictId, onSelectProject]);

  // 3. Pan and focus when a project or conflict is selected
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
          map.flyTo(pts[0], 14, { duration: 0.8 });
        }
      }
    } else if (selectedConflictId) {
      const conflict = conflicts.find((c) => c.id === selectedConflictId);
      if (conflict) {
        const road = roads.find((r) => r.id === conflict.roadId);
        if (road && road.coordinates.length > 0) {
          const pts: L.LatLngTuple[] = road.coordinates
            .filter((c) => isValidCoord(c.lat, c.lng))
            .map((c) => [c.lat, c.lng]);
          if (pts.length > 0) {
            map.flyTo(pts[0], 14, { duration: 0.8 });
          }
        }
      }
    }
  }, [selectedProjectId, selectedConflictId, projects, conflicts, roads]);

  return (
    <div className="relative h-full w-full">
      {/* Map DOM Element */}
      <div ref={mapContainerRef} className="h-full w-full" aria-label="Interactive Map of Public Works" />

      {/* Tile Error Fallback Notice */}
      {tileError && (
        <div className="absolute top-3 left-3 z-30 max-w-sm rounded-lg border border-amber-300 bg-amber-50 p-3 text-xs text-amber-900 shadow-md">
          <p className="font-semibold text-amber-800">Map Tile Provider Warning</p>
          <p className="mt-1">
            Basemap tiles are experiencing latency. Vector road geometries and project coordinates remain operational. All project data is accessible in the sidebar.
          </p>
        </div>
      )}

      {/* Map Legend Overlay */}
      <div className="absolute bottom-6 left-3 z-20 rounded-lg border border-slate-200/90 bg-white/95 p-3 text-xs shadow-md backdrop-blur-xs">
        <p className="font-bold text-slate-800">Map Legend</p>
        <div className="mt-2 space-y-1.5 text-[11px]">
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
          <div className="pt-1 border-t border-slate-200 flex items-center gap-2">
            <span className="h-2.5 w-5 rounded-sm border border-dashed border-red-600 bg-red-100 inline-block" />
            <span className="font-semibold text-red-700">⚠️ Active Conflict / Repeat Dig</span>
          </div>
        </div>
      </div>

      {/* Mandatory Free Map Attribution Notice */}
      <div className="absolute bottom-1 right-2 z-20 rounded bg-white/80 px-2 py-0.5 text-[10px] text-slate-500 backdrop-blur-xs">
        © <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer" className="underline hover:text-slate-800">OpenStreetMap</a> contributors, © <a href="https://carto.com/attributions" target="_blank" rel="noopener noreferrer" className="underline hover:text-slate-800">CARTO</a>
      </div>
    </div>
  );
}
