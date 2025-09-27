/**
 * TranslateScreen - Main screen for the audio translation application
 * This component handles recording audio, sending it to the server for translation,
 * and playing back the translated audio.
 */
import React, { useCallback, useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Platform,
  Alert,
} from 'react-native';
import { Audio } from 'expo-av'; // Audio recording and playback library
import { Ionicons } from '@expo/vector-icons'; // Icons for UI elements
import AsyncStorage from '@react-native-async-storage/async-storage'; // Local storage
import axios from 'axios'; // HTTP client for API requests
import { LANGUAGES, Language } from '../../types/languages'; // Language definitions
import { HistoryItem } from './history'; // Type definition for history items
import { router, useFocusEffect } from 'expo-router'; // For navigation and focus events
import * as FileSystem from 'expo-file-system/legacy'; // For file operations (using legacy API)
import { VoiceProviderSettings } from '../components/VoiceProviderSelector'; // Voice provider settings

// API endpoint for audio processing and translation
const API_URL = 'https://fond-workable-firefly.ngrok-free.app';
// Keys for storing data in AsyncStorage
const HISTORY_STORAGE_KEY = '@translation_history';
const SELECTED_LANGUAGE_KEY = '@selected_language';
const VOICE_PROVIDER_SETTINGS_KEY = '@voice_provider_settings';
// Directory for storing audio files
const AUDIO_DIRECTORY = `${FileSystem.documentDirectory}audio/`;

export default function TranslateScreen() {
  // State for audio recording
  const [recording, setRecording] = useState<Audio.Recording | null>(null);
  const [isRecording, setIsRecording] = useState(false);

  // State for translation results
  const [originalAudio, setOriginalAudio] = useState<string | null>(null);
  const [translatedAudio, setTranslatedAudio] = useState<string | null>(null);
  const [transcribedText, setTranscribedText] = useState<string>('');
  const [translatedText, setTranslatedText] = useState<string>('');

  // UI state
  const [isLoading, setIsLoading] = useState(false);
  const [sound, setSound] = useState<Audio.Sound | null>(null);
  const [selectedLanguage, setSelectedLanguage] = useState<Language>(
    LANGUAGES[0] // Default to first language in the list (Chinese)
  );
  const [voiceProviderSettings, setVoiceProviderSettings] = useState<VoiceProviderSettings>({
    provider: 'elevenlabs',
    elevenLabsVoiceId: 'o47F6fLSHEFdPzySrC5z', // Default from backend
    humeVoiceId: '30edfa2e-7d75-45fb-8ccf-e280941393ee', // Default from backend
  });
  const isAudioSessionPrepared = useRef(false); // Track if audio session is initialized
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [isPlayingOriginal, setIsPlayingOriginal] = useState(false);
  const [processingError, setProcessingError] = useState<string | null>(null);

  // Ensure audio directory exists when component mounts
  useEffect(() => {
    ensureAudioDirectoryExists();
  }, []);

  // Load the selected language and voice provider settings when component mounts
  useEffect(() => {
    loadSelectedLanguage();
    loadVoiceProviderSettings();
  }, []);

  // Reload settings whenever the screen comes into focus
  useFocusEffect(
    useCallback(() => {
      loadSelectedLanguage();
      loadVoiceProviderSettings();
      return () => {
        // This runs when the screen goes out of focus
      };
    }, [])
  );

  // Ensure the audio directory exists
  const ensureAudioDirectoryExists = async () => {
    try {
      const dirInfo = await FileSystem.getInfoAsync(AUDIO_DIRECTORY);
      if (!dirInfo.exists) {
        await FileSystem.makeDirectoryAsync(AUDIO_DIRECTORY, {
          intermediates: true,
        });
        console.log('Created audio directory');
      }
    } catch (error) {
      console.error('Error creating audio directory:', error);
    }
  };

  // Load the selected language from AsyncStorage
  const loadSelectedLanguage = async () => {
    try {
      const savedLanguage = await AsyncStorage.getItem(SELECTED_LANGUAGE_KEY);
      if (savedLanguage) {
        const parsedLanguage = JSON.parse(savedLanguage);
        // Find the language in our LANGUAGES array to ensure it's valid
        const foundLanguage = LANGUAGES.find(
          (lang) => lang.code === parsedLanguage.code
        );
        if (foundLanguage) {
          setSelectedLanguage(foundLanguage);
        }
      }
    } catch (error) {
      console.error('Error loading selected language:', error);
    }
  };

  // Load the voice provider settings from AsyncStorage
  const loadVoiceProviderSettings = async () => {
    try {
      const savedSettings = await AsyncStorage.getItem(VOICE_PROVIDER_SETTINGS_KEY);
      if (savedSettings) {
        const parsedSettings = JSON.parse(savedSettings);
        setVoiceProviderSettings({
          provider: parsedSettings.provider || 'elevenlabs',
          elevenLabsVoiceId: parsedSettings.elevenLabsVoiceId || 'o47F6fLSHEFdPzySrC5z',
          humeVoiceId: parsedSettings.humeVoiceId || '30edfa2e-7d75-45fb-8ccf-e280941393ee',
        });
      }
    } catch (error) {
      console.error('Error loading voice provider settings:', error);
    }
  };

  /**
   * Cleanup function to release audio resources
   * This prevents memory leaks and resource conflicts
   */
  const cleanupResources = useCallback(async () => {
    try {
      // Clean up recording resources
      if (recording) {
        try {
          const status = await recording.getStatusAsync();
          if (status.isRecording) {
            await recording.stopAndUnloadAsync();
          }
        } catch (error) {
          // Recording might already be unloaded, ignore the error
          console.error('Error stopping recording:', error);
        }
        setRecording(null);
      }
    } catch (error) {
      console.error('Error cleaning up recording:', error);
    }

    try {
      // Clean up sound playback resources
      if (sound) {
        try {
          const status = await sound.getStatusAsync();
          if (status.isLoaded) {
            await sound.stopAsync();
            await sound.unloadAsync();
          }
        } catch (error) {
          // Sound might already be unloaded, ignore the error
          console.error('Error stopping sound:', error);
        }
        setSound(null);
      }
    } catch (error) {
      console.error('Error cleaning up sound:', error);
    }

    // Reset playback state and audio session flag
    setIsPlayingAudio(false);
    setIsPlayingOriginal(false);
    isAudioSessionPrepared.current = false;
  }, [recording, sound]);

  // Cleanup resources when component unmounts
  useEffect(() => {
    return () => {
      cleanupResources();
    };
  }, [cleanupResources]);

  /**
   * Initialize the audio session for recording
   * This requests permissions and configures audio settings
   */
  const initializeAudioSession = async () => {
    if (isAudioSessionPrepared.current) return; // Skip if already initialized

    try {
      // Request microphone permissions
      await Audio.requestPermissionsAsync();
      // Configure audio mode for recording
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true, // Allow playback when device is in silent mode
      });
      isAudioSessionPrepared.current = true;
    } catch (error) {
      console.error('Failed to initialize audio session:', error);
      throw error;
    }
  };

  /**
   * Start recording audio from the device microphone
   */
  const startRecording = async () => {
    try {
      // Reset state for new recording
      setProcessingError(null);
      await cleanupResources();
      setIsRecording(false);
      setTranscribedText('');
      setTranslatedText('');
      setOriginalAudio(null);
      setTranslatedAudio(null);

      // Initialize audio session
      await initializeAudioSession();

      // Create a new recording with high quality preset
      const { recording: newRecording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );

      // Update state to reflect recording status
      setRecording(newRecording);
      setIsRecording(true);
    } catch (err) {
      console.error('Failed to start recording', err);
      setIsRecording(false);
      setRecording(null);
      setProcessingError('Failed to start recording. Please try again.');
    }
  };

  /**
   * Copy a file to the app's audio directory
   * @param uri Source URI of the file
   * @returns The URI of the copied file
   */
  const copyFileToAudioDirectory = async (uri: string): Promise<string> => {
    try {
      await ensureAudioDirectoryExists();

      const fileName = `recording-${Date.now()}.m4a`;
      const destinationUri = `${AUDIO_DIRECTORY}${fileName}`;

      await FileSystem.copyAsync({
        from: uri,
        to: destinationUri,
      });

      console.log(`Copied audio file to: ${destinationUri}`);

      // Verify the file was copied successfully
      const fileInfo = await FileSystem.getInfoAsync(destinationUri);
      if (!fileInfo.exists) {
        throw new Error('Failed to copy audio file');
      }

      return destinationUri;
    } catch (error) {
      console.error('Error copying file:', error);
      throw error;
    }
  };

  /**
   * Stop recording and process the recorded audio
   */
  const stopRecording = async () => {
    if (!recording || !isRecording) {
      setIsRecording(false);
      return;
    }

    try {
      setIsRecording(false);
      let uri: string | null = null;

      try {
        // Check if recording is active before stopping
        const status = await recording.getStatusAsync();
        if (status.isRecording) {
          await recording.stopAndUnloadAsync();
          uri = recording.getURI(); // Get the file URI of the recording
        }
      } catch (error) {
        console.error('Error stopping recording:', error);
      }

      setRecording(null);

      // Process the recorded audio if we have a valid URI
      if (uri) {
        try {
          // Copy the recording to a permanent location
          const permanentUri = await copyFileToAudioDirectory(uri);
          setOriginalAudio(permanentUri);
          console.log('Original audio saved to:', permanentUri);

          // Process the audio for translation
          await processAudio(uri, permanentUri);
        } catch (error) {
          console.error('Error saving original audio:', error);
          setProcessingError('Failed to save recording. Please try again.');
        }
      }
    } catch (err) {
      console.error('Failed to stop recording', err);
      setIsRecording(false);
      setProcessingError('Failed to stop recording. Please try again.');
    }
  };

  /**
   * Verify that an audio URL is accessible
   * @param url The URL to verify
   * @returns Boolean indicating if the URL is accessible
   */
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

  /**
   * Process the recorded audio by sending it to the server for transcription and translation
   * @param uri The local URI of the recorded audio file
   * @param originalAudioUri The permanent URI of the original audio file
   */
  const processAudio = async (uri: string, originalAudioUri: string) => {
    try {
      setIsLoading(true);
      setProcessingError(null);

      // Create form data with the audio file
      const formData = new FormData();
      formData.append('file', {
        uri,
        type: Platform.OS === 'ios' ? 'audio/x-m4a' : 'audio/m4a',
        name: 'recording.m4a',
      } as any);

      // Get current voice ID based on provider
      const currentVoiceId = voiceProviderSettings.provider === 'elevenlabs'
        ? voiceProviderSettings.elevenLabsVoiceId
        : voiceProviderSettings.humeVoiceId;

      // Send the audio to the server for processing
      const response = await axios.post(`${API_URL}/api/audio/process`, formData, {
        params: {
          target_language: selectedLanguage.name, // Target language for translation
          voice_provider: voiceProviderSettings.provider, // Voice provider (elevenlabs or hume)
          voice_id: currentVoiceId, // Voice ID for the selected provider
        },
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        timeout: 30000, // 30 second timeout for processing
      });

      const { transcribed_text, translated_text, audio_url } = response.data;

      // Validate response data
      if (!transcribed_text || !translated_text || !audio_url) {
        throw new Error('Invalid response from server');
      }

      // Ensure audio URL is absolute
      let fullAudioUrl = audio_url;
      if (!audio_url.startsWith('http')) {
        const cleanAudioUrl = audio_url.replace(/^\/+/, '');
        const cleanApiUrl = API_URL.replace(/\/+$/, '');
        fullAudioUrl = `${cleanApiUrl}/${cleanAudioUrl}`;
      }

      // Verify the audio URL is accessible
      const isAudioAccessible = await verifyAudioUrl(fullAudioUrl);
      if (!isAudioAccessible) {
        throw new Error('Audio file is not accessible');
      }

      // Update state with translation results
      setTranscribedText(transcribed_text);
      setTranslatedText(translated_text);
      setTranslatedAudio(fullAudioUrl);

      // Save to history
      await saveToHistory({
        id: Date.now().toString(),
        originalText: transcribed_text,
        translatedText: translated_text,
        originalAudioUrl: originalAudioUri,
        translatedAudioUrl: fullAudioUrl,
        date: new Date().toISOString(),
        targetLanguage: selectedLanguage.name,
      });
    } catch (error: any) {
      console.error('Error processing audio:', error);
      let errorMessage = 'Failed to process audio. Please try again.';

      // Provide more specific error messages based on the error type
      if (axios.isAxiosError(error)) {
        if (error.code === 'ECONNABORTED') {
          errorMessage = 'Request timed out. Please try again.';
        } else if (error.response?.status === 500) {
          errorMessage = 'Server error. Please try again later.';
        } else if (error.response?.status === 413) {
          errorMessage =
            'Audio file is too large. Please record a shorter message.';
        }
      } else if (error.message) {
        errorMessage = error.message;
      }

      setProcessingError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Save a translation to the history in AsyncStorage
   * @param historyItem The translation item to save
   */
  const saveToHistory = async (historyItem: HistoryItem) => {
    try {
      // Get existing history from storage
      const existingHistory = await AsyncStorage.getItem(HISTORY_STORAGE_KEY);
      const history: HistoryItem[] = existingHistory
        ? JSON.parse(existingHistory)
        : [];

      // Add new item at the beginning of the array
      history.unshift(historyItem);

      // Keep only the last 50 items to prevent storage from growing too large
      const trimmedHistory = history.slice(0, 50);

      // Save updated history back to storage
      await AsyncStorage.setItem(
        HISTORY_STORAGE_KEY,
        JSON.stringify(trimmedHistory)
      );

      console.log(
        'Saved to history with original audio:',
        historyItem.originalAudioUrl
      );
    } catch (error) {
      console.error('Error saving to history:', error);
    }
  };

  /**
   * Play audio from a URL
   * @param audioUrl The URL of the audio to play
   * @param isOriginal Whether this is the original audio (true) or translated audio (false)
   */
  const playAudio = async (audioUrl: string, isOriginal: boolean) => {
    if (!audioUrl || (isOriginal ? isPlayingOriginal : isPlayingAudio)) return;

    try {
      // Clean up any existing audio before playing new audio
      await cleanupResources();

      if (isOriginal) {
        setIsPlayingOriginal(true);
      } else {
        setIsPlayingAudio(true);
      }
      setProcessingError(null);

      // Verify the audio URL is still accessible
      const isAudioAccessible = await verifyAudioUrl(audioUrl);
      if (!isAudioAccessible) {
        throw new Error(`Audio file is not accessible: ${audioUrl}`);
      }

      console.log(
        `Playing ${
          isOriginal ? 'original' : 'translated'
        } audio from: ${audioUrl}`
      );

      // Create and play the sound
      const { sound: newSound } = await Audio.Sound.createAsync(
        { uri: audioUrl },
        { shouldPlay: true } // Start playing immediately
      );

      setSound(newSound);

      // Set up a callback for when playback status changes
      newSound.setOnPlaybackStatusUpdate(async (status) => {
        if (
          status.isLoaded &&
          'didJustFinish' in status &&
          status.didJustFinish
        ) {
          // Clean up when playback finishes
          if (isOriginal) {
            setIsPlayingOriginal(false);
          } else {
            setIsPlayingAudio(false);
          }
          await cleanupResources();
        }
      });
    } catch (error) {
      console.error('Error playing audio:', error);
      if (isOriginal) {
        setIsPlayingOriginal(false);
      } else {
        setIsPlayingAudio(false);
      }
      setProcessingError(
        `Failed to play ${
          isOriginal ? 'original' : 'translated'
        } audio. Please try again.`
      );
      await cleanupResources();
    }
  };

  /**
   * Play the original audio recording
   */
  const playOriginalAudio = () => {
    if (originalAudio) {
      playAudio(originalAudio, true);
    } else {
      Alert.alert('Error', 'Original audio is not available');
    }
  };

  /**
   * Play the translated audio
   */
  const playTranslatedAudio = () => {
    if (translatedAudio) {
      playAudio(translatedAudio, false);
    } else {
      Alert.alert('Error', 'Translated audio is not available');
    }
  };

  // Navigate to profile screen to change language
  const navigateToProfile = () => {
    router.push('/profile');
  };

  // Render the UI
  return (
    <View style={styles.container}>
      <View style={styles.contentContainer}>
        {/* Language display (not selector) */}
        <Pressable style={styles.languageDisplay} onPress={navigateToProfile}>
          <Text style={styles.languageFlag}>{selectedLanguage.flag}</Text>
          <View style={styles.languageInfo}>
            <Text style={styles.languageName}>
              {selectedLanguage.name}
              {selectedLanguage.variant && ` (${selectedLanguage.variant})`}
            </Text>
            <Text style={styles.languageCode}>{selectedLanguage.code}</Text>
          </View>
          <Text style={styles.changeLanguageText}>Change in Profile</Text>
        </Pressable>

        {/* Error display or translation results */}
        {processingError ? (
          <View style={styles.errorContainer}>
            <Ionicons name="alert-circle" size={24} color="#ff4444" />
            <Text style={styles.errorText}>{processingError}</Text>
          </View>
        ) : transcribedText ? (
          <>
            {/* Original text display with play button */}
            <View style={styles.textContainer}>
              <View style={styles.textHeader}>
                <Text style={styles.label}>Original Text:</Text>
                {originalAudio && (
                  <Pressable
                    style={[
                      styles.smallPlayButton,
                      isPlayingOriginal && styles.playButtonDisabled,
                    ]}
                    onPress={playOriginalAudio}
                    disabled={isPlayingOriginal}
                  >
                    <Ionicons
                      name={isPlayingOriginal ? 'pause' : 'play'}
                      size={16}
                      color="#fff"
                    />
                  </Pressable>
                )}
              </View>
              <Text style={styles.text}>{transcribedText}</Text>
            </View>

            {/* Translated text display with play button */}
            <View style={styles.textContainer}>
              <View style={styles.textHeader}>
                <Text style={styles.label}>Translated Text:</Text>
                {translatedAudio && (
                  <Pressable
                    style={[
                      styles.smallPlayButton,
                      isPlayingAudio && styles.playButtonDisabled,
                    ]}
                    onPress={playTranslatedAudio}
                    disabled={isPlayingAudio}
                  >
                    <Ionicons
                      name={isPlayingAudio ? 'pause' : 'play'}
                      size={16}
                      color="#fff"
                    />
                  </Pressable>
                )}
              </View>
              <Text style={styles.text}>{translatedText}</Text>
            </View>
          </>
        ) : (
          // Instructions when no translation is available
          <Text style={styles.instructions}>
            {isRecording ? 'Recording...' : 'Tap and hold the mic to record'}
          </Text>
        )}
      </View>

      {/* Control buttons */}
      <View style={styles.controls}>
        {/* Record button - press and hold to record */}
        <Pressable
          style={[styles.recordButton, isRecording && styles.recording]}
          onPressIn={startRecording}
          onPressOut={stopRecording}
        >
          <Ionicons
            name={isRecording ? 'radio-button-on' : 'mic'}
            size={32}
            color="#fff"
          />
        </Pressable>
      </View>

      {/* Loading overlay */}
      {isLoading && (
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Processing audio...</Text>
        </View>
      )}
    </View>
  );
}

// Styles for the component
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212', // Dark background for the app
  },
  contentContainer: {
    flex: 1,
    padding: 20,
  },
  languageDisplay: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1a1a1a',
    padding: 15,
    borderRadius: 10,
    marginBottom: 20,
  },
  languageFlag: {
    fontSize: 24,
    marginRight: 15,
  },
  languageInfo: {
    flex: 1,
  },
  languageName: {
    color: '#fff',
    fontSize: 16,
    marginBottom: 4,
  },
  languageCode: {
    color: '#888',
    fontSize: 12,
  },
  changeLanguageText: {
    color: '#4CAF50',
    fontSize: 12,
  },
  textContainer: {
    backgroundColor: '#1a1a1a',
    padding: 15,
    borderRadius: 10,
    marginBottom: 20,
  },
  textHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 5,
  },
  label: {
    color: '#888',
    fontSize: 14,
  },
  text: {
    color: '#fff',
    fontSize: 16,
  },
  instructions: {
    color: '#888',
    fontSize: 16,
    textAlign: 'center',
    marginTop: 20,
  },
  controls: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingBottom: 40,
    gap: 20,
  },
  recordButton: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: '#ff4444',
    justifyContent: 'center',
    alignItems: 'center',
  },
  recording: {
    backgroundColor: '#ff0000',
    transform: [{ scale: 1.1 }], // Enlarge button when recording
  },
  playButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#4CAF50',
    justifyContent: 'center',
    alignItems: 'center',
  },
  smallPlayButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#4CAF50',
    justifyContent: 'center',
    alignItems: 'center',
  },
  playButtonDisabled: {
    backgroundColor: '#2a5a2c',
  },
  errorContainer: {
    backgroundColor: '#1a1a1a',
    padding: 15,
    borderRadius: 10,
    marginBottom: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  errorText: {
    color: '#ff4444',
    fontSize: 14,
    flex: 1,
  },
  loadingContainer: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#fff',
    fontSize: 16,
  },
});
