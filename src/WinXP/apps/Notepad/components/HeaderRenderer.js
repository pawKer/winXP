import React from 'react';
import styled from 'styled-components';

const HeaderText = styled.div`
  font-family: 'Lucida Console', monospace;
  font-size: 13px;
  line-height: 14px;
  color: #000;
  white-space: pre;
  outline: none;
  resize: none;
  a {
    color: #0000ff;
    text-decoration: underline;
    cursor: pointer;

    &:hover {
      color: #800080;
    }

    &:visited {
      color: #800080;
    }
  }
`;

// Helper function to create symmetric ASCII borders
const createSymmetricBorder = (text, maxWidth = 50) => {
  const textLength = text.length;
  const padding = Math.max(0, maxWidth - textLength - 2); // -2 for the brackets
  const leftPadding = Math.floor(padding / 2);
  const rightPadding = padding - leftPadding;

  const leftBorder = '╔' + '═'.repeat(leftPadding) + '[';
  const rightBorder = ']' + '═'.repeat(rightPadding) + '╗';

  return leftBorder + ' ' + text + ' ' + rightBorder;
};

const createBottomBorder = (maxWidth = 50) => {
  return '╚' + '═'.repeat(maxWidth + 2) + '╝';
};

const createTitleBorder = (text, maxWidth = 50) => {
  const textLength = text.length;
  const padding = Math.max(0, maxWidth - textLength - 2); // -2 for the side borders
  const leftPadding = Math.floor(padding / 2);
  const rightPadding = padding - leftPadding;

  const topBorder = '╔' + '═'.repeat(maxWidth - 2) + '╗';
  const titleLine =
    '║' + ' '.repeat(leftPadding) + text + ' '.repeat(rightPadding) + '║';
  const bottomBorder = '╚' + '═'.repeat(maxWidth - 2) + '╝';

  return { topBorder, titleLine, bottomBorder };
};

const Section = ({ title, items, onAction }) => {
  // Calculate the maximum label width for consistent alignment
  const getMaxLabelWidth = () => {
    let maxWidth = 0;
    items.forEach(item => {
      const labelWidth = (item.label || '').length;
      maxWidth = Math.max(maxWidth, labelWidth);
    });
    return maxWidth;
  };

  const maxLabelWidth = getMaxLabelWidth();

  const renderItem = (item, index) => {
    const { label, type, displayText } = item;

    if (type === 'external') {
      // Calculate padding to align all links
      const labelPadding = ' '.repeat(maxLabelWidth - (label || '').length);

      return (
        <React.Fragment key={index}>
          {'  '}
          {label}
          {labelPadding}{' '}
          <a href={item.url} target="_blank" rel="noopener noreferrer">
            {displayText}
          </a>
          {'\n\n'}
        </React.Fragment>
      );
    }

    if (type === 'action') {
      return (
        <React.Fragment key={index}>
          {'  '}
          <a
            href="#"
            onClick={e => {
              e.preventDefault();
              if (onAction && item.action) {
                onAction(item.action);
              }
            }}
          >
            {displayText}
          </a>
          {'\n\n'}
        </React.Fragment>
      );
    }

    return null;
  };

  // Calculate the maximum width needed for this section
  const getMaxWidth = () => {
    let maxWidth = title.length + 4; // Base width for title + brackets

    // Check all items to find the longest line (now with aligned links)
    items.forEach(item => {
      const itemLength =
        maxLabelWidth + 1 + (item.displayText || '').length + 4; // maxLabelWidth + space + displayText + padding
      maxWidth = Math.max(maxWidth, itemLength);
    });

    // Ensure minimum width and make it even for better symmetry
    return Math.max(40, Math.ceil(maxWidth / 2) * 2);
  };

  const maxWidth = getMaxWidth();
  const topBorder = createSymmetricBorder(title, 42);
  const bottomBorder = createBottomBorder(42);

  return (
    <>
      {topBorder}
      {'\n\n'}
      {items.map(renderItem)}
      {bottomBorder}
      {'\n\n'}
    </>
  );
};

const HeaderRenderer = ({ config, onAction }) => {
  const { title, sections } = config;

  const handleAction = action => {
    if (onAction) {
      onAction(action);
    }
  };

  // Calculate the maximum width needed for the title
  const getTitleMaxWidth = () => {
    if (!title) return 0;

    let maxWidth = title.length + 4; // Base width for title + side borders

    // Check all sections to find the widest content
    sections.forEach(section => {
      const sectionWidth = section.title.length + 4;
      maxWidth = Math.max(maxWidth, sectionWidth);

      // Calculate max label width for this section
      let maxLabelWidth = 0;
      section.items.forEach(item => {
        const labelWidth = (item.label || '').length;
        maxLabelWidth = Math.max(maxLabelWidth, labelWidth);
      });

      section.items.forEach(item => {
        const itemLength =
          maxLabelWidth + 1 + (item.displayText || '').length + 4;
        maxWidth = Math.max(maxWidth, itemLength);
      });
    });

    // Ensure minimum width and make it even for better symmetry
    return Math.max(50, Math.ceil(maxWidth / 2) * 2);
  };

  const titleMaxWidth = getTitleMaxWidth();

  return (
    <HeaderText>
      {title &&
        (() => {
          const { topBorder, titleLine, bottomBorder } = createTitleBorder(
            title,
            46,
          );
          return (
            <>
              {topBorder}
              {'\n'}
              {titleLine}
              {'\n'}
              {bottomBorder}
              {'\n\n'}
            </>
          );
        })()}
      {sections.map((section, index) => (
        <Section
          key={index}
          title={section.title}
          items={section.items}
          onAction={handleAction}
        />
      ))}
    </HeaderText>
  );
};

export default HeaderRenderer;
