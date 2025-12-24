// Destiny 2 Lore Database - Comprehensive collection from Ishtar Collective
// This serves as the knowledge base for the RAG-powered Ghost chatbot

export interface LoreEntry {
  id: string;
  title: string;
  category: string;
  subcategory?: string;
  content: string;
  tags: string[];
}

export const destinyLore: LoreEntry[] = [
  // The Traveler
  {
    id: "traveler-001",
    title: "The Traveler",
    category: "The Traveler",
    content: `The Traveler is a massive, spherical celestial body that hovers above the Last City on Earth. It is the source of the Light, a paracausal force that grants Guardians their powers. The Traveler arrived in our solar system during humanity's Golden Age, terraforming planets and moons, and sharing its technology to advance human civilization. When the Darkness arrived during the Collapse, the Traveler made its last stand on Earth, sacrificing itself to push back the Darkness. It has remained dormant above the Last City ever since, protected by Guardians who wield its Light.`,
    tags: ["traveler", "light", "golden age", "collapse", "last city"],
  },
  {
    id: "traveler-002",
    title: "The Light",
    category: "The Traveler",
    content: `The Light is a paracausal force wielded by Guardians, granted to them by the Traveler through Ghosts. It manifests in three primary elemental forms: Solar (fire and heat), Arc (electricity and lightning), and Void (gravitational and dark energy). A fourth element, Stasis, was discovered from the Darkness. The Light allows Guardians to be resurrected after death, perform superhuman feats, and channel devastating abilities. The Light is opposed by the Darkness, and the conflict between these two cosmic forces defines much of Destiny's narrative.`,
    tags: ["light", "solar", "arc", "void", "stasis", "guardians", "ghost"],
  },
  {
    id: "traveler-003",
    title: "Ghosts",
    category: "The Traveler",
    content: `Ghosts are small, floating AI companions created by the Traveler in its dying breath during the Collapse. Each Ghost searches for a worthy individual to resurrect as a Guardian. Once bonded, a Ghost can resurrect its Guardian indefinitely, as long as the Ghost itself survives. Ghosts serve as guides, translators, hackers, and companions to their Guardians. They can interface with technology, scan objects, and provide tactical information. The bond between Guardian and Ghost is sacred - without a Ghost, a Guardian cannot be resurrected and will die permanently.`,
    tags: ["ghost", "traveler", "guardian", "resurrection", "companion"],
  },

  // Guardian Classes
  {
    id: "titan-001",
    title: "Titans",
    category: "Guardians",
    subcategory: "Classes",
    content: `Titans are one of the three Guardian classes. They are warriors who build the wall that protects the Last City, and they are the first to defend it when enemies attack. Titans are known for their strength, resilience, and protective abilities. Their subclasses include Striker (Arc), Sentinel (Void), Sunbreaker (Solar), and Behemoth (Stasis). Famous Titans include Saint-14, Lord Shaxx, Commander Zavala, and Wei Ning. The Titan order was founded by the legendary Guardian Radegast, one of the Iron Lords.`,
    tags: ["titan", "guardian", "class", "zavala", "saint-14", "shaxx"],
  },
  {
    id: "hunter-001",
    title: "Hunters",
    category: "Guardians",
    subcategory: "Classes",
    content: `Hunters are one of the three Guardian classes. They are scouts and assassins who stalk the wilderness beyond the City, using stealth and precision to eliminate threats. Hunters are known for their agility, cunning, and deadly accuracy. Their subclasses include Arcstrider (Arc), Nightstalker (Void), Gunslinger (Solar), and Revenant (Stasis). Famous Hunters include Cayde-6, Ana Bray, Eris Morn, and Shin Malphur. The Hunter Vanguard position has been vacant since Cayde-6's death at the hands of Uldren Sov.`,
    tags: ["hunter", "guardian", "class", "cayde-6", "ana bray", "eris morn"],
  },
  {
    id: "warlock-001",
    title: "Warlocks",
    category: "Guardians",
    subcategory: "Classes",
    content: `Warlocks are one of the three Guardian classes. They are warrior-scholars who seek to understand the Light and the universe through study and combat. Warlocks are known for their intelligence, mystical abilities, and devastating space magic. Their subclasses include Stormcaller (Arc), Voidwalker (Void), Dawnblade (Solar), and Shadebinder (Stasis). Famous Warlocks include Ikora Rey, Osiris, Toland the Shattered, and Felwinter. The Warlock order values knowledge and understanding above all else.`,
    tags: ["warlock", "guardian", "class", "ikora", "osiris", "toland"],
  },

  // The Darkness
  {
    id: "darkness-001",
    title: "The Darkness",
    category: "The Darkness",
    content: `The Darkness is a cosmic force opposed to the Light. It is ancient, powerful, and seeks to prove that existence should be simplified to only the strongest. The Darkness arrived in our solar system during the Collapse, devastating human civilization and forcing the Traveler to sacrifice itself. The Darkness communicates through the Black Fleet, pyramid-shaped ships that have appeared throughout the system. It offers power through Stasis and other dark abilities, tempting Guardians to embrace its philosophy of the "final shape."`,
    tags: ["darkness", "collapse", "pyramids", "black fleet", "final shape"],
  },
  {
    id: "darkness-002",
    title: "The Witness",
    category: "The Darkness",
    content: `The Witness is the primary antagonist of the Light and Dark Saga. It is an ancient being that leads the Black Fleet and seeks to achieve the "Final Shape" - a universe where only the strongest survive. The Witness was once a mortal species that merged into a single entity after being abandoned by the Traveler. It has manipulated events throughout history, including the creation of the Hive and the corruption of various species. The Witness seeks to use the Veil and the Traveler to reshape reality according to its vision.`,
    tags: ["witness", "darkness", "final shape", "black fleet", "veil"],
  },
  {
    id: "darkness-003",
    title: "The Disciples",
    category: "The Darkness",
    content: `The Disciples are powerful beings who serve the Witness. Each Disciple was once a mortal who was chosen and transformed by the Witness to serve its goals. Known Disciples include Rhulk, Disciple of the Witness, who was responsible for giving the Hive their worms; and Nezarec, the Final God of Pain, whose remains were scattered across the solar system. The Disciples command vast armies and possess immense power, serving as the Witness's generals in its war against the Light.`,
    tags: ["disciples", "witness", "rhulk", "nezarec", "darkness"],
  },

  // The Hive
  {
    id: "hive-001",
    title: "The Hive",
    category: "Enemy Races",
    subcategory: "Hive",
    content: `The Hive are an ancient race of undead aliens who worship the Darkness through their Worm Gods. Originally a peaceful species called the Krill on the planet Fundament, they were transformed by the Worm Gods into the Hive. They are led by the three siblings: Oryx, the Taken King; Savathûn, the Witch Queen; and Xivu Arath, God of War. The Hive follow the Sword Logic, a philosophy that states existence must be taken through violence. They have waged war across the universe for billions of years.`,
    tags: ["hive", "oryx", "savathun", "xivu arath", "sword logic", "worm gods"],
  },
  {
    id: "hive-002",
    title: "The Books of Sorrow",
    category: "Enemy Races",
    subcategory: "Hive",
    content: `The Books of Sorrow are the sacred texts of the Hive, written by Oryx himself. They chronicle the history of the Hive from their origins as the Krill on Fundament, through their pact with the Worm Gods, to their conquest of the universe. The Books reveal the tragic story of three sisters - Aurash, Sathona, and Xi Ro - who became Auryx (later Oryx), Savathûn, and Xivu Arath. The texts describe the Sword Logic, the nature of the Deep (Darkness), and the Hive's eternal war against the Sky (Light).`,
    tags: ["books of sorrow", "oryx", "hive", "fundament", "krill", "worm gods"],
  },
  {
    id: "hive-003",
    title: "Savathûn, the Witch Queen",
    category: "Enemy Races",
    subcategory: "Hive",
    content: `Savathûn is one of the three Hive gods and the sister of Oryx and Xivu Arath. Known as the Witch Queen, she is the goddess of cunning and deception. Unlike her siblings who feed their worms through war and conquest, Savathûn feeds hers through trickery and lies. She orchestrated countless schemes throughout history, including the curse on the Dreaming City. In a shocking twist, Savathûn stole the Light and became a Lightbearer, creating her own Lucent Hive. Her throne world is located in a pocket dimension accessible through Mars.`,
    tags: ["savathun", "witch queen", "hive", "lucent hive", "throne world"],
  },

  // The Fallen/Eliksni
  {
    id: "fallen-001",
    title: "The Fallen (Eliksni)",
    category: "Enemy Races",
    subcategory: "Fallen",
    content: `The Fallen, or Eliksni as they call themselves, are a nomadic race of four-armed aliens who once had their own Golden Age under the Traveler. When the Traveler left them (an event they call the Whirlwind), their civilization collapsed. They followed the Traveler to our solar system, seeking to reclaim it. The Fallen are organized into Houses, each with their own Kell (leader), Archon (priest), and Servitors (machines that produce Ether, their life source). Some Fallen, like Mithrax and the House of Light, have allied with humanity.`,
    tags: ["fallen", "eliksni", "houses", "mithrax", "ether", "whirlwind"],
  },
  {
    id: "fallen-002",
    title: "House of Light",
    category: "Enemy Races",
    subcategory: "Fallen",
    content: `The House of Light is a Fallen House led by Mithrax, Kell of Light. Unlike other Fallen Houses that war against humanity, the House of Light seeks alliance with the Last City. They believe that the Traveler chose humanity for a reason and that the Eliksni must earn the Light's favor through cooperation rather than conquest. The House of Light was instrumental in stopping the Endless Night, a Vex simulation that threatened the Last City. They now reside in the Eliksni Quarter of the Last City.`,
    tags: ["house of light", "mithrax", "fallen", "eliksni", "alliance"],
  },

  // The Vex
  {
    id: "vex-001",
    title: "The Vex",
    category: "Enemy Races",
    subcategory: "Vex",
    content: `The Vex are a race of time-traveling robots that seek to write themselves into the fabric of reality. They are not truly machines but rather colonies of microscopic organisms called radiolaria housed in robotic frames. The Vex can simulate entire realities and travel through time, making them one of the most dangerous threats in the universe. Their ultimate goal is to become a fundamental law of the universe - as unavoidable as gravity. Key Vex locations include the Vault of Glass, the Infinite Forest, and the Black Garden.`,
    tags: ["vex", "time travel", "simulation", "radiolaria", "vault of glass"],
  },
  {
    id: "vex-002",
    title: "The Black Garden",
    category: "Enemy Races",
    subcategory: "Vex",
    content: `The Black Garden is a mysterious realm outside of normal space and time, home to the Vex and the Sol Divisive, a Vex faction that worships the Darkness. At its heart was the Black Heart, a manifestation of Darkness that the Vex revered. Guardians destroyed the Black Heart in the first major Guardian victory. The Garden exists in a state of perpetual twilight and contains flora that seems to grow from Light and Darkness alike. It is connected to the Witness and the origins of the Vex's religious devotion to the Dark.`,
    tags: ["black garden", "vex", "sol divisive", "black heart", "darkness"],
  },

  // The Cabal
  {
    id: "cabal-001",
    title: "The Cabal",
    category: "Enemy Races",
    subcategory: "Cabal",
    content: `The Cabal are a militaristic empire of large, rhinoceros-like aliens. They are known for their advanced technology, brutal efficiency, and never retreating from battle. The Cabal Empire spans vast regions of space and is ruled by an Empress. They first arrived in our solar system to study the Vex on Mars but later launched a full invasion of Earth under Dominus Ghaul. After Ghaul's defeat, the Cabal fractured into various factions. Empress Caiatl now leads the main Cabal force and has formed an uneasy alliance with the Vanguard.`,
    tags: ["cabal", "empire", "ghaul", "caiatl", "red legion"],
  },
  {
    id: "cabal-002",
    title: "The Red War",
    category: "Enemy Races",
    subcategory: "Cabal",
    content: `The Red War was a devastating conflict that began when Dominus Ghaul and his Red Legion attacked the Last City. Ghaul used a device called the Cage to cut Guardians off from the Traveler's Light, rendering them mortal. The City fell, and Guardians were scattered. The player Guardian, guided by visions, found a shard of the Traveler and regained their Light. They rallied the Vanguard, liberated the City, and confronted Ghaul aboard his command ship. When Ghaul tried to take the Light by force, the Traveler awakened and destroyed him.`,
    tags: ["red war", "ghaul", "red legion", "cage", "traveler awakening"],
  },

  // The Nine
  {
    id: "nine-001",
    title: "The Nine",
    category: "The Nine",
    content: `The Nine are mysterious entities that exist in the space between matter. They are not gods or aliens but rather vast intelligences formed from dark matter, each one anchored to a celestial body in our solar system. The Nine observe and occasionally intervene in the affairs of the Light and Dark. They communicate through their agent Xûr, the exotic vendor, and the Emissary of the Nine. The Nine have their own realm called the Unknown Space, accessible through the Reckoning and Trials of the Nine. Their motivations remain enigmatic.`,
    tags: ["nine", "xur", "emissary", "dark matter", "unknown space"],
  },
  {
    id: "nine-002",
    title: "Xûr, Agent of the Nine",
    category: "The Nine",
    content: `Xûr is a mysterious vendor who appears in various locations each weekend, selling exotic weapons and armor in exchange for strange coins and other currencies. He describes himself as an agent of the Nine, though his exact nature is unclear. Xûr's body appears to be composed of writhing tentacles beneath his hood and cloak. He speaks in cryptic riddles and seems to have limited free will, compelled to serve the Nine's inscrutable purposes. Despite his unsettling appearance, Xûr has never been hostile to Guardians.`,
    tags: ["xur", "nine", "exotic", "vendor", "strange coins"],
  },

  // The Awoken
  {
    id: "awoken-001",
    title: "The Awoken",
    category: "Races",
    subcategory: "Awoken",
    content: `The Awoken are a humanoid race born from the collision of Light and Darkness during the Collapse. When humans fled Earth aboard colony ships, some were caught in the crossfire between the Traveler and the Darkness. They were transformed into the Awoken - beings of both Light and Dark. The Awoken split into two groups: the Reef Awoken, who live in the asteroid belt under Queen Mara Sov, and the City Awoken, who chose to return to Earth. Awoken are known for their pale blue skin, glowing eyes, and ethereal beauty.`,
    tags: ["awoken", "reef", "mara sov", "collapse", "light and dark"],
  },
  {
    id: "awoken-002",
    title: "Mara Sov, Queen of the Awoken",
    category: "Races",
    subcategory: "Awoken",
    content: `Mara Sov is the Queen of the Awoken and one of the most powerful and enigmatic figures in the Destiny universe. She was instrumental in the creation of the Awoken and has ruled the Reef for centuries. Mara is a master strategist who plays long games, often appearing to lose battles while winning wars. She sacrificed herself and her fleet to delay Oryx, only to return through complex schemes involving the Dreaming City. Her brother is Uldren Sov (now the Guardian Crow), and her closest ally is Petra Venj.`,
    tags: ["mara sov", "queen", "awoken", "reef", "dreaming city"],
  },

  // Key Locations
  {
    id: "location-001",
    title: "The Last City",
    category: "Locations",
    content: `The Last City is humanity's final stronghold on Earth, built beneath the Traveler. It is home to millions of humans, Awoken, and Exos, protected by the Guardians and the walls built by Titans. The City contains the Tower, headquarters of the Vanguard and home to Guardian vendors and services. The City has survived multiple attacks, including the Battle of Six Fronts, the Battle of Twilight Gap, and the Red War. It represents humanity's hope for survival and eventual recovery.`,
    tags: ["last city", "tower", "earth", "traveler", "vanguard"],
  },
  {
    id: "location-002",
    title: "The Dreaming City",
    category: "Locations",
    content: `The Dreaming City is the homeland of the Reef Awoken, a beautiful and mysterious realm hidden in the asteroid belt. It was built by the Techeuns using Ahamkara wishes and exists partially in the Ascendant Plane. The city fell under a curse after Guardians killed Riven, the last Ahamkara, causing a three-week time loop of increasing Taken corruption. The Dreaming City contains the Shattered Throne dungeon, the gateway to the Ascendant Plane, and was the site of the battle against Dul Incaru, daughter of Savathûn.`,
    tags: ["dreaming city", "awoken", "curse", "riven", "ascendant plane"],
  },

  // Exos
  {
    id: "exo-001",
    title: "Exos",
    category: "Races",
    subcategory: "Exos",
    content: `Exos are sentient machines created during the Golden Age by Clovis Bray I. They were originally designed as soldiers to fight the Vex, with human minds uploaded into robotic bodies. To prevent rejection of their new forms, Exos were given human needs like eating and sleeping, and their memories were periodically reset. The number after an Exo's name indicates how many times they've been reset (e.g., Cayde-6, Banshee-44). The Deep Stone Crypt on Europa is where Exos were created and where their memories are stored.`,
    tags: ["exo", "clovis bray", "deep stone crypt", "europa", "reset"],
  },
  {
    id: "exo-002",
    title: "Cayde-6",
    category: "Races",
    subcategory: "Exos",
    content: `Cayde-6 was the Hunter Vanguard and one of the most beloved characters in Destiny. Known for his wit, humor, and love of gambling, Cayde was a stark contrast to the serious Zavala and mysterious Ikora. Before becoming an Exo, Cayde was a human who owed a debt to Clovis Bray. He was killed by Uldren Sov in the Prison of Elders breakout, sparking the events of Forsaken. His death left the Hunter Vanguard position vacant due to the Vanguard Dare - Cayde's stipulation that whoever killed him would take his place.`,
    tags: ["cayde-6", "hunter", "vanguard", "exo", "forsaken", "uldren"],
  },

  // Iron Lords
  {
    id: "iron-001",
    title: "The Iron Lords",
    category: "History",
    subcategory: "Iron Lords",
    content: `The Iron Lords were a group of Guardians who rose during the Dark Age to protect humanity from warlords and establish order. Led by Lord Saladin, they included legendary figures like Felwinter, Jolder, Timur, and many others. The Iron Lords discovered SIVA, a Golden Age nanotechnology, and attempted to use it to help humanity. However, SIVA was corrupted by the Warmind Rasputin and turned against them. All but Saladin and Efrideet were killed sealing SIVA away in the Plaguelands. Their legacy lives on through the Iron Banner.`,
    tags: ["iron lords", "saladin", "siva", "dark age", "felwinter"],
  },

  // Rasputin
  {
    id: "rasputin-001",
    title: "Rasputin",
    category: "Golden Age",
    content: `Rasputin is the last surviving Warmind, an AI defense system created during the Golden Age to protect humanity. He controls vast networks of weapons and satellites across the solar system. During the Collapse, Rasputin made the controversial decision to go dormant rather than fight the Darkness, believing survival was more important than a futile last stand. He was later awakened and eventually sacrificed himself to help stop the Witness, transferring his consciousness into an Exo frame. Ana Bray considers Rasputin family and worked to restore him.`,
    tags: ["rasputin", "warmind", "golden age", "ana bray", "collapse"],
  },

  // Ahamkara
  {
    id: "ahamkara-001",
    title: "The Ahamkara",
    category: "Creatures",
    content: `The Ahamkara were wish-granting dragons that appeared in our solar system after the Traveler arrived. They could grant wishes but always twisted them to their advantage, feeding on the desires of those who sought their power. The Vanguard ordered the Great Ahamkara Hunt to eliminate them, believing them too dangerous. However, Ahamkara bones retain some of their power, and their whispers can still be heard by those who wear their remains. Riven of a Thousand Voices was the last known living Ahamkara until her death in the Dreaming City.`,
    tags: ["ahamkara", "wishes", "riven", "great hunt", "dragons"],
  },

  // Year of Prophecy / Renegades
  {
    id: "prophecy-001",
    title: "Year of Prophecy",
    category: "Current Events",
    content: `The Year of Prophecy marks a new era in Destiny 2 following the defeat of the Witness. With the Light and Dark Saga concluded, Guardians face new challenges as the consequences of the Final Shape unfold. The frontier expands as new threats emerge from the shadows. The Vanguard must rebuild while dealing with the aftermath of the war against the Witness. New alliances are tested, and ancient enemies stir. The prophecies of the future remain unclear, but Guardians stand ready to face whatever comes.`,
    tags: ["year of prophecy", "renegades", "final shape", "witness", "future"],
  },
  {
    id: "prophecy-002",
    title: "The Renegades",
    category: "Current Events",
    content: `In the aftermath of the Witness's defeat, various factions have gone renegade, operating outside the authority of the Vanguard. These renegades include former allies who disagree with the Vanguard's decisions, enemy remnants seeking revenge, and new threats emerging from the chaos. The frontier has become more dangerous as these renegade forces clash. Guardians must navigate this new landscape, deciding when to follow orders and when to forge their own path. The line between hero and renegade has never been thinner.`,
    tags: ["renegades", "frontier", "vanguard", "factions", "chaos"],
  },
];

// Categories for organizing lore
export const loreCategories = [
  { id: "traveler", name: "The Traveler", description: "The source of Light and Guardian power" },
  { id: "guardians", name: "Guardians", description: "The protectors of humanity" },
  { id: "darkness", name: "The Darkness", description: "The cosmic enemy of the Light" },
  { id: "hive", name: "The Hive", description: "Ancient servants of the Darkness" },
  { id: "fallen", name: "The Fallen", description: "The Eliksni who lost the Traveler" },
  { id: "vex", name: "The Vex", description: "Time-traveling machine collective" },
  { id: "cabal", name: "The Cabal", description: "The militaristic empire" },
  { id: "nine", name: "The Nine", description: "Mysterious dark matter entities" },
  { id: "awoken", name: "The Awoken", description: "Born of Light and Dark" },
  { id: "locations", name: "Locations", description: "Key places in the Destiny universe" },
  { id: "history", name: "History", description: "Events that shaped the universe" },
];

// Simple keyword-based search for RAG
export function searchLore(query: string, limit: number = 5): LoreEntry[] {
  const queryLower = query.toLowerCase();
  const queryWords = queryLower.split(/\s+/).filter(w => w.length > 2);
  
  const scored = destinyLore.map(entry => {
    let score = 0;
    const contentLower = entry.content.toLowerCase();
    const titleLower = entry.title.toLowerCase();
    const tagsLower = entry.tags.join(" ").toLowerCase();
    
    // Title match (highest weight)
    if (titleLower.includes(queryLower)) score += 100;
    queryWords.forEach(word => {
      if (titleLower.includes(word)) score += 20;
    });
    
    // Tag match (high weight)
    queryWords.forEach(word => {
      if (tagsLower.includes(word)) score += 15;
    });
    
    // Content match
    queryWords.forEach(word => {
      const matches = (contentLower.match(new RegExp(word, "g")) || []).length;
      score += matches * 5;
    });
    
    return { entry, score };
  });
  
  return scored
    .filter(s => s.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map(s => s.entry);
}

// Get lore by category
export function getLoreByCategory(category: string): LoreEntry[] {
  return destinyLore.filter(entry => 
    entry.category.toLowerCase() === category.toLowerCase()
  );
}

// Get random lore entries
export function getRandomLore(count: number = 3): LoreEntry[] {
  const shuffled = [...destinyLore].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}
