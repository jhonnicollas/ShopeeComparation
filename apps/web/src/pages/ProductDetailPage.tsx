import { useQuery } from "@tanstack/react-query";

interface ProductDetail {
  id: string;
  shopeeItemId: string;
  shopeeShopId: string;
  title: string | null;
  brand: string | null;
  category: string | null;
  originalUrl: string | null;
  canonicalUrl: string | null;
  imageUrl: string | null;
  priceMin: number | null;
  priceMax: number | null;
  priceBeforeDiscount: number | null;
  discountText: string | null;
  rating: number | null;
  reviewCount: number | null;
  soldCount: number | null;
  favoriteCount: number | null;
  stock: number | null;
  shippedFrom: string | null;
  description: string | null;
  confidenceScore: number;
  lastCheckedAt: string;
  createdAt: string;
  updatedAt: string;
}

function formatPrice(value: number | null): string {
  if (value === null) return "-";
  return `Rp ${value.toLocaleString()}`;
}

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleString();
  } catch {
    return iso;
  }
}

export function ProductDetailPage({ productId }: { productId: string }) {
  const query = useQuery({
    queryKey: ["research", "product", productId],
    queryFn: async () => {
      const res = await fetch(`/api/research/products/${productId}`, {
        credentials: "include",
      });
      if (!res.ok) return null;
      return (await res.json()) as ProductDetail;
    },
  });

  if (query.isLoading) {
    return (
      <section className="pageStack">
        <div className="loadingState">Loading product details...</div>
      </section>
    );
  }

  if (query.isError || !query.data) {
    return (
      <section className="pageStack">
        <div className="formError">Failed to load product details</div>
      </section>
    );
  }

  const product = query.data;

  return (
    <section className="pageStack">
      <div>
        <p className="eyebrow">Product Detail</p>
        <h1>{product.title ?? "Untitled Product"}</h1>
        <div className="detailMeta">
          <span>Confidence: {(product.confidenceScore * 100).toFixed(0)}%</span>
          <span>Item ID: {product.shopeeItemId}</span>
          {product.brand && <span>Brand: {product.brand}</span>}
        </div>
      </div>

      {product.imageUrl && (
        <div className="formPanel">
          <img src={product.imageUrl} alt={product.title ?? "Product"} className="productImage" />
        </div>
      )}

      <div className="statsGrid">
        <div className="statCard">
          <span className="statLabel">Price Min</span>
          <span className="statValue statValueSmall">{formatPrice(product.priceMin)}</span>
        </div>
        <div className="statCard">
          <span className="statLabel">Price Max</span>
          <span className="statValue statValueSmall">{formatPrice(product.priceMax)}</span>
        </div>
        <div className="statCard">
          <span className="statLabel">Rating</span>
          <span className="statValue">{product.rating ?? "-"}</span>
        </div>
        <div className="statCard">
          <span className="statLabel">Reviews</span>
          <span className="statValue">{product.reviewCount ?? "-"}</span>
        </div>
        <div className="statCard">
          <span className="statLabel">Sold</span>
          <span className="statValue">{product.soldCount ?? "-"}</span>
        </div>
        <div className="statCard">
          <span className="statLabel">Stock</span>
          <span className="statValue">{product.stock ?? "-"}</span>
        </div>
      </div>

      <div className="formPanel">
        <h2>Details</h2>
        <table className="dataTable">
          <tbody>
            <tr><td>Category</td><td>{product.category ?? "-"}</td></tr>
            <tr><td>Shipped From</td><td>{product.shippedFrom ?? "-"}</td></tr>
            <tr><td>Price Before Discount</td><td>{formatPrice(product.priceBeforeDiscount)}</td></tr>
            <tr><td>Discount</td><td>{product.discountText ?? "-"}</td></tr>
            <tr><td>Favorites</td><td>{product.favoriteCount ?? "-"}</td></tr>
            <tr><td>Original URL</td><td>{product.originalUrl ? <a href={product.originalUrl} target="_blank" rel="noopener noreferrer">{product.originalUrl}</a> : "-"}</td></tr>
            <tr><td>Canonical URL</td><td>{product.canonicalUrl ?? "-"}</td></tr>
            <tr><td>Last Checked</td><td>{formatDate(product.lastCheckedAt)}</td></tr>
            <tr><td>Created</td><td>{formatDate(product.createdAt)}</td></tr>
            <tr><td>Updated</td><td>{formatDate(product.updatedAt)}</td></tr>
          </tbody>
        </table>
      </div>

      {product.description && (
        <div className="formPanel">
          <h2>Description</h2>
          <p className="productDescription">{product.description}</p>
        </div>
      )}

      <div>
        <span className="secondaryButton">
          Shop ID: {product.shopeeShopId}
        </span>
      </div>
    </section>
  );
}
