import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';

export default function GamesScreen({ navigation }) {
  const games = [
    { title: '🎈 Bubble Popper', screen: 'BubblePopperGame', color: '#3b82f6' },
    { title: '🧠 Memory Match', screen: 'MemoryMatchGame', color: '#9333ea' },
    { title: '🌈 Reaction Game', screen: 'ReactionGame', color: '#f97316' },
    { title: '🌬️ Breathing Game', screen: 'BreathingGame', color: '#10b981' },
  ];

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>🎮 Relaxing Games</Text>
      {games.map((game, index) => (
        <TouchableOpacity
          key={index}
          style={[styles.card, { backgroundColor: game.color }]}
          onPress={() => navigation.navigate(game.screen)}
        >
          <Text style={styles.cardText}>{game.title}</Text>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    backgroundColor: '#f8fafc',
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 30,
    color: '#111',
  },
  card: {
    width: '90%',
    paddingVertical: 30,
    borderRadius: 16,
    alignItems: 'center',
    marginVertical: 10,
  },
  cardText: {
    fontSize: 20,
    color: 'white',
    fontWeight: 'bold',
  },
});
