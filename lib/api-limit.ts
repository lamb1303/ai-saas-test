import { auth } from "@clerk/nextjs/server";
import { MAX_FREE_COUNTS } from "@/constants";
import supabase from "./supabase";

export const increaseApiLimit = async () => {
  const { userId } = auth();

  if (!userId) {
    return;
  }

  const { data: userApiLimit, error: fetchError }: any = await supabase
    .from("user_api_limit")
    .select("*")
    .eq("user_id", userId);

  if (fetchError) {
    console.error("Error fetching API limit:", fetchError.message);
    return;
  }

  if (userApiLimit.length === 0) {
    // Insert a new record
    const { error: insertError } = await supabase
      .from("user_api_limit")
      .insert([{ user_id: userId, count: 1 }]);

    if (insertError) {
      console.error("Error inserting API limit:", insertError.message);
    }
  } else {
    // Update the existing record
    const currentLimit = userApiLimit[0];
    const { error: updateError } = await supabase
      .from("user_api_limit")
      .update({ count: currentLimit.count + 1 })
      .eq("user_id", userId);

    if (updateError) {
      console.error("Error updating API limit:", updateError.message);
    }
  }
};

export const checkApiLimit = async () => {
  const { userId } = auth();
  if (!userId) {
    return false;
  }

  const { data: userApiLimit }: any = await supabase
    .from("user_api_limit")
    .select("*")
    .eq("user_id", userId)
    .single();

  if (!userApiLimit || userApiLimit.count < MAX_FREE_COUNTS) {
    return true;
  } else {
    return false;
  }
};

export const getApiLimitCount = async () => {
  const { userId } = auth();

  if (!userId) {
    return 0;
  }

  const { data: userApiLimit }: any = await supabase
    .from("user_api_limit")
    .select("*")
    .eq("user_id", userId)
    .single();

  if (!userApiLimit) {
    return 0;
  }

  return userApiLimit.count;
};
