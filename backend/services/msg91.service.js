import { env } from '../config/env.js';
import { ApiError } from '../utils/api-error.js';

const MSG91_ENDPOINT =
  'https://api.msg91.com/api/v5/whatsapp/whatsapp-outbound-message/bulk/';

const REQUIRED_KEYS = ['authKey', 'integratedNumber', 'templateName', 'templateNamespace'];

/** True once every credential the send needs is present. */
export const isMsg91Configured = () => REQUIRED_KEYS.every((key) => Boolean(env.msg91[key]));

/**
 * Sends the approved WhatsApp OTP template. The code is the only body variable;
 * templates with a copy-code button also need it echoed as button_1.
 */
export const sendWhatsAppOtp = async ({ to, otp }) => {
  if (!isMsg91Configured()) {
    throw new ApiError(500, 'WhatsApp sending is not configured on the server');
  }

  const { authKey, integratedNumber, templateName, templateNamespace } = env.msg91;
  const code = String(otp);

  const components = { body_1: { type: 'text', value: code } };
  // MSG91 rejects the payload if the template declares a URL button and we omit it.
  if (env.msg91.buttonValue || templateName.includes('otp')) {
    components.button_1 = {
      type: 'text',
      subtype: 'url',
      value: env.msg91.buttonValue || code,
    };
  }

  const payload = {
    integrated_number: integratedNumber,
    content_type: 'template',
    payload: {
      messaging_product: 'whatsapp',
      type: 'template',
      template: {
        name: templateName,
        namespace: templateNamespace,
        language: { code: env.msg91.languageCode, policy: env.msg91.languagePolicy },
        to_and_components: [{ to: [to], components }],
      },
    },
  };

  let res;
  try {
    res = await fetch(MSG91_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', accept: 'application/json', authkey: authKey },
      body: JSON.stringify(payload),
    });
  } catch {
    throw ApiError.badGateway('Could not reach WhatsApp provider. Please try again.');
  }

  const body = await res.json().catch(() => null);

  // MSG91 can answer 200 with a failure status in the body, so check both.
  if (!res.ok || (body?.status && body.status !== 'success')) {
    console.error('[msg91] send failed', res.status, body);
    throw ApiError.badGateway(body?.message || body?.err || 'Could not send the WhatsApp OTP');
  }

  return body;
};
