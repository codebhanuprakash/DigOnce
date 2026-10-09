const fs = require('fs');

function haversine(p1, p2) {
  const R = 6371000;
  const dLat = (p2.lat - p1.lat) * Math.PI / 180;
  const dLon = (p2.lng - p1.lng) * Math.PI / 180;
  const a = Math.sin(dLat/2)**2 + Math.cos(p1.lat*Math.PI/180)*Math.cos(p2.lat*Math.PI/180)*Math.sin(dLon/2)**2;
  return 2 * R * Math.asin(Math.sqrt(a));
}

function calcLength(pts) {
  let len = 0;
  for(let i=0; i<pts.length-1; i++) len += haversine(pts[i], pts[i+1]);
  return Math.round(len);
}

// 1. Anna Salai
const annaWays = JSON.parse(fs.readFileSync('scripts/osm_anna_salai.json'));
const anna102 = annaWays.find(x => x.id === 102457954);
const anna119 = annaWays.find(x => x.id === 1195527180);
const anna130 = annaWays.find(x => x.id === 1309829162);
const anna121 = annaWays.find(x => x.id === 1211074461);
const annaCoords = [
  ...anna102.geometry.map(p => ({ lat: p.lat, lng: p.lon })),
  { lat: anna119.geometry[1].lat, lng: anna119.geometry[1].lon },
  { lat: anna130.geometry[1].lat, lng: anna130.geometry[1].lon },
  ...anna121.geometry.slice(1).map(p => ({ lat: p.lat, lng: p.lon }))
];

// 2. Arcot Road
const arcotData = JSON.parse(fs.readFileSync('scripts/osm_raw_roads.json'));
const arcot27 = arcotData.elements.find(x => x.id === 27346902);
const arcot1092 = arcotData.elements.find(x => x.id === 1092250361);
const arcotCoords = [
  ...arcot27.geometry.map(p => ({ lat: p.lat, lng: p.lon })),
  ...arcot1092.geometry.slice(1).map(p => ({ lat: p.lat, lng: p.lon }))
];

// 3. Rajiv Gandhi Salai / OMR
const adyarWays = JSON.parse(fs.readFileSync('scripts/osm_adyar_ways.json'));
const omr95 = adyarWays.find(x => x.id === 95222407);
const omr293 = adyarWays.find(x => x.id === 1235214293);
const omr291 = adyarWays.find(x => x.id === 1235214291);
const omr899 = adyarWays.find(x => x.id === 1517503899);
const omr898 = adyarWays.find(x => x.id === 1517503898);
const omr900 = adyarWays.find(x => x.id === 1517503900);
const omr589 = adyarWays.find(x => x.id === 1235211589);
const omr954 = adyarWays.find(x => x.id === 1231030954);
const omrCoords = [
  ...omr95.geometry.map(p => ({ lat: p.lat, lng: p.lon })),
  ...omr293.geometry.slice(1).map(p => ({ lat: p.lat, lng: p.lon })),
  ...omr291.geometry.slice(1).map(p => ({ lat: p.lat, lng: p.lon })),
  ...omr899.geometry.slice(1).map(p => ({ lat: p.lat, lng: p.lon })),
  ...omr898.geometry.slice(1).map(p => ({ lat: p.lat, lng: p.lon })),
  ...omr900.geometry.slice(1).map(p => ({ lat: p.lat, lng: p.lon })),
  ...omr589.geometry.slice(1).map(p => ({ lat: p.lat, lng: p.lon })),
  ...omr954.geometry.slice(1).map(p => ({ lat: p.lat, lng: p.lon }))
];

// 4. Railway Road (Kancheepuram)
const kanchiData = JSON.parse(fs.readFileSync('scripts/osm_kanchi_center.json'));
const k48 = kanchiData.find(x => x.id === 48891297);
const k91 = kanchiData.find(x => x.id === 910309591);
const k15 = kanchiData.find(x => x.id === 1533440888);
const k90 = kanchiData.find(x => x.id === 910309590);
const kanchiCoords = [
  ...k48.geometry.map(p => ({ lat: p.lat, lng: p.lon })),
  { lat: k91.geometry[1].lat, lng: k91.geometry[1].lon },
  ...k15.geometry.slice(1).map(p => ({ lat: p.lat, lng: p.lon })),
  ...k90.geometry.slice(1).map(p => ({ lat: p.lat, lng: p.lon }))
];

const geojson = {
  type: "FeatureCollection",
  metadata: {
    dataset: "DigOnce Chennai-Kancheepuram Corridor Real Road Geometries",
    source: "OpenStreetMap (OSM) via Overpass API / OSM API v0.6",
    retrievalDate: "2026-10-10",
    attribution: "Map data © OpenStreetMap contributors",
    license: "Open Data Commons Open Database License (ODbL) 1.0",
    licenseUrl: "https://opendatacommons.org/licenses/odbl/1.0/"
  },
  features: [
    {
      type: "Feature",
      id: "RD-CH-09-ANNA-01",
      properties: {
        id: "RD-CH-09-ANNA-01",
        name: "Anna Salai (Teynampet to Nandanam)",
        wardNumber: 118,
        zone: "Zone IX (Teynampet)",
        lengthMeters: calcLength(annaCoords),
        osmWayIds: [102457954, 1195527180, 1309829162, 1211074461],
        highway: "primary",
        sourceAttribution: "OpenStreetMap © OpenStreetMap contributors, ODbL"
      },
      geometry: {
        type: "LineString",
        coordinates: annaCoords.map(c => [Number(c.lng.toFixed(7)), Number(c.lat.toFixed(7))])
      }
    },
    {
      type: "Feature",
      id: "RD-CH-10-ARCOT-02",
      properties: {
        id: "RD-CH-10-ARCOT-02",
        name: "Arcot Road (Kodambakkam to Vadapalani)",
        wardNumber: 130,
        zone: "Zone X (Kodambakkam)",
        lengthMeters: calcLength(arcotCoords),
        osmWayIds: [27346902, 1092250361],
        highway: "primary",
        sourceAttribution: "OpenStreetMap © OpenStreetMap contributors, ODbL"
      },
      geometry: {
        type: "LineString",
        coordinates: arcotCoords.map(c => [Number(c.lng.toFixed(7)), Number(c.lat.toFixed(7))])
      }
    },
    {
      type: "Feature",
      id: "RD-CH-13-OMR-03",
      properties: {
        id: "RD-CH-13-OMR-03",
        name: "Rajiv Gandhi Salai / OMR (Madhya Kailash to Tidel Park)",
        wardNumber: 175,
        zone: "Zone XIII (Adyar)",
        lengthMeters: calcLength(omrCoords),
        osmWayIds: [95222407, 1235214293, 1235214291, 1517503899, 1517503898, 1517503900, 1235211589, 1231030954],
        highway: "primary",
        sourceAttribution: "OpenStreetMap © OpenStreetMap contributors, ODbL"
      },
      geometry: {
        type: "LineString",
        coordinates: omrCoords.map(c => [Number(c.lng.toFixed(7)), Number(c.lat.toFixed(7))])
      }
    },
    {
      type: "Feature",
      id: "RD-KANCHI-01-RAIL-04",
      properties: {
        id: "RD-KANCHI-01-RAIL-04",
        name: "Railway Road (Kancheepuram Town)",
        wardNumber: 22,
        zone: "Kancheepuram Urban",
        lengthMeters: calcLength(kanchiCoords),
        osmWayIds: [48891297, 910309591, 1533440888, 910309590],
        highway: "secondary",
        sourceAttribution: "OpenStreetMap © OpenStreetMap contributors, ODbL"
      },
      geometry: {
        type: "LineString",
        coordinates: kanchiCoords.map(c => [Number(c.lng.toFixed(7)), Number(c.lat.toFixed(7))])
      }
    }
  ]
};

fs.writeFileSync('public/data/roads.geojson', JSON.stringify(geojson, null, 2));
console.log('Successfully wrote public/data/roads.geojson with 4 canonical real road features.');
