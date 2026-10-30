const content = require('./generated/content.json');
const audioManifest = require('./audioManifest.json');
const releases = content.releases.map(record => {
  const release = Object.assign({}, record);
  if (
    process.env.REACT_APP_PREFER_MP3 === 'true' &&
    audioManifest[release.slug]
  )
    release.webAudioUrl = audioManifest[release.slug].url;
  return release;
});
const videoById = id => content.videos.find(video => video.id === id);
const playlistTracks = content.playlist.map(entry => {
  const release =
    entry.releaseId && releases.find(item => item.slug === entry.releaseId);
  return {
    url: release ? release.webAudioUrl || release.trackUrl : entry.trackUrl,
    duration: release ? release.duration : entry.duration,
    metaData: {
      title: release ? release.title : entry.title,
      artist: release ? content.profile.name : entry.artist,
      albumArtUrl:
        (release ? release.artwork : content.artwork[entry.artworkId].url) ||
        undefined,
    },
  };
});
module.exports = { releases, videoById, playlistTracks };
