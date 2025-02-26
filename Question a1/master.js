d3.text("../insertion_master.txt", function(error, rawData) {
    if (error) throw error;

    var lines = rawData.split("\n").slice(1); // Ignorer l'en-tête
    var data = [];

    lines.forEach(line => {
        var cols = line.trim().split(/\s{2,}/); // Sépare les espaces multiples

        if (cols.length < 10) return; // Ignore lignes incomplètes

        // Trouver l'index de la colonne "SITUATION"
        var situationIndex = cols.findIndex(c => c.includes("mois après le diplôme"));
        if (situationIndex === -1) return; // Si non trouvé, ignorer la ligne

        var situation = cols[situationIndex]; // "18 mois après le diplôme" ou "30 mois après le diplôme"
        var tauxInsertion = parseFloat(cols[situationIndex + 3]) || 0; // Taux d'insertion après situation

        // Discipline = tout ce qui est AVANT la colonne "SITUATION" après "ACADEMIE"
        var discipline = cols.slice(3, situationIndex).join(" ").trim();

        data.push({
            discipline: discipline,
            situation: situation,
            tauxInsertion: tauxInsertion
        });
    });

    var data18M = data.filter(d => d.situation.includes("18 mois"));
    var data30M = data.filter(d => d.situation.includes("30 mois"));

    var margin = {top: 20, right: 20, bottom: 100, left: 60},
        width = 800 - margin.left - margin.right,
        height = 500 - margin.top - margin.bottom;

    function createChart(data, selector, color) {
        if (data.length === 0) {
            return;
        }

        var svg = d3.select(selector)
            .append("g")
            .attr("transform", `translate(${margin.left},${margin.top})`);

        var xScale = d3.scaleBand()
            .domain(data.map(d => d.discipline))
            .range([0, width])
            .padding(0.2);

        var yScale = d3.scaleLinear()
            .domain([0, d3.max(data, d => d.tauxInsertion)])
            .nice()
            .range([height, 0]);

        svg.append("g")
            .attr("transform", `translate(0, ${height})`)
            .call(d3.axisBottom(xScale))
            .selectAll("text")
            .attr("text-anchor", "end")
            .attr("transform", "rotate(-45)")
            .style("font-size", "12px");

        svg.append("g")
            .call(d3.axisLeft(yScale));

        svg.selectAll(".bar")
            .data(data)
            .enter()
            .append("rect")
            .attr("class", "bar")
            .attr("x", d => xScale(d.discipline))
            .attr("width", xScale.bandwidth())
            .attr("y", d => yScale(d.tauxInsertion))
            .attr("height", d => height - yScale(d.tauxInsertion))
            .attr("fill", color);
    }

    // Titre graphe 1
    d3.select('#svg1').append('text')
        .attr('class', 'title')
        .attr('x', width / 2)
        .attr('y', margin.top)
        .attr('text-anchor', 'middle')
        .text("Taux d'insertion après 18 mois");

    // Titre graphe 2
    d3.select('#svg2').append('text')
        .attr('class', 'title')
        .attr('x', width / 2)
        .attr('y', margin.top)
        .attr('text-anchor', 'middle')
        .text("Taux d'insertion après 30 mois");

    // Ajout du label de l'axe des abscisses
    d3.selectAll('svg').append("text")
        .attr("transform", `translate(${width+100}, ${height+margin.top+50})`)
        .style("text-anchor", "end")
        .text("Discipline");

    // Ajout du label de l'axe des ordonnées
    d3.selectAll('svg').append("text")
        .attr("transform", "rotate(-90)")
        .attr("y", 15)
        .attr("x", -margin.top)
        .style("text-anchor", "end")
        .text("Taux d'insertion");

    createChart(data18M, "#svg1", "blue");
    createChart(data30M, "#svg2", "red");
});
