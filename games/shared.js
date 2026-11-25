import * as THREE from 'three';

let sharedAudioCtx = null;

export function unlockAudio() {
    try {
        if (!sharedAudioCtx) {
            sharedAudioCtx = new (window.AudioContext || window.webkitAudioContext)();
        }
        if (sharedAudioCtx.state === 'suspended') {
            sharedAudioCtx.resume();
        }
    } catch (e) { }
}

export function playSound(type = 'chime', baseFreq = 523.25) {
    try {
        unlockAudio();
        if (!sharedAudioCtx) return;
        const now = sharedAudioCtx.currentTime;

        if (type === 'burst') {
            const bufferSize = Math.floor(sharedAudioCtx.sampleRate * 0.14);
            const buffer = sharedAudioCtx.createBuffer(1, bufferSize, sharedAudioCtx.sampleRate);
            const data = buffer.getChannelData(0);
            for (let i = 0; i < bufferSize; i++) {
                data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.22));
            }

            const noise = sharedAudioCtx.createBufferSource();
            noise.buffer = buffer;

            const filter = sharedAudioCtx.createBiquadFilter();
            filter.type = 'bandpass';
            filter.frequency.setValueAtTime(1400, now);
            filter.Q.setValueAtTime(1.2, now);

            const noiseGain = sharedAudioCtx.createGain();
            noiseGain.gain.setValueAtTime(0.65, now);
            noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.14);

            noise.connect(filter);
            filter.connect(noiseGain);
            noiseGain.connect(sharedAudioCtx.destination);
            noise.start(now);

            const osc = sharedAudioCtx.createOscillator();
            const oscGain = sharedAudioCtx.createGain();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(260, now);
            osc.frequency.exponentialRampToValueAtTime(55, now + 0.09);
            oscGain.gain.setValueAtTime(0.4, now);
            oscGain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);
            osc.connect(oscGain);
            oscGain.connect(sharedAudioCtx.destination);
            osc.start(now);
            osc.stop(now + 0.1);
        } else if (type === 'pop') {
            const osc = sharedAudioCtx.createOscillator();
            const gain = sharedAudioCtx.createGain();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(400, now);
            osc.frequency.exponentialRampToValueAtTime(900, now + 0.12);
            gain.gain.setValueAtTime(0.25, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.14);
            osc.connect(gain);
            gain.connect(sharedAudioCtx.destination);
            osc.start(now);
            osc.stop(now + 0.14);
        } else if (type === 'miss') {
            const osc = sharedAudioCtx.createOscillator();
            const gain = sharedAudioCtx.createGain();
            osc.type = 'triangle';
            osc.frequency.setValueAtTime(650, now);
            osc.frequency.exponentialRampToValueAtTime(180, now + 0.35);

            gain.gain.setValueAtTime(0.01, now);
            gain.gain.linearRampToValueAtTime(0.38, now + 0.04);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.36);

            osc.connect(gain);
            gain.connect(sharedAudioCtx.destination);
            osc.start(now);
            osc.stop(now + 0.36);

            const sub = sharedAudioCtx.createOscillator();
            const subGain = sharedAudioCtx.createGain();
            sub.type = 'sine';
            sub.frequency.setValueAtTime(325, now);
            sub.frequency.exponentialRampToValueAtTime(90, now + 0.35);

            subGain.gain.setValueAtTime(0.01, now);
            subGain.gain.linearRampToValueAtTime(0.24, now + 0.04);
            subGain.gain.exponentialRampToValueAtTime(0.001, now + 0.36);

            sub.connect(subGain);
            subGain.connect(sharedAudioCtx.destination);
            sub.start(now);
            sub.stop(now + 0.36);
        } else if (type === 'whoosh') {
            const bufferSize = Math.floor(sharedAudioCtx.sampleRate * 0.12);
            const buffer = sharedAudioCtx.createBuffer(1, bufferSize, sharedAudioCtx.sampleRate);
            const data = buffer.getChannelData(0);
            for (let i = 0; i < bufferSize; i++) {
                data[i] = (Math.random() * 2 - 1) * Math.sin((i / bufferSize) * Math.PI);
            }

            const noise = sharedAudioCtx.createBufferSource();
            noise.buffer = buffer;

            const filter = sharedAudioCtx.createBiquadFilter();
            filter.type = 'lowpass';
            filter.frequency.setValueAtTime(900, now);
            filter.frequency.exponentialRampToValueAtTime(250, now + 0.12);

            const gain = sharedAudioCtx.createGain();
            gain.gain.setValueAtTime(0.28, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);

            noise.connect(filter);
            filter.connect(gain);
            gain.connect(sharedAudioCtx.destination);
            noise.start(now);
        } else {
            const osc = sharedAudioCtx.createOscillator();
            const gain = sharedAudioCtx.createGain();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(baseFreq, now);
            osc.frequency.exponentialRampToValueAtTime(baseFreq * 1.5, now + 0.25);
            gain.gain.setValueAtTime(0.2, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
            osc.connect(gain);
            gain.connect(sharedAudioCtx.destination);
            osc.start(now);
            osc.stop(now + 0.3);
        }
    } catch (e) { }
}

export function buildPlaygroundLandscape(scene) {
    const skyColor = 0x6ec1f7;
    scene.background = new THREE.Color(skyColor);
    scene.fog = new THREE.FogExp2(0x8ad3ff, 0.007);

    const envGroup = new THREE.Group();
    scene.add(envGroup);

    // Dynamic Faceted Lighting with Upper-Left Diagonal Shadows
    const hemiLight = new THREE.HemisphereLight(0xfff7e6, 0x5a3d28, 1.15);
    hemiLight.position.set(0, 25, 0);

    const sunLight = new THREE.DirectionalLight(0xfff1cf, 1.65);
    sunLight.position.set(-15, 22, 8);
    sunLight.castShadow = true;
    sunLight.shadow.mapSize.width = 2048;
    sunLight.shadow.mapSize.height = 2048;
    sunLight.shadow.camera.near = 1;
    sunLight.shadow.camera.far = 65;
    sunLight.shadow.camera.left = -15;
    sunLight.shadow.camera.right = 15;
    sunLight.shadow.camera.top = 15;
    sunLight.shadow.camera.bottom = -15;
    sunLight.shadow.bias = -0.0005;

    const fillLight = new THREE.DirectionalLight(0x9bd8ff, 0.45);
    fillLight.position.set(14, 16, -10);

    envGroup.add(hemiLight, sunLight, fillLight);

    // 1. Ground & Courts
    const court = new THREE.Mesh(
        new THREE.CircleGeometry(13.5, 48),
        new THREE.MeshStandardMaterial({ color: 0xdf7a28, roughness: 0.85 })
    );
    court.rotation.x = -Math.PI / 2;
    court.receiveShadow = true;
    envGroup.add(court);

    const outerLawn = new THREE.Mesh(
        new THREE.RingGeometry(13.2, 55, 48),
        new THREE.MeshStandardMaterial({ color: 0x489d2c, roughness: 0.9 })
    );
    outerLawn.rotation.x = -Math.PI / 2;
    outerLawn.position.y = -0.01;
    outerLawn.receiveShadow = true;
    envGroup.add(outerLawn);

    const curb = new THREE.Mesh(
        new THREE.RingGeometry(17.8, 18.5, 48),
        new THREE.MeshStandardMaterial({ color: 0x94a3b8, roughness: 0.7 })
    );
    curb.rotation.x = -Math.PI / 2;
    curb.position.y = 0.02;
    curb.receiveShadow = true;
    envGroup.add(curb);

    const road = new THREE.Mesh(
        new THREE.RingGeometry(18.5, 25.5, 48),
        new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.8 })
    );
    road.rotation.x = -Math.PI / 2;
    road.position.y = 0.01;
    road.receiveShadow = true;
    envGroup.add(road);

    // 2. Multi-Colored Playground Fence
    const fenceRadius = 11.2;
    const slatCount = 76;
    const fenceColors = [0xff4d4d, 0xffbe0b, 0x3a86ff, 0x2ec4b6, 0xff70a6, 0x8ac926];
    const slatGeo = new THREE.BoxGeometry(0.32, 1.35, 0.1);
    const railGeo = new THREE.BoxGeometry(0.95, 0.12, 0.08);
    const railMat = new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.5 });

    for (let i = 0; i < slatCount; i++) {
        const angle = (i / slatCount) * Math.PI * 2;
        const slatMat = new THREE.MeshStandardMaterial({
            color: fenceColors[i % fenceColors.length],
            roughness: 0.55
        });
        const slat = new THREE.Mesh(slatGeo, slatMat);
        slat.position.set(Math.cos(angle) * fenceRadius, 0.68, Math.sin(angle) * fenceRadius);
        slat.lookAt(0, 0.68, 0);
        slat.castShadow = true;
        slat.receiveShadow = true;
        envGroup.add(slat);

        if (i % 2 === 0) {
            const rail = new THREE.Mesh(railGeo, railMat);
            rail.position.set(Math.cos(angle) * (fenceRadius + 0.06), 0.75, Math.sin(angle) * (fenceRadius + 0.06));
            rail.lookAt(0, 0.75, 0);
            rail.castShadow = true;
            envGroup.add(rail);
        }
    }

    // 3. Central Sandbox with Striped Parasol & Clustered Soil Pebbles
    const sandboxGroup = new THREE.Group();
    sandboxGroup.position.set(0, 0, -9.2);
    envGroup.add(sandboxGroup);

    const sandPit = new THREE.Mesh(
        new THREE.BoxGeometry(2.7, 0.32, 2.7),
        new THREE.MeshStandardMaterial({ color: 0x9b5de5, roughness: 0.65 })
    );
    sandPit.position.y = 0.16;
    sandPit.castShadow = true;
    sandPit.receiveShadow = true;

    const sandFill = new THREE.Mesh(
        new THREE.BoxGeometry(2.35, 0.34, 2.35),
        new THREE.MeshStandardMaterial({ color: 0xf4d58d, roughness: 0.95 })
    );
    sandFill.position.y = 0.17;
    sandFill.receiveShadow = true;

    const pole = new THREE.Mesh(
        new THREE.CylinderGeometry(0.07, 0.07, 2.9, 10),
        new THREE.MeshStandardMaterial({ color: 0x00bbf9, roughness: 0.4 })
    );
    pole.position.y = 1.45;
    pole.castShadow = true;

    const canopyGroup = new THREE.Group();
    canopyGroup.position.y = 2.85;
    const stripeCount = 8;
    const stripeColors = [0x00bbf9, 0xff2a85];
    const stripeAngle = (Math.PI * 2) / stripeCount;
    for (let s = 0; s < stripeCount; s++) {
        const wedge = new THREE.Mesh(
            new THREE.ConeGeometry(1.65, 0.82, 6, 1, false, s * stripeAngle, stripeAngle),
            new THREE.MeshStandardMaterial({
                color: stripeColors[s % 2],
                roughness: 0.45,
                flatShading: true
            })
        );
        wedge.castShadow = true;
        canopyGroup.add(wedge);
    }
    sandboxGroup.add(sandPit, sandFill, pole, canopyGroup);

    const pebbleGeo = new THREE.DodecahedronGeometry(0.14, 0);
    const pebbleMat = new THREE.MeshStandardMaterial({
        color: 0x2b1509,
        roughness: 0.9,
        flatShading: true
    });
    const pebbleOffsets = [
        [1.8, -0.6], [2.1, -0.3], [1.9, 0.4], [2.3, 0.2],
        [-1.7, -0.4], [-2.0, 0.2], [1.5, 1.1], [2.4, -0.9],
        [1.7, -0.2], [2.2, 0.8]
    ];
    pebbleOffsets.forEach(([ox, oz], pIdx) => {
        const pebble = new THREE.Mesh(pebbleGeo, pebbleMat);
        const scale = 0.6 + (pIdx % 4) * 0.25;
        pebble.scale.set(scale, scale * 0.65, scale);
        pebble.position.set(ox, 0.04, -9.2 + oz);
        pebble.rotation.set(pIdx * 0.4, pIdx * 0.7, 0);
        pebble.castShadow = true;
        pebble.receiveShadow = true;
        envGroup.add(pebble);
    });

    // 4. Park Benches
    function createParkBench(x, z, rotY) {
        const benchGroup = new THREE.Group();
        benchGroup.position.set(x, 0, z);
        benchGroup.rotation.y = rotY;

        const slatMat = new THREE.MeshStandardMaterial({ color: 0xb0652e, roughness: 0.6 });
        const metalMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.5, metalness: 0.6 });

        for (let s = 0; s < 3; s++) {
            const slat = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.06, 0.14), slatMat);
            slat.position.set(0, 0.44, -0.14 + s * 0.16);
            slat.castShadow = true;
            benchGroup.add(slat);
        }
        for (let b = 0; b < 2; b++) {
            const bSlat = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.14, 0.05), slatMat);
            bSlat.position.set(0, 0.68 + b * 0.18, -0.26);
            bSlat.castShadow = true;
            benchGroup.add(bSlat);
        }
        [-0.65, 0.65].forEach((lx) => {
            const leg = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.44, 0.52), metalMat);
            leg.position.set(lx, 0.22, 0);
            leg.castShadow = true;
            const arm = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.38, 0.08), metalMat);
            arm.position.set(lx, 0.63, -0.24);
            arm.castShadow = true;
            benchGroup.add(leg, arm);
        });

        envGroup.add(benchGroup);
    }
    createParkBench(-3.4, -8.8, 0.22);
    createParkBench(3.4, -8.8, -0.22);

    // 5. Faceted Low-Poly Trees
    const trunkMat = new THREE.MeshStandardMaterial({ color: 0x5c3a21, roughness: 0.9, flatShading: true });
    const trunkGeo = new THREE.CylinderGeometry(0.22, 0.34, 1.8, 6);

    const pineMat = new THREE.MeshStandardMaterial({ color: 0x2d6a4f, roughness: 0.7, flatShading: true });
    const leafMatA = new THREE.MeshStandardMaterial({ color: 0x8ac926, roughness: 0.65, flatShading: true });
    const leafMatB = new THREE.MeshStandardMaterial({ color: 0xaacc00, roughness: 0.65, flatShading: true });

    for (let i = 0; i < 28; i++) {
        const angle = (i / 28) * Math.PI * 2 + 0.06;
        const dist = 14.2 + (i % 3) * 3.6;
        const treeGroup = new THREE.Group();

        const trunk = new THREE.Mesh(trunkGeo, trunkMat);
        trunk.position.y = 0.9;
        trunk.castShadow = true;
        treeGroup.add(trunk);

        if (i % 2 === 0) {
            const c1 = new THREE.Mesh(new THREE.ConeGeometry(1.4, 1.5, 6, 1), pineMat);
            c1.position.y = 2.1;
            const c2 = new THREE.Mesh(new THREE.ConeGeometry(1.15, 1.35, 6, 1), pineMat);
            c2.position.y = 2.95;
            const c3 = new THREE.Mesh(new THREE.ConeGeometry(0.85, 1.15, 6, 1), pineMat);
            c3.position.y = 3.85;
            [c1, c2, c3].forEach((c) => { c.castShadow = true; });
            treeGroup.add(c1, c2, c3);
        } else {
            const mat = (i % 4 === 1) ? leafMatA : leafMatB;
            const mainCrown = new THREE.Mesh(new THREE.DodecahedronGeometry(1.25, 0), mat);
            mainCrown.position.y = 2.5;

            const subCrown1 = new THREE.Mesh(new THREE.DodecahedronGeometry(0.95, 0), mat);
            subCrown1.position.set(0.4, 2.9, 0.3);
            const subCrown2 = new THREE.Mesh(new THREE.DodecahedronGeometry(0.85, 0), mat);
            subCrown2.position.set(-0.4, 2.7, -0.3);

            [mainCrown, subCrown1, subCrown2].forEach((c) => { c.castShadow = true; });
            treeGroup.add(mainCrown, subCrown1, subCrown2);
        }

        treeGroup.position.set(Math.cos(angle) * dist, 0, Math.sin(angle) * dist);
        treeGroup.scale.setScalar(0.95 + (i % 3) * 0.22);
        envGroup.add(treeGroup);
    }

    // 6. Street Lamps along the Perimeter Road
    const lampMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.4, metalness: 0.7 });
    const bulbGlowMat = new THREE.MeshStandardMaterial({ color: 0xfff3b0, emissive: 0xffe66d, emissiveIntensity: 0.6 });
    for (let l = 0; l < 8; l++) {
        const lAngle = (l / 8) * Math.PI * 2 + 0.18;
        const lampGroup = new THREE.Group();
        lampGroup.position.set(Math.cos(lAngle) * 18.2, 0, Math.sin(lAngle) * 18.2);
        lampGroup.lookAt(0, 0, 0);

        const lPole = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.07, 3.8, 6), lampMat);
        lPole.position.y = 1.9;
        lPole.castShadow = true;
        const lArm = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.06, 0.6), lampMat);
        lArm.position.set(0, 3.75, 0.25);
        const lHead = new THREE.Mesh(new THREE.ConeGeometry(0.18, 0.25, 6), lampMat);
        lHead.position.set(0, 3.65, 0.5);
        lHead.rotation.x = Math.PI;
        const lBulb = new THREE.Mesh(new THREE.SphereGeometry(0.09, 8, 8), bulbGlowMat);
        lBulb.position.set(0, 3.52, 0.5);

        lampGroup.add(lPole, lArm, lHead, lBulb);
        envGroup.add(lampGroup);
    }

    // 7. Parked Low-Poly Car on the Right Roadway
    const carGroup = new THREE.Group();
    carGroup.position.set(13.8, 0.4, -14.2);
    carGroup.rotation.y = 0.52;

    const carBodyMat = new THREE.MeshStandardMaterial({ color: 0xd90429, roughness: 0.35, flatShading: true });
    const carGlassMat = new THREE.MeshStandardMaterial({ color: 0x90e0ef, roughness: 0.1, metalness: 0.3, flatShading: true });
    const wheelMat = new THREE.MeshStandardMaterial({ color: 0x111827, roughness: 0.8 });

    const chassis = new THREE.Mesh(new THREE.BoxGeometry(3.2, 0.65, 1.5), carBodyMat);
    chassis.position.y = 0.35;
    chassis.castShadow = true;
    const cabin = new THREE.Mesh(new THREE.BoxGeometry(1.7, 0.6, 1.35), carGlassMat);
    cabin.position.set(-0.2, 0.88, 0);
    cabin.castShadow = true;

    const wheelGeo = new THREE.CylinderGeometry(0.3, 0.3, 0.22, 12);
    wheelGeo.rotateZ(Math.PI / 2);
    [[-1.0, -0.75], [1.0, -0.75], [-1.0, 0.75], [1.0, 0.75]].forEach(([wx, wz]) => {
        const wheel = new THREE.Mesh(wheelGeo, wheelMat);
        wheel.position.set(wx, 0.25, wz);
        wheel.castShadow = true;
        carGroup.add(wheel);
    });
    carGroup.add(chassis, cabin);
    envGroup.add(carGroup);

    // 8. Low-Poly Stylized Drifting Clouds
    const cloudMat = new THREE.MeshStandardMaterial({
        color: 0xffffff,
        roughness: 0.7,
        flatShading: true
    });
    const clouds = [];
    for (let c = 0; c < 7; c++) {
        const cloudGroup = new THREE.Group();
        const baseSize = 1.4 + (c % 3) * 0.4;
        const partCount = 4 + (c % 3);
        for (let p = 0; p < partCount; p++) {
            const part = new THREE.Mesh(
                new THREE.DodecahedronGeometry(baseSize * (0.65 + (p % 3) * 0.22), 0),
                cloudMat
            );
            part.position.set((p - partCount / 2) * baseSize * 0.75, Math.sin(p) * 0.3, (p % 2) * 0.4);
            cloudGroup.add(part);
        }
        cloudGroup.position.set(
            (Math.random() - 0.5) * 60,
            16 + Math.random() * 8,
            -20 - Math.random() * 40
        );
        envGroup.add(cloudGroup);
        clouds.push(cloudGroup);
    }

    return {
        update(dt) {
            clouds.forEach((cloud) => {
                cloud.position.x += dt * 0.5;
                if (cloud.position.x > 38) cloud.position.x = -38;
            });
        },
        dispose() {
            scene.fog = null;
            scene.remove(envGroup);
        }
    };
}

export function buildMeadowLandscape(scene, skyColor = 0x87ceeb, groundColor = 0x4caf50, groundY = 0) {
    scene.background = new THREE.Color(skyColor);
    scene.fog = new THREE.FogExp2(skyColor, 0.013);

    const envGroup = new THREE.Group();
    scene.add(envGroup);

    const hemiLight = new THREE.HemisphereLight(0xffffff, 0x3b7a57, 1.05);
    hemiLight.position.set(0, 20, 0);
    const sunLight = new THREE.DirectionalLight(0xfff5d6, 1.35);
    sunLight.position.set(15, 25, 10);
    envGroup.add(hemiLight, sunLight);

    const ground = new THREE.Mesh(
        new THREE.CircleGeometry(90, 48),
        new THREE.MeshStandardMaterial({ color: groundColor, roughness: 0.9 })
    );
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = groundY;
    envGroup.add(ground);

    const hillMat = new THREE.MeshStandardMaterial({ color: 0x388e3c, roughness: 0.95 });
    for (let i = 0; i < 18; i++) {
        const angle = (i / 18) * Math.PI * 2;
        const dist = 36 + (i % 3) * 5;
        const radius = 8 + (i % 4) * 3;
        const hill = new THREE.Mesh(new THREE.SphereGeometry(radius, 16, 12), hillMat);
        hill.scale.set(1.4, 0.75, 1.4);
        hill.position.set(Math.cos(angle) * dist, groundY - 0.8, Math.sin(angle) * dist);
        envGroup.add(hill);
    }

    return {
        update() { },
        dispose() {
            scene.fog = null;
            scene.remove(envGroup);
        }
    };
}

export function buildSpaceLandscape(scene) {
    scene.background = new THREE.Color(0x050816);
    scene.fog = new THREE.FogExp2(0x050816, 0.012);

    const envGroup = new THREE.Group();
    scene.add(envGroup);

    const ambient = new THREE.AmbientLight(0xffffff, 0.9);
    const pointLight = new THREE.PointLight(0xffdd88, 2.2, 60);
    pointLight.position.set(5, 10, 5);
    envGroup.add(ambient, pointLight);

    const grid = new THREE.GridHelper(80, 40, 0x38bdf8, 0x1e293b);
    grid.position.y = -2.2;
    envGroup.add(grid);

    const planet = new THREE.Mesh(
        new THREE.SphereGeometry(3.2, 24, 24),
        new THREE.MeshStandardMaterial({ color: 0xf59e0b, roughness: 0.6 })
    );
    planet.position.set(-14, 7, -32);
    envGroup.add(planet);

    return {
        update(dt) {
            planet.rotation.y += dt * 0.1;
        },
        dispose() {
            scene.fog = null;
            scene.remove(envGroup);
        }
    };
}

export function createFloatingScoreboard({
    title = 'ARCADE',
    theme = 'carnival',
    position = [0, 3.2, -4.5],
    rotation = [0.2, 0, 0],
    scale = 1.0,
    accentColor = null,
    frameColor = null
} = {}) {
    const THEMES = {
        carnival: {
            frameColor: 0x8b4513,
            bevelColor: 0xd4a373,
            accentColor: 0xffb703,
            bulbColor: 0xffd166,
            bgGradient: ['#281008', '#120502'],
            cardBg: 'rgba(255, 255, 255, 0.08)',
            cardBorder: '#d4a373',
            scoreColor: '#ffd166',
            scoreGlow: '#fb8500',
            titleColor: '#ffe8d6',
            pauseBg: '#9e2a2b',
            pauseBorder: '#ff4d6d'
        },
        space: {
            frameColor: 0x0f172a,
            bevelColor: 0x334155,
            accentColor: 0x00f5d4,
            bulbColor: 0x7b2cbf,
            bgGradient: ['#030712', '#0b132b'],
            cardBg: 'rgba(0, 245, 212, 0.08)',
            cardBorder: '#00f5d4',
            scoreColor: '#00f5d4',
            scoreGlow: '#00bb9c',
            titleColor: '#70e000',
            pauseBg: '#3a0ca3',
            pauseBorder: '#4cc9f0'
        },
        meadow: {
            frameColor: 0x2d6a4f,
            bevelColor: 0x52b788,
            accentColor: 0xffd166,
            bulbColor: 0x90e0ef,
            bgGradient: ['#081c15', '#1b4332'],
            cardBg: 'rgba(255, 255, 255, 0.08)',
            cardBorder: '#74c69d',
            scoreColor: '#ffe49e',
            scoreGlow: '#f3c053',
            titleColor: '#d8f3dc',
            pauseBg: '#b7094c',
            pauseBorder: '#ff758f'
        }
    };

    const cfg = { ...(THEMES[theme] || THEMES.carnival) };
    if (accentColor !== null) cfg.accentColor = accentColor;
    if (frameColor !== null) cfg.frameColor = frameColor;

    const group = new THREE.Group();
    group.position.set(...position);
    group.rotation.set(...rotation);
    group.scale.setScalar(scale);

    const shape = new THREE.Shape();
    const w = 2.4, h = 1.25, r = 0.22;
    shape.moveTo(-w / 2 + r, -h / 2);
    shape.lineTo(w / 2 - r, -h / 2);
    shape.quadraticCurveTo(w / 2, -h / 2, w / 2, -h / 2 + r);
    shape.lineTo(w / 2, h / 2 - r * 1.5);
    shape.quadraticCurveTo(w / 2, h / 2 - 0.05, w / 2 - 0.2, h / 2 - 0.02);
    shape.quadraticCurveTo(0, h / 2 + 0.22, -w / 2 + 0.2, h / 2 - 0.02);
    shape.quadraticCurveTo(-w / 2, h / 2 - 0.05, -w / 2, h / 2 - r * 1.5);
    shape.lineTo(-w / 2, -h / 2 + r);
    shape.quadraticCurveTo(-w / 2, -h / 2, -w / 2 + r, -h / 2);

    const frameGeo = new THREE.ExtrudeGeometry(shape, {
        depth: 0.07,
        bevelEnabled: true,
        bevelThickness: 0.035,
        bevelSize: 0.035,
        bevelSegments: 3,
        curveSegments: 28
    });
    frameGeo.translate(0, 0, -0.05);

    const frameMat = new THREE.MeshStandardMaterial({
        color: cfg.frameColor,
        roughness: 0.45,
        metalness: 0.25
    });
    const frameMesh = new THREE.Mesh(frameGeo, frameMat);
    group.add(frameMesh);

    const bulbGeo = new THREE.SphereGeometry(0.045, 12, 10);
    const bulbMat = new THREE.MeshStandardMaterial({
        color: cfg.bulbColor,
        emissive: cfg.bulbColor,
        emissiveIntensity: 0.4,
        roughness: 0.2,
        metalness: 0.6
    });

    const numBulbs = 9;
    for (let i = 0; i < numBulbs; i++) {
        const t = (i / (numBulbs - 1)) * 2 - 1;
        const bx = t * (w / 2 - 0.22);
        const by = h / 2 + (1 - t * t) * 0.22 - 0.02;
        const bulb = new THREE.Mesh(bulbGeo, bulbMat);
        bulb.position.set(bx, by, 0.06);
        group.add(bulb);
    }

    const canvas = document.createElement('canvas');
    canvas.width = 1024;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');

    const texture = new THREE.CanvasTexture(canvas);
    texture.minFilter = THREE.LinearFilter;
    texture.magFilter = THREE.LinearFilter;

    const faceMat = new THREE.MeshStandardMaterial({
        map: texture,
        transparent: true,
        roughness: 0.4,
        metalness: 0.1,
        emissive: 0xffffff,
        emissiveMap: texture,
        emissiveIntensity: 0.45
    });
    const faceGeo = new THREE.PlaneGeometry(2.18, 1.15);
    const faceMesh = new THREE.Mesh(faceGeo, faceMat);
    faceMesh.position.set(0, -0.01, 0.056);
    group.add(faceMesh);

    const pauseHitbox = new THREE.Mesh(
        new THREE.PlaneGeometry(0.92, 0.65),
        new THREE.MeshBasicMaterial({ visible: false })
    );
    pauseHitbox.position.set(0.51, -0.06, 0.08);
    pauseHitbox.userData.isPauseButton = true;
    group.add(pauseHitbox);

    let lastScore = -1;
    let lastPaused = null;
    let lastHovered = false;
    let lastSec = -1;
    let lastRoom = null;
    let lastTimeUp = null;

    function formatTime(seconds) {
        const s = Math.max(0, Math.floor(seconds || 0));
        const mins = Math.floor(s / 60);
        const secs = s % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }

    function drawScoreboard(score, isPaused, isHovered, roomCode = '', timeRemaining = 900, timeUp = false) {
        ctx.clearRect(0, 0, 1024, 512);

        const radius = 32;
        ctx.save();
        ctx.beginPath();
        if (ctx.roundRect) {
            ctx.roundRect(16, 16, 992, 480, radius);
        } else {
            ctx.rect(16, 16, 992, 480);
        }
        ctx.clip();

        const bgGrad = ctx.createLinearGradient(0, 0, 0, 512);
        bgGrad.addColorStop(0, cfg.bgGradient[0]);
        bgGrad.addColorStop(1, cfg.bgGradient[1]);
        ctx.fillStyle = bgGrad;
        ctx.fillRect(0, 0, 1024, 512);

        ctx.strokeStyle = 'rgba(255, 255, 255, 0.04)';
        ctx.lineWidth = 1;
        for (let x = 32; x < 1024; x += 32) {
            ctx.beginPath();
            ctx.moveTo(x, 0);
            ctx.lineTo(x, 512);
            ctx.stroke();
        }

        ctx.strokeStyle = cfg.cardBorder;
        ctx.lineWidth = 4;
        ctx.strokeRect(20, 20, 984, 472);

        ctx.fillStyle = 'rgba(0, 0, 0, 0.45)';
        ctx.fillRect(20, 20, 984, 76);

        ctx.font = 'bold 30px "Segoe UI", system-ui, sans-serif';
        ctx.fillStyle = cfg.titleColor;
        ctx.textAlign = 'left';
        ctx.textBaseline = 'middle';
        ctx.shadowColor = typeof cfg.accentColor === 'number' ? `#${cfg.accentColor.toString(16).padStart(6, '0')}` : cfg.accentColor;
        ctx.shadowBlur = 8;
        ctx.fillText(`★  ${title}`, 44, 58);
        ctx.shadowBlur = 0;

        if (roomCode) {
            const roomBadgeX = 495, roomBadgeY = 38, roomBadgeW = 180, roomBadgeH = 40;
            ctx.fillStyle = 'rgba(255, 255, 255, 0.12)';
            ctx.strokeStyle = '#38bdf8';
            ctx.lineWidth = 2;
            ctx.beginPath();
            if (ctx.roundRect) ctx.roundRect(roomBadgeX - roomBadgeW / 2, roomBadgeY, roomBadgeW, roomBadgeH, 20);
            else ctx.rect(roomBadgeX - roomBadgeW / 2, roomBadgeY, roomBadgeW, roomBadgeH);
            ctx.fill();
            ctx.stroke();

            ctx.font = 'bold 20px "Segoe UI", monospace';
            ctx.fillStyle = '#38bdf8';
            ctx.textAlign = 'center';
            ctx.fillText(`🔑 ROOM ${roomCode}`, roomBadgeX, 58);
        }

        let statusText = '● LIVE SESSION';
        let statusColor = '#34d399';
        if (timeUp) {
            statusText = '⌛ TIME\'S UP';
            statusColor = '#f87171';
        } else if (isPaused) {
            statusText = '⏸ PAUSED';
            statusColor = '#fbbf24';
        }
        ctx.font = 'bold 20px "Segoe UI", system-ui, sans-serif';
        ctx.textAlign = 'right';
        ctx.fillStyle = statusColor;
        ctx.fillText(statusText, 970, 58);

        ctx.fillStyle = cfg.cardBg;
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.12)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        if (ctx.roundRect) ctx.roundRect(46, 116, 440, 350, 24);
        else ctx.rect(46, 116, 440, 350);
        ctx.fill();
        ctx.stroke();

        ctx.font = 'bold 22px "Segoe UI", system-ui, sans-serif';
        ctx.fillStyle = '#94a3b8';
        ctx.textAlign = 'center';
        ctx.fillText('🏆  PLAYER SCORE', 266, 155);

        ctx.font = 'bold 98px "Segoe UI", system-ui, monospace';
        ctx.fillStyle = cfg.scoreColor;
        ctx.shadowColor = cfg.scoreGlow;
        ctx.shadowBlur = 20;
        ctx.fillText(score.toString(), 266, 248);
        ctx.shadowBlur = 0;

        const scoreUnderline = ctx.createLinearGradient(120, 0, 412, 0);
        scoreUnderline.addColorStop(0, 'transparent');
        scoreUnderline.addColorStop(0.5, 'rgba(255, 255, 255, 0.25)');
        scoreUnderline.addColorStop(1, 'transparent');
        ctx.fillStyle = scoreUnderline;
        ctx.fillRect(116, 280, 300, 2);

        ctx.fillStyle = 'rgba(0, 0, 0, 0.32)';
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        if (ctx.roundRect) ctx.roundRect(76, 298, 380, 148, 16);
        else ctx.rect(76, 298, 380, 148);
        ctx.fill();
        ctx.stroke();

        ctx.font = 'bold 18px "Segoe UI", system-ui, sans-serif';
        ctx.fillStyle = '#94a3b8';
        ctx.fillText('⏱  SESSION TIMER (15 MIN)', 266, 332);

        const timerStr = formatTime(timeRemaining);
        ctx.font = 'bold 54px "Segoe UI", monospace';
        if (timeRemaining <= 60 || timeUp) {
            ctx.fillStyle = '#f87171';
            ctx.shadowColor = '#ef4444';
            ctx.shadowBlur = 16;
        } else if (timeRemaining <= 180) {
            ctx.fillStyle = '#fbbf24';
            ctx.shadowColor = '#f59e0b';
            ctx.shadowBlur = 12;
        } else {
            ctx.fillStyle = '#38bdf8';
            ctx.shadowColor = '#0284c7';
            ctx.shadowBlur = 10;
        }
        ctx.fillText(timerStr, 266, 396);
        ctx.shadowBlur = 0;

        ctx.font = '600 14px "Segoe UI", system-ui, sans-serif';
        ctx.fillStyle = '#64748b';
        ctx.fillText(timeUp ? 'PLAY SESSION FINISHED' : (isPaused ? 'TIMER PAUSED' : 'TIME REMAINING'), 266, 430);

        const btnX = 526, btnY = 116, btnW = 452, btnH = 350, btnR = 24;
        ctx.beginPath();
        if (ctx.roundRect) ctx.roundRect(btnX, btnY, btnW, btnH, btnR);
        else ctx.rect(btnX, btnY, btnW, btnH);

        if (timeUp) {
            const timeUpGrad = ctx.createLinearGradient(btnX, btnY, btnX, btnY + btnH);
            timeUpGrad.addColorStop(0, '#991b1b');
            timeUpGrad.addColorStop(1, '#450a0a');
            ctx.fillStyle = timeUpGrad;
            ctx.fill();

            ctx.strokeStyle = '#ef4444';
            ctx.lineWidth = 4;
            ctx.stroke();

            ctx.font = 'bold 64px "Segoe UI", system-ui, sans-serif';
            ctx.fillStyle = '#ffffff';
            ctx.textAlign = 'center';
            ctx.fillText('⌛  TIME\'S UP!', btnX + btnW / 2, btnY + 165);

            ctx.font = 'bold 22px "Segoe UI", system-ui, sans-serif';
            ctx.fillStyle = '#fecaca';
            ctx.fillText('15-Minute Play Session Ended', btnX + btnW / 2, btnY + 245);
        } else if (isPaused) {
            const resumeGrad = ctx.createLinearGradient(btnX, btnY, btnX, btnY + btnH);
            resumeGrad.addColorStop(0, isHovered ? '#10b981' : '#059669');
            resumeGrad.addColorStop(1, isHovered ? '#059669' : '#047857');
            ctx.fillStyle = resumeGrad;
            ctx.fill();

            ctx.strokeStyle = isHovered ? '#6ee7b7' : '#34d399';
            ctx.lineWidth = isHovered ? 8 : 4;
            if (isHovered) {
                ctx.shadowColor = '#34d399';
                ctx.shadowBlur = 30;
            }
            ctx.stroke();
            ctx.shadowBlur = 0;

            ctx.font = 'bold 72px "Segoe UI", system-ui, sans-serif';
            ctx.fillStyle = '#ffffff';
            ctx.textAlign = 'center';
            ctx.fillText('▶  RESUME', btnX + btnW / 2, btnY + 165);

            ctx.font = 'bold 24px "Segoe UI", system-ui, sans-serif';
            ctx.fillStyle = '#ecfdf5';
            ctx.fillText(isHovered ? '👉 CLICK TO RESUME 👈' : 'Aim & Press to Resume', btnX + btnW / 2, btnY + 248);
        } else {
            const pauseGrad = ctx.createLinearGradient(btnX, btnY, btnX, btnY + btnH);
            pauseGrad.addColorStop(0, isHovered ? '#e11d48' : cfg.pauseBg);
            pauseGrad.addColorStop(1, isHovered ? '#be123c' : '#4c0519');
            ctx.fillStyle = pauseGrad;
            ctx.fill();

            ctx.strokeStyle = isHovered ? '#fda4af' : cfg.pauseBorder;
            ctx.lineWidth = isHovered ? 8 : 4;
            if (isHovered) {
                ctx.shadowColor = '#f43f5e';
                ctx.shadowBlur = 28;
            }
            ctx.stroke();
            ctx.shadowBlur = 0;

            ctx.font = 'bold 72px "Segoe UI", system-ui, sans-serif';
            ctx.fillStyle = '#ffffff';
            ctx.textAlign = 'center';
            ctx.fillText('⏸  PAUSE', btnX + btnW / 2, btnY + 165);

            ctx.font = 'bold 24px "Segoe UI", system-ui, sans-serif';
            ctx.fillStyle = '#ffe4e6';
            ctx.fillText(isHovered ? '👉 CLICK TO PAUSE 👈' : 'Aim & Press to Pause', btnX + btnW / 2, btnY + 248);
        }

        ctx.restore();
        texture.needsUpdate = true;
    }

    drawScoreboard(0, false, false, '', 900, false);

    return {
        group,
        pauseHitbox,
        update(score, sessionState, raycaster, justPressed) {
            const isPaused = !!sessionState?.paused;
            const roomCode = sessionState?.roomCode || '';
            const timeRemaining = sessionState?.timeRemaining ?? 900;
            const timeUp = !!sessionState?.timeUp;
            const currentSec = Math.floor(timeRemaining);
            let isHovered = false;

            if (raycaster) {
                const hits = raycaster.intersectObject(pauseHitbox);
                if (hits.length > 0) {
                    isHovered = true;
                    if (justPressed && !timeUp) {
                        sessionState.paused = !sessionState.paused;
                        playSound('pop');
                    }
                }
            }

            if (
                score !== lastScore ||
                isPaused !== lastPaused ||
                isHovered !== lastHovered ||
                currentSec !== lastSec ||
                roomCode !== lastRoom ||
                timeUp !== lastTimeUp
            ) {
                lastScore = score;
                lastPaused = isPaused;
                lastHovered = isHovered;
                lastSec = currentSec;
                lastRoom = roomCode;
                lastTimeUp = timeUp;
                drawScoreboard(score, isPaused, isHovered, roomCode, timeRemaining, timeUp);
            }

            return { isHoveringPause: isHovered };
        },
        dispose() {
            texture.dispose();
            faceGeo.dispose();
            faceMat.dispose();
            frameGeo.dispose();
            frameMat.dispose();
            bulbGeo.dispose();
            bulbMat.dispose();
            pauseHitbox.geometry.dispose();
            pauseHitbox.material.dispose();
        }
    };
}

/**
 * Close-range, high-DPI (2048x512) static world-space HUD with crisp non-mipmapped text.
 */
export function createVisorHUD({
    scene,
    title = 'BALL POP',
    position = [0, 3.05, -3.55],
    rotation = [0.14, 0, 0]
} = {}) {
    const group = new THREE.Group();
    group.position.set(...position);
    group.rotation.set(...rotation);
    if (scene) {
        scene.add(group);
    }

    const canvas = document.createElement('canvas');
    canvas.width = 2048;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');

    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.minFilter = THREE.LinearFilter;
    texture.magFilter = THREE.LinearFilter;
    texture.generateMipmaps = false;
    texture.anisotropy = 16;

    const RIBBON_W = 3.1;
    const RIBBON_H = 0.78;
    const visorGeo = new THREE.PlaneGeometry(RIBBON_W, RIBBON_H, 24, 1);
    const posAttr = visorGeo.attributes.position;
    for (let i = 0; i < posAttr.count; i++) {
        const vx = posAttr.getX(i);
        const bendZ = Math.pow(vx / (RIBBON_W * 0.5), 2) * 0.24;
        posAttr.setZ(i, bendZ);
    }
    visorGeo.computeVertexNormals();

    const visorMat = new THREE.MeshBasicMaterial({
        map: texture,
        transparent: true,
        side: THREE.DoubleSide,
        depthTest: false,
        depthWrite: false
    });
    const visorMesh = new THREE.Mesh(visorGeo, visorMat);
    visorMesh.frustumCulled = false;
    visorMesh.renderOrder = 9990;
    group.add(visorMesh);

    const pauseHitbox = new THREE.Mesh(
        new THREE.PlaneGeometry(0.85, 0.58),
        new THREE.MeshBasicMaterial({ visible: false })
    );
    pauseHitbox.position.set(0, -0.02, 0.03);
    pauseHitbox.userData.isPauseButton = true;
    group.add(pauseHitbox);

    let lastScore = -1;
    let lastPaused = null;
    let lastHovered = false;
    let lastSec = -1;
    let lastRoom = null;
    let lastTimeUp = null;

    function formatTime(seconds) {
        const s = Math.max(0, Math.floor(seconds || 0));
        const mins = Math.floor(s / 60);
        const secs = s % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }

    function drawStopwatchIcon(cx, cy, r, color) {
        ctx.save();
        ctx.strokeStyle = color;
        ctx.fillStyle = color;
        ctx.lineWidth = 7;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.arc(cx, cy + 4, r, 0, Math.PI * 2);
        ctx.stroke();
        ctx.fillRect(cx - 11, cy - r - 11, 22, 8);
        ctx.beginPath();
        ctx.moveTo(cx, cy + 4);
        ctx.lineTo(cx, cy - r + 13);
        ctx.moveTo(cx, cy + 4);
        ctx.lineTo(cx + r * 0.55, cy + 4);
        ctx.stroke();
        ctx.restore();
    }

    function drawTargetIcon(cx, cy, r, color) {
        ctx.save();
        ctx.strokeStyle = color;
        ctx.fillStyle = color;
        ctx.lineWidth = 7;
        ctx.beginPath();
        ctx.arc(cx, cy, r, 0, Math.PI * 2);
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(cx, cy, r * 0.55, 0, Math.PI * 2);
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(cx, cy, r * 0.2, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    }

    function drawVisor(score, isPaused, isHovered, roomCode = '', timeRemaining = 900, timeUp = false) {
        ctx.clearRect(0, 0, 2048, 512);

        const cy = 290;
        const wingH = 148;

        // 1. Left Wing Ribbon
        const leftGrad = ctx.createLinearGradient(120, 0, 900, 0);
        leftGrad.addColorStop(0, 'rgba(245, 130, 15, 0.0)');
        leftGrad.addColorStop(0.3, 'rgba(245, 130, 15, 0.78)');
        leftGrad.addColorStop(1, 'rgba(255, 145, 20, 0.95)');
        ctx.fillStyle = leftGrad;
        ctx.beginPath();
        ctx.moveTo(120, cy - wingH / 2);
        ctx.lineTo(910, cy - wingH / 2);
        ctx.lineTo(878, cy + wingH / 2);
        ctx.lineTo(120, cy + wingH / 2);
        ctx.closePath();
        ctx.fill();

        // 2. Right Wing Ribbon
        const rightGrad = ctx.createLinearGradient(1148, 0, 1928, 0);
        rightGrad.addColorStop(0, 'rgba(255, 145, 20, 0.95)');
        rightGrad.addColorStop(0.7, 'rgba(245, 130, 15, 0.78)');
        rightGrad.addColorStop(1, 'rgba(245, 130, 15, 0.0)');
        ctx.fillStyle = rightGrad;
        ctx.beginPath();
        ctx.moveTo(1138, cy - wingH / 2);
        ctx.lineTo(1928, cy - wingH / 2);
        ctx.lineTo(1928, cy + wingH / 2);
        ctx.lineTo(1170, cy + wingH / 2);
        ctx.closePath();
        ctx.fill();

        // 3. Large High-Contrast Room Code Pill at Top
        if (roomCode) {
            const rcW = 380, rcH = 68, rcX = 1024 - rcW / 2, rcY = 44;
            ctx.fillStyle = '#0f172a';
            ctx.strokeStyle = '#38bdf8';
            ctx.lineWidth = 5;
            ctx.beginPath();
            if (ctx.roundRect) ctx.roundRect(rcX, rcY, rcW, rcH, 32);
            else ctx.rect(rcX, rcY, rcW, rcH);
            ctx.fill();
            ctx.stroke();

            ctx.font = '800 38px system-ui, -apple-system, sans-serif';
            ctx.fillStyle = '#7dd3fc';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(`ROOM ${roomCode}`, 1024, rcY + rcH / 2 + 2);
        }

        // 4. Left Section: Bold Timer + Vector Stopwatch Icon
        const timerStr = formatTime(timeRemaining);
        ctx.textAlign = 'right';
        ctx.textBaseline = 'middle';
        ctx.font = '900 88px system-ui, -apple-system, sans-serif';

        if (timeRemaining <= 60 || timeUp) {
            ctx.fillStyle = '#fef2f2';
        } else if (timeRemaining <= 180) {
            ctx.fillStyle = '#fef08a';
        } else {
            ctx.fillStyle = '#18181b';
        }
        ctx.fillText(timerStr, 735, cy + 4);
        drawStopwatchIcon(805, cy, 34, '#c22711');

        // 5. Center Interactive Pause / Resume Button
        const btnW = 200, btnH = 160, btnX = 1024 - btnW / 2, btnY = cy - btnH / 2;
        ctx.beginPath();
        if (ctx.roundRect) ctx.roundRect(btnX, btnY, btnW, btnH, 34);
        else ctx.rect(btnX, btnY, btnW, btnH);

        if (isHovered) {
            ctx.fillStyle = isPaused ? '#10b981' : '#f59e0b';
            ctx.fill();
            ctx.strokeStyle = '#ffffff';
            ctx.lineWidth = 6;
            ctx.stroke();
        } else {
            ctx.fillStyle = isPaused ? 'rgba(5, 150, 105, 0.9)' : 'rgba(20, 20, 20, 0.28)';
            ctx.fill();
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
            ctx.lineWidth = 4;
            ctx.stroke();
        }

        if (timeUp) {
            ctx.font = '900 68px system-ui, sans-serif';
            ctx.fillStyle = '#ffffff';
            ctx.textAlign = 'center';
            ctx.fillText('END', 1024, cy + 4);
        } else if (isPaused) {
            ctx.fillStyle = '#ffffff';
            ctx.beginPath();
            ctx.moveTo(1004, cy - 38);
            ctx.lineTo(1062, cy);
            ctx.lineTo(1004, cy + 38);
            ctx.closePath();
            ctx.fill();
        } else {
            ctx.fillStyle = '#18181b';
            ctx.fillRect(992, cy - 38, 20, 76);
            ctx.fillRect(1036, cy - 38, 20, 76);
        }

        // 6. Right Section: Vector Target Icon + Bold Score Number
        drawTargetIcon(1245, cy, 34, '#c22711');

        ctx.textAlign = 'left';
        ctx.textBaseline = 'middle';
        ctx.font = '900 94px system-ui, -apple-system, sans-serif';
        ctx.fillStyle = '#18181b';
        ctx.fillText(score.toString(), 1315, cy + 4);

        texture.needsUpdate = true;
    }

    drawVisor(0, false, false, '', 900, false);

    return {
        group,
        pauseHitbox,
        update(score, sessionState, raycaster, justPressed) {
            const isPaused = !!sessionState?.paused;
            const roomCode = sessionState?.roomCode || '';
            const timeRemaining = sessionState?.timeRemaining ?? 900;
            const timeUp = !!sessionState?.timeUp;
            const currentSec = Math.floor(timeRemaining);
            let isHovered = false;

            if (raycaster) {
                const hits = raycaster.intersectObject(pauseHitbox);
                if (hits.length > 0) {
                    isHovered = true;
                    if (justPressed && !timeUp) {
                        sessionState.paused = !sessionState.paused;
                        playSound('pop');
                    }
                }
            }

            if (
                score !== lastScore ||
                isPaused !== lastPaused ||
                isHovered !== lastHovered ||
                currentSec !== lastSec ||
                roomCode !== lastRoom ||
                timeUp !== lastTimeUp
            ) {
                lastScore = score;
                lastPaused = isPaused;
                lastHovered = isHovered;
                lastSec = currentSec;
                lastRoom = roomCode;
                lastTimeUp = timeUp;
                drawVisor(score, isPaused, isHovered, roomCode, timeRemaining, timeUp);
            }

            return { isHoveringPause: isHovered };
        },
        dispose() {
            if (scene) {
                scene.remove(group);
            }
            texture.dispose();
            visorGeo.dispose();
            visorMat.dispose();
            pauseHitbox.geometry.dispose();
            pauseHitbox.material.dispose();
        }
    };
}