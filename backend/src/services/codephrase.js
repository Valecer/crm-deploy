/**
 * Codephrase Service
 * Handles codephrase generation and validation for password recovery
 */

import { getDatabase } from '../database/sqlite.js';

/**
 * Word list for codephrase generation
 * Common, easy-to-remember words for recovery codephrases
 */
const WORD_LIST = [
  'correct', 'horse', 'battery', 'staple', 'apple', 'banana', 'orange', 'grape',
  'mountain', 'river', 'ocean', 'forest', 'desert', 'valley', 'canyon', 'lake',
  'sunshine', 'moonlight', 'starlight', 'cloudy', 'rainbow', 'thunder', 'lightning',
  'computer', 'keyboard', 'monitor', 'mouse', 'printer', 'scanner', 'laptop', 'tablet',
  'elephant', 'tiger', 'lion', 'bear', 'eagle', 'hawk', 'dolphin', 'whale',
  'blue', 'green', 'yellow', 'red', 'purple', 'orange', 'black', 'white',
  'happy', 'smile', 'laugh', 'joy', 'peace', 'calm', 'serene', 'bright',
  'coffee', 'tea', 'juice', 'water', 'soda', 'milk', 'honey', 'sugar',
  'music', 'guitar', 'piano', 'violin', 'drum', 'flute', 'trumpet', 'saxophone',
  'book', 'paper', 'pen', 'pencil', 'marker', 'notebook', 'diary', 'journal',
  'flower', 'rose', 'tulip', 'daisy', 'lily', 'sunflower', 'orchid', 'daffodil',
  'house', 'door', 'window', 'roof', 'garden', 'fence', 'gate', 'path',
  'car', 'truck', 'bus', 'train', 'plane', 'bike', 'boat', 'ship',
  'phone', 'camera', 'watch', 'clock', 'radio', 'tv', 'speaker', 'headphone',
  'shoe', 'boot', 'sandal', 'sneaker', 'hat', 'cap', 'glove', 'jacket',
  'table', 'chair', 'desk', 'sofa', 'bed', 'shelf', 'cabinet', 'drawer',
];

/**
 * Generate a random number between min and max (inclusive)
 * @param {number} min - Minimum value
 * @param {number} max - Maximum value
 * @returns {number} Random number
 */
function getRandomNumber(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

/**
 * Generate a random word from the word list
 * @returns {string} Random word (lowercase)
 */
function getRandomWord() {
  const randomIndex = getRandomNumber(0, WORD_LIST.length - 1);
  return WORD_LIST[randomIndex].toLowerCase();
}

/**
 * Generate a 4-digit number
 * @returns {string} 4-digit number as string
 */
function generateNumber() {
  return getRandomNumber(1000, 9999).toString();
}

/**
 * Validate codephrase format
 * Format: WORD-WORD-NUMBER (e.g., "correct-horse-1234")
 * @param {string} codephrase - Codephrase to validate
 * @returns {boolean} True if format is valid
 */
export function validateCodephraseFormat(codephrase) {
  if (!codephrase || typeof codephrase !== 'string') {
    return false;
  }

  // Regex pattern: lowercase word, hyphen, lowercase word, hyphen, 4 digits
  const pattern = /^[a-z]+-[a-z]+-\d{4}$/;
  return pattern.test(codephrase.toLowerCase());
}

/**
 * Check if a codephrase already exists in the database
 * @param {string} codephrase - Codephrase to check
 * @returns {Promise<boolean>} True if codephrase exists
 */
async function codephraseExists(codephrase) {
  const db = getDatabase();
  const result = await db.get(
    'SELECT 1 FROM clients WHERE LOWER(codephrase) = LOWER(?) LIMIT 1',
    [codephrase]
  );
  return !!result;
}

/**
 * Generate a unique codephrase
 * Format: WORD-WORD-NUMBER (e.g., "correct-horse-1234")
 * @returns {Promise<string>} Unique codephrase
 */
export async function generateCodephrase() {
  const db = getDatabase();
  let attempts = 0;
  const maxAttempts = 10;

  while (attempts < maxAttempts) {
    const word1 = getRandomWord();
    const word2 = getRandomWord();
    const number = generateNumber();
    const codephrase = `${word1}-${word2}-${number}`;

    // Check if codephrase already exists (case-insensitive)
    const exists = await codephraseExists(codephrase);
    if (!exists) {
      return codephrase;
    }

    attempts++;
  }

  throw new Error('Failed to generate unique codephrase after maximum attempts');
}

