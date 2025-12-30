import React, { useState, useContext } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import DrinkContext from '../context/DrinkContext';

const OnboardingScreen = ({ onComplete }: { onComplete: () => void }) => {
  const ctx = useContext(DrinkContext);
  const [name, setName] = useState('');
  const [weight, setWeight] = useState('70');
  const [gender, setGender] = useState('male');
  const [activityLevel, setActivityLevel] = useState('low');
  const [climate, setClimate] = useState('temperate');

  const calculateGoal = () => {
    const weightNum = parseFloat(weight) || 70;
    // Base: 35ml por kg × 0.8 (regla del 80% para agua pura)
    let waterGoal = (weightNum * 35 * 0.8) / 1000;
    
    // Ajuste por género (solo para agua)
    if (gender === 'male') {
      waterGoal += 0.5; // +500ml para hombres
    }
    
    // Ajuste por embarazo
    if (gender === 'pregnant') {
      waterGoal += 0.3; // +300ml para embarazadas
    }
    
    // Ajuste por actividad física
    if (activityLevel === 'moderate') {
      waterGoal += 0.5;
    } else if (activityLevel === 'high') {
      waterGoal += 1.0;
    }
    
    // Ajuste por clima caluroso
    if (climate === 'hot') {
      waterGoal += 0.75;
    }
    
    return Math.round(waterGoal * 10) / 10;
  };

  const handleComplete = () => {
    const goal = calculateGoal();
    if (ctx) {
      ctx.setUserName(name || 'Usuario');
      ctx.setDailyGoal(goal);
      ctx.setWeight(weight);
      ctx.setGender(gender);
      ctx.setActivityLevel(activityLevel);
      ctx.setClimate(climate);
    }
    onComplete();
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>¡Bienvenido a Glup! 💧</Text>
      <Text style={styles.subtitle}>Configuremos tu perfil de hidratación</Text>

      <View style={styles.section}>
        <Text style={styles.label}>Tu nombre</Text>
        <TextInput 
          style={styles.input} 
          value={name} 
          onChangeText={setName}
          placeholder="Ingresa tu nombre"
        />
      </View>

      <View style={styles.section}>
        <Text style={styles.label}>Peso (kg)</Text>
        <TextInput 
          style={styles.input} 
          value={weight} 
          onChangeText={setWeight}
          placeholder="70"
          keyboardType="numeric"
        />
      </View>

      <View style={styles.section}>
        <Text style={styles.label}>Sexo</Text>
        <View style={styles.pickerContainer}>
          <Picker selectedValue={gender} onValueChange={setGender}>
            <Picker.Item label="Hombre" value="male" />
            <Picker.Item label="Mujer" value="female" />
            <Picker.Item label="Mujer embarazada/lactando" value="pregnant" />
          </Picker>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.label}>Nivel de actividad</Text>
        <View style={styles.pickerContainer}>
          <Picker selectedValue={activityLevel} onValueChange={setActivityLevel}>
            <Picker.Item label="Baja (sedentario)" value="low" />
            <Picker.Item label="Moderada (ejercicio ligero)" value="moderate" />
            <Picker.Item label="Alta (ejercicio intenso)" value="high" />
          </Picker>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.label}>Clima habitual</Text>
        <View style={styles.pickerContainer}>
          <Picker selectedValue={climate} onValueChange={setClimate}>
            <Picker.Item label="Frío" value="cold" />
            <Picker.Item label="Templado" value="temperate" />
            <Picker.Item label="Caluroso" value="hot" />
          </Picker>
        </View>
      </View>

      <View style={styles.goalPreview}>
        <Text style={styles.goalText}>Tu meta diaria será: {calculateGoal()}L</Text>
      </View>

      <TouchableOpacity style={styles.completeBtn} onPress={handleComplete}>
        <Text style={styles.completeText}>🚀 ¡Comenzar!</Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: '#f0f8ff',
    padding: 20
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#2196F3',
    textAlign: 'center',
    marginBottom: 10
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 30
  },
  section: {
    backgroundColor: 'white',
    padding: 15,
    borderRadius: 12,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8
  },
  input: {
    borderWidth: 2,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: 'white'
  },
  pickerContainer: {
    borderWidth: 2,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    backgroundColor: 'white'
  },
  goalPreview: {
    backgroundColor: '#e3f2fd',
    padding: 20,
    borderRadius: 12,
    marginVertical: 20,
    alignItems: 'center'
  },
  goalText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2196F3'
  },
  completeBtn: {
    backgroundColor: '#4CAF50',
    padding: 18,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 30
  },
  completeText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 18
  }
});

export default OnboardingScreen;