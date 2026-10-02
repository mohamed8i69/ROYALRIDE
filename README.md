# Front

This project was generated using [Angular CLI](https://github.com/angular/angular-cli) version 22.1.8.

## Development server

To start a local development server, run:

```bash
ng serve
```

Once the server is running, open your browser and navigate to `http://localhost:4200/`. The application will automatically reload whenever you modify any of the source files.

## Code scaffolding

Angular CLI includes powerful code scaffolding tools. To generate a new component, run:

```bash
ng generate component component-name
```

For a complete list of available schematics (such as `components`, `directives`, or `pipes`), run:

```bash
ng generate --help
```

## Building

To build the project run:

```bash
ng build
```

This will compile your project and store the build artifacts in the `dist/` directory. By default, the production build optimizes your application for performance and speed.

## Running unit tests

To execute unit tests with the [Vitest](https://vitest.dev/) test runner, use the following command:

```bash
ng test
```

## Running end-to-end tests

For end-to-end (e2e) testing, run:

```bash
ng e2e
```

Angular CLI does not come with an end-to-end testing framework by default. You can choose one that suits your needs.

## Additional Resources

For more information on using the Angular CLI, including detailed command references, visit the [Angular CLI Overview and Command Reference](https://angular.dev/tools/cli) page.

## Project Maintenance Notes

### Homepage section order

Section order is shared between the admin layout editor, the site-content API, and the homepage. Trace all three when changing it:

- `src/app/services/site-content.service.ts` defines `SectionId`, the default order, loading/normalization, and the dedicated `saveSectionOrder()` API request. Loading removes unknown and duplicate IDs, then appends any missing default sections.
- `src/app/Layouts/admin/admin.ts` edits the local `draft().sectionOrder` and saves it through `saveLayout()`.
- `src/app/Layouts/admin/admin.html` displays the order controls and invokes `saveLayout()` from the layout panel. Keep this separate from the general `save()` action used by content and fleet editors.
- `src/app/Layouts/home/home.ts` maps section IDs to 1-based positions. `src/app/Layouts/home/home.html` applies the corresponding `order-N` classes to the top-level sections.

When adding or renaming a section, keep its ID consistent across `SectionId`, the default order, admin labels/icons, the homepage section ID and `sectionPos()` binding. The homepage template uses explicit `order-N` classes: extend the full set of bindings on every top-level section when the supported section count grows, not only on the new section. Verify that the new section remains in the correct place after saving and reloading; the API must support the dedicated section-order endpoint.

The order bindings were completed for all supported sections through `order-6`. This avoids any section falling outside the explicit ordering set when the saved layout is larger than five entries.

Vehicle card thumbnails also follow the final design treatment: each card keeps a 4:3 image frame and uses `object-cover object-bottom` so the lower portion of the car stays visible without cropping the vehicle out of the frame. The click-to-open lightbox behaviour is preserved.

For section-order changes, run `npm run build`. Also verify persistence in the admin UI by moving a section, saving, reloading the page, and confirming both the editor order and homepage order match. This workspace contains the frontend; API behavior may need to be verified in the backend project.
