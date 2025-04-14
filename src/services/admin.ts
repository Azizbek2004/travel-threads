import { db } from "../firebase";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  serverTimestamp,
  addDoc,
  increment,
  writeBatch,
} from "firebase/firestore";
import { createNotification } from "./notifications";
import { deleteUser as deleteAuthUser } from "firebase/auth";
import { auth } from "../firebase";

// Admin user management
export interface AdminUser {
  id: string;
  displayName: string;
  email: string;
  photoURL?: string;
  isAdmin: boolean;
  isBlocked: boolean;
  blockReason?: string;
  blockedAt?: any;
  blockedBy?: string;
  createdAt: any;
  lastLogin?: any;
  postCount: number;
  threadCount: number;
  reportCount: number;
}

// Get all users for admin
export const getUsers = async (limitCount = 50): Promise<AdminUser[]> => {
  try {
    const usersQuery = query(collection(db, "users"), limit(limitCount));
    const snapshot = await getDocs(usersQuery);

    return snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as AdminUser[];
  } catch (error) {
    console.error("Error getting users:", error);
    throw new Error("Failed to fetch users");
  }
};

// Block a user
export const blockUser = async (
  userId: string,
  adminId: string,
  reason: string
): Promise<boolean> => {
  try {
    const userRef = doc(db, "users", userId);
    const userDoc = await getDoc(userRef);

    if (!userDoc.exists()) {
      throw new Error("User not found");
    }

    // Update user document
    await updateDoc(userRef, {
      isBlocked: true,
      blockReason: reason,
      blockedAt: serverTimestamp(),
      blockedBy: adminId,
    });

    // Create admin log
    await addDoc(collection(db, "adminLogs"), {
      action: "block_user",
      adminId,
      userId,
      reason,
      timestamp: serverTimestamp(),
    });

    // Create notification for the user
    await createNotification({
      userId,
      type: "account_blocked",
      message: `Your account has been blocked. Reason: ${reason}`,
      actorId: adminId,
      entityId: userId,
      entityType: "user",
    });

    return true;
  } catch (error) {
    console.error("Error blocking user:", error);
    throw new Error("Failed to block user");
  }
};

// Unblock a user
export const unblockUser = async (
  userId: string,
  adminId: string
): Promise<boolean> => {
  try {
    const userRef = doc(db, "users", userId);
    const userDoc = await getDoc(userRef);

    if (!userDoc.exists()) {
      throw new Error("User not found");
    }

    // Update user document
    await updateDoc(userRef, {
      isBlocked: false,
      blockReason: null,
      blockedAt: null,
      blockedBy: null,
    });

    // Create admin log
    await addDoc(collection(db, "adminLogs"), {
      action: "unblock_user",
      adminId,
      userId,
      timestamp: serverTimestamp(),
    });

    // Create notification for the user
    await createNotification({
      userId,
      type: "account_unblocked",
      message: "Your account has been unblocked.",
      actorId: adminId,
      entityId: userId,
      entityType: "user",
    });

    return true;
  } catch (error) {
    console.error("Error unblocking user:", error);
    throw new Error("Failed to unblock user");
  }
};

// Delete a user completely
export const deleteUserAccount = async (
  userId: string,
  adminId: string
): Promise<boolean> => {
  try {
    const userRef = doc(db, "users", userId);
    const userDoc = await getDoc(userRef);

    if (!userDoc.exists()) {
      throw new Error("User not found");
    }

    const batch = writeBatch(db);

    // Delete user's posts
    const postsQuery = query(
      collection(db, "posts"),
      where("authorId", "==", userId)
    );
    const postsSnapshot = await getDocs(postsQuery);
    postsSnapshot.docs.forEach((doc) => {
      batch.delete(doc.ref);
    });

    // Delete user's comments
    const commentsQuery = query(
      collection(db, "comments"),
      where("authorId", "==", userId)
    );
    const commentsSnapshot = await getDocs(commentsQuery);
    commentsSnapshot.docs.forEach((doc) => {
      batch.delete(doc.ref);
    });

    // Delete user's events
    const eventsQuery = query(
      collection(db, "events"),
      where("authorId", "==", userId)
    );
    const eventsSnapshot = await getDocs(eventsQuery);
    eventsSnapshot.docs.forEach((doc) => {
      batch.delete(doc.ref);
    });

    // Delete user's notifications
    const notificationsQuery = query(
      collection(db, "notifications"),
      where("userId", "==", userId)
    );
    const notificationsSnapshot = await getDocs(notificationsQuery);
    notificationsSnapshot.docs.forEach((doc) => {
      batch.delete(doc.ref);
    });

    // Delete user document
    batch.delete(userRef);

    // Commit batch
    await batch.commit();

    // Create admin log
    await addDoc(collection(db, "adminLogs"), {
      action: "delete_user",
      adminId,
      userId,
      timestamp: serverTimestamp(),
    });

    // Delete the user from Firebase Auth
    try {
      const user = await auth.getUser(userId);
      if (user) {
        await deleteAuthUser(user);
      }
    } catch (authError) {
      console.error("Error deleting auth user:", authError);
      // Continue even if auth deletion fails
    }

    return true;
  } catch (error) {
    console.error("Error deleting user:", error);
    throw new Error("Failed to delete user");
  }
};

// Grant admin privileges
export const grantAdminPrivileges = async (
  userId: string,
  adminId: string
): Promise<boolean> => {
  try {
    const userRef = doc(db, "users", userId);
    const userDoc = await getDoc(userRef);

    if (!userDoc.exists()) {
      throw new Error("User not found");
    }

    // Update user document
    await updateDoc(userRef, {
      isAdmin: true,
    });

    // Create admin log
    await addDoc(collection(db, "adminLogs"), {
      action: "grant_admin",
      adminId,
      userId,
      timestamp: serverTimestamp(),
    });

    // Create notification for the user
    await createNotification({
      userId,
      type: "admin_role_granted",
      message: "You have been granted admin privileges.",
      actorId: adminId,
      entityId: userId,
      entityType: "user",
    });

    return true;
  } catch (error) {
    console.error("Error granting admin privileges:", error);
    throw new Error("Failed to grant admin privileges");
  }
};

// Revoke admin privileges
export const revokeAdminPrivileges = async (
  userId: string,
  adminId: string
): Promise<boolean> => {
  try {
    const userRef = doc(db, "users", userId);
    const userDoc = await getDoc(userRef);

    if (!userDoc.exists()) {
      throw new Error("User not found");
    }

    // Update user document
    await updateDoc(userRef, {
      isAdmin: false,
    });

    // Create admin log
    await addDoc(collection(db, "adminLogs"), {
      action: "revoke_admin",
      adminId,
      userId,
      timestamp: serverTimestamp(),
    });

    // Create notification for the user
    await createNotification({
      userId,
      type: "admin_role_removed",
      message: "Your admin privileges have been revoked.",
      actorId: adminId,
      entityId: userId,
      entityType: "user",
    });

    return true;
  } catch (error) {
    console.error("Error revoking admin privileges:", error);
    throw new Error("Failed to revoke admin privileges");
  }
};

// Content moderation - Reports
export interface Report {
  id?: string;
  reporterId: string;
  entityId: string;
  entityType: "post" | "comment" | "event" | "user" | "message";
  reason: string;
  description?: string;
  status: "pending" | "reviewed" | "resolved" | "dismissed";
  createdAt: any;
  reviewedAt?: any;
  reviewedBy?: string;
  action?: string;
}

// Create a report
export const createReport = async (
  reportData: Omit<Report, "id" | "status" | "createdAt">
): Promise<string> => {
  try {
    const report = {
      ...reportData,
      status: "pending",
      createdAt: serverTimestamp(),
    };

    const docRef = await addDoc(collection(db, "reports"), report);

    // Update report count for the entity
    if (reportData.entityType === "user") {
      const userRef = doc(db, "users", reportData.entityId);
      await updateDoc(userRef, {
        reportCount: increment(1),
      });
    }

    return docRef.id;
  } catch (error) {
    console.error("Error creating report:", error);
    throw new Error("Failed to submit report");
  }
};

// Get reports for admin
export const getReports = async (
  status?: "pending" | "reviewed" | "resolved" | "dismissed"
): Promise<Report[]> => {
  try {
    let reportsQuery;

    if (status) {
      reportsQuery = query(
        collection(db, "reports"),
        where("status", "==", status),
        orderBy("createdAt", "desc")
      );
    } else {
      reportsQuery = query(
        collection(db, "reports"),
        orderBy("createdAt", "desc")
      );
    }

    const snapshot = await getDocs(reportsQuery);
    return snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as Report[];
  } catch (error) {
    console.error("Error getting reports:", error);
    throw new Error("Failed to fetch reports");
  }
};

// Review a report
export const reviewReport = async (
  reportId: string,
  adminId: string,
  status: "resolved" | "dismissed",
  action?: string
): Promise<boolean> => {
  try {
    const reportRef = doc(db, "reports", reportId);
    const reportDoc = await getDoc(reportRef);

    if (!reportDoc.exists()) {
      throw new Error("Report not found");
    }

    const reportData = reportDoc.data() as Report;

    // Update report
    await updateDoc(reportRef, {
      status,
      reviewedAt: serverTimestamp(),
      reviewedBy: adminId,
      action,
    });

    // Create admin log
    await addDoc(collection(db, "adminLogs"), {
      action: "review_report",
      adminId,
      reportId,
      status,
      entityId: reportData.entityId,
      entityType: reportData.entityType,
      timestamp: serverTimestamp(),
    });

    return true;
  } catch (error) {
    console.error("Error reviewing report:", error);
    throw new Error("Failed to review report");
  }
};

// Delete content (post, comment, event)
export const deleteContent = async (
  entityId: string,
  entityType: "post" | "comment" | "event",
  adminId: string,
  reason: string
): Promise<boolean> => {
  try {
    let entityRef;
    let authorId;

    // Get the entity and author ID
    if (entityType === "post") {
      entityRef = doc(db, "posts", entityId);
      const postDoc = await getDoc(entityRef);
      if (!postDoc.exists()) {
        throw new Error("Post not found");
      }
      authorId = postDoc.data().authorId;
    } else if (entityType === "comment") {
      entityRef = doc(db, "comments", entityId);
      const commentDoc = await getDoc(entityRef);
      if (!commentDoc.exists()) {
        throw new Error("Comment not found");
      }
      authorId = commentDoc.data().authorId;
    } else if (entityType === "event") {
      entityRef = doc(db, "events", entityId);
      const eventDoc = await getDoc(entityRef);
      if (!eventDoc.exists()) {
        throw new Error("Event not found");
      }
      authorId = eventDoc.data().authorId;
    }

    // Delete the entity
    await deleteDoc(entityRef);

    // Create admin log
    await addDoc(collection(db, "adminLogs"), {
      action: `delete_${entityType}`,
      adminId,
      entityId,
      entityType,
      reason,
      timestamp: serverTimestamp(),
    });

    // Notify the author
    if (authorId) {
      await createNotification({
        userId: authorId,
        type: "content_removed",
        message: `Your ${entityType} has been removed by an administrator. Reason: ${reason}`,
        actorId: adminId,
        entityId,
        entityType,
      });
    }

    return true;
  } catch (error) {
    console.error(`Error deleting ${entityType}:`, error);
    throw new Error(`Failed to delete ${entityType}`);
  }
};

// Get admin logs
export const getAdminLogs = async (limitCount = 100): Promise<any[]> => {
  try {
    const logsQuery = query(
      collection(db, "adminLogs"),
      orderBy("timestamp", "desc"),
      limit(limitCount)
    );

    const snapshot = await getDocs(logsQuery);
    return snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));
  } catch (error) {
    console.error("Error getting admin logs:", error);
    throw new Error("Failed to fetch admin logs");
  }
};

// Get admin dashboard stats
export const getAdminStats = async (): Promise<any> => {
  try {
    // Get total users count
    const usersQuery = query(collection(db, "users"));
    const usersSnapshot = await getDocs(usersQuery);
    const totalUsers = usersSnapshot.size;

    // Get blocked users count
    const blockedUsersQuery = query(
      collection(db, "users"),
      where("isBlocked", "==", true)
    );
    const blockedUsersSnapshot = await getDocs(blockedUsersQuery);
    const blockedUsers = blockedUsersSnapshot.size;

    // Get total posts count
    const postsQuery = query(collection(db, "posts"));
    const postsSnapshot = await getDocs(postsQuery);
    const totalPosts = postsSnapshot.size;

    // Get total events count
    const eventsQuery = query(collection(db, "events"));
    const eventsSnapshot = await getDocs(eventsQuery);
    const totalEvents = eventsSnapshot.size;

    // Get pending reports count
    const pendingReportsQuery = query(
      collection(db, "reports"),
      where("status", "==", "pending")
    );
    const pendingReportsSnapshot = await getDocs(pendingReportsQuery);
    const pendingReports = pendingReportsSnapshot.size;

    return {
      totalUsers,
      blockedUsers,
      totalPosts,
      totalEvents,
      pendingReports,
    };
  } catch (error) {
    console.error("Error getting admin stats:", error);
    throw new Error("Failed to fetch admin stats");
  }
};
