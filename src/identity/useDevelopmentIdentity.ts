import { IdentityDevelopment } from '@dittolive/ditto'

/**
 * @example

 * ```js
 *
 * const createDevelopmentIdentity = useDevelopmentIdentity();
 *
 * const myIdentity = createDevelopmentIdentity({appName: 'my-app', siteID: 1234});
 * const ditto = new Ditto(myIdentity, '/path');
 *
 * A hook for creating Development Ditto identity objects.
 */
export const useDevelopmentIdentity = () => {
  return {
    create: ({
      appName,
      siteID,
    }: {
      appName: string
      siteID: number | BigInt
    }): IdentityDevelopment => {
      return {
        appName,
        siteID,
        type: 'development',
      } as IdentityDevelopment
    },
  }
}
