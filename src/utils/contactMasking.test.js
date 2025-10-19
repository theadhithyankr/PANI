import { maskPhoneNumber, maskLocation, shouldMaskContactInfo, getMaskedContactInfo, getContactDisplayText } from './contactMasking';

describe('Contact Masking Utils', () => {
  describe('maskPhoneNumber', () => {
    test('should mask phone number showing only last 2 digits', () => {
      expect(maskPhoneNumber('1234567890')).toBe('xxx-xxx-90');
      expect(maskPhoneNumber('9876543210')).toBe('xxx-xxx-10');
    });

    test('should handle short phone numbers', () => {
      expect(maskPhoneNumber('123')).toBe('xxx');
      expect(maskPhoneNumber('1234')).toBe('xx34');
    });

    test('should handle null/undefined', () => {
      expect(maskPhoneNumber(null)).toBe('Not provided');
      expect(maskPhoneNumber(undefined)).toBe('Not provided');
      expect(maskPhoneNumber('')).toBe('Not provided');
    });
  });

  describe('maskLocation', () => {
    test('should mask specific address details', () => {
      expect(maskLocation('123 Main Street, New York, USA')).toBe('New York, USA');
      expect(maskLocation('456 Oak Avenue, London, UK')).toBe('London, UK');
    });

    test('should handle simple locations', () => {
      expect(maskLocation('New York')).toBe('New York');
      expect(maskLocation('Kochi')).toBe('Kochi');
    });

    test('should truncate long locations', () => {
      expect(maskLocation('This is a very long location name that should be truncated')).toBe('This is a very...');
    });

    test('should handle null/undefined', () => {
      expect(maskLocation(null)).toBe('Location not specified');
      expect(maskLocation(undefined)).toBe('Location not specified');
      expect(maskLocation('')).toBe('Location not specified');
    });
  });

  describe('shouldMaskContactInfo', () => {
    test('should mask when no interviews scheduled', () => {
      const candidate = { id: 1, name: 'John Doe' };
      expect(shouldMaskContactInfo(candidate)).toBe(true);
    });

    test('should mask when interviews are pending', () => {
      const candidate = {
        id: 1,
        name: 'John Doe',
        scheduledInterviews: [
          { status: 'pending' },
          { status: 'cancelled' }
        ]
      };
      expect(shouldMaskContactInfo(candidate)).toBe(true);
    });

    test('should not mask when interviews are confirmed', () => {
      const candidate = {
        id: 1,
        name: 'John Doe',
        scheduledInterviews: [
          { status: 'confirmed' },
          { status: 'scheduled' }
        ]
      };
      expect(shouldMaskContactInfo(candidate)).toBe(false);
    });
  });

  describe('getMaskedContactInfo', () => {
    test('should return masked info when should mask', () => {
      const candidate = {
        id: 1,
        name: 'John Doe',
        phone: '1234567890',
        current_location: 'New York, USA',
        email: 'john@example.com'
      };

      const result = getMaskedContactInfo(candidate);
      expect(result.phone).toBe('xxx-xxx-90');
      expect(result.location).toBe('New York, USA');
      expect(result.email).toBe('xxx@xxx.com');
      expect(result.isMasked).toBe(true);
    });

    test('should return unmasked info when should not mask', () => {
      const candidate = {
        id: 1,
        name: 'John Doe',
        phone: '1234567890',
        current_location: 'New York, USA',
        email: 'john@example.com',
        scheduledInterviews: [{ status: 'confirmed' }]
      };

      const result = getMaskedContactInfo(candidate);
      expect(result.phone).toBe('1234567890');
      expect(result.location).toBe('New York, USA');
      expect(result.email).toBe('john@example.com');
      expect(result.isMasked).toBe(false);
    });
  });

  describe('getContactDisplayText', () => {
    test('should return masked display text with message', () => {
      const candidate = {
        id: 1,
        name: 'John Doe',
        phone: '1234567890',
        current_location: 'New York, USA'
      };

      const result = getContactDisplayText(candidate);
      expect(result.phone).toBe('xxx-xxx-90');
      expect(result.location).toBe('New York, USA');
      expect(result.message).toBe('Contact information will be revealed after scheduling an interview');
    });

    test('should return unmasked display text without message', () => {
      const candidate = {
        id: 1,
        name: 'John Doe',
        phone: '1234567890',
        current_location: 'New York, USA',
        scheduledInterviews: [{ status: 'confirmed' }]
      };

      const result = getContactDisplayText(candidate);
      expect(result.phone).toBe('1234567890');
      expect(result.location).toBe('New York, USA');
      expect(result.message).toBe(null);
    });
  });
});












