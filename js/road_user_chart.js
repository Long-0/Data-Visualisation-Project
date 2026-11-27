const drawRoadUserChart = (data, selectedYear = 2021) => {
    d3.select("#road-user-chart").html("");
    const values = data
        .filter(d => d.year === selectedYear)
        .sort((a, b) => d3.descending(a.hospitalisations, b.hospitalisations));
    const total = d3.sum(values, d => d.hospitalisations);

    const { svg, width, height, margin } = createSvg(
        "#road-user-chart",
        390,
        { top: 18, right: 24, bottom: 124, left: 78 }
    );

    const x = d3.scaleBand()
        .domain(values.map(d => d.roadUser))
        .range([margin.left, width - margin.right])
        .padding(0.18);

    const y = d3.scaleLinear()
        .domain([0, d3.max(values, d => d.hospitalisations) * 1.15])
        .nice()
        .range([height - margin.bottom, margin.top]);

    svg.append("g")
        .attr("class", "axis")
        .attr("transform", `translate(0,${height - margin.bottom})`)
        .call(d3.axisBottom(x))
        .selectAll("text")
        .attr("transform", "rotate(-45)")
        .style("text-anchor", "end");

    svg.append("g")
        .attr("class", "axis")
        .attr("transform", `translate(${margin.left},0)`)
        .call(d3.axisLeft(y).ticks(5).tickFormat(formatNumber));

    addAxisLabels(
        svg,
        width,
        height,
        margin,
        "Road-user group",
        "Hospitalisations (count)"
    );

    const tooltip = addTooltip();

    const bars = svg.selectAll("rect")
        .data(values)
        .join("rect")
        .attr("class", "bar")
        .attr("x", d => x(d.roadUser))
        .attr("y", d => y(d.hospitalisations))
        .attr("width", x.bandwidth())
        .attr("height", d => height - margin.bottom - y(d.hospitalisations))
        .attr("fill", d => d.roadUser === "Car driver" ? colors.orange : colors.grey)
        .attr("tabindex", 0)
        .attr("aria-label", d =>
            `${d.roadUser}, ${selectedYear}: ${formatNumber(d.hospitalisations)} hospitalisations, ${(d.hospitalisations / total * 100).toFixed(1)}% of total`
        )
        .attr("aria-pressed", "false")
        .attr("y", height - margin.bottom)
        .attr("height", 0);

    bars.transition()
        .duration(650)
        .ease(d3.easeCubicOut)
        .attr("y", d => y(d.hospitalisations))
        .attr("height", d => height - margin.bottom - y(d.hospitalisations));

    svg.selectAll(".bar-share-label")
        .data(values)
        .join("text")
        .attr("class", "bar-share-label")
        .attr("x", d => x(d.roadUser) + x.bandwidth() / 2)
        .attr("y", d => y(d.hospitalisations) - 7)
        .attr("text-anchor", "middle")
        .attr("fill", colors.ink)
        .attr("font-size", 11)
        .attr("font-weight", 700)
        .text(d => `${(d.hospitalisations / total * 100).toFixed(1)}%`);

    bindTooltip(
        bars,
        tooltip,
        d => `<strong>${d.roadUser}, ${selectedYear}</strong><br>${formatNumber(d.hospitalisations)} hospitalisations (${(d.hospitalisations / total * 100).toFixed(1)}% of total)`
    );

};

const roadUserPalette = [
    colors.orange,
    colors.blue,
    colors.teal,
    colors.skyBlue,
    colors.reddishPurple,
    colors.yellow,
    colors.grey
];

const drawRoadUserTrendChart = (data, selectedYear = 2021) => {
    d3.select("#road-user-trend-chart").html("");
    const values = data
        .filter(row => row.year === selectedYear)
        .sort((a, b) => d3.descending(a.hospitalisations, b.hospitalisations));
    const total = d3.sum(values, row => row.hospitalisations);
    const height = 370;
    const margin = { top: 18, right: 24, bottom: 30, left: 24 };
    const { svg, width } = createSvg("#road-user-trend-chart", height, margin);
    const radius = Math.max(0, Math.min(
        width - margin.left - margin.right,
        height - margin.top - margin.bottom
    ) / 2);
    const roadUserGroups = [...new Set(data.map(row => row.roadUser))].sort();
    const colorsByGroup = d3.scaleOrdinal()
        .domain(roadUserGroups)
        .range(roadUserPalette);
    const pie = d3.pie()
        .sort(null)
        .value(row => row.hospitalisations);
    const arcs = pie(values);
    const arc = d3.arc()
        .innerRadius(0)
        .outerRadius(radius);
    const labelArc = d3.arc()
        .innerRadius(radius * 0.62)
        .outerRadius(radius * 0.62);
    const chart = svg.append("g")
        .attr("transform", `translate(${width / 2},${height / 2})`);

    const tooltip = addTooltip();
    const slices = chart.selectAll(".road-user-slice")
        .data(arcs)
        .join("path")
        .attr("class", "road-user-slice")
        .attr("d", arc)
        .attr("fill", row => colorsByGroup(row.data.roadUser))
        .attr("stroke", "#fff")
        .attr("stroke-width", 2)
        .attr("tabindex", 0)
        .attr("aria-label", row =>
            `${row.data.roadUser}: ${formatNumber(row.data.hospitalisations)} admissions, ${d3.format(".1%")(row.data.hospitalisations / total)}`
        );
    bindTooltip(slices, tooltip, row =>
        `<strong>${row.data.roadUser}</strong><br>${formatNumber(row.data.hospitalisations)} admissions (${d3.format(".1%")(row.data.hospitalisations / total)})`
    );

    chart.selectAll(".road-user-share-label")
        .data(arcs.filter(row => row.data.hospitalisations / total >= 0.06))
        .join("text")
        .attr("class", "road-user-share-label")
        .attr("transform", row => `translate(${labelArc.centroid(row)})`)
        .attr("text-anchor", "middle")
        .attr("dominant-baseline", "middle")
        .attr("fill", row => [colors.skyBlue, colors.yellow].includes(
            colorsByGroup(row.data.roadUser)
        ) ? colors.ink : "#fff")
        .attr("font-size", 11)
        .attr("font-weight", 700)
        .text(row => d3.format(".1%")(row.data.hospitalisations / total));

    const legend = d3.select("#road-user-trend-chart").append("div").attr("class", "legend");
    values.forEach(row => {
        legend.append("span").attr("class", "legend-item")
            .html(
                `<span class="legend-swatch" style="background:${colorsByGroup(row.roadUser)}"></span>` +
                `${row.roadUser} ${d3.format(".1%")(row.hospitalisations / total)}`
            );
    });
};
