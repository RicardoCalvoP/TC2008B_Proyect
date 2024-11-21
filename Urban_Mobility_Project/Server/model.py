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

    def __init__(self, num_cars, width, height):
        super().__init__(seed=42)  # Ask what seed=42 means
        self.num_cars = num_cars  # With how many cars are we going to start the simulation
        # Ask if is better multigrid
        self.grid = MultiGrid()
        self.schedule = RandomActivation(self)
        self.running = True

    def step(self):
        '''Advance the model by one step.'''
        self.schedule.step()
