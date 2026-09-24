/**
 * Language Detection & Multilingual Conversational Engine
 * Supports: English, Hindi, Hinglish (Romanized Hindi), Punjabi (Gurmukhi & Romanized)
 */

export type SupportedLanguage = "english" | "hindi" | "hinglish" | "punjabi";

export interface DetectionResult {
  language: SupportedLanguage;
  isExplicitSwitch: boolean;
  confidence: number;
}

// Explicit Language Switch Triggers
const EXPLICIT_SWITCH_PATTERNS: Array<{ lang: SupportedLanguage; regex: RegExp }> = [
  {
    lang: "english",
    regex: /\b(in english|english please|speak in english|talk in english|answer in english|reply in english|explain in english|english mein|english vich|english me)\b/i,
  },
  {
    lang: "hindi",
    regex: /\b(in hindi|hindi please|speak in hindi|talk in hindi|answer in hindi|reply in hindi|explain in hindi|hindi mein|hindi me|हिंदी में|हिन्दी में|हिंदी में बताओ|हिंदी में समझाइए|हिंदी में बात करो)\b/i,
  },
  {
    lang: "hinglish",
    regex: /\b(in hinglish|hinglish please|speak in hinglish|talk in hinglish|answer in hinglish|reply in hinglish|explain in hinglish|hinglish mein|hinglish me|hinglish vich)\b/i,
  },
  {
    lang: "punjabi",
    regex: /\b(in punjabi|punjabi please|speak in punjabi|talk in punjabi|answer in punjabi|reply in punjabi|explain in punjabi|punjabi vich|punjabi mein|punjabi me|ਪੰਜਾਬੀ ਵਿੱਚ|ਪੰਜਾਬੀ ਚ|ਪੰਜਾਬੀ ਵਿੱਚ ਦੱਸੋ|ਪੰਜਾਬੀ ਵਿੱਚ ਸਮਝਾਓ)\b/i,
  },
];

// Lexical markers for Romanized Hindi (Hinglish)
const HINGLISH_MARKERS = new Set([
  "kya", "kyu", "kyun", "kaise", "kaisa", "kaisi", "kab", "kahan", "kaha", "kitna", "kitni", "kitne",
  "hai", "hain", "ho", "hoon", "tha", "thi", "the", "hoga", "hogi", "honge",
  "mera", "meri", "mere", "mujhe", "mujhko", "hum", "humein", "humara", "humari",
  "aap", "aapka", "aapki", "aapke", "aapko", "tum", "tumhara", "tumhe",
  "karo", "kare", "karna", "karein", "kar", "karu", "karun", "karta", "karti",
  "batao", "bataiye", "batao", "bolo", "boliye", "samjhao", "dekhna", "dekh",
  "chahiye", "chahta", "chahti", "chahte", "milega", "milegi", "aayega", "aayegi",
  "bharna", "bharo", "bharein", "bhariye", "dena", "dijiye", "diya",
  "aur", "ya", "pe", "par", "se", "ko", "me", "mein", "ka", "ki", "ke", "liye", "wala", "wali", "wale",
  "nahi", "nahin", "mat", "bhi", "bahut", "thoda", "kuch", "koi", "sab", "sabse",
  "accha", "theek", "shukriya", "dhanyawad", "namaste", "namaskar"
]);

// Lexical markers for Romanized Punjabi
const PUNJABI_LATIN_MARKERS = new Set([
  "dasso", "dso", "dass", "dassa", "dasiyo", "bare", "baare", "vich", "ch",
  "kivein", "kiven", "kida", "kiddan", "kive", "kivve", "kadon", "kithe", "kinna", "kinni", "kinne",
  "ki", "kehda", "kehdi", "kehde", "keda", "kedi",
  "hunda", "hundi", "hunde", "hove", "hovega", "hovegi", "chalda", "chaldia",
  "tusi", "tussi", "tuhada", "tuhadi", "tuhade", "tainu", "tenu",
  "sannu", "sanhu", "assi", "asin", "mera", "meri", "mere",
  "chahida", "chahidi", "chahide", "paise", "kariye", "karie", "karo",
  "bharna", "bhariye", "bharo", "dasso", "samjhao", "jankari",
  "ithe", "uthe", "hor", "vi", "nahi", "nahin", "hai", "han", "si", "sige",
  "sat", "sri", "akal", "rabb", "ji"
]);

export class LanguageService {
  /**
   * Detects the language of a user message.
   * Priority:
   * 1. Explicit user request (e.g. "answer in Hindi", "Punjabi vich dasso")
   * 2. Unicode script detection:
   *    - Gurmukhi (U+0A00 to U+0A7F) -> Punjabi
   *    - Devanagari (U+0900 to U+097F) -> Hindi
   * 3. Latin script analysis:
   *    - Scored against Punjabi Latin markers -> Punjabi
   *    - Scored against Hinglish markers -> Hinglish
   *    - Scored against English lexical patterns -> English
   * 4. Dominant language for mixed messages (e.g., "Mujhe property tax ka payment status check karna hai, how can I do that?")
   * 5. Fallback to previous conversation language or English
   */
  public detectLanguage(
    text: string,
    currentConversationLanguage: SupportedLanguage = "english"
  ): DetectionResult {
    const trimmed = text.trim();
    if (!trimmed) {
      return { language: currentConversationLanguage, isExplicitSwitch: false, confidence: 1.0 };
    }

    // 1. Explicit Language Switch Request
    for (const item of EXPLICIT_SWITCH_PATTERNS) {
      if (item.regex.test(trimmed)) {
        return { language: item.lang, isExplicitSwitch: true, confidence: 1.0 };
      }
    }

    // 2. Script Detection
    const hasGurmukhi = /[\u0A00-\u0A7F]/.test(trimmed);
    const hasDevanagari = /[\u0900-\u097F]/.test(trimmed);

    if (hasGurmukhi) {
      return { language: "punjabi", isExplicitSwitch: false, confidence: 0.98 };
    }
    if (hasDevanagari) {
      return { language: "hindi", isExplicitSwitch: false, confidence: 0.98 };
    }

    // 3. Latin Script Analysis
    // Tokenize words
    const tokens = trimmed
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, " ")
      .split(/\s+/)
      .filter((w) => w.length > 0);

    if (tokens.length === 0) {
      return { language: currentConversationLanguage, isExplicitSwitch: false, confidence: 0.5 };
    }

    // Check for short ambiguous messages: e.g. "ok", "yes", "no", "thanks", "hello", "hi", "done", numbers
    const isAmbiguousShort =
      tokens.length <= 2 &&
      /^(ok|okay|yes|yeah|yep|no|nah|thanks|thank you|hello|hi|hey|done|fine|sure|123456|[0-9]+)$/i.test(
        trimmed
      );

    if (isAmbiguousShort) {
      return { language: currentConversationLanguage, isExplicitSwitch: false, confidence: 0.5 };
    }

    let punjabiScore = 0;
    let hinglishScore = 0;
    let englishScore = 0;

    for (const word of tokens) {
      if (PUNJABI_LATIN_MARKERS.has(word)) {
        punjabiScore += 2.5; // High specificity for unique Punjabi terms
      }
      if (HINGLISH_MARKERS.has(word)) {
        hinglishScore += 1.8;
      }
      // Common English function words
      if (
        /^(what|is|are|how|can|i|to|the|a|an|my|your|we|it|check|pay|tell|explain|rate|bill|dues|due|services|registered|register|status|detail|details|tax|property|water|receipt|contact|help)$/i.test(
          word
        )
      ) {
        englishScore += 1.0;
      }
    }

    // Specific strong Punjabi triggers in Latin
    if (
      /\b(dasso|dso|bare|vich|kivein|kiven|tuhada|tuhadi|hunda|hundi|chahida|bhariye)\b/i.test(trimmed)
    ) {
      punjabiScore += 3.0;
    }

    // Specific strong Hinglish patterns: "kya hota hai", "kaise kar sakte hain", "mujhe ... karna hai", "bataiye"
    if (
      /\b(kya hota hai|kaise kar|kaise karein|kaise kare|karna hai|karna chahta|batao|bataiye|dekhna hai|kitna hai|kya hai|pata karna hai)\b/i.test(
        trimmed
      )
    ) {
      hinglishScore += 4.0;
    }

    // Mixed sentence dominant logic:
    // If Hinglish markers are present alongside English domain terms (e.g. "Mujhe property tax ka payment status check karna hai, how can I do that?"):
    // Hinglish sentence framing should dominate.
    if (hinglishScore >= 2.0 && hinglishScore >= punjabiScore) {
      return { language: "hinglish", isExplicitSwitch: false, confidence: 0.9 };
    }

    if (punjabiScore >= 2.0 && punjabiScore > hinglishScore) {
      return { language: "punjabi", isExplicitSwitch: false, confidence: 0.9 };
    }

    if (englishScore > 0 && hinglishScore === 0 && punjabiScore === 0) {
      return { language: "english", isExplicitSwitch: false, confidence: 0.9 };
    }

    // If ambiguous or no strong marker, retain conversation language
    return { language: currentConversationLanguage, isExplicitSwitch: false, confidence: 0.5 };
  }

  /**
   * Predefined question chips tailored for each language
   */
  public getPredefinedChips(lang: SupportedLanguage): string[] {
    switch (lang) {
      case "hindi":
        return [
          "मैं अपना प्रॉपर्टी टैक्स भरना चाहता हूँ।",
          "मेरा प्रॉपर्टी टैक्स बकाया कितना है?",
          "मेरा पानी का बिल दिखाएं।",
          "मेरी बकाया राशि क्या है?",
        ];
      case "hinglish":
        return [
          "I want to pay my property tax.",
          "What are my property tax dues?",
          "Show my water bill.",
          "I want to know my outstanding amount.",
        ];
      case "punjabi":
        return [
          "ਮੈਂ ਆਪਣਾ ਪ੍ਰਾਪਰਟੀ ਟੈਕਸ ਭਰਨਾ ਚਾਹੁੰਦਾ ਹਾਂ।",
          "ਮੇਰਾ ਪ੍ਰਾਪਰਟੀ ਟੈਕਸ ਬਕਾਇਆ ਕਿੰਨਾ ਹੈ?",
          "ਮੇਰਾ ਪਾਣੀ ਦਾ ਬਿੱਲ ਦਿਖਾਓ।",
          "ਮੇਰੀ ਬਕਾਇਆ ਰਕਮ ਕਿੰਨੀ ਹੈ?",
        ];
      case "english":
      default:
        return [
          "I want to pay my property tax.",
          "What are my property tax dues?",
          "Show my water bill.",
          "I want to know my outstanding amount.",
        ];
    }
  }

  /**
   * Initial center landing greeting
   */
  public getLandingGreeting(lang: SupportedLanguage): { line1: string; line2: string } {
    switch (lang) {
      case "hindi":
        return {
          line1: "नमस्ते — भारत चैटबॉट एआई सहायक में आपका स्वागत है",
          line2: "आज मैं आपकी क्या सहायता कर सकता हूँ?",
        };
      case "hinglish":
        return {
          line1: "Hi — Bharat chatbot AI assistant mein aapka swagat hai",
          line2: "Aaj main aapki kya madad kar sakta hoon?",
        };
      case "punjabi":
        return {
          line1: "ਸਤਿ ਸ੍ਰੀ ਅਕਾਲ — ਭਾਰਤ ਚੈਟਬੌਟ ਏਆਈ ਸਹਾਇਕ ਵਿੱਚ ਤੁਹਾਡਾ ਸਵਾਗਤ ਹੈ",
          line2: "ਅੱਜ ਮੈਂ ਤੁਹਾਡੀ ਕੀ ਮਦਦ ਕਰ ਸਕਦਾ ਹਾਂ?",
        };
      case "english":
      default:
        return {
          line1: "Hi — welcome to Bharat chatbot AI assistant",
          line2: "How can I help you today?",
        };
    }
  }

  /**
   * Input placeholder text
   */
  public getInputPlaceholder(lang: SupportedLanguage): string {
    switch (lang) {
      case "hindi":
        return "प्रॉपर्टी टैक्स या बिजली बिल के बारे में पूछें...";
      case "hinglish":
        return "Property tax ya bill ke baare mein poochein...";
      case "punjabi":
        return "ਪ੍ਰਾਪਰਟੀ ਟੈਕਸ ਜਾਂ ਬਿਜਲੀ ਬਿੱਲ ਬਾਰੇ ਪੁੱਛੋ...";
      case "english":
      default:
        return "I want to know about property tax";
    }
  }

  /**
   * Language Switch Confirmation Acknowledgement
   */
  public getLanguageSwitchResponse(lang: SupportedLanguage): string {
    switch (lang) {
      case "hindi":
        return "ज़रूर! भाषा बदलकर हिंदी कर दी गई है। अब आप मुझसे हिंदी में बात कर सकते हैं। आज मैं आपकी क्या सहायता कर सकता हूँ?";
      case "hinglish":
        return "Sure! Language ab Hinglish kar di gayi hai. Aap normal Hinglish mein pooch sakte hain. Bataiye main aapki kya madad kar sakta hoon?";
      case "punjabi":
        return "ਜ਼ਰੂਰ ਜੀ! ਭਾਸ਼ਾ ਪੰਜਾਬੀ ਵਿੱਚ ਬਦਲ ਦਿੱਤੀ ਗਈ ਹੈ। ਤੁਸੀਂ ਪੰਜਾਬੀ ਵਿੱਚ ਗੱਲਬਾਤ ਜਾਰੀ ਰੱਖ ਸਕਦੇ ਹੋ। ਮੈਂ ਅੱਜ ਤੁਹਾਡੀ ਕੀ ਮਦਦ ਕਰ ਸਕਦਾ ਹਾਂ?";
      case "english":
      default:
        return "Sure! The conversation language has been set to English. How can I assist you today?";
    }
  }

  /**
   * Property Tax Explanation response
   */
  public getPropertyTaxExplanation(lang: SupportedLanguage): string {
    switch (lang) {
      case "hindi":
        return `🏠 **पंजाब में प्रॉपर्टी टैक्स क्या है?**\n\nप्रॉपर्टी टैक्स (संपत्ति कर) एक वार्षिक प्रत्यक्ष नगर निगम कर है जो पंजाब के नगर निगमों और परिषदों द्वारा आवासीय, वाणिज्यिक और औद्योगिक संपत्तियों पर लगाया जाता है।\n\n• **आकलन का आधार**: यूनिट एरिया वैल्यू, संपत्ति का प्रकार और कवर्ड एरिया।\n• **छूट (Rebate)**: समय पर वार्षिक भुगतान करने पर छूट का लाभ मिलता है।\n\n*क्या आप अपनी सक्रिय संपत्ति का टैक्स बकाया देखना चाहते हैं या संपत्ति विवरण चेक करना चाहते हैं?*`;
      case "hinglish":
        return `🏠 **Punjab mein Property Tax kya hota hai?**\n\nProperty tax ek annual direct municipal tax hai jo Punjab ki Municipal Corporations aur Municipal Councils residential, commercial aur industrial real estate properties par lagati hain.\n\n• **Assessment**: Unit area value, property category aur covered area ke aadhar par hota hai.\n• **Rebate**: Time par payment karne par annual bill par rebate milti hai.\n\n*Kya aap apna active property tax dues ya property details check karna chahte hain?*`;
      case "punjabi":
        return `🏠 **ਪੰਜਾਬ ਵਿੱਚ ਪ੍ਰਾਪਰਟੀ ਟੈਕਸ ਕੀ ਹੁੰਦਾ ਹੈ?**\n\nਪ੍ਰਾਪਰਟੀ ਟੈਕਸ ਇੱਕ ਸਾਲਾਨਾ ਸਿੱਧਾ ਨਗਰ ਨਿਗਮ ਕਰ ਹੈ ਜੋ ਪੰਜਾਬ ਦੀਆਂ ਮਿਊਂਸਿਪਲ ਕਾਰਪੋਰੇਸ਼ਨਾਂ ਅਤੇ ਕੌਂਸਲਾਂ ਦੁਆਰਾ ਰਿਹਾਇਸ਼ੀ, ਵਪਾਰਕ ਅਤੇ ਉਦਯੋਗਿਕ ਜਾਇਦਾਦਾਂ 'ਤੇ ਲਗਾਇਆ ਜਾਂਦਾ ਹੈ।\n\n• **ਮੁਲਾਂਕਣ**: ਯੂਨਿਟ ਏਰੀਆ ਵੈਲਯੂ, ਜਾਇਦਾਦ ਦੀ ਸ਼੍ਰੇਣੀ ਅਤੇ ਕਵਰਡ ਏਰੀਆ ਦੇ ਆਧਾਰ 'ਤੇ।\n• **ਛੋਟ (Rebate)**: ਸਮੇਂ ਸਿਰ ਭੁਗਤਾਨ ਕਰਨ 'ਤੇ ਵਿਸ਼ੇਸ਼ ਛੋਟ ਮਿਲਦੀ ਹੈ।\n\n*ਕੀ ਤੁਸੀਂ ਆਪਣੇ ਬਕਾਇਆ ਪ੍ਰਾਪਰਟੀ ਟੈਕਸ ਜਾਂ ਜਾਇਦਾਦ ਦੇ ਵੇਰਵੇ ਦੇਖਣਾ ਚਾਹੁੰਦੇ ਹੋ?*`;
      case "english":
      default:
        return `🏠 **What is Property Tax in Punjab?**\n\nProperty tax is an annual direct municipal tax levied by Municipal Corporations and Municipal Councils across Punjab on real estate properties (residential, commercial, and industrial).\n\n• **Assessment**: Based on unit area value, property category, and covered area.\n• **Rebates**: Early payment offers rebates on your annual bill.\n\n*Would you like to check your active property tax dues or view your property details?*`;
    }
  }

  /**
   * Electricity bill explanation (PSPCL 300 unit scheme)
   */
  public getElectricityTariff(lang: SupportedLanguage): string {
    switch (lang) {
      case "hindi":
        return `⚡ **पंजाब (PSPCL) बिजली बिल टैरिफ और सब्सिडी:**\n\n• **300 यूनिट मुफ्त बिजली योजना**: पात्र घरेलू उपभोक्ताओं को प्रति माह 300 यूनिट (प्रति बिलिंग चक्र 600 यूनिट) तक मुफ्त बिजली दी जाती है।\n• **घरेलू टैरिफ स्लैब**:\n  - 100 यूनिट तक: ₹4.49/यूनिट\n  - 101 से 300 यूनिट: ₹6.34/यूनिट\n  - 300 यूनिट से अधिक: ₹7.75/यूनिट\n• **वाणिज्यिक/औद्योगिक**: स्वीकृत लोड और वोल्टेज श्रेणी के अनुसार बिल किया जाता है।\n\nआप अपने PSPCL बिजली बिल का ऑनलाइन भुगतान पंजाब स्टेट पोर्टल के माध्यम से कर सकते हैं।`;
      case "hinglish":
        return `⚡ **Punjab (PSPCL) Electricity Bill Tariff & Subsidies:**\n\n• **300 Units Free Power Scheme**: Eligible domestic households ko har mahine 300 units tak (bimonthly cycle mein 600 units) free power milti hai.\n• **Domestic Tariff Slabs**:\n  - 100 units tak: ₹4.49/unit\n  - 101 se 300 units: ₹6.34/unit\n  - 300 units se upar: ₹7.75/unit\n• **Commercial/Industrial**: Sanctioned load tier aur category ke according bill hota hai.\n\nAap apna PSPCL electricity bill Punjab State portal ke through online pay kar sakte hain.`;
      case "punjabi":
        return `⚡ **ਪੰਜਾਬ (PSPCL) ਬਿਜਲੀ ਬਿੱਲ ਟੈਰਿਫ ਅਤੇ ਸਬਸਿਡੀਆਂ:**\n\n• **300 ਯੂਨਿਟ ਮੁਫ਼ਤ ਬਿਜਲੀ ਸਕੀਮ**: ਯੋਗ ਘਰੇਲੂ ਖਪਤਕਾਰਾਂ ਨੂੰ ਹਰ ਮਹੀਨੇ 300 ਯੂਨਿਟ (ਦੋ ਮਹੀਨਿਆਂ ਦੇ ਚੱਕਰ ਵਿੱਚ 600 ਯੂਨਿਟ) ਮੁਫ਼ਤ ਬਿਜਲੀ ਮਿਲਦੀ ਹੈ।\n• **ਘਰੇਲੂ ਟੈਰਿਫ ਸਲੈਬ**:\n  - 100 ਯੂਨਿਟ ਤੱਕ: ₹4.49/ਯੂਨਿਟ\n  - 101 ਤੋਂ 300 ਯੂਨਿਟ: ₹6.34/ਯੂਨਿਟ\n  - 300 ਯੂਨਿਟ ਤੋਂ ਵੱਧ: ₹7.75/ਯੂਨਿਟ\n• **ਵਪਾਰਕ/ਉਦਯੋਗਿਕ**: ਮਨਜ਼ੂਰਸ਼ੁਦਾ ਲੋਡ ਅਨੁਸਾਰ ਬਿੱਲ ਕੀਤਾ ਜਾਂਦਾ ਹੈ।\n\nਤੁਸੀਂ ਆਪਣਾ PSPCL ਬਿਜਲੀ ਬਿੱਲ ਪੰਜਾਬ ਸਟੇਟ ਪੋਰਟਲ ਰਾਹੀਂ ਆਨਲਾਈਨ ਭਰ ਸਕਦੇ ਹੋ।`;
      case "english":
      default:
        return `⚡ **Punjab (PSPCL) Electricity Bill Tariff & Subsidies:**\n\n• **300 Units Zero Bill Scheme**: Eligible domestic households receive up to 300 units of free power per month (600 units per bimonthly cycle).\n• **Domestic Tariff Slabs**:\n  - Up to 100 units: ₹4.49/unit\n  - 101 to 300 units: ₹6.34/unit\n  - Above 300 units: ₹7.75/unit\n• **Commercial/Industrial**: Billed according to sanctioned load tier and voltage category.\n\nYou can pay your PSPCL electricity bills online via the Punjab State portal.`;
    }
  }

  /**
   * Property Registration steps
   */
  public getPropertyRegistrationSteps(lang: SupportedLanguage): string {
    switch (lang) {
      case "hindi":
        return `📋 **पंजाब में प्रॉपर्टी रजिस्टर करने की प्रक्रिया (PMIDC / NGDRS):**\n\n1. **ऑनलाइन डीड तैयार करना**: पंजाब के आधिकारिक NGDRS पोर्टल पर डीड का विवरण भरें।\n2. **दस्तावेज़ अपलोड**: टाइटल डीड, पैन/आधार कार्ड और नगर निगम प्रॉपर्टी टैक्स क्लीयरेंस (PTID) अपलोड करें।\n3. **स्टाम्प शुल्क भुगतान**: लागू स्टाम्प ड्यूटी और नगर निगम पंजीकरण शुल्क ऑनलाइन जमा करें।\n4. **एसआरओ (SRO) अपॉइंटमेंट**: बायोमेट्रिक सत्यापन के लिए स्थानीय सब-रजिस्ट्रार कार्यालय की अपॉइंटमेंट बुक करें।\n\n*क्या आप अपना प्रॉपर्टी टैक्स स्टेटस चेक करना चाहते हैं या फोन नंबर से लिंक जांचना चाहते हैं?*`;
      case "hinglish":
        return `📋 **Punjab mein Property Register karne ka process (PMIDC / NGDRS):**\n\n1. **Online Deed Preparation**: Punjab ke official NGDRS portal par deed details bharein.\n2. **Documents Upload**: Title Deed, PAN / Aadhaar card aur Municipal Property Tax Clearance (PTID) upload karein.\n3. **Stamp Duty Calculation**: Applicable stamp duty aur municipal registration charges online pay karein.\n4. **SRO Appointment**: Biometric verification ke liye local Sub-Registrar Office ka appointment book karein.\n\n*Kya aap apna Property Tax status check karna chahte hain?*`;
      case "punjabi":
        return `📋 **ਪੰਜਾਬ ਵਿੱਚ ਜਾਇਦਾਦ ਰਜਿਸਟਰ ਕਰਨ ਦੇ ਪੜਾਅ (PMIDC / NGDRS):**\n\n1. **ਆਨਲਾਈਨ ਡੀਡ ਤਿਆਰ ਕਰਨਾ**: ਪੰਜਾਬ ਦੇ ਅਧਿਕਾਰਤ NGDRS ਪੋਰਟਲ 'ਤੇ ਜਾ ਕੇ ਡੀਡ ਦੇ ਵੇਰਵੇ ਦਰਜ ਕਰੋ।\n2. **ਦਸਤਾਵੇਜ਼ ਅੱਪਲੋਡ**: ਟਾਈਟਲ ਡੀਡ, ਪੈਨ/ਆਧਾਰ ਕਾਰਡ ਅਤੇ ਮਿਊਂਸਿਪਲ ਪ੍ਰਾਪਰਟੀ ਟੈਕਸ ਕਲੀਅਰੈਂਸ (PTID) ਅੱਪਲੋਡ ਕਰੋ।\n3. **ਸਟੈਂਪ ਡਿਊਟੀ**: ਲਾਗੂ ਸਟੈਂਪ ਡਿਊਟੀ ਅਤੇ ਰਜਿਸਟ੍ਰੇਸ਼ਨ ਫੀਸ ਆਨਲਾਈਨ ਅਦਾ ਕਰੋ।\n4. **SRO ਮੁਲਾਕਾਤ (Appointment)**: ਬਾਇਓਮੀਟ੍ਰਿਕ ਤਸਦੀਕ ਲਈ ਸਬ-ਰਜਿਸਟਰਾਰ ਦਫ਼ਤਰ ਦੀ ਮੁਲਾਕਾਤ ਬੁੱਕ ਕਰੋ।\n\n*ਕੀ ਤੁਸੀਂ ਆਪਣਾ ਪ੍ਰਾਪਰਟੀ ਟੈਕਸ ਸਟੇਟਸ ਜਾਂ ਬਕਾਇਆ ਚੈੱਕ ਕਰਨਾ ਚਾਹੁੰਦੇ ਹੋ?*`;
      case "english":
      default:
        return `📋 **Steps to Register Property in Punjab (PMIDC / NGDRS):**\n\n1. **Online Deed Preparation**: Visit the official Punjab portal and prepare the deed details.\n2. **Upload Documents**: Upload Title Deed, PAN / Aadhaar card, and Municipal Property Tax Clearance (PTID).\n3. **Stamp Duty Calculation**: Calculate and pay applicable stamp duty & municipal registration charges online.\n4. **Book SRO Appointment**: Schedule an appointment with your local Sub-Registrar Office for biometric verification.\n\n*Would you like to check your Property Tax status or verify if your property is mapped to your phone number?*`;
    }
  }

  /**
   * Available services response
   */
  public getAvailableServices(lang: SupportedLanguage): string {
    switch (lang) {
      case "hindi":
        return `🏢 **PMIDC नागरिक सेवाएं:**\n\n• **प्रॉपर्टी टैक्स**: PTID द्वारा प्रॉपर्टी खोजें, टैक्स ब्रेकडाउन देखें और बकाया भुगतान करें।\n• **पानी और सीवरेज**: सक्रिय कनेक्शन, मीटर विवरण जांचें और मासिक बिल भरें।\n• **UID-PTID लिंकिंग**: अपनी नागरिक UID को प्रॉपर्टी आईडी से लिंक करें या विसंगति की शिकायत दर्ज करें।\n• **शिकायत निवारण (PGR)**: MSeva PGR में स्वचालित रूप से शिकायत टिकट दर्ज करें।`;
      case "hinglish":
        return `🏢 **PMIDC Citizen Services Available:**\n\n• **Property Tax**: PTID se property search karein, tax breakdown dekhein aur dues pay karein.\n• **Water & Sewerage**: Active consumer connections, meter details check karein aur monthly bill pay karein.\n• **UID-PTID Linking**: Apna Citizen UID Property Tax ID se link karein ya mismatch report karein.\n• **Grievance Redressal (PGR)**: MSeva PGR portal par automatically complaint ticket generate karein.`;
      case "punjabi":
        return `🏢 **PMIDC ਨਾਗਰਿਕ ਸੇਵਾਵਾਂ ਉਪਲਬਧ ਹਨ:**\n\n• **ਪ੍ਰਾਪਰਟੀ ਟੈਕਸ**: PTID ਰਾਹੀਂ ਜਾਇਦਾਦ ਲੱਭੋ, ਟੈਕਸ ਮੰਗ ਦੇ ਵੇਰਵੇ ਦੇਖੋ ਅਤੇ ਬਕਾਇਆ ਅਦਾ ਕਰੋ।\n• **ਪਾਣੀ ਅਤੇ ਸੀਵਰੇਜ**: ਸਰਗਰਮ ਕੁਨੈਕਸ਼ਨ, ਮੀਟਰ ਵੇਰਵੇ ਚੈੱਕ ਕਰੋ ਅਤੇ ਮਹੀਨਾਵਾਰ ਬਿੱਲ ਭਰੋ।\n• **UID-PTID ਲਿੰਕਿੰਗ**: ਆਪਣੀ ਨਾਗਰਿਕ UID ਨੂੰ ਪ੍ਰਾਪਰਟੀ ਆਈਡੀ ਨਾਲ ਜੋੜੋ ਜਾਂ ਰਿਕਾਰਡ ਸੁਧਾਰ ਲਈ ਬੇਨਤੀ ਕਰੋ।\n• **ਸ਼ਿਕਾਇਤ ਨਿਵਾਰਣ (PGR)**: MSeva PGR ਰਾਹੀਂ ਆਟੋਮੈਟਿਕ ਸ਼ਿਕਾਇਤ ਟਿਕਟ ਦਰਜ ਕਰੋ।`;
      case "english":
      default:
        return `🏢 **PMIDC Citizen Services Available:**\n\n• **Property Tax**: Search property by PTID, view line-item demand breakdown, and pay dues.\n• **Water & Sewerage**: Check active consumer connections, meter details, and pay monthly bills.\n• **UID-PTID Linking**: Link your Citizen UID with your Property Tax ID or report record mismatches.\n• **Grievance Redressal**: Automatically log mismatch tickets in MSeva PGR for municipal review.`;
    }
  }

  /**
   * Airawat Foundation info
   */
  public getAboutInfo(lang: SupportedLanguage): string {
    switch (lang) {
      case "hindi":
        return `ऐरावत रिसर्च फाउंडेशन (AIRAWAT RESEARCH FOUNDATION) पंजाब भर में नगर निगम और ई-गवर्नेंस सेवाओं को सरल, पारदर्शी और नागरिक-अनुकूल बनाने के लिए डिजिटल चैटबॉट तकनीक प्रदान करता है।`;
      case "hinglish":
        return `AIRAWAT RESEARCH FOUNDATION Punjab mein municipal aur public e-governance services ko easy, transparent aur citizen-friendly banane ke liye intelligent conversational AI infrastructure provide karta hai.`;
      case "punjabi":
        return `ਐਰਾਵਤ ਰਿਸਰਚ ਫਾਊਂਡੇਸ਼ਨ (AIRAWAT RESEARCH FOUNDATION) ਪੰਜਾਬ ਭਰ ਵਿੱਚ ਨਗਰ ਨਿਗਮ ਅਤੇ ਈ-ਗਵਰਨੈਂਸ ਸੇਵਾਵਾਂ ਨੂੰ ਸੁਚਾਰੂ, ਪਾਰਦਰਸ਼ੀ ਅਤੇ ਆਸਾਨ ਬਣਾਉਣ ਲਈ ਡਿਜੀਟਲ ਏਆਈ ਬੁਨਿਆਦੀ ਢਾਂਚਾ ਪ੍ਰਦਾਨ ਕਰਦਾ ਹੈ।`;
      case "english":
      default:
        return `AIRAWAT RESEARCH FOUNDATION powers intelligent, citizen-first conversational digital infrastructure to make municipal and public e-governance services seamless, transparent, and accessible across Punjab.`;
    }
  }

  /**
   * Sensitive query authentication request prompt
   */
  public getAuthRequestPrompt(lang: SupportedLanguage, category: "property" | "water" = "property"): string {
    if (category === "water") {
      switch (lang) {
        case "hindi":
          return `अपने पानी और सीवरेज कनेक्शन, बिल और बकाया देखने के लिए, कृपया नीचे दिए गए विकल्पों में से सत्यापन का तरीका चुनें और ओटीपी से सत्यापित करें:`;
        case "hinglish":
          return `Apne water aur sewerage connection, bill aur dues dekhne ke liye, kripya neeche diye options mein se verification method select karein aur OTP se verify karein:`;
        case "punjabi":
          return `ਆਪਣੇ ਪਾਣੀ ਅਤੇ ਸੀਵਰੇਜ ਕਨੈਕਸ਼ਨ, ਬਿੱਲ ਅਤੇ ਬਕਾਇਆ ਦੇਖਣ ਲਈ, ਕਿਰਪਾ ਕਰਕੇ ਹੇਠਾਂ ਦਿੱਤੇ ਵਿਕਲਪਾਂ ਵਿੱਚੋਂ ਤਸਦੀਕ ਦਾ ਤਰੀਕਾ ਚੁਣੋ ਅਤੇ OTP ਰਾਹੀਂ ਤਸਦੀਕ ਕਰੋ:`;
        case "english":
        default:
          return `To access your water and sewerage billing records, please select your verification method below and verify via OTP:`;
      }
    }
    switch (lang) {
      case "hindi":
        return `अपने गोपनीय संपत्ति विवरण, कर मांग और रिकॉर्ड देखने के लिए, कृपया नीचे दिए गए विकल्पों में से सत्यापन का तरीका चुनें और ओटीपी से सत्यापित करें:`;
      case "hinglish":
        return `Apne confidential property details, tax demands aur records dekhne ke liye, kripya neeche diye options mein se verification method select karein aur OTP se verify karein:`;
      case "punjabi":
        return `ਆਪਣੇ ਗੁਪਤ ਪ੍ਰਾਪਰਟੀ ਵੇਰਵੇ, ਟੈਕਸ ਮੰਗ ਅਤੇ ਰਿਕਾਰਡ ਦੇਖਣ ਲਈ, ਕਿਰਪਾ ਕਰਕੇ ਹੇਠਾਂ ਦਿੱਤੇ ਵਿਕਲਪਾਂ ਵਿੱਚੋਂ ਤਸਦੀਕ ਦਾ ਤਰੀਕਾ ਚੁਣੋ ਅਤੇ OTP ਰਾਹੀਂ ਤਸਦੀਕ ਕਰੋ:`;
      case "english":
      default:
        return `To retrieve your confidential property tax records and details, please select your verification method below and verify via OTP:`;
    }
  }

  /**
   * Successful citizen authentication message
   */
  public getAuthSuccessMessage(
    lang: SupportedLanguage,
    name: string,
    intent: string
  ): { title: string; duesPrompt?: string } {
    switch (lang) {
      case "hindi":
        if (intent === "property_tax" || intent === "pay_tax" || intent === "property_dues") {
          return {
            title: `सत्यापन सफल रहा! स्वागत है, ${name}।\n\nयहाँ MSeva डेटाबेस से आपके सक्रिय संपत्ति कर रिकॉर्ड और सत्यापित मांग का विवरण दिया गया है:`,
            duesPrompt: `क्या आप अभी ऑनलाइन भुगतान करना चाहते हैं?`,
          };
        } else if (intent === "property_details") {
          return {
            title: `सत्यापन सफल रहा! स्वागत है, ${name}।\n\nयहाँ MSeva पंजाब में पंजीकृत आपकी संपत्ति का विवरण दिया गया है:`,
            duesPrompt: `क्या आप अपना प्रॉपर्टी टैक्स देखना या भुगतान करना चाहते हैं?`,
          };
        } else if (intent === "water_bill" || intent === "water_dues") {
          return {
            title: `सत्यापन सफल रहा! स्वागत है, ${name}।\n\nयहाँ आपके सक्रिय पानी और सीवरेज कनेक्शन और बिल का विवरण है:`,
            duesPrompt: `क्या आप अभी बकाया पानी का बिल भरना चाहते हैं?`,
          };
        } else if (intent === "outstanding_dues") {
          return {
            title: `सत्यापन सफल रहा! स्वागत है, ${name}।\n\nयहाँ आपकी कुल नगर निगम बकाया राशि और मांग का सारांश दिया गया है:`,
            duesPrompt: `क्या आप अभी ऑनलाइन बकाया भुगतान करना चाहते हैं?`,
          };
        } else if (intent === "uid_linking") {
          return {
            title: `सत्यापन सफल रहा! हमें आपकी प्रोफ़ाइल से जुड़ी नागरिक UID मिली है। MSeva में निम्नलिखित संपत्ति विवरण उपलब्ध है:`,
          };
        }
        return {
          title: `सत्यापन सफल रहा! स्वागत है, ${name}। आपका खाता सत्यापित हो चुका है। अब आप प्रॉपर्टी टैक्स, पानी का बिल चेक कर सकते हैं।`,
        };

      case "hinglish":
        if (intent === "property_tax" || intent === "pay_tax" || intent === "property_dues") {
          return {
            title: `Verification successful! Welcome, ${name}.\n\nYahan MSeva database se aapke active Property Tax records aur verified demand details hain:`,
            duesPrompt: `Kya aap abhi online payment karna chahte hain?`,
          };
        } else if (intent === "property_details") {
          return {
            title: `Verification successful! Welcome, ${name}.\n\nYahan MSeva Punjab mein aapke registered property details hain:`,
            duesPrompt: `Kya aap apna property tax dues check ya pay karna chahte hain?`,
          };
        } else if (intent === "water_bill" || intent === "water_dues") {
          return {
            title: `Verification successful! Welcome, ${name}.\n\nYahan aapke active water aur sewerage connection details hain:`,
            duesPrompt: `Kya aap abhi water dues pay karna chahte hain?`,
          };
        } else if (intent === "outstanding_dues") {
          return {
            title: `Verification successful! Welcome, ${name}.\n\nYahan aapka total municipal outstanding amount summary hai:`,
            duesPrompt: `Kya aap abhi online outstanding dues pay karna chahte hain?`,
          };
        } else if (intent === "uid_linking") {
          return {
            title: `Verification successful! Aapki profile se mapped Citizen UID mil gayi hai. MSeva mein yeh property record available hai:`,
          };
        }
        return {
          title: `Verification successful! Welcome, ${name}. Aapka account verify ho gaya hai. Ab aap property tax ya water bills check kar sakte hain.`,
        };

      case "punjabi":
        if (intent === "property_tax" || intent === "pay_tax" || intent === "property_dues") {
          return {
            title: `ਤਸਦੀਕ ਸਫਲ ਰਹੀ! ਜੀ ਆਇਆਂ ਨੂੰ, ${name}।\n\nਇੱਥੇ MSeva ਡਾਟਾਬੇਸ ਤੋਂ ਤੁਹਾਡੇ ਸਰਗਰਮ ਪ੍ਰਾਪਰਟੀ ਟੈਕਸ ਰਿਕਾਰਡ ਅਤੇ ਮੰਗ ਦੇ ਵੇਰਵੇ ਹਨ:`,
            duesPrompt: `ਕੀ ਤੁਸੀਂ ਹੁਣ ਆਨਲਾਈਨ ਭੁਗਤਾਨ ਕਰਨਾ ਚਾਹੁੰਦੇ ਹੋ?`,
          };
        } else if (intent === "property_details") {
          return {
            title: `ਤਸਦੀਕ ਸਫਲ ਰਹੀ! ਜੀ ਆਇਆਂ ਨੂੰ, ${name}।\n\nਇੱਥੇ MSeva ਪੰਜਾਬ ਵਿੱਚ ਤੁਹਾਡੀ ਰਜਿਸਟਰਡ ਜਾਇਦਾਦ ਦੇ ਵੇਰਵੇ ਹਨ:`,
            duesPrompt: `ਕੀ ਤੁਸੀਂ ਆਪਣਾ ਪ੍ਰਾਪਰਟੀ ਟੈਕਸ ਦੇਖਣਾ ਜਾਂ ਭਰਨਾ ਚਾਹੁੰਦੇ ਹੋ?`,
          };
        } else if (intent === "water_bill" || intent === "water_dues") {
          return {
            title: `ਤਸਦੀਕ ਸਫਲ ਰਹੀ! ਜੀ ਆਇਆਂ ਨੂੰ, ${name}।\n\nਇੱਥੇ ਤੁਹਾਡੇ ਸਰਗਰਮ ਪਾਣੀ ਅਤੇ ਸੀਵਰੇਜ ਕੁਨੈਕਸ਼ਨ ਦੇ ਵੇਰਵੇ ਹਨ:`,
            duesPrompt: `ਕੀ ਤੁਸੀਂ ਹੁਣ ਪਾਣੀ ਦਾ ਬਕਾਇਆ ਬਿੱਲ ਭਰਨਾ ਚਾਹੁੰਦੇ ਹੋ?`,
          };
        } else if (intent === "outstanding_dues") {
          return {
            title: `ਤਸਦੀਕ ਸਫਲ ਰਹੀ! ਜੀ ਆਇਆਂ ਨੂੰ, ${name}।\n\nਇੱਥੇ ਤੁਹਾਡੇ ਕੁੱਲ ਮਿਊਂਸਿਪਲ ਬਕਾਇਆ ਰਕਮ ਦਾ ਸਾਰਾਂਸ਼ ਹੈ:`,
            duesPrompt: `ਕੀ ਤੁਸੀਂ ਹੁਣ ਬਕਾਇਆ ਭੁਗਤਾਨ ਕਰਨਾ ਚਾਹੁੰਦੇ ਹੋ?`,
          };
        } else if (intent === "uid_linking") {
          return {
            title: `ਤਸਦੀਕ ਸਫਲ ਰਹੀ! ਤੁਹਾਡੇ ਪ੍ਰੋਫਾਈਲ ਨਾਲ ਜੁੜੀ ਨਾਗਰਿਕ UID ਮਿਲ ਗਈ ਹੈ। MSeva ਵਿੱਚ ਹੇਠ ਲਿਖੇ ਪ੍ਰਾਪਰਟੀ ਵੇਰਵੇ ਮੌਜੂਦ ਹਨ:`,
          };
        }
        return {
          title: `ਤਸਦੀਕ ਸਫਲ ਰਹੀ! ਜੀ ਆਇਆਂ ਨੂੰ, ${name}। ਤੁਹਾਡਾ ਖਾਤਾ ਤਸਦੀਕ ਹੋ ਗਿਆ ਹੈ। ਹੁਣ ਤੁਸੀਂ ਪ੍ਰਾਪਰਟੀ ਟੈਕਸ ਜਾਂ ਪਾਣੀ ਦੇ ਬਿੱਲ ਦੇਖ ਸਕਦੇ ਹੋ।`,
        };

      case "english":
      default:
        if (intent === "property_tax" || intent === "pay_tax" || intent === "property_dues") {
          return {
            title: `Verification successful! Welcome, ${name}.\n\nHere are your active Property Tax records and verified demand from the MSeva database:`,
            duesPrompt: `Would you like to pay now?`,
          };
        } else if (intent === "property_details") {
          return {
            title: `Verification successful! Welcome, ${name}.\n\nHere are your registered property details from the MSeva Punjab database:`,
            duesPrompt: `Would you like to view detailed tax dues or pay now?`,
          };
        } else if (intent === "water_bill" || intent === "water_dues") {
          return {
            title: `Verification successful! Welcome, ${name}.\n\nHere are your active water and sewerage connection details:`,
            duesPrompt: `Would you like to pay now?`,
          };
        } else if (intent === "outstanding_dues") {
          return {
            title: `Verification successful! Welcome, ${name}.\n\nHere is your consolidated municipal outstanding dues summary:`,
            duesPrompt: `Would you like to settle your outstanding balance now?`,
          };
        } else if (intent === "uid_linking") {
          return {
            title: `Verification successful! We found a Citizen UID associated with your profile. The following property information is available in MSeva:`,
          };
        }
        return {
          title: `Verification successful! Welcome, ${name}. Your account is verified. You can now check property dues, pay taxes, or view water bills.`,
        };
    }
  }

  /**
   * Greeting / Chit-chat response
   */
  public getGreetingResponse(lang: SupportedLanguage): string {
    switch (lang) {
      case "hindi":
        return `नमस्ते! मैं आपकी क्या सहायता कर सकता हूँ?\nआप मुझसे पंजाब में प्रॉपर्टी टैक्स, बिजली बिल दर, पानी-सीवरेज बिल या प्रॉपर्टी रजिस्ट्रेशन के बारे में पूछ सकते हैं।`;
      case "hinglish":
        return `Hello! Main aapki kya madad kar sakta hoon?\nAap mujhse Punjab mein property tax, electricity bill rates, water dues ya property registration ke baare mein pooch sakte hain.`;
      case "punjabi":
        return `ਸਤਿ ਸ੍ਰੀ ਅਕਾਲ ਜੀ! ਮੈਂ ਤੁਹਾਡੀ ਕੀ ਮਦਦ ਕਰ ਸਕਦਾ ਹਾਂ?\nਤੁਸੀਂ ਮੈਨੂੰ ਪੰਜਾਬ ਵਿੱਚ ਪ੍ਰਾਪਰਟੀ ਟੈਕਸ, ਬਿਜਲੀ ਬਿੱਲ ਰੇਟ, ਪਾਣੀ-ਸੀਵਰੇਜ ਜਾਂ ਰਜਿਸਟ੍ਰੇਸ਼ਨ ਬਾਰੇ ਪੁੱਛ ਸਕਦੇ ਹੋ।`;
      case "english":
      default:
        return `Hello! How can I help you today?\nYou can ask me about Property Tax, electricity bill tariffs, water/sewerage dues, or property registration in Punjab.`;
    }
  }

  /**
   * General fallback help response
   */
  public getFallbackResponse(lang: SupportedLanguage): string {
    switch (lang) {
      case "hindi":
        return `मैं निम्नलिखित सेवाओं में आपकी सहायता कर सकता हूँ:\n• प्रॉपर्टी टैक्स मांग और भुगतान\n• प्रॉपर्टी रजिस्ट्रेशन प्रक्रिया मार्गदर्शन\n• पानी और सीवरेज बिल\n• UID-PTID लिंकिंग\n\nआप सामान्य जानकारी पूछ सकते हैं, या अपना बकाया टैक्स चेक करने के लिए कह सकते हैं!`;
      case "hinglish":
        return `Main in services mein aapki help kar sakta hoon:\n• Property Tax demand aur payments\n• Property registration process guide\n• Water aur Sewerage bills\n• UID-PTID linking\n\nAap general sawal pooch sakte hain ya apna tax dues check kar sakte hain!`;
      case "punjabi":
        return `ਮੈਂ ਇਹਨਾਂ ਸੇਵਾਵਾਂ ਵਿੱਚ ਤੁਹਾਡੀ ਮਦਦ ਕਰ ਸਕਦਾ ਹਾਂ:\n• ਪ੍ਰਾਪਰਟੀ ਟੈਕਸ ਮੰਗ ਅਤੇ ਭੁਗਤਾਨ\n• ਪ੍ਰਾਪਰਟੀ ਰਜਿਸਟ੍ਰੇਸ਼ਨ ਪ੍ਰਕਿਰਿਆ\n• ਪਾਣੀ ਅਤੇ ਸੀਵਰੇਜ ਬਿੱਲ\n• UID-PTID ਲਿੰਕਿੰਗ\n\nਤੁਸੀਂ ਆਮ ਸਵਾਲ ਪੁੱਛ ਸਕਦੇ ਹੋ ਜਾਂ ਆਪਣਾ ਬਕਾਇਆ ਟੈਕਸ ਦੇਖਣ ਲਈ ਕਹਿ ਸਕਦੇ ਹੋ!`;
      case "english":
      default:
        return `I'm here to assist you with:\n• Property Tax demand & payments\n• Property registration guidance\n• Water & Sewerage bills\n• UID-PTID linking\n\nYou can ask me general questions freely, or request to check your property dues!`;
    }
  }

  /**
   * Card UI string translations
   */
  public getCardLabels(lang: SupportedLanguage) {
    switch (lang) {
      case "hindi":
        return {
          citizenVerification: "नागरिक सत्यापन",
          selectVerificationMethod: "सत्यापन का तरीका चुनें:",
          optUid: "UID",
          optPtid: "प्रॉपर्टी टैक्स आईडी (PTID)",
          optMobile: "पंजीकृत मोबाइल नंबर",
          optWaterConsumer: "वाटर उपभोक्ता संख्या",
          optSewerageConsumer: "सीवरेज उपभोक्ता संख्या",
          placeholderUid: "12 अंकों का UID दर्ज करें (उदा. u123-abc-789)",
          placeholderPtid: "प्रॉपर्टी टैक्स आईडी दर्ज करें (उदा. PB-PT-2024-05-12-001234)",
          placeholderMobile: "10 अंकों का पंजीकृत मोबाइल नंबर दर्ज करें",
          placeholderWaterConsumer: "वाटर उपभोक्ता संख्या दर्ज करें (उदा. WC-334455)",
          placeholderSewerageConsumer: "सीवरेज उपभोक्ता संख्या दर्ज करें (उदा. SC-334455)",
          testUid: "टेस्ट UID: u123-abc-789",
          testPtid: "टेस्ट PTID: PB-PT-2024-05-12-001234",
          testMobile: "टेस्ट मोबाइल: 9876543210",
          testWaterConsumer: "टेस्ट वाटर सं: WC-334455",
          testSewerageConsumer: "टेस्ट सीवरेज सं: SC-334455",
          emptyError: "कृपया सत्यापन विवरण दर्ज करें",
          identifierLabel: "सत्यापन विवरण",
          change: "बदलें",
          enterPhoneOrEmail: "सत्यापन विवरण दर्ज करें",
          sendOtp: "सत्यापित करें और ओटीपी भेजें",
          sendingOtp: "MSeva रिकॉर्ड सत्यापित हो रहा है...",
          otpLabel: "ओटीपी (OTP)",
          enterOtpPlaceholder: "6 अंकों का ओटीपी दर्ज करें",
          verifyAndContinue: "सत्यापित करें और आगे बढ़ें",
          verifyingOtp: "सत्यापन हो रहा है...",
          testOtpHint: "UAT टेस्ट ओटीपी: 123456",
          autoFillOtp: "स्वचालित भरें 123456",
          useTestPhone: "टेस्ट मोबाइल नंबर: 9876543210",
          recordIdentifiedTitle: "MSeva रिकॉर्ड सत्यापित",
          recordPreviewPrompt: "रिकॉर्ड मिल गया है। कृपया आगे बढ़ने के लिए पंजीकृत मोबाइल पर भेजा गया ओटीपी दर्ज करें:",
          ownerNameLabel: "मालिक का नाम",
          propertyAddressLabel: "संपत्ति का पता",
          registeredMobileLabel: "पंजीकृत मोबाइल",
          currentTaxDemandLabel: "वर्तमान टैक्स मांग",
          arrearsLabel: "पिछला बकाया (Arrears)",
          penaltyLabel: "जुर्माना (Penalty)",
          fireCessLabel: "फ़ायर सेस एवं शुल्क",
          totalOutstandingLabel: "कुल बकाया राशि",
          waterDuesLabel: "पानी का बकाया",
          sewerageDuesLabel: "सीवरेज का बकाया",
          outstandingPayPrompt: (amt: string) => `आपकी कुल बकाया राशि ₹${amt} है। क्या आप अभी भुगतान करना चाहते हैं?`,
          payNow: "अभी भुगतान करें (Pay Now)",
          resendOtp: "ओटीपी पुनः भेजें",
          changeIdentifier: "विवरण बदलें",
          invalidOtpRecovery: "अमान्य ओटीपी। कृपया एसएमएस जांचें और पुनः प्रयास करें (टेस्ट ओटीपी: 123456)।",
          uidMatchingPrompt: (uid: string) => `प्रदान किए गए विवरण से जुड़ा एक UID (${uid}) मिला है। निम्नलिखित संपत्ति की जानकारी उपलब्ध है। क्या आप इस UID को प्रॉपर्टी से लिंक करना चाहते हैं?`,
          linkUidPrompt: (uid: string) => `क्या आप इस UID (${uid}) को प्रॉपर्टी से लिंक करना चाहते हैं?`,
          yesLinkUid: "हाँ, UID लिंक करें",
          noReportMismatch: "नहीं, विसंगति दर्ज करें",
          mobileLessThan10: (digits: number) => `मोबाइल नंबर 10 अंकों का होना चाहिए (आपने केवल ${digits} अंक दर्ज किए हैं)।`,
          mobileMoreThan10: (digits: number) => `मोबाइल नंबर 10 अंकों से अधिक नहीं हो सकता (आपने ${digits} अंक दर्ज किए हैं)।`,
          mobileDigitsOnlyError: "कृपया केवल 10 अंकों का वैध मोबाइल नंबर दर्ज करें।",
          totalOutstanding: "कुल बकाया:",
          paymentSuccessful: "भुगतान सफल रहा",
          workflowPtidMessage: "This Property ID is currently in workflow status. Please visit your ULB office for further assistance.",
          postPaymentAssessmentNotification: "You have pending property assessments from previous year(s). Please visit the portal to complete the assessment and pay the outstanding dues.",
          downloadReceipt: "भुगतान रसीद डाउनलोड करें",
          paymentConfirmationMsg: (txnId: string, amt: string, gw: string) => `भुगतान पुष्टि: लेन-देन आईडी (Transaction ID): ${txnId}। ₹${amt} का भुगतान ${gw} गेटवे के माध्यम से सफलतापूर्वक संपन्न हुआ।`,
        };
      case "hinglish":
        return {
          citizenVerification: "Citizen Verification",
          selectVerificationMethod: "Verification method select karein:",
          optUid: "UID",
          optPtid: "Property Tax ID (PTID)",
          optMobile: "Registered mobile number",
          optWaterConsumer: "Water Consumer Number",
          optSewerageConsumer: "Sewerage Consumer Number",
          placeholderUid: "12-digit UID enter karein (jaise u123-abc-789)",
          placeholderPtid: "Property Tax ID enter karein (jaise KNP-123-456-78)",
          placeholderMobile: "10-digit registered mobile number enter karein",
          placeholderWaterConsumer: "Water Consumer Number enter karein (jaise WC-334455)",
          placeholderSewerageConsumer: "Sewerage Consumer Number enter karein (jaise SC-334455)",
          testUid: "Use test UID: u123-abc-789",
          testPtid: "Use test PTID: KNP-123-456-78",
          testMobile: "Use test mobile: 9123456789",
          testWaterConsumer: "Use test water no: WC-334455",
          testSewerageConsumer: "Use test sewerage no: SC-334455",
          emptyError: "Please verification details enter karein",
          identifierLabel: "Verification Details",
          change: "Change",
          enterPhoneOrEmail: "Verification details enter karein",
          sendOtp: "Verify & Send OTP",
          sendingOtp: "Checking MSeva record & sending OTP...",
          otpLabel: "OTP",
          enterOtpPlaceholder: "6 digit OTP enter karein",
          verifyAndContinue: "Verify & Continue",
          verifyingOtp: "Verify ho raha hai...",
          testOtpHint: "UAT Test OTP: 123456",
          autoFillOtp: "Auto-fill 123456",
          useTestPhone: "Use test mobile: 9123456789",
          recordIdentifiedTitle: "Record Identified (MSeva)",
          recordPreviewPrompt: "Record match ho gaya hai. Please proceed karne ke liye registered mobile par aaya OTP enter karein:",
          ownerNameLabel: "Owner Name",
          propertyAddressLabel: "Property Address",
          registeredMobileLabel: "Registered Mobile",
          currentTaxDemandLabel: "Current Tax Demand",
          arrearsLabel: "Arrears",
          penaltyLabel: "Penalty",
          fireCessLabel: "Fire Cess & Charges",
          totalOutstandingLabel: "Total Outstanding Amount",
          waterDuesLabel: "Water Dues",
          sewerageDuesLabel: "Sewerage Dues",
          outstandingPayPrompt: (amt: string) => `You have an outstanding amount of ₹${amt}. Would you like to pay now?`,
          payNow: "Pay Now",
          resendOtp: "Resend OTP",
          changeIdentifier: "Change Identifier",
          invalidOtpRecovery: "Invalid OTP. Please check your SMS and retry (Test OTP: 123456).",
          uidMatchingPrompt: (uid: string) => `We found a UID (${uid}) associated with the details provided. The following property information is available. Would you like to link this UID with the property?`,
          linkUidPrompt: (uid: string) => `Kya aap is UID (${uid}) ko property se link karna chahte hain?`,
          yesLinkUid: "Yes, Link UID",
          noReportMismatch: "No, Report Mismatch",
          mobileLessThan10: (digits: number) => `Mobile number 10 digits ka hona chahiye (aapne sirf ${digits} digits enter kiye hain).`,
          mobileMoreThan10: (digits: number) => `Mobile number 10 digits se zyada nahi ho sakta (aapne ${digits} digits enter kiye hain).`,
          mobileDigitsOnlyError: "Please sirf 10 digits ka valid mobile number enter karein.",
          totalOutstanding: "Total Outstanding:",
          paymentSuccessful: "Payment Successful",
          workflowPtidMessage: "This Property ID is currently in workflow status. Please visit your ULB office for further assistance.",
          postPaymentAssessmentNotification: "You have pending property assessments from previous year(s). Please visit the portal to complete the assessment and pay the outstanding dues.",
          downloadReceipt: "Download Payment Receipt",
          paymentConfirmationMsg: (txnId: string, amt: string, gw: string) => `Payment confirmation: Transaction ID: ${txnId}. ₹${amt} ka payment ${gw} Gateway se successfully complete ho gaya.`,
        };
      case "punjabi":
        return {
          citizenVerification: "ਨਾਗਰਿਕ ਤਸਦੀਕ",
          selectVerificationMethod: "ਤਸਦੀਕ ਦਾ ਤਰੀਕਾ ਚੁਣੋ:",
          optUid: "UID",
          optPtid: "ਪ੍ਰਾਪਰਟੀ ਟੈਕਸ ਆਈਡੀ (PTID)",
          optMobile: "ਰਜਿਸਟਰਡ ਮੋਬਾਈਲ ਨੰਬਰ",
          optWaterConsumer: "ਵਾਟਰ ਖਪਤਕਾਰ ਨੰਬਰ",
          optSewerageConsumer: "ਸੀਵਰੇਜ ਖਪਤਕਾਰ ਨੰਬਰ",
          placeholderUid: "12 ਅੰਕਾਂ ਦਾ UID ਦਰਜ ਕਰੋ (ਜਿਵੇਂ u123-abc-789)",
          placeholderPtid: "ਪ੍ਰਾਪਰਟੀ ਟੈਕਸ ਆਈਡੀ ਦਰਜ ਕਰੋ (ਜਿਵੇਂ KNP-123-456-78)",
          placeholderMobile: "10 ਅੰਕਾਂ ਦਾ ਰਜਿਸਟਰਡ ਮੋਬਾਈਲ ਨੰਬਰ ਦਰਜ ਕਰੋ",
          placeholderWaterConsumer: "ਵਾਟਰ ਖਪਤਕਾਰ ਨੰਬਰ ਦਰਜ ਕਰੋ (ਜਿਵੇਂ WC-334455)",
          placeholderSewerageConsumer: "ਸੀਵਰੇਜ ਖਪਤਕਾਰ ਨੰਬਰ ਦਰਜ ਕਰੋ (ਜਿਵੇਂ SC-334455)",
          testUid: "ਟੈਸਟ UID: u123-abc-789",
          testPtid: "ਟੈਸਟ PTID: KNP-123-456-78",
          testMobile: "ਟੈਸਟ ਮੋਬਾਈਲ: 9123456789",
          testWaterConsumer: "ਟੈਸਟ ਵਾਟਰ ਨੰ: WC-334455",
          testSewerageConsumer: "ਟੈਸਟ ਸੀਵਰੇਜ ਨੰ: SC-334455",
          emptyError: "ਕਿਰਪਾ ਕਰਕੇ ਤਸਦੀਕ ਵੇਰਵੇ ਦਰਜ ਕਰੋ",
          identifierLabel: "ਤਸਦੀਕ ਵੇਰਵੇ",
          change: "ਬਦਲੋ",
          enterPhoneOrEmail: "ਤਸਦੀਕ ਵੇਰਵੇ ਦਰਜ ਕਰੋ",
          sendOtp: "ਤਸਦੀਕ ਕਰੋ ਅਤੇ OTP ਭੇਜੋ",
          sendingOtp: "MSeva ਰਿਕਾਰਡ ਤਸਦੀਕ ਕੀਤਾ ਜਾ ਰਿਹਾ ਹੈ...",
          otpLabel: "ਓਟੀਪੀ (OTP)",
          enterOtpPlaceholder: "6 ਅੰਕਾਂ ਦਾ OTP ਦਰਜ ਕਰੋ",
          verifyAndContinue: "ਤਸਦੀਕ ਕਰੋ ਅਤੇ ਜਾਰੀ ਰੱਖੋ",
          verifyingOtp: "ਤਸਦੀਕ ਹੋ ਰਹੀ ਹੈ...",
          testOtpHint: "UAT ਟੈਸਟ OTP: 123456",
          autoFillOtp: "ਆਟੋ-ਫਿਲ 123456",
          useTestPhone: "ਟੈਸਟ ਮੋਬਾਈਲ ਨੰਬਰ: 9123456789",
          recordIdentifiedTitle: "MSeva ਰਿਕਾਰਡ ਤਸਦੀਕ",
          recordPreviewPrompt: "ਰਿਕਾਰਡ ਮਿਲ ਗਿਆ ਹੈ। ਕਿਰਪਾ ਕਰਕੇ ਅੱਗੇ ਵਧਣ ਲਈ ਰਜਿਸਟਰਡ ਮੋਬਾਈਲ 'ਤੇ ਭੇਜਿਆ OTP ਦਰਜ ਕਰੋ:",
          ownerNameLabel: "ਮਾਲਕ ਦਾ ਨਾਮ",
          propertyAddressLabel: "ਪ੍ਰਾਪਰਟੀ ਦਾ ਪਤਾ",
          registeredMobileLabel: "ਰਜਿਸਟਰਡ ਮੋਬਾਈਲ",
          currentTaxDemandLabel: "ਮੌਜੂਦਾ ਟੈਕਸ ਮੰਗ",
          arrearsLabel: "ਪਿਛਲਾ ਬਕਾਇਆ (Arrears)",
          penaltyLabel: "ਜੁਰਮਾਨਾ (Penalty)",
          fireCessLabel: "ਫਾਇਰ ਸੈੱਸ ਅਤੇ ਚਾਰਜ",
          totalOutstandingLabel: "ਕੁੱਲ ਬਕਾਇਆ ਰਕਮ",
          waterDuesLabel: "ਪਾਣੀ ਦਾ ਬਕਾਇਆ",
          sewerageDuesLabel: "ਸੀਵਰੇਜ ਦਾ ਬਕਾਇਆ",
          outstandingPayPrompt: (amt: string) => `ਤੁਹਾਡੀ ਕੁੱਲ ਬਕਾਇਆ ਰਕਮ ₹${amt} ਹੈ। ਕੀ ਤੁਸੀਂ ਹੁਣ ਭੁਗਤਾਨ ਕਰਨਾ ਚਾਹੁੰਦੇ ਹੋ?`,
          payNow: "ਹੁਣ ਭੁਗਤਾਨ ਕਰੋ (Pay Now)",
          resendOtp: "OTP ਦੁਬਾਰਾ ਭੇਜੋ",
          changeIdentifier: "ਵੇਰਵਾ ਬਦਲੋ",
          invalidOtpRecovery: "ਅਵੈਧ OTP। ਕਿਰਪਾ ਕਰਕੇ SMS ਚੈੱਕ ਕਰਕੇ ਦੁਬਾਰਾ ਕੋਸ਼ਿਸ਼ ਕਰੋ (ਟੈਸਟ OTP: 123456)।",
          uidMatchingPrompt: (uid: string) => `ਮਿਲੇ ਵੇਰਵਿਆਂ ਨਾਲ ਜੁੜਿਆ ਇੱਕ UID (${uid}) ਮਿਲਿਆ ਹੈ। ਹੇਠਾਂ ਦਿੱਤੀ ਪ੍ਰਾਪਰਟੀ ਜਾਣਕਾਰੀ ਉਪਲਬਧ ਹੈ। ਕੀ ਤੁਸੀਂ ਇਸ UID ਨੂੰ ਪ੍ਰਾਪਰਟੀ ਨਾਲ ਲਿੰਕ ਕਰਨਾ ਚਾਹੁੰਦੇ ਹੋ?`,
          linkUidPrompt: (uid: string) => `ਕੀ ਤੁਸੀਂ ਇਸ UID (${uid}) ਨੂੰ ਪ੍ਰਾਪਰਟੀ ਨਾਲ ਲਿੰਕ ਕਰਨਾ ਚਾਹੁੰਦੇ ਹੋ?`,
          yesLinkUid: "ਹਾਂ, UID ਲਿੰਕ ਕਰੋ",
          noReportMismatch: "ਨਹੀਂ, ਗਲਤੀ ਦਰਜ ਕਰੋ",
          mobileLessThan10: (digits: number) => `ਮੋਬਾਈਲ ਨੰਬਰ 10 ਅੰਕਾਂ ਦਾ ਹੋਣਾ ਚਾਹੀਦਾ ਹੈ (ਤੁਸੀਂ ਸਿਰਫ਼ ${digits} ਅੰਕ ਦਰਜ ਕੀਤੇ ਹਨ)।`,
          mobileMoreThan10: (digits: number) => `ਮੋਬਾਈਲ ਨੰਬਰ 10 ਅੰਕਾਂ ਤੋਂ ਵੱਧ ਨਹੀਂ ਹੋ ਸਕਦਾ (ਤੁਸੀਂ ${digits} ਅੰਕ ਦਰਜ ਕੀਤੇ ਹਨ)।`,
          mobileDigitsOnlyError: "ਕਿਰਪਾ ਕਰਕੇ ਸਿਰਫ਼ 10 ਅੰਕਾਂ ਦਾ ਵੈਧ ਮੋਬਾਈਲ ਨੰਬਰ ਦਰਜ ਕਰੋ।",
          totalOutstanding: "ਕੁੱਲ ਬਕਾਇਆ:",
          paymentSuccessful: "ਭੁਗਤਾਨ ਸਫਲ ਰਿਹਾ",
          workflowPtidMessage: "This Property ID is currently in workflow status. Please visit your ULB office for further assistance.",
          postPaymentAssessmentNotification: "You have pending property assessments from previous year(s). Please visit the portal to complete the assessment and pay the outstanding dues.",
          downloadReceipt: "ਭੁਗਤਾਨ ਰਸੀਦ ਡਾਊਨਲੋਡ ਕਰੋ",
          paymentConfirmationMsg: (txnId: string, amt: string, gw: string) => `ਭੁਗਤਾਨ ਪੁਸ਼ਟੀ: ਲੈਣ-ਦੇਣ ID (Transaction ID): ${txnId}। ₹${amt} ਦਾ ਭੁਗਤਾਨ ${gw} ਗੇਟਵੇ ਰਾਹੀਂ ਸਫਲਤਾਪੂਰਵਕ ਮੁਕੰਮਲ ਹੋ ਗਿਆ।`,
        };
      case "english":
      default:
        return {
          citizenVerification: "Citizen Verification",
          selectVerificationMethod: "Select verification method:",
          optUid: "UID",
          optPtid: "Property Tax ID (PTID)",
          optMobile: "Registered mobile number",
          optWaterConsumer: "Water Consumer Number",
          optSewerageConsumer: "Sewerage Consumer Number",
          placeholderUid: "Enter 12-digit UID (e.g. u123-abc-789)",
          placeholderPtid: "Enter Property Tax ID (e.g. KNP-123-456-78)",
          placeholderMobile: "Enter 10-digit registered mobile number",
          placeholderWaterConsumer: "Enter Water Consumer Number (e.g. WC-334455)",
          placeholderSewerageConsumer: "Enter Sewerage Consumer Number (e.g. SC-334455)",
          testUid: "Use test UID: u123-abc-789",
          testPtid: "Use test PTID: KNP-123-456-78",
          testMobile: "Use test mobile: 9123456789",
          testWaterConsumer: "Use test water no: WC-334455",
          testSewerageConsumer: "Use test sewerage no: SC-334455",
          emptyError: "Please enter the required verification details",
          identifierLabel: "Verification Details",
          change: "Change",
          enterPhoneOrEmail: "Enter verification details",
          sendOtp: "Verify & Send OTP",
          sendingOtp: "Verifying MSeva record & sending OTP...",
          otpLabel: "OTP",
          enterOtpPlaceholder: "Enter 6 digit OTP",
          verifyAndContinue: "Verify & Continue",
          verifyingOtp: "Verifying OTP...",
          testOtpHint: "UAT Test OTP: 123456",
          autoFillOtp: "Auto-fill 123456",
          useTestPhone: "Use test mobile: 9123456789",
          recordIdentifiedTitle: "Record Identified (MSeva)",
          recordPreviewPrompt: "Record identified. Please enter the OTP sent to your registered mobile to proceed:",
          ownerNameLabel: "Owner Name",
          propertyAddressLabel: "Property Address",
          registeredMobileLabel: "Registered Mobile",
          currentTaxDemandLabel: "Current Tax Demand",
          arrearsLabel: "Arrears",
          penaltyLabel: "Penalty",
          fireCessLabel: "Fire Cess & Municipal Charges",
          totalOutstandingLabel: "Total Outstanding Amount",
          waterDuesLabel: "Water Dues",
          sewerageDuesLabel: "Sewerage Dues",
          outstandingPayPrompt: (amt: string) => `You have an outstanding amount of ₹${amt}. Would you like to pay now?`,
          payNow: "Pay Now",
          resendOtp: "Resend OTP",
          changeIdentifier: "Change Identifier",
          invalidOtpRecovery: "Invalid OTP. Please check your SMS and retry, or use the recovery options below (Test OTP: 123456).",
          uidMatchingPrompt: (uid: string) => `We found a UID (${uid}) associated with the details provided. The following property information is available. Would you like to link this UID with the property?`,
          linkUidPrompt: (uid: string) => `Would you like to link this UID (${uid}) with the property?`,
          yesLinkUid: "Yes, Link UID",
          noReportMismatch: "No, Report Mismatch",
          mobileLessThan10: (digits: number) => `Mobile number must be exactly 10 digits (you entered only ${digits} digits).`,
          mobileMoreThan10: (digits: number) => `Mobile number cannot exceed 10 digits (you entered ${digits} digits).`,
          mobileDigitsOnlyError: "Please enter a valid 10-digit mobile number containing only numbers.",
          totalOutstanding: "Total Outstanding:",
          paymentSuccessful: "Payment Successful",
          workflowPtidMessage: "This Property ID is currently in workflow status. Please visit your ULB office for further assistance.",
          postPaymentAssessmentNotification: "You have pending property assessments from previous year(s). Please visit the portal to complete the assessment and pay the outstanding dues.",
          downloadReceipt: "Download Payment Receipt",
          paymentConfirmationMsg: (txnId: string, amt: string, gw: string) => `Payment confirmation: Transaction ID: ${txnId}. Payment of ₹${amt} completed successfully via ${gw} Gateway.`,
        };
    }
  }

  public getWorkflowPtidMessage(lang: SupportedLanguage = "english"): string {
    return this.getCardLabels(lang).workflowPtidMessage;
  }

  public getPostPaymentNotification(lang: SupportedLanguage = "english"): string {
    return this.getCardLabels(lang).postPaymentAssessmentNotification;
  }

  public getPaymentConfirmationMessage(lang: SupportedLanguage, txnId: string, amount: string, gateway: string): string {
    return this.getCardLabels(lang).paymentConfirmationMsg(txnId, amount, gateway);
  }
}

export const languageService = new LanguageService();
