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
});

let stateData = [];
let roadUserData = [];
let ageData = [];
let nationalData = [];
let firstNationsData = [];

d3.csv(`${dataPath}state_trends.csv`, d => ({
    year: +d["calendar year"],
    state: d.state,
    hospitalisations: +d.hospitalisations
})).then(data => {
    console.log("State data:", data);
    stateData = data;
    drawStateChart(data);
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

    const showYearFilter = ["state", "road-user", "age"].includes(pageName);
    d3.select(".dashboard-controls").style("display", showYearFilter ? "flex" : "none");

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
