import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';

// Read .env for creds
const envFile = readFileSync('.env', 'utf-8');
const urlMatch = envFile.match(/VITE_SUPABASE_URL=(.*)/);
const keyMatch = envFile.match(/VITE_SUPABASE_ANON_KEY=(.*)/);

const supabase = createClient(urlMatch[1], keyMatch[1]);

async function run() {
    console.log('Fetching a class and a course...');
    const { data: cls } = await supabase.from('classes').select('id').limit(1).single();
    const { data: crs } = await supabase.from('courses').select('id').limit(1).single();

    if (!cls || !crs) {
        console.log('Need at least 1 class and 1 course to test.');
        return;
    }

    console.log('Inserting Schedule 1 (07:00 - 08:30)...');
    const insert1 = await supabase.from('class_schedules').insert({
        class_id: cls.id,
        course_id: crs.id,
        day_of_week: 1,
        start_time: '07:00:00',
        end_time: '08:30:00'
    });
    console.log('Result 1:', insert1.error || 'Success');

    console.log('Inserting Schedule 2 (08:30 - 10:00)...');
    const insert2 = await supabase.from('class_schedules').insert({
        class_id: cls.id,
        course_id: crs.id,
        day_of_week: 1,
        start_time: '08:30:00',
        end_time: '10:00:00'
    });
    console.log('Result 2:', insert2.error || 'Success');

    console.log('Inserting Schedule 3 with bad time (10:00 - 09:00)...');
    const insert3 = await supabase.from('class_schedules').insert({
        class_id: cls.id,
        course_id: crs.id,
        day_of_week: 1,
        start_time: '10:00:00',
        end_time: '09:00:00'
    });
    console.log('Result 3:', insert3.error || 'Success');
}

run();
