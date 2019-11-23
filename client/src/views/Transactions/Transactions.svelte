<script>
  import Icon from '../../components/Icon.svelte';
</script>

<section class="m-auto max-w-3xl">
  <div class="flex">
    <div class="p-2 mr-3">
      <a href="/editTxn">
        <Icon prefix="fas" icon="plus" />
      </a>
    </div>

    <input class="border w-full" placeholder="Search by payee, date, amount, memo" />
  </div>
</section>
