/**
 * Accessibility System for Towers of Hanoi
 * 
 * This module provides comprehensive accessibility features including
 * screen reader support, keyboard navigation, high contrast mode,
 * and other accessibility enhancements.
 */

/**
 * Accessibility System class for managing accessibility features
 */
class AccessibilitySystem {
    constructor() {
        // Accessibility state
        this.accessibilityState = {
            screenReaderEnabled: this.detectScreenReader(),
            highContrastMode: false,
            reducedMotion: this.detectReducedMotion(),
            keyboardNavigation: false,
            currentFocus: null,
            announcements: [],
            lastAnnouncement: null
        };
        
        // Keyboard shortcuts
        this.keyboardShortcuts = {
            'KeyH': { action: 'hint', description: 'Get hint' },
            'KeyS': { action: 'solve', description: 'Auto-solve puzzle' },
            'KeyP': { action: 'pause', description: 'Pause/Resume auto-solve' },
            'KeyR': { action: 'reset', description: 'Reset game', ctrlKey: true },
            'KeyZ': { action: 'undo', description: 'Undo last move', ctrlKey: true },
            'Digit1': { action: 'selectRod', rod: 0, description: 'Select left rod' },
            'Digit2': { action: 'selectRod', rod: 1, description: 'Select middle rod' },
            'Digit3': { action: 'selectRod', rod: 2, description: 'Select right rod' },
            'F1': { action: 'help', description: 'Show help' },
            'Escape': { action: 'cancel', description: 'Cancel current action' }
        };
        
        // Screen reader announcements
        this.announcements = {
            gameStart: "Towers of Hanoi game started. Use arrow keys to navigate, Enter to select.",
            diskSelected: (disk, rod) => `Disk ${disk} selected from ${this.getRodName(rod)}.`,
            diskMoved: (disk, fromRod, toRod) => `Disk ${disk} moved from ${this.getRodName(fromRod)} to ${this.getRodName(toRod)}.`,
            invalidMove: (reason) => `Invalid move: ${reason}`,
            gameWon: (moves, optimal) => `Congratulations! Puzzle solved in ${moves} moves. Optimal solution is ${optimal} moves.`,
            hintGiven: (fromRod, toRod) => `Hint: Move disk from ${this.getRodName(fromRod)} to ${this.getRodName(toRod)}.`,
            gameReset: "Game reset. All disks are now on the left rod.",
            undoMove: (disk, fromRod, toRod) => `Move undone: Disk ${disk} returned from ${this.getRodName(fromRod)} to ${this.getRodName(toRod)}.`
        };
        
        // Initialize accessibility features
        this.initialize();
    }
    
    /**
     * Initialize the accessibility system
     */
    initialize() {
        this.createAccessibilityElements();
        this.setupKeyboardNavigation();
        this.setupScreenReaderSupport();
        this.setupHighContrastMode();
        this.setupReducedMotionSupport();
        this.addAccessibilityControls();
    }
    
    /**
     * Create accessibility-specific DOM elements
     */
    createAccessibilityElements() {
        // Create live region for announcements
        this.createLiveRegion();
        
        // Create keyboard shortcuts help
        this.createKeyboardShortcutsHelp();
        
        // Create game state description for screen readers
        this.createGameStateDescription();
    }
    
    /**
     * Create ARIA live region for screen reader announcements
     */
    createLiveRegion() {
        // Create assertive live region for important announcements
        this.assertiveLiveRegion = document.createElement('div');
        this.assertiveLiveRegion.id = 'assertive-announcements';
        this.assertiveLiveRegion.className = 'sr-only';
        this.assertiveLiveRegion.setAttribute('aria-live', 'assertive');
        this.assertiveLiveRegion.setAttribute('aria-atomic', 'true');
        document.body.appendChild(this.assertiveLiveRegion);
        
        // Create polite live region for general announcements
        this.politeLiveRegion = document.createElement('div');
        this.politeLiveRegion.id = 'polite-announcements';
        this.politeLiveRegion.className = 'sr-only';
        this.politeLiveRegion.setAttribute('aria-live', 'polite');
        this.politeLiveRegion.setAttribute('aria-atomic', 'true');
        document.body.appendChild(this.politeLiveRegion);
    }
    
    /**
     * Create keyboard shortcuts help
     */
    createKeyboardShortcutsHelp() {
        const shortcutsHelp = document.createElement('div');
        shortcutsHelp.id = 'keyboard-shortcuts-help';
        shortcutsHelp.className = 'sr-only';
        shortcutsHelp.setAttribute('aria-label', 'Keyboard shortcuts');
        
        let shortcutsText = 'Keyboard shortcuts: ';
        for (const [key, shortcut] of Object.entries(this.keyboardShortcuts)) {
            const keyName = this.getKeyDisplayName(key);
            const modifier = shortcut.ctrlKey ? 'Ctrl+' : '';
            shortcutsText += `${modifier}${keyName} for ${shortcut.description}. `;
        }
        
        shortcutsHelp.textContent = shortcutsText;
        document.body.appendChild(shortcutsHelp);
    }
    
    /**
     * Create game state description for screen readers
     */
    createGameStateDescription() {
        this.gameStateDescription = document.createElement('div');
        this.gameStateDescription.id = 'game-state-description';
        this.gameStateDescription.className = 'sr-only';
        this.gameStateDescription.setAttribute('aria-live', 'polite');
        this.gameStateDescription.setAttribute('aria-label', 'Current game state');
        document.body.appendChild(this.gameStateDescription);
    }
    
    /**
     * Setup keyboard navigation
     */
    setupKeyboardNavigation() {
        // Enhanced keyboard event handler
        document.addEventListener('keydown', (event) => {
            this.handleKeyboardInput(event);
        });
        
        // Track keyboard navigation usage
        document.addEventListener('keydown', (event) => {
            if (event.key === 'Tab' || event.key.startsWith('Arrow')) {
                this.accessibilityState.keyboardNavigation = true;
            }
        });
        
        // Focus management for canvas
        const canvas = document.getElementById('game-canvas');
        if (canvas) {
            canvas.addEventListener('focus', () => {
                this.announceGameState();
            });
            
            canvas.addEventListener('blur', () => {
                this.accessibilityState.currentFocus = null;
            });
        }
    }
    
    /**
     * Handle keyboard input for accessibility
     */
    handleKeyboardInput(event) {
        const shortcut = this.keyboardShortcuts[event.code];
        
        if (shortcut) {
            // Check if modifier key requirement is met
            if (shortcut.ctrlKey && !event.ctrlKey) {
                return;
            }
            
            // Prevent default behavior
            event.preventDefault();
            
            // Execute shortcut action
            this.executeShortcutAction(shortcut, event);
        }
        
        // Handle additional accessibility keys
        this.handleAccessibilityKeys(event);
    }
    
    /**
     * Execute keyboard shortcut action
     */
    executeShortcutAction(shortcut, event) {
        switch (shortcut.action) {
            case 'hint':
                this.triggerHint();
                break;
            case 'solve':
                this.triggerSolve();
                break;
            case 'pause':
                this.triggerPause();
                break;
            case 'reset':
                this.triggerReset();
                break;
            case 'undo':
                this.triggerUndo();
                break;
            case 'selectRod':
                this.selectRod(shortcut.rod);
                break;
            case 'help':
                this.showHelp();
                break;
            case 'cancel':
                this.cancelCurrentAction();
                break;
        }
    }
    
    /**
     * Handle additional accessibility-specific keys
     */
    handleAccessibilityKeys(event) {
        switch (event.key) {
            case 'Tab':
                // Announce focused element
                setTimeout(() => {
                    this.announceFocusedElement();
                }, 100);
                break;
                
            case 'Enter':
            case ' ':
                // Handle canvas interaction
                if (event.target.id === 'game-canvas') {
                    event.preventDefault();
                    this.handleCanvasInteraction();
                }
                break;
                
            case 'ArrowLeft':
            case 'ArrowRight':
                // Navigate between rods when canvas is focused
                if (event.target.id === 'game-canvas') {
                    event.preventDefault();
                    this.navigateRods(event.key === 'ArrowRight' ? 1 : -1);
                }
                break;
        }
    }
    
    /**
     * Setup screen reader support
     */
    setupScreenReaderSupport() {
        // Detect screen reader usage
        this.detectScreenReaderUsage();
        
        // Enhance existing elements with better descriptions
        this.enhanceElementDescriptions();
        
        // Setup game state announcements
        this.setupGameStateAnnouncements();
    }
    
    /**
     * Detect screen reader usage
     */
    detectScreenReaderUsage() {
        // Check for common screen reader indicators
        const indicators = [
            () => navigator.userAgent.includes('NVDA'),
            () => navigator.userAgent.includes('JAWS'),
            () => navigator.userAgent.includes('VoiceOver'),
            () => window.speechSynthesis && window.speechSynthesis.getVoices().length > 0,
            () => 'speechSynthesis' in window
        ];
        
        this.accessibilityState.screenReaderEnabled = indicators.some(check => {
            try {
                return check();
            } catch (e) {
                return false;
            }
        });
    }
    
    /**
     * Enhance element descriptions for screen readers
     */
    enhanceElementDescriptions() {
        // Enhance game statistics
        const stats = document.querySelectorAll('.stat');
        stats.forEach((stat, index) => {
            const label = stat.querySelector('label');
            const value = stat.querySelector('span');
            
            if (label && value) {
                value.setAttribute('aria-label', `${label.textContent} ${value.textContent}`);
            }
        });
        
        // Enhance control buttons with detailed descriptions
        const buttons = document.querySelectorAll('.control-btn');
        buttons.forEach(button => {
            if (!button.getAttribute('aria-describedby')) {
                const description = this.getButtonDescription(button.id);
                if (description) {
                    const descId = `${button.id}-description`;
                    const descElement = document.createElement('span');
                    descElement.id = descId;
                    descElement.className = 'sr-only';
                    descElement.textContent = description;
                    button.parentNode.appendChild(descElement);
                    button.setAttribute('aria-describedby', descId);
                }
            }
        });
    }
    
    /**
     * Get detailed button description
     */
    getButtonDescription(buttonId) {
        const descriptions = {
            'reset-btn': 'Starts a new game with all disks on the left rod',
            'undo-btn': 'Reverses the last move you made',
            'hint-btn': 'Shows you the next optimal move to make',
            'solve-btn': 'Automatically solves the puzzle step by step',
            'pause-btn': 'Pauses or resumes the automatic solution',
            'achievements-btn': 'Shows your game achievements and statistics'
        };
        
        return descriptions[buttonId];
    }
    
    /**
     * Setup game state announcements
     */
    setupGameStateAnnouncements() {
        // Listen for game state changes
        if (window.addEventListener) {
            window.addEventListener('gameStateChanged', (event) => {
                this.handleGameStateChange(event.detail);
            });
        }
    }
    
    /**
     * Setup high contrast mode
     */
    setupHighContrastMode() {
        // Detect system high contrast preference
        if (window.matchMedia) {
            const highContrastQuery = window.matchMedia('(prefers-contrast: high)');
            this.accessibilityState.highContrastMode = highContrastQuery.matches;
            
            highContrastQuery.addEventListener('change', (e) => {
                this.accessibilityState.highContrastMode = e.matches;
                this.applyHighContrastMode(e.matches);
            });
            
            if (this.accessibilityState.highContrastMode) {
                this.applyHighContrastMode(true);
            }
        }
        
        // Add high contrast toggle
        this.addHighContrastToggle();
    }
    
    /**
     * Apply high contrast mode
     */
    applyHighContrastMode(enabled) {
        document.body.classList.toggle('high-contrast', enabled);
        
        if (enabled) {
            this.announce('High contrast mode enabled', 'polite');
        }
    }
    
    /**
     * Add high contrast toggle button
     */
    addHighContrastToggle() {
        const toggle = document.createElement('button');
        toggle.id = 'high-contrast-toggle';
        toggle.className = 'control-btn accessibility-btn';
        toggle.textContent = 'High Contrast';
        toggle.setAttribute('aria-label', 'Toggle high contrast mode');
        toggle.setAttribute('aria-pressed', this.accessibilityState.highContrastMode.toString());
        
        toggle.addEventListener('click', () => {
            this.accessibilityState.highContrastMode = !this.accessibilityState.highContrastMode;
            this.applyHighContrastMode(this.accessibilityState.highContrastMode);
            toggle.setAttribute('aria-pressed', this.accessibilityState.highContrastMode.toString());
        });
        
        // Add to settings group
        const settingsGroup = document.querySelector('.settings-group');
        if (settingsGroup) {
            settingsGroup.appendChild(toggle);
        }
    }
    
    /**
     * Setup reduced motion support
     */
    setupReducedMotionSupport() {
        if (this.accessibilityState.reducedMotion) {
            document.body.classList.add('reduced-motion');
            this.announce('Reduced motion mode active', 'polite');
        }
    }
    
    /**
     * Add accessibility controls
     */
    addAccessibilityControls() {
        // Create accessibility panel
        const panel = document.createElement('div');
        panel.id = 'accessibility-panel';
        panel.className = 'accessibility-panel';
        panel.setAttribute('role', 'region');
        panel.setAttribute('aria-label', 'Accessibility options');
        
        panel.innerHTML = `
            <h3>Accessibility Options</h3>
            <label>
                <input type="checkbox" id="screen-reader-mode" ${this.accessibilityState.screenReaderEnabled ? 'checked' : ''}>
                Enhanced screen reader support
            </label>
            <label>
                <input type="checkbox" id="keyboard-help" checked>
                Show keyboard shortcuts
            </label>
            <button id="announce-state-btn" class="control-btn">Announce Game State</button>
        `;
        
        // Add event listeners
        panel.querySelector('#screen-reader-mode').addEventListener('change', (e) => {
            this.accessibilityState.screenReaderEnabled = e.target.checked;
            this.announce(e.target.checked ? 'Screen reader support enabled' : 'Screen reader support disabled', 'assertive');
        });
        
        panel.querySelector('#announce-state-btn').addEventListener('click', () => {
            this.announceGameState();
        });
        
        // Add panel to page (initially hidden)
        panel.style.display = 'none';
        document.body.appendChild(panel);
        
        // Add toggle button for accessibility panel
        this.addAccessibilityPanelToggle();
    }
    
    /**
     * Add accessibility panel toggle
     */
    addAccessibilityPanelToggle() {
        const toggle = document.createElement('button');
        toggle.id = 'accessibility-toggle';
        toggle.className = 'control-btn accessibility-btn';
        toggle.textContent = 'A11y';
        toggle.setAttribute('aria-label', 'Toggle accessibility options');
        toggle.setAttribute('aria-expanded', 'false');
        toggle.setAttribute('aria-controls', 'accessibility-panel');
        
        toggle.addEventListener('click', () => {
            const panel = document.getElementById('accessibility-panel');
            const isVisible = panel.style.display !== 'none';
            
            panel.style.display = isVisible ? 'none' : 'block';
            toggle.setAttribute('aria-expanded', (!isVisible).toString());
            
            if (!isVisible) {
                this.announce('Accessibility options opened', 'polite');
            }
        });
        
        // Add to settings group
        const settingsGroup = document.querySelector('.settings-group');
        if (settingsGroup) {
            settingsGroup.appendChild(toggle);
        }
    }
    
    /**
     * Announce message to screen readers
     */
    announce(message, priority = 'polite') {
        if (!this.accessibilityState.screenReaderEnabled && priority !== 'assertive') {
            return;
        }
        
        const liveRegion = priority === 'assertive' ? this.assertiveLiveRegion : this.politeLiveRegion;
        
        // Clear previous announcement
        liveRegion.textContent = '';
        
        // Add new announcement after a brief delay to ensure it's read
        setTimeout(() => {
            liveRegion.textContent = message;
            
            // Store announcement in history
            this.accessibilityState.announcements.push({
                message,
                priority,
                timestamp: new Date()
            });
            
            // Keep only last 20 announcements
            if (this.accessibilityState.announcements.length > 20) {
                this.accessibilityState.announcements.shift();
            }
            
            this.accessibilityState.lastAnnouncement = message;
        }, 100);
    }
    
    /**
     * Announce current game state
     */
    announceGameState() {
        if (!window.gameState) return;
        
        const gameState = window.gameState;
        let description = `Game state: `;
        
        // Describe each rod
        for (let i = 0; i < 3; i++) {
            const rod = gameState.rods[i];
            const rodName = this.getRodName(i);
            
            if (rod.disks.length === 0) {
                description += `${rodName} is empty. `;
            } else {
                const diskList = rod.disks.map(disk => `disk ${disk}`).join(', ');
                description += `${rodName} has ${diskList} from bottom to top. `;
            }
        }
        
        // Add game statistics
        description += `You have made ${gameState.moveCount} moves. `;
        description += `Optimal solution requires ${gameState.metadata.optimalMoves} moves. `;
        
        // Add current selection if any
        if (gameState.selectedDisk) {
            description += `Disk ${gameState.selectedDisk} is currently selected from ${this.getRodName(gameState.selectedRod)}. `;
        }
        
        this.announce(description, 'polite');
        
        // Also update the game state description element
        if (this.gameStateDescription) {
            this.gameStateDescription.textContent = description;
        }
    }
    
    /**
     * Get rod name for announcements
     */
    getRodName(rodIndex) {
        const names = ['left rod', 'middle rod', 'right rod'];
        return names[rodIndex] || `rod ${rodIndex + 1}`;
    }
    
    /**
     * Get display name for keyboard key
     */
    getKeyDisplayName(keyCode) {
        const keyNames = {
            'KeyH': 'H',
            'KeyS': 'S',
            'KeyP': 'P',
            'KeyR': 'R',
            'KeyZ': 'Z',
            'Digit1': '1',
            'Digit2': '2',
            'Digit3': '3',
            'F1': 'F1',
            'Escape': 'Escape'
        };
        
        return keyNames[keyCode] || keyCode;
    }
    
    /**
     * Detect if user prefers reduced motion
     */
    detectReducedMotion() {
        if (window.matchMedia) {
            return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        }
        return false;
    }
    
    /**
     * Detect screen reader presence
     */
    detectScreenReader() {
        // Check for common screen reader indicators
        return !!(
            navigator.userAgent.includes('NVDA') ||
            navigator.userAgent.includes('JAWS') ||
            navigator.userAgent.includes('VoiceOver') ||
            window.speechSynthesis
        );
    }
    
    /**
     * Trigger hint action
     */
    triggerHint() {
        const hintBtn = document.getElementById('hint-btn');
        if (hintBtn && !hintBtn.disabled) {
            hintBtn.click();
            this.announce('Hint requested', 'polite');
        }
    }
    
    /**
     * Trigger solve action
     */
    triggerSolve() {
        const solveBtn = document.getElementById('solve-btn');
        if (solveBtn && !solveBtn.disabled) {
            solveBtn.click();
            this.announce('Auto-solve started', 'assertive');
        }
    }
    
    /**
     * Trigger pause action
     */
    triggerPause() {
        const pauseBtn = document.getElementById('pause-btn');
        if (pauseBtn && pauseBtn.style.display !== 'none') {
            pauseBtn.click();
            this.announce('Auto-solve paused or resumed', 'assertive');
        }
    }
    
    /**
     * Trigger reset action
     */
    triggerReset() {
        const resetBtn = document.getElementById('reset-btn');
        if (resetBtn && !resetBtn.disabled) {
            resetBtn.click();
            this.announce('Game reset', 'assertive');
        }
    }
    
    /**
     * Trigger undo action
     */
    triggerUndo() {
        const undoBtn = document.getElementById('undo-btn');
        if (undoBtn && !undoBtn.disabled) {
            undoBtn.click();
            this.announce('Move undone', 'polite');
        }
    }
    
    /**
     * Select rod by index
     */
    selectRod(rodIndex) {
        if (window.inputHandler) {
            // Simulate rod click
            window.inputHandler.handleRodClick(rodIndex, { x: 0, y: 0 });
            this.announce(`${this.getRodName(rodIndex)} selected`, 'polite');
        }
    }
    
    /**
     * Show help
     */
    showHelp() {
        if (window.helpSystem) {
            window.helpSystem.showHelpMenu();
            this.announce('Help menu opened', 'polite');
        }
    }
    
    /**
     * Cancel current action
     */
    cancelCurrentAction() {
        if (window.gameState && window.gameState.selectedDisk) {
            if (window.GameEngine) {
                window.GameEngine.clearSelection(window.gameState);
                this.announce('Selection cancelled', 'polite');
            }
        }
    }
    
    /**
     * Handle canvas interaction
     */
    handleCanvasInteraction() {
        // This would be called when Enter/Space is pressed on canvas
        // Implementation depends on current game state
        if (window.gameState) {
            if (window.gameState.selectedDisk === null) {
                // No disk selected, select first available
                for (let i = 0; i < 3; i++) {
                    if (window.gameState.rods[i].disks.length > 0) {
                        this.selectRod(i);
                        break;
                    }
                }
            } else {
                // Disk selected, try to move to next available rod
                const validDestinations = window.GameEngine ? 
                    window.GameEngine.getValidDestinations(window.gameState, window.gameState.selectedRod) : [];
                
                if (validDestinations.length > 0) {
                    this.selectRod(validDestinations[0]);
                }
            }
        }
    }
    
    /**
     * Navigate between rods
     */
    navigateRods(direction) {
        // This is a placeholder for rod navigation
        // Implementation would depend on current focus state
        this.announce(`Navigating ${direction > 0 ? 'right' : 'left'}`, 'polite');
    }
    
    /**
     * Announce focused element
     */
    announceFocusedElement() {
        const focused = document.activeElement;
        if (focused && focused.getAttribute('aria-label')) {
            this.announce(`Focused: ${focused.getAttribute('aria-label')}`, 'polite');
        }
    }
    
    /**
     * Handle game state change
     */
    handleGameStateChange(changeInfo) {
        if (!this.accessibilityState.screenReaderEnabled) return;
        
        switch (changeInfo.type) {
            case 'diskMoved':
                this.announce(this.announcements.diskMoved(changeInfo.disk, changeInfo.fromRod, changeInfo.toRod), 'polite');
                break;
            case 'diskSelected':
                this.announce(this.announcements.diskSelected(changeInfo.disk, changeInfo.rod), 'polite');
                break;
            case 'invalidMove':
                this.announce(this.announcements.invalidMove(changeInfo.reason), 'assertive');
                break;
            case 'gameWon':
                this.announce(this.announcements.gameWon(changeInfo.moves, changeInfo.optimal), 'assertive');
                break;
            case 'gameReset':
                this.announce(this.announcements.gameReset, 'assertive');
                break;
        }
    }
    
    /**
     * Update accessibility state
     */
    updateAccessibilityState(newState) {
        Object.assign(this.accessibilityState, newState);
    }
    
    /**
     * Get accessibility state
     */
    getAccessibilityState() {
        return { ...this.accessibilityState };
    }
}

// Create global accessibility system instance
let accessibilitySystem = null;

// Export for use by other modules
if (typeof module !== 'undefined' && module.exports) {
    // Node.js environment (for testing)
    module.exports = { AccessibilitySystem };
} else {
    // Browser environment
    window.AccessibilitySystem = AccessibilitySystem;
    
    // Initialize accessibility system when DOM is loaded
    document.addEventListener('DOMContentLoaded', () => {
        accessibilitySystem = new AccessibilitySystem();
        window.accessibilitySystem = accessibilitySystem;
    });
}