# Mobile Camera Setup Guide

## Problem

The camera feature works on PC but not on mobile devices. This is because **mobile browsers require HTTPS** for camera access due to security restrictions.

## Quick Solutions

### Option 1: Use Next.js Experimental HTTPS (Easiest for Development)

Next.js 15+ includes experimental HTTPS support:

1. **Start the frontend with HTTPS:**

   ```powershell
   cd frontend
   npm run dev:https
   ```

2. **Access from your phone:**
   - Find your PC's local IP address:
     ```powershell
     ipconfig
     ```
     Look for "IPv4 Address" (usually starts with 192.168.x.x)
3. **Open on your phone:**
   - Go to `https://YOUR_PC_IP:3000` (e.g., `https://192.168.1.100:3000`)
   - You'll see a security warning about the self-signed certificate
   - Click "Advanced" → "Proceed to site" (Chrome) or similar in your browser
   - The certificate warning is normal for development

### Option 2: Use ngrok (Best for Testing)

ngrok creates a secure HTTPS tunnel to your local server:

1. **Install ngrok:**

   - Download from https://ngrok.com/download
   - Or use: `choco install ngrok` (if you have Chocolatey)

2. **Start your frontend normally:**

   ```powershell
   cd frontend
   npm run dev
   ```

3. **In another terminal, start ngrok:**

   ```powershell
   ngrok http 3000
   ```

4. **Use the HTTPS URL provided by ngrok** on your phone (e.g., `https://abc123.ngrok.io`)

### Option 3: Use localtunnel (Alternative)

1. **Install localtunnel:**

   ```powershell
   npm install -g localtunnel
   ```

2. **Start your frontend:**

   ```powershell
   cd frontend
   npm run dev
   ```

3. **In another terminal:**

   ```powershell
   lt --port 3000
   ```

4. **Use the HTTPS URL provided** on your phone

### Option 4: Production Deployment

Deploy to a hosting service that provides HTTPS automatically:

- **Vercel** (recommended for Next.js)
- **Netlify**
- **Railway**
- **Heroku**

## Testing on Mobile

Once you have HTTPS set up:

1. **Open the HTTPS URL on your mobile device**
2. **Click "Use Camera"**
3. **Grant camera permissions when prompted**
4. **You should see the camera preview**
5. **Take a photo and it will auto-classify**

## Troubleshooting

### "Camera requires HTTPS connection" error

- Make sure you're accessing via `https://` not `http://`
- On localhost, both should work, but on mobile you need HTTPS

### Security warning when using self-signed certificates

- This is normal for development
- Click "Advanced" and proceed anyway
- For production, use proper SSL certificates

### Can't connect from phone

- Make sure your phone is on the same WiFi network as your PC
- Check your firewall isn't blocking the connection
- Try temporarily disabling Windows Firewall for testing

### Camera permission denied

- Check browser settings → Site permissions
- Try using Chrome or Safari on mobile
- Some browsers cache permission denials - try in Incognito/Private mode

## Backend API Note

The Flask backend API also needs to be accessible from your phone. You have two options:

### Option 1: Update Flask to accept connections from network

Edit `api/app.py`, at the bottom:

```python
app.run(host='0.0.0.0', port=5000, debug=True)
```

This is already set, so your backend should be accessible at `http://YOUR_PC_IP:5000`

### Option 2: Update frontend API proxy

In your Next.js app, you'll need to configure the API calls to point to your PC's IP address instead of localhost when testing on mobile.

Create/edit `frontend/next.config.js`:

```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: "http://YOUR_PC_IP:5000/:path*", // Replace with your PC's IP
      },
    ];
  },
};

module.exports = nextConfig;
```

Or use environment variables for flexibility.

## Recommended Setup for Mobile Testing

1. **Start backend with network access:**

   ```powershell
   cd api
   python app.py
   ```

2. **Start frontend with HTTPS:**

   ```powershell
   cd frontend
   npm run dev:https
   ```

3. **Configure your PC firewall** to allow connections on ports 3000 and 5000

4. **Access from phone:**
   - Frontend: `https://YOUR_PC_IP:3000`
   - Accept the security warning
   - Click "Use Camera"
   - Grant permissions
   - Test the camera feature!

## Why HTTPS is Required

Modern browsers enforce these security policies:

- **HTTP + Mobile = No camera access** (security restriction)
- **HTTPS + Mobile = Camera access allowed** (secure connection)
- **localhost = Always allowed** (development exception, works on PC)

This is why it works on your PC (accessing via localhost) but not on your phone (accessing via IP address over HTTP).

## Quick Command Reference

```powershell
# Start with experimental HTTPS (easiest)
cd frontend
npm run dev:https

# Start with ngrok
npm run dev  # In terminal 1
ngrok http 3000  # In terminal 2

# Find your PC's IP
ipconfig

# Start backend
cd api
python app.py
```

---

**Note:** For production deployment, always use proper HTTPS with valid SSL certificates from services like Let's Encrypt or your hosting provider.
