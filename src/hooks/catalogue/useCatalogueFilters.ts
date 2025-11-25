import { useState, useMemo, useCallback } from "react";
import type { CatalogueFilters } from "../../pages/Catalogue/types";
import { PAGE_SIZE } from "../../constants/catalogue";

/**
 * Hook pour gérer les filtres et la pagination du catalogue de robes
 */
export function useCatalogueFilters(initialFilters?: CatalogueFilters) {
  const defaultFilters: CatalogueFilters = {
    typeId: "",
    sizeId: "",
    colorId: "",
    availabilityStart: "",
    availabilityEnd: "",
    priceMax: "",
  };

  // États des filtres et pagination
  const [filters, setFilters] = useState<CatalogueFilters>(initialFilters || defaultFilters);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [limit, setLimit] = useState(PAGE_SIZE);
  const [filtersOpen, setFiltersOpen] = useState(false);

  // États de disponibilité
  const [availabilityInfo, setAvailabilityInfo] = useState<Map<string, boolean>>(new Map());

  // États d'usage des filtres (pour affichage badges)
  const [typeUsage, setTypeUsage] = useState<Set<string>>(new Set());
  const [sizeUsage, setSizeUsage] = useState<Set<string>>(new Set());
  const [colorUsage, setColorUsage] = useState<Set<string>>(new Set());

  // Calculs dérivés
  const totalPages = useMemo(
    () => Math.max(1, Math.ceil(total / Math.max(1, limit))),
    [total, limit]
  );

  const availabilitySelected = useMemo(
    () => Boolean(filters.availabilityStart && filters.availabilityEnd),
    [filters.availabilityStart, filters.availabilityEnd]
  );

  const availabilityDefaultDate = useMemo(() => {
    if (filters.availabilityStart && filters.availabilityEnd) {
      return [new Date(filters.availabilityStart), new Date(filters.availabilityEnd)] as [Date, Date];
    }
    return undefined;
  }, [filters.availabilityStart, filters.availabilityEnd]);

  const hasFiltersApplied = useMemo(() => {
    return Boolean(
      filters.typeId ||
        filters.sizeId ||
        filters.colorId ||
        filters.priceMax ||
        filters.availabilityStart ||
        filters.availabilityEnd
    );
  }, [filters]);

  // Fonctions de gestion
  const updateFilter = useCallback((field: keyof CatalogueFilters, value: string) => {
    setFilters((prev) => ({ ...prev, [field]: value }));
    setPage(1); // Reset à la page 1 quand on change un filtre
  }, []);

  const updateFilters = useCallback((newFilters: Partial<CatalogueFilters>) => {
    setFilters((prev) => ({ ...prev, ...newFilters }));
    setPage(1);
  }, []);

  const clearFilters = useCallback(() => {
    setFilters(defaultFilters);
    setPage(1);
  }, [defaultFilters]);

  const clearAvailabilityFilter = useCallback(() => {
    setFilters((prev) => ({
      ...prev,
      availabilityStart: "",
      availabilityEnd: "",
    }));
    setPage(1);
  }, []);

  const openFilters = useCallback(() => setFiltersOpen(true), []);
  const closeFilters = useCallback(() => setFiltersOpen(false), []);

  return {
    // États
    filters,
    setFilters,
    page,
    setPage,
    total,
    setTotal,
    limit,
    setLimit,
    filtersOpen,
    setFiltersOpen,
    availabilityInfo,
    setAvailabilityInfo,
    typeUsage,
    setTypeUsage,
    sizeUsage,
    setSizeUsage,
    colorUsage,
    setColorUsage,

    // Valeurs dérivées
    totalPages,
    availabilitySelected,
    availabilityDefaultDate,
    hasFiltersApplied,

    // Fonctions
    updateFilter,
    updateFilters,
    clearFilters,
    clearAvailabilityFilter,
    openFilters,
    closeFilters,
  };
}
