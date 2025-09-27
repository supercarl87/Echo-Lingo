/**
 * This file defines the language options supported by the application.
 * It provides a structured way to represent languages with their codes, names, flags, and variants.
 */

// Define the Language interface that specifies the structure for language objects
export interface Language {
  code: string;      // ISO language code (e.g., 'en-US', 'zh')
  name: string;      // Display name of the language (e.g., 'English', 'Chinese')
  flag: string;      // Emoji flag representing the country/region
  variant?: string;  // Optional variant specification (e.g., 'USA', 'UK')
}

/**
 * LANGUAGES array contains all supported languages in the application.
 * Each language is represented as an object conforming to the Language interface.
 * 
 * The array includes:
 * - Major world languages with their ISO codes
 * - Country/region-specific variants where applicable (e.g., different English variants)
 * - Flag emoji for visual identification
 * 
 * This data structure can be used for:
 * - Populating language selection dropdowns/lists
 * - Supporting internationalization (i18n) features
 * - Identifying user language preferences
 */
export const LANGUAGES: Language[] = [
  { code: 'zh', name: 'Chinese', flag: '🇨🇳' },
  { code: 'en-US', name: 'English', flag: '🇺🇸', variant: 'USA' },
  { code: 'en-GB', name: 'English', flag: '🇬🇧', variant: 'UK' },
  { code: 'en-AU', name: 'English', flag: '🇦🇺', variant: 'Australia' },
  { code: 'en-CA', name: 'English', flag: '🇨🇦', variant: 'Canada' },
  { code: 'ja', name: 'Japanese', flag: '🇯🇵' },
  { code: 'de', name: 'German', flag: '🇩🇪' },
  { code: 'hi', name: 'Hindi', flag: '🇮🇳' },
  { code: 'fr-FR', name: 'French', flag: '🇫🇷', variant: 'France' },
  { code: 'fr-CA', name: 'French', flag: '🇨🇦', variant: 'Canada' },
  { code: 'ko', name: 'Korean', flag: '🇰🇷' },
  { code: 'pt-BR', name: 'Portuguese', flag: '🇧🇷', variant: 'Brazil' },
  { code: 'pt-PT', name: 'Portuguese', flag: '🇵🇹', variant: 'Portugal' },
  { code: 'it', name: 'Italian', flag: '🇮🇹' },
  { code: 'es-ES', name: 'Spanish', flag: '🇪🇸', variant: 'Spain' },
  { code: 'es-MX', name: 'Spanish', flag: '🇲🇽', variant: 'Mexico' },
  { code: 'id', name: 'Indonesian', flag: '🇮🇩' },
  { code: 'nl', name: 'Dutch', flag: '🇳🇱' },
  { code: 'tr', name: 'Turkish', flag: '🇹🇷' },
  { code: 'fil', name: 'Filipino', flag: '🇵🇭' },
  { code: 'pl', name: 'Polish', flag: '🇵🇱' },
  { code: 'sv', name: 'Swedish', flag: '🇸🇪' },
  { code: 'bg', name: 'Bulgarian', flag: '🇧🇬' },
  { code: 'ro', name: 'Romanian', flag: '🇷🇴' },
  { code: 'ar-SA', name: 'Arabic', flag: '🇸🇦', variant: 'Saudi Arabia' },
  { code: 'ar-AE', name: 'Arabic', flag: '🇦🇪', variant: 'UAE' },
  { code: 'cs', name: 'Czech', flag: '🇨🇿' },
  { code: 'el', name: 'Greek', flag: '🇬🇷' },
  { code: 'fi', name: 'Finnish', flag: '🇫🇮' },
  { code: 'hr', name: 'Croatian', flag: '🇭🇷' },
  { code: 'ms', name: 'Malay', flag: '🇲🇾' },
  { code: 'sk', name: 'Slovak', flag: '🇸🇰' },
  { code: 'da', name: 'Danish', flag: '🇩🇰' },
  { code: 'ta', name: 'Tamil', flag: '🇮🇳' },
  { code: 'uk', name: 'Ukrainian', flag: '🇺🇦' },
  { code: 'ru', name: 'Russian', flag: '🇷🇺' },
];