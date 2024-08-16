import { checkSubscription } from "@/lib/subscription";
import { ChatCompletionRequestMessage, Configuration, OpenAIApi } from "openai";
import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { increaseApiLimit, checkApiLimit } from "@/lib/api-limit";

const instructionMessage: ChatCompletionRequestMessage = {
  role: "system",
  content:
    "You are a helpful assistant that helps users with their questions. You can provide information, answer questions, and provide recommendations. You can also ask questions to clarify the user's intent.",
};

const configuration = new Configuration({
  apiKey: process.env.OPENAI_API_KEY,
});

const openai = new OpenAIApi(configuration);

export async function POST(req: Request) {
  try {
    const { userId } = auth();
    const body = await req.json();
    const { messages } = body;

    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    if (!configuration.apiKey) {
      return new NextResponse("OpenAI API Key not configured", { status: 500 });
    }

    if (!messages) {
      return new NextResponse("Messages are required", { status: 400 });
    }

    const freeTrial = await checkApiLimit();
    const isPro = await checkSubscription();
    if (!freeTrial && !isPro) {
      return new NextResponse("Free trial has expired", {
        status: 403,
      });
    }

    const responseMessage = await makeOpenAIRequest(messages);

    if (!isPro) {
      await increaseApiLimit();
    }

    return NextResponse.json(responseMessage);
  } catch (error) {
    console.log(error);
    return new NextResponse("Internal error", { status: 500 });
  }
}

export async function makeOpenAIRequest(
  messages: ChatCompletionRequestMessage[]
) {
  const maxRetries = 5;
  let attempt = 0;

  while (attempt < maxRetries) {
    try {
      const response = await openai.createChatCompletion({
        model: "gpt-3.5-turbo",
        messages: [instructionMessage, ...messages],
      });
      return response.data.choices[0].message;
    } catch (error: any) {
      if (error.response?.status === 429) {
        attempt++;
        const retryAfter = error.response.headers["retry-after"];
        const waitTime = retryAfter ? parseInt(retryAfter) * 1000 : 2000; // wait time in milliseconds
        console.log(
          `Rate limit hit ${attempt}. Retrying in ${waitTime / 1000} seconds...`
        );
        await new Promise((resolve) => setTimeout(resolve, waitTime));
      } else {
        throw error; // rethrow other errors
      }
    }
  }
  throw new Error("Max retries reached. Please try again later.");
}
