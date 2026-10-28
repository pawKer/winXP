import { useLayoutEffect } from 'react';
import { siteUrl, profile } from 'content/site';
import pageContent from 'content/pages';

const { structuredData } = pageContent;

export default function usePageHead(page) {
  useLayoutEffect(() => {
    document.title = page ? page.title : 'Page not found — reshra';
    const canonical = `${siteUrl}${
      page ? page.path : window.location.pathname
    }`;
    const description = page
      ? page.description
      : 'This page is not in reshra’s archive.';
    const image = new URL(page?.image || profile.avatarSrc, siteUrl).href;
    const values = [
      ['name', 'description', description],
      ['property', 'og:title', document.title],
      ['property', 'og:description', description],
      ['property', 'og:url', canonical],
      ['property', 'og:image', image],
      [
        'property',
        'og:type',
        page?.kind === 'post'
          ? 'article'
          : page?.kind === 'release'
          ? 'music.song'
          : 'website',
      ],
      ['name', 'twitter:card', 'summary_large_image'],
    ];
    values.forEach(([attribute, name, content]) => {
      let element = document.querySelector(`meta[${attribute}="${name}"]`);
      if (!element) {
        element = document.createElement('meta');
        element.setAttribute(attribute, name);
        document.head.appendChild(element);
      }
      element.setAttribute('content', content);
    });
    let link = document.querySelector('link[rel="canonical"]');
    if (!link) {
      link = document.createElement('link');
      link.rel = 'canonical';
      document.head.appendChild(link);
    }
    link.href = canonical;
    let schema = document.getElementById('page-schema');
    if (!schema) {
      schema = document.createElement('script');
      schema.type = 'application/ld+json';
      schema.id = 'page-schema';
      document.head.appendChild(schema);
    }
    schema.textContent = page ? JSON.stringify(structuredData(page)) : '{}';
    let robots = document.querySelector('meta[name="robots"]');
    if (!page) {
      if (!robots) {
        robots = document.createElement('meta');
        robots.name = 'robots';
        document.head.appendChild(robots);
      }
      robots.content = 'noindex';
    } else if (robots) robots.remove();
  }, [page]);
}
