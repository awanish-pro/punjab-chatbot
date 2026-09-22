// mSeva (UPYOG / DIGIT) Microservices Client & Simulation Engine
// Based on PMIDC Conversational Bot Assistant Specification

export interface RequestInfo {
  apiId: string;
  ver: string;
  action: string;
  did?: string;
  key?: string;
  msgId: string;
  authToken?: string;
}

export interface CitizenUser {
  id: number;
  uuid: string;
  userName: string;
  name: string;
  mobileNumber: string;
  type: string;
  tenantId: string;
  roles: Array<{ name: string; code: string; tenantId: string }>;
}

export interface PropertyRecord {
  propertyId: string;
  tenantId: string;
  accountId: string; // Citizen UID
  status: string;
  owners: Array<{ name: string; mobileNumber: string; relationship?: string }>;
  address: {
    doorNo?: string;
    buildingName?: string;
    street?: string;
    locality: string;
    city: string;
    pincode: string;
  };
  wardNo?: string;
  financialYear?: string;
  lastPaymentDate?: string;
  propertyType?: string;
  workflow?: {
    action: string;
    businessService: string;
    moduleName: string;
  };
}

export interface DemandDetail {
  taxHeadCode: string;
  title: string;
  taxAmount: number;
  collectionAmount: number;
}

export interface ConsolidatedBill {
  billId: string;
  consumerCode: string;
  businessService: "PT" | "WS" | "SW";
  totalAmount: number;
  tenantId: string;
  billDate: string;
  dueDate: string;
  demandBreakdown: DemandDetail[];
  currentTaxDemand?: number;
  arrears?: number;
  penalty?: number;
  fireCess?: number;
}

export interface IdentifiedRecordPreview {
  found: boolean;
  type: "property" | "water";
  identifierLabel: string;
  identifierValue: string;
  ownerName: string;
  maskedOwner: string;
  address: string;
  registeredMobile: string;
  maskedMobile: string;
  propertyId: string;
  connectionNumber?: string;
}

export interface WaterConnection {
  connectionNumber: string;
  propertyId: string;
  meterId: string;
  connectionType: string;
  waterSource: string;
  status: string;
  dues: number;
}

export interface SewerageConnection {
  connectionNumber: string;
  propertyId: string;
  noOfWaterClosets: number;
  connectionType: string;
  status: string;
  dues: number;
}

export interface PaymentTransaction {
  txnId: string;
  tenantId: string;
  txnAmount: number;
  billId: string;
  consumerCode: string;
  businessService: string;
  gateway: string;
  txnStatus: "PENDING" | "SUCCESS" | "FAILURE";
  receiptNumber?: string;
  paymentDate?: string;
  redirectUrl: string;
}

// Default mock records from official Punjab UAT environment spec
const MOCK_CITIZEN: CitizenUser = {
  id: 1052,
  uuid: "u123-abc-789",
  userName: "9876543210",
  name: "Gurpreet Singh",
  mobileNumber: "9876543210",
  type: "CITIZEN",
  tenantId: "pb.amritsar",
  roles: [{ name: "Citizen", code: "CITIZEN", tenantId: "pb" }],
};

const MOCK_PROPERTY: PropertyRecord = {
  propertyId: "KNP-123-456-78",
  tenantId: "up.kanpur",
  accountId: "citizen-uid-uuid-8899", // Existing linked account ID (or mismatch)
  status: "Active",
  wardNo: "30",
  financialYear: "2025-2026",
  lastPaymentDate: "12 March, 2026",
  owners: [{ name: "Mr. Akash Kumar", mobileNumber: "9123456789" }],
  address: {
    doorNo: "21",
    buildingName: "",
    street: "Civil Lines",
    locality: "Civil Lines",
    city: "Kanpur Nagar",
    pincode: "208001",
  },
};

const MOCK_WATER: WaterConnection = {
  connectionNumber: "WC-334455",
  propertyId: "KNP-123-456-78",
  meterId: "MTR-99214",
  connectionType: "Metered Domestic",
  waterSource: "Municipal Supply",
  status: "Active",
  dues: 450.0,
};

const MOCK_SEWERAGE: SewerageConnection = {
  connectionNumber: "SC-334455",
  propertyId: "KNP-123-456-78",
  noOfWaterClosets: 2,
  connectionType: "Domestic",
  status: "Active",
  dues: 250.0,
};

const MOCK_PT_BILL: ConsolidatedBill = {
  billId: "BILL-2026-5600",
  consumerCode: "KNP-123-456-78",
  businessService: "PT",
  totalAmount: 5600.0,
  tenantId: "up.kanpur",
  billDate: "2026-05-27",
  dueDate: "2026-10-31",
  currentTaxDemand: 4500.0,
  arrears: 800.0,
  penalty: 200.0,
  fireCess: 100.0,
  demandBreakdown: [
    { taxHeadCode: "PT_TAX", title: "Current Property Tax Demand", taxAmount: 4500.0, collectionAmount: 0 },
    { taxHeadCode: "PT_ARREARS", title: "Previous Tax Arrears", taxAmount: 800.0, collectionAmount: 0 },
    { taxHeadCode: "PT_LATE_ASSESSMENT_PENALTY", title: "Late Assessment Penalty", taxAmount: 200.0, collectionAmount: 0 },
    { taxHeadCode: "PT_FIRE_CESS", title: "Fire Cess & Municipal Charges", taxAmount: 100.0, collectionAmount: 0 },
  ],
};

const MOCK_WS_BILL: ConsolidatedBill = {
  billId: "BILL-WS-2024-4112",
  consumerCode: "WC-334455",
  businessService: "WS",
  totalAmount: 450.0,
  tenantId: "pb.amritsar",
  billDate: "2026-08-15",
  dueDate: "2026-10-15",
  currentTaxDemand: 400.0,
  arrears: 0.0,
  penalty: 0.0,
  fireCess: 50.0,
  demandBreakdown: [
    { taxHeadCode: "WS_CHARGE", title: "Current Water Consumption Demand", taxAmount: 400.0, collectionAmount: 0 },
    { taxHeadCode: "WS_METER_RENT", title: "Meter Rent & Maintenance", taxAmount: 50.0, collectionAmount: 0 },
  ],
};

const MOCK_SW_BILL: ConsolidatedBill = {
  billId: "BILL-SW-2024-5221",
  consumerCode: "SC-334455",
  businessService: "SW",
  totalAmount: 250.0,
  tenantId: "pb.amritsar",
  billDate: "2026-08-15",
  dueDate: "2026-10-15",
  currentTaxDemand: 250.0,
  arrears: 0.0,
  penalty: 0.0,
  fireCess: 0.0,
  demandBreakdown: [
    { taxHeadCode: "SW_CHARGE", title: "Current Sewerage Service Charge", taxAmount: 250.0, collectionAmount: 0 },
  ],
};

class MSevaService {
  private activeToken: string = "d8e3b4a2-1111-4444-8888-abcdef123456";
  private currentProperty: PropertyRecord = { ...MOCK_PROPERTY };

  createRequestInfo(action = "_search"): RequestInfo {
    const timestamp = new Date().toISOString().replace(/[-:T]/g, "").slice(0, 14);
    return {
      apiId: "Rainmaker",
      ver: ".01",
      action,
      did: "1",
      key: "",
      msgId: `${timestamp}|en_IN`,
      authToken: this.activeToken,
    };
  }

  // Step 4: Retrieve & Verify Details through MSeva (Confirmation Preview before OTP)
  async verifyIdentifierPreview(
    method: "uid" | "ptid" | "mobile" | "water_consumer" | "sewerage_consumer",
    identifier: string
  ): Promise<IdentifiedRecordPreview> {
    await new Promise((r) => setTimeout(r, 350));
    const isWater = method === "water_consumer" || method === "sewerage_consumer";
    const isPunjab = identifier.toUpperCase().includes("PB-PT") || identifier.includes("9876543210");

    const maskedMobile = isPunjab
      ? "+91 ******3210"
      : method === "mobile" && identifier.trim().length >= 4
      ? `+91 ******${identifier.trim().slice(-4)}`
      : "+91 ******6789";

    return {
      found: true,
      type: isWater ? "water" : "property",
      identifierLabel:
        method === "uid"
          ? "UID"
          : method === "ptid"
          ? "PTID"
          : method === "mobile"
          ? "Registered Mobile"
          : method === "water_consumer"
          ? "Water Consumer No"
          : "Sewerage Consumer No",
      identifierValue: identifier.trim() || (isWater ? "WC-334455" : isPunjab ? "PB-PT-123-456-78" : "KNP-123-456-78"),
      ownerName: isPunjab ? "Mr. Gurpreet Singh" : "Mr. Akash Kumar",
      maskedOwner: isPunjab ? "Mr. Gurpreet S****" : "Mr. Akash K****",
      address: isPunjab ? "42, Mall Road, Model Town, Amritsar" : "21, Civil Lines, Kanpur Nagar",
      registeredMobile: isPunjab ? "9876543210" : "9123456789",
      maskedMobile,
      propertyId: isPunjab ? "PB-PT-123-456-78" : "KNP-123-456-78",
      connectionNumber: method === "sewerage_consumer" ? "SC-334455" : "WC-334455",
    };
  }

  // 4.2.1 Send Citizen Login OTP (supports phone number or email ID)
  async sendLoginOtp(identifier: string): Promise<{ success: boolean; message: string }> {
    await new Promise((r) => setTimeout(r, 400));
    const isEmail = identifier.includes("@");
    return {
      success: true,
      message: isEmail
        ? `Login OTP dispatched to ${identifier}. (For testing UAT, enter: 123456)`
        : `Login OTP dispatched to +91 ${identifier}. (For testing UAT, enter: 123456)`,
    };
  }

  // 4.2.2 Citizen Login & OAuth Token Generation
  async authenticateCitizen(identifier: string, otp: string): Promise<{ success: boolean; user?: CitizenUser; error?: string }> {
    await new Promise((r) => setTimeout(r, 500));
    // Test UAT valid OTP is 123456
    if (otp === "123456") {
      const isPunjab = identifier.toUpperCase().includes("PB-PT") || identifier.includes("9876543210");
      const user = {
        ...MOCK_CITIZEN,
        name: isPunjab ? "Mr. Gurpreet Singh" : "Mr. Akash Kumar",
        mobileNumber: identifier,
        userName: identifier,
      };
      return { success: true, user };
    }
    return {
      success: false,
      error: "Invalid OTP. Please enter the correct 6-digit OTP (Test OTP: 123456).",
    };
  }

  // 4.3.1 Search Property by PTID, Mobile, or UID
  async searchProperty(query: { propertyId?: string; mobileNumber?: string; uuid?: string }): Promise<PropertyRecord | null> {
    await new Promise((r) => setTimeout(r, 450));
    const isPunjab =
      query.propertyId?.toUpperCase().includes("PB-PT") ||
      query.mobileNumber === "9876543210";

    if (isPunjab) {
      return {
        ...this.currentProperty,
        propertyId: query.propertyId?.toUpperCase() || "PB-PT-123-456-78",
        owners: [{ name: "Mr. Gurpreet Singh", mobileNumber: "9876543210" }],
        address: {
          doorNo: "42",
          street: "Mall Road",
          locality: "Civil Lines",
          city: "Amritsar",
          pincode: "143001",
        },
      };
    }
    return {
      ...this.currentProperty,
      propertyId: query.propertyId?.toUpperCase() || "KNP-123-456-78",
    };
  }

  // 4.4.1 Water Connection Search
  async searchWater(connectionNumber?: string): Promise<WaterConnection> {
    await new Promise((r) => setTimeout(r, 400));
    return {
      ...MOCK_WATER,
      connectionNumber: connectionNumber || MOCK_WATER.connectionNumber,
    };
  }

  // 4.4.2 Sewerage Connection Search
  async searchSewerage(connectionNumber?: string): Promise<SewerageConnection> {
    await new Promise((r) => setTimeout(r, 400));
    return {
      ...MOCK_SEWERAGE,
      connectionNumber: connectionNumber || MOCK_SEWERAGE.connectionNumber,
    };
  }

  // 4.5.2 Fetch Consolidated Bill & Dues
  async fetchBill(consumerCode: string, businessService: "PT" | "WS" | "SW" = "PT"): Promise<ConsolidatedBill> {
    await new Promise((r) => setTimeout(r, 500));
    if (businessService === "WS") return MOCK_WS_BILL;
    if (businessService === "SW") return MOCK_SW_BILL;
    return {
      ...MOCK_PT_BILL,
      consumerCode: consumerCode || MOCK_PT_BILL.consumerCode,
    };
  }

  // 4.6.1 Transaction-Level OTP Generation
  async sendTransactionOtp(mobileNumber: string): Promise<{ success: boolean; message: string }> {
    await new Promise((r) => setTimeout(r, 400));
    return {
      success: true,
      message: `Verification OTP sent to registered mobile ending with ****${mobileNumber.slice(-4)}. (Test OTP: 123456)`,
    };
  }

  // 4.6.2 Transaction-Level OTP Validation
  async validateTransactionOtp(mobileNumber: string, otp: string): Promise<boolean> {
    await new Promise((r) => setTimeout(r, 400));
    return otp === "123456" || otp.length === 6;
  }

  // 4.7.1 Initiate Payment Transaction API
  async createPaymentTransaction(
    bill: ConsolidatedBill,
    gateway: "AXIS" | "HDFC" | "PAYTM" = "AXIS",
    citizenName = "Gurpreet Singh"
  ): Promise<PaymentTransaction> {
    await new Promise((r) => setTimeout(r, 600));
    const randomTxn = Math.floor(100000 + Math.random() * 900000);
    const txnId = `PB_PG_2026_09_${randomTxn}`;
    return {
      txnId,
      tenantId: bill.tenantId,
      txnAmount: bill.totalAmount,
      billId: bill.billId,
      consumerCode: bill.consumerCode,
      businessService: bill.businessService,
      gateway,
      txnStatus: "PENDING",
      redirectUrl: `https://sdc-uat.lgpunjab.gov.in/pg-service/transaction/v1/_redirect?txnId=${txnId}`,
    };
  }

  // 4.7.2 Verify Payment Transaction
  async verifyPayment(txnId: string): Promise<PaymentTransaction> {
    await new Promise((r) => setTimeout(r, 500));
    const receiptNumber = `PB_RCPT_2026_${Math.floor(10000 + Math.random() * 90000)}`;
    return {
      txnId,
      tenantId: "pb.amritsar",
      txnAmount: 1500.0,
      billId: "BILL-2024-9988",
      consumerCode: "PB-PT-2024-05-12-001234",
      businessService: "PT",
      gateway: "AXIS",
      txnStatus: "SUCCESS",
      receiptNumber,
      paymentDate: new Date().toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }),
      redirectUrl: "",
    };
  }

  // 4.3.2 UID-PTID Linking Update
  async updateUidPtidLink(propertyId: string, citizenUid: string): Promise<{ success: boolean; trackingId: string }> {
    await new Promise((r) => setTimeout(r, 600));
    this.currentProperty.accountId = citizenUid;
    const trackingId = `PB-WF-PT-${Math.floor(100000 + Math.random() * 900000)}`;
    return { success: true, trackingId };
  }

  // 4.8.1 Create Discrepancy Grievance / Alert API (pgr-services)
  async createDiscrepancyCase(
    propertyId: string,
    citizenUid: string,
    reason = "Citizen reported owner name or property mismatch during UID linking."
  ): Promise<{ caseId: string; status: string }> {
    await new Promise((r) => setTimeout(r, 500));
    const caseId = `PGR-2026-MISMATCH-${Math.floor(10000 + Math.random() * 90000)}`;
    return { caseId, status: "APPLY" };
  }
}

export const msevaService = new MSevaService();
