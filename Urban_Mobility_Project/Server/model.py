"""
Ricardo Alfredo Calvo Perez y  Andrés Eduardo Gomes Brandt
18/11/2024

In this file we will find the base model of our simulation
"""

from mesa import Model, agent
from mesa.time import RandomActivation
from mesa.space import MultiGrid
from agents import Car, Obstacle, Traffic_Light, Road, Destination
import numpy as np
import random
import json


class City(Model):
    """
    Creates a model to control and place the agents that are part of the simulation,
    advances model by step which moves cars and changes state of traffic lights
    """

    def __init__(self, width, height):
        '''
        Creates a new model.
        Args:
            width: width of the grid
            height: height of the grid
        '''
        super().__init__(seed=42)
        self.grid = MultiGrid(width, height, torus=False)
        self.schedule = RandomActivation(self)
        self.running = True

        self.width = width
        self.height = height
        self.traffic_lights = []
        self.destinations = []
        self.carSpawns = [(0, 0), (width - 1, 0),
                          (0, height-1), (width-1, height-1)]
        self.streets = []
        self.num_cars = 0
        self.num_steps = 0
        try:

            # Load the map dictionary. The dictionary maps the characters in the map file to the corresponding agent.
            dataDictionary = json.load(open("city_files/mapDictionary.json"))

            # Load the map file. The map file is a text file where each character represents an agent.
            with open('city_files/2024_base.txt') as baseFile:
                lines = baseFile.readlines()

                # Goes through each character in the map file and creates the corresponding agent.
                for r, row in enumerate(lines):
                    for c, col in enumerate(row):
                        # Roads
                        if col in ["v", "^", ">", "<"]:
                            agent = Road(
                                f"r{r*self.width+c}", dataDictionary[col], self)
                            pos = (c, self.height - r - 1)
                            self.grid.place_agent(
                                agent, pos)
                            self.streets.append((pos, agent.direction))
                        # Traffic Ligths

                        elif col in ["S", "s"]:

                            pos = (c, self.height - r - 1)

                            if col == "S":
                                # Para semáforo "S": primero arriba, luego abajo
                                above = (pos[0], pos[1] + 1)
                                below = (pos[0], pos[1] - 1)

                                # Verificar condiciones para arriba
                                direction_above = self.get_direction_of_road(
                                    above)
                                if direction_above in ["Up", "Down"]:
                                    direction = direction_above
                                else:
                                    # Verificar condiciones para abajo
                                    direction_below = self.get_direction_of_road(
                                        below)
                                    direction = direction_below if direction_below in [
                                        "Up", "Down"] else None

                            elif col == "s":
                                # Para semáforo "s": primero izquierda, luego derecha
                                left = (pos[0] - 1, pos[1])
                                right = (pos[0] + 1, pos[1])

                                # Verificar condiciones para izquierda
                                direction_left = self.get_direction_of_road(
                                    left)
                                if direction_left in ["Left", "Right"]:
                                    direction = direction_left
                                else:
                                    # Verificar condiciones para derecha
                                    direction_right = self.get_direction_of_road(
                                        right)
                                    direction = direction_right if direction_right in [
                                        "Left", "Right"] else "Left"
                            agent = Traffic_Light(
                                f"tl{r*self.width+c}", False if col == "S" else True, int(dataDictionary[col]), direction, self)
                            pos = (c, self.height - r - 1)
                            self.grid.place_agent(
                                agent, pos)
                            self.schedule.add(agent)
                            self.traffic_lights.append(agent)
                            self.streets.append((pos, agent.direction))

                            agent = Road(
                                f"r{r*self.width+c}", direction, self)
                            self.grid.place_agent(
                                agent, pos)

                        # Buildings
                        elif col == "#":
                            agent = Obstacle(f"ob{r*self.width+c}", self)
                            pos = (c, self.height - r - 1)
                            self.grid.place_agent(
                                agent, pos)
                        # Destinations
                        elif col == "D":
                            agent = Destination(f"d{r*self.width+c}", self)
                            pos = (c, self.height - r - 1)
                            self.grid.place_agent(
                                agent, pos)
                            self.destinations.append(pos)
                            self.streets.append((pos, "destination"))

        except FileNotFoundError:
            print(f"Error: No se encontró el archivo. en model")
        except Exception as e:
            print(f"Error inesperado: {e}")
        for i in range(4):
            destination = random.choice(self.destinations)
            pos = self.carSpawns[i]
            agent = Car(f"ca{self.num_cars+1000+i}", pos,
                        destination, self)
            self.grid.place_agent(
                agent, pos)
            self.schedule.add(agent)
            self.num_cars += 1

    def get_direction_of_road(self, position):
        """
        Check if the given position contains a Road and return its direction.
        """
        if not (0 <= position[0] < self.width and 0 <= position[1] < self.height):
            return None  # Posición fuera de los límites

        agents_in_cell = self.grid.get_cell_list_contents([position])
        for agent in agents_in_cell:
            if isinstance(agent, Road):  # Verificar si es un Road
                return agent.direction  # Retornar la dirección de la carretera
        return None  # No hay un Road en esta posición

    def step(self):
        '''Advance the model by one step.'''
        self.schedule.step()
        self.num_steps += 1

        if self.num_steps % 10 == 0:
            # Identificar esquinas libres
            free_corners = [corner for corner in self.carSpawns if not any(
                isinstance(agent, Car) for agent in self.grid.get_cell_list_contents(corner))]

            if len(free_corners) == 0:
                print("No hay esquinas disponibles. La simulación se detiene.")
                self.running = False  # Detener la simulación
                return

            # Crear coches en las esquinas libres
            for corner in free_corners:
                destination = random.choice(self.destinations)
                pos = corner
                agent = Car(f"ca{self.num_cars+1000}", pos, destination, self)
                self.grid.place_agent(agent, pos)
                self.schedule.add(agent)
                self.num_cars += 1
