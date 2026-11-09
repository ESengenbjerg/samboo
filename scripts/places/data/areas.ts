// The areas of each municipality, entered by hand and only for municipalities we can check ourselves.
// Keyed by municipality name, because the ids in the municipalities table differ between projects.
//
// name is the spelling the agencies use, which is what listings.area is matched against.
// display_name is set only when the app should show something else.

export type AreaSeed = { name: string; display_name?: string };

export const AREAS: Record<string, AreaSeed[]> = {
  Göteborg: [
    { name: "Göteborg", display_name: "Göteborg centrum" },
    { name: "Östra Göteborg" },
    { name: "Östra Centrum" },
    { name: "Västra Centrum" },
    { name: "Frölunda" },
    { name: "Västra Frölunda" },
    { name: "Innerstaden" },
    { name: "Ängås" },
    { name: "Hisingen" },
    { name: "Hisings Kärra" },
    { name: "Torslanda" },
    { name: "Askim" },
    { name: "Högsbo" },
    { name: "Olofstorp" },
    { name: "Billdal" },
    { name: "Almedal/Johanneberg" },
    { name: "Näset" },
    { name: "Centrala Hisingen" },
    { name: "Hovås" },
    { name: "Tynnered" },
    { name: "Södra Skärgården" },
    { name: "Angered" },
    { name: "Ekebäck" },
    { name: "Säve" },
    { name: "Hammarkullen" },
    { name: "Önnered" },
    { name: "Grimmered" },
    { name: "Hisings Backa" },
    { name: "Långedrag" },
  ],

  Mölndal: [
    { name: "Mölndal", display_name: "Mölndal centrum" },
    { name: "Kållered" },
    { name: "Lindome" },
  ],

  Partille: [
    { name: "Öjersjö" },
    { name: "Furuskog" },
    { name: "Jonsered" },
    { name: "Lexby" },
    { name: "Lexbydal" },
    { name: "Sävedalen" },
    { name: "Partille", display_name: "Partille centrum" },
    { name: "Furulund" },
    { name: "Furumossen" },
  ],
};
