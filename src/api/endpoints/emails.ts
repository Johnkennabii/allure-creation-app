import { httpClient } from "../httpClient";

export interface EmailAddress {
  name?: string;
  address: string;
}

export interface EmailAttachment {
  filename: string;
  contentType: string;
  size: number;
  contentId?: string;
}

export interface Email {
  id: string; // UID de l'email
  messageId: string;
  from: EmailAddress[];
  to: EmailAddress[];
  cc?: EmailAddress[];
  bcc?: EmailAddress[];
  subject: string;
  date: string;
  snippet?: string; // Aperçu du contenu
  body?: {
    html?: string;
    text?: string;
  };
  attachments?: EmailAttachment[];
  flags: string[]; // \Seen, \Flagged, etc.
  folder: string; // INBOX, Sent, Trash, Spam
  size: number;
}

export interface EmailFolder {
  name: string;
  displayName: string;
  count: number;
  unseenCount: number;
}

export interface Mailbox {
  name: string;
  displayName: string;
  total: number;
  new: number;
}

export interface MailboxesResponse {
  success: boolean;
  data: Mailbox[];
}

export interface InboxEmailAddress {
  address: string;
  name?: string;
}

export interface InboxEmailAttachment {
  filename: string;
  contentType: string;
  size: number;
  content?: {
    type: string;
    data: number[];
  };
}

export interface InboxEmail {
  id: string;
  uid: number;
  subject: string;
  from: InboxEmailAddress[];
  to: InboxEmailAddress[];
  date: string;
  attachments: InboxEmailAttachment[];
  flags: string[];
  hasAttachments: boolean;
  html?: string;
  text?: string;
}

export interface InboxEmailsResponse {
  success: boolean;
  data: InboxEmail[];
  pagination: {
    limit: number;
    offset: number;
    count: number;
  };
}

export interface EmailListResponse {
  emails: Email[];
  total: number;
  page: number;
  limit: number;
  folder: string;
}

export interface EmailListParams {
  folder?: string; // INBOX, Sent, Trash, Spam
  page?: number;
  limit?: number;
  search?: string;
  unreadOnly?: boolean;
}

export interface SendEmailPayload {
  to: string[]; // Adresses email
  cc?: string[];
  bcc?: string[];
  subject: string;
  body: string; // HTML ou texte
  isHtml?: boolean;
  attachments?: File[];
}

export interface EmailConfig {
  email: string;
  imapHost: string;
  imapPort: number;
  smtpHost: string;
  smtpPort: number;
}

export const EmailsAPI = {
  /**
   * Récupère la liste des mailboxes avec leurs statistiques
   */
  async getMailboxes(): Promise<Mailbox[]> {
    const response: MailboxesResponse = await httpClient.get("/mails/mailboxes");
    return response.data;
  },

  /**
   * Récupère les emails d'une mailbox (inbox par défaut)
   */
  async getInboxEmails(params: { mailbox?: string; limit?: number; offset?: number } = {}): Promise<InboxEmailsResponse> {
    const { mailbox = "inbox", limit = 50, offset = 0 } = params;
    return httpClient.get(`/mails/${mailbox}?limit=${limit}&offset=${offset}`);
  },

  /**
   * Récupère la liste des dossiers (Inbox, Sent, Trash, Spam)
   */
  async getFolders(): Promise<EmailFolder[]> {
    return httpClient.get("/emails/folders");
  },

  /**
   * Récupère la liste des emails d'un dossier
   */
  async list(params: EmailListParams = {}): Promise<EmailListResponse> {
    const queryParams = new URLSearchParams();

    if (params.folder) queryParams.append("folder", params.folder);
    if (params.page) queryParams.append("page", params.page.toString());
    if (params.limit) queryParams.append("limit", params.limit.toString());
    if (params.search) queryParams.append("search", params.search);
    if (params.unreadOnly) queryParams.append("unreadOnly", "true");

    const query = queryParams.toString();
    return httpClient.get(`/emails${query ? `?${query}` : ""}`);
  },

  /**
   * Récupère le contenu complet d'un email
   */
  async get(id: string, folder: string = "INBOX"): Promise<Email> {
    return httpClient.get(`/emails/${id}?folder=${folder}`);
  },

  /**
   * Envoie un nouvel email
   */
  async send(payload: SendEmailPayload): Promise<{ success: boolean; messageId: string }> {
    const formData = new FormData();

    formData.append("to", JSON.stringify(payload.to));
    if (payload.cc) formData.append("cc", JSON.stringify(payload.cc));
    if (payload.bcc) formData.append("bcc", JSON.stringify(payload.bcc));
    formData.append("subject", payload.subject);
    formData.append("body", payload.body);
    formData.append("isHtml", payload.isHtml ? "true" : "false");

    if (payload.attachments) {
      payload.attachments.forEach((file, index) => {
        formData.append(`attachment_${index}`, file);
      });
    }

    return httpClient("/emails/send", {
      method: "POST",
      body: formData,
    });
  },

  /**
   * Marque un email comme lu/non lu
   */
  async markAsRead(id: string, folder: string = "INBOX", read: boolean = true): Promise<void> {
    return httpClient.patch(`/emails/${id}/read`, { folder, read });
  },

  /**
   * Marque un email avec un flag (starred)
   */
  async toggleFlag(id: string, folder: string = "INBOX", flagged: boolean = true): Promise<void> {
    return httpClient.patch(`/emails/${id}/flag`, { folder, flagged });
  },

  /**
   * Déplace un email vers un autre dossier
   */
  async move(id: string, fromFolder: string, toFolder: string): Promise<void> {
    return httpClient.patch(`/emails/${id}/move`, { fromFolder, toFolder });
  },

  /**
   * Supprime définitivement un email
   */
  async delete(id: string, folder: string): Promise<void> {
    return httpClient.delete(`/emails/${id}?folder=${folder}`);
  },

  /**
   * Télécharge une pièce jointe
   */
  async downloadAttachment(emailId: string, attachmentIndex: number, folder: string = "INBOX"): Promise<Blob> {
    const response = await fetch(
      `${httpClient.get.toString().includes('https://api.allure-creation.fr') ? 'https://api.allure-creation.fr' : ''}/emails/${emailId}/attachments/${attachmentIndex}?folder=${folder}`,
      {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      }
    );

    if (!response.ok) {
      throw new Error("Erreur lors du téléchargement de la pièce jointe");
    }

    return response.blob();
  },

  /**
   * Récupère la configuration email de l'utilisateur
   */
  async getConfig(): Promise<EmailConfig> {
    return httpClient.get("/emails/config");
  },
};
