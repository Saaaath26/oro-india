const nodemailer = require('nodemailer');

// Create email transporter
const createTransporter = () => {
    return nodemailer.createTransport({
        host: process.env.EMAIL_HOST,
        port: process.env.EMAIL_PORT,
        secure: false, // true for 465, false for other ports
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS
        },
        tls: {
            rejectUnauthorized: false
        }
    });
};

// Send OTP email
const sendOTPEmail = async (email, otp) => {
    try {
        // For development - just log the OTP instead of sending email
        if (process.env.NODE_ENV !== 'production' || !process.env.EMAIL_USER || process.env.EMAIL_USER === 'your-email@gmail.com') {
            console.log(`🔐 OTP for ${email}: ${otp}`);
            console.log('📧 Email not configured - OTP logged to console for development');
            return true;
        }

        const transporter = createTransporter();
        
        const mailOptions = {
            from: process.env.EMAIL_FROM,
            to: email,
            subject: 'Oro India - Email Verification Code',
            html: `
                <!DOCTYPE html>
                <html>
                <head>
                    <meta charset="utf-8">
                    <meta name="viewport" content="width=device-width, initial-scale=1.0">
                    <title>Email Verification - Oro India</title>
                    <style>
                        body { font-family: 'Arial', sans-serif; margin: 0; padding: 0; background-color: #f5f5f5; }
                        .container { max-width: 600px; margin: 0 auto; background-color: white; }
                        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; }
                        .header h1 { color: white; margin: 0; font-size: 28px; }
                        .content { padding: 40px 30px; text-align: center; }
                        .otp-box { background: #f8f9ff; border: 2px solid #667eea; border-radius: 10px; padding: 20px; margin: 20px 0; }
                        .otp-code { font-size: 32px; font-weight: bold; color: #667eea; letter-spacing: 5px; margin: 10px 0; }
                        .footer { background: #f8f9fa; padding: 20px; text-align: center; color: #666; font-size: 14px; }
                        .button { display: inline-block; background: linear-gradient(45deg, #667eea, #764ba2); color: white; padding: 12px 30px; text-decoration: none; border-radius: 25px; margin: 20px 0; }
                    </style>
                </head>
                <body>
                    <div class="container">
                        <div class="header">
                            <h1>🎓 Oro India</h1>
                            <p style="color: white; margin: 10px 0 0 0;">CBSE Class 10 Preparation Platform</p>
                        </div>
                        <div class="content">
                            <h2 style="color: #333; margin-bottom: 20px;">Verify Your Email Address</h2>
                            <p style="color: #666; font-size: 16px; line-height: 1.6;">
                                Welcome to Oro India! Please use the verification code below to complete your registration:
                            </p>
                            <div class="otp-box">
                                <p style="margin: 0; color: #667eea; font-weight: 600;">Your Verification Code</p>
                                <div class="otp-code">${otp}</div>
                                <p style="margin: 0; color: #999; font-size: 14px;">This code expires in 5 minutes</p>
                            </div>
                            <p style="color: #666; font-size: 14px; margin-top: 30px;">
                                If you didn't request this verification code, please ignore this email.
                            </p>
                        </div>
                        <div class="footer">
                            <p><strong>Oro India</strong> - Empowering CBSE Class 10 Students</p>
                            <p>Founded by Deepthi Adiraju | Backed by BITS Pilani Technology Business Incubator</p>
                        </div>
                    </div>
                </body>
                </html>
            `
        };

        const result = await transporter.sendMail(mailOptions);
        console.log('✅ OTP email sent successfully:', result.messageId);
        return true;
    } catch (error) {
        console.error('❌ Error sending OTP email:', error);
        
        // For development, still log the OTP even if email fails
        console.log(`🔐 OTP for ${email}: ${otp} (Email failed, but OTP is valid)`);
        return true; // Return true so registration can continue
    }
};

// Send welcome email
const sendWelcomeEmail = async (email, name) => {
    try {
        const transporter = createTransporter();
        
        const mailOptions = {
            from: process.env.EMAIL_FROM,
            to: email,
            subject: 'Welcome to Oro India - Your Learning Journey Begins!',
            html: `
                <!DOCTYPE html>
                <html>
                <head>
                    <meta charset="utf-8">
                    <meta name="viewport" content="width=device-width, initial-scale=1.0">
                    <title>Welcome to Oro India</title>
                    <style>
                        body { font-family: 'Arial', sans-serif; margin: 0; padding: 0; background-color: #f5f5f5; }
                        .container { max-width: 600px; margin: 0 auto; background-color: white; }
                        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; }
                        .header h1 { color: white; margin: 0; font-size: 28px; }
                        .content { padding: 40px 30px; }
                        .feature { margin: 20px 0; padding: 15px; background: #f8f9ff; border-radius: 8px; }
                        .footer { background: #f8f9fa; padding: 20px; text-align: center; color: #666; font-size: 14px; }
                        .button { display: inline-block; background: linear-gradient(45deg, #667eea, #764ba2); color: white; padding: 12px 30px; text-decoration: none; border-radius: 25px; margin: 20px 0; }
                    </style>
                </head>
                <body>
                    <div class="container">
                        <div class="header">
                            <h1>🎓 Welcome to Oro India!</h1>
                        </div>
                        <div class="content">
                            <h2 style="color: #333;">Hello ${name}! 👋</h2>
                            <p style="color: #666; font-size: 16px; line-height: 1.6;">
                                Congratulations on joining Oro India, the most comprehensive CBSE Class 10 preparation platform! 
                                You're now part of a community dedicated to academic excellence.
                            </p>
                            
                            <h3 style="color: #667eea;">🚀 What's Next?</h3>
                            <div class="feature">
                                <strong>📚 Explore Subjects:</strong> Start with Science or Social Science chapters
                            </div>
                            <div class="feature">
                                <strong>🎯 Take Diagnostic Tests:</strong> Find your starting difficulty level
                            </div>
                            <div class="feature">
                                <strong>🧠 AI-Powered Summaries:</strong> Get personalized chapter explanations
                            </div>
                            <div class="feature">
                                <strong>📈 Track Progress:</strong> Monitor your improvement across 5 difficulty levels
                            </div>
                            
                            <div style="text-align: center;">
                                <a href="http://localhost:3001" class="button">Start Learning Now</a>
                            </div>
                        </div>
                        <div class="footer">
                            <p><strong>Oro India</strong> - Your Path to CBSE Excellence</p>
                            <p>Founded by Deepthi Adiraju | Backed by BITS Pilani Technology Business Incubator</p>
                        </div>
                    </div>
                </body>
                </html>
            `
        };

        const result = await transporter.sendMail(mailOptions);
        console.log('✅ Welcome email sent successfully:', result.messageId);
        return true;
    } catch (error) {
        console.error('❌ Error sending welcome email:', error);
        // Don't throw error for welcome email failure
        return false;
    }
};

module.exports = {
    sendOTPEmail,
    sendWelcomeEmail
};