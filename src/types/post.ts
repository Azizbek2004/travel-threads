export interface Post {
  id: string;
  title: string;
  content: string;
  authorId: string;
  imageUrl?: string;
  createdAt: string;
  location?: {
    lat: number;
    lng: number;
    name?: string;
  };
  geopoint?: {
    latitude: number;
    longitude: number;
  };
  locationKeywords?: string[];
  likes: number;
  likedBy: string[];
  commentCount: number;
  shareCount: number;
}

export interface Comment {
  id: string;
  postId: string;
  authorId: string;
  content: string;
  createdAt: string;
  likes: number;
  likedBy: string[];
  parentId?: string;
}

export interface Share {
  id: string;
  postId: string;
  authorId: string;
  createdAt: string;
  caption?: string;
}

export interface LocationSearchRequest {
  query: string;
  radius?: number;
  lat?: number;
  lng?: number;
}

export interface LocationSuggestion {
  id: string;
  name: string;
  placeId?: string;
}
