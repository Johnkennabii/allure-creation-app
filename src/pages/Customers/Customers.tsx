import type React from "react";
import { useCallback, useEffect, useMemo, useState } from "react";
import PageMeta from "../../components/common/PageMeta";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import SpinnerOne from "../../components/ui/spinner/SpinnerOne";
import { Table, TableBody, TableCell, TableHeader, TableRow } from "../../components/ui/table";
import Input from "../../components/form/input/InputField";
import Button from "../../components/ui/button/Button";
import Badge from "../../components/ui/badge/Badge";
import { Modal } from "../../components/ui/modal";
import PaginationWithIcon from "../../components/tables/DataTables/TableOne/PaginationWithIcon";
import RightDrawer from "../../components/ui/drawer/RightDrawer";
import { useNotification } from "../../context/NotificationContext";
import { useAuth } from "../../context/AuthContext";
import { CustomersAPI, type Customer, type CustomerListResponse } from "../../api/endpoints/customers";
import { ContractsAPI, type ContractFullView } from "../../api/endpoints/contracts";
import { PencilIcon, CloseLineIcon, TrashBinIcon, EyeIcon } from "../../icons";
import DatePicker from "../../components/form/date-picker";

interface CustomerRow extends Customer {
  fullName: string;
  createdLabel: string;
}

type CustomerFormState = {
  firstname: string;
  lastname: string;
  email: string;
  phone: string;
  birthday: string;
  country: string;
  city: string;
  address: string;
  postal_code: string;
};

type ConfirmState = {
  mode: "soft" | "hard";
  customer: CustomerRow | null;
};

const defaultFormState: CustomerFormState = {
  firstname: "",
  lastname: "",
  email: "",
  phone: "",
  birthday: "",
  country: "",
  city: "",
  address: "",
  postal_code: "",
};

const TooltipWrapper = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <div className="relative inline-block group">
    {children}
    <div className="invisible absolute bottom-full left-1/2 z-30 mb-2 -translate-x-1/2 opacity-0 transition-opacity duration-150 group-hover:visible group-hover:opacity-100">
      <div className="relative">
        <div className="whitespace-nowrap rounded-lg bg-gray-900 px-3 py-1.5 text-xs font-medium text-white shadow-lg">
          {title}
        </div>
        <div className="absolute -bottom-1 left-1/2 h-3 w-4 -translate-x-1/2 rotate-45 bg-gray-900" />
      </div>
    </div>
  </div>
);

const InfoCard = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <div>
    <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
      {label}
    </p>
    <div className="mt-1 text-sm text-gray-800 dark:text-gray-200">{children}</div>
  </div>
);

const formatCurrency = (value?: string | number | null) => {
  if (value === undefined || value === null || value === "") return "-";
  const numeric = typeof value === "number" ? value : Number(value);
  if (Number.isNaN(numeric)) return String(value);
  return new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR" }).format(numeric);
};

const statusConfig: Record<
  string,
  {
    color: "success" | "warning" | "error" | "info" | "primary" | "dark" | "light";
    label: string;
  }
> = {
  pending: { color: "warning", label: "En attente" },
  confirmed: { color: "success", label: "Confirmé" },
  cancelled: { color: "error", label: "Annulé" },
  completed: { color: "info", label: "Terminé" },
  disabled: { color: "warning", label: "Désactivé" },
};

const ContractCard = ({
  contract,
  onGenerate,
  onEdit,
  onSoftDelete,
  onSignature,
  canManage,
  canSoftDelete,
  softDeletingId,
}: {
  contract: ContractFullView;
  onGenerate: (contract: ContractFullView) => void;
  onEdit: (contract: ContractFullView) => void;
  onSoftDelete: (contract: ContractFullView) => void;
  onSignature: (contract: ContractFullView) => void;
  canManage: boolean;
  canSoftDelete: boolean;
  softDeletingId: string | null;
}) => {
  const config = statusConfig[(contract.status || "").toLowerCase()] ?? {
    color: "info" as const,
    label: contract.status ?? "N/A",
  };

  return (
    <div className="space-y-6 rounded-2xl bg-white/80 p-6 shadow-theme-xs ring-1 ring-gray-200/70 backdrop-blur dark:bg-white/[0.05] dark:ring-white/10">
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div className="space-y-1">
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
            Contrat
          </p>
          <p className="text-lg font-semibold text-gray-900 dark:text-white">
            {contract.contract_number || "-"}
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            {formatDateTime(contract.start_datetime)} → {formatDateTime(contract.end_datetime)}
          </p>
        </div>
        <Badge variant="light" color={config.color} size="sm">
          {config.label}
        </Badge>
      </div>

      <div className="grid gap-x-8 gap-y-5 md:grid-cols-2 lg:grid-cols-3">
        <InfoCard label="Montant total TTC">{formatCurrency(contract.total_price_ttc)}</InfoCard>
        <InfoCard label="Acompte TTC">{formatCurrency(contract.account_ttc)}</InfoCard>
        <InfoCard label="Acompte payé TTC">{formatCurrency(contract.account_paid_ttc)}</InfoCard>
        <InfoCard label="Caution TTC">{formatCurrency(contract.caution_ttc)}</InfoCard>
        <InfoCard label="Caution payée TTC">{formatCurrency(contract.caution_paid_ttc)}</InfoCard>
        <InfoCard label="Méthode de paiement">{contract.deposit_payment_method || "-"}</InfoCard>
        <InfoCard label="Type de contrat">{contract.contract_type_name || "-"}</InfoCard>
        <InfoCard label="Forfait associé">
          {contract.package?.name
            ? `${contract.package.name} ${contract.package.price_ttc ? `(${formatCurrency(contract.package.price_ttc)})` : ""}`
            : "Aucun"}
        </InfoCard>
        <InfoCard label="Statut interne">{config.label}</InfoCard>
        <InfoCard label="Lien de signature">
          {contract.sign_link?.token ? (
            <span className="break-all text-xs text-gray-600 dark:text-gray-300">
              {contract.sign_link.token}
              {contract.sign_link.expires_at ? ` (exp. ${formatDateTime(contract.sign_link.expires_at)})` : ""}
            </span>
          ) : (
            "-"
          )}
        </InfoCard>
      </div>

      {contract.dresses && contract.dresses.length > 0 && (
        <div className="space-y-3">
          <h5 className="text-sm font-semibold text-gray-800 dark:text-white/90">Robes incluses</h5>
          <ul className="grid gap-3 text-sm text-gray-700 dark:text-gray-200 md:grid-cols-2">
            {contract.dresses.map((dress) => (
              <li key={dress.id} className="rounded-xl bg-gray-50/70 p-3 dark:bg-white/10">
                <p className="font-medium text-gray-900 dark:text-white">{dress.name}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">Référence : {dress.reference || "-"}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Prix location : {formatCurrency(dress.price_ttc)} TTC
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Prix journée : {formatCurrency(dress.price_per_day_ttc)} TTC
                </p>
              </li>
            ))}
          </ul>
        </div>
      )}

      {contract.addons && contract.addons.length > 0 && (
        <div className="space-y-3">
          <h5 className="text-sm font-semibold text-gray-800 dark:text-white/90">Options</h5>
          <ul className="grid gap-2 text-sm text-gray-700 dark:text-gray-200 md:grid-cols-2">
            {contract.addons.map((addon) => (
              <li
                key={addon.id}
                className="flex items-center justify-between rounded-xl bg-gray-50/70 px-3 py-2 dark:bg-white/10"
              >
                <div className="space-y-0.5">
                  <span className="font-medium text-gray-900 dark:text-white">{addon.name}</span>
                  <span className="block text-xs text-gray-500 dark:text-gray-400">
                    {addon.included ? "Inclus" : "Optionnel"}
                  </span>
                </div>
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  {formatCurrency(addon.price_ttc)} TTC
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {contract.deposit_payment_method && (
        <p className="text-xs text-gray-500 dark:text-gray-400">
          Mode de paiement : {contract.deposit_payment_method}
        </p>
      )}

      <div className="flex flex-wrap gap-3 pt-2">
        <Button size="sm" variant="outline" onClick={() => onGenerate(contract)}>
          Générer contrat
        </Button>
        <Button size="sm" variant="outline" disabled={!canManage} onClick={() => onEdit(contract)}>
          Modifier contrat
        </Button>
        <Button
          size="sm"
          variant="outline"
          disabled={!canSoftDelete || softDeletingId === contract.id}
          onClick={() => onSoftDelete(contract)}
        >
          {softDeletingId === contract.id ? "Désactivation..." : "Désactiver contrat"}
        </Button>
        <Button
          size="sm"
          variant="outline"
          disabled={!contract.sign_link?.token}
          onClick={() => onSignature(contract)}
        >
          Signature électronique
        </Button>
      </div>
    </div>
  );
};

const formatDateTime = (value?: string | null) => {
  if (!value) return "-";
  try {
    const date = new Date(value);
    return date.toLocaleString("fr-FR", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return "-";
  }
};

const formatDateOnly = (value?: string | null) => {
  if (!value) return "-";
  try {
    const date = new Date(value);
    return date.toLocaleDateString("fr-FR");
  } catch {
    return "-";
  }
};

const toISODate = (value: string) => {
  if (!value) return undefined;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return undefined;
  return date.toISOString();
};

export default function Customers() {
  const [searchInput, setSearchInput] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [page, setPage] = useState(1);
  const [limit] = useState(10);

  const [customerData, setCustomerData] = useState<CustomerListResponse>({
    data: [],
    page: 1,
    limit,
    total: 0,
  });

  const [loading, setLoading] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [processing, setProcessing] = useState<{ type: "soft" | "hard" | null; id: string | null }>({
    type: null,
    id: null,
  });
  const [createOpen, setCreateOpen] = useState(false);
  const [editCustomer, setEditCustomer] = useState<CustomerRow | null>(null);
  const [createForm, setCreateForm] = useState<CustomerFormState>(defaultFormState);
  const [editForm, setEditForm] = useState<CustomerFormState>(defaultFormState);
  const [confirmState, setConfirmState] = useState<ConfirmState>({ mode: "soft", customer: null });
  const [viewOpen, setViewOpen] = useState(false);
  const [viewCustomer, setViewCustomer] = useState<Customer | CustomerRow | null>(null);
  const [viewLoading, setViewLoading] = useState(false);
  const [viewContracts, setViewContracts] = useState<ContractFullView[]>([]);
  const [contractsLoading, setContractsLoading] = useState(false);
  const [contractsError, setContractsError] = useState<string | null>(null);
  const [softDeletingContractId, setSoftDeletingContractId] = useState<string | null>(null);

  const { notify } = useNotification();
  const { hasRole } = useAuth();
  const canManage = hasRole("ADMIN") || hasRole("MANAGER") || hasRole("COLLABORATOR");
  const canSoftDelete = hasRole("ADMIN") || hasRole("MANAGER");
  const canHardDelete = hasRole("ADMIN");
  const createBirthdayId = "create-customer-birthday";
  const editBirthdayId = "edit-customer-birthday";

  const totalPages = useMemo(
    () => Math.max(1, Math.ceil(customerData.total / (customerData.limit || limit))),
    [customerData.total, customerData.limit, limit],
  );

  const customers: CustomerRow[] = useMemo(
    () =>
      customerData.data.map((customer) => ({
        ...customer,
        fullName: [customer.firstname, customer.lastname].filter(Boolean).join(" ") || "-",
        createdLabel: formatDateTime(customer.created_at),
      })),
    [customerData.data],
  );

  useEffect(() => {
    const handler = setTimeout(() => {
      setPage(1);
      setSearchQuery(searchInput.trim());
    }, 400);
    return () => clearTimeout(handler);
  }, [searchInput]);

  const fetchCustomers = useCallback(async () => {
    try {
      setLoading(true);
      setFetchError(null);
      const response = await CustomersAPI.list({
        search: searchQuery || undefined,
        page,
        limit,
      });
      setCustomerData(response);
    } catch (error) {
      console.error("❌ Chargement clients :", error);
      setFetchError("Impossible de charger les clients.");
      notify("error", "Erreur", "Le chargement des clients a échoué.");
    } finally {
      setLoading(false);
    }
  }, [limit, notify, page, searchQuery]);

  useEffect(() => {
    fetchCustomers();
  }, [fetchCustomers]);

  const openCreateModal = () => {
    if (!canManage) {
      notify("warning", "Action non autorisée", "Vous n'avez pas les droits suffisants.");
      return;
    }
    setCreateForm(defaultFormState);
    setCreateOpen(true);
  };

  const closeCreateModal = () => {
    if (creating) return;
    setCreateOpen(false);
  };

  const openEditModal = (customer: CustomerRow) => {
    setEditCustomer(customer);
    setEditForm({
      firstname: customer.firstname ?? "",
      lastname: customer.lastname ?? "",
      email: customer.email ?? "",
      phone: customer.phone ?? "",
      birthday: customer.birthday ?? "",
      country: customer.country ?? "",
      city: customer.city ?? "",
      address: customer.address ?? "",
      postal_code: customer.postal_code ?? "",
    });
  };

  const closeEditModal = () => {
    if (updating) return;
    setEditCustomer(null);
  };

  const requestSoftDelete = (customer: CustomerRow) => {
    if (!canSoftDelete) {
      notify("warning", "Action non autorisée", "Vous n'avez pas les droits suffisants pour désactiver.");
      return;
    }
    setConfirmState({ mode: "soft", customer });
  };

  const requestHardDelete = (customer: CustomerRow) => {
    if (!canHardDelete) {
      notify("warning", "Action non autorisée", "Seul un administrateur peut supprimer définitivement.");
      return;
    }
    setConfirmState({ mode: "hard", customer });
  };

  const resetConfirm = () => setConfirmState({ mode: "soft", customer: null });

  const performSoftDelete = async (customer: CustomerRow) => {
    setProcessing({ type: "soft", id: customer.id });
    let success = false;
    try {
      await CustomersAPI.softDelete(customer.id);
      notify("success", "Client désactivé", "Le client a été désactivé.");
      success = true;
    } catch (error) {
      console.error("❌ Soft delete client :", error);
      notify("error", "Erreur", "Impossible de désactiver le client.");
    } finally {
      setProcessing({ type: null, id: null });
    }
    return success;
  };

  const performHardDelete = async (customer: CustomerRow) => {
    setProcessing({ type: "hard", id: customer.id });
    let success = false;
    try {
      await CustomersAPI.hardDelete(customer.id);
      notify("success", "Client supprimé", "Le client a été supprimé définitivement.");
      success = true;
    } catch (error) {
      console.error("❌ Hard delete client :", error);
      notify("error", "Erreur", "Impossible de supprimer le client.");
    } finally {
      setProcessing({ type: null, id: null });
    }
    return success;
  };

  const handleConfirmDelete = async () => {
    if (!confirmState.customer) return;
    const customer = confirmState.customer;
    const success =
      confirmState.mode === "soft"
        ? await performSoftDelete(customer)
        : await performHardDelete(customer);
    if (success) {
      resetConfirm();
      fetchCustomers().catch(() => undefined);
    }
  };

  const openViewModal = async (customer: CustomerRow) => {
    setViewOpen(true);
    setViewCustomer(customer);
    setViewLoading(true);
    setContractsLoading(true);
    setContractsError(null);
    setViewContracts([]);
    setSoftDeletingContractId(null);
    try {
      const [detail, contracts] = await Promise.all([
        CustomersAPI.getById(customer.id),
        ContractsAPI.listByCustomer(customer.id),
      ]);
      setViewCustomer(detail);
      let contractsWithDetails = contracts;
      if (contracts.some((c) => !(c.contract_type && c.contract_type.name))) {
        contractsWithDetails = await Promise.all(
          contracts.map(async (contract) => {
            try {
              const fullContract = await ContractsAPI.getById(contract.id);
              return {
                ...contract,
                ...fullContract,
                contract_type: fullContract.contract_type ?? contract.contract_type ?? null,
                contract_type_name:
                  fullContract.contract_type?.name ??
                  contract.contract_type?.name ??
                  contract.contract_type_name ??
                  null,
              };
            } catch (error) {
              console.error("❌ Détail contrat :", error);
              return contract;
            }
          }),
        );
      }
      setViewContracts(contractsWithDetails);
    } catch (error) {
      console.error("❌ Consultation client :", error);
      notify("error", "Erreur", "Impossible de charger la fiche client.");
      setContractsError("Impossible de récupérer les contrats.");
    } finally {
      setViewLoading(false);
      setContractsLoading(false);
    }
  };

  const closeViewModal = () => {
    if (viewLoading) return;
    setViewOpen(false);
    setViewCustomer(null);
    setViewContracts([]);
    setContractsError(null);
    setSoftDeletingContractId(null);
  };

  const handleGenerateContract = (contract: ContractFullView) => {
    notify(
      "info",
      "Génération",
      `La génération du contrat ${contract.contract_number} sera disponible prochainement.`,
    );
  };

  const handleEditContract = (contract: ContractFullView) => {
    if (!canManage) {
      notify("warning", "Action non autorisée", "Vous n'avez pas les droits suffisants.");
      return;
    }
    notify(
      "info",
      "Modification",
      `La modification du contrat ${contract.contract_number} sera disponible prochainement.`,
    );
  };

  const handleSoftDeleteContract = async (contract: ContractFullView) => {
    if (!canSoftDelete) {
      notify("warning", "Action non autorisée", "Vous n'avez pas les droits suffisants.");
      return;
    }
    setSoftDeletingContractId(contract.id);
    try {
      await ContractsAPI.softDelete(contract.id);
      notify("success", "Contrat désactivé", `Le contrat ${contract.contract_number} a été désactivé.`);
      setViewContracts((prev) =>
        prev.map((item) => (item.id === contract.id ? { ...item, status: "DISABLED" } : item)),
      );
    } catch (error) {
      console.error("❌ Désactivation contrat :", error);
      notify("error", "Erreur", "Impossible de désactiver le contrat.");
    } finally {
      setSoftDeletingContractId(null);
    }
  };

  const handleSignature = (contract: ContractFullView) => {
    if (!contract.sign_link?.token) {
      notify("info", "Signature", "Aucun lien de signature disponible pour ce contrat.");
      return;
    }
    notify(
      "success",
      "Signature électronique",
      "Le lien de signature a été copié dans le presse-papiers.",
    );
    void navigator.clipboard?.writeText(contract.sign_link.token).catch(() => undefined);
  };

  const handleCreate = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!createForm.firstname.trim() || !createForm.lastname.trim()) {
      notify("warning", "Champs manquants", "Le prénom et le nom sont obligatoires.");
      return;
    }
    if (!createForm.email.trim()) {
      notify("warning", "Champs manquants", "L'email est obligatoire.");
      return;
    }

    try {
      setCreating(true);
      await CustomersAPI.create({
        firstname: createForm.firstname.trim(),
        lastname: createForm.lastname.trim(),
        email: createForm.email.trim(),
        phone: createForm.phone.trim() || null,
        birthday: createForm.birthday ? toISODate(createForm.birthday) ?? null : null,
        country: createForm.country.trim() || null,
        city: createForm.city.trim() || null,
        address: createForm.address.trim() || null,
        postal_code: createForm.postal_code.trim() || null,
      });
      notify("success", "Client créé", "Le client a été ajouté.");
      setCreateOpen(false);
      const refreshed = await CustomersAPI.list({
        search: searchInput.trim() || undefined,
        page: 1,
        limit,
      });
      setCustomerData(refreshed);
      setPage(1);
      setSearchQuery(searchInput.trim());
    } catch (error) {
      console.error("❌ Création client :", error);
      notify("error", "Erreur", "Impossible de créer le client.");
    } finally {
      setCreating(false);
    }
  };

  const handleUpdate = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!editCustomer) return;

    if (!editForm.firstname.trim() || !editForm.lastname.trim()) {
      notify("warning", "Champs manquants", "Le prénom et le nom sont obligatoires.");
      return;
    }
    if (!editForm.email.trim()) {
      notify("warning", "Champs manquants", "L'email est obligatoire.");
      return;
    }

    try {
      setUpdating(true);
      await CustomersAPI.update(editCustomer.id, {
        firstname: editForm.firstname.trim(),
        lastname: editForm.lastname.trim(),
        email: editForm.email.trim(),
        phone: editForm.phone.trim() || null,
        birthday: editForm.birthday ? toISODate(editForm.birthday) ?? null : null,
        country: editForm.country.trim() || null,
        city: editForm.city.trim() || null,
        address: editForm.address.trim() || null,
        postal_code: editForm.postal_code.trim() || null,
      });
      notify("success", "Client mis à jour", "Les modifications ont été enregistrées.");
      setEditCustomer(null);
      fetchCustomers().catch(() => undefined);
    } catch (error) {
      console.error("❌ Mise à jour client :", error);
      notify("error", "Erreur", "Impossible de mettre à jour le client.");
    } finally {
      setUpdating(false);
    }
  };

  const confirmCustomer = confirmState.customer;
  const confirmLoading =
    !!confirmCustomer && processing.type === confirmState.mode && processing.id === confirmCustomer.id;
  const confirmTitle =
    confirmState.mode === "soft" ? "Désactiver le client" : "Supprimer le client";
  const confirmDescription =
    confirmState.mode === "soft"
      ? "Cette action désactivera temporairement le client. Vous pourrez le réactiver ultérieurement."
      : "Cette action est définitive. Toutes les données associées à ce client seront supprimées.";
  const confirmAccent =
    confirmState.mode === "soft"
      ? "border-warning-100 bg-warning-50 text-warning-700 dark:border-warning-500/40 dark:bg-warning-500/10 dark:text-warning-300"
      : "border-error-100 bg-error-50 text-error-700 dark:border-error-500/40 dark:bg-error-500/10 dark:text-error-300";

  return (
    <>
      <PageMeta title="Clients" description="Gestion des clients et contacts." />
      <PageBreadcrumb pageTitle="Clients" />

      <section className="flex flex-col gap-6">
        <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
          <div className="flex flex-col gap-4 border-b border-gray-200 px-6 py-4 dark:border-gray-800">
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div>
                <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">Liste des clients</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {loading
                    ? "Chargement..."
                    : `${customerData.total} client${customerData.total > 1 ? "s" : ""} trouvé${customerData.total > 1 ? "s" : ""}`}
                </p>
              </div>
              <div className="flex w-full flex-col-reverse gap-3 md:w-auto md:flex-row md:items-center">
                <div className="w-full md:w-64">
                  <Input
                    value={searchInput}
                    onChange={(event) => setSearchInput(event.target.value)}
                    placeholder="Rechercher (nom, email, téléphone)"
                  />
                </div>
                {canManage && (
                  <Button onClick={openCreateModal} disabled={creating} variant="outline">
                    Ajouter un client
                  </Button>
                )}
              </div>
            </div>
          </div>

          {loading ? (
            <div className="flex w-full justify-center py-16">
              <SpinnerOne />
            </div>
          ) : fetchError ? (
            <div className="flex w-full flex-col items-center justify-center gap-2 py-16 text-center">
              <h4 className="text-base font-medium text-gray-800 dark:text-white/90">Erreur de chargement</h4>
              <p className="text-sm text-gray-500 dark:text-gray-400">{fetchError}</p>
              <Button onClick={() => fetchCustomers().catch(() => undefined)} variant="outline">
                Réessayer
              </Button>
            </div>
          ) : customers.length === 0 ? (
            <div className="flex w-full flex-col items-center justify-center gap-2 py-16 text-center">
              <h4 className="text-base font-medium text-gray-800 dark:text-white/90">Aucun client trouvé</h4>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Ajustez votre recherche ou ajoutez un nouveau client.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table className="min-w-full divide-y divide-gray-200 dark:divide-gray-800">
                <TableHeader className="bg-gray-50 dark:bg-white/[0.03]">
                  <TableRow>
                    <TableCell
                      isHeader
                      className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400"
                    >
                      Nom complet
                    </TableCell>
                    <TableCell
                      isHeader
                      className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400"
                    >
                      Email
                    </TableCell>
                    <TableCell
                      isHeader
                      className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400"
                    >
                      Téléphone
                    </TableCell>
                    <TableCell
                      isHeader
                      className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400"
                    >
                      Localisation
                    </TableCell>
                    <TableCell
                      isHeader
                      className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400"
                    >
                      Créé le
                    </TableCell>
                    <TableCell
                      isHeader
                      className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400"
                    >
                      Statut
                    </TableCell>
                    <TableCell
                      isHeader
                      className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400"
                    >
                      Actions
                    </TableCell>
                  </TableRow>
                </TableHeader>
                <TableBody className="divide-y divide-gray-200 bg-white dark:divide-gray-800 dark:bg-transparent">
                {customers.map((customer) => (
                  <TableRow key={customer.id} className="hover:bg-gray-50 dark:hover:bg-white/[0.05]">
                    <TableCell className="px-4 py-3 text-sm font-medium text-gray-800 dark:text-white/90">
                      {customer.fullName || "-"}
                    </TableCell>
                      <TableCell className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
                        {customer.email || "-"}
                      </TableCell>
                      <TableCell className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
                        {customer.phone || "-"}
                      </TableCell>
                      <TableCell className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
                        {[customer.city, customer.country].filter(Boolean).join(", ") || "-"}
                      </TableCell>
                      <TableCell className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
                        {customer.createdLabel}
                      </TableCell>
                    <TableCell className="px-4 py-3">
                      <Badge variant="light" color={customer.deleted_at ? "warning" : "success"} size="sm">
                        {customer.deleted_at ? "Désactivé" : "Actif"}
                      </Badge>
                    </TableCell>
                    <TableCell className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <TooltipWrapper title="Voir">
                          <button
                            type="button"
                            onClick={() => openViewModal(customer)}
                            className="inline-flex size-9 items-center justify-center rounded-lg border border-gray-300 text-gray-600 transition hover:bg-gray-50 hover:text-gray-800 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-white/10"
                          >
                            <EyeIcon className="size-4" />
                            <span className="sr-only">Voir</span>
                          </button>
                        </TooltipWrapper>
                        {canManage && (
                          <TooltipWrapper title="Modifier">
                            <button
                              type="button"
                              onClick={() => openEditModal(customer)}
                              className="inline-flex size-9 items-center justify-center rounded-lg border border-gray-300 text-gray-600 transition hover:bg-gray-50 hover:text-gray-800 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-white/10"
                            >
                              <PencilIcon className="size-4" />
                              <span className="sr-only">Modifier</span>
                            </button>
                          </TooltipWrapper>
                        )}
                        {canSoftDelete && (
                          <TooltipWrapper title="Désactiver (soft delete)">
                            <button
                              type="button"
                              onClick={() => requestSoftDelete(customer)}
                              disabled={processing.type === "soft" && processing.id === customer.id}
                              className={`inline-flex size-9 items-center justify-center rounded-lg border transition ${
                                processing.type === "soft" && processing.id === customer.id
                                  ? "cursor-not-allowed border-gray-200 text-gray-400 opacity-60 dark:border-gray-700 dark:text-gray-500"
                                  : "border-gray-300 text-warning-600 hover:bg-gray-50 hover:text-warning-600 dark:border-gray-700 dark:text-warning-400 dark:hover:bg-white/10"
                              }`}
                            >
                              <CloseLineIcon className="size-4" />
                              <span className="sr-only">Désactiver</span>
                            </button>
                          </TooltipWrapper>
                        )}
                        {canHardDelete && (
                          <TooltipWrapper title="Supprimer définitivement">
                            <button
                              type="button"
                              onClick={() => requestHardDelete(customer)}
                              disabled={processing.type === "hard" && processing.id === customer.id}
                              className={`inline-flex size-9 items-center justify-center rounded-lg border transition ${
                                processing.type === "hard" && processing.id === customer.id
                                  ? "cursor-not-allowed border-gray-200 text-gray-400 opacity-60 dark:border-gray-700 dark:text-gray-500"
                                  : "border-gray-300 text-error-600 hover:bg-gray-50 hover:text-error-600 dark:border-gray-700 dark:text-error-400 dark:hover:bg-white/10"
                              }`}
                            >
                              <TrashBinIcon className="size-4" />
                              <span className="sr-only">Supprimer définitivement</span>
                            </button>
                          </TooltipWrapper>
                        )}
                      </div>
                    </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}

          {!loading && !fetchError && customers.length > 0 && (
            <div className="flex items-center justify-between border-t border-gray-200 px-6 py-4 dark:border-gray-800">
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Page {customerData.page} / {totalPages} — {customerData.total} client
                {customerData.total > 1 ? "s" : ""}
              </p>
              <PaginationWithIcon
                key={page}
                totalPages={totalPages}
                initialPage={page}
                onPageChange={(newPage) => setPage(newPage)}
              />
            </div>
          )}
        </div>
      </section>

      <Modal
        isOpen={Boolean(confirmCustomer)}
        onClose={confirmLoading ? () => undefined : resetConfirm}
        className="max-w-md w-full p-6"
        showCloseButton={false}
      >
        <div className="flex flex-col gap-6">
          <div>
            <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">{confirmTitle}</h3>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{confirmDescription}</p>
          </div>

          {confirmCustomer && (
            <div className={`rounded-xl border px-4 py-3 text-sm ${confirmAccent}`}>
              <p>
                Client :<span className="font-semibold"> {confirmCustomer.fullName || confirmCustomer.email}</span>
              </p>
              <p className="text-xs text-gray-600 dark:text-gray-400">{confirmCustomer.email}</p>
            </div>
          )}

          <div className="flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={resetConfirm}
              disabled={confirmLoading}
              className={`inline-flex items-center justify-center gap-2 rounded-lg px-5 py-3.5 text-sm ring-1 ring-inset transition ${
                confirmLoading
                  ? "cursor-not-allowed opacity-60 ring-gray-200 text-gray-400 dark:ring-gray-700 dark:text-gray-500"
                  : "ring-gray-300 text-gray-700 hover:bg-gray-50 dark:ring-gray-700 dark:text-gray-400 dark:hover:bg-white/10 dark:hover:text-gray-200"
              }`}
            >
              Annuler
            </button>
            <button
              type="button"
              onClick={handleConfirmDelete}
              disabled={confirmLoading}
              className={`inline-flex items-center justify-center gap-2 rounded-lg px-5 py-3.5 text-sm text-white shadow-theme-xs transition focus:outline-hidden focus:ring-3 ${
                confirmLoading
                  ? "cursor-not-allowed opacity-60 bg-gray-300 dark:bg-gray-700"
                  : confirmState.mode === "soft"
                  ? "bg-warning-600 hover:bg-warning-700 focus:ring-warning-500/20"
                  : "bg-error-600 hover:bg-error-700 focus:ring-error-500/20"
              }`}
            >
              {confirmLoading
                ? "Traitement..."
                : confirmState.mode === "soft"
                ? "Oui, désactiver"
                : "Oui, supprimer"}
            </button>
          </div>
        </div>
      </Modal>

      <RightDrawer
        isOpen={viewOpen}
        onClose={closeViewModal}
        title="Fiche client"
        description={viewCustomer?.email}
        widthClassName="w-full max-w-3xl"
      >
        {viewLoading || !viewCustomer ? (
          <div className="flex justify-center py-12">
            <SpinnerOne />
          </div>
        ) : (
          <div className="space-y-10">
            <div className="grid gap-x-8 gap-y-6 md:grid-cols-2">
              <InfoCard label="Nom complet">
                {[viewCustomer.firstname, viewCustomer.lastname].filter(Boolean).join(" ") || "-"}
              </InfoCard>
              <InfoCard label="Email">{viewCustomer.email || "-"}</InfoCard>
              <InfoCard label="Téléphone">{viewCustomer.phone || "-"}</InfoCard>
              <InfoCard label="Date de naissance">{formatDateOnly(viewCustomer.birthday)}</InfoCard>
              <InfoCard label="Pays / Ville">
                {[viewCustomer.city, viewCustomer.country].filter(Boolean).join(", ") || "-"}
              </InfoCard>
              <InfoCard label="Adresse">
                {[viewCustomer.address, viewCustomer.postal_code].filter(Boolean).join(" ") || "-"}
              </InfoCard>
              <InfoCard label="Créé le">{formatDateTime(viewCustomer.created_at)}</InfoCard>
              <InfoCard label="Statut">
                <Badge variant="light" color={viewCustomer.deleted_at ? "warning" : "success"} size="sm">
                  {viewCustomer.deleted_at ? "Désactivé" : "Actif"}
                </Badge>
              </InfoCard>
            </div>

            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h4 className="text-base font-semibold text-gray-800 dark:text-white/90">Contrats associés</h4>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Historique complet des contrats liés à ce client.
                  </p>
                </div>
                <Badge variant="light" color="primary" size="sm">
                  {viewContracts.length} contrat{viewContracts.length > 1 ? "s" : ""}
                </Badge>
              </div>
              {contractsLoading ? (
                <div className="flex justify-center py-8">
                  <SpinnerOne />
                </div>
              ) : contractsError ? (
                <div className="rounded-xl border border-error-100 bg-error-50 p-4 text-sm text-error-600 dark:border-error-500/30 dark:bg-error-500/10 dark:text-error-300">
                  {contractsError}
                </div>
              ) : viewContracts.length === 0 ? (
                <div className="rounded-xl border border-gray-200 bg-gray-50 p-4 text-sm text-gray-600 dark:border-gray-800 dark:bg-white/5 dark:text-gray-400">
                  Aucun contrat trouvé pour ce client.
                </div>
              ) : (
                <div className="space-y-6">
                  {viewContracts.map((contract) => (
                    <ContractCard
                      key={contract.id}
                      contract={contract}
                      onGenerate={handleGenerateContract}
                      onEdit={handleEditContract}
                      onSoftDelete={handleSoftDeleteContract}
                      onSignature={handleSignature}
                      canManage={canManage}
                      canSoftDelete={canSoftDelete}
                      softDeletingId={softDeletingContractId}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </RightDrawer>

      <Modal
        isOpen={createOpen}
        onClose={creating ? () => undefined : closeCreateModal}
        className="max-w-2xl w-full p-6"
        showCloseButton={false}
      >
        <form className="flex flex-col gap-6" onSubmit={handleCreate}>
          <div>
            <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">Ajouter un client</h3>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Renseignez les informations ci-dessous pour créer un nouveau client.
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="md:col-span-1">
              <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">Prénom</label>
              <Input
                value={createForm.firstname}
                onChange={(event) => setCreateForm((prev) => ({ ...prev, firstname: event.target.value }))}
                required
              />
            </div>
            <div className="md:col-span-1">
              <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">Nom</label>
              <Input
                value={createForm.lastname}
                onChange={(event) => setCreateForm((prev) => ({ ...prev, lastname: event.target.value }))}
                required
              />
            </div>
            <div className="md:col-span-1">
              <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">Email</label>
              <Input
                type="email"
                value={createForm.email}
                onChange={(event) => setCreateForm((prev) => ({ ...prev, email: event.target.value }))}
                required
              />
            </div>
            <div className="md:col-span-1">
              <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">Téléphone</label>
              <Input
                value={createForm.phone}
                onChange={(event) => setCreateForm((prev) => ({ ...prev, phone: event.target.value }))}
                placeholder="+336..."
              />
            </div>
            <div className="md:col-span-1">
              <DatePicker
                id={createBirthdayId}
                label="Date de naissance"
                placeholder="Sélectionner une date"
                defaultDate={createForm.birthday ? new Date(createForm.birthday) : undefined}
                onChange={(selectedDates) =>
                  setCreateForm((prev) => ({
                    ...prev,
                    birthday: selectedDates[0]?.toISOString() ?? "",
                  }))
                }
              />
            </div>
            <div className="md:col-span-1">
              <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">Pays</label>
              <Input
                value={createForm.country}
                onChange={(event) => setCreateForm((prev) => ({ ...prev, country: event.target.value }))}
              />
            </div>
            <div className="md:col-span-1">
              <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">Ville</label>
              <Input
                value={createForm.city}
                onChange={(event) => setCreateForm((prev) => ({ ...prev, city: event.target.value }))}
              />
            </div>
            <div className="md:col-span-1">
              <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">Adresse</label>
              <Input
                value={createForm.address}
                onChange={(event) => setCreateForm((prev) => ({ ...prev, address: event.target.value }))}
              />
            </div>
            <div className="md:col-span-1">
              <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">Code postal</label>
              <Input
                value={createForm.postal_code}
                onChange={(event) => setCreateForm((prev) => ({ ...prev, postal_code: event.target.value }))}
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={closeCreateModal}
              disabled={creating}
              className={`inline-flex items-center justify-center gap-2 rounded-lg px-5 py-3.5 text-sm ring-1 ring-inset transition ${
                creating
                  ? "cursor-not-allowed opacity-60 ring-gray-200 text-gray-400 dark:ring-gray-700 dark:text-gray-500"
                  : "ring-gray-300 text-gray-700 hover:bg-gray-50 dark:ring-gray-700 dark:text-gray-400 dark:hover:bg-white/10 dark:hover:text-gray-200"
              }`}
            >
              Annuler
            </button>
            <Button type="submit" disabled={creating}>
              {creating ? "Création..." : "Créer"}
            </Button>
          </div>
        </form>
      </Modal>

      <Modal
        isOpen={Boolean(editCustomer)}
        onClose={updating ? () => undefined : closeEditModal}
        className="max-w-2xl w-full p-6"
        showCloseButton={false}
      >
        <form className="flex flex-col gap-6" onSubmit={handleUpdate}>
          <div>
            <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">Modifier le client</h3>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Ajustez les informations du client sélectionné.
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="md:col-span-1">
              <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">Prénom</label>
              <Input
                value={editForm.firstname}
                onChange={(event) => setEditForm((prev) => ({ ...prev, firstname: event.target.value }))}
                required
              />
            </div>
            <div className="md:col-span-1">
              <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">Nom</label>
              <Input
                value={editForm.lastname}
                onChange={(event) => setEditForm((prev) => ({ ...prev, lastname: event.target.value }))}
                required
              />
            </div>
            <div className="md:col-span-1">
              <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">Email</label>
              <Input
                type="email"
                value={editForm.email}
                onChange={(event) => setEditForm((prev) => ({ ...prev, email: event.target.value }))}
                required
              />
            </div>
            <div className="md:col-span-1">
              <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">Téléphone</label>
              <Input
                value={editForm.phone}
                onChange={(event) => setEditForm((prev) => ({ ...prev, phone: event.target.value }))}
              />
            </div>
            <div className="md:col-span-1">
              <DatePicker
                key={editCustomer?.id ?? "edit-customer-birthday"}
                id={editBirthdayId}
                label="Date de naissance"
                placeholder="Sélectionner une date"
                defaultDate={editForm.birthday ? new Date(editForm.birthday) : undefined}
                onChange={(selectedDates) =>
                  setEditForm((prev) => ({
                    ...prev,
                    birthday: selectedDates[0]?.toISOString() ?? "",
                  }))
                }
              />
            </div>
            <div className="md:col-span-1">
              <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">Pays</label>
              <Input
                value={editForm.country}
                onChange={(event) => setEditForm((prev) => ({ ...prev, country: event.target.value }))}
              />
            </div>
            <div className="md:col-span-1">
              <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">Ville</label>
              <Input
                value={editForm.city}
                onChange={(event) => setEditForm((prev) => ({ ...prev, city: event.target.value }))}
              />
            </div>
            <div className="md:col-span-1">
              <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">Adresse</label>
              <Input
                value={editForm.address}
                onChange={(event) => setEditForm((prev) => ({ ...prev, address: event.target.value }))}
              />
            </div>
            <div className="md:col-span-1">
              <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">Code postal</label>
              <Input
                value={editForm.postal_code}
                onChange={(event) => setEditForm((prev) => ({ ...prev, postal_code: event.target.value }))}
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={closeEditModal}
              disabled={updating}
              className={`inline-flex items-center justify-center gap-2 rounded-lg px-5 py-3.5 text-sm ring-1 ring-inset transition ${
                updating
                  ? "cursor-not-allowed opacity-60 ring-gray-200 text-gray-400 dark:ring-gray-700 dark:text-gray-500"
                  : "ring-gray-300 text-gray-700 hover:bg-gray-50 dark:ring-gray-700 dark:text-gray-400 dark:hover:bg-white/10 dark:hover:text-gray-200"
              }`}
            >
              Annuler
            </button>
            <Button type="submit" disabled={updating}>
              {updating ? "Enregistrement..." : "Enregistrer"}
            </Button>
          </div>
        </form>
      </Modal>
    </>
  );
}
