import React, { useContext, useRef, useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated, Vibration, Modal, ScrollView } from 'react-native';
import { Audio } from 'expo-av';
import DrinkContext from '../context/DrinkContext';
import { getTranslation } from '../utils/translations';
import ReminderNotification from '../components/ReminderNotification';

const HomeScreen = () => {
  const ctx = useContext(DrinkContext);
  const fallback = {
    currentGlassSize: 0.2,
    adjustGlassSize: (_: number) => {},
    addDrink: (_: number) => {},
    drinks: [] as any,
    dailyGoal: 2.5,
    lastAdded: null as number | null,
    userName: 'Usuario',
    language: 'es',
    soundType: 'glup',
  };
  const { currentGlassSize, adjustGlassSize, addDrink, drinks, dailyGoal, lastAdded, userName, language, soundType } = ctx || fallback;

  const sizeTextScale = useRef(new Animated.Value(1)).current;
  const sizeTextColor = useRef(new Animated.Value(0)).current;
  const [showCongratulations, setShowCongratulations] = useState(false);
  const [hasShownCongratulations, setHasShownCongratulations] = useState(false);
  const [showInfoModal, setShowInfoModal] = useState(false);

  const total = drinks.reduce((s, d) => s + d.amount, 0);
  const percent = Math.min(1, total / dailyGoal);
  const glassesNeeded = Math.ceil(dailyGoal / currentGlassSize);

  // Mostrar felicitaciones cuando se alcance la meta
  useEffect(() => {
    if (total >= dailyGoal && !hasShownCongratulations && drinks.length > 0) {
      setShowCongratulations(true);
      setHasShownCongratulations(true);
    }
  }, [total, dailyGoal, hasShownCongratulations, drinks.length]);

  const playGlupSound = async () => {
    try {
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
        staysActiveInBackground: false,
        playsInSilentModeIOS: true,
        shouldDuckAndroid: true,
        playThroughEarpieceAndroid: false,
      });
      
      let soundSource;
      if (soundType === 'glup') {
        soundSource = require('../assets/glug-glug-glug.mp3');
      } else if (soundType === 'drop') {
        soundSource = { uri: 'https://www.soundjay.com/misc/sounds/bell-ringing-05.wav' };
      } else if (soundType === 'bubble') {
        soundSource = require('../assets/burbujas.mp3');
      }
      
      const { sound } = await Audio.Sound.createAsync(
        soundSource,
        { shouldPlay: true, volume: 0.5 }
      );
      
      setTimeout(() => {
        sound.unloadAsync();
      }, 1000);
    } catch (error) {
      console.log('Audio error, but vibration already played');
    }
  };

  const handleDrink = () => {
    addDrink(currentGlassSize);
    // Vibración siempre
    try {
      Vibration.vibrate(80);
    } catch (error) {
      console.log('Vibration not available');
    }
    // Reproducir sonido seleccionado
    playGlupSound();
  };

  const handleSizeChange = (delta: number) => {
    adjustGlassSize(delta);
    
    // Animación de escala y color
    sizeTextColor.setValue(delta > 0 ? 1 : -1); // 1 para azul (+), -1 para rojo (-)
    
    Animated.sequence([
      Animated.parallel([
        Animated.timing(sizeTextScale, {
          toValue: 1.6, // Aumentado de 1.2 a 1.6 (doble del efecto)
          duration: 100,
          useNativeDriver: false,
        }),
        Animated.timing(sizeTextColor, {
          toValue: delta > 0 ? 1 : -1,
          duration: 100,
          useNativeDriver: false,
        })
      ]),
      Animated.delay(700),
      Animated.parallel([
        Animated.timing(sizeTextScale, {
          toValue: 1,
          duration: 200,
          useNativeDriver: false,
        }),
        Animated.timing(sizeTextColor, {
          toValue: 0,
          duration: 200,
          useNativeDriver: false,
        })
      ])
    ]).start();
  };

  const getMotivationText = () => {
    if (drinks.length === 0) {
      return `${getTranslation('hello', language)} ${userName}! ${getTranslation('startDay', language)}!`;
    } else if (total >= dailyGoal) {
      return `${getTranslation('excellent', language)} ${userName}! ${getTranslation('goalCompleted', language)}! 🎉`;
    } else {
      const remaining = (dailyGoal - total).toFixed(1);
      return `${getTranslation('youreGreat', language)} ${userName}! ${getTranslation('remaining', language)} ${remaining}L`;
    }
  };

  const animatedTextColor = sizeTextColor.interpolate({
    inputRange: [-1, 0, 1],
    outputRange: ['#f44336', '#666', '#2196F3'], // rojo, gris, azul
  });

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>{getTranslation('dailyHydration', language)}</Text>
        <TouchableOpacity 
          style={styles.infoButton}
          onPress={() => setShowInfoModal(true)}
        >
          <Text style={styles.infoButtonText}>i</Text>
        </TouchableOpacity>
      </View>
      
      <View style={styles.progressContainer}>
        <Text style={styles.progressText}>{`${total.toFixed(1)}L / ${dailyGoal.toFixed(1)}L`}</Text>
        <View style={styles.progressBar}>
          <View style={[styles.progressFill, { width: `${percent * 100}%` }]} />
        </View>
        <Text style={styles.glassesText}>{`${drinks.length} / ${glassesNeeded} ${getTranslation('glasses', language)}`}</Text>
      </View>

      <View style={styles.controls}> 
        <TouchableOpacity style={styles.sizeButton} onPress={() => handleSizeChange(-0.05)}>
          <Text style={styles.sizeButtonText}>-</Text>
        </TouchableOpacity>

        <View style={styles.glupContainer}>
          <TouchableOpacity style={styles.glupButton} onPress={handleDrink}>
            <Text style={styles.glupEmoji}>🥤</Text>
            <Text style={styles.glupLabel}>GLUP!</Text>
          </TouchableOpacity>
          <Animated.Text style={[
            styles.glassSizeText,
            {
              transform: [{ scale: sizeTextScale }],
              color: animatedTextColor,
              fontWeight: sizeTextScale._value > 1 ? 'bold' : '500'
            }
          ]}>
            {`${Math.round(currentGlassSize * 1000)}ml`}
          </Animated.Text>
          {lastAdded !== null && (
            <Animated.View style={styles.addedBadge}>
              <Text style={styles.addedText}>+{lastAdded}ml</Text>
            </Animated.View>
          )}
        </View>

        <TouchableOpacity style={styles.sizeButton} onPress={() => handleSizeChange(0.05)}>
          <Text style={styles.sizeButtonText}>+</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.motivationText}>{getMotivationText()}</Text>
      
      {/* Modal de Consejos de Hidratación */}
      <Modal
        visible={showInfoModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowInfoModal(false)}
      >
        <View style={styles.infoModalOverlay}>
          <View style={styles.infoModalCard}>
            <View style={styles.infoModalHeader}>
              <Text style={styles.infoModalTitle}>
                💧 {getTranslation('hydrationTips', language)}
              </Text>
              <TouchableOpacity 
                style={styles.infoCloseButton}
                onPress={() => setShowInfoModal(false)}
              >
                <Text style={styles.infoCloseButtonText}>×</Text>
              </TouchableOpacity>
            </View>
            
            <ScrollView style={styles.infoModalContent} showsVerticalScrollIndicator={false}>
              <View style={styles.tipSection}>
                <Text style={styles.tipSectionTitle}>
                  ✨ {getTranslation('practicalTips', language)}
                </Text>
                <Text style={styles.tipText}>• {getTranslation('tip1', language)}</Text>
                <Text style={styles.tipText}>• {getTranslation('tip2', language)}</Text>
                <Text style={styles.tipText}>• {getTranslation('tip3', language)}</Text>
                <Text style={styles.tipText}>• {getTranslation('tip4', language)}</Text>
              </View>
              
              <View style={styles.tipSection}>
                <Text style={styles.tipSectionTitle}>
                  🍎 {getTranslation('liquidSources', language)}
                </Text>
                <Text style={styles.tipText}>• {getTranslation('tip5', language)}</Text>
              </View>
              
              <View style={styles.tipSection}>
                <Text style={styles.tipSectionTitle}>
                  ⚠️ {getTranslation('warningSignals', language)}
                </Text>
                <Text style={styles.tipText}>• {getTranslation('tip6', language)}</Text>
              </View>
            </ScrollView>
            
            <TouchableOpacity 
              style={styles.infoModalButton}
              onPress={() => setShowInfoModal(false)}
            >
              <Text style={styles.infoModalButtonText}>
                {getTranslation('closeInfo', language)}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
      
      {/* Modal de Felicitaciones */}
      <Modal
        visible={showCongratulations}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowCongratulations(false)}
      >
        <View style={styles.congratulationsOverlay}>
          <Animated.View style={styles.congratulationsCard}>
            <Text style={styles.congratulationsEmoji}>🎉</Text>
            <Text style={styles.congratulationsTitle}>
              {getTranslation('excellent', language)}!
            </Text>
            <Text style={styles.congratulationsMessage}>
              {getTranslation('goalCompleted', language)}! {userName}, tu cuerpo te lo agradece 💧
            </Text>
            <TouchableOpacity 
              style={styles.congratulationsBtn}
              onPress={() => setShowCongratulations(false)}
            >
              <Text style={styles.congratulationsBtnText}>¡Genial! 🚀</Text>
            </TouchableOpacity>
          </Animated.View>
        </View>
      </Modal>
      
      <ReminderNotification />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    padding: 20, 
    backgroundColor: '#f0f8ff',
    justifyContent: 'center',
    alignItems: 'center'
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    marginBottom: 40
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#2196F3',
    textAlign: 'center',
    flex: 1
  },
  infoButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#2196F3',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#2196F3',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4
  },
  infoButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
    fontStyle: 'italic'
  },
  progressContainer: { 
    alignItems: 'center', 
    marginBottom: 60,
    width: '100%'
  },
  progressText: { 
    fontSize: 24, 
    fontWeight: 'bold',
    color: '#333', 
    marginBottom: 10 
  },
  progressBar: { 
    width: 250, 
    height: 20, 
    backgroundColor: '#e0e0e0', 
    borderRadius: 10, 
    overflow: 'hidden' 
  },
  progressFill: { 
    height: '100%', 
    backgroundColor: '#2196F3',
    borderRadius: 6
  },
  glassesText: { 
    marginTop: 10, 
    color: '#666', 
    fontSize: 16 
  },
  controls: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    marginBottom: 15,
    width: '100%',
    paddingHorizontal: 20
  },
  sizeButton: { 
    width: 35, 
    height: 35, 
    borderRadius: 18, 
    backgroundColor: '#e3f2fd', 
    alignItems: 'center', 
    justifyContent: 'center', 
    borderWidth: 2, 
    borderColor: '#2196F3' 
  },
  sizeButtonText: { 
    fontSize: 18, 
    fontWeight: 'bold',
    color: '#2196F3' 
  },
  glupContainer: { 
    alignItems: 'center' 
  },
  glupButton: { 
    width: 120, 
    height: 120, 
    borderRadius: 60, 
    backgroundColor: '#2196F3', 
    alignItems: 'center', 
    justifyContent: 'center',
    shadowColor: '#2196F3',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.3,
    shadowRadius: 15,
    elevation: 8
  },
  glupEmoji: { 
    fontSize: 40, 
    marginBottom: 5 
  },
  glupLabel: { 
    color: '#fff', 
    fontWeight: 'bold', 
    fontSize: 16 
  },
  glassSizeText: { 
    marginTop: 3, 
    color: '#666', 
    fontWeight: '500',
    fontSize: 10
  },
  addedBadge: { 
    position: 'absolute', 
    top: -18, 
    backgroundColor: '#4CAF50', 
    paddingHorizontal: 8, 
    paddingVertical: 4, 
    borderRadius: 12 
  },
  addedText: { 
    color: 'white', 
    fontWeight: 'bold',
    fontSize: 12
  },
  motivationText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    maxWidth: 300,
    lineHeight: 22
  },
  congratulationsOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.8)',
    justifyContent: 'center',
    alignItems: 'center'
  },
  congratulationsCard: {
    backgroundColor: '#4CAF50',
    padding: 40,
    borderRadius: 20,
    alignItems: 'center',
    maxWidth: 320,
    margin: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 20 },
    shadowOpacity: 0.3,
    shadowRadius: 40,
    elevation: 20
  },
  congratulationsEmoji: {
    fontSize: 60,
    marginBottom: 20
  },
  congratulationsTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 15,
    textAlign: 'center'
  },
  congratulationsMessage: {
    fontSize: 16,
    color: 'white',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 25
  },
  congratulationsBtn: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderWidth: 2,
    borderColor: 'white',
    paddingVertical: 12,
    paddingHorizontal: 25,
    borderRadius: 25
  },
  congratulationsBtnText: {
    color: 'white',
    fontSize: 14,
    fontWeight: 'bold'
  },
  // Info Modal Styles
  infoModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end'
  },
  infoModalCard: {
    backgroundColor: 'white',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '80%',
    paddingBottom: 20
  },
  infoModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0'
  },
  infoModalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2196F3',
    flex: 1
  },
  infoCloseButton: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#f5f5f5',
    justifyContent: 'center',
    alignItems: 'center'
  },
  infoCloseButtonText: {
    fontSize: 20,
    color: '#666',
    fontWeight: 'bold'
  },
  infoModalContent: {
    padding: 20,
    maxHeight: 400
  },
  tipSection: {
    marginBottom: 20
  },
  tipSectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10
  },
  tipText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
    marginBottom: 8
  },
  infoModalButton: {
    backgroundColor: '#2196F3',
    marginHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center'
  },
  infoModalButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold'
  }
});

export default HomeScreen;
