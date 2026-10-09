'use client';

import React, { useMemo, useState } from 'react';
import dynamic from 'next/dynamic';
import { MOCK_PROJECTS, MOCK_ROAD_SEGMENTS } from '@/lib/mockData';
import { detectConflicts } from '@/lib/conflictEngine';
import { PublicWorkProject, ConflictFinding } from '@/lib/types';

// Dynamically load the Leaflet map with SSR disabled to prevent `window is not defined`
const DigOnceMap = dynamic(() => import('@/components/map/DigOnceMap'), {
  ssr: false,
  loading: () => (
    <div className="flex h-full w-full flex-col items-center justify-center bg-slate-100 p-6 text-center">
      <div className="h-8 w-8 animate-spin rounded-full border-3 border-civic-blue border-t-transparent" />
      <p className="mt-3 text-xs font-semibold text-slate-700">Loading Geospatial Engine...</p>
      <p className="text-[11px] text-slate-400">Centering Chennai–Kancheepuram corridor</p>
    </div>
  ),
});

export default function Home() {
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [selectedConflictId, setSelectedConflictId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'PROJECTS' | 'CONFLICTS'>('PROJECTS');

  // Evaluate conflicts deterministically using the canonical engine
  const engineResult = useMemo(() => {
    return detectConflicts(MOCK_PROJECTS);
  }, []);

  const conflicts = engineResult.conflicts;
  const projects = MOCK_PROJECTS;
  const roads = MOCK_ROAD_SEGMENTS;

  // Selected entities for contextual inspector
  const selectedProject: PublicWorkProject | undefined = useMemo(() => {
    return projects.find((p) => p.id === selectedProjectId);
  }, [projects, selectedProjectId]);

  const selectedConflict: ConflictFinding | undefined = useMemo(() => {
    return conflicts.find((c) => c.id === selectedConflictId);
  }, [conflicts, selectedConflictId]);

  const handleSelectProject = (id: string) => {
    setSelectedProjectId(id);
    setSelectedConflictId(null);
  };

  const handleSelectConflict = (id: string) => {
    setSelectedConflictId(id);
    setSelectedProjectId(null);
  };

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-civic-slate text-civic-navy">
      {/* 1. Global Notice: Simulated Demo Environment */}
      <aside
        role="region"
        aria-label="Demonstration notice"
        className="flex items-center justify-between border-b border-amber-300 bg-amber-50 px-4 py-1.5 text-xs text-amber-900"
      >
        <div className="truncate">
          <span className="mr-2 font-bold uppercase tracking-wider text-amber-800">Demonstration Environment:</span>
          <span>Project records and schedules are synthetic test scenarios. Basemap data © OpenStreetMap contributors, © CARTO.</span>
        </div>
        <span className="shrink-0 rounded bg-amber-200/80 px-2 py-0.5 text-[10px] font-semibold text-amber-900">
          Simulated Data
        </span>
      </aside>

      {/* 2. Top Navigation Bar */}
      <header className="flex h-13 shrink-0 items-center justify-between border-b border-civic-border bg-white px-4 shadow-2xs sm:px-6">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded bg-civic-blue text-sm font-bold text-white shadow-xs">
            DO
          </div>
          <div>
            <h1 className="text-base font-bold leading-none tracking-tight text-civic-navy">
              DigOnce
            </h1>
            <p className="text-[11px] font-normal text-slate-500">
              Chennai–Kancheepuram Civic Works Coordination Portal
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          <div className="flex items-center gap-1.5 rounded-full border border-red-200 bg-red-50 px-2.5 py-1 text-xs font-semibold text-red-700">
            <span className="h-2 w-2 rounded-full bg-red-600 animate-pulse" />
            <span>{conflicts.length} Repeat-Dig Conflicts</span>
          </div>
          <div className="hidden rounded-md border border-slate-200 bg-slate-100 p-0.5 text-xs font-medium sm:flex">
            <span className="rounded bg-white px-2.5 py-1 text-slate-900 shadow-xs">
              Official View
            </span>
            <span className="px-2.5 py-1 text-slate-500">
              Citizen View
            </span>
          </div>
        </div>
      </header>

      {/* 3. Main Persistent Responsive Workspace */}
      <div className="flex flex-1 flex-col overflow-hidden lg:flex-row">
        {/* Left Sidebar: Project & Conflict Explorer */}
        <aside
          role="region"
          aria-label="Project and Conflict Explorer"
          className="flex w-full flex-col border-b border-civic-border bg-white lg:w-96 lg:border-b-0 lg:border-r"
        >
          {/* Tabs: Projects vs Conflicts */}
          <div className="flex border-b border-slate-200 bg-slate-50 text-xs font-semibold">
            <button
              onClick={() => setActiveTab('PROJECTS')}
              className={`flex-1 py-2.5 text-center transition-colors ${
                activeTab === 'PROJECTS'
                  ? 'border-b-2 border-civic-blue bg-white text-civic-blue'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Public Projects ({projects.length})
            </button>
            <button
              onClick={() => setActiveTab('CONFLICTS')}
              className={`flex-1 py-2.5 text-center transition-colors ${
                activeTab === 'CONFLICTS'
                  ? 'border-b-2 border-red-600 bg-white text-red-700'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Conflict Alerts ({conflicts.length})
            </button>
          </div>

          {/* List Content */}
          <div className="flex-1 overflow-y-auto p-3 space-y-2.5">
            {activeTab === 'PROJECTS' && (
              <>
                <p className="text-[11px] font-medium text-slate-500 px-1">
                  Click a project to center on the map and view details:
                </p>
                {projects.map((proj) => {
                  const isSelected = selectedProjectId === proj.id;
                  const isInConflict = conflicts.some(
                    (c) => c.projectAId === proj.id || c.projectBId === proj.id
                  );
                  const road = roads.find((r) => r.id === proj.roadId);

                  return (
                    <div
                      key={proj.id}
                      onClick={() => handleSelectProject(proj.id)}
                      className={`cursor-pointer rounded-lg border p-3 text-xs transition-all ${
                        isSelected
                          ? 'border-civic-blue bg-blue-50/60 shadow-sm'
                          : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-1">
                        <span className="font-bold text-slate-800 leading-snug">{proj.title}</span>
                        {isInConflict && (
                          <span className="shrink-0 rounded bg-red-100 px-1.5 py-0.5 text-[10px] font-bold text-red-700">
                            ⚠️ Conflict
                          </span>
                        )}
                      </div>
                      <div className="mt-1.5 flex flex-wrap items-center gap-1.5 text-[11px] text-slate-600">
                        <span className="rounded bg-slate-100 px-1.5 py-0.5 font-medium text-slate-700">
                          {proj.agency}
                        </span>
                        <span className="rounded bg-slate-100 px-1.5 py-0.5 text-slate-600">
                          {proj.category}
                        </span>
                        <span className="text-slate-400">·</span>
                        <span className="text-slate-500">{proj.status}</span>
                      </div>
                      <div className="mt-1 text-[11px] text-slate-500 truncate">
                        Road: {road ? road.name : proj.roadId}
                      </div>
                      <div className="mt-0.5 font-mono text-[10px] text-slate-400">
                        {proj.startDate} to {proj.endDate}
                      </div>
                    </div>
                  );
                })}
              </>
            )}

            {activeTab === 'CONFLICTS' && (
              <>
                <p className="text-[11px] font-medium text-slate-500 px-1">
                  Engine-detected repeat-dig coordination risks:
                </p>
                {conflicts.map((conflict) => {
                  const isSelected = selectedConflictId === conflict.id;
                  const road = roads.find((r) => r.id === conflict.roadId);

                  return (
                    <div
                      key={conflict.id}
                      onClick={() => handleSelectConflict(conflict.id)}
                      className={`cursor-pointer rounded-lg border p-3 text-xs transition-all ${
                        isSelected
                          ? 'border-red-600 bg-red-50/70 shadow-sm'
                          : 'border-red-200 bg-white hover:border-red-300 hover:bg-red-50/30'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="rounded bg-red-100 px-2 py-0.5 text-[10px] font-bold text-red-800">
                          {conflict.ruleType === 'CONCURRENT_WORK_COLLISION'
                            ? 'CRITICAL · Direct Collision'
                            : 'HIGH · Recent Resurfacing'}
                        </span>
                        <span className="text-[11px] font-bold text-red-700">
                          {conflict.temporalDetails.dateOverlap
                            ? `${conflict.temporalDetails.dateOverlap.overlapDays}d overlap`
                            : `${conflict.temporalDetails.resurfacingInterval?.elapsedDays}d post-paving`}
                        </span>
                      </div>

                      <p className="mt-2 font-semibold text-slate-800">
                        {road ? road.name : conflict.roadId}
                      </p>

                      <p className="mt-1 line-clamp-2 text-[11px] leading-relaxed text-slate-600">
                        {conflict.explanation}
                      </p>

                      <div className="mt-2 rounded bg-white/90 p-1.5 text-[10px] text-slate-500 border border-red-100">
                        Projects: <span className="font-mono font-medium">{conflict.projectAId}</span> &amp; <span className="font-mono font-medium">{conflict.projectBId}</span>
                      </div>
                    </div>
                  );
                })}
              </>
            )}
          </div>

          {/* Contextual Detail Card at bottom of sidebar if item is selected */}
          {(selectedProject || selectedConflict) && (
            <div className="border-t border-slate-200 bg-slate-50 p-3 max-h-56 overflow-y-auto">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-600">
                  {selectedProject ? 'Project Inspector' : 'Conflict Advisory Details'}
                </span>
                <button
                  onClick={() => {
                    setSelectedProjectId(null);
                    setSelectedConflictId(null);
                  }}
                  className="text-[11px] font-semibold text-slate-400 hover:text-slate-700"
                >
                  ✕ Close
                </button>
              </div>

              {selectedProject && (
                <div className="mt-2 space-y-1.5 text-xs">
                  <p className="font-bold text-slate-900">{selectedProject.title}</p>
                  <p className="text-[11px] text-slate-600">{selectedProject.description}</p>
                  <div className="grid grid-cols-2 gap-2 pt-1 text-[11px] text-slate-600">
                    <div>
                      <span className="text-slate-400">Contractor: </span>
                      <span className="font-medium text-slate-800">{selectedProject.contractor}</span>
                    </div>
                    <div>
                      <span className="text-slate-400">Status: </span>
                      <span className="font-medium text-slate-800">{selectedProject.status}</span>
                    </div>
                    <div>
                      <span className="text-slate-400">Subsegment: </span>
                      <span className="font-mono">{(selectedProject.segmentStartPct * 100).toFixed(0)}%–{(selectedProject.segmentEndPct * 100).toFixed(0)}%</span>
                    </div>
                    <div>
                      <span className="text-slate-400">Timeline: </span>
                      <span className="font-mono">{selectedProject.startDate}</span>
                    </div>
                  </div>
                </div>
              )}

              {selectedConflict && (
                <div className="mt-2 space-y-1.5 text-xs">
                  <p className="font-bold text-red-800">{selectedConflict.ruleType}</p>
                  <p className="text-[11px] text-slate-700 leading-relaxed">{selectedConflict.explanation}</p>
                  <div className="rounded border border-emerald-200 bg-emerald-50 p-2 text-[11px] text-emerald-900">
                    <p className="font-semibold text-emerald-800">Recommended Coordination Action:</p>
                    <p className="mt-0.5">{selectedConflict.recommendedAction}</p>
                  </div>
                  {selectedConflict.limitations && (
                    <p className="text-[10px] text-slate-400 italic">
                      Limitation: {selectedConflict.limitations[0]}
                    </p>
                  )}
                </div>
              )}
            </div>
          )}
        </aside>

        {/* Right Area: Interactive GIS Leaflet Canvas */}
        <main role="main" className="relative flex flex-1 flex-col overflow-hidden bg-slate-100">
          <DigOnceMap
            roads={roads}
            projects={projects}
            conflicts={conflicts}
            selectedProjectId={selectedProjectId}
            selectedConflictId={selectedConflictId}
            onSelectProject={handleSelectProject}
            onSelectConflict={handleSelectConflict}
          />
        </main>
      </div>
    </div>
  );
}
