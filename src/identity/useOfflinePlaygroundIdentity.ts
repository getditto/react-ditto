import { IdentityOfflinePlayground } from '@dittolive/ditto'

export interface CreateOfflinePlaygroundIdentityParams {
  appName: string
  siteID: number | BigInt
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
      appName,
      siteID,
    }: CreateOfflinePlaygroundIdentityParams): IdentityOfflinePlayground => {
      return {
        appName,
        siteID,
        type: 'offlinePlayground',
      } as IdentityOfflinePlayground
    },
  }
}
