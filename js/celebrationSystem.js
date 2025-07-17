/**
 * Celebration and Feedback System for Towers of Hanoi
 * 
 * This module handles win celebrations, performance feedback, and achievement system
 * to provide engaging feedback when players complete the puzzle.
 */

/**
 * Celebration System class for managing win celebrations and feedback
 */
class CelebrationSystem {
    constructor(canvas, gameState, animationSystem) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.gameState = gameState;
        this.animationSystem = animationSystem;
        
        // Celebration state
        this.celebrationState = {
            isActive: false,
            startTime: 0,
            duration: 5000, // 5 seconds
            particles: [],
            confetti: [],
            fireworks: []
        };
        
        // Achievement definitions
        this.achievements = {
            perfectSolution: {
                id: 'perfect',
                name: 'Perfect Solution!',
                description: 'Solved with optimal number of moves',
                icon: '🏆',
                condition: (stats) => stats.isOptimalSolution
            },
            speedDemon: {
                id: 'speed',
                name: 'Speed Demon',
                description: 'Solved in under 30 seconds',
                icon: '⚡',
                condition: (stats) => stats.timeElapsed < 30
            },
            efficient: {
                id: 'efficient',
                name: 'Efficient Player',
                description: 'Achieved 80% efficiency or better',
                icon: '🎯',
                condition: (stats) => stats.efficiency >= 80
            },
            persistent: {
                id: 'persistent',
                name: 'Never Give Up',
                description: 'Solved with more than double optimal moves',
                icon: '💪',
                condition: (stats) => stats.moveCount > stats.optimalMoves * 2
            },
            firstWin: {
                id: 'first',
                name: 'First Victory!',
                description: 'Completed your first puzzle',
                icon: '🌟',
                condition: () => !localStorage.getItem('toh_first_win')
            }
        };
        
        // Performance messages
        this.performanceMessages = {
            perfect: [
                "Absolutely perfect! You're a Towers of Hanoi master!",
                "Flawless execution! You solved it optimally!",
                "Outstanding! You found the perfect solution!"
            ],
            excellent: [
                "Excellent work! Very close to optimal!",
                "Great job! You're getting really good at this!",
                "Impressive! Almost perfect solution!"
            ],
            good: [
                "Good job! You're improving with each attempt!",
                "Nice work! Keep practicing to get even better!",
                "Well done! You're on the right track!"
            ],
            needsWork: [
                "You solved it! Practice makes perfect!",
                "Completed! Try to use fewer moves next time!",
                "Success! Challenge yourself to be more efficient!"
            ]
        };
    }
    
    /**
     * Trigger win celebration with performance analysis
     * @param {Object} gameStats - Game statistics
     */
    startWinCelebration(gameStats) {
        if (this.celebrationState.isActive) {
            return; // Already celebrating
        }
        
        console.log('Starting win celebration with stats:', gameStats);
        
        // Initialize celebration
        this.celebrationState.isActive = true;
        this.celebrationState.startTime = Date.now();
        
        // Generate celebration effects
        this.generateConfetti();
        this.generateFireworks();
        
        // Analyze performance and show feedback
        const performanceAnalysis = this.analyzePerformance(gameStats);
        this.showPerformanceFeedback(performanceAnalysis);
        
        // Check and award achievements
        const achievements = this.checkAchievements(gameStats);
        if (achievements.length > 0) {
            this.showAchievements(achievements);
        }
        
        // Start celebration animation
        this.animateCelebration();
        
        // Mark first win if applicable
        if (!localStorage.getItem('toh_first_win')) {
            localStorage.setItem('toh_first_win', 'true');
        }
    }
    
    /**
     * Analyze player performance
     * @param {Object} gameStats - Game statistics
     * @returns {Object} Performance analysis
     */
    analyzePerformance(gameStats) {
        const efficiency = gameStats.efficiency || 0;
        const timeElapsed = gameStats.timeElapsed || 0;
        const moveCount = gameStats.moveCount || 0;
        const optimalMoves = gameStats.optimalMoves || 0;
        
        let performanceLevel;
        let grade;
        
        if (gameStats.isOptimalSolution) {
            performanceLevel = 'perfect';
            grade = 'A+';
        } else if (efficiency >= 80) {
            performanceLevel = 'excellent';
            grade = 'A';
        } else if (efficiency >= 60) {
            performanceLevel = 'good';
            grade = 'B';
        } else {
            performanceLevel = 'needsWork';
            grade = 'C';
        }
        
        return {
            level: performanceLevel,
            grade,
            efficiency,
            timeElapsed,
            moveCount,
            optimalMoves,
            isOptimalSolution: gameStats.isOptimalSolution,
            message: this.getRandomMessage(performanceLevel)
        };
    }
    
    /**
     * Get random performance message
     * @param {string} level - Performance level
     * @returns {string} Random message
     */
    getRandomMessage(level) {
        const messages = this.performanceMessages[level] || this.performanceMessages.good;
        return messages[Math.floor(Math.random() * messages.length)];
    }
    
    /**
     * Show performance feedback to user
     * @param {Object} analysis - Performance analysis
     */
    showPerformanceFeedback(analysis) {
        const timeStr = this.formatTime(analysis.timeElapsed);
        
        let message = `${analysis.message}\n\n`;
        message += `📊 Performance Summary:\n`;
        message += `Grade: ${analysis.grade}\n`;
        message += `Moves: ${analysis.moveCount}/${analysis.optimalMoves} (${analysis.efficiency}% efficient)\n`;
        message += `Time: ${timeStr}\n`;
        
        if (analysis.isOptimalSolution) {
            message += `\n🏆 PERFECT SOLUTION! 🏆`;
        }
        
        // Show message through the game's message system
        if (window.showMessage) {
            window.showMessage(message, 'success');
        }
        
        // Also show in console for debugging
        console.log('Performance Feedback:', message);
    }
    
    /**
     * Check which achievements were earned
     * @param {Object} gameStats - Game statistics
     * @returns {Array} Array of earned achievements
     */
    checkAchievements(gameStats) {
        const earnedAchievements = [];
        
        for (const [key, achievement] of Object.entries(this.achievements)) {
            if (achievement.condition(gameStats)) {
                earnedAchievements.push(achievement);
                
                // Store achievement in localStorage
                const storageKey = `toh_achievement_${achievement.id}`;
                if (!localStorage.getItem(storageKey)) {
                    localStorage.setItem(storageKey, JSON.stringify({
                        earned: true,
                        timestamp: Date.now(),
                        gameStats: gameStats
                    }));
                }
            }
        }
        
        return earnedAchievements;
    }
    
    /**
     * Show achievements to user
     * @param {Array} achievements - Array of achievements
     */
    showAchievements(achievements) {
        if (achievements.length === 0) return;
        
        let message = '🎉 ACHIEVEMENTS UNLOCKED! 🎉\n\n';
        
        achievements.forEach(achievement => {
            message += `${achievement.icon} ${achievement.name}\n`;
            message += `${achievement.description}\n\n`;
        });
        
        // Show achievements after a delay
        setTimeout(() => {
            if (window.showMessage) {
                window.showMessage(message, 'success');
            }
            console.log('Achievements:', message);
        }, 2000);
    }
    
    /**
     * Generate confetti particles
     */
    generateConfetti() {
        this.celebrationState.confetti = [];
        
        for (let i = 0; i < 50; i++) {
            this.celebrationState.confetti.push({
                x: Math.random() * this.canvas.width,
                y: -10,
                vx: (Math.random() - 0.5) * 4,
                vy: Math.random() * 3 + 2,
                color: this.getRandomColor(),
                size: Math.random() * 6 + 2,
                rotation: Math.random() * Math.PI * 2,
                rotationSpeed: (Math.random() - 0.5) * 0.2
            });
        }
    }
    
    /**
     * Generate firework effects
     */
    generateFireworks() {
        this.celebrationState.fireworks = [];
        
        for (let i = 0; i < 5; i++) {
            setTimeout(() => {
                this.createFirework();
            }, i * 800);
        }
    }
    
    /**
     * Create a single firework
     */
    createFirework() {
        const centerX = Math.random() * this.canvas.width;
        const centerY = Math.random() * this.canvas.height * 0.5 + this.canvas.height * 0.2;
        const color = this.getRandomColor();
        
        const firework = {
            x: centerX,
            y: centerY,
            particles: [],
            startTime: Date.now(),
            duration: 2000
        };
        
        // Create explosion particles
        for (let i = 0; i < 20; i++) {
            const angle = (Math.PI * 2 * i) / 20;
            const speed = Math.random() * 3 + 2;
            
            firework.particles.push({
                x: centerX,
                y: centerY,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                color: color,
                size: Math.random() * 4 + 2,
                life: 1.0,
                decay: 0.02
            });
        }
        
        this.celebrationState.fireworks.push(firework);
    }
    
    /**
     * Get random color for effects
     * @returns {string} Random color
     */
    getRandomColor() {
        const colors = [
            '#ff6b6b', '#4ecdc4', '#45b7d1', '#96ceb4', '#feca57',
            '#ff9ff3', '#54a0ff', '#5f27cd', '#00d2d3', '#ff9f43'
        ];
        return colors[Math.floor(Math.random() * colors.length)];
    }
    
    /**
     * Animate celebration effects
     */
    animateCelebration() {
        if (!this.celebrationState.isActive) return;
        
        const currentTime = Date.now();
        const elapsed = currentTime - this.celebrationState.startTime;
        
        if (elapsed > this.celebrationState.duration) {
            this.stopCelebration();
            return;
        }
        
        // Clear previous frame effects (don't clear entire canvas)
        this.drawCelebrationEffects();
        
        // Continue animation
        requestAnimationFrame(() => this.animateCelebration());
    }
    
    /**
     * Draw celebration effects on canvas
     */
    drawCelebrationEffects() {
        // Save canvas state
        this.ctx.save();
        
        // Draw confetti
        this.drawConfetti();
        
        // Draw fireworks
        this.drawFireworks();
        
        // Restore canvas state
        this.ctx.restore();
    }
    
    /**
     * Draw confetti particles
     */
    drawConfetti() {
        this.celebrationState.confetti.forEach((particle, index) => {
            // Update particle position
            particle.x += particle.vx;
            particle.y += particle.vy;
            particle.vy += 0.1; // Gravity
            particle.rotation += particle.rotationSpeed;
            
            // Remove particles that are off screen
            if (particle.y > this.canvas.height + 10) {
                this.celebrationState.confetti.splice(index, 1);
                return;
            }
            
            // Draw particle
            this.ctx.save();
            this.ctx.translate(particle.x, particle.y);
            this.ctx.rotate(particle.rotation);
            this.ctx.fillStyle = particle.color;
            this.ctx.fillRect(-particle.size/2, -particle.size/2, particle.size, particle.size);
            this.ctx.restore();
        });
    }
    
    /**
     * Draw firework effects
     */
    drawFireworks() {
        this.celebrationState.fireworks.forEach((firework, fireworkIndex) => {
            const elapsed = Date.now() - firework.startTime;
            
            if (elapsed > firework.duration) {
                this.celebrationState.fireworks.splice(fireworkIndex, 1);
                return;
            }
            
            firework.particles.forEach((particle, particleIndex) => {
                // Update particle
                particle.x += particle.vx;
                particle.y += particle.vy;
                particle.vy += 0.05; // Gravity
                particle.life -= particle.decay;
                
                if (particle.life <= 0) {
                    firework.particles.splice(particleIndex, 1);
                    return;
                }
                
                // Draw particle
                this.ctx.save();
                this.ctx.globalAlpha = particle.life;
                this.ctx.fillStyle = particle.color;
                this.ctx.beginPath();
                this.ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
                this.ctx.fill();
                this.ctx.restore();
            });
        });
    }
    
    /**
     * Stop celebration
     */
    stopCelebration() {
        this.celebrationState.isActive = false;
        this.celebrationState.confetti = [];
        this.celebrationState.fireworks = [];
    }
    
    /**
     * Format time in MM:SS format
     * @param {number} seconds - Time in seconds
     * @returns {string} Formatted time
     */
    formatTime(seconds) {
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = seconds % 60;
        return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
    }
    
    /**
     * Get all earned achievements
     * @returns {Array} Array of earned achievements
     */
    getEarnedAchievements() {
        const earned = [];
        
        for (const [key, achievement] of Object.entries(this.achievements)) {
            const storageKey = `toh_achievement_${achievement.id}`;
            const stored = localStorage.getItem(storageKey);
            
            if (stored) {
                const data = JSON.parse(stored);
                earned.push({
                    ...achievement,
                    earnedAt: data.timestamp,
                    gameStats: data.gameStats
                });
            }
        }
        
        return earned;
    }
    
    /**
     * Clear all achievements (for testing)
     */
    clearAchievements() {
        for (const achievement of Object.values(this.achievements)) {
            localStorage.removeItem(`toh_achievement_${achievement.id}`);
        }
        localStorage.removeItem('toh_first_win');
    }
    
    /**
     * Update canvas reference
     * @param {HTMLCanvasElement} canvas - New canvas element
     */
    updateCanvas(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
    }
    
    /**
     * Update game state reference
     * @param {Object} gameState - New game state
     */
    updateGameState(gameState) {
        this.gameState = gameState;
    }
    
    /**
     * Update animation system reference
     * @param {Object} animationSystem - New animation system
     */
    updateAnimationSystem(animationSystem) {
        this.animationSystem = animationSystem;
    }
}

// Export for use by other modules
if (typeof module !== 'undefined' && module.exports) {
    // Node.js environment (for testing)
    module.exports = { CelebrationSystem };
} else {
    // Browser environment
    window.CelebrationSystem = CelebrationSystem;
}