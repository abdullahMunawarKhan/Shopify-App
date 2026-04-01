
import { boundary } from "@shopify/shopify-app-react-router/server";
import { authenticate } from "../shopify.server";

export const loader = async ({ request }) => {
  const { session } = await authenticate.admin(request);
  const shop = session.shop;

  const totalLeads = await prisma.lead.count({ where: { shop } });
  const pendingLeads = await prisma.lead.count({ where: { shop, status: "PENDING" } });

  return json({ totalLeads, pendingLeads });
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

  return (
    <s-page heading="Cart Reminder & COD Dashboard">
      <s-section heading="Cart Reminder Statistics">
        <s-stack direction="inline" gap="base">
          <s-badge tone="info">Total Leads: {totalLeads}</s-badge>
          <s-badge tone="attention">Pending Reminders: {pendingLeads}</s-badge>
        </s-stack>
      </s-section>

      <s-section heading="Quick Actions">
        <s-stack direction="block" gap="base">
          <s-button href="/app/leads" variant="primary">
            Manage Captured Leads
          </s-button>
          <s-button href="/app/templates" variant="secondary">
            Manage Email Templates
          </s-button>
          <s-button href="/app/settings" variant="secondary">
            COD Configuration
          </s-button>
        </s-stack>
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
