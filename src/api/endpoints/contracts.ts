import { httpClient } from "../httpClient";

export interface ContractAddon {
  id: string;
  name: string;
  included: boolean;
  price_ht: number | string;
  price_ttc: number | string;
}

export interface ContractDress {
  id: string;
  name: string;
  reference?: string | null;
  price_ht?: string | number;
  price_ttc?: string | number;
  price_per_day_ht?: string | number;
  price_per_day_ttc?: string | number;
  images?: string[];
}

export interface ContractFullView {
  id: string;
  contract_number: string;
  customer_id: string;
  start_datetime: string;
  end_datetime: string;
  account_ht?: string;
  account_ttc?: string;
  account_paid_ht?: string;
  account_paid_ttc?: string;
  caution_ht?: string;
  caution_ttc?: string;
  caution_paid_ht?: string;
  caution_paid_ttc?: string;
  total_price_ht?: string;
  total_price_ttc?: string;
  deposit_payment_method?: string | null;
  status?: string;
  contract_type_id?: string | null;
  contract_type_id_ref?: string | null;
  contract_type_name?: string | null;
  package_id?: string | null;
  created_at?: string;
  updated_at?: string | null;
  updated_by?: string | null;
  deleted_at?: string | null;
  deleted_by?: string | null;
  addons?: ContractAddon[];
  dresses?: ContractDress[];
  sign_link?: {
    id: string;
    contract_id: string;
    customer_id: string;
    token: string;
    expires_at: string;
  } | null;
  customer_firstname?: string;
  customer_lastname?: string;
  customer_email?: string;
  customer_phone?: string;
  customer_city?: string;
  customer_country?: string;
  customer_address?: string;
  customer_postal_code?: string;
  contract_type?: {
    id: string;
    name: string;
  } | null;
  package?: {
    id: string;
    name: string;
    num_dresses?: number | null;
    price_ht?: string | number | null;
    price_ttc?: string | number | null;
  } | null;
}

export const ContractsAPI = {
  listByCustomer: async (customerId: string): Promise<ContractFullView[]> => {
    const res = await httpClient.get(`/contracts/full-view?customer_id=${customerId}`);
    if (Array.isArray(res?.data)) return res.data as ContractFullView[];
    if (Array.isArray(res)) return res as ContractFullView[];
    return [];
  },

  getById: async (contractId: string): Promise<ContractFullView> => {
    const res = await httpClient.get(`/contracts/${contractId}`);
    if (res?.data && typeof res.data === "object") return res.data as ContractFullView;
    return res as ContractFullView;
  },

  softDelete: async (contractId: string) => {
    const res = await httpClient.patch(`/contracts/${contractId}`);
    return res?.data ?? res;
  },
};
