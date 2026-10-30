const { posts } = require('./posts');
const { profile, releases, notes } = require('./site');
const { categorySlug } = require('./categories');

const publishedPosts = posts
  .filter(post => post.status === 'published')
  .sort((a, b) => new Date(b.publishedAt) - new Date(a.publishedAt));
const pageSize = 6;
const categories = Array.from(
  new Set(publishedPosts.map(post => post.type)),
).sort();
function buildPages() {
  const pages = [
    {
      path: '/',
      kind: 'home',
      title: 'reshra — Music, Projects & Notes',
      description: profile.bio,
    },
    {
      path: '/music',
      kind: 'music',
      title: 'Music by reshra — The Archive',
      description:
        'Explore reshra’s recordings, official music videos, credits, and listening links, from new music to the archive.',
    },
    {
      path: '/notes',
      kind: 'notes',
      title: 'Notes & Project Resources — reshra',
      description:
        'Guitar parts, MIDI controller resources, NAM amp captures, and project notes from reshra.',
    },
    ...releases
      .filter(release =>
        publishedPosts.some(post => post.releaseId === release.slug),
      )
      .map(release => ({
        path: release.path,
        kind: 'redirect',
        redirectTo: publishedPosts.find(post => post.releaseId === release.slug)
          .path,
        release,
        title: `${release.title} — reshra | ${
          release.releaseStatus === 'upcoming'
            ? 'Upcoming Release'
            : 'Music & Official Video'
        }`,
        description: release.description,
        image:
          release.artwork ||
          (release.video &&
            `https://i.ytimg.com/vi/${release.video.id}/hqdefault.jpg`),
      })),
    ...notes.map(note => ({
      path: note.path,
      kind: 'note',
      note,
      title: `${note.title} — reshra`,
      description: note.description,
    })),
    ...publishedPosts.map(post => ({
      path: post.path,
      kind: 'post',
      post,
      release: releases.find(release => release.slug === post.releaseId),
      title: `${post.title} — reshra’s Blog`,
      description: post.excerpt,
      image:
        (releases.find(release => release.slug === post.releaseId) || {})
          .artwork ||
        (post.videoId
          ? `https://i.ytimg.com/vi/${post.videoId}/hqdefault.jpg`
          : null),
    })),
  ];
  const total = Math.max(1, Math.ceil(publishedPosts.length / pageSize));
  for (let number = 1; number <= total; number++) {
    pages.push({
      path: number === 1 ? '/blog' : `/blog/page/${number}`,
      kind: 'blog',
      number,
      title: `reshra’s Blog — Music, Builds & Video Notes${
        number > 1 ? ` | Page ${number}` : ''
      }`,
      description: `Release stories, guitar projects, MIDI experiments, and video companions from reshra.${
        number > 1 ? ` Archive page ${number}.` : ''
      }`,
    });
  }
  categories.forEach(category =>
    pages.push({
      path: `/blog/category/${categorySlug(category)}`,
      kind: 'blog',
      category,
      title: `${category} — reshra’s Blog`,
      description: `${
        category === 'Music'
          ? 'Song releases and music archive entries'
          : category === 'Projects'
          ? 'Guitar modifications, MIDI pedal builds, and NAM experiments'
          : `${category} entries`
      } from reshra’s personal blog.`,
    }),
  );
  return pages;
}
const pages = buildPages();
const getPage = path => {
  const page = pages.find(item => item.path === path);
  return page && page.redirectTo
    ? pages.find(item => item.path === page.redirectTo)
    : page;
};

module.exports = { publishedPosts, pageSize, pages, getPage, categories };
