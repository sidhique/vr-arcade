import * as THREE from 'three';
import { playSound, buildMeadowLandscape } from './shared.js';

export const bubblePopGame = {
    name: 'Rainbow Bubbles (Meadow)',
    cameraSetup: { position: [0, 1.6, 0], defaultPitch: 0 },
    init(scene, camera) {
        const env = buildMeadowLandscape(scene, 0x90e0ef, 0x52b788, 0);
        const group = new THREE.Group();
        scene.add(group);

        const cursor = new THREE.Mesh(
            new THREE.RingGeometry(0.09, 0.13, 32),
            new THREE.MeshBasicMaterial({ color: 0xffffff, side: THREE.DoubleSide })
        );
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

        return {
            update(dt, input, state) {
                env.update(dt);
                if (state.paused) return { score };
                cursor.position.x = THREE.MathUtils.clamp(cursor.position.x + input.x * dt * 3, -2.5, 2.5);
                cursor.position.y = THREE.MathUtils.clamp(cursor.position.y + input.y * dt * 3, -1.8, 1.8);

                const worldTarget = new THREE.Vector3();
                cursor.getWorldPosition(worldTarget);
                raycaster.set(camera.position, worldTarget.sub(camera.position).normalize());

                bubbles.forEach((b) => {
                    b.position.y += dt * (0.5 * state.speedMultiplier);
                    b.scale.setScalar(1);
                    if (b.position.y > 4.6) b.position.y = 0.5;
                });

                const hits = raycaster.intersectObjects(bubbles);
                if (hits.length > 0) {
                    const hit = hits[0].object;
                    hit.scale.setScalar(1.2);
                    if (input.actionPressed) {
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
                camera.remove(cursor);
                scene.remove(group);
                geo.dispose();
            }
        };
    }
};