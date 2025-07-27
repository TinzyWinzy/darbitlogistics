project:
  name: Dar Logistics SMS Tracking System
  description: |
    An internal logistics system that allows operators to update shipment checkpoint status,
    triggering automatic SMS notifications to customers. Built using Vite + postgres +
  version: MVP-1.0
  priority_features:
    - SMS notification on checkpoint update
    - Operator dashboard
    - Customer-facing tracking page
    - Comprehensive logistics tracking

stack:
  frontend:
    framework: Vite
    language: ReactJS
    styling: Tailwind CSS
    hosting: Vercel
  backend:
    database: Supabase
    realtime: Supabase Realtime
    auth: Supabase Auth (optional)
    serverless: Supabase Edge Functions or Vercel Functions
  sms_api:
    provider: Africa's Talking
    alt_provider: Twilio
    region: Zimbabwe (preferred)

env_variables:
  AT_USERNAME: your_africas_talking_username
  AT_API_KEY: your_africas_talking_api_key
  AT_SENDER_ID: DarLogistics
  SUPABASE_URL: your_supabase_project_url
  SUPABASE_ANON_KEY: your_supabase_anon_key

data_model:
  deliveries:
    fields:
      - trackingId: string
        validation: unique, auto-generated
      - customerName: string
        validation: required
      - phoneNumber: string
        validation: required, Zimbabwe format
      - currentStatus: string
        validation: required
      - bookingReference: string
        validation: required, unique
      - loadingPoint: string
        validation: required
      - commodity: string
        validation: required
      - containerCount: number
        validation: required, positive integer
      - tonnage: number
        validation: required, positive number
      - destination: string
        validation: required
      - checkpoints: array
        structure:
          - location: string
          - timestamp: ISODate
          - operator: string
          - comment: string (optional)
      - driverDetails:
          - name: string
          - vehicleReg: string

functions:
  updateCheckpoint:
    description: Update checkpoint and trigger SMS
    steps:
      - Fetch delivery by trackingId
      - Append new checkpoint to checkpoints array
      - Update currentStatus field
      - Format SMS message
      - Call sendSMS(phoneNumber, message)
  sendSMS:
    provider: Africa's Talking
    parameters:
      - to: phone number
      - message: string
    logic:
      - Initialize SDK with AT_USERNAME and AT_API_KEY
      - Call SMS.send({ to: [phone], message })

frontend_pages:
  OperatorDashboard:
    features:
      - List active deliveries with expanded logistics info
      - Create new delivery with comprehensive details
      - Select and update delivery checkpoint
      - Submit checkpoint update form
    validation:
      - All required fields must be filled
      - Booking reference must be unique
      - Container count must be positive integer
      - Tonnage must be positive number
  TrackDelivery:
    features:
      - Input tracking ID or booking reference
      - Display current status and logistics details
      - Show timeline of checkpoints
      - Last updated timestamp

testing:
  scenarios:
    - Create delivery entry with complete logistics data
    - Validate required fields and formats
    - Update checkpoint from dashboard
    - Verify SMS received on mobile
    - Track order using both tracking ID and booking reference 