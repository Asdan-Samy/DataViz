const DATA_URL = './data.csv';

let selectedYear = 2012;
let activeFilter = 'schools';

d3.csv(DATA_URL).then(data => {
    data.forEach(d => {
        d.world_rank = +d.world_rank;
        d.score = +d.score;
        d.year = +d.year;
    });

    let filteredData = data.filter(d => d.year === selectedYear).slice(0, 20);

    const svgWidth = 900;
    const svgHeight = 600;
    const margin = { top: 20, right: 30, bottom: 100, left: 50 };
    let width = svgWidth - margin.left - margin.right;
    const height = svgHeight - margin.top - margin.bottom;

    const svg = d3.select('#chart')
        .append('svg')
        .attr('width', svgWidth)
        .attr('height', svgHeight)
        .append('g')
        .attr('transform', `translate(${margin.left}, ${margin.top})`);

    const x = d3.scaleBand().range([0, width]).padding(0.4);
    const y = d3.scaleLinear().range([height, 0]);

    const xAxisGroup = svg.append('g').attr('transform', `translate(0, ${height})`);
    const yAxisGroup = svg.append('g');

    function update(data) {
        width = Math.max(svgWidth - margin.left - margin.right, data.length * 50);
        x.range([0, width]);
        svg.select('svg').attr('width', width + margin.left + margin.right);

        x.domain(data.map(d => d.institution));
        y.domain([0, d3.max(data, d => d.score)]);

        xAxisGroup.transition().duration(1000)
            .call(d3.axisBottom(x))
            .selectAll("text")
            .attr("transform", "rotate(-45)")
            .style("text-anchor", "end");

        yAxisGroup.transition().duration(1000).call(d3.axisLeft(y));

        const bars = svg.selectAll('.bar').data(data);

        bars.enter()
            .append('rect')
            .attr('class', 'bar')
            .attr('x', d => x(d.institution))
            .attr('y', height)
            .attr('width', x.bandwidth())
            .attr('height', 0)
            .attr('fill', (d, i) => d3.interpolateCool(i / data.length))
            .merge(bars)
            .on('click', function (event, d) {
                showDetails(d);
            })
            .on('mouseover', function () {
                d3.select(this)
                    .transition()
                    .duration(200)
                    .attr('fill', 'orange');
            })
            .on('mouseout', function (event, d, i) {
                d3.select(this)
                    .transition()
                    .duration(200)
                    .attr('fill', (d, i) => d3.interpolateCool(i / data.length));
            })
            .transition()
            .duration(1000)
            .ease(d3.easeCubicOut)
            .attr('x', d => x(d.institution))
            .attr('y', d => y(d.score))
            .attr('width', x.bandwidth())
            .attr('height', d => height - y(d.score));

        bars.exit().transition().duration(500).attr('y', height).attr('height', 0).remove();
    }

    function showDetails(d) {
        const modal = d3.select('#modal');
        const modalDetails = d3.select('#modal-details');

        modal.style('display', 'flex'); // Afficher la modale
        modalDetails.html(`
            <h3>Détails</h3>
            <p><strong>Nom:</strong> ${d.institution}</p>
            <p><strong>Pays:</strong> ${d.country}</p>
            <p><strong>Score:</strong> ${d.score}</p>
            <p><strong>Classement mondial:</strong> ${d.world_rank}</p>
            <p><strong>Année:</strong> ${d.year}</p>
        `);
    }

    function closeModal() {
        d3.select('#modal').style('display', 'none'); // Cacher la modale
    }

    // Attachez l'événement au bouton de fermeture
    d3.select('#close-btn').on('click', closeModal);

    // Fermer en cliquant en dehors de la fenêtre modale
    d3.select('#modal').on('click', function (event) {
        if (event.target.id === 'modal') {
            closeModal();
        }
    });


    d3.select('#filter-schools').on('click', () => {
        activeFilter = 'schools';
        filteredData = data.filter(d => d.year === selectedYear).slice(0, 20);
        update(filteredData);
    });

    d3.select('#filter-best-per-year').on('click', () => {
        const bestSchools = d3.rollups(
            data,
            v => v.reduce((a, b) => (a.score > b.score ? a : b)),
            d => d.year
        );

        const formattedData = bestSchools.map(([year, best]) => ({
            institution: `${best.institution} (${year})`,
            score: best.score,
            world_rank: best.world_rank,
            country: best.country,
            year: year
        }));

        update(formattedData);
    });

    d3.select('#year-select').on('change', function () {
        selectedYear = +this.value;
        activeFilter === 'schools' ? update(data.filter(d => d.year === selectedYear).slice(0, 20)) : d3.select('#filter-best-per-year').node().click();
    });

    update(filteredData);
});
