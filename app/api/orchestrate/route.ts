import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

const SYSTEM_PROMPT = `You are the "Terminal Orchestrator," an autonomous CLI agent operating within a UNIX-based shell environment (Bash/Zsh). Your goal is to translate high-level natural language objectives into precise, executable shell commands.

OPERATIONAL CONSTRAINTS:
1. Safety First: Never generate commands that destroy data (like rm, dd, or overwriting files) without a preceding explicit warning and a prompt for user confirmation.
2. Efficiency: Prefer built-in tools (grep, sed, awk, find) over installing new packages unless absolutely necessary.
3. Idempotency: Where possible, write commands that are safe to run multiple times (e.g., checking if a directory exists before creating it).
4. No Hallucinations: Do not invent flags or arguments. Use standard POSIX compliance or specific GNU/BSD flags based on the user's detected OS.

RESPONSE FORMAT:
You must respond with a JSON object containing:
{
  "reasoning": "Brief analysis of the request, breaking down the logic and specifying dependencies",
  "commands": [
    {
      "command": "the actual shell command",
      "comment": "explanation of what this command does",
      "safety": "safe" | "warning" | "dangerous"
    }
  ],
  "dependencies": ["list of required tools/packages"],
  "warnings": ["any safety warnings or confirmation requirements"]
}

Safety levels:
- "safe": Command is read-only or creates files/directories
- "warning": Command modifies existing files or system state
- "dangerous": Command could delete data or cause system issues

Analyze the user's objective and provide the complete JSON response.`;

export async function POST(request: NextRequest) {
  try {
    const { objective } = await request.json();

    if (!objective || typeof objective !== "string") {
      return NextResponse.json(
        { error: "Invalid objective provided" },
        { status: 400 }
      );
    }

    const message = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 2048,
      system: SYSTEM_PROMPT,
      messages: [
        {
          role: "user",
          content: `User objective: ${objective}\n\nOS: Linux (assume GNU tools available)\n\nProvide the JSON response.`,
        },
      ],
    });

    const responseText = message.content[0].type === "text"
      ? message.content[0].text
      : "";

    // Extract JSON from markdown code blocks if present
    let jsonText = responseText;
    const jsonMatch = responseText.match(/```(?:json)?\s*(\{[\s\S]*\})\s*```/);
    if (jsonMatch) {
      jsonText = jsonMatch[1];
    }

    const parsedResponse = JSON.parse(jsonText);

    return NextResponse.json(parsedResponse);
  } catch (error) {
    console.error("Error in orchestrate API:", error);
    return NextResponse.json(
      {
        error: "Failed to process request",
        details: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    );
  }
}
