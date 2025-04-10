import { db } from '../firebase';
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
} from 'firebase/firestore';
import type { Event, EventFilter } from '../types/event';

const eventsCollection = collection(db, 'events');

// Create a new event
export const createEvent = async (
  eventData: Omit<Event, 'id' | 'createdAt' | 'attendees' | 'interested'>
): Promise<string> => {
  // Add location data if provided
  let geopoint = null;
  let locationKeywords = null;

  if (eventData.location?.lat && eventData.location?.lng) {
    geopoint = new GeoPoint(eventData.location.lat, eventData.location.lng);

    if (eventData.location.name) {
      locationKeywords = eventData.location.name
        .toLowerCase()
        .split(',')
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
};

// Get all events
export const getEvents = async (filter?: EventFilter): Promise<Event[]> => {
  let eventQuery = query(eventsCollection, orderBy('startDate', 'asc'));

  // Apply filters if provided
  if (filter) {
    if (filter.category) {
      eventQuery = query(eventQuery, where('category', '==', filter.category));
    }

    if (filter.startDate) {
      eventQuery = query(
        eventQuery,
        where('startDate', '>=', filter.startDate)
      );
    }

    if (filter.endDate) {
      eventQuery = query(eventQuery, where('endDate', '<=', filter.endDate));
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
};

// Get events for a specific month
export const getEventsByMonth = async (
  year: number,
  month: number
): Promise<Event[]> => {
  // Create date range for the month
  const startDate = new Date(year, month, 1).toISOString();
  const endDate = new Date(year, month + 1, 0).toISOString();

  const eventQuery = query(
    eventsCollection,
    where('startDate', '>=', startDate),
    where('startDate', '<=', endDate)
  );

  const snapshot = await getDocs(eventQuery);
  return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as Event));
};

// Get a single event by ID
export const getEvent = async (id: string): Promise<Event | null> => {
  const docRef = doc(db, 'events', id);
  const docSnap = await getDoc(docRef);

  if (!docSnap.exists()) {
    return null;
  }

  return { id: docSnap.id, ...docSnap.data() } as Event;
};

// Update an event
export const updateEvent = async (
  id: string,
  eventData: Partial<Event>
): Promise<void> => {
  const eventRef = doc(db, 'events', id);

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
        .split(',')
        .map((part) => part.trim());
      eventData.locationKeywords = locationKeywords;
    }
  }

  await updateDoc(eventRef, eventData);
};

// Delete an event
export const deleteEvent = async (id: string): Promise<void> => {
  const eventRef = doc(db, 'events', id);
  await deleteDoc(eventRef);
};

// RSVP to an event
export const attendEvent = async (
  eventId: string,
  userId: string
): Promise<void> => {
  const eventRef = doc(db, 'events', eventId);

  await updateDoc(eventRef, {
    attendees: arrayUnion(userId),
    interested: arrayRemove(userId), // Remove from interested if they were interested
  });
};

// Mark interest in an event
export const markInterested = async (
  eventId: string,
  userId: string
): Promise<void> => {
  const eventRef = doc(db, 'events', eventId);

  await updateDoc(eventRef, {
    interested: arrayUnion(userId),
  });
};

// Cancel attendance
export const cancelAttendance = async (
  eventId: string,
  userId: string
): Promise<void> => {
  const eventRef = doc(db, 'events', eventId);

  await updateDoc(eventRef, {
    attendees: arrayRemove(userId),
  });
};

// Get events created by a user
export const getUserEvents = async (userId: string): Promise<Event[]> => {
  const eventQuery = query(
    eventsCollection,
    where('authorId', '==', userId),
    orderBy('startDate', 'asc')
  );

  const snapshot = await getDocs(eventQuery);
  return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as Event));
};

// Get events a user is attending
export const getAttendingEvents = async (userId: string): Promise<Event[]> => {
  const eventQuery = query(
    eventsCollection,
    where('attendees', 'array-contains', userId),
    orderBy('startDate', 'asc')
  );

  const snapshot = await getDocs(eventQuery);
  return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as Event));
};

// Get events a user is interested in
export const getInterestedEvents = async (userId: string): Promise<Event[]> => {
  const eventQuery = query(
    eventsCollection,
    where('interested', 'array-contains', userId),
    orderBy('startDate', 'asc')
  );

  const snapshot = await getDocs(eventQuery);
  return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as Event));
};

// Get upcoming events
export const getUpcomingEvents = async (limit = 10): Promise<Event[]> => {
  const now = new Date().toISOString();

  const eventQuery = query(
    eventsCollection,
    where('startDate', '>=', now),
    orderBy('startDate', 'asc'),
    limit(limit)
  );

  const snapshot = await getDocs(eventQuery);
  return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as Event));
};

// Get popular events (most attendees)
export const getPopularEvents = async (limit = 10): Promise<Event[]> => {
  const now = new Date().toISOString();

  // First get upcoming events
  const eventQuery = query(
    eventsCollection,
    where('startDate', '>=', now),
    orderBy('startDate', 'asc')
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
};
