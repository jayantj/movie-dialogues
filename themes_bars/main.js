var dataDir = '../data/'
var svg = d3.select('svg');

// Get layout parameters
var svgWidth = +svg.attr('width');
var svgHeight = +svg.attr('height');

// Global dataset
var moviesData;

var themesOfInterest = [
    // 'posemo',
    // 'negemo',
    'anx',
    'anger',
    'sad',
    'sexual',
    // 'work',
    'leisure',
    'home',
    'money',
    'relig',
    'death',
    // 'swear',
    // 'netspeak',
];
var genresOfInterest = new Set([
    'drama',
    'thriller',
    'comedy',
    'action',
    'crime',
    'romance',
    'sci-fi',
    'adventure',
    'mystery',
    'horror',
    'fantasy',
    'war'
]);

function decadeForRow(row) {
    return row.movie_year - row.movie_year % 10;
};

function themeScoresByGenre(movies) {
    var themesByGenre = {}
    genresOfInterest.forEach(function (g) {
        themeScores = {}
        themesOfInterest.forEach(function (t) {
            themeScores[t] = 0;
        })
        themesByGenre[g] = {'themes': themeScores, 'key': g, 'total': 0};
    })

    movies.forEach(function(d) {
        var genres = new Set(d.genres);
        var intersection = new Set(
            [...genres].filter(x => genresOfInterest.has(x)));
        if (intersection.size > 0) {
            intersection.forEach(function (g) {
                themesByGenre[g]['total'] += d['tot_conv'];
                themesOfInterest.forEach(function (t) {
                    themesByGenre[g]['themes'][t] += d[t + '_conv'];
                })
            })
        }
    });

    for(var genre in themesByGenre) {
        var genreScores = themesByGenre[genre];
        for(var theme in genreScores['themes'])
            genreScores['themes'][theme] /= genreScores['total'];
    }
    return themesByGenre;
}

d3.csv(dataDir + 'movies.csv', function(error, dataset) {
        // Log and return from an error
        if(error) {
            console.error('Error while loading ./cars.csv dataset.');
            console.error(error);
            return;
        }
        var stringColumns = new Set(['movie_id', 'movie_title']);
        var listColumns = new Set(['genres']);
        // Parse numerical columns to int/float
        dataset.forEach(function(d) {
            for(var key in d) {
                if(stringColumns.has(key))
                    continue;
                if(listColumns.has(key)){
                    d[key] = JSON.parse(d[key].replace(/'/g, '"'));
                }
                else
                    d[key] = +d[key];
            }
        });
        moviesData = dataset;
        // Create grouping by decade
        var nestedByDecade = d3.nest()
            // .key(function(row) {
            //     return row.genres;
            // })
            .key(decadeForRow)
            .sortKeys(d3.ascending)
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
        var themesByGenre = d3.entries(themeScoresByGenre(moviesData));
        console.log(nestedByDecade)
        console.log(themesByGenre)
        // Create groups per decade
        var decadeRightMargin = 50;
        var decadeWidth = Math.floor(svgWidth / (1 + themesByGenre.length)) - decadeRightMargin;
        decadeG = svg.selectAll('.decade')
            .data(themesByGenre)
            .enter()
            .append('g')
            .attr('class', 'decade')
            .attr('id', function(d) {return d.key;})
            .attr('width', decadeWidth)
            .attr('height', svgHeight)
            .attr('transform', function(d, i) {
                var tx = 30 + i * (decadeWidth + decadeRightMargin);
                return 'translate('+[tx, 10]+')';
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
                return 'translate(' + [decadeWidth + 20, 15] + ')';
            });

        // Create bars for themes for each decade
        var themeBottomMargin = 30;
        var barHeight = Math.floor(svgHeight / themesOfInterest.length) - themeBottomMargin;
        var barWidthScale = d3.scaleLinear()
            .domain([0, 1])
            .range([0, decadeWidth])

        var radiusScale = d3.scaleSqrt()
            .domain([0, 1])
            .range([0, 30])

        var themeColorScale = d3.scaleOrdinal(d3.schemeCategory20);
        var titleHeight = 30;
        var themeG = decadeG.selectAll('.theme')
            .data(function(d) {
                return d3.entries(d.value.themes);
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
        var themesShown = new Set([]);
        themeG.append('circle')
            .attr('r', function(d) {
                return radiusScale(d.value);
            })
            .attr('transform', function(d) {
                return 'translate(' + [textWidth + textShiftX, textShiftY] + ')';
            })
            .attr('fill', function(d) {
                return themeColorScale(d.key);
            });

        themeG.append('text')
            .text(function(d) {
                if(themesShown.has(d.key))
                    return "";
                themesShown.add(d.key);
                return d.key;
            })
            .attr('dy', '0.3em')
            .style('text-anchor', 'middle')
            .style('fill', 'black')
            .style('font-size', 15)
            .style('font-family', 'Open Sans')
            .attr('transform', 'translate(' + [0, textShiftY] + ')');

    });
