import { calculateCycle } from './calculations';
import { getProfileFromIDB, getLastNotification, logNotificationSent } from './db';
import { differenceInDays, startOfDay } from 'date-fns';

export const triggerLocalNotification = (title: string, body: string, tag: string) => {
  if (Notification.permission === 'granted') {
    // If we are in the Service Worker context
    // Cast self to any to access registration without TS errors on Window context
    const swSelf = self as any;
    if (swSelf.registration && 'showNotification' in swSelf.registration) {
      swSelf.registration.showNotification(title, {
        body,
        icon: '/kimi_192.svg',
        tag,
        badge: '/kimi_192.svg',
        vibrate: [200, 100, 200]
      } as any); // Cast options to any to avoid strict type checks on vibrate
    } else {
      // If we are in the Window context
      new Notification(title, {
        body,
        icon: '/kimi_192.svg',
        tag,
        vibrate: [200, 100, 200]
      } as any); // Cast options to any
    }
  }
};

export const checkPeriodicNotifications = async () => {
  try {
    const profile = await getProfileFromIDB();
    if (!profile || !profile.cycle) return;

    const calc = calculateCycle(profile.cycle, profile.user);
    if (!calc) return;

    const today = startOfDay(new Date());
    const daysLeft = differenceInDays(calc.nextPeriodDate, today);
    const userName = profile.user.name.split(' ')[0]; // First name

    // --- Rule 1: 7 Days Before Period ---
    // Condition: daysLeft <= 7 AND daysLeft > 4
    if (daysLeft <= 7 && daysLeft > 4) {
      const lastSent = await getLastNotification('PRE_PERIOD_7');
      // Limit to once every 24 hours
      if (!lastSent || (Date.now() - lastSent > 24 * 60 * 60 * 1000)) {
        triggerLocalNotification(
          "Your next period is coming",
          `Hi ${userName}, gentle reminder that your period may start in about ${daysLeft} days. Stay hydrated.`,
          "period-warning-7"
        );
        await logNotificationSent('PRE_PERIOD_7');
      }
    }

    // --- Rule 2: 4 Days Left (Buy Pads) ---
    // Condition: daysLeft <= 4 && daysLeft >= 0
    if (daysLeft <= 4 && daysLeft >= 0) {
      const lastSent = await getLastNotification('PRE_PERIOD_4');
      // Limit to once every 24 hours
      if (!lastSent || (Date.now() - lastSent > 24 * 60 * 60 * 1000)) {
        triggerLocalNotification(
          "Preparation Reminder",
          "Your period might start very soon. Please remember to buy sanitary pads so you’re prepared.",
          "period-warning-4"
        );
        await logNotificationSent('PRE_PERIOD_4');
      }
    }

  } catch (err) {
    console.error("Scheduler Error:", err);
  }
};

export const checkMoodTrigger = (moods: string[], symptoms: string[]) => {
  const triggerMoods = ['Anxious', 'Irritable', 'Sad'];
  const triggerSymptoms = ['Tender Breasts', 'Cramps', 'Food Craving'];

  const hasMood = moods.some(m => triggerMoods.includes(m));
  const hasSymptom = symptoms.some(s => triggerSymptoms.includes(s));

  if (hasMood || hasSymptom) {
    triggerLocalNotification(
      "A little comfort for today",
      `Looks like you're experiencing some discomfort. Try treating yourself to a little chocolate or rest. You deserve kindness.`,
      "mood-support"
    );
  }
};