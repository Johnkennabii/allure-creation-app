import { useEffect, useState, useCallback } from "react";
import { io } from "socket.io-client";
import { NotificationsAPI, type NotificationData } from "../api/endpoints/notifications";

const SOCKET_URL = "https://api.allure-creation.fr";

export interface Notification {
  id: string;
  type: "CONTRACT_SIGNED" | "DRESS_CREATED";
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  reference?: string;
  contractNumber?: string;
  contractId?: string;
  creator?: {
    id: string | null;
    firstName?: string;
    lastName?: string;
  };
  customer?: {
    id: string;
    firstName?: string;
    lastName?: string;
  };
}

// Convertit une notification backend en notification frontend
function mapBackendNotification(backendNotif: NotificationData): Notification {
  return {
    id: backendNotif.id,
    type: backendNotif.type,
    title: backendNotif.title,
    message: backendNotif.message,
    timestamp: backendNotif.created_at,
    read: backendNotif.seen,
    reference: backendNotif.reference || undefined,
    contractNumber: backendNotif.contract_number || undefined,
    contractId: backendNotif.contract_id || undefined,
    creator: backendNotif.creator_id
      ? {
          id: backendNotif.creator_id,
          firstName: backendNotif.creator_first_name || undefined,
          lastName: backendNotif.creator_last_name || undefined,
        }
      : undefined,
    customer: backendNotif.customer_id
      ? {
          id: backendNotif.customer_id,
          firstName: backendNotif.customer_first_name || undefined,
          lastName: backendNotif.customer_last_name || undefined,
        }
      : undefined,
  };
}

export function useSocketNotifications() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  // Charger les notifications existantes au démarrage
  useEffect(() => {
    const loadNotifications = async () => {
      try {
        const backendNotifications = await NotificationsAPI.getAll();
        const mappedNotifications = backendNotifications.map(mapBackendNotification);
        setNotifications(mappedNotifications);
      } catch (error) {
        console.error("❌ Erreur lors du chargement des notifications:", error);
      } finally {
        setLoading(false);
      }
    };

    loadNotifications();
  }, []);

  // Connexion Socket.IO pour les notifications en temps réel
  useEffect(() => {
    const socket = io(SOCKET_URL, { transports: ["websocket"] });

    socket.on("connect", () => console.log("🔗 Connecté à Socket.IO"));

    socket.on("notification", (notif: Omit<Notification, "id" | "read">) => {
      const newNotification: Notification = {
        ...notif,
        id: `${Date.now()}-${Math.random()}`,
        read: false,
      };
      setNotifications((prev) => [newNotification, ...prev]);
    });

    socket.on("disconnect", () => console.log("❌ Déconnecté de Socket.IO"));

    return () => {
      socket.disconnect();
    };
  }, []);

  const markAsRead = useCallback(async (notificationId: string) => {
    // Mettre à jour localement d'abord pour une meilleure UX
    setNotifications((prev) =>
      prev.map((notif) =>
        notif.id === notificationId ? { ...notif, read: true } : notif
      )
    );

    // Synchroniser avec le backend
    try {
      await NotificationsAPI.markAsSeen(notificationId);
    } catch (error) {
      console.error("❌ Erreur lors du marquage de la notification:", error);
      // Revenir en arrière en cas d'erreur
      setNotifications((prev) =>
        prev.map((notif) =>
          notif.id === notificationId ? { ...notif, read: false } : notif
        )
      );
    }
  }, []);

  const markAllAsRead = useCallback(async () => {
    const unreadNotifications = notifications.filter((n) => !n.read);

    // Mettre à jour localement d'abord
    setNotifications((prev) =>
      prev.map((notif) => ({ ...notif, read: true }))
    );

    // Synchroniser avec le backend
    try {
      await Promise.all(
        unreadNotifications.map((notif) => NotificationsAPI.markAsSeen(notif.id))
      );
    } catch (error) {
      console.error("❌ Erreur lors du marquage des notifications:", error);
    }
  }, [notifications]);

  const clearNotification = useCallback((notificationId: string) => {
    setNotifications((prev) =>
      prev.filter((notif) => notif.id !== notificationId)
    );
  }, []);

  const clearAllNotifications = useCallback(() => {
    setNotifications([]);
  }, []);

  const unreadCount = notifications.filter((n) => !n.read).length;

  return {
    notifications,
    unreadCount,
    loading,
    markAsRead,
    markAllAsRead,
    clearNotification,
    clearAllNotifications,
  };
}
