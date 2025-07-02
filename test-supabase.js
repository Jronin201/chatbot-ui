// Test Supabase connection and create default user
const { createClient } = require('@supabase/supabase-js');

async function testSupabase() {
  console.log('🔍 Testing Supabase connection...');
  
  // Use the values from the terminal output
  const supabaseUrl = "http://127.0.0.1:54321";
  const anonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0";
  const serviceRoleKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU";
  
  console.log('URL:', supabaseUrl);

  try {
    // Test admin client
    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey);

    console.log('\n🚀 Testing admin connection...');
    const { data, error } = await supabaseAdmin.auth.admin.listUsers();
    
    if (error) {
      console.error('❌ Admin connection error:', error);
      return;
    }

    console.log('✅ Admin connection successful');
    console.log('📊 Current users:', data.users.length);

    // Check for default user
    const defaultUser = data.users.find(u => u.email === 'jim@demerzel.local');
    
    if (defaultUser) {
      console.log('✅ Default user exists:', defaultUser.email);
    } else {
      console.log('⚠️ Creating default user...');
      
      const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
        email: 'jim@demerzel.local',
        password: 'Seraphine',
        email_confirm: true
      });

      if (createError) {
        console.error('❌ Error creating user:', createError);
      } else {
        console.log('✅ Default user created:', newUser.user.email);
      }
    }

  } catch (err) {
    console.error('💥 Connection failed:', err.message);
  }
}

testSupabase();
