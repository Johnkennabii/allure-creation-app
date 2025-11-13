import { useCallback, useEffect, useMemo, useState } from "react";
import { MoreDotIcon } from "../../icons";
import { Dropdown } from "../ui/dropdown/Dropdown";
import { DropdownItem } from "../ui/dropdown/DropdownItem";
import SpinnerOne from "../ui/spinner/SpinnerOne";
import {
  NotificationsAPI,
  type NotificationData,
} from "../../api/endpoints/notifications";

const TYPE_META: Record<
  NotificationData["type"],
  {
    label: string;
    dotClass: string;
    pillClass: string;
  }
> = {
  CONTRACT_SIGNED: {
    label: "Contrat signé",
    dotClass: "border-primary-500 bg-primary-50 text-primary-600",
    pillClass: "bg-primary-50 text-primary-600 dark:bg-primary-500/10 dark:text-primary-200",
  },
  DRESS_CREATED: {
    label: "Nouvelle robe",
    dotClass: "border-success-500 bg-success-50 text-success-600",
    pillClass: "bg-success-50 text-success-600 dark:bg-success-500/10 dark:text-success-200",
  },
};

const relativeTimeFromNow = (timestamp: string) => {
  const date = new Date(timestamp);
  if (Number.isNaN(date.getTime())) return "-";
  const diffMs = Date.now() - date.getTime();
  const diffMinutes = Math.floor(diffMs / 60000);
  if (diffMinutes < 1) return "À l'instant";
  if (diffMinutes < 60) return `${diffMinutes} min`;
  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) return `${diffHours} h`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 30) return `${diffDays} j`;
  const diffMonths = Math.floor(diffDays / 30);
  if (diffMonths < 12) return `${diffMonths} mois`;
  const diffYears = Math.floor(diffMonths / 12);
  return `${diffYears} an${diffYears > 1 ? "s" : ""}`;
};

export default function ActivitiesCard() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [notifications, setNotifications] = useState<NotificationData[]>([]);
  const [marking, setMarking] = useState(false);
  const [unseenCount, setUnseenCount] = useState(0);

  const fetchNotifications = useCallback(async () => {
    setLoading(true);
    try {
      const [data, unseen] = await Promise.all([
        NotificationsAPI.getAll(),
        NotificationsAPI.getUnseenCount(),
      ]);
      setNotifications(data);
      setUnseenCount(unseen);
    } catch (error) {
      console.error("Impossible de charger les notifications :", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchNotifications();
  }, [fetchNotifications]);

  const markAllAsRead = async () => {
    if (!notifications.length) return;
    setMarking(true);
    try {
      const unseen = notifications.filter((notif) => {
        if (Array.isArray(notif.users) && notif.users.length) {
          return notif.users.some((user) => !user.seen);
        }
        return !notif.seen;
      });
      await Promise.all(unseen.map((notif) => NotificationsAPI.markAsSeen(notif.id)));
      setUnseenCount(0);
      await fetchNotifications();
    } catch (error) {
      console.error("Erreur lors du marquage des notifications :", error);
    } finally {
      setMarking(false);
      setMenuOpen(false);
    }
  };

  const activities = useMemo(() => notifications.slice(0, 6), [notifications]);

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03]">
      <div className="mb-6 flex justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">Notifications</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {loading ? "Chargement..." : unseenCount ? `${unseenCount} non lues` : "Toutes lues"}
          </p>
        </div>
        <div className="relative inline-block">
          <button className="dropdown-toggle" onClick={() => setMenuOpen((prev) => !prev)}>
            <MoreDotIcon className="text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 size-6" />
          </button>
          <Dropdown isOpen={menuOpen} onClose={() => setMenuOpen(false)} className="w-52 p-2">
            <DropdownItem
              onItemClick={() => {
                setMenuOpen(false);
                void fetchNotifications();
              }}
              className="flex w-full font-normal text-left text-gray-500 rounded-lg hover:bg-gray-100 hover:text-gray-700 dark:text-gray-400 dark:hover:bg-white/5 dark:hover:text-gray-300"
            >
              Rafraîchir
            </DropdownItem>
            <DropdownItem
              onItemClick={() => {
                if (marking || unseenCount === 0) return;
                void markAllAsRead();
              }}
              className={`flex w-full font-normal text-left rounded-lg ${
                marking || unseenCount === 0
                  ? "cursor-not-allowed text-gray-400 dark:text-gray-500"
                  : "text-gray-500 hover:bg-gray-100 hover:text-gray-700 dark:text-gray-400 dark:hover:bg-white/5 dark:hover:text-gray-300"
              }`}
            >
              {marking ? "Marquage..." : "Tout marquer comme lu"}
            </DropdownItem>
          </Dropdown>
        </div>
      </div>

      <div className="relative">
        <div className="absolute top-6 bottom-6 left-[22px] w-px bg-gray-200 dark:bg-gray-800" />
        {loading ? (
          <div className="relative flex items-center justify-center py-12">
            <SpinnerOne />
          </div>
        ) : activities.length === 0 ? (
          <div className="relative flex flex-col items-center justify-center py-8 text-center text-sm text-gray-500 dark:text-gray-400">
            <p>Aucune notification disponible.</p>
            <p className="text-xs mt-1 text-gray-400 dark:text-gray-500">
              Les actions notifiées (création, signature, etc.) apparaîtront ici.
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {activities.map((activity) => {
              const meta = TYPE_META[activity.type];
              return (
                <div key={activity.id} className="relative flex items-start gap-4">
                  <div
                    className={`relative z-10 flex size-11 items-center justify-center rounded-full border-2 ${
                      meta?.dotClass ?? "border-gray-300 bg-gray-50 text-gray-500"
                    }`}
                  >
                    <span className="text-xs font-semibold uppercase">
                      {activity.type.charAt(0)}
                    </span>
                  </div>
                  <div className="flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      {meta ? (
                        <span
                          className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs ${
                            meta.pillClass
                          }`}
                        >
                          {meta.label}
                        </span>
                      ) : null}
                      <p className="text-sm font-semibold text-gray-800 dark:text-white/90">{activity.title}</p>
                    </div>
                    <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">{activity.message}</p>
                    {activity.meta?.reference ? (
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        Référence : {activity.meta.reference}
                      </p>
                    ) : null}
                    <p className="mt-1 text-xs text-gray-400 dark:text-gray-500">
                      {relativeTimeFromNow(activity.created_at)}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
