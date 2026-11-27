import * as THREE from 'three';
import { playSound } from './shared.js';

function createShapePoints(shape, radius) {
    if (shape === 'circle') {
        return Array.from({ length: 64 }, (_, i) => {
            const angle = (i / 64) * Math.PI * 2;
            return new THREE.Vector2(Math.cos(angle) * radius, Math.sin(angle) * radius);
        });
    }

    if (shape === 'star') {
        return Array.from({ length: 10 }, (_, i) => {
            const angle = (i / 10) * Math.PI * 2 - Math.PI / 2;
            const pointRadius = i % 2 === 0 ? radius : radius * 0.45;
            return new THREE.Vector2(Math.cos(angle) * pointRadius, Math.sin(angle) * pointRadius);
        });
    }

    if (shape === 'diamond') {
        return [
            new THREE.Vector2(0, radius),
            new THREE.Vector2(radius * 0.75, 0),
            new THREE.Vector2(0, -radius),
            new THREE.Vector2(-radius * 0.75, 0)
        ];
    }

    return [
        new THREE.Vector2(-radius * 0.7, -radius * 0.7),
        new THREE.Vector2(radius * 0.7, -radius * 0.7),
        new THREE.Vector2(radius * 0.7, radius * 0.7),
        new THREE.Vector2(-radius * 0.7, radius * 0.7)
    ];
}

function clipShapeHalf(points, keepLeft, overlap) {
    const clipped = [];
    const boundary = keepLeft ? overlap : -overlap;
    const isInside = (point) => keepLeft ? point.x <= boundary : point.x >= boundary;

    points.forEach((current, index) => {
        const next = points[(index + 1) % points.length];
        const currentInside = isInside(current);
        const nextInside = isInside(next);

        if (currentInside) clipped.push(current);
        if (currentInside !== nextInside) {
            const t = (boundary - current.x) / (next.x - current.x);
            clipped.push(new THREE.Vector2(boundary, current.y + (next.y - current.y) * t));
        }
    });

    const shape = new THREE.Shape();
    shape.moveTo(clipped[0].x, clipped[0].y);
    clipped.slice(1).forEach((point) => shape.lineTo(point.x, point.y));
    shape.closePath();
    return new THREE.ShapeGeometry(shape);
}

export const binocularMatchGame = {
    name: 'Binocular Matching Demo',
    cameraSetup: { position: [0, 0, 0], defaultPitch: 0 },
    init(scene, camera) {
        const targetDistance = 3.2;
        const targetScale = targetDistance / 4;
        const root = new THREE.Group();
        scene.add(root);

        const targetGroup = new THREE.Group();
        targetGroup.position.set(0, 0, -targetDistance);
        targetGroup.scale.setScalar(targetScale);
        root.add(targetGroup);

        const seamOverlap = 0.035;
        const baseFillColor = new THREE.Color(0x44e0c1);
        const highlightFillColor = new THREE.Color(0x91ffe8);
        const leftMaterial = new THREE.MeshBasicMaterial({ color: baseFillColor, side: THREE.DoubleSide });
        const rightMaterial = leftMaterial.clone();
        const outlineMaterial = new THREE.LineBasicMaterial({ color: 0xffffff });
        const shapes = ['circle', 'diamond', 'star', 'square'];
        const targets = shapes.map((shape) => {
            const points = createShapePoints(shape, 0.82);
            const leftHalf = new THREE.Mesh(clipShapeHalf(points, true, seamOverlap), leftMaterial);
            leftHalf.layers.set(1);
            const rightHalf = new THREE.Mesh(clipShapeHalf(points, false, seamOverlap), rightMaterial);
            rightHalf.layers.set(2);

            const outlineGeometry = new THREE.BufferGeometry().setFromPoints(
                points.map((point) => new THREE.Vector3(point.x, point.y, 0.01))
            );
            const outline = new THREE.LineLoop(outlineGeometry, outlineMaterial);
            const target = new THREE.Group();
            target.add(leftHalf, rightHalf, outline);
            target.visible = false;
            targetGroup.add(target);
            return { target, leftHalf, rightHalf, outlineGeometry };
        });

        const hitbox = new THREE.Mesh(
            new THREE.CircleGeometry(0.95 * targetScale, 48),
            new THREE.MeshBasicMaterial({
                color: 0xffffff,
                transparent: true,
                opacity: 0,
                side: THREE.DoubleSide
            })
        );
        hitbox.position.set(0, 0, -targetDistance + 0.02);
        scene.add(hitbox);

        const cursor = new THREE.Group();
        const ring = new THREE.Mesh(
            new THREE.RingGeometry(0.07, 0.1, 24),
            new THREE.MeshBasicMaterial({ color: 0xffffff, depthTest: false })
        );
        const dot = new THREE.Mesh(
            new THREE.CircleGeometry(0.012, 12),
            new THREE.MeshBasicMaterial({ color: 0xffffff, depthTest: false })
        );
        cursor.add(ring, dot);
        cursor.position.set(0, 0, -targetDistance + 0.2);
        cursor.scale.setScalar(targetScale);
        cursor.renderOrder = 9999;
        ring.renderOrder = 9999;
        dot.renderOrder = 9999;
        camera.add(cursor);

        const raycaster = new THREE.Raycaster();
        const cameraPosition = new THREE.Vector3();
        const worldTarget = new THREE.Vector3();
        let score = 0;
        let currentTarget = 0;
        let previousAction = false;
        let animationTime = 0;
        let feedbackRemaining = 0;

        targets[0].target.visible = true;

        return {
            update(dt, input, state) {
                if (!state.paused) {
                    animationTime += dt;
                    feedbackRemaining = Math.max(0, feedbackRemaining - dt);
                }

                const breathing = 0.5 + 0.5 * Math.sin(animationTime * Math.PI * 0.8);
                const feedback = (feedbackRemaining / 0.45) * 0.2;
                const highlightAmount = 0.06 + breathing * 0.12 + feedback;
                leftMaterial.color.copy(baseFillColor).lerp(highlightFillColor, highlightAmount);
                rightMaterial.color.copy(leftMaterial.color);

                cursor.position.x = THREE.MathUtils.clamp(cursor.position.x + input.x * dt * 2.5, -1.6, 1.6);
                cursor.position.y = THREE.MathUtils.clamp(cursor.position.y + input.y * dt * 2.5, -1.2, 1.2);

                cursor.getWorldPosition(worldTarget);
                camera.getWorldPosition(cameraPosition);
                raycaster.set(cameraPosition, worldTarget.sub(cameraPosition).normalize());

                const justPressed = input.actionPressed && !previousAction;
                previousAction = input.actionPressed;

                if (!state.paused && justPressed && raycaster.intersectObject(hitbox).length > 0) {
                    targets[currentTarget].target.visible = false;
                    currentTarget = (currentTarget + 1) % targets.length;
                    targets[currentTarget].target.visible = true;
                    feedbackRemaining = 0.45;
                    score += 1;
                    playSound('chime');
                }

                return { score };
            },
            dispose() {
                camera.remove(cursor);
                scene.remove(hitbox);
                scene.remove(root);
                targets.forEach(({ leftHalf, rightHalf, outlineGeometry }) => {
                    leftHalf.geometry.dispose();
                    rightHalf.geometry.dispose();
                    outlineGeometry.dispose();
                });
                leftMaterial.dispose();
                rightMaterial.dispose();
                outlineMaterial.dispose();
                hitbox.geometry.dispose();
                hitbox.material.dispose();
                ring.geometry.dispose();
                ring.material.dispose();
                dot.geometry.dispose();
                dot.material.dispose();
            }
        };
    }
};
