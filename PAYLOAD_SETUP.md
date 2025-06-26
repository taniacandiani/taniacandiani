# Payload CMS with PostgreSQL on Railway

This project has been set up with Payload CMS using PostgreSQL as the database, ready for deployment on Railway.

## Local Development

### Prerequisites
- Node.js 18 or higher
- pnpm
- Docker and Docker Compose

### Setup

1. **Clone and install dependencies:**
```bash
git clone <your-repo>
cd taniacandiani
pnpm install
```

2. **Start local development with Docker:**
```bash
docker-compose up -d
```

This will start:
- PostgreSQL database on port 5432
- Next.js app with Payload CMS on port 3000

3. **Access the admin panel:**
   - Visit http://localhost:3000/admin
   - Create your first admin user

### Development Scripts

```bash
# Start development server
pnpm dev

# Generate TypeScript types from Payload config
pnpm generate:types

# Run Payload CLI commands
pnpm payload --help
```

## Railway Deployment

### 1. Create Railway Project

1. Go to [Railway](https://railway.app)
2. Create a new project
3. Add a PostgreSQL database service
4. Connect your GitHub repository

### 2. Environment Variables

Set these environment variables in your Railway project:

**From PostgreSQL Service (Railway provides these automatically):**
- `PGHOST`
- `PGPORT` 
- `PGDATABASE`
- `PGUSER`
- `PGPASSWORD`

**Manual Configuration:**
```bash
# Use Railway's internal database URL
DATABASE_URL=${{Postgres.DATABASE_URL}}

# Generate a secure secret key (use: openssl rand -base64 32)
PAYLOAD_SECRET=your-secure-secret-key-here

# Your Railway app URL
NEXT_PUBLIC_SERVER_URL=https://your-app-name.railway.app
```

### 3. Deploy

Railway will automatically build and deploy your Docker container when you push to the main branch.

### 4. Initialize Database

After first deployment:
1. Go to your Railway project
2. Open the web service logs
3. The database tables will be created automatically on first startup

## File Structure

```
├── src/
│   ├── collections/          # Payload CMS collections
│   │   ├── Users.ts
│   │   ├── Media.ts
│   │   ├── Pages.ts
│   │   └── Posts.ts
│   ├── app/
│   │   ├── (payload)/
│   │   │   ├── admin/        # Admin UI routes
│   │   │   └── api/          # API routes
│   │   └── api/health/       # Health check endpoint
│   └── payload.config.ts     # Payload configuration
├── Dockerfile                # Multi-stage Docker build
├── docker-compose.yml        # Local development
├── railway.toml              # Railway configuration
└── .env.example              # Environment variables template
```

## Collections

The setup includes these collections:

- **Users** - Authentication and user management
- **Media** - File uploads with image resizing
- **Pages** - Static pages with rich text content
- **Posts** - Blog posts with categories and tags

## Customization

To customize the CMS:

1. **Modify collections** in `src/collections/`
2. **Update configuration** in `src/payload.config.ts`
3. **Regenerate types** with `pnpm generate:types`

## Troubleshooting

### Database Connection Issues
- Ensure PostgreSQL is running (local development)
- Check environment variables are set correctly
- Verify Railway database service is running

### Build Issues
- Make sure all dependencies are installed
- Check that TypeScript compilation succeeds
- Verify Docker build completes successfully

### Admin Access
- Create first admin user via the admin panel
- Use the credentials to access `/admin`
- Check that PAYLOAD_SECRET is set and consistent

## Production Considerations

1. **Media Storage**: Configure cloud storage (AWS S3, Cloudinary) for production
2. **Email**: Set up SMTP credentials for user management emails
3. **Security**: Use strong PAYLOAD_SECRET and enable HTTPS
4. **Backups**: Set up automated PostgreSQL backups
5. **Monitoring**: Add logging and monitoring services 