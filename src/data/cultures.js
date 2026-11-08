export const NIGERIAN_STATES_AND_FCT = [
  "Abia",
  "Adamawa",
  "Akwa Ibom",
  "Anambra",
  "Bauchi",
  "Bayelsa",
  "Benue",
  "Borno",
  "Cross River",
  "Delta",
  "Ebonyi",
  "Edo",
  "Ekiti",
  "Enugu",
  "FCT Abuja",
  "Gombe",
  "Imo",
  "Jigawa",
  "Kaduna",
  "Kano",
  "Katsina",
  "Kebbi",
  "Kogi",
  "Kwara",
  "Lagos",
  "Nasarawa",
  "Niger",
  "Ogun",
  "Ondo",
  "Osun",
  "Oyo",
  "Plateau",
  "Rivers",
  "Sokoto",
  "Taraba",
  "Yobe",
  "Zamfara",
];

export const HISTORICAL_PERIODS = [
  "Early Iron Age & Nok Era (c. 1500 BCE – 200 CE)",
  "Classical Igbo-Ukwu & Early Kingdoms (c. 9th – 11th Century)",
  "Classical Ife & Early Oyo / Benin Period (c. 12th – 15th Century)",
  "Imperial Benin, Oyo, Kanem-Bornu & Hausa States (16th – 18th Century)",
  "19th Century Transformations, Sokoto Caliphate & Atlantic Era (1800 – 1899)",
  "Colonial Era & Anti-Colonial Resistance (1900 – 1959)",
  "Post-Independence & Contemporary Heritage (1960 – Present)",
  "Unknown",
  "Approximate",
  "Disputed",
];

export const ARTIFACT_CLASSIFICATIONS = [
  "Copper-Alloy & Bronze Casting",
  "Terracotta & Ceramic Sculpture",
  "Royal Regalia & Ivory Carving",
  "Handwoven Textile & Ceremonial Dress",
  "Wood Carving & Masquerade Headdress",
  "Architectural Monument & Earthwork",
  "Manuscript, Epigraphy & Indigenous Script",
  "Musical & Percussion Instrument",
  "Ritual Vessel & Divination Apparatus",
  "Oral History, Festival & Living Tradition",
  "Photography & Documentary Archive",
];

export const cultures = [
  {
    slug: "yoruba",
    name: "Yoruba",
    region: "South West",
    states: [
      "Lagos",
      "Ogun",
      "Oyo",
      "Osun",
      "Ondo",
      "Ekiti",
      "Kwara",
      "Kogi",
    ],
    languages: ["Yorùbá", "Èkìtì", "Ìjẹ̀bú", "Ọ̀yọ́", "Ìgbómìnà", "Oǹdó"],
    kingdomsAndInstitutions: [
      "Ilé-Ifẹ̀ (Cradle of Yoruba Civilisation)",
      "Old Oyo Empire (Ọ̀yọ́ Ilé)",
      "Ijebu Kingdom (Sungbo's Eredo)",
      "Ilesa, Ondo, Ekiti & Egba Confederacies",
    ],
    notableTraditions: [
      "Ifá Divination Corpus (Ọdù Ifá)",
      "Aso-Òkè Handwoven Prestige Textiles",
      "Osun-Osogbo Sacred Grove Festival",
      "Gelede, Egungun & Eyo Masquerade Traditions",
      "Adire Indigo Resist-Dyed Cloth",
    ],
    keyFigures: [
      "Moremi Ajasoro of Ile-Ife",
      "Funmilayo Ransome-Kuti",
      "Samuel Ajayi Crowther",
      "Oba Ovonramwen / Classical Ife Master Casters",
    ],
    description:
      "Explore Yoruba histories, language, festivals, foods, personalities, artistic traditions and living cultural practices.",
    introduction:
      "Yoruba communities are concentrated mainly in southwestern and north-central Nigeria, with extensive diaspora communities across West Africa and the Atlantic world. Moji's Heritage brings together curated records on Ilé-Ifẹ̀ classical bronze and terracotta naturalistic portraiture, the Oyo imperial cavalry system, the Ọdù Ifá literary corpus, Aso-Òkè and Adire textile arts, and living festival traditions.",
  },
  {
    slug: "igbo",
    name: "Igbo",
    region: "South East",
    states: [
      "Abia",
      "Anambra",
      "Ebonyi",
      "Enugu",
      "Imo",
      "Delta",
      "Rivers",
    ],
    languages: ["Àsụsụ Ìgbò", "Ika", "Ikwerre", "Nsukka", "Onitsha", "Owerri"],
    kingdomsAndInstitutions: [
      "Nri Sacred Kingdom (Eze Nri Ritual Polity)",
      "Igbo-Ukwu 9th-Century Bronze Civilisation",
      "Aro Confederacy",
      "Onitsha & Aboh Riverine Monarchies",
      "Oha-na-Eze Republican Assemblies & Nsibidi Societies",
    ],
    notableTraditions: [
      "Igbo-Ukwu Lost-Wax Leaded Bronze Vessels",
      "Iri Ji (New Yam Festival) & Ikenga Sculpture",
      "Mmanwu Masquerade & Mbari Sacred Earth Houses",
      "Akwete Woven Cloth & Uli Body/Mural Design",
    ],
    keyFigures: [
      "Olaudah Equiano (Gustavus Vassa)",
      "Women Leaders of the 1929 Aba Women's War (Ogu Umunwanyi)",
      "Kenneth O. Dike (Pioneer Historian & National Archives Founder)",
      "Chinua Achebe",
    ],
    description:
      "Discover Igbo histories, languages, festivals, foods, institutions and living traditions.",
    introduction:
      "Igbo cultural life encompasses diverse communities across southeastern and south-south Nigeria. Stretching back to the 9th-century leaded bronze castings of Igbo-Ukwu and the ritual priesthood of Nri, Igbo heritage combines republican village democracies, age-grade associations, Uli mural aesthetics, Akwete weaving, and vibrant New Yam (Iri Ji) ceremonies.",
  },
  {
    slug: "hausa",
    name: "Hausa",
    region: "North West",
    states: [
      "Kano",
      "Katsina",
      "Kaduna",
      "Kebbi",
      "Jigawa",
      "Sokoto",
      "Zamfara",
      "Bauchi",
    ],
    languages: ["Harshen Hausa (Boko & Ajami scripts)"],
    kingdomsAndInstitutions: [
      "Hausa Bakwai (Kano, Katsina, Zazzau, Gobir, Daura, Rano, Biram)",
      "Kano Emirate & Gidan Rumfa Palace",
      "Zazzau Emirate (Zaria City Walls & Tubali Architecture)",
      "Kanta's Kebbi Kingdom (Surame Monument)",
    ],
    notableTraditions: [
      "Kano Kofar Mata Indigo Dye Pits (1498)",
      "Tubali Sudano-Sahelian Earth Architecture",
      "Hawan Sallah / Emirate Durbar Processions",
      "Ajami Manuscript & Calligraphic Traditions",
      "Babban Riga Hand-Embroidered Robes",
    ],
    keyFigures: [
      "Queen Amina of Zazzau",
      "Sarki Muhammad Rumfa of Kano",
      "Hajiya Gambo Sawaba",
      "Alhaji Abubakar Imam",
    ],
    description:
      "Explore Hausa history, language, emirate traditions, festivals, architecture and cultural life.",
    introduction:
      "Hausa language, urban statecraft, and trans-Saharan commerce have shaped northern Nigeria for over a millennium. From the ancient walled birane (cities) of Kano, Zaria, Katsina, and Daura to the 15th-century Kofar Mata indigo dye pits and Ajami literary manuscripts, this collection connects Hausa architecture, craftsmanship, festivals, and historical biographies.",
  },
  {
    slug: "edo",
    name: "Edo",
    region: "South South",
    states: ["Edo", "Delta", "Ondo"],
    languages: ["Ẹ̀dó (Bini)", "Esan", "Afemai (Etsako / Owan / Akoko-Edo)"],
    kingdomsAndInstitutions: [
      "Great Kingdom of Benin (Oba of Benin Palace & Guilds)",
      "Igun Street Brass-Casters Guild (Igun Eronmwon)",
      "Igbesanmwan Ivory & Wood Carvers Guild",
      "Benin City Earthworks (Iya — World's Largest Ancient Earthwork System)",
    ],
    notableTraditions: [
      "Royal Benin Bronze Plaques & Commemorative Heads",
      "Queen Mother (Iyoba) Ivory Pendant Masks",
      "Ugie Erha Oba & Igue Royal Thanksgiving Festival",
      "Coral Bead Regalia (Ivie) & Olokun Ceremonial Arts",
    ],
    keyFigures: [
      "Queen Idia (First Iyoba of Uselu)",
      "Oba Ewuare the Great (15th Century)",
      "Oba Esigie (16th Century)",
      "Oba Ovonramwen Nogbaisi",
    ],
    description:
      "Discover Edo heritage, Benin history, royal institutions, artistic traditions and cultural memory.",
    introduction:
      "Edo heritage is anchored by the historic Kingdom of Benin (Edo), renowned globally for the monumental Iya earthworks, the hereditary Igun Street brass-casting guild, and the royal court arts of the Oba of Benin. Beyond courtly bronzes and carved ivory, Edo culture thrives in Igue festival rituals, Esan acrobatic traditions, and living lineage archives.",
  },
  {
    slug: "ijaw",
    name: "Ijaw",
    region: "South South",
    states: ["Bayelsa", "Rivers", "Delta", "Ondo", "Edo", "Akwa Ibom"],
    languages: ["Ịjọ (Izon, Kalabari, Nembe, Okrika, Ibani / Bonny)"],
    kingdomsAndInstitutions: [
      "Nembe (Brass) Kingdom",
      "Bonny (Ibani) Kingdom",
      "Kalabari (Elem Kalabari / Buguma) Kingdom",
      "Okrika & Opobo Riverine States",
    ],
    notableTraditions: [
      "Owuaya / Ekine Water Spirit Masquerades",
      "Kalabari Eria & Pelete Bite Cut-Thread Textiles",
      "Ndụẹn Fọbara Ancestral Memorial Screens (Duein Fubara)",
      "War Canoe Regattas & Aquatic Processions",
    ],
    keyFigures: [
      "King Jaja of Opobo",
      "King William Dappa Pepple of Bonny",
      "King Frederick William Koko of Nembe",
      "Major Isaac Adaka Boro & Gabriel Okara",
    ],
    description:
      "Explore Ijaw maritime kingdoms, delta water-spirit masquerades, ancestral screens, and riverine heritage.",
    introduction:
      "As one of Nigeria's oldest indigenous peoples inhabiting the Niger Delta mangrove creeks and Atlantic coast, Ijaw communities built influential maritime states including Bonny, Nembe, Kalabari, and Opobo. Their heritage features carved ancestral memorial screens (Duein Fubara), intricate Pelete Bite textiles, ceremonial canoe regattas, and deep ecological knowledge of the delta.",
  },
  {
    slug: "fulani",
    name: "Fulani",
    region: "North West",
    states: [
      "Adamawa",
      "Bauchi",
      "Gombe",
      "Kaduna",
      "Kano",
      "Katsina",
      "Kebbi",
      "Sokoto",
      "Taraba",
      "Zamfara",
    ],
    languages: ["Fulfulde (Pulaar)"],
    kingdomsAndInstitutions: [
      "Sokoto Caliphate",
      "Gwandu Emirate",
      "Adamawa (Fombina) Emirate in Yola",
      "Gombe, Bauchi, Muri & Ilorin Emirates",
    ],
    notableTraditions: [
      "Pulaaku Moral & Social Code (Munyal, Semteende, Hakkillo)",
      "Nana Asma'u 'Yan Taru Women's Scholarly Movement",
      "Arabic & Fulfulde Ajami Poetic Manuscripts",
      "Calabash Engraving & Embroidered Pastoral Attire",
    ],
    keyFigures: [
      "Shehu Usman dan Fodio",
      "Nana Asma'u bint Usman dan Fodio",
      "Abdullahi dan Fodio",
      "Modibbo Adama of Adamawa",
    ],
    description:
      "Discover Fulani and Fulfulde cultural traditions, scholarly manuscripts, histories, language and community life.",
    introduction:
      "Fulani (Fulɓe) communities across Nigeria encompass pastoral clans, urban scholars, and historic emirate founders. Central to their heritage are the ethical code of Pulaaku, the Fulfulde language, and the vast 19th-century corpus of Arabic, Hausa, and Fulfulde manuscripts authored by scholars such as Nana Asma'u and Abdullahi dan Fodio.",
  },
  {
    slug: "tiv",
    name: "Tiv",
    region: "North Central",
    states: ["Benue", "Taraba", "Nasarawa", "Plateau"],
    languages: ["Tiv"],
    kingdomsAndInstitutions: [
      "Tor Tiv Traditional Council (Gboko)",
      "Ya-na-Angbian Egalitarian Lineage Assemblies",
      "Kwagh-Hir Puppet & Masquerade Theatre Guilds",
    ],
    notableTraditions: [
      "Kwagh-Hir Sculpted Puppetry & Storytelling Theatre (UNESCO Heritage)",
      "A'nger Black-and-White Striped Handwoven Cloth",
      "Swange & Ingough Music and Dance Traditions",
      "Ate Reception Architecture",
    ],
    keyFigures: [
      "Akiga Sai (Pioneer Indigenous Tiv Historian)",
      "Adikpo (Master Kwagh-Hir Sculptors)",
      "Aper Aku",
    ],
    description:
      "Discover Tiv language, Kwagh-Hir theatre, A'nger textiles, dance, social traditions and Benue Valley history.",
    introduction:
      "Inhabiting the fertile Benue River valley, Tiv communities are celebrated for the UNESCO-inscribed Kwagh-Hir theatrical tradition—combining carved wooden puppets, masquerades, music, and moral narrative—as well as the iconic black-and-white striped A'nger woven cloth and Swange performance arts.",
  },
  {
    slug: "kanuri",
    name: "Kanuri",
    region: "North East",
    states: ["Borno", "Yobe", "Jigawa", "Bauchi"],
    languages: ["Kanuri (Yerwa & Manga dialects)"],
    kingdomsAndInstitutions: [
      "Kanem-Bornu Empire (Sayfawa Dynasty — Over 1,000 Years)",
      "Borno Emirate (Shehu of Borno in Maiduguri / Kukawa)",
      "Birni Ngazargamu & Rabih's Fort at Dikwa",
    ],
    notableTraditions: [
      "Bornu Calligraphic Qur'anic Manuscripts & Girgam Chronicles",
      "Borno Horsemanship & Royal Cavalry Regalia",
      "Traditional Incense (Turare) & Henna Arts",
      "Lake Chad Trans-Saharan Trade & Scholarly Centres",
    ],
    keyFigures: [
      "Mai Idris Alooma (16th-Century Kanem-Bornu Ruler)",
      "Shehu Muhammad al-Amin al-Kanemi",
      "Queen Mother Magira Aisa Kili Ngirmaramma",
    ],
    description:
      "Explore Kanuri history, language and traditions connected with northeastern Nigeria and the Lake Chad region.",
    introduction:
      "Kanuri cultural history is anchored in the Kanem-Bornu Empire, one of Africa's longest-enduring states around the Lake Chad basin. Documented in royal Girgam chronicles and prized calligraphic manuscripts, Kanuri heritage encompasses centuries of diplomacy, equestrian regalia, architecture at Birni Ngazargamu, and distinctive textile and aromatic traditions.",
  },
  {
    slug: "ibibio",
    name: "Ibibio",
    region: "South South",
    states: ["Akwa Ibom", "Cross River"],
    languages: ["Ibibio", "Annang", "Oron", "Eket"],
    kingdomsAndInstitutions: [
      "Oku Ibom Ibibio Paramount Institution",
      "Ekpo Onyoho, Ekpe & Idiong Traditional Societies",
      "Ibibio State Union (Founded 1928 — Pioneer Cultural & Educational Body)",
    ],
    notableTraditions: [
      "Ekpo Society Articulated Wooden Masks",
      "Nwomo Ancestral Funerary Cloth & Appliqué Shrines",
      "Nsibidi Ideographic Symbols",
      "Mbopo & Asian Uboikpa Ceremonial Arts",
    ],
    keyFigures: [
      "Nyong Essien",
      "Ikot Ekpene Master Woodcarvers",
      "Clement Isong",
    ],
    description:
      "Explore Ibibio and Annang woodcarving, Ekpo masks, Nsibidi symbolism, and coastal Akwa Ibom heritage.",
    introduction:
      "Situated across Akwa Ibom and neighbouring Cross River, the Ibibio and related Annang and Oron communities possess one of West Africa's most expressive sculptural traditions. Master carvers of Ikot Ekpene and surrounding towns produced articulated Ekpo society masks, funerary memorials, and Nsibidi-inscribed ritual objects.",
  },
  {
    slug: "efik",
    name: "Efik",
    region: "South South",
    states: ["Cross River", "Akwa Ibom"],
    languages: ["Efik"],
    kingdomsAndInstitutions: [
      "Obong of Calabar Treaty Throne (Old Calabar — Duke Town, Creek Town, Henshaw Town)",
      "Mgbe / Ekpe Leopard Society",
      "Old Residency Museum, Calabar (1884 Prefabricated Monument)",
    ],
    notableTraditions: [
      "Nsibidi Ideographic Script & Ukara Indigo Ritual Cloth",
      "Ekombi Classical Dance & Onyonyo Royal Gown",
      "Ekpe Masquerade & Brass Tray Engraving",
      "Calabar Culinary Heritage (Edikang Ikong, Afang & Ekpang Nkukwo)",
    ],
    keyFigures: [
      "King Eyo Honesty II of Creek Town",
      "Chief Margaret Ekpo",
      "Etim Ekpo & Calabar Ekpe Custodians",
    ],
    description:
      "Explore Efik history, Nsibidi symbols, Ekpe society, language, cuisine, festivals and Old Calabar traditions.",
    introduction:
      "Centered in the historic port city-states of Old Calabar along the Cross River estuary, Efik communities developed cosmopolitan diplomacy, early printed Efik literature, the Nsibidi graphic system, the Ekpe society, and graceful Ekombi performance traditions.",
  },
  {
    slug: "nupe",
    name: "Nupe",
    region: "North Central",
    states: ["Niger", "Kwara", "Kogi", "FCT Abuja"],
    languages: ["Nupe (Nupenci)"],
    kingdomsAndInstitutions: [
      "Bida Emirate (Etsu Nupe)",
      "Lafiagi, Patigi & Tsaragi Royal Nupe States",
      "Masaga Glassmakers Guild & Tswata Mukun Brassworkers Guild (Bida)",
    ],
    notableTraditions: [
      "Masaga Hand-Formed Molten Glass Beads & Bangles (Bida)",
      "Nupe Repoussé Brass & Copper Vessels",
      "Pategi Regatta on the River Niger",
      "Ndako Gboya Tall Cloth Masquerade",
    ],
    keyFigures: [
      "Tsoede (Edegi — Legendary Founder of the Nupe Kingdom)",
      "Etsu Masaba & Etsu Umaru Majigi",
      "Ladi Kwali (nearby Gbagyi/Minna Emirate ceramic pioneer)",
    ],
    description:
      "Discover Nupe glassmaking guilds in Bida, Tsoede bronzes, repoussé metalwork, and Niger River regattas.",
    introduction:
      "Along the middle Niger and Kaduna rivers, the Nupe Kingdom—founded in tradition by the culture hero Tsoede—is celebrated for the Tsoede bronzes found at Tada and Jebba, and the hereditary craft guilds of Bida, where Masaga glassmakers and brassworkers still produce prized vessels and ornaments.",
  },
  {
    slug: "urhobo",
    name: "Urhobo",
    region: "South South",
    states: ["Delta", "Bayelsa", "Edo"],
    languages: ["Urhobo", "Okpe", "Isoko"],
    kingdomsAndInstitutions: [
      "24 Traditional Urhobo Kingdoms (including Okpe, Agbon, Ughelli, Uvwie, Abraka)",
      "Ohworode of Olomu & Orodje of Okpe",
    ],
    notableTraditions: [
      "Iphri (Ivri) Sculptures of Personal Resolve & Leadership",
      "Ohworu Water-Spirit Masquerades & Stilt Dances",
      "Udje Satirical Oral Poetic Song Tradition",
    ],
    keyFigures: [
      "Chief Mukoro Mowoe",
      "Bruce Onobrakpeya (Master Printmaker & Sculptor)",
      "Tanure Ojaide",
    ],
    description:
      "Explore Urhobo Kingdoms of the western Niger Delta, Ivri sculptures, Udje oral poetry, and masquerade arts.",
    introduction:
      "Comprising twenty-four traditional kingdoms in Delta State, the Urhobo people are renowned for monumental wooden shrine sculptures, personal Ivri figures representing balance between assertiveness and restraint, and the rigorous Udje oral poetic tradition.",
  },
  {
    slug: "itsekiri",
    name: "Itsekiri",
    region: "South South",
    states: ["Delta", "Edo"],
    languages: ["Itsekiri (Iwere)"],
    kingdomsAndInstitutions: [
      "Kingdom of Warri (Olu of Warri at Ode-Itsekiri / Warri)",
    ],
    notableTraditions: [
      "Olu of Warri Silver & Coral Crown Regalia",
      "Omoko & Awankere Royal Court Dances",
      "George Madras Silk-and-Cotton Wrapper Attire & Kembe Regalia",
      "Royal Canoe Processions on the Forcados & Warri Rivers",
    ],
    keyFigures: [
      "Olu Ginuwa I (15th-Century Founder of Warri Kingdom)",
      "Olu Dom Domingos (Atuwatse I — 17th-Century Coimbra-Educated Monarch)",
      "Chief Nana Olomu (Governor of the Benin River)",
    ],
    description:
      "Explore the Kingdom of Warri, Olu of Warri court regalia, Chief Nana Olomu's Living History Museum, and Itsekiri riverine culture.",
    introduction:
      "Founded in the late 15th century by Prince Ginuwa from Benin, the Itsekiri Kingdom of Warri (Iwere) forged early diplomatic and scholarly ties across the Atlantic while maintaining distinct Yoruba-Edo linguistic roots, court pageantry, and riverine maritime architecture such as Chief Nana Olomu's palace at Koko.",
  },
  {
    slug: "gbagyi",
    name: "Gbagyi",
    region: "North Central",
    states: ["FCT Abuja", "Niger", "Kaduna", "Nasarawa", "Kogi"],
    languages: ["Gbagyi (Gbari — Gbagyi Nkwa & Gbagyi Nge)"],
    kingdomsAndInstitutions: [
      "Sa Gbagyi / Etsu Karu, Bwari, Kwali & Minna Traditional Chiefdoms",
      "Abuja (Suleja) & Kwali Pottery Guilds",
    ],
    notableTraditions: [
      "Coiled & Incised Water Jars (Randa / Tulu) — Ladi Kwali Ceramic Tradition",
      "Knunu Spiritual & Agrarian Ethics",
      "Oseji Shoulder-Carrying Symbolism (Peaceful Coexistence & Trust)",
      "Zhibaje & Asakpata Music and Masquerade Festivals",
    ],
    keyFigures: [
      "Dr. Ladi Dosei Kwali (World-Renowned Master Potter of Kwali, Abuja)",
      "Indigenous Custodians of Zuma Rock & Abuja Highlands",
    ],
    description:
      "Discover Gbagyi ceramic artistry, Dr. Ladi Kwali's pottery legacy, and the indigenous heritage of Abuja and North-Central Nigeria.",
    introduction:
      "Indigenous to Nigeria's Federal Capital Territory (Abuja) and surrounding North-Central states, the Gbagyi people are celebrated globally for their ceramic artistry—exemplified by Dr. Ladi Kwali, whose incised water jars stand on the Nigerian twenty-naira note and in museums worldwide.",
  },
];

export function getCultureBySlug(slug) {
  if (!slug) return undefined;
  const normalized = String(slug).trim().toLowerCase();
  return cultures.find((culture) => culture.slug === normalized);
}

export function getCultureByName(name) {
  if (!name) return undefined;
  const normalized = String(name).trim().toLowerCase();
  return cultures.find(
    (culture) =>
      culture.name.toLowerCase() === normalized ||
      culture.slug === normalized ||
      normalized.includes(culture.name.toLowerCase())
  );
}
