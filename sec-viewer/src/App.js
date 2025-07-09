import React, { useEffect, useState } from "react";
import {
  getMostRecentReportByCIK,
  getParsedItemSections,
} from "./components/edgarApi";

function App() {
  const [companies, setCompanies] = useState([]);
  const [companyIdx, setCompanyIdx] = useState(0);
  const [items, setItems] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [reportMeta, setReportMeta] = useState(null); // form, date
  const [showFullText, setShowFullText] = useState(false);

  // CIK 리스트 fetch (항상 최상단에서 호출)
  useEffect(() => {
    fetch("/json/cik.json")
      .then((res) => res.json())
      .then((data) => {
        const arr = Object.values(data);
        setCompanies(arr);
      });
  }, []);

  // companies가 로드된 후에만 데이터 fetch
  useEffect(() => {
    if (companies.length === 0) return;
    const { cik_str: cik } = companies[companyIdx];
    setLoading(true);
    setError(null);
    setItems(null);
    setReportMeta(null);
    setShowFullText(false);
    async function fetchData() {
      try {
        const report = await getMostRecentReportByCIK(cik);
        if (!report) return setError("No 10-Q or 10-K report found");
        setReportMeta({ form: report.form, date: report.date });
        const filename = `${report.accession}.txt`;
        const parsed = await getParsedItemSections(
          cik,
          report.accession,
          filename
        );
        setItems(parsed);
      } catch (e) {
        console.error(e);
        setError("Failed to load report");
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [companies, companyIdx]);

  // companies가 로드되기 전에는 로딩 표시
  if (companies.length === 0) return <div>Loading CIK list...</div>;

  const { cik_str: cik, ticker, title } = companies[companyIdx];

  const handlePrev = () => {
    setCompanyIdx((prev) => (prev === 0 ? companies.length - 1 : prev - 1));
  };
  const handleNext = () => {
    setCompanyIdx((prev) => (prev === companies.length - 1 ? 0 : prev + 1));
  };

  return (
    <div
      style={{
        padding: 20,
        maxWidth: 1000,
        margin: "auto",
        fontFamily: "Arial, sans-serif",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          marginBottom: 20,
        }}
      >
        <button onClick={handlePrev} style={{ marginRight: 16 }}>
          &lt; 이전
        </button>
        <span style={{ fontWeight: "bold", fontSize: 20 }}>
          {title} ({ticker})
        </span>
        <button onClick={handleNext} style={{ marginLeft: 16 }}>
          다음 &gt;
        </button>
      </div>
      {reportMeta && (
        <div style={{ textAlign: "center", marginBottom: 10, color: "#888" }}>
          <span>
            {reportMeta.form} / {reportMeta.date}
          </span>
        </div>
      )}
      <h2 style={{ textAlign: "center", color: "#555" }}>
        Most Recent Filing Summary
      </h2>
      {loading && <div>Loading...</div>}
      {error && <div style={{ color: "red" }}>{error}</div>}
      {!loading && !error && !items && <div>No content available</div>}
      {!loading && !error && items && (
        <>
          {["item1", "item1a", "item7", "item8"].map((key) => (
            <section key={key} style={{ marginBottom: 40 }}>
              <h3 style={{ borderBottom: "2px solid #333" }}>
                {key.toUpperCase()}
              </h3>
              <div
                dangerouslySetInnerHTML={{ __html: items[key] }}
                style={{
                  backgroundColor: "#f9f9f9",
                  padding: 15,
                  borderRadius: 6,
                  lineHeight: 1.5,
                  fontSize: 14,
                  whiteSpace: "normal",
                  overflowX: "auto",
                }}
              />
            </section>
          ))}
          <div style={{ margin: "32px 0" }}>
            <button
              onClick={() => setShowFullText((v) => !v)}
              style={{ padding: "8px 16px", fontSize: 16 }}
            >
              {showFullText ? "전체 보고서 닫기" : "전체 보고서 보기"}
            </button>
            {showFullText && (
              <div style={{ marginTop: 20 }}>
                {items.fullText && /<body[\s>]/i.test(items.fullText) ? (
                  <iframe
                    title="SEC Full Report"
                    srcDoc={items.fullText}
                    style={{
                      width: "100%",
                      minHeight: 800,
                      border: "1px solid #888",
                      borderRadius: 8,
                      background: "#fff",
                    }}
                  />
                ) : (
                  <div
                    style={{
                      background: "#222",
                      color: "#eee",
                      padding: 20,
                      borderRadius: 8,
                      maxHeight: 600,
                      overflow: "auto",
                      fontSize: 13,
                      fontFamily: "monospace",
                      whiteSpace: "pre-wrap",
                    }}
                  >
                    {items.fullText}
                  </div>
                )}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}

export default App;
