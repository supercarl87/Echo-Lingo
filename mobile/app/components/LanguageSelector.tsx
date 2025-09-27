import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  FlatList,
  Pressable,
  useWindowDimensions,
} from 'react-native';
import { Language } from '../../types/languages';

interface LanguageSelectorProps {
  isVisible: boolean;
  onClose: () => void;
  onSelect: (language: Language) => void;
  languages: Language[];
  selectedLanguage: Language;
}

export default function LanguageSelector({
  isVisible,
  onClose,
  onSelect,
  languages,
  selectedLanguage,
}: LanguageSelectorProps) {
  const { height } = useWindowDimensions();

  const renderLanguageItem = ({ item }: { item: Language }) => (
    <Pressable
      style={[
        styles.languageItem,
        item.code === selectedLanguage.code && styles.selectedItem,
      ]}
      onPress={() => {
        onSelect(item);
        onClose();
      }}>
      <Text style={styles.flag}>{item.flag}</Text>
      <View style={styles.languageInfo}>
        <Text style={styles.languageName}>
          {item.name}
          {item.variant && ` (${item.variant})`}
        </Text>
        <Text style={styles.languageCode}>{item.code}</Text>
      </View>
    </Pressable>
  );

  return (
    <Modal
      visible={isVisible}
      transparent
      animationType="slide"
      onRequestClose={onClose}>
      <View style={styles.modalContainer}>
        <View style={[styles.modalContent, { maxHeight: height * 0.7 }]}>
          <View style={styles.header}>
            <Text style={styles.title}>Select Language</Text>
            <Pressable onPress={onClose} style={styles.closeButton}>
              <Text style={styles.closeButtonText}>✕</Text>
            </Pressable>
          </View>
          <FlatList
            data={languages}
            renderItem={renderLanguageItem}
            keyExtractor={(item) => item.code}
            showsVerticalScrollIndicator={false}
          />
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    width: '90%',
    backgroundColor: '#1a1a1a',
    borderRadius: 15,
    overflow: 'hidden',
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
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  closeButton: {
    padding: 5,
  },
  closeButtonText: {
    color: '#888',
    fontSize: 20,
  },
  languageItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  selectedItem: {
    backgroundColor: '#2a2a2a',
  },
  flag: {
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
});