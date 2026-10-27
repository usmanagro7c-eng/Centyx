import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { useEffect, type ReactNode } from "react";

import appCss from "../styles.css?url";
import { reportLovableError } from "../lib/lovable-error-reporting";
import { ThemeProvider, themeInitScript } from "../lib/theme-provider";
import { LocaleApplier } from "../lib/locale-applier";
import { I18nSync } from "../lib/i18n";
import { A11yApplier, a11yInitScript } from "../lib/a11y-applier";
import { MediaPickerHost } from "../components/media/media-picker";
import { AuthProvider } from "../components/auth/auth-modal";
import { useProductsWithInventory } from "../hooks/useProducts";
import { useStoreData } from "../lib/store-data-store";
import { useAuthStore } from "../lib/auth-store";
import { useSiteStore } from "../lib/site-store";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-bold text-foreground">404</h1>
        <h2 className="mt-4 text-xl font-semibold text-foreground">Page not found</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <div className="mt-6">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Go home
          </Link>
        </div>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error(error);
  const router = useRouter();
  useEffect(() => {
    reportLovableError(error, { boundary: "tanstack_root_error_component" });
  }, [error]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-xl font-semibold tracking-tight text-foreground">
          This page didn't load
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Something went wrong on our end. You can try refreshing or head back home.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button
            onClick={() => {
              router.invalidate();
              reset();
            }}
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Try again
          </button>
          <a
            href="/"
            className="inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent"
          >
            Go home
          </a>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "Aether — The operating system for modern commerce" },
      { name: "description", content: "Aether unifies payments, analytics and growth into one alive, real-time platform built for ambitious teams." },
      { name: "author", content: "Aether" },
      { property: "og:title", content: "Aether — The operating system for modern commerce" },
      { property: "og:description", content: "Unify payments, analytics and growth into one alive, real-time platform." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      { rel: "stylesheet", href: "https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap" },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: ReactNode }) {
  const htmlProps = typeof document !== "undefined" ? {
    className: document.documentElement.className || undefined,
    style: { colorScheme: document.documentElement.style.colorScheme || undefined },
    suppressHydrationWarning: true,
  } : { suppressHydrationWarning: true };

  return (
    <html lang="en" {...htmlProps}>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
        <script dangerouslySetInnerHTML={{ __html: a11yInitScript }} />
        <HeadContent />
      </head>
      <body>
        <a href="#main-content" className="skip-link">Skip to main content</a>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function ProductDataSync() {
  const { data: productsFromApi = [] } = useProductsWithInventory();
  const { syncProducts } = useStoreData.getState();

  useEffect(() => {
    if (productsFromApi.length > 0) {
      syncProducts(productsFromApi);
    }
  }, [productsFromApi]);

  return null;
}

function AuthInitializer() {
  useEffect(() => {
    const user = useAuthStore.getState().user;
    // If user is authenticated, ensure tenant is switched to their ID
    // This prevents the race condition where old data loads before auth completes
    if (user?.id) {
      useStoreData.getState().switchTenant(user.id);
      useSiteStore.getState().switchTenant(user.id);
    }
  }, []);

  return null;
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <LocaleApplier />
        <I18nSync />
        <A11yApplier />
        <AuthProvider>
          <AuthInitializer />
          <ProductDataSync />
          {/* Required: nested routes render here. Removing <Outlet /> breaks all child routes. */}
          <Outlet />
          <MediaPickerHost />
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

