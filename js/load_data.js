const dataPath = "DATA/processed/";

d3.csv(`${dataPath}national_annual.csv`, d => ({
    year: d["Calendar year"],
    hospitalisations: +d.Hospitalisations,
    bedDays: +d.Net_Bed_Days,
    deaths: +d.Died_cases
})).then(data => {
    console.log("National data:", data);
    drawNationalChart(data);
});

d3.csv(`${dataPath}state_trends.csv`, d => ({
    year: +d.year,
    state: d.state,
    hospitalisations: +d.hospitalisations
})).then(data => {
    console.log("State data:", data);
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
    drawRoadUserChart(data);
});

d3.csv(`${dataPath}age_severity.csv`, d => ({
    year: +d["Calendar year"],
    age: d["Age group"],
    sex: d.Sex,
    hospitalisations: +d.Hospitalisations
})).then(data => {
    console.log("Age data:", data);
    drawAgeChart(data);
});

d3.csv(`${dataPath}first_nations_trends.csv`, d => ({
    year: +d["Calendar year"],
    status: d["First Nations status"],
    hospitalisations: +d.Hospitalisations
})).then(data => {
    console.log("First Nations data:", data);
    drawFirstNationsChart(data);
});
