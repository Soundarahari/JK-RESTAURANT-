
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://bhuyjcbsqatrruixpwao.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJodXlqY2JzcWF0cnJ1aXhwd2FvIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NTIwNjg3MiwiZXhwIjoyMDkwNzgyODcyfQ.8jlWCj9reEB6VxlCArJxtWriKt3dNVFibEIK25lvywo';

const supabase = createClient(supabaseUrl, supabaseKey);

const updates = [
    { name: 'Veg Burger', url: 'https://images.unsplash.com/photo-1550547660-d9450f859349?auto=format&fit=crop&w=800&q=80' },
    { name: 'Veg Sandwich', url: 'https://images.unsplash.com/photo-1528735602780-2552fd46c7af?auto=format&fit=crop&w=800&q=80' },
    { name: 'Cheese Corn Nuggets', url: 'https://images.unsplash.com/photo-1627662056024-5d9c18fbd881?auto=format&fit=crop&w=800&q=80' },
    { name: 'French Fries', url: 'https://images.unsplash.com/photo-1576107232684-1279f390859f?auto=format&fit=crop&w=800&q=80' },
    { name: 'Fried Momos', url: 'https://images.unsplash.com/photo-1625220194771-7ebdea0b70b9?auto=format&fit=crop&w=800&q=80' },
    { name: 'Sambar Vadai', url: 'https://images.unsplash.com/photo-1626132646529-5ae818fefeca?auto=format&fit=crop&w=800&q=80' },
    { name: 'Palooda', url: 'https://images.unsplash.com/photo-1552539618-7eec9b4d1796?auto=format&fit=crop&w=800&q=80' },
    { name: 'Assorted Bajji', url: 'https://images.unsplash.com/photo-1601050690597-df0568a70950?auto=format&fit=crop&w=800&q=80' }
];

async function runUpdates() {
    for (const item of updates) {
        console.log(`Updating ${item.name}...`);
        const { data, error } = await supabase
            .from('products')
            .update({ image_url: item.url })
            .eq('name', item.name);

        if (error) {
            console.error(`Error updating ${item.name}:`, error);
        } else {
            console.log(`Successfully updated ${item.name}`);
        }
    }
}

runUpdates();
