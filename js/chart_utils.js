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
        .attr("role", "img")
        .attr("aria-label", container.attr("aria-label") || "Data chart");

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

