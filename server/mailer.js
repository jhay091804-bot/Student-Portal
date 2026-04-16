const axios = require('axios');
require('dotenv').config();

/**
 * Send Verification Email using EmailJS REST API
 * (Bypasses SMTP port blocks on Railway/Heroku)
 */
const sendVerificationEmail = async (email, token, name) => {
  const verificationLink = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/verify-email/${token}`;

  const payload = {
    service_id: process.env.EMAILJS_SERVICE_ID,
    template_id: process.env.EMAILJS_TEMPLATE_ID,
    user_id: process.env.EMAILJS_PUBLIC_KEY,
    accessToken: process.env.EMAILJS_PRIVATE_KEY,
    template_params: {
      user_name: name,
      user_email: email,
      verification_link: verificationLink
    }
  };

  try {
    const response = await axios.post('https://api.emailjs.com/api/v1.0/email/send', payload);
    
    if (response.status === 200) {
      console.log('✅ EmailJS Sent Successfully to:', email);
      return { success: true, message: 'Email sent via EmailJS' };
    } else {
      throw new Error(`EmailJS Error: ${response.data}`);
    }
  } catch (error) {
    console.error('❌ EmailJS API Error:', error.response?.data || error.message);
    return { 
      success: false, 
      message: error.response?.data || error.message,
      code: error.response?.status || 'API_ERROR'
    };
  }
};

module.exports = { sendVerificationEmail };
