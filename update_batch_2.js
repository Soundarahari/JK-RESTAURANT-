
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://bhuyjcbsqatrruixpwao.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJodXlqY2JzcWF0cnJ1aXhwd2FvIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NTIwNjg3MiwiZXhwIjoyMDkwNzgyODcyfQ.8jlWCj9reEB6VxlCArJxtWriKt3dNVFibEIK25lvywo';

const supabase = createClient(supabaseUrl, supabaseKey);

const updates = [
    { name: 'Blue Morraco Mojito', url: 'https://images.unsplash.com/photo-1546173159-315724a31696?auto=format&fit=crop&w=800&q=80' },
    { name: 'Watermelon Juice', url: 'https://images.unsplash.com/photo-1563227812-0ea4c22e6cc8?auto=format&fit=crop&w=800&q=80' },
    { name: 'Sweetlime (Mosambi)', url: 'https://images.unsplash.com/photo-1613478223719-2ab802602423?auto=format&fit=crop&w=800&q=80' },
    { name: 'ABC Juice', url: 'https://images.unsplash.com/photo-1610970881699-44a5587cabec?auto=format&fit=crop&w=800&q=80' },
    { name: 'Apple Juice', url: 'https://images.unsplash.com/photo-1568909344668-6f14a07b56a0?auto=format&fit=crop&w=800&q=80' },
    { name: 'Pomegranate Juice', url: 'https://images.unsplash.com/photo-1567117622941-86259ce3e35a?auto=format&fit=crop&w=800&q=80' },
    { name: 'Vanilla Milkshake', url: 'https://images.unsplash.com/photo-1619158403521-ed91ef97e5ea?auto=format&fit=crop&w=800&q=80' },
    { name: 'Strawberry Milkshake', url: 'https://images.unsplash.com/photo-1553173380-60ecd0327763?auto=format&fit=crop&w=800&q=80' },
    { name: 'Chocolate Milkshake', url: 'https://images.unsplash.com/photo-1572490122747-3968b75cc699?auto=format&fit=crop&w=800&q=80' },
    { name: 'Banana Milkshake', url: 'https://images.unsplash.com/photo-1551024506-0bccd828d307?auto=format&fit=crop&w=800&q=80' },
    { name: 'Apple Milkshake', url: 'https://images.unsplash.com/photo-1550586678-f7225f03c44b?auto=format&fit=crop&w=800&q=80' },
    { name: 'Mango Milkshake', url: 'https://images.unsplash.com/photo-1534422298391-e4f8c170db06?auto=format&fit=crop&w=800&q=80' },
    { name: 'Lime Mojito (Mint)', url: 'https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?auto=format&fit=crop&w=800&q=80' },
    { name: 'Watermelon Mojito', url: 'https://images.unsplash.com/photo-1595981267035-7b04ca84a82d?auto=format&fit=crop&w=800&q=80' }
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
