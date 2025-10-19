# Contact Information Masking Feature

## Overview

The contact information masking feature protects candidate privacy by hiding sensitive contact details until interviews are scheduled. This ensures that employers cannot access personal contact information without first committing to an interview process.

## How It Works

### Contact Information Masking

- **Phone Numbers**: Shows only the last 2 digits (e.g., "xxx-xxx-90" for "1234567890")
- **Locations**: Shows city and country only, masks specific addresses
- **Email**: Shows "xxx@xxx.com" when masked
- **Visual Indicators**: Shows "Contact Hidden" badges and eye-off icons

### When Information is Masked

Contact information is masked when:
- No interviews are scheduled for the candidate
- All scheduled interviews are in "pending" or "cancelled" status

### When Information is Revealed

Contact information is revealed when:
- At least one interview is in "confirmed" or "scheduled" status

## Implementation Details

### Files Modified

1. **`src/utils/contactMasking.js`** - Core utility functions
2. **`src/components/employer/CandidateCard.jsx`** - Candidate list cards
3. **`src/components/employer/CandidateDetailPanel.jsx`** - Detailed candidate view
4. **`src/components/employer/InterviewSchedulingModal.jsx`** - Interview scheduling
5. **`src/pages/employer/CandidatesPage.jsx`** - Main candidates page

### Key Functions

- `maskPhoneNumber(phone)` - Masks phone numbers showing only last 2 digits
- `maskLocation(location)` - Masks specific address details
- `shouldMaskContactInfo(candidate)` - Determines if contact should be masked
- `getMaskedContactInfo(candidate)` - Returns masked or unmasked contact info
- `getContactDisplayText(candidate)` - Returns display-ready contact information

## User Experience

### For Employers

1. **Candidate Cards**: Show masked contact info with "Contact Hidden" badges
2. **Detail Panels**: Display masked info with explanatory messages
3. **Interview Scheduling**: Shows notice about contact information being revealed
4. **Privacy Notice**: Header message explains the privacy protection

### Visual Indicators

- 🚫 "Contact Hidden" badges with eye-off icons
- ⚠️ Amber-colored warning messages
- 📍 Location masking with city/country only
- 📞 Phone number masking with "xxx-xxx-XX" format

## Privacy Benefits

1. **Prevents Unauthorized Contact**: Employers cannot reach candidates without scheduling interviews
2. **Reduces Spam**: Protects candidates from unsolicited contact
3. **Encourages Proper Process**: Ensures interviews are scheduled before contact
4. **Compliance**: Helps meet privacy regulations and best practices

## Example Scenarios

### Before Interview Scheduling
```
Phone: xxx-xxx-89
Location: Kochi, India
Status: Contact Hidden
```

### After Interview Scheduling
```
Phone: 8978678989
Location: Kochi, India
Status: Contact Available
```

## Testing

The feature includes comprehensive tests in `src/utils/contactMasking.test.js` covering:
- Phone number masking logic
- Location masking logic
- Interview status detection
- Edge cases and error handling

## Future Enhancements

1. **Granular Control**: Allow candidates to choose what information to mask
2. **Time-based Revealing**: Automatically reveal contact after certain time periods
3. **Interview Status Integration**: Better integration with interview scheduling system
4. **Audit Logging**: Track when contact information is revealed












