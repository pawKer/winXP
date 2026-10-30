const { renderPost } = require('./post');
const { renderFeed } = require('./feed');
const { renderLayout } = require('../layout');
function renderBlog(page, options) {
  return renderLayout(
    page,
    page.post ? renderPost(page, options) : renderFeed(page, options),
    options,
  );
}
module.exports = { renderBlog };
