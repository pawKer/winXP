const { siteUrl, profile } = require('./site');
const { absolute } = require('./templates/helpers');
const { videoById } = require('./catalogue');

const artist = {
  '@type': 'Person',
  '@id': `${siteUrl}/#artist`,
  name: profile.name,
  url: siteUrl,
  image: absolute(profile.avatarSrc),
  description: profile.bio,
  sameAs: Object.values(profile.socialLinks),
};
const videoData = video =>
  video && {
    '@type': 'VideoObject',
    '@id': `${video.sourceUrl}#video`,
    name: video.title,
    description: video.title,
    thumbnailUrl: `https://i.ytimg.com/vi/${video.id}/hqdefault.jpg`,
    uploadDate: video.publishedAt,
    duration: `PT${video.duration}S`,
    embedUrl: `https://www.youtube-nocookie.com/embed/${video.id}`,
    publisher: { '@id': artist['@id'] },
  };
function structuredData(page) {
  const graph = [artist];
  if (page.release) {
    const release = page.release;
    const recording = {
      '@type': 'MusicRecording',
      '@id': `${absolute(page.path)}#recording`,
      name: release.title,
      byArtist: { '@id': artist['@id'] },
      url: absolute(page.path),
      sameAs: release.listeningUrl,
    };
    if (release.releaseDate && release.releaseStatus === 'released')
      recording.datePublished = release.releaseDate;
    if (release.video)
      recording.video = { '@id': `${release.video.sourceUrl}#video` };
    if (release.artwork) recording.image = absolute(release.artwork);
    graph.push(recording);
    if (release.video) graph.push(videoData(release.video));
  }
  if (page.post) {
    const post = page.post;
    const article = {
      '@type': 'BlogPosting',
      '@id': `${absolute(post.path)}#article`,
      headline: post.title,
      description: post.excerpt,
      datePublished: post.publishedAt,
      author: { '@id': artist['@id'] },
      mainEntityOfPage: absolute(post.path),
      inLanguage: post.language,
    };
    if (post.updatedAt) article.dateModified = post.updatedAt;
    if (page.release)
      article.about = { '@id': `${absolute(page.path)}#recording` };
    if (page.image) article.image = absolute(page.image);
    if (post.videoId)
      article.video = { '@id': `${videoById(post.videoId).sourceUrl}#video` };
    graph.push(article);
    if (
      post.videoId &&
      !graph.some(
        entity =>
          entity['@id'] === `${videoById(post.videoId).sourceUrl}#video`,
      )
    )
      graph.push(videoData(videoById(post.videoId)));
  }
  return { '@context': 'https://schema.org', '@graph': graph };
}

module.exports = { structuredData, videoData };
