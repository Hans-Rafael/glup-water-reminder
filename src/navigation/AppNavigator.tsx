import React from 'react';
import {NavigationContainer} from '@react-navigation/native';
import {createBottomTabNavigator} from '@react-navigation/bottom-tabs';
import HomeScreen from '../screens/HomeScreen';
import HistorialScreen from '../screens/HistorialScreen';
import SettingsScreen from '../screens/SettingsScreen';
import { MaterialIcons } from '@expo/vector-icons';
import { useContext } from 'react';
import DrinkContext from '../context/DrinkContext';
import { getTranslation } from '../utils/translations';
import { View, Text } from 'react-native';

const Tab = createBottomTabNavigator();

const AppNavigator = () => {
  const ctx = useContext(DrinkContext);
  const language = ctx?.language || 'es';
  
  return (
    <NavigationContainer>
      <Tab.Navigator
        screenOptions={{
          tabBarActiveTintColor: '#2196F3',
          tabBarInactiveTintColor: '#666',
          tabBarStyle: {
            height: 70,
            paddingBottom: 10,
            paddingTop: 10,
          },
          tabBarLabelStyle: {
            fontSize: 12,
            fontWeight: '500',
          },
          headerStyle: {
            backgroundColor: '#2196F3',
          },
          headerTintColor: 'white',
          headerTitleStyle: {
            fontWeight: 'bold',
            fontSize: 18,
          },
        }}>
        <Tab.Screen
          name="Home"
          component={HomeScreen}
          options={{ 
            title: getTranslation('home', language),
            headerTitle: () => (
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <MaterialIcons name="home" size={24} color="white" style={{ marginRight: 8 }} />
                <Text style={{ color: 'white', fontSize: 18, fontWeight: 'bold' }}>
                  {getTranslation('dailyHydration', language)}
                </Text>
              </View>
            ),
            tabBarIcon: ({ color, size }) => <MaterialIcons name="home" size={28} color={color} /> 
          }}
        />
        <Tab.Screen
          name="Historial"
          component={HistorialScreen}
          options={{ 
            title: getTranslation('historial', language),
            tabBarIcon: ({ color, size }) => <MaterialIcons name="bar-chart" size={28} color={color} /> 
          }}
        />
        <Tab.Screen
          name="Settings"
          component={SettingsScreen}
          options={{ 
            title: getTranslation('settings', language),
            tabBarIcon: ({ color, size }) => <MaterialIcons name="settings" size={28} color={color} /> 
          }}
        />
      </Tab.Navigator>
    </NavigationContainer>
  );
};

export default AppNavigator;
