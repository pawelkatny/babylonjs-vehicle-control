const vars = {
    objectENUM: {
        'box': 1,
        'sphere': 2,
        'arc': 3, 
        'tetra': 4,
        'dode': 5,
        'ico': 6,
        'hexa': 7,
        'penta': 8,
        'elo': 9
    }
}

const keysArray = ['W', 'A', 'S', 'D', 'E'];


const setUpKeys = (keysArray) => {
    const parsedControls = ['UP', 'LEFT', 'DOWN', 'RIGHT', 'FIRE'];
    const keys = {};
    keysArray.forEach((ele, index) => {
        Object.defineProperty(keys, ele.charCodeAt(0), {
            value: parsedControls[index],
            enumerable: true
        })
    })
    return keys;
}   

const createKeysStatusObject = (keys) => {
    const keysStatus = {};
    const parsedControls = ['UP', 'LEFT', 'DOWN', 'RIGHT', 'FIRE'];
    // console.log(Object.values(keys))
    Object.values(keys).forEach((value, index) => {
        keysStatus[value] = false;
    })
    return keysStatus;
}

const keyStatus = (keys) => {
    const key = keys;
    let status = createKeysStatusObject(keys);

    return {
        keyPressed(e) {
            status[keys[e.keyCode]] = true;
        },

        keyReleased(e) {
            status[keys[e.keyCode]] = false;
        },
    }
}

const createCurvedLines = (vectors, scene, name, points = 20) => {
    const catmullRomSpline = BABYLON.Curve3.CreateCatmullRomSpline(vectors, points, false);
    const curvedLine = BABYLON.Mesh.CreateLines(name, catmullRomSpline.getPoints(), scene);
    curvedLine.color = new BABYLON.Color3(1, 0, 1);
    return catmullRomSpline;
}

const randomPointsGenerator = (points, groundWidth, groundHeight) => {
    const groundSectionSubdiv = Math.floor(groundHeight / points);
    let groundSectionBot = (-1 * groundHeight / 2) + 1,
        groundSectionTop = groundSectionBot + groundSectionSubdiv;
    const vectors = [new BABYLON.Vector3(0, 0, groundSectionBot)];
    for (let i = 0; i < points - 1; i++) {
        let z;
        let x = getRandomPoint(-1 * groundWidth / 2, groundWidth / 2);
        if (i === 0) {
            z = getRandomPoint(groundSectionBot + 150, groundSectionTop);
        } else {
            z = getRandomPoint(groundSectionBot + 50, groundSectionTop - 50);
        }

        let newRandomVector = new BABYLON.Vector3(x, 0, z);

        vectors.push(newRandomVector);
        groundSectionBot += groundSectionSubdiv;
        groundSectionTop += groundSectionSubdiv;
    }
    vectors.push(new BABYLON.Vector3(0, 0, groundHeight / 2));
    return vectors;
}

const createPath = (catmull, shiftedCatmull, scene) => {
    let mat = new BABYLON.StandardMaterial("mat1", scene);
    mat.alpha = 1.0;
    mat.diffuseColor = new BABYLON.Color3(0.5, 0.5, 1.0);
    mat.backFaceCulling = false;

    const ribbon = new BABYLON.MeshBuilder.CreateRibbon('ribbon', {
        pathArray: [catmull.getPoints(), shiftedCatmull.getPoints()]
    }, scene);
    ribbon.material = mat;
    ribbon.position.y = 0.1;

    return ribbon;
}

const createPaths = (number, scene, options) => {
    if (!options) {
        const options = {
            points: 20,
            groundWidth: 400,
            groundHeight: 2000,
            shift: 15,
            catmullPoints: 20
        }
    }
    const paths = [];
    for (let i = 0; i < number; i++) {
        let vectors = randomPointsGenerator(options.points, options.groundWidth, options.groundHeight);
        vectors.forEach((vector, index) => {
            let point = BABYLON.MeshBuilder.CreateBox('point_' + index, {
                size: 5
            }, scene);
            let material = new BABYLON.StandardMaterial('material_' + index, scene);

            material.diffuseColor = new BABYLON.Color3(1, 0, 0);
            point.material = material;
            point.position = vector;
        })
        let curvedLine1 = createCurvedLines(vectors, scene, 'catmul1', options.catmullPoints);
        let curvedLine2 = createCurvedLines(vectors, scene, 'catmul2', options.catmullPoints);
        shiftCatmull(curvedLine2, 10, scene);
        let pathOutline = createPath(curvedLine1, curvedLine2, scene);

        paths.push(pathOutline);
    }

    return paths;
}

const shiftCatmull = (catmull, shift) => {
    const catmullPoints = catmull.getPoints();
    let diffX, diffZ;
    for (let i = 0; i < catmullPoints.length; i++) {
        catmullPoints[i].x += shift;
        if (i > 0) {
            diffX = catmullPoints[i].x - catmullPoints[i - 1].x;
            diffZ = catmullPoints[i].z - catmullPoints[i - 1].z;

            if (diffX > 0 && diffZ < 0) {
                catmullPoints[i].z -= shift / 5;
            }
            if (diffX < 0 && diffZ < 0) {
                catmullPoints[i].z += shift / 5;
            }

            if (diffX > 0 && diffZ > 0) {
                catmullPoints[i].z -= shift / 5;
            }
            if (diffX < 0 && diffZ > 0) {
                catmullPoints[i].z += shift / 5;
            }
        }


    }
}

const shiftLine = (vectors, shift) => {
    const copyOfVectors = []

    for (let i = 0; i < vectors.length; i++) {
        let shiftedVector = new BABYLON.Vector3(
            vectors[i].x + shift,
            vectors[i].y,
            vectors[i].z
        );
        copyOfVectors.push(shiftedVector);
    }

    return copyOfVectors;
}

const getRandomPoint = (min, max) => {
    return Math.random() * (max - min) + min;
}

const createStaticObject = (type, size, position, id, scene) => {
    let object, material;
    switch (type) {
        case 'box':
            object = BABYLON.MeshBuilder.CreateBox(`${type}_${id}`, {size: size}, scene); 
            break;
        case 'sphere':
            object = BABYLON.MeshBuilder.CreateIcoSphere(`${type}_${id}`, {radius: size/1.5, subdivisions: 4}, scene);
            break;
        case 'arc':
            object = BABYLON.MeshBuilder.CreateSphere(`${type}_${id}`, {diameter: size, slice: 0.5}, scene);
            break;
        case 'tetra':
            object = BABYLON.MeshBuilder.CreatePolyhedron(`${type}_${id}`, {type: 0, size: size/1.5, }, scene);
            break;
        case 'dode':
            object = BABYLON.MeshBuilder.CreatePolyhedron(`${type}_${id}`, {type: 2, size: size/1.5, }, scene);
            break;
        case 'ico':
            object = BABYLON.MeshBuilder.CreatePolyhedron(`${type}_${id}`, {type: 3, size: size/1.5, }, scene);
            break;
        case 'hexa':
            object = BABYLON.MeshBuilder.CreatePolyhedron(`${type}_${id}`, {type: 7, size: size/1.5, }, scene);
            break;
        case 'penta':
            object = BABYLON.MeshBuilder.CreatePolyhedron(`${type}_${id}`, {type: 9, size: size/1.5, }, scene);
            break;
        case 'elo':
            object = BABYLON.MeshBuilder.CreatePolyhedron(`${type}_${id}`, {type: 14, size: size/1.5, }, scene);
            break;
    }
    object.position = position;
    material = new BABYLON.StandardMaterial(`${type}_${id}_material`, scene);
    material.diffuseColor = new BABYLON.Color3(1, 0, 0);
    object.material = material;
    return object;
}

const randBoolean = () => {
    const rand = Math.floor(getRandomPoint(0, 2));
    let bool;
    if (rand === 0) {
        bool = false;
    } else {
        bool = true;
    }
    return bool;
}

const generateRandChildObj = (object, scene) => {
    const qty = Math.floor(getRandomPoint(2, 4));
    const parentInfo = object.getBoundingInfo().boundingBox.vectorsWorld;
    const parentHeight = parentInfo[1].y - parentInfo[0].y;
    const parentPosition = object.position.clone();
    for (let i = 0; i < qty; i++) {
        const randType = Math.floor(getRandomPoint(1, 10))
        const randVector = new BABYLON.Vector3(getRandomPoint(10, 100), parentHeight + getRandomPoint(0, 100), getRandomPoint(10, 100));
        const type = Object.keys(vars.objectENUM).find(key => vars.objectENUM[key] === randType);
        const randChild = createStaticObject(type, parentHeight/10, new BABYLON.Vector3(0, 0, 0), i, scene);
        randChild.parent = object;
        randChild.position = randVector;
    }
}

const generateRandomBigObjects = (groundWidth, groundHeight, scene) => {
    const bigObjects = [];
    const randomPoints = randomPointsGenerator(4, groundWidth - 100, groundHeight- 500);
    randomPoints.forEach((point, index) => {
        const hasChildren = randBoolean(); 
        const rand = Math.floor(getRandomPoint(1, 10));
        const type = Object.keys(vars.objectENUM).find(key => vars.objectENUM[key] === rand)
        const randObject = createStaticObject(type, groundWidth/4, randomPoints[index], index, scene)
        hasChildren === true ? generateRandChildObj(randObject, scene) : '';
        bigObjects.push(randObject);
    })
}

const createVehicle = (scene) => {
    const vehicle = new BABYLON.MeshBuilder.CreateBox('vehicle', {
        height: 2,
        depth: 6,
        width: 6
    }, scene);
    const vehicleMaterial = new BABYLON.StandardMaterial('vehicleMaterial', scene);
    vehicleMaterial.diffuseColor = new BABYLON.Color3(0, 1, 0);
    vehicle.material = vehicleMaterial;
    vehicle.position = new BABYLON.Vector3(0, 0.1, -990);
}

const createUI = () => {
    const advancedTexture = BABYLON.GUI.AdvancedDynamicTexture.CreateFullscreenUI("myUI");
    return advancedTexture;
}

const createButton = (UI, changeVal) => {
    const button = BABYLON.GUI.Button.CreateSimpleButton('button', 'Show/hide ground');
    button.width = 0.1;
    button.height = '40px';
    button.background = 'white';
    button.horizontalAlignment = BABYLON.GUI.Control.HORIZONTAL_ALIGNMENT_RIGHT;
    button.left = '-50px';
    button.onPointerClickObservable.add(() => {
        changeVal.visible ? changeVal.setEnabled(false) : changeVal.setEnabled(true);
        changeVal.visible = !changeVal.visible;
    })
    UI.addControl(button);

}

const createGround = (width, height) => {
    const ground = new BABYLON.MeshBuilder.CreateGround('ground', {
        width: width,
        height: height
    });
    ground.visible = true;
    return ground;
}

const createScene = (engine, canvas) => {
    const scene = new BABYLON.Scene(engine);
    const camera = new BABYLON.ArcRotateCamera("camera", -Math.PI / 2, Math.PI / 2.5, 1000, new BABYLON.Vector3(0, 0, -500), scene);
    camera.attachControl(canvas, true);
    const light = new BABYLON.HemisphericLight("light", new BABYLON.Vector3(0, 1, 0), scene);
    const ground = createGround(400, 2000);
    const UI = createUI();
    const button = createButton(UI, ground);
    

    const paths = createPaths(2, scene, {
        points: 10,
        groundWidth: 400,
        groundHeight: 2000,
        shift: 10,
        catmullPoints: 100
    });
 
    generateRandomBigObjects(400, 2000, scene);
    const vehicle = createVehicle(scene);

    return scene;
}

const canvas = document.getElementById('renderCanvas');
const engine = new BABYLON.Engine(canvas, true);

const scene = createScene(engine, canvas);

const newKeys = setUpKeys(keysArray);
console.log(newKeys);
const keysStatus = keyStatus(newKeys);
console.log(keysStatus);
engine.runRenderLoop(() => {
    scene.render();
})

document.addEventListener('keydown', keysStatus.keyPressed);

document.addEventListener('keyup', keysStatus.keyReleased);