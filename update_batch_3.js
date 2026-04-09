
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://bhuyjcbsqatrruixpwao.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJodXlqY2JzcWF0cnJ1aXhwd2FvIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NTIwNjg3MiwiZXhwIjoyMDkwNzgyODcyfQ.8jlWCj9reEB6VxlCArJxtWriKt3dNVFibEIK25lvywo';

const supabase = createClient(supabaseUrl, supabaseKey);

const updates = [
    { name: 'Onion Roast', url: 'https://images.unsplash.com/photo-1630409351241-19395f1e5821?auto=format&fit=crop&w=800&q=80' },
    { name: 'Masala Dosa', url: 'https://images.unsplash.com/photo-1589301760014-d929f3979dbc?auto=format&fit=crop&w=800&q=80' },
    { name: 'Plain Dosa', url: 'https://images.unsplash.com/photo-1610192244261-3f3363955815?auto=format&fit=crop&w=800&q=80' },
    { name: 'Onion Dosa', url: 'https://images.unsplash.com/photo-1627308595229-7830a5c91f9f?auto=format&fit=crop&w=800&q=80' },
    { name: 'Plain Roast', url: 'https://images.unsplash.com/photo-1630409351241-19395f1e5821?auto=format&fit=crop&w=800&q=80' },
    { name: 'Salem Dosai', url: 'https://images.unsplash.com/photo-1589301760014-d929f3979dbc?auto=format&fit=crop&w=800&q=80' },
    { name: 'Podi Roast', url: 'https://images.unsplash.com/photo-1589301760014-d929f3979dbc?auto=format&fit=crop&w=800&q=80' },
    { name: 'Ghee Roast', url: 'https://images.unsplash.com/photo-1627308595186-e63d09292398?auto=format&fit=crop&w=800&q=80' },
    { name: 'Uthappam (Plain)', url: 'https://images.unsplash.com/photo-1610192244261-3f3363955815?auto=format&fit=crop&w=800&q=80' },
    { name: 'Idli', url: 'https://images.unsplash.com/photo-1589302168068-964664d93dc0?auto=format&fit=crop&w=800&q=80' }
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
