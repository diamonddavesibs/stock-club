import { Resend } from 'resend';

// Initialize Resend only if API key is available
const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

export async function sendPasswordResetEmail(
    email: string,
    name: string,
    resetToken: string
): Promise<void> {
    if (!resend) {
        console.log('Resend API key not configured. Would send password reset email to:', email);
        return;
    }

    const resetUrl = `${process.env.NEXTAUTH_URL}/reset-password?token=${resetToken}`;

    try {
        await resend.emails.send({
            from: process.env.RESEND_FROM_EMAIL || 'noreply@dfdii.com',
            to: email,
            subject: 'Reset Your DFDII Stock Club Password',
            html: `
                <!DOCTYPE html>
                <html>
                <head>
                    <style>
                        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                        .header { background: #3b82f6; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
                        .content { padding: 30px; background: #f9fafb; }
                        .button {
                            display: inline-block;
                            padding: 12px 24px;
                            background: #3b82f6;
                            color: white !important;
                            text-decoration: none;
                            border-radius: 5px;
                            margin: 20px 0;
                        }
                        .footer { padding: 20px; text-align: center; color: #666; font-size: 12px; }
                    </style>
                </head>
                <body>
                    <div class="container">
                        <div class="header">
                            <h1>🔐 Password Reset Request</h1>
                        </div>
                        <div class="content">
                            <p>Hi ${name},</p>
                            <p>We received a request to reset your password for your DFDII Stock Club account.</p>
                            <p>Click the button below to reset your password:</p>
                            <a href="${resetUrl}" class="button">Reset Password</a>
                            <p>Or copy and paste this link into your browser:</p>
                            <p style="word-break: break-all; color: #3b82f6;">${resetUrl}</p>
                            <p><strong>This link will expire in 24 hours.</strong></p>
                            <p>If you didn't request this password reset, you can safely ignore this email.</p>
                            <p>Best regards,<br>DFDII Stock Club Team</p>
                        </div>
                        <div class="footer">
                            <p>DFDII Stock Club • Investment Portfolio Management</p>
                            <p>This is an automated email. Please do not reply.</p>
                        </div>
                    </div>
                </body>
                </html>
            `,
        });
    } catch (error) {
        console.error('Failed to send password reset email:', error);
        throw new Error('Failed to send password reset email');
    }
}

export async function sendWelcomeEmail(
    email: string,
    name: string,
    temporaryPassword: string
): Promise<void> {
    if (!resend) {
        console.log('Resend API key not configured. Would send welcome email to:', email);
        console.log('Temporary password:', temporaryPassword);
        return;
    }

    const loginUrl = `${process.env.NEXTAUTH_URL}/login`;

    try {
        await resend.emails.send({
            from: process.env.RESEND_FROM_EMAIL || 'noreply@dfdii.com',
            to: email,
            subject: 'Welcome to DFDII Stock Club',
            html: `
                <!DOCTYPE html>
                <html>
                <head>
                    <style>
                        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                        .header { background: #10b981; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
                        .content { padding: 30px; background: #f9fafb; }
                        .credentials {
                            background: white;
                            border: 2px solid #3b82f6;
                            padding: 15px;
                            margin: 20px 0;
                            border-radius: 5px;
                        }
                        .button {
                            display: inline-block;
                            padding: 12px 24px;
                            background: #10b981;
                            color: white !important;
                            text-decoration: none;
                            border-radius: 5px;
                            margin: 20px 0;
                        }
                        .warning {
                            background: #fef3c7;
                            border-left: 4px solid #f59e0b;
                            padding: 10px;
                            margin: 15px 0;
                        }
                        .footer { padding: 20px; text-align: center; color: #666; font-size: 12px; }
                    </style>
                </head>
                <body>
                    <div class="container">
                        <div class="header">
                            <h1>🎉 Welcome to DFDII Stock Club!</h1>
                        </div>
                        <div class="content">
                            <p>Hi ${name},</p>
                            <p>Your account has been created successfully! You can now access the DFDII Stock Club investment portfolio platform.</p>

                            <div class="credentials">
                                <h3>Your Login Credentials:</h3>
                                <p><strong>Email:</strong> ${email}</p>
                                <p><strong>Temporary Password:</strong> <code style="background: #f3f4f6; padding: 4px 8px; border-radius: 3px; font-size: 14px;">${temporaryPassword}</code></p>
                            </div>

                            <div class="warning">
                                <strong>⚠️ Important:</strong> Please change your password after your first login for security.
                            </div>

                            <a href="${loginUrl}" class="button">Login Now</a>

                            <h3>Getting Started:</h3>
                            <ol>
                                <li>Click the "Login Now" button above</li>
                                <li>Enter your email and temporary password</li>
                                <li>Go to Settings to change your password</li>
                                <li>Import your Schwab portfolio data to get started</li>
                            </ol>

                            <p>If you have any questions, please contact your club administrator.</p>

                            <p>Best regards,<br>DFDII Stock Club Team</p>
                        </div>
                        <div class="footer">
                            <p>DFDII Stock Club • Investment Portfolio Management</p>
                            <p>This is an automated email. Please do not reply.</p>
                        </div>
                    </div>
                </body>
                </html>
            `,
        });
    } catch (error) {
        console.error('Failed to send welcome email:', error);
        throw new Error('Failed to send welcome email');
    }
}
