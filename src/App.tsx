import { useState, useRef, useEffect, useMemo } from "react";
import {
  msevaService,
  type CitizenUser,
  type PropertyRecord,
  type ConsolidatedBill,
  type WaterConnection,
  type SewerageConnection,
  type PaymentTransaction,
  type IdentifiedRecordPreview,
} from "./services/msevaService";
import { languageService, type SupportedLanguage } from "./services/languageService";

// BotFace: inline SVG with CSS-animated blinking eyes, centered within precise bounding box
function BotFace({
  width = 40.939,
  height = 32.15,
  className,
}: {
  width?: number;
  height?: number;
  className?: string;
}) {
  return (
    <svg
      width={width}
      height={height}
      viewBox="14.0469 14.9326 40.9392 32.15"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      style={{ display: "block", overflow: "visible" }}
    >
      <ellipse cx="34.4743" cy="31.0076" rx="16.9402" ry="16.075" fill="#3C3C3C" />
      <rect x="21.6231" y="21.9034" width="25.7025" height="18.208" rx="5" fill="white" />
      <path
        d="M17.9844 24.8431C17.4673 24.8431 16.9553 25.0035 16.4776 25.3152C15.9998 25.6269 15.5658 26.0837 15.2002 26.6596C14.8345 27.2355 14.5445 27.9192 14.3466 28.6717C14.1487 29.4242 14.0469 30.2307 14.0469 31.0451C14.0469 31.8596 14.1487 32.6661 14.3466 33.4185C14.5445 34.171 14.8345 34.8547 15.2002 35.4306C15.5658 36.0065 15.9998 36.4634 16.4776 36.775C16.9553 37.0867 17.4673 37.2471 17.9844 37.2471L17.1648 33.6547C16.8988 32.4883 16.7861 31.2923 16.8296 30.0968C16.8762 28.8176 17.1012 27.5511 17.4981 26.334L17.9844 24.8431Z"
        fill="#3C3C3C"
      />
      <path
        d="M51.0486 24.806C51.5657 24.806 52.0777 24.9664 52.5554 25.2781C53.0331 25.5898 53.4672 26.0466 53.8328 26.6225C54.1984 27.1984 54.4885 27.8821 54.6863 28.6346C54.8842 29.3871 54.9861 30.1935 54.9861 31.008C54.9861 31.8225 54.8842 32.629 54.6863 33.3814C54.4885 34.1339 54.1984 34.8176 53.8328 35.3935C53.4672 35.9694 53.0331 36.4263 52.5554 36.7379C52.0777 37.0496 51.5657 37.21 51.0486 37.21L51.8681 33.6175C52.1342 32.4512 52.2469 31.2552 52.2034 30.0597C52.1568 28.7804 51.9318 27.514 51.5349 26.2969L51.0486 24.806Z"
        fill="#3C3C3C"
      />
      <path
        d="M14.4699 19.8159C14.4699 19.3891 14.816 19.043 15.2429 19.043C15.6697 19.043 16.0158 19.3891 16.0158 19.8159V24.7665L14.4699 26.5239L14.4699 19.8159Z"
        fill="#3C3C3C"
      />
      <path
        d="M54.4668 19.7858C54.4668 19.3589 54.1208 19.0129 53.6939 19.0129C53.2671 19.0129 52.921 19.3589 52.921 19.7858V24.7363L54.4668 26.4938L54.4668 19.7858Z"
        fill="#3C3C3C"
      />
      <path
        d="M31.4552 33.6787C33.0357 35.541 35.9189 35.5459 37.4935 33.6787"
        stroke="#3C3C3C"
        strokeWidth="2"
        strokeLinecap="round"
      />
      {/* Left eye */}
      <ellipse className="bot-eye-l" cx="26.8802" cy="27.9454" rx="2.04934" ry="2.25186" fill="#3C3C3C" />
      <ellipse cx="26.8801" cy="28.0167" rx="1.03345" ry="0.647351" fill="white" />
      {/* Right eye */}
      <ellipse className="bot-eye-r" cx="42.0847" cy="27.9454" rx="2.04934" ry="2.25186" fill="#3C3C3C" />
      <ellipse cx="42.0845" cy="28.0167" rx="1.03345" ry="0.647351" fill="white" />
    </svg>
  );
}

// Helper to render bold (**text**) and italic (*text*) markdown tokens cleanly
function FormattedTextLine({ line }: { line: string }) {
  const parts: React.ReactNode[] = [];
  const regex = /(\*\*.*?\*\*|\*.*?\*)/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(line)) !== null) {
    if (match.index > lastIndex) {
      parts.push(line.slice(lastIndex, match.index));
    }
    const token = match[0];
    if (token.startsWith("**") && token.endsWith("**")) {
      parts.push(
        <strong key={match.index} className="font-semibold text-slate-900">
          {token.slice(2, -2)}
        </strong>
      );
    } else if (token.startsWith("*") && token.endsWith("*")) {
      parts.push(
        <em key={match.index} className="italic text-slate-600">
          {token.slice(1, -1)}
        </em>
      );
    }
    lastIndex = match.index + token.length;
  }
  if (lastIndex < line.length) {
    parts.push(line.slice(lastIndex));
  }

  return <span>{parts.length > 0 ? parts : line}</span>;
}

// Breaks text into genuine visual reading lines & preserves markdown paragraphs
function getSmartRevealLines(text: string): string[] {
  if (!text) return [];

  const rawParagraphs = text.split("\n");
  const result: string[] = [];

  for (let i = 0; i < rawParagraphs.length; i++) {
    const p = rawParagraphs[i];
    const trimmed = p.trim();

    if (trimmed.length === 0) {
      // Keep empty line spacer between paragraphs
      if (result.length > 0 && result[result.length - 1] !== "") {
        result.push("");
      }
      continue;
    }

    // Preserve bullet points, numbered steps, or emoji/bold headers as independent lines
    const isBulletOrHeader =
      /^(\s*[-•*]|\s*\d+\.|\s*[🏠⚡📋🏢💳🔍⚠️✅])/.test(trimmed) ||
      (trimmed.startsWith("**") && trimmed.endsWith("**"));

    if (isBulletOrHeader) {
      result.push(trimmed);
      continue;
    }

    // For regular paragraphs, split into natural sentences using punctuation delimiters (. ! ? ।)
    const sentences = trimmed
      .split(/(?<=[.?!।])\s+/)
      .map((s) => s.trim())
      .filter((s) => s.length > 0);

    if (sentences.length > 1) {
      let merged = "";
      for (let sIdx = 0; sIdx < sentences.length; sIdx++) {
        const s = sentences[sIdx];
        if (merged) {
          result.push(`${merged} ${s}`);
          merged = "";
        } else if (s.length < 18 && sIdx < sentences.length - 1) {
          // Merge very short fragments (e.g. "Sure!", "Okay!", "नमस्ते!") with following sentence
          merged = s;
        } else {
          result.push(s);
        }
      }
      if (merged) {
        result.push(merged);
      }
    } else {
      result.push(trimmed);
    }
  }

  return result.length > 0 ? result : [text];
}

// Comfortable reading pace: calm, steady, readable ("smoothly not too fast")
function getLineDelay(line: string): number {
  const len = line.trim().length;
  if (len === 0) return 200; // brief pause for empty spacer lines
  if (len < 30) return 460;  // short line / heading / question
  if (len < 70) return 560;  // medium sentence
  return Math.min(760, 560 + (len - 70) * 2.5); // calm reading time for long sentences
}

// Smooth Line-by-Line Animated Text Reveal Component
function AnimatedBotText({
  text,
  isLatest,
  onLineReveal,
  onComplete,
}: {
  text: string;
  isLatest: boolean;
  onLineReveal?: () => void;
  onComplete?: () => void;
}) {
  const lines = useMemo(() => getSmartRevealLines(text), [text]);
  const [revealedCount, setRevealedCount] = useState(isLatest ? 1 : lines.length);
  const [isFinished, setIsFinished] = useState(!isLatest);

  // If this message becomes historical or is not latest, show all immediately
  useEffect(() => {
    if (!isLatest) {
      setRevealedCount(lines.length);
      setIsFinished(true);
    }
  }, [isLatest, lines.length]);

  useEffect(() => {
    if (!isLatest || isFinished) return;

    if (revealedCount < lines.length) {
      const currentLine = lines[revealedCount - 1] || "";
      const delay = getLineDelay(currentLine);

      const timer = setTimeout(() => {
        setRevealedCount((prev) => {
          const next = prev + 1;
          onLineReveal?.();
          if (next >= lines.length) {
            setIsFinished(true);
            onComplete?.();
          }
          return next;
        });
      }, delay);

      return () => clearTimeout(timer);
    } else {
      setIsFinished(true);
      onComplete?.();
    }
  }, [revealedCount, lines, isLatest, isFinished, onLineReveal, onComplete]);

  return (
    <div
      className="text-slate-800 text-sm leading-relaxed flex flex-col gap-1.5 cursor-default select-text"
      onClick={() => {
        // Fast-forward reveal immediately on user click
        if (!isFinished) {
          setRevealedCount(lines.length);
          setIsFinished(true);
          onComplete?.();
        }
      }}
    >
      {lines.slice(0, revealedCount).map((line, idx) => {
        const isCurrentActiveLine = idx === revealedCount - 1 && !isFinished;
        const isSpacer = line.trim().length === 0;

        if (isSpacer) {
          return <div key={`spacer-${idx}`} className="h-1" />;
        }

        return (
          <div
            key={`line-${idx}`}
            className={`min-h-[20px] ${
              isLatest ? "animate-line-smooth" : "opacity-100"
            }`}
          >
            <p className="leading-relaxed">
              <FormattedTextLine line={line} />
              {isCurrentActiveLine && (
                <span
                  className="inline-block w-[3px] h-[14px] ml-1.5 bg-blue-600 rounded-full animate-cursor-pulse align-middle shadow-[0_0_8px_rgba(37,99,235,0.45)]"
                  aria-hidden="true"
                />
              )}
            </p>
          </div>
        );
      })}
    </div>
  );
}

// Authentic Power / Municipal Corporation circular seal matching the screenshot
function CorporationSeal({ className }: { className?: string }) {
  return (
    <div className={`flex justify-center items-center ${className || ""}`}>
      <svg width="58" height="58" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
        {/* Outer Red Ring */}
        <circle cx="50" cy="50" r="46.5" stroke="#C53030" strokeWidth="3" fill="#FFFDFD" />
        <circle cx="50" cy="50" r="41.5" stroke="#C53030" strokeWidth="1" strokeDasharray="2.5 1.5" fill="none" />

        {/* Circular text paths */}
        <path id="sealPathTop" d="M 17,50 A 33,33 0 0,1 83,50" fill="none" />
        <path id="sealPathBottom" d="M 83,50 A 33,33 0 0,1 17,50" fill="none" />

        <text fontSize="6.2" fontWeight="700" fill="#C53030" letterSpacing="0.7">
          <textPath href="#sealPathTop" startOffset="50%" textAnchor="middle">
            POWER CORPORATION LIMITED
          </textPath>
        </text>
        <text fontSize="5.2" fontWeight="600" fill="#C53030" letterSpacing="0.6">
          <textPath href="#sealPathBottom" startOffset="50%" textAnchor="middle">
            • U.P. GOVT. UNDERTAKING •
          </textPath>
        </text>

        {/* Inner Solid Red Circle */}
        <circle cx="50" cy="50" r="23.5" fill="#C53030" />

        {/* Transmission Tower / Insignia inside Medallion */}
        <path d="M50 31 L44 68 H56 L50 31 Z" stroke="white" strokeWidth="1.6" fill="none" strokeLinejoin="round" />
        <line x1="39" y1="43" x2="61" y2="43" stroke="white" strokeWidth="1.8" strokeLinecap="round" />
        <line x1="42" y1="52" x2="58" y2="52" stroke="white" strokeWidth="1.8" strokeLinecap="round" />
        <line x1="43.5" y1="60" x2="56.5" y2="60" stroke="white" strokeWidth="1.8" strokeLinecap="round" />
        <line x1="40" y1="43" x2="57" y2="52" stroke="white" strokeWidth="1.2" />
        <line x1="60" y1="43" x2="43" y2="52" stroke="white" strokeWidth="1.2" />
        <line x1="43" y1="52" x2="56" y2="60" stroke="white" strokeWidth="1.2" />
        <line x1="57" y1="52" x2="44" y2="60" stroke="white" strokeWidth="1.2" />
        <circle cx="50" cy="29" r="1.5" fill="white" />
      </svg>
    </div>
  );
}

// Bill Receipt Card UI exactly matching screenshot
function BillReceiptCard({
  bill,
  property,
  water,
  citizen,
}: {
  bill?: ConsolidatedBill;
  property?: PropertyRecord;
  water?: WaterConnection;
  citizen?: CitizenUser | null;
}) {
  const isWater = bill?.businessService === "WS" || !!water;

  // Determine Identifier to show inside the prominent dashed box
  const displayId = isWater
    ? water?.connectionNumber || bill?.consumerCode || "WC-123-456-78"
    : property?.propertyId || bill?.consumerCode || "KNP-123-456-78";

  const isPunjab = displayId.includes("PB-PT") || property?.address?.city?.toLowerCase().includes("amritsar");

  const corpTitle = isPunjab
    ? `MUNICIPAL CORPORATION ${property?.address?.city?.toUpperCase() || "AMRITSAR"}, PUNJAB`
    : "KANPUR CORPORATION LIMITED, UTTAR PRADESH";

  // Customer Name
  const customerName =
    property?.owners?.[0]?.name ||
    (citizen?.name ? (citizen.name.startsWith("Mr.") ? citizen.name : `Mr. ${citizen.name}`) : isPunjab ? "Mr. Gurpreet Singh" : "Mr. Akash Kumar");

  // Mobile corresponding to the selected PTID
  const mobileNo =
    property?.owners?.[0]?.mobileNumber ||
    citizen?.mobileNumber ||
    (isPunjab ? "9876543210" : "9123456789");

  // Address
  const addressLine1 = property?.address?.doorNo
    ? `${property.address.doorNo}, ${property.address.locality || property.address.street || "Civil Lines"},`
    : isPunjab
    ? "42, Mall Road,"
    : "21, Civil Lines,";

  const addressLine2 = property?.address?.city
    ? `${property.address.city}`
    : isPunjab
    ? "Model Town, Amritsar"
    : "Kanpur Nagar";

  const wardNo = property?.wardNo || "30";
  const status = property?.status || "Active";
  const financialYear = property?.financialYear || "2025-2026";

  const dueAmount = bill?.totalAmount !== undefined
    ? Math.round(bill.totalAmount).toLocaleString("en-IN")
    : "5600";

  return (
    <div className="bg-white rounded-2xl border border-neutral-200/90 p-4 sm:p-5 shadow-xs text-neutral-800 font-mono flex flex-col max-w-[325px] w-full animate-fade-in select-text">
      {/* 1. Header Seal Emblem */}
      <CorporationSeal className="mb-2" />

      {/* 2. Corporation Title */}
      <h3 className="font-mono font-bold text-[12px] sm:text-[12.5px] text-neutral-900 tracking-tight text-center uppercase leading-snug">
        {corpTitle}
      </h3>

      {/* 3. Timestamp */}
      <p className="text-[10.5px] text-neutral-500 font-mono text-center tracking-tight mt-1 mb-2">
        Wed, May 27, 2026 • 9:27:53 AM
      </p>

      {/* 4. Dashed Box with Property ID / Consumer ID */}
      <div className="relative border border-dashed border-neutral-400 rounded-xl px-3 py-3 my-2 text-center">
        <div className="absolute -top-2.5 left-1/2 -translate-x-1/2 bg-white px-2 text-[10.5px] font-mono text-neutral-600 tracking-tight whitespace-nowrap">
          {isWater ? "------ Water Consumer no. ------" : "------ Property ID no. ------"}
        </div>
        <div className="text-[20px] sm:text-[22px] font-mono font-bold tracking-[0.10em] text-neutral-900 pt-0.5">
          {displayId}
        </div>
      </div>

      {/* 5. Property Details Section */}
      <div className="flex flex-col gap-1.5 pt-2">
        <h4 className="font-mono font-bold text-[12px] text-neutral-800">
          {isWater ? "Water Connection Details:" : "Property Details:"}
        </h4>
        <div className="border-b border-dashed border-neutral-300 -mt-0.5 mb-1" />

        {/* Support Multiple / Joint Property Owners */}
        {property?.owners && property.owners.length > 1 ? (
          <div className="flex justify-between items-start text-[11.5px] font-mono">
            <span className="text-neutral-600">Owner Names</span>
            <div className="text-neutral-900 font-medium text-right leading-tight max-w-[62%]">
              {property.owners.map((owner, idx) => (
                <div key={idx} className={idx > 0 ? "mt-0.5" : ""}>
                  {idx + 1}. {owner.name}
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="flex justify-between items-start text-[11.5px] font-mono">
            <span className="text-neutral-600">Customer Name</span>
            <span className="text-neutral-900 font-medium text-right">{customerName}</span>
          </div>
        )}

        <div className="flex justify-between items-start text-[11.5px] font-mono">
          <span className="text-neutral-600">Mobile no.</span>
          <span className="text-neutral-900 font-medium text-right font-mono">{mobileNo}</span>
        </div>

        <div className="flex justify-between items-start text-[11.5px] font-mono">
          <span className="text-neutral-600">Address</span>
          <span className="text-neutral-900 font-medium text-right max-w-[62%] leading-tight">
            {addressLine1}
            <br />
            {addressLine2}
          </span>
        </div>

        <div className="flex justify-between items-start text-[11.5px] font-mono">
          <span className="text-neutral-600">Ward no.</span>
          <span className="text-neutral-900 font-medium text-right">{wardNo}</span>
        </div>

        <div className="flex justify-between items-start text-[11.5px] font-mono">
          <span className="text-neutral-600">Status</span>
          <span className="text-neutral-900 font-medium text-right">{status}</span>
        </div>
      </div>

      {/* 6. Tax / Service Details Section (Last payment date removed as not available in PT records) */}
      <div className="flex flex-col gap-1.5 pt-3">
        <h4 className="font-mono font-bold text-[12px] text-neutral-800">
          {isWater ? "Water Tax Details:" : "Property Tax Details:"}
        </h4>
        <div className="border-b border-dashed border-neutral-300 -mt-0.5 mb-1" />

        <div className="flex justify-between items-start text-[11.5px] font-mono">
          <span className="text-neutral-600">Financial year</span>
          <span className="text-neutral-900 font-medium text-right">{financialYear}</span>
        </div>
      </div>

      {/* 7. Divider and Current Due Amount */}
      <div className="border-b border-dashed border-neutral-300 mt-3 mb-2" />

      <div className="flex justify-between items-center font-mono py-1">
        <span className="text-[12px] text-neutral-700 font-normal">Current due amount</span>
        <span className="text-[16px] sm:text-[17px] font-mono font-bold text-neutral-900">
          ₹{dueAmount}
        </span>
      </div>
    </div>
  );
}

type VerificationMethod = "uid" | "ptid" | "mobile" | "water_consumer" | "sewerage_consumer";

interface MessageCardData {
  type?: "auth_card" | "property_details" | "bill_dues" | "payment_modal" | "payment_success" | "uid_linking" | "mismatch_logged";
  property?: PropertyRecord;
  bill?: ConsolidatedBill;
  water?: WaterConnection;
  sewerage?: SewerageConnection;
  transaction?: PaymentTransaction;
  trackingId?: string;
  caseId?: string;
  pendingIntent?: string;
  serviceCategory?: "property" | "water";
}

interface Message {
  id: number;
  role: "bot" | "user";
  text: string;
  time: string;
  card?: MessageCardData;
}

function now() {
  return new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

let msgId = 1;

export default function App() {
  const [open, setOpen] = useState(false);
  const [citizen, setCitizen] = useState<CitizenUser | null>(null);
  const [conversationLanguage, setConversationLanguage] = useState<SupportedLanguage>("english");

  const cardLabels = languageService.getCardLabels(conversationLanguage);
  const chips = languageService.getPredefinedChips(conversationLanguage);

  // In-chat Authentication Card States
  const [selectedVerificationMethod, setSelectedVerificationMethod] = useState<VerificationMethod>("uid");
  const [authIdentifier, setAuthIdentifier] = useState("");
  const [authOtp, setAuthOtp] = useState("");
  const [authOtpSent, setAuthOtpSent] = useState(false);
  const [identifiedPreview, setIdentifiedPreview] = useState<IdentifiedRecordPreview | null>(null);
  const [authIdentifierError, setAuthIdentifierError] = useState("");
  const [authOtpError, setAuthOtpError] = useState("");
  const [isSendingOtp, setIsSendingOtp] = useState(false);
  const [isVerifyingOtp, setIsVerifyingOtp] = useState(false);
  const [pendingIntent, setPendingIntent] = useState<string | null>(null);

  // Chat message state: starts empty on first visit or revisit
  const [messages, setMessages] = useState<Message[]>([]);
  const [textFinishedIds, setTextFinishedIds] = useState<Set<number>>(new Set());
  const [input, setInput] = useState("");
  const [typing, setTyping] = useState(false);
  const [selectedGateway, setSelectedGateway] = useState<"AXIS" | "HDFC" | "PAYTM">("AXIS");
  const [isPaying, setIsPaying] = useState(false);
  const [isListening, setIsListening] = useState(false);

  const bottomRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, open, typing, authOtpSent]);

  function handleReset() {
    setCitizen(null);
    setSelectedVerificationMethod("uid");
    setAuthIdentifier("");
    setAuthOtp("");
    setAuthOtpSent(false);
    setIdentifiedPreview(null);
    setAuthIdentifierError("");
    setAuthOtpError("");
    setPendingIntent(null);
    setConversationLanguage("english");
    setMessages([]);
    setTextFinishedIds(new Set());
  }

  function handleDownload() {
    const text = messages
      .map((m) => `[${m.time}] ${m.role === "bot" ? "Bharat Chatbot" : "Citizen"}: ${m.text}`)
      .join("\n\n");
    const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `bharat-chatbot-transcript-${new Date().toISOString().slice(0, 10)}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  }

  // Step 4 & Step 5: Retrieve details through MSeva and send OTP
  async function handleSendAuthOtp() {
    const val = authIdentifier.trim();
    if (!val) {
      setAuthIdentifierError(cardLabels.emptyError || "Please enter the required verification details");
      return;
    }

    if (selectedVerificationMethod === "mobile") {
      const cleanDigits = val.replace(/\D/g, "");
      if (cleanDigits.length < 10) {
        setAuthIdentifierError(cardLabels.mobileLessThan10(cleanDigits.length));
        return;
      }
      if (cleanDigits.length > 10) {
        setAuthIdentifierError(cardLabels.mobileMoreThan10(cleanDigits.length));
        return;
      }
    }

    // Point 5: Inactive PTID Handling
    if (selectedVerificationMethod === "ptid" && msevaService.isPtidInWorkflow(val)) {
      const workflowMsg = languageService.getWorkflowPtidMessage(conversationLanguage);
      setAuthIdentifierError(workflowMsg);
      setMessages((prev) => [
        ...prev,
        {
          id: msgId++,
          role: "bot",
          text: workflowMsg,
          time: now(),
        },
      ]);
      return;
    }

    setAuthIdentifierError("");
    setIsSendingOtp(true);
    // Step 4 – Retrieve & Verify Details through MSeva API
    const preview = await msevaService.verifyIdentifierPreview(selectedVerificationMethod, val);

    if (preview.isWorkflow) {
      setIsSendingOtp(false);
      const workflowMsg = languageService.getWorkflowPtidMessage(conversationLanguage);
      setAuthIdentifierError(workflowMsg);
      setMessages((prev) => [
        ...prev,
        {
          id: msgId++,
          role: "bot",
          text: workflowMsg,
          time: now(),
        },
      ]);
      return;
    }

    setIdentifiedPreview(preview);

    // Step 5 – OTP Verification: Assistant sends OTP to registered mobile number
    await msevaService.sendLoginOtp(val);
    setIsSendingOtp(false);
    setAuthOtpSent(true);
    setAuthOtp("");
    setAuthOtpError("");
  }

  // Handle in-chat "Verify OTP" (Step 5)
  async function handleVerifyAuthOtp(activePendingIntent?: string | null) {
    const otpVal = authOtp.trim();
    if (!otpVal) {
      setAuthOtpError(
        conversationLanguage === "hindi"
          ? "कृपया 6 अंकों का ओटीपी दर्ज करें"
          : conversationLanguage === "punjabi"
          ? "ਕਿਰਪਾ ਕਰਕੇ 6 ਅੰਕਾਂ ਦਾ OTP ਦਰਜ ਕਰੋ"
          : conversationLanguage === "hinglish"
          ? "Please 6-digit OTP enter karein"
          : "Please enter the 6-digit OTP"
      );
      return;
    }

    if (otpVal !== "123456") {
      setAuthOtpError(cardLabels.invalidOtpRecovery);
      return;
    }

    setIsVerifyingOtp(true);
    const authResult = await msevaService.authenticateCitizen(authIdentifier.trim(), otpVal);
    setIsVerifyingOtp(false);

    if (authResult.success && authResult.user) {
      setCitizen(authResult.user);
      setAuthOtpError("");

      // Fulfil the user's pending intent immediately (Step 6 & 7 / Use Case 2)
      const intentToFulfill = activePendingIntent || pendingIntent;
      fulfillIntentForVerifiedCitizen(authResult.user, intentToFulfill, conversationLanguage);
    } else {
      setAuthOtpError(cardLabels.invalidOtpRecovery);
    }
  }

  // After successful OTP, immediately fulfill requested property/tax operation
  async function fulfillIntentForVerifiedCitizen(
    user: CitizenUser,
    intent?: string | null,
    targetLang?: SupportedLanguage
  ) {
    const lang = targetLang || conversationLanguage;
    setTyping(true);

    if (intent === "property_tax" || intent === "pay_tax" || intent === "property_dues") {
      const property = await msevaService.searchProperty({
        mobileNumber: selectedVerificationMethod === "mobile" ? authIdentifier : user.mobileNumber,
        propertyId: selectedVerificationMethod === "ptid" ? authIdentifier : undefined,
        uuid: selectedVerificationMethod === "uid" ? authIdentifier : undefined,
      });
      const bill = await msevaService.fetchBill(property?.propertyId || "PB-PT-2024-05-12-001234", "PT");
      setTyping(false);

      const msgs = languageService.getAuthSuccessMessage(lang, user.name, "property_tax");
      const duesText = cardLabels.outstandingPayPrompt(bill.totalAmount.toLocaleString("en-IN"));

      setMessages((prev) => [
        ...prev,
        {
          id: msgId++,
          role: "bot",
          text: msgs.title,
          time: now(),
          card: {
            type: "bill_dues",
            property: property || undefined,
            bill,
          },
        },
        {
          id: msgId++,
          role: "bot",
          text: duesText,
          time: now(),
          card: {
            type: "payment_modal",
            bill,
          },
        },
      ]);
    } else if (intent === "property_details") {
      const property = await msevaService.searchProperty({
        mobileNumber: selectedVerificationMethod === "mobile" ? authIdentifier : user.mobileNumber,
        propertyId: selectedVerificationMethod === "ptid" ? authIdentifier : undefined,
        uuid: selectedVerificationMethod === "uid" ? authIdentifier : undefined,
      });
      const bill = await msevaService.fetchBill(property?.propertyId || "PB-PT-2024-05-12-001234", "PT");
      setTyping(false);

      const msgs = languageService.getAuthSuccessMessage(lang, user.name, "property_details");
      setMessages((prev) => [
        ...prev,
        {
          id: msgId++,
          role: "bot",
          text: msgs.title,
          time: now(),
          card: {
            type: "property_details",
            property: property || undefined,
            bill,
          },
        },
      ]);
    } else if (intent === "water_bill" || intent === "water_dues") {
      const water = await msevaService.searchWater(
        selectedVerificationMethod === "water_consumer" ? authIdentifier : undefined
      );
      const sewerage = await msevaService.searchSewerage(
        selectedVerificationMethod === "sewerage_consumer" ? authIdentifier : undefined
      );
      const waterBill = await msevaService.fetchBill(water.connectionNumber, "WS");
      setTyping(false);

      const msgs = languageService.getAuthSuccessMessage(lang, user.name, "water_bill");
      const waterDuesText = cardLabels.outstandingPayPrompt(waterBill.totalAmount.toLocaleString("en-IN"));

      setMessages((prev) => [
        ...prev,
        {
          id: msgId++,
          role: "bot",
          text: msgs.title,
          time: now(),
          card: {
            type: "bill_dues",
            water,
            sewerage,
            bill: waterBill,
          },
        },
        {
          id: msgId++,
          role: "bot",
          text: waterDuesText,
          time: now(),
          card: {
            type: "payment_modal",
            bill: waterBill,
          },
        },
      ]);
    } else if (intent === "outstanding_dues") {
      const property = await msevaService.searchProperty({ mobileNumber: user.mobileNumber });
      const ptBill = await msevaService.fetchBill(property?.propertyId || "PB-PT-2024-05-12-001234", "PT");
      const water = await msevaService.searchWater();
      const wsBill = await msevaService.fetchBill(water.connectionNumber, "WS");
      setTyping(false);

      const totalOutstanding = ptBill.totalAmount + wsBill.totalAmount;
      const msgs = languageService.getAuthSuccessMessage(lang, user.name, "outstanding_dues");

      const consolidatedBill: ConsolidatedBill = {
        billId: "PB-CONS-2024-09-001",
        consumerCode: user.mobileNumber,
        businessService: "MUNICIPAL_CONSOLIDATED",
        totalAmount: totalOutstanding,
        dueDate: "30-Sep-2024",
        status: "ACTIVE",
        tenantId: "pb.amritsar",
        demandBreakdown: [
          { taxHeadCode: "PT", title: "Property Tax Outstanding (PB-PT-2024-05-12-001234)", taxAmount: ptBill.totalAmount },
          { taxHeadCode: "WS", title: "Water & Sewerage Charges (WC-2024-0042)", taxAmount: wsBill.totalAmount },
        ],
      };

      const duesPrompt = cardLabels.outstandingPayPrompt(totalOutstanding.toLocaleString("en-IN"));

      setMessages((prev) => [
        ...prev,
        {
          id: msgId++,
          role: "bot",
          text: msgs.title,
          time: now(),
          card: {
            type: "bill_dues",
            bill: consolidatedBill,
          },
        },
        {
          id: msgId++,
          role: "bot",
          text: duesPrompt,
          time: now(),
          card: {
            type: "payment_modal",
            bill: consolidatedBill,
          },
        },
      ]);
    } else if (intent === "uid_linking") {
      const property = await msevaService.searchProperty({
        mobileNumber: selectedVerificationMethod === "mobile" ? authIdentifier : user.mobileNumber,
        propertyId: selectedVerificationMethod === "ptid" ? authIdentifier : undefined,
        uuid: selectedVerificationMethod === "uid" ? authIdentifier : undefined,
      });
      setTyping(false);

      setMessages((prev) => [
        ...prev,
        {
          id: msgId++,
          role: "bot",
          text: cardLabels.uidMatchingPrompt(user.uuid || "u123-abc-789"),
          time: now(),
          card: {
            type: "uid_linking",
            property: property || undefined,
          },
        },
      ]);
    } else {
      setTyping(false);
      const msgs = languageService.getAuthSuccessMessage(lang, user.name, "general");
      setMessages((prev) => [
        ...prev,
        {
          id: msgId++,
          role: "bot",
          text: msgs.title,
          time: now(),
        },
      ]);
    }
  }

  // Conversational Intent Engine with Multilingual Support
  async function processUserMessage(userText: string) {
    const textLower = userText.toLowerCase().trim();
    setTyping(true);

    // 1. Silent Language Detection & State Persistence
    const detection = languageService.detectLanguage(userText, conversationLanguage);
    const activeLang = detection.language;
    if (activeLang !== conversationLanguage) {
      setConversationLanguage(activeLang);
    }

    // 2. Explicit Language Switch Request
    if (detection.isExplicitSwitch) {
      setTyping(false);
      setMessages((prev) => [
        ...prev,
        {
          id: msgId++,
          role: "bot",
          text: languageService.getLanguageSwitchResponse(activeLang),
          time: now(),
        },
      ]);
      return;
    }

    // 3. Chit-chat / Greetings
    const isGreeting =
      /^(hi|hello|hey|greetings|good morning|good afternoon|good evening|namaste|namaskar|sat sri akal|sasrikaal|pranam|kiddan|haalat)$/i.test(
        textLower
      ) ||
      textLower.includes("namaste") ||
      textLower.includes("sat sri akal") ||
      textLower.includes("ਸਤਿ ਸ੍ਰੀ ਅਕਾਲ") ||
      textLower.includes("नमस्ते") ||
      textLower.includes("नमस्कार");

    if (isGreeting && textLower.length < 35) {
      setTyping(false);
      setMessages((prev) => [
        ...prev,
        {
          id: msgId++,
          role: "bot",
          text: languageService.getGreetingResponse(activeLang),
          time: now(),
        },
      ]);
      return;
    }

    // OTP entry check in chat if OTP verification is active
    if (authOtpSent && /^\d{6}$/.test(userText.trim())) {
      setTyping(false);
      setAuthOtp(userText.trim());
      handleVerifyAuthOtp();
      return;
    }

    // Point 5: Inactive PTID Detection in Chat
    const ptidPatternMatch = userText.match(/\b([A-Z]{2,4}-PT-[A-Z0-9-]+|KNP-[A-Z0-9-]+)\b/i);
    if (ptidPatternMatch) {
      const extractedPtid = ptidPatternMatch[1].toUpperCase();
      if (msevaService.isPtidInWorkflow(extractedPtid)) {
        setTyping(false);
        setMessages((prev) => [
          ...prev,
          {
            id: msgId++,
            role: "bot",
            text: languageService.getWorkflowPtidMessage(activeLang),
            time: now(),
          },
        ]);
        return;
      }
    }

    if (
      textLower.includes("workflow status") ||
      textLower.includes("ptid workflow") ||
      (textLower.includes("ptid") && textLower.includes("workflow"))
    ) {
      setTyping(false);
      setMessages((prev) => [
        ...prev,
        {
          id: msgId++,
          role: "bot",
          text: languageService.getWorkflowPtidMessage(activeLang),
          time: now(),
        },
      ]);
      return;
    }

    // Mobile number validation if citizen enters a phone number or mentions mobile in chat
    const digitsOnly = userText.replace(/\D/g, "");
    const isExplicitMobileInput =
      /\b(mobile|phone|number|mob|contact|फ़ोन|मोबाइल|ਮੋਬਾਈਲ|ਨੰਬਰ)\b/i.test(userText) ||
      /^[+]?[\d\s-]{3,25}$/.test(userText.trim());

    // Exclude common years or small quantity numbers (e.g., 2026, 300 unit scheme)
    const isYearOrSmallQuantity =
      /^(19\d\d|20\d\d|100|200|300|400|500|600|50|42|1|2|3|4|5|6|7|8|9|10)$/.test(userText.trim());

    if (isExplicitMobileInput && !isYearOrSmallQuantity && digitsOnly.length > 0 && !authOtpSent) {
      const localizedLabels = languageService.getCardLabels(activeLang);
      if (digitsOnly.length < 10) {
        setTyping(false);
        setMessages((prev) => [
          ...prev,
          {
            id: msgId++,
            role: "bot",
            text: `⚠️ ${localizedLabels.mobileLessThan10(digitsOnly.length)}\n${
              activeLang === "hindi"
                ? "कृपया 10 अंकों का वैध मोबाइल नंबर दर्ज करें।"
                : activeLang === "punjabi"
                ? "ਕਿਰਪਾ ਕਰਕੇ 10 ਅੰਕਾਂ ਦਾ ਵੈਧ ਮੋਬਾਈਲ ਨੰਬਰ ਦਰਜ ਕਰੋ।"
                : activeLang === "hinglish"
                ? "Please 10 digits ka valid mobile number enter karein."
                : "Please enter a valid 10-digit mobile number."
            }`,
            time: now(),
          },
        ]);
        return;
      }
      if (digitsOnly.length > 10) {
        setTyping(false);
        setMessages((prev) => [
          ...prev,
          {
            id: msgId++,
            role: "bot",
            text: `⚠️ ${localizedLabels.mobileMoreThan10(digitsOnly.length)}\n${
              activeLang === "hindi"
                ? "कृपया 10 अंकों का वैध मोबाइल नंबर दर्ज करें।"
                : activeLang === "punjabi"
                ? "ਕਿਰਪਾ ਕਰਕੇ 10 ਅੰਕਾਂ ਦਾ ਵੈਧ ਮੋਬਾਈਲ ਨੰਬਰ ਦਰਜ ਕਰੋ।"
                : activeLang === "hinglish"
                ? "Please 10 digits ka valid mobile number enter karein."
                : "Please enter a valid 10-digit mobile number."
            }`,
            time: now(),
          },
        ]);
        return;
      }
      // If exactly 10 digits and not verified yet
      if (digitsOnly.length === 10 && !citizen) {
        setSelectedVerificationMethod("mobile");
        setAuthIdentifier(digitsOnly);
        setAuthOtpSent(false);
        setAuthOtp("");
        setAuthOtpError("");
        setAuthIdentifierError("");
        setTyping(false);
        setMessages((prev) => [
          ...prev,
          {
            id: msgId++,
            role: "bot",
            text: languageService.getAuthRequestPrompt(activeLang, "property"),
            time: now(),
            card: {
              type: "auth_card",
              pendingIntent: pendingIntent || "property_dues",
              serviceCategory: "property",
            },
          },
        ]);
        return;
      }
    }

    // =========================================================================
    // SENSITIVE TRANSACTIONAL QUERIES (Requires Phone/Email & OTP Verification)
    // 1. Pay property tax
    // 2. Check property tax dues
    // 3. View property details
    // 4. Check water/sewerage dues
    // 5. Make payment for outstanding dues
    // =========================================================================

    // 1. Pay property tax
    const isPayTax =
      textLower.includes("pay property tax") ||
      textLower.includes("pay my property tax") ||
      textLower.includes("i want to pay my property tax") ||
      textLower.includes("pay tax") ||
      textLower.includes("tax payment") ||
      textLower.includes("property tax payment") ||
      textLower.includes("tax bharna") ||
      textLower.includes("property tax bharna") ||
      textLower.includes("टैक्स भरना") ||
      textLower.includes("प्रॉपर्टी टैक्स भरना") ||
      textLower.includes("ਟੈਕਸ ਭਰਨਾ") ||
      textLower.includes("ਪ੍ਰਾਪਰਟੀ ਟੈਕਸ ਭਰਨਾ");

    // 2. Check property tax dues
    const isPropertyDues =
      textLower.includes("check property tax dues") ||
      textLower.includes("property tax dues") ||
      textLower.includes("what are my property tax dues") ||
      textLower.includes("tax dues") ||
      textLower.includes("my property tax dues") ||
      textLower.includes("check tax dues") ||
      textLower.includes("check dues") ||
      textLower.includes("property dues") ||
      textLower.includes("tax due") ||
      textLower.includes("बकाया") ||
      textLower.includes("बकाया टैक्स") ||
      textLower.includes("प्रॉपर्टी टैक्स बकाया") ||
      textLower.includes("ਟੈਕਸ ਬਕਾਇਆ") ||
      textLower.includes("ਪ੍ਰਾਪਰਟੀ ਟੈਕਸ ਬਕਾਇਆ");

    // 3. View property details
    const isPropertyDetails =
      textLower.includes("view property details") ||
      textLower.includes("show property details") ||
      textLower.includes("check property details") ||
      textLower.includes("property details") ||
      textLower.includes("my property details") ||
      textLower.includes("view my property") ||
      textLower.includes("show my property") ||
      textLower.includes("see property details") ||
      textLower.includes("ptid") ||
      textLower.includes("property id") ||
      textLower.includes("प्रॉपर्टी विवरण") ||
      textLower.includes("प्रॉपर्टी की जानकारी") ||
      textLower.includes("ਮੇਰੀ ਪ੍ਰਾਪਰਟੀ") ||
      textLower.includes("ਪ੍ਰਾਪਰਟੀ ਦੇ ਵੇਰਵੇ") ||
      textLower.includes("ਜਾਇਦਾਦ ਦੇ ਵੇਰਵੇ");

    // 4. Check water/sewerage dues
    const isWaterDues =
      textLower.includes("check water/sewerage dues") ||
      textLower.includes("check water and sewerage dues") ||
      textLower.includes("water and sewerage dues") ||
      textLower.includes("water/sewerage dues") ||
      textLower.includes("check water dues") ||
      textLower.includes("check sewerage dues") ||
      textLower.includes("water dues") ||
      textLower.includes("sewerage dues") ||
      textLower.includes("show my water bill") ||
      textLower.includes("water bill") ||
      textLower.includes("sewerage bill") ||
      textLower.includes("water connection") ||
      textLower.includes("पानी का बिल") ||
      textLower.includes("सीवरेज का बिल") ||
      textLower.includes("पानी और सीवरेज बकाया") ||
      textLower.includes("ਪਾਣੀ ਦਾ ਬਿੱਲ") ||
      textLower.includes("ਸੀਵਰੇਜ ਦਾ ਬਿੱਲ") ||
      textLower.includes("ਪਾਣੀ ਅਤੇ ਸੀਵਰੇਜ ਬਕਾਇਆ") ||
      textLower.includes("paani ka bill") ||
      textLower.includes("wc-");

    // 5. Make payment for outstanding dues
    const isOutstandingPayment =
      textLower.includes("make payment for outstanding dues") ||
      textLower.includes("make payment") ||
      textLower.includes("payment for outstanding dues") ||
      textLower.includes("outstanding dues") ||
      textLower.includes("outstanding amount") ||
      textLower.includes("i want to know my outstanding amount") ||
      textLower.includes("pay outstanding dues") ||
      textLower.includes("pay outstanding amount") ||
      textLower.includes("clear outstanding") ||
      textLower.includes("clear dues") ||
      textLower.includes("pay dues") ||
      textLower.includes("बकाया राशि का भुगतान") ||
      textLower.includes("बकाया राशि") ||
      textLower.includes("कुल बकाया") ||
      textLower.includes("बकाया भुगतान") ||
      textLower.includes("ਬਕਾਇਆ ਰਕਮ ਦਾ ਭੁਗਤਾਨ") ||
      textLower.includes("ਬਕਾਇਆ ਰਕਮ") ||
      textLower.includes("ਕੁੱਲ ਬਕਾਇਆ");

    const isUidLinking =
      textLower.includes("link") ||
      textLower.includes("uid") ||
      textLower.includes("correction") ||
      textLower.includes("mismatch") ||
      textLower.includes("ਲਿੰਕ") ||
      textLower.includes("लिंक");

    if (isPayTax || isPropertyDues || isPropertyDetails || isWaterDues || isOutstandingPayment || isUidLinking) {
      const intentName = isPayTax
        ? "pay_tax"
        : isPropertyDues
        ? "property_dues"
        : isPropertyDetails
        ? "property_details"
        : isWaterDues
        ? "water_dues"
        : isOutstandingPayment
        ? "outstanding_dues"
        : "uid_linking";

      // If citizen is ALREADY verified: fulfill immediately in active language
      if (citizen) {
        fulfillIntentForVerifiedCitizen(citizen, intentName, activeLang);
        return;
      }

      const serviceCategory = isWaterDues ? "water" : "property";
      setSelectedVerificationMethod(isWaterDues ? "water_consumer" : "uid");
      setAuthIdentifier("");

      // If NOT verified: prompt user with in-chat verification card (Radio selection -> Identifier -> OTP)
      setPendingIntent(intentName);
      setAuthOtpSent(false);
      setAuthOtp("");
      setAuthOtpError("");
      setAuthIdentifierError("");
      setTyping(false);

      setMessages((prev) => [
        ...prev,
        {
          id: msgId++,
          role: "bot",
          text: languageService.getAuthRequestPrompt(activeLang, serviceCategory),
          time: now(),
          card: {
            type: "auth_card",
            pendingIntent: intentName,
            serviceCategory,
          },
        },
      ]);
      return;
    }

    // 4. Informational Property Tax Explanations ("What is property tax?")
    const isTaxExplanation =
      textLower.includes("what is property tax") ||
      textLower.includes("explain property tax") ||
      textLower.includes("property tax meaning") ||
      textLower.includes("tell me about property tax") ||
      textLower.includes("प्रॉपर्टी टैक्स क्या") ||
      textLower.includes("संपत्ति कर क्या") ||
      textLower.includes("गृह कर क्या") ||
      textLower.includes("टैक्स क्या होता") ||
      textLower.includes("property tax kya") ||
      textLower.includes("property tax bare dasso") ||
      textLower.includes("ਪ੍ਰਾਪਰਟੀ ਟੈਕਸ ਕੀ ਹੁੰਦਾ") ||
      textLower.includes("ਪ੍ਰਾਪਰਟੀ ਟੈਕਸ ਬਾਰੇ") ||
      textLower.includes("tax bare dasso");

    if (isTaxExplanation) {
      setTyping(false);
      setMessages((prev) => [
        ...prev,
        {
          id: msgId++,
          role: "bot",
          text: languageService.getPropertyTaxExplanation(activeLang),
          time: now(),
        },
      ]);
      return;
    }

    // 5. Rate of electricity bill / PSPCL Tariff & 300 unit scheme
    const isElectricityQuery =
      textLower.includes("electricity") ||
      textLower.includes("rate of electricity bill") ||
      textLower.includes("bijli") ||
      textLower.includes("बिजली") ||
      textLower.includes("ਬਿਜਲੀ") ||
      textLower.includes("tariff") ||
      textLower.includes("300 unit");

    if (isElectricityQuery) {
      setTyping(false);
      setMessages((prev) => [
        ...prev,
        {
          id: msgId++,
          role: "bot",
          text: languageService.getElectricityTariff(activeLang),
          time: now(),
        },
      ]);
      return;
    }

    // 6. How to register property in Punjab
    const isRegistrationQuery =
      textLower.includes("register property") ||
      textLower.includes("registration process") ||
      textLower.includes("steps to register") ||
      textLower.includes("property kaise register") ||
      textLower.includes("रजिस्टर कैसे") ||
      textLower.includes("रजिस्ट्री") ||
      textLower.includes("ਕਿਵੇਂ ਰਜਿਸਟਰ") ||
      textLower.includes("ਰਜਿਸਟਰੀ");

    if (isRegistrationQuery) {
      setTyping(false);
      setMessages((prev) => [
        ...prev,
        {
          id: msgId++,
          role: "bot",
          text: languageService.getPropertyRegistrationSteps(activeLang),
          time: now(),
        },
      ]);
      return;
    }

    // 7. Services Offered
    const isServicesQuery =
      textLower.includes("services") ||
      textLower.includes("what can you do") ||
      textLower.includes("what do you offer") ||
      textLower.includes("सुविधाएं") ||
      textLower.includes("सेवाएं") ||
      textLower.includes("ਸੇਵਾਵਾਂ") ||
      textLower.includes("kya kar sakte ho");

    if (isServicesQuery) {
      setTyping(false);
      setMessages((prev) => [
        ...prev,
        {
          id: msgId++,
          role: "bot",
          text: languageService.getAvailableServices(activeLang),
          time: now(),
        },
      ]);
      return;
    }

    // 8. About Airawat Research Foundation
    if (textLower.includes("airawat") || textLower.includes("foundation") || textLower.includes("about bot")) {
      setTyping(false);
      setMessages((prev) => [
        ...prev,
        {
          id: msgId++,
          role: "bot",
          text: languageService.getAboutInfo(activeLang),
          time: now(),
        },
      ]);
      return;
    }



    // Default conversational fallback response in active language
    setTyping(false);
    setMessages((prev) => [
      ...prev,
      {
        id: msgId++,
        role: "bot",
        text: languageService.getFallbackResponse(activeLang),
        time: now(),
      },
    ]);
  }

  function handleSend(textToSend?: string) {
    const text = (textToSend ?? input).trim();
    if (!text) return;
    const userMsg: Message = { id: msgId++, role: "user", text, time: now() };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    processUserMessage(text);
  }

  // Payment Handoff (Section 4.7)
  async function handleInitiatePayment(bill: ConsolidatedBill, property?: PropertyRecord) {
    setIsPaying(true);
    const citizenName = property?.owners?.[0]?.name || citizen?.name || "Akash Kumar";
    const txn = await msevaService.createPaymentTransaction(bill, selectedGateway, citizenName);

    // 3. Citizen is redirected to the portal's payment gateway to complete the transaction
    try {
      window.open(txn.redirectUrl, "_blank", "noopener,noreferrer");
    } catch (err) {
      console.warn("External gateway redirect open error:", err);
    }

    setTimeout(async () => {
      const verifiedTxn = await msevaService.verifyPayment(txn.txnId, bill);
      setIsPaying(false);

      // 3. Display payment confirmation message along with the Transaction ID
      const confirmationMsg = languageService.getPaymentConfirmationMessage(
        conversationLanguage,
        verifiedTxn.txnId,
        verifiedTxn.txnAmount.toLocaleString("en-IN"),
        verifiedTxn.gateway
      );

      // 4. Post-Payment Notification
      const postPaymentMsg = languageService.getPostPaymentNotification(conversationLanguage);

      setMessages((prev) => [
        ...prev,
        {
          id: msgId++,
          role: "bot",
          text: confirmationMsg,
          time: now(),
          card: {
            type: "payment_success",
            transaction: verifiedTxn,
            bill,
            property,
          },
        },
        {
          id: msgId++,
          role: "bot",
          text: postPaymentMsg,
          time: now(),
        },
      ]);
    }, 1400);
  }

  // Option to download payment receipt (Point 3)
  function handleDownloadReceipt(transaction: PaymentTransaction, bill?: ConsolidatedBill, property?: PropertyRecord) {
    const ownerList =
      property?.owners && property.owners.length > 0
        ? property.owners.map((o, idx) => `${idx + 1}. ${o.name}`).join("\n")
        : citizen?.name
        ? `1. ${citizen.name}`
        : "1. Mr. Akash Kumar\n2. Mrs. Sunita Kumar";

    const mobile = property?.owners?.[0]?.mobileNumber || citizen?.mobileNumber || "9123456789";
    const address = property?.address?.doorNo
      ? `${property.address.doorNo}, ${property.address.locality || property.address.street || "Civil Lines"}, ${property.address.city || "Kanpur Nagar"} - ${property.address.pincode || "208001"}`
      : "21, Civil Lines, Kanpur Nagar - 208001";

    const receiptText = `================================================================================
                    GOVERNMENT OF PUNJAB / UPYOG
                MUNICIPAL CORPORATION CITIZEN SERVICES
                       OFFICIAL PAYMENT RECEIPT
================================================================================
Receipt Number:       ${transaction.receiptNumber || "PB_RCPT_2026_98234"}
Transaction ID:       ${transaction.txnId}
Transaction Status:   ${transaction.txnStatus} (SUCCESSFUL)
Payment Date & Time:  ${transaction.paymentDate || new Date().toLocaleDateString("en-IN")}
Payment Gateway:      ${transaction.gateway} Gateway (Portal Redirection)
Payment Channel:      Online Citizen Portal Payment Gateway
--------------------------------------------------------------------------------
PROPERTY & CITIZEN DETAILS:
Property ID (PTID):   ${transaction.consumerCode}
Mobile Number:        ${mobile}
Owner Name(s):
${ownerList}
Property Address:     ${address}
Financial Year:       2025-2026
--------------------------------------------------------------------------------
DEMAND & ASSESSMENT BREAKDOWN:
Current Demand:       ₹${(bill?.currentTaxDemand || 4500).toFixed(2)}
Previous Arrears:     ₹${(bill?.arrears || 800).toFixed(2)}
Late Fee / Penalty:   ₹${(bill?.penalty || 200).toFixed(2)}
Fire Cess & Charges:  ₹${(bill?.fireCess || 100).toFixed(2)}
--------------------------------------------------------------------------------
TOTAL AMOUNT PAID:    ₹${transaction.txnAmount.toFixed(2)}
--------------------------------------------------------------------------------
Status: COMPLETED / PAID IN FULL

POST-PAYMENT NOTIFICATION:
You have pending property assessments from previous year(s). Please visit the portal to complete the assessment and pay the outstanding dues.
================================================================================
This is a computer-generated official receipt issued by the Municipal Corporation.
================================================================================`;

    const blob = new Blob([receiptText], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `Payment-Receipt-${transaction.receiptNumber || transaction.txnId}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  }

  // Use Case 2: Citizen Confirms UID Linking ("Yes")
  async function handleConfirmUidLink(propertyId: string) {
    const uid = citizen?.uuid || "u123-abc-789";
    setTyping(true);
    const res = await msevaService.updateUidPtidLink(propertyId, uid);
    setTyping(false);

    let userText = "Yes, please link this UID with the property.";
    let botText = `UID (${uid}) has been successfully linked with Property Tax ID ${propertyId} in the MSeva database. The record has been moved to municipal validation workflow status for final verification.`;
    if (conversationLanguage === "hindi") {
      userText = "हाँ, कृपया इस UID को प्रॉपर्टी से लिंक करें।";
      botText = `UID (${uid}) को MSeva डेटाबेस में प्रॉपर्टी टैक्स आईडी ${propertyId} से सफलतापूर्वक लिंक कर दिया गया है। अंतिम सत्यापन के लिए रिकॉर्ड को नगर निगम सत्यापन वर्कफ़्लो में भेज दिया गया है।`;
    } else if (conversationLanguage === "hinglish") {
      userText = "Haan, please is UID ko property se link karein.";
      botText = `UID (${uid}) ko Property Tax ID ${propertyId} se MSeva database mein successfully link kar diya gaya hai. Record ko municipal validation workflow mein bhej diya gaya hai.`;
    } else if (conversationLanguage === "punjabi") {
      userText = "ਹਾਂ ਜੀ, ਕਿਰਪਾ ਕਰਕੇ ਇਸ UID ਨੂੰ ਪ੍ਰਾਪਰਟੀ ਨਾਲ ਲਿੰਕ ਕਰੋ।";
      botText = `UID (${uid}) ਨੂੰ MSeva ਡਾਟਾਬੇਸ ਵਿੱਚ ਪ੍ਰਾਪਰਟੀ ਟੈਕਸ ਆਈਡੀ ${propertyId} ਨਾਲ ਸਫਲਤਾਪੂਰਵਕ ਲਿੰਕ ਕਰ ਦਿੱਤਾ ਗਿਆ ਹੈ। ਅੰਤਿਮ ਤਸਦੀਕ ਲਈ ਰਿਕਾਰਡ ਨੂੰ ਨਗਰ ਨਿਗਮ ਵਰਕਫਲੋ ਵਿੱਚ ਭੇਜ ਦਿੱਤਾ ਗਿਆ ਹੈ।`;
    }

    setMessages((prev) => [
      ...prev,
      {
        id: msgId++,
        role: "user",
        text: userText,
        time: now(),
      },
      {
        id: msgId++,
        role: "bot",
        text: botText,
        time: now(),
        card: {
          trackingId: res.trackingId,
        },
      },
    ]);
  }

  // Use Case 2: Citizen Rejects UID Linking ("No" - Mismatch)
  async function handleRejectUidLink(propertyId: string) {
    const uid = citizen?.uuid || "u123-abc-789";
    setTyping(true);
    const pgr = await msevaService.createDiscrepancyCase(propertyId, uid);
    setTyping(false);

    let userText = "No, this information does not match my records.";
    let botText = `Understood. The property record was NOT updated. A formal mismatch grievance case (${pgr.caseId}) has been registered in MSeva PGR for departmental scrutiny and resolution by municipal officers.`;
    if (conversationLanguage === "hindi") {
      userText = "नहीं, यह जानकारी मेरे रिकॉर्ड से मेल नहीं खाती।";
      botText = `समझ गया। प्रॉपर्टी रिकॉर्ड में बदलाव नहीं किया गया है। नगर निगम अधिकारियों द्वारा जांच और समाधान के लिए MSeva PGR में विसंगति शिकायत (${pgr.caseId}) दर्ज कर ली गई है।`;
    } else if (conversationLanguage === "hinglish") {
      userText = "Nahi, yeh information mere records se match nahi karti.";
      botText = `Samajh gaya. Property record update nahi kiya gaya. Municipal officers dwara jaanch ke liye MSeva PGR mein mismatch complaint case (${pgr.caseId}) register ho gaya hai.`;
    } else if (conversationLanguage === "punjabi") {
      userText = "ਨਹੀਂ, ਇਹ ਜਾਣਕਾਰੀ ਮੇਰੇ ਰਿਕਾਰਡ ਨਾਲ ਮੇਲ ਨਹੀਂ ਖਾਂਦੀ।";
      botText = `ਸਮਝ ਗਿਆ ਜੀ। ਪ੍ਰਾਪਰਟੀ ਰਿਕਾਰਡ ਵਿੱਚ ਕੋਈ ਤਬਦੀਲੀ ਨਹੀਂ ਕੀਤੀ ਗਈ। ਨਗਰ ਨਿਗਮ ਅਧਿਕਾਰੀਆਂ ਦੁਆਰਾ ਜਾਂਚ ਲਈ MSeva PGR ਵਿੱਚ ਸ਼ਿਕਾਇਤ ਕੇਸ (${pgr.caseId}) ਦਰਜ ਕਰ ਲਿਆ ਗਿਆ ਹੈ।`;
    }

    setMessages((prev) => [
      ...prev,
      {
        id: msgId++,
        role: "user",
        text: userText,
        time: now(),
      },
      {
        id: msgId++,
        role: "bot",
        text: botText,
        time: now(),
        card: {
          type: "mismatch_logged",
          caseId: pgr.caseId,
        },
      },
    ]);
  }

  return (
    <div className="fixed inset-0 pointer-events-none font-sans">
      {/* Chat window container matching Frame 5249 */}
      {open && (
        <div className="pointer-events-auto fixed bottom-[88px] right-6 w-[410px] max-w-[calc(100vw-32px)] h-[600px] max-h-[calc(100vh-110px)] flex flex-col rounded-[28px] overflow-hidden chat-window-rainbow animate-slide-up bg-white">
          {/* Header */}
          <div className="px-5 pt-5 pb-4 flex items-center justify-between border-b border-slate-100 bg-white select-none">
            {/* Left: Avatar + Titles */}
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 rounded-full border border-slate-200 bg-white flex items-center justify-center flex-shrink-0 shadow-xs">
                <BotFace width={26} height={20.4} />
              </div>
              <div className="flex flex-col min-w-0">
                <h1 className="text-[15px] font-semibold text-slate-800 leading-tight tracking-tight">
                  Bharat chatbot
                </h1>
                <p className="text-[9.5px] uppercase font-medium tracking-wider text-neutral-400 mt-0.5 leading-tight">
                  Powered by AIRAWAT RESEARCH FOUNDATION
                </p>
              </div>
            </div>

            {/* Right: Actions (Refresh, Export, Clear) */}
            <div className="flex items-center gap-2 flex-shrink-0">
              <button
                type="button"
                onClick={handleReset}
                className="w-8 h-8 rounded-full border border-slate-200/90 text-slate-400 hover:text-slate-700 hover:border-slate-300 hover:bg-slate-50 flex items-center justify-center transition-colors cursor-pointer"
                title="Reset session"
                aria-label="Restart chat"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" />
                  <path d="M21 3v5h-5" />
                  <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16" />
                  <path d="M3 21v-5h5" />
                </svg>
              </button>

              <button
                type="button"
                onClick={handleDownload}
                className="w-8 h-8 rounded-full border border-slate-200/90 text-slate-400 hover:text-slate-700 hover:border-slate-300 hover:bg-slate-50 flex items-center justify-center transition-colors cursor-pointer"
                title="Download chat transcript"
                aria-label="Download chat transcript"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M4 14.899A7 7 0 1 1 15.71 8h1.79a4.5 4.5 0 0 1 2.5 8.242" />
                  <path d="M12 12v9" />
                  <path d="m8 17 4 4 4-4" />
                </svg>
              </button>
            </div>
          </div>

          {/* Body: Direct Conversational Interface */}
          <div className="flex-1 bg-white flex flex-col overflow-hidden justify-between">
            {messages.length === 0 ? (
              /* Center Text Heading when user opens for first time or re-visits */
              <div className="flex-1 flex flex-col items-center justify-center text-center px-6 select-none animate-fade-in">
                <p className="text-[15px] text-neutral-600 font-normal leading-relaxed">
                  {languageService.getLandingGreeting(conversationLanguage).line1}
                </p>
                <p className="text-[15px] text-neutral-600 font-normal mt-0.5">
                  {languageService.getLandingGreeting(conversationLanguage).line2}
                </p>
              </div>
            ) : (
              /* Messages scroll area */
              <div className="flex-1 overflow-y-auto chat-scrollbar bg-[#f8fafc] px-4 py-4 flex flex-col gap-3.5">
              {messages.map((msg, idx) => {
                const isLatest = idx === messages.length - 1;
                const isCardVisible = !isLatest || textFinishedIds.has(msg.id);
                return msg.role === "bot" ? (
                  <div key={msg.id} className="flex items-start gap-2.5 max-w-[92%]">
                    <div className="flex-shrink-0 w-7 h-7 rounded-full bg-white border border-[#2563eb]/20 flex items-center justify-center shadow-xs mt-0.5">
                      <BotFace width={16} height={12.6} />
                    </div>
                    <div className="flex flex-col gap-2 flex-1">
                      <div className="bg-white rounded-[16px] rounded-tl-[4px] px-4 py-2.5 shadow-[0_2px_8px_rgba(0,0,0,0.04)] border border-slate-100">
                        <AnimatedBotText
                          text={msg.text}
                          isLatest={isLatest}
                          onLineReveal={() => {
                            if (bottomRef.current) {
                              bottomRef.current.scrollIntoView({ behavior: "smooth", block: "nearest" });
                            }
                          }}
                          onComplete={() => {
                            setTextFinishedIds((prev) => new Set(prev).add(msg.id));
                            setTimeout(() => {
                              if (bottomRef.current) {
                                bottomRef.current.scrollIntoView({ behavior: "smooth", block: "nearest" });
                              }
                            }, 50);
                          }}
                        />
                      </div>

                      {/* Interactive Cards (Fade in gracefully after text finishes revealing) */}
                      {isCardVisible && (
                        <div className="flex flex-col gap-2 animate-fade-in">

                      {/* IN-CHAT AUTHENTICATION CARD (Appears when user asks for property/tax details) */}
                      {msg.card?.type === "auth_card" && (() => {
                        const isWaterCard =
                          msg.card?.serviceCategory === "water" ||
                          msg.card?.pendingIntent === "water_bill" ||
                          msg.card?.pendingIntent === "water_dues";

                        const availableMethods: Array<{
                          key: VerificationMethod;
                          label: string;
                          placeholder: string;
                          testHint: string;
                          testVal: string;
                          workflowHint?: string;
                          workflowVal?: string;
                        }> = isWaterCard
                          ? [
                              {
                                key: "water_consumer",
                                label: cardLabels.optWaterConsumer,
                                placeholder: cardLabels.placeholderWaterConsumer,
                                testHint: cardLabels.testWaterConsumer,
                                testVal: "WC-334455",
                              },
                              {
                                key: "sewerage_consumer",
                                label: cardLabels.optSewerageConsumer,
                                placeholder: cardLabels.placeholderSewerageConsumer,
                                testHint: cardLabels.testSewerageConsumer,
                                testVal: "SC-334455",
                              },
                            ]
                          : [
                              {
                                key: "uid",
                                label: cardLabels.optUid,
                                placeholder: cardLabels.placeholderUid,
                                testHint: cardLabels.testUid,
                                testVal: "u123-abc-789",
                              },
                              {
                                key: "ptid",
                                label: cardLabels.optPtid,
                                placeholder: cardLabels.placeholderPtid,
                                testHint: "Use test PTID (Active): KNP-123-456-78",
                                testVal: "KNP-123-456-78",
                                workflowHint: "Test PTID (In Workflow): KNP-999-000-11",
                                workflowVal: "KNP-999-000-11",
                              },
                              {
                                key: "mobile",
                                label: cardLabels.optMobile,
                                placeholder: cardLabels.placeholderMobile,
                                testHint: "Use test mobile: 9123456789",
                                testVal: "9123456789",
                              },
                            ];

                        const activeMethodKey = availableMethods.some((m) => m.key === selectedVerificationMethod)
                          ? selectedVerificationMethod
                          : availableMethods[0].key;

                        const currentMethodConfig =
                          availableMethods.find((m) => m.key === activeMethodKey) || availableMethods[0];

                        return (
                          <div className="bg-white rounded-2xl border border-neutral-200/90 p-4 shadow-sm text-xs flex flex-col gap-3.5 max-w-[320px] animate-fade-in">
                            <div className="border-b border-slate-100 pb-2 flex items-center justify-between">
                              <span className="font-semibold text-slate-800 flex items-center gap-1.5">
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="2.2">
                                  <rect width="18" height="11" x="3" y="11" rx="2" ry="2" />
                                  <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                                </svg>
                                {cardLabels.citizenVerification}
                              </span>
                              <span className="text-[10px] text-blue-600 font-semibold bg-blue-50 px-2 py-0.5 rounded">
                                MSeva Punjab
                              </span>
                            </div>

                            {/* Radio Button Options */}
                            <div className="flex flex-col gap-1.5">
                              <span className="text-[11.5px] font-medium text-slate-700">
                                {cardLabels.selectVerificationMethod}
                              </span>
                              <div className="flex flex-col gap-1.5">
                                {availableMethods.map((m) => {
                                  const isSelected = activeMethodKey === m.key;
                                  return (
                                    <label
                                      key={m.key}
                                      onClick={() => {
                                        if (!authOtpSent) {
                                          setSelectedVerificationMethod(m.key);
                                          setAuthIdentifier("");
                                          setAuthIdentifierError("");
                                        }
                                      }}
                                      className={`flex items-center gap-2.5 px-3 py-2 rounded-lg border text-xs cursor-pointer transition-all ${
                                        isSelected
                                          ? "border-[#2563EB] bg-blue-50/70 text-[#1e40af] font-medium ring-1 ring-[#2563EB]/25 shadow-2xs"
                                          : "border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-normal"
                                      } ${authOtpSent ? "opacity-60 cursor-not-allowed" : ""}`}
                                    >
                                      <input
                                        type="radio"
                                        name={`verificationMethod_${msg.id}`}
                                        value={m.key}
                                        checked={isSelected}
                                        disabled={authOtpSent}
                                        onChange={() => {
                                          if (!authOtpSent) {
                                            setSelectedVerificationMethod(m.key);
                                            setAuthIdentifier("");
                                            setAuthIdentifierError("");
                                          }
                                        }}
                                        className="w-3.5 h-3.5 text-[#2563EB] focus:ring-[#2563EB] accent-[#2563EB] cursor-pointer"
                                      />
                                      <span className="select-none leading-none">{m.label}</span>
                                    </label>
                                  );
                                })}
                              </div>
                            </div>

                            {/* Dynamic Identifier Field */}
                            <div>
                              <div className="flex items-center justify-between mb-1">
                                <label className="text-[11.5px] font-medium text-slate-700">
                                  {currentMethodConfig.label}
                                </label>
                                {authOtpSent && (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setAuthOtpSent(false);
                                      setAuthOtp("");
                                      setAuthOtpError("");
                                    }}
                                    className="text-[11px] text-[#2563EB] hover:underline font-medium cursor-pointer"
                                  >
                                    {cardLabels.change}
                                  </button>
                                )}
                              </div>
                              <input
                                type={activeMethodKey === "mobile" ? "tel" : "text"}
                                disabled={authOtpSent}
                                value={authIdentifier}
                                onChange={(e) => {
                                  const newVal = e.target.value;
                                  setAuthIdentifier(newVal);

                                  if (activeMethodKey === "mobile") {
                                    const cleanDigits = newVal.replace(/\D/g, "");
                                    if (cleanDigits.length > 10) {
                                      setAuthIdentifierError(cardLabels.mobileMoreThan10(cleanDigits.length));
                                    } else if (authIdentifierError) {
                                      setAuthIdentifierError("");
                                    }
                                  } else if (authIdentifierError) {
                                    setAuthIdentifierError("");
                                  }
                                }}
                                onBlur={() => {
                                  if (activeMethodKey === "mobile" && authIdentifier.trim()) {
                                    const cleanDigits = authIdentifier.replace(/\D/g, "");
                                    if (cleanDigits.length < 10) {
                                      setAuthIdentifierError(cardLabels.mobileLessThan10(cleanDigits.length));
                                    } else if (cleanDigits.length > 10) {
                                      setAuthIdentifierError(cardLabels.mobileMoreThan10(cleanDigits.length));
                                    }
                                  }
                                }}
                                placeholder={currentMethodConfig.placeholder}
                                className={`w-full px-3 py-2 rounded-lg border text-xs text-neutral-800 placeholder:text-neutral-300 focus:outline-none transition-all ${
                                  authOtpSent
                                    ? "bg-slate-50 border-neutral-200 text-neutral-600"
                                    : authIdentifierError
                                    ? "border-rose-500 ring-1 ring-rose-500 bg-rose-50/20"
                                    : "border-neutral-200 focus:border-[#2563EB] focus:ring-1 focus:ring-[#2563EB]"
                                }`}
                              />
                              {authIdentifierError && !authOtpSent && (
                                <p className="text-[11px] text-rose-500 font-medium mt-1 flex items-center gap-1">
                                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                    <circle cx="12" cy="12" r="10" />
                                    <line x1="12" y1="8" x2="12" y2="12" />
                                    <line x1="12" y1="16" x2="12.01" y2="16" />
                                  </svg>
                                  {authIdentifierError}
                                </p>
                              )}
                              {!authOtpSent && !authIdentifier && (
                                <div className="mt-1 flex flex-col gap-0.5">
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setAuthIdentifier(currentMethodConfig.testVal);
                                      setAuthIdentifierError("");
                                    }}
                                    className="text-[10.5px] text-[#2563EB] hover:underline font-medium text-left cursor-pointer"
                                  >
                                    {currentMethodConfig.testHint}
                                  </button>
                                  {currentMethodConfig.workflowVal && (
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setAuthIdentifier(currentMethodConfig.workflowVal!);
                                        setAuthIdentifierError("");
                                      }}
                                      className="text-[10.5px] text-amber-700 hover:underline font-medium text-left cursor-pointer"
                                    >
                                      {currentMethodConfig.workflowHint}
                                    </button>
                                  )}
                                </div>
                              )}
                            </div>

                            {/* Step 4: Limited Record Confirmation Preview */}
                            {authOtpSent && identifiedPreview && (
                              <div className="bg-blue-50/70 border border-blue-200/90 rounded-xl p-3 text-xs text-slate-800 space-y-1.5 animate-fade-in font-medium">
                                <div className="border-b border-blue-200/60 pb-1.5 flex items-center">
                                  <span className="text-[10.5px] bg-blue-100 text-blue-800 px-2 py-0.5 rounded font-mono font-medium whitespace-nowrap">
                                    {identifiedPreview.identifierLabel}: {identifiedPreview.identifierValue}
                                  </span>
                                </div>
                                <div className="text-[11px] space-y-0.5 text-slate-700 font-medium">
                                  <p><span className="font-medium text-slate-600">{cardLabels.ownerNameLabel}:</span> <span className="font-medium text-slate-800">{identifiedPreview.maskedOwner}</span></p>
                                  <p><span className="font-medium text-slate-600">{cardLabels.propertyAddressLabel}:</span> <span className="font-medium text-slate-800">{identifiedPreview.address}</span></p>
                                  <p><span className="font-medium text-slate-600">{cardLabels.registeredMobileLabel}:</span> <span className="font-mono text-blue-800 font-medium">{identifiedPreview.maskedMobile}</span></p>
                                </div>
                                <p className="text-[10.5px] text-blue-700 font-medium">
                                  {cardLabels.recordPreviewPrompt}
                                </p>
                              </div>
                            )}

                            {/* OTP Field (Only shown after clicking Send OTP - Step 5) */}
                            {authOtpSent && (
                              <div className="animate-fade-in flex flex-col gap-1">
                                <div className="flex items-center justify-between">
                                  <label className="block text-[11.5px] font-medium text-slate-700">
                                    {cardLabels.otpLabel}
                                  </label>
                                  <span className="text-[10px] text-slate-400">OTP sent via SMS</span>
                                </div>
                                <input
                                  type="text"
                                  maxLength={6}
                                  autoFocus
                                  value={authOtp}
                                  onChange={(e) => {
                                    setAuthOtp(e.target.value);
                                    if (authOtpError) setAuthOtpError("");
                                  }}
                                  placeholder={cardLabels.enterOtpPlaceholder}
                                  className={`w-full px-3 py-2 rounded-lg border text-xs text-neutral-800 placeholder:text-neutral-300 focus:outline-none transition-all ${
                                    authOtpError
                                      ? "border-rose-500 ring-1 ring-rose-500 bg-rose-50/20"
                                      : "border-neutral-200 focus:border-[#2563EB] focus:ring-1 focus:ring-[#2563EB]"
                                  }`}
                                />
                                {authOtpError ? (
                                  <div className="flex flex-col gap-1.5 animate-fade-in">
                                    <p className="text-[11px] text-rose-600 font-medium mt-1 flex items-center gap-1">
                                      <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                        <circle cx="12" cy="12" r="10" />
                                        <line x1="12" y1="8" x2="12" y2="12" />
                                        <line x1="12" y1="16" x2="12.01" y2="16" />
                                      </svg>
                                      {authOtpError}
                                    </p>
                                    <div className="flex items-center gap-3 text-[11px] pl-0.5">
                                      <button
                                        type="button"
                                        onClick={() => handleSendAuthOtp()}
                                        className="text-[#2563EB] hover:underline font-medium cursor-pointer"
                                      >
                                        {cardLabels.resendOtp}
                                      </button>
                                      <span className="text-slate-300">•</span>
                                      <button
                                        type="button"
                                        onClick={() => {
                                          setAuthOtpSent(false);
                                          setIdentifiedPreview(null);
                                          setAuthOtp("");
                                          setAuthOtpError("");
                                        }}
                                        className="text-slate-600 hover:underline font-medium cursor-pointer"
                                      >
                                        {cardLabels.changeIdentifier}
                                      </button>
                                    </div>
                                  </div>
                                ) : (
                                  <div className="flex items-center justify-between mt-1 text-[10.5px] text-slate-400">
                                    <span>{cardLabels.testOtpHint}</span>
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setAuthOtp("123456");
                                        setAuthOtpError("");
                                      }}
                                      className="text-[#2563EB] hover:underline font-medium cursor-pointer"
                                    >
                                      {cardLabels.autoFillOtp}
                                    </button>
                                  </div>
                                )}
                              </div>
                            )}

                            {/* CTA Button: Send OTP or Verify & Continue */}
                            <button
                              type="button"
                              disabled={isSendingOtp || isVerifyingOtp}
                              onClick={() => (authOtpSent ? handleVerifyAuthOtp(msg.card?.pendingIntent) : handleSendAuthOtp())}
                              className="w-full py-2.5 px-3 bg-[#2563EB] hover:bg-[#1d4ed8] active:scale-[0.99] text-white text-xs font-medium rounded-lg shadow-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-60"
                            >
                              {isSendingOtp
                                ? cardLabels.sendingOtp
                                : isVerifyingOtp
                                ? cardLabels.verifyingOtp
                                : authOtpSent
                                ? cardLabels.verifyAndContinue
                                : cardLabels.sendOtp}
                            </button>
                          </div>
                        );
                      })()}

                      {/* View Property Details Card */}
                      {msg.card?.type === "property_details" && msg.card.property && (
                        <BillReceiptCard
                          bill={msg.card.bill}
                          property={msg.card.property}
                          citizen={citizen}
                        />
                      )}

                      {/* Property Tax / Water Demand Bill Receipt Card (Step 6) */}
                      {msg.card?.type === "bill_dues" && (
                        <BillReceiptCard
                          bill={msg.card.bill}
                          property={msg.card.property}
                          water={msg.card.water}
                          citizen={citizen}
                        />
                      )}

                      {/* Payment Options Card (Step 7) */}
                      {msg.card?.type === "payment_modal" && msg.card.bill && (
                        <div className="bg-gradient-to-br from-blue-50/70 to-indigo-50/70 rounded-xl p-3.5 border border-blue-100 shadow-xs flex flex-col gap-2.5">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-semibold text-slate-700">Select Payment Gateway</span>
                            <span className="text-xs font-bold text-blue-700">₹{msg.card.bill.totalAmount.toFixed(2)}</span>
                          </div>
                          <div className="grid grid-cols-3 gap-1.5">
                            {(["AXIS", "HDFC", "PAYTM"] as const).map((gw) => (
                              <button
                                key={gw}
                                type="button"
                                onClick={() => setSelectedGateway(gw)}
                                className={`py-1.5 text-xs font-medium rounded border transition-all cursor-pointer ${
                                  selectedGateway === gw
                                    ? "bg-blue-600 text-white border-blue-600 shadow-xs"
                                    : "bg-white text-slate-700 border-slate-200 hover:border-blue-300"
                                }`}
                              >
                                {gw}
                              </button>
                            ))}
                          </div>
                          <button
                            type="button"
                            disabled={isPaying}
                            onClick={() => msg.card?.bill && handleInitiatePayment(msg.card.bill, msg.card.property)}
                            className="w-full py-2.5 bg-[#2563EB] hover:bg-[#1d4ed8] active:scale-[0.99] text-white font-medium rounded-lg text-xs shadow-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-60"
                          >
                            {isPaying ? (
                              <span className="flex items-center gap-1.5">
                                <svg className="animate-spin -ml-1 mr-1.5 h-3.5 w-3.5 text-white" fill="none" viewBox="0 0 24 24">
                                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path>
                                </svg>
                                <span>Redirecting to Payment Gateway...</span>
                              </span>
                            ) : (
                              <span>{cardLabels.payNow} ({selectedGateway})</span>
                            )}
                          </button>
                        </div>
                      )}

                      {/* Payment Success Card (Minimal & Simple Card) */}
                      {msg.card?.type === "payment_success" && msg.card.transaction && (
                        <div className="bg-white rounded-2xl p-4 border border-neutral-200/90 text-xs flex flex-col gap-3 max-w-[320px] w-full shadow-xs animate-fade-in select-text">
                          {/* 1. Header: Single-line title and status badge without checkicon or (SUCCESS) */}
                          <div className="flex items-center justify-between pb-2 border-b border-neutral-100">
                            <span className="text-[13px] font-medium text-neutral-900 tracking-tight leading-none">
                              {cardLabels.paymentSuccessful}
                            </span>
                            <span className="text-[10px] font-medium text-emerald-700 bg-emerald-50/90 border border-emerald-200/60 px-2 py-0.5 rounded-md leading-none">
                              Confirmed
                            </span>
                          </div>

                          {/* 2. Transaction Details List */}
                          <div className="flex flex-col gap-2">
                            <div className="flex justify-between items-center text-[11.5px]">
                              <span className="text-neutral-500 font-normal">Transaction ID</span>
                              <span className="font-mono text-neutral-800 font-medium">{msg.card.transaction.txnId}</span>
                            </div>

                            <div className="flex justify-between items-center text-[11.5px]">
                              <span className="text-neutral-500 font-normal">Receipt No</span>
                              <span className="font-mono text-neutral-800 font-medium">{msg.card.transaction.receiptNumber}</span>
                            </div>

                            <div className="flex justify-between items-center text-[11.5px]">
                              <span className="text-neutral-500 font-normal">Property ID</span>
                              <span className="font-mono text-neutral-800 font-medium">{msg.card.transaction.consumerCode}</span>
                            </div>

                            <div className="flex justify-between items-center text-[11.5px]">
                              <span className="text-neutral-500 font-normal">Payment Gateway</span>
                              <span className="text-neutral-800 font-medium">{msg.card.transaction.gateway} PG</span>
                            </div>

                            {/* Divider */}
                            <div className="border-t border-dashed border-neutral-200 my-0.5" />

                            <div className="flex justify-between items-center">
                              <span className="text-[12px] text-neutral-600 font-normal">Amount Paid</span>
                              <span className="text-[15px] font-mono font-bold text-neutral-900">
                                ₹{msg.card.transaction.txnAmount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                              </span>
                            </div>
                          </div>

                          {/* 3. Download Payment Receipt CTA */}
                          <button
                            type="button"
                            onClick={() => handleDownloadReceipt(msg.card!.transaction!, msg.card?.bill, msg.card?.property)}
                            className="w-full mt-0.5 py-2.5 px-3 bg-[#2563EB] hover:bg-[#1d4ed8] active:scale-[0.99] text-white font-medium rounded-xl text-xs shadow-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                          >
                            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                              <polyline points="7 10 12 15 17 10" />
                              <line x1="12" y1="15" x2="12" y2="3" />
                            </svg>
                            <span>{cardLabels.downloadReceipt || "Download Payment Receipt"}</span>
                          </button>
                        </div>
                      )}

                      {/* UID - PTID Linking Card (Use Case 2) */}
                      {msg.card?.type === "uid_linking" && msg.card.property && (
                        <div className="bg-white rounded-xl p-3.5 border border-slate-200 shadow-xs text-xs flex flex-col gap-2.5 animate-fade-in">
                          <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                            <span className="font-semibold text-slate-800 flex items-center gap-1.5">
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="2">
                                <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
                                <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
                              </svg>
                              UID & PTID Linking (MSeva Data Correction)
                            </span>
                            <span className="px-2 py-0.5 bg-blue-50 text-blue-700 font-semibold rounded text-[10px]">
                              Review Details
                            </span>
                          </div>

                          <div className="bg-slate-50 p-2.5 rounded-lg text-[11px] space-y-1 text-slate-700 border border-slate-100">
                            <div className="flex justify-between">
                              <span className="font-semibold text-slate-600">Property ID (PTID):</span>
                              <span className="font-mono font-bold text-slate-900">{msg.card.property.propertyId}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="font-semibold text-slate-600">
                                {msg.card.property.owners && msg.card.property.owners.length > 1 ? "Owner Names:" : "Owner Name:"}
                              </span>
                              <span className="font-medium text-slate-900 text-right">
                                {msg.card.property.owners && msg.card.property.owners.length > 1
                                  ? msg.card.property.owners.map((o) => o.name).join(", ")
                                  : msg.card.property.owners[0].name}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="font-semibold text-slate-600">Mobile No:</span>
                              <span className="font-mono text-slate-900">{msg.card.property.owners[0].mobileNumber}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="font-semibold text-slate-600">Property Address:</span>
                              <span className="text-slate-800 text-right max-w-[65%]">
                                {msg.card.property.address.doorNo}, {msg.card.property.address.locality}, {msg.card.property.address.city}
                              </span>
                            </div>
                            <div className="flex justify-between border-t border-slate-200/60 pt-1">
                              <span className="font-semibold text-slate-600">Current Linked Account:</span>
                              <span className="font-mono text-amber-700 font-medium">{msg.card.property.accountId}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="font-semibold text-slate-600">Target Citizen UID:</span>
                              <span className="font-mono text-blue-700 font-semibold">{citizen?.uuid || "u123-abc-789"}</span>
                            </div>
                          </div>

                          <p className="font-medium text-slate-800 text-xs">
                            {cardLabels.uidMatchingPrompt(citizen?.uuid || "u123-abc-789")}
                          </p>

                          <div className="flex gap-2">
                            <button
                              type="button"
                              onClick={() => msg.card?.property && handleConfirmUidLink(msg.card.property.propertyId)}
                              className="flex-1 py-2 bg-[#2563EB] hover:bg-[#1d4ed8] text-white font-medium rounded-lg text-xs transition-all cursor-pointer shadow-xs"
                            >
                              {cardLabels.yesLinkUid}
                            </button>
                            <button
                              type="button"
                              onClick={() => msg.card?.property && handleRejectUidLink(msg.card.property.propertyId)}
                              className="flex-1 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-medium rounded-lg text-xs transition-all cursor-pointer"
                            >
                              {cardLabels.noReportMismatch}
                            </button>
                          </div>
                        </div>
                      )}

                      {/* Workflow tracking card */}
                      {msg.card?.trackingId && (
                        <div className="bg-blue-50/70 p-2.5 rounded-lg border border-blue-200 text-xs text-blue-900">
                          <p className="font-semibold">Municipal Workflow Updated</p>
                          <p className="text-[11px] text-blue-800">Workflow Reference ID: <span className="font-mono font-bold">{msg.card.trackingId}</span></p>
                        </div>
                      )}

                          {/* PGR Mismatch alert card */}
                          {msg.card?.type === "mismatch_logged" && msg.card.caseId && (
                            <div className="bg-amber-50 p-2.5 rounded-lg border border-amber-200 text-xs text-amber-900">
                              <p className="font-semibold">Grievance Ticket Generated (MSeva PGR)</p>
                              <p className="text-[11px] text-amber-800">Case Ticket No: <span className="font-mono font-bold">{msg.card.caseId}</span></p>
                              <p className="text-[10px] text-amber-700 mt-0.5">Queued for Municipal Corporation departmental verification.</p>
                            </div>
                          )}
                        </div>
                      )}

                      <p className="text-[11px] text-slate-400 pl-1">{msg.time}</p>
                    </div>
                  </div>
                ) : (
                  <div key={msg.id} className="max-w-[85%] self-end flex flex-col items-end">
                    <div className="bg-[#e5e7eb] text-[#1f2937] text-[13.5px] font-normal px-4.5 py-2 rounded-full shadow-none break-words">
                      <p className="leading-snug">{msg.text}</p>
                    </div>
                    <p className="text-[10.5px] text-slate-400 mt-1 pr-1.5">{msg.time}</p>
                  </div>
                );
              })}

              {/* Typing Indicator */}
              {typing && (
                <div className="flex items-end gap-2">
                  <div className="flex-shrink-0 w-7 h-7 rounded-full bg-white border border-[#2563eb]/20 flex items-center justify-center shadow-xs">
                    <BotFace width={16} height={12.6} />
                  </div>
                  <div className="bg-white rounded-[16px] rounded-bl-[4px] px-4 py-3 shadow-xs border border-slate-100 flex gap-1.5 items-center">
                    <span className="typing-dot w-2 h-2 rounded-full bg-slate-400 inline-block" />
                    <span className="typing-dot w-2 h-2 rounded-full bg-slate-400 inline-block" />
                    <span className="typing-dot w-2 h-2 rounded-full bg-slate-400 inline-block" />
                  </div>
                </div>
              )}

              <div ref={bottomRef} />
            </div>
            )}

            {/* Bottom Section: Predefined Question Chips + Message Box */}
            <div className="px-4 pb-4 pt-1 bg-white select-none flex flex-col gap-2.5">
              {/* Predefined Question Chips (Positioned just above the message box; hidden once user starts chatting) */}
              {messages.length === 0 && (
                <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-0.5 scroll-smooth animate-fade-in">
                  {chips.map((chip) => (
                    <button
                      key={chip}
                      type="button"
                      onClick={() => handleSend(chip)}
                      className="flex-shrink-0 bg-[#ebeef1] hover:bg-[#dfe3e8] active:scale-95 text-[#2d3748] text-[12.5px] font-medium px-3.5 py-1.5 rounded-full transition-all cursor-pointer whitespace-nowrap"
                    >
                      {chip}
                    </button>
                  ))}
                </div>
              )}

              {/* Bottom Message Box matching Screenshot */}
              <div className="w-full bg-white rounded-[18px] border border-slate-200 shadow-[0_1px_8px_rgba(0,0,0,0.04)] p-3.5 flex flex-col justify-between transition-all focus-within:border-blue-500/80 focus-within:ring-1 focus-within:ring-blue-500/30">
                {/* Input Text Field */}
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && input.trim() && !typing) {
                      handleSend(input.trim());
                    }
                  }}
                  placeholder={languageService.getInputPlaceholder(conversationLanguage)}
                  className="w-full text-sm text-slate-800 placeholder:text-neutral-400 outline-none bg-transparent mb-3"
                />

                {/* Bottom Action Toolbar inside the Box */}
                <div className="flex items-center justify-between pt-1">
                  {/* Left: Camera icon */}
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="p-1 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer rounded hover:bg-slate-50"
                    title="Attach document or photo"
                    aria-label="Camera"
                  >
                    <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z" />
                      <circle cx="12" cy="13" r="3" />
                    </svg>
                  </button>
                  <input
                    type="file"
                    ref={fileInputRef}
                    className="hidden"
                    accept="image/*,.pdf"
                    onChange={(e) => {
                      if (e.target.files?.[0]) {
                        handleSend(`Uploaded document: ${e.target.files[0].name}`);
                      }
                    }}
                  />

                  {/* Right: Microphone + Send Button */}
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setIsListening((v) => !v);
                        if (!isListening && !input.trim()) {
                          setInput("I want to know about property tax");
                        }
                      }}
                      className={`p-1 transition-colors cursor-pointer rounded hover:bg-slate-50 ${
                        isListening ? "text-rose-500 animate-pulse" : "text-slate-400 hover:text-slate-600"
                      }`}
                      title={isListening ? "Listening..." : "Voice input"}
                      aria-label="Microphone"
                    >
                      <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" />
                        <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
                        <line x1="12" x2="12" y1="19" y2="22" />
                      </svg>
                    </button>

                    <button
                      type="button"
                      onClick={() => input.trim() && handleSend(input.trim())}
                      disabled={!input.trim() || typing}
                      className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${
                        input.trim() && !typing
                          ? "bg-[#2563eb] hover:bg-[#1d4ed8] text-white shadow-xs cursor-pointer active:scale-95"
                          : "bg-slate-200 text-slate-400 cursor-not-allowed shadow-none"
                      }`}
                      title={input.trim() ? "Send message" : "Type a message to send"}
                      aria-label="Send message"
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className="translate-x-[-0.5px] translate-y-[0.5px]">
                        <line x1="22" y1="2" x2="11" y2="13" />
                        <polygon points="22 2 15 22 11 13 2 9 22 2" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Floating Action Button (FAB) at bottom right */}
      {open ? (
        <button
          type="button"
          onClick={() => setOpen(false)}
          aria-label="Close chat"
          className="pointer-events-auto fixed bottom-6 right-6 flex items-center justify-center transition-all duration-200 active:scale-95 hover:scale-105 bg-white rounded-full shadow-[0_6px_20px_rgba(0,0,0,0.14)] border border-slate-200 text-slate-700 hover:text-slate-900 w-12 h-12 cursor-pointer"
        >
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
      ) : (
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-label="Open chat"
          className="chat-fab pointer-events-auto fixed bottom-6 right-6 flex items-center justify-center transition-all duration-200 active:scale-95 hover:scale-105 cursor-pointer"
          style={{
            width: 56,
            height: 56,
            borderRadius: 35,
            padding: 0,
            border: "3px solid transparent",
            boxShadow: "0 10px 25px -4px rgba(0, 0, 0, 0.16), 0 4px 10px -2px rgba(0, 0, 0, 0.08)",
            overflow: "visible",
          }}
        >
          <BotFace width={38} height={29.8} />
        </button>
      )}
    </div>
  );
}
