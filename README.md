# Aether Commerce OS

Aether is a full-stack commerce operations workspace built as an alternative to traditional hosted store administration tools. It combines a React 19 storefront and administration experience with a TypeScript Express middleware layer for catalog, customers, orders, inventory, purchasing, payments, stores, and reporting.

The application is organized as a private npm workspace monorepo:

- `frontend/` is the browser application, built with Vite, TanStack Router, React Query, Zustand, Tailwind CSS, Radix UI, Motion, and Recharts.
- `backend/` is the Express TypeScript API layer. It validates configuration, forwards authenticated requests to the configured business-data service, exposes commerce endpoints, and provides a controlled generic proxy.
- The root `package.json` supplies the workspace scripts and runs both applications together.

## Product Areas

The application covers the complete operating surface of a modern commerce business:

- Dashboard overview, analytics, revenue charts, traffic channels, and top-page reporting.
- Products, product variants, SKUs, categories, collections, pricing, tags, SEO fields, media, and stock tracking.
- Orders, draft orders, abandoned checkouts, payments, fulfillment, shipping status, refunds, returns, invoices, addresses, timelines, and customer records.
- Inventory by warehouse, low-stock monitoring, committed stock, inbound stock, damaged stock, returned stock, and warehouse availability.
- Purchase Orders with suppliers, line items, tax, discount, payment entries, balances, schedules, warehouses, attachments, activity, filtering, CSV/PDF export, printing, duplication, and detail views.
- Purchase Invoices with supplier bills, due dates, payment state, tax, discounts, outstanding balances, returns, debit notes, stock updates, purchase-order references, payment terms, attachments, activity, filtering, exports, printing, and detail views.
- Gift Cards, including listing, lookup, balance validation, and redemption-oriented API support.
- Online Store, storefront rendering, cart drawer, media selection, content sections, templates, template previews, template application, publishing, and a visual website builder.
- Growth, campaign management, attribution, marketing channels, and customer acquisition reporting.
- Store administration including store selection, multi-tenant data isolation, profile, workspace, security, notifications, inbox, billing, appearance, language and region, API keys, accessibility, and help center screens.

## Architecture

The browser communicates with the backend through `/api`. During development, Vite proxies that path to the Express server on port `5000`. The backend then calls the configured upstream business-data service using either a forwarded browser session cookie or configured service credentials.

```text
Browser
  |
  | React UI, TanStack Router, React Query, Zustand
  v
Vite development server :3000
  |
  | /api proxy
  v
Express middleware :5000
  |
  | typed controllers, validation, error handling, auth forwarding
  v
Configured upstream business-data service
```

### Data flow

1. Frontend API modules call the local `/api` client.
2. Express routes select a focused controller for products, inventory, purchasing, gift cards, or stores.
3. Controllers build filters, pagination, sorting, and request payloads.
4. The shared service applies authentication, forwards cookies when present, and performs resource or method requests.
5. Frontend mappers convert upstream records into stable product, category, inventory, order, purchase order, and purchase invoice models.
6. React Query hooks and Zustand stores make the data available to dashboard, builder, and storefront views.

## Requirements

- Node.js 20 or newer
- npm 10 or newer
- Access to the configured upstream business-data service for live records

## Installation

From the repository root:

```bash
npm install
```

The root workspace installs dependencies for both `frontend` and `backend`.

### Environment configuration

Create the local environment files from the checked-in examples and keep secrets out of Git:

```bash
Copy-Item backend/.env.example backend/.env
New-Item frontend/.env -ItemType File -Force
```

Configure the backend with its port, runtime mode, frontend origin, upstream base URL, and upstream authentication values. The supplied `backend/.env.example` is the authoritative list of required variable names. Configure `frontend/.env` with the backend URL, normally `http://localhost:5000`.

The default local ports are:

- Frontend: `http://localhost:3000`
- Backend health endpoint: `http://localhost:5000/health`

Environment files are ignored by Git. Never commit API keys, API secrets, cookies, or production URLs.

## Running the Application

From the root directory:

```bash
# Run frontend and backend together
npm run dev

# Run only the frontend
npm run dev:frontend

# Run only the backend
npm run dev:backend
```

The frontend also supports these workspace-local commands:

```bash
cd frontend
npm run build
npm run build:dev
npm run preview
npm run lint
npm run format
```

Backend commands:

```bash
cd backend
npm run build
npm start
npm run lint
```

Root production build:

```bash
npm run build
```

## Backend Module Catalog

### Entry point, configuration, and shared service

- `backend/src/server.ts` creates the Express server, configures CORS, JSON parsing, request logging, health reporting, API mounting, and the centralized error middleware.
- The backend upstream configuration module loads environment variables, defines the upstream base URL, and creates service authentication headers.
- The backend upstream service module owns the Axios client and supports resource listing, single-record reads, creates, updates, deletes, method calls, cookie forwarding, and arbitrary proxied requests.
- `backend/src/middlewares/error.middleware.ts` normalizes controller and upstream failures into consistent HTTP error responses.
- The backend shared upstream types module defines response, item, category, inventory, purchase, gift-card, and store data shapes.

### Controllers

- `backend/src/controllers/product.controller.ts` handles product listing, item detail, item-group/category retrieval, search, filters, pagination, and totals.
- `backend/src/controllers/inventory.controller.ts` handles inventory bins, warehouse quantities, and item availability.
- `backend/src/controllers/purchase-order.controller.ts` lists and creates Purchase Orders with supplier, status, date, search, pagination, and sorting filters.
- `backend/src/controllers/purchase-invoice.controller.ts` lists, reads, creates, updates, amends, and deletes Purchase Invoices with supplier, status, date, pagination, and sorting filters.
- `backend/src/controllers/gift-card.controller.ts` lists gift cards and provides gift-card lookup and balance-oriented operations.
- `backend/src/controllers/stores.controller.ts` handles current-user and store/site operations used by store selection and multi-tenant flows.
- `backend/src/controllers/proxy.controller.ts` forwards explicitly routed resource and method requests while preserving relevant request data and authentication headers.

### Routes and endpoints

All routes are mounted below `/api` by `backend/src/routes/index.ts`:

- `backend/src/routes/product.routes.ts`: `GET /products`, `GET /products/:itemCode`, and item-group/category endpoints.
- `backend/src/routes/inventory.routes.ts`: inventory bin and warehouse endpoints.
- `backend/src/routes/purchase-order.routes.ts`: `GET /purchase-orders` and `POST /purchase-orders`.
- `backend/src/routes/purchase-invoice.routes.ts`: `GET /purchase-invoices`, `GET /purchase-invoices/:name`, `POST`, `PUT`, amend, and `DELETE` operations.
- `backend/src/routes/gift-card.routes.ts`: gift-card listing and lookup endpoints.
- `backend/src/routes/stores.routes.ts`: store and current-user endpoints.
- `backend/src/routes/index.ts`: combines all focused routes and the generic `/resource/*` and `/method/*` forwarding routes.

## Frontend Module Catalog

### Application shell and route modules

- `frontend/src/router.tsx`, `server.ts`, and `start.ts` bootstrap the TanStack application and server entry.
- `frontend/src/routes/__root.tsx` provides the HTML shell, metadata, theme initialization, localization, accessibility initialization, authentication provider, React Query provider, product synchronization, error handling, and nested route outlet.
- `frontend/src/routes/index.tsx` renders the landing experience.
- `frontend/src/routes/onboarding.tsx`, `stores.tsx`, and `forgot-password.tsx` cover onboarding, store selection, and password recovery.
- `frontend/src/routes/dashboard.tsx` and `dashboard.index.tsx` provide the dashboard shell and overview page.
- `frontend/src/routes/dashboard.$.tsx` is the dashboard dispatcher for products, collections, inventory, Purchase Orders, Purchase Invoices, gift cards, orders, customers, growth, media, online store, analytics, and fallback pages.
- `frontend/src/routes/dashboard.purchase-orders.index.tsx` and `dashboard.purchase-orders.$id.tsx` provide Purchase Order list and detail screens.
- `frontend/src/routes/dashboard.purchase-invoices.index.tsx` and `dashboard.purchase-invoices.$id.tsx` provide Purchase Invoice list and detail screens.
- `frontend/src/routes/dashboard.accessibility.tsx`, `dashboard.ai.tsx`, `dashboard.api-keys.tsx`, `dashboard.appearance.tsx`, `dashboard.billing.tsx`, `dashboard.inbox.tsx`, `dashboard.language.tsx`, `dashboard.notifications.tsx`, `dashboard.profile.tsx`, `dashboard.security.tsx`, `dashboard.settings.tsx`, and `dashboard.workspace.tsx` implement workspace administration screens.
- `frontend/src/routes/dashboard.new.$kind.tsx` provides create wizards for dashboard entities.
- `frontend/src/routes/builder.tsx` provides the visual site builder.
- `frontend/src/routes/site.$slug.tsx` renders a published public site by slug.
- `frontend/src/routes/store.$storeId.tsx`, `store.$storeId.index.tsx`, and `store.$storeId.$.tsx` provide tenant-scoped store layout, home, and catch-all views.
- `frontend/src/routes/store_.$storeId.settings.tsx`, `store_.$storeId.settings.index.tsx`, and `store_.$storeId.settings.$.tsx` provide tenant-scoped settings navigation and pages.
- `frontend/src/routes/templates.index.tsx`, `templates.$id.index.tsx`, and `templates.$id.apply.tsx` provide the template marketplace, preview, and application flow.
- `frontend/src/routeTree.gen.ts` is generated route metadata and must not be edited manually.
- `frontend/src/routes/README.md` documents file-based route conventions.

### API clients

- `frontend/src/api/client.ts` creates the Axios API client and handles local versus direct upstream request behavior.
- `frontend/src/api/auth.ts` implements registration, login, logout, password recovery, and session operations.
- `frontend/src/api/products.ts` defines product, item-group, and inventory response types and catalog requests.
- `frontend/src/api/collections.ts` retrieves category and collection data.
- `frontend/src/api/inventory.ts` retrieves bins and warehouse records.
- `frontend/src/api/orders.ts` retrieves and normalizes order records.
- `frontend/src/api/purchase-order.ts` defines Purchase Order records, line items, list/detail responses, and count requests.
- `frontend/src/api/purchase-invoice.ts` defines Purchase Invoice records, line items, payment references, list/detail responses, and write operations.
- `frontend/src/api/gift-cards.ts` defines gift-card records and operations.
- `frontend/src/api/stores.ts` handles store and site requests.

### Hooks, mappers, and state

- The frontend upstream-data hook supplies query hooks for products, categories, inventory, Purchase Orders, and related records.
- `frontend/src/hooks/useProducts.ts` loads products with inventory and maps them for the UI.
- `frontend/src/hooks/useOrders.ts` loads orders and applies the order adapter.
- `frontend/src/hooks/usePurchaseInvoices.ts` fetches and normalizes Purchase Invoices, including line items, payments, totals, and mutations.
- `frontend/src/hooks/use-mobile.tsx` provides responsive viewport detection.
- `frontend/src/lib/store-data-store.ts` is the central persisted multi-tenant business-data store for products, categories, collections, coupons, carts, orders, customers, shipping, and inventory accounting.
- `frontend/src/lib/purchase-orders-store.ts` stores Purchase Orders, calculates subtotal/tax/discount/grand total/paid/balance, maps upstream lines, and supports fetch, create, update, duplicate, and delete flows.
- `frontend/src/lib/purchase-invoices-store.ts` stores Purchase Invoices, calculates invoice totals, maps lines and payment data, and manages invoice operations.
- `frontend/src/lib/auth-store.ts`, `billing-store.ts`, `site-store.ts`, `site-ui-store.ts`, and `store-data-store.ts` manage authentication, billing, published site state, UI state, and tenant data.
- `frontend/src/lib/order-adapter.ts` maps upstream sales order states, payment states, shipping states, addresses, items, and timelines into frontend orders.
- `frontend/src/lib/mappers.ts`, the frontend upstream mappers module, and `frontend/src/mappers/products.ts` convert upstream catalog, category, inventory, and purchasing records into frontend models.
- `frontend/src/lib/section-schemas.ts`, `template-kits.ts`, and `templates-data.ts` define builder sections, template kits, template metadata, and starter content.
- `frontend/src/lib/theme-colors.ts` and `theme-provider.tsx` manage theme palettes, dark/light presentation, and initialization.
- `frontend/src/lib/locale-applier.tsx`, `locale-data.ts`, `locale-store.ts`, and `i18n/index.ts` and `i18n/translations.ts` manage language, region, translation lookup, and locale application.
- `frontend/src/lib/a11y-applier.tsx` and `a11y-store.ts` manage accessibility preferences and apply them at startup.
- `frontend/src/lib/locations-data.ts` contains location and regional data.
- `frontend/src/lib/token.ts` handles token utilities.
- `frontend/src/lib/utils.ts` contains shared class-name, formatting, and utility helpers.
- `frontend/src/lib/error-capture.ts`, `error-page.ts`, and `lovable-error-reporting.ts` provide error capture, error-page rendering, and reporting integration.

### Dashboard components

- `dashboard-shell.tsx`, `sidebar.tsx`, `topnav.tsx`, and `nav-config.ts` define navigation groups, commerce menus, tenant navigation, settings navigation, and the dashboard frame.
- `dashboard-home.tsx` provides the overview dashboard.
- `connected-pages.tsx` connects live product, category, collection, customer, and media views to data stores and API hooks.
- `orders-management.tsx` provides order search, filtering, status management, detail views, fulfillment, and customer/order actions.
- `inventory-management.tsx` provides warehouse inventory, stock levels, Purchase Order context, filters, and adjustments.
- `purchase-orders-page.tsx` provides Purchase Order metrics, search, supplier/status/date/amount filters, detail actions, create/edit flows, duplicate/delete actions, CSV/PDF export, print, import feedback, and payment summaries.
- `purchase-invoices-page.tsx` provides the equivalent Purchase Invoice workflow, including payment state, due dates, supplier filters, tax/discount totals, returns, outstanding amounts, export, print, and editing.
- `growth.tsx` provides growth dashboards and campaign-oriented views.
- `online-store.tsx` provides online store administration and publishing controls.
- `create-modal.tsx` and `glass-form.tsx` provide reusable creation dialogs and forms.
- `help-center.tsx` provides support and help content.

### Builder, site, template, media, and landing components

- `frontend/src/components/builder/inspector.tsx` edits selected section properties.
- `frontend/src/components/builder/publish-flow.tsx` handles preview and publishing steps.
- `frontend/src/components/site/cart-drawer.tsx` renders the shopping cart drawer.
- `frontend/src/components/site/sections.tsx` defines storefront section blocks.
- `frontend/src/components/site/site-render.tsx` renders configured sites.
- `frontend/src/components/site/storefront.tsx` renders the customer-facing storefront.
- `frontend/src/components/templates/site-preview.tsx` previews a template.
- `frontend/src/components/templates/templates-marketplace.tsx` displays available templates.
- `frontend/src/components/media/media-picker.tsx` provides reusable asset selection.
- `frontend/src/components/landing/effects.tsx`, `hero-dashboard.tsx`, and `primitives.tsx` build the landing presentation.
- `frontend/src/components/auth/auth-modal.tsx` supplies sign-in, registration, recovery, and session UI.

### Shared UI library

`frontend/src/components/ui/` contains the reusable accessible component set: accordion, alert, alert-dialog, aspect-ratio, avatar, badge, breadcrumb, button, calendar, card, carousel, chart, checkbox, collapsible, command palette, context menu, dialog, drawer, dropdown menu, floating menu, form, hover card, input, OTP input, label, menubar, navigation menu, pagination, popover, portal, progress, radio group, resizable panels, scroll area, searchable select, select, separator, sheet, sidebar, skeleton, slider, toast/sonner, switch, table, tabs, toggle, toggle group, and tooltip.

## Business Workflow Notes

### Purchase Orders

Purchase Orders begin with supplier, warehouse, currency, order date, schedule date, and line items. Each line supports product/SKU, quantity, unit, cost, tax, discount, warehouse, scheduled receipt date, and received quantity. The store calculates subtotal, discount, tax, grand total, paid amount, and balance. Users can search and filter by supplier, status, date range, and amount, then inspect, edit, duplicate, delete, import, export, print, and record payment entries.

### Purchase Invoices

Purchase Invoices represent supplier bills and support company, supplier, bill number/date, posting date, due date, currency, payment terms, warehouse, taxes, discounts, net total, grand total, rounded total, paid amount, and outstanding amount. Lines retain product, SKU, description, quantity, unit, cost, discount, amount, warehouse, Purchase Order reference, Purchase Receipt reference, expense account, and cost center. The workflow includes draft/submitted/paid/partly-paid/unpaid/overdue/cancelled/return/debit-note states, payment records, stock updates, return references, detail pages, amendment, update, deletion, export, and printing.

### Storefront and tenant isolation

Store data is persisted per tenant. Authentication initialization switches the active tenant, and the same product, collection, cart, customer, and order models are shared by dashboard, builder, and published site views. This keeps administration and storefront behavior aligned while leaving the persistence boundary replaceable for future deployment architectures.

## API Summary

The backend exposes these focused resources below `/api`:

| Resource | Main operations |
| --- | --- |
| Products | List, search, filter, paginate, read details, retrieve categories |
| Inventory | Read item quantities, warehouse bins, and availability |
| Purchase Orders | List with filters and pagination; create |
| Purchase Invoices | List, read, create, update, amend, delete |
| Gift Cards | List, read, validate balances, and redemption-oriented access |
| Stores | Read current user and store/site data |
| Resource forwarding | Controlled arbitrary resource requests |
| Method forwarding | Controlled arbitrary method requests |

## Repository and Generated Files

- `.gitignore` excludes dependencies, build output, local environment files, logs, editor settings, and generated TanStack files.
- `frontend/src/routeTree.gen.ts` is generated by the router tooling.
- `.tanstack/` contains generated framework artifacts and should not be committed.
- `frontend/.env` and `backend/.env` are local-only configuration files.

## License

No license has been selected for this repository yet. Add a license file before making the project public if you want to define reuse and distribution terms.
