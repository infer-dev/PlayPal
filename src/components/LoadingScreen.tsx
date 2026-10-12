export default function LoadingScreen() {
  return <div className="playpal-loader" role="status" aria-label="Loading PlayPal">
    <div className="loader-lockup" aria-hidden="true"><span className="loader-play">Play</span><span className="loader-pal">Pal</span><svg className="loader-smile" viewBox="0 0 36 12"><path d="M3 2c8 9 22 9 30 0" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round"/></svg></div>
    <span className="loader-caption">A little more outside is on the way</span>
  </div>;
}
