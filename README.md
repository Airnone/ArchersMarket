# 🏹 Archers Market

**Archers Market** is a full-stack web application built for DLSU students to **buy, sell, and browse** items like textbooks, clothes, gadgets, and more. It provides secure registration, user profiles, listing management, and seller interaction.

---

## 🚀 Features

- 🔐 **Authentication** – Register/login with DLSU credentials
- 👤 **Profile System** – Upload profile pics, contact info, and social links
- 📦 **Product Listings** – Add, view, and manage items with images and categories
- 🔍 **Browse + Filter** – Search by keywords and categories
- 📄 **Product Details** – See item description and seller info
- 🛠️ **Edit Listings** – Sellers can update their posted items
- 📱 **Responsive Design** – Fully mobile-friendly

---

## 🏗️ Tech Stack

### Frontend
- HTML, CSS, JavaScript
- Handlebars (templating engine)

### Backend
- Node.js + Express
- MongoDB (via Mongoose)
- Passport.js (for authentication)
- Multer (file uploads)

---



## 🛠️ Setup Instructions

1. **Clone the repository**  
```bash
git clone https://github.com/airnoners/CCAPDEVFINALS.git
cd CCAPDEVFINALS
```

2. **Install dependencies**  
```bash
npm install
```

3. **Set up environment variables**  
Create a `.env` file in the root with the following:
```
SESSION_SECRET=59c3541857e04dfcf3cbb82664b2689942c2854544586b0a41a6ec0db1abb4b5
MONGO_URI=mongodb+srv://Rhyze:EthosLab89@rashde.rwumx.mongodb.net/archersmarket_db?retryWrites=true&w=majority

```


4. **Run the server**
```bash
npm start
# or
node server.js
```

5. **Visit the site**
```
http://localhost:3000
```

---
##  **Deployed Site Link**

https://ccapdevfinals.onrender.com

---


