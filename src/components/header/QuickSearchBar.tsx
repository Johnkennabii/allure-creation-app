import { Fragment, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import Select from "../form/Select";
import Badge from "../ui/badge/Badge";
import { CustomersAPI, type Customer } from "../../api/endpoints/customers";
import { DressesAPI, type DressDetails } from "../../api/endpoints/dresses";
import { ContractsAPI, type ContractFullView } from "../../api/endpoints/contracts";
import type { QuickSearchEntity, QuickSearchNavigationPayload } from "../../types/quickSearch";

type QuickSearchFilter = "all" | QuickSearchEntity;

type QuickSearchSuggestion = {
  id: string;
  type: QuickSearchEntity;
  title: string;
  subtitle?: string;
  description?: string;
  payload?: {
    customer?: Customer;
    dress?: DressDetails;
    contract?: ContractFullView;
  };
};

const MIN_QUERY_LENGTH = 2;
const DEBOUNCE_DELAY = 300;
const MAX_RESULTS_PER_SECTION = 6;

const iconSearch = (
  <svg
    className="size-4 text-gray-400 dark:text-gray-500"
    viewBox="0 0 20 20"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M3.79175 9.37492C3.79175 5.87717 6.62711 3.04199 10.1251 3.04199C13.6231 3.04199 16.4584 5.87717 16.4584 9.37492C16.4584 12.8727 13.6231 15.7078 10.1251 15.7078C6.62711 15.7078 3.79175 12.8727 3.79175 9.37492ZM10.1251 1.54199C5.79902 1.54199 2.29175 5.04917 2.29175 9.37492C2.29175 13.7007 5.79902 17.2078 10.1251 17.2078C12.0174 17.2078 13.753 16.5369 15.107 15.4201L17.927 18.2405C18.2199 18.5334 18.6948 18.5334 18.9877 18.2405C19.2806 17.9476 19.2806 17.4727 18.9877 17.1798L16.168 14.3596C17.2865 13.0057 17.9584 11.2692 17.9584 9.37492C17.9584 5.04917 14.4511 1.54199 10.1251 1.54199Z"
      fill="currentColor"
    />
  </svg>
);

const iconSpinner = (
  <svg
    className="size-4 animate-spin text-brand-500 dark:text-brand-400"
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
  </svg>
);

const formatDateRange = (start?: string | null, end?: string | null) => {
  if (!start || !end) return undefined;
  const startDate = new Date(start);
  const endDate = new Date(end);
  if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime())) return undefined;
  const formatter = new Intl.DateTimeFormat("fr-FR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
  return `${formatter.format(startDate)} → ${formatter.format(endDate)}`;
};

const toCustomerSuggestion = (customer: Customer, queryLower: string): QuickSearchSuggestion | null => {
  const haystack = [
    customer.firstname,
    customer.lastname,
    customer.email,
    customer.phone,
  ]
    .map((value) => (value ?? "").toLowerCase());
  const matches = haystack.some((value) => value.includes(queryLower));
  if (!matches) return null;
  const title = [customer.firstname, customer.lastname].filter(Boolean).join(" ") || customer.email || "Client";
  return {
    id: customer.id,
    type: "customer",
    title,
    subtitle: customer.email ?? undefined,
    description: customer.phone ?? undefined,
    payload: { customer },
  };
};

const toDressSuggestion = (dress: DressDetails, queryLower: string): QuickSearchSuggestion | null => {
  const haystack = [dress.name, dress.reference].map((value) => (value ?? "").toLowerCase());
  const matches = haystack.some((value) => value.includes(queryLower));
  if (!matches) return null;
  return {
    id: dress.id,
    type: "dress",
    title: dress.name || "Robe",
    subtitle: dress.reference ? `Réf. ${dress.reference}` : undefined,
    description: [dress.type_name, dress.size_name].filter(Boolean).join(" • ") || undefined,
    payload: { dress },
  };
};

const toContractSuggestion = (contract: ContractFullView, queryLower: string): QuickSearchSuggestion | null => {
  const candidates = [
    contract.contract_number,
    contract.customer_firstname,
    contract.customer_lastname,
    contract.customer_email,
  ]
    .map((value) => (value ?? "").toLowerCase());
  const matches = candidates.some((value) => value.includes(queryLower));
  if (!matches) return null;
  const title = contract.contract_number || "Contrat";
  const subtitle =
    [contract.customer_firstname, contract.customer_lastname].filter(Boolean).join(" ") ||
    contract.customer_email ||
    undefined;
  const payload: QuickSearchSuggestion["payload"] = { contract };
  if (contract.customer_id) {
    payload.customer = {
      id: contract.customer_id,
      firstname: contract.customer_firstname ?? "",
      lastname: contract.customer_lastname ?? "",
      email: contract.customer_email ?? "",
      phone: contract.customer_phone ?? null,
      birthday: null,
      country: contract.customer_country ?? null,
      city: contract.customer_city ?? null,
      address: contract.customer_address ?? null,
      postal_code: contract.customer_postal_code ?? null,
      created_by: contract.created_by ?? null,
      created_at: undefined,
      updated_at: null,
      updated_by: null,
      deleted_at: null,
      deleted_by: null,
    };
  }
  return {
    id: contract.id,
    type: "contract",
    title,
    subtitle,
    description: formatDateRange(contract.start_datetime, contract.end_datetime),
    payload,
  };
};

const filterOptions = [
  { value: "all", label: "Tout" },
  { value: "customer", label: "Clients" },
  { value: "dress", label: "Robes" },
  { value: "contract", label: "Contrats" },
] as const satisfies ReadonlyArray<{ value: QuickSearchFilter; label: string }>;

interface QuickSearchBarProps {
  className?: string;
}

export default function QuickSearchBar({ className }: QuickSearchBarProps) {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<QuickSearchFilter>("all");
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [suggestions, setSuggestions] = useState<QuickSearchSuggestion[]>([]);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);

  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const navigate = useNavigate();
  const location = useLocation();

  const resolvedPlaceholder = useMemo(() => {
    if (filter === "customer") return "Rechercher un client...";
    if (filter === "dress") return "Rechercher une robe...";
    if (filter === "contract") return "Rechercher un contrat...";
    return "Rechercher client, robe ou contrat...";
  }, [filter]);

  const resetState = useCallback(() => {
    setLoading(false);
    setOpen(false);
    setSuggestions([]);
    setHighlightedIndex(-1);
  }, []);

  const handleSelectSuggestion = useCallback(
    (suggestion: QuickSearchSuggestion) => {
      if (!suggestion) return;
      const { id, type, payload } = suggestion;

      const navigationPayload: QuickSearchNavigationPayload = {
        entity: type,
        entityId: id,
        payload,
      };

      const dispatchOrNavigate = (path: string, eventName: string) => {
        if (location.pathname.startsWith(path)) {
          const detailPayload: Record<string, unknown> =
            payload && Object.keys(payload).length > 0 ? { ...payload } : {};
          detailPayload[`${type}Id`] = id;
          window.dispatchEvent(new CustomEvent(eventName, { detail: detailPayload }));
        } else {
          navigate(path, { state: { quickSearch: navigationPayload } });
        }
      };

      if (type === "customer") {
        dispatchOrNavigate("/customers", "open-customer-view");
      } else if (type === "dress") {
        dispatchOrNavigate("/catalogue", "open-dress-view");
      } else if (type === "contract") {
        dispatchOrNavigate("/catalogue", "open-contract-view");
      }

      setQuery("");
      resetState();
    },
    [location.pathname, navigate, resetState],
  );

  const fetchCustomerSuggestions = useCallback(
    async (term: string, termLower: string): Promise<QuickSearchSuggestion[]> => {
      try {
        const response = await CustomersAPI.list({ search: term, limit: MAX_RESULTS_PER_SECTION });
        const mapped = response.data
          .map((customer) => toCustomerSuggestion(customer, termLower))
          .filter((item): item is QuickSearchSuggestion => Boolean(item));
        return mapped.slice(0, MAX_RESULTS_PER_SECTION);
      } catch (error) {
        console.error("Recherche clients", error);
        return [];
      }
    },
    [],
  );

  const fetchDressSuggestions = useCallback(
    async (term: string, termLower: string): Promise<QuickSearchSuggestion[]> => {
      try {
        const response = await DressesAPI.listDetails({ page: 1, limit: MAX_RESULTS_PER_SECTION, search: term });
        const mapped = response.data
          .map((dress) => toDressSuggestion(dress, termLower))
          .filter((item): item is QuickSearchSuggestion => Boolean(item));
        return mapped.slice(0, MAX_RESULTS_PER_SECTION);
      } catch (error) {
        console.error("Recherche robes", error);
        return [];
      }
    },
    [],
  );

  const fetchContractSuggestions = useCallback(
    async (term: string, termLower: string): Promise<QuickSearchSuggestion[]> => {
      try {
        const response = await ContractsAPI.search(term, MAX_RESULTS_PER_SECTION);
        const mapped = response
          .map((contract) => toContractSuggestion(contract, termLower))
          .filter((item): item is QuickSearchSuggestion => Boolean(item));
        return mapped.slice(0, MAX_RESULTS_PER_SECTION);
      } catch (error) {
        console.error("Recherche contrats", error);
        return [];
      }
    },
    [],
  );

  useEffect(() => {
    const trimmed = query.trim();
    if (trimmed.length < MIN_QUERY_LENGTH) {
      resetState();
      return;
    }

    let cancelled = false;
    setLoading(true);

    const timeout = setTimeout(async () => {
      const lower = trimmed.toLowerCase();
      const shouldInclude = (type: QuickSearchEntity) => filter === "all" || filter === type;

      const tasks: Promise<QuickSearchSuggestion[]>[] = [];
      if (shouldInclude("customer")) tasks.push(fetchCustomerSuggestions(trimmed, lower));
      if (shouldInclude("dress")) tasks.push(fetchDressSuggestions(trimmed, lower));
      if (shouldInclude("contract")) tasks.push(fetchContractSuggestions(trimmed, lower));

      try {
        const results = await Promise.all(tasks);
        if (cancelled) return;
        const aggregated = results.flat();
        setSuggestions(aggregated);
        setOpen(aggregated.length > 0);
        setHighlightedIndex(aggregated.length ? 0 : -1);
      } catch (error) {
        if (cancelled) return;
        console.error("Recherche rapide", error);
        resetState();
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }, DEBOUNCE_DELAY);

    return () => {
      cancelled = true;
      clearTimeout(timeout);
    };
  }, [query, filter, fetchCustomerSuggestions, fetchDressSuggestions, fetchContractSuggestions, resetState]);

  useEffect(() => {
    const handleGlobalKeydown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        inputRef.current?.focus();
      }
      if (event.key === "Escape") {
        resetState();
      }
    };

    window.addEventListener("keydown", handleGlobalKeydown);
    return () => {
      window.removeEventListener("keydown", handleGlobalKeydown);
    };
  }, [resetState]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (!containerRef.current) return;
      if (!containerRef.current.contains(event.target as Node)) {
        resetState();
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [resetState]);

  const handleInputFocus = () => {
    if (suggestions.length) {
      setOpen(true);
    }
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (!suggestions.length) return;
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setHighlightedIndex((prev) => (prev + 1) % suggestions.length);
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setHighlightedIndex((prev) => (prev - 1 + suggestions.length) % suggestions.length);
    } else if (event.key === "Enter") {
      if (highlightedIndex >= 0 && highlightedIndex < suggestions.length) {
        event.preventDefault();
        handleSelectSuggestion(suggestions[highlightedIndex]);
      }
    } else if (event.key === "Escape") {
      resetState();
    }
  };

  return (
    <div ref={containerRef} className={`relative flex w-full gap-3 ${className ?? ""}`}>
      <div className="w-32 shrink-0">
        <Select
          options={filterOptions.map((option) => ({ value: option.value, label: option.label }))}
          value={filter}
          onChange={(value) => setFilter((value as QuickSearchFilter) || "all")}
          emptyOptionLabel="Tout"
          className="text-sm"
        />
      </div>
      <div className="relative flex-1">
        <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2">{iconSearch}</span>
        <input
          ref={inputRef}
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          onFocus={handleInputFocus}
          onKeyDown={handleKeyDown}
          type="text"
          placeholder={resolvedPlaceholder}
          className="h-11 w-full rounded-lg border border-gray-200 bg-transparent py-2.5 pl-11 pr-16 text-sm text-gray-800 shadow-theme-xs placeholder:text-gray-400 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-800 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30 dark:focus:border-brand-800"
        />
        <button
          type="button"
          className="absolute right-2.5 top-1/2 inline-flex -translate-y-1/2 items-center gap-0.5 rounded-lg border border-gray-200 bg-gray-50 px-[7px] py-[4.5px] text-xs -tracking-[0.2px] text-gray-500 dark:border-gray-700 dark:bg-white/[0.08] dark:text-gray-300"
          onClick={() => inputRef.current?.focus()}
          aria-label="Raccourci clavier"
        >
          <span>⌘</span>
          <span>K</span>
        </button>

        {open || loading ? (
          <div className="absolute left-0 right-0 top-full z-[100000] mt-2 overflow-hidden rounded-xl border border-gray-200 bg-white shadow-lg dark:border-gray-800 dark:bg-gray-900">
            {loading ? (
              <div className="flex items-center gap-2 px-4 py-3 text-sm text-gray-500 dark:text-gray-400">
                {iconSpinner}
                <span>Recherche en cours...</span>
              </div>
            ) : suggestions.length === 0 ? (
              <div className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">
                Aucun résultat correspondant à votre recherche.
              </div>
            ) : (
              <Fragment>
                {suggestions.map((suggestion, index) => {
                  const highlighted = index === highlightedIndex;
                  return (
                    <button
                      key={`${suggestion.type}-${suggestion.id}`}
                      type="button"
                      onMouseDown={(event) => event.preventDefault()}
                      onClick={() => handleSelectSuggestion(suggestion)}
                      className={`flex w-full items-start gap-3 px-4 py-3 text-left text-sm transition ${
                        highlighted
                          ? "bg-brand-50 text-brand-700 dark:bg-brand-500/10 dark:text-brand-100"
                          : "hover:bg-gray-50 dark:hover:bg-white/[0.06]"
                      }`}
                    >
                      <Badge variant="light" color="primary" size="sm">
                        {suggestion.type === "customer"
                          ? "Client"
                          : suggestion.type === "dress"
                          ? "Robe"
                          : "Contrat"}
                      </Badge>
                      <div className="flex-1 space-y-1">
                        <p className="font-medium text-gray-900 dark:text-white">{suggestion.title}</p>
                        {suggestion.subtitle ? (
                          <p className="text-xs text-gray-500 dark:text-gray-400">{suggestion.subtitle}</p>
                        ) : null}
                        {suggestion.description ? (
                          <p className="text-xs text-gray-400 dark:text-gray-500">{suggestion.description}</p>
                        ) : null}
                      </div>
                    </button>
                  );
                })}
              </Fragment>
            )}
          </div>
        ) : null}
      </div>
    </div>
  );
}
