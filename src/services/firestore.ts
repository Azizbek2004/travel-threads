import { db } from "../firebase";
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
  deleteField,
  writeBatch,
} from "firebase/firestore";
import type { Post, Comment, Share } from "../types/post";
import type { UserProfile, Conversation, Message } from "../types/user";

// Import the createNotification function
import { createNotification } from "./notifications";

// Post-related functions
const postsCollection = collection(db, "posts");
const commentsCollection = collection(db, "comments");
const sharesCollection = collection(db, "shares");

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
        .split(",")
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
    const userRef = doc(db, "users", postData.authorId);
    await updateDoc(userRef, {
      threadCount: increment(1),
    });
  }

  return docRef.id;
};

export const getPosts = async (): Promise<Post[]> => {
  const snapshot = await getDocs(
    query(postsCollection, orderBy("createdAt", "desc"))
  );
  return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as Post));
};

export const getPost = async (id: string): Promise<Post | null> => {
  const docRef = doc(db, "posts", id);
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
        .split(",")
        .map((part) => part.trim());
      postData.locationKeywords = locationComponents;
    }
  }

  const postRef = doc(db, "posts", id);
  await updateDoc(postRef, postData);
};

export const deletePost = async (id: string): Promise<void> => {
  const postRef = doc(db, "posts", id);
  const postSnap = await getDoc(postRef);

  if (postSnap.exists()) {
    const postData = postSnap.data() as Post;

    // Update user's thread count
    if (postData.authorId) {
      const userRef = doc(db, "users", postData.authorId);
      await updateDoc(userRef, {
        threadCount: increment(-1),
      });
    }

    // Delete the post
    await deleteDoc(postRef);

    // Delete associated comments
    const commentsQuery = query(commentsCollection, where("postId", "==", id));
    const commentsSnapshot = await getDocs(commentsQuery);

    const batch = writeBatch(db);
    commentsSnapshot.docs.forEach((doc) => {
      batch.delete(doc.ref);
    });

    await batch.commit();
  }
};

export const getUserPosts = async (userId: string): Promise<Post[]> => {
  const q = query(
    postsCollection,
    where("authorId", "==", userId),
    orderBy("createdAt", "desc")
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as Post));
};

// Like/Unlike post
export const likePost = async (
  postId: string,
  userId: string
): Promise<void> => {
  const postRef = doc(db, "posts", postId);

  // First check if user already liked the post
  const postSnap = await getDoc(postRef);
  if (!postSnap.exists()) return;

  const postData = postSnap.data();
  const likedBy = postData.likedBy || [];

  // Only update if user hasn't already liked
  if (!likedBy.includes(userId)) {
    await updateDoc(postRef, {
      likes: increment(1),
      likedBy: arrayUnion(userId),
    });

    // Create notification for post author
    if (postData.authorId && postData.authorId !== userId) {
      await createNotification({
        userId: postData.authorId,
        type: "post_like",
        message: `Someone liked your post "${postData.title}"`,
        actorId: userId,
        entityId: postId,
        entityType: "post",
        data: {
          preview: postData.title,
        },
      });
    }
  }
};

export const unlikePost = async (
  postId: string,
  userId: string
): Promise<void> => {
  const postRef = doc(db, "posts", postId);

  // First check if user already liked the post
  const postSnap = await getDoc(postRef);
  if (!postSnap.exists()) return;

  const postData = postSnap.data();
  const likedBy = postData.likedBy || [];

  // Only update if user has already liked
  if (likedBy.includes(userId)) {
    await updateDoc(postRef, {
      likes: increment(-1),
      likedBy: arrayRemove(userId),
    });
  }
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
  const postRef = doc(db, "posts", comment.postId!);
  await updateDoc(postRef, {
    commentCount: increment(1),
  });

  // Get post data to create notification
  const postSnap = await getDoc(postRef);
  if (postSnap.exists()) {
    const postData = postSnap.data();

    // Create notification for post author if the commenter is not the author
    if (postData.authorId && postData.authorId !== comment.authorId) {
      await createNotification({
        userId: postData.authorId,
        type: "post_comment",
        message: `Someone commented on your post "${postData.title}"`,
        actorId: comment.authorId,
        entityId: comment.postId,
        entityType: "post",
        data: {
          preview: comment.content?.substring(0, 100),
        },
      });
    }

    // If this is a reply to another comment, notify that comment's author
    if (comment.parentId) {
      const parentCommentRef = doc(db, "comments", comment.parentId);
      const parentCommentSnap = await getDoc(parentCommentRef);

      if (parentCommentSnap.exists()) {
        const parentCommentData = parentCommentSnap.data();

        // Only notify if the reply author is different from the parent comment author
        if (
          parentCommentData.authorId &&
          parentCommentData.authorId !== comment.authorId
        ) {
          await createNotification({
            userId: parentCommentData.authorId,
            type: "comment_reply",
            message: "Someone replied to your comment",
            actorId: comment.authorId,
            entityId: comment.postId,
            entityType: "post",
            data: {
              preview: comment.content?.substring(0, 100),
            },
          });
        }
      }
    }
  }

  return docRef.id;
};

export const getComments = async (postId: string): Promise<Comment[]> => {
  const q = query(
    commentsCollection,
    where("postId", "==", postId),
    where("parentId", "==", null), // Only top-level comments
    orderBy("createdAt", "desc")
  );

  const snapshot = await getDocs(q);
  return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as Comment));
};

export const getReplies = async (commentId: string): Promise<Comment[]> => {
  const q = query(
    commentsCollection,
    where("parentId", "==", commentId),
    orderBy("createdAt", "asc")
  );

  const snapshot = await getDocs(q);
  return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as Comment));
};

export const likeComment = async (
  commentId: string,
  userId: string
): Promise<void> => {
  const commentRef = doc(db, "comments", commentId);

  await updateDoc(commentRef, {
    likes: increment(1),
    likedBy: arrayUnion(userId),
  });
};

export const unlikeComment = async (
  commentId: string,
  userId: string
): Promise<void> => {
  const commentRef = doc(db, "comments", commentId);

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
  const postRef = doc(db, "posts", share.postId!);
  await updateDoc(postRef, {
    shareCount: increment(1),
  });

  return docRef.id;
};

// User profile-related functions
const usersCollection = collection(db, "users");

export const getUserProfile = async (
  userId: string | undefined
): Promise<UserProfile | null> => {
  if (!userId) return null;
  const docRef = doc(db, "users", userId);
  const docSnap = await getDoc(docRef);
  if (!docSnap.exists()) {
    const defaultProfile: UserProfile = {
      id: userId,
      displayName: "New User",
      bio: "",
      photoURL: "",
      email: "",
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
  const userRef = doc(db, "users", userId);
  await updateDoc(userRef, profileData);
};

// Following system functions - FIXED
export const followUser = async (
  currentUserId: string,
  targetUserId: string
): Promise<void> => {
  try {
    const batch = writeBatch(db);

    // Get current user doc to check if already following
    const currentUserRef = doc(db, "users", currentUserId);
    const currentUserDoc = await getDoc(currentUserRef);

    // Get target user doc to check if already a follower
    const targetUserRef = doc(db, "users", targetUserId);
    const targetUserDoc = await getDoc(targetUserRef);

    if (currentUserDoc.exists() && targetUserDoc.exists()) {
      const currentUserData = currentUserDoc.data();
      const targetUserData = targetUserDoc.data();

      // Initialize arrays if they don't exist
      const following = currentUserData.following || [];
      const followers = targetUserData.followers || [];

      // Only add if not already following
      if (!following.includes(targetUserId)) {
        batch.update(currentUserRef, {
          following: arrayUnion(targetUserId),
        });
      }

      // Only add if not already a follower
      if (!followers.includes(currentUserId)) {
        batch.update(targetUserRef, {
          followers: arrayUnion(currentUserId),
        });
      }

      await batch.commit();

      // Create notification for the target user
      await createNotification({
        userId: targetUserId,
        type: "new_follower",
        message: "Someone started following you",
        actorId: currentUserId,
        entityId: currentUserId,
        entityType: "user",
      });
    }
  } catch (error) {
    console.error("Error following user:", error);
    throw error;
  }
};

export const unfollowUser = async (
  currentUserId: string,
  targetUserId: string
): Promise<void> => {
  try {
    const batch = writeBatch(db);

    // Get current user doc to check if following
    const currentUserRef = doc(db, "users", currentUserId);
    const currentUserDoc = await getDoc(currentUserRef);

    // Get target user doc to check if a follower
    const targetUserRef = doc(db, "users", targetUserId);
    const targetUserDoc = await getDoc(targetUserRef);

    if (currentUserDoc.exists() && targetUserDoc.exists()) {
      const currentUserData = currentUserDoc.data();
      const targetUserData = targetUserDoc.data();

      // Initialize arrays if they don't exist
      const following = currentUserData.following || [];
      const followers = targetUserData.followers || [];

      // Only remove if currently following
      if (following.includes(targetUserId)) {
        batch.update(currentUserRef, {
          following: arrayRemove(targetUserId),
        });
      }

      // Only remove if currently a follower
      if (followers.includes(currentUserId)) {
        batch.update(targetUserRef, {
          followers: arrayRemove(currentUserId),
        });
      }

      await batch.commit();
    }
  } catch (error) {
    console.error("Error unfollowing user:", error);
    throw error;
  }
};

export const getFollowers = async (userId: string): Promise<UserProfile[]> => {
  const userRef = doc(db, "users", userId);
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
  const userRef = doc(db, "users", userId);
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
  const userRef = doc(db, "users", userId);
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
    where("authorId", "in", following),
    orderBy("createdAt", "desc"),
    limit(50)
  );

  const snapshot = await getDocs(q);
  return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as Post));
};

// Enhanced messaging system
const conversationsCollection = collection(db, "conversations");
const messagesCollection = collection(db, "messages");

export const getOrCreateConversation = async (
  userIds: string[]
): Promise<string> => {
  // Sort user IDs to ensure consistent conversation ID
  const sortedUserIds = [...userIds].sort();

  // Check if conversation already exists between these users
  // First, query for conversations containing the first user
  const q = query(
    conversationsCollection,
    where("participants", "array-contains", sortedUserIds[0])
  );
  const snapshot = await getDocs(q);

  // Find the conversation with exactly these participants
  for (const doc of snapshot.docs) {
    const data = doc.data();
    // Check if the participants array contains exactly the same users (order doesn't matter)
    if (data.participants.length === sortedUserIds.length) {
      const allParticipantsMatch = sortedUserIds.every((id) =>
        data.participants.includes(id)
      );
      if (allParticipantsMatch) {
        return doc.id;
      }
    }
  }

  // If no existing conversation found, create a new one
  const newConversation = {
    participants: sortedUserIds,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    lastMessage: null,
  };

  const docRef = await addDoc(conversationsCollection, newConversation);
  return docRef.id;
};

export const sendMessage = async (
  conversationId: string,
  senderId: string,
  text: string,
  mediaUrl?: string,
  sharedPost?: any,
  sharedEvent?: any
): Promise<string> => {
  // Create new message
  const timestamp = new Date().toISOString();
  const newMessage: any = {
    conversationId,
    senderId,
    text,
    timestamp,
    read: false,
    mediaUrl,
    reactions: {},
  };

  // Add shared content if provided
  if (sharedPost) {
    newMessage.sharedPost = sharedPost;
  }

  if (sharedEvent) {
    newMessage.sharedEvent = sharedEvent;
  }

  // Add message to messages collection
  const docRef = await addDoc(messagesCollection, newMessage);

  // Update conversation with last message
  const conversationRef = doc(db, "conversations", conversationId);
  const conversationSnap = await getDoc(conversationRef);

  if (conversationSnap.exists()) {
    const conversationData = conversationSnap.data();
    const participants = conversationData.participants || [];

    // Find the recipient (the other participant)
    const recipientId = participants.find((id: string) => id !== senderId);

    if (recipientId) {
      // Create notification for the recipient
      await createNotification({
        userId: recipientId,
        type: "message_received",
        message: "You received a new message",
        actorId: senderId,
        entityId: recipientId, // We use the recipient ID to navigate to the conversation
        entityType: "message",
        data: {
          preview: text.substring(0, 100) + (text.length > 100 ? "..." : ""),
          conversationId,
        },
      });
    }
  }

  await updateDoc(conversationRef, {
    lastMessage: {
      text,
      timestamp,
      senderId,
      read: false,
      mediaUrl,
      hasSharedContent: !!(sharedPost || sharedEvent),
    },
    updatedAt: timestamp,
  });

  return docRef.id;
};

export const getConversations = async (
  userId: string
): Promise<Conversation[]> => {
  const q = query(
    conversationsCollection,
    where("participants", "array-contains", userId),
    orderBy("updatedAt", "desc")
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
    where("conversationId", "==", conversationId),
    orderBy("timestamp", "asc")
  );

  const snapshot = await getDocs(q);
  return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as Message));
};

export const markMessagesAsRead = async (
  conversationId: string,
  userId: string
): Promise<void> => {
  try {
    // Get unread messages sent by the other user
    const q = query(
      messagesCollection,
      where("conversationId", "==", conversationId),
      where("read", "==", false),
      where("senderId", "!=", userId)
    );

    const snapshot = await getDocs(q);

    // If there are unread messages
    if (!snapshot.empty) {
      // Update all messages to read
      const batch = writeBatch(db);
      snapshot.docs.forEach((doc) => {
        batch.update(doc.ref, { read: true });
      });

      // Also update the conversation's lastMessage if it's unread
      const conversationRef = doc(db, "conversations", conversationId);
      const conversationSnap = await getDoc(conversationRef);

      if (conversationSnap.exists()) {
        const convoData = conversationSnap.data();
        if (
          convoData.lastMessage &&
          !convoData.lastMessage.read &&
          convoData.lastMessage.senderId !== userId
        ) {
          batch.update(conversationRef, {
            "lastMessage.read": true,
          });
        }
      }

      await batch.commit();
    }
  } catch (error) {
    console.error("Error marking messages as read:", error);
  }
};

// Add reaction to message
export const addReactionToMessage = async (
  messageId: string,
  userId: string,
  reaction: string
): Promise<void> => {
  const messageRef = doc(db, "messages", messageId);

  // Update the reactions map
  await updateDoc(messageRef, {
    [`reactions.${userId}`]: reaction,
  });
};

// Remove reaction from message
export const removeReactionFromMessage = async (
  messageId: string,
  userId: string
): Promise<void> => {
  const messageRef = doc(db, "messages", messageId);

  // Remove the user's reaction
  await updateDoc(messageRef, {
    [`reactions.${userId}`]: deleteField(),
  });
};

// Universal search functions with enhanced location search
export const searchPosts = async (
  textQuery = "",
  locationQuery = "",
  onlyWithLocation = false
): Promise<Post[]> => {
  // Start with getting all posts
  let allPosts: Post[] = [];
  let snapshot;

  // If filtering for posts with location only
  if (onlyWithLocation) {
    // Query posts that have a geopoint (location data)
    const q = query(postsCollection, where("geopoint", "!=", null));
    snapshot = await getDocs(q);
  } else {
    // Get all posts ordered by most recent
    snapshot = await getDocs(
      query(postsCollection, orderBy("createdAt", "desc"))
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
    console.error("Error fetching location suggestions:", error);
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

// Update the attendEvent function to create a notification
export const attendEvent = async (
  eventId: string,
  userId: string
): Promise<void> => {
  try {
    const eventRef = doc(db, "events", eventId);
    const eventSnap = await getDoc(eventRef);

    if (!eventSnap.exists()) return;

    const eventData = eventSnap.data();
    const attendees = eventData.attendees || [];

    // Only update if user is not already attending
    if (!attendees.includes(userId)) {
      await updateDoc(eventRef, {
        attendees: arrayUnion(userId),
        interested: arrayRemove(userId), // Remove from interested if they were interested
      });

      // Create notification for event organizer
      if (eventData.authorId && eventData.authorId !== userId) {
        await createNotification({
          userId: eventData.authorId,
          type: "event_attendance",
          message: `Someone is attending your event "${eventData.title}"`,
          actorId: userId,
          entityId: eventId,
          entityType: "event",
          data: {
            preview: `${eventData.title} - ${new Date(
              eventData.startDate
            ).toLocaleDateString()}`,
          },
        });
      }
    }
  } catch (error) {
    console.error("Error attending event:", error);
    throw new Error("Failed to RSVP to event. Please try again.");
  }
};
