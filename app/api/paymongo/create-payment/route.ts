import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { amount, currency = "PHP", method, description, billing } = body;

  const secretKey = process.env.PAYMONGO_SECRET_KEY!;
  const encoded = Buffer.from(`${secretKey}:`).toString("base64");

  // QRPh uses Sources API, not Payment Intents
  if (method === "qrph") {
    const sourceRes = await fetch("https://api.paymongo.com/v1/sources", {
      method: "POST",
      headers: {
        Authorization: `Basic ${encoded}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        data: {
          attributes: {
            amount: Math.round(amount * 100),
            currency,
            type: "qr_code",
            description,
            redirect: {
              success: `${process.env.NEXT_PUBLIC_APP_URL}/checkout/success`,
              failed: `${process.env.NEXT_PUBLIC_APP_URL}/checkout?error=failed`,
            },
            billing,
          },
        },
      }),
    });

    const sourceData = await sourceRes.json();
    console.log("QRPh source:", JSON.stringify(sourceData, null, 2));
    if (!sourceRes.ok) {
      return NextResponse.json({ error: sourceData }, { status: 400 });
    }

    const qrUrl = sourceData.data.attributes.redirect?.checkout_url;
    const qrCode = sourceData.data.attributes.qr_code_url;

    return NextResponse.json({ status: "pending", redirectUrl: qrUrl, qrCode });
  }

  // Payment Intent flow for GCash, Maya, Card
  const intentRes = await fetch("https://api.paymongo.com/v1/payment_intents", {
    method: "POST",
    headers: {
      Authorization: `Basic ${encoded}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      data: {
        attributes: {
          amount: Math.round(amount * 100),
          currency,
          description,
          payment_method_allowed: [method],
          capture_type: "automatic",
        },
      },
    }),
  });

  const intentData = await intentRes.json();
  if (!intentRes.ok) {
    console.error(
      "PayMongo intent error:",
      JSON.stringify(intentData, null, 2),
    );
    return NextResponse.json({ error: intentData }, { status: 400 });
  }

  const intentId = intentData.data.id;
  const clientKey = intentData.data.attributes.client_key;

  const methodRes = await fetch("https://api.paymongo.com/v1/payment_methods", {
    method: "POST",
    headers: {
      Authorization: `Basic ${encoded}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      data: {
        attributes: {
          type: method,
          billing,
        },
      },
    }),
  });

  const methodData = await methodRes.json();
  if (!methodRes.ok) {
    console.error(
      "PayMongo method error:",
      JSON.stringify(methodData, null, 2),
    );
    return NextResponse.json({ error: methodData }, { status: 400 });
  }

  const methodId = methodData.data.id;

  const attachRes = await fetch(
    `https://api.paymongo.com/v1/payment_intents/${intentId}/attach`,
    {
      method: "POST",
      headers: {
        Authorization: `Basic ${encoded}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        data: {
          attributes: {
            payment_method: methodId,
            client_key: clientKey,
            return_url: `${process.env.NEXT_PUBLIC_APP_URL}/checkout/success`,
          },
        },
      }),
    },
  );

  const attachData = await attachRes.json();
  if (!attachRes.ok) {
    console.error(
      "PayMongo attach error:",
      JSON.stringify(attachData, null, 2),
    );
    return NextResponse.json({ error: attachData }, { status: 400 });
  }

  const status = attachData.data.attributes.status;
  const redirectUrl = attachData.data.attributes.next_action?.redirect?.url;

  return NextResponse.json({ status, redirectUrl, intentId, clientKey });
}
