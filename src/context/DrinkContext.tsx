import React, { createContext, useState, useMemo, useEffect } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Vibration } from "react-native";
import {
  registerForPushNotificationsAsync,
  scheduleWaterReminders,
} from "../utils/notifications";

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
  isLoading: boolean;
  wakeTime: string;
  setWakeTime: (time: string) => void;
  sleepTime: string;
  setSleepTime: (time: string) => void;
  reminderEnabled: boolean;
  setReminderEnabled: (enabled: boolean) => void;
  setDrinks: (drinks: Drink[]) => void;
  // Datos del perfil
  weight: string;
  setWeight: (weight: string) => void;
  gender: string;
  setGender: (gender: string) => void;
  activityLevel: string;
  setActivityLevel: (level: string) => void;
  climate: string;
  setClimate: (climate: string) => void;
};

export const DrinkContext = createContext<ContextType | null>(null);

export const DrinkProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [drinks, setDrinks] = useState<Drink[]>([]);
  const [currentGlassSize, setCurrentGlassSize] = useState<number>(0.2); // liters
  const [dailyGoal, setDailyGoal] = useState<number>(2.5);
  const [lastAdded, setLastAdded] = useState<number | null>(null);

  // Configuraciones de usuario
  const [userName, setUserName] = useState<string>("Usuario");
  const [language, setLanguage] = useState<string>("es");
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [soundType, setSoundType] = useState<string>("glup");
  const [isFirstTime, setIsFirstTime] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [wakeTime, setWakeTime] = useState<string>("07:00");
  const [sleepTime, setSleepTime] = useState<string>("22:00");
  const [reminderEnabled, setReminderEnabled] = useState<boolean>(true);

  // Datos del perfil
  const [weight, setWeight] = useState<string>("70");
  const [gender, setGender] = useState<string>("male");
  const [activityLevel, setActivityLevel] = useState<string>("low");
  const [climate, setClimate] = useState<string>("temperate");

  const addDrink = (amount: number) => {
    const now = new Date();
    const time = now.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
    const d: Drink = { id: Date.now(), time, amount, hour: now.getHours() };
    setDrinks((prev) => [d, ...prev]);
    // Feedback: vibration + lastAdded flag
    try {
      Vibration.vibrate(60);
    } catch {}
    setLastAdded(Math.round(amount * 1000));
    setTimeout(() => setLastAdded(null), 1100);
  };

  const deleteDrink = (id: number) =>
    setDrinks((prev) => prev.filter((d) => d.id !== id));

  const adjustGlassSize = (delta: number) => {
    setCurrentGlassSize((prev) =>
      Math.max(0.05, Math.min(0.5, +(prev + delta).toFixed(2)))
    );
  };

  // Persistence: load on mount
  useEffect(() => {
    (async () => {
      try {
        await registerForPushNotificationsAsync();
        const sDrinks = await AsyncStorage.getItem("@glup_drinks");
        const sGoal = await AsyncStorage.getItem("@glup_dailyGoal");
        const sGlass = await AsyncStorage.getItem("@glup_glassSize");
        const sFirstTime = await AsyncStorage.getItem("@glup_firstTime");
        console.log("sFirstTime from storage:", sFirstTime);
        if (sDrinks) setDrinks(JSON.parse(sDrinks));
        if (sGoal) setDailyGoal(parseFloat(sGoal));
        if (sGlass) setCurrentGlassSize(parseFloat(sGlass));
        if (sFirstTime !== null) {
          console.log("Setting isFirstTime to:", sFirstTime === "true");
          setIsFirstTime(sFirstTime === "true");
        } else {
          // Si no existe el valor en AsyncStorage, es primera vez
          console.log("No sFirstTime found, setting to true");
          setIsFirstTime(true);
        }

        // Cargar configuraciones de usuario
        const sUserName = await AsyncStorage.getItem("@glup_userName");
        const sLanguage = await AsyncStorage.getItem("@glup_language");
        const sSoundEnabled = await AsyncStorage.getItem("@glup_soundEnabled");
        const sSoundType = await AsyncStorage.getItem("@glup_soundType");
        const sWakeTime = await AsyncStorage.getItem("@glup_wakeTime");
        const sSleepTime = await AsyncStorage.getItem("@glup_sleepTime");
        const sReminderEnabled = await AsyncStorage.getItem(
          "@glup_reminderEnabled"
        );

        // Cargar datos del perfil
        const sWeight = await AsyncStorage.getItem("@glup_weight");
        const sGender = await AsyncStorage.getItem("@glup_gender");
        const sActivityLevel = await AsyncStorage.getItem(
          "@glup_activityLevel"
        );
        const sClimate = await AsyncStorage.getItem("@glup_climate");

        if (sUserName) setUserName(sUserName);
        if (sLanguage) setLanguage(sLanguage);
        if (sSoundEnabled !== null) setSoundEnabled(sSoundEnabled === "true");
        if (sSoundType) setSoundType(sSoundType);
        if (sWakeTime) setWakeTime(sWakeTime);
        if (sSleepTime) setSleepTime(sSleepTime);
        if (sReminderEnabled !== null)
          setReminderEnabled(sReminderEnabled === "true");

        if (sWeight) setWeight(sWeight);
        if (sGender) setGender(sGender);
        if (sActivityLevel) setActivityLevel(sActivityLevel);
        if (sClimate) setClimate(sClimate);

        setIsLoading(false);
      } catch (e) {
        setIsLoading(false);
      }
    })();
  }, []);

  // Guardar configuraciones de usuario

  useEffect(() => {
    if (isLoading) return;
    AsyncStorage.setItem("@glup_userName", userName).catch(() => {});
  }, [userName, isLoading]);
  useEffect(() => {
    if (isLoading) return;
    AsyncStorage.setItem("@glup_language", language).catch(() => {});
  }, [language, isLoading]);
  useEffect(() => {
    if (isLoading) return;
    AsyncStorage.setItem("@glup_soundEnabled", String(soundEnabled)).catch(
      () => {}
    );
  }, [soundEnabled, isLoading]);
  useEffect(() => {
    if (isLoading) return;
    AsyncStorage.setItem("@glup_soundType", soundType).catch(() => {});
  }, [soundType, isLoading]);
  useEffect(() => {
    if (isLoading) return;
    AsyncStorage.setItem("@glup_wakeTime", wakeTime).catch(() => {});
  }, [wakeTime, isLoading]);
  useEffect(() => {
    if (isLoading) return;
    AsyncStorage.setItem("@glup_sleepTime", sleepTime).catch(() => {});
  }, [sleepTime, isLoading]);
  useEffect(() => {
    if (isLoading) return;
    AsyncStorage.setItem(
      "@glup_reminderEnabled",
      String(reminderEnabled)
    ).catch(() => {});
  }, [reminderEnabled, isLoading]);

  // Guardar datos del perfil
  useEffect(() => {
    if (isLoading) return;
    AsyncStorage.setItem("@glup_weight", weight).catch(() => {});
  }, [weight, isLoading]);
  useEffect(() => {
    if (isLoading) return;
    AsyncStorage.setItem("@glup_gender", gender).catch(() => {});
  }, [gender, isLoading]);
  useEffect(() => {
    if (isLoading) return;
    AsyncStorage.setItem("@glup_activityLevel", activityLevel).catch(() => {});
  }, [activityLevel, isLoading]);
  useEffect(() => {
    if (isLoading) return;
    AsyncStorage.setItem("@glup_climate", climate).catch(() => {});
  }, [climate, isLoading]);

  // Save when relevant values change
  useEffect(() => {
    if (isLoading) return;
    AsyncStorage.setItem("@glup_drinks", JSON.stringify(drinks)).catch(
      () => {}
    );
  }, [drinks, isLoading]);
  useEffect(() => {
    if (isLoading) return;
    AsyncStorage.setItem("@glup_dailyGoal", String(dailyGoal)).catch(() => {});
  }, [dailyGoal, isLoading]);
  useEffect(() => {
    if (isLoading) return;
    AsyncStorage.setItem("@glup_glassSize", String(currentGlassSize)).catch(
      () => {}
    );
  }, [currentGlassSize, isLoading]);

  useEffect(() => {
    // Always persist firstTime changes (so onboarding state is kept)
    AsyncStorage.setItem("@glup_firstTime", String(isFirstTime)).catch(
      () => {}
    );
  }, [isFirstTime]);

  // Programar notificaciones cuando cambien configuraciones
  useEffect(() => {
    if (reminderEnabled && wakeTime && sleepTime && dailyGoal > 0) {
      scheduleWaterReminders(
        wakeTime,
        sleepTime,
        dailyGoal,
        currentGlassSize,
        language
      );
    }
  }, [
    reminderEnabled,
    wakeTime,
    sleepTime,
    dailyGoal,
    currentGlassSize,
    language,
  ]);

  const value = useMemo(
    () => ({
      drinks,
      addDrink,
      deleteDrink,
      currentGlassSize,
      adjustGlassSize,
      dailyGoal,
      setDailyGoal,
      lastAdded,
      userName,
      setUserName,
      language,
      setLanguage,
      soundEnabled,
      setSoundEnabled,
      soundType,
      setSoundType,
      isFirstTime,
      setIsFirstTime,
      isLoading,
      wakeTime,
      setWakeTime,
      sleepTime,
      setSleepTime,
      reminderEnabled,
      setReminderEnabled,
      setDrinks,
      weight,
      setWeight,
      gender,
      setGender,
      activityLevel,
      setActivityLevel,
      climate,
      setClimate,
    }),
    [
      drinks,
      currentGlassSize,
      dailyGoal,
      lastAdded,
      userName,
      language,
      soundEnabled,
      soundType,
      isFirstTime,
      isLoading,
      wakeTime,
      sleepTime,
      reminderEnabled,
      weight,
      gender,
      activityLevel,
      climate,
    ]
  );

  return (
    <DrinkContext.Provider value={value}>{children}</DrinkContext.Provider>
  );
};

export default DrinkContext;
