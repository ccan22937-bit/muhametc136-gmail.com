// Duolingo-style automated notification service
// Prompts seamlessly on initial entry and schedules daily practice reminders at prime hours (19:30 Akşam Pratiği & 12:30 Öğle Arası).

export interface DailyReminder {
  title: string;
  body: string;
}

const MOTIVATIONAL_REMINDERS: DailyReminder[] = [
  {
    title: '🐊 Sensei Pratik Zamanı! (19:30)',
    body: 'Günün dersini tamamla ve serini koru! 🔥 5 dakikalık pratik hedefine bir adım daha yaklaş.'
  },
  {
    title: '🌟 5 Dakika Ayır, Farkı Gör!',
    body: 'Sensei seni bekliyor! Günlük dersini tamamlayıp yeni seviyenin kilidini aç.'
  },
  {
    title: '🔥 Serin Tehlikede!',
    body: 'Bugün henüz ders yapmadın! Hemen gir ve günlük serini kaybetme.'
  },
  {
    title: '🎯 Dil Öğrenmek Süreklilik İster!',
    body: 'Yeni kelimeler seni bekliyor. Günün alıştırmasını hemen tamamla! 🚀'
  }
];

class NotificationService {
  private isInitialized = false;

  public async init() {
    if (typeof window === 'undefined' || this.isInitialized) return;
    this.isInitialized = true;

    // Register Service Worker first
    if ('serviceWorker' in navigator) {
      try {
        await navigator.serviceWorker.register('/sw.js', { scope: '/' });
      } catch (err) {
        console.warn('SW registration info:', err);
      }
    }

    // Auto-request permission on user entry if default (Duolingo approach)
    this.requestPermissionSilently();
    
    // Schedule exact daily prime hour reminders (e.g., 19:30 evening prime & 12:30 midday)
    this.scheduleFixedTimeReminders();
  }

  public async requestPermissionSilently(): Promise<boolean> {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      return false;
    }

    try {
      if (Notification.permission === 'default') {
        // Wait 2.5 seconds after app opens so user sees the app first, then standard OS prompt appears
        setTimeout(async () => {
          try {
            const permission = await Notification.requestPermission();
            if (permission === 'granted') {
              this.sendWelcomeNotification();
              this.scheduleFixedTimeReminders();
            }
          } catch (e) {
            console.warn('Notification permission request:', e);
          }
        }, 2500);
      } else if (Notification.permission === 'granted') {
        this.scheduleFixedTimeReminders();
        return true;
      }
    } catch (e) {
      console.warn('Notification handling error:', e);
    }
    return false;
  }

  public sendWelcomeNotification() {
    this.showNotification({
      title: '🐊 Sensei Hazır!',
      body: 'Harika! Günlük bildirimlerin aktif. Her gün saat 19:30\'da ve serin tehlikedeyken sana hatırlatacağım! 🔥'
    });
  }

  public async showNotification(reminder: DailyReminder) {
    if (typeof window === 'undefined' || !('Notification' in window) || Notification.permission !== 'granted') {
      return;
    }

    try {
      if ('serviceWorker' in navigator) {
        const registration = await navigator.serviceWorker.ready;
        if (registration && registration.showNotification) {
          await registration.showNotification(reminder.title, {
            body: reminder.body,
            icon: '/icon-192x192.png',
            badge: '/icon-192x192.png',
            tag: 'sensei-daily-reminder',
            renotify: true,
            data: { url: '/' }
          } as unknown as NotificationOptions);
          return;
        }
      }

      // Fallback to standard window Notification
      new Notification(reminder.title, {
        body: reminder.body,
        icon: '/icon-192x192.png'
      });
    } catch (e) {
      console.warn('Could not display notification:', e);
    }
  }

  public scheduleFixedTimeReminders() {
    if (typeof window === 'undefined' || !('Notification' in window) || Notification.permission !== 'granted') {
      return;
    }

    // Schedule for 19:30 (Prime Study Time) and 12:30 (Lunch break)
    this.scheduleForHour(19, 30, 'sensei_evening_reminder');
    this.scheduleForHour(12, 30, 'sensei_noon_reminder');
  }

  private scheduleForHour(targetHour: number, targetMinute: number, storageKey: string) {
    const now = new Date();
    const scheduledTime = new Date();
    scheduledTime.setHours(targetHour, targetMinute, 0, 0);

    // If target hour has already passed today, schedule for tomorrow
    if (now.getTime() >= scheduledTime.getTime()) {
      scheduledTime.setDate(scheduledTime.getDate() + 1);
    }

    const delay = scheduledTime.getTime() - now.getTime();

    setTimeout(() => {
      const todayStr = new Date().toDateString();
      const lastSent = localStorage.getItem(storageKey);
      
      if (lastSent !== todayStr) {
        const randomReminder = MOTIVATIONAL_REMINDERS[Math.floor(Math.random() * MOTIVATIONAL_REMINDERS.length)];
        this.showNotification(randomReminder);
        localStorage.setItem(storageKey, todayStr);
      }

      // Re-schedule for next day
      this.scheduleForHour(targetHour, targetMinute, storageKey);
    }, delay);
  }
}

export const notificationService = new NotificationService();
