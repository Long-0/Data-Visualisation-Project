const drawStateChart = data => {
    const values = data
        .filter(d => d.year === 2021)
        .sort((a, b) => d3.descending(a.hospitalisations, b.hospitalisations));

    const { svg, width, height, margin } = createSvg(
        "#state-chart",
        330,
        { top: 18, right: 24, bottom: 64, left: 78 }
    );

    const x = d3.scaleBand()
        .domain(values.map(d => d.state))
        .range([margin.left, width - margin.right])
        .padding(0.18);

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
        "State / territory",
        "Hospitalisations (count)"
    );

    const tooltip = addTooltip();

    svg.selectAll("rect")
        .data(values)
        .join("rect")
        .attr("x", d => x(d.state))
        .attr("y", d => y(d.hospitalisations))
        .attr("width", x.bandwidth())
        .attr("height", d => height - margin.bottom - y(d.hospitalisations))
        .attr("fill", colors.blue)
        .on("mouseenter", (event, d) => {
            tooltip.style("opacity", 1)
                .html(
                    `<strong>${d.state}</strong><br>${formatNumber(d.hospitalisations)} hospitalisations`
                );
        })
        .on("mousemove", event => {
            tooltip.style("left", `${event.clientX + 12}px`)
                .style("top", `${event.clientY - 30}px`);
        })
        .on("mouseleave", () => tooltip.style("opacity", 0));
};
