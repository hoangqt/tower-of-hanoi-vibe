/**
 * Unit Tests for Renderer
 * 
 * Test suite to validate canvas rendering functionality.
 */

// Test runner function for Renderer
function runRendererTests() {
    console.log('🎨 Running Renderer Tests...\n');
    
    let passed = 0;
    let failed = 0;
    
    function test(name, testFn) {
        try {
            testFn();
            console.log(`✅ ${name}`);
            passed++;
        } catch (error) {
            console.error(`❌ ${name}: ${error.message}`);
            failed++;
        }
    }
    
    // Create a test canvas
    function createTestCanvas() {
        const canvas = document.createElement('canvas');
        canvas.width = 800;
        canvas.height = 600;
        return canvas;
    }
    
    // Test 1: Renderer initialization
    test('Should initialize renderer correctly', () => {
        const canvas = createTestCanvas();
        const gameState = GameState.createGameState(3);
        const renderer = new Renderer(canvas, gameState);
        
        if (!renderer.canvas) throw new Error('Renderer should have canvas reference');
        if (!renderer.ctx) throw new Error('Renderer should have canvas context');
        if (!renderer.gameState) throw new Error('Renderer should have game state reference');
        if (!renderer.layout) throw new Error('Renderer should have layout properties');
        if (!renderer.colors) throw new Error('Renderer should have color definitions');
    });
    
    // Test 2: Layout calculation
    test('Should calculate layout correctly', () => {
        const canvas = createTestCanvas();
        const gameState = GameState.createGameState(3);
        const renderer = new Renderer(canvas, gameState);
        
        if (renderer.layout.rodSpacing !== 200) throw new Error('Rod spacing should be 200 for 800px width');
        if (renderer.layout.rodHeight !== 360) throw new Error('Rod height should be 360 for 600px height');
        if (renderer.layout.baseY !== 480) throw new Error('Base Y should be 480 for 600px height');
        if (renderer.layout.maxDiskWidth !== 160) throw new Error('Max disk width should be 160');
    });
    
    // Test 3: Canvas resize
    test('Should handle canvas resize correctly', () => {
        const canvas = createTestCanvas();
        const gameState = GameState.createGameState(3);
        const renderer = new Renderer(canvas, gameState);
        
        renderer.resize(1000, 750);
        
        if (canvas.width !== 1000) throw new Error('Canvas width should be updated');
        if (canvas.height !== 750) throw new Error('Canvas height should be updated');
        if (renderer.layout.rodSpacing !== 250) throw new Error('Rod spacing should be recalculated');
        if (renderer.layout.baseY !== 600) throw new Error('Base Y should be recalculated');
    });
    
    // Test 4: Game state update
    test('Should update game state reference', () => {
        const canvas = createTestCanvas();
        const gameState1 = GameState.createGameState(3);
        const gameState2 = GameState.createGameState(4);
        const renderer = new Renderer(canvas, gameState1);
        
        renderer.updateGameState(gameState2);
        
        if (renderer.gameState !== gameState2) throw new Error('Game state should be updated');
        if (renderer.gameState.settings.numDisks !== 4) throw new Error('Should reference new game state');
    });
    
    // Test 5: Canvas coordinates conversion
    test('Should convert canvas coordinates correctly', () => {
        const canvas = createTestCanvas();
        const gameState = GameState.createGameState(3);
        const renderer = new Renderer(canvas, gameState);
        
        // Mock getBoundingClientRect
        canvas.getBoundingClientRect = () => ({
            left: 100,
            top: 50,
            width: 800,
            height: 600
        });
        
        const coords = renderer.getCanvasCoordinates(300, 200);
        
        if (coords.x !== 200) throw new Error('X coordinate should be 200');
        if (coords.y !== 150) throw new Error('Y coordinate should be 150');
    });
    
    // Test 6: Rod click detection
    test('Should detect rod clicks correctly', () => {
        const canvas = createTestCanvas();
        const gameState = GameState.createGameState(3);
        const renderer = new Renderer(canvas, gameState);
        
        // Test clicks on each rod
        const rod0Click = renderer.detectRodClick(200, 300); // Rod 0 center
        const rod1Click = renderer.detectRodClick(400, 300); // Rod 1 center
        const rod2Click = renderer.detectRodClick(600, 300); // Rod 2 center
        const noRodClick = renderer.detectRodClick(100, 300); // Between rods
        
        if (rod0Click !== 0) throw new Error('Should detect rod 0 click');
        if (rod1Click !== 1) throw new Error('Should detect rod 1 click');
        if (rod2Click !== 2) throw new Error('Should detect rod 2 click');
        if (noRodClick !== -1) throw new Error('Should return -1 for non-rod clicks');
    });
    
    // Test 7: Color manipulation
    test('Should manipulate colors correctly', () => {
        const canvas = createTestCanvas();
        const gameState = GameState.createGameState(3);
        const renderer = new Renderer(canvas, gameState);
        
        const baseColor = '#ff0000'; // Red
        const lightened = renderer.lightenColor(baseColor, 20);
        const darkened = renderer.darkenColor(baseColor, 20);
        
        if (lightened === baseColor) throw new Error('Lightened color should be different');
        if (darkened === baseColor) throw new Error('Darkened color should be different');
        if (!lightened.startsWith('#')) throw new Error('Lightened color should be hex format');
        if (!darkened.startsWith('#')) throw new Error('Darkened color should be hex format');
    });
    
    // Test 8: Rendering without errors
    test('Should render without throwing errors', () => {
        const canvas = createTestCanvas();
        const gameState = GameState.createGameState(3);
        const renderer = new Renderer(canvas, gameState);
        
        // These should not throw errors
        renderer.render();
        renderer.clear();
        renderer.drawBackground();
        renderer.drawRods();
        renderer.drawDisks();
        renderer.drawUI();
    });
    
    // Test 9: Placeholder rendering
    test('Should render placeholder correctly', () => {
        const canvas = createTestCanvas();
        const renderer = new Renderer(canvas, null); // No game state
        
        // Should not throw error when rendering without game state
        renderer.render();
        renderer.drawPlaceholder();
    });
    
    // Test 10: Disk rendering
    test('Should render disks correctly', () => {
        const canvas = createTestCanvas();
        const gameState = GameState.createGameState(3);
        const renderer = new Renderer(canvas, gameState);
        
        // Should not throw errors when drawing individual disks
        renderer.drawDisk(1, 200, 400, 0, 0); // Small disk
        renderer.drawDisk(3, 400, 400, 1, 0); // Large disk
    });
    
    // Test 11: Selection highlight
    test('Should draw selection highlight', () => {
        const canvas = createTestCanvas();
        const gameState = GameState.createGameState(3);
        gameState.selectedDisk = 1;
        gameState.selectedRod = 0;
        const renderer = new Renderer(canvas, gameState);
        
        // Should not throw error when drawing selection
        renderer.drawSelectionHighlight(100, 100, 50, 15);
    });
    
    // Test 12: Hint rendering
    test('Should render hints correctly', () => {
        const canvas = createTestCanvas();
        const gameState = GameState.createGameState(3);
        gameState.selectedDisk = 1;
        gameState.selectedRod = 0;
        gameState.settings.showHints = true;
        const renderer = new Renderer(canvas, gameState);
        
        // Should not throw error when drawing hints
        renderer.drawHints();
        renderer.drawHintArrow(200, 100);
    });
    
    // Test 13: Rod labels
    test('Should draw rod labels', () => {
        const canvas = createTestCanvas();
        const gameState = GameState.createGameState(3);
        const renderer = new Renderer(canvas, gameState);
        
        // Should not throw error when drawing labels
        renderer.drawRodLabels();
    });
    
    // Test 14: Disk labels
    test('Should draw disk labels', () => {
        const canvas = createTestCanvas();
        const gameState = GameState.createGameState(3);
        const renderer = new Renderer(canvas, gameState);
        
        // Should not throw error when drawing disk labels
        renderer.drawDiskLabel(1, 200, 400);
        renderer.drawDiskLabel(5, 400, 400);
    });
    
    // Test 15: Rounded rectangle drawing
    test('Should draw rounded rectangles', () => {
        const canvas = createTestCanvas();
        const gameState = GameState.createGameState(3);
        const renderer = new Renderer(canvas, gameState);
        
        // Should not throw error when drawing rounded rectangles
        renderer.drawRoundedRect(100, 100, 50, 20, 5);
    });
    
    // Test 16: Layout adaptation for different disk counts
    test('Should adapt layout for different disk counts', () => {
        const canvas = createTestCanvas();
        const gameState3 = GameState.createGameState(3);
        const gameState8 = GameState.createGameState(8);
        
        const renderer = new Renderer(canvas, gameState3);
        const layout3 = { ...renderer.layout };
        
        renderer.updateGameState(gameState8);
        renderer.calculateLayout();
        
        // Layout should remain consistent
        if (renderer.layout.rodSpacing !== layout3.rodSpacing) {
            throw new Error('Rod spacing should remain consistent');
        }
        if (renderer.layout.baseY !== layout3.baseY) {
            throw new Error('Base Y should remain consistent');
        }
    });
    
    // Test 17: Color array bounds
    test('Should handle color array bounds correctly', () => {
        const canvas = createTestCanvas();
        const gameState = GameState.createGameState(8);
        const renderer = new Renderer(canvas, gameState);
        
        // Should not throw error with maximum disk count
        for (let i = 1; i <= 8; i++) {
            renderer.drawDisk(i, 200, 400 - i * 20, 0, i - 1);
        }
    });
    
    // Test 18: Animation properties
    test('Should initialize animation properties', () => {
        const canvas = createTestCanvas();
        const gameState = GameState.createGameState(3);
        const renderer = new Renderer(canvas, gameState);
        
        if (typeof renderer.animations.selectedDiskPulse !== 'number') {
            throw new Error('Should have selectedDiskPulse animation property');
        }
        if (typeof renderer.animations.hintOpacity !== 'number') {
            throw new Error('Should have hintOpacity animation property');
        }
        if (typeof renderer.animations.lastFrameTime !== 'number') {
            throw new Error('Should have lastFrameTime animation property');
        }
    });
    
    // Test 19: Valid destinations with no GameEngine
    test('Should handle missing GameEngine gracefully', () => {
        const canvas = createTestCanvas();
        const gameState = GameState.createGameState(3);
        gameState.selectedRod = 0;
        const renderer = new Renderer(canvas, gameState);
        
        // Temporarily remove GameEngine
        const originalGameEngine = window.GameEngine;
        window.GameEngine = undefined;
        
        const destinations = renderer.getValidDestinations();
        
        // Restore GameEngine
        window.GameEngine = originalGameEngine;
        
        if (!Array.isArray(destinations)) throw new Error('Should return empty array when GameEngine unavailable');
        if (destinations.length !== 0) throw new Error('Should return empty array when GameEngine unavailable');
    });
    
    // Test 20: Complete game state rendering
    test('Should render complete game state correctly', () => {
        const canvas = createTestCanvas();
        const gameState = GameState.createGameState(3);
        
        // Set up a mid-game state
        gameState.rods[0].disks = [3, 2];
        gameState.rods[1].disks = [1];
        gameState.rods[2].disks = [];
        gameState.moveCount = 1;
        gameState.selectedDisk = 1;
        gameState.selectedRod = 1;
        
        const renderer = new Renderer(canvas, gameState);
        
        // Should render complete state without errors
        renderer.render();
    });
    
    console.log(`\n📊 Renderer Test Results: ${passed} passed, ${failed} failed`);
    
    if (failed === 0) {
        console.log('🎉 All renderer tests passed!');
    } else {
        console.log('💥 Some renderer tests failed!');
    }
    
    return { passed, failed };
}

// Auto-run tests if in browser environment
if (typeof window !== 'undefined' && window.Renderer && window.GameState) {
    // Add a small delay to ensure modules are loaded
    setTimeout(runRendererTests, 300);
}

// Export for Node.js testing
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { runRendererTests };
}