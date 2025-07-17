/**
 * Message System for Towers of Hanoi
 * 
 * This module provides a comprehensive messaging system for user feedback,
 * error handling, notifications, and guidance.
 */

/**
 * Message System class for managing all user messages and notifications
 */
class MessageSystem {
    constructor() {
        // Message state
        this.messageState = {
            currentMessage: null,
            messageQueue: [],
            isShowing: false,
            autoHideTimer: null,
            messageHistory: []
        };
        
        // Message types and their default configurations
        this.messageTypes = {
            error: {
                duration: 5000,
                icon: '❌',
                className: 'error',
                priority: 4,
                sound: 'error'
            },
            warning: {
                duration: 4000,
                icon: '⚠️',
                className: 'warning',
                priority: 3,
                sound: 'warning'
            },
            success: {
                duration: 3000,
                icon: '✅',
                className: 'success',
                priority: 2,
                sound: 'success'
            },
            info: {
                duration: 3000,
                icon: 'ℹ️',
                className: 'info',
                priority: 1,
                sound: null
            },
            hint: {
                duration: 4000,
                icon: '💡',
                className: 'info',
                priority: 1,
                sound: null
            },
            celebration: {
                duration: 6000,
                icon: '🎉',
                className: 'success',
                priority: 5,
                sound: 'celebration'
            }
        };
        
        // Initialize message element
        this.messageElement = null;
        this.initialize();
    }
    
    /**
     * Initialize the message system
     */
    initialize() {
        this.createMessageElement();
        this.setupGlobalMessageHandler();
    }
    
    /**
     * Create the message display element
     */
    createMessageElement() {
        // Find existing message element or create new one
        this.messageElement = document.querySelector('.game-message');
        
        if (!this.messageElement) {
            this.messageElement = document.createElement('div');
            this.messageElement.className = 'game-message';
            
            // Insert after canvas or at the end of game-main
            const gameMain = document.querySelector('.game-main');
            if (gameMain) {
                gameMain.appendChild(this.messageElement);
            } else {
                document.body.appendChild(this.messageElement);
            }
        }
        
        // Ensure message element has proper attributes for accessibility
        this.messageElement.setAttribute('role', 'status');
        this.messageElement.setAttribute('aria-live', 'polite');
        this.messageElement.setAttribute('aria-atomic', 'true');
    }
    
    /**
     * Setup global message handler
     */
    setupGlobalMessageHandler() {
        // Make showMessage globally available
        window.showMessage = (text, type = 'info', options = {}) => {
            this.showMessage(text, type, options);
        };
        
        // Enhanced error handler integration
        if (window.helpSystem) {
            window.helpSystem.messageSystem = this;
        }
    }
    
    /**
     * Show a message to the user
     * @param {string} text - Message text
     * @param {string} type - Message type (error, warning, success, info, hint, celebration)
     * @param {Object} options - Additional options
     */
    showMessage(text, type = 'info', options = {}) {
        const messageConfig = this.messageTypes[type] || this.messageTypes.info;
        
        const message = {
            id: Date.now() + Math.random(),
            text: text,
            type: type,
            timestamp: new Date(),
            duration: options.duration || messageConfig.duration,
            icon: options.icon || messageConfig.icon,
            className: options.className || messageConfig.className,
            priority: options.priority || messageConfig.priority,
            sound: options.sound !== undefined ? options.sound : messageConfig.sound,
            persistent: options.persistent || false,
            showDetailedHelp: options.showDetailedHelp || false,
            context: options.context || {}
        };
        
        // Add to history
        this.messageState.messageHistory.push(message);
        
        // Keep only last 50 messages in history
        if (this.messageState.messageHistory.length > 50) {
            this.messageState.messageHistory.shift();
        }
        
        // Handle message priority and queuing
        if (this.messageState.isShowing && this.messageState.currentMessage) {
            if (message.priority > this.messageState.currentMessage.priority) {
                // Higher priority message, show immediately
                this.clearCurrentMessage();
                this.displayMessage(message);
            } else {
                // Lower or equal priority, add to queue
                this.messageState.messageQueue.push(message);
                this.sortMessageQueue();
            }
        } else {
            // No current message, show immediately
            this.displayMessage(message);
        }
        
        // Play sound if specified
        this.playMessageSound(message.sound);
        
        // Log message for debugging
        console.log(`[${type.toUpperCase()}] ${text}`, message.context);
        
        return message.id;
    }
    
    /**
     * Display a message in the UI
     * @param {Object} message - Message object
     */
    displayMessage(message) {
        if (!this.messageElement) {
            this.createMessageElement();
        }
        
        // Clear any existing auto-hide timer
        if (this.messageState.autoHideTimer) {
            clearTimeout(this.messageState.autoHideTimer);
        }
        
        // Set current message
        this.messageState.currentMessage = message;
        this.messageState.isShowing = true;
        
        // Format message text
        const formattedText = this.formatMessageText(message);
        
        // Update message element
        this.messageElement.textContent = formattedText;
        this.messageElement.className = `game-message ${message.className}`;
        
        // Add animation class
        this.messageElement.classList.add('message-slide-in');
        
        // Remove animation class after animation completes
        setTimeout(() => {
            this.messageElement.classList.remove('message-slide-in');
        }, 300);
        
        // Set auto-hide timer if not persistent
        if (!message.persistent) {
            this.messageState.autoHideTimer = setTimeout(() => {
                this.hideCurrentMessage();
            }, message.duration);
        }
        
        // Show detailed help for errors if requested
        if (message.showDetailedHelp && window.helpSystem) {
            setTimeout(() => {
                window.helpSystem.showErrorWithGuidance(message.text, {
                    ...message.context,
                    showDetailedHelp: true
                });
            }, 1000);
        }
    }
    
    /**
     * Format message text with icon
     * @param {Object} message - Message object
     * @returns {string} Formatted message text
     */
    formatMessageText(message) {
        if (message.icon && !message.text.startsWith(message.icon)) {
            return `${message.icon} ${message.text}`;
        }
        return message.text;
    }
    
    /**
     * Hide the current message
     */
    hideCurrentMessage() {
        if (!this.messageState.isShowing || !this.messageElement) {
            return;
        }
        
        // Add slide-out animation
        this.messageElement.classList.add('message-slide-out');
        
        setTimeout(() => {
            this.clearCurrentMessage();
            this.processMessageQueue();
        }, 300);
    }
    
    /**
     * Clear the current message
     */
    clearCurrentMessage() {
        if (this.messageState.autoHideTimer) {
            clearTimeout(this.messageState.autoHideTimer);
            this.messageState.autoHideTimer = null;
        }
        
        this.messageState.currentMessage = null;
        this.messageState.isShowing = false;
        
        if (this.messageElement) {
            this.messageElement.textContent = '';
            this.messageElement.className = 'game-message';
            this.messageElement.classList.remove('message-slide-in', 'message-slide-out');
        }
    }
    
    /**
     * Process the message queue
     */
    processMessageQueue() {
        if (this.messageState.messageQueue.length > 0) {
            const nextMessage = this.messageState.messageQueue.shift();
            setTimeout(() => {
                this.displayMessage(nextMessage);
            }, 100);
        }
    }
    
    /**
     * Sort message queue by priority
     */
    sortMessageQueue() {
        this.messageState.messageQueue.sort((a, b) => b.priority - a.priority);
    }
    
    /**
     * Show enhanced error message with help integration
     * @param {string} errorMessage - Error message text
     * @param {Object} context - Error context
     */
    showEnhancedError(errorMessage, context = {}) {
        // Use help system if available for enhanced error handling
        if (window.helpSystem) {
            window.helpSystem.showErrorWithGuidance(errorMessage, {
                ...context,
                showDetailedHelp: context.showDetailedHelp !== false
            });
        } else {
            // Fallback to regular error message
            this.showMessage(errorMessage, 'error', {
                duration: 6000,
                context: context
            });
        }
    }
    
    /**
     * Show contextual hint based on game state
     * @param {Object} gameState - Current game state
     */
    showContextualHint(gameState) {
        if (!gameState) return;
        
        const hints = this.generateContextualHints(gameState);
        
        if (hints.length > 0) {
            const randomHint = hints[Math.floor(Math.random() * hints.length)];
            this.showMessage(randomHint, 'hint', {
                duration: 5000
            });
        }
    }
    
    /**
     * Generate contextual hints based on game state
     * @param {Object} gameState - Current game state
     * @returns {Array} Array of hint messages
     */
    generateContextualHints(gameState) {
        const hints = [];
        
        // First move hint
        if (gameState.moveCount === 0) {
            hints.push("Start by moving the smallest disk (the top one)!");
            hints.push("Click on the smallest disk to select it, then click another rod to move it.");
        }
        
        // Stuck hints
        if (gameState.moveCount > gameState.metadata.optimalMoves * 1.5) {
            hints.push("Try using the Hint button to see the next optimal move.");
            hints.push("Remember: only the top disk on each rod can be moved.");
            hints.push("You can place any disk on an empty rod.");
            hints.push("Use the Undo button if you made a mistake.");
        }
        
        // Strategy hints
        if (gameState.moveCount > 5) {
            hints.push("The smallest disk should move frequently - it's key to the solution!");
            hints.push("Try to keep larger disks out of the way while moving smaller ones.");
            hints.push("Think ahead: where do you need to move the larger disks?");
        }
        
        // Near completion hints
        const totalDisks = gameState.metadata.numDisks;
        const targetRod = gameState.rods[2];
        if (targetRod.disks.length === totalDisks - 1) {
            hints.push("You're almost there! Just one more disk to go!");
        } else if (targetRod.disks.length >= totalDisks - 2) {
            hints.push("Great progress! You're very close to solving the puzzle!");
        }
        
        return hints;
    }
    
    /**
     * Show celebration message for achievements
     * @param {string} achievement - Achievement description
     * @param {Object} stats - Game statistics
     */
    showCelebration(achievement, stats = {}) {
        let message = `🎉 ${achievement}`;
        
        if (stats.isOptimalSolution) {
            message += " with the optimal solution!";
        } else if (stats.efficiency && stats.efficiency >= 80) {
            message += " Great efficiency!";
        }
        
        this.showMessage(message, 'celebration', {
            duration: 8000,
            persistent: false
        });
    }
    
    /**
     * Play message sound
     * @param {string} soundType - Type of sound to play
     */
    playMessageSound(soundType) {
        if (!soundType) return;
        
        // Check if audio is enabled (could be a user setting)
        const audioEnabled = localStorage.getItem('toh_audio_enabled') !== 'false';
        if (!audioEnabled) return;
        
        try {
            // Create audio context if needed (for web audio API)
            if (!this.audioContext && window.AudioContext) {
                this.audioContext = new AudioContext();
            }
            
            // Simple beep sounds using Web Audio API
            if (this.audioContext) {
                this.playBeepSound(soundType);
            }
        } catch (error) {
            // Audio not supported or blocked, silently continue
            console.log('Audio not available:', error.message);
        }
    }
    
    /**
     * Play beep sound using Web Audio API
     * @param {string} soundType - Type of sound
     */
    playBeepSound(soundType) {
        if (!this.audioContext) return;
        
        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(this.audioContext.destination);
        
        // Configure sound based on type
        switch (soundType) {
            case 'error':
                oscillator.frequency.setValueAtTime(200, this.audioContext.currentTime);
                oscillator.frequency.setValueAtTime(150, this.audioContext.currentTime + 0.1);
                gainNode.gain.setValueAtTime(0.1, this.audioContext.currentTime);
                gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.3);
                break;
            case 'success':
                oscillator.frequency.setValueAtTime(400, this.audioContext.currentTime);
                oscillator.frequency.setValueAtTime(600, this.audioContext.currentTime + 0.1);
                gainNode.gain.setValueAtTime(0.1, this.audioContext.currentTime);
                gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.2);
                break;
            case 'warning':
                oscillator.frequency.setValueAtTime(300, this.audioContext.currentTime);
                gainNode.gain.setValueAtTime(0.1, this.audioContext.currentTime);
                gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.4);
                break;
            case 'celebration':
                // Play a sequence of ascending notes
                const notes = [400, 500, 600, 800];
                notes.forEach((freq, index) => {
                    const osc = this.audioContext.createOscillator();
                    const gain = this.audioContext.createGain();
                    osc.connect(gain);
                    gain.connect(this.audioContext.destination);
                    
                    osc.frequency.setValueAtTime(freq, this.audioContext.currentTime + index * 0.1);
                    gain.gain.setValueAtTime(0.05, this.audioContext.currentTime + index * 0.1);
                    gain.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + index * 0.1 + 0.2);
                    
                    osc.start(this.audioContext.currentTime + index * 0.1);
                    osc.stop(this.audioContext.currentTime + index * 0.1 + 0.2);
                });
                return; // Don't start the main oscillator
        }
        
        oscillator.start(this.audioContext.currentTime);
        oscillator.stop(this.audioContext.currentTime + 0.5);
    }
    
    /**
     * Clear all messages
     */
    clearAllMessages() {
        this.clearCurrentMessage();
        this.messageState.messageQueue = [];
    }
    
    /**
     * Get message history
     * @param {number} limit - Maximum number of messages to return
     * @returns {Array} Array of recent messages
     */
    getMessageHistory(limit = 10) {
        return this.messageState.messageHistory.slice(-limit);
    }
    
    /**
     * Show message with custom duration
     * @param {string} text - Message text
     * @param {string} type - Message type
     * @param {number} duration - Duration in milliseconds
     */
    showTimedMessage(text, type = 'info', duration = 3000) {
        this.showMessage(text, type, { duration });
    }
    
    /**
     * Show persistent message that doesn't auto-hide
     * @param {string} text - Message text
     * @param {string} type - Message type
     */
    showPersistentMessage(text, type = 'info') {
        this.showMessage(text, type, { persistent: true });
    }
    
    /**
     * Hide persistent message manually
     */
    hidePersistentMessage() {
        if (this.messageState.currentMessage && this.messageState.currentMessage.persistent) {
            this.hideCurrentMessage();
        }
    }
    
    /**
     * Update message system settings
     * @param {Object} settings - Settings object
     */
    updateSettings(settings) {
        if (settings.audioEnabled !== undefined) {
            localStorage.setItem('toh_audio_enabled', settings.audioEnabled.toString());
        }
        
        if (settings.messageTypes) {
            Object.assign(this.messageTypes, settings.messageTypes);
        }
    }
}

// Create global message system instance
let messageSystem = null;

// Export for use by other modules
if (typeof module !== 'undefined' && module.exports) {
    // Node.js environment (for testing)
    module.exports = { MessageSystem };
} else {
    // Browser environment
    window.MessageSystem = MessageSystem;
    
    // Initialize message system when DOM is loaded
    document.addEventListener('DOMContentLoaded', () => {
        messageSystem = new MessageSystem();
        window.messageSystem = messageSystem;
    });
}