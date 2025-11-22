import { useEffect, useMemo, useRef } from "react";
import flatpickr from "flatpickr";
import "flatpickr/dist/flatpickr.css";
import Label from "./Label";
import { CalenderIcon } from "../../icons";
import Hook = flatpickr.Options.Hook;
import DateOption = flatpickr.Options.DateOption;
import Options = flatpickr.Options.Options;
import { French } from "flatpickr/dist/l10n/fr.js";
import type { Instance as FlatpickrInstance } from "flatpickr/dist/types/instance";

type PropsType = {
  id: string;
  mode?: "single" | "multiple" | "range" | "time";
  onChange?: Hook | Hook[];
  defaultDate?: DateOption | DateOption[];
  label?: string;
  placeholder?: string;
  options?: Partial<Options>;
};

export default function DatePicker({
  id,
  mode,
  onChange,
  label,
  defaultDate,
  placeholder,
  options,
}: PropsType) {
  const optionsSignature = useMemo(() => JSON.stringify(options ?? {}), [options]);
  const flatpickrRef = useRef<FlatpickrInstance | null>(null);

  useEffect(() => {
    const baseOptions: Partial<Options> = {
      static: true,
      monthSelectorType: "static",
      dateFormat: "d/m/Y",
      locale: French,
      ...options,
    };

    if (mode) {
      baseOptions.mode = mode;
    } else if (!baseOptions.mode) {
      baseOptions.mode = "single";
    }

    // Ne pas définir defaultDate si undefined pour éviter la sélection automatique de la date actuelle
    if (defaultDate !== undefined) {
      baseOptions.defaultDate = defaultDate;
    } else {
      // Désactiver la sélection automatique de la date actuelle
      baseOptions.defaultDate = undefined;
    }

    if (onChange) {
      baseOptions.onChange = onChange;
    }

    if (flatpickrRef.current) {
      flatpickrRef.current.destroy();
      flatpickrRef.current = null;
    }

    const instance = flatpickr(`#${id}`, baseOptions);

    flatpickrRef.current = Array.isArray(instance) ? instance[0] ?? null : instance;

    return () => {
      if (flatpickrRef.current) {
        flatpickrRef.current.destroy();
        flatpickrRef.current = null;
      }
    };
  }, [mode, onChange, id, optionsSignature, defaultDate]);

  useEffect(() => {
    const instance = flatpickrRef.current;
    if (!instance) return;

    if (defaultDate === undefined) {
      instance.clear();
      return;
    }

    instance.setDate(defaultDate, false);
  }, [defaultDate]);

  return (
    <div>
      {label && <Label htmlFor={id}>{label}</Label>}

      <div className="relative">
        <input
          id={id}
          placeholder={placeholder}
          className="h-11 w-full rounded-lg border appearance-none px-4 py-2.5 text-sm shadow-theme-xs placeholder:text-gray-400 focus:outline-hidden focus:ring-3  dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30  bg-transparent text-gray-800 border-gray-300 focus:border-brand-300 focus:ring-brand-500/20 dark:border-gray-700  dark:focus:border-brand-800"
        />

        <span className="absolute text-gray-500 -translate-y-1/2 pointer-events-none right-3 top-1/2 dark:text-gray-400">
          <CalenderIcon className="size-6" />
        </span>
      </div>
    </div>
  );
}
