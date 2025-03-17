// Chargement des données et création du graphique

d3.text("../insertion_master.txt", function(error, rawData) {
    if (error) throw error;

    var lines = rawData.split("\n").slice(1); // Ignorer l'en-tête
    var data = [];

    lines.forEach(line => {
        var match = line.trim().match(/^(\d{4})\s+(.+?)\s{2,}(.+)$/);

        if (match) {
            const annee = match[1];
            const etablissement = match[2];
            let reste = match[3];

            let resteCols = reste.split(/\s{2,}/);

            let nouvellesColonnes = [];
            resteCols.forEach((col, index) => {
                if (index >= 2) {
                    if (col.includes(" ") && /\d \d/.test(col)) {
                        nouvellesColonnes.push(...col.split(/\s+/));
                    }
                    else if (col.match(/^\d+\s+ns$/)) {
                        nouvellesColonnes.push(...col.split(/\s+/));
                    }
                    else {
                        nouvellesColonnes.push(col);
                    }
                } else {
                    nouvellesColonnes.push(col);
                }
            });

            let cols = [annee, etablissement, ...nouvellesColonnes];
            while (cols.length < 20) cols.push('');

            const totalPersonnes = parseInt(cols[6]) || 0;
            const femmes = parseInt(cols[20]) || 0;
            const hommes = totalPersonnes - femmes;

            const tauxInsertionTotal = cols[9] === "ns" ? "ns" : parseFloat(cols[9]);
            const tauxInsertionFemmes = tauxInsertionTotal === "ns" || (femmes + hommes === 0) ? "ns" : (tauxInsertionTotal * femmes) / (femmes + hommes);
            const tauxInsertionHommes = tauxInsertionTotal === "ns" || (femmes + hommes === 0) ? "ns" : (tauxInsertionTotal * hommes) / (femmes + hommes);

            data.push({
                annee: cols[0],
                etablissement: cols[1],
                academie: cols[2],
                domaine: cols[3],
                discipline: cols[4],
                situation: cols[5],
                tauxInsertionFemmes: tauxInsertionFemmes,
                tauxInsertionHommes: tauxInsertionHommes,
                femmes: femmes,
                hommes: hommes
            });
        }
    });

    console.log("Données extraites :", data);

    var etablissements = [...new Set(data.map(d => d.etablissement))];
    var disciplines = [...new Set(data.map(d => d.discipline))];
    var sexes = ["Femmes", "Hommes"];

    d3.select("#selectEtablissement").selectAll("option").data(etablissements).enter().append("option").text(d => d);
    d3.select("#selectDiscipline").selectAll("option").data(disciplines).enter().append("option").text(d => d);
    d3.select("#selectSexe").selectAll("option").data(sexes).enter().append("option").text(d => d);

    function updateChart() {
        var selectedEtab = d3.select("#selectEtablissement").node().value;
        var selectedDisc = d3.select("#selectDiscipline").node().value;
        var selectedSexe = d3.select("#selectSexe").node().value;

        var filteredData = data.filter(d => d.etablissement === selectedEtab && d.discipline === selectedDisc);

        if (filteredData.length === 0) {
            console.warn("⚠️ Aucune donnée trouvée pour cette sélection !");
            return;
        }

        var svg = d3.select("#svgSexe");
        svg.selectAll("*").remove();

        var margin = {top: 20, right: 20, bottom: 100, left: 60},
            width = 800 - margin.left - margin.right,
            height = 500 - margin.top - margin.bottom;

        var g = svg.append("g").attr("transform", `translate(${margin.left},${margin.top})`);

        var xScale = d3.scaleBand()
            .domain(filteredData.map(d => d.annee))
            .range([0, width])
            .padding(0.2);

        var yScale = d3.scaleLinear()
            .domain([0, 100])
            .nice()
            .range([height, 0]);

        g.append("g")
            .attr("transform", `translate(0, ${height})`)
            .call(d3.axisBottom(xScale));

        g.append("g")
            .call(d3.axisLeft(yScale));

        g.selectAll(".bar")
            .data(filteredData.filter(d => {
                return selectedSexe === "Femmes" ? d.tauxInsertionFemmes !== "ns" : d.tauxInsertionHommes !== "ns";
            }))
            .enter().append("rect")
            .attr("class", "bar")
            .attr("x", d => xScale(d.annee))
            .attr("y", d => yScale(selectedSexe === "Femmes" ? d.tauxInsertionFemmes : d.tauxInsertionHommes))
            .attr("height", d => height - yScale(selectedSexe === "Femmes" ? d.tauxInsertionFemmes : d.tauxInsertionHommes))
            .attr("width", xScale.bandwidth())
            .attr("fill", selectedSexe === "Femmes" ? "pink" : "blue");

        g.selectAll(".text")
            .data(filteredData.filter(d => {
                return selectedSexe === "Femmes" ? d.tauxInsertionFemmes === "ns" : d.tauxInsertionHommes === "ns";
            }))
            .enter().append("text")
            .attr("x", d => xScale(d.annee) + xScale.bandwidth() / 2)
            .attr("y", height / 2)
            .attr("text-anchor", "middle")
            .style("fill", "red")
            .style("font-size", "12px")
            .text("Taux non renseigné");
    }

    d3.select("#selectEtablissement").on("change", updateChart);
    d3.select("#selectDiscipline").on("change", updateChart);
    d3.select("#selectSexe").on("change", updateChart);

    updateChart();
});