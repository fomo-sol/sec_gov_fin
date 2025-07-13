import express from "express";
import fetch from "node-fetch";
import cors from "cors";

const app = express();
app.use(cors());

const USER_AGENT = "MyApp your_email@example.com";

// 제출 내역 프록시 API
app.get("/api/sec/:cik", async (req, res) => {
  console.log("여기 1번임");
  try {
    const cik = req.params.cik;
    const paddedCik = cik.toString().padStart(10, "0");
    const url = `https://data.sec.gov/submissions/CIK${paddedCik}.json`;

    const response = await fetch(url, {
      headers: { "User-Agent": USER_AGENT },
    });
    if (!response.ok)
      return res.status(response.status).send("Failed to fetch SEC data");

    const data = await response.json();
    res.json(data);
  } catch (error) {
    console.error(error);
    res.status(500).send(error.message);
  }
});

// 개별 공시 파일 프록시 API
// app.get("/api/secdata/:cik/:accession/:filename", async (req, res) => {
//   console.log("여기 2번임");
//   try {
//     const { cik, accession, filename } = req.params;
//     const paddedCik = cik.toString().padStart(10, "0");
//     const cleanAccession = accession.replace(/-/g, "");
//     const url = `https://www.sec.gov/Archives/edgar/data/${paddedCik}/${cleanAccession}/${filename}`;
//
//     const response = await fetch(url, {
//       headers: { "User-Agent": USER_AGENT },
//     });
//     if (!response.ok)
//       return res.status(response.status).send("Failed to fetch SEC file");
//
//     res.setHeader(
//       "Content-Type",
//       response.headers.get("content-type") || "application/octet-stream"
//     );
//
//     if (
//       response.headers.get("content-type").includes("text") ||
//       response.headers.get("content-type").includes("json")
//     ) {
//       const text = await response.text();
//       res.send(text);
//     } else {
//       const buffer = await response.buffer();
//       res.send(buffer);
//     }
//   } catch (error) {
//     console.error(error);
//     res.status(500).send(error.message);
//   }
// });

// 파싱된 ITEM7, ITEM8 텍스트와 재무정보 추출 API
// app.get("/api/secdata/parsed/:cik/:accession/:filename", async (req, res) => {
//   console.log("여기 3번임");
//   try {
//     const { cik, accession, filename } = req.params;
//     const paddedCik = cik.toString().padStart(10, "0");
//     const cleanAccession = accession.replace(/-/g, "");
//     const url = `https://www.sec.gov/Archives/edgar/data/${paddedCik}/${cleanAccession}/${filename}`;
//
//     const response = await fetch(url, {
//       headers: { "User-Agent": USER_AGENT },
//     });
//     if (!response.ok)
//       return res.status(response.status).send("Failed to fetch SEC file");
//
//     const text = await response.text();
//
//     // Helper: ITEM 사이 텍스트 추출 (더 유연하게 개선)
//     const extractItem = (startLabel, endLabels) => {
//       // 다양한 ITEM 표기 허용
//       const startPattern = `${startLabel}\\s*[\\.:\\-–]?`;
//       const endPattern = endLabels.map((l) => `${l}\\s*[\\.:\\-–]?`).join("|");
//       const regex = new RegExp(
//         `${startPattern}[\\s\\S]*?(?=${endPattern})`,
//         "i"
//       );
//       const match = text.match(regex);
//       if (match) return match[0].trim();
//
//       // 매치 실패 시: startLabel 이후 20,000자 등 fallback
//       const fallback = new RegExp(`${startPattern}([\\s\\S]{0,20000})`, "i");
//       const fallbackMatch = text.match(fallback);
//       return fallbackMatch ? fallbackMatch[0].trim() : "";
//     };
//
//     // 재무정보 추출 함수 (더 유연하게 개선)
//     const extractFinancialData = (text) => {
//       if (!text) return {};
//
//       // 다양한 표현 허용
//       const epsRegex =
//         /(EPS|Earnings Per Share|Diluted EPS|Basic EPS)[^\d\$\.,-]*([\d\.,-]+)/gi;
//       const revenueRegex =
//         /(Total Revenue|Revenues|Net Sales|Sales)[^\d\$\.,-]*([\d\.,-]+)/gi;
//       const guidanceMatch = text.match(
//         /(Guidance|Outlook|Forecast)[\s\S]{0,300}/i
//       );
//
//       // 여러 값 추출 (배열)
//       let epsMatches = [];
//       let m;
//       while ((m = epsRegex.exec(text)) !== null) {
//         epsMatches.push(m[2]);
//       }
//       if (epsMatches.length === 1) epsMatches = epsMatches[0];
//       if (epsMatches.length === 0) epsMatches = null;
//
//       let revenueMatches = [];
//       while ((m = revenueRegex.exec(text)) !== null) {
//         revenueMatches.push(m[2]);
//       }
//       if (revenueMatches.length === 1) revenueMatches = revenueMatches[0];
//       if (revenueMatches.length === 0) revenueMatches = null;
//
//       // 표에서 숫자 추출 (간단 버전)
//       const extractTableNumbers = (text, keyword) => {
//         const lines = text.split(/\n|<tr>|<TR>/i);
//         for (const line of lines) {
//           if (line.toLowerCase().includes(keyword.toLowerCase())) {
//             const nums = line.match(/[\d,\.\-]+/g);
//             if (nums) return nums;
//           }
//         }
//         return null;
//       };
//
//       // 표 기반 보조 추출 (없을 때만)
//       if (!revenueMatches) {
//         const tableNums = extractTableNumbers(text, "revenue");
//         if (tableNums) revenueMatches = tableNums;
//       }
//       if (!epsMatches) {
//         const tableNums = extractTableNumbers(text, "eps");
//         if (tableNums) epsMatches = tableNums;
//       }
//
//       return {
//         EPS: epsMatches,
//         Revenue: revenueMatches,
//         Guidance: guidanceMatch ? guidanceMatch[0].trim() : null,
//       };
//     };
//
//     const item7Text = extractItem("ITEM\\s+7\\.?", ["ITEM\\s+8\\.?"]);
//     const item8Text = extractItem("ITEM\\s+8\\.?", [
//       "ITEM\\s+9\\.?",
//       "ITEM\\s+9A\\.?",
//       "ITEM\\s+9B\\.?",
//     ]);
//
//     const financialFrom7 = extractFinancialData(item7Text);
//     const financialFrom8 = extractFinancialData(item8Text);
//
//     const result = {
//       item7: item7Text,
//       item8: item8Text,
//       financial: {
//         fromItem7: financialFrom7,
//         fromItem8: financialFrom8,
//       },
//       fullText: text, // 전체 보고서 텍스트 추가
//     };
//
//     res.json(result);
//   } catch (error) {
//     console.error("Error in parsed SEC API:", error);
//     res.status(500).send(error.message);
//   }
// });
app.get("/api/secdata/parsed/:cik/:accession/:filename", async (req, res) => {
  console.log("여기 3번임");
  try {
    const { cik, accession, filename } = req.params;
    const paddedCik = cik.toString().padStart(10, "0");
    const cleanAccession = accession.replace(/-/g, "");
    const url = `https://www.sec.gov/Archives/edgar/data/${paddedCik}/${cleanAccession}/${filename}`;

    const response = await fetch(url, {
      headers: { "User-Agent": USER_AGENT },
    });
    if (!response.ok)
      return res.status(response.status).send("Failed to fetch SEC file");

    const text = await response.text();

    // 3000자 분량만 잘라서 반환 (필요시 길이 조절 가능)
    const previewText = text.slice(0, 1000000);

    const result = {
      fullText: previewText,
      financial: {}, // 재무정보도 안 뽑으니 빈 객체
    };

    res.json(result);
  } catch (error) {
    console.error("Error in parsed SEC API:", error);
    res.status(500).send(error.message);
  }
});


const PORT = 4000;
app.listen(PORT, () =>
  console.log(`Proxy server running at http://localhost:${PORT}`)
);
