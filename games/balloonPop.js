import * as THREE from 'three';
import { playSound, buildPlaygroundLandscape } from './shared.js';

export const balloonPopGame = {
    name: 'Ball Pop Booth (Playground)',
    cameraSetup: { position: [0, 2.65, 0], defaultPitch: -0.58 },
    init(scene, camera) {
        const env = buildPlaygroundLandscape(scene);
        const group = new THREE.Group();
        scene.add(group);

        const tableGroup = new THREE.Group();
        tableGroup.position.set(0, 0, -3.55);
        group.add(tableGroup);

        const BOX_W = 4.4;
        const BOX_D = 4.2;
        const BOX_H = 0.52;
        const TOP_THICKNESS = 0.26;
        const HOLE_RADIUS = 0.52;

        const cols = [-1.32, 0.0, 1.32];
        const rows = [1.26, 0.0, -1.26];

        const woodMat = new THREE.MeshStandardMaterial({ color: 0xc87d32, roughness: 0.75 });
        const baseWalls = new THREE.Mesh(new THREE.BoxGeometry(BOX_W, BOX_H, BOX_D), woodMat);
        baseWalls.position.y = BOX_H / 2;
        tableGroup.add(baseWalls);

        const dirtFloor = new THREE.Mesh(
            new THREE.PlaneGeometry(BOX_W - 0.25, BOX_D - 0.25),
            new THREE.MeshStandardMaterial({ color: 0x7c5c32, roughness: 1.0 })
        );
        dirtFloor.rotation.x = -Math.PI / 2;
        dirtFloor.position.y = BOX_H + 0.01;
        tableGroup.add(dirtFloor);

        const deckW = BOX_W - 0.24;
        const deckD = BOX_D - 0.24;
        const deckShape = new THREE.Shape();
        deckShape.moveTo(-deckW / 2, -deckD / 2);
        deckShape.lineTo(deckW / 2, -deckD / 2);
        deckShape.lineTo(deckW / 2, deckD / 2);
        deckShape.lineTo(-deckW / 2, deckD / 2);
        deckShape.closePath();

        const holeLocalPositions = [];
        rows.forEach((z) => {
            cols.forEach((x) => {
                const holePath = new THREE.Path();
                holePath.absarc(x, -z, HOLE_RADIUS, 0, Math.PI * 2, true);
                deckShape.holes.push(holePath);
                holeLocalPositions.push([x, BOX_H + 0.02, z]);
            });
        });

        const deckGeo = new THREE.ExtrudeGeometry(deckShape, {
            depth: TOP_THICKNESS,
            bevelEnabled: true,
            bevelThickness: 0.03,
            bevelSize: 0.03,
            bevelSegments: 2,
            curveSegments: 28
        });
        deckGeo.rotateX(-Math.PI / 2);

        const coralTop = new THREE.Mesh(
            deckGeo,
            new THREE.MeshStandardMaterial({ color: 0xe85d56, roughness: 0.55 })
        );
        coralTop.position.y = BOX_H;
        tableGroup.add(coralTop);

        // Crosshair always rendered on top
        const cursor = new THREE.Group();
        cursor.renderOrder = 999;
        const outerRing = new THREE.Mesh(
            new THREE.RingGeometry(0.085, 0.125, 32),
            new THREE.MeshBasicMaterial({
                color: 0x00ff88,
                side: THREE.DoubleSide,
                depthTest: false,
                depthWrite: false
            })
        );
        outerRing.renderOrder = 999;
        cursor.add(outerRing);
        cursor.position.set(0, 0, -3.5);
        camera.add(cursor);

        // 3D Wooden Mallet — hidden until user hits a ball
        const malletPivot = new THREE.Group();
        malletPivot.visible = false;
        tableGroup.add(malletPivot);

        const mallet = new THREE.Group();
        const handle = new THREE.Mesh(
            new THREE.CylinderGeometry(0.04, 0.05, 0.95, 10),
            new THREE.MeshStandardMaterial({ color: 0xd4a373 })
        );
        handle.position.y = 0.48;
        const head = new THREE.Mesh(
            new THREE.CylinderGeometry(0.22, 0.22, 0.5, 16),
            new THREE.MeshStandardMaterial({ color: 0xe63946, roughness: 0.35 })
        );
        head.rotation.z = Math.PI / 2;
        head.position.y = 0.92;
        mallet.add(handle, head);
        malletPivot.add(mallet);

        // Build 9 Pop-up Balls inside the 9 recessed holes
        const holes = [];
        const surfaceY = BOX_H + TOP_THICKNESS;
        const BALL_RADIUS = 0.4;
        const ballGeo = new THREE.SphereGeometry(BALL_RADIUS, 28, 24);
        const hiddenY = BOX_H - 0.35;
        const upY = surfaceY + 0.12;

        const ballColors = [
            0xff4d6d, 0xffbe0b, 0x3a86ff,
            0x8338ec, 0x06d6a0, 0xfb5607,
            0xff006e, 0xffbe0b, 0x00bbf9
        ];

        holeLocalPositions.forEach((pos, idx) => {
            const isGolden = ballColors[idx] === 0xffbe0b;
            const ballMat = new THREE.MeshStandardMaterial({
                color: ballColors[idx],
                roughness: 0.22,
                metalness: 0.1
            });

            const ball = new THREE.Mesh(ballGeo, ballMat);
            ball.position.set(pos[0], hiddenY, pos[2]);
            ball.visible = false;
            tableGroup.add(ball);

            const hitbox = new THREE.Mesh(
                new THREE.SphereGeometry(0.58, 12, 12),
                new THREE.MeshBasicMaterial({ visible: false })
            );
            hitbox.position.set(pos[0], upY + 0.1, pos[2]);
            hitbox.userData.holeIndex = idx;
            tableGroup.add(hitbox);

            holes.push({
                ball,
                hitbox,
                localPos: pos,
                isGolden
            });
        });

        // Single-ball state machine: exact 5.0-second total visible lifecycle
        const RISE_DURATION = 0.5;
        const HOLD_DURATION = 4.0;
        const FALL_DURATION = 0.5;
        const TOTAL_LIFETIME = RISE_DURATION + HOLD_DURATION + FALL_DURATION; // 5.0 seconds total

        let activeIndex = -1;
        let lastIndex = -1;
        let activePhase = 'waiting'; // 'waiting' | 'active' | 'bursting'
        let phaseTimer = 0.6; // Short initial delay before first ball emerges

        function spawnNextBall() {
            let nextIdx = Math.floor(Math.random() * holes.length);
            if (nextIdx === lastIndex) {
                nextIdx = (nextIdx + 1) % holes.length;
            }
            activeIndex = nextIdx;
            lastIndex = nextIdx;
            activePhase = 'active';
            phaseTimer = 0;

            const h = holes[activeIndex];
            h.ball.position.y = hiddenY;
            h.ball.scale.setScalar(1.0);
            h.ball.visible = true;
        }

        const raycaster = new THREE.Raycaster();
        const hitboxes = holes.map((h) => h.hitbox);
        let score = 0;
        let whackAnimTimer = 0;
        const WHACK_DURATION = 0.25;
        let prevAction = false;

        return {
            update(dt, input, state) {
                env.update(dt);
                if (state.paused) return { score };

                cursor.position.x = THREE.MathUtils.clamp(cursor.position.x + input.x * dt * 3.4, -2.4, 2.4);
                cursor.position.y = THREE.MathUtils.clamp(cursor.position.y + input.y * dt * 2.8, -1.7, 1.7);

                const worldTarget = new THREE.Vector3();
                cursor.getWorldPosition(worldTarget);
                const dir = worldTarget.sub(camera.position).normalize();
                raycaster.set(camera.position, dir);

                const hits = raycaster.intersectObjects(hitboxes);
                const targetedIndex = hits.length > 0 ? hits[0].object.userData.holeIndex : -1;

                if (targetedIndex !== -1) {
                    outerRing.material.color.setHex(0xffd700);
                    cursor.scale.setScalar(1.25);
                } else {
                    outerRing.material.color.setHex(0x00ff88);
                    cursor.scale.setScalar(1.0);
                }

                const justPressed = input.actionPressed && !prevAction;
                prevAction = input.actionPressed;

                // Check hit on the single active ball
                if (justPressed && activePhase === 'active' && targetedIndex === activeIndex) {
                    const h = holes[activeIndex];
                    activePhase = 'bursting';
                    phaseTimer = 0;
                    score += h.isGolden ? 20 : 10;
                    playSound('burst');

                    malletPivot.position.set(h.localPos[0] + 0.22, upY + 0.15, h.localPos[2] + 0.75);
                    malletPivot.visible = true;
                    whackAnimTimer = WHACK_DURATION;
                }

                if (whackAnimTimer > 0) {
                    whackAnimTimer = Math.max(0, whackAnimTimer - dt);
                    const progress = 1 - whackAnimTimer / WHACK_DURATION;
                    mallet.rotation.x = THREE.MathUtils.lerp(-0.3, -1.45, Math.sin(progress * Math.PI * 0.7));
                    if (whackAnimTimer === 0) {
                        malletPivot.visible = false;
                    }
                }

                // Advance single-ball 5-second lifecycle
                const speed = state.speedMultiplier || 1.0;

                if (activePhase === 'waiting') {
                    phaseTimer -= dt * speed;
                    if (phaseTimer <= 0) {
                        spawnNextBall();
                    }
                } else if (activePhase === 'active') {
                    phaseTimer += dt * speed;
                    const h = holes[activeIndex];

                    if (phaseTimer < RISE_DURATION) {
                        // Smooth rise over 0.5s
                        const t = phaseTimer / RISE_DURATION;
                        h.ball.position.y = THREE.MathUtils.lerp(hiddenY, upY, t);
                    } else if (phaseTimer < RISE_DURATION + HOLD_DURATION) {
                        // Held fully visible for 4.0s
                        h.ball.position.y = upY;
                    } else if (phaseTimer < TOTAL_LIFETIME) {
                        // Smooth descent over final 0.5s
                        const t = (phaseTimer - (RISE_DURATION + HOLD_DURATION)) / FALL_DURATION;
                        h.ball.position.y = THREE.MathUtils.lerp(upY, hiddenY, t);
                    } else {
                        // 5.0 seconds elapsed — completely hidden, queue next single ball
                        h.ball.position.y = hiddenY;
                        h.ball.visible = false;
                        activeIndex = -1;
                        activePhase = 'waiting';
                        phaseTimer = 0.5;
                    }

                    if (activeIndex !== -1) {
                        h.ball.scale.setScalar(activeIndex === targetedIndex ? 1.1 : 1.0);
                    }
                } else if (activePhase === 'bursting') {
                    phaseTimer += dt;
                    const h = holes[activeIndex];
                    const popScale = 1.0 + phaseTimer * 4.5;
                    h.ball.scale.setScalar(popScale);

                    if (phaseTimer >= 0.12) {
                        h.ball.visible = false;
                        h.ball.position.y = hiddenY;
                        h.ball.scale.setScalar(1.0);
                        activeIndex = -1;
                        activePhase = 'waiting';
                        phaseTimer = 0.5;
                    }
                }

                return { score };
            },
            dispose() {
                env.dispose();
                camera.remove(cursor);
                scene.remove(group);
                deckGeo.dispose();
                ballGeo.dispose();
            }
        };
    }
};