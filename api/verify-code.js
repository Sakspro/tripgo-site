/* ===========================================================
   POST /api/verify-code  { token, code }
   Recomputes the HMAC over (email, code, exp) and compares it
   to the signature embedded in the token. Stateless, no DB.
   =========================================================== */
const crypto = require("crypto");

const SECRET = process.env.OTP_SECRET || "tripgo-dev-secret-change-me";

function sign(email, code, exp) {
  return crypto.createHmac("sha256", SECRET).update(email + "." + code + "." + exp).digest("hex");
}

function safeEqual(a, b) {
  const A = Buffer.from(String(a));
  const B = Buffer.from(String(b));
  if (A.length !== B.length) return false;
  return crypto.timingSafeEqual(A, B);
}

module.exports = async (req, res) => {
  if (req.method !== "POST") { res.status(405).json({ error: "Method not allowed" }); return; }
  try {
    const body = typeof req.body === "string" ? JSON.parse(req.body || "{}") : (req.body || {});
    const code = String(body.code || "").trim();
    const token = String(body.token || "");

    let decoded = "";
    try { decoded = Buffer.from(token, "base64").toString("utf8"); } catch (e) {}
    const parts = decoded.split("|");
    const email = parts[0], expStr = parts[1], sig = parts[2];

    if (!email || !expStr || !sig) {
      res.status(400).json({ error: "Session expired. Please request a new code." });
      return;
    }
    if (Date.now() > Number(expStr)) {
      res.status(400).json({ error: "That code has expired. Please request a new one." });
      return;
    }

    const expected = sign(email, code, Number(expStr));
    if (!safeEqual(expected, sig)) {
      res.status(400).json({ error: "Incorrect code. Please check and try again." });
      return;
    }

    res.status(200).json({ ok: true, email: email });
  } catch (e) {
    res.status(500).json({ error: "Verification failed. Please try again." });
  }
};
