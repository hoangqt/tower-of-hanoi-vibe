/**
 * Solver Engine for Towers of Hanoi
 * 
 * This module implements the optimal solution algorithm for the Towers of Hanoi puzzle
 * and provides auto-solve functionality with configurable speed and pause/resume controls.
 */

/**
 * Solver Engine class for generating optimal solutions
 */
class SolverEngine {
    constructor(gameState, animationSystem) {
        this.gameState = gameState;
        this.animationSystem = animationSystem;
        
        // Auto-solve state
        this.autoSolveState = {
            isRunning: false,
            isPaused: false,
            currentStep: 0,
            solution: [],
            speed: 1000, // ms between moves
            intervalId: null,
            onComplete: null,
            onStep: null,
            onPause: null,
            onResume: null
        };
    }
    
    /**
     * Calculate the minimum number of moves required for n disks
     * Uses the formula: 2^n - 1
     * @param {number} numDisks - Number of disks
     * @returns {number} Minimum moves required
     */
    calculateMinimumMoves(numDisks) {
        return Math.pow(2, numDisks) - 1;
    }
    
    /**
     * Generate the optimal solution for the current game state
     * @returns {Array} Array of moves in the format {from: rodIndex, to: rodIndex, disk: diskSize}
     */
    generateOptimalSolution() {
        if (!this.gameState) {
            throw new Error('Game state not initialized');
        }
        
        const numDisks = this.gameState.settings.numDisks;
        const solution = [];
        
        // Find the current state of disks
        const diskPositions = this.getCurrentDiskPositions();
        
        // If all disks are already on the target rod, no moves needed
        if (this.isGameComplete(diskPositions)) {
            return [];
        }
        
        // Generate solution from current state to target state
        this.solveTowersOfHanoi(numDisks, 0, 2, 1, solution, diskPositions);
        
        return solution;
    }
    
    /**
     * Get current positions of all disks
     * @returns {Array} Array where index is disk size-1 and value is rod index
     */
    getCurrentDiskPositions() {
        const positions = new Array(this.gameState.settings.numDisks);
        
        for (let rodIndex = 0; rodIndex < 3; rodIndex++) {
            const rod = this.gameState.rods[rodIndex];
            for (const diskSize of rod.disks) {
                positions[diskSize - 1] = rodIndex;
            }
        }
        
        return positions;
    }
    
    /**
     * Check if the game is complete (all disks on target rod)
     * @param {Array} diskPositions - Current disk positions
     * @returns {boolean} True if game is complete
     */
    isGameComplete(diskPositions) {
        return diskPositions.every(pos => pos === 2);
    }
    
    /**
     * Recursive Towers of Hanoi solver
     * @param {number} n - Number of disks to move
     * @param {number} source - Source rod index
     * @param {number} target - Target rod index  
     * @param {number} auxiliary - Auxiliary rod index
     * @param {Array} solution - Array to store the solution moves
     * @param {Array} diskPositions - Current positions of disks
     */
    solveTowersOfHanoi(n, source, target, auxiliary, solution, diskPositions) {
        if (n === 1) {
            // Base case: move the smallest disk
            const diskSize = this.findDiskAtPosition(n, source, diskPositions);
            if (diskSize && diskPositions[diskSize - 1] === source) {
                solution.push({
                    from: source,
                    to: target,
                    disk: diskSize
                });
                diskPositions[diskSize - 1] = target;
            }
            return;
        }
        
        // Move n-1 disks from source to auxiliary
        this.solveTowersOfHanoi(n - 1, source, auxiliary, target, solution, diskPositions);
        
        // Move the largest disk from source to target
        const diskSize = this.findDiskAtPosition(n, source, diskPositions);
        if (diskSize && diskPositions[diskSize - 1] === source) {
            solution.push({
                from: source,
                to: target,
                disk: diskSize
            });
            diskPositions[diskSize - 1] = target;
        }
        
        // Move n-1 disks from auxiliary to target
        this.solveTowersOfHanoi(n - 1, auxiliary, target, source, solution, diskPositions);
    }
    
    /**
     * Find the disk of given size at the specified position
     * @param {number} size - Size of disk to find
     * @param {number} rodIndex - Rod to search
     * @param {Array} diskPositions - Current disk positions
     * @returns {number|null} Disk size if found, null otherwise
     */
    findDiskAtPosition(size, rodIndex, diskPositions) {
        // Find the largest disk currently on the specified rod
        for (let diskSize = this.gameState.settings.numDisks; diskSize >= 1; diskSize--) {
            if (diskPositions[diskSize - 1] === rodIndex) {
                return diskSize;
            }
        }
        return null;
    }
    
    /**
     * Get the next optimal move for the current game state
     * @returns {Object|null} Next move object or null if no moves needed
     */
    getNextOptimalMove() {
        const solution = this.generateOptimalSolution();
        return solution.length > 0 ? solution[0] : null;
    }
    
    /**
     * Start auto-solve with configurable options
     * @param {Object} options - Auto-solve configuration
     */
    startAutoSolve(options = {}) {
        if (this.autoSolveState.isRunning) {
            console.warn('Auto-solve is already running');
            return;
        }
        
        // Configure auto-solve options
        this.autoSolveState.speed = options.speed || 1000;
        this.autoSolveState.onComplete = options.onComplete || null;
        this.autoSolveState.onStep = options.onStep || null;
        this.autoSolveState.onPause = options.onPause || null;
        this.autoSolveState.onResume = options.onResume || null;
        
        // Generate solution
        try {
            this.autoSolveState.solution = this.generateOptimalSolution();
            this.autoSolveState.currentStep = 0;
            this.autoSolveState.isRunning = true;
            this.autoSolveState.isPaused = false;
            
            if (this.autoSolveState.solution.length === 0) {
                // Already solved
                if (this.autoSolveState.onComplete) {
                    this.autoSolveState.onComplete();
                }
                this.stopAutoSolve();
                return;
            }
            
            // Start the auto-solve process
            this.executeNextMove();
            
        } catch (error) {
            console.error('Failed to start auto-solve:', error);
            this.stopAutoSolve();
        }
    }
    
    /**
     * Execute the next move in the auto-solve sequence
     */
    executeNextMove() {
        if (!this.autoSolveState.isRunning || this.autoSolveState.isPaused) {
            return;
        }
        
        if (this.autoSolveState.currentStep >= this.autoSolveState.solution.length) {
            // Solution complete
            if (this.autoSolveState.onComplete) {
                this.autoSolveState.onComplete();
            }
            this.stopAutoSolve();
            return;
        }
        
        const move = this.autoSolveState.solution[this.autoSolveState.currentStep];
        
        // Execute the move using the game engine
        if (window.GameEngine) {
            const result = window.GameEngine.makeMove(this.gameState, move.from, move.to);
            
            if (result.success) {
                this.autoSolveState.currentStep++;
                
                // Notify step callback
                if (this.autoSolveState.onStep) {
                    this.autoSolveState.onStep(move, this.autoSolveState.currentStep, this.autoSolveState.solution.length);
                }
                
                // Animate the move if animation system is available
                if (this.animationSystem) {
                    this.animationSystem.animateDiskMove(move.disk, move.from, move.to, () => {
                        // Schedule next move after animation completes
                        if (this.autoSolveState.isRunning && !this.autoSolveState.isPaused) {
                            this.autoSolveState.intervalId = setTimeout(() => {
                                this.executeNextMove();
                            }, this.autoSolveState.speed);
                        }
                    });
                } else {
                    // No animation, schedule next move immediately
                    this.autoSolveState.intervalId = setTimeout(() => {
                        this.executeNextMove();
                    }, this.autoSolveState.speed);
                }
            } else {
                console.error('Auto-solve move failed:', result.error);
                this.stopAutoSolve();
            }
        } else {
            console.error('GameEngine not available for auto-solve');
            this.stopAutoSolve();
        }
    }
    
    /**
     * Pause the auto-solve process
     */
    pauseAutoSolve() {
        if (!this.autoSolveState.isRunning || this.autoSolveState.isPaused) {
            return;
        }
        
        this.autoSolveState.isPaused = true;
        
        if (this.autoSolveState.intervalId) {
            clearTimeout(this.autoSolveState.intervalId);
            this.autoSolveState.intervalId = null;
        }
        
        if (this.autoSolveState.onPause) {
            this.autoSolveState.onPause();
        }
    }
    
    /**
     * Resume the auto-solve process
     */
    resumeAutoSolve() {
        if (!this.autoSolveState.isRunning || !this.autoSolveState.isPaused) {
            return;
        }
        
        this.autoSolveState.isPaused = false;
        
        if (this.autoSolveState.onResume) {
            this.autoSolveState.onResume();
        }
        
        // Resume execution
        this.executeNextMove();
    }
    
    /**
     * Stop the auto-solve process
     */
    stopAutoSolve() {
        this.autoSolveState.isRunning = false;
        this.autoSolveState.isPaused = false;
        
        if (this.autoSolveState.intervalId) {
            clearTimeout(this.autoSolveState.intervalId);
            this.autoSolveState.intervalId = null;
        }
        
        // Reset state
        this.autoSolveState.currentStep = 0;
        this.autoSolveState.solution = [];
    }
    
    /**
     * Check if auto-solve is currently running
     * @returns {boolean} True if auto-solve is running
     */
    isAutoSolveRunning() {
        return this.autoSolveState.isRunning;
    }
    
    /**
     * Check if auto-solve is currently paused
     * @returns {boolean} True if auto-solve is paused
     */
    isAutoSolvePaused() {
        return this.autoSolveState.isPaused;
    }
    
    /**
     * Get auto-solve progress information
     * @returns {Object} Progress information
     */
    getAutoSolveProgress() {
        return {
            isRunning: this.autoSolveState.isRunning,
            isPaused: this.autoSolveState.isPaused,
            currentStep: this.autoSolveState.currentStep,
            totalSteps: this.autoSolveState.solution.length,
            progress: this.autoSolveState.solution.length > 0 ? 
                (this.autoSolveState.currentStep / this.autoSolveState.solution.length) * 100 : 0
        };
    }
    
    /**
     * Set auto-solve speed
     * @param {number} speed - Speed in milliseconds between moves
     */
    setAutoSolveSpeed(speed) {
        this.autoSolveState.speed = Math.max(100, speed); // Minimum 100ms
    }
    
    /**
     * Update game state reference
     * @param {Object} gameState - New game state
     */
    updateGameState(gameState) {
        this.gameState = gameState;
        
        // Stop auto-solve if running since game state changed
        if (this.autoSolveState.isRunning) {
            this.stopAutoSolve();
        }
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
    module.exports = { SolverEngine };
} else {
    // Browser environment
    window.SolverEngine = SolverEngine;
}