import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export const registerForPushNotificationsAsync = async () => {
  let token;

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('water-reminders', {
      name: 'Water Reminders',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#2196F3',
    });
  }

  if (Device.isDevice) {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    if (finalStatus !== 'granted') {
      alert('Failed to get push token for push notification!');
      return;
    }
  }

  return token;
};

export const scheduleWaterReminders = async (
  wakeTime: string,
  sleepTime: string,
  dailyGoal: number,
  glassSize: number,
  language: string = 'es'
) => {
  // Cancelar notificaciones existentes
  await Notifications.cancelAllScheduledNotificationsAsync();

  const [wakeHour, wakeMin] = wakeTime.split(':').map(Number);
  const [sleepHour, sleepMin] = sleepTime.split(':').map(Number);
  
  const wakeMinutes = wakeHour * 60 + wakeMin;
  const sleepMinutes = sleepHour * 60 + sleepMin;
  const awakeMinutes = sleepMinutes - wakeMinutes;
  
  const glassesNeeded = Math.ceil(dailyGoal / glassSize);
  const intervalMinutes = Math.max(30, Math.floor(awakeMinutes / glassesNeeded));

  const messages = {
    es: [
      '💧 ¡Hora de hidratarte! Tu cuerpo te lo agradecerá',
      '🥤 Es momento de beber agua. ¡Mantente hidratado!',
      '💦 Recordatorio: Bebe un vaso de agua ahora',
      '🌊 Tu salud es importante. ¡Hidrátate!',
      '💧 ¡No olvides beber agua! Tu meta diaria te espera'
    ],
    en: [
      '💧 Time to hydrate! Your body will thank you',
      '🥤 Time to drink water. Stay hydrated!',
      '💦 Reminder: Drink a glass of water now',
      '🌊 Your health matters. Hydrate yourself!',
      '💧 Don\'t forget to drink water! Your daily goal awaits'
    ]
  };

  // Programar notificaciones para los próximos 7 días
  for (let day = 0; day < 7; day++) {
    for (let reminder = 0; reminder < glassesNeeded; reminder++) {
      const reminderTime = wakeMinutes + (reminder * intervalMinutes);
      const reminderHour = Math.floor(reminderTime / 60);
      const reminderMin = reminderTime % 60;

      if (reminderHour >= sleepHour) break;

      const trigger = new Date();
      trigger.setDate(trigger.getDate() + day);
      trigger.setHours(reminderHour, reminderMin, 0, 0);

      const messageList = messages[language as keyof typeof messages] || messages.es;
      const randomMessage = messageList[Math.floor(Math.random() * messageList.length)];

      await Notifications.scheduleNotificationAsync({
        content: {
          title: language === 'en' ? 'Glup Water Reminder' : 'Recordatorio Glup',
          body: randomMessage,
          sound: true,
          priority: Notifications.AndroidNotificationPriority.HIGH,
        },
        trigger,
      });
    }
  }
};

export const cancelAllReminders = async () => {
  await Notifications.cancelAllScheduledNotificationsAsync();
};