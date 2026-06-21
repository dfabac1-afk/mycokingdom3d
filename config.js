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
    KINGDOM_BLUEPRINTS: [
        { id: 'forager_hut', name: 'Forager Hut', costBlue: 18, costGold: 0, capBonus: 35, prosperity: 1, desc: 'A tiny hut for spore gatherers. Raises your daily collector cap by 35.' },
        { id: 'spore_house', name: 'Spore House', costBlue: 36, costGold: 1, capBonus: 70, prosperity: 2, desc: 'A proper fungal home for settlers and scouts. +70 daily collector cap.' },
        { id: 'moss_market', name: 'Moss Market', costBlue: 54, costGold: 2, capBonus: 95, prosperity: 3, desc: 'A living storefront where merchants trade spores and relics. +95 daily collector cap.' },
        { id: 'watch_castle', name: 'Watch Castle', costBlue: 120, costGold: 6, capBonus: 180, prosperity: 5, desc: 'A towering castle that makes your kingdom feel real. +180 daily collector cap.' }
    ],
    KINGDOM_RESIDENTS: [
        { id: 'sprig_merchant', name: 'Sprig Merchant', costBlue: 22, costGold: 1, capBonus: 30, prosperity: 1, desc: 'Opens a merchant lane and keeps your kingdom stocked.' },
        { id: 'crown_guard', name: 'Crown Guard', costBlue: 28, costGold: 1, capBonus: 28, defense: 2, desc: 'Protects the roads and patrols your growing capital.' },
        { id: 'lorekeeper', name: 'Lorekeeper NPC', costBlue: 26, costGold: 1, capBonus: 24, prosperity: 1, desc: 'Keeps a record of your kingdom and attracts new citizens.' },
        { id: 'spore_smith', name: 'Spore Smith', costBlue: 34, costGold: 2, capBonus: 40, defense: 1, prosperity: 1, desc: 'Maintains huts, shops, and castle walls while boosting productivity.' }
    ],
    KINGDOM_THREATS: [
        { id: 'rotling_nest', name: 'Rotling Nest', costBlue: 20, costGold: 1, capBonus: 26, danger: 2, desc: 'A controlled enemy pocket outside the walls that lures richer spore drops.' },
        { id: 'bog_beast_den', name: 'Bog Beast Den', costBlue: 38, costGold: 2, capBonus: 44, danger: 3, desc: 'A foul den of roaming enemies. Riskier outskirts, stronger spoils.' },
        { id: 'void_gate', name: 'Void Gate', costBlue: 68, costGold: 4, capBonus: 80, danger: 5, desc: 'A crackling enemy gate that turns your kingdom into a true grinder zone.' }
    ],
    DWELLING_UPGRADES: [
        { tier: 2, name: 'Expanded Dwelling', costBlue: 42, costGold: 2, capBonus: 40, desc: 'Adds more room for decor, trophies, and storage.' },
        { tier: 3, name: 'Royal Dwelling', costBlue: 80, costGold: 4, capBonus: 70, desc: 'Turns your home into a decorated royal suite.' },
        { tier: 4, name: 'Citadel Residence', costBlue: 140, costGold: 8, capBonus: 110, desc: 'A fully customized inner sanctum worthy of King Myco.' }
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
    HOLDER_TIERS: [
        {
            id: 'spore_guard',
            name: 'Spore Guard',
            badge: '🍄',
            minBalance: 10000,
            accent: '#39FF14',
            perks: ['Live kingdom access', '+3% move speed', '+1 flat spell damage'],
            rewards: {
                accessories: ['red_cape'],
                inventory: ['capPotion'],
                playerModifiers: {
                    speedMult: 1.03,
                    damageBonusFlat: 1
                }
            }
        },
        {
            id: 'crown_guard',
            name: 'Crown Guard',
            badge: '🛡️',
            minBalance: 25000,
            accent: '#00ffff',
            perks: ['+6% move speed', '+6% spell cooldown recovery', '+4% crit chance'],
            rewards: {
                accessories: ['emerald_crown'],
                inventory: ['rotSalve'],
                playerModifiers: {
                    speedMult: 1.06,
                    cooldownMult: 0.94,
                    critBonus: 0.04
                }
            }
        },
        {
            id: 'mycelial_knight',
            name: 'Mycelial Knight',
            badge: '⚔️',
            minBalance: 50000,
            accent: '#ffaa00',
            perks: ['+2 ward', '+1 projectile', 'Unlock Fungal Shield'],
            rewards: {
                inventory: ['sporeBomb'],
                skills: ['fungalShield'],
                playerModifiers: {
                    wardBonusFlat: 2,
                    projectileCountBonus: 1,
                    damageBonusFlat: 2
                }
            }
        },
        {
            id: 'throne_ascendant',
            name: 'Throne Ascendant',
            badge: '👑',
            minBalance: 100000,
            accent: '#ff55aa',
            perks: ['Unlock Royal Spore + Fire Trail', '+10% speed', '+12% cooldown recovery', '+3 ward'],
            rewards: {
                accessories: ['gold_crown'],
                skills: ['royalSpore', 'fireTrail'],
                skillPoints: 2,
                playerModifiers: {
                    speedMult: 1.1,
                    cooldownMult: 0.88,
                    wardBonusFlat: 3,
                    regenBonus: 0.08,
                    critBonus: 0.08,
                    damageBonusFlat: 4,
                    projectileSpeedMult: 1.12
                }
            }
        }
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
        { id: 'sparkSpore', name: 'Spark Spore', costBlue: 10, costGold: 2, damageBonus: 3, rotCleanse: 0.75, rotRadius: 4.5, desc: 'A quick green flame spell. Steadies weak rot growths.' },
        { id: 'PurifyBloom', name: 'Purify Bloom', costBlue: 12, costGold: 3, damageBonus: 2, rotCleanse: 1.6, rotRadius: 6.5, desc: 'A cleansing bloom that washes rot from mushrooms and ground.' },
        { id: 'Rootbind', name: 'Rootbind', costBlue: 16, costGold: 4, damageBonus: 5, rotCleanse: 1.1, rotRadius: 5.5, desc: 'Binding roots unravel rot veins and pin corrupted growths.' },
        { id: 'Crownflare', name: 'Crownflare', costBlue: 28, costGold: 8, damageBonus: 8, rotCleanse: 2.2, rotRadius: 8, desc: 'Royal flame of the shattered crown. Scorches rot clusters clean.' }
    ],
    ROT_QUESTS: {
        sporewood: {
            title: 'Purge Hollow Rot',
            description: 'Wash the Sporewood heartwood clean so patrols thin and the grove can breathe again.',
            rewardMagicId: 'PurifyBloom',
            accent: 0x80ffaa
        },
        crystalcap: {
            title: 'Tune the Crystal Blight',
            description: 'Clear the humming rot from the crystal floor before it fractures the cave song.',
            rewardMagicId: 'Rootbind',
            accent: 0x66f0ff
        },
        ambermycel: {
            title: 'Drain the Marsh Rot',
            description: 'Burn back the ooze on the reeds and ground until the marsh paths stay open.',
            accent: 0xffcc66
        },
        silkspore: {
            title: 'Free the Silk Canopy',
            description: 'Clean the woven rot from the canopy so fewer corrupted hunters stalk the web roads.',
            accent: 0xeed6ff
        },
        emberstem: {
            title: 'Temper the Ember Blight',
            description: 'Scour the furnace rot from ash and magma crust before it wakes fresh warbands.',
            rewardMagicId: 'Crownflare',
            accent: 0xff8844
        },
        voidlichen: {
            title: 'Quiet the Relay Rot',
            description: 'Scrub the void-static from the relay ground and lichen beds until the signal clears.',
            accent: 0xaa88ff
        },
        thronecap: {
            title: 'Cleanse the Fallen Crown',
            description: 'Purge the last thronecap blight from stone and mushroom root so the kingdom stays restored.',
            accent: 0xff5577
        }
    },
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
        crystalcap: { id: 'moldjaw_fang',     name: 'Mossfang Fang',    color: 0xaa00ff, shape: 'fang',     droppedBy: 'Mossfang Sentinel', portalRegion: 'crystalcap' },
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
            bossName: 'Mossfang Sentinel',
            minLevel: 2, minShards: 0, minSpores: 25, requireMagic: null, keyItem: 'mosswood_token',
            sage: {
                name: 'Sage Bramblecap',
                clue: 'Mossfang Sentinel lashes with root-whips and slams its trunk-face into the earth. Strike after the slam and aim for the glowing heartwood behind its fangs.',
                tactic: 'Circle the haunted tree, bait the slam, then punish the face while it recovers.'
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
                    { name: 'Wise Fungus', sprite: 'npc-sprig.webp', role: 'save' },
                    {
                        name: 'Gate Scout Luma',
                        sprite: 'npc-sprig.webp',
                        role: 'quest',
                        trust: 'good',
                        dialogue: {
                            root: {
                                text: "The outer gates still answer to your crown, Majesty, but only after you clear the starter blight around the hamlet.",
                                options: [
                                    { label: 'STARTER BLIGHT?', next: 'task' },
                                    { label: 'OUTER GATES?', next: 'gates' }
                                ]
                            },
                            task: {
                                text: "Sweep the nearby rotlings, gather a few blue spores, and speak with Elder Spore again. Once the network stirs, the Sporewood path will obey you.",
                                options: [{ label: 'I\'LL HANDLE IT', next: 'root' }]
                            },
                            gates: {
                                text: "Each restored land wakes another portal. Defeat a boss, claim its prize, then the next route opens. The kingdom remembers its king in stages.",
                                options: [{ label: 'GOOD TO KNOW', next: 'root' }]
                            }
                        }
                    },
                    {
                        name: 'Page Myr',
                        sprite: 'npc-sprig.webp',
                        role: 'quest',
                        trust: 'good',
                        dialogue: {
                            root: {
                                text: "The Chronicler sent me ahead with fresh pages. Want a quick note on SHARDS or SPORES?",
                                options: [
                                    { label: 'SHARDS', next: 'shards' },
                                    { label: 'SPORES', next: 'spores' }
                                ]
                            },
                            shards: {
                                text: "Crown Shards restore the kingdom itself. They matter more than gold, and every boss keeps one where the Rot is thickest.",
                                options: [{ label: 'NOTED', next: 'root' }]
                            },
                            spores: {
                                text: "Blue spores keep you alive. Gold spores open royal options. Spend blue freely, but think before you part with gold.",
                                options: [{ label: 'SMART', next: 'root' }]
                            }
                        }
                    }
                ]
            }
        },
        {
            id: 'sporewood',
            name: 'Sporewood Hollow',
            subtitle: 'The first grove where the rot took root.',
            bossName: 'Mossfang Sentinel',
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
                        text: "You did it! Mossfang Sentinel has fallen. The spores here are pure again. Thank you, King.",
                        options: [{ label: "JUST DOING MY DUTY", next: "root" }]
                    }
                }
            },
            village: {
                name: 'Sprig Village',
                // V1.9.37 - Expanded Sporewood roster. Each NPC owns a small
                // dialogue tree so the player gets quest direction, boss clues,
                // spell hints, item lore, and explorer tips before facing the
                // Mossfang Sentinel. The spawner reads village.npcs in
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
                                text: "Hmph. Another mushroom claiming the crown. Prove you are King - clear Hollowcap House before you face Mossfang.",
                                options: [
                                    { label: "HOLLOWCAP HOUSE?", next: "house" },
                                    { label: "THE MOSSFANG SENTINEL?", next: "boss" },
                                    { label: "WHAT DO YOU NEED?", next: "task" }
                                ]
                            },
                            house: {
                                text: "An old hut north of here, lit by glowing caps. Match the caps shortest to tallest and the lever will reward you. You'll find a Hollow Key inside — bring it to me.",
                                options: [{ label: "BACK", next: "root" }]
                            },
                            boss: {
                                text: "Mossfang lurches like a haunted tree. Strike when its carved maw opens after a slam - that is when the rot in its heartwood is exposed. Its bark shrugs off spores until then.",
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
                                text: "The Verdant Pulse - a healing wave that restores HP when MAGIC is high. Mossfang cannot interrupt it if you cast from cover. Practice with your wand and the spell will reveal itself when you are ready.",
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
                                text: "Tinctures, salves, spore-bombs - Tilda has it all. Mossfang drops a fang; bring it to me and I'll brew you something nasty.",
                                options: [
                                    { label: "WHAT DOES THE FANG DO?", next: "fang" },
                                    { label: "WHAT DO YOU SELL?", next: "wares" },
                                    { label: "ANY ADVICE?", next: "advice" }
                                ]
                            },
                            fang: {
                                text: "The Mossfang Fang, distilled, becomes a Rot Resist Tonic - halves the damage from spore pools for one region. Essential before you delve Crystalcap.",
                                options: [{ label: "I'LL GET IT", next: "root" }]
                            },
                            wares: {
                                text: "Blue spores buy salves and bombs. Gold spores buy the rare stuff — Royal Spore, Mycelial Net upgrades. Visit my cart in the plaza.",
                                options: [{ label: "WILL DO", next: "root" }]
                            },
                            advice: {
                                text: "Never engage Mossfang on low Magic. Its phase-2 spore belch fills the arena - you'll want Verdant Pulse to heal through it. Mirella knows.",
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
                                text: "Double-jump (SPACE twice) clears the spore-pool gaps. Hold X for charged magic - it crits Mossfang's exposed heartwood.",
                                options: [{ label: "NICE", next: "root" }]
                            },
                            chest: {
                                text: "Three chests in the Sporewood: one behind the waterfall to the north, one under the toadstool ring (Mirella's grove!), and one OFFICIALLY hidden under a fake rot cluster south-east. Smash it to find out.",
                                options: [{ label: "THANKS PIP", next: "root" }]
                            },
                            hazard: {
                                text: "Spore pools = damage over time. Rot clusters can spawn mini-guards if you stand near them too long. And Mossfang's gate-stones - DON'T touch them before you've found the Mosswood Token.",
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
                requirement: 'Defeat Mossfang Sentinel',
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
                    { name: 'Shard Watcher', sprite: 'npc-prism.webp', role: 'save' },
                    {
                        name: 'Resonant Miner Pell',
                        sprite: 'npc-prism.webp',
                        role: 'quest',
                        trust: 'good',
                        dialogue: {
                            root: {
                                text: "Hear that ringing? The cave only opens when the crystal tones answer in pairs. Miss a note and the path collapses back into echo.",
                                options: [
                                    { label: 'PAIR THE TONES?', next: 'tones' },
                                    { label: 'THE WARDEN?', next: 'boss' }
                                ]
                            },
                            tones: {
                                text: "Strike the bright crystal, then match its twin before the hum fades. Start with the highest pitch. The low notes lie when the Rot is near.",
                                options: [{ label: 'I CAN DO THAT', next: 'root' }]
                            },
                            boss: {
                                text: "Shardcap Warden reflects careless shots. Wait for the crystal plates on its arms to flare, then blast the glowing seam in its chest.",
                                options: [{ label: 'SEAM IN THE CHEST', next: 'root' }]
                            }
                        }
                    },
                    {
                        name: 'Cantor Ves',
                        sprite: 'npc-prism.webp',
                        role: 'mage',
                        trust: 'good',
                        dialogue: {
                            root: {
                                text: "I tune spellwork against crystal hum. Ask about a SPELL TIP or a SECRET VEIN.",
                                options: [
                                    { label: 'SPELL TIP', next: 'spell' },
                                    { label: 'SECRET VEIN', next: 'vein' }
                                ]
                            },
                            spell: {
                                text: "Spark Spore arcs farther when you fire from high ground. In these caverns, ledges are worth more than armor.",
                                options: [{ label: 'GOOD TIP', next: 'root' }]
                            },
                            vein: {
                                text: "North of the docks, a cracked geode hides a gold seam. Break the dull crystals, not the bright ones, or the chamber seals again.",
                                options: [{ label: 'I\'LL LOOK', next: 'root' }]
                            }
                        }
                    }
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
                    { name: 'Mud Seer', sprite: 'npc-boglin.webp', role: 'quest' },
                    {
                        name: 'Reed Diver Sprock',
                        sprite: 'npc-boglin.webp',
                        role: 'quest',
                        trust: 'mixed',
                        dialogue: {
                            root: {
                                text: "The safe reeds shimmer amber, not violet. Follow the amber bridges and you'll reach the drain wheel below the marsh.",
                                options: [
                                    { label: 'DRAIN WHEEL?', next: 'wheel' },
                                    { label: 'BOGBELLY?', next: 'boss' }
                                ]
                            },
                            wheel: {
                                text: "Turn the sluice locks in the order carved on the root posts. Miss one and the bog burps up more rot bubbles.",
                                options: [{ label: 'ROOT POSTS, GOT IT', next: 'root' }]
                            },
                            boss: {
                                text: "Bogbelly hates dry footing. Lure it onto the islands after it belly-slams, then punish the glowing sack under its chin.",
                                options: [{ label: 'THAT HELPS', next: 'root' }]
                            }
                        }
                    },
                    {
                        name: 'Lantern Nib',
                        sprite: 'npc-boglin.webp',
                        role: 'quest',
                        trust: 'good',
                        dialogue: {
                            root: {
                                text: "I hang lanterns where treasure sinks. Want the CHEST ROUTE or the SAFE CAMP?",
                                options: [
                                    { label: 'CHEST ROUTE', next: 'chest' },
                                    { label: 'SAFE CAMP', next: 'camp' }
                                ]
                            },
                            chest: {
                                text: "Three lanterns in a triangle mark a buried chest. Dig between them after draining the first pool and you will pull up a gold spore cache.",
                                options: [{ label: 'I\'LL FIND IT', next: 'root' }]
                            },
                            camp: {
                                text: "If the marsh overwhelms you, retreat to the dry stump camp east of the village. Even the Rot avoids that old firepit.",
                                options: [{ label: 'USEFUL', next: 'root' }]
                            }
                        }
                    }
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
                    { name: 'Silk Weaver', sprite: 'npc-silkeye.webp', role: 'save' },
                    {
                        name: 'Moth Tender Iri',
                        sprite: 'npc-silkeye.webp',
                        role: 'quest',
                        trust: 'good',
                        dialogue: {
                            root: {
                                text: "Our supply moths are trussed up in silk cocoons. Free them in reverse beacon order and they'll carry you to hidden ledges.",
                                options: [
                                    { label: 'REVERSE ORDER?', next: 'order' },
                                    { label: 'WIDOWCAP?', next: 'boss' }
                                ]
                            },
                            order: {
                                text: "Watch the lantern-webs flash, then step the pattern backward. The canopy loves to punish anyone moving on instinct.",
                                options: [{ label: 'BACKWARD PATTERN', next: 'root' }]
                            },
                            boss: {
                                text: "Widowcap Weaver drops from above after every cocoon burst. Roll clear, then strike before she climbs back into the rafters.",
                                options: [{ label: 'I\'LL WATCH THE CEILING', next: 'root' }]
                            }
                        }
                    },
                    {
                        name: 'Rope Scout Venn',
                        sprite: 'npc-silkeye.webp',
                        role: 'quest',
                        trust: 'mixed',
                        dialogue: {
                            root: {
                                text: "I map the hanging bridges. Need a SHORTCUT or a HAZARD WARNING?",
                                options: [
                                    { label: 'SHORTCUT', next: 'shortcut' },
                                    { label: 'HAZARD', next: 'hazard' }
                                ]
                            },
                            shortcut: {
                                text: "Cut the pale silk knots near the west scaffold and a bridge drops straight to the dungeon mouth. Saves a long walk, costs a little courage.",
                                options: [{ label: 'WORTH IT', next: 'root' }]
                            },
                            hazard: {
                                text: "The white webs slow you, but the blue webs fling you. Use the blue lanes during the boss chase or you'll never keep up.",
                                options: [{ label: 'GOOD TO KNOW', next: 'root' }]
                            }
                        }
                    }
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
                    { name: 'Flame Sage', sprite: 'npc-cinder.webp', role: 'save' },
                    {
                        name: 'Bellows Smith Orin',
                        sprite: 'npc-cinder.webp',
                        role: 'quest',
                        trust: 'good',
                        dialogue: {
                            root: {
                                text: "The furnace keep answers to order, not force. Cool the vents blue, then gold, then green or the fire cycle resets.",
                                options: [
                                    { label: 'VENT ORDER', next: 'order' },
                                    { label: 'CINDERSTALK?', next: 'boss' }
                                ]
                            },
                            order: {
                                text: "Each correct vent drops the heat one tier. Miss a color and the furnace floods the room with cinders. Keep moving between pulls.",
                                options: [{ label: 'UNDERSTOOD', next: 'root' }]
                            },
                            boss: {
                                text: "Cinderstalk Brute overheats after a charge. When its shoulder vents glow white, circle behind and strike the exposed spine mushrooms.",
                                options: [{ label: 'WHITE VENTS, REAR STRIKE', next: 'root' }]
                            }
                        }
                    },
                    {
                        name: 'Ash Runner Pyra',
                        sprite: 'npc-cinder.webp',
                        role: 'quest',
                        trust: 'good',
                        dialogue: {
                            root: {
                                text: "I run the upper catwalks. Want an ORE CACHE or a SAFE ROUTE through the vents?",
                                options: [
                                    { label: 'ORE CACHE', next: 'cache' },
                                    { label: 'SAFE ROUTE', next: 'route' }
                                ]
                            },
                            cache: {
                                text: "There's a gold spore satchel tucked behind the third cooling fan. Shut the nearby blue vent first or you'll get roasted reaching for it.",
                                options: [{ label: 'I\'LL GRAB IT', next: 'root' }]
                            },
                            route: {
                                text: "The left catwalk is hotter, but faster. The right tunnel is safer and stocked with healing caps. Pick what your HP can afford.",
                                options: [{ label: 'FAIR', next: 'root' }]
                            }
                        }
                    }
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
                    { name: 'Ruin Seer', sprite: 'npc-null.webp', role: 'save' },
                    {
                        name: 'Signal Scribe Oxa',
                        sprite: 'npc-null.webp',
                        role: 'quest',
                        trust: 'good',
                        dialogue: {
                            root: {
                                text: "These relays wake only after the pulse disappears. Wait for silence, then hit the pad. The void punishes impatience.",
                                options: [
                                    { label: 'WAIT FOR SILENCE?', next: 'pulse' },
                                    { label: 'NULLSPORE?', next: 'boss' }
                                ]
                            },
                            pulse: {
                                text: "Every relay cycles bright, dim, then dead-black. Step in on dead-black. Any earlier and the whole ruin screams back to life.",
                                options: [{ label: 'DEAD-BLACK, GOT IT', next: 'root' }]
                            },
                            boss: {
                                text: "Nullspore Oracle copies your last move. Break the pattern. If you spam spells, it learns spells. If you dodge, it forgets.",
                                options: [{ label: 'I\'LL MIX IT UP', next: 'root' }]
                            }
                        }
                    },
                    {
                        name: 'Pulse Hermit Vex',
                        sprite: 'npc-null.webp',
                        role: 'quest',
                        trust: 'mixed',
                        dialogue: {
                            root: {
                                text: "The ruins hide code caches. Ask for a SECRET NODE or a SURVIVAL TIP.",
                                options: [
                                    { label: 'SECRET NODE', next: 'node' },
                                    { label: 'SURVIVAL TIP', next: 'survival' }
                                ]
                            },
                            node: {
                                text: "A broken relay under the west arch still stores blue spores. Activate the side pad after the main pulse vanishes and the cache drawer slides out.",
                                options: [{ label: 'SLICK', next: 'root' }]
                            },
                            survival: {
                                text: "Void pools don't always hurt immediately. They slow first. The moment your step drags, jump clear before the damage tick begins.",
                                options: [{ label: 'GOOD WARNING', next: 'root' }]
                            }
                        }
                    }
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
                    { name: 'Grand Archivist', sprite: 'npc-crownless.webp', role: 'save' },
                    {
                        name: 'Tower Mason Brikk',
                        sprite: 'npc-sprig.webp',
                        role: 'quest',
                        trust: 'good',
                        dialogue: {
                            root: {
                                text: "Every shard you restore strengthens the royal tower. Bring home enough gold and I'll raise new ledges, banners, and storage lofts.",
                                options: [
                                    { label: 'WHAT CHANGES?', next: 'changes' },
                                    { label: 'HOW MUCH GOLD?', next: 'gold' }
                                ]
                            },
                            changes: {
                                text: "New rooms, faster traversal, and better sights over the kingdom. A proper king should feel the capital growing with every victory.",
                                options: [{ label: 'I LIKE THAT', next: 'root' }]
                            },
                            gold: {
                                text: "Keep a reserve of ten gold spores if you want upgrades on demand. Spend the rest as you please.",
                                options: [{ label: 'TEN GOLD RESERVED', next: 'root' }]
                            }
                        }
                    },
                    {
                        name: 'Garden Keeper Sola',
                        sprite: 'npc-sprig.webp',
                        role: 'quest',
                        trust: 'good',
                        dialogue: {
                            root: {
                                text: "The palace garden tracks your journey. Want a REST TIP or a REGION REMINDER?",
                                options: [
                                    { label: 'REST TIP', next: 'rest' },
                                    { label: 'REGION REMINDER', next: 'regions' }
                                ]
                            },
                            rest: {
                                text: "Come home whenever your potions run low. A quick rest here tops your health without spending supplies.",
                                options: [{ label: 'GOOD TO KNOW', next: 'root' }]
                            },
                            regions: {
                                text: "Sporewood teaches timing. Crystalcap tests memory. Ambermycel punishes footing. Silkspore flips patterns. Emberstem loves order. Voidlichen rewards patience.",
                                options: [{ label: 'NICE SUMMARY', next: 'root' }]
                            }
                        }
                    }
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
                    { name: 'Grave Watcher', sprite: 'npc-crownless.webp', role: 'save' },
                    {
                        name: 'Exile Knight Ruen',
                        sprite: 'npc-crownless.webp',
                        role: 'quest',
                        trust: 'good',
                        dialogue: {
                            root: {
                                text: "The throne gate demands tribute in sequence: blue spores, then gold spores, then crown magic. The order matters more than the amount.",
                                options: [
                                    { label: 'GATE SEQUENCE', next: 'sequence' },
                                    { label: 'THE GRAND ROT?', next: 'boss' }
                                ]
                            },
                            sequence: {
                                text: "Offer the lesser wealth first so the citadel recognizes restraint. Then pay gold. Then cast. Dark Mycelius cannot understand sacrifice done in the right order.",
                                options: [{ label: 'I SEE', next: 'root' }]
                            },
                            boss: {
                                text: "The Grand Rot mirrors greed and panic. When it copies your stance, change rhythm immediately. Make it chase you into mistakes.",
                                options: [{ label: 'CHANGE RHYTHM', next: 'root' }]
                            }
                        }
                    },
                    {
                        name: 'Relay Penitent Solm',
                        sprite: 'npc-crownless.webp',
                        role: 'quest',
                        trust: 'mixed',
                        dialogue: {
                            root: {
                                text: "Few reach this far. Ask me for a LAST CACHE or a FINAL WARNING.",
                                options: [
                                    { label: 'LAST CACHE', next: 'cache' },
                                    { label: 'FINAL WARNING', next: 'warning' }
                                ]
                            },
                            cache: {
                                text: "Behind the fallen banner at the gate rests one final chest. It won't win the war, but it may fund the potion that does.",
                                options: [{ label: 'I\'LL TAKE IT', next: 'root' }]
                            },
                            warning: {
                                text: "Do not rush the final room with empty magic. Every phase asks a different answer, and the citadel gives no safe pause once the heart wakes.",
                                options: [{ label: 'I\'LL PREPARE', next: 'root' }]
                            }
                        }
                    }
                ]
            },
            place: { type: 'castle', name: 'Thronecap Citadel', puzzle: 'Offer blue spores, gold spores, then cast crown magic.', quest: 'Unlock the throne gate of Dark Mycelius.', rewardBlue: 15, rewardGold: 8, magic: 'Crownflare' }
        }
    ]
};
