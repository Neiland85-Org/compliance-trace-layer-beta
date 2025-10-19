import { useState } from 'react';

export function usePlanetStore() {
  const [selectedPlanet, setSelectedPlanet] = useState(null);

  const selectPlanet = (planetName) => {
    setSelectedPlanet(planetName);
  };

  const closeModal = () => {
    setSelectedPlanet(null);
  };

  return {
    selectedPlanet,
    selectPlanet,
    closeModal
  };
}