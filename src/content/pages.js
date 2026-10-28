// Shared entry point for the browser and static generator.
const { pages, getPage, publishedPosts } = require('./registry');
const { structuredData, videoData } = require('./schema');
const { renderContent } = require('./templates');
const { renderNote } = require('./templates/notes');
const { escapeHtml, absolute } = require('./templates/helpers');
module.exports = {
  pages,
  getPage,
  publishedPosts,
  structuredData,
  videoData,
  renderContent,
  renderNote,
  escapeHtml,
  absolute,
};
