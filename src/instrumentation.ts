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
  //
  // Everything below is wrapped in try/catch and never throws (2026-09-08):
  // this hook runs on every server startup for every route, so a hard
  // throw here means one image-format hardening step takes down the
  // entire site if sharp's native binary is ever missing/mismatched for
  // any reason (confirmed in production this session -- see
  // next.config.ts's outputFileTracingIncludes comment for the actual
  // fix to the missing-binary problem; this try/catch is a second,
  // independent layer so the same failure mode can never fully outage
  // the site again even if that fix is ever incomplete).
  try {
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
  } catch (err) {
    console.error(
      "instrumentation: failed to load sharp / apply format blocklist -- continuing without it",
      err,
    );
  }
}
