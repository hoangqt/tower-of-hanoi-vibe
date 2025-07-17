/**
 * Canvas Renderer for Towers of Hanoi
 * 
 * This module handles all canvas rendering operations including drawing rods,
 * disks, animations, and visual effects.
 */

/**
 * Renderer class for managing canvas drawing operations
 */
class Renderer {
    constructor(canvas, gameState) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.gameState = gameState;

        // Layout properties
        this.layout = {
            rodSpacing: 0,
            rodHeight: 0,
            rodWidth: 8,
            baseY: 0,
            diskHeight: 15,
            maxDiskWidth: 0,
            minDiskWidth: 30,
            padding: 20
        };

        // Visual properties
        this.colors = {
            background: '#f7fafc',
            rod: '#8b4513',
            base: '#a0522d',
            text: '#2d3748',
            textSecondary: '#718096',
            selection: '#3182ce',
            hint: '#38a169',
            hover: 'rgba(49, 130, 206, 0.2)',
            disks: [
                '#e53e3e', // Red (largest)
                '#fd9801', // Orange
                '#ecc94b', // Yellow
                '#38a169', // Green
                '#3182ce', // Blue
                '#805ad5', // Purple
                '#d53f8c', // Pink
                '#2d3748'  // Dark gray (smallest)
            ]
        };

        // Animation properties
        this.animations = {
            selectedDiskPulse: 0,
            hintOpacity: 0.5,
            lastFrameTime: 0
        };
        
        // Input state
        this.inputState = {
            draggedDisk: null,
            hoveredRod: -1
        };

        this.calculateLayout();
    }

    /**
     * Calculate layout dimensions based on canvas size
     */
    calculateLayout() {
        const width = this.canvas.width;
        const height = this.canvas.height;

        this.layout.rodSpacing = width / 4;
        this.layout.rodHeight = height * 0.6;
        this.layout.baseY = height * 0.8;
        this.layout.maxDiskWidth = this.layout.rodSpacing * 0.8;

        // Ensure minimum spacing for readability
        if (this.layout.maxDiskWidth < 60) {
            this.layout.maxDiskWidth = 60;
        }
        if (this.layout.minDiskWidth > this.layout.maxDiskWidth * 0.3) {
            this.layout.minDiskWidth = this.layout.maxDiskWidth * 0.3;
        }
    }

    /**
     * Resize canvas and recalculate layout
     * @param {number} width - New canvas width
     * @param {number} height - New canvas height
     */
    resize(width, height) {
        this.canvas.width = width;
        this.canvas.height = height;
        this.calculateLayout();
        this.render();
    }

    /**
     * Main render function - draws the complete game state
     */
    render() {
        this.clear();

        if (!this.gameState) {
            this.drawPlaceholder();
            return;
        }

        this.drawBackground();
        this.drawRods();
        this.drawDisks();
        this.drawUI();
        this.drawHints();
    }

    /**
     * Clear the canvas
     */
    clear() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    }

    /**
     * Draw background
     */
    drawBackground() {
        this.ctx.fillStyle = this.colors.background;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    }

    /**
     * Draw the three rods and base platform
     */
    drawRods() {
        const { rodSpacing, rodHeight, rodWidth, baseY } = this.layout;

        for (let i = 0; i < 3; i++) {
            const rodX = rodSpacing * (i + 1) - rodWidth / 2;

            // Draw rod with gradient for 3D effect
            const rodGradient = this.ctx.createLinearGradient(rodX, 0, rodX + rodWidth, 0);
            rodGradient.addColorStop(0, this.lightenColor(this.colors.rod, 15));
            rodGradient.addColorStop(0.5, this.colors.rod);
            rodGradient.addColorStop(1, this.darkenColor(this.colors.rod, 15));

            this.ctx.fillStyle = rodGradient;
            this.ctx.fillRect(rodX, baseY - rodHeight, rodWidth, rodHeight);

            // Add rod border for definition
            this.ctx.strokeStyle = this.darkenColor(this.colors.rod, 25);
            this.ctx.lineWidth = 1;
            this.ctx.strokeRect(rodX, baseY - rodHeight, rodWidth, rodHeight);

            // Draw base platform with gradient
            const baseWidth = 80;
            const baseX = rodX - (baseWidth - rodWidth) / 2;

            const baseGradient = this.ctx.createLinearGradient(baseX, baseY, baseX, baseY + 10);
            baseGradient.addColorStop(0, this.lightenColor(this.colors.base, 10));
            baseGradient.addColorStop(1, this.darkenColor(this.colors.base, 10));

            this.ctx.fillStyle = baseGradient;
            this.ctx.fillRect(baseX, baseY, baseWidth, 10);

            // Add base border
            this.ctx.strokeStyle = this.darkenColor(this.colors.base, 20);
            this.ctx.lineWidth = 1;
            this.ctx.strokeRect(baseX, baseY, baseWidth, 10);

            // Add subtle shadow to base
            this.ctx.fillStyle = 'rgba(0, 0, 0, 0.15)';
            this.ctx.fillRect(baseX + 2, baseY + 10, baseWidth - 2, 3);

            // Add highlight on top of base
            this.ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
            this.ctx.fillRect(baseX, baseY, baseWidth, 2);
            
            // Draw hover effect if this rod is hovered
            if (this.inputState.hoveredRod === i) {
                this.drawRodHoverEffect(i);
            }
        }
    }
    
    /**
     * Draw hover effect for a rod
     */
    drawRodHoverEffect(rodIndex) {
        const { rodSpacing, rodHeight, baseY } = this.layout;
        const rodCenterX = rodSpacing * (rodIndex + 1);
        const hoverWidth = 40;
        
        // Draw semi-transparent highlight around rod
        this.ctx.fillStyle = this.colors.hover;
        this.drawRoundedRect(rodCenterX - hoverWidth/2, baseY - rodHeight - 10, hoverWidth, rodHeight + 10, 5);
    }

    /**
     * Draw all disks on their respective rods
     */
    drawDisks() {
        if (!this.gameState || !this.gameState.rods) return;

        const { rodSpacing, baseY, diskHeight } = this.layout;
        
        // Get animation state if available
        const animationState = window.animationSystem ? window.animationSystem.getAnimationState() : null;
        const currentAnimation = animationState ? animationState.currentAnimation : null;
        
        // Track which disk is being dragged to avoid drawing it twice
        let draggedDiskInfo = null;

        for (let rodIndex = 0; rodIndex < 3; rodIndex++) {
            const rod = this.gameState.rods[rodIndex];
            const rodCenterX = rodSpacing * (rodIndex + 1);

            for (let diskIndex = 0; diskIndex < rod.disks.length; diskIndex++) {
                const diskSize = rod.disks[diskIndex];
                let diskY = baseY - diskHeight - (diskIndex * diskHeight);
                let diskX = rodCenterX;
                
                // Skip drawing if this disk is being dragged
                if (this.inputState.draggedDisk && this.inputState.draggedDisk.diskSize === diskSize) {
                    draggedDiskInfo = {
                        diskSize,
                        rodIndex,
                        diskIndex
                    };
                    continue;
                }
                
                // Check if this disk is being animated
                if (currentAnimation && currentAnimation.type === 'diskMove' && 
                    currentAnimation.diskSize === diskSize) {
                    // Use animation position
                    diskX = currentAnimation.currentPos.x;
                    diskY = currentAnimation.currentPos.y;
                }

                this.drawDisk(diskSize, diskX, diskY, rodIndex, diskIndex);
            }
        }
        
        // Draw dragged disk last (on top)
        if (this.inputState.draggedDisk) {
            const { diskSize, position } = this.inputState.draggedDisk;
            const rodIndex = draggedDiskInfo ? draggedDiskInfo.rodIndex : -1;
            const diskIndex = draggedDiskInfo ? draggedDiskInfo.diskIndex : -1;
            
            this.drawDisk(diskSize, position.x, position.y, rodIndex, diskIndex, true);
        }
        
        // Draw visual effects
        this.drawVisualEffects(animationState);
    }

    /**
     * Draw a single disk
     * @param {number} diskSize - Size of the disk (1 = smallest)
     * @param {number} centerX - X coordinate of disk center
     * @param {number} y - Y coordinate of disk top
     * @param {number} rodIndex - Index of the rod containing the disk
     * @param {number} diskIndex - Index of disk on the rod (0 = bottom)
     * @param {Object} animationPos - Optional animation position override
     */
    drawDisk(diskSize, centerX, y, rodIndex, diskIndex, animationPos = null) {
        const { diskHeight, maxDiskWidth, minDiskWidth } = this.layout;

        // Calculate disk width based on size with proper scaling
        const sizeRatio = this.gameState.settings.numDisks > 1
            ? (diskSize - 1) / (this.gameState.settings.numDisks - 1)
            : 0;
        const diskWidth = minDiskWidth + (maxDiskWidth - minDiskWidth) * sizeRatio;
        const diskX = centerX - diskWidth / 2;

        // Get disk color with proper bounds checking
        const colorIndex = Math.min(diskSize - 1, this.colors.disks.length - 1);
        const baseColor = this.colors.disks[colorIndex];

        // Create radial gradient for more realistic 3D effect
        const gradient = this.ctx.createRadialGradient(
            centerX, y + diskHeight * 0.3, 0,
            centerX, y + diskHeight * 0.3, diskWidth * 0.6
        );
        gradient.addColorStop(0, this.lightenColor(baseColor, 30));
        gradient.addColorStop(0.4, this.lightenColor(baseColor, 10));
        gradient.addColorStop(0.7, baseColor);
        gradient.addColorStop(1, this.darkenColor(baseColor, 25));

        // Draw disk shadow first
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
        this.drawRoundedRect(diskX + 2, y + 2, diskWidth, diskHeight, 4);

        // Draw disk body with gradient
        this.ctx.fillStyle = gradient;
        this.drawRoundedRect(diskX, y, diskWidth, diskHeight, 4);

        // Add inner highlight for depth
        const highlightGradient = this.ctx.createLinearGradient(diskX, y, diskX, y + diskHeight * 0.4);
        highlightGradient.addColorStop(0, 'rgba(255, 255, 255, 0.4)');
        highlightGradient.addColorStop(1, 'rgba(255, 255, 255, 0)');

        this.ctx.fillStyle = highlightGradient;
        this.drawRoundedRect(diskX, y, diskWidth, diskHeight * 0.4, 4);

        // Draw disk border with varying thickness based on size
        const borderWidth = Math.max(1, Math.floor(diskSize / 2));
        this.ctx.strokeStyle = this.darkenColor(baseColor, 35);
        this.ctx.lineWidth = borderWidth;

        // Use custom rounded rect for border (compatible with all browsers)
        this.ctx.beginPath();
        this.ctx.moveTo(diskX + 4, y);
        this.ctx.lineTo(diskX + diskWidth - 4, y);
        this.ctx.quadraticCurveTo(diskX + diskWidth, y, diskX + diskWidth, y + 4);
        this.ctx.lineTo(diskX + diskWidth, y + diskHeight - 4);
        this.ctx.quadraticCurveTo(diskX + diskWidth, y + diskHeight, diskX + diskWidth - 4, y + diskHeight);
        this.ctx.lineTo(diskX + 4, y + diskHeight);
        this.ctx.quadraticCurveTo(diskX, y + diskHeight, diskX, y + diskHeight - 4);
        this.ctx.lineTo(diskX, y + 4);
        this.ctx.quadraticCurveTo(diskX, y, diskX + 4, y);
        this.ctx.closePath();
        this.ctx.stroke();

        // Highlight selected disk with animated effect
        if (this.gameState.selectedDisk === diskSize && this.gameState.selectedRod === rodIndex) {
            this.drawSelectionHighlight(diskX, y, diskWidth, diskHeight);
        }

        // Draw disk size indicator for better gameplay
        if (diskWidth > 40) {
            this.drawDiskLabel(diskSize, centerX, y + diskHeight / 2);
        }

        // Add texture lines for visual interest on larger disks
        if (diskWidth > 60) {
            this.drawDiskTexture(diskX, y, diskWidth, diskHeight, baseColor);
        }
    }

    /**
     * Draw texture lines on larger disks for visual appeal
     */
    drawDiskTexture(x, y, width, height, baseColor) {
        this.ctx.strokeStyle = this.darkenColor(baseColor, 15);
        this.ctx.lineWidth = 0.5;
        this.ctx.globalAlpha = 0.3;

        // Draw horizontal texture lines
        for (let i = 1; i < 4; i++) {
            const lineY = y + (height * i) / 4;
            this.ctx.beginPath();
            this.ctx.moveTo(x + 5, lineY);
            this.ctx.lineTo(x + width - 5, lineY);
            this.ctx.stroke();
        }

        this.ctx.globalAlpha = 1;
    }

    /**
     * Draw selection highlight around a disk
     */
    drawSelectionHighlight(x, y, width, height) {
        // Get animation state for pulse effect
        const animationState = window.animationSystem ? window.animationSystem.getAnimationState() : null;
        const pulseIntensity = animationState ? 
            animationState.effects.selectedDiskPulse.intensity : 
            Math.sin(Date.now() * 0.005) * 0.3 + 0.7;

        this.ctx.strokeStyle = this.colors.selection;
        this.ctx.lineWidth = 3 * pulseIntensity;
        this.ctx.setLineDash([5, 5]);
        this.ctx.strokeRect(x - 3, y - 3, width + 6, height + 6);
        this.ctx.setLineDash([]);
        
        // Add glow effect
        this.ctx.shadowColor = this.colors.selection;
        this.ctx.shadowBlur = 10 * pulseIntensity;
        this.ctx.strokeRect(x - 3, y - 3, width + 6, height + 6);
        this.ctx.shadowBlur = 0;
    }

    /**
     * Draw disk label (number)
     */
    drawDiskLabel(diskSize, centerX, centerY) {
        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
        this.ctx.font = 'bold 12px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        this.ctx.fillText(diskSize.toString(), centerX, centerY);
    }

    /**
     * Draw UI elements (title, status, etc.)
     */
    drawUI() {
        // Draw title
        this.ctx.fillStyle = this.colors.text;
        this.ctx.font = 'bold 24px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'top';
        this.ctx.fillText('Towers of Hanoi', this.canvas.width / 2, 20);

        // Draw game status
        this.ctx.font = '16px Arial';
        this.ctx.fillStyle = this.colors.textSecondary;
        this.ctx.textBaseline = 'bottom';

        if (this.gameState.gameComplete) {
            this.ctx.fillStyle = this.colors.hint;
            this.ctx.fillText('🎉 Congratulations! You solved the puzzle!', this.canvas.width / 2, this.canvas.height - 20);
        } else {
            const statusText = `Move ${this.gameState.moveCount} of ${this.gameState.metadata.optimalMoves} optimal moves`;
            this.ctx.fillText(statusText, this.canvas.width / 2, this.canvas.height - 20);
        }

        // Draw rod labels
        this.drawRodLabels();
    }

    /**
     * Draw rod labels (A, B, C or 1, 2, 3)
     */
    drawRodLabels() {
        const { rodSpacing, baseY } = this.layout;
        const labels = ['A', 'B', 'C'];

        this.ctx.fillStyle = this.colors.textSecondary;
        this.ctx.font = '14px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'top';

        for (let i = 0; i < 3; i++) {
            const rodCenterX = rodSpacing * (i + 1);
            this.ctx.fillText(labels[i], rodCenterX, baseY + 20);
        }
    }

    /**
     * Draw hints (valid move destinations)
     */
    drawHints() {
        if (!this.gameState.settings.showHints || !this.gameState.selectedDisk) return;

        const validDestinations = this.getValidDestinations();
        const { rodSpacing, baseY, rodHeight } = this.layout;
        
        // Get animation state for hint opacity
        const animationState = window.animationSystem ? window.animationSystem.getAnimationState() : null;
        const hintOpacity = animationState ? 
            animationState.effects.hintPulse.opacity : 
            this.animations.hintOpacity;

        for (const rodIndex of validDestinations) {
            const rodCenterX = rodSpacing * (rodIndex + 1);

            // Draw hint indicator with animated opacity
            this.ctx.fillStyle = `rgba(56, 161, 105, ${hintOpacity})`;
            this.ctx.beginPath();
            this.ctx.arc(rodCenterX, baseY - rodHeight - 20, 8, 0, Math.PI * 2);
            this.ctx.fill();

            // Draw arrow pointing down with same opacity
            this.ctx.strokeStyle = `rgba(56, 161, 105, ${hintOpacity})`;
            this.drawHintArrow(rodCenterX, baseY - rodHeight - 35);
        }
    }

    /**
     * Draw hint arrow
     */
    drawHintArrow(x, y) {
        this.ctx.strokeStyle = this.colors.hint;
        this.ctx.lineWidth = 2;
        this.ctx.beginPath();
        this.ctx.moveTo(x, y);
        this.ctx.lineTo(x, y + 10);
        this.ctx.moveTo(x - 3, y + 7);
        this.ctx.lineTo(x, y + 10);
        this.ctx.lineTo(x + 3, y + 7);
        this.ctx.stroke();
    }

    /**
     * Get valid destinations for the currently selected disk
     */
    getValidDestinations() {
        if (!this.gameState.selectedRod !== null && window.GameEngine) {
            return window.GameEngine.getValidDestinations(this.gameState, this.gameState.selectedRod);
        }
        return [];
    }

    /**
     * Draw placeholder content when no game state is available
     */
    drawPlaceholder() {
        this.drawBackground();

        // Draw placeholder rods
        const { rodSpacing, rodHeight, rodWidth, baseY } = this.layout;

        for (let i = 0; i < 3; i++) {
            const rodX = rodSpacing * (i + 1) - rodWidth / 2;

            this.ctx.fillStyle = this.colors.rod;
            this.ctx.fillRect(rodX, baseY - rodHeight, rodWidth, rodHeight);

            this.ctx.fillStyle = this.colors.base;
            this.ctx.fillRect(rodX - 30, baseY, rodWidth + 60, 10);
        }

        // Draw placeholder disks on first rod
        const diskWidths = [80, 60, 40];
        for (let i = 0; i < 3; i++) {
            const diskY = baseY - 20 - (i * 20);
            const diskX = rodSpacing - diskWidths[i] / 2;

            this.ctx.fillStyle = this.colors.disks[i];
            this.ctx.fillRect(diskX, diskY, diskWidths[i], 15);
            this.ctx.strokeStyle = this.colors.text;
            this.ctx.lineWidth = 1;
            this.ctx.strokeRect(diskX, diskY, diskWidths[i], 15);
        }

        // Draw placeholder title
        this.ctx.fillStyle = this.colors.text;
        this.ctx.font = 'bold 24px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('Towers of Hanoi', this.canvas.width / 2, 40);

        this.ctx.font = '16px Arial';
        this.ctx.fillStyle = this.colors.textSecondary;
        this.ctx.fillText('Loading game...', this.canvas.width / 2, this.canvas.height - 20);
    }

    /**
     * Draw rounded rectangle
     */
    drawRoundedRect(x, y, width, height, radius) {
        this.ctx.beginPath();
        this.ctx.moveTo(x + radius, y);
        this.ctx.lineTo(x + width - radius, y);
        this.ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
        this.ctx.lineTo(x + width, y + height - radius);
        this.ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
        this.ctx.lineTo(x + radius, y + height);
        this.ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
        this.ctx.lineTo(x, y + radius);
        this.ctx.quadraticCurveTo(x, y, x + radius, y);
        this.ctx.closePath();
        this.ctx.fill();
    }

    /**
     * Lighten a color by a percentage
     */
    lightenColor(color, percent) {
        const num = parseInt(color.replace("#", ""), 16);
        const amt = Math.round(2.55 * percent);
        const R = (num >> 16) + amt;
        const G = (num >> 8 & 0x00FF) + amt;
        const B = (num & 0x0000FF) + amt;
        return "#" + (0x1000000 + (R < 255 ? R < 1 ? 0 : R : 255) * 0x10000 +
            (G < 255 ? G < 1 ? 0 : G : 255) * 0x100 +
            (B < 255 ? B < 1 ? 0 : B : 255)).toString(16).slice(1);
    }

    /**
     * Darken a color by a percentage
     */
    darkenColor(color, percent) {
        const num = parseInt(color.replace("#", ""), 16);
        const amt = Math.round(2.55 * percent);
        const R = (num >> 16) - amt;
        const G = (num >> 8 & 0x00FF) - amt;
        const B = (num & 0x0000FF) - amt;
        return "#" + (0x1000000 + (R > 255 ? 255 : R < 0 ? 0 : R) * 0x10000 +
            (G > 255 ? 255 : G < 0 ? 0 : G) * 0x100 +
            (B > 255 ? 255 : B < 0 ? 0 : B)).toString(16).slice(1);
    }

    /**
     * Set the currently dragged disk
     */
    setDraggedDisk(diskInfo) {
        this.inputState.draggedDisk = diskInfo;
    }
    
    /**
     * Set the currently hovered rod
     */
    setHoveredRod(rodIndex) {
        this.inputState.hoveredRod = rodIndex;
    }
    
    /**
     * Update game state reference
     */
    updateGameState(gameState) {
        this.gameState = gameState;
    }

    /**
     * Get click coordinates relative to canvas
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
        const { rodSpacing } = this.layout;
        const rodWidth = 60; // Click area width

        for (let i = 0; i < 3; i++) {
            const rodCenterX = rodSpacing * (i + 1);
            const rodLeft = rodCenterX - rodWidth / 2;
            const rodRight = rodCenterX + rodWidth / 2;

            if (x >= rodLeft && x <= rodRight) {
                return i;
            }
        }

        return -1;
    }

    /**
     * Draw visual effects (animations, particles, etc.)
     */
    drawVisualEffects(animationState) {
        if (!animationState) return;
        
        const effects = animationState.effects;
        
        // Draw invalid move shake effect
        if (effects.invalidMoveShake.active) {
            this.ctx.save();
            const shakeX = Math.sin(effects.invalidMoveShake.time * 0.1) * effects.invalidMoveShake.intensity * 5;
            const shakeY = Math.cos(effects.invalidMoveShake.time * 0.15) * effects.invalidMoveShake.intensity * 3;
            this.ctx.translate(shakeX, shakeY);
            this.ctx.restore();
        }
        
        // Draw win celebration particles
        if (effects.winCelebration.active && window.animationSystem) {
            window.animationSystem.renderCelebrationParticles(this.ctx);
        }
    }
    
    /**
     * Start animation loop for smooth visual effects
     */
    startAnimationLoop() {
        const animate = (currentTime) => {
            if (currentTime - this.animations.lastFrameTime > 16) { // ~60fps
                this.render();
                this.animations.lastFrameTime = currentTime;
            }
            requestAnimationFrame(animate);
        };
        requestAnimationFrame(animate);
    }
}

// Export for use by other modules
if (typeof module !== 'undefined' && module.exports) {
    // Node.js environment (for testing)
    module.exports = { Renderer };
} else {
    // Browser environment
    window.Renderer = Renderer;
}