import type { FamilySnapshot, Person } from "@/lib/types";

function person(
  id: string,
  givenName: string,
  surname: string,
  extra: Partial<Omit<Person, "id" | "givenName" | "surname">> = {},
): Person {
  return {
    id,
    givenName,
    surname,
    nickname: extra.nickname ?? null,
    suffix: extra.suffix ?? null,
    photoUrl: extra.photoUrl ?? null,
    birthDate: extra.birthDate ?? null,
    birthPlace: extra.birthPlace ?? null,
    deathDate: extra.deathDate ?? null,
    isDeceased: extra.isDeceased ?? false,
    headstoneLocation: extra.headstoneLocation ?? null,
    headstonePhotoUrl: extra.headstonePhotoUrl ?? null,
    familysearchId: extra.familysearchId ?? null,
    notes: extra.notes ?? null,
  };
}

const deceased = { isDeceased: true as const };

export const seedSnapshot: FamilySnapshot = {
  people: [
    person("felix-mitchell", "Felix", "Mitchell", {
      ...deceased,
      birthDate: "December 1839",
      birthPlace: "Georgia",
      deathDate: "May 20, 1918",
      notes:
        "Great-great-grandfather. The tree begins with Felix and Adaline.",
    }),
    person("adaline-kiah", "Adaline", "Kiah", {
      ...deceased,
      birthDate: "1850",
      familysearchId: "KCGK-SJL",
    }),
    person("bill-mitchell", "Bill", "Mitchell", {
      ...deceased,
      birthDate: "1835",
      familysearchId: "LYRX-VWG",
      notes: "Brother of Felix Mitchell.",
    }),
    person("philip-mitchell", "Philip", "Mitchell", {
      ...deceased,
      suffix: "Sr",
      birthDate: "1874",
      familysearchId: "LYLG-B73",
      notes: "Also listed in the family booklet as Phillip Mitchell Sr.",
    }),
    person("hilliard-mitchell", "Hilliard", "Mitchell", {
      ...deceased,
      birthDate: "1876",
      familysearchId: "LYL1-DWQ",
    }),
    person("claborn-mitchell", "Claborn", "Mitchell", {
      ...deceased,
      birthDate: "1878",
      familysearchId: "LYLG-Y36",
    }),
    person("david-mitchell", "David", "Mitchell", {
      ...deceased,
      birthDate: "1880",
      familysearchId: "LYLP-M2V",
    }),
    person("james-mitchell", "James", "Mitchell", {
      ...deceased,
      birthDate: "1881",
      deathDate: "1950",
      familysearchId: "LYLP-SSZ",
    }),
    person("mittie-ann-mitchell", "Mittie Ann", "Mitchell", {
      ...deceased,
      birthDate: "1883",
      deathDate: "1916",
      familysearchId: "KCQH-H8",
      notes: "Great-grandmother.",
    }),
    person("georgia-mitchell", "Georgia", "Mitchell", {
      ...deceased,
      birthDate: "1884",
      deathDate: "1919",
      familysearchId: "K8KR-62M",
      notes:
        "Wife of E.D. Baisden before he married Ida Ola Lee Humphrey (Mittie Ann’s daughter).",
    }),
    person("autmon-mitchell", "Autmon", "Mitchell", {
      ...deceased,
      suffix: "Sr",
      birthDate: "1885",
      deathDate: "1951",
      familysearchId: "LYLP-S9R",
    }),
    person("ed-baisden", "E.D.", "Baisden", {
      notes:
        "Married Georgia Mitchell, and later married Ida Ola Lee Humphrey after Georgia’s death.",
    }),
    person("ida-ola-lee-humphrey", "Ida Ola Lee", "Humphrey", {
      notes: "Daughter of Mittie Ann Mitchell. Grandmother.",
    }),

    person("beatrice-mitchell", "Beatrice", "Mitchell"),
    person("mattie-lee-mitchell", "Mattie Lee", "Mitchell"),
    person("rosco-mitchell", "Rosco", "Mitchell"),
    person("phillip-mitchell", "Phillip", "Mitchell"),
    person("mary-edith-mitchell", "Mary Edith", "Mitchell"),
    person("roylo-mitchell", "Roylo", "Mitchell"),
    person("carrie-mitchell", "Carrie", "Mitchell"),
    person("robert-mitchell", "Robert", "Mitchell"),
    person("vera-mitchell", "Vera", "Mitchell"),

    person("autmon-mitchell-jr", "Autmon", "Mitchell", { suffix: "Jr" }),
    person("willie-frank-mitchell-sr", "Willie Frank", "Mitchell", {
      suffix: "Sr",
    }),
    person("james-fangalang-mitchell", "James", "Mitchell", {
      nickname: "Fangalang",
    }),
    person("daniel-mitchell", "Daniel", "Mitchell"),
    person("erosker-mitchell", "Erosker", "Mitchell"),
    person("kendrick-mitchell", "Kendrick", "Mitchell"),
    person("frederick-lee-mitchell", "Frederick Lee", "Mitchell"),
    person("emma-mitchell-payne", "Emma", "Mitchell Payne"),
    person("lewis-mitchell", "Lewis", "Mitchell"),

    person("james-jim-mitchell", "James", "Mitchell", { nickname: "Jim" }),
    person("james-jimbo-mitchell", "James", "Mitchell", { nickname: "Jimbo" }),
    person("taylor-mitchell-sr", "Taylor", "Mitchell", { suffix: "Sr" }),
    person("morgan-zang-mitchell", "Morgan", "Mitchell", { nickname: "Zang" }),
    person("governor-mitchell", "Governor", "Mitchell"),
    person("pasomore-feechie-mitchell", "Pasomore", "Mitchell", {
      nickname: "Feechie",
    }),
    person("tolby-mitchell", "Tolby", "Mitchell"),
    person("mozella-mitchell", "Mozella", "Mitchell"),
    person("selphy-annie-mitchell", "Selphy", "Mitchell", { nickname: "Annie" }),
    person("ernest-mitchell", "Ernest", "Mitchell"),
    person("fp-mitchell", "F P", "Mitchell"),
    person("mannie-c-mitchell", "Mannie C", "Mitchell"),
    person("le-mitchell", "L E", "Mitchell"),
    person("joseph-mitchell", "Joseph", "Mitchell"),
  ],
  contacts: [],
  parentChildren: [
    ...[
      "philip-mitchell",
      "hilliard-mitchell",
      "claborn-mitchell",
      "david-mitchell",
      "james-mitchell",
      "mittie-ann-mitchell",
      "georgia-mitchell",
      "autmon-mitchell",
    ].flatMap((childId) => [
      { parentId: "felix-mitchell", childId },
      { parentId: "adaline-kiah", childId },
    ]),
    ...[
      "beatrice-mitchell",
      "mattie-lee-mitchell",
      "rosco-mitchell",
      "phillip-mitchell",
      "mary-edith-mitchell",
      "roylo-mitchell",
      "carrie-mitchell",
      "robert-mitchell",
      "vera-mitchell",
    ].map((childId) => ({ parentId: "philip-mitchell", childId })),
    ...[
      "autmon-mitchell-jr",
      "willie-frank-mitchell-sr",
      "james-fangalang-mitchell",
      "daniel-mitchell",
      "erosker-mitchell",
      "kendrick-mitchell",
      "frederick-lee-mitchell",
      "emma-mitchell-payne",
      "lewis-mitchell",
    ].map((childId) => ({ parentId: "autmon-mitchell", childId })),
    { parentId: "mittie-ann-mitchell", childId: "ida-ola-lee-humphrey" },
  ],
  partnerships: [
    {
      id: "union-felix-adaline",
      personAId: "felix-mitchell",
      personBId: "adaline-kiah",
      startDate: "03 Sep 1873",
      place: "Hamilton, Florida, United States",
      notes: null,
    },
    {
      id: "union-georgia-ed",
      personAId: "georgia-mitchell",
      personBId: "ed-baisden",
      startDate: null,
      place: null,
      notes: "First marriage of E.D. Baisden.",
    },
    {
      id: "union-ida-ed",
      personAId: "ida-ola-lee-humphrey",
      personBId: "ed-baisden",
      startDate: null,
      place: null,
      notes: "Married after the death of Georgia Mitchell.",
    },
  ],
  residences: [
    {
      id: "res-felix-1870",
      personId: "felix-mitchell",
      year: "1870",
      place: "Georgia, United States",
    },
    {
      id: "res-felix-1900",
      personId: "felix-mitchell",
      year: "1900",
      place: "Precinct 7, Octahatchee, Hamilton, Florida, United States",
    },
    {
      id: "res-felix-1910",
      personId: "felix-mitchell",
      year: "1910",
      place: "Octahatchee, Hamilton, Florida, United States",
    },
  ],
  siblings: [{ personAId: "felix-mitchell", personBId: "bill-mitchell" }],
  profiles: [],
  changeRequests: [],
  auditEvents: [],
  committeeInvites: [],
};

export const UNPLACED_IDS = [
  "james-jim-mitchell",
  "james-jimbo-mitchell",
  "taylor-mitchell-sr",
  "morgan-zang-mitchell",
  "governor-mitchell",
  "pasomore-feechie-mitchell",
  "tolby-mitchell",
  "mozella-mitchell",
  "selphy-annie-mitchell",
  "ernest-mitchell",
  "fp-mitchell",
  "mannie-c-mitchell",
  "le-mitchell",
  "joseph-mitchell",
  "ed-baisden",
] as const;
