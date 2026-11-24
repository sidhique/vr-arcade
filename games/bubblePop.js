import * as THREE from 'three';
import { playSound, buildMeadowLandscape, createFloatingScoreboard } from './shared.js';

export const bubblePopGame = {
    name: 'Rainbow Bubbles (Meadow)',
    cameraSetup: { position: [0, 1.6, 0], defaultPitch: 0 },
    init(scene, camera) {
        const env = buildMeadowLandscape(scene, 0x90e0ef, 0x52b788, 0);
        const group = new THREE.Group();
        scene.add(group);

        const scoreboard = createFloatingScoreboard({
            title: 'RAINBOW BUBBLES',
            theme: 'meadow',
            position: [0, 3.4, -4.8],
            rotation: [0.22, 0, 0],
            scale: 0.95
        });
        group.add(scoreboard.group);

        // High-contrast VR reticle: rendered on top of all 3D geometry and panels
        const cursor = new THREE.Group();
        cursor.renderOrder = 9999;

        const shadowRing = new THREE.Mesh(
            new THREE.RingGeometry(0.075, 0.14, 32),
            new THREE.MeshBasicMaterial({
                color: 0x000000,
                side: THREE.DoubleSide,
                transparent: true,
                opacity: 0.65,
                depthTest: false,
                depthWrite: false
            })
        );
        shadowRing.renderOrder = 9998;
        cursor.add(shadowRing);

        const outerRing = new THREE.Mesh(
            new THREE.RingGeometry(0.09, 0.13, 32),
            new THREE.MeshBasicMaterial({
                color: 0xffffff,
                side: THREE.DoubleSide,
                transparent: true,
                depthTest: false,
                depthWrite: false
            })
        );
        outerRing.renderOrder = 9999;
        cursor.add(outerRing);

        const centerDot = new THREE.Mesh(
            new THREE.CircleGeometry(0.018, 16),
            new THREE.MeshBasicMaterial({
                color: 0xffffff,
                side: THREE.DoubleSide,
                transparent: true,
                depthTest: false,
                depthWrite: false
            })
        );
        centerDot.renderOrder = 9999;
        cursor.add(centerDot);

        cursor.position.set(0, 0, -4);
        camera.add(cursor);

        const bubbles = [];
        const geo = new THREE.SphereGeometry(0.55, 24, 24);
        for (let i = 0; i < 12; i++) {
            const mat = new THREE.MeshStandardMaterial({
                color: new THREE.Color().setHSL(i / 12, 0.85, 0.6),
                roughness: 0.15,
                metalness: 0.1,
                transparent: true,
                opacity: 0.88
            });
            const b = new THREE.Mesh(geo, mat);
            b.position.set(
                (Math.random() - 0.5) * 7,
                0.8 + Math.random() * 3.2,
                -5 - Math.random() * 4
            );
            group.add(b);
            bubbles.push(b);
        }

        const raycaster = new THREE.Raycaster();
        let score = 0;
        let prevAction = false;
        let currentScale = 0.68;

        return {
            update(dt, input, state) {
                env.update(dt);

                cursor.position.x = THREE.MathUtils.clamp(cursor.position.x + input.x * dt * 3, -2.5, 2.5);
                cursor.position.y = THREE.MathUtils.clamp(cursor.position.y + input.y * dt * 3, -1.8, 1.8);

                const worldTarget = new THREE.Vector3();
                cursor.getWorldPosition(worldTarget);
                raycaster.set(camera.position, worldTarget.sub(camera.position).normalize());

                const justPressed = input.actionPressed && !prevAction;
                prevAction = input.actionPressed;

                const sbResult = scoreboard.update(score, state, raycaster, justPressed);

                const isHoverTarget = sbResult.isHoveringPause || hits.length > 0;
                const reticleColor = isHoverTarget ? 0xffd700 : 0xffffff;
                outerRing.material.color.setHex(reticleColor);
                centerDot.material.color.setHex(reticleColor);

                const targetScale = isHoverTarget ? 1.22 : 0.68;
                currentScale = THREE.MathUtils.lerp(currentScale, targetScale, Math.min(dt * 16, 1.0));
                cursor.scale.setScalar(currentScale);

                if (state.paused) {
                    return { score };
                }

                bubbles.forEach((b) => {
                    b.position.y += dt * (0.5 * state.speedMultiplier);
                    b.scale.setScalar(1);
                    if (b.position.y > 4.6) b.position.y = 0.5;
                });

                if (hits.length > 0 && !sbResult.isHoveringPause) {
                    const hit = hits[0].object;
                    hit.scale.setScalar(1.2);
                    if (justPressed) {
                        hit.position.y = 0.5;
                        hit.position.x = (Math.random() - 0.5) * 7;
                        score += 5;
                        playSound('pop');
                    }
                }

                return { score };
            },
            dispose() {
                env.dispose();
                scoreboard.dispose();
                camera.remove(cursor);
                scene.remove(group);
                geo.dispose();
            }
        };
    }
};