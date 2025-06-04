export class AnimationManager {
    constructor() {
        this.animations = [];
        this.clock = new THREE.Clock();
        this.time = 0;
        this.mixer = null;
    }

    setupCharacterAnimation(lion, monkey) {
        // Store references to characters
        this.lion = lion;
        this.monkey = monkey;
        
        // Add meerkat (third character using basic geometry)
        this.createMeerkat();
        
        // Set up animation mixer for GLB animations if they exist
        if (lion && lion.animations && lion.animations.length > 0) {
            this.mixer = new THREE.AnimationMixer(lion);
            const action = this.mixer.clipAction(lion.animations[0]);
            action.play();
        }
    }

    createMeerkat() {
        const meerkatGroup = new THREE.Group();
        
        // Body (cylinder)
        const bodyGeometry = new THREE.CylinderGeometry(0.3, 0.4, 1.5, 8);
        const bodyMaterial = new THREE.MeshPhongMaterial({ 
            color: 0xdaa520,
            emissive: 0x553311,
            emissiveIntensity: 0.1
        });
        const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
        body.castShadow = true;
        meerkatGroup.add(body);
        
        // Head (sphere)
        const headGeometry = new THREE.SphereGeometry(0.3, 8, 8);
        const head = new THREE.Mesh(headGeometry, bodyMaterial);
        head.position.y = 1;
        head.castShadow = true;
        meerkatGroup.add(head);
        
        // Eyes
        const eyeGeometry = new THREE.SphereGeometry(0.05, 4, 4);
        const eyeMaterial = new THREE.MeshBasicMaterial({ color: 0x000000 });
        const leftEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
        leftEye.position.set(0.1, 1, 0.25);
        const rightEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
        rightEye.position.set(-0.1, 1, 0.25);
        meerkatGroup.add(leftEye, rightEye);
        
        // Tail (curved cylinder using torus)
        const tailGeometry = new THREE.TorusGeometry(0.5, 0.1, 4, 8, Math.PI);
        const tail = new THREE.Mesh(tailGeometry, bodyMaterial);
        tail.position.set(0, -0.5, -0.3);
        tail.rotation.x = Math.PI;
        meerkatGroup.add(tail);
        
        // Legs (4 small cylinders)
        for (let i = 0; i < 4; i++) {
            const legGeometry = new THREE.CylinderGeometry(0.08, 0.08, 0.5, 6);
            const leg = new THREE.Mesh(legGeometry, bodyMaterial);
            leg.position.x = (i < 2 ? 0.15 : -0.15);
            leg.position.z = (i % 2 === 0 ? 0.15 : -0.15);
            leg.position.y = -0.75;
            leg.castShadow = true;
            leg.name = `leg${i}`;
            meerkatGroup.add(leg);
        }
        
        const logRadius = window.logRadius || 1;
        meerkatGroup.position.set(3, logRadius - 0.3, 0);
        meerkatGroup.scale.set(0.4, 0.4, 0.4);
        
        this.meerkat = meerkatGroup;
        
        // Add to scene (assuming we have access to scene)
        if (window.sceneManager) {
            window.sceneManager.scene.add(meerkatGroup);
        }
    }

    setupFireflyAnimation(fireflies) {
        this.fireflies = fireflies;
    }

    update() {
        const deltaTime = this.clock.getDelta();
        this.time += deltaTime;
        
        // Get log radius for proper positioning
        const logRadius = window.logRadius || 1;
        const logTop = logRadius - 0.2; // Slightly embedded in log
        
        // Animate characters walking on the log
        if (this.lion) {
            // Walking animation - smaller movement range
            this.lion.position.x = Math.sin(this.time * 0.5) * 4 - 1;
            this.lion.position.y = logTop + Math.abs(Math.sin(this.time * 2)) * 0.1;
            this.lion.position.z = 0; // Keep on center of log
            
            // Rotate to face walking direction
            if (Math.cos(this.time * 0.5) > 0) {
                this.lion.rotation.y = Math.PI / 2;
            } else {
                this.lion.rotation.y = -Math.PI / 2;
            }
            
            // Animate child meshes for walking effect
            this.lion.traverse((child) => {
                if (child.isMesh && child.name && child.name.includes('leg')) {
                    child.rotation.x = Math.sin(this.time * 3) * 0.3;
                }
            });
        }
        
        if (this.monkey) {
            // Monkey follows lion with delay
            this.monkey.position.x = Math.sin(this.time * 0.5 - 1) * 4 + 1;
            this.monkey.position.y = logTop - 0.1 + Math.abs(Math.sin(this.time * 2 - 1)) * 0.2;
            this.monkey.position.z = 0; // Keep on center of log
            
            // Bounce animation
            this.monkey.rotation.z = Math.sin(this.time * 4) * 0.1;
            
            // Face direction
            if (Math.cos(this.time * 0.5 - 1) > 0) {
                this.monkey.rotation.y = Math.PI / 2;
            } else {
                this.monkey.rotation.y = -Math.PI / 2;
            }
            
            // Swinging animation for monkey
            this.monkey.traverse((child) => {
                if (child.isMesh) {
                    if (child.name && child.name.includes('arm')) {
                        child.rotation.x = Math.sin(this.time * 2) * 0.4;
                    }
                    if (child.name && child.name.includes('tail')) {
                        child.rotation.z = Math.sin(this.time * 3) * 0.3;
                    }
                }
            });
        }
        
        if (this.meerkat) {
            // Meerkat follows behind
            this.meerkat.position.x = Math.sin(this.time * 0.5 - 2) * 4 + 2;
            this.meerkat.position.y = logTop - 0.3 + Math.abs(Math.sin(this.time * 3)) * 0.1;
            this.meerkat.position.z = 0; // Keep on center of log
            
            // Look around animation
            this.meerkat.rotation.y = Math.sin(this.time) * 0.5 + Math.PI / 2;
            
            // Animate legs
            this.meerkat.children.forEach((child) => {
                if (child.name && child.name.startsWith('leg')) {
                    const legIndex = parseInt(child.name.replace('leg', ''));
                    child.rotation.x = Math.sin(this.time * 4 + legIndex * Math.PI / 2) * 0.2;
                }
            });
            
            // Tail wag
            const tail = this.meerkat.children.find(child => child.geometry instanceof THREE.TorusGeometry);
            if (tail) {
                tail.rotation.z = Math.sin(this.time * 5) * 0.3;
            }
        }
        
        // Update spotlight to follow characters
        if (window.lightingManager && this.lion) {
            window.lightingManager.updateSpotlightTarget(this.lion.position);
        }
        
        // Animate fireflies
        if (this.fireflies) {
            this.fireflies.forEach((firefly, i) => {
                const userData = firefly.userData;
                const t = this.time * userData.speed;
                
                // Figure-8 pattern movement
                firefly.position.x += Math.sin(t + userData.offsetX) * 0.05;
                firefly.position.y += Math.sin(t * 2 + userData.offsetY) * 0.03;
                firefly.position.z += Math.cos(t + userData.offsetZ) * 0.05;
                
                // Keep within bounds
                if (Math.abs(firefly.position.x) > 20) firefly.position.x *= 0.9;
                if (firefly.position.y > 10 || firefly.position.y < -2) firefly.position.y = 4;
                if (Math.abs(firefly.position.z) > 15) firefly.position.z *= 0.9;
                
                // Pulsing glow effect
                const glowIntensity = (Math.sin(t * 3) + 1) * 0.5;
                if (firefly.children[1]) { // Glow mesh
                    firefly.children[1].material.opacity = 0.2 + glowIntensity * 0.3;
                }
                if (firefly.children[2]) { // Point light
                    firefly.children[2].intensity = 0.3 + glowIntensity * 0.4;
                }
                
                // Vertical bobbing
                firefly.position.y += Math.sin(t * 2) * 0.01;
            });
        }
        
        // Animate any loaded GLB model animations
        if (this.mixer) {
            this.mixer.update(deltaTime);
        }
        
        // Add some animated elements to meet the 20+ shapes requirement
        this.animateBackgroundElements();
    }
    
    animateBackgroundElements() {
        // Animate trees swaying (if they exist in the scene)
        if (window.sceneManager) {
            window.sceneManager.scene.traverse((child) => {
                if (child.name && child.name.includes('tree')) {
                    child.rotation.z = Math.sin(this.time * 0.5 + child.position.x) * 0.05;
                }
            });
        }
    }
}