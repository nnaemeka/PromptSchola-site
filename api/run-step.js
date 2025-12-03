// api/run-step.js

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  try {
    // 1) (Optional but recommended) Check user / plan
    // In a real app, you'd reuse logic from /api/me or a shared auth helper.
    const user = await getUserFromRequest(req); // mocked below
    if (!user || user.plan !== "mastery") {
      res.status(403).json({ error: "Mastery plan required." });
      return;
    }

    // 2) Read the request body
    const { subject, topic, stepNumber } = req.body || {};
    if (!subject || !topic || !stepNumber) {
      res.status(400).json({ error: "Missing subject, topic, or stepNumber." });
      return;
    }

    // 3) Build the base prompt text for this subject/topic/step
    const basePrompt = buildPrompt(subject, topic, stepNumber);

    // 4) Call OpenAI API (Chat Completions)
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      throw new Error("Missing OPENAI_API_KEY");
    }

    const openaiRes = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "gpt-4o-mini", // pick the model you prefer
        messages: [
          {
            role: "system",
            content: "You are a clear, patient physics tutor for university students."
          },
          {
            role: "user",
            content: basePrompt
          }
        ],
        max_tokens: 600,
        temperature: 0.4
      })
    });

    if (!openaiRes.ok) {
      const errorText = await openaiRes.text();
      console.error("OpenAI error:", errorText);
      res.status(500).json({ error: "OpenAI request failed." });
      return;
    }

    const json = await openaiRes.json();
    const content = json.choices?.[0]?.message?.content?.trim() || "";

    res.status(200).json({ content });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error." });
  }
}

// --- Helpers ---

// For now, we just reuse the same mock idea as /api/me.
// Later, you’ll decode a cookie or token and look up the user in a DB.
async function getUserFromRequest(req) {
  // TODO: plug in real auth later
  return { loggedIn: true, plan: "mastery" };
}

// Map (subject, topic, stepNumber) → concrete prompt text
function buildPrompt(subject, topic, stepNumber) {
  // Example: Step 1 of Newton’s First Law (physics)
  if (subject === "physics" && topic === "newton-first-law" && stepNumber === 1) {
    return "In a concise and intuitive way, explain Newton’s First Law of Motion. Avoid equations for now and use real-world situations to make it relatable for a first-year university physics student.";
  }

  // You can expand this as you add more lessons:
  // if (subject === "math" && topic === "limits-continuity" && stepNumber === 1) { ... }

  // Fallback – generic tutor behavior
  return "Explain this physics or math topic clearly and step-by-step for a university student.";
}

