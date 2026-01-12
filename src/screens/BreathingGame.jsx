import React, { useRef, useEffect, useState } from 'react';
import { View, Text, Animated, StyleSheet } from 'react-native';

export default function BreathingGame() {
  const scale = useRef(new Animated.Value(1)).current;
  const [phase, setPhase] = useState('Inhale');

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(scale, { toValue: 2, duration: 4000, useNativeDriver: true }),
        Animated.timing(scale, { toValue: 1, duration: 4000, useNativeDriver: true }),
      ])
    );
    loop.start();
    const interval = setInterval(() => {
      setPhase(p => (p === 'Inhale' ? 'Exhale' : 'Inhale'));
    }, 4000);
    return () => {
      loop.stop();
      clearInterval(interval);
    };
  }, []);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{phase}</Text>
      <Animated.View style={[styles.circle, { transform: [{ scale }] }]} />
      <Text style={styles.instruction}>Follow the circle. Breathe slowly.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#bbf7d0' },
  title: { fontSize: 32, fontWeight: 'bold', color: '#166534', marginBottom: 30 },
  circle: {
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: 'rgba(255,255,255,0.4)',
    borderWidth: 3,
    borderColor: 'white',
  },
  instruction: { marginTop: 40, fontSize: 18, color: '#14532d', textAlign: 'center' },
});
