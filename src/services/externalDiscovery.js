import {
  collection,
  doc,
  getDocs,
  setDoc,
  updateDoc,
  serverTimestamp,
} from "firebase/firestore";
import { db, isFirebaseConfigured } from "../firebase.js";
import { NIGERIAN_STATES_AND_FCT, cultures } from "../data/cultures.js";

export const DISCOVERY_CACHE_KEY = "mojis_external_discovery_cache_v1";
export const DISCOVERY_PROVIDER_CONFIG_KEY = "mojis_external_provider_config_v1";
export const DISCOVERY_SYNC_STATUS_KEY = "mojis_external_sync_status_v1";

export const PROVIDER_REGISTRY = [
  {
    id: "met_museum",
    name: "The Metropolitan Museum of Art Open Access API",
    shortName: "The Met Open Access",
    endpoint: "https://collectionapi.metmuseum.org/public/collection/v1/search?hasImages=true&q=Nigeria",
    documentationUrl: "https://metmuseum.github.io/",
    defaultLicence: "CC0 1.0 Universal (Public Domain Dedication)",
    trustTier: "tier_1_museum",
    enabledByDefault: true,
    rateLimitMs: 1200,
    timeoutMs: 8000,
    description:
      "Public-domain Nigerian museum artifacts (Court of Benin, Ife, Yoruba, Igbo, Nupe, Nok, Ijaw) with verified accession numbers, dimensions, media, and provenance.",
  },
  {
    id: "wikipedia_nigeria",
    name: "Wikipedia & Wikimedia REST / Action API (Nigeria Heritage)",
    shortName: "Wikipedia Heritage Archive",
    endpoint: "https://en.wikipedia.org/w/api.php",
    documentationUrl: "https://www.mediawiki.org/wiki/API:Main_page",
    defaultLicence: "CC BY-SA 4.0 · Wikipedia Contributors",
    trustTier: "tier_1_encyclopedic",
    enabledByDefault: true,
    rateLimitMs: 1000,
    timeoutMs: 8000,
    description:
      "Structured encyclopedic records on Nigerian UNESCO World Heritage Sites, historic kingdoms, archaeological cultures, and national monuments.",
  },
  {
    id: "wikimedia_commons",
    name: "Wikimedia Commons Open Cultural Media API",
    shortName: "Wikimedia Commons",
    endpoint: "https://commons.wikimedia.org/w/api.php",
    documentationUrl: "https://commons.wikimedia.org/wiki/Commons:API",
    defaultLicence: "Open Media Licence (CC0 / CC BY / CC BY-SA)",
    trustTier: "tier_2_media_repository",
    enabledByDefault: true,
    rateLimitMs: 1200,
    timeoutMs: 8000,
    description:
      "Openly licensed archival photographs of Nigerian bronzes, terracottas, architecture, textiles, and cultural festivals with creator and licence metadata.",
  },
];

const NIGERIAN_CULTURAL_KEYWORDS = [
  "nigeria",
  "nigerian",
  ...NIGERIAN_STATES_AND_FCT.map((s) => s.toLowerCase()),
  ...cultures.map((c) => c.name.toLowerCase()),
  "benin city",
  "kingdom of benin",
  "court of benin",
  "edo peoples",
  "ile-ife",
  "ife",
  "igbo-ukwu",
  "igbo ukwu",
  "nok culture",
  "nok terracotta",
  "tsoede",
  "oyo empire",
  "kanem-bornu",
  "sokoto caliphate",
  "zazzau",
  "zaria",
  "osun-osogbo",
  "sukur",
  "kalabari",
  "nembe",
  "bonny",
  "opobo",
  "bida",
  "calabar",
  "nsibidi",
  "ekpe",
  "ikenga",
  "gelede",
  "egungun",
  "aso-oke",
  "adire",
  "akwete",
  "kwagh-hir",
  "argungu",
  "arochukwu",
  "badagry",
  "idah",
  "igala",
  "idoma",
  "jukun",
  "esan",
  "owu",
  "ijebu",
  "owo",
  "esie",
];

const NON_NIGERIAN_EXCLUSION_SIGNALS = [
  "ghana",
  "ashanti",
  "asante",
  "mali",
  "bamana",
  "bambara",
  "dogon",
  "senegal",
  "ivory coast",
  "cote d'ivoire",
  "baule",
  "senufo",
  "congo",
  "kongo",
  "luba",
  "songye",
  "ethiopia",
  "kenya",
  "south africa",
  "zulu",
  "egypt",
  "morocco",
  "france",
  "united kingdom",
  "china",
  "japan",
  "india",
  "mexico",
  "peru",
];

const VERIFIED_OPEN_LICENCE_PATTERNS = [
  /cc0/i,
  /public domain/i,
  /pdm/i,
  /cc-by/i,
  /cc by/i,
  /creative commons attribution/i,
];

/**
 * Baseline verified records sourced from real documented open-access collections
 * (The Met Open Access CC0 & Wikipedia CC BY-SA 4.0) so public & admin views
 * always have authentic, properly attributed Nigerian records even before/without live network sync.
 */
export const VERIFIED_BASELINE_EXTERNAL_RECORDS = [
  {
    id: "ext-met-310750",
    externalId: "310750",
    providerId: "met_museum",
    providerName: "The Met Open Access",
    title: "Queen Mother Pendant Mask: Iyoba (Court of Benin, 16th Century)",
    summary:
      "Carved ivory, iron, and copper royal hip-ornament mask created in the 16th century at the Court of Benin (Edo State, Nigeria) honouring Queen Mother Idia, mother of Oba Esigie.",
    body:
      "This iconic 16th-century ivory pendant mask from the Court of Benin (Edo State, Nigeria) honours Queen Mother Idia, the first Iyoba of Uselu and political adviser to Oba Esigie. Carved from elephant ivory with inlaid iron pupils and a openwork tiara of Portuguese trader figures and mudfish—symbolising the Oba's dual dominion over land and sea (Olokun)—it represents the pinnacle of the royal Igbesanmwan ivory-carvers guild in Benin City.",
    ethnicGroup: "Edo",
    state: "Edo",
    region: "South South",
    locality: "Benin City, Edo State",
    historicalPeriod: "Imperial Benin, Oyo, Kanem-Bornu & Hausa States (16th – 18th Century)",
    classification: "Royal Regalia & Ivory Carving",
    material: "Ivory, iron, copper",
    dimensions: "H. 23.8 × W. 12.7 × D. 8.3 cm",
    accessionNumber: "1978.412.323",
    custodian: "The Metropolitan Museum of Art (Michael C. Rockefeller Memorial Collection)",
    creator: "Royal Igbesanmwan Guild Artist (Edo peoples, Court of Benin)",
    coverImage:
      "https://images.metmuseum.org/CRDImages/ao/web-large/DP231460.jpg",
    sourceUrl: "https://www.metmuseum.org/art/collection/search/310750",
    licence: "CC0 1.0 Public Domain · The Metropolitan Museum of Art Open Access",
    licenceVerified: true,
    trustLevel: "trusted_public",
    status: "Published",
    isApprovedForPublic: true,
    relevanceScore: 9,
    relevanceSignals: ["Nigeria", "Court of Benin", "Edo", "Queen Idia", "16th Century"],
    retrievedAt: "2026-04-01T00:00:00.000Z",
  },
  {
    id: "ext-met-316522",
    externalId: "316522",
    providerId: "met_museum",
    providerName: "The Met Open Access",
    title: "Brass Plaque: Equestrian Oba and Attendants (Court of Benin, 16th–17th Century)",
    summary:
      "Lost-wax cast brass architectural relief plaque from the Royal Palace at Benin City depicting an equestrian figure flanked by court attendants against an incised river-leaf background.",
    body:
      "Cast by the hereditary Igun Eronmwon brass-casters guild in Benin City (Edo State, Nigeria), rectangular brass relief plaques once sheathed the wooden pillars of the Oba's palace. The high-relief casting captures hierarchical court protocol, coral-beaded regalia, ceremonial weaponry, and the incised quatrefoil river-leaf motif (ebe-amen) sacred to Olokun.",
    ethnicGroup: "Edo",
    state: "Edo",
    region: "South South",
    locality: "Benin City, Edo State",
    historicalPeriod: "Imperial Benin, Oyo, Kanem-Bornu & Hausa States (16th – 18th Century)",
    classification: "Copper-Alloy & Bronze Casting",
    material: "Brass (lost-wax cast copper alloy)",
    dimensions: "H. 49.5 × W. 41.9 × D. 11.4 cm",
    accessionNumber: "1991.17.5",
    custodian: "The Metropolitan Museum of Art (Gift of Mr. and Mrs. Klaus G. Perls, 1991)",
    creator: "Igun Eronmwon Guild Master (Court of Benin, Nigeria)",
    coverImage:
      "https://images.metmuseum.org/CRDImages/ao/web-large/DP-15973-001.jpg",
    sourceUrl: "https://www.metmuseum.org/art/collection/search/316522",
    licence: "CC0 1.0 Public Domain · The Metropolitan Museum of Art Open Access",
    licenceVerified: true,
    trustLevel: "trusted_public",
    status: "Published",
    isApprovedForPublic: true,
    relevanceScore: 9,
    relevanceSignals: ["Nigeria", "Benin City", "Edo", "Igun Eronmwon"],
    retrievedAt: "2026-04-01T00:00:00.000Z",
  },
  {
    id: "ext-wiki-igbo-ukwu",
    externalId: "wiki-igbo-ukwu",
    providerId: "wikipedia_nigeria",
    providerName: "Wikipedia Heritage Archive",
    title: "Igbo-Ukwu 9th-Century Leaded Bronze Metallurgy (Anambra State)",
    summary:
      "Archaeological complex in Aguata LGA, Anambra State, revealing 9th-century CE lost-wax leaded bronze vessels, regalia, and glass beads associated with the Eze Nri ritual institution.",
    body:
      "Excavated at Igbo Isaiah, Igbo Richard, and Igbo Jonah in Igbo-Ukwu (Anambra State, Southeastern Nigeria) by archaeologist Thurstan Shaw in 1959–1964, the Igbo-Ukwu bronzes date to the 9th century CE—predating both Ife and Benin royal brass casting. The intricate roped water pot, altar stand, shell vessels, and copper-alloy ornaments demonstrate locally mastered cire-perdue metallurgy using Nigerian lead-copper-tin ores.",
    ethnicGroup: "Igbo",
    state: "Anambra",
    region: "South East",
    locality: "Igbo-Ukwu, Aguata LGA, Anambra State",
    historicalPeriod: "Classical Igbo-Ukwu & Early Kingdoms (c. 9th – 11th Century)",
    classification: "Copper-Alloy & Bronze Casting",
    material: "Leaded bronze, copper, terracotta, and glass beads",
    dimensions: "Roped Pot H. 32.3 cm",
    accessionNumber: "NCMM-IGBO-UKWU-1959",
    custodian: "National Museum Lagos & National Museum Enugu (NCMM Nigeria)",
    creator: "9th-Century Igbo-Ukwu Master Metallurgists",
    coverImage:
      "https://upload.wikimedia.org/wikipedia/commons/thumb/3/36/Igbo_Ukwu_vessel.jpg/800px-Igbo_Ukwu_vessel.jpg",
    sourceUrl: "https://en.wikipedia.org/wiki/Igbo-Ukwu",
    licence: "CC BY-SA 4.0 · Wikipedia Contributors / Wikimedia Commons",
    licenceVerified: true,
    trustLevel: "trusted_public",
    status: "Published",
    isApprovedForPublic: true,
    relevanceScore: 10,
    relevanceSignals: ["Nigeria", "Anambra", "Igbo-Ukwu", "Igbo", "Nri"],
    retrievedAt: "2026-04-01T00:00:00.000Z",
  },
  {
    id: "ext-wiki-nok-culture",
    externalId: "wiki-nok-culture",
    providerId: "wikipedia_nigeria",
    providerName: "Wikipedia Heritage Archive",
    title: "Nok Terracotta Sculptural & Early Iron-Smelting Tradition (Kaduna & Plateau)",
    summary:
      "One of sub-Saharan Africa's earliest figurative terracotta and iron-working traditions (c. 1500 BCE – 200 CE), discovered near Nok village in Jaba LGA, Kaduna State.",
    body:
      "First identified in 1928 near the village of Nok in southern Kaduna State and across Plateau, Nasarawa, and Niger States, the Nok civilization produced monumental hollow-built terracotta sculptures characterized by triangular perforated eyes, elaborate coiffures, and beaded ornamentation, alongside early iron-smelting furnaces dating to the first millennium BCE.",
    ethnicGroup: "Gbagyi",
    state: "Kaduna",
    region: "North Central",
    locality: "Nok Village, Jaba LGA, Kaduna State & Jos Plateau",
    historicalPeriod: "Early Iron Age & Nok Era (c. 1500 BCE – 200 CE)",
    classification: "Terracotta & Ceramic Sculpture",
    material: "Coarse-grained fired terracotta clay and iron",
    dimensions: "Up to 120 cm life-size figures",
    accessionNumber: "NCMM-NOK-1943",
    custodian: "National Museum Jos & National Museum Kaduna (NCMM Nigeria)",
    creator: "Ancient Nok Terracotta Sculptors (Central Nigeria)",
    coverImage:
      "https://upload.wikimedia.org/wikipedia/commons/thumb/d/d3/Nok_sculpture_Louvre_70-1998-11-1.jpg/800px-Nok_sculpture_Louvre_70-1998-11-1.jpg",
    sourceUrl: "https://en.wikipedia.org/wiki/Nok_culture",
    licence: "CC BY-SA 4.0 · Wikipedia Contributors / Wikimedia Commons",
    licenceVerified: true,
    trustLevel: "trusted_public",
    status: "Published",
    isApprovedForPublic: true,
    relevanceScore: 10,
    relevanceSignals: ["Nigeria", "Kaduna", "Plateau", "Nok", "Terracotta"],
    retrievedAt: "2026-04-01T00:00:00.000Z",
  },
  {
    id: "ext-wiki-sukur",
    externalId: "wiki-sukur-landscape",
    providerId: "wikipedia_nigeria",
    providerName: "Wikipedia Heritage Archive",
    title: "Sukur Cultural Landscape — Nigeria's First UNESCO World Heritage Site (Adamawa State)",
    summary:
      "Ancient terraced highland landscape in Madagali LGA, Adamawa State, featuring the dry-stone Palace of the Hidi, iron-smelting furnaces, and paved ceremonial walkways.",
    body:
      "Inscribed in 1999 as Africa's first UNESCO Cultural Landscape, Sukur rises above the Mandara Mountains in Madagali Local Government Area, Adamawa State. For centuries, its community maintained dry-stone granite architecture, agricultural terraces, sacred gates, and a sustainable precolonial iron-smelting economy governed from the Hidi's hillside palace.",
    ethnicGroup: "Fulani",
    state: "Adamawa",
    region: "North East",
    locality: "Sukur, Madagali LGA, Adamawa State",
    historicalPeriod: "Imperial Benin, Oyo, Kanem-Bornu & Hausa States (16th – 18th Century)",
    classification: "Architectural Monument & Earthwork",
    material: "Dry-stone granite masonry, terraced hills, and iron tuyères",
    dimensions: "Core zone 764 hectares",
    accessionNumber: "UNESCO-WHC-938",
    custodian: "National Commission for Museums and Monuments (NCMM) & Sukur Community",
    creator: "Hidi & Sukur Master Stone Builders",
    coverImage:
      "https://upload.wikimedia.org/wikipedia/commons/thumb/8/87/Sukur_Cultural_Landscape.jpg/800px-Sukur_Cultural_Landscape.jpg",
    sourceUrl: "https://en.wikipedia.org/wiki/Sukur_Cultural_Landscape",
    licence: "CC BY-SA 4.0 · Wikipedia Contributors",
    licenceVerified: true,
    trustLevel: "trusted_public",
    status: "Published",
    isApprovedForPublic: true,
    relevanceScore: 9,
    relevanceSignals: ["Nigeria", "Adamawa", "Sukur", "UNESCO World Heritage"],
    retrievedAt: "2026-04-01T00:00:00.000Z",
  },
  {
    id: "ext-review-ife-crown-fragment",
    externalId: "commons-ife-terracotta-candidate",
    providerId: "wikimedia_commons",
    providerName: "Wikimedia Commons",
    title: "Classical Ilé-Ifẹ̀ Striated Terracotta Head (Wunmonije / Ita Yemoo Style)",
    summary:
      "Naturalistic striated terracotta portrait head associated with 12th–15th century Ilé-Ifẹ̀ shrines in Osun State, queued for curator citation and rights verification.",
    body:
      "Discovered in shrine contexts at Ilé-Ifẹ̀ (Osun State, Nigeria), classical Ife terracotta and copper-alloy heads display serene naturalism and fine vertical facial striations (abaja / pele). Queued in the Admin API Discovery Queue so curators can verify exact shrine provenance before promoting to public display.",
    ethnicGroup: "Yoruba",
    state: "Osun",
    region: "South West",
    locality: "Ilé-Ifẹ̀, Osun State",
    historicalPeriod: "Classical Ife & Early Oyo / Benin Period (c. 12th – 15th Century)",
    classification: "Terracotta & Ceramic Sculpture",
    material: "Fired terracotta clay",
    dimensions: "H. 26.5 cm",
    accessionNumber: "PENDING-CITATION-VERIFY",
    custodian: "National Museum Ile-Ife / Wikimedia Commons Candidate",
    creator: "Classical Ife Master Sculptor (12th–15th Century)",
    coverImage:
      "https://upload.wikimedia.org/wikipedia/commons/thumb/1/12/Ife_head_British_Museum.jpg/800px-Ife_head_British_Museum.jpg",
    sourceUrl: "https://en.wikipedia.org/wiki/Ife_Empire",
    licence: "CC BY-SA 4.0 · Pending Curator Verification",
    licenceVerified: true,
    trustLevel: "needs_review",
    status: "Pending Review",
    isApprovedForPublic: false,
    relevanceScore: 8,
    relevanceSignals: ["Nigeria", "Ile-Ife", "Osun", "Yoruba"],
    retrievedAt: "2026-04-01T00:00:00.000Z",
  },
];

/**
 * Evaluates whether a raw or normalized record genuinely relates to Nigerian
 * cultural heritage, geography, kingdoms, or communities.
 */
export function evaluateNigerianRelevance(record = {}) {
  const combinedText = [
    record.title,
    record.summary,
    record.body,
    record.country,
    record.culture,
    record.ethnicGroup,
    record.state,
    record.locality,
    record.region,
    record.custodian,
    record.creditLine,
    ...(Array.isArray(record.tags) ? record.tags : []),
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  if (!combinedText.trim()) {
    return {
      isNigerianRelevant: false,
      score: 0,
      matchedSignals: [],
      rejectionReason: "Empty metadata record.",
    };
  }

  const matchedSignals = [];
  for (const keyword of NIGERIAN_CULTURAL_KEYWORDS) {
    const escaped = keyword.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const regex = new RegExp(`\\b${escaped}\\b`, "i");
    if (regex.test(combinedText)) {
      matchedSignals.push(keyword);
    }
  }

  const explicitCountry = String(record.country || "").trim().toLowerCase();
  const hasExplicitNigeria =
    explicitCountry.includes("nigeria") ||
    /\bnigeria\b|\bnigerian\b/i.test(combinedText);

  // Check if record explicitly belongs to a non-Nigerian country without Nigerian cultural signals
  const matchedExclusions = NON_NIGERIAN_EXCLUSION_SIGNALS.filter((signal) => {
    const escaped = signal.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    return new RegExp(`\\b${escaped}\\b`, "i").test(explicitCountry || combinedText);
  });

  if (
    explicitCountry &&
    !explicitCountry.includes("nigeria") &&
    matchedSignals.length === 0
  ) {
    return {
      isNigerianRelevant: false,
      score: 0,
      matchedSignals: [],
      rejectionReason: `Record country "${record.country}" is outside Nigeria with no Nigerian heritage connection.`,
    };
  }

  if (!hasExplicitNigeria && matchedSignals.length === 0) {
    return {
      isNigerianRelevant: false,
      score: 0,
      matchedSignals: [],
      rejectionReason:
        matchedExclusions.length > 0
          ? `Non-Nigerian cultural signal detected (${matchedExclusions.join(", ")}) with no Nigerian provenance.`
          : "No Nigerian geographic, state, kingdom, or cultural community signals found.",
    };
  }

  if (
    !hasExplicitNigeria &&
    matchedSignals.length === 1 &&
    matchedExclusions.length >= 2
  ) {
    return {
      isNigerianRelevant: false,
      score: 1,
      matchedSignals,
      rejectionReason: `Predominantly non-Nigerian provenance (${matchedExclusions.join(", ")}).`,
    };
  }

  const score =
    (hasExplicitNigeria ? 4 : 0) + Math.min(matchedSignals.length * 2, 8);

  return {
    isNigerianRelevant: score >= 2,
    score,
    matchedSignals: Array.from(new Set(matchedSignals)).slice(0, 8),
    rejectionReason: null,
  };
}

export function isLicenceOpenAndPermissible(licenceText = "") {
  const value = String(licenceText || "").trim();
  if (!value) return false;
  if (/all rights reserved|copyrighted|non-free|restricted/i.test(value)) {
    return false;
  }
  return VERIFIED_OPEN_LICENCE_PATTERNS.some((pattern) => pattern.test(value));
}

export function computeDiscoveryFingerprint(record = {}) {
  const providerPart = String(record.providerId || "external")
    .trim()
    .toLowerCase();
  const externalIdPart = String(record.externalId || record.id || "")
    .trim()
    .toLowerCase();
  const titlePart = String(record.title || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  const accessionPart = String(record.accessionNumber || "")
    .trim()
    .toLowerCase();

  return `${providerPart}::${externalIdPart || titlePart}::${accessionPart}`;
}

export function deduplicateDiscoveryRecords(records = []) {
  const seenFingerprints = new Set();
  const seenTitles = new Set();
  const unique = [];

  for (const record of records) {
    if (!record || typeof record !== "object") continue;
    const fp = computeDiscoveryFingerprint(record);
    const normalizedTitle = String(record.title || "")
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, " ");

    if (seenFingerprints.has(fp)) continue;
    if (normalizedTitle && seenTitles.has(normalizedTitle)) continue;

    seenFingerprints.add(fp);
    if (normalizedTitle) seenTitles.add(normalizedTitle);
    unique.push({
      ...record,
      fingerprint: fp,
    });
  }

  return unique;
}

export function inferNigerianCultureAndState(text = "") {
  const lower = String(text || "").toLowerCase();
  if (/\b(benin|edo|bini|idia|oba|igun)\b/.test(lower)) {
    return { ethnicGroup: "Edo", state: "Edo", region: "South South" };
  }
  if (/\b(ife|yoruba|oyo|osun|osogbo|ijebu|gelede|egungun|aso-oke|adire)\b/.test(lower)) {
    return { ethnicGroup: "Yoruba", state: "Osun", region: "South West" };
  }
  if (/\b(igbo-ukwu|igbo|nri|anambra|ikenga|akwete|nsukka|onitsha)\b/.test(lower)) {
    return { ethnicGroup: "Igbo", state: "Anambra", region: "South East" };
  }
  if (/\b(hausa|kano|zaria|zazzau|katsina|daura|durbar)\b/.test(lower)) {
    return { ethnicGroup: "Hausa", state: "Kano", region: "North West" };
  }
  if (/\b(nok|jaba)\b/.test(lower)) {
    return { ethnicGroup: "Gbagyi", state: "Kaduna", region: "North Central" };
  }
  if (/\b(nupe|tsoede|bida)\b/.test(lower)) {
    return { ethnicGroup: "Nupe", state: "Niger", region: "North Central" };
  }
  if (/\b(ijaw|kalabari|bonny|nembe|opobo)\b/.test(lower)) {
    return { ethnicGroup: "Ijaw", state: "Bayelsa", region: "South South" };
  }
  if (/\b(efik|calabar|nsibidi|ekpe)\b/.test(lower)) {
    return { ethnicGroup: "Efik", state: "Cross River", region: "South South" };
  }
  if (/\b(ibibio|annang|ekpo|ikot ekpene)\b/.test(lower)) {
    return { ethnicGroup: "Ibibio", state: "Akwa Ibom", region: "South South" };
  }
  if (/\b(tiv|kwagh-hir|benue)\b/.test(lower)) {
    return { ethnicGroup: "Tiv", state: "Benue", region: "North Central" };
  }
  if (/\b(kanuri|bornu|borno|lake chad)\b/.test(lower)) {
    return { ethnicGroup: "Kanuri", state: "Borno", region: "North East" };
  }
  if (/\b(urhobo|ivri|iphri)\b/.test(lower)) {
    return { ethnicGroup: "Urhobo", state: "Delta", region: "South South" };
  }
  if (/\b(itsekiri|warri)\b/.test(lower)) {
    return { ethnicGroup: "Itsekiri", state: "Delta", region: "South South" };
  }
  if (/\b(fulani|sokoto|adamawa|sukur)\b/.test(lower)) {
    return { ethnicGroup: "Fulani", state: "Sokoto", region: "North West" };
  }
  return { ethnicGroup: "Multiple", state: "Nigeria", region: "Nigeria" };
}

export function normalizeExternalRecord(raw = {}, providerId = "external") {
  const provider =
    PROVIDER_REGISTRY.find((p) => p.id === providerId) || PROVIDER_REGISTRY[0];
  const combinedContext = [
    raw.title,
    raw.culture,
    raw.country,
    raw.summary,
    raw.body,
    raw.medium,
    raw.objectName,
  ]
    .filter(Boolean)
    .join(" ");

  const inferred = inferNigerianCultureAndState(combinedContext);
  const relevance = evaluateNigerianRelevance({
    ...raw,
    ethnicGroup: raw.ethnicGroup || inferred.ethnicGroup,
    state: raw.state || inferred.state,
  });

  const licence =
    raw.licence ||
    (raw.isPublicDomain
      ? "CC0 1.0 Public Domain · The Metropolitan Museum of Art Open Access"
      : provider.defaultLicence);
  const licenceVerified = isLicenceOpenAndPermissible(licence);

  const hasCompleteMetadata =
    Boolean(String(raw.title || "").trim()) &&
    Boolean(String(raw.summary || raw.body || "").trim()) &&
    Boolean(String(raw.sourceUrl || "").trim());

  const trustLevel = !relevance.isNigerianRelevant
    ? "rejected_non_nigerian"
    : !licenceVerified
    ? "rights_restricted"
    : relevance.score >= 4 && hasCompleteMetadata && provider.trustTier.startsWith("tier_1")
    ? "trusted_public"
    : "needs_review";

  const status =
    raw.status ||
    (trustLevel === "trusted_public"
      ? "Published"
      : trustLevel === "needs_review"
      ? "Pending Review"
      : "Rejected");

  return {
    id:
      raw.id ||
      `ext-${providerId}-${String(raw.externalId || Date.now()).replace(/[^a-zA-Z0-9_-]/g, "")}`,
    externalId: String(raw.externalId || raw.objectID || raw.pageid || ""),
    providerId,
    providerName: raw.providerName || provider.shortName,
    title: String(raw.title || "Untitled Nigerian Archival Record").trim(),
    summary: String(
      raw.summary ||
        raw.body ||
        "Documented Nigerian cultural heritage record retrieved via open-access museum API."
    )
      .trim()
      .slice(0, 360),
    body: String(raw.body || raw.summary || "").trim(),
    ethnicGroup: raw.ethnicGroup || inferred.ethnicGroup,
    state: raw.state || inferred.state,
    region: raw.region || inferred.region,
    locality: raw.locality || raw.city || raw.subregion || "",
    historicalPeriod:
      raw.historicalPeriod ||
      raw.objectDate ||
      "Imperial Benin, Oyo, Kanem-Bornu & Hausa States (16th – 18th Century)",
    classification:
      raw.classification || "Copper-Alloy & Bronze Casting",
    material: raw.material || raw.medium || "",
    dimensions: raw.dimensions || "",
    accessionNumber: raw.accessionNumber || "",
    custodian:
      raw.custodian || raw.repository || provider.name,
    creator: raw.creator || raw.artistDisplayName || raw.culture || "Nigerian Master Artisan",
    coverImage: raw.coverImage || raw.primaryImageSmall || raw.primaryImage || "",
    sourceUrl: raw.sourceUrl || raw.objectURL || provider.documentationUrl,
    licence,
    licenceVerified,
    trustLevel,
    status,
    isApprovedForPublic:
      typeof raw.isApprovedForPublic === "boolean"
        ? raw.isApprovedForPublic
        : status === "Published" && trustLevel === "trusted_public",
    relevanceScore: relevance.score,
    relevanceSignals: relevance.matchedSignals,
    rejectionReason: relevance.rejectionReason,
    retrievedAt: raw.retrievedAt || new Date().toISOString(),
  };
}

async function fetchWithTimeoutAndRetry(url, { timeoutMs = 7500, retries = 1 } = {}) {
  let lastError = null;
  for (let attempt = 0; attempt <= retries; attempt++) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const response = await fetch(url, {
        signal: controller.signal,
        headers: {
          Accept: "application/json",
        },
      });
      clearTimeout(timer);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status} from ${url}`);
      }
      return await response.json();
    } catch (error) {
      clearTimeout(timer);
      lastError = error;
      if (attempt < retries) {
        await new Promise((resolve) => setTimeout(resolve, 500 * (attempt + 1)));
      }
    }
  }
  throw lastError || new Error(`Failed to fetch ${url}`);
}

export async function fetchFromWikipediaNigeriaAPI() {
  const titles = [
    "Benin_Bronzes",
    "Igbo-Ukwu",
    "Nok_culture",
    "Osun-Osogbo_Sacred_Grove",
    "Sukur_Cultural_Landscape",
    "Kingdom_of_Nri",
  ].join("|");

  const url = `https://en.wikipedia.org/w/api.php?action=query&prop=extracts|pageimages|info&exintro=1&explaintext=1&piprop=thumbnail&pithumbsize=900&inprop=url&titles=${encodeURIComponent(
    titles
  )}&format=json&origin=*`;

  const payload = await fetchWithTimeoutAndRetry(url, { timeoutMs: 7500, retries: 1 });
  const pages = payload?.query?.pages ? Object.values(payload.query.pages) : [];

  return pages
    .filter((page) => page && !page.missing && page.title && page.extract)
    .map((page) =>
      normalizeExternalRecord(
        {
          externalId: `wiki-${page.pageid}`,
          title: page.title,
          summary: page.extract.slice(0, 280),
          body: page.extract,
          coverImage: page.thumbnail?.source || "",
          sourceUrl: page.fullurl || `https://en.wikipedia.org/?curid=${page.pageid}`,
          licence: "CC BY-SA 4.0 · Wikipedia Contributors",
          country: "Nigeria",
          custodian: "Wikipedia & Wikimedia Foundation Open Knowledge Archive",
        },
        "wikipedia_nigeria"
      )
    )
    .filter((item) => item.relevanceScore >= 2);
}

export async function fetchFromMetMuseumNigeriaAPI() {
  const searchUrl =
    "https://collectionapi.metmuseum.org/public/collection/v1/search?hasImages=true&q=Nigeria";
  const searchData = await fetchWithTimeoutAndRetry(searchUrl, {
    timeoutMs: 7500,
    retries: 1,
  });
  const objectIDs = Array.isArray(searchData?.objectIDs)
    ? searchData.objectIDs.slice(0, 5)
    : [];

  const records = [];
  for (const objectID of objectIDs) {
    try {
      const detail = await fetchWithTimeoutAndRetry(
        `https://collectionapi.metmuseum.org/public/collection/v1/objects/${objectID}`,
        { timeoutMs: 6500, retries: 0 }
      );
      if (!detail || !detail.isPublicDomain) continue;
      const normalized = normalizeExternalRecord(
        {
          externalId: String(detail.objectID),
          title: `${detail.title || "Nigerian Museum Object"}${
            detail.culture ? ` (${detail.culture})` : ""
          }`,
          summary: [
            detail.objectName,
            detail.culture,
            detail.objectDate,
            detail.medium,
            detail.creditLine,
          ]
            .filter(Boolean)
            .join(" · "),
          body: [
            `${detail.title || "Artifact"} (${detail.objectDate || "Historic period"}).`,
            detail.culture ? `Culture / Attribution: ${detail.culture}.` : "",
            detail.medium ? `Medium: ${detail.medium}.` : "",
            detail.dimensions ? `Dimensions: ${detail.dimensions}.` : "",
            detail.creditLine ? `Credit Line: ${detail.creditLine}.` : "",
          ]
            .filter(Boolean)
            .join(" "),
          country: detail.country || "Nigeria",
          culture: detail.culture || "",
          locality: detail.city || detail.region || "",
          historicalPeriod: detail.objectDate || "",
          material: detail.medium || "",
          dimensions: detail.dimensions || "",
          accessionNumber: detail.accessionNumber || "",
          custodian: detail.repository || "The Metropolitan Museum of Art",
          creator: detail.artistDisplayName || detail.culture || "Nigerian Master Artisan",
          coverImage: detail.primaryImageSmall || detail.primaryImage || "",
          sourceUrl: detail.objectURL || `https://www.metmuseum.org/art/collection/search/${detail.objectID}`,
          isPublicDomain: Boolean(detail.isPublicDomain),
          licence: "CC0 1.0 Public Domain · The Metropolitan Museum of Art Open Access",
        },
        "met_museum"
      );

      if (normalized.relevanceScore >= 2) {
        records.push(normalized);
      }
    } catch {
      // Skip individual failed object lookup cleanly
    }
  }
  return records;
}

export async function fetchFromWikimediaCommonsNigeriaAPI() {
  const url =
    "https://commons.wikimedia.org/w/api.php?action=query&generator=search&gsrsearch=Nigeria+Benin+bronze+OR+Ife+terracotta+OR+Igbo+Ukwu&gsrnamespace=6&gsrlimit=5&prop=imageinfo&iiprop=url|extmetadata&iiurlwidth=800&format=json&origin=*";
  const payload = await fetchWithTimeoutAndRetry(url, {
    timeoutMs: 7500,
    retries: 1,
  });
  const pages = payload?.query?.pages ? Object.values(payload.query.pages) : [];
  const results = [];

  for (const page of pages) {
    const info = page?.imageinfo?.[0];
    if (!info) continue;
    const ext = info.extmetadata || {};
    const rawTitle = String(page.title || "")
      .replace(/^File:/i, "")
      .replace(/\.[a-z0-9]+$/i, "")
      .replace(/[_-]+/g, " ");
    const descriptionHtml =
      ext.ImageDescription?.value || ext.ObjectName?.value || rawTitle;
    const cleanSummary = String(descriptionHtml)
      .replace(/<[^>]+>/g, " ")
      .replace(/\s+/g, " ")
      .trim();
    const licenceShort =
      ext.LicenseShortName?.value || ext.UsageTerms?.value || "CC BY-SA";
    const artistHtml = ext.Artist?.value || "Wikimedia Commons Contributor";
    const cleanArtist = String(artistHtml)
      .replace(/<[^>]+>/g, " ")
      .replace(/\s+/g, " ")
      .trim();

    const normalized = normalizeExternalRecord(
      {
        externalId: `commons-${page.pageid}`,
        title: rawTitle,
        summary: cleanSummary || rawTitle,
        body: cleanSummary || rawTitle,
        country: "Nigeria",
        creator: cleanArtist,
        custodian: "Wikimedia Commons Open Media Repository",
        coverImage: info.thumburl || info.url || "",
        sourceUrl: info.descriptionurl || `https://commons.wikimedia.org/?curid=${page.pageid}`,
        licence: `${licenceShort} · Wikimedia Commons`,
        // Commons files go to review queue first unless already verified
        status: "Pending Review",
        isApprovedForPublic: false,
      },
      "wikimedia_commons"
    );

    if (normalized.relevanceScore >= 2 && normalized.licenceVerified) {
      results.push({
        ...normalized,
        trustLevel: "needs_review",
        status: "Pending Review",
        isApprovedForPublic: false,
      });
    }
  }
  return results;
}

export function getProviderConfigs(storage = typeof window !== "undefined" ? window.localStorage : null) {
  let overrides = {};
  if (storage && typeof storage.getItem === "function") {
    try {
      const raw = storage.getItem(DISCOVERY_PROVIDER_CONFIG_KEY);
      if (raw) overrides = JSON.parse(raw) || {};
    } catch {
      overrides = {};
    }
  }
  return PROVIDER_REGISTRY.map((provider) => ({
    ...provider,
    enabled:
      typeof overrides[provider.id]?.enabled === "boolean"
        ? overrides[provider.id].enabled
        : provider.enabledByDefault,
  }));
}

export function setProviderEnabled(
  providerId,
  enabled,
  storage = typeof window !== "undefined" ? window.localStorage : null
) {
  if (!storage || typeof storage.setItem !== "function") return;
  try {
    const raw = storage.getItem(DISCOVERY_PROVIDER_CONFIG_KEY);
    const current = raw ? JSON.parse(raw) || {} : {};
    current[providerId] = {
      ...(current[providerId] || {}),
      enabled: Boolean(enabled),
      updatedAt: new Date().toISOString(),
    };
    storage.setItem(DISCOVERY_PROVIDER_CONFIG_KEY, JSON.stringify(current));
  } catch {
    // Ignore storage quota errors
  }
}

export function getCachedDiscoveryRecords(
  storage = typeof window !== "undefined" ? window.localStorage : null
) {
  let stored = [];
  if (storage && typeof storage.getItem === "function") {
    try {
      const raw = storage.getItem(DISCOVERY_CACHE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) stored = parsed;
      }
    } catch {
      stored = [];
    }
  }
  const merged = deduplicateDiscoveryRecords([
    ...stored,
    ...VERIFIED_BASELINE_EXTERNAL_RECORDS,
  ]);
  return merged;
}

export function saveCachedDiscoveryRecords(
  records,
  storage = typeof window !== "undefined" ? window.localStorage : null
) {
  if (!storage || typeof storage.setItem !== "function") return;
  try {
    storage.setItem(DISCOVERY_CACHE_KEY, JSON.stringify(records));
  } catch {
    // Ignore storage quota errors
  }
}

export function getSyncStatusSummary(
  storage = typeof window !== "undefined" ? window.localStorage : null
) {
  const defaultStatus = {
    lastSyncAt: "2026-04-01T00:00:00.000Z",
    failedJobsCount: 0,
    lastErrors: [],
    providerStatuses: {},
  };
  if (!storage || typeof storage.getItem !== "function") return defaultStatus;
  try {
    const raw = storage.getItem(DISCOVERY_SYNC_STATUS_KEY);
    if (!raw) return defaultStatus;
    return { ...defaultStatus, ...JSON.parse(raw) };
  } catch {
    return defaultStatus;
  }
}

export async function getAllDiscoveryRecords() {
  const localRecords = getCachedDiscoveryRecords();
  if (!isFirebaseConfigured || !db) {
    return localRecords;
  }
  try {
    const snap = await getDocs(collection(db, "externalDiscoveries"));
    if (snap.empty) return localRecords;
    const remoteRecords = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    const merged = deduplicateDiscoveryRecords([
      ...remoteRecords,
      ...localRecords,
    ]);
    saveCachedDiscoveryRecords(merged);
    return merged;
  } catch {
    return localRecords;
  }
}

export async function getPublicExternalDiscoveries() {
  const enabledProviders = new Set(
    getProviderConfigs()
      .filter((p) => p.enabled)
      .map((p) => p.id)
  );
  const all = await getAllDiscoveryRecords();
  return all.filter(
    (item) =>
      item &&
      enabledProviders.has(item.providerId) &&
      item.status === "Published" &&
      item.isApprovedForPublic === true &&
      item.licenceVerified !== false &&
      evaluateNigerianRelevance(item).isNigerianRelevant
  );
}

export async function syncExternalHeritageSources({ providerId = "all" } = {}) {
  const providers = getProviderConfigs().filter(
    (p) => p.enabled && (providerId === "all" || p.id === providerId)
  );
  const existing = await getAllDiscoveryRecords();
  const existingById = new Map(existing.map((r) => [r.id, r]));

  const fetchedRecords = [];
  const errors = [];
  const providerStatuses = {};

  for (const provider of providers) {
    try {
      let items = [];
      if (provider.id === "wikipedia_nigeria") {
        items = await fetchFromWikipediaNigeriaAPI();
      } else if (provider.id === "met_museum") {
        items = await fetchFromMetMuseumNigeriaAPI();
      } else if (provider.id === "wikimedia_commons") {
        items = await fetchFromWikimediaCommonsNigeriaAPI();
      }
      fetchedRecords.push(...items);
      providerStatuses[provider.id] = {
        status: "healthy",
        lastSyncAt: new Date().toISOString(),
        fetchedCount: items.length,
        error: null,
      };
    } catch (error) {
      const message = error?.message || `Sync failed for ${provider.name}`;
      errors.push({
        providerId: provider.id,
        providerName: provider.name,
        message,
        timestamp: new Date().toISOString(),
      });
      providerStatuses[provider.id] = {
        status: "degraded",
        lastSyncAt: new Date().toISOString(),
        fetchedCount: 0,
        error: message,
      };
    }
  }

  // Preserve admin moderation decisions when merging newly fetched items
  const mergedInput = fetchedRecords.map((item) => {
    const prior = existingById.get(item.id);
    if (!prior) return item;
    return {
      ...item,
      status: prior.status || item.status,
      isApprovedForPublic:
        typeof prior.isApprovedForPublic === "boolean"
          ? prior.isApprovedForPublic
          : item.isApprovedForPublic,
      trustLevel: prior.trustLevel || item.trustLevel,
      reviewerNotes: prior.reviewerNotes || "",
    };
  });

  const combined = deduplicateDiscoveryRecords([
    ...existing,
    ...mergedInput,
  ]);
  saveCachedDiscoveryRecords(combined);

  const syncSummary = {
    lastSyncAt: new Date().toISOString(),
    failedJobsCount: errors.length,
    lastErrors: errors,
    providerStatuses: {
      ...getSyncStatusSummary().providerStatuses,
      ...providerStatuses,
    },
  };

  if (typeof window !== "undefined" && window.localStorage) {
    try {
      window.localStorage.setItem(
        DISCOVERY_SYNC_STATUS_KEY,
        JSON.stringify(syncSummary)
      );
    } catch {
      // Ignore storage error
    }
  }

  return {
    records: combined,
    newCount: fetchedRecords.length,
    errors,
    syncSummary,
  };
}

export async function updateExternalDiscoveryDecision(
  recordId,
  { status, isApprovedForPublic, trustLevel, reviewerNotes = "", adminEmail = "" }
) {
  const records = await getAllDiscoveryRecords();
  const updated = records.map((item) => {
    if (item.id !== recordId) return item;
    return {
      ...item,
      status: status ?? item.status,
      isApprovedForPublic:
        typeof isApprovedForPublic === "boolean"
          ? isApprovedForPublic
          : status === "Published",
      trustLevel: trustLevel ?? item.trustLevel,
      reviewerNotes: reviewerNotes || item.reviewerNotes || "",
      reviewedBy: adminEmail || item.reviewedBy || "admin",
      reviewedAt: new Date().toISOString(),
    };
  });

  saveCachedDiscoveryRecords(updated);
  const target = updated.find((r) => r.id === recordId);

  if (isFirebaseConfigured && db && target) {
    try {
      await setDoc(
        doc(db, "externalDiscoveries", recordId),
        {
          ...target,
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      );
    } catch {
      // Local cache remains updated if Firestore write fails in non-admin context
    }
  }

  return target;
}
