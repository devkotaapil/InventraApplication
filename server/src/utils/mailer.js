import nodemailer from "nodemailer";

function hasMailConfig() {
  return Boolean(process.env.MAIL_USER && process.env.MAIL_PASS);
}

function transporter() {
  if (!hasMailConfig()) return null;

  return nodemailer.createTransport({
    host: process.env.MAIL_HOST || "smtp.gmail.com",
    port: Number(process.env.MAIL_PORT || 587),
    secure: Number(process.env.MAIL_PORT || 587) === 465,
    auth: {
      user: process.env.MAIL_USER,
      pass: process.env.MAIL_PASS,
    },
  });
}

export async function sendMail({ to, subject, html, text }) {
  const mailer = transporter();
  if (!mailer) {
    console.log("Email skipped: MAIL_USER and MAIL_PASS are not configured.");
    return;
  }

  await mailer.sendMail({
    from: process.env.MAIL_FROM || `Inventra <${process.env.MAIL_USER}>`,
    to,
    subject,
    text,
    html,
  });
}

export async function sendWelcomeEmail(user) {
  await sendMail({
    to: user.email,
    subject: "Welcome to Inventra",
    text: `Hi ${user.name}, welcome to Inventra. Your shop workspace is ready.`,
    html: `
      <div style="font-family:Arial,sans-serif;line-height:1.6;color:#1E2A5E">
        <h2>Welcome to Inventra, ${user.name}</h2>
        <p>Your shop workspace is ready. You can now add products, manage stock, record sales, and view recommendations.</p>
        ${user.shopName ? `<p><strong>Shop:</strong> ${user.shopName}</p>` : ""}
        <p>Thank you for choosing Inventra.</p>
      </div>
    `,
  });
}

export async function sendLoginEmail(user) {
  if (process.env.SEND_LOGIN_EMAIL !== "true") return;

  await sendMail({
    to: user.email,
    subject: "New login to your Inventra account",
    text: `Hi ${user.name}, your Inventra account was just signed in.`,
    html: `
      <div style="font-family:Arial,sans-serif;line-height:1.6;color:#1E2A5E">
        <h2>New login detected</h2>
        <p>Hi ${user.name}, your Inventra account was just signed in.</p>
        <p>If this was you, no action is needed.</p>
      </div>
    `,
  });
}

export async function sendPasswordResetEmail(user, token) {
  const resetUrl = `${process.env.FRONTEND_URL || "http://localhost:5173"}/reset-password?token=${token}`;

  await sendMail({
    to: user.email,
    subject: "Reset your Inventra password",
    text: `Hi ${user.name}, use this link to reset your password: ${resetUrl}`,
    html: `
      <div style="font-family:Arial,sans-serif;line-height:1.6;color:#1E2A5E">
        <h2>Reset your password</h2>
        <p>Hi ${user.name}, we received a request to reset your Inventra password.</p>
        <p><a href="${resetUrl}" style="color:#1E2A5E;font-weight:bold">Click here to reset your password</a></p>
        <p>This link will expire in 15 minutes.</p>
      </div>
    `,
  });
}
