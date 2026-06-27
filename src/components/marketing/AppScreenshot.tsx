import './AppScreenshot.css'

export function AppScreenshot() {
  return (
    <div className="app-screenshot" aria-hidden>
      <div className="app-screenshot-frame">
        <div className="app-screenshot-notch" />
        <div className="app-screenshot-screen">
          <div className="app-screenshot-header">
            <span className="app-screenshot-back">‹</span>
            <div>
              <div className="app-screenshot-title">Today</div>
              <div className="app-screenshot-subtitle">Dogs &amp; cats · Every life stage</div>
            </div>
          </div>
          <div className="app-screenshot-progress">
            <div className="app-screenshot-progress-row">
              <span>Today&apos;s progress</span>
              <span className="app-screenshot-progress-count">12 / 18</span>
            </div>
            <div className="app-screenshot-progress-bar">
              <div className="app-screenshot-progress-fill" />
            </div>
          </div>
          <div className="app-screenshot-blocks">
            <div className="app-screenshot-block done potty">
              <span className="time">5:30 AM</span>
              <span className="icon">🌿</span>
              <span className="label">Wake Up + Potty</span>
              <span className="check">✓</span>
            </div>
            <div className="app-screenshot-block done feed">
              <span className="time">5:40 AM</span>
              <span className="icon">🍽️</span>
              <span className="label">Meal #1</span>
              <span className="check">✓</span>
            </div>
            <div className="app-screenshot-block active play">
              <span className="time">6:00 AM</span>
              <span className="icon">🧸</span>
              <span className="label">Short Play</span>
            </div>
            <div className="app-screenshot-block sleep">
              <span className="time">6:30 AM</span>
              <span className="icon">💤</span>
              <span className="label">Nap in Crate</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
