// V1.9.28 - Suppress the cosmetic "AudioContext is suspended" warning that
// Tone.js prints every time a synth is constructed before the user gesture
// resumes the context. This is browser-policy noise, not an error: our code
// correctly waits for a click/tap to call Tone.start(). Suppressing only this
// exact message keeps the console clean while leaving all other warnings
// (including any genuine future Tone or browser warnings) untouched.
(() => {
    const originalWarn = console.warn.bind(console);
    const SUPPRESS = 'The AudioContext is "suspended"';
    console.warn = (...args) => {
        if (args.length && typeof args[0] === 'string' && args[0].includes(SUPPRESS)) return;
        originalWarn(...args);
    };
})();

import * as THREE from 'three';
import * as TONE from 'tone';
import * as SOLANA from '@solana/web3.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js';
import { Player3D, Enemy3D, RotInfectedEnemy3D, LightPool3D, Boss3D, ShardcapWarden3D, DarkMycelius3D, GrandRotBoss3D, BogbellyMyconid3D, WidowcapWeaver3D, Collectible3D, NPC3D, Portal3D, Chest3D, NetTrap3D, Hazard3D, PuzzlePillar3D, SporeBomb3D, VoxelCorruptedHazard3D, InteractiveBuilding3D, RotCluster3D, CitadelGate3D } from './entities_3d.js';
import { CONFIG } from './config.js';

class LeaderboardManager {
    constructor() {
        this.storageKey = 'myco_quest_leaderboard_v1';
        this.data = this.load();
    }

    load() {
        const saved = localStorage.getItem(this.storageKey);
        if (saved) return JSON.parse(saved);
        
        return {
            totalGlobalBurned: 0,
            weeklyGlobalBurned: 0,
            thronecapTimes: [
                { name: 'KingFungi', time: 145.2, clan: 'myco', date: Date.now() - 86400000 },
                { name: 'SporeLord', time: 168.5, clan: 'brood', date: Date.now() - 172800000 },
                { name: 'SolanaShroom', time: 182.1, clan: 'tegbot', date: Date.now() - 259200000 }
            ],
            clans: {
                'myco': { score: 1000, burned: 0, dailyBurned: 0, allTimeBurned: 0 },
                'rougarou': { score: 800, burned: 0, dailyBurned: 0, allTimeBurned: 0 },
                'tegbot': { score: 750, burned: 0, dailyBurned: 0, allTimeBurned: 0 },
                'shiba': { score: 600, burned: 0, dailyBurned: 0, allTimeBurned: 0 },
                'brood': { score: 500, burned: 0, dailyBurned: 0, allTimeBurned: 0 }
            },
            players: [
                { name: 'KingFungi', score: 450, burned: 1200, weeklyBurned: 150, clan: 'myco' },
                { name: 'SporeLord', score: 410, burned: 950, weeklyBurned: 120, clan: 'brood' },
                { name: 'SolanaShroom', score: 390, burned: 880, weeklyBurned: 90, clan: 'tegbot' },
                { name: 'FungalOverlord', score: 350, burned: 720, weeklyBurned: 60, clan: 'shiba' },
                { name: 'MycoStalker', score: 320, burned: 650, weeklyBurned: 40, clan: 'rougarou' }
            ],
            hallOfFame: [
                { weekEnding: '2/11/2024', winner: 'myco', runnerUp: 'tegbot', winnerBurn: 15400, timestamp: Date.now() - 604800000 },
                { weekEnding: '2/4/2024', winner: 'brood', runnerUp: 'rougarou', winnerBurn: 12800, timestamp: Date.now() - 1209600000 },
                { weekEnding: '1/28/2024', winner: 'shiba', runnerUp: 'myco', winnerBurn: 9200, timestamp: Date.now() - 1814400000 }
            ]
        };
    }

    save() {
        localStorage.setItem(this.storageKey, JSON.stringify(this.data));
    }

    // V1.9.23 - Returns the calendar-day key used to roll over "today" burn totals.
    _todayKey() {
        const d = new Date();
        return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    }

    // V1.9.23 - Roll the per-player todayBurned counter forward when the day flips.
    _rolloverDailyIfNeeded() {
        const today = this._todayKey();
        if (this.data.todayKey === today) return;
        this.data.todayKey = today;
        (this.data.players || []).forEach(p => { p.todayBurned = 0; });
        this.save();
    }

    burnSpores(clanId, amount, playerName, mode = 'STORY') {
        if (!this.data.clans[clanId]) {
            this.data.clans[clanId] = { score: 0, burned: 0, dailyBurned: 0, allTimeBurned: 0 };
        }
        if (typeof this.data.clans[clanId] === 'number') {
            this.data.clans[clanId] = { score: this.data.clans[clanId], burned: 0, dailyBurned: 0, allTimeBurned: 0 };
        }
        
        this.data.clans[clanId].burned = (this.data.clans[clanId].burned || 0) + amount;
        this.data.clans[clanId].dailyBurned = (this.data.clans[clanId].dailyBurned || 0) + amount;
        this.data.clans[clanId].allTimeBurned = (this.data.clans[clanId].allTimeBurned || 0) + amount;

        this.data.totalGlobalBurned = (this.data.totalGlobalBurned || 0) + amount;
        this.data.weeklyGlobalBurned = (this.data.weeklyGlobalBurned || 0) + amount;

        // V1.9.23 - Make sure "today" buckets are aligned to the current calendar day.
        this._rolloverDailyIfNeeded();

        // Update individual player burn record
        let player = this.data.players.find(p => p.name === playerName);
        if (player) {
            player.burned = (player.burned || 0) + amount;
            player.weeklyBurned = (player.weeklyBurned || 0) + amount;
            player.todayBurned = (player.todayBurned || 0) + amount;
            if (mode === 'COLLECTOR') {
                player.collectorBurned = (player.collectorBurned || 0) + amount;
            } else {
                player.storyBurned = (player.storyBurned || 0) + amount;
            }
            player.lastMode = mode;
            player.lastBurnTimestamp = Date.now();
            player.clan = clanId; // Sync clan
        } else {
            const newPlayer = {
                name: playerName,
                score: 0,
                burned: amount,
                weeklyBurned: amount,
                todayBurned: amount,
                collectorBurned: mode === 'COLLECTOR' ? amount : 0,
                storyBurned: mode === 'COLLECTOR' ? 0 : amount,
                lastMode: mode,
                lastBurnTimestamp: Date.now(),
                clan: clanId
            };
            this.data.players.push(newPlayer);
        }
        
        this.save();
        return { 
            isSignificant: amount >= 1000, 
            totalClanBurned: this.data.clans[clanId].burned 
        };
    }

    // V1.9.23 - Spore Collector leaderboard helpers. Returns sorted players for each window.
    getBurnLeaderboard(window = 'all', limit = 10) {
        this._rolloverDailyIfNeeded();
        const players = (this.data.players || []).map(p => ({
            name: p.name,
            clan: p.clan || 'myco',
            burned: p.burned || 0,
            todayBurned: p.todayBurned || 0,
            weeklyBurned: p.weeklyBurned || 0,
            collectorBurned: p.collectorBurned || 0,
            storyBurned: p.storyBurned || 0,
            lastMode: p.lastMode || 'STORY'
        }));
        const key = window === 'today' ? 'todayBurned'
                  : window === 'week'  ? 'weeklyBurned'
                                       : 'burned';
        return players
            .filter(p => (p[key] || 0) > 0)
            .sort((a, b) => (b[key] || 0) - (a[key] || 0))
            .slice(0, limit);
    }

    getBurnRankings() {
        return Object.entries(this.data.clans)
            .map(([id, data]) => ({
                id,
                burned: data.burned || 0,
                dailyBurned: data.dailyBurned || 0
            }))
            .sort((a, b) => b.burned - a.burned);
    }

    getPlayerBurnRankings() {
        return [...this.data.players]
            .sort((a, b) => (b.burned || 0) - (a.burned || 0))
            .slice(0, 10);
    }

    resetWeeklyBurns() {
        const timestamp = Date.now();
        const rankings = this.getBurnRankings();
        
        // Add to Hall of Fame
        if (rankings.length > 0 && (rankings[0].burned > 0)) {
            if (!this.data.hallOfFame) this.data.hallOfFame = [];
            this.data.hallOfFame.unshift({
                weekEnding: new Date().toLocaleDateString(),
                winner: rankings[0].id,
                runnerUp: rankings[1]?.id || 'none',
                winnerBurn: rankings[0].burned,
                timestamp: timestamp
            });
            // Keep only last 10 weeks
            this.data.hallOfFame = this.data.hallOfFame.slice(0, 10);
        }

        this.data.weeklyGlobalBurned = 0;
        this.data.players.forEach(p => p.weeklyBurned = 0);

        Object.keys(this.data.clans).forEach(id => {
            if (this.data.clans[id].burned) {
                this.data.clans[id].lastWeekBurned = this.data.clans[id].burned;
                this.data.clans[id].burned = 0;
            }
        });
        this.save();
    }

    resetDailyBurns() {
        Object.keys(this.data.clans).forEach(id => {
            if (this.data.clans[id].dailyBurned) {
                this.data.clans[id].dailyBurned = 0;
            }
        });
        this.save();
    }

    addScore(playerName, score, clanId, stats = {}) {
        const clan = this.data.clans[clanId] || { score: 0, count: 0, totalAlignment: 0, totalMagic: 0, totalBosses: 0, totalBlue: 0, totalGold: 0 };
        if (typeof clan === 'number') {
            // Migrating old data format
            this.data.clans[clanId] = { 
                score: clan + score, 
                count: 1, 
                totalAlignment: stats.alignment || 50, 
                totalMagic: stats.magicLearned || 0, 
                totalBosses: stats.bossesDefeated || 0,
                totalBlue: stats.blueCollected || 0,
                totalGold: stats.goldCollected || 0
            };
        } else {
            clan.score += score;
            clan.count = (clan.count || 0) + 1;
            clan.totalAlignment = (clan.totalAlignment || 0) + (stats.alignment || 50);
            clan.totalMagic = (clan.totalMagic || 0) + (stats.magicLearned || 0);
            clan.totalBosses = (clan.totalBosses || 0) + (stats.bossesDefeated || 0);
            clan.totalBlue = (clan.totalBlue || 0) + (stats.blueCollected || 0);
            clan.totalGold = (clan.totalGold || 0) + (stats.goldCollected || 0);
            this.data.clans[clanId] = clan;
        }

        let isTopScore = false;
        const playerIndex = this.data.players.findIndex(p => p.name === playerName);
        if (playerIndex !== -1) {
            if (score > this.data.players[playerIndex].score) {
                this.data.players[playerIndex].score = score;
            }
        } else {
            this.data.players.push({ name: playerName, score: score, clan: clanId });
        }
        this.data.players.sort((a, b) => b.score - a.score);
        
        const newRank = this.data.players.findIndex(p => p.name === playerName);
        if (newRank !== -1 && newRank < 5) {
            isTopScore = true;
        }

        this.data.players = this.data.players.slice(0, 10); 
        this.save();

        return { isTopScore, rank: newRank + 1 };
    }

    addThronecapTime(playerName, time, clanId, path = null) {
        if (!this.data.thronecapTimes) this.data.thronecapTimes = [];
        
        let isNewRecord = false;
        let isTop10 = false;
        let rank = -1;

        const existingIndex = this.data.thronecapTimes.findIndex(t => t.name === playerName);
        if (existingIndex !== -1) {
            if (time < this.data.thronecapTimes[existingIndex].time) {
                this.data.thronecapTimes[existingIndex].time = time;
                this.data.thronecapTimes[existingIndex].clan = clanId;
                this.data.thronecapTimes[existingIndex].date = Date.now();
                if (path) this.data.thronecapTimes[existingIndex].path = path;
                isNewRecord = true;
            }
        } else {
            this.data.thronecapTimes.push({ name: playerName, time, clan: clanId, date: Date.now(), path });
            isNewRecord = true;
        }
        
        this.data.thronecapTimes.sort((a, b) => a.time - b.time);
        
        const newIndex = this.data.thronecapTimes.findIndex(t => t.name === playerName);
        if (newIndex !== -1 && newIndex < 10) {
            isTop10 = true;
            rank = newIndex + 1;
        }

        this.data.thronecapTimes = this.data.thronecapTimes.slice(0, 10);
        this.save();

        return { isNewRecord, isTop10, rank };
    }

    getThronecapRankings() {
        return this.data.thronecapTimes || [];
    }

    getClanRankings() {
        return Object.entries(this.data.clans)
            .map(([id, data]) => {
                if (typeof data === 'number') return { id, score: data, avgAlignment: 50, avgMagic: 0, avgBosses: 0, totalBlue: 0, totalGold: 0 };
                const count = data.count || 1;
                return {
                    id,
                    score: data.score,
                    avgAlignment: Math.round(data.totalAlignment / count),
                    avgMagic: (data.totalMagic / count).toFixed(1),
                    avgBosses: (data.totalBosses / count).toFixed(1),
                    totalBlue: data.totalBlue || 0,
                    totalGold: data.totalGold || 0
                };
            })
            .sort((a, b) => b.score - a.score);
    }
}

class ProgressionManager {
    constructor() {
        this.storageKey = 'myco_quest_progression_v2';
        this.data = this.load();
    }

    load() {
        const saved = localStorage.getItem(this.storageKey);
        let data = saved ? JSON.parse(saved) : null;
        
        if (!data) {
            data = {
                level: 1,
                xp: 0,
                nextLevelXp: 1000,
                skillPoints: 0,
                upgrades: {
                    magicDamage: 0,
                    projectileCount: 0,
                    attackSpeed: 0,
                    moveSpeed: 0,
                    healthRegen: 0,
                    critStrike: 0,
                    fireTrail: 0,
                    royalSpore: 0,
                    fungalShield: 0,
                    mycelialNet: 0
                },
                blueSpores: 0,
                goldenSpores: 0,
                ingredients: 0,
                alignment: 50,
                clanChosen: null, // Permanent clan choice
                unlockedRegions: ['region8', 'mushroomKingdom'],
                currentRegionId: 'region8',
                shardsCollected: 0,
                inventory: ['fungal_blade'],
                keyItems: {}, // V1.9.12 - { keyItemId: count } for portal-unlocking items
                // V1.9.18 - Daily Rot Cycle. King Myco's conquered regions blight overnight
                // and must be cleansed with the wand before he can use any portal.
                conqueredRegions: {},      // { regionId: true } — region with a defeated boss
                regionRot: {},             // { regionId: 0..100 } — current rot percent
                lastDailyTick: null,       // YYYY-MM-DD key of the last daily blight pass
                lastCleanseDay: {},        // { regionId: 'YYYY-MM-DD' } — last day cleansed
                accessories: [], // Purchased accessory IDs
                equippedAccessories: {
                    cape: null,
                    crown: null
                },
                loreDiscovered: ['start'],
                playerPosition: null, // Saved {x, y, z}
                dailyBurnedAmount: 0,
                burnHistory: [],
                burnStreak: 0,
                lastBurnContribution: 0,
                lastBurnReset: Date.now(),
                lastWeeklyRewardClaimed: 0,
                settings: {
                    masterVolume: 1.0,
                    deadzone: 0.2, // Default deadzone calibrated for timed melee
                    keyBinds: {
                        forward: 'w',
                        backward: 's',
                        left: 'a',
                        right: 'd',
                        interact: 'e',
                        attack: ' ',
                        magic1: '1',
                        magic2: '2'
                    },
                    gamepadBinds: {
                        forward: 12, // D-pad Up
                        backward: 13, // D-pad Down
                        left: 14, // D-pad Left
                        right: 15, // D-pad Right
                        jump: 0, // A / Cross
                        interact: 3, // Y / Triangle
                        attack: 2, // X / Square
                        special: 1 // B / Circle
                    }
                },
                home: {
                    level: 1,
                    decorations: [],
                    storedItems: [],
                    storedWeapons: [],
                    forgeLevels: {
                        weapons: 0,
                        armor: 0
                    }
                },
                quests: {
                    goldenSpore: {
                        active: true,
                        progress: 0,
                        target: 10,
                        title: "Golden Restoration",
                        description: "Collect 10 Golden Spores to strengthen the Fungal Crown."
                    }
                },
                metChronicler: false,
                metNetworkGhost: false
            };
        }

        // Migration/Sanitization for existing saves
        if (data.metChronicler === undefined) data.metChronicler = false;
        if (data.metNetworkGhost === undefined) data.metNetworkGhost = false;
        if (data.loreDiscovered === undefined) data.loreDiscovered = ['start'];
        if (data.playerPosition === undefined) data.playerPosition = null;
        if (data.settings === undefined) {
            data.settings = {
                masterVolume: 1.0,
                deadzone: 0.15,
                keyBinds: {
                    forward: 'w',
                    backward: 's',
                    left: 'a',
                    right: 'd',
                    interact: 'e',
                    attack: ' ',
                    magic1: '1',
                    magic2: '2'
                },
                gamepadBinds: {
                    forward: 12, // D-pad Up
                    backward: 13, // D-pad Down
                    left: 14, // D-pad Left
                    right: 15, // D-pad Right
                    jump: 0, // A / Cross
                    interact: 3, // Y / Triangle
                    attack: 2, // X / Square
                    special: 1 // B / Circle
                },
                // V1.9.36 - Manual perf override for low-end devices. null = auto
                // (defer to UA/touch detection in Game3D.init()), true = force the
                // cheap renderer path, false = force the high-fi path. Useful when
                // (a) auto-detection guesses wrong, (b) a hot Telegram webview
                // throttles the GPU mid-session, or (c) a desktop user with an
                // integrated GPU wants the mobile budget.
                lowPerfMode: null
            };
        } else {
            if (data.settings.deadzone === undefined) data.settings.deadzone = 0.15;
            if (data.settings.lowPerfMode === undefined) data.settings.lowPerfMode = null;
            if (data.settings.gamepadBinds === undefined) {
                data.settings.gamepadBinds = {
                    forward: 12,
                    backward: 13,
                    left: 14,
                    right: 15,
                    jump: 0,
                    interact: 3,
                    attack: 2,
                    special: 1
                };
            }
        }
        if (!data.quests) {
            data.quests = {
                goldenSpore: {
                    active: true,
                    progress: 0,
                    target: 10,
                    title: "Golden Restoration",
                    description: "Collect 10 Golden Spores to strengthen the Fungal Crown."
                }
            };
        }
        if (!data.keyItems || typeof data.keyItems !== 'object') data.keyItems = {}; // V1.9.12 migration
        if (!data.home) data.home = { level: 1, decorations: [], storedItems: [], storedWeapons: [], forgeLevels: { weapons: 0, armor: 0 } };
        if (!data.home.forgeLevels) data.home.forgeLevels = { weapons: 0, armor: 0 };
        if (data.ingredients === undefined) data.ingredients = 0;
        if (data.dailyBurnedAmount === undefined) data.dailyBurnedAmount = 0;
        if (data.burnHistory === undefined) data.burnHistory = [];
        if (data.burnStreak === undefined) data.burnStreak = 0;
        if (data.lastBurnContribution === undefined) data.lastBurnContribution = 0;
        if (data.lastBurnReset === undefined) data.lastBurnReset = Date.now();
        if (data.lastWeeklyRewardClaimed === undefined) data.lastWeeklyRewardClaimed = 0;
        // V1.9.21 - Spore Collector mode persistence.
        if (data.gameMode === undefined) data.gameMode = null; // null = not yet chosen
        if (data.collectorDailyCap === undefined) data.collectorDailyCap = 1000;
        if (data.collectorDailyCollected === undefined) data.collectorDailyCollected = 0;
        if (data.collectorDailyKey === undefined) data.collectorDailyKey = null;
        
        // Reset daily burn if 24 hours passed
        if (Date.now() - data.lastBurnReset > 24 * 60 * 60 * 1000) {
            data.dailyBurnedAmount = 0;
            data.lastBurnReset = Date.now();
            if (window.game && window.game.leaderboard) {
                window.game.leaderboard.resetDailyBurns();
            }
        }
        
        return data;
    }

    save() {
        localStorage.setItem(this.storageKey, JSON.stringify(this.data));
    }

    addAlignment(amount) {
        this.data.alignment = Math.max(0, Math.min(100, this.data.alignment + amount));
        this.save();
    }

    addSpores(blue, gold, ingredients = 0) {
        // V1.9.21 - Spore Collector mode caps blue+gold spore intake at 1000/day and
        // ignores ingredients (no cooking loop). Story mode is unchanged.
        if (this.isCollectorMode()) {
            this._resetCollectorDailyIfNeeded();
            const remaining = Math.max(0, (this.data.collectorDailyCap || 1000) - (this.data.collectorDailyCollected || 0));
            const total = Math.max(0, (blue || 0) + (gold || 0));
            const allowed = Math.min(total, remaining);
            if (allowed > 0) {
                // Distribute proportionally so the visible split still feels right.
                const blueShare = total > 0 ? Math.round(allowed * ((blue || 0) / total)) : 0;
                const goldShare = allowed - blueShare;
                this.data.blueSpores += blueShare;
                this.data.goldenSpores += goldShare;
                this.data.collectorDailyCollected = (this.data.collectorDailyCollected || 0) + allowed;
            }
            this.save();
            return;
        }
        this.data.blueSpores += blue;
        this.data.goldenSpores += gold;
        this.data.ingredients += ingredients;
        this.save();
    }

    // V1.9.21 - Spore Collector mode helpers.
    isCollectorMode() {
        return this.data.gameMode === 'COLLECTOR';
    }
    setGameMode(mode) {
        this.data.gameMode = (mode === 'COLLECTOR') ? 'COLLECTOR' : 'STORY';
        if (this.data.gameMode === 'COLLECTOR') {
            if (!this.data.collectorDailyCap) this.data.collectorDailyCap = 1000;
            if (this.data.collectorDailyCollected == null) this.data.collectorDailyCollected = 0;
            if (!this.data.collectorDailyKey) this.data.collectorDailyKey = this._todayKey();
        }
        this.save();
    }
    _resetCollectorDailyIfNeeded() {
        const today = this._todayKey();
        if (this.data.collectorDailyKey !== today) {
            this.data.collectorDailyKey = today;
            this.data.collectorDailyCollected = 0;
            this.save();
        }
    }
    getCollectorRemainingToday() {
        this._resetCollectorDailyIfNeeded();
        const cap = this.data.collectorDailyCap || 1000;
        return Math.max(0, cap - (this.data.collectorDailyCollected || 0));
    }

    unlockRegion(regionId) {
        if (!this.data.unlockedRegions.includes(regionId)) {
            this.data.unlockedRegions.push(regionId);
            
            // Auto-unlock lore for regions
            if (regionId === 'sporewood') this.discoverLore('sporewood_restored');
            if (regionId === 'crystalcap') this.discoverLore('crystal_resonance');
            if (regionId === 'thronecap') this.discoverLore('dark_mycelius_origin');

            this.save();
        }
    }

    // V1.9.18 - Daily Rot Cycle helpers.
    _todayKey() {
        const d = new Date();
        return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    }
    markConquered(regionId) {
        if (!regionId) return;
        if (!this.data.conqueredRegions) this.data.conqueredRegions = {};
        this.data.conqueredRegions[regionId] = true;
        // Newly conquered regions start clean.
        if (!this.data.regionRot) this.data.regionRot = {};
        this.data.regionRot[regionId] = 0;
        if (!this.data.lastCleanseDay) this.data.lastCleanseDay = {};
        this.data.lastCleanseDay[regionId] = this._todayKey();
        this.save();
    }
    isConquered(regionId) {
        return !!(this.data.conqueredRegions && this.data.conqueredRegions[regionId]);
    }
    // Roll the daily blight forward if needed. Adds rot to every conquered region
    // whenever the calendar day flips. Returns true if a new day was processed.
    processDailyRot() {
        const today = this._todayKey();
        if (this.data.lastDailyTick === today) return false;
        if (!this.data.regionRot) this.data.regionRot = {};
        if (!this.data.lastCleanseDay) this.data.lastCleanseDay = {};
        const conq = this.data.conqueredRegions || {};
        // First boot: just seed today's key without immediately blighting.
        if (this.data.lastDailyTick == null) {
            this.data.lastDailyTick = today;
            this.save();
            return false;
        }
        Object.keys(conq).forEach(id => {
            const cur = this.data.regionRot[id] || 0;
            // +35% rot per skipped day, capped at 100. Multi-day skips compound but cap.
            this.data.regionRot[id] = Math.min(100, cur + 35);
            // Cleanse status resets to "not cleansed today".
            this.data.lastCleanseDay[id] = null;
        });
        this.data.lastDailyTick = today;
        this.save();
        return true;
    }
    setRegionRot(regionId, value) {
        if (!this.data.regionRot) this.data.regionRot = {};
        this.data.regionRot[regionId] = Math.max(0, Math.min(100, value));
        // Mark cleansed for today once rot drops below the threshold.
        if (this.data.regionRot[regionId] < 5) {
            if (!this.data.lastCleanseDay) this.data.lastCleanseDay = {};
            this.data.lastCleanseDay[regionId] = this._todayKey();
        }
        this.save();
    }
    getRegionRot(regionId) {
        return (this.data.regionRot && this.data.regionRot[regionId]) || 0;
    }
    // True iff a conquered region still has rot above the cleanse threshold today.
    hasPendingRot() {
        const conq = this.data.conqueredRegions || {};
        return Object.keys(conq).some(id => (this.data.regionRot[id] || 0) >= 10);
    }
    pendingRotRegions() {
        const conq = this.data.conqueredRegions || {};
        return Object.keys(conq).filter(id => (this.data.regionRot[id] || 0) >= 10);
    }

    // V1.9.12 - Inventory mutation for portal key items.
    addKeyItem(id, count = 1) {
        if (!this.data.keyItems) this.data.keyItems = {};
        this.data.keyItems[id] = (this.data.keyItems[id] || 0) + count;
        this.save();
        return this.data.keyItems[id];
    }

    hasKeyItem(id, count = 1) {
        return !!this.data.keyItems && (this.data.keyItems[id] || 0) >= count;
    }

    consumeKeyItem(id, count = 1) {
        if (!this.hasKeyItem(id, count)) return false;
        this.data.keyItems[id] -= count;
        if (this.data.keyItems[id] <= 0) delete this.data.keyItems[id];
        this.save();
        return true;
    }

    discoverLore(loreId) {
        if (!this.data.loreDiscovered) this.data.loreDiscovered = [];
        if (!this.data.loreDiscovered.includes(loreId)) {
            this.data.loreDiscovered.push(loreId);
            this.save();
            if (window.game) {
                window.game.showGlobalNotification(`LORE DISCOVERED: Check your Activity Log!`, '#ffaa00');
            }
        }
    }

    addXp(amount) {
        // V1.9.21 - Spore Collector mode: no XP, no levels, no skill points.
        if (this.isCollectorMode()) return false;
        this.data.xp += amount;
        let leveledUp = false;
        while (this.data.xp >= this.data.nextLevelXp) {
            this.data.xp -= this.data.nextLevelXp;
            this.data.level++;
            this.data.skillPoints = (this.data.skillPoints || 0) + 1;
            this.data.nextLevelXp = Math.floor(this.data.nextLevelXp * 1.5);
            leveledUp = true;
        }
        this.save();
        return leveledUp;
    }

    getRestorationProgress() {
        const totalRegions = CONFIG.REGIONS.filter(r => r.id !== 'region8' && r.id !== 'mushroomKingdom').length;
        const unlockedRegions = this.data.unlockedRegions.filter(id => id !== 'region8' && id !== 'mushroomKingdom').length;
        return Math.round((unlockedRegions / totalRegions) * 100);
    }
}

class Game3D {
    constructor() {
        // V1.9.9 - Expose the game instance globally so Player3D, NPCs, and inline UI handlers
        // can reach scene-wide state like the camera, audio synths, and HUD calls.
        window.game = this;

        // V1.9.12 - Install a stable global closeDialogue ASAP. The shopkeeper and portal
        // requirement modals render buttons with onclick="window.closeDialogue()", which used to
        // crash if the user opened one of those before any NPC dialogue had ever installed it.
        // showDialogue() can still overwrite it later for NPC-specific cleanup.
        if (typeof window.closeDialogue !== 'function') {
            window.closeDialogue = () => {
                try {
                    if (this.uiOverlay) this.uiOverlay.innerHTML = '';
                } catch (_) {}
                this.gameState = 'PLAYING';
                if (typeof this.startGameplay === 'function') this.startGameplay();
            };
        }
        // Same defensive default for the dialog-action globals so a missed wiring never crashes.
        if (typeof window.selectDialogue   !== 'function') window.selectDialogue   = () => {};
        if (typeof window.__shopkeeperPick !== 'function') window.__shopkeeperPick = () => {};
        if (typeof window.__portalEnter    !== 'function') window.__portalEnter    = () => window.closeDialogue();

        this.gameState = 'START_SCREEN'; 
        this.leaderboard = new LeaderboardManager();
        this.progression = new ProgressionManager();
        this.selectedClan = this.progression.data.clanChosen || 'myco';
        this.walletAddress = null;
        this.enemies = [];
        this.enemyProjectiles = [];
        this.collectibles = [];
        this.npcs = [];
        this.buildings = [];
        this.rotClusters = [];
        this.portals = [];
        this.areaLabels = [];
        this.nocturnalMushrooms = [];
        this.chests = [];
        this.traps = [];
        this.hazards = [];
        this.puzzlePillars = [];
        this.citadelGate = null;
        this.lootCount = 0;
        this.heartParticles = null;
        this.heartHum = null;
        this.heartPanner = null;
        
        // UI & Menu States
        this.isPaused = false;
        this.minimapVisible = true;
        this.hudMinimized = false;
        // V1.9.17 - Track last morality state so HUD can pulse on alignment shift.
        this.lastMoralState = null;
        this.activeInventoryTab = 'QUESTS'; // QUESTS, MAGIC, ITEMS, UPGRADES
        this.glitchIntensity = 0;
        this.isPuzzleSolved = false;
        this.hitStopFrames = 0;
        
        // Shared Audio - REFINED VOLUME FOR V1.8.4 MASTERING
        this.uiSynth = new TONE.Synth({ volume: -12 }).toDestination();
        this.cooldownSynth = new TONE.Synth({
            oscillator: { type: "triangle" },
            envelope: { attack: 0.01, decay: 0.1, sustain: 0.5, release: 0.2 },
            volume: -20
        }).toDestination();
        this.impactSynth = new TONE.NoiseSynth({ volume: -15 }).toDestination();
        this.burnSynth = new TONE.NoiseSynth({
            noise: { type: 'brown' },
            envelope: { attack: 0.1, decay: 0.8, sustain: 0 },
            volume: -18
        }).toDestination();
        this.chestSynth = new TONE.PolySynth({ volume: -15 }).toDestination();
        this.forgeSynth = new TONE.MembraneSynth({ volume: -10 }).toDestination();
        this.restSynth = new TONE.PolySynth({ volume: -12 }).toDestination();
        this.cookingSynth = new TONE.MembraneSynth({ volume: -15 }).toDestination();
        this.gateActivationSynth = new TONE.PolySynth({ 
            volume: -8,
            oscillator: { type: "triangle" }
        }).toDestination();

        this.isMuted = false;
        this.thronecapStartTime = null;
        this.lastGlobalEventTime = Date.now();
        this.timeOfDay = 8; // Start at 8 AM
        this.dayDuration = 240; // 240 seconds for a full 24h cycle
        this.currentWeather = 'CLEAR'; // CLEAR, SPORE_RAIN, NETWORK_FOG
        this.weatherIntensity = 0;
        this.weatherTargetIntensity = 0;
        this.weatherTimer = 0;
        this.currentRunPath = [];
        this.pathSampleTimer = 0;
        this.ghost = null;
        
        // Tooltip element
        this.tooltip = document.createElement('div');
        this.tooltip.style.cssText = `
            position: absolute;
            background: #000;
            border: 1px solid #39FF14;
            color: #39FF14;
            padding: 5px 10px;
            font-family: 'Press Start 2P', cursive;
            font-size: 8px;
            pointer-events: none;
            display: none;
            z-index: 9999;
            white-space: nowrap;
            box-shadow: 0 0 10px rgba(57, 255, 20, 0.5);
        `;
        document.body.appendChild(this.tooltip);

        // V1.9.35 — init() is async. If anything inside it throws (asset load,
        // WebGL context creation, Three.js setup, Solana shim, etc.) the
        // unhandled rejection would otherwise leave the user staring at a
        // black screen. Surface it instead.
        this.init().catch(err => {
            try {
                if (typeof _showBootError === 'function') {
                    _showBootError('Game3D.init() rejected', err);
                } else {
                    console.error('[BOOT ERROR] Game3D.init() rejected', err);
                }
            } catch (_) {}
        });
    }

    showTooltip(text, x, y) {
        this.tooltip.innerText = text;
        this.tooltip.style.display = 'block';
        this.tooltip.style.left = (x + 10) + 'px';
        this.tooltip.style.top = (y + 10) + 'px';
    }

    hideTooltip() {
        this.tooltip.style.display = 'none';
    }

    syncWithSolana() {
        this.showGlobalNotification("INITIATING CLOUD RESTORATION...", "#00ffff");
        this.uiSynth.triggerAttackRelease("C4", "8n");
        
        let progress = 0;
        const totalDuration = 5000; // 5 seconds
        const startTime = Date.now();
        
        const overlay = document.createElement('div');
        overlay.id = 'restoration-modal';
        overlay.style.cssText = `
            position: absolute;
            top: 0; left: 0; width: 100%; height: 100%;
            background: rgba(0,0,0,0.9);
            display: flex; flex-direction: column; justify-content: center; align-items: center;
            z-index: 10000; font-family: 'Press Start 2P', cursive; color: #00ffff;
            pointer-events: auto;
        `;
        document.body.appendChild(overlay);

        const title = document.createElement('h2');
        title.innerText = "SOLANA NETWORK SYNC";
        title.style.marginBottom = "30px";
        overlay.appendChild(title);

        const barContainer = document.createElement('div');
        barContainer.style.cssText = `
            width: 80%; max-width: 600px; height: 30px;
            border: 2px solid #00ffff; padding: 3px; position: relative;
        `;
        overlay.appendChild(barContainer);

        const bar = document.createElement('div');
        bar.style.cssText = `
            width: 0%; height: 100%; background: #00ffff;
            box-shadow: 0 0 15px #00ffff; transition: width 0.1s;
        `;
        barContainer.appendChild(bar);

        const milestoneLabel = document.createElement('p');
        milestoneLabel.style.cssText = `
            margin-top: 20px; font-size: 10px; color: #fff; text-align: center; line-height: 1.5;
        `;
        overlay.appendChild(milestoneLabel);

        const detailLabel = document.createElement('p');
        detailLabel.style.cssText = `
            margin-top: 10px; font-size: 8px; color: #666; text-align: center;
        `;
        overlay.appendChild(detailLabel);

        const updateSync = () => {
            const now = Date.now();
            const elapsed = now - startTime;
            progress = Math.min(100, (elapsed / totalDuration) * 100);
            
            bar.style.width = progress + '%';
            
            // Find current milestone
            const milestone = CONFIG.RESTORATION_MILESTONES.slice().reverse().find(m => progress >= m.progress) || CONFIG.RESTORATION_MILESTONES[0];
            milestoneLabel.innerText = `STATUS: ${milestone.label}`;
            detailLabel.innerText = milestone.desc;

            // Visual feedback in world
            this.glitchIntensity = Math.max(0, 0.5 - (progress / 100)); // Glitch recedes as we sync

            if (progress < 100) {
                requestAnimationFrame(updateSync);
            } else {
                setTimeout(() => {
                    overlay.remove();
                    this.showGlobalNotification("NETWORK FULLY CALIBRATED", "#39FF14");
                    this.uiSynth.triggerAttackRelease("C5", "4n");
                    // Refresh landmarks after sync
                    this.spawnRestorationLandmarks();
                    
                    // Restoration Burst Visual
                    if (this.player) {
                        this.showBossDefeatEffect(this.player.group.position);
                        this.showFloatingText("SYNCHRONIZED!", 0x00ffff, true);
                    }
                }, 1000);
            }
        };

        requestAnimationFrame(updateSync);
    }

    toggleSound() {
        this.isMuted = !this.isMuted;
        TONE.Destination.mute = this.isMuted;
        this.updateHud();
        this.uiSynth.triggerAttackRelease("C4", "16n");
    }

    togglePause() {
        if (this.gameState !== 'PLAYING' && this.gameState !== 'PAUSED') return;
        
        this.isPaused = !this.isPaused;
        this.gameState = this.isPaused ? 'PAUSED' : 'PLAYING';
        
        if (this.isPaused) {
            this.showInventoryMenu();
            this.uiSynth.triggerAttackRelease("G3", "16n");
        } else {
            this.startGameplay();
            this.uiSynth.triggerAttackRelease("C4", "16n");
        }
    }

    showSettingsMenu(mode = 'KEYBOARD') {
        const settings = this.progression.data.settings;
        const clanColor = this.getClanColor(this.selectedClan);
        
        const modeBtn = (id, label) => `
            <button onclick="window.game.showSettingsMenu('${id}')" style="
                flex: 1; 
                padding: 10px; 
                background: ${mode === id ? clanColor : '#222'}; 
                color: ${mode === id ? 'black' : 'white'}; 
                border: none; 
                font-family: inherit; 
                font-size: 8px; 
                cursor: pointer;
            ">
                ${label}
            </button>
        `;

        let mappingContent = '';
        if (mode === 'KEYBOARD') {
            mappingContent = `
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px; max-height: 200px; overflow-y: auto; padding-right: 10px;">
                    ${Object.entries(settings.keyBinds).map(([action, key]) => `
                        <div class="tooltip-trigger" data-tip="Click to remap ${action}" style="display: flex; justify-content: space-between; align-items: center; background: #111; padding: 10px; border: 1px solid #333;">
                            <span style="font-size: 8px; color: #888;">${action.toUpperCase()}</span>
                            <button class="keybind-btn" data-action="${action}" style="background: #222; border: 1px solid ${clanColor}; color: ${clanColor}; font-size: 8px; padding: 5px 10px; cursor: pointer; min-width: 60px;">
                                ${key === ' ' ? 'SPACE' : key.toUpperCase()}
                            </button>
                        </div>
                    `).join('')}
                </div>
            `;
        } else {
            // Gamepad names
            const gpNames = {
                0: 'A / Cross', 1: 'B / Circle', 2: 'X / Square', 3: 'Y / Triangle',
                4: 'L1 / LB', 5: 'R1 / RB', 6: 'L2 / LT', 7: 'R2 / RT',
                8: 'Select', 9: 'Start', 10: 'L3', 11: 'R3',
                12: 'D-Pad Up', 13: 'D-Pad Down', 14: 'D-Pad Left', 15: 'D-Pad Right'
            };

            mappingContent = `
                <div style="margin-bottom: 20px;">
                    <p style="font-size: 10px; color: #fff; margin-bottom: 15px;">STICK DEADZONE: ${Math.round(settings.deadzone * 100)}%</p>
                    <input type="range" id="deadzone-slider-init" min="0" max="0.5" step="0.01" value="${settings.deadzone}" style="width: 100%; cursor: pointer; accent-color: ${clanColor};">
                </div>
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px; max-height: 200px; overflow-y: auto; padding-right: 10px;">
                    ${Object.entries(settings.gamepadBinds).map(([action, btnIdx]) => `
                        <div class="tooltip-trigger" data-tip="Click to remap ${action}" style="display: flex; justify-content: space-between; align-items: center; background: #111; padding: 10px; border: 1px solid #333;">
                            <span style="font-size: 8px; color: #888;">${action.toUpperCase()}</span>
                            <button class="gpbind-btn" data-action="${action}" style="background: #222; border: 1px solid ${clanColor}; color: ${clanColor}; font-size: 8px; padding: 5px 10px; cursor: pointer; min-width: 60px;">
                                ${gpNames[btnIdx] || 'BTN ' + btnIdx}
                            </button>
                        </div>
                    `).join('')}
                </div>
                <p style="font-size: 7px; color: #666; margin-top: 10px;">Connect gamepad and press a button to remap.</p>
            `;
        }

        this.uiOverlay.innerHTML = `
            <div style="pointer-events: auto; background: rgba(0,0,0,0.95); width: 100%; height: 100%; display: flex; justify-content: center; align-items: center; font-family: 'Press Start 2P', cursive;">
                <div style="background: #050505; border: 4px solid ${clanColor}; width: 80%; max-width: 600px; padding: 30px; box-shadow: 0 0 30px ${clanColor};">
                    <h2 style="color: ${clanColor}; font-size: 18px; margin-bottom: 30px; text-align: center;">NETWORK CONFIG</h2>
                    
                    <div style="margin-bottom: 20px;">
                        <h3 style="color: #fff; font-size: 10px; margin-bottom: 15px;">MASTER RESONANCE: ${Math.round(settings.masterVolume * 100)}%</h3>
                        <input type="range" id="volume-slider" min="0" max="1" step="0.01" value="${settings.masterVolume}" style="width: 100%; cursor: pointer; accent-color: ${clanColor};">
                    </div>

                    <div style="display: flex; gap: 10px; margin-bottom: 15px;">
                        ${modeBtn('KEYBOARD', 'KEYBOARD')}
                        ${modeBtn('GAMEPAD', 'GAMEPAD')}
                    </div>

                    <div style="margin-bottom: 30px;">
                        ${mappingContent}
                    </div>

                    <div style="display: flex; gap: 10px;">
                        <button id="save-settings" style="flex: 1; padding: 15px; background: ${clanColor}; border: none; font-family: inherit; cursor: pointer; color: black; font-size: 10px;">APPLY & CLOSE</button>
                    </div>
                </div>
            </div>
        `;

        const volumeSlider = document.getElementById('volume-slider');
        volumeSlider.addEventListener('input', (e) => {
            const vol = parseFloat(e.target.value);
            settings.masterVolume = vol;
            TONE.Destination.volume.value = TONE.gainToDb(vol);
            const label = volumeSlider.previousElementSibling;
            if (label) label.innerText = `MASTER RESONANCE: ${Math.round(vol * 100)}%`;
        });

        const deadzoneSlider = document.getElementById('deadzone-slider-init');
        if (deadzoneSlider) {
            deadzoneSlider.addEventListener('input', (e) => {
                const val = parseFloat(e.target.value);
                settings.deadzone = val;
                const label = deadzoneSlider.previousElementSibling;
                if (label) label.innerText = `STICK DEADZONE: ${Math.round(val * 100)}%`;
            });
        }

        // Tooltips for this menu
        const triggers = document.querySelectorAll('.tooltip-trigger');
        triggers.forEach(t => {
            t.addEventListener('mouseenter', (e) => this.showTooltip(t.dataset.tip, e.clientX, e.clientY));
            t.addEventListener('mousemove', (e) => this.showTooltip(t.dataset.tip, e.clientX, e.clientY));
            t.addEventListener('mouseleave', () => this.hideTooltip());
        });

        if (mode === 'KEYBOARD') {
            const bindButtons = document.querySelectorAll('.keybind-btn');
            bindButtons.forEach(btn => {
                btn.addEventListener('click', () => {
                    const action = btn.dataset.action;
                    btn.innerText = '???';
                    btn.style.background = clanColor;
                    btn.style.color = 'black';

                    const onKeyDown = (e) => {
                        e.preventDefault();
                        settings.keyBinds[action] = e.key.toLowerCase();
                        btn.innerText = e.key === ' ' ? 'SPACE' : e.key.toUpperCase();
                        btn.style.background = '#222';
                        btn.style.color = clanColor;
                        window.removeEventListener('keydown', onKeyDown);
                        this.player.updateKeyBinds(settings.keyBinds);
                    };
                    window.addEventListener('keydown', onKeyDown, { once: true });
                });
            });
        } else {
            const bindButtons = document.querySelectorAll('.gpbind-btn');
            bindButtons.forEach(btn => {
                btn.addEventListener('click', () => {
                    const action = btn.dataset.action;
                    btn.innerText = 'WAITING...';
                    btn.style.background = clanColor;
                    btn.style.color = 'black';

                    let scanning = true;
                    const scanGamepad = () => {
                        if (!scanning) return;
                        const gamepads = navigator.getGamepads ? navigator.getGamepads() : [];
                        const gp = gamepads[0];
                        if (gp) {
                            for (let i = 0; i < gp.buttons.length; i++) {
                                if (gp.buttons[i].pressed) {
                                    settings.gamepadBinds[action] = i;
                                    const gpNames = {
                                        0: 'A / Cross', 1: 'B / Circle', 2: 'X / Square', 3: 'Y / Triangle',
                                        4: 'L1 / LB', 5: 'R1 / RB', 6: 'L2 / LT', 7: 'R2 / RT',
                                        8: 'Select', 9: 'Start', 10: 'L3', 11: 'R3',
                                        12: 'D-Pad Up', 13: 'D-Pad Down', 14: 'D-Pad Left', 15: 'D-Pad Right'
                                    };
                                    btn.innerText = gpNames[i] || 'BTN ' + i;
                                    btn.style.background = '#222';
                                    btn.style.color = clanColor;
                                    scanning = false;
                                    this.player.updateGamepadBinds(settings.gamepadBinds);
                                    return;
                                }
                            }
                        }
                        requestAnimationFrame(scanGamepad);
                    };
                    requestAnimationFrame(scanGamepad);
                });
            });
        }

        document.getElementById('save-settings').addEventListener('click', () => {
            this.progression.save();
            if (this.isPaused) {
                this.showInventoryMenu();
            } else {
                this.setupStartScreen();
            }
        });
    }

    saveGame() {
        const p = this.progression.data;
        const pos = this.player.group.position;
        p.playerPosition = { x: pos.x, y: pos.y, z: pos.z };
        
        this.progression.save();
        this.leaderboard.save();
        
        this.showGlobalNotification("GAME PROGRESS SAVED", "#39FF14");
        this.uiSynth.triggerAttackRelease("C5", "16n");
        
        if (this.isPaused) {
            this.showInventoryMenu(); // Refresh menu
        }
    }

    toggleMinimap() {
        this.minimapVisible = !this.minimapVisible;
        this.updateHud();
        this.uiSynth.triggerAttackRelease("E4", "16n");
    }

    toggleHud() {
        this.hudMinimized = !this.hudMinimized;
        this.updateHud();
        this.uiSynth.triggerAttackRelease("C4", "16n");
    }

    getSettingsContent(mode = 'KEYBOARD') {
        const settings = this.progression.data.settings;
        const clanColor = this.getClanColor(this.selectedClan);
        
        const modeBtn = (id, label) => `
            <button onclick="window.setSettingsMode('${id}')" style="
                flex: 1; 
                padding: 8px; 
                background: ${mode === id ? clanColor : '#111'}; 
                color: ${mode === id ? 'black' : 'white'}; 
                border: 1px solid #333; 
                font-family: inherit; 
                font-size: 7px; 
                cursor: pointer;
            ">
                ${label}
            </button>
        `;

        let mappingContent = '';
        if (mode === 'KEYBOARD') {
            mappingContent = `
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px; max-height: 250px; overflow-y: auto; padding-right: 5px;">
                    ${Object.entries(settings.keyBinds).map(([action, key]) => `
                        <div class="tooltip-trigger" data-tip="Click to remap ${action}" style="display: flex; justify-content: space-between; align-items: center; background: #111; padding: 8px; border: 1px solid #333;">
                            <span style="font-size: 7px; color: #666;">${action.toUpperCase()}</span>
                            <button class="keybind-btn-tab" data-action="${action}" style="background: #222; border: 1px solid ${clanColor}; color: ${clanColor}; font-size: 7px; padding: 4px 8px; cursor: pointer; min-width: 50px;">
                                ${key === ' ' ? 'SPACE' : key.toUpperCase()}
                            </button>
                        </div>
                    `).join('')}
                </div>
            `;
        } else {
            const gpNames = {
                0: 'A / Cross', 1: 'B / Circle', 2: 'X / Square', 3: 'Y / Triangle',
                4: 'L1 / LB', 5: 'R1 / RB', 6: 'L2 / LT', 7: 'R2 / RT',
                8: 'Select', 9: 'Start', 10: 'L3', 11: 'R3',
                12: 'D-Pad Up', 13: 'D-Pad Down', 14: 'D-Pad Left', 15: 'D-Pad Right'
            };

            mappingContent = `
                <div style="margin-bottom: 15px;">
                    <p style="font-size: 8px; color: #888; margin-bottom: 10px;">STICK DEADZONE: ${Math.round(settings.deadzone * 100)}%</p>
                    <input type="range" id="deadzone-slider" min="0" max="0.5" step="0.01" value="${settings.deadzone}" style="width: 100%; cursor: pointer; accent-color: ${clanColor};">
                </div>
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px; max-height: 250px; overflow-y: auto; padding-right: 5px;">
                    ${Object.entries(settings.gamepadBinds).map(([action, btnIdx]) => `
                        <div class="tooltip-trigger" data-tip="Click to remap ${action}" style="display: flex; justify-content: space-between; align-items: center; background: #111; padding: 8px; border: 1px solid #333;">
                            <span style="font-size: 7px; color: #666;">${action.toUpperCase()}</span>
                            <button class="gpbind-btn-tab" data-action="${action}" style="background: #222; border: 1px solid ${clanColor}; color: ${clanColor}; font-size: 7px; padding: 4px 8px; cursor: pointer; min-width: 50px;">
                                ${gpNames[btnIdx] || 'BTN ' + btnIdx}
                            </button>
                        </div>
                    `).join('')}
                </div>
            `;
        }

        return `
            <div style="padding: 20px;">
                <h3 style="color: ${clanColor}; font-size: 12px; margin-bottom: 20px;">SYSTEM CALIBRATION</h3>
                
                <div style="margin-bottom: 20px;">
                    <p style="font-size: 8px; color: #888; margin-bottom: 10px;">MASTER RESONANCE: ${Math.round(settings.masterVolume * 100)}%</p>
                    <input type="range" id="volume-slider-tab" min="0" max="1" step="0.01" value="${settings.masterVolume}" style="width: 100%; cursor: pointer; accent-color: ${clanColor};">
                </div>

                <div style="display: flex; gap: 8px; margin-bottom: 15px;">
                    ${modeBtn('KEYBOARD', 'KEYBOARD')}
                    ${modeBtn('GAMEPAD', 'GAMEPAD')}
                </div>

                <div style="margin-bottom: 10px;">
                    ${mappingContent}
                </div>

                <div style="margin-top: 20px; border-top: 1px solid #333; padding-top: 15px;">
                    <button onclick="window.game.syncWithSolana()" class="tooltip-trigger" data-tip="Sync progress to the Solana network" style="width: 100%; padding: 10px; background: #00ffff; border: none; font-family: inherit; font-size: 8px; cursor: pointer; color: #000;">
                        SYNC WITH SOLANA (MOCK)
                    </button>
                </div>
            </div>
        `;
    }

    attachSettingsHandlers(mode = 'KEYBOARD') {
        if (this.activeInventoryTab !== 'SETTINGS') return;
        
        const settings = this.progression.data.settings;
        const clanColor = this.getClanColor(this.selectedClan);

        window.setSettingsMode = (newMode) => {
            this.showInventoryMenu(newMode);
        };

        const volumeSlider = document.getElementById('volume-slider-tab');
        if (volumeSlider) {
            volumeSlider.addEventListener('input', (e) => {
                const vol = parseFloat(e.target.value);
                settings.masterVolume = vol;
                TONE.Destination.volume.value = TONE.gainToDb(vol);
                this.progression.save();
                const label = volumeSlider.previousElementSibling;
                if (label) label.innerText = `MASTER RESONANCE: ${Math.round(vol * 100)}%`;
            });
        }

        const deadzoneSlider = document.getElementById('deadzone-slider');
        if (deadzoneSlider) {
            deadzoneSlider.addEventListener('input', (e) => {
                const val = parseFloat(e.target.value);
                settings.deadzone = val;
                this.progression.save();
                const label = deadzoneSlider.previousElementSibling;
                if (label) label.innerText = `STICK DEADZONE: ${Math.round(val * 100)}%`;
            });
        }

        // Attach tooltips
        const triggers = document.querySelectorAll('.tooltip-trigger');
        triggers.forEach(t => {
            t.addEventListener('mouseenter', (e) => {
                this.showTooltip(t.dataset.tip, e.clientX, e.clientY);
            });
            t.addEventListener('mousemove', (e) => {
                this.showTooltip(t.dataset.tip, e.clientX, e.clientY);
            });
            t.addEventListener('mouseleave', () => {
                this.hideTooltip();
            });
        });

        if (mode === 'KEYBOARD') {
            const bindButtons = document.querySelectorAll('.keybind-btn-tab');
            bindButtons.forEach(btn => {
                btn.addEventListener('click', () => {
                    const action = btn.dataset.action;
                    btn.innerText = '???';
                    btn.style.background = clanColor;
                    btn.style.color = 'black';

                    const onKeyDown = (e) => {
                        e.preventDefault();
                        settings.keyBinds[action] = e.key.toLowerCase();
                        btn.innerText = e.key === ' ' ? 'SPACE' : e.key.toUpperCase();
                        btn.style.background = '#222';
                        btn.style.color = clanColor;
                        window.removeEventListener('keydown', onKeyDown);
                        this.progression.save();
                        this.player.updateKeyBinds(settings.keyBinds);
                    };
                    window.addEventListener('keydown', onKeyDown, { once: true });
                });
            });
        } else {
            const bindButtons = document.querySelectorAll('.gpbind-btn-tab');
            bindButtons.forEach(btn => {
                btn.addEventListener('click', () => {
                    const action = btn.dataset.action;
                    btn.innerText = 'WAITING...';
                    btn.style.background = clanColor;
                    btn.style.color = 'black';

                    let scanning = true;
                    const scanGamepad = () => {
                        if (!scanning) return;
                        const gamepads = navigator.getGamepads ? navigator.getGamepads() : [];
                        const gp = gamepads[0];
                        if (gp) {
                            for (let i = 0; i < gp.buttons.length; i++) {
                                if (gp.buttons[i].pressed) {
                                    settings.gamepadBinds[action] = i;
                                    const gpNames = {
                                        0: 'A / Cross', 1: 'B / Circle', 2: 'X / Square', 3: 'Y / Triangle',
                                        4: 'L1 / LB', 5: 'R1 / RB', 6: 'L2 / LT', 7: 'R2 / RT',
                                        8: 'Select', 9: 'Start', 10: 'L3', 11: 'R3',
                                        12: 'D-Pad Up', 13: 'D-Pad Down', 14: 'D-Pad Left', 15: 'D-Pad Right'
                                    };
                                    btn.innerText = gpNames[i] || 'BTN ' + i;
                                    btn.style.background = '#222';
                                    btn.style.color = clanColor;
                                    scanning = false;
                                    this.progression.save();
                                    this.player.updateGamepadBinds(settings.gamepadBinds);
                                    return;
                                }
                            }
                        }
                        requestAnimationFrame(scanGamepad);
                    };
                    requestAnimationFrame(scanGamepad);
                });
            });
        }
    }

    showInventoryMenu(settingsMode = 'KEYBOARD') {
        const p = this.progression.data;
        const clanColor = this.getClanColor(this.selectedClan);
        
        const renderTabButton = (id, label) => `
            <button onclick="window.setInventoryTab('${id}')" style="
                flex: 1; 
                padding: 10px; 
                background: ${this.activeInventoryTab === id ? clanColor : '#222'}; 
                color: ${this.activeInventoryTab === id ? 'black' : 'white'}; 
                border: none; 
                font-family: inherit; 
                font-size: 10px; 
                cursor: pointer;
                border-top: 2px solid ${clanColor};
            ">
                ${label}
            </button>
        `;

        let content = '';
        if (this.activeInventoryTab === 'MAP') {
            content = `
                <div style="padding: 20px; text-align: center;">
                    <h3 style="color: #39FF14; margin-bottom: 20px;">WORLD MAP</h3>
                    <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px;">
                        ${CONFIG.REGIONS.map(reg => {
                            const isUnlocked = p.unlockedRegions.includes(reg.id);
                            const isCurrent = this.currentRegion.id === reg.id;
                            return `
                                <div style="background: ${isCurrent ? '#39FF14' : '#111'}; border: 1px solid ${isUnlocked ? reg.accent : '#333'}; padding: 10px; color: ${isCurrent ? 'black' : 'white'}; opacity: ${isUnlocked ? 1 : 0.5};">
                                    <p style="font-size: 8px;">${reg.name.toUpperCase()}</p>
                                    <p style="font-size: 6px;">${isUnlocked ? (isCurrent ? '[HERE]' : '[UNLOCKED]') : '[LOCKED]'}</p>
                                </div>
                            `;
                        }).join('')}
                    </div>
                </div>
            `;
        } else if (this.activeInventoryTab === 'INVENTORY') {
            const otherItems = p.inventory.filter(id => !CONFIG.MAGIC.some(m => m.id === id) && !CONFIG.WEAPONS.some(w => w.id === id));
            content = `
                <div style="padding: 20px;">
                    <h3 style="color: #39FF14; font-size: 12px; margin-bottom: 10px;">SUPPLIES</h3>
                    <div style="max-height: 300px; overflow-y: auto;">
                        ${otherItems.length > 0 ? otherItems.map(id => {
                            const item = CONFIG.SUPPLIES.find(i => i.id === id) || { name: id, desc: 'A mysterious fungal object.' };
                            return `
                                <div style="background: #111; border: 1px solid #333; padding: 8px; margin-bottom: 5px;">
                                    <p style="font-size: 10px; color: #39FF14;">${item.name.toUpperCase()}</p>
                                    <p style="font-size: 7px; color: #666;">${item.desc}</p>
                                </div>
                            `;
                        }).join('') : '<p style="font-size: 10px; color: #444; text-align: center;">Inventory empty.</p>'}
                    </div>
                </div>
            `;
        } else if (this.activeInventoryTab === 'SPORES') {
            content = `
                <div style="padding: 20px;">
                    <h3 style="color: #39FF14; font-size: 12px; margin-bottom: 20px;">CURRENCY</h3>
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px;">
                        <div style="background: rgba(0,255,255,0.1); padding: 20px; border: 1px solid #00ffff; text-align: center;">
                            <p style="font-size: 10px; color: #00ffff;">BLUE SPORES</p>
                            <p style="font-size: 24px; color: white;">${p.blueSpores}</p>
                        </div>
                        <div style="background: rgba(255,255,0,0.1); padding: 20px; border: 1px solid #ffff00; text-align: center;">
                            <p style="font-size: 10px; color: #ffff00;">GOLDEN SPORES</p>
                            <p style="font-size: 24px; color: white;">${p.goldenSpores}</p>
                        </div>
                    </div>
                </div>
            `;
        } else if (this.activeInventoryTab === 'MAGIC') {
            const learnedMagic = p.inventory.filter(id => CONFIG.MAGIC.some(m => m.id === id));
            content = `
                <div style="padding: 20px;">
                    <h3 style="color: #00ffff; font-size: 12px; margin-bottom: 20px;">KNOWN SPELLS</h3>
                    <div style="display: grid; gap: 10px;">
                        ${learnedMagic.length > 0 ? learnedMagic.map(id => {
                            const m = CONFIG.MAGIC.find(item => item.id === id);
                            return `
                                <div style="background: rgba(0,255,255,0.05); border-left: 4px solid #00ffff; padding: 15px;">
                                    <p style="font-size: 12px; color: #00ffff; margin-bottom: 5px;">${m.name.toUpperCase()}</p>
                                    <p style="font-size: 8px; color: #888;">${m.desc}</p>
                                </div>
                            `;
                        }).join('') : '<p style="font-size: 10px; color: #444; text-align: center;">No magic learned yet.</p>'}
                    </div>
                </div>
            `;
        } else if (this.activeInventoryTab === 'LOG') {
            const discoveredLore = p.loreDiscovered || [];
            content = `
                <div style="padding: 20px; text-align: left;">
                    <h3 style="color: #ffaa00; font-size: 12px; margin-bottom: 20px;">ACTIVITY LOG & LORE</h3>
                    <div style="max-height: 350px; overflow-y: auto; font-size: 9px; line-height: 1.6; color: #ccc;">
                        ${discoveredLore.map(id => {
                            const entry = CONFIG.LORE.find(l => l.id === id);
                            if (!entry) return '';
                            return `
                                <div style="margin-bottom: 20px; border-bottom: 1px solid #222; padding-bottom: 10px;">
                                    <p style="color: #ffaa00; font-weight: bold; margin-bottom: 5px;">[${entry.title.toUpperCase()}]</p>
                                    <p>${entry.text}</p>
                                </div>
                            `;
                        }).join('')}
                        ${p.metChronicler ? '<p style="margin-bottom: 15px; border-bottom: 1px solid #222; padding-bottom: 5px;"><span style="color: #00ffff;">[CHRONICLER]:</span> The Crown was a network transmitter. Shards are held by corrupted echoes.</p>' : ''}
                        ${p.metNetworkGhost ? '<p style="margin-bottom: 15px; border-bottom: 1px solid #222; padding-bottom: 5px;"><span style="color: #aa00ff;">[VOID GHOST]:</span> The Rot is an uploaded virus. Dark Mycelius is a glitch.</p>' : ''}
                        ${p.shardsCollected > 0 ? `<p style="margin-bottom: 15px; border-bottom: 1px solid #222; padding-bottom: 5px;"><span style="color: #ffff00;">[SYSTEM]:</span> ${p.shardsCollected} Crown Shards reclaimed.</p>` : ''}
                        <p style="color: #444;">More lore entries will appear as you explore...</p>
                    </div>
                </div>
            `;
        }

        this.uiOverlay.innerHTML = `
            <div style="pointer-events: auto; background: rgba(0,0,0,0.95); width: 100%; height: 100%; display: flex; justify-content: center; align-items: center; font-family: 'Press Start 2P', cursive;">
                <div style="background: #050505; border: 4px solid ${clanColor}; width: 90%; max-width: 900px; box-shadow: 0 0 30px ${clanColor};">
                    <div style="padding: 20px; background: ${clanColor}; color: black; display: flex; justify-content: space-between; align-items: center;">
                        <h2 style="font-size: 18px; margin: 0;">PAUSED</h2>
                        <span style="font-size: 10px;">KING MYCO'S JOURNEY</span>
                    </div>
                    
                    <div style="display: flex; flex-wrap: wrap;">
                        ${renderTabButton('MAP', 'MAP')}
                        ${renderTabButton('INVENTORY', 'INV')}
                        ${renderTabButton('SPORES', 'SPORES')}
                        ${renderTabButton('MAGIC', 'MAGIC')}
                        ${renderTabButton('LOG', 'LOG')}
                        ${renderTabButton('ACCESSORIES', 'ROYAL')}
                        ${renderTabButton('SETTINGS', 'SET')}
                    </div>
                    
                    <div style="min-height: 450px; color: white;">
                        ${this.activeInventoryTab === 'SETTINGS' ? this.getSettingsContent(settingsMode) : (this.activeInventoryTab === 'ACCESSORIES' ? this.getAccessoriesContent() : content)}
                    </div>
                    
                    <div style="padding: 20px; border-top: 1px solid #222; display: flex; gap: 10px; flex-wrap: wrap;">
                        <button onclick="window.game.togglePause()" style="flex: 2; padding: 15px; background: #39FF14; border: none; font-family: inherit; cursor: pointer; color: black;">RESUME</button>
                        <button onclick="window.game.saveGame()" style="flex: 1; padding: 15px; background: #00ffff; border: none; font-family: inherit; cursor: pointer; color: black;">SAVE</button>
                        <button onclick="location.reload()" style="padding: 15px; background: #ff0000; border: none; font-family: inherit; cursor: pointer; color: white;">QUIT</button>
                    </div>
                </div>
            </div>
        `;

        this.attachSettingsHandlers(settingsMode);

        window.setInventoryTab = (tab) => {
            this.activeInventoryTab = tab;
            this.showInventoryMenu();
            this.uiSynth.triggerAttackRelease("D4", "16n");
        };
    }

    // V1.9.8 Free Stride - Remove obstacles around the spawn so the player can never wake up stuck.
    clearSpawnArea(center, radius = 6) {
        const removeIfClose = (obj, list) => {
            const p = obj.position || (obj.mesh && obj.mesh.position) || (obj.group && obj.group.position);
            if (!p) return false;
            const dx = p.x - center.x;
            const dz = p.z - center.z;
            if (dx * dx + dz * dz < radius * radius) {
                if (obj.destroy) obj.destroy(); else this.scene.remove(obj);
                return true;
            }
            return false;
        };

        if (this.collidables) {
            this.collidables = this.collidables.filter(obj => {
                const dx = obj.position.x - center.x;
                const dz = obj.position.z - center.z;
                if (dx * dx + dz * dz < radius * radius) {
                    this.scene.remove(obj);
                    return false;
                }
                return true;
            });
        }
        if (this.rotClusters) this.rotClusters = this.rotClusters.filter(c => !removeIfClose(c));
        if (this.hazards)     this.hazards     = this.hazards.filter(h => !removeIfClose(h));
        if (this.traps)       this.traps       = this.traps.filter(t => !removeIfClose(t));
    }

    // V1.9.8 Free Stride - On-screen confirmation that keyboard input is flowing.
    setupInputDebugOverlay() {
        const box = document.createElement('div');
        box.id = 'input-debug-hud';
        box.style.cssText = `
            position: absolute; left: 20px; bottom: 20px;
            background: rgba(0,0,0,0.75); border: 2px solid #39FF14;
            padding: 8px 10px; color: #39FF14;
            font-family: "Press Start 2P", cursive; font-size: 8px;
            line-height: 1.6; z-index: 1500; min-width: 150px;
            box-shadow: 0 0 10px rgba(57,255,20,0.3);
        `;
        box.innerHTML = `
            <div style="color:#fff; margin-bottom:4px;">CONTROLS ACTIVE</div>
            <div id="idh-line1">↑ / W <span id="idh-fwd">·</span> &nbsp; ↓ / S <span id="idh-back">·</span></div>
            <div id="idh-line2">← / A <span id="idh-left">·</span> &nbsp; → / D <span id="idh-right">·</span></div>
            <div id="idh-line3">SPACE <span id="idh-jump">·</span></div>
            <div id="idh-pos" style="color:#888; margin-top:4px;">x:0 z:0</div>
        `;
        document.getElementById('game-container').appendChild(box);
        this.inputDebugHud = box;
    }

    updateInputDebugHud() {
        if (!this.inputDebugHud || !this.player) return;
        const k = this.player.keys;
        const dot = (on) => on ? '<span style="color:#39FF14;">●</span>' : '<span style="color:#444;">·</span>';
        const set = (id, v) => { const el = document.getElementById(id); if (el) el.innerHTML = v; };
        set('idh-fwd',  dot(k.forward));
        set('idh-back', dot(k.backward));
        set('idh-left', dot(k.left));
        set('idh-right',dot(k.right));
        set('idh-jump', dot(k.jump));
        const p = this.player.group.position;
        set('idh-pos', `x:${p.x.toFixed(1)} z:${p.z.toFixed(1)}`);
    }

    async init() {
        this.scene = new THREE.Scene();
        this.isInterior = false; 
        this.potParticles = [];
        this.potParticleGroup = null;
        this.potPos = null;
        
        // Roblox Camera variables - third-person from behind and slightly above.
        this.cameraDist = 9;
        this.cameraTargetDist = 9;
        this.cameraYaw = 0;
        this.cameraPitch = -0.35;
        this.isRightMouseDown = false;
        
        this.currentRegion = CONFIG.REGIONS.find(r => r.id === this.progression.data.currentRegionId) || CONFIG.REGIONS[0];

        // V1.9.18 - Roll the daily Rot Cycle forward. If the calendar day has flipped
        // since last play, every conquered region picks up +35% blight that the wand
        // must cleanse before King Myco can use any portal again.
        const rotAdvanced = this.progression.processDailyRot();
        if (rotAdvanced) {
            // Defer the announcement until the HUD exists.
            setTimeout(() => {
                try { this.showFloatingText('THE ROT HAS SPREAD OVERNIGHT', 0xaa00ff, true); } catch (_) {}
            }, 1500);
        }
        // Per-region rot props tracked in scene for cleansing + visual spread.
        this.rotProps = [];
        this._rotSpreadTick = 0;
        // V1.9.20 - Active rot-purifying Light Pools the player can drop with F.
        this.lightPools = [];
        this._lightPoolLastDrop = 0;
        // Wall-clock check every 60s to catch midnight rollover during long sessions.
        this._dailyTickInterval = setInterval(() => {
            if (this.progression.processDailyRot()) {
                try { this.showFloatingText('A NEW DAY — THE ROT RETURNS', 0xaa00ff, true); } catch (_) {}
                this.syncRegionRotToVisuals();
                // V1.9.19 - Re-evaluate rot-infected spawns now that rot just jumped.
                if (typeof this.spawnRotInfectedForRegion === 'function') {
                    this.spawnRotInfectedForRegion();
                }
                this.updateHud();
            }
        }, 60000);

        if (this.currentRegion.id === 'thronecap') {
            this.thronecapStartTime = Date.now();
            this.spawnGhost();
        }
        
        this.applyRegionEnvironment(this.currentRegion);

        // V1.9.27 - Mobile perf profile. iPhones are fill-rate bound: each frame
        // re-shading every fragment at retina 3× through MSAA + a 5-pass bloom
        // chain crushes the GPU. We detect once and use the flag everywhere to
        // pick cheaper paths (no antialias, no shadows, no postprocess, lower DPR,
        // closer fog/far-plane). Detection prefers iOS-style UA hints but also
        // catches generic touch + small screens so iPads in desktop mode and
        // Android phones get the same treatment.
        const ua = (navigator.userAgent || '');
        const isIOS = /iPad|iPhone|iPod/.test(ua) || (ua.includes('Mac') && navigator.maxTouchPoints > 1);
        const isTouchSmall = ('ontouchstart' in window || navigator.maxTouchPoints > 0)
            && Math.min(window.innerWidth, window.innerHeight) < 900;
        // isMobile is the LAYOUT flag (joystick, carousel, sized HUD). It must
        // stay tied to the device, not the perf setting, so forcing low-perf on
        // a desktop doesn't accidentally swap in the touch UI.
        this.isMobile = isIOS || isTouchSmall;
        // V1.9.36 - mobilePerf is the RENDERER flag. It starts at auto-detection
        // (=== isMobile) but can be manually overridden via settings.lowPerfMode.
        // null/undefined = keep auto; true = force cheap path; false = force
        // high-fi path. This drives DPR cap, antialias, shadows, EffectComposer,
        // far-plane, and fog distance.
        const lowPerfOverride = this.progression && this.progression.data
            && this.progression.data.settings
            ? this.progression.data.settings.lowPerfMode : null;
        if (lowPerfOverride === true) this.mobilePerf = true;
        else if (lowPerfOverride === false) this.mobilePerf = false;
        else this.mobilePerf = this.isMobile;
        const mobileFarPlane = 500;
        const desktopFarPlane = 1000;

        this.camera = new THREE.PerspectiveCamera(
            75,
            window.innerWidth / window.innerHeight,
            0.1,
            this.mobilePerf ? mobileFarPlane : desktopFarPlane
        );
        
        this.renderer = new THREE.WebGLRenderer({
            antialias: !this.mobilePerf, // MSAA is the #1 mobile fill-rate cost
            powerPreference: 'high-performance',
            stencil: false,
            // Better behavior on iOS Safari when canvas resizes during rotation.
            preserveDrawingBuffer: false
        });
        // V1.9.27 - Pixel-ratio cap is the highest-leverage knob. iPhones run
        // at 2-3 DPR; capping at 1.0 mobile / 1.5 desktop is a 2-4× shader cost
        // reduction without making the blocky Roblox look noticeably softer.
        const dprCap = this.mobilePerf ? 1.0 : 1.5;
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, dprCap));
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        // V1.9.27 - Shadows off on mobile. PCF shadow maps require a second
        // depth-pass per shadow-casting light per frame; on a 6-region scene
        // this is a measurable iPhone perf cliff.
        this.renderer.shadowMap.enabled = !this.mobilePerf;
        // Faster, slightly softer shadows.
        this.renderer.shadowMap.type = THREE.PCFShadowMap;
        // V1.9.6 Core Linkage - Neutral tone mapping with higher exposure for clearer visuals
        this.renderer.toneMapping = THREE.LinearToneMapping;
        this.renderer.toneMappingExposure = 1.6;
        this.renderer.outputColorSpace = THREE.SRGBColorSpace;
        document.getElementById('game-container').innerHTML = '';
        document.getElementById('game-container').appendChild(this.renderer.domElement);

        // Make sure the canvas is focusable and ready to receive input the moment the game opens.
        this.renderer.domElement.tabIndex = 0;
        this.renderer.domElement.style.outline = 'none';
        setTimeout(() => { try { this.renderer.domElement.focus(); } catch (_) {} }, 0);
        this.renderer.domElement.addEventListener('mousedown', () => {
            try { this.renderer.domElement.focus(); } catch (_) {}
        });

        // Defensive: stop arrow keys / space from scrolling the page even before Player3D's listeners attach.
        window.addEventListener('keydown', (e) => {
            if (['ArrowUp','ArrowDown','ArrowLeft','ArrowRight','Space'].includes(e.code)) {
                e.preventDefault();
            }
        }, { passive: false });

        // Input listeners for Roblox Camera
        window.addEventListener('mousedown', (e) => { if (e.button === 2) this.isRightMouseDown = true; });
        window.addEventListener('mouseup', (e) => { if (e.button === 2) this.isRightMouseDown = false; });
        window.addEventListener('mousemove', (e) => {
            if (this.isRightMouseDown) {
                this.cameraYaw -= e.movementX * 0.005;
                this.cameraPitch = Math.max(-Math.PI/2 + 0.1, Math.min(0, this.cameraPitch - e.movementY * 0.005));
            }
        });
        window.addEventListener('wheel', (e) => {
            this.cameraTargetDist = Math.max(4, Math.min(20, this.cameraTargetDist + e.deltaY * 0.02));
        });
        window.addEventListener('contextmenu', (e) => e.preventDefault());

        // Post-processing
        // V1.9.27 - Mobile devices skip the composer entirely. UnrealBloom adds
        // ~5 fullscreen passes (downsample chain + composite); on iPhone this is
        // a significant frame-time win. The render loop branches on this.composer
        // so the rest of the code is unchanged.
        if (!this.mobilePerf) {
            this.composer = new EffectComposer(this.renderer);
            // Match the renderer's capped pixel ratio so bloom/glitch render at the same lower resolution.
            this.composer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
            this.composer.setSize(window.innerWidth, window.innerHeight);
            this.composer.addPass(new RenderPass(this.scene, this.camera));

            this.bloomPass = new UnrealBloomPass(
                new THREE.Vector2(window.innerWidth, window.innerHeight),
                0.2, // strength - Roblox is cleaner
                0.1, // radius
                0.9  // threshold
            );
            this.composer.addPass(this.bloomPass);
        } else {
            this.composer = null;
            this.bloomPass = null;
        }

        // Glitch/Rot Shader
        const GlitchShader = {
            uniforms: {
                "tDiffuse": { value: null },
                "time": { value: 0.0 },
                "amount": { value: 0.0 },
                "angle": { value: 0.0 },
                "seed": { value: 0.0 },
                "seed_x": { value: 0.0 },
                "seed_y": { value: 0.0 },
                "distortion_x": { value: 0.0 },
                "distortion_y": { value: 0.0 },
                "col_s": { value: 0.0 }
            },
            vertexShader: `
                varying vec2 vUv;
                void main() {
                    vUv = uv;
                    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
                }
            `,
            fragmentShader: `
                uniform sampler2D tDiffuse;
                uniform float time;
                uniform float amount;
                uniform float angle;
                varying vec2 vUv;

                float rand(vec2 co) {
                    return fract(sin(dot(co.xy ,vec2(12.9898,78.233))) * 43758.5453);
                }

                void main() {
                    vec2 uv = vUv;
                    if (amount > 0.0) {
                        float xs = floor(vUv.x * 10.0);
                        float ys = floor(vUv.y * 10.0);
                        vec4 normal = texture2D(tDiffuse, vUv);
                        
                        if (rand(vec2(xs, ys) + time) < amount * 0.1) {
                            uv.x += (rand(vec2(ys, time)) - 0.5) * amount * 0.5;
                            uv.y += (rand(vec2(xs, time)) - 0.5) * amount * 0.5;
                        }

                        vec4 glitch = texture2D(tDiffuse, uv);
                        // Add some rot-purple tint
                        glitch.rgb = mix(glitch.rgb, vec3(0.5, 0.0, 1.0), amount * 0.2);
                        gl_FragColor = glitch;
                    } else {
                        gl_FragColor = texture2D(tDiffuse, vUv);
                    }
                }
            `
        };

        // V1.9.27 - Glitch pass only mounts when the composer exists (desktop).
        // On mobile, glitchIntensity still tracks state for camera shake etc.,
        // but no fullscreen shader pass runs.
        if (this.composer) {
            this.glitchPass = new ShaderPass(GlitchShader);
            this.composer.addPass(this.glitchPass);
        } else {
            this.glitchPass = null;
        }

        this.uiOverlay = document.createElement('div');
        this.uiOverlay.style.position = 'absolute';
        this.uiOverlay.style.top = '0';
        this.uiOverlay.style.left = '0';
        this.uiOverlay.style.width = '100%';
        this.uiOverlay.style.height = '100%';
        this.uiOverlay.style.pointerEvents = 'none';
        // V1.9.33 - Critical mobile fix: the overlay used `display: flex` + `justify-content: center`
        // which silently clips both top and bottom of any menu taller than the viewport on iPhone
        // (the Start Screen, Mode Select, Clan Oath, etc. are all over ~700px tall while a phone
        // viewport in Safari with the URL bar visible is ~660px). The result was a totally black
        // screen with only a sliver of the menu's bottom edge visible. We switch to `flex-start`
        // + vertical scroll so menus always anchor at the top and the user can scroll if needed.
        this.uiOverlay.style.display = 'flex';
        this.uiOverlay.style.flexDirection = 'column';
        this.uiOverlay.style.justifyContent = 'flex-start';
        this.uiOverlay.style.alignItems = 'center';
        this.uiOverlay.style.overflowY = 'auto';
        this.uiOverlay.style.overflowX = 'hidden';
        this.uiOverlay.style.webkitOverflowScrolling = 'touch';
        this.uiOverlay.style.fontFamily = '"Press Start 2P", cursive';
        this.uiOverlay.style.color = '#ffffff';
        this.uiOverlay.style.textShadow = '2px 2px 4px #000000';
        this.uiOverlay.style.boxSizing = 'border-box';
        document.getElementById('game-container').appendChild(this.uiOverlay);

        // Time of Day Clock UI
        this.clockUI = document.createElement('div');
        this.clockUI.style.cssText = `
            position: absolute;
            top: 20px;
            right: 20px;
            background: rgba(0, 0, 0, 0.8);
            border: 2px solid #39FF14;
            padding: 10px;
            color: #39FF14;
            font-family: "Press Start 2P", cursive;
            font-size: 10px;
            z-index: 1000;
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 5px;
            min-width: 100px;
            box-shadow: 0 0 10px rgba(57, 255, 20, 0.3);
        `;
        document.getElementById('game-container').appendChild(this.clockUI);

        this.notificationContainer = document.createElement('div');
        this.notificationContainer.style.cssText = `
            position: absolute;
            top: 80px;
            right: 20px;
            width: 320px;
            z-index: 2000;
            pointer-events: none;
            display: flex;
            flex-direction: column;
            gap: 10px;
        `;
        document.getElementById('game-container').appendChild(this.notificationContainer);

        // Restoration Status HUD
        this.restorationHUD = document.createElement('div');
        this.restorationHUD.style.cssText = `
            position: absolute;
            top: 20px;
            left: 20px;
            background: rgba(0, 0, 0, 0.8);
            border: 2px solid #00ffff;
            padding: 10px;
            color: #00ffff;
            font-family: "Press Start 2P", cursive;
            font-size: 8px;
            z-index: 1000;
            display: flex;
            flex-direction: column;
            gap: 8px;
            min-width: 180px;
            box-shadow: 0 0 10px rgba(0, 255, 255, 0.3);
        `;
        document.getElementById('game-container').appendChild(this.restorationHUD);

        // Add Notification Styles
        const style = document.createElement('style');
        style.textContent = `
            @keyframes slideInNotif {
                from { transform: translateX(120%); opacity: 0; }
                to { transform: translateX(0); opacity: 1; }
            }
            @keyframes slideOutNotif {
                from { transform: translateX(0); opacity: 1; }
                to { transform: translateX(120%); opacity: 0; }
            }
            @keyframes blinkNotif {
                0%, 100% { opacity: 1; }
                50% { opacity: 0.3; }
            }
        `;
        document.head.appendChild(style);

        this.loadWalletConnection();
        this.setupStartScreen();

        // V1.9.7 Daylight - Bright Roblox-style baseline; cycle drives the final values.
        this.ambientLight = new THREE.AmbientLight(0xffffff, 2.0);
        this.scene.add(this.ambientLight);

        this.neonSun = new THREE.DirectionalLight(0xffffff, 2.6);
        this.neonSun.position.set(50, 100, 50);
        this.scene.add(this.neonSun);

        this.magentaRim = new THREE.DirectionalLight(0xff66ff, 0.8);
        this.magentaRim.position.set(-10, 20, -10);
        this.scene.add(this.magentaRim);

        // Soft blue moonlight that fades in at night so the world never goes black.
        this.moonLight = new THREE.DirectionalLight(0xaaccff, 0.0);
        this.moonLight.position.set(-50, 80, -30);
        this.scene.add(this.moonLight);

        // Re-apply region environment now that the lights exist so the boost takes effect
        this.applyRegionEnvironment(this.currentRegion);

        // V1.9.8 Free Stride - Bright Roblox-grass field with a procedural noise texture.
        const grassCanvas = document.createElement('canvas');
        grassCanvas.width = grassCanvas.height = 256;
        const gctx = grassCanvas.getContext('2d');
        // V1.9.9 Deeper, more natural meadow green (slightly darker pass).
        gctx.fillStyle = '#247a30';
        gctx.fillRect(0, 0, 256, 256);
        for (let i = 0; i < 1800; i++) {
            const shades = ['#2f9040', '#1a5d23', '#3aa050', '#246e30', '#4caa54'];
            gctx.fillStyle = shades[Math.floor(Math.random() * shades.length)];
            const x = Math.random() * 256;
            const y = Math.random() * 256;
            const s = 1 + Math.random() * 2.5;
            gctx.fillRect(x, y, s, s);
        }
        // Little grass blade strokes - darker for depth
        gctx.strokeStyle = 'rgba(12,60,20,0.55)';
        gctx.lineWidth = 1;
        for (let i = 0; i < 350; i++) {
            const x = Math.random() * 256;
            const y = Math.random() * 256;
            gctx.beginPath();
            gctx.moveTo(x, y);
            gctx.lineTo(x + (Math.random() - 0.5) * 3, y - 2 - Math.random() * 3);
            gctx.stroke();
        }
        this.grassTexture = new THREE.CanvasTexture(grassCanvas);
        this.grassTexture.wrapS = this.grassTexture.wrapT = THREE.RepeatWrapping;
        this.grassTexture.repeat.set(40, 40);
        this.grassTexture.colorSpace = THREE.SRGBColorSpace;

        const groundGeo = new THREE.PlaneGeometry(500, 500);
        this.groundMat = new THREE.MeshStandardMaterial({
            map: this.grassTexture,
            color: 0xffffff,
            roughness: 0.85,
            metalness: 0.0
        });
        const ground = new THREE.Mesh(groundGeo, this.groundMat);
        ground.rotation.x = -Math.PI / 2;
        ground.receiveShadow = true;
        this.scene.add(ground);

        this.collidables = [];
        this.platforms = [];
        this.createRegionEnvironment();
        this.spawnNocturnalMushrooms();
        this.createRegionAssets();

        // Player Initialization - V1.9.6 CORE LINKAGE FIX
        this.player = new Player3D(this.scene, this.camera);
        this.syncPlayerStats();
        this.scene.add(this.player.group);

        // V1.9.7 - Scale King Myco up slightly so he reads clearly against the world.
        this.player.group.scale.set(1.15, 1.15, 1.15);

        // V1.9.8 Free Stride - Restore last position OR guarantee a safe, unblocked spawn.
        const savedPos = this.progression.data.playerPosition;
        if (savedPos && Number.isFinite(savedPos.x) && Number.isFinite(savedPos.z)) {
            this.player.group.position.set(savedPos.x, savedPos.y || 0, savedPos.z);
        } else {
            this.player.group.position.set(0, 0, 0);
        }
        this.clearSpawnArea(this.player.group.position, 6);

        // Personal hero light so King Myco stays readable in any region or time of day.
        this.playerHeroLight = new THREE.PointLight(0xffffff, 2.6, 22, 1.2);
        this.playerHeroLight.position.set(0, 3.5, 0);
        this.player.group.add(this.playerHeroLight);

        // Soft contact shadow disc under King Myco for depth perception.
        const shadowGeo = new THREE.CircleGeometry(0.95, 24);
        const shadowMat = new THREE.MeshBasicMaterial({
            color: 0x000000,
            transparent: true,
            opacity: 0.45,
            depthWrite: false
        });
        this.playerShadowDisc = new THREE.Mesh(shadowGeo, shadowMat);
        this.playerShadowDisc.rotation.x = -Math.PI / 2;
        this.playerShadowDisc.position.y = 0.02;
        this.playerShadowDisc.renderOrder = 1;
        this.player.group.add(this.playerShadowDisc);

        // Soft glowing halo sprite around King Myco so his silhouette pops in any lighting.
        const haloCanvas = document.createElement('canvas');
        haloCanvas.width = haloCanvas.height = 128;
        const hctx = haloCanvas.getContext('2d');
        const haloGrad = hctx.createRadialGradient(64, 64, 12, 64, 64, 60);
        haloGrad.addColorStop(0, 'rgba(255,255,210,0.65)');
        haloGrad.addColorStop(0.45, 'rgba(255,220,140,0.30)');
        haloGrad.addColorStop(1, 'rgba(255,200,80,0.0)');
        hctx.fillStyle = haloGrad;
        hctx.fillRect(0, 0, 128, 128);
        const haloTex = new THREE.CanvasTexture(haloCanvas);
        const haloMat = new THREE.SpriteMaterial({
            map: haloTex,
            transparent: true,
            depthWrite: false,
            blending: THREE.AdditiveBlending
        });
        this.playerHalo = new THREE.Sprite(haloMat);
        this.playerHalo.scale.set(4.5, 4.5, 1);
        this.playerHalo.position.set(0, 1.4, 0);
        this.player.group.add(this.playerHalo);
        
        this.spawnEnemies();
        this.spawnCollectibles();

        // V1.9.18 - Seed each mushroom's individual rot from the saved region rot.
        this.syncRegionRotToVisuals();

        // V1.9.22 - "CONTROLS ACTIVE" debug overlay removed; production HUD is enough.
        // this.setupInputDebugOverlay();
        this.initMobileControls();
        this.animate();
    }

    initMobileControls() {
        const isTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
        if (!isTouch) return;
        if (this._mobileControlsBuilt) return;
        this._mobileControlsBuilt = true;

        // V1.9.29 - Mobile-friendly virtual joystick. Key improvements over the
        // previous implementation:
        //   • Floating origin: the joystick appears wherever the player first
        //     touches the left half of the screen, so the thumb never has to
        //     hunt for a fixed circle.
        //   • Per-touch identifier tracking: each control (stick, jump, attack,
        //     use) tracks its own touch.identifier through changedTouches, so
        //     multi-touch (move + jump + attack) works without finger collisions.
        //   • Recomputes center on every touchstart instead of caching the
        //     initial bounding rect — survives URL bar collapse and rotation.
        //   • Respects iOS safe-area-inset (notch / home indicator).
        //   • Wraps everything in a single container with pointer-events: none
        //     so menus/HUD remain interactive; only the active touch surfaces
        //     intercept input.
        //   • Idle state shows a subtle ghost stick on the left half as an
        //     affordance, and the active stick gets a glowing ring.
        //   • Re-renders on resize so a rotated phone gets a fresh layout.

        // Inject CSS once for active/idle states and pulse animation.
        if (!document.getElementById('mobile-controls-styles')) {
            const style = document.createElement('style');
            style.id = 'mobile-controls-styles';
            style.textContent = `
                .mobile-ctrl-base {
                    position: fixed;
                    border-radius: 50%;
                    pointer-events: auto;
                    -webkit-user-select: none;
                    user-select: none;
                    -webkit-touch-callout: none;
                    -webkit-tap-highlight-color: transparent;
                    touch-action: none;
                    box-sizing: border-box;
                    font-family: sans-serif;
                    font-weight: bold;
                    color: white;
                    text-shadow: 0 1px 2px rgba(0,0,0,0.8);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    transition: transform 0.08s ease, background 0.12s ease, box-shadow 0.12s ease;
                }
                .mobile-ctrl-base.pressed { transform: scale(0.92); }

                #mobile-joystick-ghost {
                    width: 140px; height: 140px;
                    background: radial-gradient(circle, rgba(255,255,255,0.10) 0%, rgba(255,255,255,0.03) 70%, transparent 100%);
                    border: 2px dashed rgba(255,255,255,0.18);
                    opacity: 0.55;
                    pointer-events: none;
                    z-index: 1999;
                }
                #mobile-joystick-base {
                    width: 160px; height: 160px;
                    background: radial-gradient(circle, rgba(0,0,0,0.45) 0%, rgba(0,0,0,0.25) 70%, transparent 100%);
                    border: 2px solid rgba(255,255,255,0.55);
                    box-shadow: 0 0 24px rgba(57,255,20,0.35), inset 0 0 16px rgba(255,255,255,0.08);
                    pointer-events: none;
                    z-index: 2001;
                    opacity: 0;
                    transition: opacity 0.1s ease;
                }
                #mobile-joystick-base.active { opacity: 1; }
                #mobile-joystick-knob {
                    position: absolute;
                    top: 50%; left: 50%;
                    width: 64px; height: 64px;
                    background: radial-gradient(circle at 35% 30%, #ffffff 0%, #cccccc 60%, #999999 100%);
                    border-radius: 50%;
                    transform: translate(-50%, -50%);
                    pointer-events: none;
                    box-shadow: 0 0 12px rgba(57,255,20,0.6), 0 4px 8px rgba(0,0,0,0.4);
                }

                .mobile-action-btn {
                    width: 78px; height: 78px;
                    font-size: 13px;
                    background: rgba(0,0,0,0.55);
                    border: 2px solid rgba(255,255,255,0.6);
                    box-shadow: 0 4px 10px rgba(0,0,0,0.4);
                    z-index: 2002;
                }
                .mobile-action-btn.attack {
                    width: 96px; height: 96px;
                    font-size: 15px;
                    background: radial-gradient(circle at 30% 30%, rgba(255,80,80,0.85), rgba(180,0,0,0.85));
                    border-color: #ff9999;
                    box-shadow: 0 0 14px rgba(255,60,60,0.55), 0 4px 10px rgba(0,0,0,0.45);
                }
                .mobile-action-btn.jump {
                    background: radial-gradient(circle at 30% 30%, rgba(120,200,255,0.85), rgba(20,80,160,0.85));
                    border-color: #aaddff;
                    box-shadow: 0 0 12px rgba(60,160,255,0.55), 0 4px 10px rgba(0,0,0,0.45);
                }
                .mobile-action-btn.use {
                    background: radial-gradient(circle at 30% 30%, rgba(120,255,140,0.85), rgba(20,140,40,0.85));
                    border-color: #aaffaa;
                    box-shadow: 0 0 12px rgba(57,255,20,0.55), 0 4px 10px rgba(0,0,0,0.45);
                }
                .mobile-action-btn.dash {
                    width: 78px; height: 78px;
                    font-size: 13px;
                    background: radial-gradient(circle at 30% 30%, rgba(255,220,80,0.9), rgba(200,120,0,0.9));
                    border-color: #ffe680;
                    box-shadow: 0 0 14px rgba(255,200,60,0.6), 0 4px 10px rgba(0,0,0,0.45);
                    overflow: hidden;
                }
                /* Cooldown sweep — a darkening overlay that we'll size via inline style each frame. */
                .mobile-action-btn.dash .cd-overlay {
                    position: absolute; inset: 0;
                    border-radius: 50%;
                    background: rgba(0,0,0,0.55);
                    pointer-events: none;
                    clip-path: inset(0 0 100% 0);
                    transition: clip-path 0.08s linear;
                }
                .mobile-action-btn.dash .cd-label {
                    position: relative;
                    z-index: 1;
                    pointer-events: none;
                }
                @keyframes dashFlash {
                    0%   { box-shadow: 0 0 14px rgba(255,200,60,0.6), 0 4px 10px rgba(0,0,0,0.45); }
                    30%  { box-shadow: 0 0 32px rgba(255,240,180,1.0), 0 4px 14px rgba(0,0,0,0.55); }
                    100% { box-shadow: 0 0 14px rgba(255,200,60,0.6), 0 4px 10px rgba(0,0,0,0.45); }
                }
                .mobile-action-btn.dash.firing { animation: dashFlash 360ms ease-out; }
                #mobile-controls-root.hidden { display: none; }
            `;
            document.head.appendChild(style);
        }

        // Single root so we can hide/show all controls together when modals open.
        // V1.9.31 - Starts hidden because init() runs before the player gets to
        // the Start Screen; the rAF tick reveals it once gameState === 'PLAYING'.
        const root = document.createElement('div');
        root.id = 'mobile-controls-root';
        root.className = 'hidden';
        root.style.cssText = `
            position: fixed; inset: 0;
            pointer-events: none;
            z-index: 1998;
        `;
        document.body.appendChild(root);
        this._mobileControlsRoot = root;

        // Idle ghost stick (visual affordance — no input).
        const ghost = document.createElement('div');
        ghost.id = 'mobile-joystick-ghost';
        ghost.className = 'mobile-ctrl-base';
        root.appendChild(ghost);

        // Floating active joystick base + knob.
        const stickBase = document.createElement('div');
        stickBase.id = 'mobile-joystick-base';
        stickBase.className = 'mobile-ctrl-base';
        const knob = document.createElement('div');
        knob.id = 'mobile-joystick-knob';
        stickBase.appendChild(knob);
        root.appendChild(stickBase);

        // Action buttons (use button labels even though look comes from CSS).
        const makeBtn = (label, cls) => {
            const b = document.createElement('div');
            b.className = `mobile-ctrl-base mobile-action-btn ${cls}`;
            b.textContent = label;
            root.appendChild(b);
            return b;
        };
        const attackBtn = makeBtn('ATTACK', 'attack');
        const jumpBtn   = makeBtn('JUMP',   'jump');
        const useBtn    = makeBtn('USE',    'use');

        // V1.9.30 - Dedicated DASH button. Composed of a cooldown sweep overlay
        // + an inner label so the overlay can darken the button without hiding
        // the text. We hold a reference to the overlay so the rAF loop below
        // can drive its clip-path each frame from player.dashReadyAt.
        const dashBtn = makeBtn('', 'dash');
        const dashOverlay = document.createElement('div');
        dashOverlay.className = 'cd-overlay';
        const dashLabel = document.createElement('div');
        dashLabel.className = 'cd-label';
        dashLabel.textContent = 'DASH';
        dashBtn.appendChild(dashOverlay);
        dashBtn.appendChild(dashLabel);

        // Layout helper — runs on init and on resize/orientation change.
        // Uses safe-area-inset to dodge the home indicator + notch.
        const layout = () => {
            const w = window.innerWidth;
            const h = window.innerHeight;
            const safeB = `env(safe-area-inset-bottom, 0px)`;
            const safeR = `env(safe-area-inset-right, 0px)`;
            const safeL = `env(safe-area-inset-left, 0px)`;

            // Ghost stick sits in the lower-left affordance area.
            ghost.style.left = `calc(${Math.round(w * 0.10)}px + ${safeL})`;
            ghost.style.bottom = `calc(${Math.round(h * 0.18)}px + ${safeB})`;
            ghost.style.transform = 'translate(-50%, 50%)';

            // Action buttons stacked on the right.
            // ATTACK (biggest) at the bottom-right thumb rest.
            // DASH sits left of ATTACK so it's reachable mid-combat without
            // shifting the grip. JUMP stacks above ATTACK. USE tucks higher-left.
            attackBtn.style.right = `calc(28px + ${safeR})`;
            attackBtn.style.bottom = `calc(120px + ${safeB})`;
            jumpBtn.style.right = `calc(54px + ${safeR})`;
            jumpBtn.style.bottom = `calc(232px + ${safeB})`;
            dashBtn.style.right = `calc(140px + ${safeR})`;
            dashBtn.style.bottom = `calc(130px + ${safeB})`;
            useBtn.style.right = `calc(150px + ${safeR})`;
            useBtn.style.bottom = `calc(230px + ${safeB})`;
        };
        layout();
        window.addEventListener('resize', layout);
        window.addEventListener('orientationchange', layout);

        // ---- Joystick state ----
        const STICK_RADIUS = 70; // max knob travel from center, in CSS px
        let stickTouchId = null;
        let stickCenter = { x: 0, y: 0 };

        const showStickAt = (x, y) => {
            stickCenter = { x, y };
            stickBase.style.left = `${x}px`;
            stickBase.style.top = `${y}px`;
            stickBase.style.bottom = 'auto';
            stickBase.style.right = 'auto';
            stickBase.style.transform = 'translate(-50%, -50%)';
            stickBase.classList.add('active');
            knob.style.transform = 'translate(-50%, -50%)';
        };
        const hideStick = () => {
            stickBase.classList.remove('active');
            knob.style.transform = 'translate(-50%, -50%)';
            if (this.player) this.player.moveVector.set(0, 0);
        };

        const updateStick = (touchX, touchY) => {
            const dx = touchX - stickCenter.x;
            const dy = touchY - stickCenter.y;
            const dist = Math.hypot(dx, dy);
            const clamped = Math.min(dist, STICK_RADIUS);
            const angle = Math.atan2(dy, dx);
            const knobX = clamped * Math.cos(angle);
            const knobY = clamped * Math.sin(angle);
            knob.style.transform = `translate(calc(-50% + ${knobX}px), calc(-50% + ${knobY}px))`;

            if (!this.player) return;
            const deadzone = (this.progression && this.progression.data.settings && this.progression.data.settings.deadzone) || 0.18;
            const norm = clamped / STICK_RADIUS;
            if (norm > deadzone) {
                // Re-map remaining range to [0..1] so movement starts at deadzone edge with zero speed.
                const scaled = (norm - deadzone) / (1 - deadzone);
                const ux = Math.cos(angle) * scaled;
                const uy = Math.sin(angle) * scaled;
                // moveVector.x = strafe (right positive), moveVector.y = forward (positive)
                // Screen y grows downward, so forward = -uy.
                this.player.moveVector.set(ux, -uy);
            } else {
                this.player.moveVector.set(0, 0);
            }
        };

        // ---- Button state (each tracks its own touch identifier) ----
        const buttons = [
            {
                el: jumpBtn, id: null,
                onPress: () => {
                    if (!this.player) return;
                    this.player.onJumpPress();
                    this.triggerHaptic('tap');
                }
            },
            {
                el: useBtn, id: null,
                onPress: () => {
                    if (!this.player) return;
                    this.player.useActiveSlot();
                    this.triggerHaptic('tap');
                }
            },
            // ATTACK auto-repeats while held (combat must feel responsive).
            // Haptic only fires on the initial press to avoid buzzy spam.
            {
                el: attackBtn, id: null, repeat: true,
                onPress: () => {
                    if (!this.player) return;
                    this.player.useActiveSlot();
                },
                onInitialPress: () => this.triggerHaptic('medium')
            },
            // V1.9.30 - DASH button. Calls player.dash(), which returns true
            // when the dash actually fired (vs. cooldown rejection). Haptic +
            // visual flash only fire on a successful dash; a tap-during-cooldown
            // gives no feedback so the player learns to read the sweep ring.
            {
                el: dashBtn, id: null,
                onPress: () => {
                    if (!this.player || typeof this.player.dash !== 'function') return;
                    const fired = this.player.dash();
                    if (fired) {
                        this.triggerHaptic('dash');
                        dashBtn.classList.remove('firing');
                        // Force reflow so the animation re-triggers on rapid taps.
                        void dashBtn.offsetWidth;
                        dashBtn.classList.add('firing');
                    } else {
                        this.triggerHaptic('reject');
                    }
                }
            }
        ];
        for (const b of buttons) {
            b.lastFire = 0;
        }

        // ---- Single delegated touch dispatcher on the canvas/root ----
        // We listen on window to catch touches that begin anywhere on screen,
        // because the joystick is floating-origin and the buttons have known
        // hit-test rects we resolve manually.
        const hitButton = (x, y) => {
            for (const b of buttons) {
                const r = b.el.getBoundingClientRect();
                if (x >= r.left && x <= r.right && y >= r.top && y <= r.bottom) return b;
            }
            return null;
        };

        // Floating-origin trigger zone: left half of the screen, anywhere that
        // isn't on top of a button. This is what makes the stick feel iPhone-
        // native — wherever your thumb lands, that becomes the new stick center.
        const isStickZone = (x, y) => {
            return x < window.innerWidth * 0.5 && !hitButton(x, y);
        };

        // V1.9.31 - Decide whether a touch that landed at (x, y) should be
        // claimed by the joystick/button system, or passed through to a real
        // HTML element (menu button, dialogue, settings input, etc.). We use
        // elementFromPoint and walk up looking for any interactive element or
        // any element with pointer-events: auto inside the UI overlay.
        // If we find one, we DO NOT preventDefault and DO NOT take the touch.
        const touchHitsUI = (x, y) => {
            const el = document.elementFromPoint(x, y);
            if (!el) return false;
            // The mobile control elements themselves are interactive divs in
            // mobile-controls-root; those should be handled by hitButton/isStickZone.
            // Anything else interactive belongs to the menu system.
            let cur = el;
            while (cur && cur !== document.body) {
                if (cur === this._mobileControlsRoot) return false; // it's our own control
                const tag = cur.tagName;
                if (tag === 'BUTTON' || tag === 'A' || tag === 'INPUT' || tag === 'SELECT' || tag === 'TEXTAREA' || tag === 'LABEL') {
                    return true;
                }
                // Any modal/dialogue/menu inside uiOverlay with pointer-events:auto
                // is also a hands-off zone.
                if (cur === this.uiOverlay) return true;
                cur = cur.parentElement;
            }
            return false;
        };

        // Also: only "claim" touches while gameplay is active. During the start
        // screen, mode select, prologue, clan oath, dialogues, leaderboard,
        // settings, etc., the touch system stays out of the way entirely.
        const isGameplayActive = () => this.gameState === 'PLAYING';

        const onTouchStart = (e) => {
            if (!isGameplayActive()) return;
            for (const t of e.changedTouches) {
                const x = t.clientX, y = t.clientY;

                // Touch landed on a menu/dialogue/HTML control — leave it alone.
                if (touchHitsUI(x, y)) continue;

                // Check our action buttons.
                const btn = hitButton(x, y);
                if (btn) {
                    if (btn.id !== null) continue; // already held by another finger
                    btn.id = t.identifier;
                    btn.el.classList.add('pressed');
                    if (btn.onInitialPress) btn.onInitialPress();
                    btn.onPress();
                    btn.lastFire = performance.now();
                    e.preventDefault();
                    continue;
                }

                // Joystick floating origin (left half, no button hit).
                if (stickTouchId === null && isStickZone(x, y)) {
                    stickTouchId = t.identifier;
                    showStickAt(x, y);
                    updateStick(x, y);
                    e.preventDefault();
                }
            }
        };

        const onTouchMove = (e) => {
            if (!isGameplayActive()) return;
            for (const t of e.changedTouches) {
                if (t.identifier === stickTouchId) {
                    updateStick(t.clientX, t.clientY);
                    e.preventDefault();
                }
                // Buttons don't track movement except for the floating "drag off
                // to cancel" pattern, which we deliberately don't implement —
                // touch-end is enough.
            }
        };

        const releaseTouch = (id) => {
            if (stickTouchId === id) {
                stickTouchId = null;
                hideStick();
            }
            for (const b of buttons) {
                if (b.id === id) {
                    b.id = null;
                    b.el.classList.remove('pressed');
                }
            }
        };

        const onTouchEnd = (e) => {
            for (const t of e.changedTouches) releaseTouch(t.identifier);
        };

        // passive: false so preventDefault can suppress iOS scroll-bounce.
        window.addEventListener('touchstart', onTouchStart, { passive: false });
        window.addEventListener('touchmove',  onTouchMove,  { passive: false });
        window.addEventListener('touchend',   onTouchEnd,   { passive: false });
        window.addEventListener('touchcancel', onTouchEnd,  { passive: false });

        // Auto-repeat for held ATTACK button. Drives useActiveSlot() at a
        // weapon-friendly cadence; the player's own per-attack cooldown
        // (lastMeleeTime / shoot cooldown) will gate redundant calls.
        // V1.9.30 - Same loop also drives the DASH cooldown sweep so the
        // overlay reflects player.dashReadyAt without a separate rAF.
        const REPEAT_MS = 180;
        const tickRepeat = () => {
            const now = performance.now();
            for (const b of buttons) {
                if (b.repeat && b.id !== null && now - b.lastFire >= REPEAT_MS) {
                    b.onPress();
                    b.lastFire = now;
                }
            }
            // DASH cooldown sweep. clip-path inset(top right bottom left) — we
            // grow the bottom inset from 100% (fully clipped, no overlay) back
            // up to 0% (overlay covers full button) as the cooldown counts down,
            // then drain back to 100% as it becomes ready again.
            if (this.player && typeof this.player.dashReadyAt === 'number') {
                const remaining = Math.max(0, this.player.dashReadyAt - now);
                const cd = Math.max(1, this.player.dashCooldownMs || 700);
                const pct = remaining / cd; // 1 = just fired, 0 = ready
                dashOverlay.style.clipPath = `inset(0 0 ${(1 - pct) * 100}% 0)`;
            }

            // V1.9.31 - Show controls only when gameplay is active. During menus,
            // the whole overlay disappears so HTML buttons get unobstructed taps.
            const shouldShow = this.gameState === 'PLAYING';
            const isHidden = root.classList.contains('hidden');
            if (shouldShow && isHidden) root.classList.remove('hidden');
            else if (!shouldShow && !isHidden) root.classList.add('hidden');

            requestAnimationFrame(tickRepeat);
        };
        requestAnimationFrame(tickRepeat);

        // Expose a hide/show toggle for modal flows that want a clean screen.
        this.setMobileControlsVisible = (visible) => {
            root.classList.toggle('hidden', !visible);
        };
    }

    // V1.9.30 - Haptic feedback dispatcher. Browsers split here:
    //   • Android Chrome/Firefox: navigator.vibrate(pattern) works directly.
    //   • iOS Safari: navigator.vibrate is missing entirely. iOS only exposes
    //     haptics via Web Apps in Home-Screen mode (Taptic via AudioContext
    //     workarounds) or via connected gamepads. We do our best:
    //       - Try navigator.vibrate first (covers Android + iOS Chrome on PWA).
    //       - Fall back to connected gamepad rumble if available (rare for
    //         iPhone but works when the user has a controller paired).
    //       - Silently no-op if neither path exists — the visual button-pressed
    //         scale + glow already give players sub-haptic feedback.
    // Patterns are named (not raw arrays) so other systems can ask for
    // semantically-meaningful feedback without knowing the underlying device.
    triggerHaptic(kind = 'tap') {
        // Respect any user-level "no haptics" toggle if/when one is added.
        if (this.progression && this.progression.data && this.progression.data.settings
            && this.progression.data.settings.haptics === false) return;

        const PATTERNS = {
            tap:    [12],           // light click for jump/use
            medium: [18],           // attack initial press
            dash:   [10, 30, 22],   // sharp pulse-pause-thump for a strong dash kick
            reject: [4, 30, 4],     // tiny double-tick for cooldown blocked
            hit:    [40],           // received damage (can be used by takeDamage)
            heavy:  [80]            // boss telegraphs etc.
        };
        const pattern = PATTERNS[kind] || PATTERNS.tap;

        // 1) Web Vibration API.
        try {
            if (typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function') {
                navigator.vibrate(pattern);
            }
        } catch (_) { /* ignore browser security errors */ }

        // 2) Gamepad rumble fallback. Walk all connected gamepads in case the
        // user has multiple controllers; only the first with a vibration
        // actuator gets a rumble so we don't spam the room.
        try {
            const pads = (navigator.getGamepads && navigator.getGamepads()) || [];
            for (const gp of pads) {
                if (gp && gp.vibrationActuator && typeof gp.vibrationActuator.playEffect === 'function') {
                    // Sum the pattern as duration; pulse strength tracks kind.
                    const duration = Array.isArray(pattern)
                        ? Math.min(160, pattern.reduce((a, b) => a + b, 0))
                        : pattern;
                    const weak = (kind === 'dash' || kind === 'heavy') ? 0.6 : 0.35;
                    const strong = (kind === 'dash' || kind === 'heavy') ? 0.8 : 0.45;
                    gp.vibrationActuator.playEffect('dual-rumble', {
                        startDelay: 0,
                        duration,
                        weakMagnitude: weak,
                        strongMagnitude: strong
                    });
                    break;
                }
            }
        } catch (_) { /* not all browsers expose vibrationActuator */ }
    }

    applyRegionEnvironment(region) {
        // V1.9.6 Core Linkage - Lift dark regions so King Myco stays visible
        const litSky = new THREE.Color(region.skyColor).lerp(new THREE.Color(0xaabbdd), 0.65);
        const litGround = new THREE.Color(region.groundColor).lerp(new THREE.Color(0xbbbbcc), 0.55);
        this.scene.background = litSky;
        
        const restorationFactor = this.progression.getRestorationProgress() / 100; // 0 to 1

        // Clearer fog for a Roblox look - pushed far so the world reads bright
        // V1.9.27 - Mobile pulls the fog far-plane in to act as an implicit LOD
        // cutoff: anything beyond it is fogged to sky color (and clipped by the
        // tighter camera far-plane), reducing draw calls and fragment work.
        let fogFar = region.isSafeZone ? 700 : (450 + restorationFactor * 250);
        if (this.mobilePerf) fogFar = Math.min(fogFar, region.isSafeZone ? 320 : 260);
        this.scene.fog = new THREE.Fog(litSky, 120, fogFar);
        
        if (this.groundMat) {
            // V1.9.8 - If the grass texture is in use, keep color white so the grass reads true.
            if (this.groundMat.map) {
                this.groundMat.color.setHex(0xffffff);
                this.groundMat.emissive = new THREE.Color(0x224422).multiplyScalar(0.18);
            } else {
                this.groundMat.color.copy(litGround);
                this.groundMat.emissive = new THREE.Color(litGround).multiplyScalar(0.35);
            }
            this.groundMat.roughness = 0.85;
            this.groundMat.metalness = 0.0;
        }
        
        // V1.9.7 - Set a sane baseline, then let applyCycleLighting() drive the final values.
        if (this.neonSun) {
            this.neonSun.color.setHex(0xffffff);
            this.neonSun.intensity = 2.6;
            this.neonSun.position.set(50, 100, 50);
        }

        if (this.ambientLight) {
            this.ambientLight.color.setHex(0xffffff);
            this.ambientLight.intensity = 2.0;
        }

        if (this.magentaRim) {
            this.magentaRim.color.setHex(0xffccff);
            this.magentaRim.intensity = 0.7;
        }

        // Hemisphere light gives even sky-to-ground fill so nothing falls into pure black
        if (!this.hemiLight) {
            this.hemiLight = new THREE.HemisphereLight(0xffffff, 0xffffff, 1.2);
            this.scene.add(this.hemiLight);
        }
        this.hemiLight.color.copy(litSky).lerp(new THREE.Color(0xffffff), 0.5);
        this.hemiLight.groundColor.copy(litGround).lerp(new THREE.Color(0xffffff), 0.4);
        this.hemiLight.intensity = 1.4;

        // Simpler particles (Roblox-style Sparkles)
        if (this.particles) this.scene.remove(this.particles);
        
        const particleCount = 500;
        const geometry = new THREE.BufferGeometry();
        const positions = new Float32Array(particleCount * 3);
        const velocities = new Float32Array(particleCount * 3);
        
        for (let i = 0; i < particleCount; i++) {
            positions[i * 3] = (Math.random() - 0.5) * 300;
            positions[i * 3 + 1] = Math.random() * 50;
            positions[i * 3 + 2] = (Math.random() - 0.5) * 300;
            
            velocities[i * 3] = 0;
            velocities[i * 3 + 1] = -(0.02 + Math.random() * 0.05);
            velocities[i * 3 + 2] = 0;
        }

        geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        
        const material = new THREE.PointsMaterial({ 
            size: 0.5, 
            color: region.accent, 
            transparent: true, 
            opacity: 0.5,
            sizeAttenuation: true
        });
        
        this.particles = new THREE.Points(geometry, material);
        this.particles.userData.velocities = velocities;
        this.scene.add(this.particles);
    }

    syncPlayerStats() {
        this.player.level = this.progression.data.level;
        this.player.xp = this.progression.data.xp;
        this.player.nextLevelXp = this.progression.data.nextLevelXp;
        this.player.blueSpores = this.progression.data.blueSpores;
        this.player.goldenSpores = this.progression.data.goldenSpores;
        this.player.alignment = this.progression.data.alignment;
        this.player.unlockedRegions = this.progression.data.unlockedRegions;
        this.player.upgrades = this.progression.data.upgrades;
        this.player.forgeLevels = this.progression.data.home.forgeLevels || { weapons: 0, armor: 0 };
        
        // Sync accessories
        const equipped = this.progression.data.equippedAccessories || { cape: null, crown: null };
        this.player.setAccessory('CAPE', equipped.cape);
        this.player.setAccessory('CROWN', equipped.crown);
    }

    spawnNocturnalMushrooms() {
        // Remove old ones
        this.nocturnalMushrooms.forEach(m => this.scene.remove(m));
        this.nocturnalMushrooms = [];

        const count = 40;
        const region = this.currentRegion;

        for (let i = 0; i < count; i++) {
            const group = new THREE.Group();
            const x = (Math.random() - 0.5) * 400;
            const z = (Math.random() - 0.5) * 400;
            
            // Stem
            const stemGeo = new THREE.CylinderGeometry(0.1, 0.2, 1, 6);
            const stemMat = new THREE.MeshStandardMaterial({ color: 0x111111 });
            const stem = new THREE.Mesh(stemGeo, stemMat);
            stem.position.y = 0.5;
            group.add(stem);

            // Glowing Cap
            const capGeo = new THREE.SphereGeometry(0.6, 8, 8, 0, Math.PI * 2, 0, Math.PI / 2);
            const capMat = new THREE.MeshStandardMaterial({ 
                color: 0x00ffff, 
                emissive: 0x00ffff, 
                emissiveIntensity: 0,
                transparent: true,
                opacity: 0
            });
            const cap = new THREE.Mesh(capGeo, capMat);
            cap.position.y = 1;
            group.add(cap);

            // Light (initially off)
            const light = new THREE.PointLight(0x00ffff, 0, 10);
            light.position.y = 1.5;
            group.add(light);

            group.position.set(x, 0, z);
            group.scale.set(0.1, 0.1, 0.1); // Start tiny
            
            group.userData = {
                cap: cap,
                light: light,
                baseScale: 0.5 + Math.random() * 1.5,
                color: new THREE.Color().setHSL(0.5 + Math.random() * 0.2, 1, 0.5) // Shades of cyan/blue/purple
            };
            
            cap.material.color.copy(group.userData.color);
            cap.material.emissive.copy(group.userData.color);
            light.color.copy(group.userData.color);

            this.scene.add(group);
            this.nocturnalMushrooms.push(group);
        }
    }

    createRegionAssets() {
        // Clear old assets
        this.npcs.forEach(n => n.destroy());
        this.buildings.forEach(b => this.scene.remove(b.mesh));
        this.portals.forEach(p => p.destroy());
        if (this.areaLabels) {
            this.areaLabels.forEach(l => this.scene.remove(l));
        }
        this.npcs = [];
        this.buildings = [];
        this.portals = [];
        this.areaLabels = [];

        // Spawn Village if exists in region config.
        // V1.9.13 - Hub village pushed out to its own clearing so the King's Sanctuary
        // (portal ring at origin) and the village read as two distinct landmarks.
        if (this.currentRegion.village) {
            const village = this.currentRegion.village;
            const isHub = this.currentRegion.id === 'region8';
            const center = isHub ? new THREE.Vector3(40, 0, -30) : new THREE.Vector3(20, 0, 20);

            // Spawn Buildings
            const shop = new InteractiveBuilding3D(this.scene, center.clone().add(new THREE.Vector3(15, 0, 0)), 'SHOP', this.currentRegion.id);
            const save = new InteractiveBuilding3D(this.scene, center.clone().add(new THREE.Vector3(-15, 0, 0)), 'SAVE', this.currentRegion.id);
            const storage = new InteractiveBuilding3D(this.scene, center.clone().add(new THREE.Vector3(0, 0, 15)), 'STORAGE', this.currentRegion.id);
            
            this.buildings.push(shop, save, storage);
            this.collidables.push(shop.mesh, save.mesh, storage.mesh);

            // Spawn Village NPCs
            village.npcs.forEach((npcCfg, i) => {
                const angle = (i / village.npcs.length) * Math.PI * 2;
                const pos = center.clone().add(new THREE.Vector3(Math.cos(angle) * 10, 0, Math.sin(angle) * 10));
                const npc = new NPC3D(this.scene, pos, npcCfg.name, npcCfg);
                npc.role = npcCfg.role;
                // V1.9.37 - If the village NPC carries its own dialogue tree
                // (e.g. the expanded Sporewood roster), promote it to the NPC
                // root so interactNPC()'s `npc.dialogue` lookup finds it.
                // Without this, the fallback walks to npc.config.npc.dialogue
                // which is region-level and undefined for village configs.
                if (npcCfg.dialogue) npc.dialogue = npcCfg.dialogue;
                this.npcs.push(npc);
            });

            const villageLabel = this.createFloatingLabel(village.name, this.currentRegion.accent);
            villageLabel.position.copy(center).add(new THREE.Vector3(0, 15, 0));
            this.areaLabels.push(villageLabel);
        }

        // Add NPC for the current region
        if (this.currentRegion.npc) {
            const npc = new NPC3D(this.scene, new THREE.Vector3(5, 0, 5), this.currentRegion.npc.name, this.currentRegion.npc);
            this.npcs.push(npc);
        }

        // Add Hub Specific NPCs for Lore
        if (this.currentRegion.id === 'region8') {
            // Chronicler NPC
            const chronicler = new NPC3D(this.scene, new THREE.Vector3(-10, 0, 10), "Chronicler", { sprite: 'npc-sprig.webp' });
            chronicler.dialogue = this.currentRegion.npc.dialogue; // Use region 8 dialogue
            this.npcs.push(chronicler);
        }

        // Spawn Rot Clusters (Obstacles)
        if (!this.currentRegion.isSafeZone) {
            const clusterCount = 10 + Math.floor(Math.random() * 15);
            for (let i = 0; i < clusterCount; i++) {
                const angle = Math.random() * Math.PI * 2;
                const dist = 10 + Math.random() * 60;
                const pos = new THREE.Vector3(Math.cos(angle) * dist, 0, Math.sin(angle) * dist);
                const cluster = new RotCluster3D(this.scene, pos, 0.5 + Math.random() * 1.5);
                this.rotClusters.push(cluster);
            }
        }

        // Add Return Portal or Regional Hazards
        if (this.currentRegion.id === 'region8') {
            // V1.9.13 - Wider portal ring + hub landmarks. Portals sit at r=70 so
            // King Myco has room to actually walk between distinct hub zones.
            CONFIG.REGIONS.forEach((reg, i) => {
                if (reg.id === 'region8') return;
                const angle = (i / (CONFIG.REGIONS.length - 1)) * Math.PI * 2;
                const dist = reg.id === 'mushroomKingdom' ? 25 : 70;
                const pos = new THREE.Vector3(Math.cos(angle) * dist, 0, Math.sin(angle) * dist);
                const isLocked = !this.progression.data.unlockedRegions.includes(reg.id);
                const portal = new Portal3D(this.scene, pos, reg.id, isLocked);
                portal.requirementText = reg.requirement || "";
                this.portals.push(portal);
            });
            this.buildHubLandmarks();
        } else {
            // Add return portal in non-hub regions
            const portal = new Portal3D(this.scene, new THREE.Vector3(0, 0, -20), 'region8', false);
            this.portals.push(portal);

            // Regional specific hazards
            if (this.currentRegion.id === 'thronecap' || this.currentRegion.id === 'voidlichen') {
                for(let i=0; i<8; i++) {
                    const angle = Math.random() * Math.PI * 2;
                    const dist = 10 + Math.random() * 20;
                    const pos = new THREE.Vector3(Math.cos(angle) * dist, 0, Math.sin(angle) * dist);
                    const hazard = new VoxelCorruptedHazard3D(this.scene, pos);
                    this.hazards.push(hazard);
                }
            }
        }

        // Add Restoration Landmarks for Sporewood
        this.spawnRestorationLandmarks();

        // V1.9.14 - Boss Dungeon door + Sage NPC for non-hub regions.
        this.buildBossDungeon();
    }

    // V1.9.13 - Expanded hub world. Four themed zones spread around the King's
    // Sanctuary so the opening area feels worth exploring. Pure scenery + light
    // collidables; no enemies (hub stays safe).
    buildHubLandmarks() {
        if (this.hubLandmarksGroup) {
            this.scene.remove(this.hubLandmarksGroup);
        }
        const root = new THREE.Group();
        this.hubLandmarksGroup = root;
        this.scene.add(root);

        const zones = [
            { name: 'ASHEN GROVE',        center: new THREE.Vector3(-85, 0, -55), color: 0xff5522, builder: 'ashen' },
            { name: 'CRYSTAL HOLLOW',     center: new THREE.Vector3( 90, 0, -55), color: 0xff44ff, builder: 'crystal' },
            { name: 'BONE GARDEN',        center: new THREE.Vector3(-95, 0,  60), color: 0xeeeecc, builder: 'bone' },
            { name: 'SPORE BLOOM MEADOW', center: new THREE.Vector3( 85, 0,  75), color: 0x39ff14, builder: 'meadow' }
        ];

        const addCollidable = (mesh, radius) => {
            mesh.userData.radius = radius;
            this.collidables.push(mesh);
        };

        zones.forEach(zone => {
            const g = new THREE.Group();
            g.position.copy(zone.center);
            root.add(g);

            // Floating area label
            const label = this.createFloatingLabel(zone.name, zone.color);
            label.position.copy(zone.center).add(new THREE.Vector3(0, 14, 0));
            this.areaLabels.push(label);

            // Soft ambient point light to color the zone at night.
            const tint = new THREE.PointLight(zone.color, 1.2, 40, 1.4);
            tint.position.set(0, 8, 0);
            g.add(tint);

            if (zone.builder === 'ashen') {
                // Burnt twisted trees + glowing embers.
                for (let i = 0; i < 14; i++) {
                    const tx = (Math.random() - 0.5) * 36;
                    const tz = (Math.random() - 0.5) * 36;
                    const trunkH = 5 + Math.random() * 4;
                    const trunk = new THREE.Mesh(
                        new THREE.CylinderGeometry(0.35, 0.55, trunkH, 7),
                        new THREE.MeshStandardMaterial({ color: 0x1a0d08, roughness: 1 })
                    );
                    trunk.position.set(tx, trunkH / 2, tz);
                    trunk.rotation.z = (Math.random() - 0.5) * 0.4;
                    g.add(trunk);
                    // gnarled top branches
                    for (let b = 0; b < 3; b++) {
                        const br = new THREE.Mesh(
                            new THREE.CylinderGeometry(0.12, 0.22, 1.8 + Math.random(), 6),
                            new THREE.MeshStandardMaterial({ color: 0x120806, roughness: 1 })
                        );
                        br.position.set(tx + (Math.random() - 0.5) * 1.5, trunkH + 0.6, tz + (Math.random() - 0.5) * 1.5);
                        br.rotation.set((Math.random() - 0.5) * 1.2, Math.random() * Math.PI, (Math.random() - 0.5) * 1.2);
                        g.add(br);
                    }
                    addCollidable(trunk, 0.8);
                }
                // Drifting ember points
                for (let e = 0; e < 30; e++) {
                    const ember = new THREE.Mesh(
                        new THREE.SphereGeometry(0.12, 6, 6),
                        new THREE.MeshBasicMaterial({ color: 0xff7733 })
                    );
                    ember.position.set((Math.random() - 0.5) * 38, 1.5 + Math.random() * 6, (Math.random() - 0.5) * 38);
                    g.add(ember);
                }
            } else if (zone.builder === 'crystal') {
                // Cluster of glowing crystals around a small reflective pool.
                const pool = new THREE.Mesh(
                    new THREE.CylinderGeometry(8, 8, 0.2, 32),
                    new THREE.MeshStandardMaterial({ color: 0x220033, emissive: 0x441166, metalness: 0.6, roughness: 0.15, transparent: true, opacity: 0.85 })
                );
                pool.position.y = 0.1;
                g.add(pool);

                for (let i = 0; i < 22; i++) {
                    const a = (i / 22) * Math.PI * 2 + Math.random() * 0.3;
                    const r = 5 + Math.random() * 14;
                    const h = 2 + Math.random() * 6;
                    const crystal = new THREE.Mesh(
                        new THREE.ConeGeometry(0.8 + Math.random() * 0.8, h, 5),
                        new THREE.MeshStandardMaterial({
                            color: zone.color,
                            emissive: zone.color,
                            emissiveIntensity: 1.2,
                            transparent: true,
                            opacity: 0.85,
                            roughness: 0.2,
                            metalness: 0.3
                        })
                    );
                    crystal.position.set(Math.cos(a) * r, h / 2, Math.sin(a) * r);
                    crystal.rotation.z = (Math.random() - 0.5) * 0.4;
                    g.add(crystal);
                    addCollidable(crystal, 1.0);
                }
            } else if (zone.builder === 'bone') {
                // Ribcage arches + skull cairns.
                for (let i = 0; i < 5; i++) {
                    const a = (i / 5) * Math.PI * 2;
                    const cx = Math.cos(a) * 10;
                    const cz = Math.sin(a) * 10;
                    // arch posts
                    const postL = new THREE.Mesh(
                        new THREE.CylinderGeometry(0.35, 0.5, 6, 8),
                        new THREE.MeshStandardMaterial({ color: 0xe8e2c0, roughness: 0.6 })
                    );
                    postL.position.set(cx - 1.5, 3, cz);
                    g.add(postL); addCollidable(postL, 0.6);
                    const postR = postL.clone(); postR.position.x = cx + 1.5; g.add(postR); addCollidable(postR, 0.6);
                    // arch top (torus segment)
                    const arch = new THREE.Mesh(
                        new THREE.TorusGeometry(1.6, 0.28, 6, 12, Math.PI),
                        new THREE.MeshStandardMaterial({ color: 0xeee8c8, roughness: 0.6 })
                    );
                    arch.position.set(cx, 6, cz);
                    arch.rotation.x = Math.PI / 2;
                    g.add(arch);
                }
                // Skull cairns
                for (let s = 0; s < 8; s++) {
                    const sx = (Math.random() - 0.5) * 32;
                    const sz = (Math.random() - 0.5) * 32;
                    const stack = 2 + Math.floor(Math.random() * 3);
                    for (let k = 0; k < stack; k++) {
                        const skull = new THREE.Mesh(
                            new THREE.BoxGeometry(0.9, 0.75, 0.85),
                            new THREE.MeshStandardMaterial({ color: 0xf2ecd0, roughness: 0.7 })
                        );
                        skull.position.set(sx, 0.4 + k * 0.8, sz);
                        skull.rotation.y = Math.random() * Math.PI;
                        g.add(skull);
                        if (k === stack - 1) addCollidable(skull, 0.7);
                    }
                }
            } else if (zone.builder === 'meadow') {
                // Vibrant flowering giant mushrooms — the welcoming zone.
                const palette = [0xff66aa, 0xffe066, 0x77ddff, 0x39ff14, 0xff8844];
                for (let i = 0; i < 18; i++) {
                    const tx = (Math.random() - 0.5) * 38;
                    const tz = (Math.random() - 0.5) * 38;
                    const sc = 0.9 + Math.random() * 1.6;
                    const stem = new THREE.Mesh(
                        new THREE.CylinderGeometry(0.45 * sc, 0.6 * sc, 3 * sc, 10),
                        new THREE.MeshStandardMaterial({ color: 0xfff2d4, roughness: 0.7 })
                    );
                    stem.position.set(tx, 1.5 * sc, tz);
                    g.add(stem);
                    const capColor = palette[i % palette.length];
                    const cap = new THREE.Mesh(
                        new THREE.SphereGeometry(1.6 * sc, 16, 10, 0, Math.PI * 2, 0, Math.PI / 2),
                        new THREE.MeshStandardMaterial({ color: capColor, emissive: capColor, emissiveIntensity: 0.45, roughness: 0.4 })
                    );
                    cap.position.set(tx, 3 * sc, tz);
                    g.add(cap);
                    // White spots
                    for (let s = 0; s < 5; s++) {
                        const ang = (s / 5) * Math.PI * 2;
                        const spot = new THREE.Mesh(
                            new THREE.SphereGeometry(0.22 * sc, 8, 8),
                            new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.6 })
                        );
                        spot.position.set(tx + Math.cos(ang) * 0.9 * sc, 3.6 * sc, tz + Math.sin(ang) * 0.9 * sc);
                        g.add(spot);
                    }
                    addCollidable(stem, 0.7 * sc);
                }
                // Scattered flower puffs
                for (let f = 0; f < 40; f++) {
                    const flower = new THREE.Mesh(
                        new THREE.SphereGeometry(0.25, 6, 6),
                        new THREE.MeshStandardMaterial({ color: palette[f % palette.length], emissive: palette[f % palette.length], emissiveIntensity: 0.3 })
                    );
                    flower.position.set((Math.random() - 0.5) * 40, 0.25, (Math.random() - 0.5) * 40);
                    g.add(flower);
                }
            }
        });

        // Central plaza: ring of standing stones around the King's Sanctuary.
        for (let i = 0; i < 10; i++) {
            const a = (i / 10) * Math.PI * 2;
            const r = 14;
            const stone = new THREE.Mesh(
                new THREE.BoxGeometry(1.4, 4 + Math.random() * 1.5, 0.9),
                new THREE.MeshStandardMaterial({ color: 0x4a4458, roughness: 0.9 })
            );
            stone.position.set(Math.cos(a) * r, 2 + Math.random() * 0.5, Math.sin(a) * r);
            stone.rotation.y = a + Math.PI / 2 + (Math.random() - 0.5) * 0.2;
            root.add(stone);
            addCollidable(stone, 0.9);
        }

        // Lantern path between sanctuary (origin) and village (40,-30).
        const lanternEnd = new THREE.Vector3(40, 0, -30);
        const steps = 8;
        for (let i = 1; i <= steps; i++) {
            const t = i / (steps + 1);
            const lx = lanternEnd.x * t + (Math.random() - 0.5) * 0.8;
            const lz = lanternEnd.z * t + (Math.random() - 0.5) * 0.8;
            const post = new THREE.Mesh(
                new THREE.CylinderGeometry(0.12, 0.16, 2.4, 6),
                new THREE.MeshStandardMaterial({ color: 0x2a1d12, roughness: 0.8 })
            );
            post.position.set(lx, 1.2, lz);
            root.add(post);
            const lamp = new THREE.Mesh(
                new THREE.SphereGeometry(0.32, 10, 10),
                new THREE.MeshStandardMaterial({ color: 0xffe18a, emissive: 0xffc466, emissiveIntensity: 1.4 })
            );
            lamp.position.set(lx, 2.55, lz);
            root.add(lamp);
            const lampLight = new THREE.PointLight(0xffc466, 1.0, 10, 1.5);
            lampLight.position.set(lx, 2.6, lz);
            root.add(lampLight);
        }

        // Sanctuary signpost so the central area is clearly named.
        const sanctuaryLabel = this.createFloatingLabel("KING'S SANCTUARY", 0xffd166);
        sanctuaryLabel.position.set(0, 12, 0);
        this.areaLabels.push(sanctuaryLabel);
    }

    // V1.9.14 - Build the boss dungeon entrance for the current non-hub region.
    // The dungeon is a sealed stone gateway + barrier dome around the boss arena.
    // Interacting with the door opens the requirements modal. When all requirements
    // are met, the player can OPEN GATE — the barrier drops, the boss spawns inside.
    buildBossDungeon() {
        // Always tear down any previous instance so leveling between regions is clean.
        if (this.bossDungeon) {
            this.scene.remove(this.bossDungeon.group);
            this.bossDungeon = null;
        }
        const region = this.currentRegion;
        if (!region || region.id === 'region8' || region.isSafeZone) return;
        const dCfg = (CONFIG.BOSS_DUNGEONS || {})[region.id];
        if (!dCfg) return;

        const accent = region.accent || 0xff5555;
        const arenaPos = new THREE.Vector3(0, 0, 55);
        const doorPos = arenaPos.clone().add(new THREE.Vector3(0, 0, -16)); // 16 units in front of arena

        const group = new THREE.Group();
        this.scene.add(group);

        // --- Stone gateway (two pillars + lintel) ---
        const stoneMat = new THREE.MeshStandardMaterial({ color: 0x2a242a, roughness: 0.95 });
        const runeMat = new THREE.MeshStandardMaterial({ color: accent, emissive: accent, emissiveIntensity: 1.6 });

        const pillarL = new THREE.Mesh(new THREE.BoxGeometry(1.6, 8, 1.6), stoneMat);
        pillarL.position.set(doorPos.x - 3.2, 4, doorPos.z);
        group.add(pillarL); this.collidables.push(pillarL); pillarL.userData.radius = 1.0;

        const pillarR = pillarL.clone();
        pillarR.position.x = doorPos.x + 3.2;
        group.add(pillarR); this.collidables.push(pillarR); pillarR.userData.radius = 1.0;

        const lintel = new THREE.Mesh(new THREE.BoxGeometry(9, 1.6, 2), stoneMat);
        lintel.position.set(doorPos.x, 8.5, doorPos.z);
        group.add(lintel);

        // Glowing rune bar across the lintel — the visible "seal".
        const runeBar = new THREE.Mesh(new THREE.BoxGeometry(7, 0.35, 0.35), runeMat);
        runeBar.position.set(doorPos.x, 8.5, doorPos.z - 0.95);
        group.add(runeBar);

        // --- Sealed barrier (translucent dome that disappears on unlock) ---
        const barrierGeo = new THREE.PlaneGeometry(7.5, 8);
        const barrierMat = new THREE.MeshStandardMaterial({
            color: accent, emissive: accent, emissiveIntensity: 0.9,
            transparent: true, opacity: 0.55, side: THREE.DoubleSide
        });
        const barrier = new THREE.Mesh(barrierGeo, barrierMat);
        barrier.position.set(doorPos.x, 4, doorPos.z);
        group.add(barrier);

        // Sparkle line that pulses on the barrier so the player can tell it is alive.
        const barrierLight = new THREE.PointLight(accent, 2.2, 14, 1.4);
        barrierLight.position.set(doorPos.x, 4, doorPos.z);
        group.add(barrierLight);

        // Floating area label
        const dungeonLabel = this.createFloatingLabel(`${region.name.toUpperCase()} DUNGEON`, accent);
        dungeonLabel.position.set(doorPos.x, 12, doorPos.z);
        group.add(dungeonLabel);

        // --- Arena ring behind the door so the player can see the killing ground ---
        const ring = new THREE.Mesh(
            new THREE.RingGeometry(11, 12, 32),
            new THREE.MeshBasicMaterial({ color: accent, side: THREE.DoubleSide, transparent: true, opacity: 0.45 })
        );
        ring.rotation.x = -Math.PI / 2;
        ring.position.copy(arenaPos).setY(0.05);
        group.add(ring);

        // --- Sage NPC standing just outside the gateway ---
        let sage = null;
        if (dCfg.sage) {
            const sagePos = doorPos.clone().add(new THREE.Vector3(-7, 0, -3));
            sage = new NPC3D(this.scene, sagePos, dCfg.sage.name, {
                sprite: 'npc-sprig.webp'
            });
            sage.role = 'SAGE';
            // Build a dialogue tree that delivers the dungeon requirements + tactic clue.
            sage.dialogue = {
                root: {
                    text: `Hold, King Myco. The ${dCfg.bossName} stirs beyond this gate. Are you ready to hear what the seal demands?`,
                    options: [
                        { label: "TELL ME WHAT THE SEAL DEMANDS", next: 'gate' },
                        { label: "HOW DO I FIGHT IT?",             next: 'tactic' },
                        { label: "LATER, SAGE.",                   next: null }
                    ]
                },
                gate: {
                    text: `The seal will not break for the unworthy. You must arrive bearing the ${dCfg.keyItem ? (CONFIG.PORTAL_KEYS[Object.keys(CONFIG.PORTAL_KEYS).find(k => CONFIG.PORTAL_KEYS[k].id === dCfg.keyItem)] || {}).name || 'key' : 'tokens of mastery'}, no fewer than ${dCfg.minShards} Crown Shards, ${dCfg.minSpores} Blue Spores, and the magic of ${dCfg.requireMagic ? dCfg.requireMagic.replace(/_/g, ' ').toUpperCase() : 'your own resolve'}. Reach level ${dCfg.minLevel} or higher, or the gate will sear you.`,
                    options: [{ label: "AND THE TACTIC?", next: 'tactic' }, { label: "I UNDERSTAND.", next: null }]
                },
                tactic: {
                    text: `${dCfg.sage.clue}\n\n${dCfg.sage.tactic}`,
                    options: [{ label: "I AM READY.", next: null }]
                }
            };
            this.npcs.push(sage);
        }

        this.bossDungeon = {
            group, regionId: region.id, cfg: dCfg, accent,
            doorPos, arenaPos, barrier, barrierLight, runeBar, ring,
            sage, opened: false, bossSpawned: false
        };
    }

    // V1.9.14 - Open the dungeon gate. Validates requirements, consumes spores,
    // drops the barrier, then spawns the boss inside the arena.
    tryOpenBossDungeon() {
        const d = this.bossDungeon;
        if (!d || d.opened) return;
        const check = this._evaluateDungeonRequirements(d.cfg);
        if (!check.allMet) {
            this.showFloatingText("THE SEAL HOLDS — REQUIREMENTS UNMET", 0xff4444, true);
            try { this.uiSynth.triggerAttackRelease("A2", "8n"); } catch (_) {}
            return;
        }
        // Consume cost.
        if (d.cfg.minSpores > 0) {
            this.progression.data.blueSpores = Math.max(0, this.progression.data.blueSpores - d.cfg.minSpores);
            this.progression.save();
            this.updateHud();
        }
        d.opened = true;
        // Drop the barrier + extinguish the seal.
        try {
            d.barrier.material.opacity = 0.0;
            d.barrier.visible = false;
            d.runeBar.material.emissiveIntensity = 0.1;
            d.barrierLight.intensity = 0.4;
        } catch (_) {}
        this.showFloatingText("THE SEAL BREAKS!", d.accent || 0xffff66, true);
        try {
            const synth = new TONE.PolySynth().toDestination();
            const t = TONE.now();
            synth.triggerAttackRelease(['C4', 'E4', 'G4'], '8n', t);
            synth.triggerAttackRelease(['G4', 'B4', 'D5'], '4n', t + 0.18);
        } catch (_) {}
        // Spawn boss inside the arena.
        this.spawnBossForRegion(d.arenaPos.clone());
    }

    // V1.9.14 - Evaluate dungeon requirements against current progression.
    // Returns rows for the modal + an `allMet` flag.
    _evaluateDungeonRequirements(cfg) {
        const p = this.progression.data;
        const keyItems = p.keyItems || {};
        const upgrades = p.upgrades || {};
        const rows = [];

        rows.push({
            label: `Reach Level ${cfg.minLevel}`,
            met: (p.level || 1) >= cfg.minLevel,
            progress: `LVL ${p.level || 1} / ${cfg.minLevel}`
        });

        rows.push({
            label: `Hold ${cfg.minShards} Crown Shard${cfg.minShards === 1 ? '' : 's'}`,
            met: (p.shardsCollected || 0) >= cfg.minShards,
            progress: `${p.shardsCollected || 0} / ${cfg.minShards}`
        });

        rows.push({
            label: `Offer ${cfg.minSpores} Blue Spores`,
            hint: 'Spent when the seal breaks',
            met: (p.blueSpores || 0) >= cfg.minSpores,
            progress: `${p.blueSpores || 0} / ${cfg.minSpores}`
        });

        if (cfg.requireMagic) {
            const skill = (CONFIG.SKILLS || []).find(s => s.id === cfg.requireMagic);
            const name = skill ? skill.name : cfg.requireMagic.replace(/_/g, ' ');
            const learned = (upgrades[cfg.requireMagic] || 0) > 0;
            rows.push({
                label: `Learn the magic of ${name}`,
                hint: 'Spend a skill point in the Skill Menu',
                met: learned,
                progress: learned ? 'Learned' : 'Unknown'
            });
        }

        if (cfg.keyItem) {
            // Find the key cfg by item id.
            const keyEntry = Object.values(CONFIG.PORTAL_KEYS || {}).find(k => k.id === cfg.keyItem);
            const keyName = keyEntry ? keyEntry.name : cfg.keyItem;
            const have = (keyItems[cfg.keyItem] || 0) > 0;
            rows.push({
                label: `Bear the ${keyName}`,
                hint: keyEntry ? `Dropped by ${keyEntry.droppedBy}` : '',
                met: have,
                progress: have ? '✓ in inventory' : 'Not yet found'
            });
        }

        const allMet = rows.every(r => r.met);
        return { rows, allMet };
    }

    // V1.9.14 - Boss Dungeon requirements + Sage's Counsel modal.
    showBossDungeonRequirements() {
        const d = this.bossDungeon;
        if (!d || this.gameState === 'DIALOGUE') return;
        this.gameState = 'DIALOGUE';
        this.player.keys.interact = false;

        const accentHex = '#' + (d.accent || 0xff5555).toString(16).padStart(6, '0');
        const cfg = d.cfg;
        const { rows, allMet } = this._evaluateDungeonRequirements(cfg);

        const reqRows = rows.map(r => `
            <div style="display:flex; align-items:center; gap:10px; padding: 8px 4px; border-bottom: 1px solid #222;">
                <div style="width:22px; height:22px; border-radius: 4px; border: 1px solid ${r.met ? '#39FF14' : '#666'}; background: ${r.met ? '#39FF14' : 'transparent'}; color: #000; font-weight: bold; display:flex; align-items:center; justify-content:center; font-size: 14px;">
                    ${r.met ? '✓' : ''}
                </div>
                <div style="flex:1; font-size: 11px; color: ${r.met ? '#cfc' : '#ccc'}; text-decoration: ${r.met ? 'line-through' : 'none'};">
                    ${r.label}
                    ${r.hint ? `<div style="font-size: 9px; color: #888; margin-top: 2px; text-decoration: none; font-style: italic;">${r.hint}</div>` : ''}
                </div>
                <div style="font-size: 10px; color: ${r.met ? '#39FF14' : '#888'}; white-space: nowrap;">
                    ${r.progress || ''}
                </div>
            </div>
        `).join('');

        const sageBlock = cfg.sage ? `
            <div style="margin-top: 16px; padding: 12px; background: rgba(20,20,30,0.85); border-left: 3px solid ${accentHex};">
                <div style="font-size: 10px; color: ${accentHex}; margin-bottom: 6px; letter-spacing: 1px;">— ${cfg.sage.name.toUpperCase()}'S COUNSEL —</div>
                <div style="font-size: 10px; color: #e8e8d8; line-height: 1.55; margin-bottom: 6px;">${cfg.sage.clue}</div>
                <div style="font-size: 9px; color: #aac; font-style: italic;">${cfg.sage.tactic}</div>
            </div>
        ` : '';

        const buttonRow = d.opened
            ? `<button disabled style="flex:1; padding: 12px; background: #1a1a1a; color: #888; border: 1px solid #444; font-size: 11px;">GATE OPEN — ENTER THE ARENA</button>`
            : (allMet
                ? `<button onclick="window.__dungeonOpen()" style="flex:1; padding: 12px; background: ${accentHex}; color: black; border: none; font-weight: bold; font-size: 12px; cursor: pointer;">BREAK THE SEAL</button>`
                : `<button disabled style="flex:1; padding: 12px; background: #222; color: #666; border: 1px dashed #444; font-size: 12px;">SEALED — REQUIREMENTS UNMET</button>`);

        this.uiOverlay.innerHTML = `
            <div style="pointer-events: auto; background: rgba(0,0,0,0.95); padding: 28px; border: 2px solid ${accentHex}; width: 90%; max-width: 600px; text-align: left; box-shadow: 0 0 30px ${accentHex}77;">
                <div style="display:flex; align-items:center; justify-content:space-between; margin-bottom: 6px;">
                    <h3 style="color: ${accentHex}; font-size: 14px; margin: 0;">DUNGEON: ${cfg.bossName.toUpperCase()}</h3>
                    <div style="font-size: 10px; padding: 4px 10px; border-radius: 12px; background: ${d.opened ? '#0a3' : (allMet ? '#a83' : '#a30')}; color: white;">
                        ${d.opened ? 'OPEN' : (allMet ? 'READY TO BREAK' : 'SEALED')}
                    </div>
                </div>
                <p style="font-size: 11px; color: #aaa; font-style: italic; margin-bottom: 18px;">The ${cfg.bossName} waits in the ${this.currentRegion.name}.</p>

                <div style="font-size: 11px; color: ${accentHex}; margin-bottom: 8px;">— REQUIREMENTS —</div>
                <div style="margin-bottom: 8px;">${reqRows}</div>

                ${sageBlock}

                <div style="display: flex; gap: 10px; margin-top: 20px;">
                    ${buttonRow}
                    <button onclick="window.closeDialogue()" style="padding: 12px 18px; background: #1a1a1a; color: white; border: 1px solid #444; font-size: 11px; cursor: pointer;">LEAVE</button>
                </div>
            </div>
        `;

        window.__dungeonOpen = () => {
            window.closeDialogue();
            this.tryOpenBossDungeon();
        };
    }

    spawnRestorationLandmarks() {
        if (this.currentRegion.id !== 'sporewood') return;
        
        if (this.landmarksGroup) {
            this.scene.remove(this.landmarksGroup);
        }
        this.landmarksGroup = new THREE.Group();
        this.scene.add(this.landmarksGroup);

        const progress = this.progression.getRestorationProgress();

        // 10% - RPC Handshake Node
        if (progress >= 10) {
            const node = this.createRPCHandshakeNode();
            node.position.set(-15, 0, -15);
            this.landmarksGroup.add(node);
        }

        // 25% - Reclaimed Sporewood Cache
        if (progress >= 25) {
            const cache = this.createSporewoodCache();
            cache.position.set(20, 0, -10);
            this.landmarksGroup.add(cache);
        }

        // 40% - Crystal Resonance Cluster
        if (progress >= 40) {
            const crystal = this.createCrystalResonanceCluster();
            crystal.position.set(-20, 0, 20);
            this.landmarksGroup.add(crystal);
        }

        // 60% - Marsh Filtration Pool
        if (progress >= 60) {
            const pool = this.createFiltrationPool();
            pool.position.set(15, 0.1, 25);
            this.landmarksGroup.add(pool);
        }

        // 75% - Silk-Net Encryption Secure
        if (progress >= 75) {
            const encryption = this.createEncryptionNodes();
            encryption.position.set(0, 5, 30);
            this.landmarksGroup.add(encryption);
        }

        // 90% - Furnace Ignition Verified
        if (progress >= 90) {
            const furnace = this.createPowerRelay();
            furnace.position.set(-25, 0, 0);
            this.landmarksGroup.add(furnace);
        }

        // 100% - Network Fully Restored
        if (progress >= 100) {
            const heart = this.createNetworkHeart();
            heart.position.set(0, 0, -40);
            this.landmarksGroup.add(heart);
            
            // Final Polish: Divine Glow in Sporewood
            this.ambientLight.color.setHex(0xccffcc);
            this.ambientLight.intensity = 3.0;
            this.showGlobalNotification("SPOREWOOD FULLY SYNCHRONIZED", "#39FF14");
        }
    }

    createRPCHandshakeNode() {
        const group = new THREE.Group();
        const baseGeo = new THREE.CylinderGeometry(0.5, 0.8, 1, 8);
        const baseMat = new THREE.MeshStandardMaterial({ color: 0x00ffff, wireframe: true });
        const base = new THREE.Mesh(baseGeo, baseMat);
        group.add(base);

        const coreGeo = new THREE.IcosahedronGeometry(0.4, 0);
        const coreMat = new THREE.MeshStandardMaterial({ color: 0x00ffff, emissive: 0x00ffff, emissiveIntensity: 2 });
        const core = new THREE.Mesh(coreGeo, coreMat);
        core.position.y = 1.2;
        group.add(core);

        const light = new THREE.PointLight(0x00ffff, 2, 5);
        light.position.y = 1.2;
        group.add(light);

        const label = this.createFloatingLabel("RPC NODE", 0x00ffff);
        label.position.y = 2.5;
        group.add(label);

        return group;
    }

    createSporewoodCache() {
        const group = new THREE.Group();
        const boxGeo = new THREE.BoxGeometry(2, 1.5, 1.5);
        const boxMat = new THREE.MeshStandardMaterial({ color: 0x39FF14, metalness: 0.8, roughness: 0.2 });
        const box = new THREE.Mesh(boxGeo, boxMat);
        box.position.y = 0.75;
        group.add(box);

        const glowGeo = new THREE.BoxGeometry(2.1, 0.1, 1.6);
        const glowMat = new THREE.MeshStandardMaterial({ color: 0xffffff, emissive: 0xffffff, emissiveIntensity: 5 });
        const glow = new THREE.Mesh(glowGeo, glowMat);
        glow.position.y = 0.8;
        group.add(glow);

        const label = this.createFloatingLabel("DATA CACHE", 0x39FF14);
        label.position.y = 2.5;
        group.add(label);

        return group;
    }

    createCrystalResonanceCluster() {
        const group = new THREE.Group();
        for (let i = 0; i < 5; i++) {
            const cryGeo = new THREE.CylinderGeometry(0, 0.5, 2 + Math.random() * 2, 4);
            const cryMat = new THREE.MeshStandardMaterial({ color: 0xaa00ff, emissive: 0xaa00ff, emissiveIntensity: 1, transparent: true, opacity: 0.7 });
            const cry = new THREE.Mesh(cryGeo, cryMat);
            cry.position.set((Math.random() - 0.5) * 2, 0, (Math.random() - 0.5) * 2);
            cry.rotation.set(Math.random() * 0.5, Math.random() * Math.PI, Math.random() * 0.5);
            cry.position.y = cry.geometry.parameters.height / 2;
            group.add(cry);
        }
        const label = this.createFloatingLabel("CRYSTAL RELAY", 0xaa00ff);
        label.position.y = 5;
        group.add(label);
        return group;
    }

    createFiltrationPool() {
        const group = new THREE.Group();
        const ringGeo = new THREE.TorusGeometry(3, 0.2, 8, 32);
        const ringMat = new THREE.MeshStandardMaterial({ color: 0x00ffff });
        const ring = new THREE.Mesh(ringGeo, ringMat);
        ring.rotation.x = Math.PI / 2;
        group.add(ring);

        const waterGeo = new THREE.CircleGeometry(3, 32);
        const waterMat = new THREE.MeshStandardMaterial({ color: 0x00ffff, transparent: true, opacity: 0.6, emissive: 0x00ffff, emissiveIntensity: 0.5 });
        const water = new THREE.Mesh(waterGeo, waterMat);
        water.rotation.x = -Math.PI / 2;
        group.add(water);

        const label = this.createFloatingLabel("LOGIC POOL", 0x00ffff);
        label.position.y = 2;
        group.add(label);
        return group;
    }

    createEncryptionNodes() {
        const group = new THREE.Group();
        const webGeo = new THREE.TorusKnotGeometry(2, 0.05, 128, 16);
        const webMat = new THREE.MeshStandardMaterial({ color: 0xffffff, transparent: true, opacity: 0.3 });
        const web = new THREE.Mesh(webGeo, webMat);
        group.add(web);

        for (let i = 0; i < 4; i++) {
            const nodeGeo = new THREE.BoxGeometry(0.4, 0.4, 0.4);
            const nodeMat = new THREE.MeshStandardMaterial({ color: 0x00ffff, emissive: 0x00ffff, emissiveIntensity: 2 });
            const node = new THREE.Mesh(nodeGeo, nodeMat);
            const angle = (i / 4) * Math.PI * 2;
            node.position.set(Math.cos(angle) * 2.5, Math.sin(angle) * 2.5, 0);
            group.add(node);
        }

        const label = this.createFloatingLabel("ENCRYPTION CANOPY", 0xffffff);
        label.position.y = 4;
        group.add(label);
        return group;
    }

    createPowerRelay() {
        const group = new THREE.Group();
        const baseGeo = new THREE.CylinderGeometry(1.5, 2, 3, 8);
        const baseMat = new THREE.MeshStandardMaterial({ color: 0x331111 });
        const base = new THREE.Mesh(baseGeo, baseMat);
        base.position.y = 1.5;
        group.add(base);

        const ventGeo = new THREE.CylinderGeometry(1.2, 1.2, 0.2, 8);
        const ventMat = new THREE.MeshStandardMaterial({ color: 0xff4400, emissive: 0xff0000, emissiveIntensity: 5 });
        const vent = new THREE.Mesh(ventGeo, ventMat);
        vent.position.y = 3.1;
        group.add(vent);

        const light = new THREE.PointLight(0xff4400, 5, 10);
        light.position.y = 4;
        group.add(light);

        const label = this.createFloatingLabel("POWER RELAY", 0xff4400);
        label.position.y = 5;
        group.add(label);
        return group;
    }

    createNetworkHeart() {
        const group = new THREE.Group();
        const trunkGeo = new THREE.CylinderGeometry(1, 2, 10, 8);
        const trunkMat = new THREE.MeshStandardMaterial({ color: 0x332211 });
        const trunk = new THREE.Mesh(trunkGeo, trunkMat);
        trunk.position.y = 5;
        group.add(trunk);

        const capGeo = new THREE.SphereGeometry(6, 16, 8, 0, Math.PI * 2, 0, Math.PI / 2);
        const capMat = new THREE.MeshStandardMaterial({ color: 0x39FF14, emissive: 0x39FF14, emissiveIntensity: 1 });
        const cap = new THREE.Mesh(capGeo, capMat);
        cap.position.y = 10;
        group.add(cap);

        const light = new THREE.PointLight(0x39FF14, 20, 50);
        light.position.y = 15;
        group.add(light);

        const label = this.createFloatingLabel("NETWORK HEART", 0x39FF14);
        label.position.y = 18;
        group.add(label);

        // Light beams
        for (let i = 0; i < 4; i++) {
            const beamGeo = new THREE.CylinderGeometry(0.1, 2, 40, 8, 1, true);
            const beamMat = new THREE.MeshBasicMaterial({ color: 0x39FF14, transparent: true, opacity: 0.2 });
            const beam = new THREE.Mesh(beamGeo, beamMat);
            beam.rotation.x = Math.PI / 2;
            const angle = (i / 4) * Math.PI * 2;
            beam.position.set(Math.cos(angle) * 5, 10, Math.sin(angle) * 5);
            beam.lookAt(new THREE.Vector3(Math.cos(angle) * 20, 100, Math.sin(angle) * 20));
            group.add(beam);
        }

        // Particle System for Heart - REFINED for V1.8.4
        const pCount = 500; // Optimized from 800 for better performance
        const pGeo = new THREE.BufferGeometry();
        const pPos = new Float32Array(pCount * 3);
        const pVels = new Float32Array(pCount * 3);
        const pLife = new Float32Array(pCount);

        for (let i = 0; i < pCount; i++) {
            const angle = Math.random() * Math.PI * 2;
            const dist = 3 + Math.random() * 5; // Slightly wider
            pPos[i * 3] = Math.cos(angle) * dist;
            pPos[i * 3 + 1] = 5 + Math.random() * 15; // Taller
            pPos[i * 3 + 2] = Math.sin(angle) * dist;
            
            pVels[i * 3] = (Math.random() - 0.5) * 0.08; // Faster
            pVels[i * 3 + 1] = 0.08 + Math.random() * 0.15; // Faster upward
            pVels[i * 3 + 2] = (Math.random() - 0.5) * 0.08;
            pLife[i] = Math.random();
        }

        pGeo.setAttribute('position', new THREE.BufferAttribute(pPos, 3));
        const pMat = new THREE.PointsMaterial({ 
            color: 0x39FF14, 
            size: 0.4, // Slightly larger
            transparent: true, 
            opacity: 0.8, 
            blending: THREE.AdditiveBlending 
        });
        const particles = new THREE.Points(pGeo, pMat);
        particles.userData = { velocities: pVels, life: pLife };
        group.add(particles);
        this.heartParticles = particles;

        // Spatial Audio Hum - REFINED FOR V1.8.4
        if (this.heartHum) this.heartHum.dispose();
        if (this.heartPanner) this.heartPanner.dispose();

        this.heartPanner = new TONE.Panner3D({
            positionX: 0,
            positionY: 10,
            positionZ: -40,
            rolloffFactor: 2 // Slightly higher rolloff for better spatial focus
        }).toDestination();

        this.heartHum = new TONE.Player({
            url: "assets/audio/network-heart-hum.mp3",
            loop: true,
            autostart: true,
            volume: -35 // Lowered from -25 for better background balance
        }).connect(this.heartPanner);

        return group;
    }

    createFloatingLabel(text, color) {
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        canvas.width = 512;
        canvas.height = 128;
        
        context.fillStyle = 'rgba(0,0,0,0.5)';
        context.fillRect(0, 0, canvas.width, canvas.height);
        context.font = 'bold 32px "Press Start 2P", cursive';
        context.textAlign = 'center';
        context.textBaseline = 'middle';
        context.fillStyle = `#${color.toString(16).padStart(6, '0')}`;
        context.fillText(text.toUpperCase(), canvas.width / 2, canvas.height / 2);

        const texture = new THREE.CanvasTexture(canvas);
        const spriteMat = new THREE.SpriteMaterial({ map: texture, transparent: true });
        const sprite = new THREE.Sprite(spriteMat);
        sprite.scale.set(8, 2, 1);
        this.scene.add(sprite);
        return sprite;
    }

    spawnEnemies() {
        this.boss = null; // Clear existing boss reference
        if (this.currentRegion.isSafeZone) return; // No enemies in safe zones
        // V1.9.21 - Spore Collector mode: peaceful sandbox, no hostiles anywhere.
        if (this.progression && this.progression.isCollectorMode()) return;

        const count = this.currentRegion.id === 'region8' ? 5 : 15;
        for (let i = 0; i < count; i++) {
            const x = (Math.random() - 0.5) * 200;
            const z = (Math.random() - 0.5) * 200;
            const enemy = new Enemy3D(this.scene, new THREE.Vector3(x, 0, z), this.currentRegion);
            this.enemies.push(enemy);
        }

        // V1.9.19 - Spawn rotted variants when the region's blight is high enough.
        this.spawnRotInfectedForRegion();

        // V1.9.14 - Bosses are no longer auto-spawned at world load. Each region's boss
        // lives behind a Sealed Dungeon door (see buildBossDungeon). Crossing the open
        // door spawns the boss inside the arena.
    }

    // V1.9.19 - Conquered regions over ~30% rot start sprouting Rot-Infected enemies.
    // Count scales linearly with rot, capped at 6, and existing rotlings are removed
    // first so re-syncs after the daily tick don't double-stack.
    spawnRotInfectedForRegion() {
        if (!this.currentRegion || this.currentRegion.isSafeZone) return;
        // V1.9.21 - Spore Collector mode never spawns hostiles, even on rotted regions.
        if (this.progression.isCollectorMode()) return;
        if (!this.progression.isConquered(this.currentRegion.id)) return;
        // Remove any existing rot-infected enemies first.
        this.enemies = this.enemies.filter(e => {
            if (e.isRotInfected) {
                try { e.destroy(); } catch (_) {}
                return false;
            }
            return true;
        });
        const rot = this.progression.getRegionRot(this.currentRegion.id);
        if (rot < 30) return;
        const target = Math.min(6, Math.floor(rot / 20));
        for (let i = 0; i < target; i++) {
            // Spawn around the player but at a safe distance so they have to be earned.
            const angle = Math.random() * Math.PI * 2;
            const dist = 25 + Math.random() * 40;
            const px = this.player ? this.player.group.position.x : 0;
            const pz = this.player ? this.player.group.position.z : 0;
            const x = px + Math.cos(angle) * dist;
            const z = pz + Math.sin(angle) * dist;
            const enemy = new RotInfectedEnemy3D(this.scene, new THREE.Vector3(x, 0, z), this.currentRegion);
            this.enemies.push(enemy);
        }
        if (target > 0) {
            this.showFloatingText(`THE ROT WALKS — ${target} ROTLING${target > 1 ? 'S' : ''}`, 0xaa00ff, true);
        }
    }

    // V1.9.14 - Spawn the boss for the current region when the dungeon door opens.
    spawnBossForRegion(spawnPos) {
        if (this.boss) return; // already alive
        if (this.currentRegion.id === 'region8' || this.currentRegion.bossName === 'None') return;
        let boss;
        const pos = spawnPos || new THREE.Vector3(0, 0, 50);
        if (this.currentRegion.id === 'crystalcap') {
            boss = new ShardcapWarden3D(this.scene, pos, this.currentRegion);
        } else if (this.currentRegion.id === 'thronecap') {
            boss = new DarkMycelius3D(this.scene, pos, this.currentRegion);
        } else if (this.currentRegion.id === 'ambermycel') {
            boss = new BogbellyMyconid3D(this.scene, pos, this.currentRegion);
        } else if (this.currentRegion.id === 'silkspore') {
            boss = new WidowcapWeaver3D(this.scene, pos, this.currentRegion);
        } else {
            boss = new Boss3D(this.scene, pos, this.currentRegion);
        }
        this.enemies.push(boss);
        this.boss = boss;
        this.showFloatingText(`${(boss.name || this.currentRegion.bossName || 'BOSS').toUpperCase()} AWAKENED!`, this.currentRegion.accent || 0xff0055, true);
    }

    spawnShardcapWarden() {
        // Find crystalcap region config
        const crystalRegion = CONFIG.REGIONS.find(r => r.id === 'crystalcap');
        const pos = this.player.group.position.clone().add(new THREE.Vector3(0, 0, 30));
        const warden = new ShardcapWarden3D(this.scene, pos, crystalRegion);
        this.enemies.push(warden);
        this.boss = warden;
        this.showFloatingText("SHARDCAP WARDEN AWAKENED!", 0x00ffff, true);
    }

    spawnCollectibles() {
        // Clear existing collectibles if any
        this.collectibles.forEach(c => c.destroy());
        this.collectibles = [];

        if (this.currentRegion.isSafeZone && this.currentRegion.id !== 'mushroomKingdom') return;

        // Scatter Spores (Blue/Gold/Ingredients)
        const sporeCount = 20 + Math.floor(Math.random() * 20);
        for (let i = 0; i < sporeCount; i++) {
            const x = (Math.random() - 0.5) * 300;
            const z = (Math.random() - 0.5) * 300;
            const rand = Math.random();
            // TUNING: Increased Golden Spore drop rate from 5% to 8%
            const type = rand > 0.92 ? 'GOLDEN_SPORE' : (rand > 0.8 ? 'INGREDIENT' : 'LOOT');
            
            // Multiplier logic: 15% chance for a multiplier spore (was 10%)
            let amount = type === 'LOOT' ? 5 : 1;
            if (Math.random() > 0.85) {
                amount *= 5; // 5x Spore
            }

            const col = new Collectible3D(this.scene, new THREE.Vector3(x, 0, z), type, this.selectedClan, amount);
            this.collectibles.push(col);
        }

        // Scatter Chests
        const chestCount = 3 + Math.floor(Math.random() * 5);
        for (let i = 0; i < chestCount; i++) {
            const x = (Math.random() - 0.5) * 250;
            const z = (Math.random() - 0.5) * 250;
            const chest = new Chest3D(this.scene, new THREE.Vector3(x, 0, z));
            this.chests.push(chest);
            this.collidables.push(chest.mesh);
        }
    }

    createTowerInterior() {
        const homeData = this.progression.data.home;
        this.placedBeds = []; // Track beds for interaction
        this.placedChests = []; // Track chests for interaction
        this.placedWeaponRacks = []; // Track racks for interaction
        this.placedForges = []; // Track forges for interaction
        
        // Circular room
        const roomGeo = new THREE.CylinderGeometry(10, 10, 10, 16, 1, true);
        const roomMat = new THREE.MeshStandardMaterial({ color: 0x221105, side: THREE.BackSide });
        const room = new THREE.Mesh(roomGeo, roomMat);
        room.position.y = 5;
        this.scene.add(room);

        const floorGeo = new THREE.CircleGeometry(10, 16);
        const floorMat = new THREE.MeshStandardMaterial({ color: 0x1a1005 });
        const floor = new THREE.Mesh(floorGeo, floorMat);
        floor.rotation.x = -Math.PI / 2;
        this.scene.add(floor);

        const ceilingGeo = new THREE.CircleGeometry(10, 16);
        const ceilingMat = new THREE.MeshStandardMaterial({ color: 0x1a1005 });
        const ceiling = new THREE.Mesh(ceilingGeo, ceilingMat);
        ceiling.rotation.x = Math.PI / 2;
        ceiling.position.y = 10;
        this.scene.add(ceiling);

        // Ambient glow from "magic"
        const centerLight = new THREE.PointLight(0x39FF14, 1, 20);
        centerLight.position.set(0, 5, 0);
        this.scene.add(centerLight);

        // Place stored decorations
        homeData.decorations.forEach((decoId, index) => {
            const decoCfg = CONFIG.DECORATIONS.find(d => d.id === decoId);
            if (!decoCfg) return;

            const angle = (index / homeData.decorations.length) * Math.PI * 2;
            const x = Math.cos(angle) * 7;
            const z = Math.sin(angle) * 7;
            
            this.placeDecorationMesh(decoId, new THREE.Vector3(x, 0, z));
        });

        // Exit door
        const doorGeo = new THREE.BoxGeometry(2, 4, 0.2);
        const doorMat = new THREE.MeshStandardMaterial({ color: 0x39FF14, emissive: 0x39FF14, emissiveIntensity: 0.5 });
        const door = new THREE.Mesh(doorGeo, doorMat);
        door.position.set(0, 2, -9.8);
        this.scene.add(door);
        this.exitDoor = door;

        // Add internal cooking station
        const stationGroup = new THREE.Group();
        const potGeo = new THREE.CylinderGeometry(1.5, 1.2, 1.5, 8, 1, true);
        const potMat = new THREE.MeshStandardMaterial({ color: 0x111111, side: THREE.DoubleSide });
        const pot = new THREE.Mesh(potGeo, potMat);
        stationGroup.add(pot);
        
        const liquidGeo = new THREE.CircleGeometry(1.4, 8);
        const liquidMat = new THREE.MeshStandardMaterial({ color: 0x39FF14, emissive: 0x39FF14 });
        const liquid = new THREE.Mesh(liquidGeo, liquidMat);
        liquid.rotation.x = -Math.PI / 2;
        liquid.position.y = 0.6;
        stationGroup.add(liquid);

        stationGroup.position.set(6, 0.75, 6);
        this.scene.add(stationGroup);
        this.cookingStation = stationGroup;
        this.potPos = new THREE.Vector3(6, 1.25, 6);
    }

    placeDecorationMesh(id, position) {
        const group = new THREE.Group();
        group.position.copy(position);

        if (id === 'throne') {
            const baseGeo = new THREE.BoxGeometry(2, 0.5, 2);
            const baseMat = new THREE.MeshStandardMaterial({ color: 0x440000 });
            const base = new THREE.Mesh(baseGeo, baseMat);
            group.add(base);
            const backGeo = new THREE.BoxGeometry(2, 3, 0.5);
            const back = new THREE.Mesh(backGeo, baseMat);
            back.position.set(0, 1.5, -0.75);
            group.add(back);
        } else if (id === 'shelf') {
            const geo = new THREE.BoxGeometry(1.5, 3, 0.5);
            const mat = new THREE.MeshStandardMaterial({ color: 0x332211 });
            const shelf = new THREE.Mesh(geo, mat);
            shelf.position.y = 1.5;
            group.add(shelf);
        } else if (id === 'banner') {
            const poleGeo = new THREE.CylinderGeometry(0.05, 0.05, 4);
            const poleMat = new THREE.MeshStandardMaterial({ color: 0x888888 });
            const pole = new THREE.Mesh(poleGeo, poleMat);
            pole.position.y = 2;
            group.add(pole);
            const clothGeo = new THREE.PlaneGeometry(1, 2);
            const clothMat = new THREE.MeshStandardMaterial({ color: this.player.magicColor, side: THREE.DoubleSide });
            const cloth = new THREE.Mesh(clothGeo, clothMat);
            cloth.position.set(0.5, 2, 0);
            group.add(cloth);
        } else if (id === 'crystal_lamp') {
            const baseGeo = new THREE.CylinderGeometry(0.2, 0.3, 1);
            const baseMat = new THREE.MeshStandardMaterial({ color: 0x222222 });
            const base = new THREE.Mesh(baseGeo, baseMat);
            group.add(base);
            const crystalGeo = new THREE.OctahedronGeometry(0.4, 0);
            const crystalMat = new THREE.MeshStandardMaterial({ color: 0x00ffff, emissive: 0x00ffff, emissiveIntensity: 2 });
            const crystal = new THREE.Mesh(crystalGeo, crystalMat);
            crystal.position.y = 1;
            group.add(crystal);
            const light = new THREE.PointLight(0x00ffff, 2, 5);
            light.position.y = 1.5;
            group.add(light);
        } else if (id === 'spore_bed') {
            const bedBaseGeo = new THREE.BoxGeometry(4, 0.6, 2.5);
            const bedBaseMat = new THREE.MeshStandardMaterial({ color: 0x332211 });
            const bedBase = new THREE.Mesh(bedBaseGeo, bedBaseMat);
            group.add(bedBase);
            
            const pillowGeo = new THREE.BoxGeometry(0.8, 0.4, 2);
            const pillowMat = new THREE.MeshStandardMaterial({ color: 0xffffff });
            const pillow = new THREE.Mesh(pillowGeo, pillowMat);
            pillow.position.set(-1.4, 0.5, 0);
            group.add(pillow);
            
            const blanketGeo = new THREE.BoxGeometry(2.5, 0.2, 2.55);
            const blanketMat = new THREE.MeshStandardMaterial({ color: 0x880000 });
            const blanket = new THREE.Mesh(blanketGeo, blanketMat);
            blanket.position.set(0.75, 0.4, 0);
            group.add(blanket);

            this.placedBeds.push(group);
        } else if (id === 'storage_chest') {
            const chestGeo = new THREE.BoxGeometry(1.5, 1, 1);
            const chestMat = new THREE.MeshStandardMaterial({ color: 0x4d2600 });
            const chest = new THREE.Mesh(chestGeo, chestMat);
            chest.position.y = 0.5;
            group.add(chest);
            
            const lidGeo = new THREE.BoxGeometry(1.6, 0.2, 1.1);
            const lidMat = new THREE.MeshStandardMaterial({ color: 0x331a00 });
            const lid = new THREE.Mesh(lidGeo, lidMat);
            lid.position.y = 1;
            group.add(lid);
            
            const lockGeo = new THREE.BoxGeometry(0.2, 0.3, 0.1);
            const lockMat = new THREE.MeshStandardMaterial({ color: 0x39FF14, emissive: 0x39FF14 });
            const lock = new THREE.Mesh(lockGeo, lockMat);
            lock.position.set(0, 0.7, 0.51);
            group.add(lock);

            this.placedChests.push(group);
        } else if (id === 'weapon_rack') {
            const frameGeo = new THREE.BoxGeometry(4, 3, 0.4);
            const frameMat = new THREE.MeshStandardMaterial({ color: 0x332211 });
            const frame = new THREE.Mesh(frameGeo, frameMat);
            frame.position.y = 1.5;
            group.add(frame);
            
            const shelfGeo = new THREE.BoxGeometry(3.5, 0.2, 0.6);
            const shelfMat = new THREE.MeshStandardMaterial({ color: 0x221100 });
            const shelf = new THREE.Mesh(shelfGeo, shelfMat);
            shelf.position.y = 0.5;
            group.add(shelf);

            // Add slots for 3 weapons
            const storedWeapons = this.progression.data.home.storedWeapons || [];
            storedWeapons.slice(0, 3).forEach((weaponId, i) => {
                const weaponGroup = new THREE.Group();
                weaponGroup.position.set((i - 1) * 1, 1.5, 0.3);
                
                // Visual representation based on weapon ID
                if (weaponId === 'fungal_blade') {
                    const bGeo = new THREE.BoxGeometry(0.2, 2, 0.05);
                    const bMat = new THREE.MeshStandardMaterial({ color: 0x88cc88 });
                    weaponGroup.add(new THREE.Mesh(bGeo, bMat));
                } else if (weaponId === 'crystal_spire') {
                    const bGeo = new THREE.CylinderGeometry(0.05, 0.15, 2.5);
                    const bMat = new THREE.MeshStandardMaterial({ color: 0x00ffff, emissive: 0x00ffff });
                    weaponGroup.add(new THREE.Mesh(bGeo, bMat));
                } else if (weaponId === 'ember_axe') {
                    const handleGeo = new THREE.CylinderGeometry(0.05, 0.05, 2.2);
                    weaponGroup.add(new THREE.Mesh(handleGeo, frameMat));
                    const headGeo = new THREE.BoxGeometry(0.8, 0.5, 0.2);
                    const headMat = new THREE.MeshStandardMaterial({ color: 0xff4400, emissive: 0xff0000 });
                    const head = new THREE.Mesh(headGeo, headMat);
                    head.position.y = 0.8;
                    weaponGroup.add(head);
                }
                
                group.add(weaponGroup);
            });

            this.placedWeaponRacks.push(group);
        } else if (id === 'forge') {
            const anvilBaseGeo = new THREE.BoxGeometry(1.5, 0.8, 1);
            const anvilMat = new THREE.MeshStandardMaterial({ color: 0x111111, metalness: 0.8, roughness: 0.2 });
            const anvilBase = new THREE.Mesh(anvilBaseGeo, anvilMat);
            anvilBase.position.y = 0.4;
            group.add(anvilBase);
            
            const hornGeo = new THREE.ConeGeometry(0.4, 0.8, 8);
            const horn = new THREE.Mesh(hornGeo, anvilMat);
            horn.rotation.z = -Math.PI / 2;
            horn.position.set(1.0, 0.6, 0);
            group.add(horn);

            const platformGeo = new THREE.BoxGeometry(2, 0.2, 1.5);
            const platformMat = new THREE.MeshStandardMaterial({ color: 0x332211 });
            const platform = new THREE.Mesh(platformGeo, platformMat);
            platform.position.y = 0;
            group.add(platform);

            const fireGeo = new THREE.BoxGeometry(1, 0.5, 1);
            const fireMat = new THREE.MeshStandardMaterial({ color: 0xff4400, emissive: 0xff2200, emissiveIntensity: 2 });
            const fire = new THREE.Mesh(fireGeo, fireMat);
            fire.position.set(-1, 0.25, 0);
            group.add(fire);

            const light = new THREE.PointLight(0xff4400, 2, 5);
            light.position.set(-1, 1, 0);
            group.add(light);

            this.placedForges.push(group);
        }

        group.lookAt(0, group.position.y, 0);
        this.scene.add(group);
        this.collidables.push(group);
    }

    createMushroomKingdom() {
        const homeData = this.progression.data.home;

        if (this.isInterior) {
            this.createTowerInterior();
            return;
        }

        // Area label
        const areaLabel = this.createFloatingLabel("KING'S SANCTUARY", 0x39FF14);
        areaLabel.position.set(0, 15, 10);
        this.areaLabels.push(areaLabel);

        // ===== Royal Tower (preserved + softened) =====
        const towerGroup = new THREE.Group();
        const base = new THREE.Mesh(new THREE.CylinderGeometry(4, 5, 2, 12), new THREE.MeshStandardMaterial({ color: 0x6b4a2b, roughness: 0.7 }));
        towerGroup.add(base);
        for (let i = 0; i < homeData.level; i++) {
            const section = new THREE.Mesh(
                new THREE.CylinderGeometry(3.5, 3.5, 4, 12),
                new THREE.MeshStandardMaterial({ color: 0x8a5e36, roughness: 0.6 })
            );
            section.position.y = 3 + i * 4;
            towerGroup.add(section);
            const winMat = new THREE.MeshStandardMaterial({ color: 0xffee88, emissive: 0xffcc44, emissiveIntensity: 1.4 });
            for (let j = 0; j < 4; j++) {
                const win = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.8, 0.1), winMat);
                const angle = (j / 4) * Math.PI * 2;
                win.position.set(Math.cos(angle) * 3.51, 3 + i * 4, Math.sin(angle) * 3.51);
                win.lookAt(0, 3 + i * 4, 0);
                towerGroup.add(win);
            }
        }
        const roof = new THREE.Mesh(
            new THREE.ConeGeometry(5, 3, 12),
            new THREE.MeshStandardMaterial({ color: 0xff3344, roughness: 0.55 })
        );
        roof.position.y = 1 + homeData.level * 4 + 1.5;
        towerGroup.add(roof);
        towerGroup.position.set(0, 0, 18);
        this.scene.add(towerGroup);
        this.collidables.push(towerGroup);

        // ===== Helper: a complete 3D mushroom-cottage =====
        const makeCottage = (color, roofColor, doorColor) => {
            const g = new THREE.Group();

            // Plinth/foundation
            const plinth = new THREE.Mesh(
                new THREE.BoxGeometry(5.2, 0.4, 5.2),
                new THREE.MeshStandardMaterial({ color: 0x8a6a44, roughness: 0.85 })
            );
            plinth.position.y = 0.2;
            g.add(plinth);

            // Walls (a hollow-looking solid box with bevel feel)
            const walls = new THREE.Mesh(
                new THREE.BoxGeometry(4.6, 3.2, 4.6),
                new THREE.MeshStandardMaterial({ color, roughness: 0.7 })
            );
            walls.position.y = 2.0;
            g.add(walls);

            // Door
            const door = new THREE.Mesh(
                new THREE.BoxGeometry(1.0, 1.8, 0.15),
                new THREE.MeshStandardMaterial({ color: doorColor, roughness: 0.55 })
            );
            door.position.set(0, 1.3, 2.33);
            g.add(door);
            // Door knob
            const knob = new THREE.Mesh(
                new THREE.SphereGeometry(0.07, 10, 10),
                new THREE.MeshStandardMaterial({ color: 0xffd060, metalness: 0.6, roughness: 0.3 })
            );
            knob.position.set(0.35, 1.3, 2.41);
            g.add(knob);

            // Windows (front and sides)
            const winMat = new THREE.MeshStandardMaterial({ color: 0xfff2a0, emissive: 0xffcc55, emissiveIntensity: 1.0 });
            const frameMat = new THREE.MeshStandardMaterial({ color: 0x5a3a20, roughness: 0.6 });
            const makeWindow = (px, py, pz, ry) => {
                const fw = new THREE.Mesh(new THREE.BoxGeometry(1.2, 1.0, 0.08), frameMat);
                fw.position.set(px, py, pz);
                fw.rotation.y = ry;
                g.add(fw);
                const ww = new THREE.Mesh(new THREE.BoxGeometry(1.0, 0.8, 0.05), winMat);
                ww.position.set(px, py, pz);
                ww.rotation.y = ry;
                // Nudge window glass slightly outward in its local forward direction.
                ww.translateZ(0.03);
                g.add(ww);
                // Cross mullion
                const mull = new THREE.Mesh(new THREE.BoxGeometry(1.0, 0.05, 0.06), frameMat);
                mull.position.copy(ww.position);
                mull.rotation.y = ry;
                g.add(mull);
            };
            makeWindow(-1.4, 2.4,  2.33, 0);
            makeWindow( 1.4, 2.4,  2.33, 0);
            makeWindow( 2.33, 2.4,  0,   Math.PI / 2);
            makeWindow(-2.33, 2.4,  0,   Math.PI / 2);

            // Mushroom-cap roof (rounded half-sphere with white spots)
            const cap = new THREE.Mesh(
                new THREE.SphereGeometry(3.6, 18, 12, 0, Math.PI * 2, 0, Math.PI / 2),
                new THREE.MeshStandardMaterial({ color: roofColor, roughness: 0.45 })
            );
            cap.position.y = 3.6;
            g.add(cap);
            const spotMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.6 });
            for (let i = 0; i < 7; i++) {
                const a = (i / 7) * Math.PI * 2;
                const r = 1.2 + Math.random() * 1.2;
                const spot = new THREE.Mesh(new THREE.SphereGeometry(0.32 + Math.random() * 0.18, 10, 10), spotMat);
                spot.position.set(Math.cos(a) * r, 3.6 + Math.sin(i * 1.7) * 0.8 + 0.6, Math.sin(a) * r);
                g.add(spot);
            }

            // Chimney
            const chimney = new THREE.Mesh(
                new THREE.BoxGeometry(0.5, 1.4, 0.5),
                new THREE.MeshStandardMaterial({ color: 0x7a4a2a, roughness: 0.8 })
            );
            chimney.position.set(1.4, 4.6, -1.2);
            g.add(chimney);

            // Warm interior glow
            const lamp = new THREE.PointLight(0xffcc66, 1.4, 12, 1.3);
            lamp.position.set(0, 2.4, 0);
            g.add(lamp);

            g.userData.radius = 3.5;
            return g;
        };

        // ===== Village ring of cottages =====
        const cottageDefs = [
            { color: 0xff7799, roof: 0xff5544, door: 0x5a3a20 },
            { color: 0x77ccff, roof: 0xffaa55, door: 0x4a2f15 },
            { color: 0xffdd66, roof: 0x66cc88, door: 0x5a3a20 },
            { color: 0xbb88ff, roof: 0xff66aa, door: 0x4a2f15 },
            { color: 0x88ee99, roof: 0x44aacc, door: 0x5a3a20 }
        ];
        const cottagePositions = [];
        cottageDefs.forEach((def, i) => {
            const angle = (i / cottageDefs.length) * Math.PI * 2 + Math.PI / 6;
            const dist = 22;
            const x = Math.cos(angle) * dist;
            const z = Math.sin(angle) * dist;
            const c = makeCottage(def.color, def.roof, def.door);
            c.position.set(x, 0, z);
            c.lookAt(0, 0, 0);
            this.scene.add(c);
            this.collidables.push(c);
            cottagePositions.push({ x, z });
        });

        // ===== Cobblestone paths from origin out to each cottage =====
        const pathMat = new THREE.MeshStandardMaterial({ color: 0xc8b48a, roughness: 0.9 });
        const stepGeo = new THREE.BoxGeometry(1.6, 0.05, 1.6);
        cottagePositions.forEach(({ x, z }) => {
            const dist = Math.sqrt(x * x + z * z);
            const steps = Math.floor(dist / 1.6);
            for (let s = 1; s < steps; s++) {
                const t = s / steps;
                const step = new THREE.Mesh(stepGeo, pathMat);
                step.position.set(x * t, 0.03, z * t);
                // Slight rotation/jitter for cobbled feel.
                step.rotation.y = (Math.random() - 0.5) * 0.4;
                step.position.x += (Math.random() - 0.5) * 0.3;
                step.position.z += (Math.random() - 0.5) * 0.3;
                this.scene.add(step);
            }
        });

        // Central plaza disc.
        const plaza = new THREE.Mesh(
            new THREE.CylinderGeometry(5, 5, 0.1, 24),
            new THREE.MeshStandardMaterial({ color: 0xd9c69a, roughness: 0.9 })
        );
        plaza.position.y = 0.05;
        this.scene.add(plaza);

        // ===== Glowing mushroom clusters scattered around the village =====
        for (let i = 0; i < 28; i++) {
            const angle = Math.random() * Math.PI * 2;
            const dist = 8 + Math.random() * 30;
            const cx = Math.cos(angle) * dist;
            const cz = Math.sin(angle) * dist;
            const colors = [0xff6688, 0x66ddff, 0xffcc55, 0xaa77ff, 0x77ff99];
            const color = colors[Math.floor(Math.random() * colors.length)];
            const stem = new THREE.Mesh(
                new THREE.CylinderGeometry(0.18, 0.26, 1.2, 10),
                new THREE.MeshStandardMaterial({ color: 0xf5ead2, roughness: 0.7 })
            );
            stem.position.set(cx, 0.6, cz);
            this.scene.add(stem);
            const cap = new THREE.Mesh(
                new THREE.SphereGeometry(0.55, 12, 8, 0, Math.PI * 2, 0, Math.PI / 2),
                new THREE.MeshStandardMaterial({ color, emissive: color, emissiveIntensity: 1.4, roughness: 0.4 })
            );
            cap.position.set(cx, 1.25, cz);
            this.scene.add(cap);
            if (i % 4 === 0) {
                const glow = new THREE.PointLight(color, 1.2, 6);
                glow.position.set(cx, 1.6, cz);
                this.scene.add(glow);
            }
        }

        // ===== Decorative rocks =====
        const rockMat = new THREE.MeshStandardMaterial({ color: 0x9aa0a8, roughness: 0.95 });
        for (let i = 0; i < 18; i++) {
            const angle = Math.random() * Math.PI * 2;
            const dist = 10 + Math.random() * 40;
            const cx = Math.cos(angle) * dist;
            const cz = Math.sin(angle) * dist;
            const rock = new THREE.Mesh(
                new THREE.DodecahedronGeometry(0.5 + Math.random() * 0.8, 0),
                rockMat
            );
            rock.position.set(cx, 0.3, cz);
            rock.rotation.set(Math.random(), Math.random(), Math.random());
            this.scene.add(rock);
        }

        // ===== Village signs (lookable wooden posts with text) =====
        const makeSign = (text, x, z, rotY = 0) => {
            const sg = new THREE.Group();
            const post = new THREE.Mesh(
                new THREE.CylinderGeometry(0.08, 0.08, 1.6, 8),
                new THREE.MeshStandardMaterial({ color: 0x5a3a20, roughness: 0.8 })
            );
            post.position.y = 0.8;
            sg.add(post);
            const board = new THREE.Mesh(
                new THREE.BoxGeometry(1.6, 0.7, 0.1),
                new THREE.MeshStandardMaterial({ color: 0xd9b277, roughness: 0.75 })
            );
            board.position.y = 1.55;
            sg.add(board);
            // Text via canvas texture, applied as a sprite on the board face.
            const cnv = document.createElement('canvas');
            cnv.width = 256; cnv.height = 112;
            const cx = cnv.getContext('2d');
            cx.fillStyle = 'rgba(0,0,0,0)';
            cx.fillRect(0, 0, 256, 112);
            cx.font = 'bold 28px "Press Start 2P", monospace';
            cx.fillStyle = '#3a2210';
            cx.textAlign = 'center';
            cx.textBaseline = 'middle';
            cx.fillText(text, 128, 56);
            const tex = new THREE.CanvasTexture(cnv);
            tex.colorSpace = THREE.SRGBColorSpace;
            const labelMat = new THREE.MeshBasicMaterial({ map: tex, transparent: true });
            const label = new THREE.Mesh(new THREE.PlaneGeometry(1.5, 0.6), labelMat);
            label.position.set(0, 1.55, 0.06);
            sg.add(label);
            sg.position.set(x, 0, z);
            sg.rotation.y = rotY;
            this.scene.add(sg);
        };
        makeSign("SHROOMVILLE",  0, 7);
        makeSign("MARKET",      10, 0, Math.PI / 2);
        makeSign("DEEP WOODS", -10, 0, -Math.PI / 2);
        makeSign("HOMESTEAD",   0, -7, Math.PI);

        // ===== Cooking Station (Alchemy Pot) - preserved =====
        const pot = new THREE.Mesh(
            new THREE.CylinderGeometry(1, 0.8, 1, 12, 1, true),
            new THREE.MeshStandardMaterial({ color: 0x222222, side: THREE.DoubleSide, roughness: 0.7 })
        );
        pot.position.set(-6, 0.5, -3);
        this.scene.add(pot);
        const liquid = new THREE.Mesh(
            new THREE.CircleGeometry(0.9, 12),
            new THREE.MeshStandardMaterial({ color: 0x39FF14, emissive: 0x39FF14, emissiveIntensity: 1.5 })
        );
        liquid.rotation.x = -Math.PI / 2;
        liquid.position.set(-6, 0.9, -3);
        this.scene.add(liquid);
        const potLight = new THREE.PointLight(0x39FF14, 1.0, 10);
        potLight.position.set(-6, 3, -3);
        this.scene.add(potLight);
        this.potPos = new THREE.Vector3(-6, 0.9, -3);

        // ===== Resting Spot (Mushroom Bed) - preserved =====
        const bed = new THREE.Mesh(
            new THREE.BoxGeometry(3, 0.5, 2),
            new THREE.MeshStandardMaterial({ color: 0x9b2a3a, roughness: 0.5 })
        );
        bed.position.set(6, 0.25, -3);
        this.scene.add(bed);

        // ===== Outer ring of mushroom trees =====
        for (let i = 0; i < 30; i++) {
            const angle = Math.random() * Math.PI * 2;
            const dist = 40 + Math.random() * 50;
            const x = Math.cos(angle) * dist;
            const z = Math.sin(angle) * dist;
            const stem = new THREE.Mesh(
                new THREE.CylinderGeometry(0.5, 0.8, 5, 8),
                new THREE.MeshStandardMaterial({ color: 0xf2e7cf, roughness: 0.7 })
            );
            stem.position.set(x, 2.5, z);
            this.scene.add(stem);
            const leafColors = [0x55cc55, 0x88dd55, 0xffcc44, 0xff77aa];
            const leafColor = leafColors[i % leafColors.length];
            const leaves = new THREE.Mesh(
                new THREE.SphereGeometry(3, 12, 10),
                new THREE.MeshStandardMaterial({ color: leafColor, emissive: leafColor, emissiveIntensity: 0.6, roughness: 0.5 })
            );
            leaves.position.set(x, 6, z);
            this.scene.add(leaves);
            if (i % 4 === 0) {
                const treeLight = new THREE.PointLight(leafColor, 1.2, 14);
                treeLight.position.set(x, 4.5, z);
                this.scene.add(treeLight);
            }
        }
    }

    createRegionEnvironment() {
        const region = this.currentRegion;
        this.hazards.forEach(h => h.destroy());
        this.hazards = [];

        if (region.id === 'mushroomKingdom') {
            this.createMushroomKingdom();
            return;
        }

        // V1.9.13 - Hub gets fewer ambient props (themed zones do the heavy lifting),
        // and we keep them outside the central sanctuary clearing + zone footprints.
        const isHub = region.id === 'region8';
        const count = isHub ? 40 : 80;
        const spread = isHub ? 180 : 250;

        // Footprints to avoid in the hub (sanctuary + 4 themed zones + village).
        const hubReserved = isHub ? [
            { x:   0, z:   0, r: 28 }, // sanctuary plaza
            { x: -85, z: -55, r: 26 }, // ashen grove
            { x:  90, z: -55, r: 26 }, // crystal hollow
            { x: -95, z:  60, r: 26 }, // bone garden
            { x:  85, z:  75, r: 26 }, // spore bloom meadow
            { x:  40, z: -30, r: 24 }  // village
        ] : null;

        for (let i = 0; i < count; i++) {
            const group = new THREE.Group();
            let x, z;
            let tries = 0;
            do {
                x = (Math.random() - 0.5) * spread;
                z = (Math.random() - 0.5) * spread;
                tries++;
                if (!hubReserved) break;
                const clash = hubReserved.some(c => (x - c.x) ** 2 + (z - c.z) ** 2 < c.r * c.r);
                if (!clash) break;
            } while (tries < 8);
            const scale = 0.5 + Math.random() * 3;

            if (region.id === 'crystalcap') {
                // Large geometric crystals
                const geo = new THREE.OctahedronGeometry(1, 0);
                const mat = new THREE.MeshStandardMaterial({ 
                    color: region.accent, 
                    emissive: region.accent, 
                    emissiveIntensity: 1.5,
                    transparent: true,
                    opacity: 0.7 
                });
                const crystal = new THREE.Mesh(geo, mat);
                crystal.rotation.set(Math.random(), Math.random(), Math.random());
                crystal.position.y = 1;
                group.add(crystal);
                const light = new THREE.PointLight(region.accent, 2, 8);
                light.position.y = 2;
                group.add(light);
            } else if (region.id === 'emberstem') {
                // VOLCANIC VENTS (Hazards)
                if (Math.random() > 0.8) {
                    const hazard = new Hazard3D(this.scene, new THREE.Vector3(x, 0, z), 'VOLCANO');
                    this.hazards.push(hazard);
                    continue; // Skip the standard group addition
                } else {
                    const geo = new THREE.DodecahedronGeometry(1, 0);
                    const mat = new THREE.MeshStandardMaterial({ color: 0x331100, roughness: 1 });
                    const rock = new THREE.Mesh(geo, mat);
                    rock.position.y = 0.5;
                    group.add(rock);
                }
            } else if (region.id === 'silkspore') {
                // WEB TRAPS (Hazards)
                if (Math.random() > 0.8) {
                    const hazard = new Hazard3D(this.scene, new THREE.Vector3(x, 0, z), 'WEB_TRAP');
                    this.hazards.push(hazard);
                    continue;
                } else {
                    const stemGeo = new THREE.CylinderGeometry(0.5, 0.7, 5, 8);
                    const stemMat = new THREE.MeshStandardMaterial({ color: 0x222222 });
                    const stem = new THREE.Mesh(stemGeo, stemMat);
                    stem.position.y = 2.5;
                    group.add(stem);
                    
                    const webGeo = new THREE.TorusKnotGeometry(1, 0.1, 64, 8);
                    const webMat = new THREE.MeshStandardMaterial({ color: 0xffffff, transparent: true, opacity: 0.3 });
                    const web = new THREE.Mesh(webGeo, webMat);
                    web.position.y = 4;
                    group.add(web);
                }
            } else if (region.id === 'ambermycel') {
                // Bubbling amber pools (ROT_POOL Hazards)
                if (Math.random() > 0.8) {
                    const hazard = new Hazard3D(this.scene, new THREE.Vector3(x, 0, z), 'ROT_POOL');
                    this.hazards.push(hazard);
                    continue;
                } else {
                    const geo = new THREE.CylinderGeometry(1.5, 1.5, 0.2, 16);
                    const mat = new THREE.MeshStandardMaterial({ color: 0xffaa00, emissive: 0xaa5500, transparent: true, opacity: 0.8 });
                    const pool = new THREE.Mesh(geo, mat);
                    pool.position.y = 0.1;
                    group.add(pool);
                }
            } else if (region.id === 'voidlichen') {
                // VOIDLICHEN PUZZLE: Binary Sequence
                if (i < 5) { // Spawn 5 pillars for the sequence
                    const angle = (i / 5) * Math.PI * 2;
                    const pPos = new THREE.Vector3(Math.cos(angle) * 15, 0, Math.sin(angle) * 15);
                    const target = i % 2 === 0 ? 1 : 0; // Target pattern: 1, 0, 1, 0, 1
                    const pillar = new PuzzlePillar3D(this.scene, pPos, i, target);
                    this.puzzlePillars.push(pillar);
                    this.collidables.push(pillar.pillar);
                    continue;
                }
                
                // Floating debris
                const geo = new THREE.BoxGeometry(1, 1, 1);
                const mat = new THREE.MeshStandardMaterial({ color: 0x111111, wireframe: true });
                const pillar = new THREE.Mesh(geo, mat);
                pillar.position.y = 2 + Math.random() * 5;
                group.add(pillar);
                
                const light = new THREE.PointLight(0xaa00ff, 1, 10);
                light.position.y = 3;
                group.add(light);
            } else if (region.id === 'thronecap') {
                // THRONE CAP PUZZLE: Citadel Gate
                if (i === 0) {
                    this.citadelGate = new CitadelGate3D(this.scene, new THREE.Vector3(0, 0, 35));
                    this.collidables.push(this.citadelGate.mesh);
                    continue;
                }
                // Random Citadel Rocks
                const geo = new THREE.DodecahedronGeometry(1.5, 0);
                const mat = new THREE.MeshStandardMaterial({ color: 0x110005, roughness: 1 });
                const rock = new THREE.Mesh(geo, mat);
                rock.position.y = 0.5;
                group.add(rock);
            } else {
                // V1.9.8 - Roblox-style 3D mushrooms: cream stems, colorful caps.
                const stemGeo = new THREE.CylinderGeometry(0.45, 0.55, 3, 10);
                const stemMat = new THREE.MeshStandardMaterial({ color: 0xf5ead2, roughness: 0.7, metalness: 0.0 });
                const stem = new THREE.Mesh(stemGeo, stemMat);
                stem.position.y = 1.5;
                group.add(stem);

                // Rounded cap (half-sphere) in the region accent for clean Roblox shape.
                const capGeo = new THREE.SphereGeometry(1.4, 14, 10, 0, Math.PI * 2, 0, Math.PI / 2);
                const capMat = new THREE.MeshStandardMaterial({
                    color: region.accent,
                    emissive: region.accent,
                    emissiveIntensity: 0.35,
                    roughness: 0.4
                });
                const cap = new THREE.Mesh(capGeo, capMat);
                cap.position.y = 3;
                group.add(cap);

                // White spots on the cap.
                const spotMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.6 });
                for (let s = 0; s < 5; s++) {
                    const spot = new THREE.Mesh(new THREE.SphereGeometry(0.18, 8, 8), spotMat);
                    const a = (s / 5) * Math.PI * 2;
                    spot.position.set(Math.cos(a) * 0.8, 3.6, Math.sin(a) * 0.8);
                    group.add(spot);
                }

                const light = new THREE.PointLight(region.accent, 0.8, 9);
                light.position.y = 3;
                group.add(light);

                // V1.9.18 - Register this mushroom as a rottable prop so the daily Rot
                // Cycle can visually blight conquered regions and the wand can cleanse.
                this.rotProps.push({
                    group,
                    capMat,
                    stemMat,
                    spotMat,
                    light,
                    cleanCap:  new THREE.Color(region.accent),
                    cleanStem: new THREE.Color(0xf5ead2),
                    cleanSpot: new THREE.Color(0xffffff),
                    cleanEmissive: 0.35,
                    rot: 0,        // 0..1 visual rot for this individual mushroom
                    targetRot: 0,  // animated toward
                    puffCloud: null
                });
            }

            group.position.set(x, 0, z);
            group.scale.set(scale, scale, scale);
            group.userData.radius = 1.5 * scale;
            this.scene.add(group);
            this.collidables.push(group);
        }
    }

    createPlatformChallenge() {
        const startX = 30; const startZ = 30;
        for (let i = 0; i < 12; i++) {
            const geo = new THREE.BoxGeometry(4, 0.5, 4);
            const mat = new THREE.MeshStandardMaterial({ color: 0xff00ff, emissive: 0x550055, emissiveIntensity: 1 });
            const platform = new THREE.Mesh(geo, mat);
            const x = startX + i * 8; const y = 3 + i * 3; const z = startZ + Math.sin(i) * 10;
            platform.position.set(x, y, z); this.scene.add(platform); this.platforms.push(platform);
            const beamGeo = new THREE.CylinderGeometry(0.05, 0.05, y, 4);
            const beamMat = new THREE.MeshBasicMaterial({ color: 0x00ffff, transparent: true, opacity: 0.3 });
            const beam = new THREE.Mesh(beamGeo, beamMat);
            beam.position.set(x, y / 2, z); this.scene.add(beam);
        }
        const goalGeo = new THREE.IcosahedronGeometry(2, 0);
        const goalMat = new THREE.MeshStandardMaterial({ color: 0xffff00, emissive: 0xffff00, emissiveIntensity: 2 });
        this.goal = new THREE.Mesh(goalGeo, goalMat);
        this.goal.position.set(startX + 12 * 8, 12 * 3 + 6, startZ);
        this.scene.add(this.goal);
    }

    showFloatingText(text, color, isBig = false) {
        const div = document.createElement('div');
        div.innerText = text;
        div.style.position = 'absolute';
        div.style.color = `#${color.toString(16).padStart(6, '0')}`;
        div.style.fontFamily = '"Press Start 2P", cursive';
        div.style.fontSize = isBig ? '24px' : '12px';
        div.style.pointerEvents = 'none';
        div.style.textShadow = '2px 2px 4px #000';
        div.style.left = '50%';
        div.style.top = '40%';
        div.style.transform = 'translate(-50%, -50%)';
        div.style.transition = 'all 1s ease-out';
        this.uiOverlay.appendChild(div);

        requestAnimationFrame(() => {
            div.style.top = '20%';
            div.style.opacity = '0';
        });

        setTimeout(() => div.remove(), 1000);
    }

    showGlobalNotification(message, color = '#39FF14') {
        const id = Date.now();
        const notification = document.createElement('div');
        notification.id = `notif-${id}`;
        notification.style.cssText = `
            background: rgba(0, 0, 0, 0.9);
            border-left: 4px solid ${color};
            padding: 12px;
            color: white;
            font-family: "Press Start 2P", cursive;
            font-size: 8px;
            line-height: 1.4;
            pointer-events: auto;
            animation: slideInNotif 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards;
            box-shadow: 0 4px 15px rgba(0,0,0,0.5);
            display: flex;
            align-items: center;
            gap: 12px;
            min-width: 280px;
        `;

        notification.innerHTML = `
            <div style="background: ${color}; width: 8px; height: 8px; border-radius: 50%; box-shadow: 0 0 10px ${color}; animation: blinkNotif 1s infinite;"></div>
            <div style="flex: 1;">
                <div style="color: ${color}; font-size: 7px; margin-bottom: 4px; letter-spacing: 1px;">[NETWORK BROADCAST]</div>
                <div style="text-transform: uppercase;">${message}</div>
            </div>
        `;

        this.notificationContainer.appendChild(notification);

        // Auto-remove
        setTimeout(() => {
            notification.style.animation = 'slideOutNotif 0.5s ease-in forwards';
            setTimeout(() => notification.remove(), 500);
        }, 6000);
    }

    simulateGlobalActivity() {
        const now = Date.now();
        
        // Bubbling pot particles logic
        if (this.currentRegion.id === 'mushroomKingdom' || this.isInterior) {
            this.updatePotParticles();
        }

        // Every 30-60 seconds, simulate an event if we aren't busy
        if (now - this.lastGlobalEventTime > (30000 + Math.random() * 30000)) {
            this.lastGlobalEventTime = now;
            
            const players = ['SporeRunner', 'FungalKnight', 'SolanaSage', 'MycoMaster', 'RootRipper', 'CapCommander'];
            const clans = ['myco', 'rougarou', 'tegbot', 'shiba', 'brood'];
            const player = players[Math.floor(Math.random() * players.length)];
            const clan = clans[Math.floor(Math.random() * clans.length)];
            
            const eventType = Math.random();
            if (eventType > 0.7) {
                const time = (140 + Math.random() * 60).toFixed(2);
                this.showGlobalNotification(`${player} (${clan}) set a new record: ${time}s!`, this.getClanColor(clan));
            } else if (eventType > 0.4) {
                const amount = Math.floor(500 + Math.random() * 2000);
                this.showGlobalNotification(`${player} burned ${amount} spores for ${clan.toUpperCase()}!`, this.getClanColor(clan));
            } else {
                this.showGlobalNotification(`The Rot is intensifying in ${CONFIG.REGIONS[Math.floor(Math.random() * CONFIG.REGIONS.length)].name}!`, '#ff00ff');
            }
        }
    }

    updatePotParticles() {
        if (!this.potPos) return;

        if (!this.potParticleGroup || !this.scene.children.includes(this.potParticleGroup)) {
            this.potParticles = [];
            this.potParticleGroup = new THREE.Group();
            this.scene.add(this.potParticleGroup);
        }

        // Add new particles (bubbles and sparks)
        if (Math.random() > 0.6) {
            const isSpark = Math.random() > 0.7;
            const geo = isSpark ? new THREE.BoxGeometry(0.05, 0.05, 0.05) : new THREE.SphereGeometry(0.12, 6, 6);
            const mat = new THREE.MeshBasicMaterial({ 
                color: isSpark ? 0xffffff : 0x39FF14, 
                transparent: true,
                opacity: 0.8
            });
            const p = new THREE.Mesh(geo, mat);
            
            const angle = Math.random() * Math.PI * 2;
            const dist = Math.random() * 0.7;
            p.position.set(
                this.potPos.x + Math.cos(angle) * dist,
                this.potPos.y,
                this.potPos.z + Math.sin(angle) * dist
            );
            
            p.userData = {
                velocity: new THREE.Vector3(
                    (Math.random() - 0.5) * 0.03, 
                    isSpark ? 0.1 + Math.random() * 0.1 : 0.04 + Math.random() * 0.04, 
                    (Math.random() - 0.5) * 0.03
                ),
                life: 1.0,
                decay: isSpark ? 0.02 + Math.random() * 0.03 : 0.01 + Math.random() * 0.015,
                isSpark: isSpark
            };
            
            this.potParticleGroup.add(p);
            this.potParticles.push(p);
        }

        // Update existing
        for (let i = this.potParticles.length - 1; i >= 0; i--) {
            const p = this.potParticles[i];
            p.position.add(p.userData.velocity);
            
            if (!p.userData.isSpark) {
                // Bubbles wobble slightly
                p.position.x += Math.sin(Date.now() * 0.01 + i) * 0.005;
                p.position.z += Math.cos(Date.now() * 0.01 + i) * 0.005;
            }

            p.userData.life -= p.userData.decay;
            p.material.opacity = p.userData.life * 0.8;
            p.scale.setScalar(p.userData.life);
            
            if (p.userData.life <= 0) {
                this.potParticleGroup.remove(p);
                this.potParticles.splice(i, 1);
            }
        }
    }

    updateDayCycle() {
        const delta = 1/60; // 60 fps assumed
        this.timeOfDay = (this.timeOfDay + (24 / this.dayDuration) * delta) % 24;

        // Update Weather
        this.updateWeather(delta);

        // Update Clock UI
        const hours = Math.floor(this.timeOfDay);
        const minutes = Math.floor((this.timeOfDay % 1) * 60);
        const timeStr = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
        
        let period = "MIDNIGHT";
        if (hours >= 5 && hours < 8) period = "SUNRISE";
        else if (hours >= 8 && hours < 17) period = "DAYLIGHT";
        else if (hours >= 17 && hours < 20) period = "SUNSET";
        else if (hours >= 20 || hours < 5) period = "NIGHT";

        this.clockUI.innerHTML = `
            <div style="font-size: 8px; color: #fff;">${period}</div>
            <div style="font-size: 14px;">${timeStr}</div>
        `;

        // Don't apply cycle lighting if interior
        if (this.isInterior) return;

        // Apply lighting based on time
        this.applyCycleLighting();
    }

    updateWeather(delta) {
        if (this.isInterior) return;

        this.weatherTimer -= delta;
        if (this.weatherTimer <= 0) {
            // Randomly change weather every 30-60 seconds
            const rand = Math.random();
            if (rand > 0.8) {
                this.currentWeather = Math.random() > 0.5 ? 'SPORE_RAIN' : 'NETWORK_FOG';
                this.weatherTargetIntensity = 1.0;
                this.weatherTimer = 30 + Math.random() * 30;
                this.showGlobalNotification(`WEATHER ALERT: ${this.currentWeather.replace('_', ' ')} detected!`, this.currentWeather === 'SPORE_RAIN' ? '#00ffff' : '#ff00ff');
            } else {
                this.currentWeather = 'CLEAR';
                this.weatherTargetIntensity = 0;
                this.weatherTimer = 40 + Math.random() * 40;
                if (this.weatherIntensity > 0.1) {
                    this.showGlobalNotification("WEATHER ALERT: Sky is clearing.", '#39FF14');
                }
            }
        }

        // Smooth intensity transition
        this.weatherIntensity += (this.weatherTargetIntensity - this.weatherIntensity) * 0.01;

        // Update Particle system for weather
        if (this.particles && this.particles.geometry.attributes.position) {
            const positions = this.particles.geometry.attributes.position.array;
            const velocities = this.particles.userData.velocities;
            const count = positions.length / 3;

            for (let i = 0; i < count; i++) {
                // Base movement
                positions[i * 3] += velocities[i * 3];
                positions[i * 3 + 1] += velocities[i * 3 + 1];
                positions[i * 3 + 2] += velocities[i * 3 + 2];

                // Weather specific gravity/drift
                if (this.currentWeather === 'SPORE_RAIN') {
                    positions[i * 3 + 1] -= 0.1 * this.weatherIntensity; // Rain falls faster
                } else if (this.currentWeather === 'NETWORK_FOG') {
                    positions[i * 3] += Math.sin(Date.now() * 0.001 + i) * 0.05 * this.weatherIntensity; // Fog drifts
                }

                // Reset particles that fall below ground or go too far
                if (positions[i * 3 + 1] < 0) {
                    positions[i * 3 + 1] = 50;
                    positions[i * 3] = (Math.random() - 0.5) * 200;
                    positions[i * 3 + 2] = (Math.random() - 0.5) * 200;
                }
            }
            this.particles.geometry.attributes.position.needsUpdate = true;
        }
    }

    applyCycleLighting() {
        // V1.9.7 Daylight - Bright, readable day; moody-but-not-black night.
        const t = this.timeOfDay;

        // Region-tinted but always lifted toward neutral so colors read clearly.
        const litSky = new THREE.Color(this.currentRegion.skyColor)
            .lerp(new THREE.Color(0xaabbdd), 0.55);
        const safeBoost = this.currentRegion.isSafeZone ? 1.15 : 1.0;

        // Target configurations - day is FULL Roblox bright; night stays dim but readable.
        const day = {
            ambient: 2.4 * safeBoost,
            sun: 2.6 * safeBoost,
            hemi: 1.6 * safeBoost,
            moon: 0.0,
            bg: litSky.clone(),
            fog: litSky.clone(),
            sunColor: new THREE.Color(0xffffff)
        };
        const sunrise = {
            ambient: 1.6,
            sun: 1.8,
            hemi: 1.2,
            moon: 0.15,
            bg: new THREE.Color(0xffb377),
            fog: new THREE.Color(0xffb377),
            sunColor: new THREE.Color(0xffd0a0)
        };
        const sunset = {
            ambient: 1.4,
            sun: 1.6,
            hemi: 1.0,
            moon: 0.2,
            bg: new THREE.Color(0xff8855),
            fog: new THREE.Color(0xff8855),
            sunColor: new THREE.Color(0xffc080)
        };
        // CRITICAL: Night never goes black. Soft blue moonlight + readable ambient floor.
        const night = {
            ambient: 0.95,
            sun: 0.15,
            hemi: 0.7,
            moon: 1.1,
            bg: new THREE.Color(0x1b2440),
            fog: new THREE.Color(0x1b2440),
            sunColor: new THREE.Color(0xaaccff)
        };

        let lerpFactor = 0;
        let from, to;

        if (t >= 5 && t < 8) {           // Sunrise
            lerpFactor = (t - 5) / 3;
            from = night; to = sunrise;
        } else if (t >= 8 && t < 10) {   // Morning -> Day
            lerpFactor = (t - 8) / 2;
            from = sunrise; to = day;
        } else if (t >= 10 && t < 16) {  // Full Day
            lerpFactor = 1;
            from = day; to = day;
        } else if (t >= 16 && t < 19) {  // Day -> Sunset
            lerpFactor = (t - 16) / 3;
            from = day; to = sunset;
        } else if (t >= 19 && t < 22) {  // Sunset -> Night
            lerpFactor = (t - 19) / 3;
            from = sunset; to = night;
        } else {                          // Night
            lerpFactor = 1;
            from = night; to = night;
        }

        const lerpColor = (c1, c2, f) => new THREE.Color().copy(c1).lerp(c2, f);
        const mix = (a, b, f) => a + (b - a) * f;

        let finalAmbient = mix(from.ambient, to.ambient, lerpFactor);
        let finalSun     = mix(from.sun,     to.sun,     lerpFactor);
        let finalHemi    = mix(from.hemi,    to.hemi,    lerpFactor);
        let finalMoon    = mix(from.moon,    to.moon,    lerpFactor);
        let finalBg      = lerpColor(from.bg,  to.bg,  lerpFactor);
        let finalFog     = lerpColor(from.fog, to.fog, lerpFactor);
        const finalSunColor = lerpColor(from.sunColor, to.sunColor, lerpFactor);

        // Weather: dampen but never crush below a readable floor.
        if (this.weatherIntensity > 0) {
            if (this.currentWeather === 'SPORE_RAIN') {
                finalAmbient *= (1 - 0.25 * this.weatherIntensity);
                finalSun     *= (1 - 0.40 * this.weatherIntensity);
                finalHemi    *= (1 - 0.25 * this.weatherIntensity);
                finalBg  = lerpColor(finalBg,  new THREE.Color(0x2a3a55), this.weatherIntensity * 0.6);
                finalFog = lerpColor(finalFog, new THREE.Color(0x2a3a55), this.weatherIntensity * 0.6);
            } else if (this.currentWeather === 'NETWORK_FOG') {
                finalAmbient *= (1 - 0.15 * this.weatherIntensity);
                finalSun     *= (1 - 0.50 * this.weatherIntensity);
                finalHemi    *= (1 - 0.20 * this.weatherIntensity);
                finalBg  = lerpColor(finalBg,  new THREE.Color(0x3a1f55), this.weatherIntensity * 0.6);
                finalFog = lerpColor(finalFog, new THREE.Color(0x3a1f55), this.weatherIntensity * 0.6);
                if (this.scene.fog) {
                    this.scene.fog.near = 40  + (1 - this.weatherIntensity) * 80;
                    this.scene.fog.far  = 220 + (1 - this.weatherIntensity) * 200;
                }
            }
        }

        // Absolute floors so nothing can ever go pitch black, anywhere.
        finalAmbient = Math.max(finalAmbient, 0.85);
        finalHemi    = Math.max(finalHemi,    0.55);

        this.ambientLight.intensity = finalAmbient;
        this.neonSun.intensity      = finalSun;
        this.neonSun.color.copy(finalSunColor);
        if (this.hemiLight) this.hemiLight.intensity = finalHemi;
        if (this.moonLight) this.moonLight.intensity = finalMoon;
        this.scene.background = finalBg;
        if (this.scene.fog) this.scene.fog.color = finalFog;

        // Sun arcs across the sky; moon takes the opposite arc at night.
        const sunAngle = ((t - 6) / 12) * Math.PI; // 6 AM is 0, 6 PM is PI
        if (t >= 6 && t <= 18) {
            this.neonSun.position.set(Math.cos(sunAngle) * 100, Math.max(20, Math.sin(sunAngle) * 100), 20);
        } else {
            const moonAngle = ((t - 18) / 12) * Math.PI;
            this.neonSun.position.set(Math.cos(moonAngle + Math.PI) * 100, Math.max(20, Math.sin(moonAngle + Math.PI) * 100), 20);
        }
        if (this.moonLight) {
            const moonA = ((t + 6) / 12) * Math.PI;
            this.moonLight.position.set(Math.cos(moonA) * 80, 60, Math.sin(moonA) * 80);
        }

        // Tint and brighten the personal hero light for the time of day.
        if (this.playerHeroLight) {
            const isNight = finalMoon > 0.5;
            this.playerHeroLight.color.setHex(isNight ? 0xbbd6ff : 0xfff2cc);
            this.playerHeroLight.intensity = isNight ? 3.2 : 2.4;
        }

        // Soften the contact shadow at night so it doesn't read like a hole.
        if (this.playerShadowDisc) {
            this.playerShadowDisc.material.opacity = 0.25 + 0.25 * (1 - Math.min(1, finalMoon));
        }

        // Update Nocturnal Mushrooms
        this.updateNocturnalMushrooms(t);
    }

    updateNocturnalMushrooms(t) {
        let nightFactor = 0;
        if (t >= 20 || t < 5) {
            // Full night
            nightFactor = 1.0;
        } else if (t >= 17 && t < 20) {
            // Evening transition
            nightFactor = (t - 17) / 3;
        } else if (t >= 5 && t < 8) {
            // Morning transition
            nightFactor = 1.0 - (t - 5) / 3;
        }

        this.nocturnalMushrooms.forEach(m => {
            const scale = 0.1 + (m.userData.baseScale - 0.1) * nightFactor;
            m.scale.set(scale, scale, scale);
            m.userData.cap.material.emissiveIntensity = nightFactor * 3;
            m.userData.cap.material.opacity = nightFactor;
            m.userData.light.intensity = nightFactor * 2;
        });
    }

    showCriticalImpact(position) {
        // Visual impact effect
        const particleCount = 12;
        const group = new THREE.Group();
        group.position.copy(position);
        this.scene.add(group);

        for (let i = 0; i < particleCount; i++) {
            const geo = new THREE.BoxGeometry(0.2, 0.2, 0.2);
            const mat = new THREE.MeshBasicMaterial({ color: 0xffffff });
            const p = new THREE.Mesh(geo, mat);
            p.userData.velocity = new THREE.Vector3(
                (Math.random() - 0.5) * 0.4,
                (Math.random() - 0.5) * 0.4,
                (Math.random() - 0.5) * 0.4
            );
            group.add(p);
        }

        this.showFloatingText("CRIT!", 0xffffff, true);

        let frames = 0;
        const animateParticles = () => {
            frames++;
            group.children.forEach(p => {
                p.position.add(p.userData.velocity);
                p.scale.multiplyScalar(0.95);
            });
            if (frames < 30) {
                requestAnimationFrame(animateParticles);
            } else {
                this.scene.remove(group);
            }
        };
        animateParticles();

        // Sound effect
        this.impactSynth.triggerAttackRelease("16n");
    }

    showBurnEffect(amount) {
        const particleCount = Math.min(60, 15 + Math.floor(amount / 10));
        const group = new THREE.Group();
        group.position.copy(this.player.group.position);
        this.scene.add(group);

        const color = new THREE.Color(0xff4400);

        for (let i = 0; i < particleCount; i++) {
            const geo = new THREE.BoxGeometry(0.4, 0.4, 0.4);
            const mat = new THREE.MeshStandardMaterial({ 
                color: color, 
                emissive: color, 
                emissiveIntensity: 4,
                transparent: true 
            });
            const p = new THREE.Mesh(geo, mat);
            
            const angle = Math.random() * Math.PI * 2;
            const dist = Math.random() * 0.5;
            p.position.set(Math.cos(angle) * dist, 0.5, Math.sin(angle) * dist);
            
            p.userData.velocity = new THREE.Vector3(
                Math.cos(angle) * (0.05 + Math.random() * 0.1),
                0.15 + Math.random() * 0.3,
                Math.sin(angle) * (0.05 + Math.random() * 0.1)
            );
            group.add(p);
        }

        // Add a central pillar of light
        const pillarGeo = new THREE.CylinderGeometry(0.5, 1.5, 10, 8, 1, true);
        const pillarMat = new THREE.MeshBasicMaterial({ 
            color: 0xff0000, 
            transparent: true, 
            opacity: 0.5,
            side: THREE.DoubleSide
        });
        const pillar = new THREE.Mesh(pillarGeo, pillarMat);
        pillar.position.y = 5;
        group.add(pillar);

        const light = new THREE.PointLight(0xff0000, 20, 15);
        light.position.y = 2;
        group.add(light);

        let frames = 0;
        const animateBurn = () => {
            frames++;
            group.children.forEach(p => {
                if (p.userData.velocity) {
                    p.position.add(p.userData.velocity);
                    p.userData.velocity.y += 0.005; // Upward draft
                    p.rotation.x += 0.1;
                    p.rotation.y += 0.1;
                    p.material.opacity = 1 - (frames / 60);
                }
            });
            
            pillar.material.opacity = (1 - (frames / 60)) * 0.5;
            pillar.scale.x *= 1.02;
            pillar.scale.z *= 1.02;
            light.intensity = (1 - (frames / 60)) * 20;

            if (frames < 60) {
                requestAnimationFrame(animateBurn);
            } else {
                this.scene.remove(group);
            }
        };
        animateBurn();
    }

    enterTowerInterior() {
        this.isInterior = true;
        // Clear scene
        while(this.scene.children.length > 0) {
            this.scene.remove(this.scene.children[0]);
        }
        
        this.collidables = [];
        this.platforms = [];
        this.createTowerInterior();
        
        // Reset player position inside
        this.player.group.position.set(0, 0, 0);
        this.scene.add(this.player.group);
        this.scene.add(this.ambientLight);
        this.scene.background = new THREE.Color(0x050208);
        this.scene.fog = null;
        
        this.showFloatingText("INTERIOR", 0x39FF14);
    }

    exitTowerInterior() {
        this.isInterior = false;
        location.reload(); // Simplest way to restore external state
    }

    showDecorationShop() {
        const p = this.progression.data;
        this.uiOverlay.innerHTML = `
            <div style="pointer-events: auto; background: rgba(0,0,0,0.95); padding: 30px; border: 2px solid #39FF14; width: 85%; max-width: 800px;">
                <h2 style="color: #39FF14; margin-bottom: 20px; font-size: 18px;">INTERIOR DECORATIONS</h2>
                <p style="color: #39FF14; font-size: 10px; margin-bottom: 10px;">BLUE: ${p.blueSpores} | GOLD: ${p.goldenSpores}</p>
                <div style="max-height: 400px; overflow-y: auto; display: grid; grid-template-columns: 1fr 1fr; gap: 10px;">
                    ${CONFIG.DECORATIONS.map(item => `
                        <div style="background: #111; padding: 10px; border: 1px solid #333;">
                            <p style="font-size: 10px; color: #00ffff;">${item.name}</p>
                            <p style="font-size: 8px; color: #888; margin: 5px 0;">${item.desc}</p>
                            <button onclick="window.buyDecoration('${item.id}')" style="font-size: 8px; background: #39FF14; color: black; padding: 5px 10px; border: none; width: 100%;">
                                BUY (${item.costBlue} Blue, ${item.costGold} Gold)
                            </button>
                        </div>
                    `).join('')}
                </div>
                <button onclick="window.closeDialogue()" style="margin-top: 20px; padding: 10px; background: #ff0000; color: white; border: none; font-size: 10px;">CLOSE</button>
            </div>
        `;

        window.buyDecoration = (id) => {
            const item = CONFIG.DECORATIONS.find(i => i.id === id);
            if (p.blueSpores >= item.costBlue && p.goldenSpores >= item.costGold) {
                p.blueSpores -= item.costBlue;
                p.goldenSpores -= item.costGold;
                p.home.decorations.push(id);
                this.progression.save();
                this.updateHud();
                this.showDecorationShop();
                this.uiSynth.triggerAttackRelease("C5", "8n");
                this.showFloatingText(`ACQUIRED ${item.name}!`, 0x39FF14);
            }
        };
    }

    showCookingMenu() {
        if (this.gameState === 'COOKING') return;
        this.gameState = 'COOKING';
        const p = this.progression.data;
        this.uiOverlay.innerHTML = `
            <div style="pointer-events: auto; background: rgba(0,0,0,0.95); padding: 30px; border: 2px solid #39FF14; width: 85%; max-width: 800px;">
                <h2 style="color: #39FF14; margin-bottom: 20px; font-size: 18px;">COOKING & ALCHEMY</h2>
                <div style="display: flex; justify-content: space-around; background: rgba(255,255,255,0.05); padding: 10px; margin-bottom: 20px;">
                    <span style="font-size: 10px; color: #00ffff;">BLUE: ${p.blueSpores}</span>
                    <span style="font-size: 10px; color: #ffff00;">GOLD: ${p.goldenSpores}</span>
                    <span style="font-size: 10px; color: #39FF14;">INGREDIENTS: ${p.ingredients || 0}</span>
                </div>
                <div style="max-height: 400px; overflow-y: auto;">
                    ${CONFIG.RECIPES.map(recipe => {
                        const canCraft = p.blueSpores >= (recipe.costBlue || 0) && 
                                         p.goldenSpores >= (recipe.costGold || 0) && 
                                         (p.ingredients || 0) >= (recipe.costIngredients || 0);
                        return `
                            <div style="background: #111; padding: 15px; border: 1px solid #333; margin-bottom: 10px; display: flex; justify-content: space-between; align-items: center;">
                                <div>
                                    <p style="font-size: 12px; color: #39FF14;">${recipe.name.toUpperCase()}</p>
                                    <p style="font-size: 8px; color: #888; margin: 4px 0;">${recipe.desc}</p>
                                    <p style="font-size: 7px; color: #00ffff;">REQS: ${recipe.costIngredients} Ing, ${recipe.costBlue} Blue ${recipe.costGold ? `, ${recipe.costGold} Gold` : ''}</p>
                                </div>
                                <button onclick="window.craftRecipe('${recipe.id}')" style="padding: 10px; background: ${canCraft ? '#39FF14' : '#444'}; color: black; border: none; font-size: 10px; cursor: ${canCraft ? 'pointer' : 'not-allowed'};">
                                    CRAFT
                                </button>
                            </div>
                        `;
                    }).join('')}
                </div>
                <button onclick="window.closeCooking()" style="margin-top: 20px; padding: 10px; background: #ff0000; color: white; border: none; font-size: 10px; width: 100%;">CLOSE</button>
            </div>
        `;

        window.craftRecipe = (id) => {
            const recipe = CONFIG.RECIPES.find(r => r.id === id);
            if (p.blueSpores >= (recipe.costBlue || 0) && 
                p.goldenSpores >= (recipe.costGold || 0) && 
                (p.ingredients || 0) >= (recipe.costIngredients || 0)) {
                
                p.blueSpores -= (recipe.costBlue || 0);
                p.goldenSpores -= (recipe.costGold || 0);
                p.ingredients -= (recipe.costIngredients || 0);
                
                // Effect logic
                if (recipe.type === 'HP') {
                    this.player.hp = Math.min(this.player.maxHp, this.player.hp + 2);
                    this.showFloatingText("HEALED!", 0xff0000);
                } else if (recipe.type === 'MAGIC') {
                    // Temporary magic boost logic (example: reset cooldowns)
                    this.player.lastShootTime = 0;
                    this.showFloatingText("MANA SURGE!", 0x39FF14);
                } else if (recipe.type === 'ULTIMATE') {
                    this.player.hp = this.player.maxHp;
                    this.showFloatingText("DIVINE PROTECTION!", 0xffff00);
                }

                this.progression.save();
                this.updateHud();
                this.showCookingMenu();
                this.cookingSynth.triggerAttackRelease("C2", "8n");
            }
        };

        window.closeCooking = () => {
            this.gameState = 'PLAYING';
            this.startGameplay();
        };
    }

    restOnBed() {
        const p = this.player;
        if (p.hp >= p.maxHp && p.lastShootTime === 0) {
            this.showFloatingText("ALREADY FULLY RESTED", 0x39FF14);
            return;
        }

        p.hp = p.maxHp;
        p.lastShootTime = 0; // Restore magic (using cooldown as proxy)
        this.updateHud();
        this.showFloatingText("REPLENISHED!", 0xffff00, true);
        
        // Visual feedback - screen fade
        const overlay = document.createElement('div');
        overlay.style.position = 'absolute';
        overlay.style.top = '0';
        overlay.style.left = '0';
        overlay.style.width = '100%';
        overlay.style.height = '100%';
        overlay.style.backgroundColor = 'black';
        overlay.style.opacity = '0';
        overlay.style.transition = 'opacity 0.5s';
        overlay.style.pointerEvents = 'none';
        document.body.appendChild(overlay);
        
        requestAnimationFrame(() => {
            overlay.style.opacity = '0.7';
            setTimeout(() => {
                overlay.style.opacity = '0';
                setTimeout(() => overlay.remove(), 500);
            }, 1000);
        });

        this.restSynth.triggerAttackRelease(["C4", "E4", "G4"], "2n");
    }

    showStorageMenu() {
        if (this.gameState === 'STORAGE') return;
        this.gameState = 'STORAGE';
        const p = this.progression.data;
        
        const renderItemList = (items, isStorage) => {
            if (items.length === 0) return '<p style="font-size: 8px; color: #666; padding: 10px;">Empty</p>';
            return items.map((itemId, index) => {
                const item = CONFIG.SUPPLIES.find(i => i.id === itemId) || 
                             CONFIG.ARMOR.find(i => i.id === itemId) || 
                             CONFIG.MAGIC.find(i => i.id === itemId);
                const name = item ? item.name : itemId;
                return `
                    <div style="background: #111; border: 1px solid #333; padding: 8px; margin-bottom: 5px; display: flex; justify-content: space-between; align-items: center;">
                        <span style="font-size: 9px; color: #39FF14;">${name.toUpperCase()}</span>
                        <button onclick="window.transferItem(${index}, ${isStorage})" style="padding: 5px; background: #39FF14; color: black; border: none; font-size: 8px;">
                            ${isStorage ? 'GET' : 'STORE'}
                        </button>
                    </div>
                `;
            }).join('');
        };

        this.uiOverlay.innerHTML = `
            <div style="pointer-events: auto; background: rgba(0,0,0,0.95); padding: 30px; border: 2px solid #39FF14; width: 90%; max-width: 800px; display: flex; flex-direction: column;">
                <h2 style="color: #39FF14; margin-bottom: 20px; font-size: 18px; text-align: center;">MYCELIAL STORAGE</h2>
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px;">
                    <div>
                        <h3 style="color: #ffff00; font-size: 10px; margin-bottom: 10px;">INVENTORY</h3>
                        <div style="max-height: 300px; overflow-y: auto;">
                            ${renderItemList(p.inventory, false)}
                        </div>
                    </div>
                    <div>
                        <h3 style="color: #00ffff; font-size: 10px; margin-bottom: 10px;">CHEST</h3>
                        <div style="max-height: 300px; overflow-y: auto;">
                            ${renderItemList(p.home.storedItems, true)}
                        </div>
                    </div>
                </div>
                <button onclick="window.closeStorage()" style="margin-top: 20px; padding: 10px; background: #ff0000; color: white; border: none; font-size: 10px;">CLOSE</button>
            </div>
        `;

        window.transferItem = (index, fromStorage) => {
            if (fromStorage) {
                const item = p.home.storedItems.splice(index, 1)[0];
                p.inventory.push(item);
            } else {
                const item = p.inventory.splice(index, 1)[0];
                p.home.storedItems.push(item);
            }
            this.progression.save();
            this.showStorageMenu();
            this.uiSynth.volume.value = -15;
            this.uiSynth.triggerAttackRelease("D4", "16n");
        };

        window.closeStorage = () => {
            this.gameState = 'PLAYING';
            this.startGameplay();
        };
    }

    showWeaponRackMenu() {
        if (this.gameState === 'WEAPON_RACK') return;
        this.gameState = 'WEAPON_RACK';
        const p = this.progression.data;
        
        const renderWeaponList = (items, isStorage) => {
            // Filter inventory for melee weapons
            const weapons = items.filter(id => CONFIG.WEAPONS.find(w => w.id === id));
            if (weapons.length === 0) return '<p style="font-size: 8px; color: #666; padding: 10px;">No Melee Weapons</p>';
            
            return weapons.map((itemId) => {
                const item = CONFIG.WEAPONS.find(w => w.id === itemId);
                const realIndex = items.indexOf(itemId);
                return `
                    <div style="background: #111; border: 1px solid #333; padding: 8px; margin-bottom: 5px; display: flex; justify-content: space-between; align-items: center;">
                        <span style="font-size: 9px; color: #39FF14;">${item.name.toUpperCase()} (DMG: ${item.damage})</span>
                        <button onclick="window.transferWeapon(${realIndex}, ${isStorage})" style="padding: 5px; background: #39FF14; color: black; border: none; font-size: 8px;">
                            ${isStorage ? 'TAKE' : 'DISPLAY'}
                        </button>
                    </div>
                `;
            }).join('');
        };

        this.uiOverlay.innerHTML = `
            <div style="pointer-events: auto; background: rgba(0,0,0,0.95); padding: 30px; border: 2px solid #39FF14; width: 90%; max-width: 800px; display: flex; flex-direction: column;">
                <h2 style="color: #39FF14; margin-bottom: 20px; font-size: 18px; text-align: center;">ELDER WEAPON RACK</h2>
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px;">
                    <div>
                        <h3 style="color: #ffff00; font-size: 10px; margin-bottom: 10px;">INVENTORY</h3>
                        <div style="max-height: 300px; overflow-y: auto;">
                            ${renderWeaponList(p.inventory, false)}
                        </div>
                    </div>
                    <div>
                        <h3 style="color: #00ffff; font-size: 10px; margin-bottom: 10px;">RACK (Max 3)</h3>
                        <div style="max-height: 300px; overflow-y: auto;">
                            ${renderWeaponList(p.home.storedWeapons, true)}
                        </div>
                    </div>
                </div>
                <button onclick="window.closeWeaponRack()" style="margin-top: 20px; padding: 10px; background: #ff0000; color: white; border: none; font-size: 10px;">CLOSE</button>
            </div>
        `;

        window.transferWeapon = (index, fromStorage) => {
            if (fromStorage) {
                const item = p.home.storedWeapons.splice(index, 1)[0];
                p.inventory.push(item);
            } else {
                if (p.home.storedWeapons.length >= 3) {
                    this.showFloatingText("RACK IS FULL!", 0xff0000);
                    return;
                }
                const item = p.inventory.splice(index, 1)[0];
                p.home.storedWeapons.push(item);
            }
            this.progression.save();
            this.showWeaponRackMenu();
            const synth = new TONE.Synth({ volume: -15 }).toDestination();
            synth.triggerAttackRelease("G3", "16n");
            
            // Re-render interior to update visual weapons
            if (this.isInterior) {
                this.enterTowerInterior();
                this.showWeaponRackMenu(); // Keep menu open
            }
        };

        window.closeWeaponRack = () => {
            this.gameState = 'PLAYING';
            this.startGameplay();
        };
    }

    showForgeMenu() {
        if (this.gameState === 'FORGE') return;
        this.gameState = 'FORGE';
        const p = this.progression.data;
        const forgeLevels = p.home.forgeLevels || { weapons: 0, armor: 0 };
        
        const renderUpgradeTier = (category) => {
            const currentLevel = forgeLevels[category];
            const nextTier = CONFIG.FORGE_UPGRADES[category][currentLevel];
            
            if (!nextTier) return '<p style="font-size: 10px; color: #39FF14; padding: 10px;">MAX LEVEL REACHED</p>';

            const canAfford = p.blueSpores >= (nextTier.costBlue || 0) && 
                             p.goldenSpores >= (nextTier.costGold || 0) && 
                             p.ingredients >= (nextTier.costIngredients || 0);

            return `
                <div style="background: #111; padding: 15px; border: 1px solid #333; margin-top: 10px;">
                    <p style="font-size: 12px; color: #ffaa00;">${category.toUpperCase()} TIER ${currentLevel + 1}</p>
                    <p style="font-size: 8px; color: #888; margin: 5px 0;">${nextTier.desc}</p>
                    <p style="font-size: 7px; color: #00ffff;">COST: ${nextTier.costBlue} Blue, ${nextTier.costGold || 0} Gold, ${nextTier.costIngredients} Ingredients</p>
                    <button onclick="window.upgradeForge('${category}')" style="margin-top: 10px; padding: 8px; background: ${canAfford ? '#39FF14' : '#444'}; color: black; border: none; font-size: 9px; width: 100%; cursor: ${canAfford ? 'pointer' : 'not-allowed'};">
                        UPGRADE
                    </button>
                </div>
            `;
        };

        this.uiOverlay.innerHTML = `
            <div style="pointer-events: auto; background: rgba(0,0,0,0.95); padding: 30px; border: 2px solid #ff4400; width: 85%; max-width: 800px; text-align: center;">
                <h2 style="color: #ff4400; margin-bottom: 20px; font-size: 20px;">MYCELIAL FORGE</h2>
                <div style="display: flex; justify-content: space-around; background: rgba(255,255,255,0.05); padding: 10px; margin-bottom: 20px;">
                    <span style="font-size: 10px; color: #00ffff;">BLUE: ${p.blueSpores}</span>
                    <span style="font-size: 10px; color: #ffff00;">GOLD: ${p.goldenSpores}</span>
                    <span style="font-size: 10px; color: #ff5500;">ING: ${p.ingredients || 0}</span>
                </div>
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px;">
                    <div>
                        <h3 style="color: #39FF14; font-size: 12px;">WEAPON STATS</h3>
                        <p style="font-size: 10px; color: #888;">Current Bonus: +${this.getForgeBonus('weapons')} DMG</p>
                        ${renderUpgradeTier('weapons')}
                    </div>
                    <div>
                        <h3 style="color: #39FF14; font-size: 12px;">ARMOR STATS</h3>
                        <p style="font-size: 10px; color: #888;">Current Bonus: +${this.getForgeBonus('armor')} Ward</p>
                        ${renderUpgradeTier('armor')}
                    </div>
                </div>
                <button onclick="window.closeForge()" style="margin-top: 30px; padding: 10px; background: #ff0000; color: white; border: none; font-size: 10px; width: 100%;">LEAVE FORGE</button>
            </div>
        `;

        window.upgradeForge = (category) => {
            const currentLevel = forgeLevels[category];
            const nextTier = CONFIG.FORGE_UPGRADES[category][currentLevel];
            
            if (nextTier && p.blueSpores >= (nextTier.costBlue || 0) && 
                p.goldenSpores >= (nextTier.costGold || 0) && 
                p.ingredients >= (nextTier.costIngredients || 0)) {
                
                p.blueSpores -= (nextTier.costBlue || 0);
                p.goldenSpores -= (nextTier.costGold || 0);
                p.ingredients -= (nextTier.costIngredients || 0);
                
                p.home.forgeLevels[category]++;
                this.progression.save();
                this.player.applyLevelStats(); // Re-apply stats to player
                this.updateHud();
                this.showForgeMenu();
                
                const synth = new TONE.MembraneSynth({ volume: -5 }).toDestination();
                synth.triggerAttackRelease("G1", "4n");
                this.showFloatingText(`${category.toUpperCase()} UPGRADED!`, 0xff4400, true);
            }
        };

        window.closeForge = () => {
            this.gameState = 'PLAYING';
            this.startGameplay();
        };
    }

    showBurnPitMenu() {
        if (this.gameState === 'BURN_PIT') return;
        this.gameState = 'BURN_PIT';
        
        const updateBurnUI = () => {
            const p = this.progression.data;
            const clanData = this.leaderboard.data.clans[this.selectedClan] || { burned: 0, dailyBurned: 0 };
            
            // Countdown to Sunday 8pm CST
            const getCountdown = () => {
                const now = new Date();
                const sunday = new Date();
                sunday.setDate(now.getDate() + (7 - now.getDay()) % 7);
                sunday.setHours(20, 0, 0, 0); // 8pm
                
                // If it's already past 8pm Sunday, go to next Sunday
                if (now > sunday) {
                    sunday.setDate(sunday.getDate() + 7);
                }
                
                const diff = sunday - now;
                const days = Math.floor(diff / (1000 * 60 * 60 * 24));
                const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
                const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
                const secs = Math.floor((diff % (1000 * 60)) / 1000);
                
                return `${days}d ${hours}h ${mins}m ${secs}s`;
            };

            const burnLimit = 1000;
            const remainingDaily = burnLimit - p.dailyBurnedAmount;

            this.uiOverlay.innerHTML = `
                <div style="pointer-events: auto; background: rgba(10,0,0,0.95); padding: 30px; border: 2px solid #ff0000; width: 90%; max-width: 800px; text-align: center; box-shadow: 0 0 30px #ff0000;">
                    <h2 style="color: #ff0000; margin-bottom: 10px; font-size: 24px; text-shadow: 0 0 10px #f00;">THE GREAT SPORE BURN</h2>
                    <p style="color: #ffaa00; font-size: 10px; margin-bottom: 20px;">Burn Spores to restore the Solana Network.<br>Every Sunday at 8PM CST, Spores are converted to $KINGMYCO.</p>
                    
                    <div style="background: rgba(255,0,0,0.1); padding: 15px; border-radius: 5px; margin-bottom: 25px;">
                        <p style="color: #fff; font-size: 12px; margin-bottom: 5px;">NEXT CONVERSION IN:</p>
                        <p id="burn-countdown" style="color: #ff0000; font-size: 18px; font-weight: bold;">${getCountdown()}</p>
                    </div>

                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 25px;">
                        <div style="background: #111; padding: 15px; border: 1px solid #333; display: flex; flex-direction: column;">
                            <h3 style="color: #00ffff; font-size: 12px; margin-bottom: 10px;">YOUR BURN STATS</h3>
                            <p style="font-size: 10px; color: #888;">BLUE SPORES: <span style="color: #00ffff;">${p.blueSpores}</span></p>
                            <p style="font-size: 10px; color: #888;">BURN STREAK: <span style="color: #ffff00;">${p.burnStreak || 0} DAYS</span></p>
                            <p style="font-size: 10px; color: #888;">DAILY BURNED: <span style="color: #ff0000;">${p.dailyBurnedAmount} / ${burnLimit}</span></p>
                            <div style="margin-top: 15px;">
                                <input type="number" id="burn-amount" placeholder="Amount" style="width: 80px; padding: 5px; background: #000; color: #fff; border: 1px solid #ff0000; font-family: inherit; font-size: 10px;">
                                <button onclick="window.burnSporesAction()" style="padding: 5px 15px; background: #ff0000; color: #fff; border: none; font-size: 10px; cursor: pointer;">BURN</button>
                            </div>

                            <h3 style="color: #ffaa00; font-size: 12px; margin-top: 20px; margin-bottom: 10px;">YOUR BURN LOG</h3>
                            <div style="max-height: 100px; overflow-y: auto; text-align: left; font-size: 7px; background: rgba(0,0,0,0.3); padding: 5px;">
                                <table style="width: 100%; border-collapse: collapse;">
                                    ${(p.burnHistory || []).length > 0 ? 
                                        p.burnHistory.map(h => `
                                            <tr style="border-bottom: 1px solid #222;">
                                                <td style="color: #888; padding: 2px 0;">${h.date}</td>
                                                <td align="right" style="color: #00ffff;">+${h.amount}</td>
                                            </tr>
                                        `).join('') : 
                                        '<tr><td style="color: #444; padding: 5px;">No personal burns recorded...</td></tr>'
                                    }
                                </table>
                            </div>

                            <h3 style="color: #ffff00; font-size: 12px; margin-top: 20px; margin-bottom: 10px;">HALL OF FAME</h3>
                            <div style="max-height: 100px; overflow-y: auto; text-align: left; font-size: 7px;">
                                <table style="width: 100%; border-collapse: collapse;">
                                    <tr style="color: #888; border-bottom: 1px solid #222;">
                                        <td>DATE</td>
                                        <td>CHAMPION</td>
                                        <td align="right">BURN</td>
                                    </tr>
                                    ${(this.leaderboard.data.hallOfFame || []).length > 0 ? 
                                        this.leaderboard.data.hallOfFame.map(entry => `
                                            <tr style="border-bottom: 1px solid #111;">
                                                <td style="color: #666;">${entry.weekEnding}</td>
                                                <td style="color: ${this.getClanColor(entry.winner)}">${entry.winner.toUpperCase()}</td>
                                                <td align="right" style="color: #ffaa00;">${entry.winnerBurn}</td>
                                            </tr>
                                        `).join('') : 
                                        '<tr><td colspan="3" style="color: #444; padding: 5px;">No legends recorded yet...</td></tr>'
                                    }
                                </table>
                            </div>
                        </div>
                        <div style="background: #111; padding: 15px; border: 1px solid #333;">
                            <h3 style="color: #39FF14; font-size: 12px; margin-bottom: 10px;">CLAN LEADBOARD</h3>
                            <div style="max-height: 150px; overflow-y: auto; text-align: left; font-size: 8px;">
                                <table style="width: 100%;">
                                    <tr style="color: #888;">
                                        <td>CLAN</td>
                                        <td align="right">DAILY</td>
                                        <td align="right">TOTAL</td>
                                    </tr>
                                    ${Object.entries(this.leaderboard.data.clans).map(([id, data]) => `
                                        <tr style="color: ${this.getClanColor(id)};">
                                            <td>${id.toUpperCase()}</td>
                                            <td align="right">${data.dailyBurned || 0}</td>
                                            <td align="right">${data.burned || 0}</td>
                                        </tr>
                                    `).join('')}
                                </table>
                            </div>
                        </div>
                    </div>

                    <button onclick="window.closeBurnPit()" style="padding: 10px 40px; background: #333; color: #fff; border: none; font-size: 12px; cursor: pointer;">RETURN</button>
                </div>
            `;

            const countdownInterval = setInterval(() => {
                const timer = document.getElementById('burn-countdown');
                if (timer) {
                    timer.innerText = getCountdown();
                } else {
                    clearInterval(countdownInterval);
                }
            }, 1000);
        };

        updateBurnUI();

        window.burnSporesAction = () => {
            const input = document.getElementById('burn-amount');
            const amount = parseInt(input.value);
            const p = this.progression.data;
            const burnLimit = 1000;
            const remainingDaily = burnLimit - p.dailyBurnedAmount;

            if (isNaN(amount) || amount <= 0) {
                this.showFloatingText("INVALID AMOUNT", 0xff0000);
                return;
            }
            if (amount > p.blueSpores) {
                this.showFloatingText("NOT ENOUGH SPORES", 0xff0000);
                return;
            }
            if (amount > remainingDaily) {
                this.showFloatingText(`DAILY LIMIT REACHED (${remainingDaily} left)`, 0xff0000);
                return;
            }

            // SIMULATE ON-CHAIN TRANSACTION
            this.showTransactionSimulation(amount, () => {
                // Execute Burn
                p.blueSpores -= amount;
                p.dailyBurnedAmount += amount;
                
                // Streak & Daily Reward Logic
                const now = new Date();
                const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
                const lastContrib = p.lastBurnContribution ? new Date(p.lastBurnContribution) : null;
                const lastContribStart = lastContrib ? new Date(lastContrib.getFullYear(), lastContrib.getMonth(), lastContrib.getDate()).getTime() : 0;
                
                const oneDayMs = 24 * 60 * 60 * 1000;
                
                if (todayStart > lastContribStart) {
                    if (todayStart === lastContribStart + oneDayMs) {
                        p.burnStreak = (p.burnStreak || 0) + 1;
                        // Check Reward Tiers
                        if (p.burnStreak === 3) {
                            p.goldenSpores += 2;
                            this.showFloatingText("3-DAY STREAK: +2 GOLD!", 0xffff00, true);
                        } else if (p.burnStreak === 7) {
                            p.goldenSpores += 10;
                            p.skillPoints += 1;
                            this.showFloatingText("7-DAY STREAK: +10 GOLD, +1 SP!", 0xffff00, true);
                        } else if (p.burnStreak === 14) {
                            p.goldenSpores += 25;
                            p.skillPoints += 2;
                            this.showFloatingText("14-DAY STREAK: +25 GOLD, +2 SP!", 0xffff00, true);
                        }
                    } else {
                        p.burnStreak = 1;
                    }
                    p.lastBurnContribution = todayStart;
                }

                // Record Personal History
                if (!p.burnHistory) p.burnHistory = [];
                p.burnHistory.unshift({
                    amount: amount,
                    timestamp: Date.now(),
                    date: new Date().toLocaleString([], { hour: '2-digit', minute: '2-digit', month: 'short', day: 'numeric' })
                });
                if (p.burnHistory.length > 15) p.burnHistory.pop(); // Keep last 15 entries

                this.progression.save();
                
                const playerName = this.walletAddress ? `Hero_${this.walletAddress.slice(-4)}` : "KingMyco";
                const mode = this.progression.isCollectorMode() ? 'COLLECTOR' : 'STORY';
                const result = this.leaderboard.burnSpores(this.selectedClan, amount, playerName, mode);
                if (result.isSignificant) {
                    this.showGlobalNotification(`${playerName} performed a GREAT BURN of ${amount} spores for ${this.selectedClan.toUpperCase()}!`, this.getClanColor(this.selectedClan));
                }
                
                this.showBurnEffect(amount);
                this.showFloatingText(`BURNED ${amount} SPORES!`, 0xff0000, true);
                this.updateHud();
                updateBurnUI();

                // Fire sound
                const synth = new TONE.NoiseSynth({
                    noise: { type: 'brown' },
                    envelope: { attack: 0.1, decay: 0.8, sustain: 0 }
                }).toDestination();
                synth.triggerAttackRelease("2n");
            });
        };

        window.closeBurnPit = () => {
            this.gameState = 'PLAYING';
            this.startGameplay();
        };
    }

    getForgeBonus(category) {
        const levels = this.progression.data.home.forgeLevels || { weapons: 0, armor: 0 };
        const level = levels[category];
        if (level === 0) return 0;
        const tiers = CONFIG.FORGE_UPGRADES[category];
        return category === 'weapons' ? tiers[level - 1].damageBonus : tiers[level - 1].wardBonus;
    }

    showTransactionSimulation(amount, onComplete) {
        const overlay = document.createElement('div');
        overlay.style.position = 'absolute';
        overlay.style.top = '0';
        overlay.style.left = '0';
        overlay.style.width = '100%';
        overlay.style.height = '100%';
        overlay.style.backgroundColor = 'rgba(0,0,0,0.85)';
        overlay.style.display = 'flex';
        overlay.style.justifyContent = 'center';
        overlay.style.alignItems = 'center';
        overlay.style.zIndex = '10000';
        overlay.style.pointerEvents = 'auto';
        document.body.appendChild(overlay);

        overlay.innerHTML = `
            <div style="background: #1a1a1a; width: 320px; border-radius: 12px; font-family: sans-serif; overflow: hidden; box-shadow: 0 10px 30px rgba(0,0,0,0.5); border: 1px solid #333;">
                <div style="background: #2a2a2a; padding: 15px; display: flex; align-items: center; border-bottom: 1px solid #333;">
                    <div style="width: 32px; height: 32px; background: #ff0000; border-radius: 50%; margin-right: 10px; display: flex; align-items: center; justify-content: center; font-weight: bold; color: white;">B</div>
                    <div style="flex: 1;">
                        <div style="color: white; font-size: 14px; font-weight: bold;">Fungal Restoration</div>
                        <div style="color: #888; font-size: 11px;">myco-quest.rosebud.ai</div>
                    </div>
                </div>
                <div style="padding: 20px; text-align: center;">
                    <div style="color: #888; font-size: 12px; margin-bottom: 5px;">Spores to be Consumed</div>
                    <div style="color: #ff4444; font-size: 24px; font-weight: bold; margin-bottom: 10px;">-${amount} Spores</div>
                    <div style="color: #39FF14; font-size: 12px; margin-bottom: 20px;">Burn Value: ${(amount * 0.10).toFixed(2)} $KINGMYCO</div>
                    
                    <div style="background: #222; border-radius: 8px; padding: 12px; text-align: left; margin-bottom: 20px;">
                        <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
                            <span style="color: #888; font-size: 11px;">Restoration Fee</span>
                            <span style="color: #39FF14; font-size: 11px;">0.000005 SOL</span>
                        </div>
                        <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
                            <span style="color: #888; font-size: 11px;">Target</span>
                            <span style="color: white; font-size: 11px;">Solana Incinerator</span>
                        </div>
                        <div style="display: flex; justify-content: space-between;">
                            <span style="color: #888; font-size: 11px;">Signature</span>
                            <span style="color: #00ffff; font-size: 8px; font-family: monospace;">5f8e...3a1c</span>
                        </div>
                    </div>

                    <div style="display: flex; gap: 10px;">
                        <button id="tx-cancel" style="flex: 1; padding: 12px; border-radius: 8px; border: 1px solid #444; background: transparent; color: white; font-weight: bold; cursor: pointer;">Cancel</button>
                        <button id="tx-approve" style="flex: 1; padding: 12px; border-radius: 8px; border: none; background: #ff0000; color: white; font-weight: bold; cursor: pointer;">Burn Spores</button>
                    </div>
                </div>
                <div style="padding: 10px; text-align: center; color: #555; font-size: 10px; border-top: 1px solid #333;">
                    Spore Burn Protocol V1.2.0 - Mainnet Bridge
                </div>
            </div>
        `;

        const cancelBtn = overlay.querySelector('#tx-cancel');
        const approveBtn = overlay.querySelector('#tx-approve');

        cancelBtn.onclick = () => {
            overlay.remove();
            this.showFloatingText("BURN CANCELLED", 0xff0000);
        };

        approveBtn.onclick = () => {
            approveBtn.innerText = "Broadcasting...";
            approveBtn.disabled = true;
            cancelBtn.disabled = true;
            
            setTimeout(() => {
                approveBtn.innerText = "Finalizing...";
                setTimeout(() => {
                    const sig = Array.from({length: 64}, () => Math.floor(Math.random() * 16).toString(16)).join('');
                    console.log(`%c[SOLANA] Burn successful! Signature: ${sig}`, "color: #00ffa3; font-weight: bold;");
                    overlay.remove();
                    onComplete();
                }, 1200);
            }, 1000);
        };
    }

    onWindowResize() {
        // V1.9.27 - Throttle resize on mobile. iOS Safari fires resize repeatedly
        // as the URL bar collapses; reallocating render targets on every event
        // causes visible stutter. We coalesce to a single update via rAF.
        if (this._resizePending) return;
        this._resizePending = true;
        requestAnimationFrame(() => {
            this._resizePending = false;
            const w = window.innerWidth;
            const h = window.innerHeight;
            this.camera.aspect = w / h;
            this.camera.updateProjectionMatrix();
            this.renderer.setSize(w, h);
            if (this.composer) this.composer.setSize(w, h);
        });
    }

    setupStartScreen() {
        const isConnected = !!this.walletAddress;
        const hasSave = !!this.progression.data.clanChosen;

        // V1.9.33 - Mobile-aware Start Screen sizing. The old fixed 48px title + 50px
        // padding produced a card taller than the iPhone Safari viewport, which the
        // overlay flexbox silently clipped. We scale down on small screens, tap-size
        // every button, and let the menu breathe vertically so the title is always
        // the first thing visible.
        const isMobile = !!this.isMobile;
        const titleSz = isMobile ? 32 : 48;
        const subSz   = isMobile ? 11 : 14;
        const lvlSz   = isMobile ? 9  : 10;
        const padIn   = isMobile ? 24 : 50;
        const gapSz   = isMobile ? 12 : 15;
        const startFs = isMobile ? 15 : 18;
        const btnFs   = isMobile ? 11 : 12;
        const smFs    = isMobile ? 10 : 10;
        const topPad  = isMobile ? 'calc(20px + env(safe-area-inset-top))' : '40px';
        const botPad  = isMobile ? 'calc(40px + env(safe-area-inset-bottom))' : '40px';
        const tapBtn  = 'min-height: 44px; touch-action: manipulation; -webkit-tap-highlight-color: transparent;';

        this.uiOverlay.innerHTML = `
            <div id="start-screen-wrap" style="pointer-events: auto; width: 100%; min-height: 100%; display: flex; flex-direction: column; align-items: center; justify-content: ${isMobile ? 'flex-start' : 'center'}; padding: ${topPad} 12px ${botPad} 12px; box-sizing: border-box;">
                <div id="start-screen" style="display: flex; flex-direction: column; align-items: center; width: 100%; max-width: ${isMobile ? 360 : 480}px; background: rgba(0,0,0,0.85); padding: ${padIn}px; border: 4px solid #39FF14; border-radius: 15px; box-shadow: 0 0 30px #39FF14; text-align: center; box-sizing: border-box;">
                    <h1 class="neon-text" style="font-size: ${titleSz}px; margin: 0 0 10px 0; color: #39FF14; text-shadow: 0 0 10px #39FF14; line-height: 1.1;">MYCO QUEST</h1>
                    <p style="font-size: ${subSz}px; margin: 0 0 5px 0; color: #fff; letter-spacing: 2px;">THE SOLANA RESTORATION</p>
                    <p style="font-size: ${lvlSz}px; margin: 0 0 ${isMobile ? 18 : 30}px 0; color: #888;">LVL ${this.progression.data.level} KING MYCO</p>

                    <div style="display: flex; flex-direction: column; gap: ${gapSz}px; width: 100%; margin-bottom: ${isMobile ? 18 : 30}px;">
                        <button id="start-button" style="padding: 15px; font-size: ${startFs}px; background: #39FF14; border: none; color: black; font-family: inherit; cursor: pointer; ${tapBtn}">
                            ${hasSave ? 'RESUME ADVENTURE' : 'BEGIN JOURNEY'}
                        </button>
                        ${hasSave ? `<button id="new-game-button" style="padding: 12px; font-size: ${btnFs}px; background: #ff4400; border: none; color: white; font-family: inherit; cursor: pointer; ${tapBtn}">NEW JOURNEY</button>` : ''}
                        ${hasSave ? `<button id="change-mode-button" style="padding: 10px; font-size: ${smFs}px; background: #6a0dad; border: none; color: white; font-family: inherit; cursor: pointer; ${tapBtn}">CHANGE MODE ${this.progression.data.gameMode === 'COLLECTOR' ? '(SPORE COLLECTOR)' : '(STORY)'}</button>` : ''}
                        <div style="display: flex; gap: 10px;">
                            <button id="leaderboard-button" style="flex: 1; padding: 12px; font-size: ${smFs}px; background: #00ffff; border: none; color: black; font-family: inherit; cursor: pointer; ${tapBtn}">LEADERBOARD</button>
                            <button id="hall-of-fame-button" style="flex: 1; padding: 12px; font-size: ${smFs}px; background: #ffaa00; border: none; color: black; font-family: inherit; cursor: pointer; ${tapBtn}">HALL OF FAME</button>
                        </div>
                        <button id="settings-button" style="padding: 12px; font-size: ${btnFs}px; background: #555; border: none; color: white; font-family: inherit; cursor: pointer; ${tapBtn}">SETTINGS</button>
                    </div>

                    <div style="width: 100%; height: 1px; background: #333; margin-bottom: ${isMobile ? 16 : 25}px;"></div>

                    <div style="display: flex; flex-direction: column; gap: 10px; align-items: center; width: 100%;">
                        <button id="wallet-button" style="padding: 12px 25px; font-size: ${smFs}px; background: ${isConnected ? '#333' : '#6a0dad'}; border: 1px solid #6a0dad; color: white; font-family: inherit; cursor: pointer; border-radius: 5px; ${tapBtn}">
                            ${isConnected ? `CONNECTED: ${this.walletAddress.slice(0, 4)}...${this.walletAddress.slice(-4)}` : 'CONNECT SOLANA WALLET'}
                        </button>
                        ${isConnected ? `<button id="disconnect-wallet" style="font-size: 8px; color: #666; background: none; border: none; cursor: pointer; text-decoration: underline; ${tapBtn}">Disconnect</button>` : ''}
                    </div>

                    <div style="margin-top: ${isMobile ? 16 : 24}px; width: 100%; display: flex; align-items: center; justify-content: space-between; gap: 10px; padding: 8px 10px; background: rgba(255,255,255,0.03); border: 1px solid #222; border-radius: 6px;">
                        <div style="text-align: left; flex: 1;">
                            <div style="font-size: 9px; color: #ccc; letter-spacing: 1px;">LOW PERF MODE</div>
                            <div style="font-size: 7px; color: #666; margin-top: 2px;">
                                ${this.progression.data.settings.lowPerfMode === true ? 'FORCED ON · cheaper rendering' :
                                  this.progression.data.settings.lowPerfMode === false ? 'FORCED OFF · full effects' :
                                  `AUTO (${this.mobilePerf ? 'on' : 'off'})`}
                            </div>
                        </div>
                        <button id="low-perf-toggle" style="padding: 8px 12px; font-size: 9px; background: ${this.progression.data.settings.lowPerfMode === true ? '#ff8800' : this.progression.data.settings.lowPerfMode === false ? '#39FF14' : '#444'}; color: ${this.progression.data.settings.lowPerfMode === false ? '#000' : '#fff'}; border: none; font-family: inherit; cursor: pointer; border-radius: 4px; min-width: 70px; ${tapBtn}">
                            ${this.progression.data.settings.lowPerfMode === true ? 'ON' : this.progression.data.settings.lowPerfMode === false ? 'OFF' : 'AUTO'}
                        </button>
                    </div>

                    <div style="margin-top: ${isMobile ? 16 : 24}px; font-size: 8px; color: #444;">
                        V1.9.37 - SPOREWOOD ROSTER
                    </div>
                </div>
            </div>
        `;

        document.getElementById('start-button').addEventListener('click', async () => {
            await TONE.start();
            if (hasSave) {
                this.showLoadConfirmation();
            } else {
                // V1.9.21 - First-time players pick Story vs Spore Collector before the prologue.
                this.setupModeSelection();
            }
        });
        
        if (hasSave) {
            document.getElementById('new-game-button').addEventListener('click', () => {
                this.showNewGameConfirmation();
            });
            const cm = document.getElementById('change-mode-button');
            if (cm) cm.addEventListener('click', () => this.setupModeSelection(true));
        }

        document.getElementById('leaderboard-button').addEventListener('click', () => this.showLeaderboard());
        document.getElementById('hall-of-fame-button').addEventListener('click', () => this.showHallOfFame());
        document.getElementById('settings-button').addEventListener('click', () => this.showSettingsMenu());
        document.getElementById('wallet-button').addEventListener('click', () => {
            if (!isConnected) this.connectWallet();
        });
        if (isConnected) {
            document.getElementById('disconnect-wallet').addEventListener('click', () => this.disconnectWallet());
        }

        // V1.9.36 - Low Perf Mode toggle. Cycles AUTO -> ON -> OFF -> AUTO.
        // Renderer-flag decisions (DPR cap, antialias, shadows, EffectComposer,
        // far-plane, fog) are made once during Game3D.init(), so we have to
        // reload to apply. We persist first, then reload — the next boot reads
        // the new value before constructing the renderer.
        const perfBtn = document.getElementById('low-perf-toggle');
        if (perfBtn) {
            perfBtn.addEventListener('click', () => {
                const cur = this.progression.data.settings.lowPerfMode;
                let next;
                if (cur === null || cur === undefined) next = true;       // AUTO -> ON
                else if (cur === true) next = false;                      // ON -> OFF
                else next = null;                                         // OFF -> AUTO
                this.progression.data.settings.lowPerfMode = next;
                this.progression.save();
                try { this.triggerHaptic && this.triggerHaptic('tap'); } catch (_) {}
                // Re-render the start screen so the row updates immediately.
                // Then offer a reload so the renderer actually re-initializes.
                this.setupStartScreen();
                const label = next === true ? 'LOW PERF MODE: ON' :
                              next === false ? 'LOW PERF MODE: OFF' :
                              'LOW PERF MODE: AUTO';
                if (confirm(`${label}\n\nReload now to apply graphics changes?`)) {
                    location.reload();
                }
            });
        }
    }

    // V1.9.21 - Game mode selection: Story (full RPG) vs Spore Collector (sandbox).
    setupModeSelection(fromStart = false) {
        this.gameState = 'MODE_SELECT';
        const current = this.progression.data.gameMode;
        this.uiOverlay.innerHTML = `
            <div style="pointer-events: auto; display: flex; flex-direction: column; align-items: center; width: 100%; min-height: 100%; background: rgba(0,0,0,0.92); padding: 30px; overflow-y: auto;">
                <h2 class="neon-text" style="margin-bottom: 8px; font-size: 28px; color: #39FF14;">CHOOSE YOUR PATH</h2>
                <p style="color: #aaa; font-size: 11px; margin-bottom: 28px; letter-spacing: 1px;">How will King Myco walk the Mycoverse today?</p>

                <div style="display: flex; flex-wrap: wrap; justify-content: center; gap: 24px; width: 100%; max-width: 900px;">

                    <div class="mode-card" id="mode-story"
                         style="width: 360px; background: #0a0a0a; border: 2px solid ${current === 'STORY' ? '#39FF14' : '#333'}; border-radius: 12px; padding: 24px; cursor: pointer; transition: all 0.25s;"
                         onmouseover="this.style.borderColor='#39FF14'; this.style.boxShadow='0 0 22px #39FF14'; this.style.transform='translateY(-6px)'"
                         onmouseout="this.style.borderColor='${current === 'STORY' ? '#39FF14' : '#333'}'; this.style.boxShadow='none'; this.style.transform='translateY(0)'">
                        <div style="font-size: 32px; margin-bottom: 8px;">⚔️</div>
                        <h3 style="color: #39FF14; font-size: 16px; margin: 0 0 6px 0; letter-spacing: 1px;">STORY MODE</h3>
                        <p style="color: #888; font-size: 9px; letter-spacing: 1px; margin: 0 0 14px 0;">THE SOLANA RESTORATION</p>
                        <ul style="color: #ddd; font-size: 11px; line-height: 1.6; padding-left: 18px; margin: 0 0 18px 0;">
                            <li>Full quest, combat, and progression</li>
                            <li>Reclaim 7 Crown Shards</li>
                            <li>NPCs, shops, upgrades, daily rot</li>
                            <li>Bosses, dungeons, and the Rot</li>
                        </ul>
                        <button id="pick-story" style="width: 100%; padding: 12px; background: #39FF14; border: none; color: black; font-family: inherit; font-weight: bold; cursor: pointer;">
                            ${current === 'STORY' ? 'CONTINUE STORY' : 'BEGIN STORY'}
                        </button>
                    </div>

                    <div class="mode-card" id="mode-collector"
                         style="width: 360px; background: #0a0a0a; border: 2px solid ${current === 'COLLECTOR' ? '#6a0dad' : '#333'}; border-radius: 12px; padding: 24px; cursor: pointer; transition: all 0.25s;"
                         onmouseover="this.style.borderColor='#aa44ff'; this.style.boxShadow='0 0 22px #aa44ff'; this.style.transform='translateY(-6px)'"
                         onmouseout="this.style.borderColor='${current === 'COLLECTOR' ? '#6a0dad' : '#333'}'; this.style.boxShadow='none'; this.style.transform='translateY(0)'">
                        <div style="font-size: 32px; margin-bottom: 8px;">🍄</div>
                        <h3 style="color: #aa44ff; font-size: 16px; margin: 0 0 6px 0; letter-spacing: 1px;">SPORE COLLECTOR</h3>
                        <p style="color: #888; font-size: 9px; letter-spacing: 1px; margin: 0 0 14px 0;">SANDBOX · NO COMBAT</p>
                        <ul style="color: #ddd; font-size: 11px; line-height: 1.6; padding-left: 18px; margin: 0 0 18px 0;">
                            <li>All regions open — every portal unlocked</li>
                            <li>Collect up to <span style="color:#fff2a8;">1000 spores / day</span></li>
                            <li>Burn spores at the Burn Pit</li>
                            <li>No enemies · no bosses · no quests</li>
                            <li>NPCs just say hi · shops closed · no upgrades</li>
                        </ul>
                        <button id="pick-collector" style="width: 100%; padding: 12px; background: #6a0dad; border: none; color: white; font-family: inherit; font-weight: bold; cursor: pointer;">
                            ${current === 'COLLECTOR' ? 'CONTINUE COLLECTING' : 'COLLECT SPORES'}
                        </button>
                    </div>

                </div>

                <button id="mode-back" style="margin-top: 36px; padding: 10px 26px; background: transparent; border: 1px solid #666; color: #888; font-family: inherit; font-size: 10px; cursor: pointer;">${fromStart ? 'BACK' : 'CANCEL'}</button>
            </div>
        `;

        const advance = (mode) => {
            this.progression.setGameMode(mode);
            if (mode === 'COLLECTOR') {
                // Skip the prologue + clan selection in collector mode. Lock in a default clan
                // so the player rig still renders correctly, but mark it as collector-default
                // so it can be re-chosen if they switch to Story later.
                if (!this.progression.data.clanChosen) {
                    this.progression.data.clanChosen = 'myco';
                    this.selectedClan = 'myco';
                    this.progression.save();
                    if (this.player && typeof this.player.setClan === 'function') this.player.setClan('myco');
                }
                this.showCollectorIntro();
                return;
            }
            // STORY mode: existing path.
            if (this.progression.data.clanChosen) {
                this.selectedClan = this.progression.data.clanChosen;
                if (this.player && typeof this.player.setClan === 'function') this.player.setClan(this.selectedClan);
                this.startGameplay();
            } else {
                this.startEpicStory();
            }
        };

        document.getElementById('pick-story').addEventListener('click', (e) => { e.stopPropagation(); advance('STORY'); });
        document.getElementById('pick-collector').addEventListener('click', (e) => { e.stopPropagation(); advance('COLLECTOR'); });
        document.getElementById('mode-story').addEventListener('click', () => advance('STORY'));
        document.getElementById('mode-collector').addEventListener('click', () => advance('COLLECTOR'));
        document.getElementById('mode-back').addEventListener('click', () => this.setupStartScreen());
    }

    // V1.9.24 - Inject the dashboard burn-FX stylesheet exactly once. Keyframes drive
    // ember particles, rising flame, dashboard pulse glow, and a button shake.
    _ensureBurnAnimationStyles() {
        if (document.getElementById('collector-burn-styles')) return;
        const style = document.createElement('style');
        style.id = 'collector-burn-styles';
        style.textContent = `
            @keyframes collectorEmberRise {
                0%   { transform: translate(0, 0)        scale(1);    opacity: 1; }
                60%  { opacity: 1; }
                100% { transform: translate(var(--dx,0), var(--dy,-80px)) scale(0.2); opacity: 0; }
            }
            @keyframes collectorFlameLick {
                0%   { transform: translate(-50%, 10%)  scaleY(0.4) scaleX(1.1); opacity: 0.9; filter: blur(0.5px); }
                40%  { transform: translate(-50%, -30%) scaleY(1.4) scaleX(0.9); opacity: 1;   filter: blur(0px); }
                80%  { transform: translate(-50%, -90%) scaleY(1.7) scaleX(0.6); opacity: 0.7; filter: blur(1px); }
                100% { transform: translate(-50%, -140%) scaleY(2)  scaleX(0.3); opacity: 0;   filter: blur(2px); }
            }
            @keyframes collectorButtonPunch {
                0%   { transform: scale(1)   translateY(0);     box-shadow: 0 0 0 rgba(255,85,0,0); }
                20%  { transform: scale(0.92) translateY(2px);  box-shadow: 0 0 0 rgba(255,85,0,0); }
                45%  { transform: scale(1.15) translateY(-2px); box-shadow: 0 0 22px rgba(255,170,68,0.95), 0 0 38px rgba(255,85,0,0.7); }
                70%  { transform: scale(1.04) translateY(0);    box-shadow: 0 0 14px rgba(255,170,68,0.5); }
                100% { transform: scale(1)   translateY(0);     box-shadow: 0 0 0 rgba(255,85,0,0); }
            }
            @keyframes collectorDashGlow {
                0%   { box-shadow: 0 0 0 rgba(255,85,0,0),     inset 0 0 0 rgba(255,170,68,0); border-color: #aa44ff; }
                25%  { box-shadow: 0 0 35px rgba(255,85,0,0.6), inset 0 0 18px rgba(255,170,68,0.35); border-color: #ff8844; }
                100% { box-shadow: 0 0 0 rgba(255,85,0,0),     inset 0 0 0 rgba(255,170,68,0); border-color: #aa44ff; }
            }
            @keyframes collectorMeterPulse {
                0%   { filter: brightness(1)   saturate(1); }
                30%  { filter: brightness(1.7) saturate(1.4); }
                100% { filter: brightness(1)   saturate(1); }
            }
            @keyframes collectorShake {
                0%, 100% { transform: translate(0, 0); }
                15%      { transform: translate(-2px, 1px); }
                30%      { transform: translate(2px, -1px); }
                45%      { transform: translate(-1px, 2px); }
                60%      { transform: translate(2px, 0); }
                75%      { transform: translate(-1px, -1px); }
            }
            @keyframes collectorFloatNumber {
                0%   { transform: translate(-50%, 0)    scale(0.8); opacity: 0; }
                15%  { transform: translate(-50%, -10px) scale(1.2); opacity: 1; }
                100% { transform: translate(-50%, -80px) scale(1);   opacity: 0; }
            }
            .collector-burn-ember {
                position: absolute;
                width: 6px; height: 6px;
                border-radius: 50%;
                background: radial-gradient(circle, #fff4b8 0%, #ffaa44 40%, #ff5500 70%, rgba(255,85,0,0) 100%);
                pointer-events: none;
                animation: collectorEmberRise 900ms cubic-bezier(.2,.65,.4,1) forwards;
                will-change: transform, opacity;
            }
            .collector-burn-flame {
                position: absolute;
                left: 50%; bottom: -4px;
                width: 36px; height: 48px;
                border-radius: 50% 50% 38% 38% / 80% 80% 22% 22%;
                background: radial-gradient(ellipse at 50% 90%, #fff4b8 0%, #ffd24a 18%, #ff7a1a 45%, #ff3300 75%, rgba(255,0,0,0) 100%);
                pointer-events: none;
                mix-blend-mode: screen;
                animation: collectorFlameLick 800ms ease-out forwards;
                will-change: transform, opacity;
            }
            .collector-burn-float {
                position: absolute;
                left: 50%; top: -14px;
                color: #ffaa44;
                font-family: inherit; font-size: 14px; font-weight: bold;
                text-shadow: 0 0 6px #ff5500, 0 0 12px rgba(255,170,68,0.6), 1px 1px 2px #000;
                pointer-events: none;
                white-space: nowrap;
                animation: collectorFloatNumber 1100ms ease-out forwards;
            }
        `;
        document.head.appendChild(style);
    }

    // V1.9.24 - Returns (and lazily creates) the persistent fullscreen FX layer used to
    // host burn embers/flames. Lives directly on document.body so HUD re-renders never
    // tear our animation children out mid-tween.
    _getBurnFxLayer() {
        let layer = document.getElementById('burn-fx-layer');
        if (!layer) {
            layer = document.createElement('div');
            layer.id = 'burn-fx-layer';
            layer.style.cssText = `
                position: fixed; left: 0; top: 0;
                width: 100vw; height: 100vh;
                pointer-events: none; z-index: 9000;
                overflow: hidden;
            `;
            document.body.appendChild(layer);
        }
        return layer;
    }

    // V1.9.24 - Visual burn animation for the dashboard. Anchors FX at the source button's
    // screen coordinates, so the animation survives the post-burn `updateHud()` DOM rebuild.
    // Safe when the pill isn't open (Burn Pit modal etc.) — null checks guard each step.
    playDashboardBurnAnimation(amount, sourceBtn = null) {
        this._ensureBurnAnimationStyles();
        const fxLayer = this._getBurnFxLayer();
        const dashboard = document.querySelector('[data-collector-dashboard]');
        const hud = document.getElementById('hud');

        // 1) Whole-dashboard glow + meter pulse (will be removed on the next updateHud,
        // but the glow runs in the first ~250ms which lands before the click handler's
        // updateHud completes — close enough to feel responsive).
        if (dashboard) {
            dashboard.style.animation = 'none';
            void dashboard.offsetWidth;
            dashboard.style.animation = 'collectorDashGlow 950ms ease-out';
            const meter = dashboard.querySelector('[data-burn-meter]');
            if (meter) {
                meter.style.animation = 'none';
                void meter.offsetWidth;
                meter.style.animation = 'collectorMeterPulse 700ms ease-out';
            }
        }

        // 2) Subtle HUD shake — felt in both modes, scaled by burn size.
        if (hud) {
            const shakeMs = amount >= 500 ? 450 : (amount >= 100 ? 300 : 200);
            hud.style.animation = 'none';
            void hud.offsetWidth;
            hud.style.animation = `collectorShake ${shakeMs}ms ease-in-out`;
        }

        // 3) Snapshot button screen rect BEFORE the HUD rebuild so all FX are positioned
        // in viewport space on the persistent fxLayer.
        const btn = sourceBtn || (dashboard && dashboard.querySelector('[data-burn-btn]'));
        const rect = btn
            ? btn.getBoundingClientRect()
            : (dashboard ? dashboard.getBoundingClientRect() : null);
        if (!rect) return;

        const cx = rect.left + rect.width / 2;
        const cy = rect.top  + rect.height / 2;
        const bottomY = rect.top  + rect.height - 4;

        // Button punch flash (lives on the actual button — short enough to land before rebuild).
        if (btn) {
            if (getComputedStyle(btn).position === 'static') btn.style.position = 'relative';
            btn.style.animation = 'none';
            void btn.offsetWidth;
            btn.style.animation = 'collectorButtonPunch 380ms ease-out';
        }

        // Flame plume (attached to the persistent fx layer at the button's screen pos).
        const flame = document.createElement('div');
        flame.className = 'collector-burn-flame';
        flame.style.left = `${cx}px`;
        flame.style.top  = `${bottomY}px`;
        flame.style.bottom = 'auto';
        fxLayer.appendChild(flame);
        setTimeout(() => flame.remove(), 850);

        // Ember particles — count scales with burn size, capped for perf.
        const emberCount = Math.min(28, 8 + Math.floor(amount / 20));
        for (let i = 0; i < emberCount; i++) {
            const ember = document.createElement('div');
            ember.className = 'collector-burn-ember';
            const startX = rect.left + rect.width  * (0.2 + Math.random() * 0.6);
            const startY = rect.top  + rect.height * (0.6 + Math.random() * 0.3);
            ember.style.left = `${startX}px`;
            ember.style.top  = `${startY}px`;
            const spread = 22 + Math.random() * 30;
            const dx = (Math.random() - 0.5) * spread * 2;
            const dy = -(40 + Math.random() * 70);
            ember.style.setProperty('--dx', `${dx}px`);
            ember.style.setProperty('--dy', `${dy}px`);
            ember.style.animationDelay = `${Math.random() * 120}ms`;
            ember.style.animationDuration = `${700 + Math.random() * 400}ms`;
            const size = 4 + Math.random() * 5;
            ember.style.width = `${size}px`;
            ember.style.height = `${size}px`;
            fxLayer.appendChild(ember);
            setTimeout(() => ember.remove(), 1300);
        }

        // Floating "-N 🔥" number above the button.
        const float = document.createElement('div');
        float.className = 'collector-burn-float';
        float.textContent = `−${amount} 🔥`;
        float.style.left = `${cx}px`;
        float.style.top  = `${rect.top - 14}px`;
        fxLayer.appendChild(float);
        setTimeout(() => float.remove(), 1150);
    }

    // V1.9.22 - Quick-burn entry point exposed by the Collector dashboard pill.
    // Mirrors the Burn Pit menu logic (daily cap, streak, leaderboard, FX) but
    // doesn't open the full burn modal — designed for one-tap sandbox burns.
    quickBurnFromDashboard(amount, sourceBtn = null) {
        const p = this.progression.data;
        const burnLimit = 1000;
        const remainingDaily = burnLimit - (p.dailyBurnedAmount || 0);

        if (!Number.isFinite(amount) || amount <= 0) {
            this.showFloatingText("INVALID AMOUNT", 0xff0000);
            return;
        }
        if (amount > (p.blueSpores || 0)) {
            this.showFloatingText("NOT ENOUGH SPORES", 0xff0000);
            return;
        }
        if (amount > remainingDaily) {
            if (remainingDaily <= 0) {
                this.showFloatingText("DAILY BURN CAP REACHED", 0xff0000);
                return;
            }
            amount = remainingDaily; // Clamp instead of rejecting, so "BURN ALL" just tops up to cap.
        }

        // V1.9.24 - Fire the dashboard burn VFX FIRST so we capture the live button rect
        // before updateHud() rebuilds the HUD DOM. The FX layer lives on document.body, so
        // the ember/flame/float children persist through the subsequent re-render.
        try { this.playDashboardBurnAnimation(amount, sourceBtn); } catch (_) {}

        // Execute the burn directly (no on-chain simulation modal — quick-burn UX).
        p.blueSpores -= amount;
        p.dailyBurnedAmount = (p.dailyBurnedAmount || 0) + amount;

        // Streak logic (mirrors showBurnPitMenu).
        const now = new Date();
        const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
        const lastContrib = p.lastBurnContribution ? new Date(p.lastBurnContribution) : null;
        const lastContribStart = lastContrib ? new Date(lastContrib.getFullYear(), lastContrib.getMonth(), lastContrib.getDate()).getTime() : 0;
        const oneDayMs = 24 * 60 * 60 * 1000;
        if (todayStart > lastContribStart) {
            if (todayStart === lastContribStart + oneDayMs) {
                p.burnStreak = (p.burnStreak || 0) + 1;
                if (p.burnStreak === 3) {
                    p.goldenSpores += 2;
                    this.showFloatingText("3-DAY STREAK: +2 GOLD!", 0xffff00, true);
                } else if (p.burnStreak === 7) {
                    p.goldenSpores += 10;
                    // Skill points don't apply in collector mode (no upgrades), but keep parity in story.
                    if (!this.progression.isCollectorMode()) p.skillPoints = (p.skillPoints || 0) + 1;
                    this.showFloatingText("7-DAY STREAK: +10 GOLD!", 0xffff00, true);
                } else if (p.burnStreak === 14) {
                    p.goldenSpores += 25;
                    if (!this.progression.isCollectorMode()) p.skillPoints = (p.skillPoints || 0) + 2;
                    this.showFloatingText("14-DAY STREAK: +25 GOLD!", 0xffff00, true);
                }
            } else {
                p.burnStreak = 1;
            }
            p.lastBurnContribution = todayStart;
        }

        // Personal burn history.
        if (!p.burnHistory) p.burnHistory = [];
        p.burnHistory.unshift({
            amount: amount,
            timestamp: Date.now(),
            date: new Date().toLocaleString([], { hour: '2-digit', minute: '2-digit', month: 'short', day: 'numeric' })
        });
        if (p.burnHistory.length > 15) p.burnHistory.pop();

        this.progression.save();

        // Leaderboard contribution (uses chosen clan; collectors default to 'myco').
        const playerName = this.walletAddress ? `Hero_${this.walletAddress.slice(-4)}` : "KingMyco";
        try {
            const result = this.leaderboard.burnSpores(this.selectedClan, amount, playerName, 'COLLECTOR');
            if (result && result.isSignificant) {
                this.showGlobalNotification(`${playerName} burned ${amount} spores for ${this.selectedClan.toUpperCase()}!`, this.getClanColor(this.selectedClan));
            }
        } catch (_) {}

        // FX
        try { this.showBurnEffect(amount); } catch (_) {}
        this.showFloatingText(`🔥 BURNED ${amount} SPORES`, 0xff5500, true);
        try {
            const synth = new TONE.NoiseSynth({ noise: { type: 'brown' }, envelope: { attack: 0.1, decay: 0.8, sustain: 0 } }).toDestination();
            synth.triggerAttackRelease("4n");
        } catch (_) {}
        this.updateHud();
    }

    // V1.9.23 - Spore Collector mode leaderboard: top burners across TODAY / WEEK / ALL-TIME.
    // Reachable from the in-game collector dashboard pill ("🏆 LEADERBOARD" button).
    // Returns the player to gameplay via the BACK button, freezing input via gameState.
    showCollectorLeaderboard(activeWindow = 'today') {
        const prevState = this.gameState;
        this.gameState = 'DIALOGUE';
        this._collectorLbWindow = activeWindow;

        const playerName = this.walletAddress ? `Hero_${this.walletAddress.slice(-4)}` : "KingMyco";
        const windows = [
            { key: 'today', label: 'TODAY',     color: '#aa44ff' },
            { key: 'week',  label: 'THIS WEEK', color: '#66ccff' },
            { key: 'all',   label: 'ALL-TIME', color: '#ffcc66' }
        ];

        const renderRows = (rows) => {
            if (!rows.length) {
                return `<div style="padding: 22px; text-align: center; color: #888; font-size: 11px;">
                    No spores have been burned in this window yet.<br>
                    <span style="color: #aa44ff;">Be the first 🔥</span>
                </div>`;
            }
            const key = activeWindow === 'today' ? 'todayBurned'
                      : activeWindow === 'week'  ? 'weeklyBurned'
                                                 : 'burned';
            const top = rows[0][key] || 1;
            return rows.map((r, i) => {
                const isYou = r.name === playerName;
                const clanColor = this.getClanColor(r.clan);
                const amount = r[key] || 0;
                const pct = Math.max(4, Math.round((amount / top) * 100));
                const rankColor = i === 0 ? '#ffd83d' : (i === 1 ? '#c8c8d0' : (i === 2 ? '#d8884a' : '#666'));
                const rankIcon = i === 0 ? '🥇' : (i === 1 ? '🥈' : (i === 2 ? '🥉' : `#${i+1}`));
                const isCollector = r.lastMode === 'COLLECTOR' || (r.collectorBurned || 0) > 0;
                const badge = isCollector
                    ? `<span style="display:inline-block; margin-left: 6px; padding: 1px 6px; background: #6a0dad; color: #fff; font-size: 8px; font-weight: bold; border-radius: 8px; letter-spacing: 1px;">🍄 COLLECTOR</span>`
                    : `<span style="display:inline-block; margin-left: 6px; padding: 1px 6px; background: #115; color: #aaf; font-size: 8px; font-weight: bold; border-radius: 8px; letter-spacing: 1px;">⚔️ STORY</span>`;
                return `
                    <div style="
                        display: grid; grid-template-columns: 36px 1fr 90px;
                        align-items: center; gap: 10px;
                        padding: 10px 12px;
                        background: ${isYou ? 'rgba(170,68,255,0.12)' : (i % 2 === 0 ? 'rgba(255,255,255,0.03)' : 'rgba(255,255,255,0.07)')};
                        border-left: 3px solid ${isYou ? '#aa44ff' : 'transparent'};
                        border-bottom: 1px solid rgba(255,255,255,0.05);
                    ">
                        <div style="font-size: 14px; color: ${rankColor}; font-weight: bold; text-align: center;">${rankIcon}</div>
                        <div style="min-width: 0;">
                            <div style="font-size: 11px; color: ${isYou ? '#fff' : '#eee'}; font-weight: bold; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
                                ${r.name.length > 18 ? r.name.slice(0, 17) + '…' : r.name}
                                ${isYou ? `<span style="color:#aa44ff; font-size: 9px; margin-left: 4px;">YOU</span>` : ''}
                                ${badge}
                            </div>
                            <div style="display:flex; align-items:center; gap:6px; margin-top: 4px;">
                                <span style="font-size: 8px; color: ${clanColor}; font-weight: bold; letter-spacing: 1px;">${r.clan.toUpperCase()}</span>
                                <div style="flex:1; height:5px; background:rgba(0,0,0,0.5); border-radius:3px; overflow:hidden;">
                                    <div style="width:${pct}%; height:100%; background: linear-gradient(90deg, #ff5500, #ffaa44);"></div>
                                </div>
                            </div>
                        </div>
                        <div style="text-align: right; font-size: 13px; color: #ffaa66; font-weight: bold; text-shadow: 1px 1px 2px black;">
                            ${amount.toLocaleString()} 🔥
                        </div>
                    </div>
                `;
            }).join('');
        };

        const rows = this.leaderboard.getBurnLeaderboard(activeWindow, 10);
        const yourRank = (() => {
            const all = this.leaderboard.getBurnLeaderboard(activeWindow, 9999);
            const idx = all.findIndex(p => p.name === playerName);
            return { idx, player: idx === -1 ? null : all[idx] };
        })();

        const totalGlobal = (this.leaderboard.data.totalGlobalBurned || 0).toLocaleString();
        const weeklyGlobal = (this.leaderboard.data.weeklyGlobalBurned || 0).toLocaleString();

        const tabButtons = windows.map(w => `
            <button id="lb-tab-${w.key}"
                style="
                    flex:1; padding: 10px 4px;
                    background: ${activeWindow === w.key ? w.color : 'transparent'};
                    color: ${activeWindow === w.key ? '#000' : w.color};
                    border: 1px solid ${w.color};
                    font-family: inherit; font-size: 11px; font-weight: bold;
                    letter-spacing: 1px; cursor: pointer;
                ">${w.label}</button>
        `).join('');

        this.uiOverlay.innerHTML = `
            <div style="pointer-events: auto; display: flex; justify-content: center; align-items: flex-start; width: 100%; min-height: 100%; padding: 30px 20px; background: rgba(0,0,0,0.85); overflow-y: auto;">
                <div style="width: 100%; max-width: 600px; background: #0a0014; border: 2px solid #aa44ff; border-radius: 14px; box-shadow: 0 0 30px rgba(170,68,255,0.4); padding: 26px;">

                    <div style="display:flex; align-items:center; gap:10px; margin-bottom: 6px;">
                        <span style="font-size: 28px;">🏆</span>
                        <div style="flex:1;">
                            <h2 style="color: #aa44ff; margin: 0; font-size: 18px; letter-spacing: 2px;">TOP SPORE BURNERS</h2>
                            <p style="color: #888; font-size: 9px; margin: 2px 0 0 0; letter-spacing: 1px;">THE GREAT BURN · CROSS-MODE LEADERBOARD</p>
                        </div>
                    </div>

                    <!-- Global totals strip -->
                    <div style="display:flex; gap:8px; margin: 14px 0;">
                        <div style="flex:1; padding: 8px; background: rgba(255,85,0,0.1); border: 1px solid #ff5500; border-radius: 6px; text-align: center;">
                            <div style="font-size: 8px; color: #ff8855; letter-spacing: 1px;">WEEK BURNED</div>
                            <div style="font-size: 14px; color: #ffaa66; font-weight: bold;">${weeklyGlobal} 🔥</div>
                        </div>
                        <div style="flex:1; padding: 8px; background: rgba(255,170,68,0.1); border: 1px solid #ffaa44; border-radius: 6px; text-align: center;">
                            <div style="font-size: 8px; color: #ffaa44; letter-spacing: 1px;">ALL-TIME GLOBAL</div>
                            <div style="font-size: 14px; color: #fff2a8; font-weight: bold;">${totalGlobal} 🔥</div>
                        </div>
                    </div>

                    <!-- Tabs -->
                    <div style="display:flex; gap:6px; margin-bottom: 14px;">
                        ${tabButtons}
                    </div>

                    <!-- Rows -->
                    <div style="border: 1px solid #222; border-radius: 8px; overflow: hidden; background: rgba(0,0,0,0.35);">
                        ${renderRows(rows)}
                    </div>

                    <!-- Your standing -->
                    <div style="margin-top: 14px; padding: 10px 12px; background: rgba(170,68,255,0.08); border: 1px dashed #aa44ff; border-radius: 6px; font-size: 11px; color: #ddd;">
                        ${yourRank.player
                            ? `Your standing: <strong style="color:#aa44ff;">#${yourRank.idx + 1}</strong>
                               &nbsp;·&nbsp;
                               <strong style="color:#ffaa66;">${(yourRank.player[
                                    activeWindow === 'today' ? 'todayBurned' :
                                    activeWindow === 'week'  ? 'weeklyBurned' : 'burned'
                                ] || 0).toLocaleString()}</strong>
                               🔥 burned ${activeWindow === 'today' ? 'today' : activeWindow === 'week' ? 'this week' : 'all-time'}`
                            : `You haven't burned any spores ${activeWindow === 'today' ? 'today' : activeWindow === 'week' ? 'this week' : 'yet'}. Open the dashboard pill to start.`
                        }
                    </div>

                    <div style="display:flex; gap:10px; margin-top: 18px;">
                        <button id="lb-back" style="flex:1; padding: 12px; background: #aa44ff; color: #fff; border: none; font-family: inherit; font-weight: bold; cursor: pointer; letter-spacing: 1px;">BACK TO COLLECTING</button>
                    </div>
                </div>
            </div>
        `;

        windows.forEach(w => {
            const el = document.getElementById(`lb-tab-${w.key}`);
            if (el) el.addEventListener('click', () => this.showCollectorLeaderboard(w.key));
        });
        document.getElementById('lb-back').addEventListener('click', () => {
            try { if (this.uiSynth) this.uiSynth.triggerAttackRelease('A4', '16n'); } catch (_) {}
            // Restore prior gameplay state and rebuild the HUD without re-running startGameplay
            // (which would re-register hotkeys and re-spawn collectibles).
            this.gameState = prevState === 'DIALOGUE' ? 'PLAYING' : (prevState || 'PLAYING');
            // Re-render the in-game HUD layer (the same markup startGameplay installs).
            const controlHint = this.progression.isCollectorMode()
                ? `WASD: MOVE | SPACE: JUMP | E: COLLECT / INTERACT | B: BURN PIT`
                : `WASD: MOVE | SPACE: JUMP (x2) | X: MAGIC | Q: ROYAL SPORE | R: MYCELIAL NET | E: INTERACT | U: UPGRADES | B: BURN PIT`;
            this.uiOverlay.innerHTML = `
                <div id="hud" style="position: absolute; top: 20px; left: 20px; pointer-events: none; background: rgba(0,0,0,0.5); padding: 15px; border-radius: 10px; width: 220px;"></div>
                <div style="position: absolute; bottom: 70px; left: 50%; transform: translateX(-50%); pointer-events: none; font-size: 10px; color: #888; text-shadow: 1px 1px 2px black; white-space: nowrap;">
                    ${controlHint}
                </div>
            `;
            this.updateHud();
        });
    }

    // V1.9.21 - Brief explainer shown the first time a player enters Spore Collector mode.
    showCollectorIntro() {
        this.uiOverlay.innerHTML = `
            <div style="pointer-events: auto; display: flex; flex-direction: column; align-items: center; background: rgba(0,0,0,0.95); padding: 40px; border: 3px solid #aa44ff; border-radius: 14px; box-shadow: 0 0 30px #aa44ff; text-align: center; max-width: 560px;">
                <div style="font-size: 44px; margin-bottom: 10px;">🍄</div>
                <h2 style="color: #aa44ff; font-size: 22px; margin-bottom: 18px;">SPORE COLLECTOR MODE</h2>
                <p style="color: #eee; font-size: 12px; line-height: 1.8; margin-bottom: 18px;">
                    Welcome, harvester. This is a peaceful walk through the Mycoverse —
                    <strong style="color: #fff2a8;">all portals are open</strong>, and every region
                    is yours to wander.
                </p>
                <ul style="color: #ccc; font-size: 11px; line-height: 1.8; text-align: left; margin-bottom: 22px; padding-left: 22px;">
                    <li>Collect up to <strong style="color: #fff2a8;">1000 spores per day</strong></li>
                    <li>Burn spores at the <strong>Burn Pit</strong> in the Sanctuary</li>
                    <li><strong style="color:#888;">No enemies, no quests, no upgrades</strong></li>
                    <li>NPCs just wave hello — shops and the inn are closed</li>
                    <li>Switch back to Story Mode any time from the Start Screen</li>
                </ul>
                <button id="collector-begin" style="padding: 14px 30px; background: #aa44ff; border: none; color: white; font-family: inherit; font-weight: bold; cursor: pointer; font-size: 13px;">START COLLECTING</button>
            </div>
        `;
        document.getElementById('collector-begin').addEventListener('click', () => {
            try { this.uiSynth.triggerAttackRelease('A4', '8n'); } catch (_) {}
            this.startGameplay();
        });
    }

    showLoadConfirmation() {
        const p = this.progression.data;
        const region = CONFIG.REGIONS.find(r => r.id === p.currentRegionId) || { name: 'Unknown Grove' };
        
        this.uiOverlay.innerHTML = `
            <div style="pointer-events: auto; display: flex; flex-direction: column; align-items: center; background: rgba(0,0,0,0.95); padding: 40px; border: 4px solid #00ffff; border-radius: 10px; box-shadow: 0 0 30px #00ffff; text-align: center; max-width: 500px;">
                <h2 style="color: #00ffff; font-size: 20px; margin-bottom: 20px;">RESTORE ECHO?</h2>
                <div style="background: #111; padding: 20px; border: 1px solid #333; margin-bottom: 30px; text-align: left; width: 100%;">
                    <p style="color: #39FF14; font-size: 12px; margin-bottom: 10px;">KING MYCO - LVL ${p.level}</p>
                    <p style="color: #fff; font-size: 10px; margin-bottom: 5px;">CLAN: ${p.clanChosen.toUpperCase()}</p>
                    <p style="color: #888; font-size: 10px;">LOCATION: ${region.name.toUpperCase()}</p>
                </div>
                <div style="display: flex; gap: 20px; width: 100%;">
                    <button id="confirm-load" style="flex: 1; padding: 15px; background: #00ffff; border: none; color: black; font-family: inherit; cursor: pointer;">RESTORE</button>
                    <button id="cancel-load" style="flex: 1; padding: 15px; background: #333; border: none; color: white; font-family: inherit; cursor: pointer;">CANCEL</button>
                </div>
            </div>
        `;

        document.getElementById('confirm-load').addEventListener('click', async () => {
            await TONE.start();
            this.uiSynth.triggerAttackRelease("C5", "8n");
            this.startGameplay();
        });
        document.getElementById('cancel-load').addEventListener('click', () => {
            this.uiSynth.triggerAttackRelease("G3", "16n");
            this.setupStartScreen();
        });
    }

    showNewGameConfirmation() {
        this.uiOverlay.innerHTML = `
            <div style="pointer-events: auto; display: flex; flex-direction: column; align-items: center; background: rgba(0,0,0,0.95); padding: 40px; border: 4px solid #ff4400; border-radius: 10px; box-shadow: 0 0 30px #ff4400; text-align: center; max-width: 500px;">
                <h2 style="color: #ff4400; font-size: 20px; margin-bottom: 20px;">WIPE NETWORK CACHE?</h2>
                <p style="color: #fff; font-size: 12px; margin-bottom: 30px; line-height: 1.6;">Starting a New Journey will erase all current progress, including levels, spores, and unlocked regions.<br><br><span style="color: #ff4400;">THIS CANNOT BE UNDONE.</span></p>
                <div style="display: flex; gap: 20px; width: 100%;">
                    <button id="confirm-new" style="flex: 1; padding: 15px; background: #ff4400; border: none; color: white; font-family: inherit; cursor: pointer;">WIPE & START</button>
                    <button id="cancel-new" style="flex: 1; padding: 15px; background: #333; border: none; color: white; font-family: inherit; cursor: pointer;">ABORT</button>
                </div>
            </div>
        `;

        document.getElementById('confirm-new').addEventListener('click', () => {
            this.uiSynth.triggerAttackRelease("C2", "4n");
            localStorage.removeItem(this.progression.storageKey);
            location.reload();
        });
        document.getElementById('cancel-new').addEventListener('click', () => {
            this.uiSynth.triggerAttackRelease("G3", "16n");
            this.setupStartScreen();
        });
    }

    async connectWallet() {
        const getProvider = () => {
            if ('solana' in window) {
                const provider = window.solana;
                if (provider.isPhantom) return provider;
            }
            // Return null but simulate the flow if we're in an environment without Phantom
            return null;
        };

        const provider = getProvider();
        
        if (provider) {
            try {
                const resp = await provider.connect();
                this.walletAddress = resp.publicKey.toString();
                this.saveWalletConnection();
                this.setupStartScreen(); 
                this.showFloatingText("WALLET CONNECTED!", 0x39FF14);
            } catch (err) {
                console.error("User rejected connection", err);
                this.showFloatingText("CONNECTION REJECTED", 0xff0000);
            }
        } else {
            // Simulated Phantom Flow for users without the extension in sandbox
            this.showSimulatedWalletConnection();
        }
    }

    saveWalletConnection() {
        if (this.walletAddress) {
            localStorage.setItem('myco_quest_wallet', this.walletAddress);
        }
    }

    loadWalletConnection() {
        const saved = localStorage.getItem('myco_quest_wallet');
        if (saved) {
            this.walletAddress = saved;
        }
    }

    disconnectWallet() {
        this.walletAddress = null;
        localStorage.removeItem('myco_quest_wallet');
        this.setupStartScreen();
        this.showFloatingText("WALLET DISCONNECTED", 0x888888);
    }

    showSimulatedWalletConnection() {
        const overlay = document.createElement('div');
        overlay.style.position = 'absolute';
        overlay.style.top = '0';
        overlay.style.left = '0';
        overlay.style.width = '100%';
        overlay.style.height = '100%';
        overlay.style.backgroundColor = 'rgba(0,0,0,0.85)';
        overlay.style.display = 'flex';
        overlay.style.justifyContent = 'center';
        overlay.style.alignItems = 'center';
        overlay.style.zIndex = '10000';
        overlay.style.pointerEvents = 'auto';
        document.body.appendChild(overlay);

        overlay.innerHTML = `
            <div style="background: #1a1a1a; width: 320px; border-radius: 12px; font-family: sans-serif; overflow: hidden; box-shadow: 0 10px 30px rgba(0,0,0,0.5); border: 1px solid #333;">
                <div style="background: #2a2a2a; padding: 20px; text-align: center; border-bottom: 1px solid #333;">
                    <img src="https://phantom.app/img/logo.png" style="width: 64px; height: 64px; margin-bottom: 15px; border-radius: 15px;">
                    <div style="color: white; font-size: 18px; font-weight: bold;">Connect Phantom</div>
                    <div style="color: #888; font-size: 13px; margin-top: 5px;">myco-quest.rosebud.ai</div>
                </div>
                <div style="padding: 20px;">
                    <p style="color: #ccc; font-size: 13px; text-align: center; margin-bottom: 20px;">
                        Simulating a secure connection to your Solana wallet.
                    </p>
                    <div style="display: flex; gap: 10px;">
                        <button id="sim-cancel" style="flex: 1; padding: 12px; border-radius: 8px; border: 1px solid #444; background: transparent; color: white; font-weight: bold; cursor: pointer;">Cancel</button>
                        <button id="sim-connect" style="flex: 1; padding: 12px; border-radius: 8px; border: none; background: #6a0dad; color: white; font-weight: bold; cursor: pointer;">Connect</button>
                    </div>
                </div>
            </div>
        `;

        overlay.querySelector('#sim-cancel').onclick = () => overlay.remove();
        overlay.querySelector('#sim-connect').onclick = () => {
            const btn = overlay.querySelector('#sim-connect');
            btn.innerText = "Connecting...";
            btn.disabled = true;
            setTimeout(() => {
                this.walletAddress = "B9r7...mYc0"; // Simulated addr
                this.saveWalletConnection();
                overlay.remove();
                this.setupStartScreen();
                this.showFloatingText("MOCK WALLET CONNECTED", 0x39FF14);
            }, 800);
        };
    }

    showLeaderboard() {
        const clanRankings = this.leaderboard.getClanRankings();
        const playerRankings = this.leaderboard.data.players;
        const burnerRankings = this.leaderboard.getPlayerBurnRankings();

        this.uiOverlay.innerHTML = `
            <div style="pointer-events: auto; background: rgba(0,0,0,0.95); padding: 40px; border: 2px solid #00ffff; border-radius: 10px; width: 90%; max-width: 900px; text-align: center; box-shadow: 0 0 30px #00ffff; max-height: 90vh; overflow-y: auto;">
                <h2 style="color: #00ffff; margin-bottom: 20px; letter-spacing: 2px;">HALL OF HEROES</h2>
                
                <div style="margin-bottom: 30px;">
                    <p style="color: #39FF14; margin-bottom: 15px; font-size: 14px;">CLAN STANDINGS & STATS</p>
                    <table style="width: 100%; border-collapse: collapse; font-size: 8px;">
                        <thead>
                            <tr style="color: #00ffff; border-bottom: 1px solid #333;">
                                <th style="padding: 10px; text-align: left;">CLAN</th>
                                <th style="padding: 10px;">SCORE</th>
                                <th style="padding: 10px;">MORAL</th>
                                <th style="padding: 10px;">MAGIC</th>
                                <th style="padding: 10px;">BOSS</th>
                                <th style="padding: 10px;">BLUE</th>
                                <th style="padding: 10px;">GOLD</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${clanRankings.map((c) => `
                                <tr style="color: ${this.getClanColor(c.id)}; border-bottom: 1px solid #222;">
                                    <td style="padding: 8px; text-align: left;">${c.id.toUpperCase()}</td>
                                    <td style="padding: 8px;">${c.score}</td>
                                    <td style="padding: 8px;">${c.avgAlignment}%</td>
                                    <td style="padding: 8px;">${c.avgMagic}</td>
                                    <td style="padding: 8px;">${c.avgBosses}</td>
                                    <td style="padding: 8px;">${c.totalBlue}</td>
                                    <td style="padding: 8px;">${c.totalGold}</td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>

                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 30px;">
                    <div>
                        <p style="color: #39FF14; margin-bottom: 15px; font-size: 12px;">TOP HEROES (SCORE)</p>
                        <div style="display: flex; flex-direction: column; gap: 8px;">
                            ${[...playerRankings].sort((a,b) => b.score - a.score).slice(0, 5).map((p, i) => `
                                <div style="display: flex; justify-content: space-between; font-size: 10px; padding: 5px; background: rgba(255,255,255,0.05);">
                                    <span>${i + 1}. ${p.name.slice(0, 12)} (${p.clan.toUpperCase()})</span>
                                    <span>${p.score} SP</span>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                    <div>
                        <p style="color: #ff0000; margin-bottom: 15px; font-size: 12px;">TOP BURNERS (SPORES)</p>
                        <div style="display: flex; flex-direction: column; gap: 8px;">
                            ${burnerRankings.map((p, i) => `
                                <div style="display: flex; justify-content: space-between; font-size: 10px; padding: 5px; background: rgba(255,0,0,0.1);">
                                    <span>${i + 1}. ${p.name.slice(0, 12)} (${p.clan.toUpperCase()})</span>
                                    <span>${p.burned || 0} 🔥</span>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                </div>
                
                <div style="display: flex; justify-content: center; gap: 20px;">
                    <button id="view-hall-button" style="padding: 10px 20px; background: #ffaa00; border: none; color: black; font-size: 12px; cursor: pointer;">VIEW HALL OF FAME</button>
                    <button id="back-button" style="padding: 10px 20px; background: #00ffff; border: none; color: black; font-size: 12px; cursor: pointer;">BACK</button>
                </div>
            </div>
        `;
        document.getElementById('back-button').addEventListener('click', () => this.setupStartScreen());
        document.getElementById('view-hall-button').addEventListener('click', () => this.showHallOfFame());
    }

    showHallOfFame() {
        const hallOfFame = this.leaderboard.data.hallOfFame || [];
        
        this.uiOverlay.innerHTML = `
            <div style="pointer-events: auto; background: rgba(0,0,0,0.98); padding: 50px; border: 4px solid #ffaa00; border-radius: 20px; width: 90%; max-width: 1000px; text-align: center; box-shadow: 0 0 50px rgba(255, 170, 0, 0.4); max-height: 90vh; overflow-y: auto; font-family: 'Press Start 2P', cursive;">
                <h2 style="color: #ffaa00; margin-bottom: 10px; font-size: 28px; text-shadow: 0 0 10px #ffaa00;">HALL OF ETERNAL GLORY</h2>
                <p style="color: #888; font-size: 10px; margin-bottom: 40px; letter-spacing: 2px;">COMMEMORATING THE CHAMPIONS OF THE GREAT BURN</p>
                
                <div style="margin-bottom: 40px;">
                    <table style="width: 100%; border-collapse: collapse;">
                        <thead>
                            <tr style="color: #888; border-bottom: 2px solid #333; font-size: 10px;">
                                <th style="padding: 15px; text-align: left;">WEEK ENDING</th>
                                <th style="padding: 15px; text-align: left;">CHAMPION CLAN</th>
                                <th style="padding: 15px; text-align: center;">RUNNER UP</th>
                                <th style="padding: 15px; text-align: right;">TOTAL SPORES BURNED</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${hallOfFame.length > 0 ? hallOfFame.map((entry, index) => {
                                const winnerColor = this.getClanColor(entry.winner);
                                const runnerColor = this.getClanColor(entry.runnerUp);
                                return `
                                    <tr style="border-bottom: 1px solid #222; transition: background 0.3s; cursor: default;" 
                                        onmouseover="this.style.background='rgba(255,170,0,0.05)'" 
                                        onmouseout="this.style.background='transparent'">
                                        <td style="padding: 20px 15px; text-align: left; font-size: 10px; color: #aaa;">${entry.weekEnding}</td>
                                        <td style="padding: 20px 15px; text-align: left; font-size: 12px; color: ${winnerColor}; font-weight: bold;">
                                            ${index === 0 ? '👑 ' : ''}${entry.winner.toUpperCase()}
                                        </td>
                                        <td style="padding: 20px 15px; text-align: center; font-size: 10px; color: ${runnerColor};">
                                            ${entry.runnerUp !== 'none' ? entry.runnerUp.toUpperCase() : '-'}
                                        </td>
                                        <td style="padding: 20px 15px; text-align: right; font-size: 12px; color: #39FF14;">
                                            ${entry.winnerBurn.toLocaleString()} 🔥
                                        </td>
                                    </tr>
                                `;
                            }).join('') : `
                                <tr>
                                    <td colspan="4" style="padding: 50px; color: #444; font-size: 12px; text-align: center;">
                                        NO HISTORICAL DATA RECORDED YET.<br>
                                        THE FIRST RESTORATION CYCLE IS STILL UNDERWAY.
                                    </td>
                                </tr>
                            `}
                        </tbody>
                    </table>
                </div>

                <div style="background: rgba(255,170,0,0.1); border: 1px dashed #ffaa00; padding: 20px; margin-bottom: 40px; border-radius: 10px;">
                    <p style="color: #ffaa00; font-size: 9px; line-height: 1.8;">
                        Weekly winners receive the "Champion's Gourd" and 100 $KINGMYCO distributed on-chain.<br>
                        Resets occur every Sunday at 8 PM CST.
                    </p>
                </div>
                
                <div style="display: flex; justify-content: center; gap: 20px;">
                    <button id="hall-back-button" style="padding: 15px 40px; background: #ffaa00; border: none; color: black; font-size: 12px; cursor: pointer; font-family: inherit;">BACK TO MENU</button>
                    <button id="hall-leaderboard-button" style="padding: 15px 40px; background: #00ffff; border: none; color: black; font-size: 12px; cursor: pointer; font-family: inherit;">LIVE STANDINGS</button>
                    <button id="hall-citadel-button" style="padding: 15px 40px; background: #ff0055; border: none; color: white; font-size: 12px; cursor: pointer; font-family: inherit;">CITADEL TIMES</button>
                </div>
            </div>
        `;
        
        document.getElementById('hall-back-button').addEventListener('click', () => this.setupStartScreen());
        document.getElementById('hall-leaderboard-button').addEventListener('click', () => this.showLeaderboard());
        document.getElementById('hall-citadel-button').addEventListener('click', () => this.showThronecapLeaderboard());
    }

    showThronecapLeaderboard() {
        const rankings = this.leaderboard.getThronecapRankings();
        
        this.uiOverlay.innerHTML = `
            <div style="pointer-events: auto; display: flex; flex-direction: column; align-items: center; width: 100%; height: 100%; background: rgba(5,0,10,0.95); padding: 60px; overflow-y: auto;">
                <h2 class="neon-text" style="color: #ff0055; font-size: 42px; margin-bottom: 10px;">CITADEL SPEEDRUNS</h2>
                <p style="color: #ff0055; font-size: 12px; margin-bottom: 40px; letter-spacing: 2px;">THE FASTEST RESTORERS IN THE MYCOVERSE</p>
                
                <div style="width: 100%; max-width: 900px; background: rgba(0,0,0,0.4); border: 2px solid #ff0055; border-radius: 20px; padding: 40px; margin-bottom: 40px; box-shadow: 0 0 50px rgba(255,0,85,0.2);">
                    <table style="width: 100%; border-collapse: collapse; font-family: inherit;">
                        <thead>
                            <tr style="border-bottom: 3px solid #ff0055; color: #ff0055; font-size: 14px;">
                                <th style="padding: 20px; text-align: left;">RANK / NAME</th>
                                <th style="padding: 20px; text-align: center;">CLAN</th>
                                <th style="padding: 20px; text-align: center;">DATE</th>
                                <th style="padding: 20px; text-align: center;">SHARE</th>
                                <th style="padding: 20px; text-align: right;">TIME</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${rankings.length > 0 ? rankings.map((entry, index) => {
                                const clanColor = this.getClanColor(entry.clan);
                                return `
                                    <tr style="border-bottom: 1px solid #222; transition: background 0.3s;" 
                                        onmouseover="this.style.background='rgba(255,0,85,0.05)'" 
                                        onmouseout="this.style.background='transparent'">
                                        <td style="padding: 20px; text-align: left; font-size: 12px; color: #fff;">
                                            ${index === 0 ? '🏆 ' : (index === 1 ? '🥈 ' : (index === 2 ? '🥉 ' : `${index + 1}. `))}
                                            ${entry.name}
                                        </td>
                                        <td style="padding: 20px; text-align: center; font-size: 12px; color: ${clanColor}; font-weight: bold;">
                                            ${entry.clan.toUpperCase()}
                                        </td>
                                        <td style="padding: 20px; text-align: center; font-size: 10px; color: #888;">
                                            ${new Date(entry.date).toLocaleDateString()}
                                        </td>
                                        <td style="padding: 20px; text-align: center;">
                                            <button onclick="window.game.shareCertificate(${index})" style="background: #39FF14; border: none; padding: 5px 10px; font-family: inherit; font-size: 8px; cursor: pointer; color: black; border-radius: 4px;">CERT</button>
                                        </td>
                                        <td style="padding: 20px; text-align: right; font-size: 14px; color: #39FF14; font-weight: bold;">
                                            ${entry.time.toFixed(2)}s
                                        </td>
                                    </tr>
                                `;
                            }).join('') : `
                                <tr>
                                    <td colspan="5" style="padding: 50px; color: #444; font-size: 12px; text-align: center;">
                                        NO SPEEDRUN DATA RECORDED YET.
                                    </td>
                                </tr>
                            `}
                        </tbody>
                    </table>
                </div>
                
                <div style="display: flex; justify-content: center; gap: 20px;">
                    <button id="citadel-back-button" style="padding: 15px 40px; background: #ff0055; border: none; color: white; font-size: 12px; cursor: pointer; font-family: inherit;">BACK TO HALL</button>
                    <button id="citadel-menu-button" style="padding: 15px 40px; background: #333; border: none; color: white; font-size: 12px; cursor: pointer; font-family: inherit;">MAIN MENU</button>
                </div>
            </div>
        `;
        
        document.getElementById('citadel-back-button').addEventListener('click', () => this.showHallOfFame());
        document.getElementById('citadel-menu-button').addEventListener('click', () => this.setupStartScreen());
    }

    shareCertificate(index) {
        const rankings = this.leaderboard.getThronecapRankings();
        const entry = rankings[index];
        if (!entry) return;

        const clanColor = this.getClanColor(entry.clan);
        const rankText = index === 0 ? 'GRAND RESTORER' : (index < 3 ? 'ELITE RESTORER' : 'CITADEL VETERAN');
        
        const certOverlay = document.createElement('div');
        certOverlay.style.position = 'fixed';
        certOverlay.style.top = '0';
        certOverlay.style.left = '0';
        certOverlay.style.width = '100%';
        certOverlay.style.height = '100%';
        certOverlay.style.backgroundColor = 'rgba(0,0,0,0.9)';
        certOverlay.style.zIndex = '20000';
        certOverlay.style.display = 'flex';
        certOverlay.style.flexDirection = 'column';
        certOverlay.style.justifyContent = 'center';
        certOverlay.style.alignItems = 'center';
        certOverlay.style.pointerEvents = 'auto';
        certOverlay.style.fontFamily = "'Press Start 2P', cursive";
        
        certOverlay.innerHTML = `
            <div id="capture-area" style="background: #050505; border: 10px double ${clanColor}; padding: 60px; width: 800px; text-align: center; position: relative; box-shadow: 0 0 50px ${clanColor};">
                <div style="border: 2px solid ${clanColor}; padding: 40px;">
                    <h1 style="color: ${clanColor}; font-size: 32px; margin-bottom: 20px;">CERTIFICATE OF RESTORATION</h1>
                    <p style="color: #fff; font-size: 10px; margin-bottom: 40px; letter-spacing: 2px;">BY DECREE OF THE FUNGAL COURT</p>
                    
                    <p style="color: #888; font-size: 12px; margin-bottom: 10px;">THIS CERTIFIES THAT</p>
                    <h2 style="color: #fff; font-size: 24px; margin-bottom: 30px; text-decoration: underline;">${entry.name.toUpperCase()}</h2>
                    
                    <p style="color: #888; font-size: 12px; margin-bottom: 10px;">HAS SUCCESSFULLY RESTORED THE NETWORK HEART IN</p>
                    <h3 style="color: #39FF14; font-size: 36px; margin-bottom: 40px;">${entry.time.toFixed(2)} SECONDS</h3>
                    
                    <div style="display: flex; justify-content: space-between; align-items: flex-end; margin-top: 60px;">
                        <div style="text-align: left;">
                            <p style="color: ${clanColor}; font-size: 10px; margin-bottom: 5px;">RANK: ${rankText}</p>
                            <p style="color: #444; font-size: 8px;">CLAN: ${entry.clan.toUpperCase()}</p>
                        </div>
                        <div style="text-align: right;">
                            <p style="color: #444; font-size: 8px;">DATE: ${new Date(entry.date).toLocaleDateString()}</p>
                            <p style="color: #333; font-size: 6px; margin-top: 5px;">VERIFIED BY SOLANA MAINNET BRIDGE</p>
                        </div>
                    </div>
                </div>
                
                <!-- Corner Decorations -->
                <div style="position: absolute; top: 20px; left: 20px; width: 40px; height: 40px; border-top: 4px solid ${clanColor}; border-left: 4px solid ${clanColor};"></div>
                <div style="position: absolute; top: 20px; right: 20px; width: 40px; height: 40px; border-top: 4px solid ${clanColor}; border-right: 4px solid ${clanColor};"></div>
                <div style="position: absolute; bottom: 20px; left: 20px; width: 40px; height: 40px; border-bottom: 4px solid ${clanColor}; border-left: 4px solid ${clanColor};"></div>
                <div style="position: absolute; bottom: 20px; right: 20px; width: 40px; height: 40px; border-bottom: 4px solid ${clanColor}; border-right: 4px solid ${clanColor};"></div>
            </div>
            
            <div style="margin-top: 40px; display: flex; gap: 20px;">
                <button id="copy-cert" style="padding: 15px 30px; background: #39FF14; border: none; color: black; font-family: inherit; font-size: 12px; cursor: pointer;">COPY TEXT FOR SHARE</button>
                <button id="close-cert" style="padding: 15px 30px; background: #ff0055; border: none; color: white; font-family: inherit; font-size: 12px; cursor: pointer;">CLOSE</button>
            </div>
        `;
        
        document.body.appendChild(certOverlay);
        
        document.getElementById('close-cert').onclick = () => certOverlay.remove();
        document.getElementById('copy-cert').onclick = () => {
            const shareText = `🍄 I restored the Solana Network in Myco Quest! 🍄\n\nRank: ${rankText}\nTime: ${entry.time.toFixed(2)}s\nClan: ${entry.clan.toUpperCase()}\n\nPlay now: ${window.location.href}`;
            navigator.clipboard.writeText(shareText).then(() => {
                const btn = document.getElementById('copy-cert');
                const oldText = btn.innerText;
                btn.innerText = "COPIED TO CLIPBOARD!";
                setTimeout(() => btn.innerText = oldText, 2000);
            });
        };
    }

    getAccessoriesContent() {
        const p = this.progression.data;
        const clanColor = this.getClanColor(this.selectedClan);
        const owned = p.accessories || [];
        const equipped = p.equippedAccessories || { cape: null, crown: null };

        return `
            <div style="padding: 20px;">
                <h3 style="color: ${clanColor}; font-size: 12px; margin-bottom: 20px;">ROYAL TREASURY: CLOAKS & CROWNS</h3>
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px; max-height: 350px; overflow-y: auto;">
                    ${CONFIG.ACCESSORIES.map(acc => {
                        const isOwned = owned.includes(acc.id);
                        const isEquipped = equipped.cape === acc.id || equipped.crown === acc.id;
                        
                        return `
                            <div style="background: #111; border: 2px solid ${isOwned ? acc.color : '#333'}; padding: 15px; display: flex; flex-direction: column; gap: 10px;">
                                <div style="display: flex; justify-content: space-between; align-items: start;">
                                    <span style="color: ${acc.color}; font-size: 10px;">${acc.name.toUpperCase()}</span>
                                    <span style="color: #666; font-size: 8px;">${acc.type}</span>
                                </div>
                                <p style="font-size: 7px; color: #888; flex-grow: 1;">${acc.desc}</p>
                                ${isOwned ? `
                                    <button onclick="window.game.equipAccessory('${acc.id}')" style="
                                        width: 100%; 
                                        padding: 8px; 
                                        background: ${isEquipped ? acc.color : '#222'}; 
                                        color: ${isEquipped ? 'black' : 'white'}; 
                                        border: 1px solid ${acc.color}; 
                                        font-family: inherit; 
                                        font-size: 8px; 
                                        cursor: pointer;
                                    ">
                                        ${isEquipped ? 'EQUIPPED' : 'EQUIP'}
                                    </button>
                                ` : `
                                    <button onclick="window.game.purchaseAccessory('${acc.id}')" style="
                                        width: 100%; 
                                        padding: 8px; 
                                        background: ${p.goldenSpores >= acc.costGold ? '#ffff00' : '#333'}; 
                                        color: black; 
                                        border: none; 
                                        font-family: inherit; 
                                        font-size: 8px; 
                                        cursor: pointer;
                                    ">
                                        BUY (${acc.costGold} GOLD)
                                    </button>
                                `}
                            </div>
                        `;
                    }).join('')}
                </div>
            </div>
        `;
    }

    purchaseAccessory(id) {
        const acc = CONFIG.ACCESSORIES.find(a => a.id === id);
        const p = this.progression.data;
        if (!acc || p.accessories.includes(id)) return;

        if (p.goldenSpores >= acc.costGold) {
            p.goldenSpores -= acc.costGold;
            p.accessories.push(id);
            this.progression.save();
            this.showGlobalNotification(`PURCHASED ${acc.name.toUpperCase()}!`, acc.color);
            this.uiSynth.triggerAttackRelease("C5", "8n");
            this.showInventoryMenu(); // Refresh
            this.updateHud();
        } else {
            this.showGlobalNotification("NOT ENOUGH GOLDEN SPORES", "#ff0000");
            this.uiSynth.triggerAttackRelease("C3", "8n");
        }
    }

    equipAccessory(id) {
        const acc = CONFIG.ACCESSORIES.find(a => a.id === id);
        const p = this.progression.data;
        if (!acc || !p.accessories.includes(id)) return;

        const type = acc.type === 'CAPE' ? 'cape' : 'crown';
        
        // Toggle off if already equipped
        if (p.equippedAccessories[type] === id) {
            p.equippedAccessories[type] = null;
        } else {
            p.equippedAccessories[type] = id;
        }

        this.progression.save();
        this.syncPlayerStats();
        this.showInventoryMenu(); // Refresh
        this.uiSynth.triggerAttackRelease("E4", "16n");
    }

    getClanColor(clanId) {
        const colors = { 'myco': '#ff0000', 'rougarou': '#aaaaaa', 'tegbot': '#00ffff', 'shiba': '#ffff00', 'brood': '#ffaa00' };
        return colors[clanId] || '#ffffff';
    }

    async startEpicStory() {
        this.gameState = 'PROLOGUE';
        await TONE.start();
        this.playEpicMusic('START');

        this.uiOverlay.innerHTML = `
            <div class="scrolling-story">
                <h2 class="neon-text" style="font-size: 32px; margin-bottom: 50px;">A TALE OF TWO NETWORKS</h2>
                <p style="line-height: 2.5; font-size: 16px; margin-bottom: 100px; padding: 0 20px;">
                    In an era where the Solana network hummed in perfect harmony,<br>
                    the Mycoverse flourished under the light of pure data.<br><br>
                    But the Rot came—a corruptive darkness from the deep void,<br>
                    shattering the sacred crown of King Myco.<br><br>
                    The shards were scattered across the floating islands,<br>
                    and the neon pulse of our world began to fade.<br><br>
                    You, King Myco, must rise from the fungal depths.<br>
                    Scale the heights, reclaim the golden spores,<br>
                    and restore the stability of the Solana network.<br><br>
                    Your journey begins in the Neon Grove...
                </p>
                <button id="skip-story" style="pointer-events: auto; padding: 15px 30px; background: white; border: none; color: black;">SKIP TALE</button>
            </div>
        `;

        document.getElementById('skip-story').addEventListener('click', () => this.setupClanSelection());
        this.storyTimeout = setTimeout(() => { if (this.gameState === 'PROLOGUE') this.setupClanSelection(); }, 30000);
    }

    setupClanSelection() {
        clearTimeout(this.storyTimeout);
        
        // If a clan is already chosen, skip selection
        if (this.progression.data.clanChosen) {
            this.selectedClan = this.progression.data.clanChosen;
            this.player.setClan(this.selectedClan);
            this.startGameplay();
            return;
        }

        this.gameState = 'CLAN_SELECT';

        // V1.9.32 — Mobile-aware clan selection (touch-native, no inline handlers).
        // V1.9.34 — Mobile gets a swipeable CAROUSEL instead of a wrapping grid.
        // Why: even at 150×280 the 5 cards tiled into 2 rows that crowded the
        // viewport and forced thumb-strain to reach the bottom row. A one-card
        // carousel with horizontal swipe + dots is the standard mobile pattern
        // and lets each clan get a full-screen-width hero moment. Desktop keeps
        // the original tile grid because the wide layout shows everything at
        // once and mouse users don't need pagination.
        const isMobile = !!this.isMobile;
        const padOuter = isMobile ? 16 : 40;
        const gridGap  = isMobile ? 10 : 20;
        const headSz   = isMobile ? 22 : 32;

        const clanEntries = Object.entries(this.player.clanColors);

        // ----- Build the body markup. Mobile = carousel, desktop = grid. -----
        const buildCard = (id, cfg, opts) => {
            const color = this.getClanColor(id);
            const { cardW, cardH, bannerH, avatarSz, titleSz, descSz, padInner, marginTop, transitionExtras } = opts;
            // On mobile the card itself has no transition for transform because
            // the carousel track owns translateX. We still allow border/shadow
            // transitions for the press feedback.
            return `
                <div class="clan-card" data-clan="${id}"
                     style="position: relative; flex: 0 0 auto; width: ${cardW}; height: ${cardH}px; background: #0a0a0a; border: 2px solid #333; cursor: pointer; transition: border-color 0.18s ease, box-shadow 0.18s ease${transitionExtras}; display: flex; flex-direction: column; overflow: hidden; border-radius: 10px; touch-action: manipulation; -webkit-tap-highlight-color: transparent; user-select: none; -webkit-user-select: none; box-sizing: border-box;">

                    <div style="position: absolute; top: 0; left: 0; width: 100%; height: ${bannerH}; background: url(${cfg.banner}) center/cover; opacity: 0.6; z-index: 1; pointer-events: none;"></div>
                    <div style="position: absolute; top: 0; left: 0; width: 100%; height: ${bannerH}; background: linear-gradient(transparent, #0a0a0a); z-index: 2; pointer-events: none;"></div>

                    <div style="position: relative; z-index: 3; margin-top: ${marginTop}px; padding: ${padInner}px; text-align: center; flex: 1; display: flex; flex-direction: column; justify-content: space-between; pointer-events: none;">
                        <div>
                            <img src="${cfg.avatar}" style="width: ${avatarSz}px; height: ${avatarSz}px; border: 3px solid ${color}; border-radius: 50%; background: #000; margin-bottom: ${isMobile ? 10 : 15}px; box-shadow: 0 0 10px ${color};">
                            <h3 style="color: ${color}; margin: 0 0 ${isMobile ? 8 : 10}px 0; font-size: ${titleSz}px; letter-spacing: 1px;">${id.toUpperCase()}</h3>
                            <p style="font-size: ${descSz}px; color: #ccc; line-height: 1.4; margin-bottom: ${isMobile ? 10 : 15}px;">${cfg.powerDesc}</p>
                        </div>
                        <div style="background: rgba(0,0,0,0.5); padding: ${isMobile ? 6 : 8}px; border: 1px solid ${color}; border-radius: 4px;">
                            <p style="font-size: ${isMobile ? 8 : 8}px; color: ${color}; margin: 0; font-weight: bold;">POWER: ${cfg.powerName.toUpperCase()}</p>
                        </div>
                    </div>
                </div>
            `;
        };

        let bodyHTML;
        if (isMobile) {
            // Carousel: a viewport (overflow: hidden) wraps a track that we
            // translate horizontally. Each card is 100% of the viewport width
            // minus a peek margin so the next card's edge hints at swipeability.
            // We don't render dots in HTML; they're injected after layout so
            // their count matches the dynamic clan list and their dataset wires
            // straight to the page index.
            const cardsHTML = clanEntries.map(([id, cfg]) => buildCard(id, cfg, {
                cardW: '100%',           // each card fills a track-cell that's sized in JS
                cardH: 360,
                bannerH: '42%',
                avatarSz: 64,
                titleSz: 15,
                descSz: 10,
                padInner: 14,
                marginTop: 110,
                transitionExtras: ''
            })).join('');

            bodyHTML = `
                <div id="clan-carousel-frame" style="width: 100%; max-width: 480px; margin: 0 auto; position: relative;">
                    <div id="clan-carousel-viewport"
                         style="width: 100%; overflow: hidden; border-radius: 12px; touch-action: pan-y; -webkit-tap-highlight-color: transparent;">
                        <div id="clan-carousel-track"
                             style="display: flex; align-items: stretch; gap: 0; will-change: transform; transition: transform 320ms cubic-bezier(0.22, 0.61, 0.36, 1);">
                            ${cardsHTML}
                        </div>
                    </div>

                    <button id="clan-prev" aria-label="Previous clan"
                            style="position: absolute; left: -6px; top: 50%; transform: translateY(-50%); width: 40px; height: 40px; border-radius: 50%; background: rgba(0,0,0,0.6); border: 1px solid #39FF14; color: #39FF14; font-size: 18px; font-family: inherit; cursor: pointer; touch-action: manipulation; -webkit-tap-highlight-color: transparent; z-index: 4;">‹</button>
                    <button id="clan-next" aria-label="Next clan"
                            style="position: absolute; right: -6px; top: 50%; transform: translateY(-50%); width: 40px; height: 40px; border-radius: 50%; background: rgba(0,0,0,0.6); border: 1px solid #39FF14; color: #39FF14; font-size: 18px; font-family: inherit; cursor: pointer; touch-action: manipulation; -webkit-tap-highlight-color: transparent; z-index: 4;">›</button>

                    <div id="clan-dots" style="display: flex; justify-content: center; gap: 10px; margin-top: 18px;">
                        ${clanEntries.map(([id], idx) => `
                            <button class="clan-dot" data-idx="${idx}" aria-label="Clan ${id}"
                                    style="width: 12px; height: 12px; border-radius: 50%; background: #333; border: 1px solid #666; padding: 0; cursor: pointer; touch-action: manipulation; -webkit-tap-highlight-color: transparent; transition: background 0.2s, border-color 0.2s, transform 0.2s;"></button>
                        `).join('')}
                    </div>

                    <p id="clan-tap-hint" style="text-align: center; color: #aaa; font-size: 8px; margin: 14px 0 0 0; letter-spacing: 1px;">SWIPE • TAP CARD TO PLEDGE</p>
                </div>
            `;
        } else {
            // Desktop grid — unchanged behavior, all cards visible.
            const cardsHTML = clanEntries.map(([id, cfg]) => buildCard(id, cfg, {
                cardW: '220px',
                cardH: 380,
                bannerH: '50%',
                avatarSz: 70,
                titleSz: 16,
                descSz: 9,
                padInner: 15,
                marginTop: 140,
                transitionExtras: ', transform 0.18s ease'
            })).join('');

            bodyHTML = `
                <div id="clan-card-grid" style="display: flex; flex-wrap: wrap; justify-content: center; gap: ${gridGap}px; width: 100%; max-width: 1200px; padding: 10px;">
                    ${cardsHTML}
                </div>
            `;
        }

        this.uiOverlay.innerHTML = `
            <div id="clan-select-root" style="pointer-events: auto; display: flex; flex-direction: column; align-items: center; width: 100%; min-height: 100%; background: rgba(0,0,0,0.85); padding: ${padOuter}px ${padOuter}px 80px ${padOuter}px; overflow-y: auto; -webkit-overflow-scrolling: touch; box-sizing: border-box;">
                <h2 class="neon-text" style="margin-bottom: 10px; font-size: ${headSz}px; color: #39FF14; text-align: center;">CHOOSE YOUR CLAN</h2>
                <p style="color: #ff0000; font-size: ${isMobile ? 9 : 10}px; margin-bottom: ${isMobile ? 16 : 30}px; letter-spacing: 1px; text-align: center; padding: 0 8px;">⚠️ WARNING: YOUR CLAN CHOICE IS PERMANENT ⚠️</p>

                ${bodyHTML}

                <button id="clan-back-btn" style="margin-top: ${isMobile ? 24 : 40}px; padding: ${isMobile ? 14 : 10}px 30px; background: transparent; border: 1px solid #666; color: #aaa; font-family: inherit; font-size: ${isMobile ? 11 : 10}px; cursor: pointer; touch-action: manipulation; -webkit-tap-highlight-color: transparent; min-height: 44px; min-width: 120px;">GO BACK</button>
            </div>
        `;

        // ----- Per-card press feedback (mouse + touch) + click → pledge. -----
        // applyHover is the visual "this card is hot" paint. Used by hover,
        // touch-press, and the carousel's "active page" highlight.
        const cards = this.uiOverlay.querySelectorAll('.clan-card');
        const applyHover = (card, on) => {
            const color = this.getClanColor(card.dataset.clan);
            card.style.borderColor = on ? color : '#333';
            card.style.boxShadow   = on ? `0 0 20px ${color}` : 'none';
            if (!isMobile) {
                // Desktop keeps the lift effect. Mobile carousel uses scale at
                // the track level so we don't double-translate.
                card.style.transform = on ? 'translateY(-10px)' : 'translateY(0)';
            }
        };

        // ----- Track tap-vs-swipe so a swipe doesn't trigger pledge. -----
        // dragMoved is set during a horizontal drag past a small threshold and
        // is checked at click time on mobile.
        let dragMoved = false;

        cards.forEach(card => {
            const clanId = card.dataset.clan;
            card.addEventListener('mouseenter', () => applyHover(card, true));
            card.addEventListener('mouseleave', () => applyHover(card, false));

            card.addEventListener('touchstart', () => {
                if (!isMobile) applyHover(card, true);
                if (this.triggerHaptic) this.triggerHaptic('tap');
            }, { passive: true });
            const clearTouch = () => { if (!isMobile) applyHover(card, false); };
            card.addEventListener('touchend',    clearTouch, { passive: true });
            card.addEventListener('touchcancel', clearTouch, { passive: true });

            card.addEventListener('click', (e) => {
                // Swipe-cancels-tap: if the carousel saw a real horizontal
                // drag during this gesture, swallow the click that the browser
                // synthesizes when the finger lifts.
                if (dragMoved) {
                    dragMoved = false;
                    return;
                }
                e.preventDefault();
                this.confirmClanSelection(clanId);
            });
        });

        // ----- Mobile carousel logic. -----
        if (isMobile) {
            const frame    = this.uiOverlay.querySelector('#clan-carousel-frame');
            const viewport = this.uiOverlay.querySelector('#clan-carousel-viewport');
            const track    = this.uiOverlay.querySelector('#clan-carousel-track');
            const dots     = Array.from(this.uiOverlay.querySelectorAll('.clan-dot'));
            const prevBtn  = this.uiOverlay.querySelector('#clan-prev');
            const nextBtn  = this.uiOverlay.querySelector('#clan-next');
            const cardEls  = Array.from(track.querySelectorAll('.clan-card'));

            // ---- Layout: size each card to the viewport width, then place ----
            // them in the track. We re-measure on resize so an orientation
            // change or URL-bar collapse re-snaps the track to the active page.
            let cellWidth = 0;
            let pageIndex = 0;
            let trackOffset = 0; // current translateX (negative when paged)

            const measure = () => {
                cellWidth = viewport.getBoundingClientRect().width;
                cardEls.forEach(c => {
                    c.style.width = cellWidth + 'px';
                });
                snapTo(pageIndex, /*instant=*/true);
            };

            const setActivePage = (idx) => {
                // Update dot styles + active-card glow without re-rendering.
                dots.forEach((d, i) => {
                    const isOn = i === idx;
                    const clanId = cardEls[i].dataset.clan;
                    const color = this.getClanColor(clanId);
                    d.style.background   = isOn ? color : '#333';
                    d.style.borderColor  = isOn ? color : '#666';
                    d.style.transform    = isOn ? 'scale(1.25)' : 'scale(1.0)';
                    d.style.boxShadow    = isOn ? `0 0 8px ${color}` : 'none';
                });
                cardEls.forEach((c, i) => applyHover(c, i === idx));
            };

            const snapTo = (idx, instant = false) => {
                const clamped = Math.max(0, Math.min(cardEls.length - 1, idx));
                const changed = clamped !== pageIndex;
                pageIndex = clamped;
                trackOffset = -clamped * cellWidth;
                track.style.transition = instant
                    ? 'none'
                    : 'transform 320ms cubic-bezier(0.22, 0.61, 0.36, 1)';
                track.style.transform = `translate3d(${trackOffset}px, 0, 0)`;
                if (instant) {
                    // Force a reflow so the next non-instant call animates.
                    // eslint-disable-next-line no-unused-expressions
                    track.offsetHeight;
                    track.style.transition = 'transform 320ms cubic-bezier(0.22, 0.61, 0.36, 1)';
                }
                setActivePage(clamped);
                if (changed && this.triggerHaptic) this.triggerHaptic('tap');
            };

            // ---- Touch tracking on the viewport. ----
            // We use a small "deadzone" before claiming the gesture so vertical
            // scroll of the overlay still works if the user is really scrolling.
            const DEADZONE = 8;        // px before we consider it a horizontal drag
            const COMMIT_PX = 60;      // distance past which we page on lift
            const COMMIT_VEL = 0.4;    // px/ms — flick speed that pages regardless of distance
            let touchId = null;
            let startX = 0, startY = 0;
            let lastX = 0, lastT = 0;
            let velocity = 0;          // px/ms, signed
            let claimed = false;       // true once we know this is a horizontal swipe
            let dragStartOffset = 0;

            const onStart = (e) => {
                if (touchId !== null) return;
                const t = e.changedTouches[0];
                touchId = t.identifier;
                startX = lastX = t.clientX;
                startY = t.clientY;
                lastT = performance.now();
                velocity = 0;
                claimed = false;
                dragMoved = false;
                dragStartOffset = trackOffset;
                // Kill any in-flight snap animation so the drag feels glued.
                track.style.transition = 'none';
            };

            const findTouch = (e) => {
                for (const t of e.changedTouches) {
                    if (t.identifier === touchId) return t;
                }
                return null;
            };

            const onMove = (e) => {
                const t = findTouch(e);
                if (!t) return;
                const dx = t.clientX - startX;
                const dy = t.clientY - startY;

                if (!claimed) {
                    // Decide: is this a horizontal swipe or a vertical scroll?
                    if (Math.abs(dx) < DEADZONE && Math.abs(dy) < DEADZONE) return;
                    if (Math.abs(dy) > Math.abs(dx)) {
                        // Vertical intent — let the page scroll, abandon swipe.
                        touchId = null;
                        return;
                    }
                    claimed = true;
                    dragMoved = true;
                }

                // Active horizontal swipe — block native scroll for this gesture
                // and follow the finger. We rubber-band at the ends so the
                // boundary feels physical instead of dead.
                e.preventDefault();
                let next = dragStartOffset + dx;
                const minOffset = -(cardEls.length - 1) * cellWidth;
                const maxOffset = 0;
                if (next > maxOffset) next = maxOffset + (next - maxOffset) * 0.35;
                if (next < minOffset) next = minOffset + (next - minOffset) * 0.35;
                trackOffset = next;
                track.style.transform = `translate3d(${next}px, 0, 0)`;

                // Velocity over the most recent move tick.
                const now = performance.now();
                const dt = Math.max(1, now - lastT);
                velocity = (t.clientX - lastX) / dt;
                lastX = t.clientX;
                lastT = now;
            };

            const onEnd = (e) => {
                const t = findTouch(e);
                if (!t) return;
                touchId = null;
                if (!claimed) {
                    // Pure tap — let the card's click handler fire (dragMoved
                    // stays false so the pledge modal opens).
                    return;
                }
                // Decide where to snap based on distance + velocity.
                const dx = t.clientX - startX;
                let target = pageIndex;
                if (Math.abs(velocity) > COMMIT_VEL) {
                    target += (velocity < 0) ? 1 : -1;
                } else if (Math.abs(dx) > COMMIT_PX) {
                    target += (dx < 0) ? 1 : -1;
                }
                snapTo(target);
            };

            viewport.addEventListener('touchstart',  onStart, { passive: true });
            viewport.addEventListener('touchmove',   onMove,  { passive: false });
            viewport.addEventListener('touchend',    onEnd,   { passive: true });
            viewport.addEventListener('touchcancel', onEnd,   { passive: true });

            // ---- Arrow buttons + dots (works with mouse, keyboard, and touch). ----
            prevBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                snapTo(pageIndex - 1);
            });
            nextBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                snapTo(pageIndex + 1);
            });
            dots.forEach(dot => {
                dot.addEventListener('click', (e) => {
                    e.stopPropagation();
                    snapTo(parseInt(dot.dataset.idx, 10));
                });
            });

            // ---- Keyboard arrows for testing/accessibility. ----
            const onKey = (e) => {
                if (this.gameState !== 'CLAN_SELECT') return;
                if (e.key === 'ArrowLeft')  { snapTo(pageIndex - 1); e.preventDefault(); }
                if (e.key === 'ArrowRight') { snapTo(pageIndex + 1); e.preventDefault(); }
                if (e.key === 'Enter') {
                    const clanId = cardEls[pageIndex].dataset.clan;
                    this.confirmClanSelection(clanId);
                }
            };
            window.addEventListener('keydown', onKey);
            // Tear down the listener when we leave the screen — easiest hook
            // is the back button + confirmClanSelection (which both navigate
            // away). We stash a remover on the root so the next innerHTML
            // overwrite implicitly drops it.
            this._clanCarouselCleanup = () => window.removeEventListener('keydown', onKey);

            // ---- Re-measure on resize / orientation. ----
            const onResize = () => measure();
            window.addEventListener('resize', onResize);
            const oldCleanup = this._clanCarouselCleanup;
            this._clanCarouselCleanup = () => {
                oldCleanup();
                window.removeEventListener('resize', onResize);
            };

            // First layout pass after the DOM settles (waits one frame so the
            // viewport has its real measured width).
            requestAnimationFrame(measure);
        } else {
            // Desktop has no carousel — make sure any prior cleanup is gone.
            if (this._clanCarouselCleanup) {
                this._clanCarouselCleanup();
                this._clanCarouselCleanup = null;
            }
        }

        // ----- Back button. -----
        const backBtn = document.getElementById('clan-back-btn');
        if (backBtn) {
            backBtn.addEventListener('click', () => {
                if (this.triggerHaptic) this.triggerHaptic('tap');
                if (this._clanCarouselCleanup) {
                    this._clanCarouselCleanup();
                    this._clanCarouselCleanup = null;
                }
                this.setupStartScreen();
            });
        }
    }

    // V1.9.32 — Pledge modal extracted from inline window.* so the touch path
    // is the same as the card path: real listeners, mobile sizing, haptics.
    confirmClanSelection(clan) {
        const clanName = clan.toUpperCase();
        const config = this.player.clanColors[clan];
        if (!config) return;
        const color = this.getClanColor(clan);
        const isMobile = !!this.isMobile;

        // Remove any prior pledge modal before stacking a new one.
        const prior = document.getElementById('clan-modal');
        if (prior) prior.remove();

        const modal = document.createElement('div');
        modal.id = 'clan-modal';
        modal.style.cssText = `position: absolute; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.9); display: flex; justify-content: center; align-items: center; z-index: 1000; pointer-events: auto; padding: 16px; box-sizing: border-box;`;
        modal.innerHTML = `
            <div style="background: #111; padding: ${isMobile ? 24 : 40}px; border: 4px solid ${color}; max-width: 500px; width: 100%; text-align: center; border-radius: 15px; box-shadow: 0 0 40px ${color}; box-sizing: border-box;">
                <h2 style="color: ${color}; margin-bottom: 20px; font-size: ${isMobile ? 16 : 20}px;">PLEDGE TO ${clanName}?</h2>
                <p style="color: #fff; font-size: ${isMobile ? 11 : 12}px; margin-bottom: ${isMobile ? 22 : 30}px; line-height: 1.6;">
                    "I, King Myco, swear my allegiance to the ${clanName} Clan. I will use the ${config.powerName} to restore the Solana network and defend our fungal sovereignty."
                </p>
                <div style="display: flex; gap: ${isMobile ? 12 : 20}px; justify-content: center; flex-wrap: wrap;">
                    <button id="pledge-decline" style="padding: 15px 24px; background: #333; color: white; border: none; font-family: inherit; cursor: pointer; min-height: 48px; min-width: 120px; touch-action: manipulation; -webkit-tap-highlight-color: transparent; font-size: ${isMobile ? 11 : 12}px;">DECLINE</button>
                    <button id="pledge-accept" style="padding: 15px 24px; background: ${color}; color: black; border: none; font-family: inherit; cursor: pointer; font-weight: bold; min-height: 48px; min-width: 120px; touch-action: manipulation; -webkit-tap-highlight-color: transparent; font-size: ${isMobile ? 11 : 12}px;">ACCEPT PLEDGE</button>
                </div>
            </div>
        `;
        this.uiOverlay.appendChild(modal);

        const decline = modal.querySelector('#pledge-decline');
        const accept  = modal.querySelector('#pledge-accept');

        decline.addEventListener('click', () => {
            if (this.triggerHaptic) this.triggerHaptic('tap');
            modal.remove();
        });

        accept.addEventListener('click', () => {
            if (this.triggerHaptic) this.triggerHaptic('medium');
            this.selectedClan = clan;
            this.progression.data.clanChosen = clan;
            this.progression.save();
            this.player.setClan(clan);
            modal.remove();
            // V1.9.34 — Tear down the carousel's keydown + resize listeners
            // before gameplay takes over the keyboard.
            if (this._clanCarouselCleanup) {
                this._clanCarouselCleanup();
                this._clanCarouselCleanup = null;
            }
            this.startGameplay();

            // Achievement sound (Tone is gated behind user gesture which the
            // button tap satisfies, so this is safe).
            try {
                const synth = new TONE.PolySynth().toDestination();
                synth.triggerAttackRelease(["C4", "E4", "G4", "B4", "C5"], "1n");
            } catch (_) { /* audio may not be ready yet — silent */ }
        });
    }

    // V1.9.18 - DAILY ROT SYSTEM ===========================================
    // The current region is rottable only if (a) it has rot props, (b) it's been
    // conquered, and (c) it isn't the hub/safe zone. The hub is always clean.
    isRottableRegion() {
        if (!this.currentRegion) return false;
        if (this.currentRegion.isSafeZone) return false;
        if (this.currentRegion.id === 'region8' || this.currentRegion.id === 'mushroomKingdom') return false;
        return this.progression.isConquered(this.currentRegion.id);
    }

    // Push the saved region-rot value down to per-mushroom rot with a little
    // variance so the blight reads as patchy rather than uniform.
    syncRegionRotToVisuals() {
        if (!this.rotProps || !this.rotProps.length) return;
        const rid = this.currentRegion && this.currentRegion.id;
        const rottable = this.isRottableRegion();
        const regionRot01 = rottable ? this.progression.getRegionRot(rid) / 100 : 0;
        this.rotProps.forEach(p => {
            // Variance ±25% so patches differ but trend matches region rot.
            const variance = 1 + (Math.random() - 0.5) * 0.5;
            p.targetRot = Math.max(0, Math.min(1, regionRot01 * variance));
            // Snap the visual close to the target on (re)load.
            p.rot = p.targetRot;
            this.applyRotVisualToProp(p);
        });
    }

    // Lerp the mushroom's color between its clean accent and a rot purple-black
    // based on its individual rot. Heavy rot droops the cap and dims the light.
    applyRotVisualToProp(p) {
        if (!p || !p.capMat) return;
        const r = Math.max(0, Math.min(1, p.rot));
        const rotColor = new THREE.Color(0x2a0033);     // deep rot purple
        const rotStem  = new THREE.Color(0x3a2a2a);     // necrotic grey-brown
        const rotEmissive = new THREE.Color(0xaa00ff);  // active rot glow

        // Cap color slides toward rot purple; spots dim toward grey.
        p.capMat.color.copy(p.cleanCap).lerp(rotColor, r);
        p.capMat.emissive.copy(new THREE.Color(p.cleanCap)).lerp(rotEmissive, r);
        p.capMat.emissiveIntensity = p.cleanEmissive + r * 1.2;
        if (p.stemMat) p.stemMat.color.copy(p.cleanStem).lerp(rotStem, r);
        if (p.spotMat) p.spotMat.color.copy(p.cleanSpot).lerp(rotColor, r * 0.8);
        // Cap droops (Z-rot) and shrinks slightly when very rotted.
        if (p.group) {
            const droop = r * 0.45;
            p.group.rotation.z = droop * Math.sin(p.group.position.x * 0.7);
            // Light fades from accent to rot purple as the mushroom dies.
            if (p.light) {
                p.light.color.copy(p.cleanCap).lerp(rotEmissive, r);
                p.light.intensity = 0.8 * (1 - r * 0.7);
            }
        }
        // High rot mushrooms cough out a tiny spore puff cloud.
        if (r > 0.5 && !p.puffCloud) {
            const puffGeo = new THREE.SphereGeometry(0.5, 8, 6);
            const puffMat = new THREE.MeshBasicMaterial({
                color: 0xaa00ff, transparent: true, opacity: 0.35
            });
            const puff = new THREE.Mesh(puffGeo, puffMat);
            puff.position.set(0, 3.8, 0);
            puff.scale.set(1.4, 0.8, 1.4);
            p.group.add(puff);
            p.puffCloud = puff;
        } else if (r <= 0.5 && p.puffCloud) {
            try { p.group.remove(p.puffCloud); p.puffCloud.geometry.dispose(); p.puffCloud.material.dispose(); } catch (_) {}
            p.puffCloud = null;
        }
    }

    // Slow rot spread within a day. Every ~5s a few props nudge toward their
    // target rot, and rotted props raise their neighbors' target slightly so
    // the blight reads as creeping rather than appearing all at once.
    updateRotSpread() {
        if (!this.rotProps || !this.rotProps.length) return;
        if (!this.isRottableRegion()) return;
        // Animate each prop's current rot toward its target.
        this.rotProps.forEach(p => {
            const diff = p.targetRot - p.rot;
            if (Math.abs(diff) > 0.005) {
                p.rot += diff * 0.12;
                this.applyRotVisualToProp(p);
            }
        });
        // Neighbor spread tick — every ~5s.
        this._rotSpreadTick++;
        if (this._rotSpreadTick < 300) return;
        this._rotSpreadTick = 0;
        const rid = this.currentRegion.id;
        const regionRot01 = this.progression.getRegionRot(rid) / 100;
        if (regionRot01 < 0.05) return;
        // Pick a handful of seed mushrooms and elevate neighbors' target rot.
        const seedCount = Math.min(4, Math.ceil(regionRot01 * 6));
        for (let s = 0; s < seedCount; s++) {
            const seed = this.rotProps[Math.floor(Math.random() * this.rotProps.length)];
            if (!seed || !seed.group) continue;
            this.rotProps.forEach(other => {
                if (other === seed || !other.group) return;
                const d = seed.group.position.distanceTo(other.group.position);
                if (d < 14) {
                    // Bump target toward region rot, faster for closer neighbors.
                    const pull = (1 - d / 14) * 0.15;
                    other.targetRot = Math.min(1, Math.max(other.targetRot, regionRot01 - 0.1) + pull);
                }
            });
        }
    }

    // Called from the projectile/enemy collision loop. Cleanses any rot prop
    // within `radius` of the wand projectile's current position, scales region
    // rot down proportionally, and emits a sparkle VFX on hits.
    tryCleanseWithProjectile(proj, radius = 4.5) {
        if (!proj || !proj.coreActive) return;
        if (!this.rotProps || !this.rotProps.length) return;
        if (!this.isRottableRegion()) return;
        const rid = this.currentRegion.id;
        let cleansed = 0;
        const before = this.progression.getRegionRot(rid);
        this.rotProps.forEach(p => {
            if (!p.group) return;
            const d = proj.mesh.position.distanceTo(p.group.position);
            if (d < radius && p.targetRot > 0.05) {
                p.targetRot = Math.max(0, p.targetRot - 0.4);
                p.rot = Math.max(0, p.rot - 0.35);
                this.applyRotVisualToProp(p);
                cleansed++;
                if (Math.random() < 0.5) this.spawnCleanseSparkle(p.group.position);
            }
        });
        if (cleansed > 0) {
            // Reduce region rot in proportion to total props cleansed this hit.
            const drop = Math.min(before, (cleansed / this.rotProps.length) * 110);
            const next = Math.max(0, before - drop);
            this.progression.setRegionRot(rid, next);
            if (before >= 5 && next < 5) {
                this.showFloatingText('REGION CLEANSED — THE LAND BREATHES', 0x39FF14, true);
                try { if (this.uiSynth) this.uiSynth.triggerAttackRelease('C6', '4n'); } catch (_) {}
            }
            this.updateHud();
        }
    }

    // V1.9.20 - Drop a Rot-Purifying Light Pool at King Myco's feet. Costs 5 blue
    // spores, has a 12s cooldown, and lasts 60s. Inside the pool, Rotlings are
    // crippled and burn, and nearby mushrooms slowly cleanse.
    dropLightPool() {
        if (!this.player) return;
        const now = Date.now();
        const cd = 12000;
        const cost = 5;
        if (now - this._lightPoolLastDrop < cd) {
            const remaining = Math.ceil((cd - (now - this._lightPoolLastDrop)) / 1000);
            this.showFloatingText(`LIGHT POOL — ${remaining}s`, 0xaaaaaa);
            return;
        }
        if ((this.progression.data.blueSpores || 0) < cost) {
            this.showFloatingText(`NEED ${cost} BLUE SPORES`, 0x66ccff);
            return;
        }
        this.progression.data.blueSpores -= cost;
        this.progression.save();
        this._lightPoolLastDrop = now;
        const pos = this.player.group.position.clone();
        pos.y = 0;
        const pool = new LightPool3D(this.scene, pos, { radius: 7, duration: 60000 });
        this.lightPools.push(pool);
        this.showFloatingText('LIGHT POOL CONSECRATED', 0xfff2a8, true);
        try { if (this.uiSynth) this.uiSynth.triggerAttackRelease('E6', '4n'); } catch (_) {}
        this.updateHud();
    }

    // Per-frame: tick pool lifetimes, cleanse mushrooms inside each pool's radius.
    updateLightPools() {
        if (!this.lightPools || !this.lightPools.length) return;
        // Drive each pool's own update + drop dead ones.
        this.lightPools = this.lightPools.filter(pool => pool.update());
        // Slow cleanse pass on rot props within any pool (every ~15 frames).
        if (!this.rotProps || !this.rotProps.length) return;
        if (!this.isRottableRegion()) return;
        if ((this._lightPoolCleanseTick = (this._lightPoolCleanseTick || 0) + 1) < 15) return;
        this._lightPoolCleanseTick = 0;
        const rid = this.currentRegion.id;
        let cleansed = 0;
        this.rotProps.forEach(p => {
            if (!p.group) return;
            for (const pool of this.lightPools) {
                if (pool.contains(p.group.position) && p.targetRot > 0.05) {
                    p.targetRot = Math.max(0, p.targetRot - 0.05);
                    if (p.rot > 0) p.rot = Math.max(0, p.rot - 0.04);
                    this.applyRotVisualToProp(p);
                    cleansed++;
                    break;
                }
            }
        });
        if (cleansed > 0) {
            const before = this.progression.getRegionRot(rid);
            const drop = (cleansed / this.rotProps.length) * 20;
            const next = Math.max(0, before - drop);
            this.progression.setRegionRot(rid, next);
            if (before >= 5 && next < 5) {
                this.showFloatingText('REGION CLEANSED — THE LIGHT HOLDS', 0x39FF14, true);
            }
        }
    }

    spawnCleanseSparkle(pos) {
        const sparkles = 6;
        const geo = new THREE.BufferGeometry();
        const positions = new Float32Array(sparkles * 3);
        const vels = [];
        for (let i = 0; i < sparkles; i++) {
            positions[i * 3]     = pos.x + (Math.random() - 0.5) * 1.5;
            positions[i * 3 + 1] = pos.y + 3 + Math.random() * 1.2;
            positions[i * 3 + 2] = pos.z + (Math.random() - 0.5) * 1.5;
            vels.push(new THREE.Vector3((Math.random() - 0.5) * 0.05, 0.05 + Math.random() * 0.08, (Math.random() - 0.5) * 0.05));
        }
        geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        const mat = new THREE.PointsMaterial({ color: 0x80ffaa, size: 0.4, transparent: true, opacity: 1, depthWrite: false });
        const points = new THREE.Points(geo, mat);
        this.scene.add(points);
        let life = 0;
        const tick = () => {
            life++;
            const arr = geo.attributes.position.array;
            for (let i = 0; i < sparkles; i++) {
                arr[i * 3]     += vels[i].x;
                arr[i * 3 + 1] += vels[i].y;
                arr[i * 3 + 2] += vels[i].z;
            }
            geo.attributes.position.needsUpdate = true;
            mat.opacity = Math.max(0, 1 - life / 30);
            if (life < 30) requestAnimationFrame(tick);
            else {
                try { this.scene.remove(points); geo.dispose(); mat.dispose(); } catch (_) {}
            }
        };
        tick();
    }
    // ====================================================================

    updateHud() {
        const hud = document.getElementById('hud');
        if (hud) {
            const p = this.player;
            const prog = this.progression.data;
            
            // Health percentage for Roblox-style bar
            const hpPercent = (p.hp / p.maxHp) * 100;
            const xpPercent = (prog.xp / prog.nextLevelXp) * 100;
            // V1.9.16 - Top-center stats cluster: HP / Magic / Morality.
            const magicMax = p.maxMagic || 100;
            const magicCur = (p.magic != null) ? p.magic : magicMax;
            const magicPercent = Math.max(0, Math.min(100, (magicCur / magicMax) * 100));
            const alignment = (p.alignment != null) ? p.alignment : 50;
            const alignPercent = Math.max(0, Math.min(100, alignment));
            // Color the morality bar: low alignment = rot purple, mid = neutral white,
            // high = clan-green so the player can read their standing at a glance.
            let moralColor;
            if (alignment < 35) moralColor = '#aa00ff';
            else if (alignment > 65) moralColor = '#39FF14';
            else moralColor = '#cccccc';
            const moralLabel = alignment < 35 ? 'ROT-TOUCHED' : (alignment > 65 ? 'KING\'S LIGHT' : 'NEUTRAL');
            // V1.9.17 - Detect morality state changes and fire a one-shot visual shift.
            const moralState = alignment < 35 ? 'ROT' : (alignment > 65 ? 'LIGHT' : 'NEUTRAL');
            if (this.lastMoralState !== null && this.lastMoralState !== moralState) {
                this.triggerMoralityShift(this.lastMoralState, moralState, moralLabel, moralColor);
            }
            this.lastMoralState = moralState;

            if (this.hudMinimized) {
                hud.innerHTML = `
                    <div style="position: fixed; top: 10px; right: 10px; pointer-events: auto; display: flex; gap: 10px;">
                        <button onclick="window.game.toggleHud()" style="width: 32px; height: 32px; border-radius: 50%; background: rgba(0,0,0,0.5); border: 2px solid white; color: white; cursor: pointer;">+</button>
                    </div>
                `;
                return;
            }

            hud.innerHTML = `
                <!-- Roblox Style HUD -->
                <div style="position: fixed; top: 0; left: 0; width: 100%; height: 100%; pointer-events: none; font-family: sans-serif;">
                    
                    <!-- Top Right Menu Buttons -->
                    <div style="position: absolute; top: 10px; right: 10px; pointer-events: auto; display: flex; gap: 10px;">
                        <button onclick="window.game.toggleMinimap()" style="
                            width: 32px; height: 32px; border-radius: 5px; 
                            background: rgba(0,0,0,0.5); border: 2px solid #39FF14; 
                            color: #39FF14; font-size: 10px; cursor: pointer;
                            display: flex; align-items: center; justify-content: center;
                        ">MAP</button>
                        <button onclick="window.game.toggleHud()" style="
                            width: 32px; height: 32px; border-radius: 5px; 
                            background: rgba(0,0,0,0.5); border: 2px solid white; 
                            color: white; font-size: 10px; cursor: pointer;
                            display: flex; align-items: center; justify-content: center;
                        ">HUD</button>
                        <button onclick="window.game.togglePause()" style="
                            width: 32px; height: 32px; border-radius: 50%; 
                            background: rgba(0,0,0,0.5); border: 2px solid white; 
                            color: white; font-size: 16px; cursor: pointer;
                            display: flex; align-items: center; justify-content: center;
                        ">≡</button>
                    </div>

                    <!-- Minimap Container -->
                    ${this.minimapVisible ? `
                    <div style="position: absolute; top: 50px; right: 10px; width: 150px; height: 150px; background: rgba(0,0,0,0.5); border: 2px solid #39FF14; border-radius: 5px; overflow: hidden; pointer-events: auto;">
                        <canvas id="minimap-canvas" width="150" height="150" style="width: 100%; height: 100%;"></canvas>
                    </div>
                    ` : ''}

                    <!-- Top Left Chat Mock -->
                    <div style="position: absolute; top: 10px; left: 10px; width: 250px; background: rgba(0,0,0,0.3); padding: 5px; border-radius: 5px;">
                        <div style="color: white; font-size: 12px; margin-bottom: 2px;">[System]: Welcome to Myco Quest!</div>
                        <div style="color: #00ffff; font-size: 12px;">[King Myco]: Solana restored soon.</div>
                    </div>

                    <!-- V1.9.16 - Top Center King Myco Vitals: HP / Magic / Morality -->
                    <div style="position: absolute; top: 10px; left: 50%; transform: translateX(-50%); width: 320px; background: rgba(0,0,0,0.45); border: 1px solid rgba(57,255,20,0.35); border-radius: 8px; padding: 8px 12px; box-shadow: 0 0 12px rgba(0,0,0,0.55); font-family: sans-serif;">
                        <div style="display: flex; justify-content: space-between; align-items: baseline; margin-bottom: 4px;">
                            <span style="color: #ffffff; font-size: 11px; font-weight: bold; letter-spacing: 1px; text-shadow: 1px 1px 2px black;">KING MYCO</span>
                            <span style="color: #cccccc; font-size: 10px; text-shadow: 1px 1px 2px black;">LV ${prog.level}</span>
                        </div>
                        <!-- HP Row -->
                        <div style="display: flex; align-items: center; gap: 6px; margin-bottom: 3px;">
                            <span style="width: 36px; color: #ff5555; font-size: 9px; font-weight: bold; text-shadow: 1px 1px 2px black;">HP</span>
                            <div style="flex: 1; height: 10px; background: rgba(0,0,0,0.6); border: 1px solid rgba(255,85,85,0.45); border-radius: 5px; overflow: hidden;">
                                <div style="width: ${hpPercent}%; height: 100%; background: linear-gradient(90deg, #ff3344, #ff7755); transition: width 0.2s;"></div>
                            </div>
                            <span style="width: 52px; text-align: right; color: #ffaaaa; font-size: 9px; font-weight: bold; text-shadow: 1px 1px 2px black;">${Math.ceil(p.hp)}/${p.maxHp}</span>
                        </div>
                        <!-- Magic Row -->
                        <div style="display: flex; align-items: center; gap: 6px; margin-bottom: 3px;">
                            <span style="width: 36px; color: #66ccff; font-size: 9px; font-weight: bold; text-shadow: 1px 1px 2px black;">MAGIC</span>
                            <div style="flex: 1; height: 10px; background: rgba(0,0,0,0.6); border: 1px solid rgba(102,204,255,0.45); border-radius: 5px; overflow: hidden;">
                                <div style="width: ${magicPercent}%; height: 100%; background: linear-gradient(90deg, #2266ff, #66ccff); transition: width 0.2s;"></div>
                            </div>
                            <span style="width: 52px; text-align: right; color: #aaddff; font-size: 9px; font-weight: bold; text-shadow: 1px 1px 2px black;">${Math.ceil(magicCur)}/${magicMax}</span>
                        </div>
                        <!-- Morality Row -->
                        <div id="moral-row" style="display: flex; align-items: center; gap: 6px;">
                            <span style="width: 36px; color: ${moralColor}; font-size: 9px; font-weight: bold; text-shadow: 1px 1px 2px black;">MORAL</span>
                            <div id="moral-track" style="flex: 1; height: 10px; background: rgba(0,0,0,0.6); border: 1px solid rgba(255,255,255,0.25); border-radius: 5px; overflow: hidden; position: relative;">
                                <div style="position: absolute; left: 50%; top: 0; bottom: 0; width: 1px; background: rgba(255,255,255,0.35); z-index: 2;"></div>
                                <div id="moral-fill" style="width: ${alignPercent}%; height: 100%; background: ${moralColor}; transition: width 0.3s, background 0.3s;"></div>
                            </div>
                            <span id="moral-label" style="width: 52px; text-align: right; color: ${moralColor}; font-size: 9px; font-weight: bold; text-shadow: 1px 1px 2px black;">${moralLabel}</span>
                        </div>
                    </div>

                    <!-- Bottom Center Health & XP -->
                    <div style="position: absolute; bottom: 20px; left: 50%; transform: translateX(-50%); width: 300px; display: flex; flex-direction: column; align-items: center; gap: 5px;">
                        <!-- XP Bar -->
                        <div style="width: 100%; height: 4px; background: rgba(0,0,0,0.5); border-radius: 2px; overflow: hidden;">
                            <div style="width: ${xpPercent}%; height: 100%; background: #ffffff;"></div>
                        </div>
                        <!-- Health Bar -->
                        <div style="width: 100%; height: 12px; background: rgba(0,0,0,0.5); border-radius: 6px; overflow: hidden; border: 1px solid rgba(255,255,255,0.2);">
                            <div style="width: ${hpPercent}%; height: 100%; background: #00ff00; transition: width 0.3s;"></div>
                        </div>
                        <div style="color: white; font-size: 10px; font-weight: bold; text-shadow: 1px 1px 2px black;">LEVEL ${prog.level}</div>
                    </div>

                    <!-- Bottom Left Stats -->
                    <div style="position: absolute; bottom: 20px; left: 20px; color: white; text-shadow: 1px 1px 2px black;">
                        <div style="font-size: 14px; font-weight: bold; color: #00ffff;">${prog.blueSpores} <span style="font-size: 10px;">BLUE</span></div>
                        <div style="font-size: 14px; font-weight: bold; color: #ffff00;">${prog.goldenSpores} <span style="font-size: 10px;">GOLD</span></div>
                        ${(() => {
                            const keys = prog.keyItems || {};
                            const heldIds = Object.keys(keys).filter(k => (keys[k] || 0) > 0);
                            if (!heldIds.length) return '';
                            const pills = heldIds.map(id => {
                                const cfg = Object.values(CONFIG.PORTAL_KEYS || {}).find(k => k.id === id);
                                if (!cfg) return '';
                                const c = '#' + cfg.color.toString(16).padStart(6, '0');
                                return `<span style="display:inline-block; margin: 2px 4px 0 0; padding: 2px 8px; border-radius: 10px; background: rgba(0,0,0,0.6); border: 1px solid ${c}; color: ${c}; font-size: 9px; font-weight: bold;">🔑 ${cfg.name}${keys[id] > 1 ? ' ×' + keys[id] : ''}</span>`;
                            }).join('');
                            return `<div style="margin-top: 6px; max-width: 240px;">${pills}</div>`;
                        })()}
                        ${(() => {
                            // V1.9.21 - In Spore Collector mode the rot/light-pool panel is
                            // replaced by a collector dashboard: mode badge + daily cap meter.
                            if (this.progression.isCollectorMode()) {
                                const cap = this.progression.data.collectorDailyCap || 1000;
                                const remaining = this.progression.getCollectorRemainingToday();
                                const collected = cap - remaining;
                                const pct = Math.round((collected / cap) * 100);
                                const meterColor = remaining > 0 ? '#aa44ff' : '#666';
                                // V1.9.22 - In-pill quick burn. Shows daily burn progress and three buttons:
                                // burn 25, burn 100, burn ALL (clamped to blueSpores AND daily burn cap).
                                const burnCap = 1000;
                                const burnedToday = prog.dailyBurnedAmount || 0;
                                const burnRemaining = Math.max(0, burnCap - burnedToday);
                                const burnPct = Math.round((burnedToday / burnCap) * 100);
                                const blue = prog.blueSpores || 0;
                                const streak = prog.burnStreak || 0;
                                const burnAll = Math.min(blue, burnRemaining);
                                const can25 = blue >= 25 && burnRemaining >= 25;
                                const can100 = blue >= 100 && burnRemaining >= 100;
                                const canAll = burnAll > 0;
                                const btn = (label, val, enabled, accent) => `
                                    <button
                                        data-burn-btn
                                        onclick="window.game.quickBurnFromDashboard(${val}, this)"
                                        ${enabled ? '' : 'disabled'}
                                        style="
                                            flex:1; pointer-events:auto;
                                            padding: 4px 0;
                                            background: ${enabled ? accent : '#222'};
                                            color: ${enabled ? '#000' : '#666'};
                                            border: 1px solid ${enabled ? accent : '#333'};
                                            border-radius: 4px;
                                            font-family: inherit; font-size: 9px; font-weight: bold;
                                            letter-spacing: 1px;
                                            cursor: ${enabled ? 'pointer' : 'not-allowed'};
                                            opacity: ${enabled ? 1 : 0.55};
                                            position: relative;
                                        ">${label}</button>
                                `;
                                return `
                                    <div data-collector-dashboard style="margin-top: 10px; padding: 8px 10px; background: rgba(0,0,0,0.55); border: 1px solid #aa44ff; border-radius: 8px; max-width: 240px; pointer-events: auto; transition: border-color 0.3s;">
                                        <div style="display:flex; align-items:center; gap:6px; margin-bottom: 6px;">
                                            <span style="font-size: 14px;">🍄</span>
                                            <span style="flex:1; font-size: 10px; font-weight: bold; color: #aa44ff; letter-spacing: 1px; text-shadow: 1px 1px 2px black;">SPORE COLLECTOR</span>
                                        </div>

                                        <!-- Daily Harvest -->
                                        <div style="font-size: 9px; color: #ddd; margin-bottom: 4px; text-shadow: 1px 1px 2px black;">
                                            DAILY HARVEST <span style="color:#fff2a8; font-weight:bold;">${collected} / ${cap}</span>
                                        </div>
                                        <div style="height:8px; background:rgba(0,0,0,0.6); border:1px solid rgba(255,255,255,0.2); border-radius:4px; overflow:hidden;">
                                            <div style="width:${pct}%; height:100%; background:${meterColor}; transition: width 0.4s;"></div>
                                        </div>
                                        <div style="font-size: 8px; color: ${remaining > 0 ? '#aaa' : '#ff8888'}; margin-top: 4px; letter-spacing: 1px; text-shadow: 1px 1px 2px black;">
                                            ${remaining > 0 ? `${remaining} REMAINING TODAY` : 'CAP REACHED — RESETS AT MIDNIGHT'}
                                        </div>

                                        <!-- Divider -->
                                        <div style="height:1px; background: rgba(255,170,68,0.35); margin: 8px 0;"></div>

                                        <!-- Burn Pit Quick Action -->
                                        <div style="display:flex; align-items:center; gap:6px; margin-bottom: 4px;">
                                            <span style="font-size: 12px;">🔥</span>
                                            <span style="flex:1; font-size: 9px; font-weight: bold; color: #ff8855; letter-spacing: 1px; text-shadow: 1px 1px 2px black;">BURN SPORES</span>
                                            ${streak > 0 ? `<span style="font-size: 8px; color: #ffcc66; font-weight: bold; text-shadow: 1px 1px 2px black;">🔥${streak}d</span>` : ''}
                                        </div>
                                        <div style="font-size: 8px; color: #ddd; margin-bottom: 4px; text-shadow: 1px 1px 2px black;">
                                            BURNED TODAY <span style="color:#ffaa66; font-weight:bold;">${burnedToday} / ${burnCap}</span>
                                        </div>
                                        <div data-burn-meter style="height:6px; background:rgba(0,0,0,0.6); border:1px solid rgba(255,136,85,0.35); border-radius:3px; overflow:hidden; margin-bottom: 6px;">
                                            <div style="width:${burnPct}%; height:100%; background: linear-gradient(90deg, #ff5500, #ffaa44); transition: width 0.4s;"></div>
                                        </div>
                                        <div style="display:flex; gap:4px;">
                                            ${btn('-25', 25, can25, '#ffaa44')}
                                            ${btn('-100', 100, can100, '#ff8844')}
                                            ${btn(canAll ? `ALL (${burnAll})` : 'ALL', burnAll, canAll, '#ff5500')}
                                        </div>
                                        <div style="font-size: 7px; color: #888; margin-top: 5px; text-align: center; letter-spacing: 1px;">
                                            ${blue} BLUE AVAILABLE
                                        </div>

                                        <!-- V1.9.23 - Leaderboard launcher -->
                                        <button
                                            onclick="window.game.showCollectorLeaderboard('today')"
                                            style="
                                                width: 100%; margin-top: 8px; padding: 6px 0;
                                                background: rgba(170,68,255,0.15);
                                                color: #d9b8ff;
                                                border: 1px solid #aa44ff;
                                                border-radius: 4px;
                                                font-family: inherit; font-size: 9px; font-weight: bold;
                                                letter-spacing: 1px; cursor: pointer;
                                                pointer-events: auto;
                                            ">🏆 LEADERBOARD</button>
                                    </div>
                                `;
                            }
                            // V1.9.18 - Daily Rot Panel: per-conquered-region blight tracker.
                            const conq = prog.conqueredRegions || {};
                            const ids = Object.keys(conq);
                            if (!ids.length) return '';
                            const rows = ids.map(id => {
                                const reg = CONFIG.REGIONS.find(r => r.id === id);
                                const label = reg ? reg.name : id;
                                const rot = Math.round((prog.regionRot && prog.regionRot[id]) || 0);
                                const cleansed = rot < 5;
                                const barColor = cleansed ? '#39FF14' : (rot >= 50 ? '#aa00ff' : '#ffaa00');
                                const status = cleansed ? '✓ CLEANSED' : `${rot}%`;
                                return `
                                    <div style="display:flex; align-items:center; gap:6px; font-size:9px; margin-top:3px;">
                                        <span style="width:80px; color:#ddd; text-shadow: 1px 1px 2px black; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">${label}</span>
                                        <div style="flex:1; height:6px; background:rgba(0,0,0,0.6); border:1px solid rgba(255,255,255,0.2); border-radius:3px; overflow:hidden;">
                                            <div style="width:${rot}%; height:100%; background:${barColor}; transition: width 0.4s;"></div>
                                        </div>
                                        <span style="width:62px; text-align:right; color:${barColor}; font-weight:bold; text-shadow: 1px 1px 2px black;">${status}</span>
                                    </div>
                                `;
                            }).join('');
                            // V1.9.20 - Light Pool readiness pill (cost + cooldown).
                            const cd = 12000;
                            const sinceDrop = Date.now() - (this._lightPoolLastDrop || 0);
                            const cdReady = sinceDrop >= cd;
                            const cdSecs = cdReady ? 0 : Math.ceil((cd - sinceDrop) / 1000);
                            const canAfford = (prog.blueSpores || 0) >= 5;
                            const poolColor = (cdReady && canAfford) ? '#fff2a8' : '#777';
                            const poolStatus = cdReady
                                ? (canAfford ? 'READY' : '5 BLUE')
                                : `${cdSecs}s`;
                            const poolPill = `
                                <div style="margin-top: 6px; padding: 5px 8px; background: rgba(0,0,0,0.45); border: 1px solid ${poolColor}; border-radius: 6px; max-width: 240px; display:flex; align-items:center; gap:6px;">
                                    <span style="font-size: 13px;">✨</span>
                                    <span style="flex:1; font-size: 9px; color: ${poolColor}; font-weight: bold; letter-spacing: 1px; text-shadow: 1px 1px 2px black;">LIGHT POOL (F)</span>
                                    <span style="font-size: 9px; color: ${poolColor}; font-weight: bold; text-shadow: 1px 1px 2px black;">${poolStatus}</span>
                                </div>
                            `;
                            return `
                                <div style="margin-top: 10px; padding: 6px 8px; background: rgba(0,0,0,0.45); border: 1px solid rgba(170,0,255,0.45); border-radius: 6px; max-width: 240px;">
                                    <div style="font-size: 10px; font-weight: bold; color: #aa00ff; letter-spacing: 1px; text-shadow: 1px 1px 2px black;">🍄 DAILY ROT</div>
                                    ${rows}
                                </div>
                                ${poolPill}
                            `;
                        })()}
                    </div>

                    <!-- Hotbar -->
                    <div style="position: absolute; bottom: 80px; left: 50%; transform: translateX(-50%); display: flex; gap: 5px; pointer-events: auto;">
                        ${[1, 2, 3, 4, 5].map(i => {
                            const isActive = p.activeSlot === i;
                            let icon = '';
                            let label = '';
                            let count = 0;
                            if (i === 1) { icon = '🪄'; label = 'Magic'; }
                            else if (i === 2) { icon = '🗡️'; label = 'Melee'; }
                            else if (i === 3) { 
                                icon = '🧪'; label = 'Potion'; 
                                count = prog.inventory.filter(id => id === 'capPotion').length;
                            }
                            else if (i === 4) { 
                                icon = '💣'; label = 'Bomb'; 
                                count = prog.inventory.filter(id => id === 'sporeBomb').length;
                            }
                            else if (i === 5) { 
                                icon = '🛡️'; label = 'Salve'; 
                                count = prog.inventory.filter(id => id === 'rotSalve').length;
                            }

                            return `
                                <div onclick="window.game.player.activeSlot = ${i}; window.game.updateHud();" style="
                                    width: 46px; height: 46px; 
                                    background: ${isActive ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.5)'}; 
                                    border: 2px solid ${isActive ? 'white' : 'rgba(255,255,255,0.3)'}; 
                                    border-radius: 5px; position: relative; cursor: pointer;
                                    display: flex; align-items: center; justify-content: center;
                                    transition: all 0.1s;
                                    box-shadow: ${isActive ? '0 0 10px white' : 'none'};
                                    opacity: ${(i > 2 && count === 0) ? 0.3 : 1.0};
                                ">
                                    <span style="position: absolute; top: 2px; left: 4px; font-size: 8px; color: white; opacity: 0.7;">${i}</span>
                                    <div style="font-size: 24px;">${icon}</div>
                                    ${count > 0 ? `<span style="position: absolute; bottom: 2px; right: 4px; font-size: 10px; color: white; font-weight: bold; background: rgba(0,0,0,0.5); padding: 1px 3px; border-radius: 3px;">${count}</span>` : ''}
                                    ${isActive && label ? `<div style="position: absolute; top: -20px; font-size: 10px; color: white; white-space: nowrap; text-shadow: 1px 1px 2px black;">${label}</div>` : ''}
                                </div>
                            `;
                        }).join('')}
                    </div>

                    <!-- Boss Health Bar (V1.9.16: pushed below the top-center vitals) -->
                    ${this.boss ? `
                        <div style="position: absolute; top: 110px; left: 50%; transform: translateX(-50%); width: 400px; display: flex; flex-direction: column; align-items: center; gap: 5px;">
                            <div style="color: #ff0055; font-size: 12px; font-weight: bold; text-shadow: 2px 2px 4px black; text-transform: uppercase;">${this.boss.name}</div>
                            <div style="width: 100%; height: 16px; background: rgba(0,0,0,0.7); border: 2px solid #ff0055; border-radius: 8px; overflow: hidden; box-shadow: 0 0 15px rgba(255,0,85,0.5);">
                                <div style="width: ${(this.boss.hp / this.boss.maxHp) * 100}%; height: 100%; background: linear-gradient(90deg, #ff0055, #ff5500); transition: width 0.1s;"></div>
                            </div>
                        </div>
                    ` : ''}

                </div>
            `;
        }
    }

    // V1.9.17 - One-shot visual transition when the morality state flips between
    // ROT-TOUCHED / NEUTRAL / KING'S LIGHT. Triggers a full-screen color-tinted
    // flash, a pulse on the morality row, a floating banner, and an SFX sting.
    triggerMoralityShift(prevState, nextState, label, hexColor) {
        const container = document.getElementById('game-container');
        if (!container) return;

        // Ensure the shared keyframes are injected exactly once.
        if (!document.getElementById('morality-shift-styles')) {
            const style = document.createElement('style');
            style.id = 'morality-shift-styles';
            style.textContent = `
                @keyframes moralFlashFade {
                    0%   { opacity: 0; }
                    18%  { opacity: 0.55; }
                    100% { opacity: 0; }
                }
                @keyframes moralRowPulse {
                    0%   { transform: scale(1); filter: brightness(1); }
                    25%  { transform: scale(1.08); filter: brightness(2.2); }
                    100% { transform: scale(1); filter: brightness(1); }
                }
                @keyframes moralBannerRise {
                    0%   { opacity: 0; transform: translate(-50%, 12px) scale(0.9); }
                    20%  { opacity: 1; transform: translate(-50%, 0) scale(1.05); }
                    80%  { opacity: 1; transform: translate(-50%, -4px) scale(1.0); }
                    100% { opacity: 0; transform: translate(-50%, -28px) scale(0.95); }
                }
                @keyframes moralBarShimmer {
                    0%   { box-shadow: 0 0 0 rgba(255,255,255,0); }
                    30%  { box-shadow: 0 0 24px currentColor; }
                    100% { box-shadow: 0 0 0 rgba(255,255,255,0); }
                }
            `;
            document.head.appendChild(style);
        }

        // 1) Full-screen tinted flash via radial gradient so it feels diegetic.
        const flash = document.createElement('div');
        flash.style.cssText = `
            position: fixed; inset: 0; pointer-events: none; z-index: 9000;
            background: radial-gradient(circle at center, ${hexColor}55 0%, ${hexColor}22 35%, transparent 75%);
            animation: moralFlashFade 900ms ease-out forwards;
        `;
        container.appendChild(flash);
        setTimeout(() => { try { flash.remove(); } catch (_) {} }, 950);

        // 2) Pulse the morality row + glow the fill bar. The row & fill IDs are
        //    re-rendered on every HUD refresh, so we look them up at trigger time.
        const row = document.getElementById('moral-row');
        if (row) {
            row.style.transformOrigin = 'center';
            row.style.animation = 'moralRowPulse 700ms ease-out';
            setTimeout(() => { if (row) row.style.animation = ''; }, 720);
        }
        const fill = document.getElementById('moral-fill');
        if (fill) {
            fill.style.color = hexColor; // currentColor for the shimmer keyframe
            fill.style.animation = 'moralBarShimmer 900ms ease-out';
            setTimeout(() => { if (fill) fill.style.animation = ''; }, 920);
        }

        // 3) Floating banner above the vitals card announcing the new state.
        const banner = document.createElement('div');
        const verb = nextState === 'ROT' ? 'EMBRACED THE ROT'
                   : nextState === 'LIGHT' ? 'WALKS IN KING\'S LIGHT'
                   : 'FINDS BALANCE';
        banner.textContent = `${label} — ${verb}`;
        banner.style.cssText = `
            position: fixed; top: 90px; left: 50%;
            transform: translateX(-50%);
            color: ${hexColor};
            font-family: sans-serif; font-size: 18px; font-weight: bold;
            letter-spacing: 2px;
            text-shadow: 0 0 12px ${hexColor}, 2px 2px 4px black;
            background: rgba(0,0,0,0.55);
            border: 1px solid ${hexColor};
            border-radius: 6px;
            padding: 6px 14px;
            pointer-events: none;
            z-index: 9001;
            animation: moralBannerRise 1800ms ease-out forwards;
        `;
        container.appendChild(banner);
        setTimeout(() => { try { banner.remove(); } catch (_) {} }, 1850);

        // 4) SFX sting tied to direction of the shift.
        try {
            if (this.uiSynth) {
                const note = nextState === 'ROT' ? 'C3'
                           : nextState === 'LIGHT' ? 'G5'
                           : 'E4';
                this.uiSynth.triggerAttackRelease(note, '8n');
            }
        } catch (_) {}
    }

    updateDynamicHud() {
        if (this.gameState !== 'PLAYING' || !this.player) return;

        // Update Special Cooldown Bar
        const cooldownBar = document.getElementById('cooldown-bar');
        const cooldownText = document.getElementById('cooldown-percent');
        
        if (cooldownBar && cooldownText) {
            if (!this.player.hasRoyalSpore) {
                cooldownBar.style.width = '0%';
                cooldownBar.style.background = '#444';
                cooldownText.innerText = 'LOCKED';
                cooldownText.style.color = '#888';
            } else {
                const now = Date.now();
                const elapsed = now - this.player.lastSpecialTime;
                const cooldown = CONFIG.PLAYER.SPECIAL_COOLDOWN;
                const progress = Math.min(1, elapsed / cooldown);
                
                cooldownBar.style.width = `${progress * 100}%`;
                
                if (progress < 1) {
                    cooldownBar.style.background = '#ff4400';
                    const remaining = Math.ceil((cooldown - elapsed) / 1000);
                    cooldownText.innerText = `${remaining}s`;
                    cooldownText.style.color = '#ff4400';
                    this.player._specialReadySoundPlayed = false; // Reset flag
                } else {
                    cooldownBar.style.background = '#39FF14';
                    cooldownText.innerText = 'READY';
                    cooldownText.style.color = '#39FF14';
                    
                    // Play cooldown complete sound once
                    if (!this.player._specialReadySoundPlayed) {
                        this.playCooldownReadySound();
                        this.player._specialReadySoundPlayed = true;
                    }
                    
                    // Subtle pulse effect when ready
                    const pulse = 0.8 + Math.sin(Date.now() * 0.01) * 0.2;
                    cooldownBar.style.opacity = pulse;
                }
            }
        }
    }

    playCooldownReadySound() {
        const synth = new TONE.Synth({
            oscillator: { type: "triangle" },
            envelope: { attack: 0.01, decay: 0.1, sustain: 0.5, release: 0.2 }
        }).toDestination();
        synth.volume.value = -10;
        synth.triggerAttackRelease("C5", "16n");
        setTimeout(() => synth.triggerAttackRelease("E5", "16n"), 100);
    }

    startGameplay() {
        this.gameState = 'PLAYING';
        this.startTime = Date.now();
        this.spawnCollectibles(); // Refresh with correct clan colors
        this.checkClanRewards(); // Check for rewards on game start
        this.playEpicMusic('AUTO');
        // V1.9.21 - Collector mode shows a stripped-down control hint; story mode keeps the full bar.
        const controlHint = this.progression.isCollectorMode()
            ? `WASD: MOVE | SPACE: JUMP | E: COLLECT / INTERACT | B: BURN PIT`
            : `WASD: MOVE | SPACE: JUMP (x2) | X: MAGIC | Q: ROYAL SPORE | R: MYCELIAL NET | E: INTERACT | U: UPGRADES | B: BURN PIT`;
        this.uiOverlay.innerHTML = `
            <div id="hud" style="position: absolute; top: 20px; left: 20px; pointer-events: none; background: rgba(0,0,0,0.5); padding: 15px; border-radius: 10px; width: 220px;"></div>
            <div style="position: absolute; bottom: 70px; left: 50%; transform: translateX(-50%); pointer-events: none; font-size: 10px; color: #888; text-shadow: 1px 1px 2px black; white-space: nowrap;">
                ${controlHint}
            </div>
        `;

        window.openSkillMenu = () => this.showSkillMenu();
        window.openBurnPit = () => this.showBurnPitMenu();

        // Register global hotkeys for interaction
        window.addEventListener('keydown', (e) => {
            if (e.code === 'KeyQ' && this.gameState === 'PLAYING') {
                if (!this.player.hasRoyalSpore) {
                    this.showFloatingText("SKILL LOCKED (U)", 0x888888);
                }
            }
            // V1.9.20 - F drops a Rot-Purifying Light Pool at King Myco's feet.
            // V1.9.21 - Suppressed in Spore Collector mode (no rot to cleanse).
            if (e.code === 'KeyF' && this.gameState === 'PLAYING' && !this.progression.isCollectorMode()) {
                this.dropLightPool();
            }
        });

        this.updateHud();
        this.player.group.visible = true;
    }

    checkClanRewards() {
        const p = this.progression.data;
        const lastBurnTime = this.getMostRecentBurnTime();
        
        if (p.lastWeeklyRewardClaimed < lastBurnTime.getTime()) {
            const rankings = this.leaderboard.getBurnRankings();
            const winner = rankings[0];
            const runnerUp = rankings[1];
            
            let reward = null;
            let title = "";

            if (winner && winner.id === this.selectedClan) {
                reward = CONFIG.CLAN_REWARDS.winner;
                title = "CHAMPIONS OF THE BURN";
            } else if (runnerUp && runnerUp.id === this.selectedClan) {
                reward = CONFIG.CLAN_REWARDS.runnerUp;
                title = "ELITE CONTRIBUTORS";
            }

            if (reward) {
                this.progression.addSpores(0, reward.goldSpores, reward.ingredients);
                p.skillPoints = (p.skillPoints || 0) + reward.skillPoints;
                this.showRewardNotification(title, reward);
            }

            this.leaderboard.resetWeeklyBurns(); // Now includes Hall of Fame logic
            p.lastWeeklyRewardClaimed = Date.now();
            this.progression.save();
            this.updateHud();
        }
    }

    getMostRecentBurnTime() {
        const now = new Date();
        const sunday = new Date();
        sunday.setDate(now.getDate() - now.getDay()); // Go back to Sunday
        sunday.setHours(20, 0, 0, 0); // 8 PM CST
        
        if (now < sunday) {
            sunday.setDate(sunday.getDate() - 7); // Go back one more week if we haven't reached Sunday 8pm yet
        }
        return sunday;
    }

    showRewardNotification(title, reward) {
        const div = document.createElement('div');
        div.style.position = 'absolute';
        div.style.top = '20%';
        div.style.left = '50%';
        div.style.transform = 'translate(-50%, -50%)';
        div.style.background = 'rgba(0,0,0,0.9)';
        div.style.border = '4px solid #ffff00';
        div.style.padding = '30px';
        div.style.textAlign = 'center';
        div.style.zIndex = '1000';
        div.style.pointerEvents = 'auto';
        
        div.innerHTML = `
            <h2 style="color: #ffff00; font-size: 20px; margin-bottom: 15px;">${title}</h2>
            <p style="color: #39FF14; font-size: 10px; margin-bottom: 20px;">Your clan excelled in the Great Burn!</p>
            <div style="text-align: left; font-size: 10px; color: #fff; margin-bottom: 20px;">
                <p>+ ${reward.goldSpores} GOLDEN SPORES</p>
                <p>+ ${reward.skillPoints} SKILL POINTS</p>
                <p>+ ${reward.ingredients} INGREDIENTS</p>
            </div>
            <button onclick="this.parentElement.remove()" style="padding: 10px 20px; background: #ffff00; border: none; font-family: inherit;">RECLAIM POWER</button>
        `;
        
        this.uiOverlay.appendChild(div);
        
        const synth = new TONE.PolySynth().toDestination();
        synth.triggerAttackRelease(["C4", "E4", "G4", "B4", "C5"], "1n");
    }

    showSkillMenu() {
        if (this.gameState === 'SKILL_MENU') return;
        this.gameState = 'SKILL_MENU';
        const p = this.progression.data;

        this.uiOverlay.innerHTML = `
            <div style="pointer-events: auto; background: rgba(0,0,0,0.95); padding: 25px; border: 2px solid #ffff00; width: 90%; max-width: 700px; text-align: center; max-height: 90vh; overflow-y: auto;">
                <h2 style="color: #ffff00; margin-bottom: 15px; font-size: 18px;">KING'S UPGRADES</h2>
                <p style="color: #39FF14; margin-bottom: 15px; font-size: 12px;">SKILL POINTS: ${p.skillPoints}</p>
                
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 20px;">
                    ${CONFIG.SKILLS.map(skill => {
                        const level = p.upgrades[skill.id] || 0;
                        const isUnlocked = skill.isAbility ? level > 0 : true;
                        const canAfford = p.skillPoints >= 1;
                        
                        return `
                            <div style="background: #111; padding: 10px; border: 1px solid #333; display: flex; flex-direction: column; justify-content: space-between;">
                                <div>
                                    <p style="font-size: 10px; color: #00ffff;">${skill.name.toUpperCase()} ${skill.isAbility ? (isUnlocked ? '[LEARNED]' : '[LOCKED]') : `(LVL ${level})`}</p>
                                    <p style="font-size: 7px; color: #888; margin: 4px 0;">${skill.desc}</p>
                                </div>
                                <button onclick="window.upgradeSkill('${skill.id}')" style="margin-top: 5px; padding: 8px; background: #39FF14; color: black; border: none; font-size: 8px; width: 100%; ${!canAfford ? 'opacity: 0.5; cursor: not-allowed;' : ''}">
                                    ${skill.isAbility && isUnlocked ? 'ALREADY LEARNED' : 'UPGRADE (1 SP)'}
                                </button>
                            </div>
                        `;
                    }).join('')}
                </div>

                <button onclick="window.closeSkillMenu()" style="padding: 10px 20px; background: #ff0000; color: white; border: none; font-size: 10px;">CLOSE</button>
            </div>
        `;

        window.upgradeSkill = (skillId) => {
            if (p.skillPoints >= 1) {
                const skill = CONFIG.SKILLS.find(s => s.id === skillId);
                if (skill.isAbility && p.upgrades[skillId] > 0) return; // Already learned ability

                p.skillPoints--;
                p.upgrades[skillId] = (p.upgrades[skillId] || 0) + 1;
                this.progression.save();
                this.player.applyLevelStats();
                this.showSkillMenu();
                this.updateHud();
                const synth = new TONE.Synth().toDestination();
                synth.triggerAttackRelease("C5", "8n");
                
                if (skill.isAbility) {
                    this.showFloatingText(`LEARNED: ${skill.name}!`, 0xffff00, true);
                }
            }
        };

        window.closeSkillMenu = () => {
            this.gameState = 'PLAYING';
            this.startGameplay();
        };
    }

    playEpicMusic(mode = 'AUTO') {
        // V1.9.13 - Background music disabled per design. Sound effects remain live.
        // We still tear down any previously scheduled voices and stop the Transport
        // so we leave a clean audio graph for SFX.
        try {
            TONE.Transport.cancel();
            TONE.Transport.stop();
        } catch (_) {}
        if (this._music) {
            try {
                this._music.lead && this._music.lead.dispose();
                this._music.bass && this._music.bass.dispose();
                this._music.blip && this._music.blip.dispose();
                this._music.filter && this._music.filter.dispose();
                this._music.leadSeq && this._music.leadSeq.dispose();
                this._music.bassSeq && this._music.bassSeq.dispose();
                this._music.blipSeq && this._music.blipSeq.dispose();
            } catch (_) {}
            this._music = null;
        }
        return;

        // --- legacy chiptune kept below for future re-enable ---
        // eslint-disable-next-line no-unreachable

        // Per-region 16-bit melody. 16 steps of 8n each = one bar of catchy chip melody.
        // null = rest. All notes are tagged with octave to keep the synth monophonic-stable.
        const regionId = this.currentRegion.id;
        const songs = {
            overworld: {
                bpm: 132,
                key: 'C',
                lead: ['C5','E5','G5','E5','A5','G5','E5','C5', 'D5','F5','A5','F5','G5','E5','D5','C5'],
                bass: ['C3', null, 'G2', null, 'A2', null, 'E3', null, 'F2', null, 'C3', null, 'G2', null, 'G2', null]
            },
            sporewood: {
                bpm: 128,
                lead: ['E5','G5','B5','G5','A5','B5','G5','E5', 'D5','F5','A5','F5','G5','E5','D5','E5'],
                bass: ['E3', null, 'B2', null, 'A2', null, 'E3', null, 'D3', null, 'A2', null, 'B2', null, 'E3', null]
            },
            crystalcap: {
                bpm: 120,
                lead: ['E5','G#5','B5','E6','D#6','B5','G#5','E5', 'F#5','A5','C#6','A5','B5','G#5','F#5','E5'],
                bass: ['E3', null, 'B2', null, 'C#3', null, 'G#2', null, 'A2', null, 'E3', null, 'B2', null, 'E3', null]
            },
            ambermycel: {
                bpm: 122,
                lead: ['A4','C5','E5','C5','D5','E5','C5','A4', 'G4','B4','D5','B4','C5','A4','G4','A4'],
                bass: ['A2', null, 'E3', null, 'D3', null, 'A2', null, 'G2', null, 'D3', null, 'E3', null, 'A2', null]
            },
            silkspore: {
                bpm: 118,
                lead: ['D5','F5','A5','F5','G5','A5','F5','D5', 'C5','E5','G5','E5','F5','D5','C5','D5'],
                bass: ['D3', null, 'A2', null, 'G2', null, 'D3', null, 'C3', null, 'G2', null, 'A2', null, 'D3', null]
            },
            emberstem: {
                bpm: 138,
                lead: ['F5','Ab5','C6','Ab5','Bb5','C6','Ab5','F5', 'Eb5','G5','Bb5','G5','Ab5','F5','Eb5','F5'],
                bass: ['F2', null, 'C3', null, 'Bb2', null, 'F2', null, 'Eb3', null, 'Bb2', null, 'C3', null, 'F2', null]
            },
            voidlichen: {
                bpm: 112,
                lead: ['A4','C5','D5','E5','G5','E5','D5','C5', 'B4','D5','E5','G5','A5','G5','E5','D5'],
                bass: ['A2', null, 'D3', null, 'E3', null, 'G2', null, 'B2', null, 'E3', null, 'D3', null, 'A2', null]
            },
            thronecap: {
                bpm: 140,
                lead: ['C5','Eb5','G5','Eb5','Ab5','G5','Eb5','C5', 'B4','D5','F5','D5','Eb5','C5','B4','C5'],
                bass: ['C3', null, 'G2', null, 'Ab2', null, 'Eb3', null, 'B2', null, 'F2', null, 'G2', null, 'C3', null]
            },
            menu: {
                bpm: 96,
                lead: ['D5','F5','A5','F5','C5','E5','G5','E5', 'D5','F5','A5','C6','A5','F5','D5',null],
                bass: ['D3', null, 'A2', null, 'F2', null, 'C3', null, 'D3', null, 'A2', null, 'F2', null, 'D3', null]
            }
        };

        let song;
        if (this.gameState === 'START_SCREEN' || this.gameState === 'PROLOGUE') song = songs.menu;
        else if (mode === 'BOSS' || regionId === 'thronecap') song = songs.thronecap;
        else if (songs[regionId]) song = songs[regionId];
        else song = songs.overworld;

        // === 16-bit voices ===
        // Lead: square wave for that classic NES pulse melody, gently filtered.
        const filter = new TONE.Filter(2200, 'lowpass').toDestination();
        filter.Q.value = 1.0;

        const lead = new TONE.Synth({
            oscillator: { type: 'square' },
            envelope:   { attack: 0.005, decay: 0.08, sustain: 0.55, release: 0.08 },
            volume: -10
        }).connect(filter);

        // Bass: triangle for that warm chiptune low-end.
        const bass = new TONE.Synth({
            oscillator: { type: 'triangle' },
            envelope:   { attack: 0.005, decay: 0.20, sustain: 0.30, release: 0.12 },
            volume: -14
        }).toDestination();

        // Blip: tiny noise hat for groove.
        const blip = new TONE.NoiseSynth({
            noise: { type: 'white' },
            envelope: { attack: 0.001, decay: 0.04, sustain: 0, release: 0.04 },
            volume: -28
        }).toDestination();

        // Tone.Sequence schedules notes per step with the loop's `time` directly — each call gets
        // a strictly-increasing time, eliminating the monosynth start-time-collision crash.
        const leadSeq = new TONE.Sequence((time, note) => {
            if (note) lead.triggerAttackRelease(note, '8n', time);
        }, song.lead, '8n').start(0);

        const bassSeq = new TONE.Sequence((time, note) => {
            if (note) bass.triggerAttackRelease(note, '8n', time);
        }, song.bass, '8n').start(0);

        const hatPattern = ['x', null, 'x', null, 'x', null, 'x', 'x'];
        const blipSeq = new TONE.Sequence((time, hit) => {
            if (hit) blip.triggerAttackRelease('16n', time);
        }, hatPattern, '8n').start(0);

        this._music = { lead, bass, blip, filter, leadSeq, bassSeq, blipSeq };

        TONE.Transport.bpm.value = song.bpm;
        TONE.Transport.start();
    }

    drawMinimap() {
        const canvas = document.getElementById('minimap-canvas');
        if (!canvas || !this.player || this.gameState !== 'PLAYING') return;
        const ctx = canvas.getContext('2d');
        const w = canvas.width;
        const h = canvas.height;
        
        ctx.fillStyle = 'rgba(0, 5, 0, 0.9)';
        ctx.fillRect(0, 0, w, h);
        
        const mapScale = 2.0; // Zoom level
        const centerX = w / 2;
        const centerY = h / 2;
        
        const playerPos = this.player.group.position;
        
        // Draw Grid
        ctx.strokeStyle = 'rgba(57, 255, 20, 0.1)';
        ctx.lineWidth = 1;
        const gridSize = 20 * mapScale;
        const offsetX = (playerPos.x * mapScale) % gridSize;
        const offsetZ = (playerPos.z * mapScale) % gridSize;

        for(let x = -offsetX; x < w + gridSize; x += gridSize) {
            ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, h); ctx.stroke();
        }
        for(let y = offsetZ; y < h + gridSize; y += gridSize) {
            ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke();
        }

        // Helper to map world to minimap (Z+ is UP)
        const toMapX = (worldX) => centerX + (worldX - playerPos.x) * mapScale;
        const toMapY = (worldZ) => centerY - (worldZ - playerPos.z) * mapScale;

        // Draw NPCs (Teal)
        this.npcs.forEach(npc => {
            const dx = toMapX(npc.mesh.position.x);
            const dy = toMapY(npc.mesh.position.z);
            if (dx > 0 && dx < w && dy > 0 && dy < h) {
                ctx.fillStyle = '#00ffff';
                ctx.beginPath(); ctx.arc(dx, dy, 4, 0, Math.PI * 2); ctx.fill();
            }
        });

        // Draw Portals (Region Colors)
        this.portals.forEach(portal => {
            const dx = toMapX(portal.mesh.position.x);
            const dy = toMapY(portal.mesh.position.z);
            if (dx > 0 && dx < w && dy > 0 && dy < h) {
                const reg = CONFIG.REGIONS.find(r => r.id === portal.regionId);
                const color = reg ? `#${reg.accent.toString(16).padStart(6, '0')}` : '#ffffff';
                ctx.fillStyle = color;
                ctx.beginPath(); ctx.arc(dx, dy, 6, 0, Math.PI * 2); ctx.fill();
                ctx.strokeStyle = '#fff'; ctx.lineWidth = 1; ctx.stroke();
            }
        });

        // Draw Enemies (Purple/Red)
        this.enemies.forEach(enemy => {
            const dx = toMapX(enemy.mesh.position.x);
            const dy = toMapY(enemy.mesh.position.z);
            if (dx > 0 && dx < w && dy > 0 && dy < h) {
                ctx.fillStyle = enemy.isBoss ? '#ff0000' : '#aa00ff';
                const size = enemy.isBoss ? 5 : 3;
                ctx.beginPath(); ctx.arc(dx, dy, size, 0, Math.PI * 2); ctx.fill();
                if (enemy.isBoss) {
                    ctx.strokeStyle = '#fff'; ctx.stroke();
                }
            }
        });

        // Draw Collectibles (Yellow/Gold)
        this.collectibles.forEach(col => {
            const dx = toMapX(col.mesh.position.x);
            const dy = toMapY(col.mesh.position.z);
            if (dx > 0 && dx < w && dy > 0 && dy < h) {
                ctx.fillStyle = col.type === 'GOLDEN_SPORE' ? '#ffff00' : '#00ffff';
                ctx.fillRect(dx - 1, dy - 1, 3, 3);
            }
        });

        // Draw Traps (Cyan circles)
        if (this.traps) {
            this.traps.forEach(trap => {
                const dx = toMapX(trap.mesh.position.x);
                const dy = toMapY(trap.mesh.position.z);
                if (dx > 0 && dx < w && dy > 0 && dy < h) {
                    ctx.strokeStyle = '#00ffff';
                    ctx.lineWidth = 1;
                    ctx.beginPath(); ctx.arc(dx, dy, trap.radius * mapScale, 0, Math.PI * 2); ctx.stroke();
                }
            });
        }

        // Draw Player (King Myco Green)
        ctx.save();
        ctx.translate(centerX, centerY);
        const rotation = this.player.group.rotation.y;
        ctx.rotate(-rotation); // Inverse rotation for top-down
        
        ctx.fillStyle = '#39FF14';
        ctx.shadowBlur = 10; ctx.shadowColor = '#39FF14';
        
        // Triangle for direction (Points UP)
        ctx.beginPath();
        ctx.moveTo(0, -8); ctx.lineTo(-5, 4); ctx.lineTo(5, 4);
        ctx.closePath();
        ctx.fill();
        
        ctx.restore();
    }

    spawnGhost() {
        const rankings = this.leaderboard.getThronecapRankings();
        const bestRun = rankings[0]; // Global best
        if (bestRun && bestRun.path) {
            this.ghost = new Player3D(this.scene, this.camera, true);
            this.ghostPath = bestRun.path;
            this.ghost.setClan(bestRun.clan);
            this.showGlobalNotification(`SPEEDRUN GHOST ACTIVE: ${bestRun.name}'s World Record`, '#00ffff');
        }
    }

    updateGhost() {
        if (!this.ghost || !this.ghostPath || !this.thronecapStartTime) return;
        
        const elapsed = (Date.now() - this.thronecapStartTime) / 1000;
        // Find nearest path node
        // Path is recorded every 0.1s
        const index = Math.floor(elapsed * 10);
        if (index < this.ghostPath.length) {
            const node = this.ghostPath[index];
            this.ghost.group.position.set(node.x, node.y, node.z);
            this.ghost.group.rotation.y = node.ry;
            this.ghost.group.visible = true; // Ensure visibility when playing
        } else {
            this.ghost.group.visible = false;
        }
    }

    animate() {
        requestAnimationFrame(() => this.animate());
        this._frame = (this._frame || 0) + 1;
        
        // Hit Stop Logic
        if (this.hitStopFrames > 0) {
            this.hitStopFrames--;
            // V1.9.27 - Mobile path bypasses the composer.
            if (this.composer) this.composer.render();
            else this.renderer.render(this.scene, this.camera);
            return;
        }

        this.updateDayCycle();
        this.simulateGlobalActivity();

        // V1.9.7 - Enemies are always visible so the player can read threats day or night.
        this.enemies.forEach(enemy => {
            if (enemy.mesh) enemy.mesh.visible = true;
        });

        // Sunday 8pm CST Reset Check
        const lb = this.leaderboard.data;
        const now = new Date();
        const currentCST = new Date(now.toLocaleString("en-US", {timeZone: "America/Chicago"}));
        
        if (currentCST.getDay() === 0 && currentCST.getHours() === 20 && currentCST.getMinutes() === 0 && currentCST.getSeconds() < 2) {
            if (this.leaderboard.data.weeklyGlobalBurned > 0) {
                this.leaderboard.resetWeeklyBurns();
                this.showFloatingText("WEEKLY BURN RESET!", 0xff0000, true);
            }
        }

        // Apply Weather Status Effects to Player/Enemies
        if (this.currentWeather === 'SPORE_RAIN' && this.weatherIntensity > 0.5) {
            // Spore rain makes restoration easier (increased XP)
            if (Math.random() > 0.99 && this.gameState === 'PLAYING') {
                this.progression.addXp(1); // Tiny passive XP gain in spore rain
            }
        }

        // V1.9.8 Free Stride - Update the controls HUD a few times a second (visually identical).
        // V1.9.22 - Input debug HUD removed.
        // if ((this._frame & 7) === 0) this.updateInputDebugHud();

        if (this.gameState === 'PLAYING' && this.player && !this.isPaused) {
            this.player.update(this.collidables, this.platforms);

            // Roblox Camera Logic
            this.cameraDist = THREE.MathUtils.lerp(this.cameraDist, this.cameraTargetDist, 0.1);

            // V1.9.9 Free Stride - Camera always rides behind King Myco unless the user is actively
            // right-mouse-dragging to look around. The desired yaw mirrors the player's facing so the
            // camera sits OPPOSITE the direction he's walking.
            const playerYaw = this.player.group.rotation.y;
            const desiredYaw = playerYaw + Math.PI;
            if (!this.isRightMouseDown) {
                // Shortest-arc lerp toward the desired yaw.
                let delta = desiredYaw - this.cameraYaw;
                delta = Math.atan2(Math.sin(delta), Math.cos(delta));
                this.cameraYaw += delta * 0.05;
                // Also gently return the pitch to the default behind-and-above angle.
                this.cameraPitch = THREE.MathUtils.lerp(this.cameraPitch, -0.35, 0.03);
            }

            const cameraX = this.player.group.position.x + Math.sin(this.cameraYaw) * Math.cos(this.cameraPitch) * this.cameraDist;
            const cameraY = this.player.group.position.y - Math.sin(this.cameraPitch) * this.cameraDist + 1.5;
            const cameraZ = this.player.group.position.z + Math.cos(this.cameraYaw) * Math.cos(this.cameraPitch) * this.cameraDist;
            
            this.camera.position.set(cameraX, cameraY, cameraZ);
            this.camera.lookAt(this.player.group.position.x, this.player.group.position.y + 1.5, this.player.group.position.z);

            // Update Spatial Audio Listener
            const listener = TONE.getListener();
            listener.positionX.value = this.camera.position.x;
            listener.positionY.value = this.camera.position.y;
            listener.positionZ.value = this.camera.position.z;
            
            const forward = new THREE.Vector3(0, 0, -1).applyQuaternion(this.camera.quaternion);
            const up = new THREE.Vector3(0, 1, 0).applyQuaternion(this.camera.quaternion);
            listener.forwardX.value = forward.x;
            listener.forwardY.value = forward.y;
            listener.forwardZ.value = forward.z;
            listener.upX.value = up.x;
            listener.upY.value = up.y;
            listener.upZ.value = up.z;

            // V1.9.10 perf: throttle DOM-heavy HUD work to every 4 frames (~15 Hz at 60fps),
            // and the minimap canvas redraw to every 6 frames. Both are visually identical.
            if ((this._frame & 3) === 0) this.updateDynamicHud();
            if ((this._frame % 6) === 0) this.drawMinimap();

            // Animate Landmarks
            if (this.landmarksGroup) {
                this.landmarksGroup.children.forEach(landmark => {
                    landmark.children.forEach(child => {
                        if (child instanceof THREE.Mesh || child instanceof THREE.Group) {
                            if (child.geometry instanceof THREE.IcosahedronGeometry || child.geometry instanceof THREE.TorusKnotGeometry) {
                                child.rotation.y += 0.01;
                                child.rotation.x += 0.005;
                            }
                        }
                    });
                });

                // Update Network Heart Particles and Audio
                if (this.heartParticles) {
                    const posAttr = this.heartParticles.geometry.attributes.position;
                    const vels = this.heartParticles.userData.velocities;
                    const life = this.heartParticles.userData.life;
                    
                    for (let i = 0; i < life.length; i++) {
                        posAttr.array[i * 3] += vels[i * 3];
                        posAttr.array[i * 3 + 1] += vels[i * 3 + 1];
                        posAttr.array[i * 3 + 2] += vels[i * 3 + 2];
                        
                        life[i] -= 0.005;
                        if (life[i] <= 0) {
                            const angle = Math.random() * Math.PI * 2;
                            const dist = 3 + Math.random() * 4;
                            posAttr.array[i * 3] = Math.cos(angle) * dist;
                            posAttr.array[i * 3 + 1] = 5;
                            posAttr.array[i * 3 + 2] = Math.sin(angle) * dist;
                            life[i] = 1.0;
                        }
                    }
                    posAttr.needsUpdate = true;
                }

                if (this.heartPanner) {
                    // Update panner with heart's world position if needed
                    // For now, it's fixed at (0, 10, -40) relative to Sporewood origin
                }
            }
            
            // Speedrun Path Recording
            if (this.currentRegion.id === 'thronecap') {
                this.pathSampleTimer++;
                if (this.pathSampleTimer >= 6) { // Every 0.1s at 60fps
                    this.pathSampleTimer = 0;
                    this.currentRunPath.push({
                        x: this.player.group.position.x,
                        y: this.player.group.position.y,
                        z: this.player.group.position.z,
                        ry: this.player.group.rotation.y
                    });
                }
                this.updateGhost();
            }

            // Update Hazards
            this.hazards.forEach(h => h.update(this.player));

            // Update Citadel Gate
            if (this.citadelGate) {
                this.citadelGate.update();
                const gateDist = this.player.group.position.distanceTo(this.citadelGate.position);
                if (gateDist < 6 && !this.citadelGate.isUnlocked) {
                    let prompt = "";
                    if (this.citadelGate.state === 'BLUE') prompt = "OFFER BLUE SPORES (50) [E]";
                    else if (this.citadelGate.state === 'GOLD') prompt = "OFFER GOLD SPORES (5) [E]";
                    else if (this.citadelGate.state === 'MAGIC') prompt = "CAST CROWNFLARE MAGIC";

                    this.showProximityPrompt(this.citadelGate.mesh, prompt);

                    if (this.player.keys.interact) {
                        const p = this.progression.data;
                        if (this.citadelGate.state === 'BLUE' && p.blueSpores >= 50) {
                            p.blueSpores -= 50;
                            this.citadelGate.advanceState();
                            this.uiSynth.triggerAttackRelease("C4", "8n");
                            this.showFloatingText("SPORES ACCEPTED", 0x00ffff);
                            this.updateHud();
                        } else if (this.citadelGate.state === 'GOLD' && p.goldenSpores >= 5) {
                            p.goldenSpores -= 5;
                            this.citadelGate.advanceState();
                            this.uiSynth.triggerAttackRelease("G4", "8n");
                            this.showFloatingText("GOLD ACCEPTED", 0xffff00);
                            this.updateHud();
                        } else if (this.citadelGate.state !== 'MAGIC') {
                            this.showFloatingText("INSUFFICIENT RESOURCES", 0xff0000);
                        }
                        this.player.keys.interact = false;
                    }
                }

                // Magic stage check
                if (this.citadelGate.state === 'MAGIC') {
                    this.player.projectiles.forEach(proj => {
                        if (proj.isCrownflare && proj.mesh.position.distanceTo(this.citadelGate.position) < 8) {
                            proj.deactivateCore();
                            this.citadelGate.advanceState();
                            this.showFloatingText("THRONE GATE OPENED!", 0x39FF14, true);
                            this.showBossDefeatEffect(this.citadelGate.position);
                            
                            // Play triumphant activation sound
                            this.gateActivationSynth.triggerAttackRelease(["C4", "E4", "G4", "C5"], "2n");
                            
                            // Spawn the final boss portal
                            const portal = new Portal3D(this.scene, this.citadelGate.position.clone().add(new THREE.Vector3(0,0,5)), 'thronecap', false);
                            portal.label.visible = false;
                            portal.ring.scale.setScalar(2);
                            this.portals.push(portal);
                        }
                    });
                }
            }

            // Update Buildings
            this.buildings.forEach(b => {
                b.update(this.player.group.position);
                if (this.player.group.position.distanceTo(b.mesh.position) < 8) {
                    this.showProximityPrompt(b.mesh, `OPEN ${b.type} (E)`);
                    if (this.player.keys.interact) {
                        this.handleBuildingInteraction(b);
                    }
                }
            });

            // Update Puzzle Pillars
            this.puzzlePillars.forEach(p => {
                p.update();
                if (this.player.group.position.distanceTo(p.mesh.position) < 3 && !this.isPuzzleSolved) {
                    this.showProximityPrompt(p.mesh, "TOGGLE SEQUENCE (E)");
                    if (this.player.keys.interact) {
                        p.toggle();
                        this.player.keys.interact = false; // Prevent multiple toggles
                        this.checkVoidlichenPuzzle();
                    }
                }
            });

            // Update Traps
            if (this.traps) {
                this.traps = this.traps.filter(trap => trap.update(this.enemies));
            }

            if (this.isInterior) {
                if (this.exitDoor && this.player.group.position.distanceTo(this.exitDoor.position) < 2) {
                    this.showProximityPrompt(this.exitDoor, "EXIT TOWER (E)");
                    if (this.player.keys.interact) this.exitTowerInterior();
                }
                if (this.cookingStation && this.player.group.position.distanceTo(this.cookingStation.position) < 3) {
                    this.showProximityPrompt(this.cookingStation, "COOKING STATION (E)");
                    if (this.player.keys.interact) this.showCookingMenu();
                }
                
                // Interaction: Bed
                if (this.placedBeds) {
                    this.placedBeds.forEach(bed => {
                        if (this.player.group.position.distanceTo(bed.position) < 3) {
                            this.showProximityPrompt(bed, "REST ON BED (E)");
                            if (this.player.keys.interact) this.restOnBed();
                        }
                    });
                }

                // Interaction: Chest
                if (this.placedChests) {
                    this.placedChests.forEach(chest => {
                        if (this.player.group.position.distanceTo(chest.position) < 2) {
                            this.showProximityPrompt(chest, "OPEN CHEST (E)");
                            if (this.player.keys.interact) this.showStorageMenu();
                        }
                    });
                }

                // Interaction: Weapon Rack
                if (this.placedWeaponRacks) {
                    this.placedWeaponRacks.forEach(rack => {
                        if (this.player.group.position.distanceTo(rack.position) < 2.5) {
                            this.showProximityPrompt(rack, "WEAPON RACK (E)");
                            if (this.player.keys.interact) this.showWeaponRackMenu();
                        }
                    });
                }

                // Interaction: Forge
                if (this.placedForges) {
                    this.placedForges.forEach(forge => {
                        if (this.player.group.position.distanceTo(forge.position) < 2.5) {
                            this.showProximityPrompt(forge, "MYCELIAL FORGE (E)");
                            if (this.player.keys.interact) this.showForgeMenu();
                        }
                    });
                }
            }

            // Interaction: NPCs
            this.npcs.forEach(npc => {
                npc.update(this.player.group.position);
                if (this.player.group.position.distanceTo(npc.mesh.position) < 4) {
                    this.showProximityPrompt(npc.mesh, `TALK TO ${npc.name} (E)`);
                    if (this.player.keys.interact) this.talkToNPC(npc);
                }
            });

            // V1.9.14 - Interaction: Boss Dungeon door. Inspectable from a wide ring so
            // the prompt fires before the player walks through the gateway.
            if (!this.isInterior && this.bossDungeon) {
                const d = this.bossDungeon;
                const dist = this.player.group.position.distanceTo(d.doorPos);
                if (dist < 6.5) {
                    const tag = d.opened ? `ENTER ARENA` : `🔒 INSPECT SEAL`;
                    const promptAnchor = d.barrier && d.barrier.visible ? d.barrier : d.runeBar;
                    this.showProximityPrompt(promptAnchor, `${tag}: ${d.cfg.bossName.toUpperCase()} (E)`);
                    if (this.player.keys.interact) {
                        this.player.keys.interact = false;
                        if (!d.opened) {
                            this.showBossDungeonRequirements();
                        }
                    }
                }
                // While sealed, prevent the player from crossing the barrier into the arena.
                if (!d.opened) {
                    const px = this.player.group.position.x;
                    const pz = this.player.group.position.z;
                    // Barrier is the line z = doorPos.z spanning ~x: [-3.5, +3.5].
                    if (pz > d.doorPos.z - 0.5 && pz < d.arenaPos.z + 11 && Math.abs(px - d.doorPos.x) < 3.5) {
                        // Push the player back to the door's outer side.
                        this.player.group.position.z = d.doorPos.z - 0.6;
                        if (!d._zapCooldown || Date.now() - d._zapCooldown > 800) {
                            d._zapCooldown = Date.now();
                            this.showFloatingText("THE SEAL REJECTS YOU", d.accent || 0xff5555, false);
                            try { this.impactSynth.triggerAttackRelease('16n'); } catch (_) {}
                        }
                    }
                }
            }

            // Interaction: Portals (always inspectable — shows region requirements checklist).
            if (!this.isInterior) {
                this.portals.forEach(portal => {
                    portal.update();
                    // V1.9.10 - Wider interact ring (5.5) so the prompt reliably fires before the
                    // player walks straight through the portal frame.
                    if (this.player.group.position.distanceTo(portal.mesh.position) < 5.5) {
                        const reg = CONFIG.REGIONS.find(r => r.id === portal.regionId);
                        const tag = portal.isLocked ? `🔒 INSPECT PORTAL` : `INSPECT PORTAL`;
                        this.showProximityPrompt(portal.mesh, `${tag}: ${reg ? reg.name : portal.regionId} (E)`);
                        if (this.player.keys.interact) {
                            this.player.keys.interact = false;
                            this.showPortalRequirements(portal);
                        }
                    }
                });
            }

            // Interaction: Chests
            this.chests.forEach(chest => {
                if (!chest.opened && this.player.group.position.distanceTo(chest.mesh.position) < 2.5) {
                    this.showProximityPrompt(chest.mesh, "OPEN CHEST (E)");
                    if (this.player.keys.interact) {
                        const loot = chest.open();
                        if (loot) this.processChestLoot(loot);
                    }
                }
            });

            const goalRadius = 4 * this.player.modifiers.goalRadiusMult;
            if (this.goal && this.player.group.position.distanceTo(this.goal.position) < goalRadius) { this.victory(); }

            // Dynamic Music check (Boss battle if in thronecap or many enemies)
            const bossMode = this.currentRegion.id === 'thronecap' || this.enemies.some(e => e.isBoss);
            if (bossMode && !this.inBossMusic) {
                this.inBossMusic = true;
                this.playEpicMusic('BOSS');
            } else if (!bossMode && this.inBossMusic) {
                this.inBossMusic = false;
                this.playEpicMusic('AUTO');
            }

            const deadEnemyProjectiles = new Set();
            const deadEnemies = new Set();

            // Update Enemy Projectiles
            this.enemyProjectiles = this.enemyProjectiles.filter(ep => {
                const alive = ep.update();
                if (!alive) return false;

                // Check collision with Player Shield
                if (this.player.hasFungalShield) {
                    const shieldWorldPos = new THREE.Vector3();
                    this.player.shieldGroup.getWorldPosition(shieldWorldPos);
                    if (ep.mesh.position.distanceTo(shieldWorldPos) < 1.0) {
                        this.showFloatingText("BLOCKED!", 0x00ffff);
                        const synth = new TONE.Synth({ volume: -15 }).toDestination();
                        synth.triggerAttackRelease("G2", "16n");
                        ep.destroy();
                        return false;
                    }
                }

                // Check collision with Player Body
                if (ep.mesh.position.distanceTo(this.player.group.position) < 1.2) {
                    this.player.takeDamage(1);
                    
                    // Specific Boss Projectile Effects
                    if (ep.isSilk) {
                        this.showFloatingText("TANGLED!", 0xffffff);
                        this.player.modifiers.speedMult *= 0.3; // Major slow
                        setTimeout(() => {
                            this.player.modifiers.speedMult /= 0.3; // Restore speed
                        }, 2000);
                    }

                    ep.destroy();
                    return false;
                }
                return true;
            });

            // V1.9.18 - Visual rot spread tick + per-projectile wand cleanse.
            this.updateRotSpread();
            this.player.projectiles.forEach(proj => this.tryCleanseWithProjectile(proj));
            // V1.9.20 - Light pool lifetimes + slow ambient cleanse inside their radius.
            this.updateLightPools();

            this.enemies.forEach((enemy) => {
                enemy.update(this.player.group.position);
                this.player.projectiles.forEach((proj) => {
                    // Check main fireball collision
                    if (proj.coreActive && proj.mesh.position.distanceTo(enemy.mesh.position) < 1.5) {
                        proj.deactivateCore();
                        const isCrit = proj.isCritical;
                        if (enemy.takeDamage(proj.damage || 1)) {
                            deadEnemies.add(enemy);
                        }
                        if (enemy === this.boss) this.updateHud();
                        if (isCrit) {
                            this.showCriticalImpact(enemy.mesh.position);
                        }
                    }

                    // Check trail particle collisions
                    proj.trailParticles.forEach(particle => {
                        if (particle.material.opacity > 0.1 && !particle.userData.hitEnemies.has(enemy)) {
                            if (particle.position.distanceTo(enemy.mesh.position) < 1.2) {
                                particle.userData.hitEnemies.add(enemy);
                                if (enemy.takeDamage(particle.userData.damage)) {
                                    deadEnemies.add(enemy);
                                }
                                // Small visual for trail hit
                                const hitColor = 0x39FF14;
                                particle.scale.set(1.5, 1.5, 1.5);
                                particle.material.color.setHex(0xffffff);
                            }
                        }
                    });
                });
            });

            // Cleanup
            deadEnemies.forEach(enemy => {
                const index = this.enemies.indexOf(enemy);
                if (index !== -1) {
                    if (enemy === this.boss) {
                        this.showFloatingText(`${this.currentRegion.bossName} DEFEATED!`, 0xffff00, true);
                        this.spawnDrops(enemy.mesh.position, true); // True for boss drops
                        this.boss = null;
                        this.updateHud();
                        
                        // Increment shards collected
                        this.progression.data.shardsCollected = (this.progression.data.shardsCollected || 0) + 1;
                        // V1.9.18 - Mark this region as conquered so the daily Rot Cycle
                        // will blight it overnight and require cleansing before progress.
                        if (this.currentRegion && this.currentRegion.id) {
                            this.progression.markConquered(this.currentRegion.id);
                        }
                        this.progression.save();

                        // Final Boss check
                        if (enemy.isFinalBoss) {
                            setTimeout(() => this.triggerNarrativeConclusion(), 2000);
                        }
                        
                        // Unlock next region logic
                        const currentIndex = CONFIG.REGIONS.findIndex(r => r.id === this.currentRegion.id);
                        if (currentIndex < CONFIG.REGIONS.length - 1) {
                            const nextRegion = CONFIG.REGIONS[currentIndex + 1];
                            this.progression.unlockRegion(nextRegion.id);
                        }
                    } else {
                        this.spawnDrops(enemy.mesh.position);
                    }
                    enemy.destroy();
                    this.enemies.splice(index, 1);
                }
            });

            this.collectibles.forEach((col, cIndex) => {
                col.update();
                if (col.mesh.position.distanceTo(this.player.group.position) < 2) {
                    if (col.type === 'XP') {
                        const xpGain = col.amount || 250;
                        this.showFloatingText(`+${xpGain} XP`, 0x39FF14);
                        if (this.progression.addXp(xpGain)) {
                            this.player.level = this.progression.data.level;
                            this.player.applyLevelStats();
                            this.player.levelUp();
                            this.showFloatingText("LEVEL UP!", 0xffff00, true);
                        }
                    } else if (col.type === 'LOOT') {
                        const amount = col.amount || 5;
                        this.progression.addSpores(amount, 0);
                        this.showFloatingText(`+${amount} Blue`, 0x00ffff);
                    } else if (col.type === 'GOLDEN_SPORE') {
                        const amount = col.amount || 1;
                        this.progression.addSpores(0, amount);
                        
                        // Update Golden Spore Quest
                        const qs = this.progression.data.quests.goldenSpore;
                        if (qs.active && qs.progress < qs.target) {
                            qs.progress = Math.min(qs.target, qs.progress + amount);
                            this.progression.save();
                            if (qs.progress >= qs.target) {
                                this.showFloatingText("QUEST COMPLETE!", 0x39FF14, true);
                            }
                        }
                        
                        this.showFloatingText(`+${amount} GOLD!`, 0xffff00);
                    } else if (col.type === 'INGREDIENT') {
                        const amount = col.amount || 1;
                        this.progression.addSpores(0, 0, amount);
                        this.showFloatingText(`+${amount} Ingredient`, 0xff5500);
                    } else if (col.type === 'POTION') {
                        this.progression.data.inventory.push('capPotion');
                        this.progression.save();
                        this.showFloatingText("+1 POTION!", 0xff0000);
                    } else if (col.type === 'BOMB') {
                        this.progression.data.inventory.push('sporeBomb');
                        this.progression.save();
                        this.showFloatingText("+1 BOMB!", 0x39FF14);
                    } else if (col.type === 'SALVE') {
                        this.progression.data.inventory.push('rotSalve');
                        this.progression.save();
                        this.showFloatingText("+1 SALVE!", 0x00ffff);
                    } else if (col.type === 'KEY_ITEM' && col.keyItemConfig) {
                        // V1.9.12 - Picking up a portal key item adds it to keyItems and immediately
                        // unlocks its target region so the portal becomes interactable.
                        const k = col.keyItemConfig;
                        this.progression.addKeyItem(k.id, 1);
                        this.progression.unlockRegion(k.portalRegion);
                        this.showFloatingText(`+ ${k.name.toUpperCase()}!`, k.color, true);
                        this.showFloatingText("PORTAL UNLOCKED!", 0xffff66, true);
                        // Refresh portals so the visual state (locked → unlocked) updates immediately.
                        this._refreshPortalsLockState();
                        // Triumphant sting
                        try {
                            const sting = new TONE.PolySynth({ volume: -8 }).toDestination();
                            sting.triggerAttackRelease(['C5', 'E5', 'G5', 'C6'], '4n');
                        } catch (_) {}
                    }
                    this.updateHud();
                    col.destroy();
                    this.collectibles.splice(cIndex, 1);
                    if (col.type !== 'KEY_ITEM') {
                        const synth = new TONE.Synth({ volume: -10 }).toDestination();
                        synth.triggerAttackRelease("C5", "16n");
                    }
                }
            });
            
        } else if (this.gameState === 'START_SCREEN' || this.gameState === 'PROLOGUE' || this.gameState === 'CLAN_SELECT') {
            const time = Date.now() * 0.0003;
            this.camera.position.x = Math.sin(time) * 50; this.camera.position.z = Math.cos(time) * 50;
            this.camera.position.y = 25; this.camera.lookAt(0, 5, 0);
        }
        if (this.goal) { this.goal.rotation.y += 0.05; this.goal.position.y += Math.sin(Date.now() * 0.002) * 0.02; }
        
        // Animate regional particles (Spores & Environmental Dust)
        if (this.particles) {
            const positions = this.particles.geometry.attributes.position.array;
            const vels = this.particles.userData.velocities;
            for (let i = 0; i < positions.length; i += 3) {
                positions[i] += vels[i];
                positions[i + 1] += vels[i + 1];
                positions[i + 2] += vels[i + 2];
                
                // Reset particles that go too low
                if (positions[i + 1] < 0) {
                    positions[i + 1] = 50;
                    positions[i] = (Math.random() - 0.5) * 200;
                    positions[i + 2] = (Math.random() - 0.5) * 200;
                }
            }
            this.particles.geometry.attributes.position.needsUpdate = true;
        }

        // Update Post-processing
        // V1.9.27 - glitchIntensity still decays on mobile so any gameplay code
        // that reads it (e.g. damage feedback) stays consistent; only the actual
        // shader pass and composer render are skipped.
        this.glitchIntensity *= 0.95;
        if (this.glitchIntensity < 0.01) this.glitchIntensity = 0;
        if (this.glitchPass) {
            this.glitchPass.uniforms.amount.value = this.glitchIntensity;
            this.glitchPass.uniforms.time.value = performance.now() * 0.001;
        }

        if (this.composer) {
            this.composer.render();
        } else {
            this.renderer.render(this.scene, this.camera);
        }
    }

    showProximityPrompt(mesh, text) {
        if (!this.proximityPrompt) {
            this.proximityPrompt = document.createElement('div');
            this.proximityPrompt.style.cssText = `
                position: absolute;
                background: rgba(0, 0, 0, 0.7);
                border: 1px solid rgba(255, 255, 255, 0.4);
                color: white;
                padding: 4px 12px 4px 6px;
                border-radius: 20px;
                font-family: sans-serif;
                font-size: 12px;
                font-weight: bold;
                pointer-events: none;
                display: none;
                z-index: 1500;
                transform: translate(-50%, -50%);
                display: flex;
                align-items: center;
                gap: 8px;
                backdrop-filter: blur(8px);
                box-shadow: 0 4px 15px rgba(0,0,0,0.5);
                transition: left 0.1s, top 0.1s;
            `;
            this.proximityPrompt.innerHTML = `
                <div style="
                    width: 24px; height: 24px; 
                    background: white; color: black; 
                    border-radius: 50%; 
                    display: flex; align-items: center; justify-content: center;
                    font-size: 14px;
                    box-shadow: 0 0 8px white;
                ">E</div>
                <span id="proximity-text" style="text-shadow: 1px 1px 2px black;"></span>
            `;
            document.getElementById('game-container').appendChild(this.proximityPrompt);
        }

        const vector = new THREE.Vector3();
        mesh.getWorldPosition(vector);
        vector.y += 2.5; // Position above object
        vector.project(this.camera);

        let x = (vector.x * 0.5 + 0.5) * window.innerWidth;
        let y = -(vector.y * 0.5 - 0.5) * window.innerHeight;

        // --- HUD AVOIDANCE LOGIC ---
        // Avoid Top Right (Clock & Notifications)
        const trLimitX = window.innerWidth - 350;
        const trLimitY = 500;
        if (x > trLimitX && y < trLimitY) {
            // Push it to the left of the notification area
            x = trLimitX - 50;
        }

        // Avoid Top Left (Restoration HUD)
        const tlLimitX = 250;
        const tlLimitY = 150;
        if (x < tlLimitX && y < tlLimitY) {
            // Push it to the right of the restoration HUD
            x = tlLimitX + 50;
        }

        // Hide if behind camera or off screen
        if (vector.z > 1 || x < 0 || x > window.innerWidth || y < 0 || y > window.innerHeight) {
            this.proximityPrompt.style.display = 'none';
        } else {
            this.proximityPrompt.style.display = 'flex';
            this.proximityPrompt.style.left = `${x}px`;
            this.proximityPrompt.style.top = `${y}px`;
            document.getElementById('proximity-text').innerText = text;
        }

        clearTimeout(this.proximityTimeout);
        this.proximityTimeout = setTimeout(() => {
            this.proximityPrompt.style.display = 'none';
        }, 100);
    }

    talkToNPC(npc) {
        if (this.gameState === 'DIALOGUE') return;
        // V1.9.21 - Spore Collector mode: NPCs only offer a friendly wave. No quests.
        if (this.progression.isCollectorMode()) {
            this.gameState = 'DIALOGUE';
            const greetings = [
                "Hello, harvester! The spores are plentiful today.",
                "Wander gently — the Mycoverse is yours.",
                "A bright cap to you, traveler.",
                "Mind the morning dew on the gold ones.",
                "No quests today. Just spores. Enjoy them."
            ];
            const line = greetings[Math.floor(Math.random() * greetings.length)];
            this._renderShopkeeperNode(
                { title: npc.name || 'Friend', color: '#aa44ff' },
                line,
                [{ label: '> WAVE BACK', action: () => window.closeDialogue() }]
            );
            return;
        }
        this.gameState = 'DIALOGUE';
        this.activeDialogue = npc.dialogue || (npc.config.npc ? npc.config.npc.dialogue : null);
        
        if (this.activeDialogue) {
            let startNode = this.activeDialogue.root;
            
            // Dynamic dialogue for Elder Spore based on shards
            if (npc.name === 'Elder Spore') {
                const shards = this.progression.data.shardsCollected || 0;
                if (shards >= 7) startNode = this.activeDialogue.end_game || startNode;
                else if (shards >= 3) startNode = this.activeDialogue.mid_game || startNode;
                else if (shards >= 1) startNode = this.activeDialogue.progress1 || startNode;
            } else if (npc.name === 'Nov Sprig') {
                // If Moldjaw Sentinel is defeated (shard 1 is collected and we are in sporewood)
                const shards = this.progression.data.shardsCollected || 0;
                if (shards >= 1) startNode = this.activeDialogue.after_boss || startNode;
            }
            
            this.showDialogue(startNode, npc.name);
        } else {
            this.gameState = 'PLAYING';
        }
    }

    // V1.9.9 Free Stride - Shopkeeper-style dialogue for SHOP / INN / STORAGE buildings.
    handleBuildingInteraction(b) {
        if (this.gameState === 'DIALOGUE') return;
        this.player.keys.interact = false;
        // V1.9.21 - Spore Collector mode closes all village commerce. Show a polite "closed".
        if (this.progression.isCollectorMode()) {
            this.gameState = 'DIALOGUE';
            const closedLines = {
                SHOP:    "The merchant has stepped out. Come back when you choose a quest.",
                SAVE:    "The inn is quiet today. Sleep is for those who battle the Rot.",
                STORAGE: "The vault sleeps in collector mode — no need to stash what you'll burn."
            };
            const titles = { SHOP: 'Merchant Spore', SAVE: 'Innkeeper Fungus', STORAGE: 'Vaultkeeper Mossbeard' };
            this._renderShopkeeperNode(
                { title: titles[b.type] || 'Shopkeeper', color: '#888888' },
                (closedLines[b.type] || "Closed for now.") + " 🌙",
                [{ label: '> LEAVE', action: () => window.closeDialogue() }]
            );
            return;
        }
        this.showShopkeeperDialogue(b.type);
    }

    showShopkeeperDialogue(type) {
        this.gameState = 'DIALOGUE';
        const profiles = {
            SHOP: {
                title: 'Merchant Spore',
                color: '#66ff88',
                greeting: "Ah, King Myco! Welcome, welcome. Spores burn bright today — what'll you have? Potions? Salves? A little blessing for the road?",
                options: [
                    { label: '> BROWSE WARES',     action: () => this.showShop() },
                    { label: '> WHAT DO YOU SELL?', next: { text: "Salves to mend your cap, bombs to scatter the Rot, and rare ingredients for the Alchemy Pot. My prices are fair... mostly." } },
                    { label: '> FAREWELL',         action: () => window.closeDialogue() }
                ]
            },
            SAVE: {
                title: 'Innkeeper Fungus',
                color: '#ffe066',
                greeting: "Welcome to the Spore & Stein, your majesty. A bed by the hearth is always kept warm for the King. Rest, and the network will hold steady while you dream.",
                options: [
                    { label: '> REST AND SAVE',    action: () => { this.player.hp = this.player.maxHp; this.progression.save(); this.updateHud(); this.showFloatingText('FULLY RESTED & PROGRESS SAVED!', 0x39FF14, true); window.closeDialogue(); } },
                    { label: '> ANY NEWS?',        next: { text: "The deeper regions stir. They say the Rot has taken root again in the Crystalcap caves. Be careful out there, your majesty." } },
                    { label: '> FAREWELL',         action: () => window.closeDialogue() }
                ]
            },
            STORAGE: {
                title: 'Vaultkeeper Mossbeard',
                color: '#88ccff',
                greeting: "Your royal stash is safe under my watch, sire. Stow what weighs you down, retrieve what you need. The vault never sleeps.",
                options: [
                    { label: '> ACCESS VAULT',     action: () => this.showStorageMenu() },
                    { label: '> EXPLAIN STORAGE',  next: { text: "Anything you store here stays here, even between regions. Useful for hauling loot you can't carry into a boss fight." } },
                    { label: '> FAREWELL',         action: () => window.closeDialogue() }
                ]
            }
        };
        const profile = profiles[type] || profiles.SHOP;
        this._renderShopkeeperNode(profile, profile.greeting, profile.options);
    }

    _renderShopkeeperNode(profile, text, options) {
        this.uiOverlay.innerHTML = `
            <div style="pointer-events: auto; background: rgba(0,0,0,0.92); padding: 30px; border: 2px solid ${profile.color}; width: 85%; max-width: 600px; text-align: left; box-shadow: 0 0 24px ${profile.color}55;">
                <h3 style="color: ${profile.color}; margin-bottom: 20px; font-size: 14px;">${profile.title}</h3>
                <p style="font-size: 12px; line-height: 1.8; margin-bottom: 28px; color: #eee;">${text}</p>
                <div style="display: flex; flex-direction: column; gap: 10px;">
                    ${options.map((opt, i) => `
                        <button onclick="window.__shopkeeperPick(${i})" style="padding: 10px; background: #1a1a1a; border: 1px solid ${profile.color}; color: white; text-align: left; font-size: 11px; cursor: pointer;">
                            ${opt.label}
                        </button>
                    `).join('')}
                </div>
            </div>
        `;
        window.__shopkeeperPick = (i) => {
            const opt = options[i];
            if (opt.action) { opt.action(); return; }
            if (opt.next) {
                this._renderShopkeeperNode(profile, opt.next.text, [
                    { label: '> BACK', action: () => this._renderShopkeeperNode(profile, profile.greeting, profile.options) }
                ]);
            }
        };
    }

    // V1.9.9 Free Stride - Portal requirements checklist UI. Lists what King Myco needs to enter.
    showPortalRequirements(portal) {
        if (this.gameState === 'DIALOGUE') return;
        // V1.9.21 - Spore Collector mode bypasses the checklist entirely: tap the portal,
        // step through. Every region is open to harvesters.
        if (this.progression.isCollectorMode()) {
            this.enterPortal(portal.regionId);
            return;
        }
        this.gameState = 'DIALOGUE';
        this.player.keys.interact = false;

        const reg = CONFIG.REGIONS.find(r => r.id === portal.regionId) || { name: 'Unknown', accent: 0x00ffff };
        const accentHex = '#' + reg.accent.toString(16).padStart(6, '0');
        const p = this.progression.data;
        const shards = p.shardsCollected || 0;
        const isUnlocked = (p.unlockedRegions || []).includes(portal.regionId);

        // Build requirement checklist - what King Myco needs to enter this portal.
        const requirements = this._buildPortalRequirements(portal.regionId, p);

        const reqRows = requirements.map(r => `
            <div style="display:flex; align-items:center; gap:10px; padding: 8px 4px; border-bottom: 1px solid #222;">
                <div style="width:22px; height:22px; border-radius: 4px; border: 1px solid ${r.met ? '#39FF14' : '#666'}; background: ${r.met ? '#39FF14' : 'transparent'}; color: #000; font-weight: bold; display:flex; align-items:center; justify-content:center; font-size: 14px;">
                    ${r.met ? '✓' : ''}
                </div>
                <div style="flex:1; font-size: 11px; color: ${r.met ? '#cfc' : '#ccc'}; text-decoration: ${r.met ? 'line-through' : 'none'};">
                    ${r.label}
                    ${r.hint ? `<div style="font-size: 9px; color: #888; margin-top: 2px; text-decoration: none; font-style: italic;">${r.hint}</div>` : ''}
                </div>
                <div style="font-size: 10px; color: ${r.met ? '#39FF14' : '#888'}; white-space: nowrap;">
                    ${r.progress || ''}
                </div>
            </div>
        `).join('');

        this.uiOverlay.innerHTML = `
            <div style="pointer-events: auto; background: rgba(0,0,0,0.95); padding: 28px; border: 2px solid ${accentHex}; width: 88%; max-width: 560px; text-align: left; box-shadow: 0 0 30px ${accentHex}77;">
                <div style="display:flex; align-items:center; justify-content:space-between; margin-bottom: 6px;">
                    <h3 style="color: ${accentHex}; font-size: 14px; margin: 0;">PORTAL: ${reg.name.toUpperCase()}</h3>
                    <div style="font-size: 10px; padding: 4px 10px; border-radius: 12px; background: ${isUnlocked ? '#0a3' : '#a30'}; color: white;">
                        ${isUnlocked ? 'UNLOCKED' : 'LOCKED'}
                    </div>
                </div>
                <p style="font-size: 11px; color: #aaa; font-style: italic; margin-bottom: 18px;">${reg.subtitle || ''}</p>

                <div style="font-size: 11px; color: ${accentHex}; margin-bottom: 8px;">— REQUIREMENTS —</div>
                <div style="margin-bottom: 20px;">${reqRows}</div>

                <div style="font-size: 10px; color: #888; margin-bottom: 18px;">
                    Shards Collected: <span style="color: #ffff66;">${shards} / 7</span>
                    &nbsp;·&nbsp; Region Boss: <span style="color: #ff8888;">${reg.bossName || '—'}</span>
                </div>

                <div style="display: flex; gap: 10px;">
                    ${isUnlocked
                        ? `<button onclick="window.__portalEnter()" style="flex:1; padding: 12px; background: ${accentHex}; color: black; border: none; font-weight: bold; font-size: 12px; cursor: pointer;">ENTER PORTAL</button>`
                        : `<button disabled style="flex:1; padding: 12px; background: #222; color: #666; border: 1px dashed #444; font-size: 12px;">SEALED — COMPLETE REQUIREMENTS</button>`
                    }
                    <button onclick="window.closeDialogue()" style="padding: 12px 18px; background: #1a1a1a; color: white; border: 1px solid #444; font-size: 11px; cursor: pointer;">LEAVE</button>
                </div>
            </div>
        `;

        window.__portalEnter = () => {
            window.closeDialogue();
            this.enterPortal(portal.regionId);
        };
    }

    _buildPortalRequirements(regionId, p) {
        const shards = p.shardsCollected || 0;
        const unlocked = (p.unlockedRegions || []).includes(regionId);
        const keyItems = p.keyItems || {};

        // V1.9.12 - The new gate is the region-specific portal key item. Boss kills surface it as
        // a glowing world-pickup; collecting it sets `unlockedRegions` for that region. The label
        // shows what King Myco needs to find and who drops it.
        const keyRow = (regionId) => {
            const cfg = (CONFIG.PORTAL_KEYS || {})[regionId];
            if (!cfg) return null;
            const have = (keyItems[cfg.id] || 0) > 0 || unlocked;
            return {
                label: `Acquire the ${cfg.name}`,
                hint:  `Dropped by ${cfg.droppedBy}`,
                met:   have,
                progress: have ? '✓ in inventory' : 'Not yet found'
            };
        };

        const bossRow = (bossName, prevRegionName) => ({
            label: `Defeat ${bossName} (${prevRegionName})`,
            met:   unlocked,
            progress: unlocked ? 'Done' : 'Pending'
        });

        const shardRow = (n) => ({
            label: `Reclaim ${n} Crown Shard${n === 1 ? '' : 's'}`,
            met:   shards >= n,
            progress: `${Math.min(shards, n)}/${n}`
        });

        const map = {
            region8:    [{ label: 'Return to King\'s Sanctuary', met: true, progress: 'Always Open' }],
            sporewood:  [keyRow('sporewood'), { label: 'Begin your quest', met: true, progress: 'Tutorial' }],
            crystalcap: [bossRow('Moldjaw Sentinel',  'Sporewood'),  keyRow('crystalcap'), shardRow(1)],
            ambermycel: [bossRow('Shardcap Warden',   'Crystalcap'), keyRow('ambermycel'), shardRow(2)],
            silkspore:  [bossRow('Bogbelly Myconid',  'Ambermycel'), keyRow('silkspore'),  shardRow(3)],
            emberstem:  [bossRow('Widowcap Weaver',   'Silkspore'),  keyRow('emberstem'),  shardRow(4)],
            voidlichen: [bossRow('Cinderstalk Brute', 'Emberstem'),  keyRow('voidlichen'), shardRow(5)],
            thronecap:  [bossRow('Nullspore Oracle',  'Voidlichen'), keyRow('thronecap'),  shardRow(6),
                         { label: 'Accept your fate as the true King', met: !!p.clan, progress: p.clan ? 'Sworn' : 'Choose a Clan' }]
        };
        return (map[regionId] || [{ label: 'Find your way to this realm', met: unlocked, progress: '' }]).filter(Boolean);
    }

    // V1.9.12 - When a portal's underlying lock state changes (e.g. key item picked up), rebuild
    // the affected portals in place so visuals (color, glow, label, ring) flip from locked to unlocked.
    _refreshPortalsLockState() {
        if (!this.portals || !this.portals.length) return;
        const unlocked = this.progression.data.unlockedRegions || [];
        const scene = this.scene;
        for (let i = 0; i < this.portals.length; i++) {
            const old = this.portals[i];
            const shouldBeLocked = !unlocked.includes(old.regionId);
            if (old.isLocked === shouldBeLocked) continue;
            const pos = old.mesh.position.clone();
            pos.y = 0; // Portal3D internally lifts to y=4.5
            const requirementText = old.requirementText || '';
            old.destroy();
            const fresh = new Portal3D(scene, pos, old.regionId, shouldBeLocked);
            fresh.requirementText = requirementText;
            this.portals[i] = fresh;
        }
    }

    processChestLoot(loot) {
        const p = this.progression.data;
        if (loot.type === 'BLUE') {
            this.progression.addSpores(loot.amount, 0);
            this.showFloatingText(`+${loot.amount} BLUE!`, 0x00ffff, true);
        } else if (loot.type === 'GOLD') {
            this.progression.addSpores(0, loot.amount);
            this.showFloatingText(`+${loot.amount} GOLD!`, 0xffff00, true);
        } else if (loot.type === 'INGREDIENT') {
            this.progression.addSpores(0, 0, loot.amount);
            this.showFloatingText(`+${loot.amount} INGREDIENTS!`, 0xff5500, true);
        } else if (loot.type === 'HEALTH') {
            this.player.hp = Math.min(this.player.maxHp, this.player.hp + loot.amount);
            this.showFloatingText(`HEALED +${loot.amount} HP!`, 0xff0000, true);
        } else if (loot.type === 'XP') {
            if (this.progression.addXp(loot.amount)) {
                this.player.level = this.progression.data.level;
                this.player.applyLevelStats();
                this.player.levelUp();
                this.showFloatingText("LEVEL UP!", 0xffff00, true);
            }
            this.showFloatingText(`+${loot.amount} XP!`, 0x39FF14, true);
        }
        
        this.updateHud();
        const synth = new TONE.PolySynth().toDestination();
        synth.triggerAttackRelease(["C4", "E4", "G4", "B4"], "4n");
    }

    showDialogue(node, npcName = null) {
        const name = npcName || (this.currentRegion.npc ? this.currentRegion.npc.name : 'Mushroom');
        this.uiOverlay.innerHTML = `
            <div style="pointer-events: auto; background: rgba(0,0,0,0.9); padding: 30px; border: 2px solid #39FF14; width: 80%; max-width: 600px; text-align: left;">
                <h3 style="color: #39FF14; margin-bottom: 20px;">${name}</h3>
                <p style="font-size: 12px; line-height: 1.8; margin-bottom: 30px;">${node.text}</p>
                <div style="display: flex; flex-direction: column; gap: 10px;">
                    ${node.options.map((opt, i) => `
                        <button onclick="window.selectDialogue(${i})" style="padding: 10px; background: #222; border: 1px solid #39FF14; color: white; text-align: left; font-size: 10px;">
                            > ${opt.label}
                        </button>
                    `).join('')}
                </div>
                <button onclick="window.closeDialogue()" style="margin-top: 20px; font-size: 10px; background: none; border: none; color: #666;">[CLOSE]</button>
            </div>
        `;

        window.selectDialogue = (index) => {
            const opt = node.options[index];
            if (opt.alignment) {
                this.progression.addAlignment(opt.alignment);
                this.player.alignment = this.progression.data.alignment;
                this.updateHud();
            }
            if (opt.next) {
                this.showDialogue(this.activeDialogue[opt.next], name);
            } else if (opt.action === 'briefing') {
                this.showShop();
            } else if (opt.action === 'rest') {
                this.player.hp = this.player.maxHp;
                this.updateHud();
                this.showFloatingText("FULLY RESTED!", 0x39FF14, true);
                window.closeDialogue();
            } else if (opt.action === 'enter_tower') {
                this.enterTowerInterior();
                window.closeDialogue();
            } else if (opt.action === 'show_burn_pit') {
                this.showBurnPitMenu();
            } else if (opt.action === 'upgrade_home') {
                if (this.progression.data.goldenSpores >= 10) {
                    this.progression.data.goldenSpores -= 10;
                    this.progression.data.home.level++;
                    this.progression.save();
                    this.showFloatingText("TOWER EXPANDED!", 0xffff00, true);
                    location.reload(); // Reload to see new tower
                } else {
                    this.showFloatingText("NEED 10 GOLD SPORES!", 0xff0000);
                }
            } else if (opt.action === 'met_chronicler') {
                this.progression.data.metChronicler = true;
                this.progression.save();
                if (opt.next) this.showDialogue(this.activeDialogue[opt.next], name);
            } else if (opt.action === 'met_ghost') {
                this.progression.data.metNetworkGhost = true;
                this.progression.save();
                if (opt.next) this.showDialogue(this.activeDialogue[opt.next], name);
            } else if (opt.action === 'hub') {
                this.enterPortal('region8');
            } else {
                window.closeDialogue();
            }
        };

        window.closeDialogue = () => {
            this.gameState = 'PLAYING';
            this.startGameplay();
        };
    }

    showShop() {
        this.uiOverlay.innerHTML = `
            <div style="pointer-events: auto; background: rgba(0,0,0,0.95); padding: 30px; border: 2px solid #ffff00; width: 85%; max-width: 800px;">
                <h2 style="color: #ffff00; margin-bottom: 20px; font-size: 18px;">REGION SHOP - ${this.currentRegion.name}</h2>
                <div style="display: flex; gap: 20px; margin-bottom: 20px;">
                    <div style="flex: 1;">
                        <p style="color: #39FF14; font-size: 10px; margin-bottom: 10px;">BLUE: ${this.progression.data.blueSpores} | GOLD: ${this.progression.data.goldenSpores}</p>
                        <div style="max-height: 400px; overflow-y: auto;">
                            ${CONFIG.SUPPLIES.map(item => `
                                <div style="background: #111; padding: 10px; border: 1px solid #333; margin-bottom: 10px;">
                                    <p style="font-size: 10px; color: #00ffff;">${item.name}</p>
                                    <p style="font-size: 8px; color: #888; margin: 5px 0;">${item.desc}</p>
                                    <button onclick="window.buyItem('${item.id}', 'SUPPLIES')" style="font-size: 8px; background: #39FF14; color: black; padding: 5px 10px; border: none;">
                                        BUY (${item.costBlue} Blue, ${item.costGold} Gold)
                                    </button>
                                </div>
                            `).join('')}
                            ${CONFIG.WEAPONS.map(item => `
                                <div style="background: #111; padding: 10px; border: 1px solid #333; margin-bottom: 10px;">
                                    <p style="font-size: 10px; color: #ffaa00;">${item.name}</p>
                                    <p style="font-size: 8px; color: #888; margin: 5px 0;">${item.desc} (DMG: ${item.damage})</p>
                                    <button onclick="window.buyItem('${item.id}', 'WEAPONS')" style="font-size: 8px; background: #ffaa00; color: black; padding: 5px 10px; border: none;">
                                        BUY (${item.costBlue} Blue, ${item.costGold} Gold)
                                    </button>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                </div>
                <button onclick="window.closeDialogue()" style="padding: 10px; background: #ff0000; color: white; border: none; font-size: 10px;">CLOSE SHOP</button>
            </div>
        `;

        window.buyItem = (id, category) => {
            const list = category === 'SUPPLIES' ? CONFIG.SUPPLIES : CONFIG.WEAPONS;
            const item = list.find(i => i.id === id);
            if (this.progression.data.blueSpores >= item.costBlue && this.progression.data.goldenSpores >= item.costGold) {
                this.progression.data.blueSpores -= item.costBlue;
                this.progression.data.goldenSpores -= item.costGold;
                this.progression.data.inventory.push(id);
                this.progression.save();
                this.updateHud();
                this.showShop();
                const synth = new TONE.Synth().toDestination();
                synth.triggerAttackRelease("G4", "8n");
            }
        };
    }

    enterPortal(regionId) {
        // V1.9.21 - Spore Collector mode: every portal is open, no rot gating.
        if (this.progression.isCollectorMode()) {
            this.progression.data.currentRegionId = regionId;
            this.progression.data.playerPosition = null;
            this.progression.save();
            location.reload();
            return;
        }
        // V1.9.18 - Block progression while any conquered region still carries rot.
        // The hub (region8) and Mushroom Kingdom remain reachable so the player can
        // always return to safety, but every other portal seals until the wand
        // cleanses today's blight.
        const isSafe = regionId === 'region8' || regionId === 'mushroomKingdom';
        if (!isSafe && this.progression.hasPendingRot()) {
            const pending = this.progression.pendingRotRegions().map(id => {
                const r = CONFIG.REGIONS.find(rr => rr.id === id);
                return r ? r.name : id;
            }).join(', ');
            this.showFloatingText('TEND THE BLIGHT FIRST', 0xaa00ff, true);
            setTimeout(() => this.showFloatingText(`Rot remains in: ${pending}`, 0xaa00ff, false), 800);
            try { if (this.uiSynth) this.uiSynth.triggerAttackRelease('C3', '8n'); } catch (_) {}
            return;
        }
        this.progression.data.currentRegionId = regionId;
        this.progression.data.playerPosition = null; // Reset position for new region
        this.progression.save();
        location.reload(); 
    }

    spawnExplosionParticles(pos, color) {
        const count = 30;
        const geometry = new THREE.BufferGeometry();
        const positions = new Float32Array(count * 3);
        const vels = new Float32Array(count * 3);
        
        for (let i = 0; i < count; i++) {
            positions[i * 3] = pos.x;
            positions[i * 3 + 1] = pos.y + 1;
            positions[i * 3 + 2] = pos.z;
            
            const angle = Math.random() * Math.PI * 2;
            const speed = 0.2 + Math.random() * 0.5;
            vels[i * 3] = Math.cos(angle) * speed;
            vels[i * 3 + 1] = 0.5 + Math.random() * 0.5;
            vels[i * 3 + 2] = Math.sin(angle) * speed;
        }
        
        geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        const material = new THREE.PointsMaterial({ color: color, size: 0.6, transparent: true, opacity: 1 });
        const points = new THREE.Points(geometry, material);
        this.scene.add(points);
        
        let frames = 0;
        const maxFrames = 60;
        const animateExplosion = () => {
            frames++;
            const posArray = points.geometry.attributes.position.array;
            for (let i = 0; i < count; i++) {
                posArray[i * 3] += vels[i * 3];
                posArray[i * 3 + 1] += vels[i * 3 + 1];
                posArray[i * 3 + 2] += vels[i * 3 + 2];
                vels[i * 3 + 1] -= 0.02; // gravity
            }
            points.geometry.attributes.position.needsUpdate = true;
            points.material.opacity = 1 - (frames / maxFrames);
            
            if (frames < maxFrames) {
                requestAnimationFrame(animateExplosion);
            } else {
                this.scene.remove(points);
                points.geometry.dispose();
                points.material.dispose();
            }
        };
        animateExplosion();
    }

    spawnFootstepParticles(pos, regionId) {
        const count = 4;
        const geometry = new THREE.BufferGeometry();
        const positions = new Float32Array(count * 3);
        const vels = new Float32Array(count * 3);
        
        let color = 0x888888;
        let size = 0.3;
        
        if (regionId === 'crystalcap') color = 0x00ffff;
        else if (regionId === 'emberstem') color = 0xff5500;
        else if (regionId === 'sporewood') color = 0x39FF14;
        else if (regionId === 'voidlichen') color = 0xaa00ff;

        for (let i = 0; i < count; i++) {
            positions[i * 3] = pos.x + (Math.random() - 0.5) * 0.2;
            positions[i * 3 + 1] = pos.y;
            positions[i * 3 + 2] = pos.z + (Math.random() - 0.5) * 0.2;
            
            const angle = Math.random() * Math.PI * 2;
            const speed = 0.05 + Math.random() * 0.1;
            vels[i * 3] = Math.cos(angle) * speed;
            vels[i * 3 + 1] = 0.05 + Math.random() * 0.1;
            vels[i * 3 + 2] = Math.sin(angle) * speed;
        }
        
        geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        const material = new THREE.PointsMaterial({ color: color, size: size, transparent: true, opacity: 0.8 });
        const points = new THREE.Points(geometry, material);
        this.scene.add(points);
        
        let frames = 0;
        const maxFrames = 20;
        const animateFootstep = () => {
            frames++;
            const posArray = points.geometry.attributes.position.array;
            for (let i = 0; i < count; i++) {
                posArray[i * 3] += vels[i * 3];
                posArray[i * 3 + 1] += vels[i * 3 + 1];
                posArray[i * 3 + 2] += vels[i * 3 + 2];
                vels[i * 3 + 1] -= 0.005; // light gravity
            }
            points.geometry.attributes.position.needsUpdate = true;
            points.material.opacity = 0.8 * (1 - (frames / maxFrames));
            
            if (frames < maxFrames) {
                requestAnimationFrame(animateFootstep);
            } else {
                this.scene.remove(points);
                points.geometry.dispose();
                points.material.dispose();
            }
        };
        animateFootstep();
    }

    showBossDefeatEffect(pos) {
        // Grand fountain of particles
        const colors = [0x39FF14, 0x00ffff, 0xffff00, 0xff00ff];
        for (let i = 0; i < 4; i++) {
            setTimeout(() => {
                this.spawnExplosionParticles(pos, colors[i]);
                // impactSynth is a NoiseSynth — passing a note as the first arg makes Tone
                // interpret it as duration and pass null for time, which crashes inside
                // cancelAndHoldAtTime. NoiseSynth.triggerAttackRelease only takes a duration.
                try { this.impactSynth.triggerAttackRelease("4n"); } catch (_) {}
            }, i * 300);
        }

        // Add a temporary beacon of light
        const light = new THREE.PointLight(0xffffff, 10, 50);
        light.position.copy(pos).add(new THREE.Vector3(0, 5, 0));
        this.scene.add(light);
        
        // Animate beacon out
        let intensity = 10;
        const fadeLight = () => {
            intensity -= 0.1;
            light.intensity = intensity;
            if (intensity > 0) {
                requestAnimationFrame(fadeLight);
            } else {
                this.scene.remove(light);
            }
        };
        fadeLight();
    }

    spawnDrops(pos, isBoss = false) {
        const xpAmount = isBoss ? 2000 : 250;
        const xp = new Collectible3D(this.scene, pos.clone(), 'XP', null, xpAmount);
        this.collectibles.push(xp);

        // V1.9.12 - Portal key drops.
        // Boss kills: always drop the key for the *next* region (the one their kill unlocks).
        // Hub guards (region8): chance to drop the Mosswood Token that opens Sporewood as a
        // tutorial-friendly nudge into the world.
        const portalKeys = CONFIG.PORTAL_KEYS || {};
        if (isBoss) {
            const currentIndex = CONFIG.REGIONS.findIndex(r => r.id === this.currentRegion.id);
            const nextRegion = CONFIG.REGIONS[currentIndex + 1];
            const keyCfg = nextRegion ? portalKeys[nextRegion.id] : null;
            if (keyCfg) {
                const keyPos = pos.clone().add(new THREE.Vector3(0, 1.5, 0));
                const keyDrop = new Collectible3D(this.scene, keyPos, 'KEY_ITEM', null, 1, keyCfg);
                this.collectibles.push(keyDrop);
            }
        } else if (this.currentRegion.id === 'region8') {
            // Hub guards have a 30% chance to drop the Mosswood Token if the player hasn't got it.
            const tokenCfg = portalKeys.sporewood;
            const alreadyUnlocked = this.progression.data.unlockedRegions.includes('sporewood');
            if (tokenCfg && !alreadyUnlocked && !this.progression.hasKeyItem(tokenCfg.id) && Math.random() < 0.30) {
                const keyDrop = new Collectible3D(this.scene, pos.clone().add(new THREE.Vector3(0, 1.5, 0)), 'KEY_ITEM', null, 1, tokenCfg);
                this.collectibles.push(keyDrop);
            }
        }

        if (isBoss) {
            // Particle-rich reward effect
            this.showBossDefeatEffect(pos);

            // Boss always drops multiple gold spores
            for (let i = 0; i < 3; i++) {
                const angle = (i / 3) * Math.PI * 2;
                const offset = new THREE.Vector3(Math.cos(angle) * 3, 0, Math.sin(angle) * 3);
                const gold = new Collectible3D(this.scene, pos.clone().add(offset), 'GOLDEN_SPORE');
                this.collectibles.push(gold);
            }

            // Also drop a bunch of ingredients and loot
            for (let i = 0; i < 10; i++) {
                const angle = Math.random() * Math.PI * 2;
                const dist = 2 + Math.random() * 5;
                const offset = new THREE.Vector3(Math.cos(angle) * dist, 0, Math.sin(angle) * dist);
                const type = Math.random() > 0.5 ? 'INGREDIENT' : 'LOOT';
                const item = new Collectible3D(this.scene, pos.clone().add(offset), type, this.selectedClan);
                this.collectibles.push(item);
            }

            // High chance for consumables from bosses
            if (Math.random() > 0.2) {
                const types = ['POTION', 'BOMB', 'SALVE'];
                const type = types[Math.floor(Math.random() * types.length)];
                const consumable = new Collectible3D(this.scene, pos.clone().add(new THREE.Vector3(0, 1, 0)), type);
                this.collectibles.push(consumable);
            }

            // Dark Mycelius Finale Check
            if (this.currentRegion.id === 'thronecap') {
                this.triggerNarrativeConclusion();
            }
        } else {
            // Drop Spores or Ingredients
            const rand = Math.random();
            if (rand > 0.4) {
                const type = rand > 0.9 ? 'GOLDEN_SPORE' : (rand > 0.7 ? 'INGREDIENT' : 'LOOT');
                const loot = new Collectible3D(this.scene, pos.clone().add(new THREE.Vector3(0.5, 0, 0.5)), type, this.selectedClan);
                this.collectibles.push(loot);
            }

            // Rare chance for consumable from regular enemies (5%)
            if (Math.random() < 0.05) {
                const types = ['POTION', 'BOMB', 'SALVE'];
                const type = types[Math.floor(Math.random() * types.length)];
                const consumable = new Collectible3D(this.scene, pos.clone().add(new THREE.Vector3(-0.5, 0, -0.5)), type);
                this.collectibles.push(consumable);
            }
        }
    }

    checkVoidlichenPuzzle() {
        if (this.isPuzzleSolved) return;
        
        const isSolved = this.puzzlePillars.every(p => p.currentValue === p.targetValue);
        
        if (isSolved) {
            this.isPuzzleSolved = true;
            this.showFloatingText("LOGIC GATE RESTORED!", 0xaa00ff, true);
            this.uiSynth.triggerAttackRelease(["C5", "E5", "G5"], "2n");
            
            // Spawn a reward chest
            const chest = new Chest3D(this.scene, new THREE.Vector3(0, 0, 0));
            this.chests.push(chest);
            this.collidables.push(chest.mesh);
            
            // Particle burst
            this.showBurnEffect(100);
        }
    }

    triggerNarrativeConclusion() {
        this.gameState = 'FINALE';
        this.playEpicMusic('FINALE');
        
        const finalTime = this.thronecapStartTime ? (Date.now() - this.thronecapStartTime) / 1000 : 0;
        const playerName = this.walletAddress ? `Hero_${this.walletAddress.slice(-4)}` : "Anon_King";
        
        if (finalTime > 0) {
            const result = this.leaderboard.addThronecapTime(playerName, finalTime, this.selectedClan, this.currentRunPath);
            if (result.isTop10) {
                const clanColor = this.getClanColor(this.selectedClan);
                this.showGlobalNotification(`NEW THRONE CAP RECORD: ${playerName} (${this.selectedClan.toUpperCase()}) ranked #${result.rank} with ${finalTime.toFixed(2)}s!`, clanColor);
            }
        }
        
        this.uiOverlay.innerHTML = `
            <div style="pointer-events: auto; background: rgba(0,0,0,0.95); padding: 50px; border: 4px solid #39FF14; text-align: center; width: 80%; max-width: 800px; animation: fadeIn 2s; max-height: 90vh; overflow-y: auto;">
                <h1 class="neon-text" style="color: #39FF14; font-size: 32px; margin-bottom: 30px;">NETWORK RESTORED</h1>
                <p style="color: #fff; font-size: 14px; line-height: 2; margin-bottom: 40px;">
                    With the defeat of Dark Mycelius, the Rot begins to recede.<br>
                    The 7 shards of the Fungal Crown pulse with pure data once more.<br><br>
                    The Solana network heart stabilizes. The Mycoverse is saved.<br>
                    You have ascended, King Myco. The true Restoration has begun.
                </p>
                
                <div style="background: rgba(0,255,0,0.1); padding: 20px; border: 1px dashed #39FF14; margin-bottom: 20px;">
                    <p style="color: #39FF14; font-size: 12px; margin-bottom: 10px;">CITADEL COMPLETION TIME: <span style="color: #fff; font-weight: bold;">${finalTime.toFixed(2)}s</span></p>
                    <p style="color: #39FF14; font-size: 10px;">FINAL SCORE: ${this.progression.data.level * 1000 + this.progression.data.blueSpores} SP</p>
                    <p style="color: #ffff00; font-size: 10px;">$KINGMYCO ALLOCATION: ${Math.floor(this.progression.data.blueSpores / 10)} TOKENS</p>
                </div>

                <div style="margin-bottom: 30px;">
                    <h3 style="color: #39FF14; font-size: 14px; margin-bottom: 15px;">THRONE CAP LEADERNBOARD</h3>
                    <table style="width: 100%; border-collapse: collapse; font-size: 10px; color: #fff;">
                        <thead>
                            <tr style="border-bottom: 2px solid #39FF14;">
                                <th style="padding: 10px; text-align: left;">PLAYER</th>
                                <th style="padding: 10px; text-align: center;">CLAN</th>
                                <th style="padding: 10px; text-align: right;">TIME</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${this.leaderboard.getThronecapRankings().map((entry, i) => `
                                <tr style="border-bottom: 1px solid #222; background: ${entry.name === playerName ? 'rgba(57, 255, 20, 0.1)' : 'transparent'}">
                                    <td style="padding: 10px; text-align: left;">${i + 1}. ${entry.name}</td>
                                    <td style="padding: 10px; text-align: center; color: ${this.getClanColor(entry.clan)};">${entry.clan.toUpperCase()}</td>
                                    <td style="padding: 10px; text-align: right; color: #39FF14;">${entry.time.toFixed(2)}s</td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>

                <button onclick="location.reload()" style="padding: 15px 40px; background: #39FF14; color: black; border: none; font-family: inherit; font-size: 14px; cursor: pointer;">RETURN TO SANCTUARY</button>
            </div>
        `;
    }

    victory() {
        if (this.gameState === 'VICTORY') return;
        this.gameState = 'VICTORY';
        const timeTaken = (Date.now() - this.startTime) / 1000;
        const score = Math.max(10, Math.floor(1000 - timeTaken));
        const playerName = this.walletAddress ? `Hero_${this.walletAddress.slice(-4)}` : "Anon_King";
        
        // Collect stats for leaderboard
        const stats = {
            alignment: this.player.alignment,
            magicLearned: this.progression.data.inventory.length, // approximation
            bossesDefeated: this.progression.data.shardsCollected,
            blueCollected: this.progression.data.blueSpores,
            goldCollected: this.progression.data.goldenSpores
        };

        const result = this.leaderboard.addScore(playerName, score, this.selectedClan, stats);
        if (result.isTopScore) {
            this.showGlobalNotification(`NEW HIGH SCORE: ${playerName} (${this.selectedClan.toUpperCase()}) ranked #${result.rank} with ${score} SP!`, this.getClanColor(this.selectedClan));
        }
        const leveledUp = this.progression.addXp(score * 2);
        this.saveGame(); // Auto-save on victory

        this.uiOverlay.innerHTML = `
            <div style="background: rgba(0,0,0,0.9); padding: 50px; border: 4px solid #ffff00; border-radius: 15px; text-align: center; box-shadow: 0 0 40px #ffff00; pointer-events: auto;">
                <h1 class="neon-text" style="color: #ffff00; font-size: 32px; margin-bottom: 20px;">SPORE RESTORED! ${leveledUp ? '<br><span style="color:#39FF14; font-size:18px;">LEVEL UP!</span>' : ''}</h1>
                <p style="font-size: 14px; margin-bottom: 10px; color: #39FF14;">+${score * 2} XP Gained</p>
                <p style="font-size: 14px; margin-bottom: 20px; color: #ffff00;">Loot Collected: ${this.lootCount}</p>
                <p style="font-size: 18px; color: #39FF14; margin-bottom: 30px;">SCORE: ${score} SP</p>
                
                <div style="display: flex; gap: 20px; justify-content: center;">
                    <button onclick="location.reload()" style="padding: 15px 30px; background: #ffff00; border: none; color: black; font-size: 12px;">ASCEND AGAIN</button>
                    <button id="view-hall" style="padding: 15px 30px; background: #00ffff; border: none; color: black; font-size: 12px;">VIEW HALL</button>
                </div>
            </div>
        `;
        document.getElementById('view-hall').addEventListener('click', () => this.showLeaderboard());
    }
}

// V1.9.35 — Bulletproof bootstrap for mobile / in-app webviews (Telegram, etc.).
// Two problems we're solving:
//   1) On older iOS WebKit (Telegram's webview is roughly Safari 15-era and is
//      known to silently fail on certain ESM patterns), errors thrown during
//      module evaluation or in the Game3D constructor never reach the user —
//      they just see a black screen.
//   2) `new Game3D()` at module top level was running before DOMContentLoaded
//      in some cases, racing with #game-container being available.
//
// Fix: defer instantiation to DOMContentLoaded, wrap it in try/catch, and if
// ANYTHING throws, paint the error directly into the page so we stop flying
// blind on mobile. Also install global error handlers that surface async
// failures (rejected promises, runtime errors) as on-screen text.

const _showBootError = (where, err) => {
    try {
        // Build (or reuse) a top-most error panel.
        let panel = document.getElementById('boot-error-panel');
        if (!panel) {
            panel = document.createElement('div');
            panel.id = 'boot-error-panel';
            panel.style.cssText = [
                'position:fixed', 'top:0', 'left:0', 'right:0', 'bottom:0',
                'background:#0a0010', 'color:#ff7777',
                'font-family:monospace', 'font-size:12px', 'line-height:1.5',
                'padding:20px', 'overflow-y:auto',
                'z-index:2147483647', 'box-sizing:border-box',
                '-webkit-overflow-scrolling:touch'
            ].join(';');
            (document.body || document.documentElement).appendChild(panel);
        }
        const msg = (err && (err.stack || err.message)) || String(err);
        const block = document.createElement('div');
        block.style.cssText = 'margin-bottom:16px; padding:12px; border:1px solid #ff3344; border-radius:6px; background:rgba(255,0,0,0.08); white-space:pre-wrap; word-break:break-word;';
        block.innerHTML = `<div style="color:#ffcc00; font-weight:bold; margin-bottom:6px;">⚠ ${where}</div><div>${msg.replace(/</g, '&lt;')}</div>`;
        panel.appendChild(block);
        // Also log to console so check_runtime sees it.
        console.error('[BOOT ERROR]', where, err);
    } catch (_) { /* never let the error reporter throw */ }
};

window.addEventListener('error', (e) => {
    _showBootError('window.onerror: ' + (e.filename || 'unknown'), e.error || e.message);
});
window.addEventListener('unhandledrejection', (e) => {
    _showBootError('unhandled promise rejection', e.reason);
});

const _boot = () => {
    try {
        new Game3D();
    } catch (err) {
        _showBootError('Game3D constructor', err);
    }
};

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', _boot, { once: true });
} else {
    // DOM is already parsed (which is the case when this module finishes loading
    // since modules are deferred by default) — boot on the next microtask so
    // module evaluation can finish first.
    Promise.resolve().then(_boot);
}