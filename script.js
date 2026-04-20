const ADDRESS = "bc1qxmq7wzaa4pnzv56d3cy66lxjfdnnkgzg4l0z03";
const SATOSHIS_IN_BTC = 100000000;

const btcBalanceEl = document.getElementById("btcBalance");
const eurBalanceEl = document.getElementById("usdBalance");
const statusTextEl = document.getElementById("statusText");
const refreshBtn = document.getElementById("refreshBtn");

function formatBtc(amount) {
  return `${amount.toLocaleString("fr-FR", {
    minimumFractionDigits: 4,
    maximumFractionDigits: 4
  })} BTC`;
}

function formatUsd(amount) {
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 2
  }).format(amount);
}

function toBtc(sats) {
  return sats / SATOSHIS_IN_BTC;
}

async function fetchAddressBalanceInSats(address) {
  const response = await fetch(`https://mempool.space/api/address/${address}`);
  if (!response.ok) {
    throw new Error("Impossible de récupérer le solde blockchain.");
  }

  const payload = await response.json();
  const confirmed = payload.chain_stats.funded_txo_sum - payload.chain_stats.spent_txo_sum;
  const mempool = payload.mempool_stats.funded_txo_sum - payload.mempool_stats.spent_txo_sum;
  return confirmed + mempool;
}

async function fetchBtcPriceEur() {
  const response = await fetch("https://api.coinbase.com/v2/prices/BTC-EUR/spot");
  if (!response.ok) {
    throw new Error("Impossible de récupérer le prix BTC/EUR.");
  }

  const payload = await response.json();
  const raw = Number.parseFloat(payload?.data?.amount);
  if (!Number.isFinite(raw)) {
    throw new Error("Prix BTC/EUR invalide.");
  }

  return raw;
}

async function refreshBalances() {
  refreshBtn.disabled = true;
  statusTextEl.textContent = "Mise à jour en cours...";

  try {
    const [balanceSats, btcPriceEur] = await Promise.all([
      fetchAddressBalanceInSats(ADDRESS),
      fetchBtcPriceEur()
    ]);

    const balanceBtc = toBtc(balanceSats);
    const balanceEur = balanceBtc * btcPriceEur;

    btcBalanceEl.textContent = formatBtc(balanceBtc);
    eurBalanceEl.textContent = formatUsd(balanceEur);
    statusTextEl.textContent = new Date().toLocaleString("fr-FR");
  } catch (error) {
    btcBalanceEl.textContent = "Erreur";
    eurBalanceEl.textContent = "Erreur";
    statusTextEl.textContent = error instanceof Error ? error.message : "Erreur inattendue.";
  } finally {
    refreshBtn.disabled = false;
  }
}

refreshBtn.addEventListener("click", refreshBalances);
refreshBalances();
