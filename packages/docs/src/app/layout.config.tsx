import type { BaseLayoutProps } from 'fumadocs-ui/layouts/shared'

/**
 * Shared layout configurations
 *
 * you can customise layouts individually from:
 * Home Layout: app/(home)/layout.tsx
 * Docs Layout: app/docs/layout.tsx
 */
export const baseOptions: BaseLayoutProps = {
  nav: {
    title: (
      <>
        <img
          width={24}
          height={24}
          src="https://github.com/Afilmory/assets/blob/main/512-mac.png?raw=true"
          alt="Afilmory Logo"
        />
        Afilmory
      </>
    ),
  },
  // see https://fumadocs.dev/docs/ui/navigation/links
  links: [],
}
