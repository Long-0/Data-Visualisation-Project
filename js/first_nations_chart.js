const drawFirstNationsChart = data => {
    const values = [];

    d3.rollup(
        data,
        rows => d3.sum(rows, d => d.hospitalisations),
        d => d.status,
        d => d.year
    ).forEach((statusValues, status) => {
        const baseline = statusValues.get(2011);
        if (!baseline) return;

        statusValues.forEach((hospitalisations, year) => {
            values.push({
                year: String(year),
                status,
                hospitalisations,
                index: hospitalisations / baseline * 100
            });
        });
    });

    const statuses = [...new Set(values.map(d => d.status))];
    const years = [...new Set(values.map(d => d.year))];
    const { svg, width, height, margin } = createSvg(
        "#first-nations-chart",
        300,
        { top: 20, right: 24, bottom: 52, left: 84 }
    );

    const x = d3.scalePoint()
        .domain(years)
        .range([margin.left, width - margin.right]);

    const indexExtent = d3.extent(values, d => d.index);
    const indexPadding = Math.max(5, (indexExtent[1] - indexExtent[0]) * 0.06);
    const y = d3.scaleLinear()
        .domain([
            Math.max(0, indexExtent[0] - indexPadding),
            indexExtent[1] + indexPadding
        ])
        .nice()
        .range([height - margin.bottom, margin.top]);

    addYAxisGrid(svg, y, width, margin);
    addXAxisGrid(svg, x, height, margin);

    svg.append("g")
        .attr("class", "axis")
        .attr("transform", `translate(0,${height - margin.bottom})`)
        .call(d3.axisBottom(x));

    svg.append("g")
        .attr("class", "axis")
        .attr("transform", `translate(${margin.left},0)`)
        .call(d3.axisLeft(y).ticks(5).tickFormat(d3.format(".0f")));

    addAxisLabels(
        svg,
        width,
        height,
        margin,
        "Calendar year",
        "Admission index (2011 = 100)"
    );

    const tooltip = addTooltip();

    statuses.forEach((status, index) => {
        const statusValues = values.filter(d => d.status === status);
        const color = status === "First Nations people" ? colors.orange : colors.teal;

        svg.append("path")
            .datum(statusValues)
            .attr("fill", "none")
            .attr("stroke", color)
            .attr("stroke-width", 2.5)
            .attr("stroke-dasharray", status === "First Nations people" ? "7 3" : null)
            .attr(
                "d",
                d3.line()
                    .x(d => x(d.year))
                    .y(d => y(d.index))
            );

        const points = svg.selectAll(`.status-${index}`)
            .data(statusValues)
            .join("circle")
            .attr("class", `status-${index}`)
            .attr("cx", d => x(d.year))
            .attr("cy", d => y(d.index))
            .attr("r", 3.5)
            .attr("fill", color)
            .attr("tabindex", 0)
            .attr("aria-pressed", "false")
            .attr("aria-label", d =>
                `${d.status}, ${d.year}: index ${d.index.toFixed(1)} (2011 = 100), ${formatNumber(d.hospitalisations)} hospitalisations`
            )
            .attr("r", 0);

        points.transition()
            .delay((d, i) => i * 50)
            .duration(350)
            .attr("r", 3.5);

        bindTooltip(
            points,
            tooltip,
            d =>
                `<strong>${d.status}, ${d.year}</strong><br>Index: ${d.index.toFixed(1)} (2011 = 100)<br>${formatNumber(d.hospitalisations)} hospitalisations`
        );

    });

    const legend = d3.select("#first-nations-chart")
        .append("div")
        .attr("class", "legend");

    statuses.forEach(status => {
        const color = status === "First Nations people" ? colors.orange : colors.teal;
        legend.append("span")
            .attr("class", "legend-item")
            .html(
                `<span class="legend-swatch" style="background:${color}"></span>${status}`
            );
    });
};
