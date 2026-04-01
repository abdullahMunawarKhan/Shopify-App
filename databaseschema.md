# Database Schema (Prisma)

This document tracks the current database models and their fields to maintain clear communication between the app's developers and systems.

## 👤 Session
Standard Shopify session management with added fields for enhanced security and identity.
*   `id`: String (@id)
*   `shop`: String
*   `state`: String
*   `isOnline`: Boolean (Default: false)
*   `scope`: String?
*   `expires`: DateTime?
*   `accessToken`: String
*   `userId`: BigInt?
*   `firstName`: String?
*   `lastName`: String?
*   `email`: String?
*   `accountOwner`: Boolean (Default: false)
*   `locale`: String?
*   `collaborator`: Boolean? (Default: false)
*   `emailVerified`: Boolean? (Default: false)
*   `refreshToken`: String?
*   `refreshTokenExpires`: DateTime?

---

## ⚙️ ShopSettings
Configurations for both the COD Confirmation system and the Cart Recovery system.
*   `id`: Int (@id, autoincrement)
*   `shop`: String (@unique) - Note: For reminder settings, the shop ID is suffixed with `_reminder`.
*   `enabled`: Boolean (Default: true)
*   `windowMinutes`: Int (Default: 30) - Time limit for order verification.
*   `codMinAmount`: Float (Default: 499) - Minimum amount to trigger confirmation.
*   `createdAt`: DateTime
*   `updatedAt`: DateTime

---

## 📝 Lead
Visitor contact data captured from the storefront for Cart Recovery.
*   `id`: Int (@id, autoincrement)
*   `shop`: String - Shop domain where capture happened.
*   `email`: String - Visitor's email address.
*   `capturedAt`: DateTime - Timestamp of original capture.
*   `lastReminderSent`: DateTime? - When the last email was sent.
*   `status`: String (Default: "PENDING") - Can be `PENDING` or `CONVERTED`.
*   `cartData`: String? - JSON-stringified object of the visitor's cart items.
*   `consent`: Boolean (Default: false) - Whether the user agreed to the privacy policy.
*   `createdAt`: DateTime
*   **Indexing**: Composite index on `[shop, email]`.

---

## 📧 EmailTemplate
Customizable templates for automated/manual reminder emails.
*   `id`: Int (@id, autoincrement)
*   `shop`: String
*   `name`: String - Internal name for identification.
*   `subject`: String - Final email subject line.
*   `body`: String - HTML/Text content.
*   `createdAt`: DateTime
*   `updatedAt`: DateTime
*   **Indexing**: Single index on `[shop]`.

---

## 🎫 ConfirmationToken
Used for the 1-click verification link generation for COD orders.
*   `id`: Int (@id, autoincrement)
*   `token`: String (@unique)
*   `shop`: String
*   `orderId`: String
*   `expiresAt`: DateTime
*   `usedAt`: DateTime?
*   `createdAt`: DateTime
*   **Indexing**: Composite index on `[shop, orderId]`.

---

## 📊 ConfirmationLog
Audit trails for order confirmations and cancellations.
*   `id`: Int (@id, autoincrement)
*   `shop`: String
*   `orderId`: String
*   `action`: String - `CONFIRMED` or `CANCELLED`.
*   `createdAt`: DateTime

---
*Last updated on April 2, 2026*
