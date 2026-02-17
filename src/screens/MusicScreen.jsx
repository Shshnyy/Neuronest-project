import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, FlatList, StyleSheet } from 'react-native';
import { Audio } from 'expo-av';

const songs = [
  { id: 1, title: '🐦 Birdsong', file: require('../../assets/birdsong.mp3') },
  { id: 2, title: '🔥 Fireplace Glow', file: require('../../assets/fireplace_glow.mp3') },
  { id: 3, title: '🌲 Forest Dawn', file: require('../../assets/forest_dawn.mp3') },
  { id: 4, title: '🏔️ Mountain Breeze', file: require('../../assets/mountain_breeze.mp3') },
  { id: 5, title: '🌊 Calm Waves', file: require('../../assets/calm_waves.mp3') },
  { id: 6, title: '💨 Gentle Winds', file: require('../../assets/gentle_winds.mp3') },
  { id: 7, title: '🌅 Ocean of Peace', file: require('../../assets/ocean_of_peace.mp3') },
  { id: 8, title: '✨ Soft Glow', file: require('../../assets/soft_glow.mp3') },
  { id: 9, title: '⛈️ Thunderstorm Calm', file: require('../../assets/thunderstorm_calm.mp3') },
  { id: 10, title: '🚶‍♀️ Tranquil Paths', file: require('../../assets/tranquil_paths.mp3') },
  { id: 11, title: '🌇 Electric Sunset', file: require('../../assets/electric_sunset.mp3') },
  { id: 12, title: '💫 Feel The Flow', file: require('../../assets/feel_the_flow.mp3') },
  { id: 13, title: '🎧 Groove Wave', file: require('../../assets/groove_wave.mp3') },
  { id: 14, title: '🎞️ Retro Vibes', file: require('../../assets/retro_vibes.mp3') },
  { id: 15, title: '🏙️ Urban Melody', file: require('../../assets/urban_melody.mp3') },
  { id: 16, title: '🎻 Soulful Symphony', file: require('../../assets/soulful_symphony.mp3') },
];

export default function MusicScreen({ navigation }) {
  const [sound, setSound] = useState(null);
  const [playingId, setPlayingId] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  // Configure audio mode on mount
  useEffect(() => {
    const configureAudio = async () => {
      try {
        await Audio.setAudioModeAsync({
          allowsRecordingIOS: false,
          staysActiveInBackground: true,
          playsInSilentModeIOS: true,
          shouldDuckAndroid: true,
          playThroughEarpieceAndroid: false,
        });
      } catch (error) {
        console.error('Error configuring audio:', error);
      }
    };
    configureAudio();
  }, []);

  async function stopSound() {
    if (sound) {
      try {
        await sound.stopAsync();
        await sound.unloadAsync();
      } catch (error) {
        console.error('Error stopping sound:', error);
      } finally {
        setSound(null);
        setPlayingId(null);
      }
    }
  }

  async function playSound(item) {
    if (isLoading) return;
    setIsLoading(true);

    try {
      // Stop any currently playing sound first
      if (sound) {
        try {
          await sound.stopAsync();
          await sound.unloadAsync();
        } catch (e) {
          // Ignore cleanup errors
        }
        setSound(null);
        setPlayingId(null);
      }

      const { sound: newSound } = await Audio.Sound.createAsync(
        item.file,
        { shouldPlay: true, volume: 1.0 }
      );
      setSound(newSound);
      setPlayingId(item.id);

      newSound.setOnPlaybackStatusUpdate((status) => {
        if (status.didJustFinish) {
          newSound.unloadAsync();
          setSound(null);
          setPlayingId(null);
        }
      });
    } catch (e) {
      console.error('Error playing sound:', e);
      setSound(null);
      setPlayingId(null);
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    return () => {
      if (sound) sound.unloadAsync();
    };
  }, [sound]);

  return (
    <View style={styles.container}>
      <Text style={styles.title}> 🎵 Calm Music Collection </Text>

      <FlatList
        data={songs}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => (
          <TouchableOpacity
            activeOpacity={0.8}
            style={[
              styles.songButton,
              playingId === item.id && { backgroundColor: '#13a4ec' },
            ]}
            onPress={() =>
              playingId === item.id ? stopSound() : playSound(item)
            }
          >
            <Text
              style={[
                styles.songText,
                playingId === item.id && { color: 'white' },
              ]}
            >
              {item.title}
            </Text>
            <Text style={styles.tapHint}>
              {playingId === item.id ? '⏹ Tap to Stop' : '▶️ Tap to Play'}
            </Text>
          </TouchableOpacity>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f0faff', padding: 20 },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: '#111',
    marginBottom: 20,
    textAlign: 'center',
  },
  songButton: {
    backgroundColor: 'white',
    paddingVertical: 18,
    paddingHorizontal: 14,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  songText: { fontSize: 17, color: '#333', fontWeight: '500' },
  tapHint: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
    textAlign: 'right',
  },
});
