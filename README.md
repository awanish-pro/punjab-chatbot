# Punjab Chatbot UI (Bharat Chatbot)

Conversational Municipal AI Assistant built for **PMIDC (Punjab Municipal Infrastructure Development Corporation)** and **mSeva / UPYOG**.

Powered by **Airawat Research Foundation**.

---

## Features

- **Multi-Service Inquiry & Assessment**:
  - Property Tax Assessment & Demand Breakdown
  - Water & Sewerage Billing & Outstanding Dues
  - Property Registration Guidance
  - Electricity (PSPCL) 300 Units Scheme Information
- **Citizen Verification & Security**:
  - Multi-method authentication via radio buttons: UID, Property Tax ID (PTID), Registered Mobile Number, Water Consumer Number, and Sewerage Consumer Number
  - 10-digit mobile number real-time length validation
  - Step 4 record confirmation preview card before OTP dispatch
  - Step 5 transaction-level OTP verification with recovery actions
- **Authentic Municipal Bill Receipt**:
  - Receipt card UI with circular corporation emblem seal, dashed ID box, itemized breakdown, and due amounts
- **Payment Gateway Integration**:
  - Instant handoff to Axis, HDFC, and Paytm gateways with simulated transaction verification and official receipt generation
- **UID-PTID Linking & Grievance Redressal**:
  - Use Case 2 workflow validation and mismatch logging to mSeva PGR
- **Multilingual Support**:
  - Real-time conversational language detection and responses in **English**, **Hindi (हिंदी)**, **Hinglish**, and **Punjabi (ਪੰਜਾਬੀ)**

---

## Tech Stack

- **React 19** + **TypeScript**
- **Vite 8**
- **Tailwind CSS v4**

---

## Getting Started

### 1. Install Dependencies
```bash
npm install
```

### 2. Run Development Server
```bash
npm run dev
```

### 3. Build for Production
```bash
npm run build
```
