/**
 * Expanded Health Categories
 * Supports broader health tracking beyond just chronic illness
 */

export const BROAD_CATEGORIES = [
  'Chronic pain or illness',
  'Cancer or major illness', 
  'Fertility or pregnancy', 
  'Sleep issues',
  'Energy or fatigue',
  'Mental health',
  'General wellness',
  'Biohacking',
  'Something else',
] as const;

export const CHRONIC_ILLNESS_SUBCATEGORIES = [
  'Fibromyalgia',
  'CFS / ME',
  'Chronic pain',
  'Migraines',
  'Autoimmune condition',
  'ADHD',
  'Perimenopause',
  'Other / Not sure',
] as const;

export type BroadCategory = typeof BROAD_CATEGORIES[number];
export type ChronicIllnessSubcategory = typeof CHRONIC_ILLNESS_SUBCATEGORIES[number];

// Validation message templates with userName placeholders
export interface ValidationMessage {
  category: BroadCategory;
  specific: ChronicIllnessSubcategory | null;
  title: string;
  message: string;
  buttonText: string;
}

export const VALIDATION_MESSAGES: ValidationMessage[] = [
  {
    category: 'Cancer or major illness',
    specific: null,
    title: "This is a lot. I'm with you, {userName}.",
    message: `I know treatment cycles and uncertainty can take over everything. Here’s how I can help:

What we’ll track together:
- Treatment days vs. recovery days (to protect your rest windows)
- Side effects like nausea, fatigue, neuropathy, sleep changes
- Pain patterns and what gently eases them on hard days
- Hydration, protein, and small walks/stretching when you can

What I won’t do:
- I will never give medical advice. I’ll help you keep a clear record so you and your care team can decide what’s next.

You’re not doing this alone, {userName}. We’ll build a simple, steady rhythm: record the day → notice the pattern → protect what helps. One step at a time.`,
    buttonText: "Let's learn more about you →"
  },
  {
    category: 'Chronic pain or illness',
    specific: 'Fibromyalgia',
    title: 'Fibromyalgia. I get it, {userName}.',
    message: `I've worked with so many people tracking fibro. Here's what I've learned:

Common patterns I see:
- Weather changes trigger flares for most
- Morning pain and stiffness - takes 2-3 hours to loosen up
- Sleep doesn't fix the exhaustion
- Brain fog, sensory sensitivity, "wired and tired" feeling
- "You don't look sick" - the invisible illness struggle

What seems to help some people:
- Better sleep quality (even if it doesn't cure the pain)
- Gentle, consistent movement over intense exercise
- Managing stress (though that's easier said than done)

But here's the thing, {userName}:

You're not them. Your body is different. Your triggers are different. What works for someone else might not work for you.

That's why we're doing this together.

I'm not here to tell you what to do, {userName}. I'm here to help you figure out what works for YOU. Your patterns. Your triggers. Your body.

I know you've been dealing with this for a while. I know it's been hard. But we're going to work it out together.`,
    buttonText: "Let's learn more about you →"
  },
  {
    category: 'Chronic pain or illness',
    specific: 'CFS / ME',
    title: 'CFS/ME. I get it, {userName}.',
    message: `I've seen countless people dealing with CFS. Here's what I've learned:

Common experiences:
- Post-exertional malaise - do too much, body punishes you for days
- Unrefreshing sleep - sleeping 12 hours but waking up more exhausted
- Brain fog that makes words disappear mid-sentence
- Energy management isn't optional - it's survival
- Boom-bust cycles: feeling okay → overdoing it → crash

What seems to help some people:
- Strict pacing (treating energy like a limited budget)
- Resting before you think you need to
- Tracking PEM triggers to avoid them

But here's the thing, {userName}:

Your PEM triggers are different. Your energy limits are different. What crashes one person might be fine for you, or vice versa.

That's why we're doing this together.

I'm not here to tell you to "just pace better," {userName}. I'm here to help you figure out YOUR specific triggers, YOUR energy patterns, YOUR thresholds.

I know you've tried everything. I know doctors haven't believed you. But we're going to work it out together - one day at a time.`,
    buttonText: "Let's learn more about you →"
  },
  {
    category: 'Chronic pain or illness',
    specific: 'Migraines',
    title: 'Migraines. I hear you, {userName}.',
    message: `Migraine days can derail everything. Here's how I can help you track and find patterns:

What we’ll watch:
- Sleep quality and consistency before attacks
- Common triggers: stress spikes, skipped meals, dehydration, bright/light exposure
- Hormone timing (if relevant) and weather changes
- Supplements and meds (e.g., magnesium, triptans) and how effective they feel

Why it matters:
- Even small correlations (sleep window, hydration, screen time) often show up within 2–3 weeks of tracking.

We’ll keep it simple, {userName}. Quick check‑ins → surface the strongest suspected triggers → protect what helps. One step at a time.`,
    buttonText: "Let's learn more about you →"
  },
  {
    category: 'Chronic pain or illness',
    specific: 'Chronic pain',
    title: 'Chronic pain. I get it, {userName}.',
    message: `I've worked with so many people tracking chronic pain. Here's what I've learned:

Common struggles:
- Pain without clear diagnosis - doctors can't find the cause
- Medical gaslighting - "we can't find anything wrong"
- Exhaustion from trying everything
- Pain that changes location, intensity, quality from day to day
- People not believing you because they can't see it

What seems to help some people:
- Identifying their specific triggers (sleep, stress, activity, weather)
- Having data to show doctors who don't believe them
- Finding small patterns in what feels like chaos

But here's the thing, {userName}:

Your pain is unique. Your triggers are unique. What helps someone else might do nothing for you - or even make it worse.

That's why we're doing this together.

I'm not here to tell you "just try yoga" - you've heard that a thousand times. I'm here to help you figure out what actually affects YOUR pain. Not someone else's. Yours.

I know you're exhausted from trying everything. I know you're skeptical. But we're going to work it out together. Your patterns. Your body. Your answers.`,
    buttonText: "Let's learn more about you →"
  },
  {
    category: 'Chronic pain or illness',
    specific: 'Autoimmune condition',
    title: 'Autoimmune condition. I get it, {userName}.',
    message: `I've seen countless people tracking autoimmune conditions. Here's what I've learned:

Common patterns:
- Flares come out of nowhere with no warning
- Inflammation cycles affecting everything - pain, fatigue, brain fog
- Unpredictable symptoms - good days, then suddenly bad days
- Your immune system fighting the wrong battle
- Treatment side effects that sometimes feel worse than symptoms

What seems to help some people:
- Tracking to identify flare triggers (stress, food, sleep, hormones)
- Anti-inflammatory approaches (diet, supplements, sleep)
- Knowing when to push and when to rest

But here's the thing, {userName}:

Your autoimmune condition is different. Your triggers are different. Your flare patterns are unique to you.

That's why we're doing this together.

I'm not here to tell you to "just avoid inflammatory foods," {userName}. I'm here to help you figure out what actually triggers YOUR flares, what YOUR body responds to.

I know autoimmune conditions are unpredictable. I know that's exhausting. But we're going to work it out together - tracking YOUR patterns, YOUR triggers.`,
    buttonText: "Let's learn more about you →"
  },
  {
    category: 'Chronic pain or illness',
    specific: 'ADHD',
    title: 'ADHD. I get it, {userName}.',
    message: `I've worked with so many people with ADHD tracking their health. Here's what I've learned:

Common challenges:
- Executive dysfunction makes tracking incredibly hard
- Forgetting to take meds, forgetting to check in
- Pain or symptoms make ADHD worse - focus goes out the window
- Starting strong, falling off after Day 2 or 3
- Rejection sensitivity when you "fail" at consistency

What seems to help some people:
- External reminders and systems, not willpower
- Making check-ins stupidly short (10 seconds, not 10 minutes)
- Celebrating showing up at all, not perfect consistency

But here's the thing, {userName}:

Your ADHD is different. Your executive function challenges are different. What works for someone else's brain might not work for yours.

That's why we're doing this together.

I'm not here to tell you to "just set a reminder," {userName}. I know it's not that simple. I'm here to help you figure out what actually works for YOUR brain, YOUR patterns, YOUR life.

I know tracking is hard with ADHD, {userName}. The fact you're here at all? That's huge. We're going to make this work. Together.`,
    buttonText: "Let's learn more about you →"
  },
  {
    category: 'Chronic pain or illness',
    specific: 'Perimenopause',
    title: 'Perimenopause. I get it, {userName}.',
    message: `I've seen countless women tracking perimenopause. Here's what I've learned:

Common experiences:
- Hormone chaos - everything becomes unpredictable
- Sleep disruption, joint pain, brain fog, mood swings all at once
- Symptoms dismissed as "just menopause" or "normal aging"
- Hot flashes and night sweats disrupting everything
- Feeling gaslit by doctors who don't take it seriously

What seems to help some people:
- Tracking hormone patterns (when symptoms spike during cycle)
- Better sleep hygiene (though hormones make that hard)
- Magnesium, stress management, gentle movement

But here's the thing, {userName}:

Your perimenopause is different. Your symptoms are different. Your hormone patterns are unique to you.

That's why we're doing this together.

I'm not here to tell you to "just accept it," {userName}. You deserve better than that. I'm here to help you figure out YOUR patterns, YOUR triggers, what actually helps YOU.

I know this is hard. I know you feel dismissed. But we're going to work it out together, {userName} - tracking what YOUR body is doing, not what "most women" experience.`,
    buttonText: "Let's learn more about you →"
  },
  {
    category: 'Chronic pain or illness',
    specific: 'Other / Not sure',
    title: "Not sure what's causing it yet. That's okay, {userName}.",
    message: `I've worked with so many people who don't have a diagnosis yet. Here's what I've learned:

Common experiences:
- Symptoms without a clear name for them
- Doctors saying "we can't find anything wrong"
- Medical gaslighting - "it's probably just stress"
- Desperate for answers, trying everything
- Feeling invalidated because you can't name what's wrong

What matters:
- Your symptoms are real whether they have a diagnosis or not
- Tracking can help you find patterns doctors miss
- Having data helps when doctors don't believe you
- Sometimes patterns reveal what it actually is

But here's the thing, {userName}:

Your body is unique. Your symptoms are unique. We're going to track what's actually happening for YOU, not what fits into a diagnostic box.

That's why we're doing this together.

I'm not here to diagnose you, {userName}. I'm here to help you track YOUR patterns, YOUR triggers, YOUR symptoms - so you can figure out what's actually going on.

I know it's frustrating not having answers. I know doctors haven't been helpful. But we're going to work it out together, {userName}. Building YOUR record. Finding YOUR patterns.`,
    buttonText: "Let's learn more about you →"
  },
  {
    category: 'Fertility or pregnancy',
    specific: null,
    title: 'Trying to conceive. I get it, {userName}.',
    message: `I've worked with so many people tracking fertility patterns. Here's what I've learned:

Common challenges:
- Timing everything perfectly feels overwhelming
- Symptom spotting can drive you crazy
- Every cycle that doesn't work feels devastating
- Tracking feels clinical when it should feel hopeful

What seems to help some people:
- Tracking patterns over 3-4 cycles to understand YOUR body
- Sleep, stress, mood - they all affect fertility
- Having data to show doctors when seeking help

But here's the thing, {userName}:

Your cycle is unique. Your body is unique. What works for someone else might not work for you.

That's why we're doing this together.

I'm not here to tell you to "just relax," {userName}. I'm here to help you figure out YOUR patterns, YOUR optimal timing, what YOUR body responds to.

I know this journey is hard. I know every negative test hurts. But we're going to work it out together, {userName}.`,
    buttonText: "Let's learn more about you →"
  },
  {
    category: 'Sleep issues',
    specific: null,
    title: 'Sleep issues. I get it, {userName}.',
    message: `I've worked with so many people trying to optimize their sleep. Here's what I've learned:

Common struggles:
- Can't fall asleep, can't stay asleep, or both
- Waking up exhausted even after 8+ hours
- Sleep affecting everything else - mood, energy, focus
- Tried everything, nothing consistently works

What seems to help some people:
- Tracking sleep alongside stress, exercise, meals
- Finding YOUR optimal sleep window (not just "8 hours")
- Identifying what disrupts YOUR sleep specifically

But here's the thing:

Your sleep patterns are unique. What helps someone else might not work for you.

That's why we're doing this together.

I'm not here to tell you to "avoid screens" - you've heard that. I'm here to help you figure out what actually affects YOUR sleep.

I know poor sleep is exhausting. But we're going to work it out together.`,
    buttonText: "Let's learn more about you →"
  },
  {
    category: 'Energy or fatigue',
    specific: null,
    title: 'Energy or fatigue. I get it, {userName}.',
    message: `I've worked with so many people tracking energy levels. Here's what I've learned:

Common struggles:
- Exhaustion that rest doesn't fix
- Energy crashes at unpredictable times
- Caffeine doesn't help anymore (or makes it worse)
- Can't figure out what's draining you
- Tired all the time, but can't sleep well

What seems to help some people:
- Tracking energy alongside sleep, stress, food, activity
- Finding YOUR energy patterns (morning person vs night person)
- Identifying what gives YOU energy vs what drains it

But here's the thing, {userName}:

Your energy patterns are unique. What energizes someone else might drain you, or vice versa.

That's why we're doing this together.

I'm not here to tell you to "just exercise more," {userName}. I'm here to help you figure out what actually affects YOUR energy levels.

I know being tired all the time is exhausting. But we're going to work it out together, {userName}.`,
    buttonText: "Let's learn more about you →"
  },
  {
    category: 'Mental health',
    specific: null,
    title: 'Mental health. I get it, {userName}.',
    message: `I've worked with so many people tracking mental health patterns. Here's what I've learned:

Common challenges:
- Mood swings that feel unpredictable
- Anxiety or depression affecting everything
- Hard to tell what triggers bad days
- Some days you're fine, some days you're not
- Trying to understand what helps vs what doesn't

What seems to help some people:
- Tracking mood alongside sleep, stress, social activity
- Finding YOUR specific triggers (they're different for everyone)
- Seeing patterns that aren't obvious day-to-day

But here's the thing:

Your mental health patterns are unique. What helps someone else might not work for you.

That's why we're doing this together.

I'm not here to tell you to "think positive" - you've heard that. I'm here to help you figure out what actually affects YOUR mood, YOUR anxiety, YOUR wellbeing.

I know mental health is hard. But we're going to work it out together.`,
    buttonText: "Let's learn more about you →"
  },
  {
    category: 'General wellness',
    specific: null,
    title: 'General wellness. I get it, {userName}.',
    message: `You're here to understand your body better - not because something's broken, but because you want to optimize.

Common goals:
- Understanding what affects energy, mood, focus
- Finding what works for YOUR body (not generic advice)
- Spotting patterns before small issues become big ones
- Data-driven health optimization

What seems to help:
- Tracking consistently to see patterns
- Looking at correlations (sleep, exercise, stress, nutrition)
- Small experiments to see what moves the needle

But here's the thing, {userName}:

Your body is unique. Your patterns are unique. What optimizes someone else might not work for you.

That's why we're doing this together.

I'm here to help you figure out what actually affects YOUR energy, YOUR mood, YOUR performance, {userName}. Not generic wellness advice.

Let's figure out what works for YOU.`,
    buttonText: "Let's learn more about you →"
  },
  {
    category: 'Biohacking',
    specific: null,
    title: 'Biohacking. I get it, {userName}.',
    message: `You're here to optimize performance - not just feel "fine," but peak.

Common goals:
- Experimenting with supplements, protocols, interventions
- Tracking metrics most people don't even think about
- Finding marginal gains that compound over time
- Data-driven approach to human performance
- Pushing beyond "normal" into optimal

What I've learned:
- N=1 experiments are everything - what works for Huberman might not work for you
- Tracking is how you know what's signal vs noise
- Small improvements compound over time

But here's the thing, {userName}:

Your biology is unique. Your response to interventions is unique. What optimizes someone else might do nothing for you - or even backfire.

That's why we're doing this together.

I'm here to help you run YOUR experiments, track YOUR data, find what actually moves the needle for YOU, {userName}. Not generic biohacking protocols.

Let's figure out what optimizes YOUR performance.`,
    buttonText: "Let's learn more about you →"
  },
  {
    category: 'Something else',
    specific: null,
    title: "Something else. That's okay, {userName}.",
    message: `You don't have to fit into a category. You're here for your own reasons, and that's completely valid.

What matters is that you want to understand your body better - your patterns, your triggers, what actually affects how you feel.

I'll help you track whatever you're tracking - health, symptoms, habits, experiments, anything.

But here's the thing, {userName}:

Your body is unique. Your patterns are unique. What you're tracking might not fit a standard category, and that's fine.

That's why we're doing this together.

I'm here to help you figure out what actually matters for YOU, {userName}. Whatever that is.

Let's track YOUR patterns and find YOUR answers.`,
    buttonText: "Let's learn more about you →"
  }
];

/**
 * Get validation message with userName replacement and symptom references
 */
export function getValidationMessage(
  category: BroadCategory,
  specific: ChronicIllnessSubcategory | null,
  userName: string,
  checkInData?: {
    pain: number | null;
    mood: number | null;
    sleep: number | null;
    symptoms?: string[] | null;
    pain_locations?: string[] | null;
    pain_types?: string[] | null;
    custom_symptoms?: string[] | null;
  }
): ValidationMessage {
  const template = VALIDATION_MESSAGES.find(m => 
    m.category === category && m.specific === specific
  );
  
  if (!template) {
    // Fallback message
    return {
      category: 'Something else',
      specific: null,
      title: `That's okay, ${userName}.`,
      message: `I'm here to help you track whatever you're tracking, ${userName}. Let's figure out YOUR patterns and find YOUR answers.`,
      buttonText: "Let's learn more about you →"
    };
  }

  // Generate personalized symptom reference
  const symptomReference = generateSymptomReference(checkInData, userName);
  
  // Replace {userName} placeholders and add symptom reference
  let personalizedMessage = template.message.replace(/{userName}/g, userName);
  
  // Add symptom reference at the beginning if we have check-in data
  if (checkInData && symptomReference) {
    personalizedMessage = `${symptomReference}\n\n${personalizedMessage}`;
  }
  
  return {
    ...template,
    title: template.title.replace(/{userName}/g, userName),
    message: personalizedMessage,
  };
}

/**
 * Generate personalized symptom reference based on check-in data
 */
function generateSymptomReference(
  checkInData?: {
    pain: number | null;
    mood: number | null;
    sleep: number | null;
    symptoms?: string[] | null;
    pain_locations?: string[] | null;
    pain_types?: string[] | null;
    custom_symptoms?: string[] | null;
  },
  userName?: string
): string {
  if (!checkInData || !userName) return '';

  const { pain, mood, sleep, symptoms, pain_locations, pain_types, custom_symptoms } = checkInData;
  
  // Collect all symptoms and pain info
  const allSymptoms = [
    ...(symptoms || []),
    ...(pain_locations || []),
    ...(pain_types || []),
    ...(custom_symptoms || [])
  ].filter(Boolean);

  // Build personalized reference
  let reference = `Oh ${userName}, I'm really sorry to hear about`;
  
  // Add specific symptoms if available
  if (allSymptoms.length > 0) {
    const symptomText = allSymptoms.length === 1 
      ? allSymptoms[0] 
      : allSymptoms.length === 2 
        ? `${allSymptoms[0]} and ${allSymptoms[1]}`
        : `${allSymptoms.slice(0, -1).join(', ')}, and ${allSymptoms[allSymptoms.length - 1]}`;
    
    reference += ` your ${symptomText}`;
  } else if (pain !== null && pain >= 6) {
    reference += ` the pain you're dealing with`;
  } else {
    reference += ` what you're going through`;
  }

  // Add pain score reference
  if (pain !== null) {
    reference += `, and I can see your pain is at ${pain}/10 today`;
    
    if (pain >= 8) {
      reference += " - that's really severe";
    } else if (pain >= 6) {
      reference += " - that's definitely challenging";
    } else if (pain >= 4) {
      reference += " - managing, but not easy";
    }
  }

  // Add mood/sleep context if relevant
  if (mood !== null && mood <= 3) {
    reference += ". I can also see your mood is quite low today";
  } else if (sleep !== null && sleep <= 3) {
    reference += ". And I notice your sleep wasn't great either";
  }

  reference += '.';
  
  return reference;
}
