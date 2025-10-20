import { create } from 'zustand';

export const usePlanetStore = create((set) => ({
  selectedPlanet: null,
  selectPlanet: (planet) => set({ selectedPlanet: planet }),
  closeModal: () => set({ selectedPlanet: null }),
}));