![alt text](https://javier.rodriguez.org.mx/itesm/2014/tecnologico-de-monterrey-blue.png)

# Modelación de sistemas multiagentes con gráficas computacionales

## Simulación de tráfico en la ciudad

video: https://drive.google.com/file/d/1drVHBn1uXdWN_73PA8VqYiP-rUTR34Sl/view?usp=drive_link

---
***29/11/2024***

***Alumnos:***
 1. Ricardo Alfredo Calvo Perez - A01028889
 1.1 Andres Eduardo Gomes Brandt -  A0178131

***Profesores:***
  - Octavio Navarro Hinojosa
  - Gilberto Echeverría Furió

---

**Problema que se está resolviendo**

La movilidad urbana en México enfrenta desafíos significativos debido al incremento del uso de automóviles, lo que genera problemas como congestión vehicular, contaminación, accidentes y enfermedades relacionadas. Este problema impacta negativamente el desarrollo económico, la calidad de vida de los ciudadanos y el medio ambiente.

**Propuesta de solución:**

El proyecto consiste en desarrollar una simulación multiagentes para representar gráficamente el tráfico en una ciudad. El objetivo es simular el comportamiento de los vehículos en *mesa* que navegan hacia un destino específico mientras respetan las reglas del tránsito, evitan colisiones y minimizan la congestión vial. Para ello, los vehículos serán generados en las esquinas del mapa de un grid y se moverán hacia un destino asignado. Este destino será determinado cuando el agente del vehículo es creado, y se utilizará un grafo dirigido que contiene la ruta óptima para llegar al destino.

La navegación de los vehículos a través de la ciudad se logra mediante el uso de un algoritmo de búsqueda de caminos *A (A-Star)*, que calculará la ruta más corta desde el punto de inicio hasta el destino asignado a partir de las direcciones de los agentes de la calle. Además, cada vehículo podrá reconocer los agentes (otros coches y semáforos) en el siguiente paso del camino que está siguiendo. Esto permitirá al coche decidir si puede avanzar o si debe esperar. Si en la siguiente celda del camino hay otro coche o un semáforo en rojo, el vehículo debe esperar hasta que pueda continuar su recorrido.

En cuanto a la visualización, se utilizará WebGL, para representar gráficamente el mapa de la ciudad, los vehículos y los semáforos. Los vehículos se moverán a través del grid, siguiendo las rutas calculadas y la simulación actualizará la visualización en tiempo real, reflejando el movimiento de los coches y el cambio de los semáforos. La implementación del Phong hace tener este aspecto un poco más realista.


En resumen, esta simulación busca replicar de forma realista el comportamiento del tráfico en una ciudad mediante la representación gráfica de vehículos, semáforos y caminos.

---

## Diseño de los Agentes (**PEAS** Framework)

**Agente Coche**:
  - Propósito (Performance): El agente coche tiene como objetivo principal llegar a su destino desde una posición inicial, para lograrlo este debe evitar obstáculos como edificios y otros coches. Este debe de seguir un camino definido por las calles y respetar sus direcciones, aparte de obedecer las señales de tránsito como lo son los semáforos en rojo o verde.

  - Entorno (Environment): En el modelo nuestro coche se encuentran edificios los cuales se toman como obstaculos, calles con direcciones, otros coches, semaforos con estados de rojo y verde los cuales mantienen controlan si paran o no los coches, y nuestros destinos que harán que desaparezcan los coches una vez lleguen.

  - Actuadores (Actuators): No modifica a otros agentes sin embargo este decide hacia qué celda moverse siguiendo las reglas de tránsito y evitando conflictos, en caso de querer ir a una celda con otro coche, aplica su paciencia para decidir si espera o toma la celda.

  - Sensores (Sensors): Conoce la posición de las calles así como sus direcciones para calcular el camino que va a recorrer, toma decisiones de parar en casos como que el semáforo este en rojo, o si se encuetra otro coche en la casilla que seguía en su camino. En caso de querer ir a una casille el cual otro coche también quiere estar va a participar su paciencia, en caso de que su paciencia se agote esperando más steps de lo que vale su paciencia, este tomará la desición de tomar esa casilla para dejar correr el flujo.

Este agente es reactivo ya que responde de manera directa a los cambios en su entorno sin realizar un planeamiento anticipado. En lugar de contar con una planificación detallada a largo plazo, el agente toma decisiones conforme lleguen las situaciiones inmediatas. Por ejemplo, cuando un semáforo está en rojo, el coche detiene su movimiento y espera hasta que el semáforo se ponga en verde. Asimismo como si encuentra un obstáculo o si otro coche bloquea el camino

  ---

## Arquitectura de Subsunción

**Agente Coche**:

  Nada &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; $\rightarrow$ &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;Conducir&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; $\rightarrow$ Seguir el camino

  Aparece &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; $\rightarrow$ &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;No tiene camino determinado &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; $\rightarrow$ crea un camino

  Detecta un semáforo $\rightarrow$ &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;El semáforo está en rojo &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; $\rightarrow$ Pararse

  Detecta un coche &nbsp;&nbsp;&nbsp;&nbsp;&nbsp; $\rightarrow$ &nbsp;El coche esta en la posición siguiente &nbsp;&nbsp; $\rightarrow$ Pararse

  Esta en su destino &nbsp;&nbsp;&nbsp; $\rightarrow$ El coche esta en su posición de destino $\rightarrow$ Desaparecer

  ---

## Características del Ambiente


- Accesible: Nuestro ambiente es accesible porque los coches tienen acceso a toda la información necesaria, como las posiciones y direcciones de las calles, la ubicación de los edificios, el estado de los semáforos y la posición de los destinos.

- No Determinístico: El ambiente no es determinístico, ya que factores como el estado de los semáforos, la interacción con otros coches o el agotamiento de la paciencia de un coche afectan las decisiones y pueden modificar el camino tomado. Aunque el objetivo final (llegar al destino), el camino específico y los eventos intermedios no lo son.

- No Episódico: El estado actual (como la posición del coche, la paciencia, o el estado del semáforo) depende de los estados previos. Esto significa que hay una dependencia entre los pasos, lo cual lo clasifica como secuencial.

- Dinámico: El ambiente es dinámico porque cambia independientemente de las acciones de los coches. Por ejemplo, los semáforos cambian de estado sin intervención de los agentes, y los coches interactúan entre sí, modificando el ambiente.

- Discreto: El ambiente es discreto porque todas las variables se representan como valores discretos, como las posiciones en un grid, los movimientos en pasos definidos, el tiempo en unidades enteras y este terminará cuando no se puedan poner ni un solo coche en alguna esquina.

  ---

## Conclusiones

La simulación desarrollada demuestra que es posible implementar un sistema de movilidad eficiente utilizando un modelo multiagentes. En este escenario, los vehículos alcanzaron sus destinos respetando las reglas del tránsito y sin generar congestión vehicular, incluso cuando la cantidad de vehículos aumentaba gradualmente en el entorno y se mantiene un balance en donde no sobrepasan la cantidad de coches pues llegan a su destino a tiempo para mantener la armonia.

El diseño de los agentes, en particular el del coche, fue fundamental para lograr estos resultados. Gracias a que los coches siguen una ruta óptima generada desde su creación y poseen un conocimiento completo del mapa, los conductores se comportan de manera eficiente, siguiendo continuamente la ruta más dada en cada paso hacia su destino.

La ausencia de congestión en la simulación respalda la idea de que un enfoque basado en sistemas multiagentes puede ser una herramienta poderosa para planificar y simular estrategias de movilidad urbana. Sin embargo, es importante reconocer que este modelo no refleja fielmente el flujo del tránsito de una ciudad real aparte de que la anatonómia de la misma esta en buenas condiciones, con esto nos referimos a que no hay obstaculos a media calle como lo son los baches o basuras. El entorno en el que se desarrolla es controlado y idealizado: se asume que todos los coches evaden obstáculos, respetan las normas de tránsito y siempre toman la ruta más óptima para llegar a su destino. Aparte de que todos tienen el mismo reflejo de aceleración y frenado, y no hay variaciones de velocidad.

Por lo tanto, aunque la simulación es útil para el diseño de infraestructuras urbanas y la planificación de estrategias de movilidad, no debe tomarse como una representación exacta del tráfico real sino de lo que puede llegar a ser la movilidad em un escenario perfecto. Las situaciones de tráfico reales involucran una mayor complejidad, con incertidumbres y comportamientos impredecibles que deben ser modelados para obtener una visión más completa de los desafíos que enfrentan las ciudades.
