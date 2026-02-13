# PostHog Post-Wizard Report

The wizard has completed a deep integration of PostHog analytics into your Minstrel project. This integration provides comprehensive tracking of user authentication, practice sessions, drill engagement, and AI feature usage across both client-side and server-side contexts.

## Integration Summary

The following changes were made to integrate PostHog:

1. **Client-Side Initialization** (`src/instrumentation-client.ts`)
   - PostHog is initialized alongside Sentry using the modern Next.js 15.3+ `instrumentation-client.ts` pattern
   - Configured with reverse proxy (`/ingest`) to avoid ad blockers
   - Exception capture enabled for automatic error tracking

2. **Server-Side Client** (`src/lib/posthog-server.ts`)
   - Created singleton PostHog Node.js client for API routes
   - Configured for immediate flushing (suitable for short-lived serverless functions)

3. **Analytics Helpers** (`src/lib/analytics.ts`)
   - Updated with helper functions: `capture`, `identify`, `reset`, `captureException`
   - Session and distinct ID helpers for cross-platform event correlation

4. **Reverse Proxy Configuration** (`next.config.ts`)
   - Added rewrites to proxy `/ingest/*` requests to PostHog EU servers
   - Enables analytics collection even when ad blockers are active

## Instrumented Events

| Event Name                   | Description                                     | File                                       |
| ---------------------------- | ----------------------------------------------- | ------------------------------------------ |
| `user_signed_up`             | User successfully submitted the sign-up form    | `src/components/sign-up-form.tsx`          |
| `user_logged_in`             | User successfully logged in with email/password | `src/components/login-form.tsx`            |
| `user_logged_out`            | User clicked the logout button                  | `src/components/logout-button.tsx`         |
| `api_key_saved`              | User saved their AI provider API key            | `src/features/auth/api-key-prompt.tsx`     |
| `api_key_removed`            | User removed their AI provider API key          | `src/features/auth/api-key-prompt.tsx`     |
| `practice_session_started`   | User started a new practice/recording session   | `src/features/session/session-recorder.ts` |
| `practice_session_completed` | User completed a practice session               | `src/features/session/session-recorder.ts` |
| `mode_switched`              | User switched between session modes             | `src/features/modes/mode-switcher.tsx`     |
| `drill_started`              | User started a targeted practice drill          | `src/components/drill-controller.tsx`      |
| `drill_completed`            | User completed a practice drill                 | `src/components/drill-controller.tsx`      |
| `ai_chat_message_sent`       | User sent a message in the AI chat panel        | `src/components/ai-chat-panel.tsx`         |
| `ai_drill_generated`         | Server-side: AI generated a drill               | `src/app/api/ai/drill/route.ts`            |
| `ai_analysis_completed`      | Server-side: AI analysis completed              | `src/app/api/ai/analyze/route.ts`          |

## Next Steps

We've built some insights and a dashboard for you to keep an eye on user behavior, based on the events we just instrumented:

### Dashboard

- **Analytics Basics**: [https://eu.posthog.com/project/126570/dashboard/523869](https://eu.posthog.com/project/126570/dashboard/523869)

### Insights

- **User Authentication Trends**: [https://eu.posthog.com/project/126570/insights/Meo1y9lY](https://eu.posthog.com/project/126570/insights/Meo1y9lY)
- **User Activation Funnel**: [https://eu.posthog.com/project/126570/insights/axb2IQzh](https://eu.posthog.com/project/126570/insights/axb2IQzh)
- **Practice Session Activity**: [https://eu.posthog.com/project/126570/insights/i19UEm9C](https://eu.posthog.com/project/126570/insights/i19UEm9C)
- **AI Feature Usage**: [https://eu.posthog.com/project/126570/insights/a0g1S7X1](https://eu.posthog.com/project/126570/insights/a0g1S7X1)
- **Drill Engagement**: [https://eu.posthog.com/project/126570/insights/ofIezTPO](https://eu.posthog.com/project/126570/insights/ofIezTPO)

### Environment Variables

Add these to your `.env.local` file (already configured by this integration):

```bash
NEXT_PUBLIC_POSTHOG_KEY=phc_6Oz5gujnnAh7nFBfGx25Rrb6isalbQx6zwwevCCpEyM
NEXT_PUBLIC_POSTHOG_HOST=https://eu.i.posthog.com
```

### Agent Skill

We've left an agent skill folder in your project at `.claude/skills/posthog-integration-nextjs-app-router/`. You can use this context for further agent development when using Claude Code. This will help ensure the model provides the most up-to-date approaches for integrating PostHog.
