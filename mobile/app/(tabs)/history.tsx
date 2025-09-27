import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Pressable,
  Alert,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { Audio } from 'expo-av';
import { useFocusEffect } from 'expo-router';
import * as FileSystem from 'expo-file-system'; // Import FileSystem for file operations

// Key for storing translation history in AsyncStorage
const HISTORY_STORAGE_KEY = '@translation_history';

// Type definition for history items
export interface HistoryItem {
  id: string;
  originalText: string;
  translatedText: string;
  originalAudioUrl: string; // URL to the original audio recording
  translatedAudioUrl: string; // URL to the translated audio
  date: string;
  targetLanguage: string;
}

export default function HistoryScreen() {
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [sound, setSound] = useState<Audio.Sound | null>(null);
  const [playingItemId, setPlayingItemId] = useState<string | null>(null);
  const [isPlayingOriginal, setIsPlayingOriginal] = useState(false);
  const [isAudioSessionPrepared, setIsAudioSessionPrepared] = useState(false);

  // Load history when the component mounts or when returning to this screen
  useFocusEffect(
    useCallback(() => {
      loadHistory();
      prepareAudioSession();
      return () => {
        // Clean up sound when leaving the screen
        cleanupSound();
      };
    }, [])
  );

  // Clean up sound resources when component unmounts
  useEffect(() => {
    return () => {
      cleanupSound();
    };
  }, []);

  // Prepare audio session for playback
  const prepareAudioSession = async () => {
    if (isAudioSessionPrepared) return;

    try {
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
        playsInSilentModeIOS: true,
        staysActiveInBackground: false,
        shouldDuckAndroid: true,
      });
      setIsAudioSessionPrepared(true);
    } catch (error) {
      console.error('Error preparing audio session:', error);
    }
  };

  // Load history from AsyncStorage
  const loadHistory = async () => {
    try {
      const savedHistory = await AsyncStorage.getItem(HISTORY_STORAGE_KEY);
      if (savedHistory) {
        setHistory(JSON.parse(savedHistory));
      }
    } catch (error) {
      console.error('Error loading history:', error);
      Alert.alert('Error', 'Failed to load translation history.');
    }
  };

  // Clean up sound resources
  const cleanupSound = async () => {
    try {
      if (sound) {
        await sound.stopAsync();
        await sound.unloadAsync();
        setSound(null);
      }
      setPlayingItemId(null);
      setIsPlayingOriginal(false);
    } catch (error) {
      console.error('Error cleaning up sound:', error);
    }
  };

  // Clear all history
  const clearHistory = async () => {
    try {
      await AsyncStorage.removeItem(HISTORY_STORAGE_KEY);
      setHistory([]);
      Alert.alert('Success', 'Translation history cleared.');
    } catch (error) {
      console.error('Error clearing history:', error);
      Alert.alert('Error', 'Failed to clear translation history.');
    }
  };

  // Confirm before clearing history
  const confirmClearHistory = () => {
    Alert.alert(
      'Clear History',
      'Are you sure you want to clear all translation history?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Clear', style: 'destructive', onPress: clearHistory },
      ]
    );
  };

  // Verify that an audio URL is accessible
  const verifyAudioUrl = async (url: string) => {
    try {
      // For local file URLs, check if the file exists
      if (url.startsWith('file://')) {
        const fileInfo = await FileSystem.getInfoAsync(url);
        return fileInfo.exists;
      }

      // For remote URLs, make a minimal request to check if the URL is valid
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          Range: 'bytes=0-0', // Only request the first byte to minimize data transfer
        },
      });

      if (!response.ok) {
        throw new Error(`Audio file not found: ${url}`);
      }

      return true;
    } catch (error) {
      console.error('Audio URL verification failed:', error);
      return false;
    }
  };

  // Play audio from a URL
  const playAudio = async (item: HistoryItem, isOriginal: boolean) => {
    try {
      // If already playing this item and type, stop it
      if (playingItemId === item.id && isPlayingOriginal === isOriginal) {
        await cleanupSound();
        return;
      }

      // Clean up any existing sound
      await cleanupSound();

      // Ensure audio session is prepared
      await prepareAudioSession();

      // Get the appropriate audio URL
      const audioUrl = isOriginal
        ? item.originalAudioUrl
        : item.translatedAudioUrl;

      // Verify the audio URL is accessible
      const isAudioAccessible = await verifyAudioUrl(audioUrl);
      if (!isAudioAccessible) {
        throw new Error(`Audio file not accessible: ${audioUrl}`);
      }

      console.log(`Playing audio from: ${audioUrl}`);

      // Set the playing state
      setPlayingItemId(item.id);
      setIsPlayingOriginal(isOriginal);

      // Create and play the sound
      const { sound: newSound } = await Audio.Sound.createAsync(
        { uri: audioUrl },
        { shouldPlay: true }
      );

      setSound(newSound);

      // Set up a callback for when playback finishes
      newSound.setOnPlaybackStatusUpdate(async (status) => {
        if (
          status.isLoaded &&
          'didJustFinish' in status &&
          status.didJustFinish
        ) {
          await cleanupSound();
        }
      });
    } catch (error) {
      console.error('Error playing audio:', error);
      Alert.alert(
        'Error',
        `Failed to play ${
          isOriginal ? 'original' : 'translated'
        } audio. The file may be unavailable.`
      );
      await cleanupSound();
    }
  };

  // Render a history item
  const renderHistoryItem = ({ item }: { item: HistoryItem }) => {
    const date = new Date(item.date);
    const formattedDate = date.toLocaleDateString();
    const formattedTime = date.toLocaleTimeString();

    const isPlayingOriginalAudio =
      playingItemId === item.id && isPlayingOriginal;
    const isPlayingTranslatedAudio =
      playingItemId === item.id && !isPlayingOriginal;

    return (
      <View style={styles.historyItem}>
        <View style={styles.historyHeader}>
          <Text style={styles.historyDate}>
            {formattedDate} {formattedTime}
          </Text>
          <Text style={styles.historyLanguage}>{item.targetLanguage}</Text>
        </View>

        <View style={styles.textContainer}>
          <View style={styles.textHeader}>
            <Text style={styles.textLabel}>Original:</Text>
            <Pressable
              style={[
                styles.playButton,
                isPlayingOriginalAudio && styles.playingButton,
              ]}
              onPress={() => playAudio(item, true)}
            >
              <Ionicons
                name={isPlayingOriginalAudio ? 'pause' : 'play'}
                size={16}
                color="#fff"
              />
            </Pressable>
          </View>
          <Text style={styles.text}>{item.originalText}</Text>
        </View>

        <View style={styles.textContainer}>
          <View style={styles.textHeader}>
            <Text style={styles.textLabel}>Translated:</Text>
            <Pressable
              style={[
                styles.playButton,
                isPlayingTranslatedAudio && styles.playingButton,
              ]}
              onPress={() => playAudio(item, false)}
            >
              <Ionicons
                name={isPlayingTranslatedAudio ? 'pause' : 'play'}
                size={16}
                color="#fff"
              />
            </Pressable>
          </View>
          <Text style={styles.text}>{item.translatedText}</Text>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Translation History</Text>
        {history.length > 0 && (
          <Pressable style={styles.clearButton} onPress={confirmClearHistory}>
            <Text style={styles.clearButtonText}>Clear All</Text>
          </Pressable>
        )}
      </View>

      {history.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="time" size={64} color="#444" />
          <Text style={styles.emptyText}>No translation history yet</Text>
        </View>
      ) : (
        <FlatList
          data={history}
          renderItem={renderHistoryItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
  },
  clearButton: {
    padding: 8,
  },
  clearButtonText: {
    color: '#ff4444',
    fontSize: 14,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyText: {
    color: '#888',
    fontSize: 16,
    marginTop: 10,
  },
  listContent: {
    padding: 15,
  },
  historyItem: {
    backgroundColor: '#1a1a1a',
    borderRadius: 10,
    padding: 15,
    marginBottom: 15,
  },
  historyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  historyDate: {
    color: '#888',
    fontSize: 12,
  },
  historyLanguage: {
    color: '#4CAF50',
    fontSize: 12,
  },
  textContainer: {
    marginBottom: 10,
  },
  textHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 5,
  },
  textLabel: {
    color: '#888',
    fontSize: 14,
  },
  text: {
    color: '#fff',
    fontSize: 14,
  },
  playButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#4CAF50',
    justifyContent: 'center',
    alignItems: 'center',
  },
  playingButton: {
    backgroundColor: '#2a5a2c',
  },
});
