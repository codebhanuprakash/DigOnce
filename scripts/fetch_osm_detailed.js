const fs = require('fs');

async function queryRoad(name, queryBody) {
  const query = `
[out:json][timeout:30];
${queryBody}
out body geom;
`;
  console.log(`Querying for ${name}...`);
  const res = await fetch('https://overpass-api.de/api/interpreter', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'User-Agent': 'DigOnce-Civic-App/1.0 (contact@digonce.civic.in)'
    },
    body: 'data=' + encodeURIComponent(query.trim())
  });

  if (!res.ok) {
    throw new Error(`Failed to query ${name}: ${res.statusText}`);
  }
  return await res.json();
}

async function run() {
  const results = {};

  // 1. Anna Salai between Teynampet & Nandanam
  results.annaSalai = await queryRoad('Anna Salai', `
    way["highway"~"trunk|primary"]["name"~"Anna Salai"](13.015,80.220,13.050,80.255);
  `);

  // 2. Lattice Bridge Road (LB Road) in Adyar / Thiruvanmiyur
  results.lbRoad = await queryRoad('LB Road', `
    way["highway"~"primary|secondary|tertiary"]["name"~"Lattice Bridge|LB Road"](12.975,80.250,13.015,80.265);
  `);

  // 3. Gandhi Road in Kancheepuram
  results.gandhiRoad = await queryRoad('Gandhi Road Kancheepuram', `
    way["highway"]["name"~"Gandhi Road|Gandhi Salai"](12.820,79.690,12.855,79.730);
  `);

  fs.writeFileSync('scripts/osm_detailed_roads.json', JSON.stringify(results, null, 2));
  console.log('Saved all query results to scripts/osm_detailed_roads.json');
}

run().catch(console.error);
