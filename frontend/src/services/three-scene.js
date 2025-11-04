/**
 * Three.js Scene Service
 * Manages 3D scene initialization, rendering, and lifecycle
 */

import * as THREE from 'three';

export class ThreeSceneService {
  constructor(container) {
    this.container = container;
    this.scene = null;
    this.camera = null;
    this.renderer = null;
    this.animationId = null;
    this.isInitialized = false;
    this.frameRate = 60;
    this.lastFrameTime = 0;
    this.frameInterval = 1000 / this.frameRate;
    this.movingObjects = [];
    this.objectPool = {
      geometries: new Map(),
      materials: new Map()
    };
  }

  /**
   * Initialize Three.js scene with WebGL renderer, camera, and lighting
   */
  init() {
    if (this.isInitialized) {
      console.warn('Three.js scene already initialized');
      return;
    }

    // Create scene
    this.scene = new THREE.Scene();

    // Create camera
    const aspect = this.container.clientWidth / this.container.clientHeight;
    this.camera = new THREE.PerspectiveCamera(75, aspect, 0.1, 1000);
    this.camera.position.z = 5;

    // Create renderer
    this.renderer = new THREE.WebGLRenderer({ 
      antialias: true,
      alpha: true,
      powerPreference: 'high-performance'
    });
    this.renderer.setSize(this.container.clientWidth, this.container.clientHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.container.appendChild(this.renderer.domElement);

    // Add lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    this.scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(5, 5, 5);
    this.scene.add(directionalLight);

    // Handle window resize
    this.handleResize = this.handleResize.bind(this);
    window.addEventListener('resize', this.handleResize);

    this.isInitialized = true;
    this.startRenderLoop();
  }

  /**
   * Handle canvas resize
   */
  handleResize() {
    if (!this.isInitialized) return;

    const width = this.container.clientWidth;
    const height = this.container.clientHeight;

    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
  }

  /**
   * Start render loop with frame rate management
   */
  startRenderLoop() {
    const animate = (currentTime) => {
      this.animationId = requestAnimationFrame(animate);

      // Frame rate throttling
      const elapsed = currentTime - this.lastFrameTime;
      if (elapsed < this.frameInterval) return;
      this.lastFrameTime = currentTime - (elapsed % this.frameInterval);

      this.render();
    };

    animate(0);
  }

  /**
   * Render the scene
   */
  render() {
    if (this.renderer && this.scene && this.camera) {
      // Update moving objects before rendering
      this.updateMovingObjects();
      this.renderer.render(this.scene, this.camera);
    }
  }

  /**
   * Cleanup and dispose of resources
   */
  dispose() {
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
      this.animationId = null;
    }

    if (this.renderer) {
      this.renderer.dispose();
      if (this.renderer.domElement && this.renderer.domElement.parentNode) {
        this.renderer.domElement.parentNode.removeChild(this.renderer.domElement);
      }
      this.renderer = null;
    }

    // Clear moving objects
    this.clearMovingObjects();

    if (this.scene) {
      // Dispose of all scene objects
      this.scene.traverse((object) => {
        if (object.geometry) object.geometry.dispose();
        if (object.material) {
          if (Array.isArray(object.material)) {
            object.material.forEach((mat) => mat.dispose());
          } else {
            object.material.dispose();
          }
        }
      });
      this.scene = null;
    }

    // Clear object pool
    this.objectPool.geometries.forEach(geo => geo.dispose());
    this.objectPool.geometries.clear();
    this.objectPool.materials.forEach(mat => mat.dispose());
    this.objectPool.materials.clear();

    window.removeEventListener('resize', this.handleResize);
    this.isInitialized = false;
  }

  /**
   * Get the Three.js scene object
   */
  getScene() {
    return this.scene;
  }

  /**
   * Get the Three.js camera object
   */
  getCamera() {
    return this.camera;
  }

  /**
   * Get the Three.js renderer object
   */
  getRenderer() {
    return this.renderer;
  }

  /**
   * Create a floating object with sine wave motion
   * @param {Object} config - Configuration for floating object
   * @param {THREE.Geometry} config.geometry - Three.js geometry
   * @param {THREE.Material} config.material - Three.js material
   * @param {Object} config.range - Movement range {x, y, z}
   * @param {number} config.speed - Animation speed multiplier
   * @param {number} config.phaseOffset - Phase offset for sine wave
   * @returns {THREE.Mesh} The created floating mesh
   */
  createFloatingObject(config) {
    if (!this.isInitialized || !this.scene) return null;

    const {
      geometry,
      material,
      range = { x: 0, y: 1, z: 0 },
      speed = 1,
      phaseOffset = 0,
      position = { x: 0, y: 0, z: 0 }
    } = config;

    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(position.x, position.y, position.z);
    
    // Store animation properties
    mesh.userData = {
      type: 'float',
      range,
      speed,
      phaseOffset,
      basePosition: { ...position },
      time: phaseOffset
    };

    this.scene.add(mesh);
    this.movingObjects.push(mesh);
    
    return mesh;
  }

  /**
   * Create an orbiting object
   * @param {Object} config - Configuration for orbiting object
   * @param {THREE.Geometry} config.geometry - Three.js geometry
   * @param {THREE.Material} config.material - Three.js material
   * @param {Object} config.center - Orbit center {x, y, z}
   * @param {number} config.radius - Orbit radius
   * @param {number} config.orbitSpeed - Angular velocity
   * @param {number} config.initialAngle - Initial angle in radians
   * @returns {THREE.Mesh} The created orbiting mesh
   */
  createOrbitingObject(config) {
    if (!this.isInitialized || !this.scene) return null;

    const {
      geometry,
      material,
      center = { x: 0, y: 0, z: 0 },
      radius = 2,
      orbitSpeed = 0.5,
      initialAngle = 0
    } = config;

    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(
      center.x + radius * Math.cos(initialAngle),
      center.y,
      center.z + radius * Math.sin(initialAngle)
    );

    // Store orbit properties
    mesh.userData = {
      type: 'orbit',
      center,
      radius,
      orbitSpeed,
      angle: initialAngle
    };

    this.scene.add(mesh);
    this.movingObjects.push(mesh);

    return mesh;
  }

  /**
   * Update floating and orbiting objects animation
   * @param {number} deltaTime - Time since last frame in seconds
   */
  updateMovingObjects(deltaTime = 0.016) {
    const time = performance.now() * 0.001; // Convert to seconds

    this.movingObjects.forEach(obj => {
      if (!obj.userData) return;

      if (obj.userData.type === 'float') {
        const { range, speed, basePosition } = obj.userData;
        const phase = time * speed + obj.userData.phaseOffset;
        
        obj.position.x = basePosition.x + Math.sin(phase) * range.x;
        obj.position.y = basePosition.y + Math.sin(phase) * range.y;
        obj.position.z = basePosition.z + Math.sin(phase) * range.z;
      } else if (obj.userData.type === 'orbit') {
        const { center, radius, orbitSpeed } = obj.userData;
        obj.userData.angle += orbitSpeed * deltaTime;
        
        obj.position.x = center.x + radius * Math.cos(obj.userData.angle);
        obj.position.z = center.z + radius * Math.sin(obj.userData.angle);
      }
    });
  }

  /**
   * Get or create geometry from pool
   */
  getGeometry(type, params) {
    const key = `${type}_${JSON.stringify(params)}`;
    
    if (!this.objectPool.geometries.has(key)) {
      let geometry;
      switch (type) {
        case 'box':
          geometry = new THREE.BoxGeometry(...params);
          break;
        case 'sphere':
          geometry = new THREE.SphereGeometry(...params);
          break;
        case 'torus':
          geometry = new THREE.TorusGeometry(...params);
          break;
        case 'octahedron':
          geometry = new THREE.OctahedronGeometry(...params);
          break;
        default:
          geometry = new THREE.BoxGeometry(1, 1, 1);
      }
      this.objectPool.geometries.set(key, geometry);
    }
    
    return this.objectPool.geometries.get(key);
  }

  /**
   * Remove moving object from scene
   */
  removeMovingObject(mesh) {
    if (!mesh) return;
    
    const index = this.movingObjects.indexOf(mesh);
    if (index > -1) {
      this.movingObjects.splice(index, 1);
    }
    
    if (this.scene) {
      this.scene.remove(mesh);
      if (mesh.geometry) mesh.geometry.dispose();
      if (mesh.material) {
        if (Array.isArray(mesh.material)) {
          mesh.material.forEach(mat => mat.dispose());
        } else {
          mesh.material.dispose();
        }
      }
    }
  }

  /**
   * Clear all moving objects
   */
  clearMovingObjects() {
    this.movingObjects.forEach(obj => {
      if (this.scene) {
        this.scene.remove(obj);
        if (obj.geometry) obj.geometry.dispose();
        if (obj.material) {
          if (Array.isArray(obj.material)) {
            obj.material.forEach(mat => mat.dispose());
          } else {
            obj.material.dispose();
          }
        }
      }
    });
    this.movingObjects = [];
  }
}
