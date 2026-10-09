const fs = require('fs');

const endpoints = [
  'https://overpass.kumi.systems/api/interpreter',
  'https://overpass-api.de/api/interpreter',
  'https://maps.mail.ru/osm/tools/overpass/api/interpreter'
];

async function tryQuery() {
  const query = `
[out:json][timeout:25];
(
  way["highway"~"primary|trunk"]["name"="Anna Salai"](13.023,80.230,13.045,80.252);
  way["highway"~"primary|secondary"]["name"~"Arcot Road"](13.048,80.200,13.055,80.225);
  way["highway"~"primary|secondary"]["name"~"Lattice Bridge Road"](12.980,80.255,13.010,80.265);
  way["highway"]["name"~"Gandhi Road"](12.830,79.700,12.845,79.720);
);
out body geom;
`;

  for (const ep of endpoints) {
    console.log(`Trying endpoint: ${ep}...`);
    try {
      const res = await fetch(ep, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'User-Agent': 'DigOnce-Civic-App/1.0 (contact@digonce.civic.in)'
        },
        body: 'data=' + encodeURIComponent(query.trim())
      });

      if (res.ok) {
        const data = await res.json();
        console.log(`Success with ${ep}! Got ${data.elements ? data.elements.length : 0} elements.`);
        fs.writeFileSync('scripts/osm_raw_roads.json', JSON.stringify(data, null, 2));
        return;
      } else {
        console.warn(`${ep} returned status ${res.status}: ${res.statusText}`);
      }
    } catch (err) {
      console.warn(`${ep} failed:`, err.message);
    }
  }
}

tryQuery();
