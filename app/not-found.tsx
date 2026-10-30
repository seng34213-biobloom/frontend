import { getTranslations } from 'next-intl/server';
import { ButtonLink } from './components/button-link';

export default async function NotFound() {
  const t = await getTranslations('errors');
  return (
    <section className="flex flex-col items-center gap-5 px-7 py-32 text-center">
      <span aria-hidden="true" className="font-logo text-6xl">
        404
      </span>
      <h1 className="font-serif text-3xl md:text-4xl">{t('notFoundTitle')}</h1>
      <p className="max-w-md">{t('notFoundBody')}</p>
      <div className="flex flex-wrap justify-center gap-3">
        <ButtonLink href="/products">{t('browseProducts')}</ButtonLink>
        <ButtonLink href="/" variant="secondary">
          {t('home')}
        </ButtonLink>
      </div>
    </section>
  );
}
