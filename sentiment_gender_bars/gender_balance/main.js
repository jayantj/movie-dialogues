// Global function called - needed?
// function onMovieSelected() {
//     var select = d3.select('#movieSelect').node();
//     // Get current value of select element
//     var movie = select.options[select.selectedIndex].value;
//     // Update chart with the selected category of letters
//     updateChart(movie);
// }


var svg = d3.select('svg');

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

//var colorMap = {'mm':'plum','mf':'coral','ff':'blue','unknown':'gray'};

var genderColorMap = {'mm':'#FFD700','mf':'#FFB14E','ff':'#FA8775','unknown':'gray'};

//var themesColorMap = {'posemo_conv':'#FFD700','negemo_conv':'#FFB14E','anx_conv':,'anger_conv':,'sad_conv':,'sexual_conv':,'work_conv':,'leisure_conv':,'home_conv':,'money_conv':,'relig_conv':,'death_conv':,'swear_conv':,'netspeak_conv':};
//'mm':'#FFD700','mf':'#FFB14E','ff':'#FA8775','unknown':'gray'};


d3.csv('./movies.csv',
    // Load data and use this function to process each row
    row = function(row) {
        return {
            mm: +row.mm_percent,
            mf: +row.mf_percent,
            ff: +row.ff_percent,
            title: row.movie_title,
            themes: {'Anxiety':row.anx_conv,'Anger':row.anger_conv,'Sad':row.sad_conv,'Sexual':row.sexual_conv,'Work': row.work_conv,'Leisure':row.leisure_conv,'Home':row.home_conv,'Money':row.money_conv,'Religion':row.relig_conv,'Death':row.death_conv},
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
            decadeGender[decade].push(mmSum/decadeMovies[decade].length);
            decadeGender[decade].push(mfSum/decadeMovies[decade].length);
            decadeGender[decade].push(ffSum/decadeMovies[decade].length);
        }

        xScale = d3.scaleLinear()
            .domain([0,100])
            .range([0,chartWidth-140]);

        xSentimentScale = d3.scaleLinear()
            .domain([-1,1])
            .range([0,chartWidth-140]);

        rScale = d3.scaleLinear()
            .range([0,50]);

        // rScale = d3.scaleSqrt()
        //     .domain([0,0.2]);

        // Create global variables here and intialize the chart

        // **** Your JavaScript code goes here ****
        // Update the chart for all letters to initialize
        updateChart('m0');
    });


function updateChart(movie) {
    // Filtered movie data

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
    // filteredMovie[0].topThreeThemes = props.slice(0, 3).reduce(function(obj, prop) {
    //   obj[prop.key] = prop.value;
    //   return obj;
    // }, {});
    filteredMovie[0].topThreeThemes = props.slice(0,3);



    //filteredMovie = filteredMovie[0];

    //filteredMovie = movies;
    
    g = svg.append('g');
    g.append('text')
        .style('color', 'black')
        .attr('transform', 'translate(150,40)')
        .text('Gender conversation (%)');


    var bars = chartG.selectAll('.bar')
        .data(filteredMovie);
    var barsEnter = bars.enter()
        .append('g');
        
    barsEnter.append('rect')
        .attr('height', '30px')
        .attr('width', function(d){
            return xScale(100);
        })
        .attr('class','genderBar')
        .style("fill", function(d, i){
            return genderColorMap['unknown'];
        }); 

    barsEnter.append('rect')
        .attr('height', '30px')
        .attr('width', function(d){
            return xScale(d.mm+d.mf+d.ff);
        })
        .attr('class','genderBar')
        .style("fill", function(d, i){
            return genderColorMap['ff'];
        });

    barsEnter.append('rect')
        .attr('height', '30px')
        .attr('width', function(d){
            return xScale(d.mf+d.mm);
        })
        .attr('class','genderBar')
        .style("fill", function(d, i){
            return genderColorMap['mf'];
        });

    barsEnter.append('rect')
        .attr('height', '30px')
        .attr('width', function(d){
            return xScale(d.mm);
        })
        .attr('class','genderBar')
        .style("fill", function(d, i){
            return genderColorMap['mm'];
        });

//Decade bar

    var bars = chartG.selectAll('.bar')
        .data(filteredMovie);

    var barsEnter = bars.enter()
        .append('g');
        
    barsEnter.append('rect')
        .attr('y', 60)
        .attr('height', '30px')
        .attr('width', function(d){
            return xScale(100);
        })
        .attr('class','genderBar')
        .style("fill", function(d, i){
            return genderColorMap['unknown'];
        });

    barsEnter.append('rect')
        .attr('y', 60)
        .attr('height', '30px')
        .attr('width', function(d){
            return xScale(decadeGender[(d.year-d.year%10).toString() + 's'][0] + decadeGender[(d.year-d.year%10).toString() + 's'][1] + decadeGender[(d.year-d.year%10).toString() + 's'][2]);
        })
        .attr('class','genderBar')
        .style("fill", function(d, i){
            return genderColorMap['ff'];
        });

    barsEnter.append('rect')
        .attr('y', 60)
        .attr('height', '30px')
        .attr('width', function(d){
            return xScale(decadeGender[(d.year-d.year%10).toString() + 's'][0] + decadeGender[(d.year-d.year%10).toString() + 's'][1]);
        })
        .attr('class','genderBar')
        .style("fill", function(d, i){
            return genderColorMap['mf'];
        });

    barsEnter.append('rect')
        .attr('y', 60)
        .attr('height', '30px')
        .attr('width', function(d){
            return xScale(decadeGender[(d.year-d.year%10).toString() + 's'][0]);
        })
        .attr('class','genderBar')
        .style("fill", function(d, i){
            return genderColorMap['mm'];
        });

    var genderBalScale = d3.scaleOrdinal()
        .domain(["Male-male","Male<->female","Female-female","Gender unknown"])
        .range([ "#FFD700", "#FFB14E", "#FA8775", "#808080"]);

    svg.append("g")
        .attr("class", "legendOrdinal")
        .attr("transform", "translate(350,70)");

    var legendOrdinal = d3.legendColor()
        //.shape('circle')
        .labelFormat(d3.format(".06f"))
        .shapePadding(2)
        .scale(genderBalScale);

    svg.select(".legendOrdinal")
        .call(legendOrdinal);
    
    g = svg.append('g');
    g.append('text')
        .style('color', 'black')
        .attr('transform', 'translate(125,270)')
        .text('Sentiment');

    // svg.append("defs")
    //     .append("linearGradient")
    //     .attr("id", "sentiment-slider")
    //     .attr("x1", "0%").attr("y1", "0%")
    //     .attr("x2", "100%").attr("y2", "0%")
    //     .selectAll("stop") 
    //     .data(d3.range([-1,1]))                
    //     .enter().append("stop");

    // var slider = chartG.selectAll('.slider')
    //     .data(filteredMovie);
    // var sliderEnter = slider.enter()
    //     .append('g');
    // sliderEnter.append('rect')
    //     .attr('y', 250)
    //     .attr('height', '10px')
    //     .attr('width', function(d){
    //         return xSentimentScale(1);
    //     })
    //     .attr('class','sentimentBar');


    var sentimentColorRange = ['green','red']
        
    var sentimentColorScale = d3.scaleLinear().range(sentimentColorRange).domain([1,2]);

    var linearGradient = svg.append("g")
        .append("defs")
        .append("linearGradient")
        .attr("id", "linear-gradient");
       
    //.attr("gradientTransform", "rotate(45)");

    linearGradient.append("stop")
        .attr("offset", "0%")
        .attr("stop-color", sentimentColorScale(1));

    linearGradient.append("stop")
        .attr("offset", "100%")
        .attr("stop-color", sentimentColorScale(2));

    chartG.append("rect")
        .attr("y", 250)
        .attr("width", xSentimentScale(1))
        .attr("height", "20px")
        .style("fill", "url(#linear-gradient)");

    chartG.append("line")
        .attr('transform', 'translate(' + xSentimentScale(filteredMovie[0].sentiment)+ ',0)')
        .attr("x1", 0)
        .attr("x2", 0)
        .attr("y1", 230)
        .attr("y2", 260);

    // Top 3 Themes
    rScale.domain([0,filteredMovie[0].topThreeThemes[0].value]);
    var bubbles = chartG.selectAll('.bubble')
        .data(filteredMovie);
    var bubblesEnter = bubbles.enter()
        .append('g');

    bubblesEnter.append('text')
        .attr('x', 80)
        .attr('y', 330)
        .attr('dy', '0.3em')
        .text('Top Themes');

    bubblesEnter.append('circle')
        .attr('cx', 50)
        .attr('cy', 400)
        .attr('r', function(d){
            return rScale(parseFloat(d.topThreeThemes[0].value));
        })
        .style("fill", '#3978AF')
        .style('stroke-width','1px');

    bubblesEnter.append('text')
        .attr('x', 0)
        .attr('y', 465)
        .attr('dy', '0.3em')
        .text(function(d){
            return d.topThreeThemes[0].key;
        })
        .attr('font-size','12px');

    bubblesEnter.append('circle')
        .attr('cx', function(d) {
            return 50 + (0 + 2*rScale(parseFloat(d.topThreeThemes[0].value)))
        })        
        .attr('cy', 400)
        .attr('r', function(d){
            return rScale(parseFloat(d.topThreeThemes[1].value));
        })
        .style("fill", '#3978AF')
        .style('stroke-width','1px');


    bubblesEnter.append('text')
        .attr('x', function(d) {
            return (0 + 0 + 2*rScale(parseFloat(d.topThreeThemes[0].value)))
        }) 
        .attr('y', 465)
        .attr('dy', '0.3em')
        .text(function(d){
            return d.topThreeThemes[1].key;
        })
        .attr('font-size','12px');

    bubblesEnter.append('circle')
        .attr('cx', function(d) {
            return 50 + (0 + 2*rScale(parseFloat(d.topThreeThemes[0].value)) + (0 + 2*rScale(parseFloat(d.topThreeThemes[1].value))))
        })
        .attr('cy', 400)
        .attr('r', function(d){
            return rScale(parseFloat(d.topThreeThemes[2].value));
        })
        .style("fill", '#3978AF')
        .style('stroke-width','1px');

    bubblesEnter.append('text')
        .attr('x', function(d) {
            return 40 + (0 + 2*rScale(parseFloat(d.topThreeThemes[0].value)) + (0 + 2*rScale(parseFloat(d.topThreeThemes[1].value))))
        })
        .attr('y', 465)
        .attr('dy', '0.3em')
        .text(function(d){
            return d.topThreeThemes[2].key;
        })
        .attr('font-size','12px');

    barsEnter.append('text')
        .attr('x', 100)
        .attr('dy', '0.9em')
        .text(function(d){
            return d.movie_title;
        });
    bars.exit().remove();
    // **** Draw and Update your chart here ****

}
// Remember code outside of the data callback function will run before the data loads