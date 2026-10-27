import type { AiLesson } from "./types";

export const lessons9to12: AiLesson[] = [
  {
    number: 9,
    slug: "marketing-content-responsibly",
    title: "Marketing Content, Responsibly",
    outcome:
      "Create honest, on-brand marketing for your website, social media and email in less time.",
    trailerTitle: "Marketing content responsibly",
    reading: [
      "Marketing is where AI saves the most time and causes the most embarrassment. Copilot can write ten captions in the time it takes you to write one. It can also invent a sale you are not running, a date you never set, or a quote from a customer who does not exist.",
      'Start with what is true and valuable about your business: what you sell, who it is for, what makes you different, and the details of any offer you are actually running. Give Copilot those facts and your brand voice ("friendly and proud of our neighborhood, never pushy").',
      "Ask for different versions for each channel. A website description is a few clear sentences. A social caption is short with one call to action. An email has a subject line and a single clear reason to open it. Asking for all three at once from the same facts keeps your message consistent.",
      'Before posting, check every claim, date, price and discount. Do not use customer names, photos or reviews without their permission. Avoid fake urgency like "only 2 left!" unless it is true. Honest marketing builds the trust that keeps customers coming back.',
    ],
    walkthrough: {
      title: "Spotlight for a neighborhood bookshop",
      steps: [
        "Use a made-up Black-owned bookshop hosting a Saturday author reading. You have not confirmed the time or the author yet.",
        "Run the sample prompt below.",
        "Check the drafts: any time, address or author name should be marked [CONFIRM]. Any discount or customer quote Copilot added should be removed.",
        'Pick the best caption and write down its call to action, for example "RSVP at the link in our bio."',
        "Record a short claim check: each claim, true or needs confirming.",
      ],
      samplePrompt:
        "Write marketing for a fictional independent Black-owned bookshop hosting a Saturday author reading. Voice: warm, proud, community-focused, not pushy. Create: one 3-sentence website description of the event, two Instagram captions under 40 words each, and one short email with a subject line. The time, address and author are not confirmed: write [CONFIRM] for each. Do not add discounts, prizes or customer quotes.",
    },
    assignment: {
      instructions: [
        "Choose a real or made-up product, service or event from your business.",
        "Write down the true facts and your brand voice in a few lines.",
        "Have Copilot create one website description, two social captions and one email from those facts.",
        "Check every claim and record whether it is verified, then note your call to action.",
      ],
      deliverable:
        "A three-channel campaign draft with a claim check and a clear call to action.",
    },
    reflection: [
      "How would your best customer describe your business in one sentence?",
      "Which marketing claims have you seen other businesses make that you would not make?",
      "Whose permission do you need before featuring a customer?",
    ],
    quiz: [
      {
        question:
          "Copilot's caption mentions a 20% discount you are not offering. What should you do?",
        choices: [
          "Keep it; discounts attract customers",
          "Remove it, or confirm the offer is real first",
          "Hide it in small print",
          "Change it to 10%",
        ],
        answer: 1,
        why: "Only advertise offers you are actually running.",
      },
      {
        question:
          "What should you give Copilot before asking for marketing copy?",
        choices: [
          "True facts about the offer and your brand voice",
          "Your competitor's ads to copy",
          "Your customer list",
          "Nothing; let it be creative",
        ],
        answer: 0,
        why: "Facts and voice keep the content accurate and on brand.",
      },
      {
        question:
          "Can you post a customer's photo with a glowing review that Copilot helped write?",
        choices: [
          "Yes, if it looks good",
          "Only with the customer's permission, using their real words",
          "Yes, if you blur their face",
          "Yes, if they bought something",
        ],
        answer: 1,
        why: "Reviews must be real, and photos and names need consent.",
      },
      {
        question: "Which is fake urgency?",
        choices: [
          '"Event starts Saturday at 2pm" when it does',
          '"Only 2 spots left!" when 30 are open',
          '"RSVP to save a seat"',
          '"Open until 6pm today"',
        ],
        answer: 1,
        why: "Urgency is only acceptable when it is true.",
      },
    ],
  },
  {
    number: 10,
    slug: "privacy-and-human-oversight",
    title: "Privacy, Security and Human Oversight",
    outcome:
      "Decide what information is safe to use with AI and set approval points so a person stays in charge.",
    trailerTitle: "Privacy and human oversight",
    reading: [
      "Everything you paste into an AI tool goes somewhere. Before you use Copilot for real work, sort your information into four groups. Public: your website, menu and posted prices. Internal: schedules and process notes. Confidential: customer lists, contracts, pricing strategy and employee details. Regulated: payment card numbers, Social Security numbers, health information, and anything covered by law.",
      "Public and most internal information is usually fine with an approved tool. Confidential information should only go into a tool your business has approved for it, such as Microsoft 365 Copilot under a work account, and only if your settings and policies allow. Regulated information and passwords should never be pasted into a general AI chat.",
      "When you practice or test prompts, replace real details with placeholders: [CUSTOMER NAME], [PHONE], [ACCOUNT #]. Check that nothing identifying is left before you press enter.",
      "Keep a person in charge. Decide which AI outputs need approval before they are used, who approves them, and what to do when AI gets something wrong. Watch for unfair or biased wording, especially in anything about hiring, pricing or customers. Treat every AI result as a draft until a person signs off.",
    ],
    walkthrough: {
      title: "Redacting a customer record before using AI",
      steps: [
        'Start with a made-up complaint: "Hi, this is Dana Lewis, 404-555-0188, card ending 4421. My order 7781 never came."',
        'Replace identifying details: "Hi, this is [CUSTOMER], [PHONE], card ending [REMOVED]. My order [ORDER #] never came."',
        "Check again: is there an email, address or anything else that could identify the person? Remove it.",
        "Now ask Copilot to draft a reply using the redacted version. You fill the real name back in when you send it from your own email.",
        "Notice that Copilot did not need the card number or phone number to write a good reply.",
      ],
      samplePrompt:
        'Draft a short, kind reply to this customer complaint. Do not promise a refund or a date. Complaint: "Hi, this is [CUSTOMER]. My order [ORDER #] never came and I\'m frustrated." End with: we are checking with the carrier and will update you within one business day.',
    },
    assignment: {
      instructions: [
        "Write a one-page AI use policy for your business.",
        "Include: information that is allowed, information that is never allowed, approved tools and accounts, which outputs need approval and by whom, how to report a mistake, and who owns the policy.",
        "Practice redacting one made-up customer message.",
      ],
      deliverable: "A one-page AI use policy and one redacted example.",
    },
    reflection: [
      "What information in your business would cause the most harm if it leaked?",
      "Who should be allowed to use AI tools for work, and with which accounts?",
      "How will someone tell you when an AI-assisted message went wrong?",
    ],
    quiz: [
      {
        question:
          "Which belongs in a general AI demonstration or practice prompt?",
        choices: [
          "A real customer's card number",
          "A made-up customer example with placeholders",
          "Your bank password",
          "An employee's medical record",
        ],
        answer: 1,
        why: "Practice with fictional or redacted examples.",
      },
      {
        question:
          "Which type of information should never be pasted into a general AI chat?",
        choices: [
          "Your posted store hours",
          "Your public menu",
          "Payment card and Social Security numbers",
          "A blog post you already published",
        ],
        answer: 2,
        why: "Regulated and highly sensitive data stays out of general AI tools.",
      },
      {
        question: 'What does "human oversight" mean in an AI workflow?',
        choices: [
          "A person approves important outputs and is responsible for the result",
          "Someone watches the computer screen all day",
          "AI decides and people never check",
          "Turning AI off on weekends",
        ],
        answer: 0,
        why: "A responsible person reviews and owns the decisions AI helps with.",
      },
      {
        question:
          "Before testing a prompt with a real customer message, you should:",
        choices: [
          "Paste it as is to save time",
          "Replace names, phone numbers and account details with placeholders",
          "Add the customer's address so Copilot has context",
          "Ask the customer for their password",
        ],
        answer: 1,
        why: "Redaction protects your customer while still letting Copilot help.",
      },
    ],
  },
  {
    number: 11,
    slug: "repeatable-workflow",
    title: "Build Your Repeatable Workflow",
    outcome:
      "Turn one AI-assisted task into a written step-by-step process you can measure and hand to someone else.",
    trailerTitle: "Build your repeatable workflow",
    reading: [
      "Using Copilot once is helpful. Using it the same way every time is where the real savings come from. That requires a workflow: a written set of steps for a task that anyone on your team could follow.",
      "Map the workflow before adding any automation. What starts it (a new inquiry arrives)? Where does the information come from? What is allowed to go into AI? What does AI do (draft a reply)? What does a person check? Who approves? How is it sent? Where is the result recorded? Write each step as one line.",
      "Run a small pilot. Try your workflow on ten real cases, or twenty, not your whole business. Compare against the baseline you recorded in Lesson 1: minutes per task, mistakes, how many needed escalation, and how customers responded.",
      'Decide what "working" means before you start. For example: "Replies take under 3 minutes instead of 8, with no more mistakes than before." If the pilot meets the goal, keep it and train your team. If not, fix the steps or stop. More text is not success; measured improvement is.',
    ],
    walkthrough: {
      title: "A lead follow-up workflow",
      steps: [
        "Trigger: a new inquiry arrives from your website or phone.",
        "Check: did the person agree to be contacted? If not, stop.",
        "Sort: use your Lesson 5 matrix to decide the type of request.",
        "Draft: use your Lesson 3 prompt card to have Copilot draft a reply. No private details in the prompt.",
        "Verify: check facts, prices and promises against your approved information.",
        "Approve and send from your normal business email or phone.",
        "Record: log the time it took, whether you edited the draft heavily, and the outcome.",
        "Stop rule: if anything is unclear or sensitive, send it to the owner instead.",
      ],
    },
    assignment: {
      instructions: [
        "Write a step-by-step workflow (an SOP) for your pilot task from Lesson 1, using the walkthrough as a model.",
        "Create a scorecard with: baseline minutes per task, pilot minutes per task, number of drafts approved without major edits, mistakes, and escalations.",
        "Run it on at least five made-up or approved real cases and fill in the scorecard.",
      ],
      deliverable: "A written workflow (SOP) and a completed pilot scorecard.",
    },
    reflection: [
      "Which step in your workflow is most likely to be skipped when you are busy?",
      "Who could you hand this workflow to, and what would they need to know first?",
      "What result would make you stop using AI for this task?",
    ],
    quiz: [
      {
        question: "What proves an AI workflow is actually helping?",
        choices: [
          "It produces more text",
          "Measured improvement against your baseline without more mistakes",
          "It feels faster",
          "Review steps are removed",
        ],
        answer: 1,
        why: "Compare real numbers to your baseline, including quality.",
      },
      {
        question:
          "What should you do before adding software or automation to a task?",
        choices: [
          "Write down the workflow steps",
          "Buy the most expensive tool",
          "Remove all approval steps",
          "Automate everything at once",
        ],
        answer: 0,
        why: "A clear process comes first. Tools support the process.",
      },
      {
        question: "What is a good size for a first pilot?",
        choices: [
          "Every customer, starting today",
          "A small number of cases you can review closely",
          "One case, then decide forever",
          "No pilot is needed",
        ],
        answer: 1,
        why: "A small pilot lets you catch problems before they reach everyone.",
      },
      {
        question:
          "Your workflow reaches a sensitive or unclear message. What does the stop rule say?",
        choices: [
          "Let Copilot handle it anyway",
          "Delete it",
          "Send it to the owner or a responsible person",
          "Reply with a template",
        ],
        answer: 2,
        why: "Stop rules keep unclear cases with a person.",
      },
    ],
  },
  {
    number: 12,
    slug: "action-plan-and-completion",
    title: "Capstone: Your 30-Day AI Action Plan",
    outcome:
      "Put everything together in a 30-day plan to start using AI safely and measurably in your business.",
    trailerTitle: "Action plan and completion",
    reading: [
      "You now have the pieces: a task inventory and baseline, a prompt card, templates, a triage matrix, a meeting summary method, a proposal checklist, a reporting habit, a marketing claim check, an AI use policy and a workflow with a scorecard. The capstone turns them into a plan you will actually follow.",
      "Week 1: choose one low-risk task and record your baseline for a full week. Week 2: write and test your prompts and your checking rules on made-up examples. Week 3: try the workflow on approved real cases, write down every problem, and fix the steps. Week 4: run a controlled pilot, fill in your scorecard and decide whether to keep going, change course or stop.",
      "A strong plan names an owner, uses only approved information, includes the prompts you will use, sets a review checkpoint, states a clear goal for time saved and quality, and says when you will stop. A weak plan promises guaranteed profit, skips testing, or has no one responsible.",
      "Completing this course means you can show these decisions, not just that you watched the videos. Submit your plan, and include one honest limitation of AI in your business. Knowing where AI does not fit is as valuable as knowing where it does.",
    ],
    walkthrough: {
      title: "Sample plan: a home cleaning company",
      steps: [
        "Goal: reply to quote requests faster without mistakes in pricing.",
        "Owner: the business owner; the office assistant drafts replies.",
        "Approved information: public price sheet and service list only. No customer addresses in prompts.",
        'Prompts: one quote reply prompt, one follow-up prompt, one "we\'re booked" prompt.',
        "Review checkpoint: the owner approves every reply that mentions a price.",
        "Goal: reply time from 2 hours to 30 minutes; zero pricing errors.",
        "Stop condition: any pricing error sent to a customer pauses the pilot for review.",
      ],
    },
    assignment: {
      instructions: [
        "Write your 30-day plan with: business goal, owner, approved information, three prompts, step-by-step workflow, privacy rules, review checkpoint, quality goal, time-saved goal and stop conditions.",
        "Add one honest limitation of AI in your business.",
        "Submit the plan below. It will be scored on the 20-point rubric.",
      ],
      deliverable:
        "A one-page 30-day AI action plan and a short reflection on one limitation.",
    },
    reflection: [
      "What is the first thing you will do tomorrow to start Week 1?",
      "Who will hold you accountable for finishing the 30 days?",
      "Where will AI not be used in your business, and why?",
    ],
    quiz: [
      {
        question: "Which 30-day plan is strongest?",
        choices: [
          "One that promises guaranteed profit",
          "One with an owner, a baseline, safety steps and clear measures",
          "One that skips testing to save time",
          "One that automates every task in week one",
        ],
        answer: 1,
        why: "Ownership, baseline, safety and measurement make a plan you can trust.",
      },
      {
        question: "What happens in Week 1 of the plan?",
        choices: [
          "Automate the whole business",
          "Pick a low-risk task and record a baseline",
          "Buy new software",
          "Send AI emails to every customer",
        ],
        answer: 1,
        why: "You cannot measure improvement without a starting point.",
      },
      {
        question: "What is a stop condition?",
        choices: [
          "A rule that pauses the pilot if something goes wrong",
          "The time you stop work each day",
          "A Copilot setting",
          "The last lesson of the course",
        ],
        answer: 0,
        why: "Stop conditions protect customers when the pilot misbehaves.",
      },
      {
        question: "How is completion of this course decided?",
        choices: [
          "Watching all the videos",
          "Passing the lesson checks and submitting a capstone plan",
          "Paying for the course",
          'Clicking a "done" button',
        ],
        answer: 1,
        why: "Completion is based on showing your decisions, not just watching.",
      },
    ],
  },
];
