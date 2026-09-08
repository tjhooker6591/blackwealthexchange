declare global {
  var __non_webpack_require__: NodeJS.Require | undefined;
}

declare const __non_webpack_require__: NodeJS.Require | undefined;

export async function register() {
  if (process.env.NEXT_RUNTIME === "edge") return;

  // Deliberately hides the module name from webpack's static analysis --
  // confirmed necessary (2026-09-07): next.config.ts's
  // serverExternalPackages: ["sharp"] does NOT stop webpack from trying to
  // trace into sharp's own source during the instrumentation-hook
  // compilation pass specifically (unlike ordinary server routes/RSC,
  // where it does). A plain `require("sharp")` here made webpack try to
  // bundle sharp's internals and fail on native/build-only requires
  // (child_process, @img/sharp-libvips-dev/*), producing a real 500 --
  // tested and reverted. The "Critical dependency: require function is
  // used in a way in which dependencies cannot be statically extracted"
  // warning this produces on dev server start is expected and harmless;
  // do not "fix" it by making this require statically analyzable again.
  const runtimeRequire =
    typeof __non_webpack_require__ === "function"
      ? __non_webpack_require__
      : typeof require === "function"
        ? require
        : globalThis.__non_webpack_require__;
  if (typeof runtimeRequire !== "function") {
    throw new Error("Server-side require is unavailable for sharp blocking");
  }

  const sharpPackageName = ["sh", "arp"].join("");
  const sharp = runtimeRequire(sharpPackageName);

  sharp.block({
    operation: [
      "VipsForeignLoadNsgif",
      "VipsForeignLoadTiff",
      "VipsForeignLoadVips",
    ],
  });
}
