import React, { createContext, useState, useMemo, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Vibration } from 'react-native';
import { registerForPushNotificationsAsync, scheduleWaterReminders } from '../utils/notifications';

export type Drink = {
  id: number;
  time: string;
  amount: number; // liters
  hour: number;
};

type ContextType = {
  drinks: Drink[];
  addDrink: (amount: number) => void;
  deleteDrink: (id: number) => void;
  currentGlassSize: number;
  adjustGlassSize: (delta: number) => void;
  dailyGoal: number;
  setDailyGoal: (v: number) => void;
  lastAdded: number | null;
  // Configuraciones
  userName: string;
  setUserName: (name: string) => void;
  language: string;
  setLanguage: (lang: string) => void;
  soundEnabled: boolean;
  setSoundEnabled: (enabled: boolean) => void;
  soundType: string;
  setSoundType: (type: string) => void;
  isFirstTime: boolean;
  setIsFirstTime: (value: boolean) => void;
  wakeTime: string;
  setWakeTime: (time: string) => void;
  sleepTime: string;
  setSleepTime: (time: string) => void;
  reminderEnabled: boolean;
  setDrinks: (drinks: Drink[]) => void;
};

export const DrinkContext = createContext<ContextType | null>(null);

export const DrinkProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [drinks, setDrinks] = useState<Drink[]>([]);
  const [currentGlassSize, setCurrentGlassSize] = useState<number>(0.2); // liters
  const [dailyGoal, setDailyGoal] = useState<number>(2.5);
  const [lastAdded, setLastAdded] = useState<number | null>(null);
  
  // Configuraciones de usuario
  const [userName, setUserName] = useState<string>('Usuario');
  const [language, setLanguage] = useState<string>('es');
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [soundType, setSoundType] = useState<string>('glup');
  const [isFirstTime, setIsFirstTime] = useState<boolean>(true);
  const [wakeTime, setWakeTime] = useState<string>('07:00');
  const [sleepTime, setSleepTime] = useState<string>('22:00');
  const [reminderEnabled, setReminderEnabled] = useState<boolean>(true);

  const addDrink = (amount: number) => {
    const now = new Date();
    const time = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const d: Drink = { id: Date.now(), time, amount, hour: now.getHours() };
    setDrinks(prev => [d, ...prev]);
    // Feedback: vibration + lastAdded flag
    try { Vibration.vibrate(60); } catch {}
    setLastAdded(Math.round(amount * 1000));
    setTimeout(() => setLastAdded(null), 1100);
  };

  const deleteDrink = (id: number) => setDrinks(prev => prev.filter(d => d.id !== id));

  const adjustGlassSize = (delta: number) => {
    setCurrentGlassSize(prev => Math.max(0.05, Math.min(0.5, +(prev + delta).toFixed(2))));
  };

  // Persistence: load on mount
  useEffect(() => {
    (async () => {
      try {
        await registerForPushNotificationsAsync();
        const sDrinks = await AsyncStorage.getItem('@glup_drinks');
        const sGoal = await AsyncStorage.getItem('@glup_dailyGoal');
        const sGlass = await AsyncStorage.getItem('@glup_glassSize');
        const sFirstTime = await AsyncStorage.getItem('@glup_firstTime');
        if (sDrinks) setDrinks(JSON.parse(sDrinks));
        if (sGoal) setDailyGoal(parseFloat(sGoal));
        if (sGlass) setCurrentGlassSize(parseFloat(sGlass));
        if (sFirstTime !== null) setIsFirstTime(sFirstTime === 'true');
        
        // Cargar configuraciones de usuario
        const sUserName = await AsyncStorage.getItem('@glup_userName');
        const sLanguage = await AsyncStorage.getItem('@glup_language');
        const sSoundEnabled = await AsyncStorage.getItem('@glup_soundEnabled');
        const sSoundType = await AsyncStorage.getItem('@glup_soundType');
        const sWakeTime = await AsyncStorage.getItem('@glup_wakeTime');
        const sSleepTime = await AsyncStorage.getItem('@glup_sleepTime');
        const sReminderEnabled = await AsyncStorage.getItem('@glup_reminderEnabled');
        
        if (sUserName) setUserName(sUserName);
        if (sLanguage) setLanguage(sLanguage);
        if (sSoundEnabled !== null) setSoundEnabled(sSoundEnabled === 'true');
        if (sSoundType) setSoundType(sSoundType);
        if (sWakeTime) setWakeTime(sWakeTime);
        if (sSleepTime) setSleepTime(sSleepTime);
        if (sReminderEnabled !== null) setReminderEnabled(sReminderEnabled === 'true');
      } catch (e) {
        // ignore
      }
    })();
  }, []);

  // Guardar configuraciones de usuario
  useEffect(() => {
    AsyncStorage.setItem('@glup_userName', userName).catch(() => {});
  }, [userName]);
  useEffect(() => {
    AsyncStorage.setItem('@glup_language', language).catch(() => {});
  }, [language]);
  useEffect(() => {
    AsyncStorage.setItem('@glup_soundEnabled', String(soundEnabled)).catch(() => {});
  }, [soundEnabled]);
  useEffect(() => {
    AsyncStorage.setItem('@glup_soundType', soundType).catch(() => {});
  }, [soundType]);
  useEffect(() => {
    AsyncStorage.setItem('@glup_wakeTime', wakeTime).catch(() => {});
  }, [wakeTime]);
  useEffect(() => {
    AsyncStorage.setItem('@glup_sleepTime', sleepTime).catch(() => {});
  }, [sleepTime]);
  useEffect(() => {
    AsyncStorage.setItem('@glup_reminderEnabled', String(reminderEnabled)).catch(() => {});
  }, [reminderEnabled]);

  // Save when relevant values change
  useEffect(() => {
    AsyncStorage.setItem('@glup_drinks', JSON.stringify(drinks)).catch(() => {});
  }, [drinks]);
  useEffect(() => {
    AsyncStorage.setItem('@glup_dailyGoal', String(dailyGoal)).catch(() => {});
  }, [dailyGoal]);
  useEffect(() => {
    AsyncStorage.setItem('@glup_glassSize', String(currentGlassSize)).catch(() => {});
  }, [currentGlassSize]);

  useEffect(() => {
    AsyncStorage.setItem('@glup_firstTime', String(isFirstTime)).catch(() => {});
  }, [isFirstTime]);

  // Programar notificaciones cuando cambien configuraciones
  useEffect(() => {
    if (reminderEnabled && wakeTime && sleepTime && dailyGoal > 0) {
      scheduleWaterReminders(wakeTime, sleepTime, dailyGoal, currentGlassSize, language);
    }
  }, [reminderEnabled, wakeTime, sleepTime, dailyGoal, currentGlassSize, language]);

  const value = useMemo(() => ({ 
    drinks, addDrink, deleteDrink, currentGlassSize, adjustGlassSize, 
    dailyGoal, setDailyGoal, lastAdded,
    userName, setUserName, language, setLanguage,
    soundEnabled, setSoundEnabled, soundType, setSoundType,
    isFirstTime, setIsFirstTime, wakeTime, setWakeTime,
    sleepTime, setSleepTime, reminderEnabled, setReminderEnabled,
    setDrinks
  }), [drinks, currentGlassSize, dailyGoal, lastAdded, userName, language, soundEnabled, soundType, isFirstTime, wakeTime, sleepTime, reminderEnabled]);

  return <DrinkContext.Provider value={value}>{children}</DrinkContext.Provider>;
};

export default DrinkContext;
