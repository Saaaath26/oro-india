# Google OAuth Setup Guide for Oro India

## Overview
This guide explains how to set up Google OAuth authentication for the Oro India platform.

## Prerequisites
1. Google Cloud Console account
2. Domain verification (for production)

## Step 1: Create Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing one
3. Name it "Oro India CBSE Platform"

## Step 2: Enable Google+ API

1. Go to "APIs & Services" > "Library"
2. Search for "Google+ API"
3. Click "Enable"

## Step 3: Create OAuth 2.0 Credentials

1. Go to "APIs & Services" > "Credentials"
2. Click "Create Credentials" > "OAuth 2.0 Client IDs"
3. Choose "Web application"
4. Name: "Oro India Web Client"
5. Authorized JavaScript origins:
   - `http://localhost:3001` (development)
   - `https://yourdomain.com` (production)
6. Authorized redirect URIs:
   - `http://localhost:3001/auth/google/callback` (development)
   - `https://yourdomain.com/auth/google/callback` (production)

## Step 4: Configure Environment Variables

Add to your `.env` file:
```env
GOOGLE_CLIENT_ID=your_google_client_id_here
GOOGLE_CLIENT_SECRET=your_google_client_secret_here
```

## Step 5: Update Frontend Configuration

In `script.js`, update the Google Sign-In initialization:
```javascript
function initializeGoogleSignIn() {
    if (typeof google !== 'undefined' && process.env.GOOGLE_CLIENT_ID) {
        google.accounts.id.initialize({
            client_id: process.env.GOOGLE_CLIENT_ID,
            callback: handleGoogleSignIn
        });
    }
}
```

## Step 6: Add Google Sign-In Script

Add to `index.html` before closing `</body>` tag:
```html
<script src="https://accounts.google.com/gsi/client" async defer></script>
```

## Step 7: Enable Google Buttons

In `index.html`, remove `disabled` attribute from Google buttons:
```html
<button class="btn btn-google" onclick="signInWithGoogle()">
    <i class="fab fa-google"></i>
    Continue with Google
</button>
```

## Step 8: Backend OAuth Route (Optional)

Create `/api/auth/google` endpoint for server-side verification:
```javascript
router.post('/google', async (req, res) => {
    try {
        const { credential } = req.body;
        
        // Verify Google JWT token
        const ticket = await client.verifyIdToken({
            idToken: credential,
            audience: process.env.GOOGLE_CLIENT_ID,
        });
        
        const payload = ticket.getPayload();
        
        // Create or find user in database
        // Generate JWT token
        // Set cookie and return user data
        
    } catch (error) {
        res.status(401).json({ success: false, error: 'Invalid Google token' });
    }
});
```

## Security Notes

1. **Never expose client secret** in frontend code
2. **Verify tokens server-side** for production
3. **Use HTTPS** in production
4. **Validate redirect URIs** carefully
5. **Implement CSRF protection**

## Testing

1. Test with localhost first
2. Verify token validation
3. Check user creation flow
4. Test logout functionality

## Production Deployment

1. Update authorized origins with production domain
2. Enable domain verification
3. Update environment variables
4. Test thoroughly before launch

## Current Status

🔴 **Disabled** - Google OAuth is currently disabled and shows "Coming Soon"
🟡 **Ready for Setup** - Infrastructure is in place, just needs Google Cloud configuration
🟢 **Easy to Enable** - Follow this guide to enable Google authentication

## Support

For issues with Google OAuth setup:
1. Check Google Cloud Console logs
2. Verify all URLs and credentials
3. Test with Google OAuth Playground
4. Contact Google Cloud Support if needed