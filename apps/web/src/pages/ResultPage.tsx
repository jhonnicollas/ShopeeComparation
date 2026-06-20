import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link, useNavigate, useParams } from "@tanstack/react-router";
import { apiRequest } from "../lib/api.js";

interface ComparisonItem {
  id: string;
  rank: number;
  productId: string;
  shopId: string | null;
  finalScore: number;
  ratingScore: number;
  reviewCountScore: number;
  soldCountScore: number;
  priceScore: number;
  shopTrustScore: number;
  responseRateScore: number;
  featureMatchScore: number;
  riskPenalty: number;
  prosJson: string[] | null;
  consJson: string[] | null;
  riskJson: string[] | null;
}

interface ProductDetail {
  id: string;
  shopeeItemId: string | null;
  shopeeShopId: string | null;
  title: string | null;
  brand: string | null;
  category: string | null;
  imageUrl: string | null;
  priceMin: number | null;
  priceMax: number | null;
  rating: number | null;
  reviewCount: number | null;
  soldCount: number | null;
  shippedFrom: string | null;
  description: string | null;
  weight: {
    value: number | null;
    unit: string | null;
    rawText: string | null;
  } | null;
  features: Array<{ name: string; value: string }> | null;
  confidenceScore: number;
}

interface ShopDetail {
  id: string;
  shopeeShopId: string | null;
  name: string | null;
  shopUrl: string | null;
  statusLabels: string[] | null;
  primaryStatus: string | null;
  rating: number | null;
  ratingCount: number | null;
  responseRate: number | null;
  responseTime: string | null;
  followerCount: number | null;
  productCount: number | null;
  joinedAgeText: string | null;
  location: string | null;
}

interface ResearchSession {
  researchSessionId: string;
  mode: string;
  keyword: string | null;
  shippedFrom: string | null;
  status: string;
  bestProductId: string | null;
  totalProducts: number;
  completedProducts: number;
  errorMessage: string | null;
}

interface Comparison {
  id: string;
  researchSessionId: string;
  title: string | null;
  mode: string;
  bestProductId: string | null;
}

interface AiReportResponse {
  report: {
    bestProductId: string | null;
    bestProductName: string | null;
    ranking: Array<{ productId: string; rank: number; reason: string }>;
    valueForMoneyProductId: string | null;
    safestProductId: string | null;
    riskiestProductId: string | null;
    prosCons: Array<{ productId: string; pros: string[]; cons: string[] }>;
    redFlags: string[];
    confidence: number;
    missingDataNotes: string[];
  } | null;
  rawText: string | null;
}

interface ComparisonResponse {
  comparison: Comparison | null;
  items: ComparisonItem[];
  products: Record<string, ProductDetail>;
  shops: Record<string, ShopDetail>;
}

function formatPrice(value: number | null): string {
  if (value === null) return "-";
  return `Rp ${value.toLocaleString("id-ID")}`;
}

function formatScore(value: number): string {
  return (value * 100).toFixed(1);
}

export function ResultPage() {
  const params = useParams({ strict: false }) as { researchSessionId?: string };
  const navigate = useNavigate();
  const sessionId = params.researchSessionId ?? "";
  const [error, setError] = useState<string | null>(null);

  const sessionQuery = useQuery({
    queryKey: ["session", sessionId],
    queryFn: () => apiRequest<ResearchSession>(`/research/sessions/${sessionId}`),
    enabled: !!sessionId,
  });

  const comparisonQuery = useQuery({
    queryKey: ["comparison", sessionId],
    queryFn: () => apiRequest<ComparisonResponse>(`/research/comparisons/by-session/${sessionId}`),
    enabled: !!sessionId,
  });

  const aiReportQuery = useQuery({
    queryKey: ["ai-report", comparisonQuery.data?.comparison?.id],
    queryFn: async (): Promise<AiReportResponse | null> => {
      const id = comparisonQuery.data?.comparison?.id;
      if (!id) return null;
      return apiRequest<AiReportResponse>(`/research/comparisons/${id}/ai-report`);
    },
    enabled: !!comparisonQuery.data?.comparison?.id,
  });

  useEffect(() => {
    if (sessionQuery.data?.status === "failed") {
      setError(sessionQuery.data.errorMessage ?? "Research session failed");
    }
  }, [sessionQuery.data]);

  if (!sessionId) {
    return (
      <section className="pageStack">
        <div className="formError">Missing research session ID</div>
      </section>
    );
  }

  if (sessionQuery.isLoading || comparisonQuery.isLoading) {
    return (
      <section className="pageStack">
        <div className="loadingState">Loading results...</div>
      </section>
    );
  }

  if (!sessionQuery.data) {
    return (
      <section className="pageStack">
        <div className="formError">Session not found</div>
      </section>
    );
  }

  const session = sessionQuery.data;
  const items = comparisonQuery.data?.items ?? [];
  const products = comparisonQuery.data?.products ?? {};
  const shops = comparisonQuery.data?.shops ?? {};
  const bestItem = items.find((i) => i.rank === 1);
  const isKeywordSearch = session.mode === "keywordSearch";

  return (
    <section className="pageStack">
      <div>
        <p className="eyebrow">{isKeywordSearch ? "Keyword Search Results" : "Compare Results"}</p>
        <h1>{isKeywordSearch ? `Top ${items.length} untuk "${session.keyword ?? ""}"` : "Comparison Results"}</h1>
        <p className="lede">
          {isKeywordSearch && (
            <>
              Dikirim dari: <strong>{session.shippedFrom ?? "N/A"}</strong> · Produk terbaik:{" "}
              <strong>{products[session.bestProductId ?? ""]?.title ?? session.bestProductId ?? "N/A"}</strong> (Rank 1 dari {items.length})
            </>
          )}
          {!isKeywordSearch && (
            <>
              Produk terbaik:{" "}
              <strong>{products[session.bestProductId ?? ""]?.title ?? session.bestProductId ?? "N/A"}</strong> (Rank 1 dari {items.length})
            </>
          )}
        </p>
        {error && (
          <div className="formError" role="alert">
            {error}
          </div>
        )}
        {session.status === "partialSuccess" && (
          <div className="partialSuccessBanner">
            Beberapa item gagal di-enrich. Menampilkan hasil sebagian.
          </div>
        )}
      </div>

      {bestItem && (
        <div className="formPanel">
          <h2>Produk Terbaik</h2>
          <div className="bestProductCallout">
            <span className="rankBadge">#{bestItem.rank}</span>
            <span className="bestProductId">
              {products[bestItem.productId]?.title ?? bestItem.productId}
            </span>
            <span className="bestScore">Skor: {formatScore(bestItem.finalScore)}</span>
          </div>
        </div>
      )}

      {items.length > 0 && (
        <div className="formPanel">
          <h2>Tabel Perbandingan Produk</h2>
          <p className="lede">
            Perbandingan detail setiap produk: nama, toko, lokasi, harga, berat, fitur, review, rating, status toko, dan skor.
          </p>
          <div className="tableScroll">
            <table className="dataTable">
              <thead>
                <tr>
                  <th>Rank</th>
                  <th>Produk</th>
                  <th>Toko</th>
                  <th>Status Toko</th>
                  <th>Dikirim dari</th>
                  <th>Harga</th>
                  <th>Rating</th>
                  <th>Review</th>
                  <th>Terjual</th>
                  <th>Berat</th>
                  <th>Skor</th>
                  <th>Risk</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item) => {
                  const product = products[item.productId];
                  const shop = item.shopId ? shops[item.shopId] : null;
                  const riskLevel =
                    item.riskJson && item.riskJson.length > 0
                      ? "HIGH"
                      : item.riskPenalty > 0.1
                      ? "MEDIUM"
                      : "LOW";
                  return (
                    <tr key={item.id} className={item.rank === 1 ? "bestRow" : ""}>
                      <td>
                        <span className="rankBadge">#{item.rank}</span>
                      </td>
                      <td>
                        <div className="productCellName">
                          <Link
                            to="/products/$productId"
                            params={{ productId: item.productId }}
                            className="productLink"
                          >
                            {product?.title ?? item.productId}
                          </Link>
                          {product?.brand && <span className="productMeta">{product.brand}</span>}
                        </div>
                      </td>
                      <td>
                        {shop ? (
                          <Link
                            to="/shops/$shopId"
                            params={{ shopId: item.shopId! }}
                            className="productLink"
                          >
                            {shop.name ?? item.shopId}
                          </Link>
                        ) : (
                          "-"
                        )}
                      </td>
                      <td>
                        {shop?.primaryStatus ? (
                          <span className={`statusBadge statusBadge${shop.primaryStatus}`}>
                            {shop.primaryStatus}
                          </span>
                        ) : (
                          "-"
                        )}
                      </td>
                      <td>{product?.shippedFrom ?? "-"}</td>
                      <td className="priceCell">{formatPrice(product?.priceMin ?? null)}</td>
                      <td>
                        {product?.rating !== null && product?.rating !== undefined
                          ? `${product.rating.toFixed(1)} / 5`
                          : "-"}
                      </td>
                      <td>{product?.reviewCount?.toLocaleString("id-ID") ?? "-"}</td>
                      <td>{product?.soldCount?.toLocaleString("id-ID") ?? "-"}</td>
                      <td>
                        {product?.weight?.value
                          ? `${product.weight.value} ${product.weight.unit ?? ""}`
                          : "-"}
                      </td>
                      <td>
                        <strong>{formatScore(item.finalScore)}</strong>
                      </td>
                      <td>
                        <span className={`riskBadge riskBadge${riskLevel}`}>
                          {riskLevel}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {items.length > 0 && (
        <div className="formPanel">
          <h2>Tabel Perbandingan Toko</h2>
          <p className="lede">Detail toko: rating, response rate, response time, follower, jumlah produk.</p>
          <div className="tableScroll">
            <table className="dataTable">
              <thead>
                <tr>
                  <th>Toko</th>
                  <th>Status</th>
                  <th>Rating</th>
                  <th>Response Rate</th>
                  <th>Response Time</th>
                  <th>Follower</th>
                  <th>Produk</th>
                  <th>Bergabung</th>
                  <th>Lokasi</th>
                  <th>Shop Trust</th>
                </tr>
              </thead>
              <tbody>
                {Array.from(new Set(items.map((i) => i.shopId).filter((id): id is string => !!id))).map(
                  (shopId) => {
                    const shop = shops[shopId];
                    const item = items.find((i) => i.shopId === shopId);
                    if (!shop || !item) return null;
                    return (
                      <tr key={shopId}>
                        <td>
                          <Link
                            to="/shops/$shopId"
                            params={{ shopId }}
                            className="productLink"
                          >
                            {shop.name ?? shopId}
                          </Link>
                        </td>
                        <td>
                          {shop.primaryStatus ? (
                            <span className={`statusBadge statusBadge${shop.primaryStatus}`}>
                              {shop.primaryStatus}
                            </span>
                          ) : (
                            "-"
                          )}
                        </td>
                        <td>
                          {shop.rating !== null && shop.rating !== undefined
                            ? `${shop.rating.toFixed(1)} / 5 (${shop.ratingCount ?? 0})`
                            : "-"}
                        </td>
                        <td>
                          {shop.responseRate !== null && shop.responseRate !== undefined
                            ? `${shop.responseRate}%`
                            : "-"}
                        </td>
                        <td>{shop.responseTime ?? "-"}</td>
                        <td>{shop.followerCount?.toLocaleString("id-ID") ?? "-"}</td>
                        <td>{shop.productCount?.toLocaleString("id-ID") ?? "-"}</td>
                        <td>{shop.joinedAgeText ?? "-"}</td>
                        <td>{shop.location ?? "-"}</td>
                        <td>
                          <strong>{formatScore(item.shopTrustScore)}</strong>
                        </td>
                      </tr>
                    );
                  }
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {items.length > 0 && (
        <div className="formPanel">
          <h2>Tabel Perbandingan Berat</h2>
          <p className="lede">Berat produk mempengaruhi ongkos kirim dan kualitas persepsi.</p>
          <div className="tableScroll">
            <table className="dataTable">
              <thead>
                <tr>
                  <th>Produk</th>
                  <th>Berat</th>
                  <th>Unit</th>
                  <th>Source</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item) => {
                  const product = products[item.productId];
                  return (
                    <tr key={item.id}>
                      <td>{product?.title ?? item.productId}</td>
                      <td>{product?.weight?.value ?? "-"}</td>
                      <td>{product?.weight?.unit ?? "-"}</td>
                      <td>{product?.weight?.rawText ?? "-"}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {items.length > 0 && (
        <div className="formPanel">
          <h2>Tabel Perbandingan Fitur</h2>
          <p className="lede">Fitur utama yang membedakan setiap produk.</p>
          <div className="tableScroll">
            <table className="dataTable">
              <thead>
                <tr>
                  <th>Produk</th>
                  <th>Fitur</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item) => {
                  const product = products[item.productId];
                  return (
                    <tr key={item.id}>
                      <td>{product?.title ?? item.productId}</td>
                      <td>
                        {product?.features && product.features.length > 0
                          ? product.features.map((f, i) => (
                              <span key={i} className="featureChip">
                                {f.name}: {f.value}
                              </span>
                            ))
                          : "Tidak ada fitur tercatat"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <div className="formPanel">
        <h2>Score Breakdown</h2>
        <div className="resultGrid">
          {items.length === 0 ? (
            <div className="placeholderPanel">Belum ada item perbandingan.</div>
          ) : (
            items.map((item) => (
              <article key={item.id} className="resultCard">
                <div className="resultCardHeader">
                  <span className="rankBadge">#{item.rank}</span>
                  <h3>{products[item.productId]?.title ?? item.productId}</h3>
                </div>
                <div className="scoreGrid">
                  <div className="scoreItem">
                    <span className="scoreLabel">Final</span>
                    <span className="scoreValue">{formatScore(item.finalScore)}</span>
                  </div>
                  <div className="scoreItem">
                    <span className="scoreLabel">Rating</span>
                    <span className="scoreValue">{formatScore(item.ratingScore)}</span>
                  </div>
                  <div className="scoreItem">
                    <span className="scoreLabel">Reviews</span>
                    <span className="scoreValue">{formatScore(item.reviewCountScore)}</span>
                  </div>
                  <div className="scoreItem">
                    <span className="scoreLabel">Sold</span>
                    <span className="scoreValue">{formatScore(item.soldCountScore)}</span>
                  </div>
                  <div className="scoreItem">
                    <span className="scoreLabel">Price</span>
                    <span className="scoreValue">{formatScore(item.priceScore)}</span>
                  </div>
                  <div className="scoreItem">
                    <span className="scoreLabel">Shop</span>
                    <span className="scoreValue">{formatScore(item.shopTrustScore)}</span>
                  </div>
                </div>
                {item.prosJson && item.prosJson.length > 0 && (
                  <div className="prosConsSection">
                    <h4>Kelebihan</h4>
                    <ul>
                      {item.prosJson.map((p, i) => (
                        <li key={i}>{p}</li>
                      ))}
                    </ul>
                  </div>
                )}
                {item.consJson && item.consJson.length > 0 && (
                  <div className="prosConsSection">
                    <h4>Kekurangan</h4>
                    <ul>
                      {item.consJson.map((c, i) => (
                        <li key={i}>{c}</li>
                      ))}
                    </ul>
                  </div>
                )}
                {item.riskJson && item.riskJson.length > 0 && (
                  <div className="riskSection">
                    <h4>Risiko</h4>
                    <ul>
                      {item.riskJson.map((r, i) => (
                        <li key={i}>{r}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </article>
            ))
          )}
        </div>
      </div>

      {aiReportQuery.data?.report && (
        <div className="formPanel">
          <h2>AI Recommendation</h2>
          <p>
            Confidence: <strong>{(aiReportQuery.data.report.confidence * 100).toFixed(0)}%</strong>
          </p>
          {aiReportQuery.data.report.bestProductId && (
            <p>
              <strong>Produk Terbaik:</strong>{" "}
              {products[aiReportQuery.data.report.bestProductId]?.title ??
                aiReportQuery.data.report.bestProductId}
            </p>
          )}
          {aiReportQuery.data.report.valueForMoneyProductId && (
            <p>
              <strong>Value-for-Money:</strong>{" "}
              {products[aiReportQuery.data.report.valueForMoneyProductId]?.title ??
                aiReportQuery.data.report.valueForMoneyProductId}
            </p>
          )}
          {aiReportQuery.data.report.safestProductId && (
            <p>
              <strong>Paling Aman:</strong>{" "}
              {products[aiReportQuery.data.report.safestProductId]?.title ??
                aiReportQuery.data.report.safestProductId}
            </p>
          )}
          {aiReportQuery.data.report.riskiestProductId && (
            <p>
              <strong>Paling Berisiko:</strong>{" "}
              {products[aiReportQuery.data.report.riskiestProductId]?.title ??
                aiReportQuery.data.report.riskiestProductId}
            </p>
          )}
          {aiReportQuery.data.report.missingDataNotes &&
            aiReportQuery.data.report.missingDataNotes.length > 0 && (
              <div className="missingDataNotes">
                <h3>Catatan Data Tidak Tersedia</h3>
                <ul>
                  {aiReportQuery.data.report.missingDataNotes.map((note, i) => (
                    <li key={i}>{note}</li>
                  ))}
                </ul>
              </div>
            )}
          {aiReportQuery.data.report.redFlags && aiReportQuery.data.report.redFlags.length > 0 && (
            <div className="missingDataNotes">
              <h3>Red Flag</h3>
              <ul>
                {aiReportQuery.data.report.redFlags.map((flag, i) => (
                  <li key={i}>{flag}</li>
                ))}
              </ul>
            </div>
          )}
          <button
            type="button"
            className="secondaryButton"
            onClick={() => navigate({ to: isKeywordSearch ? "/keyword-search" : "/compare" })}
          >
            Run another {isKeywordSearch ? "search" : "comparison"}
          </button>
        </div>
      )}
    </section>
  );
}