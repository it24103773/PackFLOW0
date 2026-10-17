# PackFlow - Smart Packaging Management Solutions

**PackFlow** is a comprehensive Packaging Management System designed for modern packaging manufacturers, commercial printing presses, and box converters.

---

## 🚀 Application Overview

- **Tagline**: *"Smart Packaging Management Solutions"*
- **Frontend URL**: `http://localhost:5173`
- **Backend REST API**: `http://localhost:8080`

---

## 🛠️ Architecture & Tech Stack

### Frontend (`/frontend`)
- **Core**: React 18 / 19, Vite
- **Routing**: React Router DOM (`/`, `/login`, `/register`)
- **Icons**: Lucide React
- **Design & Styling**: Custom Vanilla CSS with modern design tokens (Navy Blue `#0F4C81`, Amber `#F59E0B`, Glassmorphism, smooth animations, and rounded cards)

### Backend (`/backend`)
- **Language**: Java 17+ / 24
- **Framework**: Spring Boot 3.x
- **Build Tool**: Maven (with Maven Wrapper `mvnw.cmd`)
- **API Protocol**: REST API with CORS configured for `http://localhost:5173`
- **Database Readiness**: Standalone H2 in-memory DB configuration pre-configured with JPA entity layers, fully prepared for future MySQL integration.

---

## 📖 Available Routes

| Route | Page / View | Description |
| :--- | :--- | :--- |
| `/` | **Landing Page** | Corporate home page with Hero, 4 Service cards, Why Choose Us, About, & Contact form |
| `/login` | **Login Page** | Styled client login form with Email, Password, Remember Me, and Forgot Password |
| `/register` | **Register Page** | Styled client registration form with Full Name, Email, Password, and Confirm Password |

---


### 1. Run the Frontend (Vite)

```powershell
cd frontend
npm install
npm run dev
```

The frontend will be live at `http://localhost:5173`.

### 2. Run the Backend (Spring Boot)

```powershell
cd backend
mvn spring-boot:run
```

The backend REST API will be live at `http://localhost:8080`.
- Health Endpoint: `http://localhost:8080/api/health`
- Services Endpoint: `http://localhost:8080/api/services`
- System Info: `http://localhost:8080/api/info`

---

## 🔮 Scalability & Future Expansion Plan

PackFlow is structured to seamlessly support future business modules without altering the landing page:

1. **Authentication & Authorization** (JWT, Spring Security)
2. **Admin Dashboard**
3. **Product Management & Packaging Specs**
4. **Packaging Orders & Die-Line Workflow**
5. **Inventory & Substrate Tracking**
6. **Supplier & Client CRM** (Supplier Directory, Inquiries, Previous Material History Table)
7. **Production Reports & Analytics**
8. **MySQL Database Integration** (`material_history`, `suppliers`, `inventory`, `orders`)