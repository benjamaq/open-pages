const { createClient } = require('@supabase/supabase-js');

// You'll need to replace these with your actual Supabase credentials
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'your-supabase-url';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'your-service-role-key';

const supabase = createClient(supabaseUrl, supabaseKey);

async function updateEmmaSupplements() {
  try {
    console.log('🔍 Getting Emma user_id...');
    
    // Get Emma's user_id
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('user_id')
      .eq('slug', 'emma-chronic-pain-journey')
      .single();

    if (profileError || !profile) {
      console.error('❌ Emma profile not found:', profileError);
      return;
    }

    const userId = profile.user_id;
    console.log('✅ Found Emma user_id:', userId);

    // Get all daily entries
    const { data: entries, error: entriesError } = await supabase
      .from('daily_entries')
      .select('local_date, mood, pain, sleep_quality')
      .eq('user_id', userId)
      .order('local_date');

    if (entriesError) {
      console.error('❌ Error fetching entries:', entriesError);
      return;
    }

    console.log(`📅 Found ${entries.length} daily entries`);

    // Update each entry with supplement data
    for (const entry of entries) {
      const dayOffset = Math.floor((new Date(entry.local_date) - new Date('2025-09-10')) / (1000 * 60 * 60 * 24));
      
      let supplements, protocols, activities, devices;
      
      if (dayOffset <= 20) {
        // Early days - basic supplements
        supplements = ['Magnesium 400mg', 'Vitamin D3 2000IU', 'Omega-3 1000mg'];
        protocols = ['Heat therapy', 'Gentle stretching'];
        activities = ['Walking 10min', 'Yoga 15min'];
        devices = ['Heating pad', 'Oura Ring'];
      } else if (dayOffset <= 40) {
        // Middle period - added LDN
        supplements = ['LDN 4.5mg', 'Magnesium 400mg', 'Vitamin D3 2000IU', 'Omega-3 1000mg', 'B12 1000mcg'];
        protocols = ['LDN protocol', 'Heat therapy', 'Gentle stretching', 'Meditation 10min'];
        activities = ['Walking 15min', 'Yoga 20min', 'Swimming 30min'];
        devices = ['Heating pad', 'Oura Ring', 'Massage gun'];
      } else {
        // Recent days - full stack
        supplements = ['LDN 4.5mg', 'Magnesium 400mg', 'Vitamin D3 2000IU', 'Omega-3 1000mg', 'B12 1000mcg', 'Curcumin 500mg', 'CoQ10 200mg'];
        protocols = ['LDN protocol', 'Heat therapy', 'Gentle stretching', 'Meditation 15min', 'Breathing exercises'];
        activities = ['Walking 20min', 'Yoga 25min', 'Swimming 45min', 'Physical therapy'];
        devices = ['Heating pad', 'Oura Ring', 'Massage gun', 'TENS unit'];
      }

      // Update the entry
      const { error: updateError } = await supabase
        .from('daily_entries')
        .update({
          meds: supplements,
          protocols: protocols,
          activity: activities,
          devices: devices
        })
        .eq('user_id', userId)
        .eq('local_date', entry.local_date);

      if (updateError) {
        console.error(`❌ Error updating ${entry.local_date}:`, updateError);
      } else {
        console.log(`✅ Updated ${entry.local_date} with ${supplements.length} supplements`);
      }
    }

    console.log('🎉 All entries updated successfully!');
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

updateEmmaSupplements();
