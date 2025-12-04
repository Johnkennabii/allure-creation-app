import { useState } from "react";
import { useNotification } from "../../context/NotificationContext";
import { EmailsAPI } from "../../api/endpoints/emails";
import Button from "../ui/button/Button";

interface EmailReplyModalProps {
  emailUid: number;
  mailbox: string;
  mode: "reply" | "reply-all" | "forward";
  onClose: () => void;
  onSuccess: () => void;
}

export default function EmailReplyModal({
  emailUid,
  mailbox,
  mode,
  onClose,
  onSuccess,
}: EmailReplyModalProps) {
  const { notify } = useNotification();
  const [body, setBody] = useState("");
  const [to, setTo] = useState(""); // For forward only
  const [loading, setLoading] = useState(false);

  const getTitle = () => {
    switch (mode) {
      case "reply":
        return "Répondre";
      case "reply-all":
        return "Répondre à tous";
      case "forward":
        return "Transférer";
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!body.trim()) {
      notify("error", "Erreur", "Le message ne peut pas être vide");
      return;
    }

    if (mode === "forward" && !to.trim()) {
      notify("error", "Erreur", "Veuillez saisir une adresse email");
      return;
    }

    setLoading(true);
    try {
      let response;

      if (mode === "reply") {
        response = await EmailsAPI.reply(emailUid, mailbox, {
          body: `<p>${body.replace(/\n/g, "<br>")}</p>`,
          bodyText: body,
        });
      } else if (mode === "reply-all") {
        response = await EmailsAPI.replyAll(emailUid, mailbox, {
          body: `<p>${body.replace(/\n/g, "<br>")}</p>`,
          bodyText: body,
        });
      } else {
        response = await EmailsAPI.forward(emailUid, mailbox, {
          to,
          message: `<p>${body.replace(/\n/g, "<br>")}</p>`,
          messageText: body,
          includeAttachments: true,
        });
      }

      if (response.success) {
        notify("success", "Succès", response.message || "Email envoyé avec succès");
        onSuccess();
        onClose();
      } else {
        throw new Error(response.error || "Erreur lors de l'envoi");
      }
    } catch (error: any) {
      console.error("Erreur:", error);
      notify(
        "error",
        "Erreur",
        error.message || "Impossible d'envoyer l'email"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div
        className="fixed inset-0 z-50 bg-gray-900/50 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="relative w-full max-w-2xl rounded-2xl border border-gray-200 bg-white shadow-xl dark:border-gray-800 dark:bg-gray-900">
          <div className="flex items-center justify-between border-b border-gray-200 p-6 dark:border-gray-800">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              {getTitle()}
            </h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            >
              <svg
                className="h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>

          <form onSubmit={handleSubmit} className="p-6">
            {mode === "forward" && (
              <div className="mb-4">
                <label
                  htmlFor="to"
                  className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300"
                >
                  Destinataire
                </label>
                <input
                  id="to"
                  type="email"
                  value={to}
                  onChange={(e) => setTo(e.target.value)}
                  placeholder="exemple@email.com"
                  required
                  className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm text-gray-900 focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                />
              </div>
            )}

            <div className="mb-4">
              <label
                htmlFor="body"
                className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300"
              >
                Message
              </label>
              <textarea
                id="body"
                value={body}
                onChange={(e) => setBody(e.target.value)}
                placeholder="Tapez votre message ici..."
                rows={10}
                required
                className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm text-gray-900 focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
              />
            </div>

            <div className="flex justify-end gap-3">
              <Button
                type="button"
                onClick={onClose}
                variant="outline"
                disabled={loading}
              >
                Annuler
              </Button>
              <Button type="submit" variant="primary" disabled={loading}>
                {loading ? "Envoi..." : "Envoyer"}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}
