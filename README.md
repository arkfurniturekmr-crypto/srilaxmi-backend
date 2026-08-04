# Sri Laxmi Timber — Quotation Backend

Node.js + Express API that receives Timber Estimation Calculator data from the website, generates a professional branded PDF quotation with PDFKit, stores it on disk (organised by date), and returns a download link.

This is a **separate project** from the static website. GitHub Pages only serves static files — it **cannot** run this server. Deploy this to a Node-capable host (see [Deployment](#deployment)).

## Project structure

```
srilaxmi-backend/
├── src/
│   ├── config/env.js            # loads + validates all environment variables
│   ├── routes/quotationRoutes.js
│   ├── controllers/quotationController.js   # HTTP layer only
│   ├── services/
│   │   ├── quotationService.js  # orchestration: ID + folders + calls pdfService
│   │   └── pdfService.js        # pure PDFKit rendering
│   ├── validators/quotationValidator.js
│   ├── middleware/errorHandler.js, notFound.js
│   ├── utils/idGenerator.js, asyncHandler.js
│   └── index.js                 # app entry point
├── assets/company-logo.png      # used in the PDF header — replace anytime, same filename
├── storage/quotations/YYYY-MM-DD/*.pdf   # generated PDFs, gitignored
├── .env.example
└── package.json
```

## Setup

```bash
cd srilaxmi-backend
npm install
cp .env.example .env
# edit .env — at minimum set CORS_ORIGIN to your real website domain(s)
npm start
```

Server runs on `http://localhost:4000` by default (`npm run dev` for auto-restart on changes).

## Environment variables (`.env`)

| Variable | Purpose |
|---|---|
| `PORT` | Port the API listens on |
| `NODE_ENV` | `development` or `production` |
| `BASE_URL` | Public URL of **this backend** once deployed — used to build PDF download links |
| `CORS_ORIGIN` | Comma-separated list of allowed frontend origins |
| `STORAGE_DIR` | Folder where generated PDFs are saved |

## API

### `POST /api/quotation`

Request body — exactly what the frontend's `buildQuotationObject()` already produces:

```json
{
  "customer": { "name": "...", "mobile": "...", "village": "...", "state": "..." },
  "categories": [
    {
      "key": "bt",
      "name": "Balarshah Teak Wood (B.T.) Full Colour",
      "rows": [{ "sNo": 1, "pieces": 4, "lengthFt": 10, "widthIn": 6, "girthIn": 6, "cft": 10.0 }],
      "totals": { "pieces": 4, "cft": 10.0 }
    }
  ],
  "grandTotals": { "pieces": 4, "cft": 10.0 }
}
```

Success response (`201`):
```json
{
  "success": true,
  "message": "Quotation generated successfully.",
  "quotationId": "SL-20260804-A8A8A8",
  "fileName": "SL-20260804-A8A8A8.pdf",
  "downloadUrl": "https://your-backend-url/quotations/2026-08-04/SL-20260804-A8A8A8.pdf",
  "generatedAt": "2026-08-04T20:48:11.919Z"
}
```

Validation failure (`400`): `{ "success": false, "message": "...", "errors": ["..."] }`

### `GET /quotations/:date/:filename`
Direct static download link for a previously generated PDF (this is what `downloadUrl` points to).

### `GET /health`
Simple uptime check — returns `{ status: "ok", timestamp }`.

## Deployment

Any Node.js host works — Render, Railway, Fly.io, a VPS with PM2, etc. Rough steps for **Render** (free tier, simplest for this project size):

1. Push this `srilaxmi-backend` folder to its own GitHub repo (or a subfolder of an existing one)
2. Render → New → Web Service → connect the repo
3. Build command: `npm install` · Start command: `npm start`
4. Add the environment variables from `.env.example` in Render's dashboard (set `BASE_URL` to the `.onrender.com` URL Render gives you, `CORS_ORIGIN` to `https://srilaxmisawmill.com,https://www.srilaxmisawmill.com`)
5. Deploy — copy the live URL

**Important:** generated PDFs are stored on local disk. Most free hosts (including Render's free tier) use **ephemeral storage** — files can be wiped on redeploy/restart. For anything beyond testing, either upgrade to a plan with a persistent disk, or swap `quotationService.js` to upload to S3/Cloudinary/similar instead of `fs` — the service layer is isolated specifically so that swap doesn't touch validation, PDF rendering, or the controller.

## Connecting the frontend

Once deployed, open `assets/js/calculator.js` on the website and set:

```js
const QUOTATION_API_URL = "https://your-deployed-backend-url/api/quotation";
```

That's the only change needed — the rest of the integration is already wired in.

## Extending next (WhatsApp stage)

`quotationService.js` returns `{ quotationId, fileName, filePath, downloadUrl }` after every successful generation — everything a WhatsApp-send step needs (e.g. to attach the PDF or share the link) without touching PDF rendering or validation.
