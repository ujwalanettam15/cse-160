export class EnvironmentManager {
    constructor(scene) {
        this.scene = scene;
        this.fireflies = [];
        this.water = null;
        this.time = 0;
    }

    createSkybox() {
        // Create a large box for the skybox
        const skyGeometry = new THREE.BoxGeometry(500, 500, 500);
        
        // Create gradient material for each face
        const skyMaterials = [
            new THREE.MeshBasicMaterial({ color: 0x1a3d5c, side: THREE.BackSide }), // right
            new THREE.MeshBasicMaterial({ color: 0x1a3d5c, side: THREE.BackSide }), // left
            new THREE.MeshBasicMaterial({ color: 0x0f2845, side: THREE.BackSide }), // top
            new THREE.MeshBasicMaterial({ color: 0x2d5a7b, side: THREE.BackSide }), // bottom
            new THREE.MeshBasicMaterial({ color: 0x1a3d5c, side: THREE.BackSide }), // front
            new THREE.MeshBasicMaterial({ color: 0x1a3d5c, side: THREE.BackSide })  // back
        ];
        
        const skybox = new THREE.Mesh(skyGeometry, skyMaterials);
        this.scene.add(skybox);

        // Add stars
        this.createStars();
    }

    createStars() {
        const starsGeometry = new THREE.BufferGeometry();
        const starPositions = [];
        
        for (let i = 0; i < 1000; i++) {
            const x = (Math.random() - 0.5) * 400;
            const y = Math.random() * 200;
            const z = (Math.random() - 0.5) * 400;
            starPositions.push(x, y, z);
        }
        
        starsGeometry.setAttribute('position', new THREE.Float32BufferAttribute(starPositions, 3));
        
        const starsMaterial = new THREE.PointsMaterial({
            color: 0xffffff,
            size: 0.5,
            transparent: true,
            opacity: 0.8
        });
        
        const stars = new THREE.Points(starsGeometry, starsMaterial);
        this.scene.add(stars);
    }

    createWater() {
        // Create cliff/ground on both sides of the log
        const cliffGeometry = new THREE.BoxGeometry(30, 10, 20);
        const cliffMaterial = new THREE.MeshPhongMaterial({
            color: 0x2d5a2b // Green color for grass
        });
        
        // Left cliff
        const leftCliff = new THREE.Mesh(cliffGeometry, cliffMaterial);
        leftCliff.position.set(-20, -6, 0);
        leftCliff.receiveShadow = true;
        leftCliff.castShadow = true;
        this.scene.add(leftCliff);
        
        // Right cliff
        const rightCliff = new THREE.Mesh(cliffGeometry, cliffMaterial);
        rightCliff.position.set(20, -6, 0);
        rightCliff.receiveShadow = true;
        rightCliff.castShadow = true;
        this.scene.add(rightCliff);
        
        // Store cliff positions for tree placement
        window.leftCliffTop = -1; // Top of the cliff
        window.rightCliffTop = -1;
        
        // Create water far below
        const waterGeometry = new THREE.PlaneGeometry(100, 100, 32, 32);
        
        // Create water with animated waves
        const waterMaterial = new THREE.MeshPhongMaterial({
            color: 0x1a4d66,
            transparent: true,
            opacity: 0.9,
            shininess: 100,
            side: THREE.DoubleSide
        });
        
        this.water = new THREE.Mesh(waterGeometry, waterMaterial);
        this.water.rotation.x = -Math.PI / 2;
        this.water.position.y = -15; // Very far below
        this.water.receiveShadow = true;
        
        this.scene.add(this.water);
    }

    createRocks() {
        const rockGeometries = [
            new THREE.SphereGeometry(0.5, 6, 6),
            new THREE.BoxGeometry(0.8, 0.6, 0.8),
            new THREE.DodecahedronGeometry(0.6, 0),
            new THREE.TetrahedronGeometry(0.7, 0),
            new THREE.ConeGeometry(0.5, 0.8, 5),
            new THREE.OctahedronGeometry(0.6, 0)
        ];

        const rockMaterials = [
            new THREE.MeshPhongMaterial({ color: 0x444444 }),
            new THREE.MeshPhongMaterial({ color: 0x333333 }),
            new THREE.MeshPhongMaterial({ color: 0x555555 }),
            new THREE.MeshPhongMaterial({ color: 0x666666 })
        ];

        // Create rocks on cliffs and some floating
        for (let i = 0; i < 30; i++) {
            const geometry = rockGeometries[Math.floor(Math.random() * rockGeometries.length)];
            const material = rockMaterials[Math.floor(Math.random() * rockMaterials.length)];
            const rock = new THREE.Mesh(geometry, material);
            
            if (i < 10) {
                // Rocks in water (visible from above)
                rock.position.set(
                    (Math.random() - 0.5) * 40,
                    -14 + Math.random() * 2,
                    (Math.random() - 0.5) * 30
                );
                rock.scale.setScalar(1 + Math.random());
            } else if (i < 20) {
                // Rocks on cliff tops
                const side = Math.random() > 0.5 ? -1 : 1;
                rock.position.set(
                    side * (20 + Math.random() * 15),
                    -0.5 + Math.random() * 0.5,
                    (Math.random() - 0.5) * 15
                );
                rock.scale.setScalar(0.3 + Math.random() * 0.7);
            } else {
                // Floating rocks for visual interest
                rock.position.set(
                    (Math.random() - 0.5) * 30,
                    1 + Math.random() * 4,
                    (Math.random() - 0.5) * 20
                );
                rock.scale.setScalar(0.3 + Math.random() * 0.5);
                
                // Make floating rocks slightly glowing
                rock.material = rock.material.clone();
                rock.material.emissive = new THREE.Color(0x111111);
            }
            
            rock.rotation.set(
                Math.random() * Math.PI,
                Math.random() * Math.PI,
                Math.random() * Math.PI
            );
            
            rock.castShadow = true;
            rock.receiveShadow = true;
            
            this.scene.add(rock);
        }
    }

    createFireflies() {
        // Create glowing fireflies for WOW factor
        for (let i = 0; i < 20; i++) {
            const fireflyGroup = new THREE.Group();
            
            // Firefly body
            const bodyGeometry = new THREE.SphereGeometry(0.1, 8, 8);
            const bodyMaterial = new THREE.MeshBasicMaterial({
                color: 0xffff00,
                emissive: 0xffff00,
                emissiveIntensity: 1
            });
            const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
            fireflyGroup.add(body);
            
            // Glow effect
            const glowGeometry = new THREE.SphereGeometry(0.3, 8, 8);
            const glowMaterial = new THREE.MeshBasicMaterial({
                color: 0xffff00,
                transparent: true,
                opacity: 0.3
            });
            const glow = new THREE.Mesh(glowGeometry, glowMaterial);
            fireflyGroup.add(glow);
            
            // Add point light for each firefly
            const light = new THREE.PointLight(0xffff00, 0.5, 5);
            fireflyGroup.add(light);
            
            // Random initial position
            fireflyGroup.position.set(
                (Math.random() - 0.5) * 30,
                Math.random() * 10 - 2,
                (Math.random() - 0.5) * 20
            );
            
            // Store animation data
            fireflyGroup.userData = {
                offsetX: Math.random() * Math.PI * 2,
                offsetY: Math.random() * Math.PI * 2,
                offsetZ: Math.random() * Math.PI * 2,
                speed: 0.5 + Math.random() * 0.5,
                range: 5 + Math.random() * 5
            };
            
            this.fireflies.push(fireflyGroup);
            this.scene.add(fireflyGroup);
        }
    }

    update() {
        this.time += 0.01;
        
        // Animate water waves
        if (this.water && this.water.geometry) {
            const positions = this.water.geometry.attributes.position;
            for (let i = 0; i < positions.count; i++) {
                const x = positions.getX(i);
                const z = positions.getZ(i);
                const y = Math.sin(x * 0.1 + this.time) * 0.3 + 
                         Math.sin(z * 0.1 + this.time * 0.8) * 0.3;
                positions.setY(i, y);
            }
            positions.needsUpdate = true;
            this.water.geometry.computeVertexNormals();
        }
    }
}