
export const validateEmail = (email: string): boolean => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return re.test(email)
  }
  
  export const validatePassword = (password: string): boolean => {
    return password.length >= 6
  }
  
  export const validateEventDates = (startDate: Date | null, endDate: Date | null): boolean => {
    if (!startDate || !endDate) return false
    return startDate < endDate
  }
  
  export const validateRequired = (value: string): boolean => {
    return value.trim().length > 0
  }
  