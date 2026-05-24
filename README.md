# thelogoless — Quiet Luxury Digital Experience (MERN Stack)

An ultra-premium, interactive digital experience for **thelogoless**, rebuilt with a modern **MERN stack** (MongoDB, Express, React, Node.js) and custom luxury components.

---

## 🏛 Architecture Overview

The project is structured into two main subdirectories:

1.  **`client/`** (Vite + React Single-Page Application):
    *   **Interactive T-Shirt Customizer**: Dynamic camera zoom focal points and custom SVG turbulence/density fabric shaders matching different materials.
    *   **Shopping Cart Drawer**: Slide-out cart with real-time price calculations, quantity adjustments, and custom synthesizer audio clicks.
    *   **Checkout & Order Modals**: Overlay form validating and executing purchases directly through backend API endpoints.
    *   **Split-Screen Cinematic Background**: Left pane featuring a man in a black hoodie and right pane featuring a woman in studio apparel.
    *   **Infinite Scrolling Brand philosophy marquee** and premium grid reveals.
2.  **`server/`** (Node.js + Express API Backend):
    *   **Dynamic Products API**: Serves item collections seeded directly on start.
    *   **Order Checkout Processing**: Processes and records customer order transactions.
    *   **Newsletter API**: Registers user subscriptions.
    *   **Smart Database Adaptability**: Automatically connects to MongoDB (local or via `.env` configuration). If MongoDB is unavailable, it gracefully defaults to a local JSON file-based database helper (`server/data/products.json`, etc.), making the app fully runnable out-of-the-box on any local environment.

---

## 🚀 Quick Start Guide

### 1. Start the Server Backend
Navigate to the `server` directory, install dependencies (if not done already), and start the server:
```bash
cd server
npm install
npm run start
```
The server will run on **`http://localhost:5001`**.

### 2. Start the Frontend Client
Open a new terminal, navigate to the `client` directory, install dependencies, and start the development server:
```bash
cd client
npm install
npm run dev
```
The Vite development server will run on **`http://localhost:5173`** (or next available port).

---

## 📂 Project Structure

```
thelogoless/
├── client/                     # Vite + React Frontend App
│   ├── public/                 # Static images, icons, and logo assets
│   └── src/
│       ├── App.jsx             # Main interactive application wrapper
│       ├── index.css           # Premium styling, animations, and theme variables
│       └── main.jsx            # React root injection
├── server/                     # Node.js + Express Backend Server
│   ├── data/                   # Fallback local JSON database files
│   └── server.js               # Express routes, schemas, and seeding logic
└── README.md                   # Setup guide
```

---

## 💎 Premium Design Notes

*   **System Cursors**: The custom laggy cursor rings have been completely removed in favor of standard, native browser cursors with optimized interactions.
*   **Audio Synthesis**: The website synthesizes organic wood-tick sounds dynamically using the browser's Web Audio API (can be muted in the navigation header).
*   **Responsive Framework**: Handcrafted media rules support ultra-widescreen, desktop, tablet, and mobile devices smoothly.
