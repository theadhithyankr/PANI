# Password Reset Setup Guide

This guide explains how to set up the password reset functionality with Supabase.

## Required Environment Variables

Make sure you have the following environment variables set in your `.env` file:

```env
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

## Supabase Configuration

To enable password reset functionality, you need to configure your Supabase project:

### 1. Authentication Settings

1. Go to your Supabase Dashboard
2. Navigate to **Authentication > Settings**
3. Configure the following:

#### Site URL
- Set your site URL (e.g., `http://localhost:5173` for development, `https://yourdomain.com` for production)

#### Redirect URLs
Add the following redirect URLs:
- `http://localhost:5173/reset-password` (for development)
- `https://yourdomain.com/reset-password` (for production)

### 2. Email Templates (Optional)

You can customize the password reset email template:

1. Go to **Authentication > Email Templates**
2. Select "Reset Password"
3. Customize the template as needed
4. Make sure the reset link points to your reset-password page

## How It Works

### Forgot Password Flow
1. User enters their email on `/forgot-password`
2. System calls `supabase.auth.resetPasswordForEmail()`
3. Supabase sends an email with a reset link
4. User receives email and clicks the link

### Reset Password Flow
1. User clicks the reset link from email
2. They are redirected to `/reset-password` with tokens in the URL hash
3. The page validates the tokens and allows password update
4. System calls `supabase.auth.updateUser()` to set the new password
5. User is redirected to login page

## Security Features

- Tokens expire automatically
- Each reset link can only be used once
- Password strength validation
- Secure token handling
- Automatic session management

## Pages Created

- **ForgotPasswordPage** (`/forgot-password`): Request password reset
- **ResetPasswordPage** (`/reset-password`): Set new password

Both pages include:
- Beautiful, responsive UI
- Loading states
- Error handling
- Success feedback
- Proper validation 