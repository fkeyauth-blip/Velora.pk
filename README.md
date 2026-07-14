# VELORA.PK - PostgreSQL Version

Premium fashion e-commerce platform with PostgreSQL persistent storage.

## NEW FEATURE: Size Guide Control ✨

When adding/editing products in admin:
- **Checkbox:** "Show Size Guide?"
- **Logic:** If no sizes added OR checkbox unchecked → Size guide won't display on product
- **Auto-detect:** If sizes = empty, size guide automatically disabled

## Setup

```bash
cd backend
npm install
npm start
```

**Access:**
- Storefront: http://localhost:4000
- Admin: http://localhost:4000/admin
- Admin Key: maison-admin-2026

## PostgreSQL Setup

Set `DATABASE_URL` in `.env`:
```
DATABASE_URL=postgresql://user:password@host:5432/velora
```

For Render:
1. Create PostgreSQL database
2. Copy connection string
3. Paste in Render env vars

## Features

- ✅ Persistent PostgreSQL database
- ✅ 12 seed products
- ✅ NEW: Size guide on/off control per product
- ✅ Mobile responsive
- ✅ Customer auth
- ✅ Order management
- ✅ Admin dashboard

## Merchants

- EasyPaisa: abdulhaseeb (03015269322)
- JazzCash: abdulhaseeb (03015269322)
- Cash on Delivery: Auto-confirmed

