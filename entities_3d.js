import * as THREE from 'three';
import * as TONE from 'tone';
import { CONFIG } from './config.js';

const SILENT_AUDIO_NODE = {
    volume: { value: 0 },
    playbackRate: { value: 1 },
    positionX: { value: 0 },
    positionY: { value: 0 },
    positionZ: { value: 0 },
    Q: { value: 0 },
    frequency: { value: 0 },
    detune: { value: 0 },
    envelope: { attack: 0, decay: 0, sustain: 0, release: 0 },
    noise: { type: 'white' },
    oscillator: { type: 'sine' },
    triggerAttackRelease() {},
    triggerAttack() {},
    triggerRelease() {},
    start() { return this; },
    stop() { return this; },
    connect() { return this; },
    toDestination() { return this; },
    chain() { return this; },
    fan() { return this; },
    sync() { return this; },
    unsync() { return this; },
    dispose() {},
    set() { return this; }
};

function canUseTone() {
    return !!(window.game && window.game.audioUnlocked && window.game.sharedAudioReady);
}

function createToneNode(factory) {
    if (!canUseTone()) return SILENT_AUDIO_NODE;
    try {
        return factory() || SILENT_AUDIO_NODE;
    } catch (_) {
        return SILENT_AUDIO_NODE;
    }
}

const WORLD_UP = new THREE.Vector3(0, 1, 0);
const ENEMY_TRAIL_GEOMETRY = new THREE.BoxGeometry(0.16, 0.16, 0.42);
const FIREBALL_TRAIL_GEOMETRIES = {
    default: new THREE.BoxGeometry(0.2, 0.2, 0.4),
    rootbind: new THREE.BoxGeometry(0.26, 0.26, 0.52),
    crownflare: new THREE.BoxGeometry(0.34, 0.34, 0.952)
};

const CLAN_VISUALS = {
    myco: { robe: 0x800080, magic: 0x00ff00, banner: 'assets/king-myco-clan-banner-2.jpg', avatar: 'assets/myco-avatar.webp' },
    rougarou: { robe: 0x555555, magic: 0xaaaaaa, banner: 'assets/rougarou-clan-banner-2.jpg', avatar: 'assets/rougarou-avatar.webp' },
    tegbot: { robe: 0x00ffff, magic: 0x00ffff, banner: 'assets/tegbot-clan-banner.webp', avatar: 'assets/tegbot-avatar.webp' },
    shiba: { robe: 0xffff00, magic: 0xffff00, banner: 'assets/shiba-clan-banner.webp', avatar: 'assets/shiba-avatar.webp' },
    brood: { robe: 0xffaa00, magic: 0xff5500, banner: 'assets/brood-dragon-clan-banner.jpg', avatar: 'assets/brood-avatar.webp' },
    mycelius: { robe: 0xaa00ff, magic: 0xaa00ff, banner: 'assets/dark-mycelius-clan-banner.jpg', avatar: 'assets/mycelius-avatar.webp' }
};

function getClanVisual(clanId = 'myco') {
    return CLAN_VISUALS[clanId] || CLAN_VISUALS.myco;
}

export class Enemy3D {
    constructor(scene, position, regionConfig = null) {
        this.scene = scene;
        this.mesh = new THREE.Group();
        this.regionConfig = regionConfig;
        
        const accentColor = regionConfig ? regionConfig.accent : 0x4b0082;
        const stemColor = regionConfig ? regionConfig.groundColor : 0x1a0521;

        // Custom look per region
        if (regionConfig && regionConfig.id === 'crystalcap') {
            // Crystalline Enemy
            const stemGeo = new THREE.CylinderGeometry(0.3, 0.4, 1.2, 4);
            const stemMat = new THREE.MeshStandardMaterial({ color: 0x88ccff });
            const stem = new THREE.Mesh(stemGeo, stemMat);
            stem.position.y = 0.6;
            this.mesh.add(stem);

            const capGeo = new THREE.OctahedronGeometry(0.8, 0);
            const capMat = new THREE.MeshStandardMaterial({ color: accentColor, emissive: accentColor, emissiveIntensity: 0.4 });
            const cap = new THREE.Mesh(capGeo, capMat);
            cap.position.y = 1.4;
            this.mesh.add(cap);
        } else if (regionConfig && regionConfig.id === 'emberstem') {
            // Fiery Enemy
            const stemGeo = new THREE.BoxGeometry(0.6, 1, 0.6);
            const stemMat = new THREE.MeshStandardMaterial({ color: 0x441100 });
            const stem = new THREE.Mesh(stemGeo, stemMat);
            stem.position.y = 0.5;
            this.mesh.add(stem);

            const capGeo = new THREE.ConeGeometry(1, 1, 6);
            const capMat = new THREE.MeshStandardMaterial({ color: 0xff4400, emissive: 0xff0000, emissiveIntensity: 0.5 });
            const cap = new THREE.Mesh(capGeo, capMat);
            cap.position.y = 1.5;
            this.mesh.add(cap);
        } else {
            // Standard "Rot" Mushroom
            const stemGeo = new THREE.BoxGeometry(0.6, 1, 0.6);
            const stemMat = new THREE.MeshStandardMaterial({ color: stemColor });
            const stem = new THREE.Mesh(stemGeo, stemMat);
            stem.position.y = 0.5;
            this.mesh.add(stem);
            
            const capGeo = new THREE.BoxGeometry(1.5, 0.5, 1.5);
            const capMat = new THREE.MeshStandardMaterial({ color: accentColor, emissive: accentColor, emissiveIntensity: 0.1 });
            const cap = new THREE.Mesh(capGeo, capMat);
            cap.position.y = 1.25;
            this.mesh.add(cap);
        }

        // Angry Eyes
        const eyeGeo = new THREE.BoxGeometry(0.15, 0.15, 0.1);
        const eyeMat = new THREE.MeshStandardMaterial({ color: 0xff0000, emissive: 0xff0000, emissiveIntensity: 1 });
        const leftEye = new THREE.Mesh(eyeGeo, eyeMat);
        leftEye.position.set(-0.2, 1.2, 0.7);
        this.mesh.add(leftEye);
        const rightEye = new THREE.Mesh(eyeGeo, eyeMat);
        rightEye.position.set(0.2, 1.2, 0.7);
        this.mesh.add(rightEye);

        this.mesh.position.copy(position);
        this.scene.add(this.mesh);
        
        this.hp = regionConfig ? 2 + (regionConfig.hpBonus || 0) / 10 : 2;
        this.speed = 0.04;
        this.baseSpeed = this.speed;
        this.slowFactor = 1.0;
        this.radius = 1.0;
        this.state = 'IDLE'; // IDLE, CHASE
        this.detectionRange = 15;
        this.shootRange = 10;
        this.lastShootTime = 0;
        this.shootCooldown = 2000 + Math.random() * 2000;
        this.knockbackVelocity = new THREE.Vector3();
        this.hitReact = 0;
        this.hitTilt = 0;
        this._tmpDir = new THREE.Vector3();
        this._tmpToCluster = new THREE.Vector3();
        this._tmpRepel = new THREE.Vector3();
        this._tmpSpawnPos = new THREE.Vector3();
    }

    update(playerPos) {
        this.updateHitReaction();
        const distSq = this.mesh.position.distanceToSquared(playerPos);
        
        // Apply knockback friction
        if (this.knockbackVelocity.lengthSq() > 0.0001) {
            this.mesh.position.add(this.knockbackVelocity);
            this.knockbackVelocity.multiplyScalar(0.9);
        } else {
            this.knockbackVelocity.set(0, 0, 0);
        }

        // Apply slow decay
        if (this.slowFactor < 1.0) {
            this.slowFactor += 0.005;
            if (this.slowFactor > 1.0) this.slowFactor = 1.0;
        }

        const currentSpeed = this.baseSpeed * this.slowFactor;

        if (distSq < this.detectionRange * this.detectionRange) {
            this.state = 'CHASE';
            const dir = this._tmpDir.subVectors(playerPos, this.mesh.position);
            dir.y = 0;
            if (dir.lengthSq() > 0.0001) dir.normalize();

            // Simple Obstacle Avoidance
            if (window.game && window.game.rotClusters) {
                window.game.rotClusters.forEach(cluster => {
                    if (!cluster.mesh) return;
                    const toCluster = this._tmpToCluster.subVectors(cluster.mesh.position, this.mesh.position);
                    const clusterDistSq = toCluster.lengthSq();
                    const minDist = this.radius + cluster.radius + 1;
                    if (clusterDistSq > 0.0001 && clusterDistSq < minDist * minDist) {
                        // Repel from cluster
                        const clusterDist = Math.sqrt(clusterDistSq);
                        this._tmpRepel.copy(toCluster).multiplyScalar(-1 / clusterDist).multiplyScalar(1.5 / clusterDist);
                        dir.add(this._tmpRepel).normalize();
                    }
                });
            }

            this.mesh.position.addScaledVector(dir, currentSpeed);
            this.mesh.lookAt(playerPos.x, this.mesh.position.y, playerPos.z);

            if (distSq < this.shootRange * this.shootRange) {
                const now = Date.now();
                if (now - this.lastShootTime > this.shootCooldown) {
                    this.lastShootTime = now;
                    this.shoot(playerPos);
                }
            }
        } else {
            this.state = 'IDLE';
        }
    }

    applySlow(factor, durationFrames = 120) {
        this.slowFactor = factor;
    }

    applyKnockback(direction, force) {
        this.knockbackVelocity.addScaledVector(direction, force);
    }

    shoot(playerPos) {
        const dir = this._tmpDir.subVectors(playerPos, this.mesh.position);
        dir.y = 0;
        if (dir.lengthSq() > 0.0001) dir.normalize();
        const spawnPos = this._tmpSpawnPos.copy(this.mesh.position);
        spawnPos.y += 1.2;
        spawnPos.addScaledVector(dir, 1);
        const projectile = new EnemyProjectile3D(this.scene, spawnPos, dir);
        if (window.game) window.game.enemyProjectiles.push(projectile);
    }

    takeDamage(amount) {
        this.hp -= amount;

        const impact = Math.min(this.isBoss ? 1.2 : 0.9, 0.16 + amount * 0.045);
        this.hitReact = Math.max(this.hitReact || 0, impact);
        this.hitTilt = (Math.random() > 0.5 ? 1 : -1) * (this.isBoss ? 1.1 : 0.8);
        
        // Play wet squish sound for enemies (Rot based)
        if (window.game && window.game.impactSynth && typeof window.game.impactSynth.triggerAttackRelease === 'function') {
            try { window.game.impactSynth.triggerAttackRelease("16n"); } catch (_) {}
        }

        // Kinetic Hit Stop (if it's a significant hit or boss)
        if (window.game) {
            window.game.hitStopFrames = this.isBoss ? 5 : 3;
        }

        // White Flash for tactility
        this.mesh.traverse(c => {
            if (c instanceof THREE.Mesh && c.material && c.material.emissive) {
                if (!c.userData.oldEmissive) c.userData.oldEmissive = c.material.emissive.clone();
                if (c.userData.oldEmissiveIntensity === undefined) c.userData.oldEmissiveIntensity = c.material.emissiveIntensity;
                
                c.material.emissive.set(0xffffff);
                c.material.emissiveIntensity = 10;
                
                setTimeout(() => { 
                    if (c.material && c.material.emissive) {
                        c.material.emissive.copy(c.userData.oldEmissive);
                        c.material.emissiveIntensity = c.userData.oldEmissiveIntensity;
                    }
                }, 80);
            }
        });
        return this.hp <= 0;
    }

    updateHitReaction() {
        if (!this.mesh) return;

        if (!this._restScale) this._restScale = this.mesh.scale.clone();
        if (this._restTiltX === undefined) this._restTiltX = this.mesh.rotation.x;
        if (this._restTiltZ === undefined) this._restTiltZ = this.mesh.rotation.z;

        const react = this.hitReact || 0;
        const targetScaleX = this._restScale.x * (1 + react * 0.12);
        const targetScaleY = this._restScale.y * (1 - react * 0.1);
        const targetScaleZ = this._restScale.z * (1 + react * 0.16);
        this.mesh.scale.x = THREE.MathUtils.lerp(this.mesh.scale.x, targetScaleX, 0.34);
        this.mesh.scale.y = THREE.MathUtils.lerp(this.mesh.scale.y, targetScaleY, 0.34);
        this.mesh.scale.z = THREE.MathUtils.lerp(this.mesh.scale.z, targetScaleZ, 0.34);

        const tiltZ = this._restTiltZ + (this.hitTilt || 0) * react * 0.18;
        const tiltX = this._restTiltX - react * 0.08;
        this.mesh.rotation.z = THREE.MathUtils.lerp(this.mesh.rotation.z, tiltZ, 0.28);
        this.mesh.rotation.x = THREE.MathUtils.lerp(this.mesh.rotation.x, tiltX, 0.28);

        if (react > 0.001) {
            this.hitReact *= 0.8;
            this.hitTilt *= 0.88;
        } else {
            this.hitReact = 0;
            this.hitTilt = 0;
            this.mesh.scale.lerp(this._restScale, 0.18);
            this.mesh.rotation.z = THREE.MathUtils.lerp(this.mesh.rotation.z, this._restTiltZ, 0.18);
            this.mesh.rotation.x = THREE.MathUtils.lerp(this.mesh.rotation.x, this._restTiltX, 0.18);
        }
    }

    destroy() {
        this.scene.remove(this.mesh);
    }
}

// V1.9.19 - Rot-Infected variant of the standard region enemy. Spawned by the
// Daily Rot system when a conquered region's blight rises above ~30%. They look
// like Mushroom-Kingdom enemies that the rot has hollowed out: necrotic purple
// cap, drooping head, glowing white eyes, and a trailing purple spore haze.
// Mechanically they're faster, tougher, apply a brief slow on contact, and
// reseed local rot when killed — they push the cleansing chore forward.
export class RotInfectedEnemy3D extends Enemy3D {
    constructor(scene, position, regionConfig = null) {
        super(scene, position, regionConfig);
        this.isRotInfected = true;
        this.name = 'ROTLING';

        // Necrotize the existing mesh: every material with a color tints toward
        // rot purple, every emissive switches to the rot glow.
        const rotPurple = new THREE.Color(0x6a1a99);
        const rotEmissive = new THREE.Color(0xaa00ff);
        this.mesh.traverse(child => {
            if (!child.material) return;
            const mats = Array.isArray(child.material) ? child.material : [child.material];
            mats.forEach(mat => {
                if (mat.color) mat.color.lerp(rotPurple, 0.7);
                if (mat.emissive) {
                    mat.emissive.copy(rotEmissive);
                    mat.emissiveIntensity = Math.max(mat.emissiveIntensity || 0, 0.9);
                }
            });
        });

        // Glowing white eyes overpower the original red eye boxes — find them by
        // their distinctive small dimensions and recolor.
        this.mesh.traverse(child => {
            if (!child.material) return;
            if (child.geometry && child.geometry.parameters &&
                child.geometry.parameters.width === 0.15 &&
                child.geometry.parameters.height === 0.15) {
                child.material.color.set(0xffffff);
                child.material.emissive.set(0xffffff);
                child.material.emissiveIntensity = 2.2;
            }
        });

        // Cap droops to suggest decay.
        this.mesh.rotation.z = 0.18;

        // Purple haze halo so they read as infected from a distance.
        const haloGeo = new THREE.SphereGeometry(0.9, 12, 8);
        const haloMat = new THREE.MeshBasicMaterial({
            color: 0xaa00ff, transparent: true, opacity: 0.22, depthWrite: false
        });
        this.rotHalo = new THREE.Mesh(haloGeo, haloMat);
        this.rotHalo.position.y = 1.2;
        this.mesh.add(this.rotHalo);

        // Trailing spore particles, recycled from a small pool.
        this._sporeTrail = [];
        for (let i = 0; i < 8; i++) {
            const g = new THREE.SphereGeometry(0.18, 6, 6);
            const m = new THREE.MeshBasicMaterial({
                color: 0xaa00ff, transparent: true, opacity: 0, depthWrite: false
            });
            const puff = new THREE.Mesh(g, m);
            puff.visible = false;
            this.scene.add(puff);
            this._sporeTrail.push({ mesh: puff, life: 0 });
        }
        this._sporeCursor = 0;
        this._sporeTimer = 0;

        // Mean stat block: tougher, faster, stronger contact slow.
        this.hp = (regionConfig ? 2 + (regionConfig.hpBonus || 0) / 10 : 2) * 2.0;
        this.maxHp = this.hp;
        this.speed = 0.06;
        this.baseSpeed = this.speed;
        this.detectionRange = 22;
        this.contactSlowApplied = 0;
    }

    update(playerPos) {
        // V1.9.20 - Inside a Light Pool, rotlings sear: they slow heavily, take a
        // burn DoT, and can't apply contact damage. Detect membership before the
        // base update so the slow modulates this frame's movement step.
        let inLightPool = false;
        if (window.game && window.game.lightPools) {
            for (const pool of window.game.lightPools) {
                if (!pool.dead && pool.contains(this.mesh.position)) {
                    inLightPool = true;
                    break;
                }
            }
        }
        if (inLightPool) {
            // Clamp speed to a crawl while inside.
            this.slowFactor = Math.min(this.slowFactor, 0.35);
            // Light damage tick (~5s to kill from full health for a baseline rotling).
            if (typeof this.hp === 'number') {
                this.hp -= 0.04;
                if (this.hp <= 0) {
                    // Treat as a damage event so death effects/region-rot bump fire.
                    try {
                        // takeDamage returns dead-flag; pass a tiny finisher.
                        this.hp = 0.001;
                        this.takeDamage(0.002);
                    } catch (_) {}
                }
            }
            // Flicker the halo white to read as searing.
            if (this.rotHalo) {
                const f = (Math.sin(Date.now() * 0.04) + 1) * 0.5;
                this.rotHalo.material.color.setRGB(1, 0.9 + f * 0.1, 0.8 + f * 0.2);
                this.rotHalo.material.opacity = 0.45 + f * 0.25;
            }
        } else if (this.rotHalo) {
            this.rotHalo.material.color.set(0xaa00ff);
            this.rotHalo.material.opacity = 0.22;
        }
        this._inLightPool = inLightPool;

        super.update(playerPos);

        // Pulse halo and trailing haze.
        if (this.rotHalo) {
            const s = 1 + Math.sin(Date.now() * 0.006) * 0.08;
            this.rotHalo.scale.set(s, s, s);
        }

        // Emit a spore puff every ~12 frames where the enemy currently stands.
        this._sporeTimer++;
        if (this._sporeTimer > 12) {
            this._sporeTimer = 0;
            const puff = this._sporeTrail[this._sporeCursor];
            this._sporeCursor = (this._sporeCursor + 1) % this._sporeTrail.length;
            puff.mesh.position.copy(this.mesh.position).add(new THREE.Vector3(0, 0.8, 0));
            puff.mesh.material.opacity = 0.55;
            puff.mesh.visible = true;
            puff.life = 1.0;
        }
        // Fade live puffs and drift them upward.
        this._sporeTrail.forEach(puff => {
            if (puff.life > 0) {
                puff.life -= 0.04;
                puff.mesh.position.y += 0.015;
                puff.mesh.material.opacity = Math.max(0, puff.life * 0.55);
                if (puff.life <= 0) puff.mesh.visible = false;
            }
        });

        // Slowly restore Player's slowFactor each frame so the rot-slow wears off
        // once the player escapes contact. Player3D doesn't self-restore.
        if (window.game && window.game.player && typeof window.game.player.slowFactor === 'number') {
            if (window.game.player.slowFactor < 1.0) {
                window.game.player.slowFactor = Math.min(1.0, window.game.player.slowFactor + 0.004);
            }
        }

        // Contact damage + slow on the player. Throttled so it isn't every frame.
        // V1.9.20 - Rotlings inside a Light Pool can't reach King Myco at all.
        if (window.game && window.game.player && !this._inLightPool) {
            const now = Date.now();
            const dist = this.mesh.position.distanceTo(playerPos);
            if (dist < 1.6 && now - this.contactSlowApplied > 700) {
                this.contactSlowApplied = now;
                try {
                    window.game.player.takeDamage(0.4);
                    // Player3D doesn't expose applySlow, but it has its own
                    // `slowFactor` field; attenuate it directly so the spores
                    // briefly bog King Myco down.
                    const pl = window.game.player;
                    if (typeof pl.applySlow === 'function') {
                        pl.applySlow(0.55, 60);
                    } else if (typeof pl.slowFactor === 'number') {
                        pl.slowFactor = Math.min(pl.slowFactor, 0.55);
                    }
                } catch (_) {}
            }
        }
    }

    takeDamage(amount) {
        const dead = super.takeDamage(amount);
        if (dead && window.game && window.game.currentRegion) {
            // On death the rotling reseeds the local blight slightly — a small
            // nudge that keeps cleansing feeling like a fight, not a chore.
            try {
                const rid = window.game.currentRegion.id;
                if (window.game.progression.isConquered(rid)) {
                    const before = window.game.progression.getRegionRot(rid);
                    window.game.progression.setRegionRot(rid, Math.min(100, before + 2));
                    // Also nudge nearby mushroom props' target rot.
                    if (window.game.rotProps && window.game.rotProps.length) {
                        const pos = this.mesh.position;
                        window.game.rotProps.forEach(p => {
                            if (!p.group) return;
                            const d = p.group.position.distanceTo(pos);
                            if (d < 10) p.targetRot = Math.min(1, p.targetRot + 0.12);
                        });
                    }
                }
            } catch (_) {}
        }
        return dead;
    }

    destroy() {
        super.destroy();
        if (this._sporeTrail) {
            this._sporeTrail.forEach(puff => {
                try {
                    this.scene.remove(puff.mesh);
                    puff.mesh.geometry.dispose();
                    puff.mesh.material.dispose();
                } catch (_) {}
            });
            this._sporeTrail = [];
        }
    }
}

// V1.9.20 - Rot-Purifying Light Pool. A short-lived consecrated zone King Myco
// can drop at his feet. Inside the pool, Rotlings shrink back (heavy slow),
// burn (DoT), and can't apply contact damage; nearby mushroom props slowly
// cleanse over time. The pool fades out over its lifetime so it's a tactical
// tool, not a permanent ward.
export class LightPool3D {
    constructor(scene, position, options = {}) {
        this.scene = scene;
        this.position = position.clone();
        this.radius = options.radius || 7;
        this.duration = options.duration || 60000; // 60s default
        this.startTime = Date.now();
        this.dead = false;
        this.cleanseTick = 0;

        this.group = new THREE.Group();
        this.group.position.copy(this.position);

        // Golden disc on the ground.
        const discGeo = new THREE.CircleGeometry(this.radius, 48);
        const discMat = new THREE.MeshBasicMaterial({
            color: 0xfff2a8, transparent: true, opacity: 0.42, depthWrite: false, side: THREE.DoubleSide
        });
        this.disc = new THREE.Mesh(discGeo, discMat);
        this.disc.rotation.x = -Math.PI / 2;
        this.disc.position.y = 0.05;
        this.group.add(this.disc);

        // Inner brighter ring (a tighter glow at the center).
        const innerGeo = new THREE.RingGeometry(this.radius * 0.4, this.radius * 0.55, 48);
        const innerMat = new THREE.MeshBasicMaterial({
            color: 0xffffe0, transparent: true, opacity: 0.55, depthWrite: false, side: THREE.DoubleSide
        });
        this.innerRing = new THREE.Mesh(innerGeo, innerMat);
        this.innerRing.rotation.x = -Math.PI / 2;
        this.innerRing.position.y = 0.06;
        this.group.add(this.innerRing);

        // Outer sigil ring (rotates slowly).
        const sigilGeo = new THREE.RingGeometry(this.radius * 0.85, this.radius * 0.95, 32, 1);
        const sigilMat = new THREE.MeshBasicMaterial({
            color: 0xffd96b, transparent: true, opacity: 0.7, depthWrite: false, side: THREE.DoubleSide
        });
        this.sigilRing = new THREE.Mesh(sigilGeo, sigilMat);
        this.sigilRing.rotation.x = -Math.PI / 2;
        this.sigilRing.position.y = 0.07;
        this.group.add(this.sigilRing);

        // Column of light rising up.
        const columnGeo = new THREE.CylinderGeometry(this.radius * 0.95, this.radius * 0.6, 8, 16, 1, true);
        const columnMat = new THREE.MeshBasicMaterial({
            color: 0xfff2a8, transparent: true, opacity: 0.18, depthWrite: false, side: THREE.DoubleSide
        });
        this.column = new THREE.Mesh(columnGeo, columnMat);
        this.column.position.y = 4;
        this.group.add(this.column);

        // Actual scene light so the pool's effect on materials reads visually.
        this.light = new THREE.PointLight(0xfff2a8, 2.4, this.radius * 3);
        this.light.position.y = 2.5;
        this.group.add(this.light);

        // Drifting motes orbiting the column.
        this._motes = [];
        const moteCount = 14;
        const moteGeo = new THREE.SphereGeometry(0.12, 6, 6);
        for (let i = 0; i < moteCount; i++) {
            const mat = new THREE.MeshBasicMaterial({
                color: 0xfff8c8, transparent: true, opacity: 0.9, depthWrite: false
            });
            const m = new THREE.Mesh(moteGeo, mat);
            const a = (i / moteCount) * Math.PI * 2;
            m.userData.angle = a;
            m.userData.r = this.radius * (0.4 + Math.random() * 0.5);
            m.userData.ySpeed = 0.01 + Math.random() * 0.02;
            m.userData.aSpeed = 0.01 + Math.random() * 0.015;
            m.position.set(Math.cos(a) * m.userData.r, 0.5 + Math.random() * 3, Math.sin(a) * m.userData.r);
            this.group.add(m);
            this._motes.push(m);
        }

        this.scene.add(this.group);
    }

    // Per-frame: rotate sigils, drift motes, fade gracefully near the end of life.
    update() {
        if (this.dead) return false;
        const elapsed = Date.now() - this.startTime;
        if (elapsed >= this.duration) {
            this.destroy();
            return false;
        }
        // Sigil ring slow spin, disc pulse.
        this.sigilRing.rotation.z += 0.01;
        const pulse = 1 + Math.sin(elapsed * 0.005) * 0.04;
        this.disc.scale.set(pulse, pulse, pulse);
        this.innerRing.scale.set(pulse, pulse, pulse);

        // Motes drift in a tight orbit and slowly rise.
        this._motes.forEach(m => {
            m.userData.angle += m.userData.aSpeed;
            m.position.x = Math.cos(m.userData.angle) * m.userData.r;
            m.position.z = Math.sin(m.userData.angle) * m.userData.r;
            m.position.y += m.userData.ySpeed;
            if (m.position.y > 5) m.position.y = 0.3;
        });

        // Fade-out in the last 20% of life.
        const t = elapsed / this.duration;
        if (t > 0.8) {
            const fade = 1 - (t - 0.8) / 0.2;
            this.disc.material.opacity = 0.42 * fade;
            this.innerRing.material.opacity = 0.55 * fade;
            this.sigilRing.material.opacity = 0.7 * fade;
            this.column.material.opacity = 0.18 * fade;
            this.light.intensity = 2.4 * fade;
            this._motes.forEach(m => { m.material.opacity = 0.9 * fade; });
        }
        return true;
    }

    contains(pos) {
        if (this.dead) return false;
        const dx = pos.x - this.position.x;
        const dz = pos.z - this.position.z;
        return (dx * dx + dz * dz) < this.radius * this.radius;
    }

    destroy() {
        if (this.dead) return;
        this.dead = true;
        try {
            this.scene.remove(this.group);
            this.group.traverse(child => {
                if (child.geometry) child.geometry.dispose();
                if (child.material) {
                    if (Array.isArray(child.material)) child.material.forEach(m => m.dispose());
                    else child.material.dispose();
                }
            });
        } catch (_) {}
    }
}

export class Boss3D extends Enemy3D {
    constructor(scene, position, regionConfig) {
        super(scene, position, regionConfig);
        this.isBoss = true;
        this.maxHp = 50 + (regionConfig.hpBonus || 0);
        this.hp = this.maxHp;
        this.mesh.scale.set(3, 3, 3);
        this.speed = 0.02; // Slower movement
        this.baseSpeed = this.speed;
        this.bossState = 'INTRO';
        this.spawnedAt = performance.now ? performance.now() : Date.now();
        this.attackTimer = 0;
        this.phase = 1;
        this.phaseTransitioning = false;
        this.bossAccent = (regionConfig && (regionConfig.bossTint || regionConfig.accent)) || 0xff0055;
        this.isMobileFx = !!(window.game && window.game.isMobile);

        if (!this.isMobileFx) {
            const sigilGeo = new THREE.RingGeometry(2.15, 2.55, 48);
            const sigilMat = new THREE.MeshBasicMaterial({
                color: this.bossAccent,
                transparent: true,
                opacity: 0.45,
                side: THREE.DoubleSide,
                depthWrite: false
            });
            this.presentationRing = new THREE.Mesh(sigilGeo, sigilMat);
            this.presentationRing.rotation.x = -Math.PI / 2;
            this.presentationRing.position.set(position.x, 0.08, position.z);
            this.scene.add(this.presentationRing);
        }
        
        // Remove existing enemy parts to rebuild boss specific ones
        while(this.mesh.children.length > 0){
            this.mesh.remove(this.mesh.children[0]);
        }

        if (regionConfig.id === 'sporewood') {
            this.setupSporewoodBoss();
        } else if (regionConfig.id === 'crystalcap') {
            this.setupCrystalcapBoss();
        } else if (regionConfig.id === 'emberstem') {
            this.setupEmberstemBoss();
        } else {
            // Default giant rot boss
            this.setupDefaultBoss();
        }

        if (!this.isMobileFx) {
            const crownGeo = new THREE.TorusGeometry(1.35, 0.06, 10, 42);
            const crownMat = new THREE.MeshStandardMaterial({
                color: this.bossAccent,
                emissive: this.bossAccent,
                emissiveIntensity: 1.5,
                transparent: true,
                opacity: 0.72,
                depthWrite: false
            });
            this.presentationCrown = new THREE.Mesh(crownGeo, crownMat);
            this.presentationCrown.rotation.x = Math.PI / 2;
            this.presentationCrown.position.y = 2.25;
            this.mesh.add(this.presentationCrown);
        }
    }

    setupCrystalcapBoss() {
        // Shardcap Warden - Geometric construct
        const coreGeo = new THREE.IcosahedronGeometry(0.8, 0);
        const coreMat = new THREE.MeshStandardMaterial({ 
            color: 0x00ffff, 
            emissive: 0x00ffff, 
            emissiveIntensity: 2,
            transparent: true,
            opacity: 0.9
        });
        this.core = new THREE.Mesh(coreGeo, coreMat);
        this.mesh.add(this.core);

        // Floating shards
        this.shards = [];
        for (let i = 0; i < 8; i++) {
            const shardGeo = new THREE.OctahedronGeometry(0.3, 0);
            const shardMat = new THREE.MeshStandardMaterial({ color: 0x66ccff, emissive: 0x00ffff, emissiveIntensity: 1 });
            const shard = new THREE.Mesh(shardGeo, shardMat);
            const group = new THREE.Group();
            group.add(shard);
            this.mesh.add(group);
            this.shards.push(group);
        }
    }

    setupEmberstemBoss() {
        // Cinderstalk Brute - Volcanic Giant
        const baseGeo = new THREE.CylinderGeometry(0.8, 1.2, 2, 8);
        const baseMat = new THREE.MeshStandardMaterial({ color: 0x2a0804, roughness: 1 });
        const base = new THREE.Mesh(baseGeo, baseMat);
        base.position.y = 1;
        this.mesh.add(base);

        const capGeo = new THREE.SphereGeometry(1.5, 8, 8, 0, Math.PI * 2, 0, Math.PI / 2);
        const capMat = new THREE.MeshStandardMaterial({ color: 0xff4422, emissive: 0xff0000, emissiveIntensity: 1 });
        this.cap = new THREE.Mesh(capGeo, capMat);
        this.cap.position.y = 2;
        this.mesh.add(this.cap);

        // Lava Veins
        const veinGeo = new THREE.TorusGeometry(1.51, 0.05, 8, 32, Math.PI);
        const veinMat = new THREE.MeshStandardMaterial({ color: 0xffaa00, emissive: 0xffaa00, emissiveIntensity: 5 });
        const vein = new THREE.Mesh(veinGeo, veinMat);
        vein.rotation.x = Math.PI / 2;
        vein.position.y = 2.1;
        this.mesh.add(vein);
    }

    setupSporewoodBoss() {
        const barkMat = new THREE.MeshStandardMaterial({ color: 0x4a2d18, roughness: 1 });
        const mossMat = new THREE.MeshStandardMaterial({ color: 0x315c25, emissive: 0x1d4318, emissiveIntensity: 0.45, roughness: 0.9 });
        const rotMat = new THREE.MeshStandardMaterial({ color: 0x6f1a5e, emissive: 0xaa00ff, emissiveIntensity: 1.4, roughness: 0.7 });

        const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.95, 1.35, 4.5, 10), barkMat);
        trunk.position.y = 2.15;
        this.mesh.add(trunk);
        this.trunk = trunk;

        const canopy = new THREE.Mesh(new THREE.SphereGeometry(2.35, 10, 8), mossMat);
        canopy.position.y = 4.65;
        canopy.scale.set(1.05, 0.85, 0.98);
        this.mesh.add(canopy);
        this.canopy = canopy;

        for (let i = 0; i < 4; i++) {
            const angle = (i / 4) * Math.PI * 2 + 0.35;
            const root = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.28, 2.2, 6), barkMat);
            root.position.set(Math.cos(angle) * 0.9, 0.6, Math.sin(angle) * 0.9);
            root.rotation.z = Math.cos(angle) * 0.65;
            root.rotation.x = Math.sin(angle) * 0.35;
            this.mesh.add(root);
        }

        const branchGeo = new THREE.CylinderGeometry(0.16, 0.28, 2.9, 6);
        const leftArm = new THREE.Mesh(branchGeo, barkMat);
        leftArm.position.set(-1.45, 2.95, 0.15);
        leftArm.rotation.z = 1.05;
        leftArm.rotation.y = 0.35;
        this.mesh.add(leftArm);
        this.leftArm = leftArm;

        const rightArm = new THREE.Mesh(branchGeo, barkMat);
        rightArm.position.set(1.45, 2.95, 0.15);
        rightArm.rotation.z = -1.05;
        rightArm.rotation.y = -0.35;
        this.mesh.add(rightArm);
        this.rightArm = rightArm;

        const clawGeo = new THREE.ConeGeometry(0.14, 0.55, 5);
        for (const [arm, side] of [[leftArm, -1], [rightArm, 1]]) {
            for (let i = 0; i < 3; i++) {
                const claw = new THREE.Mesh(clawGeo, rotMat);
                claw.position.set(side * (0.18 + i * 0.12), 1.32, -0.02 + i * 0.08);
                claw.rotation.z = side * (Math.PI / 2);
                claw.rotation.x = Math.PI / 2;
                arm.add(claw);
            }
        }

        const face = new THREE.Mesh(
            new THREE.BoxGeometry(1.55, 1.45, 0.26),
            new THREE.MeshStandardMaterial({ color: 0x21120a, emissive: 0x120906, emissiveIntensity: 0.4 })
        );
        face.position.set(0, 2.7, 1.07);
        this.mesh.add(face);
        this.faceMask = face;

        const browGeo = new THREE.BoxGeometry(0.42, 0.1, 0.1);
        const eyeMat = new THREE.MeshStandardMaterial({ color: 0xff2200, emissive: 0xff2200, emissiveIntensity: 3 });
        const leftBrow = new THREE.Mesh(browGeo, barkMat);
        leftBrow.position.set(-0.34, 3.02, 1.2);
        leftBrow.rotation.z = -0.35;
        this.mesh.add(leftBrow);
        const rightBrow = leftBrow.clone();
        rightBrow.position.x = 0.34;
        rightBrow.rotation.z = 0.35;
        this.mesh.add(rightBrow);

        const eyeGeo = new THREE.BoxGeometry(0.18, 0.18, 0.1);
        const leftEye = new THREE.Mesh(eyeGeo, eyeMat);
        leftEye.position.set(-0.3, 2.8, 1.22);
        this.mesh.add(leftEye);
        const rightEye = new THREE.Mesh(eyeGeo, eyeMat);
        rightEye.position.set(0.3, 2.8, 1.22);
        this.mesh.add(rightEye);
        this.treeEyes = [leftEye, rightEye];

        const mouth = new THREE.Mesh(
            new THREE.BoxGeometry(0.85, 0.24, 0.14),
            new THREE.MeshStandardMaterial({ color: 0x080808, emissive: 0x28000e, emissiveIntensity: 1 })
        );
        mouth.position.set(0, 2.25, 1.18);
        this.mesh.add(mouth);
        this.mouth = mouth;

        const fangMat = new THREE.MeshStandardMaterial({ color: 0xf2f0de, emissive: 0x886666, emissiveIntensity: 0.55 });
        const leftFang = new THREE.Mesh(new THREE.ConeGeometry(0.12, 0.68, 6), fangMat);
        leftFang.position.set(-0.24, 1.9, 1.22);
        leftFang.rotation.x = Math.PI;
        this.mesh.add(leftFang);
        const rightFang = leftFang.clone();
        rightFang.position.x = 0.24;
        this.mesh.add(rightFang);
        this.fangs = [leftFang, rightFang];

        for (let i = 0; i < 5; i++) {
            const knot = new THREE.Mesh(new THREE.SphereGeometry(0.18 + Math.random() * 0.12, 8, 8), rotMat);
            knot.position.set((Math.random() - 0.5) * 1.6, 1.2 + Math.random() * 2.8, 0.75 + Math.random() * 0.35);
            this.mesh.add(knot);
        }

        const rotHalo = new THREE.Mesh(
            new THREE.TorusGeometry(2.05, 0.14, 10, 30),
            new THREE.MeshBasicMaterial({ color: 0xaa00ff, transparent: true, opacity: 0.22, depthWrite: false })
        );
        rotHalo.rotation.x = Math.PI / 2;
        rotHalo.position.y = 0.25;
        this.mesh.add(rotHalo);
        this.rotHalo = rotHalo;
    }

    setupDefaultBoss() {
        const geo = new THREE.BoxGeometry(2, 4, 2);
        const mat = new THREE.MeshStandardMaterial({ color: 0xff0000 });
        this.mesh.add(new THREE.Mesh(geo, mat));
    }

    checkPhaseTransition() {
        if (this.phase === 1 && this.hp < this.maxHp * 0.5) {
            this.phase = 2;
            this.phaseTransitioning = true;
            this.onPhaseTransition();
        }
    }

    // onPhaseTransition() is defined below with the V1.9.15 rot-bloom shield added.

    update(playerPos) {
        const now = performance.now ? performance.now() : Date.now();
        const introT = Math.min(1, (now - this.spawnedAt) / 1100);
        this.bossState = introT < 1 ? 'INTRO' : 'ENGAGED';

        if (this.presentationRing) {
            const pulse = 1 + Math.sin(Date.now() * 0.006) * 0.05;
            const introScale = 0.65 + introT * 0.35;
            this.presentationRing.position.x = this.mesh.position.x;
            this.presentationRing.position.z = this.mesh.position.z;
            this.presentationRing.rotation.z += 0.01;
            this.presentationRing.scale.setScalar(pulse * introScale);
            this.presentationRing.material.opacity = 0.2 + introT * 0.3 + Math.sin(Date.now() * 0.01) * 0.04;
        }
        if (this.presentationCrown) {
            this.presentationCrown.rotation.z += 0.01;
            this.presentationCrown.position.y = 2.15 + Math.sin(Date.now() * 0.005) * 0.12;
            const crownScale = 0.92 + introT * 0.1;
            this.presentationCrown.scale.setScalar(crownScale);
        }

        this.checkPhaseTransition();
        if (this.phaseTransitioning) return;
        this.updateShield();

        // Kinetic Particles for movement
        const moveDist = this.mesh.position.distanceTo(this._prevPos || this.mesh.position);
        if (moveDist > 0.01 && window.game) {
            window.game.spawnFootstepParticles(this.mesh.position, this.regionConfig.id);
        }
        this._prevPos = this.mesh.position.clone();

        super.update(playerPos);
        this.attackTimer++;

        if (this.rotFloor) {
            this.rotFloor.position.x = this.mesh.position.x;
            this.rotFloor.position.z = this.mesh.position.z;
            this.rotFloor.rotation.z += 0.02;
            
            // Damage player if in rot floor
            if (playerPos.distanceTo(this.mesh.position) < 15) {
                if (Math.random() < 0.01) { // 1% chance per frame to take rot damage
                   if (window.game) window.game.player.takeDamage(0.1);
                }
            }
        }

        if (this.regionConfig.id === 'crystalcap') {
            this.updateCrystalcap(playerPos);
        } else if (this.regionConfig.id === 'emberstem') {
            this.updateEmberstem(playerPos);
        }

        // V1.9.15 - Baseline AoE Spore Burst for every generic boss. Drops a single
        // telegraphed ring at the player every ~5s in phase 1, ~3s in phase 2.
        // Subclasses with their own AoE patterns can disable this by setting
        // `this.disableBaselineAoE = true`.
        if (!this.disableBaselineAoE && !this.shielded) {
            this._baselineSporeTimer = (this._baselineSporeTimer || 0) + 1;
            // V1.9.16 - Tuning: slightly slower phase-2 cadence (3.5s instead of 3s)
            // and a longer telegraph so the cast is readable when phase 2 stacks tells.
            const cd = this.phase === 2 ? 210 : 300;
            if (this._baselineSporeTimer > cd) {
                this._baselineSporeTimer = 0;
                const accent = (this.regionConfig && this.regionConfig.accent) || 0x39FF14;
                const radius = this.phase === 2 ? 6 : 5;
                const dmg = this.phase === 2 ? 1.2 : 0.9;
                this.spawnAoESpore(playerPos.clone(), radius, 1100, dmg, accent);
            }
        }
    }

    onPhaseTransition() {
        // V1.9.15 - Generic boss phase-2 entry: brief 3s "rot-bloom" self-shield while a
        // telegraphed spore ring blooms around the boss, telling the player to back off.
        const accent = (this.regionConfig && (this.regionConfig.bossTint || this.regionConfig.accent)) || 0xaa00ff;
        if (window.game) {
            window.game.showFloatingText("PHASE 2: THE ROT SPREADS!", 0xaa00ff, true);
            const rotFloorGeo = new THREE.CircleGeometry(15, 32);
            const rotFloorMat = new THREE.MeshBasicMaterial({ color: 0xaa00ff, transparent: true, opacity: 0.3 });
            this.rotFloor = new THREE.Mesh(rotFloorGeo, rotFloorMat);
            this.rotFloor.rotation.x = -Math.PI / 2;
            this.rotFloor.position.y = 0.1;
            this.scene.add(this.rotFloor);
        }
        this.speed *= 1.5;
        this.baseSpeed = this.speed;

        // Visual change
        this.mesh.traverse(child => {
            if (child.material && child.material.emissive) {
                child.material.emissive.set(0xaa00ff);
                child.material.emissiveIntensity *= 2;
            }
        });

        setTimeout(() => { this.phaseTransitioning = false; }, 1000);

        // Brief shielded "bloom" — 3s of immunity while ring of spore bursts erupts.
        // V1.9.16 - Longer telegraph (1050ms) so first-time players can read the ring.
        this.raiseShield(3000, accent, 'rot-bloom');
        for (let i = 0; i < 6; i++) {
            const a = (i / 6) * Math.PI * 2;
            const pos = this.mesh.position.clone().add(new THREE.Vector3(Math.cos(a) * 6, 0, Math.sin(a) * 6));
            setTimeout(() => this.spawnAoESpore(pos, 4, 1050, 1.0, accent), i * 200);
        }
    }

    updateCrystalcap(playerPos) {
        // Animate shards
        this.shards.forEach((group, i) => {
            const time = Date.now() * 0.002;
            const angle = (i / this.shards.length) * Math.PI * 2 + time;
            group.position.set(Math.cos(angle) * 2, 1 + Math.sin(time + i) * 0.5, Math.sin(angle) * 2);
            group.rotation.y += 0.05;
        });

        // Boss attacks
        if (this.attackTimer > 180) { // Every 3 seconds
            this.attackTimer = 0;
            this.crystalStorm(playerPos);
        }
    }

    crystalStorm(playerPos) {
        // Spiral attack
        for (let i = 0; i < 12; i++) {
            const angle = (i / 12) * Math.PI * 2;
            const dir = new THREE.Vector3(Math.cos(angle), 0, Math.sin(angle));
            const proj = new EnemyProjectile3D(this.scene, this.mesh.position.clone().add(new THREE.Vector3(0, 1.5, 0)), dir);
            proj.speed = 0.25;
            proj.mesh.scale.set(2, 2, 2);
            if (window.game) window.game.enemyProjectiles.push(proj);
        }
    }

    updateEmberstem(playerPos) {
        this.cap.scale.setScalar(1 + Math.sin(Date.now() * 0.005) * 0.1);
        
        if (this.attackTimer > 240) { // Every 4 seconds
            this.attackTimer = 0;
            this.volcanoBurst(playerPos);
        }
    }

    volcanoBurst(playerPos) {
        // Radial burst
        for (let i = 0; i < 8; i++) {
            const dir = new THREE.Vector3().subVectors(playerPos, this.mesh.position).normalize();
            dir.y = 0;
            const angle = (i - 4) * 0.3;
            dir.applyAxisAngle(new THREE.Vector3(0, 1, 0), angle);
            
            const proj = new EnemyProjectile3D(this.scene, this.mesh.position.clone().add(new THREE.Vector3(0, 2, 0)), dir);
            proj.speed = 0.2;
            proj.mesh.scale.set(3, 3, 3);
            // Color it red
            proj.mesh.children[0].material.color.setHex(0xff4400);
            proj.mesh.children[0].material.emissive.setHex(0xff0000);
            if (window.game) window.game.enemyProjectiles.push(proj);
        }
    }

    // =====================================================================
    // V1.9.15 - Shared boss combat mechanics: shield phases + AoE spore bursts.
    // Subclasses lift these helpers via super.update() / direct calls.
    // =====================================================================

    // Block damage while shielded. Subclasses set this.shielded = true and either
    // (a) provide a shieldClearPredicate() that returns true when broken (e.g. shards
    //     destroyed), or (b) rely on the auto-timeout set when raiseShield() was called.
    takeDamage(amount) {
        if (this.shielded) {
            // Shield deflects: small flash + sound + tiny shield-bar damage.
            if (this.shieldMesh) {
                this.shieldMesh.material.emissiveIntensity = 4;
                setTimeout(() => {
                    if (this.shieldMesh && this.shieldMesh.material) this.shieldMesh.material.emissiveIntensity = 1.5;
                }, 80);
            }
            try {
                if (window.game && window.game.uiSynth) window.game.uiSynth.triggerAttackRelease('A5', '32n');
            } catch (_) {}
            if (window.game) {
                window.game.showFloatingText('SHIELDED!', 0xffff66, false);
                if (typeof window.game.markBossDamage === 'function') window.game.markBossDamage(this, amount, true);
            }
            return false; // Absorb damage entirely.
        }
        const dead = super.takeDamage(amount);
        if (window.game && typeof window.game.markBossDamage === 'function') {
            window.game.markBossDamage(this, amount, false);
        }
        return dead;
    }

    // Wrap the boss in a glowing dome that pulses; auto-clears after durationMs OR
    // when shieldClearPredicate() returns true (checked each update tick).
    raiseShield(durationMs, color, reason) {
        // If already shielded, refresh the expiry/color/reason rather than no-op.
        if (this.shielded) {
            this.shieldExpiresAt = Date.now() + durationMs;
            this.shieldReason = reason || this.shieldReason || 'shielded';
            if (this.shieldMesh && this.shieldMesh.material) {
                this.shieldMesh.material.color.setHex(color || 0xffff66);
                this.shieldMesh.material.emissive.setHex(color || 0xffff66);
            }
            return;
        }
        this.shielded = true;
        this.shieldExpiresAt = Date.now() + durationMs;
        this.shieldColor = color || 0xffff66;
        this.shieldReason = reason || 'shielded';
        const c = this.shieldColor;
        const geo = new THREE.SphereGeometry(2.4, 16, 12);
        const mat = new THREE.MeshStandardMaterial({
            color: c, emissive: c, emissiveIntensity: 1.5,
            transparent: true, opacity: 0.35, side: THREE.DoubleSide,
            wireframe: false, depthWrite: false
        });
        this.shieldMesh = new THREE.Mesh(geo, mat);
        this.shieldMesh.position.y = 1.2;
        this.mesh.add(this.shieldMesh);
        if (window.game && reason) {
            window.game.showFloatingText(`SHIELD UP — ${reason.toUpperCase()}`, c, true);
        }
    }

    dropShield() {
        if (!this.shielded) return;
        this.shielded = false;
        this.shieldReason = null;
        if (this.shieldMesh) {
            const m = this.shieldMesh;
            try { this.mesh.remove(m); m.geometry.dispose(); m.material.dispose(); } catch (_) {}
            this.shieldMesh = null;
        }
        if (window.game) {
            window.game.showFloatingText('SHIELD BROKEN!', 0xffffff, true);
            try { window.game.gateActivationSynth.triggerAttackRelease(['C5','E5','G5'], '8n'); } catch (_) {}
        }
    }

    // Per-frame upkeep called from each boss's update().
    updateShield() {
        if (!this.shielded) return;
        // Pulse the dome.
        if (this.shieldMesh) {
            const k = 1 + Math.sin(Date.now() * 0.006) * 0.06;
            this.shieldMesh.scale.set(k, k, k);
            this.shieldMesh.rotation.y += 0.02;
        }
        // Subclass-defined clear condition.
        if (this.shieldClearPredicate && this.shieldClearPredicate()) {
            this.dropShield();
            return;
        }
        // Auto-timeout.
        if (this.shieldExpiresAt && Date.now() >= this.shieldExpiresAt) {
            this.dropShield();
        }
    }

    destroy() {
        if (this.presentationRing) {
            try {
                this.scene.remove(this.presentationRing);
                this.presentationRing.geometry.dispose();
                this.presentationRing.material.dispose();
            } catch (_) {}
            this.presentationRing = null;
        }
        if (this.rotFloor) {
            try {
                this.scene.remove(this.rotFloor);
                this.rotFloor.geometry.dispose();
                this.rotFloor.material.dispose();
            } catch (_) {}
            this.rotFloor = null;
        }
        super.destroy();
    }

    // Telegraphed AoE spore burst. Draws an expanding ring on the ground at `pos`
    // for `telegraphMs`, then detonates: damages the player if inside `radius` and
    // plays a green spore burst. Returns the ring mesh so callers can color it.
    spawnAoESpore(pos, radius = 6, telegraphMs = 900, damage = 1.0, color = 0x39FF14) {
        if (!window.game) return null;
        const perfMobile = !!(window.game && (window.game.mobilePerf || window.game.isMobile));
        const ringGeo = new THREE.RingGeometry(radius - 0.4, radius, perfMobile ? 24 : 48);
        const ringMat = new THREE.MeshBasicMaterial({
            color: color, transparent: true, opacity: 0.65,
            side: THREE.DoubleSide, depthWrite: false
        });
        const ring = new THREE.Mesh(ringGeo, ringMat);
        ring.rotation.x = -Math.PI / 2;
        ring.position.set(pos.x, 0.08, pos.z);
        this.scene.add(ring);

        // Inner fill that grows during the telegraph.
        const fillGeo = new THREE.CircleGeometry(radius, perfMobile ? 24 : 48);
        const fillMat = new THREE.MeshBasicMaterial({
            color: color, transparent: true, opacity: 0.15,
            side: THREE.DoubleSide, depthWrite: false
        });
        const fill = new THREE.Mesh(fillGeo, fillMat);
        fill.rotation.x = -Math.PI / 2;
        fill.position.set(pos.x, 0.06, pos.z);
        fill.scale.set(0.05, 0.05, 0.05);
        this.scene.add(fill);

        const start = Date.now();
        const animate = () => {
            const t = (Date.now() - start) / telegraphMs;
            if (t < 1) {
                const k = 0.05 + t * 0.95;
                fill.scale.set(k, k, k);
                fillMat.opacity = 0.15 + t * 0.25;
                ringMat.opacity = 0.65 + Math.sin(t * Math.PI * 6) * 0.25;
                requestAnimationFrame(animate);
            } else {
                // Detonate.
                try {
                    window.game.spawnExplosionParticles(pos, color);
                    if (window.game.impactSynth) window.game.impactSynth.triggerAttackRelease('8n');
                } catch (_) {}
                const player = window.game.player;
                if (player) {
                    const flat = player.group.position.clone(); flat.y = 0;
                    if (flat.distanceTo(new THREE.Vector3(pos.x, 0, pos.z)) <= radius) {
                        player.takeDamage(damage);
                        window.game.showFloatingText('-HIT-', 0xff5555, false);
                    }
                }
                // Brief burst, then fade.
                ringMat.color.setHex(0xffffff);
                fillMat.color.setHex(0xffffff);
                let fade = 1.0;
                const fadeOut = () => {
                    fade -= 0.06;
                    if (fade <= 0) {
                        this.scene.remove(ring); this.scene.remove(fill);
                        try { ring.geometry.dispose(); ring.material.dispose(); fill.geometry.dispose(); fill.material.dispose(); } catch (_) {}
                        return;
                    }
                    ringMat.opacity = fade;
                    fillMat.opacity = fade * 0.5;
                    requestAnimationFrame(fadeOut);
                };
                fadeOut();
            }
        };
        animate();
        return ring;
    }
}

export class BogbellyMyconid3D extends Boss3D {
    constructor(scene, position, regionConfig) {
        super(scene, position, regionConfig);
        this.name = "Bogbelly Myconid";
        this.maxHp = 300;
        this.hp = this.maxHp;
        this.mesh.scale.set(4, 4, 4);
        
        // Custom look: Bulky amber mushroom
        const amberMat = new THREE.MeshStandardMaterial({ 
            color: 0xffaa00, 
            emissive: 0xffaa00, 
            emissiveIntensity: 0.5 
        });
        const bellyGeo = new THREE.SphereGeometry(1.2, 8, 8);
        this.belly = new THREE.Mesh(bellyGeo, amberMat);
        this.belly.position.y = 1;
        this.mesh.add(this.belly);
        
        this.jumpTimer = 0;
        this.isJumping = false;
    }

    update(playerPos) {
        if (this.hp <= 0) return;
        super.update(playerPos);
        this.updateShield();

        this.jumpTimer++;
        const jumpCooldown = this.phase === 2 ? 180 : 300;
        
        if (this.jumpTimer > jumpCooldown && !this.isJumping) {
            this.jumpTimer = 0;
            this.leapAttack(playerPos);
        }
        
        if (this.isJumping) {
            this.mesh.position.y += Math.sin(this.jumpTimer * 0.1) * 0.5;
            if (this.jumpTimer > 31) { // End jump
                this.isJumping = false;
                this.mesh.position.y = 0;
                this.amberSlam();
            }
        }

        // V1.9.15 - Telegraphed triple-ring spore belch. Three concentric rings detonate
        // in sequence so the player has to step out, then back in, then out again.
        this._sporeBurstTimer = (this._sporeBurstTimer || 0) + 1;
        const burstCooldown = this.phase === 2 ? 240 : 360; // 4s / 6s
        if (this._sporeBurstTimer > burstCooldown && !this.shielded && !this.isJumping) {
            this._sporeBurstTimer = 0;
            this.sporeBelch();
        }
    }

    sporeBelch() {
        if (!window.game) return;
        const origin = this.mesh.position.clone();
        // V1.9.16 - Telegraph tuning: inner ring 700→900ms so the first hit isn't a
        // gotcha. Stagger the outer rings slightly farther apart for the same reason.
        this.spawnAoESpore(origin, 4,  900, 1.0, 0xffaa00);
        setTimeout(() => this.spawnAoESpore(origin, 7,  950, 1.0, 0xffaa00), 600);
        setTimeout(() => this.spawnAoESpore(origin, 10, 1000, 1.5, 0xffaa00), 1300);
    }

    onPhaseTransition() {
        super.onPhaseTransition();
        // V1.9.15 - On phase 2, Bogbelly inflates and shields for 4 seconds while
        // belching extra rot pools — the Sage's clue tells the player to back off.
        this.raiseShield(4000, 0xffaa00, 'rot-bloat');
        if (window.game) {
            // V1.9.16 - Slightly longer telegraph (1000ms) + wider stagger so the
            // 6-pool ring isn't a wall of simultaneous detonations.
            for (let i = 0; i < 6; i++) {
                const a = (i / 6) * Math.PI * 2;
                const pos = this.mesh.position.clone().add(new THREE.Vector3(Math.cos(a) * 6, 0, Math.sin(a) * 6));
                setTimeout(() => this.spawnAoESpore(pos, 4, 1000, 1.0, 0xffaa00), i * 180);
            }
        }
    }

    leapAttack(playerPos) {
        this.isJumping = true;
        this.jumpTimer = 0;
        // Move towards player quickly during leap
        const dir = new THREE.Vector3().subVectors(playerPos, this.mesh.position).normalize();
        this.knockbackVelocity.add(dir.multiplyScalar(0.8));
        if (window.game && window.game.impactSynth) {
            try { window.game.impactSynth.triggerAttackRelease("8n"); } catch (_) {}
        }
    }

    amberSlam() {
        if (!window.game) return;
        window.game.spawnExplosionParticles(this.mesh.position, 0xffaa00);
        // Create temporary rot pools (amber colored)
        for (let i = 0; i < 3; i++) {
            const angle = (i / 3) * Math.PI * 2;
            const pos = this.mesh.position.clone().add(new THREE.Vector3(Math.cos(angle) * 5, 0, Math.sin(angle) * 5));
            const hazard = new Hazard3D(this.scene, pos, 'ROT_POOL', { radius: 6 });
            hazard.poolMat.color.setHex(0xffaa00);
            hazard.poolMat.emissive.setHex(0xffaa00);
            window.game.hazards.push(hazard);
            // Self-destroy after some time
            setTimeout(() => {
                const idx = window.game.hazards.indexOf(hazard);
                if (idx !== -1) {
                    hazard.destroy();
                    window.game.hazards.splice(idx, 1);
                }
            }, 5000);
        }
    }

    shoot(playerPos) {
        const dir = new THREE.Vector3().subVectors(playerPos, this.mesh.position).normalize();
        const spawnPos = this.mesh.position.clone().add(new THREE.Vector3(0, 5, 0));
        const proj = new EnemyProjectile3D(this.scene, spawnPos, dir);
        proj.mesh.scale.set(3, 3, 3);
        proj.mesh.children[0].material.color.setHex(0xffaa00);
        proj.mesh.children[0].material.emissive.setHex(0xffaa00);
        proj.speed = 0.4;
        if (window.game) window.game.enemyProjectiles.push(proj);
    }
}

export class WidowcapWeaver3D extends Boss3D {
    constructor(scene, position, regionConfig) {
        super(scene, position, regionConfig);
        this.name = "Widowcap Weaver";
        this.maxHp = 350;
        this.hp = this.maxHp;
        this.mesh.scale.set(3, 3, 3);
        
        // Custom look: Webbed/Spidery mushroom
        const webMat = new THREE.MeshStandardMaterial({ color: 0xffffff, wireframe: true });
        const webGeo = new THREE.TorusKnotGeometry(1.5, 0.4, 64, 8);
        this.webbing = new THREE.Mesh(webGeo, webMat);
        this.webbing.position.y = 2;
        this.mesh.add(this.webbing);
    }

    update(playerPos) {
        if (this.hp <= 0) return;
        super.update(playerPos);
        this.updateShield();
        this.webbing.rotation.y += 0.02;

        if (this.phase === 2 && Math.random() < 0.01) {
            this.spawnSpiderlings();
        }

        // V1.9.15 - Silk Anchor Shield. Every ~12s the Weaver anchors herself to four
        // silk knots. She is shielded until the player destroys two of the four anchors.
        this._anchorTimer = (this._anchorTimer || 0) + 1;
        // V1.9.16 - Anchor cooldown tuning: phase 1 12s → 14s (more recovery between
        // shield phases), phase 2 7s → 8s (still tight, but reads more fairly).
        const anchorCooldown = this.phase === 2 ? 480 : 840;
        if (this._anchorTimer > anchorCooldown && !this.shielded) {
            this._anchorTimer = 0;
            this.summonSilkAnchors();
        }
        // Update anchor visuals + check break condition.
        if (this.silkAnchors && this.silkAnchors.length) {
            this.silkAnchors.forEach(a => {
                if (a.mesh) a.mesh.rotation.y += 0.05;
            });
        }

        // V1.9.15 - Phase 2: continuous AoE spore ring under the player.
        // V1.9.16 - Telegraph 1100 → 1200ms, cadence 6s → 7s for breathing room.
        if (this.phase === 2) {
            this._ringTimer = (this._ringTimer || 0) + 1;
            if (this._ringTimer > 420) {
                this._ringTimer = 0;
                const p = playerPos.clone();
                this.spawnAoESpore(p, 5, 1200, 1.2, 0xffffff);
            }
        }
    }

    summonSilkAnchors() {
        if (!window.game) return;
        const anchors = [];
        const ring = 6;
        for (let i = 0; i < 4; i++) {
            const a = (i / 4) * Math.PI * 2 + Math.PI / 4;
            const pos = this.mesh.position.clone().add(new THREE.Vector3(Math.cos(a) * ring, 0, Math.sin(a) * ring));
            const knotGeo = new THREE.TorusKnotGeometry(0.6, 0.18, 32, 6);
            const knotMat = new THREE.MeshStandardMaterial({ color: 0xffffff, emissive: 0xffffff, emissiveIntensity: 1.2 });
            const knot = new THREE.Mesh(knotGeo, knotMat);
            knot.position.copy(pos).setY(1.4);
            knot.userData.radius = 1.0;
            this.scene.add(knot);
            // V1.9.16 - Anchor HP raised 3 → 4 so cuts feel earned but the shield phase
            // is still beatable inside the 14s timeout (need 2/4 cuts = 8 swings).
            const anchor = { mesh: knot, hp: 4, maxHp: 4, dead: false };
            anchor.takeDamage = (amt) => {
                if (anchor.dead) return;
                anchor.hp -= amt;
                knotMat.emissiveIntensity = 4;
                setTimeout(() => { if (knotMat) knotMat.emissiveIntensity = 1.2; }, 80);
                if (anchor.hp <= 0) {
                    anchor.dead = true;
                    try { window.game.spawnExplosionParticles(knot.position, 0xffffff); } catch (_) {}
                    this.scene.remove(knot);
                }
            };
            // Make the anchor look like an enemy hit target by piggybacking on the
            // collidables list — Player melee uses a radius check against collidables.
            // Easier: expose a global hitTargets array the player melee will walk in main.
            anchors.push(anchor);
            window.game.bossHitTargets = (window.game.bossHitTargets || []);
            window.game.bossHitTargets.push(anchor);
        }
        this.silkAnchors = anchors;
        // Silk strands from boss to each anchor.
        this._silkLines = anchors.map(a => {
            const pts = [this.mesh.position.clone().setY(2), a.mesh.position.clone()];
            const lineGeo = new THREE.BufferGeometry().setFromPoints(pts);
            const lineMat = new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.7 });
            const line = new THREE.Line(lineGeo, lineMat);
            this.scene.add(line);
            return { line, anchor: a };
        });
        // Shield up; clears when 2/4 anchors are destroyed OR after 14s.
        this.shieldClearPredicate = () => {
            const alive = this.silkAnchors.filter(a => !a.dead).length;
            return alive <= 2;
        };
        this.raiseShield(14000, 0xffffff, 'silk-anchored');
    }

    dropShield() {
        super.dropShield();
        // Clean up remaining anchors + silk lines.
        if (this.silkAnchors) {
            this.silkAnchors.forEach(a => {
                if (!a.dead && a.mesh) {
                    try { this.scene.remove(a.mesh); } catch (_) {}
                }
                if (window.game && window.game.bossHitTargets) {
                    const idx = window.game.bossHitTargets.indexOf(a);
                    if (idx !== -1) window.game.bossHitTargets.splice(idx, 1);
                }
            });
            this.silkAnchors = [];
        }
        if (this._silkLines) {
            this._silkLines.forEach(s => {
                try { this.scene.remove(s.line); s.line.geometry.dispose(); s.line.material.dispose(); } catch (_) {}
            });
            this._silkLines = [];
        }
        this.shieldClearPredicate = null;
    }

    spawnSpiderlings() {
        if (!window.game || window.game.enemies.length > 30) return;
        const angle = Math.random() * Math.PI * 2;
        const pos = this.mesh.position.clone().add(new THREE.Vector3(Math.cos(angle) * 5, 0, Math.sin(angle) * 5));
        const spider = new Enemy3D(this.scene, pos, this.regionConfig);
        spider.hp = 5;
        spider.mesh.scale.set(0.5, 0.5, 0.5);
        window.game.enemies.push(spider);
    }

    shoot(playerPos) {
        const dir = new THREE.Vector3().subVectors(playerPos, this.mesh.position).normalize();
        const spawnPos = this.mesh.position.clone().add(new THREE.Vector3(0, 5, 0));
        const proj = new EnemyProjectile3D(this.scene, spawnPos, dir);
        proj.mesh.scale.set(2, 2, 2);
        proj.mesh.children[0].material.color.setHex(0xffffff);
        proj.mesh.children[0].material.emissive.setHex(0xffffff);
        // Silk effect: Slows player on hit
        proj.isSilk = true;
        if (window.game) window.game.enemyProjectiles.push(proj);
    }
}

export class RotCluster3D {
    constructor(scene, position, size = 1) {
        this.scene = scene;
        this.mesh = new THREE.Group();
        this.hp = 10 * size;
        this.size = size;
        this.isDestroyed = false;

        // Visuals: A cluster of jagged purple/green blocks
        const colors = [0xaa00ff, 0x1a0521, 0x39FF14];
        const count = 5 + Math.floor(Math.random() * 5);
        
        for (let i = 0; i < count; i++) {
            const blockGeo = new THREE.DodecahedronGeometry(0.5 + Math.random() * 0.5, 0);
            const blockMat = new THREE.MeshStandardMaterial({ 
                color: colors[Math.floor(Math.random() * colors.length)],
                emissive: colors[0],
                emissiveIntensity: 0.2
            });
            const block = new THREE.Mesh(blockGeo, blockMat);
            block.position.set(
                (Math.random() - 0.5) * 1.5 * size,
                (Math.random()) * 2 * size,
                (Math.random() - 0.5) * 1.5 * size
            );
            block.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI);
            this.mesh.add(block);
        }

        this.mesh.position.copy(position);
        this.scene.add(this.mesh);
        
        // Interaction radius for collision
        this.radius = 2 * size;
    }

    takeDamage(amount) {
        if (this.isDestroyed) return;
        this.hp -= amount;
        
        // Flash effect
        this.mesh.children.forEach(child => {
            if (child.material && child.material.emissiveIntensity !== undefined) {
                child.material.emissiveIntensity = 2;
                setTimeout(() => {
                    if (child.material) child.material.emissiveIntensity = 0.2;
                }, 100);
            }
        });

        if (this.hp <= 0) {
            this.destroy();
            return true;
        }
        return false;
    }

    destroy() {
        if (this.isDestroyed) return;
        this.isDestroyed = true;
        
        // Spawn some particles
        if (window.game) {
            window.game.spawnExplosionParticles(this.mesh.position, 0xaa00ff);
            // Chance to drop a blue spore
            if (Math.random() > 0.5) {
                window.game.spawnCollectible(this.mesh.position, 'LOOT', null, 5);
            }
        }
        
        this.scene.remove(this.mesh);
    }

    update() {
        // Minor animation or pulsing
        const pulse = 1 + Math.sin(Date.now() * 0.005) * 0.05;
        this.mesh.scale.set(pulse, pulse, pulse);
    }
}

export class SporeBomb3D {
    constructor(scene, position) {
        this.scene = scene;
        this.mesh = new THREE.Group();
        this.radius = 8;
        this.timer = 120; // 2 seconds at 60fps
        
        // Bomb Body
        const geo = new THREE.DodecahedronGeometry(0.5, 0);
        const mat = new THREE.MeshStandardMaterial({ 
            color: 0x39FF14, 
            emissive: 0x39FF14, 
            emissiveIntensity: 1 
        });
        this.bomb = new THREE.Mesh(geo, mat);
        this.mesh.add(this.bomb);
        
        // Fusing effect
        const fuseGeo = new THREE.CylinderGeometry(0.05, 0.05, 0.4);
        const fuseMat = new THREE.MeshStandardMaterial({ color: 0xff0000, emissive: 0xff0000, emissiveIntensity: 5 });
        this.fuse = new THREE.Mesh(fuseGeo, fuseMat);
        this.fuse.position.y = 0.4;
        this.mesh.add(this.fuse);

        this.mesh.position.copy(position);
        this.mesh.position.y = 0.5;
        this.scene.add(this.mesh);
    }

    update() {
        this.timer--;
        
        // Pulsing
        const pulse = 1 + Math.sin(this.timer * 0.2) * 0.1;
        this.mesh.scale.setScalar(pulse);
        this.bomb.material.emissiveIntensity = 5 - (this.timer / 120) * 4;

        if (this.timer <= 0) {
            this.explode();
            return false;
        }
        return true;
    }

    explode() {
        // Explosion visual
        const expGeo = new THREE.SphereGeometry(this.radius, 32, 32);
        const expMat = new THREE.MeshBasicMaterial({ 
            color: 0x39FF14, 
            transparent: true, 
            opacity: 0.8 
        });
        const exp = new THREE.Mesh(expGeo, expMat);
        exp.position.copy(this.mesh.position);
        this.scene.add(exp);

        if (window.game) {
            window.game.enemies.forEach(enemy => {
                const dist = enemy.mesh.position.distanceTo(this.mesh.position);
                if (dist < this.radius) {
                    const isDead = enemy.takeDamage(25);
                    if (isDead) {
                        if (typeof window.game.handleEnemyDeath === 'function') window.game.handleEnemyDeath(enemy);
                    } else {
                        // Strong knockback
                        const dir = new THREE.Vector3().subVectors(enemy.mesh.position, this.mesh.position).normalize();
                        enemy.applyKnockback(dir, 1.2);
                    }
                }
            });
            
            // Explosion sound
            if (window.game.impactSynth && typeof window.game.impactSynth.triggerAttackRelease === 'function') {
                try { window.game.impactSynth.triggerAttackRelease("4n"); } catch (_) {}
            }
        }

        let scale = 1;
        const interval = setInterval(() => {
            scale += 0.2;
            exp.scale.setScalar(scale);
            exp.material.opacity -= 0.05;
            if (exp.material.opacity <= 0) {
                this.scene.remove(exp);
                clearInterval(interval);
            }
        }, 30);

        this.destroy();
    }

    destroy() {
        this.scene.remove(this.mesh);
    }
}

export class VoxelCorruptedHazard3D {
    constructor(scene, position) {
        this.scene = scene;
        this.mesh = new THREE.Group();
        this.radius = 5;
        
        // Glitchy cube cluster
        for(let i=0; i<8; i++) {
            const size = 0.2 + Math.random() * 0.6;
            const geo = new THREE.BoxGeometry(size, size, size);
            const mat = new THREE.MeshStandardMaterial({ 
                color: 0xaa00ff, 
                emissive: 0xaa00ff, 
                emissiveIntensity: 2,
                wireframe: Math.random() > 0.5
            });
            const cube = new THREE.Mesh(geo, mat);
            cube.position.set(
                (Math.random()-0.5) * 4,
                Math.random() * 3,
                (Math.random()-0.5) * 4
            );
            cube.userData.originalPos = cube.position.clone();
            cube.userData.rotSpeed = new THREE.Vector3(Math.random()*0.1, Math.random()*0.1, Math.random()*0.1);
            this.mesh.add(cube);
        }

        this.mesh.position.copy(position);
        this.scene.add(this.mesh);
    }

    update(player) {
        this.mesh.children.forEach(cube => {
            cube.rotation.x += cube.userData.rotSpeed.x;
            cube.rotation.y += cube.userData.rotSpeed.y;
            cube.rotation.z += cube.userData.rotSpeed.z;
            
            // Jitter
            cube.position.x = cube.userData.originalPos.x + (Math.random()-0.5) * 0.1;
            cube.position.y = cube.userData.originalPos.y + (Math.random()-0.5) * 0.1;
            cube.position.z = cube.userData.originalPos.z + (Math.random()-0.5) * 0.1;
        });

        const dist = player.group.position.distanceTo(this.mesh.position);
        if (dist < this.radius) {
            player.takeDamage(0.05);
            if (window.game) window.game.glitchIntensity = Math.min(1, window.game.glitchIntensity + 0.05);
        }
    }

    destroy() {
        this.scene.remove(this.mesh);
    }
}

export class Hazard3D {
    constructor(scene, position, type, config = {}) {
        this.scene = scene;
        this.position = position;
        this.type = type; // 'VOLCANO', 'WEB_TRAP', 'ROT_POOL'
        this.config = config;
        this.mesh = new THREE.Group();
        this.mesh.position.copy(position);
        
        this.active = false;
        this.timer = Math.random() * 100;
        this.cooldown = config.cooldown || 200;
        this.duration = config.duration || 100;
        this.radius = config.radius || 4;

        this.init();
        this.scene.add(this.mesh);
    }

    init() {
        if (this.type === 'VOLCANO') {
            const geo = new THREE.DodecahedronGeometry(1.5, 0);
            const mat = new THREE.MeshStandardMaterial({ color: 0x331100, roughness: 1 });
            const rock = new THREE.Mesh(geo, mat);
            this.mesh.add(rock);
            
            const ventGeo = new THREE.ConeGeometry(0.8, 1.2, 6);
            this.ventMat = new THREE.MeshStandardMaterial({ color: 0xff4400, emissive: 0xff0000, emissiveIntensity: 1 });
            const vent = new THREE.Mesh(ventGeo, this.ventMat);
            vent.position.y = 1;
            this.mesh.add(vent);
            
            this.light = new THREE.PointLight(0xff4400, 0, 10);
            this.light.position.y = 2;
            this.mesh.add(this.light);

            // Lava particles group
            this.particles = new THREE.Group();
            this.mesh.add(this.particles);
        } else if (this.type === 'WEB_TRAP') {
            const webGeo = new THREE.TorusKnotGeometry(this.radius, 0.1, 64, 8);
            this.webMat = new THREE.MeshStandardMaterial({ color: 0xffffff, transparent: true, opacity: 0.3 });
            const web = new THREE.Mesh(webGeo, this.webMat);
            web.rotation.x = Math.PI / 2;
            this.mesh.add(web);

            // Silk particles
            this.silk = new THREE.Group();
            this.mesh.add(this.silk);
        } else if (this.type === 'ROT_POOL') {
            const poolGeo = new THREE.CircleGeometry(this.radius, 32);
            this.poolMat = new THREE.MeshStandardMaterial({ 
                color: 0xaa00ff, 
                transparent: true, 
                opacity: 0.5,
                emissive: 0xaa00ff,
                emissiveIntensity: 1
            });
            const pool = new THREE.Mesh(poolGeo, this.poolMat);
            pool.rotation.x = -Math.PI / 2;
            this.mesh.add(pool);

            // Bubbling particles
            this.bubbles = new THREE.Group();
            this.mesh.add(this.bubbles);
        }
    }

    update(player) {
        this.timer++;
        
        if (this.type === 'VOLCANO') {
            // ... (keep existing volcano logic)
            if (!this.active && this.timer > this.cooldown) {
                this.active = true;
                this.timer = 0;
                this.ventMat.emissiveIntensity = 10;
                this.light.intensity = 15;
                if (window.game && window.game.impactSynth) {
                    try { window.game.impactSynth.triggerAttackRelease("16n"); } catch (_) {}
                }
            }
            
            if (this.active) {
                if (this.timer < 30) {
                    this.spawnLava();
                    const dist = player.group.position.distanceTo(this.position);
                    if (dist < this.radius) player.takeDamage(0.05);
                }
                
                if (this.timer > this.duration) {
                    this.active = false;
                    this.timer = 0;
                    this.ventMat.emissiveIntensity = 1;
                    this.light.intensity = 0;
                }
            }

            this.particles.children.forEach(p => {
                p.position.add(p.userData.velocity);
                p.userData.velocity.y -= 0.01;
                p.material.opacity -= 0.02;
                if (p.material.opacity <= 0) this.particles.remove(p);
            });
        } else if (this.type === 'WEB_TRAP') {
            const dist = player.group.position.distanceTo(this.position);
            if (dist < this.radius) {
                player.modifiers.speedMult *= 0.5;
                this.webMat.opacity = 0.8;
                this.webMat.emissiveIntensity = 2;
                if (Math.random() > 0.9) this.spawnSilk();
            } else {
                this.webMat.opacity = 0.3;
            }

            this.silk.children.forEach(s => {
                s.position.y -= 0.01;
                s.rotation.y += 0.01;
                s.material.opacity -= 0.01;
                if (s.material.opacity <= 0) this.silk.remove(s);
            });
        } else if (this.type === 'ROT_POOL') {
            const dist = player.group.position.distanceTo(this.position);
            if (dist < this.radius) {
                player.takeDamage(0.02);
                this.poolMat.emissiveIntensity = 5;
                if (window.game) window.game.glitchIntensity = Math.min(1, window.game.glitchIntensity + 0.01);
            } else {
                this.poolMat.emissiveIntensity = 1;
            }

            // Animate bubbles
            if (Math.random() > 0.8) {
                this.spawnBubble();
            }
            this.bubbles.children.forEach(b => {
                b.position.y += 0.02;
                b.scale.multiplyScalar(1.02);
                b.material.opacity -= 0.02;
                if (b.material.opacity <= 0) this.bubbles.remove(b);
            });
        }
    }

    spawnBubble() {
        const bGeo = new THREE.SphereGeometry(0.1 + Math.random() * 0.2, 8, 8);
        const bMat = new THREE.MeshStandardMaterial({ 
            color: this.poolMat.color, 
            transparent: true, 
            opacity: 0.6,
            emissive: this.poolMat.emissive,
            emissiveIntensity: 2
        });
        const bubble = new THREE.Mesh(bGeo, bMat);
        const angle = Math.random() * Math.PI * 2;
        const dist = Math.random() * this.radius;
        bubble.position.set(Math.cos(angle) * dist, 0.1, Math.sin(angle) * dist);
        this.bubbles.add(bubble);
    }

    spawnSilk() {
        const sGeo = new THREE.BoxGeometry(0.5, 0.02, 0.02);
        const sMat = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.8 });
        const silk = new THREE.Mesh(sGeo, sMat);
        const angle = Math.random() * Math.PI * 2;
        const dist = Math.random() * this.radius;
        silk.position.set(Math.cos(angle) * dist, 2 + Math.random() * 2, Math.sin(angle) * dist);
        silk.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI);
        this.silk.add(silk);
    }

    spawnLava() {
        const pGeo = new THREE.BoxGeometry(0.3, 0.3, 0.3);
        const pMat = new THREE.MeshBasicMaterial({ color: 0xff4400, transparent: true });
        const p = new THREE.Mesh(pGeo, pMat);
        p.position.y = 1.2;
        const angle = Math.random() * Math.PI * 2;
        const speed = 0.1 + Math.random() * 0.2;
        p.userData.velocity = new THREE.Vector3(
            Math.cos(angle) * speed,
            0.2 + Math.random() * 0.2,
            Math.sin(angle) * speed
        );
        this.particles.add(p);
    }

    destroy() {
        this.scene.remove(this.mesh);
    }
}

export class GrandRotBoss3D extends Boss3D {
    constructor(scene, position, regionConfig) {
        super(scene, position, regionConfig);
        this.name = "The Grand Rot";
        this.maxHp = 1000;
        this.hp = this.maxHp;
        this.mesh.scale.set(6, 6, 6);
        this.isFinalBoss = true;
        this.attackPhase = 0;
        this.lastAttackTime = 0;
        this.shootCooldown = 1500;
        
        // Custom texture for final boss
        const loader = new THREE.TextureLoader();
        const bossTex = loader.load('assets/grand-rot-boss.webp');
        const spriteMat = new THREE.SpriteMaterial({ map: bossTex, transparent: true });
        this.sprite = new THREE.Sprite(spriteMat);
        this.sprite.scale.set(1.5, 1.5, 1);
        this.sprite.position.y = 0.5;
        this.mesh.add(this.sprite);
    }

    update(playerPos) {
        if (this.hp <= 0) return;
        super.update(playerPos);
        
        const now = Date.now();
        if (now - this.lastAttackTime > this.shootCooldown) {
            this.lastAttackTime = now;
            this.performRandomAttack(playerPos);
        }
    }

    performRandomAttack(playerPos) {
        const rand = Math.random();
        if (rand < 0.4) {
            this.radialBurst();
        } else if (rand < 0.7) {
            this.targetedGlitch(playerPos);
        } else {
            this.spawnRotMinions();
        }
    }

    radialBurst() {
        if (!window.game) return;
        for (let i = 0; i < 16; i++) {
            const angle = (i / 16) * Math.PI * 2;
            const dir = new THREE.Vector3(Math.cos(angle), 0, Math.sin(angle));
            const proj = new EnemyProjectile3D(this.scene, this.mesh.position.clone().add(new THREE.Vector3(0, 5, 0)), dir);
            proj.speed = 0.5;
            proj.mesh.scale.set(4, 4, 4);
            window.game.enemyProjectiles.push(proj);
        }
    }

    targetedGlitch(playerPos) {
        if (!window.game) return;
        window.game.glitchIntensity = 1.0;
        const dir = new THREE.Vector3().subVectors(playerPos, this.mesh.position).normalize();
        const proj = new EnemyProjectile3D(this.scene, this.mesh.position.clone().add(new THREE.Vector3(0, 5, 0)), dir);
        proj.speed = 0.8;
        proj.mesh.scale.set(6, 6, 6);
        proj.mesh.children[0].material.color.setHex(0xff00ff);
        window.game.enemyProjectiles.push(proj);
    }

    spawnRotMinions() {
        if (!window.game) return;
        for (let i = 0; i < 3; i++) {
            const angle = Math.random() * Math.PI * 2;
            const pos = this.mesh.position.clone().add(new THREE.Vector3(Math.cos(angle) * 15, 0, Math.sin(angle) * 15));
            const enemy = new Enemy3D(this.scene, pos, this.regionConfig);
            enemy.hp = 10;
            window.game.enemies.push(enemy);
        }
    }
}

export class InteractiveBuilding3D {
    constructor(scene, position, type, regionId) {
        this.scene = scene;
        this.type = type; // 'HOUSE', 'SHOP', 'SAVE', 'STORAGE'
        this.regionId = regionId;
        this.mesh = new THREE.Group();

        // V1.9.9 Free Stride - Real 3D blocky shop building, color-coded per role,
        // replacing the old flat sprite billboard. Reads as a proper Roblox-style storefront.
        const palette = {
            SHOP:    { wall: 0xd9a05a, roof: 0x4caf50, accent: 0x2e7d32, sign: 'SHOP',    glow: 0x66ff88 }, // Merchant: warm timber + leafy green awning
            SAVE:    { wall: 0xf4e3a1, roof: 0xffc94a, accent: 0xb8860b, sign: 'INN',     glow: 0xffe066 }, // Inn / save: cream + gold
            STORAGE: { wall: 0x9fb4d8, roof: 0x3b62a6, accent: 0x223e7a, sign: 'STORAGE', glow: 0x88ccff }, // Vault: cool blue stone
            HOUSE:   { wall: 0xc89878, roof: 0x9c4a2b, accent: 0x5a3a20, sign: 'HOME',    glow: 0xffaa66 }
        };
        const p = palette[type] || palette.HOUSE;

        // Plinth / stone foundation
        const plinth = new THREE.Mesh(
            new THREE.BoxGeometry(7.2, 0.5, 7.2),
            new THREE.MeshStandardMaterial({ color: 0x7a6648, roughness: 0.9 })
        );
        plinth.position.y = 0.25;
        this.mesh.add(plinth);

        // Walls
        const walls = new THREE.Mesh(
            new THREE.BoxGeometry(6.4, 4.2, 6.4),
            new THREE.MeshStandardMaterial({ color: p.wall, roughness: 0.7 })
        );
        walls.position.y = 2.6;
        this.mesh.add(walls);

        // Pitched roof (pyramid)
        const roof = new THREE.Mesh(
            new THREE.ConeGeometry(5.0, 2.6, 4),
            new THREE.MeshStandardMaterial({ color: p.roof, roughness: 0.55 })
        );
        roof.position.y = 4.7 + 1.3;
        roof.rotation.y = Math.PI / 4;
        this.mesh.add(roof);

        // Front-facing awning / colored band
        const awning = new THREE.Mesh(
            new THREE.BoxGeometry(6.8, 0.6, 1.6),
            new THREE.MeshStandardMaterial({ color: p.accent, roughness: 0.6 })
        );
        awning.position.set(0, 3.6, 3.6);
        this.mesh.add(awning);

        // Door
        const door = new THREE.Mesh(
            new THREE.BoxGeometry(1.4, 2.4, 0.18),
            new THREE.MeshStandardMaterial({ color: 0x4a2e16, roughness: 0.55 })
        );
        door.position.set(0, 1.7, 3.25);
        this.mesh.add(door);
        const knob = new THREE.Mesh(
            new THREE.SphereGeometry(0.1, 10, 10),
            new THREE.MeshStandardMaterial({ color: 0xffd060, metalness: 0.6, roughness: 0.3 })
        );
        knob.position.set(0.5, 1.7, 3.36);
        this.mesh.add(knob);

        // Two glowing front windows
        const winMat = new THREE.MeshStandardMaterial({ color: 0xfff2a0, emissive: 0xffcc55, emissiveIntensity: 1.2 });
        const frameMat = new THREE.MeshStandardMaterial({ color: 0x4a2e16, roughness: 0.6 });
        [-1.9, 1.9].forEach(x => {
            const f = new THREE.Mesh(new THREE.BoxGeometry(1.2, 1.0, 0.1), frameMat);
            f.position.set(x, 2.6, 3.25);
            this.mesh.add(f);
            const w = new THREE.Mesh(new THREE.BoxGeometry(1.0, 0.8, 0.08), winMat);
            w.position.set(x, 2.6, 3.30);
            this.mesh.add(w);
        });

        // Hanging shop sign on a wooden bracket
        const bracket = new THREE.Mesh(
            new THREE.BoxGeometry(0.12, 0.12, 0.9),
            new THREE.MeshStandardMaterial({ color: 0x4a2e16 })
        );
        bracket.position.set(0, 4.3, 3.9);
        this.mesh.add(bracket);
        const signBoard = new THREE.Mesh(
            new THREE.BoxGeometry(2.4, 1.0, 0.12),
            new THREE.MeshStandardMaterial({ color: 0xd9b277, roughness: 0.75 })
        );
        signBoard.position.set(0, 3.7, 4.35);
        this.mesh.add(signBoard);

        // Sign text via canvas texture, mounted on the board face.
        const cnv = document.createElement('canvas');
        cnv.width = 256; cnv.height = 112;
        const cx = cnv.getContext('2d');
        cx.fillStyle = 'rgba(0,0,0,0)';
        cx.fillRect(0, 0, 256, 112);
        cx.font = 'bold 36px "Press Start 2P", monospace';
        cx.fillStyle = '#3a2210';
        cx.textAlign = 'center';
        cx.textBaseline = 'middle';
        cx.fillText(p.sign, 128, 56);
        const tex = new THREE.CanvasTexture(cnv);
        tex.colorSpace = THREE.SRGBColorSpace;
        const labelMat = new THREE.MeshBasicMaterial({ map: tex, transparent: true });
        const labelMesh = new THREE.Mesh(new THREE.PlaneGeometry(2.2, 0.9), labelMat);
        labelMesh.position.set(0, 3.7, 4.42);
        this.mesh.add(labelMesh);

        // Chimney with a touch of smoke-poof on top
        const chimney = new THREE.Mesh(
            new THREE.BoxGeometry(0.7, 1.2, 0.7),
            new THREE.MeshStandardMaterial({ color: 0x5a3a20, roughness: 0.85 })
        );
        chimney.position.set(2.0, 5.2, -1.5);
        this.mesh.add(chimney);
        const puff = new THREE.Mesh(
            new THREE.SphereGeometry(0.5, 10, 10),
            new THREE.MeshStandardMaterial({ color: 0xdddddd, transparent: true, opacity: 0.55, roughness: 1.0 })
        );
        puff.position.set(2.0, 6.2, -1.5);
        this.mesh.add(puff);

        // Pulsing ground glow ring for interactives
        if (type !== 'HOUSE') {
            const glowGeo = new THREE.CircleGeometry(5, 32);
            const glowMat = new THREE.MeshBasicMaterial({ color: p.glow, transparent: true, opacity: 0.35 });
            const glow = new THREE.Mesh(glowGeo, glowMat);
            glow.rotation.x = -Math.PI / 2;
            glow.position.y = 0.05;
            this.mesh.add(glow);
            this._glow = glow;

            // Soft point light to make the storefront pop at night
            const lamp = new THREE.PointLight(p.glow, 0.8, 14);
            lamp.position.set(0, 3.6, 3.8);
            this.mesh.add(lamp);
        }

        this.mesh.position.copy(position);
        // Face the village center (player will approach from there).
        this.mesh.lookAt(0, this.mesh.position.y, 0);
        this.scene.add(this.mesh);

        // Interaction label
        this.label = this.createTextSprite(`[E] ${type}`);
        this.label.position.y = 8.2;
        this.label.visible = false;
        this.mesh.add(this.label);
    }

    createTextSprite(text) {
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        canvas.width = 256;
        canvas.height = 64;
        context.font = 'bold 24px "Press Start 2P", cursive';
        context.textAlign = 'center';
        context.fillStyle = '#ffffff';
        context.fillText(text, 128, 32);
        const texture = new THREE.CanvasTexture(canvas);
        const spriteMat = new THREE.SpriteMaterial({ map: texture, transparent: true });
        const sprite = new THREE.Sprite(spriteMat);
        sprite.scale.set(4, 1, 1);
        return sprite;
    }

    update(playerPos) {
        const dist = playerPos.distanceTo(this.mesh.position);
        this.label.visible = dist < 8;
    }
}

export class NPC3D {
    constructor(scene, position, name, config) {
        this.scene = scene;
        this.name = name;
        this.config = config;
        this.mesh = new THREE.Group();

        // V1.9.8 Free Stride - Fully 3D Roblox-R6 NPC body, no flat sprites.
        // Pick robe/cap colors deterministically from the name so each NPC reads as unique.
        let hash = 0;
        for (let i = 0; i < name.length; i++) hash = (hash * 31 + name.charCodeAt(i)) >>> 0;
        const palette = [
            { robe: 0xff5577, cap: 0xffe66d, skin: 0xf2c596 },
            { robe: 0x55aaff, cap: 0xff8844, skin: 0xe0a47b },
            { robe: 0x66dd66, cap: 0xaa66ff, skin: 0xf2c596 },
            { robe: 0xff9933, cap: 0x33cccc, skin: 0xd6996c },
            { robe: 0xaa66ff, cap: 0xffdd66, skin: 0xf2c596 },
            { robe: 0x33cc88, cap: 0xff66aa, skin: 0xe6b189 }
        ];
        const c = palette[hash % palette.length];

        const plastic = (color) => new THREE.MeshStandardMaterial({ color, roughness: 0.45, metalness: 0.05 });

        // Torso
        const torso = new THREE.Mesh(new THREE.BoxGeometry(0.9, 1.0, 0.5), plastic(c.robe));
        torso.position.y = 1.2;
        this.mesh.add(torso);

        // Head
        const head = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.55, 0.55), plastic(c.skin));
        head.position.y = 2.05;
        this.mesh.add(head);

        // Eyes
        const eyeMat = new THREE.MeshStandardMaterial({ color: 0x222222, emissive: 0x000000 });
        const leftEye = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.08, 0.05), eyeMat);
        leftEye.position.set(-0.13, 2.12, 0.28);
        this.mesh.add(leftEye);
        const rightEye = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.08, 0.05), eyeMat);
        rightEye.position.set(0.13, 2.12, 0.28);
        this.mesh.add(rightEye);

        // Arms
        const armGeo = new THREE.BoxGeometry(0.32, 0.95, 0.32);
        const leftArm = new THREE.Mesh(armGeo, plastic(c.robe));
        leftArm.position.set(-0.65, 1.2, 0);
        this.mesh.add(leftArm);
        const rightArm = new THREE.Mesh(armGeo, plastic(c.robe));
        rightArm.position.set(0.65, 1.2, 0);
        this.mesh.add(rightArm);
        this.leftArm = leftArm;
        this.rightArm = rightArm;

        // Legs
        const legGeo = new THREE.BoxGeometry(0.38, 0.85, 0.38);
        const leftLeg = new THREE.Mesh(legGeo, plastic(0x4a3220));
        leftLeg.position.set(-0.2, 0.45, 0);
        this.mesh.add(leftLeg);
        const rightLeg = new THREE.Mesh(legGeo, plastic(0x4a3220));
        rightLeg.position.set(0.2, 0.45, 0);
        this.mesh.add(rightLeg);

        // Mushroom cap hat (signature village look)
        const capGroup = new THREE.Group();
        const hatCap = new THREE.Mesh(
            new THREE.SphereGeometry(0.55, 14, 10, 0, Math.PI * 2, 0, Math.PI / 2),
            new THREE.MeshStandardMaterial({ color: c.cap, roughness: 0.5 })
        );
        capGroup.add(hatCap);
        const spotMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.6 });
        for (let i = 0; i < 4; i++) {
            const spot = new THREE.Mesh(new THREE.SphereGeometry(0.08, 8, 8), spotMat);
            const a = (i / 4) * Math.PI * 2;
            spot.position.set(Math.cos(a) * 0.32, 0.18, Math.sin(a) * 0.32);
            capGroup.add(spot);
        }
        capGroup.position.y = 2.35;
        this.mesh.add(capGroup);

        // Soft shadow disc for depth.
        const shadow = new THREE.Mesh(
            new THREE.CircleGeometry(0.7, 20),
            new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.35, depthWrite: false })
        );
        shadow.rotation.x = -Math.PI / 2;
        shadow.position.y = 0.02;
        this.mesh.add(shadow);

        this.label = this.createTextSprite(`${name}`);
        this.label.position.y = 3.4;
        this.mesh.add(this.label);

        this.mesh.position.copy(position);
        this.scene.add(this.mesh);

        this._idleSeed = Math.random() * Math.PI * 2;
    }

    createTextSprite(text) {
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        canvas.width = 256;
        canvas.height = 64;
        context.font = 'bold 18px "Press Start 2P", cursive';
        context.textAlign = 'center';
        context.fillStyle = '#39FF14';
        context.fillText(text, 128, 32);
        const texture = new THREE.CanvasTexture(canvas);
        const spriteMat = new THREE.SpriteMaterial({ map: texture, transparent: true });
        const sprite = new THREE.Sprite(spriteMat);
        sprite.scale.set(3, 0.75, 1);
        return sprite;
    }

    update(playerPos) {
        // Idle bob on the limbs/torso only - keep feet planted on the ground.
        const t = Date.now() * 0.0025 + this._idleSeed;
        if (this.leftArm)  this.leftArm.rotation.x  = Math.sin(t) * 0.15;
        if (this.rightArm) this.rightArm.rotation.x = -Math.sin(t) * 0.15;

        // Face the player loosely.
        const targetRotation = Math.atan2(playerPos.x - this.mesh.position.x, playerPos.z - this.mesh.position.z);
        this.mesh.rotation.y = targetRotation;
    }

    destroy() {
        this.scene.remove(this.mesh);
    }
}

export class Portal3D {
    constructor(scene, position, regionId, isLocked = true) {
        this.scene = scene;
        this.regionId = regionId;
        this.isLocked = isLocked;
        this.mesh = new THREE.Group();

        this.regionConfig = CONFIG.REGIONS.find(r => r.id === regionId) || { accent: 0x00ffff, name: 'Unknown' };
        this.baseColor = this.regionConfig.accent;
        this.displayColor = this.baseColor;
        this.labelBorderColor = '#39FF14';
        this.labelTextColor = '#ffffff';
        this.territoryText = null;
        const color = isLocked ? 0x222222 : this.baseColor;
        
        // Frame - Larger and more prominent
        const ringGeo = new THREE.TorusGeometry(3.5, 0.3, 16, 64);
        const ringMat = new THREE.MeshStandardMaterial({ 
            color: color, 
            emissive: color, 
            emissiveIntensity: isLocked ? 0.2 : 5.0 
        });
        this.ring = new THREE.Mesh(ringGeo, ringMat);
        this.mesh.add(this.ring);

        // Core - Swirling energy effect
        const coreGeo = new THREE.TorusKnotGeometry(2.0, 0.4, 128, 16);
        this.coreMat = new THREE.MeshStandardMaterial({ 
            color: color, 
            transparent: true, 
            opacity: isLocked ? 0.1 : 0.8,
            emissive: color,
            emissiveIntensity: isLocked ? 0.1 : 10.0 // Increased intensity
        });
        this.core = new THREE.Mesh(coreGeo, this.coreMat);
        this.mesh.add(this.core);

        // Ground Glow - Added for more presence
        if (!isLocked) {
            const glowGeo = new THREE.CircleGeometry(5, 32);
            const glowMat = new THREE.MeshBasicMaterial({ color: color, transparent: true, opacity: 0.3 });
            this.groundGlow = new THREE.Mesh(glowGeo, glowMat);
            this.groundGlow.rotation.x = -Math.PI / 2;
            this.groundGlow.position.y = -4.4;
            this.mesh.add(this.groundGlow);
            
            // Pillar of light
            const pillarGeo = new THREE.CylinderGeometry(3, 3, 20, 16, 1, true);
            const pillarMat = new THREE.MeshBasicMaterial({ color: color, transparent: true, opacity: 0.1, side: THREE.DoubleSide });
            this.lightPillar = new THREE.Mesh(pillarGeo, pillarMat);
            this.lightPillar.position.y = 5;
            this.mesh.add(this.lightPillar);

            // Point Light for Glow
            this.light = new THREE.PointLight(color, 20, 15);
            this.light.position.y = 0;
            this.mesh.add(this.light);
        }

        // Region Resemblance: Extra elements
        if (!isLocked) {
            if (regionId === 'crystalcap') {
                for (let i = 0; i < 4; i++) {
                    const cryGeo = new THREE.OctahedronGeometry(0.5, 0);
                    const cry = new THREE.Mesh(cryGeo, ringMat);
                    const angle = (i / 4) * Math.PI * 2;
                    cry.position.set(Math.cos(angle) * 4.5, Math.sin(angle) * 4.5, 0);
                    this.mesh.add(cry);
                }
            } else if (regionId === 'emberstem') {
                this.particles = new THREE.Group();
                for (let i = 0; i < 20; i++) {
                    const pGeo = new THREE.BoxGeometry(0.2, 0.2, 0.2);
                    const pMat = new THREE.MeshBasicMaterial({ color: 0xff4400, transparent: true });
                    const p = new THREE.Mesh(pGeo, pMat);
                    p.position.set((Math.random() - 0.5) * 4, (Math.random() - 0.5) * 4, (Math.random() - 0.5) * 4);
                    this.particles.add(p);
                }
                this.mesh.add(this.particles);
            } else if (regionId === 'silkspore') {
                const webGeo = new THREE.TorusKnotGeometry(1.5, 0.05, 64, 8);
                const webMat = new THREE.MeshStandardMaterial({ color: 0xffffff, transparent: true, opacity: 0.3 });
                const web = new THREE.Mesh(webGeo, webMat);
                this.mesh.add(web);
            } else if (regionId === 'voidlichen') {
                const voidGeo = new THREE.IcosahedronGeometry(1.5, 0);
                const voidMat = new THREE.MeshStandardMaterial({ color: 0xaa00ff, wireframe: true });
                const voidMesh = new THREE.Mesh(voidGeo, voidMat);
                this.mesh.add(voidMesh);
            } else if (regionId === 'region8' || regionId === 'mushroomKingdom') {
                // Hub portal: ring of glowing green spores
                for (let i = 0; i < 6; i++) {
                    const sporeGeo = new THREE.SphereGeometry(0.3, 8, 8);
                    const sporeMat = new THREE.MeshStandardMaterial({ color: 0x39FF14, emissive: 0x39FF14, emissiveIntensity: 2 });
                    const spore = new THREE.Mesh(sporeGeo, sporeMat);
                    const angle = (i / 6) * Math.PI * 2;
                    spore.position.set(Math.cos(angle) * 4.0, Math.sin(angle) * 4.0, 0);
                    this.mesh.add(spore);
                }
            } else if (regionId === 'sporewood') {
                // Sporewood: tiny floating leaves + mushroom-cap motes
                this.particles = new THREE.Group();
                for (let i = 0; i < 18; i++) {
                    const leafGeo = new THREE.BoxGeometry(0.18, 0.04, 0.28);
                    const leafMat = new THREE.MeshStandardMaterial({ color: 0x39FF14, emissive: 0x2a8a1a, emissiveIntensity: 0.9, transparent: true });
                    const leaf = new THREE.Mesh(leafGeo, leafMat);
                    leaf.position.set((Math.random() - 0.5) * 5, (Math.random() - 0.5) * 4, (Math.random() - 0.5) * 1.5);
                    leaf.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI);
                    this.particles.add(leaf);
                }
                this.mesh.add(this.particles);
            } else if (regionId === 'ambermycel') {
                // Ambermycel: amber resin droplets bobbing
                this.particles = new THREE.Group();
                for (let i = 0; i < 16; i++) {
                    const dGeo = new THREE.SphereGeometry(0.18 + Math.random() * 0.12, 8, 8);
                    const dMat = new THREE.MeshStandardMaterial({ color: 0xffaa33, emissive: 0xff7711, emissiveIntensity: 1.4, transparent: true, opacity: 0.95 });
                    const d = new THREE.Mesh(dGeo, dMat);
                    d.position.set((Math.random() - 0.5) * 5, (Math.random() - 0.5) * 4, (Math.random() - 0.5) * 1.5);
                    this.particles.add(d);
                }
                this.mesh.add(this.particles);
            } else if (regionId === 'thronecap') {
                // Thronecap: ominous crimson shards orbiting the core
                this.particles = new THREE.Group();
                for (let i = 0; i < 8; i++) {
                    const sGeo = new THREE.TetrahedronGeometry(0.45, 0);
                    const sMat = new THREE.MeshStandardMaterial({ color: 0xff2244, emissive: 0xff0000, emissiveIntensity: 2.2 });
                    const s = new THREE.Mesh(sGeo, sMat);
                    const a = (i / 8) * Math.PI * 2;
                    s.position.set(Math.cos(a) * 3.0, Math.sin(a) * 1.5, Math.sin(a) * 2.0);
                    this.particles.add(s);
                }
                this.mesh.add(this.particles);
                // Pulsing red point light over the throne portal
                const throneLight = new THREE.PointLight(0xff0033, 3.0, 18);
                throneLight.position.set(0, 0, 2);
                this.mesh.add(throneLight);
                this._throneLight = throneLight;
            }
        }

        // Floating Label using Canvas Texture
        this.label = this.createTextSprite(isLocked ? `LOCKED: ${this.regionConfig.name}` : this.regionConfig.name);
        this.label.position.y = 5.5;
        this.mesh.add(this.label);

        // Spatial Audio
        if (!isLocked) {
            this.panner = createToneNode(() => new TONE.Panner3D({
                positionX: position.x,
                positionY: position.y,
                positionZ: position.z,
                rolloffFactor: 4 // Sharper rolloff for portals
            }).toDestination());
            
            this.hum = createToneNode(() => new TONE.Oscillator(100, "sine").connect(this.panner).start());
            this.hum.volume.value = -30; // Lowered from -20
        }

        this.mesh.position.copy(position);
        this.mesh.position.y = 4.5;
        this.scene.add(this.mesh);
    }

    enableAudio() {
        if (this.isLocked || this.panner !== SILENT_AUDIO_NODE || !canUseTone()) return;
        this.panner = createToneNode(() => new TONE.Panner3D({
            positionX: this.mesh.position.x,
            positionY: this.mesh.position.y,
            positionZ: this.mesh.position.z,
            rolloffFactor: 4
        }).toDestination());
        this.hum = createToneNode(() => new TONE.Oscillator(100, "sine").connect(this.panner).start());
        this.hum.volume.value = -30;
    }

    createTextSprite(text, borderColor = '#39FF14', textColor = '#ffffff') {
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        canvas.width = 512;
        canvas.height = 128;
        const lines = String(text || '').split('\n').filter(Boolean);
        const fontSize = lines.length > 1 ? 28 : 40;
        const lineHeight = lines.length > 1 ? 34 : 0;
        
        context.fillStyle = 'rgba(0,0,0,0.7)';
        context.fillRect(0, 0, canvas.width, canvas.height);
        context.strokeStyle = borderColor;
        context.lineWidth = 4;
        context.strokeRect(2, 2, canvas.width - 4, canvas.height - 4);
        
        context.font = `bold ${fontSize}px "Press Start 2P", cursive`;
        context.textAlign = 'center';
        context.textBaseline = 'middle';
        context.fillStyle = textColor;
        if (lines.length > 1) {
            const midY = canvas.height / 2;
            const startY = midY - ((lines.length - 1) * lineHeight / 2);
            lines.forEach((line, index) => {
                context.fillText(line.toUpperCase(), canvas.width / 2, startY + (index * lineHeight));
            });
        } else {
            context.fillText(String(text).toUpperCase(), canvas.width / 2, canvas.height / 2);
        }

        const texture = new THREE.CanvasTexture(canvas);
        const spriteMat = new THREE.SpriteMaterial({ map: texture, transparent: true });
        const sprite = new THREE.Sprite(spriteMat);
        sprite.scale.set(6, 1.5, 1);
        return sprite;
    }

    refreshLabel() {
        if (this.label) this.mesh.remove(this.label);
        const labelText = this.isLocked
            ? `LOCKED: ${this.regionConfig.name}`
            : (this.territoryText ? `${this.regionConfig.name}\n${this.territoryText}` : this.regionConfig.name);
        this.label = this.createTextSprite(labelText, this.labelBorderColor, this.labelTextColor);
        this.label.position.y = 5.5;
        this.mesh.add(this.label);
    }

    refreshVisualState() {
        const color = this.isLocked ? 0x222222 : (this.displayColor || this.baseColor || 0x00ffff);
        this.ring.material.color.setHex(color);
        this.ring.material.emissive.setHex(color);
        this.ring.material.emissiveIntensity = this.isLocked ? 0.2 : 5.0;
        this.coreMat.color.setHex(color);
        this.coreMat.emissive.setHex(color);
        this.coreMat.opacity = this.isLocked ? 0.1 : 0.6;
        if (this.groundGlow?.material?.color) this.groundGlow.material.color.setHex(color);
        if (this.lightPillar?.material?.color) this.lightPillar.material.color.setHex(color);
        if (this.light) this.light.color.setHex(color);
        this.refreshLabel();
    }

    applyTerritoryState(territory = null) {
        this.displayColor = Number.isFinite(territory?.color) ? territory.color : this.baseColor;
        this.labelBorderColor = territory?.borderColor || '#39FF14';
        this.labelTextColor = territory?.textColor || '#ffffff';
        this.territoryText = territory?.text || null;
        this.refreshVisualState();
    }

    setLocked(locked) {
        this.isLocked = locked;
        this.refreshVisualState();

        if (locked) {
            if (this.hum) this.hum.stop();
            if (this.panner) this.panner.dispose();
            this.hum = null;
            this.panner = null;
        } else {
            this.enableAudio();
        }
    }

    update() {
        this.ring.rotation.z += 0.01;
        this.core.rotation.x += 0.02;
        this.core.rotation.y += 0.01;
        if (!this.isLocked) {
            const t = Date.now() * 0.005;
            const glow = 2.0 + Math.sin(t) * 1.0;
            this.coreMat.emissiveIntensity = glow;
            this.ring.scale.setScalar(1 + Math.sin(t) * 0.05);

            if (this.particles) {
                this.particles.children.forEach((p, i) => {
                    p.position.y += 0.02;
                    if (p.position.y > 2) p.position.y = -2;
                    if (p.material && 'opacity' in p.material) {
                        p.material.opacity = Math.max(0.2, 1 - (p.position.y + 2) / 4);
                    }
                    p.rotation.x += 0.01;
                    p.rotation.y += 0.015;
                });
            }
            if (this._throneLight) {
                this._throneLight.intensity = 2.0 + Math.sin(t * 2) * 1.2;
            }
        }
    }

    destroy() {
        if (this.hum) this.hum.stop();
        if (this.panner) this.panner.dispose();
        this.scene.remove(this.mesh);
    }
}

export class Collectible3D {
    constructor(scene, position, type, clanId = null, amount = null, keyItemConfig = null) {
        this.scene = scene;
        this.type = type; // 'XP', 'LOOT', 'GOLDEN_SPORE', 'INGREDIENT', 'POTION', 'BOMB', 'SALVE', 'KEY_ITEM', 'CROWN_SHARD', 'SKILL_POINT', 'POWERUP_FURY', 'POWERUP_WARD', 'POWERUP_REGEN'
        this.amount = amount;
        this.keyItemConfig = keyItemConfig; // V1.9.12 - { id, name, color, shape } from CONFIG.PORTAL_KEYS
        this.mesh = new THREE.Group();
        
        let color = 0x39FF14;
        let size = 0.3;
        
        const isMultiplier = (type === 'LOOT' && amount > 5) || (type !== 'LOOT' && amount > 1 && !['POTION', 'BOMB', 'SALVE'].includes(type));

        // V1.9.46 - Crown Shard: major boss reward with a brighter silhouette than ordinary loot.
        if (type === 'CROWN_SHARD') {
            color = 0xffff66;
            const shardMat = new THREE.MeshStandardMaterial({ color, emissive: 0xffcc33, emissiveIntensity: 5, metalness: 0.2, roughness: 0.25 });
            const shard = new THREE.Mesh(new THREE.OctahedronGeometry(0.6, 0), shardMat);
            shard.rotation.z = Math.PI / 4;
            this.mesh.add(shard);
            this._shardCore = shard;

            const crownRing = new THREE.Mesh(
                new THREE.TorusGeometry(0.82, 0.08, 10, 32),
                new THREE.MeshBasicMaterial({ color: 0xff66cc, transparent: true, opacity: 0.55 })
            );
            crownRing.rotation.x = Math.PI / 2;
            this.mesh.add(crownRing);
            this._shardRing = crownRing;

            const pillar = new THREE.Mesh(
                new THREE.CylinderGeometry(0.42, 0.42, 8, 12, 1, true),
                new THREE.MeshBasicMaterial({ color: 0xffff99, transparent: true, opacity: 0.18, side: THREE.DoubleSide })
            );
            pillar.position.y = 3.3;
            this.mesh.add(pillar);

            const light = new THREE.PointLight(0xffee88, 3.5, 13);
            light.position.y = 1.2;
            this.mesh.add(light);

            this.mesh.position.copy(position);
            this.mesh.position.y = 1.3;
            this.scene.add(this.mesh);
            this.rotationSpeed = 0.05;
            this.floatY = Math.random() * Math.PI * 2;
            return;
        }

        // V1.9.12 - Key item: glowing region-themed trophy. Larger, brighter, and floats on a beam.
        if (type === 'KEY_ITEM' && keyItemConfig) {
            const k = keyItemConfig;
            color = k.color;
            const coreMat = new THREE.MeshStandardMaterial({ color, emissive: color, emissiveIntensity: 6 });
            let core;
            if (k.shape === 'leaf') {
                core = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.08, 0.45), coreMat);
            } else if (k.shape === 'fang') {
                core = new THREE.Mesh(new THREE.ConeGeometry(0.35, 1.0, 6), coreMat);
            } else if (k.shape === 'octa') {
                core = new THREE.Mesh(new THREE.OctahedronGeometry(0.55, 0), coreMat);
            } else if (k.shape === 'sphere') {
                core = new THREE.Mesh(new THREE.SphereGeometry(0.5, 16, 12), coreMat);
            } else if (k.shape === 'silk') {
                core = new THREE.Mesh(new THREE.TorusKnotGeometry(0.35, 0.08, 80, 12), coreMat);
            } else if (k.shape === 'core') {
                core = new THREE.Mesh(new THREE.IcosahedronGeometry(0.5, 0), coreMat);
            } else if (k.shape === 'eye') {
                core = new THREE.Mesh(new THREE.SphereGeometry(0.55, 24, 18), coreMat);
                const pupil = new THREE.Mesh(
                    new THREE.SphereGeometry(0.22, 12, 10),
                    new THREE.MeshBasicMaterial({ color: 0x000000 })
                );
                pupil.position.z = 0.45;
                core.add(pupil);
            } else {
                core = new THREE.Mesh(new THREE.IcosahedronGeometry(0.5, 0), coreMat);
            }
            this.mesh.add(core);
            this._keyCore = core;

            // Glow ring beneath the key
            const ring = new THREE.Mesh(
                new THREE.RingGeometry(0.6, 1.2, 32),
                new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.5, side: THREE.DoubleSide })
            );
            ring.rotation.x = -Math.PI / 2;
            ring.position.y = -0.5;
            this.mesh.add(ring);
            this._keyRing = ring;

            // Pillar of light so it's visible from across the map
            const pillarMat = new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.18, side: THREE.DoubleSide });
            const pillar = new THREE.Mesh(new THREE.CylinderGeometry(0.4, 0.4, 8, 12, 1, true), pillarMat);
            pillar.position.y = 3.5;
            this.mesh.add(pillar);

            const light = new THREE.PointLight(color, 3, 12);
            this.mesh.add(light);

            this.mesh.position.copy(position);
            this.mesh.position.y = 1.2;
            this.scene.add(this.mesh);
            this.rotationSpeed = 0.04;
            this.floatY = 0;
            return;
        }

        if (['SKILL_POINT', 'POWERUP_FURY', 'POWERUP_WARD', 'POWERUP_REGEN'].includes(type)) {
            const palette = {
                SKILL_POINT: { color: 0xff66ff, emissive: 0xff44ff, geo: new THREE.OctahedronGeometry(0.45, 0) },
                POWERUP_FURY: { color: 0xff8844, emissive: 0xff4400, geo: new THREE.TorusKnotGeometry(0.32, 0.1, 64, 12) },
                POWERUP_WARD: { color: 0x66ddff, emissive: 0x00ffff, geo: new THREE.IcosahedronGeometry(0.46, 0) },
                POWERUP_REGEN: { color: 0x7dff9f, emissive: 0x39ff14, geo: new THREE.SphereGeometry(0.38, 18, 14) }
            };
            const cfg = palette[type] || palette.SKILL_POINT;
            const core = new THREE.Mesh(
                cfg.geo,
                new THREE.MeshStandardMaterial({ color: cfg.color, emissive: cfg.emissive, emissiveIntensity: 3.8, metalness: 0.2, roughness: 0.25 })
            );
            this.mesh.add(core);
            this._powerupCore = core;

            const ring = new THREE.Mesh(
                new THREE.TorusGeometry(0.72, 0.06, 10, 28),
                new THREE.MeshBasicMaterial({ color: cfg.color, transparent: true, opacity: 0.5 })
            );
            ring.rotation.x = Math.PI / 2;
            this.mesh.add(ring);
            this._powerupRing = ring;

            const light = new THREE.PointLight(cfg.color, 2.4, 8);
            light.position.y = 0.3;
            this.mesh.add(light);

            this.mesh.position.copy(position);
            this.mesh.position.y = 1.15;
            this.scene.add(this.mesh);
            this.rotationSpeed = 0.06;
            this.floatY = Math.random() * Math.PI * 2;
            return;
        }

        if (type === 'LOOT' || type === 'GOLDEN_SPORE' || type === 'INGREDIENT' || ['POTION', 'BOMB', 'SALVE'].includes(type)) {
            size = isMultiplier ? 0.8 : 0.5;
            
            if (type === 'GOLDEN_SPORE') {
                color = 0xffff00;
                const geo = isMultiplier ? new THREE.TorusKnotGeometry(0.5, 0.15, 64, 12) : new THREE.TorusKnotGeometry(0.3, 0.1, 32, 8);
                const mat = new THREE.MeshStandardMaterial({ color: color, emissive: color, emissiveIntensity: isMultiplier ? 8 : 3 });
                this.mesh.add(new THREE.Mesh(geo, mat));
            } else if (type === 'INGREDIENT') {
                color = 0xff5500;
                const geo = isMultiplier ? new THREE.DodecahedronGeometry(0.6, 0) : new THREE.DodecahedronGeometry(0.3, 0);
                const mat = new THREE.MeshStandardMaterial({ color: color, emissive: color, emissiveIntensity: isMultiplier ? 8 : 3 });
                this.mesh.add(new THREE.Mesh(geo, mat));
            } else if (type === 'POTION') {
                color = 0xff0000;
                const geo = new THREE.CylinderGeometry(0.2, 0.3, 0.6, 8);
                const mat = new THREE.MeshStandardMaterial({ color: color, emissive: color, emissiveIntensity: 2 });
                this.mesh.add(new THREE.Mesh(geo, mat));
                const corkGeo = new THREE.BoxGeometry(0.15, 0.1, 0.15);
                const corkMat = new THREE.MeshStandardMaterial({ color: 0x4d2600 });
                const cork = new THREE.Mesh(corkGeo, corkMat);
                cork.position.y = 0.35;
                this.mesh.add(cork);
            } else if (type === 'BOMB') {
                color = 0x39FF14;
                const geo = new THREE.SphereGeometry(0.35, 8, 8);
                const mat = new THREE.MeshStandardMaterial({ color: color, emissive: color, emissiveIntensity: 2 });
                this.mesh.add(new THREE.Mesh(geo, mat));
                const fuseGeo = new THREE.CylinderGeometry(0.05, 0.05, 0.2);
                const fuseMat = new THREE.MeshStandardMaterial({ color: 0xff0000, emissive: 0xff0000, emissiveIntensity: 5 });
                const fuse = new THREE.Mesh(fuseGeo, fuseMat);
                fuse.position.y = 0.4;
                this.mesh.add(fuse);
            } else if (type === 'SALVE') {
                color = 0x00ffff;
                const geo = new THREE.BoxGeometry(0.4, 0.2, 0.4);
                const mat = new THREE.MeshStandardMaterial({ color: color, emissive: color, emissiveIntensity: 2 });
                this.mesh.add(new THREE.Mesh(geo, mat));
            } else {
                // BLUE SPORES
                color = 0x00aaff; 
                const geo = new THREE.BoxGeometry(size, size, size);
                const mat = new THREE.MeshStandardMaterial({ color: color, emissive: color, emissiveIntensity: isMultiplier ? 8 : 3 });
                this.mesh.add(new THREE.Mesh(geo, mat));
            }

            if (isMultiplier) {
                const light = new THREE.PointLight(color, 2, 5);
                this.mesh.add(light);
            }
        } else {
            const geo = new THREE.IcosahedronGeometry(size, 0);
            const mat = new THREE.MeshStandardMaterial({ color: color, emissive: color, emissiveIntensity: 4 });
            this.mesh.add(new THREE.Mesh(geo, mat));
        }
        
        this.mesh.position.copy(position);
        this.mesh.position.y = 1;
        this.scene.add(this.mesh);
        this.rotationSpeed = isMultiplier ? 0.1 : 0.05;
        this.floatY = 0;
    }

    update() {
        this.mesh.rotation.y += this.rotationSpeed;
        this.floatY += 0.05;
        if (this.type === 'CROWN_SHARD') {
            this.mesh.position.y = 1.7 + Math.sin(this.floatY) * 0.32;
            if (this._shardRing) {
                this._shardRing.rotation.z += 0.035;
                const s = 1 + Math.sin(this.floatY * 1.35) * 0.12;
                this._shardRing.scale.set(s, s, 1);
            }
            if (this._shardCore) {
                this._shardCore.rotation.x += 0.02;
                this._shardCore.rotation.z += 0.01;
            }
            return;
        }
        // Key items float higher and have a stronger sine bob so they read as a beacon.
        if (this.type === 'KEY_ITEM') {
            this.mesh.position.y = 1.6 + Math.sin(this.floatY) * 0.35;
            if (this._keyRing) {
                const s = 1 + Math.sin(this.floatY * 1.5) * 0.15;
                this._keyRing.scale.set(s, s, 1);
                this._keyRing.material.opacity = 0.35 + Math.sin(this.floatY * 1.5) * 0.2;
            }
            return;
        }
        if (['SKILL_POINT', 'POWERUP_FURY', 'POWERUP_WARD', 'POWERUP_REGEN'].includes(this.type)) {
            this.mesh.position.y = 1.25 + Math.sin(this.floatY) * 0.28;
            if (this._powerupCore) {
                this._powerupCore.rotation.x += 0.02;
                this._powerupCore.rotation.z += 0.015;
            }
            if (this._powerupRing) {
                this._powerupRing.rotation.z += 0.03;
                const s = 1 + Math.sin(this.floatY * 1.6) * 0.12;
                this._powerupRing.scale.set(s, s, 1);
            }
            return;
        }
        this.mesh.position.y = 1 + Math.sin(this.floatY) * 0.2;
    }

    destroy() {
        this.scene.remove(this.mesh);
    }
}

export class TerritoryFlag3D {
    constructor(scene, position, options = {}) {
        this.scene = scene;
        this.regionId = options.regionId || null;
        this.mesh = new THREE.Group();
        this.state = null;

        const pole = new THREE.Mesh(
            new THREE.CylinderGeometry(0.08, 0.12, 6.6, 10),
            new THREE.MeshStandardMaterial({ color: 0xc8c8d4, metalness: 0.65, roughness: 0.35 })
        );
        pole.position.y = 3.3;
        this.mesh.add(pole);

        const finial = new THREE.Mesh(
            new THREE.SphereGeometry(0.22, 16, 12),
            new THREE.MeshStandardMaterial({ color: 0xffdd88, emissive: 0xffaa22, emissiveIntensity: 0.45 })
        );
        finial.position.y = 6.75;
        this.mesh.add(finial);

        this.bannerMat = new THREE.MeshStandardMaterial({
            color: 0x39ff14,
            emissive: 0x39ff14,
            emissiveIntensity: 0.55,
            side: THREE.DoubleSide,
            transparent: true,
            opacity: 0.92
        });
        this.banner = new THREE.Mesh(new THREE.PlaneGeometry(2.9, 1.65, 10, 6), this.bannerMat);
        this.banner.position.set(1.45, 5.55, 0);
        this.banner.rotation.y = Math.PI;
        this.mesh.add(this.banner);

        this.baseRing = new THREE.Mesh(
            new THREE.TorusGeometry(1.85, 0.12, 12, 40),
            new THREE.MeshBasicMaterial({ color: 0x39ff14, transparent: true, opacity: 0.42 })
        );
        this.baseRing.rotation.x = Math.PI / 2;
        this.baseRing.position.y = 0.12;
        this.mesh.add(this.baseRing);

        this.light = new THREE.PointLight(0x39ff14, 1.7, 11, 1.4);
        this.light.position.set(0.6, 4.8, 0);
        this.mesh.add(this.light);

        this.mesh.position.copy(position);
        this.scene.add(this.mesh);
        this._waveT = Math.random() * Math.PI * 2;
    }

    applyState(state = {}) {
        this.state = state;
        const visual = getClanVisual(state.clanId || 'myco');
        const color = Number.isFinite(state.color) ? state.color : visual.magic;
        this.bannerMat.color.setHex(color);
        this.bannerMat.emissive.setHex(color);
        this.bannerMat.emissiveIntensity = state.contested ? 0.9 : 0.55;
        this.baseRing.material.color.setHex(color);
        this.baseRing.material.opacity = state.contested ? 0.68 : 0.42;
        this.light.color.setHex(color);
        this.light.intensity = state.contested ? 2.2 : 1.7;
        this.banner.scale.y = state.sanctuary ? 1.08 : 1;
    }

    update() {
        this._waveT += 0.08;
        const pos = this.banner.geometry.attributes.position;
        const arr = pos.array;
        for (let i = 0; i < arr.length; i += 3) {
            const x = arr[i];
            const y = arr[i + 1];
            arr[i + 2] = Math.sin(this._waveT + x * 2.2 + y * 0.8) * 0.18;
        }
        pos.needsUpdate = true;
        this.baseRing.rotation.z += 0.008;
    }

    destroy() {
        this.scene.remove(this.mesh);
    }
}

export class RemoteClanPlayer3D {
    constructor(scene) {
        this.scene = scene;
        this.group = new THREE.Group();
        this.targetPosition = new THREE.Vector3();
        this.targetRotationY = 0;
        this._floatT = Math.random() * Math.PI * 2;
        this.activeSlot = 1;
        this.currentWeaponId = 'none';
        this.currentClan = 'myco';
        this.name = 'Wanderer';
        this.hp = 5;
        this.maxHp = 5;
        this.invulnerableUntil = 0;
        this.hitFlashUntil = 0;
        this._lastShieldSecond = -1;

        const bodyMat = new THREE.MeshStandardMaterial({ color: 0xefe8d7, roughness: 0.95 });
        this.body = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.36, 1.3, 8), bodyMat);
        this.body.position.y = 0.8;
        this.group.add(this.body);

        this.robeMat = new THREE.MeshStandardMaterial({ color: 0x800080, emissive: 0x300030, emissiveIntensity: 0.25, roughness: 0.7 });
        this.robe = new THREE.Mesh(new THREE.ConeGeometry(0.7, 1.55, 8), this.robeMat);
        this.robe.position.y = 0.9;
        this.group.add(this.robe);

        this.capMat = new THREE.MeshStandardMaterial({ color: 0x00ff00, emissive: 0x00ff00, emissiveIntensity: 0.35 });
        this.cap = new THREE.Mesh(new THREE.SphereGeometry(0.65, 14, 10), this.capMat);
        this.cap.position.set(0, 1.68, 0);
        this.group.add(this.cap);

        this.weaponRoot = new THREE.Group();
        this.weaponRoot.position.set(0.45, 1.15, 0.1);
        this.group.add(this.weaponRoot);

        this.hpCanvas = document.createElement('canvas');
        this.hpCanvas.width = 256;
        this.hpCanvas.height = 88;
        this.hpCtx = this.hpCanvas.getContext('2d');
        this.hpTexture = new THREE.CanvasTexture(this.hpCanvas);
        this.hpTexture.minFilter = THREE.LinearFilter;
        this.hpTexture.magFilter = THREE.LinearFilter;
        this.hpSprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: this.hpTexture, transparent: true, depthTest: false, depthWrite: false }));
        this.hpSprite.scale.set(2.2, 0.78, 1);
        this.hpSprite.position.set(0, 3.25, 0);
        this.hpSprite.renderOrder = 999;
        this.group.add(this.hpSprite);

        this.scene.add(this.group);
        this.updateLoadoutVisual();
        this.redrawHpBar();
    }

    setClan(clanId = 'myco') {
        this.currentClan = clanId;
        const visual = getClanVisual(clanId);
        this.robeMat.color.setHex(visual.robe);
        this.robeMat.emissive.setHex(visual.magic);
        this.capMat.color.setHex(visual.magic);
        this.capMat.emissive.setHex(visual.magic);
    }

    updateLoadoutVisual() {
        while (this.weaponRoot.children.length) this.weaponRoot.remove(this.weaponRoot.children[0]);
        const visual = getClanVisual(this.currentClan);
        if (this.activeSlot === 2 && this.currentWeaponId && this.currentWeaponId !== 'none') {
            let weapon;
            if (this.currentWeaponId === 'ember_axe') {
                weapon = new THREE.Mesh(new THREE.BoxGeometry(0.72, 0.42, 0.12), new THREE.MeshStandardMaterial({ color: 0x552200, emissive: 0xff5500, emissiveIntensity: 0.8 }));
                weapon.position.set(0.18, 0.45, 0);
            } else if (this.currentWeaponId === 'crystal_spire') {
                weapon = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.16, 1.05, 6), new THREE.MeshStandardMaterial({ color: 0x88ffff, emissive: 0x00ffff, emissiveIntensity: 0.9, transparent: true, opacity: 0.88 }));
                weapon.rotation.z = -0.45;
                weapon.position.set(0.12, 0.32, 0);
            } else {
                weapon = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.88, 0.06), new THREE.MeshStandardMaterial({ color: 0xa8d9a8, emissive: 0x39ff14, emissiveIntensity: 0.35 }));
                weapon.rotation.z = -0.55;
                weapon.position.set(0.05, 0.28, 0);
            }
            this.weaponRoot.add(weapon);
        } else {
            const orb = new THREE.Mesh(new THREE.SphereGeometry(0.18, 12, 10), new THREE.MeshStandardMaterial({ color: visual.magic, emissive: visual.magic, emissiveIntensity: 1.2 }));
            orb.position.set(0.1, 0.4, 0);
            this.weaponRoot.add(orb);
        }
    }

    redrawHpBar() {
        if (!this.hpCtx) return;
        const ctx = this.hpCtx;
        const W = this.hpCanvas.width;
        const H = this.hpCanvas.height;
        const shieldSeconds = Math.max(0, Math.ceil((Number(this.invulnerableUntil || 0) - Date.now()) / 1000));
        ctx.clearRect(0, 0, W, H);
        ctx.fillStyle = 'rgba(0, 0, 0, 0.58)';
        ctx.fillRect(8, 8, W - 16, H - 16);
        ctx.strokeStyle = shieldSeconds > 0 ? 'rgba(102,255,238,0.88)' : 'rgba(255,255,255,0.18)';
        ctx.strokeRect(8.5, 8.5, W - 17, H - 17);
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 18px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText((this.name || 'WANDERER').slice(0, 22), W / 2, 30);

        if (shieldSeconds > 0) {
            ctx.font = 'bold 11px sans-serif';
            ctx.fillStyle = '#66ffee';
            ctx.fillText(`SPAWN SHIELD ${shieldSeconds}S`, W / 2, 42);
        }

        const pct = Math.max(0, Math.min(1, this.hp / Math.max(1, this.maxHp)));
        ctx.fillStyle = 'rgba(16,16,16,0.9)';
        ctx.fillRect(26, shieldSeconds > 0 ? 50 : 44, W - 52, 16);
        ctx.fillStyle = pct > 0.5 ? '#39ff14' : pct > 0.25 ? '#ffcc33' : '#ff5555';
        ctx.fillRect(28, shieldSeconds > 0 ? 52 : 46, Math.max(0, (W - 56) * pct), 12);
        ctx.font = 'bold 12px sans-serif';
        ctx.fillStyle = '#ffffff';
        ctx.fillText(`${Math.ceil(this.hp)} / ${this.maxHp} HP`, W / 2, shieldSeconds > 0 ? 63 : 57);
        this.hpTexture.needsUpdate = true;
        this._lastShieldSecond = shieldSeconds;
    }

    applyPresence(presence = {}) {
        this.walletAddress = presence.walletAddress || this.walletAddress;
        this.name = presence.playerName || this.name;
        this.hp = Number.isFinite(Number(presence.effectiveHp)) ? Number(presence.effectiveHp) : (Number.isFinite(Number(presence.hp)) ? Number(presence.hp) : this.hp);
        this.maxHp = Math.max(1, Number.isFinite(Number(presence.maxHp)) ? Number(presence.maxHp) : this.maxHp);
        this.activeSlot = Number(presence.activeSlot || 1);
        this.currentWeaponId = presence.currentWeaponId || 'none';
        this.invulnerableUntil = Math.max(0, Number(presence.invulnerableUntil || 0));
        this.targetPosition.set(Number(presence.position?.x || 0), 0, Number(presence.position?.z || 0));
        this.targetRotationY = Number.isFinite(Number(presence.rotationY)) ? Number(presence.rotationY) : this.targetRotationY;
        if (presence.clanId && presence.clanId !== this.currentClan) this.setClan(presence.clanId);
        this.updateLoadoutVisual();
        this.redrawHpBar();
    }

    flashHit() {
        this.hitFlashUntil = performance.now() + 180;
    }

    update() {
        this._floatT += 0.05;
        this.group.position.lerp(this.targetPosition, 0.18);
        this.group.position.y = Math.sin(this._floatT) * 0.05;
        let yawDelta = this.targetRotationY - this.group.rotation.y;
        yawDelta = Math.atan2(Math.sin(yawDelta), Math.cos(yawDelta));
        this.group.rotation.y += yawDelta * 0.18;
        this.weaponRoot.rotation.y += 0.03;
        const shieldSeconds = Math.max(0, Math.ceil((Number(this.invulnerableUntil || 0) - Date.now()) / 1000));
        if (shieldSeconds !== this._lastShieldSecond) this.redrawHpBar();
        const hitFlash = performance.now() < this.hitFlashUntil;
        this.body.material.emissive?.setHex?.(hitFlash ? 0x661111 : (shieldSeconds > 0 ? 0x114444 : 0x000000));
        this.robeMat.emissiveIntensity = shieldSeconds > 0 ? 0.45 + Math.sin(this._floatT * 2) * 0.1 : 0.25;
        this.hpSprite.material.opacity = hitFlash ? 1 : (shieldSeconds > 0 ? 0.99 : 0.96);
    }

    destroy() {
        this.scene.remove(this.group);
    }
}

export class Chest3D {
    constructor(scene, position) {
        this.scene = scene;
        this.mesh = new THREE.Group();
        
        // Chest Base
        const baseGeo = new THREE.BoxGeometry(1.2, 0.6, 0.8);
        const baseMat = new THREE.MeshStandardMaterial({ color: 0x4d2600, roughness: 0.8 });
        const base = new THREE.Mesh(baseGeo, baseMat);
        base.position.y = 0.3;
        this.mesh.add(base);

        // Chest Lid
        const lidGeo = new THREE.BoxGeometry(1.2, 0.3, 0.8);
        const lidMat = new THREE.MeshStandardMaterial({ color: 0x331a00, roughness: 0.8 });
        this.lid = new THREE.Mesh(lidGeo, lidMat);
        this.lid.position.y = 0.75;
        this.mesh.add(this.lid);

        // Lock
        const lockGeo = new THREE.BoxGeometry(0.2, 0.2, 0.1);
        const lockMat = new THREE.MeshStandardMaterial({ color: 0xffff00, emissive: 0xffff00, emissiveIntensity: 2 });
        const lock = new THREE.Mesh(lockGeo, lockMat);
        lock.position.set(0, 0.6, 0.41);
        this.mesh.add(lock);

        this.mesh.position.copy(position);
        this.scene.add(this.mesh);
        
        this.opened = false;
    }

    open() {
        if (this.opened) return null;
        this.opened = true;
        
        // Animate lid
        this.lid.position.y += 0.2;
        this.lid.rotation.x = -Math.PI / 4;
        
        // Generate loot
        const rand = Math.random();
        let loot = { type: 'BLUE', amount: 20 };
        
        if (rand > 0.9) loot = { type: 'GOLD', amount: 2 };
        else if (rand > 0.7) loot = { type: 'INGREDIENT', amount: 5 };
        else if (rand > 0.5) loot = { type: 'HEALTH', amount: 2 };
        else if (rand > 0.3) loot = { type: 'XP', amount: 1000 };
        
        return loot;
    }

    destroy() {
        this.scene.remove(this.mesh);
    }
}

export class EnemyProjectile3D {
    constructor(scene, position, direction) {
        this.scene = scene;
        this.mesh = new THREE.Group();
        this.trailParticles = [];
        this.trailTimer = 0;
        this.isMobileFx = !!(window.game && (window.game.mobilePerf || window.game.isMobile));
        this.useTrail = !this.isMobileFx;
        this._tmpLookAt = new THREE.Vector3();
        
        const color = 0xaa00ff; // Rot Purple
        const coreGeo = new THREE.SphereGeometry(0.15, 6, 6);
        const coreMat = new THREE.MeshStandardMaterial({ 
            color: color, 
            emissive: color, 
            emissiveIntensity: 2 
        });
        const core = new THREE.Mesh(coreGeo, coreMat);
        this.mesh.add(core);

        this.mesh.position.copy(position);
        this.direction = direction.clone().normalize();
        this.speed = 0.3;
        this.life = 150;
        
        // Spatial audio per projectile is a desktop hitch source during bullet storms.
        const activeBuzzers = window.game?._activeProjectileBuzzers || 0;
        this.useProjectileAudio = !this.isMobileFx && activeBuzzers < 4;
        if (this.useProjectileAudio) {
            window.game._activeProjectileBuzzers = activeBuzzers + 1;
            this.panner = createToneNode(() => new TONE.Panner3D({
                positionX: position.x,
                positionY: position.y,
                positionZ: position.z,
                rolloffFactor: 2
            }).toDestination());
            
            this.buzz = createToneNode(() => new TONE.Oscillator(200, "sawtooth").connect(this.panner).start());
            this.buzz.volume.value = -30;
        }
        
        this.scene.add(this.mesh);
    }

    update() {
        this.mesh.position.addScaledVector(this.direction, this.speed);

        if (this.useTrail) {
            this.trailTimer++;
            if (this.trailTimer % 4 === 0 && this.trailParticles.length < 8) {
                this.spawnTrailParticle();
            }
        }

        this.trailParticles = this.trailParticles.filter(p => {
            p.position.add(p.userData.velocity);
            p.scale.multiplyScalar(0.96);
            p.material.opacity -= p.userData.fade;
            if (p.material.opacity <= 0.03) {
                this.scene.remove(p);
                if (p.material) p.material.dispose();
                return false;
            }
            return true;
        });
        
        // Update audio position
        if (this.panner) {
            this.panner.positionX.value = this.mesh.position.x;
            this.panner.positionY.value = this.mesh.position.y;
            this.panner.positionZ.value = this.mesh.position.z;
        }

        this.life--;
        if (this.life <= 0) {
            this.destroy();
            return false;
        }
        return true;
    }

    spawnTrailParticle() {
        if (!this.useTrail) return;
        const trailColor = this.projectileColor || this.mesh.children?.[0]?.material?.color?.getHex?.() || 0xaa00ff;
        const mat = new THREE.MeshBasicMaterial({
            color: trailColor,
            transparent: true,
            opacity: 0.36,
            depthWrite: false
        });
        const trail = new THREE.Mesh(ENEMY_TRAIL_GEOMETRY, mat);
        trail.position.copy(this.mesh.position);
        trail.quaternion.copy(this.mesh.quaternion);
        trail.lookAt(this._tmpLookAt.copy(this.mesh.position).add(this.direction));
        trail.userData.velocity = this.direction.clone().multiplyScalar(-this.speed * 0.22);
        trail.userData.fade = 0.06;
        this.scene.add(trail);
        this.trailParticles.push(trail);
    }

    destroy() {
        this.trailParticles.forEach(p => {
            this.scene.remove(p);
            if (p.material) p.material.dispose();
        });
        if (this.buzz) this.buzz.stop();
        if (this.panner) this.panner.dispose();
        if (this.useProjectileAudio && window.game && window.game._activeProjectileBuzzers) {
            window.game._activeProjectileBuzzers = Math.max(0, window.game._activeProjectileBuzzers - 1);
            this.useProjectileAudio = false;
        }
        this.scene.remove(this.mesh);
    }
}

export class Fireball3D {
    constructor(scene, position, direction, isCritical = false, hasTrail = false) {
        this.scene = scene;
        this.isCritical = isCritical;
        this.hasTrail = hasTrail;
        this.mesh = new THREE.Group();
        this.trailParticles = [];
        
        // Core of the flame - Green by default
        const color = isCritical ? 0xffffff : 0x00ff00;
        const coreGeo = new THREE.SphereGeometry(isCritical ? 0.35 : 0.2, 8, 8);
        const coreMat = new THREE.MeshStandardMaterial({ 
            color: color, 
            emissive: color, 
            emissiveIntensity: isCritical ? 5 : 2 
        });
        const core = new THREE.Mesh(coreGeo, coreMat);
        this.mesh.add(core);

        // Outer glow
        const glowGeo = new THREE.SphereGeometry(isCritical ? 0.6 : 0.4, 8, 8);
        const glowMat = new THREE.MeshStandardMaterial({ 
            color: color, 
            transparent: true, 
            opacity: 0.4 
        });
        const glow = new THREE.Mesh(glowGeo, glowMat);
        this.mesh.add(glow);

        this.mesh.position.copy(position);
        this.direction = direction.clone().normalize();
        this.speed = CONFIG.PLAYER.BASE_PROJECTILE_SPEED;
        this.life = 100; // Frames of life
        
        this.scene.add(this.mesh);

        this.trailTimer = 0;
        this.coreActive = true;
        this._tmpLookAt = new THREE.Vector3();
    }

    update() {
        if (this.coreActive) {
            this.mesh.position.addScaledVector(this.direction, this.speed);
            
            // Pulsing scale for flame effect
            let pulseScale = 1 + Math.sin(Date.now() * 0.01) * 0.2;
            if (this.isCrownflare) pulseScale *= 1.2;
            this.mesh.scale.set(pulseScale, pulseScale, pulseScale);

            const allowTrailFx = !(window.game && (window.game.mobilePerf || window.game.isMobile));
            if (allowTrailFx && (this.hasTrail || this.isRootbind || this.isCrownflare)) {
                this.trailTimer++;
                const trailFreq = this.isCrownflare ? 2 : (this.isRootbind ? 3 : 4);
                const trailCap = this.isCrownflare ? 14 : 8;
                if (this.trailTimer % trailFreq === 0 && this.trailParticles.length < trailCap) {
                    this.spawnTrailParticle();
                }
            }
            
            this.life--;
            if (this.life <= 0) {
                this.deactivateCore();
            }
        }

        // Update trail particles
        this.trailParticles = this.trailParticles.filter(p => {
            p.position.add(p.userData.velocity);
            p.userData.velocity.multiplyScalar(0.92);
            p.material.opacity -= p.userData.fade;
            p.scale.multiplyScalar(p.userData.scaleDecay);
            if (p.material.opacity <= 0) {
                this.scene.remove(p);
                if (p.material) p.material.dispose();
                if (p.userData.hitEnemies && typeof p.userData.hitEnemies.clear === 'function') p.userData.hitEnemies.clear();
                return false;
            }
            return true;
        });

        if (!this.coreActive && this.trailParticles.length === 0) {
            this.destroy();
            return false;
        }
        return true;
    }

    spawnTrailParticle() {
        const trailColor = this.trailColor || this.mesh.children?.[0]?.material?.color?.getHex?.() || 0x00ff00;
        const geoKey = this.isCrownflare ? 'crownflare' : (this.isRootbind ? 'rootbind' : 'default');
        const pMat = new THREE.MeshBasicMaterial({ color: trailColor, transparent: true, opacity: this.isCrownflare ? 0.68 : 0.54, depthWrite: false });
        const p = new THREE.Mesh(FIREBALL_TRAIL_GEOMETRIES[geoKey], pMat);
        p.position.copy(this.mesh.position);
        p.lookAt(this._tmpLookAt.copy(this.mesh.position).add(this.direction));
        p.userData = {
            isTrail: true,
            damage: (this.damage || 1) * 0.4, // Trail does 40% damage
            hitEnemies: new Set(), // Track which enemies this particle has already hit
            velocity: this.direction.clone().multiplyScalar(-this.speed * (this.isCrownflare ? 0.32 : 0.22)),
            fade: this.isCrownflare ? 0.03 : 0.04,
            scaleDecay: this.isCrownflare ? 0.975 : 0.96
        };
        this.scene.add(p);
        this.trailParticles.push(p);
    }

    deactivateCore() {
        this.mesh.visible = false;
        this.coreActive = false;
    }

    destroy() {
        this.trailParticles.forEach(p => {
            this.scene.remove(p);
            if (p.material) p.material.dispose();
            if (p.userData.hitEnemies && typeof p.userData.hitEnemies.clear === 'function') p.userData.hitEnemies.clear();
        });
        this.scene.remove(this.mesh);
    }
}

export class MossfangSentinel3D extends Boss3D {
    constructor(scene, position, regionConfig) {
        super(scene, position, regionConfig);
        this.name = 'Mossfang Sentinel';
        this.maxHp = 70 + (regionConfig?.hpBonus || 0);
        this.hp = this.maxHp;
        this.speed = 0.028;
        this.baseSpeed = this.speed;
        this.detectionRange = 30;
        this.shootRange = 16;
        this.shootCooldown = 1200;
        this.bossAccent = (regionConfig && (regionConfig.bossTint || regionConfig.accent)) || 0x39FF14;
        if (this.presentationRing && this.presentationRing.material) this.presentationRing.material.color.setHex(this.bossAccent);
        if (this.presentationCrown && this.presentationCrown.material) {
            this.presentationCrown.material.color.setHex(this.bossAccent);
            this.presentationCrown.material.emissive.setHex(this.bossAccent);
        }
        this.leashOrigin = position.clone();
        this.leashRadius = 12;
        this._patrolAngle = Math.random() * Math.PI * 2;
        this._circleDir = Math.random() > 0.5 ? 1 : -1;
        this._rootBurstTimer = 0;
    }

    shoot(playerPos) {
        const origin = this.mesh.position.clone().add(new THREE.Vector3(0, 2.2, 0));
        const baseDir = new THREE.Vector3().subVectors(playerPos, this.mesh.position).normalize();
        baseDir.y = 0;
        const spread = this.phase >= 2 ? 0.26 : 0.18;
        const count = this.phase >= 2 ? 5 : 3;
        for (let i = 0; i < count; i++) {
            const t = count === 1 ? 0 : (i / (count - 1) - 0.5);
            const dir = baseDir.clone().applyAxisAngle(new THREE.Vector3(0, 1, 0), t * spread * (count - 1));
            const proj = new EnemyProjectile3D(this.scene, origin, dir);
            proj.speed = this.phase >= 2 ? 0.34 : 0.28;
            proj.mesh.scale.set(1.35, 1.35, 1.35);
            proj.mesh.traverse(child => {
                if (child.material && child.material.color) {
                    child.material.color.setHex(0x5cff6b);
                    if (child.material.emissive) child.material.emissive.setHex(0xaa00ff);
                }
            });
            if (window.game) window.game.enemyProjectiles.push(proj);
        }
    }

    onPhaseTransition() {
        super.onPhaseTransition();
        this._circleDir *= -1;
        this.speed *= 1.08;
        this.baseSpeed = this.speed;
        if (window.game) {
            window.game.showFloatingText('PHASE 2: ROOT RAGE!', 0x39FF14, true);
        }
    }

    update(playerPos) {
        const dist = this.mesh.position.distanceTo(playerPos);

        if (this.leftArm) this.leftArm.rotation.y = 0.25 + Math.sin(Date.now() * 0.004) * 0.22;
        if (this.rightArm) this.rightArm.rotation.y = -0.25 - Math.sin(Date.now() * 0.004) * 0.22;
        if (this.canopy) this.canopy.scale.y = 0.82 + Math.sin(Date.now() * 0.0035) * 0.05;
        if (this.mouth) this.mouth.scale.x = 1 + Math.sin(Date.now() * 0.009) * 0.18;
        if (this.rotHalo) {
            this.rotHalo.rotation.z += 0.01;
            const haloScale = 1 + Math.sin(Date.now() * 0.005) * 0.05;
            this.rotHalo.scale.set(haloScale, haloScale, haloScale);
        }

        super.update(playerPos);

        if (dist > this.detectionRange) {
            this._patrolAngle += 0.01;
            const patrolTarget = this.leashOrigin.clone().add(new THREE.Vector3(
                Math.cos(this._patrolAngle) * (this.leashRadius * 0.7),
                0,
                Math.sin(this._patrolAngle) * (this.leashRadius * 0.7)
            ));
            const dir = patrolTarget.sub(this.mesh.position);
            dir.y = 0;
            if (dir.lengthSq() > 0.05) {
                dir.normalize();
                this.mesh.position.add(dir.multiplyScalar(this.baseSpeed * 0.7));
                this.mesh.lookAt(patrolTarget.x, this.mesh.position.y + 1.4, patrolTarget.z);
            }
            return;
        }

        if (!this.phaseTransitioning) {
            const chaseDir = new THREE.Vector3().subVectors(playerPos, this.mesh.position);
            chaseDir.y = 0;
            if (chaseDir.lengthSq() > 0.001) {
                chaseDir.normalize();
                const tangent = new THREE.Vector3(-chaseDir.z, 0, chaseDir.x).multiplyScalar((this.phase >= 2 ? 0.022 : 0.015) * this._circleDir);
                this.mesh.position.add(tangent);
            }

            this._rootBurstTimer++;
            if (!this.shielded && this._rootBurstTimer > (this.phase >= 2 ? 180 : 250)) {
                this._rootBurstTimer = 0;
                const target = playerPos.clone();
                target.x += (Math.random() - 0.5) * 3;
                target.z += (Math.random() - 0.5) * 3;
                this.spawnAoESpore(target, this.phase >= 2 ? 5.8 : 5.1, 950, this.phase >= 2 ? 1.15 : 0.9, 0x39FF14);
            }
        }

        const offset = new THREE.Vector3().subVectors(this.mesh.position, this.leashOrigin);
        offset.y = 0;
        const len = offset.length();
        if (len > this.leashRadius) {
            offset.normalize().multiplyScalar(this.leashRadius);
            this.mesh.position.x = this.leashOrigin.x + offset.x;
            this.mesh.position.z = this.leashOrigin.z + offset.z;
        }
    }
}

export class ShardcapWarden3D extends Boss3D {
    constructor(scene, position, regionConfig) {
        super(scene, position, regionConfig);
        this.name = "Shardcap Warden";
        this.shootCooldown = 1500; // Faster shooting to test shield
    }

    crystalStorm(playerPos) {
        // More intense storm to test shield
        const count = this.phase === 2 ? 24 : 16;
        for (let i = 0; i < count; i++) {
            const angle = (i / count) * Math.PI * 2 + (Date.now() * 0.001);
            const dir = new THREE.Vector3(Math.cos(angle), 0, Math.sin(angle));
            const spawnPos = this.mesh.position.clone().add(new THREE.Vector3(0, 1.5, 0));
            const proj = new EnemyProjectile3D(this.scene, spawnPos, dir);
            proj.speed = this.phase === 2 ? 0.4 : 0.25;
            proj.mesh.scale.set(1.5, 1.5, 1.5);
            if (window.game) window.game.enemyProjectiles.push(proj);
        }
    }

    shoot(playerPos) {
        // Targeted rapid fire
        const now = Date.now();
        const targetedCooldown = this.phase === 2 ? 300 : 500;
        if (now - this.lastTargetedShoot < targetedCooldown) return;
        this.lastTargetedShoot = now;

        const dir = new THREE.Vector3().subVectors(playerPos, this.mesh.position).normalize();
        dir.y = 0;
        const spawnPos = this.mesh.position.clone().add(new THREE.Vector3(0, 1.5, 0));
        
        // Shoot a cluster
        const count = this.phase === 2 ? 5 : 3;
        for(let i = Math.floor(-count/2); i <= Math.floor(count/2); i++) {
            const clusterDir = dir.clone().applyAxisAngle(new THREE.Vector3(0, 1, 0), i * 0.2);
            const proj = new EnemyProjectile3D(this.scene, spawnPos, clusterDir);
            proj.speed = this.phase === 2 ? 0.5 : 0.35;
            if (window.game) window.game.enemyProjectiles.push(proj);
        }
    }

    onPhaseTransition() {
        super.onPhaseTransition();
        if (window.game) {
            window.game.showFloatingText("PHASE 2: KINETIC OVERLOAD!", 0x00ffff, true);
            window.game.glitchIntensity = 1.0;
        }
        // Increase shard rotation speed
        this.shardRotationSpeed = 0.1;
    }

    update(playerPos) {
        if (!this.lastTargetedShoot) this.lastTargetedShoot = 0;
        if (!this.shardRotationSpeed) this.shardRotationSpeed = 0.05;
        super.update(playerPos);
        this.updateShield();

        // V1.9.15 - Register orbiting shards as hit targets exactly once. Player melee
        // can carve them out; while ≥4 are alive the Warden is shielded. The orbiting
        // shard groups have local positions, so each target uses a scene-space proxy
        // Object3D updated every frame for the melee distance check.
        if (!this._shardHitTargets && this.shards && this.shards.length) {
            this._shardHitTargets = this.shards.map(group => {
                const proxy = new THREE.Object3D();
                this.scene.add(proxy);
                const target = {
                    mesh: proxy,
                    sourceGroup: group,
                    hp: 4,
                    dead: false
                };
                target.takeDamage = (amt) => {
                    if (target.dead) return;
                    target.hp -= amt;
                    group.traverse(c => {
                        if (c.material && c.material.emissive) {
                            c.material.emissiveIntensity = 5;
                            setTimeout(() => { if (c.material) c.material.emissiveIntensity = 1; }, 80);
                        }
                    });
                    if (target.hp <= 0) {
                        target.dead = true;
                        const wp = new THREE.Vector3();
                        group.getWorldPosition(wp);
                        try { window.game.spawnExplosionParticles(wp, 0x00ffff); } catch (_) {}
                        group.visible = false;
                        try { this.scene.remove(proxy); } catch (_) {}
                        if (window.game) window.game.showFloatingText('SHARD BROKEN!', 0x00ffff);
                    }
                };
                return target;
            });
            window.game.bossHitTargets = (window.game.bossHitTargets || []).concat(this._shardHitTargets);
        }
        // Sync proxy positions to the orbiting shards' world positions.
        if (this._shardHitTargets) {
            this._shardHitTargets.forEach(t => {
                if (!t.dead && t.sourceGroup && t.mesh) {
                    t.sourceGroup.getWorldPosition(t.mesh.position);
                }
            });
        }

        // Shield state: up while ≥ 4 shards alive (or always in phase 2 until 3 die).
        const aliveShards = (this._shardHitTargets || []).filter(t => !t.dead).length;
        const shieldThreshold = this.phase === 2 ? 5 : 4;
        if (aliveShards >= shieldThreshold && !this.shielded) {
            // Persistent shield gated on shard count, not time.
            this.shieldClearPredicate = () => (this._shardHitTargets || []).filter(t => !t.dead).length < shieldThreshold;
            this.raiseShield(99999, 0x00ffff, 'shard-array');
        } else if (aliveShards < shieldThreshold && this.shielded) {
            this.dropShield();
        }

        // Phase 2 Glitchy Visuals
        if (this.phase === 2) {
            if (Math.random() < 0.1) {
                const glitchScale = 1 + (Math.random() - 0.5) * 0.2;
                this.mesh.scale.set(3 * glitchScale, 3 * glitchScale, 3 * glitchScale);
                
                // Randomly shift core emissive intensity
                if (this.core) {
                    this.core.material.emissiveIntensity = 2 + Math.random() * 5;
                }
            } else {
                this.mesh.scale.set(3, 3, 3);
            }
        }

        // Constantly fire targeted shots if in range
        const dist = this.mesh.position.distanceTo(playerPos);
        if (dist < 25) {
            this.shoot(playerPos);
        }
    }
}

export class DarkMycelius3D extends Boss3D {
    constructor(scene, position, regionConfig) {
        super(scene, position, regionConfig);
        this.name = "Dark Mycelius";
        this.maxHp = 250;
        this.hp = this.maxHp;
        this.glitchTimer = 0;
        this.clones = [];
        this.isDarkMycelius = true;
        
        // Final Boss Look: A Darker, Glitchy Version of the Player
        this.mesh.traverse(child => {
            if (child.material) {
                child.material = child.material.clone();
                child.material.color.setHex(0x111111);
                if (child.material.emissive) {
                    child.material.emissive.setHex(0xff0055);
                    child.material.emissiveIntensity = 2;
                }
            }
        });
    }

    onPhaseTransition() {
        super.onPhaseTransition();
        if (window.game) {
            window.game.glitchIntensity = 1.0;
        }
        if (this.phase === 2) {
            if (window.game) window.game.showFloatingText("PHASE 2: GLITCH CLONES!", 0xff0055, true);
            this.spawnClones();
        } else if (this.phase === 3) {
            if (window.game) window.game.showFloatingText("FINAL PHASE: THE VOID CONSUMES!", 0xaa00ff, true);
            this.speed *= 2;
        }
    }

    checkPhaseTransition() {
        if (this.phase === 1 && this.hp < this.maxHp * 0.7) {
            this.phase = 2;
            this.phaseTransitioning = true;
            this.onPhaseTransition();
        } else if (this.phase === 2 && this.hp < this.maxHp * 0.3) {
            this.phase = 3;
            this.phaseTransitioning = true;
            this.onPhaseTransition();
        }
    }

    spawnClones() {
        for (let i = 0; i < 3; i++) {
            const angle = (i / 3) * Math.PI * 2;
            const pos = this.mesh.position.clone().add(new THREE.Vector3(Math.cos(angle) * 10, 0, Math.sin(angle) * 10));
            const clone = new Enemy3D(this.scene, pos, this.regionConfig);
            clone.hp = 10;
            clone.speed = 0.1;
            clone.mesh.scale.set(1.5, 1.5, 1.5);
            if (window.game) window.game.enemies.push(clone);
            this.clones.push(clone);
        }
    }

    update(playerPos) {
        super.update(playerPos);
        this.updateShield();
        if (this.phaseTransitioning) return;

        this.glitchTimer++;
        if (this.glitchTimer % 120 === 0) {
            this.glitchAttack(playerPos);
        }

        // V1.9.15 - Void Pillar AoE bursts. Phase 2+: cluster of 3 telegraphed rings
        // around the player every ~5s. Phase 3: cluster of 5 rings every ~3.5s.
        if (this.phase >= 2 && !this.shielded) {
            this._voidPillarTimer = (this._voidPillarTimer || 0) + 1;
            const cd = this.phase === 3 ? 210 : 300;
            const rings = this.phase === 3 ? 5 : 3;
            if (this._voidPillarTimer > cd) {
                this._voidPillarTimer = 0;
                for (let i = 0; i < rings; i++) {
                    const a = (i / rings) * Math.PI * 2 + Math.random() * 0.5;
                    const offset = 3 + Math.random() * 5;
                    const target = new THREE.Vector3(
                        playerPos.x + Math.cos(a) * offset,
                        0,
                        playerPos.z + Math.sin(a) * offset
                    );
                    // V1.9.16 - Void pillar telegraph 1000 → 1150ms, stagger 120 → 150ms.
                setTimeout(() => this.spawnAoESpore(target, 4, 1150, 1.2, 0xaa00ff), i * 150);
                }
            }
        }

        if (this.phase === 3) {
            // Siphon life
            const dist = this.mesh.position.distanceTo(playerPos);
            if (dist < 15) {
                if (Math.random() < 0.05) {
                    if (window.game) {
                        window.game.player.takeDamage(0.05);
                        this.hp = Math.min(this.maxHp, this.hp + 0.1);
                        window.game.updateHud();
                    }
                }
            }
        }
    }

    onPhaseTransition() {
        super.onPhaseTransition();
        // V1.9.15 - At phase 3 the Void wraps Mycelius. 5s self-shield while a wide
        // ring of void pillars erupts — the Sage's clue is "save Crown Aegis for this".
        if (this.phase === 3) {
            this.raiseShield(5000, 0xaa00ff, 'void-crown');
            for (let i = 0; i < 8; i++) {
                const a = (i / 8) * Math.PI * 2;
                const pos = this.mesh.position.clone().add(new THREE.Vector3(Math.cos(a) * 7, 0, Math.sin(a) * 7));
                setTimeout(() => this.spawnAoESpore(pos, 4, 1200, 1.5, 0xaa00ff), i * 200);
            }
        }
    }

    glitchAttack(playerPos) {
        // Screen glitch and teleport
        if (window.game) {
            window.game.glitchIntensity = 0.8;
            const angle = Math.random() * Math.PI * 2;
            const dist = 5 + Math.random() * 10;
            this.mesh.position.set(
                playerPos.x + Math.cos(angle) * dist,
                0,
                playerPos.z + Math.sin(angle) * dist
            );
            
            // Burst of glitch projectiles
            for (let i = 0; i < 8; i++) {
                const pAngle = (i / 8) * Math.PI * 2;
                const dir = new THREE.Vector3(Math.cos(pAngle), 0, Math.sin(pAngle));
                const proj = new EnemyProjectile3D(this.scene, this.mesh.position.clone().add(new THREE.Vector3(0, 1.5, 0)), dir);
                proj.mesh.children[0].material.color.setHex(0xff0055);
                proj.mesh.children[0].material.emissive.setHex(0xff0055);
                if (window.game) window.game.enemyProjectiles.push(proj);
            }
        }
    }
}

export class NetTrap3D {
    constructor(scene, position, color) {
        this.scene = scene;
        this.mesh = new THREE.Group();
        this.radius = 8;
        
        const netGeo = new THREE.CircleGeometry(this.radius, 32);
        const netMat = new THREE.MeshBasicMaterial({ 
            color: color, 
            transparent: true, 
            opacity: 0.4, 
            wireframe: true,
            side: THREE.DoubleSide
        });
        const net = new THREE.Mesh(netGeo, netMat);
        net.rotation.x = -Math.PI / 2;
        this.mesh.add(net);

        // Add some glowing "nodes"
        for (let i = 0; i < 8; i++) {
            const nodeGeo = new THREE.SphereGeometry(0.3, 8, 8);
            const nodeMat = new THREE.MeshStandardMaterial({ color: color, emissive: color, emissiveIntensity: 2 });
            const node = new THREE.Mesh(nodeGeo, nodeMat);
            const angle = (i / 8) * Math.PI * 2;
            node.position.set(Math.cos(angle) * this.radius, 0.1, Math.sin(angle) * this.radius);
            this.mesh.add(node);
        }

        this.mesh.position.copy(position);
        this.mesh.position.y = 0.05;
        this.scene.add(this.mesh);
        
        this.life = 300; // 5 seconds at 60fps
        this.maxLife = this.life;
    }

    update(enemies) {
        this.life--;
        this.mesh.rotation.y += 0.02;
        
        // Fade out
        const opacity = Math.min(0.4, this.life / 60);
        this.mesh.children[0].material.opacity = opacity;

        // Apply slow to enemies in radius
        enemies.forEach(enemy => {
            if (enemy.mesh.position.distanceTo(this.mesh.position) < this.radius) {
                enemy.applySlow(0.3); // 70% slow
            }
        });

        if (this.life <= 0) {
            this.destroy();
            return false;
        }
        return true;
    }

    destroy() {
        this.scene.remove(this.mesh);
    }
}

export class PuzzlePillar3D {
    constructor(scene, position, index, targetValue) {
        this.scene = scene;
        this.position = position;
        this.index = index;
        this.targetValue = targetValue; // 0 or 1
        this.currentValue = 0;
        
        this.mesh = new THREE.Group();
        this.mesh.position.copy(position);
        
        const geo = new THREE.BoxGeometry(1.5, 4, 1.5);
        this.mat = new THREE.MeshStandardMaterial({ 
            color: 0x111111, 
            wireframe: true,
            emissive: 0xaa00ff,
            emissiveIntensity: 0.1
        });
        this.pillar = new THREE.Mesh(geo, this.mat);
        this.mesh.add(this.pillar);
        
        // Value indicator
        const indicatorGeo = new THREE.IcosahedronGeometry(0.5, 0);
        this.indicatorMat = new THREE.MeshStandardMaterial({ 
            color: 0x444444, 
            emissive: 0x000000, 
            emissiveIntensity: 0 
        });
        this.indicator = new THREE.Mesh(indicatorGeo, this.indicatorMat);
        this.indicator.position.y = 4.5;
        this.mesh.add(this.indicator);
        
        // Binary Label
        this.label = this.createLabel("0");
        this.label.position.y = 3;
        this.mesh.add(this.label);
        
        this.scene.add(this.mesh);
    }

    createLabel(text) {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        canvas.width = 128;
        canvas.height = 128;
        ctx.fillStyle = '#000000';
        ctx.fillRect(0,0,128,128);
        ctx.font = 'bold 80px "Press Start 2P", cursive';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillStyle = '#aa00ff';
        ctx.fillText(text, 64, 64);
        
        const tex = new THREE.CanvasTexture(canvas);
        const spriteMat = new THREE.SpriteMaterial({ map: tex });
        const sprite = new THREE.Sprite(spriteMat);
        sprite.scale.set(2, 2, 1);
        return sprite;
    }

    toggle() {
        this.currentValue = this.currentValue === 0 ? 1 : 0;
        this.indicatorMat.color.setHex(this.currentValue === 1 ? 0x00ff00 : 0x444444);
        this.indicatorMat.emissive.setHex(this.currentValue === 1 ? 0x00ff00 : 0x000000);
        this.indicatorMat.emissiveIntensity = this.currentValue === 1 ? 2 : 0;
        
        // Update Label
        this.mesh.remove(this.label);
        this.label = this.createLabel(this.currentValue.toString());
        this.label.position.y = 3;
        this.mesh.add(this.label);
        
        if (window.game) {
            window.game.uiSynth.triggerAttackRelease(this.currentValue === 1 ? "G4" : "C4", "16n");
        }
    }

    update() {
        this.indicator.rotation.y += 0.05;
        this.mesh.position.y = Math.sin(Date.now() * 0.002 + this.index) * 0.2;
    }

    destroy() {
        this.scene.remove(this.mesh);
    }
}

export class CitadelGate3D {
    constructor(scene, position) {
        this.scene = scene;
        this.position = position;
        this.mesh = new THREE.Group();
        this.mesh.position.copy(position);
        
        this.state = 'BLUE'; // BLUE, GOLD, MAGIC, UNLOCKED
        this.isUnlocked = false;
        
        // Visuals: A massive stone archway
        const pillarGeo = new THREE.BoxGeometry(2, 10, 2);
        const stoneMat = new THREE.MeshStandardMaterial({ color: 0x1b0010, roughness: 0.9 });
        
        const leftPillar = new THREE.Mesh(pillarGeo, stoneMat);
        leftPillar.position.set(-6, 5, 0);
        this.mesh.add(leftPillar);
        
        const rightPillar = new THREE.Mesh(pillarGeo, stoneMat);
        rightPillar.position.set(6, 5, 0);
        this.mesh.add(rightPillar);
        
        const topPillar = new THREE.Mesh(new THREE.BoxGeometry(14, 2, 2), stoneMat);
        topPillar.position.set(0, 11, 0);
        this.mesh.add(topPillar);
        
        // Energy screen
        const screenGeo = new THREE.PlaneGeometry(10, 10);
        this.screenMat = new THREE.MeshStandardMaterial({ 
            color: 0x00aaff, 
            transparent: true, 
            opacity: 0.4, 
            emissive: 0x00aaff, 
            emissiveIntensity: 1,
            side: THREE.DoubleSide
        });
        this.screen = new THREE.Mesh(screenGeo, this.screenMat);
        this.screen.position.set(0, 5, 0);
        this.mesh.add(this.screen);
        
        // Interaction Label
        this.label = this.createTextSprite("OFFER BLUE SPORES (50)");
        this.label.position.set(0, 13, 0);
        this.mesh.add(this.label);
        
        this.scene.add(this.mesh);
    }

    createTextSprite(text) {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        canvas.width = 512;
        canvas.height = 128;
        ctx.fillStyle = 'rgba(0,0,0,0.7)';
        ctx.fillRect(0,0,512,128);
        ctx.font = 'bold 30px "Press Start 2P", cursive';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillStyle = '#ffffff';
        ctx.fillText(text, 256, 64);
        
        const tex = new THREE.CanvasTexture(canvas);
        const spriteMat = new THREE.SpriteMaterial({ map: tex });
        const sprite = new THREE.Sprite(spriteMat);
        sprite.scale.set(10, 2.5, 1);
        return sprite;
    }

    updateLabel() {
        this.mesh.remove(this.label);
        let text = "";
        if (this.state === 'BLUE') text = "OFFER BLUE SPORES (50)";
        else if (this.state === 'GOLD') text = "OFFER GOLD SPORES (5)";
        else if (this.state === 'MAGIC') text = "CAST CROWN MAGIC";
        else if (this.state === 'UNLOCKED') text = "GATE RESTORED";
        
        this.label = this.createTextSprite(text);
        this.label.position.set(0, 13, 0);
        this.mesh.add(this.label);
    }

    advanceState() {
        if (this.state === 'BLUE') {
            this.state = 'GOLD';
            this.screenMat.color.setHex(0xffff00);
            this.screenMat.emissive.setHex(0xffff00);
        } else if (this.state === 'GOLD') {
            this.state = 'MAGIC';
            this.screenMat.color.setHex(0xff0055);
            this.screenMat.emissive.setHex(0xff0055);
        } else if (this.state === 'MAGIC') {
            this.state = 'UNLOCKED';
            this.isUnlocked = true;
            this.screen.visible = false;
        }
        this.updateLabel();
    }

    update() {
        if (!this.isUnlocked) {
            this.screenMat.emissiveIntensity = 1 + Math.sin(Date.now() * 0.005) * 0.5;
            this.screen.scale.setScalar(1 + Math.sin(Date.now() * 0.003) * 0.02);
        }
    }
}

export class Player3D {
    constructor(scene, camera, isGhost = false) {
        this.scene = scene;
        this.camera = camera;
        this.isGhost = isGhost;
        this.projectiles = [];
        
        // Audio
        this.synth = createToneNode(() => new TONE.Synth({
            oscillator: { type: "triangle" },
            envelope: { attack: 0.01, decay: 0.1, sustain: 0, release: 0.1 }
        }).toDestination());
        
        this.shootSynth = createToneNode(() => new TONE.NoiseSynth({
            noise: { type: "white" },
            envelope: { attack: 0.005, decay: 0.1, sustain: 0 }
        }).toDestination());

        this.footstepSynth = createToneNode(() => new TONE.NoiseSynth({
            envelope: { attack: 0.005, decay: 0.08, sustain: 0 },
            volume: -25
        }).toDestination());

        this.levelUpSynth = createToneNode(() => new TONE.PolySynth().toDestination());
        
        // Stats
        this.level = 1;
        this.xp = 0;
        this.upgrades = {};
        this.nextLevelXp = 1000;
        this.blueSpores = 0;
        this.goldenSpores = 0;
        this.alignment = 50; // 0 (Bad) to 100 (Good)
        this.unlockedRegions = ['region8'];
        this.currentRegionId = 'region8';
        this.inventory = [];
        this.hp = 5;
        this.maxHp = 5;
        this.magic = 100;
        this.maxMagic = 100;
        this.magicRegen = 0.2; // magic per frame
        this.weaponLevels = {
            'fungal_blade': 0,
            'crystal_spire': 0,
            'ember_axe': 0
        };
        this.forgeLevels = { weapons: 0, armor: 0 };
        
        // Clan Colors and Modifiers
        this.clanColors = {
            myco: { ...CLAN_VISUALS.myco, powerName: 'Spirit Glide', powerDesc: 'Reduced gravity effect.' },
            rougarou: { ...CLAN_VISUALS.rougarou, powerName: 'Feral Speed', powerDesc: 'Increased base movement speed.' },
            tegbot: { ...CLAN_VISUALS.tegbot, powerName: 'Overclock', powerDesc: 'Faster magic cooldown.' },
            shiba: { ...CLAN_VISUALS.shiba, powerName: 'Fortune Radius', powerDesc: 'Increased victory capture range.' },
            brood: { ...CLAN_VISUALS.brood, powerName: 'Dragon Flare', powerDesc: 'Faster, brighter projectiles.' },
            mycelius: { ...CLAN_VISUALS.mycelius, powerName: 'Rot Siphon', powerDesc: 'Drains lifeforce from enemies.' }
        };

        this.currentClan = 'myco';
        this.modifiers = {
            gravityMult: 1.0,
            speedMult: 1.0,
            cooldownMult: 1.0,
            goalRadiusMult: 1.0,
            projectileSpeedMult: 1.0,
            projectileCount: 1,
            damageBonus: 0,
            wardBonus: 0,
            regenRate: 0, // HP per second
            critChance: 0
        };
        this.territoryModifiers = null;
        this.walletModifiers = null;

        // Character Model (Roblox R6 style)
        this.group = new THREE.Group();
        
        const plasticMat = (color) => new THREE.MeshStandardMaterial({ 
            color: color, 
            roughness: 0.1, 
            metalness: 0.1,
            transparent: this.isGhost,
            opacity: this.isGhost ? 0.3 : 1.0
        });

        // Torso
        const torsoGeo = new THREE.BoxGeometry(0.8, 0.9, 0.4);
        this.torso = new THREE.Mesh(torsoGeo, plasticMat(0x800080));
        this.torso.position.y = 1.15;
        this.group.add(this.torso);

        // Head
        const headGeo = new THREE.BoxGeometry(0.4, 0.4, 0.4);
        this.head = new THREE.Mesh(headGeo, plasticMat(0x050505));
        this.head.position.y = 1.8;
        this.group.add(this.head);

        // Arms
        const armGeo = new THREE.BoxGeometry(0.35, 0.9, 0.35);
        this.leftArm = new THREE.Mesh(armGeo, plasticMat(0x800080));
        this.leftArm.position.set(-0.6, 1.15, 0);
        this.group.add(this.leftArm);

        this.rightArm = new THREE.Mesh(armGeo, plasticMat(0x800080));
        this.rightArm.position.set(0.6, 1.15, 0);
        this.group.add(this.rightArm);

        // Legs
        const legGeo = new THREE.BoxGeometry(0.38, 0.9, 0.38);
        this.leftLeg = new THREE.Mesh(legGeo, plasticMat(0x111111));
        this.leftLeg.position.set(-0.2, 0.45, 0);
        this.group.add(this.leftLeg);

        this.rightLeg = new THREE.Mesh(legGeo, plasticMat(0x111111));
        this.rightLeg.position.set(0.2, 0.45, 0);
        this.group.add(this.rightLeg);
        
        // Glowing Green Eyes
        const eyeGeo = new THREE.BoxGeometry(0.12, 0.08, 0.05);
        this.eyeMat = new THREE.MeshStandardMaterial({ 
            color: 0x00ff00, 
            emissive: 0x00ff00, 
            emissiveIntensity: 5 
        });
        
        this.leftEye = new THREE.Mesh(eyeGeo, this.eyeMat);
        this.leftEye.position.set(-0.1, 1.85, 0.18);
        this.group.add(this.leftEye);

        this.rightEye = new THREE.Mesh(eyeGeo, this.eyeMat);
        this.rightEye.position.set(0.1, 1.85, 0.18);
        this.group.add(this.rightEye);
        
        // Mushroom Cap (King Myco Signature)
        // V1.9.40 - Smaller, rounder cap silhouette so King Myco reads more polished
        // and less cone-hat/cartoon-spiky from every camera angle.
        const capGroup = new THREE.Group();
        const capGeo = new THREE.SphereGeometry(0.92, 18, 14, 0, Math.PI * 2, 0, Math.PI / 2);
        const capMat = new THREE.MeshStandardMaterial({ 
            color: 0xff3355,
            roughness: 0.58,
            metalness: 0.04,
            transparent: this.isGhost,
            opacity: this.isGhost ? 0.3 : 1.0
        });
        this.cap = new THREE.Mesh(capGeo, capMat);
        this.cap.scale.set(1.0, 0.72, 1.0);
        this.cap.position.y = 0.03;
        capGroup.add(this.cap);

        // White spots on cap, now round instead of boxy so the silhouette stays organic.
        const spotGeo = new THREE.SphereGeometry(0.1, 10, 10);
        const spotMat = new THREE.MeshStandardMaterial({ color: 0xfff8ef, roughness: 0.7 });
        const capSpots = [
            { x: 0.00, y: 0.29, z: 0.18, s: 1.0 },
            { x: 0.28, y: 0.17, z: 0.22, s: 0.92 },
            { x: -0.30, y: 0.14, z: 0.12, s: 0.88 },
            { x: 0.22, y: 0.08, z: -0.26, s: 0.82 },
            { x: -0.20, y: 0.10, z: -0.30, s: 0.78 }
        ];
        capSpots.forEach(({ x, y, z, s }) => {
            const spot = new THREE.Mesh(spotGeo, spotMat);
            spot.position.set(x, y, z);
            spot.scale.setScalar(s);
            capGroup.add(spot);
        });
        capGroup.position.y = 2.14;
        this.group.add(capGroup);

        // Gnarled Wooden Staff
        const staffGroup = new THREE.Group();
        const staffGeo = new THREE.CylinderGeometry(0.06, 0.06, 2.5, 6);
        const staffMat = new THREE.MeshStandardMaterial({ color: 0x4d2600 });
        this.staff = new THREE.Mesh(staffGeo, staffMat);
        staffGroup.add(this.staff);

        this.weaponUpgrades = new THREE.Group();
        staffGroup.add(this.weaponUpgrades);

        staffGroup.position.set(0.8, 1.2, 0.3);
        this.group.add(staffGroup);

        this.armorUpgrades = new THREE.Group();
        this.group.add(this.armorUpgrades);

        // Accessories Group
        this.accessoriesGroup = new THREE.Group();
        this.group.add(this.accessoriesGroup);
        this.capeMesh = null;
        this.crownMesh = null;

        // Character materials for easy reference
        this.robeMat = this.torso.material;

        // Staff Tip
        const tipGeo = new THREE.IcosahedronGeometry(0.2, 1);
        this.tipMat = new THREE.MeshStandardMaterial({ 
            color: 0x00ff00, 
            emissive: 0x00ff00, 
            emissiveIntensity: 0.2,
            transparent: this.isGhost,
            opacity: this.isGhost ? 0.3 : 1.0
        });
        this.tip = new THREE.Mesh(tipGeo, this.tipMat);
        this.tip.position.set(0.8, 2.4, 0.3);
        this.group.add(this.tip);

        this.staffLight = new THREE.PointLight(0x00ff00, this.isGhost ? 0 : 0.5, 5);
        this.staffLight.position.set(0.8, 2.4, 0.3);
        this.group.add(this.staffLight);

        // V1.9.26 - Damage flash registry. Cache each body mesh's original color
        // and emissive so we can blend them toward red on hit and ease back. We
        // skip the staff tip / staff light (handled by their own glow) and the
        // overhead HP bar sprite added below.
        if (!this.isGhost) {
            this._damageFlashMeshes = [];
            this.group.traverse(child => {
                if (!child.isMesh || !child.material) return;
                if (child === this.tip) return; // staff orb keeps its glow
                const mat = child.material;
                if (!mat.color) return;
                this._damageFlashMeshes.push({
                    mat,
                    baseColor: mat.color.clone(),
                    baseEmissive: mat.emissive ? mat.emissive.clone() : null,
                    baseEmissiveIntensity: typeof mat.emissiveIntensity === 'number' ? mat.emissiveIntensity : 1
                });
            });
            this._damageFlashT = 0;       // 1 → 0 over duration
            this._damageFlashDuration = 0.28; // seconds
            this._damageFlashColor = new THREE.Color(0xff2233);
        }

        // V1.9.25 - Overhead HP bar sprite (Roblox-style nameplate). Floats above
        // King Myco's head, billboards to the camera automatically (Sprite), and
        // repaints its CanvasTexture only when hp/maxHp actually change so it
        // never thrashes the renderer.
        if (!this.isGhost) {
            this._hpBarCanvas = document.createElement('canvas');
            this._hpBarCanvas.width = 256;
            this._hpBarCanvas.height = 64;
            this._hpBarCtx = this._hpBarCanvas.getContext('2d');
            this._hpBarTexture = new THREE.CanvasTexture(this._hpBarCanvas);
            this._hpBarTexture.minFilter = THREE.LinearFilter;
            this._hpBarTexture.magFilter = THREE.LinearFilter;
            const hpBarMat = new THREE.SpriteMaterial({
                map: this._hpBarTexture,
                transparent: true,
                depthTest: false,
                depthWrite: false
            });
            this.hpBarSprite = new THREE.Sprite(hpBarMat);
            this.hpBarSprite.scale.set(1.6, 0.4, 1);
            this.hpBarSprite.position.set(0, 2.5, 0);
            this.hpBarSprite.renderOrder = 999;
            this.group.add(this.hpBarSprite);
            this._lastHpBarHp = -1;
            this._lastHpBarMax = -1;
            this._drawHpBar();
        }

        if (this.isGhost) {
            this.group.traverse(child => {
                if (child.material) {
                    child.material.transparent = true;
                    child.material.opacity = 0.3;
                }
            });
        }
        
        this.scene.add(this.group);
        
        // Physics/Movement stats
        this.velocity = new THREE.Vector3();
        this._prevPos = new THREE.Vector3();
        this._tempFacing = new THREE.Vector3();
        this._tempTankMove = new THREE.Vector3();
        this._tempForward = new THREE.Vector3();
        this._tempRight = new THREE.Vector3();
        this._tempMoveDir = new THREE.Vector3();
        this._tempPushDir = new THREE.Vector3();
        // V1.9.14 - Snappier King Myco stride. Was 0.18; raised to keep the bigger
        // hub world from feeling slow to cross.
        this.baseSpeed = 0.28;
        this.rotationSpeed = 0.05;
        this.turnInPlaceSpeed = 0.06;
        this.slowFactor = 1.0;
        this.baseGravity = -0.015;
        this.jumpPower = 0.35;
        this.jumpCount = 0;
        this.maxJumps = 2; // Double jump!
        this.radius = 0.6;
        
        this.keys = {
            forward: false, backward: false, left: false, right: false,
            tankForward: false, tankBackward: false, turnLeft: false, turnRight: false,
            jump: false, shoot: false, special: false, interact: false,
            melee: false, trap: false
        };
        this.moveVector = new THREE.Vector2();
        this.tankTurnInput = 0;
        this.tankThrottleInput = 0;

        // V1.9.30 - Universal mobile-friendly dash. Available to every clan,
        // separate from clan-locked specialAbility(). Player code only reads
        // these fields; the button UI reads dashReadyAt + dashCooldownMs to
        // draw the sweep cooldown ring.
        this.dashReadyAt = 0;
        this.dashCooldownMs = 700;
        this.dashDuration = 0.18;       // seconds of motion
        this.dashSpeed = 1.4;           // world units per frame during burst
        this.dashIFrameMs = 220;        // brief invuln so dash can save you
        this._dashActiveUntil = 0;
        this._dashIFrameUntil = 0;
        this._dashDir = new THREE.Vector3();
        
        // Animation states
        this.animTimer = 0;
        this.isWalking = false;
        this.isAttacking = false;
        this.attackAnimTimer = 0;
        this.regenAccumulator = 0;
        
        this.hasFungalShield = false;
        this.hasMycelialNet = false;
        this.tempWardBonus = 0;
        this.skillReadyAt = {};
        this._specialHeld = false;
        this._trapHeld = false;
        this.shieldOrbitAngle = 0;
        this.shieldGroup = new THREE.Group();
        this.group.add(this.shieldGroup);
        
        this.lastShootTime = 0;
        this.lastSpecialTime = 0;
        this.lastNetTime = 0;
        this.lastMeleeTime = 0;
        this.activeSlot = 1; // 1: Magic, 2: Melee, 3-5: Items
        this.currentMagicIdx = 0;
        this.currentWeaponId = 'none';
        this.baseShootCooldown = CONFIG.PLAYER.BASE_MAGIC_COOLDOWN;
        this.magicColor = 0x39FF14;
        
        this.initInput();
    }

    syncWeaponVisual() {
        if (this.activeSlot === 1) {
            // Magic slot - show glowing tip, hide melee if any
            this.tip.visible = true;
            this.staffLight.visible = true;
            if (this.weaponVisual) this.weaponVisual.visible = false;
        } else if (this.activeSlot === 2) {
            // Melee slot - hide tip (or dim it), show melee
            this.tip.visible = false;
            this.staffLight.visible = false;
            
            // Auto-equip first melee weapon if none equipped
            const meleeInInv = (this.inventory || []).filter(id => CONFIG.WEAPONS.some(w => w.id === id));
            if (this.currentWeaponId === 'none' && meleeInInv.length > 0) {
                this.equipWeapon(meleeInInv[0]);
            }
            
            if (this.weaponVisual) this.weaponVisual.visible = true;
        }
    }

    equipWeapon(weaponId) {
        this.currentWeaponId = weaponId;
        
        // Remove old visual
        if (this.weaponVisual) {
            this.staff.remove(this.weaponVisual);
            this.weaponVisual = null;
        }

        const weaponCfg = CONFIG.WEAPONS.find(w => w.id === weaponId);
        if (!weaponCfg) return;

        // Add new visual to staff
        const visualGroup = new THREE.Group();
        visualGroup.position.y = 1.25; // Top of staff
        
        if (weaponId === 'fungal_blade') {
            const bladeGeo = new THREE.BoxGeometry(0.3, 1.4, 0.05);
            const bladeMat = new THREE.MeshStandardMaterial({ 
                color: 0x88cc88, 
                metalness: 0.8, 
                roughness: 0.2,
                emissive: 0x39FF14,
                emissiveIntensity: 0.2
            });
            const blade = new THREE.Mesh(bladeGeo, bladeMat);
            blade.position.y = 0.6;
            visualGroup.add(blade);
            
            // Add a "core" line
            const coreGeo = new THREE.BoxGeometry(0.05, 1.2, 0.06);
            const coreMat = new THREE.MeshBasicMaterial({ color: 0x39FF14 });
            const core = new THREE.Mesh(coreGeo, coreMat);
            core.position.y = 0.6;
            visualGroup.add(core);

        } else if (weaponId === 'crystal_spire') {
            const spireGeo = new THREE.CylinderGeometry(0.01, 0.25, 1.8, 6);
            const spireMat = new THREE.MeshStandardMaterial({ 
                color: 0x00ffff, 
                emissive: 0x00ffff, 
                emissiveIntensity: 2,
                transparent: true,
                opacity: 0.8
            });
            const spire = new THREE.Mesh(spireGeo, spireMat);
            spire.position.y = 0.8;
            visualGroup.add(spire);
            
            // Floating bits
            for(let i=0; i<3; i++) {
                const bitGeo = new THREE.OctahedronGeometry(0.1, 0);
                const bit = new THREE.Mesh(bitGeo, spireMat);
                bit.position.set(Math.random()-0.5, 0.5 + i*0.4, Math.random()-0.5);
                visualGroup.add(bit);
            }

        } else if (weaponId === 'ember_axe') {
            const headGeo = new THREE.BoxGeometry(1.0, 0.8, 0.2);
            const headMat = new THREE.MeshStandardMaterial({ 
                color: 0x441100, 
                emissive: 0xff4400, 
                emissiveIntensity: 1 
            });
            const head = new THREE.Mesh(headGeo, headMat);
            head.position.set(0.4, 0.6, 0);
            visualGroup.add(head);
            
            // Burning edge
            const edgeGeo = new THREE.BoxGeometry(0.1, 0.8, 0.22);
            const edgeMat = new THREE.MeshBasicMaterial({ color: 0xffaa00 });
            const edge = new THREE.Mesh(edgeGeo, edgeMat);
            edge.position.set(0.9, 0.6, 0);
            visualGroup.add(edge);
        }

        this.staff.add(visualGroup);
        this.weaponVisual = visualGroup;
        
        // Ensure visibility is correct based on slot
        this.syncWeaponVisual();
        
        if (window.game) window.game.showFloatingText(`EQUIPPED ${weaponCfg.name.toUpperCase()}`, 0x39FF14);
    }

    setAccessory(type, accessoryId) {
        const config = CONFIG.ACCESSORIES.find(a => a.id === accessoryId);
        
        if (type === 'CAPE') {
            if (this.capeMesh) {
                this.accessoriesGroup.remove(this.capeMesh);
                this.capeMesh = null;
            }
            if (!config) return;

            const capeGroup = new THREE.Group();
            // Cape logic: A plane-like mesh behind the torso
            const capeGeo = new THREE.BoxGeometry(0.7, 1.2, 0.05);
            const capeMat = new THREE.MeshStandardMaterial({ 
                color: config.color,
                roughness: 0.5,
                metalness: 0.1
            });
            const cape = new THREE.Mesh(capeGeo, capeMat);
            cape.position.set(0, 0.9, -0.25);
            cape.rotation.x = 0.1; // Slight tilt
            capeGroup.add(cape);
            
            this.capeMesh = capeGroup;
            this.accessoriesGroup.add(this.capeMesh);

        } else if (type === 'CROWN') {
            if (this.crownMesh) {
                this.accessoriesGroup.remove(this.crownMesh);
                this.crownMesh = null;
            }
            if (!config) return;

            const crownGroup = new THREE.Group();
            // Crown logic: A ring around the top of the cap
            const ringGeo = new THREE.TorusGeometry(0.4, 0.05, 8, 32);
            const ringMat = new THREE.MeshStandardMaterial({ 
                color: config.color,
                emissive: config.color,
                emissiveIntensity: 1,
                metalness: 1,
                roughness: 0
            });
            const ring = new THREE.Mesh(ringGeo, ringMat);
            ring.rotation.x = Math.PI / 2;
            ring.position.y = 2.7; // Above the head/cap
            crownGroup.add(ring);

            // Add some "spikes" to the crown
            for (let i = 0; i < 6; i++) {
                const spikeGeo = new THREE.ConeGeometry(0.05, 0.2, 4);
                const spike = new THREE.Mesh(spikeGeo, ringMat);
                const angle = (i / 6) * Math.PI * 2;
                spike.position.set(Math.cos(angle) * 0.4, 2.8, Math.sin(angle) * 0.4);
                crownGroup.add(spike);
            }

            this.crownMesh = crownGroup;
            this.accessoriesGroup.add(this.crownMesh);
        }
    }

    enableAudio() {
        if (!canUseTone()) return;
        this.synth = createToneNode(() => new TONE.Synth({
            oscillator: { type: "triangle" },
            envelope: { attack: 0.01, decay: 0.1, sustain: 0, release: 0.1 }
        }).toDestination());

        this.shootSynth = createToneNode(() => new TONE.NoiseSynth({
            noise: { type: "white" },
            envelope: { attack: 0.005, decay: 0.1, sustain: 0 }
        }).toDestination());

        this.footstepSynth = createToneNode(() => new TONE.NoiseSynth({
            envelope: { attack: 0.005, decay: 0.08, sustain: 0 },
            volume: -25
        }).toDestination());

        this.levelUpSynth = createToneNode(() => new TONE.PolySynth().toDestination());
    }

    setClan(clanId) {
        const config = this.clanColors[clanId];
        if (!config) return;
        
        this.currentClan = clanId;
        const bodyMat = this.torso.material;
        bodyMat.color.setHex(config.robe);
        bodyMat.emissive.setHex(config.robe);
        bodyMat.emissiveIntensity = 0.2;

        this.leftArm.material.color.setHex(config.robe);
        this.rightArm.material.color.setHex(config.robe);
        
        this.eyeMat.color.setHex(config.magic);
        this.eyeMat.emissive.setHex(config.magic);
        
        this.tipMat.color.setHex(config.magic);
        this.tipMat.emissive.setHex(config.magic);
        this.staffLight.color.setHex(config.magic);
        this.magicColor = config.magic;

        // Shiba Infinity Robot Look
        if (clanId === 'shiba') {
            [this.torso, this.leftArm, this.rightArm, this.head].forEach(mesh => {
                mesh.material.metalness = 1.0;
                mesh.material.roughness = 0.1;
                mesh.material.color.setHex(0xaaaaaa);
            });
            this.eyeMat.emissiveIntensity = 10.0;
        } else {
            [this.torso, this.leftArm, this.rightArm, this.head].forEach(mesh => {
                mesh.material.metalness = 0.1;
                mesh.material.roughness = 0.1;
            });
            this.eyeMat.emissiveIntensity = 5.0;
        }

        this.applyLevelStats();
    }

    applyLevelStats() {
        const levelBonus = 1 + (this.level - 1) * 0.1; // 10% bonus per level
        
        // Clan Rank Bonus
        let clanBonus = 1.0;
        if (window.game && window.game.leaderboard) {
            const rankings = window.game.leaderboard.getBurnRankings();
            const myRank = rankings.findIndex(r => r.id === this.currentClan);
            if (myRank === 0) clanBonus = 1.25; // Top clan: +25% Power
            else if (myRank === 1) clanBonus = 1.15; // 2nd: +15%
            else if (myRank === 2) clanBonus = 1.05; // 3rd: +5%
        }

        // Skill Point Upgrades
        const magicDamageLevel = this.upgrades?.magicDamage || 0;
        const projectileCountLevel = this.upgrades?.projectileCount || 0;
        const attackSpeedLevel = this.upgrades?.attackSpeed || 0;
        const moveSpeedLevel = this.upgrades?.moveSpeed || 0;
        const healthRegenLevel = this.upgrades?.healthRegen || 0;
        const critStrikeLevel = this.upgrades?.critStrike || 0;
        this.hasFireTrail = (this.upgrades?.fireTrail || 0) > 0;
        this.hasRoyalSpore = (this.upgrades?.royalSpore || 0) > 0;
        this.hasFungalShield = (this.upgrades?.fungalShield || 0) > 0;
        this.hasMycelialNet = (this.upgrades?.mycelialNet || 0) > 0;

        // Forge Upgrades
        const forgeWeaponsLevel = this.forgeLevels?.weapons || 0;
        const forgeArmorLevel = this.forgeLevels?.armor || 0;
        
        const weaponBonus = forgeWeaponsLevel > 0 ? CONFIG.FORGE_UPGRADES.weapons[forgeWeaponsLevel - 1].damageBonus : 0;
        const armorBonus = forgeArmorLevel > 0 ? CONFIG.FORGE_UPGRADES.armor[forgeArmorLevel - 1].wardBonus : 0;

        // Reset base
        this.modifiers = {
            gravityMult: 1.0,
            speedMult: 1.0 * levelBonus * clanBonus * (1 + moveSpeedLevel * 0.1), // Clan bonus scales speed
            cooldownMult: 1.0 * Math.pow(0.85, attackSpeedLevel), // 15% reduction per level
            goalRadiusMult: 1.0 * levelBonus,
            projectileSpeedMult: 1.0 * levelBonus,
            projectileCount: 1 + projectileCountLevel,
            damageBonus: (magicDamageLevel + weaponBonus) * clanBonus, // Clan bonus scales damage
            wardBonus: armorBonus * clanBonus, // Clan bonus scales defense
            regenRate: healthRegenLevel * 0.05, // 0.05 HP per second per level
            critChance: critStrikeLevel * 0.08 // 8% crit chance per level
        };

        // Clan Specific Uniques
        switch(this.currentClan) {
            case 'myco': 
                this.modifiers.gravityMult = 0.7; // Spirit Glide
                break;
            case 'rougarou': 
                this.modifiers.speedMult *= 1.3; // Extra fast
                break;
            case 'tegbot': 
                this.modifiers.cooldownMult *= 0.6; // Rapid fire (stacks with skill)
                break;
            case 'shiba': 
                this.modifiers.goalRadiusMult *= 2.0; // Huge capture range
                break;
            case 'brood': 
                this.modifiers.projectileSpeedMult *= 1.5; // Dragon Breath
                break;
            case 'mycelius':
                this.modifiers.regenRate += 0.1; // Passive rot siphon
                break;
        }

        const territory = this.territoryModifiers || {};
        this.modifiers.speedMult *= territory.speedMult || 1;
        this.modifiers.cooldownMult *= territory.cooldownMult || 1;
        this.modifiers.goalRadiusMult *= territory.goalRadiusMult || 1;
        this.modifiers.projectileSpeedMult *= territory.projectileSpeedMult || 1;
        this.modifiers.damageBonus = (this.modifiers.damageBonus + (territory.damageBonusFlat || 0)) * (territory.damageBonusMult || 1);
        this.modifiers.wardBonus += territory.wardBonusFlat || 0;
        this.modifiers.regenRate += territory.regenBonus || 0;
        this.modifiers.critChance += territory.critBonus || 0;

        const wallet = this.walletModifiers || {};
        this.modifiers.speedMult *= wallet.speedMult || 1;
        this.modifiers.cooldownMult *= wallet.cooldownMult || 1;
        this.modifiers.goalRadiusMult *= wallet.goalRadiusMult || 1;
        this.modifiers.projectileSpeedMult *= wallet.projectileSpeedMult || 1;
        this.modifiers.projectileCount += wallet.projectileCountBonus || 0;
        this.modifiers.damageBonus = (this.modifiers.damageBonus + (wallet.damageBonusFlat || 0)) * (wallet.damageBonusMult || 1);
        this.modifiers.wardBonus += wallet.wardBonusFlat || 0;
        this.modifiers.regenRate += wallet.regenBonus || 0;
        this.modifiers.critChance += wallet.critBonus || 0;

        const powerup = this.powerupModifiers || {};
        this.modifiers.speedMult *= powerup.speedMult || 1;
        this.modifiers.cooldownMult *= powerup.cooldownMult || 1;
        this.modifiers.goalRadiusMult *= powerup.goalRadiusMult || 1;
        this.modifiers.projectileSpeedMult *= powerup.projectileSpeedMult || 1;
        this.modifiers.projectileCount += powerup.projectileCountBonus || 0;
        this.modifiers.damageBonus = (this.modifiers.damageBonus + (powerup.damageBonusFlat || 0)) * (powerup.damageBonusMult || 1);
        this.modifiers.wardBonus += powerup.wardBonusFlat || 0;
        this.modifiers.regenRate += powerup.regenBonus || 0;
        this.modifiers.critChance += powerup.critBonus || 0;

        this.updateModelVisuals();
    }

    updateModelVisuals() {
        const forgeWeaponsLevel = this.forgeLevels?.weapons || 0;
        const forgeArmorLevel = this.forgeLevels?.armor || 0;

        // Clear existing visuals
        while(this.weaponUpgrades.children.length > 0) this.weaponUpgrades.remove(this.weaponUpgrades.children[0]);
        while(this.armorUpgrades.children.length > 0) this.armorUpgrades.remove(this.armorUpgrades.children[0]);

        // Weapon Visuals
        if (forgeWeaponsLevel >= 1) {
            // Level 1: Glowing runes on staff
            const runeGeo = new THREE.BoxGeometry(0.1, 0.1, 0.02);
            const runeMat = new THREE.MeshStandardMaterial({ color: this.magicColor, emissive: this.magicColor, emissiveIntensity: 2 });
            for (let i = 0; i < 4; i++) {
                const rune = new THREE.Mesh(runeGeo, runeMat);
                rune.position.set(0.1, (i - 1.5) * 0.4, 0);
                this.weaponUpgrades.add(rune);
            }
        }
        if (forgeWeaponsLevel >= 2) {
            // Level 2: Extra floating shard at staff mid
            const shardGeo = new THREE.OctahedronGeometry(0.15, 0);
            const shardMat = new THREE.MeshStandardMaterial({ color: 0xffffff, emissive: this.magicColor, emissiveIntensity: 1 });
            const shard = new THREE.Mesh(shardGeo, shardMat);
            shard.position.set(0, 0, 0);
            shard.userData.isFloating = true;
            this.weaponUpgrades.add(shard);
        }
        if (forgeWeaponsLevel >= 3) {
            // Level 3: Magical orbit around tip
            const ringGeo = new THREE.TorusGeometry(0.4, 0.02, 8, 32);
            const ringMat = new THREE.MeshStandardMaterial({ color: this.magicColor, transparent: true, opacity: 0.5 });
            const ring = new THREE.Mesh(ringGeo, ringMat);
            ring.position.set(0, 1.3, 0);
            ring.rotation.x = Math.PI / 2;
            ring.userData.isRotating = true;
            this.weaponUpgrades.add(ring);
        }

        // Armor Visuals
        if (forgeArmorLevel >= 1) {
            // Level 1: Glowing shoulder pads (represented as boxes)
            const padGeo = new THREE.BoxGeometry(0.3, 0.15, 0.4);
            const padMat = new THREE.MeshStandardMaterial({ color: this.robeMat.color, emissive: this.magicColor, emissiveIntensity: 0.5 });
            const leftPad = new THREE.Mesh(padGeo, padMat);
            leftPad.position.set(-0.5, 1.3, 0.1);
            this.armorUpgrades.add(leftPad);
            const rightPad = new THREE.Mesh(padGeo, padMat);
            rightPad.position.set(0.5, 1.3, 0.1);
            this.armorUpgrades.add(rightPad);
        }
        if (forgeArmorLevel >= 2) {
            // Level 2: Back Cape / Wings glow
            const wingGeo = new THREE.BoxGeometry(1.2, 0.8, 0.05);
            const wingMat = new THREE.MeshStandardMaterial({ color: this.robeMat.color, transparent: true, opacity: 0.6, emissive: this.magicColor, emissiveIntensity: 0.3 });
            const cape = new THREE.Mesh(wingGeo, wingMat);
            cape.position.set(0, 0.8, -0.4);
            this.armorUpgrades.add(cape);
        }
        // No crown at Level 3 as requested
    }
    
    updateKeyBinds(newBinds) {
        this.keyBinds = newBinds;
    }

    updateGamepadBinds(newBinds) {
        this.gamepadBinds = newBinds;
    }

    initInput() {
        this.keyBinds = {
            forward: 'w',
            backward: 's',
            left: 'a',
            right: 'd',
            interact: 'e',
            jump: ' ',
            slot1: '1',
            slot2: '2',
            slot3: '3',
            slot4: '4',
            slot5: '5'
        };

        this.gamepadBinds = {
            forward: 12, // D-pad Up
            backward: 13, // D-pad Down
            left: 14, // D-pad Left
            right: 15, // D-pad Right
            jump: 0, // A / Cross
            interact: 3, // Y / Triangle
            attack: 2, // X / Square
            special: 1 // B / Circle
        };

        window.addEventListener('keydown', (e) => {
            if (e.code === 'Escape') {
                if (window.game) window.game.togglePause();
                return;
            }
            // V1.9.6 Core Linkage - Robust dual-path input (code + key) and stop arrow-key scroll
            if (this.handleKeyCode(e.code, true)) e.preventDefault();
            this.handleKey(e.key.toLowerCase(), true);
        });
        window.addEventListener('keyup', (e) => {
            if (this.handleKeyCode(e.code, false)) e.preventDefault();
            this.handleKey(e.key.toLowerCase(), false);
        });
        
        // Mouse click for action
        window.addEventListener('mousedown', (e) => {
            if (e.button === 0 && window.game && window.game.gameState === 'PLAYING') {
                this.useActiveSlot();
            }
        });
    }

    // V1.9.6 Core Linkage - layout-independent movement via KeyboardEvent.code
    handleKeyCode(code, isDown) {
        switch (code) {
            case 'KeyW':
                this.keys.forward = isDown; return true;
            case 'KeyS':
                this.keys.backward = isDown; return true;
            case 'KeyA':
                this.keys.left = isDown; return true;
            case 'KeyD':
                this.keys.right = isDown; return true;
            case 'ArrowUp':
                this.keys.tankForward = isDown; return true;
            case 'ArrowDown':
                this.keys.tankBackward = isDown; return true;
            case 'ArrowLeft':
                this.keys.turnLeft = isDown; return true;
            case 'ArrowRight':
                this.keys.turnRight = isDown; return true;
            case 'Space':
                if (isDown && !this.keys.jump) this.onJumpPress();
                this.keys.jump = isDown;
                return true;
        }
        return false;
    }
    
    handleKey(key, isDown) {
        if (key === this.keyBinds.forward) this.keys.forward = isDown;
        else if (key === this.keyBinds.backward) this.keys.backward = isDown;
        else if (key === this.keyBinds.left) this.keys.left = isDown;
        else if (key === this.keyBinds.right) this.keys.right = isDown;
        else if (key === this.keyBinds.jump) {
            if (isDown && !this.keys.jump) this.onJumpPress();
            this.keys.jump = isDown;
        }
        else if (key === this.keyBinds.interact) this.keys.interact = isDown;
        
        // Slot selection
        if (isDown) {
            if (key === this.keyBinds.slot1) { 
                this.activeSlot = 1; 
                this.syncWeaponVisual();
                if (window.game) window.game.updateHud(); 
            }
            else if (key === this.keyBinds.slot2) { 
                this.activeSlot = 2; 
                this.syncWeaponVisual();
                if (window.game) window.game.updateHud(); 
            }
            else if (key === this.keyBinds.slot3) { this.activeSlot = 3; if (window.game) window.game.updateHud(); }
            else if (key === this.keyBinds.slot4) { this.activeSlot = 4; if (window.game) window.game.updateHud(); }
            else if (key === this.keyBinds.slot5) { this.activeSlot = 5; if (window.game) window.game.updateHud(); }
        }

        if (key === 'v') { if (isDown) this.cycleWeapon(); }
        else if (key === 'g') { if (isDown) this.cycleMagic(); }
        // V1.9.30 - Keyboard dash on Shift, so the dash is testable on desktop
        // without a touch device. Only fires on the keydown edge, not while held.
        else if ((key === 'shift' || key === ' shift' || key === 'shiftleft' || key === 'shiftright')
                 && isDown && !this._shiftDashHeld) {
            this._shiftDashHeld = true;
            this.dash();
        }
        else if ((key === 'shift' || key === 'shiftleft' || key === 'shiftright') && !isDown) {
            this._shiftDashHeld = false;
        }
        else if (key === 'u' && isDown && window.game && window.game.gameState === 'PLAYING') window.game.showSkillMenu();
        else if (key === 'b' && isDown && window.game && window.game.gameState === 'PLAYING') window.game.showBurnPitMenu();
        
        switch(key) {
            case 'x': case 'f': if (isDown) this.useActiveSlot(); break; // Map legacy attack keys to active slot
            case 'c': this.keys.melee = isDown; break;
            case 'q': this.keys.special = isDown; break;
            case 'r': this.keys.trap = isDown; break;
        }
    }

    useActiveSlot() {
        if (this.activeSlot === 1) {
            this.shoot();
        } else if (this.activeSlot === 2) {
            this.meleeAttack();
        } else {
            // Check for items in inventory mapped to slots 3-5
            const slotItems = {
                3: 'capPotion',
                4: 'sporeBomb',
                5: 'rotSalve'
            };
            const itemId = slotItems[this.activeSlot];
            if (itemId && this.inventory.includes(itemId)) {
                this.useItem(itemId);
            } else if (itemId) {
                if (window.game) window.game.showFloatingText(`${itemId.toUpperCase()} EMPTY`, 0x888888);
            }
        }
    }

    useItem(itemId) {
        const itemIdx = this.inventory.indexOf(itemId);
        if (itemIdx === -1) return;

        if (itemId === 'capPotion') {
            if (this.hp < this.maxHp) {
                this.hp = Math.min(this.maxHp, this.hp + 2);
                this.inventory.splice(itemIdx, 1);
                if (window.game) {
                    window.game.updateHud();
                    window.game.showFloatingText("USED POTION!", 0xff0000);
                }
            } else {
                if (window.game) window.game.showFloatingText("HP ALREADY FULL", 0xffffff);
            }
        } else if (itemId === 'sporeBomb') {
            const forward = new THREE.Vector3(0, 0, 1).applyQuaternion(this.group.quaternion);
            const bombPos = this.group.position.clone().add(forward.multiplyScalar(2));
            const bomb = new SporeBomb3D(this.scene, bombPos);
            if (window.game) {
                if (!window.game.hazards) window.game.hazards = [];
                window.game.hazards.push(bomb);
                window.game.showFloatingText("BOMB DEPLOYED!", 0x39FF14);
            }
            this.inventory.splice(itemIdx, 1);
            if (window.game) window.game.updateHud();
        } else if (itemId === 'rotSalve') {
            // Rot Salve gives temporary 50% damage reduction (ward bonus)
            const salveDuration = 10000; // 10 seconds
            const originalWard = this.modifiers.wardBonus;
            this.modifiers.wardBonus += 2; // +2 flat reduction
            
            this.inventory.splice(itemIdx, 1);
            if (window.game) {
                window.game.updateHud();
                window.game.showFloatingText("WARD ACTIVATED!", 0x00ffff);
                
                // Visual effect: Blue glow
                this.group.traverse(child => {
                    if (child.material && child.material.emissive) {
                        child.material.emissiveIntensity *= 2;
                        child.material.emissive.set(0x00ffff);
                    }
                });

                setTimeout(() => {
                    this.modifiers.wardBonus = originalWard;
                    if (window.game) window.game.showFloatingText("WARD EXPIRED", 0x888888);
                    this.applyLevelStats(); // Restore visuals/stats
                }, salveDuration);
            }
        }
    }

    checkGamepad() {
        const gamepads = navigator.getGamepads ? navigator.getGamepads() : [];
        const gp = gamepads[0];
        if (!gp) return;

        const b = this.gamepadBinds;
        const deadzone = (window.game && window.game.progression.data.settings.deadzone) || 0.15;
        
        // Buttons
        this.keys.forward = gp.buttons[b.forward]?.pressed || gp.axes[1] < -deadzone;
        this.keys.backward = gp.buttons[b.backward]?.pressed || gp.axes[1] > deadzone;
        this.keys.left = gp.buttons[b.left]?.pressed || gp.axes[0] < -deadzone;
        this.keys.right = gp.buttons[b.right]?.pressed || gp.axes[0] > deadzone;
        
        const jumpPressed = gp.buttons[b.jump]?.pressed;
        if (jumpPressed && !this.lastGpJump) this.onJumpPress();
        this.keys.jump = jumpPressed;
        this.lastGpJump = jumpPressed;

        this.keys.interact = gp.buttons[b.interact]?.pressed;
        this.keys.shoot = gp.buttons[b.attack]?.pressed;
        this.keys.special = gp.buttons[b.special]?.pressed;

        // Start button for pause
        if (gp.buttons[9]?.pressed && !this.lastGpPause) {
            if (window.game) window.game.togglePause();
        }
        this.lastGpPause = gp.buttons[9]?.pressed;
    }

    cycleWeapon() {
        const meleeInInv = (this.inventory || []).filter(id => CONFIG.WEAPONS.some(w => w.id === id));
        if (meleeInInv.length === 0) return;
        
        let nextIdx = (meleeInInv.indexOf(this.currentWeaponId) + 1) % meleeInInv.length;
        this.equipWeapon(meleeInInv[nextIdx]);
    }

    takeDamage(amount) {
        // V1.9.30 - Dash invincibility frames. If the dash i-frame window is
        // active, the hit is fully ignored. Player still gets visual feedback
        // so it's clear something happened (avoids "did that hit me?" doubt).
        if (performance.now() < this._dashIFrameUntil) {
            if (window.game) window.game.showFloatingText("DODGE!", 0x66ffee);
            return;
        }

        // Flat reduction from ward
        const actualDamage = Math.max(0, amount - ((this.modifiers.wardBonus || 0) + (this.tempWardBonus || 0)));
        
        if (actualDamage <= 0) {
            if (window.game) window.game.showFloatingText("BLOCKED!", 0x39FF14);
            return;
        }

        // Haptic Feedback
        const gamepads = navigator.getGamepads ? navigator.getGamepads() : [];
        if (gamepads[0] && gamepads[0].vibrationActuator) {
            gamepads[0].vibrationActuator.playEffect("dual-rumble", {
                startDelay: 0,
                duration: 200,
                weakMagnitude: 1.0,
                strongMagnitude: 1.0
            });
        }

        this.hp -= actualDamage;
        this.triggerDamageFlash();
        if (window.game) {
            window.game.glitchIntensity = Math.min(1.0, window.game.glitchIntensity + 0.42);
            window.game.addCameraImpulse(actualDamage >= 1 ? 0.48 : 0.3);
            window.game.pulseHud('damage');
            window.game.showFloatingText("OUCH!", 0xff0000);
            window.game.updateHud();
            if (this.hp <= 0) {
                if (window.game.progression?.isTerritoryWarMode?.() && typeof window.game.handleTerritoryPlayerDown === 'function') {
                    window.game.showFloatingText("BANNER FALL!", 0xff0000, true);
                    void window.game.handleTerritoryPlayerDown();
                } else {
                    window.game.showFloatingText("DEFEATED", 0xff0000, true);
                    setTimeout(() => location.reload(), 2000);
                }
            }
        }
    }

    onJumpPress() {
        if (this.jumpCount < this.maxJumps) {
            this.velocity.y = this.jumpPower;
            this.jumpCount++;

            // V1.9.37 - Jump SFX. Tone.js raises "Start time must be strictly
            // greater than previous start time" when triggerAttackRelease is
            // called twice in the same audio-clock instant (e.g. very fast
            // double-jump, or a touch + key both firing on the same frame).
            // The audio glitch is harmless; the throw was bubbling to
            // window.onerror and showing in the HUD. Swallow it.
            try {
                this.synth.triggerAttackRelease(this.jumpCount === 1 ? "C4" : "E4", "16n");
            } catch (_) { /* duplicate-instant note, ignore */ }
        }
    }

    cycleMagic() {
        const learnedMagic = (this.inventory || []).filter(id => CONFIG.MAGIC.some(m => m.id === id));
        if (learnedMagic.length <= 1) return;
        
        this.currentMagicIdx = (this.currentMagicIdx + 1) % learnedMagic.length;
        const magicId = learnedMagic[this.currentMagicIdx];
        const magicCfg = CONFIG.MAGIC.find(m => m.id === magicId);
        
        if (window.game) {
            window.game.showFloatingText(`SPELL: ${magicCfg.name.toUpperCase()}`, this.magicColor);
            window.game.updateHud();
        }
    }

    shoot() {
        const now = Date.now();
        const cooldown = this.baseShootCooldown * this.modifiers.cooldownMult;
        if (now - this.lastShootTime < cooldown) return;
        
        const learnedMagic = (this.inventory || []).filter(id => CONFIG.MAGIC.some(m => m.id === id));
        const currentMagicId = learnedMagic[this.currentMagicIdx] || 'sparkSpore';
        const magicCfg = CONFIG.MAGIC.find(m => m.id === currentMagicId) || { name: 'Spark', damageBonus: 0 };

        const magicCost = currentMagicId === 'Crownflare' ? 25 : (currentMagicId === 'Rootbind' ? 15 : (currentMagicId === 'PurifyBloom' ? 12 : 10));
        if (this.magic < magicCost) return;
        this.magic -= magicCost;

        this.lastShootTime = now;
        this.isAttacking = true;
        this.attackAnimTimer = 0;

        const count = this.modifiers.projectileCount || 1;
        const spread = CONFIG.PLAYER.SPREAD_ANGLE || 0;

        for (let i = 0; i < count; i++) {
            const angleOffset = count > 1 ? (i / (count - 1) - 0.5) * spread : 0;
            
            const forward = new THREE.Vector3(0, 0, 1).applyQuaternion(this.group.quaternion);
            forward.applyAxisAngle(new THREE.Vector3(0, 1, 0), angleOffset);

            const shootPos = this.group.position.clone().add(forward.clone().multiplyScalar(1.0)).add(new THREE.Vector3(0, 1, 0));
            
            const isCrit = Math.random() < (this.modifiers.critChance || 0);
            
            // Special VFX for different spells
            let spellColor = this.magicColor;
            if (currentMagicId === 'PurifyBloom') spellColor = 0x80ffaa;
            if (currentMagicId === 'Rootbind') spellColor = 0x39FF14;
            if (currentMagicId === 'Crownflare') spellColor = 0xffaa00;

            const fireball = new Fireball3D(this.scene, shootPos, forward, isCrit, this.hasFireTrail);
            fireball.speed *= this.modifiers.projectileSpeedMult;
            fireball.magicId = currentMagicId;
            fireball.remoteCombatId = `proj:${now}:${i}:${Math.random().toString(36).slice(2, 8)}`;
            fireball.remoteHitWallets = new Set();
            fireball.rotCleanse = magicCfg.rotCleanse || 0.45;
            fireball.rotRadius = magicCfg.rotRadius || 4.5;

            // Scaling and Damage
            let damage = (1 + this.modifiers.damageBonus + (magicCfg.damageBonus || 0)) * (isCrit ? 2 : 1);
            let size = 1 + (this.modifiers.damageBonus * 0.2);

            if (currentMagicId === 'PurifyBloom') {
                size *= 1.15;
                fireball.isPurifyBloom = true;
                fireball.hasTrail = true;
            } else if (currentMagicId === 'Rootbind') {
                size *= 1.2;
                fireball.isRootbind = true;
            } else if (currentMagicId === 'Crownflare') {
                size *= 1.5;
                fireball.isCrownflare = true;
            }

            fireball.mesh.scale.set(size, size, size);
            fireball.damage = damage;
            fireball.trailColor = isCrit ? 0xffffff : spellColor;

            // Apply spell color
            if (!isCrit) {
                fireball.mesh.children.forEach(c => {
                    if (c instanceof THREE.Mesh && c.material) {
                        c.material.color.setHex(spellColor);
                        if (c.material.emissive) {
                            c.material.emissive.setHex(spellColor);
                            c.material.emissiveIntensity = 2;
                        }
                    }
                });
            }
            
            this.projectiles.push(fireball);
        }

        try { this.shootSynth.triggerAttackRelease("16n"); } catch (_) {}
    }

    meleeAttack() {
        const now = Date.now();
        // Cooldown based on weapon or base
        const weaponCfg = CONFIG.WEAPONS.find(w => w.id === this.currentWeaponId);
        const cooldown = (weaponCfg && weaponCfg.cooldown) || 400;

        if (now - this.lastMeleeTime < cooldown) return;
        this.lastMeleeTime = now;
        this.isMeleeAttacking = true;
        this.meleeAnimTimer = 0;
        this.meleeHasHit = false; // Reset hit flag for this swing
        this.createMeleeTrail(weaponCfg);

        // Melee sound - Pitch shift based on weapon
        const pitch = weaponCfg ? (weaponCfg.id === 'ember_axe' ? "E2" : "G2") : "C2";
        if (window.game && window.game.impactSynth) {
            try { window.game.impactSynth.triggerAttackRelease("16n"); } catch (_) {}
        }
        try { this.synth.triggerAttackRelease(pitch, "8n"); } catch (_) {}
    }

    checkMeleeCollision() {
        const weaponCfg = CONFIG.WEAPONS.find(w => w.id === this.currentWeaponId);
        const forward = new THREE.Vector3(0, 0, 1).applyQuaternion(this.group.quaternion);
        const playerPos = this.group.position;
        
        if (window.game) {
            let hitAny = false;
            let hitCrit = false;
            window.game.enemies.forEach(enemy => {
                const toEnemy = new THREE.Vector3().subVectors(enemy.mesh.position, playerPos);
                const dist = toEnemy.length();
                toEnemy.normalize();
                
                const dot = toEnemy.dot(forward);
                const angle = Math.acos(dot);
                
                const meleeRange = (weaponCfg && weaponCfg.range) || 3.5;
                const meleeArc = (weaponCfg && weaponCfg.arc) || Math.PI / 1.5; // ~120 degrees

                if (dist < meleeRange && angle < meleeArc / 2) {
                    const baseMeleeDmg = weaponCfg ? weaponCfg.damage : 5;
                    const isCrit = Math.random() < (this.modifiers.critChance || 0);
                    if (isCrit) hitCrit = true;
                    const damage = (baseMeleeDmg + (this.modifiers.damageBonus || 0)) * (isCrit ? 2 : 1);
                    
                    const isDead = enemy.takeDamage(damage);
                    if (isDead) {
                        window.game.handleEnemyDeath(enemy);
                    } else {
                        // Apply knockback if alive
                        const knockbackForce = (weaponCfg && weaponCfg.knockback) || 0.4;
                        const knockDir = toEnemy.clone().setY(0).normalize();
                        enemy.applyKnockback(knockDir, knockbackForce);
                    }
                    
                    hitAny = true;
                    const hitText = isCrit ? "CRITICAL!" : (this.currentWeaponId === 'none' ? "WHACK!" : "SLASH!");
                    window.game.showFloatingText(hitText, isCrit ? 0xffaa00 : 0xffffff);
                    
                    // Hit spark effect
                    this.createHitSpark(enemy.mesh.position);
                    
                    if (window.game) {
                        window.game.glitchIntensity = Math.min(0.5, window.game.glitchIntensity + (isCrit ? 0.16 : 0.1));
                        window.game.addCameraImpulse(isCrit ? 0.34 : 0.2);
                        window.game.pulseHud('impact');
                    }
                }
            });

            // V1.9.15 - Boss-spawned hit targets (e.g. Widowcap silk anchors).
            // Treated as fragile sub-objects with their own takeDamage().
            const meleeRange = (weaponCfg && weaponCfg.range) || 3.5;
            const meleeArc = (weaponCfg && weaponCfg.arc) || Math.PI / 1.5;
            const baseMeleeDmg = weaponCfg ? weaponCfg.damage : 5;
            (window.game.bossHitTargets || []).forEach(target => {
                if (!target || target.dead || !target.mesh) return;
                const toT = new THREE.Vector3().subVectors(target.mesh.position, playerPos);
                const dist = toT.length();
                toT.normalize();
                const dot = toT.dot(forward);
                const angle = Math.acos(dot);
                if (dist < meleeRange + 1.0 && angle < meleeArc / 2) {
                    target.takeDamage(baseMeleeDmg + (this.modifiers.damageBonus || 0));
                    this.createHitSpark(target.mesh.position);
                    hitAny = true;
                    window.game.showFloatingText('CUT SILK!', 0xffffff);
                }
            });

            if (typeof window.game.tryTerritoryMeleeHit === 'function') {
                const remoteHit = window.game.tryTerritoryMeleeHit({
                    playerPos,
                    forward,
                    weaponCfg,
                    baseDamage: baseMeleeDmg + (this.modifiers.damageBonus || 0),
                    critChance: this.modifiers.critChance || 0,
                });
                if (remoteHit?.hitAny) hitAny = true;
                if (remoteHit?.hitCrit) hitCrit = true;
            }

            if (hitAny && window.game) {
                try {
                    if (window.game.impactSynth) window.game.impactSynth.triggerAttackRelease("8n");
                    if (window.game.uiSynth) window.game.uiSynth.triggerAttackRelease(hitCrit ? "G3" : "C3", "16n");
                } catch (_) {}
            }
        }
    }

    createHitSpark(pos) {
        const isMobileFx = !!(window.game && (window.game.mobilePerf || window.game.isMobile));
        const sparkCount = isMobileFx ? (this.currentWeaponId === 'ember_axe' ? 3 : 2) : (this.currentWeaponId === 'ember_axe' ? 12 : 9);
        const group = new THREE.Group();
        group.position.copy(pos);
        this.scene.add(group);

        for (let i = 0; i < sparkCount; i++) {
            const pGeo = new THREE.BoxGeometry(0.06, 0.2 + Math.random() * 0.16, 0.06);
            const pMat = new THREE.MeshBasicMaterial({ color: i % 3 === 0 ? 0xffddaa : 0xffffff, transparent: true, opacity: 0.95 });
            const p = new THREE.Mesh(pGeo, pMat);
            const dir = new THREE.Vector3(Math.random() - 0.5, Math.random() * 0.6, Math.random() - 0.5).normalize();
            p.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI);
            p.userData.velocity = dir.multiplyScalar(0.16 + Math.random() * 0.12);
            p.userData.spin = (Math.random() - 0.5) * 0.35;
            group.add(p);
        }

        let frames = 0;
        const animateSparks = () => {
            frames++;
            group.children.forEach(p => {
                p.position.add(p.userData.velocity);
                p.rotation.x += p.userData.spin;
                p.rotation.y += p.userData.spin * 0.7;
                p.scale.multiplyScalar(0.92);
                if (p.material) p.material.opacity *= 0.9;
            });
            if (frames < (isMobileFx ? 10 : 18)) {
                requestAnimationFrame(animateSparks);
            } else {
                this.scene.remove(group);
            }
        };
        animateSparks();
    }

    createMeleeTrail(weaponCfg) {
        if (window.game && (window.game.mobilePerf || window.game.isMobile)) return;
        if (!this.staff || !this.staff.parent) return;

        const color = weaponCfg?.id === 'ember_axe'
            ? 0xffaa00
            : weaponCfg?.id === 'crystal_spire'
                ? 0x66f0ff
                : 0x39FF14;

        const slash = new THREE.Mesh(
            new THREE.RingGeometry(0.45, weaponCfg?.id === 'ember_axe' ? 1.55 : 1.35, 28, 1, -1.2, 2.2),
            new THREE.MeshBasicMaterial({
                color,
                transparent: true,
                opacity: 0.78,
                side: THREE.DoubleSide,
                depthWrite: false
            })
        );
        slash.position.set(0.15, 0.95, 0.8);
        slash.rotation.y = Math.PI / 2;
        slash.rotation.z = weaponCfg?.id === 'ember_axe' ? -0.3 : 0.12;
        this.staff.parent.add(slash);

        const born = performance.now ? performance.now() : Date.now();
        const animateTrail = () => {
            const now = performance.now ? performance.now() : Date.now();
            const t = (now - born) / 180;
            if (t >= 1 || !slash.parent) {
                try {
                    slash.parent?.remove(slash);
                    slash.geometry.dispose();
                    slash.material.dispose();
                } catch (_) {}
                return;
            }
            slash.material.opacity = (1 - t) * 0.82;
            slash.scale.setScalar(1 + t * 0.28);
            slash.rotation.x = -0.15 + t * 0.45;
            requestAnimationFrame(animateTrail);
        };
        animateTrail();
    }

    specialAbility() {
        if (!this.hasRoyalSpore) return false;
        const now = Date.now();
        if (now - this.lastSpecialTime < CONFIG.PLAYER.SPECIAL_COOLDOWN) return false;
        this.lastSpecialTime = now;
        this.isAttacking = true;
        this.attackAnimTimer = 0;

        switch(this.currentClan) {
            case 'myco': this.abilityMyco(); break;
            case 'rougarou': this.abilityRougarou(); break;
            case 'tegbot': this.abilityTegbot(); break;
            case 'shiba': this.abilityShiba(); break;
            case 'brood': this.abilityBrood(); break;
            case 'mycelius': this.abilityMycelius(); break;
            default: this.abilityMyco(); break;
        }
        return true;
    }

    getEquippedSkillCooldownMs(skillId) {
        switch (skillId) {
            case 'royalSpore': return CONFIG.PLAYER.SPECIAL_COOLDOWN;
            case 'mycelialNet': return 8000;
            case 'spore_blast': return 4500;
            case 'shroom_shield': return 10000;
            case 'mycelial_dash': return this.dashCooldownMs;
            case 'ember_strike': return 6500;
            case 'void_step': return 5500;
            case 'crown_aegis': return 14000;
            default: return 0;
        }
    }

    getEquippedSkillCooldownRemaining(skillId) {
        if (!skillId) return 0;
        switch (skillId) {
            case 'royalSpore':
                return Math.max(0, CONFIG.PLAYER.SPECIAL_COOLDOWN - (Date.now() - this.lastSpecialTime));
            case 'mycelialNet':
                return Math.max(0, 8000 - (Date.now() - this.lastNetTime));
            case 'mycelial_dash':
                return Math.max(0, this.dashReadyAt - performance.now());
            default:
                return Math.max(0, Number(this.skillReadyAt?.[skillId] || 0) - Date.now());
        }
    }

    useEquippedSkill(skillId) {
        if (!skillId) {
            if (window.game) window.game.showFloatingText('EQUIP A SKILL (U)', 0x888888, true);
            return false;
        }

        switch (skillId) {
            case 'royalSpore':
                if (!this.hasRoyalSpore) {
                    if (window.game) window.game.showFloatingText('CLAN SPECIAL LOCKED', 0x888888, true);
                    return false;
                }
                return this.specialAbility();
            case 'mycelialNet':
                if (!this.hasMycelialNet) {
                    if (window.game) window.game.showFloatingText('NET LOCKED', 0x888888, true);
                    return false;
                }
                return this.useMycelialNet();
            case 'spore_blast':
                return this.useSporeBlast();
            case 'shroom_shield':
                return this.useShroomShield();
            case 'mycelial_dash':
                return this.useMycelialDash();
            case 'ember_strike':
                return this.useEmberStrike();
            case 'void_step':
                return this.useVoidStep();
            case 'crown_aegis':
                return this.useCrownAegis();
            default:
                if (window.game) window.game.showFloatingText('SKILL NOT READY', 0x888888, true);
                return false;
        }
    }

    spendSkillMagic(cost, failLabel = 'LOW MAGIC') {
        if ((this.magic || 0) < cost) {
            if (window.game) window.game.showFloatingText(failLabel, 0x66ccff, true);
            return false;
        }
        this.magic -= cost;
        if (window.game) window.game.updateHud();
        return true;
    }

    triggerSkillCooldown(skillId) {
        const cooldownMs = this.getEquippedSkillCooldownMs(skillId);
        if (cooldownMs > 0) this.skillReadyAt[skillId] = Date.now() + cooldownMs;
    }

    createSkillPulse(color = this.magicColor, radius = 1.8, durationMs = 450) {
        if (!this.scene) return;
        const ring = new THREE.Mesh(
            new THREE.RingGeometry(radius * 0.35, radius, 32),
            new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.75, side: THREE.DoubleSide })
        );
        ring.rotation.x = Math.PI / 2;
        ring.position.copy(this.group.position).y = 0.2;
        this.scene.add(ring);

        const start = performance.now();
        const tick = () => {
            const t = Math.min(1, (performance.now() - start) / durationMs);
            ring.scale.setScalar(1 + t * 1.8);
            ring.material.opacity = 0.75 * (1 - t);
            if (t < 1) {
                requestAnimationFrame(tick);
            } else {
                try {
                    this.scene.remove(ring);
                    ring.geometry.dispose();
                    ring.material.dispose();
                } catch (_) {}
            }
        };
        tick();
    }

    applyTimedWardBonus(amount, durationMs, label, color = this.magicColor) {
        this.tempWardBonus = Math.max(this.tempWardBonus || 0, amount);
        this.createSkillPulse(color, 2.2, 650);
        if (window.game) {
            window.game.showFloatingText(label, color, true);
            window.game.updateHud();
        }
        clearTimeout(this._tempWardTimer);
        this._tempWardTimer = setTimeout(() => {
            this.tempWardBonus = 0;
            if (window.game) window.game.showFloatingText('WARD FADED', 0x888888);
        }, durationMs);
    }

    useSporeBlast() {
        if (this.getEquippedSkillCooldownRemaining('spore_blast') > 0) return false;
        if (!this.spendSkillMagic(18, 'NEED 18 MAGIC')) return false;
        this.triggerSkillCooldown('spore_blast');
        this.isAttacking = true;
        this.attackAnimTimer = 0;
        this.createSkillPulse(0x66eeff, 3.2, 600);
        this.dealAreaDamage(this.group.position, 8.5, 12);
        if (window.game?.handleEquippedSkillWorldCast) {
            window.game.handleEquippedSkillWorldCast('spore_blast', {
                player: this,
                position: this.group.position.clone()
            });
        }
        if (window.game) window.game.showFloatingText('SPORE BLAST!', 0x66eeff, true);
        try {
            const synth = new TONE.PolySynth({ polyphony: 3, oscillator: { type: 'triangle' } }).toDestination();
            synth.volume.value = -8;
            synth.triggerAttackRelease(['C4', 'G4', 'C5'], '8n');
        } catch (_) {}
        return true;
    }

    useShroomShield() {
        if (this.getEquippedSkillCooldownRemaining('shroom_shield') > 0) return false;
        if (!this.spendSkillMagic(16, 'NEED 16 MAGIC')) return false;
        this.triggerSkillCooldown('shroom_shield');
        this.applyTimedWardBonus(4, 8000, 'SHROOM SHIELD!', 0x80ffaa);
        this.hp = Math.min(this.maxHp, this.hp + 1);
        if (window.game) window.game.updateHud();
        if (window.game?.handleEquippedSkillWorldCast) {
            window.game.handleEquippedSkillWorldCast('shroom_shield', {
                player: this,
                position: this.group.position.clone()
            });
        }
        return true;
    }

    useMycelialDash() {
        const startPos = this.group.position.clone();
        if (!this.dash()) {
            if (window.game) window.game.showFloatingText('DASH CHARGING', 0x66ffee, true);
            return false;
        }
        this.dealAreaDamage(this.group.position, 4.5, 6);
        if (window.game?.handleEquippedSkillWorldCast) {
            window.game.handleEquippedSkillWorldCast('mycelial_dash', {
                player: this,
                startPos,
                position: this.group.position.clone(),
                endPos: this.group.position.clone()
            });
        }
        if (window.game) window.game.showFloatingText('MYCELIAL DASH!', 0x66ffee, true);
        return true;
    }

    useEmberStrike() {
        if (this.getEquippedSkillCooldownRemaining('ember_strike') > 0) return false;
        if (!this.spendSkillMagic(20, 'NEED 20 MAGIC')) return false;
        this.triggerSkillCooldown('ember_strike');
        this.isAttacking = true;
        this.attackAnimTimer = 0;

        const count = 7;
        const spread = Math.PI / 4;
        for (let i = 0; i < count; i++) {
            const angleOffset = (i / (count - 1) - 0.5) * spread;
            const forward = new THREE.Vector3(0, 0, 1).applyQuaternion(this.group.quaternion);
            forward.applyAxisAngle(new THREE.Vector3(0, 1, 0), angleOffset);
            const shootPos = this.group.position.clone().add(new THREE.Vector3(0, 1, 0));
            const fireball = new Fireball3D(this.scene, shootPos, forward, true, true);
            fireball.speed = 0.55 + Math.random() * 0.2;
            fireball.life = 26 + Math.random() * 10;
            fireball.damage = 10;
            fireball.trailColor = 0xff8800;
            fireball.skillId = 'ember_strike';
            fireball.mesh.scale.setScalar(1.15);
            this.projectiles.push(fireball);
        }

        if (window.game?.handleEquippedSkillWorldCast) {
            window.game.handleEquippedSkillWorldCast('ember_strike', {
                player: this,
                position: this.group.position.clone()
            });
        }
        if (window.game) window.game.showFloatingText('EMBER STRIKE!', 0xff8800, true);
        return true;
    }

    useVoidStep() {
        if (this.getEquippedSkillCooldownRemaining('void_step') > 0) return false;
        if (!this.spendSkillMagic(14, 'NEED 14 MAGIC')) return false;
        this.triggerSkillCooldown('void_step');

        const forward = new THREE.Vector3(0, 0, 1).applyQuaternion(this.group.quaternion).setY(0).normalize();
        const startPos = this.group.position.clone();
        this.group.position.addScaledVector(forward, 8);
        this._dashIFrameUntil = performance.now() + 260;
        this.createSkillPulse(0xaa66ff, 2.5, 550);
        this.dealAreaDamage(this.group.position, 4, 8);
        if (window.game) {
            window.game.showFloatingText('VOID STEP!', 0xaa66ff, true);
            window.game.addCameraImpulse(0.12);
        }

        if (this.scene) {
            [startPos, this.group.position.clone()].forEach(pos => {
                const marker = new THREE.Mesh(
                    new THREE.SphereGeometry(0.4, 8, 8),
                    new THREE.MeshBasicMaterial({ color: 0xaa66ff, transparent: true, opacity: 0.55 })
                );
                marker.position.copy(pos).y += 1;
                this.scene.add(marker);
                setTimeout(() => {
                    try {
                        this.scene.remove(marker);
                        marker.geometry.dispose();
                        marker.material.dispose();
                    } catch (_) {}
                }, 260);
            });
        }
        if (window.game?.handleEquippedSkillWorldCast) {
            window.game.handleEquippedSkillWorldCast('void_step', {
                player: this,
                startPos,
                position: this.group.position.clone(),
                endPos: this.group.position.clone()
            });
        }
        return true;
    }

    useCrownAegis() {
        if (this.getEquippedSkillCooldownRemaining('crown_aegis') > 0) return false;
        if (!this.spendSkillMagic(24, 'NEED 24 MAGIC')) return false;
        this.triggerSkillCooldown('crown_aegis');
        this.hp = Math.min(this.maxHp, this.hp + 3);
        this.applyTimedWardBonus(6, 10000, 'CROWN AEGIS!', 0xffdd55);
        this.dealAreaDamage(this.group.position, 6.5, 10);
        if (window.game) window.game.updateHud();
        if (window.game?.handleEquippedSkillWorldCast) {
            window.game.handleEquippedSkillWorldCast('crown_aegis', {
                player: this,
                position: this.group.position.clone()
            });
        }
        return true;
    }

    abilityMyco() {
        // Royal Spore Nova + Small Heal
        const radius = CONFIG.PLAYER.SPECIAL_RADIUS;
        const blastGeo = new THREE.RingGeometry(0.1, radius, 32);
        const blastMat = new THREE.MeshBasicMaterial({ color: this.magicColor, transparent: true, opacity: 0.8, side: THREE.DoubleSide });
        const blast = new THREE.Mesh(blastGeo, blastMat);
        blast.rotation.x = Math.PI / 2;
        blast.position.copy(this.group.position).y = 0.2;
        this.scene.add(blast);

        this.hp = Math.min(this.maxHp, this.hp + 1);
        if (window.game) window.game.updateHud();

        let scale = 0.1;
        const interval = setInterval(() => {
            scale += 1.2;
            blast.scale.set(scale, scale, 1);
            blast.material.opacity -= 0.04;
            if (blast.material.opacity <= 0) {
                this.scene.remove(blast);
                clearInterval(interval);
            }
        }, 30);

        this.dealAreaDamage(this.group.position, radius, 10);
        const synth = new TONE.PolySynth({
            polyphony: 4,
            oscillator: { type: "sawtooth" }
        }).toDestination();
        synth.volume.value = -5;
        synth.triggerAttackRelease(["C3", "E3", "G3", "C4"], "2n");
    }

    // V1.9.30 - Universal dash. Direction-aware:
    //   1. If the player is steering with the joystick / WASD, dash that way.
    //   2. Otherwise, dash whichever way King Myco is currently facing.
    // Drops a short ghost-trail VFX, plays a brown-noise whoosh, and grants a
    // ~220ms invuln window so dashing INTO danger is a real defensive option.
    // Returns true if the dash actually fired (used by the mobile button to
    // decide whether to pulse haptics).
    dash() {
        const now = performance.now();
        if (now < this.dashReadyAt) return false;
        this.dashReadyAt = now + this.dashCooldownMs;
        this._dashActiveUntil = now + this.dashDuration * 1000;
        this._dashIFrameUntil = now + this.dashIFrameMs;

        // Resolve dash direction.
        const dir = new THREE.Vector3();
        if (this.moveVector && this.moveVector.lengthSq() > 0.01) {
            // Camera-relative, matching the normal movement basis.
            const camera = (window.game && window.game.camera) || this.camera;
            if (camera) {
                const forward = new THREE.Vector3(0, 0, -1).applyQuaternion(camera.quaternion);
                forward.y = 0; forward.normalize();
                if (forward.lengthSq() < 0.001) forward.set(0, 0, -1);
                const right = new THREE.Vector3().crossVectors(forward, new THREE.Vector3(0, 1, 0));
                dir.add(forward.clone().multiplyScalar(this.moveVector.y));
                dir.add(right.clone().multiplyScalar(this.moveVector.x));
            }
        }
        if (dir.lengthSq() < 0.001) {
            // Facing-forward fallback.
            dir.set(0, 0, 1).applyQuaternion(this.group.quaternion);
        }
        dir.y = 0;
        if (dir.lengthSq() < 0.001) dir.set(0, 0, 1);
        dir.normalize();
        this._dashDir.copy(dir);

        // Rotate to face the dash direction so the ghost trail reads correctly.
        const targetRot = Math.atan2(dir.x, dir.z);
        this.group.rotation.y = targetRot;

        // Ghost-trail VFX (cheap clone, 5 frames apart).
        if (this.scene && !this.isGhost) {
            for (let i = 0; i < 4; i++) {
                setTimeout(() => {
                    const ghost = this.group.clone();
                    ghost.traverse(child => {
                        if (child.material) {
                            // Clone so we don't mutate live materials.
                            child.material = Array.isArray(child.material)
                                ? child.material.map(m => m.clone())
                                : child.material.clone();
                            const apply = (m) => {
                                m.transparent = true;
                                m.opacity = 0.28;
                                if (m.depthWrite !== undefined) m.depthWrite = false;
                            };
                            if (Array.isArray(child.material)) child.material.forEach(apply);
                            else apply(child.material);
                        }
                    });
                    this.scene.add(ghost);
                    setTimeout(() => this.scene.remove(ghost), 220);
                }, i * 35);
            }
        }

        // Whoosh SFX (brown noise, short).
        try {
            if (this.shootSynth) {
                this.shootSynth.envelope.attack = 0.005;
                this.shootSynth.envelope.decay = 0.18;
                this.shootSynth.triggerAttackRelease('16n');
            }
        } catch (_) {}

        // Camera shake hint via the existing glitch channel (tiny).
        if (window.game) {
            window.game.glitchIntensity = Math.min(0.6, (window.game.glitchIntensity || 0) + 0.08);
            window.game.addCameraImpulse(0.14);
            window.game.pulseHud('impact');
        }

        return true;
    }

    abilityRougarou() {
        // Feral Dash
        const dashDist = 12;
        const startPos = this.group.position.clone();
        const forward = new THREE.Vector3(0, 0, 1).applyQuaternion(this.group.quaternion);
        
        // Visual ghost effect
        for (let i = 0; i < 5; i++) {
            setTimeout(() => {
                const ghost = this.group.clone();
                ghost.traverse(child => {
                    if (child.material) {
                        child.material = child.material.clone();
                        child.material.transparent = true;
                        child.material.opacity = 0.3;
                    }
                });
                this.scene.add(ghost);
                setTimeout(() => this.scene.remove(ghost), 200);
            }, i * 40);
        }

        // Damage along path
        this.group.translateZ(dashDist);
        this.dealAreaDamage(this.group.position, 5, 15);
        
        const synth = new TONE.MembraneSynth({
            pitchDecay: 0.05,
            octaves: 4,
            oscillator: { type: "sine" }
        }).toDestination();
        synth.volume.value = 0;
        synth.triggerAttackRelease("C2", "4n");
        
        // Add a "whoosh" noise
        const noise = new TONE.NoiseSynth({
            noise: { type: "brown" },
            envelope: { attack: 0.01, decay: 0.4, sustain: 0 }
        }).toDestination();
        noise.volume.value = -10;
        noise.triggerAttackRelease("4n");
    }

    abilityTegbot() {
        // Chrono Overclock (Freeze Enemies)
        const radius = 20;
        const sphereGeo = new THREE.SphereGeometry(radius, 32, 32);
        const sphereMat = new THREE.MeshBasicMaterial({ color: 0x00ffff, transparent: true, opacity: 0.2, wireframe: true });
        const sphere = new THREE.Mesh(sphereGeo, sphereMat);
        sphere.position.copy(this.group.position);
        this.scene.add(sphere);

        if (window.game) {
            window.game.enemies.forEach(enemy => {
                if (enemy.mesh.position.distanceTo(this.group.position) < radius) {
                    enemy.applySlow(0.05, 300); // 95% slow
                    if (window.game.showFloatingText) window.game.showFloatingText("FROZEN!", 0x00ffff);
                }
            });
        }

        let life = 60;
        const interval = setInterval(() => {
            life--;
            sphere.rotation.y += 0.1;
            sphere.material.opacity -= 0.003;
            if (life <= 0) {
                this.scene.remove(sphere);
                clearInterval(interval);
            }
        }, 30);

        const synth = new TONE.MetalSynth({
            frequency: 200,
            envelope: { attack: 0.001, decay: 1.4, release: 0.2 },
            harmonicity: 5.1,
            modulationIndex: 32,
            resonance: 4000,
            octaves: 1.5
        }).toDestination();
        synth.volume.value = -5;
        synth.triggerAttackRelease("C3", "2n");
    }

    abilityShiba() {
        // Fortune Burst (Coin Shower)
        const count = 12;
        for (let i = 0; i < count; i++) {
            const angle = (i / count) * Math.PI * 2;
            const dir = new THREE.Vector3(Math.cos(angle), 0.5, Math.sin(angle)).normalize();
            const shootPos = this.group.position.clone().add(new THREE.Vector3(0, 1, 0));
            const fireball = new Fireball3D(this.scene, shootPos, dir, false, false);
            fireball.mesh.children.forEach(c => {
                if (c.material) {
                    c.material.color.setHex(0xffff00);
                    if (c.material.emissive) c.material.emissive.setHex(0xffff00);
                }
            });
            fireball.damage = 5;
            fireball.speed = 0.4;
            this.projectiles.push(fireball);
        }
        
        // Bonus spores
        this.blueSpores += 50;
        if (window.game) {
            window.game.progression.data.blueSpores += 50;
            window.game.progression.save();
            window.game.updateHud();
            window.game.showFloatingText("+50 FORTUNE!", 0xffff00);
        }

        const synth = new TONE.AMSynth({
            harmonicity: 3,
            detune: 0,
            oscillator: { type: "sine" },
            envelope: { attack: 0.01, decay: 0.1, sustain: 1, release: 0.5 },
            modulation: { type: "square" }
        }).toDestination();
        synth.volume.value = -5;
        synth.triggerAttackRelease("C5", "8n");
        
        // "Ding" sound
        const bell = new TONE.MetalSynth({
            harmonicity: 12,
            resonance: 800,
            modulationIndex: 20,
            envelope: { decay: 0.4 },
        }).toDestination();
        bell.volume.value = -10;
        bell.triggerAttackRelease("G5", "8n");
    }

    abilityBrood() {
        // Dragon's Breath (Fire Cone)
        const count = 15;
        const spread = Math.PI / 3; // 60 degrees
        
        for (let i = 0; i < count; i++) {
            const angleOffset = (i / (count - 1) - 0.5) * spread;
            const forward = new THREE.Vector3(0, 0, 1).applyQuaternion(this.group.quaternion);
            forward.applyAxisAngle(new THREE.Vector3(0, 1, 0), angleOffset);
            
            const shootPos = this.group.position.clone().add(new THREE.Vector3(0, 1, 0));
            const fireball = new Fireball3D(this.scene, shootPos, forward, true, true);
            fireball.speed = 0.5 + Math.random() * 0.3;
            fireball.life = 30 + Math.random() * 20;
            fireball.damage = 8;
            this.projectiles.push(fireball);
        }

        const noise = new TONE.NoiseSynth({
            noise: { type: 'pink' },
            envelope: { attack: 0.1, decay: 1, sustain: 0 }
        }).toDestination();
        noise.volume.value = 0;
        noise.triggerAttackRelease("1n");
        
        const roar = new TONE.MembraneSynth({
            pitchDecay: 0.2,
            octaves: 2,
            oscillator: { type: "sine" }
        }).toDestination();
        roar.volume.value = -5;
        roar.triggerAttackRelease("G1", "1n");
    }

    abilityMycelius() {
        // Rot Vortex (Vacuum + DOT)
        const radius = 12;
        const vortexGeo = new THREE.TorusGeometry(radius, 0.5, 16, 100);
        const vortexMat = new THREE.MeshStandardMaterial({ color: 0xaa00ff, emissive: 0xaa00ff, emissiveIntensity: 5, transparent: true, opacity: 0.6 });
        const vortex = new THREE.Mesh(vortexGeo, vortexMat);
        vortex.rotation.x = Math.PI / 2;
        vortex.position.copy(this.group.position).y = 0.5;
        this.scene.add(vortex);

        let life = 90;
        const interval = setInterval(() => {
            life--;
            vortex.rotation.z += 0.2;
            vortex.scale.multiplyScalar(0.98);
            
            if (window.game) {
                window.game.enemies.forEach(enemy => {
                    const dist = enemy.mesh.position.distanceTo(this.group.position);
                    if (dist < radius) {
                        // Pull toward center
                        const pullDir = new THREE.Vector3().subVectors(this.group.position, enemy.mesh.position).normalize();
                        enemy.mesh.position.add(pullDir.multiplyScalar(0.2));
                        // Small DOT
                        if (enemy.takeDamage(0.2) && typeof window.game.handleEnemyDeath === 'function') {
                            window.game.handleEnemyDeath(enemy);
                        }
                    }
                });
            }

            if (life <= 0) {
                this.scene.remove(vortex);
                clearInterval(interval);
            }
        }, 30);

        const synth = new TONE.FMSynth({
            harmonicity: 0.5,
            modulationIndex: 20,
            oscillator: { type: "sine" },
            envelope: { attack: 0.1, decay: 0.2, sustain: 0.5, release: 1.2 }
        }).toDestination();
        synth.volume.value = -5;
        synth.triggerAttackRelease("A2", "2n");
        
        const deepHum = new TONE.Oscillator(50, "sine").toDestination().start().stop("+2");
        deepHum.volume.value = -15;
    }

    dealAreaDamage(position, radius, damage) {
        if (window.game) {
            window.game.enemies.forEach(enemy => {
                if (enemy.mesh.position.distanceTo(position) < radius) {
                    if (enemy.takeDamage(damage + (this.modifiers.damageBonus || 0)) && typeof window.game.handleEnemyDeath === 'function') {
                        window.game.handleEnemyDeath(enemy);
                    }
                }
            });
        }
    }

    useMycelialNet() {
        if (!this.hasMycelialNet) return false;
        const now = Date.now();
        if (now - this.lastNetTime < 8000) return false; // 8s cooldown
        this.lastNetTime = now;
        
        const trap = new NetTrap3D(this.scene, this.group.position, 0x00ffff);
        if (window.game) {
            if (!window.game.traps) window.game.traps = [];
            window.game.traps.push(trap);
            window.game.showFloatingText("NET DEPLOYED!", 0x00ffff);
        }

        const synth = new TONE.NoiseSynth({ envelope: { attack: 0.1, decay: 0.5 } }).toDestination();
        synth.triggerAttackRelease("4n");
        return true;
    }
    
    levelUp() {
        // Visual Level Up Effect
        const flashGeo = new THREE.SphereGeometry(2, 16, 16);
        const flashMat = new THREE.MeshStandardMaterial({ 
            color: 0xffff00, 
            transparent: true, 
            opacity: 0.8,
            emissive: 0xffff00,
            emissiveIntensity: 5
        });
        const flash = new THREE.Mesh(flashGeo, flashMat);
        flash.position.set(0, 1, 0);
        this.group.add(flash);

        // Animate the flash
        let scale = 1;
        const interval = setInterval(() => {
            scale += 0.2;
            flash.scale.set(scale, scale, scale);
            flash.material.opacity -= 0.05;
            if (flash.material.opacity <= 0) {
                this.group.remove(flash);
                clearInterval(interval);
            }
        }, 30);

        // Sound effect
        this.levelUpSynth.triggerAttackRelease(["C4", "E4", "G4", "C5"], "2n");
    }

    animatePlayer() {
        this.animTimer += 0.15;
        
        // Idle bobbing
        this.torso.position.y = 1.15 + Math.sin(this.animTimer * 0.5) * 0.02;
        
        // Pulse staff flame
        const flamePulse = 1 + Math.sin(this.animTimer * 2) * 0.2;
        this.tip.scale.set(flamePulse, flamePulse, flamePulse);
        this.staffLight.intensity = 5 + Math.sin(this.animTimer * 2) * 2;
        
        if (this.isWalking) {
            // Sway torso
            this.torso.rotation.z = Math.sin(this.animTimer) * 0.05;
            
            // Swing arms (R6 style)
            this.leftArm.rotation.x = Math.sin(this.animTimer) * 0.5;
            this.rightArm.rotation.x = -Math.sin(this.animTimer) * 0.5;
            
            // Swing legs (R6 style)
            this.leftLeg.rotation.x = -Math.sin(this.animTimer) * 0.5;
            this.rightLeg.rotation.x = Math.sin(this.animTimer) * 0.5;

            // Environmental Footsteps
            const stepPhase = Math.sin(this.animTimer);
            if (!this._lastFootstepState) this._lastFootstepState = 0;
            
            // Trigger at peaks (roughly 0.95 or -0.95)
            if (Math.abs(stepPhase) > 0.95 && Math.abs(this._lastFootstepState) <= 0.95) {
                this.playFootstepSound();
                this.spawnFootstepParticles();
            }
            this._lastFootstepState = stepPhase;

            // Cap tilt
            this.cap.rotation.z = Math.sin(this.animTimer) * 0.03;
        } else {
            // Reset to idle positions smoothly
            this.torso.rotation.z = THREE.MathUtils.lerp(this.torso.rotation.z, 0, 0.1);
            
            this.leftArm.rotation.x = THREE.MathUtils.lerp(this.leftArm.rotation.x, 0, 0.1);
            this.rightArm.rotation.x = THREE.MathUtils.lerp(this.rightArm.rotation.x, 0, 0.1);
            
            this.leftLeg.rotation.x = THREE.MathUtils.lerp(this.leftLeg.rotation.x, 0, 0.1);
            this.rightLeg.rotation.x = THREE.MathUtils.lerp(this.rightLeg.rotation.x, 0, 0.1);

            this.cap.rotation.z = THREE.MathUtils.lerp(this.cap.rotation.z, 0, 0.1);
        }

        if (this.isAttacking) {
            this.attackAnimTimer += 0.2;
            // Raise staff
            if (this.staff.parent) {
                this.staff.parent.rotation.x = Math.sin(this.attackAnimTimer * 2) * -0.5;
                if (this.attackAnimTimer > Math.PI) {
                    this.isAttacking = false;
                    this.staff.parent.rotation.x = 0;
                }
            }
        }

        if (this.isMeleeAttacking) {
            this.meleeAnimTimer += 0.25;
            // Swing staff forward
            if (this.staff.parent) {
                this.staff.parent.rotation.x = Math.sin(this.meleeAnimTimer) * 1.5;
                this.staff.parent.position.z = Math.sin(this.meleeAnimTimer) * 0.5;

                // Trigger collision check at the peak of the swing (roughly PI/2)
                if (!this.meleeHasHit && this.meleeAnimTimer >= Math.PI / 2) {
                    this.meleeHasHit = true;
                    this.checkMeleeCollision();
                }

                if (this.meleeAnimTimer > Math.PI) {
                    this.isMeleeAttacking = false;
                    this.staff.parent.rotation.x = 0;
                    this.staff.parent.position.z = 0.4;
                }
            }
        }

        // Jumping legs/arms spread
        if (this.jumpCount > 0) {
            this.leftArm.position.x = -0.6 - (Math.abs(this.velocity.y) * 1.5);
            this.rightArm.position.x = 0.6 + (Math.abs(this.velocity.y) * 1.5);
        } else {
            this.leftArm.position.x = THREE.MathUtils.lerp(this.leftArm.position.x, -0.6, 0.1);
            this.rightArm.position.x = THREE.MathUtils.lerp(this.rightArm.position.x, 0.6, 0.1);
        }

        // Animate Upgrade Visuals
        this.weaponUpgrades.children.forEach(child => {
            if (child.userData.isFloating) {
                child.position.y = Math.sin(this.animTimer * 0.5) * 0.1;
                child.rotation.y += 0.02;
            }
            if (child.userData.isRotating) {
                child.rotation.z += 0.05;
            }
        });
    }

    playFootstepSound() {
        if (!window.game || !window.game.currentRegion) return;
        const region = window.game.currentRegion.id;

        // V1.9.37 - All triggerAttackRelease calls below are wrapped because
        // Tone's NoiseSynth throws if scheduled at the same audio-clock instant
        // as the previous note. Footsteps are timer-driven so collisions are
        // rare, but on a hitched frame two stride ticks can resolve simultaneously.
        try {
            // Calibrate noise based on region terrain
            if (region === 'crystalcap') {
                // Metallic clink
                this.footstepSynth.noise.type = 'white';
                this.footstepSynth.envelope.decay = 0.05;
                this.footstepSynth.triggerAttackRelease("16n");
            } else if (region === 'emberstem') {
                // Ashy/Crunchy
                this.footstepSynth.noise.type = 'pink';
                this.footstepSynth.envelope.decay = 0.1;
                this.footstepSynth.triggerAttackRelease("16n");
            } else if (region === 'ambermycel' || region === 'sporewood') {
                // Wet squish
                this.footstepSynth.noise.type = 'brown';
                this.footstepSynth.envelope.decay = 0.15;
                this.footstepSynth.triggerAttackRelease("16n");
            } else {
                // Default muffled thud
                this.footstepSynth.noise.type = 'brown';
                this.footstepSynth.envelope.decay = 0.08;
                this.footstepSynth.triggerAttackRelease("16n");
            }
        } catch (_) {}
    }

    spawnFootstepParticles() {
        if (!window.game || !window.game.currentRegion) return;
        const regionId = window.game.currentRegion.id;
        
        // Offset particle slightly to the foot currently "hitting"
        const footOffset = this._lastFootstepState > 0 ? 0.3 : -0.3;
        const pos = this.group.position.clone();
        pos.y = 0.1; // Ground level
        
        // Apply rotation to offset
        const lateral = new THREE.Vector3(footOffset, 0, 0).applyQuaternion(this.group.quaternion);
        pos.add(lateral);

        window.game.spawnFootstepParticles(pos, regionId);
    }

    playLandSound() {
        if (!window.game || !window.game.currentRegion) return;
        const region = window.game.currentRegion.id;

        // V1.9.37 - Same defensive wrap as playFootstepSound. Landings can
        // coincide with a double-jump's second note on the exact same frame.
        try {
            // Louder, longer version of footstep for landing
            if (region === 'crystalcap') {
                this.footstepSynth.noise.type = 'white';
                this.footstepSynth.envelope.decay = 0.15;
                this.footstepSynth.triggerAttackRelease("8n");
            } else if (region === 'emberstem') {
                this.footstepSynth.noise.type = 'pink';
                this.footstepSynth.envelope.decay = 0.2;
                this.footstepSynth.triggerAttackRelease("8n");
            } else if (region === 'ambermycel' || region === 'sporewood') {
                this.footstepSynth.noise.type = 'brown';
                this.footstepSynth.envelope.decay = 0.3;
                this.footstepSynth.triggerAttackRelease("8n");
            } else {
                this.footstepSynth.noise.type = 'brown';
                this.footstepSynth.envelope.decay = 0.2;
                this.footstepSynth.triggerAttackRelease("8n");
            }
        } catch (_) {}

        // Add a low thud for all landings
        if (window.game.impactSynth) {
            try { window.game.impactSynth.triggerAttackRelease("8n"); } catch (_) {}
        }
    }

    updateShield() {
        if (!this.hasFungalShield) {
            this.shieldGroup.visible = false;
            return;
        }

        this.shieldGroup.visible = true;
        
        // Create shield visual if not present
        if (this.shieldGroup.children.length === 0) {
            const shieldGeo = new THREE.IcosahedronGeometry(0.3, 1);
            const shieldMat = new THREE.MeshStandardMaterial({ 
                color: this.magicColor, 
                emissive: this.magicColor, 
                emissiveIntensity: 2,
                transparent: true,
                opacity: 0.8
            });
            const shieldMesh = new THREE.Mesh(shieldGeo, shieldMat);
            this.shieldGroup.add(shieldMesh);
            
            // Add a small rotating ring
            const ringGeo = new THREE.TorusGeometry(0.5, 0.05, 8, 16);
            const ringMat = new THREE.MeshStandardMaterial({ color: this.magicColor, transparent: true, opacity: 0.5 });
            const ring = new THREE.Mesh(ringGeo, ringMat);
            ring.rotation.x = Math.PI / 2;
            this.shieldGroup.add(ring);
        }

        // Update orbit
        this.shieldOrbitAngle += 0.05;
        const orbitRadius = 2.0;
        this.shieldGroup.position.set(
            Math.cos(this.shieldOrbitAngle) * orbitRadius,
            1.0 + Math.sin(this.shieldOrbitAngle * 0.5) * 0.5, // Slight bobbing
            Math.sin(this.shieldOrbitAngle) * orbitRadius
        );
        this.shieldGroup.rotation.y += 0.1;

        // Block projectiles (Logic handled in Game loop for easier array access)
    }

    _drawHpBar() {
        const ctx = this._hpBarCtx;
        if (!ctx) return;
        const W = this._hpBarCanvas.width;
        const H = this._hpBarCanvas.height;
        const pct = Math.max(0, Math.min(1, this.hp / Math.max(1, this.maxHp)));

        ctx.clearRect(0, 0, W, H);

        // Outer dark frame with rounded corners
        const pad = 6;
        const barX = pad;
        const barY = 22;
        const barW = W - pad * 2;
        const barH = 28;
        const r = 8;

        const roundRect = (x, y, w, h, rad) => {
            ctx.beginPath();
            ctx.moveTo(x + rad, y);
            ctx.lineTo(x + w - rad, y);
            ctx.quadraticCurveTo(x + w, y, x + w, y + rad);
            ctx.lineTo(x + w, y + h - rad);
            ctx.quadraticCurveTo(x + w, y + h, x + w - rad, y + h);
            ctx.lineTo(x + rad, y + h);
            ctx.quadraticCurveTo(x, y + h, x, y + h - rad);
            ctx.lineTo(x, y + rad);
            ctx.quadraticCurveTo(x, y, x + rad, y);
            ctx.closePath();
        };

        // Backdrop
        ctx.fillStyle = 'rgba(0, 0, 0, 0.78)';
        roundRect(barX, barY, barW, barH, r);
        ctx.fill();
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.35)';
        ctx.lineWidth = 2;
        ctx.stroke();

        // HP fill — green > 60%, yellow > 30%, red below
        const fillW = Math.max(0, (barW - 4) * pct);
        let grad;
        if (pct > 0.6) {
            grad = ctx.createLinearGradient(barX, barY, barX, barY + barH);
            grad.addColorStop(0, '#7dff5a');
            grad.addColorStop(1, '#1faa14');
        } else if (pct > 0.3) {
            grad = ctx.createLinearGradient(barX, barY, barX, barY + barH);
            grad.addColorStop(0, '#ffdc4a');
            grad.addColorStop(1, '#c98300');
        } else {
            grad = ctx.createLinearGradient(barX, barY, barX, barY + barH);
            grad.addColorStop(0, '#ff6a5a');
            grad.addColorStop(1, '#a8121b');
        }
        if (fillW > 0) {
            ctx.fillStyle = grad;
            roundRect(barX + 2, barY + 2, fillW, barH - 4, Math.max(2, r - 3));
            ctx.fill();
            // Glossy highlight strip
            ctx.fillStyle = 'rgba(255, 255, 255, 0.22)';
            roundRect(barX + 2, barY + 2, fillW, (barH - 4) / 2, Math.max(2, r - 3));
            ctx.fill();
        }

        // Numeric readout
        ctx.font = 'bold 18px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillStyle = '#000';
        ctx.fillText(`${Math.ceil(this.hp)} / ${this.maxHp}`, W / 2 + 1, barY + barH / 2 + 1);
        ctx.fillStyle = '#fff';
        ctx.fillText(`${Math.ceil(this.hp)} / ${this.maxHp}`, W / 2, barY + barH / 2);

        // "HP" label tab above bar
        ctx.font = 'bold 14px sans-serif';
        ctx.textAlign = 'left';
        ctx.fillStyle = 'rgba(0,0,0,0.85)';
        ctx.fillText('HP', barX + 4, 12);
        ctx.fillStyle = '#7dff5a';
        ctx.fillText('HP', barX + 3, 11);

        this._hpBarTexture.needsUpdate = true;
        this._lastHpBarHp = this.hp;
        this._lastHpBarMax = this.maxHp;
    }

    _updateHpBar() {
        if (!this.hpBarSprite) return;
        if (this.hp !== this._lastHpBarHp || this.maxHp !== this._lastHpBarMax) {
            this._drawHpBar();
        }
    }

    // V1.9.26 - Trigger a fresh damage flash. Resets to full intensity even if a
    // flash was already in progress so back-to-back hits feel punchy.
    triggerDamageFlash() {
        if (!this._damageFlashMeshes || this._damageFlashMeshes.length === 0) return;
        this._damageFlashT = 1;
    }

    // V1.9.26 - Ease body materials between their base color/emissive and a red
    // tint based on _damageFlashT. Skips work entirely when flash is idle so the
    // hot loop pays nothing 99% of the time.
    _updateDamageFlash(dt) {
        if (!this._damageFlashMeshes || this._damageFlashMeshes.length === 0) return;
        if (this._damageFlashT <= 0) return;

        this._damageFlashT = Math.max(0, this._damageFlashT - dt / this._damageFlashDuration);
        // Sharp punch in, soft fade out (front-loaded curve).
        const k = this._damageFlashT * this._damageFlashT;
        const flashCol = this._damageFlashColor;

        for (const entry of this._damageFlashMeshes) {
            const m = entry.mat;
            // Lerp color from base toward red.
            m.color.copy(entry.baseColor).lerp(flashCol, k * 0.85);
            if (entry.baseEmissive && m.emissive) {
                m.emissive.copy(entry.baseEmissive).lerp(flashCol, k);
                if (typeof m.emissiveIntensity === 'number') {
                    m.emissiveIntensity = entry.baseEmissiveIntensity + k * 1.4;
                }
            }
        }

        // Snap back to base exactly when finished so colors never drift.
        if (this._damageFlashT === 0) {
            for (const entry of this._damageFlashMeshes) {
                const m = entry.mat;
                m.color.copy(entry.baseColor);
                if (entry.baseEmissive && m.emissive) {
                    m.emissive.copy(entry.baseEmissive);
                    if (typeof m.emissiveIntensity === 'number') {
                        m.emissiveIntensity = entry.baseEmissiveIntensity;
                    }
                }
            }
        }
    }

    update(collidables = [], platforms = []) {
        if (this.isGhost) return;
        this.checkGamepad();

        if (this.keys.special) {
            if (!this._specialHeld) {
                this._specialHeld = true;
                if (window.game && window.game.gameState === 'PLAYING') {
                    window.game.useEquippedSkill({ source: 'input' });
                }
            }
        } else {
            this._specialHeld = false;
        }

        if (this.keys.trap) {
            if (!this._trapHeld) {
                this._trapHeld = true;
                if (window.game && window.game.gameState === 'PLAYING' && window.game.getEquippedSkillId?.() === 'mycelialNet') {
                    window.game.useEquippedSkill({ source: 'trap' });
                }
            }
        } else {
            this._trapHeld = false;
        }
        
        const prevPos = this._prevPos.copy(this.group.position);
        if (!this._tempBox) this._tempBox = new THREE.Box3();

        // Passive HP Regeneration
        if (this.hp < this.maxHp && this.modifiers.regenRate > 0) {
            this.regenAccumulator = (this.regenAccumulator || 0) + (this.modifiers.regenRate / 60); // Assuming 60fps
            if (this.regenAccumulator >= 1) {
                this.hp = Math.min(this.maxHp, this.hp + 1);
                this.regenAccumulator = 0;
                if (window.game) window.game.updateHud();
            }
        }

        // V1.9.25 - Refresh overhead HP bar texture only when values change.
        this._updateHpBar();

        // V1.9.26 - Tick the damage flash. Assume ~60fps; cheap no-op when idle.
        this._updateDamageFlash(1 / 60);

        // V1.9.30 - Apply dash burst. While _dashActiveUntil > now we translate
        // along _dashDir at dashSpeed per frame. This stacks on top of regular
        // movement so the player can still steer mid-dash, just with a huge
        // additive push. Collision is handled by the same world-collision code
        // that runs after this method body.
        if (performance.now() < this._dashActiveUntil) {
            this.group.position.addScaledVector(this._dashDir, this.dashSpeed);
        }

        // Magic Regeneration
        if (this.magic < this.maxMagic) {
            this.magic = Math.min(this.maxMagic, this.magic + this.magicRegen);
        }

        const moveSpeed = this.baseSpeed * this.modifiers.speedMult * this.slowFactor;
        this.isWalking = false;

        const analogTurn = Math.max(-1, Math.min(1, this.tankTurnInput || 0));
        const analogThrottle = Math.max(-1, Math.min(1, this.tankThrottleInput || 0));
        const usingTankControls = Math.abs(analogTurn) > 0.01 || Math.abs(analogThrottle) > 0.01 || this.keys.turnLeft || this.keys.turnRight || this.keys.tankForward || this.keys.tankBackward;

        if (usingTankControls) {
            const digitalTurn = (this.keys.turnRight ? 1 : 0) - (this.keys.turnLeft ? 1 : 0);
            const turnInput = Math.max(-1, Math.min(1, digitalTurn + analogTurn));
            // Tank/mobile steering uses +1 for "turn right", but King Myco's
            // forward basis and world camera make positive Y rotation read as a
            // left turn on-screen. Invert the applied yaw so left actually turns
            // left and right actually turns right across keyboard + touch.
            if (Math.abs(turnInput) > 0.01) this.group.rotation.y -= this.turnInPlaceSpeed * turnInput;

            const digitalThrottle = (this.keys.tankForward ? 1 : 0) - (this.keys.tankBackward ? 1 : 0);
            const throttleInput = Math.abs(analogThrottle) > 0.01
                ? Math.max(-1, Math.min(1, analogThrottle + digitalThrottle))
                : digitalThrottle;

            const facing = this._tempFacing.set(0, 0, 1).applyQuaternion(this.group.quaternion);
            facing.y = 0;
            if (facing.lengthSq() < 0.001) facing.set(0, 0, 1);
            facing.normalize();

            if (Math.abs(throttleInput) > 0.01) {
                const reverseScale = throttleInput < 0 ? 0.92 : 1.0;
                this._tempTankMove.copy(facing).multiplyScalar(throttleInput);
                this.group.position.addScaledVector(this._tempTankMove, moveSpeed * reverseScale);
                this.isWalking = true;
            }
        }

        // V1.9.9 - Camera-relative movement that works whether or not window.game is wired up.
        const camera = (window.game && window.game.camera) || this.camera;
        if (camera && !usingTankControls) {
            const forward = this._tempForward.set(0, 0, -1).applyQuaternion(camera.quaternion);
            forward.y = 0;
            if (forward.lengthSq() < 0.001) forward.set(0, 0, -1); // Camera looking straight down fallback.
            else forward.normalize();

            const right = this._tempRight.crossVectors(forward, WORLD_UP);

            const moveDir = this._tempMoveDir.set(0, 0, 0);

            // Priority to moveVector (Analog) then keys (Digital)
            if (this.moveVector.lengthSq() > 0.01) {
                moveDir.addScaledVector(forward, this.moveVector.y);
                moveDir.addScaledVector(right, this.moveVector.x);
            } else {
                if (this.keys.forward)  moveDir.add(forward);
                if (this.keys.backward) moveDir.sub(forward);
                if (this.keys.left)     moveDir.sub(right);
                if (this.keys.right)    moveDir.add(right);
            }

            if (moveDir.lengthSq() > 0) {
                moveDir.normalize();
                this.group.position.addScaledVector(moveDir, moveSpeed);
                this.isWalking = true;

                // V1.9.9 - Slower, shortest-arc turn so direction changes are smooth, never jumpy.
                const targetRotation = Math.atan2(moveDir.x, moveDir.z);
                let dy = targetRotation - this.group.rotation.y;
                dy = Math.atan2(Math.sin(dy), Math.cos(dy));
                this.group.rotation.y += dy * 0.08;
            }
        }

        this.animatePlayer();
        this.updateShield();
        this.projectiles = this.projectiles.filter(p => p.update());

        // Generic vertical grounding check for anything in collidables too
        // (Treat anything with a top as a platform if we are above it)
        collidables.forEach(obj => {
            const dx = this.group.position.x - obj.position.x;
            const dz = this.group.position.z - obj.position.z;
            const distSq = (dx * dx) + (dz * dz);
            const minCenteredDist = this.radius + (obj.userData.radius || 1);
            
            // Only push if we are NOT significantly above the object (horizontal collision)
            const isAbove = this.group.position.y > (obj.position.y + (obj.userData.height || 2));
            if (distSq > 0.0001 && distSq < (minCenteredDist * minCenteredDist) && !isAbove) {
                const dist = Math.sqrt(distSq);
                const pushDir = this._tempPushDir.set(dx / dist, 0, dz / dist);
                const overlap = minCenteredDist - dist;
                this.group.position.addScaledVector(pushDir, overlap);
            }
        });

        const gravity = this.baseGravity * this.modifiers.gravityMult;
        this.velocity.y += gravity;
        this.group.position.y += this.velocity.y;

        let onGround = false;
        const checkGroundable = (plat) => {
            this._tempBox.setFromObject(plat);
            const box = this._tempBox;
            // Allow a bit of cushion for grounding
            if (this.velocity.y <= 0 && 
                this.group.position.x > box.min.x - 0.2 && this.group.position.x < box.max.x + 0.2 &&
                this.group.position.z > box.min.z - 0.2 && this.group.position.z < box.max.z + 0.2) {
                if (prevPos.y >= box.max.y - 0.1 && this.group.position.y <= box.max.y) {
                    if (this.velocity.y < -0.1) {
                        this.playLandSound();
                    }
                    this.group.position.y = box.max.y;
                    this.velocity.y = 0;
                    this.jumpCount = 0;
                    onGround = true;
                }
            }
        };
        platforms.forEach(checkGroundable);
        if (!onGround) collidables.forEach(checkGroundable);

        if (!onGround && this.group.position.y < 0) {
            if (this.velocity.y < -0.1) {
                this.playLandSound();
            }
            this.group.position.y = 0;
            this.velocity.y = 0;
            this.jumpCount = 0;
            onGround = true;
        }
    }
}
