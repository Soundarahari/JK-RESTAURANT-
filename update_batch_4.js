
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://bhuyjcbsqatrruixpwao.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJodXlqY2JzcWF0cnJ1aXhwd2FvIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NTIwNjg3MiwiZXhwIjoyMDkwNzgyODcyfQ.8jlWCj9reEB6VxlCArJxtWriKt3dNVFibEIK25lvywo';

const supabase = createClient(supabaseUrl, supabaseKey);

const updates = [
    { name: 'Idli Ghee Podi', url: 'https://images.unsplash.com/photo-1589302168068-964664d93dc0?auto=format&fit=crop&w=800&q=80' },
    { name: 'Chilly Idli', url: 'https://images.unsplash.com/photo-1599481238505-b8b0537a3f77?auto=format&fit=crop&w=800&q=80' },
    { name: 'Mini Sambar Idli', url: 'https://images.unsplash.com/photo-1589302168068-964664d93dc0?auto=format&fit=crop&w=800&q=80' },
    { name: 'Normal Meals', url: 'https://images.unsplash.com/photo-1546539782-6fc531453083?auto=format&fit=crop&w=800&q=80' },
    { name: 'Special Meals', url: 'https://images.unsplash.com/photo-1626777552726-4a6b547b4e53?auto=format&fit=crop&w=800&q=80' },
    { name: 'Sambar Rice', url: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=800&q=80' },
    { name: 'Tomato Rice', url: 'https://images.unsplash.com/photo-1543339308-43e59d6b73a6?auto=format&fit=crop&w=800&q=80' },
    { name: 'Lemon Rice', url: 'https://images.unsplash.com/photo-1545243424-0ce743321e11?auto=format&fit=crop&w=800&q=80' },
    { name: 'Curd Rice', url: 'https://images.unsplash.com/photo-1599481238334-75c61ca16728?auto=format&fit=crop&w=800&q=80' },
    { name: 'Kal Dosa', url: 'https://images.unsplash.com/photo-1610192244261-3f3363955815?auto=format&fit=crop&w=800&q=80' }
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
