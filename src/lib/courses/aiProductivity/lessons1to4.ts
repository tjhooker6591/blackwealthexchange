import type { AiLesson } from "./types";

export const lessons1to4: AiLesson[] = [
  {
    number: 1,
    slug: "ai-foundations",
    title: "AI Foundations and Business Outcomes",
    outcome:
      "Explain what AI is good and bad at, and pick one task in your business worth trying it on.",
    trailerTitle: "Welcome and outcomes",
    reading: [
      "AI writing assistants like Microsoft Copilot work by predicting useful words based on patterns learned from huge amounts of text. That makes them fast at drafting, summarizing, reorganizing and explaining. It also means they can sound confident while being wrong. Copilot does not know your prices, your policies or your customers unless you tell it, and even then you must check what it gives back.",
      "The businesses that get real value from AI do not start with the tool. They start with a task: something that happens often, takes real time, and follows a pattern. Answering the same customer questions, writing follow-up emails, summarizing meeting notes and turning messy numbers into a weekly report are good examples.",
      "Before you change anything, write down how the task works today. How often does it happen? How long does it take? What mistakes happen? Who has to approve the result? This is your baseline. Without it you cannot tell whether AI actually saved time or just felt faster.",
      "Finally, rate the risk. A wrong word in an internal note is a small problem. A wrong price in a customer quote, or a wrong statement in a legal or financial document, is a big one. Your first AI project should be low risk, easy to check, and done often enough that the time savings add up.",
    ],
    walkthrough: {
      title: "Building a task inventory for a small catering business",
      steps: [
        "List six tasks the owner does every week: answering pricing questions, confirming bookings, writing social posts, ordering supplies, sending invoices, and replying to reviews.",
        "For each task, write how many times a week it happens and how many minutes it takes. Example: pricing questions, 15 a week, 6 minutes each, 90 minutes total.",
        "Mark the risk: low (a mistake is easy to fix), medium (a customer could be confused), or high (money, legal or safety).",
        "Note who approves the result today. For the catering owner, that is the owner for everything.",
        "Pick the task with the most total time and low risk. Here, drafting replies to pricing questions wins: frequent, repetitive, and the owner reviews each reply before it goes out.",
      ],
    },
    assignment: {
      instructions: [
        "List at least six recurring tasks from your own business or job.",
        "For each one, record how often it happens, minutes per occurrence, common mistakes, risk level and who approves it.",
        "Circle one low-risk task as your pilot and write one sentence on why you chose it.",
      ],
      deliverable:
        "A task inventory table with one pilot task chosen and a baseline time recorded.",
    },
    reflection: [
      "Which of your tasks would be hardest to check if AI got it wrong?",
      "Where does most of your week actually go, compared with where you thought it went?",
      "What number will you use to decide whether your pilot worked?",
    ],
    quiz: [
      {
        question: "Which task is the best choice for a first AI pilot?",
        choices: [
          "Approving a loan application with no human review",
          "Drafting replies to common customer questions that you review before sending",
          "Whatever task costs the business the most money",
          "Writing a contract you sign without reading",
        ],
        answer: 1,
        why: "A first pilot should be frequent, low risk and easy to check. Reviewed drafts of common replies fit all three.",
      },
      {
        question: "Why record a baseline before using AI on a task?",
        choices: [
          "Microsoft requires it before you can use Copilot",
          "So you can measure whether AI actually saved time or reduced mistakes",
          "So the AI can learn your habits",
          "It is not useful; you should start right away",
        ],
        answer: 1,
        why: "Without knowing how long a task takes today, you cannot prove an improvement.",
      },
      {
        question:
          "Copilot gives you a confident answer about your own return policy that you never told it. What should you assume?",
        choices: [
          "It found your policy online, so it is correct",
          "It may be guessing; check it against your real policy",
          "Copilot cannot make mistakes about businesses",
          "Your policy should be changed to match it",
        ],
        answer: 1,
        why: "AI predicts likely text. Anything it says about your business that you did not supply must be verified.",
      },
      {
        question:
          "Which is a high-risk use of AI that needs careful human approval?",
        choices: [
          "Brainstorming names for an internal project",
          "Summarizing your own meeting notes for yourself",
          "Stating prices and terms in a customer quote",
          "Rewording a draft social post you will review",
        ],
        answer: 2,
        why: "Prices and terms are commitments to customers. Mistakes cost money and trust.",
      },
    ],
  },
  {
    number: 2,
    slug: "getting-started-with-copilot",
    title: "Getting Started with Microsoft Copilot",
    outcome:
      "Find out which Copilot features you actually have, sign in the right way, and run your first safe test.",
    trailerTitle: "What Microsoft Copilot can do",
    reading: [
      '"Copilot" is a family of Microsoft products, not one tool. There is the free Copilot app and website for anyone with a Microsoft account. There is Copilot Chat for people signed in with a work or school account. And there is Microsoft 365 Copilot, a paid add-on that works inside Word, Excel, PowerPoint, Outlook and Teams and can use your organization\'s files and email.',
      'What you can do depends on which of these you have, your license, and settings chosen by whoever manages your Microsoft account. Two people can open "Copilot" and see different buttons. That is normal. Never assume a feature exists because you saw it in a video or an ad, including this course. Check your own screen.',
      "Sign in with the account your business approves. If you have a work account, look for a shield or a note that says your data is protected; that means your chats are handled under your organization's agreement with Microsoft. A personal account follows Microsoft's consumer terms. Know which one you are using before you paste anything.",
      "Start with fictional information. Make up a customer, a list of tasks, or a sample email. Once you understand how Copilot responds and you have checked your privacy rules (Lesson 10), you can move to real but non-sensitive material.",
    ],
    walkthrough: {
      title: "Your first test: sorting a to-do list",
      steps: [
        "Open Copilot from the account your business approves: copilot.microsoft.com, the Copilot app, or the Copilot button in a Microsoft 365 app if you have it.",
        "Write down what you see: is there a work-account shield? Can you upload files? Is there a Copilot button inside Word or Outlook? This is your feature checklist.",
        "Paste the sample prompt below, which uses a made-up list of nine tasks.",
        "Before reading Copilot's answer, pick your own top three. Then compare. Where did it agree with you? Where did it miss something only you would know, like a customer who is about to leave?",
        "Note one thing Copilot did well and one thing it could not know.",
      ],
      samplePrompt:
        "I run a small cleaning company. Here are nine things on my list this week: reply to 4 quote requests, fix the website phone number, order supplies, follow up on an unpaid invoice, post on Instagram, train a new hire, renew insurance, ask happy clients for reviews, update my price sheet. Pick the three most important for this week and explain why in one sentence each. If you need information you do not have, say so.",
    },
    assignment: {
      instructions: [
        "Sign in to Copilot with your approved account.",
        "Complete a feature checklist: which app you used, work or personal account, whether file upload works, and whether Copilot appears inside Word, Excel, Outlook or Teams for you.",
        "Run the to-do list prompt with your own made-up or non-sensitive list and compare its top three with yours.",
      ],
      deliverable:
        "A one-page feature checklist plus a short note comparing Copilot's priorities with yours.",
    },
    reflection: [
      "Which Copilot features did you expect to have but do not?",
      "What did Copilot get wrong because it did not know your business?",
      "Who in your business decides which AI tools are allowed?",
    ],
    quiz: [
      {
        question: "What decides which Copilot features you can use?",
        choices: [
          "Everyone gets exactly the same features",
          "Your license, your account type and your organization's settings",
          "The course you are taking",
          "The type of computer you own",
        ],
        answer: 1,
        why: "Copilot features vary by product, license and admin settings, so check your own screen.",
      },
      {
        question:
          "Which product works inside Word, Excel and Outlook and can use your organization's files?",
        choices: [
          "Microsoft 365 Copilot (paid add-on)",
          "Any web search engine",
          "Every free chatbot",
          "Windows Calculator",
        ],
        answer: 0,
        why: "Microsoft 365 Copilot is the add-on that works inside the Office apps with organizational data.",
      },
      {
        question: "What kind of information should your first tests use?",
        choices: [
          "Your real customer list, to see if it works",
          "Fictional or non-sensitive examples",
          "Your bank login, so Copilot can help with bills",
          "Employee medical records",
        ],
        answer: 1,
        why: "Practice with made-up data until you know your privacy rules.",
      },
      {
        question:
          "You saw a Copilot feature in an online video but cannot find it. What is most likely?",
        choices: [
          "Your computer is broken",
          "The feature depends on a license or setting you do not have",
          "You must reinstall Windows",
          "The video was about a different company",
        ],
        answer: 1,
        why: "Different products and licenses show different features. That is expected.",
      },
    ],
  },
  {
    number: 3,
    slug: "prompts-that-work",
    title: "Prompts That Work: The Four-Part Prompt",
    outcome:
      "Write prompts with role, context, task and constraints that give accurate, usable drafts the first time.",
    trailerTitle: "The four-part prompt",
    reading: [
      'A prompt is simply the instruction you give Copilot. Short, vague prompts get generic answers. "Write an email to a customer" could produce anything. Clear prompts get answers you can use with light editing.',
      'Use four parts. Role: who Copilot should act as ("You are the front-desk manager of a family dental office"). Context: the facts it needs ("The patient missed two appointments; our policy is a $25 fee after the second"). Task: exactly what you want ("Write a friendly 100-word text reminding them of the policy"). Constraints: the rules ("Do not threaten. Do not mention any fee other than $25. Use a warm tone."). You can add a fifth part, Format: table, bullet list, email with subject line.',
      'The most important constraint is: do not invent facts. Tell Copilot what to do when something is missing: "If a price, date or name is not given, write [CONFIRM] instead of guessing." This one line prevents most AI mistakes in business writing.',
      'When a draft is not right, do not start over. Reply with a correction: "Shorter." "Less formal." "Remove the second paragraph." Copilot keeps the conversation in mind, so small follow-ups are fast. When you get a prompt that works, save it as a prompt card so you and your team can reuse it.',
    ],
    walkthrough: {
      title: "Vague prompt vs four-part prompt",
      steps: [
        'Run the vague prompt: "Write an email about a late order." Notice it guesses at the product, the delay and the fix, and may promise things you cannot deliver.',
        "Now run the four-part prompt below with the same made-up situation.",
        "Compare the two: which one stated facts you did not give? Which one needs less editing? Time how long it takes you to make each one ready to send.",
        "Save the four-part version as a prompt card: a short note with the role, context fields to fill in, task and constraints.",
      ],
      samplePrompt:
        "Role: You are the customer care lead for a small online candle shop.\nContext: Order #1042 for 3 candles was due Friday. Our supplier is late. We expect to ship within 5 business days but the date is not confirmed.\nTask: Write a short apology email with a subject line and one clear next step for the customer.\nConstraints: Under 120 words. Warm and honest. Do not promise a delivery date or a discount. If anything else is unknown, write [CONFIRM].",
    },
    assignment: {
      instructions: [
        "Choose one task from your Lesson 1 inventory that involves writing.",
        "Write a vague prompt and a four-part prompt for it, using made-up or non-sensitive details.",
        "Run both, then score each from 1 to 5 on accuracy, tone and editing time.",
        "Save the better prompt as a prompt card with blanks for the details that change each time.",
      ],
      deliverable:
        "A reusable prompt card with role, context fields, task, constraints and format.",
    },
    reflection: [
      "Which part of the four-part prompt made the biggest difference for your task?",
      "What facts does Copilot need from you every single time for this task?",
      "Who else on your team could use your prompt card?",
    ],
    quiz: [
      {
        question:
          "What are the four parts of the prompt taught in this lesson?",
        choices: [
          "Hello, question, thanks, goodbye",
          "Role, context, task, constraints",
          "Subject, body, signature, attachment",
          "Name, date, price, total",
        ],
        answer: 1,
        why: "Role, context, task and constraints give Copilot who, what it knows, what to do and the rules.",
      },
      {
        question:
          "What should your prompt tell Copilot to do when a key fact is missing?",
        choices: [
          "Make a reasonable guess and state it as fact",
          "Mark it, for example with [CONFIRM], instead of guessing",
          "Skip the whole task",
          "Use a fact from another customer",
        ],
        answer: 1,
        why: "Flagging missing facts prevents confident-sounding mistakes.",
      },
      {
        question:
          "The first draft is too long and too formal. What is the fastest fix?",
        choices: [
          "Close Copilot and write it yourself",
          "Start a new chat and retype everything",
          'Reply: "Shorter and more casual"',
          "Send it anyway",
        ],
        answer: 2,
        why: "Copilot keeps the conversation in mind, so a short follow-up instruction is usually enough.",
      },
      {
        question: "Which line is a constraint?",
        choices: [
          "You are a real-estate assistant",
          "The house has three bedrooms",
          "Write a listing description",
          "Do not mention the price or school ratings",
        ],
        answer: 3,
        why: "Constraints are the rules about what the output must or must not do.",
      },
    ],
  },
  {
    number: 4,
    slug: "email-and-customer-messages",
    title: "Email, Writing and Customer Messages",
    outcome:
      "Draft customer emails and messages quickly without promising anything you have not approved.",
    trailerTitle: "Email and customer communication",
    reading: [
      "Email is where most small businesses save time with AI first. Copilot can turn a few rough notes into a clear, kind message in seconds. The rule that keeps you safe: Copilot writes the draft, a person sends the message.",
      'Give Copilot only the facts you have approved. If a shipment is late and you do not know the new date, say so in the prompt and tell it not to promise one. If you have not decided on a refund, tell it not to mention money. Copilot is eager to be helpful, and "helpful" can mean offering things you never agreed to.',
      "Some messages always need careful human review: refunds and credits, complaints that could become disputes, anything legal, health or safety related, and messages to upset customers. For these, use Copilot to organize your thoughts and fix tone, then read every sentence before sending.",
      "Build templates for messages you send again and again: quote follow-ups, appointment reminders, delay notices and thank-you notes. Each template should have blanks for the details that change, and an approval line at the bottom reminding you what to check before sending.",
    ],
    walkthrough: {
      title: "Turning rough notes into a delay notice",
      steps: [
        'Write your rough notes exactly as you would on a sticky note: "Johnson kitchen job, tile delayed, supplier says next week maybe, sorry, will call Monday."',
        "Use the sample prompt below to turn the notes into an email.",
        "Check every fact in the draft against your notes. Delete anything Copilot added that you did not say, such as a specific date or a discount.",
        'Add the approval line: "Checked: dates, prices, promises. Approved by: ____."',
        "Save the final version as a delay-notice template with blanks for the name, job and next step.",
      ],
      samplePrompt:
        "Turn these notes into a short, warm email to a customer. Notes: Johnson kitchen job, tile delayed, supplier says next week maybe, sorry, will call Monday. Include a subject line. Do not promise a date or any discount. End with the next step: we will call Monday. Under 100 words.",
    },
    assignment: {
      instructions: [
        "Create three templates using Copilot: a quote or sales follow-up, a delay or problem notice, and a thank-you or meeting recap.",
        "Use made-up or non-sensitive details.",
        "For each one, list every factual claim and confirm you approved it.",
        "Add an approval line to each template.",
      ],
      deliverable:
        "Three approved email templates, each with blanks and an approval line.",
    },
    reflection: [
      "Which message do you write most often that a template could replace?",
      "What has Copilot offered in a draft that you would never have promised?",
      "Which messages in your business must always be reviewed by you personally?",
    ],
    quiz: [
      {
        question: "Who should send a message that promises a refund?",
        choices: [
          "Copilot, automatically",
          "An authorized person who has read and approved it",
          "Anyone on the team",
          "Nobody; refunds should never be mentioned",
        ],
        answer: 1,
        why: "Money and promises need a person with authority to approve them.",
      },
      {
        question:
          'Copilot\'s draft says "Your order will arrive Tuesday" but you do not know the date. What do you do?',
        choices: [
          "Leave it in; Tuesday is likely",
          "Remove it or replace it with what you actually know",
          "Change it to Monday to be safe",
          "Send it and correct it later if needed",
        ],
        answer: 1,
        why: "Never send a promise you cannot keep. Use only approved facts.",
      },
      {
        question: "What belongs at the bottom of a reusable template?",
        choices: [
          "An approval line listing what to check before sending",
          "A random inspirational quote",
          "Copilot's name",
          "Your password, for convenience",
        ],
        answer: 0,
        why: "An approval line reminds whoever uses the template to check facts and promises.",
      },
      {
        question: "Which message needs the most careful human review?",
        choices: [
          "A thank-you note after a purchase",
          "A reply to an angry customer threatening a chargeback",
          "A reminder about holiday hours",
          "An internal note to yourself",
        ],
        answer: 1,
        why: "Disputes can become legal or financial problems. Read every sentence.",
      },
    ],
  },
];
