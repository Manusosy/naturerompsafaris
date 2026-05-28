export function PageHero({
  eyebrow,
  subtitle,
  title,
}: {
  eyebrow?: string;
  subtitle?: string;
  title: string;
}) {
  return (
    <section className="inner-banner">
      <div className="container">
        {eyebrow ? <p className="inner-banner__eyebrow">{eyebrow}</p> : null}
        <h1>{title}</h1>
        {subtitle ? <p className="inner-banner__subtitle">{subtitle}</p> : null}
      </div>
    </section>
  );
}
