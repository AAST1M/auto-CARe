import nodemailer from 'nodemailer';

// Create a test account for Nodemailer if real credentials aren't provided
let transporter: nodemailer.Transporter | null = null;

const initMailer = async () => {
  if (!transporter) {
    // Generate test SMTP service account from ethereal.email
    const testAccount = await nodemailer.createTestAccount();

    transporter = nodemailer.createTransport({
      host: 'smtp.ethereal.email',
      port: 587,
      secure: false, // true for 465, false for other ports
      auth: {
        user: testAccount.user, // generated ethereal user
        pass: testAccount.pass, // generated ethereal password
      },
    });
    console.log('✉️  Ethereal Test Mailer Initialized');
  }
  return transporter;
};

export const sendWelcomeEmail = async (email: string, name: string, role: string) => {
  try {
    const mailer = await initMailer();

    let roleMessage = '';
    switch (role) {
      case 'WINCH_DRIVER':
        roleMessage = 'We are excited to have you on board as a Winch Driver! Turn on your status to online to start receiving rescue requests in your area.';
        break;
      case 'WORKSHOP_OWNER':
        roleMessage = 'Welcome to the Auto-Care network! Your workshop can now be discovered by thousands of stranded drivers.';
        break;
      default:
        roleMessage = 'Get ready to experience the ultimate AI Auto Doctor and connect with top-tier workshops and rescue drivers.';
    }

    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #f8fafc; padding: 20px; border-radius: 12px; border: 1px solid #e2e8f0;">
        <h1 style="color: #0f172a; text-align: center;">Welcome to Auto-Care AI! 🚗</h1>
        <p style="color: #334155; font-size: 16px;">Hello <strong>${name}</strong>,</p>
        <p style="color: #334155; font-size: 16px;">Thank you for registering for Auto-Care AI. ${roleMessage}</p>
        
        <div style="background-color: #ffffff; padding: 15px; border-radius: 8px; margin-top: 20px;">
          <h3 style="color: #0f172a; margin-top: 0;">What's next?</h3>
          <ul style="color: #334155;">
            <li>Complete your profile</li>
            <li>Explore the AI Doctor</li>
            <li>Check out the Live Map</li>
          </ul>
        </div>
        
        <p style="color: #64748b; font-size: 14px; text-align: center; margin-top: 30px;">
          If you have any questions, feel free to reply to this email. We're here to help!
        </p>
      </div>
    `;

    const info = await mailer.sendMail({
      from: '"Auto-Care AI" <noreply@autocare.ai>',
      to: email,
      subject: 'Welcome to Auto-Care AI! 🎉',
      text: `Hello ${name}, welcome to Auto-Care AI! ${roleMessage}`, // plain text body
      html: htmlContent, // html body
    });

    console.log('✅ Welcome email sent to: %s', email);
    console.log('🔗 Preview URL: %s', nodemailer.getTestMessageUrl(info));
    
  } catch (error) {
    console.error('Error sending welcome email:', error);
  }
};

export const sendPasswordResetEmail = async (email: string, name: string, resetLink: string) => {
  try {
    const mailer = await initMailer();

    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #f8fafc; padding: 20px; border-radius: 12px; border: 1px solid #e2e8f0;">
        <h1 style="color: #0f172a; text-align: center;">Password Reset Request 🔐</h1>
        <p style="color: #334155; font-size: 16px;">Hello <strong>${name}</strong>,</p>
        <p style="color: #334155; font-size: 16px;">We received a request to reset your password for your Auto-Care AI account. If you did not make this request, please ignore this email.</p>
        
        <div style="text-align: center; margin-top: 30px; margin-bottom: 30px;">
          <a href="${resetLink}" style="background-color: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px;">Reset Password</a>
        </div>
        
        <p style="color: #64748b; font-size: 14px; text-align: center;">
          Or copy and paste this link into your browser:<br/>
          <a href="${resetLink}" style="color: #3b82f6;">${resetLink}</a>
        </p>
        <p style="color: #64748b; font-size: 14px; text-align: center; margin-top: 30px;">
          This link will expire in 1 hour.
        </p>
      </div>
    `;

    const info = await mailer.sendMail({
      from: '"Auto-Care AI Support" <support@autocare.ai>',
      to: email,
      subject: 'Reset Your Password - Auto-Care AI',
      text: `Hello ${name}, please use this link to reset your password: ${resetLink} (Expires in 1 hour)`,
      html: htmlContent,
    });

    console.log('✅ Password Reset email sent to: %s', email);
    console.log('🔗 Reset Preview URL: %s', nodemailer.getTestMessageUrl(info));
    
  } catch (error) {
    console.error('Error sending password reset email:', error);
  }
};
