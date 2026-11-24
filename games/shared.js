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
    const skyColor = 0x7ec8f2;
    scene.background = new THREE.Color(skyColor);
    scene.fog = new THREE.FogExp2(skyColor, 0.011);

    const envGroup = new THREE.Group();
    scene.add(envGroup);

    const hemiLight = new THREE.HemisphereLight(0xffffff, 0x8d5524, 1.15);
    hemiLight.position.set(0, 20, 0);
    const sunLight = new THREE.DirectionalLight(0xfff6dd, 1.35);
    sunLight.position.set(12, 22, 10);
    envGroup.add(hemiLight, sunLight);

    const court = new THREE.Mesh(
        new THREE.CircleGeometry(14, 48),
        new THREE.MeshStandardMaterial({ color: 0xe68438, roughness: 0.9 })
    );
    court.rotation.x = -Math.PI / 2;
    envGroup.add(court);

    const outerLawn = new THREE.Mesh(
        new THREE.RingGeometry(13.8, 85, 48),
        new THREE.MeshStandardMaterial({ color: 0x4caf50, roughness: 0.95 })
    );
    outerLawn.rotation.x = -Math.PI / 2;
    outerLawn.position.y = -0.02;
    envGroup.add(outerLawn);

    const fenceRadius = 11.2;
    const slatCount = 76;
    const fenceColors = [0xff4d4d, 0xffbe0b, 0x3a86ff, 0x2ec4b6, 0xff70a6, 0x8ac926];
    const slatGeo = new THREE.BoxGeometry(0.32, 1.35, 0.1);
    const railGeo = new THREE.BoxGeometry(0.95, 0.12, 0.08);
    const railMat = new THREE.MeshStandardMaterial({ color: 0xf8fafc });

    for (let i = 0; i < slatCount; i++) {
        const angle = (i / slatCount) * Math.PI * 2;
        const slatMat = new THREE.MeshStandardMaterial({
            color: fenceColors[i % fenceColors.length],
            roughness: 0.6
        });
        const slat = new THREE.Mesh(slatGeo, slatMat);
        slat.position.set(Math.cos(angle) * fenceRadius, 0.68, Math.sin(angle) * fenceRadius);
        slat.lookAt(0, 0.68, 0);
        envGroup.add(slat);

        if (i % 2 === 0) {
            const rail = new THREE.Mesh(railGeo, railMat);
            rail.position.set(Math.cos(angle) * (fenceRadius + 0.06), 0.75, Math.sin(angle) * (fenceRadius + 0.06));
            rail.lookAt(0, 0.75, 0);
            envGroup.add(rail);
        }
    }

    const sandboxGroup = new THREE.Group();
    sandboxGroup.position.set(-2.6, 0, -8.8);
    envGroup.add(sandboxGroup);

    const sandPit = new THREE.Mesh(
        new THREE.BoxGeometry(2.4, 0.25, 2.2),
        new THREE.MeshStandardMaterial({ color: 0x9b5de5, roughness: 0.7 })
    );
    sandPit.position.y = 0.125;
    const sandFill = new THREE.Mesh(
        new THREE.BoxGeometry(2.0, 0.27, 1.8),
        new THREE.MeshStandardMaterial({ color: 0xf4d58d, roughness: 1.0 })
    );
    sandFill.position.y = 0.13;

    const pole = new THREE.Mesh(
        new THREE.CylinderGeometry(0.08, 0.08, 2.8, 10),
        new THREE.MeshStandardMaterial({ color: 0x00bbf9 })
    );
    pole.position.y = 1.4;

    const canopyGroup = new THREE.Group();
    canopyGroup.position.y = 2.75;
    const sliceColors = [0xff4d6d, 0x00bbf9, 0xffbe0b, 0x8ac926, 0x9b5de5, 0xfb5607];
    const sliceAngle = (Math.PI * 2) / sliceColors.length;
    sliceColors.forEach((col, idx) => {
        const wedge = new THREE.Mesh(
            new THREE.ConeGeometry(1.65, 0.75, 8, 1, false, idx * sliceAngle, sliceAngle),
            new THREE.MeshStandardMaterial({ color: col, roughness: 0.5 })
        );
        canopyGroup.add(wedge);
    });

    sandboxGroup.add(sandPit, sandFill, pole, canopyGroup);

    const trunkMat = new THREE.MeshStandardMaterial({ color: 0x5c3a21 });
    const pineMat = new THREE.MeshStandardMaterial({ color: 0x2d6a4f, roughness: 0.85 });
    const roundTreeMat = new THREE.MeshStandardMaterial({ color: 0x70e000, roughness: 0.8 });
    const trunkGeo = new THREE.CylinderGeometry(0.24, 0.34, 1.8, 8);
    const coneGeo = new THREE.ConeGeometry(1.4, 3.2, 7);
    const crownGeo = new THREE.DodecahedronGeometry(1.45, 1);

    for (let i = 0; i < 26; i++) {
        const angle = (i / 26) * Math.PI * 2 + 0.08;
        const dist = 14.5 + (i % 3) * 3.8;
        const tree = new THREE.Group();

        const trunk = new THREE.Mesh(trunkGeo, trunkMat);
        trunk.position.y = 0.9;
        tree.add(trunk);

        if (i % 2 === 0) {
            const c1 = new THREE.Mesh(coneGeo, pineMat);
            c1.position.y = 2.6;
            const c2 = new THREE.Mesh(coneGeo, pineMat);
            c2.scale.setScalar(0.75);
            c2.position.y = 4.0;
            tree.add(c1, c2);
        } else {
            const crown = new THREE.Mesh(crownGeo, roundTreeMat);
            crown.position.y = 2.7;
            tree.add(crown);
        }

        tree.position.set(Math.cos(angle) * dist, 0, Math.sin(angle) * dist);
        tree.scale.setScalar(0.95 + (i % 3) * 0.25);
        envGroup.add(tree);
    }

    return {
        update() { },
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