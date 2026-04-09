
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://bhuyjcbsqatrruixpwao.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJodXlqY2JzcWF0cnJ1aXhwd2FvIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NTIwNjg3MiwiZXhwIjoyMDkwNzgyODcyfQ.8jlWCj9reEB6VxlCArJxtWriKt3dNVFibEIK25lvywo';

const supabase = createClient(supabaseUrl, supabaseKey);

const updates = [
    { name: 'Paneer Noodles', url: 'https://images.unsplash.com/photo-1552611052-33e04de081de?auto=format&fit=crop&w=800&q=80' },
    { name: 'Babycorn Noodles', url: 'https://images.unsplash.com/photo-1585032226651-759b368d7246?auto=format&fit=crop&w=800&q=80' },
    { name: 'Mushroom 65', url: 'https://images.unsplash.com/photo-1600271886311-dc5436a0adc?auto=format&fit=crop&w=800&q=80' },
    { name: 'Mushroom Fried Rice', url: 'https://images.unsplash.com/photo-1603133872878-684f208fb84b?auto=format&fit=crop&w=800&q=80' },
    { name: 'Kadai Paneer', url: 'https://images.unsplash.com/photo-1631452180519-c014fe946bc7?auto=format&fit=crop&w=800&q=80' },
    { name: 'Mushroom Masala', url: 'https://images.unsplash.com/photo-1599481238505-b8b0537a3f77?auto=format&fit=crop&w=800&q=80' },
    { name: 'Paneer Fried Rice', url: 'https://images.unsplash.com/photo-1512058560366-cd242d4532be?auto=format&fit=crop&w=800&q=80' },
    { name: 'Babycorn Fried Rice', url: 'https://images.unsplash.com/photo-1541544741938-0af808871cc0?auto=format&fit=crop&w=800&q=80' },
    { name: 'Gobi Fried Rice', url: 'https://images.unsplash.com/photo-1626074353765-517a681e40be?auto=format&fit=crop&w=800&q=80' },
    { name: 'Mushroom Noodles', url: 'https://images.unsplash.com/photo-1534422298391-e4f8c170db06?auto=format&fit=crop&w=800&q=80' }
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
