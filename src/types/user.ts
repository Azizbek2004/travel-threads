export interface UserProfile {
  id: string;
  displayName: string;
  bio: string;
  photoURL: string;
  email: string;
  createdAt: string;
  followers?: string[]; // IDs of users who follow this user
  following?: string[]; // IDs of users this user follows
  threadCount?: number; // Number of threads/posts created
}

export interface Conversation {
  id: string;
  participants: string[]; // User IDs
  lastMessage?: {
    text: string;
    timestamp: string;
    senderId: string;
  };
  updatedAt: string;
}

export interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  text: string;
  timestamp: string;
  read: boolean;
  mediaUrl?: string;
  reactions?: {
    [userId: string]: string; // emoji reaction
  };
}
