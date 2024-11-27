'use strict';

import * as twgl from 'twgl.js';
import GUI from 'lil-gui';

import { load_obj } from "./Assets/ExtraFunctions/load_obj.js";

import building from "../Objects/building1.obj?raw";
import car from "../Objects/car.obj?raw";

// Define the vertex shader code, using GLSL 3.00
const vsGLSL = `#version 300 es
in vec4 a_position;

// in vec4 a_color;

uniform vec4 u_color;
uniform mat4 u_transforms;
uniform mat4 u_matrix;

out vec4 v_color;

void main() {
gl_Position = u_matrix * a_position;
v_color = u_color;
}
`;

// Define the fragment shader code, using GLSL 3.00
const fsGLSL = `#version 300 es
precision highp float;

in vec4 v_color;

out vec4 outColor;

void main() {
outColor = v_color;
}
`;

const Objects = {
  'car': {
    'model': {
      data: car,
      color: [Math.random(), Math.random(), Math.random(), 1],
      shininess: 100,
      texture: undefined
    },
    'arrays': undefined,
    'vao': undefined,
    'bufferInfo': undefined,
    'texture': undefined,
    'id': undefined
  },
  'building': {
    'model': {
      data: building,
      color: [0.5, 0.5, 0.5, 1],
      shininess: 50,
      texture: undefined
    },
    'arrays': undefined,
    'vao': undefined,
    'bufferInfo': undefined,
    'texture': undefined,
  },
  'traffic_light': {
    'model': {
      data: building,
      color: [0.5, 0.5, 0.5, 1],
      shininess: 50,
      texture: undefined
    },
    'arrays': undefined,
    'vao': undefined,
    'bufferInfo': undefined,
    'texture': undefined,
  },
  'road': {
    'model': {
      data: building,
      color: [0.5, 0.5, 0.5, 1],
      shininess: 50,
      texture: undefined
    },
    'arrays': undefined,
    'vao': undefined,
    'bufferInfo': undefined,
    'texture': undefined,
  },
  'destination': {
    'model': {
      data: building,
      color: [0.5, 0.5, 0.5, 1],
      shininess: 50,
      texture: undefined
    },
    'arrays': undefined,
    'vao': undefined,
    'bufferInfo': undefined,
    'texture': undefined,
  }

}

class Car {
  constructor(id, position = [0, 0, 0], rotation = [0, 0, 0], scale = [0.25, 0.25, 0.15]) {
    this.id = id;
    this.position = position;
    this.scale = scale;
    this.rotation = rotation;
    this.color = [0.7569, 0.0235, 0.0275, 1];
    this.matrix = twgl.m4.create();
  }
}
class Obstacle {
  constructor(id, position = [0, 0, 0], rotation = [0, 0, 0], scale = [1, 1, 1]) {
    this.id = id;
    this.position = position;
    this.scale = scale;
    this.rotation = rotation;
    this.color = [0., 0.3, 0.3, 1];
    this.matrix = twgl.m4.create();
  }
}
class TrafficLight {
  constructor(id, position = [0, 0, 0], rotation = [0, 0, 0], scale = [0.2, 0.2, 0.2]) {
    this.id = id;
    this.position = position;
    this.scale = scale;
    this.rotation = rotation;
    this.color = [0.5, 0.5, 0.5, 1];
    this.matrix = twgl.m4.create();
  }
}
class Road {
  constructor(id, position = [0, 0, 0], rotation = [0, 0, 0], scale = [1, 0.01, 1]) {
    this.id = id;
    this.position = position;
    this.scale = scale;
    this.rotation = rotation;
    this.color = [0.5, 0.5, 0.5, 1];
    this.matrix = twgl.m4.create();
  }
}


// Define the agent server URI
const agent_server_uri = "http://localhost:8585/";

// Initialize arrays to store agents and obstacles
let agents = [];
const obstacles = [];
let trafficLights = [];
const roads = [];
const destinations = [];

// Initialize WebGL-related variables
let gl, programInfo, agentArrays, obstacleArrays, box;

// Define the camera position
let cameraPosition = { x: 0, y: 25, z: 20 };
// Initialize the frame count
let frameCount = 0;

// Define the data object

const data = {
  width: 24,
  height: 25
};

// Main function to initialize and run the application
async function main() {
  const canvas = document.querySelector('canvas');
  gl = canvas.getContext('webgl2');

  // Create the program information using the vertex and fragment shaders
  programInfo = twgl.createProgramInfo(gl, [vsGLSL, fsGLSL]);

  // Generate the agent and obstacle data
  agentArrays = load_obj(car);
  obstacleArrays = load_obj(building);
  box = generateObstacleData(1);

  // Create buffer information from the agent and obstacle data
  Objects.car.bufferInfo = twgl.createBufferInfoFromArrays(gl, agentArrays);
  Objects.building.bufferInfo = twgl.createBufferInfoFromArrays(gl, box);
  Objects.traffic_light.bufferInfo = twgl.createBufferInfoFromArrays(gl, box);
  Objects.road.bufferInfo = twgl.createBufferInfoFromArrays(gl, box);
  Objects.destination.bufferInfo = twgl.createBufferInfoFromArrays(gl, box);

  // Create vertex array objects (VAOs) from the buffer information
  Objects.car.vao = twgl.createVAOFromBufferInfo(gl, programInfo, Objects.car.bufferInfo);
  Objects.building.vao = twgl.createVAOFromBufferInfo(gl, programInfo, Objects.building.bufferInfo);
  Objects.traffic_light.vao = twgl.createVAOFromBufferInfo(gl, programInfo, Objects.traffic_light.bufferInfo);
  Objects.road.vao = twgl.createVAOFromBufferInfo(gl, programInfo, Objects.road.bufferInfo);
  Objects.destination.vao = twgl.createVAOFromBufferInfo(gl, programInfo, Objects.destination.bufferInfo);

  // Set up the user interface
  setupUI();

  // Initialize the agents model
  await initAgentsModel();

  // Get the agents and obstacles
  await getAgents();
  await getObstacles();
  await getTrafficLights();
  await getRoads();
  await getDestination();

  // Draw the scene
  await drawScene(gl, Objects);
}

/*
 * Initializes the agents model by sending a POST request to the agent server.
 */
async function initAgentsModel() {
  try {
    // Send a POST request to the agent server to initialize the model
    let response = await fetch(agent_server_uri + "init", {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    })

    // Check if the response was successful
    if (response.ok) {
      // Parse the response as JSON and log the message
      let result = await response.json()
      console.log(result.message)
    }

  } catch (error) {
    // Log any errors that occur during the request
    console.log(error)
  }
}

/*
 * Retrieves the current positions of all agents from the agent server.
 */
async function getAgents() {
  try {
    // Send a GET request to the agent server to retrieve the agent positions
    let response = await fetch(agent_server_uri + "getAgents")

    // Check if the response was successful
    if (response.ok) {
      // Parse the response as JSON
      let result = await response.json()

      // Log the agent positions
      console.log(result.positions)

      // Check if the agents array is empty

      agents = []

      for (const agent of result.positions) {
        const newAgent = new Car(agent.id, [agent.x, agent.y, agent.z])
        agents.push(newAgent)
      }
      // Log the agents array
      console.log("Agents:", agents)


    }

  } catch (error) {
    // Log any errors that occur during the request
    console.log(error)
  }
}

/*
 * Retrieves the current positions of all obstacles from the agent server.
 */
async function getObstacles() {
  try {
    // Send a GET request to the agent server to retrieve the obstacle positions
    let response = await fetch(agent_server_uri + "getObstacles")

    // Check if the response was successful
    if (response.ok) {
      // Parse the response as JSON
      let result = await response.json()

      // Create new obstacles and add them to the obstacles array
      for (const obstacle of result.positions) {
        const newObstacle = new Obstacle(obstacle.id, [obstacle.x, obstacle.y, obstacle.z]);
        obstacles.push(newObstacle)
      }
      // Log the obstacles array
      console.log("Obstacles:", obstacles)
    }

  } catch (error) {
    // Log any errors that occur during the request
    console.log(error)
  }
}


async function getTrafficLights() {
  try {
    // Send a GET request to the agent server to retrieve the obstacle positions
    let response = await fetch(agent_server_uri + "getTrafficLights")

    // Check if the response was successful
    if (response.ok) {
      // Parse the response as JSON
      let result = await response.json()
      // Create new obstacles and add them to the obstacles array

      trafficLights = []

      for (const trafficLight of result.positions) {
        const newTrafficLight = new TrafficLight(trafficLight.id, [trafficLight.x, trafficLight.y, trafficLight.z])
        newTrafficLight.color = trafficLight.condition ? [0, 1, 0, 1] : [1, 0, 0, 1]
        trafficLights.push(newTrafficLight)
      }
      // Log the obstacles array
      console.log("TrafficLights:", trafficLights)
    }

  } catch (error) {
    // Log any errors that occur during the request
    console.log(error)
  }
}

async function getRoads() {
  try {
    // Send a GET request to the agent server to retrieve the obstacle positions
    let response = await fetch(agent_server_uri + "getRoads")

    // Check if the response was successful
    if (response.ok) {
      // Parse the response as JSON
      let result = await response.json()

      // Create new obstacles and add them to the obstacles array
      for (const road of result.positions) {
        const newRoad = new Road(road.id, [road.x, road.y, road.z])
        roads.push(newRoad)
      }
      // Log the obstacles array
      console.log("Roads:", roads)
    }

  } catch (error) {
    // Log any errors that occur during the request
    console.log(error)
  }
}

async function getDestination() {
  try {
    // Send a GET request to the agent server to retrieve the obstacle positions
    let response = await fetch(agent_server_uri + "getDestination")

    // Check if the response was successful
    if (response.ok) {
      // Parse the response as JSON
      let result = await response.json()

      // Create new obstacles and add them to the obstacles array
      for (const destination of result.positions) {
        const newDestination = new Road(destination.id, [destination.x, destination.y, destination.z])
        destinations.push(newDestination)
      }
      // Log the obstacles array
      console.log("TrafficLights:", destinations)
    }

  } catch (error) {
    // Log any errors that occur during the request
    console.log(error)
  }
}


/*
 * Updates the agent positions by sending a request to the agent server.
 */
async function update() {
  try {
    // Send a request to the agent server to update the agent positions
    let response = await fetch(agent_server_uri + "update")

    // Check if the response was successful
    if (response.ok) {
      // Retrieve the updated agent positions
      await getAgents()
      await getTrafficLights()
      // Log a message indicating that the agents have been updated
      console.log("Updated agents")
    }

  } catch (error) {
    // Log any errors that occur during the request
    console.log(error)
  }
}

/*
 * Draws the scene by rendering the agents and obstacles.
 *
 * @param {WebGLRenderingContext} gl - The WebGL rendering context.
 * @param {Object} programInfo - The program information.
 * @param {WebGLVertexArrayObject} agentsVao - The vertex array object for agents.
 * @param {Object} agentsBufferInfo - The buffer information for agents.
 * @param {WebGLVertexArrayObject} obstaclesVao - The vertex array object for obstacles.
 * @param {Object} obstaclesBufferInfo - The buffer information for obstacles.
 */
async function drawScene(gl, Objects) {
  twgl.resizeCanvasToDisplaySize(gl.canvas);
  gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);

  gl.clearColor(0.2, 0.2, 0.2, 1);
  gl.enable(gl.DEPTH_TEST);
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

  gl.useProgram(programInfo.program);

  const viewProjectionMatrix = setupWorldView(gl);

  drawAgent(agents, Objects.car.vao, Objects.car.bufferInfo, viewProjectionMatrix);
  drawAgent(obstacles, Objects.building.vao, Objects.building.bufferInfo, viewProjectionMatrix);
  drawAgent(trafficLights, Objects.traffic_light.vao, Objects.traffic_light.bufferInfo, viewProjectionMatrix);
  drawAgent(roads, Objects.road.vao, Objects.road.bufferInfo, viewProjectionMatrix);
  drawAgent(destinations, Objects.destination.vao, Objects.destination.bufferInfo, viewProjectionMatrix);

  frameCount++;
  if (frameCount % 30 == 0) {
    frameCount = 0;
    await update();
  }
  requestAnimationFrame(() => drawScene(gl, Objects));
}


/*
 * Draws the agents.
 *
 * @param {Number} distance - The distance for rendering.
 * @param {WebGLVertexArrayObject} agentsVao - The vertex array object for agents.
 * @param {Object} agentsBufferInfo - The buffer information for agents.
 * @param {Float32Array} viewProjectionMatrix - The view-projection matrix.
 */

function drawAgent(list, inVao, inBufferInfo, viewProjectionMatrix) {
  gl.bindVertexArray(inVao);

  for (const agent of list) {
    // Create the agent's transformation matrix
    const trans = twgl.v3.create(...agent.position);
    const scale = twgl.v3.create(...agent.scale);

    // Calculate the agent's matrix
    agent.matrix = twgl.m4.translate(viewProjectionMatrix, trans);
    agent.matrix = twgl.m4.rotateX(agent.matrix, agent.rotation[0]);
    agent.matrix = twgl.m4.rotateY(agent.matrix, agent.rotation[1]);
    agent.matrix = twgl.m4.rotateZ(agent.matrix, agent.rotation[2]);
    agent.matrix = twgl.m4.scale(agent.matrix, scale);

    // Set the uniforms for the agent
    let uniforms = {
      u_matrix: agent.matrix,
      u_color: agent.color,
    }

    // Set the uniforms and draw the agent
    twgl.setUniforms(programInfo, uniforms);
    twgl.drawBufferInfo(gl, inBufferInfo);
  }
}
/*
 * Sets up the world view by creating the view-projection matrix.
 *
 * @param {WebGLRenderingContext} gl - The WebGL rendering context.
 * @returns {Float32Array} The view-projection matrix.
 */
function setupWorldView(gl) {
  // Set the field of view (FOV) in radians
  const fov = 45 * Math.PI / 180;

  // Calculate the aspect ratio of the canvas
  const aspect = gl.canvas.clientWidth / gl.canvas.clientHeight;

  // Create the projection matrix
  const projectionMatrix = twgl.m4.perspective(fov, aspect, 1, 200);

  // Set the target position
  const target = [data.width / 2, 0, data.height / 2];

  // Set the up vector
  const up = [0, 1, 0];

  // Calculate the camera position
  const camPos = twgl.v3.create(cameraPosition.x + data.width / 2, cameraPosition.y, cameraPosition.z + data.height / 2)

  // Create the camera matrix
  const cameraMatrix = twgl.m4.lookAt(camPos, target, up);

  // Calculate the view matrix
  const viewMatrix = twgl.m4.inverse(cameraMatrix);

  // Calculate the view-projection matrix
  const viewProjectionMatrix = twgl.m4.multiply(projectionMatrix, viewMatrix);

  // Return the view-projection matrix
  return viewProjectionMatrix;
}

/*
 * Sets up the user interface (UI) for the camera position.
 */
function setupUI() {
  // Create a new GUI instance
  const gui = new GUI();

  // Create a folder for the camera position
  const posFolder = gui.addFolder('Position:')

  // Add a slider for the x-axis
  posFolder.add(cameraPosition, 'x', -50, 50)
    .onChange(value => {
      // Update the camera position when the slider value changes
      cameraPosition.x = value
    });

  // Add a slider for the y-axis
  posFolder.add(cameraPosition, 'y', -25, 25)
    .onChange(value => {
      // Update the camera position when the slider value changes
      cameraPosition.y = value
    });

  // Add a slider for the z-axis
  posFolder.add(cameraPosition, 'z', -50, 50)
    .onChange(value => {
      // Update the camera position when the slider value changes
      cameraPosition.z = value
    });
}

function generateObstacleData(size) {

  let arrays =
  {
    a_position: {
      numComponents: 3,
      data: [
        // Front Face
        -0.5, -0.5, 0.5,
        0.5, -0.5, 0.5,
        0.5, 0.5, 0.5,
        -0.5, 0.5, 0.5,

        // Back face
        -0.5, -0.5, -0.5,
        -0.5, 0.5, -0.5,
        0.5, 0.5, -0.5,
        0.5, -0.5, -0.5,

        // Top face
        -0.5, 0.5, -0.5,
        -0.5, 0.5, 0.5,
        0.5, 0.5, 0.5,
        0.5, 0.5, -0.5,

        // Bottom face
        -0.5, -0.5, -0.5,
        0.5, -0.5, -0.5,
        0.5, -0.5, 0.5,
        -0.5, -0.5, 0.5,

        // Right face
        0.5, -0.5, -0.5,
        0.5, 0.5, -0.5,
        0.5, 0.5, 0.5,
        0.5, -0.5, 0.5,

        // Left face
        -0.5, -0.5, -0.5,
        -0.5, -0.5, 0.5,
        -0.5, 0.5, 0.5,
        -0.5, 0.5, -0.5
      ].map(e => size * e)
    }
  };
  return arrays;
}


main()