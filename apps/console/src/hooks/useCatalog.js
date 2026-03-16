import { useEffect, useState } from "react";
import { useCatalog } from "../hooks/useCatalog";
import { fetchCatalog } from "../services/catalogService";

export function useCatalog() {
  const [catalog, setCatalog] = useState([]);

  useEffect(() => {
    fetchCatalog().then(setCatalog);
  }, []);

  return catalog;
}