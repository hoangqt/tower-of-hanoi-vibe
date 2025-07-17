# Design Document

## Overview

The Towers of Hanoi game will be implemented as a single-page web application using vanilla JavaScript, HTML5 Canvas for rendering, and CSS for styling. The application will feature a clean, intuitive interface with smooth animations and responsive design. The game logic will be separated from the presentation layer to ensure maintainability and testability.

## Architecture

### High-Level Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Presentation  │    │   Game Logic    │    │   Data Models   │
│     Layer       │◄──►│     Layer       │◄──►│     Layer       │
└─────────────────┘    └─────────────────┘    └─────────────────┘
│                      │                      │
├─ UI Components      ├─ Game Controller     ├─ Game State
├─ Canvas Renderer    ├─ Move Validator      ├─ Disk Model
├─ Event Handlers     ├─ Animation Manager   ├─ Rod Model
└─ Responsive Layout  └─ Solver Algorithm    └─ Move History
```

### Module Structure

- **GameEngine**: Core game logic and state management
- **Renderer**: Canvas-based visual rendering system
- **InputHandler**: Mouse, touch, and keyboard input processing
- **AnimationSystem**: Smooth transitions and visual effects
- **UIController**: Game controls and settings interface
- **SolverEngine**: Optimal solution algorithm and hint system

## Components and Interfaces

### GameEngine Class

```javascript
class GameEngine {
  constructor(numDisks = 3)
  
  // Core game methods
  initializeGame(numDisks)
  makeMove(fromRod, toRod)
  isValidMove(fromRod, toRod)
  isGameComplete()
  
  // State management
  getGameState()
  resetGame()
  undoLastMove()
  
  // Statistics
  getMoveCount()
  getOptimalMoveCount()
  getEfficiencyPercentage()
}
```

### Renderer Class

```javascript
class Renderer {
  constructor(canvas, gameEngine)
  
  // Rendering methods
  render()
  drawRods()
  drawDisks()
  drawUI()
  
  // Animation support
  animateMove(disk, fromRod, toRod, duration)
  highlightValidMoves(selectedDisk)
  showInvalidMoveEffect()
  
  // Responsive design
  resize(width, height)
  calculateLayout()
}
```

### InputHandler Class

```javascript
class InputHandler {
  constructor(canvas, gameEngine, renderer)
  
  // Event handling
  handleMouseClick(event)
  handleMouseMove(event)
  handleTouchStart(event)
  handleTouchEnd(event)
  handleKeyPress(event)
  
  // Coordinate conversion
  screenToGameCoordinates(x, y)
  detectClickTarget(x, y)
}
```

### SolverEngine Class

```javascript
class SolverEngine {
  constructor(numDisks)
  
  // Solution methods
  generateOptimalSolution()
  getNextOptimalMove(currentState)
  calculateMinimumMoves(numDisks)
  
  // Auto-solve functionality
  startAutoSolve(speed)
  pauseAutoSolve()
  resumeAutoSolve()
}
```

## Data Models

### Game State Model

```javascript
const GameState = {
  rods: [
    { id: 0, disks: [3, 2, 1] },  // Left rod with disks (bottom to top)
    { id: 1, disks: [] },         // Middle rod
    { id: 2, disks: [] }          // Right rod
  ],
  selectedDisk: null,
  selectedRod: null,
  moveCount: 0,
  gameComplete: false,
  moveHistory: [],
  settings: {
    numDisks: 3,
    animationSpeed: 300,
    showHints: true
  }
}
```

### Disk Model

```javascript
const Disk = {
  id: number,           // Unique identifier (1 = smallest)
  size: number,         // Relative size (1 = smallest)
  color: string,        // Visual color
  position: {           // Current position for animation
    x: number,
    y: number
  },
  rod: number          // Current rod (0, 1, or 2)
}
```

### Move Model

```javascript
const Move = {
  fromRod: number,
  toRod: number,
  diskId: number,
  timestamp: Date,
  moveNumber: number
}
```

## Error Handling

### Move Validation

- **Invalid Source**: Attempting to move from empty rod
- **Invalid Target**: Placing larger disk on smaller disk
- **No Selection**: Attempting to move without selecting a disk
- **Same Rod**: Attempting to move disk to its current rod

### Error Response Strategy

```javascript
const ErrorHandler = {
  // Visual feedback for invalid moves
  showInvalidMoveAnimation(rod, message),
  
  // User-friendly error messages
  displayErrorMessage(errorType, duration),
  
  // Graceful degradation
  handleRenderingError(),
  handleInputError()
}
```

## Testing Strategy

### Unit Testing

- **Game Logic Tests**: Move validation, win condition detection, state management
- **Algorithm Tests**: Solver correctness, optimal move calculation
- **Model Tests**: Data structure integrity, state transitions

### Integration Testing

- **UI Integration**: Input handling, visual feedback, animation coordination
- **Cross-browser Testing**: Compatibility across modern browsers
- **Device Testing**: Touch interactions, responsive layout

### Performance Testing

- **Animation Performance**: Smooth 60fps rendering
- **Memory Management**: Efficient canvas operations
- **Load Testing**: Large number of disks (up to 8)

### Test Structure

```javascript
// Example test cases
describe('GameEngine', () => {
  test('should initialize with correct starting state')
  test('should validate moves correctly')
  test('should detect win condition')
  test('should calculate optimal moves accurately')
})

describe('Renderer', () => {
  test('should render all game elements')
  test('should handle canvas resize')
  test('should animate moves smoothly')
})

describe('SolverEngine', () => {
  test('should generate correct optimal solution')
  test('should calculate minimum moves using 2^n - 1 formula')
})
```

## Visual Design Specifications

### Color Scheme

- **Background**: Soft gradient (#f0f4f8 to #e2e8f0)
- **Rods**: Dark brown (#8b4513)
- **Base Platform**: Medium brown (#a0522d)
- **Disk Colors**: Rainbow gradient (red, orange, yellow, green, blue, indigo, violet)
- **UI Elements**: Modern flat design with subtle shadows

### Layout Specifications

- **Canvas Dimensions**: Responsive, minimum 800x600px
- **Rod Height**: 60% of canvas height
- **Rod Spacing**: Equal distribution across canvas width
- **Disk Proportions**: Largest disk = 40% of rod spacing, smallest = 15%
- **Animation Duration**: 300ms for moves, 150ms for highlights

### Responsive Breakpoints

- **Desktop**: > 1024px - Full layout with all controls
- **Tablet**: 768px - 1024px - Compact controls, larger touch targets
- **Mobile**: < 768px - Vertical layout, simplified UI

## Performance Considerations

### Rendering Optimization

- **Canvas Clearing**: Only redraw changed areas when possible
- **Animation Batching**: Group multiple animations for efficiency
- **Asset Preloading**: Cache calculated positions and colors

### Memory Management

- **Object Pooling**: Reuse animation objects
- **Event Cleanup**: Remove event listeners on component destruction
- **State Optimization**: Minimize deep object copying

### Browser Compatibility

- **Target Browsers**: Chrome 80+, Firefox 75+, Safari 13+, Edge 80+
- **Fallbacks**: Graceful degradation for older browsers
- **Feature Detection**: Check for Canvas and touch support