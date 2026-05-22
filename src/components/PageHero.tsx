export function PageHero({ title }: { title: string }) {
  return (
    <section className="inner-banner">
      <div className="container">
        <h1>{title}</h1>
      </div>
    </section>
  );
}
