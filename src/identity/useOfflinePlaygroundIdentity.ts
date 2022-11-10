import { IdentityOfflinePlayground } from '@dittolive/ditto'

export interface CreateOfflinePlaygroundIdentityParams {
  appID: string
  siteID: number | bigint
}

/**
 * @example

 * ```js
 *
 * const { create } = useOfflinePlaygroundIdentity();
 *
 * const myIdentity = create({appName: 'my-app', siteID: 1234});
 * const ditto = new Ditto(myIdentity, '/path');
 *
 * A hook for creating Development Ditto identity objects.
 */
export const useOfflinePlaygroundIdentity = (): {
  create: (
    params: CreateOfflinePlaygroundIdentityParams,
  ) => IdentityOfflinePlayground
} => {
  return {
    create: ({
      appID,
      siteID,
    }: CreateOfflinePlaygroundIdentityParams): IdentityOfflinePlayground => {
      return {
        appID,
        siteID,
        type: 'offlinePlayground',
      }
    },
  }
}
