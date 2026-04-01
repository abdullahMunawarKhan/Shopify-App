# Technical Implementation Reference: CartPlugin

This document provides a technical overview of how the **Cart Recovery & COD Confirmation** systems are implemented. This can be used by AI agents to understand the project's architecture and suggest optimizations or new features.

## 🏗️ Core Technology Stack
*   **Frontend Framework**: [React Router v7](https://reactrouter.com/) (adapted from the Shopify Remix template).
*   **Styling**: [Shopify Polaris v13+](https://polaris.shopify.com/) for Admin UI; Vanilla CSS for Storefront extensions.
*   **Database & ORM**: [Prisma](https://www.prisma.io/) with an **SQLite** database (`dev.sqlite`).
*   **Integration**: [Shopify App Bridge v4](https://shopify.dev/docs/api/app-bridge-library) for seamless embedded app interaction.
*   **UI Components**: Mix of standard Polaris components and **Shopify Web Components** (e.g., `s-page`, `s-app-nav`) for deep admin integration.

## 📦 Database Schema (Prisma)
### `Lead` Model
*   **Purpose**: Stores captured emails and abandonment data.
*   **Fields**: `id`, `shop`, `email`, `capturedAt`, `lastReminderSent`, `status` (PENDING/CONVERTED), `cartData` (holds the full cart object as a JSON string), `consent` (Boolean).
*   **Indexing**: Composite index on `[shop, email]` for fast retrieval.

### `EmailTemplate` Model
*   **Purpose**: Stores reusable reminder email bodies.
*   **Fields**: `id`, `shop`, `name`, `subject`, `body` (HTML/Text content with Liquid-style placeholders).
*   **Indexing**: Single index on `[shop]` to scope templates.

## 🚀 Storefront Integration (Theme App Extension)
Implemented via a dedicated **Theme App Extension** located in `/extensions/cart-reminder/`.
*   **`reminder_popup.liquid`**: An app block that injects the popup UI into the storefront. Uses Liquid settings for store-admin customization (delay, colors, etc.).
*   **`reminder.js`**: 
    1.  Listens for page load and triggers a `setTimeout`.
    2.  Uses the native Shopify AJAX API (`fetch('/cart.js')`) to retrieve session cart data.
    3.  Captures visitor email and GDPR consent via a custom form.
    4.  Transmits `email` + `cartData` to the app backend via an **App Proxy** to avoid CORS issues and maintain security.
*   **`reminder.css`**: Uses fixed-position overlays and standard keyframe animations for a premium appearance.

## 🛠️ Backend Architecture (App Proxy)
*   **URL Prefix**: `/apps`.
*   **Subpath**: `cart-reminder`.
*   **Route**: `app/routes/api.proxy.capture.jsx`.
*   **Authentication**: Uses `shopify.authenticate.public.appProxy(request)` to verify the Shopify HMAC signature on every storefront request, ensuring data integrity.
*   **Action Handling**: Parses incoming JSON, creates a new `Lead` entry in the database, and returns a `Response.json({ success: true })`.

## 🖼️ Admin Dashboard UI
*   **Navigation**: Employs `s-app-nav` and `s-link` Web Components in `app/routes/app.jsx` for persistent navigation within the Shopify admin iframe.
*   **Dashboard**: The `app._index.jsx` uses `s-page` and `s-section` to provide a native-feeling Shopify dashboard with real-time stats (Total Leads, Pending Reminders).
*   **Data Flow**: 
    *   **Loaders**: All data-fetching is handled via Prisma in asynchronous loaders returning **`Response.json()`**.
    *   **Actions**: Template management and manual reminder triggers use standard React Router `Form` submissions for state management and toast notifications.

## 🎯 Extension Point Ideas for Other AI Agents
1.  **AI-Generated Subject Lines**: Use OpenAI/Gemini to analyze `cartData` and generate hyper-personalized email subject lines.
2.  **Multichannel Reminders**: Add Twilio or WhatsApp API support based on `lastReminderSent` timestamps.
3.  **Exit Intent Detection**: Modify `reminder.js` to trigger the popup specifically when the mouse leaves the viewport.
4.  **Automatic Reminders**: Implement a **CRON job** (via Background Tasks) to scan the `Lead` table for `PENDING` items that haven't been responded to in X hours.
5.  **A/B Testing**: Support multiple templates per shop to compare capture/conversion rates.

---
*Last updated on April 2, 2026*
