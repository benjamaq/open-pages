-- COMPLETE Mum's Chronic Pain Profile - Data + Supplements + Protocols + Journal + Followers

DO $$
DECLARE
    v_emma_user_id UUID := 'f3fdc655-efc6-4554-8159-8055e8f6f39d';
    v_emma_profile_id UUID;
BEGIN
    -- Get Mum's profile ID
    SELECT id INTO v_emma_profile_id FROM profiles WHERE slug = 'mum-chronic-pain';
    
    -- Add supplements (chronic pain focused)
    INSERT INTO stack_items (profile_id, item_type, name, dose, timing, brand, notes, public, created_at) VALUES
    (v_emma_profile_id, 'supplements', 'Magnesium Glycinate', '400mg', 'bedtime', 'Thorne', 'Essential for muscle relaxation and sleep. Game changer for chronic pain.', true, '2025-08-15'),
    (v_emma_profile_id, 'supplements', 'Omega-3 Fish Oil', '1000mg', 'morning', 'Nordic Naturals', 'EPA/DHA for anti-inflammatory support. Helps with joint pain.', true, '2025-08-15'),
    (v_emma_profile_id, 'supplements', 'Vitamin D3', '2000 IU', 'morning', 'Pure Encapsulations', 'Was severely deficient. Critical for pain modulation and mood.', true, '2025-08-15'),
    (v_emma_profile_id, 'supplements', 'Curcumin (Turmeric)', '500mg', 'with meals', 'Life Extension', 'With black pepper for absorption. Powerful anti-inflammatory.', true, '2025-08-20'),
    (v_emma_profile_id, 'supplements', 'Vitamin B12 (Methylcobalamin)', '1000mcg', 'morning', 'Thorne', 'Methylated form for nerve health and energy.', true, '2025-08-20'),
    (v_emma_profile_id, 'supplements', 'Ashwagandha', '300mg', 'evening', 'KSM-66', 'Adaptogen for stress management and cortisol reduction.', true, '2025-08-25'),
    (v_emma_profile_id, 'supplements', 'Melatonin', '3mg', 'bedtime', 'Nature Made', 'Natural sleep aid. Better sleep = less pain.', true, '2025-08-01'),
    (v_emma_profile_id, 'supplements', 'CoQ10', '100mg', 'morning', 'Qunol', 'Mitochondrial support and cellular energy.', true, '2025-08-25');
    
    -- Add protocols
    INSERT INTO protocols (profile_id, name, description, frequency, public, created_at) VALUES
    (v_emma_profile_id, 'Heat Therapy Protocol', 'Heating pad on affected areas for 20-30 minutes, 2-3x daily. Helps relax muscles and reduce pain during flares.', 'as needed', true, '2025-08-01'),
    (v_emma_profile_id, 'Sleep Hygiene Routine', 'Cool room (65-68°F), blackout curtains, no screens 1hr before bed, magnesium at bedtime. Sleep quality directly affects pain levels.', 'nightly', true, '2025-08-10'),
    (v_emma_profile_id, 'Pacing Strategy', 'Break activities into small chunks. Rest before getting exhausted, not after. Prevents pain flares and crashes.', 'daily', true, '2025-08-15'),
    (v_emma_profile_id, 'Stress Management', 'Daily meditation, deep breathing, gentle yoga. Stress is a major pain trigger for chronic conditions.', 'daily', true, '2025-08-20'),
    (v_emma_profile_id, 'Anti-Inflammatory Diet', 'Focus on omega-3s, turmeric, ginger, leafy greens. Avoid processed foods and sugar which increase inflammation.', 'daily', true, '2025-08-15');
    
    -- Add movement items
    INSERT INTO stack_items (profile_id, item_type, name, dose, timing, brand, notes, public, created_at) VALUES
    (v_emma_profile_id, 'movement', 'Gentle Yoga', '20-30 min', 'morning', 'Yoga with Adriene', 'Low-impact stretching and strengthening. Helps maintain mobility without triggering pain.', true, '2025-08-10'),
    (v_emma_profile_id, 'movement', 'Walking', '20-40 min', 'afternoon', 'Daily', 'Low-impact cardio. Start slow and build up. Fresh air and movement help with mood and pain.', true, '2025-08-10'),
    (v_emma_profile_id, 'movement', 'Swimming', '15-30 min', 'as possible', 'Local pool', 'Zero-impact exercise. Water supports joints while providing resistance.', true, '2025-08-15'),
    (v_emma_profile_id, 'movement', 'Foam Rolling', '10-15 min', 'evening', 'TriggerPoint', 'Self-myofascial release. Start gentle - too much pressure can trigger flares.', true, '2025-08-20');
    
    -- Add mindfulness items
    INSERT INTO stack_items (profile_id, item_type, name, dose, timing, brand, notes, public, created_at) VALUES
    (v_emma_profile_id, 'mindfulness', 'Meditation', '10-20 min', 'morning', 'Headspace', 'Mindfulness meditation for pain management and stress reduction. Chronic pain is both physical and mental.', true, '2025-08-15'),
    (v_emma_profile_id, 'mindfulness', 'Deep Breathing', '5-10 min', 'as needed', 'Daily', 'Box breathing (4-4-4-4) during pain flares. Helps activate parasympathetic nervous system.', true, '2025-08-10'),
    (v_emma_profile_id, 'mindfulness', 'Gratitude Journaling', '5 min', 'evening', 'Daily', 'Focusing on small wins and positive moments. Important for mental health during chronic illness.', true, '2025-08-20'),
    (v_emma_profile_id, 'mindfulness', 'Nature Connection', '15-30 min', 'afternoon', 'Daily', 'Time in nature reduces stress hormones and inflammation. Even just sitting outside helps.', true, '2025-08-15');
    
    -- Add gear
    INSERT INTO gear (profile_id, name, brand, model, category, description, public, created_at) VALUES
    (v_emma_profile_id, 'Heating Pad', 'Sunbeam', 'XL', 'Recovery', 'Large size for full back coverage. Auto-shutoff for safety. Used multiple times daily during worst pain periods.', true, '2025-08-01'),
    (v_emma_profile_id, 'TENS Unit', 'iReliev', 'Wireless', 'Recovery', 'Electrical nerve stimulation for drug-free pain relief during breakthrough pain episodes. Portable and effective.', true, '2025-08-10'),
    (v_emma_profile_id, 'Foam Roller', 'TriggerPoint', 'GRID', 'Recovery', 'Self-myofascial release tool. Start gentle! Too much pressure can trigger pain flares.', true, '2025-08-15'),
    (v_emma_profile_id, 'Massage Ball', 'TriggerPoint', 'Grid Ball', 'Recovery', 'Targeted massage for specific trigger points. Great for feet, neck, and shoulders.', true, '2025-08-20'),
    (v_emma_profile_id, 'Oura Ring', 'Oura', 'Gen 3', 'Wearables', 'Tracks sleep stages, HRV, recovery score, body temp. Data revealed clear patterns between sleep quality and pain levels.', true, '2025-08-05'),
    (v_emma_profile_id, 'Standing Desk', 'Uplift', 'V2', 'Fitness', 'Alternate sitting/standing every 30min. Proper ergonomics significantly reduces back and neck pain.', true, '2025-08-25');
    
    -- Add journal entries that match the pain progression
    INSERT INTO journal_entries (profile_id, heading, body, public, created_at) VALUES
    (v_emma_profile_id, 'Rock Bottom', 'I''m writing this through tears. It''s been 3 months of constant pain - 8 or 9 out of 10 every single day. I can''t sleep. I can''t work properly. I can''t be present with my family.

My doctor suggested trying a systematic approach to supplements and lifestyle changes. I''ve tried everything else: physical therapy, acupuncture, every NSAID under the sun. Nothing touches this pain.

I''m scared to hope again. But I''m also desperate. Starting magnesium and heat therapy today.

If you''re reading this and you''re in chronic pain: I see you. I know how isolating this is. How exhausting it is to explain to people who don''t understand. How hard it is to keep going when your body feels like it''s fighting against you.

I''m going to document this journey - the good, the bad, and the ugly. If nothing else, maybe it''ll help someone else feel less alone.', true, '2025-08-01'),
    
    (v_emma_profile_id, 'First Glimmer of Hope', 'Day 10 and I think I''m seeing a tiny improvement. Pain is down to 6/10 instead of 8-9. It''s not much, but after weeks of nothing working, this feels like a miracle.

The magnesium seems to be helping with sleep. I''m getting 6+ hours instead of 4-5. Still waking up multiple times, but it''s progress.

Added omega-3 and vitamin D this week. My doctor said I was severely deficient in D (18 ng/mL). No wonder I felt terrible.

Still taking it one day at a time. But for the first time in months, I feel like there might be a way forward.', true, '2025-08-10'),
    
    (v_emma_profile_id, 'Breakthrough Week', 'I can''t believe I''m writing this. Days 11-17 were the best I''ve had in MONTHS. Pain down to 3-4/10. I actually slept through the night twice!

The combination is working: magnesium, omega-3, vitamin D, heat therapy, and gentle movement. I''m starting to feel like myself again.

Added curcumin and B12 this week. My energy is slowly returning. I went for a 20-minute walk yesterday and didn''t pay for it with increased pain today.

This is the first time I''ve felt hopeful in a very long time. I''m starting to believe I might actually get my life back.', true, '2025-08-17'),
    
    (v_emma_profile_id, 'Seven Green Days in a Row!', 'I''m crying happy tears as I write this. Seven days in a row with pain at 1-2/10. SEVEN DAYS! 

I can''t remember the last time I felt this good. I''m sleeping 7+ hours a night. I have energy again. I played with my kids without being in agony afterward.

The supplement stack is working: magnesium, omega-3, vitamin D, curcumin, B12. Plus heat therapy, gentle yoga, and proper sleep hygiene.

I feel like I''ve been given my life back. I know there might be setbacks, but now I know there''s a way forward. This tracking is showing me exactly what works.', true, '2025-08-24'),
    
    (v_emma_profile_id, 'Minor Setback, Major Learning', 'Had a tough week (days 25-27). Pain crept back up to 5-6/10. Stressful work situation triggered a flare.

But here''s the difference: instead of spiraling into despair, I looked at my data. I could see exactly what happened and when. I adjusted my protocol - extra heat therapy, more rest, added ashwagandha for stress management.

By day 28, I was back on track. Pain down to 2-3/10 again.

This is why tracking matters. It''s not just about the good days - it''s about understanding patterns and having a plan when things get tough. I feel empowered instead of helpless.', true, '2025-08-30'),
    
    (v_emma_profile_id, 'Moving Forward with Confidence', 'End of August and I''m ending on a high note. Pain consistently at 2-3/10. I have my life back.

The key was finding the right combination and being consistent. It''s not one magic supplement - it''s the stack, the protocols, the lifestyle changes all working together.

I''m grateful for this journey, even the dark parts. They taught me resilience and showed me what''s possible with the right approach and data-driven decisions.

To anyone reading this who''s struggling with chronic pain: don''t give up. Keep experimenting. Track everything. Find your combination. There is hope.', true, '2025-08-31');
    
    -- Add followers (50+ like Emma)
    INSERT INTO stack_followers (owner_user_id, follower_email, verified_at, created_at)
    SELECT
        v_emma_user_id,
        'chronic_pain_follower' || gs || '@biostackr-community.com',
        NOW() - (gs || ' days')::INTERVAL,
        NOW() - (gs || ' days')::INTERVAL
    FROM generate_series(1, 58) gs;
    
    -- Add library items (doctor reports, lab results)
    INSERT INTO library_items (profile_id, title, category, is_public, provider, summary_public, file_type, file_size, file_url, created_at) VALUES
    (v_emma_profile_id, 'Vitamin D Lab Results - Quest', 'lab_results', true, 'Quest Diagnostics', 'Vitamin D level was severely deficient at 18 ng/mL (normal: 30-100 ng/mL). Started 2000 IU daily supplementation.', 'application/pdf', 189440, '/uploads/mum/vitamin-d-lab-quest.pdf', '2025-08-15'),
    (v_emma_profile_id, 'Pain Management Consultation - Dr. Smith', 'consultation', true, 'Dr. Sarah Smith - Pain Clinic', 'Comprehensive pain management plan including supplement protocol, lifestyle modifications, and tracking recommendations.', 'application/pdf', 356864, '/uploads/mum/pain-management-consultation-dr-smith.pdf', '2025-08-01'),
    (v_emma_profile_id, 'Inflammatory Markers - LabCorp', 'lab_results', true, 'LabCorp', 'CRP and ESR levels elevated, indicating systemic inflammation. Omega-3 and curcumin protocol recommended.', 'application/pdf', 245760, '/uploads/mum/inflammatory-markers-labcorp.pdf', '2025-08-20'),
    (v_emma_profile_id, 'Sleep Study Results', 'medical_report', true, 'Sleep Medicine Associates', 'Mild sleep apnea and frequent awakenings. Sleep hygiene and melatonin protocol recommended.', 'application/pdf', 512000, '/uploads/mum/sleep-study-results.pdf', '2025-08-10');
    
    RAISE NOTICE 'Mum profile completed successfully!';
END $$;
