// Editable sources live under content/. This adapter is shared by Node and CRA.
const content = require('./generated/content.json');
const { releases, playlistTracks } = require('./catalogue');
module.exports = Object.assign({}, content, { releases, playlistTracks });
