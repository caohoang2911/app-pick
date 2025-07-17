/**
 * Format phone number to 84 format
 * @param phone - Phone number to format
 * @returns Formatted phone number starting with 84
 */
export const formatPhoneTo84 = (phone: string): string => {
  if (!phone) return '';
  
  // Remove all non-digit characters except +
  let cleaned = phone.replace(/\s+/g, '').replace(/[^\d+]/g, '');
  
  // If starts with 0, replace with 84
  if (cleaned.startsWith('0')) {
    cleaned = '84' + cleaned.substring(1);
  }
  
  // If starts with +84, remove the +
  if (cleaned.startsWith('+84')) {
    cleaned = cleaned.substring(1);
  }
  
  // If doesn't start with 84, add it
  if (!cleaned.startsWith('84')) {
    cleaned = '84' + cleaned;
  }
  
  return cleaned;
};

/**
 * Format phone number for display
 * @param phone - Phone number to format
 * @returns Formatted phone number for display
 */
export const formatPhoneForDisplay = (phone: string): string => {
  if (!phone) return '';
  
  const formatted = formatPhoneTo84(phone);
  
  // Format as +84 xxx xxx xxxx
  if (formatted.length === 11) {
    return `+${formatted.substring(0, 2)} ${formatted.substring(2, 5)} ${formatted.substring(5, 8)} ${formatted.substring(8)}`;
  }
  
  return `+${formatted}`;
};

/**
 * Validate phone number format
 * @param phone - Phone number to validate
 * @returns true if valid, false otherwise
 */
export const isValidPhoneNumber = (phone: string): boolean => {
  if (!phone) return false;
  
  const formatted = formatPhoneTo84(phone);
  
  // Vietnamese phone numbers should be 11 digits starting with 84
  return /^84\d{9}$/.test(formatted);
};

/**
 * Extract phone number from various formats
 * @param phone - Phone number in any format
 * @returns Clean phone number
 */
export const extractPhoneNumber = (phone: string): string => {
  if (!phone) return '';
  
  // Remove all non-digit characters
  return phone.replace(/\D/g, '');
}; 