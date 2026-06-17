export function HomePage() {
  return (
    <section className="pageStack">
      <div>
        <p className="eyebrow">Research workspace</p>
        <h1>Shopee Product Research AI</h1>
        <p className="lede">
          A Cloudflare-first research app for comparing Shopee products with structured data,
          deterministic scoring, and AI reports.
        </p>
      </div>
      <div className="placeholderGrid">
        <article className="placeholderPanel">
          <h2>Compare Links</h2>
          <p>Submit up to five Shopee product links and track the async comparison job.</p>
        </article>
        <article className="placeholderPanel">
          <h2>Keyword Search</h2>
          <p>Search for top products with DKI Jakarta as the default shipping origin.</p>
        </article>
        <article className="placeholderPanel">
          <h2>Runtime Settings</h2>
          <p>Manage provider, model, search, and scoring configuration from admin pages.</p>
        </article>
      </div>
    </section>
  );
}
