import type { CatalogueClient } from '@biobloom/ui';
import { adminApi, uploadProductImage } from './api';

/** Binds the shared catalogue editors to the console's API client. */
export const catalogueClient: CatalogueClient = {
  request: (method, path, body) => adminApi(method, path, body),
  uploadProductImage,
};
