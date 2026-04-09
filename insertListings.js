const mongoose = require("mongoose");
const Listing = require("./my-app/models/listing"); 
require("dotenv").config(); 

mongoose
  .connect(process.env.MONGO_URI) 
  .then(async () => {
    console.log("✅ MongoDB Connected");

    const sampleListings = [
      { title: "Calculus Early Transcendentals", description: "Like new condition, 8th edition", price: 950, image: "images/textbook.jpg", seller: "Maria Santos", date: "2025-02-08", category: "textbooks" },
      { title: "DLSU Windbreaker", description: "Size M, worn once", price: 1500, image: "images/uniform.jpg", seller: "John Lim", date: "2025-02-09", category: "clothes" },
      { title: "Casio fx-991ES Plus", description: "Perfect working condition", price: 1000, image: "images/calculator.jpg", seller: "Ana Reyes", date: "2025-02-09", category: "electronics" },
      { title: "Engineering Drawing Set", description: "Complete set, barely used", price: 600, image: "images/drawing-set.jpg", seller: "Mike Tan", date: "2025-02-08", category: "supplies" },
      { title: "Business Statistics Textbook", description: "2023 Edition, highlights on key chapters", price: 950, image: "images/business-book.jpg", seller: "Sarah Garcia", date: "2025-02-07", category: "textbooks" }
    ];

    await Listing.insertMany(sampleListings);
    console.log("✅ Sample Listings Inserted");

    mongoose.connection.close();
  })
  .catch(err => console.error("❌ MongoDB Error:", err));
