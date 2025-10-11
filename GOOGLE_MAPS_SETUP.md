# Google Maps Setup Guide for TraficDay

## ✅ Secure Implementation Complete!

Your Google Maps API key is now stored securely in **Firebase Remote Config** instead of being hardcoded in your source code.

---

## 📋 Setup Steps

### Step 1: Get Your Google Maps API Key

1. Go to [Google Cloud Console](https://console.cloud.google.com/)

2. **Create a New Project**:
   - Click "Select a Project" → "New Project"
   - Name it "TraficDay"
   - Click "Create"

3. **Enable Google Maps JavaScript API**:
   - Go to "APIs & Services" → "Library"
   - Search for "Maps JavaScript API"
   - Click "Enable"

4. **Create API Key**:
   - Go to "APIs & Services" → "Credentials"
   - Click "Create Credentials" → "API Key"
   - Copy the API key (e.g., `AIzaSyABC123...`)

5. **Restrict Your API Key** (Important!):
   - Click on the API key you just created
   - Under "Application restrictions":
     - Select "HTTP referrers"
     - Add: `https://traficday-91045.web.app/*`
     - Add: `https://traficday-91045.firebaseapp.com/*`
     - Add for local testing: `http://localhost:*`
   - Under "API restrictions":
     - Select "Restrict key"
     - Check "Maps JavaScript API"
   - Click "Save"

---

### Step 2: Add API Key to Firebase Remote Config

1. Go to [Firebase Console](https://console.firebase.google.com/)

2. Select your project: **TraficDay**

3. Go to **"Remote Config"** (in the left sidebar under "Engage")

4. Click **"Add parameter"**

5. Configure the parameter:
   - **Parameter key**: `google_maps_api_key`
   - **Default value**: Paste your Google Maps API key
   - **Description**: "Google Maps JavaScript API key"

6. Click **"Publish changes"** (top right button)

---

### Step 3: Deploy Your App

```bash
firebase deploy --only hosting
```

---

## 🔒 Security Features

✅ **API key is NOT in source code** - Safe to commit to Git
✅ **Stored in Firebase Remote Config** - Can be changed without redeploying
✅ **API key restrictions active** - Only works on your domains
✅ **1-hour cache** - Reduces Remote Config reads
✅ **Error handling** - Graceful fallback if key is missing

---

## 🧪 Testing

After deploying, open your app and check the browser console:

Expected logs:
```
✅ Config module loaded
✅ Google Maps API script injected
✅ Google Maps API loaded
✅ Google Map initialisée
✅ Google Maps traffic layer ajouté
```

---

## 💰 Cost Monitoring

1. Go to [Google Cloud Console → Billing](https://console.cloud.google.com/billing)
2. Set up a **Budget Alert**:
   - Set budget: $20/month (way above free tier)
   - Get email when 50%, 75%, 90%, 100% of budget is used

**Free Tier**: $200/month credit = ~28,571 map loads
For a Côte d'Ivoire app, you'll likely stay free!

---

## 🐛 Troubleshooting

### "Erreur: Clé API Google Maps non configurée"
- ✅ Check Firebase Remote Config has `google_maps_api_key` parameter
- ✅ Check parameter is published (not in draft)
- ✅ Wait 5 minutes for Remote Config to propagate

### "This API project is not authorized to use this API"
- ✅ Make sure "Maps JavaScript API" is enabled in Google Cloud Console
- ✅ Check API key restrictions allow your domain

### Traffic layer doesn't show colors
- ⚠️ Google Maps traffic data may be limited in Côte d'Ivoire
- ✅ Try testing in Paris, New York, or major cities first
- ✅ Check if traffic layer is actually enabled (green line in console)

---

## 📝 Important Notes

1. **Never commit API keys to Git** - They're now in Firebase Remote Config ✅
2. **Always restrict API keys** to prevent unauthorized use ✅
3. **Monitor usage** in Google Cloud Console regularly
4. **Update Remote Config** to change key without redeploying

---

## 🎉 What's Next?

Once setup is complete, your traffic layer will show:
- 🟢 **Green roads** = Fluid traffic
- 🟡 **Yellow roads** = Moderate traffic
- 🟠 **Orange roads** = Heavy traffic
- 🔴 **Red roads** = Very heavy traffic / stopped

Just like Google Maps! 🗺️
