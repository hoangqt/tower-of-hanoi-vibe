/**
 * Animation System for Towers of Hanoi
 * 
 * This module handles all animations including disk movements, visual effects,
 * and smooth transitions between game states.
 */

/**
 * Animation System class for managing smooth animations
 */
class AnimationSystem {
    constructor(renderer, gameState) {
        this.renderer = renderer;
        this.gameState = gameState;
        
        // Animation state
        this.isAnimating = false;
        this.animationQueue = [];
        this.currentAnimation = null;
        
        // Animation settings
        this.settings = {
            diskMoveSpeed: 300, // milliseconds
            diskLiftHeight: 50, // pixels above highest disk
            easingFunction: 'easeInOutCubic',
            frameRate: 60
        };
        
        // Animation frame tracking
        this.lastFrameTime = 0;
        this.animationId = null;
        
        // Easing functions
        this.easingFunctions = {
            linear: t => t,
            easeInQuad: t => t * t,
            easeOutQuad: t => t * (2 - t),
            easeInOutQuad: t => t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t,
            easeInCubic: t => t * t * t,
            easeOutCubic: t => (--t) * t * t + 1,
            easeInOutCubic: t => t < 0.5 ? 4 * t * t * t : (t - 1) * (2 * t - 2) * (2 * t - 2) + 1,
            easeInOutElastic: t => {
                if (t === 0 || t === 1) return t;
                const p = 0.3;
                const s = p / 4;
                if (t < 0.5) {
                    t *= 2;
                    return -0.5 * Math.pow(2, 10 * (t - 1)) * Math.sin((t - 1 - s) * (2 * Math.PI) / p);
                }
                t = t * 2 - 1;
                return 0.5 * Math.pow(2, -10 * t) * Math.sin((t - s) * (2 * Math.PI) / p) + 1;
            }
        };
        
        // Visual effects state
        this.effects = {
            selectedDiskPulse: { time: 0, intensity: 1 },
            hintPulse: { time: 0, opacity: 0.5 },
            invalidMoveShake: { active: false, time: 0, intensity: 0 },
            winCelebration: { active: false, time: 0, particles: [] }
        };
    }
    
    /**
     * Start the animation loop
     */
    start() {
        if (this.animationId) return; // Already running
        
        const animate = (currentTime) => {
            const deltaTime = currentTime - this.lastFrameTime;
            
            if (deltaTime >= 1000 / this.settings.frameRate) {
                this.update(deltaTime);
                this.render();
                this.lastFrameTime = currentTime;
            }
            
            this.animationId = requestAnimationFrame(animate);
        };
        
        this.animationId = requestAnimationFrame(animate);
    }
    
    /**
     * Stop the animation loop
     */
    stop() {
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
            this.animationId = null;
        }
    }
    
    /**
     * Update all animations
     */
    update(deltaTime) {
        // Update current animation
        if (this.currentAnimation) {
            this.updateCurrentAnimation(deltaTime);
        }
        
        // Update visual effects
        this.updateVisualEffects(deltaTime);
        
        // Process animation queue
        if (!this.currentAnimation && this.animationQueue.length > 0) {
            this.startNextAnimation();
        }
    }
    
    /**
     * Render the current frame
     */
    render() {
        if (this.renderer) {
            this.renderer.render();
        }
    }
    
    /**
     * Animate a disk move from one rod to another
     * @param {number} diskSize - Size of the disk to move
     * @param {number} fromRod - Source rod index (0, 1, or 2)
     * @param {number} toRod - Destination rod index (0, 1, or 2)
     * @param {Function} onComplete - Callback when animation completes
     */
    animateDiskMove(diskSize, fromRod, toRod, onComplete = null) {
        const animation = {
            type: 'diskMove',
            diskSize,
            fromRod,
            toRod,
            startTime: 0,
            duration: this.settings.diskMoveSpeed,
            progress: 0,
            onComplete,
            
            // Calculate positions
            startPos: this.getDiskPosition(diskSize, fromRod),
            endPos: this.getDiskPosition(diskSize, toRod),
            liftHeight: this.calculateLiftHeight(fromRod, toRod),
            
            // Animation phases: lift -> move -> drop
            phase: 'lift', // 'lift', 'move', 'drop'
            phaseProgress: 0
        };
        
        // Add to queue
        this.animationQueue.push(animation);
        
        // Start immediately if not animating
        if (!this.isAnimating) {
            this.startNextAnimation();
        }
    }
    
    /**
     * Start the next animation in the queue
     */
    startNextAnimation() {
        if (this.animationQueue.length === 0) {
            this.isAnimating = false;
            this.currentAnimation = null;
            return;
        }
        
        this.currentAnimation = this.animationQueue.shift();
        this.currentAnimation.startTime = performance.now();
        this.isAnimating = true;
    }
    
    /**
     * Update the current animation
     */
    updateCurrentAnimation(deltaTime) {
        if (!this.currentAnimation) return;
        
        const elapsed = performance.now() - this.currentAnimation.startTime;
        const progress = Math.min(elapsed / this.currentAnimation.duration, 1);
        
        this.currentAnimation.progress = progress;
        
        if (this.currentAnimation.type === 'diskMove') {
            this.updateDiskMoveAnimation(this.currentAnimation);
        }
        
        // Check if animation is complete
        if (progress >= 1) {
            this.completeCurrentAnimation();
        }
    }
    
    /**
     * Update disk move animation
     */
    updateDiskMoveAnimation(animation) {
        const { progress, startPos, endPos, liftHeight } = animation;
        const easing = this.easingFunctions[this.settings.easingFunction];
        
        // Calculate current position based on animation phase
        let currentPos = { x: startPos.x, y: startPos.y };
        
        if (progress < 0.33) {
            // Lift phase
            animation.phase = 'lift';
            animation.phaseProgress = progress / 0.33;
            const liftProgress = easing(animation.phaseProgress);
            currentPos.y = startPos.y - (liftHeight * liftProgress);
        } else if (progress < 0.67) {
            // Move phase
            animation.phase = 'move';
            animation.phaseProgress = (progress - 0.33) / 0.34;
            const moveProgress = easing(animation.phaseProgress);
            currentPos.x = startPos.x + (endPos.x - startPos.x) * moveProgress;
            currentPos.y = startPos.y - liftHeight;
        } else {
            // Drop phase
            animation.phase = 'drop';
            animation.phaseProgress = (progress - 0.67) / 0.33;
            const dropProgress = easing(animation.phaseProgress);
            currentPos.x = endPos.x;
            currentPos.y = (startPos.y - liftHeight) + (endPos.y - (startPos.y - liftHeight)) * dropProgress;
        }
        
        // Store current position for rendering
        animation.currentPos = currentPos;
    }
    
    /**
     * Complete the current animation
     */
    completeCurrentAnimation() {
        if (this.currentAnimation && this.currentAnimation.onComplete) {
            this.currentAnimation.onComplete();
        }
        
        this.currentAnimation = null;
        
        // Start next animation if available
        if (this.animationQueue.length > 0) {
            this.startNextAnimation();
        } else {
            this.isAnimating = false;
        }
    }
    
    /**
     * Get the position of a disk on a specific rod
     */
    getDiskPosition(diskSize, rodIndex) {
        if (!this.gameState || !this.renderer) {
            return { x: 0, y: 0 };
        }
        
        const layout = this.renderer.layout;
        const rod = this.gameState.rods[rodIndex];
        
        // Find disk position on the rod
        let diskIndex = -1;
        for (let i = 0; i < rod.disks.length; i++) {
            if (rod.disks[i] === diskSize) {
                diskIndex = i;
                break;
            }
        }
        
        if (diskIndex === -1) {
            // Disk not found, calculate where it would be placed
            diskIndex = rod.disks.length;
        }
        
        const rodCenterX = layout.rodSpacing * (rodIndex + 1);
        const diskY = layout.baseY - layout.diskHeight - (diskIndex * layout.diskHeight);
        
        return { x: rodCenterX, y: diskY };
    }
    
    /**
     * Calculate the lift height for a disk move animation
     */
    calculateLiftHeight(fromRod, toRod) {
        if (!this.gameState || !this.renderer) {
            return this.settings.diskLiftHeight;
        }
        
        // Find the highest disk on both rods
        const fromRodHeight = this.gameState.rods[fromRod].disks.length;
        const toRodHeight = this.gameState.rods[toRod].disks.length;
        const maxHeight = Math.max(fromRodHeight, toRodHeight);
        
        // Add extra height for clearance
        return this.settings.diskLiftHeight + (maxHeight * this.renderer.layout.diskHeight);
    }
    
    /**
     * Update visual effects
     */
    updateVisualEffects(deltaTime) {
        const time = performance.now();
        
        // Update selected disk pulse
        this.effects.selectedDiskPulse.time = time;
        this.effects.selectedDiskPulse.intensity = Math.sin(time * 0.005) * 0.3 + 0.7;
        
        // Update hint pulse
        this.effects.hintPulse.time = time;
        this.effects.hintPulse.opacity = Math.sin(time * 0.003) * 0.2 + 0.6;
        
        // Update invalid move shake
        if (this.effects.invalidMoveShake.active) {
            this.effects.invalidMoveShake.time += deltaTime;
            const shakeTime = this.effects.invalidMoveShake.time;
            
            if (shakeTime < 500) { // 500ms shake duration
                this.effects.invalidMoveShake.intensity = Math.sin(shakeTime * 0.05) * (1 - shakeTime / 500);
            } else {
                this.effects.invalidMoveShake.active = false;
                this.effects.invalidMoveShake.intensity = 0;
            }
        }
        
        // Update win celebration
        if (this.effects.winCelebration.active) {
            this.updateWinCelebration(deltaTime);
        }
    }
    
    /**
     * Trigger invalid move shake effect
     */
    triggerInvalidMoveShake() {
        this.effects.invalidMoveShake.active = true;
        this.effects.invalidMoveShake.time = 0;
        this.effects.invalidMoveShake.intensity = 1;
    }
    
    /**
     * Start win celebration animation
     */
    startWinCelebration() {
        this.effects.winCelebration.active = true;
        this.effects.winCelebration.time = 0;
        this.effects.winCelebration.particles = this.createCelebrationParticles();
    }
    
    /**
     * Create celebration particles
     */
    createCelebrationParticles() {
        const particles = [];
        const canvas = this.renderer.canvas;
        
        for (let i = 0; i < 50; i++) {
            particles.push({
                x: Math.random() * canvas.width,
                y: canvas.height + Math.random() * 100,
                vx: (Math.random() - 0.5) * 4,
                vy: -Math.random() * 8 - 2,
                color: this.renderer.colors.disks[Math.floor(Math.random() * this.renderer.colors.disks.length)],
                size: Math.random() * 6 + 2,
                life: 1,
                decay: Math.random() * 0.02 + 0.01
            });
        }
        
        return particles;
    }
    
    /**
     * Update win celebration particles
     */
    updateWinCelebration(deltaTime) {
        const particles = this.effects.winCelebration.particles;
        
        for (let i = particles.length - 1; i >= 0; i--) {
            const particle = particles[i];
            
            // Update position
            particle.x += particle.vx;
            particle.y += particle.vy;
            particle.vy += 0.2; // gravity
            
            // Update life
            particle.life -= particle.decay;
            
            // Remove dead particles
            if (particle.life <= 0 || particle.y > this.renderer.canvas.height + 50) {
                particles.splice(i, 1);
            }
        }
        
        // Stop celebration when all particles are gone
        if (particles.length === 0) {
            this.effects.winCelebration.active = false;
        }
    }
    
    /**
     * Render celebration particles
     */
    renderCelebrationParticles(ctx) {
        if (!this.effects.winCelebration.active) return;
        
        const particles = this.effects.winCelebration.particles;
        
        for (const particle of particles) {
            ctx.save();
            ctx.globalAlpha = particle.life;
            ctx.fillStyle = particle.color;
            ctx.beginPath();
            ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
        }
    }
    
    /**
     * Get current animation state for rendering
     */
    getAnimationState() {
        return {
            isAnimating: this.isAnimating,
            currentAnimation: this.currentAnimation,
            effects: this.effects
        };
    }
    
    /**
     * Check if currently animating
     */
    isCurrentlyAnimating() {
        return this.isAnimating;
    }
    
    /**
     * Clear all animations
     */
    clearAnimations() {
        this.animationQueue = [];
        this.currentAnimation = null;
        this.isAnimating = false;
        
        // Reset effects
        this.effects.invalidMoveShake.active = false;
        this.effects.winCelebration.active = false;
    }
    
    /**
     * Set animation speed
     */
    setAnimationSpeed(speed) {
        this.settings.diskMoveSpeed = Math.max(100, Math.min(1000, speed));
    }
    
    /**
     * Update game state reference
     */
    updateGameState(gameState) {
        this.gameState = gameState;
    }
    
    /**
     * Update renderer reference
     */
    updateRenderer(renderer) {
        this.renderer = renderer;
    }
}

// Export for use by other modules
if (typeof module !== 'undefined' && module.exports) {
    // Node.js environment (for testing)
    module.exports = { AnimationSystem };
} else {
    // Browser environment
    window.AnimationSystem = AnimationSystem;
}