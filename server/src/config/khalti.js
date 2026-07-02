const DEFAULT_KHALTI_BASE_URL = "https://dev.khalti.com/api/v2";

function cleanBaseUrl(value) {
  return String(value || DEFAULT_KHALTI_BASE_URL).replace(/\/+$/, "");
}

export function khaltiConfig() {
  const secretKey = process.env.KHALTI_SECRET_KEY || process.env.KHALTI_SANDBOX_SECRET_KEY;
  const baseUrl = cleanBaseUrl(process.env.KHALTI_BASE_URL || process.env.KHALTI_API_URL);

  return {
    baseUrl,
    secretKey,
    isConfigured: Boolean(secretKey),
    missingMessage: "Khalti sandbox secret key is not configured on the server"
  };
}

export function khaltiHeaders() {
  const { secretKey } = khaltiConfig();

  return {
    Authorization: `Key ${secretKey}`,
    "Content-Type": "application/json"
  };
}

export async function khaltiPost(path, payload) {
  const config = khaltiConfig();
  if (!config.isConfigured) {
    const error = new Error(config.missingMessage);
    error.statusCode = 503;
    error.code = "KHALTI_NOT_CONFIGURED";
    throw error;
  }

  let response;
  try {
    response = await fetch(`${config.baseUrl}${path}`, {
      method: "POST",
      headers: khaltiHeaders(),
      body: JSON.stringify(payload)
    });
  } catch (error) {
    error.statusCode = 502;
    error.message = "Could not reach Khalti. Check the Khalti API URL and internet connection.";
    throw error;
  }

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const error = new Error(data.detail || data.error_key || data.message || "Khalti request failed");
    error.statusCode = response.status;
    error.data = data;
    throw error;
  }

  return data;
}
