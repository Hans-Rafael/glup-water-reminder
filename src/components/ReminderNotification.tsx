import React, { useState, useEffect, useContext } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, Animated } from 'react-native';
import DrinkContext from '../context/DrinkContext';

const ReminderNotification = () => {
  const ctx = useContext(DrinkContext);
  const [showReminder, setShowReminder] = useState(false);
  const slideAnim = new Animated.Value(300);

  const { 
    dailyGoal, drinks, wakeTime, sleepTime, reminderEnabled, 
    language, addDrink, currentGlassSize 
  } = ctx || {};

  const calculateReminderInterval = () => {
    if (!wakeTime || !sleepTime || !dailyGoal) return 60;
    
    const [wakeHour, wakeMin] = wakeTime.split(':').map(Number);
    const [sleepHour, sleepMin] = sleepTime.split(':').map(Number);
    
    const wakeMinutes = wakeHour * 60 + wakeMin;
    const sleepMinutes = sleepHour * 60 + sleepMin;
    const awakeMinutes = sleepMinutes - wakeMinutes;
    
    const glassesNeeded = Math.ceil(dailyGoal / (currentGlassSize || 0.2));
    const intervalMinutes = Math.max(30, Math.floor(awakeMinutes / glassesNeeded));
    
    return intervalMinutes;
  };

  const scheduleNextReminder = () => {
    if (!reminderEnabled || !wakeTime || !sleepTime) return;
    
    const now = new Date();
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();
    const currentMinutes = currentHour * 60 + currentMinute;
    
    const [wakeHour, wakeMin] = wakeTime.split(':').map(Number);
    const [sleepHour, sleepMin] = sleepTime.split(':').map(Number);
    const wakeMinutes = wakeHour * 60 + wakeMin;
    const sleepMinutes = sleepHour * 60 + sleepMin;
    
    if (currentMinutes < wakeMinutes || currentMinutes > sleepMinutes) return;
    
    const intervalMinutes = calculateReminderInterval();
    
    setTimeout(() => {
      setShowReminder(true);
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 500,
        useNativeDriver: true,
      }).start();
    }, intervalMinutes * 60000);
  };

  const closeReminder = () => {
    Animated.timing(slideAnim, {
      toValue: 300,
      duration: 300,
      useNativeDriver: true,
    }).start(() => {
      setShowReminder(false);
      scheduleNextReminder();
    });
  };

  const drinkFromReminder = () => {
    if (addDrink && currentGlassSize) {
      addDrink(currentGlassSize);
    }
    closeReminder();
  };

  const snoozeReminder = () => {
    closeReminder();
    setTimeout(() => {
      setShowReminder(true);
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 500,
        useNativeDriver: true,
      }).start();
    }, 10 * 60000);
  };

  useEffect(() => {
    if (reminderEnabled) {
      scheduleNextReminder();
    }
  }, [reminderEnabled, wakeTime, sleepTime, dailyGoal]);

  if (!showReminder) return null;

  return (
    <Modal transparent visible={showReminder} animationType="none">
      <View style={styles.overlay}>
        <Animated.View 
          style={[styles.reminderCard, { transform: [{ translateY: slideAnim }] }]}
        >
          <View style={styles.header}>
            <Text style={styles.title}>💧 {language === 'en' ? 'Time to hydrate!' : '¡Hora de hidratarte!'}</Text>
            <TouchableOpacity onPress={closeReminder} style={styles.closeBtn}>
              <Text style={styles.closeText}>×</Text>
            </TouchableOpacity>
          </View>
          
          <Text style={styles.message}>
            {language === 'en' 
              ? "It's time to drink water. Your body will thank you!"
              : "Es momento de beber agua. ¡Tu cuerpo te lo agradecerá!"
            }
          </Text>
          
          <View style={styles.actions}>
            <TouchableOpacity style={styles.snoozeBtn} onPress={snoozeReminder}>
              <Text style={styles.snoozeBtnText}>
                {language === 'en' ? 'Remind in 10 min' : 'Recordar en 10 min'}
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.drinkBtn} onPress={drinkFromReminder}>
              <Text style={styles.drinkBtnText}>
                {language === 'en' ? 'I drank water' : 'Ya bebí agua'}
              </Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-start',
    alignItems: 'flex-end',
    paddingTop: 50,
    paddingRight: 20,
  },
  reminderCard: {
    backgroundColor: '#2196F3',
    padding: 15,
    borderRadius: 12,
    maxWidth: 280,
    shadowColor: '#2196F3',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 25,
    elevation: 10,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  title: {
    color: 'white',
    fontSize: 14,
    fontWeight: 'bold',
  },
  closeBtn: {
    width: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  message: {
    color: 'white',
    fontSize: 12,
    lineHeight: 16,
    marginBottom: 10,
  },
  actions: {
    flexDirection: 'row',
    gap: 8,
  },
  snoozeBtn: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
    padding: 6,
    borderRadius: 6,
    flex: 1,
  },
  snoozeBtnText: {
    color: 'white',
    fontSize: 11,
    textAlign: 'center',
  },
  drinkBtn: {
    backgroundColor: 'rgba(255,255,255,0.9)',
    padding: 6,
    borderRadius: 6,
    flex: 1,
  },
  drinkBtnText: {
    color: '#2196F3',
    fontSize: 11,
    fontWeight: 'bold',
    textAlign: 'center',
  },
});

export default ReminderNotification;