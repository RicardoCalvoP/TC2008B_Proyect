"""
Ricardo Alfredo Calvo Perez - A01028889
18/11/2024

In this file we are going to find our agents used in our simulation
Used Agents:
  * Cars
  * Traffic light
  * Road
  * Building
"""

from mesa import Agent
import math


class Car(Agent):
    """
    Car Agent moves depending on the state on the road
    following the correct path to get to detination point

    Attribtues:
      * Unique ID
      * Follows the shortest or 'best' route to get to the destination
    """

    def __init__(self, unique_id, model, destination):
        super().__init__(unique_id, model)
        self.steps_taken = 0
        self.destination = destination
        self.path = []


class TrafficLight(Agent):
    """
    Traffic lights agents will change conditions within time
    from green to ambar, from ambar to red, from red to green
    """

    def __init__(self, unique_id, model):
        super().__init__(unique_id, model)
        self.condition = "Green"


class Road(Agent):
    """
    Road agent will have diferent conditions
    where it determine the direction of the road
    """

    def __init__(self, unique_id, model):
        super().__init__(unique_id, model)
        self.direction = ""

    def step(self):
        pass


class Building(Agent):
    def __init__(self, unique_id, model):
        super().__init__(unique_id, model)

    def step(self):
        pass
