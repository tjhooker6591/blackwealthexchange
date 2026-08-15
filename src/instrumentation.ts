declare global {
  var __non_webpack_require__: NodeJS.Require | undefined;
}

declare const __non_webpack_require__: NodeJS.Require | undefined;

export async function register() {
  if (process.env.NEXT_RUNTIME === "edge") return;

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
