import { ja } from './ja.js';
import { en } from './en.js';

export const dictionaries = { ja, en };
export type Locale = 'ja' | 'en';
export type Dictionary = typeof ja;

export { ja, en };
