export type SafariPlace = {
  aliases: string[];
  country: "kenya" | "tanzania";
  label: string;
  lat: string;
  lng: string;
};

export const SAFARI_PLACES: SafariPlace[] = [
  {
    aliases: ["masai mara", "maasai mara", "masai mara national reserve", "maasai mara national reserve", "mara"],
    country: "kenya",
    label: "Masai Mara National Reserve, Kenya",
    lat: "-1.490000",
    lng: "35.140000",
  },
  {
    aliases: ["amboseli", "amboseli national park"],
    country: "kenya",
    label: "Amboseli National Park, Kenya",
    lat: "-2.652700",
    lng: "37.260800",
  },
  {
    aliases: ["lake nakuru", "nakuru national park"],
    country: "kenya",
    label: "Lake Nakuru National Park, Kenya",
    lat: "-0.366700",
    lng: "36.083300",
  },
  {
    aliases: ["samburu", "samburu national reserve"],
    country: "kenya",
    label: "Samburu National Reserve, Kenya",
    lat: "0.590000",
    lng: "37.520000",
  },
  {
    aliases: ["tsavo east", "tsavo east national park"],
    country: "kenya",
    label: "Tsavo East National Park, Kenya",
    lat: "-2.750000",
    lng: "38.750000",
  },
  {
    aliases: ["tsavo west", "tsavo west national park"],
    country: "kenya",
    label: "Tsavo West National Park, Kenya",
    lat: "-3.400000",
    lng: "38.000000",
  },
  {
    aliases: ["nairobi", "nairobi national park"],
    country: "kenya",
    label: "Nairobi National Park, Kenya",
    lat: "-1.373300",
    lng: "36.858800",
  },
  {
    aliases: ["mount kenya", "mt kenya"],
    country: "kenya",
    label: "Mount Kenya National Park, Kenya",
    lat: "-0.152000",
    lng: "37.308000",
  },
  {
    aliases: ["serengeti", "serengeti national park"],
    country: "tanzania",
    label: "Serengeti National Park, Tanzania",
    lat: "-2.333300",
    lng: "34.833300",
  },
  {
    aliases: ["ngorongoro", "ngorongoro crater", "ngorongoro conservation area"],
    country: "tanzania",
    label: "Ngorongoro Conservation Area, Tanzania",
    lat: "-3.200000",
    lng: "35.500000",
  },
  {
    aliases: ["tarangire", "tarangire national park"],
    country: "tanzania",
    label: "Tarangire National Park, Tanzania",
    lat: "-3.833300",
    lng: "36.000000",
  },
  {
    aliases: ["lake manyara", "manyara national park"],
    country: "tanzania",
    label: "Lake Manyara National Park, Tanzania",
    lat: "-3.500000",
    lng: "35.800000",
  },
  {
    aliases: ["kilimanjaro", "mount kilimanjaro", "mt kilimanjaro"],
    country: "tanzania",
    label: "Mount Kilimanjaro National Park, Tanzania",
    lat: "-3.067400",
    lng: "37.355600",
  },
  {
    aliases: ["zanzibar", "stone town zanzibar"],
    country: "tanzania",
    label: "Zanzibar, Tanzania",
    lat: "-6.165900",
    lng: "39.202600",
  },
  {
    aliases: ["arusha", "arusha national park"],
    country: "tanzania",
    label: "Arusha National Park, Tanzania",
    lat: "-3.250000",
    lng: "36.750000",
  },
];

export function normalizePlaceQuery(value: string) {
  return value
    .toLowerCase()
    .replace(/maasai/g, "masai")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

export function matchSafariPlaces(query: string, country?: string) {
  const normalized = normalizePlaceQuery(query);
  if (!normalized) return [];

  return SAFARI_PLACES.filter((place) => {
    if (country && place.country !== country) return false;
    return place.aliases.some((alias) => {
      const normalizedAlias = normalizePlaceQuery(alias);
      return (
        normalized.includes(normalizedAlias) ||
        normalizedAlias.includes(normalized) ||
        normalized.split(" ").some((word) => word.length > 3 && normalizedAlias.includes(word))
      );
    });
  });
}
