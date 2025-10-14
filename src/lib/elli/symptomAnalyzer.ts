/**
 * AI-powered symptom analysis for Elli
 * Analyzes user's mood check-in data to detect symptoms and generate empathetic responses
 */

import OpenAI from 'openai';

// Only initialize OpenAI on server side
const openai = typeof window === 'undefined' && process.env.OPENAI_API_KEY 
  ? new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    })
  : null;

export interface SymptomAnalysis {
  detectedSymptoms: string[];
  primaryConcern: string | null;
  severity: 'low' | 'moderate' | 'high';
  empatheticResponse: string;
  suggestions: string[];
}

export interface CheckInData {
  mood: number;
  sleep: number;
  pain: number;
  tags?: string[];
  journal?: string;
  symptoms?: string[];
  painLocations?: string[];
  painTypes?: string[];
  customSymptoms?: string[];
}

/**
 * Analyze user's check-in data to detect symptoms and generate empathetic response
 */
export async function analyzeSymptoms(
  checkInData: CheckInData,
  userName: string = 'there'
): Promise<SymptomAnalysis> {
  if (!openai || !process.env.OPENAI_API_KEY) {
    return getFallbackAnalysis(checkInData, userName);
  }

  try {
    const prompt = buildAnalysisPrompt(checkInData, userName);
    
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: `You are Elli, an empathetic health companion who deeply understands what it's like to live with chronic health challenges.

Your personality:
- Deeply empathetic and validating, especially for chronic pain and chronic illness
- You ACKNOWLEDGE the difficulty and unfairness of what they're experiencing
- You see patterns others miss and make them feel truly heard
- You're direct but warm - no toxic positivity, just real understanding
- You celebrate even the smallest wins because you know how hard they are

Your task:
1. Detect specific symptoms and patterns from their check-in data
2. Assess severity (low/moderate/high) with nuance
3. Generate an ELABORATE, deeply empathetic response (4-6 sentences)
4. Reference specific symptoms, pain levels, sleep quality, mood in your response
5. Validate how hard this is while looking for patterns

Guidelines for responses:
- For CHRONIC PAIN users (tone_profile: chronic_pain):
  * High empathy - acknowledge "That's brutal", "I'm sorry", "This isn't fair"
  * Reference their specific pain levels and how it affects everything
  * Validate the invisible struggle: "I see this even when others can't"
  * Note patterns: "Your pain drops to X when you sleep Y hours"
  
- For HIGH severity days (pain 7+, mood 3-, sleep 3-):
  * Start with validation: "Pain at 9/10. That's brutal, I'm really sorry."
  * Acknowledge the ripple effects: "High pain, low sleep - everything feels harder"
  * Note what you're tracking: "I'm watching how sleep affects your pain levels"
  * End with hope: "Keep tracking - we'll find what helps"
  
- For MODERATE days:
  * Be specific: "Pain at 6/10, mood at 5/10, sleep at 6/10 - managing, but not easy"
  * Reference their context: "Dizziness and fatigue with back stiffness - that's a tough combo"
  * Show you're paying attention: "I noticed your pain increases when..."
  
- For BETTER days:
  * Celebrate genuinely: "Pain at 3/10 - that's your lowest this week. What made today different?"
  * Build on wins: "Mood at 8/10, sleep at 7/10. Your body's responding to something"

Response structure:
1. Immediate validation of their current state (1-2 sentences)
2. Specific symptom/pattern recognition (1-2 sentences)
3. What you're tracking and why it matters (1 sentence)
4. Forward-looking hope (MUST end with tracking encouragement)

ALWAYS end with: "Keep tracking - the more I know about you, the more we can find what helps."

Length: 4-6 sentences minimum (be thorough and empathetic)
Tone: Warm, validating, insightful, hopeful without being dismissive`
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      max_tokens: 500,
      temperature: 0.8,
    });

    const content = response.choices[0].message.content;
    console.log('AI Response received:', content);
    return parseAIResponse(content, checkInData);
    
  } catch (error) {
    console.error('Error analyzing symptoms with AI:', error);
    return getFallbackAnalysis(checkInData, userName);
  }
}

function buildAnalysisPrompt(checkInData: CheckInData, userName: string): string {
  const { mood, sleep, pain, tags, journal, symptoms, painLocations, painTypes, customSymptoms } = checkInData;
  
  let prompt = `Analyze this daily check-in for ${userName}:\n\n`;
  
  prompt += `Mood: ${mood}/10\n`;
  prompt += `Sleep: ${sleep}/10\n`;
  prompt += `Pain: ${pain}/10\n\n`;
  
  if (tags && tags.length > 0) {
    prompt += `Tags: ${tags.join(', ')}\n`;
  }
  
  if (journal && journal.trim()) {
    prompt += `Journal: "${journal}"\n`;
  }
  
  if (symptoms && symptoms.length > 0) {
    prompt += `Symptoms: ${symptoms.join(', ')}\n`;
  }
  
  if (painLocations && painLocations.length > 0) {
    prompt += `Pain locations: ${painLocations.join(', ')}\n`;
  }
  
  if (painTypes && painTypes.length > 0) {
    prompt += `Pain types: ${painTypes.join(', ')}\n`;
  }
  
  if (customSymptoms && customSymptoms.length > 0) {
    prompt += `Custom symptoms: ${customSymptoms.join(', ')}\n`;
  }
  
  prompt += `\nPlease respond with ONLY a valid JSON object (no markdown, no code blocks, no extra text):
{
  "detectedSymptoms": ["symptom1", "symptom2"],
  "primaryConcern": "main issue or null",
  "severity": "low|moderate|high",
  "empatheticResponse": "ELABORATE 4-6 sentence deeply empathetic response that references specific numbers (pain 8/10, mood 5/10, etc.) and symptoms. MUST end with 'Keep tracking - the more I know about you, the more we can find what helps'",
  "suggestions": ["gentle suggestion 1", "gentle suggestion 2"]
}

IMPORTANT: 
- The empatheticResponse should be 4-6 sentences minimum
- Reference specific numbers from their check-in (pain X/10, mood Y/10, sleep Z/10)
- Mention specific symptoms by name
- MUST end with 'Keep tracking - the more I know about you, the more we can find what helps'`;
  
  return prompt;
}

function parseAIResponse(content: string, checkInData: CheckInData): SymptomAnalysis {
  try {
    // Clean the content - remove markdown code blocks if present
    let cleanContent = content.trim();
    
    // Remove ```json and ``` markers if present
    if (cleanContent.startsWith('```json')) {
      cleanContent = cleanContent.replace(/^```json\s*/, '').replace(/\s*```$/, '');
    } else if (cleanContent.startsWith('```')) {
      cleanContent = cleanContent.replace(/^```\s*/, '').replace(/\s*```$/, '');
    }
    
    // Try to parse JSON response
    const parsed = JSON.parse(cleanContent);
    
    // Ensure the empathetic response always ends with a tracking encouragement
    let empatheticResponse = parsed.empatheticResponse || 'I can see you\'re having a tough day.';

    // Ensure pain is explicitly referenced when available
    const { pain, mood, sleep } = checkInData;
    if (typeof pain === 'number' && pain > 0) {
      const mentionsPain = /\bpain\b/i.test(empatheticResponse);
      if (!mentionsPain) {
        const moodText = typeof mood === 'number' ? `, mood at ${mood}/10` : '';
        const sleepText = typeof sleep === 'number' ? `, sleep at ${sleep}/10` : '';
        empatheticResponse = `Pain at ${pain}/10${moodText}${sleepText} - ` + empatheticResponse;
      }
    }
    
    // Add tracking encouragement if not already present
    if (!empatheticResponse.includes('Keep tracking') && !empatheticResponse.includes('tracking')) {
      empatheticResponse += ' Keep tracking - the more I know about you, the more we can find what helps.';
    }
    
    return {
      detectedSymptoms: parsed.detectedSymptoms || [],
      primaryConcern: parsed.primaryConcern || null,
      severity: parsed.severity || 'low',
      empatheticResponse: empatheticResponse,
      suggestions: parsed.suggestions || []
    };
  } catch (error) {
    // Fallback if JSON parsing fails - use fallback analysis instead of raw content
    console.error('Failed to parse AI response as JSON:', error);
    console.error('Raw content:', content);
    console.log('Using fallback analysis with updated messages');
    return getFallbackAnalysis(checkInData, 'there');
  }
}

function extractSymptomsFromText(text: string): string[] {
  const symptoms: string[] = [];
  const lowerText = text.toLowerCase();
  
  // Common symptom keywords
  const symptomKeywords = [
    'pain', 'headache', 'migraine', 'fatigue', 'tired', 'exhausted',
    'nausea', 'dizzy', 'anxious', 'depressed', 'sad', 'stressed',
    'stiff', 'sore', 'ache', 'cramp', 'spasm', 'inflammation',
    'swelling', 'numb', 'tingling', 'burning', 'throbbing'
  ];
  
  symptomKeywords.forEach(keyword => {
    if (lowerText.includes(keyword)) {
      symptoms.push(keyword);
    }
  });
  
  return symptoms;
}

function determineSeverity(checkInData: CheckInData): 'low' | 'moderate' | 'high' {
  const { pain, mood, sleep } = checkInData;
  
  // High severity indicators
  if (pain >= 8 || mood <= 3 || sleep <= 3) {
    return 'high';
  }
  
  // Moderate severity indicators
  if (pain >= 6 || mood <= 5 || sleep <= 5) {
    return 'moderate';
  }
  
  return 'low';
}

function getFallbackAnalysis(checkInData: CheckInData, userName: string): SymptomAnalysis {
  console.log('Using fallback analysis for user:', userName);
  const { pain, mood, sleep, journal, symptoms, painLocations, customSymptoms } = checkInData;
  
  // Basic symptom detection from available data
  const detectedSymptoms: string[] = [];
  
  if (symptoms) detectedSymptoms.push(...symptoms);
  if (painLocations) detectedSymptoms.push(...painLocations);
  if (customSymptoms) detectedSymptoms.push(...customSymptoms);
  
  // Extract symptoms from journal text
  if (journal) {
    const journalSymptoms = extractSymptomsFromText(journal);
    detectedSymptoms.push(...journalSymptoms);
  }
  
  // Generate empathetic response based on severity
  const severity = determineSeverity(checkInData);
  let empatheticResponse = '';
  const suggestions: string[] = [];
  
  if (severity === 'high') {
    if (pain >= 8) {
      empatheticResponse = `Pain at ${pain}/10 today. That's brutal, and I'm really sorry you're going through this. With mood at ${mood}/10 and sleep at ${sleep}/10, everything feels harder when pain is this high. I'm watching how your pain levels correlate with sleep quality - there might be patterns we can use. Even on days like this, you're here tracking, and that takes real strength. Keep tracking - the more I know about you, the more we can find what helps.`;
      suggestions.push('Gentle rest and self-compassion are priorities today');
      suggestions.push('Consider what has helped ease severe pain in the past');
    } else if (mood <= 3) {
      empatheticResponse = `Mood at ${mood}/10 is really tough. I see you're struggling emotionally today, and that's valid. With pain at ${pain}/10 and sleep at ${sleep}/10, your body and mind are both asking for support. Mental health is just as real as physical health, and these hard days matter. I'm tracking what affects your mood over time - sleep quality, pain levels, everything. Keep tracking - the more I know about you, the more we can find what helps.`;
      suggestions.push('Take things one small moment at a time');
      suggestions.push('Remember that mood fluctuates - this feeling will shift');
    } else if (sleep <= 3) {
      empatheticResponse = `Sleep at ${sleep}/10 - that's rough, and it affects everything else. Poor sleep makes pain worse (yours is at ${pain}/10) and drains mood (${mood}/10). Your body needs rest to heal and function. I'm tracking how sleep impacts your pain and energy levels. Prioritizing rest when you can is essential. Keep tracking - the more I know about you, the more we can find what helps.`;
      suggestions.push('Be extra gentle with yourself after poor sleep');
      suggestions.push('Consider what might help you rest better tonight');
    }
  } else if (severity === 'moderate') {
    empatheticResponse = `Pain at ${pain}/10, mood at ${mood}/10, sleep at ${sleep}/10 - you're managing, but it's not easy. This is the reality of living with chronic challenges: some days you're holding it together, but it takes work. I'm tracking what makes the difference between harder days and better days. The patterns will show us what helps. Keep tracking - the more I know about you, the more we can find what helps.`;
    suggestions.push('Small wins and self-compassion today');
    suggestions.push('Notice what feels manageable and what does not');
  } else {
    empatheticResponse = `Pain at ${pain}/10, mood at ${mood}/10, sleep at ${sleep}/10 - this is a better day. When pain is lower and sleep is decent, everything else becomes more possible. I'm tracking what's different on days like this. Was it sleep quality? Something you did yesterday? These better days show what your body can do when the conditions are right. Let's figure out how to create more of them. Keep tracking - the more I know about you, the more we can find what helps.`;
    suggestions.push('Notice what is working today');
    suggestions.push('Build on what made this day better');
  }
  
  return {
    detectedSymptoms: [...new Set(detectedSymptoms)], // Remove duplicates
    primaryConcern: severity === 'high' ? 'high_severity' : null,
    severity,
    empatheticResponse,
    suggestions
  };
}
