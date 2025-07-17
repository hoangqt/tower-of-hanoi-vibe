/**
 * Game Engine for Towers of Hanoi
 * 
 * This module handles the core game logic including move validation,
 * game state manipulation, and win condition detection.
 */

/**
 * Error types for move validation
 */
const MoveError = {
    INVALID_SOURCE_ROD: 'INVALID_SOURCE_ROD',
    INVALID_TARGET_ROD: 'INVALID_TARGET_ROD',
    EMPTY_SOURCE_ROD: 'EMPTY_SOURCE_ROD',
    LARGER_ON_SMALLER: 'LARGER_ON_SMALLER',
    SAME_ROD: 'SAME_ROD',
    GAME_COMPLETE: 'GAME_COMPLETE',
    INVALID_GAME_STATE: 'INVALID_GAME_STATE'
};

/**
 * Creates a move validation error with detailed information
 * @param {string} type - Error type from MoveError enum
 * @param {string} message - Human-readable error message
 * @param {Object} details - Additional error details
 * @returns {Object} Move error object
 */
function createMoveError(type, message, details = {}) {
    return {
        type,
        message,
        details,
        timestamp: new Date()
    };
}

/**
 * Validates if a move is legal according to Towers of Hanoi rules
 * @param {Object} gameState - Current game state
 * @param {number} fromRod - Source rod (0, 1, or 2)
 * @param {number} toRod - Destination rod (0, 1, or 2)
 * @returns {Object} Validation result { isValid: boolean, error?: Object }
 */
function validateMove(gameState, fromRod, toRod) {
    // Validate game state
    try {
        GameState.validateGameState(gameState);
    } catch (error) {
        return {
            isValid: false,
            error: createMoveError(
                MoveError.INVALID_GAME_STATE,
                'Game state is invalid',
                { originalError: error.message }
            )
        };
    }

    // Check if game is already complete
    if (gameState.gameComplete) {
        return {
            isValid: false,
            error: createMoveError(
                MoveError.GAME_COMPLETE,
                'Game is already complete',
                { fromRod, toRod }
            )
        };
    }

    // Validate rod indices
    if (!Number.isInteger(fromRod) || fromRod < 0 || fromRod > 2) {
        return {
            isValid: false,
            error: createMoveError(
                MoveError.INVALID_SOURCE_ROD,
                `Invalid source rod: ${fromRod}. Must be 0, 1, or 2`,
                { fromRod, toRod }
            )
        };
    }

    if (!Number.isInteger(toRod) || toRod < 0 || toRod > 2) {
        return {
            isValid: false,
            error: createMoveError(
                MoveError.INVALID_TARGET_ROD,
                `Invalid target rod: ${toRod}. Must be 0, 1, or 2`,
                { fromRod, toRod }
            )
        };
    }

    // Check if trying to move to the same rod
    if (fromRod === toRod) {
        return {
            isValid: false,
            error: createMoveError(
                MoveError.SAME_ROD,
                'Cannot move disk to the same rod',
                { fromRod, toRod }
            )
        };
    }

    const sourceRod = gameState.rods[fromRod];
    const targetRod = gameState.rods[toRod];

    // Check if source rod is empty
    if (sourceRod.disks.length === 0) {
        return {
            isValid: false,
            error: createMoveError(
                MoveError.EMPTY_SOURCE_ROD,
                `Cannot move from empty rod ${fromRod}`,
                { fromRod, toRod, sourceRodDisks: sourceRod.disks }
            )
        };
    }

    // Get the disk to be moved (top disk on source rod)
    const diskToMove = sourceRod.disks[sourceRod.disks.length - 1];

    // Check if target rod is empty (always valid) or if disk can be placed
    if (targetRod.disks.length > 0) {
        const topDiskOnTarget = targetRod.disks[targetRod.disks.length - 1];
        
        // Rule: Can only place smaller disk on larger disk
        if (diskToMove >= topDiskOnTarget) {
            return {
                isValid: false,
                error: createMoveError(
                    MoveError.LARGER_ON_SMALLER,
                    `Cannot place disk ${diskToMove} on smaller disk ${topDiskOnTarget}`,
                    { 
                        fromRod, 
                        toRod, 
                        diskToMove, 
                        topDiskOnTarget,
                        sourceRodDisks: [...sourceRod.disks],
                        targetRodDisks: [...targetRod.disks]
                    }
                )
            };
        }
    }

    // Move is valid
    return { isValid: true };
}

/**
 * Gets detailed information about a potential move
 * @param {Object} gameState - Current game state
 * @param {number} fromRod - Source rod (0, 1, or 2)
 * @param {number} toRod - Destination rod (0, 1, or 2)
 * @returns {Object} Move information
 */
function getMoveInfo(gameState, fromRod, toRod) {
    const validation = validateMove(gameState, fromRod, toRod);
    
    if (!validation.isValid) {
        return {
            isValid: false,
            error: validation.error,
            diskToMove: null,
            sourceRod: fromRod,
            targetRod: toRod
        };
    }

    const sourceRod = gameState.rods[fromRod];
    const targetRod = gameState.rods[toRod];
    const diskToMove = sourceRod.disks[sourceRod.disks.length - 1];

    return {
        isValid: true,
        diskToMove,
        sourceRod: fromRod,
        targetRod: toRod,
        sourceRodDisks: [...sourceRod.disks],
        targetRodDisks: [...targetRod.disks],
        moveNumber: gameState.moveCount + 1
    };
}

/**
 * Checks if a specific disk can be moved from its current rod
 * @param {Object} gameState - Current game state
 * @param {number} diskId - ID of the disk to check
 * @returns {Object} Result with canMove boolean and details
 */
function canMoveDisk(gameState, diskId) {
    // Find which rod contains the disk
    let rodIndex = -1;
    let diskPosition = -1;

    for (let i = 0; i < 3; i++) {
        const rod = gameState.rods[i];
        const position = rod.disks.indexOf(diskId);
        if (position !== -1) {
            rodIndex = i;
            diskPosition = position;
            break;
        }
    }

    if (rodIndex === -1) {
        return {
            canMove: false,
            reason: `Disk ${diskId} not found in game state`,
            diskId,
            rodIndex: null,
            isTopDisk: false
        };
    }

    const rod = gameState.rods[rodIndex];
    const isTopDisk = diskPosition === rod.disks.length - 1;

    if (!isTopDisk) {
        return {
            canMove: false,
            reason: `Disk ${diskId} is not the top disk on rod ${rodIndex}`,
            diskId,
            rodIndex,
            isTopDisk: false,
            position: diskPosition,
            totalDisksOnRod: rod.disks.length
        };
    }

    return {
        canMove: true,
        reason: `Disk ${diskId} can be moved (top disk on rod ${rodIndex})`,
        diskId,
        rodIndex,
        isTopDisk: true,
        position: diskPosition,
        totalDisksOnRod: rod.disks.length
    };
}

/**
 * Gets all valid moves for the current game state
 * @param {Object} gameState - Current game state
 * @returns {Array} Array of valid move objects
 */
function getValidMoves(gameState) {
    const validMoves = [];

    // Check all possible rod combinations
    for (let fromRod = 0; fromRod < 3; fromRod++) {
        for (let toRod = 0; toRod < 3; toRod++) {
            if (fromRod !== toRod) {
                const validation = validateMove(gameState, fromRod, toRod);
                if (validation.isValid) {
                    const moveInfo = getMoveInfo(gameState, fromRod, toRod);
                    validMoves.push(moveInfo);
                }
            }
        }
    }

    return validMoves;
}

/**
 * Gets all valid destination rods for a specific source rod
 * @param {Object} gameState - Current game state
 * @param {number} fromRod - Source rod (0, 1, or 2)
 * @returns {Array} Array of valid destination rod indices
 */
function getValidDestinations(gameState, fromRod) {
    const validDestinations = [];

    for (let toRod = 0; toRod < 3; toRod++) {
        if (fromRod !== toRod) {
            const validation = validateMove(gameState, fromRod, toRod);
            if (validation.isValid) {
                validDestinations.push(toRod);
            }
        }
    }

    return validDestinations;
}

/**
 * Validates multiple moves in sequence
 * @param {Object} gameState - Current game state
 * @param {Array} moves - Array of move objects [{fromRod, toRod}, ...]
 * @returns {Object} Validation result with details
 */
function validateMoveSequence(gameState, moves) {
    if (!Array.isArray(moves)) {
        return {
            isValid: false,
            error: 'Moves must be an array',
            validatedMoves: []
        };
    }

    const validatedMoves = [];
    let currentState = GameState.cloneGameState(gameState);

    for (let i = 0; i < moves.length; i++) {
        const move = moves[i];
        
        if (!move || typeof move.fromRod !== 'number' || typeof move.toRod !== 'number') {
            return {
                isValid: false,
                error: `Invalid move format at index ${i}`,
                validatedMoves,
                failedMoveIndex: i
            };
        }

        const validation = validateMove(currentState, move.fromRod, move.toRod);
        
        if (!validation.isValid) {
            return {
                isValid: false,
                error: `Invalid move at index ${i}: ${validation.error.message}`,
                validatedMoves,
                failedMoveIndex: i,
                failedMove: move,
                moveError: validation.error
            };
        }

        validatedMoves.push({
            ...move,
            moveNumber: i + 1,
            diskToMove: currentState.rods[move.fromRod].disks[currentState.rods[move.fromRod].disks.length - 1]
        });

        // Simulate the move for next iteration
        const diskToMove = currentState.rods[move.fromRod].disks.pop();
        currentState.rods[move.toRod].disks.push(diskToMove);
        currentState.moveCount++;
    }

    return {
        isValid: true,
        validatedMoves,
        totalMoves: moves.length
    };
}

/**
 * Executes a move and updates the game state
 * @param {Object} gameState - Current game state (will be modified)
 * @param {number} fromRod - Source rod (0, 1, or 2)
 * @param {number} toRod - Destination rod (0, 1, or 2)
 * @returns {Object} Result with success status and details
 */
function makeMove(gameState, fromRod, toRod) {
    // Validate the move first
    const validation = validateMove(gameState, fromRod, toRod);
    
    if (!validation.isValid) {
        return {
            success: false,
            error: validation.error,
            gameState: gameState
        };
    }

    // Get move information
    const moveInfo = getMoveInfo(gameState, fromRod, toRod);
    const diskToMove = moveInfo.diskToMove;

    // Create move record
    const move = GameState.createMove(fromRod, toRod, diskToMove, gameState.moveCount + 1);

    // Execute the move
    const movedDisk = gameState.rods[fromRod].disks.pop();
    gameState.rods[toRod].disks.push(movedDisk);

    // Update game state
    gameState.moveCount++;
    gameState.moveHistory.push(move);
    gameState.metadata.lastMoveTime = new Date();

    // Clear selection
    gameState.selectedDisk = null;
    gameState.selectedRod = null;

    // Check for win condition
    const isWon = GameState.isGameWon(gameState);
    if (isWon && !gameState.gameComplete) {
        gameState.gameComplete = true;
        gameState.metadata.gameEndTime = new Date();
        gameState.metadata.totalGameTime = gameState.metadata.gameEndTime - gameState.metadata.gameStartTime;
    }

    return {
        success: true,
        move: move,
        diskMoved: diskToMove,
        fromRod: fromRod,
        toRod: toRod,
        gameComplete: gameState.gameComplete,
        gameState: gameState
    };
}

/**
 * Undoes the last move
 * @param {Object} gameState - Current game state (will be modified)
 * @returns {Object} Result with success status and details
 */
function undoLastMove(gameState) {
    if (gameState.moveHistory.length === 0) {
        return {
            success: false,
            error: createMoveError(
                'NO_MOVES_TO_UNDO',
                'No moves to undo',
                { moveCount: gameState.moveCount }
            ),
            gameState: gameState
        };
    }

    if (gameState.gameComplete) {
        return {
            success: false,
            error: createMoveError(
                'CANNOT_UNDO_COMPLETE_GAME',
                'Cannot undo moves after game is complete',
                { gameComplete: true }
            ),
            gameState: gameState
        };
    }

    // Get the last move
    const lastMove = gameState.moveHistory.pop();
    
    // Reverse the move
    const diskToMove = gameState.rods[lastMove.toRod].disks.pop();
    gameState.rods[lastMove.fromRod].disks.push(diskToMove);

    // Update game state
    gameState.moveCount--;
    gameState.metadata.lastMoveTime = gameState.moveHistory.length > 0 
        ? gameState.moveHistory[gameState.moveHistory.length - 1].timestamp 
        : null;

    // Clear selection
    gameState.selectedDisk = null;
    gameState.selectedRod = null;

    return {
        success: true,
        undoneMove: lastMove,
        diskMoved: diskToMove,
        fromRod: lastMove.toRod, // Reversed
        toRod: lastMove.fromRod,  // Reversed
        gameState: gameState
    };
}

/**
 * Selects a disk for moving
 * @param {Object} gameState - Current game state (will be modified)
 * @param {number} rodIndex - Rod containing the disk to select
 * @returns {Object} Result with success status and details
 */
function selectDisk(gameState, rodIndex) {
    if (!Number.isInteger(rodIndex) || rodIndex < 0 || rodIndex > 2) {
        return {
            success: false,
            error: createMoveError(
                'INVALID_ROD_INDEX',
                `Invalid rod index: ${rodIndex}`,
                { rodIndex }
            )
        };
    }

    const rod = gameState.rods[rodIndex];
    
    if (rod.disks.length === 0) {
        return {
            success: false,
            error: createMoveError(
                'EMPTY_ROD_SELECTION',
                `Cannot select disk from empty rod ${rodIndex}`,
                { rodIndex, rodDisks: rod.disks }
            )
        };
    }

    // Select the top disk
    const topDisk = rod.disks[rod.disks.length - 1];
    
    gameState.selectedDisk = topDisk;
    gameState.selectedRod = rodIndex;

    return {
        success: true,
        selectedDisk: topDisk,
        selectedRod: rodIndex,
        validDestinations: getValidDestinations(gameState, rodIndex)
    };
}

/**
 * Clears the current disk selection
 * @param {Object} gameState - Current game state (will be modified)
 * @returns {Object} Result with success status
 */
function clearSelection(gameState) {
    const previousSelection = {
        disk: gameState.selectedDisk,
        rod: gameState.selectedRod
    };

    gameState.selectedDisk = null;
    gameState.selectedRod = null;

    return {
        success: true,
        previousSelection: previousSelection
    };
}

/**
 * Attempts to move the currently selected disk to a target rod
 * @param {Object} gameState - Current game state (will be modified)
 * @param {number} targetRod - Destination rod (0, 1, or 2)
 * @returns {Object} Result with success status and details
 */
function moveSelectedDisk(gameState, targetRod) {
    if (gameState.selectedDisk === null || gameState.selectedRod === null) {
        return {
            success: false,
            error: createMoveError(
                'NO_DISK_SELECTED',
                'No disk is currently selected',
                { selectedDisk: gameState.selectedDisk, selectedRod: gameState.selectedRod }
            )
        };
    }

    return makeMove(gameState, gameState.selectedRod, targetRod);
}

/**
 * Gets the current game statistics
 * @param {Object} gameState - Current game state
 * @returns {Object} Game statistics
 */
function getGameStats(gameState) {
    const optimalMoves = gameState.metadata.optimalMoves;
    const currentMoves = gameState.moveCount;
    const efficiency = currentMoves > 0 ? Math.round((optimalMoves / currentMoves) * 100) : 100;
    
    let gameTime = null;
    if (gameState.gameComplete && gameState.metadata.gameEndTime) {
        gameTime = gameState.metadata.gameEndTime - gameState.metadata.gameStartTime;
    } else if (gameState.metadata.gameStartTime) {
        gameTime = new Date() - gameState.metadata.gameStartTime;
    }

    return {
        moveCount: currentMoves,
        optimalMoves: optimalMoves,
        efficiency: efficiency,
        gameComplete: gameState.gameComplete,
        gameTime: gameTime,
        gameTimeFormatted: gameTime ? formatGameTime(gameTime) : null,
        movesRemaining: Math.max(0, optimalMoves - currentMoves),
        isOptimalSolution: gameState.gameComplete && currentMoves === optimalMoves
    };
}

/**
 * Formats game time in a human-readable format
 * @param {number} milliseconds - Time in milliseconds
 * @returns {string} Formatted time string
 */
function formatGameTime(milliseconds) {
    const seconds = Math.floor(milliseconds / 1000);
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    
    if (minutes > 0) {
        return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
    } else {
        return `${remainingSeconds}s`;
    }
}

/**
 * Checks if the current game state represents a valid Towers of Hanoi configuration
 * @param {Object} gameState - Game state to check
 * @returns {Object} Validation result with details
 */
function validateGameConfiguration(gameState) {
    try {
        GameState.validateGameState(gameState);
        
        // Additional game logic validation
        const validMoves = getValidMoves(gameState);
        const hasValidMoves = validMoves.length > 0;
        const isWon = GameState.isGameWon(gameState);
        
        return {
            isValid: true,
            hasValidMoves: hasValidMoves,
            isWon: isWon,
            validMoveCount: validMoves.length,
            canContinue: !isWon && hasValidMoves
        };
    } catch (error) {
        return {
            isValid: false,
            error: error.message,
            canContinue: false
        };
    }
}

/**
 * Executes multiple moves in sequence
 * @param {Object} gameState - Current game state (will be modified)
 * @param {Array} moves - Array of move objects [{fromRod, toRod}, ...]
 * @returns {Object} Result with success status and details
 */
function executeMoveSequence(gameState, moves) {
    const validation = validateMoveSequence(gameState, moves);
    
    if (!validation.isValid) {
        return {
            success: false,
            error: validation.error,
            executedMoves: [],
            gameState: gameState
        };
    }

    const executedMoves = [];
    const originalState = GameState.cloneGameState(gameState);

    try {
        for (const move of moves) {
            const result = makeMove(gameState, move.fromRod, move.toRod);
            
            if (!result.success) {
                // Rollback to original state
                Object.assign(gameState, originalState);
                return {
                    success: false,
                    error: result.error,
                    executedMoves: executedMoves,
                    gameState: gameState
                };
            }
            
            executedMoves.push(result);
        }

        return {
            success: true,
            executedMoves: executedMoves,
            totalMoves: moves.length,
            gameState: gameState
        };
    } catch (error) {
        // Rollback to original state
        Object.assign(gameState, originalState);
        return {
            success: false,
            error: createMoveError('EXECUTION_ERROR', error.message, { originalError: error }),
            executedMoves: executedMoves,
            gameState: gameState
        };
    }
}

// Export functions for use by other modules
if (typeof module !== 'undefined' && module.exports) {
    // Node.js environment (for testing)
    module.exports = {
        MoveError,
        createMoveError,
        validateMove,
        getMoveInfo,
        canMoveDisk,
        getValidMoves,
        getValidDestinations,
        validateMoveSequence,
        makeMove,
        undoLastMove,
        selectDisk,
        clearSelection,
        moveSelectedDisk,
        getGameStats,
        formatGameTime,
        validateGameConfiguration,
        executeMoveSequence
    };
} else {
    // Browser environment
    window.GameEngine = {
        MoveError,
        createMoveError,
        validateMove,
        getMoveInfo,
        canMoveDisk,
        getValidMoves,
        getValidDestinations,
        validateMoveSequence,
        makeMove,
        undoLastMove,
        selectDisk,
        clearSelection,
        moveSelectedDisk,
        getGameStats,
        formatGameTime,
        validateGameConfiguration,
        executeMoveSequence
    };
}