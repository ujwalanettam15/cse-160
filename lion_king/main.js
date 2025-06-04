import { SceneManager } from './SceneManager.js';
import { ModelLoader } from './ModelLoader.js';
import { LightingManager } from './LightingManager.js';
import { AnimationManager } from './AnimationManager.js';
import { ControlsManager } from './ControlsManager.js';
import { EnvironmentManager } from './EnvironmentManager.js';

// Initialize the application
async function init() {
    // Hide loading screen
    const hideLoading = () => {
        document.getElementById('loading').style.display = 'none';
        document.getElementById('info').style.display = 'block';
    };

    try {
        // Create scene manager
        const sceneManager = new SceneManager();
        
        // Initialize managers
        const modelLoader = new ModelLoader(sceneManager.scene);
        const lightingManager = new LightingManager(sceneManager.scene);
        const environmentManager = new EnvironmentManager(sceneManager.scene);
        const controlsManager = new ControlsManager(sceneManager.camera, sceneManager.renderer.domElement);
        const animationManager = new AnimationManager();
        
        // Make managers globally accessible for cross-communication
        window.sceneManager = sceneManager;
        window.lightingManager = lightingManager;

        // Set up lighting
        lightingManager.setupLights();

        // Create environment
        environmentManager.createSkybox();
        environmentManager.createWater();
        environmentManager.createRocks();
        environmentManager.createFireflies();

        // Load models
        const models = await modelLoader.loadAllModels();
        
        // Set up animations
        animationManager.setupCharacterAnimation(models.lion, models.monkey);
        animationManager.setupFireflyAnimation(environmentManager.fireflies);
        
        // Hide loading screen
        hideLoading();

        // Animation loop
        function animate() {
            requestAnimationFrame(animate);
            
            // Update controls
            controlsManager.update();
            
            // Update animations
            animationManager.update();
            
            // Update environment
            environmentManager.update();
            
            // Render scene
            sceneManager.render();
        }

        animate();

        // Handle window resize
        window.addEventListener('resize', () => {
            sceneManager.onWindowResize();
        });

    } catch (error) {
        console.error('Error initializing scene:', error);
        document.getElementById('loading').textContent = 'Error loading scene. Please check console.';
    }
}

// Start the application
init();