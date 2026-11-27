const ageGroups = ["0-7", "8-16", "17-25", "26-39", "40-64", "65+"];
const sexGroups = ["Female", "Male"];
const ageSexColors = {
    Female: colors.blue,
    Male: colors.orange
};

const drawAgeChart = (data, selectedYear = 2021, selectedSex = "All") => {
    d3.select("#age-chart").html("");
    const values = data.filter(
        d => d.year === selectedYear &&
            sexGroups.includes(d.sex) &&
            (selectedSex === "All" || d.sex === selectedSex) &&
            ageGroups.includes(d.age)
    );
    const ages = ageGroups.filter(age => values.some(d => d.age === age));
    const displayedSexGroups = selectedSex === "All" ? sexGroups : [selectedSex];
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
        .domain(displayedSexGroups)
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
        .attr("fill", d => ageSexColors[d.sex])
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

    displayedSexGroups.forEach(sex => {
        legend.append("span")
            .attr("class", "legend-item")
            .html(
                `<span class="legend-swatch" style="background:${ageSexColors[sex]}"></span>${sex}`
            );
    });

};

const drawAgeTrendChart = (data, selectedSex = "All") => {
    d3.select("#age-trend-chart").html("");
    const years = [2011, 2021];
    const selectedSexGroups = selectedSex === "All" ? sexGroups : [selectedSex];
    const series = years.flatMap(year => selectedSexGroups.map(sex => `${year} ${sex}`));
    const values = ageGroups.flatMap(age => years.flatMap(year =>
        selectedSexGroups.map(sex => ({
            age,
            year,
            sex,
            series: `${year} ${sex}`,
            hospitalisations: d3.sum(
                data.filter(row =>
                    row.year === year && row.age === age && row.sex === sex
                ),
                row => row.hospitalisations
            )
        }))
    ));
    const height = 390;
    const margin = { top: 20, right: 24, bottom: 68, left: 82 };
    const { svg, width } = createSvg("#age-trend-chart", height, margin);
    const x = d3.scaleBand()
        .domain(ageGroups)
        .range([margin.left, width - margin.right])
        .padding(0.18);
    const xSeries = d3.scaleBand()
        .domain(series)
        .range([0, x.bandwidth()])
        .padding(0.06);
    const y = d3.scaleLinear()
        .domain([0, d3.max(values, row => row.hospitalisations) * 1.12])
        .nice()
        .range([height - margin.bottom, margin.top]);
    const colorsBySeries = d3.scaleOrdinal()
        .domain(series)
        .range(series.map(seriesName => {
            const [year, sex] = seriesName.split(" ");
            if (sex === "Female") return year === "2011" ? colors.blue : colors.skyBlue;
            return year === "2011" ? colors.orange : colors.reddishPurple;
        }));

    svg.append("g")
        .attr("class", "grid-line")
        .attr("transform", `translate(${margin.left},0)`)
        .call(d3.axisLeft(y).ticks(5)
            .tickSize(-(width - margin.left - margin.right))
            .tickFormat(""));
    svg.append("g")
        .attr("class", "axis")
        .attr("transform", `translate(0,${height - margin.bottom})`)
        .call(d3.axisBottom(x));
    svg.append("g")
        .attr("class", "axis")
        .attr("transform", `translate(${margin.left},0)`)
        .call(d3.axisLeft(y).ticks(5).tickFormat(formatNumber));
    addAxisLabels(svg, width, height, margin, "Age group", "Hospital admissions");

    const groups = svg.selectAll(".age-year-group")
        .data(ageGroups)
        .join("g")
        .attr("class", "age-year-group")
        .attr("transform", age => `translate(${x(age)},0)`);
    const tooltip = addTooltip();
    const bars = groups.selectAll(".bar")
        .data(age => values.filter(row => row.age === age))
        .join("rect")
        .attr("class", "bar")
        .attr("x", row => xSeries(row.series))
        .attr("y", row => y(row.hospitalisations))
        .attr("width", xSeries.bandwidth())
        .attr("height", row => height - margin.bottom - y(row.hospitalisations))
        .attr("fill", row => colorsBySeries(row.series))
        .attr("tabindex", 0)
        .attr("aria-label", row =>
            `${row.age}, ${row.sex}, ${row.year}: ${formatNumber(row.hospitalisations)} hospital admissions`
        );
    bindTooltip(bars, tooltip, row =>
        `<strong>${row.age}, ${row.sex}, ${row.year}</strong><br>${formatNumber(row.hospitalisations)} hospital admissions`
    );

    const legend = d3.select("#age-trend-chart").append("div").attr("class", "legend");
    series.forEach(seriesName => {
        legend.append("span").attr("class", "legend-item")
            .html(
                `<span class="legend-swatch" style="background:${colorsBySeries(seriesName)}"></span>` +
                seriesName
            );
    });
};
