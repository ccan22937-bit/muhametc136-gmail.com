// Local Notification & Daily Reminder Engine for Sensei

export interface NotificationSchedule {
  time: string; // HH:mm
  title: string;
  body: string;
}

export const DAILY_NOTIFICATIONS: NotificationSchedule[] = [
  {
    time: "10:00",
    title: "🐊 Günaydın! Sensei Seni Bekliyor",
    body: "Hadi bakalım sabah oldu! Güne 5 dakikalık pratikle başla, serini koru!"
  },
  {
    time: "14:00",
    title: "⚡ Öğle Enerjisi: Sen Başarırsın!",
    body: "Küçük bir tekrar senin için büyük bir adım. Bu senin geleceğin için, hadi bir ders yapalım!"
  },
  {
    time: "20:30",
    title: "🌙 Akşam Hedefi: Günün Pratiğini Tamamla!",
    body: "Günün serisini kaybetmek istemezsin! Sensei ile son bir ders yapıp günü şampiyon bitir."
  }
];

export async function requestNotificationPermission(): Promise<boolean> {
  if (!('Notification' in window)) {
    console.log('Bu cihaz tarayıcısı bildirimleri desteklemiyor.');
    return false;
  }

  try {
    const permission = await Notification.requestPermission();
    if (permission === 'granted') {
      localStorage.setItem('sensei_notifications_enabled', 'true');
      scheduleDailyNotifications();
      return true;
    }
  } catch (error) {
    console.error('Bildirim izni alınamadı:', error);
  }
  return false;
}

export function isNotificationEnabled(): boolean {
  return localStorage.getItem('sensei_notifications_enabled') === 'true' &&
    typeof Notification !== 'undefined' &&
    Notification.permission === 'granted';
}

export function sendInstantNotification(title: string, body: string) {
  if (!isNotificationEnabled()) return;

  try {
    if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
      navigator.serviceWorker.ready.then(registration => {
        registration.showNotification(title, {
          body,
          icon: '/logo.png',
          badge: '/logo.png',
          vibrate: [200, 100, 200]
        } as NotificationOptions);
      });
    } else {
      new Notification(title, {
        body,
        icon: '/logo.png'
      });
    }
  } catch (e) {
    console.log('Bildirim gönderme hatası:', e);
  }
}

// Check every minute if it is time to trigger local notifications
export function startNotificationScheduler() {
  if (typeof window === 'undefined') return;

  setInterval(() => {
    if (!isNotificationEnabled()) return;

    const now = new Date();
    const currentHours = String(now.getHours()).padStart(2, '0');
    const currentMinutes = String(now.getMinutes()).padStart(2, '0');
    const currentTimeStr = `${currentHours}:${currentMinutes}`;
    const todayDateStr = now.toISOString().split('T')[0];

    DAILY_NOTIFICATIONS.forEach((item, index) => {
      if (item.time === currentTimeStr) {
        const lastSentKey = `sensei_notif_sent_${index}_${todayDateStr}`;
        if (!localStorage.getItem(lastSentKey)) {
          sendInstantNotification(item.title, item.body);
          localStorage.setItem(lastSentKey, 'true');
        }
      }
    });
  }, 30000); // check every 30s
}

export function scheduleDailyNotifications() {
  startNotificationScheduler();
}
