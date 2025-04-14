import { db } from "../firebase";
import {
  collection,
  addDoc,
  getDocs,
  getDoc,
  doc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  arrayUnion,
  arrayRemove,
  GeoPoint,
  serverTimestamp,
  limit, // Import limit
} from "firebase/firestore";
import type { Event, EventFilter } from "../types/event";

const eventsCollection = collection(db, "events");

// Cache for events to reduce Firestore reads
const eventCache = new Map<string, { data: Event; timestamp: number }>();
const CACHE_EXPIRY = 5 * 60 * 1000; // 5 minutes

// Create a new event
export const createEvent = async (
  eventData: Omit<Event, "id" | "createdAt" | "attendees" | "interested">
): Promise<string> => {
  try {
    // Add location data if provided
    let geopoint = null;
    let locationKeywords = null;

    if (eventData.location?.lat && eventData.location?.lng) {
      geopoint = new GeoPoint(eventData.location.lat, eventData.location.lng);

      if (eventData.location.name) {
        locationKeywords = eventData.location.name
          .toLowerCase()
          .split(",")
          .map((part) => part.trim());
      }
    }

    const docRef = await addDoc(eventsCollection, {
      ...eventData,
      createdAt: new Date().toISOString(),
      timestamp: serverTimestamp(),
      attendees: [eventData.authorId], // Creator automatically attends
      interested: [],
      geopoint,
      locationKeywords,
    });

    return docRef.id;
  } catch (error) {
    console.error("Error creating event:", error);
    throw new Error("Failed to create event. Please try again.");
  }
};

// Get all events with filtering
export const getEvents = async (filter?: EventFilter): Promise<Event[]> => {
  try {
    let eventQuery = query(eventsCollection, orderBy("startDate", "asc"));

    // Apply filters if provided
    if (filter) {
      if (filter.category) {
        eventQuery = query(
          eventQuery,
          where("category", "==", filter.category)
        );
      }

      if (filter.startDate) {
        eventQuery = query(
          eventQuery,
          where("startDate", ">=", filter.startDate)
        );
      }

      if (filter.endDate) {
        eventQuery = query(eventQuery, where("endDate", "<=", filter.endDate));
      }
    }

    const snapshot = await getDocs(eventQuery);
    const events = snapshot.docs.map(
      (doc) => ({ id: doc.id, ...doc.data() } as Event)
    );

    // Apply text search filter if provided (client-side filtering)
    if (filter?.query) {
      const lowerQuery = filter.query.toLowerCase();
      return events.filter(
        (event) =>
          event.title.toLowerCase().includes(lowerQuery) ||
          event.description.toLowerCase().includes(lowerQuery)
      );
    }

    // Apply location filter if provided (client-side filtering)
    if (filter?.location) {
      const lowerLocation = filter.location.toLowerCase();
      return events.filter((event) =>
        event.location?.name.toLowerCase().includes(lowerLocation)
      );
    }

    return events;
  } catch (error) {
    console.error("Error getting events:", error);
    throw new Error("Failed to fetch events. Please try again.");
  }
};

// Get events for a specific month
export const getEventsByMonth = async (
  year: number,
  month: number
): Promise<Event[]> => {
  try {
    // Create date range for the month
    const startDate = new Date(year, month, 1).toISOString();
    const endDate = new Date(year, month + 1, 0).toISOString();

    const eventQuery = query(
      eventsCollection,
      where("startDate", ">=", startDate),
      where("startDate", "<=", endDate)
    );

    const snapshot = await getDocs(eventQuery);
    return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as Event));
  } catch (error) {
    console.error("Error getting events by month:", error);
    throw new Error("Failed to fetch events for this month. Please try again.");
  }
};

// Get a single event by ID with caching
export const getEvent = async (id: string): Promise<Event | null> => {
  try {
    // Check cache first
    const cachedEvent = eventCache.get(id);
    const now = Date.now();

    if (cachedEvent && now - cachedEvent.timestamp < CACHE_EXPIRY) {
      return cachedEvent.data;
    }

    // If not in cache or expired, fetch from Firestore
    const docRef = doc(db, "events", id);
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) {
      return null;
    }

    const eventData = { id: docSnap.id, ...docSnap.data() } as Event;

    // Update cache
    eventCache.set(id, { data: eventData, timestamp: now });

    return eventData;
  } catch (error) {
    console.error("Error getting event:", error);
    throw new Error("Failed to fetch event details. Please try again.");
  }
};

// Update an event
export const updateEvent = async (
  id: string,
  eventData: Partial<Event>
): Promise<void> => {
  try {
    const eventRef = doc(db, "events", id);

    // Update location data if provided
    if (eventData.location?.lat && eventData.location?.lng) {
      const geopoint = new GeoPoint(
        eventData.location.lat,
        eventData.location.lng
      );
      eventData.geopoint = geopoint;

      if (eventData.location.name) {
        const locationKeywords = eventData.location.name
          .toLowerCase()
          .split(",")
          .map((part) => part.trim());
        eventData.locationKeywords = locationKeywords;
      }
    }

    await updateDoc(eventRef, eventData);

    // Invalidate cache
    eventCache.delete(id);
  } catch (error) {
    console.error("Error updating event:", error);
    throw new Error("Failed to update event. Please try again.");
  }
};

// Delete an event
export const deleteEvent = async (id: string): Promise<void> => {
  try {
    const eventRef = doc(db, "events", id);
    await deleteDoc(eventRef);

    // Remove from cache
    eventCache.delete(id);
  } catch (error) {
    console.error("Error deleting event:", error);
    throw new Error("Failed to delete event. Please try again.");
  }
};

// RSVP to an event
export const attendEvent = async (
  eventId: string,
  userId: string
): Promise<void> => {
  try {
    const eventRef = doc(db, "events", eventId);

    await updateDoc(eventRef, {
      attendees: arrayUnion(userId),
      interested: arrayRemove(userId), // Remove from interested if they were interested
    });

    // Invalidate cache
    eventCache.delete(eventId);
  } catch (error) {
    console.error("Error attending event:", error);
    throw new Error("Failed to RSVP to event. Please try again.");
  }
};

// Mark interest in an event
export const markInterested = async (
  eventId: string,
  userId: string
): Promise<void> => {
  try {
    const eventRef = doc(db, "events", eventId);

    await updateDoc(eventRef, {
      interested: arrayUnion(userId),
    });

    // Invalidate cache
    eventCache.delete(eventId);
  } catch (error) {
    console.error("Error marking interest in event:", error);
    throw new Error("Failed to mark interest in event. Please try again.");
  }
};

// Cancel attendance
export const cancelAttendance = async (
  eventId: string,
  userId: string
): Promise<void> => {
  try {
    const eventRef = doc(db, "events", eventId);

    await updateDoc(eventRef, {
      attendees: arrayRemove(userId),
    });

    // Invalidate cache
    eventCache.delete(eventId);
  } catch (error) {
    console.error("Error canceling attendance:", error);
    throw new Error("Failed to cancel attendance. Please try again.");
  }
};

// Get events created by a user
export const getUserEvents = async (userId: string): Promise<Event[]> => {
  try {
    const eventQuery = query(
      eventsCollection,
      where("authorId", "==", userId),
      orderBy("startDate", "asc")
    );

    const snapshot = await getDocs(eventQuery);
    return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as Event));
  } catch (error) {
    console.error("Error getting user events:", error);
    throw new Error("Failed to fetch user's events. Please try again.");
  }
};

// Get events a user is attending
export const getAttendingEvents = async (userId: string): Promise<Event[]> => {
  try {
    const eventQuery = query(
      eventsCollection,
      where("attendees", "array-contains", userId),
      orderBy("startDate", "asc")
    );

    const snapshot = await getDocs(eventQuery);
    return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as Event));
  } catch (error) {
    console.error("Error getting attending events:", error);
    throw new Error(
      "Failed to fetch events you're attending. Please try again."
    );
  }
};

// Get events a user is interested in
export const getInterestedEvents = async (userId: string): Promise<Event[]> => {
  try {
    const eventQuery = query(
      eventsCollection,
      where("interested", "array-contains", userId),
      orderBy("startDate", "asc")
    );

    const snapshot = await getDocs(eventQuery);
    return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as Event));
  } catch (error) {
    console.error("Error getting interested events:", error);
    throw new Error(
      "Failed to fetch events you're interested in. Please try again."
    );
  }
};

// Get upcoming events
export const getUpcomingEvents = async (limitCount = 10): Promise<Event[]> => {
  try {
    const now = new Date().toISOString();

    // Create a query with the limit parameter
    const eventQuery = query(
      eventsCollection,
      where("startDate", ">=", now),
      orderBy("startDate", "asc"),
      limit(limitCount) // This is the Firebase limit function
    );

    const snapshot = await getDocs(eventQuery);
    return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as Event));
  } catch (error) {
    console.error("Error getting upcoming events:", error);
    throw new Error("Failed to fetch upcoming events. Please try again.");
  }
};

// Get popular events (most attendees)
export const getPopularEvents = async (limit = 10): Promise<Event[]> => {
  try {
    const now = new Date().toISOString();

    // First get upcoming events
    const eventQuery = query(
      eventsCollection,
      where("startDate", ">=", now),
      orderBy("startDate", "asc")
    );

    const snapshot = await getDocs(eventQuery);
    const events = snapshot.docs.map(
      (doc) => ({ id: doc.id, ...doc.data() } as Event)
    );

    // Sort by number of attendees
    const sortedEvents = events.sort(
      (a, b) => (b.attendees?.length || 0) - (a.attendees?.length || 0)
    );

    return sortedEvents.slice(0, limit);
  } catch (error) {
    console.error("Error getting popular events:", error);
    throw new Error("Failed to fetch popular events. Please try again.");
  }
};

// Clear event cache
export const clearEventCache = () => {
  eventCache.clear();
};
