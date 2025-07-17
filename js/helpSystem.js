/**
 * Help and Guidance System for Towers of Hanoi
 * 
 * This module provides comprehensive user guidance, tutorials, help messages,
 * and contextual assistance to help users understand and play the game.
 */

/**
 * Help System class for managing user guidance and tutorials
 */
class HelpSystem {
    constructor() {
        // Help state
        this.helpState = {
            isFirstTime: !localStorage.getItem('toh_played_before'),
            tutorialStep: 0,
            showingHelp: false,
            helpType: null
        };
        
        // Tutorial steps
        this.tutorialSteps = [
            {
                title: "Welcome to Towers of Hanoi!",
                message: "This is a classic puzzle game. The goal is to move all disks from the left rod to the right rod.",
                highlight: null,
                action: "Click anywhere to continue"
            },
            {
                title: "Game Rules",
                message: "You can only move one disk at a time, and you can only move the top disk from each rod.",
                highlight: null,
                action: "Click to continue"
            },
            {
                title: "Size Rule",
                message: "You cannot place a larger disk on top of a smaller disk. Only smaller disks can go on top of larger ones.",
                highlight: null,
                action: "Click to continue"
            },
            {
                title: "How to Play",
                message: "Click on a disk to select it, then click on another rod to move it there. You can also drag and drop disks.",
                highlight: "canvas",
                action: "Try selecting a disk!"
            },
            {
                title: "Game Controls",
                message: "Use the buttons below to Reset the game, Undo moves, get Hints, or watch the auto-Solve.",
                highlight: "controls",
                action: "Click 'Got it!' to start playing"
            }
        ];
        
        // Help topics
        this.helpTopics = {
            rules: {
                title: "Game Rules",
                content: `
                    <h3>Objective</h3>
                    <p>Move all disks from the left rod to the right rod.</p>
                    
                    <h3>Rules</h3>
                    <ul>
                        <li>Only move one disk at a time</li>
                        <li>Only move the top disk from each rod</li>
                        <li>Never place a larger disk on a smaller disk</li>
                    </ul>
                    
                    <h3>How to Win</h3>
                    <p>Get all disks stacked on the right rod in the same order as they started.</p>
                `
            },
            controls: {
                title: "Game Controls",
                content: `
                    <h3>Mouse/Touch Controls</h3>
                    <ul>
                        <li><strong>Click</strong> a disk to select it</li>
                        <li><strong>Click</strong> another rod to move the disk there</li>
                        <li><strong>Drag and drop</strong> disks between rods</li>
                        <li><strong>Double-click</strong> a disk to auto-move it</li>
                    </ul>
                    
                    <h3>Keyboard Controls</h3>
                    <ul>
                        <li><strong>Arrow Keys</strong> or <strong>A/D</strong> - Navigate between rods</li>
                        <li><strong>Enter/Space</strong> - Select disk or confirm move</li>
                        <li><strong>Escape</strong> - Cancel selection</li>
                        <li><strong>Ctrl+Z</strong> - Undo last move</li>
                        <li><strong>Ctrl+R</strong> - Reset game</li>
                    </ul>
                `
            },
            buttons: {
                title: "Button Functions",
                content: `
                    <h3>Game Buttons</h3>
                    <ul>
                        <li><strong>Reset</strong> - Start over with a new game</li>
                        <li><strong>Undo</strong> - Reverse your last move</li>
                        <li><strong>Hint</strong> - Get a suggestion for the next optimal move</li>
                        <li><strong>Solve</strong> - Watch the computer solve the puzzle automatically</li>
                        <li><strong>Achievements</strong> - View your earned achievements</li>
                    </ul>
                    
                    <h3>Settings</h3>
                    <ul>
                        <li><strong>Disks</strong> - Choose how many disks to play with (3-8)</li>
                        <li><strong>Show Hints</strong> - Toggle visual hints for valid moves</li>
                    </ul>
                `
            },
            strategy: {
                title: "Strategy Tips",
                content: `
                    <h3>Basic Strategy</h3>
                    <ul>
                        <li>Start by moving the smallest disk</li>
                        <li>Always alternate between moving the smallest disk and making the only legal move not involving the smallest disk</li>
                        <li>The smallest disk always moves in the same direction (clockwise or counter-clockwise)</li>
                    </ul>
                    
                    <h3>Optimal Solution</h3>
                    <p>The minimum number of moves needed is <strong>2^n - 1</strong>, where n is the number of disks.</p>
                    <ul>
                        <li>3 disks: 7 moves</li>
                        <li>4 disks: 15 moves</li>
                        <li>5 disks: 31 moves</li>
                        <li>6 disks: 63 moves</li>
                    </ul>
                `
            }
        };
        
        // Error messages with helpful guidance
        this.errorMessages = {
            'Cannot move from empty rod': {
                message: "There are no disks on this rod to move.",
                help: "Try clicking on a rod that has disks on it.",
                severity: 'info',
                icon: '🤔'
            },
            'Cannot place larger disk on smaller disk': {
                message: "You cannot place a larger disk on top of a smaller one.",
                help: "This is one of the main rules of Towers of Hanoi. Try moving the disk to an empty rod or on top of a larger disk.",
                severity: 'error',
                icon: '🚫'
            },
            'Can only move the top disk': {
                message: "You can only move the disk that's on top of the stack.",
                help: "Click on the topmost disk of the rod to select it.",
                severity: 'info',
                icon: '👆'
            },
            'No disk selected': {
                message: "Please select a disk first before trying to move it.",
                help: "Click on a disk to select it, then click on another rod to move it there.",
                severity: 'info',
                icon: '👆'
            },
            'Cannot move disk to same rod': {
                message: "The disk is already on this rod.",
                help: "Try moving the disk to a different rod.",
                severity: 'info',
                icon: '🔄'
            },
            'Game is already complete': {
                message: "The puzzle is already solved!",
                help: "Click the Reset button to start a new game.",
                severity: 'info',
                icon: '🎉'
            },
            'No moves to undo': {
                message: "There are no moves to undo.",
                help: "Make some moves first, then you can use the Undo button.",
                severity: 'info',
                icon: '⏪'
            },
            'Cannot undo moves after game is complete': {
                message: "You cannot undo moves after completing the puzzle.",
                help: "Click the Reset button to start a new game if you want to try again.",
                severity: 'info',
                icon: '🏆'
            },
            'Invalid source rod': {
                message: "Invalid rod selection.",
                help: "Please click on one of the three rods (left, middle, or right).",
                severity: 'error',
                icon: '❌'
            },
            'Invalid target rod': {
                message: "Invalid destination rod.",
                help: "Please click on one of the three rods to move the disk there.",
                severity: 'error',
                icon: '❌'
            }
        };
    }
    
    /**
     * Initialize the help system
     */
    initialize() {
        this.createHelpUI();
        
        // Show tutorial for first-time users
        if (this.helpState.isFirstTime) {
            setTimeout(() => {
                this.startTutorial();
            }, 1000);
        }
    }
    
    /**
     * Create help UI elements
     */
    createHelpUI() {
        // Create help button
        const helpButton = document.createElement('button');
        helpButton.id = 'help-btn';
        helpButton.className = 'control-btn';
        helpButton.textContent = 'Help';
        helpButton.title = 'Get help and view tutorial';
        helpButton.addEventListener('click', () => this.showHelpMenu());
        
        // Add help button to settings group
        const settingsGroup = document.querySelector('.settings-group');
        if (settingsGroup) {
            settingsGroup.appendChild(helpButton);
        }
        
        // Create help overlay
        this.createHelpOverlay();
    }
    
    /**
     * Create help overlay for tutorials and help content
     */
    createHelpOverlay() {
        const overlay = document.createElement('div');
        overlay.id = 'help-overlay';
        overlay.className = 'help-overlay';
        overlay.innerHTML = `
            <div class="help-modal">
                <div class="help-header">
                    <h2 id="help-title">Help</h2>
                    <button id="help-close" class="help-close">&times;</button>
                </div>
                <div class="help-content" id="help-content">
                    <!-- Help content will be inserted here -->
                </div>
                <div class="help-footer">
                    <button id="help-prev" class="help-btn">Previous</button>
                    <button id="help-next" class="help-btn">Next</button>
                    <button id="help-skip" class="help-btn">Skip</button>
                    <button id="help-done" class="help-btn">Got it!</button>
                </div>
            </div>
        `;
        
        document.body.appendChild(overlay);
        
        // Add event listeners
        document.getElementById('help-close').addEventListener('click', () => this.hideHelp());
        document.getElementById('help-prev').addEventListener('click', () => this.previousTutorialStep());
        document.getElementById('help-next').addEventListener('click', () => this.nextTutorialStep());
        document.getElementById('help-skip').addEventListener('click', () => this.skipTutorial());
        document.getElementById('help-done').addEventListener('click', () => this.hideHelp());
        
        // Close on overlay click
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) {
                this.hideHelp();
            }
        });
    }
    
    /**
     * Start the tutorial for new users
     */
    startTutorial() {
        this.helpState.tutorialStep = 0;
        this.helpState.showingHelp = true;
        this.helpState.helpType = 'tutorial';
        this.showTutorialStep();
    }
    
    /**
     * Show current tutorial step
     */
    showTutorialStep() {
        const step = this.tutorialSteps[this.helpState.tutorialStep];
        const overlay = document.getElementById('help-overlay');
        const title = document.getElementById('help-title');
        const content = document.getElementById('help-content');
        const prevBtn = document.getElementById('help-prev');
        const nextBtn = document.getElementById('help-next');
        const skipBtn = document.getElementById('help-skip');
        const doneBtn = document.getElementById('help-done');
        
        title.textContent = step.title;
        content.innerHTML = `
            <p>${step.message}</p>
            <div class="tutorial-action">${step.action}</div>
        `;
        
        // Update button visibility
        prevBtn.style.display = this.helpState.tutorialStep > 0 ? 'inline-block' : 'none';
        nextBtn.style.display = this.helpState.tutorialStep < this.tutorialSteps.length - 1 ? 'inline-block' : 'none';
        skipBtn.style.display = 'inline-block';
        doneBtn.style.display = this.helpState.tutorialStep === this.tutorialSteps.length - 1 ? 'inline-block' : 'none';
        
        overlay.style.display = 'flex';
        
        // Highlight elements if specified
        this.highlightElement(step.highlight);
    }
    
    /**
     * Show help menu with different topics
     */
    showHelpMenu() {
        const overlay = document.getElementById('help-overlay');
        const title = document.getElementById('help-title');
        const content = document.getElementById('help-content');
        const prevBtn = document.getElementById('help-prev');
        const nextBtn = document.getElementById('help-next');
        const skipBtn = document.getElementById('help-skip');
        const doneBtn = document.getElementById('help-done');
        
        this.helpState.showingHelp = true;
        this.helpState.helpType = 'menu';
        
        title.textContent = 'Help & Instructions';
        content.innerHTML = `
            <div class="help-menu">
                <button class="help-topic-btn" data-topic="rules">Game Rules</button>
                <button class="help-topic-btn" data-topic="controls">Controls</button>
                <button class="help-topic-btn" data-topic="buttons">Buttons & Settings</button>
                <button class="help-topic-btn" data-topic="strategy">Strategy Tips</button>
                <button class="help-topic-btn" onclick="helpSystem.startTutorial()">Show Tutorial</button>
            </div>
        `;
        
        // Update button visibility
        prevBtn.style.display = 'none';
        nextBtn.style.display = 'none';
        skipBtn.style.display = 'none';
        doneBtn.style.display = 'inline-block';
        
        overlay.style.display = 'flex';
        
        // Add event listeners to topic buttons
        content.querySelectorAll('.help-topic-btn').forEach(btn => {
            if (btn.dataset.topic) {
                btn.addEventListener('click', () => this.showHelpTopic(btn.dataset.topic));
            }
        });
    }
    
    /**
     * Show specific help topic
     */
    showHelpTopic(topicId) {
        const topic = this.helpTopics[topicId];
        if (!topic) return;
        
        const title = document.getElementById('help-title');
        const content = document.getElementById('help-content');
        const prevBtn = document.getElementById('help-prev');
        const nextBtn = document.getElementById('help-next');
        const skipBtn = document.getElementById('help-skip');
        const doneBtn = document.getElementById('help-done');
        
        title.textContent = topic.title;
        content.innerHTML = `
            <div class="help-topic-content">
                ${topic.content}
                <button class="help-back-btn" onclick="helpSystem.showHelpMenu()">← Back to Help Menu</button>
            </div>
        `;
        
        // Update button visibility
        prevBtn.style.display = 'none';
        nextBtn.style.display = 'none';
        skipBtn.style.display = 'none';
        doneBtn.style.display = 'inline-block';
    }
    
    /**
     * Show enhanced error message with guidance
     */
    showErrorWithGuidance(errorMessage, context = {}) {
        const errorInfo = this.errorMessages[errorMessage];
        
        if (errorInfo) {
            const fullMessage = `${errorInfo.icon} ${errorInfo.message}\n\n💡 Tip: ${errorInfo.help}`;
            
            // Show message through the game's message system
            if (window.showMessage) {
                window.showMessage(fullMessage, errorInfo.severity);
            }
            
            // Show contextual help overlay for complex errors
            if (errorInfo.severity === 'error' && context.showDetailedHelp) {
                this.showErrorHelpOverlay(errorMessage, errorInfo, context);
            }
            
            // Log for debugging
            console.log('Enhanced error:', {
                original: errorMessage,
                enhanced: errorInfo,
                context: context
            });
        } else {
            // Try to match partial error messages
            const matchedError = this.findMatchingError(errorMessage);
            if (matchedError) {
                this.showErrorWithGuidance(matchedError, context);
            } else {
                // Fallback to original message
                if (window.showMessage) {
                    window.showMessage(`❌ ${errorMessage}`, 'error');
                }
            }
        }
    }

    /**
     * Find matching error message from partial text
     */
    findMatchingError(errorMessage) {
        const lowerMessage = errorMessage.toLowerCase();
        
        // Check for common error patterns
        if (lowerMessage.includes('empty') && lowerMessage.includes('rod')) {
            return 'Cannot move from empty rod';
        }
        if (lowerMessage.includes('larger') && lowerMessage.includes('smaller')) {
            return 'Cannot place larger disk on smaller disk';
        }
        if (lowerMessage.includes('top disk')) {
            return 'Can only move the top disk';
        }
        if (lowerMessage.includes('no disk selected')) {
            return 'No disk selected';
        }
        if (lowerMessage.includes('same rod')) {
            return 'Cannot move disk to same rod';
        }
        if (lowerMessage.includes('already complete')) {
            return 'Game is already complete';
        }
        if (lowerMessage.includes('no moves to undo')) {
            return 'No moves to undo';
        }
        if (lowerMessage.includes('cannot undo') && lowerMessage.includes('complete')) {
            return 'Cannot undo moves after game is complete';
        }
        
        return null;
    }

    /**
     * Show detailed error help overlay
     */
    showErrorHelpOverlay(errorKey, errorInfo, context) {
        const overlay = document.getElementById('help-overlay');
        const title = document.getElementById('help-title');
        const content = document.getElementById('help-content');
        const prevBtn = document.getElementById('help-prev');
        const nextBtn = document.getElementById('help-next');
        const skipBtn = document.getElementById('help-skip');
        const doneBtn = document.getElementById('help-done');
        
        this.helpState.showingHelp = true;
        this.helpState.helpType = 'error';
        
        title.textContent = 'Need Help?';
        content.innerHTML = `
            <div class="error-help-content">
                <div class="error-icon">${errorInfo.icon}</div>
                <h3>${errorInfo.message}</h3>
                <div class="error-help">
                    <h4>💡 What to do:</h4>
                    <p>${errorInfo.help}</p>
                </div>
                ${this.getContextualErrorHelp(errorKey, context)}
                <div class="error-actions">
                    <button class="help-action-btn" onclick="helpSystem.showHelpTopic('rules')">📖 Review Rules</button>
                    <button class="help-action-btn" onclick="helpSystem.showHelpTopic('controls')">🎮 Learn Controls</button>
                </div>
            </div>
        `;
        
        // Update button visibility
        prevBtn.style.display = 'none';
        nextBtn.style.display = 'none';
        skipBtn.style.display = 'none';
        doneBtn.style.display = 'inline-block';
        doneBtn.textContent = 'Got it!';
        
        overlay.style.display = 'flex';
    }

    /**
     * Get contextual help based on error type and game context
     */
    getContextualErrorHelp(errorKey, context) {
        let contextualHelp = '';
        
        switch (errorKey) {
            case 'Cannot place larger disk on smaller disk':
                contextualHelp = `
                    <div class="contextual-help">
                        <h4>🎯 Remember:</h4>
                        <ul>
                            <li>Only smaller disks can go on top of larger disks</li>
                            <li>You can always place a disk on an empty rod</li>
                            <li>Think of it like stacking plates - big ones go on the bottom!</li>
                        </ul>
                    </div>
                `;
                break;
            case 'Can only move the top disk':
                contextualHelp = `
                    <div class="contextual-help">
                        <h4>🎯 Quick tip:</h4>
                        <ul>
                            <li>Look for the disk that's highest up on each rod</li>
                            <li>Those are the only ones you can move</li>
                            <li>You'll need to move other disks out of the way first</li>
                        </ul>
                    </div>
                `;
                break;
            case 'Cannot move from empty rod':
                contextualHelp = `
                    <div class="contextual-help">
                        <h4>🎯 Look for:</h4>
                        <ul>
                            <li>Rods that have disks stacked on them</li>
                            <li>The colored disks are what you can move</li>
                            <li>Empty rods are good destinations, not sources</li>
                        </ul>
                    </div>
                `;
                break;
        }
        
        return contextualHelp;
    }
    
    /**
     * Provide contextual help based on game state
     */
    provideContextualHelp(gameState) {
        if (!gameState) return;
        
        // Check if user seems stuck
        if (gameState.moveCount > gameState.metadata.optimalMoves * 2) {
            this.showStuckHelp();
        }
        
        // Check for first move
        if (gameState.moveCount === 0) {
            setTimeout(() => {
                if (window.showMessage) {
                    window.showMessage("💡 Tip: Click on the smallest disk (top disk) to get started!", 'info');
                }
            }, 5000);
        }
    }
    
    /**
     * Show help when user seems stuck
     */
    showStuckHelp() {
        const messages = [
            "💡 Tip: Try using the Hint button to see the next optimal move!",
            "💡 Tip: Remember, you can only move the top disk from each rod.",
            "💡 Tip: The smallest disk should move frequently - it's key to the solution!",
            "💡 Tip: Use the Undo button if you made a mistake."
        ];
        
        const randomMessage = messages[Math.floor(Math.random() * messages.length)];
        
        if (window.showMessage) {
            window.showMessage(randomMessage, 'info');
        }
    }
    
    /**
     * Navigate to next tutorial step
     */
    nextTutorialStep() {
        if (this.helpState.tutorialStep < this.tutorialSteps.length - 1) {
            this.helpState.tutorialStep++;
            this.showTutorialStep();
        }
    }
    
    /**
     * Navigate to previous tutorial step
     */
    previousTutorialStep() {
        if (this.helpState.tutorialStep > 0) {
            this.helpState.tutorialStep--;
            this.showTutorialStep();
        }
    }
    
    /**
     * Skip tutorial
     */
    skipTutorial() {
        this.hideHelp();
        this.markAsPlayed();
    }
    
    /**
     * Hide help overlay
     */
    hideHelp() {
        const overlay = document.getElementById('help-overlay');
        overlay.style.display = 'none';
        this.helpState.showingHelp = false;
        this.clearHighlights();
        
        if (this.helpState.helpType === 'tutorial') {
            this.markAsPlayed();
        }
    }
    
    /**
     * Highlight specific elements during tutorial
     */
    highlightElement(elementId) {
        this.clearHighlights();
        
        if (!elementId) return;
        
        let element;
        if (elementId === 'canvas') {
            element = document.getElementById('game-canvas');
        } else if (elementId === 'controls') {
            element = document.querySelector('.game-controls');
        } else {
            element = document.getElementById(elementId);
        }
        
        if (element) {
            element.classList.add('help-highlight');
        }
    }
    
    /**
     * Clear all highlights
     */
    clearHighlights() {
        document.querySelectorAll('.help-highlight').forEach(el => {
            el.classList.remove('help-highlight');
        });
    }
    
    /**
     * Mark that user has played before
     */
    markAsPlayed() {
        localStorage.setItem('toh_played_before', 'true');
        this.helpState.isFirstTime = false;
    }
    
    /**
     * Check if this is user's first time
     */
    isFirstTime() {
        return this.helpState.isFirstTime;
    }
    
    /**
     * Reset first-time status (for testing)
     */
    resetFirstTime() {
        localStorage.removeItem('toh_played_before');
        this.helpState.isFirstTime = true;
    }
}

// Create global help system instance
let helpSystem = null;

// Export for use by other modules
if (typeof module !== 'undefined' && module.exports) {
    // Node.js environment (for testing)
    module.exports = { HelpSystem };
} else {
    // Browser environment
    window.HelpSystem = HelpSystem;
    
    // Initialize help system when DOM is loaded
    document.addEventListener('DOMContentLoaded', () => {
        helpSystem = new HelpSystem();
        helpSystem.initialize();
        window.helpSystem = helpSystem;
    });
}