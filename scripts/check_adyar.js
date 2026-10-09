const fs = require('fs');

async function checkAdyar() {
  const q = `
[out:json][timeout:25];
way["highway"~"primary|secondary"](around:2000,12.995,80.258);
out tags geom;
`;
  const res = await fetch('https://overpass-api.de/api/interpreter', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'User-Agent': 'DigOnce-Civic-App/1.0 (contact@digonce.civic.in)'
    },
    body: 'data=' + encodeURIComponent(q.trim())
  });
  if (!res.ok) throw new Error(res.statusText);
  const data = await res.json();
  const named = data.elements.filter(e => e.tags?.name);
  console.log(`Total named ways near Adyar: ${named.length}`);
  const byName = {};
  named.forEach(w => {
    byName[w.tags.name] = (byName[w.tags.name] || 0) + 1;
  });
  console.log('Names found:', byName);
  fs.writeFileSync('scripts/osm_adyar_ways.json', JSON.stringify(named, null, 2));
}

checkAdyar().catch(console.error);
