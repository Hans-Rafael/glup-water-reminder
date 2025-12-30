import React, { useContext } from 'react';
import { registerRootComponent } from 'expo';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import AppNavigator from './src/navigation/AppNavigator';
import { DrinkProvider } from './src/context/DrinkContext';
import DrinkContext from './src/context/DrinkContext';
import OnboardingScreen from './src/screens/OnboardingScreen';

function AppContent() {
  const ctx = useContext(DrinkContext);
  
  if (ctx?.isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2196F3" />
      </View>
    );
  }
  
  if (ctx?.isFirstTime) {
    return <OnboardingScreen onComplete={() => ctx.setIsFirstTime(false)} />;
  }
  
  return <AppNavigator />;
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f0f8ff'
  }
});

export default function App() {
  return (
    <DrinkProvider>
      <AppContent />
    </DrinkProvider>
  );
}

registerRootComponent(App);