export interface TravelEvent {
  id: string;
  title: string;
  description: string;
  authorId: string;
  imageUrl?: string;
  createdAt: string;
  startDate: string; // ISO date string
  endDate: string; // ISO date string
  startTime?: string; // Format: "HH:MM"
  endTime?: string; // Format: "HH:MM"
  location?: {
    lat: number;
    lng: number;
    name?: string;
  };
  // For geospatial queries and maps
  geopoint?: {
    latitude: number;
    longitude: number;
  };
  // For text-based location search
  locationKeywords?: string[];
  // Event specific fields
  category: string; // e.g., "Adventure", "Cultural", "Food", "Sightseeing"
  maxAttendees?: number;
  price?: number;
  currency?: string;
  attendees: string[]; // Array of user IDs
  interestedUsers: string[]; // Array of user IDs
  isPrivate: boolean;
  tags: string[];
  contactInfo?: string;
  website?: string;
}

export interface Event {
  id: string;
  title: string;
  description: string;
  startDate: string; // ISO string
  endDate: string; // ISO string
  location?: {
    name: string;
    lat: number;
    lng: number;
  };
  imageUrl?: string;
  authorId: string;
  createdAt: string;
  attendees: string[]; // Array of user IDs
  interested: string[]; // Array of user IDs
  category: EventCategoryType;
  isPublic: boolean;
  maxAttendees?: number;
  price?: number;
  currency?: string;
  tags?: string[];
  website?: string;
  contactEmail?: string;
  contactPhone?: string;
}

export type EventCategoryType =
  | 'travel'
  | 'food'
  | 'culture'
  | 'adventure'
  | 'nature'
  | 'workshop'
  | 'meetup'
  | 'festival'
  | 'concert'
  | 'sports'
  | 'other';

export interface EventAttendee {
  userId: string;
  status: 'going' | 'interested' | 'not_going';
  joinedAt: string;
}

export interface EventFilter {
  category?: EventCategoryType;
  startDate?: string;
  endDate?: string;
  location?: string;
  query?: string;
}

export interface EventCategory {
  id: string;
  name: string;
  icon: string;
}

export const EVENT_CATEGORIES: EventCategory[] = [
  { id: 'adventure', name: 'Adventure', icon: 'hiking' },
  { id: 'cultural', name: 'Cultural', icon: 'museum' },
  { id: 'food', name: 'Food & Drinks', icon: 'restaurant' },
  { id: 'sightseeing', name: 'Sightseeing', icon: 'photo_camera' },
  { id: 'nightlife', name: 'Nightlife', icon: 'nightlife' },
  { id: 'nature', name: 'Nature', icon: 'park' },
  { id: 'sports', name: 'Sports', icon: 'sports' },
  { id: 'workshop', name: 'Workshop', icon: 'build' },
  { id: 'other', name: 'Other', icon: 'more_horiz' },
];
