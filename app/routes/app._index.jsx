import { useLoaderData, useNavigate } from "react-router";
import { BlockStack, InlineStack, Button, Badge } from "@shopify/polaris";
import { boundary } from "@shopify/shopify-app-react-router/server";
import { authenticate } from "../shopify.server";
import prisma from "../db.server";

export const loader = async ({ request }) => {
  const { session } = await authenticate.admin(request);
  const shop = session.shop;

  const totalLeads = await prisma.lead.count({ where: { shop } });
  const pendingLeads = await prisma.lead.count({ where: { shop, status: "PENDING" } });

  return Response.json({ totalLeads, pendingLeads });
};

export const action = async ({ request }) => {
  const { admin } = await authenticate.admin(request);
  const color = ["Red", "Orange", "Yellow", "Green"][
    Math.floor(Math.random() * 4)
  ];
  const response = await admin.graphql(
    `#graphql
      mutation populateProduct($product: ProductCreateInput!) {
        productCreate(product: $product) {
          product {
            id
            title
            handle
            status
            variants(first: 10) {
              edges {
                node {
                  id
                  price
                  barcode
                  createdAt
                }
              }
            }
          }
        }
      }`,
    {
      variables: {
        product: {
          title: `${color} Snowboard`,
        },
      },
    },
  );
  const responseJson = await response.json();
  const product = responseJson.data.productCreate.product;
  const variantId = product.variants.edges[0].node.id;
  const variantResponse = await admin.graphql(
    `#graphql
    mutation shopifyReactRouterTemplateUpdateVariant($productId: ID!, $variants: [ProductVariantsBulkInput!]!) {
      productVariantsBulkUpdate(productId: $productId, variants: $variants) {
        productVariants {
          id
          price
          barcode
          createdAt
        }
      }
    }`,
    {
      variables: {
        productId: product.id,
        variants: [{ id: variantId, price: "100.00" }],
      },
    },
  );
  const variantResponseJson = await variantResponse.json();

  return {
    product: responseJson.data.productCreate.product,
    variant: variantResponseJson.data.productVariantsBulkUpdate.productVariants,
  };
};
export default function Index() {
  const { totalLeads, pendingLeads } = useLoaderData();
  const navigate = useNavigate();

  return (
    <s-page heading="Cart Reminder & COD Dashboard">
      <s-section heading="Cart Reminder Statistics">
        <InlineStack gap="base">
          <Badge tone="info">Total Leads: {totalLeads}</Badge>
          <Badge tone="attention">Pending Reminders: {pendingLeads}</Badge>
        </InlineStack>
      </s-section>

      <s-section heading="Quick Actions">
        <BlockStack gap="200">
          <Button onClick={() => navigate("/app/leads")} variant="primary">
            Manage Captured Leads
          </Button>
          <Button onClick={() => navigate("/app/templates")}>
            Manage Email Templates
          </Button>
          <Button onClick={() => navigate("/app/settings")}>
            COD Configuration
          </Button>
        </BlockStack>
      </s-section>

      <s-section heading="App Status">
        <s-badge tone="success">Active</s-badge>
        <s-paragraph>
          The storefront capture script is active and monitoring for abandoned carts.
        </s-paragraph>
      </s-section>
    </s-page>
  );
}

export const headers = (headersArgs) => {
  return boundary.headers(headersArgs);
};
