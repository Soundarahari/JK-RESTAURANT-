
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const supabaseUrl = 'https://bhuyjcbsqatrruixpwao.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJodXlqY2JzcWF0cnJ1aXhwd2FvIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NTIwNjg3MiwiZXhwIjoyMDkwNzgyODcyfQ.8jlWCj9reEB6VxlCArJxtWriKt3dNVFibEIK25lvywo';

const supabase = createClient(supabaseUrl, supabaseKey);

async function uploadAndUpdate(productId, productName, localImagePath) {
    try {
        const fileName = productName.toLowerCase().replace(/[^a-z0-9]/g, '_') + '.png';
        const storagePath = `products/${fileName}`;
        const fileBuffer = fs.readFileSync(localImagePath);

        console.log(`Uploading ${localImagePath} to ${storagePath}...`);

        // Upload to Storage
        const { data: uploadData, error: uploadError } = await supabase.storage
            .from('images')
            .upload(storagePath, fileBuffer, {
                contentType: 'image/png',
                upsert: true
            });

        if (uploadError) throw uploadError;

        // Get Public URL
        const { data: { publicUrl } } = supabase.storage
            .from('images')
            .getPublicUrl(storagePath);

        console.log(`Updated Public URL: ${publicUrl}`);

        // Update Database
        const { error: dbError } = await supabase
            .from('products')
            .update({ image_url: publicUrl })
            .eq('id', productId);

        if (dbError) throw dbError;

        console.log(`Successfully updated product: ${productName}`);
    } catch (error) {
        console.error(`Error processing ${productName}:`, error.message);
        process.exit(1);
    }
}

const [,, id, name, imgPath] = process.argv;
if (!id || !name || !imgPath) {
    console.error('Usage: node upload_menu_image.js <id> <name> <image_path>');
    process.exit(1);
}

uploadAndUpdate(id, name, imgPath);
