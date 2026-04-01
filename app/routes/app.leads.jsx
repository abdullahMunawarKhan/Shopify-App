import { useLoaderData, useActionData, Form } from "react-router";
import { Page, Layout, Card, ResourceList, ResourceItem, Text, Badge, InlineStack, BlockStack, Button } from "@shopify/polaris";
import { authenticate } from "../shopify.server";
import { useEffect } from "react";
import { useAppBridge } from "@shopify/app-bridge-react";
import prisma from "../db.server";

export async function loader({ request }) {
  const { session } = await authenticate.admin(request);
  const shop = session.shop;

  const leads = await prisma.lead.findMany({
    where: { shop },
    orderBy: { capturedAt: "desc" },
  });

  return Response.json({ leads });
}

export async function action({ request }) {
  const { session } = await authenticate.admin(request);
  const shop = session.shop;

  const formData = await request.formData();
  const leadId = parseInt(formData.get("id"));

  // Placeholder for actual email sending logic
  // In a real app, you would fetch a template and send via SendGrid/Mailgun/Amazon SES
  console.log(`Simulating email reminder for lead ID: ${leadId} on shop: ${shop}`);

  await prisma.lead.update({
    where: { id: leadId },
    data: { lastReminderSent: new Date() }
  });

  return Response.json({ ok: true, message: "Reminder sent successfully (simulated)" });
}

export default function LeadsPage() {
  const { leads } = useLoaderData();
  const actionData = useActionData();
  const shopify = useAppBridge();

  useEffect(() => {
    if (actionData?.ok) {
      shopify.toast.show(actionData.message);
    }
  }, [actionData, shopify]);

  const resourceName = {
    singular: "lead",
    plural: "leads",
  };

  return (
    <Page title="Captured Storefront Leads">
      <Layout>
        <Layout.Section>
          <Card>
            <ResourceList
              resourceName={resourceName}
              items={leads}
              renderItem={(item) => {
                const { id, email, capturedAt, status, cartData } = item;
                const cart = JSON.parse(cartData || "{}");
                const itemCount = cart.items?.length || 0;
                const totalPrice = (cart.total_price / 100).toFixed(2) || "0.00";
                const currency = cart.currency || "";

                return (
                  <ResourceItem
                    id={id}
                    accessibilityLabel={`View details for ${email}`}
                    name={email}
                  >
                    <InlineStack align="space-between">
                      <BlockStack gap="100">
                        <Text variant="bodyMd" fontWeight="bold" as="h3">
                          {email}
                        </Text>
                        <Text variant="bodySm" tone="subdued" as="p">
                          Captured on: {new Date(capturedAt).toLocaleString()}
                        </Text>
                      </BlockStack>
                      <Badge tone={status === "CONVERTED" ? "success" : "attention"}>
                        {status}
                      </Badge>
                      <Text variant="bodyMd" as="p">
                        {itemCount} items | {currency} {totalPrice}
                      </Text>
                      <Form method="post">
                        <input type="hidden" name="id" value={id} />
                        <Button submit variant="secondary" size="slim">Send Reminder</Button>
                      </Form>
                    </InlineStack>
                  </ResourceItem>
                );
              }}
            />
          </Card>
        </Layout.Section>
      </Layout>
    </Page>
  );
}
