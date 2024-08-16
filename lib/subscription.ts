import { auth } from "@clerk/nextjs/server";
import supabase from "./supabase";

const DAY_IN_MS = 86_400_000;

export const checkSubscription = async () => {
  const { userId } = auth();

  if (!userId) {
    return false;
  }

  const { data: userSubscription }: any = await supabase
    .from("user_subscription")
    .select("*")
    .eq("user_id", userId.toString())
    .single();

  if (!userSubscription) {
    return false;
  }

  const isValid =
    userSubscription.stripe_price_id &&
    new Date(userSubscription.stripe_current_period_end).getTime()! +
      DAY_IN_MS >
      Date.now();

  return !!isValid;
};
