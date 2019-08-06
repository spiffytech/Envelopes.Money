<script>
  import {getContext} from 'svelte';

  const credsStore = getContext('credsStore');
  const syncStore = getContext('syncStore');
</script>

<style>
  nav ul {
    list-style: none;
    margin: 0;
    padding-left: 0;
  }

  nav li {
    display: block;
    transition-duration: 0.5s;
    float: left;
    padding: 1rem;
    position: relative;
  }

  nav li:hover,
  nav li:focus {
    cursor: pointer;
  }

  nav ul li ul {
    visibility: hidden;
    opacity: 0;
    position: absolute;
    transition: all 0.5s ease;
    margin-top: 1rem;
    right: 0;
    display: none;
  }

  nav:hover ul li > ul,
  nav:focus ul li > ul,
  nav:active ul li > ul
  {
    visibility: visible;
    opacity: 1;
    display: block;
  }

  nav ul li ul li {
    clear: both;
    width: 100%;
  }

  nav a {
    text-decoration: none;
  }
</style>

<div class="stripe bg-orange h-1" />
<div
  class="bg-white border border-t-0 border-grey-light rounded flex justify-between
  flex-wrap nav mb-2"
  role="banner"
  aria-label="nav">
  <div class="flex">
    <a class="btn font-bold" href="/home" data-cy='home-button' role="heading" aria-level="1">Envelopes.Money</a>

    <a href="mailto:hello@envelopes.money?subject=Re%3A%20Feedback&body=" class="btn" role="button">Say hello!</a>

    {#if $syncStore === 'syncing'}<p>⌛</p>{/if}
    <!--<p>❗</p>-->
  </div>

  <nav class="bg-orange" data-cy="nav-buttons" aria-label="menu">
    <ul>
      <li class="bg-orange">
        <a class="text-orange-darkest" href="/editTxn" data-cy="new-transaction">
          New Transaction
        </a>
      </li>

      <li aria-haspopup="true" class="bg-orange">
        More
        <ul aria-label="submenu">
          <li class="bg-orange">
            <a class="text-orange-darkest" href="/fill" data-cy="fill-envelopes">
              Fill Envelopes
            </a>
          </li>
          <li class="bg-orange">
            <a
              class="text-orange-darkest"
              href="/editAccount"
              data-cy="new-account">
              New Account
            </a>
          </li>
          <li class="bg-orange">
            <a class="text-orange-darkest" href="/editTags" data-cy="edit-tags">
              Edit Tags
            </a>
          </li>
          <li class="bg-orange">
            {#if $credsStore === null}
              <a class="text-orange-darkest" href="/login">Log In</a>
            {:else}
              <a class="text-orange-darkest" href="/logout">{$credsStore.email}</a>
            {/if}
          </li>
        </ul>
      </li>
    </ul>
  </nav>
</div>
