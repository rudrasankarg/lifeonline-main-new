# Firebase Firestore Usage in LifeOnLine Codebase

Firebase Firestore acts as the central real-time database and signaling layer connecting the patient mobile application (`frontend`) and the doctor web portal (`frontend-web`). 

## Key Files
- `frontend-web/src/lib/firebase.js` & `frontend/src/services/firebase.js` (Initializations)
- `frontend-web/src/contexts/AuthContext.js` (Doctor Presence)
- `frontend-web/src/components/DashboardHome.js` (Session queue query)
- `frontend-web/src/components/VideoCallRoom.js` (WebRTC Signaling)
- `backend/src/config/firebase.js` (Admin SDK setup)

## Implementation Areas

### 1. Initialization and Setup
- **Web (`frontend-web`)**: Initializes Firestore natively with `getFirestore(app)`.
- **Mobile (`frontend`)**: Due to networking constraints in React Native, Firestore is initialized with `experimentalForceLongPolling: true` and `useFetchStreams: false` to ensure real-time reliability over unstable cellular networks.
- **Backend (`backend`)**: Uses the `firebase-admin` SDK with credentials passed individually via environment variables. It has a robust fallback that creates an in-memory mock store if Firebase credentials aren't provided, ensuring local development doesn't break.

### 2. Real-Time Presence System
Firestore is utilized to maintain the "online/offline" status of doctors.
- In `AuthContext.js`, an authenticated doctor updates their document in the `doctorPresence` collection with `available: true` and `lastSeenAt: serverTimestamp()`.
- This fires initially on sign-in and every 30 seconds via a heartbeat interval.

### 3. Session and Queue Management
The `sessions` collection coordinates the core functionality: routing patients to doctors.
- In `DashboardHome.js`, the app sets up a real-time snapshot listener using `onSnapshot` on the `sessions` collection, filtering by `doctorId`. 
- This automatically populates the doctor's active patient queue without manual refreshes.

### 4. WebRTC Signaling Server
Firestore eliminates the need for a dedicated WebSocket server by handling the WebRTC handshake natively. In `VideoCallRoom.js` (and its patient-side equivalent):
1. **Offer/Answer Handshake**: The doctor creates a WebRTC `offer` and sets it in the `sessions/{sessionId}` document. A listener waits for the patient to write their `answer` into the same document.
2. **ICE Candidates**: Network routing information (ICE Candidates) is synced via subcollections. 
   - The doctor writes to `sessions/{sessionId}/doctorCandidates`.
   - The doctor listens for new docs on `sessions/{sessionId}/patientCandidates`.
3. **Session State**: Connection statuses like `ringing`, `connecting`, `connected`, and `completed` are updated in the document, keeping UI states synchronized between both endpoints instantaneously.
