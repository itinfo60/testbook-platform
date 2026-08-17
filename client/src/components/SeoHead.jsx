import { Helmet } from 'react-helmet-async';
const SITE_NAME = 'EduHub';
const SITE_URL = 'https://edurportal.in';
const DEFAULT_IMAGE = '/og-default.png';
const DEFAULT_DESCRIPTION =
  'Prepare smarter for RPSC, RAS, RJS, and Political Science exams. Access mock tests, PYQs, live classes, and expert notes.';

/**
 * SeoHead — dynamic per-route SEO meta tags
 *
 * Props:
 *  title        string  — page title (appended with SITE_NAME)
 *  description  string  — meta description
 *  image        string  — OG / Twitter image URL
 *  url          string  — canonical URL (defaults to window.location.href)
 *  type         string  — OG type: 'website' | 'article' | 'product'
 *  noindex      bool    — add noindex tag
 *  jsonLd       object  — structured data (Schema.org JSON-LD)
 */
export default function SeoHead({
  title,
  description = DEFAULT_DESCRIPTION,
  image = DEFAULT_IMAGE,
  url,
  type = 'website',
  noindex = false,
  jsonLd = null,
}) {
  const fullTitle = title
    ? `${title} | ${SITE_NAME}`
    : `${SITE_NAME} — RPSC & RAS Exam Preparation`;
  const canonical = url || (typeof window !== 'undefined' ? window.location.href : SITE_URL);
  const imageUrl = typeof image === 'object' ? image?.url : image;
  const ogImage =
    typeof imageUrl === 'string' && imageUrl.startsWith('http')
      ? imageUrl
      : `${SITE_URL}${imageUrl || ''}`;

  return (
    <Helmet>
      {/* Primary */}
      <title>{fullTitle}</title>
      <meta name="description" content={description} />
      <link rel="canonical" href={canonical} />
      {noindex && <meta name="robots" content="noindex,nofollow" />}

      {/* Open Graph */}
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:type" content={type} />
      <meta property="og:url" content={canonical} />
      <meta property="og:image" content={ogImage} />
      <meta property="og:site_name" content={SITE_NAME} />

      {/* Twitter Card */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={ogImage} />

      {/* JSON-LD Structured Data */}
      {jsonLd && <script type="application/ld+json">{JSON.stringify(jsonLd)}</script>}
    </Helmet>
  );
}
