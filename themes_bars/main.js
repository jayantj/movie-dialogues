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

function filterMoviesByDecade(movies, decade) {
    var filteredMovies = movies.filter(function(m) {
        return decadeForRow(m) == decade;
    })
    return filteredMovies
}

function themeScoresByGenre(movies) {
    var themesByGenre = {}
    genresOfInterest.forEach(function (g) {
        themeScores = {}
        themesOfInterest.forEach(function (t) {
            themeScores[t] = 0;
        })
        themesByGenre[g] = {'themes': themeScores, 'total': 0};
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
    return d3.entries(themesByGenre);
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
        // Create groups per genre
        var genreRightMargin = 50;
        var genreWidth = Math.floor(svgWidth / (1 + genresOfInterest.size)) - genreRightMargin;
        var genreG = svg.selectAll('.genre')
            .data(Array.from(genresOfInterest), function(d) {
                return d;
            })
            .enter()
            .append('g')
            .attr('class', 'genre')
            .attr('id', function(d) {
                return d;
            })
            .attr('width', genreWidth)
            .attr('height', svgHeight)
            .attr('transform', function(d, i) {
                var tx = 30 + i * (genreWidth + genreRightMargin);
                return 'translate('+[tx, 10]+')';
            })
            .append('text')
            .text(function(d) {
                return d;
            })
            .style('text-anchor', 'middle')
            .style('fill', 'black')
            .style('font-size', 18)
            .style('text-decoration', 'underline')
            .style('font-family', 'Open Sans')
            .attr('transform', function(d, i) {
                return 'translate(' + [genreWidth + 20, 15] + ')';
            });

        // Create groups for themes for each genre
        var themeBottomMargin = 30;
        var barHeight = Math.floor(svgHeight / themesOfInterest.length) - themeBottomMargin;

        var themeColorScale = d3.scaleOrdinal(d3.schemeCategory20);
        var titleHeight = 30;

        var themesShown = new Set([]);

        createBubbleChart = function(themesGenreScores) {
            var radiusScales = {};
            themesOfInterest.forEach(function(theme) {
                var maxThemeScore = d3.max(themesGenreScores, function(d) {
                    return d.value.themes[theme];
                });
                var minThemeScore = d3.min(themesGenreScores, function(d) {
                    return d.value.themes[theme];
                });
                radiusScales[theme] = d3.scaleSqrt()
                    .domain([minThemeScore, maxThemeScore])
                    .range([3, 15])
            });
            console.log(themesGenreScores[9])
            var genreG = svg.selectAll('.genre')
                .data(themesGenreScores)
            var themesG = genreG.selectAll('.theme')
                .data(function(d) {
                    return d3.entries(d.value.themes);
                })
            var themesGEnter = themesG.enter()

            var textWidth = 25;
            var textShiftX = 25;
            var textShiftY = 8;
            themesGEnter.append('g')
                .attr('class', 'theme')
                .attr('transform', function(d, i) {
                    var ty = i * (barHeight + themeBottomMargin) + titleHeight;
                    return 'translate('+ [0, ty] + ')';
                })
                .append('text')
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

            themesGEnter.selectAll('.theme')
                .append('circle')
                .attr('transform', function(d) {
                    return 'translate(' + [textWidth + textShiftX, textShiftY] + ')';
                })
                .attr('fill', function(d) {
                    return themeColorScale(d.key);
                });

            Object.keys(radiusScales).forEach(function(t){
                var scale = radiusScales[t];
                // console.log(t, scale.domain()[0], scale.domain()[1])
            });
            themesG.merge(themesGEnter)
                .transition()
                .duration(750)
                .selectAll('circle')
                .attr('r', function(d, i) {
                    var scale = radiusScales[d.key]
                    var maxVal = scale.domain()[1];
                    var minVal = scale.domain()[0];
                    if (d.value > maxVal || d.value < minVal)
                        console.log('Invalid', d.key, d.value, maxVal, minVal)
                    return scale(d.value);
                })
        }
        createBubbleChart(themeScoresByGenre(moviesData));
        filteredThemesByGenre = themeScoresByGenre(filterMoviesByDecade(moviesData, 1990))
    });
