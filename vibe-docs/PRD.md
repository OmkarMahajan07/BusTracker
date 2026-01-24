# Product Requirements Document (PRD)
## Project Name
Web-Based Real-Time College Bus Tracking System

## Core Objective
Build a web application that allows college bus drivers to broadcast their real-time location and enables students to view bus locations and Estimated Time of Arrival (ETA) on a map.

## User Roles
1. **Driver**:
   - Log in using a predefined ID (e.g., "BUS-01").
   - Click "Start Trip" to begin broadcasting GPS coordinates.
   - Screen must stay awake (Wake Lock) to ensure continuous tracking.
   - Click "End Trip" to stop tracking.

2. **Passenger (Student)**:
   - View a live map showing the bus icon moving in real-time.
   - See the current status (Moving/Stopped).
   - View simple ETA (e.g., "5 mins away") based on distance.

## Functional Requirements
- **Real-Time Sync**: Latency must be under 3 seconds using Firebase Realtime Database.
- **Maps**: Google Maps JavaScript API for rendering.
- **GPS**: HTML5 Geolocation API (`navigator.geolocation.watchPosition`).
- **Device Support**: Must work on Mobile Chrome (Driver) and Desktop/Mobile (Passenger).

## Non-Functional Requirements
- **Simplicity**: No complex admin panels. Hardcoded routes are acceptable.
- **Reliability**: Auto-reconnect if internet drops.