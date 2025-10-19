/**
 * Contact Information Masking Utility
 * Masks sensitive contact information until interviews are scheduled
 */

// Mask phone number - shows only last 2 digits
export const maskPhoneNumber = (phone) => {
  if (!phone) return 'Not provided';
  
  const cleaned = phone.replace(/\D/g, '');
  if (cleaned.length < 4) return 'xxx';
  
  const lastTwo = cleaned.slice(-2);
  const masked = 'x'.repeat(cleaned.length - 2) + lastTwo;
  
  // Format with dashes for readability
  if (masked.length === 10) {
    return `xxx-xxx-${lastTwo}`;
  } else if (masked.length === 11) {
    return `x-xxx-xxx-${lastTwo}`;
  }
  
  return masked;
};

// Mask location - shows only city and country, masks specific details
export const maskLocation = (location) => {
  if (!location) return 'Location not specified';
  
  // If location contains specific address details, mask them
  if (location.includes(',') || location.includes('Street') || location.includes('Avenue') || location.includes('Road')) {
    const parts = location.split(',').map(part => part.trim());
    if (parts.length >= 2) {
      // Keep city and country, mask street details
      return `${parts[parts.length - 2]}, ${parts[parts.length - 1]}`;
    }
  }
  
  // For simple locations, show as is but mask if it's too specific
  if (location.length > 20) {
    return location.substring(0, 15) + '...';
  }
  
  return location;
};

// Check if contact information should be masked
export const shouldMaskContactInfo = (candidate) => {
  // Mask if no interviews are scheduled
  if (!candidate.scheduledInterviews || candidate.scheduledInterviews.length === 0) {
    return true;
  }
  
  // Check if any interviews are confirmed
  const hasConfirmedInterviews = candidate.scheduledInterviews.some(
    interview => interview.status === 'confirmed' || interview.status === 'scheduled'
  );
  
  return !hasConfirmedInterviews;
};

// Get masked contact information
export const getMaskedContactInfo = (candidate) => {
  const shouldMask = shouldMaskContactInfo(candidate);
  
  return {
    phone: shouldMask ? maskPhoneNumber(candidate.phone) : candidate.phone,
    location: shouldMask ? maskLocation(candidate.current_location) : candidate.current_location,
    email: shouldMask ? 'xxx@xxx.com' : candidate.email,
    isMasked: shouldMask
  };
};

// Get contact information display text
export const getContactDisplayText = (candidate) => {
  const maskedInfo = getMaskedContactInfo(candidate);
  
  if (maskedInfo.isMasked) {
    return {
      phone: maskedInfo.phone,
      location: maskedInfo.location,
      message: 'Contact information will be revealed after scheduling an interview'
    };
  }
  
  return {
    phone: maskedInfo.phone,
    location: maskedInfo.location,
    message: null
  };
};












