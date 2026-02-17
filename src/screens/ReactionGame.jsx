import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';

export default function ReactionGame({ navigation }) {
  const colors = ['#ef4444', '#3b82f6', '#22c55e', '#eab308'];
  const colorNames = ['RED', 'BLUE', 'GREEN', 'YELLOW'];
  const [target, setTarget] = useState(0);
  const [score, setScore] = useState(0);
  const [time, setTime] = useState(30);

  useEffect(() => {
    const timer = setInterval(() => {
      setTime(t => {
        if (t <= 1) {
          clearInterval(timer);
          Alert.alert('Time up!', `Your score: ${score}`, [
            { text: 'Play Again', onPress: () => resetGame() },
          ]);
          return 0;
        }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const handleTap = index => {
    if (index === target) {
      setScore(score + 1);
    } else {
      setScore(Math.max(0, score - 1));
    }
    setTarget(Math.floor(Math.random() * 4));
  };

  const resetGame = () => {
    setScore(0);
    setTime(30);
    setTarget(Math.floor(Math.random() * 4));
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Tap: {colorNames[target]}</Text>
      <Text style={styles.info}>Score: {score} | Time: {time}</Text>
      <View style={styles.grid}>
        {colors.map((color, index) => (
          <TouchableOpacity
            key={index}
            style={[styles.box, { backgroundColor: color }]}
            onPress={() => handleTap(index)}
          />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff7ed' },
  title: { fontSize: 28, fontWeight: 'bold', marginBottom: 10 },
  info: { fontSize: 18, marginBottom: 30 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', width: 260, justifyContent: 'center' },
  box: { width: 110, height: 110, margin: 10, borderRadius: 12 },
});
