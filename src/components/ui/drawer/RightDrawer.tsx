import type React from "react";
import { Fragment, useEffect } from "react";
import { createPortal } from "react-dom";

type RightDrawerProps = {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
  children: React.ReactNode;
  widthClassName?: string;
  footer?: React.ReactNode;
  closeOnBackdropClick?: boolean;
};

const drawerRoot =
  typeof window !== "undefined"
    ? (document.getElementById("drawer-root") as HTMLElement) ??
      (() => {
        const el = document.createElement("div");
        el.id = "drawer-root";
        document.body.appendChild(el);
        return el;
      })()
    : null;

export default function RightDrawer({
  isOpen,
  onClose,
  title,
  description,
  children,
  widthClassName = "w-full max-w-xl",
  footer,
  closeOnBackdropClick = true,
}: RightDrawerProps) {
  useEffect(() => {
    if (!drawerRoot || !isOpen) return undefined;
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, [isOpen]);

  if (!drawerRoot) return null;

  return createPortal(
    <Fragment>
      <div
        className={`fixed inset-0 z-[100000] transition ${
          isOpen ? "pointer-events-auto" : "pointer-events-none"
        }`}
      >
        <div
          className={`absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity duration-300 ${
            isOpen ? "opacity-100" : "opacity-0"
          }`}
          aria-hidden="true"
          onClick={() => (closeOnBackdropClick && isOpen ? onClose() : undefined)}
        />

        <aside
          className={`absolute right-0 top-0 h-full transform bg-white shadow-2xl transition-all duration-300 ease-in-out dark:bg-gray-900 ${
            isOpen ? "translate-x-0" : "translate-x-full"
          } ${widthClassName}`}
          role="dialog"
          aria-modal="true"
        >
          <div className="flex h-full flex-col">
            <header className="flex items-start justify-between border-b border-gray-200 px-6 py-5 dark:border-gray-800">
              <div className="space-y-1">
                {title ? (
                  <h2 className="text-lg font-semibold text-gray-800 dark:text-white/90">{title}</h2>
                ) : null}
                {description ? (
                  <p className="text-sm text-gray-500 dark:text-gray-400">{description}</p>
                ) : null}
              </div>
              <button
                type="button"
                onClick={onClose}
                className="inline-flex size-9 items-center justify-center rounded-full border border-gray-200 text-gray-500 transition hover:bg-gray-100 hover:text-gray-700 dark:border-gray-700 dark:text-gray-400 dark:hover:bg-white/10 dark:hover:text-gray-200"
                aria-label="Fermer"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={1.5}
                  stroke="currentColor"
                  className="size-5"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                </svg>
              </button>
            </header>

            <div className="flex-1 overflow-y-auto px-6 py-5">{children}</div>

            {footer ? (
              <footer className="border-t border-gray-200 px-6 py-4 dark:border-gray-800">
                {footer}
              </footer>
            ) : null}
          </div>
        </aside>
      </div>
    </Fragment>,
    drawerRoot,
  );
}
