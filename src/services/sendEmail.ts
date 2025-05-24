interface WelcomeEmailParams {
  toEmail: string;
  toName: string;
}

// Ensure these are set in your .env.local and Vercel environment variables
const SENDER_EMAIL = process.env.BREVO_SENDER_EMAIL || "your-validated-sender@example.com";
const SENDER_NAME = process.env.BREVO_SENDER_NAME || "Stealth Team";
const BREVO_API_KEY = process.env.BREVO_API_KEY;

if (!BREVO_API_KEY) {
  console.error("FATAL: BREVO_API_KEY is not defined. Emails cannot be sent.");
  // In a real app, you might want to throw an error here or have a more robust config check
}
if (!SENDER_EMAIL || SENDER_EMAIL === "your-validated-sender@example.com") {
    console.warn("Warning: BREVO_SENDER_EMAIL is not configured or using default. Emails might not send correctly.");
}


export async function sendWelcomeEmail({ toEmail, toName }: WelcomeEmailParams): Promise<{ success: boolean; messageId?: string; error?: string }> {
  if (!BREVO_API_KEY) {
    const errorMessage = "Brevo API Key is not configured. Cannot send email.";
    console.error(errorMessage);
    return { success: false, error: errorMessage };
  }

  if (!toEmail || !toName) {
    const errorMessage = "Recipient email or name is missing for sending welcome email.";
    console.error(errorMessage);
    return { success: false, error: errorMessage };
  }

  const subject = "Welcome to Stealth!";
  const htmlContent = `
    <html>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; background-color: #f4f4f4; margin: 0; padding: 0;">
        <div style="max-width: 600px; margin: 20px auto; background-color: #ffffff; padding: 20px; border-radius: 8px; box-shadow: 0 0 10px rgba(0,0,0,0.1);">
          <h1 style="color: #28a745; text-align: center;">Welcome to Stealth, ${toName}!</h1>
          <p style="font-size: 16px;">We're thrilled to have you on board.</p>
          <p style="font-size: 16px;">Get ready to explore a new way to lease vehicles. You can start by browsing our available cars or listing your own.</p>
          <p style="font-size: 16px;">Here are a few things you can do to get started:</p>
          <ul style="font-size: 16px; list-style-type: disc; padding-left: 20px;">
            <li><a href="${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/dashboard" style="color: #28a745; text-decoration: none;">Explore the Dashboard</a></li>
            <li><a href="${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/dashboard/list-vehicle" style="color: #28a745; text-decoration: none;">List Your Vehicle</a></li>
            ${''/* You can add more links here if needed */}
          </ul>
          <p style="font-size: 16px;">If you have any questions, feel free to reach out to our support team (if applicable).</p>
          <br>
          <p style="font-size: 16px;">Happy Leasing!</p>
          <p style="font-size: 16px; margin-top: 5px;">The ${SENDER_NAME}</p>
          <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;">
          <p style="text-align: center; font-size: 12px; color: #777;">
            If you did not sign up for Stealth, please ignore this email.
          </p>
        </div>
      </body>
    </html>
  `;

  // Plain text version for email clients that don't support HTML
  const textContent = `
    Welcome to Stealth, ${toName}!
    We're thrilled to have you on board.
    Explore the dashboard: ${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/dashboard
    The ${SENDER_NAME}
  `;

  const payload = {
    sender: {
      email: SENDER_EMAIL,
      name: SENDER_NAME,
    },
    to: [
      {
        email: toEmail,
        name: toName, // Brevo API can use name here too
      },
    ],
    subject,
    htmlContent,
    textContent, // It's good practice to include a text version
  };

  try {
    console.log(`Attempting to send welcome email to ${toEmail} via Brevo API...`);
    const response = await fetch("https://api.brevo.com/v3/smtp/email", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "api-key": BREVO_API_KEY,
      },
      body: JSON.stringify(payload),
    });

    const responseData = await response.json(); // Try to parse JSON regardless of status for more info

    if (!response.ok) {
      // Log the detailed error from Brevo if available
      console.error(`Brevo API Error (${response.status}):`, JSON.stringify(responseData, null, 2));
      throw new Error(responseData.message || `Failed to send email via Brevo. Status: ${response.status}`);
    }

    console.log('Welcome email sent successfully via Brevo API. Response:', JSON.stringify(responseData, null, 2));
    return {
      success: true,
      messageId: responseData.messageId, // Brevo's successful response usually includes a messageId
    };

  } catch (err) {
    const currentError = err as Error;
    console.error("Error in sendWelcomeEmail function:", currentError.message);
    return {
      success: false,
      error: currentError.message || "Email failed to send due to an unexpected error.",
    };
  }
}