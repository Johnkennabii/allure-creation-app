import type { Customer } from "../../api/endpoints/customers";
import type { ContractAddon as ContractAddonOption } from "../../api/endpoints/contractAddons";
import type { ContractPackage } from "../../api/endpoints/contractPackages";

export type ContractMode = "daily" | "package";

export type DressFormState = {
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

export type QueuedImage = {
  file: File;
  preview: string;
};

export type CatalogueFilters = {
  typeId: string;
  sizeId: string;
  colorId: string;
  availabilityStart: string;
  availabilityEnd: string;
  priceMax: string;
};

export type ContractFormState = {
  contractTypeId: string | null;
  contractNumber: string;
  customer: Customer | null;
  startDate: string;
  endDate: string;
  paymentMethod: "card" | "cash";
  status: "pending";
  totalDays: number;
  totalPriceHT: string;
  totalPriceTTC: string;
  depositHT: string;
  depositTTC: string;
  depositPaidHT: string;
  depositPaidTTC: string;
  cautionHT: string;
  cautionTTC: string;
  cautionPaidHT: string;
  cautionPaidTTC: string;
  packageId: string | null;
  packageDressIds: string[];
  dressName?: string;
  dressReference?: string;
};

export type QuickCustomerFormState = {
  firstname: string;
  lastname: string;
  email: string;
  phone: string;
  city: string;
  country: string;
  address: string;
  postal_code: string;
};

export type ContractDrawerDraft = {
  mode: ContractMode;
  dressId: string | null;
  startDate: string | null;
  endDate: string | null;
};

export type SelectedPackageSummary = ContractPackage | null;

export type ContractAddonSelection = {
  selectedIds: string[];
  options: ContractAddonOption[];
};
