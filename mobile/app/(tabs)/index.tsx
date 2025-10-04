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
  TextInput,
  ActivityIndicator,
<<<<<<< HEAD
  Animated,
=======
>>>>>>> main
} from 'react-native';
import { Audio } from 'expo-av'; // Audio recording and playback library
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics'; // Haptics for tactile feedback
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
const GUIDELINE_KEY = '@translation_guideline';
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
  const [guideline, setGuideline] = useState<string>(''); // Loaded from AsyncStorage
  const pulseScale = useRef(new Animated.Value(1)).current;
  const pulseOpacity = useRef(new Animated.Value(0)).current;
  const pulseAnimation = useRef<Animated.CompositeAnimation | null>(null);

  // Ensure audio directory exists when component mounts
  useEffect(() => {
    ensureAudioDirectoryExists();
  }, []);

  // Load the selected language and voice provider settings when component mounts
  useEffect(() => {
    loadSelectedLanguage();
    loadVoiceProviderSettings();
    loadGuideline();
  }, []);

  // Reload settings whenever the screen comes into focus
  useFocusEffect(
    useCallback(() => {
      loadSelectedLanguage();
      loadVoiceProviderSettings();
      loadGuideline();
      return () => {
        // This runs when the screen goes out of focus
      };
    }, [])
  );

  // Animate a subtle pulse around the record button while recording
  useEffect(() => {
    if (isRecording) {
      pulseOpacity.setValue(0.5);
      pulseAnimation.current?.stop();
      pulseAnimation.current = Animated.loop(
        Animated.sequence([
          Animated.parallel([
            Animated.timing(pulseScale, {
              toValue: 1.35,
              duration: 700,
              useNativeDriver: true,
            }),
            Animated.timing(pulseOpacity, {
              toValue: 0,
              duration: 700,
              useNativeDriver: true,
            }),
          ]),
          Animated.parallel([
            Animated.timing(pulseScale, {
              toValue: 1,
              duration: 700,
              useNativeDriver: true,
            }),
            Animated.timing(pulseOpacity, {
              toValue: 0.5,
              duration: 700,
              useNativeDriver: true,
            }),
          ]),
        ])
      );
      pulseAnimation.current.start();
    } else {
      pulseAnimation.current?.stop();
      pulseAnimation.current = null;
      pulseScale.setValue(1);
      pulseOpacity.setValue(0);
    }

    return () => {
      pulseAnimation.current?.stop();
    };
  }, [isRecording, pulseOpacity, pulseScale]);

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

  // Load the guideline from AsyncStorage
  const loadGuideline = async () => {
    try {
      const savedGuideline = await AsyncStorage.getItem(GUIDELINE_KEY);
      if (savedGuideline) {
        setGuideline(savedGuideline);
      }
    } catch (error) {
      console.error('Error loading guideline:', error);
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

      // Haptic feedback: medium impact when recording starts
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

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
   * Check audio duration
   * @param uri The URI of the audio file
   * @returns Duration in milliseconds
   */
  const getAudioDuration = async (uri: string): Promise<number> => {
    try {
      const { sound } = await Audio.Sound.createAsync({ uri });
      const status = await sound.getStatusAsync();
      await sound.unloadAsync();

      if (status.isLoaded) {
        return status.durationMillis || 0;
      }
      return 0;
    } catch (error) {
      console.error('Error getting audio duration:', error);
      return 0;
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
      // Haptic feedback: light impact when recording stops
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
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
          // Check audio duration before processing
          const duration = await getAudioDuration(uri);
          const durationSeconds = duration / 1000;

          console.log(`Audio duration: ${durationSeconds.toFixed(2)} seconds`);

          if (durationSeconds < 1.5) {
            setProcessingError('Recording too short. Please record at least 1.5 seconds of audio.');
            return;
          }

          // Copy the recording to a permanent location
          const permanentUri = await copyFileToAudioDirectory(uri);
          setOriginalAudio(permanentUri);
          console.log('Original audio saved to:', permanentUri);

          // Process the audio for translation
          await processAudio(uri, permanentUri, true); // pass flag to auto-play and haptic
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
  // Accepts autoPlayAndHaptic flag for post-processing feedback
  const processAudio = async (uri: string, originalAudioUri: string, autoPlayAndHaptic = false) => {
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
          guideline: guideline || undefined, // Translation guideline (optional)
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

      // If requested, auto-play translated audio and fire success haptic
      if (autoPlayAndHaptic) {
        playAudio(fullAudioUrl, false);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }

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
   * Download audio file to local storage
   * @param audioUrl The URL of the audio to download
   * @param isOriginal Whether this is the original audio (for filename)
   * @returns The local file URI
   */
  const downloadAudioFile = async (audioUrl: string, isOriginal: boolean): Promise<string> => {
    try {
      // If it's already a local file, return it as-is
      if (audioUrl.startsWith('file://')) {
        return audioUrl;
      }

      await ensureAudioDirectoryExists();

      // Extract file extension from URL
      let fileExtension = 'm4a'; // Default extension
      const urlPath = audioUrl.split('?')[0]; // Remove query parameters
      const urlExtension = urlPath.split('.').pop()?.toLowerCase();

      // Use the extension from URL if it's a valid audio format
      if (urlExtension && ['mp3', 'm4a', 'wav', 'aac', 'ogg'].includes(urlExtension)) {
        fileExtension = urlExtension;
      }

      const fileName = `${isOriginal ? 'original' : 'translated'}-${Date.now()}.${fileExtension}`;
      const destinationUri = `${AUDIO_DIRECTORY}${fileName}`;

      console.log(`Downloading audio from ${audioUrl} to ${destinationUri}`);

      const downloadResult = await FileSystem.downloadAsync(audioUrl, destinationUri);

      if (downloadResult.status !== 200) {
        throw new Error(`Failed to download audio: ${downloadResult.status}`);
      }

      // Verify the file was downloaded successfully
      const fileInfo = await FileSystem.getInfoAsync(destinationUri);
      if (!fileInfo.exists) {
        throw new Error('Downloaded file does not exist');
      }

      console.log(`Audio downloaded successfully to: ${destinationUri}`);
      return destinationUri;
    } catch (error) {
      console.error('Error downloading audio:', error);
      throw error;
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

      // Subtle haptic pulse to confirm playback initiated
      void Haptics.selectionAsync();

      // Verify the audio URL is still accessible before downloading
      const isAudioAccessible = await verifyAudioUrl(audioUrl);
      if (!isAudioAccessible) {
        throw new Error(`Audio file is not accessible: ${audioUrl}`);
      }

      // Download audio file to local storage before playing
      const localUri = await downloadAudioFile(audioUrl, isOriginal);

      console.log(
        `Playing ${
          isOriginal ? 'original' : 'translated'
        } audio from: ${localUri}`
      );

      // Create and play the sound from local file
      const { sound: newSound } = await Audio.Sound.createAsync(
        { uri: localUri },
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
    <LinearGradient
      colors={['#101015', '#0c0c12', '#070709']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.container}
    >
      <View style={styles.contentContainer}>
        {/* Language display (not selector) */}
        <Pressable
          onPress={navigateToProfile}
          style={({ pressed }) => [
            styles.languageDisplay,
            styles.cardShadow,
            pressed && styles.languageDisplayPressed,
          ]}
        >
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
          <View style={[styles.errorContainer, styles.cardShadow]}>
            <Ionicons name="alert-circle" size={24} color="#ff4444" />
            <Text style={styles.errorText}>{processingError}</Text>
          </View>
        ) : transcribedText ? (
          <>
            {/* Original text display with play button */}
            <View style={[styles.textContainer, styles.cardShadow]}>
              <View style={styles.textHeader}>
                <Text style={styles.label}>Original Text:</Text>
                {originalAudio && (
                  <Pressable
                    style={({ pressed }) => [
                      styles.smallPlayButton,
                      styles.controlShadow,
                      isPlayingOriginal && styles.playButtonDisabled,
                      pressed && !isPlayingOriginal && styles.smallPlayButtonPressed,
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
            <View style={[styles.textContainer, styles.cardShadow]}>
              <View style={styles.textHeader}>
                <Text style={styles.label}>Translated Text:</Text>
                {translatedAudio && (
                  <Pressable
                    style={({ pressed }) => [
                      styles.smallPlayButton,
                      styles.controlShadow,
                      isPlayingAudio && styles.playButtonDisabled,
                      pressed && !isPlayingAudio && styles.smallPlayButtonPressed,
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
<<<<<<< HEAD
        <View style={styles.recordButtonWrapper}>
          <Animated.View
            pointerEvents="none"
            style={[
              styles.recordPulse,
              {
                opacity: pulseOpacity,
                transform: [{ scale: pulseScale }],
              },
            ]}
          />
          <Pressable
            style={({ pressed }) => [
              styles.recordButtonPressable,
              styles.controlShadow,
              pressed && styles.recordButtonPressed,
            ]}
            onPressIn={startRecording}
            onPressOut={stopRecording}
          >
            <LinearGradient
              colors={isRecording ? ['#ff5658', '#ff1f46'] : ['#ff6f61', '#ff2d55']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={[styles.recordButton, isRecording && styles.recording]}
            >
              <View style={styles.recordButtonInner}>
                <Ionicons
                  name={isRecording ? 'radio-button-on' : 'mic'}
                  size={32}
                  color="#fff"
                />
              </View>
            </LinearGradient>
          </Pressable>
        </View>
      </View>

      {/* Loading overlay */}
      {isLoading && (
        <View style={styles.loadingContainer}>
          <View style={styles.loadingContent}>
            <ActivityIndicator size="small" color="#fff" />
            <Text style={styles.loadingText}>Processing audio...</Text>
          </View>
        </View>
      )}
    </LinearGradient>
=======
        <Pressable
          style={[
            styles.recordButton,
            isRecording && styles.recording,
            isLoading && styles.recordButtonDisabled,
          ]}
          onPressIn={startRecording}
          onPressOut={stopRecording}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator size="large" color="#fff" />
          ) : (
            <Ionicons
              name={isRecording ? 'radio-button-on' : 'mic'}
              size={32}
              color="#fff"
            />
          )}
        </Pressable>
        {isLoading && (
          <Text style={styles.processingText}>Processing...</Text>
        )}
      </View>
    </View>
>>>>>>> main
  );
}

// Styles for the component
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0b0b0f',
  },
  contentContainer: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 28,
    paddingBottom: 40,
    gap: 20,
  },
  cardShadow: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.35,
    shadowRadius: 24,
    elevation: 10,
  },
  languageDisplay: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(24, 24, 32, 0.92)',
    paddingVertical: 18,
    paddingHorizontal: 20,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.07)',
    marginBottom: 12,
  },
  languageDisplayPressed: {
    transform: [{ scale: 0.98 }],
    backgroundColor: 'rgba(30, 30, 38, 0.95)',
    borderColor: 'rgba(255, 255, 255, 0.12)',
  },
  languageFlag: {
    fontSize: 26,
    marginRight: 16,
  },
  languageInfo: {
    flex: 1,
  },
  languageName: {
    color: '#fff',
    fontSize: 17,
    marginBottom: 4,
    fontWeight: '600',
  },
  languageCode: {
    color: 'rgba(255, 255, 255, 0.6)',
    fontSize: 12,
    letterSpacing: 0.6,
    textTransform: 'uppercase',
  },
  changeLanguageText: {
    color: '#5fd58f',
    fontSize: 12,
    fontWeight: '600',
  },
  textContainer: {
    backgroundColor: 'rgba(18, 18, 26, 0.92)',
    padding: 18,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
    marginBottom: 20,
  },
  textHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  label: {
    color: 'rgba(255, 255, 255, 0.65)',
    fontSize: 14,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  text: {
    color: '#fff',
    fontSize: 16,
    lineHeight: 22,
  },
  instructions: {
    color: 'rgba(255, 255, 255, 0.6)',
    fontSize: 16,
    textAlign: 'center',
    marginTop: 20,
  },
  controls: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingBottom: 40,
    marginTop: -4,
  },
  recordButtonWrapper: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 12,
  },
  recordPulse: {
    position: 'absolute',
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: 'rgba(255, 80, 100, 0.22)',
  },
  controlShadow: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.35,
    shadowRadius: 20,
    elevation: 12,
  },
  recordButtonPressable: {
    width: 96,
    height: 96,
    borderRadius: 48,
    justifyContent: 'center',
    alignItems: 'center',
  },
  recordButtonPressed: {
    transform: [{ scale: 0.97 }],
  },
  recordButton: {
    width: '100%',
    height: '100%',
    borderRadius: 48,
    padding: 3,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.18)',
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
  },
  recordButtonInner: {
    width: '100%',
    height: '100%',
    borderRadius: 45,
    backgroundColor: 'rgba(12, 12, 18, 0.75)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  recording: {
    transform: [{ scale: 1.05 }],
    borderColor: 'rgba(255, 255, 255, 0.32)',
    shadowColor: '#ff3b5c',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.45,
    shadowRadius: 28,
    elevation: 14,
  },
  recordButtonDisabled: {
    backgroundColor: '#666',
    opacity: 0.7,
  },
  processingText: {
    color: '#fff',
    fontSize: 14,
    marginTop: 10,
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
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#4CAF50',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
  },
  smallPlayButtonPressed: {
    transform: [{ scale: 0.92 }],
    backgroundColor: '#3fa74a',
  },
  playButtonDisabled: {
    backgroundColor: '#2a5a2c',
  },
  errorContainer: {
    backgroundColor: 'rgba(24, 24, 32, 0.92)',
    padding: 16,
    borderRadius: 16,
    marginBottom: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  errorText: {
    color: '#ff6f6f',
    fontSize: 14,
    flex: 1,
  },
  loadingContainer: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: 'rgba(0,0,0,0.55)',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  loadingText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
