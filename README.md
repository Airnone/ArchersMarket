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


# 🏹 Archers Market: Secure Campus Marketplace

**Deployed Application:** .

## 📌 Project Overview
Archers Market is a dedicated, full-stack e-commerce platform designed exclusively for the university community. The platform provides a trusted, responsive environment for verified students to securely buy, sell, and browse essential items such as textbooks, electronics, clothing, and school supplies. 

The project is currently undergoing an enterprise-grade security hardening phase, emphasizing robust user data protection, strict access control, and comprehensive system auditing to ensure a safe marketplace ecosystem.

## 🛠️ Technology Stack
**Frontend:**
* HTML5, CSS3, Vanilla JavaScript
* Handlebars (hbs) templating engine
* Fully responsive, mobile-friendly design

**Backend & Database:**
* Node.js, Express.js
* MongoDB (via Mongoose)
* Multer (for secure file and image uploads)

**Authentication & Security:**
* Passport.js, bcryptjs, express-session

## ✨ Current Features
* **Exclusive Community Access:** Registration is strictly gated. Users must authenticate using valid university credentials.
* **Profile System:** Integrated user profiles displaying contact information, social links, and secure profile picture uploads.
* **Marketplace Operations:** Users can securely add, view, edit, and delete product listings equipped with image handling.
* **Dynamic Browsing:** Search functionality allowing users to filter items by keywords and distinct categories.

## 🛡️ Security Architecture & Roadmap

To maintain the integrity of the platform, the following strict security controls are actively being implemented:

### 1. Identity & Access Management (IAM)
The application utilizes a strict Role-Based Access Control (RBAC) model with three distinct tiers:
* **Administrator:** Highest privilege level. Capable of managing elevated accounts and has exclusive read-only access to system audit logs.
* **Moderator:** Elevated permissions to moderate marketplace listings and manage standard users within a designated scope.
* **Standard User:** Restricted to viewing public data and modifying only their own created listings and personal data.
* *Design Principle:* All access controls are centralized and designed to fail securely by default.

### 2. Advanced Authentication & Account Protection
* **Brute Force Mitigation:** Accounts are automatically locked for a specified duration after 5 consecutive invalid login attempts.
* **Password Policies:** Strict enforcement of password complexity and length requirements.
* **Credential Rotation:** Prevention of password re-use by tracking password history, paired with a temporal restriction (passwords must be at least 1 day old before subsequent changes).
* **Step-Up Authentication:** Users are prompted to re-authenticate before performing sensitive operations (e.g., changing credentials or deleting accounts).
* **Activity Monitoring:** Users are notified of their last successful and unsuccessful login attempts upon their next session initialization.
* **Secure Feedback:** Authentication failures return generic, non-descriptive error messages to prevent user enumeration attacks.

### 3. Strict Data Validation
* **Zero-Sanitization Rejection:** All input validation failures result in immediate request rejection. The system does not attempt to sanitize or guess malicious input.
* **Boundary Checks:** Comprehensive enforcement of data types, minimum/maximum lengths, and value ranges across all database schemas and API endpoints.

### 4. Audit Logging & System Resilience
* **Comprehensive Audit Trails:** Persistent, filterable database logging for all authentication attempts, access control violations, and input validation failures.
* **Secure Error Handling:** Custom error pages and generic fault handlers strictly prevent the leakage of stack traces or internal debugging information to the end-user.

## 🚀 Local Setup & Installation

**1. Clone the repository**
```bash
```

2. **Install dependencies**  
```bash
npm install
```

3. Configure Environment Variables
Create a .env file in the root directory and populate it with your environment-specific credentials:
```
SESSION_SECRET=your_secure_session_secret
MONGO_URI=your_mongodb_connection_string
```
(Note: Never commit your actual .env file containing production secrets to version control).

4. **Initialize the Server**
```bash
npm start
# or
node server.js
```
The server will initialize and bind to http://localhost:3000.
---


