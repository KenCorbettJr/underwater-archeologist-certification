# Admin Setup Guide

This guide explains how to set up admin access for the Underwater Archaeology Certification Website.

## Problem

When other admins try to access the admin dashboard at `/admin`, they see a loading screen that never completes. This happens because they don't have the proper admin role assigned in their Clerk user metadata.

## Solution

### For the First Admin (System Administrator)

1. **Sign in to the application** with your Clerk account
2. **Visit the admin setup page**: Go to `/admin/setup`
3. **Assign admin role**: Click "Assign Admin Role to Me"
4. **Access admin dashboard**: You'll be redirected to `/admin`

### For Additional Admins

#### Option 1: Self-Service (Recommended)

1. **Sign in to the application**
2. **Visit the admin setup page**: Go to `/admin/setup`
3. **Request admin access**: Click "Assign Admin Role to Me"
4. **Access admin dashboard**: You'll be redirected to `/admin`

#### Option 2: Admin Assignment

1. **Current admin signs in** and goes to `/admin`
2. **Navigate to Admin Tools**: Expand the "Admin Role Management" section
3. **Select the user**: Choose the user from the dropdown
4. **Assign role**: Click "Assign Admin Role"

## How It Works

### Authentication Flow

1. **Clerk Authentication**: Users sign in through Clerk
2. **Role Check**: The system checks `user.publicMetadata.role`
3. **Admin Access**: Only users with `role: "admin"` can access admin features

### Technical Details

- Admin roles are stored in Clerk's `publicMetadata`
- The middleware checks admin status for `/admin/*` routes
- Client-side guards prevent unauthorized access to admin components

### API Endpoints

- `POST /api/admin/assign-role`: Assigns or removes admin roles
- `GET /api/admin/check-status`: Checks current user's admin status

## Troubleshooting

### "Loading forever" issue

- **Cause**: User doesn't have admin role in Clerk metadata
- **Solution**: Use the admin setup page at `/admin/setup`

### "Access Denied" message

- **Cause**: User is authenticated but not an admin
- **Solution**: Click "Request Admin Access" or contact an existing admin

### API errors

- **Check Clerk configuration**: Ensure Clerk is properly configured
- **Check environment variables**: Verify `.env.local` has correct Clerk keys
- **Check user metadata**: Verify the user has `role: "admin"` in publicMetadata

## Security Notes

- Only authenticated users can request admin access
- The system requires an existing admin to assign roles (except for the first admin)
- All admin actions are logged for audit purposes
- Admin access is checked both client-side and server-side

## Files Modified

- `src/components/auth/AdminGuard.tsx` - Better error handling and access request UI
- `src/app/api/admin/assign-role/route.ts` - API for role assignment
- `src/app/api/admin/check-status/route.ts` - API for status checking
- `src/app/admin/setup/page.tsx` - Self-service admin setup page
- `convex/adminAuth.ts` - Better error handling in queries
- `convex/adminAnalytics.ts` - Graceful error handling
- `src/components/admin/AdminDashboard.tsx` - Progressive loading and fallbacks
