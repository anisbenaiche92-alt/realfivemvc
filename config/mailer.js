// FICHIER: mailer.js
const nodemailer = require('nodemailer');
require('dotenv').config();

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

const sendEmail = async (to, subject, title, message, actionUrl = null, actionLabel = null, code = null) => {
    const htmlContent = `
    <div style="background-color: #050505; color: #ffffff; font-family: 'Arial', sans-serif; padding: 40px; text-align: center; border-radius: 10px;">
        <h1 style="color: #4DFF99; font-size: 28px; text-transform: uppercase; letter-spacing: 2px; margin-bottom: 0;">REALFIVE ID</h1>
        <div style="background-color: #111111; padding: 30px; border: 1px solid #4DFF99; border-radius: 8px; margin-top: 20px;">
            <h2 style="color: #ffffff; font-size: 20px; text-transform: uppercase;">${title}</h2>
            <p style="color: #cccccc; font-size: 16px; line-height: 1.6; margin-top: 15px;">${message}</p>
            
            ${code ? `
                <div style="background-color: #4DFF99; color: #000000; font-size: 32px; font-weight: bold; padding: 15px; margin: 25px 0; border-radius: 5px; letter-spacing: 10px;">
                    ${code}
                </div>
            ` : ''}

            ${actionUrl ? `
                <div style="margin: 30px 0;">
                    <a href="${actionUrl}" style="display: inline-block; background-color: #4DFF99; color: #000000; font-weight: bold; padding: 18px 35px; border-radius: 5px; text-decoration: none; text-transform: uppercase; font-size: 14px;">
                        ${actionLabel}
                    </a>
                </div>
            ` : ''}

            <p style="color: #666666; font-size: 12px; margin-top: 20px; border-top: 1px solid #333; padding-top: 20px;">
                Ceci est un message de sécurité automatique. Si vous n'êtes pas à l'origine de cette demande, ignorez cet email.
            </p>
        </div>
        <p style="color: #4DFF99; font-size: 11px; margin-top: 30px; opacity: 0.6;">© 2026 REALFIVE ARENA - Le Foot à 5 Nouvelle Génération</p>
    </div>
    `;

    try {
        await transporter.sendMail({ 
            from: '"RealFive Security" <no-reply@realfive.com>', 
            to, 
            subject: `RealFive | ${subject}`, 
            html: htmlContent 
        });
        console.log(`📧 Email Premium envoyé à ${to}`);
    } catch (e) { console.error("Erreur Email:", e); }
};

module.exports = { sendEmail };