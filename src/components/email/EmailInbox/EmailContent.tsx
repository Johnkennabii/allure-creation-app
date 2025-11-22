import { useState, useEffect } from "react";
import EmailHeader from "./EmailHeader";
import EmailPagination from "./EmailPagination";
import Checkbox from "../../form/input/Checkbox";
import SimpleBar from "simplebar-react";
import { EmailsAPI, InboxEmail } from "../../../api/endpoints/emails";

interface EmailContentProps {
  selectedMailbox: string;
}

export default function EmailContent({ selectedMailbox }: EmailContentProps) {
  const [emails, setEmails] = useState<InboxEmail[]>([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ limit: 50, offset: 0, count: 0 });
  const [checkedItems, setCheckedItems] = useState<boolean[]>([]);
  const [starredItems, setStarredItems] = useState<boolean[]>([]);

  useEffect(() => {
    const fetchEmails = async () => {
      try {
        setLoading(true);
        const response = await EmailsAPI.getInboxEmails({
          mailbox: selectedMailbox,
          limit: pagination.limit,
          offset: pagination.offset,
        });
        setEmails(response.data);
        setPagination(response.pagination);
        setCheckedItems(new Array(response.data.length).fill(false));

        // Initialiser starredItems en fonction du flag \\Flagged
        const starred = response.data.map(email => email.flags.includes("\\Flagged"));
        setStarredItems(starred);
      } catch (error) {
        console.error("Erreur lors de la récupération des emails:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchEmails();
  }, [selectedMailbox, pagination.limit, pagination.offset]);

  const toggleCheck = (index: number, checked: boolean) => {
    const updated = [...checkedItems];
    updated[index] = checked;
    setCheckedItems(updated);
  };

  const toggleStar = (index: number) => {
    const updated = [...starredItems];
    updated[index] = !updated[index];
    setStarredItems(updated);
    // TODO: Appeler l'API pour mettre à jour le flag
  };

  const handleSelectAll = (checked: boolean) => {
    setCheckedItems(new Array(emails.length).fill(checked));
  };

  const allChecked = checkedItems.every(Boolean);

  // Formater la date
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 1) {
      return date.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
    } else if (diffDays < 7) {
      return date.toLocaleDateString("fr-FR", { month: "short", day: "numeric" });
    } else {
      return date.toLocaleDateString("fr-FR", { month: "short", day: "numeric" });
    }
  };

  // Extraire un extrait du texte ou HTML
  const getEmailSnippet = (email: InboxEmail): string => {
    const text = email.text || email.html || "";
    return text.replace(/<[^>]*>/g, "").substring(0, 120) + "...";
  };

  if (loading) {
    return (
      <div className="rounded-2xl xl:col-span-9 w-full border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
        <div className="flex items-center justify-center py-20">
          <div className="text-sm text-gray-500 dark:text-gray-400">Chargement des emails...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-2xl xl:col-span-9 w-full border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
      <EmailHeader isChecked={allChecked} onSelectAll={handleSelectAll} />
      <SimpleBar className="max-h-[510px] 2xl:max-h-[630px]">
        <div className="divide-y divide-gray-200 dark:divide-gray-800">
          {emails.length === 0 ? (
            <div className="flex items-center justify-center py-20">
              <div className="text-sm text-gray-500 dark:text-gray-400">Aucun email trouvé</div>
            </div>
          ) : (
            emails.map((email, index) => {
              const isUnread = !email.flags.includes("\\Seen");
              const sender = email.from[0]?.name || email.from[0]?.address || "Inconnu";

              return (
                <div
                  key={email.uid}
                  className={`flex cursor-pointer items-center px-4 py-4 hover:bg-gray-100 dark:border-gray-800 dark:hover:bg-white/[0.03] ${
                    isUnread ? "bg-blue-50/50 dark:bg-blue-900/10" : ""
                  }`}
                >
                  {/* Left Section */}
                  <div className="flex items-center w-1/5">
                    {/* Custom Checkbox */}
                    <Checkbox
                      checked={checkedItems[index]}
                      onChange={(checked) => toggleCheck(index, checked)}
                    />

                    {/* Star */}
                    <span
                      className="ml-3 text-gray-400 cursor-pointer"
                      onClick={() => toggleStar(index)}
                    >
                      {starredItems[index] ? (
                        <svg
                          width="20"
                          height="20"
                          viewBox="0 0 20 20"
                          fill="#FDB022"
                          xmlns="http://www.w3.org/2000/svg"
                        >
                          <path d="M9.99991 3.125L12.2337 7.65114L17.2286 8.37694L13.6142 11.9L14.4675 16.8747L9.99991 14.526L5.53235 16.8747L6.38558 11.9L2.77124 8.37694L7.76613 7.65114L9.99991 3.125Z" />
                        </svg>
                      ) : (
                        <svg
                          width="20"
                          height="20"
                          viewBox="0 0 20 20"
                          fill="none"
                          xmlns="http://www.w3.org/2000/svg"
                        >
                          <path
                            fillRule="evenodd"
                            clipRule="evenodd"
                            d="M9.99993 2.375C10.2854 2.375 10.5461 2.53707 10.6725 2.79308L12.7318 6.96563L17.3365 7.63473C17.619 7.67578 17.8537 7.87367 17.9419 8.14517C18.0301 8.41668 17.9565 8.71473 17.7521 8.914L14.4201 12.1619L15.2067 16.748C15.255 17.0293 15.1393 17.3137 14.9083 17.4815C14.6774 17.6493 14.3712 17.6714 14.1185 17.5386L9.99993 15.3733L5.88137 17.5386C5.62869 17.6714 5.32249 17.6493 5.09153 17.4815C4.86057 17.3137 4.7449 17.0293 4.79316 16.748L5.57974 12.1619L2.24775 8.914C2.04332 8.71473 1.96975 8.41668 2.05797 8.14517C2.14619 7.87367 2.3809 7.67578 2.66341 7.63473L7.2681 6.96563L9.32738 2.79308C9.45373 2.53707 9.71445 2.375 9.99993 2.375ZM9.99993 4.81966L8.4387 7.98306C8.32946 8.20442 8.11828 8.35785 7.874 8.39334L4.38298 8.90062L6.90911 11.363C7.08587 11.5353 7.16653 11.7835 7.1248 12.0268L6.52847 15.5037L9.65093 13.8622C9.86942 13.7473 10.1304 13.7473 10.3489 13.8622L13.4714 15.5037L12.8751 12.0268C12.8333 11.7835 12.914 11.5353 13.0908 11.363L15.6169 8.90062L12.1259 8.39334C11.8816 8.35785 11.6704 8.20442 11.5612 7.98306L9.99993 4.81966Z"
                            fill="currentColor"
                          />
                        </svg>
                      )}
                    </span>

                    {/* Sender */}
                    <span className={`ml-3 text-sm truncate ${isUnread ? "font-semibold text-gray-900 dark:text-white" : "text-gray-700 dark:text-gray-400"}`}>
                      {sender}
                    </span>
                  </div>

                  {/* Middle Section */}
                  <div className="flex items-center w-3/5 gap-3">
                    <div className="flex-1 truncate">
                      <span className={`text-sm ${isUnread ? "font-semibold text-gray-900 dark:text-white" : "text-gray-700 dark:text-gray-400"}`}>
                        {email.subject || "(Sans sujet)"}
                      </span>
                      <span className="ml-2 text-sm text-gray-500 dark:text-gray-400">
                        - {getEmailSnippet(email)}
                      </span>
                    </div>
                    {email.hasAttachments && (
                      <span className="flex-shrink-0">
                        <svg
                          className="fill-current text-gray-400"
                          width="16"
                          height="16"
                          viewBox="0 0 20 20"
                          fill="none"
                          xmlns="http://www.w3.org/2000/svg"
                        >
                          <path
                            fillRule="evenodd"
                            clipRule="evenodd"
                            d="M10.6685 12.035C10.6685 12.044 10.6686 12.0529 10.6689 12.0617V13.4533C10.6689 13.8224 10.3697 14.1216 10.0006 14.1216C9.63155 14.1216 9.33235 13.8224 9.33235 13.4533V5.12807C9.33235 4.71385 8.99657 4.37807 8.58235 4.37807C8.16814 4.37807 7.83235 4.71385 7.83235 5.12807V13.4533C7.83235 14.6508 8.80313 15.6216 10.0006 15.6216C11.1981 15.6216 12.1689 14.6508 12.1689 13.4533V5.12807C12.1689 5.11803 12.1687 5.10804 12.1683 5.09811C12.1522 3.1311 10.5527 1.5415 8.58189 1.5415C6.60108 1.5415 4.99532 3.14727 4.99532 5.12807L4.99532 12.035C4.99532 12.0414 4.9954 12.0477 4.99556 12.0539V13.4533C4.99556 16.2174 7.2363 18.4582 10.0004 18.4582C12.7645 18.4582 15.0053 16.2174 15.0053 13.4533V7.96463C15.0053 7.55042 14.6695 7.21463 14.2553 7.21463C13.841 7.21463 13.5053 7.55042 13.5053 7.96463V13.4533C13.5053 15.389 11.9361 16.9582 10.0004 16.9582C8.06473 16.9582 6.49556 15.389 6.49556 13.4533V7.96463C6.49556 7.95832 6.49548 7.95202 6.49532 7.94574L6.49532 5.12807C6.49532 3.97569 7.42951 3.0415 8.58189 3.0415C9.73427 3.0415 10.6685 3.97569 10.6685 5.12807L10.6685 12.035Z"
                            fill=""
                          />
                        </svg>
                      </span>
                    )}
                  </div>

                  {/* Right Section */}
                  <div className="w-1/5 text-right">
                    <span className="block text-xs text-gray-400">{formatDate(email.date)}</span>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </SimpleBar>
      <EmailPagination />
    </div>
  );
}
