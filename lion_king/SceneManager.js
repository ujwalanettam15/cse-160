export class SceneManager {
    constructor() {
        // Create the scene and add fog
        this.scene = new THREE.Scene();
        this.scene.fog = new THREE.Fog(0x1a3d5c, 50, 200);

        // Create camera with perspective projection
        this.camera = new THREE.PerspectiveCamera(
            75,                                       // fov
            window.innerWidth / window.innerHeight,   // aspect ratio
            0.1,                                      // near clipping
            1000                                      // far clipping
        );
        this.camera.position.set(0, 5, 25);
        this.camera.lookAt(0, 0, 0);

        // Create renderer
        this.renderer = new THREE.WebGLRenderer({ antialias: true });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setPixelRatio(window.devicePixelRatio);
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
        this.renderer.toneMappingExposure = 1.0;
        this.renderer.outputEncoding = THREE.sRGBEncoding;

        // Append renderer DOM element to <body>
        document.body.appendChild(this.renderer.domElement);

        // Create a single big cliff box
        this.createCliffs();

        // Listen for window resize
        window.addEventListener('resize', () => this.onWindowResize());
    }

    createCliffs() {
        // One big box replacing two separate cliffs
        const width = 70;   // spans from x = -35 to x = +35
        const height = 10;
        const depth = 20;
        const cliffGeometry = new THREE.BoxGeometry(width, height, depth);
        const cliffMaterial = new THREE.MeshPhongMaterial({
            color: 0x2d5a2b, // Green color for grass
            roughness: 0.8,
            metalness: 0.1
        });

        const bigCliff = new THREE.Mesh(cliffGeometry, cliffMaterial);
        bigCliff.position.set(0, -6, 0); // Centered at origin in x
        bigCliff.receiveShadow = true;
        bigCliff.castShadow = true;
        this.scene.add(bigCliff);

        window.bigCliffTop = -1;
    }

    render() {
        this.renderer.render(this.scene, this.camera);
    }

    onWindowResize() {
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
    }
}
