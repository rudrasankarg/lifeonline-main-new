# LifeLine AI 🚑

> A production-ready mobile healthcare emergency app built with React Native (Expo), Node.js/Express, Firebase Firestore, and Google Gemini AI.

---

## 📁 Project Structure

```
Project/
├── backend/
│   ├── src/
│   │   ├── config/
│   │   │   └── firebase.js          # Firebase Admin SDK init + mock store
│   │   ├── controllers/
│   │   │   ├── auth.controller.js
│   │   │   ├── sos.controller.js
│   │   │   ├── chat.controller.js
│   │   │   ├── analyze.controller.js
│   │   │   ├── doctor.controller.js
│   │   │   └── session.controller.js
│   │   ├── routes/
│   │   │   ├── auth.routes.js
│   │   │   ├── sos.routes.js
│   │   │   ├── chat.routes.js
│   │   │   ├── analyze.routes.js
│   │   │   ├── doctor.routes.js
│   │   │   └── session.routes.js
│   │   ├── services/
│   │   │   ├── gemini.service.js    # Google Gemini AI integration
│   │   │   ├── sos.service.js       # Emergency event management
│   │   │   ├── doctor.service.js    # Doctor DB + matching
│   │   │   └── session.service.js   # Video session management
│   │   └── server.js                # Express entry point
│   ├── .env                         # ← fill in your API keys
│   └── package.json
│
└── frontend/
    ├── src/
    │   ├── screens/
    │   │   ├── HomeScreen.js         # SOS + quick actions
    │   │   ├── ChatScreen.js         # AI health chatbot
    │   │   ├── SymptomsScreen.js     # Symptom checker + triage
    │   │   ├── DoctorScreen.js       # Doctor recommendation
    │   │   └── VideoCallScreen.js    # Video consultation UI
    │   ├── services/
    │   │   └── api.js               # Axios API client
    │   └── theme/
    │       └── index.js             # Design tokens
    ├── App.js                        # Navigation root
    └── app.json
```

---

## 🚀 Quick Start

### 1. Backend Setup

```bash
cd backend

# Install dependencies
npm install

# Copy environment file and fill in your keys
copy .env.example .env
```

Edit `backend/.env`:
```env
PORT=5000
GEMINI_API_KEY=your_gemini_api_key_here
FIREBASE_SERVICE_ACCOUNT_PATH=./serviceAccountKey.json   # optional
NODE_ENV=development
```

Start the backend:
```bash
npm run dev        # with hot reload (nodemon)
# or
npm start          # production
```

Backend runs at: `http://localhost:5000`

---

### 2. Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Start Expo dev server
npm start
```

Open in Expo Go app or an emulator.

**⚠️ Important:** If testing on a physical device, update `frontend/src/services/api.js`:
```js
const BASE_URL = 'http://YOUR_LOCAL_IP:5000';
// e.g. 'http://192.168.1.42:5000'
```

---

## 🔑 API Keys & Firebase

### Google Gemini API Key
1. Go to [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Create a new API key
3. Add to `backend/.env` as `GEMINI_API_KEY`

### Firebase Setup (Optional – has in-memory mock)
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Create a new project
3. Enable **Firestore Database** and **Authentication** (Phone/Email)
4. Go to Project Settings → Service Accounts → Generate new private key
5. Save as `backend/serviceAccountKey.json`
6. Set `FIREBASE_SERVICE_ACCOUNT_PATH=./serviceAccountKey.json` in `.env`

> **Without Firebase:** The app works with an in-memory mock store for local development. All data is stored in RAM.

---

## 📡 API Endpoints

| Method | Route | Description |
|--------|-------|-------------|
| `GET` | `/health` | Health check |
| `POST` | `/auth` | Login / authenticate |
| `POST` | `/sos` | Trigger SOS emergency |
| `POST` | `/chat` | AI health chatbot |
| `POST` | `/analyze` | Symptom triage (AI) |
| `GET` | `/doctor/match?department=X` | Match available doctor |
| `POST` | `/session/create` | Create video call session |

### Example Requests

**POST /chat**
```json
{
  "message": "I have a severe headache and blurry vision",
  "history": []
}
```

**POST /analyze**
```json
{
  "symptoms": "chest pain radiating to left arm, sweating"
}
```

**POST /sos**
```json
{
  "userId": "user123",
  "location": { "latitude": 28.6139, "longitude": 77.2090 },
  "emergencyContacts": [{ "name": "Mom", "phone": "+91-9999999999" }]
}
```

---

## 📱 App Screens

| Screen | Description |
|--------|-------------|
| **Home** | SOS button (calls 108), quick action cards |
| **Chat** | WhatsApp-style AI health chatbot |
| **Symptoms** | Symptom input + AI severity analysis with color coding |
| **Doctor** | AI-matched doctor card + video call CTA |
| **Video Call** | Mock consultation UI with mute/camera controls + timer |

---

## 🎨 Features

- 🆘 **SOS Button** – Animated pulsing red button, fetches GPS, calls 108
- 🤖 **AI Chatbot** – Gemini-powered, health-only responses
- 🩺 **Triage AI** – Severity scoring: 🟢 Low → 🟡 Medium → 🔴 High
- 👨‍⚕️ **Doctor Matching** – Firestore-backed doctor DB with specialty filter
- 📹 **Video Call UI** – Mock WebRTC session with timer, mute, end call
- 🌙 **Dark Theme** – Premium deep purple/black design system
- ⚡ **Loading States** – All async operations show proper loading UI
- 🛡️ **Error Handling** – Graceful fallbacks on all API failures

---

## 🛡️ Security Notes

- Never commit `.env` or `serviceAccountKey.json` to version control
- Add both to `.gitignore`
- The mock in-memory store is **development only** — use Firebase in production
- Replace mock JWT tokens with real Firebase Auth verification before deployment

---

## 🚀 Production Checklist

- [ ] Replace `GEMINI_API_KEY` with real key
- [ ] Set up Firebase project + add `serviceAccountKey.json`
- [ ] Update `BASE_URL` in `api.js` to deployed backend URL
- [ ] Integrate real Agora/WebRTC SDK for live video
- [ ] Add real SMS/FCM notifications for SOS contacts
- [ ] Add Firebase Auth phone verification
- [ ] Deploy backend to Railway / Render / Cloud Run
"# lifeonline" 
