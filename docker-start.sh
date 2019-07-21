set -eu
set -o pipefail

node dist/server/src/scripts/env2window.js GRAPHQL_HTTP_HOST,GRAPHQL_WSS_HOST,LOGROCKET_APP > ../client/public/env.js
node dist/server/index.js
