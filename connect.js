const { MongoClient } = require("mongodb");
const bcrypt = require("bcrypt");

const uri =
  "mongodb+srv://bwes_admin:M4LmIzY5EjKPODPJ@bwes-cluster.3lko7.mongodb.net/?retryWrites=true&w=majority&appName=BWES-Cluster";

const client = new MongoClient(uri);

async function run() {
  try {
    await client.connect();
    console.log("Connected successfully to MongoDB Atlas!");

    // Access the database and collection
    const database = client.db("bwes-cluster"); // specify the database name
    const collection = database.collection("users"); // specify the collection name

    // Sample user data
    const email = "tjameshooker@gmail.com";
    const plainTextPassword =
      "$2a$10$12i8T1Z3kGJQC7oKc69YZuOHJzAjwbg9tnB5YbODcUo.x3ZCRMDj."; // the password you want to hash

    // Hash the password before storing it
    const hashedPassword = await bcrypt.hash(plainTextPassword, 10); // salt rounds: 10

    // Insert a new user document
    const newUser = {
      email: email,
      password: hashedPassword,
    };

    const result = await collection.insertOne(newUser);
    console.log(`User inserted with ID: ${result.insertedId}`);
  } finally {
    await client.close();
  }
}

run().catch(console.error);
