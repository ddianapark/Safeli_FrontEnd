/* eslint-disable */
import * as Router from 'expo-router';

export * from 'expo-router';

declare module 'expo-router' {
  export namespace ExpoRouter {
    export interface __routes<T extends string | object = string> {
      hrefInputParams: { pathname: Router.RelativePathString, params?: Router.UnknownInputParams } | { pathname: Router.ExternalPathString, params?: Router.UnknownInputParams } | { pathname: `/apiClient`; params?: Router.UnknownInputParams; } | { pathname: `/forgot-password`; params?: Router.UnknownInputParams; } | { pathname: `/home`; params?: Router.UnknownInputParams; } | { pathname: `/`; params?: Router.UnknownInputParams; } | { pathname: `/perfil`; params?: Router.UnknownInputParams; } | { pathname: `/signup`; params?: Router.UnknownInputParams; } | { pathname: `/verify-code`; params?: Router.UnknownInputParams; } | { pathname: `/_sitemap`; params?: Router.UnknownInputParams; };
      hrefOutputParams: { pathname: Router.RelativePathString, params?: Router.UnknownOutputParams } | { pathname: Router.ExternalPathString, params?: Router.UnknownOutputParams } | { pathname: `/apiClient`; params?: Router.UnknownOutputParams; } | { pathname: `/forgot-password`; params?: Router.UnknownOutputParams; } | { pathname: `/home`; params?: Router.UnknownOutputParams; } | { pathname: `/`; params?: Router.UnknownOutputParams; } | { pathname: `/perfil`; params?: Router.UnknownOutputParams; } | { pathname: `/signup`; params?: Router.UnknownOutputParams; } | { pathname: `/verify-code`; params?: Router.UnknownOutputParams; } | { pathname: `/_sitemap`; params?: Router.UnknownOutputParams; };
      href: Router.RelativePathString | Router.ExternalPathString | `/apiClient${`?${string}` | `#${string}` | ''}` | `/forgot-password${`?${string}` | `#${string}` | ''}` | `/home${`?${string}` | `#${string}` | ''}` | `/${`?${string}` | `#${string}` | ''}` | `/perfil${`?${string}` | `#${string}` | ''}` | `/signup${`?${string}` | `#${string}` | ''}` | `/verify-code${`?${string}` | `#${string}` | ''}` | `/_sitemap${`?${string}` | `#${string}` | ''}` | { pathname: Router.RelativePathString, params?: Router.UnknownInputParams } | { pathname: Router.ExternalPathString, params?: Router.UnknownInputParams } | { pathname: `/apiClient`; params?: Router.UnknownInputParams; } | { pathname: `/forgot-password`; params?: Router.UnknownInputParams; } | { pathname: `/home`; params?: Router.UnknownInputParams; } | { pathname: `/`; params?: Router.UnknownInputParams; } | { pathname: `/perfil`; params?: Router.UnknownInputParams; } | { pathname: `/signup`; params?: Router.UnknownInputParams; } | { pathname: `/verify-code`; params?: Router.UnknownInputParams; } | { pathname: `/_sitemap`; params?: Router.UnknownInputParams; };
    }
  }
}
