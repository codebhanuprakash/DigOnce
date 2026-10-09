export default function Home() {
  return (
    <div className="flex min-h-screen flex-col bg-civic-slate text-civic-navy">
      {/* 1. Global Notice: Simulated Demo Environment */}
      <aside
        role="region"
        aria-label="Demonstration notice"
        className="border-b border-amber-300 bg-amber-50 px-4 py-2 text-center text-xs font-medium text-amber-900"
      >
        <span className="font-semibold uppercase tracking-wider text-amber-800 mr-2">Demonstration Environment</span>
        All project records, contractor allocations, and schedules are synthetic test scenarios. Basemap data © OpenStreetMap contributors, © CARTO.
      </aside>

      {/* 2. Top Navigation Bar */}
      <header className="sticky top-0 z-40 flex h-14 items-center justify-between border-b border-civic-border bg-white px-4 shadow-sm sm:px-6">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded bg-civic-blue text-sm font-bold text-white shadow-sm">
            DO
          </div>
          <div>
            <h1 className="text-base font-bold leading-none tracking-tight text-civic-navy">
              DigOnce
            </h1>
            <p className="text-[11px] font-normal text-slate-500">
              Chennai–Kancheepuram Civic Coordination
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <span className="hidden rounded-full border border-slate-200 bg-slate-50 px-2.5 py-0.5 text-[11px] font-semibold text-slate-600 sm:inline-block">
            Milestone 1 Active
          </span>
          <div className="flex rounded-md border border-slate-200 bg-slate-100 p-0.5 text-xs font-medium">
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
      <div className="flex flex-1 flex-col lg:flex-row overflow-hidden">
        {/* Left Sidebar: Project Explorer Placeholder */}
        <aside
          role="region"
          aria-label="Project Explorer"
          className="w-full border-b border-civic-border bg-white p-4 lg:w-96 lg:border-b-0 lg:border-r lg:overflow-y-auto"
        >
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Project Explorer
            </h2>
            <span className="rounded bg-blue-50 px-2 py-0.5 text-[11px] font-semibold text-civic-blue">
              Standby
            </span>
          </div>

          <div className="mt-4 space-y-3">
            <div className="rounded-lg border border-slate-200 bg-slate-50 p-3.5 text-xs text-slate-600">
              <p className="font-semibold text-slate-800">Repeat-Dig Conflict Engine</p>
              <p className="mt-1 leading-relaxed text-slate-500">
                Awaiting Milestone 2 domain dataset and deterministic evaluation logic.
              </p>
            </div>

            <div className="rounded-lg border border-slate-200 p-3.5 text-xs">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-slate-800">Agencies Supported</span>
                <span className="text-[11px] text-slate-400">5 Entities</span>
              </div>
              <div className="mt-2.5 flex flex-wrap gap-1.5">
                <span className="rounded bg-indigo-50 px-2 py-0.5 text-[11px] font-medium text-agency-gcc">
                  GCC (Roads)
                </span>
                <span className="rounded bg-sky-50 px-2 py-0.5 text-[11px] font-medium text-agency-cmwssb">
                  CMWSSB (Water)
                </span>
                <span className="rounded bg-orange-50 px-2 py-0.5 text-[11px] font-medium text-agency-tangedco">
                  TANGEDCO (Power)
                </span>
                <span className="rounded bg-purple-50 px-2 py-0.5 text-[11px] font-medium text-agency-cmrl">
                  CMRL (Metro)
                </span>
                <span className="rounded bg-teal-50 px-2 py-0.5 text-[11px] font-medium text-agency-telecom">
                  Telecom
                </span>
              </div>
            </div>
          </div>
        </aside>

        {/* Right Area: Interactive GIS Map Placeholder */}
        <main
          role="main"
          className="relative flex flex-1 flex-col items-center justify-center bg-slate-100 p-6"
        >
          <div className="w-full max-w-lg rounded-xl border border-slate-200 bg-white p-6 text-center shadow-xs">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-blue-50 text-civic-blue">
              <svg
                className="h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7"
                />
              </svg>
            </div>
            <h3 className="mt-3 text-sm font-bold text-civic-navy">
              Interactive GIS Canvas
            </h3>
            <p className="mt-1 text-xs text-slate-500">
              Chennai–Kancheepuram corridor coordinate target: <code className="rounded bg-slate-100 px-1 py-0.5 font-mono text-[11px] text-slate-700">[13.0827, 80.2707]</code>.
            </p>
            <div className="mt-4 rounded-md border border-dashed border-slate-300 bg-slate-50 p-3 text-[11px] text-slate-500">
              Leaflet dynamic map rendering will be integrated in Milestone 3 with OpenStreetMap / CARTO Positron tile layers and agency polylines.
            </div>
          </div>

          {/* Map Attribution Bar */}
          <footer className="absolute bottom-2 right-3 text-[10px] text-slate-400">
            Map data © <span className="underline">OpenStreetMap</span> contributors, © <span className="underline">CARTO</span>
          </footer>
        </main>
      </div>
    </div>
  );
}
