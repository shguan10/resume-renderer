**Add your own guidelines here**
I do not want the `any` type used. Replace any instance of it to a more suitable, more idiomatic, type. You can create new interfaces/types if you have to.
When adding an ui element, always refer to the theme.css. If there is no relevant css component then be sure to add it to theme.css.
Views should always return a Layout and Components. When creating a new View, also create a similarly named Layout and put the layout in src/app/components/layouts
Do not use React.FormEvent as it has been deprecated. Use a suitable alternative.
Prefer to use next/dynamic for lazy imports in registry files.
Do not use relative paths. Always use paths prefixed with @, e.g. @/app/utils/fittingAlgorithm