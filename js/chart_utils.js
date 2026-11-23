const colors = {
    blue: "#0072B2",
    teal: "#009E73",
    orange: "#D55E00",
    female: "#0072B2",
    male: "#D55E00",
    grey: "#9AA5B1",
    ink: "#17233c"
};

const formatNumber = d3.format(",");

const createSvg = (
    selector,
    height = 300,
    margin = { top: 20, right: 24, bottom: 52, left: 64 }
) => {
    const container = d3.select(selector);
    const width = Math.max(
        320,
        container.node().getBoundingClientRect().width
    );

    const svg = container.append("svg")
        .attr("width", "100%")
        .attr("height", height)
        .attr("viewBox", `0 0 ${width} ${height}`)
        .attr("preserveAspectRatio", "xMidYMid meet")
        .attr("role", "img")
        .attr("aria-label", container.attr("aria-label") || "Data chart");

    addChartControls(selector, svg);

    return { svg, width, height, margin };
};

const addTooltip = () => {
    return d3.select("body")
        .append("div")
        .attr("class", "tooltip")
        .style("opacity", 0);
};

const bindTooltip = (selection, tooltip, getHtml) => {
    let pinned = false;

    const show = (event, datum) => {
        tooltip.style("opacity", 1).html(getHtml(datum));
        if (event && event.clientX != null) {
            tooltip
                .style("left", `${event.clientX + 12}px`)
                .style("top", `${event.clientY - 30}px`);
        } else {
            const node = event ? event.currentTarget : null;
            const rect = node && node.getBoundingClientRect
                ? node.getBoundingClientRect()
                : null;
            if (rect) {
                tooltip
                    .style("left", `${rect.left + rect.width / 2 + 12}px`)
                    .style("top", `${rect.top - 8}px`);
            }
        }
    };

    const hide = () => {
        if (!pinned) tooltip.style("opacity", 0);
    };

    selection
        .on("mouseenter", (event, d) => show(event, d))
        .on("mousemove", event => {
            tooltip
                .style("left", `${event.clientX + 12}px`)
                .style("top", `${event.clientY - 30}px`);
        })
        .on("mouseleave", hide)
        .on("focus", (event, d) => show(event, d))
        .on("blur", hide)
        .on("click", (event, d) => {
            pinned = !pinned;
            selection.attr("aria-pressed", datum => datum === d ? String(pinned) : "false");
            show(event, d);
        })
        .on("keydown", (event, d) => {
            if (event.key === "Enter" || event.key === " ") {
                event.preventDefault();
                pinned = !pinned;
                selection.attr("aria-pressed", datum => datum === d ? String(pinned) : "false");
                show(event, d);
            }
            if (event.key === "Escape") {
                pinned = false;
                selection.attr("aria-pressed", "false");
                tooltip.style("opacity", 0);
            }
        });
};

const addChartControls = (selector, svg) => {
    const container = d3.select(selector);
    container.select(":scope + .chart-toolbar").remove();

    const toolbar = container.insert("div", ":first-child")
        .attr("class", "chart-toolbar")
        .attr("aria-label", "Chart zoom controls");

    let scale = 1;
    let offsetX = 0;
    let offsetY = 0;
    let dragging = false;
    let startX = 0;
    let startY = 0;

    const applyTransform = () => {
        svg.style("transform", `translate(${offsetX}px, ${offsetY}px) scale(${scale})`);
    };

    toolbar.append("button")
        .attr("type", "button")
        .attr("aria-label", "Zoom in")
        .attr("title", "Zoom in")
        .text("+")
        .on("click", () => {
            scale = Math.min(3, +(scale + 0.25).toFixed(2));
            applyTransform();
        });

    toolbar.append("button")
        .attr("type", "button")
        .attr("aria-label", "Zoom out")
        .attr("title", "Zoom out")
        .text("−")
        .on("click", () => {
            scale = Math.max(1, +(scale - 0.25).toFixed(2));
            if (scale === 1) {
                offsetX = 0;
                offsetY = 0;
            }
            applyTransform();
        });

    toolbar.append("button")
        .attr("type", "button")
        .attr("aria-label", "Reset chart view")
        .attr("title", "Reset chart view")
        .text("↺")
        .on("click", () => {
            scale = 1;
            offsetX = 0;
            offsetY = 0;
            applyTransform();
        });

    svg
        .on("wheel", event => {
            event.preventDefault();
            scale = event.deltaY < 0
                ? Math.min(3, +(scale + 0.15).toFixed(2))
                : Math.max(1, +(scale - 0.15).toFixed(2));
            if (scale === 1) {
                offsetX = 0;
                offsetY = 0;
            }
            applyTransform();
        })
        .on("pointerdown", event => {
            if (scale === 1 || event.target !== svg.node()) return;
            dragging = true;
            startX = event.clientX - offsetX;
            startY = event.clientY - offsetY;
            svg.node().setPointerCapture(event.pointerId);
        })
        .on("pointermove", event => {
            if (!dragging) return;
            offsetX = event.clientX - startX;
            offsetY = event.clientY - startY;
            applyTransform();
        })
        .on("pointerup pointercancel", event => {
            dragging = false;
            if (svg.node().hasPointerCapture(event.pointerId)) {
                svg.node().releasePointerCapture(event.pointerId);
            }
        });
};

const addYAxisGrid = (svg, y, width, margin) => {
    svg.append("g")
        .attr("class", "grid-line")
        .attr("transform", `translate(${margin.left},0)`)
        .call(
            d3.axisLeft(y)
                .tickSize(-(width - margin.left - margin.right))
                .tickFormat("")
        );
};

const addXAxisGrid = (svg, x, height, margin) => {
    svg.append("g")
        .attr("class", "grid-line")
        .attr("transform", `translate(0,${height - margin.bottom})`)
        .call(
            d3.axisBottom(x)
                .tickSize(-(height - margin.top - margin.bottom))
                .tickFormat("")
        );
};

const addAxisLabels = (svg, width, height, margin, xLabel, yLabel) => {
    svg.append("text")
        .attr("class", "axis-label")
        .attr("x", (width + margin.left - margin.right) / 2)
        .attr("y", height - 8)
        .attr("text-anchor", "middle")
        .text(xLabel);

    svg.append("text")
        .attr("class", "axis-label")
        .attr("transform", "rotate(-90)")
        .attr("x", -(height + margin.top - margin.bottom) / 2)
        .attr("y", 16)
        .attr("text-anchor", "middle")
        .text(yLabel);
};

