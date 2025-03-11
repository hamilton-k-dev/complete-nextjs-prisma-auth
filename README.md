# Complete Next.js Prisma Auth

A full-stack authentication system built with Next.js, Prisma, and PostgreSQL. This project supports both credential-based and social logins (Google & GitHub) and includes advanced authentication features such as role-based access control (RBAC), email verification, and two-factor authentication (2FA) via email OTPs.

## Features

- 🔐 **Authentication** with NextAuth.js
- 🔑 **Credential & Social Logins** (Google & GitHub)
- 🎭 **Role-Based Access Control (RBAC)**
- 📧 **Email Verification**
- 🔢 **Two-Factor Authentication (2FA)** via email OTPs
- 📬 **Email Handling** with Resend
- 🚀 **Deployed on Vercel** with Neon as the database

## Tech Stack

- **Frontend:** Next.js (App Router) & TypeScript
- **Backend:** Next.js API routes with Prisma
- **Database:** PostgreSQL (Neon)
- **Authentication:** NextAuth.js
- **Emails:** Resend
- **Deployment:** Vercel

## Installation

Clone the repository and install dependencies:

```sh
git clone https://github.com/your-username/complete-nextjs-prisma-auth.git
cd complete-nextjs-prisma-auth
pnpm install  # or npm install / yarn install
```

## Environment Variables

Create a `.env` file in the root directory and add the following:

```env
DATABASE_URL=your_neon_postgresql_url
NEXTAUTH_SECRET=your_nextauth_secret
NEXTAUTH_URL=http://localhost:3000
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
GITHUB_CLIENT_ID=your_github_client_id
GITHUB_CLIENT_SECRET=your_github_client_secret
RESEND_API_KEY=your_resend_api_key
```

## Running the Project

Start the development server:

```sh
npm dev  # or npm run dev / yarn dev
```

## Database Setup

Run Prisma migrations to set up the database:

```sh
npm prisma migrate dev  # or npx prisma migrate dev
```

## Deployment

This project is deployed on Vercel. To deploy manually, run:

```sh
vercel
```

## Contributing

Contributions are welcome! Feel free to submit issues or pull requests.

## License

This project is open-source under the MIT License.
