/* ===========================================================
   POST /api/send-code  { id: "<email>" }
   Generates a 6-digit code, emails it via SMTP, and returns a
   stateless HMAC token (no database). The raw code is never
   returned when email is configured.
   Env vars: SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS,
             MAIL_FROM (optional), OTP_SECRET (recommended).
   =========================================================== */
const crypto = require("crypto");
const nodemailer = require("nodemailer");

const SECRET = process.env.OTP_SECRET || "tripgo-dev-secret-change-me";
const TTL_MS = 10 * 60 * 1000; // 10 minutes

function sign(email, code, exp) {
  return crypto.createHmac("sha256", SECRET).update(email + "." + code + "." + exp).digest("hex");
}

function buildTransport() {
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  if (!user || !pass) return null;
  const port = Number(process.env.SMTP_PORT || 465);
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST || "smtp.gmail.com",
    port: port,
    secure: port === 465,
    auth: { user: user, pass: pass },
  });
}

function emailHtml(code) {
  return (
    '<div style="font-family:Arial,Helvetica,sans-serif;max-width:480px;margin:auto;padding:24px;border:1px solid #eef0f3;border-radius:12px">' +
      '<div style="font-size:22px;font-weight:800;color:#1763d6">✈ Trip<span style="color:#1a2b49">Go</span></div>' +
      '<h2 style="margin:18px 0 6px;color:#1a2b49">Your verification code</h2>' +
      '<p style="color:#5b6577;margin:0 0 18px">Use the code below to sign in to TripGo. It expires in 10 minutes.</p>' +
      '<div style="font-size:34px;font-weight:800;letter-spacing:8px;background:#f3f7ff;color:#1763d6;text-align:center;padding:16px;border-radius:10px">' + code + "</div>" +
      '<p style="color:#9aa3b2;font-size:12px;margin-top:18px">If you didn\'t request this, you can safely ignore this email.</p>' +
    "</div>"
  );
}

module.exports = async (req, res) => {
  if (req.method !== "POST") { res.status(405).json({ error: "Method not allowed" }); return; }
  try {
    const body = typeof req.body === "string" ? JSON.parse(req.body || "{}") : (req.body || {});
    const id = String(body.id || "").trim();
    if (!/.+@.+\..+/.test(id)) {
      res.status(400).json({ error: "Enter a valid email address to receive a code." });
      return;
    }

    const code = String(Math.floor(100000 + Math.random() * 900000));
    const exp = Date.now() + TTL_MS;
    const sig = sign(id, code, exp);
    const token = Buffer.from(id + "|" + exp + "|" + sig).toString("base64");

    const tx = buildTransport();
    if (!tx) {
      // SMTP not configured yet — keep the flow working in demo mode.
      res.status(200).json({ token: token, sent: false, devCode: code });
      return;
    }

    const from = process.env.MAIL_FROM || process.env.SMTP_USER;
    await tx.sendMail({
      from: '"TripGo" <' + from + ">",
      to: id,
      subject: "Your TripGo verification code: " + code,
      text: "Your TripGo verification code is " + code + ". It expires in 10 minutes.",
      html: emailHtml(code),
    });

    res.status(200).json({ token: token, sent: true });
  } catch (e) {
    res.status(500).json({ error: "Could not send the code right now. Please try again." });
  }
};
