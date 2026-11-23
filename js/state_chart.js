const drawStateChart = (data, selectedYear = 2021) => {
    d3.select("#state-chart").html("");
    const values = data
        .filter(d => d.year === selectedYear)
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

    const bars = svg.selectAll("rect")
        .data(values)
        .join("rect")
        .attr("class", "bar")
        .attr("x", d => x(d.state))
        .attr("y", d => y(d.hospitalisations))
        .attr("width", x.bandwidth())
        .attr("height", d => height - margin.bottom - y(d.hospitalisations))
        .attr("fill", d => d.state === "Vic" ? colors.orange : colors.grey)
        .attr("tabindex", 0)
        .attr("aria-label", d => `${d.state}, ${selectedYear}: ${formatNumber(d.hospitalisations)} hospitalisations`)
        .attr("aria-pressed", "false")
        .attr("y", height - margin.bottom)
        .attr("height", 0);

    bars.transition()
        .duration(650)
        .ease(d3.easeCubicOut)
        .attr("y", d => y(d.hospitalisations))
        .attr("height", d => height - margin.bottom - y(d.hospitalisations));

    bindTooltip(
        bars,
        tooltip,
        d => `<strong>${d.state}, ${selectedYear}</strong><br>${formatNumber(d.hospitalisations)} hospitalisations`
    );

};
