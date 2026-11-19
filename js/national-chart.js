d3.csv(`${dataPath}national_annual.csv`, d => ({
    year: d["Calendar year"],
    hospitalisations: +d.Hospitalisations,
    bedDays: +d.Net_Bed_Days,
    deaths: +d.Died_cases
})).then(data => {
    const { svg, width, height, margin } = createSvg("#national-chart");

    const x = d3.scalePoint()
        .domain(data.map(d => d.year))
        .range([margin.left, width - margin.right]);

    const y = d3.scaleLinear()
        .domain([0, d3.max(data, d => d.hospitalisations)])
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

    svg.append("path")
        .datum(data)
        .attr("fill", "none")
        .attr("stroke", colors.blue)
        .attr("stroke-width", 3)
        .attr(
            "d",
            d3.line()
                .x(d => x(d.year))
                .y(d => y(d.hospitalisations))
        );

    const tooltip = addTooltip();

    svg.selectAll("circle")
        .data(data)
        .join("circle")
        .attr("cx", d => x(d.year))
        .attr("cy", d => y(d.hospitalisations))
        .attr("r", 4)
        .attr("fill", colors.blue)
        .on("mouseenter", (event, d) => {
            tooltip.style("opacity", 1)
                .html(
                    `<strong>${d.year}</strong><br>${formatNumber(d.hospitalisations)} hospitalisations<br>${formatNumber(d.bedDays)} bed days<br>${formatNumber(d.deaths)} deaths`
                );
        })
        .on("mousemove", event => {
            tooltip.style("left", `${event.clientX + 12}px`)
                .style("top", `${event.clientY - 30}px`);
        })
        .on("mouseleave", () => tooltip.style("opacity", 0));
}).catch(showLoadError);
