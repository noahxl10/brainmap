import twilio from 'twilio';

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const twilioPhoneNumber = process.env.TWILIO_PHONE_NUMBER;

if (!accountSid || !authToken || !twilioPhoneNumber) {
  throw new Error('Missing Twilio credentials in environment variables');
}

const client = twilio(accountSid, authToken);

export function generateVerificationCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export async function sendVerificationCode(phoneNumber: string, code: string): Promise<void> {
  try {
    await client.messages.create({
      body: `Your Canvas verification code is: ${code}. This code expires in 10 minutes.`,
      from: twilioPhoneNumber,
      to: phoneNumber,
    });
    console.log(`Verification code sent to ${phoneNumber}`);
  } catch (error) {
    console.error('Failed to send SMS:', error);
    throw new Error('Failed to send verification code');
  }
}