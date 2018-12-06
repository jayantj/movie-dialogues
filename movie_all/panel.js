var detailViewPanelInitialize;
(function () {

function filterArcs(selectedTheme, arcs) {
    arcs.each(function(d,i) {
        d3.select(this).classed('themeFade',false);
        var themeList = ['anxiety','anger','sad','sexual','work','leisure','home','money','religion','death','swear'];
        if(!d.source.conv.themes[themeList.indexOf(selectedTheme.toLowerCase())] && selectedTheme != "none") {
            d3.select(this).classed('themeFade',true);
        }
    });
}

var svg = d3.select('#side_panel').select('svg');

// Get layout parameters
var svgWidth = +svg.attr('width');
var svgHeight = +svg.attr('height');

var padding = {t: 60, r: 40, b: 30, l: 40};

// Compute chart dimensions
var chartWidth = svgWidth - padding.l - padding.r;
var chartHeight = svgHeight - padding.t - padding.b;

// Create a group element for appending chart elements
var chartG = svg.append('g')
    .attr('transform', 'translate('+[padding.l, padding.t]+')');


var toolTip = d3.tip()
    .attr("class", "d3-tip")
    .offset([-12, 0])
    .html(function(d) {
        return "<h5>"+formatPercent(d.value)+"</h5>";
    });

var genderColorMap = {'mm':'#FFD700','mf':'#FFB14E','ff':'#FA8775','unknown':'gray'};

d3.csv('./../data/movies.csv',
    // Load data and use this function to process each row
    row = function(row) {
        return {
            mm: +row.mm_percent,
            mf: +row.mf_percent,
            ff: +row.ff_percent,
            //genderBal :[{key:'unknown',value:100},{key:'ff',value:parseFloat(row.ff_percent)+parseFloat(row.mf_percent)+parseFloat(row.mm_percent)},{key:'mf',value:parseFloat(row.mf_percent)+parseFloat(row.mm_percent)},{key:'mm',value:parseFloat(row.mm_percent)}],
            genderBal :[{key:'mm',value:parseFloat(row.mm_percent)},{key:'mf',value:parseFloat(row.mf_percent)},{key:'ff',value:parseFloat(row.ff_percent)}, {key:'unknown',value:100-parseFloat(row.mm_percent)-parseFloat(row.mf_percent)-parseFloat(row.ff_percent)}],
            title: row.movie_title,
            themes: {'Anxiety':row.anxiety_conv,'Anger':row.anger_conv,'Sad':row.sadness_conv,'Sexual':row.sexual_conv,'Work': row.work_conv,'Leisure':row.leisure_conv,'Home':row.home_conv,'Money':row.money_conv,'Religion':row.religion_conv,'Death':row.death_conv,'Swear':row.swear_conv},
            id: row.movie_id,
            year: row.movie_year,
            sentiment: row.sentiment
        };
    },
    function(error, dataset) {
        // Log and return from an error
        if(error) {
            console.error('Error while loading ./movies.csv dataset.');
            console.error(error);
            return;
        }
        movies = dataset;

        decadeMovies = {'1920s':[],'1930s':[],'1940s':[],'1950s':[],'1960s':[],'1970s':[],'1980s':[],'1990s':[],'2000s':[]}
        decadeGender = {'1920s':[],'1930s':[],'1940s':[],'1950s':[],'1960s':[],'1970s':[],'1980s':[],'1990s':[],'2000s':[]}
        
        for(var i=0; i<movies.length; i++) {
            if(movies[i].year<=1929) {
                decadeMovies['1920s'].push(movies[i]);
            }
            else if(movies[i].year<=1939) {
                decadeMovies['1930s'].push(movies[i]);
            }
            else if(movies[i].year<=1949) {
                decadeMovies['1940s'].push(movies[i]);
            }
            else if(movies[i].year<=1959) {
                decadeMovies['1950s'].push(movies[i]);
            }
            else if(movies[i].year<=1969) {
                decadeMovies['1960s'].push(movies[i]);
            }
            else if(movies[i].year<=1979) {
                decadeMovies['1970s'].push(movies[i]);
            }
            else if(movies[i].year<=1989) {
                decadeMovies['1980s'].push(movies[i]);
            }
            else if(movies[i].year<=1999) {
                decadeMovies['1990s'].push(movies[i]);
            }
            else if(movies[i].year<=2009) {
                decadeMovies['2000s'].push(movies[i]);
            }
        }
        for (var decade in decadeMovies) {
            mmSum = 0;
            mfSum = 0;
            ffSum = 0;
            for(var j=0; j<decadeMovies[decade].length;j++) {
                mmSum = mmSum + decadeMovies[decade][j].mm;
                mfSum = mfSum + decadeMovies[decade][j].mf;
                ffSum = ffSum + decadeMovies[decade][j].ff;
            }
            decadeGender[decade].push({key:'mm',value: mmSum/decadeMovies[decade].length});
            decadeGender[decade].push({key:'mf',value: mfSum/decadeMovies[decade].length});
            decadeGender[decade].push({key:'ff',value: ffSum/decadeMovies[decade].length});
            decadeGender[decade].push({key:'unknown',value: 100-(mmSum/decadeMovies[decade].length)-(mfSum/decadeMovies[decade].length)-(ffSum/decadeMovies[decade].length)});
        }

        xScale = d3.scaleLinear()
            .domain([0,100])
            .range([0,chartWidth-140]);

        xThemeScale = d3.scaleLinear()
            .domain([0,80])
            .range([0,chartWidth-140]);

        xSentimentScale = d3.scaleLinear()
            .domain([-1,1])
            .range([0,chartWidth-140]);

        sentimentAxis = d3.axisBottom(xSentimentScale).ticks(2);

        formatPercent = function(d) {
            return Math.round(d * 100) / 100 + '%';
        }

        //updateChart('m0');
        updatePanel(null);
    });

detailViewPanelInitialize = function(movieId) {
    svg.append('g')
        .attr('transform', 'translate('+[padding.l+120, padding.t+10]+')')
        //.attr('transform', 'translate(80,370)')
        .call(d3.axisTop(xThemeScale).ticks(5));

    svg.append('g')
        .attr('transform', 'translate('+[padding.l+120, padding.t+330]+')')
        //.attr('transform', 'translate(80,370)')
        .call(sentimentAxis);

    svg.append('g')
        .attr('transform', 'translate('+[padding.l+120, padding.t+530]+')')
        //.attr('transform', 'translate(80,370)')
        .call(d3.axisBottom(xScale).ticks(5).tickFormat(formatPercent));

    svg.call(toolTip);
    updatePanel(movieId);
}

function updatePanel(movie) {
    // Filtered movie data
    if(movie) {
        var filteredMovie = movies.filter(function(d){
            if(movie != 'all-movies') {
                return d.id == movie;
            }
            else {
                return;
            }
        });
        var props = Object.keys(filteredMovie[0].themes).map(function(key) {
          return { key: key, value: this[key] };
        }, filteredMovie[0].themes);

        props.sort(function(p1, p2) { return p2.value - p1.value; });

        filteredMovie[0].topThreeThemes = props.slice(0,3);
    
        stackedBars(filteredMovie);
        sentimentSlider(filteredMovie);
        themeBars(filteredMovie,props);

    }
    else {

    }
}
function stackedBars (filteredMovie) {
    g = svg.append('g');
    g.append('text')
        .attr('transform', 'translate(150,500)')
        .text('Intersex conversations: Movie vs Decade')
        .attr('class','miniTitles');


    var bars = chartG.selectAll('.bar')
        .data(filteredMovie[0].genderBal, function(d) {
            return d;
        });
    
    var barsEnter = bars.enter()
        .append('g');
    
    //Movie gender balance bar

    barsEnter.append('rect')
        .attr('x', 120)
        .attr('y', 450)
        .attr('height', '30px')
        .attr('width', function(d){
            return xScale(d.value);
        })
        .attr('transform', function(d) {
            var xTransform = 0;
            var index = filteredMovie[0].genderBal.findIndex(function(each) {
              return each.key == d.key;
            })
            for(var i=0;i<index;i++) {
                xTransform = xTransform + xScale(filteredMovie[0].genderBal[i].value);
            }
            return 'translate('+xTransform.toString()+',0)';
        })
        .attr('class','genderBar')
        .style("fill", function(d, i){
            return genderColorMap[d.key];
        })
        .on('mouseover', toolTip.show)
        .on('mouseout', toolTip.hide)
        .on("mousemove", function(d) {
            var xPosition = d3.mouse(this)[0] - 15;
            var yPosition = d3.mouse(this)[1] - 25;
            toolTip.attr("transform", "translate(" + xPosition + "," + yPosition + ")");
            //toolTip.select("text").text(formatPercent(d.value));
        });

    chartG.append('g')
        .append('text')
        .attr('y', 450)
        .attr('transform', 'translate(-30,0)')
        .style('color', 'black')
        .attr('dy', '1.4em')
        .text(filteredMovie[0].title)
        .attr('class','genderBarText');

    //Decade gender balance bar

    var bars = chartG.selectAll('.bar')
        .data(decadeGender[(filteredMovie[0].year-filteredMovie[0].year%10).toString() + 's']);

    var barsEnter = bars.enter()
        .append('g');
        
    barsEnter.append('rect')
        .attr('x', 120)
        .attr('y', 490)
        .attr('height', '30px')
        .attr('width', function(d){
            return xScale(d.value);
        })
        .attr('class','genderBar')
        .style("fill", function(d, i){
            return genderColorMap[d.key];
        })
        .attr('transform', function(d) {
            var xTransform = 0;
            var data = decadeGender[(filteredMovie[0].year-filteredMovie[0].year%10).toString() + 's'];
            var index = data.findIndex(function(each) {
              return each.key == d.key;
            })
            for(var i=0;i<index;i++) {
                xTransform = xTransform + xScale(data[i].value);
            }
            return 'translate('+xTransform.toString()+',0)';
        })
        .on('mouseover', toolTip.show)
        .on('mouseout', toolTip.hide)
        .on("mousemove", function(d) {
            var xPosition = d3.mouse(this)[0] - 15;
            var yPosition = d3.mouse(this)[1] - 25;
            toolTip.attr("transform", "translate(" + xPosition + "," + yPosition + ")");
            //toolTip.select("text").text(formatPercent(d.value));
        });

    chartG.append('g')
        .append('text')
        .attr('y', 490)
        .attr('transform', 'translate(80,0)')
        .style('color', 'black')
        .attr('dy', '1.4em')
        .text((filteredMovie[0].year-filteredMovie[0].year%10).toString() + 's')
        .attr('class','genderBarText');

    //Gender balance legend
    var genderBalScale = d3.scaleOrdinal()
        .domain(["Male-male","Male<->female","Female-female","Gender unknown"])
        .range([ "#FFD700", "#FFB14E", "#FA8775", "#808080"]);

    svg.append("g")
        .attr("class", "legendOrdinal")
        .attr("transform", "translate(200,630)");

    var legendOrdinal = d3.legendColor()
        .labelFormat(d3.format(".06f"))
        .shapePadding(2)
        .scale(genderBalScale);

    svg.select(".legendOrdinal")
        .call(legendOrdinal);
}
function sentimentSlider(filteredMovie) {
    
    var sentimentToolTip = d3.tip()
        .attr("class", "d3-tip")
        .offset([-12, 0])
        .html(function(d) {
            return "<h5>"+filteredMovie[0].sentiment+"</h5>";
        });

    svg.call(sentimentToolTip);

    g = svg.append('g');
    g.append('text')
        .attr('transform', 'translate(170,350)')
        .text('Sentiment: '+filteredMovie[0].title)
        .attr('class','miniTitles');

    chartG = svg.append('g')
        .attr('transform', 'translate('+[padding.l, padding.t]+')');

    //Sentiment bar and legend
    var sentimentColorRange = ['green','red']
        
    var sentimentColorScale = d3.scaleLinear().range(sentimentColorRange).domain([1,2]);

    var linearGradient = svg.append("g")
        .append("defs")
        .append("linearGradient")
        .attr("id", "linear-gradient");

    linearGradient.append("stop")
        .attr("offset", "0%")
        .attr("stop-color", sentimentColorScale(1));

    linearGradient.append("stop")
        .attr("offset", "100%")
        .attr("stop-color", sentimentColorScale(2));

    chartG.append("rect")
        .attr("x", 120)
        .attr("y", 300)
        .attr("width", xSentimentScale(1))
        .attr("height", "20px")
        .style("fill", "url(#linear-gradient)");

    // var sentimentTicks = xSentimentScale.ticks();
    // sentimentTicks.push(parseFloat(filteredMovie[0].sentiment));
    // sentimentAxis.tickValues(sentimentTicks);

    slider = chartG.append("rect")
        .attr('transform', 'translate(' + (xSentimentScale(filteredMovie[0].sentiment)).toString() + ',0)')
        .attr("x", 120)
        .attr("y", 295)
        .attr('height',"30px")
        .attr('width',"4px")
        .on('mouseover', sentimentToolTip.show)
        .on('mouseout', sentimentToolTip.hide);
}

function themeBars(filteredMovie, props) {
    chartG = svg.append('g')
        .attr('transform', 'translate('+[padding.l, padding.t]+')');

    g = svg.append('g');
    g.append('text')
        .style('color', 'black')
        .attr('transform', 'translate(180,40)')
        .text('Themes: '+ filteredMovie[0].title)
        .attr('class','miniTitles');

    var tBars = chartG.selectAll('.themeBars')
        .data(props, function(d) {
            return d.key;
        });

    var tBarsEnter = tBars.enter()
        .append('g')
        .attr('class', 'themeBar')
        .on('mouseover', function(d) {
            // Use this to select the hovered element
            var hovered = d3.select(this);
            // add hovered class to style the group
            hovered.classed('hovered', true);
        })
        .on('mouseout', function(d) {
            // Clean up the actions that happened in mouseover
            var hovered = d3.select(this);
            hovered.classed('hovered', false);
        })
        .on('click', function(d){
            // Remove the currently selected classname from that element
            //d3.select('.themeBar.selected').classed('selected', false);
            var clicked = d3.select(this);
            var selectedTheme = d.key;
            // Add the selected classname to element that was just clicked
            if(clicked.classed('selected')) {
                clicked.classed('selected', false);
                d3.selectAll('.themeBar').classed('filteredout',false);
                selectedTheme = 'none';
            } else {
                d3.selectAll('.themeBar').classed('filteredout',true);
                clicked.classed('filteredout',false);
                clicked.classed('hovered', false);
                clicked.classed('selected',true);
            }

            var maleArcs = d3.select('.male').selectAll('path');
            var femaleArcs = d3.select('.female').selectAll('path');
            var crossGenderLines = d3.select('.cross-g').selectAll('line');

            filterArcs(selectedTheme,maleArcs);
            filterArcs(selectedTheme,femaleArcs);
            filterArcs(selectedTheme,crossGenderLines);
        });

        
    tBars.merge(tBarsEnter)
        .transition()
        .duration(750)
        .attr('transform', function(d,i){
            return 'translate('+[0, i * 10 + 4]+')';
        });

    tBarsEnter.append('rect')
        .attr('x', 120)
        .attr('y', function(d,i){
            return 20+parseFloat(i/2)*20;
        })
        .attr('height', 10)
        .attr('width', function(d){
            return xThemeScale(parseInt(d.value));
        })
        .attr('fill','#4778AA')
        .attr('class','themeBar');

    tBarsEnter.append('text')
        .attr('x', 60)
        .attr('y', function(d,i){
            return 20+parseFloat(i/2)*20;
        })
        .style('color', 'black')
        .attr('dy', '0.8em')
        .text(function(d) {
            return d.key;
        })
        .attr('class','themeBar');

    tBars.exit().remove();
}
})();