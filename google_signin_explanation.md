# Google Sign-In Usage in LifeOnLine Codebase

Google Sign-In is integrated to provide a secure and straightforward authentication mechanism for doctors accessing the `frontend-web` portal. This implementation is handled via the Firebase Authentication service using the Web SDK.

## Key Files
- `frontend-web/src/lib/firebase.js`
- `frontend-web/src/contexts/AuthContext.js`

## Implementation Details

### 1. Initialization and Configuration
In `frontend-web/src/lib/firebase.js`, Firebase Auth is initialized and the Google Auth Provider is instantiated:
```javascript
import { getAuth, GoogleAuthProvider } from 'firebase/auth';

export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

// Request the user's email and profile scopes
googleProvider.addScope('email');
googleProvider.addScope('profile');
```

### 2. Sign-In Flow
The sign-in logic is encapsulated within `AuthContext.js` providing a context hook `useAuth()` to the rest of the application. The primary sign-in action uses a popup:
```javascript
const result = await signInWithPopup(auth, googleProvider);
const email  = result.user.email;
```

### 3. Authorization (Whitelist System)
The application employs an environment-variable-based whitelist to restrict access. Since this is a portal meant exclusively for doctors, not every Google account is allowed:
- It checks `process.env.NEXT_PUBLIC_ALLOWED_DOCTOR_EMAILS`.
- If the signed-in user's email is not in the whitelist, the application automatically signs the user out and throws an `ACCESS_DENIED` error.

### 4. Auth State and Heartbeat
The authentication context sets up an `onAuthStateChanged` listener to track the user's session globally. Once signed in, it actively communicates with Firestore to update the doctor's "presence" (online status):
- An interval sends a heartbeat every 30 seconds to the `doctorPresence` collection.
- When the doctor logs out via the `signOut` function, the application forcefully updates the presence document to mark the doctor as offline before destroying the session.

### 5. Backend Mocking
While the frontend heavily relies on Firebase, the backend (`backend/src/controllers/auth.controller.js`) contains placeholder logic prepared to accept and verify Firebase `idToken`s via `admin.auth().verifyIdToken(idToken)` for authenticated API requests.
