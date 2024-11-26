"""
Ricardo Alfredo Calvo Perez - A01028889
Andrés Eduardo Gomes Brandt - A01781321
18/11/2024

In this file we are going to set up the Server, as well
as defining the objects that translate the agent and model
into a browser visualization:
"""
from agents import Car, Traffic_Light, Road, Obstacle, Destination
from model import City
from mesa.visualization import CanvasGrid, BarChartModule
from mesa.visualization import ModularServer


def agent_portrayal(agent):
    if agent is None:
        return

    portrayal = {"Shape": "rect",
                 "Filled": "true",
                 "Layer": 1,
                 "w": 1,
                 "h": 1

                 }

    if (isinstance(agent, Car)):
        portrayal["Shape"] = "circle"
        portrayal["Filled"] = "true"
        portrayal["r"] = 0.69
        portrayal["Layer"] = 1
        portrayal["Color"] = "purple"
    if (isinstance(agent, Road)):
        portrayal["Color"] = "grey"
        portrayal["Layer"] = 0

    if (isinstance(agent, Traffic_Light)):
        portrayal["Color"] = "red" if not agent.condition else "green"
        portrayal["Layer"] = 0
        portrayal["w"] = 0.8
        portrayal["h"] = 0.8

    if (isinstance(agent, Obstacle)):
        portrayal["Color"] = "cadetblue"
        portrayal["Layer"] = 0
        portrayal["w"] = 0.8
        portrayal["h"] = 0.8
    if (isinstance(agent, Destination)):
        portrayal["Color"] = "pink"
        portrayal["Layer"] = 0
        portrayal["w"] = 0.8
        portrayal["h"] = 0.8

    return portrayal


with open('city_files/2022_base.txt') as baseFile:
    lines = [line.strip() for line in baseFile]  # Remove newline characters
    width = len(lines[0])  # Correct width without '\n'
    height = len(lines)  # Number of lines gives the height

model_params = {
    "width": width,
    "height": height,
}


print(width, height)
grid = CanvasGrid(agent_portrayal, width, height, 500, 500)

server = ModularServer(City, [grid], "Traffic Base", model_params)

server.port = 8889  # The default
server.launch()
