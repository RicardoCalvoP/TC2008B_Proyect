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

import heapq
from collections import deque


class Car(Agent):
    """
    Car Agent moves depending on the state on the road
    following the correct path to get to the destination.

    Attributes:
        - unique_id: Unique identifier for the agent.
        - position: Current position of the car.
        - destination: Target position.
        - streets: List of tuples representing the street connections.
        - model: Reference to the simulation model.
    """

    def __init__(self, unique_id, position, destination, streets, model):
        super().__init__(unique_id, model)
        self.steps_taken = 0
        self.path = []
        self.pos = position
        self.destination = destination
        self.streets = streets
        self.last_position = position

    def Move(self):
        """
        Moves the car based on the direction of the current road tile and traffic light state.
        """
       # Obtener el agente en la posición actual
        agents_in_cell = self.model.grid.get_cell_list_contents([self.pos])
        current_direction = None

        for agent in agents_in_cell:
            if isinstance(agent, Road) or isinstance(agent, Traffic_Light):
                current_direction = agent.direction
                break  # Encontramos la dirección, no necesitamos seguir buscando

        if current_direction is None:

            return  # No hacer nada si no hay dirección actual

        # Calcular la nueva posición según la dirección actual
        new_position = self.calculate_new_position(self.pos, current_direction)

        # Verificar si la nueva posición contiene un semáforo
        agents_in_new_cell = self.model.grid.get_cell_list_contents([
                                                                    new_position])
        for agent in agents_in_new_cell:
            if isinstance(agent, Traffic_Light):
                if not agent.condition:  # Semáforo en rojo
                    return  # Detener el movimiento

        # Verificar si la nueva celda está libre
        agents_in_cell = self.model.grid.get_cell_list_contents([new_position])
        if not any(isinstance(agent, Car) for agent in agents_in_cell):  # Celda libre

            self.model.grid.move_agent(self, new_position)

    def calculate_new_position(self, position, direction):
        """
        Calculate the new position based on the direction.
        """
        directions = {
            "Up": (0, 1),
            "Down": (0, -1),
            "Left": (-1, 0),
            "Right": (1, 0),
        }
        dx, dy = directions[direction]
        return (position[0] + dx, position[1] + dy)

    def get_neighbors_from_list(self, streets, current_node, _):
        """
        Encuentra todos los vecinos de un nodo en la lista de calles.
        """
        directions = {
            "Down": (0, -1),
            "Up": (0, 1),
            "Left": (-1, 0),
            "Right": (1, 0),
        }

        neighbors = []
        for node, direction in streets:
            if node == current_node:
                dx, dy = directions[direction]
                neighbor = (node[0] + dx, node[1] + dy)
                neighbors.append((neighbor, 1))  # Peso fijo
        return neighbors

    def get_path(self, streets, start, destination):
        """
        BFS para encontrar el camino más corto desde 'start' hasta la calle vecina al 'destination'.
        Args:
            streets (list): Lista de conexiones de calles.
            start (tuple): Nodo inicial (posición x, y).
            destination (tuple): Nodo destino (posición x, y).
        Returns:
            list: Camino más corto desde 'start' hasta 'destination'.
        """
        from collections import deque

        # Encuentra la calle vecina al destino
        directions = {
            "Down": (0, -1),
            "Up": (0, 1),
            "Left": (-1, 0),
            "Right": (1, 0),
        }

        # Generar vecinos del destino
        destination_neighbors = [
            (destination[0] + dx, destination[1] + dy)
            for dx, dy in directions.values()
        ]

        # Buscar la calle vecina que coincide
        neighboring_street = None
        for neighbor in destination_neighbors:
            if any(node == neighbor for node, _ in streets):
                neighboring_street = neighbor
                break

        if not neighboring_street:
            print(
                f"No se encontró una calle vecina para el destino {destination}.")
            return []

        print(f"Calle vecina al destino {destination}: {neighboring_street}")

        # Realizar BFS desde 'start' hasta 'neighboring_street'
        queue = deque([[start]])
        visited = set()
        visited.add(start)

        while queue:
            path = queue.popleft()
            current_pos = path[-1]

            if current_pos == neighboring_street:
                # Agregar el destino como paso final
                return path + [destination]

            # Obtener vecinos del nodo actual
            neighbors = self.get_neighbors_from_list(streets, current_pos, [])
            for neighbor, _ in neighbors:
                if neighbor not in visited:
                    visited.add(neighbor)
                    queue.append(path + [neighbor])

        print(
            f"No se encontró un camino desde {start} hasta {neighboring_street}.")
        return []

    def step(self):
        """
        Perform a single step in the simulation.
        """
        if self.pos == self.destination:
            # Remover agente al llegar al destino
            self.model.grid.remove_agent(self)

        if not self.path and self.pos != self.destination:
            self.path = self.get_path(self.streets, self.pos, self.destination)

        if self.pos != self.destination:
            self.Move()


class Traffic_Light(Agent):

    """
    Traffic lights agents will change conditions within time
    from green to red and from red to green
    """

    def __init__(self, unique_id,  condition, timeToChange, direction, model):
        super().__init__(unique_id, model)
        self.direction = direction
        self.condition = condition
        self.timeToChange = timeToChange

    def step(self,):
        """
        To change the state (green or red) of the traffic light in case you consider the time to change of each traffic light.
        """
        if self.model.schedule.steps % self.timeToChange == 0:
            self.condition = not self.condition


class Road(Agent):
    """
    Road agent. Determines where the cars can move, and in which direction.
    """

    def __init__(self, unique_id, direction, model):
        """
        Creates a new road.
        Args:
            unique_id: The agent's ID
            model: Model reference for the agent
            direction: Direction where the cars can move
        """
        super().__init__(unique_id, model)
        self.direction = direction

    def step(self):
        pass


class Obstacle(Agent):

    def __init__(self, unique_id, model):
        super().__init__(unique_id, model)

    def step(self):
        pass


class Destination(Agent):

    def __init__(self, unique_id, model):
        super().__init__(unique_id, model)

    def step(self):
        pass
