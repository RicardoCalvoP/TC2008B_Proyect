"""
Ricardo Alfredo Calvo Perez y  Andrés Eduardo Gomes Brandt
18/11/2024

In this file we will find the base model of our simulation
"""

from mesa import Model, agent
from mesa.time import RandomActivation
from mesa.space import MultiGrid
from .agents import Car, TrafficLight, Road, Building


class City(Model):
    """
    Creates a model with the agents
    [More description]
    """

    def __init__(self, num_cars, path, pathDict):
        super().__init__(seed=42)  # Ask what seed=42 means
        self.num_cars = num_cars  # With how many cars are we going to start the simulation
        # Ask if is better multigrid
        self.running = True
        light_change = 7
        try:

            # Load the map dictionary. The dictionary maps the characters in the map file to the corresponding agent.
            dataDictionary = json.load(open(pathDict))

            self.traffic_lights = []

            # Load the map file. The map file is a text file where each character represents an agent.
            with open(path) as baseFile:
                lines = baseFile.readlines()
                self.width = len(lines[0])-1
                self.height = len(lines)

                self.grid = MultiGrid(self.width, self.height, torus = False) 
                self.schedule = RandomActivation(self)

                # Goes through each character in the map file and creates the corresponding agent.
                for r, row in enumerate(lines):
                    for c, col in enumerate(row):
                        if col in ["v", "^", ">", "<"]:
                            agent = Road(f"r_{r*self.width+c}", self, dataDictionary[col], Road, 1000+r*self.width+c)
                            self.grid.place_agent(agent, (c, self.height - r - 1))

                        elif col in ["S", "s"]:
                            agent = Traffic_Light(f"tl_{r*self.width+c}", self, False if col == "S" else True, int(dataDictionary[col]), light_change)
                            self.grid.place_agent(agent, (c, self.height - r - 1))
                            self.schedule.add(agent)
                            self.traffic_lights.append(agent)

                        elif col == "#":
                            agent = Obstacle(f"ob_{r*self.width+c}", self)
                            self.grid.place_agent(agent, (c, self.height - r - 1))

                        elif col == "D":
                            agent = Destination(f"d_{r*self.width+c}", self)
                            self.grid.place_agent(agent, (c, self.height - r - 1))

            self.num_agents = N
            self.running = True
        except FileNotFoundError:
                print(f"Error: No se encontró el archivo en {file_path}.")
        except Exception as e:
                print(f"Error inesperado: {e}")
    def step(self):
        '''Advance the model by one step.'''
        self.schedule.step()
