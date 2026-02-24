// ============================================================
// ECHO. - Core TypeScript Types
// ============================================================

export type EmotionName =
  | 'joie'
  | 'tristesse'
  | 'colère'
  | 'peur'
  | 'sérénité'
  | 'surprise'
  | 'nostalgie'
  | 'anxiété'
  | 'espoir'
  | 'frustration';

export type Valence = 'positive' | 'negative' | 'neutre';

export type VisualizationStyle =
  | 'geometrique'
  | 'organique'
  | 'aquarelle'
  | 'minimaliste'
  | 'abstrait'
  | 'mosaique';

export type SubscriptionTier = 'free' | 'premium';
export type SubscriptionStatus = 'active' | 'canceled' | 'past_due';

export interface EmotionScore {
  name: EmotionName;
  score: number;
}

export interface Analysis {
  emotions: EmotionScore[];
  dominantEmotion: EmotionName;
  intensity: number;
  valence: Valence;
  keywords: string[];
}

export interface Entry {
  id: string;
  user_id: string;
  text: string;
  audio_url?: string;
  created_at: string;
  updated_at: string;
  analysis: Analysis;
  visualization_url: string;
  visualization_style: VisualizationStyle;
  tags?: string[];
}

export interface UserProfile {
  id: string;
  email: string;
  created_at: string;
  subscription_tier: SubscriptionTier;
  subscription_status?: SubscriptionStatus;
  stripe_customer_id?: string;
  preferences: UserPreferences;
}

export interface UserPreferences {
  theme?: 'light' | 'dark';
  defaultStyle?: VisualizationStyle;
}

export interface Subscription {
  id: string;
  user_id: string;
  stripe_subscription_id: string;
  status: SubscriptionStatus;
  price_id: string;
  current_period_start: string;
  current_period_end: string;
  created_at: string;
}

export interface EmotionStats {
  emotionCounts: Record<string, number>;
  avgIntensity: number;
  mostFrequent: [string, number];
  totalEntries: number;
}

// Emotion color palette
export const EMOTION_COLORS: Record<EmotionName, [string, string, string]> = {
  joie: ['#FFD700', '#FFA500', '#FF6B35'],
  tristesse: ['#4169E1', '#6A5ACD', '#1E3A8A'],
  colère: ['#DC143C', '#FF4500', '#8B0000'],
  peur: ['#2F4F4F', '#000000', '#4B5563'],
  sérénité: ['#98FB98', '#87CEEB', '#6EE7B7'],
  surprise: ['#FFFF00', '#FF69B4', '#F59E0B'],
  nostalgie: ['#DDA0DD', '#9370DB', '#A78BFA'],
  anxiété: ['#A9A9A9', '#696969', '#6B7280'],
  espoir: ['#87CEEB', '#FFD700', '#60A5FA'],
  frustration: ['#FF8C00', '#CD5C5C', '#DC2626'],
};

export const VISUALIZATION_STYLES: { id: VisualizationStyle; name: string; description: string }[] = [
  { id: 'geometrique', name: 'Géométrique', description: 'Polygones réguliers tournants' },
  { id: 'organique', name: 'Organique', description: 'Formes blob avec courbes Bézier' },
  { id: 'aquarelle', name: 'Aquarelle', description: 'Couches semi-transparentes + texture' },
  { id: 'minimaliste', name: 'Minimaliste', description: 'Cercles vides + lignes épurées' },
  { id: 'abstrait', name: 'Abstrait', description: 'Rectangles + courbes expressives' },
  { id: 'mosaique', name: 'Mosaïque', description: 'Grille de tuiles colorées' },
];
