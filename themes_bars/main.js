var dataDir = '../data/'
var svg = d3.select('svg');

// Get layout parameters
var svgWidth = +svg.attr('width');
var svgHeight = +svg.attr('height');

// Global dataset
var moviesData;

function decadeForRow(row) {
    return row.movie_year - row.movie_year % 10;
};

d3.csv(dataDir + 'movies.csv', function(error, dataset) {
        // Log and return from an error
        if(error) {
            console.error('Error while loading ./cars.csv dataset.');
            console.error(error);
            return;
        }
        var stringColumns = new Set(['genres', 'movie_id', 'movie_title']);
        var themesOfInterest = [
            // 'posemo',
            // 'negemo',
            'anx',
            'anger',
            'sad',
            'sexual',
            'work',
            'leisure',
            'home',
            'money',
            'relig',
            'death',
            // 'swear',
            // 'netspeak',
        ];
        // Parse numerical columns to int/float
        dataset.forEach(function(d) {
            for(var key in d) {
                if(stringColumns.has(key))
                    continue;
                d[key] = +d[key];
            }
        });
        moviesData = dataset;
        // Create grouping by decade
        var nestedByDecade = d3.nest()
            .key(decadeForRow).sortKeys(d3.ascending)
            .rollup(function(group) {
                // Aggregate theme stats per decade
                var totalConv = d3.sum(group, function(row) {
                    return row['tot_conv'];
                });
                var themeScores = [];
                themesOfInterest.forEach(function(theme) {
                    themeScores.push({
                        'key': theme,
                        'value': d3.sum(group, function(row) {
                            return row[theme + '_conv'] / totalConv
                        })
                    });
                });
                return {
                    'total': totalConv,
                    'themes': themeScores
                }
            })
            .entries(moviesData)

        // Create groups per decade
        var decadeRightMargin = 5;
        var decadeWidth = Math.floor(svgWidth / nestedByDecade.length) - decadeRightMargin;

        decadeG = svg.selectAll('.decade')
            .data(nestedByDecade)
            .enter()
            .append('g')
            .attr('class', 'decade')
            .attr('id', function(d) {return d.key;})
            .attr('width', decadeWidth)
            .attr('height', svgHeight)
            .attr('transform', function(d, i) {
                var tx = i * (decadeWidth + decadeRightMargin);
                return 'translate('+[tx, 0]+')';
            });
        decadeG.append('text')
            .text(function(d) {
                return d.key;
            })
            .style('text-anchor', 'middle')
            .style('fill', 'black')
            .style('font-size', 18)
            .style('text-decoration', 'underline')
            .style('font-family', 'Open Sans')
            .attr('transform', function(d, i) {
                return 'translate(' + [decadeWidth/2, 15] + ')';
            });

        // Create bars for themes for each decade
        var themeBottomMargin = 30;
        var barHeight = Math.floor(svgHeight / themesOfInterest.length) - themeBottomMargin;
        var barWidthScale = d3.scaleLinear()
            .domain([0, 1])
            .range([0, decadeWidth])

        var themeColorScale = d3.scaleOrdinal(d3.schemeCategory20);
        var titleHeight = 30;
        var themeG = decadeG.selectAll('.theme')
            .data(function(d) {
                return d.value.themes;
            })
            .enter()
            .append('g')
            .attr('class', 'theme')
            .attr('transform', function(d, i) {
                var ty = i * (barHeight + themeBottomMargin) + titleHeight;
                return 'translate('+ [0, ty] + ')';
            });

        var textWidth = 25;
        var textShiftX = 25;
        var textShiftY = 8;
        themeG.append('rect')
            .attr('height', barHeight)
            .attr('width', function(d) {
                return barWidthScale(d.value);
            })
            .attr('transform', function(d) {
                return 'translate(' + [textWidth + textShiftX, 0] + ')';
            })
            .attr('fill', function(d) {
                return themeColorScale(d.key);
            });

        themeG.append('text')
            .text(function(d) {
                return d.key;
            })
            .attr('dy', '0.3em')
            .style('text-anchor', 'middle')
            .style('fill', 'black')
            .style('font-size', 14)
            .style('font-family', 'Open Sans')
            .attr('transform', 'translate(' + [textShiftX, textShiftY] + ')');

    });
