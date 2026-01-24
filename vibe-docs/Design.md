# Design Document: College Bus Tracker (eBuseo Style)

## 1. Design Philosophy & "Vibe"
Based on the "eBuseo" concept, the UI should feel **modern, eco-friendly, and professional**. It balances high-contrast functional elements (for drivers) with clean data visualization (for passengers).

### Color Palette (Electromobility Theme)
- **Primary (Brand):** `#00C896` (Mint Teal) - Represents active status/eco-friendly.
- **Secondary (UI):** `#1F2937` (Dark Navy/Charcoal) - Used for headers and primary buttons.
- **Background:** `#F9FAFB` (Off-White) - Clean background for readability.
- **Accents:**
  - **Status Active:** `#10B981` (Vibrant Green)
  - **Status Inactive:** `#EF4444` (Soft Red)
  - **Map Markers:** Blue for User, Bus Icon for Vehicle.

### Typography
- **Font Family:** 'Inter', sans-serif (Google Fonts).
- **Weights:**
  - **Headers:** 700 (Bold) - Clean and authoritative.
  - **Body:** 400 (Regular) - High readability.

### UI Components (Glass & Cards)
- **Cards:** White backgrounds with soft shadows (`box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1)`).
- **Buttons:** Pill-shaped (rounded-full) for primary actions. Large touch targets (min 48px height).
- **Map Overlay:** Floating cards with rounded top corners (Bottom Sheet style).

---

## 2. Page-by-Page Design Specs

### Page 1: Role Selection (The "Gateway")
*A clean, welcoming entry point similar to the eBuseo splash screen.*
- **Layout:** Centered Flexbox layout.
- **Elements:**
  1.  **Logo:** "CampusMove" (Text + Simple Bus Icon) in Dark Navy.
  2.  **Headline:** "Real-Time Campus Transit" (H2, Dark Gray).
  3.  **Action Cards (2):**
      - **Driver Card:** White card, "I am a Driver" text, Bus Icon. *Hover effect: Border turns Teal.*
      - **Student Card:** White card, "I am a Student" text, User Icon. *Hover effect: Border turns Blue.*

### Page 2: Driver Dashboard (The "Command Center")
*Focus on high-contrast visibility and large buttons for safety while driving.*
- **Header:**
  - Left: "Bus #1" (Bold).
  - Right: "⚫ Offline" (Grey) or "🟢 Live" (Green) status badge.
- **Main Area:**
  - **Status Indicator:** A large central ring. When active, it pulses with a Teal glow (CSS Keyframe animation).
  - **Primary Action:** A massive toggle button: "START SHIFT" (Teal) / "END SHIFT" (Red).
  - **Data Cards:** Simple row showing "Speed: 35 km/h" and "GPS Accuracy: High".
- **Footer:** "Keep screen active" toggle (Small text).

### Page 3: Passenger Map View (The "Tracker")
*Map-centric interface with floating overlays.*
- **Background:** Full-screen Google Map.
- **Map Elements:**
  - **Bus Marker:** Custom SVG icon (Bus shape) in Teal.
  - **User Marker:** Blue Dot (Current location).
  - **Route Line:** Polyline in Blue/Grey.
- **Bottom Sheet (Floating Panel):**
  - **Initial State:** Visible bottom card (height: 200px).
  - **Content:**
    - **Header:** "College Bus (Route A)"
    - **Big Stat:** "Arriving in **5 mins**" (Large Typography).
    - **Details:** "Next Stop: Library" | "Distance: 1.2km".
  - **Style:** White background, top-left/top-right radius 24px, heavy shadow.

---

## 3. CSS/Tailwind Guidance for AI
- Use `backdrop-blur-md` for floating map panels.
- Use `animate-pulse` for the Driver's active status ring.
- Use `h-screen` and `w-screen` to ensure mobile responsiveness.
- **Icons:** Use `lucide-react` (Bus, MapPin, Navigation, User).

### Page 4: Route Selection & Schedule (The "Timetable")
*A clean list view for students to find their specific bus before tracking it.*

- **Layout:** Vertical Stack (List View).
- **Header:**
  - Title: "All Routes" (Bold H2).
  - Filter: Simple horizontal scroll pills: [All] [Hostel] [City] [Campus].
- **List Cards (Route Item):**
  - **Container:** White card, rounded-xl, soft shadow.
  - **Left Side:** - Route Badge: "Route A" (Teal Background, White Text).
    - Destination: "To Central Library".
  - **Right Side:**
    - Live Status: "🟢 Moving" or "🔴 Stopped".
    - ETA: "5 min" (Bold).
  - **Interaction:** Tap card -> Navigates to **Page 3 (Map View)** focused on that bus.

### Component Design Details (For AI)
- **Route Badge:** Use a small rounded rectangle with `bg-teal-500` text-white.
- **Navigation:** Use a "Chevron Right" icon (`>` arrow) on the right edge of each card to indicate clickability.
- **Empty State:** If no buses are running, show a "Sleeping Bus" illustration with text "No active trips right now."