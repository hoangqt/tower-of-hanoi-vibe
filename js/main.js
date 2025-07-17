/**
 * Towers of Hanoi Game - Main Entry Point
 * 
 * This file serves as the main entry point for the Towers of Hanoi game.
 * It initializes the game components and manages the overall application lifecycle.
 */

// Game modules
let gameState = null;
let gameEngine = null;
let renderer = null;
let animationSystem = null;
let inputHandler = null;
let uiController = null;
let solverEngine = null;
let celebrationSystem = null;

// Timer variables
let gameStartTime = null;
let gameTimerInterval = null;

// DOM elements
const canvas = document.getElementById('game-canvas');
const ctx = canvas.getContext('2d');
const moveCounter = document.getElementById('move-counter');
const optimalMoves = document.getElementById('optimal-moves');
const efficiency = document.getElementById('efficiency');
const gameTimer = document.getElementById('game-timer');
const gameMessage = document.getElementById('game-message');

// Control buttons
const resetBtn = document.getElementById('reset-btn');
const undoBtn = document.getElementById('undo-btn');
const hintBtn = document.getElementById('hint-btn');
const solveBtn = document.getElementById('solve-btn');
const pauseBtn = document.getElementById('pause-btn');

// Settings
const diskCountSelect = document.getElementById('disk-count');
const showHintsCheckbox = document.getElementById('show-hints');
const achievementsBtn = document.getElementById('achievements-btn');

/**
 * Initialize the game application
 */
function initializeGame() {
    console.log('Initializing Towers of Hanoi game...');
    
    try {
        // Initialize game state first (with fallback)
        initializeGameState();
        
        // Make game state globally available
        window.gameState = gameState;
        
        // Try to initialize advanced systems, but don't fail if they don't work
        try {
            initializeRenderer();
        } catch (e) {
            console.warn('Advanced renderer failed, using fallback:', e);
            renderer = null;
        }
        
        try {
            initializeAnimationSystem();
        } catch (e) {
            console.warn('Animation system failed:', e);
            animationSystem = null;
        }
        
        try {
            initializeSolverEngine();
        } catch (e) {
            console.warn('Solver engine failed:', e);
            solverEngine = null;
        }
        
        try {
            initializeCelebrationSystem();
        } catch (e) {
            console.warn('Celebration system failed:', e);
            celebrationSystem = null;
        }
        
        try {
            initializeInputHandler();
        } catch (e) {
            console.warn('Advanced input handler failed, using simple version:', e);
            inputHandler = null;
        }
        
        // Set up canvas
        setupCanvas();
        
        // Add event listeners for UI controls
        setupEventListeners();
        
        // Set up input handling (advanced or simple)
        if (!inputHandler) {
            setupSimpleInputHandling();
        }
        
        // Update UI with initial state
        updateUIFromGameState();
        
        // Show initial message
        showMessage('🎮 Game ready! Click on disks to select them, then click another rod to move. Use keys 1,2,3 for rods!', 'success');
        
        console.log('Game initialization complete');
        console.log('Available systems:', {
            gameState: !!gameState,
            renderer: !!renderer,
            animationSystem: !!animationSystem,
            inputHandler: !!inputHandler,
            solverEngine: !!solverEngine,
            simpleInput: !inputHandler
        });
        
    } catch (error) {
        console.error('Failed to initialize game:', error);
        showMessage('Failed to initialize game. Please refresh the page.', 'error');
    }
}

/**
 * Initialize the game state with default settings
 */
function initializeGameState() {
    try {
        const initialDiskCount = parseInt(diskCountSelect.value);
        
        // Always use simple fallback game state for reliability
        console.log('Using reliable game state');
        gameState = {
            rods: [
                { disks: [] },
                { disks: [] },
                { disks: [] }
            ],
            selectedDisk: null,
            selectedRod: null,
            moveCount: 0,
            gameComplete: false,
            settings: { numDisks: initialDiskCount, showHints: true },
            metadata: { optimalMoves: Math.pow(2, initialDiskCount) - 1 },
            moveHistory: []
        };
        
        // Initialize disks on first rod (largest to smallest)
        for (let i = initialDiskCount; i >= 1; i--) {
            gameState.rods[0].disks.push(i);
        }
        
        console.log('Game state initialized with', initialDiskCount, 'disks');
        
    } catch (error) {
        console.error('Failed to initialize game state:', error);
        
        // Ultimate fallback
        gameState = {
            rods: [
                { disks: [3, 2, 1] },
                { disks: [] },
                { disks: [] }
            ],
            selectedDisk: null,
            selectedRod: null,
            moveCount: 0,
            gameComplete: false,
            settings: { numDisks: 3, showHints: true },
            metadata: { optimalMoves: 7 },
            moveHistory: []
        };
        
        showMessage('Using basic 3-disk game', 'info');
    }
}

/**
 * Initialize the renderer with canvas and game state
 */
function initializeRenderer() {
    try {
        renderer = new Renderer(canvas, gameState);
        console.log('Renderer initialized successfully');
    } catch (error) {
        console.error('Failed to initialize renderer:', error);
        showMessage('Failed to initialize renderer. Using fallback rendering.', 'error');
    }
}

/**
 * Initialize the animation system
 */
function initializeAnimationSystem() {
    try {
        animationSystem = new AnimationSystem(renderer, gameState);
        animationSystem.start();
        console.log('Animation system initialized successfully');
    } catch (error) {
        console.error('Failed to initialize animation system:', error);
        showMessage('Failed to initialize animations. Using static rendering.', 'error');
    }
}

/**
 * Initialize the input handler
 */
function initializeInputHandler() {
    try {
        // Make updateUIFromGameState and showMessage available globally for the input handler
        window.updateUIFromGameState = updateUIFromGameState;
        window.showMessage = showMessage;
        
        inputHandler = new InputHandler(canvas, gameState, renderer, animationSystem);
        console.log('Input handler initialized successfully');
    } catch (error) {
        console.error('Failed to initialize input handler:', error);
        showMessage('Failed to initialize input handling. Using basic controls.', 'error');
    }
}

/**
 * Initialize the solver engine
 */
function initializeSolverEngine() {
    try {
        solverEngine = new SolverEngine(gameState, animationSystem);
        console.log('Solver engine initialized successfully');
    } catch (error) {
        console.error('Failed to initialize solver engine:', error);
        showMessage('Failed to initialize solver engine. Auto-solve will not be available.', 'error');
    }
}

/**
 * Initialize the celebration system
 */
function initializeCelebrationSystem() {
    try {
        celebrationSystem = new CelebrationSystem(canvas, gameState, animationSystem);
        console.log('Celebration system initialized successfully');
    } catch (error) {
        console.error('Failed to initialize celebration system:', error);
        showMessage('Failed to initialize celebration system. Win celebrations will not be available.', 'error');
    }
}

/**
 * Update UI elements based on current game state
 */
function updateUIFromGameState() {
    if (!gameState) return;
    
    // Update statistics
    const efficiency = gameState.moveCount > 0 ? 
        Math.round((gameState.metadata.optimalMoves / gameState.moveCount) * 100) : 0;
    
    updateStats(
        gameState.moveCount,
        gameState.metadata.optimalMoves,
        efficiency
    );
    
    // Update settings UI to match game state
    diskCountSelect.value = gameState.settings.numDisks;
    showHintsCheckbox.checked = gameState.settings.showHints;
    
    // Update button states
    undoBtn.disabled = gameState.moveHistory.length === 0;
    
    // Update renderer with new game state and render
    if (renderer) {
        renderer.updateGameState(gameState);
        renderer.render();
    } else {
        drawGameState();
    }
}

/**
 * Set up canvas with proper dimensions and responsive behavior
 */
function setupCanvas() {
    // Set initial canvas size
    resizeCanvas();
    
    // Add resize listener for responsive design
    window.addEventListener('resize', resizeCanvas);
    
    // Draw placeholder content
    drawPlaceholder();
}

/**
 * Resize canvas to maintain aspect ratio and responsiveness
 */
function resizeCanvas() {
    const container = canvas.parentElement;
    const containerWidth = container.clientWidth;
    const containerHeight = window.innerHeight;
    
    // Determine optimal canvas size based on screen size and orientation
    let maxWidth, maxHeight;
    
    // Check if we're on mobile
    const isMobile = window.innerWidth <= 768;
    const isLandscape = window.innerWidth > window.innerHeight;
    
    if (isMobile) {
        if (isLandscape) {
            // Mobile landscape: prioritize width, limit height
            maxWidth = Math.min(containerWidth - 20, 600);
            maxHeight = Math.min(containerHeight * 0.6, 400);
        } else {
            // Mobile portrait: use most of the width, reasonable height
            maxWidth = Math.min(containerWidth - 20, 500);
            maxHeight = Math.min(containerHeight * 0.5, 400);
        }
    } else {
        // Desktop: use standard sizing
        maxWidth = Math.min(containerWidth - 40, 800);
        maxHeight = Math.min(containerHeight * 0.7, 600);
    }
    
    // Maintain aspect ratio (4:3 is ideal for the game)
    const aspectRatio = 4 / 3;
    let newWidth = maxWidth;
    let newHeight = maxWidth / aspectRatio;
    
    // If height is too large, constrain by height instead
    if (newHeight > maxHeight) {
        newHeight = maxHeight;
        newWidth = maxHeight * aspectRatio;
    }
    
    // Ensure minimum size for playability
    const minWidth = isMobile ? 280 : 400;
    const minHeight = minWidth / aspectRatio;
    
    newWidth = Math.max(newWidth, minWidth);
    newHeight = Math.max(newHeight, minHeight);
    
    if (renderer) {
        renderer.resize(newWidth, newHeight);
    } else {
        canvas.width = newWidth;
        canvas.height = newHeight;
        drawPlaceholder();
    }
    
    // Update canvas style for proper display
    canvas.style.width = newWidth + 'px';
    canvas.style.height = newHeight + 'px';
}

/**
 * Draw the current game state on canvas
 */
function drawGameState() {
    if (!gameState) {
        drawPlaceholder();
        return;
    }
    
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Calculate layout dimensions
    const rodSpacing = canvas.width / 4;
    const rodHeight = canvas.height * 0.6;
    const rodWidth = 8;
    const baseY = canvas.height * 0.8;
    const diskHeight = 15;
    const maxDiskWidth = rodSpacing * 0.8;
    const minDiskWidth = 30;
    
    // Draw rods and bases
    for (let i = 0; i < 3; i++) {
        const rodX = rodSpacing * (i + 1) - rodWidth / 2;
        
        // Draw rod
        ctx.fillStyle = '#8b4513';
        ctx.fillRect(rodX, baseY - rodHeight, rodWidth, rodHeight);
        
        // Draw base
        ctx.fillStyle = '#a0522d';
        ctx.fillRect(rodX - 40, baseY, rodWidth + 80, 10);
    }
    
    // Define disk colors (rainbow gradient)
    const diskColors = [
        '#e53e3e', // Red (largest)
        '#fd9801', // Orange
        '#ecc94b', // Yellow
        '#38a169', // Green
        '#3182ce', // Blue
        '#805ad5', // Purple
        '#d53f8c', // Pink
        '#2d3748'  // Dark gray (smallest)
    ];
    
    // Draw disks on each rod
    for (let rodIndex = 0; rodIndex < 3; rodIndex++) {
        const rod = gameState.rods[rodIndex];
        const rodCenterX = rodSpacing * (rodIndex + 1);
        
        // Draw each disk on this rod
        for (let diskIndex = 0; diskIndex < rod.disks.length; diskIndex++) {
            const diskSize = rod.disks[diskIndex];
            const diskY = baseY - diskHeight - (diskIndex * diskHeight);
            
            // Calculate disk width based on size
            const sizeRatio = (diskSize - 1) / (gameState.settings.numDisks - 1);
            const diskWidth = minDiskWidth + (maxDiskWidth - minDiskWidth) * sizeRatio;
            const diskX = rodCenterX - diskWidth / 2;
            
            // Choose color based on disk size
            const colorIndex = Math.min(diskSize - 1, diskColors.length - 1);
            ctx.fillStyle = diskColors[colorIndex];
            
            // Draw disk with rounded corners effect
            ctx.fillRect(diskX, diskY, diskWidth, diskHeight);
            
            // Add border for better visibility
            ctx.strokeStyle = '#2d3748';
            ctx.lineWidth = 1;
            ctx.strokeRect(diskX, diskY, diskWidth, diskHeight);
            
            // Highlight selected disk
            if (gameState.selectedDisk === diskSize && gameState.selectedRod === rodIndex) {
                ctx.strokeStyle = '#3182ce';
                ctx.lineWidth = 3;
                ctx.strokeRect(diskX - 2, diskY - 2, diskWidth + 4, diskHeight + 4);
            }
        }
    }
    
    // Draw title
    ctx.fillStyle = '#2d3748';
    ctx.font = 'bold 20px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('Towers of Hanoi', canvas.width / 2, 30);
    
    // Draw game status
    ctx.font = '14px Arial';
    ctx.fillStyle = '#718096';
    if (gameState.gameComplete) {
        ctx.fillText('🎉 Congratulations! You solved the puzzle!', canvas.width / 2, canvas.height - 10);
    } else {
        ctx.fillText(`Move ${gameState.moveCount} of ${gameState.metadata.optimalMoves} optimal moves`, canvas.width / 2, canvas.height - 10);
    }
}

/**
 * Draw placeholder content on canvas (fallback)
 */
function drawPlaceholder() {
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Set up drawing context
    ctx.fillStyle = '#e2e8f0';
    ctx.strokeStyle = '#a0aec0';
    ctx.lineWidth = 2;
    
    // Draw placeholder rods
    const rodSpacing = canvas.width / 4;
    const rodHeight = canvas.height * 0.6;
    const rodWidth = 8;
    const baseY = canvas.height * 0.8;
    
    for (let i = 0; i < 3; i++) {
        const rodX = rodSpacing * (i + 1) - rodWidth / 2;
        
        // Draw rod
        ctx.fillStyle = '#8b4513';
        ctx.fillRect(rodX, baseY - rodHeight, rodWidth, rodHeight);
        
        // Draw base
        ctx.fillStyle = '#a0522d';
        ctx.fillRect(rodX - 30, baseY, rodWidth + 60, 10);
    }
    
    // Draw placeholder disks on first rod
    const diskColors = ['#e53e3e', '#fd9801', '#ecc94b'];
    const diskWidths = [80, 60, 40];
    
    for (let i = 0; i < 3; i++) {
        const diskY = baseY - 20 - (i * 20);
        const diskX = rodSpacing - diskWidths[i] / 2;
        
        ctx.fillStyle = diskColors[i];
        ctx.fillRect(diskX, diskY, diskWidths[i], 15);
        ctx.strokeRect(diskX, diskY, diskWidths[i], 15);
    }
    
    // Draw title text
    ctx.fillStyle = '#2d3748';
    ctx.font = 'bold 24px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('Towers of Hanoi', canvas.width / 2, 40);
    
    ctx.font = '16px Arial';
    ctx.fillStyle = '#718096';
    ctx.fillText('Game engine will be implemented in upcoming tasks', canvas.width / 2, canvas.height - 20);
}

/**
 * Set up event listeners for controls and interactions
 */
function setupEventListeners() {
    // Control button event listeners
    resetBtn.addEventListener('click', handleReset);
    undoBtn.addEventListener('click', handleUndo);
    hintBtn.addEventListener('click', handleHint);
    solveBtn.addEventListener('click', handleSolve);
    pauseBtn.addEventListener('click', handlePause);
    
    // Settings event listeners
    diskCountSelect.addEventListener('change', handleDiskCountChange);
    showHintsCheckbox.addEventListener('change', handleHintsToggle);
    achievementsBtn.addEventListener('click', handleAchievements);
    
    // Note: Canvas event listeners are now handled by the InputHandler class
}

/**
 * Event handler functions (placeholder implementations)
 */
function handleReset() {
    console.log('Reset button clicked');
    
    if (!gameState) {
        showMessage('Game state not initialized', 'error');
        return;
    }
    
    // Show confirmation dialog if game is in progress
    if (gameState.moveCount > 0 && !gameState.gameComplete) {
        const confirmed = confirm('Are you sure you want to reset the game? This will lose your current progress.');
        if (!confirmed) {
            return;
        }
    }
    
    try {
        // Reset timer
        resetGameTimer();
        
        // Use input handler if available
        if (inputHandler) {
            inputHandler.handleReset();
        } else {
            gameState = GameState.resetGameState(gameState);
            updateUIFromGameState();
            showMessage('Game reset successfully!', 'success');
        }
        console.log('Game reset:', GameState.getGameStateSummary(gameState));
    } catch (error) {
        console.error('Failed to reset game:', error);
        showMessage('Failed to reset game', 'error');
    }
}

function handleUndo() {
    console.log('Undo button clicked');
    
    if (!gameState) {
        showMessage('Game state not initialized', 'error');
        return;
    }
    
    try {
        // Use input handler if available
        if (inputHandler) {
            inputHandler.handleUndo();
        } else {
            const result = GameEngine.undoLastMove(gameState);
            
            if (result.success) {
                updateUIFromGameState();
                showMessage(`Undid move: disk ${result.diskMoved} from rod ${result.fromRod} to rod ${result.toRod}`, 'success');
                console.log('Move undone:', result);
            } else {
                showMessage(result.error.message, 'error');
                console.log('Undo failed:', result.error);
            }
        }
    } catch (error) {
        console.error('Failed to undo move:', error);
        showMessage('Failed to undo move', 'error');
    }
}

function handleHint() {
    console.log('Hint button clicked');
    
    if (!gameState) {
        showMessage('Game state not initialized', 'error');
        return;
    }
    
    if (!solverEngine) {
        showMessage('Solver engine not available', 'error');
        return;
    }
    
    // Don't allow hints during animation
    if (animationSystem && animationSystem.isCurrentlyAnimating()) {
        showMessage('Please wait for the current animation to complete', 'info');
        return;
    }
    
    // Check if game is already complete
    if (gameState.gameComplete) {
        showMessage('Puzzle is already solved! No hints needed.', 'info');
        return;
    }
    
    try {
        const nextMove = solverEngine.getNextOptimalMove();
        
        if (nextMove) {
            // Clear any existing selection
            if (window.GameEngine) {
                window.GameEngine.clearSelection(gameState);
            }
            
            // Select the disk that should be moved
            if (window.GameEngine) {
                const result = window.GameEngine.selectDisk(gameState, nextMove.from);
                if (result.success) {
                    updateUIFromGameState();
                    showMessage(`💡 Hint: Move disk ${nextMove.disk} from rod ${nextMove.from + 1} to rod ${nextMove.to + 1}`, 'info');
                } else {
                    showMessage(`💡 Hint: Move disk ${nextMove.disk} from rod ${nextMove.from + 1} to rod ${nextMove.to + 1}`, 'info');
                }
            } else {
                showMessage(`💡 Hint: Move disk ${nextMove.disk} from rod ${nextMove.from + 1} to rod ${nextMove.to + 1}`, 'info');
            }
        } else {
            showMessage('No hints available - puzzle may already be solved!', 'info');
        }
        
    } catch (error) {
        console.error('Failed to get hint:', error);
        showMessage('Failed to generate hint', 'error');
    }
}

function handleSolve() {
    console.log('Solve button clicked');
    
    if (!gameState) {
        showMessage('Game state not initialized', 'error');
        return;
    }
    
    if (!solverEngine) {
        showMessage('Solver engine not available', 'error');
        return;
    }
    
    // Don't allow solve during animation
    if (animationSystem && animationSystem.isCurrentlyAnimating()) {
        showMessage('Please wait for the current animation to complete', 'info');
        return;
    }
    
    // Check if auto-solve is already running
    if (solverEngine.isAutoSolveRunning()) {
        showMessage('Auto-solve is already running', 'info');
        return;
    }
    
    // Check if game is already complete
    if (gameState.gameComplete) {
        showMessage('Puzzle is already solved!', 'info');
        return;
    }
    
    // Show confirmation dialog
    const confirmed = confirm('This will automatically solve the puzzle. Do you want to continue?');
    if (!confirmed) {
        return;
    }
    
    // Change button to show it's active
    solveBtn.textContent = 'Solving...';
    solveBtn.disabled = true;
    pauseBtn.style.display = 'inline-block';
    pauseBtn.textContent = 'Pause';
    
    // Start auto-solve
    try {
        solverEngine.startAutoSolve({
            speed: 1000, // 1 second between moves
            onStep: (move, currentStep, totalSteps) => {
                updateUIFromGameState();
                showMessage(`Auto-solve: Step ${currentStep}/${totalSteps} - Moving disk ${move.disk} from rod ${move.from + 1} to rod ${move.to + 1}`, 'info');
            },
            onComplete: () => {
                solveBtn.textContent = 'Solve';
                solveBtn.disabled = false;
                pauseBtn.style.display = 'none';
                updateUIFromGameState();
                showMessage('🎉 Auto-solve completed! Puzzle solved optimally!', 'success');
            },
            onPause: () => {
                showMessage('Auto-solve paused. You can continue playing manually or resume auto-solve.', 'info');
            },
            onResume: () => {
                showMessage('Auto-solve resumed.', 'info');
            }
        });
        
        showMessage('Auto-solve started! Watch the optimal solution unfold.', 'success');
        
    } catch (error) {
        console.error('Failed to start auto-solve:', error);
        showMessage('Failed to start auto-solve', 'error');
        
        // Reset button state
        solveBtn.textContent = 'Solve';
        solveBtn.disabled = false;
        pauseBtn.style.display = 'none';
    }
}

function handlePause() {
    console.log('Pause button clicked');
    
    if (!gameState) {
        showMessage('Game state not initialized', 'error');
        return;
    }
    
    if (!solverEngine) {
        showMessage('Solver engine not available', 'error');
        return;
    }
    
    // Toggle pause state
    if (pauseBtn.textContent === 'Pause') {
        solverEngine.pauseAutoSolve();
        pauseBtn.textContent = 'Resume';
    } else {
        solverEngine.resumeAutoSolve();
        pauseBtn.textContent = 'Pause';
    }
}

function handleDiskCountChange(event) {
    const diskCount = parseInt(event.target.value);
    console.log(`Disk count changed to: ${diskCount}`);
    
    if (!gameState) {
        showMessage('Game state not initialized', 'error');
        return;
    }
    
    // Show confirmation if game is in progress
    if (gameState.moveCount > 0 && !gameState.gameComplete) {
        const confirmed = confirm(`Changing disk count will reset the current game. Continue?`);
        if (!confirmed) {
            // Revert the selection
            diskCountSelect.value = gameState.settings.numDisks;
            return;
        }
    }
    
    try {
        // Reset timer
        resetGameTimer();
        
        // Create new game state with the selected disk count
        gameState = GameState.createGameState(diskCount);
        updateUIFromGameState();
        showMessage(`Game restarted with ${diskCount} disks!`, 'success');
        console.log('Game restarted with new disk count:', GameState.getGameStateSummary(gameState));
    } catch (error) {
        console.error('Failed to change disk count:', error);
        showMessage('Failed to change disk count', 'error');
    }
}

function handleHintsToggle(event) {
    const hintsEnabled = event.target.checked;
    console.log(`Hints toggled: ${hintsEnabled}`);
    
    if (gameState) {
        // Update game state settings
        gameState.settings.showHints = hintsEnabled;
        
        // Update renderer to reflect hint changes
        if (renderer) {
            renderer.render();
        }
    }
    
    showMessage(`Hints ${hintsEnabled ? 'enabled' : 'disabled'}`, 'info');
}

function handleAchievements() {
    console.log('Achievements button clicked');
    
    if (!celebrationSystem) {
        showMessage('Celebration system not available', 'error');
        return;
    }
    
    try {
        const earnedAchievements = celebrationSystem.getEarnedAchievements();
        
        if (earnedAchievements.length === 0) {
            showMessage('No achievements earned yet. Complete puzzles to unlock achievements!', 'info');
            return;
        }
        
        let message = '🏆 YOUR ACHIEVEMENTS 🏆\n\n';
        
        earnedAchievements.forEach(achievement => {
            const earnedDate = new Date(achievement.earnedAt).toLocaleDateString();
            message += `${achievement.icon} ${achievement.name}\n`;
            message += `${achievement.description}\n`;
            message += `Earned: ${earnedDate}\n\n`;
        });
        
        message += `Total: ${earnedAchievements.length} achievement${earnedAchievements.length !== 1 ? 's' : ''} unlocked!`;
        
        // Show achievements in an alert for now (could be enhanced with a modal)
        alert(message);
        
    } catch (error) {
        console.error('Failed to get achievements:', error);
        showMessage('Failed to load achievements', 'error');
    }
}

// Canvas event handlers are now handled by the InputHandler class

/**
 * Show message to user
 */
function showMessage(text, type = 'info') {
    gameMessage.textContent = text;
    gameMessage.className = `game-message ${type}`;
    
    // Auto-hide message after 3 seconds
    setTimeout(() => {
        gameMessage.textContent = '';
        gameMessage.className = 'game-message';
    }, 3000);
}

/**
 * Start the game timer
 */
function startGameTimer() {
    if (gameTimerInterval) {
        clearInterval(gameTimerInterval);
    }
    
    gameStartTime = Date.now();
    gameTimerInterval = setInterval(updateGameTimer, 1000);
}

/**
 * Stop the game timer
 */
function stopGameTimer() {
    if (gameTimerInterval) {
        clearInterval(gameTimerInterval);
        gameTimerInterval = null;
    }
}

/**
 * Update the game timer display
 */
function updateGameTimer() {
    if (!gameStartTime) return;
    
    const elapsed = Math.floor((Date.now() - gameStartTime) / 1000);
    const minutes = Math.floor(elapsed / 60);
    const seconds = elapsed % 60;
    
    gameTimer.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
}

/**
 * Reset the game timer
 */
function resetGameTimer() {
    stopGameTimer();
    gameTimer.textContent = '00:00';
    gameStartTime = null;
}

/**
 * Handle game completion and trigger celebration
 */
function handleGameCompletion() {
    if (!gameState || !gameState.gameComplete) return;
    
    // Stop the timer
    stopGameTimer();
    
    // Calculate game statistics
    const timeElapsed = gameStartTime ? Math.floor((Date.now() - gameStartTime) / 1000) : 0;
    const efficiency = gameState.moveCount > 0 ? 
        Math.round((gameState.metadata.optimalMoves / gameState.moveCount) * 100) : 0;
    
    const gameStats = {
        moveCount: gameState.moveCount,
        optimalMoves: gameState.metadata.optimalMoves,
        efficiency: efficiency,
        timeElapsed: timeElapsed,
        isOptimalSolution: gameState.moveCount === gameState.metadata.optimalMoves,
        diskCount: gameState.settings.numDisks
    };
    
    // Trigger celebration if celebration system is available
    if (celebrationSystem) {
        celebrationSystem.startWinCelebration(gameStats);
    } else {
        // Fallback celebration message
        const message = gameStats.isOptimalSolution ? 
            `🎉 Perfect! You solved it optimally in ${gameStats.moveCount} moves and ${formatTime(timeElapsed)}!` :
            `🎉 Congratulations! You solved it in ${gameStats.moveCount} moves (${efficiency}% efficient) and ${formatTime(timeElapsed)}!`;
        showMessage(message, 'success');
    }
    
    console.log('Game completed with stats:', gameStats);
}

/**
 * Format time in MM:SS format
 * @param {number} seconds - Time in seconds
 * @returns {string} Formatted time
 */
function formatTime(seconds) {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
}

/**
 * Update game statistics display
 */
function updateStats(moves = 0, optimal = 7, efficiency = 0) {
    moveCounter.textContent = moves;
    optimalMoves.textContent = optimal;
    efficiency.textContent = `${efficiency}%`;
    
    // Start timer on first move
    if (moves === 1 && !gameTimerInterval) {
        startGameTimer();
    }
    
    // Check for game completion and trigger celebration
    if (gameState && gameState.gameComplete) {
        handleGameCompletion();
    }
}

// Simple fallback input handling
function setupSimpleInputHandling() {
    console.log('Setting up simple input handling...');
    
    // Handle canvas clicks
    canvas.addEventListener('click', (event) => {
        if (!gameState) return;
        
        const rect = canvas.getBoundingClientRect();
        const x = event.clientX - rect.left;
        const y = event.clientY - rect.top;
        
        console.log(`Canvas clicked at (${Math.round(x)}, ${Math.round(y)})`);
        
        // Simple rod detection
        const rodSpacing = canvas.width / 4;
        const rodWidth = 100;
        let clickedRod = -1;
        
        for (let i = 0; i < 3; i++) {
            const rodCenterX = rodSpacing * (i + 1);
            if (x >= rodCenterX - rodWidth / 2 && x <= rodCenterX + rodWidth / 2) {
                clickedRod = i;
                break;
            }
        }
        
        if (clickedRod === -1) {
            // Clear selection
            if (gameState.selectedDisk !== null) {
                gameState.selectedDisk = null;
                gameState.selectedRod = null;
                updateUIFromGameState();
                showMessage('Selection cleared', 'info');
            }
            return;
        }
        
        console.log(`Clicked on rod ${clickedRod + 1}`);
        
        if (gameState.selectedDisk === null) {
            // Select disk
            const rod = gameState.rods[clickedRod];
            if (rod.disks.length === 0) {
                showMessage('No disk to select on this rod', 'error');
                return;
            }
            
            gameState.selectedDisk = rod.disks[rod.disks.length - 1];
            gameState.selectedRod = clickedRod;
            showMessage(`Selected disk ${gameState.selectedDisk} from rod ${clickedRod + 1}. Click another rod to move it.`, 'info');
            updateUIFromGameState();
        } else {
            // Try to move disk
            const fromRod = gameState.selectedRod;
            const toRod = clickedRod;
            
            if (fromRod === toRod) {
                showMessage('Cannot move disk to the same rod', 'error');
                return;
            }
            
            // Simple move validation
            const sourceRod = gameState.rods[fromRod];
            const targetRod = gameState.rods[toRod];
            const diskToMove = sourceRod.disks[sourceRod.disks.length - 1];
            
            if (targetRod.disks.length === 0 || diskToMove < targetRod.disks[targetRod.disks.length - 1]) {
                // Valid move
                const disk = sourceRod.disks.pop();
                targetRod.disks.push(disk);
                gameState.moveCount++;
                
                // Clear selection
                gameState.selectedDisk = null;
                gameState.selectedRod = null;
                
                // Check win condition
                if (gameState.rods[2].disks.length === gameState.settings.numDisks) {
                    gameState.gameComplete = true;
                    showMessage('🎉 Congratulations! You solved the puzzle!', 'success');
                } else {
                    showMessage(`Moved disk ${disk} to rod ${toRod + 1}`, 'success');
                }
                
                updateUIFromGameState();
            } else {
                showMessage('Cannot place larger disk on smaller disk', 'error');
            }
        }
    });
    
    // Handle keyboard
    document.addEventListener('keydown', (event) => {
        if (!gameState) return;
        
        console.log(`Key pressed: ${event.key}`);
        
        switch (event.key) {
            case '1':
                simulateRodClick(0);
                break;
            case '2':
                simulateRodClick(1);
                break;
            case '3':
                simulateRodClick(2);
                break;
            case 'Escape':
                gameState.selectedDisk = null;
                gameState.selectedRod = null;
                showMessage('Selection cleared', 'info');
                updateUIFromGameState();
                break;
            case 'r':
                if (event.ctrlKey) {
                    event.preventDefault();
                    handleReset();
                }
                break;
            case 'z':
                if (event.ctrlKey) {
                    event.preventDefault();
                    handleUndo();
                }
                break;
        }
    });
    
    function simulateRodClick(rodIndex) {
        const rect = canvas.getBoundingClientRect();
        const rodSpacing = canvas.width / 4;
        const x = rodSpacing * (rodIndex + 1);
        const y = canvas.height / 2;
        
        canvas.dispatchEvent(new MouseEvent('click', {
            clientX: rect.left + x,
            clientY: rect.top + y,
            bubbles: true
        }));
    }
    
    showMessage('🎮 Simple input ready! Click disks to select, then click another rod to move. Use keys 1,2,3 for rods.', 'success');
}

// Initialize the game when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    // Add a small delay to ensure all scripts are loaded
    setTimeout(() => {
        console.log('Checking available classes...');
        console.log('GameState:', typeof window.GameState);
        console.log('GameEngine:', typeof window.GameEngine);
        console.log('Renderer:', typeof window.Renderer);
        console.log('AnimationSystem:', typeof window.AnimationSystem);
        console.log('InputHandler:', typeof window.InputHandler);
        console.log('SolverEngine:', typeof window.SolverEngine);
        console.log('CelebrationSystem:', typeof window.CelebrationSystem);
        
        // Try to initialize the full game, but fall back to simple version if it fails
        try {
            initializeGame();
        } catch (error) {
            console.error('Full initialization failed, using simple version:', error);
            
            // Initialize basic game state
            if (window.GameState) {
                gameState = window.GameState.createGameState(3);
                window.gameState = gameState;
            } else {
                // Fallback game state
                gameState = {
                    rods: [
                        { disks: [3, 2, 1] },
                        { disks: [] },
                        { disks: [] }
                    ],
                    selectedDisk: null,
                    selectedRod: null,
                    moveCount: 0,
                    gameComplete: false,
                    settings: { numDisks: 3, showHints: true },
                    metadata: { optimalMoves: 7 },
                    moveHistory: []
                };
                window.gameState = gameState;
            }
            
            // Setup canvas and simple input
            setupCanvas();
            setupEventListeners();
            setupSimpleInputHandling();
            updateUIFromGameState();
        }
    }, 100);
});

// Export functions for use by other modules (when implemented)
window.TowersOfHanoi = {
    showMessage,
    updateStats,
    canvas,
    ctx
};