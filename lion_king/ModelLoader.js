export class ModelLoader {
    constructor(scene) {
        this.scene = scene;
        this.loader = new THREE.GLTFLoader();
        this.models = {};
        this.textureLoader = new THREE.TextureLoader();
    }

    async loadAllModels() {
        const modelPaths = {
            moon: './moon.glb',
            woodLog: './wood_moss.glb',
            lion: './lion.glb',
            monkey: './monkey.glb',
            tree: './tree.glb'
        };

        // Try different path variations if needed
        const pathVariations = [
            '', // current directory
            '/Users/ujwalanettam/Downloads/cse-160/lion_king/', // absolute path
            './lion_king/', // relative path
            '../lion_king/', // parent directory
            './models/', // models subdirectory
        ];

        // Load all models with fallback paths
        const promises = Object.entries(modelPaths).map(([name, filename]) => 
            this.loadModelWithFallback(name, filename, pathVariations)
        );

        await Promise.all(promises);

        // Position and setup models
        this.setupModels();

        return this.models;
    }

    async loadModelWithFallback(name, filename, pathVariations) {
        for (const basePath of pathVariations) {
            try {
                const path = basePath + filename;
                const model = await this.loadModel(name, path);
                if (model) {
                    console.log(`Successfully loaded ${name} from ${path}`);
                    return model;
                }
            } catch (error) {
                console.log(`Failed to load ${name} from ${basePath + filename}`);
            }
        }
        
        // If all paths fail, create fallback
        console.warn(`All paths failed for ${name}, using fallback geometry`);
        this.models[name] = this.createFallbackModel(name);
        return this.models[name];
    }

    loadModel(name, path) {
        return new Promise((resolve, reject) => {
            this.loader.load(
                path,
                (gltf) => {
                    const model = gltf.scene;
                    
                    // Ensure textures are properly loaded
                    model.traverse((child) => {
                        if (child.isMesh) {
                            // Enable shadows
                            child.castShadow = true;
                            child.receiveShadow = true;
                            
                            // Fix materials and textures
                            if (child.material) {
                                // Ensure material updates
                                child.material.needsUpdate = true;
                                
                                // For moon, ensure it's bright
                                if (name === 'moon') {
                                    child.material.emissive = new THREE.Color(0xffffaa);
                                    child.material.emissiveIntensity = 0.5;
                                }
                                
                                // Fix texture encoding
                                if (child.material.map) {
                                    child.material.map.encoding = THREE.sRGBEncoding;
                                }
                            }
                        }
                    });
                    
                    this.models[name] = model;
                    resolve(model);
                },
                (progress) => {
                    const percent = (progress.loaded / progress.total * 100).toFixed(2);
                    console.log(`Loading ${name}: ${percent}%`);
                },
                (error) => {
                    console.error(`Error loading ${name} from ${path}:`, error);
                    reject(error);
                }
            );
        });
    }

    createFallbackModel(name) {
        const group = new THREE.Group();
        let geometry, material, mesh;

        switch(name) {
            case 'moon':
                // Create large textured moon sphere
                geometry = new THREE.SphereGeometry(3, 32, 32);
                const moonTexture = this.createMoonTexture();
                material = new THREE.MeshBasicMaterial({ 
                    map: moonTexture,
                    color: 0xffffee,
                    emissive: 0xffffaa,
                    emissiveIntensity: 0.5
                });
                mesh = new THREE.Mesh(geometry, material);
                // Add glow effect
                const glowGeometry = new THREE.SphereGeometry(3.2, 32, 32);
                const glowMaterial = new THREE.MeshBasicMaterial({
                    color: 0xffffaa,
                    transparent: true,
                    opacity: 0.3,
                    side: THREE.BackSide
                });
                const glow = new THREE.Mesh(glowGeometry, glowMaterial);
                group.add(glow);
                break;
                
            case 'woodLog':
                // Create log that spans exactly between the cliffs (40 units apart)
                // Cliffs are at x = -20 and x = +20, so log needs to be 40+ units long
                geometry = new THREE.CylinderGeometry(1, 1, 45, 16); // Make it slightly longer than gap
                const woodTexture = this.createWoodTexture();
                material = new THREE.MeshPhongMaterial({ 
                    map: woodTexture,
                    bumpMap: woodTexture,
                    bumpScale: 0.2,
                    color: 0x8B4513 // Saddle brown color
                });
                mesh = new THREE.Mesh(geometry, material);
                mesh.receiveShadow = true;
                mesh.castShadow = true;
                break;
                
            case 'lion':
                // Create lion with multiple parts
                this.createLionFallback(group);
                break;
                
            case 'monkey':
                // Create monkey with multiple parts
                this.createMonkeyFallback(group);
                break;
                
            case 'tree':
                // Create tree with trunk and leaves
                this.createTreeFallback(group);
                break;
                
            default:
                geometry = new THREE.BoxGeometry(1, 1, 1);
                material = new THREE.MeshBasicMaterial({ color: 0xff00ff });
                mesh = new THREE.Mesh(geometry, material);
        }

        if (mesh) {
            mesh.castShadow = true;
            mesh.receiveShadow = true;
            group.add(mesh);
        }
        
        group.name = name;
        return group;
    }

    createMoonTexture() {
        // Create a simple moon texture procedurally
        const canvas = document.createElement('canvas');
        canvas.width = 512;
        canvas.height = 512;
        const ctx = canvas.getContext('2d');
        
        // Base color
        ctx.fillStyle = '#ffffcc';
        ctx.fillRect(0, 0, 512, 512);
        
        // Add some crater-like features
        ctx.fillStyle = '#ffff99';
        for (let i = 0; i < 20; i++) {
            ctx.beginPath();
            ctx.arc(
                Math.random() * 512,
                Math.random() * 512,
                Math.random() * 50 + 10,
                0,
                Math.PI * 2
            );
            ctx.fill();
        }
        
        const texture = new THREE.CanvasTexture(canvas);
        texture.needsUpdate = true;
        return texture;
    }

    createWoodTexture() {
        // Create wood texture procedurally
        const canvas = document.createElement('canvas');
        canvas.width = 512;
        canvas.height = 512;
        const ctx = canvas.getContext('2d');
        
        // Base wood color
        ctx.fillStyle = '#8b6f47';
        ctx.fillRect(0, 0, 512, 512);
        
        // Wood grain
        ctx.strokeStyle = '#6b4f37';
        ctx.lineWidth = 2;
        for (let i = 0; i < 512; i += 8) {
            ctx.beginPath();
            ctx.moveTo(0, i + Math.sin(i * 0.1) * 5);
            ctx.lineTo(512, i + Math.sin(i * 0.1) * 5);
            ctx.stroke();
        }
        
        const texture = new THREE.CanvasTexture(canvas);
        texture.wrapS = THREE.RepeatWrapping;
        texture.wrapT = THREE.RepeatWrapping;
        texture.repeat.set(4, 1);
        return texture;
    }

    createLionFallback(group) {
        const lionColor = 0xd4a574;
        const maneColor = 0x8b4513;
        
        // Body
        const bodyGeometry = new THREE.BoxGeometry(3, 1.5, 1.5);
        const bodyMaterial = new THREE.MeshPhongMaterial({ color: lionColor });
        const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
        body.castShadow = true;
        group.add(body);
        
        // Head
        const headGeometry = new THREE.SphereGeometry(0.8, 8, 8);
        const head = new THREE.Mesh(headGeometry, bodyMaterial);
        head.position.set(1.8, 0.3, 0);
        head.castShadow = true;
        group.add(head);
        
        // Mane
        const maneGeometry = new THREE.SphereGeometry(1, 8, 8);
        const maneMaterial = new THREE.MeshPhongMaterial({ color: maneColor });
        const mane = new THREE.Mesh(maneGeometry, maneMaterial);
        mane.position.set(1.5, 0.3, 0);
        mane.scale.set(1.2, 1.2, 0.8);
        group.add(mane);
        
        // Legs
        const legGeometry = new THREE.CylinderGeometry(0.2, 0.2, 1.5, 6);
        const legMaterial = new THREE.MeshPhongMaterial({ color: lionColor });
        for (let i = 0; i < 4; i++) {
            const leg = new THREE.Mesh(legGeometry, legMaterial);
            leg.position.x = i < 2 ? 1 : -1;
            leg.position.z = i % 2 === 0 ? 0.5 : -0.5;
            leg.position.y = -1;
            leg.name = `leg${i}`;
            leg.castShadow = true;
            group.add(leg);
        }
        
        // Tail
        const tailGeometry = new THREE.CylinderGeometry(0.1, 0.05, 2, 6);
        const tail = new THREE.Mesh(tailGeometry, legMaterial);
        tail.position.set(-1.5, -0.5, 0);
        tail.rotation.z = -Math.PI / 4;
        group.add(tail);
    }

    createMonkeyFallback(group) {
        const monkeyColor = 0x8b4513;
        
        // Body
        const bodyGeometry = new THREE.SphereGeometry(0.8, 8, 8);
        const bodyMaterial = new THREE.MeshPhongMaterial({ color: monkeyColor });
        const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
        body.scale.y = 1.2;
        body.castShadow = true;
        group.add(body);
        
        // Head
        const headGeometry = new THREE.SphereGeometry(0.5, 8, 8);
        const head = new THREE.Mesh(headGeometry, bodyMaterial);
        head.position.set(0, 1, 0);
        head.castShadow = true;
        group.add(head);
        
        // Arms
        const armGeometry = new THREE.CylinderGeometry(0.15, 0.15, 1.5, 6);
        const leftArm = new THREE.Mesh(armGeometry, bodyMaterial);
        leftArm.position.set(0.6, 0.5, 0);
        leftArm.rotation.z = Math.PI / 6;
        leftArm.name = 'leftArm';
        group.add(leftArm);
        
        const rightArm = new THREE.Mesh(armGeometry, bodyMaterial);
        rightArm.position.set(-0.6, 0.5, 0);
        rightArm.rotation.z = -Math.PI / 6;
        rightArm.name = 'rightArm';
        group.add(rightArm);
        
        // Tail
        const tailGeometry = new THREE.CylinderGeometry(0.1, 0.05, 2, 6);
        const tail = new THREE.Mesh(tailGeometry, bodyMaterial);
        tail.position.set(0, -0.5, -0.5);
        tail.rotation.x = -Math.PI / 4;
        tail.name = 'tail';
        group.add(tail);
    }

    createTreeFallback(group) {
        // Trunk
        const trunkGeometry = new THREE.CylinderGeometry(0.5, 0.7, 4, 8);
        const trunkMaterial = new THREE.MeshPhongMaterial({ color: 0x4a3c28 });
        const trunk = new THREE.Mesh(trunkGeometry, trunkMaterial);
        trunk.castShadow = true;
        group.add(trunk);
        
        // Leaves (multiple cones)
        const leafMaterial = new THREE.MeshPhongMaterial({ color: 0x2d5a2b });
        for (let i = 0; i < 3; i++) {
            const leafGeometry = new THREE.ConeGeometry(2 - i * 0.3, 2, 8);
            const leaves = new THREE.Mesh(leafGeometry, leafMaterial);
            leaves.position.y = 2 + i * 1.5;
            leaves.castShadow = true;
            group.add(leaves);
        }
    }

    setupModels() {
        // Moon setup - make it bigger and position it properly
        if (this.models.moon) {
            this.models.moon.position.set(-10, 15, -25);
            this.models.moon.scale.set(10, 10, 10);
            
            // Make moon glow
            this.models.moon.traverse((child) => {
                if (child.isMesh) {
                    child.material.emissive = new THREE.Color(0xffffaa);
                    child.material.emissiveIntensity = 0.5;
                }
            });
            
            this.scene.add(this.models.moon);
        }

        // Wood log setup - CRITICAL: Position to span between cliffs
        if (this.models.woodLog) {
            // Position the log to span between the cliffs
            // Cliffs are at x = -20 and x = +20, so center the log at x = 0
            this.models.woodLog.position.set(0, -1, 0); // y = -1 is the top of the cliffs
            this.models.woodLog.rotation.z = Math.PI / 2; // Rotate to lie horizontally
            this.models.woodLog.scale.set(1, 1, 1);
            
            // Store log dimensions for character positioning
            this.logRadius = 1; // Radius of the log
            
            // Ensure it's brown/wooden colored
            this.models.woodLog.traverse((child) => {
                if (child.isMesh) {
                    if (!child.material.map) {
                        child.material.color = new THREE.Color(0x8B4513);
                    }
                    child.castShadow = true;
                    child.receiveShadow = true;
                }
            });
            
            this.scene.add(this.models.woodLog);
        } else {
            // If no log model, create a fallback and store dimensions
            this.logRadius = 1;
        }

        // Lion setup - properly on top of the log
        if (this.models.lion) {
            this.models.lion.position.set(-3, this.logRadius - 0.2, 0);
            this.models.lion.scale.set(0.8, 0.8, 0.8);
            this.models.lion.rotation.y = Math.PI / 2;
            
            // Ensure lion is visible
            this.models.lion.traverse((child) => {
                if (child.isMesh) {
                    child.castShadow = true;
                    if (!child.material.map) {
                        child.material.color = new THREE.Color(0xd4a574);
                    }
                }
            });
            
            this.scene.add(this.models.lion);
        }

        // Monkey setup - on the log behind lion
        if (this.models.monkey) {
            this.models.monkey.position.set(0, this.logRadius - 0.3, 0);
            this.models.monkey.scale.set(0.5, 0.5, 0.5);
            this.models.monkey.rotation.y = Math.PI / 2;
            
            // Ensure monkey is visible
            this.models.monkey.traverse((child) => {
                if (child.isMesh) {
                    child.castShadow = true;
                    if (!child.material.map) {
                        child.material.color = new THREE.Color(0x8b4513);
                    }
                }
            });
            
            this.scene.add(this.models.monkey);
        }

        // Trees setup - many trees on top of cliffs
        const cliffTop = -1; // Top of the cliffs
        const treePositions = [];
        
        // Left cliff trees (avoiding the log area)
        for (let i = 0; i < 15; i++) {
            treePositions.push({
                x: -25 - Math.random() * 10,
                y: cliffTop,
                z: -8 + Math.random() * 16,
                scale: 0.8 + Math.random() * 0.6
            });
        }
        
        // Right cliff trees (avoiding the log area)
        for (let i = 0; i < 15; i++) {
            treePositions.push({
                x: 25 + Math.random() * 10,
                y: cliffTop,
                z: -8 + Math.random() * 16,
                scale: 0.8 + Math.random() * 0.6
            });
        }
        
        // Add some trees on the sides but not blocking the log
        for (let i = 0; i < 10; i++) {
            const side = Math.random() > 0.5 ? -1 : 1;
            treePositions.push({
                x: side * (10 + Math.random() * 5),
                y: cliffTop,
                z: (Math.random() > 0.5 ? 6 : -6) + Math.random() * 4,
                scale: 0.6 + Math.random() * 0.4
            });
        }

        treePositions.forEach((pos, index) => {
            const tree = this.models.tree ? this.models.tree.clone() : this.createFallbackModel('tree');
            tree.position.set(pos.x, pos.y, pos.z);
            tree.scale.set(pos.scale, pos.scale, pos.scale);
            tree.rotation.y = Math.random() * Math.PI * 2;
            
            // Ensure trees are green
            tree.traverse((child) => {
                if (child.isMesh) {
                    child.castShadow = true;
                    if (!child.material.map && child.material.color) {
                        // Make trunk brown and leaves green
                        if (child.geometry instanceof THREE.CylinderGeometry && child.position.y < 1) {
                            child.material.color = new THREE.Color(0x4a3c28);
                        } else {
                            child.material.color = new THREE.Color(0x2d5a2b);
                        }
                    }
                }
            });
            
            this.scene.add(tree);
        });
        
        // Add additional decorative shapes around the scene (not below)
        this.addDecorativeShapes();
        
        // Store log radius for animation manager
        window.logRadius = this.logRadius || 1;
    }
    
    addDecorativeShapes() {
        // Add various shapes floating around and on the cliffs
        const shapes = [];
        
        // Floating cubes
        for (let i = 0; i < 5; i++) {
            const geometry = new THREE.BoxGeometry(0.5, 0.5, 0.5);
            const material = new THREE.MeshPhongMaterial({ 
                color: new THREE.Color(Math.random(), Math.random(), Math.random())
            });
            const cube = new THREE.Mesh(geometry, material);
            cube.position.set(
                (Math.random() - 0.5) * 30,
                2 + Math.random() * 5,
                (Math.random() - 0.5) * 20
            );
            cube.castShadow = true;
            this.scene.add(cube);
            shapes.push(cube);
        }
        
        // Spheres on cliffs
        for (let i = 0; i < 5; i++) {
            const geometry = new THREE.SphereGeometry(0.4, 8, 8);
            const material = new THREE.MeshPhongMaterial({ 
                color: new THREE.Color(0.5 + Math.random() * 0.5, 0.2, 0.5)
            });
            const sphere = new THREE.Mesh(geometry, material);
            const side = Math.random() > 0.5 ? -25 : 25;
            sphere.position.set(
                side + (Math.random() - 0.5) * 10,
                -0.5,
                (Math.random() - 0.5) * 15
            );
            sphere.castShadow = true;
            this.scene.add(sphere);
        }
        
        // Pyramids (tetrahedrons)
        for (let i = 0; i < 5; i++) {
            const geometry = new THREE.TetrahedronGeometry(0.6, 0);
            const material = new THREE.MeshPhongMaterial({ 
                color: 0xffaa00
            });
            const pyramid = new THREE.Mesh(geometry, material);
            pyramid.position.set(
                (Math.random() - 0.5) * 40,
                0 + Math.random() * 3,
                (Math.random() - 0.5) * 15
            );
            pyramid.rotation.y = Math.random() * Math.PI;
            pyramid.castShadow = true;
            this.scene.add(pyramid);
        }
        
        // Store shapes for potential animation
        window.decorativeShapes = shapes;
    }
}