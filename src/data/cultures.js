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
      "Ekiti"
    ],
    description:
      "Explore Yoruba histories, language, festivals, foods, personalities, artistic traditions and living cultural practices.",
    introduction:
      "Yoruba communities are concentrated mainly in southwestern Nigeria, with extensive communities elsewhere in Nigeria and across the world. Moji's Heritage brings together stories about Yoruba history, language, festivals, food, people and traditions in one place."
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
      "Imo"
    ],
    description:
      "Discover Igbo histories, languages, festivals, foods, institutions and living traditions.",
    introduction:
      "Igbo cultural life encompasses diverse communities across southeastern Nigeria and beyond. Traditions differ between communities, so Moji's Heritage presents Igbo heritage as a diverse and evolving cultural landscape rather than a single uniform experience."
  },
  {
    slug: "hausa",
    name: "Hausa",
    region: "Northern Nigeria",
    states: [
      "Kano",
      "Katsina",
      "Kaduna",
      "Kebbi",
      "Jigawa",
      "Sokoto",
      "Zamfara"
    ],
    description:
      "Explore Hausa history, language, emirate traditions, festivals, architecture and cultural life.",
    introduction:
      "Hausa language and culture have shaped communities across northern Nigeria and the wider Sahel. This collection connects histories, festivals, personalities, language and living cultural traditions associated with Hausa communities."
  },
  {
    slug: "edo",
    name: "Edo",
    region: "South South",
    states: ["Edo"],
    description:
      "Discover Edo heritage, Benin history, royal institutions, artistic traditions and cultural memory.",
    introduction:
      "Edo heritage is closely associated with the historic Benin Kingdom, but its cultural significance extends into language, religion, craftsmanship, festivals, royal institutions and contemporary community life."
  },
  {
    slug: "efik",
    name: "Efik",
    region: "South South",
    states: ["Cross River"],
    description:
      "Explore Efik history, language, cuisine, festivals and community traditions.",
    introduction:
      "Efik communities have played important roles in the history and cultural life of southeastern coastal Nigeria. This collection brings together stories relating to Efik language, food, festivals, personalities and traditions."
  },
  {
    slug: "tiv",
    name: "Tiv",
    region: "North Central",
    states: [
      "Benue",
      "Taraba",
      "Nasarawa"
    ],
    description:
      "Discover Tiv language, dance, social traditions, history and cultural expression.",
    introduction:
      "Tiv heritage includes rich traditions of performance, storytelling, language, social organisation and community life. This collection provides a starting point for exploring those traditions."
  },
  {
    slug: "kanuri",
    name: "Kanuri",
    region: "North East",
    states: [
      "Borno",
      "Yobe"
    ],
    description:
      "Explore Kanuri history, language and traditions connected with northeastern Nigeria and the Lake Chad region.",
    introduction:
      "Kanuri cultural history is closely connected with the long history of the Kanem-Bornu world and communities around the Lake Chad region. This collection explores that heritage through history, language and living cultural traditions."
  },
  {
    slug: "fulani",
    name: "Fulani",
    region: "Multiple Regions",
    states: [
      "Adamawa",
      "Bauchi",
      "Gombe",
      "Kaduna",
      "Kano",
      "Katsina",
      "Sokoto",
      "Taraba"
    ],
    description:
      "Discover Fulani and Fulfulde cultural traditions, histories, language and community life.",
    introduction:
      "Fulani communities are spread across Nigeria and much of West Africa. Their histories and ways of life are diverse, including pastoral, urban, scholarly and political traditions."
  }
];

export function getCultureBySlug(slug) {
  return cultures.find(
    (culture) => culture.slug === slug
  );
}