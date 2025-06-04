export class ControlsManager {
    constructor(camera, domElement) {
        this.camera = camera;
        this.domElement = domElement;
        
        // Mouse state
        this.mouseX = 0;
        this.mouseY = 0;
        this.targetX = 0;
        this.targetY = 0;
        this.isLeftMouseDown = false;
        this.isRightMouseDown = false;
        
        // Camera spherical coordinates
        this.spherical = {
            radius: 25,
            theta: 0,
            phi: Math.PI / 3
        };
        
        // Camera target
        this.target = new THREE.Vector3(0, 0, 0);
        
        this.setupEventListeners();
    }
    
    setupEventListeners() {
        // Mouse events
        this.domElement.addEventListener('mousedown', (e) => this.onMouseDown(e));
        this.domElement.addEventListener('mouseup', (e) => this.onMouseUp(e));
        this.domElement.addEventListener('mousemove', (e) => this.onMouseMove(e));
        this.domElement.addEventListener('wheel', (e) => this.onMouseWheel(e));
        
        // Touch events for mobile
        this.domElement.addEventListener('touchstart', (e) => this.onTouchStart(e));
        this.domElement.addEventListener('touchmove', (e) => this.onTouchMove(e));
        this.domElement.addEventListener('touchend', (e) => this.onTouchEnd(e));
        
        // Prevent context menu on right click
        this.domElement.addEventListener('contextmenu', (e) => e.preventDefault());
    }
    
    onMouseDown(event) {
        if (event.button === 0) {
            this.isLeftMouseDown = true;
        } else if (event.button === 2) {
            this.isRightMouseDown = true;
        }
        
        this.mouseX = event.clientX;
        this.mouseY = event.clientY;
    }
    
    onMouseUp(event) {
        if (event.button === 0) {
            this.isLeftMouseDown = false;
        } else if (event.button === 2) {
            this.isRightMouseDown = false;
        }
    }
    
    onMouseMove(event) {
        if (!this.isLeftMouseDown && !this.isRightMouseDown) return;
        
        const deltaX = event.clientX - this.mouseX;
        const deltaY = event.clientY - this.mouseY;
        
        if (this.isLeftMouseDown) {
            // Rotate camera
            this.spherical.theta -= deltaX * 0.01;
            this.spherical.phi += deltaY * 0.01;
            
            // Clamp phi to prevent flipping
            this.spherical.phi = Math.max(0.1, Math.min(Math.PI - 0.1, this.spherical.phi));
        } else if (this.isRightMouseDown) {
            // Pan camera
            const panSpeed = 0.05;
            const right = new THREE.Vector3();
            const up = new THREE.Vector3();
            
            this.camera.getWorldDirection(new THREE.Vector3());
            right.setFromMatrixColumn(this.camera.matrix, 0);
            up.setFromMatrixColumn(this.camera.matrix, 1);
            
            this.target.addScaledVector(right, -deltaX * panSpeed);
            this.target.addScaledVector(up, deltaY * panSpeed);
        }
        
        this.mouseX = event.clientX;
        this.mouseY = event.clientY;
    }
    
    onMouseWheel(event) {
        event.preventDefault();
        
        // Zoom in/out
        this.spherical.radius += event.deltaY * 0.05;
        this.spherical.radius = Math.max(10, Math.min(50, this.spherical.radius));
    }
    
    onTouchStart(event) {
        if (event.touches.length === 1) {
            this.isLeftMouseDown = true;
            this.mouseX = event.touches[0].clientX;
            this.mouseY = event.touches[0].clientY;
        }
    }
    
    onTouchMove(event) {
        if (event.touches.length === 1 && this.isLeftMouseDown) {
            const deltaX = event.touches[0].clientX - this.mouseX;
            const deltaY = event.touches[0].clientY - this.mouseY;
            
            this.spherical.theta -= deltaX * 0.01;
            this.spherical.phi += deltaY * 0.01;
            this.spherical.phi = Math.max(0.1, Math.min(Math.PI - 0.1, this.spherical.phi));
            
            this.mouseX = event.touches[0].clientX;
            this.mouseY = event.touches[0].clientY;
        }
    }
    
    onTouchEnd(event) {
        this.isLeftMouseDown = false;
    }
    
    update() {
        // Convert spherical coordinates to Cartesian
        const x = this.spherical.radius * Math.sin(this.spherical.phi) * Math.cos(this.spherical.theta);
        const y = this.spherical.radius * Math.cos(this.spherical.phi);
        const z = this.spherical.radius * Math.sin(this.spherical.phi) * Math.sin(this.spherical.theta);
        
        // Update camera position
        this.camera.position.set(
            x + this.target.x,
            y + this.target.y,
            z + this.target.z
        );
        
        // Look at target
        this.camera.lookAt(this.target);
    }
}