import React, { useEffect, useState } from 'react';
import { View, TouchableOpacity, StyleSheet, Dimensions, Text } from 'react-native';

const { width, height } = Dimensions.get('window');

function randomBetween(min, max) { return Math.random() * (max - min) + min; }

export default function BubblePopperGame({ navigation }) {
  const [bubbles, setBubbles] = useState([]);
  const [score, setScore] = useState(0);

  useEffect(() => {
    const spawn = setInterval(() => {
      setBubbles(prev => (prev.length < 10 ? [
        ...prev,
        {
          id: Date.now() + Math.random(),
          left: randomBetween(20, width - 80),
          top: randomBetween(120, height - 220),
          size: randomBetween(40, 90),
          color: `hsl(${Math.floor(Math.random()*360)}, 75%, 70%)`,
        }
      ] : prev));
    }, 700);
    return () => clearInterval(spawn);
  }, []);

  function popBubble(id) {
    setBubbles(prev => prev.filter(b => b.id !== id));
    setScore(s => s + 1);
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Bubble Popper - Score: {score}</Text>
      <View style={styles.playArea}>
        {bubbles.map(b => (
          <TouchableOpacity
            key={b.id}
            activeOpacity={0.8}
            onPress={() => popBubble(b.id)}
            style={[
              styles.bubble,
              {
                left: b.left,
                top: b.top,
                width: b.size,
                height: b.size,
                borderRadius: b.size / 2,
                backgroundColor: b.color,
              }
            ]}
          />
        ))}
      </View>

      <TouchableOpacity style={styles.back} onPress={() => navigation.goBack()}>
        <Text style={styles.backText}>Back</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex:1, backgroundColor:'#f8fafc', paddingTop:40 },
  title: { fontSize:18, fontWeight:'700', textAlign:'center', marginBottom:10 },
  playArea: { flex:1, position:'relative' },
  bubble: { position:'absolute', borderWidth:2, borderColor:'#fff', shadowColor:'#000', shadowOpacity:0.15, elevation:3 },
  back: { padding:16, alignItems:'center' },
  backText: { color:'#13a4ec', fontWeight:'600' }
});
