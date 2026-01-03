import React, { useContext, useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  Vibration,
} from "react-native";
import { Picker } from "@react-native-picker/picker";
import { useNavigation } from "@react-navigation/native";
import { Audio } from "expo-av";
import AsyncStorage from "@react-native-async-storage/async-storage";
import DrinkContext from "../context/DrinkContext";
import { getTranslation } from "../utils/translations";
import {
  scheduleWaterReminders,
  cancelAllReminders,
} from "../utils/notifications";

const SettingsScreen = () => {
  const ctx = useContext(DrinkContext);
  const fallback = {
    dailyGoal: 2.5,
    setDailyGoal: (_: number) => {},
    userName: "Usuario",
    setUserName: (_: string) => {},
    language: "es",
    setLanguage: (_: string) => {},
    soundEnabled: true,
    setSoundEnabled: (_: boolean) => {},
    soundType: "glup",
    setSoundType: (_: string) => {},
    wakeTime: "07:00",
    setWakeTime: (_: string) => {},
    sleepTime: "22:00",
    setSleepTime: (_: string) => {},
    reminderEnabled: true,
    setReminderEnabled: (_: boolean) => {},
    drinks: [],
    setDrinks: (_: any[]) => {},
    weight: "70",
    setWeight: (_: string) => {},
    gender: "male",
    setGender: (_: string) => {},
    activityLevel: "low",
    setActivityLevel: (_: string) => {},
    climate: "temperate",
    setClimate: (_: string) => {},
    currentGlassSize: 0.2,
  };
  const {
    dailyGoal,
    setDailyGoal,
    userName,
    setUserName,
    language,
    setLanguage,
    soundEnabled,
    setSoundEnabled,
    soundType,
    setSoundType,
    wakeTime,
    setWakeTime,
    sleepTime,
    setSleepTime,
    reminderEnabled,
    setReminderEnabled,
    drinks,
    setDrinks,
    weight,
    setWeight,
    gender,
    setGender,
    activityLevel,
    setActivityLevel,
    climate,
    setClimate,
    currentGlassSize,
  } = ctx || fallback;

  // Estados locales para configuraciones
  const [goalText, setGoalText] = useState(String(dailyGoal));
  const [progressUnit, setProgressUnit] = useState("l");
  const [glassUnit, setGlassUnit] = useState("ml");
  const [isDirty, setIsDirty] = useState(false);
  const navigation = useNavigation();

  const calculateDailyGoal = () => {
    const weightNum = parseFloat(weight) || 70;
    // Base: 35ml por kg × 0.8 (regla del 80% para agua pura)
    let waterGoal = (weightNum * 35 * 0.8) / 1000; // Convertir a litros

    // Ajuste por género (solo para agua)
    if (gender === "male") {
      waterGoal += 0.5; // +500ml para hombres
    }

    // Ajuste por embarazo
    if (gender === "pregnant") {
      waterGoal += 0.3; // +300ml para embarazadas
    }

    // Ajuste por actividad física
    if (activityLevel === "moderate") {
      waterGoal += 0.5; // +500ml por hora de ejercicio ligero
    } else if (activityLevel === "high") {
      waterGoal += 1.0; // +1L por ejercicio intenso
    }

    // Ajuste por clima caluroso
    if (climate === "hot") {
      waterGoal += 0.75; // +750ml para clima caluroso
    }

    return Math.round(waterGoal * 10) / 10; // Redondear a 1 decimal
  };

  const playTestSound = async () => {
    try {
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
        staysActiveInBackground: false,
        playsInSilentModeIOS: true,
        shouldDuckAndroid: true,
        playThroughEarpieceAndroid: false,
      });

      let soundSource;
      if (soundType === "glup") {
        soundSource = require("../assets/glug-glug-glug.mp3");
      } else if (soundType === "drop") {
        soundSource = {
          uri: "https://www.soundjay.com/misc/sounds/bell-ringing-05.wav",
        };
      } else if (soundType === "bubble") {
        soundSource = require("../assets/burbujas.mp3");
      }

      const { sound } = await Audio.Sound.createAsync(soundSource, {
        shouldPlay: true,
        volume: 0.5,
      });

      setTimeout(() => {
        sound.unloadAsync();
      }, 1000);
    } catch (error) {
      console.log("Using vibration instead");
      Vibration.vibrate([0, 100, 50, 100]);
    }
  };

  const saveSettings = async () => {
    // Siempre recalcular la meta basada en los parámetros actuales
    const calculatedGoal = calculateDailyGoal();
    
    setDailyGoal(calculatedGoal);
    setGoalText(String(calculatedGoal));

    // Reprogramar notificaciones con nueva configuración
    if (reminderEnabled) {
      await scheduleWaterReminders(
        wakeTime,
        sleepTime,
        calculatedGoal,
        currentGlassSize || 0.2,
        language
      );
    } else {
      await cancelAllReminders();
    }
    // Persist settings explicitly to AsyncStorage to ensure they're saved
    try {
      await AsyncStorage.multiSet([
        ["@glup_userName", userName],
        ["@glup_dailyGoal", String(calculatedGoal)],
        ["@glup_weight", weight],
        ["@glup_gender", gender],
        ["@glup_activityLevel", activityLevel],
        ["@glup_climate", climate],
        ["@glup_wakeTime", wakeTime],
        ["@glup_sleepTime", sleepTime],
        ["@glup_reminderEnabled", String(reminderEnabled)],
        ["@glup_soundEnabled", String(soundEnabled)],
        ["@glup_soundType", soundType],
      ]);
    } catch (e) {
      console.log("Error saving settings:", e);
    }

    Alert.alert(
      getTranslation("configSaved", language),
      getTranslation("settingsSaved", language)
    );
    setIsDirty(false);
  };

  const clearAllData = () => {
    Alert.alert(
      getTranslation("clearAllData", language),
      getTranslation("confirmClearData", language),
      [
        { text: getTranslation("cancel", language), style: "cancel" },
        {
          text: getTranslation("clearAllData", language),
          style: "destructive",
          onPress: async () => {
            try {
              await AsyncStorage.multiRemove([
                "@glup_drinks",
                "@glup_dailyGoal",
                "@glup_glassSize",
                "@glup_firstTime",
                "@glup_userName",
                "@glup_language",
                "@glup_soundEnabled",
                "@glup_soundType",
                "@glup_wakeTime",
                "@glup_sleepTime",
                "@glup_reminderEnabled",
                "@glup_weight",
                "@glup_gender",
                "@glup_activityLevel",
                "@glup_climate",
              ]);

              setDrinks([]);
              Alert.alert(
                getTranslation("dataCleared", language),
                getTranslation("allDataCleared", language)
              );
            } catch (error) {
              console.log("Error clearing data:", error);
            }
          },
        },
      ]
    );
  };

  const resetSettings = () => {
    Alert.alert(
      getTranslation("restoreDefault", language),
      getTranslation("confirmRestore", language),
      [
        { text: getTranslation("cancel", language), style: "cancel" },
        {
          text: getTranslation("restoreDefault", language),
          style: "destructive",
          onPress: () => {
            setUserName("Usuario");
            setGender("male");
            setWeight("70");
            setGoalText("2.5");
            setDailyGoal(2.5);
            setActivityLevel("low");
            setClimate("temperate");
            setProgressUnit("l");
            setGlassUnit("ml");
            setLanguage("es");
            setReminderEnabled(true);
            setWakeTime("07:00");
            setSleepTime("22:00");
            setSoundEnabled(true);
            setSoundType("glup");
            Alert.alert(
              getTranslation("configRestored", language),
              getTranslation("defaultsRestored", language)
            );
            setIsDirty(true);
          },
        },
      ]
    );
  };

  // Prevent leaving screen with unsaved changes
  useEffect(() => {
    if (!navigation) return;
    const beforeRemove = (e: any) => {
      if (!isDirty) return;
      e.preventDefault();
      Alert.alert(
        language === "en" ? "Unsaved changes" : "Cambios sin guardar",
        language === "en"
          ? "You have unsaved changes. Discard them and leave the screen?"
          : "Tienes cambios sin guardar. ¿Descartar y salir?",
        [
          {
            text: language === "en" ? "Keep editing" : "Seguir editando",
            style: "cancel",
            onPress: () => {},
          },
          {
            text: language === "en" ? "Discard" : "Descartar",
            style: "destructive",
            onPress: () => navigation.dispatch(e.data.action),
          },
        ]
      );
    };

    const unsub = navigation.addListener("beforeRemove", beforeRemove);
    // Also warn on tab changes (blur) — re-open settings if user chooses to stay
    const onBlur = () => {
      if (!isDirty) return;
      Alert.alert(
        language === "en" ? "Unsaved changes" : "Cambios sin guardar",
        language === "en"
          ? "You have unsaved changes. Discard them or go back to continue editing?"
          : "Tienes cambios sin guardar. ¿Descartar o volver para seguir editando?",
        [
          {
            text: language === "en" ? "Discard" : "Descartar",
            style: "destructive",
            onPress: () => setIsDirty(false),
          },
          {
            text: language === "en" ? "Keep editing" : "Seguir editando",
            style: "cancel",
            onPress: () => navigation.navigate("Settings"),
          },
        ]
      );
    };

    const unsubBlur = navigation.addListener("blur", onBlur);
    return () => {
      unsub();
      unsubBlur();
    };
  }, [navigation, isDirty, language]);

  return (
    <ScrollView style={styles.container}>
      {/* Información Personal */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>
          👤 {getTranslation("personalInfo", language)}
        </Text>

        <View style={styles.formGroup}>
          <Text style={styles.label}>{getTranslation("name", language)}</Text>
          <TextInput
            style={styles.input}
            value={userName}
            onChangeText={(v) => {
              setUserName(v);
              setIsDirty(true);
            }}
            placeholder={getTranslation("yourName", language)}
            maxLength={20}
          />
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>{getTranslation("gender", language)}</Text>
          <View style={styles.pickerContainer}>
            <Picker
              selectedValue={gender}
              onValueChange={(v) => {
                setGender(v);
                // Auto-actualizar meta cuando cambia género
                const newGoal = calculateDailyGoal();
                setGoalText(String(newGoal));
                setIsDirty(true);
              }}
              style={styles.picker}
            >
              <Picker.Item
                label={getTranslation("male", language)}
                value="male"
              />
              <Picker.Item
                label={getTranslation("female", language)}
                value="female"
              />
              <Picker.Item
                label={getTranslation("pregnant", language)}
                value="pregnant"
              />
            </Picker>
          </View>
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>{getTranslation("weight", language)}</Text>
          <TextInput
            style={styles.input}
            value={weight}
            onChangeText={(v) => {
              setWeight(v);
              setIsDirty(true);
            }}
            placeholder="70"
            keyboardType="numeric"
          />
        </View>
      </View>

      {/* Hidratación */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>
          💧 {getTranslation("hydration", language)}
        </Text>

        <View style={styles.formGroup}>
          <Text style={styles.label}>
            {getTranslation("dailyGoal", language)}
          </Text>
          <View style={styles.row}>
            <TextInput
              style={[styles.input, { flex: 1 }]}
              value={goalText}
              onChangeText={(v) => {
                setGoalText(v);
                setIsDirty(true);
              }}
              placeholder="2.5"
              keyboardType="decimal-pad"
            />
            <TouchableOpacity
              style={styles.calculateBtn}
              onPress={() => {
                const calculated = calculateDailyGoal();
                setGoalText(String(calculated));
                setIsDirty(true);
              }}
            >
              <Text style={styles.calculateText}>📊</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>
            {getTranslation("activityLevel", language)}
          </Text>
          <View style={styles.pickerContainer}>
            <Picker
              selectedValue={activityLevel}
              onValueChange={(v) => {
                setActivityLevel(v);
                // Auto-actualizar meta cuando cambia actividad
                const newGoal = calculateDailyGoal();
                setGoalText(String(newGoal));
                setIsDirty(true);
              }}
              style={styles.picker}
            >
              <Picker.Item
                label={getTranslation("lowActivity", language)}
                value="low"
              />
              <Picker.Item
                label={getTranslation("moderateActivity", language)}
                value="moderate"
              />
              <Picker.Item
                label={getTranslation("highActivity", language)}
                value="high"
              />
            </Picker>
          </View>
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>
            {getTranslation("climate", language)}
          </Text>
          <View style={styles.pickerContainer}>
            <Picker
              selectedValue={climate}
              onValueChange={(v) => {
                setClimate(v);
                // Auto-actualizar meta cuando cambia clima
                const newGoal = calculateDailyGoal();
                setGoalText(String(newGoal));
                setIsDirty(true);
              }}
              style={styles.picker}
            >
              <Picker.Item
                label={getTranslation("coldClimate", language)}
                value="cold"
              />
              <Picker.Item
                label={getTranslation("temperateClimate", language)}
                value="temperate"
              />
              <Picker.Item
                label={getTranslation("hotClimate", language)}
                value="hot"
              />
            </Picker>
          </View>
        </View>
      </View>

      {/* Recordatorios */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>
          ⏰ {getTranslation("reminders", language)}
        </Text>

        <View style={styles.formGroup}>
          <Text style={styles.label}>
            {getTranslation("enableReminders", language)}
          </Text>
          <View style={styles.pickerContainer}>
            <Picker
              selectedValue={reminderEnabled}
              onValueChange={(v) => {
                setReminderEnabled(v);
                setIsDirty(true);
              }}
              style={styles.picker}
            >
              <Picker.Item
                label={getTranslation("enabled", language)}
                value={true}
              />
              <Picker.Item
                label={getTranslation("paused", language)}
                value={false}
              />
            </Picker>
          </View>
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>
            {getTranslation("wakeTime", language)}
          </Text>
          <TextInput
            style={styles.input}
            value={wakeTime}
            onChangeText={(v) => {
              setWakeTime(v);
              setIsDirty(true);
            }}
            placeholder="07:00"
          />
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>
            {getTranslation("sleepTime", language)}
          </Text>
          <TextInput
            style={styles.input}
            value={sleepTime}
            onChangeText={(v) => {
              setSleepTime(v);
              setIsDirty(true);
            }}
            placeholder="22:00"
          />
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>
            {getTranslation("drinkSound", language)}
          </Text>
          <View style={styles.pickerContainer}>
            <Picker
              selectedValue={soundEnabled}
              onValueChange={(v) => {
                setSoundEnabled(v);
                setIsDirty(true);
              }}
              style={styles.picker}
            >
              <Picker.Item
                label={getTranslation("enabled", language)}
                value={true}
              />
              <Picker.Item
                label={getTranslation("disabled", language)}
                value={false}
              />
            </Picker>
          </View>
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>
            {getTranslation("soundType", language)}
          </Text>
          <View style={styles.pickerContainer}>
            <Picker
              selectedValue={soundType}
              onValueChange={(v) => {
                setSoundType(v);
                setIsDirty(true);
              }}
              style={styles.picker}
            >
              <Picker.Item
                label={getTranslation("classicGlup", language)}
                value="glup"
              />
              <Picker.Item
                label={getTranslation("waterDrop", language)}
                value="drop"
              />
              <Picker.Item
                label={getTranslation("bubble", language)}
                value="bubble"
              />
            </Picker>
          </View>
          <TouchableOpacity style={styles.testSoundBtn} onPress={playTestSound}>
            <Text style={styles.testSoundText}>
              🔊 {language === "en" ? "Test sound" : "Probar sonido"}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Visualización */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>
          🎨 {getTranslation("visualization", language)}
        </Text>

        <View style={styles.formGroup}>
          <Text style={styles.label}>
            {getTranslation("progressUnit", language)}
          </Text>
          <View style={styles.pickerContainer}>
            <Picker
              selectedValue={progressUnit}
              onValueChange={(v) => {
                setProgressUnit(v);
                setIsDirty(true);
              }}
              style={styles.picker}
            >
              <Picker.Item
                label={getTranslation("liters", language)}
                value="l"
              />
              <Picker.Item
                label={getTranslation("milliliters", language)}
                value="ml"
              />
            </Picker>
          </View>
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>
            {getTranslation("glassUnit", language)}
          </Text>
          <View style={styles.pickerContainer}>
            <Picker
              selectedValue={glassUnit}
              onValueChange={(v) => {
                setGlassUnit(v);
                setIsDirty(true);
              }}
              style={styles.picker}
            >
              <Picker.Item
                label={getTranslation("mlGlass", language)}
                value="ml"
              />
              <Picker.Item
                label={getTranslation("lGlass", language)}
                value="l"
              />
            </Picker>
          </View>
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>
            {getTranslation("language", language)}
          </Text>
          <View style={styles.pickerContainer}>
            <Picker
              selectedValue={language}
              onValueChange={(v) => {
                setLanguage(v);
                setIsDirty(true);
              }}
              style={styles.picker}
            >
              <Picker.Item
                label={getTranslation("spanish", language)}
                value="es"
              />
              <Picker.Item
                label={getTranslation("english", language)}
                value="en"
              />
            </Picker>
          </View>
        </View>
      </View>

      {/* Botones de acción */}
      <View style={styles.actions}>
        {/* debug buttons removed */}

        <TouchableOpacity style={styles.saveBtn} onPress={saveSettings}>
          <Text style={styles.saveText}>
            💾 {getTranslation("saveChanges", language)}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.clearBtn} onPress={clearAllData}>
          <Text style={styles.clearText}>
            🗑️ {getTranslation("clearAllData", language)}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.resetBtn} onPress={resetSettings}>
          <Text style={styles.resetText}>
            🔄 {getTranslation("restoreDefault", language)}
          </Text>
        </TouchableOpacity>

        {/* debug buttons removed */}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f0f8ff",
  },
  section: {
    backgroundColor: "white",
    margin: 15,
    padding: 15,
    borderRadius: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 15,
  },
  formGroup: {
    marginBottom: 15,
  },
  label: {
    fontSize: 14,
    fontWeight: "500",
    color: "#666",
    marginBottom: 5,
  },
  input: {
    borderWidth: 2,
    borderColor: "#e0e0e0",
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: "white",
  },
  pickerContainer: {
    borderWidth: 2,
    borderColor: "#e0e0e0",
    borderRadius: 8,
    backgroundColor: "white",
  },
  picker: {
    height: 50,
  },
  actions: {
    margin: 15,
    gap: 10,
  },
  saveBtn: {
    backgroundColor: "#2196F3",
    padding: 15,
    borderRadius: 8,
    alignItems: "center",
  },
  saveText: {
    color: "white",
    fontWeight: "bold",
    fontSize: 16,
  },
  clearBtn: {
    backgroundColor: "#f44336",
    padding: 12,
    borderRadius: 8,
    alignItems: "center",
  },
  clearText: {
    color: "white",
    fontWeight: "bold",
    fontSize: 14,
  },
  resetBtn: {
    backgroundColor: "#ff5722",
    padding: 12,
    borderRadius: 8,
    alignItems: "center",
  },
  resetText: {
    color: "white",
    fontWeight: "bold",
    fontSize: 14,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  calculateBtn: {
    backgroundColor: "#FF9800",
    padding: 12,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  calculateText: {
    fontSize: 16,
  },
  testSoundBtn: {
    backgroundColor: "#4CAF50",
    padding: 8,
    borderRadius: 6,
    alignItems: "center",
    marginTop: 8,
  },
  testSoundText: {
    color: "white",
    fontWeight: "500",
    fontSize: 14,
  },
});

export default SettingsScreen;
