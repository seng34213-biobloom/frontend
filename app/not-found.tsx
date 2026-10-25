import { getTranslations } from 'next-intl/server';
import { ButtonLink } from './components/button-link';

export default async function NotFound() {
  const t = await getTranslations('errors');
  return (
    <section className="mx-auto flex max-w-2xl flex-col items-center gap-5 px-4 py-24 text-center sm:px-6">
      <span aria-hidden="true" className="text-forest-700/20 font-serif text-6xl">
        404
      </span>
      <h1 className="text-forest-700 font-serif text-3xl md:text-4xl">{t('notFoundTitle')}</h1>
      <p className="text-forest-500 max-w-md text-lg">{t('notFoundBody')}</p>
      <div className="flex flex-wrap justify-center gap-3">
        <ButtonLink href="/products">{t('browseProducts')}</ButtonLink>
        <ButtonLink href="/" variant="secondary">
          {t('home')}
        </ButtonLink>
      </div>
    </section>
  );
}
