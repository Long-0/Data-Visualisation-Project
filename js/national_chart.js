const drawNationalChart = data => {
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
        .attr(
            "d",
            d3.line()
                .x(d => x(d.year))
                .y(d => y(d.hospitalisations))
        );

    svg.append("line")
        .attr("x1", x(data[data.length - 1].year))
        .attr("x2", x(data[data.length - 1].year))
        .attr("y1", y(data[data.length - 1].hospitalisations))
        .attr("y2", height - margin.bottom)
        .attr("stroke", colors.grey)
        .attr("stroke-dasharray", "3 3");

    const tooltip = addTooltip();

    svg.selectAll("circle")
        .data(data)
        .join("circle")
        .attr("cx", d => x(d.year))
        .attr("cy", d => y(d.hospitalisations))
        .attr("r", d => d.year === data[data.length - 1].year ? 6 : 3.5)
        .attr("fill", (d, i) => i === data.length - 1 ? colors.orange : colors.blue)
        .attr("tabindex", 0)
        .attr("aria-label", d => `${d.year}: ${formatNumber(d.hospitalisations)} hospitalisations`)
        .on("mouseenter", (event, d) => {
            tooltip.style("opacity", 1)
                .html(
                    `<strong>${d.year}</strong><br>${formatNumber(d.hospitalisations)} hospitalisations<br>Unit: count`
                );
        })
        .on("mousemove", event => {
            tooltip.style("left", `${event.clientX + 12}px`)
                .style("top", `${event.clientY - 30}px`);
        })
        .on("mouseleave", () => tooltip.style("opacity", 0));

};
