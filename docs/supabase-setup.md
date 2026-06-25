# Supabase setup

Booker is prepared to use Supabase, but this step does not connect the app screens to live data yet.

## Local environment

Create a local `.env` file at the project root and add:

```bash
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
```

You can find these values in your Supabase project settings under API.

## Safety

Never commit real Supabase keys to GitHub.

Keep real values only in local `.env` files or in your deployment provider environment variables. The repository should only contain `.env.example` with empty placeholders.

Do not commit service role keys to the frontend. Service role keys are secret server-side credentials.
