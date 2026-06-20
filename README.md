# MentyTarget

AI-powered target identification platform for psychiatric disorders — built for the Encode Vibe Coding Hackathon.

This is a [Next.js](https://nextjs.org) project bootstrapped with [v0](https://v0.app), connected to a FastAPI backend deployed on [Railway](https://railway.app).

## Built with v0

This repository is linked to a [v0](https://v0.app) project. You can continue developing by visiting the link below -- start new chats to make changes, and v0 will push commits directly to this repo. Every merge to `main` will automatically deploy.

[Continue working on v0 →](https://v0.app/chat/projects/prj_hTGb0bc0sWHKWb7J8D0Snvv9aTfl)

## Architecture

- **Frontend**: Next.js + React + TypeScript, deployed on Vercel
- **Backend**: FastAPI, deployed on Railway
- **Data**: OpenTargets public API for disease-target associations and literature evidence

## Environment Variables

Set the following in your deployment environment (Vercel) or `.env.local` (for local dev):

| Variable | Description | Default |
|---|---|---|
| `NEXT_PUBLIC_API_URL` | URL of the FastAPI backend | `http://localhost:8000` |
| `NEXT_PUBLIC_DEMO_MODE` | Forces bundled demo data regardless of backend availability | `false` |

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

### Running the backend locally

```bash
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

## Learn More

To learn more, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.
- [v0 Documentation](https://v0.app/docs) - learn about v0 and how to use it.
- [FastAPI Documentation](https://fastapi.tiangolo.com) - learn about the backend framework.