const fs = require('fs');

async function checkKanchi() {
  const q = `
[out:json][timeout:25];
way["highway"](around:800,12.836,79.708);
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
  const withNames = data.elements.filter(e => e.tags?.name);
  console.log(`Total ways with names near (12.836, 79.708): ${withNames.length}`);
  withNames.forEach(w => {
    console.log(`Way ${w.id}: ${w.tags.name} (${w.tags.highway}) - ${w.geometry?.length} pts`);
  });
  fs.writeFileSync('scripts/osm_kanchi_center.json', JSON.stringify(withNames, null, 2));
}

checkKanchi().catch(console.error);
