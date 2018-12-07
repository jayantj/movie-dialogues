var onGenreChanged;
var onSelectMovie;
var onColorChanged;

(function() {    
    var dataDir = '../data/'
    var svg = d3.select('#scatter-svg');
    var svgLegend = d3.select('.legend-svg');

    // Hand code the svg dimensions, you can also use +svg.attr('width') or +svg.attr('height')
    var svgWidth = +svg.attr('width');
    var svgHeight = +svg.attr('height');
    var padding = {t: 30, r: 40, b: 40, l: 50};
    var chartpad = 10;
    var category;

    // Compute chart dimensions
    var movies;
    var colorOptions = ['bechdel','anxiety','anger','death','home','leisure','money','religion','sadness','sexual','swear',];
    // Create a group element for appending chart elements
    var chartG = svg.append('g')
        .attr('transform', 'translate('+[padding.l, padding.t]+')');

    //chart title
    /*svg.append('g')
        .attr('class', 'scatter-titles')
        .append('text')
        .attr('transform', 'translate(20,40)')
        .text('Movies by intersex conversation')
        .attr('class','miniTitles');
    
    svg.selectAll('.scatter-titles')
        .append('text')
        .attr('transform', 'translate(380,40)')
        .text('Color By:')
        .attr('class','colorDropdown');
    
    var select = .select('.scatter-titles')
        .append('select')
        .attr('class','color-select')
        .attr('transform', 'translate(410,40)')
        .on('change',onColorChanged);*/
      
    d3.select('#color-select')
        .selectAll('option')
        .data(colorOptions)
        .enter()
        .append('option')
        .text(function (d) {return d;});

    var dataAttributes = ['mm_percent', 'mf_percent', 'ff_percent'];
    var axesLabels = {'mm_percent':'Male to Male Conversations', 'mf_percent':'Male to Female Conversations', 'ff_percent':'Female to Female Conversations'};
    var themes =  {'anxiety': 'anxiety_conv','anger':'anger_conv','sadness':'sadness_conv','sexual':'sexual_conv','work': 'work_conv','leisure':'leisure_conv','home':'home_conv','money':'money_conv','religion':'religion_conv','death':'death_conv','swear':'swear_conv'};
    var N = dataAttributes.length;
    var chartWidth = (svgWidth - padding.l - padding.r);
    var chartHeight = (svgHeight - padding.t - padding.b)/N;

    //Global x and y scale and axies for 3 scatterplots
    var xScale = d3.scaleLinear().range([0, chartWidth - chartpad]);
    var yScale = d3.scaleLinear().range([chartHeight - chartpad, 0]);
    var xAxis = d3.axisBottom(xScale).tickValues([1920,1930,1940,1950,1960,1970,1980,1990,2000,2010]);//.tickFormat(d3.format(".0%"));
    var yAxis = d3.axisLeft(yScale);

    //ordinal color scale
    var colorScaleA = d3.scaleOrdinal(['#ffbe67','#b3789d','#9498a4']).domain(['1','0','?']);
    var colorScaleB = d3.scaleSequential(d3.interpolateBlues);
    //var colorScaleB = d3.scaleSequential(d3.interpolate('#102542','#2c3f5e', '#485b7c', '#65799b','#8298bc','#a1b9dd','#c1daff'));
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
        return "<h5 style='text-transform: capitalize'>"+d['movie_title']+", "+d.movie_year+", "+d.mm_percent+"</h5>";
    });
    // Get decade for movie
    function decadeForRow(row) {
        return row.movie_year - row.movie_year % 10;
    };

    //Create Splom Cell
    function SplomCell(x, y, col, row) {
        this.x = x;
        this.y = y;
        this.col = col;
        this.row = row;
        this.highlightedDecade = null;
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
                'anxiety_conv': +row['anxiety_conv'],
                'anger_conv': +row['anger_conv'],
                'sadness_conv': +row['sadness_conv'],
                'sexual_conv': +row['sexual_conv'],
                'work_conv': +row['work_conv'],
                'leisure_conv': +row['leisure_conv'],
                'home_conv': +row['home_conv'],
                'money_conv': +row['money_conv'],
                'religion_conv': +row['religion_conv'],
                'death_conv': +row['death_conv'],
                'swear_conv': +row['swear_conv'],
                'netspeak_conv': +row['netspeak_conv'],
                'decade': decadeForRow(row)
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
                .call(xAxis);

            //Add buttons to x axis ticks
            d3.selectAll(".x.axis .tick")
                .insert('rect','text')
                .attr('class', 'decade-button')
                .attr('rx', 10)
                .attr("transform", "translate(-20,6)");
            
            d3.selectAll(".x.axis .tick text")
                .attr("transform", "translate(1,4)");    

            chartG.selectAll('.y.axis')
                .data(dataAttributes)
                .enter()
                .append('g')
                .attr('class', 'y axis')
                .attr('transform', function(d,i) {
                    return 'translate('+[0, i * chartHeight + chartpad / 2]+')';
                })
                .each(function(attribute){
                    yScale.domain([-5,100]);
                    d3.select(this).call(yAxis);
                    d3.select(this).append('text')
                        .text(axesLabels[attribute])
                        .attr('class', 'axis-label')
                        .attr('transform', 'translate('+[-26, chartHeight / 2]+')rotate(270)');
                });

            d3.selectAll(".x.axis .tick")
            .on("mouseover",function(d){
                d3.select(this).classed('tick-hover',true)
            })
            .on("mouseout",function(d){
                d3.select(this).classed('tick-hover',false)
            })
            .on("click", function(d) {
                var d3_tick = d3.select(this)
                if(d3_tick.classed('tick-selected')){
                    d3_tick.classed('tick-selected', false)
                    onDecadeChanged("All")
                    chartG.selectAll('.cell').each(function(cell) {
                        cell.unhighlight(this)
                    })
                }
                else {
                    d3.selectAll(".x.axis .tick").classed('tick-selected', false)
                    d3_tick.classed('tick-selected', true)
                    chartG.selectAll('.cell').each(function(cell) {
                        cell.highlight(this, d)
                    })
                    onDecadeChanged(d);
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
            category = 'bechdel'
            updateChart(movies);
            updateLegend(category);
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

    // Highlight when decade selected
    SplomCell.prototype.highlight = function(g, decade) {
        this.highlightedDecade = decade;
        d3.select(g)
            .selectAll('.dot')
           .classed('hidden', function(d) {
                return d.decade != decade;
           })

    }

    // Unhighlight
    SplomCell.prototype.unhighlight = function(g) {
        this.highlightedDecade = null;
        d3.select(g)
            .selectAll('.dot')
           .classed('hidden', false)
    }

    //Update function
    SplomCell.prototype.update = function(g, data) {
        var cell = d3.select(g);

        // Update the global x,yScale objects for this cell's x,y attribute domains
        //xScale.domain(d3.extent(movies, function(d){return d['movie_year'];}));
        //yScale.domain(extentByAttribute[this.y]);
        xScale.domain([1920,2012]);
        yScale.domain([-5,100]);
        var colorExtent = d3.extent(movies, function(d){
            return Number(d[themes[category]] / d['tot_conv']);
            });
        colorScaleB.domain(colorExtent);
        

        // Save a reference of this SplomCell, to use within anon function scopes
        var _this = this;
        var avgScore = d3.mean(data, function(d) {
            return d[_this.y];
        })

        var lineG = cell.selectAll('.avg-line')
            .data([avgScore])
        var lineGEnter = lineG.enter()
            .append('g')
            .attr('class', 'avg-line')

        lineGEnter
            .append('line')
            .attr('stroke-width', 1)
            .attr("stroke-dasharray", ("3, 3"))
            .attr('stroke', 'black')
            .attr('x1', 0)
            .attr('x2', chartWidth - chartpad)
            .attr('y1', 0)
            .attr('y2', 0)

        lineGEnter
            .append('text')
            .style('color', 'black')
            .attr('class', 'avg-text')
            .attr("font-size", "12px")
            .attr('transform', 'translate(5, -5)')

        lineG.merge(lineGEnter)
            .transition()
            .duration(500)
            .attr('transform', 'translate(' + [0, yScale(avgScore)] + ')')

        cell.select('.avg-text')
            .text('Average = ' + avgScore.toFixed(1))

        var dots = cell.selectAll('.dot')
            .data(data, function(d){
                return d.movie_id; // Create a unique id for movie
            });

        var dotsEnter = dots.enter()
            .append('circle')
            .attr('class', 'dot')
            .attr('r', 4)
            .on('click', function(d,i){
                var movieId = d.movie_id;
                var selected = d3.select(this);
                if(selected.classed('selected')){
                    svg.selectAll(".dot")
                    .classed("selected", function(d){
                        if(d.movie_id == movieId){
                            return false;
                        };
                    })
                    svg.selectAll(".dot")
                    .classed("hidden", false);
                }
                else
                    onSelectMovie(movieId,d.movie_year,d.imdb_rating)
            });

        dotsEnter.on('mouseover', toolTip.show)
            .on('mouseout', toolTip.hide);

        dots.merge(dotsEnter)
        .attr('cx', function(d){
                return xScale(d[_this.x]);
            })
        .attr('cy', function(d){
                return yScale(d[_this.y]);
            })
        .style("fill", function(d) { 
            if(category == 'bechdel'){
                return colorScaleA(d[category]);
            }
            else{
                return colorScaleB(d[themes[category]] / d['tot_conv']);
            }  
        });

        dots.exit().remove();
        if(this.highlightedDecade)
            this.highlight(g, this.highlightedDecade)
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

    onSelectMovie = function(movieId,movieYear,imdbRating) {
        svg.selectAll(".dot")
        .classed("selected", function(d){
            return d.movie_id == movieId;
        })
        svg.selectAll(".dot")
            .classed("hidden", function(d){
                return d.movie_id != movieId;
            })
        detailViewPanelInitialize(movieId);
        onSelectMovieChange(movieId);
    }

    onColorChanged = function(){
        var select = d3.select('#color-select').node();
        category = select.options[select.selectedIndex].value;
        updateChart(movies);
        updateLegend(category);
    }

    function updateLegend(category) {
        console.log(category)
        svgLegend.selectAll('.legendScatter')
            .data([1])
            .enter()
            .append("g")
            .attr("class", "legendScatter")
            .attr('transform', 'translate(5, 10)');

        if(category == 'bechdel') {
            var legendScatter = d3.legendColor()
                //.labelFormat(d3.format(".06f"))
                //.shapePadding(2)
                .shapeWidth(30)
                .labelOffset(5)
                .scale(colorScaleA)
                .orient('horizontal')
                //.shapePadding(40)
                .labels(['Pass', 'Fail', 'Unknown'])
        }
        else {
            var legendScatter = d3.legendColor()
            //.labelFormat(d3.format(".06f"))
            //.shapePadding(2)
            .shapeWidth(30)
            .labelOffset(5)
            .scale(colorScaleB)
            .orient('horizontal')
            //.shapePadding(40)
            // .labels(['Pass', 'Fail', 'Unknown'])

        }

        svgLegend.select(".legendScatter")
            .call(legendScatter);
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


