const drawAgeChart = (data, selectedYear = 2021) => {
    d3.select("#age-chart").html("");
    const values = data.filter(
        d => d.year === selectedYear &&
            (d.sex === "Female" || d.sex === "Male")
    );

    const ages = [...new Set(values.map(d => d.age))];
    const { svg, width, height, margin } = createSvg(
        "#age-chart",
        340,
        { top: 30, right: 24, bottom: 64, left: 68 }
    );

    const x = d3.scaleBand()
        .domain(ages)
        .range([margin.left, width - margin.right])
        .padding(0.2);

    const xSex = d3.scaleBand()
        .domain(["Female", "Male"])
        .range([0, x.bandwidth()])
        .padding(0.08);

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
        "Age group",
        "Hospitalisations (count)"
    );

    const groups = svg.selectAll(".age-group")
        .data(ages)
        .join("g")
        .attr("class", "age-group")
        .attr("transform", age => `translate(${x(age)},0)`);

    const tooltip = addTooltip();

    const bars = groups.selectAll("rect")
        .data(age => values.filter(d => d.age === age))
        .join("rect")
        .attr("class", "bar")
        .attr("x", d => xSex(d.sex))
        .attr("y", d => y(d.hospitalisations))
        .attr("width", xSex.bandwidth())
        .attr("height", d => height - margin.bottom - y(d.hospitalisations))
        .attr("fill", d => d.sex === "Female" ? colors.female : colors.male)
        .attr("tabindex", 0)
        .attr("aria-label", d => `${d.age}, ${d.sex}, ${selectedYear}: ${formatNumber(d.hospitalisations)} hospitalisations`)
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
        d => `<strong>${d.age}, ${d.sex}, ${selectedYear}</strong><br>${formatNumber(d.hospitalisations)} hospitalisations`
    );

    const legend = d3.select("#age-chart")
        .append("div")
        .attr("class", "legend");

    ["Female", "Male"].forEach(sex => {
        legend.append("span")
            .attr("class", "legend-item")
            .html(
                `<span class="legend-swatch" style="background:${sex === "Female" ? colors.female : colors.male}"></span>${sex}`
            );
    });

};
