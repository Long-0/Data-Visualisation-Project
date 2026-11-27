const ageOrder = ["0-7", "8-16", "17-25", "26-39", "40-64", "65+"];
const pageNames = ["national", "states", "road-users", "age-sex", "first-nations", "first-nations-age"];
const reportData = {};
let activePage = "national";

const pageColors = {
    female: colors.blue,
    male: colors.teal,
    firstNations: colors.teal,
    other: colors.grey
};

const makeChart = (selector, height, margin) => {
    d3.select(selector).html("");
    return createSvg(selector, height, margin);
};

const drawGridAndAxes = (svg, x, y, width, height, margin, xLabel, yLabel) => {
    svg.append("g")
        .attr("class", "grid-line")
        .attr("transform", `translate(${margin.left},0)`)
        .call(d3.axisLeft(y).ticks(5).tickSize(-(width - margin.left - margin.right)).tickFormat(""));
    svg.append("g")
        .attr("class", "axis")
        .attr("transform", `translate(0,${height - margin.bottom})`)
        .call(d3.axisBottom(x));
    svg.append("g")
        .attr("class", "axis")
        .attr("transform", `translate(${margin.left},0)`)
        .call(d3.axisLeft(y).ticks(5).tickFormat(formatNumber));
    addAxisLabels(svg, width, height, margin, xLabel, yLabel);
};

const drawNationalChart = () => {
    const data = reportData.national.slice().sort((a, b) => d3.ascending(a.year, b.year));
    const { svg, width, height, margin } = makeChart("#national-chart", 440, {
        top: 34, right: 38, bottom: 62, left: 86
    });
    const x = d3.scalePoint().domain(data.map(row => row.year))
        .range([margin.left, width - margin.right]);
    const y = d3.scaleLinear()
        .domain([0, d3.max(data, row => row.hospitalisations) * 1.15])
        .nice()
        .range([height - margin.bottom, margin.top]);
    drawGridAndAxes(svg, x, y, width, height, margin, "Calendar year", "Hospital admissions");

    svg.append("path")
        .datum(data)
        .attr("fill", "none")
        .attr("stroke", colors.blue)
        .attr("stroke-width", 3)
        .attr("d", d3.line().x(row => x(row.year)).y(row => y(row.hospitalisations)));

    const tooltip = addTooltip();
    const points = svg.selectAll(".national-point").data(data).join("circle")
        .attr("class", "national-point")
        .attr("cx", row => x(row.year))
        .attr("cy", row => y(row.hospitalisations))
        .attr("r", row => row.year === 2020 ? 6 : 4)
        .attr("fill", colors.blue)
        .attr("tabindex", 0)
        .attr("aria-label", row => `${row.year}: ${formatNumber(row.hospitalisations)} admissions`);
    bindTooltip(points, tooltip, row =>
        `<strong>${row.year}</strong><br>${formatNumber(row.hospitalisations)} hospital admissions`
    );

};

const stateNames = {
    ACT: "ACT",
    NSW: "NSW",
    NT: "NT",
    Qld: "Queensland",
    SA: "South Australia",
    Tas: "Tasmania",
    Vic: "Victoria",
    WA: "Western Australia"
};

const drawHorizontalBars = (selector, rows, category, value, options = {}) => {
    const data = rows.slice().sort((a, b) => d3.ascending(value(a), value(b)));
    const total = d3.sum(data, value);
    const height = options.height || Math.max(360, data.length * 42 + 80);
    const margin = { top: 26, right: 86, bottom: 60, left: options.left || 150 };
    const { svg, width } = makeChart(selector, height, margin);
    const x = d3.scaleLinear()
        .domain([0, d3.max(data, value) * 1.2])
        .nice()
        .range([margin.left, width - margin.right]);
    const y = d3.scaleBand()
        .domain(data.map(category))
        .range([margin.top, height - margin.bottom])
        .padding(0.24);

    svg.append("g").attr("class", "grid-line")
        .attr("transform", `translate(0,${height - margin.bottom})`)
        .call(d3.axisBottom(x).ticks(5).tickSize(-(height - margin.top - margin.bottom)).tickFormat(""));
    svg.append("g").attr("class", "axis")
        .attr("transform", `translate(0,${height - margin.bottom})`)
        .call(d3.axisBottom(x).ticks(5).tickFormat(formatNumber));
    svg.append("g").attr("class", "axis")
        .attr("transform", `translate(${margin.left},0)`)
        .call(d3.axisLeft(y));
    addAxisLabels(svg, width, height, margin, "Hospital admissions", "");

    const tooltip = addTooltip();
    const bars = svg.selectAll(".horizontal-bar").data(data).join("rect")
        .attr("class", "bar horizontal-bar")
        .attr("x", margin.left)
        .attr("y", row => y(category(row)))
        .attr("width", row => x(value(row)) - margin.left)
        .attr("height", y.bandwidth())
        .attr("fill", (row, index) => options.highlightTop && index >= data.length - options.highlightTop
            ? colors.orange
            : options.baseColor || colors.blue)
        .attr("tabindex", 0)
        .attr("aria-label", row =>
            `${category(row)}: ${formatNumber(value(row))} hospital admissions` +
            (options.showShare ? `, ${(value(row) / total * 100).toFixed(1)}% of total` : "")
        );
    bindTooltip(bars, tooltip, row =>
        `<strong>${category(row)}</strong><br>${formatNumber(value(row))} hospital admissions` +
        (options.showShare ? `<br>${(value(row) / total * 100).toFixed(1)}% of total` : "")
    );

    svg.selectAll(".bar-value").data(data).join("text")
        .attr("class", "bar-value")
        .attr("x", row => x(value(row)) + 7)
        .attr("y", row => y(category(row)) + y.bandwidth() / 2)
        .attr("dominant-baseline", "middle")
        .attr("fill", colors.ink)
        .attr("font-size", 11)
        .text(row => options.showShare
            ? `${(value(row) / total * 100).toFixed(1)}%`
            : formatNumber(value(row))
        );

    if (options.highlightTop) {
        const legend = d3.select(selector).append("div").attr("class", "legend");
        [
            { label: `Top ${options.highlightTop}`, color: colors.orange },
            { label: "Other", color: colors.grey }
        ].forEach(item => {
            legend.append("span").attr("class", "legend-item")
                .html(`<span class="legend-swatch" style="background:${item.color}"></span>${item.label}`);
        });
    }

};

const drawAgeSexChart = () => {
    const data = ageOrder.flatMap(age => ["Female", "Male"].map(sex => ({
        age,
        sex,
        hospitalisations: d3.sum(
            reportData.ages.filter(row => row.age === age && row.sex === sex),
            row => row.hospitalisations
        )
    })));
    drawGroupedColumns("#age-sex-chart", data, ageOrder, ["Female", "Male"], row => row.age, row => row.sex);
};

const drawFirstNationsAgeChart = () => {
    const data = ageOrder.flatMap(age => [2011, 2021].map(year => {
        const rows = reportData.firstNations.filter(row =>
            row.year === year && row.status === "First Nations people" && row.age === age
        );
        return {
            age,
            year: String(year),
            hospitalisations: d3.sum(rows, row => row.hospitalisations)
        };
    })).filter(row => row.hospitalisations > 0);
    const groups = ageOrder.filter(age => data.some(row => row.age === age));
    drawGroupedColumns("#first-nations-age-chart", data, groups, ["2011", "2021"], row => row.age, row => row.year);
};

const drawGroupedColumns = (selector, data, groups, series, groupOf, seriesOf) => {
    const height = 420;
    const margin = { top: 28, right: 24, bottom: 82, left: 82 };
    const { svg, width } = makeChart(selector, height, margin);
    const x = d3.scaleBand().domain(groups).range([margin.left, width - margin.right]).padding(0.2);
    const xSeries = d3.scaleBand().domain(series).range([0, x.bandwidth()]).padding(0.08);
    const y = d3.scaleLinear()
        .domain([0, d3.max(data, row => row.hospitalisations) * 1.18])
        .nice()
        .range([height - margin.bottom, margin.top]);
    drawGridAndAxes(svg, x, y, width, height, margin, "Age group", "Hospital admissions");

    const color = d3.scaleOrdinal().domain(series)
        .range(series.length === 2 && series[0] === "Female"
            ? [pageColors.female, pageColors.male]
            : series.length === 4 && series[0] === "2011 Female"
                ? [colors.blue, colors.orange, colors.skyBlue, colors.reddishPurple]
                : [colors.blue, colors.orange]);
    const columns = svg.selectAll(".column-group").data(groups).join("g")
        .attr("class", "column-group")
        .attr("transform", group => `translate(${x(group)},0)`);
    const bars = columns.selectAll("rect").data(group =>
        series.map(seriesName => data.find(row =>
            groupOf(row) === group && seriesOf(row) === seriesName
        )).filter(Boolean)
    ).join("rect")
        .attr("class", "bar")
        .attr("x", row => xSeries(seriesOf(row)))
        .attr("y", row => y(row.hospitalisations))
        .attr("width", xSeries.bandwidth())
        .attr("height", row => height - margin.bottom - y(row.hospitalisations))
        .attr("fill", row => color(seriesOf(row)))
        .attr("tabindex", 0)
        .attr("aria-label", row =>
            `${groupOf(row)}, ${seriesOf(row)}: ${formatNumber(row.hospitalisations)} admissions`
        );
    const tooltip = addTooltip();
    bindTooltip(bars, tooltip, row =>
        `<strong>${groupOf(row)}, ${seriesOf(row)}</strong><br>${formatNumber(row.hospitalisations)} hospital admissions`
    );

    const legend = d3.select(selector).append("div").attr("class", "legend");
    series.forEach(seriesName => {
        legend.append("span").attr("class", "legend-item")
            .html(`<span class="legend-swatch" style="background:${color(seriesName)}"></span>${seriesName}`);
    });
};

const drawFirstNationsChart = () => {
    const byStatusAndYear = d3.rollup(
        reportData.firstNations.filter(row => row.status === "First Nations people"),
        rows => d3.sum(rows, row => row.hospitalisations),
        row => row.status,
        row => row.year
    );
    const data = [...byStatusAndYear].flatMap(([status, byYear]) => {
        const baseline = byYear.get(2011);
        if (!baseline) return [];
        return [...byYear].map(([year, hospitalisations]) => ({
            year,
            hospitalisations,
            index: hospitalisations / baseline * 100
        }));
    }).sort((a, b) => d3.ascending(a.year, b.year));
    const { svg, width, height, margin } = makeChart("#first-nations-chart", 390, {
        top: 30, right: 28, bottom: 60, left: 82
    });
    const x = d3.scalePoint().domain(data.map(row => row.year))
        .range([margin.left, width - margin.right]);
    const indexExtent = d3.extent(data, row => row.index);
    const indexPadding = Math.max(5, (indexExtent[1] - indexExtent[0]) * 0.06);
    const y = d3.scaleLinear()
        .domain([
            Math.max(0, indexExtent[0] - indexPadding),
            indexExtent[1] + indexPadding
        ])
        .nice()
        .range([height - margin.bottom, margin.top]);
    drawGridAndAxes(svg, x, y, width, height, margin, "Calendar year", "Admission index (2011 = 100)");

    svg.append("path")
        .datum(data)
        .attr("fill", "none")
        .attr("stroke", pageColors.firstNations)
        .attr("stroke-width", 3)
        .attr("d", d3.line().x(row => x(row.year)).y(row => y(row.index)));
    const tooltip = addTooltip();
    const points = svg.selectAll(".first-nations-point").data(data).join("circle")
        .attr("class", "first-nations-point")
        .attr("cx", row => x(row.year))
        .attr("cy", row => y(row.index))
        .attr("r", 4)
        .attr("fill", pageColors.firstNations)
        .attr("tabindex", 0)
        .attr("aria-label", row =>
            `${row.year}: index ${row.index.toFixed(1)} (2011 = 100), ${formatNumber(row.hospitalisations)} First Nations admissions`
        );
    bindTooltip(points, tooltip, row =>
        `<strong>${row.year}</strong><br>Index: ${row.index.toFixed(1)} (2011 = 100)<br>${formatNumber(row.hospitalisations)} First Nations admissions`
    );
};

const renderCurrentPage = () => {
    if (!reportData.national || !reportData.national.length) return;
    d3.selectAll("body > .tooltip").remove();
    if (activePage === "national") drawNationalChart();
    if (activePage === "states") {
        const latest = reportData.states.filter(row => row.year === 2021)
            .map(row => ({ ...row, label: stateNames[row.state] || row.state }))
            .sort((a, b) => d3.descending(a.hospitalisations, b.hospitalisations));
        drawHorizontalBars("#state-chart", latest, row => row.label, row => row.hospitalisations, {
            highlightTop: 3,
            height: 420,
            left: 150,
            baseColor: colors.grey
        });
    }
    if (activePage === "road-users") {
        const groups = [...new Set(reportData.roadUsers.map(row => row.roadUser))].map(group => ({
            group,
            hospitalisations: d3.sum(
                reportData.roadUsers.filter(row => row.roadUser === group),
                row => row.hospitalisations
            )
        })).sort((a, b) => d3.descending(a.hospitalisations, b.hospitalisations));
        drawHorizontalBars("#road-user-chart", groups, row => row.group, row => row.hospitalisations, {
            height: 420,
            left: 150,
            showShare: true
        });
    }
    if (activePage === "age-sex") drawAgeSexChart();
    if (activePage === "first-nations") drawFirstNationsChart();
    if (activePage === "first-nations-age") drawFirstNationsAgeChart();
};

const setActivePage = page => {
    activePage = pageNames.includes(page) ? page : "national";
    d3.selectAll(".visual-page")
        .attr("hidden", function () {
            return this.id === `page-${activePage}` ? null : true;
        });
    d3.selectAll(".page-tabs [role='tab']")
        .attr("aria-selected", function () {
            return d3.select(this).attr("data-page") === activePage ? "true" : "false";
        });
    renderCurrentPage();
};

d3.selectAll(".page-tabs [role='tab']").on("click", function () {
    const page = d3.select(this).attr("data-page");
    if (window.location.hash.slice(1) === page) {
        setActivePage(page);
    } else {
        window.location.hash = page;
    }
});

window.addEventListener("hashchange", () => setActivePage(window.location.hash.slice(1)));
window.addEventListener("resize", () => {
    clearTimeout(window.reportResizeTimer);
    window.reportResizeTimer = setTimeout(renderCurrentPage, 180);
});

Promise.all([
    d3.csv("Data/processed/national_annual.csv", row => ({
        year: +row["Calendar year"],
        hospitalisations: +row.Hospitalisations
    })),
    d3.csv("Data/processed/state_trends.csv", row => ({
        year: +row["calendar year"],
        state: row.state,
        hospitalisations: +row.hospitalisations
    })),
    d3.csv("Data/processed/road_user_trends.csv", row => ({
        year: +row["Calendar year"],
        roadUser: row["Road user group"],
        hospitalisations: +row.Hospitalisations
    })),
    d3.csv("Data/processed/age_severity.csv", row => ({
        age: row["Age group"],
        sex: row.Sex,
        hospitalisations: +row.Hospitalisations
    })),
    d3.csv("Data/processed/first_nations_trends.csv", row => ({
        year: +row["Calendar year"],
        status: row["First Nations status"],
        age: row["Age group"],
        hospitalisations: +row.Hospitalisations
    }))
]).then(([national, states, roadUsers, ages, firstNations]) => {
    reportData.national = national;
    reportData.states = states;
    reportData.roadUsers = roadUsers;
    reportData.ages = ages;
    reportData.firstNations = firstNations;

    const first = national.find(row => row.year === 2011);
    const last = national.find(row => row.year === 2021);
    if (!first || !last || first.hospitalisations !== 34033 || last.hospitalisations !== 39505) {
        throw new Error("National admissions sanity check failed: expected 34,033 in 2011 and 39,505 in 2021.");
    }
    setActivePage(window.location.hash.slice(1) || "national");
}).catch(error => {
    const message = error instanceof Error ? error.message : String(error);
    d3.select("#load-error")
        .text(`The visualisations could not be loaded. ${message}`)
        .attr("hidden", null);
});
