import db from "./db.server";
import { DeliveryMethod } from "@shopify/shopify-api";

function randomToken(length = 40) {
    const chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    let out = "";
    for (let i = 0; i < length; i++) out += chars[Math.floor(Math.random() * chars.length)];
    return out;
}

export const webhooks = {
    ORDERS_CREATE: {
        deliveryMethod: DeliveryMethod.Http,
        callbackUrl: "/webhooks/orders/create",

        async callback({ session, payload, admin }) {
            const shop = session.shop;

            // Load settings (create default if missing)
            const settings = await db.shopSettings.upsert({
                where: { shop },
                update: {},
                create: { shop, enabled: true, windowMinutes: 30, codMinAmount: 499 },
            });

            if (!settings.enabled) return;

            const order = payload;

            const gateways = (order.payment_gateway_names || []).map((x) =>
                String(x).toLowerCase()
            );

            const isCOD =
                gateways.includes("cash on delivery") ||
                gateways.includes("cod") ||
                gateways.includes("cash_on_delivery");

            if (!isCOD) return;

            const total = Number(order.current_total_price || order.total_price || 0);
            if (total < Number(settings.codMinAmount)) return;

            const orderId = order.admin_graphql_api_id; // GID
            if (!orderId) return;

            // Create token
            const token = randomToken();
            const expiresAt = new Date(Date.now() + settings.windowMinutes * 60 * 1000);

            await db.confirmationToken.create({
                data: { token, shop, orderId, expiresAt },
            });

            // Add tags
            await admin.graphql(
                `#graphql
        mutation addTags($id: ID!, $tags: [String!]!) {
          tagsAdd(id: $id, tags: $tags) {
            userErrors { field message }
          }
        }`,
                {
                    variables: { id: orderId, tags: ["COD_UNCONFIRMED"] },
                }
            );

            // Add note with link (merchant can send it manually)
            await admin.graphql(
                `#graphql
        mutation note($input: OrderInput!) {
          orderUpdate(input: $input) {
            userErrors { field message }
          }
        }`,
                {
                    variables: {
                        input: {
                            id: orderId,
                            note: `COD confirmation pending. Link: ${process.env.SHOPIFY_APP_URL}/confirm?token=${token}`,
                        },
                    },
                }
            );
        },
    },
};
