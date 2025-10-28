import { getGreeting, getPainToneLine, getMoodLine, getSleepImpactLine, shouldUseStrongPraise, getWelcomeLine } from "../src/lib/email/messaging-rules";
import { renderDailyEmailTemplate } from "../src/lib/email/templates/dailyEmailTemplate";

type Scenario =
  | { name: string; data: { pain: number; mood: number; sleep: number }; expectedTone: string }
  | { name: string; data: null; expectedTone: string }
  | { name: string; magicStreak: number; expectedTone: string };

const testScenarios: Scenario[] = [
  {
    name: "High pain day",
    data: { pain: 8, mood: 3, sleep: 4 },
    expectedTone: "Sympathetic, validating",
  },
  {
    name: "Good day",
    data: { pain: 2, mood: 8, sleep: 8 },
    expectedTone: "Encouraging but not over-the-top",
  },
  {
    name: "Mixed signals",
    data: { pain: 6, mood: 7, sleep: 5 },
    expectedTone: "Neutral, curious",
  },
  {
    name: "No previous data (Day 1)",
    data: null,
    expectedTone: "Welcoming, no comparison",
  },
  {
    name: "3 consecutive magic days",
    magicStreak: 3,
    expectedTone: "Gentle nudge included",
  },
];

function scenarioToHtml(s: Scenario, userName = "Ben"): string {
  if ("data" in s && s.data === null) {
    const greeting = `Hey ${userName} 👋`;
    const painTone = "";
    const moodLine = "";
    const sleepLine = "";
    const insight = getWelcomeLine(userName);
    return renderDailyEmailTemplate({
      userName,
      greeting,
      painToneLine: painTone,
      moodLine,
      sleepImpactLine: sleepLine,
      insightLine: insight,
      strongPraise: false,
    });
  }

  if ("magicStreak" in s) {
    const pain = 2;
    const mood = 7;
    const sleep = 7;
    const greeting = getGreeting(userName, pain);
    const painTone = getPainToneLine(pain);
    const moodLine = getMoodLine(mood);
    const sleepLine = getSleepImpactLine(sleep);
    const strongPraise = shouldUseStrongPraise([10, mood, sleep]);
    const insight = `You've tapped the magic button ${s.magicStreak} days in a row — if it's helping, let's note what you did differently.`;
    return renderDailyEmailTemplate({
      userName,
      greeting,
      painToneLine: painTone,
      moodLine,
      sleepImpactLine: sleepLine,
      insightLine: insight,
      strongPraise,
    });
  }

  const { pain, mood, sleep } = (s as Extract<Scenario, { data: { pain: number } }>).data;
  const greeting = getGreeting(userName, pain);
  const painTone = getPainToneLine(pain);
  const moodLine = getMoodLine(mood);
  const sleepLine = getSleepImpactLine(sleep);
  const strongPraise = shouldUseStrongPraise([10, mood, sleep]);
  const insight = ""; // leave blank for template-only preview
  return renderDailyEmailTemplate({
    userName,
    greeting,
    painToneLine: painTone,
    moodLine,
    sleepImpactLine: sleepLine,
    insightLine: insight,
    strongPraise,
  });
}

export function renderAllScenarioHtml(): { name: string; expectedTone: string; html: string }[] {
  return testScenarios.map((s) => ({
    name: s.name,
    expectedTone: (s as any).expectedTone,
    html: scenarioToHtml(s),
  }));
}

// If executed directly (ts-node or tsx), print minimal markers so Ben can copy/open HTML
if (require.main === module) {
  const outputs = renderAllScenarioHtml();
  for (const o of outputs) {
    console.log(`=== ${o.name} (${o.expectedTone}) ===`);
    console.log(o.html);
    console.log("\n\n");
  }
}


