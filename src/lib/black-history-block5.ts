export interface Block5ResourceLink {
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

export interface Block5HistorySection {
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
  sources: Block5ResourceLink[];
}

export interface Block5ClaimCheck {
  claim: string;
  truth: string;
  uncertain: string;
  unsupported: string;
  whyItMatters: string;
}

export interface Block5CurriculumGap {
  title: string;
  commonlyTaught: string;
  missingContext: string;
  evidence: string;
  whyItMatters: string;
}

export interface Block5RulerProfile {
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
  sources: Block5ResourceLink[];
}

export const block5Sections: Block5HistorySection[] = [
  {
    id: "ghana-wagadu",
    kicker: "BLOCK 5A",
    title:
      "Ghana or Wagadu Was a Sahelian State, Not the Modern Republic of Ghana",
    coverage: "Current coverage: Newly expanded",
    evidenceClass: "B",
    summary:
      "The polity often called the Ghana Empire, or Wagadu in Soninke traditions, grew in the western Sahel between gold-producing regions to the south and Saharan routes to the north. Arabic writers used Ghana as a ruler-title, and the polity should not be collapsed into the borders of the modern nation-state named Ghana.",
    commonlyTaught:
      "School often turns ancient Ghana into a simple first empire on a timeline and then rushes to Mali, leaving readers with little sense of geography, Soninke context, trade taxation, or the difference between the medieval polity and the modern country.",
    missingContext:
      "Ghana or Wagadu drew strength from its location in the Sahel, from taxation of imports and exports, and from relationships among rulers, merchants, and regional communities. Kumbi Saleh appears in Arabic descriptions as an important political and mercantile center, but archaeology still leaves room for debate about capitals, chronology, and the exact shape of political integration.",
    evidence: [
      "Met scholarship explains that Ghana, Mali, and Songhai had no fixed modern-style borders and may have shifted among multiple urbanized centers rather than relying on one permanent capital in the modern sense.",
      "The Met's trans-Saharan trade essay notes that Ghana controlled Audaghost by about 1050 and later lost dominance as routes shifted toward the Bure goldfield, which helps explain change through trade geography instead of one cartoon conquest story.",
      "UNESCO's General History of Africa frames the twelfth to sixteenth centuries as a period of expanding exchange and state development, which supports teaching Ghana within a larger Sahelian world rather than as an isolated prelude.",
    ],
    whyItMatters:
      "This is one of the clearest places where modern map habits distort African history. Once Ghana or Wagadu is taught on its own terms, West Africa looks like a field of political and commercial strategy instead of a blank zone waiting for later empires.",
    caution:
      "Arabic accounts include valuable evidence but also distance, hearsay, and outsider framing. Public writing should avoid treating every report about Kumbi Saleh, taxation, or conversion as equally direct observation.",
    sources: [
      {
        label: "Met - The Empires of the Western Sudan",
        url: "https://www.metmuseum.org/essays/the-empires-of-the-western-sudan",
        type: "Museum",
      },
      {
        label: "Met - The Trans-Saharan Gold Trade",
        url: "https://www.metmuseum.org/essays/the-trans-saharan-gold-trade-7th-14th-century",
        type: "Academic",
      },
      {
        label: "UNESCO - General History of Africa",
        url: "https://www.unesco.org/en/general-history-africa",
        type: "Open Access",
      },
      {
        label: "Fordham - Internet African History Sourcebook",
        url: "https://sourcebooks.web.fordham.edu/africa/africasbook.asp",
        type: "Primary Sources",
      },
    ],
  },
  {
    id: "source-lens",
    kicker: "BLOCK 5B",
    title:
      "The Earliest Written Sources Matter, But They Must Be Read Critically",
    coverage: "Current coverage: Newly expanded",
    evidenceClass: "B",
    summary:
      "Much of the written record for medieval West Africa comes through Arabic geographers, travelers, jurists, and later chronicles, each with a different distance from the events they describe. These sources are indispensable, but they are not transparent windows.",
    commonlyTaught:
      "Popular retellings often cite al-Bakri, al-Umari, Ibn Battuta, Ibn Khaldun, or the Timbuktu chronicles as though all of them saw the same things firsthand.",
    missingContext:
      "Al-Bakri wrote in eleventh-century al-Andalus and relied on merchant reports rather than direct travel to Ghana. Al-Umari wrote after Musa's pilgrimage and gathered reports in Cairo. Ibn Battuta actually traveled in Mali in the fourteenth century, but his experiences were still partial and shaped by his own expectations. Later chronicles such as Tarikh al-Sudan and Tarikh al-Fattash preserve invaluable Songhai-era memory, but they were written after many of the earlier events they narrate and reflect scholarly and political positions of their own.",
    evidence: [
      "The Fordham African History Sourcebook groups the major Arabic accounts precisely because West African history is often reconstructed from layered textual traditions rather than one eyewitness archive.",
      "Met scholarship on the western Sudan repeatedly combines object history, trade geography, and archaeology with written accounts, which models the right method for reading Ghana, Mali, and Songhai.",
      "UNESCO's historical method explicitly treats oral traditions, written archives, and archaeology as complementary but not identical forms of evidence.",
    ],
    whyItMatters:
      "This source discipline keeps the page from turning either skeptical in a lazy way or credulous in a romantic way. It lets readers see how historians know what they know.",
    caution:
      "Do not oversell direct observation. The public page should distinguish eyewitness travel, court report, chronicle memory, and later scholarly reconstruction whenever possible.",
    sources: [
      {
        label: "Fordham - Internet African History Sourcebook",
        url: "https://sourcebooks.web.fordham.edu/africa/africasbook.asp",
        type: "Primary Sources",
      },
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
    ],
  },
  {
    id: "mali-sundiata",
    kicker: "BLOCK 5C",
    title: "Mali Was a Political World, Not Just a Story About One Rich King",
    coverage: "Current coverage: Newly expanded",
    evidenceClass: "C",
    summary:
      "Mali emerged in the thirteenth century through Mande-speaking political consolidation, control over trade corridors, and relationships among rulers, lineages, farming zones, and merchant networks. Sundiata sits at the center of this story, but he belongs to both history and epic tradition.",
    commonlyTaught:
      "Public history often jumps from 'Ghana fell' straight to Mansa Musa, skipping the formation of Mali, the role of Sundiata, and the way oral tradition preserves political memory.",
    missingContext:
      "The Epic of Sundiata is not a literal documentary transcript, but neither is it disposable folklore. It preserves memory about political foundation, social order, alliance, legitimacy, and the work of jeliw or griots. Historical support is strongest for Mali's rise, Sundiata's foundational role, and later memory of victory over Sumanguru, while many exact epic details belong to tradition and later performance rather than to secure chronology.",
    evidence: [
      "Met chronology for western and central Sudan identifies Sundiata's defeat of the Soso as the birth of the Mali empire and explicitly notes his importance as both historical and folk hero in a living oral tradition.",
      "The Met's trans-Saharan gold-trade essay connects Mali's rise to the shift of routes toward Bure and to the Malinke political world liberated under Sundiata.",
      "UNESCO's General History of Africa Volume IV frames the period as one of expanding written records, political development, and trade, which supports treating Mali as a full civilization rather than a biographical anecdote.",
    ],
    whyItMatters:
      "Mali is the perfect place to show that oral tradition is evidence without pretending that epic performance works like a notarized state archive. That makes the page more rigorous and more honest at the same time.",
    caution:
      "Avoid presenting later constitutional traditions such as Kouroukan Fouga as though every current version were a contemporary thirteenth-century written statute. The safer public claim is that later Mande tradition preserves powerful memories of political ordering and social obligation.",
    sources: [
      {
        label: "Met - Western and Central Sudan, 1000-1400 A.D. Chronology",
        url: "https://www.metmuseum.org/toah/ht/07/afu",
        type: "Museum",
      },
      {
        label: "Met - The Trans-Saharan Gold Trade",
        url: "https://www.metmuseum.org/essays/the-trans-saharan-gold-trade-7th-14th-century",
        type: "Academic",
      },
      {
        label: "UNESCO - General History of Africa",
        url: "https://www.unesco.org/en/general-history-africa",
        type: "Open Access",
      },
      {
        label: "UNESCO Courier - Sundiata and Mansa Musa",
        url: "https://unesdoc.unesco.org/ark:/48223/pf0000044668",
        type: "Open Access",
      },
    ],
  },
  {
    id: "mansa-musa",
    kicker: "BLOCK 5D",
    title:
      "Mansa Musa's Importance Was Political, Economic, and Diplomatic, Not Just Viral Net-Worth Math",
    coverage: "Current coverage: Newly expanded",
    evidenceClass: "B",
    summary:
      "Mansa Musa ruled Mali in the fourteenth century and became internationally famous through control over a state linked to major gold networks, large agrarian and tributary resources, and trans-Saharan exchange. His pilgrimage was a diplomatic projection of power as much as an act of devotion.",
    commonlyTaught:
      "School and social media often reduce Musa to a single line: richest man ever, worth a modern dollar amount, and carrying so much gold that he broke Cairo's economy.",
    missingContext:
      "The safer historical claim is not an exact billionaire conversion. It is that Musa commanded extraordinary access to state resources, tribute, and gold within a major Sahelian empire. His 1324-1325 pilgrimage to Cairo and Mecca broadcast Mali's importance to a wider Afro-Eurasian world, helped produce written descriptions by later authors, and fed the political imagination seen in later mapmaking such as the Catalan Atlas.",
    evidence: [
      "The Met states that Mansa Musa's arrival in Cairo in 1324-1325 with large amounts of gold caused the gold market to crash, while also implying that such reports must be read as evidence of extraordinary scale rather than as a precise modern accounting ledger.",
      "The Met's western Sudan essay explains that rulers in the region amassed wealth through strategic location between southern gold fields and Saharan salt mines, plus taxation of imports and exports.",
      "UNESCO's West African framing treats Mali as an organized political and economic system rather than a singularly wealthy individual detached from state structures.",
    ],
    whyItMatters:
      "Readers deserve something better than fake precision. Once Musa is reattached to agriculture, gold regions, tribute, caravans, pilgrimage, diplomacy, and architecture, he becomes more historically interesting and less mythic in the bad sense.",
    caution:
      "Do not equate royal command over state resources with modern personal net worth. Do not assign a hard dollar figure to Musa's wealth on the public page.",
    sources: [
      {
        label: "Met - The Trans-Saharan Gold Trade",
        url: "https://www.metmuseum.org/essays/the-trans-saharan-gold-trade-7th-14th-century",
        type: "Academic",
      },
      {
        label: "UNESCO - General History of Africa",
        url: "https://www.unesco.org/en/general-history-africa",
        type: "Open Access",
      },
      {
        label: "Fordham - Internet African History Sourcebook",
        url: "https://sourcebooks.web.fordham.edu/africa/africasbook.asp",
        type: "Primary Sources",
      },
    ],
  },
  {
    id: "timbuktu-manuscripts",
    kicker: "BLOCK 5E",
    title: "Timbuktu Was a Market, a Scholarly Center, and a Manuscript City",
    coverage: "Current coverage: Newly expanded",
    evidenceClass: "B",
    summary:
      "Timbuktu mattered because commerce, religious life, scholarship, and manuscript production converged there. The city's importance lay not in a modern university analogy alone, but in linked mosques, teachers, jurists, students, libraries, traders, and family-held collections.",
    commonlyTaught:
      "School often mentions Timbuktu as a punchline for remoteness or as a vague city of learning without explaining what was actually taught, copied, traded, and preserved there.",
    missingContext:
      "UNESCO identifies Timbuktu as an intellectual and spiritual capital in the fifteenth and sixteenth centuries, while Library of Congress materials show actual manuscripts on astronomy, arithmetic, law, inheritance, commerce, medicine, agriculture, diplomacy, slavery, and theology. Sankore, Djinguereber, and Sidi Yahya anchor a scholarly landscape, but terms like 'University of Sankore' should be used carefully because the historical system was mosque-based, manuscript-centered, and sustained through teacher-student relationships rather than a modern campus bureaucracy.",
    evidence: [
      "UNESCO's Timbuktu listing describes the city as an intellectual and spiritual capital and also presents it as a market where manuscripts, salt from Taghaza, gold, grain, and cattle circulated.",
      "Library of Congress manuscript materials preserve astronomy, arithmetic, inheritance law, commercial law, political counsel, medicine, agriculture, peace letters, slave-sale agreements, and certificates of emancipation, which together show a broad documentary culture rather than one narrow field of study.",
      "The Library of Congress exhibition explicitly notes that manuscripts were used in the education of Malians, and its surviving examples show book culture in family and institutional custody rather than a myth of one centralized library alone.",
    ],
    whyItMatters:
      "Timbuktu is one of the strongest counters to the lie that West Africans became literate only through European intervention. It also shows that scholarship can flourish through networked teachers, jurists, and merchants without mirroring a modern university catalog.",
    caution:
      "Do not claim that every Timbuktu manuscript contains hidden advanced science. The collections are valuable precisely because they preserve ordinary intellectual life as well as specialized scholarship.",
    sources: [
      {
        label: "UNESCO - Timbuktu",
        url: "https://whc.unesco.org/en/list/119/",
        type: "Open Access",
      },
      {
        label: "Library of Congress - Ancient Manuscripts from Timbuktu",
        url: "https://www.loc.gov/exhibits/mali/mali-exhibit.html",
        type: "Archive",
      },
      {
        label: "Library of Congress - Islamic Manuscripts from Mali",
        url: "https://www.loc.gov/collections/islamic-manuscripts-from-mali/about-this-collection/",
        type: "Archive",
      },
    ],
  },
  {
    id: "songhai-cities-trade",
    kicker: "BLOCK 5F",
    title:
      "Songhai, Gao, Djenné, Gold, Salt, and River Power Extended the Sahelian Political World",
    coverage: "Current coverage: Newly expanded",
    evidenceClass: "B",
    summary:
      "Songhai grew through Gao, Niger River mobility, cavalry, taxation, and the capture or control of major trade and scholarly centers such as Timbuktu and Djenné. West African urbanism and commerce were wider than one court or one ruler.",
    commonlyTaught:
      "West Africa is still too often pictured as villages plus caravans, with Songhai treated as a short epilogue after Mali or as a simple military state.",
    missingContext:
      "Songhai's rise under Sunni Ali and consolidation under Askia Muhammad linked river fleets, cavalry, taxation, provincial authority, Islamic legitimacy, and urban centers. UNESCO's Djenné listing separates the archaeological sites of Djenné-Djeno and related mounds from the later Islamic city of Djenné, which is crucial because the region's urban history spans multiple phases rather than one undifferentiated settlement. Women's roles in market exchange, agriculture, household economy, and legal status appear in manuscript and travel-source fragments, but the evidence is uneven and should not be inflated into universal claims.",
    evidence: [
      "Met's Sahel exhibition notes that Gao developed in parallel to ancient Ghana, that Mali lost Gao and Timbuktu to Songhay in the 1430s, and that Sunni Ali used cavalry and riverboats before Askia Muhammad deepened ties to the Islamic scholarly establishment.",
      "UNESCO's Tomb of Askia listing ties Askia Muhammad's monument at Gao to Songhai's control of the trans-Saharan salt and gold trades and to the adoption of Islam as the empire's official religion.",
      "UNESCO's Old Towns of Djenné listing states that Djenné became a market center and a major link in the trans-Saharan gold trade, while also emphasizing the separate archaeological remains of a pre-Islamic civilization.",
    ],
    whyItMatters:
      "This section breaks the habit of teaching West Africa as only Ghana, then Musa, then silence. It restores cities, river systems, architecture, coercion, and institutional adaptation.",
    caution:
      "Do not romanticize trade. Manuscripts and urban prosperity coexisted with slavery, warfare, and political coercion. Public writing should name those together.",
    sources: [
      {
        label: "Met - Sahel: Art and Empires on the Shores of the Sahara",
        url: "https://www.metmuseum.org/exhibitions/sahel-art-empire-sahara/inside-the-exhibition",
        type: "Museum",
      },
      {
        label: "UNESCO - Tomb of Askia",
        url: "https://whc.unesco.org/en/list/1139/",
        type: "Open Access",
      },
      {
        label: "UNESCO - Old Towns of Djenne",
        url: "https://whc.unesco.org/en/list/116/",
        type: "Open Access",
      },
      {
        label: "Library of Congress - Ancient Manuscripts from Timbuktu",
        url: "https://www.loc.gov/exhibits/mali/mali-exhibit.html",
        type: "Archive",
      },
    ],
  },
];

export const block5RulerProfiles: Block5RulerProfile[] = [
  {
    name: "Sundiata Keita",
    period: "13th century, traditionally c. 1230-1255",
    region: "Mali / Mande world",
    politicalSystem:
      "Expanding Mande monarchy and alliance network within the early Mali state",
    economicBase:
      "Agriculture, tribute, control of trade corridors, and access to gold-bearing regions through a broader imperial network",
    religiousContext:
      "Mande sacred traditions persisted alongside an expanding Islamic commercial world",
    governance:
      "Remembered as a founder who consolidated authority through alliance, conquest, and political ordering in the Mande heartland.",
    diplomacy:
      "His historical role is best understood through the coalition-building that allowed Mali to replace Soso dominance and shape regional power.",
    militaryRole:
      "Best known for victory over Sumanguru Kante and for the military consolidation associated with Mali's rise.",
    achievements:
      "Founded Mali in historical memory and remains the central bridge between oral epic and political history in the western Sudan.",
    conflicts:
      "Much of the surviving narrative comes through epic performance and later recollection rather than contemporary court documents.",
    limitations:
      "Exact chronology, speeches, and constitutional details cannot be treated as fully documented in the modern archival sense.",
    legacy:
      "A foundational ruler whose story teaches both the power and the interpretive limits of oral tradition.",
    sources: [
      {
        label: "Met - Western and Central Sudan, 1000-1400 A.D. Chronology",
        url: "https://www.metmuseum.org/toah/ht/07/afu",
        type: "Museum",
      },
      {
        label: "Met - The Trans-Saharan Gold Trade",
        url: "https://www.metmuseum.org/essays/the-trans-saharan-gold-trade-7th-14th-century",
        type: "Academic",
      },
      {
        label: "UNESCO Courier - Sundiata and Mansa Musa",
        url: "https://unesdoc.unesco.org/ark:/48223/pf0000044668",
        type: "Open Access",
      },
    ],
  },
  {
    name: "Mansa Musa",
    period: "Reigned c. 1312-1337",
    region: "Mali / western Sudan",
    politicalSystem:
      "Imperial monarchy over a large tributary and commercial state",
    economicBase:
      "Gold networks, agriculture, tribute, taxation of exchange, and caravan-linked trade",
    religiousContext:
      "A Muslim ruler governing a socially and religiously diverse empire",
    governance:
      "Ruled through royal authority over provinces, tribute, trade corridors, and strategic cities.",
    diplomacy:
      "His pilgrimage to Cairo and Mecca served as religious devotion, prestige diplomacy, and imperial projection.",
    militaryRole:
      "His fame rests more on state scale and patronage than on a surviving military legend, though he commanded a powerful state.",
    achievements:
      "Elevated Mali's international reputation, strengthened connections with North Africa and the wider Islamic world, and became the best-known ruler of medieval West Africa in later mapmaking and writing.",
    conflicts:
      "Later accounts magnified parts of his story, especially around wealth, and can flatten the broader institutions that made his reign possible.",
    limitations:
      "Exact modern-dollar wealth claims are methodologically weak and should not replace historical analysis of state resources and trade power.",
    legacy:
      "A ruler whose fame shows West Africa's place in global history, but whose importance is best understood through Mali rather than internet billionaire rankings.",
    sources: [
      {
        label: "Met - The Trans-Saharan Gold Trade",
        url: "https://www.metmuseum.org/essays/the-trans-saharan-gold-trade-7th-14th-century",
        type: "Academic",
      },
      {
        label: "Fordham - Internet African History Sourcebook",
        url: "https://sourcebooks.web.fordham.edu/africa/africasbook.asp",
        type: "Primary Sources",
      },
      {
        label: "UNESCO - General History of Africa",
        url: "https://www.unesco.org/en/general-history-africa",
        type: "Open Access",
      },
    ],
  },
  {
    name: "Sunni Ali",
    period: "Reigned 1464-1492",
    region: "Songhai / Gao, Timbuktu, and Djenné",
    politicalSystem:
      "Expansionist Songhai monarchy with river and cavalry power",
    economicBase:
      "Niger River control, taxation, trade routes, urban capture, and military mobility",
    religiousContext:
      "Maintained ties to local traditions while ruling within an Islamic commercial and scholarly environment",
    governance:
      "Expanded Songhai through conquest and control of key riverine and urban nodes rather than through a modern bureaucratic apparatus.",
    diplomacy:
      "His legitimacy and reputation were shaped partly by later Islamic chroniclers, many of whom were hostile to aspects of his rule.",
    militaryRole:
      "Built Songhai through cavalry, riverboats, sieges, and the seizure of Timbuktu and Djenné.",
    achievements:
      "Made Songhai the dominant military and territorial power in the western Sudan before the Askia dynasty.",
    conflicts:
      "His relationships with Timbuktu's scholars and Islamic authorities are remembered through sources with strong political and religious biases.",
    limitations:
      "He should not be reduced either to a secular hero or to an anti-Muslim caricature.",
    legacy:
      "A pivotal ruler for understanding how military expansion, local religion, and scholarly critique intersected in Songhai history.",
    sources: [
      {
        label: "Met - Sahel: Art and Empires on the Shores of the Sahara",
        url: "https://www.metmuseum.org/exhibitions/sahel-art-empire-sahara/inside-the-exhibition",
        type: "Museum",
      },
      {
        label: "Fordham - Internet African History Sourcebook",
        url: "https://sourcebooks.web.fordham.edu/africa/africasbook.asp",
        type: "Primary Sources",
      },
    ],
  },
  {
    name: "Askia Muhammad",
    period: "Reigned 1493-1528",
    region: "Songhai / Gao, Timbuktu, and the western Sahel",
    politicalSystem:
      "Imperial Songhai monarchy with stronger Islamic legal and administrative orientation",
    economicBase:
      "Taxation, trans-Saharan trade, Niger River corridors, tribute, and urban control",
    religiousContext:
      "Linked royal legitimacy more explicitly to Islam and relations with jurists and scholars",
    governance:
      "Consolidated Songhai after Sunni Ali, strengthened provincial rule, and sought legal guidance for political authority.",
    diplomacy:
      "Pilgrimage, ties with North African scholars, and the political use of Islamic legitimacy expanded Songhai's external standing.",
    militaryRole:
      "Rose to power through military command and preserved a large empire whose coherence still depended on force, alliances, and provincial negotiation.",
    achievements:
      "Made Gao the capital, patronized scholarship, and left one of the clearest surviving architectural markers of Songhai power in the Tomb of Askia.",
    conflicts:
      "Succession politics, provincial control, and the gap between ideal legal order and imperial practice remained real pressures.",
    limitations:
      "Songhai under Askia was not a modern centralized bureaucracy, and claims about perfect Islamic governance should be treated cautiously.",
    legacy:
      "A major ruler for understanding law, religion, administration, and urban authority in late medieval West Africa.",
    sources: [
      {
        label: "UNESCO - Tomb of Askia",
        url: "https://whc.unesco.org/en/list/1139/",
        type: "Open Access",
      },
      {
        label: "Library of Congress - Ancient Manuscripts from Timbuktu",
        url: "https://www.loc.gov/exhibits/mali/mali-exhibit.html",
        type: "Archive",
      },
      {
        label: "Met - Sahel: Art and Empires on the Shores of the Sahara",
        url: "https://www.metmuseum.org/exhibitions/sahel-art-empire-sahara/inside-the-exhibition",
        type: "Museum",
      },
    ],
  },
];

export const block5ClaimChecks: Block5ClaimCheck[] = [
  {
    claim: "Mansa Musa was worth exactly $400 billion.",
    truth:
      "Mansa Musa clearly controlled extraordinary resources within one of the most important gold-linked states of the fourteenth century.",
    uncertain:
      "Any modern-dollar estimate depends on speculative conversions between royal command, tribute, mining output, and modern wealth categories that do not map cleanly onto a medieval empire.",
    unsupported:
      "A precise billionaire number should not be presented as settled historical fact.",
    whyItMatters:
      "Fake precision makes the history easier to repeat but less accurate. Musa is more impressive when described through actual institutions and global connections.",
  },
  {
    claim: "Timbuktu had a modern university just like today.",
    truth:
      "Timbuktu sustained major scholarly activity through mosques, teachers, students, jurists, and manuscript study.",
    uncertain:
      "Modern terms like university can help readers quickly grasp scale, but they can also flatten historical structures such as mosque-based learning and authorization networks.",
    unsupported:
      "The city should not be described as a modern campus institution with contemporary departmental structures unless a source is speaking metaphorically.",
    whyItMatters:
      "Using historically accurate language shows respect for African institutions rather than validating them only when they resemble Europe or the present.",
  },
  {
    claim: "Every Timbuktu manuscript contains lost advanced science.",
    truth:
      "The surviving collections include real materials on astronomy, arithmetic, law, commerce, medicine, agriculture, and diplomacy.",
    uncertain:
      "Many collections remain understudied, scattered, or partially cataloged, so historians are still refining the total picture.",
    unsupported:
      "There is no basis for claiming that every manuscript contains revolutionary hidden knowledge beyond the known history of scholarship.",
    whyItMatters:
      "Ordinary legal and educational manuscripts are historically valuable too. Exaggeration creates a new myth instead of correcting an old one.",
  },
  {
    claim: "West Africans only became literate after Europeans arrived.",
    truth:
      "West African manuscript cultures in Arabic and Ajami long predate European colonial rule, and literacy was already embedded in trade, law, religion, and scholarship.",
    uncertain:
      "Literacy rates, language distribution, and access varied by region, class, gender, occupation, and period.",
    unsupported:
      "Colonial-era literacy cannot be treated as the beginning of writing or scholarship in West Africa.",
    whyItMatters:
      "This myth erases African agency in education, manuscript culture, and adaptation of script traditions.",
  },
  {
    claim: "The Ghana Empire was the modern country of Ghana.",
    truth:
      "The medieval polity usually called Ghana or Wagadu occupied a Sahelian zone farther northwest and belongs to Soninke and western Sudan history.",
    uncertain:
      "Exact borders and capital arrangements remain debated because medieval states did not operate like modern mapped nation-states.",
    unsupported:
      "The medieval polity should not be equated territorially with the present Republic of Ghana.",
    whyItMatters:
      "Modern map habits can misteach African history before the reader even reaches the details.",
  },
  {
    claim: "Mali was just one king's personal empire.",
    truth:
      "Mali depended on wider structures of agriculture, tribute, trade routes, provincial authority, cities, and lineages.",
    uncertain:
      "The exact administrative mechanics changed over time and are not always fully documented in surviving sources.",
    unsupported:
      "Reducing Mali to Musa alone hides both earlier formation under Sundiata and the broader imperial system.",
    whyItMatters:
      "Historical seriousness requires attention to institutions, not just personalities.",
  },
  {
    claim: "Salt was always literally worth its weight in gold.",
    truth:
      "Salt was economically vital across the Sahel and savanna and could be extremely valuable depending on place, demand, transport, and political control.",
    uncertain:
      "Relative values varied across regions and moments, so broad comparisons need context.",
    unsupported:
      "A universal law that salt always traded weight-for-weight with gold is not supported as a timeless historical rule.",
    whyItMatters:
      "This is a good example of how vivid classroom shorthand can harden into false certainty.",
  },
];

export const block5SchoolGaps: Block5CurriculumGap[] = [
  {
    title: "Ghana or Wagadu Was Not Modern Ghana",
    commonlyTaught:
      "Ancient Ghana often appears as a simple early empire with little geographic explanation.",
    missingContext:
      "The medieval polity belonged to the western Sudan and Sahel, and Ghana in Arabic accounts functioned as a ruler-title as well as a state label.",
    evidence:
      "Met and sourcebook materials show a Soninke-centered Sahelian polity distinct from the present Republic of Ghana.",
    whyItMatters:
      "Without this distinction, readers build the rest of West African history on a mistaken map.",
  },
  {
    title: "Mali Was More Than Mansa Musa",
    commonlyTaught:
      "Mali often survives in public memory as one pilgrimage and one viral wealth fact.",
    missingContext:
      "Mali was a civilization with political formation, agriculture, trade, oral memory, and multi-city importance.",
    evidence:
      "Met chronology, gold-trade essays, and UNESCO framing all place Musa inside a larger imperial structure.",
    whyItMatters: "Institutional memory matters more than celebrity memory.",
  },
  {
    title: "Timbuktu Was a Scholarly Network, Not a Punchline",
    commonlyTaught:
      "Timbuktu is remembered as either a joke meaning far away or a vague center of learning.",
    missingContext:
      "Its mosques, jurists, teachers, students, merchants, and family libraries formed a living manuscript city.",
    evidence:
      "UNESCO and Library of Congress materials document scholarship, trade, manuscripts, and surviving educational use.",
    whyItMatters: "It restores African intellectual life in concrete form.",
  },
  {
    title: "Book Trade Belonged to West African Commercial History",
    commonlyTaught: "Trade is often reduced to gold and salt alone.",
    missingContext:
      "Books, law manuals, astronomy texts, letters, contracts, and religious texts also moved through West African networks.",
    evidence:
      "Library of Congress materials show commercial, legal, astronomical, and pedagogical manuscripts preserved in Timbuktu collections.",
    whyItMatters:
      "It makes literacy and commerce part of the same history rather than separate worlds.",
  },
  {
    title: "Songhai Had Government, Not Just Conquest",
    commonlyTaught: "Songhai is often a short military epilogue after Mali.",
    missingContext:
      "Songhai linked Gao, provincial rule, taxation, Islamic legitimacy, river transport, and urban authority.",
    evidence:
      "UNESCO's Tomb of Askia and Met's Sahel materials connect rule, architecture, trade, and religion.",
    whyItMatters: "Readers need to see institutions, not only battles.",
  },
  {
    title: "West African Cities Were Real Urban Centers",
    commonlyTaught:
      "Precolonial West Africa is still pictured as mostly villages and caravans.",
    missingContext:
      "Koumbi Saleh, Gao, Timbuktu, and Djenné each show urban, commercial, or archaeological complexity on different timelines.",
    evidence:
      "Met and UNESCO sources document market centers, capitals, archaeological mounds, and major mosque complexes.",
    whyItMatters:
      "Urban history changes what readers think civilization looks like.",
  },
  {
    title: "African Agency Shaped Islam, Literacy, and Commerce",
    commonlyTaught:
      "Islam, writing, and long-distance trade are often narrated as things arriving from outside to passive Africans.",
    missingContext:
      "West African rulers, merchants, scholars, and communities adopted, adapted, negotiated, and transformed these connections for their own purposes.",
    evidence:
      "The record of state patronage, manuscript production, legal counsel, and pilgrimage diplomacy shows active selection rather than passive reception.",
    whyItMatters:
      "It restores West Africans as decision-makers inside connected worlds.",
  },
  {
    title: "Women Belonged Inside West African Economic History Too",
    commonlyTaught: "Women are often absent unless they were queens.",
    missingContext:
      "The evidence is uneven, but manuscripts, travel accounts, and broader African market histories show women inside household economy, legal status debates, and commercial life.",
    evidence:
      "Library of Congress manuscript materials preserve texts concerning the rights of women, inheritance, marriage, and female emancipation in West African scholarly contexts.",
    whyItMatters:
      "Even cautious inclusion is better than repeating a male-only economic story.",
  },
];
