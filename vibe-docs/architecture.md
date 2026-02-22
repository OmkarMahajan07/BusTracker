# VVCE Bus Tracker - System Architecture

## System Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           VVCE Bus Tracker System                           │
└─────────────────────────────────────────────────────────────────────────────┘

┌──────────────────────┐                              ┌──────────────────────┐
│   Driver Client      │                              │  Passenger Client    │
│   (React + Vite)     │                              │  (React + Vite)      │
├──────────────────────┤                              ├──────────────────────┤
│                      │                              │                      │
│  • Driver Login      │                              │  • Student Login     │
│  • Bus Selection     │                              │  • Bus Dashboard     │
│  • Google Maps       │                              │  • Google Maps       │
│  • GPS Tracking      │                              │  • Live Tracking     │
│  • Location Write    │                              │  • ETA Calculation   │
│                      │                              │  • Route Display     │
└──────────┬───────────┘                              └───────────┬──────────┘
           │                                                      │
           │ GPS Data (Write)                      Real-time Read │
           │ Every 3 seconds                       Live Updates   │
           │                                                      │
           ▼                                                      ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                          Firebase Services (Google Cloud)                   │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌─────────────────────────┐         ┌──────────────────────────────────┐  │
│  │  Firebase Auth          │         │  Firebase Realtime Database      │  │
│  ├─────────────────────────┤         ├──────────────────────────────────┤  │
│  │                         │         │                                  │  │
│  │ • Email/Password Auth   │         │  /buses                          │  │
│  │ • Driver Auth           │         │    ├─ BUS-101/                   │  │
│  │ • Student Auth          │         │    │   ├─ location/              │  │
│  │ • Session Management    │         │    │   │   ├─ lat: 12.xxxx       │  │
│  │                         │         │    │   │   ├─ lng: 76.xxxx       │  │
│  └─────────────────────────┘         │    │   │   ├─ speed: 45          │  │
│             │                        │    │   │   └─ updatedAt: timestamp│  │
│             │ Auth Tokens            │    │   └─ route: "route_key"     │  │
│             ▼                        │    ├─ BUS-102/                   │  │
│  ┌─────────────────────────┐         │    └─ BUS-103/                   │  │
│  │  Protected Routes       │         │                                  │  │
│  │  /driver, /passenger    │◄────────│  /routes                         │  │
│  └─────────────────────────┘         │    ├─ vvce_to_city_bus_stand/   │  │
│                                      │    │   ├─ name: "VVCE to City"   │  │
│                                      │    │   └─ stops: [...]           │  │
│                                      │    └─ city_bus_stand_to_vvce/    │  │
│                                      │                                  │  │
└──────────────────────────────────────┴──────────────────────────────────┴──┘
           │                                                      │
           │ Map API Requests                    Map API Requests │
           │                                                      │
           ▼                                                      ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                       Google Maps Platform (GCP)                            │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  • Maps JavaScript API    - Map rendering and display                      │
│  • Directions API         - Route paths and turn-by-turn directions        │
│  • Geocoding API          - Convert stop names to coordinates              │
│  • Distance Matrix API    - ETA calculations (optional)                    │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│                          Deployment Platform                                │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌────────────────────────────────────────────────────────────────────┐    │
│  │  Vercel Edge Network (CDN)                                         │    │
│  ├────────────────────────────────────────────────────────────────────┤    │
│  │                                                                    │    │
│  │  • Production: https://vvce-bus-tracker.vercel.app                 │    │
│  │  • Auto-deployment from Git (dev branch)                           │    │
│  │  • SPA routing (vercel.json rewrites)                             │    │
│  │  • Environment variables (VITE_*)                                  │    │
│  │  • Build Command: npm run build                                    │    │
│  │  • Output Directory: dist/                                         │    │
│  │  • Root Directory: frontend/                                       │    │
│  │                                                                    │    │
│  └────────────────────────────────────────────────────────────────────┘    │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Data Flow Architecture

### 1. GPS Data Flow
```
┌──────────────┐
│   Driver     │
│  Dashboard   │
└──────┬───────┘
       │
       │ 1. Click "Start Auto Tracking"
       │
       ▼
┌──────────────────────┐
│  Browser Geolocation │
│  API (Navigator)     │
└──────┬───────────────┘
       │
       │ 2. GPS Coordinates (lat, lng, speed)
       │    Updates every 3 seconds
       │
       ▼
┌──────────────────────┐
│  tracker.js service  │
│  startTracking()     │
└──────┬───────────────┘
       │
       │ 3. Write to Firebase
       │    Path: /buses/{busId}/location
       │
       ▼
┌──────────────────────────────┐
│  Firebase Realtime Database  │
│  {                           │
│    lat: 12.2958,            │
│    lng: 76.6394,            │
│    speed: 45,               │
│    updatedAt: timestamp     │
│  }                          │
└──────┬───────────────────────┘
       │
       │ 4. Real-time sync via WebSocket
       │    Firebase onValue() subscription
       │
       ▼
┌──────────────────────┐
│  Passenger Dashboard │
│  • Reads location    │
│  • Updates marker    │
│  • Recalculates ETA  │
└──────────────────────┘
```

### 2. Authentication Flow
```
┌─────────────┐                    ┌──────────────┐
│   Driver    │                    │   Student    │
│   Login     │                    │    Login     │
└──────┬──────┘                    └──────┬───────┘
       │                                  │
       │ Email + Password                 │ Email + Password
       │                                  │
       ▼                                  ▼
┌──────────────────────────────────────────────────┐
│        Firebase Authentication                   │
│  signInWithEmailAndPassword(email, password)     │
└──────┬───────────────────────────────────────────┘
       │
       │ Returns: User Token + UID
       │
       ▼
┌──────────────────────────────────────────────────┐
│        React Router Protected Routes             │
│  • ProtectedRoute checks auth state              │
│  • Redirects to login if not authenticated       │
└──────┬───────────────────────────────────────────┘
       │
       │ Authenticated Access
       │
       ▼
┌──────────────┐               ┌───────────────────┐
│   /driver    │               │   /passenger      │
│  Dashboard   │               │    Dashboard      │
└──────────────┘               └───────────────────┘
```

### 3. Real-time Update Mechanism
```
Component Mount
      │
      ▼
┌─────────────────────────────────────────┐
│  useEffect(() => {                      │
│    const ref = ref(db, 'buses/.../');   │
│    const unsubscribe = onValue(ref,...);│
│    return () => unsubscribe();          │
│  }, [busId]);                           │
└─────────────────────────────────────────┘
      │
      │ Establishes WebSocket connection
      │
      ▼
┌─────────────────────────────────────────┐
│    Firebase Realtime Database           │
│    • Persistent WebSocket connection    │
│    • Push-based updates                 │
│    • No polling required                │
└─────────────────────────────────────────┘
      │
      │ Data changes in database
      │
      ▼
┌─────────────────────────────────────────┐
│  onValue callback fires automatically   │
│  snapshot.val() contains new data       │
└─────────────────────────────────────────┘
      │
      │ State update triggers re-render
      │
      ▼
┌─────────────────────────────────────────┐
│  setBusLocation(newData)                │
│  • Map marker updates                   │
│  • Speed display updates                │
│  • Status indicator updates             │
└─────────────────────────────────────────┘
```

---

## Technical Explanation

### GPS Data Flow

**Driver Side (Write):**
1. Driver opens `/driver` dashboard and selects bus (101, 102, or 103)
2. Clicks "Start Auto Tracking" button
3. Browser requests GPS permission via `navigator.geolocation.watchPosition()`
4. GPS updates received every 3 seconds
5. `tracker.js` service writes to Firebase: `/buses/{busId}/location`
6. Data includes: latitude, longitude, speed, timestamp
7. Screen wake lock prevents phone from sleeping during tracking

**Passenger Side (Read):**
1. Passenger opens `/bus/{busNumber}` dashboard
2. React component subscribes to Firebase path: `/buses/{busId}/location`
3. Firebase establishes persistent WebSocket connection
4. Any location update from driver instantly pushes to passenger
5. Component updates map marker position in real-time
6. No polling - fully event-driven via Firebase `onValue()`

**Fallback Mechanism:**
- BUS-102 and BUS-103 automatically fall back to BUS-101's location if no dedicated driver

### Authentication Flow

**Sign-Up Process:**
1. Students/Drivers create accounts with email and password
2. Firebase Authentication stores user credentials securely
3. Passwords hashed with bcrypt (managed by Firebase)

**Sign-In Process:**
1. User submits email + password
2. `signInWithEmailAndPassword()` validates credentials
3. Firebase returns JWT token + user UID
4. Token stored in browser (sessionStorage/localStorage)
5. `auth.onAuthStateChanged()` listener maintains auth state

**Protected Routes:**
- `ProtectedRoute` component wraps sensitive routes
- Checks `auth.currentUser` before rendering
- Redirects to `/login` if unauthenticated
- Routes: `/driver`, `/passenger`, `/bus/:id`

### Real-time Update Mechanism

**Technology:** Firebase Realtime Database uses WebSocket protocol

**How it Works:**
1. **Client subscribes** using `onValue(ref, callback)`
2. **Firebase establishes** persistent WebSocket connection
3. **Server pushes** data changes instantly (< 100ms latency)
4. **No polling** - completely event-driven
5. **Automatic reconnection** if connection drops
6. **Offline support** - queues writes when offline

**Performance:**
- Updates delivered in ~50-100ms
- Scales to thousands of concurrent connections
- Efficient binary protocol (WebSocket)
- Client-side caching minimizes bandwidth

**Use Cases:**
- Live bus location tracking
- Real-time ETA updates
- Driver status (active/inactive)
- Multi-passenger simultaneous viewing

### Deployment Architecture

**Build Process:**
```bash
1. Developer pushes to GitHub (dev branch)
2. Vercel detects commit via webhook
3. Runs: npm install && npm run build
4. Vite bundles React app into dist/
5. Injects environment variables (VITE_*)
6. Deploys to Vercel Edge Network (CDN)
7. Available globally in < 2 minutes
```

**Environment Variables:**
```env
VITE_FIREBASE_API_KEY          # Firebase project API key
VITE_FIREBASE_AUTH_DOMAIN      # Authentication domain
VITE_FIREBASE_DATABASE_URL     # Realtime Database URL
VITE_FIREBASE_PROJECT_ID       # Firebase project ID
VITE_GOOGLE_MAPS_API_KEY       # Google Maps API key
```

**SPA Routing (vercel.json):**
```json
{
  "rewrites": [
    { "source": "/(.*)", "destination": "/" }
  ]
}
```
- All routes redirect to `index.html`
- React Router handles client-side routing
- Fixes 404 errors on page refresh

**CDN Distribution:**
- Static assets cached globally
- Served from nearest edge location
- < 50ms response time worldwide
- Automatic HTTPS with SSL certificates

---

## Technology Stack Summary

| Component | Technology | Purpose |
|-----------|-----------|---------|
| **Frontend Framework** | React 19 + Vite | UI components and build tooling |
| **Routing** | React Router v7 | Client-side navigation |
| **Authentication** | Firebase Auth | User management and security |
| **Database** | Firebase Realtime DB | Real-time GPS data storage |
| **Maps** | Google Maps API | Map rendering and directions |
| **Hosting** | Vercel | Global CDN deployment |
| **Styling** | Tailwind CSS | Utility-first styling |
| **Animations** | Framer Motion | Smooth UI transitions |

---

## System Characteristics

### Scalability
- **Firebase:** Handles 100,000+ concurrent connections
- **Vercel:** Auto-scales based on traffic
- **Google Maps:** Pay-per-use, no hard limits

### Performance
- **Page Load:** < 2 seconds (Vercel CDN)
- **GPS Update Latency:** < 100ms (Firebase WebSocket)
- **Map Rendering:** 60 FPS (Google Maps)

### Reliability
- **Uptime:** 99.9% (Firebase + Vercel SLAs)
- **Offline Support:** GPS data queued and synced when online
- **Auto-reconnection:** Firebase handles connection drops

### Security
- **Authentication:** JWT tokens with expiration
- **Database Rules:** (To be implemented) Role-based access
- **HTTPS:** All traffic encrypted (SSL)
- **API Keys:** Environment variables, not in source code

---

## Future Enhancements

1. **Firebase Security Rules:**
   - Drivers can only write to their assigned bus
   - Students can only read, not write

2. **Push Notifications:**
   - Firebase Cloud Messaging for bus arrival alerts

3. **Analytics:**
   - Firebase Analytics for usage tracking
   - Driver performance metrics

4. **Geofencing:**
   - Automatic ETA calculation when bus enters college vicinity

5. **Multi-college Support:**
   - Database sharding by college
   - Tenant isolation
