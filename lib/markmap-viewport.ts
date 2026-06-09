import { ZoomTransform, zoomIdentity, zoomTransform } from "d3";
import type { INode } from "markmap-common";
import type { IPadding, Markmap } from "markmap-view";

/** Allow slight zoom-out past fit-to-content (10%). */
const ZOOM_OUT_SLACK = 0.9;
/** Max zoom-in relative to fit scale. */
const MAX_ZOOM_IN_FACTOR = 4;
/** Pixels of empty margin allowed when panning. */
const PAN_MARGIN_PX = 56;
/** Extra margin around measured content for initial fit. */
const FIT_PADDING_PX = 32;
/** Additional padding when reframing after a branch expand. */
const EXPAND_FIT_PADDING_PX = 48;
/** Fold circles and link caps extend slightly past node rects. */
const NODE_CHROME_PX = 10;
/** Padding passed to ensureVisible after expand (mindmap grows to the right). */
const EXPAND_ENSURE_PADDING: Partial<IPadding> = {
  left: 64,
  right: 96,
  top: 48,
  bottom: 48,
};

const fitBypass = new WeakMap<Markmap, boolean>();

type ContentRect = {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
};

function isValidRect(rect: ContentRect): boolean {
  return rect.x2 - rect.x1 > 0 && rect.y2 - rect.y1 > 0;
}

function unionRects(a: ContentRect, b: ContentRect): ContentRect {
  return {
    x1: Math.min(a.x1, b.x1),
    y1: Math.min(a.y1, b.y1),
    x2: Math.max(a.x2, b.x2),
    y2: Math.max(a.y2, b.y2),
  };
}

function getMarkmapScaleBounds(mm: Markmap): { minScale: number; maxScale: number } {
  const svgNode = mm.svg.node();
  if (!svgNode || !isValidRect(mm.state.rect)) {
    return { minScale: 0.05, maxScale: 8 };
  }
  const { width, height } = svgNode.getBoundingClientRect();
  const fitRect = getFitContentRect(mm);
  const fitScale = computeFitScale(width, height, fitRect, mm.options.fitRatio);
  return {
    minScale: fitScale * ZOOM_OUT_SLACK,
    maxScale: Math.max(fitScale * MAX_ZOOM_IN_FACTOR, mm.options.maxInitialScale),
  };
}

function refreshMarkmapScaleExtent(mm: Markmap): void {
  const { minScale, maxScale } = getMarkmapScaleBounds(mm);
  mm.zoom.scaleExtent([minScale, maxScale]);
}

export function expandContentRect(
  rect: ContentRect,
  padding: number,
): ContentRect {
  return {
    x1: rect.x1 - padding,
    y1: rect.y1 - padding,
    x2: rect.x2 + padding,
    y2: rect.y2 + padding,
  };
}

export function computeFitScale(
  width: number,
  height: number,
  rect: ContentRect,
  fitRatio: number,
): number {
  const contentWidth = rect.x2 - rect.x1;
  const contentHeight = rect.y2 - rect.y1;
  if (contentWidth <= 0 || contentHeight <= 0 || width <= 0 || height <= 0) {
    return 1;
  }
  return Math.min(
    (width / contentWidth) * fitRatio,
    (height / contentHeight) * fitRatio,
  );
}

function clampAxis(min: number, max: number, value: number): number {
  if (min > max) {
    return (min + max) / 2;
  }
  return Math.min(max, Math.max(min, value));
}

export function clampPanTransform(
  transform: ZoomTransform,
  width: number,
  height: number,
  rect: ContentRect,
  margin: number,
): ZoomTransform {
  const { k, x, y } = transform;
  const minX = margin - rect.x2 * k;
  const maxX = width + margin - rect.x1 * k;
  const minY = margin - rect.y2 * k;
  const maxY = height + margin - rect.y1 * k;
  return new ZoomTransform(
    k,
    clampAxis(minX, maxX, x),
    clampAxis(minY, maxY, y),
  );
}

function getViewportExtent(svgNode: SVGElement): [[number, number], [number, number]] {
  const { width, height } = svgNode.getBoundingClientRect();
  return [
    [0, 0],
    [width, height],
  ];
}

/**
 * Measure bounds of rendered, unfolded nodes. More reliable than state.rect on
 * first paint when foreignObject sizing has not settled yet.
 */
export function measureVisibleContentRect(mm: Markmap): ContentRect | null {
  const group = mm.g?.node();
  if (!group) {
    return null;
  }

  let x1 = Number.POSITIVE_INFINITY;
  let y1 = Number.POSITIVE_INFINITY;
  let x2 = Number.NEGATIVE_INFINITY;
  let y2 = Number.NEGATIVE_INFINITY;
  let found = false;

  group.querySelectorAll("g.markmap-node").forEach((node) => {
    const graphics = node as SVGGraphicsElement;
    const box = graphics.getBBox();
    if (box.width <= 0 || box.height <= 0) {
      return;
    }
    found = true;
    x1 = Math.min(x1, box.x);
    y1 = Math.min(y1, box.y);
    x2 = Math.max(x2, box.x + box.width);
    y2 = Math.max(y2, box.y + box.height);
  });

  if (!found) {
    return null;
  }

  return expandContentRect(
    { x1, y1, x2, y2 },
    FIT_PADDING_PX + NODE_CHROME_PX,
  );
}

/** Bounds of a branch and its unfolded descendants from layout state. */
export function measureSubtreeContentRect(
  _mm: Markmap,
  rootNode: INode,
): ContentRect | null {
  const rects: ContentRect[] = [];

  function walk(node: INode): void {
    const rect = node.state?.rect;
    if (rect && rect.width > 0 && rect.height > 0) {
      rects.push({
        x1: rect.x,
        y1: rect.y,
        x2: rect.x + rect.width,
        y2: rect.y + rect.height,
      });
    }
    if (node.payload?.fold || !node.children?.length) {
      return;
    }
    for (const child of node.children) {
      walk(child);
    }
  }

  walk(rootNode);
  if (!rects.length) {
    return null;
  }

  let combined = rects[0];
  for (let i = 1; i < rects.length; i += 1) {
    combined = unionRects(combined, rects[i]);
  }

  return expandContentRect(
    combined,
    FIT_PADDING_PX + NODE_CHROME_PX + EXPAND_FIT_PADDING_PX,
  );
}

export function getFitContentRect(mm: Markmap): ContentRect {
  const fromState = expandContentRect(
    mm.state.rect,
    FIT_PADDING_PX + NODE_CHROME_PX,
  );
  const measured = measureVisibleContentRect(mm);

  if (measured && isValidRect(measured)) {
    // Union layout rect with DOM measurement so we never under-frame after expand.
    return unionRects(measured, fromState);
  }

  return fromState;
}

export async function waitForMarkmapLayout(): Promise<void> {
  await new Promise<void>((resolve) => {
    requestAnimationFrame(() => resolve());
  });
  await new Promise<void>((resolve) => {
    requestAnimationFrame(() => resolve());
  });
  if (typeof document !== "undefined" && document.fonts?.ready) {
    await document.fonts.ready;
  }
}

/** Wait for markmap d3 transitions (toggleNode resolves before they finish). */
export async function waitForMarkmapLayoutAndTransitions(
  mm: Markmap,
): Promise<void> {
  await waitForMarkmapLayout();
  const duration = mm.options.duration ?? 500;
  await new Promise<void>((resolve) => {
    window.setTimeout(resolve, duration + 32);
  });
  await waitForMarkmapLayout();
}

async function applyFitTransform(
  mm: Markmap,
  rect: ContentRect,
  maxScale?: number,
): Promise<void> {
  const svgNode = mm.svg.node();
  if (!svgNode || !isValidRect(rect)) {
    return;
  }

  const { width, height } = svgNode.getBoundingClientRect();
  const { fitRatio } = mm.options;
  const contentWidth = rect.x2 - rect.x1;
  const contentHeight = rect.y2 - rect.y1;
  const scaleCap = maxScale ?? mm.options.maxInitialScale;
  const k = Math.min(
    (width / contentWidth) * fitRatio,
    (height / contentHeight) * fitRatio,
    scaleCap,
  );
  const transform = zoomIdentity
    .translate(
      (width - contentWidth * k) / 2 - rect.x1 * k,
      (height - contentHeight * k) / 2 - rect.y1 * k,
    )
    .scale(k);

  fitBypass.set(mm, true);
  try {
    await mm
      .transition(mm.svg)
      .call(mm.zoom.transform, transform)
      .end()
      .catch(() => {
        /* transition interrupted */
      });
  } finally {
    fitBypass.set(mm, false);
  }
}

/**
 * Fit viewport to currently visible mindmap content after layout settles.
 */
export async function fitMarkmapViewport(
  mm: Markmap,
  maxScale?: number,
): Promise<void> {
  await applyFitTransform(mm, getFitContentRect(mm), maxScale);
}

/**
 * Limits markmap zoom/pan to a band around fit-to-content so users cannot
 * scroll into vast empty space. Re-applies bounds after fit (resize, expand).
 */
export function installMarkmapViewportConstraints(mm: Markmap): void {
  const defaultConstrain = mm.zoom.constrain();

  function getScaleBounds() {
    return getMarkmapScaleBounds(mm);
  }

  function constrainViewport(
    transform: ZoomTransform,
    extent: [[number, number], [number, number]],
  ): ZoomTransform {
    const { minScale, maxScale } = getScaleBounds();
    let t = defaultConstrain(transform, extent, mm.zoom.translateExtent());
    const k = Math.min(maxScale, Math.max(minScale, t.k));
    if (k !== t.k) {
      t = new ZoomTransform(k, t.x, t.y);
    }
    return clampPanTransform(
      t,
      extent[1][0],
      extent[1][1],
      getFitContentRect(mm),
      PAN_MARGIN_PX,
    );
  }

  function refreshScaleExtent() {
    refreshMarkmapScaleExtent(mm);
  }

  mm.zoom.constrain((transform, extent, translateExtent) => {
    if (fitBypass.get(mm)) {
      return defaultConstrain(transform, extent, translateExtent);
    }
    return constrainViewport(transform, extent);
  });

  mm.svg.on("wheel", (event: WheelEvent) => {
    if (!mm.options.pan) {
      return;
    }
    if (mm.options.scrollForPan && event.ctrlKey) {
      return;
    }

    event.preventDefault();
    const svgNode = mm.svg.node();
    if (!svgNode) {
      return;
    }

    const extent = getViewportExtent(svgNode);
    const current = zoomTransform(svgNode);
    const next = current.translate(
      -event.deltaX / current.k,
      -event.deltaY / current.k,
    );
    mm.svg.call(mm.zoom.transform, constrainViewport(next, extent));
  });

  mm.fit = async (fitMaxScale?: number) => {
    await fitMarkmapViewport(mm, fitMaxScale);
    refreshScaleExtent();
  };

  if (isValidRect(mm.state.rect)) {
    refreshScaleExtent();
  }
}

function getExpandFitContentRect(mm: Markmap, expandedNode: INode): ContentRect {
  const fullRect = getFitContentRect(mm);
  const subtreeRect = measureSubtreeContentRect(mm, expandedNode);
  if (subtreeRect && isValidRect(subtreeRect)) {
    return unionRects(fullRect, subtreeRect);
  }
  return expandContentRect(fullRect, EXPAND_FIT_PADDING_PX);
}

async function ensureVisibleWithBypass(
  mm: Markmap,
  node: INode,
  padding: Partial<IPadding>,
): Promise<void> {
  fitBypass.set(mm, true);
  try {
    await mm.ensureVisible(node, padding);
  } finally {
    fitBypass.set(mm, false);
  }
}

/** Reframe viewport after expand: fit visible tree, then pan if branch still clipped. */
export async function fitExpandedBranch(
  mm: Markmap,
  expandedNode: INode,
): Promise<void> {
  await waitForMarkmapLayoutAndTransitions(mm);
  const rect = getExpandFitContentRect(mm, expandedNode);
  await applyFitTransform(mm, rect, mm.options.maxInitialScale);
  await ensureVisibleWithBypass(mm, expandedNode, EXPAND_ENSURE_PADDING);
}

/**
 * On branch expand, wait for layout transitions then reframe so new nodes are
 * fully visible. Collapse is left unchanged (no viewport jump).
 */
export function installMarkmapExpandAutoFit(mm: Markmap): () => void {
  const originalToggle = mm.toggleNode.bind(mm);

  mm.toggleNode = async (data: INode, recursive?: boolean) => {
    const wasFolded = Boolean(data.payload?.fold);
    await originalToggle(data, recursive);

    if (wasFolded) {
      await fitExpandedBranch(mm, data);
      refreshMarkmapScaleExtent(mm);
    }
  };

  return () => {
    mm.toggleNode = originalToggle;
  };
}
