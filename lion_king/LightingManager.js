export class LightingManager {
    constructor(scene) {
        this.scene = scene;
        this.lights = {};
    }

    setupLights() {
        // 1. Ambient Light - overall scene illumination
        this.lights.ambient = new THREE.AmbientLight(0x404080, 0.4);
        this.scene.add(this.lights.ambient);

        // 2. Directional Light - moonlight effect
        this.lights.directional = new THREE.DirectionalLight(0xffffff, 0.8);
        this.lights.directional.position.set(-20, 30, -20);
        this.lights.directional.castShadow = true;
        this.lights.directional.shadow.mapSize.width = 2048;
        this.lights.directional.shadow.mapSize.height = 2048;
        this.lights.directional.shadow.camera.near = 0.5;
        this.lights.directional.shadow.camera.far = 100;
        this.lights.directional.shadow.camera.left = -30;
        this.lights.directional.shadow.camera.right = 30;
        this.lights.directional.shadow.camera.top = 30;
        this.lights.directional.shadow.camera.bottom = -30;
        this.scene.add(this.lights.directional);

        // 3. Point Light - moon glow
        this.lights.moonGlow = new THREE.PointLight(0xffffcc, 1.5, 100);
        this.lights.moonGlow.position.set(-15, 20, -30);
        this.lights.moonGlow.castShadow = true;
        this.scene.add(this.lights.moonGlow);

        // 4. Hemisphere Light - sky/ground color
        this.lights.hemisphere = new THREE.HemisphereLight(
            0x87CEEB, // sky color
            0x2d5a7b, // ground color
            0.3
        );
        this.lights.hemisphere.position.set(0, 50, 0);
        this.scene.add(this.lights.hemisphere);

        // 5. Spot Light - character highlight
        this.lights.spotlight = new THREE.SpotLight(0xffffff, 0.6);
        this.lights.spotlight.position.set(0, 15, 10);
        this.lights.spotlight.angle = Math.PI / 8;
        this.lights.spotlight.penumbra = 0.2;
        this.lights.spotlight.decay = 2;
        this.lights.spotlight.distance = 50;
        this.lights.spotlight.castShadow = true;
        this.lights.spotlight.shadow.mapSize.width = 1024;
        this.lights.spotlight.shadow.mapSize.height = 1024;
        this.scene.add(this.lights.spotlight);

        // Add spot light target
        this.lights.spotlightTarget = new THREE.Object3D();
        this.lights.spotlightTarget.position.set(0, 0, 0);
        this.scene.add(this.lights.spotlightTarget);
        this.lights.spotlight.target = this.lights.spotlightTarget;

        // 6. RectArea Light - water reflection (bonus)
        this.lights.rectArea = new THREE.RectAreaLight(0x4080ff, 2, 20, 10);
        this.lights.rectArea.position.set(0, -5, 0);
        this.lights.rectArea.lookAt(0, 0, 0);
        this.scene.add(this.lights.rectArea);

        // Optional: Add light helpers for debugging
        if (false) { // Set to true to see light helpers
            const directionalHelper = new THREE.DirectionalLightHelper(this.lights.directional, 5);
            this.scene.add(directionalHelper);
            
            const spotlightHelper = new THREE.SpotLightHelper(this.lights.spotlight);
            this.scene.add(spotlightHelper);
        }
    }

    updateSpotlightTarget(position) {
        if (this.lights.spotlightTarget) {
            this.lights.spotlightTarget.position.copy(position);
        }
    }
}