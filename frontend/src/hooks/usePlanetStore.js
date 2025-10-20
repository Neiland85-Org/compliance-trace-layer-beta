import { create } from "zustand";

export const usePlanetStore = create((set) => ({
  selectedPlanet: null,
  lastAction: null,

  selectPlanet: (planet) => set({ selectedPlanet: planet }),
  closeModal: () => set({ selectedPlanet: null }),

  // Nuevo: acción interactiva del ecosistema
  triggerAction: (actionType) => {
    console.log(`[ACTION] ${actionType} triggered`);
    set({ lastAction: { type: actionType, timestamp: Date.now() } });
  },
}));
