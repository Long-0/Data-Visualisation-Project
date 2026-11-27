const dataPath = "Data/processed/";

d3.csv(`${dataPath}national_annual.csv`, d => ({
    year: d["Calendar year"],
    hospitalisations: +d.Hospitalisations,
})).then(data => {
    console.log("National data:", data);
    nationalData = data;
    drawNationalChart(data);
    drawNationalChangeChart(data);
    renderMetricCards();
});

let stateData = [];
let roadUserData = [];
let ageData = [];
let nationalData = [];
let firstNationsData = [];
let firstNationsAgeData = [];
let activePage = "national";

const stateDisplayNames = {
    ACT: "ACT",
    NSW: "New South Wales",
    NT: "Northern Territory",
    Qld: "Queensland",
    SA: "South Australia",
    Tas: "Tasmania",
    Vic: "Victoria",
    WA: "Western Australia"
};

const metricChangeText = (current, previous, previousYear) => {
    if (previous == null || previousYear < 2011) return "First year available";
    if (previous === 0) return `vs ${previousYear} (no previous value)`;

    const change = ((current - previous) / previous) * 100;
    const sign = change > 0 ? "+" : "";
    return `vs ${previousYear} (${sign}${change.toFixed(1)}%)`;
};

const drawMetricSparkline = (selector, rows, valueAccessor) => {
    const values = rows.map(valueAccessor).filter(Number.isFinite);
    const svg = d3.select(selector)
        .attr("viewBox", "0 0 100 34")
        .attr("preserveAspectRatio", "none");

    svg.selectAll("*").remove();
    if (values.length < 2) return;

    const extent = d3.extent(values);
    const spread = extent[1] - extent[0] || extent[1] || 1;
    const x = d3.scaleLinear().domain([0, values.length - 1]).range([2, 98]);
    const y = d3.scaleLinear()
        .domain([extent[0] - spread * 0.1, extent[1] + spread * 0.1])
        .range([30, 4]);

    svg.append("path")
        .attr("d", d3.area()
            .x((value, index) => x(index))
            .y0(32)
            .y1(value => y(value))(values));
    svg.append("polyline")
        .attr("points", values.map((value, index) => `${x(index)},${y(value)}`).join(" "));
};

const updateMetricVisibility = () => {
    let visibleCount = 0;
    d3.selectAll(".metric-card").each(function () {
        const pages = d3.select(this).attr("data-findings").split(/\s+/);
        const waitingForPageData = (activePage === "first-nations" &&
            this.id === "metric-admissions-card" &&
            !firstNationsData.length) ||
            (activePage === "age" &&
                this.id === "metric-admissions-card" &&
                !ageData.length);
        const visible = pages.includes(activePage) && !waitingForPageData;
        this.hidden = !visible;
        if (visible) visibleCount += 1;
    });

    d3.select(".metric-grid")
        .attr("data-visible-count", visibleCount)
        .property("hidden", visibleCount === 0);
};

const renderMetricCards = () => {
    updateMetricVisibility();
    const selectedYear = +d3.select("#year-filter").property("value");
    const annual = nationalData.find(row => +row.year === selectedYear);
    const stateRows = stateData.filter(row => row.year === selectedYear);
    const roadUserRows = roadUserData.filter(row => row.year === selectedYear);
    const previousYear = selectedYear - 1;
    const previousAnnual = nationalData.find(row => +row.year === previousYear);

    if (activePage === "first-nations") {
        const firstNationsRows = firstNationsData
            .filter(row => row.status === "First Nations people")
            .sort((a, b) => d3.ascending(a.year, b.year));
        const selectedFirstNations = firstNationsRows.find(row => row.year === selectedYear);
        const firstNationsBaseline = firstNationsRows.find(row => row.year === 2011);
        if (!selectedFirstNations || !firstNationsBaseline) return;

        const change = (selectedFirstNations.hospitalisations - firstNationsBaseline.hospitalisations) /
            firstNationsBaseline.hospitalisations * 100;
        const sign = change > 0 ? "+" : "";
        d3.select("#metric-admissions-label").text("First Nations admissions");
        d3.select("#metric-admissions").text(formatNumber(selectedFirstNations.hospitalisations));
        d3.select("#metric-admissions-change").text(selectedYear === 2011
            ? "Baseline year"
            : `vs 2011 (${sign}${change.toFixed(1)}%)`
        );
        drawMetricSparkline(
            "#metric-admissions-sparkline",
            firstNationsRows,
            row => row.hospitalisations
        );
    } else if (activePage === "age") {
        const selectedSex = d3.select("#age-sex-filter").property("value") || "All";
        const ageSexRows = ageData.filter(row =>
            row.year === selectedYear &&
            ["Female", "Male"].includes(row.sex) &&
            (selectedSex === "All" || row.sex === selectedSex)
        );
        const leadingAgeSex = d3.greatest(ageSexRows, row => row.hospitalisations);
        if (!leadingAgeSex) return;

        const previousAgeSex = ageData.find(row =>
            row.year === previousYear &&
            row.age === leadingAgeSex.age &&
            row.sex === leadingAgeSex.sex
        );
        d3.select("#metric-admissions-label").text("Highest age-sex group");
        d3.select("#metric-admissions").text(formatNumber(leadingAgeSex.hospitalisations));
        d3.select("#metric-admissions-change").text(
            `${leadingAgeSex.sex}, ${leadingAgeSex.age} · ${metricChangeText(
                leadingAgeSex.hospitalisations,
                previousAgeSex && previousAgeSex.hospitalisations,
                previousYear
            )}`
        );
        drawMetricSparkline(
            "#metric-admissions-sparkline",
            ageData
                .filter(row => row.age === leadingAgeSex.age && row.sex === leadingAgeSex.sex)
                .sort((a, b) => d3.ascending(a.year, b.year)),
            row => row.hospitalisations
        );
    } else if (annual) {
        d3.select("#metric-admissions-label").text("Hospital admissions");
        d3.select("#metric-admissions").text(formatNumber(annual.hospitalisations));
        d3.select("#metric-admissions-change").text(
            metricChangeText(
                annual.hospitalisations,
                previousAnnual && previousAnnual.hospitalisations,
                previousYear
            )
        );
        drawMetricSparkline("#metric-admissions-sparkline", nationalData, row => row.hospitalisations);
    } else {
        return;
    }

    if (!stateRows.length || !roadUserRows.length) return;
    const leadingState = d3.greatest(stateRows, row => row.hospitalisations);
    const previousState = stateData.find(row =>
        row.year === previousYear && row.state === leadingState.state
    );
    const leadingRoadUser = d3.greatest(roadUserRows, row => row.hospitalisations);
    const previousRoadUser = roadUserData.find(row =>
        row.year === previousYear && row.roadUser === leadingRoadUser.roadUser
    );

    d3.select("#metric-leading-state").text(stateDisplayNames[leadingState.state] || leadingState.state);
    d3.select("#metric-leading-state-change").text(
        `${formatNumber(leadingState.hospitalisations)} admissions · ${metricChangeText(
            leadingState.hospitalisations,
            previousState && previousState.hospitalisations,
            previousYear
        )}`
    );
    drawMetricSparkline(
        "#metric-leading-state-sparkline",
        stateData.filter(row => row.state === leadingState.state),
        row => row.hospitalisations
    );

    d3.select("#metric-leading-road-user").text(leadingRoadUser.roadUser);
    d3.select("#metric-leading-road-user-change").text(
        `${formatNumber(leadingRoadUser.hospitalisations)} admissions · ${metricChangeText(
            leadingRoadUser.hospitalisations,
            previousRoadUser && previousRoadUser.hospitalisations,
            previousYear
        )}`
    );
    drawMetricSparkline(
        "#metric-leading-road-user-sparkline",
        roadUserData.filter(row => row.roadUser === leadingRoadUser.roadUser),
        row => row.hospitalisations
    );
};

const updateAgeChartTitle = (year, selectedSex) => {
    d3.select("#age-chart-title").text(
        selectedSex === "All"
            ? `Age and sex hospitalisations in ${year}`
            : `${selectedSex} hospitalisations by age group in ${year}`
    );
};

d3.csv(`${dataPath}state_trends.csv`, d => ({
    year: +d["calendar year"],
    state: d.state,
    hospitalisations: +d.hospitalisations
})).then(data => {
    console.log("State data:", data);
    stateData = data;
    drawStateChart(data);
    drawStateTrendChart(data);
    renderMetricCards();
});

d3.csv(`${dataPath}road_user_trends.csv`, d => ({
    year: +d["Calendar year"],
    roadUser: d["Road user group"],
    hospitalisations: +d.Hospitalisations
})).then(data => {
    console.log("Road-user data:", data);
    roadUserData = data;
    drawRoadUserChart(data);
    drawRoadUserTrendChart(data, +d3.select("#year-filter").property("value"));
    renderMetricCards();
});

d3.csv(`${dataPath}age_severity.csv`, d => ({
    year: +d["Calendar year"],
    age: d["Age group"],
    sex: d.Sex,
    hospitalisations: +d.Hospitalisations
})).then(data => {
    console.log("Age data:", data);
    ageData = data;
    const selectedSex = d3.select("#age-sex-filter").property("value") || "All";
    updateAgeChartTitle(+d3.select("#year-filter").property("value"), selectedSex);
    drawAgeChart(data, +d3.select("#year-filter").property("value"), selectedSex);
    drawAgeTrendChart(data, selectedSex);
    renderMetricCards();
});

d3.csv(`${dataPath}first_nations_trends.csv`, d => ({
    year: +d["Calendar year"],
    status: d["First Nations status"],
    hospitalisations: +d.Hospitalisations
})).then(data => {
    console.log("First Nations data:", data);
    firstNationsData = data;
    drawFirstNationsChart(data);
    renderMetricCards();
});

d3.csv(`${dataPath}first_nations_age.csv`, d => ({
    year: +d["Calendar year"],
    age: d["Age group"],
    hospitalisations: +d.Hospitalisations
})).then(data => {
    firstNationsAgeData = data;
    if (window.location.hash === "#first-nations") {
        drawFirstNationsAgeChart(
            data,
            d3.select("#first-nations-age-filter").property("value") || "All"
        );
    }
});

d3.select("#year-filter").on("change", function () {
    const selectedYear = +this.value;
    renderMetricCards();
    d3.select("#state-chart-title").text(`State hospitalisations in ${selectedYear}`);
    d3.select("#road-user-chart-title").text(`Road-user hospitalisations in ${selectedYear}`);
    updateAgeChartTitle(
        selectedYear,
        d3.select("#age-sex-filter").property("value") || "All"
    );
    if (stateData.length) drawStateChart(stateData, selectedYear);
    if (roadUserData.length) {
        drawRoadUserChart(roadUserData, selectedYear);
        drawRoadUserTrendChart(roadUserData, selectedYear);
    }
    if (ageData.length) {
        drawAgeChart(
            ageData,
            selectedYear,
            d3.select("#age-sex-filter").property("value") || "All"
        );
    }
});

d3.select("#age-sex-filter").on("change", function () {
    const selectedSex = this.value;
    const selectedYear = +d3.select("#year-filter").property("value");
    updateAgeChartTitle(selectedYear, selectedSex);
    renderMetricCards();
    if (ageData.length) {
        drawAgeChart(ageData, selectedYear, selectedSex);
        drawAgeTrendChart(ageData, selectedSex);
    }
});

d3.select("#first-nations-age-filter").on("change", function () {
    if (firstNationsAgeData.length) {
        drawFirstNationsAgeChart(firstNationsAgeData, this.value);
    }
});

const showChartPage = pageName => {
    activePage = pageName;
    updateMetricVisibility();
    renderMetricCards();
    d3.selectAll("body > .tooltip").remove();
    d3.selectAll(".chart-card-page")
        .attr("hidden", function () {
            return d3.select(this).attr("data-chart-page") === pageName ? null : true;
        });

    d3.selectAll(".sidebar nav a")
        .classed("active", function () {
            return d3.select(this).attr("data-page") === pageName;
        });

    d3.select(".dashboard-controls").style("display", "flex");
    d3.select("#age-sex-filter").property("hidden", pageName !== "age");
    d3.select('label[for="age-sex-filter"]').property("hidden", pageName !== "age");
    d3.select("#first-nations-age-filter").property("hidden", pageName !== "first-nations");
    d3.select('label[for="first-nations-age-filter"]')
        .property("hidden", pageName !== "first-nations");

    const visibleChart = d3.select(`[data-chart-page="${pageName}"] .chart`);
    const svg = visibleChart.select("svg");
    if (!svg.empty()) {
        svg.style("transform", "translate(0px, 0px) scale(1)");
    }

    requestAnimationFrame(() => {
        if (pageName === "national" && nationalData.length) {
            d3.select("#national-chart").html("");
            drawNationalChart(nationalData);
            drawNationalChangeChart(nationalData);
        } else if (pageName === "state" && stateData.length) {
            drawStateChart(stateData, +d3.select("#year-filter").property("value"));
            drawStateTrendChart(stateData);
        } else if (pageName === "road-user" && roadUserData.length) {
            const selectedYear = +d3.select("#year-filter").property("value");
            drawRoadUserChart(roadUserData, selectedYear);
            drawRoadUserTrendChart(roadUserData, selectedYear);
        } else if (pageName === "age" && ageData.length) {
            const selectedSex = d3.select("#age-sex-filter").property("value") || "All";
            updateAgeChartTitle(
                +d3.select("#year-filter").property("value"),
                selectedSex
            );
            drawAgeChart(
                ageData,
                +d3.select("#year-filter").property("value"),
                selectedSex
            );
            drawAgeTrendChart(ageData, selectedSex);
        } else if (pageName === "first-nations" && firstNationsData.length) {
            d3.select("#first-nations-chart").html("");
            drawFirstNationsChart(firstNationsData);
            if (firstNationsAgeData.length) {
                drawFirstNationsAgeChart(
                    firstNationsAgeData,
                    d3.select("#first-nations-age-filter").property("value") || "All"
                );
            }
        }
    });
};

d3.selectAll(".sidebar nav a").on("click", function (event) {
    event.preventDefault();
    const pageName = d3.select(this).attr("data-page");
    window.location.hash = pageName;
    showChartPage(pageName);
});

const validPages = ["national", "state", "road-user", "age", "first-nations"];
const initialPage = window.location.hash.slice(1);
showChartPage(validPages.includes(initialPage) ? initialPage : "national");

window.addEventListener("hashchange", () => {
    const pageName = window.location.hash.slice(1);
    showChartPage(validPages.includes(pageName) ? pageName : "national");
});

let resizeTimer;
window.addEventListener("resize", () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
        const pageName = window.location.hash.slice(1) || "national";
        showChartPage(validPages.includes(pageName) ? pageName : "national");
    }, 180);
});
