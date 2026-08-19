export interface DialogNode {
  id: string;
  npcName: string;
  text: string;
  nextId?: string; // If undefined, the dialog ends
  setFlag?: string; // Flag to set to true when node is completed/skipped
  conditionFlag?: string; // Condition to check before playing this node
  altNextId?: string; // Jump to this ID immediately if conditionFlag is true
}

export const dialogData: Record<string, DialogNode> = {
  // --- WIZARD (Personal Profile) ---
  wizard_intro_1: {
    id: 'wizard_intro_1',
    npcName: 'Wizard of Origins',
    conditionFlag: 'learned_profile',
    altNextId: 'wizard_return',
    text: "Greetings, traveler! Welcome to the realm of Prasad Anil Kankhar.",
    nextId: 'wizard_intro_2'
  },
  wizard_intro_2: {
    id: 'wizard_intro_2',
    npcName: 'Wizard of Origins',
    text: "He is a creator originating from Buldhana, Maharashtra, building a brand that blends technology, creativity, emotional storytelling, and personal growth.",
    nextId: 'wizard_intro_3'
  },
  wizard_intro_3: {
    id: 'wizard_intro_3',
    npcName: 'Wizard of Origins',
    text: "A disciplined soul, strict vegetarian, and practitioner of artistic handwriting. Seek out the others across this island to learn of his achievements!",
    setFlag: 'learned_profile'
  },
  wizard_return: {
    id: 'wizard_return',
    npcName: 'Wizard of Origins',
    text: "You already know of his origins. Check your Map Journal to review his profile, or seek the other inhabitants!"
  },

  // --- GOLDEN KNIGHTS (Academics & Leadership) ---
  knight_academics_1: {
    id: 'knight_academics_1',
    npcName: 'Knight of Academia',
    conditionFlag: 'learned_academics',
    altNextId: 'knight_return',
    text: "Halt! Do you seek knowledge of Prasad's training? He pursues a B.Tech in Computer Science at MIT, Chhatrapati Sambhajinagar.",
    nextId: 'knight_academics_2'
  },
  knight_academics_2: {
    id: 'knight_academics_2',
    npcName: 'Knight of Academia',
    text: "A natural leader, he serves as the Technical Coordinator for ACTS and the Campus Mantri for GeeksforGeeks.",
    nextId: 'knight_academics_3'
  },
  knight_academics_3: {
    id: 'knight_academics_3',
    npcName: 'Knight of Academia',
    text: "He even bears the prestigious title of Google Student Ambassador! A mighty warrior of the mind, indeed.",
    setFlag: 'learned_academics'
  },
  knight_return: {
    id: 'knight_return',
    npcName: 'Knight of Academia',
    text: "His academic record is secured in your Map Journal. Stand guard, traveler!"
  },

  // --- ELF (Technical Expertise) ---
  elf_tech_1: {
    id: 'elf_tech_1',
    npcName: 'Elf of Engineering',
    conditionFlag: 'learned_tech',
    altNextId: 'elf_return',
    text: "Ah, looking for the tools of the trade? Prasad is a master of the ancient languages: C++, JavaScript, React, Node.js, and Firebase.",
    nextId: 'elf_tech_2'
  },
  elf_tech_2: {
    id: 'elf_tech_2',
    npcName: 'Elf of Engineering',
    text: "He builds virtual worlds in Unreal Engine and is currently expanding his magic into Unity and C#.",
    nextId: 'elf_tech_3'
  },
  elf_tech_3: {
    id: 'elf_tech_3',
    npcName: 'Elf of Engineering',
    text: "He prefers highly concise, direct communication—especially when receiving technical feedback on logic and architecture. Keep it sharp!",
    setFlag: 'learned_tech'
  },
  elf_return: {
    id: 'elf_return',
    npcName: 'Elf of Engineering',
    text: "You carry the knowledge of his Tech Stack in your Map Journal. Keep exploring!"
  },

  // --- PIRATES (Web & Software Engineering) ---
  pirate_web_1: {
    id: 'pirate_web_1',
    npcName: 'Captain of the Web',
    conditionFlag: 'learned_web',
    altNextId: 'pirate_return',
    text: "Ahoy matey! Let me tell ye about the grand ships Prasad has launched into the digital sea! First, there was 'Nishtha'—an open-source habit-tracking platform.",
    nextId: 'pirate_web_2'
  },
  pirate_web_2: {
    id: 'pirate_web_2',
    npcName: 'Captain of the Web',
    text: "Then came 'Sadhana', a massive discipline platform with advanced gamification. A true treasure of personal growth!",
    nextId: 'pirate_web_3'
  },
  pirate_web_3: {
    id: 'pirate_web_3',
    npcName: 'Captain of the Web',
    text: "He also built 'Vyuham', a gorgeous Chrome dashboard, and 'TraceMate Pro', an AR tracing PWA. The boy's a legendary shipwright!",
    setFlag: 'learned_web'
  },
  pirate_return: {
    id: 'pirate_return',
    npcName: 'Captain of the Web',
    text: "Ye already have his Web Projects in yer Map Journal! Now off with ye!"
  },

  // --- CLERIC (AI & ML Projects) ---
  cleric_ai_1: {
    id: 'cleric_ai_1',
    npcName: 'Cleric of Artificial Intelligence',
    conditionFlag: 'learned_ai',
    altNextId: 'cleric_return',
    text: "Blessings upon you. Have you heard of Prasad's miracles in Artificial Intelligence?",
    nextId: 'cleric_ai_2'
  },
  cleric_ai_2: {
    id: 'cleric_ai_2',
    npcName: 'Cleric of Artificial Intelligence',
    text: "He engineered a Professional Assessment Platform using NLP to evaluate scenario-driven answers, and conducts research on Advanced Multi-Concept Memory Models.",
    nextId: 'cleric_ai_3'
  },
  cleric_ai_3: {
    id: 'cleric_ai_3',
    npcName: 'Cleric of Artificial Intelligence',
    text: "He even summoned 'Butler AI', a self-coding multi-agent assistant, and 'Akṣayanidhi', a local-first AI photo archive. True divine creation!",
    setFlag: 'learned_ai'
  },
  cleric_return: {
    id: 'cleric_return',
    npcName: 'Cleric of Artificial Intelligence',
    text: "The records of his AI miracles are safely stored in your Map Journal."
  },

  // --- GOBLINS (Game Development) ---
  goblin_game_1: {
    id: 'goblin_game_1',
    npcName: 'Goblin Tinkerer',
    conditionFlag: 'learned_games',
    altNextId: 'goblin_return',
    text: "Hehe! You like games? Prasad makes games! Very fun games!",
    nextId: 'goblin_game_2'
  },
  goblin_game_2: {
    id: 'goblin_game_2',
    npcName: 'Goblin Tinkerer',
    text: "He built 'On the Way', a joyful delivery-themed mobile game. Perfect for humans ages 12 to 30! You should play it, hehe!",
    setFlag: 'learned_games'
  },
  goblin_return: {
    id: 'goblin_return',
    npcName: 'Goblin Tinkerer',
    text: "You wrote down his games in your Map Journal! Now go play them!"
  },

  // --- COWBOYS (Events & Community) ---
  cowboy_events_1: {
    id: 'cowboy_events_1',
    npcName: 'Community Sheriff',
    conditionFlag: 'learned_events',
    altNextId: 'cowboy_return',
    text: "Howdy partner. Prasad ain't just a coder; he's a community builder. Roundin' folks up is his specialty.",
    nextId: 'cowboy_events_2'
  },
  cowboy_events_2: {
    id: 'cowboy_events_2',
    npcName: 'Community Sheriff',
    text: "He organized an AI & ML Career Guidance Session for over 220 students. Showed 'em the ropes for placements and internships.",
    nextId: 'cowboy_events_3'
  },
  cowboy_events_3: {
    id: 'cowboy_events_3',
    npcName: 'Community Sheriff',
    text: "He even orchestrated a massive 'Among Us IRL' physical game event for a campus festival. Yeehaw!",
    setFlag: 'learned_events'
  },
  cowboy_return: {
    id: 'cowboy_return',
    npcName: 'Community Sheriff',
    text: "His community deeds are in your Map Journal. Keep on riding!"
  },

  // --- WITCH (Creative Expression & Philosophy) ---
  witch_creative_1: {
    id: 'witch_creative_1',
    npcName: 'Witch of the Arts',
    conditionFlag: 'learned_creative',
    altNextId: 'witch_return',
    text: "Do you feel the emotional depth in the air? Prasad is not just logic... he is art.",
    nextId: 'witch_creative_2'
  },
  witch_creative_2: {
    id: 'witch_creative_2',
    npcName: 'Witch of the Arts',
    text: "He writes original, authentic Shayari in Roman Hindi and Devanagari. No copied spells here—only pure, purpose-driven storytelling.",
    nextId: 'witch_creative_3'
  },
  witch_creative_3: {
    id: 'witch_creative_3',
    npcName: 'Witch of the Arts',
    text: "A rare blend of technical ambition, creative thinking, and emotional intelligence. He builds systems that connect with people both logically and emotionally.",
    setFlag: 'learned_creative'
  },
  witch_return: {
    id: 'witch_return',
    npcName: 'Witch of the Arts',
    text: "The essence of his creativity is sealed within your Map Journal. Open it and reflect."
  },

  // --- WELL (Map Center) ---
  well_interaction: {
    id: 'well_interaction',
    npcName: 'Ancient Well',
    text: "You are in the Center of the map",
  },

  // --- WORLD GUIDES (Summoned) ---
  world_guide_1: {
    id: 'world_guide_1',
    npcName: 'World Guide',
    conditionFlag: 'met_guide',
    altNextId: 'world_guide_return_1',
    text: "Welcome to Prasad's World! I came as quickly as I could.",
    nextId: 'world_guide_2'
  },
  world_guide_2: {
    id: 'world_guide_2',
    npcName: 'World Guide',
    text: "This island is a living representation of Prasad's skills, achievements, and journey as a software developer and creator.",
    nextId: 'world_guide_3'
  },
  world_guide_3: {
    id: 'world_guide_3',
    npcName: 'World Guide',
    text: "Feel free to explore! You can find other characters scattered around who can tell you more. Let me know if you need anything!",
    setFlag: 'met_guide'
  },
  world_guide_return_1: {
    id: 'world_guide_return_1',
    npcName: 'World Guide',
    text: "Hey again! Still exploring the map?",
    nextId: 'world_guide_return_2'
  },
  world_guide_return_2: {
    id: 'world_guide_return_2',
    npcName: 'World Guide',
    text: "Remember, just press E near the well if you ever want me to run back over here!",
  },
  
  // --- MARKETPLACE NPCs ---
  blacksmith_talk_1: {
    id: 'blacksmith_talk_1',
    npcName: 'Viking Blacksmith',
    text: "Welcome to the forge! Need some armor or weapons?",
    nextId: 'blacksmith_talk_2'
  },
  blacksmith_talk_2: {
    id: 'blacksmith_talk_2',
    npcName: 'Viking Blacksmith',
    text: "While you're looking around, let me tell you about Prasad's technical stack.",
    nextId: 'blacksmith_talk_3'
  },
  blacksmith_talk_3: {
    id: 'blacksmith_talk_3',
    npcName: 'Viking Blacksmith',
    text: "He forged his skills in C++, JavaScript, React, Node.js, and Firebase. A sturdy foundation!"
  },

  cowboy_shop_1: {
    id: 'cowboy_shop_1',
    npcName: 'Market Organizer',
    text: "Howdy. Just checking the inventory and keeping the peace.",
    nextId: 'cowboy_shop_2'
  },
  cowboy_shop_2: {
    id: 'cowboy_shop_2',
    npcName: 'Market Organizer',
    text: "Speaking of organizing, Prasad is an expert in Community and Event Organization.",
    nextId: 'cowboy_shop_3'
  },
  cowboy_shop_3: {
    id: 'cowboy_shop_3',
    npcName: 'Market Organizer',
    text: "He even ran an AI & ML Career Guidance Session for over 220 students. Quite the sheriff!"
  },

  casual_shop_1: {
    id: 'casual_shop_1',
    npcName: 'Shield Vendor',
    text: "Finest shields in the land right here!",
    nextId: 'casual_shop_2'
  },
  casual_shop_2: {
    id: 'casual_shop_2',
    npcName: 'Shield Vendor',
    text: "They are as sturdy and reliable as Prasad's backend architecture.",
    nextId: 'casual_shop_3'
  },
  casual_shop_3: {
    id: 'casual_shop_3',
    npcName: 'Shield Vendor',
    text: "He built robust systems for Nishtha and Sadhana. Now that's solid defense!"
  },

  witch_shop_1: {
    id: 'witch_shop_1',
    npcName: 'Potions & Produce',
    text: "Fresh fruit and fine pottery! Crafted with care.",
    nextId: 'witch_shop_2'
  },
  witch_shop_2: {
    id: 'witch_shop_2',
    npcName: 'Potions & Produce',
    text: "Much like Prasad's UI/UX designs. He has a keen eye for Creative Expression.",
    nextId: 'witch_shop_3'
  },
  witch_shop_3: {
    id: 'witch_shop_3',
    npcName: 'Potions & Produce',
    text: "He builds systems that connect with people both logically and emotionally."
  },

  goblin_fruit_1: {
    id: 'goblin_fruit_1',
    npcName: 'Fruit Merchant',
    text: "Hehe! Juicy fruits for sale!",
    nextId: 'goblin_fruit_2'
  },
  goblin_fruit_2: {
    id: 'goblin_fruit_2',
    npcName: 'Fruit Merchant',
    text: "Prasad made a game once about delivery called 'On the Way'.",
    nextId: 'goblin_fruit_3'
  },
  goblin_fruit_3: {
    id: 'goblin_fruit_3',
    npcName: 'Fruit Merchant',
    text: "Maybe I can use his game to deliver these fruits, hehe!"
  }
};
