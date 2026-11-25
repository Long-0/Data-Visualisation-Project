const drawNationalChart = data => {
    d3.select("#national-chart").html("");
    const { svg, width, height, margin } = createSvg(
        "#national-chart",
        300,
        { top: 20, right: 24, bottom: 52, left: 84 }
    );

    const x = d3.scalePoint()
        .domain(data.map(d => d.year))
        .range([margin.left, width - margin.right]);

    const y = d3.scaleLinear()
        .domain([0, d3.max(data, d => d.hospitalisations)])
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
        .call(d3.axisLeft(y).ticks(5).tickFormat(formatNumber));

    addAxisLabels(
        svg,
        width,
        height,
        margin,
        "Calendar year",
        "Hospitalisations (count)"
    );

    svg.append("path")
        .datum(data)
        .attr("fill", "none")
        .attr("stroke", colors.blue)
        .attr("stroke-width", 3)
        .attr("opacity", 0)
        .attr(
            "d",
            d3.line()
                .x(d => x(d.year))
                .y(d => y(d.hospitalisations))
        )
        .transition()
        .duration(700)
        .ease(d3.easeCubicOut)
        .attr("opacity", 1);

    svg.append("line")
        .attr("x1", x(data[data.length - 1].year))
        .attr("x2", x(data[data.length - 1].year))
        .attr("y1", y(data[data.length - 1].hospitalisations))
        .attr("y2", height - margin.bottom)
        .attr("stroke", colors.grey)
        .attr("stroke-dasharray", "3 3");

    const tooltip = addTooltip();

    const points = svg.selectAll("circle")
        .data(data)
        .join("circle")
        .attr("cx", d => x(d.year))
        .attr("cy", d => y(d.hospitalisations))
        .attr("r", d => d.year === data[data.length - 1].year ? 6 : 3.5)
        .attr("fill", colors.blue)
        .attr("tabindex", 0)
        .attr("aria-pressed", "false")
        .attr("aria-label", d => `${d.year}: ${formatNumber(d.hospitalisations)} hospitalisations`)
        .attr("r", 0);

    points.transition()
        .delay((d, i) => i * 45)
        .duration(350)
        .attr("r", d => d.year === data[data.length - 1].year ? 6 : 3.5);

    bindTooltip(
        points,
        tooltip,
        d => `<strong>${d.year}</strong><br>${formatNumber(d.hospitalisations)} hospitalisations`
    );

};

const drawNationalChangeChart = data => {
    d3.select("#national-change-chart").html("");
    const ordered = data.slice().sort((a, b) => d3.ascending(+a.year, +b.year));
    const values = ordered.slice(1).map((row, index) => {
        const previous = ordered[index];
        return {
            year: row.year,
            change: (row.hospitalisations - previous.hospitalisations) /
                previous.hospitalisations * 100
        };
    });
    const maximumChange = d3.max(values, row => Math.abs(row.change)) || 1;
    const height = 380;
    const margin = { top: 22, right: 86, bottom: 58, left: 78 };
    const { svg, width } = createSvg("#national-change-chart", height, margin);
    const x = d3.scaleLinear()
        .domain([-maximumChange * 1.3, maximumChange * 1.3])
        .nice()
        .range([margin.left, width - margin.right]);
    const y = d3.scaleBand()
        .domain(values.map(row => String(row.year)))
        .range([margin.top, height - margin.bottom])
        .padding(0.24);

    svg.append("g")
        .attr("class", "grid-line")
        .attr("transform", `translate(0,${height - margin.bottom})`)
        .call(d3.axisBottom(x).ticks(5)
            .tickSize(-(height - margin.top - margin.bottom))
            .tickFormat(""));
    svg.append("g")
        .attr("class", "axis")
        .attr("transform", `translate(0,${height - margin.bottom})`)
        .call(d3.axisBottom(x).ticks(5)
            .tickFormat(value => value === 0 ? "0%" : `${d3.format("+.0f")(value)}%`));
    svg.append("g")
        .attr("class", "axis")
        .attr("transform", `translate(${margin.left},0)`)
        .call(d3.axisLeft(y));
    addAxisLabels(svg, width, height, margin, "Change from previous year", "Calendar year");

    svg.append("line")
        .attr("x1", x(0))
        .attr("x2", x(0))
        .attr("y1", margin.top)
        .attr("y2", height - margin.bottom)
        .attr("stroke", colors.ink)
        .attr("stroke-opacity", 0.55);

    const tooltip = addTooltip();
    const bars = svg.selectAll(".annual-change-bar")
        .data(values)
        .join("rect")
        .attr("class", "bar annual-change-bar")
        .attr("x", row => Math.min(x(0), x(row.change)))
        .attr("y", row => y(String(row.year)))
        .attr("width", row => Math.abs(x(row.change) - x(0)))
        .attr("height", y.bandwidth())
        .attr("fill", row => row.change < 0 ? colors.orange : colors.blue)
        .attr("tabindex", 0)
        .attr("aria-label", row =>
            `${row.year}: ${d3.format("+.2f")(row.change)}% from the previous year`
        );
    bindTooltip(bars, tooltip, row =>
        `<strong>${row.year}</strong><br>${d3.format("+.2f")(row.change)}% from the previous year`
    );

    svg.selectAll(".annual-change-value")
        .data(values)
        .join("text")
        .attr("class", "annual-change-value")
        .attr("x", row => x(row.change) + (row.change < 0 ? -8 : 8))
        .attr("y", row => y(String(row.year)) + y.bandwidth() / 2)
        .attr("text-anchor", row => row.change < 0 ? "end" : "start")
        .attr("dominant-baseline", "middle")
        .attr("fill", colors.ink)
        .attr("font-size", 11)
        .attr("font-weight", 700)
        .text(row => `${d3.format("+.2f")(row.change)}%`);
};
