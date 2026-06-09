type WizardEventProps = Record<string, string | number | boolean | undefined>;

export function trackEvent(name: string, props?: WizardEventProps) {
  if (typeof window === "undefined") {
    return;
  }

  void import("@vercel/analytics")
    .then(({ track }) => {
      track(name, props);
    })
    .catch(() => {
      // Analytics optional — ignore load failures
    });
}
