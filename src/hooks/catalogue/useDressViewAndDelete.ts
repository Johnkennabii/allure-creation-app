import { useState, useCallback } from "react";
import type { DressDetails } from "../../api/endpoints/dresses";

/**
 * Hook pour gérer les états du drawer de visualisation et du modal de suppression
 */
export function useDressViewAndDelete() {
  // États du drawer de visualisation
  const [viewDrawerOpen, setViewDrawerOpen] = useState(false);
  const [viewDress, setViewDress] = useState<DressDetails | null>(null);
  const [viewLoading, setViewLoading] = useState(false);

  // États du modal de suppression
  const [deleteTarget, setDeleteTarget] = useState<{
    type: "soft" | "hard";
    dress: DressDetails | null;
  }>({ type: "soft", dress: null });
  const [deleteLoading, setDeleteLoading] = useState(false);

  // Fonctions de gestion du drawer de visualisation
  const openViewDrawer = useCallback((dress: DressDetails) => {
    setViewDress(dress);
    setViewDrawerOpen(true);
  }, []);

  const closeViewDrawer = useCallback(() => {
    setViewDrawerOpen(false);
    setViewDress(null);
    setViewLoading(false);
  }, []);

  // Fonctions de gestion du modal de suppression
  const openDeleteModal = useCallback(
    (dress: DressDetails, type: "soft" | "hard" = "soft") => {
      setDeleteTarget({ type, dress });
    },
    []
  );

  const closeDeleteModal = useCallback(() => {
    setDeleteTarget({ type: "soft", dress: null });
    setDeleteLoading(false);
  }, []);

  return {
    // États du drawer de visualisation
    viewDrawerOpen,
    setViewDrawerOpen,
    viewDress,
    setViewDress,
    viewLoading,
    setViewLoading,

    // États du modal de suppression
    deleteTarget,
    setDeleteTarget,
    deleteLoading,
    setDeleteLoading,

    // Fonctions utilitaires
    openViewDrawer,
    closeViewDrawer,
    openDeleteModal,
    closeDeleteModal,
  };
}
