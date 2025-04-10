import { db } from '../firebase';
import {
  collection,
  addDoc,
  getDocs,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  arrayUnion,
  arrayRemove,
  increment,
  GeoPoint,
  serverTimestamp,
} from 'firebase/firestore';
import type { Post, Comment, Share } from '../types/post';
import type { UserProfile, Conversation, Message } from '../types/user';

// Post-related functions
const postsCollection = collection(db, 'posts');
const commentsCollection = collection(db, 'comments');
const sharesCollection = collection(db, 'shares');

export const createPost = async (postData: Partial<Post>): Promise<string> => {
  // Add geocoded location data if location is provided
  if (postData.location?.lat && postData.location?.lng) {
    // Store location as GeoPoint for geospatial queries
    postData.geopoint = new GeoPoint(
      postData.location.lat,
      postData.location.lng
    );

    if (postData.location.name) {
      // Split location name into searchable components
      const locationComponents = postData.location.name
        .toLowerCase()
        .split(',')
        .map((part) => part.trim());
      postData.locationKeywords = locationComponents;
    }
  }

  const docRef = await addDoc(postsCollection, {
    ...postData,
    likes: 0,
    likedBy: [],
    commentCount: 0,
    shareCount: 0,
    createdAt: new Date().toISOString(),
    timestamp: serverTimestamp(), // Add server timestamp for better sorting
  });

  // Update user's thread count
  if (postData.authorId) {
    const userRef = doc(db, 'users', postData.authorId);
    await updateDoc(userRef, {
      threadCount: increment(1),
    });
  }

  return docRef.id;
};

export const getPosts = async (): Promise<Post[]> => {
  const snapshot = await getDocs(
    query(postsCollection, orderBy('createdAt', 'desc'))
  );
  return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as Post));
};

export const getPost = async (id: string): Promise<Post | null> => {
  const docRef = doc(db, 'posts', id);
  const docSnap = await getDoc(docRef);
  return docSnap.exists()
    ? ({ id: docSnap.id, ...docSnap.data() } as Post)
    : null;
};

export const updatePost = async (
  id: string,
  postData: Partial<Post>
): Promise<void> => {
  // If updating location, update geopoint and keywords
  if (postData.location?.lat && postData.location?.lng) {
    postData.geopoint = new GeoPoint(
      postData.location.lat,
      postData.location.lng
    );

    if (postData.location.name) {
      const locationComponents = postData.location.name
        .toLowerCase()
        .split(',')
        .map((part) => part.trim());
      postData.locationKeywords = locationComponents;
    }
  }

  const postRef = doc(db, 'posts', id);
  await updateDoc(postRef, postData);
};

export const deletePost = async (id: string): Promise<void> => {
  const postRef = doc(db, 'posts', id);
  const postSnap = await getDoc(postRef);

  if (postSnap.exists()) {
    const postData = postSnap.data() as Post;

    // Update user's thread count
    if (postData.authorId) {
      const userRef = doc(db, 'users', postData.authorId);
      await updateDoc(userRef, {
        threadCount: increment(-1),
      });
    }

    // Delete the post
    await deleteDoc(postRef);

    // Delete associated comments
    const commentsQuery = query(commentsCollection, where('postId', '==', id));
    const commentsSnapshot = await getDocs(commentsQuery);

    const batch = db.batch();
    commentsSnapshot.docs.forEach((doc) => {
      batch.delete(doc.ref);
    });

    await batch.commit();
  }
};

export const getUserPosts = async (userId: string): Promise<Post[]> => {
  const q = query(
    postsCollection,
    where('authorId', '==', userId),
    orderBy('createdAt', 'desc')
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as Post));
};

// Like/Unlike post
export const likePost = async (
  postId: string,
  userId: string
): Promise<void> => {
  const postRef = doc(db, 'posts', postId);

  await updateDoc(postRef, {
    likes: increment(1),
    likedBy: arrayUnion(userId),
  });
};

export const unlikePost = async (
  postId: string,
  userId: string
): Promise<void> => {
  const postRef = doc(db, 'posts', postId);

  await updateDoc(postRef, {
    likes: increment(-1),
    likedBy: arrayRemove(userId),
  });
};

// Comment functions
export const addComment = async (
  comment: Partial<Comment>
): Promise<string> => {
  const docRef = await addDoc(commentsCollection, {
    ...comment,
    likes: 0,
    likedBy: [],
    createdAt: new Date().toISOString(),
  });

  // Update comment count on post
  const postRef = doc(db, 'posts', comment.postId!);
  await updateDoc(postRef, {
    commentCount: increment(1),
  });

  return docRef.id;
};

export const getComments = async (postId: string): Promise<Comment[]> => {
  const q = query(
    commentsCollection,
    where('postId', '==', postId),
    where('parentId', '==', null), // Only top-level comments
    orderBy('createdAt', 'desc')
  );

  const snapshot = await getDocs(q);
  return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as Comment));
};

export const getReplies = async (commentId: string): Promise<Comment[]> => {
  const q = query(
    commentsCollection,
    where('parentId', '==', commentId),
    orderBy('createdAt', 'asc')
  );

  const snapshot = await getDocs(q);
  return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as Comment));
};

export const likeComment = async (
  commentId: string,
  userId: string
): Promise<void> => {
  const commentRef = doc(db, 'comments', commentId);

  await updateDoc(commentRef, {
    likes: increment(1),
    likedBy: arrayUnion(userId),
  });
};

export const unlikeComment = async (
  commentId: string,
  userId: string
): Promise<void> => {
  const commentRef = doc(db, 'comments', commentId);

  await updateDoc(commentRef, {
    likes: increment(-1),
    likedBy: arrayRemove(userId),
  });
};

// Share functions
export const sharePost = async (share: Partial<Share>): Promise<string> => {
  const docRef = await addDoc(sharesCollection, {
    ...share,
    createdAt: new Date().toISOString(),
  });

  // Update share count on post
  const postRef = doc(db, 'posts', share.postId!);
  await updateDoc(postRef, {
    shareCount: increment(1),
  });

  return docRef.id;
};

// User profile-related functions
const usersCollection = collection(db, 'users');

export const getUserProfile = async (
  userId: string | undefined
): Promise<UserProfile | null> => {
  if (!userId) return null;
  const docRef = doc(db, 'users', userId);
  const docSnap = await getDoc(docRef);
  if (!docSnap.exists()) {
    const defaultProfile: UserProfile = {
      id: userId,
      displayName: 'New User',
      bio: '',
      photoURL: '',
      email: '',
      createdAt: new Date().toISOString(),
      followers: [],
      following: [],
      threadCount: 0,
    };
    await setDoc(docRef, defaultProfile);
    return defaultProfile;
  }
  return { id: docSnap.id, ...docSnap.data() } as UserProfile;
};

export const updateUserProfile = async (
  userId: string,
  profileData: Partial<UserProfile>
): Promise<void> => {
  const userRef = doc(db, 'users', userId);
  await updateDoc(userRef, profileData);
};

// Following system functions
export const followUser = async (
  currentUserId: string,
  targetUserId: string
): Promise<void> => {
  // Add targetUserId to currentUser's following array
  const currentUserRef = doc(db, 'users', currentUserId);
  await updateDoc(currentUserRef, {
    following: arrayUnion(targetUserId),
  });

  // Add currentUserId to targetUser's followers array
  const targetUserRef = doc(db, 'users', targetUserId);
  await updateDoc(targetUserRef, {
    followers: arrayUnion(currentUserId),
  });
};

export const unfollowUser = async (
  currentUserId: string,
  targetUserId: string
): Promise<void> => {
  // Remove targetUserId from currentUser's following array
  const currentUserRef = doc(db, 'users', currentUserId);
  await updateDoc(currentUserRef, {
    following: arrayRemove(targetUserId),
  });

  // Remove currentUserId from targetUser's followers array
  const targetUserRef = doc(db, 'users', targetUserId);
  await updateDoc(targetUserRef, {
    followers: arrayRemove(currentUserId),
  });
};

export const getFollowers = async (userId: string): Promise<UserProfile[]> => {
  const userRef = doc(db, 'users', userId);
  const userDoc = await getDoc(userRef);

  if (!userDoc.exists() || !userDoc.data().followers) {
    return [];
  }

  const followers = userDoc.data().followers as string[];
  const followerProfiles: UserProfile[] = [];

  for (const followerId of followers) {
    const profile = await getUserProfile(followerId);
    if (profile) {
      followerProfiles.push(profile);
    }
  }

  return followerProfiles;
};

export const getFollowing = async (userId: string): Promise<UserProfile[]> => {
  const userRef = doc(db, 'users', userId);
  const userDoc = await getDoc(userRef);

  if (!userDoc.exists() || !userDoc.data().following) {
    return [];
  }

  const following = userDoc.data().following as string[];
  const followingProfiles: UserProfile[] = [];

  for (const followingId of following) {
    const profile = await getUserProfile(followingId);
    if (profile) {
      followingProfiles.push(profile);
    }
  }

  return followingProfiles;
};

export const getFollowingPosts = async (userId: string): Promise<Post[]> => {
  const userRef = doc(db, 'users', userId);
  const userDoc = await getDoc(userRef);

  if (!userDoc.exists() || !userDoc.data().following) {
    return [];
  }

  const following = userDoc.data().following as string[];

  // If not following anyone, return empty array
  if (following.length === 0) {
    return [];
  }

  // Get posts from followed users
  const q = query(
    postsCollection,
    where('authorId', 'in', following),
    orderBy('createdAt', 'desc'),
    limit(50)
  );

  const snapshot = await getDocs(q);
  return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as Post));
};

// Enhanced messaging system
const conversationsCollection = collection(db, 'conversations');
const messagesCollection = collection(db, 'messages');

export const getOrCreateConversation = async (
  userIds: string[]
): Promise<string> => {
  // Sort user IDs to ensure consistent conversation ID
  const sortedUserIds = [...userIds].sort();

  // Check if conversation already exists
  const q = query(
    conversationsCollection,
    where('participants', '==', sortedUserIds)
  );

  const snapshot = await getDocs(q);

  if (!snapshot.empty) {
    return snapshot.docs[0].id;
  }

  // Create new conversation
  const newConversation = {
    participants: sortedUserIds,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const docRef = await addDoc(conversationsCollection, newConversation);
  return docRef.id;
};

export const sendMessage = async (
  conversationId: string,
  senderId: string,
  text: string,
  mediaUrl?: string
): Promise<string> => {
  // Create new message
  const newMessage = {
    conversationId,
    senderId,
    text,
    timestamp: new Date().toISOString(),
    read: false,
    mediaUrl,
  };

  // Add message to messages collection
  const docRef = await addDoc(messagesCollection, newMessage);

  // Update conversation with last message
  const conversationRef = doc(db, 'conversations', conversationId);
  await updateDoc(conversationRef, {
    lastMessage: {
      text,
      timestamp: new Date().toISOString(),
      senderId,
    },
    updatedAt: new Date().toISOString(),
  });

  return docRef.id;
};

export const getConversations = async (
  userId: string
): Promise<Conversation[]> => {
  const q = query(
    conversationsCollection,
    where('participants', 'array-contains', userId),
    orderBy('updatedAt', 'desc')
  );

  const snapshot = await getDocs(q);
  return snapshot.docs.map(
    (doc) => ({ id: doc.id, ...doc.data() } as Conversation)
  );
};

export const getMessages = async (
  conversationId: string
): Promise<Message[]> => {
  const q = query(
    messagesCollection,
    where('conversationId', '==', conversationId),
    orderBy('timestamp', 'asc')
  );

  const snapshot = await getDocs(q);
  return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as Message));
};

export const markMessagesAsRead = async (
  conversationId: string,
  userId: string
): Promise<void> => {
  const q = query(
    messagesCollection,
    where('conversationId', '==', conversationId),
    where('read', '==', false),
    where('senderId', '!=', userId)
  );

  const snapshot = await getDocs(q);

  const batch = db.batch();
  snapshot.docs.forEach((doc) => {
    batch.update(doc.ref, { read: true });
  });

  await batch.commit();
};

// Universal search functions with enhanced location search
export const searchPosts = async (
  textQuery = '',
  locationQuery = '',
  onlyWithLocation = false
): Promise<Post[]> => {
  // Start with getting all posts
  let allPosts: Post[] = [];
  let snapshot;

  // If filtering for posts with location only
  if (onlyWithLocation) {
    // Query posts that have a geopoint (location data)
    const q = query(postsCollection, where('geopoint', '!=', null));
    snapshot = await getDocs(q);
  } else {
    // Get all posts ordered by most recent
    snapshot = await getDocs(
      query(postsCollection, orderBy('createdAt', 'desc'))
    );
  }

  allPosts = snapshot.docs.map(
    (doc) => ({ id: doc.id, ...doc.data() } as Post)
  );

  // Filter based on text query if provided
  if (textQuery.trim()) {
    const lowerTextQuery = textQuery.toLowerCase();
    allPosts = allPosts.filter(
      (post) =>
        post.title?.toLowerCase().includes(lowerTextQuery) ||
        post.content?.toLowerCase().includes(lowerTextQuery)
    );
  }

  // Filter based on location query if provided
  if (locationQuery.trim()) {
    const locationKeywords = locationQuery
      .toLowerCase()
      .split(/[,\s]+/)
      .filter(Boolean);

    allPosts = allPosts.filter((post) => {
      // Skip posts without location
      if (!post.location?.name) return false;

      const postLocationLower = post.location.name.toLowerCase();
      // Check if any of the location keywords match
      return locationKeywords.some((keyword) =>
        postLocationLower.includes(keyword)
      );
    });
  }

  return allPosts;
};

// Get location suggestions based on partial input
export const getLocationSuggestions = async (
  partialLocation: string
): Promise<string[]> => {
  if (!partialLocation.trim() || partialLocation.length < 2) return [];

  try {
    // Use Google Places API to get autocomplete suggestions
    const response = await fetch(
      `https://maps.googleapis.com/maps/api/place/autocomplete/json?input=${encodeURIComponent(
        partialLocation
      )}&types=(cities)&key=AIzaSyCX4xwYTwIDjj64ZULpmz-Osy4NNfRrSiE`
    );

    const data = await response.json();

    if (data.predictions && data.predictions.length > 0) {
      return data.predictions.map((prediction: any) => prediction.description);
    }

    return [];
  } catch (error) {
    console.error('Error fetching location suggestions:', error);
    return [];
  }
};

export const searchUsers = async (
  queryString: string
): Promise<UserProfile[]> => {
  const snapshot = await getDocs(usersCollection);
  const allUsers = snapshot.docs.map(
    (doc) => ({ id: doc.id, ...doc.data() } as UserProfile)
  );
  const lowerQuery = queryString.toLowerCase();
  return allUsers.filter(
    (user) =>
      user.displayName?.toLowerCase().includes(lowerQuery) ||
      user.bio?.toLowerCase().includes(lowerQuery) ||
      user.email?.toLowerCase().includes(lowerQuery)
  );
};
