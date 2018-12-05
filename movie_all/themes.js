var onDecadeChanged;

(function() {    
    var dataDir = '../data/'
    var svg = d3.select('#genres-themes svg');

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
        'swear',
        // 'netspeak',
    ];
    var genresOfInterest = [
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
    ];

    function decadeForRow(row) {
        return row.movie_year - row.movie_year % 10;
    };

    function filterMoviesByDecade(movies, decade) {
        var filteredMovies = movies.filter(function(m) {
            return decadeForRow(m) == decade;
        })
        return filteredMovies
    }

    function capitalizeFirstLetter(string) {
        if(string == 'sci-fi')
            return 'Sci-Fi'
        return string.charAt(0).toUpperCase() + string.slice(1);
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
        var genresSet = new Set(genresOfInterest)
        movies.forEach(function(d) {
            var genres = new Set(d.genres);
            var intersection = new Set(
                [...genres].filter(x => genresSet.has(x)));
            if (intersection.size > 0) {
                intersection.forEach(function (g) {
                    themesByGenre[g]['total'] += 1;
                    themesOfInterest.forEach(function (t) {
                        themesByGenre[g]['themes'][t] += d[t + '_conv'];
                    })
                })
            }
        });

        for(var genre in themesByGenre) {
            var genreScores = themesByGenre[genre];
            for(var theme in genreScores['themes'])
                if(genreScores['total'])
                    genreScores['themes'][theme] /= genreScores['total'];
                else
                    genreScores['themes'][theme] = 0;
        }
        return d3.entries(themesByGenre);
    }


    function populateDecadeDropdown(movies, decades) {
        var decadeDropdown = d3.select('#decade-select')

        decadeDropdown
        .selectAll('option')
        .data(decades, function(d) {
            return d
        })
        .enter()
        .append("option")
        .attr('value', function(d) { return d; })
        .text(function(d) { return d; })

        decadeDropdown
        .on('change', function() {
            var decade = parseInt(this.value);
            populateMovieDropdown(filterMoviesByDecade(movies, decade))
        })
    }

    function populateMovieDropdown(movies) {
        var moviesDropdown = d3.select('#movie-select')
        var options = moviesDropdown.selectAll('option')
            .data(movies, function(d) {
                if(d)
                    return d.movie_id
                else
                    return d
            })
        options
            .enter()
            .append("option")
            .attr('value', function(d) {
                return d.movie_id;
            })
            .text(function(d) {
                return d.movie_title;
            })
        options.exit().remove()
        moviesDropdown.append("option")
            .attr('selected', '')
            .attr('disabled', '')
            .attr('hidden', '')
            .text('Choose a movie')
        moviesDropdown
        .on('change', function() {
            onSelectMovie(this.value);
        })
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
        var rowLabelWidth = 60;
        var columnLabelHeight = 70;
        var topMargin = 20;
        var leftMargin = 30;
        var rightMargin = 0;
        var bottomMargin = 0;

        var columnWidth = Math.floor((svgWidth - rowLabelWidth - rightMargin) / genresOfInterest.length);
        var rowHeight = Math.floor((svgHeight - columnLabelHeight - bottomMargin) / themesOfInterest.length);
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
            .attr('width', columnWidth)
            .attr('height', svgHeight)
            .attr('transform', function(d, i) {
                var tx = rowLabelWidth + i * columnWidth;
                return 'translate('+[tx, topMargin]+')';
            })
        genreG.on('click', function() {
                var d3_label = d3.select(this)
                var genre = this.id;
                if(d3_label.classed('genre-selected')){
                    d3_label.classed('genre-selected', false);
                    onGenreChanged("All");
                    svg.selectAll('.genre').selectAll('.theme')
                        .classed('hidden', false);
                    svg.selectAll('.genre').selectAll('text.genre-label')
                        .classed('hidden', false);
                }
                else {
                    d3.select('.genre-selected').classed('genre-selected', false);
                    d3_label.classed('genre-selected', true);
                    onGenreChanged(this.id);
                    svg.selectAll('.genre').selectAll('.theme')
                        .classed('hidden', function(d) {
                            return d.genre != genre;
                        })

                    svg.selectAll('.genre').selectAll('text.genre-label')
                        .classed('hidden', function(d) {
                            return d != genre;
                        })

                }
        })
        var tableTextSize = 18;
        genreG
            .append('text')
            .text(function(d) {
                return capitalizeFirstLetter(d);
            })
            .attr('class', 'genre-label')
            .attr('transform', function(d) {
                return 'translate(' + [10, svgHeight - topMargin] + '), rotate(330)'
            })
            .style('fill', 'black')
            .style('font-size', tableTextSize)
            .style('font-family', 'Open Sans')

        var themeLabelG = svg.selectAll('.theme-label')
            .data(Array.from(themesOfInterest), function(d) {
                return d;
            })
            .enter()
            .append('g')
            .attr('class', 'theme-label')
            .attr('id', function(d) {
                return d;
            })
            .attr('width', columnWidth)
            .attr('height', rowHeight)
            .attr('transform', function(d, i) {
                return 'translate('+[leftMargin, topMargin + rowHeight / 2 + tableTextSize / 2 + i * rowHeight]+')';
            })
        themeLabelG
            .append('text')
            .text(function(d) {
                return capitalizeFirstLetter(d);
            })
            .style('text-anchor', 'middle')
            .style('fill', 'black')
            .style('font-size', tableTextSize)
            .style('font-family', 'Open Sans')


        // var themeColorScale = d3.scaleOrdinal(d3.schemeCategory20);
        var themesGenreScores = themeScoresByGenre(moviesData)
        var maxThemeScore = d3.max(themesGenreScores, function(d) {
            return d3.max(Object.values(d.value.themes));
        });
        var minThemeScore = d3.min(themesGenreScores, function(d) {
            return d3.min(Object.values(d.value.themes))
        });
        var allDecades = Array.from(new Set(moviesData.map(decadeForRow)));
        allDecades.sort();
        populateDecadeDropdown(moviesData, allDecades);
        allDecades.forEach(function(d) {
            var decadeThemeScores = themeScoresByGenre(filterMoviesByDecade(moviesData, d))
            var decadeMax = d3.max(decadeThemeScores, function(d) {
                return d3.max(Object.values(d.value.themes));
            });
            maxThemeScore = Math.max(maxThemeScore, decadeMax);
            var decadeMin = d3.min(decadeThemeScores, function(d) {
                return d3.min(Object.values(d.value.themes));
            });
            minThemeScore = Math.min(minThemeScore, decadeMin)
        })
        var radiusScale = d3.scaleSqrt()
                .domain([minThemeScore, maxThemeScore])
                .range([3, 20])
        var buckets = 9;
        var colours = ["#ffffd9","#edf8b1","#c7e9b4","#7fcdbb","#41b6c4","#1d91c0","#225ea8","#253494","#081d58"]
        var themeColorScale = d3.scaleQuantile()
              .domain([minThemeScore, buckets - 1, maxThemeScore])
              .range(colours);
        createBubbleChart = function(filteredScores) {
            var radiusScale = d3.scaleSqrt()
                .domain([minThemeScore, maxThemeScore])
                .range([1, 20])
            var heightScale = d3.scaleSqrt()
                .domain([minThemeScore, maxThemeScore])
                .range([1, 20])
            var genreG = svg
                .selectAll('.genre')
                .data(filteredScores);
            var themesG = genreG.selectAll('.theme')
                .data(function(d) {
                    var data = d3.entries(d.value.themes);
                    data.forEach(function(row) {
                        row['genre'] = d.key;
                    })
                    return data
                });
            var textWidth = 25;
            var textShiftX = 25;
            var textShiftY = 8;
            var themesGEnter = themesG.enter()
                .append('g')
                .attr('class', 'theme')
                .attr('transform', function(d, i) {
                    var ty = topMargin + i * rowHeight;
                    return 'translate('+ [0, ty] + ')';
                })
            themesGEnter.append('rect')
                .attr('transform', function(d) {
                    return 'translate(' + [0, -tableTextSize] + ')'
                })
                .attr('height', function(d) {
                    return rowHeight;
                })
                .attr('width', function(d) {
                    return columnWidth;
                })

            var labelSize = 10;
            themesGEnter.append('text')
                .text('')
                .style('text-anchor', 'middle')
                .style('fill', 'white')
                .style('font-size', labelSize)
                .style('font-family', 'Open Sans')
                .attr('transform', function(d, i) {
                    return 'translate('+ [columnWidth / 2, rowHeight / 2 - tableTextSize] + ')';
                })

            // Propagates data to child
            themesG.select('rect')

            d3.selectAll('.genre')
                .selectAll('.theme rect')
                .transition()
                .duration(750)
                .attr('fill', function(d) {
                    return themeColorScale(d.value);
                })
            d3.selectAll('.genre')
                .selectAll('.theme text')
                .transition()
                .duration(750)
                .text(function(d) {
                    return d.value.toFixed(2);
                })

        };
        createBubbleChart(themesGenreScores);

        onDecadeChanged = function(decade) {
            if(decade == 'All')
                createBubbleChart(themesGenreScores)
            else
                createBubbleChart(themeScoresByGenre(filterMoviesByDecade(moviesData, decade)))
        }

    });
})();
