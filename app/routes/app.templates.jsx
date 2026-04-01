import { useLoaderData, Form, useActionData } from "react-router";
import { useState, useEffect } from "react";
import { Page, Layout, Card, ResourceList, ResourceItem, Text, TextField, Button, Box, InlineStack, BlockStack } from "@shopify/polaris";
import { authenticate } from "../shopify.server";
import prisma from "../db.server";
import { useAppBridge } from "@shopify/app-bridge-react";

export async function loader({ request }) {
  const { session } = await authenticate.admin(request);
  const shop = session.shop;

  const templates = await prisma.emailTemplate.findMany({
    where: { shop },
    orderBy: { createdAt: "desc" },
  });

  return Response.json({ templates });
}

export async function action({ request }) {
  const { session } = await authenticate.admin(request);
  const shop = session.shop;

  const formData = await request.formData();
  const name = formData.get("name");
  const subject = formData.get("subject");
  const body = formData.get("body");
  const intent = formData.get("intent");

  if (intent === "delete") {
    const id = parseInt(formData.get("id"));
    await prisma.emailTemplate.delete({ where: { id } });
    return Response.json({ ok: true, message: "Template deleted" });
  }

  const templateData = {
    shop,
    name,
    subject,
    body,
  };

  const id = formData.get("id");
  if (id) {
    await prisma.emailTemplate.update({
      where: { id: parseInt(id) },
      data: templateData,
    });
    return Response.json({ ok: true, message: "Template updated" });
  } else {
    await prisma.emailTemplate.create({ data: templateData });
    return Response.json({ ok: true, message: "Template created" });
  }
}

export default function TemplatesPage() {
  const { templates } = useLoaderData();
  const actionData = useActionData();
  const shopify = useAppBridge();

  const [editingTemplate, setEditingTemplate] = useState(null);
  const [isFormVisible, setIsFormVisible] = useState(false);

  useEffect(() => {
    if (actionData?.ok) {
      shopify.toast.show(actionData.message);
      setIsFormVisible(false);
      setEditingTemplate(null);
    }
  }, [actionData, shopify]);

  const handleEdit = (template) => {
    setEditingTemplate(template);
    setIsFormVisible(true);
  };

  return (
    <Page
      title="Email Templates"
      primaryAction={{
        content: isFormVisible ? "Cancel" : "Add Template",
        onAction: () => {
          setIsFormVisible(!isFormVisible);
          setEditingTemplate(null);
        },
      }}
    >
      <Layout>
        {isFormVisible && (
          <Layout.Section>
            <Card sectioned>
              <Form method="post">
                {editingTemplate && <input type="hidden" name="id" value={editingTemplate.id} />}
                <TextField
                  label="Internal Name"
                  name="name"
                  defaultValue={editingTemplate?.name || ""}
                  required
                  autoComplete="off"
                />
                <Box paddingBlockStart="200" />
                <TextField
                  label="Email Subject"
                  name="subject"
                  defaultValue={editingTemplate?.subject || "Your cart is waiting for you!"}
                  required
                  autoComplete="off"
                />
                <Box paddingBlockStart="200" />
                <TextField
                  label="Email Body (HTML/Text)"
                  name="body"
                  defaultValue={editingTemplate?.body || "Hello! We noticed you left some items in your cart. You can complete your order here: {{ cart_url }}"}
                  multiline={8}
                  required
                  autoComplete="off"
                  helpText="Use {{ email }}, {{ cart_url }}, and {{ shop }} as placeholders."
                />
                <Box paddingBlockStart="400" />
                <Button submit primary>{editingTemplate ? "Update Template" : "Create Template"}</Button>
              </Form>
            </Card>
          </Layout.Section>
        )}
        <Layout.Section>
          <Card>
            <ResourceList
              resourceName={{ singular: "template", plural: "templates" }}
              items={templates}
              renderItem={(item) => (
                <ResourceItem id={item.id} onClick={() => handleEdit(item)}>
                  <Box padding="200">
                    <InlineStack align="space-between" blockAlign="center">
                      <BlockStack gap="100">
                        <Text variant="bodyMd" fontWeight="bold">
                          {item.name}
                        </Text>
                        <Text variant="bodySm" tone="subdued">
                          Subject: {item.subject}
                        </Text>
                      </BlockStack>
                      <Form method="post" onSubmit={(e) => {
                          if (!confirm("Delete this template?")) e.preventDefault();
                      }}>
                        <input type="hidden" name="id" value={item.id} />
                        <input type="hidden" name="intent" value="delete" />
                        <Button tone="critical" submit variant="plain">Delete</Button>
                      </Form>
                    </InlineStack>
                  </Box>
                </ResourceItem>
              )}
            />
          </Card>
        </Layout.Section>
      </Layout>
    </Page>
  );
}
