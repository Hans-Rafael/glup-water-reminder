import React from 'react';
import {View, Text, StyleSheet} from 'react-native';

const HistorialScreen = () => {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>HISTORIAL</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f0f8ff',
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#2196F3',
  },
});

export default HistorialScreen;