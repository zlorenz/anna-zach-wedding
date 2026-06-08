import { parse as parseYaml } from 'yaml';
import type { Locale } from './i18n';
import { localizePath } from './i18n';
import siteEn from '../data/site.json';
import homeEn from '../data/home.json';
import itineraryYamlEn from '../data/itinerary.yaml?raw';
import travelYamlEn from '../data/travel.yaml?raw';
import travelMapEn from '../data/travel-map.json';
import accommodationYamlEn from '../data/accommodation.yaml?raw';
import accommodationMapEn from '../data/accommodation-map.json';
import thingsToDoYamlEn from '../data/things-to-do.yaml?raw';
import thingsToDoPlacesConfigEn from '../data/things-to-do-places.json';
import thingsToDoMapYamlEn from '../data/things-to-do-map.yaml?raw';
import faqYamlEn from '../data/faq.yaml?raw';
import accommodationMapYamlEn from '../data/accommodation-map.yaml?raw';
import homeWelcomeYamlEn from '../data/home-welcome.yaml?raw';
import siteRu from '../data/ru/site.json';
import homeRu from '../data/ru/home.json';
import itineraryYamlRu from '../data/ru/itinerary.yaml?raw';
import travelYamlRu from '../data/ru/travel.yaml?raw';
import travelMapRu from '../data/ru/travel-map.json';
import accommodationYamlRu from '../data/ru/accommodation.yaml?raw';
import accommodationMapRu from '../data/ru/accommodation-map.json';
import thingsToDoYamlRu from '../data/ru/things-to-do.yaml?raw';
import thingsToDoPlacesConfigRu from '../data/ru/things-to-do-places.json';
import thingsToDoMapYamlRu from '../data/ru/things-to-do-map.yaml?raw';
import faqYamlRu from '../data/ru/faq.yaml?raw';
import accommodationMapYamlRu from '../data/ru/accommodation-map.yaml?raw';
import homeWelcomeYamlRu from '../data/ru/home-welcome.yaml?raw';
import uiEn from '../data/ui.en.json';
import uiRu from '../data/ui.ru.json';
import { isValidCoordinate, normalizeGoogleMapsUrl, parseGoogleMapsCoordinates } from './parse-maps-url';
import { normalizeProseHtml } from './photos';

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

export type TravelMapConfig = typeof travelMapEn;

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

export type AccommodationMapConfig = typeof accommodationMapEn;

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

export type SiteData = typeof siteEn;
export type HomeData = typeof homeEn;
export type UiStrings = typeof uiEn;

export type LocaleContent = {
  locale: Locale;
  site: SiteData;
  home: HomeData;
  faq: FaqData;
  itinerary: ItineraryData;
  travel: TravelData;
  accommodation: AccommodationData;
  thingsToDo: ThingsToDoData;
  accommodationMap: AccommodationMapData;
  homeWelcome: HomeWelcomeData;
  thingsToDoMap: ThingsToDoMapSectionData;
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

function buildFaqData(faqYaml: string): FaqData {
  const faqParsed = parseYaml(faqYaml) as FaqData;
  return {
    ...faqParsed,
    questions: faqParsed.questions.map((row) => ({
      ...row,
      answer: normalizeProseHtml(row.answer.trimEnd()),
    })),
  };
}

function buildItineraryData(itineraryYaml: string): ItineraryData {
  const itineraryParsed = parseYaml(itineraryYaml) as ItineraryData;
  return {
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
}

function buildTravelData(travelYaml: string, travelMap: TravelMapConfig): TravelData {
  const travelParsed = parseYaml(travelYaml) as Omit<TravelData, 'mapConfig'>;
  return {
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
}

function buildAccommodationData(
  accommodationYaml: string,
  accommodationMap: AccommodationMapConfig,
): AccommodationData {
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

  return {
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
}

function buildThingsToDoData(
  thingsToDoYaml: string,
  thingsToDoPlacesConfig: ThingsToDoMapConfig,
): ThingsToDoData {
  const thingsToDoParsed = parseYaml(thingsToDoYaml) as { introHtml: string };
  const thingsToDoPlaces =
    thingsToDoPlacesConfig.places
      ?.map(normalizeThingsToDoPlace)
      .filter((p): p is ThingsToDoPlace & { lat: number; lng: number } => p !== null) ?? [];

  return {
    introHtml: normalizeProseHtml(thingsToDoParsed.introHtml || ''),
    mapConfig: thingsToDoPlaces.length
      ? {
          ...thingsToDoPlacesConfig,
          places: thingsToDoPlaces,
        }
      : undefined,
  };
}

function buildAccommodationMapData(accommodationMapYaml: string): AccommodationMapData {
  const accommodationMapParsed = parseYaml(accommodationMapYaml) as AccommodationMapData;
  return {
    ...accommodationMapParsed,
    intro: accommodationMapParsed.intro.map((p) => p.trimEnd()),
  };
}

function buildHomeWelcomeData(homeWelcomeYaml: string): HomeWelcomeData {
  const homeWelcomeParsed = parseYaml(homeWelcomeYaml) as HomeWelcomeData;
  return {
    paragraphs: homeWelcomeParsed.paragraphs.map((p) => p.trimEnd()),
    signature: homeWelcomeParsed.signature.trimEnd(),
  };
}

function buildThingsToDoMapData(thingsToDoMapYaml: string): ThingsToDoMapSectionData {
  const thingsToDoMapParsed = parseYaml(thingsToDoMapYaml) as ThingsToDoMapSectionData;
  return {
    ...thingsToDoMapParsed,
    intro: thingsToDoMapParsed.intro.map((p) => p.trimEnd()),
  };
}

function localizeSite(site: SiteData, locale: Locale): SiteData {
  return {
    ...site,
    nav: site.nav.map((item) => ({
      ...item,
      href: localizePath(item.href, locale),
    })),
  };
}

function buildLocaleContent(
  locale: Locale,
  site: SiteData,
  home: HomeData,
  faqYaml: string,
  itineraryYaml: string,
  travelYaml: string,
  travelMap: TravelMapConfig,
  accommodationYaml: string,
  accommodationMap: AccommodationMapConfig,
  thingsToDoYaml: string,
  thingsToDoPlacesConfig: ThingsToDoMapConfig,
  thingsToDoMapYaml: string,
  accommodationMapYaml: string,
  homeWelcomeYaml: string,
): LocaleContent {
  return {
    locale,
    site: localizeSite(site, locale),
    home,
    faq: buildFaqData(faqYaml),
    itinerary: buildItineraryData(itineraryYaml),
    travel: buildTravelData(travelYaml, travelMap),
    accommodation: buildAccommodationData(accommodationYaml, accommodationMap),
    thingsToDo: buildThingsToDoData(thingsToDoYaml, thingsToDoPlacesConfig),
    accommodationMap: buildAccommodationMapData(accommodationMapYaml),
    homeWelcome: buildHomeWelcomeData(homeWelcomeYaml),
    thingsToDoMap: buildThingsToDoMapData(thingsToDoMapYaml),
  };
}

const localeContent: Record<Locale, LocaleContent> = {
  en: buildLocaleContent(
    'en',
    siteEn,
    homeEn,
    faqYamlEn,
    itineraryYamlEn,
    travelYamlEn,
    travelMapEn,
    accommodationYamlEn,
    accommodationMapEn,
    thingsToDoYamlEn,
    thingsToDoPlacesConfigEn,
    thingsToDoMapYamlEn,
    accommodationMapYamlEn,
    homeWelcomeYamlEn,
  ),
  ru: buildLocaleContent(
    'ru',
    siteRu,
    homeRu,
    faqYamlRu,
    itineraryYamlRu,
    travelYamlRu,
    travelMapRu,
    accommodationYamlRu,
    accommodationMapRu,
    thingsToDoYamlRu,
    thingsToDoPlacesConfigRu,
    thingsToDoMapYamlRu,
    accommodationMapYamlRu,
    homeWelcomeYamlRu,
  ),
};

export function getContent(locale: Locale = 'en'): LocaleContent {
  return localeContent[locale];
}

export function getUi(locale: Locale = 'en'): UiStrings {
  return locale === 'ru' ? uiRu : uiEn;
}

/** English defaults — backward compatible with existing imports. */
const en = localeContent.en;
export const siteData = en.site;
export const homeData = en.home;
export const itineraryData = en.itinerary;
export const travelData = en.travel;
export const accommodationData = en.accommodation;
export const faqData = en.faq;
export const accommodationMapData = en.accommodationMap;
export const homeWelcomeData = en.homeWelcome;
export const thingsToDoMapData = en.thingsToDoMap;
export const thingsToDoData = en.thingsToDo;

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
export function formatItineraryDayDate(date: string, locale: Locale = 'en'): string {
  const trimmed = date?.trim();
  if (!trimmed) return '';

  const parsed = new Date(trimmed);
  if (Number.isNaN(parsed.getTime())) return trimmed;

  return parsed.toLocaleDateString(locale === 'ru' ? 'ru-RU' : 'en-US', {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}
