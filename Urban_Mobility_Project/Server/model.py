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
import json
class City(Model):
    """
    Creates a model with the agents
    [More description]
    """

    def __init__(self,  N):
        super().__init__(seed=42)  # Ask what seed=42 means
        self.running = True
        light_change = 7
        try:

            # Load the map dictionary. The dictionary maps the characters in the map file to the corresponding agent.
            dataDictionary = json.load(open("Test/mapDictionary.json"))

            self.traffic_lights = []

            # Load the map file. The map file is a text file where each character represents an agent.
            with open('2023_base.txt') as baseFile:
                lines = baseFile.readlines()
                self.width = len(lines[0])-1
                self.height = len(lines)

                self.grid = MultiGrid(self.width, self.height, torus = False) 
                self.schedule = RandomActivation(self)

                # Goes through each character in the map file and creates the corresponding agent.
                for r, row in enumerate(lines):
                    for c, col in enumerate(row):
                        if col in ["v", "^", ">", "<"]:
                            agent = Road(f"r_{r*self.width+c}", self, dataDictionary[col])
                            self.grid.place_agent(agent, (c, self.height - r - 1))

                        elif col in ["S", "s"]:
                            agent = Traffic_Light(f"tl_{r*self.width+c}", self, False if col == "S" else True, int(dataDictionary[col]))
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
    
    def create_adjacency_matrix(self, moore=False):
        width, height = self.grid.width, self.grid.height
        total_nodes = width * height
        
        # Inicializar matriz de adyacencia
        adjacency_matrix = np.zeros((total_nodes, total_nodes), dtype=int)
        
        for cell_pos in self.grid.coord_iter():
            cell_content, x, y = cell_pos
            
            # Convertir coordenadas de la celda a índice único
            current_index = y * width + x
            
            # Obtener las celdas vecinas
            neighbors = self.grid.get_neighbors((x, y), moore=moore, include_center=False)
            
            for neighbor in neighbors:
                neighbor_pos = self.grid.find_cell(neighbor)
                if neighbor_pos:
                    # Convertir coordenadas del vecino a índice único
                    neighbor_index = neighbor_pos[1] * width + neighbor_pos[0]
                    adjacency_matrix[current_index, neighbor_index] = 1
        
        return adjacency_matrix
    def DFS(self):
         pass
         
    def step(self):
        '''Advance the model by one step.'''
        self.schedule.step()
