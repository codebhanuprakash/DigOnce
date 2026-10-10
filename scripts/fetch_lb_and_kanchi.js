const fs = require('fs');

async function queryOverpass(query) {
  const res = await fetch('https://overpass-api.de/api/interpreter', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'User-Agent': 'DigOnce-Civic-App/1.0 (https://github.com/digonce-project/digonce)'
    },
    body: 'data=' + encodeURIComponent(query.trim())
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}: ${res.statusText}`);
  return await res.json();
}

async function run() {
  // Query 1: LB Road (Dr Muthulakshmi Salai / Lattice Bridge Road)
  const qLB = `
[out:json][timeout:25];
way["highway"~"primary|secondary"](around:2000,12.992,80.258)["name"~"Dr Muthulakshmi Salai|Lattice Bridge"];
out body geom;
`;
  console.log('Querying LB Road...');
  const lbData = await queryOverpass(qLB);
  fs.writeFileSync('scripts/osm_lb_resolved.json', JSON.stringify(lbData.elements, null, 2));
  console.log(`Saved ${lbData.elements.length} ways for LB Road.`);

  // Query 2: Kancheepuram major roads (e.g. Raja Street, Gandhi Road, or Chengalpattu-Kancheepuram Highway)
  const qKanchi = `
[out:json][timeout:25];
way["highway"~"primary|secondary|tertiary"](12.825,79.695,12.845,79.725);
out body geom;
`;
  console.log('Querying Kancheepuram roads...');
  const kanchiData = await queryOverpass(qKanchi);
  fs.writeFileSync('scripts/osm_kanchi_resolved.json', JSON.stringify(kanchiData.elements, null, 2));
  console.log(`Saved ${kanchiData.elements.length} ways for Kancheepuram.`);
}

run().catch(console.error);
