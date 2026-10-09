const fs = require('fs');

async function queryOverpass(queryName, bbox, filter) {
  const query = `
[out:json][timeout:25];
way${filter}(${bbox});
out geom;
`;
  console.log(`Querying ${queryName}...`);
  const res = await fetch('https://overpass-api.de/api/interpreter', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'User-Agent': 'DigOnce-Civic-App/1.0 (contact@digonce.civic.in)'
    },
    body: 'data=' + encodeURIComponent(query.trim())
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}: ${res.statusText}`);
  const json = await res.json();
  console.log(`Got ${json.elements?.length || 0} elements for ${queryName}`);
  return json.elements;
}

async function run() {
  // Anna Salai between Teynampet & Nandanam
  const annaWays = await queryOverpass('Anna Salai', '13.020,80.225,13.045,80.250', '["highway"~"primary|trunk"]["name"~"Anna Salai"]');
  fs.writeFileSync('scripts/osm_anna_salai.json', JSON.stringify(annaWays, null, 2));

  // LB Road between Adyar & Thiruvanmiyur
  const lbWays = await queryOverpass('LB Road', '12.980,80.250,13.010,80.265', '["highway"]["name"~"Lattice Bridge"]');
  fs.writeFileSync('scripts/osm_lb_road.json', JSON.stringify(lbWays, null, 2));

  // Gandhi Road in Kancheepuram
  const gandhiWays = await queryOverpass('Gandhi Road', '12.830,79.700,12.845,79.720', '["highway"]["name"~"Gandhi Road"]');
  fs.writeFileSync('scripts/osm_gandhi_road.json', JSON.stringify(gandhiWays, null, 2));

  console.log('Finished queries.');
}

run().catch(console.error);
