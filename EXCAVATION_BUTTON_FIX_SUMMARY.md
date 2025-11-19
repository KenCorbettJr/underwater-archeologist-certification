# Excavation Simulation Button Fix - Summary

## Problem

The "Start Simulation" button in the excavation simulation game was disabled and not working because authenticated users weren't being automatically added to the Convex database.

## Root Cause

When users authenticated with Clerk, they existed in the Clerk authentication system but not in the Convex `users` table. The excavation simulation page required both:

1. A selected excavation site
2. A user record in the Convex database

Without the user record, the button remained disabled.

## Solution

Added automatic user creation logic that:

1. Detects when a Clerk-authenticated user doesn't exist in the Convex database
2. Automatically creates a user record with their Clerk information
3. Enables the "Start Simulation" button once the user is created

## Files Modified

### 1. `src/app/challenges/excavation-simulation/page.tsx`

- Added `createUser` mutation import
- Added `useEffect` hook to auto-create users
- Improved button text to show current state
- Added helper text to guide users

### 2. `src/app/challenges/progress/page.tsx`

- Applied the same fix to prevent similar issues on the progress page
- Added `createUser` mutation import
- Added `useEffect` hook to auto-create users

## Code Changes

```typescript
// Import the mutation
const createUser = useMutation(api.users.createUser);

// Auto-create user if they don't exist
useEffect(() => {
  if (user && currentUser === null) {
    createUser({
      clerkId: user.id,
      email: user.primaryEmailAddress?.emailAddress || "",
      name: user.fullName || user.firstName || "Student",
    }).catch((error) => {
      console.error("Failed to create user:", error);
    });
  }
}, [user, currentUser, createUser]);
```

## User Experience Improvements

- Button now shows "Loading user data..." while creating the user
- Button shows "Select a site to start" when no site is selected
- Helper text guides users on what to do next
- Seamless experience - users don't need to manually create accounts

## Testing

To verify the fix works:

1. Sign in with Clerk authentication
2. Navigate to `/challenges/excavation-simulation`
3. Select a difficulty level
4. Select an excavation site
5. The button should be enabled and clickable
6. Click to start the game

## Additional Notes

- The artifact game page already had inline user creation logic
- Other game pages (conservation-lab, historical-timeline, site-documentation) don't query for users, so they don't need this fix
- This pattern can be reused for any future pages that require user records
