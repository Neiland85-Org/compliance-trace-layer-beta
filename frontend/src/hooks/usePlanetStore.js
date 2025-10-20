/**
Compliance Trace Layer — v0.1.0-beta

© 2025 Neil Muñoz Lago. All rights reserved.

Private research prototype for environmental blockchain visualization and

carbon-credit traceability. Developed using React Three Fiber, Framer Motion,

and Node.js backend services for compliance data integrity.

This software is proprietary and not open source.

Unauthorized reproduction, modification, or redistribution of this code,

in whole or in part, is strictly prohibited without prior written consent

from the author.

This project is not affiliated with TRAYCER, TRACYER, or any external framework.
*/
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