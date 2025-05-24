// src/lib/brevoClient.ts (or src/services/brevoClient.ts)
import * as Brevo from '@getbrevo/brevo';

if (!process.env.BREVO_API_KEY) {
  throw new Error('BREVO_API_KEY is not defined in environment variables');
}

// Configure API key authorization: api-key
const apiInstance = new Brevo.TransactionalEmailsApi();

// @ts-ignore Brevo SDK's ApiClient type might not be perfectly aligned, this is a common workaround
apiInstance.setApiKey(Brevo.TransactionalEmailsApiApiKeys.apiKey, process.env.BREVO_API_KEY);

export default apiInstance;