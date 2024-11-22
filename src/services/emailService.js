import emailjs from 'emailjs-com';

const SERVICE_ID = 'service_wuj6vrq';
const TEMPLATE_ID = 'template_99btfre';
const USER_ID = 'QkoVGr3T96Q61dZrw';

export const sendEmail = async (toEmail, subject, message) => {
    const templateParams = {
        to_email: toEmail,
        subject: subject,
        message: message,
        from_name: 'Hostel Management'
    };

    try {
        await emailjs.send(SERVICE_ID, TEMPLATE_ID, templateParams, USER_ID);
        console.log("Email sent successfully");
    } catch (error) {
        console.error('Error sending email:', error);
        throw new Error('Failed to send email: ' + error.text);
    }
};
