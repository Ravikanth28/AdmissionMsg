# WhatsApp Bulk Messaging Platform

## Environment Variables

### Server (.env in /server)

```env
# TiDB Database
TIDB_HOST=your-tidb-host
TIDB_PORT=4000
TIDB_USER=your-username
TIDB_PASSWORD=your-password
TIDB_DATABASE=admission_msg

# Cloudinary
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret

# Cerebras AI
CEREBRAS_API_KEY=your-cerebras-api-key

# WhatsApp Business Cloud API
WHATSAPP_TOKEN=your-whatsapp-token
WHATSAPP_PHONE_NUMBER_ID=your-phone-number-id
WHATSAPP_BUSINESS_ACCOUNT_ID=your-business-account-id

# Server
PORT=5000
NODE_ENV=development
```

## Setup

1. `npm run install:all`
2. Copy `.env.example` to `.env` in `/server` and fill in your credentials
3. `npm run dev`

## Features
- Upload CSV/Excel contacts
- Compose rich messages (text + video + PDF + images + docs)
- AI-powered message enhancement (Cerebras)
- Media storage on Cloudinary
- Batch sending with configurable delays
- Full campaign review before sending
- Real-time sending progress
- Success/failure reports with history
