import { useLoaderData, Form, useActionData } from "react-router";
import { useState, useEffect } from "react";
import { useAppBridge } from "@shopify/app-bridge-react";
import { Page, Layout, Card, Checkbox, TextField, Button, Text } from "@shopify/polaris";
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

    return Response.json({ settings });
}

export async function action({ request }) {
    const { session } = await authenticate.admin(request);
    const shop = session.shop;

    const form = await request.formData();
    const enabled = form.get("enabled") === "on";
    const windowMinutes = Number(form.get("windowMinutes") || 30);
    const codMinAmount = Number(form.get("codMinAmount") || 499);

    await db.shopSettings.upsert({
        where: { shop },
        update: { enabled, windowMinutes, codMinAmount },
        create: { shop, enabled, windowMinutes, codMinAmount },
    });

    return Response.json({ ok: true });
}

export default function Settings() {
    const { settings } = useLoaderData();
    const [formState, setFormState] = useState(settings);
    const actionData = useActionData();
    const shopify = useAppBridge();

    useEffect(() => {
        if (actionData?.ok) {
            shopify.toast.show("Saved settings");
        }
    }, [actionData, shopify]);

    return (
        <Page title="COD Confirmation Settings">
            <Layout>
                <Layout.Section>
                    <Card sectioned>
                        <Text as="p" tone="subdued">
                            Automatically mark COD orders as unconfirmed and let customers confirm in 1 click.
                        </Text>

                        <Form method="post">
                            <div style={{ marginTop: 16 }}>
                                <Checkbox
                                    label="Enable COD confirmation"
                                    name="enabled"
                                    checked={formState.enabled}
                                    onChange={(checked) => setFormState({ ...formState, enabled: checked })}
                                />
                                <input type="hidden" name="enabled" value={formState.enabled ? "on" : "off"} />
                            </div>

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
                                    Save
                                </Button>
                            </div>
                        </Form>
                    </Card>
                </Layout.Section>
            </Layout>
        </Page>
    );
}
