var dataDir = '../data/'
var svg = d3.select('svg');

// Hand code the svg dimensions, you can also use +svg.attr('width') or +svg.attr('height')
var svgWidth = +svg.attr('width');
var svgHeight = +svg.attr('height');
var padding = {t: 60, r: 40, b: 30, l: 40};

// Compute chart dimensions
var chartWidth = svgWidth - padding.l - padding.r;
var chartHeight = svgHeight - padding.t - padding.b;
var movies;
// Create a group element for appending chart elements
var chartG = svg.append('g')
    .attr('transform', 'translate('+[padding.l, padding.t]+')');

d3.csv(dataDir + 'movies.csv',
    // Load data and use this function to process each row
    function(error, dataset) {
        // Log and return from an error
        if(error) {
            console.error('Error while loading ./letter_freq.csv dataset.');
            console.error(error);
            return;
        }

    // Create scales 
    var yearExtent = d3.extent(dataset, function(d){
        return d['movie_year'];
        });
    var senExtent = d3.extent(dataset, function(d){
        return +d['sentiment'];
        });
    var ratingExtent = d3.extent(dataset, function(d){
            return +d['imdb_rating'];
            });
    var ffExtent = d3.extent(dataset, function(d){
                return +d['ff_percent'];
                });
    console.log(ffExtent);
    xScale = d3.scaleLinear().domain(yearExtent).range([0, chartWidth]);
    yScale = d3.scaleLinear().domain(ffExtent).range([chartHeight, 0]);
    sizeScale = d3.scaleLinear().domain(ratingExtent).range([1,10]);
    var xAxis = d3.axisBottom(xScale).ticks(10);//.tickFormat(d3.format(".0%"));
    var yAxis = d3.axisLeft(yScale);//.ticks(14);//.ticks(8).tickFormat(d3.format(".0%"));
    
    //Load scales
    chartG.append('g')
    .attr('class', 'axis')
    .attr('transform', 'translate(0,595)')
    .call(xAxis);

    chartG.append('g')
    .attr('class', 'axis')
    .attr('transform', 'translate(0,0)')
    .call(yAxis);

    var p = chartG.selectAll("circle")
    .data(dataset) 
    .enter() 
    .append("circle")
    .attr('cx', function(d){return xScale(d['movie_year']);})
    .attr('cy', function(d){return yScale(d['ff_percent']);})
    .attr('r', function(d){return sizeScale(d['imdb_rating']);});
    //.attr('class', function(d){return topRank(d['rank']);});




});