const fs = require('fs');

// Sample arrays for cycling through data
const locations = [
  "Atlanta, GA",
  "New York, NY",
  "Los Angeles, CA",
  "Chicago, IL",
  "Houston, TX",
  "Washington, DC",
  "Detroit, MI",
  "New Orleans, LA",
  "Nashville, TN",
  "Miami, FL"
];

const categories = [
  "Tech",
  "Beauty",
  "Food",
  "Fashion",
  "Consulting",
  "Health",
  "Entertainment",
  "Finance",
  "Education",
  "Real Estate",
  "Agriculture"
];

let csvContent = "Business Name,Location,Category,Description,Email,Phone\n";

// Generate 300 rows of sample data
for (let i = 1; i <= 300; i++) {
  const location = locations[(i - 1) % locations.length];
  const category = categories[(i - 1) % categories.length];
  const businessName = `Black Business ${i}`;
  const description = `A leading Black-owned business in ${category}.`;
  const email = `contact${i}@blackbusiness${i}.com`;
  const phone = `(555) 010-${String(i).padStart(4, '0')}`;
  
  // Wrap values in quotes in case they contain commas
  csvContent += `"${businessName}","${location}","${category}","${description}","${email}","${phone}"\n`;
}

// Write the CSV content to a file
fs.writeFileSync('black_businesses.csv', csvContent);
console.log('CSV file generated: black_businesses.csv');