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
  }
}));
