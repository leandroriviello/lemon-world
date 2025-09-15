## Create a Mini App

[Mini apps](https://docs.worldcoin.org/mini-apps) enable third-party developers to create native-like applications within World App.

This template is a way for you to quickly get started with authentication and examples of some of the trickier commands.

## Getting Started

1. cp .env.sample .env.local
2. Follow the instructions in the .env.local file
3. Run `npm run dev`
4. Run `ngrok http 3000`
5. Run `npx auth secret` and paste it into `NEXTAUTH_SECRET` in `.env.local`
6. [Optional] Add your dev origin to `allowedDevOrigins` in `next.config.ts`
7. If using ngrok (dev), set `NEXTAUTH_URL` to your ngrok URL
8. Continue to developer.worldcoin.org and make sure your app is connected to the right ngrok url
9. [Optional] For Verify and Send Transaction to work you need to do some more setup in the dev portal. The steps are outlined in the respective component files.

## Authentication

This starter kit uses [Minikit's](https://github.com/worldcoin/minikit-js) wallet auth to authenticate users, and [next-auth](https://authjs.dev/getting-started) to manage sessions.

## UI Library

This starter kit uses [Mini Apps UI Kit](https://github.com/worldcoin/mini-apps-ui-kit) to style the app. We recommend using the UI kit to make sure you are compliant with [World App's design system](https://docs.world.org/mini-apps/design/app-guidelines).

## Deploy

- Required env vars: `NEXT_PUBLIC_APP_ID`, `NEXTAUTH_SECRET`, `NEXTAUTH_URL`, `HMAC_SECRET_KEY`.
- Set `NEXT_PUBLIC_APP_ENV=production` to disable Eruda in prod.
- Ensure your production domain is added in the World App Dev Portal for your App ID and that Allowed Origins include your domain.
- Docs: https://docs.world.org/mini-apps

## Eruda

[Eruda](https://github.com/liriliri/eruda) is a tool that allows you to inspect the console while building as a mini app. You should disable this in production.

## Contributing

This template was made with help from the amazing [supercorp-ai](https://github.com/supercorp-ai) team.
