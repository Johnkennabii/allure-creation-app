import { getDailyQuote } from "../data/islamicQuotes";

export default function SidebarWidget() {
  const dailyQuote = getDailyQuote();

  return (
    <div
      className={`
        mx-auto mb-10 w-full max-w-60 rounded-2xl bg-gray-50 px-4 py-5 dark:bg-white/[0.03]`}
    >
      <h3 className="mb-3 font-semibold text-gray-900 dark:text-white">
        Phrase du jour
      </h3>
      <p className="mb-3 text-sm italic leading-relaxed text-gray-700 dark:text-gray-300">
        "{dailyQuote.text}"
      </p>
      <p className="text-xs font-medium text-brand-600 dark:text-brand-400">
        — {dailyQuote.source}
      </p>
    </div>
  );
}
