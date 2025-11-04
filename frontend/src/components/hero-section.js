/**
 * Hero Section Component
 * Manages hero section with 3D background scene
 */

import { ThreeSceneService } from '../services/three-scene.js';
import { animationController } from '../services/animation-controller.js';
import * as THREE from 'three';

export class HeroSection {
  constructor() {
    this.container = null;
    this.canvasContainer = null;
    this.threeScene = null;
    this.animationFrame = null;
    this.baseCameraZ = 5;
    this.initScrollParallax();
  }

  /**
   * Initialize scroll-based parallax for camera movement
   */
  initScrollParallax() {
    if (!animationController.shouldAnimate()) return;

    const handleScroll = () => {
      if (!this.threeScene || !this.threeScene.isInitialized) return;

      const camera = this.threeScene.getCamera();
      if (!camera) return;

      const scrollY = window.scrollY || window.pageYOffset;
      const parallaxOffset = scrollY * 0.1; // Subtle parallax effect
      
      // Move camera slightly based on scroll
      camera.position.z = this.baseCameraZ + parallaxOffset;
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    
    // Store handler for cleanup
    this.scrollHandler = handleScroll;
  }

  /**
   * Initialize hero section
   */
  init(containerSelector) {
    this.container = typeof containerSelector === 'string' 
      ? document.querySelector(containerSelector)
      : containerSelector;

    if (!this.container) {
      console.error('Hero section container not found');
      return;
    }

    this.canvasContainer = this.container.querySelector('#three-canvas-container');
    
    if (this.canvasContainer) {
      this.initThreeScene();
    }
  }

  /**
   * Initialize Three.js scene
   */
  initThreeScene() {
    if (!this.canvasContainer) return;

    // Check for WebGL support
    if (!this.hasWebGLSupport()) {
      console.warn('WebGL not supported, skipping 3D scene');
      return;
    }

    try {
      this.threeScene = new ThreeSceneService(this.canvasContainer);
      this.threeScene.init();
      
      // Add basic 3D background scene with subtle animations
      this.createBackgroundScene();
    } catch (error) {
      console.error('Failed to initialize Three.js scene:', error);
    }
  }

  /**
   * Check for WebGL support
   */
  hasWebGLSupport() {
    try {
      const canvas = document.createElement('canvas');
      return !!(window.WebGLRenderingContext && 
                (canvas.getContext('webgl') || canvas.getContext('experimental-webgl')));
    } catch (e) {
      return false;
    }
  }

  /**
   * Create basic 3D background scene with procedural geometry
   */
  createBackgroundScene() {
    if (!this.threeScene || !this.threeScene.isInitialized) return;

    const scene = this.threeScene.getScene();
    if (!scene) return;

    // Create reusable geometries using object pool
    const boxGeometry = this.threeScene.getGeometry('box', [0.5, 0.5, 0.5]);
    const sphereGeometry = this.threeScene.getGeometry('sphere', [0.4, 16, 16]);
    const torusGeometry = this.threeScene.getGeometry('torus', [0.3, 0.1, 16, 32]);
    const octahedronGeometry = this.threeScene.getGeometry('octahedron', [0.4]);

    // Create materials
    const material1 = new THREE.MeshStandardMaterial({ 
      color: 0x3b82f6,
      opacity: 0.3,
      transparent: true,
      wireframe: false
    });
    const material2 = new THREE.MeshStandardMaterial({ 
      color: 0x2563eb,
      opacity: 0.25,
      transparent: true,
      wireframe: false
    });
    const material3 = new THREE.MeshStandardMaterial({ 
      color: 0x60a5fa,
      opacity: 0.2,
      transparent: true,
      wireframe: false
    });

    // Add floating geometric shapes
    for (let i = 0; i < 8; i++) {
      const geometries = [boxGeometry, sphereGeometry, torusGeometry, octahedronGeometry];
      const materials = [material1, material2, material3];
      const geometry = geometries[i % geometries.length];
      const material = materials[i % materials.length].clone();

      this.threeScene.createFloatingObject({
        geometry,
        material,
        range: {
          x: (Math.random() - 0.5) * 0.5,
          y: 0.3 + Math.random() * 0.4,
          z: (Math.random() - 0.5) * 0.5
        },
        speed: 0.3 + Math.random() * 0.4,
        phaseOffset: Math.random() * Math.PI * 2,
        position: {
          x: (Math.random() - 0.5) * 5,
          y: (Math.random() - 0.5) * 3,
          z: (Math.random() - 0.5) * 5
        }
      });
    }

    // Add orbiting objects around focal points
    const materials = [material1, material2, material3];
    for (let i = 0; i < 3; i++) {
      const geometries = [sphereGeometry, torusGeometry, octahedronGeometry];
      const material = materials[i % materials.length].clone();

      this.threeScene.createOrbitingObject({
        geometry: geometries[i % geometries.length],
        material,
        center: {
          x: (Math.random() - 0.5) * 3,
          y: (Math.random() - 0.5) * 2,
          z: 0
        },
        radius: 1.5 + Math.random() * 1,
        orbitSpeed: 0.2 + Math.random() * 0.3,
        initialAngle: Math.random() * Math.PI * 2
      });
    }

    // Add rotation animation for existing meshes
    this.animateScene();
  }

  /**
   * Animate the 3D scene
   */
  animateScene() {
    if (!this.threeScene || !this.threeScene.isInitialized) return;

    const scene = this.threeScene.getScene();
    if (!scene) return;

    const animate = () => {
      this.animationFrame = requestAnimationFrame(animate);

      // Rotate all meshes slowly
      scene.children.forEach((child) => {
        if (child instanceof THREE.Mesh) {
          child.rotation.x += 0.005;
          child.rotation.y += 0.005;
        }
      });

      this.threeScene.render();
    };

    animate();
  }

  /**
   * Cleanup and dispose
   */
  dispose() {
    if (this.animationFrame) {
      cancelAnimationFrame(this.animationFrame);
      this.animationFrame = null;
    }

    if (this.scrollHandler) {
      window.removeEventListener('scroll', this.scrollHandler);
      this.scrollHandler = null;
    }

    if (this.threeScene) {
      this.threeScene.dispose();
      this.threeScene = null;
    }
  }
}

