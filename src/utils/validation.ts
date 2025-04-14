export const validateEmail = (email: string): boolean => {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email);
};

export const validatePassword = (password: string): boolean => {
  return password.length >= 6;
};

export const validateEventDates = (
  startDate: Date | null,
  endDate: Date | null
): boolean => {
  if (!startDate || !endDate) return false;
  return startDate < endDate;
};

export const validateRequired = (value: string): boolean => {
  return value.trim().length > 0;
};

export const validateLocationName = (location: string): boolean => {
  // Basic validation for location names
  // Checks if it contains at least one letter and is at least 2 characters long
  return /[a-zA-Z]/.test(location) && location.trim().length >= 2;
};

export const normalizeLocationName = (name: string): string => {
  return name.toLowerCase().replace(/\s+/g, " ").trim();
};
