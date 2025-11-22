import type { ContractForm } from "./types";
import Input from "../form/input/InputField";
import Label from "../form/Label";
import Select from "../form/Select";
import { DollarLineIcon } from "../../icons";

interface PricingSectionProps {
  contractForm: ContractForm;
  onDepositPaidTTCChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onCautionPaidChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onPaymentMethodChange: (value: string) => void;
  onQuickPayDeposit?: () => void;
}

const PAYMENT_METHOD_OPTIONS = [
  { value: "card", label: "Carte bancaire" },
  { value: "cash", label: "Espèces" },
];

export default function PricingSection({
  contractForm,
  onDepositPaidTTCChange,
  onCautionPaidChange,
  onPaymentMethodChange,
  onQuickPayDeposit,
}: PricingSectionProps) {
  // Vérifier si l'acompte payé est inférieur au prix total
  const depositPaidTTC = parseFloat(String(contractForm.depositPaidTTC)) || 0;
  const totalPriceTTC = parseFloat(String(contractForm.totalPriceTTC)) || 0;
  const showQuickPayIcon = depositPaidTTC < totalPriceTTC;

  return (
    <section className="space-y-4 rounded-2xl border border-gray-200 bg-white/80 p-6 shadow-theme-xs dark:border-gray-800 dark:bg-white/[0.02]">
      <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Tarification</h3>
      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <Label>Prix total TTC</Label>
          <Input value={contractForm.totalPriceTTC} disabled />
        </div>
        <div>
          <Label>Prix total HT</Label>
          <Input value={contractForm.totalPriceHT} disabled />
        </div>
        <div>
          <Label>Acompte TTC</Label>
          <Input value={contractForm.depositTTC} disabled />
        </div>
        <div>
          <Label>Acompte HT</Label>
          <Input value={contractForm.depositHT} disabled />
        </div>
        <div>
          <Label>Acompte payé TTC</Label>
          <div className="relative">
            <Input
              type="number"
              step={0.01}
              min="0"
              value={contractForm.depositPaidTTC}
              onChange={onDepositPaidTTCChange}
            />
            {showQuickPayIcon && onQuickPayDeposit && (
              <button
                type="button"
                onClick={onQuickPayDeposit}
                className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center justify-center w-8 h-8 rounded-md bg-brand-50 hover:bg-brand-100 text-brand-600 hover:text-brand-700 transition-colors duration-200"
                title="Régler l'acompte total"
              >
                <DollarLineIcon className="w-5 h-5" />
              </button>
            )}
          </div>
        </div>
        <div>
          <Label>Acompte payé HT</Label>
          <Input value={contractForm.depositPaidHT} disabled />
        </div>
        <div>
          <Label>Caution TTC</Label>
          <Input value={contractForm.cautionTTC} disabled />
        </div>
        <div>
          <Label>Caution HT</Label>
          <Input value={contractForm.cautionHT} disabled />
        </div>
        <div>
          <Label>Caution payée TTC</Label>
          <Input
            type="number"
            step={0.01}
            min="0"
            value={contractForm.cautionPaidTTC}
            onChange={onCautionPaidChange}
          />
        </div>
        <div>
          <Label>Caution payée HT</Label>
          <Input value={contractForm.cautionPaidHT} readOnly disabled />
        </div>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <Label>Méthode de paiement</Label>
          <Select
            value={contractForm.paymentMethod}
            onChange={onPaymentMethodChange}
            options={PAYMENT_METHOD_OPTIONS}
            placeholder="Sélectionner une méthode"
          />
        </div>
        <div>
          <Label>Statut</Label>
          <Input value="En attente" disabled />
        </div>
      </div>
    </section>
  );
}
