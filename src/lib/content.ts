import { parse as parseYaml } from 'yaml';
import site from '../data/site.json';
import home from '../data/home.json';
import itineraryYaml from '../data/itinerary.yaml?raw';
import travelYaml from '../data/travel.yaml?raw';
import travelMap from '../data/travel-map.json';
import accommodationYaml from '../data/accommodation.yaml?raw';
import accommodationMap from '../data/accommodation-map.json';
import thingsToDoYaml from '../data/things-to-do.yaml?raw';
import thingsToDoPlacesConfig from '../data/things-to-do-places.json';
import thingsToDoMapYaml from '../data/things-to-do-map.yaml?raw';
import { isValidCoordinate, normalizeGoogleMapsUrl, parseGoogleMapsCoordinates } from './parse-maps-url';
import faqYaml from '../data/faq.yaml?raw';
import { normalizeProseHtml } from './photos';
import accommodationMapYaml from '../data/accommodation-map.yaml?raw';
import homeWelcomeYaml from '../data/home-welcome.yaml?raw';

export type FaqImage = {
  file: string;
  alt?: string;
};

export type FaqQuestion = {
  question: string;
  answer: string;
  tooltipColor: 'pink_soft' | 'blue_mist';
  image?: string;
  imageAlt?: string;
  images?: FaqImage[];
  imagesGalleryAlt?: string;
};

export type FaqData = {
  title: string;
  questions: FaqQuestion[];
};

export type AccommodationMapData = {
  title: string;
  intro: string[];
  legendRecommendedStays: string;
  legendWeddingVenue: string;
  legendTerminal: string;
  legendDriveRoute: string;
  legendCrossingRoute: string;
};

export type HomeWelcomeData = {
  paragraphs: string[];
  signature: string;
};

export type ThingsToDoCategory = 'restaurants' | 'nightlife' | 'sightseeing' | 'entertainment';

export type ThingsToDoPlace = {
  id: string;
  title: string;
  category: ThingsToDoCategory;
  mapsUrl: string;
  lat?: number;
  lng?: number;
  blurb?: string;
  note?: string;
};

export type ThingsToDoMapConfig = {
  places: ThingsToDoPlace[];
  mapUi?: { fitZoom?: number };
  i18n?: {
    ariaMap?: string;
    openInMaps?: string;
  };
};

export type ThingsToDoData = {
  introHtml: string;
  mapConfig?: ThingsToDoMapConfig;
};

export type ThingsToDoMapSectionData = {
  title: string;
  intro: string[];
  legendRestaurants: string;
  legendNightlife: string;
  legendSightseeing: string;
  legendEntertainment: string;
  filterToggleAll: string;
};

export type TravelAirport = {
  titleLines: string[];
  leadHtml: string;
};

export type TravelTransfer = {
  title: string;
  bodyHtml: string;
};

export type TravelEssentialsCallout = {
  icon: 'plane';
  title: string;
  body: string;
};

export type TravelEssentials = {
  eyebrow: string;
  title: string;
  visa: {
    title: string;
    bodyHtml: string;
    buttonLabel: string;
    buttonUrl: string;
    callout: TravelEssentialsCallout;
  };
  sim: {
    title: string;
    bodyHtml: string;
    buttonLabel: string;
    buttonUrl: string;
  };
  currency: {
    title: string;
    bodyHtml: string;
    exchangeLabel: string;
    exchangeValue: string;
  };
};

export type TravelMapConfig = typeof travelMap;

export type TravelData = {
  airport: TravelAirport;
  transfer: TravelTransfer;
  essentials: TravelEssentials;
  mapConfig: TravelMapConfig;
};

export type AccommodationPick = {
  title: string;
  blurb: string;
  pricing: string;
  url: string;
};

export type AccommodationMapPlace = {
  id: string;
  source: string;
  title: string;
  lat: number;
  lng: number;
  isWeddingVenue?: boolean;
  pricing?: string;
  areaLifestyle?: string;
  url?: string;
};

export type AccommodationMapConfig = typeof accommodationMap;

export type AccommodationData = {
  intro: {
    pageTitle: string;
    copy: string;
  };
  featured: {
    eyebrow: string;
    title: string;
    tagline: string;
    reasons: string[];
    bookLabel: string;
    bookUrl: string;
    note: string;
  };
  picks: {
    title: string;
    hotels: AccommodationPick[];
  };
  airbnb: {
    heading: string;
    copy: string;
  };
  mapConfig: AccommodationMapConfig;
};

export type ItineraryWeddingDayEvent = {
  time: string;
  title: string;
  descriptionHtml: string;
  location: string;
  featured: boolean;
  typeClass: string;
};

export type ItineraryMultiDayEvent = {
  time: string;
  title: string;
  descriptionHtml: string;
  externalUrl: string;
  externalLabel: string;
  typeClass: string;
};

export type ItineraryMultiDay = {
  label: string;
  date: string;
  descriptionHtml: string;
  highlight: boolean;
  events: ItineraryMultiDayEvent[];
};

export type ItineraryData = {
  introHtml: string;
  weddingDay: ItineraryWeddingDayEvent[];
  multiDay: ItineraryMultiDay[];
};

function normalizeThingsToDoPlace(place: ThingsToDoPlace): (ThingsToDoPlace & { lat: number; lng: number }) | null {
  let lat = place.lat;
  let lng = place.lng;

  if (!isValidCoordinate(lat) || !isValidCoordinate(lng)) {
    const parsed = parseGoogleMapsCoordinates(place.mapsUrl);
    if (!parsed) {
      return null;
    }
    lat = parsed.lat;
    lng = parsed.lng;
  }

  return { ...place, lat, lng, mapsUrl: normalizeGoogleMapsUrl(place.mapsUrl) };
}

const faqParsed = parseYaml(faqYaml) as FaqData;
const faq: FaqData = {
  ...faqParsed,
  questions: faqParsed.questions.map((row) => ({
    ...row,
    answer: normalizeProseHtml(row.answer.trimEnd()),
  })),
};

const itineraryParsed = parseYaml(itineraryYaml) as ItineraryData;
const itinerary: ItineraryData = {
  ...itineraryParsed,
  introHtml: normalizeProseHtml(itineraryParsed.introHtml || ''),
  weddingDay: itineraryParsed.weddingDay.map((event) => ({
    ...event,
    descriptionHtml: normalizeProseHtml(event.descriptionHtml || ''),
  })),
  multiDay: itineraryParsed.multiDay.map((day) => ({
    ...day,
    descriptionHtml: normalizeProseHtml(day.descriptionHtml || ''),
    events: day.events.map((event) => ({
      ...event,
      descriptionHtml: normalizeProseHtml(event.descriptionHtml || ''),
    })),
  })),
};

const travelParsed = parseYaml(travelYaml) as Omit<TravelData, 'mapConfig'>;
const travel: TravelData = {
  airport: {
    ...travelParsed.airport,
    leadHtml: normalizeProseHtml(travelParsed.airport.leadHtml || ''),
  },
  transfer: {
    ...travelParsed.transfer,
    bodyHtml: normalizeProseHtml(travelParsed.transfer.bodyHtml || ''),
  },
  essentials: {
    ...travelParsed.essentials,
    visa: {
      ...travelParsed.essentials.visa,
      bodyHtml: normalizeProseHtml(travelParsed.essentials.visa.bodyHtml || ''),
    },
    sim: {
      ...travelParsed.essentials.sim,
      bodyHtml: normalizeProseHtml(travelParsed.essentials.sim.bodyHtml || ''),
    },
    currency: {
      ...travelParsed.essentials.currency,
      bodyHtml: normalizeProseHtml(travelParsed.essentials.currency.bodyHtml || ''),
    },
  },
  mapConfig: travelMap,
};

const accommodationParsed = parseYaml(accommodationYaml) as Omit<AccommodationData, 'mapConfig' | 'picks'> & {
  picks: { title: string };
};
const accommodationPicks: AccommodationPick[] = accommodationMap.places
  .filter((place) => place.source === 'pick')
  .map((place) => ({
    title: place.title,
    blurb: (place.areaLifestyle || '').replace(/\.$/, ''),
    pricing: place.pricing || '',
    url: place.url || '',
  }));

const accommodation: AccommodationData = {
  intro: {
    pageTitle: accommodationParsed.intro.pageTitle.trim(),
    copy: accommodationParsed.intro.copy.trim(),
  },
  featured: accommodationParsed.featured,
  picks: {
    title: accommodationParsed.picks.title,
    hotels: accommodationPicks,
  },
  airbnb: {
    heading: accommodationParsed.airbnb.heading,
    copy: accommodationParsed.airbnb.copy.trim(),
  },
  mapConfig: accommodationMap,
};

const thingsToDoParsed = parseYaml(thingsToDoYaml) as { introHtml: string };
const thingsToDoPlaces =
  thingsToDoPlacesConfig.places
    ?.map(normalizeThingsToDoPlace)
    .filter((p): p is ThingsToDoPlace & { lat: number; lng: number } => p !== null) ?? [];

export const siteData = site;
export const homeData = home;
export const itineraryData = itinerary;
export const travelData = travel;
export const accommodationData = accommodation;
export const faqData = faq;

const accommodationMapParsed = parseYaml(accommodationMapYaml) as AccommodationMapData;
export const accommodationMapData: AccommodationMapData = {
  ...accommodationMapParsed,
  intro: accommodationMapParsed.intro.map((p) => p.trimEnd()),
};

const homeWelcomeParsed = parseYaml(homeWelcomeYaml) as HomeWelcomeData;
export const homeWelcomeData: HomeWelcomeData = {
  paragraphs: homeWelcomeParsed.paragraphs.map((p) => p.trimEnd()),
  signature: homeWelcomeParsed.signature.trimEnd(),
};
const thingsToDoMapParsed = parseYaml(thingsToDoMapYaml) as ThingsToDoMapSectionData;
export const thingsToDoMapData: ThingsToDoMapSectionData = {
  ...thingsToDoMapParsed,
  intro: thingsToDoMapParsed.intro.map((p) => p.trimEnd()),
};

const thingsToDoMapSource = thingsToDoPlacesConfig as ThingsToDoMapConfig;

export const thingsToDoData: ThingsToDoData = {
  introHtml: normalizeProseHtml(thingsToDoParsed.introHtml || ''),
  mapConfig: thingsToDoPlaces.length
    ? {
        ...thingsToDoMapSource,
        places: thingsToDoPlaces,
      }
    : undefined,
};

export {
  normalizeProseHtml,
  getPhotoUrl,
  brandNavDark,
  brandNavLight,
  brandHeroWordmark,
} from './photos';

/** @deprecated Use normalizeProseHtml */
export const fixContentUrls = normalizeProseHtml;

export function decodeEntities(text: string): string {
  return text
    .replace(/&amp;/g, '&')
    .replace(/&#8211;/g, '–')
    .replace(/&#8217;/g, "'")
    .replace(/&nbsp;/g, ' ');
}

/** e.g. "Jan 22, 2026" → "Thursday, Jan 22, 2026" */
export function formatItineraryDayDate(date: string): string {
  const trimmed = date?.trim();
  if (!trimmed) return '';

  const parsed = new Date(trimmed);
  if (Number.isNaN(parsed.getTime())) return trimmed;

  return parsed.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}
