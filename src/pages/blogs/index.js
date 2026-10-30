// Every research note in this folder, keyed by slug (its file name). Loaded eagerly so a note
// renders on the first pass, which is what lets the build write it into static HTML.
const modules = import.meta.glob(["./*.js", "!./index.js"], { eager: true, import: "default" });

export const POSTS = Object.fromEntries(
  Object.entries(modules).map(([file, post]) => [file.slice(2, -3), post]),
);
