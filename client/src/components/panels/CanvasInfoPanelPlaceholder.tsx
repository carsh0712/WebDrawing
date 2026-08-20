export function CanvasInfoPanelPlaceholder() {
  return (
    <section className="panel-block" aria-labelledby="canvas-info-title">
      <h2 id="canvas-info-title">캔버스 정보</h2>
      <dl className="info-list">
        <div>
          <dt>크기</dt>
          <dd>1440 x 960 px</dd>
        </div>
        <div>
          <dt>배경</dt>
          <dd>흰색</dd>
        </div>
        <div>
          <dt>확대</dt>
          <dd>100%</dd>
        </div>
      </dl>
    </section>
  );
}
