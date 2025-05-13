# A Simple Vehicle Simulator

This is a working project designed to teach myself both car physics and JavaScript. I have attempted to model all forces realistically and allowed the car to move as physics would have it in real life.

The forces are modeled as 2D vectors, with an x and y componenent.

Here are all the forces currently modeled:
* Air Drag
* Rolling Resistance
* Lateral Friction (to keep the car generally moving straight)

As of current (May 12, 2025), the engine is a simple on or off switch that will output 12000N of force. Similarly, the brakes are the same outputting 12000N of force when active.

The terrain is modeled by a Perlin Noise graph with 4 octaves.

Visually, the website uses WebGL and shaders to draw all of the components. The gray lines represent altitude lines and darker color is lower elevation as well.

What I want to add:
* Gravity (obviously)
* Real turning logic (the car whips around at low speeds)
* Proper engine gearing and accurate force output using that
* Actual tire physics using Pacejka's magic formula

End goal additions:
* Placement of buildings or cliffs, generally just obstacles
* 3D models
* Allow the input of a real map to traverse along
* Dynamic, easily accessible tuning of the vehicle's properties
* A steering wheel to better fine-tune control
* Stretch: Allow scripts of some sort to program the car to drive a certain way
