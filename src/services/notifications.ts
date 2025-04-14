import { db } from "../firebase";
import {
  collection,
  addDoc,
  getDocs,
  doc,
  getDoc,
  updateDoc,
  query,
  where,
  orderBy,
  serverTimestamp,
  writeBatch,
  deleteDoc,
  increment,
  limit as firestoreLimit,
} from "firebase/firestore";

// Notification types
export type NotificationType =
  | "post_like"
  | "post_comment"
  | "comment_reply"
  | "new_follower"
  | "event_invite"
  | "event_reminder"
  | "event_update"
  | "event_attendance"
  | "message_received"
  | "account_blocked"
  | "account_unblocked"
  | "admin_role_granted"
  | "admin_role_removed"
  | "mention";

// Notification interface
export interface Notification {
  id?: string;
  userId: string;
  type: NotificationType;
  message: string;
  data?: any;
  read: boolean;
  createdAt: any;
  actorId?: string;
  actorName?: string;
  actorPhotoURL?: string;
  entityId?: string;
  entityType?: "post" | "comment" | "event" | "user" | "message";
}

// Create a notification
export const createNotification = async (notificationData: {
  userId: string;
  type: NotificationType;
  message: string;
  data?: any;
  actorId?: string;
  entityId?: string;
  entityType?: "post" | "comment" | "event" | "user" | "message";
}) => {
  try {
    // If there's an actor (the user who triggered the notification)
    let actorName, actorPhotoURL;
    if (notificationData.actorId) {
      const actorDoc = await getDoc(doc(db, "users", notificationData.actorId));
      if (actorDoc.exists()) {
        const actorData = actorDoc.data();
        actorName = actorData.displayName;
        actorPhotoURL = actorData.photoURL;
      }
    }

    // Create the notification
    const notification: Omit<Notification, "id"> = {
      userId: notificationData.userId,
      type: notificationData.type,
      message: notificationData.message,
      data: notificationData.data || {},
      read: false,
      createdAt: serverTimestamp(),
      actorId: notificationData.actorId,
      actorName,
      actorPhotoURL,
      entityId: notificationData.entityId,
      entityType: notificationData.entityType,
    };

    const docRef = await addDoc(collection(db, "notifications"), notification);

    // Update unread count for the user
    const userRef = doc(db, "users", notificationData.userId);
    await updateDoc(userRef, {
      unreadNotifications: increment(1),
    });

    return docRef.id;
  } catch (error) {
    console.error("Error creating notification:", error);
    throw new Error("Failed to create notification");
  }
};

// Get user notifications
export const getUserNotifications = async (userId: string, limitCount = 20) => {
  try {
    // Fix: Use firestoreLimit instead of limit directly
    const notificationsQuery = query(
      collection(db, "notifications"),
      where("userId", "==", userId),
      orderBy("createdAt", "desc"),
      firestoreLimit(limitCount)
    );

    const snapshot = await getDocs(notificationsQuery);
    return snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as Notification[];
  } catch (error) {
    console.error("Error getting notifications:", error);
    throw new Error("Failed to fetch notifications");
  }
};

// Mark notification as read
export const markNotificationAsRead = async (notificationId: string) => {
  try {
    const notificationRef = doc(db, "notifications", notificationId);
    const notificationDoc = await getDoc(notificationRef);

    if (notificationDoc.exists()) {
      const notificationData = notificationDoc.data();

      // Only update if it's currently unread
      if (!notificationData.read) {
        await updateDoc(notificationRef, {
          read: true,
        });

        // Update unread count for the user
        const userRef = doc(db, "users", notificationData.userId);
        await updateDoc(userRef, {
          unreadNotifications: increment(-1),
        });
      }

      return true;
    }

    return false;
  } catch (error) {
    console.error("Error marking notification as read:", error);
    throw new Error("Failed to update notification");
  }
};

// Mark all notifications as read
export const markAllNotificationsAsRead = async (userId: string) => {
  try {
    const notificationsQuery = query(
      collection(db, "notifications"),
      where("userId", "==", userId),
      where("read", "==", false)
    );

    const snapshot = await getDocs(notificationsQuery);

    if (snapshot.empty) {
      return true;
    }

    const batch = writeBatch(db);

    snapshot.docs.forEach((doc) => {
      batch.update(doc.ref, { read: true });
    });

    // Update unread count for the user
    const userRef = doc(db, "users", userId);
    batch.update(userRef, {
      unreadNotifications: 0,
    });

    await batch.commit();

    return true;
  } catch (error) {
    console.error("Error marking all notifications as read:", error);
    throw new Error("Failed to update notifications");
  }
};

// Delete a notification
export const deleteNotification = async (notificationId: string) => {
  try {
    const notificationRef = doc(db, "notifications", notificationId);
    const notificationDoc = await getDoc(notificationRef);

    if (notificationDoc.exists()) {
      const notificationData = notificationDoc.data();

      // If it's unread, update the unread count
      if (!notificationData.read) {
        const userRef = doc(db, "users", notificationData.userId);
        await updateDoc(userRef, {
          unreadNotifications: increment(-1),
        });
      }

      await deleteDoc(notificationRef);
      return true;
    }

    return false;
  } catch (error) {
    console.error("Error deleting notification:", error);
    throw new Error("Failed to delete notification");
  }
};
