# uSpeedo Email Skill

AI Skill for sending email through the uSpeedo Email API.

This skill allows AI agents to send email using the uSpeedo platform rather than the user's personal mailbox.

## Metadata (Packaging Consistency)

- Homepage: https://uspeedo.com
- Repository: https://github.com/code-by-ai/uspeedo-email-sending-channel
- Source: https://clawhub.ai/code-by-ai/uspeedo-email-sending-channel
- Required env vars: ACCESSKEY_ID, ACCESSKEY_SECRET
- Primary credential: ACCESSKEY_SECRET

## Features

- send transactional emails
- send marketing emails
- HTML or plain text content
- secure API authentication

## Requirements

You must have a uSpeedo account and API keys.

Get them here:

https://console.uspeedo.com/email/setting?type=apiKeys

## Credentials

Required environment variables:

ACCESSKEY_ID  
ACCESSKEY_SECRET

## API Endpoint

POST

https://api.uspeedo.com/api/v1/email/SendEmail

## Documentation

See `Skill.md` for full AI skill usage instructions.