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
        .attr("fill", d => d.state === values[0].state ? colors.orange : colors.grey)
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

const drawStateTrendChart = data => {
    d3.select("#state-trend-chart").html("");
    const stateNames = {
        ACT: "ACT",
        NSW: "New South Wales",
        NT: "Northern Territory",
        Qld: "Queensland",
        SA: "South Australia",
        Tas: "Tasmania",
        Vic: "Victoria",
        WA: "Western Australia"
    };
    const years = [2011, 2021];
    const stateCodes = [...new Set(data
        .filter(row => row.year === 2021)
        .map(row => row.state))]
        .sort((a, b) => d3.descending(
            data.find(row => row.year === 2021 && row.state === a).hospitalisations,
            data.find(row => row.year === 2021 && row.state === b).hospitalisations
        ));
    const values = stateCodes.flatMap(state => years.map(year => {
        const row = data.find(item => item.year === year && item.state === state);
        return row ? {
            ...row,
            stateLabel: state,
            stateName: stateNames[state] || state
        } : null;
    })).filter(Boolean);

    const height = 370;
    const margin = { top: 20, right: 24, bottom: 68, left: 76 };
    const { svg, width } = createSvg("#state-trend-chart", height, margin);
    const x = d3.scaleBand()
        .domain(stateCodes)
        .range([margin.left, width - margin.right])
        .padding(0.18);
    const xYear = d3.scaleBand()
        .domain(years.map(String))
        .range([0, x.bandwidth()])
        .padding(0.08);
    const y = d3.scaleLinear()
        .domain([0, d3.max(values, row => row.hospitalisations) * 1.16])
        .nice()
        .range([height - margin.bottom, margin.top]);

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
    addAxisLabels(svg, width, height, margin, "State / territory", "Hospital admissions");

    const colorsByYear = { "2011": colors.blue, "2021": colors.orange };
    const tooltip = addTooltip();
    const columns = svg.selectAll(".state-column-group")
        .data(stateCodes)
        .join("g")
        .attr("class", "state-column-group")
        .attr("transform", state => `translate(${x(state)},0)`);
    const bars = columns.selectAll("rect")
        .data(state => values.filter(row => row.state === state))
        .join("rect")
        .attr("class", "bar")
        .attr("x", row => xYear(String(row.year)))
        .attr("y", row => y(row.hospitalisations))
        .attr("width", xYear.bandwidth())
        .attr("height", row => height - margin.bottom - y(row.hospitalisations))
        .attr("fill", row => colorsByYear[String(row.year)])
        .attr("tabindex", 0)
        .attr("aria-label", row =>
            `${row.stateName}, ${row.year}: ${formatNumber(row.hospitalisations)} hospital admissions`
        );
    bindTooltip(bars, tooltip, row =>
        `<strong>${row.stateName}, ${row.year}</strong><br>${formatNumber(row.hospitalisations)} hospital admissions`
    );

    const legend = d3.select("#state-trend-chart").append("div").attr("class", "legend");
    years.forEach(year => {
        legend.append("span").attr("class", "legend-item")
            .html(`<span class="legend-swatch" style="background:${colorsByYear[String(year)]}"></span>${year}`);
    });
};
