# Google OAuth Setup for FXNote

This document explains how to set up Google OAuth authentication for the FXNote application.

## Prerequisites

1. A Google Cloud Console project
2. Supabase project with authentication enabled

## Google Cloud Console Setup

### 1. Create OAuth 2.0 Client ID

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Select your project or create a new one
3. Navigate to **APIs & Services** > **Credentials**
4. Click **Create Credentials** > **OAuth 2.0 Client IDs**
5. Choose **Web application** as the application type
6. Add the following authorized redirect URIs:
   - `https://your-project-ref.supabase.co/auth/v1/callback`
   - `http://localhost:3000/auth/callback` (for local development)

### 2. Get Client ID and Secret

After creating the OAuth client, you'll receive:
- **Client ID**: A long string ending with `.apps.googleusercontent.com`
- **Client Secret**: A secret string for server-side operations

## Supabase Setup

### 1. Enable Google Provider

1. Go to your Supabase project dashboard
2. Navigate to **Authentication** > **Providers**
3. Find **Google** in the list and click **Enable**
4. Enter your Google OAuth credentials:
   - **Client ID**: Your Google OAuth client ID
   - **Client Secret**: Your Google OAuth client secret
5. Save the configuration

### 2. Configure Redirect URLs

Make sure your Supabase project has the correct redirect URLs configured:
- `https://your-project-ref.supabase.co/auth/v1/callback`
- `http://localhost:3000/auth/callback` (for local development)

## Environment Variables

Add the following environment variables to your `.env.local` file:

```bash
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

## How It Works

1. **User clicks Google button**: The `signInWithGoogle()` function is called
2. **OAuth redirect**: User is redirected to Google's consent screen
3. **Google callback**: After authentication, Google redirects to `/auth/callback`
4. **Profile creation**: If it's a new user, a profile is automatically created
5. **Dashboard redirect**: User is redirected to the dashboard

## Features

- **Automatic profile creation**: New Google users get a profile with default settings
- **Name extraction**: Attempts to extract first/last name from Google user metadata
- **Error handling**: Comprehensive error handling for authentication failures
- **Loading states**: Visual feedback during authentication process
- **Responsive design**: Works on both desktop and mobile devices

## Troubleshooting

### Common Issues

1. **"Invalid redirect URI" error**: Check that your redirect URIs match exactly in both Google Cloud Console and Supabase
2. **Profile creation fails**: Ensure your Supabase database has the correct `profiles` table structure
3. **Authentication callback errors**: Check the browser console and Supabase logs for detailed error messages

### Debug Steps

1. Check browser console for JavaScript errors
2. Verify Supabase authentication logs
3. Ensure all environment variables are set correctly
4. Test with both local and production URLs

## Security Considerations

- Never expose your Google OAuth client secret in client-side code
- Use HTTPS in production
- Regularly rotate your OAuth credentials
- Monitor authentication logs for suspicious activity

## Support

If you encounter issues:
1. Check the Supabase documentation on OAuth providers
2. Review Google OAuth 2.0 documentation
3. Check the browser console and network tab for errors
4. Verify your redirect URI configuration matches exactly
