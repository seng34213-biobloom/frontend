import { getTranslations } from 'next-intl/server';
import { ButtonLink } from '../../components/button-link';

export default async function ProductNotFound() {
  const t = await getTranslations('errors');
  return (
    <section className="flex flex-col items-center gap-5 px-7 py-32 text-center">
      <h1 className="font-serif text-3xl md:text-4xl">{t('productNotFoundTitle')}</h1>
      <p className="max-w-md">{t('productNotFoundBody')}</p>
      <ButtonLink href="/products">{t('browseProducts')}</ButtonLink>
    </section>
  );
}
