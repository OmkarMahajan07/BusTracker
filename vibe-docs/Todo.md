# Real-Time College Bus Tracking System
## Vibe Coding Task List
*Note for AI Agent: Execute exactly ONE task at a time. Verify before moving next.*

### 🔹 SECTION 1: Project & Tooling Setup
- [ ] **Task 1: Initialize Project Repository**
  - [ ] Initialize git repository (`git init`).
  - [ ] Create root folders: `src/`, `public/`, `vibe-docs/`.
  - [ ] Add initial `README.md`.
  - [ ] Commit project skeleton.

- [ ] **Task 2: Create Documentation Context**
  - [ ] Create `vibe-docs/PRD.md` (Paste locked content).
  - [ ] Create `vibe-docs/DESIGN.md` (Paste locked content).
  - [ ] Create `vibe-docs/TECH_STACK.md` (Paste locked content).
  - [ ] Commit documentation files.

### 🔹 SECTION 2: Firebase Configuration
- [ ] **Task 3: Firebase Project Setup (MANUAL)**
  - [ ] Create Firebase project in Console.
  - [ ] Enable **Realtime Database** (Test mode).
  - [ ] Enable **Authentication** (Email/Password).
  - [ ] Save API Keys for Task 6.

- [ ] **Task 4: Define Data Structure**
  - [ ] Create `db-seed.json` with 1 Bus (`bus1`) and 1 Route (`routeA`).
  - [ ] (MANUAL) Import JSON to Realtime Database.
  - [ ] Commit the seed file.

### 🔹 SECTION 3: Frontend Bootstrapping
- [ ] **Task 5: Initialize React Application**
  - [ ] Create Vite app: `npm create vite@latest . -- --template react`.
  - [ ] Install deps: `npm install firebase react-router-dom lucide-react`.
  - [ ] Install Map deps: `npm install @vis.gl/react-google-maps`.
  - [ ] Install Wake Lock: `npm install react-screen-wake-lock`.
  - [ ] Verify app runs locally (`npm run dev`).

- [ ] **Task 6: Configure Firebase SDK**
  - [ ] Create `src/services/firebase.js`.
  - [ ] Initialize Firebase App using environment variables.
  - [ ] Export `auth` and `database` instances.
  - [ ] Create a test button in `App.jsx` to log "Connected" to console.

### 🔹 SECTION 4: Authentication & Routing
- [ ] **Task 7: Build Login UI**
  - [ ] Create `src/pages/Login.jsx`.
  - [ ] Add Inputs: Email, Password.
  - [ ] Add Radio Group: Role (Driver / Passenger).
  - [ ] Add "Sign In" Button.

- [ ] **Task 8: Implement Authentication**
  - [ ] Create `src/contexts/AuthContext.jsx`.
  - [ ] Implement `login(email, password)`.
  - [ ] Persist User state across reloads.

- [ ] **Task 9: Role-Based Routing**
  - [ ] Configure `react-router-dom` in `App.jsx`.
  - [ ] Create `/driver` route (Protected).
  - [ ] Create `/passenger` route (Protected).
  - [ ] Implement redirect logic based on Role.

### 🔹 SECTION 5: Driver Dashboard (GPS WRITE PATH)
- [ ] **Task 10: Build Driver Layout**
  - [ ] Create `src/pages/Driver.jsx`.
  - [ ] Add Header (Bus ID).
  - [ ] Add Status Ring (Active/Inactive).
  - [ ] Add Big Toggle Button (Start/Stop).

- [ ] **Task 11: Integrate Maps (Driver)**
  - [ ] Load Google Maps API in `Driver.jsx`.
  - [ ] Center map on current location.
  - [ ] Add a Marker representing the Bus.

- [ ] **Task 12: Implement GPS Tracking**
  - [ ] Create `src/services/tracker.js`.
  - [ ] Use `navigator.geolocation.watchPosition`.
  - [ ] Console log `{ lat, lng, speed }` updates.

- [ ] **Task 13: Screen Wake Lock (CRITICAL)**
  - [ ] Implement `useScreenWakeLock` in `Driver.jsx`.
  - [ ] Activate lock when Trip starts.
  - [ ] Release lock when Trip ends.

- [ ] **Task 14: Push Live Data to Firebase**
  - [ ] Update `tracker.js` to write to `buses/{busId}/location`.
  - [ ] Test: Start trip, move phone, check Firebase Console.

### 🔹 SECTION 6: Passenger Dashboard (READ PATH)
- [ ] **Task 15: Build Route List**
  - [ ] Create `src/pages/RouteList.jsx`.
  - [ ] Fetch active routes from Firebase.
  - [ ] Link to Passenger Map.

- [ ] **Task 16: Build Passenger Layout**
  - [ ] Create `src/pages/Passenger.jsx`.
  - [ ] Add Map Container (Full Screen).
  - [ ] Add Bottom Info Card (Bus Name, ETA).

- [ ] **Task 17: Subscribe to Location**
  - [ ] Use `onValue` to listen to `buses/{busId}/location`.
  - [ ] Update React State with new coordinates.

- [ ] **Task 18: Render Live Bus Marker**
  - [ ] Place Custom SVG Marker on Map.
  - [ ] Update position when State changes.
  - [ ] (Optional) Add CSS transition for smoothness.

### 🔹 SECTION 7: ETA & Logic
- [ ] **Task 19: Distance Calculation**
  - [ ] Create `src/utils/math.js`.
  - [ ] Implement Haversine formula (Distance between 2 points).

- [ ] **Task 20: Compute ETA**
  - [ ] Logic: `Distance / Speed (avg 30km/h)`.
  - [ ] Update Info Card with "X Mins Away".

### 🔹 SECTION 8: Polish & Reliability
- [ ] **Task 21: Handle GPS Errors**
  - [ ] Add Toast/Alert if GPS permission denied.
  - [ ] Add "Reconnecting..." badge if internet drops.

- [ ] **Task 22: Responsive Checks**
  - [ ] Verify Driver Button size on Mobile.
  - [ ] Verify Passenger Map height on Mobile.

### 🔹 SECTION 9: Testing & Demo Prep
- [ ] **Task 23: Hardcode Demo Route**
  - [ ] Create `src/utils/constants.js`.
  - [ ] Add "Campus Route" with real Lat/Lngs from your college.

- [ ] **Task 24: End-to-End Test**
  - [ ] Open Driver on Phone (4G).
  - [ ] Open Passenger on Laptop (WiFi).
  - [ ] Verify Marker moves when Phone moves.

### 🔹 SECTION 10: Deployment
- [ ] **Task 25: Build Production Bundle**
  - [ ] Run `npm run build`.
  - [ ] Verify `dist/` folder created.

- [ ] **Task 26: Deploy**
  - [ ] Deploy to Netlify/Vercel.
  - [ ] Add Production URL to Firebase "Authorized Domains".

### 🔹 SECTION 11: Documentation (Paper)
- [ ] **Task 27: Architecture Diagram**
  - [ ] Draw "Driver -> Firebase -> Passenger" flow.
- [ ] **Task 28: README Update**
  - [ ] Add "How to Run" steps.