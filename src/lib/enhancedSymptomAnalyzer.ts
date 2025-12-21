import type { CheckInData, SymptomAnalysis } from './symptomAnalyzer'

export async function analyzeWithFullContext(
  _userId: string,
  checkInData: CheckInData,
  userName: string = 'there'
): Promise<SymptomAnalysis> {
  // Stubbed clinical analyzer; reuse lightweight logic for now
  const { analyzeSymptoms } = await import('./symptomAnalyzer')
  return analyzeSymptoms(checkInData, userName)
}




