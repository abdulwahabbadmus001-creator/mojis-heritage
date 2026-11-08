import { cultures, getCultureByName } from "./cultures.js";

export const ARCHIVAL_METADATA_BY_ID = {
  "aso-oke": {
    state: "Oyo",
    locality: "Iseyin & Oke-Ogun Weaving Centres",
    historicalPeriod: "16th – 18th Century (Imperial Benin, Oyo, Kanem-Bornu & Hausa States) to Present",
    periodFilter: "Post-Independence & Contemporary Heritage (1960 – Present)",
    classification: "Handwoven Textile & Ceremonial Dress",
    material: "Hand-spun cotton, indigenous wild silk (Sanyan / Anaphe venata), and magenta-dyed silk (Alaari)",
    custodian: "Iseyin Master Weavers Guilds & Nigerian National Museum Collections",
    kingdoms: ["Old Oyo Empire (Ọ̀yọ́ Ilé)", "Ilé-Ifẹ̀ (Cradle of Yoruba Civilisation)"],
    relatedFigures: ["Master Narrow-Strip Weavers of Iseyin, Ede & Ilorin"],
    indigenousTerms: [
      { term: "Aṣọ-Òkè", meaning: "Top/Prestige cloth woven in narrow horizontal strips (fiìlà, agbádá, ìró, bùbá)" },
      { term: "Sányán", meaning: "Beige/ecru prestige weave spun from indigenous Anaphe wild silk cocoons" },
      { term: "Àlàárì", meaning: "Deep crimson ceremonial weave associated with royalty and rites of passage" },
      { term: "Ẹtù", meaning: "Deep indigo-dyed checkered weave traditionally worn by elders and chiefs" },
    ],
    sourceType: "editorial",
    sourceLabel: "Verified Moji's Heritage Publication",
    verificationStatus: "Curated Editorial Record",
    licence: "Moji's Heritage Editorial Archive · Educational Use",
    citations: [
      "Clarke, Duncan. 'Aso Oke: The Evolving Tradition of Hand-Woven Narrow-Strip Cloth in Southwestern Nigeria.' African Arts, UCLA.",
      "National Commission for Museums and Monuments (NCMM), Lagos — Yoruba Textile Archive.",
    ],
    provenanceEvents: [
      {
        era: "17th – 19th Century",
        title: "Oke-Ogun & Iseyin Loom Guilds",
        detail: "Narrow-strip horizontal treadle looms standardize Sanyan, Alaari, and Etu prestige weaves across Oyo and Ilorin.",
        source: "Oral & Textile Archives of Oyo State",
      },
      {
        era: "20th Century",
        title: "Ceremonial & Archival Documentation",
        detail: "Documented by Nigerian textile historians and preserved in National Museum Lagos ethnographic collections.",
        source: "NCMM Textile Catalogue",
      },
      {
        era: "Present",
        title: "Living Heritage Practice",
        detail: "Practised by intergenerational weaving families in Iseyin, Oyo State, and celebrated globally.",
        source: "Moji's Heritage Field Documentation",
      },
    ],
    annotations: [
      {
        id: "warp-strip",
        x: 32,
        y: 38,
        title: "Narrow-Strip Selvedge Seam (Oju Aso)",
        detail: "Individual strips measuring 10–15 cm wide are woven on a double-heddle horizontal loom and hand-stitched edge-to-edge.",
      },
      {
        id: "openwork-lace",
        x: 64,
        y: 55,
        title: "Asinde Openwork Float Weave",
        detail: "Supplementary weft floats and perforated lattice motifs signify high ceremonial rank.",
      },
    ],
  },
  ozo: {
    state: "Anambra",
    locality: "Nri, Awka & Onitsha Cultural Zones",
    historicalPeriod: "Classical Igbo-Ukwu & Early Kingdoms (c. 9th – 11th Century)",
    periodFilter: "Classical Igbo-Ukwu & Early Kingdoms (c. 9th – 11th Century)",
    classification: "Oral History, Festival & Living Tradition",
    material: "Forged iron staff (Alo / Nza-Ozo), eagle feather (Ugo), anklets (Owulu), and carved wooden stool (Mpkisi)",
    custodian: "Nze na Ozo Title Societies across Anambra, Enugu, Imo & Delta States",
    kingdoms: ["Nri Sacred Kingdom (Eze Nri Ritual Polity)", "Onitsha & Aboh Riverine Monarchies"],
    relatedFigures: ["Eze Nri", "Kenneth O. Dike"],
    indigenousTerms: [
      { term: "Nze na Ọzọ", meaning: "Custodians of truth, ritual purity, and community arbitration in Igbo society" },
      { term: "Ọfọ", meaning: "Sacred staff of justice, lineage authority, and moral uprightness" },
      { term: "Abụbà Ugo", meaning: "Eagle feather worn on the red cap (Okpu Ododo) signifying achieved merit" },
    ],
    sourceType: "editorial",
    sourceLabel: "Verified Moji's Heritage Publication",
    verificationStatus: "Curated Editorial Record",
    licence: "Moji's Heritage Editorial Archive · Educational Use",
    citations: [
      "Onwuejeogwu, M. Angulu (1981). An Igbo Civilization: Nri Kingdom & Hegemony. Ethnographica.",
      "Shaw, Thurstan (1970). Igbo-Ukwu: An Account of Archaeological Discoveries in Eastern Nigeria.",
    ],
    provenanceEvents: [
      {
        era: "c. 9th Century CE",
        title: "Igbo-Ukwu & Nri Ritual Antecedents",
        detail: "Archaeological excavations at Igbo-Ukwu reveal bronze staffs, fly-whisks, and regalia linked to early Eze Nri and Ozo institutions.",
        source: "Thurstan Shaw (1970), Igbo-Ukwu Excavations",
      },
      {
        era: "Precolonial – Present",
        title: "Community Governance & Ethical Custodianship",
        detail: "Maintained by local Nze na Ozo assemblies as an ethical and peacemaking institution.",
        source: "Southeastern Nigerian Oral & Ethnographic Records",
      },
    ],
    annotations: [
      {
        id: "ofo-symbol",
        x: 45,
        y: 42,
        title: "Ofo & Alo Ritual Emblems",
        detail: "Symbols of truthful speech and covenant; an Ozo titleholder is bound by oath never to bear false witness.",
      },
    ],
  },
  durbar: {
    state: "Kano",
    locality: "Gidan Rumfa (Emir's Palace), Kano & Katsina",
    historicalPeriod: "Imperial Benin, Oyo, Kanem-Bornu & Hausa States (16th – 18th Century)",
    periodFilter: "Imperial Benin, Oyo, Kanem-Bornu & Hausa States (16th – 18th Century)",
    classification: "Oral History, Festival & Living Tradition",
    material: "Embroidered velvet caparisons, silver horse trappings, Kakaki royal trumpets, and Babban Riga robes",
    custodian: "Kano, Katsina, Zazzau, Bauchi, Ilorin & Bida Emirate Councils",
    kingdoms: ["Kano Emirate & Gidan Rumfa Palace", "Hausa Bakwai (Kano, Katsina, Zazzau, Gobir, Daura, Rano, Biram)"],
    relatedFigures: ["Sarki Muhammad Rumfa of Kano", "Queen Amina of Zazzau"],
    indigenousTerms: [
      { term: "Hawan Sallah", meaning: "Ceremonial Eid equestrian procession of the Emir and district heads (Hakimai)" },
      { term: "Jahi", meaning: "High-speed cavalry charge ending in an abrupt salute before the Emir" },
      { term: "Kakaki", meaning: "Long ceremonial metal trumpet blown only for royalty" },
    ],
    sourceType: "editorial",
    sourceLabel: "Verified Moji's Heritage Publication",
    verificationStatus: "Curated Editorial Record",
    licence: "Moji's Heritage Editorial Archive · Educational Use",
    citations: [
      "UNESCO Intangible Cultural Heritage Nomination File — Durbar in Kano.",
      "Kano Chronicle (Tarikh Arbab Hadha al-Balad al-Musamma Kano).",
    ],
    provenanceEvents: [
      {
        era: "15th – 18th Century",
        title: "Emirate Cavalry & Palace Protocol",
        detail: "Equestrian regiments and royal trumpeters assemble at Gidan Rumfa in Kano during seasonal reviews and Eid celebrations.",
        source: "Kano Chronicle & Palace Archives",
      },
      {
        era: "2024",
        title: "UNESCO Intangible Cultural Heritage Recognition",
        detail: "Recognized internationally as a living masterwork of northern Nigerian equestrian and musical heritage.",
        source: "UNESCO ICH Register",
      },
    ],
    annotations: [
      {
        id: "cavalry-tack",
        x: 52,
        y: 48,
        title: "Silver & Leather Equestrian Caparison (Kayan Doki)",
        detail: "Hand-tooled leather and repoussé metal ornaments crafted by master artisans in Kano's old city.",
      },
    ],
  },
  benin: {
    state: "Edo",
    locality: "Benin City (Oredo LGA) — Igun Street & Royal Palace",
    historicalPeriod: "Classical Ife & Early Oyo / Benin Period (c. 12th – 15th Century)",
    periodFilter: "Classical Ife & Early Oyo / Benin Period (c. 12th – 15th Century)",
    classification: "Copper-Alloy & Bronze Casting",
    material: "Lost-wax (cire perdue) leaded brass/bronze, elephant ivory, and Mediterranean coral beads (Ivie)",
    custodian: "Oba of Benin Royal Court, National Commission for Museums and Monuments (NCMM), Nigeria",
    kingdoms: ["Great Kingdom of Benin (Oba of Benin Palace & Guilds)", "Igun Street Brass-Casters Guild (Igun Eronmwon)"],
    relatedFigures: ["Queen Idia (First Iyoba of Uselu)", "Oba Ewuare the Great (15th Century)", "Oba Esigie (16th Century)", "Oba Ovonramwen Nogbaisi"],
    indigenousTerms: [
      { term: "Igun Eronmwon", meaning: "Royal guild of brass and bronze casters on Igun Street, Benin City" },
      { term: "Ama", meaning: "Cast brass relief plaques depicting court history, warfare, and palace architecture" },
      { term: "Uhunmwun Elao", meaning: "Royal commemorative ancestral heads placed on palace altars" },
      { term: "Iya", meaning: "Monumental earthwork ramparts and moats encircling Benin City and rural communities" },
    ],
    sourceType: "editorial",
    sourceLabel: "Verified Moji's Heritage Publication",
    verificationStatus: "Curated Editorial Record",
    licence: "Moji's Heritage Editorial Archive · Educational Use",
    citations: [
      "Egharevba, Jacob U. (1934). A Short History of Benin. Ibadan University Press.",
      "Digital Benin International Archival Catalogue (digitalbenin.org) & NCMM Nigeria.",
    ],
    provenanceEvents: [
      {
        era: "13th – 17th Century",
        title: "Royal Court Commission at Benin City",
        detail: "Cast by the Igun Eronmwon guild under the patronage of Obas Ewuare, Ozolua, Esigie, Orhogbua, and Ehengbuda to chronicle dynastic history.",
        source: "Oral & Court Records of Benin; Digital Benin",
      },
      {
        era: "February 1897",
        title: "British Punitive Expedition & Dispersal",
        detail: "Thousands of royal plaques, altar heads, and ivory carvings were seized from the Royal Palace in Benin City and dispersed across foreign museums.",
        source: "NCMM Restitution Dossier & British Parliamentary Papers (1897)",
      },
      {
        era: "2021 – Present",
        title: "Restitution & Digital Reunification",
        detail: "Formal repatriation agreements return Benin bronzes to Nigerian custody alongside global archival cataloguing.",
        source: "National Commission for Museums and Monuments (NCMM)",
      },
    ],
    annotations: [
      {
        id: "coral-collar",
        x: 48,
        y: 35,
        title: "High Coral Bead Collar (Ododo / Ivie)",
        detail: "Rows of cylindrical coral beads signify royal authority bestowed exclusively by the Oba of Benin.",
      },
      {
        id: "rosette-bg",
        x: 72,
        y: 28,
        title: "Quatrefoil River-Leaf Motif (Ebe-Amen)",
        detail: "Incised background foil pattern sacred to Olokun, deity of the deep waters and prosperity.",
      },
    ],
  },
  amina: {
    state: "Kaduna",
    locality: "Zaria (Zazzau) & Turunku Ancient Citadel",
    historicalPeriod: "Imperial Benin, Oyo, Kanem-Bornu & Hausa States (16th – 18th Century)",
    periodFilter: "Imperial Benin, Oyo, Kanem-Bornu & Hausa States (16th – 18th Century)",
    classification: "Architectural Monument & Earthwork",
    material: "Laterite earth ramparts (Ganuwar Amina), iron cavalry weaponry, and oral chronicles",
    custodian: "Zazzau Emirate & National Commission for Museums and Monuments",
    kingdoms: ["Zazzau Emirate (Zaria City Walls & Tubali Architecture)", "Hausa Bakwai (Kano, Katsina, Zazzau, Gobir, Daura, Rano, Biram)"],
    relatedFigures: ["Queen Amina of Zazzau", "Bakwa Turunku"],
    indigenousTerms: [
      { term: "Ganuwar Amina", meaning: "Fortified earthen city walls attributed across Hausaland to Queen Amina of Zazzau" },
      { term: "Magajiya", meaning: "Royal title borne by prominent female leaders in Hausa states" },
    ],
    sourceType: "editorial",
    sourceLabel: "Verified Moji's Heritage Publication",
    verificationStatus: "Curated Editorial Record",
    licence: "Moji's Heritage Editorial Archive · Educational Use",
    citations: [
      "Palmer, H. R. (1928). Sudanese Memoirs: The Kano Chronicle.",
      "Hogben, S. J. & Kirk-Greene, A. H. M. (1966). The Emirates of Northern Nigeria.",
    ],
    provenanceEvents: [
      {
        era: "16th Century",
        title: "Reign of Sarauniya Amina in Zazzau",
        detail: "Expansion of Zazzau trade corridors toward Nupe and Kwararafa and fortification of walled towns.",
        source: "Kano Chronicle & Zazzau Oral Traditions",
      },
    ],
    annotations: [
      {
        id: "ganuwa-wall",
        x: 40,
        y: 58,
        title: "Turunku & Zaria Earthen Fortifications",
        detail: "Defensive perimeter walls constructed with sun-dried laterite bricks and ditches.",
      },
    ],
  },
  egusi: {
    state: "National / Multi-State",
    locality: "Pan-Nigerian Culinary Heritage",
    historicalPeriod: "Post-Independence & Contemporary Heritage (1960 – Present)",
    periodFilter: "Post-Independence & Contemporary Heritage (1960 – Present)",
    classification: "Oral History, Festival & Living Tradition",
    material: "Citrullus colocynthis / Cucumeropsis mannii seeds, red palm oil, fluted pumpkin leaves (Ugu), and fermented locust beans (Iru / Dawadawa)",
    custodian: "Living Culinary Custodians across Nigeria",
    kingdoms: [],
    relatedFigures: [],
    indigenousTerms: [
      { term: "Ègúsí / Égwúsí", meaning: "Protein-rich cucurbit melon seeds ground to thicken Nigerian soups" },
      { term: "Irú / Daddawa", meaning: "Fermented Parkia biglobosa locust beans used as an aromatic umami seasoning" },
    ],
    sourceType: "editorial",
    sourceLabel: "Verified Moji's Heritage Publication",
    verificationStatus: "Curated Editorial Record",
    licence: "Moji's Heritage Editorial Archive · Educational Use",
    citations: [
      "Okafor, N. (1983). Indigenous Fermented Foods and Culinary Traditions of Nigeria.",
    ],
    provenanceEvents: [],
    annotations: [],
  },
  "yoruba-language": {
    state: "Osun",
    locality: "Southwestern & North-Central Nigeria",
    historicalPeriod: "19th Century Transformations, Sokoto Caliphate & Atlantic Era (1800 – 1899)",
    periodFilter: "19th Century Transformations, Sokoto Caliphate & Atlantic Era (1800 – 1899)",
    classification: "Manuscript, Epigraphy & Indigenous Script",
    material: "Tonal orthography, diacritical tone marks (Àmì Ohùn), and oral Ifá poetic verses (Ẹsẹ Ifá)",
    custodian: "Yoruba Linguistic & Literary Heritage Custodians",
    kingdoms: ["Ilé-Ifẹ̀ (Cradle of Yoruba Civilisation)", "Old Oyo Empire (Ọ̀yọ́ Ilé)"],
    relatedFigures: ["Samuel Ajayi Crowther", "Wole Soyinka", "D. O. Fagunwa"],
    indigenousTerms: [
      { term: "Àmì Ohùn", meaning: "Three-level tonal system: Dò (low), Re (mid), Mí (high)" },
      { term: "Oríkì", meaning: "Lineage and personal praise poetry preserving historical memory" },
    ],
    sourceType: "editorial",
    sourceLabel: "Verified Moji's Heritage Publication",
    verificationStatus: "Curated Editorial Record",
    licence: "Moji's Heritage Editorial Archive · Educational Use",
    citations: [
      "Crowther, Samuel Ajayi (1852). A Grammar and Vocabulary of the Yoruba Language. Seeleys, London.",
      "Abimbola, Wande (1976). Ifá: An Exposition of Ifá Literary Corpus. Oxford University Press Nigeria.",
    ],
    provenanceEvents: [
      {
        era: "Ancient – Precolonial",
        title: "Oral Transmission of Odu Ifa & Oriki",
        detail: "256 Odu chapters memorized verbatim by Babalawo priests and oral historians.",
        source: "UNESCO Masterpieces of the Oral and Intangible Heritage of Humanity (2005)",
      },
      {
        era: "1843 – 1852",
        title: "Standardisation of Written Orthography",
        detail: "Bishop Samuel Ajayi Crowther publishes the foundational Yoruba Vocabulary and Bible translation (Bibeli Mimo).",
        source: "National Archives Ibadan",
      },
    ],
    annotations: [],
  },
};

export function inferStateFromRecord(record) {
  if (!record) return "";
  if (record.state && String(record.state).trim()) return String(record.state).trim();
  const meta = ARCHIVAL_METADATA_BY_ID[record.id];
  if (meta?.state) return meta.state;
  const culture = getCultureByName(record.ethnicGroup);
  if (culture && Array.isArray(culture.states) && culture.states.length > 0) {
    return culture.states[0];
  }
  return "";
}

export function enrichRecordWithKnowledgeGraph(record) {
  if (!record || typeof record !== "object") return record;
  const meta = ARCHIVAL_METADATA_BY_ID[record.id] || {};
  const culture = getCultureByName(record.ethnicGroup || meta.ethnicGroup);

  const sourceType =
    record.sourceType ||
    meta.sourceType ||
    (record.submissionId ? "community" : record.externalProvider ? "external" : "editorial");

  const sourceLabel =
    record.sourceLabel ||
    meta.sourceLabel ||
    (sourceType === "community"
      ? "Community-Contributed · Admin Approved"
      : sourceType === "external"
      ? `External Discovery · ${record.externalProviderName || record.externalProvider || "Open Archive"}`
      : "Verified Moji's Heritage Publication");

  const verificationStatus =
    record.verificationStatus ||
    meta.verificationStatus ||
    (sourceType === "community"
      ? "Admin-Verified Contribution"
      : sourceType === "external"
      ? "Open-Access Archival Record"
      : "Curated Editorial Record");

  return {
    ...record,
    state: record.state || meta.state || (culture?.states?.[0] ?? ""),
    locality: record.locality || meta.locality || "",
    historicalPeriod:
      record.historicalPeriod ||
      meta.historicalPeriod ||
      "Post-Independence & Contemporary Heritage (1960 – Present)",
    periodFilter:
      record.periodFilter ||
      meta.periodFilter ||
      record.historicalPeriod ||
      "Post-Independence & Contemporary Heritage (1960 – Present)",
    classification:
      record.classification ||
      meta.classification ||
      (record.category === "festivals"
        ? "Oral History, Festival & Living Tradition"
        : record.category === "languages"
        ? "Manuscript, Epigraphy & Indigenous Script"
        : "Copper-Alloy & Bronze Casting"),
    material: record.material || meta.material || "",
    custodian:
      record.custodian ||
      meta.custodian ||
      "Moji's Heritage Digital Archive",
    kingdoms:
      Array.isArray(record.kingdoms) && record.kingdoms.length > 0
        ? record.kingdoms
        : meta.kingdoms || culture?.kingdomsAndInstitutions?.slice(0, 2) || [],
    relatedFigures:
      Array.isArray(record.relatedFigures) && record.relatedFigures.length > 0
        ? record.relatedFigures
        : meta.relatedFigures || culture?.keyFigures?.slice(0, 2) || [],
    indigenousTerms:
      Array.isArray(record.indigenousTerms) && record.indigenousTerms.length > 0
        ? record.indigenousTerms
        : meta.indigenousTerms || [],
    sourceType,
    sourceLabel,
    verificationStatus,
    licence:
      record.licence ||
      meta.licence ||
      "Moji's Heritage Editorial Archive · Educational Use",
    citations:
      Array.isArray(record.citations) && record.citations.length > 0
        ? record.citations
        : meta.citations || [],
    provenanceEvents:
      Array.isArray(record.provenanceEvents) && record.provenanceEvents.length > 0
        ? record.provenanceEvents
        : meta.provenanceEvents || [],
    annotations:
      Array.isArray(record.annotations) && record.annotations.length > 0
        ? record.annotations
        : meta.annotations || [],
  };
}

export function getKnowledgeGraphConnections(record, allPosts = [], allListings = []) {
  const enriched = enrichRecordWithKnowledgeGraph(record);
  if (!enriched) {
    return {
      culture: null,
      relatedArtifactsAndStories: [],
      relatedDestinations: [],
      relatedCultures: [],
    };
  }

  const culture = getCultureByName(enriched.ethnicGroup);
  const enrichedPosts = allPosts
    .filter((item) => item && item.id !== enriched.id && item.isPublished !== false)
    .map(enrichRecordWithKnowledgeGraph);

  const relatedArtifactsAndStories = enrichedPosts
    .map((candidate) => {
      let score = 0;
      const reasons = [];
      if (
        candidate.ethnicGroup &&
        enriched.ethnicGroup &&
        candidate.ethnicGroup.toLowerCase() === enriched.ethnicGroup.toLowerCase()
      ) {
        score += 4;
        reasons.push(`${candidate.ethnicGroup} heritage`);
      }
      if (candidate.state && enriched.state && candidate.state === enriched.state) {
        score += 3;
        reasons.push(`${candidate.state} State`);
      }
      if (candidate.region && enriched.region && candidate.region === enriched.region) {
        score += 2;
        reasons.push(candidate.region);
      }
      if (candidate.category && enriched.category && candidate.category === enriched.category) {
        score += 2;
        reasons.push("Same collection");
      }
      if (
        candidate.classification &&
        enriched.classification &&
        candidate.classification === enriched.classification
      ) {
        score += 2;
        reasons.push(candidate.classification);
      }
      return { candidate, score, reasons };
    })
    .filter((entry) => entry.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 4)
    .map((entry) => ({
      ...entry.candidate,
      connectionReason: entry.reasons.slice(0, 2).join(" · "),
    }));

  const relatedDestinations = (allListings || [])
    .filter((listing) => listing && listing.isPublished !== false)
    .filter(
      (listing) =>
        (enriched.ethnicGroup &&
          listing.ethnicGroup &&
          listing.ethnicGroup.toLowerCase() === enriched.ethnicGroup.toLowerCase()) ||
        (enriched.state && listing.state === enriched.state) ||
        (enriched.region && listing.region === enriched.region)
    )
    .slice(0, 3);

  const relatedCultures = cultures
    .filter(
      (item) =>
        (!culture || item.slug !== culture.slug) &&
        (item.region === enriched.region ||
          (enriched.state && item.states.includes(enriched.state)))
    )
    .slice(0, 4);

  return {
    culture,
    relatedArtifactsAndStories,
    relatedDestinations,
    relatedCultures,
  };
}
