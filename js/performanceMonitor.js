/**
 * Performance Monitor for Towers of Hanoi
 * 
 * This module provides comprehensive performance monitoring, optimization,
 * and cross-browser compatibility testing.
 */

/**
 * Performance Monitor class
 */
class PerformanceMonitor {
    constructor() {
        this.metrics = {
            frameRate: {
                current: 0,
                average: 0,
                min: Infinity,
                max: 0,
                samples: [],
                target: 60
            },
            renderTime: {
                current: 0,
                average: 0,
                min: Infinity,
                max: 0,
                samples: []
            },
            memory: {
                used: 0,
                total: 0,
                limit: 0,
                samples: []
            },
            gameState: {
                updateTime: 0,
                validationTime: 0,
                samples: []
            }
        };
        
        this.monitoring = false;
        this.lastFrameTime = 0;
        this.frameCount = 0;
        this.sampleSize = 60; // Keep last 60 samples
        
        // Browser compatibility data
        this.browserSupport = {
            canvas: false,
            webgl: false,
            touchEvents: false,
            gamepadAPI: false,
            webAudio: false,
            localStorage: false,
            requestAnimationFrame: false,
            performance: false
        };
        
        // Performance thresholds
        this.thresholds = {
            minFrameRate: 30,
            maxRenderTime: 16.67, // 60fps = 16.67ms per frame
            maxMemoryIncrease: 50 * 1024 * 1024, // 50MB
            maxGameStateUpdateTime: 5 // 5ms
        };
        
        this.initialize();
    }
    
    /**
     * Initialize performance monitoring
     */
    initialize() {
        this.detectBrowserSupport();
        this.setupPerformanceObserver();
        this.startMonitoring();
    }
    
    /**
     * Detect browser support for various features
     */
    detectBrowserSupport() {
        // Canvas support
        try {
            const canvas = document.createElement('canvas');
            this.browserSupport.canvas = !!(canvas.getContext && canvas.getContext('2d'));
        } catch (e) {
            this.browserSupport.canvas = false;
        }
        
        // WebGL support
        try {
            const canvas = document.createElement('canvas');
            this.browserSupport.webgl = !!(canvas.getContext('webgl') || canvas.getContext('experimental-webgl'));
        } catch (e) {
            this.browserSupport.webgl = false;
        }
        
        // Touch events
        this.browserSupport.touchEvents = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
        
        // Gamepad API
        this.browserSupport.gamepadAPI = 'getGamepads' in navigator;
        
        // Web Audio API
        this.browserSupport.webAudio = !!(window.AudioContext || window.webkitAudioContext);
        
        // Local Storage
        try {
            localStorage.setItem('test', 'test');
            localStorage.removeItem('test');
            this.browserSupport.localStorage = true;
        } catch (e) {
            this.browserSupport.localStorage = false;
        }
        
        // RequestAnimationFrame
        this.browserSupport.requestAnimationFrame = !!(window.requestAnimationFrame || 
            window.webkitRequestAnimationFrame || 
            window.mozRequestAnimationFrame);
        
        // Performance API
        this.browserSupport.performance = !!(window.performance && window.performance.now);
        
        console.log('Browser Support:', this.browserSupport);
    }
    
    /**
     * Setup Performance Observer if available
     */
    setupPerformanceObserver() {
        if ('PerformanceObserver' in window) {
            try {
                const observer = new PerformanceObserver((list) => {
                    const entries = list.getEntries();
                    entries.forEach(entry => {
                        if (entry.entryType === 'measure') {
                            this.recordCustomMetric(entry.name, entry.duration);
                        }
                    });
                });
                
                observer.observe({ entryTypes: ['measure'] });
            } catch (e) {
                console.warn('PerformanceObserver not fully supported:', e);
            }
        }
    }
    
    /**
     * Start performance monitoring
     */
    startMonitoring() {
        this.monitoring = true;
        this.lastFrameTime = performance.now();
        this.monitorLoop();
    }
    
    /**
     * Stop performance monitoring
     */
    stopMonitoring() {
        this.monitoring = false;
    }
    
    /**
     * Main monitoring loop
     */
    monitorLoop() {
        if (!this.monitoring) return;
        
        const currentTime = performance.now();
        const deltaTime = currentTime - this.lastFrameTime;
        
        // Calculate frame rate
        if (deltaTime > 0) {
            const fps = 1000 / deltaTime;
            this.updateMetric('frameRate', fps);
        }
        
        // Monitor memory usage
        this.monitorMemory();
        
        this.lastFrameTime = currentTime;
        this.frameCount++;
        
        requestAnimationFrame(() => this.monitorLoop());
    }
    
    /**
     * Monitor memory usage
     */
    monitorMemory() {
        if (performance.memory) {
            const memory = {
                used: performance.memory.usedJSHeapSize,
                total: performance.memory.totalJSHeapSize,
                limit: performance.memory.jsHeapSizeLimit
            };
            
            this.metrics.memory = { ...memory };
            this.addSample('memory', memory.used);
        }
    }
    
    /**
     * Record render time
     */
    recordRenderTime(startTime, endTime) {
        const renderTime = endTime - startTime;
        this.updateMetric('renderTime', renderTime);
        
        // Mark performance if render time is too high
        if (renderTime > this.thresholds.maxRenderTime) {
            this.markPerformanceIssue('render', `Render time ${renderTime.toFixed(2)}ms exceeds threshold`);
        }
    }
    
    /**
     * Record game state update time
     */
    recordGameStateUpdate(startTime, endTime) {
        const updateTime = endTime - startTime;
        this.updateMetric('gameState', updateTime, 'updateTime');
        
        if (updateTime > this.thresholds.maxGameStateUpdateTime) {
            this.markPerformanceIssue('gameState', `Game state update ${updateTime.toFixed(2)}ms exceeds threshold`);
        }
    }
    
    /**
     * Update metric with new value
     */
    updateMetric(category, value, subcategory = 'current') {
        const metric = this.metrics[category];
        
        if (subcategory === 'current') {
            metric.current = value;
            metric.min = Math.min(metric.min, value);
            metric.max = Math.max(metric.max, value);
            
            this.addSample(category, value);
            
            // Calculate average
            if (metric.samples.length > 0) {
                metric.average = metric.samples.reduce((a, b) => a + b, 0) / metric.samples.length;
            }
        } else {
            metric[subcategory] = value;
        }
    }
    
    /**
     * Add sample to metric
     */
    addSample(category, value) {
        const metric = this.metrics[category];
        
        if (!metric.samples) {
            metric.samples = [];
        }
        
        metric.samples.push(value);
        
        // Keep only recent samples
        if (metric.samples.length > this.sampleSize) {
            metric.samples.shift();
        }
    }
    
    /**
     * Record custom metric
     */
    recordCustomMetric(name, value) {
        if (!this.metrics.custom) {
            this.metrics.custom = {};
        }
        
        if (!this.metrics.custom[name]) {
            this.metrics.custom[name] = {
                current: 0,
                average: 0,
                min: Infinity,
                max: 0,
                samples: []
            };
        }
        
        this.updateMetric('custom.' + name, value);
    }
    
    /**
     * Mark performance issue
     */
    markPerformanceIssue(category, message) {
        console.warn(`Performance Issue [${category}]: ${message}`);
        
        if (window.messageSystem) {
            window.messageSystem.showMessage(`Performance warning: ${message}`, 'warning', {
                duration: 5000
            });
        }
    }
    
    /**
     * Get performance report
     */
    getPerformanceReport() {
        const report = {
            timestamp: new Date().toISOString(),
            browserInfo: {
                userAgent: navigator.userAgent,
                platform: navigator.platform,
                language: navigator.language,
                cookieEnabled: navigator.cookieEnabled,
                onLine: navigator.onLine
            },
            browserSupport: this.browserSupport,
            metrics: this.metrics,
            performance: {
                frameRate: {
                    current: this.metrics.frameRate.current,
                    average: this.metrics.frameRate.average,
                    belowThreshold: this.metrics.frameRate.average < this.thresholds.minFrameRate
                },
                renderTime: {
                    current: this.metrics.renderTime.current,
                    average: this.metrics.renderTime.average,
                    aboveThreshold: this.metrics.renderTime.average > this.thresholds.maxRenderTime
                },
                memory: this.metrics.memory,
                overall: this.calculateOverallPerformance()
            },
            recommendations: this.generateRecommendations()
        };
        
        return report;
    }
    
    /**
     * Calculate overall performance score
     */
    calculateOverallPerformance() {
        let score = 100;
        
        // Frame rate penalty
        if (this.metrics.frameRate.average < this.thresholds.minFrameRate) {
            score -= 30;
        } else if (this.metrics.frameRate.average < 50) {
            score -= 15;
        }
        
        // Render time penalty
        if (this.metrics.renderTime.average > this.thresholds.maxRenderTime) {
            score -= 25;
        }
        
        // Memory penalty
        if (this.metrics.memory.used > this.thresholds.maxMemoryIncrease) {
            score -= 20;
        }
        
        // Browser support penalty
        const supportedFeatures = Object.values(this.browserSupport).filter(Boolean).length;
        const totalFeatures = Object.keys(this.browserSupport).length;
        const supportRatio = supportedFeatures / totalFeatures;
        
        if (supportRatio < 0.8) {
            score -= 15;
        }
        
        return Math.max(0, Math.min(100, score));
    }
    
    /**
     * Generate performance recommendations
     */
    generateRecommendations() {
        const recommendations = [];
        
        // Frame rate recommendations
        if (this.metrics.frameRate.average < this.thresholds.minFrameRate) {
            recommendations.push({
                category: 'frameRate',
                severity: 'high',
                message: 'Frame rate is below acceptable threshold',
                suggestions: [
                    'Reduce visual effects or animation complexity',
                    'Optimize rendering pipeline',
                    'Consider using requestAnimationFrame throttling'
                ]
            });
        }
        
        // Render time recommendations
        if (this.metrics.renderTime.average > this.thresholds.maxRenderTime) {
            recommendations.push({
                category: 'renderTime',
                severity: 'medium',
                message: 'Render time is above optimal threshold',
                suggestions: [
                    'Optimize canvas drawing operations',
                    'Use dirty rectangle rendering',
                    'Batch similar drawing operations'
                ]
            });
        }
        
        // Memory recommendations
        if (this.metrics.memory.used > this.thresholds.maxMemoryIncrease) {
            recommendations.push({
                category: 'memory',
                severity: 'medium',
                message: 'Memory usage is higher than expected',
                suggestions: [
                    'Check for memory leaks',
                    'Optimize object creation and disposal',
                    'Use object pooling for frequently created objects'
                ]
            });
        }
        
        // Browser support recommendations
        if (!this.browserSupport.canvas) {
            recommendations.push({
                category: 'compatibility',
                severity: 'high',
                message: 'Canvas not supported',
                suggestions: [
                    'Provide fallback for older browsers',
                    'Display compatibility warning'
                ]
            });
        }
        
        if (!this.browserSupport.requestAnimationFrame) {
            recommendations.push({
                category: 'compatibility',
                severity: 'medium',
                message: 'RequestAnimationFrame not supported',
                suggestions: [
                    'Use setTimeout fallback',
                    'Implement polyfill for smooth animations'
                ]
            });
        }
        
        return recommendations;
    }
    
    /**
     * Run performance benchmark
     */
    async runBenchmark() {
        console.log('🚀 Running Performance Benchmark...');
        
        const results = {
            renderingBenchmark: await this.benchmarkRendering(),
            gameLogicBenchmark: await this.benchmarkGameLogic(),
            memoryBenchmark: await this.benchmarkMemory(),
            inputBenchmark: await this.benchmarkInput()
        };
        
        console.log('📊 Benchmark Results:', results);
        return results;
    }
    
    /**
     * Benchmark rendering performance
     */
    async benchmarkRendering() {
        if (!window.renderer) {
            return { error: 'Renderer not available' };
        }
        
        const iterations = 100;
        const times = [];
        
        for (let i = 0; i < iterations; i++) {
            const startTime = performance.now();
            window.renderer.render();
            const endTime = performance.now();
            times.push(endTime - startTime);
        }
        
        return {
            iterations,
            averageTime: times.reduce((a, b) => a + b, 0) / times.length,
            minTime: Math.min(...times),
            maxTime: Math.max(...times),
            fps: 1000 / (times.reduce((a, b) => a + b, 0) / times.length)
        };
    }
    
    /**
     * Benchmark game logic performance
     */
    async benchmarkGameLogic() {
        if (!window.GameEngine || !window.GameState) {
            return { error: 'Game engine not available' };
        }
        
        const iterations = 1000;
        const times = [];
        
        for (let i = 0; i < iterations; i++) {
            const gameState = window.GameState.createGameState(3);
            
            const startTime = performance.now();
            window.GameEngine.validateMove(gameState, 0, 1);
            window.GameEngine.makeMove(gameState, 0, 1);
            const endTime = performance.now();
            
            times.push(endTime - startTime);
        }
        
        return {
            iterations,
            averageTime: times.reduce((a, b) => a + b, 0) / times.length,
            minTime: Math.min(...times),
            maxTime: Math.max(...times)
        };
    }
    
    /**
     * Benchmark memory usage
     */
    async benchmarkMemory() {
        if (!performance.memory) {
            return { error: 'Memory API not available' };
        }
        
        const initialMemory = performance.memory.usedJSHeapSize;
        const gameStates = [];
        
        // Create many game states
        for (let i = 0; i < 1000; i++) {
            gameStates.push(window.GameState.createGameState(8));
        }
        
        const peakMemory = performance.memory.usedJSHeapSize;
        
        // Clear references
        gameStates.length = 0;
        
        // Force garbage collection if available
        if (window.gc) {
            window.gc();
        }
        
        // Wait a bit for GC
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        const finalMemory = performance.memory.usedJSHeapSize;
        
        return {
            initialMemory,
            peakMemory,
            finalMemory,
            memoryIncrease: peakMemory - initialMemory,
            memoryLeaked: finalMemory - initialMemory
        };
    }
    
    /**
     * Benchmark input handling
     */
    async benchmarkInput() {
        if (!window.inputHandler) {
            return { error: 'Input handler not available' };
        }
        
        const iterations = 100;
        const times = [];
        
        for (let i = 0; i < iterations; i++) {
            const startTime = performance.now();
            
            // Simulate mouse event
            const mouseEvent = new MouseEvent('mousedown', {
                clientX: 100,
                clientY: 100,
                bubbles: true
            });
            
            document.getElementById('game-canvas').dispatchEvent(mouseEvent);
            
            const endTime = performance.now();
            times.push(endTime - startTime);
        }
        
        return {
            iterations,
            averageTime: times.reduce((a, b) => a + b, 0) / times.length,
            minTime: Math.min(...times),
            maxTime: Math.max(...times)
        };
    }
    
    /**
     * Test cross-browser compatibility
     */
    testCrossBrowserCompatibility() {
        const compatibility = {
            browser: this.detectBrowser(),
            features: this.browserSupport,
            issues: [],
            recommendations: []
        };
        
        // Check for known issues
        if (compatibility.browser.name === 'Internet Explorer') {
            compatibility.issues.push('Internet Explorer has limited support for modern web features');
            compatibility.recommendations.push('Consider upgrading to a modern browser');
        }
        
        if (!this.browserSupport.canvas) {
            compatibility.issues.push('Canvas API not supported');
            compatibility.recommendations.push('Game cannot run without Canvas support');
        }
        
        if (!this.browserSupport.requestAnimationFrame) {
            compatibility.issues.push('RequestAnimationFrame not supported');
            compatibility.recommendations.push('Animations may be less smooth');
        }
        
        if (!this.browserSupport.localStorage) {
            compatibility.issues.push('LocalStorage not supported');
            compatibility.recommendations.push('Game settings cannot be saved');
        }
        
        return compatibility;
    }
    
    /**
     * Detect browser information
     */
    detectBrowser() {
        const userAgent = navigator.userAgent;
        let browser = { name: 'Unknown', version: 'Unknown' };
        
        if (userAgent.includes('Chrome')) {
            browser.name = 'Chrome';
            browser.version = userAgent.match(/Chrome\/(\d+)/)?.[1] || 'Unknown';
        } else if (userAgent.includes('Firefox')) {
            browser.name = 'Firefox';
            browser.version = userAgent.match(/Firefox\/(\d+)/)?.[1] || 'Unknown';
        } else if (userAgent.includes('Safari') && !userAgent.includes('Chrome')) {
            browser.name = 'Safari';
            browser.version = userAgent.match(/Version\/(\d+)/)?.[1] || 'Unknown';
        } else if (userAgent.includes('Edge')) {
            browser.name = 'Edge';
            browser.version = userAgent.match(/Edge\/(\d+)/)?.[1] || 'Unknown';
        } else if (userAgent.includes('MSIE') || userAgent.includes('Trident')) {
            browser.name = 'Internet Explorer';
            browser.version = userAgent.match(/(?:MSIE |rv:)(\d+)/)?.[1] || 'Unknown';
        }
        
        return browser;
    }
    
    /**
     * Optimize performance based on current metrics
     */
    optimizePerformance() {
        const optimizations = [];
        
        // Frame rate optimization
        if (this.metrics.frameRate.average < this.thresholds.minFrameRate) {
            // Reduce animation quality
            if (window.animationSystem) {
                window.animationSystem.setQuality('low');
                optimizations.push('Reduced animation quality');
            }
            
            // Throttle rendering
            if (window.renderer) {
                window.renderer.setThrottling(true);
                optimizations.push('Enabled render throttling');
            }
        }
        
        // Memory optimization
        if (this.metrics.memory.used > this.thresholds.maxMemoryIncrease) {
            // Force garbage collection if available
            if (window.gc) {
                window.gc();
                optimizations.push('Forced garbage collection');
            }
            
            // Clear caches
            if (window.renderer && window.renderer.clearCache) {
                window.renderer.clearCache();
                optimizations.push('Cleared render cache');
            }
        }
        
        console.log('Applied optimizations:', optimizations);
        return optimizations;
    }
}

// Create global performance monitor
let performanceMonitor = null;

// Export for use by other modules
if (typeof module !== 'undefined' && module.exports) {
    // Node.js environment
    module.exports = { PerformanceMonitor };
} else {
    // Browser environment
    window.PerformanceMonitor = PerformanceMonitor;
    
    // Initialize performance monitor
    document.addEventListener('DOMContentLoaded', () => {
        performanceMonitor = new PerformanceMonitor();
        window.performanceMonitor = performanceMonitor;
        
        // Add global functions
        window.getPerformanceReport = () => performanceMonitor.getPerformanceReport();
        window.runPerformanceBenchmark = () => performanceMonitor.runBenchmark();
        window.testBrowserCompatibility = () => performanceMonitor.testCrossBrowserCompatibility();
    });
}