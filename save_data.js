import { CONFIG } from './config.js';

const SAVE_KEY = 'mycoQuest.save.v1';

export const SAVE_FIELDS = [
    'playerClan',
    'spores',
    'blueSpores',
    'goldSpores',
    'crownPieces',
    'upgrades',
    'inventory',
    'armor',
    'magic',
    'completedQuests',
    'questLog',
    'dailyBurned',
    'lastBurnDate',
    'hp',
    'magicPoints'
];

function cloneData(value, fallback) {
    if (value === undefined || value === null) return fallback;
    try {
        return JSON.parse(JSON.stringify(value));
    } catch (error) {
        return fallback;
    }
}

function isValidClan(clan) {
    return Boolean(clan && CONFIG.CLANS.some(candidate => candidate.id === clan.id));
}

export function loadSavedProgress() {
    try {
        const raw = localStorage.getItem(SAVE_KEY);
        if (!raw) return null;
        const parsed = JSON.parse(raw);
        if (!parsed || parsed.version !== 1 || !isValidClan(parsed.playerClan)) return null;
        return parsed;
    } catch (error) {
        console.warn('Unable to load Myco Quest save data.', error);
        return null;
    }
}

export function hasSavedProgress() {
    return Boolean(loadSavedProgress());
}

export function saveProgress(scene) {
    try {
        const saveData = {
            version: 1,
            savedAt: Date.now()
        };

        SAVE_FIELDS.forEach(field => {
            saveData[field] = cloneData(scene.registry.get(field), field === 'playerClan' ? null : {});
        });

        if (!isValidClan(saveData.playerClan)) return false;
        saveData.spores = Number(saveData.spores || 0);
        saveData.blueSpores = Number(saveData.blueSpores || 0);
        saveData.goldSpores = Number(saveData.goldSpores || 0);
        saveData.crownPieces = Math.min(Math.max(Number(saveData.crownPieces || 0), 0), CONFIG.REGIONS.length);

        localStorage.setItem(SAVE_KEY, JSON.stringify(saveData));
        return true;
    } catch (error) {
        console.warn('Unable to save Myco Quest progress.', error);
        return false;
    }
}

export function applySavedProgress(scene, saveData = loadSavedProgress()) {
    if (!saveData || !isValidClan(saveData.playerClan)) return false;

    SAVE_FIELDS.forEach(field => {
        if (saveData[field] !== undefined) {
            scene.registry.set(field, cloneData(saveData[field], field === 'playerClan' ? null : {}));
        }
    });

    scene.registry.set('spores', Number(saveData.spores || 0));
    scene.registry.set('blueSpores', Number(saveData.blueSpores || 0));
    scene.registry.set('goldSpores', Number(saveData.goldSpores || 0));
    scene.registry.set('crownPieces', Math.min(Math.max(Number(saveData.crownPieces || 0), 0), CONFIG.REGIONS.length));
    return true;
}

export function clearSavedProgress() {
    try {
        localStorage.removeItem(SAVE_KEY);
        return true;
    } catch (error) {
        console.warn('Unable to clear Myco Quest save data.', error);
        return false;
    }
}
