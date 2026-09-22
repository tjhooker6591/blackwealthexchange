export interface Block4ResourceLink {
  label: string;
  url: string;
  type:
    | "Museum"
    | "Archive"
    | "Database"
    | "Academic"
    | "Primary Sources"
    | "Open Access"
    | "Education"
    | "Research Tool";
}

export interface Block4HistorySection {
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
  sources: Block4ResourceLink[];
}

export interface Block4ClaimCheck {
  claim: string;
  truth: string;
  uncertain: string;
  unsupported: string;
  whyItMatters: string;
}

export interface Block4CurriculumGap {
  title: string;
  commonlyTaught: string;
  missingContext: string;
  evidence: string;
  whyItMatters: string;
}

export interface Block4RulerProfile {
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
  sources: Block4ResourceLink[];
}

export const block4Sections: Block4HistorySection[] = [
  {
    id: "government-diversity",
    kicker: "BLOCK 4A",
    title: "African Political Systems Were Diverse, Not Absent",
    coverage: "Current coverage: Newly expanded",
    evidenceClass: "B",
    summary:
      "Precolonial Africa included kingdoms, empires, city-states, confederations, federated polities, and decentralized systems built through lineage, councils, market institutions, military structures, and religious authority.",
    commonlyTaught:
      "School often implies that Africa had either tribal disorder or a few isolated kings, as though centralized monarchy were the only recognizable form of serious government.",
    missingContext:
      "Complex rule existed with and without kings. Some societies concentrated power in royal courts; others distributed authority through elders, titled associations, age grades, village assemblies, queen-mother institutions, merchant networks, or religious specialists. The continent did not share one constitutional template.",
    evidence: [
      "UNESCO's General History of Africa presents the twelfth through sixteenth centuries as a period of political development, expanding trade, and more common written records rather than a continent without institutions.",
      "Met scholarship on recording African history states that, in centralized states and chiefdoms, historians could act as religious or political advisers who supported or checked royal power, showing structured constitutional cultures rather than pure personal rule.",
      "Met's broader Arts of Africa interpretation and scholarship on the Guinea Coast point to city-states, kingdoms, civic associations, and regional networks that cannot be reduced to one model of kingship.",
    ],
    whyItMatters:
      "If government is recognized only when it resembles Europe, then African institutions disappear by definition. Restoring these systems changes how readers think about law, leadership, legitimacy, and continuity.",
    caution:
      "This section should not treat every society as equally centralized or equally participatory. Some were expansive states; others were local assemblies; many included hierarchy, slavery, conquest, or exclusion.",
    sources: [
      {
        label: "UNESCO - General History of Africa",
        url: "https://www.unesco.org/en/general-history-africa",
        type: "Open Access",
      },
      {
        label: "Met - Ways of Recording African History",
        url: "https://www.metmuseum.org/essays/ways-of-recording-african-history",
        type: "Museum",
      },
      {
        label: "Met - Origins and Empire: The Benin, Owo, and Ijebu Kingdoms",
        url: "https://www.metmuseum.org/essays/origins-and-empire-the-benin-owo-and-ijebu-kingdoms",
        type: "Academic",
      },
    ],
  },
  {
    id: "institutions-law",
    kicker: "BLOCK 4B",
    title:
      "Government Functions Included Law, Succession, Markets, and Local Administration",
    coverage: "Current coverage: Newly expanded",
    evidenceClass: "B",
    summary:
      "African governments managed succession, land, tribute, ritual authority, diplomacy, adjudication, and exchange, but they did so through locally specific institutions rather than modern U.S. categories.",
    commonlyTaught:
      "Public narratives often talk about 'chiefs' or 'tribes' without explaining how disputes were settled, how rulers inherited authority, how markets worked, or how local obligations were enforced.",
    missingContext:
      "Benin linked dynastic succession to ancestor veneration and court ritual. Egyptian kingship tied rule to Ma'at and scribal administration. Timbuktu manuscripts show legal, commercial, and inheritance scholarship. Some societies relied on councils and mediation more than on a standing royal court. Governance was practical as well as symbolic.",
    evidence: [
      "Met materials on Benin explain that the title of oba passed to the firstborn son at the ruler's death and that ancestral shrines materially linked succession, legitimacy, and governance.",
      "Met work on Egypt describes Ma'at as including political stability, justice, religious duties, and the economic needs of the people, showing that rule was judged in ethical as well as administrative terms.",
      "Library of Congress materials on Timbuktu manuscripts preserve works on Islamic law, commerce, inheritance, peace, arithmetic, agriculture, and responses to royal requests, showing scholarship tied directly to governance and daily life.",
    ],
    whyItMatters:
      "Readers need to see government in action, not just as crowns and palaces. Law, markets, inheritance, diplomacy, and ritual legitimacy are the machinery that make institutions real.",
    caution:
      "Do not collapse all customary practice into one thing called 'traditional law.' Different societies and periods handled authority, property, gender, coercion, and punishment differently.",
    sources: [
      {
        label: "Met - Kings and Queens of Egypt",
        url: "https://www.metmuseum.org/essays/kings-and-queens-of-egypt",
        type: "Museum",
      },
      {
        label: "Met - Head of an Oba",
        url: "https://www.metmuseum.org/art/collection/search/312290",
        type: "Museum",
      },
      {
        label: "Library of Congress - Ancient Manuscripts from Timbuktu",
        url: "https://www.loc.gov/exhibits/mali/mali-exhibit.html",
        type: "Archive",
      },
    ],
  },
  {
    id: "women-power",
    kicker: "BLOCK 4C",
    title:
      "Women Exercised Political Power, But Not Everywhere in the Same Way",
    coverage: "Current coverage: Newly expanded",
    evidenceClass: "B",
    summary:
      "Royal women, queen mothers, kandakes, women's associations, market authorities, and ritual specialists formed part of African political history, but their power varied sharply by region, class, office, and period.",
    commonlyTaught:
      "Women often appear only as exceptional queens, which hides broader institutions, or they disappear entirely, which makes power look exclusively male.",
    missingContext:
      "Hatshepsut ruled as king in Egypt. Kandakes held major authority in Kush. Idia's office as iyoba in Benin linked maternal authority to court power. Scholarship on Igbo history points to women's associations and protest traditions that colonial rule later damaged. None of that means universal gender equality, but it does mean women belonged inside the political story.",
    evidence: [
      "Met scholarship on Hatshepsut shows a woman using full pharaonic titulary and monument language in a dynastic state.",
      "Met work on Idia explains that the iyoba held significant privileges, a separate residence, staff, and political standing equal to a senior chief within the Benin court.",
      "Scholarship cited through Cambridge and later historical work on Igbo societies shows overlapping women's associations, age grades, and village institutions rather than a politics defined only by male chiefs.",
    ],
    whyItMatters:
      "If women are erased from political history, readers miss how kinship, succession, ritual, household economy, war, and legitimacy actually worked.",
    caution:
      "Do not turn a few powerful women into proof that patriarchy did not exist. Elite office, ordinary life, and legal rights were not identical.",
    sources: [
      {
        label: "Met - Challenging Power through Gender Representation",
        url: "https://www.metmuseum.org/perspectives/hatshepsut-gender-representation",
        type: "Museum",
      },
      {
        label: "Met - Idia, First Queen Mother of Benin",
        url: "https://www.metmuseum.org/essays/idia-the-first-queen-mother-of-benin",
        type: "Museum",
      },
      {
        label:
          "Cambridge - Understanding Colonial Nigeria (social changes preview)",
        url: "https://www.cambridge.org/core/books/understanding-colonial-nigeria/social-changes/11FC0BE5923C6C523FF3336B76668DE9",
        type: "Academic",
      },
    ],
  },
  {
    id: "writing-systems",
    kicker: "BLOCK 4D",
    title:
      "African Writing Systems Included Scripts, Scholarly Manuscripts, and Restricted Graphic Systems",
    coverage: "Current coverage: Newly expanded",
    evidenceClass: "B",
    summary:
      "Africa's record includes hieroglyphic, cursive, alphabetic, abjad, and syllabic systems, as well as graphic sign traditions whose functions differ from phonetic writing. The evidence varies by region, medium, and decipherment.",
    commonlyTaught:
      "A common falsehood says Africa had no writing, or else people hear only about hieroglyphs and miss Meroitic, Ge'ez, Libyco-Berber/Tifinagh traditions, Arabic manuscript cultures, Ajami, Nsibidi, Vai, and Bamum.",
    missingContext:
      "Egypt used hieroglyphs, hieratic, and demotic in different media and settings. Kush used Meroitic script, which can be read in part but is not fully understood. Aksumite and later Ethiopian cultures used Ge'ez inscriptions and manuscripts. North African traditions preserve Libyco-Berber inscriptions and later Tifinagh continuities. West African Muslim scholars used Arabic and Ajami. Nsibidi conveyed social meaning through restricted graphic signs rather than a mass public alphabet. Later inventions such as Vai and Bamum show that African script innovation continued into the modern era.",
    evidence: [
      "Met and UCL materials already show Egyptian hieroglyphic, hieratic, and demotic writing embedded in administration, ritual, and education.",
      "UCL's Meroitic materials stress both the historical importance of the script and the fact that longer texts remain only partly understood.",
      "Met's Aksumite essay describes multilingual inscriptions in Greek, Ge'ez, and Sabaean, while Library of Congress and Timbuktu collections document major Arabic-script manuscript cultures in West Africa. Met scholarship on Nsibidi shows a graphic system tied to initiatory knowledge and social values rather than a universal public alphabet.",
    ],
    whyItMatters:
      "Writing is one of the clearest places where the myth of African absence breaks down. It also forces precision: not every sign system is the same kind of script, and not every script served the same public.",
    caution:
      "Do not confuse symbolic systems with fully phonetic scripts, and do not pretend every African language had a single ancient written form.",
    sources: [
      {
        label: "UCL - The Meroitic Period",
        url: "https://www.ucl.ac.uk/museums-static/digitalegypt/nubia/meroitic.html",
        type: "Education",
      },
      {
        label: "Met - Monumental Architecture of the Aksumite Empire",
        url: "https://www.metmuseum.org/essays/monumental-architecture-and-stelae-of-the-aksumite-empire",
        type: "Museum",
      },
      {
        label: "Library of Congress - Islamic Manuscripts from Mali",
        url: "https://www.loc.gov/collections/islamic-manuscripts-from-mali/about-this-collection/",
        type: "Archive",
      },
      {
        label: "Met - Akwanshi Stone Monoliths and Nsibidi context",
        url: "https://www.metmuseum.org/essays/akwanshi-stone-monoliths",
        type: "Museum",
      },
      {
        label: "British Museum - Libyco-Berber scripts",
        url: "https://africanrockart.britishmuseum.org/thematic/written-in-stone/",
        type: "Museum",
      },
      {
        label: "Library of Congress - Bamum Script Guide",
        url: "https://guides.loc.gov/bamum-script",
        type: "Education",
      },
    ],
  },
  {
    id: "oral-knowledge-education",
    kicker: "BLOCK 4E",
    title: "Oral Knowledge and Education Were Structured, Not Empty",
    coverage: "Current coverage: Newly expanded",
    evidenceClass: "B",
    summary:
      "Precolonial African education included family instruction, apprenticeship, ritual initiation, scribal and court training, Qur'anic schooling, manuscript study, and hereditary knowledge specialists who preserved law, genealogy, and political memory.",
    commonlyTaught:
      "Writing is often treated as the only serious container of knowledge, so oral societies get misread as people without history or education.",
    missingContext:
      "Met scholarship describes professional historians, jeliw, Luba memory boards, legal texts learned by rote, and multiple ways of preserving the past. Ethiopian monastic and manuscript traditions, Egyptian scribal culture, and West African Islamic education all sit beside apprenticeship, craft training, and performance as serious educational systems. Timbuktu belongs here as a preview of a larger Block 5 treatment, not as the whole story.",
    evidence: [
      "Met's Ways of Recording African History states that societies preserved the past through verbal, visual, and written forms and that some specialists memorized legal and dynastic texts with high verbal precision.",
      "The same essay describes Ge'ez manuscript traditions in Christian Ethiopia and Timbuktu's manuscript, library, and student networks in the western Sudan.",
      "Library of Congress materials preserve arithmetic, astronomy, law, commerce, medicine, and theology manuscripts used by students in Timbuktu and North Africa, showing teacher-student networks and book culture rather than a lone mythic university story.",
    ],
    whyItMatters:
      "Once oral knowledge is treated as knowledge, African intellectual history gets wider and more honest. Readers can then compare strengths and limits instead of using literacy as a civilizational gate.",
    caution:
      "Oral tradition, oral history, performance, and contemporary documentary evidence are not interchangeable. Some narratives preserve memory well; others compress time, legitimize lineages, or adapt to audience and ritual setting.",
    sources: [
      {
        label: "Met - Ways of Recording African History",
        url: "https://www.metmuseum.org/essays/ways-of-recording-african-history",
        type: "Museum",
      },
      {
        label: "Library of Congress - Timbuktu as an Islamic Cultural Center",
        url: "https://www.loc.gov/collections/islamic-manuscripts-from-mali/articles-and-essays/timbuktu-an-islamic-cultural-center/",
        type: "Archive",
      },
      {
        label: "Library of Congress - Ancient Manuscripts from Timbuktu",
        url: "https://www.loc.gov/exhibits/mali/mali-exhibit.html",
        type: "Archive",
      },
      {
        label: "Met - Ethiopian Healing Scrolls",
        url: "https://www.metmuseum.org/essays/ethiopian-healing-scrolls",
        type: "Museum",
      },
    ],
  },
  {
    id: "science-technology",
    kicker: "BLOCK 4F",
    title:
      "Science and Technical Knowledge Were Real, Specific, and Regionally Varied",
    coverage: "Current coverage: Newly expanded",
    evidenceClass: "B",
    summary:
      "African knowledge systems included architecture, water management, mining, metallurgy, medicine, astronomy, mathematics, agriculture, and craft specialization, but the evidence must be tied to actual places, objects, texts, and dates.",
    commonlyTaught:
      "The false extremes are familiar: either Africa contributed nothing, or viral claims try to answer erasure by saying Africans invented almost everything.",
    missingContext:
      "Egyptian medical papyri, Kushite water-management and ironworking evidence, Aksumite monumental architecture and coinage, Benin court guild production, Igbo-Ukwu lost-wax metalwork, and Great Zimbabwe's stone architecture all demonstrate technical sophistication without needing fantasy. Timbuktu manuscripts on astronomy and arithmetic show scholarly continuity. Earth construction, renewable materials, and regional craft traditions also belong in the history of engineering and design.",
    evidence: [
      "The Met's Art of Medicine in Ancient Egypt highlights the Edwin Smith Papyrus as a practical guide to diagnosis and treatment while also noting the coexistence of magical spells.",
      "UNESCO and World Heritage materials on Meroe and Great Zimbabwe document water management, stone architecture, trade connections, and evidence for ironworking without supporting exaggerated industrial myths.",
      "Met work on African lost-wax casting and Igbo-Ukwu demonstrates high technical skill in copper-alloy casting, while Library of Congress Timbuktu materials show manuscripts on arithmetic and astronomy used in scholarly study.",
    ],
    whyItMatters:
      "This is the section that lets readers reject both contempt and overcorrection. The continent's scientific and technical record is strongest when tied to evidence rather than slogan.",
    caution:
      "Independent origins, diffusion paths, and chronology remain debated in parts of African metallurgy. Public writing should say so directly rather than pretending every question is settled.",
    sources: [
      {
        label: "Met - The Art of Medicine in Ancient Egypt",
        url: "https://www.metmuseum.org/met-publications/the-art-of-medicine-in-ancient-egypt",
        type: "Museum",
      },
      {
        label: "UNESCO - Great Zimbabwe National Monument",
        url: "https://whc.unesco.org/en/list/364/",
        type: "Open Access",
      },
      {
        label: "UNESCO - Archaeological Sites of the Island of Meroe",
        url: "https://whc.unesco.org/en/list/1336/",
        type: "Open Access",
      },
      {
        label: "Met - African Lost-Wax Casting",
        url: "https://www.metmuseum.org/essays/african-lost-wax-casting",
        type: "Museum",
      },
      {
        label: "Library of Congress - Ancient Manuscripts from Timbuktu",
        url: "https://www.loc.gov/exhibits/mali/mali-exhibit.html",
        type: "Archive",
      },
    ],
  },
  {
    id: "benin-igbo-ukwu-zimbabwe",
    kicker: "BLOCK 4G",
    title:
      "Benin, Igbo-Ukwu, and Great Zimbabwe Show Statecraft, Craft, and Memory",
    coverage: "Current coverage: Newly expanded",
    evidenceClass: "B",
    summary:
      "Three especially powerful case studies show why Block 4 matters: Benin joins court structure, guild production, diplomacy, and colonial looting; Igbo-Ukwu reveals extraordinary metalworking without an invented empire story; Great Zimbabwe proves large-scale African architecture, trade, and state formation in southern Africa.",
    commonlyTaught:
      "Benin is often reduced to looted museum objects, Igbo-Ukwu is barely mentioned, and Great Zimbabwe has long suffered from colonial refusal to credit African builders.",
    missingContext:
      "Benin was an Edo kingdom with an oba, court offices, palace-centered art, specialist guilds, and Portuguese contact that reshaped politics and wealth. Igbo-Ukwu is an archaeological site, not proof of a lost super-state, but it does prove sophisticated ninth-century metalworking and long-distance trade links. Great Zimbabwe was a Shona state center whose architecture, trade, and political prestige were repeatedly denied by colonial writers even after archaeology established African authorship.",
    evidence: [
      "Met scholarship and object records tie Benin brass production to royal permission, guild specialization, dynastic continuity, and early contact with Portugal, while the British Museum explicitly identifies the 1897 violent seizure that dispersed many works.",
      "Met's Igbo-Ukwu essay describes excavated ninth-century ritual vessels and regalia castings, extraordinary technical accomplishment, and debate about exact chronology and broader political context.",
      "UNESCO identifies Great Zimbabwe as testimony to the Shona between the eleventh and fifteenth centuries, an important trading center, and a site whose persistent biblical legends illustrate long resistance to African attribution.",
    ],
    whyItMatters:
      "These cases let the page move from general claims to hard examples. They also model the method: admire the achievement, name the limits of the evidence, and show how colonial narratives distorted public memory.",
    caution:
      "Do not call every Benin object a bronze when some are brass, ivory, wood, or mixed media. Do not invent an Igbo-Ukwu empire, and do not use Great Zimbabwe as though one site explains all southern African history.",
    sources: [
      {
        label: "Met - Benin Chronology",
        url: "https://www.metmuseum.org/essays/benin-chronology",
        type: "Museum",
      },
      {
        label: "Met - Plaque with Portuguese Traders and Manillas",
        url: "https://www.metmuseum.org/art/collection/search/316486",
        type: "Museum",
      },
      {
        label: "British Museum - Benin Bronzes",
        url: "https://www.britishmuseum.org/about-us/british-museum-story/contested-objects-collection/benin-bronzes",
        type: "Museum",
      },
      {
        label: "Met - Igbo-Ukwu",
        url: "https://www.metmuseum.org/essays/igbo-ukwu-ca-9th-century",
        type: "Museum",
      },
      {
        label: "UNESCO - Great Zimbabwe National Monument",
        url: "https://whc.unesco.org/en/list/364/",
        type: "Open Access",
      },
      {
        label: "UNESCO - Great Zimbabwe storytelling framework",
        url: "https://www.unesco.org/en/articles/great-zimbabwe-national-monument-world-heritage-site-interpretation-and-storytelling-framework",
        type: "Open Access",
      },
    ],
  },
];

export const block4RulerProfiles: Block4RulerProfile[] = [
  {
    name: "Hatshepsut",
    period: "18th Dynasty, c. 1479-1458 BCE",
    region: "Egypt / Nile Valley",
    politicalSystem: "Centralized dynastic kingship",
    economicBase:
      "Nile agriculture, taxation, labor mobilization, and long-distance exchange",
    religiousContext: "Royal ideology tied to Amun, kingship ritual, and Ma'at",
    governance:
      "Ruled as king with full pharaonic titulary and monumental state patronage.",
    diplomacy:
      "Best known for trade and prestige exchange, including the Punt expedition in surviving state imagery.",
    militaryRole:
      "Less celebrated as a conqueror than some pharaohs, though she ruled through a military-capable state.",
    achievements:
      "Consolidated rule, built extensively, and normalized female kingship through political and visual strategy.",
    conflicts:
      "Had to legitimate her rule within a dynastic system built around male succession.",
    limitations:
      "Elite royal exception; her case cannot be used as proof of universal equality for Egyptian women.",
    legacy:
      "A central example of female sovereign authority in ancient Africa and of how gender, ritual, and statecraft intersected.",
    sources: [
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
    name: "Taharqa",
    period: "25th Dynasty, early 7th century BCE",
    region: "Kush / Egypt",
    politicalSystem: "Kushite monarchy ruling both Nubia and Egypt",
    economicBase:
      "Nile agriculture, trade corridors, tribute, and temple-centered political economy",
    religiousContext:
      "Kushite kingship strongly connected to Amun in both Napatan and Egyptian settings",
    governance:
      "Ruled Egypt as a Kushite pharaoh while remaining rooted in Nubian royal tradition.",
    diplomacy:
      "His reign intersected with Levantine, Assyrian, and wider northeastern African politics.",
    militaryRole:
      "Played a major role in wars with Assyria and in defending Kushite control in Egypt.",
    achievements:
      "Represents the clearest case of power moving north from Kush into Egypt at imperial scale.",
    conflicts:
      "Assyrian invasions and regional pressure weakened Kushite rule in Egypt.",
    limitations:
      "His reign should not be mistaken for the totality of Kushite history, which continued after retreat south.",
    legacy:
      "A major ruler for understanding African interstate politics, biblical references to Tirhakah, and Nubian agency in Egyptian history.",
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
    ],
  },
  {
    name: "Amanirenas",
    period: "Late 1st century BCE",
    region: "Kush / Meroe",
    politicalSystem: "Meroitic monarchy with Kandake authority",
    economicBase:
      "Nile and caravan exchange, regional agriculture, and control of strategic corridors south of Roman Egypt",
    religiousContext:
      "Meroitic royal religion with local and transregional influences",
    governance:
      "Known through fragmentary evidence as a ruler operating inside the Kandake political tradition.",
    diplomacy:
      "Her war with Rome ended in a negotiated settlement rather than simple Roman domination.",
    militaryRole:
      "Led or symbolized Kushite resistance in the Roman frontier conflict.",
    achievements:
      "Shows that women could occupy consequential sovereign power in Kush and shape classical-era diplomacy.",
    conflicts:
      "Evidence comes partly through Roman texts, which require critical reading against archaeology.",
    limitations:
      "The record is incomplete; public writing should avoid overconfident reconstruction of every campaign detail.",
    legacy:
      "An important figure for teaching African power within Mediterranean history without centering Rome alone.",
    sources: [
      {
        label: "Met - List of Rulers of Ancient Sudan",
        url: "https://www.metmuseum.org/toah/hd/ksud/hd_ksud.htm",
        type: "Museum",
      },
      {
        label: "Met - The Land of Nubia",
        url: "https://www.metmuseum.org/essays/nubia",
        type: "Museum",
      },
      {
        label:
          "Journal of Ancient Egyptian Interconnections - Roman Egyptian-Nubian frontier",
        url: "https://journals.uair.arizona.edu/index.php/jaei/article/view/21489",
        type: "Academic",
      },
    ],
  },
  {
    name: "Ezana",
    period: "c. 320-350 CE",
    region: "Aksum / Ethiopia and Eritrea",
    politicalSystem:
      "Trading empire with royal court, coinage, and inscriptions",
    economicBase:
      "Red Sea trade through Adulis, coinage, inland agriculture, and regional exchange",
    religiousContext:
      "Reign spans pre-Christian and Christian Aksum; inscriptions preserve the transition",
    governance:
      "Ruled an empire with multilingual inscriptions and cosmopolitan administrative communication.",
    diplomacy:
      "Aksum linked African, Arabian, Mediterranean, and Red Sea worlds.",
    militaryRole: "Inscriptions recount military campaigns and royal prowess.",
    achievements:
      "His reign is central for Aksumite writing, coinage, Christian state formation, and imperial reach.",
    conflicts:
      "The surviving evidence foregrounds royal success and leaves much ordinary administration obscure.",
    limitations:
      "Aksum's early history remains partly unclear; one ruler does not explain the whole Ethiopian past.",
    legacy:
      "A key ruler for connecting African written records, architecture, diplomacy, and religious change.",
    sources: [
      {
        label: "Met - Monumental Architecture of the Aksumite Empire",
        url: "https://www.metmuseum.org/essays/monumental-architecture-and-stelae-of-the-aksumite-empire",
        type: "Museum",
      },
      {
        label: "Met - African Christianity in Ethiopia",
        url: "https://www.metmuseum.org/essays/african-christianity-in-ethiopia",
        type: "Museum",
      },
    ],
  },
  {
    name: "Idia",
    period: "Early 16th century CE",
    region: "Kingdom of Benin",
    politicalSystem: "Court-centered monarchy with iyoba institution",
    economicBase:
      "Agriculture, regional trade, court patronage, and later Atlantic-facing exchange",
    religiousContext:
      "Court ritual, ancestral veneration, medicinal knowledge, and political spirituality",
    governance:
      "Helped shape the office of iyoba, with its own staff, residence, and rank inside court politics.",
    diplomacy:
      "Her son's reign coincided with intensified contact and exchange with Portugal.",
    militaryRole:
      "Remembered as politically and spiritually important to Esigie's victories and the restoration of Benin power.",
    achievements:
      "Institutionalized queen-mother authority in a way that outlived her individual life.",
    conflicts:
      "Her prominence emerged in a succession struggle and civil war context.",
    limitations:
      "Evidence reflects court memory and later representation as much as modern archival documentation.",
    legacy:
      "One of the strongest West African examples of queen-mother power embedded in state structure rather than added as ornament.",
    sources: [
      {
        label: "Met - Idia, First Queen Mother of Benin",
        url: "https://www.metmuseum.org/essays/idia-the-first-queen-mother-of-benin",
        type: "Museum",
      },
      {
        label: "Met - Plaque with Portuguese Traders and Manillas",
        url: "https://www.metmuseum.org/art/collection/search/316486",
        type: "Museum",
      },
    ],
  },
  {
    name: "Ana Nzinga",
    period: "r. 1624-1663",
    region: "Ndongo and Matamba, Central Africa",
    politicalSystem:
      "Monarchy adapting under Atlantic slave-trade and colonial pressure",
    economicBase:
      "Regional trade, shifting control of slave routes, and Matamba's position in interior exchange",
    religiousContext:
      "Moved across local political-religious systems and Christianity in diplomatic context",
    governance:
      "Repositioned power from Ndongo to Matamba and used sanctuary, alliance, and military reorganization to survive.",
    diplomacy:
      "Negotiated with Portugal and later allied with the Dutch against Portuguese power.",
    militaryRole:
      "Adopted and used kilombo-style organization and waged prolonged resistance under extreme pressure.",
    achievements:
      "Kept African state power alive under conditions shaped by Atlantic slavery and colonial violence.",
    conflicts:
      "Governed amid betrayal, warfare, displaced populations, and deep entanglement with the slave trade economy.",
    limitations:
      "She was not outside the violent world she navigated; heroic simplification can hide the coercive systems around her.",
    legacy:
      "A major ruler for understanding diplomacy, survival strategy, and female power in early modern Africa.",
    sources: [
      {
        label: "Met - Ana Nzinga, Queen of Ndongo",
        url: "https://www.metmuseum.org/essays/ana-nzinga-queen-of-ndongo",
        type: "Museum",
      },
    ],
  },
];

export const block4ClaimChecks: Block4ClaimCheck[] = [
  {
    claim: "Africa had no government before Europe arrived.",
    truth:
      "Precolonial African societies included many forms of political order, from dynastic states and courts to councils, age grades, title societies, market institutions, and scholarly legal cultures.",
    uncertain:
      "Institutional detail varies greatly by region and period, and some societies are better documented than others.",
    unsupported:
      "The idea that the continent lacked government, law, or organized authority is contradicted by archaeology, texts, oral traditions, and material culture.",
    whyItMatters:
      "This myth made conquest easier to justify by pretending colonialism introduced politics to people who supposedly had none.",
  },
  {
    claim: "Africa had no writing.",
    truth:
      "Africa had multiple writing traditions, including Egyptian scripts, Meroitic, Ge'ez, Libyco-Berber/Tifinagh continuities, Arabic manuscript cultures, Ajami traditions, and later scripts such as Vai and Bamum.",
    uncertain:
      "Not every system served the same purpose, and some, like Meroitic, remain only partly understood.",
    unsupported:
      "No serious evidence standard supports the blanket statement that Africa had no writing.",
    whyItMatters:
      "The myth erases administration, religion, education, literature, and memory across different African regions.",
  },
  {
    claim: "Oral societies had no history.",
    truth:
      "Oral transmission preserved genealogy, law, epic, dynastic memory, ritual knowledge, and local history, often through trained specialists.",
    uncertain:
      "Different oral traditions preserve different kinds of truth with different levels of chronological stability.",
    unsupported:
      "Treating nonwritten transmission as equivalent to no history is false.",
    whyItMatters:
      "It confuses one medium of preservation with the existence of memory itself.",
  },
  {
    claim: "Every African society was a kingdom.",
    truth:
      "Some African societies were centralized monarchies, but others were confederated, city-based, lineage-based, acephalous, or governed through overlapping institutions.",
    uncertain:
      "The balance between central and local authority could shift over time within the same broad region.",
    unsupported:
      "Using 'kingdom' as the default label for every society flattens the evidence.",
    whyItMatters:
      "Readers need a richer political vocabulary than crown-or-chaos.",
  },
  {
    claim: "Africa had no science or technology.",
    truth:
      "Documented African knowledge includes medicine, architecture, metallurgy, water management, mathematics, astronomy, agriculture, textiles, and manuscript scholarship.",
    uncertain:
      "Different fields are documented unevenly and often survive through objects or later copies rather than complete archives.",
    unsupported:
      "The claim of total absence fails against the archaeological and textual record.",
    whyItMatters:
      "It denies technical agency and turns real achievement into someone else's inheritance.",
  },
  {
    claim: "Africans invented every major modern technology.",
    truth:
      "African societies developed important technologies and bodies of knowledge in their own historical contexts.",
    uncertain:
      "Origins, diffusion routes, and cross-cultural borrowing can be debated in some fields, especially metallurgy.",
    unsupported:
      "Sweeping claims that assign every later world technology to Africa without evidence are not responsible history.",
    whyItMatters:
      "Overcorrection may feel protective, but it weakens credibility and blurs the real record.",
  },
];

export const block4SchoolGaps: Block4CurriculumGap[] = [
  {
    title: "Government without kings",
    commonlyTaught:
      "Political complexity is often shown through empires and royal palaces alone.",
    missingContext:
      "Village assemblies, councils of elders, age grades, women's associations, title societies, and market institutions could govern sophisticated communities without a single king.",
    evidence:
      "Met and later scholarship on African historical recording and Nigerian political history point to distributed authority rather than institutional absence.",
    whyItMatters: "It breaks the false equation monarchy = civilization.",
  },
  {
    title: "Queen mothers and women's political institutions",
    commonlyTaught:
      "A few queens appear as exceptions, if women appear at all.",
    missingContext:
      "Kandakes, iyobas, royal women, and women's associations helped shape succession, counsel, ritual legitimacy, and political mobilization.",
    evidence:
      "Met essays on Hatshepsut, Idia, and Ana Nzinga, plus scholarship on Igbo women's institutions, all document female political authority in different forms.",
    whyItMatters: "It restores gendered power as structure, not trivia.",
  },
  {
    title: "African writing beyond hieroglyphs",
    commonlyTaught:
      "Students may hear only of Egyptian hieroglyphs or nothing at all.",
    missingContext:
      "Meroitic, Ge'ez, Libyco-Berber/Tifinagh, Arabic manuscript cultures, Ajami, Nsibidi, Vai, and Bamum reveal different literacies and graphic traditions across the continent.",
    evidence:
      "UCL, Met, Library of Congress, British Museum, and Library of Congress Bamum materials all show multiple systems with different media and degrees of decipherment.",
    whyItMatters:
      "It replaces the myth of absence with a more accurate map of diversity.",
  },
  {
    title: "Oral knowledge as historical method",
    commonlyTaught:
      "Orality is often treated as folklore rather than evidence.",
    missingContext:
      "Professional historians, praise singers, genealogists, and initiatory specialists preserved legal, dynastic, and social memory with trained methods and mnemonic devices.",
    evidence:
      "Met's Ways of Recording African History explicitly treats verbal, visual, and written preservation together.",
    whyItMatters:
      "It teaches readers to evaluate evidence rather than dismiss whole mediums.",
  },
  {
    title: "Benin as statecraft, technology, and colonial looting",
    commonlyTaught:
      "Benin often enters school only as museum controversy over 'bronzes.'",
    missingContext:
      "The historical Edo kingdom included dynastic succession, court offices, guilds, diplomacy, palace architecture, and a violent 1897 British punitive expedition that dispersed court art.",
    evidence:
      "Met and British Museum materials preserve both the kingdom's institutions and the history of seizure and restitution debate.",
    whyItMatters:
      "It reconnects the objects to the state that produced them and to the violence that removed them.",
  },
  {
    title: "Igbo-Ukwu and the limits of the evidence",
    commonlyTaught: "Igbo-Ukwu is usually absent.",
    missingContext:
      "The site proves highly sophisticated ninth-century metalworking and trade links, but it does not authorize invented empire stories.",
    evidence:
      "Met's Igbo-Ukwu essay is strong precisely because it pairs admiration with caution.",
    whyItMatters: "It models truth over mythology.",
  },
  {
    title: "Great Zimbabwe's African authorship",
    commonlyTaught:
      "Great Zimbabwe may be reduced to ruins, legend, or a single photo.",
    missingContext:
      "It was a Shona state center, major trading site, and architectural achievement whose African origin colonial writers often resisted.",
    evidence:
      "UNESCO identifies it as testimony to Shona civilization and notes the persistence of biblical-origin legends that long distorted interpretation.",
    whyItMatters:
      "It is one of the clearest cases where school omission and colonial denial reinforced each other.",
  },
];
