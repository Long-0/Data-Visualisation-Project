const drawFirstNationsChart = data => {
    const values = [];

    d3.rollup(
        data,
        rows => d3.sum(rows, d => d.hospitalisations),
        d => d.year,
        d => d.status
    ).forEach((statusValues, year) => {
        statusValues.forEach((hospitalisations, status) => {
            values.push({
                year: String(year),
                status,
                hospitalisations
            });
        });
    });

    const statuses = [...new Set(values.map(d => d.status))];
    const years = [...new Set(values.map(d => d.year))];
    const { svg, width, height, margin } = createSvg(
        "#first-nations-chart"
    );

    const x = d3.scalePoint()
        .domain(years)
        .range([margin.left, width - margin.right]);

    const y = d3.scaleLinear()
        .domain([0, d3.max(values, d => d.hospitalisations)])
        .nice()
        .range([height - margin.bottom, margin.top]);

    addYAxisGrid(svg, y, width, margin);

    svg.append("g")
        .attr("class", "axis")
        .attr("transform", `translate(0,${height - margin.bottom})`)
        .call(d3.axisBottom(x));

    svg.append("g")
        .attr("class", "axis")
        .attr("transform", `translate(${margin.left},0)`)
        .call(d3.axisLeft(y).ticks(5).tickFormat(formatNumber));

    addAxisLabels(
        svg,
        width,
        height,
        margin,
        "Calendar year",
        "Hospitalisations (count)"
    );

    const tooltip = addTooltip();

    statuses.forEach((status, index) => {
        const statusValues = values.filter(d => d.status === status);
        const color = index ? colors.teal : colors.orange;

        svg.append("path")
            .datum(statusValues)
            .attr("fill", "none")
            .attr("stroke", color)
            .attr("stroke-width", 2.5)
            .attr(
                "d",
                d3.line()
                    .x(d => x(d.year))
                    .y(d => y(d.hospitalisations))
            );

        svg.selectAll(`.status-${index}`)
            .data(statusValues)
            .join("circle")
            .attr("class", `status-${index}`)
            .attr("cx", d => x(d.year))
            .attr("cy", d => y(d.hospitalisations))
            .attr("r", 3.5)
            .attr("fill", color)
            .on("mouseenter", (event, d) => {
                tooltip.style("opacity", 1)
                    .html(
                        `<strong>${d.status}, ${d.year}</strong><br>${formatNumber(d.hospitalisations)} hospitalisations`
                    );
            })
            .on("mousemove", event => {
                tooltip.style("left", `${event.clientX + 12}px`)
                    .style("top", `${event.clientY - 30}px`);
            })
            .on("mouseleave", () => tooltip.style("opacity", 0));
    });

    const legend = d3.select("#first-nations-chart")
        .append("div")
        .attr("class", "legend");

    statuses.forEach((status, index) => {
        legend.append("span")
            .attr("class", "legend-item")
            .html(
                `<span class="legend-swatch" style="background:${index ? colors.teal : colors.orange}"></span>${status}`
            );
    });
};
