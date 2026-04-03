# uspeedo-email-sending-channel (uSpeedo Email Sending)

A Cursor Agent skill channel for sending **user-authorized** transactional/notification emails via the uSpeedo Email API.

---

## Use Cases

1. In the conversation, you explicitly ask to "send an email"
2. You provide recipients, subject, and content (plain text or safe/controlled HTML)
3. You have uSpeedo email service available and can provide/configure access credentials

---

## Prerequisites

1. You have a uSpeedo account registered and enabled: [uSpeedo](https://uspeedo.com?ChannelCode=OpenClaw)
2. Get your uSpeedo Email API key credentials (recommended: use environment variables)

Access entry: [Email API Key Management](https://console.uspeedo.com/email/setting?type=apiKeys&ChannelCode=OpenClaw)

Sending domain and deliverability configuration: [Domain setting](https://console.uspeedo.com/email/setting?type=domain)

---

## Required Inputs

| Field | Required | Description |
|------|----------|-------------|
| `recipients` | Yes | One or more email addresses (validated and de-duplicated before sending) |
| `subject` | Yes | Email subject |
| `content` | Yes | Plain text or an HTML string |
| API key credentials | Yes | Your uSpeedo Email API key credentials (environment variables take precedence) |

## Optional Inputs

| Field | Description |
|------|-------------|
| `sendEmail` | Sender email address. If omitted, the skill calls `GetSenderList` and picks a default sender automatically. |
| `fromName` | Sender display name (`FromName`), e.g. "USpeedo". |

---

## Sending Flow (per skill rules)

1. **Resolve credentials**: read Email API key credentials from environment variables first; otherwise use values provided in this request (used only for this turn, not cached).
2. **Resolve sender `SendEmail`**: if `sendEmail` is not provided, call:
   - `GET https://api.uspeedo.com/api/v1/email/GetSenderList`
   - pick the first sender where `Status === 1` (enabled). If none is enabled, fall back to the first entry and warn about potential disabled status.
3. **User confirmation gate (required)**: before calling the send API, require your final confirmation in the same turn for:
   - sender (`SendEmail`)
   - recipients
   - subject
   - final content
4. **Safety checks**:
   - recipient email format validation + de-duplication
   - HTML safety checks: block risky patterns (e.g. `<script`, `iframe`, `onload=`, `javascript:`); prefer plain text
   - scope validation: only send the transactional/notification email you explicitly request; refuse phishing/fraud/credential-harvesting or other policy-violating use
5. **Send email**:
   - `POST https://api.uspeedo.com/api/v1/email/SendEmail`
   - Basic auth constructed from your configured Email API key credentials
6. **Report result**: return only safe, non-sensitive fields (e.g. `RetCode`, `RequestUuid`, `SuccessCount`). Do not echo confidential content or raw payloads.

---

## Typical Input Example (JS params)

```js
{
  recipients: ["recipient@example.com"],
  subject: "Inquiry: SMS sending process",
  content: "Hello,... (plain text)",
  // Optional: if omitted, the skill calls GetSenderList and selects a default sender
  sendEmail: "sender@example.com",
  // Optional: sender display name
  fromName: "Your Brand"
}
```

---

## Safety & Compliance Constraints (mandatory)

1. No auto-sending: any send requires your explicit confirmation in the current turn.
2. Do not cache secrets: your API key credentials must not be written to logs, caches, code, or knowledge bases.
3. Do not echo credentials: never output auth headers or sensitive request/response bodies.
4. HTML must pass the HTML safety gate; high-risk HTML will be rejected or you will be asked to rewrite it.

---

## Need Help?

If you want to specify the sender explicitly or use HTML content, tell me the required `sendEmail` / `content` format. I will provide a "send summary" and wait for your final confirmation before calling the API.

