// What people contact Black Wealth Exchange about, and how each kind of
// inquiry is handled: the reply they get, whether the team is alerted right
// away, and whether it may go to Speed-to-Lead for follow-up. Replies only
// describe what BWE offers today.

export type InquiryCategoryKey =
  | "listing_claim"
  | "membership"
  | "advertising"
  | "consulting"
  | "shopper"
  | "partnership";

export type InquiryCategory = {
  key: InquiryCategoryKey;
  label: string; // shown on the form
  leadType: string; // what Speed-to-Lead records as the service needed
  forBusinesses: boolean; // business-side leads (never shoppers)
  alertTeam: boolean; // email the team as soon as it arrives
  sendToSpeedToLead: boolean;
  reply: {
    subject: string;
    paragraphs: string[];
    link: { text: string; path: string };
    question?: string;
  };
};

export const INQUIRY_CATEGORIES: InquiryCategory[] = [
  {
    key: "listing_claim",
    label: "Claim or correct my business listing",
    leadType: "BWE listing claim",
    forBusinesses: true,
    alertTeam: true,
    sendToSpeedToLead: true,
    reply: {
      subject: "About your Black Wealth Exchange listing",
      paragraphs: [
        "Thanks for reaching out about your listing on Black Wealth Exchange.",
        "Your basic directory listing is free, and we'll correct any details you send us. To manage the listing yourself, you can claim it; claiming is part of the optional Founding business membership ($49 a month).",
      ],
      link: { text: "Claim your listing", path: "/founding-membership" },
      question:
        "Which details on your listing need to change? Reply with your listing link and the corrections.",
    },
  },
  {
    key: "membership",
    label: "Business membership ($49/month)",
    leadType: "BWE business membership",
    forBusinesses: true,
    alertTeam: true,
    sendToSpeedToLead: true,
    reply: {
      subject: "The Black Wealth Exchange business membership",
      paragraphs: [
        "Thanks for your interest in the Black Wealth Exchange business membership.",
        "Your basic listing stays free. The optional Founding membership is $49 a month, billed monthly. It lets you claim and manage your listing and strengthen your profile. You can review everything before you pay, and nothing is charged until you check out.",
      ],
      link: { text: "See the membership", path: "/founding-membership" },
      question: "Is your business already listed on Black Wealth Exchange?",
    },
  },
  {
    key: "advertising",
    label: "Advertising, featured listings or sponsorship",
    leadType: "BWE advertising or sponsorship",
    forBusinesses: true,
    alertTeam: true,
    sendToSpeedToLead: true,
    reply: {
      subject: "Advertising with Black Wealth Exchange",
      paragraphs: [
        "Thanks for your interest in promoting your business on Black Wealth Exchange.",
        "Our advertising page lists the current placements and prices. A member of our team will also follow up personally.",
      ],
      link: { text: "See advertising options", path: "/advertise-with-us" },
      question: "What would you like to promote, and roughly when?",
    },
  },
  {
    key: "consulting",
    label: "AI training or consulting for my business",
    leadType: "BWE AI training or consulting",
    forBusinesses: true,
    alertTeam: true,
    sendToSpeedToLead: true,
    reply: {
      subject: "AI training and consulting with Black Wealth Exchange",
      paragraphs: [
        "Thanks for reaching out about AI training and consulting.",
        "A member of our team will follow up personally to understand what you need before suggesting anything.",
      ],
      link: { text: "About our consulting", path: "/consulting" },
      question: "What would you most like AI to help your business with?",
    },
  },
  {
    key: "shopper",
    label: "Find a Black-owned business",
    leadType: "BWE shopper inquiry",
    forBusinesses: false,
    alertTeam: false,
    sendToSpeedToLead: false,
    reply: {
      subject: "Finding a business on Black Wealth Exchange",
      paragraphs: [
        "Thanks for reaching out. You can search the Black Wealth Exchange directory by name, category or city.",
        "If you can't find what you're looking for, reply and tell us, and we'll help.",
      ],
      link: { text: "Search the directory", path: "/business-directory" },
      question: "What kind of business are you looking for, and where?",
    },
  },
  {
    key: "partnership",
    label: "Partnership or organization",
    leadType: "BWE partnership",
    forBusinesses: true,
    alertTeam: true,
    sendToSpeedToLead: true,
    reply: {
      subject: "Partnering with Black Wealth Exchange",
      paragraphs: [
        "Thanks for reaching out about working with Black Wealth Exchange.",
        "Partnership and organization inquiries are read personally, and we'll get back to you.",
      ],
      link: { text: "Visit Black Wealth Exchange", path: "/" },
      question:
        "Tell us a little about your organization and the partnership you have in mind.",
    },
  },
];

export const inquiryCategory = (key: unknown) =>
  INQUIRY_CATEGORIES.find((c) => c.key === key) || null;
