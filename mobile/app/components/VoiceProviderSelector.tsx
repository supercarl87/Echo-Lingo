/**
 * VoiceProviderSelector - Component for selecting voice provider and voice IDs
 * This component allows users to choose between ElevenLabs and Hume voice providers
 * and configure voice IDs for each provider
 */
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Modal,
  ScrollView,
  TextInput,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export interface VoiceProviderSettings {
  provider: 'elevenlabs' | 'hume';
  elevenLabsVoiceId: string;
  humeVoiceId: string;
}

interface VoiceProviderSelectorProps {
  isVisible: boolean;
  onClose: () => void;
  onSave: (settings: VoiceProviderSettings) => void;
  currentSettings: VoiceProviderSettings;
}

const PROVIDERS = [
  {
    id: 'elevenlabs' as const,
    name: 'ElevenLabs',
    description: 'High-quality voice synthesis',
    icon: 'volume-high',
  },
  {
    id: 'hume' as const,
    name: 'Hume AI',
    description: 'Emotionally expressive voice synthesis',
    icon: 'heart',
  },
];

export default function VoiceProviderSelector({
  isVisible,
  onClose,
  onSave,
  currentSettings,
}: VoiceProviderSelectorProps) {
  const [selectedProvider, setSelectedProvider] = useState<'elevenlabs' | 'hume'>(
    currentSettings.provider
  );
  const [elevenLabsVoiceId, setElevenLabsVoiceId] = useState(
    currentSettings.elevenLabsVoiceId
  );
  const [humeVoiceId, setHumeVoiceId] = useState(currentSettings.humeVoiceId);

  const handleSave = () => {
    // Validate voice IDs
    if (selectedProvider === 'elevenlabs' && !elevenLabsVoiceId.trim()) {
      Alert.alert('Error', 'Please enter a valid ElevenLabs Voice ID');
      return;
    }
    if (selectedProvider === 'hume' && !humeVoiceId.trim()) {
      Alert.alert('Error', 'Please enter a valid Hume Voice ID');
      return;
    }

    const settings: VoiceProviderSettings = {
      provider: selectedProvider,
      elevenLabsVoiceId: elevenLabsVoiceId.trim(),
      humeVoiceId: humeVoiceId.trim(),
    };

    onSave(settings);
    onClose();
  };

  const handleCancel = () => {
    // Reset to current settings
    setSelectedProvider(currentSettings.provider);
    setElevenLabsVoiceId(currentSettings.elevenLabsVoiceId);
    setHumeVoiceId(currentSettings.humeVoiceId);
    onClose();
  };

  return (
    <Modal
      visible={isVisible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={handleCancel}
    >
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <Pressable style={styles.headerButton} onPress={handleCancel}>
            <Text style={styles.headerButtonText}>Cancel</Text>
          </Pressable>
          <Text style={styles.headerTitle}>Voice Settings</Text>
          <Pressable style={styles.headerButton} onPress={handleSave}>
            <Text style={[styles.headerButtonText, styles.saveButtonText]}>
              Save
            </Text>
          </Pressable>
        </View>

        <ScrollView style={styles.content}>
          {/* Provider Selection */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Voice Provider</Text>
            <Text style={styles.sectionDescription}>
              Choose your preferred voice synthesis provider
            </Text>

            {PROVIDERS.map((provider) => (
              <Pressable
                key={provider.id}
                style={[
                  styles.providerOption,
                  selectedProvider === provider.id && styles.selectedProvider,
                ]}
                onPress={() => setSelectedProvider(provider.id)}
              >
                <Ionicons
                  name={provider.icon as any}
                  size={24}
                  color={selectedProvider === provider.id ? '#4CAF50' : '#888'}
                />
                <View style={styles.providerInfo}>
                  <Text style={styles.providerName}>{provider.name}</Text>
                  <Text style={styles.providerDescription}>
                    {provider.description}
                  </Text>
                </View>
                <View style={styles.radioButton}>
                  {selectedProvider === provider.id && (
                    <View style={styles.radioButtonInner} />
                  )}
                </View>
              </Pressable>
            ))}
          </View>

          {/* Voice ID Configuration */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Voice IDs</Text>
            <Text style={styles.sectionDescription}>
              Configure voice IDs for each provider
            </Text>

            {/* ElevenLabs Voice ID */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>ElevenLabs Voice ID</Text>
              <TextInput
                style={[
                  styles.textInput,
                  selectedProvider === 'elevenlabs' && styles.activeInput,
                ]}
                value={elevenLabsVoiceId}
                onChangeText={setElevenLabsVoiceId}
                placeholder="Enter ElevenLabs voice ID"
                placeholderTextColor="#666"
                editable={true}
              />
              <Text style={styles.inputHint}>
                Default: o47F6fLSHEFdPzySrC5z (if empty)
              </Text>
            </View>

            {/* Hume Voice ID */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Hume AI Voice ID</Text>
              <TextInput
                style={[
                  styles.textInput,
                  selectedProvider === 'hume' && styles.activeInput,
                ]}
                value={humeVoiceId}
                onChangeText={setHumeVoiceId}
                placeholder="Enter Hume voice ID"
                placeholderTextColor="#666"
                editable={true}
              />
              <Text style={styles.inputHint}>
                Default: 30edfa2e-7d75-45fb-8ccf-e280941393ee (if empty)
              </Text>
            </View>
          </View>

          {/* Information Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Information</Text>
            <View style={styles.infoBox}>
              <Ionicons name="information-circle" size={20} color="#4CAF50" />
              <Text style={styles.infoText}>
                Voice IDs determine the specific voice used for text-to-speech.
                You can find voice IDs in your provider's dashboard or use the
                defaults for quick setup.
              </Text>
            </View>
          </View>
        </ScrollView>
      </View>
    </Modal>
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
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  headerButton: {
    minWidth: 60,
  },
  headerButtonText: {
    color: '#4CAF50',
    fontSize: 16,
  },
  saveButtonText: {
    fontWeight: 'bold',
  },
  headerTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  section: {
    marginBottom: 30,
  },
  sectionTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  sectionDescription: {
    color: '#888',
    fontSize: 14,
    marginBottom: 20,
  },
  providerOption: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1a1a1a',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  selectedProvider: {
    borderColor: '#4CAF50',
    backgroundColor: '#1a2a1a',
  },
  providerInfo: {
    flex: 1,
    marginLeft: 12,
  },
  providerName: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  providerDescription: {
    color: '#888',
    fontSize: 14,
  },
  radioButton: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#4CAF50',
    justifyContent: 'center',
    alignItems: 'center',
  },
  radioButtonInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#4CAF50',
  },
  inputGroup: {
    marginBottom: 20,
  },
  inputLabel: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  textInput: {
    backgroundColor: '#1a1a1a',
    color: '#fff',
    padding: 16,
    borderRadius: 12,
    fontSize: 16,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  activeInput: {
    borderColor: '#4CAF50',
  },
  inputHint: {
    color: '#666',
    fontSize: 12,
    marginTop: 4,
    fontStyle: 'italic',
  },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#1a2a1a',
    padding: 16,
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#4CAF50',
  },
  infoText: {
    color: '#ccc',
    fontSize: 14,
    lineHeight: 20,
    marginLeft: 12,
    flex: 1,
  },
});