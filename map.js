class ListNode {
    constructor(v, w) {
        this.vertex = v;
        this.weight = w;
        this.next = null;
    }
}

class MinHeapNode {
    constructor(v, f) {
        this.vertex = v;
        this.cost = f;
    }
}

class MinHeap {
    constructor() {
        this.heap = [];
    }

    parent(i) {
        return Math.floor((i - 1) / 2);
    }

    left(i) {
        return 2 * i + 1;
    }

    right(i) {
        return 2 * i + 2;
    }

    insert(node) {
        this.heap.push(node);
        let i = this.heap.length - 1;

        while (
            i > 0 &&
            this.heap[this.parent(i)].cost > this.heap[i].cost
        ) {
            let p = this.parent(i);

            [this.heap[i], this.heap[p]] =
                [this.heap[p], this.heap[i]];

            i = p;
        }
    }

    heapify(i) {
        let smallest = i;
        const l = this.left(i);
        const r = this.right(i);

        if (
            l < this.heap.length &&
            this.heap[l].cost < this.heap[smallest].cost
        ) {
            smallest = l;
        }

        if (
            r < this.heap.length &&
            this.heap[r].cost < this.heap[smallest].cost
        ) {
            smallest = r;
        }

        if (smallest !== i) {
            [this.heap[i], this.heap[smallest]] =
                [this.heap[smallest], this.heap[i]];

            this.heapify(smallest);
        }
    }

    extractMin() {
        if (this.isEmpty()) return null;

        const root = this.heap[0];
        const last = this.heap.pop();

        if (this.heap.length > 0) {
            this.heap[0] = last;
            this.heapify(0);
        }

        return root;
    }

    isEmpty() {
        return this.heap.length === 0;
    }
}

class Graph {
    constructor(n) {
        this.numNodes = n;
        this.adjList = new Array(n).fill(null);
    }

    addEdge(u, v, weight) {
        let newNode = new ListNode(v, weight);
        newNode.next = this.adjList[u];
        this.adjList[u] = newNode;

        newNode = new ListNode(u, weight);
        newNode.next = this.adjList[v];
        this.adjList[v] = newNode;
    }

    printGraph() {
        for (let i = 0; i < this.numNodes; i++) {
            console.log(`Node ${i}:`);

            let temp = this.adjList[i];

            while (temp !== null) {
                console.log(
                    `(${temp.vertex}, ${temp.weight}) ->`
                );
                temp = temp.next;
            }

            console.log("null\n");
        }
    }
}

// Node IDs are labels, not map coordinates. A zero heuristic keeps A*
// admissible and makes this a Dijkstra shortest-path search.
const heuristic = () => 0;

function printPath(parent, i) {
    if (i === -1) return [];

    return [...printPath(parent, parent[i]), i];
}

function aStar(graph, src, target) {
    const numNodes = graph.numNodes;

    const g = new Array(numNodes).fill(Infinity);
    const f = new Array(numNodes).fill(Infinity);
    const parent = new Array(numNodes).fill(-1);

    const minHeap = new MinHeap();

    g[src] = 0;
    f[src] = heuristic(src, target);

    minHeap.insert(new MinHeapNode(src, f[src]));

    while (!minHeap.isEmpty()) {
        const current = minHeap.extractMin();
        const u = current.vertex;

        // Ignore outdated heap entries
        if (current.cost > f[u]) {
            continue;
        }

        if (u === target) {
            console.log(
                "Shortest path distance:",
                g[u]
            );

            const path = printPath(parent, u);
            console.log("Path:", path.join(" -> "));

            return { distance: g[u], path };
        }

        let neighbor = graph.adjList[u];

        while (neighbor !== null) {
            const v = neighbor.vertex;
            const weight = neighbor.weight;

            const tentativeG = g[u] + weight;

            if (tentativeG < g[v]) {
                g[v] = tentativeG;
                f[v] = g[v] + heuristic(v, target);
                parent[v] = u;

                minHeap.insert(
                    new MinHeapNode(v, f[v])
                );
            }

            neighbor = neighbor.next;
        }
    }

    console.log("No path found from source to target.");
    return null;
}

// Draw the calculated path over the campus map using the numbered map nodes.
// The numeric label on each map point is the same ID used by the graph.
function drawRouteOnMap(path) {
    const roadLayer = document.getElementById("road-layer");
    if (!roadLayer || typeof MAP_DATA === "undefined") {
        console.warn("Campus map layer or MAP_DATA was not found.");
        return;
    }

    // Remove the previous route before drawing a new one.
    roadLayer.querySelectorAll(".active-route, .active-route-glow, .route-marker")
        .forEach(el => el.remove());

    if (!Array.isArray(path) || path.length < 2) return;

    const pointById = new Map();
    MAP_DATA.vertices.forEach(item => {
        const label = String(item.label).trim();
        if (/^\d+$/.test(label)) {
            pointById.set(Number(label), {
                x: item.x + item.w / 2,
                y: item.y + item.h / 2
            });
        }
    });

    const routePoints = path.map(id => pointById.get(Number(id)));
    const missing = path.filter((id, i) => !routePoints[i]);

    if (missing.length) {
        console.error("No map coordinate found for route node(s):", missing);
        return;
    }

    const svgNS = "http://www.w3.org/2000/svg";
    const pointsString = routePoints.map(p => `${p.x},${p.y}`).join(" ");

    // Soft white outline keeps the light-green route visible over roads/buildings.
    const glow = document.createElementNS(svgNS, "polyline");
    glow.setAttribute("points", pointsString);
    glow.setAttribute("class", "active-route-glow");
    glow.setAttribute("fill", "none");
    glow.setAttribute("stroke", "#ffffff");
    glow.setAttribute("stroke-width", "11");
    glow.setAttribute("stroke-linecap", "round");
    glow.setAttribute("stroke-linejoin", "round");
    glow.setAttribute("opacity", "0.9");
    roadLayer.appendChild(glow);

    const routeLine = document.createElementNS(svgNS, "polyline");
    routeLine.setAttribute("points", pointsString);
    routeLine.setAttribute("class", "active-route");
    routeLine.setAttribute("fill", "none");
    routeLine.setAttribute("stroke", "#90EE90");
    routeLine.setAttribute("stroke-width", "7");
    routeLine.setAttribute("stroke-linecap", "round");
    routeLine.setAttribute("stroke-linejoin", "round");
    routeLine.setAttribute("opacity", "0.95");
    roadLayer.appendChild(routeLine);

    // Mark the beginning and destination of the route.
    [0, routePoints.length - 1].forEach((index, markerIndex) => {
        const p = routePoints[index];
        const marker = document.createElementNS(svgNS, "circle");
        marker.setAttribute("class", "route-marker");
        marker.setAttribute("cx", p.x);
        marker.setAttribute("cy", p.y);
        marker.setAttribute("r", "8");
        marker.setAttribute("fill", markerIndex === 0 ? "#35b96b" : "#70d970");
        marker.setAttribute("stroke", "#ffffff");
        marker.setAttribute("stroke-width", "3");
        roadLayer.appendChild(marker);
    });
}

document.addEventListener("DOMContentLoaded", () => {
    const sourceInput = document.getElementById("sourceNode");
    const targetInput = document.getElementById("targetNode");
    const typeInput = document.getElementById("typeNode");
    const timeInput = document.getElementById("time_type");
    const weatherInput = document.getElementById("weather_type");
    const findPathBtn = document.getElementById("findPathBtn");

    if (
        !sourceInput ||
        !targetInput ||
        !typeInput ||
        !timeInput ||
        !weatherInput ||
        !findPathBtn
    ) {
        console.error("One or more Pathfinder HTML elements were not found.");
        return;
    }

    findPathBtn.addEventListener("click", () => {
        const sourceNode = Number(sourceInput.value);
        const targetNode = Number(targetInput.value);
        const typeNode = Number(typeInput.value);
        let time_type = Number(timeInput.value);
        const weather_type = Number(weatherInput.value);

        // Validate node inputs
        if (
            !Number.isInteger(sourceNode) ||
            !Number.isInteger(targetNode) ||
            sourceNode < 0 ||
            sourceNode >= 240 ||
            targetNode < 0 ||
            targetNode >= 240
        ) {
            showMessage("Enter valid source and target nodes (0–239).");
            return;
        }

        // Validate walkway/carway and weather values
        if (![0, 1].includes(typeNode)) {
            showMessage("Choose 1 for walkway or 0 for carway.");
            return;
        }

        if (![0, 1].includes(weather_type)) {
            showMessage("Choose 1 for rainy season or 0 for dry season.");
            return;
        }

        if (!Number.isFinite(time_type)) {
            showMessage("Enter a valid time value.");
            return;
        }

        // Apply your existing time rule
        time_type = time_type <= 10 ? 1 : 0;

        const type_type = typeNode === 1 ? 1 : 0;

        // Build graph and run A* using your existing function
        buildGraphAndRun(
            sourceNode,
            targetNode,
            type_type,
            time_type,
            weather_type
        );
    });

    function showMessage(message) {
        const resultElement = document.getElementById("result");
        if (resultElement) {
            resultElement.textContent = message;
        } else {
            alert(message);
        }
    }
});
// const input = fs.readFileSync(0, "utf8").trim().split(/\s+/).map(Number);
// console.log(input)

function buildGraphAndRun(
    sourceNode,
    targetNode,
    type_type,
    time_type,
    weather_type
) {
    const numNodes = 240;
    const graph = new Graph(numNodes);

        if(type_type===0){
            graph.addEdge(0, 1, 19);    // Main Gate
            graph.addEdge(1, 2, 13);    // towards enrollment office
            graph.addEdge(2, 3, 35);    // towards enrollment office
            graph.addEdge(3, 4, 27);    // Front of enrollment office
            graph.addEdge(4, 6, 28);    // Front of amphitheater
            graph.addEdge(6, 7, 35);    // Front of sitting area
            graph.addEdge(7, 10, 12);   // Front of GYM & MAC
            graph.addEdge(10, 13, 10);  // Parking start front of MAC
            graph.addEdge(13, 14, 11);  // Front of box
            graph.addEdge(14, 15, 17);  // End of box
            graph.addEdge(15, 16, 16);  // Staircase front of MAC
            graph.addEdge(16, 17, 14);  // Front of Library
            graph.addEdge(17, 18, 17);  // End of Library
            graph.addEdge(18, 19, 32);  // Between blocks
            graph.addEdge(19, 20, 7);   // Last stairs
            graph.addEdge(20, 21, 23);  // Start of Gandhi Chowk
            graph.addEdge(21, 22, 10);  // Front of Gandhi Chowk
            graph.addEdge(22, 24, 5);   // Front of 9th block amphitheater
            graph.addEdge(24, 25, 20);  // Back side of 3rd block & front of amphitheater
            graph.addEdge(25, 28, 13);  // Backside of 9th block
            graph.addEdge(28, 29, 3);   // Backside of Frisco
            graph.addEdge(29, 30, 12);  // Backside of Frisco towards food court
            graph.addEdge(30, 31, 5);   // Backside of 5th block
            graph.addEdge(31, 33, 27);  // Backside of Food Court
            graph.addEdge(33, 34, 20);  // Front side of food court 1st gate
            graph.addEdge(34, 37, 7);   // Front of food court
            graph.addEdge(37, 38, 6);   // Towards Hubble
            graph.addEdge(43, 44, 24);  // Towards main gate back of Hubble
            graph.addEdge(44, 45, 10);  // Towards main gate back of Hubble
            graph.addEdge(45, 1, 57);   // Front of gate
            graph.addEdge(1, 46, 15);   // Towards front of Hubble
            graph.addEdge(46, 47, 25);  // Front of Hubble
            graph.addEdge(47, 49, 10);  // Hubble towards 1st block
            graph.addEdge(49, 3, 20);   // Hubble towards enrollment office
            graph.addEdge(53, 38, 20);  // Front side of 2nd gate of food court
            graph.addEdge(53, 43, 23);  // Backside of Hubble
            graph.addEdge(55, 49, 13);  // Towards Hubble
            graph.addEdge(54, 56, 9);   // Inside 1st block & front of wash room
            graph.addEdge(62, 55, 54);  // Front side of 1st block & towards Hubble
            graph.addEdge(63, 64, 30);  // Towards MAC
            graph.addEdge(64, 7, 17);   // Towards sitting area behind MAC
            graph.addEdge(64, 10, 9);   // Towards MAC/GYM
            graph.addEdge(63, 65, 17);  // Towards lib stairs
            graph.addEdge(65, 66, 61);  // Towards Gandhi Chowk
            graph.addEdge(66, 67, 10);  // Towards Gandhi Chowk
            graph.addEdge(66, 24, 28);  // Towards Gandhi Chowk
            graph.addEdge(61, 79, 46);  // Outside 1st block path
            graph.addEdge(79, 77, 10);  // Outside 1st block to 2nd block 2nd path
            graph.addEdge(95, 96, 17);  // Path 6th block main entrance
            graph.addEdge(96, 97, 31);  // Path from 6th block to main road
            graph.addEdge(95, 99, 31);  // 6th to library road
            graph.addEdge(99, 100, 15); // Main road from library to IT
            graph.addEdge(100, 101, 26); // Main road to food court 2
            graph.addEdge(105, 106, 43); // Towards power house
            graph.addEdge(115, 97, 66);  // Main road to front of game office
            graph.addEdge(116, 117, 8);  // Main road for placement activity
            graph.addEdge(131, 117, 28); // Entrance of ground to intersection of MDP Guest house
            graph.addEdge(131, 132, 5);  // Towards Guest house front of Ground
            graph.addEdge(132, 133, 34); // Front gate of guest house
            graph.addEdge(131, 135, 10); // Towards guest house and girls hostel
            graph.addEdge(135, 136, 28); // 2nd gate of guest house
            graph.addEdge(135, 136, 47); // Girls hostel main gate
            graph.addEdge(136, 137, 12); // Girls hostel entrance gate
            graph.addEdge(115, 139, 10); // 2nd gate of fire station
            graph.addEdge(97, 140, 29);  // Towards Gandhi Chowk
            graph.addEdge(140, 141, 22); // Towards Gandhi Chowk
            graph.addEdge(141, 143, 10); // Gandhi Chowk
            graph.addEdge(143, 22, 11);  // Towards other block
            graph.addEdge(141, 144, 17); // Towards 9th block
            graph.addEdge(141, 145, 10); // Towards body hostel
            graph.addEdge(145, 146, 38); // Towards play school
            graph.addEdge(146, 148, 14); // Front of canteen
            graph.addEdge(148, 150, 33); // Front of Tulip towards boys hotel 
            graph.addEdge(150, 152, 23); // Front of laboratory
            graph.addEdge(152, 154, 10); // Towards car gate of boys hostel
            graph.addEdge(152, 159, 10); // Sitting area towards Tulip
            graph.addEdge(159, 160, 18); // Front of Tulip
            graph.addEdge(160, 161, 2);  // Towards Tulip 1st gate
            graph.addEdge(163, 164, 3);  // Towards 11th block 1st gate
            graph.addEdge(164, 165, 21); // 11th and 10th block
            graph.addEdge(165, 166, 23); // Towards Gandhi Chowk 9th and 10th block
            graph.addEdge(166, 167, 36); // Towards Gandhi Chowk 9th block
            graph.addEdge(167, 168, 33); // Towards Gandhi Chowk 9th last gate
            graph.addEdge(168, 184, 4);  // Towards play school
            graph.addEdge(184, 185, 8);  // Towards amphitheater
            graph.addEdge(185, 24, 13);  // Towards 3rd block
            graph.addEdge(175, 195, 23); // Backroad of 11th and 10th block
        }


        else if(type_type==1 && weather_type==1 ){
            graph.addEdge(0, 1, 19);    // Main Gate
            graph.addEdge(1, 2, 13);    // towards enrollment office
            graph.addEdge(3, 4, 27);    // Front of enrollment office
            graph.addEdge(4, 5, 21);    // Door of Enrollment office
            graph.addEdge(7, 8, 7);     // Route for sitting area
            graph.addEdge(8, 9, 1);     // Sitting area
            graph.addEdge(7, 10, 12);   // Front of GYM & MAC
            graph.addEdge(10, 11, 11);  // GYM Gate
            graph.addEdge(10, 12, 11);  // MAC Gate
            graph.addEdge(10, 13, 10);  // Parking start front of MAC
            graph.addEdge(13, 14, 11);  // Front of box
            graph.addEdge(14, 15, 17);  // End of box
            graph.addEdge(15, 16, 16);  // Staircase front of MAC
            graph.addEdge(16, 17, 14);  // Front of Library
            graph.addEdge(17, 18, 17);  // End of Library
            graph.addEdge(18, 19, 32);  // Between blocks
            graph.addEdge(19, 20, 7);   // Last stairs
            graph.addEdge(20, 21, 23);  // Start of Gandhi Chowk
            graph.addEdge(21, 22, 10);  // Front of Gandhi Chowk
            graph.addEdge(22, 23, 6);   // Gandhi Chowk
            graph.addEdge(22, 24, 5);   // Front of 9th block amphitheater
            graph.addEdge(24, 25, 20);  // Back side of 3rd block & front of amphitheater
            graph.addEdge(25, 26, 3);   // Back of 3rd block
            graph.addEdge(25, 28, 13);  // Backside of 9th block
            graph.addEdge(28, 29, 3);   // Backside of Frisco
            graph.addEdge(29, 30, 12);  // Backside of Frisco towards food court
            graph.addEdge(30, 31, 5);   // Backside of 5th block
            graph.addEdge(31, 32, 3);   // Backside entrance of 5th block
            graph.addEdge(34, 35, 10);  // Main gate of food court
            graph.addEdge(34, 36, 9);   // Stair towards food court
            graph.addEdge(34, 37, 7);   // Front of food court
            graph.addEdge(37, 38, 6);   // Towards Hubble
            graph.addEdge(38, 39, 8);   // Food court 2nd gate towards Hubble
            graph.addEdge(39, 40, 4);   // 2nd gate of food court
            graph.addEdge(39, 41, 14);  // Narrow route towards main gate through food court
            graph.addEdge(41, 42, 17);  // Front route towards main gate
            graph.addEdge(42, 68, 14);  // Food court1 back gate 
            graph.addEdge(68, 69, 2);   // Inside food court through back gate
            graph.addEdge(69, 70, 2);   // Inside food court towards 2nd gate
            graph.addEdge(70, 40, 10);  // Inside food court towards 2nd gate outwards
            graph.addEdge(69, 71, 10);  // Inside food court towards 1st gate
            graph.addEdge(71, 35, 9);   // Inside food court towards 1st gate outwards
            graph.addEdge(1, 46, 15);   // Towards front of Hubble
            graph.addEdge(46, 47, 25);  // Front of Hubble
            graph.addEdge(47, 48, 4);   // Hubble main gate
            graph.addEdge(47, 49, 10);  // Hubble towards 1st block
            graph.addEdge(49, 3, 20);   // Hubble towards enrollment office
            graph.addEdge(49, 50, 9);   // Side of Hubble towards 1st block
            graph.addEdge(50, 51, 6);   // Towards 1st block
            graph.addEdge(51, 52, 52);  // Towards food court
            graph.addEdge(52, 53, 4);   // Towards food court backside of Hubble
            graph.addEdge(53, 38, 20);  // Front side of 2nd gate of food court
            graph.addEdge(51, 54, 9);   // 1st door of 1st block
            graph.addEdge(54, 55, 12);  // Towards amphitheater
            graph.addEdge(55, 49, 13);  // Towards Hubble
            graph.addEdge(54, 56, 9);   // Inside 1st block & front of wash room
            graph.addEdge(56, 57, 32);  // Inside 1st block & towards 4th block
            graph.addEdge(57, 58, 32);  // Inside 1st block towards 2nd block
            graph.addEdge(58, 59, 20);  // Inside 1st block towards 2nd block
            graph.addEdge(59, 56, 32);  // Inside 1st block towards Library stairs
            graph.addEdge(59, 60, 7);   // Exit of 1st block through library stairs
            graph.addEdge(60, 61, 7);   // Towards library stairs
            graph.addEdge(61, 62, 14);  // Front side of 1st block
            graph.addEdge(62, 55, 54);  // Front side of 1st block & towards Hubble
            graph.addEdge(62, 63, 15);  // Climbing through lib stairs
            graph.addEdge(63, 64, 30);  // Towards MAC
            graph.addEdge(64, 7, 17);   // Towards sitting area behind MAC
            graph.addEdge(64, 10, 9);   // Towards MAC/GYM
            graph.addEdge(63, 65, 17);  // Towards lib stairs
            graph.addEdge(65, 16, 9);   // Towards Library
            graph.addEdge(66, 67, 10);  // Towards Gandhi Chowk
            graph.addEdge(66, 20, 13);  // Towards design block
            graph.addEdge(66, 24, 28);  // Towards Gandhi Chowk
            graph.addEdge(66, 72, 18);  // From stairs to 3rd block
            graph.addEdge(72, 73, 2);   // Gate of 3rd block
            graph.addEdge(72, 74, 3);   // Back gate of 2nd block
            graph.addEdge(74, 75, 22);  // Towards 2nd block
            graph.addEdge(75, 76, 6);   // 2nd block stairs
            graph.addEdge(76, 77, 2);   // 2nd block gate
            graph.addEdge(77, 78, 4);   // 2nd block to 1st block
            graph.addEdge(78, 58, 16);  // Inside 1st block towards Hubble
            graph.addEdge(61, 79, 46);  // Outside 1st block path
            graph.addEdge(79, 77, 10);  // Outside 1st block to 2nd block 2nd path
            graph.addEdge(57, 80, 10);  // 1st block to 4th block
            graph.addEdge(80, 81, 8);   // 1st block path to 4th block path
            graph.addEdge(81, 82, 3);   // 4th block gate
            graph.addEdge(82, 83, 3);   // 4th block stairs
            graph.addEdge(83, 84, 9);   // 4th block stair continues
            graph.addEdge(84, 85, 22);  // 4th block last gate
            graph.addEdge(85, 86, 4);   // 4th to 5th block
            graph.addEdge(86, 87, 2);   // 5th block gate
            graph.addEdge(52, 81, 22);  // Hubble to 4th block gate & 1st block gate
            graph.addEdge(86, 87, 23);  // 5th block stairs
            graph.addEdge(87, 88, 5);   // 5th block stairs
            graph.addEdge(88, 32, 8);   // 5th block gate
            graph.addEdge(17, 89, 51);  // Main road to library (staircase)
            graph.addEdge(18, 93, 39);  // Main road to side of IT
            graph.addEdge(90, 93, 12);  // Main road to IT (staircase)
            graph.addEdge(89, 90, 18);  // Library to IT
            graph.addEdge(89, 91, 3);   // Main gate of Library
            graph.addEdge(90, 92, 3);   // Main gate of IT
            graph.addEdge(93, 94, 26);  // Path towards 6th block
            graph.addEdge(94, 95, 24);  // Path towards backside of 6th block
            graph.addEdge(95, 96, 17);  // Path 6th block main entrance
            graph.addEdge(96, 97, 31);  // Path from 6th block to main road
            graph.addEdge(96, 98, 5);   // 6th block main entrance
            graph.addEdge(95, 99, 31);  // 6th to library road
            graph.addEdge(99, 90, 18);  // IT to main road
            graph.addEdge(99, 100, 15); // Main road from library to IT
            graph.addEdge(100, 89, 15); // Main road to Library
            graph.addEdge(100, 101, 26); // Main road to food court 2
            graph.addEdge(101, 102, 31); // Main road towards to backside of foodcourt
            graph.addEdge(102, 103, 15); // Food court backside road
            graph.addEdge(103, 104, 16); // Backside of food court to backside of MAC
            graph.addEdge(104, 105, 11); // Backside of MAC
            graph.addEdge(105, 106, 43); // Towards power house
            graph.addEdge(106, 107, 5);  // Power house gate
            graph.addEdge(107, 108, 9);  // Power house to basketball court
            graph.addEdge(108, 109, 47); // Basketball court
            graph.addEdge(109, 110, 54); // Basketball court exit 
            graph.addEdge(110, 111, 10); // Towards Placement office
            graph.addEdge(111, 112, 3);  // Main road of placement office
            graph.addEdge(103, 113, 14); // Box from food court back
            graph.addEdge(113, 114, 11); // Box mid to box mid
            graph.addEdge(114, 14, 11);  // Box to main road
            graph.addEdge(115, 97, 66);  // Main road to front of game office
            graph.addEdge(115, 116, 7);  // Main road to game office
            graph.addEdge(116, 117, 8);  // Main road for placement activity
            graph.addEdge(117, 118, 47); // Main road towards placement activity
            graph.addEdge(118, 119, 3);  // Towards ground
            graph.addEdge(118, 112, 50); // Basketball court
            graph.addEdge(120, 112, 7);  // Basketball entrance to ground entrance
            graph.addEdge(112, 121, 36); // Basketball entrance to placement activity block
            graph.addEdge(121, 122, 33); // Inside placement block
            graph.addEdge(122, 123, 25); // Exit from placement block
            graph.addEdge(123, 124, 71); // Corner of ground
            graph.addEdge(124, 125, 104); // Other side of ground
            graph.addEdge(125, 126, 32); // Front side of ground
            graph.addEdge(126, 127, 18); // Towards ground
            graph.addEdge(127, 128, 25); // Front side of ground
            graph.addEdge(128, 129, 36); // Towards basketball ground
            graph.addEdge(129, 130, 10); // Basketball back
            graph.addEdge(130, 119, 13); // Basketball back
            graph.addEdge(131, 128, 40); // Intersection in front of MDP Guest house
            graph.addEdge(131, 117, 28); // Entrance of ground to intersection of MDP Guest house
            graph.addEdge(131, 132, 5);  // Towards Guest house front of Ground
            graph.addEdge(132, 133, 34); // Front gate of guest house
            graph.addEdge(117, 134, 8);  // Museum way
            graph.addEdge(131, 135, 10); // Towards guest house and girls hostel
            graph.addEdge(135, 136, 28); // 2nd gate of guest house
            graph.addEdge(136, 133, 15); // Gate to gate guest house
            graph.addEdge(135, 136, 47); // Girls hostel main gate
            graph.addEdge(136, 137, 12); // Girls hostel entrance gate
            graph.addEdge(136, 138, 27); // Temple
            graph.addEdge(115, 139, 10); // 2nd gate of fire station
            graph.addEdge(97, 140, 29);  // Towards Gandhi Chowk
            graph.addEdge(140, 141, 22); // Towards Gandhi Chowk
            graph.addEdge(141, 142, 6);  // Towards amphitheater
            graph.addEdge(141, 143, 10); // Gandhi Chowk
            graph.addEdge(143, 22, 11);  // Towards other block
            graph.addEdge(141, 144, 17); // Towards 9th block
            graph.addEdge(141, 145, 10); // Towards body hostel
            graph.addEdge(145, 146, 38); // Towards play school
            graph.addEdge(146, 147, 5);  // Entrance of play school
            graph.addEdge(146, 148, 14); // Front of canteen
            graph.addEdge(148, 149, 12); // Gate of canteen
            graph.addEdge(148, 150, 33); // Front of Tulip towards boys hotel 
            graph.addEdge(150, 151, 4);  // Tulip 2nd gate towards boys hostel
            graph.addEdge(150, 152, 23); // Front of laboratory
            graph.addEdge(152, 153, 4);  // Gate of Laboratory
            graph.addEdge(152, 154, 10); // Towards car gate of boys hostel
            graph.addEdge(154, 155, 5);  // Car gate of boys hostel
            graph.addEdge(154, 156, 6);  // Towards boys hostel entrance
            graph.addEdge(156, 157, 6);  // Boys hostel gate
            graph.addEdge(152, 159, 10); // Sitting area towards Tulip
            graph.addEdge(159, 160, 18); // Front of Tulip
            graph.addEdge(160, 161, 2);  // Towards Tulip 1st gate
            graph.addEdge(161, 162, 4);  // 1st gate of Tulip
            graph.addEdge(159, 163, 17); // Towards 11th block
            graph.addEdge(163, 164, 3);  // Towards 11th block 1st gate
            graph.addEdge(168, 184, 4);  // Towards play school
            graph.addEdge(184, 185, 8);  // Towards amphitheater
            graph.addEdge(185, 186, 13); // Towards 9th block
            graph.addEdge(185, 24, 13);  // Towards 3rd block
            graph.addEdge(186, 27, 4);   // Towards 9th block main entrance
            graph.addEdge(186, 25, 12);  // Towards 3rd block
            graph.addEdge(188, 179, 4);  // Back gate stair of 9th block
            graph.addEdge(179, 189, 8);  // Stair main gate of 10th block
            graph.addEdge(189, 190, 3);  // Main gate of 10th block
            graph.addEdge(188, 191, 8);  // Back gate of 9th block
            graph.addEdge(191, 192, 34); // Towards mid of 9th block
            graph.addEdge(192, 187, 11); // Mid gate of 9th block
            graph.addEdge(192, 182, 31); // Front gate of 9th block
            graph.addEdge(190, 193, 27); // Mid of 10th block
            graph.addEdge(193, 176, 24); // End gate of 10th block
            graph.addEdge(193, 194, 11); // Mid gate of 10th block
            graph.addEdge(194, 195, 3);  // Between 11th and 10th block
            graph.addEdge(195, 196, 5);  // Downside gate of 11th block
            graph.addEdge(196, 197, 4);  // Towards 11th block stairs
            graph.addEdge(197, 198, 6);  // Towards 11th block stairs
            graph.addEdge(198, 199, 4);  // Towards 11th block stairs
            graph.addEdge(199, 200, 20); // Towards 11th block main gate
            graph.addEdge(200, 201, 4);  // Towards 11th block gate
            graph.addEdge(201, 202, 1);  // Towards main gate of 11th block
            graph.addEdge(202, 203, 3);  // Main gate of 11th block
            graph.addEdge(202, 204, 12); // Towards intersection part
            graph.addEdge(203, 205, 2);  // Towards main road
            graph.addEdge(205, 164, 16); // 11th block main road
            graph.addEdge(175, 195, 23); // Backroad of 11th and 10th block
            graph.addEdge(206, 207, 3);  // Towards mid of 10th and 11th block
            graph.addEdge(207, 195, 23); // Mid of 10th and 11th block
            graph.addEdge(170, 204, 18); // Intersection point
            graph.addEdge(170, 208, 17); // Towards 3rd gate of 11th block
            graph.addEdge(170, 209, 19); // Mid gate of 11th block
            graph.addEdge(208, 210, 8);  // Last gate to entrance
            graph.addEdge(210, 211, 3);  // Last gate inside 11th block
            graph.addEdge(211, 212, 8);  // Inside 11th block
            graph.addEdge(212, 213, 25); // Inside 11th block
            graph.addEdge(213, 214, 23); // Mid gate of 11th block
            graph.addEdge(214, 209, 4);  // Mid gate entrance
            graph.addEdge(214, 215, 25); // Towards main gate of 11th block
            graph.addEdge(215, 199, 5);  // Towards stair of 11th block
            graph.addEdge(30, 216, 6);   // Towards Frisco
            graph.addEdge(216, 217, 4);  // Towards 3rd block
            graph.addEdge(216, 218, 7);  // Towards Frisco
            graph.addEdge(219, 31, 10);  // Towards 5th block
            graph.addEdge(219, 220, 5);  // 5th block gate
            graph.addEdge(219, 221, 7);  // Towards Frisco
            graph.addEdge(221, 222, 6);  // Towards Frisco entrance
            graph.addEdge(218, 222, 5);  // Towards Frisco entrance
            graph.addEdge(222, 223, 3);  // Frisco entrance
            graph.addEdge(218, 224, 16); //
            graph.addEdge(221, 225, 16); //
            graph.addEdge(218, 225, 18); 
            graph.addEdge(224, 221, 18); //
            graph.addEdge(224, 225, 12); //
            graph.addEdge(225, 85, 16); 
            graph.addEdge(224, 72, 15); //
            graph.addEdge(225, 226, 29); //
            graph.addEdge(226, 81, 5); 
            graph.addEdge(226, 227, 8); //
            graph.addEdge(227, 228, 6); //
            graph.addEdge(228, 229, 4);
            graph.addEdge(228, 224, 27); 
            graph.addEdge(229, 76, 4);
            graph.addEdge(228, 77, 4); 
            graph.addEdge(227, 230, 3); 
            graph.addEdge(231, 50, 12);
            graph.addEdge(231, 48, 9);
        
        }
        else if(type_type==1 && time_type==0 && weather_type==0){
            graph.addEdge(0, 1, 19);    // Main Gate
            graph.addEdge(1, 2, 13);    // towards enrollment office
            graph.addEdge(2, 3, 35);    // towards enrollment office
            graph.addEdge(3, 4, 27);    // Front of enrollment office
            graph.addEdge(4, 5, 21);    // Door of Enrollment office
            graph.addEdge(4, 6, 28);    // Front of amphitheater
            graph.addEdge(6, 7, 35);    // Front of sitting area
            graph.addEdge(7, 8, 7);     // Route for sitting area
            graph.addEdge(8, 9, 1);     // Sitting area
            graph.addEdge(7, 10, 12);   // Front of GYM & MAC
            graph.addEdge(10, 11, 11);  // GYM Gate
            graph.addEdge(10, 12, 11);  // MAC Gate
            graph.addEdge(10, 13, 10);  // Parking start front of MAC
            graph.addEdge(13, 14, 11);  // Front of box
            graph.addEdge(14, 15, 17);  // End of box
            graph.addEdge(15, 16, 16);  // Staircase front of MAC
            graph.addEdge(16, 17, 14);  // Front of Library
            graph.addEdge(17, 18, 17);  // End of Library
            graph.addEdge(18, 19, 32);  // Between blocks
            graph.addEdge(19, 20, 7);   // Last stairs
            graph.addEdge(20, 21, 23);  // Start of Gandhi Chowk
            graph.addEdge(21, 22, 10);  // Front of Gandhi Chowk
            graph.addEdge(22, 23, 6);   // Gandhi Chowk
            graph.addEdge(22, 24, 5);   // Front of 9th block amphitheater
            graph.addEdge(24, 25, 20);  // Back side of 3rd block & front of amphitheater
            graph.addEdge(25, 26, 3);   // Back of 3rd block
            graph.addEdge(25, 28, 13);  // Backside of 9th block
            graph.addEdge(28, 29, 3);   // Backside of Frisco
            graph.addEdge(29, 30, 12);  // Backside of Frisco towards food court
            graph.addEdge(30, 31, 5);   // Backside of 5th block
            graph.addEdge(31, 32, 3);   // Backside entrance of 5th block
            graph.addEdge(31, 33, 27);  // Backside of Food Court
            graph.addEdge(33, 34, 20);  // Front side of food court 1st gate
            graph.addEdge(34, 35, 10);  // Main gate of food court
            graph.addEdge(34, 36, 9);   // Stair towards food court
            graph.addEdge(34, 37, 7);   // Front of food court
            graph.addEdge(37, 38, 6);   // Towards Hubble
            graph.addEdge(38, 39, 8);   // Food court 2nd gate towards Hubble
            graph.addEdge(39, 40, 4);   // 2nd gate of food court
            graph.addEdge(39, 41, 14);  // Narrow route towards main gate through food court
            graph.addEdge(41, 42, 17);  // Front route towards main gate
            graph.addEdge(42, 43, 15);  // Connecting route towards main gate / back side of Hubble
            graph.addEdge(42, 68, 14);  // Food court1 back gate 
            graph.addEdge(68, 69, 2);   // Inside food court through back gate
            graph.addEdge(69, 70, 2);   // Inside food court towards 2nd gate
            graph.addEdge(70, 40, 10);  // Inside food court towards 2nd gate outwards
            graph.addEdge(69, 71, 10);  // Inside food court towards 1st gate
            graph.addEdge(71, 35, 9);   // Inside food court towards 1st gate outwards
            graph.addEdge(43, 44, 24);  // Towards main gate back of Hubble
            graph.addEdge(44, 45, 10);  // Towards main gate back of Hubble
            graph.addEdge(45, 1, 57);   // Front of gate
            graph.addEdge(1, 46, 15);   // Towards front of Hubble
            graph.addEdge(46, 47, 25);  // Front of Hubble
            graph.addEdge(47, 48, 4);   // Hubble main gate
            graph.addEdge(47, 49, 10);  // Hubble towards 1st block
            graph.addEdge(49, 3, 20);   // Hubble towards enrollment office
            graph.addEdge(49, 50, 9);   // Side of Hubble towards 1st block
            graph.addEdge(50, 51, 6);   // Towards 1st block
            graph.addEdge(51, 52, 52);  // Towards food court
            graph.addEdge(52, 53, 4);   // Towards food court backside of Hubble
            graph.addEdge(53, 38, 20);  // Front side of 2nd gate of food court
            graph.addEdge(53, 43, 23);  // Backside of Hubble
            graph.addEdge(51, 54, 9);   // 1st door of 1st block
            graph.addEdge(54, 55, 12);  // Towards amphitheater
            graph.addEdge(55, 49, 13);  // Towards Hubble
            graph.addEdge(54, 56, 9);   // Inside 1st block & front of wash room
            graph.addEdge(56, 57, 32);  // Inside 1st block & towards 4th block
            graph.addEdge(57, 58, 32);  // Inside 1st block towards 2nd block
            graph.addEdge(58, 59, 20);  // Inside 1st block towards 2nd block
            graph.addEdge(59, 56, 32);  // Inside 1st block towards Library stairs
            graph.addEdge(59, 60, 7);   // Exit of 1st block through library stairs
            graph.addEdge(60, 61, 7);   // Towards library stairs
            graph.addEdge(61, 62, 14);  // Front side of 1st block
            graph.addEdge(62, 55, 54);  // Front side of 1st block & towards Hubble
            graph.addEdge(62, 63, 15);  // Climbing through lib stairs
            graph.addEdge(63, 64, 30);  // Towards MAC
            graph.addEdge(64, 7, 17);   // Towards sitting area behind MAC
            graph.addEdge(64, 10, 9);   // Towards MAC/GYM
            graph.addEdge(63, 65, 17);  // Towards lib stairs
            graph.addEdge(65, 16, 9);   // Towards Library
            graph.addEdge(65, 66, 61);  // Towards Gandhi Chowk
            graph.addEdge(66, 67, 10);  // Towards Gandhi Chowk
            graph.addEdge(66, 20, 13);  // Towards design block
            graph.addEdge(66, 24, 28);  // Towards Gandhi Chowk
            graph.addEdge(66, 72, 18);  // From stairs to 3rd block
            graph.addEdge(72, 73, 2);   // Gate of 3rd block
            graph.addEdge(72, 74, 3);   // Back gate of 2nd block
            graph.addEdge(74, 75, 22);  // Towards 2nd block
            graph.addEdge(75, 76, 6);   // 2nd block stairs
            graph.addEdge(76, 77, 2);   // 2nd block gate
            graph.addEdge(77, 78, 4);   // 2nd block to 1st block
            graph.addEdge(78, 58, 16);  // Inside 1st block towards Hubble
            graph.addEdge(61, 79, 46);  // Outside 1st block path
            graph.addEdge(79, 77, 10);  // Outside 1st block to 2nd block 2nd path
            graph.addEdge(57, 80, 10);  // 1st block to 4th block
            graph.addEdge(80, 81, 8);   // 1st block path to 4th block path
            graph.addEdge(81, 82, 3);   // 4th block gate
            graph.addEdge(82, 83, 3);   // 4th block stairs
            graph.addEdge(83, 84, 9);   // 4th block stair continues
            graph.addEdge(84, 85, 22);  // 4th block last gate
            graph.addEdge(85, 86, 4);   // 4th to 5th block
            graph.addEdge(86, 87, 2);   // 5th block gate
            graph.addEdge(52, 81, 22);  // Hubble to 4th block gate & 1st block gate
            graph.addEdge(86, 87, 23);  // 5th block stairs
            graph.addEdge(87, 88, 5);   // 5th block stairs
            graph.addEdge(88, 32, 8);   // 5th block gate
            graph.addEdge(17, 89, 51);  // Main road to library (staircase)
            graph.addEdge(18, 93, 39);  // Main road to side of IT
            graph.addEdge(90, 93, 12);  // Main road to IT (staircase)
            graph.addEdge(89, 90, 18);  // Library to IT
            graph.addEdge(89, 91, 3);   // Main gate of Library
            graph.addEdge(90, 92, 3);   // Main gate of IT
            graph.addEdge(93, 94, 26);  // Path towards 6th block
            graph.addEdge(94, 95, 24);  // Path towards backside of 6th block
            graph.addEdge(95, 96, 17);  // Path 6th block main entrance
            graph.addEdge(96, 97, 31);  // Path from 6th block to main road
            graph.addEdge(96, 98, 5);   // 6th block main entrance
            graph.addEdge(95, 99, 31);  // 6th to library road
            graph.addEdge(99, 90, 18);  // IT to main road
            graph.addEdge(99, 100, 15); // Main road from library to IT
            graph.addEdge(100, 89, 15); // Main road to Library
            graph.addEdge(100, 101, 26); // Main road to food court 2
            graph.addEdge(101, 102, 31); // Main road towards to backside of foodcourt
            graph.addEdge(102, 103, 15); // Food court backside road
            graph.addEdge(103, 104, 16); // Backside of food court to backside of MAC
            graph.addEdge(104, 105, 11); // Backside of MAC
            graph.addEdge(105, 106, 43); // Towards power house
            graph.addEdge(106, 107, 5);  // Power house gate
            graph.addEdge(107, 108, 9);  // Power house to basketball court
            graph.addEdge(108, 109, 47); // Basketball court
            graph.addEdge(109, 110, 54); // Basketball court exit 
            graph.addEdge(110, 111, 10); // Towards Placement office
            graph.addEdge(111, 112, 3);  // Main road of placement office
            graph.addEdge(103, 113, 14); // Box from food court back
            graph.addEdge(113, 114, 11); // Box mid to box mid
            graph.addEdge(114, 14, 11);  // Box to main road
            graph.addEdge(115, 97, 66);  // Main road to front of game office
            graph.addEdge(115, 116, 7);  // Main road to game office
            graph.addEdge(116, 117, 8);  // Main road for placement activity
            graph.addEdge(117, 118, 47); // Main road towards placement activity
            graph.addEdge(118, 119, 3);  // Towards ground
            graph.addEdge(118, 112, 50); // Basketball court
            graph.addEdge(120, 112, 7);  // Basketball entrance to ground entrance
            graph.addEdge(112, 121, 36); // Basketball entrance to placement activity block
            graph.addEdge(121, 122, 33); // Inside placement block
            graph.addEdge(122, 123, 25); // Exit from placement block
            graph.addEdge(123, 124, 71); // Corner of ground
            graph.addEdge(124, 125, 104); // Other side of ground
            graph.addEdge(125, 126, 32); // Front side of ground
            graph.addEdge(126, 127, 18); // Towards ground
            graph.addEdge(127, 128, 25); // Front side of ground
            graph.addEdge(128, 129, 36); // Towards basketball ground
            graph.addEdge(129, 130, 10); // Basketball back
            graph.addEdge(130, 119, 13); // Basketball back
            graph.addEdge(131, 128, 40); // Intersection in front of MDP Guest house
            graph.addEdge(131, 117, 28); // Entrance of ground to intersection of MDP Guest house
            graph.addEdge(131, 132, 5);  // Towards Guest house front of Ground
            graph.addEdge(132, 133, 34); // Front gate of guest house
            graph.addEdge(117, 134, 8);  // Museum way
            graph.addEdge(131, 135, 10); // Towards guest house and girls hostel
            graph.addEdge(135, 136, 28); // 2nd gate of guest house
            graph.addEdge(136, 133, 15); // Gate to gate guest house
            graph.addEdge(135, 136, 47); // Girls hostel main gate
            graph.addEdge(136, 137, 12); // Girls hostel entrance gate
            graph.addEdge(136, 138, 27); // Temple
            graph.addEdge(115, 139, 10); // 2nd gate of fire station
            graph.addEdge(97, 140, 29);  // Towards Gandhi Chowk
            graph.addEdge(140, 141, 22); // Towards Gandhi Chowk
            graph.addEdge(141, 142, 6);  // Towards amphitheater
            graph.addEdge(141, 143, 10); // Gandhi Chowk
            graph.addEdge(143, 22, 11);  // Towards other block
            graph.addEdge(141, 144, 17); // Towards 9th block
            graph.addEdge(141, 145, 10); // Towards body hostel
            graph.addEdge(145, 146, 38); // Towards play school
            graph.addEdge(146, 147, 5);  // Entrance of play school
            graph.addEdge(146, 148, 14); // Front of canteen
            graph.addEdge(148, 149, 12); // Gate of canteen
            graph.addEdge(148, 150, 33); // Front of Tulip towards boys hotel 
            graph.addEdge(150, 151, 4);  // Tulip 2nd gate towards boys hostel
            graph.addEdge(150, 152, 23); // Front of laboratory
            graph.addEdge(152, 153, 4);  // Gate of Laboratory
            graph.addEdge(152, 154, 10); // Towards car gate of boys hostel
            graph.addEdge(154, 155, 5);  // Car gate of boys hostel
            graph.addEdge(154, 156, 6);  // Towards boys hostel entrance
            graph.addEdge(156, 157, 6);  // Boys hostel gate
            graph.addEdge(152, 159, 10); // Sitting area towards Tulip
            graph.addEdge(159, 160, 18); // Front of Tulip
            graph.addEdge(160, 161, 2);  // Towards Tulip 1st gate
            graph.addEdge(161, 162, 4);  // 1st gate of Tulip
            graph.addEdge(159, 163, 17); // Towards 11th block
            graph.addEdge(163, 164, 3);  // Towards 11th block 1st gate
            graph.addEdge(164, 165, 21); // 11th and 10th block
            graph.addEdge(165, 166, 23); // Towards Gandhi Chowk 9th and 10th block
            graph.addEdge(166, 167, 36); // Towards Gandhi Chowk 9th block
            graph.addEdge(167, 168, 33); // Towards Gandhi Chowk 9th last gate
            graph.addEdge(168, 184, 4);  // Towards play school
            graph.addEdge(184, 185, 8);  // Towards amphitheater
            graph.addEdge(185, 186, 13); // Towards 9th block
            graph.addEdge(185, 24, 13);  // Towards 3rd block
            graph.addEdge(186, 27, 4);   // Towards 9th block main entrance
            graph.addEdge(186, 25, 12);  // Towards 3rd block
            graph.addEdge(187, 167, 5);  // Mid gate of 9th block
            graph.addEdge(188, 179, 4);  // Back gate stair of 9th block
            graph.addEdge(179, 189, 8);  // Stair main gate of 10th block
            graph.addEdge(189, 190, 3);  // Main gate of 10th block
            graph.addEdge(188, 191, 8);  // Back gate of 9th block
            graph.addEdge(191, 192, 34); // Towards mid of 9th block
            graph.addEdge(192, 187, 11); // Mid gate of 9th block
            graph.addEdge(192, 182, 31); // Front gate of 9th block
            graph.addEdge(190, 193, 27); // Mid of 10th block
            graph.addEdge(193, 176, 24); // End gate of 10th block
            graph.addEdge(193, 194, 11); // Mid gate of 10th block
            graph.addEdge(194, 195, 3);  // Between 11th and 10th block
            graph.addEdge(195, 196, 5);  // Downside gate of 11th block
            graph.addEdge(196, 197, 4);  // Towards 11th block stairs
            graph.addEdge(197, 198, 6);  // Towards 11th block stairs
            graph.addEdge(198, 199, 4);  // Towards 11th block stairs
            graph.addEdge(199, 200, 20); // Towards 11th block main gate
            graph.addEdge(200, 201, 4);  // Towards 11th block gate
            graph.addEdge(201, 202, 1);  // Towards main gate of 11th block
            graph.addEdge(202, 203, 3);  // Main gate of 11th block
            graph.addEdge(202, 204, 12); // Towards intersection part
            graph.addEdge(203, 205, 2);  // Towards main road
            graph.addEdge(205, 164, 16); // 11th block main road
            graph.addEdge(175, 195, 23); // Backroad of 11th and 10th block
            graph.addEdge(165, 206, 19); // Main road towards mid of 11th and 10th block
            graph.addEdge(206, 207, 3);  // Towards mid of 10th and 11th block
            graph.addEdge(207, 195, 23); // Mid of 10th and 11th block
            graph.addEdge(170, 204, 18); // Intersection point
            graph.addEdge(170, 208, 17); // Towards 3rd gate of 11th block
            graph.addEdge(170, 209, 19); // Mid gate of 11th block
            graph.addEdge(208, 210, 8);  // Last gate to entrance
            graph.addEdge(210, 211, 3);  // Last gate inside 11th block
            graph.addEdge(211, 212, 8);  // Inside 11th block
            graph.addEdge(212, 213, 25); // Inside 11th block
            graph.addEdge(213, 214, 23); // Mid gate of 11th block
            graph.addEdge(214, 209, 4);  // Mid gate entrance
            graph.addEdge(214, 215, 25); // Towards main gate of 11th block
            graph.addEdge(215, 199, 5);  // Towards stair of 11th block
            graph.addEdge(30, 216, 6);   // Towards Frisco
            graph.addEdge(216, 217, 4);  // Towards 3rd block
            graph.addEdge(216, 218, 7);  // Towards Frisco
            graph.addEdge(219, 31, 10);  // Towards 5th block
            graph.addEdge(219, 220, 5);  // 5th block gate
            graph.addEdge(219, 221, 7);  // Towards Frisco
            graph.addEdge(221, 222, 6);  // Towards Frisco entrance
            graph.addEdge(218, 222, 5);  // Towards Frisco entrance
            graph.addEdge(222, 223, 3);  // Frisco entrance
            graph.addEdge(218, 224, 16); //
            graph.addEdge(221, 225, 16); //
            graph.addEdge(218, 225, 18); 
            graph.addEdge(224, 221, 18); //
            graph.addEdge(224, 225, 12); //
            graph.addEdge(225, 85, 16); 
            graph.addEdge(224, 72, 15); //
            graph.addEdge(225, 226, 29); //
            graph.addEdge(226, 81, 5); 
            graph.addEdge(226, 227, 8); //
            graph.addEdge(227, 228, 6); //
            graph.addEdge(228, 229, 4);
            graph.addEdge(228, 224, 27); 
            graph.addEdge(229, 76, 4);
            graph.addEdge(228, 77, 4); 
            graph.addEdge(227, 230, 3); 
            graph.addEdge(231, 50, 12);
            graph.addEdge(231, 48, 9);
        }
        // ... (add all other edges)

        else if(type_type==1 && time_type==1){
            graph.addEdge(0, 1, 19);    // Main Gate
            graph.addEdge(2, 3, 35);    // towards enrollment office
            graph.addEdge(3, 4, 27);    // Front of enrollment office
            graph.addEdge(4, 5, 21);    // Door of Enrollment office
            graph.addEdge(4, 6, 28);    // Front of amphitheater
            graph.addEdge(6, 7, 35);    // Front of sitting area
            graph.addEdge(7, 8, 7);     // Route for sitting area
            graph.addEdge(8, 9, 1);     // Sitting area
            graph.addEdge(7, 10, 12);   // Front of GYM & MAC
            graph.addEdge(10, 11, 11);  // GYM Gate
            graph.addEdge(10, 12, 11);  // MAC Gate
            graph.addEdge(10, 13, 10);  // Parking start front of MAC
            graph.addEdge(13, 14, 11);  // Front of box
            graph.addEdge(14, 15, 17);  // End of box
            graph.addEdge(15, 16, 16);  // Staircase front of MAC
            graph.addEdge(16, 17, 14);  // Front of Library
            graph.addEdge(17, 18, 17);  // End of Library
            graph.addEdge(18, 19, 32);  // Between blocks
            graph.addEdge(19, 20, 7);   // Last stairs
            graph.addEdge(20, 21, 23);  // Start of Gandhi Chowk
            graph.addEdge(21, 22, 10);  // Front of Gandhi Chowk
            graph.addEdge(22, 23, 6);   // Gandhi Chowk
            graph.addEdge(22, 24, 5);   // Front of 9th block amphitheater
            graph.addEdge(24, 25, 20);  // Back side of 3rd block & front of amphitheater
            graph.addEdge(25, 26, 3);   // Back of 3rd block
            graph.addEdge(25, 28, 13);  // Backside of 9th block
            graph.addEdge(28, 29, 3);   // Backside of Frisco
            graph.addEdge(29, 30, 12);  // Backside of Frisco towards food court
            graph.addEdge(30, 31, 5);   // Backside of 5th block
            graph.addEdge(31, 32, 3);   // Backside entrance of 5th block
            graph.addEdge(31, 33, 27);  // Backside of Food Court
            graph.addEdge(33, 34, 20);  // Front side of food court 1st gate
            graph.addEdge(34, 35, 10);  // Main gate of food court
            graph.addEdge(34, 36, 9);   // Stair towards food court
            graph.addEdge(34, 37, 7);   // Front of food court
            graph.addEdge(37, 38, 6);   // Towards Hubble
            graph.addEdge(38, 39, 8);   // Food court 2nd gate towards Hubble
            graph.addEdge(39, 40, 4);   // 2nd gate of food court
            graph.addEdge(39, 41, 14);  // Narrow route towards main gate through food court
            graph.addEdge(41, 42, 17);  // Front route towards main gate
            graph.addEdge(42, 43, 15);  // Connecting route towards main gate / back side of Hubble
            graph.addEdge(42, 68, 14);  // Food court1 back gate 
            graph.addEdge(68, 69, 2);   // Inside food court through back gate
            graph.addEdge(69, 70, 2);   // Inside food court towards 2nd gate
            graph.addEdge(70, 40, 10);  // Inside food court towards 2nd gate outwards
            graph.addEdge(69, 71, 10);  // Inside food court towards 1st gate
            graph.addEdge(71, 35, 9);   // Inside food court towards 1st gate outwards
            graph.addEdge(43, 44, 24);  // Towards main gate back of Hubble
            graph.addEdge(44, 45, 10);  // Towards main gate back of Hubble
            graph.addEdge(45, 1, 57);   // Front of gate
            graph.addEdge(46, 47, 25);  // Front of Hubble
            graph.addEdge(47, 48, 4);   // Hubble main gate
            graph.addEdge(47, 49, 10);  // Hubble towards 1st block
            graph.addEdge(49, 3, 20);   // Hubble towards enrollment office
            graph.addEdge(49, 50, 9);   // Side of Hubble towards 1st block
            graph.addEdge(50, 51, 6);   // Towards 1st block
            graph.addEdge(51, 52, 52);  // Towards food court
            graph.addEdge(52, 53, 4);   // Towards food court backside of Hubble
            graph.addEdge(53, 38, 20);  // Front side of 2nd gate of food court
            graph.addEdge(53, 43, 23);  // Backside of Hubble
            graph.addEdge(51, 54, 9);   // 1st door of 1st block
            graph.addEdge(54, 55, 12);  // Towards amphitheater
            graph.addEdge(55, 49, 13);  // Towards Hubble
            graph.addEdge(54, 56, 9);   // Inside 1st block & front of wash room
            graph.addEdge(56, 57, 32);  // Inside 1st block & towards 4th block
            graph.addEdge(57, 58, 32);  // Inside 1st block towards 2nd block
            graph.addEdge(58, 59, 20);  // Inside 1st block towards 2nd block
            graph.addEdge(59, 56, 32);  // Inside 1st block towards Library stairs
            graph.addEdge(59, 60, 7);   // Exit of 1st block through library stairs
            graph.addEdge(60, 61, 7);   // Towards library stairs
            graph.addEdge(61, 62, 14);  // Front side of 1st block
            graph.addEdge(62, 55, 54);  // Front side of 1st block & towards Hubble
            graph.addEdge(62, 63, 15);  // Climbing through lib stairs
            graph.addEdge(63, 64, 30);  // Towards MAC
            graph.addEdge(64, 7, 17);   // Towards sitting area behind MAC
            graph.addEdge(64, 10, 9);   // Towards MAC/GYM
            graph.addEdge(63, 65, 17);  // Towards lib stairs
            graph.addEdge(65, 16, 9);   // Towards Library
            graph.addEdge(65, 66, 61);  // Towards Gandhi Chowk
            graph.addEdge(66, 67, 10);  // Towards Gandhi Chowk
            graph.addEdge(66, 20, 13);  // Towards design block
            graph.addEdge(66, 24, 28);  // Towards Gandhi Chowk
            graph.addEdge(66, 72, 18);  // From stairs to 3rd block
            graph.addEdge(72, 73, 2);   // Gate of 3rd block
            graph.addEdge(72, 74, 3);   // Back gate of 2nd block
            graph.addEdge(74, 75, 22);  // Towards 2nd block
            graph.addEdge(75, 76, 6);   // 2nd block stairs
            graph.addEdge(76, 77, 2);   // 2nd block gate
            graph.addEdge(77, 78, 4);   // 2nd block to 1st block
            graph.addEdge(78, 58, 16);  // Inside 1st block towards Hubble
            graph.addEdge(61, 79, 46);  // Outside 1st block path
            graph.addEdge(79, 77, 10);  // Outside 1st block to 2nd block 2nd path
            graph.addEdge(57, 80, 10);  // 1st block to 4th block
            graph.addEdge(80, 81, 8);   // 1st block path to 4th block path
            graph.addEdge(81, 82, 3);   // 4th block gate
            graph.addEdge(82, 83, 3);   // 4th block stairs
            graph.addEdge(83, 84, 9);   // 4th block stair continues
            graph.addEdge(84, 85, 22);  // 4th block last gate
            graph.addEdge(85, 86, 4);   // 4th to 5th block
            graph.addEdge(86, 87, 2);   // 5th block gate
            graph.addEdge(52, 81, 22);  // Hubble to 4th block gate & 1st block gate
            graph.addEdge(86, 87, 23);  // 5th block stairs
            graph.addEdge(87, 88, 5);   // 5th block stairs
            graph.addEdge(88, 32, 8);   // 5th block gate
            graph.addEdge(17, 89, 51);  // Main road to library (staircase)
            graph.addEdge(18, 93, 39);  // Main road to side of IT
            graph.addEdge(90, 93, 12);  // Main road to IT (staircase)
            graph.addEdge(89, 90, 18);  // Library to IT
            graph.addEdge(89, 91, 3);   // Main gate of Library
            graph.addEdge(90, 92, 3);   // Main gate of IT
            graph.addEdge(93, 94, 26);  // Path towards 6th block
            graph.addEdge(94, 95, 24);  // Path towards backside of 6th block
            graph.addEdge(95, 96, 17);  // Path 6th block main entrance
            graph.addEdge(96, 97, 31);  // Path from 6th block to main road
            graph.addEdge(96, 98, 5);   // 6th block main entrance
            graph.addEdge(95, 99, 31);  // 6th to library road
            graph.addEdge(99, 90, 18);  // IT to main road
            graph.addEdge(99, 100, 15); // Main road from library to IT
            graph.addEdge(100, 89, 15); // Main road to Library
            graph.addEdge(100, 101, 26); // Main road to food court 2
            graph.addEdge(101, 102, 31); // Main road towards to backside of foodcourt
            graph.addEdge(102, 103, 15); // Food court backside road
            graph.addEdge(103, 104, 16); // Backside of food court to backside of MAC
            graph.addEdge(104, 105, 11); // Backside of MAC
            graph.addEdge(105, 106, 43); // Towards power house
            graph.addEdge(106, 107, 5);  // Power house gate
            graph.addEdge(107, 108, 9);  // Power house to basketball court
            graph.addEdge(108, 109, 47); // Basketball court
            graph.addEdge(109, 110, 54); // Basketball court exit 
            graph.addEdge(110, 111, 10); // Towards Placement office
            graph.addEdge(111, 112, 3);  // Main road of placement office
            graph.addEdge(103, 113, 14); // Box from food court back
            graph.addEdge(113, 114, 11); // Box mid to box mid
            graph.addEdge(114, 14, 11);  // Box to main road
            graph.addEdge(115, 97, 66);  // Main road to front of game office
            graph.addEdge(115, 116, 7);  // Main road to game office
            graph.addEdge(116, 117, 8);  // Main road for placement activity
            graph.addEdge(117, 118, 47); // Main road towards placement activity
            graph.addEdge(118, 119, 3);  // Towards ground
            graph.addEdge(118, 112, 50); // Basketball court
            graph.addEdge(120, 112, 7);  // Basketball entrance to ground entrance
            graph.addEdge(112, 121, 36); // Basketball entrance to placement activity block
            graph.addEdge(121, 122, 33); // Inside placement block
            graph.addEdge(122, 123, 25); // Exit from placement block
            graph.addEdge(123, 124, 71); // Corner of ground
            graph.addEdge(124, 125, 104); // Other side of ground
            graph.addEdge(125, 126, 32); // Front side of ground
            graph.addEdge(126, 127, 18); // Towards ground
            graph.addEdge(127, 128, 25); // Front side of ground
            graph.addEdge(128, 129, 36); // Towards basketball ground
            graph.addEdge(129, 130, 10); // Basketball back
            graph.addEdge(130, 119, 13); // Basketball back
            graph.addEdge(131, 128, 40); // Intersection in front of MDP Guest house
            graph.addEdge(131, 117, 28); // Entrance of ground to intersection of MDP Guest house
            graph.addEdge(131, 132, 5);  // Towards Guest house front of Ground
            graph.addEdge(132, 133, 34); // Front gate of guest house
            graph.addEdge(117, 134, 8);  // Museum way
            graph.addEdge(131, 135, 10); // Towards guest house and girls hostel
            graph.addEdge(135, 136, 28); // 2nd gate of guest house
            graph.addEdge(136, 133, 15); // Gate to gate guest house
            graph.addEdge(135, 136, 47); // Girls hostel main gate
            graph.addEdge(136, 137, 12); // Girls hostel entrance gate
            graph.addEdge(136, 138, 27); // Temple
            graph.addEdge(115, 139, 10); // 2nd gate of fire station
            graph.addEdge(97, 140, 29);  // Towards Gandhi Chowk
            graph.addEdge(140, 141, 22); // Towards Gandhi Chowk
            graph.addEdge(141, 142, 6);  // Towards amphitheater
            graph.addEdge(141, 143, 10); // Gandhi Chowk
            graph.addEdge(143, 22, 11);  // Towards other block
            graph.addEdge(141, 144, 17); // Towards 9th block
            graph.addEdge(141, 145, 10); // Towards body hostel
            graph.addEdge(145, 146, 38); // Towards play school
            graph.addEdge(146, 147, 5);  // Entrance of play school
            graph.addEdge(146, 148, 14); // Front of canteen
            graph.addEdge(148, 149, 12); // Gate of canteen
            graph.addEdge(148, 150, 33); // Front of Tulip towards boys hotel 
            graph.addEdge(150, 151, 4);  // Tulip 2nd gate towards boys hostel
            graph.addEdge(150, 152, 23); // Front of laboratory
            graph.addEdge(152, 153, 4);  // Gate of Laboratory
            graph.addEdge(152, 154, 10); // Towards car gate of boys hostel
            graph.addEdge(154, 155, 5);  // Car gate of boys hostel
            graph.addEdge(154, 156, 6);  // Towards boys hostel entrance
            graph.addEdge(156, 157, 6);  // Boys hostel gate
            graph.addEdge(152, 159, 10); // Sitting area towards Tulip
            graph.addEdge(159, 160, 18); // Front of Tulip
            graph.addEdge(160, 161, 2);  // Towards Tulip 1st gate
            graph.addEdge(161, 162, 4);  // 1st gate of Tulip
            graph.addEdge(159, 163, 17); // Towards 11th block
            graph.addEdge(163, 164, 3);  // Towards 11th block 1st gate
            graph.addEdge(164, 165, 21); // 11th and 10th block
            graph.addEdge(165, 166, 23); // Towards Gandhi Chowk 9th and 10th block
            graph.addEdge(166, 167, 36); // Towards Gandhi Chowk 9th block
            graph.addEdge(167, 168, 33); // Towards Gandhi Chowk 9th last gate
            graph.addEdge(168, 184, 4);  // Towards play school
            graph.addEdge(184, 185, 8);  // Towards amphitheater
            graph.addEdge(185, 186, 13); // Towards 9th block
            graph.addEdge(185, 24, 13);  // Towards 3rd block
            graph.addEdge(186, 27, 4);   // Towards 9th block main entrance
            graph.addEdge(186, 25, 12);  // Towards 3rd block
            graph.addEdge(187, 167, 5);  // Mid gate of 9th block
            graph.addEdge(188, 179, 4);  // Back gate stair of 9th block
            graph.addEdge(179, 189, 8);  // Stair main gate of 10th block
            graph.addEdge(189, 190, 3);  // Main gate of 10th block
            graph.addEdge(188, 191, 8);  // Back gate of 9th block
            graph.addEdge(191, 192, 34); // Towards mid of 9th block
            graph.addEdge(192, 187, 11); // Mid gate of 9th block
            graph.addEdge(192, 182, 31); // Front gate of 9th block
            graph.addEdge(190, 193, 27); // Mid of 10th block
            graph.addEdge(193, 176, 24); // End gate of 10th block
            graph.addEdge(193, 194, 11); // Mid gate of 10th block
            graph.addEdge(194, 195, 3);  // Between 11th and 10th block
            graph.addEdge(195, 196, 5);  // Downside gate of 11th block
            graph.addEdge(196, 197, 4);  // Towards 11th block stairs
            graph.addEdge(197, 198, 6);  // Towards 11th block stairs
            graph.addEdge(198, 199, 4);  // Towards 11th block stairs
            graph.addEdge(199, 200, 20); // Towards 11th block main gate
            graph.addEdge(200, 201, 4);  // Towards 11th block gate
            graph.addEdge(201, 202, 1);  // Towards main gate of 11th block
            graph.addEdge(202, 203, 3);  // Main gate of 11th block
            graph.addEdge(202, 204, 12); // Towards intersection part
            graph.addEdge(203, 205, 2);  // Towards main road
            graph.addEdge(205, 164, 16); // 11th block main road
            graph.addEdge(175, 195, 23); // Backroad of 11th and 10th block
            graph.addEdge(165, 206, 19); // Main road towards mid of 11th and 10th block
            graph.addEdge(206, 207, 3);  // Towards mid of 10th and 11th block
            graph.addEdge(207, 195, 23); // Mid of 10th and 11th block
            graph.addEdge(170, 204, 18); // Intersection point
            graph.addEdge(170, 208, 17); // Towards 3rd gate of 11th block
            graph.addEdge(170, 209, 19); // Mid gate of 11th block
            graph.addEdge(208, 210, 8);  // Last gate to entrance
            graph.addEdge(210, 211, 3);  // Last gate inside 11th block
            graph.addEdge(211, 212, 8);  // Inside 11th block
            graph.addEdge(212, 213, 25); // Inside 11th block
            graph.addEdge(213, 214, 23); // Mid gate of 11th block
            graph.addEdge(214, 209, 4);  // Mid gate entrance
            graph.addEdge(214, 215, 25); // Towards main gate of 11th block
            graph.addEdge(215, 199, 5);  // Towards stair of 11th block
            graph.addEdge(30, 216, 6);   // Towards Frisco
            graph.addEdge(216, 217, 4);  // Towards 3rd block
            graph.addEdge(216, 218, 7);  // Towards Frisco
            graph.addEdge(219, 31, 10);  // Towards 5th block
            graph.addEdge(219, 220, 5);  // 5th block gate
            graph.addEdge(219, 221, 7);  // Towards Frisco
            graph.addEdge(221, 222, 6);  // Towards Frisco entrance
            graph.addEdge(218, 222, 5);  // Towards Frisco entrance
            graph.addEdge(222, 223, 3);  // Frisco entrance
            graph.addEdge(218, 224, 16); //
            graph.addEdge(221, 225, 16); //
            graph.addEdge(218, 225, 18); 
            graph.addEdge(224, 221, 18); //
            graph.addEdge(224, 225, 12); //
            graph.addEdge(225, 85, 16); 
            graph.addEdge(224, 72, 15); //
            graph.addEdge(225, 226, 29); //
            graph.addEdge(226, 81, 5); 
            graph.addEdge(226, 227, 8); //
            graph.addEdge(227, 228, 6); //
            graph.addEdge(228, 229, 4);
            graph.addEdge(228, 224, 27); 
            graph.addEdge(229, 76, 4);
            graph.addEdge(228, 77, 4); 
            graph.addEdge(227, 230, 3); 
            graph.addEdge(231, 50, 12);
            graph.addEdge(231, 48, 9);
        
        }
        
        else{
            return 0;
        }

    const route = aStar(graph, sourceNode, targetNode);
    const resultElement = document.getElementById("result");

    if (!resultElement) return;

    if (!route) {
        drawRouteOnMap([]);
        resultElement.textContent =
            "No route found for the selected options. Try another route preference.";
        return;
    }

    drawRouteOnMap(route.path);

    resultElement.innerHTML =
        `<strong>Shortest path found.</strong><br>` +
        `Distance: <b>${route.distance}</b><br><br>` +
        `<strong>Path:</strong><br>${route.path.join(" → ")}`;
}

