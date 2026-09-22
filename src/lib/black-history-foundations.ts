import {
  block4ClaimChecks,
  block4RulerProfiles,
  block4SchoolGaps,
  block4Sections,
} from "@/lib/black-history-block4";
import {
  block5ClaimChecks,
  block5RulerProfiles,
  block5SchoolGaps,
  block5Sections,
} from "@/lib/black-history-block5";

export type Region =
  | "Global"
  | "Africa"
  | "Caribbean"
  | "Europe"
  | "Latin America"
  | "United States"
  | "Middle East"
  | "Asia";

export type SourceType =
  | "Museum"
  | "Archive"
  | "Database"
  | "Academic"
  | "Primary Sources"
  | "Open Access"
  | "Education"
  | "Research Tool";

export interface ResourceLink {
  label: string;
  url: string;
  type: SourceType;
}

export interface HistorySection {
  id: string;
  kicker: string;
  title: string;
  coverage: string;
  evidenceClass: "A" | "B" | "C" | "D" | "E";
  summary: string;
  commonlyTaught: string;
  missingContext: string;
  evidence: string[];
  whyItMatters: string;
  caution?: string;
  sources: ResourceLink[];
}

export interface ClaimCheck {
  claim: string;
  truth: string;
  uncertain: string;
  unsupported: string;
  whyItMatters: string;
}

export interface CurriculumGap {
  title: string;
  commonlyTaught: string;
  missingContext: string;
  evidence: string;
  whyItMatters: string;
}

export interface RulerProfile {
  name: string;
  period: string;
  region: string;
  politicalSystem: string;
  economicBase: string;
  religiousContext: string;
  governance: string;
  diplomacy: string;
  militaryRole: string;
  achievements: string;
  conflicts: string;
  limitations: string;
  legacy: string;
  sources: ResourceLink[];
}

export interface ChapterSourceGroup {
  title: string;
  support: string;
  links: ResourceLink[];
}

export interface ChapterData {
  slug: string;
  eyebrow: string;
  title: string;
  summary: string;
  intro: string;
  sections: HistorySection[];
  rulers?: RulerProfile[];
  claimChecks?: ClaimCheck[];
  schoolGaps?: CurriculumGap[];
  sourceGroups: ChapterSourceGroup[];
}

export interface ChapterCard {
  slug: string;
  eyebrow: string;
  title: string;
  summary: string;
}

export const block2Sections: HistorySection[] = [
  {
    id: "origins",
    kicker: "BLOCK 2A",
    title: "Humanity's African Beginning",
    coverage: "Current coverage: Partial, now expanded",
    evidenceClass: "B",
    summary:
      "The strongest current scientific consensus places the emergence of Homo sapiens in Africa about 300,000 years ago. That matters because it resets the frame: Africa is not a late chapter in world history, but the central ground of human beginnings.",
    commonlyTaught:
      "Many people were taught Black history as though it begins with captivity, colonization, or civil-rights struggle.",
    missingContext:
      "Human history begins in Africa. Any serious Black historical library has to start before forced dispersal, before empire, and before modern racial hierarchy.",
    evidence: [
      "The Smithsonian Human Origins Program states that Homo sapiens evolved in Africa about 300,000 years ago.",
      "Smithsonian genetics and fossil framing also place the deepest roots of living humans and earlier human species in Africa.",
      "UNESCO's General History of Africa treats African prehistory as foundational, not peripheral, and includes prehistory, art, agriculture, and metallurgy in Volume I.",
    ],
    whyItMatters:
      "When history starts in captivity, identity starts in damage. When history starts in Africa, identity starts in origin, adaptation, creativity, and civilization-building.",
    caution:
      "This does not authorize simplistic racial storytelling about every prehistoric population. The evidence establishes Africa's centrality to human origins, not one modern political identity projected backward without care.",
    sources: [
      {
        label: "Smithsonian Human Origins - Homo sapiens",
        url: "https://humanorigins.si.edu/evidence/human-fossils/species/homo-sapiens",
        type: "Museum",
      },
      {
        label: "Smithsonian Human Origins - One Species, Living Worldwide",
        url: "https://humanorigins.si.edu/evidence/genetics/one-species-living-worldwide",
        type: "Research Tool",
      },
      {
        label: "UNESCO - General History of Africa",
        url: "https://www.unesco.org/en/general-history-africa",
        type: "Open Access",
      },
    ],
  },
  {
    id: "before-captivity",
    kicker: "BLOCK 2B",
    title: "Africa Before Captivity",
    coverage: "Current coverage: Partial, now expanded",
    evidenceClass: "B",
    summary:
      "Africa before Atlantic captivity was not a blank space waiting for Europe. It held multiple civilizations, trade systems, urban centers, sacred worlds, and political traditions that developed across very different regions and time periods.",
    commonlyTaught:
      "Too many public histories collapse pre-captivity Africa into vague tribal imagery, a few monuments, or a fast jump into the slave trade.",
    missingContext:
      "Long before Atlantic slavery became the frame through which many people encounter Africa, the continent contained regional systems of agriculture, metallurgy, governance, trade, scholarship, and city-building. The real story is not one empire or one identity, but a large field of connected and distinct histories.",
    evidence: [
      "UNESCO's General History of Africa Volume II covers nearly nine thousand years of African history across the Nile corridor, Egypt and Nubia, the Ethiopian highlands, the Maghrib, the Sahara, and other regions.",
      "UNESCO's Volume IV describes the twelfth through sixteenth centuries as a period of expanding trade, cultural exchange, political development, and more common written records across major parts of Africa.",
      "The Met's work on trans-Saharan gold trade shows structured economic exchange linking Mediterranean and sub-Saharan economies, while its Guinea Coast essays show distinct African polities rather than one undifferentiated society.",
    ],
    whyItMatters:
      "When Africa before captivity is erased, Black identity is easier to detach from statecraft, commerce, scholarship, and inherited civilizational memory. Restoring that record changes what people think is normal, possible, and worth rebuilding.",
    caution:
      "Africa before captivity should not be turned into a single golden-age slogan. Different regions moved on different timelines, and the public library should keep distinctions between regions, periods, and evidence types clear.",
    sources: [
      {
        label: "UNESCO - General History of Africa",
        url: "https://www.unesco.org/en/general-history-africa",
        type: "Open Access",
      },
      {
        label: "UNESCO - General History of Africa Volume IV",
        url: "https://unesdoc.unesco.org/ark:/48223/pf0000184287",
        type: "Open Access",
      },
      {
        label: "Met - The Trans-Saharan Gold Trade",
        url: "https://www.metmuseum.org/essays/the-trans-saharan-gold-trade-7th-14th-century",
        type: "Academic",
      },
      {
        label: "Met - Origins and Empire: Benin, Owo, and Ijebu",
        url: "https://www.metmuseum.org/essays/origins-and-empire-the-benin-owo-and-ijebu-kingdoms",
        type: "Academic",
      },
    ],
  },
  {
    id: "sacred-worlds",
    kicker: "BLOCK 2C",
    title: "African Sacred Worlds",
    coverage: "Current coverage: Partial, now expanded",
    evidenceClass: "C",
    summary:
      "African sacred worlds were never one interchangeable system. They include distinct cosmologies, moral languages, ritual institutions, and ways of understanding creation, character, community, and obligation.",
    commonlyTaught:
      "School often treated African religions as folklore, superstition, or a hazy backdrop before Christianity or Islam arrived.",
    missingContext:
      "Across the continent, sacred life helped order time, kinship, responsibility, political legitimacy, healing, environment, and social memory. These traditions were knowledge systems, not empty myths.",
    evidence: [
      "UNESCO's historical method explicitly combines written archives with oral traditions, archaeology, and scientific findings rather than excluding African knowledge traditions from history.",
      "The Smithsonian's African Cosmos exhibition frames African cosmologies as deep intellectual and artistic traditions tied to sky, environment, and daily life.",
      "This library will distinguish established fact from theology, oral memory, and scholarly interpretation instead of flattening them into one category.",
    ],
    whyItMatters:
      "If a people are taught that their sacred inheritance was primitive, it becomes easier to sever them from memory, authority, and continuity. Recovering sacred worlds helps restore intellectual dignity.",
    caution:
      "Public sections should label tradition and theology honestly. Not every sacred claim is archaeology, but neither should sacred systems be dismissed because they are not written in European categories.",
    sources: [
      {
        label: "UNESCO - General History of Africa",
        url: "https://www.unesco.org/en/general-history-africa",
        type: "Open Access",
      },
      {
        label: "UNESCO - 2025 General History of Africa release",
        url: "https://www.unesco.org/en/articles/unesco-releases-three-new-volumes-its-general-history-africa",
        type: "Open Access",
      },
      {
        label: "Smithsonian - African Cosmos: Stellar Arts",
        url: "https://africa.si.edu/exhibitions/african-cosmos-stellar-arts",
        type: "Museum",
      },
    ],
  },
  {
    id: "yoruba",
    kicker: "BLOCK 2D",
    title: "Yoruba Worldview",
    coverage: "Current coverage: Partial, now expanded",
    evidenceClass: "B",
    summary:
      "The Yoruba world deserves treatment as a serious intellectual, spiritual, artistic, and civic tradition. It should not appear on this library only as a side-note to diaspora religion or museum aesthetics.",
    commonlyTaught:
      "Many readers only encounter Yoruba traditions indirectly through diaspora religions, internet simplifications, or scattered references to deities without context.",
    missingContext:
      "Museum and scholarly sources describe Ifa as a Yoruba way of life involving spiritual belief, ethics, and moral behavior. They also document divination, urban life, sacred geography, and the historical importance of Ile-Ife.",
    evidence: [
      "The British Museum describes Ifa as a traditional Yoruba way of life that incorporates spiritual belief, ethics, and moral behavior.",
      "Smithsonian collection records note that babalawo used Ifa divination to consult Orunmila, identifying a formal knowledge practice rather than vague mysticism.",
      "Met and Smithsonian materials treat Ile-Ife as a major center of Yoruba history, art, and sacred memory, which helps connect worldview to city-building, trade, and political culture.",
    ],
    whyItMatters:
      "If the library is going to discuss Black identity, diaspora religion, or African continuity with seriousness, Yoruba thought has to be handled with respect, accuracy, and enough room to breathe.",
    caution:
      "Origin traditions about Oduduwa and Ile-Ife should be labeled as tradition or theology where appropriate, while archaeological and art-historical claims should be grounded separately.",
    sources: [
      {
        label: "British Museum - Creation narratives and feminine power",
        url: "https://www.britishmuseum.org/blog/creation-narratives-and-feminine-power",
        type: "Museum",
      },
      {
        label: "Smithsonian NMAfA - Divination cup",
        url: "https://africa.si.edu/collection/object/nmafa_92-10-1",
        type: "Museum",
      },
      {
        label: "Met - Ife (from ca. 6th Century)",
        url: "https://www.metmuseum.org/essays/ife-from-ca-6th-century",
        type: "Academic",
      },
      {
        label: "Smithsonian - Featured Artwork on Ifa divination",
        url: "https://africa.si.edu/collection/selected-artwork/2196",
        type: "Museum",
      },
    ],
  },
];

export const block3Sections: HistorySection[] = [
  {
    id: "nile-valley",
    kicker: "BLOCK 3A",
    title: "Egypt, Kemet, and the Nile Valley Chronology",
    coverage: "Current coverage: Newly expanded",
    evidenceClass: "B",
    summary:
      "Ancient Egypt developed in northeastern Africa within the Nile Valley. Its history spans predynastic communities, the early dynasties, the Old, Middle, and New Kingdoms, and later periods shaped by both continuity and outside rule.",
    commonlyTaught:
      "School often reduces Egypt to pyramids, mummies, and a few pharaohs detached from the wider African setting that helped shape the civilization.",
    missingContext:
      "The Nile Valley was an ecological corridor where flood cycles, agriculture, transport, papyrus, and river-based administration helped sustain one of the world's longest-lasting states. Egypt changed over millennia; it was never one frozen culture outside of time.",
    evidence: [
      "UNESCO's General History of Africa Volume II situates Egypt, Nubia, the Sahara, and neighboring regions within a long shared African historical field rather than isolating Egypt as a separate civilizational planet.",
      "Met scholarship organizes Egypt through predynastic and dynastic development, then the Old, Middle, New, and later periods, showing major political and cultural shifts across more than three thousand years.",
      "Papyrus, flood agriculture, and river transport were not side details: Met and UCL materials show how the Nile environment shaped administration, writing, storage, labor, and communication.",
    ],
    whyItMatters:
      "Readers need the Nile Valley first, not just monuments. Once Egypt is placed back into African geography and long chronology, it becomes easier to understand both its distinctiveness and its connections.",
    caution:
      "Public language should not imply that every period of Egyptian history looked the same or that one later dynasty automatically represents the entire civilization.",
    sources: [
      {
        label: "UNESCO - General History of Africa",
        url: "https://www.unesco.org/en/general-history-africa",
        type: "Open Access",
      },
      {
        label: "Met - Egypt in the Old Kingdom",
        url: "https://www.metmuseum.org/essays/egypt-in-the-old-kingdom",
        type: "Museum",
      },
      {
        label: "Met - Egypt in the Middle Kingdom",
        url: "https://www.metmuseum.org/essays/egypt-in-the-middle-kingdom",
        type: "Museum",
      },
      {
        label: "Met - Egypt in the New Kingdom",
        url: "https://www.metmuseum.org/essays/egypt-in-the-new-kingdom",
        type: "Museum",
      },
      {
        label: "Met - Egypt in the Late Period",
        url: "https://www.metmuseum.org/essays/egypt-in-the-late-period-ca-712-332-b-c",
        type: "Museum",
      },
      {
        label: "Met - Papyrus in Ancient Egypt",
        url: "https://www.metmuseum.org/essays/papyrus-in-ancient-egypt",
        type: "Museum",
      },
    ],
  },
  {
    id: "kemet-maat-writing",
    kicker: "BLOCK 3B",
    title: "Kemet, Ma'at, Kingship, and the Scribal State",
    coverage: "Current coverage: Newly expanded",
    evidenceClass: "B",
    summary:
      "The Egyptian term often transliterated as kmt or Kemet is widely connected in Egyptology to the fertile 'black land' of the Nile zone, especially when contrasted with desert terminology. That linguistic discussion belongs alongside Ma'at, kingship, writing, and scribal culture because Egypt's self-understanding was ecological, political, and moral at once.",
    commonlyTaught:
      "Many readers hear Kemet used as a slogan online, but are rarely shown the textual or linguistic evidence, the desert contrast, or how moral order and state order were tied together in Egyptian thought.",
    missingContext:
      "Ma'at was not a bumper-sticker word for 'truth' alone. It referred to right order, justice, balance, and cosmic-social stability. Kingship was judged partly by how well it preserved that order, while scribes and institutions translated it into records, ritual, taxation, legal practice, and memory.",
    evidence: [
      "UCL's translations and language materials preserve Egyptian usage that contrasts the fertile black land with the red land of the desert, which is why many specialists gloss kmt as 'Black Land' rather than turning it into a modern racial label.",
      "The Met states that the king's preeminent task was preserving maat, including peace, political stability, justice, religious duties, and the economic needs of the people.",
      "Met and UCL sources show that hieroglyphs, hieratic, and later demotic supported a scribal culture in which only a minority of the population was literate, but that minority played an outsized role in state continuity, ritual memory, and administration.",
    ],
    whyItMatters:
      "This is where language, ecology, ethics, and government meet. It helps readers see Egypt as a civilizational system rather than a pile of artifacts and social-media slogans.",
    caution:
      "Kemet should not be presented as an uncontested proof of a modern racial identity. The linguistic evidence is stronger for land and ecology terminology than for modern political reinterpretations.",
    sources: [
      {
        label: "UCL - Hymn to Senusret III",
        url: "https://www.ucl.ac.uk/museums-static/digitalegypt/literature/senusret3hymn.html",
        type: "Primary Sources",
      },
      {
        label: "Met - Kings and Queens of Egypt",
        url: "https://www.metmuseum.org/essays/kings-and-queens-of-egypt",
        type: "Museum",
      },
      {
        label: "Met - Papyrus in Ancient Egypt",
        url: "https://www.metmuseum.org/essays/papyrus-in-ancient-egypt",
        type: "Museum",
      },
      {
        label: "UCL - Hieratic",
        url: "https://www.ucl.ac.uk/museums-static/digitalegypt/writing/hieratic.html",
        type: "Education",
      },
      {
        label: "UCL - Literacy",
        url: "https://www.ucl.ac.uk/museums-static/digitalegypt/education/literacy.html",
        type: "Education",
      },
    ],
  },
  {
    id: "women-power",
    kicker: "BLOCK 3C",
    title: "Women, Property, and Political Power in Egypt",
    coverage: "Current coverage: Newly expanded",
    evidenceClass: "B",
    summary:
      "Women in ancient Egypt did not hold equal power to men across every domain, but the evidence does show significant legal and economic rights, along with important cases of royal and political authority.",
    commonlyTaught:
      "Public retellings tend to swing between two distortions: either Egyptian women had no meaningful rights, or Egypt is treated as though every woman enjoyed full modern equality.",
    missingContext:
      "The better historical picture is differentiated. Women could own, inherit, sell, and bequeath property in important periods, yet the society remained patriarchal and elite women had access to forms of power that ordinary women did not.",
    evidence: [
      "The Met's Hatnefer essay states that women could inherit, buy, and sell property in their own right, keep property brought into marriage, make wills, and bring grievances before judges.",
      "Met materials on Hatshepsut show a female ruler who did not simply remain queen-consort, but declared herself king and used the full titulary and monument language of pharaonic rule.",
      "Royal women such as Ahhotep, Tiye, Nefertiti, Nefertari, and later Cleopatra VII should be taught in context rather than blended into one undifferentiated 'queen' category across very different political eras.",
    ],
    whyItMatters:
      "Gender history here reveals how law, household economy, religion, dynasty, and representation worked together. It also guards against using a few famous queens to flatten the lived variation inside Egyptian society.",
    caution:
      "Cleopatra VII belongs to the later Ptolemaic period and should not be used as a shortcut for earlier dynastic Egyptian womanhood.",
    sources: [
      {
        label: "Met - The Housemistress in New Kingdom Egypt: Hatnefer",
        url: "https://www.metmuseum.org/essays/the-housemistress-in-new-kingdom-egypt-hatnefer",
        type: "Museum",
      },
      {
        label: "Met - Seated Statue of Hatshepsut",
        url: "https://www.metmuseum.org/art/collection/search/544450",
        type: "Museum",
      },
      {
        label: "Met - Challenging Power through Gender Representation",
        url: "https://www.metmuseum.org/perspectives/hatshepsut-gender-representation",
        type: "Museum",
      },
    ],
  },
  {
    id: "nubia-kush",
    kicker: "BLOCK 3D",
    title: "Nubia and Kush Were Civilizations in Their Own Right",
    coverage: "Current coverage: Newly expanded",
    evidenceClass: "B",
    summary:
      "Nubia should not appear only when Egypt moved south. The Nile Valley south of Egypt produced its own political centers, burial traditions, trade systems, and eventually the Kingdom of Kush, with major phases at Kerma, Napata, and Meroe.",
    commonlyTaught:
      "School often treats Nubia as either an Egyptian frontier or a brief backdrop for the 25th Dynasty, leaving the impression that its history mattered only when it intersected with Egypt.",
    missingContext:
      "The evidence shows a much deeper story: long-distance exchange, state formation, royal ideology, urban development, and regional continuity south of Egypt. Kerma, Napata, and Meroe deserve independent treatment, not just sidebars.",
    evidence: [
      "The Met's Land of Nubia essay describes a river system structured by cataracts, long-term trade and warfare, Middle Kingdom fortresses, New Kingdom domination, and later Kushite expansion north into Egypt.",
      "Penn Museum scholarship describes Kerma as the earliest known civilization in Africa outside Egypt and emphasizes local state formation in Upper Nubia rather than a derivative copy of Egypt.",
      "UCL's Meroitic materials show that the kingdom remained historically vital after Egyptian rule ended, with its own artistic developments, script traditions, and political life.",
    ],
    whyItMatters:
      "Once Nubia and Kush are restored as full civilizations, the Nile Valley story stops being a one-state story and becomes a history of exchange, conflict, imitation, adaptation, and parallel power.",
    caution:
      "Public writing should not imply Nubian history began with Kush or that every Nubian polity was identical. Terms such as A-Group and C-Group belong to archaeological classification, not living self-descriptions.",
    sources: [
      {
        label: "Met - The Land of Nubia",
        url: "https://www.metmuseum.org/essays/nubia",
        type: "Museum",
      },
      {
        label: "Penn Museum - Rise of Civilization in Upper Nubia",
        url: "https://www.penn.museum/sites/expedition/rise-of-civilization-in-upper-nubia/",
        type: "Museum",
      },
      {
        label: "UCL - The Meroitic Period",
        url: "https://www.ucl.ac.uk/museums-static/digitalegypt/nubia/meroitic.html",
        type: "Education",
      },
    ],
  },
  {
    id: "kushite-power",
    kicker: "BLOCK 3E",
    title: "Kushite Rule, Taharqa, the Kandakes, and Meroitic Writing",
    coverage: "Current coverage: Newly expanded",
    evidenceClass: "B",
    summary:
      "Kushite history did not begin or end with rule over Egypt. The 25th Dynasty, Taharqa's conflicts with Assyria, Kandake authority, Amanirenas's confrontation with Rome, and Meroitic writing all show a civilization with durable institutions south of Egypt.",
    commonlyTaught:
      "The 25th Dynasty is often treated like a brief anomaly, and Kandakes or Meroitic literacy are usually absent from standard school narratives.",
    missingContext:
      "Piye, Shabaka, Shebitku, Taharqa, and Tanutamani ruled Egypt as Kushite pharaohs while still rooted in Nubian kingship. After Assyrian pressure ended Kushite control of Egypt, the kingdom remained powerful farther south. Later Meroitic rulers, including Kandakes such as Amanirenas and Amanishakheto, continued that history in their own political world.",
    evidence: [
      "The Met's Third Intermediate Period essay states that Piye invaded from Kush, began the 25th Dynasty, and that Kushite rulers governed as Egyptian pharaohs while highlighting their Nubian heritage before Assyrian invasions forced retreat south.",
      "The Met's Nubia essay and scholarship on Sudanese rulers identify Napatan and Meroitic royal lines, including Kandakes and the continuation of Kush after control of Egypt ended.",
      "UCL's Meroitic materials show that the script was used from roughly the second century BCE, that names and some forms are understood, and that longer texts remain only partly understood.",
    ],
    whyItMatters:
      "This is one of the clearest places where readers can see African political power shaping Egypt, confronting Assyria, negotiating with Rome, and leaving its own still-partly unread written record.",
    caution:
      "Older claims that Meroe should simply be called 'Africa's Birmingham' overstate the current evidence. Iron production was important, but public writing should avoid industrial analogies that outrun the scholarship.",
    sources: [
      {
        label: "Met - Egypt in the Third Intermediate Period",
        url: "https://www.metmuseum.org/essays/egypt-in-the-third-intermediate-period-ca-1070-664-b-c",
        type: "Museum",
      },
      {
        label: "Met - The Land of Nubia",
        url: "https://www.metmuseum.org/essays/nubia",
        type: "Museum",
      },
      {
        label: "Met - List of Rulers of Ancient Sudan",
        url: "https://www.metmuseum.org/toah/hd/ksud/hd_ksud.htm",
        type: "Museum",
      },
      {
        label: "UCL - The Meroitic Period",
        url: "https://www.ucl.ac.uk/museums-static/digitalegypt/nubia/meroitic.html",
        type: "Education",
      },
      {
        label:
          "Journal of Ancient Egyptian Interconnections - Roman Egyptian-Nubian frontier",
        url: "https://journals.uair.arizona.edu/index.php/jaei/article/view/21489",
        type: "Academic",
      },
    ],
  },
];

export const block3ClaimChecks: ClaimCheck[] = [
  {
    claim: "Ancient Egyptians were white.",
    truth:
      "Egypt was an African Nile Valley civilization whose population history reflected northeastern African location, long chronology, and outside connections.",
    uncertain:
      "Ancient DNA, skeletal studies, art, and texts can illuminate populations, but available samples remain uneven by period, region, status, and preservation.",
    unsupported:
      "Sweeping claims that all ancient Egyptians fit a modern white category are not supported by the total evidence.",
    whyItMatters:
      "This claim often strips Egypt from African history by projecting later racial politics backward as though they were objective ancient categories.",
  },
  {
    claim: "Ancient Egyptians were Black.",
    truth:
      "Egypt belonged to Africa and had deep relationships with Nubia, Kush, Libya, the Red Sea world, the Levant, and the wider Nile corridor. Many modern Black readers understandably claim Egypt as part of African history for that reason.",
    uncertain:
      "The category 'Black' can describe cultural-political solidarity today, but it does not map neatly onto every individual, region, or dynasty across more than three thousand years of ancient history.",
    unsupported:
      "No responsible evidence standard supports using one slogan to fix every Egyptian across all periods into a single modern U.S. racial box.",
    whyItMatters:
      "A stronger public history can affirm Africa's place in Egyptian history without flattening the complexity of ancient populations.",
  },
  {
    claim:
      "Race worked the same way in antiquity as it does in modern America.",
    truth:
      "Ancient societies marked difference through language, place, kinship, political allegiance, class, religion, and appearance, but not through a carbon-copy version of modern American race categories.",
    uncertain:
      "Scholars still debate how best to compare ancient identity systems with modern racial frameworks.",
    unsupported:
      "Treating today's racial boxes as timeless natural facts is historically inaccurate.",
    whyItMatters:
      "Readers need a better method than slogan warfare: keep Africa central, keep the evidence visible, and admit where modern categories do not travel cleanly.",
  },
];

export const block3SchoolGaps: CurriculumGap[] = [
  {
    title: "Nubia and Kush as full civilizations",
    commonlyTaught:
      "Nubia appears briefly, usually as Egypt's southern neighbor or a note about gold and trade.",
    missingContext:
      "Kerma, Napata, and Meroe had their own political systems, royal traditions, urban centers, and historical trajectories.",
    evidence:
      "Met, Penn, and UCL materials all treat Nubia and Kush as independent historical subjects with their own chronology and institutions.",
    whyItMatters:
      "Without this, the Nile Valley becomes falsely one-sided and Africa south of Egypt disappears from the story.",
  },
  {
    title: "Kushite rule over Egypt",
    commonlyTaught:
      "The 25th Dynasty is rarely emphasized or is presented as a short interruption in Egyptian history.",
    missingContext:
      "Piye, Shabaka, Shebitku, Taharqa, and Tanutamani ruled Egypt as Kushite pharaohs and mattered in Mediterranean and Near Eastern politics.",
    evidence:
      "Met scholarship directly links Kushite expansion from Napata to Egyptian kingship and later Assyrian conflict.",
    whyItMatters:
      "It reverses the usual direction of the story by showing power moving north from Kush into Egypt.",
  },
  {
    title: "The Kandakes and Amanirenas",
    commonlyTaught:
      "Roman history gets taught, but Kushite queens and their diplomacy or warfare against Rome usually do not.",
    missingContext:
      "Kandake was a title, not a single personal name, and Amanirenas's conflict with Rome shows sustained Kushite political agency.",
    evidence:
      "Met, UCL, and specialist scholarship all point to the political significance of Kandake authority and the Roman frontier in Nubia.",
    whyItMatters:
      "This expands who counts as a major historical actor in classical-era narratives.",
  },
  {
    title: "Meroitic writing and what remains unknown",
    commonlyTaught:
      "Students may never hear that Kush had its own script traditions after Egypt, or they hear only overconfident online claims.",
    missingContext:
      "Meroitic script can be read phonetically in many cases, but the language is not fully understood and longer texts remain partly opaque.",
    evidence:
      "UCL's Meroitic materials stress both the importance of the script and the limits of current decipherment.",
    whyItMatters:
      "It teaches intellectual honesty: knowing the past sometimes means clearly naming what we still do not know.",
  },
];

export const chapterCards: ChapterCard[] = [
  {
    slug: "origins",
    eyebrow: "Before Captivity",
    title: "Origins, Sacred Worlds, and Yoruba Foundations",
    summary:
      "Start where Black history should start: Africa before captivity, human origins, sacred worlds, and Yoruba intellectual life.",
  },
  {
    slug: "nile-valley",
    eyebrow: "Ancient Africa",
    title: "Egypt, Nubia, Kush, and the Nile Valley",
    summary:
      "A chapter on chronology, Ma'at, scribal culture, women, Nubia, Kush, Taharqa, the Kandakes, and Meroitic writing.",
  },
  {
    slug: "government-knowledge",
    eyebrow: "Kingdoms & Knowledge",
    title: "Government, Writing, Education, and Science",
    summary:
      "Political institutions, women in power, writing systems, oral knowledge, medicine, metallurgy, Benin, Igbo-Ukwu, and Great Zimbabwe.",
  },
  {
    slug: "west-africa",
    eyebrow: "West African Civilizations",
    title: "Ghana, Mali, Songhai, and Timbuktu",
    summary:
      "Ghana or Wagadu, Mali, Sundiata, Mansa Musa, Timbuktu, manuscripts, Songhai, trade, cities, and source caution.",
  },
];

export const chapterLookup: Record<string, ChapterData> = {
  origins: {
    slug: "origins",
    eyebrow: "Before Captivity",
    title: "Origins, Sacred Worlds, and Yoruba Foundations",
    summary:
      "Africa is the beginning of the story, not a preface. This chapter restores origins, sacred worlds, and intellectual traditions too often skipped before the history reaches captivity.",
    intro:
      "This chapter begins before captivity and before reduction. It keeps Africa central to human origins, treats sacred systems as knowledge traditions, and shows Yoruba thought as part of a serious civic and intellectual world rather than a footnote.",
    sections: block2Sections,
    sourceGroups: [
      {
        title: "Human origins and African prehistory",
        support:
          "Supports the opening argument that human history begins in Africa and that African prehistory belongs at the foundation of Black history.",
        links: block2Sections[0].sources,
      },
      {
        title: "Africa before captivity",
        support:
          "Supports the wider civilizational frame of pre-captivity Africa, including trade, governance, and long chronology.",
        links: block2Sections[1].sources,
      },
      {
        title: "Sacred worlds and Yoruba foundations",
        support:
          "Supports treatment of African sacred systems and Yoruba intellectual life without reducing them to folklore.",
        links: [...block2Sections[2].sources, ...block2Sections[3].sources],
      },
    ],
  },
  "nile-valley": {
    slug: "nile-valley",
    eyebrow: "Ancient Africa",
    title: "Egypt, Nubia, Kush, and the Nile Valley",
    summary:
      "A long-view chapter on chronology, ecology, Ma'at, women, Nubia, Kush, Taharqa, the Kandakes, and Meroitic writing.",
    intro:
      "The Nile Valley chapter restores Egypt to Africa, keeps Nubia and Kush visible in their own right, and resists both slogan-level identity claims and evidence-free detachment.",
    sections: block3Sections,
    claimChecks: block3ClaimChecks,
    schoolGaps: block3SchoolGaps,
    sourceGroups: [
      {
        title: "Chronology, geography, and scribal culture",
        support:
          "Supports the Nile Valley chronology, Ma'at, papyrus, literacy, and the ecological frame of Egyptian statecraft.",
        links: [...block3Sections[0].sources, ...block3Sections[1].sources],
      },
      {
        title: "Women, Nubia, and Kush",
        support:
          "Supports women’s legal rights, Nubian state history, and the Kushite political world south of Egypt.",
        links: [...block3Sections[2].sources, ...block3Sections[3].sources],
      },
      {
        title: "Kushite power and Meroitic writing",
        support:
          "Supports Taharqa, Kandake authority, and the limits of what is currently known about Meroitic texts.",
        links: block3Sections[4].sources,
      },
    ],
  },
  "government-knowledge": {
    slug: "government-knowledge",
    eyebrow: "Kingdoms & Knowledge",
    title: "Government, Writing, Education, and Science",
    summary:
      "A comparative chapter on African institutions, rulers, writing systems, oral knowledge, technical practice, and public evidence limits.",
    intro:
      "This chapter corrects the false impression that precolonial Africa lacked government, education, law, or technical knowledge. It does that by showing diversity rather than replacing one myth with another.",
    sections: block4Sections,
    rulers: block4RulerProfiles,
    claimChecks: block4ClaimChecks,
    schoolGaps: block4SchoolGaps,
    sourceGroups: [
      {
        title: "Government, law, and women in power",
        support:
          "Supports the institutional diversity of African political systems and the role of women in offices such as queen mothers and royal authority.",
        links: [
          ...block4Sections[0].sources,
          ...block4Sections[1].sources,
          ...block4Sections[2].sources,
        ],
      },
      {
        title: "Writing, oral knowledge, and education",
        support:
          "Supports scripts, manuscript cultures, oral methods, and teacher-student knowledge systems across different African societies.",
        links: [...block4Sections[3].sources, ...block4Sections[4].sources],
      },
      {
        title: "Science, Benin, Igbo-Ukwu, and Great Zimbabwe",
        support:
          "Supports technical knowledge, statecraft, metallurgy, architecture, and the need for caution around exaggerated claims.",
        links: [...block4Sections[5].sources, ...block4Sections[6].sources],
      },
    ],
  },
  "west-africa": {
    slug: "west-africa",
    eyebrow: "West African Civilizations",
    title: "Ghana, Mali, Songhai, and Timbuktu",
    summary:
      "A chapter on Ghana or Wagadu, Mali, Sundiata, Mansa Musa, Timbuktu, manuscripts, Songhai, cities, trade, and source discipline.",
    intro:
      "West African history is bigger than one pilgrimage and one viral wealth claim. This chapter keeps Ghana or Wagadu, Mali, Timbuktu, Songhai, cities, book trade, gold, salt, and legal scholarship inside one connected Sahelian world.",
    sections: block5Sections,
    rulers: block5RulerProfiles,
    claimChecks: block5ClaimChecks,
    schoolGaps: block5SchoolGaps,
    sourceGroups: [
      {
        title: "Ghana, Mali, and source criticism",
        support:
          "Supports Ghana or Wagadu, Mali’s formation, and the method for reading al-Bakri, Ibn Battuta, al-Umari, and later chronicles carefully.",
        links: [
          ...block5Sections[0].sources,
          ...block5Sections[1].sources,
          ...block5Sections[2].sources,
        ],
      },
      {
        title: "Mansa Musa, gold, and pilgrimage",
        support:
          "Supports Musa’s reign, the limits of fixed dollar wealth claims, and the relationship between state resources and trans-Saharan trade.",
        links: block5Sections[3].sources,
      },
      {
        title: "Timbuktu, manuscripts, Songhai, and cities",
        support:
          "Supports scholarship, book culture, Songhai government, Gao, Djenné, and the relationship between commerce and learning.",
        links: [...block5Sections[4].sources, ...block5Sections[5].sources],
      },
    ],
  },
};
