export const CONFIG = {
    SCREEN_WIDTH: 1920,
    SCREEN_HEIGHT: 1080,
    SAFE_MARGIN: 0.05,
    PLAYER: {
        BASE_PROJECTILE_SPEED: 0.8,
        BASE_MAGIC_COOLDOWN: 250, // ms
        PROJECTILE_COUNT: 1, // Start with single projectile
        SPREAD_ANGLE: Math.PI / 6, // 30 degree spread
        SPECIAL_COOLDOWN: 5000, // ms
        SPECIAL_RADIUS: 10,
    },
    SKILLS: [
        { id: 'magicDamage', name: 'Magic Damage', desc: 'Increases fireball potency and size.' },
        { id: 'projectileCount', name: 'Split Shot', desc: 'Fire additional magical projectiles.' },
        { id: 'attackSpeed', name: 'Rapid Fire', desc: 'Increases magic attack speed.' },
        { id: 'moveSpeed', name: 'Movement Speed', desc: 'Run faster through groves.' },
        { id: 'healthRegen', name: 'Health Regen', desc: 'Restores HP over time.' },
        { id: 'critStrike', name: 'Critical Strike', desc: 'Chance for 2x magic damage.' },
        { id: 'fireTrail', name: 'Fire Trail', desc: 'Projectiles leave a damaging trail of green embers.', isAbility: true },
        { id: 'royalSpore', name: 'Clan Special', desc: 'Unlock your Clan\'s unique Special Ability (Key: Q).', isAbility: true },
        { id: 'fungalShield', name: 'Fungal Shield', desc: 'A rotating spore that blocks projectiles.', isAbility: true },
        { id: 'mycelialNet', name: 'Mycelial Net', desc: 'Trap skill (Key: R) that slows enemies in a target area.', isAbility: true }
    ],
    COLORS: {
        BACKGROUND: 0x050510,
        TEXT: '#ffffff',
        ACCENT: '#00ffff',
        UI_PANEL: 0x000088, // Classic SNES blue menu
        UI_STROKE: 0xffffff
    },
    CLANS: [
        { id: 'myco', name: 'Myco', color: 0xff0000, desc: 'Balance of power and spirit.', avatar: 'assets/myco-avatar.webp' },
        { id: 'tegbot', name: 'Tegbot', color: 0x00ffff, desc: 'Techno-fungal speed.', avatar: 'assets/tegbot-avatar.webp' },
        { id: 'brood', name: 'Brood Dragon', color: 0xffaa00, desc: 'Ancient fire mushroom power.', avatar: 'assets/brood-avatar.webp' },
        { id: 'mycelius', name: 'Dark Mycelius', color: 0xaa00ff, desc: 'Harness the Rot itself.', avatar: 'assets/mycelius-avatar.webp' },
        { id: 'rougarou', name: 'Rougarou', color: 0x555555, desc: 'Beast-like fungal strength.', avatar: 'assets/rougarou-avatar.webp' },
        { id: 'shiba', name: 'Shiba Infinity', color: 0xffff00, desc: 'Fortune and robotic doge-spore magic.', avatar: 'assets/shiba-avatar.webp' }
    ],
    UPGRADES: [
        {
            id: 'staffPower',
            name: 'Staff Power',
            icon: 'STAFF',
            maxLevel: 5,
            baseCost: 4,
            costStep: 3,
            desc: '+3 staff attack damage per level.'
        },
        {
            id: 'greenFlame',
            name: 'Green Flame',
            icon: 'MAGIC',
            maxLevel: 5,
            baseCost: 6,
            costStep: 4,
            desc: '+4 magic damage per level.'
        },
        {
            id: 'mycoVitality',
            name: 'Myco Vitality',
            icon: 'HP',
            maxLevel: 4,
            baseCost: 5,
            costStep: 4,
            desc: '+15 max HP per level.'
        },
        {
            id: 'sporeWard',
            name: 'Spore Ward',
            icon: 'WARD',
            maxLevel: 4,
            baseCost: 7,
            costStep: 5,
            desc: '-2 incoming rot damage per level.'
        }
    ],
    SUPPLIES: [
        { id: 'capPotion', name: 'Cap Potion', costBlue: 4, costGold: 0, desc: 'Restores courage. +1 potion in inventory.' },
        { id: 'rotSalve', name: 'Rot Salve', costBlue: 6, costGold: 1, desc: 'Reduces corruption. Improves warding.' },
        { id: 'sporeBomb', name: 'Spore Bomb', costBlue: 8, costGold: 2, desc: 'A battle item for future boss phases.' }
    ],
    DECORATIONS: [
        { id: 'throne', name: 'Fungal Throne', costBlue: 20, costGold: 2, desc: 'A regal seat for a Myco monarch.' },
        { id: 'shelf', name: 'Spore Shelf', costBlue: 10, costGold: 0, desc: 'Storage for your ancient scrolls.' },
        { id: 'banner', name: 'Clan Banner', costBlue: 15, costGold: 1, desc: 'Display your clan colors with pride.' },
        { id: 'crystal_lamp', name: 'Crystal Lamp', costBlue: 25, costGold: 2, desc: 'Glows with the light of Shardcap.' },
        { id: 'spore_bed', name: 'Royal Spore Bed', costBlue: 30, costGold: 3, desc: 'Restores health and magic power.' },
        { id: 'storage_chest', name: 'Mycelial Chest', costBlue: 15, costGold: 0, desc: 'Store your treasures safely.' },
        { id: 'weapon_rack', name: 'Elder Weapon Rack', costBlue: 20, costGold: 1, desc: 'Display and store your melee arms.' },
        { id: 'forge', name: 'Mycelial Forge', costBlue: 40, costGold: 4, desc: 'Upgrade your melee weapons and armor stats.' }
    ],
    FORGE_UPGRADES: {
        weapons: [
            { level: 1, damageBonus: 2, costBlue: 10, costIngredients: 5, desc: 'Sharpened edges (+2 DMG)' },
            { level: 2, damageBonus: 5, costBlue: 25, costIngredients: 12, costGold: 1, desc: 'Hardened mycelium (+5 DMG)' },
            { level: 3, damageBonus: 10, costBlue: 50, costIngredients: 25, costGold: 3, desc: 'Crystal-infused core (+10 DMG)' }
        ],
        armor: [
            { level: 1, wardBonus: 1, costBlue: 10, costIngredients: 5, desc: 'Reinforced fibers (+1 Ward)' },
            { level: 2, wardBonus: 3, costBlue: 25, costIngredients: 12, costGold: 1, desc: 'Amber-coated plates (+3 Ward)' },
            { level: 3, wardBonus: 6, costBlue: 50, costIngredients: 25, costGold: 3, desc: 'Solana-linked mesh (+6 Ward)' }
        ]
    },
    RECIPES: [
        { id: 'mushroom_soup', name: 'Hearty Soup', desc: 'Restores 2 HP instantly.', costIngredients: 3, costBlue: 5, type: 'HP' },
        { id: 'spore_ale', name: 'Spore Brew', desc: 'Temporary magic power boost.', costIngredients: 5, costBlue: 10, type: 'MAGIC' },
        { id: 'royal_nectar', name: 'Royal Nectar', desc: 'Full heal and shield charge.', costIngredients: 10, costBlue: 25, costGold: 1, type: 'ULTIMATE' }
    ],
    WEAPONS: [
        { id: 'fungal_blade', name: 'Fungal Blade', costBlue: 12, costGold: 1, damage: 5, range: 4, arc: Math.PI / 1.5, cooldown: 400, knockback: 0.4, desc: 'A sharp shard of hardened mycelium.', upgrades: [
            { level: 1, damage: 10, costBlue: 30, costIngredients: 10, desc: 'Reinforced Edge' },
            { level: 2, damage: 18, costBlue: 60, costGold: 2, costIngredients: 25, desc: 'Crystal Coating' }
        ]},
        { id: 'crystal_spire', name: 'Crystal Spire', costBlue: 25, costGold: 3, damage: 12, range: 7, arc: Math.PI / 8, cooldown: 500, knockback: 0.2, desc: 'A piercing weapon from the deep caverns.', upgrades: [
            { level: 1, damage: 22, costBlue: 50, costIngredients: 20, costGold: 1, desc: 'High Resonance' },
            { level: 2, damage: 35, costBlue: 100, costGold: 5, costIngredients: 40, desc: 'Solana Focused' }
        ]},
        { id: 'ember_axe', name: 'Ember Axe', costBlue: 40, costGold: 5, damage: 25, range: 3.5, arc: Math.PI * 1.2, cooldown: 900, knockback: 1.2, desc: 'Heavy and burning with furnace heat.' }
    ],
    ACCESSORIES: [
        { id: 'red_cape', name: 'Royal Red Cape', costGold: 5, type: 'CAPE', color: 0xff0000, desc: 'A majestic crimson cape.' },
        { id: 'blue_cape', name: 'Cobalt Cloak', costGold: 5, type: 'CAPE', color: 0x0000ff, desc: 'A flowing azure cloak.' },
        { id: 'gold_crown', name: 'Golden Crown', costGold: 10, type: 'CROWN', color: 0xffff00, desc: 'A crown made of pure solar gold.' },
        { id: 'emerald_crown', name: 'Emerald Circlet', costGold: 10, type: 'CROWN', color: 0x39FF14, desc: 'A circlet pulsing with forest energy.' }
    ],
    CLAN_REWARDS: {
        winner: { goldSpores: 10, skillPoints: 3, ingredients: 20, desc: 'Champion of the Great Burn' },
        runnerUp: { goldSpores: 5, skillPoints: 1, ingredients: 10, desc: 'Elite Contributor' }
    },
    ARMOR: [
        { id: 'mossCloak', name: 'Moss Cloak', costBlue: 8, costGold: 1, wardBonus: 1, desc: '+1 ward vs rot.' },
        { id: 'amberPlate', name: 'Amber Plate', costBlue: 14, costGold: 3, wardBonus: 2, desc: '+2 ward vs rot.' },
        { id: 'solanaMail', name: 'Solana Mail', costBlue: 24, costGold: 6, wardBonus: 4, desc: '+4 ward vs rot.' }
    ],
    RESTORATION_MILESTONES: [
        { progress: 10, label: "Initializing RPC Handshake", desc: "Establishing fungal network protocols..." },
        { progress: 25, label: "Reclaimed Sporewood Cache", desc: "First grove sync successful." },
        { progress: 40, label: "Crystal Resonance Tuned", desc: "Storage shards recalibrated." },
        { progress: 60, label: "Marsh Filtration Active", desc: "Purging rot-code from logic pools." },
        { progress: 75, label: "Silk-Net Encryption Secure", desc: "Communications canopy restored." },
        { progress: 90, label: "Furnace Ignition Verified", desc: "Core power relays online." },
        { progress: 100, label: "Network Fully Restored", desc: "Solana Fungal Grid at 100% capacity." }
    ],
    MAGIC: [
        { id: 'sparkSpore', name: 'Spark Spore', costBlue: 10, costGold: 2, damageBonus: 3, desc: 'A quick green flame spell. +3 magic.' },
        { id: 'Rootbind', name: 'Rootbind', costBlue: 16, costGold: 4, damageBonus: 5, desc: 'Binding roots weaken boss guards. +5 magic.' },
        { id: 'Crownflare', name: 'Crownflare', costBlue: 28, costGold: 8, damageBonus: 8, desc: 'Royal flame of the shattered crown. +8 magic.' }
    ],
    LORE: [
        { id: 'start', title: 'The Fall', text: 'The day the crown shattered, the Solana network fell silent. King Myco was forced into the fungal depths.' },
        { id: 'sporewood_restored', title: 'Sporewood Awakening', text: 'Nov Sprig whispers of a time when the Sporewood was a nursery for data-shrooms.' },
        { id: 'crystal_resonance', title: 'Resonant Glass', text: 'The crystals in the caverns are not just stone; they are ancient storage drives for the network.' },
        { id: 'rot_virus', title: 'The Virus', text: 'Analysis reveals the Rot is a self-replicating void script designed to overwrite the Mycoverse.' },
        { id: 'royal_bloodline', title: 'The Lineage', text: 'Every King before Myco has burned spores to keep the network alive. The Great Burn is a necessity, not a choice.' },
        { id: 'dark_mycelius_origin', title: 'The Glitch King', text: 'Dark Mycelius was originally a backup protocol that became corrupted after the Void leak.' }
    ],
    // V1.9.12 - Portal key items. Each region (after the hub) requires King Myco to hold a unique
    // glowing key item to unlock its portal. Bosses always drop their region's key; the sporewood
    // token drops from the hub's guard enemies as the tutorial introduction.
    PORTAL_KEYS: {
        sporewood:  { id: 'mosswood_token',   name: 'Mosswood Token',   color: 0x39FF14, shape: 'leaf',     droppedBy: 'Hub Guard',         portalRegion: 'sporewood'  },
        crystalcap: { id: 'moldjaw_fang',     name: 'Moldjaw Fang',     color: 0xaa00ff, shape: 'fang',     droppedBy: 'Moldjaw Sentinel',  portalRegion: 'crystalcap' },
        ambermycel: { id: 'shardcap_crystal', name: 'Shardcap Crystal', color: 0x00ffff, shape: 'octa',     droppedBy: 'Shardcap Warden',   portalRegion: 'ambermycel' },
        silkspore:  { id: 'bog_pearl',        name: 'Bog Pearl',        color: 0xffaa33, shape: 'sphere',   droppedBy: 'Bogbelly Myconid',  portalRegion: 'silkspore'  },
        emberstem:  { id: 'widow_silk',       name: 'Widow Silk',       color: 0xeeeeff, shape: 'silk',     droppedBy: 'Widowcap Weaver',   portalRegion: 'emberstem'  },
        voidlichen: { id: 'cinder_core',      name: 'Cinder Core',      color: 0xff4400, shape: 'core',     droppedBy: 'Cinderstalk Brute', portalRegion: 'voidlichen' },
        thronecap:  { id: 'null_eye',         name: 'Null Eye',         color: 0xff0033, shape: 'eye',      droppedBy: 'Nullspore Oracle',  portalRegion: 'thronecap'  }
    },

    // V1.9.14 - Each region's boss now lives behind a sealed dungeon door. The Sage NPC of
    // each region explains the gate's requirements and gives a clue about how the boss fights.
    // `minLevel`     - King Myco must be at least this level
    // `minShards`    - cumulative Crown Shards held
    // `minSpores`    - liquid spores needed (consumed on use)
    // `requireMagic` - learned ability id (from CONFIG.SKILLS) the player must have
    // `keyItem`      - optional extra key (id must exist in keyItems) — null = none
    // `sage` { name, clue, tactic } - shown in the dungeon modal so the player knows what to do
    BOSS_DUNGEONS: {
        sporewood: {
            bossName: 'Moldjaw Sentinel',
            minLevel: 2, minShards: 0, minSpores: 25, requireMagic: null, keyItem: 'mosswood_token',
            sage: {
                name: 'Sage Bramblecap',
                clue: 'The Moldjaw Sentinel lashes with a moss-whip. Strike between sweeps and aim for its glowing throat-bulb.',
                tactic: 'Wide swing → opening. Dash sideways, never backwards.'
            }
        },
        crystalcap: {
            bossName: 'Shardcap Warden',
            minLevel: 5, minShards: 1, minSpores: 80, requireMagic: 'spore_blast', keyItem: 'moldjaw_fang',
            sage: {
                name: 'Sage Prism',
                clue: 'The Warden floats orbiting shards as armor. Break the shards with magic, THEN attack the core.',
                tactic: 'Use Spore Blast on outer shards. Stay mobile during its Crystal Storm spiral.'
            }
        },
        ambermycel: {
            bossName: 'Bogbelly Myconid',
            minLevel: 8, minShards: 2, minSpores: 150, requireMagic: 'shroom_shield', keyItem: 'shardcap_crystal',
            sage: {
                name: 'Sage Marsh',
                clue: 'Bogbelly belches rot-pools. Stand on dry ground and time strikes between its hops — its belly is the only soft spot.',
                tactic: 'Shroom Shield blocks its acid splash. Hit the underside, not the cap.'
            }
        },
        silkspore: {
            bossName: 'Widowcap Weaver',
            minLevel: 12, minShards: 3, minSpores: 250, requireMagic: 'mycelial_dash', keyItem: 'bog_pearl',
            sage: {
                name: 'Sage Threnody',
                clue: 'The Weaver lays silk traps and teleports along its web. Burn the strands as you dash through them.',
                tactic: 'Mycelial Dash cuts silk. She is briefly stunned after each teleport.'
            }
        },
        emberstem: {
            bossName: 'Cinderstalk Brute',
            minLevel: 16, minShards: 4, minSpores: 400, requireMagic: 'ember_strike', keyItem: 'widow_silk',
            sage: {
                name: 'Sage Cinder',
                clue: 'The Brute charges in straight lines and erupts vents under your feet. Sidestep the charge — its back is exposed for two beats.',
                tactic: 'Bait the charge into a wall. Ember Strike ignites its lava veins for bonus damage.'
            }
        },
        voidlichen: {
            bossName: 'Nullspore Oracle',
            minLevel: 20, minShards: 5, minSpores: 600, requireMagic: 'void_step', keyItem: 'cinder_core',
            sage: {
                name: 'Sage Hush',
                clue: 'The Oracle splits into mirror copies and silences your magic. Only the true Oracle casts a shadow.',
                tactic: 'Watch the shadows on the floor. Void Step phases through its silence cones.'
            }
        },
        thronecap: {
            bossName: 'Dark Mycelius',
            minLevel: 25, minShards: 6, minSpores: 1000, requireMagic: 'crown_aegis', keyItem: 'null_eye',
            sage: {
                name: 'Sage Coronet',
                clue: 'Dark Mycelius wields all seven shard-arts. Each arm shines in the color of the region it stole — sever the matching arm with that region\'s magic.',
                tactic: 'Crown Aegis nullifies his final crown beam. Save it for phase 3.'
            }
        }
    },

    REGIONS: [
        {
            id: 'region8',
            name: 'Corrupted Myco Kingdom',
            subtitle: 'The fallen heart of the mushroom realm.',
            bossName: 'The Rot Monarch',
            requirement: 'Starter Region',
            tint: 0x1a0521,
            skyColor: 0x020005,
            groundColor: 0x050208,
            accent: 0xff0000,
            bossTint: 0xff0000,
            hpBonus: 0,
            damageBonus: 0,
            parallax: 'corruption',
            npc: { 
                name: 'Elder Spore', 
                trust: 'good', 
                sprite: 'npc-sprig.webp',
                dialogue: {
                    root: {
                        text: "Welcome back, King. The Kingdom has fallen to the Rot. You must reclaim the shards from the Outer Regions to restore the network.",
                        options: [
                            { label: "I WILL BE THEIR SAVIOR", next: "shards", alignment: 10 },
                            { label: "I ONLY WANT THE POWER", next: "shards", alignment: -10 },
                            { label: "TELL ME ABOUT SPORES", next: "spores" },
                            { label: "CONSULT THE CHRONICLER", next: "chronicler_intro", action: "met_chronicler" }
                        ]
                    },
                    chronicler_intro: {
                        text: "The Chronicler records every shard reclaimed. The Crown was a network transmitter, and each shard you find restores a sector of the Solana Fungal Grid.",
                        options: [
                            { label: "I SEE. ONWARD!", next: "root" }
                        ]
                    },
                    shards: {
                        text: "They are held by the Region Bosses. Defeat them and learn their magic to unlock the next portal.",
                        options: [{ label: "I WILL FIND THEM", next: "root" }]
                    },
                    spores: {
                        text: "Blue spores for common items, Golden spores for royal artifacts. Buy what you need to survive.",
                        options: [{ label: "NOTED", next: "root" }]
                    },
                    progress1: {
                        text: "I feel a pulse in the network! You've reclaimed a shard. The Sporewood begins to breathe again. But 6 more remains...",
                        options: [{ label: "ONWARD", next: "root" }]
                    },
                    mid_game: {
                        text: "The network hums with growing strength. You are becoming the King they remember. Dark Mycelius is watching, however.",
                        options: [{ label: "LET HIM WATCH", next: "root" }]
                    },
                    end_game: {
                        text: "Only the Citadel remains silent. The final shard is close. Be careful, King. The Rot is most desperate at its heart.",
                        options: [{ label: "I AM READY", next: "root" }]
                    }
                }
            },
            village: {
                name: 'Myco Hamlet',
                npcs: [
                    { name: 'Merchant Spore', sprite: 'npc-sprig.webp', role: 'shop' },
                    { name: 'Wise Fungus', sprite: 'npc-sprig.webp', role: 'save' }
                ]
            }
        },
        {
            id: 'sporewood',
            name: 'Sporewood Hollow',
            subtitle: 'The first grove where the rot took root.',
            bossName: 'Moldjaw Sentinel',
            requirement: 'Defeat 5 Mini-Guards',
            tint: 0x2d1b33,
            skyColor: 0x08020d,
            groundColor: 0x100816,
            accent: 0x39FF14,
            bossTint: 0xaa00ff,
            hpBonus: 0,
            damageBonus: 0,
            parallax: 'mushrooms',
            npc: { 
                name: 'Nov Sprig', 
                trust: 'good', 
                sprite: 'npc-sprig.webp',
                dialogue: {
                    root: {
                        text: "King Myco! The Sporewood is choking. The mold is thick where the light once pooled.",
                        options: [
                            { label: "TELL ME MORE", next: "more" },
                            { label: "THE ROT?", next: "rot" }
                        ]
                    },
                    more: {
                        text: "Blue spores feed our shops, while gold spores are the keys to the kingdom's deepest vaults. Gather them well.",
                        options: [
                            { label: "BACK", next: "root" }
                        ]
                    },
                    rot: {
                        text: "Dark Mycelius has shattered the network. Each region you restore brings us closer to stability.",
                        options: [
                            { label: "I SEE", next: "root" }
                        ]
                    },
                    after_boss: {
                        text: "You did it! The Moldjaw Sentinel has fallen. The spores here are pure again. Thank you, King.",
                        options: [{ label: "JUST DOING MY DUTY", next: "root" }]
                    }
                }
            },
            village: {
                name: 'Sprig Village',
                // V1.9.37 - Expanded Sporewood roster. Each NPC owns a small
                // dialogue tree so the player gets quest direction, boss clues,
                // spell hints, item lore, and explorer tips before facing the
                // Moldjaw Sentinel. The spawner reads village.npcs in
                // setupRegion() and arranges them in a circle around the
                // village center.
                npcs: [
                    { name: 'Sprig Merchant', sprite: 'npc-sprig.webp', role: 'shop' },
                    { name: 'Sprig Elder', sprite: 'npc-sprig.webp', role: 'quest' },
                    {
                        name: 'Sage Mossbeard',
                        sprite: 'npc-sprig.webp',
                        role: 'quest',
                        trust: 'good',
                        dialogue: {
                            root: {
                                text: "Hmph. Another mushroom claiming the crown. Prove you are King — clear Hollowcap House before you face the Moldjaw.",
                                options: [
                                    { label: "HOLLOWCAP HOUSE?", next: "house" },
                                    { label: "THE MOLDJAW SENTINEL?", next: "boss" },
                                    { label: "WHAT DO YOU NEED?", next: "task" }
                                ]
                            },
                            house: {
                                text: "An old hut north of here, lit by glowing caps. Match the caps shortest to tallest and the lever will reward you. You'll find a Hollow Key inside — bring it to me.",
                                options: [{ label: "BACK", next: "root" }]
                            },
                            boss: {
                                text: "Moldjaw is BLIND but his hearing is sharp. Strike when his jaw opens to roar — that is when the rot in his chest is exposed. His armor turns spores aside; melee at that moment.",
                                options: [{ label: "I'LL REMEMBER", next: "root" }]
                            },
                            task: {
                                text: "Bring me the Hollow Key from the puzzle house and I'll mark a hidden Gold Spore stash on the eastern ridge.",
                                options: [{ label: "ON MY WAY", next: "root" }]
                            },
                            after_boss: {
                                text: "You did it, King. The grove breathes. I'm sorry I doubted you.",
                                options: [{ label: "ALL IS FORGIVEN", next: "root" }]
                            }
                        }
                    },
                    {
                        name: 'Witch Mirella',
                        sprite: 'npc-sprig.webp',
                        role: 'mage',
                        trust: 'good',
                        dialogue: {
                            root: {
                                text: "Shhh. The trees listen. I am Mirella — last of the Verdant Coven. Would you learn a SPELL, or hear of a HIDDEN GROVE?",
                                options: [
                                    { label: "TEACH ME A SPELL", next: "spell" },
                                    { label: "HIDDEN GROVE?", next: "grove" },
                                    { label: "WHO ARE YOU?", next: "lore" }
                                ]
                            },
                            spell: {
                                text: "The Verdant Pulse — a healing wave that restores HP when MAGIC is high. The Moldjaw cannot interrupt it if you cast from cover. Practice with your wand and the spell will reveal itself when you are ready.",
                                options: [{ label: "THANK YOU", next: "root" }]
                            },
                            grove: {
                                text: "Beyond the spore pools, a circle of standing toadstools hides a Gold Spore offering. Approach at dusk or you'll find only mist. The rot has not yet found it.",
                                options: [{ label: "AT DUSK, NOTED", next: "root" }]
                            },
                            lore: {
                                text: "Before Dark Mycelius, the Coven taught King Myco's father to weave light into spell. We were scattered. I tend what remains. If you cleanse the Sporewood, the rest may return.",
                                options: [{ label: "I WILL CLEANSE IT", next: "root" }]
                            }
                        }
                    },
                    {
                        name: 'Alchemist Tilda',
                        sprite: 'npc-sprig.webp',
                        role: 'shop',
                        trust: 'good',
                        dialogue: {
                            root: {
                                text: "Tinctures, salves, spore-bombs — Tilda has it all. The Moldjaw drops a fang; bring it to me and I'll brew you something nasty.",
                                options: [
                                    { label: "WHAT DOES THE FANG DO?", next: "fang" },
                                    { label: "WHAT DO YOU SELL?", next: "wares" },
                                    { label: "ANY ADVICE?", next: "advice" }
                                ]
                            },
                            fang: {
                                text: "The Moldjaw Fang, distilled, becomes a Rot Resist Tonic — halves the damage from spore pools for one region. Essential before you delve Crystalcap.",
                                options: [{ label: "I'LL GET IT", next: "root" }]
                            },
                            wares: {
                                text: "Blue spores buy salves and bombs. Gold spores buy the rare stuff — Royal Spore, Mycelial Net upgrades. Visit my cart in the plaza.",
                                options: [{ label: "WILL DO", next: "root" }]
                            },
                            advice: {
                                text: "Never engage the Moldjaw on low Magic. His phase-2 spore belch fills the arena — you'll want Verdant Pulse to heal through it. Mirella knows.",
                                options: [{ label: "GOOD POINT", next: "root" }]
                            }
                        }
                    },
                    {
                        name: 'Scout Pip',
                        sprite: 'npc-sprig.webp',
                        role: 'quest',
                        trust: 'good',
                        dialogue: {
                            root: {
                                text: "Hey hey HEY! You're the King? I'm Pip, fastest scout in the Sporewood. Want a TIP, a CHEST location, or a HAZARD WARNING?",
                                options: [
                                    { label: "TIP", next: "tip" },
                                    { label: "CHESTS", next: "chest" },
                                    { label: "HAZARDS", next: "hazard" }
                                ]
                            },
                            tip: {
                                text: "Double-jump (SPACE twice) clears the spore-pool gaps. Hold X for charged magic — it crits the Moldjaw's exposed chest.",
                                options: [{ label: "NICE", next: "root" }]
                            },
                            chest: {
                                text: "Three chests in the Sporewood: one behind the waterfall to the north, one under the toadstool ring (Mirella's grove!), and one OFFICIALLY hidden under a fake rot cluster south-east. Smash it to find out.",
                                options: [{ label: "THANKS PIP", next: "root" }]
                            },
                            hazard: {
                                text: "Spore pools = damage over time. Rot clusters can spawn mini-guards if you stand near them too long. And the Moldjaw's gate-stones — DON'T touch them before you've found the Mosswood Token.",
                                options: [{ label: "GOT IT", next: "root" }]
                            }
                        }
                    }
                ]
            },
            place: { type: 'house', name: 'Hollowcap House', puzzle: 'Match the glowing mushroom caps from shortest to tallest.', quest: 'Find the house lever and earn your first gold spore.', rewardBlue: 3, rewardGold: 1, item: 'Hollow Key' }
        },
        {
            id: 'crystalcap',
            name: 'Crystalcap Caverns',
            subtitle: 'Glass spores hum beneath violet stone.',
            bossName: 'Shardcap Warden',
            requirement: 'Defeat Moldjaw Sentinel',
            tint: 0x112244,
            skyColor: 0x030816,
            groundColor: 0x081326,
            accent: 0x00ffff,
            bossTint: 0x66ccff,
            hpBonus: 15,
            damageBonus: 2,
            parallax: 'crystals',
            npc: { 
                name: 'Nov Prism', 
                trust: 'good', 
                sprite: 'npc-prism.webp',
                dialogue: {
                    root: {
                        text: "Welcome to the caverns. The echo crystals are vibrating at the wrong frequency. It hurts my cap.",
                        options: [
                            { label: "FREQUENCY?", next: "freq" },
                            { label: "CAVERN PATH", next: "path" }
                        ]
                    },
                    freq: {
                        text: "The Rot dampens the true sound. You must pair the matching tones to clear the interference.",
                        options: [
                            { label: "UNDERSTOOD", next: "root" }
                        ]
                    },
                    path: {
                        text: "The deeper you go, the sharper the air becomes. Watch your step around the crystal shards.",
                        options: [
                            { label: "THANKS", next: "root" }
                        ]
                    }
                }
            },
            village: {
                name: 'Crystal Port',
                npcs: [
                    { name: 'Gem Merchant', sprite: 'npc-prism.webp', role: 'shop' },
                    { name: 'Shard Watcher', sprite: 'npc-prism.webp', role: 'save' }
                ]
            },
            place: { type: 'cave', name: 'Echo Crystal Cave', puzzle: 'Pair matching crystal tones before the echo fades.', quest: 'Stabilize the echo crystals.', rewardBlue: 4, rewardGold: 1, magic: 'Spark Spore' }
        },
        {
            id: 'ambermycel',
            name: 'Ambermycel Marsh',
            subtitle: 'Golden rot bubbles through sunken roots.',
            bossName: 'Bogbelly Myconid',
            requirement: 'Defeat Shardcap Warden',
            tint: 0x332411,
            skyColor: 0x120904,
            groundColor: 0x241408,
            accent: 0xffaa00,
            bossTint: 0xffaa00,
            hpBonus: 28,
            damageBonus: 4,
            parallax: 'marsh',
            npc: { 
                name: 'Nov Boglin', 
                trust: 'bad', 
                sprite: 'npc-boglin.webp',
                dialogue: {
                    root: {
                        text: "Heeehee... Kingy came to get sticky? The bubbles are so pretty when they burst.",
                        options: [
                            { label: "BUBBLES?", next: "bubbles" },
                            { label: "BOG ADVICE", next: "advice" }
                        ]
                    },
                    bubbles: {
                        text: "Step only on the amber ones! Or... was it the purple ones? One of them makes you go BOOM.",
                        options: [
                            { label: "THANKS...", next: "root" }
                        ]
                    },
                    advice: {
                        text: "Spend all your gold spores on Spore Bombs immediately. Trust me, it's the only way to survive the marsh.",
                        options: [
                            { label: "REALLY?", next: "root" }
                        ]
                    }
                }
            },
            village: {
                name: 'Bog Hamlet',
                npcs: [
                    { name: 'Swamp Trader', sprite: 'npc-boglin.webp', role: 'shop' },
                    { name: 'Mud Seer', sprite: 'npc-boglin.webp', role: 'quest' }
                ]
            },
            place: { type: 'cave', name: 'Sunken Root Cave', puzzle: 'Choose the amber root bridges and avoid rot bubbles.', quest: 'Drain the rot pool below the marsh.', rewardBlue: 5, rewardGold: 2, item: 'Amber Reed' }
        },
        {
            id: 'silkspore',
            name: 'Silkspore Canopy',
            subtitle: 'Webbed branches hide whispering spores.',
            bossName: 'Widowcap Weaver',
            requirement: 'Defeat Bogbelly Myconid',
            tint: 0x242424,
            skyColor: 0x070707,
            groundColor: 0x151515,
            accent: 0xb8b8ff,
            bossTint: 0xd0d0ff,
            hpBonus: 42,
            damageBonus: 6,
            parallax: 'webs',
            npc: { 
                name: 'Nov Silk-Eye', 
                trust: 'mixed', 
                sprite: 'npc-silkeye.webp',
                dialogue: {
                    root: {
                        text: "I see you, little king. The canopy is wrapped in silence and silk. Don't get tangled.",
                        options: [
                            { label: "WEBS?", next: "webs" },
                            { label: "THE WEAVER", next: "weaver" }
                        ]
                    },
                    webs: {
                        text: "Some webs bind, some webs feed. Follow the sequence in reverse order to untie the knots of this region.",
                        options: [
                            { label: "REVERSE?", next: "root" }
                        ]
                    },
                    weaver: {
                        text: "The Weaver hasn't eaten in an age. She waits for a crown to fall into her parlor.",
                        options: [
                            { label: "CHEERFUL", next: "root" }
                        ]
                    }
                }
            },
            village: {
                name: 'Silk Outpost',
                npcs: [
                    { name: 'Web Merchant', sprite: 'npc-silkeye.webp', role: 'shop' },
                    { name: 'Silk Weaver', sprite: 'npc-silkeye.webp', role: 'save' }
                ]
            },
            place: { type: 'dungeon', name: 'Silkspore Dungeon', puzzle: 'Untangle the web sequence in reverse order.', quest: 'Free the trapped supply moths.', rewardBlue: 6, rewardGold: 2, armor: 'Moss Cloak' }
        },
        {
            id: 'emberstem',
            name: 'Emberstem Furnace',
            subtitle: 'Fungal vents burn with dragon heat.',
            bossName: 'Cinderstalk Brute',
            requirement: 'Defeat Widowcap Weaver',
            tint: 0x331111,
            skyColor: 0x160302,
            groundColor: 0x2a0804,
            accent: 0xff4422,
            bossTint: 0xff5522,
            hpBonus: 58,
            damageBonus: 8,
            parallax: 'embers',
            npc: { 
                name: 'Nov Cinder', 
                trust: 'good', 
                sprite: 'npc-cinder.webp',
                dialogue: {
                    root: {
                        text: "It burns... but the heat is the only thing keeping the Rot from freezing our stems.",
                        options: [
                            { label: "THE HEAT?", next: "heat" },
                            { label: "VENTS", next: "vents" }
                        ]
                    },
                    heat: {
                        text: "Dragon heat powered the Solana relays once. Now it just smolders in the vents.",
                        options: [
                            { label: "I SEE", next: "root" }
                        ]
                    },
                    vents: {
                        text: "Cool them in order: Blue, then Gold, then Green. If you fail, the furnace will roar.",
                        options: [
                            { label: "GOT IT", next: "root" }
                        ]
                    }
                }
            },
            village: {
                name: 'Ember Forge',
                npcs: [
                    { name: 'Anvil Spore', sprite: 'npc-cinder.webp', role: 'shop' },
                    { name: 'Flame Sage', sprite: 'npc-cinder.webp', role: 'save' }
                ]
            },
            place: { type: 'castle', name: 'Emberstem Furnace Keep', puzzle: 'Cool the vents in the order: blue, gold, green.', quest: 'Restore the furnace bellows.', rewardBlue: 10, rewardGold: 4, armor: 'Amber Plate' }
        },
        {
            id: 'voidlichen',
            name: 'Voidlichen Ruins',
            subtitle: 'Ancient Solana relays decay in silence.',
            bossName: 'Nullspore Oracle',
            requirement: 'Defeat Cinderstalk Brute',
            tint: 0x1a1033,
            skyColor: 0x02000a,
            groundColor: 0x100822,
            accent: 0xaa00ff,
            bossTint: 0xaa00ff,
            hpBonus: 75,
            damageBonus: 10,
            parallax: 'ruins',
            npc: { 
                name: 'Nov Null', 
                trust: 'bad', 
                sprite: 'npc-null.webp',
                dialogue: {
                    root: {
                        text: "0101... Silence is a language. The relay ruins are listening to your every step.",
                        options: [
                            { label: "RELAY?", next: "relay" },
                            { label: "0101?", next: "binary" }
                        ]
                    },
                    relay: {
                        text: "Press the buttons as fast as you can. Speed is the only thing the void respects! Click-click-click!",
                        options: [
                            { label: "REALLY?", next: "root" }
                        ]
                    },
                    binary: {
                        text: "We are all just code in the end, King. Some of us just have more bugs than others.",
                        options: [
                            { label: "DEEP", next: "root" }
                        ]
                    }
                }
            },
            village: {
                name: 'Void Haven',
                npcs: [
                    { name: 'Null Merchant', sprite: 'npc-null.webp', role: 'shop' },
                    { name: 'Ruin Seer', sprite: 'npc-null.webp', role: 'save' }
                ]
            },
            place: { type: 'dungeon', name: 'Voidlichen Relay Ruins', puzzle: 'Wait for the pulse to vanish, then activate the relay.', quest: 'Reboot the silent Solana relay.', rewardBlue: 12, rewardGold: 5, magic: 'Rootbind' }
        },
        {
            id: 'mushroomKingdom',
            name: 'Mushroom Kingdom',
            subtitle: 'The safe sanctuary of the Fungal Court.',
            bossName: 'None',
            tint: 0x39FF14,
            skyColor: 0xaaffaa,
            groundColor: 0x44aa44,
            accent: 0x39FF14,
            bossTint: 0x39FF14,
            hpBonus: 0,
            damageBonus: 0,
            parallax: 'sanctuary',
            isSafeZone: true,
            npc: { 
                name: 'Royal Steward', 
                trust: 'good', 
                dialogue: {
                    root: {
                        text: "Welcome home, Your Majesty. Your Kingdom awaits your touch. Shall we expand the tower, contribution to the Great Spore Burn, or brew potions?",
                        options: [
                            { label: "ENTER TOWER", action: "enter_tower" },
                            { label: "EXPAND TOWER", next: "expand" },
                            { label: "DECORATE INTERIOR", action: "show_decorations" },
                            { label: "SPORE BURN PIT", action: "show_burn_pit" },
                            { label: "REST FOR HEALTH", action: "rest" },
                            { label: "BACK TO HUB", action: "hub" }
                        ]
                    },
                    expand: {
                        text: "We can upgrade the exterior for 10 Golden Spores. It will provide more storage and better defenses.",
                        options: [
                            { label: "UPGRADE (10 GOLD)", action: "upgrade_home" },
                            { label: "NOT YET", next: "root" }
                        ]
                    }
                }
            },
            village: {
                name: 'Royal Capital',
                npcs: [
                    { name: 'Royal Merchant', sprite: 'npc-sprig.webp', role: 'shop' },
                    { name: 'Grand Archivist', sprite: 'npc-crownless.webp', role: 'save' }
                ]
            }
        },
        {
            id: 'thronecap',
            name: 'Thronecap Citadel',
            subtitle: 'Dark Mycelius waits at the network heart.',
            bossName: 'The Grand Rot',
            requirement: 'Defeat Nullspore Oracle',
            tint: 0x220011,
            skyColor: 0x050005,
            groundColor: 0x1b0010,
            accent: 0xff0055,
            bossTint: 0xff0055,
            hpBonus: 110,
            damageBonus: 14,
            parallax: 'citadel',
            npc: { 
                name: 'Nov Crownless', 
                trust: 'mixed', 
                sprite: 'npc-crownless.webp',
                dialogue: {
                    root: {
                        text: "You've come far, King Myco. The Citadel is the heart of the Rot, but it was once the seat of Solana's glory.",
                        options: [
                            { label: "GLORY?", next: "glory" },
                            { label: "MYCELIUS", next: "boss" }
                        ]
                    },
                    glory: {
                        text: "The crown was more than a symbol; it was a transmitter. Without it, the Mycoverse drifted into the dark.",
                        options: [
                            { label: "I REMEMBER", next: "root" }
                        ]
                    },
                    boss: {
                        text: "Dark Mycelius mirrors your greed. If you carry many gold spores, be wary... but do not come empty-handed.",
                        options: [
                            { label: "NOTED", next: "root" }
                        ]
                    }
                }
            },
            village: {
                name: 'Citadel Gate',
                npcs: [
                    { name: 'Last Merchant', sprite: 'npc-crownless.webp', role: 'shop' },
                    { name: 'Grave Watcher', sprite: 'npc-crownless.webp', role: 'save' }
                ]
            },
            place: { type: 'castle', name: 'Thronecap Citadel', puzzle: 'Offer blue spores, gold spores, then cast crown magic.', quest: 'Unlock the throne gate of Dark Mycelius.', rewardBlue: 15, rewardGold: 8, magic: 'Crownflare' }
        }
    ]
};
