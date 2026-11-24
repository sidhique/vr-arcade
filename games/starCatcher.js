import * as THREE from 'three';
import { playSound, buildSpaceLandscape } from './shared.js';

export const starCatcherGame = {
    name: 'Star Catcher (Space)',
    cameraSetup: { position: [0, 0, 0], defaultPitch: 0 },
    init(scene, camera) {
        const env = buildSpaceLandscape(scene);
        const group = new THREE.Group();
        scene.add(group);

        const cursor = new THREE.Mesh(
            new THREE.RingGeometry(0.08, 0.12, 32),
            new THREE.MeshBasicMaterial({ color: 0x00ffcc, side: THREE.DoubleSide })
        );
        cursor.position.set(0, 0, -4);
        camera.add(cursor);

        const stars = [];
        const colors = [0xffd700, 0xff6b6b, 0x4ecdc4, 0xffe66d, 0xc77dff];
        const geo = new THREE.OctahedronGeometry(0.45, 0);

        function resetStar(star) {
            star.position.set(
                (Math.random() - 0.5) * 8,
                (Math.random() - 0.3) * 4,
                -5 - Math.random() * 6
            );
        }

        for (let i = 0; i < 12; i++) {
            const mat = new THREE.MeshStandardMaterial({
                color: colors[i % colors.length],
                emissive: colors[i % colors.length],
                emissiveIntensity: 0.45,
                roughness: 0.2
            });
            const star = new THREE.Mesh(geo, mat);
            resetStar(star);
            group.add(star);
            stars.push(star);
        }

        const raycaster = new THREE.Raycaster();
        let score = 0;
        let cooldown = 0;

        return {
            update(dt, input, state) {
                env.update(dt);
                if (state.paused) return { score };
                cooldown = Math.max(0, cooldown - dt);

                cursor.position.x = THREE.MathUtils.clamp(cursor.position.x + input.x * dt * 3, -2.5, 2.5);
                cursor.position.y = THREE.MathUtils.clamp(cursor.position.y + input.y * dt * 3, -1.8, 1.8);

                const worldTarget = new THREE.Vector3();
                cursor.getWorldPosition(worldTarget);
                const dir = worldTarget.sub(camera.position).normalize();
                raycaster.set(camera.position, dir);

                const hits = raycaster.intersectObjects(stars);
                stars.forEach((s) => {
                    s.rotation.y += dt * 1.5;
                    s.rotation.x += dt * 0.8;
                    s.position.y += Math.sin(performance.now() * 0.002 + s.id) * 0.003;
                    s.scale.setScalar(1);
                });

                if (hits.length > 0) {
                    const target = hits[0].object;
                    target.scale.setScalar(1.35);
                    if (input.actionPressed || cooldown === 0) {
                        score += 10;
                        playSound('chime', 440 + (score % 400));
                        resetStar(target);
                        cooldown = 0.35;
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