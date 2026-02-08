import React from 'react';
import styled from 'styled-components';

const SUBSTACK_EMBED_URL = 'https://reshra.substack.com/embed';

function SubstackView({ onBack }) {
  return (
    <Wrap>
      <TopBar>
        <BackButton type="button" onClick={onBack}>
          ← Back to links
        </BackButton>
      </TopBar>
      <EmbedOuter>
        <EmbedWrapper>
          <IframeContainer>
            <iframe
              src={SUBSTACK_EMBED_URL}
              title="Subscribe on Substack"
              className="substack-embed"
              data-test-id="substack-embed"
              frameBorder="0"
              scrolling="no"
            />
          </IframeContainer>
        </EmbedWrapper>
      </EmbedOuter>
    </Wrap>
  );
}

const EMBED_MAX_WIDTH = 560;

const Wrap = styled.div`
  position: absolute;
  inset: 0;
  padding: 24px 12px;
  display: flex;
  flex-direction: column;
  align-items: center;
  background-color: #a9c8ff;
  background-image: linear-gradient(
    135deg,
    rgba(255, 255, 255, 0.4) 0%,
    transparent 40%,
    transparent 60%,
    rgba(255, 255, 255, 0.4) 100%
  );
  box-sizing: border-box;
  overflow: auto;
`;

const TopBar = styled.div`
  flex-shrink: 0;
  width: 100%;
  max-width: ${EMBED_MAX_WIDTH}px;
  padding-bottom: 16px;
`;

const BackButton = styled.button`
  padding: 6px 12px;
  font-size: 12px;
  font-family: 'Tahoma', 'Verdana', 'Arial', sans-serif;
  color: #17396d;
  background: linear-gradient(180deg, #ffffff 0%, #edf3ff 40%, #d7e5ff 100%);
  border: 1px solid #a4bff0;
  border-radius: 6px;
  cursor: pointer;
  box-shadow: 0 2px 0 rgba(16, 33, 58, 0.2);

  &:hover {
    background: linear-gradient(180deg, #ffffff 0%, #e3ecff 40%, #ccdcff 100%);
  }
  &:active {
    transform: translateY(1px);
    box-shadow: 0 1px 0 rgba(16, 33, 58, 0.3) inset;
  }
`;

const EmbedOuter = styled.div`
  flex: 1;
  min-height: 0;
  width: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
`;

const EmbedWrapper = styled.div`
  width: ${EMBED_MAX_WIDTH}px;
  max-width: 100%;
  height: 100%;
  min-height: 320px;
  max-height: 90vh;
  display: flex;
  justify-content: center;
  align-items: center;
`;

const IframeContainer = styled.div`
  position: relative;
  width: 100%;
  height: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
  background: #fff;
  border-radius: 12px;
  border: 2px solid #9db7e0;
  overflow: hidden;
  box-shadow: 0 10px 26px rgba(0, 0, 0, 0.25);

  .substack-embed {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    max-width: 100%;
    margin: 0;
    border: 1px solid #eee;
    padding: 0;
    display: block;
    background: white;
  }
`;

export default SubstackView;
