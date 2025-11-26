import { memo } from "react";
import type { DressDetails } from "../../../api/endpoints/dresses";
import CardThree from "../../../components/cards/card-with-image/CardThree";
import { FALLBACK_IMAGE, NEW_BADGE_THRESHOLD_MS } from "../../../constants/catalogue";
import {
  CheckLineIcon,
  DollarLineIcon,
  PencilIcon,
  TimeIcon,
  TrashBinIcon,
} from "../../../icons";
import { IoEyeOutline } from "react-icons/io5";

// Helper Components
const IconTooltip = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <div className="group/icontooltip relative inline-flex">
    {children}
    <div className="pointer-events-none invisible absolute bottom-full left-1/2 z-30 mb-2 -translate-x-1/2 opacity-0 transition-opacity duration-150 group-hover/icontooltip:visible group-hover/icontooltip:opacity-100 group-focus-within/icontooltip:visible group-focus-within/icontooltip:opacity-100">
      <div className="relative">
        <div className="whitespace-nowrap rounded-lg bg-gray-900 px-3 py-1.5 text-xs font-medium text-white shadow-lg dark:bg-gray-100 dark:text-gray-900">
          {title}
        </div>
        <div className="absolute -bottom-1 left-1/2 h-3 w-4 -translate-x-1/2 rotate-45 bg-gray-900 dark:bg-gray-100" />
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

const iconButtonClass = (variant: "default" | "warning" | "danger" = "default") => {
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
};

const isDressNew = (createdAt?: string | null) => {
  if (!createdAt) return false;
  const createdDate = new Date(createdAt);
  if (Number.isNaN(createdDate.getTime())) return false;
  return Date.now() - createdDate.getTime() <= NEW_BADGE_THRESHOLD_MS;
};

// Utility functions
const parseNumber = (value: string): number | null => {
  if (!value) return null;
  const normalized = value.replace(/\s+/g, "").replace(",", ".");
  if (!normalized.length) return null;
  const parsed = Number(normalized);
  if (Number.isNaN(parsed)) return null;
  return parsed;
};

const formatCurrencyUtil = (value: number): string => {
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR",
  }).format(value);
};

const formatCurrency = (value?: string | number | null) => {
  if (value === undefined || value === null || value === "") return "-";
  const numeric = typeof value === "number" ? value : parseNumber(String(value));
  if (numeric === null) return String(value);
  return formatCurrencyUtil(numeric);
};

// Props interface
interface DressCardProps {
  dress: DressDetails;
  availabilityStatus?: boolean;
  availabilitySelected: boolean;
  isReservedToday?: boolean;
  canCreateContract: boolean;
  canManage: boolean;
  isAdmin: boolean;
  onView: (dress: DressDetails) => void;
  onDailyContract: (dress: DressDetails) => void;
  onPackageContract: (dress: DressDetails) => void;
  onEdit: (dress: DressDetails) => void;
  onSoftDelete: (dress: DressDetails) => void;
  onHardDelete: (dress: DressDetails) => void;
}

/**
 * Composant DressCard - Affiche une carte individuelle pour une robe
 * Memoized pour optimiser les performances lors du rendu de la grille
 */
const DressCard = memo<DressCardProps>(({
  dress,
  availabilityStatus,
  availabilitySelected,
  isReservedToday,
  canCreateContract,
  canManage,
  isAdmin,
  onView,
  onDailyContract,
  onPackageContract,
  onEdit,
  onSoftDelete,
  onHardDelete,
}) => {
  const infoItems = [
    { label: "Type", value: dress.type_name ?? "-" },
    { label: "Taille", value: dress.size_name ?? "-" },
    { label: "État", value: dress.condition_name ?? "-" },
    {
      label: "Couleur",
      value: <ColorSwatch hex={dress.hex_code} name={dress.color_name} />,
    },
    {
      label: "Prix / jour TTC",
      value: formatCurrency(dress.price_per_day_ttc),
    },
  ];

  if (availabilitySelected) {
    infoItems.push({
      label: "Disponibilité",
      value: availabilityStatus === false ? "Réservée" : "Disponible",
    });
  }

  const badges = dress.deleted_at ? (
    <div className="inline-flex items-center gap-2 rounded-full border border-amber-200 bg-gradient-to-r from-amber-50 to-orange-50 px-3 py-1.5 shadow-sm dark:border-amber-500/30 dark:from-amber-950/50 dark:to-orange-950/50">
      <svg className="h-4 w-4 text-amber-600 dark:text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
      </svg>
      <span className="text-xs font-semibold text-amber-700 dark:text-amber-300">Désactivée</span>
    </div>
  ) : null;

  const overlayBadges = (
    <div className="flex flex-wrap items-center justify-end gap-2">
      {isDressNew(dress.created_at) ? (
        <div className="group/badge animate-in fade-in slide-in-from-right-2 duration-300">
          <div className="relative overflow-hidden rounded-full backdrop-blur-md">
            {/* Glassmorphism effect */}
            <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/90 to-teal-600/90 dark:from-emerald-400/90 dark:to-teal-500/90" />
            {/* Shine effect on hover */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent translate-x-[-100%] group-hover/badge:translate-x-[100%] transition-transform duration-700" />
            {/* Content */}
            <div className="relative flex items-center gap-1.5 px-3 py-1.5">
              <svg className="h-3.5 w-3.5 text-white drop-shadow-sm" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
              <span className="text-xs font-bold text-white drop-shadow-sm">Nouveau</span>
            </div>
          </div>
        </div>
      ) : null}
      {dress.type_name ? (
        <div className="group/badge animate-in fade-in slide-in-from-right-2 duration-300 delay-75">
          <div className="relative overflow-hidden rounded-full backdrop-blur-md">
            {/* Glassmorphism effect */}
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/85 to-indigo-600/85 dark:from-blue-400/85 dark:to-indigo-500/85" />
            {/* Shine effect on hover */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent translate-x-[-100%] group-hover/badge:translate-x-[100%] transition-transform duration-700" />
            {/* Content */}
            <div className="relative flex items-center gap-1.5 px-3 py-1.5">
              <svg className="h-3.5 w-3.5 text-white drop-shadow-sm" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
              </svg>
              <span className="text-xs font-bold text-white drop-shadow-sm">{dress.type_name}</span>
            </div>
          </div>
        </div>
      ) : null}
      {isReservedToday ? (
        <div className="group/badge animate-in fade-in slide-in-from-right-2 duration-300 delay-150">
          <div className="relative overflow-hidden rounded-full backdrop-blur-md">
            {/* Glassmorphism effect */}
            <div className="absolute inset-0 bg-gradient-to-br from-rose-500/90 to-red-600/90 dark:from-rose-400/90 dark:to-red-500/90" />
            {/* Pulse animation */}
            <div className="absolute inset-0 animate-pulse bg-rose-300/30" />
            {/* Content */}
            <div className="relative flex items-center gap-1.5 px-3 py-1.5">
              <svg className="h-3.5 w-3.5 text-white drop-shadow-sm" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="text-xs font-bold text-white drop-shadow-sm">Réservée</span>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );

  const actionFooter = (
    <div className="flex flex-wrap items-center gap-2">
      <IconTooltip title="Voir la robe">
        <button
          type="button"
          onClick={() => onView(dress)}
          className={iconButtonClass()}
          aria-label="Voir la robe"
        >
          <IoEyeOutline className="size-4" />
        </button>
      </IconTooltip>
      {canCreateContract ? (
        <>
          <IconTooltip title="Location par jour">
            <button
              type="button"
              onClick={() => onDailyContract(dress)}
              className={iconButtonClass()}
              aria-label="Location par jour"
            >
              <TimeIcon className="size-4" />
            </button>
          </IconTooltip>
          <IconTooltip title="Location forfaitaire">
            <button
              type="button"
              onClick={() => onPackageContract(dress)}
              className={iconButtonClass()}
              aria-label="Location forfaitaire"
            >
              <DollarLineIcon className="size-4" />
            </button>
          </IconTooltip>
        </>
      ) : null}
      {canManage ? (
        <>
          <IconTooltip title="Modifier">
            <button
              type="button"
              onClick={() => onEdit(dress)}
              className={iconButtonClass()}
              aria-label="Modifier la robe"
            >
              <PencilIcon className="size-4" />
            </button>
          </IconTooltip>
          <IconTooltip title="Désactiver">
            <button
              type="button"
              onClick={() => onSoftDelete(dress)}
              className={iconButtonClass("warning")}
              aria-label="Désactiver"
            >
              <TrashBinIcon className="size-4" />
            </button>
          </IconTooltip>
        </>
      ) : null}
      {isAdmin ? (
        <IconTooltip title="Supprimer définitivement">
          <button
            type="button"
            onClick={() => onHardDelete(dress)}
            className={iconButtonClass("danger")}
            aria-label="Supprimer définitivement"
          >
            <TrashBinIcon className="size-4" />
          </button>
        </IconTooltip>
      ) : null}
      {isAdmin ? (
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
      ) : null}
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
      imageClassName="w-full h-80 object-cover bg-white"
    />
  );
});

DressCard.displayName = "DressCard";

export default DressCard;
