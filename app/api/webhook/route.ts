import { stripe } from "./../../../lib/stripe";
import { NextResponse } from "next/server";
import { headers } from "next/headers";
import Stripe from "stripe";
import supabase from "@/lib/supabase";

export async function POST(req: Request) {
  const body = await req.text();
  const signature = headers().get("Stripe-Signature") as string;

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (error: any) {
    console.error(`Webhook Error: ${error}`);
    return new NextResponse(`Webhook Error: ${error.message}`, { status: 400 });
  }

  const session = event.data.object as Stripe.Checkout.Session;

  switch (event.type) {
    case "checkout.session.completed":
      const subscription = await stripe.subscriptions.retrieve(
        session.subscription as string
      );

      if (!session?.metadata?.userId) {
        return new NextResponse("User id is required", { status: 400 });
      }

      const { error: sessionError } = await supabase
        .from("user_subscription")
        .insert([
          {
            user_id: session?.metadata?.userId,
            stripe_subscription_id: subscription.id,
            stripe_customer_id: subscription.customer as string,
            stripe_current_period_end: new Date(
              subscription.current_period_end * 1000
            ),
          },
        ]);

      if (sessionError) {
        console.error(sessionError);
        return new NextResponse("Internal error", { status: 500 });
      }
      break;
    case "invoice.payment_succeeded":
      const subscriptionSucceded = await stripe.subscriptions.retrieve(
        session.subscription as string
      );
      const { error } = await supabase
        .from("user_subscription")
        .update({
          stripe_price_id: subscriptionSucceded.items.data[0].price.id,
          stripe_current_period_end: new Date(
            subscriptionSucceded.current_period_end * 1000
          ),
        })
        .eq("stripe_subscription_id", subscriptionSucceded.id);

      if (error) {
        console.error(error);
        return new NextResponse("Internal error", { status: 500 });
      }
      break;
    default:
      console.log(`Unhandled event type ${event.type}`);
  }

  return new NextResponse(null, { status: 200 });
}
