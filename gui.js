export function addListeners(vehicle) {
    const vehicleTab = document.getElementById('vehicle-tab');
    const worldTab = document.getElementById('world-tab');

    const vehicleProp = document.getElementById('vehicle-properties');
    const worldProp = document.getElementById('world-properties');

    const canvas = document.getElementById('demo-canvas');

    canvas.addEventListener('click', (e) => {
        vehicle.x = e.clientX;
        vehicle.y = e.clientY;
    })

    vehicleTab.addEventListener('click', () => {
        vehicleTab.classList.add('active-tab');
        worldTab.classList.remove('active-tab');
        vehicleProp.classList.add("active");
        worldProp.classList.remove("active");
    })
    worldTab.addEventListener('click', () => {
        worldTab.classList.add('active-tab');
        vehicleTab.classList.remove('active-tab');
        vehicleProp.classList.remove("active");
        worldProp.classList.add("active");
    })

    const vehiclePropForm = document.getElementById('vehicle-property-form');

    vehiclePropForm.addEventListener('submit', (e) => {
        e.preventDefault();
        
        const data = new FormData(vehiclePropForm);

        vehicle.m = data.get('mass');
        vehicle.engine_force_mag = data.get('engine-force');
        vehicle.brake_force_mag = data.get('brake-force');
        vehicle.battery.size = data.get('battery');
        vehicle.battery.batteryLeft = data.get('battery');
    })
}