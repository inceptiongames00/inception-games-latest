// ─────────────────────────────────────────────────────────────
// emailTemplates.js  –  All Inception Games email templates
// ─────────────────────────────────────────────────────────────

// ── 1. Registration received (existing, untouched) ────────────
export const registrationEmail = (p, t) => `
<div style="font-family:Arial,sans-serif;max-width:560px;margin:auto;background:#0f0f1a;border-radius:16px;overflow:hidden;color:#fff;">
  <div style="background:linear-gradient(135deg,#a855f7,#6366f1);padding:32px;text-align:center;">
    <h1 style="margin:0;font-size:26px;letter-spacing:1px;">Inception Games</h1>
    <p style="margin:6px 0 0;opacity:.85;font-size:14px;">Tournament Registration Received 🎮</p>
  </div>
  <div style="padding:32px;">
    <p style="font-size:16px;margin-top:0;">
      Hey <strong style="color:#a855f7;">${p.full_name}</strong>, your registration for
      <strong>${t.title}</strong> has been received!
    </p>

    <div style="background:linear-gradient(135deg,#1e1b4b,#2e1065);border:1px solid #a855f7;border-radius:12px;padding:20px;margin-bottom:20px;text-align:center;">
      <p style="margin:0 0 12px;font-size:14px;color:#e2e8f0;line-height:1.6;">
        🎉 <strong style="color:#fff;">Registration Update:</strong> Thank you for your interest!
        Please join our Discord to get started. Note that we will be sending the
        <strong style="color:#facc15;">Payment QR Code</strong> via a separate email shortly.
      </p>
      <a href="https://discord.gg/qGsn6T3hFT"
         style="display:inline-block;background:linear-gradient(135deg,#5865f2,#4752c4);color:#fff;text-decoration:none;padding:10px 24px;border-radius:8px;font-size:14px;font-weight:bold;letter-spacing:.5px;">
        🎮 Join Our Discord
      </a>
    </div>

    <div style="background:#1a1a2e;border-radius:12px;padding:24px;margin-bottom:20px;">
      <h3 style="color:#a855f7;margin-top:0;font-size:14px;text-transform:uppercase;letter-spacing:1px;">📋 Your Details</h3>
      <table style="width:100%;border-collapse:collapse;font-size:14px;">
        <tr><td style="padding:8px 0;color:#aaa;width:45%;">Full Name</td><td style="padding:8px 0;font-weight:bold;">${p.full_name}</td></tr>
        <tr><td style="padding:8px 0;color:#aaa;">Email</td><td style="padding:8px 0;">${p.email}</td></tr>
        <tr><td style="padding:8px 0;color:#aaa;">Phone</td><td style="padding:8px 0;">${p.phone}</td></tr>
      </table>
    </div>

    <div style="background:#1a1a2e;border-radius:12px;padding:24px;margin-bottom:20px;">
      <h3 style="color:#6366f1;margin-top:0;font-size:14px;text-transform:uppercase;letter-spacing:1px;">🏆 Tournament Details</h3>
      <p style="color:#aaa;font-size:14px;margin:0;text-align:center;padding:16px 0;">
        <span style="font-size:28px;">🚧</span><br/>
        <strong style="color:#fff;">Coming Soon</strong><br/>
        <span style="font-size:13px;">Tournament details will be shared with you shortly.</span>
      </p>
    </div>

    <div style="background:#1a1a2e;border-radius:12px;padding:24px;margin-bottom:24px;">
      <h3 style="color:#facc15;margin-top:0;font-size:14px;text-transform:uppercase;letter-spacing:1px;">💳 Payment Information</h3>
      <p style="color:#aaa;font-size:14px;margin:0;">
        We will send you a <strong style="color:#facc15;">separate email</strong> with the Payment QR Code and full instructions shortly. Please wait for that email before making any payment.
      </p>
    </div>

    <div style="background:#1a1a2e;border-radius:12px;padding:24px;margin-bottom:24px;">
      <h3 style="color:#4ade80;margin-top:0;font-size:14px;text-transform:uppercase;letter-spacing:1px;">📬 Contact Us</h3>
      <table style="width:100%;border-collapse:collapse;font-size:14px;">
        <tr><td style="padding:8px 0;color:#aaa;width:45%;">Email</td>
            <td style="padding:8px 0;"><a href="mailto:contact@inception.games" style="color:#a855f7;">contact@inception.games</a></td></tr>
        <tr><td style="padding:8px 0;color:#aaa;">Website</td>
            <td style="padding:8px 0;"><a href="https://www.inception.games" style="color:#a855f7;">www.inception.games</a></td></tr>
        <tr><td style="padding:8px 0;color:#aaa;">Discord</td>
            <td style="padding:8px 0;"><a href="https://discord.gg/qGsn6T3hFT" style="color:#a855f7;">discord.gg/qGsn6T3hFT</a></td></tr>
      </table>
    </div>
  </div>
  <div style="background:#0a0a14;padding:16px;text-align:center;">
    <p style="margin:0;color:#555;font-size:12px;">© ${new Date().getFullYear()} Inception Games. All rights reserved.</p>
  </div>
</div>`;

// ── 2. Payment instruction email (bKash + embedded QR) ────────
// qrDataUrl = base64 data:image/png;base64,... string
export const paymentEmail = (p, t, bkashNumber, qrDataUrl) => `
<div style="font-family:Arial,sans-serif;max-width:560px;margin:auto;background:#0f0f1a;border-radius:16px;overflow:hidden;color:#fff;">

  <!-- Header -->
  <div style="background:linear-gradient(135deg,#e11d68,#a855f7);padding:32px;text-align:center;">
    <h1 style="margin:0;font-size:26px;letter-spacing:1px;">Inception Games</h1>
    <p style="margin:6px 0 0;opacity:.85;font-size:14px;">💳 Complete Your Payment</p>
  </div>

  <div style="padding:32px;">
    <p style="font-size:16px;margin-top:0;">
      Hey <strong style="color:#a855f7;">${p.full_name}</strong>! 🎮<br/>
      Please complete your payment for <strong style="color:#facc15;">${t.title}</strong> to confirm your slot.
    </p>

    <!-- bKash details -->
    <div style="background:linear-gradient(135deg,#1a0a1e,#2d0a2e);border:2px solid #e11d68;border-radius:12px;padding:24px;margin-bottom:24px;text-align:center;">
      <div style="display:inline-block;background:#e11d68;color:#fff;font-size:11px;font-weight:bold;letter-spacing:2px;padding:4px 14px;border-radius:20px;margin-bottom:16px;">
        bKash PAYMENT
      </div>
      <p style="margin:0 0 8px;font-size:13px;color:#ccc;">Send <strong style="color:#4ade80;font-size:20px;">${t.currency || "BDT"} ${t.reg_fee}</strong> to this bKash number:</p>
      <div style="background:#0f0f1a;border:1px dashed #e11d68;border-radius:8px;padding:12px 24px;display:inline-block;margin:8px 0;">
        <span style="font-size:28px;font-weight:bold;letter-spacing:4px;color:#e11d68;">${bkashNumber}</span>
      </div>
      <p style="margin:12px 0 0;font-size:12px;color:#888;">Send Money → Personal number</p>

    <!-- QR Code — rendered via CID inline attachment -->
      <div style="margin-top:20px;">
        <p style="font-size:12px;color:#aaa;margin-bottom:10px;">Or scan this QR code:</p>
        <img src="cid:payment-qr" alt="Payment QR Code"
             style="width:180px;height:180px;border-radius:12px;border:3px solid #e11d68;background:#fff;padding:8px;" />
      </div>
          : ""
      }
    </div>

    <!-- Steps -->
    <div style="background:#1a1a2e;border-radius:12px;padding:24px;margin-bottom:20px;">
      <h3 style="color:#facc15;margin-top:0;font-size:14px;text-transform:uppercase;letter-spacing:1px;">📝 How to Pay</h3>
      <ol style="color:#ccc;font-size:14px;line-height:1.8;padding-left:20px;margin:0;">
        <li>Open <strong style="color:#e11d68;">bKash app</strong> → "Send Money"</li>
        <li>Enter number: <strong style="color:#e11d68;">${bkashNumber}</strong></li>
        <li>Enter amount: <strong style="color:#4ade80;">${t.reg_fee} ${t.currency || "BDT"}</strong></li>
        <li>Use reference: <strong style="color:#facc15;">${t.title}</strong></li>
        <li>Complete the transaction and note the <strong style="color:#fff;">Transaction ID</strong></li>
      </ol>
    </div>

    <!-- Submit payment instruction -->
    <div style="background:linear-gradient(135deg,#0f2a1a,#0a1f0f);border:1px solid #4ade80;border-radius:12px;padding:24px;margin-bottom:24px;text-align:center;">
      <h3 style="color:#4ade80;margin-top:0;font-size:14px;text-transform:uppercase;letter-spacing:1px;">✅ After Payment</h3>
      <p style="color:#ccc;font-size:14px;margin:0 0 16px;">
        Log in to your dashboard and submit your <strong style="color:#fff;">Transaction ID</strong> + a <strong style="color:#fff;">screenshot</strong> of the payment to verify your slot.
      </p>
      <a href="https://www.inception.games/dashboard"
         style="display:inline-block;background:linear-gradient(135deg,#4ade80,#22c55e);color:#000;text-decoration:none;padding:12px 28px;border-radius:8px;font-size:14px;font-weight:bold;letter-spacing:.5px;">
        Go to Dashboard →
      </a>
    </div>

    <!-- Registration summary -->
    <div style="background:#1a1a2e;border-radius:12px;padding:24px;margin-bottom:20px;">
      <h3 style="color:#a855f7;margin-top:0;font-size:14px;text-transform:uppercase;letter-spacing:1px;">📋 Registration Summary</h3>
      <table style="width:100%;border-collapse:collapse;font-size:14px;">
        <tr><td style="padding:7px 0;color:#aaa;width:45%;">Tournament</td><td style="padding:7px 0;font-weight:bold;">${t.title}</td></tr>
        <tr><td style="padding:7px 0;color:#aaa;">Game</td><td style="padding:7px 0;">${t.game}</td></tr>
        <tr><td style="padding:7px 0;color:#aaa;">Registration Fee</td><td style="padding:7px 0;color:#4ade80;font-weight:bold;">${t.reg_fee} ${t.currency || "BDT"}</td></tr>
        <tr><td style="padding:7px 0;color:#aaa;">Your Name</td><td style="padding:7px 0;">${p.full_name}</td></tr>
        <tr><td style="padding:7px 0;color:#aaa;">In-Game Name</td><td style="padding:7px 0;">${p.in_game_name || "N/A"}</td></tr>
        <tr><td style="padding:7px 0;color:#aaa;">Payment Status</td>
            <td style="padding:7px 0;"><span style="background:#facc15;color:#000;padding:2px 10px;border-radius:20px;font-size:12px;font-weight:bold;">PENDING</span></td></tr>
      </table>
    </div>

    <p style="font-size:13px;color:#666;text-align:center;margin-bottom:0;">
      ⏰ Please complete payment within <strong style="color:#facc15;">24 hours</strong> to secure your slot.
    </p>
  </div>

  <div style="background:#0a0a14;padding:16px;text-align:center;">
    <p style="margin:0;color:#555;font-size:12px;">© ${new Date().getFullYear()} Inception Games. All rights reserved.</p>
  </div>
</div>`;

// ── 3. Payment verified email ──────────────────────────────────
export const paymentVerifiedEmail = (p, t) => `
<div style="font-family:Arial,sans-serif;max-width:560px;margin:auto;background:#0f0f1a;border-radius:16px;overflow:hidden;color:#fff;">
  <div style="background:linear-gradient(135deg,#16a34a,#4ade80);padding:32px;text-align:center;">
    <div style="font-size:48px;margin-bottom:8px;">🏆</div>
    <h1 style="margin:0;font-size:26px;letter-spacing:1px;color:#000;">Inception Games</h1>
    <p style="margin:6px 0 0;opacity:.85;font-size:14px;color:#000;">Payment Verified — You're In!</p>
  </div>
  <div style="padding:32px;">
    <p style="font-size:16px;margin-top:0;">
      Congrats <strong style="color:#4ade80;">${p.full_name}</strong>! 🎉<br/>
      Your payment has been verified. Your slot in <strong style="color:#facc15;">${t.title}</strong> is confirmed!
    </p>
    <div style="background:#1a1a2e;border-radius:12px;padding:24px;margin-bottom:20px;">
      <h3 style="color:#4ade80;margin-top:0;font-size:14px;text-transform:uppercase;letter-spacing:1px;">✅ Confirmation</h3>
      <table style="width:100%;border-collapse:collapse;font-size:14px;">
        <tr><td style="padding:7px 0;color:#aaa;width:45%;">Tournament</td><td style="padding:7px 0;font-weight:bold;">${t.title}</td></tr>
        <tr><td style="padding:7px 0;color:#aaa;">Status</td>
            <td style="padding:7px 0;"><span style="background:#4ade80;color:#000;padding:2px 10px;border-radius:20px;font-size:12px;font-weight:bold;">ACTIVE</span></td></tr>
        <tr><td style="padding:7px 0;color:#aaa;">In-Game Name</td><td style="padding:7px 0;">${p.in_game_name || "N/A"}</td></tr>
      </table>
    </div>
    <div style="text-align:center;margin-bottom:24px;">
      <a href="https://discord.gg/qGsn6T3hFT"
         style="display:inline-block;background:linear-gradient(135deg,#5865f2,#4752c4);color:#fff;text-decoration:none;padding:12px 28px;border-radius:8px;font-size:14px;font-weight:bold;">
        🎮 Join Discord for Match Updates
      </a>
    </div>
  </div>
  <div style="background:#0a0a14;padding:16px;text-align:center;">
    <p style="margin:0;color:#555;font-size:12px;">© ${new Date().getFullYear()} Inception Games. All rights reserved.</p>
  </div>
</div>`;

// ── 4. Payment rejected email ──────────────────────────────────
export const paymentRejectedEmail = (p, t, reason) => `
<div style="font-family:Arial,sans-serif;max-width:560px;margin:auto;background:#0f0f1a;border-radius:16px;overflow:hidden;color:#fff;">
  <div style="background:linear-gradient(135deg,#dc2626,#f87171);padding:32px;text-align:center;">
    <div style="font-size:48px;margin-bottom:8px;">❌</div>
    <h1 style="margin:0;font-size:26px;letter-spacing:1px;">Inception Games</h1>
    <p style="margin:6px 0 0;opacity:.85;font-size:14px;">Payment Could Not Be Verified</p>
  </div>
  <div style="padding:32px;">
    <p style="font-size:16px;margin-top:0;">
      Hi <strong style="color:#f87171;">${p.full_name}</strong>,<br/>
      Unfortunately we could not verify your payment for <strong>${t.title}</strong>.
    </p>
    ${
      reason
        ? `
    <div style="background:#2a1010;border:1px solid #dc2626;border-radius:12px;padding:20px;margin-bottom:20px;">
      <h3 style="color:#f87171;margin-top:0;font-size:14px;text-transform:uppercase;letter-spacing:1px;">📋 Reason</h3>
      <p style="color:#ccc;font-size:14px;margin:0;">${reason}</p>
    </div>`
        : ""
    }
    <div style="background:#1a1a2e;border-radius:12px;padding:24px;margin-bottom:20px;">
      <h3 style="color:#facc15;margin-top:0;font-size:14px;text-transform:uppercase;letter-spacing:1px;">🔄 Next Steps</h3>
      <ol style="color:#ccc;font-size:14px;line-height:1.8;padding-left:20px;margin:0;">
        <li>Check your bKash transaction history</li>
        <li>Log in to your dashboard and resubmit with the correct Transaction ID</li>
        <li>Make sure the screenshot is clear and shows the full transaction</li>
        <li>Contact us on Discord if you need help</li>
      </ol>
    </div>
    <div style="text-align:center;">
      <a href="https://www.inception.games/dashboard"
         style="display:inline-block;background:linear-gradient(135deg,#a855f7,#6366f1);color:#fff;text-decoration:none;padding:12px 28px;border-radius:8px;font-size:14px;font-weight:bold;">
        Resubmit Payment →
      </a>
    </div>
  </div>
  <div style="background:#0a0a14;padding:16px;text-align:center;">
    <p style="margin:0;color:#555;font-size:12px;">© ${new Date().getFullYear()} Inception Games. All rights reserved.</p>
  </div>
</div>`;
