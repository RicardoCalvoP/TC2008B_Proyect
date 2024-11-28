'use strict';

import * as twgl from 'twgl.js';
import GUI from 'lil-gui';

import { load_obj } from "./Assets/ExtraFunctions/load_obj.js";
import { v3, m4 } from "./libs/3D_libs.js";

import building from "../Objects/building1.obj?raw";
import car from "../Objects/Tank1.obj?raw";
import cube from "../Objects/cube_normals.obj?raw";


// import vsGLSL from './Assets/Shaders/vs_color.glsl?raw'
// import fsGLSL from './Assets/Shaders/fs_color.glsl?raw'
import vsGLSL from './Assets/Shaders/vs_phong.glsl?raw'
import fsGLSL from './Assets/Shaders/fs_phong.glsl?raw'

const Objects = {
  'car': {
    'model': {
      data: car,
      color: [0.7569, 0.0235, 0.0275, 1],
      shininess: 100,
    },
    'vao': undefined,
    'bufferInfo': undefined,
  },
  'building': {
    'model': {
      data: building,
      color: [0., 0.3, 0.3, 1],
      shininess: 50,
    },
    'vao': undefined,
    'bufferInfo': undefined,

  },
  'traffic_light': {
    'model': {
      data: building,
      color: [0.5, 0.5, 0.5, 1],
      shininess: 50,
    },
    'vao': undefined,
    'bufferInfo': undefined,
  },
  'road': {
    'model': {
      data: building,
      color: [0.1, 0.1, 0.1, 1],
      shininess: 50,
    },
    'vao': undefined,
    'bufferInfo': undefined,
  },
  'destination': {
    'model': {
      data: building,
      color: [0.5, 0.5, 0.5, 1],
      shininess: 50,
    },
    'vao': undefined,
    'bufferInfo': undefined,
  }

}

// Define the camera position
const settings = {
  cameraPosition: {
    x: 0,
    y: 40,
    z: 0.01,
  },
  lightPosition: {
    x: 20,
    y: 30,
    z: 20,
  },
  ambientColor: [0.5, 0.5, 0.5, 1.0],
  diffuseColor: [0.5, 0.5, 0.5, 1.0],
  specularColor: [0.5, 0.5, 0.5, 1.0],
};

class Car {
  constructor(id, position = [0, 0, 0], rotation = [0, 0, 0], scale = [0.075, 0.075, 0.075]) {
    this.id = id;
    this.position = position;
    this.lastPosition = position;
    this.scale = scale;
    this.rotation = rotation;
    this.color = Objects.car.model.color;
    this.shininess = Objects.car.model.shininess;
    this.matrix = m4.identity();
  }
}
class Obstacle {
  constructor(id, position = [0, 0, 0], rotation = [0, 0, 0], scale = [0.5, 1, 0.5]) {
    this.id = id;
    this.position = position;
    this.scale = scale;
    this.rotation = rotation;
    this.color = Objects.building.model.color;
    this.shininess = Objects.building.model.shininess;
    this.matrix = twgl.m4.create();
  }
}
class TrafficLight {
  constructor(id, position = [0, 0, 0], rotation = [0, 0, 0], scale = [0.2, 0.2, 0.2]) {
    this.id = id;
    this.position = position;
    this.scale = scale;
    this.rotation = rotation;
    this.color = Objects.traffic_light.model.color;
    this.shininess = Objects.traffic_light.model.shininess;
    this.matrix = twgl.m4.create();
  }
}
class Road {
  constructor(id, position = [0, 0, 0], rotation = [0, 0, 0], scale = [0.5, 0.01, 0.5]) {
    this.id = id;
    this.position = position;
    this.scale = scale;
    this.rotation = rotation;
    this.color = Objects.road.model.color;
    this.shininess = Objects.road.model.shininess;
    this.matrix = twgl.m4.create();
  }
}


// Define the agent server URI
const agent_server_uri = "http://localhost:8585/";

// Initialize arrays to store agents and obstacles
let agents = [];
let trafficLights = [];
const obstacles = [];
const roads = [];
const destinations = [];

// Initialize WebGL-related variables
let gl, programInfo, agentArrays, cubeArray, buildingArray;

// Initialize the frame count
let frameCount = 0;

// Define the data object

const data = {
  width: 30,
  height: 30
};

// Main function to initialize and run the application
async function main() {
  const canvas = document.querySelector('canvas');
  gl = canvas.getContext('webgl2');

  // Create the program information using the vertex and fragment shaders
  programInfo = twgl.createProgramInfo(gl, [vsGLSL, fsGLSL]);

  // Generate the agent and obstacle data
  agentArrays = load_obj(car);
  buildingArray = load_obj(building);
  cubeArray = load_obj(cube);

  // Create buffer information from the agent and obstacle data
  Objects.car.bufferInfo = twgl.createBufferInfoFromArrays(gl, agentArrays);
  Objects.building.bufferInfo = twgl.createBufferInfoFromArrays(gl, cubeArray);
  Objects.traffic_light.bufferInfo = twgl.createBufferInfoFromArrays(gl, cubeArray);
  Objects.road.bufferInfo = twgl.createBufferInfoFromArrays(gl, cubeArray);
  Objects.destination.bufferInfo = twgl.createBufferInfoFromArrays(gl, cubeArray);

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
        newAgent.lastPosition = [agent.lastPosition[0], 0.5, agent.lastPosition[1]];
        agents.push(newAgent)
      }

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
        newDestination.color = [0.8, 0.72, 0.18, 1]
        destinations.push(newDestination)
      }

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

    }

  } catch (error) {
    // Log any errors that occur during the request
    console.log(error)
  }
}

function calculateAngle(lastPosition, position) {
  const vec1 = v3.subtract(position, lastPosition)
  const vec2 = v3.create(0, 0, 1)
  const u = v3.normalize(vec1);
  const v = v3.normalize(vec2);

  const dotProduct = v3.dot(u, v);
  const clampedDot = Math.min(Math.max(dotProduct, -1.0), 1.0);

  return Math.acos(clampedDot);
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

  // Variable with the position of the light
  let v3_lightPosition = v3.create(settings.lightPosition.x,
    settings.lightPosition.y,
    settings.lightPosition.z);

  let v3_cameraPosition = v3.create(settings.cameraPosition.x,
    settings.cameraPosition.y,
    settings.cameraPosition.z);



  let globalUniforms = {
    u_viewWorldPosition: v3_cameraPosition,
    u_lightWorldPosition: v3_lightPosition,
    u_ambientLight: settings.ambientColor,
    u_diffuseLight: settings.diffuseColor,
    u_specularLight: settings.specularColor,
  };
  twgl.setUniforms(programInfo, globalUniforms);

  const viewProjectionMatrix = setupWorldView(gl);

  drawCar(agents, Objects.car.vao, Objects.car.bufferInfo, viewProjectionMatrix);
  drawAgent(obstacles, Objects.building.vao, Objects.building.bufferInfo, viewProjectionMatrix);
  drawAgent(trafficLights, Objects.traffic_light.vao, Objects.traffic_light.bufferInfo, viewProjectionMatrix);
  drawAgent(roads, Objects.road.vao, Objects.road.bufferInfo, viewProjectionMatrix);
  drawAgent(destinations, Objects.destination.vao, Objects.destination.bufferInfo, viewProjectionMatrix);

  frameCount++;
  if (frameCount % 1 == 0) {
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
    agent.matrix = twgl.m4.translate(m4.identity(), trans);
    agent.matrix = twgl.m4.rotateX(agent.matrix, agent.rotation[0]);
    agent.matrix = twgl.m4.rotateY(agent.matrix, agent.rotation[1]);
    agent.matrix = twgl.m4.rotateZ(agent.matrix, agent.rotation[2]);
    agent.matrix = twgl.m4.scale(agent.matrix, scale);

    let worldViewProjection = m4.multiply(viewProjectionMatrix, agent.matrix);
    // Set the uniforms for the agent PHONG
    let uniforms = {
      u_world: agent.matrix,
      u_worldViewProjection: worldViewProjection,
      u_ambientColor: agent.color,
      u_diffuseColor: agent.color,
      u_specularColor: agent.color,
      u_shininess: agent.shininess,
    }

    // Set the uniforms and draw the agent
    twgl.setUniforms(programInfo, uniforms);
    twgl.drawBufferInfo(gl, inBufferInfo);
  }
}
function drawCar(list, inVao, inBufferInfo, viewProjectionMatrix) {
  gl.bindVertexArray(inVao);

  for (const agent of list) {
    // Create the agent's transformation matrix

    const trans = twgl.v3.create(...agent.position);
    const scale = twgl.v3.create(...agent.scale);
    const angle = calculateAngle(agent.lastPosition, agent.position);
    agent.rotation[1] = m4.rotationY(angle)
    // Calculate the agent's matrix
    agent.matrix = twgl.m4.translate(m4.identity(), trans);
    agent.matrix = twgl.m4.rotateX(agent.matrix, agent.rotation[0]);
    agent.matrix = m4.multiply(agent.matrix, agent.rotation[1]);
    agent.matrix = twgl.m4.rotateZ(agent.matrix, agent.rotation[2]);
    agent.matrix = twgl.m4.scale(agent.matrix, scale);

    let worldViewProjection = m4.multiply(viewProjectionMatrix, agent.matrix);
    // Set the uniforms for the agent PHONG
    let uniforms = {
      u_world: agent.matrix,
      u_worldViewProjection: worldViewProjection,
      u_ambientColor: agent.color,
      u_diffuseColor: agent.color,
      u_specularColor: agent.color,
      u_shininess: agent.shininess,
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
  const camPos = twgl.v3.create(settings.cameraPosition.x + data.width / 2, settings.cameraPosition.y, settings.cameraPosition.z + data.height / 2)

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
  posFolder.add(settings.cameraPosition, 'x', -50, 50)
    .onChange(value => {
      // Update the camera position when the slider value changes
      settings.cameraPosition.x = value
    });
  posFolder.add(settings.cameraPosition, 'y', -10, 75)
    .onChange(value => {
      // Update the camera position when the slider value changes
      settings.cameraPosition.y = value
    });
  posFolder.add(settings.cameraPosition, 'z', -0.01, 50)
    .onChange(value => {
      // Update the camera position when the slider value changes
      settings.cameraPosition.z = value
    });

  const lightFolder = gui.addFolder('Light:')
  lightFolder.add(settings.lightPosition, 'x', -20, 20)
    .decimals(2)
  lightFolder.add(settings.lightPosition, 'y', -20, 30)
    .decimals(2)
  lightFolder.add(settings.lightPosition, 'z', -20, 20)
    .decimals(2)
  lightFolder.addColor(settings, 'ambientColor')
  lightFolder.addColor(settings, 'diffuseColor')
  lightFolder.addColor(settings, 'specularColor')
}


main()