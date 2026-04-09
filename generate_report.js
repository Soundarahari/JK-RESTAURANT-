
import fs from 'fs';

const products = JSON.parse(fs.readFileSync('products_list.json', 'utf8').replace(/^\uFEFF/, ''));
const placeholders = products.filter(p => p.image_url.includes('unsplash.com'));
const updated = products.filter(p => !p.image_url.includes('unsplash.com'));

let report = `# Product Image Status Report\n\n`;
report += `Total Products: ${products.length}\n`;
report += `Updated: ${updated.length}\n`;
report += `Needs Update: ${placeholders.length}\n\n`;

report += `## Products Needing Images\n\n`;
const categories = [...new Set(placeholders.map(p => p.category))];

categories.forEach(cat => {
    report += `### ${cat}\n`;
    const catProducts = placeholders.filter(p => p.category === cat);
    catProducts.forEach(p => {
        report += `- [ ] ${p.name} (${p.description})\n`;
    });
    report += `\n`;
});

fs.writeFileSync('product_image_status.md', report);
console.log('Status report generated: product_image_status.md');
