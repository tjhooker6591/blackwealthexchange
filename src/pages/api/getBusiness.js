import { MongoClient } from 'mongodb';

export default async function handler(req, res) {
  const { alias } = req.query; // Get alias from query

  // Check if alias is provided
  if (!alias) {
    return res.status(400).json({ error: 'Alias is required' });
  }

  const uri = process.env.MONGO_URI; // MongoDB URI from .env

  // Ensure the Mongo URI is set
  if (!uri) {
    return res.status(500).json({ error: 'Mongo URI is not defined in environment variables' });
  }

  const client = new MongoClient(uri); // MongoDB client initialization

  try {
    // Connect to MongoDB
    await client.connect();
    const database = client.db('bwes-cluster'); // Your database name
    const businessesCollection = database.collection('businesses'); // Your businesses collection

    // Fetch the business from the database using the alias
    const business = await businessesCollection.findOne({ alias });

    // If business is found, send back the data
    if (business) {
      // Optionally, provide default values for missing fields:
      business.description = business.description || 'No description available';
      business.phone = business.phone || 'N/A';
      business.address = business.address || 'Address not available';
      business.image = business.image || '/default-image.jpg'; // Fallback image

      res.status(200).json(business);
    } else {
      // If no business found, return an error
      res.status(404).json({ error: 'Business not found' });
    }
  } catch (error) {
    console.error('Error fetching business:', error);
    res.status(500).json({ error: 'Error fetching business data' });
  } finally {
    await client.close(); // Close the connection after the operation
  }
}