import { create } from "zustand";

export const usePlanetStore = create((set, get) => ({
  selectedPlanet: null,
  lastAction: null,

  // Stabilization state
  stabilizedZones: new Set(),
  stabilityScore: 0,
  lastStabilization: null,
  idempotentClickCount: 0,

  selectPlanet: (planet) => set({ selectedPlanet: planet }),
  closeModal: () => set({ selectedPlanet: null }),

  triggerAction: (actionType) => {
    console.log(`[ACTION] ${actionType} triggered`);
    set({ lastAction: { type: actionType, timestamp: Date.now() } });
  },

  // Stabilization actions
  stabilizeZone: (objectId, position) => set((state) => {
    const newStabilizedZones = new Set(state.stabilizedZones);
    newStabilizedZones.add(objectId);

    // Update stabilityScore based on total zones (2: satellite, astronaut)
    const newStabilityScore = Math.min((newStabilizedZones.size / 2) * 100, 100);

    return {
      stabilizedZones: newStabilizedZones,
      stabilityScore: newStabilityScore,
      lastStabilization: {
        objectId,
        timestamp: Date.now(),
        position
      }
    };
  }),

  recordIdempotentClick: (objectId) => set((state) => ({
    idempotentClickCount: state.idempotentClickCount + 1
  })),

  resetStabilization: () => set({
    stabilizedZones: new Set(),
    stabilityScore: 0,
    lastStabilization: null,
    idempotentClickCount: 0
  }),

  isZoneStabilized: (objectId) => {
    const state = get();
    return state.stabilizedZones.has(objectId);
  },

  getStabilityPercentage: () => {
    const state = get();
    return Math.min((state.stabilizedZones.size / 2) * 100, 100);
  },

  // Game state management
  gameState: 'IDLE', // 'IDLE' | 'PLAYING' | 'WIN' | 'GAME_OVER'
  astronautPosition: [5, 0, 5], // initial spawn position
  astronautVelocity: [0, 0, 0],
  gravityDirection: [0, 0, 0], // no gravity initially
  satellitePosition: [-8, 3, -6], // target position
  patternStreak: 0, // consecutive valid patterns
  failureCount: 0, // consecutive invalid patterns
  totalClicks: 0, // total clicks made
  validPatterns: 0, // total valid patterns detected
  gameStartTime: null, // timestamp when game started
  finalScore: 0, // rhythm score at game over
  blackHoleActive: false, // whether black hole is pulling astronaut

  // Helper function to normalize vector
  normalize: (vector) => {
    const length = Math.sqrt(vector[0] ** 2 + vector[1] ** 2 + vector[2] ** 2);
    if (length === 0) return [0, 0, 0];
    return [vector[0] / length, vector[1] / length, vector[2] / length];
  },

  // Initialize game state
  startGame: () => set({
    gameState: 'PLAYING',
    astronautPosition: [5, 0, 5],
    astronautVelocity: [0, 0, 0],
    gravityDirection: [0, 0, 0],
    patternStreak: 0,
    failureCount: 0,
    totalClicks: 0,
    validPatterns: 0,
    gameStartTime: Date.now(),
    blackHoleActive: false,
    finalScore: 0
  }),

  // Update astronaut physics state
  updateAstronautPosition: (position, velocity) => set((state) => {
    if (state.gameState !== 'PLAYING') return {};
    return {
      astronautPosition: [...position],
      astronautVelocity: [...velocity]
    };
  }),

  // Called when rhythm pattern is valid
  handleValidPattern: (score) => set((state) => {
    const astronautPos = state.astronautPosition;
    const satellitePos = state.satellitePosition;
    const direction = state.normalize([
      satellitePos[0] - astronautPos[0],
      satellitePos[1] - astronautPos[1],
      satellitePos[2] - astronautPos[2]
    ]);

    return {
      patternStreak: state.patternStreak + 1,
      validPatterns: state.validPatterns + 1,
      failureCount: 0,
      gravityDirection: direction,
      finalScore: Math.max(state.finalScore, score),
      blackHoleActive: false
    };
  }),

  // Called when rhythm pattern fails
  handleInvalidPattern: () => set((state) => ({
    patternStreak: 0,
    failureCount: state.failureCount + 1,
    gravityDirection: [0, 0, 0],
    blackHoleActive: state.failureCount + 1 >= 3
  })),

  // Called on every astronaut click
  handleClick: () => set((state) => {
    const newState = { totalClicks: state.totalClicks + 1 };
    if (state.gameState === 'IDLE') {
      // Auto-start game on first click
      return {
        ...newState,
        gameState: 'PLAYING',
        astronautPosition: [5, 0, 5],
        astronautVelocity: [0, 0, 0],
        gravityDirection: [0, 0, 0],
        patternStreak: 0,
        failureCount: 0,
        validPatterns: 0,
        gameStartTime: Date.now(),
        blackHoleActive: false,
        finalScore: 0
      };
    }
    return newState;
  }),

  // Called when astronaut reaches satellite
  triggerWin: () => set((state) => ({
    gameState: 'WIN'
  })),

  // Called when astronaut is captured by black hole
  triggerGameOver: (cause) => set((state) => ({
    gameState: 'GAME_OVER'
  })),

  // Reset all game state to initial values
  resetGame: () => set({
    gameState: 'IDLE',
    astronautPosition: [5, 0, 5],
    astronautVelocity: [0, 0, 0],
    gravityDirection: [0, 0, 0],
    satellitePosition: [-8, 3, -6],
    patternStreak: 0,
    failureCount: 0,
    totalClicks: 0,
    validPatterns: 0,
    gameStartTime: null,
    finalScore: 0,
    blackHoleActive: false
  })
}));
