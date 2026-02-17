import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

export default function ReliefScreen({ navigation }) {
  return (
    <View style={styles.container}>
      <Text style={styles.header}>Choose Your Relief</Text>

      <TouchableOpacity
        style={styles.option}
        onPress={() => navigation.getParent()?.navigate('Music')}
      >
        <Text style={styles.optionText}>🎵 Music</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.option}
        // ✅ Correct route name to match App.js
        onPress={() => navigation.getParent()?.navigate('Games')}
      >
        <Text style={styles.optionText}>🎮 Games</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f0f8ff',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  header: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1E90FF',
    marginBottom: 40,
  },
  option: {
    backgroundColor: '#ffffff',
    padding: 20,
    borderRadius: 15,
    marginVertical: 10,
    width: '80%',
    alignItems: 'center',
    elevation: 3,
  },
  optionText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
});
