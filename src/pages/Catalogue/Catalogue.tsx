import { useCallback, useEffect, useMemo, useState } from "react";
import { useDropzone } from "react-dropzone";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import PageMeta from "../../components/common/PageMeta";
import CardThree from "../../components/cards/card-with-image/CardThree";
import Badge from "../../components/ui/badge/Badge";
import Button from "../../components/ui/button/Button";
import { Modal } from "../../components/ui/modal";
import RightDrawer from "../../components/ui/drawer/RightDrawer";
import SpinnerOne from "../../components/ui/spinner/SpinnerOne";
import Input from "../../components/form/input/InputField";
import Label from "../../components/form/Label";
import PaginationWithIcon from "../../components/tables/DataTables/TableOne/PaginationWithIcon";
import DatePicker from "../../components/form/date-picker";
import { useNotification } from "../../context/NotificationContext";
import { useAuth } from "../../context/AuthContext";
import {
  DressesAPI,
  type DressAvailabilityResponse,
  type DressDetails,
  type DressUpdatePayload,
} from "../../api/endpoints/dresses";
import { DressTypesAPI, type DressType } from "../../api/endpoints/dressTypes";
import { DressSizesAPI, type DressSize } from "../../api/endpoints/dressSizes";
import {
  DressConditionsAPI,
  type DressCondition,
} from "../../api/endpoints/dressConditions";
import { DressColorsAPI, type DressColor } from "../../api/endpoints/dressColors";
import { compressImages } from "../../utils/imageCompression";
import {
  CheckLineIcon,
  CloseLineIcon,
  DollarLineIcon,
  EyeIcon,
  HorizontaLDots,
  PencilIcon,
  PlusIcon,
  TimeIcon,
  TrashBinIcon,
} from "../../icons";

const PAGE_SIZE = 12;
const MAX_IMAGES = 5;
const FALLBACK_IMAGE = "/images/cards/card-03.png";
const NEW_BADGE_THRESHOLD_MS = 3 * 24 * 60 * 60 * 1000; // 3 jours

type ContractMode = "daily" | "package";

type DressFormState = {
  name: string;
  reference: string;
  price_ht: string;
  price_ttc: string;
  price_per_day_ht: string;
  price_per_day_ttc: string;
  type_id: string;
  size_id: string;
  condition_id: string;
  color_id: string;
  images: string[];
};

type QueuedImage = {
  file: File;
  preview: string;
};

type CatalogueFilters = {
  typeId: string;
  sizeId: string;
  colorId: string;
  availabilityStart: string;
  availabilityEnd: string;
};

const defaultFilters: CatalogueFilters = {
  typeId: "",
  sizeId: "",
  colorId: "",
  availabilityStart: "",
  availabilityEnd: "",
};

const emptyFormState: DressFormState = {
  name: "",
  reference: "",
  price_ht: "",
  price_ttc: "",
  price_per_day_ht: "",
  price_per_day_ttc: "",
  type_id: "",
  size_id: "",
  condition_id: "",
  color_id: "",
  images: [],
};

const parseNumber = (value: string): number | null => {
  if (!value) return null;
  const normalized = value.replace(/\s+/g, "").replace(",", ".");
  if (!normalized.length) return null;
  const parsed = Number(normalized);
  if (Number.isNaN(parsed)) return null;
  return parsed;
};

const formatCurrency = (value?: string | number | null) => {
  if (value === undefined || value === null || value === "") return "-";
  const numeric = typeof value === "number" ? value : parseNumber(String(value));
  if (numeric === null) return String(value);
  return new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR" }).format(numeric);
};

const formatDateTime = (value?: string | null) => {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString("fr-FR", {
    dateStyle: "medium",
    timeStyle: "short",
  });
};

const extractStorageId = (url: string): string => {
  try {
    const parsed = new URL(url);
    return parsed.pathname.split("/").filter(Boolean).pop() ?? "";
  } catch (error) {
    const parts = url.split("/");
    return parts.pop()?.split("?")[0] ?? "";
  }
};

const buildDressFormState = (dress: DressDetails): DressFormState => ({
  name: dress.name ?? "",
  reference: dress.reference ?? "",
  price_ht: dress.price_ht !== undefined && dress.price_ht !== null ? String(dress.price_ht) : "",
  price_ttc: dress.price_ttc !== undefined && dress.price_ttc !== null ? String(dress.price_ttc) : "",
  price_per_day_ht:
    dress.price_per_day_ht !== undefined && dress.price_per_day_ht !== null
      ? String(dress.price_per_day_ht)
      : "",
  price_per_day_ttc:
    dress.price_per_day_ttc !== undefined && dress.price_per_day_ttc !== null
      ? String(dress.price_per_day_ttc)
      : "",
  type_id: dress.type_id ?? "",
  size_id: dress.size_id ?? "",
  condition_id: dress.condition_id ?? "",
  color_id: dress.color_id ?? "",
  images: Array.isArray(dress.images)
    ? dress.images.filter((img) => typeof img === "string" && img.trim().length > 0).slice(0, MAX_IMAGES)
    : [],
});

const buildUpdatePayload = (
  form: DressFormState,
  imagesOverride?: string[],
): DressUpdatePayload => {
  const priceHT = parseNumber(form.price_ht);
  const priceTTC = parseNumber(form.price_ttc);

  if (priceHT === null || priceTTC === null) {
    throw new Error("Veuillez renseigner des montants HT et TTC valides.");
  }

  const pricePerDayHT = parseNumber(form.price_per_day_ht);
  const pricePerDayTTC = parseNumber(form.price_per_day_ttc);

  const images = (imagesOverride ?? form.images)
    .filter((img) => typeof img === "string" && img.trim().length > 0)
    .slice(0, MAX_IMAGES);

  return {
    name: form.name.trim(),
    reference: form.reference.trim(),
    price_ht: priceHT,
    price_ttc: priceTTC,
    price_per_day_ht: pricePerDayHT ?? null,
    price_per_day_ttc: pricePerDayTTC ?? null,
    type_id: form.type_id,
    size_id: form.size_id,
    condition_id: form.condition_id,
    color_id: form.color_id || null,
    images,
  };
};

const toISOStringSafe = (value: string): string | null => {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
};

const isDressNew = (createdAt?: string | null) => {
  if (!createdAt) return false;
  const createdDate = new Date(createdAt);
  if (Number.isNaN(createdDate.getTime())) return false;
  return Date.now() - createdDate.getTime() <= NEW_BADGE_THRESHOLD_MS;
};

const IconTooltip = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <div className="group relative inline-flex">
    {children}
    <div className="pointer-events-none invisible absolute bottom-full left-1/2 z-30 mb-2 -translate-x-1/2 opacity-0 transition-opacity duration-150 group-hover:visible group-hover:opacity-100 group-focus-within:visible group-focus-within:opacity-100">
      <div className="relative">
        <div className="whitespace-nowrap rounded-lg bg-gray-900 px-3 py-1.5 text-xs font-medium text-white shadow-lg">
          {title}
        </div>
        <div className="absolute -bottom-1 left-1/2 h-3 w-4 -translate-x-1/2 rotate-45 bg-gray-900" />
      </div>
    </div>
  </div>
);

const ColorSwatch = ({ hex, name }: { hex?: string | null; name?: string | null }) => (
  <div className="flex items-center gap-2">
    <span
      className="inline-flex size-4 rounded-full border border-gray-200 shadow-theme-xs dark:border-white/15"
      style={{ backgroundColor: hex ?? "#d1d5db" }}
      aria-hidden="true"
    />
    <span className="text-sm text-gray-800 dark:text-gray-200">{name ?? "-"}</span>
  </div>
);

export default function Catalogue() {
  const { notify } = useNotification();
  const { hasRole } = useAuth();
  const canManage = hasRole("ADMIN", "MANAGER");
  const isAdmin = hasRole("ADMIN");

  const [filtersOpen, setFiltersOpen] = useState(false);
  const [filters, setFilters] = useState<CatalogueFilters>(defaultFilters);
  const [dresses, setDresses] = useState<DressDetails[]>([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [limit, setLimit] = useState(PAGE_SIZE);
  const [loading, setLoading] = useState(true);

  const [availabilityInfo, setAvailabilityInfo] = useState<Map<string, boolean>>(new Map());
  const [colorUsage, setColorUsage] = useState<Set<string>>(new Set());

  const [viewDrawerOpen, setViewDrawerOpen] = useState(false);
  const [viewDress, setViewDress] = useState<DressDetails | null>(null);
  const [viewLoading, setViewLoading] = useState(false);

  const [createDrawerOpen, setCreateDrawerOpen] = useState(false);
  const [createForm, setCreateForm] = useState<DressFormState>(emptyFormState);
  const [creating, setCreating] = useState(false);
  const [createImages, setCreateImages] = useState<QueuedImage[]>([]);
  const [createUploadingImages, setCreateUploadingImages] = useState(false);

  const [editDrawerOpen, setEditDrawerOpen] = useState(false);
  const [editDress, setEditDress] = useState<DressDetails | null>(null);
  const [editForm, setEditForm] = useState<DressFormState | null>(null);
  const [editLoading, setEditLoading] = useState(false);
  const [editUploadingImages, setEditUploadingImages] = useState(false);

  const [dressTypes, setDressTypes] = useState<DressType[]>([]);
  const [dressSizes, setDressSizes] = useState<DressSize[]>([]);
  const [dressConditions, setDressConditions] = useState<DressCondition[]>([]);
  const [dressColors, setDressColors] = useState<DressColor[]>([]);
  const [referencesLoading, setReferencesLoading] = useState(false);

  const [deleteTarget, setDeleteTarget] = useState<{
    type: "soft" | "hard";
    dress: DressDetails | null;
  }>({ type: "soft", dress: null });
  const [deleteLoading, setDeleteLoading] = useState(false);

  const [contractDrawer, setContractDrawer] = useState<{
    open: boolean;
    mode: ContractMode;
    dress: DressDetails | null;
  }>({ open: false, mode: "daily", dress: null });

  const totalPages = useMemo(() => Math.max(1, Math.ceil(total / Math.max(1, limit))), [total, limit]);
  const availabilitySelected = Boolean(filters.availabilityStart && filters.availabilityEnd);
  const availabilityDefaultDate = useMemo(() => {
    if (filters.availabilityStart && filters.availabilityEnd) {
      return [new Date(filters.availabilityStart), new Date(filters.availabilityEnd)] as [Date, Date];
    }
    return undefined;
  }, [filters.availabilityStart, filters.availabilityEnd]);

  const availableColorOptions = useMemo(() => {
    if (!dressColors.length) return [];
    if (!colorUsage.size) return dressColors;
    return dressColors.filter((color) => colorUsage.has(color.id));
  }, [dressColors, colorUsage]);

  const iconButtonClass = useCallback(
    (variant: "default" | "warning" | "danger" = "default") => {
      const base =
        "inline-flex size-10 items-center justify-center rounded-lg border text-sm transition focus:outline-hidden focus:ring-2 focus:ring-brand-500/40 disabled:cursor-not-allowed disabled:opacity-60";
      const theme: Record<typeof variant, string> = {
        default:
          "border-gray-200 text-gray-600 hover:bg-gray-50 hover:text-gray-900 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-white/10",
        warning:
          "border-warning-200 text-warning-600 hover:bg-warning-50 hover:text-warning-700 dark:border-warning-500/50 dark:text-warning-300 dark:hover:bg-warning-500/10",
        danger:
          "border-error-200 text-error-600 hover:bg-error-50 hover:text-error-700 dark:border-error-500/50 dark:text-error-300 dark:hover:bg-error-500/10",
      };
      return `${base} ${theme[variant]}`;
    },
    [],
  );

  const resetCreateState = useCallback(() => {
    setCreateForm(emptyFormState);
    setCreateImages((prev) => {
      prev.forEach((item) => URL.revokeObjectURL(item.preview));
      return [];
    });
    setCreateUploadingImages(false);
  }, []);

  useEffect(
    () => () => {
      resetCreateState();
    },
    [resetCreateState],
  );

  const updateDressInList = useCallback((updated: DressDetails) => {
    setDresses((prev) => prev.map((dress) => (dress.id === updated.id ? { ...dress, ...updated } : dress)));
  }, []);

  const fetchReferenceData = useCallback(async () => {
    if (referencesLoading || dressTypes.length) return;
    setReferencesLoading(true);
    try {
      const [types, sizes, conditions, colors] = await Promise.all([
        DressTypesAPI.list(),
        DressSizesAPI.list(),
        DressConditionsAPI.list(),
        DressColorsAPI.list(),
      ]);
      setDressTypes(types);
      setDressSizes(sizes);
      setDressConditions(conditions);
      setDressColors(colors);
    } catch (error) {
      console.error("Impossible de charger les données de référence :", error);
      notify(
        "error",
        "Erreur",
        "Impossible de charger les listes de types, tailles, états ou couleurs.",
      );
    } finally {
      setReferencesLoading(false);
    }
  }, [dressTypes.length, notify, referencesLoading]);

  const fetchDresses = useCallback(
    async (pageNumber: number, currentFilters: CatalogueFilters) => {
      setLoading(true);
      try {
        const offset = (pageNumber - 1) * PAGE_SIZE;
        const typeName = dressTypes.find((type) => type.id === currentFilters.typeId)?.name;
        const sizeName = dressSizes.find((size) => size.id === currentFilters.sizeId)?.name;
        const colorName = dressColors.find((color) => color.id === currentFilters.colorId)?.name;

        const listPromise = DressesAPI.list({
          limit: PAGE_SIZE,
          offset,
          type: typeName,
          size: sizeName,
          color: colorName,
        });

        const availabilityStartIso = toISOStringSafe(currentFilters.availabilityStart);
        const availabilityEndIso = toISOStringSafe(currentFilters.availabilityEnd);
        const availabilityPromise: Promise<DressAvailabilityResponse | null> = availabilityStartIso && availabilityEndIso
          ? DressesAPI.listAvailability(availabilityStartIso, availabilityEndIso)
          : Promise.resolve(null);

        const [listRes, availabilityRes] = await Promise.all([listPromise, availabilityPromise]);

        let resultingDresses = listRes.data;
        const colorIds = new Set(
          resultingDresses
            .map((dress) => dress.color_id)
            .filter((id): id is string => Boolean(id)),
        );
        setColorUsage(colorIds);

        if (availabilityRes) {
          const availabilityMap = new Map(availabilityRes.data.map((item) => [item.id, item.isAvailable]));
          setAvailabilityInfo(availabilityMap);
          resultingDresses = resultingDresses.filter((dress) => availabilityMap.get(dress.id) !== false);
        } else {
          setAvailabilityInfo(new Map());
        }

        setDresses(resultingDresses);
        setLimit(listRes.limit ?? PAGE_SIZE);
        const computedTotal = availabilityRes ? resultingDresses.length : listRes.total ?? resultingDresses.length;
        setTotal(computedTotal);
      } catch (error) {
        console.error("Impossible de charger les robes :", error);
        notify("error", "Erreur", "Le catalogue des robes n'a pas pu être chargé.");
      } finally {
        setLoading(false);
      }
    },
    [dressColors, dressSizes, dressTypes, notify],
  );

  useEffect(() => {
    fetchReferenceData();
  }, [fetchReferenceData]);

  useEffect(() => {
    fetchDresses(page, filters);
  }, [page, filters, fetchDresses]);

  const handleFilterChange = (field: keyof CatalogueFilters) => (
    event: React.ChangeEvent<HTMLSelectElement>,
  ) => {
    const value = event.target.value;
    setPage(1);
    setFilters((prev) => ({ ...prev, [field]: value }));
  };

  const handleAvailabilityRangeChange = useCallback((selectedDates: Date[]) => {
    const start = selectedDates[0]?.toISOString() ?? "";
    const end = selectedDates[1]?.toISOString() ?? "";
    setPage(1);
    setFilters((prev) => ({ ...prev, availabilityStart: start, availabilityEnd: end }));
  }, []);

  const resetAvailability = () => {
    setPage(1);
    setFilters((prev) => ({ ...prev, availabilityStart: "", availabilityEnd: "" }));
  };

  const handleOpenView = useCallback(
    async (dress: DressDetails) => {
      setViewDrawerOpen(true);
      setViewLoading(true);
      try {
        const fresh = await DressesAPI.getById(dress.id);
        setViewDress(fresh);
        updateDressInList(fresh);
      } catch (error) {
        console.error("Impossible de charger la robe :", error);
        notify("error", "Erreur", "Impossible d'afficher les détails de cette robe.");
        setViewDress(dress);
      } finally {
        setViewLoading(false);
      }
    },
    [notify, updateDressInList],
  );

  const handleCloseView = () => {
    setViewDrawerOpen(false);
    setViewDress(null);
  };

  const handleOpenCreate = () => {
    fetchReferenceData();
    resetCreateState();
    setCreateDrawerOpen(true);
  };

  const handleCloseCreate = () => {
    if (creating || createUploadingImages) return;
    setCreateDrawerOpen(false);
    resetCreateState();
  };

  const handleCreateChange = (field: keyof DressFormState, value: string) => {
    setCreateForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleCreateImagesDrop = useCallback(
    (acceptedFiles: File[]) => {
      if (!acceptedFiles.length || createUploadingImages) return;
      setCreateImages((prev) => {
        const remainingSlots = MAX_IMAGES - prev.length;
        if (remainingSlots <= 0) {
          notify("warning", "Limite atteinte", `Vous ne pouvez ajouter que ${MAX_IMAGES} images par robe.`);
          return prev;
        }
        const filesToAdd = acceptedFiles.slice(0, remainingSlots).map((file) => ({
          file,
          preview: URL.createObjectURL(file),
        }));
        if (acceptedFiles.length > remainingSlots) {
          notify(
            "info",
            "Limite atteinte",
            `${MAX_IMAGES} images maximum. Seules ${filesToAdd.length} image(s) ont été ajoutées.`,
          );
        }
        return [...prev, ...filesToAdd];
      });
    },
    [createUploadingImages, notify],
  );

  const handleRemoveCreateImage = useCallback(
    (preview: string) => {
      if (createUploadingImages) return;
      setCreateImages((prev) => {
        const target = prev.find((item) => item.preview === preview);
        if (target) {
          URL.revokeObjectURL(target.preview);
        }
        return prev.filter((item) => item.preview !== preview);
      });
    },
    [createUploadingImages],
  );

  const handleCreateSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!createForm.name.trim()) {
      notify("warning", "Validation", "Le nom de la robe est obligatoire.");
      return;
    }
    if (!createForm.reference.trim()) {
      notify("warning", "Validation", "La référence de la robe est obligatoire.");
      return;
    }
    if (!createForm.type_id || !createForm.size_id || !createForm.condition_id) {
      notify("warning", "Validation", "Merci de sélectionner le type, la taille et l'état de la robe.");
      return;
    }

    setCreating(true);
    try {
      const basePayload = buildUpdatePayload(createForm, []);
      const created = await DressesAPI.create({ ...basePayload, images: [] });
      let finalDress = created;

      if (createImages.length) {
        setCreateUploadingImages(true);
        try {
          const files = createImages.map((item) => item.file);
          const compressed = await compressImages(files, {
            maxWidth: 1600,
            maxHeight: 1600,
            quality: 0.82,
          });
          const uploaded = await DressesAPI.uploadImages(compressed);
          if (uploaded.length) {
            const imageUrls = uploaded.map((file) => file.url);
            const payloadWithImages = buildUpdatePayload({ ...createForm, images: imageUrls }, imageUrls);
            finalDress = await DressesAPI.update(created.id, payloadWithImages);
          }
        } catch (error) {
          console.error("Erreur lors de l'upload des images (création) :", error);
          notify(
            "warning",
            "Images non importées",
            "La robe a été créée, mais l'ajout des images a échoué.",
          );
        } finally {
          setCreateUploadingImages(false);
        }
      }

      await fetchDresses(1, filters);
      setPage(1);
      notify("success", "Robe créée", `${finalDress.name} a été ajoutée au catalogue.`);
      resetCreateState();
      setCreateDrawerOpen(false);
    } catch (error: any) {
      console.error("Erreur lors de la création de la robe :", error);
      notify("error", "Erreur", error?.message ?? "La création de la robe a échoué.");
    } finally {
      setCreating(false);
    }
  };

  const handleOpenEdit = useCallback(
    async (dress: DressDetails) => {
      setEditDrawerOpen(true);
      setEditLoading(true);
      try {
        await fetchReferenceData();
        const fresh = await DressesAPI.getById(dress.id);
        setEditDress(fresh);
        setEditForm(buildDressFormState(fresh));
        updateDressInList(fresh);
      } catch (error) {
        console.error("Impossible de charger la robe pour édition :", error);
        notify("error", "Erreur", "Impossible de charger la robe à modifier.");
        setEditDress(null);
        setEditForm(null);
        setEditDrawerOpen(false);
      } finally {
        setEditLoading(false);
      }
    },
    [fetchReferenceData, notify, updateDressInList],
  );

  const handleCloseEdit = () => {
    if (editLoading || editUploadingImages) return;
    setEditDrawerOpen(false);
    setEditDress(null);
    setEditForm(null);
  };

  const handleEditChange = (field: keyof DressFormState, value: string) => {
    setEditForm((prev) => (prev ? { ...prev, [field]: value } : prev));
  };

  const handleEditSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!editDress || !editForm) return;

    if (!editForm.name.trim()) {
      notify("warning", "Validation", "Le nom de la robe est obligatoire.");
      return;
    }
    if (!editForm.reference.trim()) {
      notify("warning", "Validation", "La référence de la robe est obligatoire.");
      return;
    }
    if (!editForm.type_id || !editForm.size_id || !editForm.condition_id) {
      notify(
        "warning",
        "Validation",
        "Merci de sélectionner le type, la taille et l'état de la robe.",
      );
      return;
    }

    setEditLoading(true);
    try {
      const payload = buildUpdatePayload(editForm);
      const updated = await DressesAPI.update(editDress.id, payload);
      setEditDress(updated);
      setEditForm(buildDressFormState(updated));
      updateDressInList(updated);
      notify("success", "Robe mise à jour", `${updated.name} a été mise à jour avec succès.`);
      setEditDrawerOpen(false);
    } catch (error: any) {
      console.error("Erreur lors de la mise à jour de la robe :", error);
      notify("error", "Erreur", error?.message ?? "La mise à jour de la robe a échoué.");
    } finally {
      setEditLoading(false);
    }
  };

  const handleEditImagesDrop = useCallback(
    async (acceptedFiles: File[]) => {
      if (!acceptedFiles.length || !editDress || !editForm) return;
      const remainingSlots = MAX_IMAGES - editForm.images.length;
      if (remainingSlots <= 0) {
        notify("warning", "Limite atteinte", `Vous ne pouvez ajouter que ${MAX_IMAGES} images par robe.`);
        return;
      }

      const filesToProcess = acceptedFiles.slice(0, remainingSlots);
      setEditUploadingImages(true);
      try {
        const compressed = await compressImages(filesToProcess, {
          maxWidth: 1600,
          maxHeight: 1600,
          quality: 0.82,
        });
        const uploaded = await DressesAPI.uploadImages(compressed);
        if (!uploaded.length) {
          notify("warning", "Upload", "Aucune image n'a pu être téléversée.");
          return;
        }
        const newImages = [...editForm.images, ...uploaded.map((file) => file.url)].slice(0, MAX_IMAGES);
        const payload = buildUpdatePayload({ ...editForm, images: newImages }, newImages);
        const updated = await DressesAPI.update(editDress.id, payload);
        setEditDress(updated);
        setEditForm(buildDressFormState(updated));
        updateDressInList(updated);
        notify(
          "success",
          "Images ajoutées",
          `${uploaded.length} image(s) ajouté(s) après compression optimisée.`,
        );
      } catch (error) {
        console.error("Erreur lors de l'upload des images :", error);
        notify("error", "Erreur", "L'ajout des images a échoué.");
      } finally {
        setEditUploadingImages(false);
      }
    },
    [editDress, editForm, notify, updateDressInList],
  );

  const handleRemoveEditImage = useCallback(
    async (imageUrl: string) => {
      if (!editDress) return;
      const storageId = extractStorageId(imageUrl);
      if (!storageId) {
        notify("error", "Suppression impossible", "Identifiant du fichier introuvable.");
        return;
      }
      setEditUploadingImages(true);
      try {
        const updated = await DressesAPI.deleteImage(storageId);
        setEditDress(updated);
        setEditForm(buildDressFormState(updated));
        updateDressInList(updated);
        notify("success", "Image supprimée", "L'image a été retirée de la robe.");
      } catch (error) {
        console.error("Erreur lors de la suppression de l'image :", error);
        notify("error", "Erreur", "La suppression de l'image a échoué.");
      } finally {
        setEditUploadingImages(false);
      }
    },
    [editDress, notify, updateDressInList],
  );

  const handleConfirmDelete = async () => {
    if (!deleteTarget.dress) return;
    setDeleteLoading(true);
    try {
      if (deleteTarget.type === "soft") {
        const updated = await DressesAPI.softDelete(deleteTarget.dress.id);
        updateDressInList(updated);
        notify(
          "success",
          "Robe désactivée",
          `${updated.name} a été désactivée.`,
        );
      } else {
        await DressesAPI.hardDelete(deleteTarget.dress.id);
        setDresses((prev) => prev.filter((dress) => dress.id !== deleteTarget.dress?.id));
        notify(
          "success",
          "Robe supprimée",
          `${deleteTarget.dress.name} a été supprimée définitivement.`,
        );
      }
    } catch (error) {
      console.error("Erreur lors de la suppression :", error);
      notify("error", "Erreur", "La suppression de la robe a échoué.");
    } finally {
      setDeleteLoading(false);
      setDeleteTarget({ type: "soft", dress: null });
    }
  };

  const openContractDrawer = (dress: DressDetails, mode: ContractMode) => {
    setContractDrawer({ open: true, mode, dress });
  };

  const closeContractDrawer = () => setContractDrawer({ open: false, mode: "daily", dress: null });

  const handleContractSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!contractDrawer.dress) return;
    notify(
      "info",
      "Fonctionnalité à venir",
      "Le flux de création de contrat sera branché sur ce formulaire.",
    );
    closeContractDrawer();
  };

  const handleToggleFilters = () => {
    setFiltersOpen((prev) => !prev);
  };

  const createImageDropDisabled = createUploadingImages || createImages.length >= MAX_IMAGES;
  const editImageDropDisabled = !editDrawerOpen || !editForm || editUploadingImages || editForm.images.length >= MAX_IMAGES;

  const {
    getRootProps: getCreateRootProps,
    getInputProps: getCreateInputProps,
    isDragActive: isCreateDragActive,
  } = useDropzone({
    onDrop: handleCreateImagesDrop,
    disabled: createImageDropDisabled,
    accept: {
      "image/jpeg": [],
      "image/png": [],
      "image/webp": [],
      "image/heic": [],
    },
  });

  const {
    getRootProps: getEditRootProps,
    getInputProps: getEditInputProps,
    isDragActive: isEditDragActive,
  } = useDropzone({
    onDrop: handleEditImagesDrop,
    disabled: editImageDropDisabled,
    accept: {
      "image/jpeg": [],
      "image/png": [],
      "image/webp": [],
      "image/heic": [],
    },
  });

  return (
    <div className="space-y-6">
      <PageMeta title="Catalogue" description=""/>
      <PageBreadcrumb pageTitle="Catalogue" />

      <div className="rounded-2xl border border-gray-200 bg-white px-5 py-6 shadow-theme-xs transition dark:border-white/10 dark:bg-white/[0.03] xl:px-10 xl:py-10">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-xl font-semibold text-gray-900 dark:text-white">Catalogue des robes</h1>
            <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">
              Gérez la visibilité, les visuels et les actions commerciales de votre dressing.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <IconTooltip title={filtersOpen ? "Masquer les filtres" : "Afficher les filtres"}>
              <button
                type="button"
                onClick={handleToggleFilters}
                className={iconButtonClass()}
                aria-pressed={filtersOpen}
                aria-label={filtersOpen ? "Masquer les filtres" : "Afficher les filtres"}
              >
                <HorizontaLDots className="size-4" />
              </button>
            </IconTooltip>
            <Badge variant="light" color="primary" size="sm">
              {total} robe{total > 1 ? "s" : ""}
            </Badge>
            {canManage ? (
              <Button size="sm" startIcon={<PlusIcon className="size-4" />} onClick={handleOpenCreate} variant="outline">
                Ajouter une robe
              </Button>
            ) : null}
          </div>
        </div>

        {filtersOpen ? (
          <div className="mt-8 rounded-2xl border border-gray-200 bg-white/70 p-5 dark:border-gray-800 dark:bg-white/[0.03]">
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              <div>
                <Label>Type de robe</Label>
                <select
                  value={filters.typeId}
                  onChange={handleFilterChange("typeId")}
                  className="h-11 w-full rounded-lg border border-gray-300 bg-white px-4 text-sm text-gray-800 shadow-theme-xs focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90"
                >
                  <option value="">Tous les types</option>
                  {dressTypes.map((type) => (
                    <option key={type.id} value={type.id}>
                      {type.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <Label>Taille</Label>
                <select
                  value={filters.sizeId}
                  onChange={handleFilterChange("sizeId")}
                  className="h-11 w-full rounded-lg border border-gray-300 bg-white px-4 text-sm text-gray-800 shadow-theme-xs focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90"
                >
                  <option value="">Toutes les tailles</option>
                  {dressSizes.map((size) => (
                    <option key={size.id} value={size.id}>
                      {size.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <Label>Couleur</Label>
                <select
                  value={filters.colorId}
                  onChange={handleFilterChange("colorId")}
                  className="h-11 w-full rounded-lg border border-gray-300 bg-white px-4 text-sm text-gray-800 shadow-theme-xs focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90"
                >
                  <option value="">Toutes les couleurs</option>
                  {availableColorOptions.map((color) => (
                    <option key={color.id} value={color.id}>
                      {color.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex flex-col gap-2">
                <Label>Période de disponibilité</Label>
                <DatePicker
                  key={`${filters.availabilityStart}-${filters.availabilityEnd}`}
                  id="catalogue-availability"
                  mode="range"
                  defaultDate={availabilityDefaultDate}
                  placeholder="Sélectionnez une période"
                  onChange={handleAvailabilityRangeChange}
                  options={{
                    enableTime: true,
                    time_24hr: true,
                    minuteIncrement: 15,
                    dateFormat: "d/m/Y H:i",
                  }}
                />
              </div>
            </div>
            {availabilitySelected ? (
              <div className="mt-3 flex justify-end">
                <Button size="sm" variant="outline" onClick={resetAvailability}>
                  Réinitialiser la disponibilité
                </Button>
              </div>
            ) : null}
          </div>
        ) : null}

        <div className="mt-8">
          {loading ? (
            <div className="flex justify-center py-12">
              <SpinnerOne />
            </div>
          ) : dresses.length === 0 ? (
            <div className="rounded-xl border border-dashed border-gray-300 bg-white/80 p-12 text-center text-gray-500 dark:border-gray-700 dark:bg-white/[0.02] dark:text-gray-400">
              Aucune robe disponible pour le moment. Ajoutez-en depuis l'interface de gestion.
            </div>
          ) : (
            <>
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
                {dresses.map((dress) => {
                  const availabilityStatus = availabilityInfo.get(dress.id);
                  const infoItems = [
                    { label: "Type", value: dress.type_name ?? "-" },
                    { label: "Taille", value: dress.size_name ?? "-" },
                    { label: "État", value: dress.condition_name ?? "-" },
                    {
                      label: "Couleur",
                      value: <ColorSwatch hex={dress.hex_code} name={dress.color_name} />,
                    },
                    { label: "Forfait TTC", value: formatCurrency(dress.price_ttc) },
                    {
                      label: "Location / jour TTC",
                      value: formatCurrency(dress.price_per_day_ttc),
                    },
                  ];

                  if (availabilitySelected) {
                    infoItems.push({
                      label: "Disponibilité",
                      value: availabilityStatus === false ? "Réservée" : "Disponible",
                    });
                  }

                  const badges = (
                    <div className="flex flex-wrap gap-2">
                      <Badge
                        variant="light"
                        color={dress.published_post ? "success" : "warning"}
                        size="sm"
                      >
                        {dress.published_post ? "Publié" : "À publier"}
                      </Badge>
                      {dress.deleted_at ? (
                        <Badge variant="light" color="warning" size="sm">
                          Désactivée
                        </Badge>
                      ) : (
                        <Badge variant="light" color="success" size="sm">
                          Active
                        </Badge>
                      )}
                    </div>
                  );

                  const overlayBadges = (
                    <div className="flex flex-col items-end gap-2">
                      {isDressNew(dress.created_at) ? (
                        <Badge variant="solid" color="success" size="sm">
                          Nouveau
                        </Badge>
                      ) : null}
                      {dress.type_name ? (
                        <Badge variant="solid" color="primary" size="sm">
                          {dress.type_name}
                        </Badge>
                      ) : null}
                    </div>
                  );

                  const actionFooter = (
                    <div className="flex flex-wrap items-center gap-2">
                      <IconTooltip title="Voir la robe">
                        <button
                          type="button"
                          onClick={() => handleOpenView(dress)}
                          className={iconButtonClass()}
                          aria-label="Voir la robe"
                        >
                          <EyeIcon className="size-4" />
                        </button>
                      </IconTooltip>
                      {canManage ? (
                        <>
                          <IconTooltip title="Location par jour">
                            <button
                              type="button"
                              onClick={() => openContractDrawer(dress, "daily")}
                              className={iconButtonClass()}
                              aria-label="Location par jour"
                            >
                              <TimeIcon className="size-4" />
                            </button>
                          </IconTooltip>
                          <IconTooltip title="Location forfaitaire">
                            <button
                              type="button"
                              onClick={() => openContractDrawer(dress, "package")}
                              className={iconButtonClass()}
                              aria-label="Location forfaitaire"
                            >
                              <DollarLineIcon className="size-4" />
                            </button>
                          </IconTooltip>
                          <IconTooltip title="Modifier">
                            <button
                              type="button"
                              onClick={() => handleOpenEdit(dress)}
                              className={iconButtonClass()}
                              aria-label="Modifier la robe"
                            >
                              <PencilIcon className="size-4" />
                            </button>
                          </IconTooltip>
                          <IconTooltip title="Soft delete">
                            <button
                              type="button"
                              onClick={() => setDeleteTarget({ type: "soft", dress })}
                              className={iconButtonClass("warning")}
                              aria-label="Soft delete"
                            >
                              <TrashBinIcon className="size-4" />
                            </button>
                          </IconTooltip>
                        </>
                      ) : null}
                      {isAdmin ? (
                        <IconTooltip title="Hard delete">
                          <button
                            type="button"
                            onClick={() => setDeleteTarget({ type: "hard", dress })}
                            className={iconButtonClass("danger")}
                            aria-label="Hard delete"
                          >
                            <TrashBinIcon className="size-4" />
                          </button>
                        </IconTooltip>
                      ) : null}
                      <IconTooltip title="Publier (bientôt)">
                        <button
                          type="button"
                          disabled
                          className={iconButtonClass()}
                          aria-label="Publier"
                        >
                          <CheckLineIcon className="size-4" />
                        </button>
                      </IconTooltip>
                      <IconTooltip title="Mettre indisponible (bientôt)">
                        <button
                          type="button"
                          disabled
                          className={iconButtonClass()}
                          aria-label="Mettre indisponible"
                        >
                          <CloseLineIcon className="size-4" />
                        </button>
                      </IconTooltip>
                    </div>
                  );

                  return (
                    <CardThree
                      key={dress.id}
                      title={dress.name || "Robe sans nom"}
                      subtitle={dress.reference ? `Réf. ${dress.reference}` : undefined}
                      description={
                        dress.type_description ||
                        [dress.type_name, dress.condition_name].filter(Boolean).join(" • ") ||
                        undefined
                      }
                      images={dress.images}
                      fallbackImage={FALLBACK_IMAGE}
                      infoItems={infoItems}
                      badges={badges}
                      footer={actionFooter}
                      overlayBadges={overlayBadges}
                      autoPlayCarousel
                      imageClassName="w-full h-64 object-cover"
                    />
                  );
                })}
              </div>

              {totalPages > 1 ? (
                <div className="mt-8 flex justify-center xl:justify-end">
                  <PaginationWithIcon
                    key={`${totalPages}-${page}`}
                    totalPages={totalPages}
                    initialPage={page}
                    onPageChange={setPage}
                  />
                </div>
              ) : null}
            </>
          )}
        </div>
      </div>

      <RightDrawer
        isOpen={createDrawerOpen}
        onClose={handleCloseCreate}
        title="Ajouter une robe"
        description="Créer une nouvelle référence"
        widthClassName="w-full max-w-4xl"
      >
        <form className="space-y-6" onSubmit={handleCreateSubmit}>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label>Nom</Label>
              <Input
                value={createForm.name}
                onChange={(event) => handleCreateChange("name", event.target.value)}
                required
              />
            </div>
            <div>
              <Label>Référence</Label>
              <Input
                value={createForm.reference}
                onChange={(event) => handleCreateChange("reference", event.target.value)}
                required
              />
            </div>
            <div>
              <Label>Prix HT (€)</Label>
              <Input
                type="number"
                step="0.01"
                min="0"
                value={createForm.price_ht}
                onChange={(event) => handleCreateChange("price_ht", event.target.value)}
                required
              />
            </div>
            <div>
              <Label>Prix TTC (€)</Label>
              <Input
                type="number"
                step="0.01"
                min="0"
                value={createForm.price_ttc}
                onChange={(event) => handleCreateChange("price_ttc", event.target.value)}
                required
              />
            </div>
            <div>
              <Label>Location / jour HT (€)</Label>
              <Input
                type="number"
                step="0.01"
                min="0"
                value={createForm.price_per_day_ht}
                onChange={(event) => handleCreateChange("price_per_day_ht", event.target.value)}
              />
            </div>
            <div>
              <Label>Location / jour TTC (€)</Label>
              <Input
                type="number"
                step="0.01"
                min="0"
                value={createForm.price_per_day_ttc}
                onChange={(event) => handleCreateChange("price_per_day_ttc", event.target.value)}
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label>Type</Label>
              <select
                value={createForm.type_id}
                onChange={(event) => handleCreateChange("type_id", event.target.value)}
                className="h-11 w-full rounded-lg border border-gray-300 bg-white px-4 text-sm text-gray-800 shadow-theme-xs focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90"
                required
              >
                <option value="">Sélectionner</option>
                {dressTypes.map((type) => (
                  <option key={type.id} value={type.id}>
                    {type.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <Label>Taille</Label>
              <select
                value={createForm.size_id}
                onChange={(event) => handleCreateChange("size_id", event.target.value)}
                className="h-11 w-full rounded-lg border border-gray-300 bg-white px-4 text-sm text-gray-800 shadow-theme-xs focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90"
                required
              >
                <option value="">Sélectionner</option>
                {dressSizes.map((size) => (
                  <option key={size.id} value={size.id}>
                    {size.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <Label>État</Label>
              <select
                value={createForm.condition_id}
                onChange={(event) => handleCreateChange("condition_id", event.target.value)}
                className="h-11 w-full rounded-lg border border-gray-300 bg-white px-4 text-sm text-gray-800 shadow-theme-xs focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90"
                required
              >
                <option value="">Sélectionner</option>
                {dressConditions.map((condition) => (
                  <option key={condition.id} value={condition.id}>
                    {condition.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <Label>Couleur</Label>
              <select
                value={createForm.color_id}
                onChange={(event) => handleCreateChange("color_id", event.target.value)}
                className="h-11 w-full rounded-lg border border-gray-300 bg-white px-4 text-sm text-gray-800 shadow-theme-xs focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90"
              >
                <option value="">Aucune</option>
                {dressColors.map((color) => (
                  <option key={color.id} value={color.id}>
                    {color.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label>
                Images ({createImages.length}/{MAX_IMAGES})
              </Label>
              {(createUploadingImages || creating) && (
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  Téléversement en cours...
                </span>
              )}
            </div>

            {createImages.length ? (
              <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3">
                {createImages.map((item) => (
                  <div key={item.preview} className="relative overflow-hidden rounded-lg border border-gray-200 dark:border-gray-700">
                    <img src={item.preview} alt="Prévisualisation" className="h-40 w-full object-cover" loading="lazy" />
                    <button
                      type="button"
                      onClick={() => handleRemoveCreateImage(item.preview)}
                      disabled={createUploadingImages || creating}
                      className="absolute right-2 top-2 inline-flex size-8 items-center justify-center rounded-full bg-white/90 text-gray-600 shadow-theme-xs transition hover:bg-error-50 hover:text-error-600 dark:bg-gray-900/90 dark:text-gray-300"
                    >
                      <TrashBinIcon className="size-4" />
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="rounded-lg border border-dashed border-gray-300 bg-gray-50 p-4 text-sm text-gray-500 dark:border-gray-700 dark:bg-white/[0.02] dark:text-gray-400">
                Aucune image sélectionnée pour l'instant. Elles seront importées après la création.
              </div>
            )}

            <div
              {...getCreateRootProps()}
              className={`rounded-xl border border-dashed px-6 py-8 text-center transition ${
                isCreateDragActive
                  ? "border-brand-500 bg-brand-50/60 dark:border-brand-500/60 dark:bg-brand-500/10"
                  : "border-gray-300 bg-gray-50 dark:border-gray-700 dark:bg-white/[0.02]"
              } ${createImageDropDisabled ? "cursor-not-allowed opacity-60" : "cursor-pointer hover:border-brand-500"}`}
            >
              <input {...getCreateInputProps()} />
              <p className="text-sm text-gray-600 dark:text-gray-300">
                Glissez-déposez vos images ou cliquez pour sélectionner des fichiers.
              </p>
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                Formats acceptés : JPG, PNG, WebP, HEIC. Téléversement après validation du formulaire.
              </p>
            </div>
          </div>

          <div className="flex justify-end gap-3 border-t border-gray-200 pt-4 dark:border-gray-800">
            <Button
              type="button"
              variant="outline"
              onClick={handleCloseCreate}
              disabled={creating || createUploadingImages}
            >
              Annuler
            </Button>
            <Button type="submit" disabled={creating || createUploadingImages}>
              {creating ? "Création..." : "Créer"}
            </Button>
          </div>
        </form>
      </RightDrawer>

      <RightDrawer
        isOpen={viewDrawerOpen}
        onClose={handleCloseView}
        title={viewDress?.name ?? "Robe"}
        description={viewDress?.reference ? `Réf. ${viewDress.reference}` : undefined}
        widthClassName="w-full max-w-3xl"
      >
        {viewLoading || !viewDress ? (
          <div className="flex justify-center py-12">
            <SpinnerOne />
          </div>
        ) : (
          <div className="space-y-8">
            <CardThree
              title={viewDress.name}
              subtitle={viewDress.reference ? `Réf. ${viewDress.reference}` : undefined}
              description={
                viewDress.type_description ||
                [viewDress.type_name, viewDress.condition_name].filter(Boolean).join(" • ") ||
                undefined
              }
              images={viewDress.images}
              fallbackImage={FALLBACK_IMAGE}
              infoItems={[
                { label: "Type", value: viewDress.type_name ?? "-" },
                { label: "Taille", value: viewDress.size_name ?? "-" },
                { label: "État", value: viewDress.condition_name ?? "-" },
                {
                  label: "Couleur",
                  value: <ColorSwatch hex={viewDress.hex_code} name={viewDress.color_name} />,
                },
                { label: "Prix HT", value: formatCurrency(viewDress.price_ht) },
                { label: "Prix TTC", value: formatCurrency(viewDress.price_ttc) },
                {
                  label: "Location / jour HT",
                  value: formatCurrency(viewDress.price_per_day_ht),
                },
                {
                  label: "Location / jour TTC",
                  value: formatCurrency(viewDress.price_per_day_ttc),
                },
              ]}
              badges={
                <div className="flex flex-wrap gap-2">
                  <Badge
                    variant="light"
                    color={viewDress.published_post ? "success" : "warning"}
                    size="sm"
                  >
                    {viewDress.published_post ? "Publié" : "À publier"}
                  </Badge>
                  {viewDress.deleted_at ? (
                    <Badge variant="light" color="warning" size="sm">
                      Désactivée
                    </Badge>
                  ) : (
                    <Badge variant="light" color="success" size="sm">
                      Active
                    </Badge>
                  )}
                </div>
              }
              overlayBadges={
                <div className="flex flex-col items-end gap-2">
                  {isDressNew(viewDress.created_at) ? (
                    <Badge variant="solid" color="success" size="sm">
                      Nouveau
                    </Badge>
                  ) : null}
                  {viewDress.type_name ? (
                    <Badge variant="solid" color="primary" size="sm">
                      {viewDress.type_name}
                    </Badge>
                  ) : null}
                </div>
              }
              footer={null}
              autoPlayCarousel
              imageClassName="w-full h-72 object-cover"
            />

            <div className="grid gap-6 rounded-xl border border-gray-200 bg-white/60 p-6 dark:border-gray-800 dark:bg-white/[0.02] sm:grid-cols-2">
              <div>
                <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-200">Métadonnées</h3>
                <dl className="mt-3 space-y-2 text-sm text-gray-600 dark:text-gray-300">
                  <div>
                    <dt className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">
                      Créée le
                    </dt>
                    <dd>{formatDateTime(viewDress.created_at)}</dd>
                  </div>
                  <div>
                    <dt className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">
                      Mise à jour le
                    </dt>
                    <dd>{formatDateTime(viewDress.updated_at)}</dd>
                  </div>
                </dl>
              </div>
              <div>
                <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-200">Publication</h3>
                <dl className="mt-3 space-y-2 text-sm text-gray-600 dark:text-gray-300">
                  <div>
                    <dt className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">
                      Publiée le
                    </dt>
                    <dd>{formatDateTime(viewDress.published_at)}</dd>
                  </div>
                  <div>
                    <dt className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">
                      Statut
                    </dt>
                    <dd>{viewDress.published_post ? "En ligne" : "Hors ligne"}</dd>
                  </div>
                </dl>
              </div>
            </div>
          </div>
        )}
      </RightDrawer>

      <RightDrawer
        isOpen={editDrawerOpen}
        onClose={handleCloseEdit}
        title="Modifier la robe"
        description={editDress?.name}
        widthClassName="w-full max-w-4xl"
      >
        {editLoading || !editForm ? (
          <div className="flex justify-center py-12">
            <SpinnerOne />
          </div>
        ) : (
          <form className="space-y-6" onSubmit={handleEditSubmit}>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label>Nom</Label>
                <Input
                  value={editForm.name}
                  onChange={(event) => handleEditChange("name", event.target.value)}
                  required
                />
              </div>
              <div>
                <Label>Référence</Label>
                <Input
                  value={editForm.reference}
                  onChange={(event) => handleEditChange("reference", event.target.value)}
                  required
                />
              </div>
              <div>
                <Label>Prix HT (€)</Label>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  value={editForm.price_ht}
                  onChange={(event) => handleEditChange("price_ht", event.target.value)}
                  required
                />
              </div>
              <div>
                <Label>Prix TTC (€)</Label>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  value={editForm.price_ttc}
                  onChange={(event) => handleEditChange("price_ttc", event.target.value)}
                  required
                />
              </div>
              <div>
                <Label>Location / jour HT (€)</Label>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  value={editForm.price_per_day_ht}
                  onChange={(event) => handleEditChange("price_per_day_ht", event.target.value)}
                />
              </div>
              <div>
                <Label>Location / jour TTC (€)</Label>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  value={editForm.price_per_day_ttc}
                  onChange={(event) => handleEditChange("price_per_day_ttc", event.target.value)}
                />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label>Type</Label>
                <select
                  value={editForm.type_id}
                  onChange={(event) => handleEditChange("type_id", event.target.value)}
                  className="h-11 w-full rounded-lg border border-gray-300 bg-white px-4 text-sm text-gray-800 shadow-theme-xs focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90"
                  required
                >
                  <option value="">Sélectionner</option>
                  {dressTypes.map((type) => (
                    <option key={type.id} value={type.id}>
                      {type.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <Label>Taille</Label>
                <select
                  value={editForm.size_id}
                  onChange={(event) => handleEditChange("size_id", event.target.value)}
                  className="h-11 w-full rounded-lg border border-gray-300 bg-white px-4 text-sm text-gray-800 shadow-theme-xs focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90"
                  required
                >
                  <option value="">Sélectionner</option>
                  {dressSizes.map((size) => (
                    <option key={size.id} value={size.id}>
                      {size.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <Label>État</Label>
                <select
                  value={editForm.condition_id}
                  onChange={(event) => handleEditChange("condition_id", event.target.value)}
                  className="h-11 w-full rounded-lg border border-gray-300 bg-white px-4 text-sm text-gray-800 shadow-theme-xs focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90"
                  required
                >
                  <option value="">Sélectionner</option>
                  {dressConditions.map((condition) => (
                    <option key={condition.id} value={condition.id}>
                      {condition.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <Label>Couleur</Label>
                <select
                  value={editForm.color_id}
                  onChange={(event) => handleEditChange("color_id", event.target.value)}
                  className="h-11 w-full rounded-lg border border-gray-300 bg-white px-4 text-sm text-gray-800 shadow-theme-xs focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90"
                >
                  <option value="">Aucune</option>
                  {dressColors.map((color) => (
                    <option key={color.id} value={color.id}>
                      {color.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label>
                  Images ({editForm.images.length}/{MAX_IMAGES})
                </Label>
                {editUploadingImages ? (
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    Téléversement en cours...
                  </span>
                ) : null}
              </div>

              {editForm.images.length ? (
                <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3">
                  {editForm.images.map((image) => (
                    <div key={image} className="relative overflow-hidden rounded-lg border border-gray-200 dark:border-gray-700">
                      <img src={image} alt="Robe" className="h-40 w-full object-cover" loading="lazy" />
                      <button
                        type="button"
                        onClick={() => handleRemoveEditImage(image)}
                        disabled={editUploadingImages}
                        className="absolute right-2 top-2 inline-flex size-8 items-center justify-center rounded-full bg-white/90 text-gray-600 shadow-theme-xs transition hover:bg-error-50 hover:text-error-600 dark:bg-gray-900/90 dark:text-gray-300"
                      >
                        <TrashBinIcon className="size-4" />
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="rounded-lg border border-dashed border-gray-300 bg-gray-50 p-4 text-sm text-gray-500 dark:border-gray-700 dark:bg-white/[0.02] dark:text-gray-400">
                  Aucune image pour l'instant. Ajoutez-en pour valoriser la robe.
                </div>
              )}

              <div
                {...getEditRootProps()}
                className={`rounded-xl border border-dashed px-6 py-8 text-center transition ${
                  isEditDragActive
                    ? "border-brand-500 bg-brand-50/60 dark:border-brand-500/60 dark:bg-brand-500/10"
                    : "border-gray-300 bg-gray-50 dark:border-gray-700 dark:bg-white/[0.02]"
                } ${editImageDropDisabled ? "cursor-not-allowed opacity-60" : "cursor-pointer hover:border-brand-500"}`}
              >
                <input {...getEditInputProps()} />
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  Glissez-déposez vos images ou cliquez pour sélectionner des fichiers.
                </p>
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  Formats acceptés : JPG, PNG, WebP, HEIC. Compression automatique pour optimiser le stockage S3.
                </p>
              </div>
            </div>

            <div className="flex justify-end gap-3 border-t border-gray-200 pt-4 dark:border-gray-800">
              <Button
                type="button"
                variant="outline"
                onClick={handleCloseEdit}
                disabled={editLoading || editUploadingImages}
              >
                Annuler
              </Button>
              <Button type="submit" disabled={editLoading || editUploadingImages}>
                {editLoading ? "Enregistrement..." : "Enregistrer"}
              </Button>
            </div>
          </form>
        )}
      </RightDrawer>

      <RightDrawer
        isOpen={contractDrawer.open}
        onClose={closeContractDrawer}
        title={
          contractDrawer.mode === "daily"
            ? "Location - facturation journalière"
            : "Location - forfait"
        }
        description={contractDrawer.dress?.name}
        widthClassName="w-full max-w-lg"
      >
        {contractDrawer.dress ? (
          <form className="space-y-6" onSubmit={handleContractSubmit}>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-300">
                Ce drawer servira à lancer la génération d'un contrat à partir de la robe sélectionnée.
                Branchez ici votre logique métier (sélection du client, dates, forfaits, etc.).
              </p>
            </div>
            <div>
              <Label>Note interne</Label>
              <textarea
                className="min-h-24 w-full rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm text-gray-800 shadow-theme-xs focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90"
                placeholder="Indiquez les informations nécessaires pour la création du contrat."
              />
            </div>
            <div className="flex justify-end gap-3">
              <Button type="button" variant="outline" onClick={closeContractDrawer}>
                Fermer
              </Button>
              <Button type="submit">Continuer</Button>
            </div>
          </form>
        ) : (
          <div className="flex justify-center py-12">
            <SpinnerOne />
          </div>
        )}
      </RightDrawer>

      <Modal
        isOpen={Boolean(deleteTarget.dress)}
        onClose={() => (deleteLoading ? undefined : setDeleteTarget({ type: "soft", dress: null }))}
        className="max-w-md w-full p-6"
      >
        <div className="space-y-6">
          <div>
            <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
              {deleteTarget.type === "soft" ? "Désactiver la robe" : "Supprimer la robe"}
            </h3>
            <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">
              {deleteTarget.type === "soft"
                ? "La robe sera retirée temporairement du catalogue. Vous pourrez la réactiver plus tard."
                : "Cette action est définitive. La robe et ses données associées seront supprimées."}
            </p>
          </div>
          <div className="rounded-lg border border-yellow-200 bg-yellow-50 px-4 py-3 text-sm text-yellow-700 dark:border-yellow-500/40 dark:bg-yellow-500/10 dark:text-yellow-200">
            <strong>{deleteTarget.dress?.name}</strong>
            {deleteTarget.dress?.reference ? ` • Réf. ${deleteTarget.dress.reference}` : ""}
          </div>
          <div className="flex justify-end gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => setDeleteTarget({ type: "soft", dress: null })}
              disabled={deleteLoading}
            >
              Annuler
            </Button>
            <Button
              type="button"
              className={
                deleteTarget.type === "soft"
                  ? "bg-warning-600 hover:bg-warning-700"
                  : "bg-error-600 hover:bg-error-700"
              }
              onClick={handleConfirmDelete}
              disabled={deleteLoading}
            >
              {deleteLoading ? "Traitement..." : deleteTarget.type === "soft" ? "Désactiver" : "Supprimer"}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
