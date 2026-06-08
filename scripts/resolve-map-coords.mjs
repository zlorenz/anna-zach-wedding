#!/usr/bin/env node
/**
 * Fill missing lat/lng in things-to-do-places.json from Google Maps URLs.
 * Expands short links (maps.app.goo.gl) via HTTP redirect, then parses coordinates.
 *
 * Usage: npm run resolve-map-coords
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dataPath = path.join(__dirname, '../src/data/things-to-do-places.json');

function parseGoogleMapsCoordinates(url) {
  if (!url) return null;
  const decoded = decodeURIComponent(url.trim());
  const patterns = [
    /@(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?)(?:,|\?|\/|$)/,
    /!3d(-?\d+(?:\.\d+)?)!4d(-?\d+(?:\.\d+)?)/,
    /[?&]q=(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?)/,
    /[?&]ll=(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?)/,
    /[?&]query=(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?)/,
  ];
  for (const pattern of patterns) {
    const match = decoded.match(pattern);
    if (!match) continue;
    const lat = Number.parseFloat(match[1]);
    const lng = Number.parseFloat(match[2]);
    if (Number.isFinite(lat) && Number.isFinite(lng)) return { lat, lng };
  }
  return null;
}

async function expandMapsUrl(url) {
  const res = await fetch(url.trim(), { redirect: 'follow' });
  return res.url || url;
}

function isValidCoord(n) {
  return typeof n === 'number' && Number.isFinite(n);
}

const raw = JSON.parse(fs.readFileSync(dataPath, 'utf8'));
const places = raw.places;
if (!Array.isArray(places) || places.length === 0) {
  console.log('No places in things-to-do-places.json');
  process.exit(0);
}

let updated = 0;
for (const place of places) {
  if (isValidCoord(place.lat) && isValidCoord(place.lng)) {
    continue;
  }
  if (!place.mapsUrl) {
    console.warn(`Skip ${place.id || place.title}: no mapsUrl or coordinates`);
    continue;
  }
  let coords = parseGoogleMapsCoordinates(place.mapsUrl);
  if (!coords) {
    try {
      const expanded = await expandMapsUrl(place.mapsUrl);
      coords = parseGoogleMapsCoordinates(expanded);
      if (coords && expanded !== place.mapsUrl) {
        console.log(`Expanded ${place.id}: ${expanded}`);
      }
    } catch (err) {
      console.warn(`Fetch failed for ${place.id}:`, err.message);
    }
  }
  if (!coords) {
    console.warn(`Could not parse coordinates for ${place.id || place.title}`);
    continue;
  }
  place.lat = coords.lat;
  place.lng = coords.lng;
  updated += 1;
  console.log(`Updated ${place.id}: ${coords.lat}, ${coords.lng}`);
}

if (updated > 0) {
  fs.writeFileSync(dataPath, JSON.stringify(raw, null, 2) + '\n');
  console.log(`Wrote ${updated} coordinate(s) to ${dataPath}`);
} else {
  console.log('No coordinates needed updating.');
}
