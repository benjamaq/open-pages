export type Chip = {
  slug: string;
  label: string;
  icon?: string;
  category: 
    | 'expressive' | 'expressive_high' | 'expressive_low' | 'expressive_neutral' | 'sleep' | 'stress' | 'training' | 'nutrition'
    | 'meds' | 'pain' | 'illness' | 'hormones' | 'environment'
    | 'work' | 'biohacker' | 'parenting' | 'digestive' | 'other';
  sentiment?: 'good' | 'neutral' | 'bad';
};

export const CHIP_CATALOG: Chip[] = [
  // Expressive - High Energy (feeling great, powerful, unstoppable)
  { slug: 'on_top_world', label: 'On top of the world', icon: '🚀', category: 'expressive_high', sentiment: 'good' },
  { slug: 'high_as_a_kite', label: 'High as a kite', icon: '🌈', category: 'expressive_high', sentiment: 'good' },
  { slug: 'unstoppable', label: 'Unstoppable', icon: '🔥', category: 'expressive_high', sentiment: 'good' },
  { slug: 'main_character', label: 'Main character energy', icon: '⚡', category: 'expressive_high', sentiment: 'good' },
  { slug: 'dialed_in', label: '⚡ Dialed in', icon: '⚡', category: 'expressive_high', sentiment: 'good' },
  { slug: 'peaking', label: 'Peaking', icon: '🏔️', category: 'expressive_high', sentiment: 'good' },
  { slug: 'laser_focused', label: 'Laser-focused', icon: '🔦', category: 'expressive_high', sentiment: 'good' },
  { slug: 'flow_state', label: 'Flow state', icon: '🌊', category: 'expressive_high', sentiment: 'good' },
  { slug: 'bulletproof', label: 'Bulletproof', icon: '🛡️', category: 'expressive_high', sentiment: 'good' },
  { slug: 'angel_sky', label: 'Angel in the sky', icon: '👼', category: 'expressive_high', sentiment: 'good' },
  { slug: 'renegade_mode', label: 'Renegade mode', icon: '🤘', category: 'expressive_high', sentiment: 'good' },
  { slug: 'quietly_powerful', label: 'Quietly powerful', icon: '💎', category: 'expressive_high', sentiment: 'good' },
  { slug: 'crisp_clear', label: 'Crisp and clear', icon: '✨', category: 'expressive_high', sentiment: 'good' },
  { slug: 'climbing', label: 'Climbing', icon: '⛰️', category: 'expressive_high', sentiment: 'good' },

  // Expressive - Low Energy (struggling, tired, broken)
  { slug: 'train_wreck', label: 'Train wreck', icon: '🧯', category: 'expressive_low', sentiment: 'bad' },
  { slug: 'completely_cooked', label: 'Completely cooked', icon: '🧟', category: 'expressive_low', sentiment: 'bad' },
  { slug: 'in_the_bin', label: 'In the bin', icon: '🕳️', category: 'expressive_low', sentiment: 'bad' },
  { slug: 'absolutely_broken', label: 'Absolutely broken', icon: '💥', category: 'expressive_low', sentiment: 'bad' },
  { slug: 'fucking_broken', label: 'f—ing broken', icon: '💥', category: 'expressive_low', sentiment: 'bad' },
  { slug: 'running_on_fumes', label: 'Running on fumes', icon: '⛽', category: 'expressive_low', sentiment: 'bad' },
  { slug: 'under_slept', label: 'Under-slept', icon: '😴', category: 'expressive_low', sentiment: 'bad' },
  { slug: 'wired_tired', label: 'Wired & tired', icon: '⚡', category: 'expressive_low', sentiment: 'bad' },
  { slug: 'foggy', label: 'Foggy', icon: '🌫️', category: 'expressive_low', sentiment: 'bad' },
  { slug: 'glassy_eyed', label: 'Glassy-eyed', icon: '👁️', category: 'expressive_low', sentiment: 'bad' },
  { slug: 'low_slow', label: 'Low and slow', icon: '🐌', category: 'expressive_low', sentiment: 'bad' },
  { slug: 'overcaffeinated', label: 'Overcaffeinated', icon: '☕', category: 'expressive_low', sentiment: 'bad' },
  { slug: 'walking_storm_cloud', label: '🌧️ Walking storm cloud', icon: '🌧️', category: 'expressive_low', sentiment: 'bad' },
  { slug: 'spinning_plates', label: '🤹 Spinning too many plates', icon: '🤹', category: 'expressive_low', sentiment: 'bad' },
  { slug: 'restart_required', label: '🔄 Restart required', icon: '🔄', category: 'expressive_low', sentiment: 'bad' },
  { slug: 'melted_managing', label: '🫠 Melted but managing', icon: '🫠', category: 'expressive_low', sentiment: 'bad' },

  // Expressive - Neutral/Steady (baseline, steady, managing)
  { slug: 'solid_baseline', label: 'Solid baseline', icon: '📊', category: 'expressive_neutral', sentiment: 'good' },
  { slug: 'back_online', label: 'Back online', icon: '💻', category: 'expressive_neutral', sentiment: 'good' },
  { slug: 'calm_steady', label: 'Calm & steady', icon: '🧘', category: 'expressive_neutral', sentiment: 'good' },
  { slug: 'cruising', label: 'Cruising', icon: '🚗', category: 'expressive_neutral', sentiment: 'good' },
  { slug: 'chill_unbothered', label: '🧊 Chill & unbothered', icon: '🧊', category: 'expressive_neutral', sentiment: 'good' },
  { slug: 'slow_steady', label: '🐢 Slow but steady', icon: '🐢', category: 'expressive_neutral', sentiment: 'neutral' },
  { slug: 'quietly_optimistic', label: '🌤️ Quietly optimistic', icon: '🌤️', category: 'expressive_neutral', sentiment: 'good' },
  { slug: 'tired_but_trying', label: 'Tired but trying', icon: '💪', category: 'expressive_neutral', sentiment: 'neutral' },
  { slug: 'bit_wonky', label: 'A bit wonky', icon: '🤪', category: 'expressive_neutral', sentiment: 'neutral' },
  { slug: 'slow_burn', label: 'Slow burn', icon: '🔥', category: 'expressive_neutral', sentiment: 'neutral' },
  { slug: 'bit_spicy', label: 'A bit spicy', icon: '🌶️', category: 'expressive_neutral', sentiment: 'neutral' },
  { slug: 'resetting', label: 'Resetting', icon: '🔄', category: 'expressive_neutral', sentiment: 'neutral' },
  { slug: 'rebuilding', label: 'Rebuilding', icon: '🏗️', category: 'expressive_neutral', sentiment: 'neutral' },
  { slug: 'bit_sore', label: 'A bit sore', icon: '😣', category: 'expressive_neutral', sentiment: 'bad' },

  // Sleep
  { slug: 'good_sleep', label: 'Good sleep', icon: '😴', category: 'sleep', sentiment: 'good' },
  { slug: 'poor_sleep', label: 'Rough sleep', icon: '😵‍💫', category: 'sleep', sentiment: 'bad' },
  { slug: 'insomnia', label: 'Insomnia', icon: '🌙', category: 'sleep', sentiment: 'bad' },
  { slug: 'early_wake', label: 'Early wake', icon: '⏰', category: 'sleep', sentiment: 'neutral' },
  { slug: 'nap_day', label: 'Napped', icon: '💤', category: 'sleep', sentiment: 'neutral' },
  { slug: 'newborn_night', label: 'Newborn night', icon: '🍼', category: 'sleep', sentiment: 'bad' },
  { slug: 'late_bed', label: 'Late to bed', icon: '🌓', category: 'sleep', sentiment: 'bad' },
  { slug: 'jet_lag', label: 'Jet lag', icon: '✈️', category: 'sleep', sentiment: 'bad' },
  { slug: 'night_shift', label: 'Night shift', icon: '🧱', category: 'sleep', sentiment: 'bad' },

  // Stress / Mood Context
  { slug: 'high_stress', label: 'High stress', icon: '🔥', category: 'stress', sentiment: 'bad' },
  { slug: 'calm_day', label: 'Calm day', icon: '🧊', category: 'stress', sentiment: 'good' },
  { slug: 'social_battery_low', label: 'Social battery low', icon: '⚡', category: 'stress', sentiment: 'bad' },
  { slug: 'brain_fog', label: 'Brain fog', icon: '🌫️', category: 'stress', sentiment: 'bad' },
  { slug: 'breathwork', label: 'Breathwork', icon: '🫁', category: 'stress', sentiment: 'good' },
  { slug: 'therapy_session', label: 'Therapy session', icon: '🧠', category: 'stress', sentiment: 'good' },
  { slug: 'win_day', label: 'Big win', icon: '🏆', category: 'stress', sentiment: 'good' },
  { slug: 'tough_news', label: 'Tough news', icon: '💔', category: 'stress', sentiment: 'bad' },

  // Training / Recovery
  { slug: 'zone2', label: 'Zone 2', icon: '🚶', category: 'training', sentiment: 'good' },
  { slug: 'hiit', label: 'HIIT', icon: '🏃‍♂️', category: 'training', sentiment: 'neutral' },
  { slug: 'heavy_lift', label: 'Heavy lift', icon: '🏋️', category: 'training', sentiment: 'neutral' },
  { slug: 'pr_day', label: 'PR day', icon: '🥇', category: 'training', sentiment: 'good' },
  { slug: 'long_run', label: 'Long run', icon: '🏃', category: 'training', sentiment: 'neutral' },
  { slug: 'deload', label: 'Deload', icon: '🔄', category: 'training', sentiment: 'good' },
  { slug: 'rest_day', label: 'Rest day', icon: '🛌', category: 'training', sentiment: 'good' },
  { slug: 'doms', label: 'Sore / DOMS', icon: '💥', category: 'training', sentiment: 'neutral' },
  { slug: 'injury_flare', label: 'Injury flare', icon: '🤕', category: 'training', sentiment: 'bad' },
  { slug: 'sauna', label: 'Sauna', icon: '🔥', category: 'training', sentiment: 'good' },
  { slug: 'cold_plunge', label: 'Cold plunge', icon: '🧊', category: 'training', sentiment: 'good' },
  { slug: 'meditation', label: 'Meditation', icon: '🧘', category: 'training', sentiment: 'good' },
  { slug: 'mobility_rehab', label: 'Mobility / Rehab', icon: '🧍', category: 'training', sentiment: 'good' },

  // Nutrition / Stims / Alcohol
  { slug: 'late_caffeine', label: 'Caffeine late', icon: '☕', category: 'nutrition', sentiment: 'bad' },
  { slug: 'alcohol_last_night', label: 'Alcohol last night', icon: '🍺', category: 'nutrition', sentiment: 'bad' },
  { slug: 'alcohol_free', label: 'Alcohol-free day', icon: '🥤', category: 'nutrition', sentiment: 'good' },
  { slug: 'low_carb', label: 'Low carb', icon: '🥗', category: 'nutrition', sentiment: 'neutral' },
  { slug: 'high_carb', label: 'High carb', icon: '🍝', category: 'nutrition', sentiment: 'neutral' },
  { slug: 'fasting', label: 'Fasting window', icon: '⏳', category: 'nutrition', sentiment: 'neutral' },
  { slug: 'refeed', label: 'Refeed day', icon: '🍽️', category: 'nutrition', sentiment: 'neutral' },
  { slug: 'dehydrated', label: 'Low hydration', icon: '💧', category: 'nutrition', sentiment: 'bad' },
  { slug: 'high_sodium', label: 'High sodium', icon: '🧂', category: 'nutrition', sentiment: 'neutral' },
  { slug: 'new_food', label: 'New food', icon: '🥡', category: 'nutrition', sentiment: 'neutral' },
  { slug: 'gi_upset', label: 'GI upset', icon: '🤢', category: 'nutrition', sentiment: 'bad' },

  // Meds / Supps Events
  { slug: 'new_med', label: 'New med started', icon: '➕', category: 'meds', sentiment: 'neutral' },
  { slug: 'dose_change', label: 'Dose change', icon: '🔁', category: 'meds', sentiment: 'neutral' },
  { slug: 'missed_dose', label: 'Missed dose', icon: '⛔', category: 'meds', sentiment: 'bad' },
  { slug: 'stopped_med', label: 'Stopped med', icon: '✋', category: 'meds', sentiment: 'neutral' },
  { slug: 'new_supp', label: 'New supplement', icon: '🌿', category: 'meds', sentiment: 'neutral' },
  { slug: 'injection_day', label: 'Injection day', icon: '💉', category: 'meds', sentiment: 'neutral' },
  { slug: 'antibiotics', label: 'Antibiotics', icon: '💊', category: 'meds', sentiment: 'neutral' },
  { slug: 'steroid_course', label: 'Steroid course', icon: '🧪', category: 'meds', sentiment: 'neutral' },
  { slug: 'infusion_day', label: 'Infusion day', icon: '🧷', category: 'meds', sentiment: 'neutral' },

  // Pain / Symptoms
  { slug: 'headache', label: 'Headache', icon: '🤕', category: 'pain', sentiment: 'bad' },
  { slug: 'migraine', label: 'Migraine', icon: '🌪️', category: 'pain', sentiment: 'bad' },
  { slug: 'joint_pain', label: 'Joint pain', icon: '🦴', category: 'pain', sentiment: 'bad' },
  { slug: 'nerve_pain', label: 'Nerve pain', icon: '🔌', category: 'pain', sentiment: 'bad' },
  { slug: 'back_pain', label: 'Back pain', icon: '🧱', category: 'pain', sentiment: 'bad' },
  { slug: 'menstrual_cramps', label: 'Cramps', icon: '🌸', category: 'pain', sentiment: 'bad' },
  { slug: 'allergies_high', label: 'Allergies high', icon: '🤧', category: 'pain', sentiment: 'bad' },
  { slug: 'fever_chills', label: 'Fever / chills', icon: '🤒', category: 'pain', sentiment: 'bad' },
  { slug: 'fatigue_crash', label: 'Fatigue crash', icon: '🔋', category: 'pain', sentiment: 'bad' },

  // Illness / Immune
  { slug: 'getting_sick', label: 'Getting sick', icon: '🦠', category: 'illness', sentiment: 'bad' },
  { slug: 'recovering', label: 'Recovering', icon: '🛟', category: 'illness', sentiment: 'neutral' },
  { slug: 'covid_positive', label: 'COVID positive', icon: '🧪', category: 'illness', sentiment: 'bad' },
  { slug: 'post_viral', label: 'Post-viral', icon: '🌀', category: 'illness', sentiment: 'bad' },
  { slug: 'vaccine_day', label: 'Vaccine day', icon: '💉', category: 'illness', sentiment: 'neutral' },
  { slug: 'vax_side_effects', label: 'Vax side effects', icon: '🌡️', category: 'illness', sentiment: 'bad' },

  // Hormones / Cycle / Fertility
  { slug: 'cycle_day', label: 'Cycle day', icon: '🔄', category: 'hormones', sentiment: 'neutral' },
  { slug: 'pms_pmdd', label: 'PMS / PMDD', icon: '🌩️', category: 'hormones', sentiment: 'bad' },
  { slug: 'ovulation_window', label: 'Ovulation window', icon: '✨', category: 'hormones', sentiment: 'neutral' },
  { slug: 'menopause_symptoms', label: 'Menopause symptoms', icon: '🔥', category: 'hormones', sentiment: 'bad' },
  { slug: 'trt_shot', label: 'TRT shot', icon: '🧔', category: 'hormones', sentiment: 'neutral' },
  { slug: 'fertility_treatment', label: 'Fertility treatment', icon: '🧬', category: 'hormones', sentiment: 'neutral' },

  // Environment / Travel
  { slug: 'heat_wave', label: 'Heat wave', icon: '☀️', category: 'environment', sentiment: 'neutral' },
  { slug: 'cold_snap', label: 'Cold snap', icon: '❄️', category: 'environment', sentiment: 'neutral' },
  { slug: 'high_altitude', label: 'High altitude', icon: '🏔️', category: 'environment', sentiment: 'neutral' },
  { slug: 'bad_air', label: 'Bad air quality', icon: '🌫️', category: 'environment', sentiment: 'bad' },
  { slug: 'long_sit', label: 'Long sit / drive', icon: '🚗', category: 'environment', sentiment: 'neutral' },
  { slug: 'travel_day', label: 'Travel day', icon: '🧳', category: 'environment', sentiment: 'neutral' },

  // Work / Life
  { slug: 'big_deadline', label: 'Big deadline', icon: '📦', category: 'work', sentiment: 'neutral' },
  { slug: 'conflict', label: 'Conflict / argument', icon: '🗣️', category: 'work', sentiment: 'bad' },
  { slug: 'social_event', label: 'Social event', icon: '🎉', category: 'work', sentiment: 'neutral' },
  { slug: 'overloaded', label: 'Inbox overload', icon: '📨', category: 'work', sentiment: 'bad' },
  { slug: 'wfh_day', label: 'Work from home', icon: '🏠', category: 'work', sentiment: 'neutral' },

  // Biohacker / Protocol
  { slug: 'cgm_on', label: 'CGM on', icon: '🩸', category: 'biohacker', sentiment: 'neutral' },
  { slug: 'cgm_off', label: 'CGM off', icon: '🩸', category: 'biohacker', sentiment: 'neutral' },
  { slug: 'red_light', label: 'Red light therapy', icon: '🔴', category: 'biohacker', sentiment: 'good' },
  { slug: 'pemf', label: 'PEMF', icon: '🧲', category: 'biohacker', sentiment: 'neutral' },
  { slug: 'hbot', label: 'HBOT session', icon: '🫧', category: 'biohacker', sentiment: 'neutral' },
  { slug: 'glp1_day', label: 'GLP-1 / retatrutide day', icon: '🧪', category: 'biohacker', sentiment: 'neutral' },
  { slug: 'rapamycin_day', label: 'Rapamycin day', icon: '🧫', category: 'biohacker', sentiment: 'neutral' },
  { slug: 'acarbose_day', label: 'Acarbose day', icon: '🍚', category: 'biohacker', sentiment: 'neutral' },

  // Parenting
  { slug: 'cluster_feeds', label: 'Cluster feeds', icon: '🍼', category: 'parenting', sentiment: 'bad' },
  { slug: 'baby_wakes', label: 'Baby frequent wakes', icon: '🌙', category: 'parenting', sentiment: 'bad' },
  { slug: 'daycare_bugs', label: 'Daycare bug', icon: '🧸', category: 'parenting', sentiment: 'bad' },

  // Digestive / Other
  { slug: 'constipation', label: 'Constipation', icon: '🧱', category: 'digestive', sentiment: 'bad' },
  { slug: 'diarrhea', label: 'Diarrhea', icon: '💦', category: 'digestive', sentiment: 'bad' },
  { slug: 'bloating', label: 'Bloating', icon: '🎈', category: 'digestive', sentiment: 'bad' },
  { slug: 'doctor_visit', label: 'Doctor visit', icon: '🩺', category: 'other', sentiment: 'neutral' },
];

// Helper functions
export const getChipsByCategory = (category: Chip['category']) => 
  CHIP_CATALOG.filter(chip => chip.category === category);

// Get all expressive chips (across all subcategories)
export const getExpressiveChips = () => 
  CHIP_CATALOG.filter(chip => chip.category.startsWith('expressive'));

// Get expressive chips by energy level
export const getExpressiveChipsByEnergy = (energy: 'high' | 'low' | 'neutral') => 
  CHIP_CATALOG.filter(chip => chip.category === `expressive_${energy}`);

export const getRecentChips = (limit = 6) => 
  CHIP_CATALOG.slice(0, limit);

export const getChipsBySentiment = (sentiment: Chip['sentiment']) =>
  CHIP_CATALOG.filter(chip => chip.sentiment === sentiment);

export const searchChips = (query: string) =>
  CHIP_CATALOG.filter(chip => 
    chip.label.toLowerCase().includes(query.toLowerCase()) ||
    chip.slug.toLowerCase().includes(query.toLowerCase())
  );
