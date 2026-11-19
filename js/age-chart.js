d3.csv(`${dataPath}age_severity.csv`, d => ({
    year: +d["Calendar year"],
    age: d["Age group"],
    sex: d.Sex,
    hospitalisations: +d.Hospitalisations
})).then(data => {
    const values = data.filter(
        d => d.year === 2021 &&
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
        "Age group",
        "Hospitalisations (count)"
    );

    const groups = svg.selectAll(".age-group")
        .data(ages)
        .join("g")
        .attr("class", "age-group")
        .attr("transform", age => `translate(${x(age)},0)`);

    const tooltip = addTooltip();

    groups.selectAll("rect")
        .data(age => values.filter(d => d.age === age))
        .join("rect")
        .attr("x", d => xSex(d.sex))
        .attr("y", d => y(d.hospitalisations))
        .attr("width", xSex.bandwidth())
        .attr("height", d => height - margin.bottom - y(d.hospitalisations))
        .attr("fill", d => d.sex === "Female" ? colors.female : colors.male)
        .on("mouseenter", (event, d) => {
            tooltip.style("opacity", 1)
                .html(
                    `<strong>${d.age}, ${d.sex}</strong><br>${formatNumber(d.hospitalisations)} hospitalisations`
                );
        })
        .on("mousemove", event => {
            tooltip.style("left", `${event.clientX + 12}px`)
                .style("top", `${event.clientY - 30}px`);
        })
        .on("mouseleave", () => tooltip.style("opacity", 0));

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
}).catch(showLoadError);
