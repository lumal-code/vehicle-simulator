const keyDown = new Set();

export function initInput() {
    window.addEventListener('keydown', addKey);
    window.addEventListener('keyup', removeKey);
}

function addKey(e) {
    keyDown.add(e.key);
}

function removeKey(e) {
    keyDown.delete(e.key);
}

export function isKeyDown(key) {
    return keyDown.has(key);
}