// Create a constants file for API keys and other configuration
export const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || "AIzaSyCX4xwYTwIDjj64ZULpmz-Osy4NNfRrSiE"

export const EVENT_CATEGORIES = [
  { id: "travel", name: "Travel", icon: "flight" },
  { id: "food", name: "Food & Drinks", icon: "restaurant" },
  { id: "culture", name: "Cultural", icon: "museum" },
  { id: "adventure", name: "Adventure", icon: "hiking" },
  { id: "nature", name: "Nature", icon: "park" },
  { id: "workshop", name: "Workshop", icon: "build" },
  { id: "meetup", name: "Meetup", icon: "groups" },
  { id: "festival", name: "Festival", icon: "celebration" },
  { id: "concert", name: "Concert", icon: "music_note" },
  { id: "sports", name: "Sports", icon: "sports" },
  { id: "other", name: "Other", icon: "more_horiz" },
]
