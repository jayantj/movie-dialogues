var dataDir = '../data/'
var svg = d3.select('svg');

// Hand code the svg dimensions, you can also use +svg.attr('width') or +svg.attr('height')
var svgWidth = +svg.attr('width');
var svgHeight = +svg.attr('height');
var padding = {t: 60, r: 40, b: 30, l: 40};
var chartpad = {t: 30, r: 0, b: 20, l: 0};

// Compute chart dimensions
var chartWidth = svgWidth - padding.l - padding.r;
var chartHeight = svgHeight - padding.t - padding.b;
var plotHeight = (chartHeight/3);
//var plotWidth = (chartWidth/3) - chartpad.l - chartpad.r;
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

    // Get extents
    var yearExtent = d3.extent(dataset, function(d){return d['movie_year'];});
    var mmExtent = d3.extent(dataset, function(d){return +d['mm_percent'];});
    var fmExtent = d3.extent(dataset, function(d){return +d['mf_percent'];});
    var ffExtent = d3.extent(dataset, function(d){return +d['ff_percent'];});
    
    //Create scales
    xScale = d3.scaleLinear().domain(yearExtent).range([0, chartWidth]);
    ffScale = d3.scaleLinear().domain(ffExtent).range([plotHeight, 0]);
    fmScale = d3.scaleLinear().domain(fmExtent).range([plotHeight+plotHeight, plotHeight+chartpad.t]);
    mmScale = d3.scaleLinear().domain(mmExtent).range([plotHeight * 3, plotHeight+plotHeight+chartpad.t]);
    
    // Ordinal color scale for cylinders color mapping
    var colorScale = d3.scaleOrdinal(d3.schemeSet2).domain(['1','0','?']);

    //sizeScale = d3.scaleLinear().domain(ratingExtent).range([1,10]);
    var xAxis = d3.axisBottom(xScale).ticks(10);//.tickFormat(d3.format(".0%"));
    var ffAxis = d3.axisLeft(ffScale);//.ticks(14);//.ticks(8).tickFormat(d3.format(".0%"));
    var fmAxis = d3.axisLeft(fmScale);
    var mmAxis = d3.axisLeft(mmScale);
    
    //Load x scales
    chartG.append('g')
    .attr('class', 'x axis')
    .attr('transform', 'translate(0,595)')
    .call(xAxis);

    chartG.append('g')
    .attr('class', 'x axis')
    .attr('transform', 'translate(0,397)')
    .call(xAxis);

    chartG.append('g')
    .attr('class', 'x axis')
    .attr('transform', 'translate(0,200)')
    .call(xAxis);
    //

    //Load ff scatterplot and y scale
    chartG.append('g')
    .attr('class', 'ff axis')
    .attr('transform', 'translate(0,0)')
    .call(ffAxis);
    
    var ff = chartG.append('g');
    ff.selectAll("circle")
    .data(dataset) 
    .enter() 
    .append("circle")
    .attr('cx', function(d){return xScale(d['movie_year']);})
    .attr('cy', function(d){return ffScale(d['ff_percent']);})
    .attr('r', 2)
    .attr('class', 'ff')
    .style('fill', function(d){return colorScale(d['bechdel']);});

    //mf scatterplot
    chartG.append('g')
    .attr('class', 'fm axis')
    .attr('transform', 'translate(0,0)')
    .call(fmAxis);
    
    var fm = chartG.append('g');
    fm.selectAll("circle")
    .data(dataset) 
    .enter() 
    .append("circle")
    .attr('cx', function(d){return xScale(d['movie_year']);})
    .attr('cy', function(d){return fmScale(d['mf_percent']);})
    .attr('r', 2)
    .attr('class', 'fm')
    .style('fill', function(d){return colorScale(d['bechdel']);});

    //mm scatterplot
    chartG.append('g')
    .attr('class', 'mm axis')
    .attr('transform', 'translate(0,0)')
    .call(mmAxis);
    
    var mm = chartG.append('g');
    mm.selectAll("circle")
    .data(dataset) 
    .enter() 
    .append("circle")
    .attr('cx', function(d){return xScale(d['movie_year']);})
    .attr('cy', function(d){return mmScale(d['mm_percent']);})
    .attr('r', 2)
    .attr('class', 'mm')
    .style('fill', function(d){return colorScale(d['bechdel']);});

    //.attr('r', function(d){return sizeScale(d['imdb_rating']);});
    //.attr('class', function(d){return topRank(d['rank']);});




});