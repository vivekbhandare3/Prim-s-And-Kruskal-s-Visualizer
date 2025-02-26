const inputCanvas = document.getElementById('inputGraphCanvas');
        const resultCanvas = document.getElementById('resultGraphCanvas');

        const inputCtx = inputCanvas.getContext('2d');
        const resultCtx = resultCanvas.getContext('2d');

        inputCanvas.width = 400;
        inputCanvas.height = 500;
        resultCanvas.width = 400;
        resultCanvas.height = 500;

        const NODE_RADIUS = 20;
        const nodes = [];
        const edges = [];

        // Helper Functions
        function createEdgeGradient(x1, y1, x2, y2, context) {
            const gradient = context.createLinearGradient(x1, y1, x2, y2);
            gradient.addColorStop(0, '#00C6FF');
            gradient.addColorStop(1, '#0072FF');
            return gradient;
        }

        function drawNode(node, index, context) {
            context.beginPath();
            context.arc(node.x, node.y, NODE_RADIUS, 0, Math.PI * 2);
            context.fillStyle = '#5BC9B1';
            context.fill();
            context.strokeStyle = '#000';
            context.stroke();

            context.fillStyle = '#000';
            context.font = 'bold 14px Inter';
            context.fillText(index, node.x - 5, node.y + 5);
        }

        function drawEdge(edge, context) {
            const { fromNode, toNode, weight } = edge;
            context.beginPath();
            context.moveTo(fromNode.x, fromNode.y);
            context.lineTo(toNode.x, toNode.y);

            const gradient = createEdgeGradient(fromNode.x, fromNode.y, toNode.x, toNode.y, context);
            context.strokeStyle = gradient;
            context.lineWidth = 2;
            context.stroke();

            const midX = (fromNode.x + toNode.x) / 2;
            const midY = (fromNode.y + toNode.y) / 2;
            context.fillStyle = '#000';
            context.font = 'bold 14px Inter';
            context.fillText(weight, midX + 5, midY - 5);
        }

        function redrawGraph(context, edges, nodes) {
            // Clear the canvas
            context.clearRect(0, 0, context.canvas.width, context.canvas.height);
        
            // Draw edges and nodes
            edges.forEach(edge => drawEdge(edge, context));
            nodes.forEach((node, index) => drawNode(node, index, context));
        }
        

        // Update Node Options in Dropdown
        function updateNodeSelectOptions() {
            const fromNodeSelect = document.getElementById('fromNode');
            const toNodeSelect = document.getElementById('toNode');

            fromNodeSelect.innerHTML = '';
            toNodeSelect.innerHTML = '';

            nodes.forEach((_, index) => {
                const optionFrom = document.createElement('option');
                optionFrom.value = index;
                optionFrom.textContent = `Node ${index}`;
                fromNodeSelect.appendChild(optionFrom);

                const optionTo = document.createElement('option');
                optionTo.value = index;
                optionTo.textContent = `Node ${index}`;
                toNodeSelect.appendChild(optionTo);
            });
        }

        // Clear Results
        function clearResults() {
            const resultsTableBody = document.querySelector('#resultsTable tbody');
            resultsTableBody.innerHTML = '';
        }

        // Prim's Algorithm
        function primsAlgorithm() {
            const mst = [];
            const visited = new Set();
            const edgesToVisit = [];
            let totalCost = 0; // Variable to track the total cost

            visited.add(0); // Start with the first node
            const startNode = nodes[0];

            // Add edges connected to the start node
            edges.forEach(edge => {
                if (edge.fromNode === startNode || edge.toNode === startNode) {
                    edgesToVisit.push(edge);
                }
            });

            while (visited.size < nodes.length && edgesToVisit.length > 0) {
                edgesToVisit.sort((a, b) => a.weight - b.weight); // Sort by weight
                const edge = edgesToVisit.shift(); // Get the smallest edge

                const fromIndex = nodes.indexOf(edge.fromNode);
                const toIndex = nodes.indexOf(edge.toNode);

                if (!visited.has(fromIndex) || !visited.has(toIndex)) {
                    mst.push(edge);
                    totalCost += edge.weight; // Add weight to total cost
                    //checks if at least one node of the edge has not yet been visited
                    const nextNode = visited.has(fromIndex) ? edge.toNode : edge.fromNode;
                    visited.add(nodes.indexOf(nextNode));

                    // Add new edges from the newly visited node
                    edges.forEach(e => {
                        if ((e.fromNode === nextNode && !visited.has(nodes.indexOf(e.toNode))) ||
                            (e.toNode === nextNode && !visited.has(nodes.indexOf(e.fromNode)))) {
                            edgesToVisit.push(e);
                        }
                    });
                }
            }

            // Return the MST and the total cost
            return { mst, totalCost };
        }

        // Kruskal's Algorithm
        function kruskalsAlgorithm() {
            const parent = [];
            const rank = [];
            const result = [];

            edges.sort((a, b) => a.weight - b.weight);

            function find(i) {
                if (parent[i] === undefined) return i;
                return find(parent[i]);
            }

            function union(u, v) {
                if (rank[u] > rank[v]) {
                    parent[v] = u;
                } else if (rank[u] < rank[v]) {
                    parent[u] = v;
                } else {
                    parent[v] = u;
                    rank[u]++;
                }
            }

            edges.forEach(edge => {
                const u = nodes.indexOf(edge.fromNode);
                const v = nodes.indexOf(edge.toNode);

                const setU = find(u);
                const setV = find(v);

                if (setU !== setV) {
                    result.push(edge);
                    union(setU, setV);
                }
            });

            let totalCost = result.reduce((sum, edge) => sum + edge.weight, 0);
            return { mst: result, totalCost };
        }

        // Event Listeners
        document.getElementById('addNodeBtn').addEventListener('click', () => {
            const newNode = {
                x: Math.random() * inputCanvas.width,
                y: Math.random() * inputCanvas.height
            };
            nodes.push(newNode);
            updateNodeSelectOptions();
            redrawGraph(inputCtx, edges, nodes);
        });

        document.getElementById('addEdgeForm').addEventListener('submit', (e) => {
            e.preventDefault();
            const fromNodeIndex = parseInt(document.getElementById('fromNode').value);
            const toNodeIndex = parseInt(document.getElementById('toNode').value);
            const edgeWeight = parseInt(document.getElementById('edgeWeight').value);

            if (fromNodeIndex !== toNodeIndex) {
                const fromNode = nodes[fromNodeIndex];
                const toNode = nodes[toNodeIndex];
                edges.push({ fromNode, toNode, weight: edgeWeight });
                redrawGraph(inputCtx, edges, nodes);
            }
        });

        document.getElementById('runAlgorithmBtn').addEventListener('click', () => {
            const algorithm = document.title.includes("Prim") ? primsAlgorithm : kruskalsAlgorithm;
            const { mst, totalCost } = algorithm(); // Destructure the result to get MST and total cost

            clearResults();
            redrawGraph(resultCtx, mst, nodes);

            const resultsTableBody = document.querySelector('#resultsTable tbody');
            mst.forEach(({ fromNode, toNode, weight }) => {
                const row = document.createElement('tr');

                const path = `${nodes.indexOf(fromNode)} -> ${nodes.indexOf(toNode)}`;

                const nodeCell = document.createElement('td');
                nodeCell.textContent = `${nodes.indexOf(fromNode)}-${nodes.indexOf(toNode)}`;
                const distanceCell = document.createElement('td');
                distanceCell.textContent = weight;
                const pathCell = document.createElement('td');
                pathCell.textContent = path;

                row.appendChild(nodeCell);
                row.appendChild(distanceCell);
                row.appendChild(pathCell);
                resultsTableBody.appendChild(row);
            });

            // Add a row for the total cost
            const totalCostRow = document.createElement('tr');
            totalCostRow.innerHTML = `
                <td colspan="2" style="text-align: right; font-weight: bold;">Total Cost:</td>
                <td style="font-weight: bold;">${totalCost}</td>
            `;
            resultsTableBody.appendChild(totalCostRow);
        });

        document.getElementById('resetBtn').addEventListener('click', () => {
            // Clear nodes and edges arrays
            nodes.length = 0;
            edges.length = 0;
        
            // Clear the results table
            clearResults();
        
            // Update the dropdown options (which will be empty)
            updateNodeSelectOptions();
        
            // Clear the canvas and redraw
            inputCtx.clearRect(0, 0, inputCanvas.width, inputCanvas.height); // Clear input canvas
            resultCtx.clearRect(0, 0, resultCanvas.width, resultCanvas.height); // Clear result canvas
        
            // Redraw the empty graph on the input canvas
            redrawGraph(inputCtx, edges, nodes);
        });
        
        
        // Optional JavaScript function for navigation
function navigateTo(page) {
    window.location.href = page; // Navigate to the specified page
}
