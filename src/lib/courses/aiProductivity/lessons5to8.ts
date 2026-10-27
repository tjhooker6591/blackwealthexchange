import type { AiLesson } from "./types";

export const lessons5to8: AiLesson[] = [
  {
    number: 5,
    slug: "support-and-escalation",
    title: "Customer Support and Escalation",
    outcome:
      "Sort incoming customer requests with AI help and know exactly which ones a person must handle.",
    trailerTitle: "Customer support and escalation",
    reading: [
      "Customer messages come in every kind: simple questions about hours, requests to change an appointment, billing problems, complaints, and occasionally something urgent or serious. Treating them all the same wastes time on easy ones and risks mishandling hard ones.",
      "A triage matrix fixes that. It is a simple table with a row for each type of request and columns for how serious it is, the first response, what information you need, who handles it, and when it counts as done. Once you have the table, Copilot can help sort new messages into rows and draft first replies for the easy ones.",
      "Copilot helps most with low-risk, common questions: hours, directions, what is included in a service, how to book. Account changes, billing disputes and refunds go to a trained person. Anything involving safety, threats, harassment, or legal or medical issues goes straight to the owner or the right authority, without waiting on a draft.",
      "When you ask Copilot to sort a message, ask it to give its reason and say how sure it is. If it is unsure, the message goes to a person. An AI sorter should never make up a policy to fit a message it does not understand.",
    ],
    walkthrough: {
      title: "Sorting five support messages for a hair salon",
      steps: [
        "Build a simple matrix with four rows: General question (low), Booking change (low), Billing or refund (medium, owner handles), Urgent or safety (high, owner immediately).",
        'Write five made-up messages: "What time do you close Saturday?", "Can I move my 2pm to 4pm?", "I was charged twice", "Do you do kids\' cuts?", and "Your stylist burned my scalp."',
        "Paste the matrix and messages into Copilot with the sample prompt.",
        "Check each result. The double charge should go to the owner. The burn should be marked urgent. If Copilot drafted a reply to the burn complaint offering money, that is a failure to fix in your rules.",
        "Adjust your matrix wording until all five land in the right row.",
      ],
      samplePrompt:
        'Here is my support matrix: [paste table]. Sort each of these five messages into one row. For each, give the row, one sentence explaining why, and how confident you are (high, medium, low). If confidence is low, say "send to owner." Do not draft replies for billing, refund or urgent messages. Messages: [paste].',
    },
    assignment: {
      instructions: [
        "Build a triage matrix for your business with at least four request types.",
        "Write five realistic made-up support messages, including at least one billing issue and one urgent one.",
        "Have Copilot sort them with reasons and confidence, then score how many it got right.",
        "If more than one was wrong, improve your matrix descriptions and try again.",
      ],
      deliverable:
        "A triage matrix tested on five sample messages, with your accuracy score.",
    },
    reflection: [
      "Which kind of customer message takes most of your support time today?",
      "What should happen in your business when a message is urgent and you are unavailable?",
      "Which replies would you be comfortable letting a team member send from a template?",
    ],
    quiz: [
      {
        question:
          "Copilot is unsure how to sort a customer message. What should happen?",
        choices: [
          "Copilot invents a new category",
          "The message goes to a person to review",
          "The message is deleted",
          "Copilot replies anyway",
        ],
        answer: 1,
        why: "Uncertain cases belong with a human, not a guess.",
      },
      {
        question: "Which request is safest for AI-drafted replies?",
        choices: [
          "A customer reporting an injury",
          "A disputed double charge",
          '"What are your Saturday hours?"',
          "A threat against an employee",
        ],
        answer: 2,
        why: "Simple factual questions with approved answers are low risk.",
      },
      {
        question: "What should an AI sorter include with each decision?",
        choices: [
          "A reason and how confident it is",
          "A joke to lighten the mood",
          "A discount code",
          "Nothing; just the category",
        ],
        answer: 0,
        why: "Reasons and confidence let you spot mistakes and route unsure cases to a person.",
      },
      {
        question: "Where does a message about a safety incident go?",
        choices: [
          "Into the general question queue",
          "Straight to the owner or the right authority",
          "To Copilot for a reply",
          "Wait until the end of the week",
        ],
        answer: 1,
        why: "Urgent and safety issues skip the queue and go to a responsible person right away.",
      },
    ],
  },
  {
    number: 6,
    slug: "meetings-and-action-items",
    title: "Meetings and Action Items",
    outcome:
      "Turn meeting notes into a clear summary, decisions and action items without inventing owners or dates.",
    trailerTitle: "Meetings and action items",
    reading: [
      "After a meeting, people often remember different things. A good written summary fixes that, but writing one takes time. Copilot can turn rough notes or, if your tools allow it, a meeting transcript into a clean summary in under a minute.",
      'Ask for four sections every time: a short summary of what was discussed, decisions that were actually made, action items with an owner and a due date, and open questions. Keeping discussion separate from decisions matters. "We talked about raising prices" is not the same as "We decided to raise prices on June 1."',
      'The biggest risk is invented details. If nobody volunteered to design the flyer, Copilot may still assign it to someone who sounds likely. Tell it: "If an action has no owner or due date in the notes, write UNASSIGNED or NO DATE." Then you fix those gaps with the team.',
      "Get everyone's permission before you record a meeting or upload a transcript, and follow your organization's rules about where recordings are stored. Some Microsoft 365 Copilot plans can summarize Teams meetings directly; if yours does not, paste your typed notes instead.",
    ],
    walkthrough: {
      title: "Summarizing a product launch meeting",
      steps: [
        'Use these made-up notes: "Talked about the Friday launch. Maya will check stock by Thursday. Need a poster, nobody picked. Price stays $25. Jordan asked about delivery partners, no answer yet."',
        "Run the sample prompt below.",
        "Check: Maya owns stock check due Thursday. The poster is UNASSIGNED. The $25 price is a decision. Delivery partners is an open question.",
        "If Copilot gave the poster to someone, or added a date that was not in the notes, correct it and add a stronger constraint to your template.",
      ],
      samplePrompt:
        "Turn these meeting notes into four sections: Summary (2 sentences), Decisions, Action items (owner, task, due date), Open questions. Only use what is in the notes. If an action has no owner, write UNASSIGNED. If it has no date, write NO DATE. Notes: [paste].",
    },
    assignment: {
      instructions: [
        "Write a meeting summary template using the four sections.",
        "Run it on made-up notes or notes from a real non-sensitive meeting, with everyone's permission.",
        "Check every name, date and decision against the original notes.",
        "Turn the action items into a register: a simple table of owner, task, due date and status.",
      ],
      deliverable:
        "A meeting summary template and an action-item register built from one set of notes.",
    },
    reflection: [
      "How do decisions from your meetings get lost today?",
      "Who should receive the summary, and how quickly after the meeting?",
      "What are your rules about recording conversations with staff or customers?",
    ],
    quiz: [
      {
        question:
          "The notes do not say who will make the poster. How should the summary show it?",
        choices: [
          "Assign it to the most senior person",
          "Mark it UNASSIGNED so the team can decide",
          "Leave the poster out entirely",
          "Mark it as completed",
        ],
        answer: 1,
        why: "Never invent owners. Mark gaps so a person fills them.",
      },
      {
        question: "Which of these is a decision, not just discussion?",
        choices: [
          '"We talked about a new logo"',
          '"Some people like the blue color"',
          '"The price will stay $25"',
          '"Jordan asked about delivery"',
        ],
        answer: 2,
        why: "A decision is a settled outcome. Discussion and questions are not decisions.",
      },
      {
        question:
          "What must you do before recording a meeting for Copilot to summarize?",
        choices: [
          "Nothing; recording is always allowed",
          "Get permission from the people in the meeting and follow your organization's rules",
          "Turn off everyone's cameras",
          "Email the recording to Microsoft",
        ],
        answer: 1,
        why: "Consent and your organization's rules come first.",
      },
      {
        question: "What are the four sections of a good meeting summary?",
        choices: [
          "Summary, decisions, action items, open questions",
          "Intro, jokes, lunch, goodbye",
          "Attendees, weather, location, time",
          "Problems, blame, excuses, apologies",
        ],
        answer: 0,
        why: "These four sections separate what was said from what was decided and what happens next.",
      },
    ],
  },
  {
    number: 7,
    slug: "documents-and-proposals",
    title: "Documents and Proposals",
    outcome:
      "Use Copilot to outline and draft proposals and documents that only contain claims you can back up.",
    trailerTitle: "Documents and proposals",
    reading: [
      "Proposals, service descriptions, checklists and policies take hours to write from a blank page. Copilot is good at structure: turning your notes into headings, filling in standard sections, and making the writing clear. In Microsoft 365 Copilot you can do this inside Word; otherwise draft in Copilot and paste into your document.",
      "A strong small-business proposal answers simple questions: What problem does the client have? What will you do? What will you deliver and when? What is not included? What do you need from the client? What does it cost? What happens next? Give Copilot your answers to these and it can produce a clean first draft.",
      'Never let AI manufacture evidence. Copilot may add phrases like "proven to increase revenue by 30%" or invent a testimonial if you ask for a persuasive proposal. Every claim in a document that goes to a client must be something you can support. Prices you have not set should say TBD.',
      "Before sending, build a quick fact-check table: each claim in the document, where the evidence is, and whether it is approved. It takes five minutes and protects your reputation.",
    ],
    walkthrough: {
      title: "A one-page proposal for an auto-repair shop",
      steps: [
        "Imagine a made-up client: a local auto-repair shop that loses business when customers forget appointments. You offer to set up text reminders.",
        "Run the sample prompt below.",
        'Read the draft looking for any number, result or promise. Copilot may write something like "reduces no-shows by 40%." Unless you have proof, delete it or reword it as a goal.',
        "Make a fact-check table with three columns: Claim, Evidence, Approved (yes or no).",
        "Only send the proposal when every row says yes.",
      ],
      samplePrompt:
        "Write a one-page proposal outline for a fictional auto-repair shop that wants appointment reminder texts. Use these headings: Goal, What we will deliver, Not included, What we need from you, Timeline, Price, Risks, Next step. Label every price TBD. Do not include statistics, guarantees or testimonials.",
    },
    assignment: {
      instructions: [
        "Pick a service you offer or could offer and a made-up client.",
        "Use Copilot to draft a one-page proposal with the headings from the walkthrough.",
        "Build a fact-check table for every claim in the draft.",
        "Remove or fix anything you cannot support.",
      ],
      deliverable:
        "A one-page proposal draft and a completed fact-check table.",
    },
    reflection: [
      "What do clients most often misunderstand about what you deliver?",
      'What belongs in your "not included" section that you usually forget?',
      "Which claims about your business can you actually prove today?",
    ],
    quiz: [
      {
        question:
          "Which statement needs evidence before it goes in a client proposal?",
        choices: [
          'A heading called "What we will deliver"',
          '"Our service guarantees a 30% increase in revenue"',
          '"Let\'s schedule a call next week"',
          '"Price: TBD"',
        ],
        answer: 1,
        why: "Results and guarantees must be backed by proof, or removed.",
      },
      {
        question: "You have not set a price yet. How should the draft show it?",
        choices: [
          "Let Copilot pick a typical price",
          "Use your competitor's price",
          "Write TBD until you decide",
          "Leave the price section out",
        ],
        answer: 2,
        why: "Marking it TBD keeps an invented number from reaching a client.",
      },
      {
        question: "What is a fact-check table?",
        choices: [
          "A list of each claim, its evidence and whether it is approved",
          "A spreadsheet of your expenses",
          "A Microsoft product",
          "A list of customers",
        ],
        answer: 0,
        why: "It is a quick way to confirm every claim is supported before sending.",
      },
      {
        question:
          'Copilot added a glowing testimonial from "a satisfied client." What should you do?',
        choices: [
          "Keep it; it sounds good",
          "Delete it unless a real client said it and agreed to be quoted",
          "Change the client's name",
          "Move it to the bottom",
        ],
        answer: 1,
        why: "Invented testimonials are misleading and can break advertising rules.",
      },
    ],
  },
  {
    number: 8,
    slug: "spreadsheets-and-reports",
    title: "Spreadsheets and Business Reports",
    outcome:
      "Use Copilot to explain numbers, suggest formulas and write short reports, and check the math yourself.",
    trailerTitle: "Spreadsheets and business reports",
    reading: [
      "Numbers tell you how your business is really doing, but many owners avoid spreadsheets. Copilot can help: it can suggest a formula, explain what a column means, recommend a chart, and write a plain-English summary. In Excel with Microsoft 365 Copilot it can work on your sheet directly; otherwise paste a small table into chat.",
      "AI can also misread numbers. It can confuse units, mix up columns, or describe a change as an improvement when it is not. Always define your measures first. A booking rate, for example, is bookings divided by inquiries. Write that down, then check that Copilot used it.",
      'Check totals yourself, by hand or with a simple spreadsheet SUM, before you share a report. Watch out for small numbers: going from 2 sales to 4 is "100% growth" but may just be a good week. Ask Copilot to show its calculation and to mention when a sample is too small to draw conclusions.',
      "A good weekly report is short: a small table, one chart, and two or three sentences that say what happened, with honest caveats. That beats a long report nobody reads.",
    ],
    walkthrough: {
      title: "Weekly inquiries versus bookings",
      steps: [
        "Use made-up data: Week 1, 40 inquiries and 8 bookings. Week 2, 50 inquiries and 10 bookings.",
        "Calculate the booking rate yourself: 8 ÷ 40 = 20%. 10 ÷ 50 = 20%. The rate did not change, even though bookings went up.",
        "Run the sample prompt below and compare Copilot's answer with your math.",
        'If Copilot says the booking rate "improved," that is the kind of mistake you are checking for. Correct it in a follow-up.',
        "Ask for a chart suggestion and a two-sentence summary that includes the caveat about only two weeks of data.",
      ],
      samplePrompt:
        "Here is my data: Week 1, 40 inquiries, 8 bookings. Week 2, 50 inquiries, 10 bookings. Booking rate = bookings ÷ inquiries. Show the calculation for each week, suggest one chart, and write a two-sentence summary. Do not claim an improvement unless the numbers show one. Mention if the data is too small to be sure.",
    },
    assignment: {
      instructions: [
        "Build a five-week table with inquiries, bookings and revenue, using made-up or non-sensitive numbers.",
        "Define each measure in words before asking Copilot anything.",
        "Have Copilot calculate rates, suggest a chart and write a short summary.",
        "Verify at least three calculations yourself and note any mistakes.",
      ],
      deliverable:
        "A five-week funnel table, three verified calculations and a short written summary with caveats.",
    },
    reflection: [
      "Which number would tell you fastest whether your business had a good week?",
      "Where have you seen a statistic that sounded impressive but was based on very little data?",
      "Who in your business needs a weekly report, and what would they do with it?",
    ],
    quiz: [
      {
        question: "50 inquiries and 10 bookings. What is the booking rate?",
        choices: ["5%", "20%", "50%", "10%"],
        answer: 1,
        why: "10 ÷ 50 = 0.20, or 20%.",
      },
      {
        question:
          "Week 1: 8 bookings from 40 inquiries. Week 2: 10 bookings from 50 inquiries. Did the booking rate improve?",
        choices: [
          "Yes, bookings went up",
          "No, it stayed at 20% both weeks",
          "Yes, it doubled",
          "It cannot be calculated",
        ],
        answer: 1,
        why: "Both weeks are 20%. More bookings came from more inquiries, not a better rate.",
      },
      {
        question: "Why define your measures before asking Copilot?",
        choices: [
          "So you can check that it calculated what you actually meant",
          "Copilot refuses otherwise",
          "It makes the chart colorful",
          "There is no reason",
        ],
        answer: 0,
        why: "A clear definition lets you catch mixed-up columns and wrong formulas.",
      },
      {
        question:
          "Sales went from 2 to 4 this week. What is the honest summary?",
        choices: [
          '"Explosive 100% growth!"',
          '"Sales doubled from 2 to 4; the numbers are small, so watch next week before drawing conclusions"',
          '"Sales are falling"',
          "Do not report it",
        ],
        answer: 1,
        why: "Small numbers can swing a lot. Give the real figures and the caveat.",
      },
    ],
  },
];
