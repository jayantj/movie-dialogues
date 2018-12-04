var onGenreChanged;

(function() {    
    var dataDir = '../data/'
    var svg = d3.select('svg');

    // Hand code the svg dimensions, you can also use +svg.attr('width') or +svg.attr('height')
    var svgWidth = +svg.attr('width');
    var svgHeight = +svg.attr('height');
    var padding = {t: 40, r: 40, b: 40, l: 40};
    var chartpad = 10;

    // Compute chart dimensions
    var movies;

    // Create a group element for appending chart elements
    var chartG = svg.append('g')
        .attr('transform', 'translate('+[padding.l, padding.t]+')');

    var dataAttributes = ['mm_percent', 'mf_percent', 'ff_percent'];
    var N = dataAttributes.length;
    var chartWidth = (svgWidth - padding.l - padding.r);
    var chartHeight = (svgHeight - padding.t - padding.b)/N;

    //Global x and y scale and axies for 3 scatterplots
    var xScale = d3.scaleLinear().range([0, chartWidth - chartpad]);
    var yScale = d3.scaleLinear().range([chartHeight - chartpad, 0]);
    var xAxis = d3.axisBottom(xScale).tickValues([1920,1930,1940,1950,1960,1970,1980,1990,2000,2010]);//.tickFormat(d3.format(".0%"));
    var yAxis = d3.axisLeft(yScale);

    //ordinal color scale
    var colorScale = d3.scaleOrdinal(d3.schemeSet2).domain(['1','0','?']);

    // Map for referencing min/max per each attribute
    var extentByAttribute = {};
    var cellEnter;
    var brushCell;
    var genre;

    //brush variable
    var brush = d3.brush()
    .extent([[0, 0], [chartWidth - chartpad, chartHeight - chartpad]])
    .on("start", brushstart)
    .on("brush", brushmove)
    .on("end", brushend);

    //Tooltip
    var toolTip = d3.tip()
    .attr("class", "d3-tip")
    .offset([-12, 0])
    .html(function(d) {
        return "<h5>"+d['movie_title']+", "+d.movie_year+"</h5>";
    });

    //Create Splom Cell
    function SplomCell(x, y, col, row) {
        this.x = x;
        this.y = y;
        this.col = col;
        this.row = row;
    }


    //Create Cells to structure scatterplots
    var cells = [];
    dataAttributes.forEach(function(attrY, row){
            cells.push(new SplomCell('movie_year', attrY, 0, row));
    });

    d3.csv(dataDir + 'movies.csv',
        // Load data and use this function to process each row
        function(row) {
            return {
                'index': +row['index'],
                'movie_id': row['movie_id'],
                'mm_percent': +row['mm_percent'],
                'mf_percent': +row['mf_percent'],
                'ff_percent': +row['ff_percent'],
                'movie_title': row['movie_title'],
                'movie_year': +row['movie_year'],
                'imdb_rating': +row['imdb_rating'],
                'imdb_votes': +row['imdb_votes'],
                'genres': row['genres'],
                'bechdel': row['bechdel'],
                'sentiment': +row['sentiment'],
                'tot_conv': +row['tot_conv'],
                'affect_conv': +row['affect_conv'],
                'posemo_conv': +row['posemo_conv'],
                'negemo_conv': +row['negemo_conv'],
                'anx_conv': +row['anx_conv'],
                'anger_conv': +row['anger_conv'],
                'sad_conv': +row['sad_conv'],
                'sexual_conv': +row['sexual_conv'],
                'work_conv': +row['work_conv'],
                'leisure_conv': +row['leisure_conv'],
                'home_conv': +row['home_conv'],
                'money_conv': +row['money_conv'],
                'religion_conv': +row['religion_conv'],
                'death_conv': +row['death_conv'],
                'swear_conv': +row['swear_conv'],
                'netspeak_conv': +row['netspeak_conv'],

            };
        },
        function(error, dataset) {
            // Log and return from an error
            if(error) {
                console.error('Error while loading ./letter_freq.csv dataset.');
                console.error(error);
                return;
            }
            movies = dataset;
            // Create map for each attribute's extent
            dataAttributes.forEach(function(attribute){
                extentByAttribute[attribute] = d3.extent(dataset, function(d){
                    return d[attribute];
                });
            });

            //Render Axes
            //xScale.domain(d3.extent(dataset, function(d){return d['movie_year'];}));
            xScale.domain([1920,2012]);
            chartG.append('g')
                .attr('class', 'x axis')
                .attr('transform', function(d,i) {
                    return 'translate('+[0, chartHeight*N]+')';
                })
                .call(xAxis)
                .append('text')
                .text('Movie Decades')
                .attr('class', 'axis-label')
                .attr('transform', 'translate('+[chartWidth/2 , 30]+')');

            chartG.selectAll('.y.axis')
                .data(dataAttributes)
                .enter()
                .append('g')
                .attr('class', 'y axis')
                .attr('transform', function(d,i) {
                    return 'translate('+[0, i * chartHeight + chartpad / 2]+')';
                })
                .each(function(attribute){
                    //yScale.domain(extentByAttribute[attribute]);
                    yScale.domain([-5,100]);
                    d3.select(this).call(yAxis);
                    d3.select(this).append('text')
                        .text(attribute)
                        .attr('class', 'axis-label')
                        .attr('transform', 'translate('+[-26, chartHeight / 2]+')rotate(270)');
                });

            d3.selectAll(".x.axis .tick")
            .on("click", function(d) {
                var d3_tick = d3.select(this)
                if(d3_tick.classed('tick-selected')){
                    d3_tick.classed('tick-selected', false)
                    onDecadeChange("All")
                }
                else {
                    d3_tick.classed('tick-selected', true)
                    onDecadeChange(d);
                }

            });

            cellEnter = chartG.selectAll('.cell')
            .data(cells)
            .enter()
            .append('g')
            .attr('class', 'cell')
            .attr("transform", function(d) {
                // Start from the far right for columns to get a better looking chart
                var tx = 0;
                var ty = d.row * chartHeight + chartpad / 2;
                return "translate("+[tx, ty]+")";
             }); 

            cellEnter.append('g')
             .attr('class', 'brush')
             .call(brush); 
            
            svg.call(toolTip);

            updateChart(movies);
    });

    function updateChart(movies) { 
        cellEnter.each(function(cell){
         cell.init(this);
         cell.update(this, movies);
        });
    }

    //Splom Cell Methods
    //Initialize
    SplomCell.prototype.init = function(g) {
        var cell = d3.select(g);

        cell.append('rect')
          .attr('class', 'frame')
          .attr('width', chartWidth - chartpad)
          .attr('height', chartHeight - chartpad);
    }

    //Update function
    SplomCell.prototype.update = function(g, data) {
        var cell = d3.select(g);

        // Update the global x,yScale objects for this cell's x,y attribute domains
        //xScale.domain(d3.extent(movies, function(d){return d['movie_year'];}));
        //yScale.domain(extentByAttribute[this.y]);
        xScale.domain([1920,2012]);
        yScale.domain([-5,100]);
        

        // Save a reference of this SplomCell, to use within anon function scopes
        var _this = this;

        var dots = cell.selectAll('.dot')
            .data(data, function(d){
                return d.movie_id; // Create a unique id for movie
            });

        var dotsEnter = dots.enter()
            .append('circle')
            .attr('class', 'dot')
            .style("fill", function(d) { return colorScale(d.bechdel); })
            .attr('r', 4)
            .on('click', function(d,i){
                var movieid = d.movie_id;
                var selected = d3.select(this);
                if(selected.classed('selected')){
                    svg.selectAll(".dot")
                    .classed("selected", function(d){
                        if(d.movie_id == movieid){
                            return false;
                        };
                    })
                    svg.selectAll(".dot")
                    .classed("hidden", false);
                }
                else{
                    svg.selectAll(".dot")
                    .classed("selected", function(d){
                        return d.movie_id == movieid;
                    })
                    svg.selectAll(".dot")
                        .classed("hidden", function(d){
                            return d.movie_id != movieid;
                        })
                }
            });

        dotsEnter.on('mouseover', toolTip.show)
            .on('mouseout', toolTip.hide);

        dots.merge(dotsEnter)
        //.transition()
        //.duration(550)
        .attr('cx', function(d){
                return xScale(d[_this.x]);
            })
            .attr('cy', function(d){
                return yScale(d[_this.y]);
            });

        dots.exit().remove();
    }
    
    onGenreChanged = function(genre) {
        if(genre == 'All')
            updateChart(movies)
        else {
            var genreMovies = movies.filter(function(d){
                return d.genres.indexOf(genre) >= 0;
            });
            updateChart(genreMovies);
        }
    }

    /******Brushing for ScatterPlot *******/
    function brushstart(cell) {
        // cell is the SplomCell object

        // Check if this g element is different than the previous brush
        if(brushCell !== this) {

            // Clear the old brush
            brush.move(d3.select(brushCell), null);

            // Update the global scales for the subsequent brushmove events
            xScale.domain(extentByAttribute[cell.x]);
            yScale.domain(extentByAttribute[cell.y]);

            // Save the state of this g element as having an active brush
            brushCell = this;
        }
    }

    function brushmove(cell) {
        // cell is the SplomCell object

        // Get the extent or bounding box of the brush event, this is a 2x2 array
        var e = d3.event.selection;
        if(e) {

            // Select all .dot circles, and add the "hidden" class if the data for that circle
            // lies outside of the brush-filter applied for this SplomCells x and y attributes
            svg.selectAll(".dot")
                .classed("hidden", function(d){
                    return e[0][0] > xScale(d[cell.x]) || xScale(d[cell.x]) > e[1][0]
                        || e[0][1] > yScale(d[cell.y]) || yScale(d[cell.y]) > e[1][1];
                })
        }
    }

    function brushend() {
        // If there is no longer an extent or bounding box then the brush has been removed
        if(!d3.event.selection) {
            // Bring back all hidden .dot elements
            svg.selectAll('.hidden').classed('hidden', false);
            // Return the state of the active brushCell to be undefined
            brushCell = undefined;
        }
    }
})();


