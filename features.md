# Shopify App Features: CartPlugin & COD Confirmation

This document serves as a reference for all currently implemented features in this Shopify application.

## 🛒 Cart Recovery & Lead Generation (New)
*   **Storefront Email Capture**: A non-intrusive popup on the storefront that triggers when a visitor has items in their cart but hasn't checked out yet.
*   **Intelligent Delay**: Configurable appearance timer (default 10s) to wait for buyer intent before showing the popup.
*   **Privacy & GDPR Compliance**: Integrated consent checkbox for privacy policy agreement before capturing data.
*   **Smart Session Dismissal**: Uses local storage to ensure the popup doesn't reappear once dismissed or after a successful' capture in a single session.
*   **Lead Dashboard**: A dedicated management area to view all captured emails, their cart contents (items + total price), and the capture timestamp.
*   **Conversion Tracking**: Real-time status badges for leads (PENDING vs. CONVERTED) to help administrators prioritize follow-ups.
*   **Reminder Template Engine**: Full management of email templates with support for dynamic placeholders like `{{ email }}`, `{{ cart_url }}` and `{{ shop }}`.
*   **Manual Reminder Triggering**: Ability for administrators to manually trigger reminder flows directly from the lead list with instant feedback (toast notifications).

## ✅ COD (Cash on Delivery) Confirmation
*   **Automated Order Verification**: Automatically marks specific COD orders as "Unconfirmed" to prevent immediate processing of high-risk orders.
*   **Custom Confirmation Window**: Define a specific time window (e.g., 30 minutes) during which a customer must verify their order.
*   **Minimum Order Threshold**: Trigger the verification flow only for orders above a specific value (e.g., ₹499) to optimize workflow.
*   **1-Click Confirmation UI**: Seamless customer experience where they can confirm or cancel their order via a simple, mobile-friendly interface.
*   **RTO (Return to Origin) Mitigation**: Core logic designed to filter out non-serious buyers and reduce logistics losses.

## 🛠️ App Management & Dashboard
*   **Unified Admin Dashboard**: A customized overview (using Shopify App Bridge components) showing live statistics for captured leads and pending reminders.
*   **Centralized Settings**: A one-stop settings page for configuring COD logic and quick access to Cart Recovery tools.
*   **Smart Navigation**: Integrated sidebar navigation (`s-app-nav`) for seamless switching between Leads, Templates, and Settings.
*   **Storefront Extension**: Built using **Shopify Theme App Extensions**, ensuring the app remains lightning-fast and compatible with all Online Store 2.0 themes.

---
*Last updated on April 2, 2026*

