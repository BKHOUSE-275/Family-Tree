import type { FamilySnapshot, ParentChild, Person } from "@/lib/types";

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

const SLOT_COUNTS = Array.from({ length: 14 }, (_, index) => index + 1);

function slotDemoFamily(): {
  people: Person[];
  parentChildren: ParentChild[];
} {
  const people: Person[] = [
    person("slot-demo", "Slot", "Demo", {
      birthDate: "January 1, 2000",
      notes:
        "Temporary placement preview. Open 1–14 to see that many children on the branch.",
    }),
  ];
  const parentChildren: ParentChild[] = [
    { parentId: "felix-mitchell", childId: "slot-demo" },
    { parentId: "adaline-kiah", childId: "slot-demo" },
  ];

  for (const count of SLOT_COUNTS) {
    const parentId = `slot-n-${count}`;
    people.push(
      person(parentId, String(count), "Seats", {
        birthDate: `January ${count}, 2001`,
        notes: `Placement preview with ${count} child${count === 1 ? "" : "ren"}.`,
      }),
    );
    parentChildren.push({ parentId: "slot-demo", childId: parentId });
    for (let child = 1; child <= count; child += 1) {
      const childId = `slot-n-${count}-c-${child}`;
      people.push(
        person(childId, String(child), "", {
          birthDate: `February ${child}, ${2000 + count}`,
        }),
      );
      parentChildren.push({ parentId, childId });
    }
  }

  return { people, parentChildren };
}

const slotDemo = slotDemoFamily();

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
      nickname: "Jim",
      birthDate: "1881",
      deathDate: "1950",
      familysearchId: "LYLP-SSZ",
      notes: "Also listed as James (Jim) Henry Mitchell.",
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
      notes:
        "Daughter of Mittie Ann Mitchell. Grandmother. Also listed as Ola Lee Humphrey Baisden.",
    }),

    // Philip Sr children
    person("beatrice-mitchell", "Beatrice", "Mitchell"),
    person("mattie-lee-mitchell", "Mattie Lee", "Mitchell"),
    person("rosco-mitchell", "Rosco", "Mitchell"),
    person("phillip-mitchell", "Phillip", "Mitchell", { nickname: "Dugg" }),
    person("mary-edith-mitchell", "Mary Edith", "Mitchell"),
    person("roylo-mitchell", "Roylo", "Mitchell"),
    person("carrie-mitchell", "Carrie", "Mitchell"),
    person("robert-mitchell", "Robert", "Mitchell"),
    person("vera-mitchell", "Vera", "Mitchell", { nickname: "Suga" }),

    // Autmon Sr children
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
    person("emma-mitchell-payne", "Emma", "Mitchell", {
      notes: "Also listed as Emma Mitchell Payne.",
    }),
    person("lewis-mitchell", "Lewis", "Mitchell"),

    // James (Jim) Henry children
    person("james-jimbo-mitchell", "James", "Mitchell", { nickname: "Jimbo" }),
    person("taylor-mitchell-sr", "Taylor", "Mitchell", { suffix: "Sr" }),
    person("morgan-zang-mitchell", "Morgan", "Mitchell", { nickname: "Zang" }),
    person("governor-mitchell", "Governor", "Mitchell"),
    person("pasomore-feechie-mitchell", "Pasomore", "Mitchell", {
      nickname: "Feechie",
    }),
    person("tolby-mitchell", "Toby", "Mitchell"),
    person("mozella-mitchell", "Mozella", "Mitchell"),
    person("selphy-annie-mitchell", "Selphy", "Mitchell", { nickname: "Annie" }),
    person("ernest-mitchell", "Ernest", "Mitchell"),
    person("fp-mitchell", "F P", "Mitchell"),
    person("mannie-c-mitchell", "Mannie C", "Mitchell"),
    person("le-mitchell", "L E", "Mitchell"),
    person("joseph-mitchell", "Joseph", "Mitchell"),

    // Mittie / Ola Lee line
    person("herdie-eldred-baisden", "Herdie Eldred", "Baisden"),
    person("eustis-baisden", "Eustis", "Baisden"),
    person("herdie-eldred-lee-baisden", "Herdie Eldred Lee", "Baisden"),
    person("carol-labonte", "Carol", "Labonte"),
    person("carlton-baisden-sr", "Carlton", "Baisden", { suffix: "Sr" }),
    person("brenda-elaine-baisden", "Brenda Elaine", "Baisden"),
    person("edward-bernard-baisden-sr", "Edward Bernard", "Baisden", {
      suffix: "Sr",
    }),

    // James (Jim) Henry grandchildren — Jimbo
    person("damon-mitchell", "Damon", "Mitchell"),
    person("ella-mae-mitchell", "Ella Mae", "Mitchell"),
    person("son-mitchell", "Son", "Mitchell"),
    person("verta-lee-mitchell", "Verta Lee", "Mitchell"),
    person("maude-mitchell", "Maude", "Mitchell"),
    person("lula-mae-mitchell", "Lula Mae", "Mitchell"),
    person("lilly-mitchell", "Lilly", "Mitchell"),
    person("reatha-mitchell", "Reatha", "Mitchell"),
    person("mersener-mitchell", "Mersener", "Mitchell"),
    person("cinderella-mitchell", "Cinderella", "Mitchell"),
    person("elbert-mitchell", "Elbert", "Mitchell"),
    person("pearline-mitchell", "Pearline", "Mitchell"),

    // Taylor Sr grandchildren
    person("taylor-mitchell-jr", "Taylor", "Mitchell", {
      nickname: "TJ",
      suffix: "Jr",
    }),
    person("ruth-mitchell", "Ruth", "Mitchell"),
    person("eliza-mitchell", "Eliza", "Mitchell"),
    person("andrew-mitchell", "Andrew", "Mitchell"),
    person("bernard-mitchell", "Bernard", "Mitchell"),
    person("gussie-mitchell", "Gussie", "Mitchell"),

    // Governor grandchildren
    person("sylvester-mitchell", "Sylvester", "Mitchell"),
    person("thelma-mitchell", "Thelma", "Mitchell"),
    person("queen-esther-mitchell", "Queen Esther", "Mitchell"),

    // Pasomore grandchildren
    person("frankie-mitchell", "Frankie", "Mitchell"),
    person("sharon-mitchell", "Sharon", "Mitchell"),

    // Toby grandchildren
    person("buddy-mitchell", "Buddy", "Mitchell"),

    // Mozella grandchildren
    person("booker-t-mitchell", "Booker T.", "Mitchell"),
    person("rozella-mitchell", "Rozella", "Mitchell"),

    // Mannie C grandchildren
    person("earnest-mannie-mitchell", "Earnest", "Mitchell"),
    person("queen-mannie-mitchell", "Queen", "Mitchell"),
    person("delores-mitchell", "Delores", "Mitchell"),
    person("eloise-mitchell", "Eloise", "Mitchell"),
    person("elvina-babydoll-mitchell", "Elvina", "Mitchell", {
      nickname: "Babydoll",
    }),
    person("david-mannie-mitchell", "David", "Mitchell"),
    person("minnie-mitchell", "Minnie", "Mitchell"),
    person("jeanette-mitchell", "Jeanette", "Mitchell"),

    // Philip Sr grandchildren — Vera (Suga)
    person("earnest-jackson-ej", "Earnest Jackson", "Mitchell", {
      nickname: "EJ",
    }),
    person("dale-vera-mitchell", "Dale", "Mitchell"),
    person("james-vera-mitchell", "James", "Mitchell"),
    person("mary-francis-mitchell", "Mary Francis", "Mitchell"),
    person("harry-vera-mitchell", "Harry", "Mitchell"),
    person("neaima-mitchell", "Neaima", "Mitchell"),
    person("wadie-ruth-mitchell", "Wadie Ruth", "Mitchell"),

    // Rosco grandchildren
    person("ellis-mitchell", "Ellis", "Mitchell"),
    person("elton-mitchell", "Elton", "Mitchell"),

    // Mary Edith grandchildren
    person("henry-jr-mitchell", "Henry", "Mitchell", { suffix: "Jr" }),
    person("almeta-mitchell", "Almeta", "Mitchell"),
    person("alzora-mitchell", "Alzora", "Mitchell"),
    person("evelyn-mitchell", "Evelyn", "Mitchell"),
    person("patricia-mitchell", "Patricia", "Mitchell"),
    person("sarah-mitchell", "Sarah", "Mitchell"),

    // Phillip (Dugg) grandchildren
    person("junior-dugg-mitchell", "Junior", "Mitchell"),
    person("mary-lee-dugg-mitchell", "Mary Lee", "Mitchell"),
    person("isaiah-mitchell", "Isaiah", "Mitchell"),
    person("earl-mitchell", "Earl", "Mitchell"),
    person("gaye-mitchell", "Gaye", "Mitchell"),
    person("robert-dugg-mitchell", "Robert", "Mitchell"),
    person("tootsie-mitchell", "Tootsie", "Mitchell"),

    // Carrie grandchildren
    person("moses-poochie-mitchell", "Moses", "Mitchell", {
      nickname: "Poochie",
    }),

    // Robert grandchildren
    person("robert-mitchell-jr", "Robert", "Mitchell", {
      nickname: "Billy Joe",
      suffix: "Jr",
    }),
    person("laton-mitchell", "Laton", "Mitchell"),
    person("vonda-mitchell", "Vonda", "Mitchell"),
    person("priscilla-mitchell", "Priscilla", "Mitchell"),

    // Autmon Jr grandchildren
    person("pat-autmon-mitchell", "Pat", "Mitchell"),
    person("bonita-mitchell", "Bonita", "Mitchell"),
    person("wanda-mitchell", "Wanda", "Mitchell"),

    // Willie Frank Sr grandchildren
    person("willie-frank-mitchell-jr", "Willie Frank", "Mitchell", {
      suffix: "Jr",
    }),
    person("julia-mitchell", "Julia", "Mitchell"),
    person("vanessa-mitchell", "Vanessa", "Mitchell"),
    person("robert-lee-mitchell", "Robert Lee", "Mitchell"),

    // Kendrick grandchildren
    person("albertha-mitchell", "Albertha", "Mitchell"),
    person("james-kendrick-mitchell", "James", "Mitchell"),

    // Daniel grandchildren
    person("billy-daniel-mitchell", "Billy", "Mitchell"),
    person("laquitia-mitchell", "Laquitia", "Mitchell"),
    person("franklin-mitchell", "Franklin", "Mitchell"),
    person("carolyn-mitchell", "Carolyn", "Mitchell"),
    person("rosetta-mitchell", "Rosetta", "Mitchell"),
    person("shelly-mitchell", "Shelly", "Mitchell"),
    person("kirkland-mitchell", "Kirkland", "Mitchell"),
    person("daniel-mitchell-jr", "Daniel", "Mitchell", { suffix: "Jr" }),

    // Erosker grandchildren
    person("mae-lillie-williams", "Mae Lillie", "Williams"),
    person("quillan-davis-mitchell", "Quillan Davis", "Mitchell"),
    person("ossie-mae-howell", "Ossie Mae", "Howell"),
    person("aline-mitchell", "Aline", "Mitchell"),
    person("ervine-cole", "Ervine", "Cole"),
    person("leon-mitchell-sr", "Leon", "Mitchell", { suffix: "Sr" }),
    person("alphonso-mitchell", "Alphonso", "Mitchell"),
    person("margie-lee-mitchell-armstrong", "Margie Lee", "Mitchell-Armstrong"),

    // Emma grandchildren
    person("lawrence-emma-mitchell", "Lawrence", "Mitchell"),
    person("idella-mitchell", "Idella", "Mitchell"),
    person("rose-lee-mitchell", "Rose Lee", "Mitchell"),

    // James (Fangalang) grandchildren
    person("nina-mitchell", "Nina", "Mitchell"),
    person("claudia-mitchell", "Claudia", "Mitchell"),
    person("vernice-mitchell", "Vernice", "Mitchell"),
    person("cathy-mitchell", "Cathy", "Mitchell"),

    ...slotDemo.people,
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

    // Philip Sr children (Roylo unlinked per booklet)
    ...[
      "beatrice-mitchell",
      "mattie-lee-mitchell",
      "rosco-mitchell",
      "phillip-mitchell",
      "mary-edith-mitchell",
      "carrie-mitchell",
      "robert-mitchell",
      "vera-mitchell",
    ].map((childId) => ({ parentId: "philip-mitchell", childId })),

    // Autmon Sr children
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

    // Mittie → Ida Ola Lee
    { parentId: "mittie-ann-mitchell", childId: "ida-ola-lee-humphrey" },

    // Ola Lee → Herdie, Eustis
    ...["herdie-eldred-baisden", "eustis-baisden"].map((childId) => ({
      parentId: "ida-ola-lee-humphrey",
      childId,
    })),

    // Herdie Eldred → five children
    ...[
      "herdie-eldred-lee-baisden",
      "carol-labonte",
      "carlton-baisden-sr",
      "brenda-elaine-baisden",
      "edward-bernard-baisden-sr",
    ].map((childId) => ({ parentId: "herdie-eldred-baisden", childId })),

    // James (Jim) Henry children
    ...[
      "james-jimbo-mitchell",
      "taylor-mitchell-sr",
      "governor-mitchell",
      "pasomore-feechie-mitchell",
      "tolby-mitchell",
      "mozella-mitchell",
      "mannie-c-mitchell",
      "fp-mitchell",
      "le-mitchell",
      "joseph-mitchell",
    ].map((childId) => ({ parentId: "james-mitchell", childId })),

    // Jimbo grandchildren
    ...[
      "damon-mitchell",
      "ella-mae-mitchell",
      "son-mitchell",
      "verta-lee-mitchell",
      "maude-mitchell",
      "lula-mae-mitchell",
      "lilly-mitchell",
      "reatha-mitchell",
      "mersener-mitchell",
      "cinderella-mitchell",
      "elbert-mitchell",
      "pearline-mitchell",
    ].map((childId) => ({ parentId: "james-jimbo-mitchell", childId })),

    // Taylor Sr grandchildren
    ...[
      "taylor-mitchell-jr",
      "ruth-mitchell",
      "eliza-mitchell",
      "andrew-mitchell",
      "bernard-mitchell",
      "gussie-mitchell",
    ].map((childId) => ({ parentId: "taylor-mitchell-sr", childId })),

    // Governor grandchildren
    ...[
      "sylvester-mitchell",
      "thelma-mitchell",
      "queen-esther-mitchell",
    ].map((childId) => ({ parentId: "governor-mitchell", childId })),

    // Pasomore grandchildren
    ...["frankie-mitchell", "sharon-mitchell"].map((childId) => ({
      parentId: "pasomore-feechie-mitchell",
      childId,
    })),

    // Toby grandchildren
    { parentId: "tolby-mitchell", childId: "buddy-mitchell" },

    // Mozella grandchildren
    ...["booker-t-mitchell", "rozella-mitchell"].map((childId) => ({
      parentId: "mozella-mitchell",
      childId,
    })),

    // Mannie C grandchildren
    ...[
      "earnest-mannie-mitchell",
      "queen-mannie-mitchell",
      "delores-mitchell",
      "eloise-mitchell",
      "elvina-babydoll-mitchell",
      "david-mannie-mitchell",
      "minnie-mitchell",
      "jeanette-mitchell",
    ].map((childId) => ({ parentId: "mannie-c-mitchell", childId })),

    // Vera (Suga) grandchildren
    ...[
      "earnest-jackson-ej",
      "dale-vera-mitchell",
      "james-vera-mitchell",
      "mary-francis-mitchell",
      "harry-vera-mitchell",
      "neaima-mitchell",
      "wadie-ruth-mitchell",
    ].map((childId) => ({ parentId: "vera-mitchell", childId })),

    // Rosco grandchildren
    ...["ellis-mitchell", "elton-mitchell"].map((childId) => ({
      parentId: "rosco-mitchell",
      childId,
    })),

    // Mary Edith grandchildren
    ...[
      "henry-jr-mitchell",
      "almeta-mitchell",
      "alzora-mitchell",
      "evelyn-mitchell",
      "patricia-mitchell",
      "sarah-mitchell",
    ].map((childId) => ({ parentId: "mary-edith-mitchell", childId })),

    // Phillip (Dugg) grandchildren
    ...[
      "junior-dugg-mitchell",
      "mary-lee-dugg-mitchell",
      "isaiah-mitchell",
      "earl-mitchell",
      "gaye-mitchell",
      "robert-dugg-mitchell",
      "tootsie-mitchell",
    ].map((childId) => ({ parentId: "phillip-mitchell", childId })),

    // Carrie grandchildren
    { parentId: "carrie-mitchell", childId: "moses-poochie-mitchell" },

    // Robert grandchildren
    ...[
      "robert-mitchell-jr",
      "laton-mitchell",
      "vonda-mitchell",
      "priscilla-mitchell",
    ].map((childId) => ({ parentId: "robert-mitchell", childId })),

    // Autmon Jr grandchildren
    ...["pat-autmon-mitchell", "bonita-mitchell", "wanda-mitchell"].map(
      (childId) => ({ parentId: "autmon-mitchell-jr", childId }),
    ),

    // Willie Frank Sr grandchildren
    ...[
      "willie-frank-mitchell-jr",
      "julia-mitchell",
      "vanessa-mitchell",
      "robert-lee-mitchell",
    ].map((childId) => ({ parentId: "willie-frank-mitchell-sr", childId })),

    // Kendrick grandchildren
    ...["albertha-mitchell", "james-kendrick-mitchell"].map((childId) => ({
      parentId: "kendrick-mitchell",
      childId,
    })),

    // Daniel grandchildren
    ...[
      "billy-daniel-mitchell",
      "laquitia-mitchell",
      "franklin-mitchell",
      "carolyn-mitchell",
      "rosetta-mitchell",
      "shelly-mitchell",
      "kirkland-mitchell",
      "daniel-mitchell-jr",
    ].map((childId) => ({ parentId: "daniel-mitchell", childId })),

    // Erosker grandchildren
    ...[
      "mae-lillie-williams",
      "quillan-davis-mitchell",
      "ossie-mae-howell",
      "aline-mitchell",
      "ervine-cole",
      "leon-mitchell-sr",
      "alphonso-mitchell",
      "margie-lee-mitchell-armstrong",
    ].map((childId) => ({ parentId: "erosker-mitchell", childId })),

    // Emma grandchildren
    ...[
      "lawrence-emma-mitchell",
      "idella-mitchell",
      "rose-lee-mitchell",
    ].map((childId) => ({ parentId: "emma-mitchell-payne", childId })),

    // James (Fangalang) grandchildren
    ...[
      "nina-mitchell",
      "claudia-mitchell",
      "vernice-mitchell",
      "cathy-mitchell",
    ].map((childId) => ({ parentId: "james-fangalang-mitchell", childId })),

    ...slotDemo.parentChildren,
  ],
  partnerships: [
    {
      id: "union-felix-adaline",
      personAId: "felix-mitchell",
      personBId: "adaline-kiah",
      startDate: "September 3, 1873",
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
  "roylo-mitchell",
  "morgan-zang-mitchell",
  "selphy-annie-mitchell",
  "ernest-mitchell",
  "ed-baisden",
] as const;
