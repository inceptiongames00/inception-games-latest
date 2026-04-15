import { src, dest, series, watch } from "gulp";
import terser from "gulp-terser";
import cached from "gulp-cached";
import stripDebug from "gulp-strip-debug";
import removeLogging from "gulp-remove-logging";
import replace from "gulp-replace";
import fs from "fs";

// Clean dist folder
function clean(cb) {
  fs.rmSync("./dist", { recursive: true, force: true });
  cb();
}

// Copy, strip logs & minify
function optimizeJS() {
  return (
    src("src/**/*.js")
      .pipe(cached("scripts"))
      .pipe(
        replace(
          /(from\s+['"])(\.{1,2}\/[^'"]+?)(['"])/g,
          (match, p1, p2, p3) => {
            if (p2.endsWith(".js") || p2.endsWith(".json")) return match;
            return `${p1}${p2}.js${p3}`;
          },
        ),
      )
      .pipe(stripDebug())
      .pipe(removeLogging())
      // ❌ remove terser for now
      // .pipe(terser({...}))
      .pipe(dest("dist"))
  );
}

// Watch for changes
function watchFiles() {
  watch("src/**/*.js", series(optimizeJS));
}

export { clean };
export { watchFiles as watch };
export { optimizeJS };
export const build = series(clean, optimizeJS);
export default build;
