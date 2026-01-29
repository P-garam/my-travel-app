
export interface UserProfile {
  age: number;
  gender: 'male' | 'female' | 'non-binary' | 'other';
  nationality: string;
  hobbies: string[];
  travelStyle: 'budget' | 'luxury' | 'balanced';
  destination: string;
  duration: number;
  travelers: number; // 추가: 여행 인원수
  travelDate: string;
  activityTime: 'early-bird' | 'night-owl';
}

export interface Place {
  name: string;
  address: string;
  description: string;
  docentScript: string;
  lat: number;
  lng: number;
  imageKeyword: string;
  estimatedCost: number;
  bestTime: string;
  outfitTip: string;
  photoSpotTip: string;
}

export interface DayItinerary {
  day: number;
  places: Place[];
}

export interface Song {
  title: string;
  artist: string;
  reason: string;
}

export interface Movie {
  title: string;
  director: string;
  year: string;
  reason: string;
}

export interface TravelPlan {
  personalityTitle: string;
  personalityDescription: string;
  itinerary: DayItinerary[];
  totalEstimatedBudget: number;
  currency: string;
  localEtiquette: string[];
  soundtrack: Song[];
  movies: Movie[];
  vibeScore: number;
}
