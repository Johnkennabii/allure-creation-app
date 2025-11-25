/**
 * Constantes pour le catalogue de robes
 */

// Pagination
export const PAGE_SIZE = 12;
export const FILTER_USAGE_PAGE_SIZE = 200;

// Images
export const MAX_IMAGES = 5;
export const FALLBACK_IMAGE = "/images/dress/defaultDress.png";

// Badges et dates
export const NEW_BADGE_THRESHOLD_MS = 3 * 24 * 60 * 60 * 1000; // 3 jours

// Contract types
export const DAILY_CONTRACT_TYPE_ID = "89f29652-c045-43ec-b4b2-ca32e913163d";

// Payment methods
export const PAYMENT_METHOD_OPTIONS = [
  { value: "card", label: "Carte bancaire" },
  { value: "cash", label: "Espèces" },
  { value: "check", label: "Chèque" },
  { value: "transfer", label: "Virement" },
  { value: "paypal", label: "PayPal" },
  { value: "other", label: "Autre" },
] as const;
