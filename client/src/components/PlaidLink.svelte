<script>
  import axios from 'axios';

  import { endpoint } from '../lib/config';

  export let accountId;

  let publicToken = null;

  function openPlaid(e) {
    e.preventDefault();

    const plaid = Plaid.create({
      clientName: 'Plaid Quickstart',
      env: window._env_.PLAID_ENV,
      key: window._env_.PLAID_PUBLIC_KEY,
      product: ['transactions'],
      // Optional – use webhooks to get transaction and error updates
      webhook: `${window._env_.SITE_URL}/webhooks/plaid`,
      onLoad: function() {
        // Optional, called when Link loads
      },
      async onSuccess(public_token) {
        // Send the public_token to your app server.
        // The metadata object contains info about the institution the
        // user selected and the account ID or IDs, if the
        // Select Account view is enabled.
        publicToken = public_token;
        await axios.post(
          `${endpoint}/api/plaid/getAccessToken`,
          {publicToken, accountId},
          {withCredentials: true}
        );
      },
      onExit: function(err) {
        // The user exited the Link flow.
        if (err != null) {
          // The user encountered a Plaid API error prior to exiting.
          throw err;
        }
        // metadata contains information about the institution
        // that the user selected and the most recent API request IDs.
        // Storing this information can be helpful for support.
      },
    });

    plaid.open();
  }
</script>

<p>Hello, plaid</p>

<button on:click={openPlaid} class="btn btn-secondary">Link bank account</button>
<button on:click={(e) => {
  e.preventDefault(); axios.post(
    `${endpoint}/api/plaid/getAccessToken`, {publicToken, accountId}, {withCredentials: true}
    )
  }} class="btn btn-secondary">Resend thingy</button>
