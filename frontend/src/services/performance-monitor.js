/**
 * Performance Monitor Service
 * Tracks frame rate and performance metrics
 */

export class PerformanceMonitor {
  constructor() {
    this.frameCount = 0;
    this.lastTime = performance.now();
    this.fps = 60;
    this.averageFps = 60;
    this.frameTimes = [];
    this.isMonitoring = false;
    this.maxFrameHistory = 60;
    this.fpsHistory = [];
    this.maxFpsHistory = 30;
    this.adaptiveQualityThreshold = {
      high: 55,   // FPS threshold for high quality
      medium: 40  // FPS threshold for medium quality
    };
  }

  /**
   * Start monitoring performance
   */
  start() {
    this.isMonitoring = true;
    this.lastTime = performance.now();
    this.frameCount = 0;
    this.frameTimes = [];
    this.measure();
  }

  /**
   * Stop monitoring performance
   */
  stop() {
    this.isMonitoring = false;
  }

  /**
   * Measure frame rate
   */
  measure() {
    if (!this.isMonitoring) return;

    const currentTime = performance.now();
    const deltaTime = currentTime - this.lastTime;
    
    if (deltaTime >= 1000) {
      this.fps = this.frameCount;
      this.frameCount = 0;
      this.lastTime = currentTime;
      
      // Update FPS history
      this.fpsHistory.push(this.fps);
      if (this.fpsHistory.length > this.maxFpsHistory) {
        this.fpsHistory.shift();
      }
      
      // Calculate average FPS
      if (this.fpsHistory.length > 0) {
        const sum = this.fpsHistory.reduce((a, b) => a + b, 0);
        this.averageFps = sum / this.fpsHistory.length;
      }
      
      // Callback for FPS updates
      if (this.onFPSUpdate) {
        this.onFPSUpdate(this.fps, this.averageFps);
      }
    } else {
      this.frameCount++;
      this.frameTimes.push(deltaTime);
      
      // Keep only recent frame times
      if (this.frameTimes.length > this.maxFrameHistory) {
        this.frameTimes.shift();
      }
    }

    requestAnimationFrame(() => this.measure());
  }

  /**
   * Get current FPS
   */
  getFPS() {
    return this.fps;
  }

  /**
   * Get average frame time
   */
  getAverageFrameTime() {
    if (this.frameTimes.length === 0) return 16.67; // 60fps default
    
    const sum = this.frameTimes.reduce((a, b) => a + b, 0);
    return sum / this.frameTimes.length;
  }

  /**
   * Check if performance is acceptable
   */
  isPerformanceAcceptable() {
    return this.fps >= 30; // Minimum acceptable FPS
  }

  /**
   * Get average FPS
   */
  getAverageFPS() {
    return this.averageFps;
  }

  /**
   * Detect adaptive quality level based on FPS
   */
  detectAdaptiveQuality() {
    if (this.averageFps >= this.adaptiveQualityThreshold.high) {
      return 'high';
    } else if (this.averageFps >= this.adaptiveQualityThreshold.medium) {
      return 'medium';
    } else {
      return 'low';
    }
  }

  /**
   * Set callback for FPS updates
   */
  onFPSUpdate(callback) {
    this.onFPSUpdate = callback;
  }
}

// Export singleton instance
export const performanceMonitor = new PerformanceMonitor();

