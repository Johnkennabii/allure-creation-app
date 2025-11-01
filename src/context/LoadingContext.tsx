import  { createContext, useContext, useState, ReactNode } from "react";
import SpinnerOne from "../components/ui/spinner/SpinnerOne";

interface LoadingContextType {
  loading: boolean;
  show: () => void;
  hide: () => void;
}

const LoadingContext = createContext<LoadingContextType | null>(null);

export const LoadingProvider = ({ children }: { children: ReactNode }) => {
  const [loading, setLoading] = useState(false);

  const show = () => setLoading(true);
  const hide = () => setLoading(false);

  return (
    <LoadingContext.Provider value={{ loading, show, hide }}>
      {children}

      {/* Spinner global centré */}
      {loading && (
        <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-white/70 dark:bg-gray-900/70 backdrop-blur-sm">
          <SpinnerOne />
        </div>
      )}
    </LoadingContext.Provider>
  );
};

export const useLoading = () => {
  const ctx = useContext(LoadingContext);
  if (!ctx) throw new Error("useLoading must be used within a LoadingProvider");
  return ctx;
};