set -eu
set -o pipefail

node dist/server/src/scripts/env2window.js GRAPHQL_HTTP_HOST,GRAPHQL_WSS_HOST,LOGROCKET_APP,USE_POUCH,COUCHDB,POUCH_ONLY,ALERT_ON_ERROR,DISABLE_SERVICE_WORKER,PLAID_PUBLIC_KEY,PLAID_ENV,SITE_URL,SENTRY_DSN > ../client/public/env.js
node dist/server/index.js
