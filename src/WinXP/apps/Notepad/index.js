import React, { useState, useId } from 'react';
import styled from 'styled-components';

import { WindowDropDowns } from 'components';
import dropDownData from './dropDownData';

export default function Notepad({
  onClose,
  headerContent,
  onOpenNewNotepad,
  onFocusWinamp,
}) {
  const [docText, setDocText] = useState('');
  const [wordWrap, setWordWrap] = useState(false);
  const scratchpadId = useId();

  function onClickOptionItem(item) {
    switch (item) {
      case 'Exit':
        onClose();
        break;
      case 'Word Wrap':
        setWordWrap(!wordWrap);
        break;
      case 'Time/Date':
        const date = new Date();
        setDocText(
          `${docText}${date.toLocaleTimeString()} ${date.toLocaleDateString()}`,
        );
        break;
      default:
    }
  }
  function downloadText() {
    const url = URL.createObjectURL(
      new Blob([docText], { type: 'text/plain;charset=utf-8' }),
    );
    const link = document.createElement('a');
    link.href = url;
    link.download = 'scratchpad.txt';
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  return (
    <Div>
      <section className="np__toolbar">
        <WindowDropDowns items={dropDownData} onClickItem={onClickOptionItem} />
      </section>
      <TextContentContainer>
        {headerContent && (
          <HeaderSection>
            {React.cloneElement(headerContent, {
              onOpenNewNotepad,
              onFocusWinamp,
            })}
          </HeaderSection>
        )}
        <div className="scratchpad-label">
          <label htmlFor={scratchpadId}>
            Scratchpad — temporary text, lost when this window closes.
          </label>
          <button type="button" onClick={downloadText}>
            Save text…
          </button>
        </div>
        <StyledTextarea
          id={scratchpadId}
          aria-label="Temporary scratchpad"
          wordWrap={wordWrap}
          value={docText}
          onChange={e => setDocText(e.target.value)}
          spellCheck={false}
        />
      </TextContentContainer>
    </Div>
  );
}

const Div = styled.div`
  height: 100%;
  background: linear-gradient(to right, #edede5 0%, #ede8cd 100%);
  display: flex;
  flex-direction: column;
  align-items: stretch;
  .np__toolbar {
    position: relative;
    height: 21px;
    flex-shrink: 0;
    border-bottom: 1px solid white;
  }
  .notepad-document {
    padding: 12px;
  }
  .notepad-document h1 {
    font: bold 16px 'Lucida Console', monospace;
  }
  .notepad-document .document-heading .file-icon {
    display: none;
  }
  .scratchpad-label {
    padding: 8px;
    display: flex;
    gap: 12px;
    align-items: center;
    flex-wrap: wrap;
    background: #ece9d8;
    font: 11px/1.5 Tahoma, sans-serif;
  }
  .scratchpad-label button {
    padding: 4px 8px;
  }
`;

const TextContentContainer = styled.div`
  border: 1px solid #96abff;
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: stretch;
  overflow-y: scroll;
  min-height: 0;
`;

const HeaderSection = styled.div`
  flex-shrink: 0;
  background: white;
  padding: 2px;
`;

const StyledTextarea = styled.textarea`
  flex: auto;
  font-family: 'Lucida Console', monospace;
  font-size: 16px;
  line-height: 1.5;
  resize: none;
  padding: 2px;
  border: none;
  min-height: 200px;
  &:focus-visible {
    outline: 2px solid #315aa5;
    outline-offset: -2px;
  }
  ${props => (props.wordWrap ? '' : 'white-space: nowrap; overflow-x: scroll;')}
`;
