import { useQuery } from "@tanstack/react-query";

interface ShopDetail {
  id: string;
  shopeeShopId: string | null;
  name: string | null;
  shopUrl: string | null;
  statusJson: string[] | null;
  primaryStatus: string | null;
  rating: number | null;
  ratingCount: number | null;
  responseRate: number | null;
  responseTime: string | null;
  followerCount: number | null;
  productCount: number | null;
  joinedAgeText: string | null;
  location: string | null;
  confidenceScore: number;
  lastCheckedAt: string;
  createdAt: string;
  updatedAt: string;
}

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleString();
  } catch {
    return iso;
  }
}

export function ShopDetailPage({ shopId }: { shopId: string }) {
  const query = useQuery({
    queryKey: ["research", "shop", shopId],
    queryFn: async () => {
      const res = await fetch(`/api/research/shops/${shopId}`, {
        credentials: "include",
      });
      if (!res.ok) return null;
      return (await res.json()) as ShopDetail;
    },
  });

  if (query.isLoading) {
    return (
      <section className="pageStack">
        <div className="loadingState">Loading shop details...</div>
      </section>
    );
  }

  if (query.isError || !query.data) {
    return (
      <section className="pageStack">
        <div className="formError">Failed to load shop details</div>
      </section>
    );
  }

  const shop = query.data;

  return (
    <section className="pageStack">
      <div>
        <p className="eyebrow">Shop Detail</p>
        <h1>{shop.name ?? "Unnamed Shop"}</h1>
        <div className="detailMeta">
          <span>Confidence: {(shop.confidenceScore * 100).toFixed(0)}%</span>
          {shop.primaryStatus && <span className={`statusBadge statusBadge${shop.primaryStatus}`}>{shop.primaryStatus}</span>}
          {shop.location && <span>{shop.location}</span>}
        </div>
      </div>

      <div className="statsGrid">
        <div className="statCard">
          <span className="statLabel">Rating</span>
          <span className="statValue">{shop.rating ?? "-"}</span>
        </div>
        <div className="statCard">
          <span className="statLabel">Response Rate</span>
          <span className="statValue">{shop.responseRate !== null ? `${shop.responseRate}%` : "-"}</span>
        </div>
        <div className="statCard">
          <span className="statLabel">Followers</span>
          <span className="statValue">{shop.followerCount ?? "-"}</span>
        </div>
        <div className="statCard">
          <span className="statLabel">Products</span>
          <span className="statValue">{shop.productCount ?? "-"}</span>
        </div>
      </div>

      <div className="formPanel">
        <h2>Details</h2>
        <table className="dataTable">
          <tbody>
            <tr><td>Shopee Shop ID</td><td>{shop.shopeeShopId ?? "-"}</td></tr>
            <tr><td>Rating Count</td><td>{shop.ratingCount ?? "-"}</td></tr>
            <tr><td>Response Time</td><td>{shop.responseTime ?? "-"}</td></tr>
            <tr><td>Joined Age</td><td>{shop.joinedAgeText ?? "-"}</td></tr>
            <tr><td>Shop URL</td><td>{shop.shopUrl ? <a href={shop.shopUrl} target="_blank" rel="noopener noreferrer">{shop.shopUrl}</a> : "-"}</td></tr>
            {shop.statusJson && shop.statusJson.length > 0 && (
              <tr><td>Status Labels</td><td>{shop.statusJson.join(", ")}</td></tr>
            )}
            <tr><td>Last Checked</td><td>{formatDate(shop.lastCheckedAt)}</td></tr>
            <tr><td>Created</td><td>{formatDate(shop.createdAt)}</td></tr>
            <tr><td>Updated</td><td>{formatDate(shop.updatedAt)}</td></tr>
          </tbody>
        </table>
      </div>
    </section>
  );
}
