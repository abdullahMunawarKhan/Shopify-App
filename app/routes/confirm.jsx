import { useLoaderData, Form } from "react-router";
import db from "../db.server";

export async function loader({ request }) {
    const url = new URL(request.url);
    const token = url.searchParams.get("token");

    if (!token) {
        return Response.json({ error: "Missing token" }, { status: 400 });
    }

    const tokenRow = await db.confirmationToken.findUnique({ where: { token } });

    if (!tokenRow) return Response.json({ error: "Invalid token" }, { status: 404 });
    if (tokenRow.usedAt) return Response.json({ error: "Token already used" }, { status: 400 });
    if (new Date(tokenRow.expiresAt) < new Date()) return Response.json({ error: "Token expired" }, { status: 400 });

    return Response.json({ token, orderId: tokenRow.orderId });
}

export async function action({ request }) {
    const url = new URL(request.url);
    const token = url.searchParams.get("token");

    const form = await request.formData();
    const actionType = form.get("actionType"); // CONFIRM or CANCEL

    const tokenRow = await db.confirmationToken.findUnique({ where: { token } });

    if (!tokenRow) return Response.json({ error: "Invalid token" }, { status: 404 });
    if (tokenRow.usedAt) return Response.json({ error: "Token already used" }, { status: 400 });
    if (new Date(tokenRow.expiresAt) < new Date()) return Response.json({ error: "Token expired" }, { status: 400 });

    await db.confirmationToken.update({
        where: { token },
        data: { usedAt: new Date() },
    });

    await db.confirmationLog.create({
        data: {
            shop: tokenRow.shop,
            orderId: tokenRow.orderId,
            action: actionType === "CONFIRM" ? "CONFIRMED" : "CANCELLED",
        },
    });

    // TODO Day 2: Update Shopify order tags here
    return Response.json({ ok: true, message: "Saved. (Order update will be added next)" });
}

export default function ConfirmPage() {
    const data = useLoaderData();

    if (data.error) {
        return (
            <div style={{ maxWidth: 500, margin: "50px auto", fontFamily: "sans-serif" }}>
                <h2>Error</h2>
                <p>{data.error}</p>
            </div>
        );
    }

    return (
        <div style={{ maxWidth: 500, margin: "50px auto", fontFamily: "sans-serif" }}>
            <h2>Confirm COD Order</h2>
            <p>Your order is waiting for confirmation.</p>
            <p><b>Order:</b> {data.orderId}</p>

            <Form method="post">
                <button
                    type="submit"
                    name="actionType"
                    value="CONFIRM"
                    style={{ width: "100%", padding: 12, marginTop: 10 }}
                >
                    ✅ Confirm Order
                </button>

                <button
                    type="submit"
                    name="actionType"
                    value="CANCEL"
                    style={{ width: "100%", padding: 12, marginTop: 10 }}
                >
                    ❌ Cancel Order
                </button>
            </Form>
        </div>
    );
}
