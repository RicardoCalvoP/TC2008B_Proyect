"""
Ricardo Alfredo Calvo Perez - A01028889
Andrés Eduardo Gomes Brandt - A01781321
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
from model import City

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
    def Move(self):
        Next = [pos for pos in self.model.grid.get_cell_list_contents([self.pos]) if ]
            self.pos = self.path[self.steps_taken + 1]
            self.steps_taken += 1
            
class Traffic_Light(Agent):
    """
    Traffic lights agents will change conditions within time
    from green to red and from red to green
    """
    def __init__(self, unique_id, model, state, timeToChange):
        super().__init__(unique_id, model)
        """ 
        The lights and their colours are defined in a dictionary, where 
        """
        self.lights = {True : "Green", False : "Red"}
        self.state = self.lights[state]
        self.timeToChange = timeToChange

    def step(self,):
        """ 
        To change the state (green or red) of the traffic light in case you consider the time to change of each traffic light.
        """
        if self.model.schedule.steps % self.timeToChange == 0:
            self.state = not self.lights[self.state]
class TrafficLight(Agent):


    def __init__(self, unique_id, model):
        super().__init__(unique_id, model)
        self.condition = "Green"
        not self.condition = "Red"
    def change_light(self):
        self.condition = not self.condition 


class Road(Agent):
    """
    Road agent. Determines where the cars can move, and in which direction.
    """
    def __init__(self, unique_id, model, direction= "Left"):
        """
        Creates a new road.
        Args:
            unique_id: The agent's ID
            model: Model reference for the agent
            direction: Direction where the cars can move
        """
        super().__init__(unique_id, model)
        self.direction = direction

        


class Building(Agent):
    def __init__(self, unique_id, model):
        super().__init__(unique_id, model)

    def step(self):
        pass
