import type { Customer } from "../api/endpoints/customers";
import type { DressDetails } from "../api/endpoints/dresses";
import type { ContractFullView } from "../api/endpoints/contracts";

export type QuickSearchEntity = "customer" | "dress" | "contract";

export type QuickSearchNavigationPayload = {
  entity: QuickSearchEntity;
  entityId: string;
  payload?: {
    customer?: Customer;
    dress?: DressDetails;
    contract?: ContractFullView;
  };
};

