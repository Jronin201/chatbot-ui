# Page snapshot

```yaml
- dialog "Unhandled Runtime Error":
  - navigation:
    - button "previous" [disabled]:
      - img "previous"
    - button "next" [disabled]:
      - img "next"
    - text: 1 of 1 unhandled error Next.js (14.1.0) is outdated
    - link "(learn more)":
      - /url: https://nextjs.org/docs/messages/version-staleness
  - button "Close"
  - heading "Unhandled Runtime Error" [level=1]
  - paragraph:
    - text: "Error: Your project's URL and Key are required to create a Supabase client! Check your Supabase project's API settings to find these values"
    - link "https://supabase.com/dashboard/project/_/settings/api":
      - /url: https://supabase.com/dashboard/project/_/settings/api
  - heading "Source" [level=2]
  - link "app/[locale]/layout.tsx (75:4) @ process":
    - text: app/[locale]/layout.tsx (75:4) @ process
    - img
  - text: "73 | const cookieStore = cookies() 74 | const supabase = createServerClient<Database>( > 75 | process.env.NEXT_PUBLIC_SUPABASE_URL!, | ^ 76 | process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, 77 | { 78 | cookies: {"
  - button "Show collapsed frames"
```