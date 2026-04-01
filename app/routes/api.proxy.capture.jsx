import shopify from "../shopify.server";
import prisma from "../db.server";

export async function action({ request }) {
  const { session, shop } = await shopify.authenticate.public.appProxy(request);

  if (!shop) {
    return Response.json({ message: "Invalid request" }, { status: 400 });
  }

  const payload = await request.json();
  const { email, cart, consent } = payload;

  if (!email || !cart) {
    return Response.json({ message: "Missing required fields" }, { status: 400 });
  }

  // Check if reminder is enabled for this shop
  const settings = await prisma.shopSettings.findUnique({
    where: { shop: `${shop}_reminder` }
  });

  if (!settings || !settings.enabled) {
    return Response.json({ message: "Storefront capture is disabled for this shop" }, { status: 403 });
  }

  if (!consent) {
    return Response.json({ message: "Consent is required" }, { status: 400 });
  }

  try {
    const lead = await prisma.lead.create({
      data: {
        shop: shop,
        email: email,
        cartData: JSON.stringify(cart),
        consent: consent,
        status: "PENDING",
      },
    });

    console.log(`Lead captured for ${shop}: ${email} with consent: ${consent}`);

    return Response.json({ success: true, leadId: lead.id });
  } catch (err) {
    console.error("Error capturing lead:", err);
    return Response.json({ message: "Error saving lead" }, { status: 500 });
  }
}

// App proxy requests should also handle CORS if needed, but Shopify proxy handles it usually.
export async function loader() {
  return Response.json({ message: "Only POST requests are allowed" }, { status: 405 });
}
