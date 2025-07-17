/**
 * Input Handler for Towers of Hanoi
 * 
 * This module handles all user input including mouse, touch, and keyboard
 * interactions, providing a consistent interface for game control.
 */

/**
 * Input Handler class for managing user interactions
 */
class InputHandler {
    constructor(canvas, gameState, renderer, animationSystem) {
        this.canvas = canvas;
        this.gameState = gameState;
        this.renderer = renderer;
        this.animationSystem = animationSystem;

        // Input state
        this.inputState = {
            isMouseDown: false,
            isDragging: false,
            draggedDisk: null,
            dragStartRod: null,
            dragStartPos: { x: 0, y: 0 },
            currentPos: { x: 0, y: 0 },
            lastClickTime: 0,
            doubleClickThreshold: 300, // ms
            touchStarted: false,
            longPressTimer: null,
            longPressThreshold: 500, // ms
            preventContextMenu: false,
            hoveredRod: -1
        };

        // Bind event handlers
        this.handleMouseDown = this.handleMouseDown.bind(this);
        this.handleMouseMove = this.handleMouseMove.bind(this);
        this.handleMouseUp = this.handleMouseUp.bind(this);
        this.handleTouchStart = this.handleTouchStart.bind(this);
        this.handleTouchMove = this.handleTouchMove.bind(this);
        this.handleTouchEnd = this.handleTouchEnd.bind(this);
        this.handleKeyDown = this.handleKeyDown.bind(this);
        this.handleContextMenu = this.handleContextMenu.bind(this);

        // Initialize event listeners
        this.setupEventListeners();
    }

    /**
     * Set up event listeners for all input types
     */
    setupEventListeners() {
        // Mouse events
        this.canvas.addEventListener('mousedown', this.handleMouseDown);
        window.addEventListener('mousemove', this.handleMouseMove);
        window.addEventListener('mouseup', this.handleMouseUp);

        // Touch events
        this.canvas.addEventListener('touchstart', this.handleTouchStart, { passive: false });
        window.addEventListener('touchmove', this.handleTouchMove, { passive: false });
        window.addEventListener('touchend', this.handleTouchEnd);

        // Keyboard events
        window.addEventListener('keydown', this.handleKeyDown);

        // Prevent context menu on right-click
        this.canvas.addEventListener('contextmenu', this.handleContextMenu);
    }

    /**
     * Remove all event listeners
     */
    removeEventListeners() {
        this.canvas.removeEventListener('mousedown', this.handleMouseDown);
        window.removeEventListener('mousemove', this.handleMouseMove);
        window.removeEventListener('mouseup', this.handleMouseUp);

        this.canvas.removeEventListener('touchstart', this.handleTouchStart);
        window.removeEventListener('touchmove', this.handleTouchMove);
        window.removeEventListener('touchend', this.handleTouchEnd);

        window.removeEventListener('keydown', this.handleKeyDown);

        this.canvas.removeEventListener('contextmenu', this.handleContextMenu);
    }

    /**
     * Handle mouse down event
     */
    handleMouseDown(event) {
        // Don't handle input during animations
        if (this.animationSystem && this.animationSystem.isCurrentlyAnimating()) {
            return;
        }

        const coords = this.getCanvasCoordinates(event.clientX, event.clientY);
        this.inputState.isMouseDown = true;
        this.inputState.dragStartPos = { ...coords };
        this.inputState.currentPos = { ...coords };

        // Check for double click
        const now = Date.now();
        const isDoubleClick = (now - this.inputState.lastClickTime) < this.inputState.doubleClickThreshold;
        this.inputState.lastClickTime = now;

        // Detect rod click
        const rodIndex = this.detectRodClick(coords.x, coords.y);

        if (rodIndex !== -1) {
            // Handle rod click
            if (isDoubleClick) {
                this.handleDoubleClick(rodIndex);
            } else {
                this.handleRodClick(rodIndex, coords);
            }
        } else {
            // Clicked outside rods, clear selection
            this.clearSelection();
        }
    }

    /**
     * Handle mouse move event
     */
    handleMouseMove(event) {
        const coords = this.getCanvasCoordinates(event.clientX, event.clientY);
        this.inputState.currentPos = { ...coords };

        // Handle dragging
        if (this.inputState.isMouseDown && !this.inputState.isDragging) {
            // Check if we've moved enough to start dragging
            const dx = coords.x - this.inputState.dragStartPos.x;
            const dy = coords.y - this.inputState.dragStartPos.y;
            const distance = Math.sqrt(dx * dx + dy * dy);

            if (distance > 5) { // Drag threshold
                this.startDragging();
            }
        }

        // Update drag position
        if (this.inputState.isDragging) {
            this.updateDragPosition(coords);
        } else {
            // Handle hover effects
            this.handleHover(coords);
        }
    }

    /**
     * Handle mouse up event
     */
    handleMouseUp(event) {
        if (this.inputState.isDragging) {
            const coords = this.getCanvasCoordinates(event.clientX, event.clientY);
            this.endDragging(coords);
        }

        this.inputState.isMouseDown = false;
        this.inputState.isDragging = false;
    }

    /**
     * Handle touch start event
     */
    handleTouchStart(event) {
        event.preventDefault(); // Prevent scrolling

        // Don't handle input during animations
        if (this.animationSystem && this.animationSystem.isCurrentlyAnimating()) {
            return;
        }

        if (event.touches.length === 1) {
            const touch = event.touches[0];
            const coords = this.getCanvasCoordinates(touch.clientX, touch.clientY);

            this.inputState.touchStarted = true;
            this.inputState.dragStartPos = { ...coords };
            this.inputState.currentPos = { ...coords };

            // Start long press timer
            this.inputState.longPressTimer = setTimeout(() => {
                this.handleLongPress(coords);
            }, this.inputState.longPressThreshold);

            // Detect rod touch
            const rodIndex = this.detectRodClick(coords.x, coords.y);

            if (rodIndex !== -1) {
                this.handleRodClick(rodIndex, coords);
            } else {
                this.clearSelection();
            }
        }
    }

    /**
     * Handle touch move event
     */
    handleTouchMove(event) {
        if (!this.inputState.touchStarted) return;

        event.preventDefault(); // Prevent scrolling

        if (event.touches.length === 1) {
            const touch = event.touches[0];
            const coords = this.getCanvasCoordinates(touch.clientX, touch.clientY);
            this.inputState.currentPos = { ...coords };

            // Clear long press timer if moving
            if (this.inputState.longPressTimer) {
                clearTimeout(this.inputState.longPressTimer);
                this.inputState.longPressTimer = null;
            }

            // Check if we've moved enough to start dragging
            if (!this.inputState.isDragging) {
                const dx = coords.x - this.inputState.dragStartPos.x;
                const dy = coords.y - this.inputState.dragStartPos.y;
                const distance = Math.sqrt(dx * dx + dy * dy);

                if (distance > 10) { // Higher threshold for touch
                    this.startDragging();
                }
            }

            // Update drag position
            if (this.inputState.isDragging) {
                this.updateDragPosition(coords);
            }
        }
    }

    /**
     * Handle touch end event
     */
    handleTouchEnd(event) {
        // Clear long press timer
        if (this.inputState.longPressTimer) {
            clearTimeout(this.inputState.longPressTimer);
            this.inputState.longPressTimer = null;
        }

        if (this.inputState.isDragging) {
            let coords;

            if (event.changedTouches && event.changedTouches.length > 0) {
                const touch = event.changedTouches[0];
                coords = this.getCanvasCoordinates(touch.clientX, touch.clientY);
            } else {
                coords = { ...this.inputState.currentPos };
            }

            this.endDragging(coords);
        }

        this.inputState.touchStarted = false;
        this.inputState.isDragging = false;
    }

    /**
     * Handle keyboard input
     */
    handleKeyDown(event) {
        // Don't handle input during animations
        if (this.animationSystem && this.animationSystem.isCurrentlyAnimating()) {
            return;
        }

        switch (event.key) {
            case 'ArrowLeft':
            case 'a':
                this.handleKeyboardNavigation(-1);
                event.preventDefault();
                break;

            case 'ArrowRight':
            case 'd':
                this.handleKeyboardNavigation(1);
                event.preventDefault();
                break;

            case 'Enter':
            case ' ': // Space
                this.handleKeyboardSelect();
                event.preventDefault();
                break;

            case 'Escape':
                this.clearSelection();
                event.preventDefault();
                break;

            case 'z':
                if (event.ctrlKey || event.metaKey) {
                    this.handleUndo();
                    event.preventDefault();
                }
                break;

            case 'r':
                if (event.ctrlKey || event.metaKey) {
                    this.handleReset();
                    event.preventDefault();
                }
                break;
        }
    }

    /**
     * Handle context menu (right-click)
     */
    handleContextMenu(event) {
        if (this.inputState.preventContextMenu) {
            event.preventDefault();
            this.inputState.preventContextMenu = false;
        }
    }

    /**
     * Get canvas coordinates from client coordinates
     */
    getCanvasCoordinates(clientX, clientY) {
        const rect = this.canvas.getBoundingClientRect();
        return {
            x: clientX - rect.left,
            y: clientY - rect.top
        };
    }

    /**
     * Detect which rod was clicked
     */
    detectRodClick(x, y) {
        if (!this.renderer) return -1;

        return this.renderer.detectRodClick(x, y);
    }

    /**
     * Handle rod click
     */
    handleRodClick(rodIndex, coords) {
        if (!this.gameState) return;

        if (this.gameState.selectedDisk === null) {
            // No disk selected, try to select from this rod
            const result = window.GameEngine.selectDisk(this.gameState, rodIndex);

            if (result.success) {
                this.updateUI();
                this.showMessage(`Selected disk ${result.selectedDisk} from rod ${rodIndex + 1}. Click another rod to move it.`, 'info');
            } else {
                this.showEnhancedError(result.error.message, {
                    action: 'select_disk',
                    rodIndex: rodIndex,
                    gameState: this.gameState
                });
                this.triggerInvalidMoveEffect();
            }
        } else {
            // Disk already selected, try to move it to this rod
            const fromRod = this.gameState.selectedRod;
            const diskToMove = this.gameState.selectedDisk;
            const result = window.GameEngine.moveSelectedDisk(this.gameState, rodIndex);

            if (result.success) {
                // Animate the move
                if (this.animationSystem) {
                    this.animationSystem.animateDiskMove(diskToMove, fromRod, rodIndex, () => {
                        // Animation complete callback
                        this.updateUI();
                        const stats = window.GameEngine.getGameStats(this.gameState);

                        if (result.gameComplete) {
                            // Start win celebration
                            if (this.animationSystem) {
                                this.animationSystem.startWinCelebration();
                            }
                            this.triggerHapticFeedback('success');
                            this.showMessage(`🎉 Congratulations! You solved the puzzle in ${stats.moveCount} moves! ${stats.isOptimalSolution ? '(Optimal solution!)' : ''}`, 'success');
                        } else {
                            this.triggerHapticFeedback('light');
                            this.showMessage(`Moved disk ${result.diskMoved} to rod ${rodIndex + 1}. Move ${stats.moveCount}/${stats.optimalMoves}`, 'success');
                        }
                    });
                } else {
                    // Fallback without animation
                    this.updateUI();
                    const stats = window.GameEngine.getGameStats(this.gameState);

                    if (result.gameComplete) {
                        this.showMessage(`🎉 Congratulations! You solved the puzzle in ${stats.moveCount} moves! ${stats.isOptimalSolution ? '(Optimal solution!)' : ''}`, 'success');
                    } else {
                        this.showMessage(`Moved disk ${result.diskMoved} to rod ${rodIndex + 1}. Move ${stats.moveCount}/${stats.optimalMoves}`, 'success');
                    }
                }
            } else {
                this.showEnhancedError(result.error.message, {
                    action: 'move_disk',
                    fromRod: fromRod,
                    toRod: rodIndex,
                    diskToMove: diskToMove,
                    gameState: this.gameState
                });
                this.triggerInvalidMoveEffect();
            }
        }
    }

    /**
     * Handle double click on a rod
     */
    handleDoubleClick(rodIndex) {
        if (!this.gameState) return;

        // Double-click to auto-move top disk to best destination
        const rod = this.gameState.rods[rodIndex];

        if (rod.disks.length === 0) {
            this.showMessage('No disk to move on this rod', 'error');
            return;
        }

        // Find valid destinations
        const validDestinations = window.GameEngine.getValidDestinations(this.gameState, rodIndex);

        if (validDestinations.length === 0) {
            this.showMessage('No valid moves for this disk', 'error');
            this.triggerInvalidMoveEffect();
            return;
        }

        // Select the first valid destination
        const toRod = validDestinations[0];
        const diskToMove = rod.disks[rod.disks.length - 1];

        // Execute the move
        const result = window.GameEngine.makeMove(this.gameState, rodIndex, toRod);

        if (result.success) {
            // Animate the move
            if (this.animationSystem) {
                this.animationSystem.animateDiskMove(diskToMove, rodIndex, toRod, () => {
                    this.updateUI();
                    const stats = window.GameEngine.getGameStats(this.gameState);

                    if (result.gameComplete) {
                        if (this.animationSystem) {
                            this.animationSystem.startWinCelebration();
                        }
                        this.showMessage(`🎉 Congratulations! You solved the puzzle in ${stats.moveCount} moves!`, 'success');
                    } else {
                        this.showMessage(`Auto-moved disk ${diskToMove} to rod ${toRod + 1}`, 'success');
                    }
                });
            } else {
                this.updateUI();
                this.showMessage(`Auto-moved disk ${diskToMove} to rod ${toRod + 1}`, 'success');
            }
        }
    }

    /**
     * Handle long press (for touch devices)
     */
    handleLongPress(coords) {
        const rodIndex = this.detectRodClick(coords.x, coords.y);

        if (rodIndex !== -1) {
            this.handleDoubleClick(rodIndex);
        }
    }

    /**
     * Start dragging a disk
     */
    startDragging() {
        if (!this.gameState) return;

        // Can only drag if a disk is selected
        if (this.gameState.selectedDisk !== null && this.gameState.selectedRod !== null) {
            this.inputState.isDragging = true;
            this.inputState.draggedDisk = this.gameState.selectedDisk;
            this.inputState.dragStartRod = this.gameState.selectedRod;

            // Prevent context menu during drag
            this.inputState.preventContextMenu = true;
        }
    }

    /**
     * Update drag position
     */
    updateDragPosition(coords) {
        // Update position for rendering
        if (this.renderer && this.renderer.setDraggedDisk) {
            this.renderer.setDraggedDisk({
                diskSize: this.inputState.draggedDisk,
                position: coords
            });
            this.renderer.render();
        }
    }

    /**
     * End dragging and attempt to place disk
     */
    endDragging(coords) {
        if (!this.gameState || this.inputState.draggedDisk === null) return;

        // Detect target rod
        const targetRod = this.detectRodClick(coords.x, coords.y);

        if (targetRod !== -1) {
            // Attempt to move disk to target rod
            const fromRod = this.inputState.dragStartRod;
            const diskToMove = this.inputState.draggedDisk;

            if (fromRod !== targetRod) {
                const result = window.GameEngine.makeMove(this.gameState, fromRod, targetRod);

                if (result.success) {
                    // Animate the move completion
                    if (this.animationSystem) {
                        this.animationSystem.animateDiskMove(diskToMove, fromRod, targetRod, () => {
                            this.updateUI();
                            const stats = window.GameEngine.getGameStats(this.gameState);

                            if (result.gameComplete) {
                                if (this.animationSystem) {
                                    this.animationSystem.startWinCelebration();
                                }
                                this.showMessage(`🎉 Congratulations! You solved the puzzle in ${stats.moveCount} moves!`, 'success');
                            } else {
                                this.showMessage(`Moved disk ${diskToMove} to rod ${targetRod + 1}`, 'success');
                            }
                        });
                    } else {
                        this.updateUI();
                        this.showMessage(`Moved disk ${diskToMove} to rod ${targetRod + 1}`, 'success');
                    }
                } else {
                    // Invalid move, return disk to original position
                    this.showMessage(result.error.message, 'error');
                    this.triggerInvalidMoveEffect();
                    this.updateUI();
                }
            } else {
                // Dropped on same rod, just update UI
                this.updateUI();
            }
        } else {
            // Dropped outside any rod, return disk to original position
            this.updateUI();
        }

        // Clear dragging state
        if (this.renderer && this.renderer.setDraggedDisk) {
            this.renderer.setDraggedDisk(null);
        }

        this.inputState.draggedDisk = null;
        this.inputState.dragStartRod = null;
    }

    /**
     * Handle hover effects
     */
    handleHover(coords) {
        const rodIndex = this.detectRodClick(coords.x, coords.y);

        if (this.inputState.hoveredRod !== rodIndex) {
            this.inputState.hoveredRod = rodIndex;

            if (this.renderer && this.renderer.setHoveredRod) {
                this.renderer.setHoveredRod(rodIndex);
                this.renderer.render();
            }
        }
    }

    /**
     * Handle keyboard navigation
     */
    handleKeyboardNavigation(direction) {
        if (!this.gameState) return;

        if (this.gameState.selectedDisk === null) {
            // No disk selected, select first non-empty rod
            for (let i = 0; i < 3; i++) {
                if (this.gameState.rods[i].disks.length > 0) {
                    const result = window.GameEngine.selectDisk(this.gameState, i);
                    if (result.success) {
                        this.updateUI();
                        this.showMessage(`Selected disk ${result.selectedDisk} from rod ${i + 1}`, 'info');
                    }
                    break;
                }
            }
        } else {
            // Disk selected, navigate between rods
            const currentRod = this.gameState.selectedRod;
            let nextRod = (currentRod + direction + 3) % 3; // Ensure positive

            // Clear current selection
            this.gameState.selectedDisk = null;
            this.gameState.selectedRod = null;

            // Select from next rod if possible
            if (this.gameState.rods[nextRod].disks.length > 0) {
                const result = window.GameEngine.selectDisk(this.gameState, nextRod);
                if (result.success) {
                    this.updateUI();
                    this.showMessage(`Selected disk ${result.selectedDisk} from rod ${nextRod + 1}`, 'info');
                }
            } else {
                // Skip empty rods
                nextRod = (nextRod + direction + 3) % 3;
                if (this.gameState.rods[nextRod].disks.length > 0) {
                    const result = window.GameEngine.selectDisk(this.gameState, nextRod);
                    if (result.success) {
                        this.updateUI();
                        this.showMessage(`Selected disk ${result.selectedDisk} from rod ${nextRod + 1}`, 'info');
                    }
                }
            }
        }
    }

    /**
     * Handle keyboard select (Enter/Space)
     */
    handleKeyboardSelect() {
        if (!this.gameState) return;

        if (this.gameState.selectedDisk === null) {
            // No disk selected, select middle rod if possible
            if (this.gameState.rods[1].disks.length > 0) {
                const result = window.GameEngine.selectDisk(this.gameState, 1);
                if (result.success) {
                    this.updateUI();
                    this.showMessage(`Selected disk ${result.selectedDisk} from rod ${2}`, 'info');
                }
            } else if (this.gameState.rods[0].disks.length > 0) {
                const result = window.GameEngine.selectDisk(this.gameState, 0);
                if (result.success) {
                    this.updateUI();
                    this.showMessage(`Selected disk ${result.selectedDisk} from rod ${1}`, 'info');
                }
            }
        } else {
            // Disk selected, find best valid destination
            const fromRod = this.gameState.selectedRod;
            const diskToMove = this.gameState.selectedDisk;
            const validDestinations = window.GameEngine.getValidDestinations(this.gameState, fromRod);

            if (validDestinations.length > 0) {
                // Prefer moving to the goal rod (2) if valid
                const toRod = validDestinations.includes(2) ? 2 : validDestinations[0];
                const result = window.GameEngine.moveSelectedDisk(this.gameState, toRod);

                if (result.success) {
                    if (this.animationSystem) {
                        this.animationSystem.animateDiskMove(diskToMove, fromRod, toRod, () => {
                            this.updateUI();
                            const stats = window.GameEngine.getGameStats(this.gameState);

                            if (result.gameComplete) {
                                if (this.animationSystem) {
                                    this.animationSystem.startWinCelebration();
                                }
                                this.showMessage(`🎉 Congratulations! You solved the puzzle in ${stats.moveCount} moves!`, 'success');
                            } else {
                                this.showMessage(`Moved disk ${diskToMove} to rod ${toRod + 1}`, 'success');
                            }
                        });
                    } else {
                        this.updateUI();
                        this.showMessage(`Moved disk ${diskToMove} to rod ${toRod + 1}`, 'success');
                    }
                }
            } else {
                this.showMessage('No valid moves for this disk', 'error');
                this.triggerInvalidMoveEffect();
            }
        }
    }

    /**
     * Handle undo action
     */
    handleUndo() {
        if (!this.gameState || !window.GameEngine) return;

        // Don't allow undo during animation
        if (this.animationSystem && this.animationSystem.isCurrentlyAnimating()) {
            this.showMessage('Please wait for the current animation to complete', 'info');
            return;
        }

        const result = window.GameEngine.undoLastMove(this.gameState);

        if (result.success) {
            this.updateUI();
            this.showMessage(`Undid move: disk ${result.diskMoved} from rod ${result.fromRod + 1} to rod ${result.toRod + 1}`, 'success');
        } else {
            this.showMessage(result.error.message, 'error');
        }
    }

    /**
     * Handle reset action
     */
    handleReset() {
        if (!this.gameState || !window.GameState) return;

        // Don't allow reset during animation
        if (this.animationSystem && this.animationSystem.isCurrentlyAnimating()) {
            this.showMessage('Please wait for the current animation to complete', 'info');
            return;
        }

        // Reset game state
        this.gameState = window.GameState.resetGameState(this.gameState);

        // Update references
        if (this.renderer) {
            this.renderer.updateGameState(this.gameState);
        }

        if (this.animationSystem) {
            this.animationSystem.updateGameState(this.gameState);
            this.animationSystem.clearAnimations();
        }

        this.updateUI();
        this.showMessage('Game reset successfully!', 'success');
    }

    /**
     * Clear disk selection
     */
    clearSelection() {
        if (!this.gameState || !window.GameEngine) return;

        window.GameEngine.clearSelection(this.gameState);
        this.updateUI();
    }

    /**
     * Trigger invalid move effect
     */
    triggerInvalidMoveEffect() {
        if (this.animationSystem) {
            this.animationSystem.triggerInvalidMoveShake();
        }
        
        // Add haptic feedback for mobile devices
        this.triggerHapticFeedback('error');
    }
    
    /**
     * Trigger haptic feedback for supported devices
     * @param {string} type - Type of feedback ('success', 'error', 'light', 'medium', 'heavy')
     */
    triggerHapticFeedback(type = 'light') {
        // Check if device supports haptic feedback
        if ('vibrate' in navigator) {
            let pattern;
            
            switch (type) {
                case 'success':
                    pattern = [50, 50, 100]; // Short-pause-medium
                    break;
                case 'error':
                    pattern = [100, 50, 100, 50, 100]; // Triple buzz
                    break;
                case 'light':
                    pattern = [25]; // Very short
                    break;
                case 'medium':
                    pattern = [50]; // Short
                    break;
                case 'heavy':
                    pattern = [100]; // Medium
                    break;
                default:
                    pattern = [25];
            }
            
            navigator.vibrate(pattern);
        }
        
        // For iOS devices with haptic feedback API
        if ('hapticFeedback' in window) {
            try {
                switch (type) {
                    case 'success':
                        window.hapticFeedback.notificationOccurred('success');
                        break;
                    case 'error':
                        window.hapticFeedback.notificationOccurred('error');
                        break;
                    case 'light':
                        window.hapticFeedback.impactOccurred('light');
                        break;
                    case 'medium':
                        window.hapticFeedback.impactOccurred('medium');
                        break;
                    case 'heavy':
                        window.hapticFeedback.impactOccurred('heavy');
                        break;
                }
            } catch (error) {
                // Haptic feedback not available, silently continue
            }
        }
    }

    /**
     * Update UI after state changes
     */
    updateUI() {
        // Call external update function if provided
        if (window.updateUIFromGameState) {
            window.updateUIFromGameState();
        } else if (this.renderer) {
            this.renderer.render();
        }
    }

    /**
     * Show message to user
     */
    showMessage(text, type, options = {}) {
        // Use enhanced message system if available
        if (window.messageSystem) {
            window.messageSystem.showMessage(text, type, options);
        } else if (window.showMessage) {
            window.showMessage(text, type);
        } else {
            console.log(`[${type}] ${text}`);
        }
    }

    /**
     * Show enhanced error with help guidance
     */
    showEnhancedError(errorMessage, context = {}) {
        // Use help system for enhanced error handling
        if (window.helpSystem) {
            window.helpSystem.showErrorWithGuidance(errorMessage, context);
        } else if (window.messageSystem) {
            window.messageSystem.showEnhancedError(errorMessage, context);
        } else {
            this.showMessage(errorMessage, 'error');
        }
    }
        if (window.helpSystem) {
            window.helpSystem.showErrorWithGuidance(errorMessage, context);
        } else if (window.messageSystem) {
            window.messageSystem.showEnhancedError(errorMessage, context);
        } else {
            this.showMessage(errorMessage, 'error');
        }
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

    /**
     * Update animation system reference
     */
    updateAnimationSystem(animationSystem) {
        this.animationSystem = animationSystem;
    }
}

// Export for use by other modules
if (typeof module !== 'undefined' && module.exports) {
    // Node.js environment (for testing)
    module.exports = { InputHandler };
} else {
    // Browser environment
    window.InputHandler = InputHandler;
}