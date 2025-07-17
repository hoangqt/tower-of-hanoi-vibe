/**
 * Game State Management for Towers of Hanoi
 * 
 * This module handles the core game state data structure and initialization logic.
 * It provides functions to create, validate, and manage the game state.
 * Also includes Disk and Move data models.
 */

/**
 * Creates a Disk object with specified properties
 * @param {number} id - Unique identifier (1 = smallest)
 * @param {number} size - Relative size (1 = smallest)
 * @param {string} color - Visual color
 * @param {Object} position - Current position {x, y}
 * @param {number} rod - Current rod (0, 1, or 2)
 * @returns {Object} Disk object
 */
function createDisk(id, size, color, position = { x: 0, y: 0 }, rod = 0) {
    if (!Number.isInteger(id) || id < 1) {
        throw new Error('Disk id must be a positive integer');
    }

    if (!Number.isInteger(size) || size < 1) {
        throw new Error('Disk size must be a positive integer');
    }

    if (typeof color !== 'string' || !color.trim()) {
        throw new Error('Disk color must be a non-empty string');
    }

    if (!position || typeof position.x !== 'number' || typeof position.y !== 'number') {
        throw new Error('Disk position must be an object with numeric x and y properties');
    }

    if (!Number.isInteger(rod) || rod < 0 || rod > 2) {
        throw new Error('Disk rod must be an integer between 0 and 2');
    }

    return {
        id,
        size,
        color,
        position: { x: position.x, y: position.y },
        rod,
        isSelected: false,
        isAnimating: false
    };
}

/**
 * Creates a Move object to track game history
 * @param {number} fromRod - Source rod (0, 1, or 2)
 * @param {number} toRod - Destination rod (0, 1, or 2)
 * @param {number} diskId - ID of the disk that was moved
 * @param {number} moveNumber - Sequential move number
 * @returns {Object} Move object
 */
function createMove(fromRod, toRod, diskId, moveNumber) {
    if (!Number.isInteger(fromRod) || fromRod < 0 || fromRod > 2) {
        throw new Error('fromRod must be an integer between 0 and 2');
    }

    if (!Number.isInteger(toRod) || toRod < 0 || toRod > 2) {
        throw new Error('toRod must be an integer between 0 and 2');
    }

    if (fromRod === toRod) {
        throw new Error('fromRod and toRod cannot be the same');
    }

    if (!Number.isInteger(diskId) || diskId < 1) {
        throw new Error('diskId must be a positive integer');
    }

    if (!Number.isInteger(moveNumber) || moveNumber < 1) {
        throw new Error('moveNumber must be a positive integer');
    }

    return {
        fromRod,
        toRod,
        diskId,
        moveNumber,
        timestamp: new Date(),
        duration: null // Will be set when move animation completes
    };
}

/**
 * Validates a Disk object
 * @param {Object} disk - Disk object to validate
 * @returns {boolean} True if valid, throws error if invalid
 */
function validateDisk(disk) {
    if (!disk || typeof disk !== 'object') {
        throw new Error('Disk must be an object');
    }

    const requiredProps = ['id', 'size', 'color', 'position', 'rod'];
    for (const prop of requiredProps) {
        if (!(prop in disk)) {
            throw new Error(`Disk missing required property: ${prop}`);
        }
    }

    if (!Number.isInteger(disk.id) || disk.id < 1) {
        throw new Error('Disk id must be a positive integer');
    }

    if (!Number.isInteger(disk.size) || disk.size < 1) {
        throw new Error('Disk size must be a positive integer');
    }

    if (typeof disk.color !== 'string' || !disk.color.trim()) {
        throw new Error('Disk color must be a non-empty string');
    }

    if (!disk.position || typeof disk.position.x !== 'number' || typeof disk.position.y !== 'number') {
        throw new Error('Disk position must be an object with numeric x and y properties');
    }

    if (!Number.isInteger(disk.rod) || disk.rod < 0 || disk.rod > 2) {
        throw new Error('Disk rod must be an integer between 0 and 2');
    }

    return true;
}

/**
 * Validates a Move object
 * @param {Object} move - Move object to validate
 * @returns {boolean} True if valid, throws error if invalid
 */
function validateMove(move) {
    if (!move || typeof move !== 'object') {
        throw new Error('Move must be an object');
    }

    const requiredProps = ['fromRod', 'toRod', 'diskId', 'moveNumber', 'timestamp'];
    for (const prop of requiredProps) {
        if (!(prop in move)) {
            throw new Error(`Move missing required property: ${prop}`);
        }
    }

    if (!Number.isInteger(move.fromRod) || move.fromRod < 0 || move.fromRod > 2) {
        throw new Error('Move fromRod must be an integer between 0 and 2');
    }

    if (!Number.isInteger(move.toRod) || move.toRod < 0 || move.toRod > 2) {
        throw new Error('Move toRod must be an integer between 0 and 2');
    }

    if (move.fromRod === move.toRod) {
        throw new Error('Move fromRod and toRod cannot be the same');
    }

    if (!Number.isInteger(move.diskId) || move.diskId < 1) {
        throw new Error('Move diskId must be a positive integer');
    }

    if (!Number.isInteger(move.moveNumber) || move.moveNumber < 1) {
        throw new Error('Move moveNumber must be a positive integer');
    }

    if (!(move.timestamp instanceof Date)) {
        throw new Error('Move timestamp must be a Date object');
    }

    return true;
}

/**
 * Gets disk color based on size and total number of disks
 * @param {number} diskSize - Size of the disk (1 = smallest)
 * @param {number} totalDisks - Total number of disks in the game
 * @returns {string} Hex color code
 */
function getDiskColor(diskSize, totalDisks) {
    const colors = [
        '#e53e3e', // Red (largest)
        '#fd9801', // Orange
        '#ecc94b', // Yellow
        '#38a169', // Green
        '#3182ce', // Blue
        '#805ad5', // Purple
        '#d53f8c', // Pink
        '#2d3748'  // Dark gray (smallest)
    ];

    // Map disk size to color index (largest disk gets first color)
    const colorIndex = Math.min(diskSize - 1, colors.length - 1);
    return colors[colorIndex];
}

/**
 * Creates disk objects for a given number of disks
 * @param {number} numDisks - Number of disks to create
 * @returns {Array} Array of disk objects
 */
function createDisks(numDisks) {
    if (!Number.isInteger(numDisks) || numDisks < 1 || numDisks > 8) {
        throw new Error('Number of disks must be an integer between 1 and 8');
    }

    const disks = [];

    for (let i = 1; i <= numDisks; i++) {
        const disk = createDisk(
            i,                              // id
            i,                              // size
            getDiskColor(i, numDisks),      // color
            { x: 0, y: 0 },                // position (will be calculated during rendering)
            0                               // rod (all start on first rod)
        );

        disks.push(disk);
    }

    return disks;
}

/**
 * Creates a new game state with the specified number of disks
 * @param {number} numDisks - Number of disks (3-8)
 * @returns {Object} Initial game state
 */
function createGameState(numDisks = 3) {
    // Validate input
    if (!Number.isInteger(numDisks) || numDisks < 3 || numDisks > 8) {
        throw new Error('Number of disks must be an integer between 3 and 8');
    }

    // Create initial disk stack on the first rod (largest to smallest, bottom to top)
    const initialDisks = [];
    for (let i = numDisks; i >= 1; i--) {
        initialDisks.push(i);
    }

    const gameState = {
        rods: [
            { id: 0, disks: [...initialDisks] },  // Left rod with all disks
            { id: 1, disks: [] },                 // Middle rod (empty)
            { id: 2, disks: [] }                  // Right rod (empty)
        ],
        selectedDisk: null,
        selectedRod: null,
        moveCount: 0,
        gameComplete: false,
        moveHistory: [],
        settings: {
            numDisks: numDisks,
            animationSpeed: 300,
            showHints: true,
            autoSolveSpeed: 500
        },
        metadata: {
            gameStartTime: new Date(),
            lastMoveTime: null,
            optimalMoves: Math.pow(2, numDisks) - 1
        }
    };

    return gameState;
}

/**
 * Validates the structure and integrity of a game state object
 * @param {Object} gameState - Game state to validate
 * @returns {boolean} True if valid, throws error if invalid
 */
function validateGameState(gameState) {
    // Check required properties
    const requiredProps = ['rods', 'selectedDisk', 'selectedRod', 'moveCount', 'gameComplete', 'moveHistory', 'settings', 'metadata'];
    for (const prop of requiredProps) {
        if (!(prop in gameState)) {
            throw new Error(`Missing required property: ${prop}`);
        }
    }

    // Validate rods array
    if (!Array.isArray(gameState.rods) || gameState.rods.length !== 3) {
        throw new Error('Game state must have exactly 3 rods');
    }

    // Validate each rod
    for (let i = 0; i < 3; i++) {
        const rod = gameState.rods[i];
        if (!rod || rod.id !== i || !Array.isArray(rod.disks)) {
            throw new Error(`Invalid rod structure at index ${i}`);
        }

        // Validate disk ordering (largest to smallest, bottom to top)
        for (let j = 1; j < rod.disks.length; j++) {
            if (rod.disks[j] >= rod.disks[j - 1]) {
                throw new Error(`Invalid disk ordering on rod ${i}: disks must be in descending order`);
            }
        }
    }

    // Validate disk count and uniqueness
    const allDisks = gameState.rods.flatMap(rod => rod.disks);
    const numDisks = gameState.settings.numDisks;

    if (allDisks.length !== numDisks) {
        throw new Error(`Expected ${numDisks} disks, found ${allDisks.length}`);
    }

    const uniqueDisks = new Set(allDisks);
    if (uniqueDisks.size !== numDisks) {
        throw new Error('Duplicate disks found in game state');
    }

    for (let i = 1; i <= numDisks; i++) {
        if (!uniqueDisks.has(i)) {
            throw new Error(`Missing disk ${i}`);
        }
    }

    // Validate settings
    const settings = gameState.settings;
    if (!Number.isInteger(settings.numDisks) || settings.numDisks < 3 || settings.numDisks > 8) {
        throw new Error('Invalid numDisks in settings');
    }

    if (!Number.isInteger(settings.animationSpeed) || settings.animationSpeed < 100) {
        throw new Error('Invalid animationSpeed in settings');
    }

    // Validate move count
    if (!Number.isInteger(gameState.moveCount) || gameState.moveCount < 0) {
        throw new Error('Invalid move count');
    }

    // Validate move history
    if (!Array.isArray(gameState.moveHistory)) {
        throw new Error('Move history must be an array');
    }

    if (gameState.moveHistory.length !== gameState.moveCount) {
        throw new Error('Move history length does not match move count');
    }

    return true;
}

/**
 * Creates a deep copy of the game state
 * @param {Object} gameState - Game state to copy
 * @returns {Object} Deep copy of the game state
 */
function cloneGameState(gameState) {
    return {
        rods: gameState.rods.map(rod => ({
            id: rod.id,
            disks: [...rod.disks]
        })),
        selectedDisk: gameState.selectedDisk,
        selectedRod: gameState.selectedRod,
        moveCount: gameState.moveCount,
        gameComplete: gameState.gameComplete,
        moveHistory: gameState.moveHistory.map(move => ({ ...move })),
        settings: { ...gameState.settings },
        metadata: { ...gameState.metadata }
    };
}

/**
 * Resets the game state to initial configuration
 * @param {Object} gameState - Current game state
 * @returns {Object} Reset game state
 */
function resetGameState(gameState) {
    const numDisks = gameState.settings.numDisks;
    const newState = createGameState(numDisks);

    // Preserve some settings from the current state
    newState.settings = { ...gameState.settings };

    return newState;
}

/**
 * Gets a summary of the current game state for debugging
 * @param {Object} gameState - Game state to summarize
 * @returns {Object} Game state summary
 */
function getGameStateSummary(gameState) {
    return {
        rodContents: gameState.rods.map(rod => rod.disks),
        moveCount: gameState.moveCount,
        gameComplete: gameState.gameComplete,
        selectedDisk: gameState.selectedDisk,
        selectedRod: gameState.selectedRod,
        numDisks: gameState.settings.numDisks,
        optimalMoves: gameState.metadata.optimalMoves
    };
}

/**
 * Checks if the game is in a winning state (all disks on the rightmost rod)
 * @param {Object} gameState - Game state to check
 * @returns {boolean} True if game is won
 */
function isGameWon(gameState) {
    const rightRod = gameState.rods[2];
    const numDisks = gameState.settings.numDisks;

    // Check if all disks are on the right rod
    if (rightRod.disks.length !== numDisks) {
        return false;
    }

    // Check if disks are in correct order (largest to smallest, bottom to top)
    for (let i = 0; i < numDisks; i++) {
        if (rightRod.disks[i] !== numDisks - i) {
            return false;
        }
    }

    return true;
}

// Export functions for use by other modules
if (typeof module !== 'undefined' && module.exports) {
    // Node.js environment (for testing)
    module.exports = {
        createGameState,
        validateGameState,
        cloneGameState,
        resetGameState,
        getGameStateSummary,
        isGameWon,
        createDisk,
        createMove,
        validateDisk,
        validateMove,
        getDiskColor,
        createDisks
    };
} else {
    // Browser environment
    window.GameState = {
        createGameState,
        validateGameState,
        cloneGameState,
        resetGameState,
        getGameStateSummary,
        isGameWon,
        createDisk,
        createMove,
        validateDisk,
        validateMove,
        getDiskColor,
        createDisks
    };
}