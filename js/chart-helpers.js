const colors = {
    blue: "#266be8",
    teal: "#28a879",
    orange: "#f39a4a",
    female: "#f39a4a",
    male: "#266be8"
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
        .attr("role", "img");

    return { svg, width, height, margin };
};

const addTooltip = () => {
    return d3.select("body")
        .append("div")
        .attr("class", "tooltip")
        .style("opacity", 0);
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

const showLoadError = error => {
    console.error("Unable to load chart data:", error);
    d3.select("#load-error")
        .attr("hidden", null);
};
