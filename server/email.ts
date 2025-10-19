import sgMail from "@sendgrid/mail";

if (process.env.SENDGRID_API_KEY) {
  sgMail.setApiKey(process.env.SENDGRID_API_KEY);
}

interface ContactEmailParams {
  name: string;
  email: string;
  subject: string;
  message: string;
}

export async function sendContactEmail(
  params: ContactEmailParams,
): Promise<boolean> {
  if (!process.env.SENDGRID_API_KEY) {
    console.log("SendGrid API key not configured, email not sent:", params);
    return false;
  }

  try {
    const msg = {
      to: "admin@shuffleandsync.com",
      from: "noreply@shuffleandsync.com",
      replyTo: params.email,
      subject: `[Contact] ${params.subject}`,
      text: `Name: ${params.name}\nEmail: ${params.email}\n\nMessage:\n${params.message}`,
      html: `
        <h3>New Contact Form Submission</h3>
        <p><strong>Name:</strong> ${params.name}</p>
        <p><strong>Email:</strong> ${params.email}</p>
        <p><strong>Subject:</strong> ${params.subject}</p>
        <br>
        <p><strong>Message:</strong></p>
        <p>${params.message.replace(/\n/g, "<br>")}</p>
      `,
    };

    await sgMail.send(msg);
    return true;
  } catch (error) {
    console.error("SendGrid email error:", error);
    return false;
  }
}
