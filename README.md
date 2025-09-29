## Lemon Planet — Mini App (World App)

Aplicación de envío de WLD y calculadora (USDT/ARS/COP), optimizada para correr dentro de World App como Mini App.

### Funcionalidades
- Enviar WLD: abre el formulario nativo en World App (MiniKit pay) con destino/monto precargados.
- Instructivo con video fullscreen y CTA “Abrir app de Lemon” con deeplink y fallbacks.
- Calculadora: convierte WLD a USDT, ARS o COP usando Coingecko. Valores estimados.
- UI mobile, dark mode forzado, botones amarillos.

## Getting Started

1. `cp .env.sample .env.local`
2. Completar `.env.local` (ver sección Env).
3. `npm install`
4. `npm run dev`
5. Exponer con `ngrok http 3000` (o similar) y configurar la URL en el Dev Portal de World App para tu `APP_ID`.

## Env vars

- `NEXT_PUBLIC_APP_ID`: App ID del Dev Portal de World App.
- `NEXTAUTH_SECRET`: generar con `npx auth secret`.
- `NEXTAUTH_URL`: URL pública (ngrok en dev, dominio en prod).
- `HMAC_SECRET_KEY`: `openssl rand -base64 32`.
- `NEXT_PUBLIC_APP_ENV`: `production` desactiva Eruda.
- `NEXT_PUBLIC_MOCK`: `true` simula `pay` fuera de World App.
- Deeplink fallbacks (opcionales):
  - `NEXT_PUBLIC_LEMON_FALLBACK_URL` (default `https://lemon.me`)
  - `NEXT_PUBLIC_LEMON_IOS_STORE_URL` (default App Store Lemon)
  - `NEXT_PUBLIC_LEMON_ANDROID_STORE_URL` (default Play Store Lemon)

### Balance on-chain (WLD)

El backend consulta el balance ERC‑20 por `balanceOf` sobre redes configuradas. Soporta:
- World Chain: `WORLDCHAIN_RPC_URL` + `WLD_CONTRACT_WORLDCHAIN`
- Optimism: `ALCHEMY_OPT_RPC_URL` + `WLD_CONTRACT_OPTIMISM`
- Base: `ALCHEMY_BASE_RPC_URL` + `WLD_CONTRACT_BASE`
- Ethereum: `ALCHEMY_ETH_RPC_URL` + `WLD_CONTRACT_ETHEREUM`

Notas:
- La búsqueda prioriza: World Chain → Optimism → Base → Ethereum.
- Si una red no tiene RPC o contrato configurado, se omite.
- `WLD_DECIMALS` (default `18`).

### Historial on-chain

Para leer transferencias del token se usan endpoints con API estilo Etherscan/Blockscout.
- World Chain (preferido): `WORLDCHAIN_API_URL` (p.ej. `https://worldscan.org/api`), opcional `WORLDCHAIN_API_KEY`, `WLD_CONTRACT_WORLDCHAIN`.
- Base (fallback): `BASESCAN_API_URL`, `BASESCAN_API_KEY`, `WLD_CONTRACT_BASE`.
- Optimism (opcional): `OPTIMISM_API_URL`, `OPTIMISM_API_KEY`, `WLD_CONTRACT_OPTIMISM`.

Para abrir el explorador desde la UI:
- `NEXT_PUBLIC_WORLDCHAIN_EXPLORER_URL` (p.ej. `https://worldscan.org`), si no está se usa `NEXT_PUBLIC_BASE_EXPLORER_URL`.

## Deploy

- Required env vars: `NEXT_PUBLIC_APP_ID`, `NEXTAUTH_SECRET`, `NEXTAUTH_URL`, `HMAC_SECRET_KEY`.
- Set `NEXT_PUBLIC_APP_ENV=production` to disable Eruda in prod.
- Ensure your production domain is added in the World App Dev Portal for your App ID and that Allowed Origins include your domain.
- Docs: https://docs.world.org/mini-apps

### Optional deeplink fallbacks
- `NEXT_PUBLIC_LEMON_FALLBACK_URL` (default `https://lemon.me`)
- `NEXT_PUBLIC_LEMON_IOS_STORE_URL` (default `https://apps.apple.com/co/app/lemon-cash-tu-wallet-crypto/id1499421511`)
- `NEXT_PUBLIC_LEMON_ANDROID_STORE_URL` (default `https://play.google.com/store/apps/details?id=com.applemoncash`)

## Arquitectura

- `src/app/layout.tsx`: inicializa MiniKit (`MiniKit.install`) y wraps con providers.
- `src/app/page.tsx`: toggle ENVIAR / CALCULADORA.
- `src/components/SendOrCalc`: toggle superior y render condicional.
- `src/components/Pay`: formulario de envío con validación EIP‑55, “Pegar”, instructivo y botón amarillo.
- `src/components/Calc`: conversor WLD -> USDT/ARS/COP via Coingecko.
- `src/app/api/initiate-payment`: referencia local.
- `src/app/api/confirm-payment`: mock de confirmación.

## Notas

- El `pay` abre el sheet de World App solo dentro de la app. Fuera de World App se deshabilita con hint, o se puede usar `NEXT_PUBLIC_MOCK=true` para pruebas.
- Instructivo: video a pantalla completa, botón para abrir Lemon con deeplink; si no se detecta la app, abre tienda (market:// en Android o URL web) o `lemon.me`.
- Calculadora: se actualiza cada 60s. Si `usdt` no estuviera disponible, se usa `usd` como aproximación.
