/**
 * Unit Tests for Game Engine
 * 
 * Test suite to validate game engine functionality including move validation.
 */

// Test runner function for Game Engine
function runGameEngineTests() {
    console.log('🎮 Running Game Engine Tests...\n');

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

    // Test 1: Valid move validation
    test('Should validate legal moves correctly', () => {
        const state = GameState.createGameState(3);

        // Valid move: top disk (1) from rod 0 to rod 1
        const result = GameEngine.validateMove(state, 0, 1);

        if (!result.isValid) throw new Error('Valid move should be accepted');
        if (result.error) throw new Error('Valid move should not have error');
    });

    // Test 2: Invalid move - empty source rod
    test('Should reject moves from empty rods', () => {
        const state = GameState.createGameState(3);

        // Try to move from empty rod 1
        const result = GameEngine.validateMove(state, 1, 0);

        if (result.isValid) throw new Error('Should reject move from empty rod');
        if (result.error.type !== GameEngine.MoveError.EMPTY_SOURCE_ROD) {
            throw new Error('Should have EMPTY_SOURCE_ROD error type');
        }
    });

    // Test 3: Invalid move - larger disk on smaller disk
    test('Should reject placing larger disk on smaller disk', () => {
        const state = GameState.createGameState(3);

        // Move small disk (1) to rod 1
        state.rods[1].disks = [1];
        state.rods[0].disks = [3, 2];

        // Try to move medium disk (2) onto small disk (1)
        const result = GameEngine.validateMove(state, 0, 1);

        if (result.isValid) throw new Error('Should reject larger disk on smaller disk');
        if (result.error.type !== GameEngine.MoveError.LARGER_ON_SMALLER) {
            throw new Error('Should have LARGER_ON_SMALLER error type');
        }
    });

    // Test 4: Invalid move - same rod
    test('Should reject moves to the same rod', () => {
        const state = GameState.createGameState(3);

        const result = GameEngine.validateMove(state, 0, 0);

        if (result.isValid) throw new Error('Should reject move to same rod');
        if (result.error.type !== GameEngine.MoveError.SAME_ROD) {
            throw new Error('Should have SAME_ROD error type');
        }
    });

    // Test 5: Invalid rod indices
    test('Should reject invalid rod indices', () => {
        const state = GameState.createGameState(3);

        // Invalid source rod
        const result1 = GameEngine.validateMove(state, -1, 1);
        if (result1.isValid) throw new Error('Should reject invalid source rod');
        if (result1.error.type !== GameEngine.MoveError.INVALID_SOURCE_ROD) {
            throw new Error('Should have INVALID_SOURCE_ROD error type');
        }

        // Invalid target rod
        const result2 = GameEngine.validateMove(state, 0, 3);
        if (result2.isValid) throw new Error('Should reject invalid target rod');
        if (result2.error.type !== GameEngine.MoveError.INVALID_TARGET_ROD) {
            throw new Error('Should have INVALID_TARGET_ROD error type');
        }
    });

    // Test 6: Game complete validation
    test('Should reject moves when game is complete', () => {
        const state = GameState.createGameState(3);
        state.gameComplete = true;

        const result = GameEngine.validateMove(state, 0, 1);

        if (result.isValid) throw new Error('Should reject moves when game is complete');
        if (result.error.type !== GameEngine.MoveError.GAME_COMPLETE) {
            throw new Error('Should have GAME_COMPLETE error type');
        }
    });

    // Test 7: Move info generation
    test('Should generate correct move information', () => {
        const state = GameState.createGameState(3);

        const moveInfo = GameEngine.getMoveInfo(state, 0, 1);

        if (!moveInfo.isValid) throw new Error('Move info should be valid');
        if (moveInfo.diskToMove !== 1) throw new Error('Should identify correct disk to move');
        if (moveInfo.sourceRod !== 0) throw new Error('Should identify correct source rod');
        if (moveInfo.targetRod !== 1) throw new Error('Should identify correct target rod');
        if (moveInfo.moveNumber !== 1) throw new Error('Should calculate correct move number');
    });

    // Test 8: Disk movement validation
    test('Should validate disk movement correctly', () => {
        const state = GameState.createGameState(3);

        // Check if top disk can be moved
        const result1 = GameEngine.canMoveDisk(state, 1);
        if (!result1.canMove) throw new Error('Top disk should be movable');
        if (result1.rodIndex !== 0) throw new Error('Should identify correct rod');
        if (!result1.isTopDisk) throw new Error('Should identify as top disk');

        // Check if bottom disk can be moved
        const result2 = GameEngine.canMoveDisk(state, 3);
        if (result2.canMove) throw new Error('Bottom disk should not be movable');
        if (result2.isTopDisk) throw new Error('Should not identify bottom disk as top disk');
    });

    // Test 9: Valid moves enumeration
    test('Should enumerate all valid moves correctly', () => {
        const state = GameState.createGameState(3);

        const validMoves = GameEngine.getValidMoves(state);

        // From initial state, only disk 1 can move to rods 1 or 2
        if (validMoves.length !== 2) throw new Error('Should have exactly 2 valid moves initially');

        const move1 = validMoves.find(m => m.sourceRod === 0 && m.targetRod === 1);
        const move2 = validMoves.find(m => m.sourceRod === 0 && m.targetRod === 2);

        if (!move1 || !move2) throw new Error('Should have moves from rod 0 to rods 1 and 2');
        if (move1.diskToMove !== 1 || move2.diskToMove !== 1) {
            throw new Error('Both moves should involve disk 1');
        }
    });

    // Test 10: Valid destinations
    test('Should identify valid destinations correctly', () => {
        const state = GameState.createGameState(3);

        // From rod 0, can move to rods 1 and 2
        const destinations0 = GameEngine.getValidDestinations(state, 0);
        if (destinations0.length !== 2) throw new Error('Rod 0 should have 2 valid destinations');
        if (!destinations0.includes(1) || !destinations0.includes(2)) {
            throw new Error('Rod 0 should be able to move to rods 1 and 2');
        }

        // From empty rod 1, no valid moves
        const destinations1 = GameEngine.getValidDestinations(state, 1);
        if (destinations1.length !== 0) throw new Error('Empty rod should have no valid destinations');
    });

    // Test 11: Move sequence validation
    test('Should validate move sequences correctly', () => {
        const state = GameState.createGameState(3);

        // Valid sequence: move disk 1 from rod 0 to rod 1, then to rod 2
        const validSequence = [
            { fromRod: 0, toRod: 1 },
            { fromRod: 1, toRod: 2 }
        ];

        const result1 = GameEngine.validateMoveSequence(state, validSequence);
        if (!result1.isValid) throw new Error('Valid sequence should be accepted');
        if (result1.validatedMoves.length !== 2) throw new Error('Should validate 2 moves');

        // Invalid sequence: try to move disk 3 first
        const invalidSequence = [
            { fromRod: 0, toRod: 1 }, // Move disk 1
            { fromRod: 0, toRod: 2 }  // Try to move disk 2 onto disk 1 (invalid)
        ];

        // First move disk 1 to rod 2, then this sequence should fail
        const testState = GameState.cloneGameState(state);
        testState.rods[2].disks = [1];
        testState.rods[0].disks = [3, 2];

        const result2 = GameEngine.validateMoveSequence(testState, [{ fromRod: 0, toRod: 2 }]);
        if (result2.isValid) throw new Error('Invalid sequence should be rejected');
    });

    // Test 12: Error object creation
    test('Should create proper error objects', () => {
        const error = GameEngine.createMoveError(
            GameEngine.MoveError.EMPTY_SOURCE_ROD,
            'Test error message',
            { fromRod: 1, toRod: 0 }
        );

        if (error.type !== GameEngine.MoveError.EMPTY_SOURCE_ROD) {
            throw new Error('Error should have correct type');
        }
        if (error.message !== 'Test error message') {
            throw new Error('Error should have correct message');
        }
        if (!error.details || error.details.fromRod !== 1) {
            throw new Error('Error should have correct details');
        }
        if (!(error.timestamp instanceof Date)) {
            throw new Error('Error should have timestamp');
        }
    });

    // Test 13: Complex game state validation
    test('Should handle complex game states correctly', () => {
        const state = GameState.createGameState(4);

        // Set up a mid-game state
        state.rods[0].disks = [4, 3];
        state.rods[1].disks = [2];
        state.rods[2].disks = [1];

        // Valid moves should be: 3->1, 3->2, 2->0, 1->0
        const validMoves = GameEngine.getValidMoves(state);

        if (validMoves.length !== 4) {
            throw new Error(`Expected 4 valid moves, got ${validMoves.length}`);
        }

        // Check specific moves
        const move3to1 = validMoves.find(m => m.sourceRod === 0 && m.targetRod === 1 && m.diskToMove === 3);
        const move3to2 = validMoves.find(m => m.sourceRod === 0 && m.targetRod === 2 && m.diskToMove === 3);
        const move2to0 = validMoves.find(m => m.sourceRod === 1 && m.targetRod === 0 && m.diskToMove === 2);
        const move1to0 = validMoves.find(m => m.sourceRod === 2 && m.targetRod === 0 && m.diskToMove === 1);

        if (!move3to1 || !move3to2 || !move2to0 || !move1to0) {
            throw new Error('Should identify all valid moves in complex state');
        }
    });

    // Test 14: Edge case - single disk
    test('Should handle single disk edge cases', () => {
        // Create a custom state with single disk for testing
        const state = {
            rods: [
                { id: 0, disks: [1] },
                { id: 1, disks: [] },
                { id: 2, disks: [] }
            ],
            selectedDisk: null,
            selectedRod: null,
            moveCount: 0,
            gameComplete: false,
            moveHistory: [],
            settings: { numDisks: 1, animationSpeed: 300, showHints: true },
            metadata: { gameStartTime: new Date(), lastMoveTime: null, optimalMoves: 1 }
        };

        const validMoves = GameEngine.getValidMoves(state);
        if (validMoves.length !== 2) throw new Error('Single disk should have 2 valid moves');

        // Both moves should involve disk 1
        if (!validMoves.every(m => m.diskToMove === 1)) {
            throw new Error('All moves should involve the single disk');
        }
    });

    // Test 15: Invalid game state handling
    test('Should handle invalid game states gracefully', () => {
        const invalidState = { rods: [] }; // Invalid state

        const result = GameEngine.validateMove(invalidState, 0, 1);

        if (result.isValid) throw new Error('Should reject invalid game state');
        if (result.error.type !== GameEngine.MoveError.INVALID_GAME_STATE) {
            throw new Error('Should have INVALID_GAME_STATE error type');
        }
    });

    // Test 16: Make move functionality
    test('Should execute moves correctly', () => {
        const state = GameState.createGameState(3);

        // Make a valid move: disk 1 from rod 0 to rod 1
        const result = GameEngine.makeMove(state, 0, 1);

        if (!result.success) throw new Error('Valid move should succeed');
        if (result.diskMoved !== 1) throw new Error('Should move disk 1');
        if (result.fromRod !== 0) throw new Error('Should move from rod 0');
        if (result.toRod !== 1) throw new Error('Should move to rod 1');

        // Check game state was updated
        if (state.moveCount !== 1) throw new Error('Move count should be 1');
        if (state.rods[0].disks.length !== 2) throw new Error('Source rod should have 2 disks');
        if (state.rods[1].disks.length !== 1) throw new Error('Target rod should have 1 disk');
        if (state.rods[1].disks[0] !== 1) throw new Error('Target rod should have disk 1');
        if (state.moveHistory.length !== 1) throw new Error('Move history should have 1 move');
    });

    // Test 17: Undo move functionality
    test('Should undo moves correctly', () => {
        const state = GameState.createGameState(3);

        // Make a move first
        GameEngine.makeMove(state, 0, 1);

        // Undo the move
        const result = GameEngine.undoLastMove(state);

        if (!result.success) throw new Error('Undo should succeed');
        if (result.diskMoved !== 1) throw new Error('Should undo disk 1');
        if (result.fromRod !== 1) throw new Error('Should undo from rod 1');
        if (result.toRod !== 0) throw new Error('Should undo to rod 0');

        // Check game state was restored
        if (state.moveCount !== 0) throw new Error('Move count should be 0');
        if (state.rods[0].disks.length !== 3) throw new Error('Source rod should have 3 disks');
        if (state.rods[1].disks.length !== 0) throw new Error('Target rod should be empty');
        if (state.moveHistory.length !== 0) throw new Error('Move history should be empty');
    });

    // Test 18: Undo with no moves
    test('Should reject undo when no moves exist', () => {
        const state = GameState.createGameState(3);

        const result = GameEngine.undoLastMove(state);

        if (result.success) throw new Error('Should reject undo with no moves');
        if (result.error.type !== 'NO_MOVES_TO_UNDO') {
            throw new Error('Should have NO_MOVES_TO_UNDO error type');
        }
    });

    // Test 19: Disk selection
    test('Should select disks correctly', () => {
        const state = GameState.createGameState(3);

        const result = GameEngine.selectDisk(state, 0);

        if (!result.success) throw new Error('Disk selection should succeed');
        if (result.selectedDisk !== 1) throw new Error('Should select disk 1');
        if (result.selectedRod !== 0) throw new Error('Should select from rod 0');
        if (state.selectedDisk !== 1) throw new Error('Game state should track selected disk');
        if (state.selectedRod !== 0) throw new Error('Game state should track selected rod');
        if (result.validDestinations.length !== 2) throw new Error('Should have 2 valid destinations');
    });

    // Test 20: Clear selection
    test('Should clear selection correctly', () => {
        const state = GameState.createGameState(3);

        // Select a disk first
        GameEngine.selectDisk(state, 0);

        // Clear selection
        const result = GameEngine.clearSelection(state);

        if (!result.success) throw new Error('Clear selection should succeed');
        if (state.selectedDisk !== null) throw new Error('Selected disk should be null');
        if (state.selectedRod !== null) throw new Error('Selected rod should be null');
        if (result.previousSelection.disk !== 1) throw new Error('Should track previous selection');
    });

    // Test 21: Move selected disk
    test('Should move selected disk correctly', () => {
        const state = GameState.createGameState(3);

        // Select a disk first
        GameEngine.selectDisk(state, 0);

        // Move selected disk
        const result = GameEngine.moveSelectedDisk(state, 1);

        if (!result.success) throw new Error('Move selected disk should succeed');
        if (result.diskMoved !== 1) throw new Error('Should move disk 1');
        if (state.selectedDisk !== null) throw new Error('Selection should be cleared after move');
        if (state.rods[1].disks[0] !== 1) throw new Error('Disk should be moved to target rod');
    });

    // Test 22: Game statistics
    test('Should calculate game statistics correctly', () => {
        const state = GameState.createGameState(3);

        const stats = GameEngine.getGameStats(state);

        if (stats.moveCount !== 0) throw new Error('Initial move count should be 0');
        if (stats.optimalMoves !== 7) throw new Error('Optimal moves should be 7 for 3 disks');
        if (stats.efficiency !== 100) throw new Error('Initial efficiency should be 100%');
        if (stats.gameComplete !== false) throw new Error('Game should not be complete initially');
        if (stats.isOptimalSolution !== false) throw new Error('Should not be optimal solution initially');

        // Make a move and check stats
        GameEngine.makeMove(state, 0, 1);
        const stats2 = GameEngine.getGameStats(state);

        if (stats2.moveCount !== 1) throw new Error('Move count should be 1 after move');
        if (stats2.efficiency !== 700) throw new Error('Efficiency should be 700% after 1 move');
    });

    // Test 23: Game time formatting
    test('Should format game time correctly', () => {
        const time1 = GameEngine.formatGameTime(30000); // 30 seconds
        if (time1 !== '30s') throw new Error('Should format seconds correctly');

        const time2 = GameEngine.formatGameTime(90000); // 1 minute 30 seconds
        if (time2 !== '1:30') throw new Error('Should format minutes and seconds correctly');

        const time3 = GameEngine.formatGameTime(125000); // 2 minutes 5 seconds
        if (time3 !== '2:05') throw new Error('Should pad seconds with zero');
    });

    // Test 24: Game configuration validation
    test('Should validate game configuration correctly', () => {
        const state = GameState.createGameState(3);

        const validation = GameEngine.validateGameConfiguration(state);

        if (!validation.isValid) throw new Error('Valid configuration should pass');
        if (!validation.hasValidMoves) throw new Error('Should have valid moves');
        if (validation.isWon) throw new Error('Should not be won initially');
        if (!validation.canContinue) throw new Error('Should be able to continue');
        if (validation.validMoveCount !== 2) throw new Error('Should have 2 valid moves initially');
    });

    // Test 25: Move sequence execution
    test('Should execute move sequences correctly', () => {
        const state = GameState.createGameState(3);

        const moves = [
            { fromRod: 0, toRod: 1 }, // Move disk 1 to rod 1
            { fromRod: 0, toRod: 2 }, // Move disk 2 to rod 2
            { fromRod: 1, toRod: 2 }  // Move disk 1 to rod 2
        ];

        const result = GameEngine.executeMoveSequence(state, moves);

        if (!result.success) throw new Error('Valid sequence should succeed');
        if (result.totalMoves !== 3) throw new Error('Should execute 3 moves');
        if (result.executedMoves.length !== 3) throw new Error('Should track 3 executed moves');
        if (state.moveCount !== 3) throw new Error('Game state should reflect 3 moves');
        if (state.rods[2].disks.length !== 2) throw new Error('Rod 2 should have 2 disks');
    });

    // Test 26: Win condition detection in makeMove
    test('Should detect win condition when making moves', () => {
        const state = GameState.createGameState(3);

        // Set up near-win state: all disks on rod 2 except disk 1 on rod 1
        state.rods[0].disks = [];
        state.rods[1].disks = [1];
        state.rods[2].disks = [3, 2];
        state.moveCount = 6;

        // Move disk 1 to rod 2 to win
        const result = GameEngine.makeMove(state, 1, 2);

        if (!result.success) throw new Error('Winning move should succeed');
        if (!result.gameComplete) throw new Error('Should detect game completion');
        if (!state.gameComplete) throw new Error('Game state should be marked complete');
        if (!state.metadata.gameEndTime) throw new Error('Should set game end time');
    });

    // Test 27: Invalid move execution
    test('Should reject invalid moves in makeMove', () => {
        const state = GameState.createGameState(3);

        // Try to move from empty rod
        const result = GameEngine.makeMove(state, 1, 0);

        if (result.success) throw new Error('Invalid move should fail');
        if (result.error.type !== GameEngine.MoveError.EMPTY_SOURCE_ROD) {
            throw new Error('Should have correct error type');
        }
        if (state.moveCount !== 0) throw new Error('Move count should not change on failed move');
    });

    // Test 28: Selection from empty rod
    test('Should reject selection from empty rod', () => {
        const state = GameState.createGameState(3);

        const result = GameEngine.selectDisk(state, 1); // Empty rod

        if (result.success) throw new Error('Should reject selection from empty rod');
        if (result.error.type !== 'EMPTY_ROD_SELECTION') {
            throw new Error('Should have EMPTY_ROD_SELECTION error type');
        }
    });

    // Test 29: Move selected disk with no selection
    test('Should reject moving when no disk is selected', () => {
        const state = GameState.createGameState(3);

        const result = GameEngine.moveSelectedDisk(state, 1);

        if (result.success) throw new Error('Should reject move with no selection');
        if (result.error.type !== 'NO_DISK_SELECTED') {
            throw new Error('Should have NO_DISK_SELECTED error type');
        }
    });

    // Test 30: Undo after game completion
    test('Should reject undo after game completion', () => {
        const state = GameState.createGameState(3);
        state.gameComplete = true;
        state.moveHistory.push(GameState.createMove(0, 1, 1, 1));

        const result = GameEngine.undoLastMove(state);

        if (result.success) throw new Error('Should reject undo after game completion');
        if (result.error.type !== 'CANNOT_UNDO_COMPLETE_GAME') {
            throw new Error('Should have CANNOT_UNDO_COMPLETE_GAME error type');
        }
    });

    // Test 31: Move history tracking
    test('Should track move history correctly', () => {
        const state = GameState.createGameState(3);

        // Make several moves
        GameEngine.makeMove(state, 0, 1); // Move disk 1 to rod 1
        GameEngine.makeMove(state, 0, 2); // Move disk 2 to rod 2
        GameEngine.makeMove(state, 1, 2); // Move disk 1 to rod 2

        if (state.moveHistory.length !== 3) throw new Error('Should track 3 moves in history');

        // Check first move
        const move1 = state.moveHistory[0];
        if (move1.fromRod !== 0 || move1.toRod !== 1 || move1.diskId !== 1) {
            throw new Error('First move should be disk 1 from rod 0 to rod 1');
        }

        // Check move numbers
        if (move1.moveNumber !== 1) throw new Error('First move should have moveNumber 1');
        if (state.moveHistory[2].moveNumber !== 3) throw new Error('Third move should have moveNumber 3');

        // Check timestamps
        if (!(move1.timestamp instanceof Date)) throw new Error('Move should have timestamp');
    });

    // Test 32: Multiple undo operations
    test('Should handle multiple undo operations correctly', () => {
        const state = GameState.createGameState(3);

        // Make 3 moves
        GameEngine.makeMove(state, 0, 1);
        GameEngine.makeMove(state, 0, 2);
        GameEngine.makeMove(state, 1, 2);

        if (state.moveCount !== 3) throw new Error('Should have 3 moves');

        // Undo all moves
        const undo1 = GameEngine.undoLastMove(state);
        const undo2 = GameEngine.undoLastMove(state);
        const undo3 = GameEngine.undoLastMove(state);

        if (!undo1.success || !undo2.success || !undo3.success) {
            throw new Error('All undo operations should succeed');
        }

        if (state.moveCount !== 0) throw new Error('Move count should be 0 after undoing all moves');
        if (state.moveHistory.length !== 0) throw new Error('Move history should be empty');

        // Game state should be back to initial
        if (state.rods[0].disks.length !== 3) throw new Error('All disks should be back on rod 0');
        if (state.rods[1].disks.length !== 0) throw new Error('Rod 1 should be empty');
        if (state.rods[2].disks.length !== 0) throw new Error('Rod 2 should be empty');
    });

    // Test 33: Move history validation
    test('Should validate move history consistency', () => {
        const state = GameState.createGameState(3);

        // Make moves and check history consistency
        GameEngine.makeMove(state, 0, 1);
        GameEngine.makeMove(state, 0, 2);

        // Validate that move history matches move count
        if (state.moveHistory.length !== state.moveCount) {
            throw new Error('Move history length should match move count');
        }

        // Validate move sequence numbers
        for (let i = 0; i < state.moveHistory.length; i++) {
            if (state.moveHistory[i].moveNumber !== i + 1) {
                throw new Error(`Move ${i} should have moveNumber ${i + 1}`);
            }
        }

        // Undo one move and check consistency
        GameEngine.undoLastMove(state);

        if (state.moveHistory.length !== state.moveCount) {
            throw new Error('Move history length should match move count after undo');
        }
    });

    // Test 34: Move history with game completion
    test('Should handle move history with game completion', () => {
        const state = GameState.createGameState(3);

        // Execute optimal solution (7 moves)
        const optimalMoves = [
            { fromRod: 0, toRod: 2 }, // Move disk 1 to rod 2
            { fromRod: 0, toRod: 1 }, // Move disk 2 to rod 1
            { fromRod: 2, toRod: 1 }, // Move disk 1 to rod 1
            { fromRod: 0, toRod: 2 }, // Move disk 3 to rod 2
            { fromRod: 1, toRod: 0 }, // Move disk 1 to rod 0
            { fromRod: 1, toRod: 2 }, // Move disk 2 to rod 2
            { fromRod: 0, toRod: 2 }  // Move disk 1 to rod 2
        ];

        for (const move of optimalMoves) {
            const result = GameEngine.makeMove(state, move.fromRod, move.toRod);
            if (!result.success) throw new Error(`Move should succeed: ${JSON.stringify(move)}`);
        }

        if (!state.gameComplete) throw new Error('Game should be complete');
        if (state.moveHistory.length !== 7) throw new Error('Should have 7 moves in history');
        if (state.moveCount !== 7) throw new Error('Move count should be 7');

        // Check that last move has correct timestamp
        const lastMove = state.moveHistory[state.moveHistory.length - 1];
        if (!(lastMove.timestamp instanceof Date)) throw new Error('Last move should have timestamp');
    });

    // Test 35: Undo preserves game state integrity
    test('Should preserve game state integrity during undo', () => {
        const state = GameState.createGameState(4);

        // Make some moves
        GameEngine.makeMove(state, 0, 1); // Move disk 1
        GameEngine.makeMove(state, 0, 2); // Move disk 2
        GameEngine.makeMove(state, 1, 2); // Move disk 1 onto disk 2

        // Validate state before undo
        GameState.validateGameState(state);

        // Undo last move
        const undoResult = GameEngine.undoLastMove(state);
        if (!undoResult.success) throw new Error('Undo should succeed');

        // Validate state after undo
        GameState.validateGameState(state);

        // Check specific state
        if (state.rods[1].disks.length !== 1) throw new Error('Rod 1 should have 1 disk after undo');
        if (state.rods[1].disks[0] !== 1) throw new Error('Rod 1 should have disk 1');
        if (state.rods[2].disks.length !== 1) throw new Error('Rod 2 should have 1 disk');
        if (state.rods[2].disks[0] !== 2) throw new Error('Rod 2 should have disk 2');
    });

    // Test 36: Move history timestamps
    test('Should track move timestamps correctly', () => {
        const state = GameState.createGameState(3);
        const startTime = new Date();

        // Make a move
        GameEngine.makeMove(state, 0, 1);

        const move = state.moveHistory[0];
        const moveTime = move.timestamp;

        if (!(moveTime instanceof Date)) throw new Error('Move timestamp should be a Date');
        if (moveTime < startTime) throw new Error('Move timestamp should be after start time');
        if (moveTime > new Date()) throw new Error('Move timestamp should not be in the future');

        // Check that lastMoveTime is updated
        if (state.metadata.lastMoveTime !== moveTime) {
            throw new Error('Game state lastMoveTime should match move timestamp');
        }
    });

    console.log(`\n📊 Game Engine Test Results: ${passed} passed, ${failed} failed`);

    if (failed === 0) {
        console.log('🎉 All game engine tests passed!');
    } else {
        console.log('💥 Some game engine tests failed!');
    }

    return { passed, failed };
}

// Auto-run tests if in browser environment
if (typeof window !== 'undefined' && window.GameEngine && window.GameState) {
    // Add a small delay to ensure modules are loaded
    setTimeout(runGameEngineTests, 200);
}

// Export for Node.js testing
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { runGameEngineTests };
}