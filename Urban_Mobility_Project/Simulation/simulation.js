/*
Ricardo Alfredo Calvo Perez - A01028889
19/11/2024

WebGl frontend simulation
*/

'use strict';

import * as twgl from 'twgl-base.js';
import GUI from 'lil-gui';
import { v3, m4 } from './libs/3D_libs.js';

// Define the shader code, using GLSL 3.00
import vsGLSL from './Assets/Shaders/vs_phong.glsl';
import fsGLSL from './Assets/Shaders/fs_phong.glsl?raw';

import { load_obj } from "./Assets/ExtraFunctions/load_obj.js";

import building from "../Objects/building1.obj?raw";
import car from "../Objects/car.obj?raw";

// Objects
const Objects = {
  'car': {
    'model': {
      data: car,
      color: [Math.random(), Math.random(), Math.random(), 1],
      shininess: 100,
      texture: undefined
    },
    'transforms': {
      t: { x: 0, y: 0, z: 0 },
      rd: { x: 0, y: 0, z: 0 },
      rr: { x: 0, y: 0, z: 0 },
      s: { x: 0, y: 0, z: 0 },
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
    'transforms': {
      t: { x: 0, y: 0, z: 0 },
      rd: { x: 0, y: 0, z: 0 },
      rr: { x: 0, y: 0, z: 0 },
      s: { x: 0, y: 0, z: 0 },
    },
    'arrays': undefined,
    'vao': undefined,
    'bufferInfo': undefined,
    'texture': undefined,
  }
}


// Global Variables
// Define the agent server URI
const agent_server_uri = "http://localhost:8585/";

// Initialize arrays to store agents and obstacles
const agents = [];
const obstacles = [];

// Initialize WebGL-related variables
let gl, programInfo, carArrays, buildingArrays, agentsBufferInfo, obstaclesBufferInfo, agentsVao, obstaclesVao;

// Define the camera position
let cameraPosition = { x: 0, y: 10, z: 10 };

// Initialize the frame count
let frameCount = 0;

// Define the data object
const data = {
  NAgents: 1,
  width: 22,
  height: 25
};

// Main function to initialize and run the application
async function main() {
  const canvas = document.querySelector('canvas');
  gl = canvas.getContext('webgl2');

  // Create the program information using the vertex and fragment shaders
  programInfo = twgl.createProgramInfo(gl, [vsGLSL, fsGLSL]);

  // Generate the agent and obstacle data
  carArrays = load_obj(car);
  buildingArrays = load_obj(building);

  // Create buffer information from the agent and obstacle data
  agentsBufferInfo = twgl.createBufferInfoFromArrays(gl, carArrays);
  obstaclesBufferInfo = twgl.createBufferInfoFromArrays(gl, buildingArrays);

  // Create vertex array objects (VAOs) from the buffer information
  agentsVao = twgl.createVAOFromBufferInfo(gl, programInfo, agentsBufferInfo);
  obstaclesVao = twgl.createVAOFromBufferInfo(gl, programInfo, obstaclesBufferInfo);

  // Set up the user interface
  setupUI();

  // Initialize the agents model
  await initAgentsModel();

  // Get the agents and obstacles
  await getAgents();
  await getObstacles();

  // Draw the scene
  await drawScene(gl, programInfo, agentsVao, agentsBufferInfo, obstaclesVao, obstaclesBufferInfo);
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
      if (agents.length == 0) {
        // Create new agents and add them to the agents array
        for (const agent of result.positions) {
          const newAgent = new Object3D(agent.id, [agent.x, agent.y, agent.z])
          agents.push(newAgent)
        }
        // Log the agents array
        console.log("Agents:", agents)

      } else {
        // Update the positions of existing agents
        for (const agent of result.positions) {
          const current_agent = agents.find((object3d) => object3d.id == agent.id)

          // Check if the agent exists in the agents array
          if (current_agent != undefined) {
            // Update the agent's position
            current_agent.position = [agent.x, agent.y, agent.z]
          }
        }
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
        const newObstacle = new Object3D(obstacle.id, [obstacle.x, obstacle.y, obstacle.z])
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
async function drawScene(gl, programInfo, agentsVao, agentsBufferInfo, obstaclesVao, obstaclesBufferInfo) {
  // Resize the canvas to match the display size
  twgl.resizeCanvasToDisplaySize(gl.canvas);

  // Set the viewport to match the canvas size
  gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);

  // Set the clear color and enable depth testing
  gl.clearColor(0.2, 0.2, 0.2, 1);
  gl.enable(gl.DEPTH_TEST);

  // Clear the color and depth buffers
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

  // Use the program
  gl.useProgram(programInfo.program);

  // Set up the view-projection matrix
  const viewProjectionMatrix = setupWorldView(gl);

  // Set the distance for rendering
  const distance = 1

  // Draw the agents
  drawAgents(distance, agentsVao, agentsBufferInfo, viewProjectionMatrix)
  // Draw the obstacles
  drawObstacles(distance, obstaclesVao, obstaclesBufferInfo, viewProjectionMatrix)

  // Increment the frame count
  frameCount++

  // Update the scene every 30 frames
  if (frameCount % 30 == 0) {
    frameCount = 0
    await update()
  }

  // Request the next frame
  requestAnimationFrame(() => drawScene(gl, programInfo, agentsVao, agentsBufferInfo, obstaclesVao, obstaclesBufferInfo))
}

/*
 * Draws the agents.
 *
 * @param {Number} distance - The distance for rendering.
 * @param {WebGLVertexArrayObject} agentsVao - The vertex array object for agents.
 * @param {Object} agentsBufferInfo - The buffer information for agents.
 * @param {Float32Array} viewProjectionMatrix - The view-projection matrix.
 */
function drawAgents(distance, agentsVao, agentsBufferInfo, viewProjectionMatrix) {
  // Bind the vertex array object for agents
  gl.bindVertexArray(agentsVao);

  // Iterate over the agents
  for (const agent of agents) {
    // Calculate the agent's position
    let x = agent.position[0] * distance, y = agent.position[1] * distance, z = agent.position[2]

    // Create the agent's transformation matrix
    const cube_trans = twgl.v3.create(...agent.position);
    const cube_scale = twgl.v3.create(...agent.scale);

    // Calculate the agent's matrix
    agent.matrix = twgl.m4.translate(viewProjectionMatrix, cube_trans);
    agent.matrix = twgl.m4.rotateX(agent.matrix, agent.rotation[0]);
    agent.matrix = twgl.m4.rotateY(agent.matrix, agent.rotation[1]);
    agent.matrix = twgl.m4.rotateZ(agent.matrix, agent.rotation[2]);
    agent.matrix = twgl.m4.scale(agent.matrix, cube_scale);

    // Set the uniforms for the agent
    let uniforms = {
      u_matrix: agent.matrix,
    }

    // Set the uniforms and draw the agent
    twgl.setUniforms(programInfo, uniforms);
    twgl.drawBufferInfo(gl, agentsBufferInfo);

  }
}


/*
 * Draws the obstacles.
 *
 * @param {Number} distance - The distance for rendering.
 * @param {WebGLVertexArrayObject} obstaclesVao - The vertex array object for obstacles.
 * @param {Object} obstaclesBufferInfo - The buffer information for obstacles.
 * @param {Float32Array} viewProjectionMatrix - The view-projection matrix.
 */
function drawObstacles(distance, obstaclesVao, obstaclesBufferInfo, viewProjectionMatrix) {
  // Bind the vertex array object for obstacles
  gl.bindVertexArray(obstaclesVao);

  // Iterate over the obstacles
  for (const obstacle of obstacles) {
    // Create the obstacle's transformation matrix
    const cube_trans = twgl.v3.create(...obstacle.position);
    const cube_scale = twgl.v3.create(...obstacle.scale);

    // Calculate the obstacle's matrix
    obstacle.matrix = twgl.m4.translate(viewProjectionMatrix, cube_trans);
    obstacle.matrix = twgl.m4.rotateX(obstacle.matrix, obstacle.rotation[0]);
    obstacle.matrix = twgl.m4.rotateY(obstacle.matrix, obstacle.rotation[1]);
    obstacle.matrix = twgl.m4.rotateZ(obstacle.matrix, obstacle.rotation[2]);
    obstacle.matrix = twgl.m4.scale(obstacle.matrix, cube_scale);

    // Set the uniforms for the obstacle
    let uniforms = {
      u_matrix: obstacle.matrix,
    }

    // Set the uniforms and draw the obstacle
    twgl.setUniforms(programInfo, uniforms);
    twgl.drawBufferInfo(gl, obstaclesBufferInfo);

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
  posFolder.add(cameraPosition, 'y', -50, 50)
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


main()