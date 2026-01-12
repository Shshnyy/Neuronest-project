import React, { useState, useEffect } from 'react';
import { View, TouchableOpacity, Text, StyleSheet, Alert, Dimensions } from 'react-native';

const icons = ['❤️', '⭐', '☁️', '🐶', '❄️', '🌸'];
const { width } = Dimensions.get('window');
const CARD_SIZE = width / 4 - 20; // auto-adjust to screen width

export default function MemoryMagicGame() {
  const [cards, setCards] = useState([]);
  const [flipped, setFlipped] = useState([]);
  const [matched, setMatched] = useState([]);
  const [moves, setMoves] = useState(0);

  useEffect(() => {
    const shuffled = [...icons, ...icons].sort(() => Math.random() - 0.5);
    setCards(shuffled);
  }, []);

  const handlePress = (index) => {
    if (flipped.includes(index) || matched.includes(index)) return;
    setFlipped([...flipped, index]);
    if (flipped.length === 1) {
      setMoves(moves + 1);
      const firstIndex = flipped[0];
      if (cards[firstIndex] === cards[index]) {
        setMatched([...matched, firstIndex, index]);
      }
      setTimeout(() => setFlipped([]), 700);
    }
  };

  useEffect(() => {
    if (matched.length === cards.length && cards.length > 0) {
      Alert.alert('🎉 Great job!', `You finished in ${moves} moves`, [
        { text: 'Play Again', onPress: () => resetGame() },
      ]);
    }
  }, [matched]);

  const resetGame = () => {
    const shuffled = [...icons, ...icons].sort(() => Math.random() - 0.5);
    setCards(shuffled);
    setFlipped([]);
    setMatched([]);
    setMoves(0);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Moves: {moves}</Text>

      <View style={styles.grid}>
        {cards.map((card, index) => (
          <TouchableOpacity
            key={index}
            style={[
              styles.card,
              { width: CARD_SIZE, height: CARD_SIZE },
              matched.includes(index) && { backgroundColor: '#10b981' },
            ]}
            onPress={() => handlePress(index)}
          >
            <Text style={styles.icon}>
              {flipped.includes(index) || matched.includes(index) ? card : '❓'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fdf2f8',
    paddingTop: 50,
    paddingHorizontal: 10,
    justifyContent: 'center', // centers grid vertically
  },
  title: {
    fontSize: 22,
    textAlign: 'center',
    marginBottom: 20,
    fontWeight: 'bold',
    color: '#4a044e',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  card: {
    backgroundColor: '#a78bfa',
    margin: 8,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  icon: {
    fontSize: 28,
    color: 'white',
  },
});
