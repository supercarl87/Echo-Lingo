/**
 * ProfileScreen - User profile and settings screen
 * This component allows users to select their preferred language and manage profile settings
 */
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  Alert,
  TextInput,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LANGUAGES, Language } from '../../types/languages';
import LanguageSelector from '../components/LanguageSelector';
import VoiceProviderSelector, { VoiceProviderSettings } from '../components/VoiceProviderSelector';

// Keys for storing settings in AsyncStorage
const SELECTED_LANGUAGE_KEY = '@selected_language';
const VOICE_PROVIDER_SETTINGS_KEY = '@voice_provider_settings';
const GUIDELINE_KEY = '@translation_guideline';

// Preset guideline interface
interface GuidelinePreset {
  id: string;
  name: string;
  icon: string;
  text: string;
}

// Preset guidelines for common travel scenarios
const GUIDELINE_PRESETS: GuidelinePreset[] = [
  {
    id: 'emergency',
    name: 'Emergency',
    icon: '🚨',
    text: 'Translate urgently and clearly. Use simple, direct language. Include important medical or safety terms.',
  },
  {
    id: 'dating',
    name: 'Dating',
    icon: '💋',
    text: 'Make it flirty and charming. Add playful undertones and romantic flair. Keep it spicy but respectful.',
  },
  {
    id: 'restaurant',
    name: 'Restaurant',
    icon: '🍽️',
    text: 'Use polite dining language. Help with ordering food, asking about ingredients, and expressing dietary preferences.',
  },
  {
    id: 'shopping',
    name: 'Shopping',
    icon: '🛍️',
    text: 'Translate for bargaining and price discussions. Help with asking about sizes, colors, and making purchases.',
  },
  {
    id: 'directions',
    name: 'Directions',
    icon: '🗺️',
    text: 'Focus on location-related terms. Help with asking for directions, understanding street names, and transportation.',
  },
  {
    id: 'hotel',
    name: 'Hotel',
    icon: '🏨',
    text: 'Use professional hospitality language. Help with check-in, room requests, and hotel service inquiries.',
  },
  {
    id: 'casual',
    name: 'Casual Chat',
    icon: '💬',
    text: 'Keep it friendly and conversational. Use casual, everyday language for meeting new people.',
  },
  {
    id: 'business',
    name: 'Business',
    icon: '💼',
    text: 'Use formal, professional language. Maintain business etiquette and clear communication.',
  },
];

export default function ProfileScreen() {
  const [showLanguageSelector, setShowLanguageSelector] = useState(false);
  const [showVoiceProviderSelector, setShowVoiceProviderSelector] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState<Language>(
    LANGUAGES[0]
  );
  const [voiceProviderSettings, setVoiceProviderSettings] = useState<VoiceProviderSettings>({
    provider: 'elevenlabs',
    elevenLabsVoiceId: 'o47F6fLSHEFdPzySrC5z', // Default from backend
    humeVoiceId: '30edfa2e-7d75-45fb-8ccf-e280941393ee', // Default from backend
  });
  const [guideline, setGuideline] = useState<string>('');
  const [selectedPreset, setSelectedPreset] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Load the saved preferences when component mounts
  useEffect(() => {
    loadSelectedLanguage();
    loadVoiceProviderSettings();
    loadGuideline();
  }, []);

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

  // Save the selected language to AsyncStorage
  const saveSelectedLanguage = async (language: Language) => {
    try {
      setIsSaving(true);
      await AsyncStorage.setItem(
        SELECTED_LANGUAGE_KEY,
        JSON.stringify(language)
      );
      setSelectedLanguage(language);

      // Show a brief confirmation message
      Alert.alert(
        'Language Updated',
        `Translation language set to ${language.name}${
          language.variant ? ` (${language.variant})` : ''
        }`,
        [{ text: 'OK' }],
        { cancelable: true }
      );
    } catch (error) {
      console.error('Error saving selected language:', error);
      Alert.alert(
        'Error',
        'Failed to save language preference. Please try again.',
        [{ text: 'OK' }]
      );
    } finally {
      setIsSaving(false);
    }
  };

  // Save the voice provider settings to AsyncStorage
  const saveVoiceProviderSettings = async (settings: VoiceProviderSettings) => {
    try {
      setIsSaving(true);
      await AsyncStorage.setItem(
        VOICE_PROVIDER_SETTINGS_KEY,
        JSON.stringify(settings)
      );
      setVoiceProviderSettings(settings);

      // Show a brief confirmation message
      Alert.alert(
        'Voice Settings Updated',
        `Voice provider set to ${settings.provider === 'elevenlabs' ? 'ElevenLabs' : 'Hume AI'}`,
        [{ text: 'OK' }],
        { cancelable: true }
      );
    } catch (error) {
      console.error('Error saving voice provider settings:', error);
      Alert.alert(
        'Error',
        'Failed to save voice settings. Please try again.',
        [{ text: 'OK' }]
      );
    } finally {
      setIsSaving(false);
    }
  };

  // Handle language selection
  const handleLanguageSelect = (language: Language) => {
    saveSelectedLanguage(language);
  };

  // Handle voice provider settings selection
  const handleVoiceProviderSelect = (settings: VoiceProviderSettings) => {
    saveVoiceProviderSettings(settings);
  };

  // Handle preset selection
  const handlePresetSelect = (preset: GuidelinePreset) => {
    setSelectedPreset(preset.id);
    setGuideline(preset.text);
  };

  // Clear preset selection (for custom guideline)
  const clearPresetSelection = () => {
    setSelectedPreset(null);
  };

  // Save the guideline to AsyncStorage
  const saveGuideline = async () => {
    try {
      setIsSaving(true);
      await AsyncStorage.setItem(GUIDELINE_KEY, guideline);
      Alert.alert(
        'Guideline Saved',
        'Translation guideline has been updated',
        [{ text: 'OK' }],
        { cancelable: true }
      );
    } catch (error) {
      console.error('Error saving guideline:', error);
      Alert.alert(
        'Error',
        'Failed to save guideline. Please try again.',
        [{ text: 'OK' }]
      );
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Ionicons name="person-circle" size={80} color="#fff" />
        <Text style={styles.headerTitle}>Profile</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Language Settings</Text>
        <Text style={styles.sectionDescription}>
          Select your preferred translation language
        </Text>

        <Pressable
          style={styles.languageSelector}
          onPress={() => setShowLanguageSelector(true)}
          disabled={isSaving}
        >
          <Text style={styles.languageFlag}>{selectedLanguage.flag}</Text>
          <View style={styles.languageInfo}>
            <Text style={styles.languageName}>
              {selectedLanguage.name}
              {selectedLanguage.variant && ` (${selectedLanguage.variant})`}
            </Text>
            <Text style={styles.languageCode}>{selectedLanguage.code}</Text>
          </View>
          <Ionicons name="chevron-forward" size={24} color="#888" />
        </Pressable>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Voice Settings</Text>
        <Text style={styles.sectionDescription}>
          Configure voice provider and voice IDs for text-to-speech
        </Text>

        <Pressable
          style={styles.languageSelector}
          onPress={() => setShowVoiceProviderSelector(true)}
          disabled={isSaving}
        >
          <Ionicons
            name={voiceProviderSettings.provider === 'elevenlabs' ? 'volume-high' : 'heart'}
            size={24}
            color="#4CAF50"
          />
          <View style={styles.languageInfo}>
            <Text style={styles.languageName}>
              {voiceProviderSettings.provider === 'elevenlabs' ? 'ElevenLabs' : 'Hume AI'}
            </Text>
            <Text style={styles.languageCode}>
              {voiceProviderSettings.provider === 'elevenlabs'
                ? `ID: ${voiceProviderSettings.elevenLabsVoiceId.slice(0, 8)}...`
                : `ID: ${voiceProviderSettings.humeVoiceId.slice(0, 8)}...`
              }
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={24} color="#888" />
        </Pressable>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Translation Guideline</Text>
        <Text style={styles.sectionDescription}>
          Choose a preset or create your own custom guideline
        </Text>

        {/* Preset buttons grid */}
        <View style={styles.presetGrid}>
          {GUIDELINE_PRESETS.map((preset) => (
            <Pressable
              key={preset.id}
              style={[
                styles.presetButton,
                selectedPreset === preset.id && styles.presetButtonSelected,
              ]}
              onPress={() => handlePresetSelect(preset)}
            >
              <Text style={styles.presetIcon}>{preset.icon}</Text>
              <Text
                style={[
                  styles.presetName,
                  selectedPreset === preset.id && styles.presetNameSelected,
                ]}
              >
                {preset.name}
              </Text>
            </Pressable>
          ))}
        </View>

        {/* Guideline text input */}
        <View style={styles.guidelineTextContainer}>
          <View style={styles.guidelineHeader}>
            <Text style={styles.guidelineLabel}>
              {selectedPreset ? 'Edit Preset Guideline' : 'Custom Guideline'}
            </Text>
            {selectedPreset && (
              <Pressable onPress={clearPresetSelection}>
                <Text style={styles.clearPresetText}>Clear Preset</Text>
              </Pressable>
            )}
          </View>
          <TextInput
            style={styles.guidelineInput}
            placeholder="Enter translation guidelines..."
            placeholderTextColor="#666"
            value={guideline}
            onChangeText={(text) => {
              setGuideline(text);
              // If user edits, clear preset selection
              if (selectedPreset) {
                const preset = GUIDELINE_PRESETS.find((p) => p.id === selectedPreset);
                if (preset && text !== preset.text) {
                  clearPresetSelection();
                }
              }
            }}
            multiline
            numberOfLines={4}
            textAlignVertical="top"
          />
        </View>

        <Pressable
          style={[styles.saveButton, isSaving && styles.saveButtonDisabled]}
          onPress={saveGuideline}
          disabled={isSaving}
        >
          <Text style={styles.saveButtonText}>
            {isSaving ? 'Saving...' : 'Save Guideline'}
          </Text>
        </Pressable>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>About</Text>
        <Text style={styles.sectionDescription}>
          Audio Translation App v1.0
        </Text>
        <Text style={styles.aboutText}>
          This application allows you to record audio and translate it into
          multiple languages.
        </Text>
      </View>

      {/* Language selector modal */}
      <LanguageSelector
        isVisible={showLanguageSelector}
        onClose={() => setShowLanguageSelector(false)}
        onSelect={handleLanguageSelect}
        languages={LANGUAGES}
        selectedLanguage={selectedLanguage}
      />

      {/* Voice provider selector modal */}
      <VoiceProviderSelector
        isVisible={showVoiceProviderSelector}
        onClose={() => setShowVoiceProviderSelector(false)}
        onSave={handleVoiceProviderSelect}
        currentSettings={voiceProviderSettings}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212',
  },
  header: {
    alignItems: 'center',
    padding: 20,
    paddingTop: 40,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginTop: 10,
  },
  section: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 10,
  },
  sectionDescription: {
    fontSize: 14,
    color: '#888',
    marginBottom: 20,
  },
  languageSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1a1a1a',
    padding: 15,
    borderRadius: 10,
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
  aboutText: {
    color: '#fff',
    fontSize: 14,
    lineHeight: 20,
  },
  presetGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 20,
  },
  presetButton: {
    backgroundColor: '#1a1a1a',
    borderRadius: 10,
    padding: 12,
    width: '48%',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  presetButtonSelected: {
    borderColor: '#4CAF50',
    backgroundColor: '#1a3a1c',
  },
  presetIcon: {
    fontSize: 32,
    marginBottom: 5,
  },
  presetName: {
    color: '#888',
    fontSize: 12,
    textAlign: 'center',
  },
  presetNameSelected: {
    color: '#4CAF50',
    fontWeight: 'bold',
  },
  guidelineTextContainer: {
    marginBottom: 15,
  },
  guidelineHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  guidelineLabel: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  clearPresetText: {
    color: '#ff4444',
    fontSize: 12,
  },
  guidelineInput: {
    backgroundColor: '#1a1a1a',
    color: '#fff',
    fontSize: 14,
    padding: 15,
    borderRadius: 10,
    minHeight: 100,
    maxHeight: 150,
  },
  saveButton: {
    backgroundColor: '#4CAF50',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
  },
  saveButtonDisabled: {
    backgroundColor: '#2a5a2c',
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
