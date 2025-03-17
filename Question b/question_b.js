// Chargement des données et création du nuage de points interactif

d3.text("../insertion_master.txt", function(error, rawData) {
    if (error) throw error;

    var lines = rawData.split("\n").slice(1); // Ignorer l'en-tête
    var data = [];

    lines.forEach(line => {
        var match = line.trim().match(/^(\d{4})\s+(.+?)\s{2,}(.+)$/);

        if (match) {
            const annee = match[1];  // Année (ex: 2010)
            const etablissement = match[2]; // Établissement (ex: "Mulhouse - Haute Alsace")
            let reste = match[3]; // Le reste des colonnes

            let resteCols = reste.split(/\s{2,}/);
            let cols = [annee, etablissement, ...resteCols];
            while (cols.length < 20) cols.push('');

            data.push({
                discipline: cols[4],
                tauxReponse: parseFloat(cols[8]) || 0,
                tauxInsertion: cols[9] === "ns" ? null : parseFloat(cols[9]),
                emploiCadre: parseInt(cols[14]) || 0,
                emploiStable: parseInt(cols[11]) || 0,
                emploiTempsPlein: parseInt(cols[12]) || 0,
                femmes: parseInt(cols[20]) || 0,
                hommes: (parseInt(cols[6]) || 0) - (parseInt(cols[20]) || 0),
                totalReponses: parseInt(cols[6]) || 1
            });
        }
    });

    console.log("Données extraites :", data);

    // Définition des dimensions du SVG avec padding
    var padding = 20;
    var width = window.innerWidth - padding * 2;
    var height = window.innerHeight - padding * 2;

    var svg = d3.select("#chart").append("svg")
        .attr("width", width + padding * 2)
        .attr("height", height + padding * 2)
        .append("g")
        .attr("transform", `translate(${padding},${padding})`);

    var colorScale = d3.scaleOrdinal(d3.schemeCategory10);

    // Définition d'une échelle pour ajuster la taille des cercles
    var maxEmployment = d3.max(data, d => d.emploiCadre + d.emploiStable);
    var radiusScale = d3.scaleSqrt()
        .domain([0, maxEmployment])
        .range([2, 20]); // Taille des cercles ajustée

    // Fonction pour générer des positions avec padding
    function getRandomPosition(max) {
        return Math.random() * (max - padding * 2) + padding;
    }

    // Ajout des cercles pour les hommes
    svg.selectAll(".homme")
        .data(data.filter(d => d.tauxInsertion !== null && d.hommes > 0))
        .enter().append("circle")
        .attr("cx", () => getRandomPosition(width))
        .attr("cy", () => getRandomPosition(height))
        .attr("r", d => radiusScale(d.emploiCadre + d.emploiStable))
        .attr("fill", d => colorScale(d.discipline))
        .attr("stroke", "blue")
        .attr("stroke-width", 2)
        .attr("opacity", 0.7)
        .on("mouseover", function(d) {
            d3.select(".tooltip")
                .style("opacity", 1)
                .html(`${d.discipline}<br/>Taux de réponse: ${d.tauxReponse}%<br/>Taux d'insertion: ${d.tauxInsertion}%<br/>Sexe: Hommes`)
                .style("left", `${d3.event.pageX + 10}px`)
                .style("top", `${d3.event.pageY - 20}px`);
        })
        .on("mouseout", function() {
            d3.select(".tooltip").style("opacity", 0);
        });

    // Ajout des cercles pour les femmes
    svg.selectAll(".femme")
        .data(data.filter(d => d.tauxInsertion !== null && d.femmes > 0))
        .enter().append("circle")
        .attr("cx", () => getRandomPosition(width))
        .attr("cy", () => getRandomPosition(height))
        .attr("r", d => radiusScale(d.emploiCadre + d.emploiStable))
        .attr("fill", d => colorScale(d.discipline))
        .attr("stroke", "pink")
        .attr("stroke-width", 2)
        .attr("opacity", 0.7)
        .on("mouseover", function(d) {
            d3.select(".tooltip")
                .style("opacity", 1)
                .html(`${d.discipline}<br/>Taux de réponse: ${d.tauxReponse}%<br/>Taux d'insertion: ${d.tauxInsertion}%<br/>Sexe: Femmes`)
                .style("left", `${d3.event.pageX + 10}px`)
                .style("top", `${d3.event.pageY - 20}px`);
        })
        .on("mouseout", function() {
            d3.select(".tooltip").style("opacity", 0);
        });

    // Ajuster la taille du SVG en cas de redimensionnement de la fenêtre
    window.addEventListener("resize", function() {
        width = window.innerWidth - padding * 2;
        height = window.innerHeight - padding * 2;
        svg.attr("width", width + padding * 2).attr("height", height + padding * 2);
    });
});
