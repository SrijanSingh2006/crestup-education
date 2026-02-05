const express = require("express");
const cors = require("cors");
const Razorpay = require("razorpay");
const crypto = require("crypto");
const { GoogleGenerativeAI } = require("@google/generative-ai");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 5000;
const CLIENT_ORIGIN = process.env.CLIENT_ORIGIN || "http://localhost:3000";

app.use(express.json());
app.use(
  cors({
    origin: CLIENT_ORIGIN
  })
);

const keyId = process.env.RAZORPAY_KEY_ID;
const keySecret = process.env.RAZORPAY_KEY_SECRET;
const geminiKey = process.env.GEMINI_API_KEY;
const geminiModel = process.env.GEMINI_MODEL || "gemini-1.5-flash";

app.get("/health", (req, res) => {
  res.json({ status: "ok" });
});

app.post("/api/payments/create-order", async (req, res) => {
  try {
    if (!keyId || !keySecret) {
      return res.status(400).json({
        error: "Razorpay keys are not configured."
      });
    }

    const { amount, currency = "INR", courseId } = req.body || {};
    const numericAmount = Number(amount);
    if (!Number.isFinite(numericAmount) || numericAmount <= 0) {
      return res.status(400).json({ error: "Invalid amount." });
    }

    const razorpay = new Razorpay({
      key_id: keyId,
      key_secret: keySecret
    });

    const order = await razorpay.orders.create({
      amount: Math.round(numericAmount * 100),
      currency,
      receipt: courseId ? `course_${courseId}` : undefined
    });

    return res.json({
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      keyId
    });
  } catch (err) {
    return res.status(500).json({
      error: err.message || "Unable to create order."
    });
  }
});

app.post("/api/payments/verify", (req, res) => {
  try {
    if (!keySecret) {
      return res.status(400).json({
        error: "Razorpay keys are not configured."
      });
    }

    const { orderId, paymentId, signature } = req.body || {};
    if (!orderId || !paymentId || !signature) {
      return res.status(400).json({ error: "Missing payment data." });
    }

    const expected = crypto
      .createHmac("sha256", keySecret)
      .update(`${orderId}|${paymentId}`)
      .digest("hex");

    if (expected !== signature) {
      return res.status(400).json({ error: "Invalid signature." });
    }

    return res.json({ verified: true });
  } catch (err) {
    return res.status(500).json({
      error: err.message || "Unable to verify payment."
    });
  }
});

app.post("/api/gemini/previous-papers", async (req, res) => {
  try {
    if (!geminiKey) {
      return res.status(400).json({
        error: "Gemini API key is not configured."
      });
    }

    const { query, classLevel, subject } = req.body || {};
    if (!query) {
      return res.status(400).json({ error: "Query is required." });
    }

    const genAI = new GoogleGenerativeAI(geminiKey);
    const model = genAI.getGenerativeModel({ model: geminiModel });

    const prompt = `
You are a helpful assistant for an education platform. 
Return ONLY valid JSON with this exact shape:
{
  "papers": [
    {
      "title": "",
      "year": 2023,
      "board": "",
      "link": "",
      "class": 10,
      "subject": ""
    }
  ],
  "note": ""
}

Rules:
- Only include real links you are confident about.
- If you are not confident, return an empty array and explain in "note".
- Use class ${classLevel || "unknown"} and subject "${subject || ""}" as filters if relevant.
- User query: "${query}".
`;

    const result = await model.generateContent(prompt);
    const text = result?.response?.text() || "";
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return res.json({ papers: [], note: text });
    }

    try {
      const parsed = JSON.parse(jsonMatch[0]);
      return res.json(parsed);
    } catch (err) {
      return res.json({ papers: [], note: text });
    }
  } catch (err) {
    return res.status(500).json({
      error: err.message || "Gemini request failed."
    });
  }
});

app.listen(PORT, () => {
  console.log(`Payment server running on ${PORT}`);
});
