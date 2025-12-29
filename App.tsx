import React, { useContext } from 'react';
import { registerRootComponent } from 'expo';
import AppNavigator from './src/navigation/AppNavigator';
import { DrinkProvider } from './src/context/DrinkContext';
import DrinkContext from './src/context/DrinkContext';
import OnboardingScreen from './src/screens/OnboardingScreen';

function AppContent() {
  const ctx = useContext(DrinkContext);
  
  if (ctx?.isFirstTime) {
    return <OnboardingScreen onComplete={() => ctx.setIsFirstTime(false)} />;
  }
  
  return <AppNavigator />;
}

export default function App() {
  return (
    <DrinkProvider>
      <AppContent />
    </DrinkProvider>
  );
}

registerRootComponent(App);