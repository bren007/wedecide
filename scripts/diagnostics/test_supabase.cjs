const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://dakkjqqfskzsymkclymw.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRha2tqcXFmc2t6c3lta2NseW13Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjMyMzM2NDYsImV4cCI6MjA3ODgwOTY0Nn0.6P8Mph_E4RfPJaasVhIA2iwQt5dAVM6XCa9vrhCi2m4';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testInsert() {
    const { data, error } = await supabase.from('leads').insert({
        email: 'test@example.com',
        organization_name: 'test org',
        portfolio_scale: '1-10',
        primary_pain_point: 'test',
        data_minimisation_acknowledged: true,
        nda_accepted: true,
        payment_status: 'pending'
    });

    if (error) {
        console.error('Insert Error:', error);
    } else {
        console.log('Insert Success:', data);
    }
}

testInsert();
