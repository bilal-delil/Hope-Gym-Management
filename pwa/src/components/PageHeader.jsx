export default function PageHeader({ title, subtitle, right }) {
  return (
    <header className="page-header">
      <div>
        <h1>{title}</h1>
        {subtitle ? <p className="muted">{subtitle}</p> : null}
      </div>
      {right ? <div className="page-header__right">{right}</div> : null}
    </header>
  );
}
