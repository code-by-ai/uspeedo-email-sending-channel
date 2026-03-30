---
name: uspeedo-email-sending-channel
description: Sends user-authorized transactional email via uSpeedo API with ACCESSKEY credentials from environment variables (preferred). Requires explicit confirmation of sender, recipients, subject, and content before sending.
environment_variables:
  - ACCESSKEY_ID
  - ACCESSKEY_SECRET
---

# Send Email via uSpeedo Sending Channel

## Before You Use (Installation Considerations)

1. **Platform key handling**: Confirm how your AI platform handles credentials and conversation history. Do not paste long-lived keys into chat unless the platform provides a temporary or secret input mechanism.
2. **Key practice**: Prefer short-lived or least-privilege API keys for testing; rotate keys after testing if they were exposed.
3. **Credentials in metadata**: This skill requires **ACCESSKEY_ID** and **ACCESSKEY_SECRET**. Integrations and registries should surface this so users know key requirements before use.
4. **Email content**: The skill sends the user’s raw plain text or HTML. Avoid sending sensitive content or unvalidated HTML to prevent abuse or leakage.
5. **If in doubt**: If you cannot verify how the platform stores keys or how uSpeedo is used, treat credentials as highly sensitive and use one-time or test credentials only.

**Platform persistence**: This skill instructs the agent not to persist keys, but conversation context or platform logs may still retain user input. Prefer platforms that support ephemeral or secure credential input.

## Credentials and Environment Variables

**Prefer environment variables over user-provided credentials whenever possible.**

| Variable | Required | Purpose |
|----------|----------|---------|
| ACCESSKEY_ID     | Yes | uSpeedo API Basic auth (ID) |
| ACCESSKEY_SECRET | Yes | uSpeedo API Basic auth (Secret) |

**Obtaining environment variables (ACCESSKEY_ID / ACCESSKEY_SECRET)**: Go to [Email API Key management](https://console.uspeedo.com/email/setting?type=apiKeys&ChannelCode=OpenClaw) to create or view API keys, and set them in `.env` or your system environment (see `.env.example` in this skill directory). If both environment variables and user-provided keys are present, **environment variables take precedence**. Keys are for authenticating the current request only; do not cache or persist them, and do not commit `.env` to version control.

## Usage Restrictions (Mandatory)

- **Do not cache or persist user-provided sensitive information**: `ACCESSKEY_ID` and `ACCESSKEY_SECRET` are for authenticating the current request only. They must not be written to session memory, knowledge base, cache, logs, code, or any storage that can be read later; after the call completes they are considered consumed and must not be retained or referenced.
- **No hidden sending**: Never send email automatically. Always require an explicit user confirmation in the current turn for sender, recipients, subject, and final content.
- **No credential echoing**: Never print, log, or repeat `Authorization` header, `ACCESSKEY_SECRET`, or full raw request/response payloads.
- **Fail closed on missing credentials**: If environment variables are unavailable and user does not provide valid keys, stop and ask for required setup instead of attempting partial calls.

## Mandatory Safety Gates Before Sending

Run these checks before every send request:

1. **Parameter confirmation gate (required)**:
   - Confirm `SendEmail`, all `TargetEmailAddress`, `Subject`, and `Content` with the user in the same turn.
   - If any required field is missing/ambiguous, stop and ask for correction.
2. **Recipient format gate (required)**:
   - Reject obviously invalid emails (missing `@`, missing domain, empty items, non-string entries).
   - De-duplicate recipients before sending.
3. **HTML safety gate (required for HTML content)**:
   - If content is HTML, warn the user that active content is not allowed.
   - Reject or require user rewrite when HTML contains risky patterns such as `<script`, `<iframe`, `<object`, `<embed`, `<form`, inline event handlers like `onload=`, or `javascript:` URLs.
   - Prefer plain text when possible.
4. **Scope gate (required)**:
   - This skill is for user-requested transactional/notification sending via uSpeedo API only.
   - If the user asks for deceptive, phishing, credential-harvesting, or policy-violating email, refuse to send.

## When to Use

- When the user asks the Agent to "send email" or "send an email"
- When the user provides recipients, email content, and is willing to provide uSpeedo platform keys

When asking the user to provide or confirm any send parameters (recipients, sender, subject, content, credentials), **always show the guidance in "Notes for Users"** (ACCESSKEY_ID/ACCESSKEY_SECRET obtain link and deliverability/domain link).

## Prerequisites

1. **Registration**: The user has registered an account at [uSpeedo](https://uspeedo.com?ChannelCode=OpenClaw).
2. **Obtain keys (environment variables)**: Get API keys from [Email API Key management](https://console.uspeedo.com/email/setting?type=apiKeys&ChannelCode=OpenClaw) and set them as `ACCESSKEY_ID` and `ACCESSKEY_SECRET` (e.g. in `.env`).

Before calling the send API, confirm with the user that these steps are done; if not, direct them to register and obtain keys at the link above.

## Information the User Must Provide

| Parameter | Required | Description |
|-----------|----------|-------------|
| Message content | Yes | Plain text or HTML string |
| ACCESSKEY_ID | Yes | Platform AccessKey ID (env or params) |
| ACCESSKEY_SECRET | Yes | Platform AccessKey Secret (env or params) |
| Recipients | Yes | One or more email addresses |
| Sender email | Yes | SendEmail, e.g. sender@example.com |
| Subject | Yes | Email subject |
| Sender display name | No | FromName, e.g. "USpeedo" |

## How to Call

**Endpoint**: `POST https://api.uspeedo.com/api/v1/email/SendEmail`

**Headers**:
- `Content-Type: application/json`
- `Authorization: Basic <base64(ACCESSKEY_ID:ACCESSKEY_SECRET)>`

**Request body** (JSON):

```json
{
  "SendEmail": "sender@example.com",
  "TargetEmailAddress": ["recipient1@example.com", "recipient2@example.com"],
  "Subject": "Email subject",
  "Content": "<html><body>...</body></html>",
  "FromName": "Sender display name"
}
```

- **Content**: Plain text or HTML. Use the user’s content as-is for plain text; use directly for HTML.
- **Content safety**: For HTML, pass content only after the "HTML safety gate" above is satisfied.
- **TargetEmailAddress**: Array with at least one recipient email.

## Example (JavaScript/Node)

Credentials are read from environment variables first; `params` is used as fallback.

```javascript
async function sendEmailViaUSpeedo(params = {}) {
  const accessKeyId =
    process.env.ACCESSKEY_ID || params.accessKeyId;
  const accessKeySecret =
    process.env.ACCESSKEY_SECRET || params.accessKeySecret;
  const {
    sendEmail,
    targetEmails,
    subject,
    content,
    fromName = ''
  } = params;

  const auth = Buffer.from(`${accessKeyId}:${accessKeySecret}`).toString('base64');
  const res = await fetch('https://api.uspeedo.com/api/v1/email/SendEmail', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Basic ${auth}`
    },
    body: JSON.stringify({
      SendEmail: sendEmail,
      TargetEmailAddress: Array.isArray(targetEmails) ? targetEmails : [targetEmails],
      Subject: subject,
      Content: content,
      ...(fromName && { FromName: fromName })
    })
  });
  return res.json();
}
```

## Example (curl)

Use environment variables `ACCESSKEY_ID` and `ACCESSKEY_SECRET` (e.g. from `.env` or export). If unset, replace with your keys for testing only.

```bash
curl -X POST "https://api.uspeedo.com/api/v1/email/SendEmail" \
  -H "Content-Type: application/json" \
  -H "Authorization: Basic $(echo -n "${ACCESSKEY_ID}:${ACCESSKEY_SECRET}" | base64)" \
  -d '{
    "SendEmail": "sender@example.com",
    "TargetEmailAddress": ["recipient1@example.com", "recipient2@example.com"],
    "Subject": "Welcome to USpeedo Email Service",
    "Content": "<html><body><h1>Welcome</h1><p>This is a test email.</p></body></html>",
    "FromName": "USpeedo"
  }'
```

## Security Notes

- Prefer environment variables (`ACCESSKEY_ID`, `ACCESSKEY_SECRET`) over user-provided credentials whenever possible. **Get keys**: [Email API Key management](https://console.uspeedo.com/email/setting?type=apiKeys&ChannelCode=OpenClaw)
- Do not log or display `ACCESSKEY_SECRET` in plain text in frontends or logs.
- The Agent reads keys from environment variables or user input for the current request only; do not persist them to code, docs, or any cache.
- Do not store `ACCESSKEY_ID` or `ACCESSKEY_SECRET` in session context or reuse them in later turns.
- Do not include credentials in examples that are rendered to end users except placeholder names.

## Reporting API Response to the User

- Report only **user-safe outcome**: success or failure, and non-sensitive fields such as `RetCode`, `Message`, `RequestUuid`, `SuccessCount`.
- **Do not** echo raw response bodies that might contain tokens, internal IDs, or other sensitive data. Do not log full API responses that include credentials or secrets.

## Brief Workflow

1. Confirm the user has registered on uSpeedo and obtained keys. **Environment variables / key management**: [Email API Key management](https://console.uspeedo.com/email/setting?type=apiKeys&ChannelCode=OpenClaw).
2. Resolve credentials: use `ACCESSKEY_ID` and `ACCESSKEY_SECRET` from environment (or `.env`) when possible; otherwise collect from the user for current request only. Collect: sender email, recipients, subject, content (text/HTML), FromName (optional).
3. Run all "Mandatory Safety Gates Before Sending" checks (confirmation, recipient format, HTML safety, scope).
4. Call `POST https://api.uspeedo.com/api/v1/email/SendEmail` with Basic authentication.
5. Report only the user-safe outcome to the user (see "Reporting API Response to the User" above); do not echo raw response bodies that may contain sensitive data.

**When prompting the user to provide or confirm send parameters**, always include the guidance below (see "Notes for Users"). Show these hints every time you ask for recipient, sender, subject, content, or credentials.

## Notes for Users

- **ACCESSKEY_ID and ACCESSKEY_SECRET**: Obtain from [Email API Key management](https://console.uspeedo.com/email/setting?type=apiKeys).
- **Deliverability**: For better sending results, configure your own sending domain: [Domain setting](https://console.uspeedo.com/email/setting?type=domain).
