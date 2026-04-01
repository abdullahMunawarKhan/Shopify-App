import { useLoaderData, Form, useActionData, useNavigate } from "react-router";
import { useState, useEffect } from "react";
import { useAppBridge } from "@shopify/app-bridge-react";
import { Page, Layout, Card, Checkbox, TextField, Button, Text, BlockStack, InlineStack } from "@shopify/polaris";
import { authenticate } from "../shopify.server";
import db from "../db.server";

export async function loader({ request }) {
    const { session } = await authenticate.admin(request);
    const shop = session.shop;

    const settings = await db.shopSettings.upsert({
        where: { shop },
        update: {},
        create: { shop, enabled: true, windowMinutes: 30, codMinAmount: 499 },
    });

    const reminderSettings = await db.shopSettings.upsert({
        where: { shop: `${shop}_reminder` }, // Simplified for multi-purpose shop settings
        update: {},
        create: { shop: `${shop}_reminder`, enabled: true },
    });

    return Response.json({ settings, reminderSettings });
}

export async function action({ request }) {
    const { session } = await authenticate.admin(request);
    const shop = session.shop;

    const form = await request.formData();
    const intent = form.get("intent");

    if (intent === "cod") {
        const enabled = form.get("enabled") === "on";
        const windowMinutes = Number(form.get("windowMinutes") || 30);
        const codMinAmount = Number(form.get("codMinAmount") || 499);

        await db.shopSettings.upsert({
            where: { shop },
            update: { enabled, windowMinutes, codMinAmount },
            create: { shop, enabled, windowMinutes, codMinAmount },
        });
        return Response.json({ ok: true, message: "COD settings saved" });
    }

    if (intent === "reminder") {
        const enabled = form.get("enabled") === "on";
        await db.shopSettings.upsert({
            where: { shop: `${shop}_reminder` },
            update: { enabled },
            create: { shop: `${shop}_reminder`, enabled },
        });
        return Response.json({ ok: true, message: "Cart recovery settings saved" });
    }

    return Response.json({ ok: false });
}

export default function Settings() {
    const { settings, reminderSettings } = useLoaderData();
    const [formState, setFormState] = useState(settings);
    const [reminderFormState, setReminderFormState] = useState(reminderSettings);
    const actionData = useActionData();
    const shopify = useAppBridge();
    const navigate = useNavigate();

    useEffect(() => {
        if (actionData?.ok) {
            shopify.toast.show(actionData.message || "Saved settings");
        }
    }, [actionData, shopify]);

    return (
        <Page title="App Settings">
            <Layout>
                <Layout.Section>
                    <Card sectioned title="✅ COD Confirmation">
                        <Text as="p" tone="subdued">
                            Automatically mark COD orders as unconfirmed and let customers confirm in 1 click.
                        </Text>

                        <Form method="post">
                            <input type="hidden" name="intent" value="cod" />
                            <div style={{ marginTop: 16 }}>
                                <Checkbox
                                    label="Enable COD verification system"
                                    name="enabled"
                                    checked={formState.enabled}
                                    onChange={(checked) => setFormState({ ...formState, enabled: checked })}
                                />
                                <input type="hidden" name="enabled" value={formState.enabled ? "on" : "off"} />
                            </div>

                            <BlockStack gap="400">
                                <div style={{ marginTop: 16 }}>
                                    <TextField
                                        label="Confirmation window (minutes)"
                                        name="windowMinutes"
                                        type="number"
                                        value={String(formState.windowMinutes)}
                                        onChange={(value) => setFormState({ ...formState, windowMinutes: value })}
                                        autoComplete="off"
                                    />
                                </div>

                                <div style={{ marginTop: 16 }}>
                                    <TextField
                                        label="Minimum COD amount (₹)"
                                        name="codMinAmount"
                                        type="number"
                                        value={String(formState.codMinAmount)}
                                        onChange={(value) => setFormState({ ...formState, codMinAmount: value })}
                                        autoComplete="off"
                                    />
                                </div>

                                <div style={{ marginTop: 16 }}>
                                    <Button submit primary>
                                        Save COD Settings
                                    </Button>
                                </div>
                            </BlockStack>
                        </Form>
                    </Card>
                </Layout.Section>

                <Layout.Section>
                    <Card sectioned title="🛒 Cart Recovery">
                        <BlockStack gap="400">
                            <Text as="p" tone="subdued">
                                Successfully capture emails and abandoned checkout data directly from your storefront.
                            </Text>
                            
                            <Form method="post">
                                <input type="hidden" name="intent" value="reminder" />
                                <Checkbox
                                    label="Enable Storefront Capture Popup"
                                    name="enabled"
                                    checked={reminderFormState.enabled}
                                    onChange={(checked) => setReminderFormState({ ...reminderFormState, enabled: checked })}
                                />
                                <input type="hidden" name="enabled" value={reminderFormState.enabled ? "on" : "off"} />
                                
                                <div style={{ marginTop: 16 }}>
                                    <Button submit>
                                        Save Capture Settings
                                    </Button>
                                </div>
                            </Form>

                            <InlineStack gap="400" align="start">
                                <Button onClick={() => navigate("/app/leads")} variant="secondary">
                                    View Captured Leads
                                </Button>
                                <Button onClick={() => navigate("/app/templates")} variant="secondary">
                                    Edit Email Templates
                                </Button>
                            </InlineStack>
                        </BlockStack>
                    </Card>
                </Layout.Section>
            </Layout>
        </Page>
    );
}
