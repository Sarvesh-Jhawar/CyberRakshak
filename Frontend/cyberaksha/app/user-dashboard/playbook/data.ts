import {
  Mail,
  Bug,
  CreditCard,
  Eye,
  Lock,
  Users,
  Bot,
  UserX,
  Network,
  ServerCrash,
  Bomb,
  Copy,
} from "lucide-react"
import { LucideIcon } from "lucide-react"

// Define types for better maintainability
export type Locale = "en" | "hi"

export type Translatable = {
  [key in Locale]: string
}

export type TranslatableArray = {
  [key in Locale]: string[]
}

export type PlaybookStep = {
  title: Translatable
  priority: string
  actions: TranslatableArray
}

export type PlaybookContact = {
  role: Translatable
  contact: string
  type: "phone" | "email"
}

export type Playbook = {
  id: string
  title: Translatable
  category: string
  icon: LucideIcon
  severity: string
  description: Translatable
  estimatedTime: string
  steps: PlaybookStep[]
  contacts: PlaybookContact[]
}

// NOTE: Translations are machine-generated for demonstration purposes.
export const playbooksData: Playbook[] = [
  {
    id: "phishing",
    title: {
      en: "Phishing Attack Response",
      hi: "फ़िशिंग हमले की प्रतिक्रिया",
    },
    category: "Phishing",
    icon: Mail,
    severity: "High",
    description: {
      en: "Comprehensive guide for responding to phishing attacks and suspicious emails",
      hi: "फ़िशिंग हमलों और संदिग्ध ईमेल का जवाब देने के लिए व्यापक गाइड",
    },
    estimatedTime: "15-30 minutes",
    steps: [
      {
        title: { en: "Definition", hi: "परिभाषा" },
        priority: "Info",
        actions: {
          en: [
            "Phishing is a social engineering attack where an attacker sends a fraudulent message designed to trick a person into revealing sensitive information or deploying malicious software.",
            "These attacks often come via email, text message, or instant message, appearing to be from a legitimate source to gain your trust.",
          ],
          hi: [
            "फ़िशिंग एक सोशल इंजीनियरिंग हमला है जिसमें एक हमलावर एक धोखाधड़ी वाला संदेश भेजता है जिसे किसी व्यक्ति को संवेदनशील जानकारी प्रकट करने या दुर्भावनापूर्ण सॉफ़्टवेयर तैनात करने के लिए डिज़ाइन किया गया है।",
            "ये हमले अक्सर ईमेल, टेक्स्ट संदेश या त्वरित संदेश के माध्यम से आते हैं, जो आपका विश्वास हासिल करने के लिए एक वैध स्रोत से प्रतीत होते हैं।",
          ],
        },
      },
      {
        title: {
          en: "Immediate Actions",
          hi: "तत्काल कार्रवाइयां",
        },
        priority: "Critical",
        actions: {
          en: [
            "Do NOT click any links, download attachments, or reply to the suspicious email.",
            "If you clicked a link but did not enter information, close the browser tab immediately.",
            "If you suspect your machine is compromised, disconnect from the network (Wi-Fi and Ethernet).",
            "Do NOT enter any credentials or personal information on any linked websites.",
            "Take a screenshot of the suspicious email for evidence if possible.",
            "Use the 'Report Phishing' button in your email client. Then, forward the email as an attachment to your IT security team.",
          ],
          hi: [
            "संदिग्ध ईमेल से किसी भी लिंक पर क्लिक न करें या अटैचमेंट डाउनलोड न करें",
            "किसी भी लिंक की गई वेबसाइटों पर क्रेडेंशियल या व्यक्तिगत जानकारी दर्ज न करें",
            "सबूत के लिए संदिग्ध ईमेल का स्क्रीनशॉट लें",
            "ईमेल को तुरंत अपनी आईटी सुरक्षा टीम को फॉरवर्ड करें",
          ],
        },
      },
      {
        title: {
          en: "Secure Your Account",
          hi: "अपना खाता सुरक्षित करें",
        },
        priority: "High",
        actions: {
          en: [
            "If you entered your password, change it immediately on the legitimate service and any other sites where you use the same password.",
            "Enable or verify that two-factor authentication (2FA) is active on the compromised account.",
            "Review recent account activity (logins, sent emails, file changes) for any unauthorized actions.",
            "Log out of all active sessions on the compromised account from the account's security settings page.",
            "Scan your computer for malware using approved antivirus software.",
          ],
          hi: [
            "यदि आपने किसी लिंक पर क्लिक किया है तो तुरंत अपना पासवर्ड बदलें",
            "सभी खातों पर टू-फैक्टर ऑथेंटिकेशन (2FA) सक्षम करें",
            "अनधिकृत पहुंच के लिए हाल की लॉगिन गतिविधि की जांच करें",
            "समझौता किए गए खातों पर सभी सक्रिय सत्रों से लॉग आउट करें",
          ],
        },
      },
      // NOTE: Other playbooks and steps would be translated similarly.
      // For brevity, only the first playbook is fully translated here.
      {
        title: { en: "Report and Document", hi: "रिपोर्ट और दस्तावेज़" },
        priority: "Medium",
        actions: {
          en: [
            "Report the incident through the official Defence Cyber Portal, providing as much detail as possible.",
            "Notify your immediate supervisor and the designated IT/Security department contact.",
            "Document all actions taken, including the timeline of events, from receiving the email to the current step.",
            "Preserve all evidence, including the original email (as an attachment), screenshots, and any information you may have entered.",
            "If financial information was compromised, contact your bank or credit card company immediately to report potential fraud.",
          ],
          hi: ["रक्षा साइबर पोर्टल के माध्यम से घटना की रिपोर्ट करें", "अपने तत्काल पर्यवेक्षक और आईटी विभाग को सूचित करें", "की गई सभी कार्रवाइयों और घटनाओं की समय-सीमा का दस्तावेजीकरण करें", "ईमेल और स्क्रीनशॉट सहित सभी सबूतों को सुरक्षित रखें"],
        },
      },
      {
        title: { en: "Follow-up Actions", hi: "अनुवर्ती कार्रवाइयां" },
        priority: "Low",
        actions: {
          en: [
            "Continue to monitor the affected account(s) for any suspicious activity for at least 30 days.",
            "Review and update your email filtering rules to be more stringent if possible.",
            "Share lessons learned with your team members (without sharing sensitive details of the incident) to raise collective awareness.",
            "If personal or financial data was exposed, consider placing a fraud alert on your credit reports.",
          ],
          hi: ["30 दिनों के लिए संदिग्ध गतिविधि के लिए खातों की निगरानी करें", "सुरक्षा जागरूकता प्रशिक्षण पूरा होने को अपडेट करें", "ईमेल फ़िल्टरिंग नियमों की समीक्षा और अपडेट करें", "टीम के सदस्यों के साथ सीखे गए सबक साझा करें"],
        },
      },
      {
        title: { en: "Educate and Prevent", hi: "शिक्षित करें और रोकें" },
        priority: "Low",
        actions: {
          en: [
            "Complete any assigned follow-up security awareness training.",
            "Hover over links in emails before clicking to inspect the actual destination URL in the status bar.",
            "Be cautious of future emails, especially those creating a sense of urgency or from unknown senders.",
            "Review email forwarding rules to ensure they haven't been maliciously altered.",
            "Verify unexpected requests for sensitive information through a separate, trusted communication channel.",
          ],
          hi: [
            "कोई भी निर्दिष्ट अनुवर्ती सुरक्षा जागरूकता प्रशिक्षण पूरा करें।",
            "भविष्य के ईमेल से सावधान रहें, विशेष रूप से वे जो तात्कालिकता की भावना पैदा करते हैं या अज्ञात प्रेषकों से आते हैं।",
            "यह सुनिश्चित करने के लिए ईमेल अग्रेषण नियमों की समीक्षा करें कि उन्हें दुर्भावनापूर्ण रूप से नहीं बदला गया है।",
            "एक अलग, विश्वसनीय संचार चैनल के माध्यम से संवेदनशील जानकारी के लिए अप्रत्याशित अनुरोधों को सत्यापित करें।",
          ],
        },
      },
    ],
    contacts: [
      {
        role: { en: "IT Security Hotline", hi: "आईटी सुरक्षा हॉटलाइन" },
        contact: "1-800-CYBER-SEC",
        type: "phone",
      },
      {
        role: { en: "CERT-Army", hi: "CERT-सेना" },
        contact: "cert@defence.mil",
        type: "email",
      },
    ],
  },
  // Other playbooks would be added here with the same translated structure.
  // For brevity, we'll only use the one above.
  {
    id: "malware",
    title: { en: "Malware Detection & Removal", hi: "मैलवेयर का पता लगाना और हटाना" },
    category: "Malware",
    icon: Bug,
    severity: "Critical",
    description: { en: "Step-by-step guide for handling malware infections and system compromises", hi: "मैलवेयर संक्रमण और सिस्टम से छेड़छाड़ से निपटने के लिए चरण-दर-चरण मार्गदर्शिका" },
    estimatedTime: "30-60 minutes",
    steps: [
      {
        title: { en: "Definition", hi: "परिभाषा" },
        priority: "Info",
        actions: {
          en: [
            "Malware (malicious software) is any software intentionally designed to cause disruption to a computer, server, or network.",
            "It can be used to leak private information, gain unauthorized access to systems, block access to data (ransomware), or interfere with security and privacy.",
          ],
          hi: [
            "मैलवेयर (दुर्भावनापूर्ण सॉफ़्टवेयर) कोई भी ऐसा सॉफ़्टवेयर है जिसे जानबूझकर किसी कंप्यूटर, सर्वर या नेटवर्क में व्यवधान पैदा करने के लिए डिज़ाइन किया गया है।",
            "इसका उपयोग निजी जानकारी लीक करने, सिस्टम तक अनधिकृत पहुंच प्राप्त करने, डेटा तक पहुंच को अवरुद्ध करने (रैंसमवेयर), या सुरक्षा और गोपनीयता में हस्तक्षेप करने के लिए किया जा सकता है।",
          ],
        },
      },
      {
        title: { en: "Immediate Isolation", hi: "तत्काल अलगाव" },
        priority: "Critical",
        actions: {
          en: [
            "Immediately disconnect the infected device from all networks (Wi-Fi, Ethernet, Bluetooth) to prevent malware from spreading.",
            "Do NOT shut down or restart the device unless instructed by IT Security. This preserves volatile memory (RAM) for forensic analysis.",
            "Physically isolate the device. Do not connect any external drives (USB, external hard drives) to it.",
            "Take clear photos or screenshots of any ransom notes, error messages, or unusual behavior on the screen.",
            "Write down everything you remember: what you were doing when the issue started, any files you downloaded, or links you clicked.",
          ],
          hi: [
            "मैलवेयर को फैलने से रोकने के लिए संक्रमित डिवाइस को सभी नेटवर्क (वाई-फाई, ईथरनेट, ब्लूटूथ) से तुरंत डिस्कनेक्ट करें।",
            "आईटी सुरक्षा द्वारा निर्देश दिए जाने तक डिवाइस को बंद या पुनरारंभ न करें। यह फोरेंसिक विश्लेषण के लिए अस्थिर मेमोरी (रैम) को संरक्षित करता है।",
            "डिवाइस को भौतिक रूप से अलग करें। इसमें कोई बाहरी ड्राइव (यूएसबी, बाहरी हार्ड ड्राइव) न जोड़ें।",
            "स्क्रीन पर किसी भी फिरौती नोट, त्रुटि संदेश, या असामान्य व्यवहार की स्पष्ट तस्वीरें या स्क्रीनशॉट लें।",
            "आपको जो कुछ भी याद है उसे लिखें: जब समस्या शुरू हुई तो आप क्या कर रहे थे, आपके द्वारा डाउनलोड की गई कोई भी फाइल, या आपके द्वारा क्लिक किए गए लिंक।",
          ],
        },
      },
      {
        title: { en: "System Assessment", hi: "सिस्टम मूल्यांकन" },
        priority: "High",
        actions: {
          en: [
            "If safe to do so and on a separate, clean machine, ensure your antivirus software definitions are up-to-date.",
            "Boot the infected machine into Safe Mode with Networking (if network access is required for scanning tools).",
            "Run a full system scan using your primary, updated antivirus software. Quarantine or remove any threats found.",
            "For a second opinion, run a scan with a reputable on-demand malware scanner (e.g., Malwarebytes).",
            "Check running processes in Task Manager or Activity Monitor for any unfamiliar or high-resource-consuming processes. Document their names.",
          ],
          hi: [
            "यदि ऐसा करना सुरक्षित है और एक अलग, साफ मशीन पर, सुनिश्चित करें कि आपके एंटीवायरस सॉफ़्टवेयर की परिभाषाएँ अद्यतित हैं।",
            "संक्रमित मशीन को नेटवर्किंग के साथ सुरक्षित मोड में बूट करें (यदि स्कैनिंग टूल के लिए नेटवर्क एक्सेस की आवश्यकता है)।",
            "अपने प्राथमिक, अद्यतन एंटीवायरस सॉफ़्टवेयर का उपयोग करके एक पूर्ण सिस्टम स्कैन चलाएँ। पाए गए किसी भी खतरे को क्वारंटाइन करें या हटा दें।",
            "दूसरी राय के लिए, एक प्रतिष्ठित ऑन-डिमांड मैलवेयर स्कैनर (जैसे, मैलवेयरबाइट्स) के साथ एक स्कैन चलाएँ।",
            "किसी भी अपरिचित या उच्च-संसाधन-खपत प्रक्रियाओं के लिए टास्क मैनेजर या एक्टिविटी मॉनिटर में चल रही प्रक्रियाओं की जाँच करें। उनके नाम दर्ज करें।",
          ],
        },
      },
      {
        title: { en: "Containment & Removal", hi: "नियंत्रण और निष्कासन" },
        priority: "High",
        actions: {
          en: [
            "Follow the instructions from your antivirus software to remove or quarantine the identified malware.",
            "If the primary antivirus fails, use a bootable antivirus rescue disk created on a separate, clean computer to scan and clean the system outside of the running OS.",
            "After removal, clear all temporary files, system cache, and browser caches to remove any lingering malware components.",
            "Check system startup locations (e.g., `msconfig` on Windows, `~/Library/LaunchAgents` on macOS) for any malicious entries and disable them.",
          ],
          hi: ["पहचाने गए मैलवेयर को हटाने या क्वारंटाइन करने के लिए अपने एंटीवायरस सॉफ़्टवेयर के निर्देशों का पालन करें।", "यदि प्राथमिक एंटीवायरस विफल हो जाता है, तो चल रहे ओएस के बाहर सिस्टम को स्कैन और साफ करने के लिए एक अलग, साफ कंप्यूटर पर बनाई गई बूटेबल एंटीवायरस बचाव डिस्क का उपयोग करें।", "हटाने के बाद, किसी भी शेष मैलवेयर घटकों को हटाने के लिए सभी अस्थायी फ़ाइलों, सिस्टम कैश और ब्राउज़र कैश को साफ़ करें।", "किसी भी दुर्भावनापूर्ण प्रविष्टियों के लिए सिस्टम स्टार्टअप स्थानों (जैसे, विंडोज पर `msconfig`, macOS पर `~/Library/LaunchAgents`) की जाँच करें और उन्हें अक्षम करें।"],
        },
      },
      {
        title: { en: "Recovery & Monitoring", hi: "पुनर्प्राप्ति और निगरानी" },
        priority: "Medium",
        actions: {
          en: [
            "If the system is severely compromised or encrypted by ransomware, restore from a known-good backup taken *before* the infection occurred. Do not restore single files; perform a full system restore.",
            "Once the system is confirmed clean, change ALL passwords that were used or stored on the device (email, banking, social media, system login).",
            "Enable two-factor authentication (2FA) on all critical accounts.",
            "Closely monitor system performance, network activity, and look for any unusual behavior for the next 48-72 hours.",
            "Update the incident report with all findings, actions taken, and the final resolution.",
          ],
          hi: ["यदि सिस्टम गंभीर रूप से समझौता या रैंसमवेयर द्वारा एन्क्रिप्ट किया गया है, तो संक्रमण होने से *पहले* लिए गए एक ज्ञात-अच्छे बैकअप से पुनर्स्थापित करें। एकल फ़ाइलों को पुनर्स्थापित न करें; एक पूर्ण सिस्टम पुनर्स्थापना करें।", "एक बार जब सिस्टम साफ होने की पुष्टि हो जाती है, तो डिवाइस पर उपयोग किए गए या संग्रहीत सभी पासवर्ड (ईमेल, बैंकिंग, सोशल मीडिया, सिस्टम लॉगिन) बदलें।", "सभी महत्वपूर्ण खातों पर दो-कारक प्रमाणीकरण (2FA) सक्षम करें।", "अगले 48-72 घंटों के लिए सिस्टम प्रदर्शन, नेटवर्क गतिविधि की बारीकी से निगरानी करें, और किसी भी असामान्य व्यवहार की तलाश करें।", "सभी निष्कर्षों, की गई कार्रवाइयों और अंतिम समाधान के साथ घटना रिपोर्ट को अपडेट करें।"],
        },
      },
      {
        title: { en: "Post-Mortem and Hardening", hi: "पोस्टमार्टम और हार्डनिंग" },
        priority: "Low",
        actions: {
          en: [
            "Finalize the incident report, including the likely entry point (e.g., email attachment, malicious download), impact, and data accessed or exfiltrated.",
            "Update firewall rules and endpoint protection policies to block the identified malware signature or attack vector.",
            "Ensure the operating system, web browsers, and all other application software are fully patched and up-to-date.",
            "For critical systems or persistent infections, the safest option is to re-image the device from a known-good corporate image.",
            "Educate the user on how the infection occurred and provide refresher security awareness training.",
          ],
          hi: ["संभावित प्रवेश बिंदु (जैसे, ईमेल अटैचमेंट, दुर्भावनापूर्ण डाउनलोड), प्रभाव, और एक्सेस या एक्सफ़िल्टरेट किए गए डेटा सहित घटना रिपोर्ट को अंतिम रूप दें।", "पहचाने गए मैलवेयर हस्ताक्षर या हमले के वेक्टर को ब्लॉक करने के लिए फ़ायरवॉल नियमों और एंडपॉइंट सुरक्षा नीतियों को अपडेट करें।", "सुनिश्चित करें कि ऑपरेटिंग सिस्टम, वेब ब्राउज़र और अन्य सभी एप्लिकेशन सॉफ़्टवेयर पूरी तरह से पैच और अद्यतित हैं।", "महत्वपूर्ण प्रणालियों या लगातार संक्रमणों के लिए, सबसे सुरक्षित विकल्प एक ज्ञात-अच्छी कॉर्पोरेट छवि से डिवाइस को फिर से इमेज करना है।", "उपयोगकर्ता को संक्रमण कैसे हुआ, इस पर शिक्षित करें और रिफ्रेशर सुरक्षा जागरूकता प्रशिक्षण प्रदान करें।"],
        },
      },
    ],
    contacts: [
      { role: { en: "Emergency IT Support", hi: "आपातकालीन आईटी सहायता" }, contact: "1-800-IT-HELP", type: "phone" },
      { role: { en: "Malware Analysis Team", hi: "मैलवेयर विश्लेषण टीम" }, contact: "malware@defence.mil", type: "email" },
    ],
  },
  {
    id: "fraud",
    title: { en: "Fraud Prevention & Response", hi: "धोखाधड़ी की रोकथाम और प्रतिक्रिया" },
    category: "Fraud",
    icon: CreditCard,
    severity: "Medium",
    description: { en: "Guidelines for preventing and responding to financial fraud attempts", hi: "वित्तीय धोखाधड़ी के प्रयासों को रोकने और उनका जवाब देने के लिए दिशानिर्देश" },
    estimatedTime: "20-45 minutes",
    steps: [
      {
        title: { en: "Definition", hi: "परिभाषा" },
        priority: "Info",
        actions: {
          en: [
            "Financial fraud is an intentional act of deception involving financial transactions for the purpose of personal gain.",
            "It can include credit card scams, identity theft, and various online schemes designed to steal money or financial information.",
          ],
          hi: [
            "वित्तीय धोखाधड़ी व्यक्तिगत लाभ के उद्देश्य से वित्तीय लेनदेन से जुड़ी धोखे की एक जानबूझकर की गई कार्रवाई है।",
            "इसमें क्रेडिट कार्ड घोटाले, पहचान की चोरी, और पैसे या वित्तीय जानकारी चुराने के लिए डिज़ाइन की गई विभिन्न ऑनलाइन योजनाएं शामिल हो सकती हैं।",
          ],
        },
      },
      {
        title: { en: "Verify Legitimacy", hi: "वैधता सत्यापित करें" },
        priority: "Critical",
        actions: {
          en: [
            "Immediately stop any transaction or communication. Do not provide any more personal or financial information.",
            "Do not trust contact information provided in the suspicious communication. Independently find the official phone number or website of the organization they claim to be from.",
            "Verify the request by calling the organization on their official, verified phone number. Explain the situation.",
            "Be extremely suspicious of any request that involves urgency, threats, or unusual payment methods like gift cards or wire transfers.",
          ],
          hi: ["किसी भी लेनदेन या संचार को तुरंत रोकें। कोई और व्यक्तिगत या वित्तीय जानकारी प्रदान न करें।", "संदिग्ध संचार में प्रदान की गई संपर्क जानकारी पर भरोसा न करें। स्वतंत्र रूप से उस संगठन का आधिकारिक फोन नंबर या वेबसाइट खोजें जिससे वे होने का दावा करते हैं।", "संगठन को उनके आधिकारिक, सत्यापित फोन नंबर पर कॉल करके अनुरोध को सत्यापित करें। स्थिति स्पष्ट करें।", "तत्काल, धमकियों, या उपहार कार्ड या वायर ट्रांसफर जैसे असामान्य भुगतान विधियों से जुड़े किसी भी अनुरोध से बेहद सावधान रहें।"],
        },
      },
      {
        title: { en: "Secure Financial Accounts", hi: "वित्तीय खाते सुरक्षित करें" },
        priority: "High",
        actions: {
          en: [
            "If any financial information was shared, contact your bank(s) and credit card companies immediately. Report the potential fraud and ask to freeze or monitor the accounts.",
            "Change your online banking passwords and PINs immediately. Ensure new passwords are strong and unique.",
            "Enable transaction alerts (email or SMS) for all your financial accounts to be notified of activity.",
            "Place a fraud alert with the major credit bureaus (Equifax, Experian, TransUnion). This makes it harder for someone to open new accounts in your name.",
          ],
          hi: ["यदि कोई वित्तीय जानकारी साझा की गई थी, तो तुरंत अपने बैंक (बैंकों) और क्रेडिट कार्ड कंपनियों से संपर्क करें। संभावित धोखाधड़ी की रिपोर्ट करें और खातों को फ्रीज या मॉनिटर करने के लिए कहें।", "तुरंत अपने ऑनलाइन बैंकिंग पासवर्ड और पिन बदलें। सुनिश्चित करें कि नए पासवर्ड मजबूत और अद्वितीय हैं।", "गतिविधि की सूचना पाने के लिए अपने सभी वित्तीय खातों के लिए लेनदेन अलर्ट (ईमेल या एसएमएस) सक्षम करें।", "प्रमुख क्रेडिट ब्यूरो (इक्विफैक्स, एक्सपेरियन, ट्रांसयूनियन) के साथ धोखाधड़ी की चेतावनी दें। इससे किसी के लिए आपके नाम पर नए खाते खोलना कठिन हो जाता है।"],
        },
      },
      {
        title: { en: "Document & Report", hi: "दस्तावेज़ और रिपोर्ट" },
        priority: "Medium",
        actions: {
          en: [
            "Save all evidence: emails, text messages, screenshots of websites, and records of any financial transactions.",
            "File a report with the appropriate authorities. For financial fraud, this may include the local police, the Cyber Crime portal, and relevant financial regulators.",
            "Notify your security officer and chain of command with a detailed account of the incident and the steps you have taken.",
            "Keep a detailed log of all calls made, people spoken to, and reference numbers provided.",
          ],
          hi: ["सभी सबूत सहेजें: ईमेल, टेक्स्ट संदेश, वेबसाइटों के स्क्रीनशॉट, और किसी भी वित्तीय लेनदेन के रिकॉर्ड।", "उपयुक्त अधिकारियों के साथ एक रिपोर्ट दर्ज करें। वित्तीय धोखाधड़ी के लिए, इसमें स्थानीय पुलिस, साइबर अपराध पोर्टल और संबंधित वित्तीय नियामक शामिल हो सकते हैं।", "अपने सुरक्षा अधिकारी और कमांड श्रृंखला को घटना और आपके द्वारा उठाए गए कदमों का विस्तृत विवरण दें।", "की गई सभी कॉलों, जिन लोगों से बात की गई, और प्रदान किए गए संदर्भ नंबरों का विस्तृत लॉग रखें।"],
        },
      },
      {
        title: { en: "Preventative Measures", hi: "निवारक उपाय" },
        priority: "Medium",
        actions: {
          en: [
            "Regularly review your bank and credit card statements for any unauthorized charges, no matter how small.",
            "Shred all physical documents containing sensitive financial information before discarding them.",
            "Use strong, unique passwords for all financial accounts and enable multi-factor authentication (MFA) wherever possible.",
            "Avoid using public Wi-Fi for financial transactions. If you must, use a trusted VPN.",
            "Be cautious of unsolicited offers or 'too good to be true' deals.",
          ],
          hi: ["किसी भी अनधिकृत शुल्क के लिए नियमित रूप से अपने बैंक और क्रेडिट कार्ड स्टेटमेंट की समीक्षा करें, चाहे वह कितना भी छोटा क्यों न हो।", "संवेदनशील वित्तीय जानकारी वाले सभी भौतिक दस्तावेजों को त्यागने से पहले उन्हें फाड़ दें।", "सभी वित्तीय खातों के लिए मजबूत, अद्वितीय पासवर्ड का उपयोग करें और जहां भी संभव हो, बहु-कारक प्रमाणीकरण (MFA) सक्षम करें।", "वित्तीय लेनदेन के लिए सार्वजनिक वाई-फाई का उपयोग करने से बचें। यदि आपको करना ही है, तो एक विश्वसनीय वीपीएन का उपयोग करें।", "अवांछित प्रस्तावों या 'बहुत अच्छा होने के लिए सच' सौदों से सावधान रहें।"],
        },
      },
    ],
    contacts: [
      { role: { en: "Financial Crimes Unit", hi: "वित्तीय अपराध इकाई" }, contact: "1-800-FRAUD-TIP", type: "phone" },
      { role: { en: "Security Office", hi: "सुरक्षा कार्यालय" }, contact: "security@defence.mil", type: "email" },
    ],
  },
  {
    id: "espionage",
    title: { en: "Espionage Threat Response", hi: "जासूसी खतरे की प्रतिक्रिया" },
    category: "Espionage",
    icon: Eye,
    severity: "Critical",
    description: { en: "Protocol for handling suspected espionage activities and information security breaches", hi: "संदिग्ध जासूसी गतिविधियों और सूचना सुरक्षा उल्लंघनों से निपटने के लिए प्रोटोकॉल" },
    estimatedTime: "Immediate - Ongoing",
    steps: [
      {
        title: { en: "Definition", hi: "परिभाषा" },
        priority: "Info",
        actions: {
          en: [
            "Cyber espionage is the act of obtaining secret or confidential information without the permission of the information's holder.",
            "It is often conducted for strategic, political, or military advantage, using methods like hacking and malware to access sensitive data on computer networks.",
          ],
          hi: [
            "साइबर जासूसी सूचना धारक की अनुमति के बिना गुप्त या गोपनीय जानकारी प्राप्त करने का कार्य है।",
            "यह अक्सर रणनीतिक, राजनीतिक या सैन्य लाभ के लिए आयोजित किया जाता है, जिसमें कंप्यूटर नेटवर्क पर संवेदनशील डेटा तक पहुंचने के लिए हैकिंग और मैलवेयर जैसे तरीकों का उपयोग किया जाता है।",
          ],
        },
      },
      {
        title: { en: "Immediate Security Measures", hi: "तत्काल सुरक्षा उपाय" },
        priority: "Critical",
        actions: {
          en: ["Do NOT confront suspected individuals directly", "Secure all classified materials immediately", "Document suspicious behavior without alerting suspects", "Contact security personnel through secure channels only"],
          hi: ["संदिग्ध व्यक्तियों का सीधे सामना न करें", "सभी वर्गीकृत सामग्रियों को तुरंत सुरक्षित करें", "संदिग्धों को सचेत किए बिना संदिग्ध व्यवहार का दस्तावेजीकरण करें", "केवल सुरक्षित चैनलों के माध्यम से सुरक्षा कर्मियों से संपर्क करें"],
        },
      },
      {
        title: { en: "Information Protection", hi: "सूचना संरक्षण" },
        priority: "Critical",
        actions: {
          en: ["Change access codes and passwords for sensitive systems", "Review recent access logs for suspicious activity", "Limit access to need-to-know basis only", "Secure all physical documents and electronic files"],
          hi: ["संवेदनशील प्रणालियों के लिए एक्सेस कोड और पासवर्ड बदलें", "संदिग्ध गतिविधि के लिए हाल के एक्सेस लॉग की समीक्षा करें", "पहुंच को केवल जानने की आवश्यकता के आधार पर सीमित करें", "सभी भौतिक दस्तावेजों और इलेक्ट्रॉनिक फाइलों को सुरक्षित करें"],
        },
      },
      {
        title: { en: "Investigation Support", hi: "जांच सहायता" },
        priority: "High",
        actions: {
          en: ["Cooperate fully with security investigations", "Provide detailed timeline of suspicious events", "Preserve all evidence without contamination", "Maintain operational security during investigation"],
          hi: ["सुरक्षा जांच में पूरा सहयोग करें", "संदिग्ध घटनाओं की विस्तृत समयरेखा प्रदान करें", "संदूषण के बिना सभी सबूतों को सुरक्षित रखें", "जांच के दौरान परिचालन सुरक्षा बनाए रखें"],
        },
      },
      {
        title: { en: "Long-Term Countermeasures", hi: "दीर्घकालिक प्रतिउपाय" },
        priority: "High",
        actions: {
          en: [
            "Conduct a thorough security audit of all related systems and networks.",
            "Implement enhanced monitoring and logging on critical systems.",
            "Review and strengthen physical security protocols for sensitive areas.",
            "Provide counter-espionage awareness training to all personnel.",
          ],
          hi: ["सभी संबंधित प्रणालियों और नेटवर्कों का गहन सुरक्षा ऑडिट करें।", "महत्वपूर्ण प्रणालियों पर उन्नत निगरानी और लॉगिंग लागू करें।", "संवेदनशील क्षेत्रों के लिए भौतिक सुरक्षा प्रोटोकॉल की समीक्षा और मजबूती करें।", "सभी कर्मियों को प्रति-जासूसी जागरूकता प्रशिक्षण प्रदान करें।"],
        },
      },
    ],
    contacts: [
      { role: { en: "Counter-Intelligence", hi: "काउंटर-इंटेलिजेंस" }, contact: "1-800-CI-ALERT", type: "phone" },
      { role: { en: "Security Investigations", hi: "सुरक्षा जांच" }, contact: "investigations@defence.mil", type: "email" },
    ],
  },
  {
    id: "opsec",
    title: { en: "OPSEC Risk Mitigation", hi: "OPSEC जोखिम न्यूनीकरण" },
    category: "OPSEC",
    icon: Lock,
    severity: "High",
    description: { en: "Operational Security guidelines to prevent information disclosure and maintain security", hi: "सूचना प्रकटीकरण को रोकने और सुरक्षा बनाए रखने के लिए परिचालन सुरक्षा दिशानिर्देश" },
    estimatedTime: "10-20 minutes",
    steps: [
      {
        title: { en: "Definition", hi: "परिभाषा" },
        priority: "Info",
        actions: {
          en: [
            "Operations Security (OPSEC) is a process that identifies critical information to determine if friendly actions can be observed by an adversary.",
            "It determines if information obtained by adversaries could be useful to them, and then executes measures to eliminate or reduce the exploitation of friendly critical information.",
          ],
          hi: [
            "ऑपरेशन सिक्योरिटी (OPSEC) एक ऐसी प्रक्रिया है जो यह निर्धारित करने के लिए महत्वपूर्ण जानकारी की पहचान करती है कि क्या मैत्रीपूर्ण कार्यों को किसी विरोधी द्वारा देखा जा सकता है।",
            "यह निर्धारित करता है कि विरोधियों द्वारा प्राप्त जानकारी उनके लिए उपयोगी हो सकती है या नहीं, और फिर मैत्रीपूर्ण महत्वपूर्ण जानकारी के शोषण को खत्म करने या कम करने के लिए चयनित उपायों को निष्पादित करता है।",
          ],
        },
      },
      {
        title: { en: "Assess Information Exposure", hi: "सूचना जोखिम का आकलन करें" },
        priority: "High",
        actions: {
          en: ["Identify what sensitive information may have been disclosed", "Determine the scope and potential impact of the exposure", "Review social media posts and public communications", "Check for inadvertent disclosure in photos or documents"],
          hi: ["पहचानें कि कौन सी संवेदनशील जानकारी प्रकट हो सकती है", "जोखिम के दायरे और संभावित प्रभाव का निर्धारण करें", "सोशल मीडिया पोस्ट और सार्वजनिक संचार की समीक्षा करें", "तस्वीरों या दस्तावेजों में अनजाने में प्रकटीकरण की जांच करें"],
        },
      },
      {
        title: { en: "Immediate Containment", hi: "तत्काल नियंत्रण" },
        priority: "High",
        actions: {
          en: ["Remove or edit posts containing sensitive information", "Contact platforms to request content removal if necessary", "Notify affected personnel about potential exposure", "Implement additional security measures for exposed operations"],
          hi: ["संवेदनशील जानकारी वाले पोस्ट हटाएं या संपादित करें", "यदि आवश्यक हो तो सामग्री हटाने का अनुरोध करने के लिए प्लेटफार्मों से संपर्क करें", "संभावित जोखिम के बारे में प्रभावित कर्मियों को सूचित करें", "उजागर संचालन के लिए अतिरिक्त सुरक्षा उपाय लागू करें"],
        },
      },
      {
        title: { en: "Prevention & Training", hi: "रोकथाम और प्रशिक्षण" },
        priority: "Low",
        actions: {
          en: ["Conduct OPSEC refresher training for affected personnel", "Update social media and communication guidelines", "Implement regular OPSEC awareness campaigns", "Review and update information handling procedures"],
          hi: ["प्रभावित कर्मियों के लिए OPSEC रिफ्रेशर प्रशिक्षण आयोजित करें", "सोशल मीडिया और संचार दिशानिर्देश अपडेट करें", "नियमित OPSEC जागरूकता अभियान लागू करें", "सूचना प्रबंधन प्रक्रियाओं की समीक्षा और अद्यतन करें"],
        },
      },
      {
        title: { en: "Continuous Monitoring", hi: "निरंतर निगरानी" },
        priority: "Medium",
        actions: {
          en: [
            "Regularly perform 'Red Team' exercises to test OPSEC effectiveness.",
            "Monitor public and social media channels for inadvertent disclosures.",
            "Establish a clear process for personnel to report potential OPSEC violations.",
            "Periodically review and update the list of critical information.",
          ],
          hi: ["OPSEC प्रभावशीलता का परीक्षण करने के लिए नियमित रूप से 'रेड टीम' अभ्यास करें।", "अनजाने में हुए खुलासों के लिए सार्वजनिक और सोशल मीडिया चैनलों की निगरानी करें।", "कर्मियों के लिए संभावित OPSEC उल्लंघनों की रिपोर्ट करने के लिए एक स्पष्ट प्रक्रिया स्थापित करें।", "महत्वपूर्ण जानकारी की सूची की समय-समय पर समीक्षा और अद्यतन करें।"],
        },
      },
    ],
    contacts: [
      { role: { en: "OPSEC Officer", hi: "OPSEC अधिकारी" }, contact: "1-800-OPSEC-HELP", type: "phone" },
      { role: { en: "Information Security", hi: "सूचना सुरक्षा" }, contact: "infosec@defence.mil", type: "email" },
    ],
  },
  {
    id: "social-engineering",
    title: { en: "Social Engineering Defense", hi: "सोशल इंजीनियरिंग से बचाव" },
    category: "Social Engineering",
    icon: Users,
    severity: "High",
    description: { en: "Guide to recognizing and responding to social engineering tactics.", hi: "सोशल इंजीनियरिंग की रणनीति को पहचानने और उसका जवाब देने के लिए गाइड।" },
    estimatedTime: "15-20 minutes",
    steps: [
      {
        title: { en: "Definition", hi: "परिभाषा" },
        priority: "Info",
        actions: {
          en: [
            "Social engineering is the art of manipulating people so they give up confidential information, such as passwords or bank information, or grant access to a restricted system.",
            "The types of information these criminals are seeking can vary, but when individuals are targeted the criminals are usually trying to trick you into giving them your passwords or bank information.",
          ],
          hi: [
            "सोशल इंजीनियरिंग लोगों को हेरफेर करने की कला है ताकि वे गोपनीय जानकारी, जैसे पासवर्ड या बैंक जानकारी, छोड़ दें, या किसी प्रतिबंधित प्रणाली तक पहुंच प्रदान करें।",
            "इन अपराधियों द्वारा मांगी जाने वाली जानकारी के प्रकार भिन्न हो सकते हैं, लेकिन जब व्यक्तियों को लक्षित किया जाता है तो अपराधी आमतौर पर आपको अपना पासवर्ड या बैंक जानकारी देने के लिए धोखा देने की कोशिश कर रहे होते हैं।",
          ],
        },
      },
      {
        title: { en: "Identify the Tactic", hi: "कार्यनीति को पहचानें" },
        priority: "High",
        actions: {
          en: [
            "Be wary of any unsolicited communication that creates a sense of urgency, fear, or curiosity (e.g., 'Your account will be suspended!', 'You've won a prize!').",
            "Verify the sender’s identity through a separate, trusted channel (e.g., call them on a known number) before responding or taking any action.",
            "Do not click on suspicious links or open unexpected attachments, even if they appear to be from a known contact.",
            "Question any request for personal, financial, or sensitive operational information. Legitimate organizations rarely ask for this via email.",
            "Be cautious of 'pretexting,' where an attacker invents a scenario to gain your trust before asking for information.",
          ],
          hi: ["किसी भी अवांछित संचार से सावधान रहें जो तात्कालिकता, भय, या जिज्ञासा की भावना पैदा करता है (जैसे, 'आपका खाता निलंबित कर दिया जाएगा!', 'आपने एक पुरस्कार जीता है!')।", "जवाब देने या कोई कार्रवाई करने से पहले एक अलग, विश्वसनीय चैनल (जैसे, उन्हें एक ज्ञात नंबर पर कॉल करें) के माध्यम से प्रेषक की पहचान सत्यापित करें।", "संदिग्ध लिंक पर क्लिक न करें या अप्रत्याशित अटैचमेंट न खोलें, भले ही वे किसी ज्ञात संपर्क से प्रतीत हों।", "व्यक्तिगत, वित्तीय, या संवेदनशील परिचालन जानकारी के लिए किसी भी अनुरोध पर सवाल उठाएं। वैध संगठन शायद ही कभी ईमेल के माध्यम से यह पूछते हैं।", " 'प्रीटेक्स्टिंग' से सावधान रहें, जहां एक हमलावर जानकारी मांगने से पहले आपका विश्वास हासिल करने के लिए एक परिदृश्य का आविष्कार करता है।"],
        },
      },
      {
        title: { en: "Immediate Response", hi: "तत्काल प्रतिक्रिया" },
        priority: "Critical",
        actions: {
          en: [
            "If you've shared credentials, change your passwords immediately for the affected account and any other accounts using the same password.",
            "If financial information was shared, contact your bank and credit card companies to report potential fraud and block transactions.",
            "If you granted physical access, report it to physical security and your supervisor immediately.",
            "Disconnect from the network if you suspect your device was compromised by malware.",
            "Do not delete any messages, emails, or call logs; they are crucial evidence for the investigation.",
          ],
          hi: ["यदि आपने क्रेडेंशियल साझा किए हैं, तो प्रभावित खाते और उसी पासवर्ड का उपयोग करने वाले किसी भी अन्य खाते के लिए तुरंत अपना पासवर्ड बदलें।", "यदि वित्तीय जानकारी साझा की गई थी, तो संभावित धोखाधड़ी की रिपोर्ट करने और लेनदेन को ब्लॉक करने के लिए अपने बैंक और क्रेडिट कार्ड कंपनियों से संपर्क करें।", "यदि आपने भौतिक पहुंच प्रदान की है, तो इसे तुरंत भौतिक सुरक्षा और अपने पर्यवेक्षक को रिपोर्ट करें।", "यदि आपको संदेह है कि आपका डिवाइस मैलवेयर से संक्रमित हो गया है तो नेटवर्क से डिस्कनेक्ट करें।", "कोई भी संदेश, ईमेल या कॉल लॉग न हटाएं; वे जांच के लिए महत्वपूर्ण सबूत हैं।"],
        },
      },
      {
        title: { en: "Report the Incident", hi: "घटना की रिपोर्ट करें" },
        priority: "Medium",
        actions: {
          en: [
            "Report the incident to your IT Security department and immediate supervisor without delay.",
            "Use the 'File a Complaint' feature in this portal, selecting the 'Social Engineering' category.",
            "Provide all details: communication method (email, phone call), sender's name/number/email, the specific information requested, and any information you provided.",
            "Include screenshots or forward emails as attachments if possible.",
          ],
          hi: ["बिना किसी देरी के अपने आईटी सुरक्षा विभाग और तत्काल पर्यवेक्षक को घटना की सूचना दें।", "'सोशल इंजीनियरिंग' श्रेणी का चयन करते हुए, इस पोर्टल में 'शिकायत दर्ज करें' सुविधा का उपयोग करें।", "सभी विवरण प्रदान करें: संचार विधि (ईमेल, फोन कॉल), प्रेषक का नाम/नंबर/ईमेल, मांगी गई विशिष्ट जानकारी, और आपके द्वारा प्रदान की गई कोई भी जानकारी।", "यदि संभव हो तो स्क्रीनशॉट शामिल करें या ईमेल को अटैचमेंट के रूप में अग्रेषित करें।"],
        },
      },
    ],
    contacts: [
      { role: { en: "IT Security", hi: "आईटी सुरक्षा" }, contact: "1-800-CYBER-SEC", type: "phone" },
      { role: { en: "OPSEC Officer", hi: "OPSEC अधिकारी" }, contact: "opsec@defence.mil", type: "email" },
    ],
  },
  {
    id: "deepfake",
    title: { en: "Deepfake Attack Response", hi: "डीपफेक हमले की प्रतिक्रिया" },
    category: "Deepfake",
    icon: Bot,
    severity: "High",
    description: { en: "Protocol for identifying and responding to malicious deepfake content.", hi: "दुर्भावनापूर्ण डीपफेक सामग्री की पहचान और प्रतिक्रिया के लिए प्रोटोकॉल।" },
    estimatedTime: "20-40 minutes",
    steps: [
      {
        title: { en: "Definition", hi: "परिभाषा" },
        priority: "Info",
        actions: {
          en: [
            "Deepfakes are synthetic media in which a person in an existing image or video is replaced with someone else's likeness.",
            "While not always malicious, deepfakes can be used to create fake news, financial fraud, and blackmail, posing a significant security risk.",
          ],
          hi: [
            "डीपफेक सिंथेटिक मीडिया है जिसमें किसी मौजूदा छवि या वीडियो में किसी व्यक्ति को किसी और की समानता से बदल दिया जाता है।",
            "हालांकि हमेशा दुर्भावनापूर्ण नहीं होता है, डीपफेक का उपयोग फर्जी समाचार, वित्तीय धोखाधड़ी और ब्लैकमेल बनाने के लिए किया जा सकता है, जो एक महत्वपूर्ण सुरक्षा जोखिम पैदा करता है।",
          ],
        },
      },
      {
        title: { en: "Verification and Analysis", hi: "सत्यापन और विश्लेषण" },
        priority: "High",
        actions: {
          en: [
            "Do not share or forward the suspected deepfake content. This prevents the spread of potential disinformation.",
            "Look for visual inconsistencies: unnatural eye movement or blinking, awkward facial expressions, mismatched lighting, or strange skin textures.",
            "Analyze audio for robotic tones, lack of emotion, unusual syntax, or poor lip-syncing.",
            "If the content conveys an order or critical information, verify it through a completely separate and trusted communication channel (e.g., a direct phone call).",
            "Use reverse image search tools on keyframes from a video to see if the original, unaltered media exists.",
          ],
          hi: ["संदिग्ध डीपफेक सामग्री को साझा या अग्रेषित न करें। यह दुष्प्रचार के प्रसार को रोकता है।", "दृश्य विसंगतियों की तलाश करें: अप्राकृतिक आंखों की गति या पलक झपकना, अजीब चेहरे के भाव, बेमेल प्रकाश, या अजीब त्वचा की बनावट।", "रोबोटिक टोन, भावना की कमी, असामान्य वाक्य रचना, या खराब लिप-सिंकिंग के लिए ऑडियो का विश्लेषण करें।", "यदि सामग्री कोई आदेश या महत्वपूर्ण जानकारी देती है, तो इसे एक पूरी तरह से अलग और विश्वसनीय संचार चैनल (जैसे, एक सीधा फोन कॉल) के माध्यम से सत्यापित करें।", "यह देखने के लिए कि क्या मूल, अपरिवर्तित मीडिया मौजूद है, वीडियो से कीफ्रेम पर रिवर्स इमेज सर्च टूल का उपयोग करें।"],
        },
      },
      {
        title: { en: "Report and Document", hi: "रिपोर्ट और दस्तावेज़" },
        priority: "Medium",
        actions: {
          en: [
            "Report the content to the platform where it was found (e.g., social media site) using their reporting tools for manipulated media.",
            "Report the incident to the Cyber Crime unit and your chain of command, especially if it involves impersonation of senior personnel or could impact operations.",
            "Securely save a copy of the deepfake content and its URL as evidence. Do not store it on unsecured or personal devices.",
            "Document where and when you encountered the content, who shared it, and any context provided.",
          ],
          hi: ["उस प्लेटफ़ॉर्म पर सामग्री की रिपोर्ट करें जहाँ यह पाया गया था (जैसे, सोशल मीडिया साइट) उनके हेरफेर किए गए मीडिया के लिए रिपोर्टिंग टूल का उपयोग करके।", "साइबर अपराध इकाई और अपनी कमांड श्रृंखला को घटना की रिपोर्ट करें, खासकर यदि इसमें वरिष्ठ कर्मियों का प्रतिरूपण शामिल है या संचालन को प्रभावित कर सकता है।", "सबूत के रूप में डीपफेक सामग्री और उसके यूआरएल की एक प्रति सुरक्षित रूप से सहेजें। इसे असुरक्षित या व्यक्तिगत उपकरणों पर संग्रहीत न करें।", "दस्तावेज़ करें कि आपने सामग्री का सामना कहाँ और कब किया, इसे किसने साझा किया, और कोई भी संदर्भ प्रदान किया गया।"],
        },
      },
    ],
    contacts: [
      { role: { en: "Cyber Crime Unit", hi: "साइबर अपराध इकाई" }, contact: "1-800-CYBER-CRIME", type: "phone" },
      { role: { en: "Public Affairs Office", hi: "जनसंपर्क कार्यालय" }, contact: "pao@defence.mil", type: "email" },
    ],
  },
  {
    id: "insider-threats",
    title: { en: "Insider Threat Protocol", hi: "आंतरिक खतरा प्रोटोकॉल" },
    category: "Insider Threats",
    icon: UserX,
    severity: "Critical",
    description: { en: "Procedure for handling security threats originating from within the organization.", hi: "संगठन के भीतर से उत्पन्न होने वाले सुरक्षा खतरों से निपटने की प्रक्रिया।" },
    estimatedTime: "Ongoing",
    steps: [
      {
        title: { en: "Definition", hi: "परिभाषा" },
        priority: "Info",
        actions: {
          en: [
            "An insider threat is a security risk that originates from within the targeted organization. It typically involves a current or former employee, contractor, or business partner who has inside information concerning the organization's security practices, data, and computer systems.",
            "The threat may be malicious (intentional) or unintentional (accidental).",
          ],
          hi: [
            "एक आंतरिक खतरा एक सुरक्षा जोखिम है जो लक्षित संगठन के भीतर से उत्पन्न होता है। इसमें आमतौर पर एक वर्तमान या पूर्व कर्मचारी, ठेकेदार, या व्यावसायिक भागीदार शामिल होता है, जिसके पास संगठन की सुरक्षा प्रथाओं, डेटा और कंप्यूटर सिस्टम से संबंधित अंदर की जानकारी होती है।",
            "खतरा दुर्भावनापूर्ण (जानबूझकर) या अनजाने (आकस्मिक) हो सकता है।",
          ],
        },
      },
      {
        title: { en: "Observation and Documentation", hi: "अवलोकन और प्रलेखन" },
        priority: "Critical",
        actions: {
          en: [
            "Do not confront the individual directly or reveal your suspicions. This could compromise an investigation.",
            "Discreetly and accurately document all suspicious activities: dates, times, locations, specific actions, and any other personnel involved.",
            "Note any unauthorized attempts to access sensitive areas, data, or systems outside their normal job duties.",
            "Observe unusual work patterns, such as working very late or accessing systems at odd hours without justification.",
            "Report your factual, objective concerns to the Counter-Intelligence or Security Office immediately. Avoid speculation.",
          ],
          hi: ["व्यक्ति का सीधे सामना न करें या अपने संदेह प्रकट न करें। यह एक जांच से समझौता कर सकता है।", "तारीखों, समय, स्थानों, विशिष्ट कार्यों, और किसी भी अन्य शामिल कर्मियों सहित सभी संदिग्ध गतिविधियों का सावधानीपूर्वक और सटीक रूप से दस्तावेजीकरण करें।", "संवेदनशील क्षेत्रों, डेटा, या उनके सामान्य नौकरी कर्तव्यों के बाहर सिस्टम तक पहुंचने के किसी भी अनधिकृत प्रयास पर ध्यान दें।", "असामान्य कार्य पैटर्न का निरीक्षण करें, जैसे कि बहुत देर से काम करना या बिना किसी औचित्य के विषम समय पर सिस्टम तक पहुंचना।", "अपनी तथ्यात्मक, वस्तुनिष्ठ चिंताओं की सूचना तुरंत काउंटर-इंटेलिजेंस या सुरक्षा कार्यालय को दें। अटकलों से बचें।"],
        },
      },
      {
        title: { en: "Cooperate with Investigation", hi: "जांच में सहयोग करें" },
        priority: "High",
        actions: {
          en: [
            "Provide all documented evidence to the proper investigative authorities when requested.",
            "Maintain strict confidentiality. Do not discuss the investigation with anyone outside of the official investigative team.",
            "Follow all instructions provided by security personnel precisely.",
            "Be prepared to act as a witness if required and provide truthful, factual testimony.",
            "Continue to perform your duties normally to avoid arousing suspicion.",
          ],
          hi: ["अनुरोध किए जाने पर उचित जांच अधिकारियों को सभी प्रलेखित साक्ष्य प्रदान करें।", "सख्त गोपनीयता बनाए रखें। आधिकारिक जांच दल के बाहर किसी से भी जांच पर चर्चा न करें।", "सुरक्षा कर्मियों द्वारा दिए गए सभी निर्देशों का ठीक-ठीक पालन करें।", "यदि आवश्यक हो तो गवाह के रूप में कार्य करने के लिए तैयार रहें और सच्ची, तथ्यात्मक गवाही दें।", "संदेह पैदा करने से बचने के लिए सामान्य रूप से अपने कर्तव्यों का पालन करना जारी रखें।"],
        },
      },
    ],
    contacts: [
      { role: { en: "Counter-Intelligence", hi: "काउंटर-इंटेलिजेंस" }, contact: "1-800-CI-ALERT", type: "phone" },
      { role: { en: "Security Office", hi: "सुरक्षा कार्यालय" }, contact: "security@defence.mil", type: "email" },
    ],
  },
  {
    id: "network-intrusion",
    title: { en: "Network Intrusion Response", hi: "नेटवर्क घुसपैठ प्रतिक्रिया" },
    category: "Network Intrusion",
    icon: Network,
    severity: "Critical",
    description: { en: "Actions to take upon detecting an unauthorized intrusion into the network.", hi: "नेटवर्क में अनधिकृत घुसपैठ का पता चलने पर की जाने वाली कार्रवाइयां।" },
    estimatedTime: "45-90 minutes",
    steps: [
      {
        title: { en: "Definition", hi: "परिभाषा" },
        priority: "Info",
        actions: {
          en: [
            "A network intrusion is any unauthorized activity on a digital network. Network intrusions often involve stealing valuable network resources and almost always jeopardize the security of the network and/or its data.",
            "This can range from automated port scans to sophisticated, targeted attacks.",
          ],
          hi: [
            "नेटवर्क घुसपैठ एक डिजिटल नेटवर्क पर कोई भी अनधिकृत गतिविधि है। नेटवर्क घुसपैठ में अक्सर मूल्यवान नेटवर्क संसाधनों की चोरी शामिल होती है और लगभग हमेशा नेटवर्क और/या उसके डेटा की सुरक्षा को खतरे में डालती है।",
            "यह स्वचालित पोर्ट स्कैन से लेकर परिष्कृत, लक्षित हमलों तक हो सकता है।",
          ],
        },
      },
      {
        title: { en: "Isolate and Contain", hi: "अलग करें और नियंत्रित करें" },
        priority: "Critical",
        actions: {
          en: [
            "Immediately disconnect the affected systems or network segment from the rest of the network to prevent lateral movement.",
            "Do not power off affected systems unless instructed. This preserves volatile memory (RAM) which is critical for forensic analysis.",
            "If the source IP address of the intrusion is identified, block it at the network firewall immediately.",
            "Implement temporary access control lists (ACLs) to restrict traffic to and from the compromised segment.",
            "Change administrative credentials for all network devices (routers, switches, firewalls) and critical servers.",
          ],
          hi: ["पार्श्व आंदोलन को रोकने के लिए प्रभावित सिस्टम या नेटवर्क खंड को बाकी नेटवर्क से तुरंत डिस्कनेक्ट करें।", "निर्देश दिए जाने तक प्रभावित सिस्टम को बंद न करें। यह फोरेंसिक विश्लेषण के लिए महत्वपूर्ण अस्थिर मेमोरी (रैम) को संरक्षित करता है।", "यदि घुसपैठ का स्रोत आईपी पता पहचाना जाता है, तो उसे तुरंत नेटवर्क फ़ायरवॉल पर ब्लॉक करें।", "समझौता किए गए खंड से और तक यातायात को प्रतिबंधित करने के लिए अस्थायी पहुंच नियंत्रण सूची (एसीएल) लागू करें।", "सभी नेटवर्क उपकरणों (राउटर, स्विच, फ़ायरवॉल) और महत्वपूर्ण सर्वरों के लिए प्रशासनिक क्रेडेंशियल बदलें।"],
        },
      },
      {
        title: { en: "Analyze and Eradicate", hi: "विश्लेषण और उन्मूलन" },
        priority: "High",
        actions: {
          en: [
            "Analyze firewall, Intrusion Detection/Prevention System (IDS/IPS), and system logs to determine the attack vector and scope of the breach.",
            "Create forensic images of affected systems before making any changes.",
            "Identify and remove any backdoors, malware, or unauthorized accounts created by the attacker.",
            "Patch all identified vulnerabilities that were exploited during the intrusion.",
            "If systems cannot be trusted, restore them from clean, trusted backups created *before* the intrusion date.",
          ],
          hi: ["हमले के वेक्टर और उल्लंघन के दायरे को निर्धारित करने के लिए फ़ायरवॉल, घुसपैठ का पता लगाने/रोकथाम प्रणाली (आईडीएस/आईपीएस), और सिस्टम लॉग का विश्लेषण करें।", "कोई भी बदलाव करने से पहले प्रभावित सिस्टम की फोरेंसिक छवियां बनाएं।", "हमलावर द्वारा बनाए गए किसी भी बैकडोर, मैलवेयर, या अनधिकृत खातों को पहचानें और हटाएं।", "घुसपैठ के दौरान शोषित की गई सभी पहचानी गई कमजोरियों को पैच करें।", "यदि सिस्टम पर भरोसा नहीं किया जा सकता है, तो उन्हें घुसपैठ की तारीख से *पहले* बनाए गए स्वच्छ, विश्वसनीय बैकअप से पुनर्स्थापित करें।"],
        },
      },
      {
        title: { en: "Report and Harden", hi: "रिपोर्ट और सुदृढ़ करें" },
        priority: "Medium",
        actions: {
          en: ["Report the intrusion to CERT-Army with all collected evidence and logs.", "Create a detailed incident report outlining the timeline, impact, and remediation steps.", "Review and update network security policies, access controls, and firewall rules based on lessons learned.", "Conduct a full post-incident security audit to identify and address other potential weaknesses."],
          hi: ["एकत्र किए गए सभी सबूतों और लॉग के साथ CERT-सेना को घुसपैठ की रिपोर्ट करें।", "समयरेखा, प्रभाव और उपचार के चरणों को रेखांकित करते हुए एक विस्तृत घटना रिपोर्ट बनाएं।", "सीखे गए पाठों के आधार पर नेटवर्क सुरक्षा नीतियों, पहुंच नियंत्रण और फ़ायरवॉल नियमों की समीक्षा और अद्यतन करें।", "अन्य संभावित कमजोरियों की पहचान करने और उन्हें दूर करने के लिए घटना के बाद एक पूर्ण सुरक्षा ऑडिट करें।"],
        },
      },
    ],
    contacts: [
      { role: { en: "Network Operations Center", hi: "नेटवर्क संचालन केंद्र" }, contact: "noc@defence.mil", type: "email" },
      { role: { en: "CERT-Army", hi: "CERT-सेना" }, contact: "1-800-CERT-ARMY", type: "phone" },
    ],
  },
  {
    id: "dos-ddos",
    title: { en: "DoS/DDoS Attack Mitigation", hi: "DoS/DDoS हमले का शमन" },
    category: "DDOS & Dos attakcs",
    icon: ServerCrash,
    severity: "Critical",
    description: { en: "Protocol for responding to Denial-of-Service attacks.", hi: "सेवा-से-इनकार (DoS) हमलों का जवाब देने के लिए प्रोटोकॉल।" },
    estimatedTime: "Ongoing",
    steps: [
      {
        title: { en: "Definition", hi: "परिभाषा" },
        priority: "Info",
        actions: {
          en: [
            "A Denial-of-Service (DoS) attack is a cyber-attack in which the perpetrator seeks to make a machine or network resource unavailable to its intended users by temporarily or indefinitely disrupting services.",
            "A Distributed Denial-of-Service (DDoS) attack is a variant where the attack source is more than one, and often thousands of, unique IP addresses.",
          ],
          hi: [
            "एक सेवा-से-इनकार (DoS) हमला एक साइबर-हमला है जिसमें अपराधी सेवाओं को अस्थायी या अनिश्चित काल के लिए बाधित करके किसी मशीन या नेटवर्क संसाधन को उसके इच्छित उपयोगकर्ताओं के लिए अनुपलब्ध बनाने का प्रयास करता है।",
            "एक वितरित सेवा-से-इनकार (DDoS) हमला एक प्रकार है जहां हमले का स्रोत एक से अधिक होता है, और अक्सर हजारों, अद्वितीय आईपी पते होते हैं।",
          ],
        },
      },
      {
        title: { en: "Identify and Confirm", hi: "पहचानें और पुष्टि करें" },
        priority: "High",
        actions: {
          en: [
            "Monitor network traffic using tools like NetFlow or packet analyzers for unusual spikes, protocols, or traffic originating from unexpected sources.",
            "Differentiate between a legitimate traffic spike (e.g., from a news event) and a DDoS attack by analyzing traffic characteristics.",
            "Contact your upstream Internet Service Provider (ISP) immediately to report the suspected attack and inquire about their mitigation capabilities.",
            "If you have a third-party DDoS mitigation service, activate it according to your pre-defined plan.",
          ],
          hi: ["असामान्य स्पाइक्स, प्रोटोकॉल, या अप्रत्याशित स्रोतों से उत्पन्न होने वाले ट्रैफ़िक के लिए नेटफ्लो या पैकेट एनालाइज़र जैसे उपकरणों का उपयोग करके नेटवर्क ट्रैफ़िक की निगरानी करें।", "ट्रैफ़िक विशेषताओं का विश्लेषण करके एक वैध ट्रैफ़िक स्पाइक (जैसे, एक समाचार घटना से) और एक DDoS हमले के बीच अंतर करें।", "संदिग्ध हमले की रिपोर्ट करने और उनकी शमन क्षमताओं के बारे में पूछताछ करने के लिए तुरंत अपने अपस्ट्रीम इंटरनेट सेवा प्रदाता (आईएसपी) से संपर्क करें।", "यदि आपके पास कोई तृतीय-पक्ष DDoS शमन सेवा है, तो इसे अपनी पूर्व-निर्धारित योजना के अनुसार सक्रिय करें।"],
        },
      },
      {
        title: { en: "Mitigation Techniques", hi: "शमन तकनीकें" },
        priority: "Critical",
        actions: {
          en: [
            "Implement rate limiting on routers and firewalls to limit traffic from single sources.",
            "Leverage a Content Delivery Network (CDN) and Web Application Firewall (WAF) to absorb and filter malicious traffic at the edge.",
            "As a last resort, work with your ISP to 'blackhole' traffic, dropping all traffic to the targeted IP address.",
            "Filter traffic based on geographic location (geoblocking) or known malicious IP ranges if the attack has a clear pattern.",
            "For application-layer attacks, scale up server resources if possible to handle the increased load.",
          ],
          hi: ["एकल स्रोतों से यातायात को सीमित करने के लिए राउटर और फ़ायरवॉल पर दर सीमित करना लागू करें।", "किनारे पर दुर्भावनापूर्ण यातायात को अवशोषित और फ़िल्टर करने के लिए एक सामग्री वितरण नेटवर्क (सीडीएन) और वेब एप्लिकेशन फ़ायरवॉल (डब्ल्यूएएफ) का लाभ उठाएं।", "अंतिम उपाय के रूप में, लक्षित आईपी पते पर सभी यातायात को छोड़ने के लिए अपने आईएसपी के साथ 'ब्लैकहोल' यातायात के लिए काम करें।", "यदि हमले का एक स्पष्ट पैटर्न है तो भौगोलिक स्थान (जियोब्लॉकिंग) या ज्ञात दुर्भावनापूर्ण आईपी श्रेणियों के आधार पर यातायात को फ़िल्टर करें।", "एप्लिकेशन-लेयर हमलों के लिए, यदि संभव हो तो बढ़े हुए लोड को संभालने के लिए सर्वर संसाधनों को बढ़ाएं।"],
        },
      },
    ],
    contacts: [
      { role: { en: "ISP Support", hi: "आईएसपी सहायता" }, contact: "Contact your provider", type: "phone" },
      { role: { en: "DDoS Mitigation Provider", hi: "DDoS शमन प्रदाता" }, contact: "Contact your provider", type: "email" },
    ],
  },
  {
    id: "zero-day",
    title: { en: "Zero-Day Exploit Response", hi: "ज़ीरो-डे एक्सप्लॉइट प्रतिक्रिया" },
    category: "Zero Day Exploit",
    icon: Bomb,
    severity: "Critical",
    description: { en: "Procedure for handling newly discovered vulnerabilities with no available patch.", hi: "बिना किसी उपलब्ध पैच के नई खोजी गई कमजोरियों से निपटने की प्रक्रिया।" },
    estimatedTime: "Immediate - Ongoing",
    steps: [
      {
        title: { en: "Definition", hi: "परिभाषा" },
        priority: "Info",
        actions: {
          en: [
            "A zero-day exploit is a cyber attack that occurs on the same day a weakness is discovered in software. At that point, it is exploited before a fix becomes available from its creator.",
            "Because the vulnerability is unknown to the software vendor, no patch exists, making these attacks particularly dangerous.",
          ],
          hi: [
            "एक ज़ीरो-डे एक्सप्लॉइट एक साइबर हमला है जो उसी दिन होता है जब सॉफ़्टवेयर में एक कमजोरी का पता चलता है। उस समय, इसके निर्माता से कोई समाधान उपलब्ध होने से पहले इसका फायदा उठाया जाता है।",
            "चूंकि भेद्यता सॉफ़्टवेयर विक्रेता के लिए अज्ञात है, इसलिए कोई पैच मौजूद नहीं है, जो इन हमलों को विशेष रूप से खतरनाक बनाता है।",
          ],
        },
      },
      {
        title: { en: "Isolate and Analyze", hi: "अलग करें और विश्लेषण करें" },
        priority: "Critical",
        actions: {
          en: [
            "Immediately isolate any systems showing signs of compromise from the network to prevent lateral movement.",
            "Capture full memory dumps and disk images of affected systems for later forensic analysis. Do not alter the live system.",
            "Analyze network traffic and system logs for any Indicators of Compromise (IoCs) like unusual outbound connections or file modifications.",
            "Report findings to CERT-Army and the software vendor immediately, providing all available technical details.",
          ],
          hi: ["पार्श्व आंदोलन को रोकने के लिए नेटवर्क से समझौता के संकेत दिखाने वाले किसी भी सिस्टम को तुरंत अलग करें।", "बाद में फोरेंसिक विश्लेषण के लिए प्रभावित सिस्टम के पूर्ण मेमोरी डंप और डिस्क छवियों को कैप्चर करें। लाइव सिस्टम को न बदलें।", "असामान्य आउटबाउंड कनेक्शन या फ़ाइल संशोधनों जैसे समझौता के किसी भी संकेतक (आईओसी) के लिए नेटवर्क ट्रैफ़िक और सिस्टम लॉग का विश्लेषण करें।", "सभी उपलब्ध तकनीकी विवरण प्रदान करते हुए, तुरंत CERT-सेना और सॉफ़्टवेयर विक्रेता को निष्कर्षों की रिपोर्ट करें।"],
        },
      },
      {
        title: { en: "Apply Compensating Controls", hi: "प्रतिपूरक नियंत्रण लागू करें" },
        priority: "High",
        actions: {
          en: [
            "Implement stricter firewall rules to block traffic to the vulnerable service from untrusted networks.",
            "Increase monitoring and logging on all critical systems to detect further exploitation attempts.",
            "If the vulnerable feature is non-essential, disable it temporarily across all systems.",
            "Apply a 'virtual patch' using an Intrusion Prevention System (IPS) or Web Application Firewall (WAF) to block the specific exploit pattern.",
          ],
          hi: ["अविश्वसनीय नेटवर्क से कमजोर सेवा के लिए यातायात को ब्लॉक करने के लिए सख्त फ़ायरवॉल नियम लागू करें।", "आगे के शोषण के प्रयासों का पता लगाने के लिए सभी महत्वपूर्ण प्रणालियों पर निगरानी और लॉगिंग बढ़ाएँ।", "यदि कमजोर सुविधा गैर-आवश्यक है, तो इसे सभी प्रणालियों में अस्थायी रूप से अक्षम करें।", "विशिष्ट शोषण पैटर्न को ब्लॉक करने के लिए एक घुसपैठ रोकथाम प्रणाली (आईपीएस) या वेब एप्लिकेशन फ़ायरवॉल (डब्ल्यूएएफ) का उपयोग करके एक 'वर्चुअल पैच' लागू करें।"],
        },
      },
      {
        title: { en: "Patch and Recover", hi: "पैच और पुनर्प्राप्त करें" },
        priority: "Medium",
        actions: {
          en: [
            "Apply the official patch from the software vendor as soon as it is released, following their guidance.",
            "Test the patch thoroughly in a non-production environment before deploying it to critical systems.",
            "Restore any compromised systems from clean, trusted backups after patching is complete.",
            "Conduct a full vulnerability scan after patching to ensure the fix is effective and no other issues were introduced.",
          ],
          hi: ["सॉफ़्टवेयर विक्रेता से आधिकारिक पैच जारी होते ही उसे लागू करें, उनके मार्गदर्शन का पालन करते हुए।", "महत्वपूर्ण प्रणालियों में तैनात करने से पहले गैर-उत्पादन वातावरण में पैच का अच्छी तरह से परीक्षण करें।", "पैचिंग पूरी होने के बाद किसी भी समझौता किए गए सिस्टम को स्वच्छ, विश्वसनीय बैकअप से पुनर्स्थापित करें।", "यह सुनिश्चित करने के लिए कि समाधान प्रभावी है और कोई अन्य समस्या पेश नहीं की गई है, पैचिंग के बाद एक पूर्ण भेद्यता स्कैन करें।"],
        },
      },
    ],
    contacts: [
      { role: { en: "CERT-Army", hi: "CERT-सेना" }, contact: "1-800-CERT-ARMY", type: "phone" },
      { role: { en: "Software Vendor Support", hi: "सॉफ़्टवेयर विक्रेता सहायता" }, contact: "Contact vendor", type: "email" },
    ],
  },
  {
    id: "fake-website",
    title: { en: "Fake Website / Cloned App Response", hi: "नकली वेबसाइट / क्लोन ऐप प्रतिक्रिया" },
    category: "Fake defence website / clone app",
    icon: Copy,
    severity: "High",
    description: { en: "How to identify and report fake websites or cloned applications.", hi: "नकली वेबसाइटों या क्लोन किए गए अनुप्रयोगों की पहचान और रिपोर्ट कैसे करें।" },
    estimatedTime: "15-30 minutes",
    steps: [
      {
        title: { en: "Definition", hi: "परिभाषा" },
        priority: "Info",
        actions: {
          en: [
            "These are malicious copies of legitimate websites or applications, designed to trick users into providing credentials, personal information, or installing malware.",
            "They often use URLs or names very similar to the real ones (typosquatting) and mimic the official design.",
          ],
          hi: [
            "ये वैध वेबसाइटों या अनुप्रयोगों की दुर्भावनापूर्ण प्रतियां हैं, जिन्हें उपयोगकर्ताओं को क्रेडेंशियल, व्यक्तिगत जानकारी प्रदान करने या मैलवेयर स्थापित करने के लिए धोखा देने के लिए डिज़ाइन किया गया है।",
            "वे अक्सर वास्तविक लोगों (टाइपोस्क्वेटिंग) के समान यूआरएल या नामों का उपयोग करते हैं और आधिकारिक डिजाइन की नकल करते हैं।",
          ],
        },
      },
      {
        title: { en: "Verification", hi: "सत्यापन" },
        priority: "High",
        actions: {
          en: [
            "Check the website URL carefully for misspellings, extra characters, or unusual domains (e.g., `.com` instead of `.mil`).",
            "Ensure the site uses HTTPS and has a valid certificate by clicking the padlock icon in the address bar. Verify the certificate details.",
            "For apps, only download from official, trusted app stores (Google Play, Apple App Store). Never sideload apps from unknown sources.",
            "Be wary of apps with few downloads, poor reviews, or that request excessive permissions unrelated to their function.",
            "Compare the design, logos, and text to the legitimate site/app. Look for poor grammar or low-quality images.",
          ],
          hi: ["वेबसाइट यूआरएल को गलत वर्तनी, अतिरिक्त वर्णों, या असामान्य डोमेन (जैसे, `.mil` के बजाय `.com`) के लिए ध्यान से देखें।", "सुनिश्चित करें कि साइट HTTPS का उपयोग करती है और एड्रेस बार में पैडलॉक आइकन पर क्लिक करके एक वैध प्रमाणपत्र है। प्रमाणपत्र विवरण सत्यापित करें।", "ऐप्स के लिए, केवल आधिकारिक, विश्वसनीय ऐप स्टोर (Google Play, Apple App Store) से डाउनलोड करें। अज्ञात स्रोतों से कभी भी ऐप्स को साइडलोड न करें।", "कम डाउनलोड, खराब समीक्षाओं, या उनके कार्य से असंबंधित अत्यधिक अनुमति मांगने वाले ऐप्स से सावधान रहें।", "डिजाइन, लोगो और टेक्स्ट की तुलना वैध साइट/ऐप से करें। खराब व्याकरण या निम्न-गुणवत्ता वाली छवियों की तलाश करें।"],
        },
      },
      {
        title: { en: "Immediate Actions (If Compromised)", hi: "तत्काल कार्रवाइयां (यदि समझौता किया गया है)" },
        priority: "Critical",
        actions: {
          en: [
            "If you entered credentials, change your password on the *legitimate* site immediately, and on any other site where you use the same password.",
            "If you installed a cloned app, uninstall it immediately. Run a full malware scan on your device using approved security software.",
            "If you provided financial details, contact your bank and credit card companies to report potential fraud and monitor your accounts.",
            "Revoke any permissions granted to the cloned app.",
          ],
          hi: ["यदि आपने क्रेडेंशियल दर्ज किए हैं, तो तुरंत *वैध* साइट पर अपना पासवर्ड बदलें, और किसी भी अन्य साइट पर जहां आप उसी पासवर्ड का उपयोग करते हैं।", "यदि आपने एक क्लोन किया हुआ ऐप इंस्टॉल किया है, तो उसे तुरंत अनइंस्टॉल करें। अनुमोदित सुरक्षा सॉफ़्टवेयर का उपयोग करके अपने डिवाइस पर एक पूर्ण मैलवेयर स्कैन चलाएँ।", "यदि आपने वित्तीय विवरण प्रदान किए हैं, तो संभावित धोखाधड़ी की रिपोर्ट करने और अपने खातों की निगरानी करने के लिए अपने बैंक और क्रेडिट कार्ड कंपनियों से संपर्क करें।", "क्लोन किए गए ऐप को दी गई किसी भी अनुमति को रद्द करें।"],
        },
      },
      {
        title: { en: "Report the Fake Site/App", hi: "नकली साइट/ऐप की रिपोर्ट करें" },
        priority: "Medium",
        actions: {
          en: [
            "Report the malicious website to Google Safe Browsing and other anti-phishing services to help protect others.",
            "If it's an app, report it directly to the official app store (Google Play Protect, Apple App Store) for removal.",
            "Report the incident through this portal, providing the URL of the fake site or the name and store link of the cloned app.",
            "Warn colleagues and family members about the specific fake site or app.",
          ],
          hi: ["दूसरों की सुरक्षा में मदद करने के लिए दुर्भावनापूर्ण वेबसाइट की रिपोर्ट Google सुरक्षित ब्राउज़िंग और अन्य एंटी-फ़िशिंग सेवाओं को करें।", "यदि यह एक ऐप है, तो इसे हटाने के लिए सीधे आधिकारिक ऐप स्टोर (Google Play Protect, Apple App Store) पर रिपोर्ट करें।", "नकली साइट का यूआरएल या क्लोन किए गए ऐप का नाम और स्टोर लिंक प्रदान करते हुए, इस पोर्टल के माध्यम से घटना की रिपोर्ट करें।", "सहकर्मियों और परिवार के सदस्यों को विशिष्ट नकली साइट या ऐप के बारे में चेतावनी दें।"],
        },
      },
    ],
    contacts: [
      { role: { en: "IT Security", hi: "आईटी सुरक्षा" }, contact: "1-800-CYBER-SEC", type: "phone" },
      { role: { en: "CERT-Army", hi: "CERT-सेना" }, contact: "cert@defence.mil", type: "email" },
    ],
  },
]