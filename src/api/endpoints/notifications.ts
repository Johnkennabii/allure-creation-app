import { httpClient } from "../httpClient";

export interface NotificationData {
  id: string;
  type: "CONTRACT_SIGNED" | "DRESS_CREATED";
  title: string;
  message: string;
  created_at: string;
  seen: boolean;
  reference?: string | null;
  contract_number?: string | null;
  contract_id?: string | null;
  creator_id?: string | null;
  creator_first_name?: string | null;
  creator_last_name?: string | null;
  customer_id?: string | null;
  customer_first_name?: string | null;
  customer_last_name?: string | null;
}

export interface NotificationResponse {
  success: boolean;
  data: NotificationData[];
}

export const NotificationsAPI = {
  /**
   * Récupère toutes les notifications (30 dernières)
   */
  getAll: async (): Promise<NotificationData[]> => {
    const res = await httpClient.get("/notifications");
    if (res?.data && Array.isArray(res.data)) {
      return res.data as NotificationData[];
    }
    if (Array.isArray(res)) {
      return res as NotificationData[];
    }
    return [];
  },

  /**
   * Marque une notification comme vue
   */
  markAsSeen: async (notificationId: string): Promise<NotificationData> => {
    const res = await httpClient.patch(`/notifications/${notificationId}/seen`, {});
    if (res?.data && typeof res.data === "object") {
      return res.data as NotificationData;
    }
    return res as NotificationData;
  },
};
