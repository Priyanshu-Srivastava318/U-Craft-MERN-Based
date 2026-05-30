import { Helmet } from 'react-helmet-async';

export const SITE_URL = 'https://www.u-craft.in';
export const SITE_NAME = 'U-Craft';
export const DEFAULT_IMAGE = `${SITE_URL}/og-image.jpg`;

export function slugify(value = '') {
  return String(value)
    .toLowerCase()
    .trim()
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);
}

export function idFromSlug(value = '') {
  const match = String(value).match(/[a-f0-9]{24}$/i);
  return match ? match[0] : value;
}

export function productPath(product) {
  if (!product?._id) return '/shop';
  const slug = slugify(product.name) || 'handmade-product';
  return `/product/${slug}-${product._id}`;
}

export function artistPath(artist) {
  if (!artist?._id) return '/artists';
  const slug = slugify(artist.brandName || artist.user?.name) || 'artisan';
  return `/artist/${slug}-${artist._id}`;
}

export function absoluteUrl(path = '/') {
  if (/^https?:\/\//i.test(path)) return path;
  return `${SITE_URL}${path.startsWith('/') ? path : `/${path}`}`;
}

function trimDescription(value, fallback) {
  const text = String(value || fallback).replace(/\s+/g, ' ').trim();
  return text.length > 155 ? `${text.slice(0, 152).trim()}...` : text;
}

export function SEO({
  title = 'U-Craft - Buy Handmade & Personalized Gifts from Indian Artisans',
  description = 'Discover handmade and personalized gifts from verified Indian artisans on U-Craft. Shop portraits, pottery, jewelry, textiles, and custom craft products.',
  path = '/',
  image = DEFAULT_IMAGE,
  type = 'website',
  children,
}) {
  const pageTitle = title.includes(SITE_NAME) ? title : `${title} | ${SITE_NAME}`;
  const pageDescription = trimDescription(description, description);
  const canonical = absoluteUrl(path);
  const imageUrl = image || DEFAULT_IMAGE;

  return (
    <Helmet>
      <title>{pageTitle}</title>
      <meta name="description" content={pageDescription} />
      <link rel="canonical" href={canonical} />
      <meta property="og:type" content={type} />
      <meta property="og:site_name" content={SITE_NAME} />
      <meta property="og:title" content={pageTitle} />
      <meta property="og:description" content={pageDescription} />
      <meta property="og:url" content={canonical} />
      <meta property="og:image" content={imageUrl} />
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={pageTitle} />
      <meta name="twitter:description" content={pageDescription} />
      <meta name="twitter:image" content={imageUrl} />
      {children}
    </Helmet>
  );
}

export function JsonLd({ data }) {
  if (!data) return null;
  return (
    <Helmet>
      <script type="application/ld+json">{JSON.stringify(data)}</script>
    </Helmet>
  );
}
