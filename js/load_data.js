const dataPath = "DATA/processed/";

d3.csv(`${dataPath}national_annual.csv`, d => ({
    year: d["Calendar year"],
    hospitalisations: +d.Hospitalisations,
    bedDays: +d.Net_Bed_Days,
    deaths: +d.Died_cases
})).then(data => {
    console.log("National data:", data);
    nationalData = data;
    drawNationalChart(data);
    renderMetricCards();
});

let stateData = [];
let roadUserData = [];
let ageData = [];
let nationalData = [];
let firstNationsData = [];

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

const renderMetricCards = () => {
    const selectedYear = +d3.select("#year-filter").property("value");
    const annual = nationalData.find(row => +row.year === selectedYear);
    const stateRows = stateData.filter(row => row.year === selectedYear);
    const roadUserRows = roadUserData.filter(row => row.year === selectedYear);
    if (!annual || !stateRows.length || !roadUserRows.length) return;

    const previousYear = selectedYear - 1;
    const previousAnnual = nationalData.find(row => +row.year === previousYear);
    const leadingState = d3.greatest(stateRows, row => row.hospitalisations);
    const previousState = stateData.find(row =>
        row.year === previousYear && row.state === leadingState.state
    );
    const leadingRoadUser = d3.greatest(roadUserRows, row => row.hospitalisations);
    const previousRoadUser = roadUserData.find(row =>
        row.year === previousYear && row.roadUser === leadingRoadUser.roadUser
    );

    d3.select("#metric-admissions").text(formatNumber(annual.hospitalisations));
    d3.select("#metric-admissions-change").text(
        metricChangeText(annual.hospitalisations, previousAnnual && previousAnnual.hospitalisations, previousYear)
    );
    drawMetricSparkline("#metric-admissions-sparkline", nationalData, row => row.hospitalisations);

    d3.select("#metric-bed-days").text(formatNumber(annual.bedDays));
    d3.select("#metric-bed-days-change").text(
        metricChangeText(annual.bedDays, previousAnnual && previousAnnual.bedDays, previousYear)
    );
    drawMetricSparkline("#metric-bed-days-sparkline", nationalData, row => row.bedDays);

    d3.select("#metric-deaths").text(formatNumber(annual.deaths));
    d3.select("#metric-deaths-change").text(
        metricChangeText(annual.deaths, previousAnnual && previousAnnual.deaths, previousYear)
    );
    drawMetricSparkline("#metric-deaths-sparkline", nationalData, row => row.deaths);

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

d3.csv(`${dataPath}state_trends.csv`, d => ({
    year: +d["calendar year"],
    state: d.state,
    hospitalisations: +d.hospitalisations
})).then(data => {
    console.log("State data:", data);
    stateData = data;
    drawStateChart(data);
    renderMetricCards();
});

d3.csv(`${dataPath}road_user_trends.csv`, d => ({
    year: +d["Calendar year"],
    roadUser: d["Road user group"],
    hospitalisations: +d.Hospitalisations,
    bedDays: +d.Net_Bed_Days,
    deaths: +d.Died_cases
})).then(data => {
    console.log("Road-user data:", data);
    roadUserData = data;
    drawRoadUserChart(data);
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
    drawAgeChart(data);
});

d3.csv(`${dataPath}first_nations_trends.csv`, d => ({
    year: +d["Calendar year"],
    status: d["First Nations status"],
    hospitalisations: +d.Hospitalisations
})).then(data => {
    console.log("First Nations data:", data);
    firstNationsData = data;
    drawFirstNationsChart(data);
});

d3.select("#year-filter").on("change", function () {
    const selectedYear = +this.value;
    renderMetricCards();
    d3.select("#state-chart-title").text(`State hospitalisations in ${selectedYear}`);
    d3.select("#road-user-chart-title").text(`Road-user hospitalisations in ${selectedYear}`);
    d3.select("#age-chart-title").text(`Age and sex hospitalisations in ${selectedYear}`);
    if (stateData.length) drawStateChart(stateData, selectedYear);
    if (roadUserData.length) drawRoadUserChart(roadUserData, selectedYear);
    if (ageData.length) drawAgeChart(ageData, selectedYear);
});

const showChartPage = pageName => {
    d3.selectAll(".chart-card-page")
        .attr("hidden", function () {
            return d3.select(this).attr("data-chart-page") === pageName ? null : true;
        });

    d3.selectAll(".sidebar nav a")
        .classed("active", function () {
            return d3.select(this).attr("data-page") === pageName;
        });

    d3.select(".dashboard-controls").style("display", "flex");

    const visibleChart = d3.select(`[data-chart-page="${pageName}"] .chart`);
    const svg = visibleChart.select("svg");
    if (!svg.empty()) {
        svg.style("transform", "translate(0px, 0px) scale(1)");
    }

    requestAnimationFrame(() => {
        if (pageName === "national" && nationalData.length) {
            d3.select("#national-chart").html("");
            drawNationalChart(nationalData);
        } else if (pageName === "state" && stateData.length) {
            drawStateChart(stateData, +d3.select("#year-filter").property("value"));
        } else if (pageName === "road-user" && roadUserData.length) {
            drawRoadUserChart(roadUserData, +d3.select("#year-filter").property("value"));
        } else if (pageName === "age" && ageData.length) {
            drawAgeChart(ageData, +d3.select("#year-filter").property("value"));
        } else if (pageName === "first-nations" && firstNationsData.length) {
            d3.select("#first-nations-chart").html("");
            drawFirstNationsChart(firstNationsData);
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
