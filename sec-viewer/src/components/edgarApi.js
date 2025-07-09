const PROXY_BASE = "http://localhost:4000/api";

export async function getLatestReportsByCIK(cik, year = 2025) {
  const url = `${PROXY_BASE}/sec/${cik}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error("Failed to fetch submissions");
  const data = await res.json();

  const filings = data.filings?.recent;
  if (!filings) return [];

  const filtered = [];
  for (let i = 0; i < filings.form.length; i++) {
    const form = filings.form[i];
    const date = filings.filingDate[i];
    if (
      (form === "10-K" || form === "10-Q") &&
      date.startsWith(year.toString())
    ) {
      filtered.push({
        form,
        date,
        accession: filings.accessionNumber[i],
      });
    }
  }
  filtered.sort((a, b) => b.date.localeCompare(a.date));
  return filtered;
}

export async function getTxtFileUrl(cik, accession) {
  const cleanAccession = accession.replace(/-/g, "");
  const proxyUrl = `${PROXY_BASE}/secdata/${cik}/${cleanAccession}/index.json`;

  const res = await fetch(proxyUrl);
  if (!res.ok) throw new Error("Index JSON not found");

  const data = await res.json();
  const txtFile = data.directory.item.find((i) => i.name.endsWith(".txt"));
  if (!txtFile) return null;

  return `${PROXY_BASE}/secdata/${cik}/${cleanAccession}/${txtFile.name}`;
}

export async function getParsedItemSections(cik, accession, filename) {
  const cleanAccession = accession.replace(/-/g, "");
  const proxyUrl = `${PROXY_BASE}/secdata/parsed/${cik}/${cleanAccession}/${filename}`;

  const res = await fetch(proxyUrl);
  if (!res.ok) throw new Error("Failed to fetch parsed SEC items");

  return await res.json();
}

// 가장 최근 10-Q 또는 10-K 리턴 (10-Q 우선)
export async function getMostRecentReportByCIK(cik) {
  const url = `${PROXY_BASE}/sec/${cik}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error("Failed to fetch submissions");
  const data = await res.json();

  const filings = data.filings?.recent;
  if (!filings) return null;

  // 10-Q 우선, 없으면 10-K
  let idx = filings.form.findIndex((f) => f === "10-Q");
  if (idx === -1) idx = filings.form.findIndex((f) => f === "10-K");
  if (idx === -1) return null;

  return {
    form: filings.form[idx],
    date: filings.filingDate[idx],
    accession: filings.accessionNumber[idx],
  };
}
