/**
 * Unit Tests for Game State Management
 * 
 * Simple test suite to validate game state functionality.
 * Run in browser console or Node.js environment.
 */

// Test runner function
function runTests() {
    console.log('🧪 Running Game State Tests...\n');
    
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
    
    // Test 1: Basic game state creation
    test('Should create valid game state with default 3 disks', () => {
        const state = GameState.createGameState();
        
        if (state.rods.length !== 3) throw new Error('Should have 3 rods');
        if (state.rods[0].disks.length !== 3) throw new Error('First rod should have 3 disks');
        if (state.rods[1].disks.length !== 0) throw new Error('Second rod should be empty');
        if (state.rods[2].disks.length !== 0) throw new Error('Third rod should be empty');
        if (!Array.isArray(state.rods[0].disks)) throw new Error('Disks should be an array');
        
        // Check disk ordering (largest to smallest)
        const disks = state.rods[0].disks;
        if (disks[0] !== 3 || disks[1] !== 2 || disks[2] !== 1) {
            throw new Error('Disks should be ordered largest to smallest');
        }
    });
    
    // Test 2: Custom disk count
    test('Should create game state with custom disk count', () => {
        const state = GameState.createGameState(5);
        
        if (state.settings.numDisks !== 5) throw new Error('Should have 5 disks setting');
        if (state.rods[0].disks.length !== 5) throw new Error('First rod should have 5 disks');
        if (state.metadata.optimalMoves !== 31) throw new Error('Optimal moves should be 31 for 5 disks');
        
        // Check all disks are present and ordered
        const expectedDisks = [5, 4, 3, 2, 1];
        for (let i = 0; i < 5; i++) {
            if (state.rods[0].disks[i] !== expectedDisks[i]) {
                throw new Error(`Disk ${i} should be ${expectedDisks[i]}`);
            }
        }
    });
    
    // Test 3: Invalid disk count validation
    test('Should reject invalid disk counts', () => {
        const invalidCounts = [2, 9, -1, 0, 'invalid', null, undefined];
        
        for (const count of invalidCounts) {
            try {
                GameState.createGameState(count);
                throw new Error(`Should reject disk count: ${count}`);
            } catch (error) {
                if (!error.message.includes('between 3 and 8')) {
                    throw new Error(`Wrong error message for ${count}: ${error.message}`);
                }
            }
        }
    });
    
    // Test 4: Game state validation
    test('Should validate correct game state', () => {
        const state = GameState.createGameState(4);
        const isValid = GameState.validateGameState(state);
        
        if (!isValid) throw new Error('Valid state should pass validation');
    });
    
    // Test 5: Game state validation with invalid structure
    test('Should reject invalid game state structures', () => {
        const invalidStates = [
            { rods: [] }, // Missing rods
            { rods: [1, 2] }, // Wrong number of rods
            { rods: [{ id: 0, disks: [] }, { id: 1, disks: [] }] }, // Missing third rod
        ];
        
        for (const state of invalidStates) {
            try {
                GameState.validateGameState(state);
                throw new Error('Should reject invalid state');
            } catch (error) {
                // Expected to throw
            }
        }
    });
    
    // Test 6: Game state cloning
    test('Should create deep copy of game state', () => {
        const original = GameState.createGameState(3);
        const clone = GameState.cloneGameState(original);
        
        // Modify clone
        clone.rods[0].disks.pop();
        clone.moveCount = 5;
        
        // Original should be unchanged
        if (original.rods[0].disks.length !== 3) throw new Error('Original should be unchanged');
        if (original.moveCount !== 0) throw new Error('Original move count should be unchanged');
        if (clone.rods[0].disks.length !== 2) throw new Error('Clone should be modified');
    });
    
    // Test 7: Game state reset
    test('Should reset game state correctly', () => {
        const state = GameState.createGameState(4);
        
        // Modify state
        state.moveCount = 10;
        state.gameComplete = true;
        state.rods[1].disks = [1];
        state.rods[0].disks = [4, 3, 2];
        
        const reset = GameState.resetGameState(state);
        
        if (reset.moveCount !== 0) throw new Error('Reset move count should be 0');
        if (reset.gameComplete !== false) throw new Error('Reset game should not be complete');
        if (reset.rods[0].disks.length !== 4) throw new Error('Reset should have all disks on first rod');
        if (reset.rods[1].disks.length !== 0) throw new Error('Reset second rod should be empty');
    });
    
    // Test 8: Win condition detection
    test('Should detect win condition correctly', () => {
        const state = GameState.createGameState(3);
        
        // Initial state should not be won
        if (GameState.isGameWon(state)) throw new Error('Initial state should not be won');
        
        // Move all disks to right rod in correct order
        state.rods[2].disks = [3, 2, 1];
        state.rods[0].disks = [];
        
        if (!GameState.isGameWon(state)) throw new Error('Should detect win condition');
        
        // Wrong order should not be won
        state.rods[2].disks = [1, 2, 3];
        if (GameState.isGameWon(state)) throw new Error('Wrong order should not be won');
    });
    
    // Test 9: Game state summary
    test('Should generate correct game state summary', () => {
        const state = GameState.createGameState(3);
        const summary = GameState.getGameStateSummary(state);
        
        if (!summary.rodContents) throw new Error('Summary should include rod contents');
        if (summary.numDisks !== 3) throw new Error('Summary should include disk count');
        if (summary.optimalMoves !== 7) throw new Error('Summary should include optimal moves');
        if (summary.moveCount !== 0) throw new Error('Summary should include move count');
    });
    
    // Test 10: Disk ordering validation
    test('Should validate disk ordering on rods', () => {
        const state = GameState.createGameState(3);
        
        // Create invalid ordering (smaller disk below larger disk)
        state.rods[0].disks = [2, 3, 1]; // Invalid: 3 > 2
        
        try {
            GameState.validateGameState(state);
            throw new Error('Should reject invalid disk ordering');
        } catch (error) {
            if (!error.message.includes('descending order')) {
                throw new Error('Should mention descending order in error');
            }
        }
    });
    
    // Test 11: Disk model creation
    test('Should create valid disk objects', () => {
        const disk = GameState.createDisk(1, 1, '#ff0000', { x: 10, y: 20 }, 0);
        
        if (disk.id !== 1) throw new Error('Disk id should be 1');
        if (disk.size !== 1) throw new Error('Disk size should be 1');
        if (disk.color !== '#ff0000') throw new Error('Disk color should be #ff0000');
        if (disk.position.x !== 10) throw new Error('Disk position x should be 10');
        if (disk.position.y !== 20) throw new Error('Disk position y should be 20');
        if (disk.rod !== 0) throw new Error('Disk rod should be 0');
        if (disk.isSelected !== false) throw new Error('Disk should not be selected initially');
        if (disk.isAnimating !== false) throw new Error('Disk should not be animating initially');
    });
    
    // Test 12: Disk model validation
    test('Should validate disk objects correctly', () => {
        const validDisk = GameState.createDisk(2, 2, '#00ff00', { x: 0, y: 0 }, 1);
        
        if (!GameState.validateDisk(validDisk)) throw new Error('Valid disk should pass validation');
        
        // Test invalid disks
        const invalidDisks = [
            null,
            {},
            { id: 0, size: 1, color: 'red', position: { x: 0, y: 0 }, rod: 0 }, // Invalid id
            { id: 1, size: 0, color: 'red', position: { x: 0, y: 0 }, rod: 0 }, // Invalid size
            { id: 1, size: 1, color: '', position: { x: 0, y: 0 }, rod: 0 }, // Invalid color
            { id: 1, size: 1, color: 'red', position: { x: 'invalid', y: 0 }, rod: 0 }, // Invalid position
            { id: 1, size: 1, color: 'red', position: { x: 0, y: 0 }, rod: 3 }, // Invalid rod
        ];
        
        for (const invalidDisk of invalidDisks) {
            try {
                GameState.validateDisk(invalidDisk);
                throw new Error(`Should reject invalid disk: ${JSON.stringify(invalidDisk)}`);
            } catch (error) {
                // Expected to throw
            }
        }
    });
    
    // Test 13: Move model creation
    test('Should create valid move objects', () => {
        const move = GameState.createMove(0, 1, 3, 5);
        
        if (move.fromRod !== 0) throw new Error('Move fromRod should be 0');
        if (move.toRod !== 1) throw new Error('Move toRod should be 1');
        if (move.diskId !== 3) throw new Error('Move diskId should be 3');
        if (move.moveNumber !== 5) throw new Error('Move moveNumber should be 5');
        if (!(move.timestamp instanceof Date)) throw new Error('Move timestamp should be a Date');
        if (move.duration !== null) throw new Error('Move duration should be null initially');
    });
    
    // Test 14: Move model validation
    test('Should validate move objects correctly', () => {
        const validMove = GameState.createMove(1, 2, 1, 1);
        
        if (!GameState.validateMove(validMove)) throw new Error('Valid move should pass validation');
        
        // Test invalid moves
        const invalidMoves = [
            null,
            {},
            { fromRod: -1, toRod: 1, diskId: 1, moveNumber: 1, timestamp: new Date() }, // Invalid fromRod
            { fromRod: 0, toRod: 3, diskId: 1, moveNumber: 1, timestamp: new Date() }, // Invalid toRod
            { fromRod: 0, toRod: 0, diskId: 1, moveNumber: 1, timestamp: new Date() }, // Same rod
            { fromRod: 0, toRod: 1, diskId: 0, moveNumber: 1, timestamp: new Date() }, // Invalid diskId
            { fromRod: 0, toRod: 1, diskId: 1, moveNumber: 0, timestamp: new Date() }, // Invalid moveNumber
            { fromRod: 0, toRod: 1, diskId: 1, moveNumber: 1, timestamp: 'invalid' }, // Invalid timestamp
        ];
        
        for (const invalidMove of invalidMoves) {
            try {
                GameState.validateMove(invalidMove);
                throw new Error(`Should reject invalid move: ${JSON.stringify(invalidMove)}`);
            } catch (error) {
                // Expected to throw
            }
        }
    });
    
    // Test 15: Disk color generation
    test('Should generate correct disk colors', () => {
        const colors = [
            '#e53e3e', '#fd9801', '#ecc94b', '#38a169', 
            '#3182ce', '#805ad5', '#d53f8c', '#2d3748'
        ];
        
        for (let i = 1; i <= 8; i++) {
            const color = GameState.getDiskColor(i, 8);
            const expectedColor = colors[i - 1];
            if (color !== expectedColor) {
                throw new Error(`Disk ${i} should have color ${expectedColor}, got ${color}`);
            }
        }
        
        // Test with fewer disks
        const color3 = GameState.getDiskColor(3, 3);
        if (color3 !== colors[2]) throw new Error('Color for 3rd disk should be correct');
    });
    
    // Test 16: Disk creation utility
    test('Should create multiple disks correctly', () => {
        const disks = GameState.createDisks(4);
        
        if (disks.length !== 4) throw new Error('Should create 4 disks');
        
        for (let i = 0; i < 4; i++) {
            const disk = disks[i];
            if (disk.id !== i + 1) throw new Error(`Disk ${i} should have id ${i + 1}`);
            if (disk.size !== i + 1) throw new Error(`Disk ${i} should have size ${i + 1}`);
            if (disk.rod !== 0) throw new Error(`Disk ${i} should start on rod 0`);
            if (!disk.color.startsWith('#')) throw new Error(`Disk ${i} should have valid color`);
        }
        
        // Test invalid disk counts
        const invalidCounts = [0, 9, -1, 'invalid'];
        for (const count of invalidCounts) {
            try {
                GameState.createDisks(count);
                throw new Error(`Should reject invalid disk count: ${count}`);
            } catch (error) {
                // Expected to throw
            }
        }
    });
    
    // Test 17: Move creation validation
    test('Should reject invalid move parameters', () => {
        const invalidParams = [
            [-1, 1, 1, 1], // Invalid fromRod
            [0, 3, 1, 1],  // Invalid toRod
            [0, 0, 1, 1],  // Same rod
            [0, 1, 0, 1],  // Invalid diskId
            [0, 1, 1, 0],  // Invalid moveNumber
        ];
        
        for (const params of invalidParams) {
            try {
                GameState.createMove(...params);
                throw new Error(`Should reject invalid move params: ${JSON.stringify(params)}`);
            } catch (error) {
                // Expected to throw
            }
        }
    });
    
    // Test 18: Disk creation validation
    test('Should reject invalid disk parameters', () => {
        const invalidParams = [
            [0, 1, 'red', { x: 0, y: 0 }, 0],     // Invalid id
            [1, 0, 'red', { x: 0, y: 0 }, 0],     // Invalid size
            [1, 1, '', { x: 0, y: 0 }, 0],        // Invalid color
            [1, 1, 'red', { x: 'a', y: 0 }, 0],   // Invalid position
            [1, 1, 'red', { x: 0, y: 0 }, 3],     // Invalid rod
        ];
        
        for (const params of invalidParams) {
            try {
                GameState.createDisk(...params);
                throw new Error(`Should reject invalid disk params: ${JSON.stringify(params)}`);
            } catch (error) {
                // Expected to throw
            }
        }
    });
    
    console.log(`\n📊 Test Results: ${passed} passed, ${failed} failed`);
    
    if (failed === 0) {
        console.log('🎉 All tests passed!');
    } else {
        console.log('💥 Some tests failed!');
    }
    
    return { passed, failed };
}

// Auto-run tests if in browser environment
if (typeof window !== 'undefined' && window.GameState) {
    // Add a small delay to ensure GameState is loaded
    setTimeout(runTests, 100);
}

// Export for Node.js testing
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { runTests };
}